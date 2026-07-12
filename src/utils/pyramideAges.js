// Pyramide des Âges & Ancienneté Moyenne — Axe 8 (Indicateurs Performance Sociale)
//
// Exploite les champs `anneeNaissance` et `dateEntree` déjà présents sur les agents
// (cf. calculerIFC, calculerProvisionsIDR) pour fournir une vision RH stratégique :
//
//   - Pyramide des âges en tranches de 5 ans (≤25 jusqu'à ≥60)
//   - Âge moyen, ancienneté moyenne et médiane par service
//   - Détection du risque de vieillissement (transmission savoir, IFC à provisionner)
//
// Aucune migration de schéma — agents sans anneeNaissance/dateEntree sont exclus
// du calcul (et comptabilisés comme "non renseignés").
//
// Niveaux sémantiques par service :
//   ✓ équilibré      : <25 % d'agents > 55 ans
//   ⚠ vieillissement : 25-30 % d'agents > 55 ans
//   ✕ risque         : >30 % d'agents > 55 ans (transmission urgente)
//   neutral          : aucun agent renseigné

const safe = (n) => (Number.isFinite(parseFloat(n)) ? parseFloat(n) : 0);

export const SEUIL_VIEILLISSEMENT_WARNING = 25; // % > 55 ans
export const SEUIL_VIEILLISSEMENT_DANGER  = 30; // % > 55 ans
export const AGE_SENIOR = 55;

/**
 * Tranches normalisées (bornes inclusives haute, exclusive sauf la dernière).
 * L'ordre est délibérément du plus jeune au plus âgé pour le rendu pyramide.
 */
export const TRANCHES_AGE = [
  { id: 't_under_25', label: '≤ 25 ans',  min: 0,  max: 25 },
  { id: 't_25_29',    label: '25-29 ans', min: 25, max: 30 },
  { id: 't_30_34',    label: '30-34 ans', min: 30, max: 35 },
  { id: 't_35_39',    label: '35-39 ans', min: 35, max: 40 },
  { id: 't_40_44',    label: '40-44 ans', min: 40, max: 45 },
  { id: 't_45_49',    label: '45-49 ans', min: 45, max: 50 },
  { id: 't_50_54',    label: '50-54 ans', min: 50, max: 55 },
  { id: 't_55_59',    label: '55-59 ans', min: 55, max: 60 },
  { id: 't_60_plus',  label: '≥ 60 ans',  min: 60, max: 200 },
];

const trancheDe = (age) => {
  for (const t of TRANCHES_AGE) {
    if (age >= t.min && age < t.max) return t.id;
  }
  return TRANCHES_AGE[TRANCHES_AGE.length - 1].id;
};

const median = (arr) => {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
};

const round1 = (n) => Math.round(n * 10) / 10;

/**
 * Calcule la pyramide des âges sur une liste d'agents.
 * Agents sans anneeNaissance valide sont exclus.
 *
 * @returns {{
 *   tranches: Array<{ id, label, nbAgents, etp, pctAgents, pctETP }>,
 *   nbAgentsRenseignes: number,
 *   nbAgentsNonRenseignes: number,
 *   etpRenseigne: number,
 * }}
 */
export const calculerPyramideAges = (personnels = [], anneeRef = new Date().getFullYear()) => {
  const init = TRANCHES_AGE.map(t => ({ ...t, nbAgents: 0, etp: 0, pctAgents: 0, pctETP: 0 }));
  let nbRenseignes = 0;
  let nbNonRenseignes = 0;
  let etpRenseigne = 0;

  (personnels || []).forEach(p => {
    if (!p) return;
    const annee = parseInt(p.anneeNaissance);
    if (!annee || annee <= 0) {
      nbNonRenseignes++;
      return;
    }
    const age = anneeRef - annee;
    if (age < 0 || age > 100) {
      nbNonRenseignes++;
      return;
    }
    const etp = safe(p.etp) || 1;
    const trId = trancheDe(age);
    const tr = init.find(x => x.id === trId);
    if (tr) {
      tr.nbAgents += 1;
      tr.etp += etp;
    }
    nbRenseignes += 1;
    etpRenseigne += etp;
  });

  init.forEach(t => {
    t.pctAgents = nbRenseignes > 0 ? round1((t.nbAgents / nbRenseignes) * 100) : 0;
    t.pctETP    = etpRenseigne > 0 ? round1((t.etp / etpRenseigne) * 100) : 0;
    t.etp       = Math.round(t.etp * 100) / 100;
  });

  return {
    tranches: init,
    nbAgentsRenseignes: nbRenseignes,
    nbAgentsNonRenseignes: nbNonRenseignes,
    etpRenseigne: Math.round(etpRenseigne * 100) / 100,
  };
};

