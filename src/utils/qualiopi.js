// Indicateurs Qualiopi opposables (Référentiel National Qualité — RNQ) — Axe 10
//
// Audit Qualiopi triennal (Code travail art. L.6316-1) — la perte de la
// certification entraîne la perte d'accès aux financements publics
// CPF / OPCO / Région. Les indicateurs RNQ doivent être documentés avec
// des **preuves opposables** consultables par l'auditeur.
//
// Le module se concentre sur les 5 indicateurs financiers/opérationnels
// directement mesurables depuis les données promo de l'outil :
//
//   I-9  — Taux d'abandon / interruption (réutilise suiviPromos)
//   I-23 — Taux d'insertion professionnelle à 6 mois
//   I-24 — Taux d'obtention de la certification visée
//   I-30 — Taux de satisfaction des stagiaires (enquête fin de parcours)
//   I-31 — Taux de satisfaction des financeurs (enquête bilan annuel)
//
// Modèle de données (extension douce, deux chemins supportés) :
//   1) globalParams.qualiopiTaux[promoId] = { tauxInsertion6Mois,
//      tauxObtentionCertif, tauxSatisfactionStagiaires,
//      tauxSatisfactionFinanceurs }
//      → privilégié : pas de migration de la structure promo, persistance
//        directe via setGlobalParams.
//   2) promo.tauxInsertion6Mois ... (fallback si la donnée a été ajoutée
//      directement sur la promo).
//
// Les champs absents/vides/non numériques sont traités comme null.

import { analyserPromos } from './suiviPromos';

const safe = (n) => (Number.isFinite(parseFloat(n)) ? parseFloat(n) : 0);
const round1 = (n) => Math.round((n || 0) * 10) / 10;

// ─── Seuils sectoriels par défaut ──────────────────────────────────────
// Références : sectorielles RNQ + benchmarks DGEFP/Carif-Oref 2024-2025.
// Les seuils Danger/Warning sont MIN (pour I-9 abandon ils sont MAX).
export const SEUILS_QUALIOPI_DEFAUT = {
  'I-9':  { sens: 'min',  warning: 10, danger: 20 }, // taux abandon : seuils MAX
  'I-23': { sens: 'plus', warning: 70, danger: 50 }, // insertion 6 m
  'I-24': { sens: 'plus', warning: 80, danger: 60 }, // certification
  'I-30': { sens: 'plus', warning: 80, danger: 60 }, // satisfaction stagiaires
  'I-31': { sens: 'plus', warning: 75, danger: 60 }, // satisfaction financeurs
};

const META_INDICATEURS = {
  'I-9':  { libelle: "Taux d'abandon / interruption",        unite: '%', source: 'suiviPromos' },
  'I-23': { libelle: "Taux d'insertion à 6 mois",            unite: '%', source: 'tauxInsertion6Mois' },
  'I-24': { libelle: "Taux d'obtention de la certification", unite: '%', source: 'tauxObtentionCertif' },
  'I-30': { libelle: 'Taux de satisfaction des stagiaires',  unite: '%', source: 'tauxSatisfactionStagiaires' },
  'I-31': { libelle: 'Taux de satisfaction des financeurs',  unite: '%', source: 'tauxSatisfactionFinanceurs' },
};

const CODES_INDICATEURS = ['I-9', 'I-23', 'I-24', 'I-30', 'I-31'];

/**
 * Détermine le niveau sémantique d'un taux selon les seuils opposables.
 * - sens 'plus' : un taux élevé est BON (insertion, certif, satisfaction)
 *     ≥ warning → success, ≥ danger → warning, < danger → danger
 * - sens 'min'  : un taux élevé est MAUVAIS (abandon)
 *     < warning → success, < danger → warning, ≥ danger → danger
 * - retourne 'neutral' si valeur null/undefined
 */
const niveauPourTaux = (valeur, seuils) => {
  if (valeur === null || valeur === undefined || !Number.isFinite(valeur)) return 'neutral';
  if (seuils.sens === 'min') {
    if (valeur >= seuils.danger)  return 'danger';
    if (valeur >= seuils.warning) return 'warning';
    return 'success';
  }
  // 'plus'
  if (valeur >= seuils.warning) return 'success';
  if (valeur >= seuils.danger)  return 'warning';
  return 'danger';
};

/**
 * Aplatit toutes les promos d'un service (structure plate ou filière conteneur).
 * Identique au pattern suiviPromos.js — pas réexporté pour éviter le couplage.
 */
