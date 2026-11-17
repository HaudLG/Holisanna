// Efface du stockage les photos des comptes déjà purgés (utilisateurs.deleted_at renseigné).
// Aucun paramètre n'est lu dans la requête : la fonction ne peut supprimer que les fichiers de comptes déjà effacés,
// elle peut donc être appelée sans jeton (planifiée chaque nuit par pg_cron, après purger_comptes_supprimes).
import { createClient } from 'jsr:@supabase/supabase-js@2';

const BUCKET = 'photos';

Deno.serve(async () => {
  const url = Deno.env.get('SUPABASE_URL')!;
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const sb = createClient(url, key, { auth: { persistSession: false } });

  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
  const { data: users, error } = await sb.from('utilisateurs').select('id').not('deleted_at', 'is', null).gte('deleted_at', since);
  if (error) return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });

  let removed = 0;
  for (const u of users ?? []) {
    // le dossier d'un compte contient ses fichiers à plat (cabinet-….jpg, profil-….jpg) ; on pagine par sécurité
    for (let guard = 0; guard < 20; guard++) {
      const { data: files, error: e2 } = await sb.storage.from(BUCKET).list(u.id, { limit: 100 });
      if (e2 || !files || files.length === 0) break;
      const paths = files.filter((f) => f.id).map((f) => `${u.id}/${f.name}`);
      if (paths.length === 0) break;
      const { error: e3 } = await sb.storage.from(BUCKET).remove(paths);
      if (e3) break;
      removed += paths.length;
    }
  }
  return new Response(JSON.stringify({ ok: true, comptes: users?.length ?? 0, fichiers_supprimes: removed }), { headers: { 'Content-Type': 'application/json' } });
});
