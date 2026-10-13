/* Holisanna — pages d'erreur : 404, 500, paiement non abouti, session expirée.
   Le type vient de <body data-type="404"> ou de l'adresse : erreur.html?type=500|paiement|session */
(function () {
  'use strict';
  var type = document.body.getAttribute('data-type') || new URLSearchParams(location.search).get('type') || '404';
  var host = document.getElementById('err');
  var s = HOL.Session.get();
  var espace = s.loggedIn ? (s.role === 'praticien' ? 'espace-praticien.html' : 'espace.html') : 'connexion.html';
  var cocktail = s.loggedIn && s.role !== 'praticien' ? 'cocktail.html' : 'connexion.html';

  function setPay(method, msg) { var st = HOL.Store.get(); st.payMethod = method; HOL.Store.set(st); HOL.flash(msg); }

  var ERRORS = {
    '404': {
      accent: 'var(--rose)', code: 'Erreur 404', title: 'Ce chemin', em: "n'existe pas.",
      sub: "La page que vous cherchez semble s'être égarée sur le chemin du bien-être. Pas d'inquiétude — il existe d'autres voies.",
      actions: [
        { label: "← Retour à l'accueil", cls: 'dark', href: 'index.html' },
        { label: 'Trouver un praticien', cls: 'rose', href: 'recherche.html' },
        { label: 'Mon espace', cls: 'out', href: espace }
      ],
      chips: [
        { label: 'Mon cocktail', href: cocktail }, { label: 'Questions fréquentes', href: 'faq.html' },
        { label: 'Naturopathie', href: 'recherche.html?q=Naturopathie' }, { label: 'Sophrologie', href: 'recherche.html?q=Sophrologie' }, { label: 'Reiki', href: 'recherche.html?q=Reiki' }
      ],
      foot: 'Vous ne trouvez toujours pas ? Écrivez-nous à'
    },
    '500': {
      accent: 'var(--olive)', code: 'Erreur 500', title: 'Holisanna fait', em: 'une petite pause.',
      sub: "Même les plateformes ont besoin de prendre soin d'elles de temps en temps. Nos équipes sont sur le pont, tout devrait rentrer dans l'ordre très bientôt.",
      countdown: true,
      actions: [
        { label: 'Réessayer maintenant', cls: 'dark', act: 'reload' },
        { label: "← Retour à l'accueil", cls: 'out', href: 'index.html' }
      ],
      foot: 'Si le problème persiste, contactez-nous à'
    },
    paiement: {
      accent: 'var(--gold)', code: 'Paiement non abouti', title: 'Votre paiement', em: "n'a pas pu être traité.",
      sub: "Votre banque a refusé le prélèvement de l'abonnement. Votre fiche reste en ligne pendant sept jours : le temps de régler cela sans précipitation.",
      actions: [
        { label: 'Réessayer le paiement', cls: 'rose', act: 'retry' },
        { label: 'Changer de moyen', cls: 'dark', href: 'pro-abonnement.html' },
        { label: 'Questions fréquentes', cls: 'out', href: 'faq.html' }
      ],
      chips: [
        { label: 'Utiliser une autre carte', act: 'card' }, { label: 'Passer au prélèvement SEPA', act: 'sepa' }, { label: 'Vérifier mes factures', href: 'pro-abonnement.html' }
      ],
      foot: 'Le prélèvement échoue toujours ? Écrivez-nous à'
    },
    session: {
      accent: 'var(--gold)', code: 'Session expirée', title: 'Votre session', em: "s'est refermée.",
      sub: "Après une heure sans activité, nous vous déconnectons pour protéger vos données. Vos réservations et votre cocktail sont intacts : reconnectez-vous et vous reprenez où vous en étiez.",
      actions: [
        { label: 'Se reconnecter', cls: 'dark', act: 'relogin' },
        { label: "Retour à l'accueil", cls: 'out', href: 'index.html' }
      ],
      foot: 'Un souci de connexion ? Écrivez-nous à'
    }
  };
  var err = ERRORS[type] || ERRORS['404'];

  function render() {
    document.title = err.code + ' — Holisanna';
    var btn = function (a, i) {
      return a.href ? '<a class="err__btn err__btn--' + a.cls + '" href="' + a.href + '">' + a.label + '</a>'
                    : '<button class="err__btn err__btn--' + a.cls + '" type="button" data-act="' + a.act + '">' + a.label + '</button>';
    };
    var chip = function (c) {
      return c.href ? '<a class="err__chip" href="' + c.href + '">' + c.label + '</a>' : '<button class="err__chip" type="button" data-act="' + c.act + '">' + c.label + '</button>';
    };
    host.innerHTML = '<img class="err__logo" src="assets/logo-dreamcatcher.png" alt="">' +
      '<div class="err__code" style="color:' + err.accent + '">' + err.code + '</div>' +
      '<h1>' + err.title + '<br><em style="color:' + err.accent + '">' + err.em + '</em></h1><p class="err__sub">' + err.sub + '</p>' +
      (err.countdown ? '<div class="err__count">Nouvelle tentative automatique dans <span id="secs">30</span> secondes…</div><div class="err__bar"><div></div></div>' : '') +
      '<div class="err__actions">' + err.actions.map(btn).join('') + '</div>' +
      (err.chips ? '<div class="err__chips">' + err.chips.map(chip).join('') + '</div>' : '') +
      '<p class="err__foot">' + err.foot + ' <a href="mailto:contact@holisanna.fr">contact@holisanna.fr</a></p>';
  }

  var ACTIONS = {
    reload: function () { location.reload(); },
    retry: function () { HOL.flash('Nouvelle tentative de prélèvement lancée.'); location.href = 'pro-abonnement.html'; },
    card: function () { setPay('card', 'Renseignez votre nouvelle carte dans Abonnement & factures.'); location.href = 'pro-abonnement.html'; },
    sepa: function () { setPay('sepa', 'Moyen de prélèvement : prélèvement SEPA.'); location.href = 'pro-abonnement.html'; },
    relogin: function () { HOL.Session.logout(); location.href = 'connexion.html'; }
  };

  document.addEventListener('DOMContentLoaded', function () {
    render();
    host.addEventListener('click', function (e) {
      var el = e.target.closest('[data-act]'); if (el && ACTIONS[el.dataset.act]) ACTIONS[el.dataset.act]();
    });
    if (err.countdown) {
      var n = 30, t = setInterval(function () {
        n--; var el = document.getElementById('secs');
        if (n <= 0) { clearInterval(t); if (el) el.textContent = '0'; HOL.toast('Nouvelle tentative… le service ne répond pas encore.'); }
        else if (el) el.textContent = n;
      }, 1000);
    }
  });
})();