const extrairePromosService = (service) => {
  const out = [];
  if (!service?.promos || typeof service.promos !== 'object') return out;
  Object.entries(service.promos).forEach(([siteKey, items]) => {
    if (!Array.isArray(items)) return;
    items.forEach(item => {
      if (!item || typeof item !== 'object') return;
      if (typeof item.effectifInitial === 'number') {
        out.push({ siteKey, filiereNom: null, promo: item, serviceId: service.id, serviceNom: service.nom });
      } else if (Array.isArray(item.promos)) {
        item.promos.forEach(p => {
          if (p && typeof p.effectifInitial === 'number') {
            out.push({ siteKey, filiereNom: item.nom || null, promo: p, serviceId: service.id, serviceNom: service.nom });
          }
        });
      }
    });
  });
  return out;
};

const parseTaux = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
};

const lireTaux = (promo, promoId, key, globalParams) => {
  // Priorité au map globalParams.qualiopiTaux[promoId][key] (saisi via le panel)
  const fromGlobal = globalParams?.qualiopiTaux?.[promoId]?.[key];
  const v1 = parseTaux(fromGlobal);
  if (v1 !== null) return v1;
  // Fallback : champ posé directement sur la promo
  return parseTaux(promo?.[key]);
};

/**
 * Calcule un indicateur (autre que I-9) à partir des promos.
 * Pondération par effectifActuel (la satisfaction de 30 stagiaires pèse plus que celle de 5).
 */
const calculerIndicateur = (code, promosFlat, seuils, globalParams) => {
  const fieldKey = META_INDICATEURS[code].source;
  const detail = promosFlat.map(({ promo, serviceId, serviceNom, siteKey, filiereNom }) => {
    const promoId = promo.id || `${serviceId}-${siteKey}-${promo.nom || 'promo'}`;
    const valeur = lireTaux(promo, promoId, fieldKey, globalParams);
    const effectifInitial = safe(promo.effectifInitial);
    const totalAbandons = promo.abandons
      ? Object.values(promo.abandons).reduce((s, v) => s + safe(v), 0)
      : 0;
    const effectifActuel = Math.max(0, effectifInitial - totalAbandons);
    return {
      promoId,
      promoNom: promo.nom || 'Promo',
      serviceId,
      serviceNom: serviceNom || 'Service',
      siteKey,
      filiereNom,
      effectifInitial,
      effectifActuel,
      valeur,
      niveau: niveauPourTaux(valeur, seuils),
    };
  });

  const renseignees = detail.filter(d => d.valeur !== null);
  const sommePoids = renseignees.reduce((s, d) => s + d.effectifActuel, 0);
  let valeurGlobale = null;
  if (renseignees.length > 0) {
    if (sommePoids > 0) {
      const somme = renseignees.reduce((s, d) => s + d.valeur * d.effectifActuel, 0);
      valeurGlobale = round1(somme / sommePoids);
    } else {
      // Fallback : moyenne arithmétique si effectifs inconnus
      const somme = renseignees.reduce((s, d) => s + d.valeur, 0);
      valeurGlobale = round1(somme / renseignees.length);
    }
  }

  const dataCompleteness = detail.length > 0
    ? round1((renseignees.length / detail.length) * 100)
    : 0;

  return {
    code,
    libelle: META_INDICATEURS[code].libelle,
    unite: META_INDICATEURS[code].unite,
    source: META_INDICATEURS[code].source,
    seuils,
    valeurGlobale,
    niveau: niveauPourTaux(valeurGlobale, seuils),
    parPromo: detail,
    nbPromosRenseignees: renseignees.length,
    nbPromosTotales: detail.length,
    dataCompleteness,
  };
};

/**
 * Construit l'I-9 (taux d'abandon) à partir de suiviPromos pour cohérence parfaite.
 */
const calculerI9 = (services, globalParams, seuils) => {
  const analyse = analyserPromos(services, globalParams);
  const detail = analyse.parPromo.map(p => ({
    promoId: p.id,
    promoNom: p.promoNom,
    serviceId: p.serviceId,
    serviceNom: p.serviceNom,
    siteKey: p.siteKey,
    filiereNom: p.filiereNom,
    effectifInitial: p.effectifInitial,
    effectifActuel: p.effectifActuel,
    valeur: p.effectifInitial > 0 ? p.tauxAbandon : null,
    niveau: p.niveau, // success/warning/danger/neutral — déjà cohérent avec sens 'min'
  }));

  const valeurGlobale = analyse.totaux.totalEffectifInitial > 0
    ? analyse.totaux.tauxAbandonGlobal
    : null;

  const renseignees = detail.filter(d => d.valeur !== null);
  const dataCompleteness = detail.length > 0
    ? round1((renseignees.length / detail.length) * 100)
    : 0;

  return {
    code: 'I-9',
    libelle: META_INDICATEURS['I-9'].libelle,
    unite: '%',
    source: 'suiviPromos',
    seuils,
    valeurGlobale,
    niveau: niveauPourTaux(valeurGlobale, seuils),
    parPromo: detail,
    nbPromosRenseignees: renseignees.length,
    nbPromosTotales: detail.length,
    dataCompleteness,
  };
};

