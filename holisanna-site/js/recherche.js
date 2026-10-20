/* Holisanna — page de recherche.
   Les filtres vivent dans l'URL (?q=…&ville=…&pilier=…) : on peut partager ou rouvrir une recherche. */
(function () {
  'use strict';
  var D = window.HOL_DATA, P = D.PILLARS, PER = 4;
  var SLOTS = HOL.Store.slots();
  /* Praticiens réels (Supabase). Les fiches de démonstration ne s'ajoutent qu'avec ?demo=1 (revue de maquette). */
  var DEMO = new URLSearchParams(location.search).has('demo'), LIST = [], loaded = false;
  function M(p) { return p.real ? p.meta : D.meta(p, SLOTS); }
  function dIdx(p) { var i = M(p).dayIdx; return i < 0 ? 999 : i; }
  var $ = function (id) { return document.getElementById(id); };

  var DEFAULTS = { q: '', city: '', pillar: 'all', fPillars: [], fDispo: null, fModes: [], fLangs: ['Français'], fRating: null, maxPrice: 200, sort: 'dispo', page: 1 };
  var s = JSON.parse(JSON.stringify(DEFAULTS));

  /* ----- État <-> URL ----- */
  function readUrl() {
    var u = new URLSearchParams(location.search);
    if (u.get('q')) s.q = u.get('q');
    if (u.get('ville')) s.city = u.get('ville');
    if (u.get('pilier') && P[u.get('pilier')]) s.pillar = u.get('pilier');
    if (u.get('piliers')) s.fPillars = u.get('piliers').split(',').filter(function (k) { return P[k]; });
    if (u.get('dispo')) s.fDispo = u.get('dispo');
    if (u.get('modes')) s.fModes = u.get('modes').split(',');
    if (u.has('langues')) s.fLangs = u.get('langues') ? u.get('langues').split(',') : [];
    if (u.get('note')) s.fRating = Number(u.get('note'));
    if (u.get('prix')) s.maxPrice = Number(u.get('prix'));
    if (u.get('tri')) s.sort = u.get('tri');
    if (u.get('page')) s.page = Number(u.get('page')) || 1;
  }
  function writeUrl() {
    var u = new URLSearchParams();
    if (s.q) u.set('q', s.q);
    if (s.city) u.set('ville', s.city);
    if (s.pillar !== 'all') u.set('pilier', s.pillar);
    if (s.fPillars.length) u.set('piliers', s.fPillars.join(','));
    if (s.fDispo) u.set('dispo', s.fDispo);
    if (s.fModes.length) u.set('modes', s.fModes.join(','));
    if (s.fLangs.join(',') !== 'Français') u.set('langues', s.fLangs.join(','));
    if (s.fRating) u.set('note', s.fRating);
    if (s.maxPrice < 200) u.set('prix', s.maxPrice);
    if (s.sort !== 'dispo') u.set('tri', s.sort);
    if (s.page > 1) u.set('page', s.page);
    if (DEMO) u.set('demo', '1');
    var qs = u.toString();
    history.replaceState(null, '', location.pathname + (qs ? '?' + qs : ''));
  }
  function set(patch, keepPage) { Object.assign(s, patch); if (!keepPage) s.page = 1; render(); }
  function toggle(key, v) {
    var cur = s[key], o = {};
    o[key] = cur.indexOf(v) !== -1 ? cur.filter(function (x) { return x !== v; }) : cur.concat([v]);
    set(o);
  }

  /* ----- Filtrage et tri ----- */
  function inter(a, b) { return a.some(function (x) { return b.indexOf(x) !== -1; }); }
  function matches(p) {
    var q = s.q.trim().toLowerCase(), c = s.city.trim().toLowerCase(), m = M(p);
    return (!q || p.discipline.toLowerCase().indexOf(q) !== -1 || p.name.toLowerCase().indexOf(q) !== -1)
      && (!c || (p.place + ' ' + (p.cp || '')).toLowerCase().indexOf(c) !== -1)
      && (s.pillar === 'all' || p.pillar === s.pillar)
      && (!s.fPillars.length || s.fPillars.indexOf(p.pillar) !== -1)
      && (!s.fModes.length || inter(s.fModes, m.modes))
      && (!s.fLangs.length || inter(s.fLangs, m.langs))
      && (!s.fRating || (p.rating != null && Number(p.rating) >= s.fRating))
      && (!s.fDispo || (s.fDispo === 'today' ? m.dayIdx === 0 : s.fDispo === 'week' ? m.dayIdx >= 0 && m.dayIdx <= 6 : m.dayIdx >= 0 && m.dayIdx <= 31))
      && (p.price == null || p.price <= s.maxPrice);
  }
  function sorted() {
    return LIST.filter(matches).sort(function (a, b) {
      return s.sort === 'asc' ? (a.price || 0) - (b.price || 0)
        : s.sort === 'desc' ? (b.price || 0) - (a.price || 0)
        : s.sort === 'note' ? Number(b.rating || 0) - Number(a.rating || 0)
        : dIdx(a) - dIdx(b);
    });
  }

  /* ----- Rendu : filtres ----- */
  function check(label, on, count, attr) {
    return '<button type="button" class="check' + (on ? ' is-on' : '') + '" ' + attr + ' aria-pressed="' + on + '">' +
      '<span class="check__box">' + (on ? '✓' : '') + '</span><span class="check__label">' + label + '</span>' +
      '<span class="check__count">' + (count === '' ? '' : count) + '</span></button>';
  }
  function renderFilters() {
    $('f-pillars').innerHTML = ['corps', 'esprit', 'ame'].map(function (k) {
      return check(P[k].label, s.fPillars.indexOf(k) !== -1, LIST.filter(function (p) { return p.pillar === k; }).length, 'data-pillar="' + k + '"');
    }).join('');
    $('f-dispo').innerHTML = [['today', "Aujourd'hui"], ['week', 'Cette semaine'], ['month', 'Ce mois']].map(function (o) {
      return '<button type="button" class="pill' + (s.fDispo === o[0] ? ' is-on' : '') + '" data-dispo="' + o[0] + '">' + o[1] + '</button>';
    }).join('');
    $('f-modes').innerHTML = [['Cabinet', 'En cabinet'], ['Visio', 'En visio'], ['Domicile', 'À domicile']].map(function (m) {
      return check(m[1], s.fModes.indexOf(m[0]) !== -1, '', 'data-mode="' + m[0] + '"');
    }).join('');
    $('f-langs').innerHTML = ['Français', 'Anglais', 'Espagnol'].map(function (l) {
      return check(l, s.fLangs.indexOf(l) !== -1, '', 'data-lang="' + l + '"');
    }).join('');
    $('f-rating').innerHTML = [5, 4, 3].map(function (n) {
      var label = '★'.repeat(n) + '☆'.repeat(5 - n) + (n === 5 ? ' 5 étoiles' : ' ' + n + '+ étoiles');
      return check(label, s.fRating === n, '', 'data-rating="' + n + '"');
    }).join('');
    $('f-price').value = s.maxPrice;
    $('price-label').textContent = s.maxPrice + ' €';
  }

  /* ----- Rendu : puces actives ----- */
  function renderChips() {
    var chips = [];
    s.fPillars.forEach(function (k) { chips.push([P[k].label, 'fPillars', k]); });
    if (s.fDispo) chips.push([s.fDispo === 'today' ? "Aujourd'hui" : s.fDispo === 'week' ? 'Cette semaine' : 'Ce mois', 'fDispo']);
    s.fModes.forEach(function (m) { chips.push([m, 'fModes', m]); });
    if (s.fRating) chips.push([s.fRating + '+ étoiles', 'fRating']);
    if (s.maxPrice < 200) chips.push(['≤ ' + s.maxPrice + ' €', 'maxPrice']);
    if (s.pillar !== 'all') chips.push(['Pilier ' + P[s.pillar].label, 'pillar']);
    var el = $('chips');
    el.hidden = !chips.length;
    el.innerHTML = chips.map(function (c) {
      return '<div class="active-chip">' + c[0] + '<button type="button" aria-label="Retirer ' + c[0] + '" data-clear="' + c[1] + '" data-val="' + (c[2] || '') + '">×</button></div>';
    }).join('');
  }

  /* ----- Rendu : cartes praticiens ----- */
  function card(p) {
    var pl = P[p.pillar], m = M(p), rt = Math.round(Number(p.rating || 0));
    var distance = p.real ? (p.format === 'visio' ? 'En visio' : '') : p.format === 'visio' ? 'En visio' : (1 + (p.id % 9)) + ',' + (p.id % 10) + ' km';
    var avail = !m.first ? ['○ Agenda complet', 'var(--slate-lt)'] : m.dayIdx === 0 ? ['● Disponible', 'var(--olive)'] : m.dayIdx > 0 ? ['◐ Cette semaine', 'var(--rose)'] : ['○ Agenda complet', 'var(--slate-lt)'];
    var next = m.first ? m.day + ' · ' + m.first : (p.real ? 'Pas de créneau ouvert' : 'Agenda complet');
    var profile = p.real ? 'praticien.html?p=' + encodeURIComponent(p.id) : 'praticien.html?id=' + p.id;
    var book = profile + (m.first ? (p.real ? '&jour=' + encodeURIComponent(m.firstDay) : '&date=' + encodeURIComponent(m.day)) + '&heure=' + encodeURIComponent(m.first) : '');
    var tagStyle = 'background:' + pl.bg + ';color:' + pl.color;
    return '<article class="pcard" data-href="' + profile + '">' + (p.real && window.HOL_FAV ? HOL_FAV.btn(p.uid) : '') +
      '<div class="pcard__side"><div class="avatar" style="background:' + pl.bg + ';color:' + pl.color + (p.photo ? ';background-image:url(' + p.photo + ');background-size:cover;background-position:center' : '') + '">' + (p.photo ? '' : D.initials(p.name)) + '</div>' +
      '<div class="pcard__avail" style="color:' + avail[1] + '">' + avail[0] + '</div></div>' +
      '<div class="pcard__main"><div class="tags"><span class="tag" style="' + tagStyle + '">' + pl.label + '</span><span class="tag" style="' + tagStyle + '">' + p.discipline + '</span></div>' +
      '<div class="pcard__name-row"><a class="pcard__name" href="' + profile + '">' + p.name + '</a>' +
      (p.founder ? '<span class="badge-founder">★ MEMBRE FONDATEUR</span>' : '') + '</div>' +
      '<div class="pcard__place">' + p.place + (distance ? ' · ' + distance : '') + '</div>' +
      '<p class="pcard__teaser">' + p.teaser + '</p>' +
      '<div class="modes">' + m.modes.map(function (x) { return '<span class="mode">' + x + '</span>'; }).join('') + '</div>' +
      (p.rating == null ? '<div class="rating"><span class="rating__reviews">Nouveau sur Holisanna · pas encore d’avis</span></div></div>' :
      '<div class="rating"><span class="rating__stars">' + '★★★★★'.slice(0, rt) + '☆☆☆☆☆'.slice(0, 5 - rt) + '</span>' +
      '<span class="rating__n">' + p.rating + '</span><span class="rating__reviews">· ' + p.reviews + '</span></div></div>') +
      '<div class="pcard__side-r"><div>' + (p.price == null ? '' : '<div class="pcard__price">' + p.price + ' €<small>' + p.duration + '</small></div>') +
      '<div class="pcard__next">' + next + '</div></div>' +
      '<div class="pcard__actions"><a class="btn btn-cta" href="' + book + '" data-book>Réserver →</a>' +
      '<a class="btn-ghost" href="' + profile + '">Voir le profil</a></div></div></article>';
  }

  /* ----- Rendu : page complète ----- */
  function render() {
    var list = loaded ? sorted() : [];
    var pageCount = Math.max(1, Math.ceil(list.length / PER));
    s.page = Math.min(s.page, pageCount);
    renderFilters(); renderChips();

    $('s-q').value = s.q; $('s-city').value = s.city; $('sort').value = s.sort;
    $('count').textContent = !loaded ? 'Chargement…' : list.length + ' praticien' + (list.length > 1 ? 's' : '');
    $('query').textContent = (s.q.trim() ? 'pour « ' + s.q.trim() + ' »' : 'toutes disciplines') + ' · ' + (s.city.trim() || 'partout en France');
    $('cards').innerHTML = list.slice((s.page - 1) * PER, s.page * PER).map(card).join('');
    $('empty').hidden = !loaded || list.length !== 0;

    var pager = $('pager');
    pager.hidden = list.length <= PER;
    if (!pager.hidden) {
      var btns = [{ label: '‹', n: Math.max(1, s.page - 1) }];
      for (var i = 1; i <= pageCount; i++) btns.push({ label: String(i), n: i });
      btns.push({ label: '›', n: Math.min(pageCount, s.page + 1) });
      pager.innerHTML = btns.map(function (b) {
        return '<button type="button" data-page="' + b.n + '"' + (b.label === String(s.page) ? ' class="is-on" aria-current="page"' : '') + '>' + b.label + '</button>';
      }).join('');
    }
    writeUrl();
  }

  function reset(withToast) {
    s = JSON.parse(JSON.stringify(DEFAULTS)); render();
    if (withToast) HOL.toast('Filtres réinitialisés.');
  }

  /* ----- Événements ----- */
  document.addEventListener('DOMContentLoaded', function () {
    readUrl();

    $('f-pillars').addEventListener('click', function (e) { var b = e.target.closest('[data-pillar]'); if (b) toggle('fPillars', b.dataset.pillar); });
    $('f-modes').addEventListener('click', function (e) { var b = e.target.closest('[data-mode]'); if (b) toggle('fModes', b.dataset.mode); });
    $('f-langs').addEventListener('click', function (e) { var b = e.target.closest('[data-lang]'); if (b) toggle('fLangs', b.dataset.lang); });
    $('f-dispo').addEventListener('click', function (e) { var b = e.target.closest('[data-dispo]'); if (b) set({ fDispo: s.fDispo === b.dataset.dispo ? null : b.dataset.dispo }); });
    $('f-rating').addEventListener('click', function (e) { var b = e.target.closest('[data-rating]'); if (b) { var n = Number(b.dataset.rating); set({ fRating: s.fRating === n ? null : n }); } });
    $('f-price').addEventListener('input', function (e) { set({ maxPrice: Number(e.target.value) }); });
    $('sort').addEventListener('change', function (e) { set({ sort: e.target.value }); });
    $('reset').addEventListener('click', function () { reset(true); });
    $('empty-reset').addEventListener('click', function () { reset(true); });

    $('searchbar').addEventListener('submit', function (e) {
      e.preventDefault();
      set({ q: $('s-q').value, city: $('s-city').value });
      var n = sorted().length;
      HOL.toast(n + ' praticien' + (n > 1 ? 's' : '') + ' sur ces critères.');
    });

    $('chips').addEventListener('click', function (e) {
      var b = e.target.closest('[data-clear]'); if (!b) return;
      var k = b.dataset.clear, v = b.dataset.val;
      if (k === 'fPillars' || k === 'fModes') toggle(k, v);
      else if (k === 'fDispo') set({ fDispo: null });
      else if (k === 'fRating') set({ fRating: null });
      else if (k === 'maxPrice') set({ maxPrice: 200 });
      else if (k === 'pillar') set({ pillar: 'all' });
    });

    $('pager').addEventListener('click', function (e) {
      var b = e.target.closest('[data-page]'); if (!b) return;
      set({ page: Number(b.dataset.page) }, true); window.scrollTo(0, 0);
    });

    /* Carte entière cliquable (sauf liens et boutons) */
    $('cards').addEventListener('click', function (e) {
      if (window.HOL_FAV && HOL_FAV.click(e, $('cards'))) return;
      if (e.target.closest('a')) return;
      var c = e.target.closest('.pcard'); if (c) location.href = c.dataset.href;
    });

    render();
    var done = function (arr) { LIST = arr.concat(DEMO ? D.PRATS : []); loaded = true; render(); };
    if (!window.HOL_DIR) return done([]);
    (window.HOL_FAV ? HOL_FAV.load() : Promise.resolve()).then(function () { return HOL_DIR.list(); }).then(done).catch(function () { HOL.toast('Impossible de charger les praticiens pour le moment.'); done([]); });
  });
})();
