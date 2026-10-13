/* Holisanna — gabarits d'e-mails transactionnels (écran de référence, à reproduire côté service d'envoi). */
(function () {
  'use strict';
  var EMAILS = {
  "confirmation": {
    "tab": "Confirmation",
    "to": "sarah.nguyen@email.com",
    "subject": "Votre séance du 9 septembre est confirmée",
    "eyebrow": "Réservation confirmée",
    "accent": "var(--olive)",
    "title": "C’est noté, Sarah.",
    "lead": "Naïma Belkacem vous attend mercredi. Rien à régler d’ici là : le paiement se fait sur place, le jour de la séance.",
    "rows": [
      {
        "k": "Praticienne",
        "v": "Naïma Belkacem · Naturopathie"
      },
      {
        "k": "Date",
        "v": "Mercredi 9 septembre 2026, 14h00 — 15h30"
      },
      {
        "k": "Lieu",
        "v": "24 rue de la Roquette, 75011 Paris"
      },
      {
        "k": "À régler sur place",
        "v": "85 €"
      }
    ],
    "cta": "AJOUTER À MON AGENDA",
    "ctaNote": "Annulation gratuite jusqu’au 8 septembre à 14h00.",
    "ps": "Un empêchement ? Vous pouvez déplacer ou annuler depuis votre espace, en deux clics."
  },
  "rappel": {
    "tab": "Rappel 24 h",
    "to": "sarah.nguyen@email.com",
    "subject": "Demain, 14h : votre séance avec Naïma",
    "eyebrow": "Rappel de séance",
    "accent": "var(--rose)",
    "title": "À demain, Sarah.",
    "lead": "Votre séance de naturopathie a lieu demain à 14h00. Prévoyez d’arriver cinq minutes avant, l’entrée se fait par la cour.",
    "rows": [
      {
        "k": "Quand",
        "v": "Mercredi 9 septembre, 14h00 — 15h30"
      },
      {
        "k": "Où",
        "v": "24 rue de la Roquette, 75011 Paris — code 4B12"
      },
      {
        "k": "À prévoir",
        "v": "Votre carnet de suivi, une bouteille d’eau"
      },
      {
        "k": "À régler sur place",
        "v": "85 € — carte ou espèces"
      }
    ],
    "cta": "VOIR L’ITINÉRAIRE",
    "ctaNote": "Annulation gratuite jusqu’à aujourd’hui 14h00.",
    "ps": "Si vous ne pouvez plus venir, prévenez Naïma dès maintenant : son créneau pourra servir à quelqu’un d’autre."
  },
  "avis": {
    "tab": "Avis à écrire",
    "to": "sarah.nguyen@email.com",
    "subject": "Comment s’est passée votre séance ?",
    "eyebrow": "Votre avis",
    "accent": "var(--gold)",
    "title": "Un mot sur votre séance ?",
    "lead": "Vous avez vu Yann Le Guen samedi dernier. Quelques lignes suffisent : elles aident les prochains explorateurs à choisir, et Yann à ajuster sa pratique.",
    "rows": [
      {
        "k": "Séance",
        "v": "Reiki · Yann Le Guen, Rennes"
      },
      {
        "k": "Date",
        "v": "Samedi 29 août 2026"
      },
      {
        "k": "Publication",
        "v": "Votre prénom et l’initiale de votre nom"
      }
    ],
    "cta": "ÉCRIRE MON AVIS",
    "ctaNote": "Deux minutes, pas plus. Vous pouvez aussi ne rien écrire.",
    "ps": "Votre avis est publié tel que vous l’écrivez. Le praticien dispose d’un droit de réponse, sans pouvoir le modifier."
  },
  "prelevement": {
    "tab": "Échec de prélèvement",
    "to": "camille.ferrand@email.com",
    "subject": "Votre prélèvement du 1er septembre a été refusé",
    "eyebrow": "Abonnement praticien",
    "accent": "var(--rose)",
    "title": "Le prélèvement n’est pas passé.",
    "lead": "Votre banque a refusé le prélèvement de votre abonnement. Votre fiche reste en ligne pendant sept jours, le temps de régulariser sans précipitation.",
    "rows": [
      {
        "k": "Formule",
        "v": "Fil Libre · 11,99 € / mois"
      },
      {
        "k": "Date de tentative",
        "v": "1er septembre 2026"
      },
      {
        "k": "Moyen",
        "v": "Carte Visa •••• 4218"
      },
      {
        "k": "Fiche en ligne jusqu’au",
        "v": "8 septembre 2026"
      }
    ],
    "cta": "METTRE À JOUR MON MOYEN DE PAIEMENT",
    "ctaNote": "Une nouvelle tentative est faite automatiquement sous 48 h.",
    "ps": "Vous pouvez aussi passer au prélèvement SEPA : pas de carte à renouveler, et c’est la formule la plus stable sur la durée."
  }
};
  var current = 'confirmation';
  var host = document.getElementById('mail-host');
  function esc(x) { return String(x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function render() {
    var em = EMAILS[current];
    host.innerHTML = '<div class="mail-tabs">' + Object.keys(EMAILS).map(function (k) {
      return '<button class="mail-tab' + (k === current ? ' is-on' : '') + '" type="button" data-k="' + k + '">' + EMAILS[k].tab + '</button>';
    }).join('') + '</div>' +
    '<div class="mail"><div class="mail__head"><div class="mail__from">Holisanna &lt;bonjour@holisanna.fr&gt; → ' + esc(em.to) + '</div><div class="mail__subject">' + esc(em.subject) + '</div></div>' +
    '<div class="mail__body"><img class="mail__logo" src="assets/logo-holisanna-mark.png" alt="Holisanna">' +
    '<div class="mail__eyebrow" style="color:' + em.accent + '">' + esc(em.eyebrow) + '</div><h2 class="mail__title">' + esc(em.title) + '</h2><p class="mail__lead">' + esc(em.lead) + '</p>' +
    '<div class="mail__rows">' + em.rows.map(function (r) { return '<div class="mail__row"><div class="mail__k">' + esc(r.k) + '</div><div class="mail__v">' + esc(r.v) + '</div></div>'; }).join('') + '</div>' +
    '<button class="mail__cta" type="button" data-cta>' + esc(em.cta) + '</button><div class="mail__note">' + esc(em.ctaNote) + '</div><p class="mail__ps">' + esc(em.ps) + '</p>' +
    '<div class="mail__legal">Holisanna · 2, Montée des Baux, 13800 Istres · <a href="mailto:contact@holisanna.fr">contact@holisanna.fr</a><br>Vous recevez cet e-mail parce que vous avez un compte Holisanna. Les rappels de séance et confirmations font partie du service.</div></div></div>';
  }
  document.addEventListener('DOMContentLoaded', function () {
    host.addEventListener('click', function (e) {
      var t = e.target.closest('[data-k]');
      if (t) { current = t.dataset.k; render(); return; }
      if (e.target.closest('[data-cta]')) HOL.toast('Lien de l’e-mail : ' + EMAILS[current].cta.toLowerCase() + '.');
    });
    render();
  });
})();
