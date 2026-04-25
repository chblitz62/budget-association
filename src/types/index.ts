// ═══════════════════════════════════════════════════════════════════
// Types partagés — Budget Association AFERTES
// Phase R3 : shapes des données persistées (localStorage)
// ═══════════════════════════════════════════════════════════════════

// ─── Briques de base ────────────────────────────────────────────────

export interface ExploitationLine {
  id: string | number;
  nom: string;
  montant: number;
  compte?: string;
  /** Compte PCG (plan comptable général) — ex: "6132" pour loyer */
  comptePCG?: string;
  /** Ventilation mensuelle en pourcentage (jan..déc) */
  mensualisation?: Record<string, number>;
}

export interface RecetteLine {
  id: string | number;
  nom: string;
  montant: number;
  compte?: string;
  /** Compte PCG (plan comptable général) — ex: "7411" pour subvention Région */
  comptePCG?: string;
  mensualisation?: Record<string, number>;
}

export interface InvestLine {
  montant: number;
  /** Durée d'amortissement en années */
  duree: number;
  taux: number;
}

export interface Investissements {
  bienImmo: InvestLine;
  travaux: InvestLine;
  vehicule: InvestLine;
  informatique: InvestLine;
  mobilier: InvestLine;
  fraisBancaires: InvestLine;
  fraisNotaire: InvestLine;
}

// ─── Personnel ──────────────────────────────────────────────────────

export interface Agent {
  id: string | number;
  titre: string;
  role: string;
  /** Salaire brut mensuel en € */
  salaire: number;
  /** Équivalent temps plein (0–1) */
  etp: number;
  /**
   * Prime Ségur : `true` = montantSegurETP global, `false` = aucune,
   * `number` = montant mensuel fixe personnalisé
   */
  segur: boolean | number;
  typeContrat?: 'CDI' | 'CDD' | 'apprentissage' | 'contrat_pro';
  anneeNaissance?: number;
  rqth?: boolean;
  eligibleSubvention?: boolean;
  /**
   * Répartition temps FC par mois : clés = 'jan'…'dec',
   * valeurs = heures allouées FC ce mois (le reste = FI)
   */
  repartitionFI?: Record<string, number>;
  /** @deprecated Alias de repartitionFI */
  repartitionFC?: Record<string, number>;
  /** Override du taux CHARGES_PATRONALES pour cet agent (en %) */
  tauxChargesManuel?: number;
  joursAbsencePrevus?: number;
  /** Matricule RH — utilisé pour mapping Dolibarr */
  matricule?: string;
  /** ID employé dans Dolibarr (null = non mappé) */
  dolibarrEmployeeId?: number | null;
}

export interface PoolRHAgent extends Agent {
  /** ID(s) des services auxquels l'agent est rattaché */
  servicesIds?: (string | number)[];
  /** Répartition du coût entre services (%) */
  repartitionServices?: Record<string | number, number>;
}

// ─── Vacataires ─────────────────────────────────────────────────────

export interface Vacataire {
  id: string | number;
  nom?: string;
  /** Tarif horaire brut en € */
  tauxHoraire: number;
  heuresAnnuelles?: number;
  /** Planning mensuel : clés = 'jan'…'dec', valeurs = heures */
  planningMensuel?: Record<string, number>;
  /** Taux de charges patronales simplifiées (défaut : 15 %) */
  tauxCharges?: number;
}

// ─── Formations ─────────────────────────────────────────────────────

export type MoisAbandons = {
  janvier: number; fevrier: number; mars: number; avril: number;
  mai: number; juin: number; juillet: number; aout: number;
  septembre: number; octobre: number; novembre: number; decembre: number;
};

export interface Promo {
  id: string | number;
  nom?: string;
  type: 'standard' | 'apprentissage' | 'contrat_pro';
  effectifInitial: number;
  abandons: MoisAbandons;
  prixParEtudiant?: number;
  dateDebut?: string;   // ISO date
  dateFin?: string;     // ISO date
  /** Ventilation mensuelle des recettes (contrat_pro) : clés = mois courts */
  ventilationMensuelle?: Record<string, number>;
  subventionRegion?: number;
}

// ─── Sessions (pilotage FC) ──────────────────────────────────────────

export interface Session {
  id: string | number;
  nom?: string;
  formateurId?: string | number;
  nbStagiaires?: number;
  prixStagiaire?: number;
  nbHeures?: number;
  fraisDeplacements?: number;
  fraisSupports?: number;
}

// ─── Service ────────────────────────────────────────────────────────

export interface Service {
  id: string | number;
  nom: string;
  type?: string;
  accueilPublic?: boolean;
  tauxActivite?: number;
  personnel: Agent[];
  exploitation: ExploitationLine[];
  recettes: RecetteLine[];
  vacataires?: Vacataire[];
  /** Promos FI organisées en filières */
  promos?: Promo[];
  /** Nombre d'unités/stagiaires (mode simple, sans promos) */
  unites?: number;
  sessionsSimulees?: Session[];
  investissements?: Investissements;
  /** Clé analytique de répartition des frais de siège (%) */
  repartitionSiege?: Record<string, number>;
  /** Code analytique court — ex: "IFAS", "AIDE-DOM" (mapping Dolibarr projet) */
  codeAnalytique?: string;
  /** ID projet dans Dolibarr (null = non mappé) */
  dolibarrProjectId?: number | null;
}

// ─── Direction & Pôle Support ────────────────────────────────────────

