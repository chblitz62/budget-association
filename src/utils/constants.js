// Constantes de l'application
export const CHARGES_PATRONALES = 0.42;
export const PRIME_SEGUR = 238;
export const JOURS_ANNEE = 365;

// Mot de passe par défaut (à changer en production)
export const DEFAULT_PASSWORD = 'afertes2024';

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
  tauxProvisionCongesPayes: 10,
  tauxProvisionGrossesReparations: 2,
  tauxProvisionCreancesDouteuses: 1,
  delaiPaiementClients: 30,
  delaiPaiementFournisseurs: 30
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

// Services de l'association (remplace les Lieux de Vie)
export const defaultServices = [
  {
    id: 1,
    nom: 'Service Formation',
    unites: 100,  // Nombre de places/bénéficiaires
    tauxActivite: 85,  // Taux d'activité %
    investissements: {
      bienImmo: { montant: 0, duree: 25, taux: 0 },
      travaux: { montant: 15000, duree: 10, taux: 2.0 },
      vehicule: { montant: 25000, duree: 5, taux: 3.0 },
      informatique: { montant: 20000, duree: 3, taux: 0 },
      mobilier: { montant: 10000, duree: 10, taux: 0 },
      fraisBancaires: { montant: 0, duree: 1, taux: 0 },
      fraisNotaire: { montant: 0, duree: 1, taux: 0 }
    },
    exploitation: [
      { id: 1, nom: 'Fournitures', montant: 1500 },
      { id: 2, nom: 'Documentation', montant: 800 },
      { id: 3, nom: 'Carburant', montant: 600 },
      { id: 4, nom: 'Assurances', montant: 400 },
      { id: 5, nom: 'Formation', montant: 2000 },
      { id: 6, nom: 'Eau/Élec/Gaz', montant: 500 },
      { id: 7, nom: 'Entretien', montant: 300 },
      { id: 8, nom: 'Téléphonie', montant: 200 }
    ],
    personnel: [
      { id: 1, titre: 'Responsable Formation', etp: 1, salaire: 3800, segur: true },
      { id: 2, titre: 'Formateur', etp: 4, salaire: 3200, segur: true },
      { id: 3, titre: 'Assistant Formation', etp: 2, salaire: 2400, segur: true },
      { id: 4, titre: 'Secrétaire pédagogique', etp: 1, salaire: 2300, segur: true }
    ]
  },
  {
    id: 2,
    nom: 'Service Accompagnement',
    unites: 50,
    tauxActivite: 90,
    investissements: {
      bienImmo: { montant: 200000, duree: 25, taux: 2.5 },
      travaux: { montant: 10000, duree: 10, taux: 2.0 },
      vehicule: { montant: 35000, duree: 5, taux: 3.0 },
      informatique: { montant: 8000, duree: 3, taux: 0 },
      mobilier: { montant: 5000, duree: 10, taux: 0 },
      fraisBancaires: { montant: 5000, duree: 15, taux: 0 },
      fraisNotaire: { montant: 15000, duree: 1, taux: 0 }
    },
    exploitation: [
      { id: 1, nom: 'Fournitures', montant: 800 },
      { id: 2, nom: 'Carburant', montant: 1200 },
      { id: 3, nom: 'Assurances', montant: 500 },
      { id: 4, nom: 'Frais bancaires', montant: 150 },
      { id: 5, nom: 'Formation', montant: 1000 },
      { id: 6, nom: 'Eau/Élec/Gaz', montant: 600 },
      { id: 7, nom: 'Entretien', montant: 400 },
      { id: 8, nom: 'Téléphonie', montant: 250 }
    ],
    personnel: [
      { id: 1, titre: 'Chef de Service', etp: 1, salaire: 3500, segur: true },
      { id: 2, titre: 'Éducateur Spécialisé', etp: 3, salaire: 2900, segur: true },
      { id: 3, titre: 'Travailleur Social', etp: 2, salaire: 2800, segur: true },
      { id: 4, titre: 'Psychologue', etp: 0.5, salaire: 3200, segur: true },
      { id: 5, titre: 'Secrétaire', etp: 1, salaire: 2300, segur: true }
    ]
  }
];
