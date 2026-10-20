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
      published: row.statut_publication === 'en_ligne', slots: mine
    };
    var f = mine[0];
    r.meta = { dayIdx: f ? f.di : -1, day: f ? dayLabel(f.day) : null, first: f ? f.hm : null, firstDay: f ? f.day : null, modes: r.modes, langs: r.langs };
    return r;
  }

  var COLS = 'utilisateur_id,slug,nom_affiche,discipline_principale_id,disciplines_complementaires,presentation,parcours,adresse,ville,code_postal,langues,modes_seance,site_web,instagram,statut_publication';

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

  window.HOL_DIR = {
    dayLabel: dayLabel, todayYmd: todayYmd, dayIndex: dayIndex,
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
