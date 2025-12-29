// Constantes de l'application
export const CHARGES_PATRONALES = 0.42;
export const PRIME_SEGUR = 238;
export const JOURS_ANNEE = 365;

// Mot de passe par défaut (à changer en production)
export const DEFAULT_PASSWORD = 'demo2025';

// Plan Comptable Général - Numéros de compte
export const COMPTES_IMMO = {
  bienImmo: { compte: '213', libelle: 'Constructions' },
  travaux: { compte: '213', libelle: 'Constructions (travaux)' },
  vehicule: { compte: '2182', libelle: 'Matériel de transport' },
  informatique: { compte: '2183', libelle: 'Matériel informatique' },
  mobilier: { compte: '2184', libelle: 'Mobilier' },
  fraisBancaires: { compte: '627', libelle: 'Frais bancaires (acquisition)' },
  fraisNotaire: { compte: '622', libelle: 'Frais notariés' }
};

export const COMPTES_EXPLOITATION = {
  'Alimentation': '601',
  'Carburant': '6061',
  'Assurances': '616',
  'Frais bancaires': '627',
  'Formation': '6064',
  'Eau/Élec/Gaz': '606',
  'Entretien': '615',
  'Fournitures': '6064',
  'Loyer': '613',
  'Charges': '614',
  'Téléphonie': '626',
  'Documentation': '6181'
};

// Valeurs par défaut
export const defaultGlobalParams = {
  augmentationAnnuelle: 2.5,
  delaiPaiementClients: 30,
  delaiPaiementFournisseurs: 30,
  // Provisions personnalisables
  provisions: [
    { id: 'conges', nom: 'Congés payés', baseCalcul: 'salaires', taux: 10 },
    { id: 'reparations', nom: 'Grosses réparations', baseCalcul: 'investissements', taux: 2 },
    { id: 'creances', nom: 'Créances douteuses', baseCalcul: 'chiffre_affaires', taux: 1 },
    { id: 'retraite', nom: 'Provision retraite', baseCalcul: 'salaires', taux: 0 },
    { id: 'prudhommes', nom: 'Prud\'hommes', baseCalcul: 'salaires', taux: 0 }
  ],
  // Fonds de roulement personnalisable
  fondRoulement: [
    { id: 'reserves', nom: 'Réserves', montant: 0 },
    { id: 'reportNouveau', nom: 'Report à nouveau', montant: 0 },
    { id: 'subventionsInvest', nom: 'Subventions d\'investissement', montant: 0 }
  ],
  // BFR - éléments personnalisables supplémentaires
  stocksValeur: 0
};

export const defaultDirection = {
  personnel: [
    { id: 1, titre: 'Directeur Général', etp: 1, salaire: 5000, segur: true },
    { id: 2, titre: 'Directeur Adjoint', etp: 1, salaire: 4200, segur: true },
    { id: 3, titre: 'Responsable RH', etp: 1, salaire: 3500, segur: true },
    { id: 4, titre: 'Secrétariat Direction', etp: 2, salaire: 2400, segur: true },
    { id: 5, titre: 'Comptable', etp: 1.5, salaire: 2800, segur: true },
    { id: 6, titre: 'Agent accueil', etp: 1, salaire: 2200, segur: true }
  ],
  loyer: 3000,
  charges: 1200,
  autresCharges: 800
};

// Sites de formation
export const SITES = {
  AVION: 'Avion',
  SAINT_LAURENT: 'Saint-Laurent-Blangy'
};

// Mois de l'année
export const MOIS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

// Structure des abandons par mois (initialisée à 0)
const defaultAbandons = () => ({
  janvier: 0, fevrier: 0, mars: 0, avril: 0, mai: 0, juin: 0,
  juillet: 0, aout: 0, septembre: 0, octobre: 0, novembre: 0, decembre: 0
});

// Structure des réalisations par mois pour les prestations (VAE, Supervision, etc.)
export const defaultRealisations = () => ({
  janvier: 0, fevrier: 0, mars: 0, avril: 0, mai: 0, juin: 0,
  juillet: 0, aout: 0, septembre: 0, octobre: 0, novembre: 0, decembre: 0
});

// Calcul du total des réalisations
export const calculerTotalRealisations = (realisations) => {
  if (!realisations) return 0;
  return Object.values(realisations).reduce((sum, val) => sum + val, 0);
};

