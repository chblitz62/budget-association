// Suivi des Quotas & Rupture de Charge par Promo — Axe 3
//
// Décline le suivi d'abandons à la maille de la promo individuelle (et non
// plus seulement par service ou par filière). Permet d'identifier en amont
// les promos qui décrochent et menacent l'équilibre économique du service.
//
// Modèle de données (existant, sans migration) :
//   service.promos = {
//     [siteKey]: [
//       // structure plate
//       { id, nom, effectifInitial, abandons: { janvier:0, ..., decembre:0 }, type },
//       // OU structure filière (conteneur)
//       { id, nom, promos: [ ... promos plates ... ] },
//     ]
//   }
//
// Métriques par promo :
//   tauxAbandon (%)   = totalAbandons / effectifInitial × 100
//   tauxRetention (%) = 100 − tauxAbandon
//   niveau            : success / warning / danger / neutral
//
// Seuils (configurables via globalParams.seuilAbandonWarning et seuilAbandonDanger) :
//   Warning : taux ≥ 10 %
//   Danger  : taux ≥ 20 %  (rupture de charge probable)

const safe = (n) => (Number.isFinite(parseFloat(n)) ? parseFloat(n) : 0);

export const SEUIL_ABANDON_WARNING_DEFAULT = 10; // %
export const SEUIL_ABANDON_DANGER_DEFAULT  = 20; // %

const calcAbandons = (abandonsObj) => {
  if (!abandonsObj || typeof abandonsObj !== 'object') return 0;
  return Object.values(abandonsObj).reduce((s, v) => s + safe(v), 0);
};

const niveauPromo = (effectifInitial, tauxAbandon, seuils) => {
  if (effectifInitial <= 0) return 'neutral';
  if (tauxAbandon >= seuils.danger) return 'danger';
  if (tauxAbandon >= seuils.warning) return 'warning';
  return 'success';
};

/**
 * Aplatit toutes les promos d'un service (gère structure plate + filière conteneur)
 * et retourne une liste enrichie [{ siteKey, filiereNom?, promo }]
 */
const extrairePromosService = (service) => {
  const result = [];
  if (!service?.promos || typeof service.promos !== 'object') return result;
  Object.entries(service.promos).forEach(([siteKey, items]) => {
    if (!Array.isArray(items)) return;
    items.forEach(item => {
      if (!item || typeof item !== 'object') return;
      if (typeof item.effectifInitial === 'number') {
        // structure plate
        result.push({ siteKey, filiereNom: null, promo: item });
      } else if (Array.isArray(item.promos)) {
        // structure filière : item est une filière contenant des promos
        item.promos.forEach(p => {
          if (p && typeof p === 'object' && typeof p.effectifInitial === 'number') {
            result.push({ siteKey, filiereNom: item.nom || null, promo: p });
          }
        });
      }
    });
  });
  return result;
};

/**
 * Analyse l'ensemble des promos de tous les services.
 *
 * @param {Array}  services
 * @param {object} globalParams — peut surcharger seuilAbandonWarning / seuilAbandonDanger
 * @returns {{
 *   parPromo: Array<{
 *     id, serviceId, serviceNom, siteKey, filiereNom, promoNom, type,
 *     effectifInitial, totalAbandons, effectifActuel,
 *     tauxAbandon, tauxRetention, niveau,
 *     alerteRupture,
 *   }>,
 *   totaux: {
 *     nbPromos, nbAlertes, nbCritiques, nbSaines,
 *     totalEffectifInitial, totalAbandons, totalEffectifActuel,
 *     tauxAbandonGlobal, tauxRetentionGlobal,
 *   },
 *   seuils: { warning, danger },
 * }}
 */
