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

  function derive() {
    var s = st(), slots = HOL.Store.slots()[1];
    var confirmed = s.bookings.filter(function (b) { return b.status === 'confirmed'; }).length;
    var free = D.DATES.reduce(function (a, d) { return a + (slots[d] || []).length; }, 0);
    return { s: s, slots: slots, confirmed: confirmed, free: free, empty: free === 0 };
  }

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
    var unreadMsg = D.PRO_CONVOS.filter(function (c) { return c.unread && d.s.proReadConvs.indexOf('p' + c.id) === -1; }).length;
    var unreadNot = D.proNotifs(d.s.plan).filter(function (n) { return d.s.proNotifRead.indexOf(n.id) === -1; }).length;
    return '<aside class="sidenav sidenav--pro">' +
      '<div class="sidenav__group"><div class="sidenav__title">Navigation</div>' +
      item('Tableau de bord', 'dash', 'espace-praticien.html') + item('Mon agenda', 'agenda', 'pro-agenda.html') +
      item('Réservations', 'resa', 'pro-reservations.html', String(d.confirmed)) + item('Avis reçus', 'avis', 'pro-avis.html', '2') +
      item('Messages', 'messages', 'pro-messages.html', unreadMsg ? String(unreadMsg) : '') +
      item('Notifications', 'notifs', 'pro-notifications.html', unreadNot ? String(unreadNot) : '') + '</div>' +
      '<div class="sidenav__group"><div class="sidenav__title">Ma pratique</div>' +
      item('Modifier ma fiche', 'fedit', 'pro-fiche.html') + item('Mes prestations', 'offres', 'pro-prestations.html') +
      item('Ma fiche publique', 'public', 'praticien.html?id=1&from=pro') + '</div>' +
      '<div class="sidenav__group"><div class="sidenav__title">Compte</div>' +
      item('Abonnement &amp; factures', 'abo', 'pro-abonnement.html') +
      '<button class="sidenav__item sidenav__item--out" type="button" data-act="logout"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="' + ICO.out[0] + '"></path><path d="' + ICO.out[1] + '"></path></svg><span>Déconnexion</span></button></div>' +
      '<div class="sidenav__user"><div class="sidenav__avatar">' + HOL.esc(HOL.who().initials) + '</div><div><div class="sidenav__name">' + HOL.esc(HOL.who().full) + '</div><div class="sidenav__role">Praticienne · Lyon 3e</div></div></div></aside>';
  }

  /* ----- Bandeau ----- */
  function banner(d) {
    return '<div class="banner banner--rose"><img src="assets/logo-dreamcatcher-ivory.png" alt="">' +
      '<div class="banner__text"><div class="banner__date">Semaine du 31 août 2026</div>' +
      '<h1>Bonjour ' + HOL.esc(HOL.who().first) + ',<br><em>votre semaine est ouverte.</em></h1>' +
      '<p>' + d.confirmed + ' séances réservées cette semaine · ' + d.free + ' créneaux encore libres.</p></div>' +
      '<div class="banner__btns"><button class="btn-line-light" type="button" data-act="open-slots">OUVRIR DES CRÉNEAUX</button>' +
      '<a class="btn-dark2" href="praticien.html?id=1&from=pro">VOIR MA FICHE PUBLIQUE</a></div></div>';
  }

  /* ----- Blocs ----- */
  function stats(d) {
    var items = [
      [d.confirmed, 'réservations cette semaine', 'var(--olive)'], [d.free, 'créneaux encore libres', 'var(--slate)'],
      ['4.9', 'note moyenne · 128 avis', 'var(--gold)'], ['412', 'vues de votre fiche ce mois-ci', 'var(--rose)']
    ];
    return '<div class="pstats">' + items.map(function (i) {
      return '<div class="pstat"><div class="pstat__n" style="color:' + i[2] + '">' + i[0] + '</div><div class="pstat__label">' + i[1] + '</div></div>';
    }).join('') + '</div>';
  }
  function agenda(d) {
    var rows = D.POOL.map(function (t) {
      return '<div class="agenda-row"><div class="agenda-row__t">' + t + '</div>' + D.DATES.map(function (day) {
        var b = d.s.bookings.filter(function (x) { return x.date === day && x.time === t && x.status !== 'cancelled'; })[0];
        var c;
        if (b) c = { bg: 'var(--olive-bg)', bd: 'var(--olive)', c1: 'var(--olive)', c2: 'var(--olive)', a: esc(b.client), b: esc(b.offer) };
        else if ((d.slots[day] || []).indexOf(t) !== -1) c = { bg: 'var(--white)', bd: 'var(--border)', c1: 'var(--slate-lt)', c2: 'transparent', a: 'Libre', b: '·' };
        else c = { bg: 'var(--ivory-2)', bd: 'var(--ivory-2)', c1: 'var(--slate-lt)', c2: 'transparent', a: '—', b: '·' };
        return '<div class="acell" style="background:' + c.bg + ';border-color:' + c.bd + '"><div class="acell__a" style="color:' + c.c1 + '">' + c.a + '</div><div class="acell__b" style="color:' + c.c2 + '">' + c.b + '</div></div>';
      }).join('') + '</div>';
    }).join('');
    var legend = [['Réservé', 'var(--olive-bg)', 'var(--olive)'], ['Libre', 'var(--white)', 'var(--border)'], ['Fermé', 'var(--ivory-2)', 'var(--ivory-2)']];
    return '<div class="card-pro card-pro--scroll"><div class="card-pro__head"><div class="card-pro__title">Agenda</div>' +
      (d.empty ? '<button class="btn-rose btn-rose--s" type="button" data-act="open-slots">OUVRIR DES CRÉNEAUX</button>' : '') +
      '<div class="legend">' + legend.map(function (g) { return '<span><i style="background:' + g[1] + ';border-color:' + g[2] + '"></i>' + g[0] + '</span>'; }).join('') + '</div></div>' +
      '<div class="agenda-grid"><div class="agenda-row"><div></div>' + D.DATES.map(function (x) { return '<div class="agenda-row__h">' + x + '</div>'; }).join('') + '</div>' + rows + '</div></div>';
  }
  function resa(d) {
    var rows = d.s.bookings.slice().reverse().map(function (b) {
      var ok = b.status === 'confirmed';
      return '<div class="rrow"><div class="rrow__avatar">' + esc(b.initials) + '</div><div class="rrow__body"><div class="rrow__client">' + esc(b.client) + '</div>' +
        '<div class="rrow__meta">' + esc(b.date) + ' · ' + esc(b.time) + ' · ' + esc(b.offer) + '</div></div>' +
        '<div class="rrow__pay">' + esc(b.payment) + '</div><span class="badge-s badge-s--' + b.status + '">' + (ok ? '✓ Confirmé' : '✕ Annulé') + '</span></div>';
    }).join('');
    return '<div class="card-pro"><div class="card-pro__head"><div class="card-pro__title">Réservations</div><div class="card-pro__count">' + d.confirmed + ' confirmées</div></div>' + rows + '</div>';
  }


  /* ----- Colonne de droite (toutes les pages de l'espace praticien) ----- */
  function aside(d) {
    var today = [
      { time: '10h30', client: 'Sarah Nguyen', offer: 'Massage bien-être · 60 min', color: 'var(--olive)' },
      { time: '14h00', client: 'Marc Bellanger', offer: 'Massage dos & nuque · 45 min', color: 'var(--olive)' },
      { time: '17h00', client: 'Créneau libre', offer: 'Ouvert à la réservation', color: 'var(--slate-lt)' }
    ];
    var compl = [['Photo de profil', 1], ['Présentation et parcours', 1], ['Adresse du cabinet', 1], ['Photos du lieu', 0], ['Diplômes et certifications', 0]];
    var notifs = [
      { title: 'Nouvelle réservation', text: '— Sarah Nguyen, mercredi 9 septembre à 14h', time: 'Il y a 1 h', dot: 'var(--rose)' },
      { title: 'Avis reçu', text: '— Marc B. vous a laissé 5 étoiles', time: 'Hier', dot: 'var(--rose)' },
      { title: 'Prélèvement', text: '— formule ' + d.s.plan + ' le 1er septembre', time: 'Il y a 4 jours', dot: 'var(--border)' }
    ];
    return '<aside class="rside"><div class="rside__block"><div class="rside__title" style="margin-bottom:14px">Aujourd\'hui</div>' +
      today.map(function (x) { return '<div class="today"><span class="today__t">' + x.time + '</span><div style="min-width:0"><div class="today__c">' + x.client + '</div><div class="today__o" style="color:' + x.color + '">' + x.offer + '</div></div></div>'; }).join('') +
      '<div class="today-sub">Mardi 2 septembre · 1 h 45 de pratique</div></div>' +
      '<div class="rside__block"><div class="rside__row" style="margin-bottom:10px"><span class="rside__label">Complétude de ma fiche</span><span style="font-size:11px;color:var(--gold)">80%</span></div>' +
      '<div class="compl__bar"><div style="width:80%"></div></div>' +
      compl.map(function (c) { return '<div class="compl__item"><span style="color:' + (c[1] ? 'var(--olive)' : 'var(--slate-lt)') + '">' + (c[1] ? '✓' : '○') + '</span><span style="color:' + (c[1] ? 'var(--slate-md)' : 'var(--slate-lt)') + '">' + c[0] + '</span></div>'; }).join('') +
      '<a class="btn-dark2" href="pro-fiche.html" style="margin-top:12px">Compléter ma fiche →</a></div>' +
      '<div><div class="rside__row"><span class="rside__label">Notifications</span><a class="rside__more" href="pro-notifications.html">Tout voir</a></div>' +
      notifs.map(function (n) { return '<div class="anotif"><div class="anotif__dot" style="background:' + n.dot + '"></div><div><div class="anotif__text"><strong>' + n.title + '</strong> ' + n.text + '</div><div class="anotif__time">' + n.time + '</div></div></div>'; }).join('') + '</div></aside>';
  }

  /* ----- Avis reçus ----- */
  function secAvis() {
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
  var OFFERS = [
    { name: 'Massage bien-être', duration: '60 min', mode: 'Au cabinet', price: '70 €', color: 'var(--olive)' },
    { name: 'Massage dos & nuque', duration: '45 min', mode: 'Au cabinet', price: '55 €', color: 'var(--olive)' },
    { name: 'Séance longue · relâchement profond', duration: '90 min', mode: 'Au cabinet', price: '100 €', color: 'var(--olive)' },
    { name: 'Bilan de posture', duration: '30 min', mode: 'Visio', price: '35 €', color: 'var(--gold)' }
  ];
  function secOffres(d) {
    return '<div class="sec-head" style="align-items:baseline"><h2>Mes prestations</h2><button class="sec-link" type="button" data-act="add-offer">Ajouter une prestation →</button></div>' +
      '<div class="hlist">' + OFFERS.map(function (o, i) {
        var off = d.s.offersOff.indexOf(o.name) !== -1;
        return '<div class="offer-row"><span class="offer-row__bar" style="background:' + o.color + '"></span><div class="offer-row__body"><div class="offer-row__name">' + o.name + '</div><div class="offer-row__meta">' + o.duration + ' · ' + o.mode + '</div></div>' +
          '<div class="offer-row__price">' + o.price + '</div><button class="state-btn' + (off ? ' is-off' : '') + '" type="button" data-act="toggle-offer" data-i="' + i + '" aria-pressed="' + (!off) + '">' + (off ? 'Masquée' : 'En ligne') + '</button></div>';
      }).join('') + '</div>';
  }

  /* ----- Abonnement & factures ----- */
  var INVOICES = [['Août 2026', 'HOL-2608-0412'], ['Juillet 2026', 'HOL-2607-0412'], ['Juin 2026', 'HOL-2606-0412'], ['Mai 2026', 'HOL-2605-0412']];
  function secAbo(d) {
    var card = d.s.payMethod === 'card';
    return '<div class="abo-grid"><div class="abo-col"><div class="abo-box"><h2>Abonnement</h2>' +
      '<p class="abo-box__lead">Aucune commission sur vos séances. Vous réglez un forfait mensuel, résiliable à tout moment.</p>' +
      '<div class="stack-10">' + D.PLANS.map(function (pl) {
        var on = d.s.plan === pl.name;
        return '<button class="plan-row' + (on ? ' is-on' : '') + '" type="button" data-act="plan" data-name="' + pl.name + '" aria-pressed="' + on + '"><div><div class="plan-row__name">' + pl.name + '</div><div class="plan-row__desc">' + pl.desc + '</div><div class="plan-row__state">' + (on ? 'Formule active' : 'Choisir') + '</div></div><div class="plan-row__price">' + pl.price + '</div></button>';
      }).join('') + '</div><div class="abo-foot">Formule ' + d.s.plan + ' · sans engagement, résiliable en un clic.</div></div>' +
      '<div class="abo-box"><div class="abo-head"><h2>Facturation</h2><button class="link-s" type="button" data-act="invoices">Tout télécharger</button></div>' +
      '<div class="pay-card"><div><div class="pay-card__t">' + (card ? 'Carte bancaire · Visa •••• 4218' : 'Prélèvement SEPA · FR76 •••• 3390') + '</div><div class="pay-card__s">' + (card ? 'Expire 04/29 · prélèvement le 1er de chaque mois' : 'Mandat signé le 12 mai 2026 · prélèvement le 1er de chaque mois') + '</div></div><button type="button" data-act="pay-method">MODIFIER</button></div>' +
      INVOICES.map(function (i) { return '<div class="invoice"><div><div class="invoice__m">' + i[0] + '</div><div class="invoice__r">' + i[1] + '</div></div><div class="invoice__a"><span>11,99 €</span><button class="link-s link-s--mute" type="button" data-act="invoices">PDF</button></div></div>'; }).join('') + '</div></div></div>';
  }

  /* ----- Modifier ma fiche ----- */
  var fiche = null;
  var MAIN_SPECS = ['Naturopathie', 'Sophrologie', 'Kinésiologie', 'Ostéopathie', 'Hypnothérapie', 'Massage bien-être', 'Reiki', 'EFT', 'PNL', 'Yoga', 'Réflexologie', 'Autre'];
  var COMP_SPECS = ['Phytothérapie', 'Iridologie', 'Breathwork', 'Janzu / Watsu', 'Aromathérapie', 'Nutrition', 'Coaching mental', 'Astrologie', 'Chamanisme'];
  function chips(key, options) {
    return '<div class="chipset">' + options.map(function (o) {
      var on = fiche[key].indexOf(o) !== -1;
      return '<button class="chipbtn chipbtn--s' + (on ? ' is-on' : '') + '" type="button" data-act="fchip" data-key="' + key + '" data-v="' + esc(o) + '" aria-pressed="' + on + '">' + o + '</button>';
    }).join('') + '</div>';
  }
  function field(k, label) { return '<div class="ffield"><label for="f-' + k + '">' + label + '</label><input id="f-' + k + '" data-f="' + k + '" value="' + esc(fiche[k]) + '"></div>'; }
  function secFiche(d) {
    if (!fiche) fiche = JSON.parse(JSON.stringify(d.s.fiche));
    var f = fiche, done = [f.nom, f.disc, f.pres, f.parcours, f.adresse, f.ville, f.tel, f.site].filter(function (v) { return v && v.trim(); }).length;
    return '<div class="sec-head" style="flex-wrap:wrap"><h2>Modifier ma fiche</h2><div class="card-pro__count" id="fcount">' + done + ' / 8 champs renseignés</div></div>' +
      '<div class="fcard"><div class="fcard__title">Identité</div><div class="fgrid">' + field('nom', 'Nom affiché') +
      '<div class="ffield"><label for="f-disc">Discipline principale</label><select id="f-disc" data-f="disc">' + MAIN_SPECS.map(function (o) { return '<option' + (o === f.disc ? ' selected' : '') + '>' + o + '</option>'; }).join('') + '</select></div></div>' +
      '<div class="fblock"><span class="flabel">Disciplines complémentaires</span>' + chips('comp', COMP_SPECS) + '</div></div>' +
      '<div class="fcard"><div class="fcard__title">Présentation</div><div class="ffield" style="margin-bottom:18px"><label for="f-pres">Ce que vous proposez</label><textarea id="f-pres" data-f="pres" rows="4">' + esc(f.pres) + '</textarea><div class="ffield__count" id="pcount">' + f.pres.length + ' / 600 caractères</div></div>' +
      '<div class="ffield"><label for="f-parcours">Parcours et formation</label><textarea id="f-parcours" data-f="parcours" rows="3">' + esc(f.parcours) + '</textarea></div></div>' +
      '<div class="fcard"><div class="fcard__title">Lieu et modalités</div><div class="fgrid fgrid--200" style="margin-bottom:20px">' + field('adresse', 'Adresse du cabinet') + field('ville', 'Ville') + '</div>' +
      '<div style="margin-bottom:20px"><span class="flabel">Modes de séance</span>' + chips('modes', ['Cabinet', 'Visio', 'À domicile']) + '</div>' +
      '<div><span class="flabel">Langues parlées</span>' + chips('langs', ['Français', 'Anglais', 'Espagnol', 'Italien', 'LSF']) + '</div></div>' +
      '<div class="fcard"><div class="fcard__title" style="margin-bottom:6px">Photos</div><p class="fcard__lead" style="margin-top:0">Trois images suffisent : vous, le lieu, une séance. Format paysage, lumière naturelle.</p>' +
      '<div class="photos">' + ['Photo principale', 'Le cabinet', 'En séance'].map(function (n) {
        return '<button class="photo-slot" type="button" data-act="photo"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--slate-lt)" stroke-width="1.4" stroke-linecap="round"><path d="M12 5v14 M5 12h14"></path></svg><span>' + n + '</span></button>';
      }).join('') + '</div></div>' +
      '<div class="fcard fcard--last"><div class="fcard__title">Contact et liens</div><div class="fgrid fgrid--200">' + field('tel', 'Téléphone') + field('site', 'Site web') + field('insta', 'Instagram') + '</div></div>' +
      '<div class="fbtns"><button class="btn-dark2 btn-dark2--l" type="button" data-act="save-fiche">ENREGISTRER LES MODIFICATIONS</button><a class="btn-ghost2" href="praticien.html?id=1&from=pro">PRÉVISUALISER MA FICHE</a></div>';
  }

  /* ----- Messages ----- */
  var convId = Number(new URLSearchParams(location.search).get('c')) || 1;
  var draft = '';
  function convMessages(c, s) { return (c.messages || []).concat(s.proSentMsgs['p' + c.id] || []); }
  function secMessages(d) {
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
  function secNotifs(d) {
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
    var n = slotDays.length * slotTimes.length;
    return '<div class="modal-back" data-act="close-bg"><div class="modal" role="dialog" aria-modal="true">' +
      '<div class="modal__k" style="color:var(--gold)">Agenda · semaine du 31 août</div><h3>Ouvrir des créneaux</h3>' +
      '<p class="modal__lead">Choisissez les jours, puis les heures à rendre réservables. Les créneaux déjà réservés ne sont pas touchés.</p>' +
      '<div class="modal__group"><div class="modal__label">Jours</div><div class="chipset chipset--tight">' + D.DATES.map(function (x) {
        return '<button class="slotchip slotchip--day' + (slotDays.indexOf(x) !== -1 ? ' is-on' : '') + '" type="button" data-act="day" data-v="' + x + '" aria-pressed="' + (slotDays.indexOf(x) !== -1) + '">' + x + '</button>';
      }).join('') + '</div></div>' +
      '<div class="modal__group"><div class="modal__label">Heures</div><div class="chipset chipset--tight">' + D.POOL.map(function (x) {
        return '<button class="slotchip slotchip--time' + (slotTimes.indexOf(x) !== -1 ? ' is-on' : '') + '" type="button" data-act="time" data-v="' + x + '" aria-pressed="' + (slotTimes.indexOf(x) !== -1) + '">' + x + '</button>';
      }).join('') + '</div></div>' +
      '<button class="toggle-row' + (slotRepeat ? ' is-on' : '') + '" type="button" data-act="repeat" role="switch" aria-checked="' + slotRepeat + '"><span class="toggle"></span><span><div class="toggle-row__t">Répéter chaque semaine</div><div class="toggle-row__s">Ces horaires deviennent votre trame hebdomadaire.</div></span></button>' +
      '<div class="modal__sum">' + n + ' créneaux à ouvrir' + (slotRepeat ? ' · répétés chaque semaine' : '') + '</div>' +
      '<div class="modal__btns--pro"><button class="btn-dark2" type="button" data-act="confirm-slots">OUVRIR CES CRÉNEAUX</button>' +
      '<button class="btn-ghost2" type="button" data-act="unavailable">POSER UNE INDISPONIBILITÉ</button>' +
      '<button class="modal__close" type="button" data-act="close">Fermer</button></div></div></div>';
  }

  /* ----- Rendu ----- */
  var SECTIONS = {
    dash: function (d) { return stats(d) + agenda(d) + resa(d); },
    agenda: function (d) { return agenda(d); },
    resa: function (d) { return resa(d); },
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
    day: function (el) { toggle(slotDays, el.dataset.v); render(); },
    time: function (el) { toggle(slotTimes, el.dataset.v); render(); },
    repeat: function () { slotRepeat = !slotRepeat; render(); },
    'confirm-slots': function () {
      if (!slotDays.length || !slotTimes.length) { HOL.toast('Choisissez au moins un jour et une heure.'); return; }
      var s = st(), cur = HOL.Store.slots()[1], n = slotDays.length * slotTimes.length;
      slotDays.forEach(function (day) {
        var merged = (cur[day] || []).concat(slotTimes.filter(function (t) { return (cur[day] || []).indexOf(t) < 0; }));
        s.agenda1[day] = D.POOL.filter(function (t) { return merged.indexOf(t) > -1; });
        s.booked = s.booked.filter(function (b) { return !(b.pratId === 1 && b.date === day && slotTimes.indexOf(b.time) !== -1); });
      });
      save(s); modal = false; slotDays = []; slotTimes = []; render();
      HOL.toast(n + ' créneaux ouverts à la réservation.');
    },
    unavailable: function () {
      if (!slotDays.length) { HOL.toast('Choisissez les jours à fermer.'); return; }
      var s = st(), n = slotDays.length;
      slotDays.forEach(function (day) { s.agenda1[day] = []; });
      save(s); modal = false; slotDays = []; slotTimes = []; render();
      HOL.toast('Indisponibilité posée sur ' + n + ' jour(s).');
    },
    reply: function (el) { HOL.toast(el.dataset.done === 'true' ? 'Vous avez déjà répondu à cet avis.' : 'Réponse publiée sous l’avis de ' + el.dataset.who); },
    'add-offer': function () { HOL.toast('Nouvelle prestation : à compléter depuis votre fiche.'); },
    'toggle-offer': function (el) {
      var o = OFFERS[Number(el.dataset.i)], s = st(), i = s.offersOff.indexOf(o.name);
      if (i > -1) s.offersOff.splice(i, 1); else s.offersOff.push(o.name);
      save(s); render(); HOL.toast(i > -1 ? o.name + ' est de nouveau visible sur votre fiche.' : o.name + ' est masquée de votre fiche.');
    },
    plan: function (el) { var s = st(); s.plan = el.dataset.name; save(s); render(); HOL.toast('Formule ' + el.dataset.name + ' active dès le prochain prélèvement.'); },
    invoices: function () { HOL.toast('Factures exportées en PDF.'); },
    'pay-method': function () {
      var s = st(); s.payMethod = s.payMethod === 'card' ? 'sepa' : 'card'; save(s); render();
      HOL.toast(s.payMethod === 'card' ? 'Moyen de prélèvement : carte bancaire.' : 'Moyen de prélèvement : prélèvement SEPA.');
    },
    fchip: function (el) { var a = fiche[el.dataset.key], v = el.dataset.v, i = a.indexOf(v); if (i > -1) a.splice(i, 1); else a.push(v); render(); },
    photo: function () { HOL.toast('Ajout de photos bientôt disponible.'); },
    'save-fiche': function () { var s = st(); s.fiche = JSON.parse(JSON.stringify(fiche)); save(s); HOL.toast('Fiche mise à jour. Les modifications sont en ligne.'); },
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
    root.addEventListener('click', function (e) {
      var el = e.target.closest('[data-act]'); if (!el) return;
      if (el.dataset.act === 'close-bg') { if (e.target === el) ACTIONS.close(); return; }
      var fn = ACTIONS[el.dataset.act]; if (fn) fn(el);
    });
    root.addEventListener('input', function (e) {
      var t = e.target;
      if (t.id === 'draft') { draft = t.value; return; }
      if (!t.dataset.f) return;
      fiche[t.dataset.f] = t.value;
      var done = [fiche.nom, fiche.disc, fiche.pres, fiche.parcours, fiche.adresse, fiche.ville, fiche.tel, fiche.site].filter(function (v) { return v && v.trim(); }).length;
      var c = document.getElementById('fcount'); if (c) c.textContent = done + ' / 8 champs renseignés';
      var p = document.getElementById('pcount'); if (p) p.textContent = fiche.pres.length + ' / 600 caractères';
    });
    root.addEventListener('change', function (e) { if (e.target.dataset.f === 'disc') fiche.disc = e.target.value; });
    root.addEventListener('keydown', function (e) { if (e.target.id === 'draft' && e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ACTIONS.send(); } });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modal) ACTIONS.close(); });
    render();
  });
})();
