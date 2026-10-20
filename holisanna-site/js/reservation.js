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

  /* ===== Réservation réelle : reservation.html?p=<slug>&creneau=<id>&prestation=<id> (étape 3 : &r=<id réservation>) ===== */
  var slug = params.get('p');
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function when(iso) { var a = window.HOL_DIR; var d = new Date(iso), p = {}; new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(d).forEach(function (x) { p[x.type] = x.value; }); return p.weekday.charAt(0).toUpperCase() + p.weekday.slice(1) + ' ' + p.day + ' ' + p.month + ' à ' + p.hour + 'h' + p.minute; }
  function realDone(r) {
    host.innerHTML = steps() + '<section class="done"><div class="badge-confirmed">✓ RÉSERVATION CONFIRMÉE</div>' +
      '<h1>' + esc(r.praticien_nom) + ', ' + esc(when(r.debut)) + '</h1>' +
      '<p class="done__line">' + esc(r.prestation_nom) + ' · ' + esc(r.duree_minutes) + ' min' + (r.lieu ? ' · ' + esc(r.lieu) : '') + '. Vous réglerez ' + esc(r.prix_annonce) + ' € directement au praticien le jour de la séance.</p>' +
      '<p class="done__sub">L\'agenda du praticien est mis à jour, le créneau n\'est plus proposé aux autres explorateurs. Annulation gratuite jusqu\'à 24 h avant la séance.</p>' +
      '<div class="btn-row"><a class="btn btn-primary" href="espace-rendez-vous.html">Voir mes rendez-vous</a>' +
      '<a class="btn btn-outline" href="recherche.html">Continuer à explorer</a></div></section>';
  }
  function realFlow() {
    var cid = params.get('creneau'), oid = params.get('prestation'), rid = params.get('r');
    host.innerHTML = '<div class="empty"><p>Chargement…</p></div>';
    if (rid) {
      step = 3; document.title = 'Réservation confirmée — Holisanna';
      HOL.sb().from('reservations').select('*').eq('id', rid).maybeSingle().then(function (r) {
        if (r.error || !r.data) { location.replace('espace-rendez-vous.html'); return; }
        realDone(r.data);
      }); return;
    }
    HOL_DIR.one(slug).then(function (p) {
      if (!p || !p.published) { location.replace('recherche.html'); return; }
      var slot = p.slots.filter(function (x) { return x.id === cid; })[0];
      var offer = p.offers.filter(function (o) { return o.id === oid; })[0] || p.offers[0];
      var back = 'praticien.html?p=' + encodeURIComponent(slug);
      var cab = offer && offer.mode === 'cabinet';
      var lieu = !offer ? '' : cab ? [p.adresse, [p.cp, p.ville].filter(Boolean).join(' ')].filter(Boolean).join(', ') : offer.mode === 'visio' ? 'Visioconférence' : 'À domicile';
      var ok = !!(slot && offer);
      var rows = ok ? [
        ['Praticien', esc(p.name)], ['Discipline', esc(p.discipline) + ' · ' + esc(p.pillarLabel)], ['Prestation', esc(offer.name)],
        ['Créneau', esc(HOL_DIR.dayLabel(slot.day)) + ' à ' + slot.hm], ['Lieu', esc(lieu)], ['Durée', esc(offer.detail)]
      ] : [];
      document.title = 'Confirmer la réservation — Holisanna';
      host.innerHTML = steps() + '<section class="bpanel"><h1>Confirmer et régler</h1>' +
        '<div class="warn" id="warn"' + (ok ? ' hidden' : '') + '>Ce créneau n’est plus disponible. <a href="' + back + '">Choisir un autre horaire</a></div>' +
        '<div class="bgrid"><div><div class="label-s" style="margin-bottom:14px">Votre séance</div><div class="recap">' +
        rows.map(function (r) { return '<div class="recap__row"><span class="recap__k">' + r[0] + '</span><span class="recap__v">' + r[1] + '</span></div>'; }).join('') +
        '</div><div class="note-olive">Séance confirmée = une couche ajoutée à votre cocktail bien-être.</div></div>' +
        '<div><div class="label-s" style="margin-bottom:14px">Règlement</div>' +
        '<div class="pay-box"><strong>Règlement sur place</strong><span>Vous réglez directement le praticien le jour de la séance. Rien à payer maintenant, annulation gratuite jusqu\'à 24 h avant.</span></div>' +
        '<div class="pay-total"><span>À régler le jour de la séance</span><span>' + (offer ? esc(offer.prix) : '') + ' €</span></div>' +
        '<div class="btn-row"><button class="btn btn-cta' + (ok ? '' : ' is-disabled') + '" type="button" id="confirm">Confirmer la réservation</button>' +
        '<a class="btn btn-outline" href="' + back + '">Modifier</a></div></div></div></section>';
      var btn = document.getElementById('confirm');
      btn.addEventListener('click', function () {
        if (!ok || btn.dataset.busy) return;
        var ses = HOL.Session.get();
        if (!ses.loggedIn || ses.role === 'praticien') {   /* réserver demande un compte explorateur */
          HOL.flash(ses.loggedIn ? 'Un compte praticien ne peut pas réserver. Connectez-vous avec un compte explorateur.' : 'Connectez-vous pour confirmer votre réservation.');
          location.href = 'connexion.html?next=' + encodeURIComponent('reservation.html' + location.search);
          return;
        }
        btn.dataset.busy = '1'; btn.textContent = 'Réservation en cours…';
        HOL.sb().rpc('reserver', { p_creneau: slot.id, p_prestation: offer.id }).then(function (r) {
          if (r.error) throw r.error;
          history.replaceState(null, '', location.pathname + '?p=' + encodeURIComponent(slug) + '&r=' + encodeURIComponent(r.data) + '&etape=3');
          step = 3;
          return HOL.sb().from('reservations').select('*').eq('id', r.data).maybeSingle().then(function (q) {
            realDone(q.data || { praticien_nom: p.name, debut: new Date().toISOString(), prestation_nom: offer.name, duree_minutes: offer.duree, lieu: lieu, prix_annonce: offer.prix });
            window.scrollTo(0, 0);
          });
        }).catch(function (e) {
          btn.dataset.busy = ''; btn.textContent = 'Confirmer la réservation';
          var w = document.getElementById('warn'); w.hidden = false;
          w.innerHTML = esc(/^[A-ZÀ-Ý]/.test(e.message || '') && e.code === 'P0001' ? e.message : 'La réservation n’a pas pu aboutir. Réessayez dans un instant.') + ' <a href="' + back + '">Choisir un autre horaire</a>';
          w.scrollIntoView({ block: 'center' });
        });
      });
    }).catch(function () { host.innerHTML = '<div class="empty"><h3>Réservation momentanément indisponible</h3><p>Réessayez dans un instant.</p><a class="btn btn-outline" href="recherche.html">Retour à la recherche</a></div>'; });
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (slug) { realFlow(); return; }
    if (!prat || !date || !time) { location.replace(prat ? 'praticien.html?id=' + prat.id : 'recherche.html'); return; }
    render();
  });
})();
