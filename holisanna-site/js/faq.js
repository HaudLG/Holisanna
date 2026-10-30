/* Holisanna — FAQ : trois groupes, une seule question ouverte à la fois. */
(function () {
  'use strict';
  var FAQ = {
  "expl": {
    "label": "Explorateurs",
    "items": [
      {
        "id": "q1",
        "q": "Comment se passe le règlement d’une séance ?",
        "a": "Vous ne payez rien sur Holisanna. Le montant affiché est réglé directement au praticien le jour du rendez-vous, selon les moyens de paiement qu'il accepte. La facture de la séance est émise par le praticien."
      },
      {
        "id": "q2",
        "q": "Puis-je annuler un rendez-vous ?",
        "a": "Oui, librement et gratuitement jusqu'à 24 heures avant le créneau, depuis Mes rendez-vous. En deçà de 24 heures, les conditions du praticien s'appliquent : elles sont indiquées sur sa fiche."
      },
      {
        "id": "q3",
        "q": "Qu’est-ce que le cocktail bien-être ?",
        "a": "La représentation des pratiques que vous suivez, organisée selon les trois piliers Corps, Âme et Esprit. Il se remplit par couches, séance après séance. Il n'y a rien à compléter à tout prix : un cocktail à une seule couche est un cocktail valable."
      },
      {
        "id": "q4",
        "q": "Les praticiens sont-ils vérifiés ?",
        "a": "Chaque praticien signe la charte éthique et déclare sa formation, ses années de pratique et son assurance responsabilité civile professionnelle. Holisanna ne délivre pas de diplôme et ne garantit pas de résultat : la charte engage le praticien, et tout manquement peut être signalé."
      },
      {
        "id": "q5",
        "q": "Comment écrire un avis ?",
        "a": "Après une séance passée, l'avis vous est proposé depuis Mes avis. Il porte sur une séance réellement suivie, est publié tel que vous l'écrivez, et le praticien dispose d'un droit de réponse."
      },
      {
        "id": "q6",
        "q": "Holisanna remplace-t-il un médecin ?",
        "a": "Non. Les pratiques référencées sont des pratiques de bien-être. Elles ne remplacent ni diagnostic, ni traitement, ni suivi médical, et aucun praticien ne peut vous inviter à interrompre un traitement."
      }
    ]
  },
  "prat": {
    "label": "Praticiens",
    "items": [
      {
        "id": "p1",
        "q": "Combien coûte le référencement ?",
        "a": "Un abonnement, sans commission sur vos séances. Fil Continu : 9,99 € par mois avec engagement de 12 mois, ou 109,89 € en une fois pour l'année (un mois offert). Fil Libre : 11,99 € par mois, sans engagement. Le premier mois est gratuit ; le prélèvement a lieu à la fin de l'essai, puis à la même date chaque mois. Factures disponibles dans votre espace."
      },
      {
        "id": "p1a",
        "q": "Comment fonctionne le mois d'essai gratuit ?",
        "a": "Il démarre à la première publication de votre fiche, pas à l'inscription. Rien n'est prélevé pendant ce mois. Vous choisissez votre formule et ajoutez votre carte depuis Abonnement & factures ; le premier prélèvement n'a lieu qu'à la fin de l'essai. Sans formule active à cette date, votre fiche est mise hors ligne."
      },
      {
        "id": "p1b",
        "q": "Comment résilier mon abonnement ?",
        "a": "Depuis Abonnement & factures, avec Gérer mon abonnement. Fil Libre : effet à la fin de la période payée. Fil Continu : effet à la fin des 12 mois d'engagement (ou à l'échéance annuelle si vous avez payé l'année). Votre fiche reste en ligne jusque-là, puis elle est mise hors ligne ; vos données restent récupérables trois mois."
      },
      {
        "id": "p2",
        "q": "Holisanna prend-il une commission ?",
        "a": "Non, aucune. Les séances sont réglées directement par l'explorateur le jour du rendez-vous. Holisanna ne touche pas aux paiements de séance."
      },
      {
        "id": "p3",
        "q": "Combien de temps pour être en ligne ?",
        "a": "Comptez une trentaine de minutes : créer votre compte, compléter votre fiche, ouvrir vos premiers créneaux. La fiche apparaît dans la recherche dès que des créneaux sont ouverts."
      },
      {
        "id": "p4",
        "q": "Puis-je proposer plusieurs disciplines ?",
        "a": "Oui. Une discipline principale, qui sert au classement dans la recherche, et autant de disciplines complémentaires que vous pratiquez réellement. Elles se règlent depuis Modifier ma fiche."
      },
      {
        "id": "p5",
        "q": "Puis-je masquer une prestation ou mettre ma fiche en pause ?",
        "a": "Une prestation se masque en un clic depuis Mes prestations, sans la supprimer. Pour une absence longue, il suffit de ne pas ouvrir de créneaux : votre fiche reste consultable mais n'est plus réservable."
      },
      {
        "id": "p6",
        "q": "Comment répondre à un avis ?",
        "a": "Depuis Avis reçus, chaque avis dispose d'un bouton Répondre. Votre réponse est publiée sous l'avis, visible de tous. Un avis contraire aux conditions d'utilisation peut être signalé."
      }
    ]
  },
  "compte": {
    "label": "Compte & données",
    "items": [
      {
        "id": "c1",
        "q": "Comment supprimer mon compte ?",
        "a": "Depuis Mon profil, à tout moment. Les données de compte sont conservées trois mois puis effacées ; les pièces comptables le sont dix ans, comme la loi l'exige."
      },
      {
        "id": "c2",
        "q": "Mes données de santé sont-elles collectées ?",
        "a": "Non. Aucune donnée de santé n'entre dans la plateforme, et ce qui se dit en séance reste entre vous et le praticien — y compris vis-à-vis de Holisanna."
      },
      {
        "id": "c3",
        "q": "Recevrai-je des e-mails promotionnels ?",
        "a": "Uniquement avec votre accord. Les notifications de réservation, d'avis et de facturation, elles, font partie du service."
      },
      {
        "id": "c4",
        "q": "Que faire en cas de problème avec un praticien ?",
        "a": "Écrivez à contact@holisanna.fr avec l'objet « Signalement », le nom du praticien et la date de la séance. Le signalement est instruit sous sept jours, reste confidentiel, et peut mener au retrait de la fiche."
      }
    ]
  }
};
  var group = new URLSearchParams(location.search).get('groupe');
  if (!FAQ[group]) group = 'expl';
  var open = FAQ[group].items[0].id;
  var host = document.getElementById('faq');
  function esc(x) { return String(x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function render() {
    host.innerHTML = '<div class="faq-tabs">' + Object.keys(FAQ).map(function (k) {
      return '<button class="faq-tab' + (k === group ? ' is-on' : '') + '" type="button" data-g="' + k + '">' + FAQ[k].label + '</button>';
    }).join('') + '</div><div class="faq-list">' + FAQ[group].items.map(function (it) {
      var o = it.id === open;
      return '<div class="faq-item' + (o ? ' is-open' : '') + '"><button class="faq-q" type="button" data-id="' + it.id + '" aria-expanded="' + o + '"><span>' + esc(it.q) + '</span><span>' + (o ? '−' : '+') + '</span></button>' +
        (o ? '<p class="faq-a">' + esc(it.a).replace(/contact@holisanna\.fr/g, '<a href="mailto:contact@holisanna.fr">contact@holisanna.fr</a>') + '</p>' : '') + '</div>';
    }).join('') + '</div>';
  }
  document.addEventListener('DOMContentLoaded', function () {
    host.addEventListener('click', function (e) {
      var t = e.target.closest('[data-g]'), q = e.target.closest('[data-id]');
      if (t) { group = t.dataset.g; open = FAQ[group].items[0].id; render(); }
      else if (q) { open = open === q.dataset.id ? '' : q.dataset.id; render(); }
    });
    render();
  });
})();
