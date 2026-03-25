// Constantes de l'application

/**
 * Dictionnaire d'aide contextuelle.
 * type : 'info' (bleu, explication calcul) | 'warning' (ambre, mise en garde impact)
 */
export const FINANCIAL_HELP = {
  // ── Masse salariale ────────────────────────────────────────────────────────
  chargesPatronales: {
    type: 'info',
    text: 'Taux moyen de 42 % sur le salaire brut. Ajusté à la baisse par la réduction Fillon pour les salaires ≤ 1,6 SMIC (max −32,14 % au niveau SMIC). Formule : Charges = Brut × Taux calculé.',
  },
  allégementFillon: {
    type: 'info',
    text: 'Réduction dégressive : T = 0,3214 × (1,6 × SMIC/Brut annuel − 1). Elle s\'annule complètement à 1,6 SMIC. Un salarié à 1 800 €/mois économise ~900 €/an de charges patronales.',
  },
  segur: {
    type: 'info',
    text: 'Prime Ségur du médico-social : 238 € bruts/mois pour 1 ETP, proratisée selon le temps de travail. Soumise à charges patronales. Non soumise à la réduction Fillon.',
  },
  segurWarning: {
    type: 'warning',
    text: 'Attention : la prime Ségur augmente le salaire brut de référence. Elle peut réduire l\'allègement Fillon si le total dépasse le seuil SMIC. Impact : +~338 €/an de charges supplémentaires par ETP.',
  },
  etp: {
    type: 'info',
    text: 'ETP = Équivalent Temps Plein. 1 ETP = 35 h/semaine toute l\'année. Un poste à 0,5 ETP revient à mi-temps. Tous les coûts salariaux sont proratisés par l\'ETP.',
  },
  tauxChargesManuel: {
    type: 'warning',
    text: 'Taux forcé : désactive le calcul automatique Fillon. À utiliser uniquement pour des situations particulières (conventions collectives spécifiques, régimes spéciaux). Laissez vide pour le calcul automatique.',
  },

  // ── Exploitation & investissements ─────────────────────────────────────────
  exploitation: {
    type: 'info',
    text: 'Charges d\'exploitation courantes : loyer, énergie, fournitures, prestataires... Les montants saisis sont MENSUELS et multipliés par 12 pour obtenir le total annuel.',
  },
  amortissements: {
    type: 'info',
    text: 'Charge comptable NON décaissée représentant l\'usure des immobilisations. Formule : Amortissement = Valeur d\'achat ÷ Durée de vie. Exemple : matériel informatique 3 000 € sur 3 ans = 1 000 €/an. N\'impacte pas la trésorerie mais réduit le résultat.',
  },
  amortissementsWarning: {
    type: 'warning',
    text: 'Attention : les amortissements sont exclus des décaissements en trésorerie (charge comptable, non décaissée). En revanche, le remboursement du capital d\'emprunt est bien un flux de trésorerie réel.',
  },
  interetsPret: {
    type: 'warning',
    text: 'Les intérêts d\'emprunt sont des charges financières réelles et décaissées chaque mois. À ne pas confondre avec le remboursement du capital (aussi décaissé mais non comptabilisé en charge).',
  },

  // ── Recettes & subventions ─────────────────────────────────────────────────
  subventions: {
    type: 'warning',
    text: 'Les subventions publiques sont des recettes conditionnelles et renégociées chaque année. Une dépendance >70 % aux subventions fragilise la structure. Diversifiez avec des recettes propres (droits d\'inscription, prestations).',
  },
  tauxCouverture: {
    type: 'info',
    text: 'Taux de couverture = Recettes totales ÷ Charges totales × 100. En dessous de 90 % : alerte de sous-financement. À 100 % : équilibre. Au-dessus : excédent réinvestissable ou mis en réserve.',
  },
  tauxCouvertureWarning: {
    type: 'warning',
    text: 'Un taux < 90 % signifie que les charges ne sont pas couvertes par les recettes. L\'association puise dans ses réserves. Si les réserves sont épuisées, la structure est en danger de cessation de paiement.',
  },

  // ── Formation ──────────────────────────────────────────────────────────────
  unitesFormation: {
    type: 'info',
    text: 'Unités = Effectif actuel × Taux d\'activité. Exemple : 30 étudiants à 90 % d\'activité = 27 unités. Ce chiffre est la base du calcul du coût unitaire et sert de dénominateur pour les indicateurs pédagogiques.',
  },
  coutParEtudiant: {
    type: 'info',
    text: 'Coût par étudiant = (Masse salariale + Exploitation) ÷ Nombre d\'étudiants. Indicateur clé de rentabilité pédagogique. À comparer avec le prix de vente (droits d\'inscription + subvention par tête) pour mesurer la marge réelle.',
  },
  repartitionFI: {
    type: 'warning',
    text: 'La répartition FI/FC détermine la part du coût de ce formateur imputée en Formation Initiale vs Formation Continue. Elle impacte directement la présentation EPRD et les clés de répartition analytiques.',
  },
  abandons: {
    type: 'warning',
    text: 'Chaque abandon réduit les recettes (moins de droits d\'inscription) sans réduire les charges fixes (le personnel reste). L\'impact est double : baisse de recettes + hausse du coût par étudiant restant.',
  },

  // ── Trésorerie & BFR ───────────────────────────────────────────────────────
  bfr: {
    type: 'warning',
    text: 'BFR = Créances clients + Stocks − Dettes fournisseurs. Un BFR positif signifie que l\'association avance de la trésorerie avant d\'être payée. Un délai long de paiement clients dégrade le BFR et peut provoquer une rupture de trésorerie même en cas d\'équilibre comptable.',
  },
  delaiPaiement: {
    type: 'warning',
    text: 'Le délai de paiement impacte directement le BFR. +30 jours de délai client = immobilisation d\'1 mois de CA en trésorerie. Pour une association avec 500 k€/mois de recettes, cela représente 500 k€ bloqués.',
  },
  fondsRoulement: {
    type: 'info',
    text: 'Fonds de Roulement = Capitaux permanents − Immobilisations nettes. Il représente le "matelas" financier de l\'association pour couvrir son BFR. Si FR > BFR : trésorerie positive. Si FR < BFR : découvert structurel.',
  },

  // ── Pilotage Financier ─────────────────────────────────────────────────────
  fraisFixes: {
    type: 'info',
    text: 'Charges fixes = charges qui ne varient pas avec le volume d\'activité (loyer, salaires, assurances). Elles doivent être couvertes même si les sessions sont annulées. Formule : Taux de structure = Frais fixes ÷ Heures vendues.',
  },
  tauxStructure: {
    type: 'warning',
    text: 'Le taux de structure est le coût fixe par heure vendue. Si votre tarif horaire de vente est inférieur à ce taux, vous perdez de l\'argent sur chaque heure vendue. Seuil critique : taux de structure > prix de vente.',
  },
  tauxOccupation: {
    type: 'warning',
    text: 'Taux d\'occupation = Heures animées ÷ Heures contractuelles × 100. En dessous de 60 % : le formateur coûte plus qu\'il ne produit. Entre 60 et 80 % : zone correcte. Au-dessus de 80 % : risque de surcharge et de burn-out.',
  },
  coutHoraireFacture: {
    type: 'info',
    text: 'Coût horaire facturé = Coût total annuel ÷ Heures animées. C\'est le coût réel de chaque heure "productive". À comparer avec le taux horaire de vente pour calculer la marge par heure de formation.',
  },
  heuresVendues: {
    type: 'info',
    text: 'Heures vendues = heures de formation effectivement payées par les clients (OPCO, stagiaires, entreprises). C\'est la base du calcul du CA et du taux de structure. Différent des heures animées (hors préparation).',
  },
  marge: {
    type: 'info',
    text: 'Marge = CA sessions − Coût formateurs − Frais fixes imputés. Une marge négative sur un site indique que les sessions ne couvrent pas les coûts. Possible si la subvention globale compense, mais à surveiller.',
  },

  // ── Pool RH ────────────────────────────────────────────────────────────────
  poolRH: {
    type: 'info',
    text: 'Le Pool RH permet d\'affecter le coût d\'un agent (ex. RH, comptable) à plusieurs services en pourcentage. Exemple : un comptable affecté à 30 % Service A, 70 % Service B. Le total doit être ≤ 100 %.',
  },
  poolRHWarning: {
    type: 'warning',
    text: 'Attention : si la somme des pourcentages d\'affectation dépasse 100 %, le coût est surcomptabilisé. Si elle est inférieure à 100 %, une partie du coût de l\'agent n\'est imputée à aucune entité.',
  },

  // ── Pilotage Financier — champs formateurs ──────────────────────────────────
  salaireBrutPilotage: {
    type: 'info',
    text: 'Salaire brut mensuel du formateur. Multiplié par 12 pour le brut annuel, puis majoré du taux de charges patronales. Formule : Coût = Brut × 12 × (1 + Taux charges / 100).',
  },
  tauxChargesPilotage: {
    type: 'info',
    text: 'Taux de charges patronales (%). Typiquement 42–47 % pour les associations (URSSAF, retraite, prévoyance, mutuelle employeur). Saisissez 45 si vous n\'avez pas le taux exact.',
  },
  heuresHebdo: {
    type: 'info',
    text: 'Heures contractuelles par semaine (35 h = temps plein, 28 h = 0,8 ETP). Base de calcul : Heures annuelles = H/sem × 52 semaines. Tous les ratios d\'occupation et coûts horaires en dépendent.',
  },
  heuresHorsProd: {
    type: 'warning',
    text: 'Heures hebdomadaires non pédagogiques : réunions, formations internes, administratif. Ces heures réduisent les heures disponibles et augmentent mécaniquement le coût horaire facturé.',
  },
  ratioPreparation: {
    type: 'info',
    text: 'Pour 1 heure animée, combien d\'heures au total (animation + préparation) ? Ratio 1,2 = 1 h animation + 0,2 h prépa. Plus il est élevé, moins le formateur anime et plus son coût horaire facturé grimpe.',
  },
  joursAbsencePilotage: {
    type: 'warning',
    text: 'Jours d\'absence maladie / arrêt de travail sur l\'année (hors congés payés). Chaque jour réduit les heures disponibles d\'environ 7 h et dégrade le taux d\'occupation.',
  },
  coutHoraireContractuel: {
    type: 'info',
    text: 'Coût horaire de base = Coût total annuel ÷ Heures contractuelles. C\'est le coût "plancher" avant déduction des hors-productions et absences — toujours inférieur au coût horaire facturé.',
  },

  // ── Pilotage Financier — résultats sessions ─────────────────────────────────
  fraisStructureSession: {
    type: 'info',
    text: 'Quote-part des frais fixes imputée à cette session = Taux de structure (€/h) × Durée (h). Contribution de la session à l\'absorption des charges fixes du site (loyer, logiciels, administration…).',
  },
  pointMort: {
    type: 'info',
    text: 'Point mort = Coût total session ÷ Prix par stagiaire. Nombre minimum de stagiaires pour atteindre l\'équilibre. En dessous : la session génère une perte. Au-dessus : elle dégage une marge.',
  },
  tauxMargeSession: {
    type: 'info',
    text: 'Taux de marge = Marge nette ÷ Recettes × 100. Mesure l\'efficacité commerciale de la session. Cible recommandée > 15 %. Négatif = la session coûte plus qu\'elle ne rapporte.',
  },
};


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

