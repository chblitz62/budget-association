// DUER — Document Unique d'Évaluation des Risques professionnels — Axe 8
//
// Obligation légale (Code travail art. L.4121-3 et R.4121-1 à R.4121-4) pour
// **tout employeur dès le 1er salarié**. Mise à jour annuelle obligatoire,
// ou à chaque modification importante des conditions de travail, ou lors
// d'un accident du travail.
//
// Sanction pénale en cas d'absence : amende 5e classe (1 500 € par UT manquante,
// 3 000 € en récidive). Engage la responsabilité civile et pénale du dirigeant
// en cas d'AT/MP grave (faute inexcusable de l'employeur — art. L.452-1 CSS).
//
// Méthode INRS — Évaluation des risques par "Unité de Travail" (UT) :
//   1) Inventaire des situations dangereuses par UT
//   2) Cotation Probabilité (P) × Gravité (G) — matrice 5×5
//   3) Maîtrise actuelle (mesures de prévention déjà en place)
//   4) Plan d'action de prévention (mesure, responsable, échéance, statut)
//
// Modèle de données (persistance via `globalParams.duer`) :
//   {
//     dateMAJ: 'YYYY-MM-DD' | null,
//     exercice: number,
//     risques: [{
//       id, uniteId, uniteNom, categorie, libelle, sourceDanger,
//       probabilite (1-5), gravite (1-5), maitrise,
//       plansAction: [{ id, mesure, responsable, echeance, statut, cout }]
//     }]
//   }

const safe = (n) => (Number.isFinite(parseFloat(n)) ? parseFloat(n) : 0);
const round1 = (n) => Math.round((n || 0) * 10) / 10;

// ─── Référentiel — Catégories INRS ────────────────────────────────────
export const CATEGORIES_RISQUES = [
  { code: 'physique',       libelle: 'Risques physiques (chutes, bruit, vibrations, électricité)' },
  { code: 'psychosocial',   libelle: 'Risques psychosociaux (stress, harcèlement, surcharge)' },
  { code: 'ergonomique',    libelle: 'Risques ergonomiques (TMS, postures, manutention)' },
  { code: 'biologique',     libelle: 'Risques biologiques (infections, contamination)' },
  { code: 'chimique',       libelle: 'Risques chimiques (produits, poussières, solvants)' },
  { code: 'organisationnel',libelle: 'Risques organisationnels (horaires atypiques, isolement)' },
  { code: 'routier',        libelle: 'Risques routiers (trajets, missions extérieures)' },
  { code: 'incendie',       libelle: "Risques incendie / explosion" },
];
export const CODES_CATEGORIES = CATEGORIES_RISQUES.map(c => c.code);

export const STATUTS_PLAN = ['a-faire', 'en-cours', 'fait'];
const STATUT_LIBELLES = { 'a-faire': 'À faire', 'en-cours': 'En cours', 'fait': 'Fait' };
export const libelleStatutPlan = (s) => STATUT_LIBELLES[s] || s;

// ─── Matrice criticité 5×5 (méthode INRS) ─────────────────────────────
//   1-5  = faible    (success)
//   6-12 = modéré    (warning)
//   13-19 = élevé    (danger)
//   20-25 = critique (danger fort)
export const niveauCriticite = (score) => {
  const s = Math.max(0, Math.min(25, safe(score)));
  if (s <= 0)  return 'neutre';
  if (s <= 5)  return 'faible';
  if (s <= 12) return 'modere';
  if (s <= 19) return 'eleve';
  return 'critique';
};

export const niveauToVariant = (n) => {
  if (n === 'faible')   return 'success';
  if (n === 'modere')   return 'warning';
  if (n === 'eleve')    return 'danger';
  if (n === 'critique') return 'danger';
  return 'neutral';
};

const calculerScoreRisque = (probabilite, gravite) => {
  const p = Math.max(0, Math.min(5, safe(probabilite)));
  const g = Math.max(0, Math.min(5, safe(gravite)));
  return p * g;
};

/**
 * Calcule l'âge en mois d'une date ISO 'YYYY-MM-DD' à partir d'une date
 * de référence (par défaut now). Retourne null si dateISO invalide.
 */
const ageEnMois = (dateISO, refDate = new Date()) => {
  if (!dateISO || typeof dateISO !== 'string') return null;
  const d = new Date(dateISO + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return null;
  const diffMs = refDate.getTime() - d.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.4375));
};

