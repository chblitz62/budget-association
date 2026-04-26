// Reste à Engager (RAE) — Suivi du Cycle d'Achat & Engagements (Axe 9)
//
// Pour chaque entité (Direction, Pôle Support, Service), calcule :
//   - Budget exploitation annuel (depuis chargesSiege/exploitation × 12)
//   - Engagements ouverts (statut 'ouvert' ou non 'solde') affectés à cette entité
//   - Reste à Engager = Budget − Engagements ouverts
//   - Taux d'engagement = Engagements / Budget × 100
//   - Niveau d'alerte : 'success' (<70 %) | 'warning' (70-90 %) | 'danger' (90-100 %) | 'overrun' (>100 %)
//
// Formule métier validée par le DAF :
//   Le RAE est la marge disponible pour de nouveaux engagements sans dépasser
//   le budget voté. Au-delà de 90 %, alerte de pré-saturation. Au-delà de 100 %,
//   l'entité est en dépassement budgétaire (rouge).

const safe = (n) => (Number.isFinite(parseFloat(n)) ? parseFloat(n) : 0);

const computeBudgetExploitation = (entity, key, bpCoeff = 100) => {
  const items = entity?.[key] || [];
  const annual = items.reduce((s, c) => s + safe(c.montant) * 12, 0);
  return annual * (bpCoeff / 100);
};

/**
 * @param {Array} engagements — liste complète depuis useBudgetData
 * @param {string} entiteLabel — label exact de l'entité (Direction, Pôle Support, ou nom de service)
 * @returns {{ ouverts: number, count: number, items: Array }}
 */
const sumEngagementsByEntite = (engagements = [], entiteLabel) => {
  const items = (engagements || []).filter(e =>
    String(e?.entite || '').trim() === String(entiteLabel || '').trim() && e?.statut !== 'solde'
  );
  const ouverts = items.reduce((s, e) => s + safe(e.montant), 0);
  return { ouverts, count: items.length, items };
};

const niveauAlerte = (taux) => {
  if (taux > 100) return 'overrun';
  if (taux >= 90) return 'danger';
  if (taux >= 70) return 'warning';
  return 'success';
};

/**
 * Calcule le RAE pour toutes les entités du budget.
 * @returns {{
 *   entites: Array<{ id, nom, type, budget, engagements, reste, taux, niveau, count }>,
 *   total: { budget, engagements, reste, taux, niveau },
 * }}
 */
export const calculerResteAEngager = (direction, services, poleSupport, engagements, globalParams) => {
  const bpCoeff = safe(globalParams?.coefficientBP) || 100;
  const entites = [];

  // ── Direction / Siège ────────────────────────────────────────────
  if (direction) {
    const budget = computeBudgetExploitation(direction, 'chargesSiege', bpCoeff)
                 + computeBudgetExploitation(direction, 'exploitation', bpCoeff);
    const eng = sumEngagementsByEntite(engagements, 'Direction');
    const taux = budget > 0 ? (eng.ouverts / budget) * 100 : 0;
    entites.push({
      id: 'direction',
      nom: 'Direction',
      type: 'siege',
      budget,
      engagements: eng.ouverts,
      reste: budget - eng.ouverts,
      taux,
      niveau: niveauAlerte(taux),
      count: eng.count,
    });
  }

  // ── Pôle Support ─────────────────────────────────────────────────
  if (poleSupport) {
    const budget = computeBudgetExploitation(poleSupport, 'exploitation', bpCoeff);
    const eng = sumEngagementsByEntite(engagements, 'Pôle Support');
    const taux = budget > 0 ? (eng.ouverts / budget) * 100 : 0;
    entites.push({
      id: 'poleSupport',
      nom: 'Pôle Support',
      type: 'pole',
      budget,
      engagements: eng.ouverts,
      reste: budget - eng.ouverts,
      taux,
      niveau: niveauAlerte(taux),
      count: eng.count,
    });
  }

  // ── Services ─────────────────────────────────────────────────────
  (services || []).forEach(s => {
    const budget = computeBudgetExploitation(s, 'exploitation', bpCoeff);
    const eng = sumEngagementsByEntite(engagements, s.nom);
    const taux = budget > 0 ? (eng.ouverts / budget) * 100 : 0;
    entites.push({
      id: s.id,
      nom: s.nom || 'Service sans nom',
      type: 'service',
      budget,
      engagements: eng.ouverts,
      reste: budget - eng.ouverts,
      taux,
      niveau: niveauAlerte(taux),
      count: eng.count,
    });
  });

  // ── Total consolidé ──────────────────────────────────────────────
  const totalBudget = entites.reduce((s, e) => s + e.budget, 0);
  const totalEngagements = entites.reduce((s, e) => s + e.engagements, 0);
  const totalTaux = totalBudget > 0 ? (totalEngagements / totalBudget) * 100 : 0;

  return {
    entites,
    total: {
      budget: totalBudget,
      engagements: totalEngagements,
      reste: totalBudget - totalEngagements,
      taux: totalTaux,
      niveau: niveauAlerte(totalTaux),
    },
  };
};

/**
 * Renvoie une recommandation d'action contextuelle selon le niveau.
 */
export const recommendationRAE = (niveau, taux) => {
  switch (niveau) {
    case 'overrun':
      return `✕ Dépassement budgétaire (${taux.toFixed(1)} %). Stopper les nouveaux engagements et solliciter un avenant DAF.`;
    case 'danger':
      return `⚠ Pré-saturation (${taux.toFixed(1)} %). Restreindre les nouveaux engagements aux dépenses critiques.`;
    case 'warning':
      return `🟡 Vigilance (${taux.toFixed(1)} %). Anticiper les engagements de fin d'année.`;
    default:
      return `✓ Marge disponible saine (${taux.toFixed(1)} %).`;
  }
};
