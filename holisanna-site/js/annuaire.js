/* Holisanna — annuaire des praticiens (lecture publique dans Supabase).
   Fournit à la recherche et à la fiche publique des praticiens « normalisés » :
   uniquement les fiches en ligne (sauf la sienne, que le praticien peut prévisualiser).
   Les créneaux sont lus en heure de Paris. */
(function () {
  'use strict';
  var TZ = 'Europe/Paris';
  var DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  var MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  var MODE_LBL = { cabinet: 'Cabinet', visio: 'Visio', domicile: 'Domicile' };
  var MODE_LONG = { cabinet: 'au cabinet', visio: 'en visio', domicile: 'à domicile' };
  var LANG_LBL = { fr: 'Français', en: 'Anglais', es: 'Espagnol', de: 'Allemand', it: 'Italien', lsf: 'LSF' };

  function sb() { return window.HOL_SB && window.HOL_SB.client; }
  function parts(ms) {
    var o = {}; new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
      .formatToParts(new Date(ms)).forEach(function (p) { o[p.type] = p.value; });
    return o;
  }
  function fromIso(iso) { var p = parts(new Date(iso).getTime()); return { day: p.year + '-' + p.month + '-' + p.day, hm: p.hour + ':' + p.minute }; }
  function todayYmd() { var p = parts(Date.now()); return p.year + '-' + p.month + '-' + p.day; }
  function dayIndex(day) { return Math.round((Date.parse(day + 'T12:00:00Z') - Date.parse(todayYmd() + 'T12:00:00Z')) / 86400000); }
  function dayLabel(day) { var d = new Date(day + 'T12:00:00Z'); return DAYS[(d.getUTCDay() + 6) % 7] + ' ' + d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()]; }

  var PHOTO_BASE = 'https://xvromzlzceqnhalyurcv.supabase.co/storage/v1/object/public/photos/';
  /* Un chemin de photo n'est accepté que s'il a la forme attendue (<uuid>/<emplacement>-<horodatage>.jpg) */
  function photoUrl(path) { return typeof path === 'string' && /^[0-9a-f-]{36}\/(principale|cabinet|seance)-\d+\.jpg$/.test(path) ? PHOTO_BASE + path : ''; }

  var PILLAR_LABEL = { corps: 'Corps', ame: 'Âme', esprit: 'Esprit' };

  /* Fabrique le praticien « normalisé » à partir des lignes de la base */
  function build(row, disc, offers, slots, avis) {
    var d = disc.byId[row.discipline_principale_id] || null;
    var pillar = (d && d.pilier) || 'corps';
    var modes = row.modes_seance || [];
    var prix = offers.map(function (o) { return o.prix_euros; });
    var first = offers[0];
    var text = (row.presentation || '').trim();
    var mine = slots.map(function (s) { var p = fromIso(s.debut); return { id: s.id, day: p.day, hm: p.hm, di: dayIndex(p.day) }; }).filter(function (s) { return s.di >= 0; });
    var langs = (row.langues || []).map(function (l) { return LANG_LBL[l]; }).filter(Boolean);
    var r = {
      real: true, id: row.slug, uid: row.utilisateur_id, name: row.nom_affiche || 'Praticien',
      discipline: d ? d.nom : '', pillar: pillar, pillarLabel: PILLAR_LABEL[pillar],
      comp: (row.disciplines_complementaires || []).map(function (i) { return disc.byId[i] && disc.byId[i].nom; }).filter(Boolean),
      place: row.ville || '', ville: row.ville || '', cp: row.code_postal || '', adresse: row.adresse || '',
      price: prix.length ? Math.min.apply(null, prix) : null,
      duration: first ? first.duree_minutes + ' min · ' + MODE_LONG[first.mode] : '',
      rating: avis.length ? Math.round(avis.reduce(function (t, a) { return t + a.note; }, 0) / avis.length * 10) / 10 : null, reviews: avis.length, founder: false,
      reviewList: avis.map(function (a) { return { stars: '★★★★★'.slice(0, a.note) + '☆☆☆☆☆'.slice(0, 5 - a.note), text: a.commentaire, author: a.auteur_nom + (a.discipline_nom ? ' · ' + a.discipline_nom : ''), reponse: a.reponse || '' }; }),
      format: modes.length === 1 && modes[0] === 'visio' ? 'visio' : 'cabinet',
      teaser: text.length > 150 ? text.slice(0, 147).replace(/\s+\S*$/, '') + '…' : text,
      bio: text, parcours: (row.parcours || '').trim(),
      offers: offers.map(function (o) { return { id: o.id, name: o.nom, detail: o.duree_minutes + ' min · ' + MODE_LONG[o.mode], price: o.prix_euros + ' €', prix: o.prix_euros, duree: o.duree_minutes, mode: o.mode }; }),
      modes: modes.map(function (m) { return MODE_LBL[m]; }),
      langs: langs.length ? langs : ['Français'],
      site: row.site_web || '', insta: (row.instagram || '').replace(/^@/, ''),
      photo: photoUrl((row.photos || {}).principale),
      gallery: [['cabinet', 'Le cabinet'], ['seance', 'En séance']].map(function (k) { return { url: photoUrl((row.photos || {})[k[0]]), label: k[1] }; }).filter(function (g) { return g.url; }),
      published: row.statut_publication === 'en_ligne', slots: mine
    };
    var f = mine[0];
    r.meta = { dayIdx: f ? f.di : -1, day: f ? dayLabel(f.day) : null, first: f ? f.hm : null, firstDay: f ? f.day : null, modes: r.modes, langs: r.langs };
    return r;
  }

  var COLS = 'utilisateur_id,slug,nom_affiche,discipline_principale_id,disciplines_complementaires,presentation,parcours,adresse,ville,code_postal,langues,modes_seance,site_web,instagram,statut_publication,photos';

  function fetchAll(rows) {
    var c = sb(), ids = rows.map(function (r) { return r.utilisateur_id; });
    if (!ids.length) return Promise.resolve([]);
    return Promise.all([
      c.from('disciplines').select('id,nom,pilier'),
      c.from('prestations').select('id,praticien_id,nom,duree_minutes,prix_euros,mode,masquee,ordre,cree_le').in('praticien_id', ids).eq('masquee', false).is('deleted_at', null).order('ordre').order('cree_le'),
      c.from('creneaux').select('id,praticien_id,debut').in('praticien_id', ids).eq('statut', 'libre').gt('debut', new Date().toISOString()).order('debut').limit(2000),
      c.from('avis').select('praticien_id,note,commentaire,auteur_nom,discipline_nom,reponse,cree_le').in('praticien_id', ids).is('deleted_at', null).order('cree_le', { ascending: false }).limit(2000)
    ]).then(function (rs) {
      rs.slice(0, 3).forEach(function (r) { if (r.error) throw r.error; });
      var disc = { byId: {} }; rs[0].data.forEach(function (x) { disc.byId[x.id] = x; });
      return rows.map(function (row) {
        return build(row, disc,
          rs[1].data.filter(function (o) { return o.praticien_id === row.utilisateur_id; }),
          rs[2].data.filter(function (s) { return s.praticien_id === row.utilisateur_id; }),
          (rs[3].data || []).filter(function (a) { return a.praticien_id === row.utilisateur_id; }));
      });
    });
  }

  /* Favoris de l'explorateur connecté (table `favoris`). Le cœur est un bouton [data-fav=<uid praticien>]. */
  var favSet = new Set(), favLoaded = false;
  var HEART = '<svg width="18" height="18" viewBox="0 0 24 24" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M12 20.5S3.5 15 3.5 9.2A4.7 4.7 0 0 1 12 6.6a4.7 4.7 0 0 1 8.5 2.6c0 5.8-8.5 11.3-8.5 11.3z"/></svg>';
  function isExplorer() { var s = window.HOL && HOL.Session && HOL.Session.get(); return !!(s && s.loggedIn && s.role !== 'praticien'); }
  window.HOL_FAV = {
    has: function (uid) { return favSet.has(uid); },
    ids: function () { return Array.from(favSet); },
    btn: function (uid) {
      var on = favSet.has(uid);
      return '<button type="button" class="favbtn' + (on ? ' is-on' : '') + '" data-fav="' + uid + '" aria-pressed="' + on + '" aria-label="' + (on ? 'Retirer des favoris' : 'Ajouter aux favoris') + '" title="' + (on ? 'Retirer des favoris' : 'Ajouter aux favoris') + '">' + HEART + '</button>';
    },
    paint: function (root) {
      (root || document).querySelectorAll('[data-fav]').forEach(function (b) {
        var on = favSet.has(b.dataset.fav); b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on));
        b.setAttribute('aria-label', on ? 'Retirer des favoris' : 'Ajouter aux favoris'); b.title = b.getAttribute('aria-label');
      });
    },
    load: function () {
      var c = sb(); if (!isExplorer() || !c) { favLoaded = true; return Promise.resolve(); }
      return c.from('favoris').select('praticien_id').then(function (r) {
        if (!r.error) { favSet = new Set((r.data || []).map(function (x) { return x.praticien_id; })); } favLoaded = true;
      }).catch(function () { favLoaded = true; });
    },
    /* Clic sur un cœur : renvoie true si le clic a été traité */
    click: function (e, root) {
      var b = e.target.closest('[data-fav]'); if (!b) return false;
      e.preventDefault(); e.stopPropagation();
      var s = HOL.Session.get(), uid = b.dataset.fav, c = sb();
      if (!s.loggedIn) { HOL.flash('Connectez-vous avec un compte explorateur pour ajouter ce praticien à vos favoris.'); location.href = 'connexion.html?next=' + encodeURIComponent(location.pathname.split('/').pop() + location.search); return true; }
      if (s.role === 'praticien') { HOL.toast('Les favoris sont réservés aux comptes explorateur.'); return true; }
      var was = favSet.has(uid);
      if (was) favSet.delete(uid); else favSet.add(uid);
      HOL_FAV.paint(root);
      c.auth.getUser().then(function (r) {
        var me = r.data && r.data.user; if (!me) throw new Error('no user');
        return was ? c.from('favoris').delete().eq('explorateur_id', me.id).eq('praticien_id', uid)
                   : c.from('favoris').insert({ explorateur_id: me.id, praticien_id: uid });
      }).then(function (r) {
        if (r.error) throw r.error; HOL.toast(was ? 'Retiré de vos favoris.' : 'Ajouté à vos favoris.');
      }).catch(function () {
        if (was) favSet.add(uid); else favSet.delete(uid); HOL_FAV.paint(root); HOL.toast('Action impossible pour le moment.');
      });
      return true;
    }
  };

  window.HOL_DIR = {
    photoUrl: photoUrl, byUids: function (uids) {
      var c = sb(); if (!c || !uids.length) return Promise.resolve([]);
      return c.from('profils_praticien').select(COLS).in('utilisateur_id', uids).eq('statut_publication', 'en_ligne').then(function (r) { if (r.error) throw r.error; return fetchAll(r.data || []); });
    }, dayLabel: dayLabel, todayYmd: todayYmd, dayIndex: dayIndex,
    /* Tous les praticiens en ligne */
    list: function () {
      var c = sb(); if (!c) return Promise.reject(new Error('no client'));
      return c.from('profils_praticien').select(COLS).eq('statut_publication', 'en_ligne').then(function (r) { if (r.error) throw r.error; return fetchAll(r.data || []); });
    },
    /* Une fiche par son slug (une fiche non publiée n'est lisible que par son propriétaire) */
    one: function (slug) {
      var c = sb(); if (!c) return Promise.reject(new Error('no client'));
      return c.from('profils_praticien').select(COLS).eq('slug', slug).maybeSingle().then(function (r) {
        if (r.error) throw r.error; if (!r.data) return null;
        return fetchAll([r.data]).then(function (a) { return a[0] || null; });
      });
    }
  };
})();
