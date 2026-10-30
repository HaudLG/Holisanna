// Holisanna — crée une page de paiement Stripe (Checkout) pour l'abonnement d'un praticien.
// Appelée par le site avec le jeton de connexion du praticien (verify_jwt = true).
const PRICES: Record<string, string> = {
  'continu:mensuel': 'price_1UWBG00Gan10gAv4q1JTCflv',
  'continu:annuel': 'price_1UWBVB0Gan10gAv4ypz9Tima',
  'libre:mensuel': 'price_1UWBYf0Gan10gAv4JuiaZ336',
};
const SB = Deno.env.get('SUPABASE_URL')!;
const KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SK = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
const DEFAULT_SITE = Deno.env.get('SITE_URL') ?? 'https://holisanna.vercel.app';
const ORIGIN_OK = /^https:\/\/(holisanna[a-z0-9-]*\.vercel\.app|(www\.)?holisanna\.(fr|com|eu))$/;

const cors = (origin: string | null) => ({
  'Access-Control-Allow-Origin': origin ?? '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin',
});
const json = (o: unknown, status: number, origin: string | null) =>
  new Response(JSON.stringify(o), { status, headers: { ...cors(origin), 'Content-Type': 'application/json' } });

function jwtClaims(req: Request): Record<string, any> | null {
  const h = req.headers.get('authorization') ?? '';
  const t = h.replace(/^Bearer\s+/i, '').split('.')[1];
  if (!t) return null;
  try { return JSON.parse(atob(t.replace(/-/g, '+').replace(/_/g, '/'))); } catch { return null; }
}
async function rest(path: string, init: RequestInit = {}) {
  const r = await fetch(`${SB}/rest/v1/${path}`, { ...init, headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation', ...(init.headers ?? {}) } });
  if (!r.ok) throw new Error('db ' + r.status);
  return r.json();
}
async function stripe(path: string, params: Record<string, string>) {
  const r = await fetch('https://api.stripe.com/v1/' + path, {
    method: 'POST',
    headers: { Authorization: `Bearer ${SK}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params).toString(),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j?.error?.message ?? 'stripe ' + r.status);
  return j;
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
  try {
    if (!SK) return json({ error: 'Paiement non configuré.' }, 503, origin);
    const claims = jwtClaims(req);
    const uid = claims?.sub as string | undefined;
    if (!uid) return json({ error: 'Connectez-vous pour continuer.' }, 401, origin);
    const body = await req.json().catch(() => ({}));
    const formule = String(body.formule ?? ''), facturation = String(body.facturation ?? 'mensuel');
    const price = PRICES[`${formule}:${facturation}`];
    if (!price) return json({ error: 'Cette formule n’existe pas.' }, 400, origin);

    const users = await rest(`utilisateurs?id=eq.${uid}&select=role,nom_complet`);
    if (!users[0] || users[0].role !== 'praticien') return json({ error: 'Réservé aux praticiens.' }, 403, origin);
    const abos = await rest(`abonnements?praticien_id=eq.${uid}&select=*`);
    const abo = abos[0];
    if (!abo) return json({ error: 'Abonnement introuvable.' }, 404, origin);
    if (abo.statut === 'avant_essai') return json({ error: 'Votre mois d’essai démarre à la publication de votre fiche. Vous pourrez ensuite activer votre formule.' }, 400, origin);
    if (abo.statut === 'actif' || abo.statut === 'impaye' || (abo.stripe_subscription_id && abo.statut === 'essai')) {
      return json({ error: 'Vous avez déjà un abonnement : utilisez « Gérer mon abonnement ».' }, 400, origin);
    }

    let customer: string = abo.stripe_customer_id ?? '';
    if (!customer) {
      const c = await stripe('customers', {
        ...(claims?.email ? { email: String(claims.email) } : {}),
        name: users[0].nom_complet ?? '',
        'metadata[praticien_id]': uid,
      });
      customer = c.id;
      await rest(`abonnements?praticien_id=eq.${uid}`, { method: 'PATCH', body: JSON.stringify({ stripe_customer_id: customer }) });
    }

    const site = origin && ORIGIN_OK.test(origin) ? origin : DEFAULT_SITE;
    const params: Record<string, string> = {
      mode: 'subscription',
      customer,
      'line_items[0][price]': price,
      'line_items[0][quantity]': '1',
      success_url: `${site}/pro-abonnement.html?paiement=ok`,
      cancel_url: `${site}/pro-abonnement.html?paiement=annule`,
      locale: 'fr',
      billing_address_collection: 'auto',
      client_reference_id: uid,
      'subscription_data[metadata][praticien_id]': uid,
      'subscription_data[metadata][formule]': formule,
      'subscription_data[metadata][facturation]': facturation,
    };
    // Le mois d'essai gratuit court jusqu'à essai_fin : la facturation démarre ce jour-là (date anniversaire).
    if (abo.statut === 'essai' && abo.essai_fin) {
      const end = Math.floor(new Date(abo.essai_fin).getTime() / 1000);
      if (end > Math.floor(Date.now() / 1000) + 49 * 3600) params['subscription_data[trial_end]'] = String(end);
    }
    const s = await stripe('checkout/sessions', params);
    return json({ url: s.url }, 200, origin);
  } catch (e) {
    console.error('checkout', e instanceof Error ? e.message : e);
    return json({ error: 'Le paiement n’est pas disponible pour le moment. Réessayez dans un instant.' }, 500, origin);
  }
});
