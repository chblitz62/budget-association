// Parité H/F & Turn-over — Axe 8 (Indicateurs Performance Sociale)
//
// Exploite les champs `genre` ('H'|'F'|''), `dateEntree` et `dateSortie` (année,
// 0 = en activité) saisis sur les agents. Les agents non renseignés sont exclus
// du calcul mais comptés dans `nbNonRenseignes` pour signaler l'incomplétude.
//
// Indicateurs :
//   - Parité : décompte H/F + ETP H/F + écart à 50/50 + index simplifié
//   - Turn-over : taux de sorties = nb sorties N / effectif moyen N (norme INSEE simplifiée)
//                 taux d'entrées = nb entrées N / effectif moyen N
//                 turn-over global = (entrées + sorties) / 2 / effectif moyen
//
// Niveaux parité (% du genre minoritaire sur le total renseigné) :
//   ✓ équilibré      ≥ 45 %
//   ⚠ déséquilibré   30-45 %
//   ✕ très déséquilibré < 30 %
//   neutral          < 3 agents renseignés (échantillon trop petit)
//
// Niveaux turn-over (norme APEC 2024) :
//   ✓ stable         < 10 %
//   ⚠ vigilance      10-15 %
//   ✕ critique       > 15 %  (perte de savoir, coûts de recrutement)

const safe = (n) => (Number.isFinite(parseFloat(n)) ? parseFloat(n) : 0);
const round1 = (n) => Math.round(n * 10) / 10;

export const SEUIL_PARITE_EQUILIBRE  = 45; // % du genre minoritaire
export const SEUIL_PARITE_DESEQUILIBRE = 30;
export const SEUIL_TURNOVER_WARNING = 10; // %
export const SEUIL_TURNOVER_DANGER  = 15;
export const ECHANTILLON_MIN_PARITE = 3;

/**
 * Présent au 31/12 de anneeRef : entré ≤ anneeRef ET (jamais sorti OU sorti après anneeRef).
 * Photo "effectif fin d'année" — un agent sortant en cours d'année n'est plus compté.
 */
const presentFinAnnee = (agent, anneeRef) => {
  const entree = parseInt(agent?.dateEntree) || 0;
  const sortie = parseInt(agent?.dateSortie) || 0;
  if (entree > anneeRef) return false;
  if (sortie > 0 && sortie <= anneeRef) return false;
  return true;
};

/**
 * Compté dans l'effectif moyen / parité de l'année : présent à un moment dans anneeRef.
 *   - entré ≤ anneeRef ET (jamais sorti OU sorti durant ou après anneeRef)
 */
const estActifSurAnnee = (agent, anneeRef) => {
  const entree = parseInt(agent?.dateEntree) || 0;
  const sortie = parseInt(agent?.dateSortie) || 0;
  if (entree > anneeRef) return false;
  if (sortie > 0 && sortie < anneeRef) return false;
  return true;
};

/**
 * Décompte parité sur une liste d'agents.
 * Filtrage : agents actifs sur anneeRef et avec genre renseigné.
 *
 * @param {object} seuils — { equilibre, desequilibre } pour override des paliers
 */
export const calculerPariteHF = (personnels = [], anneeRef = new Date().getFullYear(), seuils = null) => {
  const sEq    = safe(seuils?.equilibre)    || SEUIL_PARITE_EQUILIBRE;
  const sDeseq = safe(seuils?.desequilibre) || SEUIL_PARITE_DESEQUILIBRE;
  let nbH = 0, nbF = 0, etpH = 0, etpF = 0, nbNonRenseigne = 0;

  (personnels || []).forEach(p => {
    if (!p) return;
    if (!estActifSurAnnee(p, anneeRef)) return;
    const etp = safe(p.etp) || 1;
    const g = (p.genre || '').toUpperCase();
    if (g === 'H') { nbH += 1; etpH += etp; }
    else if (g === 'F') { nbF += 1; etpF += etp; }
    else { nbNonRenseigne += 1; }
  });

  const nbRenseignes = nbH + nbF;
  const etpRenseigne = etpH + etpF;
  const pctH = nbRenseignes > 0 ? round1((nbH / nbRenseignes) * 100) : 0;
  const pctF = nbRenseignes > 0 ? round1((nbF / nbRenseignes) * 100) : 0;
  const pctEtpH = etpRenseigne > 0 ? round1((etpH / etpRenseigne) * 100) : 0;
  const pctEtpF = etpRenseigne > 0 ? round1((etpF / etpRenseigne) * 100) : 0;

  // Index simplifié : % du genre minoritaire (50 = parité parfaite, 0 = monosexe)
  const indexParite = nbRenseignes > 0 ? Math.min(pctH, pctF) : 0;

  let niveau = 'neutral';
  if (nbRenseignes >= ECHANTILLON_MIN_PARITE) {
    if (indexParite >= sEq) niveau = 'success';
    else if (indexParite >= sDeseq) niveau = 'warning';
    else niveau = 'danger';
  }

  return {
    nbH, nbF, nbNonRenseigne,
    nbRenseignes,
    etpH: Math.round(etpH * 100) / 100,
    etpF: Math.round(etpF * 100) / 100,
    etpRenseigne: Math.round(etpRenseigne * 100) / 100,
    pctH, pctF, pctEtpH, pctEtpF,
    indexParite: round1(indexParite),
    genreMajoritaire: nbH > nbF ? 'H' : nbF > nbH ? 'F' : null,
    niveau,
  };
};

