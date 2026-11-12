/* Holisanna — contrôles de saisie communs (inscriptions, connexion, mot de passe, profils).
   Chaque champ déclare son type dans data-v : name · city · tel · cp · date18 · email · pwd · pwd2.
   Les caractères interdits ne peuvent pas être saisis ; le message d'erreur s'affiche sous le champ ;
   le formulaire ne part pas tant qu'un champ est invalide. Les mêmes règles sont reprises en base (contraintes). */
(function () {
  'use strict';

  var NAME_BAD = /[^\p{L}'’ \-]/gu;
  var NAME_OK = /^\p{L}[\p{L}'’ \-]*$/u;
  var CITY_OK = /^\p{L}[\p{L}'’ .\-]*$/u;
  var EMAIL_OK = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
  var MIN_AGE = 18;

  var PWD_RULES = [
    ['10 caractères minimum', function (v) { return v.length >= 10; }],
    ['1 majuscule minimum', function (v) { return /[A-Z]/.test(v); }],
    ['1 minuscule minimum', function (v) { return /[a-z]/.test(v); }],
    ['1 chiffre minimum', function (v) { return /[0-9]/.test(v); }],
    ['1 caractère spécial minimum', function (v) { return /[^A-Za-z0-9]/.test(v); }]
  ];
  function pwdRules(v) { v = v || ''; return PWD_RULES.map(function (r) { return [r[0], r[1](v)]; }); }
  function pwdOk(v) { return pwdRules(v).every(function (r) { return r[1]; }); }

  function luhn(d) { var t = 0; for (var i = 0; i < d.length; i++) { var n = +d.charAt(d.length - 1 - i); if (i % 2) { n *= 2; if (n > 9) n -= 9; } t += n; } return t % 10 === 0; }
  function ymd(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function latestBirth() { var d = new Date(); d.setFullYear(d.getFullYear() - MIN_AGE); return ymd(d); }

  /* Nettoyage pendant la frappe : les caractères interdits n'apparaissent pas */
  var CLEAN = {
    name: function (v) { return v.replace(NAME_BAD, ''); },
    city: function (v) { return v.replace(/[^\p{L}'’ .\-]/gu, ''); },
    tel: function (v) { v = v.replace(/[^\d+ ]/g, ''); return v.charAt(0) === '+' ? '+' + v.slice(1).replace(/\+/g, '') : v.replace(/\+/g, ''); },
    cp: function (v) { return v.replace(/\D/g, '').slice(0, 5); },
    siret: function (v) { return v.replace(/[^\d ]/g, '').slice(0, 17); }
  };

  /* Chaque contrôle renvoie '' si tout va bien, sinon le message à afficher */
  var CHECK = {
    name: function (v) { v = v.trim(); return !v ? 'Ce champ est requis.' : (v.length < 2 || !NAME_OK.test(v)) ? 'Lettres uniquement (accents, tiret et apostrophe acceptés).' : ''; },
    city: function (v) { v = v.trim(); return !v ? 'Ce champ est requis.' : (v.length < 2 || !CITY_OK.test(v)) ? 'Lettres uniquement (accents, tiret et apostrophe acceptés).' : ''; },
    tel: function (v) {
      v = v.trim(); if (!v) return 'Ce champ est requis.';
      var digits = v.replace(/\D/g, '');
      if (v.charAt(0) === '+') return digits.length >= 9 && digits.length <= 15 ? '' : 'Numéro invalide. Exemple : +33 6 12 34 56 78';
      return digits.length === 10 && digits.charAt(0) === '0' ? '' : 'Numéro invalide. Exemple : +33 6 12 34 56 78';
    },
    cp: function (v) { return !v ? 'Ce champ est requis.' : /^\d{5}$/.test(v) ? '' : 'Le code postal comporte 5 chiffres.'; },
    date18: function (v) {
      if (!v) return 'Ce champ est requis.';
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || isNaN(new Date(v).getTime())) return 'Date invalide.';
      if (v > ymd(new Date())) return 'Cette date est dans le futur.';
      if (v < '1900-01-01') return 'Date invalide.';
      return v <= latestBirth() ? '' : 'Vous devez avoir ' + MIN_AGE + ' ans minimum pour créer un compte.';
    },
    siret: function (v) { var d = v.replace(/\s/g, ''); return !d ? 'Ce champ est requis.' : (/^\d{14}$/.test(d) && luhn(d)) ? '' : 'Un numéro de SIRET comporte 14 chiffres. Vérifiez la saisie.'; },
    future: function (v) { return !v ? 'Ce champ est requis.' : (!/^\d{4}-\d{2}-\d{2}$/.test(v) || isNaN(new Date(v).getTime())) ? 'Date invalide.' : v < ymd(new Date()) ? 'Cette date est déjà passée.' : ''; },
    email: function (v) { v = v.trim(); return !v ? 'Ce champ est requis.' : EMAIL_OK.test(v) ? '' : 'Adresse e-mail invalide, vérifiez la saisie.'; },
    pwd: function (v) { return !v ? 'Ce champ est requis.' : pwdOk(v) ? '' : 'Le mot de passe ne remplit pas encore toutes les conditions.'; },
    pwd2: function (v, input) {
      var ref = document.getElementById(input.getAttribute('data-ref') || 'pwd');
      return !v ? 'Ce champ est requis.' : ref && v !== ref.value ? 'Les deux saisies ne correspondent pas.' : '';
    }
  };

  function box(input) {
    var host = input.closest('.fld') || input.parentNode, e = host.querySelector(':scope > .fld__err');
    if (!e) { e = document.createElement('span'); e.className = 'fld__err'; e.setAttribute('role', 'alert'); host.appendChild(e); }
    return e;
  }
  function show(input, msg) {
    var e = box(input); e.textContent = msg; input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    input.classList.toggle('is-bad', !!msg);
  }
  function check(input, force) {
    var t = input.getAttribute('data-v'), f = CHECK[t]; if (!f) return '';
    if (!input.required && !input.value.trim() && !force) { show(input, ''); return ''; }
    var m = f(input.value, input);
    if (!input.required && !input.value.trim()) m = '';
    show(input, m); return m;
  }

  function bind(input) {
    if (input.__hv) return; input.__hv = true;
    var t = input.getAttribute('data-v');
    if (t === 'tel') { input.setAttribute('inputmode', 'tel'); input.maxLength = 20; }
    if (t === 'cp') { input.setAttribute('inputmode', 'numeric'); input.maxLength = 5; }
    if (t === 'date18') { input.max = latestBirth(); input.min = '1900-01-01'; }
    var touched = false;
    input.addEventListener('input', function () {
      if (CLEAN[t]) { var c = CLEAN[t](input.value); if (c !== input.value) input.value = c; }
      if (touched) check(input);
      if (t === 'pwd') { var o = document.querySelector('[data-v="pwd2"]'); if (o && o.value) check(o); }
    });
    input.addEventListener('blur', function () { if (input.value || touched) { touched = true; check(input); } });
    input.addEventListener('change', function () { touched = true; check(input); });
  }

  function validateForm(form) {
    var first = null;
    form.querySelectorAll('[data-v]').forEach(function (i) { if (check(i, true) && !first) first = i; });
    if (first) { first.focus(); if (window.HOL && HOL.toast) HOL.toast('Merci de corriger les champs signalés.'); }
    return !first;
  }

  function init() {
    var forms = [];
    document.querySelectorAll('[data-v]').forEach(function (i) { bind(i); var f = i.form; if (f && forms.indexOf(f) === -1) forms.push(f); });
    forms.forEach(function (f) {
      f.noValidate = true;
      f.addEventListener('submit', function (e) { if (!validateForm(f)) { e.preventDefault(); e.stopImmediatePropagation(); } }, true);
    });
  }

  window.HOL_VALID = { pwdRules: pwdRules, pwdOk: pwdOk, check: CHECK, clean: CLEAN, validateForm: validateForm, bind: bind, checkInput: check, latestBirth: latestBirth, init: init };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