const estPlanEnRetard = (plan, refDate = new Date()) => {
  if (!plan || plan.statut === 'fait') return false;
  if (!plan.echeance) return false;
  const ech = new Date(plan.echeance + 'T00:00:00');
  if (Number.isNaN(ech.getTime())) return false;
  return ech.getTime() < refDate.getTime();
};

/**
 * Évalue un risque unitaire enrichi de son score, niveau et plan d'action.
 */
const evaluerRisque = (r, refDate = new Date()) => {
  const probabilite = Math.max(0, Math.min(5, safe(r.probabilite)));
  const gravite = Math.max(0, Math.min(5, safe(r.gravite)));
  const score = calculerScoreRisque(probabilite, gravite);
  const niveau = niveauCriticite(score);
  const plansAction = Array.isArray(r.plansAction) ? r.plansAction : [];
  const plansEnRetard = plansAction.filter(p => estPlanEnRetard(p, refDate));
  const plansOuverts = plansAction.filter(p => p && p.statut !== 'fait');
  const sansPlan = plansAction.length === 0;
  const coutTotalPlans = plansAction.reduce((s, p) => s + safe(p?.cout), 0);
  return {
    id: r.id,
    uniteId: r.uniteId || 'siege',
    uniteNom: r.uniteNom || r.uniteId || 'Siège',
    categorie: r.categorie || 'physique',
    libelle: r.libelle || '(risque sans libellé)',
    sourceDanger: r.sourceDanger || '',
    probabilite,
    gravite,
    score,
    niveau,
    variant: niveauToVariant(niveau),
    maitrise: r.maitrise || '',
    plansAction,
    nbPlans: plansAction.length,
    nbPlansOuverts: plansOuverts.length,
    nbPlansEnRetard: plansEnRetard.length,
    coutTotalPlans,
    sansPlan,
    alertePlanCritique: (niveau === 'eleve' || niveau === 'critique') && sansPlan,
  };
};

/**
 * Construit la liste exhaustive des unités de travail à partir des
 * structures projet (services + pôle support + siège). Permet de
 * détecter les unités sans risque évalué.
 */
const construireUnitesTravail = (services, poleSupport, direction) => {
  const liste = [];
  if (direction) liste.push({ id: 'siege', nom: 'Siège (Direction)' });
  if (poleSupport) liste.push({ id: 'pole-support', nom: poleSupport.nom || 'Pôle Support' });
  (services || []).filter(s => s && s.id).forEach(s => {
    liste.push({ id: s.id, nom: s.nom || `Service ${s.id}` });
  });
  return liste;
};

/**
 * Génère le rapport DUER complet.
 *
 * @param {object} options
 * @param {Array}  options.services
 * @param {object} options.poleSupport
 * @param {object} options.direction
 * @param {object} options.globalParams — contient `duer.{dateMAJ, risques, exercice}`
 * @param {Date}   options.refDate — date de référence (test seulement)
 */