/**
 * Turn-over sur une liste d'agents pour une année donnée.
 *
 * Définitions (norme INSEE / APEC simplifiée) :
 *   effectifDebut  = agents actifs au 31/12/N-1 (entrée ≤ N-1 et pas sortis avant N)
 *   effectifFin    = agents actifs au 31/12/N
 *   effectifMoyen  = (debut + fin) / 2
 *   entrees N      = agents avec dateEntree === anneeRef
 *   sorties N      = agents avec dateSortie === anneeRef
 *   tauxEntree     = entrees / effectifMoyen × 100
 *   tauxSortie     = sorties / effectifMoyen × 100
 *   turnOver       = (entrees + sorties) / 2 / effectifMoyen × 100
 */
export const calculerTurnOver = (personnels = [], anneeRef = new Date().getFullYear(), seuils = null) => {
  const sWarn = safe(seuils?.warning) || SEUIL_TURNOVER_WARNING;
  const sDang = safe(seuils?.danger)  || SEUIL_TURNOVER_DANGER;

  let entrees = 0, sorties = 0;
  let effectifDebut = 0, effectifFin = 0;
  let nbDateEntreeRenseignee = 0, nbDateSortieRenseignee = 0;

  (personnels || []).forEach(p => {
    if (!p) return;
    const entree = parseInt(p.dateEntree) || 0;
    const sortie = parseInt(p.dateSortie) || 0;

    if (entree > 0) nbDateEntreeRenseignee += 1;
    if (sortie > 0) nbDateSortieRenseignee += 1;

    // Effectif au 31/12/N (un sortant durant N n'est plus là)
    if (presentFinAnnee(p, anneeRef)) effectifFin += 1;
    // Effectif au 31/12/N-1 (début N)
    if (presentFinAnnee(p, anneeRef - 1)) effectifDebut += 1;

    if (entree === anneeRef) entrees += 1;
    if (sortie === anneeRef) sorties += 1;
  });

  const effectifMoyen = (effectifDebut + effectifFin) / 2;
  const tauxEntree   = effectifMoyen > 0 ? round1((entrees / effectifMoyen) * 100) : 0;
  const tauxSortie   = effectifMoyen > 0 ? round1((sorties / effectifMoyen) * 100) : 0;
  const turnOver     = effectifMoyen > 0 ? round1(((entrees + sorties) / 2 / effectifMoyen) * 100) : 0;

  let niveau = 'neutral';
  if (effectifMoyen >= 1 && (nbDateEntreeRenseignee > 0 || nbDateSortieRenseignee > 0)) {
    if (turnOver > sDang) niveau = 'danger';
    else if (turnOver >= sWarn) niveau = 'warning';
    else niveau = 'success';
  }

  return {
    entrees, sorties,
    effectifDebut, effectifFin,
    effectifMoyen: Math.round(effectifMoyen * 10) / 10,
    tauxEntree, tauxSortie, turnOver,
    nbDateEntreeRenseignee, nbDateSortieRenseignee,
    niveau,
  };
};

/**
 * Agrège parité + turn-over par entité (Direction / Pôle / chaque service)
 * + ligne consolidée. Pool RH peut être inclus en flat list séparée.
 *
 * @param {object} direction
 * @param {Array}  services
 * @param {object} poleSupport
 * @param {Array}  poolRH       — agents Pool RH (optionnel, traités comme entité distincte)
 * @param {number} anneeRef
 * @param {object} options      — surcharge éventuelle des seuils
 */