export interface Direction {
  personnel: Agent[];
  /** @deprecated Alias de exploitation (compat. legacy) */
  chargesSiege?: ExploitationLine[];
  exploitation?: ExploitationLine[];
  recettes?: RecetteLine[];
  investissements?: Investissements;
  /** Répartition analytique vers services { [serviceId]: pct } */
  repartition?: Record<string | number, number>;
}

export interface PoleSupport {
  personnel: Agent[];
  exploitation?: ExploitationLine[];
  recettes?: RecetteLine[];
  investissements?: Investissements;
  repartition?: Record<string | number, number>;
}

// ─── Paramètres globaux ──────────────────────────────────────────────

export interface Provision {
  id: string;
  nom: string;
  baseCalcul: 'salaires' | 'investissements' | 'chiffre_affaires';
  taux: number;
}

export interface FondRoulement {
  id: string;
  nom: string;
  montant: number;
}

export interface RolePersonnel {
  id: string;
  label: string;
}

export interface TarifVacataire {
  id: string;
  label: string;
  tauxHoraire: number;
}

export interface GlobalParams {
  augmentationAnnuelle: number;
  tauxGVT?: number;
  inflationEnergie?: number;
  inflationLoyers?: number;
  inflationAutres?: number;
  delaiPaiementClients: number;
  delaiPaiementFournisseurs: number;
  /** Montant Ségur mensuel par ETP (défaut : 238 €) */
  montantSegurETP: number;
  /** Seuil d'alerte taux de couverture (défaut : 90 %) */
  seuilCouverture?: number;
  rolesPersonnel: RolePersonnel[];
  provisions: Provision[];
  fondRoulement: FondRoulement[];
  stocksValeur: number;
  soldeFDOuverture?: number;
  tauxSubventionDAF?: { fi: number; transversal: number; recherche: number };
  taxeSalaires?: boolean;
  tauxTaxeSalaires?: number;
  gestionTVA?: boolean;
  tauxTVAMoyen?: number;
  /** Coefficient BP global (%) — multiplie charges exploitation + recettes */
  coefficientBP: number;
  tauxChargesPatronales?: number;
  tarifsVacataires?: TarifVacataire[];
}

// ─── Sites de pilotage (PilotageFinancier) ───────────────────────────

export interface PilotageFraiFix {
  id: string | number;
  nom: string;
  montant: number;
}

export interface PilotageSalarie {
  id: string | number;
  nom?: string;
  type: 'interne' | 'vacataire';
  salaireBrut?: number;
  tauxCharges?: number;
  heuresHebdo?: number;
  heuresHorsProduction?: number;
  ratioPreparation?: number;
  joursAbsence?: number;
  tauxHoraire?: number;
}

export interface PilotageSession {
  id: string | number;
  formateurId?: string | number;
  nbStagiaires?: number;
  prixStagiaire?: number;
  nbHeures?: number;
  fraisDeplacements?: number;
  fraisSupports?: number;
}

export interface PilotageSite {
  id: string;
  nom: string;
  fraisFixes: PilotageFraiFix[];
  heuresVendues: number;
  salaries: PilotageSalarie[];
  sessions: PilotageSession[];
}

// ─── Résultats de calcul ─────────────────────────────────────────────

export interface BudgetResult {
  masseSalariale: number;
  exploitation: number;
  investissements: number;
  total: number;
  recettes: number;
  solde: number;
  subventionRegion?: number;
}

export interface KpiGlobaux {
  totalRecettes: number;
  totalRecettesBase: number;
  totalCharges: number;
  soldeGlobal: number;
  soldeGlobalBase: number;
  stressImpact: number;
  hasDeficit: boolean;
  totalETP: number;
  totalEtudiants: number;
  tauxCouverture: number;
  coutParEtudiant: number;
  totalProvisions: number;
}

export interface Alerte {
  lvl: 'error' | 'warning' | 'info';
  msg: string;
}

// ─── Planning absences ───────────────────────────────────────────────

export type TypeAbsence = 'conge' | 'maladie' | 'formation' | 'autre';

export interface AbsenceEntry {
  agentId: string | number;
  type: TypeAbsence;
  debut: string;   // ISO date
  fin: string;     // ISO date
  commentaire?: string;
}

/** Clé : `${agentId}-${YYYY-MM}`, valeur : tableau d'absences */
export type PlanningAbsences = Record<string, AbsenceEntry[]>;

// ─── Reporting FC ────────────────────────────────────────────────────

export interface StagiaireFC {
  id: string | number;
  nom: string;
  prenom?: string;
  entreprise?: string;
  formation?: string;
  dateDebut?: string;
  dateFin?: string;
  heures?: number;
  cout?: number;
  opco?: string;
  statut?: string;
}

// ─── Enveloppe de formation ──────────────────────────────────────────

export interface ActionFormation {
  id: string | number;
  nom: string;
  cout: number;
  priorite?: 'haute' | 'moyenne' | 'basse';
  statut?: 'planifie' | 'en_cours' | 'realise' | 'annule';
}

export interface EnveloppeFormation {
  budget: number;
  actions: ActionFormation[];
}

// ─── Bénévoles ───────────────────────────────────────────────────────

export interface Benevole {
  id: string | number;
  nom: string;
  role?: string;
  heuresAnnuelles?: number;
}

// ─── Répartition temps ───────────────────────────────────────────────

/** Clé : agentId, valeur : objet { activite: pct } */
export type RepartitionTemps = Record<string | number, Record<string, number>>;