export const calculerDUER = ({ services = [], poleSupport = null, direction = null, globalParams = {}, refDate = new Date() } = {}) => {
  const duer = globalParams.duer || {};
  const risquesBruts = Array.isArray(duer.risques) ? duer.risques : [];
  const dateMAJ = duer.dateMAJ || null;
  const exercice = duer.exercice || refDate.getFullYear();

  // Évaluation enrichie de chaque risque
  const risques = risquesBruts.map(r => evaluerRisque(r, refDate));

  // Tri : criticité décroissante puis nom unité
  risques.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.uniteNom.localeCompare(b.uniteNom, 'fr');
  });

  // ─── Agrégations ──────────────────────────────────────────────────
  const parCategorie = {};
  CODES_CATEGORIES.forEach(c => { parCategorie[c] = { code: c, nb: 0, scoreCumul: 0 }; });
  const parNiveau = { faible: 0, modere: 0, eleve: 0, critique: 0 };
  const uniteIdsAvecRisque = new Set();

  risques.forEach(r => {
    if (parCategorie[r.categorie]) {
      parCategorie[r.categorie].nb += 1;
      parCategorie[r.categorie].scoreCumul += r.score;
    }
    if (parNiveau[r.niveau] !== undefined) parNiveau[r.niveau] += 1;
    uniteIdsAvecRisque.add(r.uniteId);
  });

  const unitesProjet = construireUnitesTravail(services, poleSupport, direction);
  const unitesEvaluees = unitesProjet.filter(u => uniteIdsAvecRisque.has(u.id));
  const unitesNonEvaluees = unitesProjet.filter(u => !uniteIdsAvecRisque.has(u.id));
  const couverture = unitesProjet.length > 0
    ? round1((unitesEvaluees.length / unitesProjet.length) * 100)
    : 0;

  const totalRisques = risques.length;
  const scoreCumul = risques.reduce((s, r) => s + r.score, 0);
  const criticiteMoyenne = totalRisques > 0 ? round1(scoreCumul / totalRisques) : 0;
  const nbCritiques = parNiveau.critique;
  const nbEleves = parNiveau.eleve;

  // ─── Plans d'action — agrégat ─────────────────────────────────────
  const tousPlans = risques.flatMap(r => (r.plansAction || []).map(p => ({ ...p, risqueId: r.id, risqueLibelle: r.libelle, uniteNom: r.uniteNom })));
  const planParStatut = { 'a-faire': 0, 'en-cours': 0, 'fait': 0 };
  let nbPlansEnRetard = 0;
  let coutTotalPlans = 0;
  tousPlans.forEach(p => {
    if (planParStatut[p.statut] !== undefined) planParStatut[p.statut] += 1;
    if (estPlanEnRetard(p, refDate)) nbPlansEnRetard += 1;
    coutTotalPlans += safe(p.cout);
  });
  const plansEnRetard = tousPlans.filter(p => estPlanEnRetard(p, refDate));

  // Risques élevés/critiques sans plan d'action
  const risquesPrioritairesSansPlan = risques.filter(r => r.alertePlanCritique);

  // ─── État de la mise à jour ───────────────────────────────────────
  const ageMoisMAJ = ageEnMois(dateMAJ, refDate);
  // MAJ obsolète si > 12 mois OU jamais
  const mAJObsolete = ageMoisMAJ === null ? true : ageMoisMAJ > 12;
  const mAJUrgente = ageMoisMAJ === null ? true : ageMoisMAJ > 18;

  // ─── Alertes ──────────────────────────────────────────────────────
  const alertes = [];
  if (mAJUrgente) {
    alertes.push({
      niveau: 'danger',
      message: ageMoisMAJ === null
        ? `DUER jamais mis à jour — obligation Code travail art. R.4121-2 (mise à jour annuelle). Risque pénal direct (amende 5e classe).`
        : `DUER non mis à jour depuis ${ageMoisMAJ} mois — gravement obsolète (>18 mois). Faute inexcusable engagée en cas d'AT/MP.`,
    });
  } else if (mAJObsolete) {
    alertes.push({
      niveau: 'warning',
      message: `DUER mis à jour il y a ${ageMoisMAJ} mois — au-delà du délai annuel obligatoire. Programmer la révision.`,
    });
  }
  if (nbPlansEnRetard > 0) {
    alertes.push({
      niveau: 'danger',
      message: `${nbPlansEnRetard} plan${nbPlansEnRetard > 1 ? 's' : ''} d'action en retard d'échéance — opposable en inspection du travail.`,
    });
  }
  if (risquesPrioritairesSansPlan.length > 0) {
    alertes.push({
      niveau: 'danger',
      message: `${risquesPrioritairesSansPlan.length} risque${risquesPrioritairesSansPlan.length > 1 ? 's' : ''} prioritaire${risquesPrioritairesSansPlan.length > 1 ? 's' : ''} (élevé/critique) sans plan d'action de prévention défini.`,
    });
  }
  if (unitesNonEvaluees.length > 0) {
    alertes.push({
      niveau: 'warning',
      message: `${unitesNonEvaluees.length} unité${unitesNonEvaluees.length > 1 ? 's' : ''} de travail sans aucun risque évalué : ${unitesNonEvaluees.slice(0, 3).map(u => u.nom).join(', ')}${unitesNonEvaluees.length > 3 ? '…' : ''}.`,
    });
  }
  if (totalRisques === 0) {
    alertes.push({
      niveau: 'warning',
      message: `Aucun risque évalué — le DUER doit recenser les situations dangereuses par unité de travail (méthode INRS).`,
    });
  }

  // ─── Niveau global ────────────────────────────────────────────────
  // Critique : MAJ urgente, ou plans en retard, ou risques prioritaires sans plan
  // Warning : MAJ obsolète OU unités non couvertes OU risques élevés
  // Success : tout OK
  let niveauGlobal = 'success';
  if (mAJUrgente || nbPlansEnRetard > 0 || risquesPrioritairesSansPlan.length > 0 || nbCritiques > 0) {
    niveauGlobal = 'danger';
  } else if (mAJObsolete || unitesNonEvaluees.length > 0 || nbEleves > 0) {
    niveauGlobal = 'warning';
  } else if (totalRisques === 0) {
    niveauGlobal = 'warning';
  }

  return {
    dateMAJ,
    ageMoisMAJ,
    mAJObsolete,
    mAJUrgente,
    exercice,
    risques,
    parCategorie,
    parNiveau,
    totalRisques,
    criticiteMoyenne,
    nbCritiques,
    nbEleves,
    unitesProjet,
    unitesEvaluees,
    unitesNonEvaluees,
    couverture,
    plansAction: {
      tous: tousPlans,
      parStatut: planParStatut,
      nbEnRetard: nbPlansEnRetard,
      enRetard: plansEnRetard,
      coutTotal: coutTotalPlans,
    },
    risquesPrioritairesSansPlan,
    alertes,
    niveauGlobal,
  };
};

