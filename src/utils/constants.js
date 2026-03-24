// Constantes de l'application
// Version des données par défaut (changer pour forcer le rechargement)
export const DATA_VERSION = '2026-AFERTES-v2';

export const CHARGES_PATRONALES = 0.42;
export const TAUX_CHARGE_TOTAL = 1 + CHARGES_PATRONALES; // 1.42
export const PRIME_SEGUR = 238;
export const SMIC_MENSUEL = 1801.80;        // SMIC brut mensuel 2025 (net ≈ 1426 €)
export const TAUX_FILLON_MAX = 0.3214;      // Réduction Fillon : taux max sur bas salaires (≤ SMIC)
export const TAUX_CHARGES_APPRENTI = 0.12;  // Charges patronales réduites apprentis / contrats pro
export const JOURS_ANNEE = 365;
export const JOURS_OUVRES_AN = 228;       // jours ouvrés/an base France (52 semaines × 5 - 11 fériés - 1)
export const JOURS_CONGES_LEGAL = 25;     // congés payés légaux minimum (5 semaines)
export const JOURS_CARENCE_MALADIE = 3;  // délai de carence SS (charge employeur)
export const CHARGES_VACATAIRE = 15;     // taux charges patronales vacataires (%) — cotisations réduites
export const SEUIL_HEURES_VACATAIRE = 450; // seuil légal heures/an au-delà duquel risque de requalification
export const SEUIL_RATIO_VACATAIRE = 30;   // alerte si vacataires > X% de la masse salariale du service

// Grille tarifaire vacataires et prestataires 2025-2026 (AFERTES)
// multiplicateur : coefficient appliqué aux heures réelles pour le calcul de la rémunération
export const TARIFS_VACATAIRES = [
  { id: 'selection',                  label: 'Sélection',                              salarie: 16.70, prestataire: 23.88, multiplicateur: 1 },
  { id: 'cours',                      label: 'Cours',                                  salarie: 32.34, prestataire: 46.26, multiplicateur: 1 },
  { id: 'td',                         label: 'TD',                                     salarie: 19.40, prestataire: 27.75, multiplicateur: 1 },
  { id: 'correction_dossiers',        label: 'Correction de dossiers',                 salarie: 19.40, prestataire: 27.75, multiplicateur: 2, note: '×2/heure' },
  { id: 'correction_copies',          label: 'Correction de copies',                   salarie: 19.40, prestataire: 27.75, multiplicateur: 3, note: '×3/heure' },
  { id: 'accompagnement',             label: 'Accompagnement (forfait)',                salarie: 19.40, prestataire: 27.75, multiplicateur: 1 },
  { id: 'certification',              label: 'Certification',                          salarie: 19.40, prestataire: 27.75, multiplicateur: 1 },
  { id: 'reunion',                    label: 'Réunion / Surveillance épreuves',        salarie: 13.80, prestataire: 19.73, multiplicateur: 1 },
  { id: 'caferuis_cours',             label: 'Caferuis — Cours',                       salarie: 50.00, prestataire: 71.50, multiplicateur: 1 },
  { id: 'caferuis_td',                label: 'Caferuis — TD',                          salarie: 32.34, prestataire: 46.26, multiplicateur: 1 },
  { id: 'formation_continue',         label: 'Formation continue',                     salarie: null,  prestataire: null,  multiplicateur: 1, note: 'Tarif F.I. / appel d\'offre' },
  { id: 'stage_technique',            label: 'Stage technique (F.I / F.C)',            salarie: 19.40, prestataire: 27.75, multiplicateur: 1 },
  { id: 'stage_correction_dossiers',  label: 'Correction de dossiers — Stage tech.',   salarie: 19.40, prestataire: 27.75, multiplicateur: 2, note: '×2/heure' },
  { id: 'stage_correction_copies',    label: 'Correction de copies — Stage tech.',     salarie: 19.40, prestataire: 27.75, multiplicateur: 3, note: '×3/heure' },
];

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
  montantSegurETP: 238, // Prime Ségur mensuelle pour 1 ETP (configurable)
  // Rôles personnalisables du personnel
  rolesPersonnel: [
    { id: 'direction',         label: 'Siège' },
    { id: 'directeur_adjoint', label: 'Directeur adjoint' },
    { id: 'administratif',     label: 'Administratif' },
    { id: 'technique',         label: 'Technique' },
    { id: 'documentation',     label: 'Documentation' },
    { id: 'communication',     label: 'Communication' },
    { id: 'formateur',         label: 'Formateur' },
    { id: 'responsable',       label: 'Resp. secteur' },
    { id: 'vacataire',         label: 'Vacataire' },
  ],
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

