// Simulateur de Stress-Test Trésorerie ciblé Subventions — Axe 2
//
// Permet de simuler le retard de paiement ou la coupe d'une subvention
// spécifique (Région, État, OPCO, CPOM) et d'en mesurer l'impact sur le
// cash flow mensuel (cumul, mois en rupture, mois de recovery).
//
// Différent du stressTest global (StressTestBar.jsx) qui applique un %
// uniforme à toutes les subventions confondues : ici on cible une recette
// nommée et on combine décalage temporel + coupe en valeur.
//
// Référence métier : pratique standard DAF — "que se passe-t-il si la
// Région paie 3 mois plus tard et nous coupe 15 % cette année ?"

const safe = (n) => (Number.isFinite(parseFloat(n)) ? parseFloat(n) : 0);

const MOTS_SUBVENTION = [
  'subvention', 'subv.', 'subv ', 'région', 'region', 'état', 'etat',
  'département', 'departement', 'commune', 'opco', 'cpom', 'caf', 'fse', 'agefiph',
];

export const estSubvention = (nom) => {
  const n = String(nom || '').toLowerCase();
  return MOTS_SUBVENTION.some(mot => n.includes(mot));
};

const moisLabels = (item) => {
  // saisonnalité possible : item.repartitionMensuelle = [12 valeurs] (somme=12 si uniforme)
  if (Array.isArray(item.repartitionMensuelle) && item.repartitionMensuelle.length === 12) {
    const total = item.repartitionMensuelle.reduce((s, v) => s + safe(v), 0);
    if (total > 0) return item.repartitionMensuelle.map(v => safe(v) / total);
  }
  // moisPaiement : index 0..11 → 100 % sur ce mois
  if (Number.isInteger(item.moisPaiement) && item.moisPaiement >= 0 && item.moisPaiement < 12) {
    const arr = Array(12).fill(0);
    arr[item.moisPaiement] = 1;
    return arr;
  }
  // par défaut : uniforme sur 12
  return Array(12).fill(1 / 12);
};

/**
 * Extrait toutes les recettes-subventions identifiables, chacune avec un id
 * stable (entiteLabel:nom) pour pouvoir être ciblée par un scénario.
 */
export const extraireSubventions = (direction, services = [], poleSupport = null) => {
  const out = [];
  const push = (item, source, sourceId) => {
    if (!item || !estSubvention(item.nom)) return;
    const montantAnnuel = safe(item.montant) * 12;
    if (montantAnnuel <= 0) return;
    out.push({
      id: `${sourceId}::${item.nom}`,
      nom: item.nom,
      source,
      sourceId,
      montantAnnuel,
      distribution: moisLabels(item),
    });
  };
  (direction?.recettes || []).forEach(it => push(it, 'Siège', 'direction'));
  (poleSupport?.recettes || []).forEach(it => push(it, 'Pôle Support', 'poleSupport'));
  (services || []).forEach(s => (s?.recettes || []).forEach(it => push(it, s.nom || 'Service', s.id)));
  return out;
};

/**
 * Construit un scénario par défaut (aucun retard, aucune coupe) pour chaque subvention.
 */
export const scenariosVides = (subventions) => {
  const out = {};
  subventions.forEach(s => { out[s.id] = { decalageMois: 0, coupePct: 0 }; });
  return out;
};

const ajusterMois = (subvention, scenario) => {
  // Renvoie 12 montants ajustés selon le scénario (avant/après).
  const montant = subvention.montantAnnuel;
  const distrib = subvention.distribution;
  const original = distrib.map(p => p * montant);
  const coupe = 1 - safe(scenario?.coupePct) / 100;
  const decalage = Math.max(0, Math.round(safe(scenario?.decalageMois)));

  const ajuste = Array(12).fill(0);
  for (let i = 0; i < 12; i++) {
    const target = i + decalage;
    if (target < 12) ajuste[target] += original[i] * coupe;
    // sinon : encaissement perdu sur l'exercice (reporté en N+1, ignoré ici)
  }
  return { original, ajuste };
};

/**
 * Simule l'impact des scénarios sur la trésorerie mensuelle.
 *
 * @param {Array<{nom, encaissements, decaissements, solde, soldeCumule}>} tresoMois — sortie de calculerTresorerieMensuelle
 * @param {Array} subventions — sortie de extraireSubventions
 * @param {Object<string, {decalageMois, coupePct}>} scenarios — keyed by subvention.id
 * @returns {{
 *   moisAjustes: Array<{nom, encaissementsBase, encaissementsAjuste, deltaMois, soldeBase, soldeAjuste, cumulBase, cumulAjuste}>,
 *   metriques: {
 *     pireMois: number, // index 0..11 du cumul ajusté minimum
 *     pireMoisCumul: number,
 *     moisEnRupture: number, // nb mois où cumul ajusté < 0
 *     moisRecovery: number | null, // index où cumul retourne >= 0 après la rupture, ou null
 *     totalEncaisseManque: number, // somme année des deltas (peut être < 0 si retard pur sans coupe)
 *     totalCoupeAnnuelle: number, // perte sèche sur l'exercice (encaissements perdus hors année)
 *   },
 * }}
 */