/**
 * Calcule les statistiques d'âge et d'ancienneté.
 * Les agents sans donnée sont exclus.
 */
export const calculerAncienneteMoyenne = (personnels = [], anneeRef = new Date().getFullYear()) => {
  const ages = [];
  const anciennetes = [];
  let nbAgeNonRenseigne = 0;
  let nbAncNonRenseigne = 0;

  (personnels || []).forEach(p => {
    if (!p) return;
    const annee = parseInt(p.anneeNaissance);
    if (annee && annee > 0) {
      const age = anneeRef - annee;
      if (age >= 0 && age <= 100) ages.push(age);
      else nbAgeNonRenseigne++;
    } else nbAgeNonRenseigne++;

    const dateEntree = parseInt(p.dateEntree);
    if (dateEntree && dateEntree > 0) {
      const anc = Math.max(0, anneeRef - dateEntree);
      anciennetes.push(anc);
    } else nbAncNonRenseigne++;
  });

  const ageMoyen      = ages.length        > 0 ? round1(ages.reduce((s, a) => s + a, 0) / ages.length) : 0;
  const ageMedian     = ages.length        > 0 ? round1(median(ages)) : 0;
  const ancMoyenne    = anciennetes.length > 0 ? round1(anciennetes.reduce((s, a) => s + a, 0) / anciennetes.length) : 0;
  const ancMediane    = anciennetes.length > 0 ? round1(median(anciennetes)) : 0;
  const nbSeniors     = ages.filter(a => a >= AGE_SENIOR).length;
  const pctSeniors    = ages.length > 0 ? round1((nbSeniors / ages.length) * 100) : 0;

  return {
    ageMoyen, ageMedian, ancMoyenne, ancMediane,
    nbSeniors, pctSeniors,
    nbAgents: (personnels || []).length,
    nbAgeRenseigne: ages.length,
    nbAncRenseigne: anciennetes.length,
    nbAgeNonRenseigne, nbAncNonRenseigne,
  };
};

const niveauVieillissement = (pctSeniors, nbAgeRenseigne, seuils) => {
  if (nbAgeRenseigne === 0) return 'neutral';
  if (pctSeniors > seuils.danger)  return 'danger';
  if (pctSeniors >= seuils.warning) return 'warning';
  return 'success';
};

/**
 * Agrège les indicateurs RH par entité (Direction, Pôle Support, chaque service)
 * + une ligne consolidée.
 *
 * @param {object} direction
 * @param {Array}  services
 * @param {object} poleSupport
 * @param {number} anneeRef
 * @param {object} options — peut surcharger seuilVieillissementWarning / seuilVieillissementDanger via globalParams
 * @returns {{
 *   parEntite: Array<{ id, nom, type, ...stats, niveau }>,
 *   pyramideConsolidee: ReturnType<typeof calculerPyramideAges>,
 *   totaux: { nbAgents, nbAgeRenseigne, nbAncRenseigne, ageMoyen, ancMoyenne, pctSeniors, niveau, nbServicesEnAlerte, nbServicesEnRisque },
 *   seuils: { warning, danger },
 * }}
 */