export const analyserPromos = (services, globalParams) => {
  const seuils = {
    warning: safe(globalParams?.seuilAbandonWarning) || SEUIL_ABANDON_WARNING_DEFAULT,
    danger:  safe(globalParams?.seuilAbandonDanger)  || SEUIL_ABANDON_DANGER_DEFAULT,
  };
  // Garde-fou : danger doit être ≥ warning
  if (seuils.danger < seuils.warning) seuils.danger = seuils.warning;

  const list = (services || []).filter(s => s && s.id);
  const parPromo = [];

  list.forEach(s => {
    const promos = extrairePromosService(s);
    promos.forEach(({ siteKey, filiereNom, promo }) => {
      const effectifInitial = safe(promo.effectifInitial);
      const totalAbandons = calcAbandons(promo.abandons);
      const effectifActuel = effectifInitial - totalAbandons;
      const tauxAbandon = effectifInitial > 0 ? (totalAbandons / effectifInitial) * 100 : 0;
      const tauxRetention = effectifInitial > 0 ? Math.max(0, 100 - tauxAbandon) : 0;
      const niveau = niveauPromo(effectifInitial, tauxAbandon, seuils);
      const alerteRupture = niveau === 'danger';

      parPromo.push({
        id: promo.id || `${s.id}-${siteKey}-${promo.nom || 'promo'}`,
        serviceId: s.id,
        serviceNom: s.nom || 'Service',
        siteKey,
        filiereNom,
        promoNom: promo.nom || 'Promo',
        type: promo.type || 'standard',
        effectifInitial,
        totalAbandons,
        effectifActuel,
        tauxAbandon: Math.round(tauxAbandon * 10) / 10,
        tauxRetention: Math.round(tauxRetention * 10) / 10,
        niveau,
        alerteRupture,
      });
    });
  });

  // Tri : promos en alerte d'abord (danger > warning), puis par taux décroissant
  parPromo.sort((a, b) => {
    const order = { danger: 0, warning: 1, success: 2, neutral: 3 };
    if (order[a.niveau] !== order[b.niveau]) return order[a.niveau] - order[b.niveau];
    return b.tauxAbandon - a.tauxAbandon;
  });

  const totalEffectifInitial = parPromo.reduce((s, p) => s + p.effectifInitial, 0);
  const totalAbandons = parPromo.reduce((s, p) => s + p.totalAbandons, 0);
  const totalEffectifActuel = parPromo.reduce((s, p) => s + p.effectifActuel, 0);
  const tauxAbandonGlobal = totalEffectifInitial > 0
    ? Math.round((totalAbandons / totalEffectifInitial) * 1000) / 10
    : 0;
  const tauxRetentionGlobal = totalEffectifInitial > 0
    ? Math.round(100 * 10 - tauxAbandonGlobal * 10) / 10
    : 0;

  const nbCritiques = parPromo.filter(p => p.niveau === 'danger').length;
  const nbAlertes   = parPromo.filter(p => p.niveau === 'warning').length;
  const nbSaines    = parPromo.filter(p => p.niveau === 'success').length;

  return {
    parPromo,
    totaux: {
      nbPromos: parPromo.length,
      nbCritiques, nbAlertes, nbSaines,
      totalEffectifInitial,
      totalAbandons,
      totalEffectifActuel,
      tauxAbandonGlobal,
      tauxRetentionGlobal,
    },
    seuils,
  };
};

/**
 * Recommandation contextuelle DAF par niveau de promo.
 */
export const recommendationPromo = (niveau, tauxAbandon, effectifActuel, effectifInitial) => {
  if (niveau === 'success') {
    return `✓ Promo saine — taux d'abandon ${tauxAbandon.toFixed(1)} %, ${effectifActuel}/${effectifInitial} étudiants. Rétention conforme aux objectifs OPCO.`;
  }
  if (niveau === 'warning') {
    return `⚠ Vigilance — taux d'abandon ${tauxAbandon.toFixed(1)} %. Mettre en place un suivi individualisé des étudiants à risque (entretiens, tutorat) pour éviter la rupture de charge.`;
  }
  if (niveau === 'danger') {
    return `✕ Rupture de charge — taux d'abandon ${tauxAbandon.toFixed(1)} %, ${effectifActuel}/${effectifInitial} étudiants. Risque économique : recettes amputées, coût/étudiant explosif. Action urgente : audit pédagogique + plan de remédiation.`;
  }
  return 'Promo non démarrée — pas d\'effectif initial enregistré.';
};