export const simulerImpactTresorerie = (tresoMois, subventions, scenarios) => {
  const base = (tresoMois || []).slice(0, 12);
  if (base.length === 0) {
    return {
      moisAjustes: [],
      metriques: {
        pireMois: -1, pireMoisCumul: 0, moisEnRupture: 0, moisRecovery: null,
        totalEncaisseManque: 0, totalCoupeAnnuelle: 0,
      },
    };
  }

  // Cumul des deltas mois par mois (encaissement ajusté − encaissement base) pour les subventions concernées
  const deltas = Array(12).fill(0);
  let totalCoupeAnnuelle = 0;

  (subventions || []).forEach(s => {
    const scenario = scenarios?.[s.id];
    if (!scenario || (safe(scenario.decalageMois) === 0 && safe(scenario.coupePct) === 0)) return;
    const { original, ajuste } = ajusterMois(s, scenario);
    for (let i = 0; i < 12; i++) deltas[i] += ajuste[i] - original[i];
    // Manque sec = part du montant total qui n'est jamais encaissée cette année
    const sommeOrig = original.reduce((a, b) => a + b, 0);
    const sommeAjust = ajuste.reduce((a, b) => a + b, 0);
    totalCoupeAnnuelle += sommeOrig - sommeAjust;
  });

  let cumulBase = 0;
  let cumulAjuste = 0;
  const moisAjustes = base.map((m, i) => {
    cumulBase += m.solde;
    const encaissementsAjuste = m.encaissements + deltas[i];
    const soldeAjuste = encaissementsAjuste - m.decaissements;
    cumulAjuste += soldeAjuste;
    return {
      nom: m.nom,
      encaissementsBase: m.encaissements,
      encaissementsAjuste,
      deltaMois: deltas[i],
      decaissements: m.decaissements,
      soldeBase: m.solde,
      soldeAjuste,
      cumulBase,
      cumulAjuste,
    };
  });

  // Métriques agrégées
  let pireMois = -1;
  let pireMoisCumul = 0;
  let moisEnRupture = 0;
  let moisRecovery = null;
  moisAjustes.forEach((m, i) => {
    if (m.cumulAjuste < pireMoisCumul) {
      pireMois = i;
      pireMoisCumul = m.cumulAjuste;
    }
    if (m.cumulAjuste < 0) {
      moisEnRupture++;
      moisRecovery = null;
    } else if (moisEnRupture > 0 && moisRecovery === null) {
      moisRecovery = i;
    }
  });
  if (pireMois === -1) pireMoisCumul = Math.min(...moisAjustes.map(m => m.cumulAjuste));

  const totalEncaisseManque = deltas.reduce((s, v) => s + v, 0);

  return {
    moisAjustes,
    metriques: {
      pireMois,
      pireMoisCumul: Math.round(pireMoisCumul),
      moisEnRupture,
      moisRecovery,
      totalEncaisseManque: Math.round(totalEncaisseManque),
      totalCoupeAnnuelle: Math.round(totalCoupeAnnuelle),
    },
  };
};

/**
 * Détermine le niveau d'alerte global d'une simulation.
 * - danger : cumul ajusté tombe < 0 (rupture de cash)
 * - warning : pas de rupture mais perte annuelle > 5 % des décaissements
 * - success : aucun impact significatif
 */
export const niveauSimulation = (metriques, totalDecaissements = 0) => {
  if (metriques.moisEnRupture > 0) return 'danger';
  if (totalDecaissements > 0 && metriques.totalCoupeAnnuelle / totalDecaissements > 0.05) return 'warning';
  if (metriques.totalCoupeAnnuelle > 0 || metriques.totalEncaisseManque !== 0) return 'info';
  return 'success';
};

/**
 * Recommandation contextuelle selon le résultat.
 */
export const recommendationSimulation = (niveau, metriques) => {
  const moisLabel = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
  if (niveau === 'danger') {
    const recovery = metriques.moisRecovery !== null
      ? ` Recovery prévu en ${moisLabel[metriques.moisRecovery]}.`
      : ' Aucun recovery sur l\'exercice — solliciter une avance de trésorerie.';
    return `✕ Rupture de cash sur ${metriques.moisEnRupture} mois (pire : ${metriques.pireMoisCumul.toLocaleString('fr-FR')} € en ${moisLabel[metriques.pireMois]}).${recovery}`;
  }
  if (niveau === 'warning') {
    return `⚠ Pas de rupture mais perte sèche de ${metriques.totalCoupeAnnuelle.toLocaleString('fr-FR')} € sur l'exercice. Renégocier le calendrier ou ajuster les charges.`;
  }
  if (niveau === 'info') {
    return `ℹ Impact temporaire sur le cash (delta ${metriques.totalEncaisseManque.toLocaleString('fr-FR')} €). Cumul reste positif toute l'année.`;
  }
  return '✓ Aucun impact significatif. Les marges de trésorerie absorbent le scénario.';
};
