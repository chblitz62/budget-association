// Moteur de Clés de Répartition — Axe 6 S6.3
//
// Réalloue automatiquement les charges du siège (overhead) sur les services
// opérationnels selon une clé de répartition métier. Permet d'obtenir le
// "coût complet" par service (charges directes + quote-part siège).
//
// 6 clés de répartition supportées :
//   1. uniforme     : montant siège ÷ nb services (égalitaire)
//   2. etp          : proportionnel aux ETP du service (le plus fréquent)
//   3. recettes     : proportionnel aux recettes du service
//   4. charges      : proportionnel aux charges directes du service
//   5. surface      : proportionnel à la surface m² (saisie manuelle par service)
//   6. heures       : proportionnel aux heures stagiaires (depuis statsFormation)
//   7. manuel       : pourcentages saisis manuellement (somme = 100 %)
//
// Round-trip safe : la somme des montants alloués = montant siège (à 1 € près).

const safe = (n) => (Number.isFinite(parseFloat(n)) ? parseFloat(n) : 0);
const round = (n) => Math.round(safe(n));

export const TYPES_CLES = [
  { id: 'uniforme', label: 'Uniforme (égalitaire)',                  hint: 'Le siège est réparti à parts égales entre services.' },
  { id: 'etp',      label: 'ETP (effectifs)',                         hint: 'Proportionnel aux ETP du service. Méthode standard CCN 66.' },
  { id: 'recettes', label: 'Recettes',                                hint: 'Proportionnel au chiffre d\'affaires du service.' },
  { id: 'charges',  label: 'Charges directes',                        hint: 'Proportionnel aux charges directes (salaires + exploitation).' },
  { id: 'surface',  label: 'Surface m²',                              hint: 'Proportionnel à la surface occupée. Saisie surface par service.' },
  { id: 'heures',   label: 'Heures stagiaires',                       hint: 'Proportionnel aux heures de formation dispensées.' },
  { id: 'manuel',   label: 'Manuel (pourcentages)',                   hint: 'Vous fixez le % de réallocation pour chaque service.' },
];

/**
 * Calcule le poids brut de chaque service selon la clé.
 * @returns {Map<string, number>} id → poids
 */
const calculerPoids = (services, cle, params = {}) => {
  const poids = new Map();
  const list = services || [];

  switch (cle) {
    case 'uniforme':
      list.forEach(s => poids.set(s.id, 1));
      break;

    case 'etp':
      list.forEach(s => {
        const etp = (s.personnel || []).reduce((sum, p) => sum + safe(p.etp), 0);
        poids.set(s.id, etp);
      });
      break;

    case 'recettes':
      list.forEach(s => {
        const r = (s.recettes || []).reduce((sum, item) => sum + safe(item.montant) * 12, 0);
        poids.set(s.id, r);
      });
      break;

    case 'charges':
      list.forEach(s => {
        const sal = (s.personnel || []).reduce((sum, p) => sum + safe(p.salaire) * 12 * safe(p.etp || 1), 0);
        const exp = (s.exploitation || []).reduce((sum, item) => sum + safe(item.montant) * 12, 0);
        poids.set(s.id, sal + exp);
      });
      break;

    case 'surface': {
      const surfaces = params.surfacesParService || {};
      list.forEach(s => poids.set(s.id, safe(surfaces[s.id])));
      break;
    }

    case 'heures': {
      const heures = params.heuresParService || {};
      list.forEach(s => poids.set(s.id, safe(heures[s.id])));
      break;
    }

    case 'manuel': {
      const pcts = params.pourcentagesParService || {};
      list.forEach(s => poids.set(s.id, safe(pcts[s.id])));
      break;
    }

    default:
      list.forEach(s => poids.set(s.id, 1));
  }

  return poids;
};

/**
 * Calcule la répartition d'un montant siège entre services.
 *
 * @param {number} montantSiege — total à répartir
 * @param {Array}  services — liste de services (avec id)
 * @param {string} cle — type de clé (cf TYPES_CLES)
 * @param {object} params — { surfacesParService?, heuresParService?, pourcentagesParService? }
 * @returns {{
 *   distribution: { [serviceId]: { montant, pct, poids } },
 *   total: number,
 *   ecartArrondi: number,
 *   cle, params,
 *   metadata: { nbServices, totalPoids, sommeMontants },
 * }}
 */
