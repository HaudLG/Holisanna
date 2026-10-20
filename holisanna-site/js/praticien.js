/* Holisanna — fiche praticien.
   praticien.html?p=<slug>[&jour=2026-10-24&heure=14:00]  → praticien réel (Supabase)
   praticien.html?id=3[&date=Lun%2031%20août&heure=09:00][&from=pro]  → fiche de démonstration */
(function () {
  'use strict';
  var D = window.HOL_DATA;
  var params = new URLSearchParams(location.search);
  var host = document.getElementById('profile');
  var slug = params.get('p');
  var prat = slug ? null : D.findPrat(params.get('id'));
  var sel = { date: params.get('jour') || params.get('date'), time: params.get('heure'), offer: params.get('prestation') };

  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function notFound() {
    document.title = 'Praticien introuvable — Holisanna';
    host.innerHTML = '<div class="empty"><h3>Praticien introuvable</h3><p>Cette fiche n’existe pas ou plus.</p><a class="btn btn-outline" href="recherche.html">Voir tous les praticiens</a></div>';
  }
  function loading() { host.innerHTML = '<div class="empty"><p>Chargement de la fiche…</p></div>'; }

  /* Profil affichable d'un praticien réel (même forme que HOL_DATA.profile) */
  function realProfile(r) {
    var pl = D.PILLARS[r.pillar], socials = [];
    if (r.insta) socials.push({ net: 'Instagram', handle: '@' + r.insta, url: 'https://instagram.com/' + encodeURIComponent(r.insta) });
    if (/^https?:\/\//i.test(r.site)) socials.push({ net: 'Site web', handle: r.site.replace(/^https?:\/\//i, '').replace(/\/$/, ''), url: r.site });
    else if (r.site) socials.push({ net: 'Site web', handle: r.site, url: 'https://' + r.site });
    var cab = r.modes.indexOf('Cabinet') !== -1;
    return {
      pillarLabel: pl.label, color: pl.color, bg: pl.bg, initials: D.initials(r.name), firstName: r.name.split(' ')[0],
      address1: cab ? r.adresse : '', address2: cab ? [r.cp, r.ville].filter(Boolean).join(' ') : r.ville,
      access: cab ? '' : 'Séances à distance ou à domicile : le lieu est précisé après la réservation.',
      langs: r.langs, socials: socials,
      formatLabel: r.modes.join(' · '), bio: r.bio, parcours: r.parcours,
      tags: [r.discipline].concat(r.comp).concat(r.modes).filter(Boolean), offers: r.offers, reviews: r.reviewList.map(function (a) { return { stars: a.stars, text: esc(a.text) + (a.reponse ? '<br><span style="display:block;margin-top:8px;font-size:13px;opacity:.8"><b>Réponse du praticien :</b> ' + esc(a.reponse) + '</span>' : ''), author: esc(a.author) }; })
    };
  }

  /* Jours proposés dans l'agenda : démo = semaine fixe ; réel = prochains jours ayant des créneaux */
  function agendaDays(p) {
    if (!p.real) { var sl = HOL.Store.slots()[p.id]; return D.DATES.map(function (d) { return { key: d, label: d, times: sl[d] || [] }; }); }
    var map = {}, ids = {}, out = [];
    p.slots.forEach(function (s) { if (s.di <= 28) { (map[s.day] = map[s.day] || []).push(s.hm); ids[s.day + ' ' + s.hm] = s.id; } });
    Object.keys(map).sort().slice(0, 8).forEach(function (d) { out.push({ key: d, label: HOL_DIR.dayLabel(d), times: map[d], ids: ids }); });
    return out;
  }

  function render(p, preview) {
    var pr = p.real ? realProfile(p) : D.profile(p), days = agendaDays(p);
    var fromPro = params.get('from') === 'pro';
    var empty = days.every(function (d) { return !d.times.length; });

    /* Un créneau présélectionné qui n'existe plus est ignoré */
    var cur = days.filter(function (d) { return d.key === sel.date; })[0];
    if (!(cur && cur.times.indexOf(sel.time) !== -1)) { sel.date = sel.time = null; }

    document.title = p.name + ' — ' + p.discipline + ' · Holisanna';
    var reviewsHtml = pr.reviews.length ? pr.reviews.map(function (r) { return '<div><div class="review__stars">' + r.stars + '</div><p class="review__text">' + r.text + '</p><div class="review__author">' + r.author + '</div></div>'; }).join('')
      : '<p class="bio" style="margin:0">Pas encore d’avis. Les avis sont déposés uniquement par des explorateurs ayant suivi une séance.</p>';
    var offersHtml = pr.offers.length ? pr.offers.map(function (o) { return '<div class="offer"><div><div class="offer__name">' + esc(o.name) + '</div><div class="offer__detail">' + esc(o.detail) + '</div></div><div class="offer__price">' + esc(o.price) + '</div></div>'; }).join('')
      : '<p class="bio" style="margin:0">Les séances et tarifs seront bientôt précisés.</p>';
    var addr = p.real ? (pr.address1 || pr.address2 ? '<div><div class="label-s">' + (pr.address1 ? 'Adresse du cabinet' : 'Ville') + '</div><div class="address">' + esc(pr.address1) + (pr.address1 && pr.address2 ? '<br>' : '') + esc(pr.address2) + '</div>' + (pr.access ? '<div class="access">' + esc(pr.access) + '</div>' : '') + '</div>' : '<div></div>')
      : '<div><div class="label-s">Adresse du cabinet</div><div class="address">' + pr.address1 + '<br>' + pr.address2 + '</div><div class="access">' + pr.access + '</div></div>';
    var socials = pr.socials.length ? '<div class="socials-block"><div class="label-s" style="margin-bottom:12px">Retrouver ' + esc(pr.firstName) + '</div><div class="socials">' +
      pr.socials.map(function (s) { return '<a class="social" href="' + esc(s.url) + '" target="_blank" rel="noopener"><span>' + esc(s.net) + '</span><span>' + esc(s.handle) + '</span></a>'; }).join('') + '</div></div>' : '';
    var meta = p.real ? '<span>' + (!p.published ? 'Aperçu · non publiée' : p.reviews ? '★ ' + String(p.rating).replace('.', ',') + ' · ' + p.reviews + ' avis' : 'Nouveau sur Holisanna') + '</span><span>' + esc(pr.formatLabel) + '</span>'
      : '<span>★ ' + p.rating + ' · ' + p.reviews + '</span><span>' + p.experience + '</span><span>' + pr.formatLabel + '</span>';

    host.innerHTML =
      (preview ? '<div class="no-slots" style="margin-bottom:18px"><h3>Aperçu de votre fiche</h3><p>Elle n’est pas encore publiée : seule vous pouvez la voir. Publiez-la depuis « Modifier ma fiche » pour qu’elle apparaisse dans la recherche.</p></div>' : '') +
      '<a class="back" id="back" href="' + (fromPro ? 'pro-fiche.html' : 'recherche.html') + '">' + (fromPro ? '← Retour à ma fiche' : '← Retour aux résultats') + '</a>' +
      '<div class="profile__cols"><div class="profile__main">' +

      '<section class="panel panel--identity">' +
        (p.photo ? '<div class="photo" style="background:url(' + p.photo + ') center/cover"></div>' : '<div class="photo" style="background:' + pr.bg + '"><div class="photo__initials" style="color:' + pr.color + '">' + esc(pr.initials) + '</div>' + (p.real ? '' : '<div class="photo__soon" style="color:' + pr.color + '">Photo à venir</div>') + '</div>') +
        '<div class="identity"><div class="identity__top"><span class="identity__pillar" style="color:' + pr.color + '">' + pr.pillarLabel + '</span>' +
        (p.founder ? '<span class="badge-founder">★ MEMBRE FONDATEUR</span>' : '') + (p.real && p.published && window.HOL_FAV ? '<span style="margin-left:auto">' + HOL_FAV.btn(p.uid) + '</span>' : '') + '</div>' +
        '<h1>' + esc(p.name) + '</h1><div class="identity__sub">' + esc(p.discipline) + (p.place ? ' · ' + esc(p.place) : '') + '</div>' +
        '<div class="identity__meta">' + meta + '</div></div>' +
      '</section>' +

      '<section class="panel"><h2 class="panel__title">L\'approche</h2><p class="bio">' + esc(pr.bio).replace(/\n+/g, '</p><p class="bio">') + '</p>' +
        (pr.parcours ? '<h2 class="panel__title" style="margin-top:22px">Parcours</h2><p class="bio">' + esc(pr.parcours).replace(/\n+/g, '</p><p class="bio">') + '</p>' : '') +
        '<div class="bubbles">' + pr.tags.map(function (t) { return '<span class="bubble">' + esc(t) + '</span>'; }).join('') + '</div></section>' +

      ((p.gallery && p.gallery.length) ? '<section class="panel"><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px">' + p.gallery.map(function (g) { return '<figure style="margin:0"><img src="' + g.url + '" alt="' + esc(g.label + ' — ' + p.name) + '" loading="lazy" style="width:100%;height:200px;object-fit:cover;display:block"><figcaption class="offer__detail" style="margin-top:6px">' + esc(g.label) + '</figcaption></figure>'; }).join('') + '</div></section>' : '') +
      '<section class="panel"><h2 class="panel__title" style="margin-bottom:20px">Informations pratiques</h2><div class="info-grid">' + addr +
        '<div><div class="label-s">Langues parlées</div><div class="bubbles">' + pr.langs.map(function (l) { return '<span class="bubble bubble--lang">' + esc(l) + '</span>'; }).join('') + '</div></div></div>' + socials + '</section>' +

      '<section class="panel"><div class="offers__head"><h2 class="panel__title">Séances &amp; tarifs</h2><div class="offers__note">Règlement le jour de la séance</div></div>' + offersHtml + '</section>' +

      '<section class="panel"><h2 class="panel__title" style="margin-bottom:18px">Ce que disent les explorateurs</h2><div class="reviews">' + reviewsHtml + '</div></section>' +
      '</div>' +

      '<aside class="booking-aside"><h2>Réserver une séance</h2><div class="booking-aside__sub">Agenda synchronisé en direct</div>' +
      (empty ? '<div class="no-slots"><h3>Aucun créneau ouvert</h3><p>' + (p.real ? esc(pr.firstName) + ' n’a pas encore ouvert de disponibilités.' : 'Cette praticienne n\'a pas encore ouvert de disponibilités pour la semaine affichée.') + '</p>' + (p.real ? '' : '<button class="btn-small" type="button" id="ask">Demander ses disponibilités</button>') + '</div>' : '') +
      (p.real && p.offers.length > 1 ? '<div class="ffield" style="margin:0 0 16px"><label for="offer">Prestation</label><select id="offer">' + p.offers.map(function (o) { return '<option value="' + esc(o.id) + '"' + (offerOf(p).id === o.id ? ' selected' : '') + '>' + esc(o.name + ' · ' + o.detail + ' · ' + o.price) + '</option>'; }).join('') + '</select></div>' : '') +
      '<div class="agenda">' + days.map(function (d) {
        return '<div><div class="agenda__day">' + esc(d.label) + '</div><div class="agenda__times">' +
          d.times.map(function (t) { return '<button type="button" class="slot' + (sel.date === d.key && sel.time === t ? ' is-on' : '') + '" data-date="' + esc(d.key) + '" data-time="' + t + '" aria-pressed="' + (sel.date === d.key && sel.time === t) + '">' + t + '</button>'; }).join('') +
          (d.times.length ? '' : '<span class="agenda__full">Complet</span>') + '</div></div>';
      }).join('') + '</div>' +
      '<div class="booking-aside__foot"><div class="booking-aside__line" id="line"></div>' +
      '<a class="btn btn-cta btn-block" id="go" href="#">Continuer</a></div></aside>' +
      '</div>';

    updateFoot(p, days);
    bind(p, pr, days);
  }

  function offerOf(p) { return p.offers.filter(function (o) { return o.id === sel.offer; })[0] || p.offers[0] || null; }
  function updateFoot(p, days) {
    var ok = sel.date && sel.time, go = document.getElementById('go');
    var lbl = ok ? (days.filter(function (d) { return d.key === sel.date; })[0] || {}).label : '';
    document.getElementById('line').textContent = ok ? lbl + ' à ' + sel.time + (p.real ? (offerOf(p) ? ' · ' + offerOf(p).prix + ' €' : '') : (p.price != null ? ' · ' + p.price + ' €' : '')) : 'Choisissez un créneau ci-dessus';
    go.classList.toggle('is-disabled', !ok);
    go.setAttribute('aria-disabled', String(!ok));
    var cur = days.filter(function (d) { return d.key === sel.date; })[0];
    go.href = ok ? (p.real ? 'reservation.html?p=' + encodeURIComponent(p.id) + '&creneau=' + encodeURIComponent(cur.ids[sel.date + ' ' + sel.time]) + '&prestation=' + encodeURIComponent((offerOf(p) || {}).id || '') : 'reservation.html?id=' + p.id + '&date=' + encodeURIComponent(sel.date) + '&heure=' + encodeURIComponent(sel.time)) : '#';
  }

  function bind(p, pr, days) {
    document.querySelectorAll('.slot').forEach(function (b) {
      b.addEventListener('click', function () {
        sel.date = b.dataset.date; sel.time = b.dataset.time;
        document.querySelectorAll('.slot').forEach(function (x) {
          var on = x === b;
          x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', String(on));
        });
        updateFoot(p, days);
      });
    });
    host.addEventListener('click', function (e) { if (window.HOL_FAV) HOL_FAV.click(e, host); });
    document.getElementById('go').addEventListener('click', function (e) {
      if (!(sel.date && sel.time)) { e.preventDefault(); return; }
      if (p.real && !offerOf(p)) { e.preventDefault(); HOL.toast('Ce praticien n’a pas encore de prestation réservable.'); }
    });
    var off = document.getElementById('offer');
    if (off) off.addEventListener('change', function () { sel.offer = off.value; updateFoot(p, days); });
    var ask = document.getElementById('ask');
    if (ask) ask.addEventListener('click', function () { HOL.toast('Demande envoyée. ' + pr.firstName + ' vous répondra par message.'); });
    /* « Retour aux résultats » conserve les filtres si l'on arrive de la recherche */
    document.getElementById('back').addEventListener('click', function (e) {
      if (params.get('from') !== 'pro' && document.referrer && /recherche\.html/.test(document.referrer) && history.length > 1) { e.preventDefault(); history.back(); }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!slug) { prat ? render(prat) : notFound(); return; }
    loading();
    (window.HOL_FAV ? HOL_FAV.load() : Promise.resolve()).then(function () { return HOL_DIR.one(slug); }).then(function (p) { if (!p) return notFound(); render(p, !p.published); })
      .catch(function () { host.innerHTML = '<div class="empty"><h3>Fiche momentanément indisponible</h3><p>Réessayez dans un instant.</p><a class="btn btn-outline" href="recherche.html">Voir tous les praticiens</a></div>'; });
  });
})();
