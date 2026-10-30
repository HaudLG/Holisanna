// Holisanna — ouvre le portail Stripe (changer de carte, factures, résiliation) pour un praticien abonné.
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
function uidOf(req: Request): string | null {
  const t = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '').split('.')[1];
  if (!t) return null;
  try { return JSON.parse(atob(t.replace(/-/g, '+').replace(/_/g, '/'))).sub ?? null; } catch { return null; }
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
  try {
    if (!SK) return json({ error: 'Paiement non configuré.' }, 503, origin);
    const uid = uidOf(req);
    if (!uid) return json({ error: 'Connectez-vous pour continuer.' }, 401, origin);
    const r = await fetch(`${SB}/rest/v1/abonnements?praticien_id=eq.${uid}&select=stripe_customer_id`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
    const rows = await r.json();
    const customer = rows?.[0]?.stripe_customer_id;
    if (!customer) return json({ error: 'Aucun abonnement à gérer pour le moment.' }, 400, origin);
    const site = origin && ORIGIN_OK.test(origin) ? origin : DEFAULT_SITE;
    const s = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${SK}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ customer, return_url: `${site}/pro-abonnement.html` }).toString(),
    });
    const j = await s.json();
    if (!s.ok) { console.error('portal', j?.error?.message); return json({ error: 'Le portail n’est pas disponible pour le moment.' }, 500, origin); }
    return json({ url: j.url }, 200, origin);
  } catch (e) {
    console.error('portal', e instanceof Error ? e.message : e);
    return json({ error: 'Le portail n’est pas disponible pour le moment.' }, 500, origin);
  }
});
