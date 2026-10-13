/* Holisanna — en-tête, pied de page, session de démonstration et toasts.
   Chaque page contient <div id="site-header"></div> et <div id="site-footer"></div>,
   et indique son entrée de menu active via <body data-nav="accueil|recherche|espace|pro">. */
(function () {
  'use strict';
  var KEY = 'holisanna.session';

  /* ----- Session (démo : stockée dans le navigateur, à remplacer par la vraie authentification) ----- */
  var Session = {
    get: function () {
      try { return JSON.parse(localStorage.getItem(KEY)) || { loggedIn: false, role: 'explorateur' }; }
      catch (e) { return { loggedIn: false, role: 'explorateur' }; }
    },
    set: function (s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} },
    login: function (role) { Session.set({ loggedIn: true, role: role || 'explorateur' }); },
    logout: function () { Session.set({ loggedIn: false, role: 'explorateur' }); }
  };


  /* ----- Magasin de démonstration : créneaux réservés, séances, réservations -----
     Stocké dans le navigateur ; à remplacer par la base de données (Supabase…). */
  var SKEY = 'holisanna.state.v2';
  var Store = {
    get: function () {
      var D = window.HOL_DATA;
      var base = {
        booked: [], sessions: JSON.parse(JSON.stringify(D.DEMO_SESSIONS)), bookings: JSON.parse(JSON.stringify(D.DEMO_BOOKINGS)),
        explPrefs: ['Corps', 'Esprit', 'Séances en cabinet', 'Français', 'Budget ≤ 90 €'], plan: 'Fil Libre', reviewed: [1, 2],
        notifRead: [], readConvs: [], sentMsgs: {},
        agenda1: {}, proNotifRead: [], proReadConvs: [], proSentMsgs: {}, offersOff: [], payMethod: 'card',
        fiche: {
          nom: 'Camille Ferrand', disc: 'Massage bien-être', comp: ['Breathwork'], modes: ['Cabinet'], langs: ['Français', 'Anglais'],
          pres: 'Massage tissulaire lent, à l’écoute du souffle. Je travaille surtout avec des personnes qui sortent d’une période tendue : le rythme est posé, la pression s’ajuste séance après séance.',
          parcours: 'Formée à l’école de massage de Lyon (2017). 9 ans de pratique, dont 4 en cabinet partagé. Formation continue en anatomie palpatoire.',
          adresse: '14 rue Bellecombe', ville: 'Lyon 3e', tel: '+33 6 71 42 08 33', site: 'camille-ferrand.fr', insta: '@camille.ferrand.massage'
        },
        explProfile: { nom: 'Sarah Nguyen', email: 'sarah.nguyen@email.com', tel: '+33 6 24 81 09 55', naissance: '14 mars 1991', ville: 'Paris 11e' },
        rdv: { day: '9', month: 'Septembre', when: 'Mercredi · 14h00 — 15h30', cancelled: false }
      };
      try { var s = JSON.parse(localStorage.getItem(SKEY)); if (s) return Object.assign(base, s); } catch (e) {}
      return base;
    },
    set: function (s) { try { localStorage.setItem(SKEY, JSON.stringify(s)); } catch (e) {} },
    /* Agenda de tous les praticiens, créneaux déjà réservés retirés */
    slots: function () {
      var slots = window.HOL_DATA.makeSlots();
      var st = Store.get();
      Object.keys(st.agenda1 || {}).forEach(function (date) { slots[1][date] = st.agenda1[date].slice(); });   /* agenda de Camille Ferrand, modifiable depuis son espace */
      st.booked.forEach(function (b) {
        if (slots[b.pratId] && slots[b.pratId][b.date]) {
          slots[b.pratId][b.date] = slots[b.pratId][b.date].filter(function (t) { return t !== b.time; });
        }
      });
      return slots;
    },
    book: function (prat, date, time) {
      var s = Store.get();
      s.booked.push({ pratId: prat.id, date: date, time: time });
      s.sessions.push({ discipline: prat.discipline, pillar: prat.pillar, prat: prat.name, date: date.replace(/^[A-Za-zÀ-ÿ]+ /, ''), price: prat.price + ' €' });
      s.bookings.push({ client: 'Sarah Nguyen', initials: 'SN', date: date, time: time, offer: prat.discipline, payment: 'Sur place', status: 'confirmed' });
      Store.set(s);
    }
  };

  /* ----- Message « flash » : affiché au chargement de la page suivante ----- */
  function flash(msg) { try { sessionStorage.setItem('holisanna.flash', msg); } catch (e) {} }

  /* ----- Toast ----- */
  var toastTimer;
  function toast(msg) {
    var el = document.getElementById('toast');
    if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.textContent = msg; el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, 2800);
  }

  /* ----- En-tête ----- */
  function renderHeader() {
    var host = document.getElementById('site-header');
    if (!host) return;
    var s = Session.get();
    var active = document.body.getAttribute('data-nav');
    function item(key, label, href) {
      return '<a href="' + href + '"' + (active === key ? ' aria-current="page"' : '') + '>' + label + '</a>';
    }
    var pro = s.loggedIn && s.role === 'praticien';
    var user = s.loggedIn
      ? '<div class="site-user"><div class="site-user__avatar">' + (pro ? 'CF' : 'SN') + '</div><div class="site-user__name">' + (pro ? 'Camille F.' : 'Sarah N.') + '</div>' +
        '<button class="site-user__out" type="button" id="logout">Sortir</button></div>'
      : '<a class="btn btn-outline" href="connexion.html">Se connecter</a>';
    host.innerHTML =
      '<header class="site-header"><div class="site-header__inner">' +
      '<a class="brand" href="index.html"><img src="assets/logo-holisanna-mark.png" alt="">' +
      '<div><div class="brand__name">HOLISANNA</div><div class="brand__tag">Fil Web to Feel Well</div></div></a>' +
      '<nav class="site-nav" aria-label="Navigation principale">' +
      item('accueil', 'Accueil', 'index.html') +
      item('recherche', 'Rechercher', 'recherche.html') +
      item('espace', 'Mon espace', s.loggedIn ? (pro ? 'espace-praticien.html' : 'espace.html') : 'connexion.html') +
      item('pro', 'Espace praticien', 'espace-praticien.html') +
      '</nav>' + user + '</div></header>';
    var out = document.getElementById('logout');
    if (out) out.addEventListener('click', function () { Session.logout(); location.href = 'index.html'; });
  }

  /* ----- Pied de page ----- */
  function renderFooter() {
    var host = document.getElementById('site-footer');
    if (!host) return;
    var cols = [
      { title: 'Holisanna', links: [['L’histoire', 'histoire.html'], ['La philosophie', 'philosophie.html'], ['La charte éthique', 'charte.html']] },
      { title: 'Informations légales', links: [['Mentions légales', 'mentions.html'], ['Confidentialité', 'confidentialite.html'], ['CGU', 'cgu.html'], ['CGV', 'cgv.html']] },
      { title: 'Contact', links: [['Questions fréquentes', 'faq.html'], ['contact@holisanna.fr', 'contact.html'], ['Nous écrire', 'contact.html'], ['Devenir praticien', 'devenir.html']] }
    ];
    host.innerHTML =
      '<footer class="site-footer"><div class="site-footer__grid">' +
      '<div class="site-footer__brand"><div class="site-footer__logo">Holisanna<span>.</span></div>' +
      '<div class="site-footer__tag">Fil Web to Feel Well</div>' +
      '<div class="site-footer__about">La plateforme du Take Care — prendre soin de soi, des autres et du monde.</div></div>' +
      cols.map(function (c) {
        return '<div class="site-footer__col"><div class="site-footer__title">' + c.title + '</div>' +
          c.links.map(function (l) { return '<a href="' + l[1] + '">' + l[0] + '</a>'; }).join('') + '</div>';
      }).join('') +
      '</div><div class="site-footer__bottom"><div>© 2026 Holisanna</div></div></footer>';
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderHeader(); renderFooter();
    try { var f = sessionStorage.getItem('holisanna.flash'); if (f) { sessionStorage.removeItem('holisanna.flash'); toast(f); } } catch (e) {}
  });
  window.HOL = { Session: Session, Store: Store, toast: toast, flash: flash };
})();
