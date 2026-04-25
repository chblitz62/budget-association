import { calculerStatsFormation } from './constants';

/**
 * Calcule les indicateurs du Radar de Santé financière.
 *
 * @param {object} params
 * @param {Array}    params.services
 * @param {Function} params.getBudgetDirection   - () => budget direction
 * @param {Function} params.getBudgetPoleSupport - () => budget pôle support
 * @param {Function} params.getBudgetService     - (svc) => budget service
 * @param {number}   params.masseSalarialeTotal
 * @returns {{ radarData, scoreGlobal, scoreColor, tauxCouv, overhead, ratioPMS, depSub,
 *             totalAbandons, totalEtus, totalCharges, totalRecettes }}
 */
export const calculerRadarSante = ({ services, getBudgetDirection, getBudgetPoleSupport, getBudgetService, masseSalarialeTotal }) => {
  const bdDir = getBudgetDirection();
  const bdPS  = getBudgetPoleSupport();

  const totalCharges  = services.reduce((s, svc) => s + getBudgetService(svc).total,    0) + bdDir.total    + bdPS.total;
  const totalRecettes = services.reduce((s, svc) => s + getBudgetService(svc).recettes, 0);

  const totalSubventions = services.reduce((s, svc) =>
    s + (svc.recettes || []).filter(r =>
      r.type === 'subvention' ||
      (r.nom || '').toLowerCase().includes('subvention') ||
      (r.nom || '').toLowerCase().includes('région')
    ).reduce((a, r) => a + (r.montant || 0) * 12, 0), 0);

  const tauxCouv = totalCharges > 0 ? Math.min(totalRecettes / totalCharges * 100, 120) : 0;
  const overhead = totalCharges > 0 ? (bdDir.total + bdPS.total) / totalCharges * 100 : 0;
  const ratioPMS = totalRecettes > 0 && masseSalarialeTotal > 0 ? masseSalarialeTotal / totalRecettes * 100 : 0;
  const depSub   = totalRecettes > 0 ? totalSubventions / totalRecettes * 100 : 50;

  let totalEtus = 0, totalAbandons = 0;
  services.forEach(svc => {
    if (svc.promos) {
      const st = calculerStatsFormation(svc);
      totalEtus     += st.totalEtudiants || 0;
      totalAbandons += st.totalAbandons  || 0;
    }
  });
  const tauxRetention = totalEtus > 0 ? Math.max(0, (1 - totalAbandons / totalEtus) * 100) : 80;

  const kpiMarge      = Math.max(0, Math.min(100, tauxCouv - 20));
  const kpiStructure  = Math.max(0, Math.min(100, 100 - overhead * 2));
  const kpiMS         = Math.max(0, Math.min(100, 150 - ratioPMS));
  const kpiRetention  = Math.max(0, Math.min(100, tauxRetention));
  const kpiSubvention = Math.max(0, Math.min(100, 100 - depSub));

  const radarData = [
    { kpi: 'Marge',      val: Math.round(kpiMarge),      raw: `${tauxCouv.toFixed(0)}% couverture`,    detail: 'Taux de couverture recettes/charges. 100% = équilibre.' },
    { kpi: 'Structure',  val: Math.round(kpiStructure),  raw: `${overhead.toFixed(0)}% overhead`,       detail: 'Efficience : poids Direction+Pôle Support dans les charges. Seuil sain : <30%.' },
    { kpi: 'Masse sal.', val: Math.round(kpiMS),         raw: `${ratioPMS.toFixed(0)}% MS/recettes`,   detail: "Ratio masse salariale / recettes. Seuil d'alerte : >70%." },
    { kpi: 'Rétention',  val: Math.round(kpiRetention),  raw: `${tauxRetention.toFixed(0)}% maintien`, detail: "Taux de maintien en formation (100% − taux d'abandon)." },
    { kpi: 'Autonomie',  val: Math.round(kpiSubvention), raw: `${depSub.toFixed(0)}% subventions`,     detail: 'Indépendance financière : 100% = aucune recette issue de subventions.' },
  ];

  const scoreGlobal = Math.round(radarData.reduce((s, d) => s + d.val, 0) / radarData.length);
  const scoreColor  = scoreGlobal >= 70 ? 'text-emerald-500' : scoreGlobal >= 50 ? 'text-amber-500' : 'text-rose-500';

  return { radarData, scoreGlobal, scoreColor, tauxCouv, overhead, ratioPMS, depSub, totalAbandons, totalEtus, totalCharges, totalRecettes };
};