// Grille tarifaire vacataires et prestataires (personnalisable)
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

// Paramètres globaux par défaut
export const defaultGlobalParams = {
  augmentationAnnuelle: 2.5,
  tauxGVT: 1.5,
  inflationEnergie: 8.0,
  inflationLoyers: 3.5,
  inflationAutres: 2.5,
  delaiPaiementClients: 30,
  delaiPaiementFournisseurs: 30,
  montantSegurETP: 238,
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
  provisions: [
    { id: 'conges', nom: 'Congés payés', baseCalcul: 'salaires', taux: 10 },
    { id: 'reparations', nom: 'Grosses réparations', baseCalcul: 'investissements', taux: 2 },
    { id: 'creances', nom: 'Créances douteuses', baseCalcul: 'chiffre_affaires', taux: 1 },
    { id: 'retraite', nom: 'Provision retraite', baseCalcul: 'salaires', taux: 0 },
    { id: 'prudhommes', nom: 'Prud\'hommes', baseCalcul: 'salaires', taux: 0 }
  ],
  fondRoulement: [
    { id: 'reserves', nom: 'Réserves', montant: 0 },
    { id: 'reportNouveau', nom: 'Report à nouveau', montant: 0 },
    { id: 'subventionsInvest', nom: 'Subventions d\'investissement', montant: 0 }
  ],
  stocksValeur: 0,
  tauxSubventionDAF: { fi: 70, transversal: 60, recherche: 30 },
};