/**
 * Recommandation contextuelle DAF / Référent prévention selon l'état du DUER.
 */
export const recommendationDUER = (rapport) => {
  if (!rapport) return '';
  if (rapport.mAJUrgente) {
    return `✕ DUER gravement obsolète — programmer une révision urgente avec le référent prévention. Risque pénal direct (art. R.4121-2) et faute inexcusable engagée en cas d'AT/MP.`;
  }
  if (rapport.plansAction.nbEnRetard > 0) {
    return `✕ ${rapport.plansAction.nbEnRetard} plan${rapport.plansAction.nbEnRetard > 1 ? 's' : ''} d'action en retard. Réunion CSE/Préventeur à programmer pour relancer les mesures et documenter les écarts.`;
  }
  if (rapport.risquesPrioritairesSansPlan.length > 0) {
    return `✕ ${rapport.risquesPrioritairesSansPlan.length} risque${rapport.risquesPrioritairesSansPlan.length > 1 ? 's' : ''} prioritaire${rapport.risquesPrioritairesSansPlan.length > 1 ? 's' : ''} sans plan d'action — opposable en inspection du travail.`;
  }
  if (rapport.nbCritiques > 0) {
    return `⚠ ${rapport.nbCritiques} risque${rapport.nbCritiques > 1 ? 's' : ''} de criticité maximale (P×G ≥ 20). Vérifier que les mesures de maîtrise sont efficaces et documentées.`;
  }
  if (rapport.mAJObsolete) {
    return `⚠ DUER au-delà du délai annuel — programmer la révision dans le trimestre.`;
  }
  if (rapport.unitesNonEvaluees.length > 0) {
    return `⚠ Couverture partielle (${rapport.couverture} % des unités de travail). Compléter l'évaluation pour les unités manquantes.`;
  }
  if (rapport.totalRisques === 0) {
    return `⚠ DUER vide — démarrer l'inventaire des risques par unité de travail (méthode INRS).`;
  }
  return `✓ DUER à jour — couverture ${rapport.couverture} %, ${rapport.totalRisques} risque${rapport.totalRisques > 1 ? 's' : ''} évalué${rapport.totalRisques > 1 ? 's' : ''}, criticité moyenne ${rapport.criticiteMoyenne}. Maintenir la mise à jour annuelle (R.4121-2).`;
};

/**
 * Génère un nouveau risque vierge (pour CRUD UI).
 */
export const newRisque = (uniteId = 'siege', uniteNom = 'Siège') => ({
  id: 'r-' + Math.random().toString(36).slice(2, 9),
  uniteId,
  uniteNom,
  categorie: 'physique',
  libelle: '',
  sourceDanger: '',
  probabilite: 1,
  gravite: 1,
  maitrise: '',
  plansAction: [],
});

export const newPlanAction = () => ({
  id: 'pa-' + Math.random().toString(36).slice(2, 9),
  mesure: '',
  responsable: '',
  echeance: '',
  statut: 'a-faire',
  cout: 0,
});

export const libelleCategorie = (code) =>
  CATEGORIES_RISQUES.find(c => c.code === code)?.libelle || code;

export const libelleNiveau = (n) => ({
  faible: 'Faible',
  modere: 'Modéré',
  eleve: 'Élevé',
  critique: 'Critique',
  neutre: '—',
}[n] || n);
