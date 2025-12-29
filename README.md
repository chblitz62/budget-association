<p align="center">
  <img src="public/logo.png" alt="AFERTES" width="300">
</p>

# Budget Association AFERTES

Application web de gestion budgétaire pour associations du secteur social et médico-social, avec projection sur 3 ans et export Excel professionnel conforme au Plan Comptable Général (PCG).

## Fonctionnalités

### Gestion budgétaire
- **Direction & Siège** : Personnel administratif, loyer, charges
- **Services** : Formation Initiale, Formation Continue, ou services personnalisés
- **Investissements** : Immobilisations avec calcul d'amortissement et intérêts
- **Exploitation** : Charges courantes par service
- **Recettes** : Produits par service avec vérification du solde (excédent/déficit)

### Suivi des effectifs (formations)
- Étudiants par site : **Avion** et **Saint-Laurent-Blangy**
- **Formation Initiale** : AES, ES1, ES2, ES3, ME1, ME2
- **Formation Continue** : CAFDES, CAFERUIS, VAE, Prestation Formation, GAP, Supervision
- Suivi des abandons par mois
- Calcul automatique du taux de rétention

### Calculs automatiques
- **Masse salariale** : Brut + charges patronales (42%) + prime Ségur (238€)
- **Amortissements** : Calcul linéaire sur la durée
- **Mensualités de prêt** : Formule d'amortissement avec tableau détaillé
- **Coût par unité** : Budget total / unités d'activité annuelles
- **Répartition du siège** : Proportionnelle aux unités par service

### Indicateurs financiers
- **Provisions** : Congés payés, grosses réparations, créances douteuses
- **BFR** : Besoin en Fonds de Roulement (créances - dettes fournisseurs)
- **Projection 3 ans** : Avec taux d'augmentation paramétrable

### Export Excel professionnel (8 onglets)
| Onglet | Contenu |
|--------|---------|
| Compte de Résultat | Format PCG (classes 6 et 7) |
| Balance Générale | Comptes équilibrés débit/crédit |
| Détail Charges | Par service avec numéros de compte |
| Détail Produits | Recettes par service |
| Effectifs | Étudiants par site/promo avec abandons |
| Budget 3 Ans | Projection pluriannuelle |
| Amortissements | Tableau des immobilisations |
| Synthèse | Récapitulatif avec provisions et BFR |

### Interface
- Mode sombre persistant
- Sauvegarde automatique (localStorage)
- Sauvegarde/chargement JSON
- Impression optimisée

## Installation

```bash
# Cloner le dépôt
git clone https://github.com/chblitz62/budget-association.git
cd budget-association

# Installer les dépendances
npm install

# Lancer en développement
npm run dev

# Build de production
npm run build
```

## Technologies

- **React 18** - Interface utilisateur
- **Vite** - Build tool
- **Tailwind CSS** - Styles
- **Lucide React** - Icônes
- **SheetJS (xlsx)** - Export Excel

## Démo

Application déployée sur Vercel : https://budget-association.vercel.app

**Mot de passe** : `afertes2024`

## Structure du projet

```
src/
├── App.jsx                    # Composant principal (login + dashboard)
├── main.jsx                   # Point d'entrée React
├── index.css                  # Styles Tailwind
└── utils/
    ├── constants.js           # Constantes et valeurs par défaut
    ├── calculations.js        # Fonctions de calcul
    └── excelExport.js         # Export Excel multi-onglets
```

## Paramètres

| Paramètre | Description | Défaut |
|-----------|-------------|--------|
| Augmentation annuelle | Inflation salaires/charges | 2.5% |
| Provision congés payés | % masse salariale | 10% |
| Provision grosses réparations | % immobilisations | 2% |
| Provision créances douteuses | % chiffre d'affaires | 1% |
| Délai paiement clients | Calcul BFR | 30 jours |
| Délai paiement fournisseurs | Calcul BFR | 30 jours |

## Constantes comptables

| Constante | Valeur |
|-----------|--------|
| Charges patronales | 42% |
| Prime Ségur | 238 €/mois |
| Jours par an | 365 |

## Licence

Ce projet est sous licence **GPL-3.0**. Voir le fichier [LICENSE](LICENSE).

## Auteur

Développé pour **AFERTES** - Formation et accompagnement dans le secteur social et médico-social.