// ─── DAF — Dossier de Demande de Subvention Régionale ─────────────────────────

export const DAF_TAUX_INIT = { fi: 70, transversal: 60, recherche: 30 };

export const DAF_FORMATIONS_INIT = [
  { id: 'es',       nom: 'FI Éducateur Spécialisé (ES)',             duree: 3, effectif: 0 },
  { id: 'me',       nom: 'FI Moniteur Éducateur (ME)',               duree: 2, effectif: 0 },
  { id: 'caferuis', nom: 'CAFERUIS (Cadres intermédiaires)',          duree: 2, effectif: 0 },
  { id: 'cafdes',   nom: 'CAFDES (Directeurs)',                       duree: 2, effectif: 0 },
  { id: 'aes',      nom: 'AES (Accompagnant Éducatif et Social)',     duree: 1, effectif: 0 },
];

export const DAF_COST_LINES = [
  { key: 'personnel', label: 'Personnel (salaires + charges)' },
  { key: 'materiel',  label: 'Matériel pédagogique' },
  { key: 'locaux',    label: 'Locaux / Infrastructure' },
  { key: 'admin',     label: 'Frais administratifs' },
  { key: 'autres',    label: 'Autres charges' },
];

export const DAF_TRANSVERSAL_INIT = [
  { id: 't1', nom: 'Communication',        coutTotal: 0, cleRep: 80 },
  { id: 't2', nom: 'Documentation',        coutTotal: 0, cleRep: 80 },
  { id: 't3', nom: 'Informatique',         coutTotal: 0, cleRep: 70 },
  { id: 't4', nom: 'Comptabilité',         coutTotal: 0, cleRep: 50 },
  { id: 't5', nom: 'Ressources Humaines',  coutTotal: 0, cleRep: 60 },
  { id: 't6', nom: 'Direction générale',   coutTotal: 0, cleRep: 60 },
];

