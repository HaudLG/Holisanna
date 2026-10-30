// Holisanna — reçoit les événements de Stripe et met à jour l'abonnement du praticien.
// Pas de jeton de connexion ici (verify_jwt = false) : l'authenticité vient de la signature Stripe.
const PRICES: Record<string, string> = {
  'price_1UWBG00Gan10gAv4q1JTCflv': 'continu:mensuel',
  'price_1UWBVB0Gan10gAv4ypz9Tima': 'continu:annuel',
  'price_1UWBYf0Gan10gAv4JuiaZ336': 'libre:mensuel',
};
const SB = Deno.env.get('SUPABASE_URL')!;
const KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SK = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
const WH = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';
const enc = new TextEncoder();

export async function verify(raw: string, header: string | null, secret: string, now = Date.now()): Promise<boolean> {
  if (!header || !secret) return false;
  let t = ''; const v1: string[] = [];
  for (const p of header.split(',')) { const [k, v] = p.split('='); if (k === 't') t = v; else if (k === 'v1') v1.push(v); }
  if (!t || !v1.length || Math.abs(now / 1000 - Number(t)) > 300) return false;
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(`${t}.${raw}`)));
  const hex = Array.from(mac).map((b) => b.toString(16).padStart(2, '0')).join('');
  return v1.some((s) => s.length === hex.length && [...s].reduce((d, c, i) => d | (c.charCodeAt(0) ^ hex.charCodeAt(i)), 0) === 0);
}

async function rest(path: string, init: RequestInit = {}) {
  const r = await fetch(`${SB}/rest/v1/${path}`, { ...init, headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation', ...(init.headers ?? {}) } });
  if (!r.ok) throw new Error('db ' + r.status + ' ' + (await r.text()));
  return r.json();
}
const iso = (s?: number | null) => (s ? new Date(s * 1000).toISOString() : null);

async function notify(uid: string, titre: string, texte: string) {
  await rest('notifications', { method: 'POST', body: JSON.stringify({ destinataire_id: uid, type: 'fact', titre, texte, lien: 'pro-abonnement.html' }) });
}

export async function apply(sub: any) {
  const customer = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id;
  let uid: string | undefined = sub.metadata?.praticien_id;
  if (!uid && customer) uid = (await rest(`abonnements?stripe_customer_id=eq.${customer}&select=praticien_id`))[0]?.praticien_id;
  if (!uid) { console.error('webhook: praticien introuvable pour', sub.id); return; }
  const cur = (await rest(`abonnements?praticien_id=eq.${uid}&select=*`))[0];
  if (!cur) return;
  const item = sub.items?.data?.[0];
  const [formule, facturation] = (PRICES[item?.price?.id] ?? '').split(':');
  const periodEnd = sub.current_period_end ?? item?.current_period_end;
  const patch: Record<string, unknown> = {
    stripe_customer_id: customer ?? cur.stripe_customer_id,
    stripe_subscription_id: sub.id,
    annule_fin_periode: !!(sub.cancel_at_period_end || sub.cancel_at),
    periode_fin: iso(periodEnd) ?? cur.periode_fin,
  };
  if (formule) { patch.formule_choisie = formule; patch.facturation = facturation; }
  let note: [string, string] | null = null;
  const names: Record<string, string> = { continu: 'Fil Continu', libre: 'Fil Libre' };

  switch (sub.status) {
    case 'trialing':
      break; // l'essai gratuit se poursuit : la fiche reste en ligne
    case 'active':
      patch.statut = 'actif';
      patch.actif_depuis = cur.actif_depuis ?? new Date().toISOString();
      if (cur.statut !== 'actif') note = ['Abonnement activé', `Votre formule ${names[formule] ?? ''} est active. Merci de votre confiance.`];
      break;
    case 'past_due':
    case 'unpaid':
      patch.statut = 'impaye';
      if (cur.statut !== 'impaye') note = ['Paiement à régulariser', 'Le dernier prélèvement a échoué. Mettez à jour votre carte dans « Abonnement & factures » pour garder votre fiche en ligne.'];
      break;
    case 'canceled':
    case 'incomplete_expired': {
      const inTrial = cur.statut === 'essai' && cur.essai_fin && new Date(cur.essai_fin).getTime() > Date.now();
      if (inTrial) { patch.stripe_subscription_id = null; patch.annule_fin_periode = false; patch.periode_fin = null; }
      else {
        patch.statut = 'expire';
        await rest(`profils_praticien?utilisateur_id=eq.${uid}&statut_publication=eq.en_ligne`, { method: 'PATCH', body: JSON.stringify({ statut_publication: 'depublie' }) });
        note = ['Abonnement terminé', 'Votre abonnement est terminé : votre fiche est hors ligne. Vous pouvez en choisir un nouveau à tout moment.'];
      }
      break;
    }
    default:
      console.log('webhook: statut ignoré', sub.status, sub.id);
      return; // incomplete, paused… : rien à faire
  }
  await rest(`abonnements?praticien_id=eq.${uid}`, { method: 'PATCH', body: JSON.stringify(patch) });
  if (note) await notify(uid, note[0], note[1]);
}

export async function handle(raw: string, header: string | null) {
  if (!(await verify(raw, header, WH))) return new Response('signature invalide', { status: 400 });
  const ev = JSON.parse(raw);
  console.log('webhook: reçu', ev.type, ev.data?.object?.status ?? '');
  try {
    if (ev.type === 'checkout.session.completed' && ev.data.object.mode === 'subscription' && ev.data.object.subscription) {
      const r = await fetch('https://api.stripe.com/v1/subscriptions/' + ev.data.object.subscription, { headers: { Authorization: `Bearer ${SK}` } });
      if (!r.ok) throw new Error('stripe ' + r.status);
      await apply(await r.json());
    } else if (ev.type === 'customer.subscription.created' || ev.type === 'customer.subscription.updated' || ev.type === 'customer.subscription.deleted') {
      await apply(ev.data.object);
    }
    return new Response('ok', { status: 200 });
  } catch (e) {
    console.error('webhook', ev.type, e instanceof Error ? e.message : e);
    return new Response('erreur', { status: 500 }); // Stripe réessaiera
  }
}

if (typeof Deno !== 'undefined' && (Deno as any).serve && !(globalThis as any).__TEST__) {
  Deno.serve(async (req: Request) => (req.method === 'POST' ? handle(await req.text(), req.headers.get('stripe-signature')) : new Response('ok', { status: 200 })));
}