/**
 * Génère le tableau de bord Qualiopi complet.
 *
 * @param {Array}  services
 * @param {object} globalParams — peut surcharger seuilsQualiopi[code]
 * @returns {{
 *   indicateurs: { 'I-9'|...: indicator },
 *   totaux: { nbConformes, nbASurveiller, nbNonConformes, nbSansDonnees,
 *             completude, auditReady, scoreGlobal },
 *   alertes: Array<{ niveau, message, indicateur }>,
 *   seuils: object,
 * }}
 */
export const calculerIndicateursQualiopi = (services, globalParams = {}) => {
  // Fusion des seuils par indicateur (préserve sens, ne casse pas si surchage partielle)
  const overrides = globalParams.seuilsQualiopi || {};
  const seuils = {};
  CODES_INDICATEURS.forEach(code => {
    const def = SEUILS_QUALIOPI_DEFAUT[code];
    const o = overrides[code] || {};
    seuils[code] = {
      sens: def.sens,
      warning: Number.isFinite(parseFloat(o.warning)) ? parseFloat(o.warning) : def.warning,
      danger:  Number.isFinite(parseFloat(o.danger))  ? parseFloat(o.danger)  : def.danger,
    };
    // Garde-fous : pour 'min' on veut warning ≤ danger ; pour 'plus' on veut warning ≥ danger.
    if (seuils[code].sens === 'min'  && seuils[code].danger  < seuils[code].warning) {
      seuils[code].danger = seuils[code].warning;
    }
    if (seuils[code].sens === 'plus' && seuils[code].warning < seuils[code].danger) {
      seuils[code].warning = seuils[code].danger;
    }
  });

  // Aplatir toutes les promos pour les indicateurs I-23/24/30/31
  const promosFlat = (services || []).filter(s => s && s.id).flatMap(extrairePromosService);

  const indicateurs = {};
  indicateurs['I-9'] = calculerI9(services, globalParams, seuils['I-9']);
  ['I-23', 'I-24', 'I-30', 'I-31'].forEach(code => {
    indicateurs[code] = calculerIndicateur(code, promosFlat, seuils[code], globalParams);
  });

  // Totaux
  let nbConformes = 0, nbASurveiller = 0, nbNonConformes = 0, nbSansDonnees = 0;
  CODES_INDICATEURS.forEach(code => {
    const n = indicateurs[code].niveau;
    if (n === 'success')  nbConformes++;
    else if (n === 'warning') nbASurveiller++;
    else if (n === 'danger')  nbNonConformes++;
    else nbSansDonnees++;
  });

  const completude = round1(
    CODES_INDICATEURS.reduce((s, c) => s + indicateurs[c].dataCompleteness, 0) / CODES_INDICATEURS.length
  );
  const auditReady = nbSansDonnees === 0;
  const scoreGlobal = round1((nbConformes / CODES_INDICATEURS.length) * 100);

  // Alertes
  const alertes = [];
  if (nbNonConformes > 0) {
    alertes.push({
      niveau: 'danger',
      message: `${nbNonConformes} indicateur${nbNonConformes > 1 ? 's' : ''} sous le seuil opposable — risque non-conformité audit Qualiopi triennal.`,
    });
  }
  if (nbSansDonnees > 0) {
    alertes.push({
      niveau: 'warning',
      message: `${nbSansDonnees} indicateur${nbSansDonnees > 1 ? 's' : ''} sans donnée — l'auditeur attend une preuve documentée pour CHAQUE indicateur RNQ. Compléter avant audit.`,
    });
  }
  CODES_INDICATEURS.forEach(code => {
    if (indicateurs[code].niveau === 'danger' && indicateurs[code].valeurGlobale !== null) {
      alertes.push({
        niveau: 'danger',
        indicateur: code,
        message: `${code} ${META_INDICATEURS[code].libelle} : ${indicateurs[code].valeurGlobale} % — sous le seuil opposable.`,
      });
    }
  });

  return {
    indicateurs,
    totaux: {
      nbConformes,
      nbASurveiller,
      nbNonConformes,
      nbSansDonnees,
      completude,
      auditReady,
      scoreGlobal,
    },
    alertes,
    seuils,
  };
};