export const calculerRepartition = (montantSiege, services, cle = 'uniforme', params = {}) => {
  const M = safe(montantSiege);
  const list = (services || []).filter(s => s && s.id);
  const poids = calculerPoids(list, cle, params);
  const totalPoids = Array.from(poids.values()).reduce((s, p) => s + p, 0);

  const distribution = {};

  if (M <= 0 || list.length === 0) {
    list.forEach(s => { distribution[s.id] = { montant: 0, pct: 0, poids: poids.get(s.id) || 0 }; });
    return {
      distribution, total: 0, ecartArrondi: 0, cle, params,
      metadata: { nbServices: list.length, totalPoids, sommeMontants: 0 },
    };
  }

  // Cas spécial manuel : les params sont déjà des % qui doivent sommer à 100
  if (cle === 'manuel') {
    list.forEach(s => {
      const pct = safe(params.pourcentagesParService?.[s.id]) / 100;
      distribution[s.id] = {
        montant: round(M * pct),
        pct: pct * 100,
        poids: pct * 100,
      };
    });
  } else if (totalPoids <= 0) {
    // Tous les poids sont à zéro → fallback sur uniforme
    const partUniforme = M / list.length;
    list.forEach(s => {
      distribution[s.id] = { montant: round(partUniforme), pct: 100 / list.length, poids: 0 };
    });
  } else {
    list.forEach(s => {
      const p = poids.get(s.id) || 0;
      const pct = (p / totalPoids) * 100;
      distribution[s.id] = {
        montant: round(M * (p / totalPoids)),
        pct,
        poids: p,
      };
    });
  }

  // Round-trip correction : ajuster le plus gros bénéficiaire pour absorber l'écart d'arrondi
  const sommeMontants = Object.values(distribution).reduce((s, d) => s + d.montant, 0);
  const ecartArrondi = M - sommeMontants;
  if (Math.abs(ecartArrondi) > 0 && list.length > 0) {
    // Trouver le service avec le montant le plus élevé
    const ids = Object.keys(distribution);
    const maxId = ids.reduce((max, id) =>
      distribution[id].montant > distribution[max].montant ? id : max,
      ids[0]
    );
    if (maxId) distribution[maxId].montant += ecartArrondi;
  }

  return {
    distribution,
    total: M,
    ecartArrondi,
    cle, params,
    metadata: { nbServices: list.length, totalPoids, sommeMontants: M },
  };
};

/**
 * Calcule le coût complet par service = charges directes + quote-part siège réallouée.
 *
 * @param {Array} services — services avec leur id
 * @param {object} budgetSiege — { total: number } (charges du siège à réallouer)
 * @param {function} getBudgetService — getter (s) => { salaires, exploitation, recettes, total }
 * @param {string} cle — clé de répartition
 * @param {object} params — paramètres clé
 * @returns {{
 *   parService: Array<{ id, nom, chargesDirectes, recettesDirectes, quotePartSiege, coutComplet, marge, soldeDirect, soldeComplet }>,
 *   totalCharges, totalRecettes, totalQuotePart,
 *   repartition: { distribution, total, ... },
 * }}
 */
export const calculerCoutCompletParService = (services, budgetSiege, getBudgetService, cle, params) => {
  const repartition = calculerRepartition(safe(budgetSiege?.total), services, cle, params);
  const parService = (services || []).filter(s => s && s.id).map(s => {
    const b = getBudgetService ? getBudgetService(s) : { salaires: 0, exploitation: 0, recettes: 0, total: 0 };
    const chargesDirectes = safe(b.total);
    const recettesDirectes = safe(b.recettes);
    const quotePartSiege = repartition.distribution[s.id]?.montant || 0;
    const coutComplet = chargesDirectes + quotePartSiege;
    return {
      id: s.id,
      nom: s.nom || 'Service',
      chargesDirectes,
      recettesDirectes,
      quotePartSiege,
      coutComplet,
      soldeDirect: recettesDirectes - chargesDirectes,
      soldeComplet: recettesDirectes - coutComplet,
      marge: chargesDirectes > 0 ? ((recettesDirectes - chargesDirectes) / chargesDirectes) * 100 : 0,
    };
  });

  return {
    parService,
    totalCharges: parService.reduce((s, x) => s + x.chargesDirectes, 0),
    totalRecettes: parService.reduce((s, x) => s + x.recettesDirectes, 0),
    totalQuotePart: parService.reduce((s, x) => s + x.quotePartSiege, 0),
    repartition,
  };
};