// Promos par site - Formation Initiale
export const defaultPromosFormationInitiale = {
  [SITES.AVION]: [
    { id: 'avion-aes', nom: 'AES', effectifInitial: 25, abandons: defaultAbandons() },
    { id: 'avion-es1', nom: 'ES1', effectifInitial: 30, abandons: defaultAbandons() },
    { id: 'avion-es2', nom: 'ES2', effectifInitial: 28, abandons: defaultAbandons() },
    { id: 'avion-me1', nom: 'ME1', effectifInitial: 20, abandons: defaultAbandons() },
    { id: 'avion-me2', nom: 'ME2', effectifInitial: 18, abandons: defaultAbandons() }
  ],
  [SITES.SAINT_LAURENT]: [
    { id: 'slb-es1', nom: 'ES1', effectifInitial: 25, abandons: defaultAbandons() },
    { id: 'slb-es2', nom: 'ES2', effectifInitial: 24, abandons: defaultAbandons() },
    { id: 'slb-es3', nom: 'ES3', effectifInitial: 22, abandons: defaultAbandons() },
    { id: 'slb-me1', nom: 'ME1', effectifInitial: 18, abandons: defaultAbandons() },
    { id: 'slb-me2', nom: 'ME2', effectifInitial: 16, abandons: defaultAbandons() }
  ]
};

// Promos par site - Formation Continue (CAFDES, CAFERUIS, VAE, Prestation, GAP, Supervision)
export const defaultPromosFormationContinue = {
  [SITES.AVION]: [
    { id: 'avion-cafdes1', nom: 'CAFDES1', effectifInitial: 15, abandons: defaultAbandons() },
    { id: 'avion-cafdes2', nom: 'CAFDES2', effectifInitial: 12, abandons: defaultAbandons() },
    { id: 'avion-vae', nom: 'VAE', effectifInitial: 20, abandons: defaultAbandons() },
    { id: 'avion-prestation', nom: 'Prestation Formation', effectifInitial: 25, abandons: defaultAbandons() },
    { id: 'avion-gap', nom: 'GAP', effectifInitial: 15, abandons: defaultAbandons() },
    { id: 'avion-supervision', nom: 'Supervision', effectifInitial: 12, abandons: defaultAbandons() }
  ],
  [SITES.SAINT_LAURENT]: [
    { id: 'slb-caferuis1', nom: 'CAFERUIS1', effectifInitial: 20, abandons: defaultAbandons() },
    { id: 'slb-caferuis2', nom: 'CAFERUIS2', effectifInitial: 18, abandons: defaultAbandons() },
    { id: 'slb-vae', nom: 'VAE', effectifInitial: 20, abandons: defaultAbandons() },
    { id: 'slb-prestation', nom: 'Prestation Formation', effectifInitial: 25, abandons: defaultAbandons() },
    { id: 'slb-gap', nom: 'GAP', effectifInitial: 15, abandons: defaultAbandons() },
    { id: 'slb-supervision', nom: 'Supervision', effectifInitial: 13, abandons: defaultAbandons() }
  ]
};

// Plan Comptable - Comptes de produits (recettes)
export const COMPTES_RECETTES = {
  'Subvention Région': '74',
  'Subvention État': '74',
  'Subvention Département': '74',
  'Financement OPCO': '706',
  'Droits d\'inscription': '706',
  'Frais de scolarité': '706',
  'Prestations de service': '706',
  'Taxe d\'apprentissage': '74',
  'Fonds de formation': '74',
  'Autres produits': '75'
};

