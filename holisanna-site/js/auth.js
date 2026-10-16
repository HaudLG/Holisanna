/* Holisanna — connexion, inscriptions, mot de passe oublié, questionnaire de départ.
   Une seule feuille de script : chaque page déclare son nom dans <body data-page="…">.
   Authentification réelle : Supabase Auth (e-mail + mot de passe). Google et Apple : à venir (boutons encore simulés). */
(function () {
  'use strict';
  var D = window.HOL_DATA, P = D.PILLARS;
  var $ = function (id) { return document.getElementById(id); };
  var page = document.body.getAttribute('data-page');
  var params = new URLSearchParams(location.search);

  function go(url, flashMsg) { if (flashMsg) HOL.flash(flashMsg); location.href = url; }
  function sb() { return window.HOL_SB && window.HOL_SB.client; }
  function busy(form, on) { var b = form.querySelector('button[type=submit]'); if (b) { b.disabled = on; b.style.opacity = on ? '.6' : ''; } }
  function esc(x) { return String(x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  /* Messages d'erreur en français, sans jamais révéler si une adresse existe déjà côté connexion */
  function errMsg(e) {
    var m = ((e && (e.code || e.message)) || '').toLowerCase();
    if (/invalid_credentials|invalid login/.test(m)) return 'Adresse e-mail ou mot de passe incorrect.';
    if (/email_not_confirmed|not confirmed/.test(m)) return 'Votre adresse n’est pas encore confirmée : ouvrez l’e-mail que nous vous avons envoyé.';
    if (/over_email_send_rate_limit|rate limit|too many/.test(m)) return 'Trop de tentatives. Patientez quelques minutes avant de réessayer.';
    if (/weak_password|password/.test(m)) return 'Ce mot de passe est trop faible. Essayez-en un plus long.';
    if (/failed to fetch|network/.test(m)) return 'Connexion impossible. Vérifiez votre réseau et réessayez.';
    return 'Une erreur est survenue. Réessayez dans un instant.';
  }
  /* Adresse de retour après login : relative, même site uniquement */
  function nextUrl() { var n = params.get('next'); return n && /^[a-z0-9._-]+\.html(\?[^#]*)?$/i.test(n) ? n : ''; }
  /* Écran « consultez votre boîte mail » après une inscription qui demande confirmation */
  function showCheckMail(form, email) {
    form.style.display = 'none';   /* l'attribut hidden est écrasé par le display:flex des formulaires */
    /* le message remplace tout le haut de la page : titre, boutons Google/Apple, séparateur, mentions */
    document.querySelectorAll('.auth-box > h1, .auth-box > .auth-sub, .auth-box > .social-list, .auth-box > .divider, .auth-box .fine, .auth-box > .auth-back').forEach(function (el) { el.style.display = 'none'; });
    var box = document.createElement('div');
    box.setAttribute('role', 'status');
    box.innerHTML = '<h2 class="auth-title">Vérifiez votre boîte mail</h2>' +
      '<p class="auth-sub" style="font-size:14px;line-height:1.7;margin-bottom:14px">Nous venons d’envoyer un lien de confirmation à <strong>' + esc(email) + '</strong>. Cliquez dessus pour activer votre compte, puis connectez-vous.</p>' +
      '<p class="auth-sub" style="margin-bottom:24px">Rien reçu ? Regardez dans vos courriers indésirables.</p>' +
      '<a class="btn btn-primary btn-lg" style="display:flex;align-items:center;justify-content:center;min-height:52px" href="connexion.html">Aller à la connexion →</a>';
    form.parentNode.insertBefore(box, form.nextSibling);
    window.scrollTo(0, 0);
  }
  /* Inscription commune aux deux rôles */
  function signUp(form, role, fields, then) {
    var c = sb();
    if (!c) { HOL.toast('Service momentanément indisponible. Réessayez plus tard.'); return; }
    var email = $('email').value.trim(), pwd = $('pwd').value;
    if (pwd.length < 8 || pwdScore(pwd) < 4) { HOL.toast('Votre mot de passe ne remplit pas encore toutes les conditions.'); return; }
    var data = Object.assign({ role: role, cgu_acceptees: 'true' }, fields);
    busy(form, true);
    c.auth.signUp({
      email: email, password: pwd,
      options: { data: data, emailRedirectTo: location.origin + '/connexion.html?confirme=1' }
    }).then(function (r) {
      busy(form, false);
      if (r.error) { HOL.toast(errMsg(r.error)); return; }
      var u = r.data && r.data.user;
      if (u && u.identities && u.identities.length === 0) { HOL.toast('Un compte existe déjà avec cette adresse. Connectez-vous ou réinitialisez votre mot de passe.'); return; }
      if (r.data.session) { HOL.Session.login({ role: role, name: data.nom_complet, email: email }); then(); }
      else showCheckMail(form, email);
    }).catch(function (e) { busy(form, false); HOL.toast(errMsg(e)); });
  }

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
    if (params.get('confirme')) HOL.toast('Adresse confirmée. Vous pouvez vous connecter.');
    $('login-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var c = sb(), form = e.target;
      if (!c) { HOL.toast('Service momentanément indisponible. Réessayez plus tard.'); return; }
      busy(form, true);
      c.auth.signInWithPassword({ email: $('email').value.trim(), password: $('pwd').value }).then(function (r) {
        if (r.error) { busy(form, false); HOL.toast(errMsg(r.error)); return; }
        return HOL.Session.refresh().then(function (info) {
          if (!info.loggedIn) { busy(form, false); HOL.toast('Connexion impossible. Réessayez.'); return; }
          HOL.Session.login(info);
          var next = nextUrl();
          if (info.role === 'praticien') return go(next || 'espace-praticien.html', 'Bon retour. Votre semaine vous attend.');
          /* Premier passage d'un explorateur : on lui propose le questionnaire de départ */
          return c.from('profils_explorateur').select('piliers_prefs').eq('utilisateur_id', r.data.user.id).maybeSingle().then(function (q) {
            var first = q.data && q.data.piliers_prefs === null;
            go(first ? 'onboarding.html' : (next || 'espace.html'), first ? 'Bienvenue. Trois questions pour amorcer votre cocktail.' : 'Bon retour. Votre cocktail bien-être vous attend.');
          });
        });
      }).catch(function (err) { busy(form, false); HOL.toast(errMsg(err)); });
    });
  }

  /* ===== Inscription explorateur ===== */
  function pageExplorateur() {
    $('expl-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var f = e.target;
      signUp(f, 'explorateur', {
        nom_complet: ($('prenom').value.trim() + ' ' + $('nom').value.trim()).trim(),
        telephone: $('tel').value.trim(),
        date_naissance: $('naissance').value
      }, function () { go('onboarding.html', 'Compte créé. Trois questions pour amorcer votre cocktail.'); });
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
      var f = e.target;
      /* Les champs de paiement (carte, IBAN) ne sont ni lus ni envoyés : l'abonnement sera branché plus tard chez un prestataire de paiement. */
      signUp(f, 'praticien', {
        nom_complet: ($('prenom').value.trim() + ' ' + $('nom').value.trim()).trim(),
        telephone: $('tel').value.trim(),
        adresse: $('adresse').value.trim(), code_postal: $('cp').value.trim(), ville: $('ville').value.trim(),
        charte_version: (window.HOL_SB && window.HOL_SB.CHARTE_VERSION) || '1.0'
      }, function () {
        var s = HOL.Store.get(); s.plan = st.plan; s.payMethod = st.pay; HOL.Store.set(s);
        go('espace-praticien.html', 'Bienvenue sur Holisanna. Votre compte est créé.');
      });
      try { var s2 = HOL.Store.get(); s2.plan = st.plan; s2.payMethod = st.pay; HOL.Store.set(s2); } catch (x) {}
    });
  }

  /* ===== Mot de passe oublié ===== */
  function pageForgot() {
    function sent() { $('forgot-step').hidden = true; $('sent-step').hidden = false; window.scrollTo(0, 0); HOL.toast('Si un compte existe, un e-mail vient d’être envoyé.'); }
    var lastEmail = '';
    function send(after) {
      var c = sb();
      if (!c) { HOL.toast('Service momentanément indisponible. Réessayez plus tard.'); return; }
      c.auth.resetPasswordForEmail(lastEmail, { redirectTo: location.origin + '/nouveau-mot-de-passe.html' }).then(function (r) {
        /* Même réponse que le compte existe ou non : on ne révèle rien sur les adresses inscrites */
        if (r.error && /rate|too many/i.test(r.error.message || r.error.code || '')) { HOL.toast(errMsg(r.error)); return; }
        after();
      }).catch(function (e) { HOL.toast(errMsg(e)); });
    }
    $('forgot-form').addEventListener('submit', function (e) { e.preventDefault(); lastEmail = $('email').value.trim(); send(sent); });
    $('resend').addEventListener('click', function () { if (lastEmail) send(function () { HOL.toast('E-mail renvoyé. Vérifiez votre boîte de réception.'); }); });
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
      var p = a.value, c = sb();
      if (p.length < 8 || !/[a-z]/.test(p) || !/[A-Z]/.test(p) || !/[0-9\W]/.test(p)) { HOL.toast('Votre mot de passe ne remplit pas encore toutes les conditions.'); return; }
      if (p !== b.value) { HOL.toast('Les deux saisies ne correspondent pas.'); return; }
      if (!c) { HOL.toast('Service momentanément indisponible. Réessayez plus tard.'); return; }
      busy(e.target, true);
      /* Le lien reçu par e-mail ouvre une session de récupération : sans elle, le lien est expiré ou déjà utilisé */
      c.auth.getSession().then(function (r) {
        if (!r.data.session) { busy(e.target, false); HOL.toast('Ce lien n’est plus valide. Demandez-en un nouveau.'); return; }
        return c.auth.updateUser({ password: p }).then(function (u) {
          if (u.error) { busy(e.target, false); HOL.toast(errMsg(u.error)); return; }
          return HOL.Session.logout().then(function () { go('connexion.html', 'Mot de passe modifié. Vous pouvez vous reconnecter.'); });
        });
      }).catch(function (err) { busy(e.target, false); HOL.toast(errMsg(err)); });
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
    /* Correspondance entre les libellés du questionnaire et les valeurs de la base */
    var PILLAR_DB = { 'Corps': 'corps', 'Âme': 'ame', 'Esprit': 'esprit' };
    var MODE_DB = { 'Au cabinet': 'presentiel', 'En visio': 'distanciel', 'À domicile': 'domicile' };
    var RHYTHM_DB = { 'Une séance pour essayer': 'ponctuel', 'Une fois par mois': 'mensuel', 'Toutes les deux semaines': 'bimensuel' };
    function enter(msg, prefs, save) {
      var s = HOL.Store.get(); s.sessions = []; if (prefs) s.explPrefs = prefs; HOL.Store.set(s);   /* séances et pratiques : encore en démonstration */
      function done() { go('cocktail.html', msg); }
      var c = sb();
      if (!c) return done();
      c.auth.getSession().then(function (r) {
        var ses = r.data.session;
        if (!ses) { go('connexion.html', 'Connectez-vous pour continuer.'); return; }
        /* « Passer » enregistre des listes vides : le questionnaire ne sera plus imposé à chaque connexion */
        var row = save ? {
          piliers_prefs: st.pillars.map(function (x) { return PILLAR_DB[x]; }).filter(Boolean),
          modes_prefs: st.modes.map(function (x) { return MODE_DB[x]; }).filter(function (x, i, a) { return x && a.indexOf(x) === i; }),
          rythme: RHYTHM_DB[st.rhythm] || null
        } : { piliers_prefs: [], modes_prefs: [] };
        return c.from('profils_explorateur').update(row).eq('utilisateur_id', ses.user.id).then(function (u) {
          if (u.error) HOL.toast('Vos préférences n’ont pas pu être enregistrées. Vous pourrez les refaire depuis Mon profil.');
          done();
        });
      }).catch(done);
    }
    $('ob-next').addEventListener('click', function () {
      if (st.step === 1 && !st.pillars.length) { HOL.toast('Choisissez au moins un pilier.'); return; }
      if (st.step === 2 && !st.discs.length) { HOL.toast('Choisissez au moins une pratique.'); return; }
      if (st.step < 3) { st.step++; render(); window.scrollTo(0, 0); return; }
      enter('Bienvenue. Votre cocktail est prêt à se remplir.', st.pillars.concat(st.modes).concat(st.discs.slice(0, 2)), true);
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
