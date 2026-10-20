/* Holisanna — espace praticien (Camille Ferrand, praticienne n° 1 de la démonstration).
   Chaque page déclare sa section dans <body data-section="dash|agenda|resa|avis|offres|abo|fedit|messages|notifs">.
   Données de démonstration stockées dans le navigateur (HOL.Store) : à remplacer par la base. */
(function () {
  'use strict';
  var D = window.HOL_DATA;
  var section = document.body.getAttribute('data-section');
  var root = document.getElementById('pro-root');
  var modal = false, slotDays = [], slotTimes = [], slotRepeat = false;

  /* Accès réservé aux praticiens connectés (un e-mail = un rôle) */
  var sess = HOL.Session.get();
  if (!sess.loggedIn || sess.role !== 'praticien') { location.replace('connexion.html?role=praticien'); return; }

  function st() { return HOL.Store.get(); }
  function save(s) { HOL.Store.set(s); }
  function esc(x) { return String(x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ----- Données réelles (Supabase) ----- */
  var TZ = 'Europe/Paris', SLOT_MIN = 90, WEEKS_AHEAD = 8, DAYS_N = 6;
  var DAY_LBL = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'], MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  var MODE_LBL = { cabinet: 'Au cabinet', visio: 'Visio', domicile: 'À domicile' }, MODE_COL = { cabinet: 'var(--olive)', visio: 'var(--gold)', domicile: 'var(--rose)' };
  var db = { uid: null, ready: false, err: false, prestations: [], slots: [], week: null, resas: [], allResas: [], avis: [], abo: null };
  var replySel = null, replyText = '';
  var resaSel = null;
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function ymd(dt) { return dt.getUTCFullYear() + '-' + pad(dt.getUTCMonth() + 1) + '-' + pad(dt.getUTCDate()); }
  function addDays(s, n) { var d = new Date(s + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return ymd(d); }
  function mondayOf(s) { var d = new Date(s + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() - (d.getUTCDay() + 6) % 7); return ymd(d); }
  function parisParts(ms) {
    var o = {}; new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
      .formatToParts(new Date(ms)).forEach(function (p) { o[p.type] = p.value; });
    return o;
  }
  function parisOffsetMs(ms) { var p = parisParts(ms); return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - Math.floor(ms / 1000) * 1000; }
  function toIso(day, hm) {
    var a = day.split('-'), t = hm.split(':'), guess = Date.UTC(+a[0], +a[1] - 1, +a[2], +t[0], +t[1]);
    var ms = guess - parisOffsetMs(guess); ms = guess - parisOffsetMs(ms); return new Date(ms).toISOString();
  }
  function fromIso(iso) { var p = parisParts(new Date(iso).getTime()); return { day: p.year + '-' + p.month + '-' + p.day, hm: p.hour + ':' + p.minute }; }
  function todayYmd() { var p = parisParts(Date.now()); return p.year + '-' + p.month + '-' + p.day; }
  function dayLabel(s) { var d = new Date(s + 'T12:00:00Z'); return DAY_LBL[(d.getUTCDay() + 6) % 7] + ' ' + d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()]; }
  function weekDays() { return [0, 1, 2, 3, 4, 5].map(function (i) { return addDays(db.week, i); }); }
  function weekLabel() { var d = new Date(db.week + 'T12:00:00Z'); return d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()] + ' ' + d.getUTCFullYear(); }

  function loadWeek() {
    var c = HOL.sb(); if (!c || !db.uid) return Promise.resolve();
    var lo = toIso(db.week, '00:00'), hi = toIso(addDays(db.week, DAYS_N), '00:00');
    return Promise.all([
      c.from('creneaux').select('id,debut,fin,statut').eq('praticien_id', db.uid).gte('debut', lo).lt('debut', hi).order('debut'),
      c.from('reservations').select('*').eq('praticien_id', db.uid).eq('statut', 'confirmee').gte('debut', lo).lt('debut', hi)
    ]).then(function (r) { if (r[0].error || r[1].error) throw (r[0].error || r[1].error); db.slots = r[0].data || []; db.resas = r[1].data || []; });
  }
  function loadResas() {
    var c = HOL.sb(); if (!c || !db.uid) return Promise.resolve();
    return c.from('reservations').select('*').eq('praticien_id', db.uid).order('debut', { ascending: false }).limit(200)
      .then(function (r) { if (r.error) throw r.error; db.allResas = r.data || []; return c.from('avis').select('*').eq('praticien_id', db.uid).is('deleted_at', null).order('cree_le', { ascending: false }).limit(200); })
      .then(function (r) { db.avis = r.error ? [] : (r.data || []); return loadAbo(); });
  }
  function loadAbo() {
    var c = HOL.sb(); if (!c || !db.uid) return Promise.resolve();
    return c.from('abonnements').select('*').eq('praticien_id', db.uid).maybeSingle().then(function (r) { db.abo = r.error ? null : r.data; });
  }
  function dateFr(iso) { return new Intl.DateTimeFormat('fr-FR', { timeZone: TZ, day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso)); }
  function when(iso) { var p = fromIso(iso); return dayLabel(p.day) + ' · ' + p.hm; }
  function loadOffers() {
    var c = HOL.sb(); if (!c || !db.uid) return Promise.resolve();
    return c.from('prestations').select('*').eq('praticien_id', db.uid).is('deleted_at', null).order('ordre').order('cree_le')
      .then(function (r) { if (r.error) throw r.error; db.prestations = r.data || []; });
  }
  function loadAll() {
    var c = HOL.sb(); if (!c) { db.err = true; return Promise.resolve(); }
    db.week = mondayOf(todayYmd());
    return c.auth.getUser().then(function (r) {
      if (!r.data || !r.data.user) throw new Error('no user');
      db.uid = r.data.user.id;
      return Promise.all([loadWeek(), loadOffers(), loadFiche(), loadResas()]);
    }).then(function () { db.ready = true; }).catch(function () { db.err = true; });
  }

  function derive() {
    var free = db.slots.filter(function (x) { return x.statut === 'libre'; }).length;
    var booked = db.resas.length;
    var s = st();
    return { s: s, confirmed: booked, free: free, empty: free + booked === 0 };
  }
  function pending(what) { return '<div class="empty-note">' + (db.err ? 'Impossible de charger ' + what + ' pour le moment. Rechargez la page dans un instant.' : 'Chargement…') + '</div>'; }

  /* ----- Menu latéral ----- */
  var ICO = {
    dash: ['M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z', ''],
    agenda: ['M3 5h18v16H3z', 'M3 10h18 M8 3v4 M16 3v4'],
    resa: ['M6 3h12v18l-6-4-6 4z', ''],
    avis: ['M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z', ''],
    offres: ['M8 6h13 M8 12h13 M8 18h13', 'M3.5 6h.01 M3.5 12h.01 M3.5 18h.01'],
    fiche: ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2', 'M12 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8z'],
    fedit: ['M12 20h9', 'M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z'],
    abo: ['M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z', 'M14 3v5h5 M9 13h6 M9 17h4'],
    notifs: ['M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9', 'M13.7 21a2 2 0 0 1-3.4 0'],
    messages: ['M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', ''],
    out: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5 M21 12H9']
  };
  function item(label, key, href, badge, extra) {
    var on = section === key, ic = ICO[key === 'public' ? 'fiche' : key] || ICO.out;
    return '<a class="sidenav__item' + (on ? ' is-on' : '') + (extra || '') + '" href="' + href + '"' + (on ? ' aria-current="page"' : '') + '>' +
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="' + ic[0] + '"></path><path d="' + ic[1] + '"></path></svg>' +
      '<span>' + label + '</span>' + (badge ? '<span class="badge-n">' + badge + '</span>' : '') + '</a>';
  }
  function sidebar(d) {
    var unreadMsg = 0, unreadNot = 0;
    return '<aside class="sidenav sidenav--pro">' +
      '<div class="sidenav__group"><div class="sidenav__title">Navigation</div>' +
      item('Tableau de bord', 'dash', 'espace-praticien.html') + item('Mon agenda', 'agenda', 'pro-agenda.html') +
      item('Réservations', 'resa', 'pro-reservations.html', d.confirmed ? String(d.confirmed) : '') + item('Avis reçus', 'avis', 'pro-avis.html') +
      item('Messages', 'messages', 'pro-messages.html', unreadMsg ? String(unreadMsg) : '') +
      item('Notifications', 'notifs', 'pro-notifications.html', unreadNot ? String(unreadNot) : '') + '</div>' +
      '<div class="sidenav__group"><div class="sidenav__title">Ma pratique</div>' +
      item('Modifier ma fiche', 'fedit', 'pro-fiche.html') + item('Mes prestations', 'offres', 'pro-prestations.html') +
      item('Ma fiche publique', 'public', pubUrl()) + '</div>' +
      '<div class="sidenav__group"><div class="sidenav__title">Compte</div>' +
      item('Abonnement &amp; factures', 'abo', 'pro-abonnement.html') +
      '<button class="sidenav__item sidenav__item--out" type="button" data-act="logout"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="' + ICO.out[0] + '"></path><path d="' + ICO.out[1] + '"></path></svg><span>Déconnexion</span></button></div>' +
      '<div class="sidenav__user"><div class="sidenav__avatar">' + HOL.esc(HOL.who().initials) + '</div><div><div class="sidenav__name">' + HOL.esc(HOL.who().full) + '</div><div class="sidenav__role">Praticienne' + (sess.ville ? ' · ' + HOL.esc(sess.ville) : '') + '</div></div></div></aside>';
  }

  /* ----- Bandeau ----- */
  function banner(d) {
    return '<div class="banner banner--rose"><img src="assets/logo-dreamcatcher-ivory.png" alt="">' +
      '<div class="banner__text"><div class="banner__date">' + (db.week ? 'Semaine du ' + weekLabel() : '') + '</div>' +
      '<h1>Bonjour ' + HOL.esc(HOL.who().first) + ',<br><em>' + (d.empty && db.ready ? 'ouvrez vos premiers créneaux.' : 'votre semaine est ouverte.') + '</em></h1>' +
      '<p>' + (db.ready ? d.confirmed + ' séance' + (d.confirmed > 1 ? 's' : '') + ' réservée' + (d.confirmed > 1 ? 's' : '') + ' cette semaine · ' + d.free + ' créneau' + (d.free > 1 ? 'x' : '') + ' encore libre' + (d.free > 1 ? 's' : '') + '.' : '&nbsp;') + '</p></div>' +
      '<div class="banner__btns"><button class="btn-line-light" type="button" data-act="open-slots">OUVRIR DES CRÉNEAUX</button>' +
      '<a class="btn-dark2" href="' + pubUrl() + '">VOIR MA FICHE PUBLIQUE</a></div></div>';
  }

  /* ----- Blocs ----- */
  function stats(d) {
    var items = [
      [d.confirmed, 'réservations cette semaine', 'var(--olive)'], [d.free, 'créneaux encore libres', 'var(--slate)'],
      (db.avis.length ? [String(avg()).replace('.', ','), 'note moyenne · ' + db.avis.length + ' avis', 'var(--gold)'] : ['—', 'note moyenne · pas encore d’avis', 'var(--gold)']), [db.vues || 0, 'vues de votre fiche ce mois-ci', 'var(--rose)']
    ];
    return '<div class="pstats">' + items.map(function (i) {
      return '<div class="pstat"><div class="pstat__n" style="color:' + i[2] + '">' + i[0] + '</div><div class="pstat__label">' + i[1] + '</div></div>';
    }).join('') + '</div>';
  }
  function agenda(d) {
    if (!db.ready) return '<div class="card-pro"><div class="card-pro__head"><div class="card-pro__title">Agenda</div></div>' + pending('votre agenda') + '</div>';
    var days = weekDays(), today = todayYmd(), nowIso = new Date().toISOString();
    var map = {};
    db.slots.forEach(function (x) { var p = fromIso(x.debut); map[p.day + ' ' + p.hm] = x; });
    var cols = 'grid-template-columns:64px repeat(' + DAYS_N + ',1fr)';
    var rows = D.POOL.map(function (t) {
      return '<div class="agenda-row" style="' + cols + '"><div class="agenda-row__t">' + t + '</div>' + days.map(function (day) {
        var x = map[day + ' ' + t], c, attr = '';
        var rs = x && x.statut === 'reserve' ? db.resas.filter(function (q) { return q.creneau_id === x.id; })[0] : null;
        if (x && x.statut === 'reserve') { c = { bg: 'var(--olive-bg)', bd: 'var(--olive)', c1: 'var(--olive)', c2: 'var(--olive)', a: rs ? esc(rs.client_nom) : 'Réservé', b: rs ? esc(rs.prestation_nom) : '' }; if (rs) attr = ' data-act="open-resa" data-id="' + rs.id + '"'; }
        else if (x && x.statut === 'bloque') c = { bg: 'var(--ivory-2)', bd: 'var(--ivory-2)', c1: 'var(--slate-lt)', c2: 'transparent', a: 'Bloqué', b: '·' };
        else if (x) { c = { bg: 'var(--white)', bd: 'var(--border)', c1: 'var(--slate-lt)', c2: 'var(--slate-lt)', a: 'Libre', b: 'Fermer ×' }; attr = ' data-act="close-slot" data-id="' + x.id + '"'; }
        else c = { bg: 'var(--ivory-2)', bd: 'var(--ivory-2)', c1: 'var(--slate-lt)', c2: 'transparent', a: '—', b: '·' };
        var st2 = attr + ' style="background:' + c.bg + ';border-color:' + c.bd + '"';
        var tag = attr ? 'button type="button"' : 'div';
        var closeLbl = x && x.statut === 'libre';
        return '<' + tag + ' class="acell"' + st2 + (attr ? ' aria-label="' + (closeLbl ? 'Fermer' : 'Voir') + ' le créneau du ' + dayLabel(day) + ' à ' + t + '"' : '') + '><div class="acell__a" style="color:' + c.c1 + '">' + c.a + '</div><div class="acell__b" style="color:' + c.c2 + '">' + c.b + '</div></' + (attr ? 'button' : 'div') + '>';
      }).join('') + '</div>';
    }).join('');
    var legend = [['Réservé', 'var(--olive-bg)', 'var(--olive)'], ['Libre', 'var(--white)', 'var(--border)'], ['Fermé', 'var(--ivory-2)', 'var(--ivory-2)']];
    return '<div class="card-pro card-pro--scroll"><div class="card-pro__head"><div class="card-pro__title">Agenda</div>' +
      '<div style="display:flex;gap:6px;align-items:center;margin-right:auto;margin-left:14px"><button class="chipbtn chipbtn--s" type="button" data-act="week-prev" aria-label="Semaine précédente">‹</button><button class="chipbtn chipbtn--s" type="button" data-act="week-today">Cette semaine</button><button class="chipbtn chipbtn--s" type="button" data-act="week-next" aria-label="Semaine suivante">›</button></div>' +
      (d.empty ? '<button class="btn-rose btn-rose--s" type="button" data-act="open-slots">OUVRIR DES CRÉNEAUX</button>' : '') +
      '<div class="legend">' + legend.map(function (g) { return '<span><i style="background:' + g[1] + ';border-color:' + g[2] + '"></i>' + g[0] + '</span>'; }).join('') + '</div></div>' +
      '<div class="agenda-grid"><div class="agenda-row" style="' + cols + '"><div></div>' + days.map(function (x) { return '<div class="agenda-row__h"' + (x === today ? ' style="color:var(--rose)"' : '') + '>' + dayLabel(x) + '</div>'; }).join('') + '</div>' + rows + '</div></div>';
  }
  var RSTAT = { confirmee: ['confirmed', '✓ Confirmé'], honoree: ['confirmed', '✓ Honorée'], absente: ['cancelled', 'Absente'], annulee_explorateur: ['cancelled', '✕ Annulée par l’explorateur'], annulee_praticien: ['cancelled', '✕ Annulée par vous'] };
  function resa() {
    var upc = db.allResas.filter(function (r) { return r.statut === 'confirmee'; }).length;
    var head = '<div class="card-pro"><div class="card-pro__head"><div class="card-pro__title">Réservations</div><div class="card-pro__count">' + upc + ' confirmée' + (upc > 1 ? 's' : '') + '</div></div>';
    if (!db.ready) return head + pending('vos réservations') + '</div>';
    if (!db.allResas.length) return head + '<div class="empty-note" style="margin:0">Aucune réservation pour le moment. Elles apparaîtront ici dès que des explorateurs réserveront vos créneaux.</div></div>';
    return head + db.allResas.map(function (b) {
      var st2 = RSTAT[b.statut] || RSTAT.confirmee, ini = HOL.who ? b.client_nom.split(/\s+/).map(function (w) { return w.charAt(0); }).join('').slice(0, 2).toUpperCase() : '';
      return '<button type="button" class="rrow" data-act="open-resa" data-id="' + b.id + '" style="width:100%;text-align:left;font:inherit;cursor:pointer"><div class="rrow__avatar">' + esc(ini) + '</div><div class="rrow__body"><div class="rrow__client">' + esc(b.client_nom) + '</div>' +
        '<div class="rrow__meta">' + esc(when(b.debut)) + ' · ' + esc(b.prestation_nom) + '</div></div>' +
        '<div class="rrow__pay">' + esc(b.prix_annonce) + ' € sur place</div><span class="badge-s badge-s--' + st2[0] + '">' + st2[1] + '</span></button>';
    }).join('') + '</div>';
  }
  function resaModal() {
    var b = db.allResas.concat(db.resas).filter(function (x) { return x.id === resaSel; })[0]; if (!b) return '';
    var ok = b.statut === 'confirmee' && new Date(b.debut).getTime() > Date.now();
    return '<div class="modal-back" data-act="close-bg"><div class="modal" role="dialog" aria-modal="true">' +
      '<div class="modal__k" style="color:var(--gold)">Réservation</div><h3>' + esc(b.client_nom) + '</h3>' +
      '<div class="recap" style="margin-bottom:18px"><div class="recap__row"><span class="recap__k">Séance</span><span class="recap__v">' + esc(b.prestation_nom) + ' · ' + esc(b.duree_minutes) + ' min</span></div>' +
      '<div class="recap__row"><span class="recap__k">Créneau</span><span class="recap__v">' + esc(when(b.debut)) + '</span></div>' +
      '<div class="recap__row"><span class="recap__k">À régler sur place</span><span class="recap__v">' + esc(b.prix_annonce) + ' €</span></div>' +
      '<div class="recap__row"><span class="recap__k">Statut</span><span class="recap__v">' + esc((RSTAT[b.statut] || RSTAT.confirmee)[1]) + '</span></div></div>' +
      (ok ? '<div class="ffield" style="margin-bottom:16px"><label for="motif">Message pour l’explorateur (facultatif)</label><textarea id="motif" rows="2" data-motif placeholder="Un imprévu de ma part…"></textarea></div>' +
        '<div class="modal__btns--pro"><button class="btn-ghost2" type="button" data-act="cancel-resa" data-id="' + b.id + '">ANNULER CETTE SÉANCE</button><button class="modal__close" type="button" data-act="close">Fermer</button></div>' +
        '<p class="modal__lead" style="margin:14px 0 0">Annuler libère l’explorateur de sa réservation ; le créneau passe en « bloqué » dans votre agenda.</p>'
        : '<div class="modal__btns--pro"><button class="modal__close" type="button" data-act="close">Fermer</button></div>') +
      '</div></div>';
  }


  /* ----- Colonne de droite (toutes les pages de l'espace praticien) ----- */
  function aside(d) {
    var todayR = db.allResas.filter(function (b) { return b.statut === 'confirmee' && fromIso(b.debut).day === todayYmd(); }).reverse();
    var f = fiche || {}, on = db.prestations.filter(function (o) { return !o.masquee; }).length;
    var ph = f.photos || {}, compl = [['Photo de profil', ph.principale ? 1 : 0], ['Présentation et parcours', f.pres && f.parcours ? 1 : 0], ['Adresse du cabinet', f.adresse && f.ville ? 1 : 0], ['Au moins une prestation', on ? 1 : 0], ['Photos du lieu', ph.cabinet || ph.seance ? 1 : 0]];
    var done = compl.filter(function (c) { return c[1]; }).length, pct = Math.round(done / compl.length * 100);
    return '<aside class="rside"><div class="rside__block"><div class="rside__title" style="margin-bottom:14px">Aujourd\'hui</div>' +
      (todayR.length ? todayR.map(function (b) { return '<div class="today"><span class="today__t">' + fromIso(b.debut).hm.replace(':', 'h') + '</span><div style="min-width:0"><div class="today__c">' + esc(b.client_nom) + '</div><div class="today__o" style="color:var(--olive)">' + esc(b.prestation_nom) + ' · ' + esc(b.duree_minutes) + ' min</div></div></div>'; }).join('')
        : '<div class="today-sub" style="margin-top:0">Aucune séance prévue aujourd’hui.</div>') + '</div>' +
      '<div class="rside__block"><div class="rside__row" style="margin-bottom:10px"><span class="rside__label">Complétude de ma fiche</span><span style="font-size:11px;color:var(--gold)">' + pct + '%</span></div>' +
      '<div class="compl__bar"><div style="width:' + pct + '%"></div></div>' +
      compl.map(function (c) { return '<div class="compl__item"><span style="color:' + (c[1] ? 'var(--olive)' : 'var(--slate-lt)') + '">' + (c[1] ? '✓' : '○') + '</span><span style="color:' + (c[1] ? 'var(--slate-md)' : 'var(--slate-lt)') + '">' + c[0] + '</span></div>'; }).join('') +
      '<a class="btn-dark2" href="pro-fiche.html" style="margin-top:12px">Compléter ma fiche →</a></div>' +
      '<div><div class="rside__row"><span class="rside__label">Notifications</span><a class="rside__more" href="pro-notifications.html">Tout voir</a></div>' +
      '<div class="today-sub" style="margin-top:6px">Rien de nouveau pour le moment.</div></div></aside>';
  }

  /* ----- Avis reçus ----- */
  function avg() { return Math.round(db.avis.reduce(function (t, a) { return t + a.note; }, 0) / db.avis.length * 10) / 10; }
  function secAvis() {
    if (!db.ready) return '<div class="sec-head"><h2>Avis reçus</h2></div>' + pending('vos avis');
    if (db.avis.length) {
      var bars = [5, 4, 3, 2, 1].map(function (n) { var c = db.avis.filter(function (a) { return a.note === n; }).length; return [n + ' ★', c, Math.round(c / db.avis.length * 100) + '%']; });
      return '<div class="sec-head"><h2>Avis reçus</h2></div>' +
        '<div class="rating-row"><div class="rating-box"><div class="rating-box__n">' + String(avg()).replace('.', ',') + '</div><div class="rating-box__stars">' + '★★★★★'.slice(0, Math.round(avg())) + '</div><div class="rating-box__sub">' + db.avis.length + ' avis</div></div>' +
        '<div class="rating-bars">' + bars.map(function (b) { return '<div class="rbar"><span class="rbar__s">' + b[0] + '</span><div class="rbar__t"><div style="width:' + b[2] + '"></div></div><span class="rbar__n">' + b[1] + '</span></div>'; }).join('') + '</div></div>' +
        '<div class="hlist" style="margin-bottom:0">' + db.avis.map(function (a) {
          var p = fromIso(a.cree_le);
          return '<div class="preview"><div class="preview__top"><div class="preview__avatar">' + esc(a.auteur_nom.charAt(0)) + '</div><div><div class="preview__who">' + esc(a.auteur_nom) + '</div><div class="preview__meta">' + esc(a.discipline_nom || '') + ' · ' + dayLabel(p.day) + '</div></div><span class="preview__stars">' + '★★★★★'.slice(0, a.note) + '☆☆☆☆☆'.slice(0, 5 - a.note) + '</span></div>' +
            '<p>' + esc(a.commentaire) + '</p>' +
            (a.reponse ? '<p style="font-size:13px;opacity:.8"><b>Votre réponse :</b> ' + esc(a.reponse) + '</p>' : '<button class="btn-outline-s" type="button" data-act="open-reply" data-id="' + a.id + '">Répondre</button>') + '</div>';
        }).join('') + '</div>';
    }
    return '<div class="sec-head"><h2>Avis reçus</h2></div><div class="empty-note">Pas encore d’avis. Ils apparaissent ici après vos premières séances : seuls les explorateurs ayant réellement suivi une séance peuvent en laisser un.</div>';
  }
  function secAvisDemo() {
    var bars = [['5 ★', 112, '88%'], ['4 ★', 13, '10%'], ['3 ★', 2, '2%'], ['2 ★', 1, '1%'], ['1 ★', 0, '0%']];
    var reviews = [
      { i: 'SN', c: 'Sarah N.', o: 'Massage bien-être · 60 min', d: '24 août 2026', s: '★★★★★', q: 'Une heure entière sans penser à rien. Camille adapte la pression au fil de la séance, on sent qu’elle écoute vraiment le corps.', done: false },
      { i: 'MB', c: 'Marc B.', o: 'Massage dos & nuque · 45 min', d: '19 août 2026', s: '★★★★★', q: 'Je suis venu pour des tensions de bureau, je repars avec des conseils simples à tenir. Le cabinet est calme, l’accueil sans chichi.', done: false },
      { i: 'LR', c: 'Léa R.', o: 'Massage bien-être · 60 min', d: '11 août 2026', s: '★★★★', q: 'Très bonne séance. J’aurais aimé un peu plus de temps sur les jambes, mais le rythme lent fait tout le travail.', done: true }
    ];
    return '<div class="rating-row"><div class="rating-box"><div class="rating-box__n">4,9</div><div class="rating-box__stars">★★★★★</div><div class="rating-box__sub">128 avis · 96 % de recommandation</div></div>' +
      '<div class="rating-bars">' + bars.map(function (b) { return '<div class="rbar"><span class="rbar__s">' + b[0] + '</span><div class="rbar__t"><div style="width:' + b[2] + '"></div></div><span class="rbar__n">' + b[1] + '</span></div>'; }).join('') + '</div></div>' +
      '<div class="hlist" style="margin-bottom:0">' + reviews.map(function (r) {
        return '<div class="preview"><div class="preview__top"><div class="preview__avatar">' + r.i + '</div><div><div class="preview__who">' + r.c + '</div><div class="preview__meta">' + r.o + ' · ' + r.d + '</div></div><span class="preview__stars">' + r.s + '</span></div>' +
          '<p>' + r.q + '</p><button class="btn-outline-s" type="button" data-act="reply" data-who="' + r.c + '" data-done="' + r.done + '">' + (r.done ? 'Répondu' : 'Répondre') + '</button></div>';
      }).join('') + '</div>';
  }

  /* ----- Mes prestations ----- */
  var offerForm = null;
  function secOffres() {
    var head = '<div class="sec-head" style="align-items:baseline"><h2>Mes prestations</h2><button class="sec-link" type="button" data-act="add-offer">Ajouter une prestation →</button></div>';
    if (!db.ready) return head + pending('vos prestations');
    if (!db.prestations.length) return head + '<div class="empty-note">Vous n’avez pas encore de prestation. Ajoutez par exemple « Massage bien-être · 60 min » avec son tarif : c’est ce que les explorateurs réserveront.</div>';
    return head + '<div class="hlist">' + db.prestations.map(function (o) {
      return '<div class="offer-row"><span class="offer-row__bar" style="background:' + (MODE_COL[o.mode] || 'var(--olive)') + '"></span><div class="offer-row__body"><div class="offer-row__name">' + esc(o.nom) + '</div><div class="offer-row__meta">' + o.duree_minutes + ' min · ' + MODE_LBL[o.mode] + '</div></div>' +
        '<div class="offer-row__price">' + o.prix_euros + ' €</div>' +
        '<button class="sec-link" type="button" data-act="edit-offer" data-id="' + o.id + '">Modifier</button>' +
        '<button class="sec-link" type="button" data-act="del-offer" data-id="' + o.id + '" style="color:var(--slate-lt)">Supprimer</button>' +
        '<button class="state-btn' + (o.masquee ? ' is-off' : '') + '" type="button" data-act="toggle-offer" data-id="' + o.id + '" aria-pressed="' + (!o.masquee) + '">' + (o.masquee ? 'Masquée' : 'En ligne') + '</button></div>';
    }).join('') + '</div>';
  }
  function offerModal() {
    var f = offerForm;
    return '<div class="modal-back" data-act="close-bg"><div class="modal" role="dialog" aria-modal="true">' +
      '<div class="modal__k" style="color:var(--gold)">Mes prestations</div><h3>' + (f.id ? 'Modifier la prestation' : 'Nouvelle prestation') + '</h3>' +
      '<p class="modal__lead">Le tarif affiché est celui que l’explorateur retrouve sur votre fiche. La séance se règle sur place : Holisanna n’encaisse rien.</p>' +
      '<div class="ffield" style="margin-bottom:16px"><label for="o-nom">Nom de la prestation</label><input id="o-nom" data-of="nom" maxlength="120" value="' + esc(f.nom) + '" placeholder="Massage bien-être"></div>' +
      '<div class="fgrid fgrid--200" style="margin-bottom:16px"><div class="ffield"><label for="o-duree">Durée (minutes)</label><input id="o-duree" data-of="duree" inputmode="numeric" value="' + esc(f.duree) + '" placeholder="60"></div>' +
      '<div class="ffield"><label for="o-prix">Tarif (€)</label><input id="o-prix" data-of="prix" inputmode="numeric" value="' + esc(f.prix) + '" placeholder="70"></div></div>' +
      '<div class="ffield" style="margin-bottom:22px"><label for="o-mode">Où a lieu la séance</label><select id="o-mode" data-of="mode">' + Object.keys(MODE_LBL).map(function (k) { return '<option value="' + k + '"' + (f.mode === k ? ' selected' : '') + '>' + MODE_LBL[k] + '</option>'; }).join('') + '</select></div>' +
      '<div class="modal__btns--pro"><button class="btn-dark2" type="button" data-act="save-offer">ENREGISTRER</button><button class="modal__close" type="button" data-act="close">Annuler</button></div></div></div>';
  }

  /* ----- Abonnement & factures ----- */
  var INVOICES = [['Août 2026', 'HOL-2608-0412'], ['Juillet 2026', 'HOL-2607-0412'], ['Juin 2026', 'HOL-2606-0412'], ['Mai 2026', 'HOL-2605-0412']];
  function aboStatus() {
    var a = db.abo;
    if (!db.ready) return pending('votre abonnement');
    if (!a) return '<div class="empty-note">Impossible de charger votre abonnement pour le moment. Rechargez la page dans un instant.</div>';
    var left = a.essai_fin ? Math.max(0, Math.ceil((new Date(a.essai_fin) - Date.now()) / 86400000)) : 0, t, c;
    if (a.statut === 'avant_essai') { t = 'Votre mois d’essai gratuit démarrera à la publication de votre fiche.'; c = 'var(--slate-md)'; }
    else if (a.statut === 'essai') { t = 'Mois d’essai gratuit en cours, jusqu’au ' + dateFr(a.essai_fin) + ' (' + left + ' jour' + (left > 1 ? 's' : '') + ' restant' + (left > 1 ? 's' : '') + '). Aucun prélèvement.'; c = 'var(--olive)'; }
    else if (a.statut === 'expire') { t = 'Votre mois d’essai est terminé : votre fiche est hors ligne. Elle sera remise en ligne dès l’activation de votre formule.'; c = 'var(--rose)'; }
    else { t = 'Abonnement actif' + (a.periode_fin ? ' jusqu’au ' + dateFr(a.periode_fin) : '') + '.'; c = 'var(--olive)'; }
    return '<div class="pay-card" style="margin-bottom:16px"><div><div class="pay-card__t" style="color:' + c + '">' + t + '</div></div></div>';
  }
  function secAbo(d) {
    var a = db.abo, pick = a && a.formule_choisie;
    var names = { continu: 'Fil Continu', libre: 'Fil Libre' };
    return '<div class="abo-grid"><div class="abo-col"><div class="abo-box"><h2>Abonnement</h2>' +
      '<p class="abo-box__lead">Aucune commission sur vos séances, réglées directement par l’explorateur. Un mois d’essai gratuit à la première publication de votre fiche.</p>' + aboStatus() +
      '<div class="stack-10">' + D.PLANS.map(function (pl) {
        var key = pl.name === 'Fil Continu' ? 'continu' : 'libre', on = pick === key;
        return '<button class="plan-row' + (on ? ' is-on' : '') + '" type="button" data-act="plan" data-key="' + key + '" aria-pressed="' + on + '"><div><div class="plan-row__name">' + pl.name + '</div><div class="plan-row__desc">' + pl.hook + ' ' + pl.note + '</div><div class="plan-row__state">' + (on ? 'Formule choisie' : 'Choisir') + '</div></div><div class="plan-row__price">' + pl.price + '<small style="display:block;font-size:11px">' + pl.period + '</small></div></button>';
      }).join('') + '</div><div class="abo-foot">' + (pick ? 'Formule ' + names[pick] + ' enregistrée. ' : '') + 'Le paiement (carte bancaire ou prélèvement SEPA) vous sera demandé avant la fin de l’essai ; il n’est pas encore ouvert pendant la phase de tests.</div></div>' +
      '<div class="abo-box"><div class="abo-head"><h2>Facturation</h2></div>' +
      '<div class="empty-note">Aucune facture pour le moment. Vos factures apparaîtront ici dès le premier prélèvement.</div></div></div></div>';
  }

  /* ----- Modifier ma fiche ----- */
  var fiche = null, photoKey = null, photoBusy = null;
  var PHOTO_SLOTS = [['principale', 'Photo principale', 1200], ['cabinet', 'Le cabinet', 1600], ['seance', 'En séance', 1600]];
  function photoSrc(path) { return window.HOL_DIR && HOL_DIR.photoUrl ? HOL_DIR.photoUrl(path) : ''; }
  function photosHtml() {
    var ph = (fiche && fiche.photos) || {};
    return '<input type="file" id="photo-file" accept="image/jpeg,image/png,image/webp" hidden>' +
      '<div class="photos">' + PHOTO_SLOTS.map(function (s) {
        var url = photoSrc(ph[s[0]]);
        if (photoBusy === s[0]) return '<div class="photo-slot"><span>Envoi en cours…</span></div>';
        if (url) return '<div class="photo-slot" style="background:url(' + url + ') center/cover;cursor:default;position:relative;justify-content:flex-end"><span style="background:rgba(255,255,255,.92);padding:4px 8px;margin-bottom:8px;display:flex;gap:10px"><button type="button" class="sec-link" data-act="photo" data-k="' + s[0] + '">Remplacer</button><button type="button" class="sec-link" data-act="photo-del" data-k="' + s[0] + '">Retirer</button></span></div>';
        return '<button class="photo-slot" type="button" data-act="photo" data-k="' + s[0] + '"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--slate-lt)" stroke-width="1.4" stroke-linecap="round"><path d="M12 5v14 M5 12h14"></path></svg><span>' + s[1] + '</span></button>';
      }).join('') + '</div>';
  }
  /* Réduit l'image (côté le plus long ≤ max) et l'encode en JPEG : léger et sans métadonnées (position GPS retirée) */
  function shrink(file, max) {
    return new Promise(function (ok, ko) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight)), w = Math.round(img.naturalWidth * k), h = Math.round(img.naturalHeight * k);
        var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
        var cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, w, h); cx.drawImage(img, 0, 0, w, h); URL.revokeObjectURL(url);
        cv.toBlob(function (b) { b ? ok(b) : ko(new Error('encode')); }, 'image/jpeg', 0.85);
      };
      img.onerror = function () { URL.revokeObjectURL(url); ko(new Error('read')); };
      img.src = url;
    });
  }
  function savePhotos(next) {
    return HOL.sb().from('profils_praticien').update({ photos: next }).eq('utilisateur_id', db.uid).then(function (r) { if (r.error) throw r.error; fiche.photos = next; });
  }
  function uploadPhoto(file) {
    var key = photoKey, slot = PHOTO_SLOTS.filter(function (s) { return s[0] === key; })[0];
    if (!slot || !file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { HOL.toast('Format non accepté : choisissez une image JPEG, PNG ou WebP.'); return; }
    if (file.size > 25 * 1024 * 1024) { HOL.toast('Image trop volumineuse (25 Mo maximum).'); return; }
    var old = (fiche.photos || {})[key], path = db.uid + '/' + key + '-' + Date.now() + '.jpg';
    photoBusy = key; render();
    shrink(file, slot[2]).then(function (blob) {
      return HOL.sb().storage.from('photos').upload(path, blob, { contentType: 'image/jpeg', cacheControl: '31536000' });
    }).then(function (r) {
      if (r.error) throw r.error;
      var next = Object.assign({}, fiche.photos); next[key] = path; return savePhotos(next);
    }).then(function () {
      if (old) HOL.sb().storage.from('photos').remove([old]);
      photoBusy = null; render(); HOL.toast('Photo enregistrée.');
    }).catch(function () { photoBusy = null; render(); HOL.toast('Envoi impossible pour le moment. Vérifiez votre connexion et réessayez.'); });
  }
  function removePhoto(key) {
    var old = (fiche.photos || {})[key]; if (!old) return;
    var next = Object.assign({}, fiche.photos); delete next[key];
    savePhotos(next).then(function () { HOL.sb().storage.from('photos').remove([old]); render(); HOL.toast('Photo retirée.'); })
      .catch(function () { HOL.toast('Suppression impossible pour le moment.'); });
  }
  var MAIN_SPECS = ['Naturopathie', 'Sophrologie', 'Kinésiologie', 'Ostéopathie', 'Hypnothérapie', 'Massage bien-être', 'Reiki', 'EFT', 'PNL', 'Yoga', 'Réflexologie', 'Autre'];
  var COMP_SPECS = ['Phytothérapie', 'Iridologie', 'Breathwork', 'Janzu / Watsu', 'Aromathérapie', 'Nutrition', 'Coaching mental', 'Astrologie', 'Chamanisme'];
  function chips(key, options) {
    return '<div class="chipset">' + options.map(function (o) {
      var on = fiche[key].indexOf(o) !== -1;
      return '<button class="chipbtn chipbtn--s' + (on ? ' is-on' : '') + '" type="button" data-act="fchip" data-key="' + key + '" data-v="' + esc(o) + '" aria-pressed="' + on + '">' + o + '</button>';
    }).join('') + '</div>';
  }
  function field(k, label) { return '<div class="ffield"><label for="f-' + k + '">' + label + '</label><input id="f-' + k + '" data-f="' + k + '" value="' + esc(fiche[k]) + '"></div>'; }
  /* Met à jour la ville affichée sous le nom (menu latéral) */
  function syncVille() {
    return HOL.Session.refresh().then(function (n) {
      if (!n.loggedIn || (n.ville || '') === (sess.ville || '')) return;
      sess = n; HOL.Session.set(n); render();
    });
  }

  /* Correspondances interface ↔ base */
  var MODES_UI = { cabinet: 'Cabinet', visio: 'Visio', domicile: 'À domicile' };
  var LANGS_UI = { fr: 'Français', en: 'Anglais', es: 'Espagnol', it: 'Italien', lsf: 'LSF' };
  function invert(o) { var r = {}; Object.keys(o).forEach(function (k) { r[o[k]] = k; }); return r; }
  var discById = {}, discByName = {}, ficheErr = false, ficheDb = false;

  /* Charge la fiche depuis Supabase (repli : données locales si la base est injoignable) */
  function loadFiche() {
    var c = HOL.sb();
    if (!c) { ficheErr = true; return Promise.resolve(); }
    return c.auth.getUser().then(function (r) {
      var u = r.data && r.data.user; if (!u) throw new Error('no user');
      return Promise.all([
        c.from('disciplines').select('id,nom'),
        c.from('profils_praticien').select('*').eq('utilisateur_id', u.id).single(),
        c.from('utilisateurs').select('nom_complet,telephone').eq('id', u.id).single()
      ]);
    }).then(function (r) {
      if (r[0].error || r[1].error || r[2].error) throw new Error('db');
      (r[0].data || []).forEach(function (x) { discById[x.id] = x.nom; discByName[x.nom] = x.id; });
      var p = r[1].data, u = r[2].data;
      fiche = {
        nom: p.nom_affiche || u.nom_complet || '', tel: u.telephone || '',
        disc: discById[p.discipline_principale_id] || MAIN_SPECS[0],
        comp: (p.disciplines_complementaires || []).map(function (i) { return discById[i]; }).filter(Boolean),
        pres: p.presentation || '', parcours: p.parcours || '',
        adresse: p.adresse || '', ville: p.ville || '',
        modes: (p.modes_seance || []).map(function (m) { return MODES_UI[m]; }).filter(Boolean),
        langs: (p.langues || []).map(function (l) { return LANGS_UI[l]; }).filter(Boolean),
        site: p.site_web || '', insta: p.instagram || '', cp: p.code_postal || '',
        photos: (p.photos && typeof p.photos === 'object') ? p.photos : {}
      };
      db.vues = p.vues_fiche_30j; db.slug = p.slug; db.statut = p.statut_publication; ficheDb = true;
    }).catch(function () { ficheErr = true; });
  }
  /* Enregistre la fiche en base ; renvoie une promesse (rejetée si l'enregistrement échoue) */
  function persistFiche() {
    var c = HOL.sb(), f = fiche;
    var mi = invert(MODES_UI), li = invert(LANGS_UI);
    return c.auth.getUser().then(function (r) {
      var id = r.data.user.id;
      return Promise.all([
        c.from('utilisateurs').update({ telephone: f.tel.trim() || null }).eq('id', id),
        c.from('profils_praticien').update({
          nom_affiche: f.nom.trim() || null,
          discipline_principale_id: discByName[f.disc] || null,
          disciplines_complementaires: f.comp.map(function (n) { return discByName[n]; }).filter(Boolean),
          presentation: f.pres.slice(0, 600).trim() || null, parcours: f.parcours.trim() || null,
          adresse: f.adresse.trim() || null, ville: f.ville.trim() || null,
          modes_seance: f.modes.map(function (m) { return mi[m]; }),
          langues: f.langs.map(function (l) { return li[l]; }),
          site_web: f.site.trim() || null, instagram: f.insta.trim() || null
        }).eq('utilisateur_id', id)
      ]);
    }).then(function (r) { if (r[0].error || r[1].error) throw new Error('db'); });
  }
  function saveFiche() {
    if (!ficheDb || !HOL.sb()) { var s = st(); s.fiche = JSON.parse(JSON.stringify(fiche)); save(s); HOL.toast('Base injoignable : fiche enregistrée sur cet appareil seulement.'); return; }
    persistFiche().then(function () {
      syncVille(); render();
      HOL.toast(db.statut === 'en_ligne' ? 'Fiche enregistrée. Les modifications sont en ligne.' : 'Fiche enregistrée. Elle sera visible dans la recherche dès sa publication.');
    }).catch(function () { HOL.toast('Enregistrement impossible pour le moment. Réessayez dans un instant.'); });
  }
  function setStatut(statut, okMsg) {
    var c = HOL.sb();
    return c.from('profils_praticien').update({ statut_publication: statut }).eq('utilisateur_id', db.uid).then(function (r) {
      if (r.error) { var e = new Error(r.error.message || 'db'); e.pub = /^(Fiche incomplète|Votre mois d.essai)/.test(r.error.message || ''); throw e; }
      db.statut = statut; return loadAbo().then(function () { render(); HOL.toast(okMsg); });
    });
  }
  function pubUrl() { return db.slug ? 'praticien.html?p=' + encodeURIComponent(db.slug) + '&from=pro' : 'pro-fiche.html'; }
  function pubCard() {
    var on = db.statut === 'en_ligne';
    return '<div class="fcard"><div class="fcard__title">Publication</div>' +
      '<p class="fcard__lead" style="margin-top:0">' + (on ? 'Votre fiche est <strong>en ligne</strong> : les explorateurs la trouvent dans la recherche et peuvent voir vos prestations et vos créneaux libres.'
        : 'Votre fiche est un <strong>brouillon</strong> : seule vous la voyez. Pour la publier, il faut un nom, une discipline principale, une présentation, une ville, un mode de séance et au moins une prestation visible.' + (db.abo && db.abo.statut === 'avant_essai' ? ' <strong>La première publication démarre votre mois d’essai gratuit</strong> (puis Fil Continu 9,99 € ou Fil Libre 11,99 € par mois).' : '') + (db.abo && db.abo.statut === 'expire' ? ' Votre mois d’essai est terminé : choisissez une formule dans « Abonnement &amp; factures » pour la remettre en ligne.' : '')) + '</p>' +
      '<div class="fbtns" style="margin-top:14px">' + (on
        ? '<button class="btn-ghost2" type="button" data-act="unpublish">RETIRER MA FICHE DE LA RECHERCHE</button>'
        : '<button class="btn-dark2 btn-dark2--l" type="button" data-act="publish">PUBLIER MA FICHE</button>') +
      '<a class="btn-ghost2" href="' + pubUrl() + '">VOIR MA FICHE PUBLIQUE</a></div></div>';
  }

  function secFiche(d) {
    if (!fiche) {
      if (ficheErr) fiche = JSON.parse(JSON.stringify(d.s.fiche));
      else return '<div class="sec-head"><h2>Modifier ma fiche</h2></div><p class="fcard__lead">Chargement de votre fiche…</p>';
    }
    ['comp', 'modes', 'langs'].forEach(function (k) { if (!fiche[k]) fiche[k] = []; });
    var f = fiche, done = [f.nom, f.disc, f.pres, f.parcours, f.adresse, f.ville, f.tel, f.site].filter(function (v) { return v && v.trim(); }).length;
    return '<div class="sec-head" style="flex-wrap:wrap"><h2>Modifier ma fiche</h2><div class="card-pro__count" id="fcount">' + done + ' / 8 champs renseignés</div></div>' +
      pubCard() + '<div class="fcard"><div class="fcard__title">Identité</div><div class="fgrid">' + field('nom', 'Nom affiché') +
      '<div class="ffield"><label for="f-disc">Discipline principale</label><select id="f-disc" data-f="disc">' + MAIN_SPECS.map(function (o) { return '<option' + (o === f.disc ? ' selected' : '') + '>' + o + '</option>'; }).join('') + '</select></div></div>' +
      '<div class="fblock"><span class="flabel">Disciplines complémentaires</span>' + chips('comp', COMP_SPECS) + '</div></div>' +
      '<div class="fcard"><div class="fcard__title">Présentation</div><div class="ffield" style="margin-bottom:18px"><label for="f-pres">Ce que vous proposez</label><textarea id="f-pres" data-f="pres" rows="4">' + esc(f.pres) + '</textarea><div class="ffield__count" id="pcount">' + f.pres.length + ' / 600 caractères</div></div>' +
      '<div class="ffield"><label for="f-parcours">Parcours et formation</label><textarea id="f-parcours" data-f="parcours" rows="3">' + esc(f.parcours) + '</textarea></div></div>' +
      '<div class="fcard"><div class="fcard__title">Lieu et modalités</div><div class="fgrid fgrid--200" style="margin-bottom:20px">' + field('adresse', 'Adresse du cabinet') + field('ville', 'Ville') + '</div>' +
      '<div style="margin-bottom:20px"><span class="flabel">Modes de séance</span>' + chips('modes', ['Cabinet', 'Visio', 'À domicile']) + '</div>' +
      '<div><span class="flabel">Langues parlées</span>' + chips('langs', ['Français', 'Anglais', 'Espagnol', 'Italien', 'LSF']) + '</div></div>' +
      '<div class="fcard"><div class="fcard__title" style="margin-bottom:6px">Photos</div><p class="fcard__lead" style="margin-top:0">Trois images suffisent : vous, le lieu, une séance. Format paysage, lumière naturelle. JPEG, PNG ou WebP : l’image est automatiquement allégée.</p>' +
      photosHtml() + '</div>' +
      '<div class="fcard fcard--last"><div class="fcard__title">Contact et liens</div><div class="fgrid fgrid--200">' + field('tel', 'Téléphone') + field('site', 'Site web') + field('insta', 'Instagram') + '</div></div>' +
      '<div class="fbtns"><button class="btn-dark2 btn-dark2--l" type="button" data-act="save-fiche">ENREGISTRER LES MODIFICATIONS</button><a class="btn-ghost2" href="' + pubUrl() + '">PRÉVISUALISER MA FICHE</a></div>';
  }

  /* ----- Messages ----- */
  var convId = Number(new URLSearchParams(location.search).get('c')) || 1;
  var draft = '';
  function convMessages(c, s) { return (c.messages || []).concat(s.proSentMsgs['p' + c.id] || []); }
  function secMessages() {
    return '<div class="sec-head"><h2>Messages</h2></div><div class="empty-note">Aucun message pour le moment. La messagerie avec les explorateurs sera activée avec les réservations.</div>';
  }
  function secMessagesDemo(d) {
    var s = d.s, convs = D.PRO_CONVOS;
    var active = convs.filter(function (c) { return c.id === convId; })[0] || convs[0];
    var list = convs.map(function (c) {
      var msgs = convMessages(c, s), last = msgs[msgs.length - 1], unread = c.unread && s.proReadConvs.indexOf('p' + c.id) === -1;
      return '<button class="conv' + (c.id === active.id ? ' is-on' : '') + (unread ? ' is-unread' : '') + '" type="button" data-act="conv" data-id="' + c.id + '"><div class="conv__avatar">' + c.initials + '</div><div style="min-width:0;flex:1"><div class="conv__top"><span class="conv__name">' + c.name + '</span><span class="conv__dot"></span><span class="conv__time">' + esc(last.time) + '</span></div><div class="conv__last">' + esc(last.text) + '</div></div></button>';
    }).join('');
    var thread = convMessages(active, s).map(function (m) {
      return '<div class="bubble-m bubble-m--' + (m.from === 'me' ? 'me' : 'them') + '"><div class="bubble-m__t">' + esc(m.text) + '</div><div class="bubble-m__time">' + esc(m.time) + '</div></div>';
    }).join('');
    return '<div class="sec-head"><h2>Messages</h2></div><div class="msgs"><div class="msgs__list">' + list + '</div><div class="msgs__thread"><div class="msgs__head"><div class="conv__avatar conv__avatar--on">' + active.initials + '</div><div style="min-width:0"><div class="msgs__name">' + active.name + '</div><div class="msgs__meta">' + active.meta + '</div></div></div>' +
      '<div class="msgs__body" id="thread">' + thread + '</div><div class="msgs__compose"><input id="draft" value="' + esc(draft) + '" placeholder="Écrire un message…" autocomplete="off"><button class="btn-dark2 btn-dark2--s" type="button" data-act="send">ENVOYER</button></div></div></div>';
  }

  /* ----- Notifications ----- */
  var notifFilter = 'all';
  var FILTERS = [['all', 'Tout'], ['resa', 'Réservations'], ['msg', 'Messages'], ['avis', 'Avis'], ['fact', 'Facturation'], ['fiche', 'Ma fiche']];
  function secNotifs() {
    return '<div class="sec-head"><h2>Notifications</h2></div><div class="empty-note">Rien de nouveau pour le moment.</div>';
  }
  function secNotifsDemo(d) {
    var s = d.s, all = D.proNotifs(s.plan), shown = all.filter(function (n) { return notifFilter === 'all' || n.type === notifFilter; }), groups = [];
    shown.forEach(function (n) { var g = groups.filter(function (x) { return x.day === n.day; })[0]; if (g) g.items.push(n); else groups.push({ day: n.day, items: [n] }); });
    return '<div class="sec-head" style="flex-wrap:wrap"><h2>Notifications</h2><button class="sec-link" type="button" data-act="read-all">Tout marquer comme lu</button></div>' +
      '<div class="nfilters">' + FILTERS.map(function (f) { return '<button class="nfilter' + (notifFilter === f[0] ? ' is-on' : '') + '" type="button" data-act="filter" data-f="' + f[0] + '">' + f[1] + '</button>'; }).join('') + '</div>' +
      groups.map(function (g) {
        return '<div class="ngroup"><div class="ngroup__day">' + g.day + '</div><div class="ngroup__list">' + g.items.map(function (n) {
          var unread = s.proNotifRead.indexOf(n.id) === -1, col = D.NOTIF_ACCENT[n.type];
          return '<button class="notif' + (unread ? ' is-unread' : '') + '" type="button" data-act="notif" data-id="' + n.id + '" style="border-left-color:' + col + '"><span class="notif__dot" style="background:' + (unread ? col : 'var(--border)') + '"></span><div class="notif__body"><div class="notif__title">' + n.title + '</div><div class="notif__text">' + n.text + '</div></div><span class="notif__time">' + n.time + '</span></button>';
        }).join('') + '</div></div>';
      }).join('') + (shown.length ? '' : '<div class="empty-note">Aucune notification dans cette catégorie.</div>');
  }

  /* ----- Modale « Ouvrir des créneaux » ----- */
  function modalHtml() {
    if (!modal) return '';
    if (modal === 'offer') return offerModal();
    if (modal === 'resa') return resaModal();
    if (modal === 'reply') {
      var av = db.avis.filter(function (x) { return x.id === replySel; })[0]; if (!av) return '';
      return '<div class="modal-back" data-act="close-bg"><div class="modal" role="dialog" aria-modal="true">' +
        '<div class="modal__k" style="color:var(--gold)">Avis de ' + esc(av.auteur_nom) + '</div><h3>Répondre</h3>' +
        '<p class="modal__lead" style="margin-bottom:10px">« ' + esc(av.commentaire) + ' »<br>Votre réponse sera publique et ne pourra plus être modifiée.</p>' +
        '<textarea id="reply-text" rows="4" maxlength="1200" style="width:100%;box-sizing:border-box;padding:12px;border:1px solid var(--border);font:inherit;margin-bottom:6px">' + esc(replyText) + '</textarea>' +
        '<div id="reply-warn" class="modal__lead" style="color:var(--rose);min-height:18px;margin:0 0 8px"></div>' +
        '<div class="modal__btns"><button class="btn-dark2" type="button" data-act="send-reply">PUBLIER MA RÉPONSE</button><button class="btn-ghost2" type="button" data-act="close">ANNULER</button></div></div></div>';
    }
    var n = slotDays.length * slotTimes.length;
    return '<div class="modal-back" data-act="close-bg"><div class="modal" role="dialog" aria-modal="true">' +
      '<div class="modal__k" style="color:var(--gold)">Agenda · semaine du ' + weekLabel() + '</div><h3>Ouvrir des créneaux</h3>' +
      '<p class="modal__lead">Choisissez les jours, puis les heures à rendre réservables. Les créneaux déjà réservés ne sont pas touchés.</p>' +
      '<div class="modal__group"><div class="modal__label">Jours</div><div class="chipset chipset--tight">' + weekDays().map(function (x) {
        var past = x < todayYmd();
        return '<button class="slotchip slotchip--day' + (slotDays.indexOf(x) !== -1 ? ' is-on' : '') + '" type="button" data-act="day" data-v="' + x + '"' + (past ? ' disabled style="opacity:.4;cursor:default"' : '') + ' aria-pressed="' + (slotDays.indexOf(x) !== -1) + '">' + dayLabel(x) + '</button>';
      }).join('') + '</div></div>' +
      '<div class="modal__group"><div class="modal__label">Heures</div><div class="chipset chipset--tight">' + D.POOL.map(function (x) {
        return '<button class="slotchip slotchip--time' + (slotTimes.indexOf(x) !== -1 ? ' is-on' : '') + '" type="button" data-act="time" data-v="' + x + '" aria-pressed="' + (slotTimes.indexOf(x) !== -1) + '">' + x + '</button>';
      }).join('') + '</div></div>' +
      '<button class="toggle-row' + (slotRepeat ? ' is-on' : '') + '" type="button" data-act="repeat" role="switch" aria-checked="' + slotRepeat + '"><span class="toggle"></span><span><div class="toggle-row__t">Répéter chaque semaine</div><div class="toggle-row__s">Ces horaires sont aussi ouverts les ' + WEEKS_AHEAD + ' semaines suivantes.</div></span></button>' +
      '<div class="modal__sum">' + n + ' créneaux à ouvrir' + (slotRepeat ? ' · répétés chaque semaine' : '') + '</div>' +
      '<div class="modal__btns--pro"><button class="btn-dark2" type="button" data-act="confirm-slots">OUVRIR CES CRÉNEAUX</button>' +
      '<button class="btn-ghost2" type="button" data-act="unavailable">POSER UNE INDISPONIBILITÉ</button>' +
      '<button class="modal__close" type="button" data-act="close">Fermer</button></div></div></div>';
  }

  /* ----- Rendu ----- */
  var SECTIONS = {
    dash: function (d) { return stats(d) + agenda(d) + resa(); },
    agenda: function (d) { return agenda(d); },
    resa: function () { return resa(); },
    avis: secAvis, offres: secOffres, abo: secAbo, fedit: secFiche, messages: secMessages, notifs: secNotifs
  };
  function render() {
    var d = derive();
    var fn = SECTIONS[section];
    root.innerHTML = sidebar(d) + '<div class="espace__main">' + banner(d) + (fn ? fn(d) : '') + '</div>' + aside(d) + modalHtml();
    var th = document.getElementById('thread'); if (th) th.scrollTop = th.scrollHeight;
  }
  
  /* ----- Actions ----- */
  function toggle(arr, v) { var i = arr.indexOf(v); if (i > -1) arr.splice(i, 1); else arr.push(v); }
  var ACTIONS = {
    logout: function () { HOL.Session.logout().then(function () { HOL.flash('Vous êtes déconnectée. À bientôt.'); location.href = 'index.html'; }); },
    'open-slots': function () { modal = true; slotDays = []; slotTimes = []; render(); },
    close: function () { modal = false; render(); },
    'open-resa': function (el) { resaSel = el.dataset.id; modal = 'resa'; render(); },
    'cancel-resa': function (el) {
      var m = document.getElementById('motif'), c = HOL.sb();
      if (!window.confirm('Annuler cette séance ? L’explorateur sera libéré de sa réservation.')) return;
      c.rpc('annuler_reservation', { p_id: el.dataset.id, p_motif: m ? m.value : null }).then(function (r) {
        if (r.error) throw r.error; return Promise.all([loadWeek(), loadResas()]);
      }).then(function () { modal = false; render(); HOL.toast('Séance annulée. Le créneau est bloqué dans votre agenda.'); })
        .catch(function (e) { HOL.toast(e && e.code === 'P0001' ? e.message : 'Annulation impossible pour le moment.'); });
    },
    day: function (el) { toggle(slotDays, el.dataset.v); render(); },
    time: function (el) { toggle(slotTimes, el.dataset.v); render(); },
    repeat: function () { slotRepeat = !slotRepeat; render(); },
    'confirm-slots': function () {
      if (!slotDays.length || !slotTimes.length) { HOL.toast('Choisissez au moins un jour et une heure.'); return; }
      var now = Date.now(), rows = [];
      for (var w = 0; w <= (slotRepeat ? WEEKS_AHEAD : 0); w++) {
        slotDays.forEach(function (day) {
          slotTimes.forEach(function (t) {
            var start = toIso(addDays(day, w * 7), t), end = new Date(new Date(start).getTime() + SLOT_MIN * 60000).toISOString();
            if (new Date(start).getTime() > now) rows.push({ praticien_id: db.uid, debut: start, fin: end });
          });
        });
      }
      if (!rows.length) { HOL.toast('Ces horaires sont déjà passés.'); return; }
      HOL.sb().from('creneaux').upsert(rows, { onConflict: 'praticien_id,debut', ignoreDuplicates: true }).then(function (r) {
        if (r.error) throw r.error;
        return loadWeek();
      }).then(function () {
        modal = false; slotDays = []; slotTimes = []; render();
        HOL.toast(rows.length + ' créneau' + (rows.length > 1 ? 'x' : '') + ' ouvert' + (rows.length > 1 ? 's' : '') + ' à la réservation.');
      }).catch(function () { HOL.toast('Impossible d’ouvrir ces créneaux (chevauchement ou connexion). Réessayez.'); });
    },
    unavailable: function () {
      if (!slotDays.length) { HOL.toast('Choisissez les jours à fermer.'); return; }
      var c = HOL.sb(), n = slotDays.length;
      Promise.all(slotDays.map(function (day) {
        return c.from('creneaux').delete().eq('praticien_id', db.uid).eq('statut', 'libre').gte('debut', toIso(day, '00:00')).lt('debut', toIso(addDays(day, 1), '00:00'));
      })).then(function (rs) {
        if (rs.some(function (r) { return r.error; })) throw new Error('db');
        return loadWeek();
      }).then(function () {
        modal = false; slotDays = []; slotTimes = []; render();
        HOL.toast(n + ' jour' + (n > 1 ? 's' : '') + ' fermé' + (n > 1 ? 's' : '') + ' : les créneaux libres ont été retirés.');
      }).catch(function () { HOL.toast('Impossible de fermer ces jours pour le moment.'); });
    },
    'close-slot': function (el) {
      HOL.sb().from('creneaux').delete().eq('id', el.dataset.id).eq('statut', 'libre').then(function (r) {
        if (r.error) throw r.error; return loadWeek();
      }).then(function () { render(); HOL.toast('Créneau fermé.'); }).catch(function () { HOL.toast('Impossible de fermer ce créneau.'); });
    },
    'week-prev': function () { db.week = addDays(db.week, -7); loadWeek().then(render).catch(function () { HOL.toast('Agenda indisponible pour le moment.'); }); },
    'week-next': function () { db.week = addDays(db.week, 7); loadWeek().then(render).catch(function () { HOL.toast('Agenda indisponible pour le moment.'); }); },
    'week-today': function () { db.week = mondayOf(todayYmd()); loadWeek().then(render).catch(function () { HOL.toast('Agenda indisponible pour le moment.'); }); },
    'open-reply': function (el) { replySel = el.dataset.id; replyText = ''; modal = 'reply'; render(); },
    'send-reply': function () {
      var t = document.getElementById('reply-text'), w = document.getElementById('reply-warn'); replyText = t ? t.value : replyText;
      if (replyText.trim().length < 5) { w.textContent = 'Écrivez quelques mots (5 caractères minimum).'; return; }
      HOL.sb().rpc('repondre_avis', { p_avis: replySel, p_texte: replyText }).then(function (r) {
        if (r.error) throw r.error; return loadResas();
      }).then(function () { modal = false; render(); HOL.toast('Votre réponse est publiée.'); })
        .catch(function (e) { var w2 = document.getElementById('reply-warn'); if (w2) w2.textContent = e && e.code === 'P0001' ? e.message : 'Publication impossible pour le moment.'; });
    },
    reply: function (el) { HOL.toast(el.dataset.done === 'true' ? 'Vous avez déjà répondu à cet avis.' : 'Réponse publiée sous l’avis de ' + el.dataset.who); },
    'add-offer': function () { offerForm = { id: null, nom: '', duree: '60', prix: '', mode: 'cabinet' }; modal = 'offer'; render(); var i = document.getElementById('o-nom'); if (i) i.focus(); },
    'edit-offer': function (el) {
      var o = db.prestations.filter(function (x) { return x.id === el.dataset.id; })[0]; if (!o) return;
      offerForm = { id: o.id, nom: o.nom, duree: String(o.duree_minutes), prix: String(o.prix_euros), mode: o.mode }; modal = 'offer'; render();
    },
    'save-offer': function () {
      var f = offerForm, nom = f.nom.trim(), duree = parseInt(f.duree, 10), prix = parseInt(f.prix, 10);
      if (nom.length < 2) { HOL.toast('Donnez un nom à la prestation.'); return; }
      if (!(duree >= 10 && duree <= 480)) { HOL.toast('La durée doit être comprise entre 10 et 480 minutes.'); return; }
      if (!(prix >= 0 && prix <= 2000)) { HOL.toast('Le tarif doit être compris entre 0 et 2000 €.'); return; }
      var t = HOL.sb().from('prestations'), body = { nom: nom, duree_minutes: duree, prix_euros: prix, mode: f.mode };
      var q = f.id ? t.update(body).eq('id', f.id)
        : t.insert(Object.assign({ praticien_id: db.uid, ordre: db.prestations.reduce(function (m, o) { return Math.max(m, o.ordre + 1); }, 0) }, body));
      q.then(function (r) { if (r.error) throw r.error; return loadOffers(); }).then(function () {
        modal = false; render(); HOL.toast(f.id ? 'Prestation mise à jour.' : 'Prestation ajoutée. Elle sera visible sur votre fiche une fois celle-ci publiée.');
      }).catch(function () { HOL.toast('Enregistrement impossible pour le moment. Réessayez.'); });
    },
    'del-offer': function (el) {
      var o = db.prestations.filter(function (x) { return x.id === el.dataset.id; })[0]; if (!o) return;
      if (!window.confirm('Supprimer « ' + o.nom + ' » ? Les séances déjà réservées ne sont pas modifiées.')) return;
      HOL.sb().from('prestations').update({ deleted_at: new Date().toISOString() }).eq('id', o.id).then(function (r) {
        if (r.error) throw r.error; return loadOffers();
      }).then(function () { render(); HOL.toast('Prestation supprimée.'); }).catch(function () { HOL.toast('Suppression impossible pour le moment.'); });
    },
    'toggle-offer': function (el) {
      var o = db.prestations.filter(function (x) { return x.id === el.dataset.id; })[0]; if (!o) return;
      HOL.sb().from('prestations').update({ masquee: !o.masquee }).eq('id', o.id).then(function (r) {
        if (r.error) throw r.error; return loadOffers();
      }).then(function () { render(); HOL.toast(o.masquee ? o.nom + ' est de nouveau visible sur votre fiche.' : o.nom + ' est masquée de votre fiche.'); })
        .catch(function () { HOL.toast('Modification impossible pour le moment.'); });
    },
    plan: function (el) {
      var key = el.dataset.key; if (!db.abo || db.abo.formule_choisie === key) return;
      HOL.sb().rpc('choisir_formule', { p_formule: key }).then(function (r) {
        if (r.error) throw r.error; db.abo.formule_choisie = key; render(); HOL.toast((key === 'continu' ? 'Fil Continu' : 'Fil Libre') + ' enregistrée. Vous ne serez prélevée qu’à la fin du mois d’essai.');
      }).catch(function () { HOL.toast('Enregistrement impossible pour le moment.'); });
    },
    invoices: function () { HOL.toast('Factures exportées en PDF.'); },
    'pay-method': function () {
      var s = st(); s.payMethod = s.payMethod === 'card' ? 'sepa' : 'card'; save(s); render();
      HOL.toast(s.payMethod === 'card' ? 'Moyen de prélèvement : carte bancaire.' : 'Moyen de prélèvement : prélèvement SEPA.');
    },
    fchip: function (el) { var a = fiche[el.dataset.key], v = el.dataset.v, i = a.indexOf(v); if (i > -1) a.splice(i, 1); else a.push(v); render(); },
    photo: function (el) {
      if (!ficheDb) { HOL.toast('Photos indisponibles tant que la base est injoignable.'); return; }
      photoKey = el.dataset.k; var i = document.getElementById('photo-file'); if (i) { i.value = ''; i.click(); }
    },
    'photo-del': function (el) { removePhoto(el.dataset.k); },
    'save-fiche': saveFiche,
    publish: function () {
      persistFiche().then(function () { return setStatut('en_ligne', 'Votre fiche est en ligne. Les explorateurs peuvent maintenant la trouver.'); })
        .catch(function (e) { HOL.toast(e && e.pub ? e.message : 'Publication impossible pour le moment. Réessayez dans un instant.'); });
    },
    unpublish: function () {
      if (!window.confirm('Retirer votre fiche de la recherche ? Elle repasse en brouillon, vos données sont conservées.')) return;
      setStatut('brouillon', 'Votre fiche est retirée de la recherche.').catch(function () { HOL.toast('Modification impossible pour le moment.'); });
    },
    conv: function (el) {
      var s = st(), id = Number(el.dataset.id), key = 'p' + id;
      if (s.proReadConvs.indexOf(key) === -1) { s.proReadConvs.push(key); save(s); }
      convId = id; draft = ''; history.replaceState(null, '', location.pathname + '?c=' + id); render();
    },
    send: function () {
      var input = document.getElementById('draft'), text = (input ? input.value : draft).trim();
      if (!text) return;
      var s = st(), key = 'p' + convId; s.proSentMsgs[key] = (s.proSentMsgs[key] || []).concat([{ from: 'me', text: text, time: 'À l’instant' }]);
      save(s); draft = ''; render(); var i = document.getElementById('draft'); if (i) i.focus();
    },
    filter: function (el) { notifFilter = el.dataset.f; render(); },
    'read-all': function () { var s = st(); s.proNotifRead = D.proNotifs(s.plan).map(function (n) { return n.id; }); save(s); render(); HOL.toast('Toutes vos notifications sont marquées comme lues.'); },
    notif: function (el) {
      var s = st(), n = D.proNotifs(s.plan).filter(function (x) { return x.id === el.dataset.id; })[0];
      if (s.proNotifRead.indexOf(n.id) === -1) { s.proNotifRead.push(n.id); save(s); }
      location.href = n.go;
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    root.addEventListener('change', function (e) { if (e.target.id === 'photo-file' && e.target.files[0]) uploadPhoto(e.target.files[0]); });
    root.addEventListener('click', function (e) {
      var el = e.target.closest('[data-act]'); if (!el) return;
      if (el.dataset.act === 'close-bg') { if (e.target === el) ACTIONS.close(); return; }
      var fn = ACTIONS[el.dataset.act]; if (fn) fn(el);
    });
    root.addEventListener('input', function (e) {
      var t = e.target;
      if (t.id === 'draft') { draft = t.value; return; }
      if (t.dataset.of) { offerForm[t.dataset.of] = t.value; return; }
      if (!t.dataset.f) return;
      fiche[t.dataset.f] = t.value;
      var done = [fiche.nom, fiche.disc, fiche.pres, fiche.parcours, fiche.adresse, fiche.ville, fiche.tel, fiche.site].filter(function (v) { return v && v.trim(); }).length;
      var c = document.getElementById('fcount'); if (c) c.textContent = done + ' / 8 champs renseignés';
      var p = document.getElementById('pcount'); if (p) p.textContent = fiche.pres.length + ' / 600 caractères';
    });
    root.addEventListener('change', function (e) { if (e.target.dataset.of) offerForm[e.target.dataset.of] = e.target.value; if (e.target.dataset.f === 'disc') fiche.disc = e.target.value; });
    root.addEventListener('keydown', function (e) { if (e.target.id === 'draft' && e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ACTIONS.send(); } });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modal) ACTIONS.close(); });
    render();
    loadAll().then(render);
    syncVille();
  });
})();