/**
 * Recommandation contextuelle DAF / Responsable Qualité par indicateur.
 */
export const recommendationIndicateur = (code, niveau, valeur) => {
  if (niveau === 'neutral') {
    return `Aucune donnée renseignée — l'auditeur Qualiopi exige une preuve documentée pour cet indicateur (enquête, attestation, registre).`;
  }
  if (niveau === 'success') {
    return `✓ Conforme — ${valeur} %. Maintenir le dispositif de collecte de preuves (questionnaire, registre nominatif).`;
  }
  if (niveau === 'warning') {
    if (code === 'I-9')  return `⚠ Taux d'abandon ${valeur} % — vigilance avant audit. Renforcer le suivi individualisé (entretiens, tutorat) et documenter les motifs d'abandon.`;
    if (code === 'I-23') return `⚠ Insertion ${valeur} % — sous le seuil cible. Renforcer le partenariat avec les employeurs et le suivi cohorte 6 mois.`;
    if (code === 'I-24') return `⚠ Certification ${valeur} % — sous le seuil cible. Audit pédagogique + soutien préparation jury à programmer.`;
    if (code === 'I-30') return `⚠ Satisfaction stagiaires ${valeur} % — analyser les questionnaires défavorables, plan d'amélioration pédagogique.`;
    if (code === 'I-31') return `⚠ Satisfaction financeurs ${valeur} % — bilan qualitatif à renforcer (rapports d'exécution, indicateurs intermédiaires).`;
  }
  if (niveau === 'danger') {
    if (code === 'I-9')  return `✕ Taux d'abandon critique ${valeur} % — non-conformité Qualiopi probable. Plan d'action urgent : audit pédagogique, identification des cohortes à risque.`;
    if (code === 'I-23') return `✕ Insertion ${valeur} % — non-conformité opposable. Risque perte CPF/OPCO. Refonte du dispositif d'accompagnement à l'emploi.`;
    if (code === 'I-24') return `✕ Certification ${valeur} % — non-conformité opposable. Refonte du dispositif d'évaluation et de préparation au jury obligatoire.`;
    if (code === 'I-30') return `✕ Satisfaction stagiaires ${valeur} % — non-conformité majeure. Audit pédagogique externe recommandé avant prochain audit Qualiopi.`;
    if (code === 'I-31') return `✕ Satisfaction financeurs ${valeur} % — risque non-renouvellement conventions. Échanges bilatéraux Région/OPCO à organiser.`;
  }
  return '';
};

/**
 * Recommandation globale Qualiopi (synthèse audit-readiness).
 */
export const recommendationQualiopi = (resultat) => {
  if (!resultat) return '';
  const { totaux } = resultat;
  if (totaux.nbNonConformes > 0) {
    return `✕ ${totaux.nbNonConformes} indicateur${totaux.nbNonConformes > 1 ? 's' : ''} non conforme${totaux.nbNonConformes > 1 ? 's' : ''}. Risque sérieux de non-renouvellement Qualiopi à l'audit triennal — perte des financements CPF/OPCO/Région. Plan d'action prioritaire à formaliser.`;
  }
  if (!totaux.auditReady) {
    return `⚠ Audit Qualiopi non préparé : ${totaux.nbSansDonnees} indicateur${totaux.nbSansDonnees > 1 ? 's' : ''} sans donnée probante. L'auditeur exige un dispositif de mesure et des preuves opposables pour chacun des 32 indicateurs RNQ.`;
  }
  if (totaux.nbASurveiller > 0) {
    return `⚠ Audit-ready avec ${totaux.nbASurveiller} indicateur${totaux.nbASurveiller > 1 ? 's' : ''} en zone de vigilance — score conforme global ${totaux.scoreGlobal} %. Plan d'amélioration continue à documenter.`;
  }
  return `✓ Tableau de bord Qualiopi conforme — ${totaux.nbConformes}/${5} indicateurs au-dessus des seuils opposables. Maintenir la collecte des preuves (questionnaires, registres, attestations) tout au long du cycle triennal.`;
};

export const CODES_QUALIOPI = CODES_INDICATEURS;
export const META_QUALIOPI = META_INDICATEURS;
