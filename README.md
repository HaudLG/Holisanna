# Handoff — Holisanna

Plateforme bien-être à deux faces : les **explorateurs** cherchent, réservent et notent des séances ; les **praticiens** publient une fiche, ouvrent leurs créneaux et gèrent leurs réservations via un abonnement mensuel. Aucun paiement de séance ne transite par la plateforme, aucune commission n'est prélevée : Holisanna encaisse uniquement l'abonnement praticien.

Ce dossier contient tout ce qu'il faut pour construire l'application réelle : les prototypes de référence, le modèle de données, les jetons de design et les règles métier.

---

## À propos des fichiers de design

Les fichiers de `prototypes/` sont des **références de design réalisées en HTML** : ils montrent l'apparence et le comportement attendus, ce ne sont **pas** du code de production à copier tel quel.

Le travail consiste à **recréer ces écrans dans l'environnement cible** (React, Vue, Next.js, SwiftUI, natif…) en suivant les conventions et bibliothèques déjà en place dans le dépôt. Si aucun environnement n'existe encore, choisir la pile la plus adaptée et y implémenter les designs.

Pile suggérée si le projet part de zéro : **Next.js + Supabase** (auth, Postgres, storage, row-level security, temps réel pour la messagerie) — le modèle de données est écrit en tables relationnelles et s'y transpose directement.

### Ouvrir les prototypes

Servir le dossier `prototypes/` par HTTP (`npx serve prototypes`) puis ouvrir `Holisanna.dc.html` (bureau) ou `Holisanna Mobile.dc.html` (mobile). Le double-clic depuis le système de fichiers ne suffit pas : les fichiers chargent des ressources relatives.

`Modèle de données (autonome).html` s'ouvre directement, sans serveur.

---

## Fidélité

**Haute fidélité (hifi).** Couleurs, typographie, espacements, états et copie sont définitifs. Les écrans doivent être reproduits fidèlement au pixel près, en utilisant les jetons listés plus bas. Toute la copie française présente dans les prototypes est validée — la reprendre verbatim.

Deux réserves :
- Les données affichées (praticiens, avis, créneaux, messages) sont fictives ; seules les structures comptent.
- Les illustrations et logos dans `prototypes/assets/` sont les vrais assets de marque, à réutiliser tels quels.

---

## Jetons de design

Définis dans `prototypes/_ds/holisanna-design-system-.../tokens/`. À porter dans le système de thème de la cible.

### Couleurs