export const calculerIndicateursPariteTurnOver = (
  direction,
  services = [],
  poleSupport,
  poolRH = [],
  anneeRef = new Date().getFullYear(),
  options = {}
) => {
  const seuilsParite = {
    equilibre:    safe(options?.seuilPariteEquilibre)    || SEUIL_PARITE_EQUILIBRE,
    desequilibre: safe(options?.seuilPariteDesequilibre) || SEUIL_PARITE_DESEQUILIBRE,
  };
  if (seuilsParite.desequilibre > seuilsParite.equilibre) {
    seuilsParite.desequilibre = seuilsParite.equilibre;
  }
  const seuilsTurnOver = {
    warning: safe(options?.seuilTurnOverWarning) || SEUIL_TURNOVER_WARNING,
    danger:  safe(options?.seuilTurnOverDanger)  || SEUIL_TURNOVER_DANGER,
  };
  if (seuilsTurnOver.danger < seuilsTurnOver.warning) {
    seuilsTurnOver.danger = seuilsTurnOver.warning;
  }

  const buildEntry = (id, nom, type, personnels) => ({
    id, nom, type,
    parite:  calculerPariteHF(personnels, anneeRef, seuilsParite),
    turnOver: calculerTurnOver(personnels, anneeRef, seuilsTurnOver),
    nbAgents: (personnels || []).length,
  });

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
  if (poolRH?.length) {
    parEntite.push(buildEntry('poolRH', 'Pool RH (mutualisé)', 'pool', poolRH));
  }

  // Consolidé
  const tousAgents = [
    ...(direction?.personnel || []),
    ...(poleSupport?.personnel || []),
    ...(services || []).flatMap(s => s.personnel || []),
    ...(poolRH || []),
  ];
  const pariteConsolidee  = calculerPariteHF(tousAgents, anneeRef, seuilsParite);
  const turnOverConsolide = calculerTurnOver(tousAgents, anneeRef, seuilsTurnOver);

  // Tri : services en alerte d'abord (turn-over critique), puis index parité décroissant
  parEntite.sort((a, b) => {
    const order = { danger: 0, warning: 1, success: 2, neutral: 3 };
    if (order[a.turnOver.niveau] !== order[b.turnOver.niveau]) {
      return order[a.turnOver.niveau] - order[b.turnOver.niveau];
    }
    return b.parite.indexParite - a.parite.indexParite;
  });

  const nbServicesParitéDanger    = parEntite.filter(e => e.parite.niveau    === 'danger').length;
  const nbServicesTurnOverDanger  = parEntite.filter(e => e.turnOver.niveau  === 'danger').length;
  const nbServicesTurnOverAlerte  = parEntite.filter(e => e.turnOver.niveau  === 'warning').length;

  return {
    parEntite,
    pariteConsolidee,
    turnOverConsolide,
    totaux: {
      nbAgents: tousAgents.length,
      nbServicesParitéDanger,
      nbServicesTurnOverDanger,
      nbServicesTurnOverAlerte,
    },
    seuilsParite, seuilsTurnOver,
  };
};

/**
 * Recommandation contextuelle DAF — Parité.
 */
export const recommendationParite = (niveau, indexParite, genreMajoritaire, nbRenseignes) => {
  if (niveau === 'neutral' || nbRenseignes < ECHANTILLON_MIN_PARITE) {
    return `Donnée insuffisante (${nbRenseignes} agent${nbRenseignes > 1 ? 's' : ''} renseigné${nbRenseignes > 1 ? 's' : ''}). Saisir le genre dans les fiches agents pour activer l'indicateur.`;
  }
  if (niveau === 'success') {
    return `✓ Parité respectée — index ${indexParite.toFixed(1)} % (genre minoritaire). Conformité aux obligations index Pénicaud / loi Rixain.`;
  }
  if (niveau === 'warning') {
    const maj = genreMajoritaire === 'H' ? 'masculine' : 'féminine';
    return `⚠ Déséquilibre ${maj} — index ${indexParite.toFixed(1)} %. Vérifier la chaîne de recrutement (offres genrées, jurys mixtes) et les promotions internes.`;
  }
  if (niveau === 'danger') {
    const maj = genreMajoritaire === 'H' ? 'masculine' : 'féminine';
    return `✕ Très déséquilibré — index ${indexParite.toFixed(1)} %, prédominance ${maj} marquée. Risque de non-conformité aux quotas légaux (loi Rixain 30 % cadres dirigeants 2027). Plan d'action obligatoire.`;
  }
  return '';
};

/**
 * Recommandation contextuelle DAF — Turn-over.
 */
export const recommendationTurnOver = (niveau, turnOver, entrees, sorties, effectifMoyen) => {
  if (niveau === 'neutral') {
    return 'Données insuffisantes — saisir les dates d\'entrée/sortie dans les fiches agents pour activer le calcul du turn-over.';
  }
  if (niveau === 'success') {
    return `✓ Turn-over stable — ${turnOver.toFixed(1)} % (${entrees} entrée${entrees > 1 ? 's' : ''} / ${sorties} sortie${sorties > 1 ? 's' : ''} sur effectif moyen ${effectifMoyen}). Climat social et fidélisation conformes.`;
  }
  if (niveau === 'warning') {
    return `⚠ Turn-over élevé — ${turnOver.toFixed(1)} %. Vérifier les motifs de départ (entretiens), revaloriser la grille salariale et les conditions de travail. Coût caché du recrutement à anticiper.`;
  }
  if (niveau === 'danger') {
    return `✕ Turn-over critique — ${turnOver.toFixed(1)} % (norme APEC ≤ ${SEUIL_TURNOVER_DANGER} %). Perte de savoir-faire, coûts de remplacement (≈ 6-12 mois de salaire). Audit climat social + GPEC + plan de fidélisation urgents.`;
  }
  return '';
};
