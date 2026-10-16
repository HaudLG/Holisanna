/* Holisanna — réservation : reservation.html?id=3&date=Lun%2031%20août&heure=09:00
   Étape 1 (créneau) = la fiche praticien · étape 2 = récapitulatif · étape 3 = confirmation */
(function () {
  'use strict';
  var D = window.HOL_DATA, P = D.PILLARS;
  var params = new URLSearchParams(location.search);
  var prat = D.findPrat(params.get('id'));
  var date = params.get('date'), time = params.get('heure');
  var host = document.getElementById('booking');
  var step = params.get('etape') === '3' ? 3 : 2;

  function steps() {
    var labels = ['Créneau choisi', 'Récapitulatif & règlement', 'Confirmation'];
    return '<div class="bsteps">' + labels.map(function (l, i) {
      var n = i + 1, cls = n < step || n === 1 ? 'is-done' : n === step ? 'is-current' : '';
      if (n === step && n !== 1) cls = 'is-current';
      return '<div class="bstep ' + cls + '"><div class="bstep__n">0' + n + '</div><div class="bstep__label">' + l + '</div></div>';
    }).join('') + '</div>';
  }

  function profileUrl() { return 'praticien.html?id=' + prat.id + '&date=' + encodeURIComponent(date) + '&heure=' + encodeURIComponent(time); }

  function renderStep2() {
    var stillFree = (HOL.Store.slots()[prat.id][date] || []).indexOf(time) !== -1;
    var rows = [
      ['Praticien', prat.name],
      ['Discipline', prat.discipline + ' · ' + P[prat.pillar].label],
      ['Créneau', date + ' à ' + time],
      ['Lieu', prat.format === 'visio' ? 'Visioconférence' : prat.place],
      ['Durée', prat.duration]
    ];
    host.innerHTML = steps() + '<section class="bpanel"><h1>Confirmer et régler</h1>' +
      (stillFree ? '' : '<div class="warn">Ce créneau n’est plus disponible. <a href="' + 'praticien.html?id=' + prat.id + '">Choisir un autre horaire</a></div>') +
      '<div class="bgrid"><div><div class="label-s" style="margin-bottom:14px">Votre séance</div><div class="recap">' +
      rows.map(function (r) { return '<div class="recap__row"><span class="recap__k">' + r[0] + '</span><span class="recap__v">' + r[1] + '</span></div>'; }).join('') +
      '</div><div class="note-olive">Séance confirmée = une couche ajoutée à votre cocktail bien-être.</div></div>' +
      '<div><div class="label-s" style="margin-bottom:14px">Règlement</div>' +
      '<div class="pay-box"><strong>Règlement sur place</strong><span>Vous réglez directement le praticien le jour de la séance. Rien à payer maintenant, annulation gratuite jusqu\'à 24 h avant.</span></div>' +
      '<div class="pay-total"><span>À régler le jour de la séance</span><span>' + prat.price + ' €</span></div>' +
      '<div class="btn-row"><button class="btn btn-cta' + (stillFree ? '' : ' is-disabled') + '" type="button" id="confirm">Confirmer la réservation</button>' +
      '<a class="btn btn-outline" href="' + profileUrl() + '">Modifier</a></div></div></div></section>';
    document.getElementById('confirm').addEventListener('click', function () {
      if (!stillFree) return;
      var ses = HOL.Session.get();
      if (!ses.loggedIn || ses.role === 'praticien') {   /* réserver demande un compte explorateur */
        HOL.flash(ses.loggedIn ? 'Un compte praticien ne peut pas réserver. Connectez-vous avec un compte explorateur.' : 'Connectez-vous pour confirmer votre réservation.');
        location.href = 'connexion.html?next=' + encodeURIComponent('reservation.html' + location.search);
        return;
      }
      HOL.Store.book(prat, date, time);   /* réservation encore en démonstration (stockée dans le navigateur) */
      history.replaceState(null, '', location.pathname + '?id=' + prat.id + '&date=' + encodeURIComponent(date) + '&heure=' + encodeURIComponent(time) + '&etape=3');
      step = 3; render(); window.scrollTo(0, 0);
    });
  }

  function renderStep3() {
    host.innerHTML = steps() + '<section class="done"><div class="badge-confirmed">✓ RÉSERVATION CONFIRMÉE</div>' +
      '<h1>' + prat.name + ', ' + date + ' à ' + time + '</h1>' +
      '<p class="done__line">Vous réglerez ' + prat.price + ' € directement au praticien le jour de la séance.</p>' +
      '<p class="done__sub">L\'agenda du praticien est mis à jour, le créneau n\'est plus proposé aux autres explorateurs.</p>' +
      '<div class="btn-row"><a class="btn btn-primary" href="cocktail.html">Voir mon cocktail</a>' +
      '<a class="btn btn-outline" href="recherche.html">Continuer à explorer</a></div></section>';
  }

  function render() {
    document.title = (step === 3 ? 'Réservation confirmée' : 'Confirmer la réservation') + ' — Holisanna';
    step === 3 ? renderStep3() : renderStep2();
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!prat || !date || !time) { location.replace(prat ? 'praticien.html?id=' + prat.id : 'recherche.html'); return; }
    render();
  });
})();
