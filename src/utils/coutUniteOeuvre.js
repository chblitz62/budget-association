// Coût de Revient par Unité d'Œuvre — Axe 6 + Axe 3 CCHS
//
// Dérive directe de S6.3 (Clés de Répartition) : à partir du coût complet par
// service, calcule deux indicateurs métier essentiels pour les organismes de
// formation :
//
//   1. Coût/Étudiant Complet = Coût complet service ÷ Effectif actuel
//   2. CCHS (Coût Complet Horaire Stagiaire) = Coût complet service ÷ Heures stagiaires
//
// Fournit aussi :
//   - Recettes/Étudiant (chiffre d'affaires moyen par stagiaire)
//   - Marge unitaire par étudiant (recettes − coût)
//   - Statut de rentabilité par service (success / warning / danger)
//
// Référence : pratique standard Organismes de Formation pour le calcul du
// "prix de revient" présenté en CPOM, OPCO, Région.

import { calculerCoutCompletParService } from './clesRepartition';
import { calculerStatsFormation } from './constants';

const safe = (n) => (Number.isFinite(parseFloat(n)) ? parseFloat(n) : 0);

// Heures stagiaires annuelles par défaut (formation initiale plein temps)
export const HEURES_STAGIAIRES_DEFAULT = 1500;

/**
 * Renvoie le nombre d'heures stagiaires annuelles pour un service.
 * Priorité : globalParams.heuresStagiairesParService → cleRepartition.params.heuresParService → défaut.
 */
const heuresParService = (globalParams, serviceId) => {
  const direct = safe(globalParams?.heuresStagiairesParService?.[serviceId]);
  if (direct > 0) return direct;
  const viaCle = safe(globalParams?.cleRepartition?.params?.heuresParService?.[serviceId]);
  if (viaCle > 0) return viaCle;
  return HEURES_STAGIAIRES_DEFAULT;
};

const niveauRentabilite = (margeUnitaire, recettesUnitaire) => {
  if (recettesUnitaire <= 0) return 'neutral';
  const margePct = margeUnitaire / recettesUnitaire;
  if (margePct >= 0.05)  return 'success';   // marge ≥ 5 % → confortable
  if (margePct >= 0)     return 'warning';   // équilibre fragile
  return 'danger';                            // déficit unitaire
};

/**
 * Calcule les coûts par unité d'œuvre pour chaque service.
 *
 * @param {Array} services
 * @param {object} budgetSiege — { total: number }
 * @param {Function} getBudgetService — (s) => { recettes, total, ... }
 * @param {object} globalParams — `cleRepartition` + `heuresStagiairesParService`
 * @returns {{
 *   parService: Array<{
 *     id, nom, effectif, heuresAnnuelles, totalHeuresStagiaires,
 *     coutComplet, coutDirect, recettes,
 *     coutEtudiantComplet, coutEtudiantDirect, recettesEtudiant,
 *     margeEtudiant, niveau, cchs,
 *   }>,
 *   totaux: {
 *     totalEffectif, totalHeures, totalCoutComplet, totalRecettes,
 *     coutEtudiantMoyen, recettesEtudiantMoyen, margeEtudiantMoyen, cchsConsolide,
 *   },
 * }}
 */
export const calculerCoutUniteOeuvre = (services, budgetSiege, getBudgetService, globalParams) => {
  const cleType = globalParams?.cleRepartition?.type || 'etp';
  const cleParams = globalParams?.cleRepartition?.params || {};
  const repartition = calculerCoutCompletParService(services, budgetSiege, getBudgetService, cleType, cleParams);

  const parService = repartition.parService.map(c => {
    const service = (services || []).find(s => s.id === c.id);
    const stats = service ? calculerStatsFormation(service) : { effectifActuel: 0, totalEtudiants: 0 };
    const effectif = stats.effectifActuel || 0;
    const heuresAnnuelles = heuresParService(globalParams, c.id);
    const totalHeuresStagiaires = effectif * heuresAnnuelles;

    const coutComplet = safe(c.coutComplet);
    const coutDirect = safe(c.chargesDirectes);
    const recettes = safe(c.recettesDirectes);

    const coutEtudiantComplet = effectif > 0 ? coutComplet / effectif : 0;
    const coutEtudiantDirect = effectif > 0 ? coutDirect / effectif : 0;
    const recettesEtudiant = effectif > 0 ? recettes / effectif : 0;
    const margeEtudiant = recettesEtudiant - coutEtudiantComplet;
    const cchs = totalHeuresStagiaires > 0 ? coutComplet / totalHeuresStagiaires : 0;

    return {
      id: c.id,
      nom: c.nom,
      effectif,
      heuresAnnuelles,
      totalHeuresStagiaires,
      coutComplet,
      coutDirect,
      recettes,
      coutEtudiantComplet: Math.round(coutEtudiantComplet),
      coutEtudiantDirect: Math.round(coutEtudiantDirect),
      recettesEtudiant: Math.round(recettesEtudiant),
      margeEtudiant: Math.round(margeEtudiant),
      cchs: Math.round(cchs * 100) / 100,
      niveau: niveauRentabilite(margeEtudiant, recettesEtudiant),
    };
  });

  // Totaux consolidés (pondérés par effectif)
  const totalEffectif = parService.reduce((s, x) => s + x.effectif, 0);
  const totalHeures = parService.reduce((s, x) => s + x.totalHeuresStagiaires, 0);
  const totalCoutComplet = parService.reduce((s, x) => s + x.coutComplet, 0);
  const totalRecettes = parService.reduce((s, x) => s + x.recettes, 0);
  const coutEtudiantMoyen = totalEffectif > 0 ? totalCoutComplet / totalEffectif : 0;
  const recettesEtudiantMoyen = totalEffectif > 0 ? totalRecettes / totalEffectif : 0;
  const margeEtudiantMoyen = recettesEtudiantMoyen - coutEtudiantMoyen;
  const cchsConsolide = totalHeures > 0 ? totalCoutComplet / totalHeures : 0;

  return {
    parService,
    totaux: {
      totalEffectif,
      totalHeures,
      totalCoutComplet,
      totalRecettes,
      coutEtudiantMoyen: Math.round(coutEtudiantMoyen),
      recettesEtudiantMoyen: Math.round(recettesEtudiantMoyen),
      margeEtudiantMoyen: Math.round(margeEtudiantMoyen),
      cchsConsolide: Math.round(cchsConsolide * 100) / 100,
    },
  };
};

/**
 * Recommandation contextuelle par niveau.
 */
export const recommendationCoutEtudiant = (niveau, margeEtudiant) => {
  if (niveau === 'success') return `✓ Marge unitaire confortable (+${margeEtudiant.toLocaleString('fr-FR')} €/étudiant). Activité durable.`;
  if (niveau === 'warning') return `⚠ Équilibre fragile (+${margeEtudiant.toLocaleString('fr-FR')} €/étudiant). Renégocier prix de vente ou rationaliser charges.`;
  if (niveau === 'danger')  return `✕ Déficit unitaire (${margeEtudiant.toLocaleString('fr-FR')} €/étudiant). Revoir le modèle économique de la filière.`;
  return 'Aucune donnée d\'effectif — calcul indisponible.';
};