// Services de l'association
export const defaultServices = [
  {
    id: 1,
    nom: 'Formation Initiale',
    type: 'formation',
    promos: defaultPromosFormationInitiale,
    tauxActivite: 90,
    investissements: {
      bienImmo: { montant: 0, duree: 25, taux: 0 },
      travaux: { montant: 15000, duree: 10, taux: 2.0 },
      vehicule: { montant: 25000, duree: 5, taux: 3.0 },
      informatique: { montant: 30000, duree: 3, taux: 0 },
      mobilier: { montant: 15000, duree: 10, taux: 0 },
      fraisBancaires: { montant: 0, duree: 1, taux: 0 },
      fraisNotaire: { montant: 0, duree: 1, taux: 0 }
    },
    exploitation: [
      { id: 1, nom: 'Fournitures', montant: 2000 },
      { id: 2, nom: 'Documentation', montant: 1500 },
      { id: 3, nom: 'Carburant', montant: 800 },
      { id: 4, nom: 'Assurances', montant: 600 },
      { id: 5, nom: 'Eau/Élec/Gaz', montant: 1200 },
      { id: 6, nom: 'Entretien', montant: 500 },
      { id: 7, nom: 'Téléphonie', montant: 300 }
    ],
    recettes: [
      { id: 1, nom: 'Subvention Région', montant: 35000 },
      { id: 2, nom: 'Droits d\'inscription', montant: 8000 },
      { id: 3, nom: 'Taxe d\'apprentissage', montant: 5000 },
      { id: 4, nom: 'Financement OPCO', montant: 12000 }
    ],
    personnel: [
      { id: 1, titre: 'Responsable Formation Initiale', etp: 1, salaire: 4000, segur: true },
      { id: 2, titre: 'Formateur ES', etp: 3, salaire: 3200, segur: true },
      { id: 3, titre: 'Formateur ME', etp: 2, salaire: 3200, segur: true },
      { id: 4, titre: 'Formateur AES', etp: 1, salaire: 3000, segur: true },
      { id: 5, titre: 'Secrétaire pédagogique', etp: 2, salaire: 2400, segur: true }
    ]
  },
  {
    id: 2,
    nom: 'Formation Continue',
    type: 'formation',
    promos: defaultPromosFormationContinue,
    tauxActivite: 85,
    investissements: {
      bienImmo: { montant: 0, duree: 25, taux: 0 },
      travaux: { montant: 10000, duree: 10, taux: 2.0 },
      vehicule: { montant: 40000, duree: 5, taux: 3.0 },
      informatique: { montant: 37000, duree: 3, taux: 0 },
      mobilier: { montant: 16000, duree: 10, taux: 0 },
      fraisBancaires: { montant: 0, duree: 1, taux: 0 },
      fraisNotaire: { montant: 0, duree: 1, taux: 0 }
    },
    exploitation: [
      { id: 1, nom: 'Fournitures', montant: 2150 },
      { id: 2, nom: 'Documentation', montant: 1500 },
      { id: 3, nom: 'Carburant', montant: 1750 },
      { id: 4, nom: 'Assurances', montant: 600 },
      { id: 5, nom: 'Eau/Élec/Gaz', montant: 800 },
      { id: 6, nom: 'Entretien', montant: 400 },
      { id: 7, nom: 'Téléphonie', montant: 600 }
    ],
    recettes: [
      { id: 1, nom: 'Financement OPCO', montant: 40000 },
      { id: 2, nom: 'Frais de scolarité', montant: 20000 },
      { id: 3, nom: 'Subvention État', montant: 10000 }
    ],
    personnel: [
      { id: 1, titre: 'Responsable Formation Continue', etp: 1, salaire: 4000, segur: true },
      { id: 2, titre: 'Formateur CAFDES', etp: 1.5, salaire: 3500, segur: true },
      { id: 3, titre: 'Formateur CAFERUIS', etp: 1.5, salaire: 3400, segur: true },
      { id: 4, titre: 'Secrétaire pédagogique', etp: 2, salaire: 2400, segur: true }
    ]
  },
  {
    id: 3,
    nom: 'VAE',
    type: 'prestation',
    realisations: defaultRealisations(),
    prixUnitaire: 1500,
    tauxActivite: 100,
    investissements: {
      bienImmo: { montant: 0, duree: 25, taux: 0 },
      travaux: { montant: 0, duree: 10, taux: 0 },
      vehicule: { montant: 0, duree: 5, taux: 0 },
      informatique: { montant: 5000, duree: 3, taux: 0 },
      mobilier: { montant: 2000, duree: 10, taux: 0 },
      fraisBancaires: { montant: 0, duree: 1, taux: 0 },
      fraisNotaire: { montant: 0, duree: 1, taux: 0 }
    },
    exploitation: [
      { id: 1, nom: 'Fournitures', montant: 200 },
      { id: 2, nom: 'Documentation', montant: 100 },
      { id: 3, nom: 'Déplacements', montant: 300 }
    ],
    recettes: [
      { id: 1, nom: 'Prestations VAE', montant: 0 }
    ],
    personnel: [
      { id: 1, titre: 'Accompagnateur VAE', etp: 1, salaire: 2800, segur: true }
    ]
  },
  {
    id: 4,
    nom: 'Prestations Formation',
    type: 'prestation',
    realisations: defaultRealisations(),
    prixUnitaire: 800,
    tauxActivite: 100,
    investissements: {
      bienImmo: { montant: 0, duree: 25, taux: 0 },
      travaux: { montant: 0, duree: 10, taux: 0 },
      vehicule: { montant: 0, duree: 5, taux: 0 },
      informatique: { montant: 3000, duree: 3, taux: 0 },
      mobilier: { montant: 1500, duree: 10, taux: 0 },
      fraisBancaires: { montant: 0, duree: 1, taux: 0 },
      fraisNotaire: { montant: 0, duree: 1, taux: 0 }
    },
    exploitation: [
      { id: 1, nom: 'Fournitures', montant: 150 },
      { id: 2, nom: 'Documentation', montant: 100 },
      { id: 3, nom: 'Déplacements', montant: 400 }
    ],
    recettes: [
      { id: 1, nom: 'Prestations Formation', montant: 0 }
    ],
    personnel: [
      { id: 1, titre: 'Formateur Prestation', etp: 1, salaire: 3000, segur: true }
    ]
  },
  {
    id: 5,
    nom: 'Supervision',
    type: 'prestation',
    realisations: defaultRealisations(),
    prixUnitaire: 500,
    tauxActivite: 100,
    investissements: {
      bienImmo: { montant: 0, duree: 25, taux: 0 },
      travaux: { montant: 0, duree: 10, taux: 0 },
      vehicule: { montant: 0, duree: 5, taux: 0 },
      informatique: { montant: 2000, duree: 3, taux: 0 },
      mobilier: { montant: 1000, duree: 10, taux: 0 },
      fraisBancaires: { montant: 0, duree: 1, taux: 0 },
      fraisNotaire: { montant: 0, duree: 1, taux: 0 }
    },
    exploitation: [
      { id: 1, nom: 'Fournitures', montant: 100 },
      { id: 2, nom: 'Documentation', montant: 50 },
      { id: 3, nom: 'Déplacements', montant: 350 }
    ],
    recettes: [
      { id: 1, nom: 'Prestations Supervision', montant: 0 }
    ],
    personnel: [
      { id: 1, titre: 'Superviseur', etp: 0.5, salaire: 3500, segur: true }
    ]
  },
  {
    id: 6,
    nom: 'GAP (Groupe d\'Analyse des Pratiques)',
    type: 'prestation',
    realisations: defaultRealisations(),
    prixUnitaire: 400,
    tauxActivite: 100,
    investissements: {
      bienImmo: { montant: 0, duree: 25, taux: 0 },
      travaux: { montant: 0, duree: 10, taux: 0 },
      vehicule: { montant: 0, duree: 5, taux: 0 },
      informatique: { montant: 2000, duree: 3, taux: 0 },
      mobilier: { montant: 1000, duree: 10, taux: 0 },
      fraisBancaires: { montant: 0, duree: 1, taux: 0 },
      fraisNotaire: { montant: 0, duree: 1, taux: 0 }
    },
    exploitation: [
      { id: 1, nom: 'Fournitures', montant: 100 },
      { id: 2, nom: 'Documentation', montant: 100 },
      { id: 3, nom: 'Déplacements', montant: 400 }
    ],
    recettes: [
      { id: 1, nom: 'Prestations GAP', montant: 0 }
    ],
    personnel: [
      { id: 1, titre: 'Animateur GAP', etp: 0.5, salaire: 3200, segur: true }
    ]
  }
];

// Fonction pour calculer le total d'étudiants d'une promo
export const calculerEffectifActuel = (promo) => {
  const totalAbandons = Object.values(promo.abandons).reduce((sum, val) => sum + val, 0);
  return promo.effectifInitial - totalAbandons;
};

// Fonction pour calculer les stats d'un service de formation
export const calculerStatsFormation = (service) => {
  if (!service.promos) return { totalEtudiants: service.unites || 0, totalAbandons: 0 };

  let totalEtudiants = 0;
  let totalAbandons = 0;

  Object.values(service.promos).forEach(promosParSite => {
    promosParSite.forEach(promo => {
      totalEtudiants += promo.effectifInitial;
      totalAbandons += Object.values(promo.abandons).reduce((sum, val) => sum + val, 0);
    });
  });

  return { totalEtudiants, totalAbandons, effectifActuel: totalEtudiants - totalAbandons };
};