// Données AFERTES 2026 - Structure/Direction
export const defaultDirection = {
  personnel: [
    { id: 1, titre: 'Directeur', etp: 1, salaire: 3891, segur: 0, role: 'direction', rqth: false, anneeNaissance: 0, typeContrat: 'CDI', nbJoursRTT: 0, joursConges: 25, dateFinContrat: '' },
    { id: 2, titre: 'Agent d\'Accueil', etp: 1, salaire: 2291, segur: 0, role: 'administratif', rqth: false, anneeNaissance: 0, typeContrat: 'CDI', nbJoursRTT: 0, joursConges: 25, dateFinContrat: '' },
    { id: 4, titre: 'Comptable', etp: 1, salaire: 2446, segur: 0, role: 'administratif', rqth: false, anneeNaissance: 0, typeContrat: 'CDI', nbJoursRTT: 0, joursConges: 25, dateFinContrat: '' },
    { id: 5, titre: 'Gestionnaire Paie', etp: 1, salaire: 2132, segur: 0, role: 'administratif', rqth: false, anneeNaissance: 0, typeContrat: 'CDI', nbJoursRTT: 0, joursConges: 25, dateFinContrat: '' },
    { id: 7, titre: 'Apprenti(e) Documentation', etp: 1, salaire: 1171, segur: 0, role: 'administratif', rqth: false, anneeNaissance: 0, typeContrat: 'CDI', nbJoursRTT: 0, joursConges: 25, dateFinContrat: '' },
    { id: 9, titre: 'Agent de ménage', etp: 1, salaire: 1800, segur: 0, role: 'technique', rqth: false, anneeNaissance: 0, typeContrat: 'CDI', nbJoursRTT: 0, joursConges: 25, dateFinContrat: '' }
  ],
  chargesSiege: [
    { id: 1, nom: 'Location immobilière', montant: 18363 },
    { id: 2, nom: 'Location mobilière & entretien', montant: 3961 },
    { id: 3, nom: 'Sous-traitance générale', montant: 333 },
  ]
};

