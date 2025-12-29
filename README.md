<p align="center">
  <img src="logo.png" alt="AFERTES" width="300">
</p>

# Budget Association - Gestion Budgétaire

Application web de gestion de budget prévisionnel pour les associations du secteur social et médico-social.

## Fonctionnalités

### Sécurité
- **Protection par mot de passe** à l'ouverture
- Session persistante (localStorage)
- Déconnexion sécurisée

### Gestion budgétaire
- **Budget Direction & Siège** : Personnel administratif, loyer, charges
- **Budget par Service** : Personnel, charges d'exploitation, investissements
- **Projection sur 3 ans** avec augmentation annuelle paramétrable
- **Graphique annuel** : Répartition mensuelle du budget

### Calculs automatiques
- **Salaires** : Brut + charges patronales (42%) + prime Ségur
- **Amortissements** : Calcul linéaire sur la durée
- **Mensualités de prêt** : Formule d'amortissement standard avec tableau détaillé
- **Coût par unité** : Budget total / unités d'activité annuelles
- **Répartition du siège** : Proportionnelle aux unités par service
- **Total ETP** : Affichage par section

### Indicateurs financiers
- **Provisions pour charges** :
  - Congés payés (% masse salariale)
  - Grosses réparations (% immobilisations)
  - Créances douteuses (% chiffre d'affaires)
- **BFR (Besoin en Fonds de Roulement)** : Créances - Dettes fournisseurs

### Interface
- **Mode sombre** persistant
- **Sauvegarde automatique** dans le navigateur (localStorage)
- **Validation des champs** numériques

### Export
- Sauvegarde/chargement au format JSON
- Export CSV détaillé
- Export Excel avec onglets multiples
- Impression optimisée

## Installation

```bash
# Cloner le dépôt
git clone <url-du-repo>
cd budget-association

# Installer les dépendances
npm install

# Lancer en développement
npm run dev

# Lancer les tests
npm run test:run

# Build de production
npm run build
```

## Technologies

- React 18
- Vite
- Tailwind CSS
- Lucide React (icônes)
- SheetJS (export Excel)
- Vitest (tests)

## Structure du projet

```
src/
├── App.jsx                    # Composant principal (login + dashboard)
├── main.jsx                   # Point d'entrée React
├── index.css                  # Styles Tailwind
└── utils/
    ├── constants.js           # Constantes et valeurs par défaut
    └── calculations.js        # Fonctions de calcul
```

## Structure des données

### Paramètres globaux
| Paramètre | Description | Valeur par défaut |
|-----------|-------------|-------------------|
| Augmentation annuelle | Inflation appliquée aux salaires et charges | 2.5% |
| Taux provision congés payés | Sur la masse salariale | 10% |
| Taux provision grosses réparations | Sur les immobilisations | 2% |
| Taux provision créances douteuses | Sur le chiffre d'affaires | 1% |
| Délai paiement clients | Pour calcul BFR | 30 jours |
| Délai paiement fournisseurs | Pour calcul BFR | 30 jours |

### Constantes
| Constante | Valeur |
|-----------|--------|
| Charges patronales | 42% |
| Prime Ségur | 238 €/mois |
| Jours par an | 365 |

### Services
Chaque service contient :
- **Unités** : Nombre de places/bénéficiaires
- **Taux d'activité** : Pourcentage d'occupation
- **Personnel** : Liste des postes avec ETP, salaire, prime Ségur
- **Exploitation** : Charges mensuelles par catégorie
- **Investissements** : Biens, travaux, véhicules, etc.

## Authentification

Mot de passe par défaut : `afertes2024`

Pour changer le mot de passe, modifier la constante `DEFAULT_PASSWORD` dans `src/utils/constants.js`.

## Licence

Ce projet est sous licence MIT.

## Auteur

AFERTES - Formation et accompagnement dans le secteur social et médico-social
