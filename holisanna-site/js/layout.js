/* Holisanna — en-tête, pied de page, session de démonstration et toasts.
   Chaque page contient <div id="site-header"></div> et <div id="site-footer"></div>,
   et indique son entrée de menu active via <body data-nav="accueil|recherche|espace|pro">. */
(function () {
  'use strict';
  var KEY = 'holisanna.session';

  /* ----- Session -----
     La vraie session est gérée par Supabase Auth (js/supabase.js). Ce cache, lu de façon synchrone,
     sert uniquement à l'affichage (en-tête, redirections de confort) : il est resynchronisé à chaque page
     et ne protège aucune donnée. L'accès aux données est vérifié côté base par les règles RLS. */
  var OUT = { loggedIn: false, role: 'explorateur' };
  function sb() { return window.HOL_SB && window.HOL_SB.client; }
  var Session = {
    get: function () {
      try { var s = JSON.parse(localStorage.getItem(KEY)); if (s && s.loggedIn) return s; } catch (e) {}
      return { loggedIn: false, role: 'explorateur' };
    },
    set: function (s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} },
    /* Appelé après une connexion réussie : { role, name, email } */
    login: function (info) {
      info = info || {};
      Session.set({ loggedIn: true, role: info.role === 'praticien' ? 'praticien' : 'explorateur', name: info.name || '', email: info.email || '' });
    },
    /* Déconnexion : renvoie une promesse, à attendre avant de changer de page */
    logout: function () {
      Session.set(OUT);
      var c = sb();
      return c ? c.auth.signOut().catch(function () {}) : Promise.resolve();
    },
    /* Relit la vraie session et le compte associé */
    refresh: function () {
      var c = sb();
      if (!c) return Promise.resolve(Session.get());
      return c.auth.getSession().then(function (r) {
        var ses = r.data && r.data.session;
        if (!ses) return { loggedIn: false, role: 'explorateur' };
        return c.from('utilisateurs').select('role, nom_complet').eq('id', ses.user.id).maybeSingle().then(function (q) {
          var md = ses.user.user_metadata || {}, row = q.data;
          return {
            loggedIn: true,
            role: (row ? row.role : md.role) === 'praticien' ? 'praticien' : 'explorateur',
            name: row ? row.nom_complet : (md.nom_complet || ''),
            email: ses.user.email || ''
          };
        });
      }).catch(function () { return Session.get(); });
    }
  };

  /* Identité affichable : « Léna Ferreira » → { full, first, short: « Léna F. », initials: « LF » } */
  function who() {
    var s = Session.get(), full = (s.name || '').trim() || (s.email || '').split('@')[0] || 'Mon compte';
    var parts = full.split(/\s+/), first = parts[0], last = parts.slice(1).join(' ');   /* « Le Gouadec » → L. */
    return {
      full: full, first: first,
      short: last ? first + ' ' + last.charAt(0).toUpperCase() + '.' : first,
      initials: (first.charAt(0) + (last ? last.charAt(0) : '')).toUpperCase()
    };
  }

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
      try { var s = JSON.parse(localStorage.getItem(SKEY)); if (s) base = Object.assign(base, s); } catch (e) {}
      var ses = Session.get();
      if (ses.loggedIn) {   /* compte réel : l'identité de démonstration laisse la place à celle de la personne */
        var w = who();
        if (ses.role === 'praticien' && base.fiche && base.fiche.nom === 'Camille Ferrand') base.fiche = Object.assign({}, base.fiche, { nom: w.full });
        if (ses.role !== 'praticien' && base.explProfile && base.explProfile.nom === 'Sarah Nguyen') base.explProfile = { nom: w.full, email: ses.email || '', tel: '', naissance: '', ville: '' };
      }
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

  function esc(x) { return String(x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

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
      ? '<div class="site-user"><div class="site-user__avatar">' + esc(who().initials) + '</div><div class="site-user__name">' + esc(who().short) + '</div>' +
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
    if (out) out.addEventListener('click', function () { Session.logout().then(function () { location.href = 'index.html'; }); });
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

  /* Resynchronise le cache avec la vraie session. Sur les pages protégées, un changement recharge la page
     pour que la redirection de confort s'applique ; sur les pages de connexion, on met seulement l'en-tête à jour. */
  var syncing = false;
  function syncSession() {
    if (syncing || !sb()) return;
    syncing = true;
    var before = JSON.stringify(Session.get());
    Session.refresh().then(function (next) {
      syncing = false;
      if (JSON.stringify(next) === before) return;
      var prev = JSON.parse(before);
      Session.set(next.loggedIn ? next : OUT);
      if (document.body.getAttribute('data-page')) renderHeader();
      else if (prev.loggedIn !== next.loggedIn || prev.role !== next.role) location.reload();
      else renderHeader();
    });
  }
  if (sb()) sb().auth.onAuthStateChange(function (evt) {
    if (evt === 'SIGNED_OUT' || evt === 'SIGNED_IN' || evt === 'USER_UPDATED') setTimeout(syncSession, 0);
  });

  document.addEventListener('DOMContentLoaded', function () {
    renderHeader(); renderFooter(); syncSession();
    try { var f = sessionStorage.getItem('holisanna.flash'); if (f) { sessionStorage.removeItem('holisanna.flash'); toast(f); } } catch (e) {}
  });
  window.HOL = { Session: Session, Store: Store, toast: toast, flash: flash, who: who, esc: esc, sb: sb };
})();
