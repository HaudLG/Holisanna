// Holisanna — suppression de compte avec délai de réflexion de 14 jours.
// demander : désactive le compte (base) puis, pour un praticien abonné, résilie l'abonnement Stripe à la fin de la période.
// annuler  : appelée à la reconnexion pendant le délai ; reprend l'abonnement si c'est la suppression qui l'avait résilié.
const SB = Deno.env.get('SUPABASE_URL')!;
const ANON = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SK = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
const ORIGIN_OK = /^https:\/\/(holisanna[a-z0-9-]*\.vercel\.app|(www\.)?holisanna\.(fr|com|eu))$/;

const cors = (origin: string | null) => ({
  'Access-Control-Allow-Origin': origin && ORIGIN_OK.test(origin) ? origin : '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin',
});
const json = (o: unknown, status: number, origin: string | null) =>
  new Response(JSON.stringify(o), { status, headers: { ...cors(origin), 'Content-Type': 'application/json' } });

async function rpc(name: string, auth: string) {
  const r = await fetch(`${SB}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: { apikey: ANON, Authorization: auth, 'Content-Type': 'application/json' },
    body: '{}',
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.message ?? 'rpc');
  return j;
}
async function stripeCancel(sub: string, atEnd: boolean) {
  if (!SK || !sub) return;
  const r = await fetch(`https://api.stripe.com/v1/subscriptions/${encodeURIComponent(sub)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${SK}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ cancel_at_period_end: String(atEnd) }).toString(),
  });
  if (!r.ok) console.error('compte-suppression stripe', r.status, (await r.text()).slice(0, 200));
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
  try {
    const auth = req.headers.get('authorization') ?? '';
    if (!auth) return json({ error: 'Connectez-vous pour continuer.' }, 401, origin);
    const { action } = await req.json().catch(() => ({}));
    if (action === 'demander') {
      const r = await rpc('demander_suppression_compte', auth);
      if (r.resilier && r.stripe_subscription_id) await stripeCancel(r.stripe_subscription_id, true);
      return json({ ok: true, date: r.date, deja: !!r.deja }, 200, origin);
    }
    if (action === 'annuler') {
      const r = await rpc('annuler_suppression_compte', auth);
      if (r.annulee && r.reprendre && r.stripe_subscription_id) await stripeCancel(r.stripe_subscription_id, false);
      return json({ ok: true, annulee: !!r.annulee }, 200, origin);
    }
    return json({ error: 'Action inconnue.' }, 400, origin);
  } catch (e) {
    console.error('compte-suppression', e instanceof Error ? e.message : e);
    return json({ error: 'Opération impossible pour le moment. Réessayez dans un instant.' }, 500, origin);
  }
});