| Jeton | Valeur | Usage |
|---|---|---|
| `--olive` | `#6B7A5C` | Accent principal, liens, pilier Corps, succès |
| `--olive-lt` | `#8F9E7E` | Olive atténué |
| `--olive-bg` | `#EEF1EA` | Fond d'état actif côté explorateur |
| `--rose` | `#D4907A` | CTA (boutons d'action), pilier Esprit |
| `--rose-lt` | `#E8B4A0` | Rose atténué |
| `--rose-bg` | `#FAF0EB` | Fond de zone rose |
| `--gold` | `#C4A882` | Premium, notes/étoiles, pilier Âme, accent espace praticien |
| `--gold-bg` | `#F5EFE6` | Fond d'état actif côté praticien |
| `--ivory` | `#FAF6EE` | Fond de page, texte sur fond sombre |
| `--ivory-2` | `#F2EBE0` | Fond de section alternée |
| `--ivory-3` | `#E8DFD0` | Ivoire soutenu |
| `--slate` | `#3A3830` | Titres, fond sombre |
| `--slate-md` | `#7A766E` | Texte courant |
| `--slate-lt` | `#B5B0A8` | Texte secondaire, libellés |
| `--border` | `#DDD8CE` | Toutes les bordures |
| `--white` | `#FFFFFF` | Cartes |
| `--error` | `#C0392B` | Erreurs |

Alias sémantiques disponibles : `--text-heading`, `--text-body`, `--text-muted`, `--text-on-dark`, `--surface-page`, `--surface-card`, `--surface-dark`, `--surface-subtle`, `--accent-primary`, `--accent-cta`, `--accent-premium`, `--pillar-corps` (olive), `--pillar-ame` (or), `--pillar-esprit` (rose).

### Typographie

Deux familles, chargées depuis Google Fonts :

```
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Inter:wght@300;400;500&display=swap');
```

- `--font-serif: 'Cormorant Garamond', serif` — titres, prix, noms de praticiens, chiffres-clés. Souvent en `font-weight:300`, parfois en italique pour les accroches.
- `--font-sans: 'Inter', sans-serif` — texte courant, interface, boutons, libellés.

Échelle : `--fs-hero:44px`, `--fs-h1:42px`, `--fs-h2:34px`, `--fs-h3:22px`, `--fs-card-title:18px`, `--fs-body:13px`, `--fs-label:10px`, `--fs-button:12px`.
Graisses : `300` / `400` / `500` uniquement (jamais de gras 600+).
Interlettrage : `--ls-label:0.14em` (libellés en capitales), `--ls-button:0.07em`, `--ls-tight:0.06em`. Interligne courant `1.6` à `1.75`.

Les libellés de section sont en capitales, 9–10 px, interlettrés, en `--gold`, `--olive` ou `--slate-lt`.

### Espacement, bordures, ombres

`--space-xs:8px` · `sm:12px` · `md:16px` · `lg:22px` · `xl:28px` · `2xl:44px` · `3xl:64px`
`--border-width: 0.5px` (bordures fines, signature visuelle du design — ne pas passer à 1px)
`--radius-sm:1px`, `--radius-md:2px` — angles quasi droits partout
`--card-padding: 20px 22px` · `--grid-gap: 16px` · `--input-height: 44px`
`--shadow-none: none` — **aucune ombre portée dans tout le produit.** La hiérarchie passe par la bordure et le fond.

### Largeurs

- Conteneur bureau : `max-width: 1240px`, padding horizontal `28px`.
- Colonne de lecture (pages éditoriales, FAQ) : `max-width: 820px`.
- Barre latérale de filtres recherche : `280px` fixe.
- Barre latérale des espaces connectés : passe en pile sous `1100px` (voir Responsive).
- Mobile : maquetté sur iPhone 402 × 874 px, padding horizontal `18px`.

---

## Navigation

Règle structurante, à ne pas confondre :

- **Partie publique** (accueil, recherche, fiche, réservation, pages éditoriales) : en-tête classique sur bureau, **menu hamburger + panneau latéral** sur mobile.
- **Espaces connectés** (explorateur, praticien) : **barre latérale** sur bureau, **barre d'onglets basse** sur mobile (5 entrées dont « Plus »).

L'onglet actif est en `--rose` côté explorateur, en `--gold` côté praticien.

---

## Écrans

### Partie publique

**Accueil** — Héros en deux colonnes (`repeat(auto-fit, minmax(320px,1fr))`, gap 56px) : à gauche accroche « Composer votre Cocktail bien-être » (serif 52px, weight 300, line-height 1.12) surmontée du libellé « 21 disciplines · 3 piliers », plus un bloc de recherche (ville + discipline + bouton rose) ; à droite l'illustration du cocktail. Puis : bande des trois piliers sur fond `--ivory-2` (cartes blanches, bordure haute 2px de la couleur du pilier), bande de statistiques (chiffres serif 34px en olive), section « Comment ça se passe » en 4 étapes numérotées, et bloc praticien sur fond `--slate` présentant les deux abonnements en or.

**Recherche** — Grille `280px minmax(0,1fr)`. Barre latérale : filtres piliers, disponibilité, mode, langues, note, budget (curseur), plus un bouton « réinitialiser ». Contenu : barre de recherche 44px (icône loupe, champ discipline, champ ville séparé par une bordure, bouton rose), compteur de résultats en serif 28px, tri par liste déroulante, puis cartes praticien en grille `100px minmax(0,1fr) 168px` — colonne d'avatar (rond 56px, initiales serif sur fond de pilier, mention de disponibilité), colonne d'identité (nom serif 22px, badge « membre fondateur » le cas échéant, discipline, note, ville), colonne d'action (prix serif 24px aligné à droite, prochain créneau en olive, bouton « Réserver » rose + bouton « Voir la fiche » en contour). Pagination en bas, boutons 36px. État vide : « Aucun praticien sur ces critères ».
Sur mobile : bouton flottant « Filtres » centré en bas, filtres en panneau modal.

**Fiche praticien** — Identité, disciplines, présentation, prestations avec durée et prix, avis, et barre de réservation. Sur mobile la barre de réservation est collée en bas.

**Réservation** — Parcours en étapes : choix de la prestation, du créneau, récapitulatif, confirmation. Le règlement se fait au praticien le jour du rendez-vous ; la plateforme ne prend pas de paiement de séance.

**Connexion / inscription** — Choix du rôle en premier écran (explorateur ou praticien), puis formulaire. **Un e-mail = un rôle** : pas de double compte, séparation stricte des deux espaces.

**Onboarding** — Trois étapes après inscription (piliers d'intérêt, modes de séance, disciplines), puis atterrissage sur le cocktail.

**Pages éditoriales** — Histoire, Philosophie, Charte éthique, Contact, Devenir praticien. Colonne de 820px, navigation entre pages sœurs en bas.

**FAQ** — Trois groupes (Explorateurs, Praticiens, Compte & données), accordéon, une seule question ouverte à la fois.

**Erreurs** — 404 et échec de prélèvement d'abonnement, avec actions de rattrapage et raccourcis.

**E-mails transactionnels** — Écran de référence présentant les gabarits d'e-mails par onglets (confirmation, rappel, annulation, avis…), à reproduire côté service d'envoi.

### Espace explorateur

Sections : **Tableau de bord** (accueil personnalisé, prochains rendez-vous, favoris), **Cocktail bien-être** (visualisation en couches par pilier, une couche ajoutée par séance réalisée), **Mes rendez-vous** (déplacer / annuler, gratuit jusqu'à 24 h avant), **Mes avis** (un avis par réservation passée), **Favoris**, **Messages**, **Notifications**, **Mon profil**.

### Espace praticien

Sections : **Tableau de bord**, **Agenda** (ouverture de créneaux par jour), **Réservations**, **Ma fiche** + édition de fiche (photos, disciplines principale et complémentaires, présentation), **Mes prestations** (masquables sans suppression), **Avis reçus** (avec réponse publique), **Messages**, **Notifications**, **Abonnement** (Fil Continu 9,99 €/mois avec engagement annuel, Fil Libre 11,99 €/mois sans engagement, factures, moyen de paiement carte ou SEPA).

---

## Modèle de données

Le document complet est dans `Modèle de données (autonome).html` : tables, types de champs, relations et correspondance écran par écran. Ouvrir ce fichier avant d'écrire le schéma.

Entités : **Explorateur**, **Praticien**, **Discipline**, **Prestation**, **Disponibilité**, **Réservation**, **Avis**, **Conversation / Message**, **Notification**, **Abonnement / Facture**.

Deux décisions validées, structurantes :

1. **Un e-mail = un rôle.** Un compte est soit explorateur, soit praticien. Pas de compte double, pas de bascule de rôle. Contrainte d'unicité sur l'e-mail, table de rôle unique.
2. **Un avis = une réservation, en 1:1.** Un avis ne peut exister que rattaché à une réservation passée et honorée, et une réservation ne porte qu'un seul avis. Contrainte d'unicité sur `reservation_id` dans la table des avis.

Règles métier à faire respecter côté serveur :

- Annulation libre et gratuite jusqu'à 24 h avant le créneau ; en deçà, conditions du praticien.
- Aucun paiement de séance dans la plateforme ; aucune commission. Seul l'abonnement praticien est prélevé.
- Aucune donnée de santé collectée.
- Suppression de compte à tout moment ; données de compte conservées 3 mois puis effacées, pièces comptables 10 ans.
- Une fiche praticien reste en ligne 7 jours après un échec de prélèvement.

---

## Interactions et comportement

- **Transitions** : discrètes. Animations utilisées dans les prototypes — `layerIn` (apparition d'une couche du cocktail, `scaleY` de 0 à 1), `toastIn` (translation verticale de 12px + fondu), `shimmer` (état de chargement), `floatY`, `progressX`. Durées courtes, easing par défaut.
- **Toasts** : confirmation d'action en bas d'écran, texte court en français, disparition automatique.
- **Survol** : les cartes cliquables passent leur bordure de `--border` à `--olive` (ou à la couleur du pilier). Pas d'élévation, pas d'ombre.
- **Navigation interne** : chaque changement de section remet le défilement en haut (`window.scrollTo(0,0)`).
- **États à prévoir** : chargement, vide (« Aucun praticien sur ces critères », etc.), erreur, non connecté. Chacun a une formulation en français à reprendre depuis les prototypes.
- **Validation de formulaire** : messages en `--error`, sous le champ.

## Responsive

- Point de rupture principal : **1100px** — sous ce seuil, les barres latérales des espaces connectés passent en flux normal (`position:static`, hauteur libre). Le prototype le fait via `[data-stack-aside]`.
- Les grilles utilisent `repeat(auto-fit, minmax(Xpx, 1fr))` et se réagencent seules.
- Mobile : maquettes dédiées dans `Holisanna Mobile.dc.html`. Cibles tactiles à 44px minimum (boutons à 46–50px dans les maquettes).

## État applicatif

Côté client, prévoir au minimum : rôle et session, filtres de recherche (requête, ville, piliers, format, budget, note, langues, tri, page), sélection de réservation en cours (praticien, prestation, date, créneau), section active de chaque espace, conversation active et brouillon de message, notifications lues, accordéon FAQ ouvert, file de toasts.

Récupération de données : recherche paginée avec filtres côté serveur, agenda par praticien et par semaine, messagerie en temps réel (abonnement Supabase Realtime ou équivalent), notifications en temps réel.

## Assets

Dans `prototypes/assets/` — logos et illustrations de marque, à réutiliser tels quels :

- `logo-holisanna-mark.png` / `-ivory.png` — marque seule (44px dans l'en-tête bureau)
- `logo-holisanna-lockup.png` / `-ivory.png` — logo complet
- `logo-dreamcatcher.png` / `-ivory.png` — attrape-rêves, utilisé dans les blocs praticien
- `illustration-cocktail-bien-etre.png` / `-ivory.png` — illustration du cocktail (accueil, 320px de large)

Les versions `-ivory` sont destinées aux fonds sombres (`--slate`).

## Fichiers

```
design_handoff_holisanna/
├── README.md                              ce document
├── Modèle de données (autonome).html      schéma complet, s'ouvre sans serveur
└── prototypes/
    ├── Holisanna.dc.html                  tous les écrans bureau
    ├── Holisanna Mobile.dc.html           les écrans mobiles, dans un cadre iPhone
    ├── Modèle de données.dc.html          source du schéma
    ├── assets/                            logos et illustrations
    ├── _ds/                               jetons de design et composants (CSS + JS)
    ├── support.js                         runtime des prototypes (non destiné à la production)
    └── ios-frame.jsx                      cadre d'appareil pour les maquettes mobiles
```

`support.js` et `ios-frame.jsx` servent uniquement à faire tourner les prototypes. Ne rien en reprendre en production. En revanche, les fichiers de `_ds/*/tokens/` sont du CSS propre, directement réutilisable.