// Données AFERTES 2026 - Pôle Support (ressources transversales)
export const defaultPoleSupport = {
  personnel: [
    { id: 1, titre: 'Agent Polyvalent/Resp. Technique', etp: 1, salaire: 3099, segur: 0, role: 'technique', rqth: false, anneeNaissance: 0, typeContrat: 'CDI', nbJoursRTT: 0, joursConges: 25, dateFinContrat: '' },
    { id: 2, titre: 'Resp. Documentation', etp: 1, salaire: 4118, segur: 0, role: 'documentation', rqth: false, anneeNaissance: 0, typeContrat: 'CDI', nbJoursRTT: 0, joursConges: 25, dateFinContrat: '' },
    { id: 3, titre: 'Aide Documentaliste', etp: 1, salaire: 2046, segur: 0, role: 'documentation', rqth: false, anneeNaissance: 0, typeContrat: 'CDI', nbJoursRTT: 0, joursConges: 25, dateFinContrat: '' },
  ],
  exploitation: [],
  recettes: [],
  repartition: {}
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

// Structure investissements vide (partagée par tous les services)
const defaultInvestissements = () => ({
  bienImmo:      { montant: 0, duree: 25, taux: 0 },
  travaux:       { montant: 0, duree: 10, taux: 0 },
  vehicule:      { montant: 0, duree: 5,  taux: 0 },
  informatique:  { montant: 0, duree: 3,  taux: 0 },
  mobilier:      { montant: 0, duree: 10, taux: 0 },
  fraisBancaires:{ montant: 0, duree: 1,  taux: 0 },
  fraisNotaire:  { montant: 0, duree: 1,  taux: 0 }
});

// Service Recherche (vide, prêt à être rempli)
export const defaultServiceRecherche = {
  id: 4, nom: 'Recherche', type: 'recherche',
  accueilPublic: false, sessionsSimulees: [], tauxActivite: 100,
  investissements: defaultInvestissements(),
  exploitation: [], recettes: [], personnel: [], vacataires: []
};

// Service Prévention (vide, prêt à être rempli)
export const defaultServicePrevention = {
  id: 5, nom: 'Prévention', type: 'prevention',
  accueilPublic: false, sessionsSimulees: [], tauxActivite: 100,
  investissements: defaultInvestissements(),
  exploitation: [], recettes: [], personnel: [], vacataires: []
};

// Services AFERTES 2026
// Nota : les montants exploitation et recettes sont MENSUELS (×12 dans les calculs)
export const defaultServices = [
  {
    id: 1,
    nom: 'FI Saint-Laurent',
    accueilPublic: true,
    sessionsSimulees: [],
    type: 'formation',
    useFiliere: true,
    promos: {
      [SITES.SAINT_LAURENT]: [
        {
          id: 'fil-slb-es',
          nom: 'Éducateur Spécialisé',
          promos: [
            { id: 'slb-es', nom: 'Promo ES', effectifInitial: 80, abandons: defaultAbandons(), dateDebut: '', dateFin: '' }
          ]
        },
        {
          id: 'fil-slb-me',
          nom: 'Moniteur Éducateur',
          promos: [
            { id: 'slb-me', nom: 'Promo ME', effectifInitial: 40, abandons: defaultAbandons(), dateDebut: '', dateFin: '' }
          ]
        }
      ]
    },
    tauxActivite: 90,
    investissements: {
      bienImmo: { montant: 0, duree: 25, taux: 0 },
      travaux: { montant: 0, duree: 10, taux: 0 },
      vehicule: { montant: 0, duree: 5, taux: 0 },
      informatique: { montant: 0, duree: 3, taux: 0 },
      mobilier: { montant: 0, duree: 10, taux: 0 },
      fraisBancaires: { montant: 0, duree: 1, taux: 0 },
      fraisNotaire: { montant: 0, duree: 1, taux: 0 }
    },
    exploitation: [
      { id: 1, nom: 'Carburant', montant: 88 },
      { id: 2, nom: 'Produits d\'entretien', montant: 166 },
      { id: 3, nom: 'Petites fournitures', montant: 1334 },
      { id: 4, nom: 'Photocopies et frais éducatifs', montant: 600 },
      { id: 5, nom: 'Prestataires formation ES', montant: 3204 },
      { id: 6, nom: 'Prestataires formation ME', montant: 1318 }
    ],
    recettes: [
      { id: 1, nom: 'Droits d\'inscription ES', montant: 4578 },
      { id: 2, nom: 'Frais de sélection ES', montant: 700 },
      { id: 3, nom: 'Subvention Région ES', montant: 42419 },
      { id: 4, nom: 'Aide apprentissage ES', montant: 125 },
      { id: 5, nom: 'Droits d\'inscription ME', montant: 2301 },
      { id: 6, nom: 'Frais de sélection ME', montant: 865 },
      { id: 7, nom: 'Subvention Région ME', montant: 67332 },
      { id: 8, nom: 'Aide apprentissage ME', montant: 125 }
    ],
    personnel: [
      { id: 1, titre: 'Formateur (ES)', etp: 1, salaire: 3622, segur: 238, role: 'formateur', rqth: false, anneeNaissance: 0, typeContrat: 'CDI', nbJoursRTT: 0, joursConges: 25, dateFinContrat: '' },
      { id: 2, titre: 'Formatrice (ES)', etp: 1, salaire: 2805, segur: 238, role: 'formateur', rqth: false, anneeNaissance: 0, typeContrat: 'CDI', nbJoursRTT: 0, joursConges: 25, dateFinContrat: '' },
      { id: 3, titre: 'Formatrice (ES)', etp: 1, salaire: 2914, segur: 238, role: 'formateur', rqth: false, anneeNaissance: 0, typeContrat: 'CDI', nbJoursRTT: 0, joursConges: 25, dateFinContrat: '' },
      { id: 4, titre: 'Formateur (ES)', etp: 1, salaire: 3067, segur: 238, role: 'formateur', rqth: false, anneeNaissance: 0, typeContrat: 'CDI', nbJoursRTT: 0, joursConges: 25, dateFinContrat: '' },
      { id: 5, titre: 'Secrétaire Administrative (ES)', etp: 1, salaire: 2111, segur: 0, role: 'administratif', rqth: false, anneeNaissance: 0, typeContrat: 'CDI', nbJoursRTT: 0, joursConges: 25, dateFinContrat: '' },
      { id: 6, titre: 'Formateur Resp. Secteur (ME)', etp: 1, salaire: 3950, segur: 238, role: 'responsable', rqth: false, anneeNaissance: 0, typeContrat: 'CDI', nbJoursRTT: 0, joursConges: 25, dateFinContrat: '' },
      { id: 7, titre: 'Formateur part. FI ME', etp: 0.24, salaire: 2891, segur: 238, role: 'formateur', rqth: false, anneeNaissance: 0, typeContrat: 'CDI', nbJoursRTT: 0, joursConges: 25, dateFinContrat: '' },
      { id: 8, titre: 'Formateur Resp. Secteur (ME)', etp: 1, salaire: 3817, segur: 238, role: 'responsable', rqth: false, anneeNaissance: 0, typeContrat: 'CDI', nbJoursRTT: 0, joursConges: 25, dateFinContrat: '' },
      { id: 9, titre: 'Formateur Resp. Secteur (ME)', etp: 1, salaire: 3622, segur: 0, role: 'responsable', rqth: false, anneeNaissance: 0, typeContrat: 'CDI', nbJoursRTT: 0, joursConges: 25, dateFinContrat: '' },
      { id: 10, titre: 'Formateur Resp. Secteur (ME)', etp: 1, salaire: 3151, segur: 238, role: 'responsable', rqth: false, anneeNaissance: 0, typeContrat: 'CDI', nbJoursRTT: 0, joursConges: 25, dateFinContrat: '' },
      { id: 11, titre: 'Agent Administratif (ME)', etp: 1, salaire: 2247, segur: 0, role: 'administratif', rqth: false, anneeNaissance: 0, typeContrat: 'CDI', nbJoursRTT: 0, joursConges: 25, dateFinContrat: '' }
    ],
    vacataires: []
  },
  {
    id: 2,
    nom: 'FI Avion',
    accueilPublic: true,
    sessionsSimulees: [],
    type: 'formation',
    useFiliere: true,
    promos: {
      [SITES.AVION]: [
        {
          id: 'fil-avion-fi',
          nom: 'FI Avion',
          promos: [
            { id: 'avion-fi', nom: 'Promo FI Avion', effectifInitial: 32, abandons: defaultAbandons(), dateDebut: '', dateFin: '' }
          ]
        }
      ]
    },
    tauxActivite: 90,
    investissements: {
      bienImmo: { montant: 0, duree: 25, taux: 0 },
      travaux: { montant: 0, duree: 10, taux: 0 },
      vehicule: { montant: 0, duree: 5, taux: 0 },
      informatique: { montant: 0, duree: 3, taux: 0 },
      mobilier: { montant: 0, duree: 10, taux: 0 },
      fraisBancaires: { montant: 0, duree: 1, taux: 0 },
      fraisNotaire: { montant: 0, duree: 1, taux: 0 }
    },
    exploitation: [
      { id: 1, nom: 'Carré potager', montant: 100 },
      { id: 2, nom: 'Carburant', montant: 25 },
      { id: 3, nom: 'Produits d\'entretien', montant: 21 },
      { id: 4, nom: 'Petites fournitures', montant: 167 },
      { id: 5, nom: 'Photocopies et frais éducatifs', montant: 75 },
      { id: 6, nom: 'Prestataires formation', montant: 874 },
      { id: 7, nom: 'Location immobilière', montant: 1340 }
    ],
    recettes: [
      { id: 1, nom: 'Droits d\'inscription', montant: 1980 },
      { id: 2, nom: 'Frais de sélection', montant: 575 },
      { id: 3, nom: 'Remboursement frais site Avion', montant: 2667 },
      { id: 4, nom: 'Subvention Région', montant: 25249 },
      { id: 5, nom: 'Subvention Communes', montant: 2500 },
      { id: 6, nom: 'Autres financeurs', montant: 1333 },
      { id: 7, nom: 'Aide apprentissage', montant: 125 }
    ],
    personnel: [
      { id: 1, titre: 'Responsable site Avion', etp: 1, salaire: 3840, segur: 238, role: 'responsable', rqth: false, anneeNaissance: 0, typeContrat: 'CDI', nbJoursRTT: 0, joursConges: 25, dateFinContrat: '' },
      { id: 2, titre: 'Formateur', etp: 1, salaire: 2805, segur: 238, role: 'formateur', rqth: false, anneeNaissance: 0, typeContrat: 'CDI', nbJoursRTT: 0, joursConges: 25, dateFinContrat: '' }
    ],
    vacataires: []
  },
  {
    id: 3,
    nom: 'FC',
    accueilPublic: true,
    sessionsSimulees: [],
    type: 'fc',
    promos: {
      [SITES.SAINT_LAURENT]: [
        { id: 'slb-caferuis', nom: 'CAFERUIS', effectifInitial: 20, abandons: defaultAbandons(), dateDebut: '', dateFin: '' },
        { id: 'slb-apprentissage', nom: 'Apprentissage', effectifInitial: 15, abandons: defaultAbandons(), dateDebut: '', dateFin: '' }
      ],
      [SITES.AVION]: [...defaultPromosFormationContinue[SITES.AVION]]
    },
    tauxActivite: 85,
    investissements: {
      bienImmo: { montant: 0, duree: 25, taux: 0 },
      travaux: { montant: 0, duree: 10, taux: 0 },
      vehicule: { montant: 0, duree: 5, taux: 0 },
      informatique: { montant: 0, duree: 3, taux: 0 },
      mobilier: { montant: 0, duree: 10, taux: 0 },
      fraisBancaires: { montant: 0, duree: 1, taux: 0 },
      fraisNotaire: { montant: 0, duree: 1, taux: 0 }
    },
    exploitation: [
      { id: 1, nom: 'Carburant', montant: 13 },
      { id: 2, nom: 'Produits d\'entretien', montant: 21 },
      { id: 3, nom: 'Petites fournitures', montant: 167 },
      { id: 4, nom: 'Photocopies et frais éducatifs', montant: 75 },
      { id: 5, nom: 'Prestataires formation', montant: 766 }
    ],
    recettes: [
      { id: 1, nom: 'Conventions formation (CAFERUIS, Prépa, GAP)', montant: 18168 },
      { id: 2, nom: 'Apprentissage', montant: 10833 },
      { id: 3, nom: 'VAE', montant: 3239 },
      { id: 4, nom: 'Formation continue - micro formation', montant: 10000 },
      { id: 5, nom: 'Aide apprentissage', montant: 125 }
    ],
    personnel: [
      { id: 1, titre: 'Formateur part. FC', etp: 0.76, salaire: 2891, segur: 238, role: 'formateur', rqth: false, anneeNaissance: 0, typeContrat: 'CDI', nbJoursRTT: 0, joursConges: 25, dateFinContrat: '' },
      { id: 2, titre: 'Formateur Resp. Secteur', etp: 1, salaire: 3509, segur: 238, role: 'responsable', rqth: false, anneeNaissance: 0, typeContrat: 'CDI', nbJoursRTT: 0, joursConges: 25, dateFinContrat: '' },
      { id: 3, titre: 'Formateur Resp. Secteur', etp: 1, salaire: 3647, segur: 238, role: 'responsable', rqth: false, anneeNaissance: 0, typeContrat: 'CDI', nbJoursRTT: 0, joursConges: 25, dateFinContrat: '' },
      { id: 4, titre: 'Formateur/Chargé développement', etp: 1, salaire: 2549, segur: 238, role: 'formateur', rqth: false, anneeNaissance: 0, typeContrat: 'CDI', nbJoursRTT: 0, joursConges: 25, dateFinContrat: '' },
      { id: 5, titre: 'Secrétaire Administrative', etp: 1, salaire: 2277, segur: 0, role: 'administratif', rqth: false, anneeNaissance: 0, typeContrat: 'CDI', nbJoursRTT: 0, joursConges: 25, dateFinContrat: '' }
    ],
    vacataires: []
  },
  defaultServiceRecherche,
  defaultServicePrevention
];

// Fonction pour calculer le total d'étudiants d'une promo
export const calculerEffectifActuel = (promo) => {
  const totalAbandons = Object.values(promo.abandons).reduce((sum, val) => sum + val, 0);
  return promo.effectifInitial - totalAbandons;
};

// Fonction pour calculer les stats d'un service de formation
// Gère les deux structures : filières (useFiliere=true) et promos plates
export const calculerStatsFormation = (service) => {
  const unites = service.unites || 0;
  if (!service.promos) return { totalEtudiants: unites, totalAbandons: 0, effectifActuel: unites };

  let totalEtudiants = 0;
  let totalAbandons = 0;

  Object.values(service.promos).forEach(items => {
    items.forEach(item => {
      const promos = Array.isArray(item.promos) ? item.promos : [item];
      promos.forEach(promo => {
        totalEtudiants += promo.effectifInitial || 0;
        totalAbandons += Object.values(promo.abandons || {}).reduce((sum, val) => sum + (val || 0), 0);
      });
    });
  });

  return { totalEtudiants, totalAbandons, effectifActuel: totalEtudiants - totalAbandons };
};
