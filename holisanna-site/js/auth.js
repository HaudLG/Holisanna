/* Holisanna — connexion, inscriptions, mot de passe oublié, questionnaire de départ.
   Une seule feuille de script : chaque page déclare son nom dans <body data-page="…">.
   ⚠ Démonstration : aucun mot de passe n'est envoyé ni enregistré. À brancher sur l'authentification réelle (Supabase Auth…). */
(function () {
  'use strict';
  var D = window.HOL_DATA, P = D.PILLARS;
  var $ = function (id) { return document.getElementById(id); };
  var page = document.body.getAttribute('data-page');
  var params = new URLSearchParams(location.search);

  function go(url, flashMsg) { if (flashMsg) HOL.flash(flashMsg); location.href = url; }

  /* ----- Boutons Google / Apple (simulation) ----- */
  function initSocial() {
    document.querySelectorAll('[data-social]').forEach(function (b) {
      b.addEventListener('click', function () { HOL.toast('Connexion ' + b.dataset.social + ' en cours…'); });
    });
  }

  /* ----- Force du mot de passe (inscriptions) ----- */
  function pwdScore(v) { return [/[A-Z]/.test(v), /[a-z]/.test(v), /[0-9]/.test(v), /[^A-Za-z0-9]/.test(v), v.length >= 8].filter(Boolean).length; }
  function initPwd() {
    var input = $('pwd'), bars = document.querySelector('[data-bars="pwd"]'), label = document.querySelector('[data-label="pwd"]');
    var input2 = $('pwd2');
    if (!input || !bars) return;
    function paint() {
      var v = input.value, sc = v ? pwdScore(v) : 0;
      var col = sc <= 2 ? 'var(--error)' : sc <= 3 ? 'var(--gold)' : 'var(--olive)';
      [].forEach.call(bars.children, function (b, i) { b.style.background = i < sc ? col : 'var(--border)'; });
      label.textContent = !v ? 'Minimum : 1 majuscule, 1 chiffre, 1 caractère spécial' : sc <= 2 ? 'Mot de passe faible' : sc <= 3 ? 'Mot de passe moyen' : '✓ Mot de passe fort';
      if (input2) match();
    }
    function match() { input2.setCustomValidity(input2.value && input2.value !== input.value ? 'Les deux saisies ne correspondent pas.' : ''); }
    input.addEventListener('input', paint);
    if (input2) input2.addEventListener('input', match);
  }

  /* ===== Connexion ===== */
  function pageConnexion() {
    $('login-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var role = params.get('role') === 'praticien' ? 'praticien' : 'explorateur';
      HOL.Session.login(role);
      go(role === 'praticien' ? 'espace-praticien.html' : 'espace.html', 'Bon retour. Votre cocktail bien-être vous attend.');
    });
  }

  /* ===== Inscription explorateur ===== */
  function pageExplorateur() {
    $('expl-form').addEventListener('submit', function (e) {
      e.preventDefault();
      go('onboarding.html', 'Compte créé. Trois questions pour amorcer votre cocktail.');
    });
  }

  /* ===== Inscription praticien ===== */
  function pagePraticien() {
    var MAIN = ['Naturopathie', 'Sophrologie', 'Kinésiologie', 'Ostéopathie', 'Hypnothérapie', 'Massage bien-être', 'Reiki', 'EFT', 'PNL', 'Yoga', 'Réflexologie', 'Autre'];
    var COMP = ['Phytothérapie', 'Iridologie', 'Breathwork', 'Janzu / Watsu', 'Aromathérapie', 'Nutrition', 'Coaching mental', 'Astrologie', 'Chamanisme'];
    var st = { main: [], comp: [], plan: 'Fil Libre', pay: 'card' };

    function specs(hostId, list, key, max) {
      var host = $(hostId);
      host.innerHTML = list.map(function (l) {
        return '<button type="button" class="spec' + (st[key].indexOf(l) !== -1 ? ' is-on' : '') + '" data-v="' + l + '" aria-pressed="' + (st[key].indexOf(l) !== -1) + '">' + l + '</button>';
      }).join('');
    }
    function paintSpecs() { specs('main-specs', MAIN, 'main', 2); specs('comp-specs', COMP, 'comp', 3); }
    function bindSpecs(hostId, key, max) {
      $(hostId).addEventListener('click', function (e) {
        var b = e.target.closest('.spec'); if (!b) return;
        var v = b.dataset.v, cur = st[key], i = cur.indexOf(v);
        if (i !== -1) cur.splice(i, 1);
        else if (cur.length >= max) { HOL.toast('Maximum ' + max + ' spécialité' + (max > 1 ? 's' : '') + ' pour cette section.'); return; }
        else cur.push(v);
        paintSpecs();
      });
    }
    function paintPlans() {
      $('plan-opts').innerHTML = D.PLANS.map(function (pl) {
        return '<button type="button" class="plan-opt' + (st.plan === pl.name ? ' is-on' : '') + '" data-plan="' + pl.name + '" aria-pressed="' + (st.plan === pl.name) + '">' +
          '<div class="plan-opt__name">' + pl.name + '</div><div class="plan-opt__price">' + pl.price + '</div><div class="plan-opt__period">' + pl.period + '</div></button>';
      }).join('');
      paintPay();
    }
    function paintPay() {
      var methods = [
        { key: 'card', name: 'Carte bancaire', tag: st.plan === 'Fil Libre' ? 'Recommandé' : '', desc: 'Enregistrée pour les prélèvements mensuels. Validation immédiate, résiliation en un clic.' },
        { key: 'sepa', name: 'Prélèvement SEPA', tag: st.plan === 'Fil Continu' ? 'Recommandé' : '', desc: 'Mandat sur RIB. Pas de carte à renouveler — adapté à l’engagement annuel.' }
      ];
      $('pay-opts').innerHTML = methods.map(function (m) {
        return '<button type="button" class="pay-opt' + (st.pay === m.key ? ' is-on' : '') + '" data-pay="' + m.key + '" aria-pressed="' + (st.pay === m.key) + '">' +
          '<span class="pay-opt__dot"></span><div><div class="pay-opt__name">' + m.name + (m.tag ? '<span class="pay-opt__tag">' + m.tag + '</span>' : '') + '</div>' +
          '<div class="pay-opt__desc">' + m.desc + '</div></div></button>';
      }).join('');
      $('pay-card').hidden = st.pay !== 'card';
      $('pay-sepa').hidden = st.pay !== 'sepa';
    }

    bindSpecs('main-specs', 'main', 2); bindSpecs('comp-specs', 'comp', 3);
    $('plan-opts').addEventListener('click', function (e) { var b = e.target.closest('[data-plan]'); if (b) { st.plan = b.dataset.plan; paintPlans(); } });
    $('pay-opts').addEventListener('click', function (e) { var b = e.target.closest('[data-pay]'); if (b) { st.pay = b.dataset.pay; paintPay(); } });
    paintSpecs(); paintPlans();

    $('prat-form').addEventListener('submit', function (e) {
      e.preventDefault();
      if (!st.main.length) { HOL.toast('Sélectionnez au moins une spécialité principale.'); return; }
      var s = HOL.Store.get(); s.plan = st.plan; s.payMethod = st.pay; HOL.Store.set(s);
      HOL.Session.login('praticien');
      go('espace-praticien.html', 'Bienvenue sur Holisanna. Votre profil est en ligne, 1 mois offert.');
    });
  }

  /* ===== Mot de passe oublié ===== */
  function pageForgot() {
    function sent() { $('forgot-step').hidden = true; $('sent-step').hidden = false; window.scrollTo(0, 0); HOL.toast('Email envoyé. Vérifiez votre boîte de réception.'); }
    $('forgot-form').addEventListener('submit', function (e) { e.preventDefault(); sent(); });
    $('resend').addEventListener('click', function () { HOL.toast('Email envoyé. Vérifiez votre boîte de réception.'); });
  }

  /* ===== Nouveau mot de passe ===== */
  function pageReset() {
    var a = $('new1'), b = $('new2');
    function rules() {
      var p = a.value;
      return [
        ['Au moins 8 caractères', p.length >= 8],
        ['Une majuscule et une minuscule', /[a-z]/.test(p) && /[A-Z]/.test(p)],
        ['Un chiffre ou un caractère spécial', /[0-9\W]/.test(p)],
        ['Les deux saisies correspondent', !!p && p === b.value]
      ];
    }
    function paint() {
      $('rules').className = 'rules';
      $('rules').innerHTML = rules().map(function (r) {
        return '<div class="rule' + (r[1] ? ' is-ok' : '') + '"><span>' + (r[1] ? '✓' : '○') + '</span><span>' + r[0] + '</span></div>';
      }).join('');
    }
    a.addEventListener('input', paint); b.addEventListener('input', paint); paint();
    $('reset-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var p = a.value;
      if (p.length < 8 || !/[a-z]/.test(p) || !/[A-Z]/.test(p) || !/[0-9\W]/.test(p)) { HOL.toast('Votre mot de passe ne remplit pas encore toutes les conditions.'); return; }
      if (p !== b.value) { HOL.toast('Les deux saisies ne correspondent pas.'); return; }
      go('connexion.html', 'Mot de passe modifié. Vous pouvez vous reconnecter.');
    });
  }

  /* ===== Questionnaire de départ (3 étapes) ===== */
  function pageOnboarding() {
    var st = { step: 1, pillars: [], discs: [], modes: [], rhythm: '' };
    var TITLES = ['Qu’avez-vous envie de travailler ?', 'Quelles pratiques vous attirent ?', 'Comment aimez-vous être accompagnée ?'];
    var LEADS = [
      'Choisissez un ou plusieurs piliers. Rien n’est définitif : votre cocktail se réajuste à chaque séance.',
      'Une sélection large vaut mieux qu’un choix trop sûr — vous verrez ce qui prend.',
      'Ces réponses orientent les praticiens qui vous seront proposés, sans jamais filtrer le reste.'
    ];
    var PILLAR_CARDS = [
      { key: 'Corps', p: 'corps', desc: 'Massage, kinésiologie, réflexologie, watsu' },
      { key: 'Âme', p: 'ame', desc: 'Reiki, chamanisme, soins énergétiques' },
      { key: 'Esprit', p: 'esprit', desc: 'Sophrologie, hypnose, méditation, breathwork' }
    ];
    var DISCS = ['Naturopathie', 'Massage bien-être', 'Sophrologie', 'Reiki', 'Kinésiologie', 'Hypnose', 'Réflexologie', 'Breathwork', 'Chamanisme', 'Watsu', 'Méditation', 'Shiatsu'];
    var MODES = ['Au cabinet', 'En visio', 'À domicile'];
    var RHYTHMS = ['Une séance pour essayer', 'Une fois par mois', 'Toutes les deux semaines', 'Je ne sais pas encore'];

    function chips(list, sel, attr) {
      return '<div class="chipset">' + list.map(function (l) {
        var on = Array.isArray(sel) ? sel.indexOf(l) !== -1 : sel === l;
        return '<button type="button" class="chipbtn' + (on ? ' is-on' : '') + '" ' + attr + '="' + l + '" aria-pressed="' + on + '">' + l + '</button>';
      }).join('') + '</div>';
    }
    function render() {
      $('ob-step').textContent = 'Étape ' + st.step + ' sur 3';
      $('ob-title').textContent = TITLES[st.step - 1];
      $('ob-lead').textContent = LEADS[st.step - 1];
      [].forEach.call($('ob-progress').children, function (d, i) { d.classList.toggle('is-on', i + 1 <= st.step); });
      $('ob-next').textContent = st.step === 3 ? 'Entrer dans mon espace →' : 'Continuer →';
      var html = '';
      if (st.step === 1) {
        html = '<div class="ob-pillars">' + PILLAR_CARDS.map(function (pc) {
          var pl = P[pc.p], on = st.pillars.indexOf(pc.key) !== -1;
          return '<button type="button" class="ob-pillar" data-pillar="' + pc.key + '" aria-pressed="' + on + '" style="background:' + (on ? pl.bg : 'var(--white)') + ';border-color:' + (on ? pl.color : 'var(--border)') + '">' +
            '<div class="ob-pillar__body"><div class="ob-pillar__name" style="color:' + pl.color + '">' + pc.key + '</div><div class="ob-pillar__desc">' + pc.desc + '</div></div>' +
            '<span class="ob-pillar__tick" style="color:' + pl.color + '">' + (on ? '✓' : '') + '</span></button>';
        }).join('') + '</div>';
      } else if (st.step === 2) {
        html = chips(DISCS, st.discs, 'data-disc');
      } else {
        html = '<div class="ob-block"><div class="lbl">Modes de séance</div>' + chips(MODES, st.modes, 'data-mode') + '</div>' +
               '<div class="ob-block"><div class="lbl">Rythme souhaité</div>' + chips(RHYTHMS, st.rhythm, 'data-rhythm') + '</div>';
      }
      $('ob-body').innerHTML = html;
    }
    function toggle(arr, v) { var i = arr.indexOf(v); if (i > -1) arr.splice(i, 1); else arr.push(v); }

    $('ob-body').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.dataset.pillar) toggle(st.pillars, b.dataset.pillar);
      else if (b.dataset.disc) toggle(st.discs, b.dataset.disc);
      else if (b.dataset.mode) toggle(st.modes, b.dataset.mode);
      else if (b.dataset.rhythm) st.rhythm = b.dataset.rhythm;
      else return;
      render();
    });
    function enter(msg, prefs) {
      var s = HOL.Store.get(); s.sessions = []; if (prefs) s.explPrefs = prefs; HOL.Store.set(s);
      HOL.Session.login('explorateur');
      go('cocktail.html', msg);
    }
    $('ob-next').addEventListener('click', function () {
      if (st.step === 1 && !st.pillars.length) { HOL.toast('Choisissez au moins un pilier.'); return; }
      if (st.step === 2 && !st.discs.length) { HOL.toast('Choisissez au moins une pratique.'); return; }
      if (st.step < 3) { st.step++; render(); window.scrollTo(0, 0); return; }
      enter('Bienvenue. Votre cocktail est prêt à se remplir.', st.pillars.concat(st.modes).concat(st.discs.slice(0, 2)));
    });
    $('ob-back').addEventListener('click', function () {
      if (st.step === 1) { location.href = 'inscription-explorateur.html'; return; }
      st.step--; render(); window.scrollTo(0, 0);
    });
    $('ob-skip').addEventListener('click', function () { enter('Vous pourrez répondre plus tard depuis Mon profil.'); });
    render();
  }

  document.addEventListener('DOMContentLoaded', function () {
    initSocial(); initPwd();
    ({ connexion: pageConnexion, 'inscription-explorateur': pageExplorateur, 'inscription-praticien': pagePraticien,
       'mot-de-passe-oublie': pageForgot, 'nouveau-mot-de-passe': pageReset, onboarding: pageOnboarding }[page] || function () {})();
  });
})();
