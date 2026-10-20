# Holisanna — site HTML/CSS/JS (version bureau)

41 pages statiques issues du prototype Claude Design (`Holisanna.dc.html`), sans React ni `support.js`.
La version mobile reste à faire (même socle).

## Aperçu local
    npx serve .        # puis ouvrir http://localhost:3000
Le double-clic sur un fichier ne suffit pas : préférez un petit serveur.

## Déploiement (Vercel)
Site 100 % statique : la racine du dépôt est ce dossier, aucune étape de build.
Poussez d'abord sur une branche (ex. `design-handoff`) : Vercel crée une URL de prévisualisation sans toucher au site en ligne.
`404.html` est servie automatiquement par Vercel pour toute adresse inconnue.

## Pages
- **Public** : `index`, `recherche`, `praticien?id=…`, `reservation?id=…&date=…&heure=…`, `faq`, `contact`, `devenir`,
  `histoire`, `philosophie`, `charte`, `mentions`, `confidentialite`, `cgu`, `cgv`
- **Accès** : `inscription` (choix du profil), `connexion`, `inscription-explorateur`, `inscription-praticien`, `onboarding`,
  `mot-de-passe-oublie`, `nouveau-mot-de-passe`
- **Espace explorateur** : `espace` (tableau de bord), `espace-rendez-vous`, `espace-avis`, `espace-favoris`, `cocktail`,
  `espace-messages`, `espace-notifications`, `espace-profil`
- **Espace praticien** : `espace-praticien` (tableau de bord), `pro-agenda`, `pro-reservations`, `pro-avis`, `pro-prestations`,
  `pro-abonnement`, `pro-fiche`, `pro-messages`, `pro-notifications`
- **Erreurs et e-mails** : `404`, `erreur?type=500|paiement|session`, `emails` (gabarits d'e-mails de référence)

## Structure
- `css/` — jetons du design system (`colors`, `fonts`, `typography`, `spacing`) + `holisanna.css` (composants et pages)
- `js/data.js` — praticiens, piliers, créneaux, formules, conversations (données fictives du prototype)
- `js/layout.js` — en-tête, pied de page, **`HOL.Session`** (qui est connecté) et **`HOL.Store`** (données de démonstration), messages
- `js/recherche.js`, `praticien.js`, `reservation.js`, `auth.js`, `espace.js`, `pro.js`, `faq.js`, `emails.js`, `erreur.js` — un script par famille de pages
- `assets/` — logos et illustrations de marque

## Brancher la base (Supabase)
Aujourd'hui, les connexions, réservations, créneaux, messages, notifications, fiche et formule sont **simulés dans le navigateur**
(`localStorage`) : rien n'est envoyé nulle part. Tout passe par `HOL.Session` et `HOL.Store` de `js/layout.js` : c'est là qu'il faut
remplacer le stockage du navigateur par des appels à la base (règle métier du handoff : un e-mail = un rôle ; un avis = une réservation).
Les espaces connectés redirigent vers la connexion quand on n'est pas connecté avec le bon rôle.

## Couleurs des piliers
Choix retenu (design system) : **Corps = olive, Âme = or, Esprit = rose**. Pour inverser Âme et Esprit : deux lignes dans
`js/data.js` (`PILLARS`), les puces de `index.html` et les règles `.pillar-card[data-pillar]` de `css/holisanna.css`.

## À compléter avant la mise en ligne
- **Mentions légales, CGU, CGV, confidentialité** : textes du prototype. Les données d'entreprise y sont des exemples
  (siège, SIREN/SIRET, RCS, TVA, hébergeur Vercel Inc., domaines chez OVH) : renseignées. À mettre à jour au passage en SASU (forme juridique, capital, RCS, dirigeant).
  À rapprocher des documents Word du projet (CGU, CGV, charte).
- **Adresse e-mail** `contact@holisanna.fr` et expéditeur `bonjour@holisanna.fr` : à vérifier.
- Photos des praticiens : l'envoi n'est pas encore branché (« Photo à venir »).
- Les chiffres affichés (1 400+ praticiens, 4,9, 412 vues…) sont ceux du prototype.

## Avant le lancement public : retirer le « ne pas référencer »
Pendant les tests, le site demande aux moteurs de recherche de ne pas l'indexer. Au lancement, retirer :
1. `<meta name="robots" content="noindex, nofollow">` dans chaque page HTML (rechercher « TESTS : à retirer »),
2. `robots.txt` (ou le remplacer par une version qui autorise l'indexation),
3. l'en-tête `X-Robots-Tag` dans `vercel.json`.
