// Détection de double-comptage Pool RH ↔ personnel direct
// (Audit DAF Tier 2, A1 — réconciliation par identifiant agent)
//
// Risque : un agent saisi à la fois dans le Pool RH (mutualisé) ET dans le personnel
// d'un service / direction / pôle support → coût compté deux fois dans la masse
// salariale agrégée.
//
// Stratégie de matching :
//   1. Match exact par `numeroAgent` si renseigné de part et d'autre
//   2. Sinon match approximatif par slug du titre/nom (normalisation accents + casse + espaces)
//
// Sortie : { doublons: [...], total, hasNumeroAgent }

const slug = (s) => String(s || '')
  .toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const collectePersonnel = (direction, services, poleSupport) => {
  const items = [];
  (direction?.personnel || []).forEach(p => {
    if (!p) return;
    items.push({ ...p, _source: 'Siège', _sourceId: 'direction' });
  });
  (poleSupport?.personnel || []).forEach(p => {
    if (!p) return;
    items.push({ ...p, _source: 'Pôle Support', _sourceId: 'poleSupport' });
  });
  (services || []).forEach(s => {
    (s.personnel || []).forEach(p => {
      if (!p) return;
      items.push({ ...p, _source: s.nom || 'Service', _sourceId: s.id });
    });
  });
  return items;
};

/**
 * Détecte les agents potentiellement comptés deux fois (Pool RH + personnel direct).
 *
 * @param {Array} poolRH       — agents du Pool RH mutualisé
 * @param {Object} direction   — direction (siège)
 * @param {Array} services     — services
 * @param {Object|null} poleSupport
 * @returns {{
 *   doublons: Array<{
 *     poolAgent: object,
 *     directAgent: object,
 *     matchType: 'numeroAgent'|'fuzzy',
 *     confiance: 'haute'|'moyenne'|'basse',
 *     surcout: number,
 *   }>,
 *   total: number,
 *   hasNumeroAgent: boolean,
 *   surcoutTotal: number,
 * }}
 */
export const detecterDoubleComptage = (poolRH = [], direction = null, services = [], poleSupport = null) => {
  if (!Array.isArray(poolRH) || poolRH.length === 0) {
    return { doublons: [], total: 0, hasNumeroAgent: false, surcoutTotal: 0 };
  }

  const directAgents = collectePersonnel(direction, services, poleSupport);
  const hasNumeroAgent = poolRH.some(p => p?.numeroAgent) || directAgents.some(p => p?.numeroAgent);

  const doublons = [];

  poolRH.forEach(pool => {
    const numPool = String(pool.numeroAgent || '').trim();
    const slugPool = slug(pool.titre || pool.nom);
    if (!slugPool && !numPool) return;

    directAgents.forEach(direct => {
      const numDir = String(direct.numeroAgent || '').trim();
      const slugDir = slug(direct.titre || direct.nom);

      let matchType = null;
      let confiance = null;

      if (numPool && numDir && numPool === numDir) {
        matchType = 'numeroAgent';
        confiance = 'haute';
      } else if (slugPool && slugDir && slugPool === slugDir) {
        matchType = 'fuzzy';
        confiance = numPool || numDir ? 'basse' : 'moyenne';
        // Si l'un a un numéro et l'autre non, ils peuvent ne pas être le même → confiance basse
      }

      if (matchType) {
        // Estimation du surcoût annuel : salaire brut chargé × ETP affecté dans Pool
        const salaire = parseFloat(pool.salaire) || 0;
        const etpDirect = parseFloat(direct.etp) || 1;
        const totalPctPool = (pool.affectations || []).reduce((s, a) => s + (parseFloat(a.pct) || 0), 0);
        // Approximation : 1 mois de salaire × 12 × (taux Pool affecté)
        const surcout = Math.round(salaire * 12 * 1.44 * (totalPctPool / 100) * etpDirect);

        doublons.push({
          poolAgent: { id: pool.id, titre: pool.titre || '', numero: numPool || null },
          directAgent: { id: direct.id, titre: direct.titre || direct.nom || '', numero: numDir || null, source: direct._source },
          matchType, confiance, surcout,
        });
      }
    });
  });

  const surcoutTotal = doublons.reduce((s, d) => s + d.surcout, 0);

  return {
    doublons,
    total: doublons.length,
    hasNumeroAgent,
    surcoutTotal,
  };
};