/**
 * Génère le rapport stratégique textuel à partir du radar de santé.
 *
 * @param {object} params
 * @param {object} params.radarSante         - retour de calculerRadarSante
 * @param {object} params.statsFormation     - statistiques formation globales
 * @param {number} params.masseSalarialeTotal
 * @returns {{ vigilance: string[], opportunites: string[], prevision: string, scoreGlobal: number, date: string }}
 */
export const genererRapportStrategique = ({ radarSante, statsFormation, masseSalarialeTotal }) => {
  const { tauxCouv, overhead, ratioPMS, depSub, totalAbandons, totalEtus, totalCharges, totalRecettes, scoreGlobal } = radarSante;

  const vigilance    = [];
  const opportunites = [];

  if (tauxCouv < 100)
    vigilance.push(`⚠ Taux de couverture insuffisant (${tauxCouv.toFixed(0)}%) — déficit de ${Math.round(totalCharges - totalRecettes).toLocaleString('fr-FR')} €. Activer les leviers de recettes ou réduire les charges variables.`);
  if (overhead > 35)
    vigilance.push(`⚠ Overhead structurel élevé (${overhead.toFixed(0)}%) — la part Direction+Pôle Support dépasse le seuil de 30%.`);
  if (ratioPMS > 75)
    vigilance.push(`⚠ Poids de la masse salariale critique (${ratioPMS.toFixed(0)}% des recettes) — toute variation de recettes amplifie l'impact sur la trésorerie.`);
  if (depSub > 60)
    vigilance.push(`⚠ Dépendance aux subventions élevée (${depSub.toFixed(0)}%) — risque de fragilité si un financeur se retire. Diversifier les sources.`);
  if (totalAbandons > 0 && totalAbandons / (totalEtus || 1) > 0.1)
    vigilance.push(`⚠ Taux d'abandon formation (${(totalAbandons / (totalEtus || 1) * 100).toFixed(0)}%) — perte de recettes et signal qualité pédagogique.`);

  if (depSub < 80 && totalRecettes > 0)
    opportunites.push(`✓ Potentiel de diversification : ${(100 - depSub).toFixed(0)}% des recettes sont issues de sources autonomes (droits d'inscription, prestations). À développer.`);
  if (overhead < 30)
    opportunites.push(`✓ Structure légère (overhead ${overhead.toFixed(0)}%) — efficience opérationnelle favorable. Marge de manœuvre pour investir dans le pédagogique.`);
  if (statsFormation?.effectifTotal > 0 && masseSalarialeTotal > 0)
    opportunites.push(`✓ Coût RH par étudiant : ${Math.round(masseSalarialeTotal / statsFormation.effectifTotal).toLocaleString('fr-FR')} €. Benchmarker vs. formations similaires pour identifier les gisements d'efficience.`);
  opportunites.push(`✓ Subventions OPCO/DREETS : vérifier l'éligibilité des formations continues aux dispositifs FNE-Formation, CPF, Plan de développement des compétences.`);

  const prevision = tauxCouv >= 100
    ? `Atterrissage financier favorable : excédent prévisionnel de ${Math.round(totalRecettes - totalCharges).toLocaleString('fr-FR')} €. Affecter en réserves de gestion.`
    : `Atterrissage financier déficitaire : un déficit de ${Math.round(totalCharges - totalRecettes).toLocaleString('fr-FR')} € est prévu. Sans action corrective, les réserves seront sollicitées.`;

  return { vigilance, opportunites, prevision, scoreGlobal, date: new Date().toLocaleDateString('fr-FR') };
};
