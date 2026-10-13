/* Holisanna — données partagées (fictives, issues du prototype Claude Design).
   Source unique pour toutes les pages : praticiens, piliers, créneaux, formules. */
(function () {
  'use strict';

  /* Piliers — couleurs du design system (README du handoff, --pillar-ame / --pillar-esprit) :
     Corps = olive, Âme = or, Esprit = rose. Pour inverser Âme et Esprit, échanger ces deux lignes. */
  var PILLARS = {
    corps:  { label: 'Corps',  color: 'var(--olive)', bg: 'var(--olive-bg)' },
    ame:    { label: 'Âme',    color: 'var(--gold)',  bg: 'var(--gold-bg)' },
    esprit: { label: 'Esprit', color: 'var(--rose)',  bg: 'var(--rose-bg)' }
  };

  var DATES = ['Lun 31 août', 'Mar 1 sept', 'Mer 2 sept', 'Jeu 3 sept', 'Ven 4 sept'];
  var POOL = ['09:00', '10:30', '12:00', '14:00', '15:30', '17:00', '18:30'];

  var PRATS = [
    {
      "id": 1,
      "name": "Camille Ferrand",
      "discipline": "Massage bien-être",
      "pillar": "corps",
      "place": "Lyon 3e",
      "price": 70,
      "rating": "4.9",
      "reviews": "128 avis",
      "founder": false,
      "format": "cabinet",
      "experience": "9 ans de pratique",
      "duration": "60 min · au cabinet",
      "teaser": "Massage tissulaire lent, à l’écoute du souffle. Idéal en sortie de période tendue."
    },
    {
      "id": 2,
      "name": "Naïma Belkacem",
      "discipline": "Naturopathie",
      "pillar": "corps",
      "price": 85,
      "place": "Paris 11e",
      "rating": "4.8",
      "reviews": "94 avis",
      "founder": true,
      "format": "cabinet",
      "experience": "12 ans de pratique",
      "duration": "75 min · bilan complet",
      "teaser": "Bilan de vitalité, alimentation et rythmes. Un plan simple, tenable sur trois mois."
    },
    {
      "id": 3,
      "name": "Éloi Marchand",
      "discipline": "Réflexologie",
      "pillar": "corps",
      "price": 60,
      "place": "Bordeaux Chartrons",
      "rating": "4.7",
      "reviews": "61 avis",
      "founder": false,
      "format": "cabinet",
      "experience": "6 ans de pratique",
      "duration": "50 min · plantaire",
      "teaser": "Réflexologie plantaire précise, pour le sommeil et la digestion."
    },
    {
      "id": 4,
      "name": "Léa Vidal",
      "discipline": "Janzu / Watsu",
      "pillar": "corps",
      "price": 95,
      "place": "Annecy",
      "rating": "5.0",
      "reviews": "37 avis",
      "founder": false,
      "format": "cabinet",
      "experience": "7 ans de pratique",
      "duration": "55 min · en bassin chaud",
      "teaser": "Portée dans l’eau à 34°, entre relâchement profond et lâcher-prise."
    },
    {
      "id": 5,
      "name": "Hugo Prieur",
      "discipline": "Breathwork",
      "pillar": "corps",
      "price": 45,
      "place": "Lille · visio",
      "rating": "4.6",
      "reviews": "52 avis",
      "founder": false,
      "format": "visio",
      "experience": "4 ans de pratique",
      "duration": "45 min · en visio",
      "teaser": "Respiration consciente guidée, en petit groupe ou en individuel."
    },
    {
      "id": 6,
      "name": "Sofia Nardi",
      "discipline": "Sophrologie",
      "pillar": "esprit",
      "price": 65,
      "place": "Paris 9e",
      "rating": "4.9",
      "reviews": "146 avis",
      "founder": false,
      "format": "cabinet",
      "experience": "11 ans de pratique",
      "duration": "60 min · cabinet ou visio",
      "teaser": "Préparation mentale et gestion du stress, protocole en huit séances."
    },
    {
      "id": 7,
      "name": "Thomas Ruiz",
      "discipline": "Hypnothérapie",
      "pillar": "esprit",
      "price": 90,
      "place": "Marseille 6e",
      "rating": "4.8",
      "reviews": "88 avis",
      "founder": false,
      "format": "cabinet",
      "experience": "8 ans de pratique",
      "duration": "75 min · première séance",
      "teaser": "Hypnose ericksonienne, orientée arrêt du tabac et anxiété."
    },
    {
      "id": 8,
      "name": "Anaïs Coudray",
      "discipline": "Kinésiologie",
      "pillar": "esprit",
      "price": 75,
      "place": "Nantes",
      "rating": "4.7",
      "reviews": "43 avis",
      "founder": false,
      "format": "cabinet",
      "experience": "5 ans de pratique",
      "duration": "60 min · au cabinet",
      "teaser": "Tests musculaires et libération émotionnelle, en douceur."
    },
    {
      "id": 9,
      "name": "Yann Le Guen",
      "discipline": "Reiki / Soins énergétiques",
      "pillar": "ame",
      "price": 70,
      "place": "Rennes",
      "rating": "4.9",
      "reviews": "112 avis",
      "founder": true,
      "format": "cabinet",
      "experience": "14 ans de pratique",
      "duration": "60 min · au cabinet",
      "teaser": "Soin énergétique silencieux, pour les périodes de bascule."
    },
    {
      "id": 10,
      "name": "Maya Dorval",
      "discipline": "Chamanisme",
      "pillar": "ame",
      "price": 110,
      "place": "Toulouse",
      "rating": "4.8",
      "reviews": "29 avis",
      "founder": false,
      "format": "cabinet",
      "experience": "10 ans de pratique",
      "duration": "90 min · tambour",
      "teaser": "Voyage au tambour, travail sur les cycles et les transitions."
    },
    {
      "id": 11,
      "name": "Inès Fabre",
      "discipline": "Astrologie",
      "pillar": "ame",
      "price": 55,
      "place": "Visio uniquement",
      "rating": "4.6",
      "reviews": "76 avis",
      "founder": false,
      "format": "visio",
      "experience": "9 ans de pratique",
      "duration": "60 min · en visio",
      "teaser": "Lecture de thème natal, sans prédiction : un miroir, pas une carte."
    },
    {
      "id": 12,
      "name": "Clara Wenger",
      "discipline": "Séance photo révélatrice",
      "pillar": "ame",
      "price": 180,
      "place": "Paris 18e",
      "rating": "5.0",
      "reviews": "18 avis",
      "founder": false,
      "format": "cabinet",
      "experience": "6 ans de pratique",
      "duration": "2 h · studio",
      "teaser": "Deux heures pour se regarder autrement. Tirages inclus."
    }
  ];

  /* Créneaux de démonstration (même formule que le prototype). À remplacer par l'agenda réel. */
  function makeSlots() {
    var o = {};
    PRATS.forEach(function (p) {
      var d = {};
      DATES.forEach(function (dt, i) {
        d[dt] = POOL.filter(function (t, j) { return (p.id + i * 2 + j * 3) % 4 !== 0; });
      });
      o[p.id] = d;
    });
    return o;
  }

  var PLANS = [
    {
      name: 'Fil Continu',
      desc: 'Fiche, agenda, 20 réservations / mois',
      hook: 'Pour celles et ceux qui s’installent dans la durée.',
      price: '9,99 €', period: '/ mois, facturé à l’année',
      note: 'Engagement 12 mois · 119,88 € par an',
      perks: [
        'Fiche praticien complète et agenda en ligne',
        'Réservations illimitées, sans commission',
        'Badge Membre fondateur sur votre profil',
        'Accompagnement à la mise en ligne de votre fiche'
      ]
    },
    {
      name: 'Fil Libre',
      desc: 'Réservations illimitées, sans commission',
      hook: 'Pour avancer à votre rythme, mois par mois.',
      price: '11,99 €', period: '/ mois, sans engagement',
      note: 'Résiliable en un clic, à tout moment',
      perks: [
        'Les mêmes outils, la même visibilité',
        'Réservations illimitées, sans commission',
        'Mise en pause de votre agenda quand vous le souhaitez',
        'Passage au Fil Continu possible à tout moment'
      ]
    }
  ];

  /* Utilitaires */
  function initials(name) { return name.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2); }
  function findPrat(id) { return PRATS.filter(function (p) { return p.id === Number(id); })[0] || null; }

  /* Informations dérivées d'un praticien pour la recherche */
  function meta(p, slots) {
    var dayIdx = -1, i;
    for (i = 0; i < DATES.length; i++) { if ((slots[p.id][DATES[i]] || []).length) { dayIdx = i; break; } }
    var day = dayIdx >= 0 ? DATES[dayIdx] : null;
    var first = day ? slots[p.id][day][0] : null;
    var modes = p.format === 'visio' ? ['Visio'] : (p.id % 3 === 0 ? ['Cabinet', 'Visio', 'Domicile'] : ['Cabinet', 'Visio']);
    var langs = ['Français'].concat(p.id % 2 === 0 ? ['Anglais'] : []).concat(p.id % 5 === 0 ? ['Espagnol'] : []);
    return { dayIdx: dayIdx, day: day, first: first, modes: modes, langs: langs };
  }



  /* Données de démonstration de départ (séances passées de l'explorateur, réservations du praticien) */
  var DEMO_SESSIONS = [
    {
      "discipline": "Massage bien-être",
      "pillar": "corps",
      "prat": "Camille Ferrand",
      "date": "4 mars",
      "price": "70 €"
    },
    {
      "discipline": "Sophrologie",
      "pillar": "esprit",
      "prat": "Sofia Nardi",
      "date": "27 mars",
      "price": "65 €"
    },
    {
      "discipline": "Reiki / Soins énergétiques",
      "pillar": "ame",
      "prat": "Yann Le Guen",
      "date": "18 avril",
      "price": "70 €"
    },
    {
      "discipline": "Naturopathie",
      "pillar": "corps",
      "prat": "Naïma Belkacem",
      "date": "12 mai",
      "price": "85 €"
    },
    {
      "discipline": "Breathwork",
      "pillar": "corps",
      "prat": "Hugo Prieur",
      "date": "3 juin",
      "price": "45 €"
    }
  ];
  var DEMO_BOOKINGS = [
    {
      "client": "Léna Ferreira",
      "initials": "LF",
      "date": "Lun 31 août",
      "time": "10:30",
      "offer": "Massage 60 min",
      "payment": "Sur place",
      "status": "confirmed"
    },
    {
      "client": "Marc Ottavi",
      "initials": "MO",
      "date": "Mar 1 sept",
      "time": "14:00",
      "offer": "Massage 90 min",
      "payment": "Sur place",
      "status": "confirmed"
    },
    {
      "client": "Sonia Rahal",
      "initials": "SR",
      "date": "Mer 2 sept",
      "time": "09:00",
      "offer": "Massage 60 min",
      "payment": "Sur place",
      "status": "cancelled"
    },
    {
      "client": "Pierre Deniau",
      "initials": "PD",
      "date": "Jeu 3 sept",
      "time": "17:00",
      "offer": "Massage 60 min",
      "payment": "Sur place",
      "status": "confirmed"
    }
  ];

  /* Messagerie et notifications de l'explorateur (démonstration) */
  var EXPL_CONVOS = [
    { id: 1, name: 'Camille Ferrand', initials: 'CF', meta: 'Massage bien-être · Lyon 3e', unread: false, messages: [
      { from: 'me', text: 'Bonjour Camille, je confirme ma venue mercredi 9 à 14h.', time: 'Hier · 18:02' },
      { from: 'them', text: 'Bonjour Sarah, c’est noté. Prévoyez une tenue souple, on commencera assises.', time: 'Hier · 19:15' }
    ] },
    { id: 2, name: 'Naïma Belkacem', initials: 'NB', meta: 'Naturopathie · Paris 11e', unread: true, messages: [
      { from: 'them', text: 'Bonjour Sarah, je vous envoie un court questionnaire à remplir avant le bilan. Rien de long, dix minutes.', time: 'Il y a 4 h' }
    ] },
    { id: 3, name: 'Yann Le Guen', initials: 'YL', meta: 'Reiki · Rennes', unread: false, messages: [
      { from: 'me', text: 'Merci pour la séance de samedi, j’ai dormi douze heures d’affilée.', time: '27 août' },
      { from: 'them', text: 'Merci pour votre retour. Reposez-vous, le corps rattrape ce qu’il peut.', time: '28 août' }
    ] }
  ];
  var NOTIF_ACCENT = { rdv: 'var(--rose)', resa: 'var(--rose)', msg: 'var(--rose)', avis: 'var(--gold)', reco: 'var(--olive)', fiche: 'var(--olive)', compte: 'var(--slate-lt)', fact: 'var(--slate-lt)' };
  var EXPL_NOTIFS = [
    { id: 'e1', day: "Aujourd'hui", type: 'rdv', title: 'Rappel de séance', text: 'Mercredi 9 septembre à 14h avec Naïma Belkacem, 24 rue de la Roquette, Paris 11e.', time: 'Il y a 2 h', go: 'espace-rendez-vous.html' },
    { id: 'e2', day: "Aujourd'hui", type: 'reco', title: 'Un praticien pour votre cocktail', text: 'Sofia Nardi (Sophrologie, Paris 9e) complète le pilier Esprit.', time: 'Il y a 5 h', go: 'cocktail.html' },
    { id: 'e3', day: 'Hier', type: 'avis', title: 'Votre avis est en ligne', text: 'Yann Le Guen · Reiki. Merci d’avoir pris le temps de l’écrire.', time: 'Hier, 18:40', go: 'espace-avis.html' },
    { id: 'e4', day: 'Hier', type: 'rdv', title: 'Réservation confirmée', text: 'Camille Ferrand, mardi 15 septembre à 10h30, règlement sur place.', time: 'Hier, 09:12', go: 'espace-rendez-vous.html' },
    { id: 'e5', day: 'Cette semaine', type: 'compte', title: 'Séance ajoutée à votre historique', text: 'Massage bien-être du 24 août, 70 €. Une couche de plus à votre cocktail.', time: '28 août', go: 'cocktail.html' },
    { id: 'e6', day: 'Cette semaine', type: 'reco', title: 'Complétez votre cocktail', text: 'Le pilier Âme ne compte qu’une couche : trois praticiens vous sont proposés.', time: '27 août', go: 'cocktail.html' }
  ];

  /* Messagerie et notifications du praticien (Camille Ferrand, démonstration) */
  var PRO_CONVOS = [
    { id: 1, name: 'Sarah Nguyen', initials: 'SN', meta: 'Massage bien-être · mer. 9 sept', unread: false, messages: [
      { from: 'them', text: 'Bonjour Camille, je confirme ma venue mercredi 9 à 14h.', time: 'Hier · 18:02' },
      { from: 'me', text: 'Bonjour Sarah, c’est noté. Prévoyez une tenue souple, on commencera assises.', time: 'Hier · 19:15' },
      { from: 'them', text: 'Merci Camille, à mercredi !', time: '10:24' }
    ] },
    { id: 2, name: 'Marc Bellanger', initials: 'MB', meta: 'Massage dos & nuque · 19 août', unread: true, messages: [
      { from: 'them', text: 'Bonjour, le cabinet est-il accessible en fauteuil ? Ma mère aimerait venir.', time: 'Il y a 3 h' }
    ] },
    { id: 3, name: 'Sonia Rahal', initials: 'SR', meta: 'Créneau annulé · mer. 2 sept', unread: false, messages: [
      { from: 'them', text: 'Je dois annuler mercredi, un imprévu au travail. Désolée pour le délai.', time: 'Hier · 11:28' },
      { from: 'me', text: 'Pas de souci Sonia, le créneau est rouvert. Dites-moi quand vous voulez reprendre.', time: 'Hier · 11:46' }
    ] }
  ];
  function proNotifs(plan) {
    return [
      { id: 'p1', day: "Aujourd'hui", type: 'resa', title: 'Nouvelle réservation', text: 'Sarah Nguyen — mercredi 9 septembre à 14h, massage bien-être 60 min.', time: 'Il y a 1 h', go: 'pro-reservations.html' },
      { id: 'p2', day: "Aujourd'hui", type: 'msg', title: 'Question d’un explorateur', text: 'Marc Bellanger : « Le cabinet est-il accessible en fauteuil ? »', time: 'Il y a 3 h', go: 'pro-messages.html' },
      { id: 'p3', day: 'Hier', type: 'avis', title: 'Nouvel avis reçu', text: 'Marc B. vous a laissé 5 étoiles sur Massage dos & nuque.', time: 'Hier, 20:05', go: 'pro-avis.html' },
      { id: 'p4', day: 'Hier', type: 'resa', title: 'Annulation', text: 'Sonia Rahal a annulé le créneau du mercredi 2 septembre à 09h00.', time: 'Hier, 11:30', go: 'pro-agenda.html' },
      { id: 'p5', day: 'Cette semaine', type: 'fact', title: 'Prélèvement effectué', text: 'Formule ' + (plan || 'Fil Libre') + ' — 11,99 € le 1er septembre. Facture disponible.', time: '1 septembre', go: 'pro-abonnement.html' },
      { id: 'p6', day: 'Cette semaine', type: 'fiche', title: 'Votre fiche a été vue 412 fois', text: 'Les vues de votre profil ont augmenté de 18 % ce mois-ci.', time: '30 août', go: 'espace-praticien.html' }
    ];
  }

  function slug(n) { return n.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]+/g, ''); }

  /* Fiche praticien : informations dérivées (adresse, langues, offres…) comme dans le prototype */
  function profile(p) {
    var pl = PILLARS[p.pillar], visio = p.format === 'visio', s = slug(p.name);
    return {
      pillarLabel: pl.label, color: pl.color, bg: pl.bg, initials: initials(p.name), firstName: p.name.split(' ')[0],
      address1: (12 + p.id) + ' rue des Tilleuls',
      address2: p.place.replace(/ ?· ?visio/i, ''),
      access: visio ? 'Séances en visio uniquement · lien envoyé après réservation' : 'Rez-de-chaussée, accès PMR · interphone au nom du cabinet',
      langs: ['Français'].concat(p.id % 2 === 0 ? ['Anglais'] : []).concat(p.id % 5 === 0 ? ['Espagnol'] : []),
      socials: [
        { net: 'Instagram', handle: '@' + s, url: 'https://instagram.com/' + s },
        { net: 'Facebook', handle: p.name, url: 'https://facebook.com/' + s },
        { net: 'YouTube', handle: p.name, url: 'https://youtube.com/@' + s },
        { net: 'Site web', handle: s + '.fr', url: 'https://' + s + '.fr' }
      ],
      formatLabel: visio ? 'En visio' : 'Au cabinet',
      bio: p.teaser + ' Les séances se construisent en trois temps : un échange, le travail corporel ou verbal, puis quelques repères à emporter. Première séance un peu plus longue, le temps de se rencontrer.',
      tags: [p.discipline, pl.label, visio ? 'Visio' : 'Cabinet accessible', 'Français / Anglais'],
      offers: [
        { name: 'Première séance', detail: p.duration, price: p.price + ' €' },
        { name: 'Séance de suivi', detail: '50 min · sur rendez-vous', price: (p.price - 10) + ' €' },
        { name: 'Forfait 5 séances', detail: 'valable 6 mois', price: (p.price * 5 - 40) + ' €' }
      ],
      reviews: [
        { stars: '★★★★★', text: 'Je suis repartie plus légère qu’en arrivant, sans savoir exactement pourquoi.', author: 'Hélène G. · séance de mars' },
        { stars: '★★★★★', text: 'Cadre calme, écoute juste, aucune promesse en trop.', author: 'Julien M. · séance de mai' }
      ]
    };
  }

  window.HOL_DATA = {
    PILLARS: PILLARS, DATES: DATES, POOL: POOL, PRATS: PRATS, PLANS: PLANS, PRO_CONVOS: PRO_CONVOS, proNotifs: proNotifs, EXPL_CONVOS: EXPL_CONVOS, EXPL_NOTIFS: EXPL_NOTIFS, NOTIF_ACCENT: NOTIF_ACCENT, DEMO_SESSIONS: DEMO_SESSIONS, DEMO_BOOKINGS: DEMO_BOOKINGS,
    SLOTS: makeSlots(), makeSlots: makeSlots,
    initials: initials, findPrat: findPrat, meta: meta, slug: slug, profile: profile
  };
})();