export const calculerIndicateursRH = (
  direction,
  services = [],
  poleSupport,
  anneeRef = new Date().getFullYear(),
  options = {}
) => {
  const seuils = {
    warning: safe(options?.seuilVieillissementWarning) || SEUIL_VIEILLISSEMENT_WARNING,
    danger:  safe(options?.seuilVieillissementDanger)  || SEUIL_VIEILLISSEMENT_DANGER,
  };
  if (seuils.danger < seuils.warning) seuils.danger = seuils.warning;

  const buildEntry = (id, nom, type, personnels) => {
    const stats = calculerAncienneteMoyenne(personnels, anneeRef);
    const pyramide = calculerPyramideAges(personnels, anneeRef);
    const niveau = niveauVieillissement(stats.pctSeniors, stats.nbAgeRenseigne, seuils);
    return { id, nom, type, ...stats, pyramide, niveau };
  };

  const parEntite = [];
  if (direction?.personnel?.length) {
    parEntite.push(buildEntry('direction', 'Direction / Siège', 'direction', direction.personnel));
  }
  if (poleSupport?.personnel?.length) {
    parEntite.push(buildEntry('poleSupport', 'Pôle Ressources', 'poleSupport', poleSupport.personnel));
  }
  (services || []).forEach(s => {
    if (!s || !s.id) return;
    parEntite.push(buildEntry(s.id, s.nom || 'Service', 'service', s.personnel || []));
  });

  // Consolidé
  const tousAgents = [
    ...(direction?.personnel || []),
    ...(poleSupport?.personnel || []),
    ...(services || []).flatMap(s => s.personnel || []),
  ];
  const statsConso = calculerAncienneteMoyenne(tousAgents, anneeRef);
  const pyramideConsolidee = calculerPyramideAges(tousAgents, anneeRef);
  const niveauConso = niveauVieillissement(statsConso.pctSeniors, statsConso.nbAgeRenseigne, seuils);

  // Tri : services en risque/alerte d'abord, puis pctSeniors décroissant
  parEntite.sort((a, b) => {
    const order = { danger: 0, warning: 1, success: 2, neutral: 3 };
    if (order[a.niveau] !== order[b.niveau]) return order[a.niveau] - order[b.niveau];
    return b.pctSeniors - a.pctSeniors;
  });

  const nbServicesEnRisque = parEntite.filter(e => e.niveau === 'danger').length;
  const nbServicesEnAlerte = parEntite.filter(e => e.niveau === 'warning').length;

  return {
    parEntite,
    pyramideConsolidee,
    totaux: {
      ...statsConso,
      niveau: niveauConso,
      nbServicesEnAlerte,
      nbServicesEnRisque,
    },
    seuils,
  };
};

/**
 * Recommandation contextuelle DAF par niveau.
 */
export const recommendationRH = (niveau, pctSeniors, ageMoyen, ancMoyenne, nbAgeRenseigne) => {
  if (nbAgeRenseigne === 0) {
    return 'Aucune donnée — saisir l\'année de naissance dans les fiches agents pour activer la pyramide des âges.';
  }
  if (niveau === 'success') {
    return `✓ Équilibre démographique sain — ${pctSeniors.toFixed(1)} % de seniors (>${AGE_SENIOR} ans), âge moyen ${ageMoyen.toFixed(1)} ans, ancienneté moyenne ${ancMoyenne.toFixed(1)} ans. Renouvellement maîtrisé.`;
  }
  if (niveau === 'warning') {
    return `⚠ Vieillissement — ${pctSeniors.toFixed(1)} % de seniors. Anticiper les départs en retraite (provision IFC, plan de transmission, recrutement junior). Coordonner avec le module Provision IDR.`;
  }
  if (niveau === 'danger') {
    return `✕ Risque démographique élevé — ${pctSeniors.toFixed(1)} % de seniors, ancienneté moyenne ${ancMoyenne.toFixed(1)} ans. Risques : vague IFC concentrée, perte de savoir-faire critique. Action : plan GPEC urgent + tutorat + recrutement structurel.`;
  }
  return 'Données insuffisantes pour évaluer le niveau de risque démographique.';
};
