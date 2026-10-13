/* Holisanna — fiche praticien : praticien.html?id=3[&date=Lun%2031%20août&heure=09:00][&from=pro] */
(function () {
  'use strict';
  var D = window.HOL_DATA;
  var params = new URLSearchParams(location.search);
  var prat = D.findPrat(params.get('id'));
  var host = document.getElementById('profile');
  var sel = { date: params.get('date'), time: params.get('heure') };

  function notFound() {
    document.title = 'Praticien introuvable — Holisanna';
    host.innerHTML = '<div class="empty"><h3>Praticien introuvable</h3><p>Cette fiche n’existe pas ou plus.</p><a class="btn btn-outline" href="recherche.html">Voir tous les praticiens</a></div>';
  }

  function render() {
    var pr = D.profile(prat), slots = HOL.Store.slots()[prat.id];
    var fromPro = params.get('from') === 'pro';
    var empty = D.DATES.every(function (d) { return !(slots[d] || []).length; });

    /* Un créneau présélectionné qui n'existe plus est ignoré */
    if (sel.date && sel.time && (slots[sel.date] || []).indexOf(sel.time) === -1) { sel.date = sel.time = null; }

    document.title = prat.name + ' — ' + prat.discipline + ' · Holisanna';

    host.innerHTML =
      '<a class="back" id="back" href="' + (fromPro ? 'espace-praticien.html' : 'recherche.html') + '">' + (fromPro ? '← Retour à mon espace' : '← Retour aux résultats') + '</a>' +
      '<div class="profile__cols"><div class="profile__main">' +

      '<section class="panel panel--identity">' +
        '<div class="photo" style="background:' + pr.bg + '"><div class="photo__initials" style="color:' + pr.color + '">' + pr.initials + '</div><div class="photo__soon" style="color:' + pr.color + '">Photo à venir</div></div>' +
        '<div class="identity"><div class="identity__top"><span class="identity__pillar" style="color:' + pr.color + '">' + pr.pillarLabel + '</span>' +
        (prat.founder ? '<span class="badge-founder">★ MEMBRE FONDATEUR</span>' : '') + '</div>' +
        '<h1>' + prat.name + '</h1><div class="identity__sub">' + prat.discipline + ' · ' + prat.place + '</div>' +
        '<div class="identity__meta"><span>★ ' + prat.rating + ' · ' + prat.reviews + '</span><span>' + prat.experience + '</span><span>' + pr.formatLabel + '</span></div></div>' +
      '</section>' +

      '<section class="panel"><h2 class="panel__title">L\'approche</h2><p class="bio">' + pr.bio + '</p>' +
        '<div class="bubbles">' + pr.tags.map(function (t) { return '<span class="bubble">' + t + '</span>'; }).join('') + '</div></section>' +

      '<section class="panel"><h2 class="panel__title" style="margin-bottom:20px">Informations pratiques</h2><div class="info-grid">' +
        '<div><div class="label-s">Adresse du cabinet</div><div class="address">' + pr.address1 + '<br>' + pr.address2 + '</div><div class="access">' + pr.access + '</div></div>' +
        '<div><div class="label-s">Langues parlées</div><div class="bubbles">' + pr.langs.map(function (l) { return '<span class="bubble bubble--lang">' + l + '</span>'; }).join('') + '</div></div></div>' +
        '<div class="socials-block"><div class="label-s" style="margin-bottom:12px">Retrouver ' + pr.firstName + '</div><div class="socials">' +
        pr.socials.map(function (s) { return '<a class="social" href="' + s.url + '" target="_blank" rel="noopener"><span>' + s.net + '</span><span>' + s.handle + '</span></a>'; }).join('') +
        '</div></div></section>' +

      '<section class="panel"><div class="offers__head"><h2 class="panel__title">Séances &amp; tarifs</h2><div class="offers__note">Règlement le jour de la séance</div></div>' +
        pr.offers.map(function (o) { return '<div class="offer"><div><div class="offer__name">' + o.name + '</div><div class="offer__detail">' + o.detail + '</div></div><div class="offer__price">' + o.price + '</div></div>'; }).join('') +
      '</section>' +

      '<section class="panel"><h2 class="panel__title" style="margin-bottom:18px">Ce que disent les explorateurs</h2><div class="reviews">' +
        pr.reviews.map(function (r) { return '<div><div class="review__stars">' + r.stars + '</div><p class="review__text">' + r.text + '</p><div class="review__author">' + r.author + '</div></div>'; }).join('') +
      '</div></section>' +
      '</div>' +

      '<aside class="booking-aside"><h2>Réserver une séance</h2><div class="booking-aside__sub">Agenda synchronisé en direct</div>' +
      (empty ? '<div class="no-slots"><h3>Aucun créneau ouvert</h3><p>Cette praticienne n\'a pas encore ouvert de disponibilités pour la semaine affichée.</p><button class="btn-small" type="button" id="ask">Demander ses disponibilités</button></div>' : '') +
      '<div class="agenda">' + D.DATES.map(function (d) {
        var times = slots[d] || [];
        return '<div><div class="agenda__day">' + d + '</div><div class="agenda__times">' +
          times.map(function (t) { return '<button type="button" class="slot' + (sel.date === d && sel.time === t ? ' is-on' : '') + '" data-date="' + d + '" data-time="' + t + '" aria-pressed="' + (sel.date === d && sel.time === t) + '">' + t + '</button>'; }).join('') +
          (times.length ? '' : '<span class="agenda__full">Complet</span>') + '</div></div>';
      }).join('') + '</div>' +
      '<div class="booking-aside__foot"><div class="booking-aside__line" id="line"></div>' +
      '<a class="btn btn-cta btn-block" id="go" href="#">Continuer</a></div></aside>' +
      '</div>';

    updateFoot();
    bind(pr);
  }

  function updateFoot() {
    var ok = sel.date && sel.time, go = document.getElementById('go');
    document.getElementById('line').textContent = ok ? sel.date + ' à ' + sel.time + ' · ' + prat.price + ' €' : 'Choisissez un créneau ci-dessus';
    go.classList.toggle('is-disabled', !ok);
    go.setAttribute('aria-disabled', String(!ok));
    go.href = ok ? 'reservation.html?id=' + prat.id + '&date=' + encodeURIComponent(sel.date) + '&heure=' + encodeURIComponent(sel.time) : '#';
  }

  function bind(pr) {
    document.querySelectorAll('.slot').forEach(function (b) {
      b.addEventListener('click', function () {
        sel.date = b.dataset.date; sel.time = b.dataset.time;
        document.querySelectorAll('.slot').forEach(function (x) {
          var on = x === b;
          x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', String(on));
        });
        updateFoot();
      });
    });
    document.getElementById('go').addEventListener('click', function (e) { if (!(sel.date && sel.time)) e.preventDefault(); });
    var ask = document.getElementById('ask');
    if (ask) ask.addEventListener('click', function () { HOL.toast('Demande envoyée. ' + pr.firstName + ' vous répondra par message.'); });
    /* « Retour aux résultats » conserve les filtres si l'on arrive de la recherche */
    document.getElementById('back').addEventListener('click', function (e) {
      if (params.get('from') !== 'pro' && document.referrer && /recherche\.html/.test(document.referrer) && history.length > 1) { e.preventDefault(); history.back(); }
    });
  }

  document.addEventListener('DOMContentLoaded', function () { prat ? render() : notFound(); });
})();