// Structure investissements vide partagée (déclaration anticipée pour defaultDirection/defaultPoleSupport)
const emptyInvest = () => ({
  bienImmo:      { montant: 0, duree: 25, taux: 0 },
  travaux:       { montant: 0, duree: 10, taux: 0 },
  vehicule:      { montant: 0, duree: 5,  taux: 0 },
  informatique:  { montant: 0, duree: 3,  taux: 0 },
  mobilier:      { montant: 0, duree: 10, taux: 0 },
  fraisBancaires:{ montant: 0, duree: 1,  taux: 0 },
  fraisNotaire:  { montant: 0, duree: 1,  taux: 0 },
});

// Structure Direction vide — modèle "Service" complet
export const defaultDirection = {
  personnel: [],
  chargesSiege: [],     // legacy (maintenu pour compat) = exploitation primaire
  exploitation: [],     // charges de fonctionnement supplémentaires (nouveau)
  recettes: [],         // produits propres (conventions, locations, prestations)
  investissements: emptyInvest(),
  repartition: {},      // clé analytique vers services { [serviceId]: pct }
};

// Structure Pôle Support vide — modèle "Service" complet
export const defaultPoleSupport = {
  personnel: [],
  exploitation: [],
  recettes: [],
  repartition: {},
  investissements: emptyInvest(),
};

// Sites de formation (personnalisables)
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

// Structure des réalisations par mois pour les prestations
export const defaultRealisations = () => ({
  janvier: 0, fevrier: 0, mars: 0, avril: 0, mai: 0, juin: 0,
  juillet: 0, aout: 0, septembre: 0, octobre: 0, novembre: 0, decembre: 0
});

// Calcul du total des réalisations
export const calculerTotalRealisations = (realisations) => {
  if (!realisations) return 0;
  return Object.values(realisations).reduce((sum, val) => sum + val, 0);
};

// Promos par défaut (vides — à configurer par l'utilisateur)
export const defaultPromosFormationInitiale = {};
export const defaultPromosFormationContinue = {};

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

// Service vide par défaut (utilisé pour "Nouveau Budget")
export const createEmptyService = (id = 1, nom = 'Service 1') => ({
  id,
  nom,
  accueilPublic: false,
  sessionsSimulees: [],
  type: 'formation',
  tauxActivite: 100,
  investissements: defaultInvestissements(),
  exploitation: [],
  recettes: [],
  personnel: [],
  vacataires: []
});

// Services par défaut : un seul service vide
export const defaultServices = [createEmptyService(1, 'Service 1')];

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
