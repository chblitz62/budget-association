// Bilan Social annuel (synthèse RH normalisée) — Axe 8
//
// Référence : Code travail art. L.2312-28 (obligatoire > 300 ETP, bonne
// pratique en deçà, recommandé par le CSE en présence). À présenter au
// CSE et à l'AG annuelle. Le format intègre 7 sections couvrant emploi,
// rémunérations, conditions de travail, formation et indicateurs sociaux.
//
// Le module est un AGRÉGATEUR : il ne calcule rien de nouveau, il
// chaîne les modules RH déjà livrés (pyramideAges, pariteTurnOver,
// indicateursOETH, duer, statsFormation) et expose une structure
// normalisée pour affichage et export PDF.
//
// Données en saisie complémentaire (non calculables auto) :
//   `globalParams.bilanSocial.accidents` = {
//     exercice, accidentsAvecArret, accidentsSansArret, joursArretAT,
//     maladiesProfessionnelles, heuresTravailles, observations,
//   }

import { calculerIndicateursRH } from './pyramideAges';
import { calculerIndicateursPariteTurnOver } from './pariteTurnOver';
import { calculerIndicateursOETH, calculerSalaireAnnuel } from './calculations';
import { calculerStatsFormation, CHARGES_PATRONALES } from './constants';
import { calculerDUER } from './duer';

const safe = (n) => (Number.isFinite(parseFloat(n)) ? parseFloat(n) : 0);
const round1 = (n) => Math.round((n || 0) * 10) / 10;
const round = (n) => Math.round(n || 0);

// ─── 1. EFFECTIFS ──────────────────────────────────────────────────────
const compterEffectifs = (direction, services, poleSupport, poolRH) => {
  const tous = [
    ...(direction?.personnel || []).map(p => ({ ...p, _entite: 'direction' })),
    ...(poleSupport?.personnel || []).map(p => ({ ...p, _entite: 'poleSupport' })),
    ...(services || []).flatMap(s => (s.personnel || []).map(p => ({ ...p, _entite: s.id }))),
    ...(poolRH || []).map(p => ({ ...p, _entite: 'poolRH' })),
  ];

  const totalAgents = tous.length;
  const totalETP = tous.reduce((s, p) => s + safe(p.etp), 0);

  const parContrat = {};
  tous.forEach(p => {
    const c = (p.typeContrat || 'CDI').toUpperCase();
    if (!parContrat[c]) parContrat[c] = { type: c, nb: 0, etp: 0 };
    parContrat[c].nb += 1;
    parContrat[c].etp += safe(p.etp);
  });

  const parGenre = { H: 0, F: 0, NR: 0 };
  tous.forEach(p => {
    if (p.genre === 'H') parGenre.H += 1;
    else if (p.genre === 'F') parGenre.F += 1;
    else parGenre.NR += 1;
  });

  // Présents fin année (dateSortie === 0 OU > anneeRef OU absente)
  const presentsFinAnnee = tous.filter(p => !p.dateSortie || safe(p.dateSortie) === 0).length;

  const parEntite = [];
  if ((direction?.personnel || []).length) {
    parEntite.push({ id: 'direction', nom: 'Direction / Siège', nb: direction.personnel.length, etp: round1(direction.personnel.reduce((s, p) => s + safe(p.etp), 0)) });
  }
  if ((poleSupport?.personnel || []).length) {
    parEntite.push({ id: 'poleSupport', nom: 'Pôle Ressources', nb: poleSupport.personnel.length, etp: round1(poleSupport.personnel.reduce((s, p) => s + safe(p.etp), 0)) });
  }
  (services || []).forEach(s => {
    if ((s.personnel || []).length) {
      parEntite.push({ id: s.id, nom: s.nom, nb: s.personnel.length, etp: round1(s.personnel.reduce((s2, p) => s2 + safe(p.etp), 0)) });
    }
  });
  if ((poolRH || []).length) {
    parEntite.push({ id: 'poolRH', nom: 'Pool RH (mutualisé)', nb: poolRH.length, etp: round1(poolRH.reduce((s, p) => s + safe(p.etp), 0)) });
  }

  return {
    totalAgents,
    totalETP: round1(totalETP),
    parContrat: Object.values(parContrat).map(c => ({ ...c, etp: round1(c.etp) })),
    parGenre,
    presentsFinAnnee,
    parEntite,
  };
};

// ─── 2. RÉMUNÉRATIONS ──────────────────────────────────────────────────
const calculerMasseSalariale = (direction, services, poleSupport, poolRH, globalParams) => {
  const tous = [
    ...(direction?.personnel || []),
    ...(poleSupport?.personnel || []),
    ...(services || []).flatMap(s => s.personnel || []),
    ...(poolRH || []),
  ];
  const segurETP = safe(globalParams?.montantSegurETP) || 238;

  let brutTotal = 0;
  let chargesTotal = 0;
  let coutChargeTotal = 0;
  tous.forEach(p => {
    const etp = safe(p.etp) || 1;
    const segurMensuel = p.segur === true ? segurETP : safe(p.segur);
    const calc = calculerSalaireAnnuel(safe(p.salaire), etp, segurMensuel, p.typeContrat || 'CDI', p.tauxChargesManuel);
    brutTotal += (calc.brut || 0) + (calc.brutSegur || 0);
    chargesTotal += calc.charges || 0;
    coutChargeTotal += calc.total || 0;
  });

  const salaireMoyenETP = tous.length > 0 && tous.reduce((s, p) => s + safe(p.etp), 0) > 0
    ? round(brutTotal / tous.reduce((s, p) => s + safe(p.etp), 0))
    : 0;

  return {
    brutAnnuel: round(brutTotal),
    chargesPatronales: round(chargesTotal),
    coutEmployeur: round(coutChargeTotal),
    tauxChargesEffectif: brutTotal > 0 ? round1((chargesTotal / brutTotal) * 100) : 0,
    salaireMoyenAnnuelETP: salaireMoyenETP,
  };
};

// ─── 3. ACCIDENTS DU TRAVAIL — saisie + calcul TF/TG ───────────────────
// Référence : INRS — taux de fréquence (CIDM) et taux de gravité.
//   TF = nb AT avec arrêt × 1 000 000 / heures travaillées
//   TG = jours d'arrêt × 1 000 / heures travaillées
const calculerSecuriteTravail = (globalParams) => {
  const at = globalParams?.bilanSocial?.accidents || {};
  const accidentsAvecArret = safe(at.accidentsAvecArret);
  const accidentsSansArret = safe(at.accidentsSansArret);
  const joursArretAT = safe(at.joursArretAT);
  const maladiesProfessionnelles = safe(at.maladiesProfessionnelles);
  const heuresTravailles = safe(at.heuresTravailles);

  const tauxFrequence = heuresTravailles > 0 ? round1((accidentsAvecArret * 1000000) / heuresTravailles) : null;
  const tauxGravite   = heuresTravailles > 0 ? round1((joursArretAT * 1000) / heuresTravailles) : null;

  // Référence sectorielle CNAM : TF moyen tous secteurs ≈ 20, TG ≈ 1.5
  // Niveaux indicatifs (rester prudent — varie fortement par activité)
  const niveauTF = tauxFrequence === null ? 'neutral'
    : tauxFrequence > 30 ? 'danger'
    : tauxFrequence > 15 ? 'warning'
    : 'success';
  const niveauTG = tauxGravite === null ? 'neutral'
    : tauxGravite > 2 ? 'danger'
    : tauxGravite > 1 ? 'warning'
    : 'success';

  return {
    accidentsAvecArret,
    accidentsSansArret,
    joursArretAT,
    maladiesProfessionnelles,
    heuresTravailles,
    tauxFrequence,
    tauxGravite,
    niveauTF,
    niveauTG,
    observations: at.observations || '',
    saisi: heuresTravailles > 0 || accidentsAvecArret > 0 || accidentsSansArret > 0 || maladiesProfessionnelles > 0,
  };
};

// ─── 6. FORMATION ──────────────────────────────────────────────────────
const calculerFormation = (services, statsFormationGlobales, globalParams) => {
  if (statsFormationGlobales) {
    return {
      effectifTotal: safe(statsFormationGlobales.effectifTotal),
      enveloppeFormation: safe(globalParams?.enveloppeFormation),
      depenseRealiseeFormation: safe(globalParams?.depenseFormationRealisee),
    };
  }
  const effectifTotal = (services || []).reduce(
    (s, srv) => s + (srv.promos ? safe(calculerStatsFormation(srv).effectifActuel) : safe(srv.unites)),
    0
  );
  return {
    effectifTotal,
    enveloppeFormation: safe(globalParams?.enveloppeFormation),
    depenseRealiseeFormation: safe(globalParams?.depenseFormationRealisee),
  };
};

/**
 * Setter helper pour le panel — fusionne les saisies AT.
 */
export const mettreAJourAccidents = (globalParams, patch) => {
  const current = globalParams?.bilanSocial?.accidents || {};
  return {
    ...globalParams,
    bilanSocial: {
      ...(globalParams?.bilanSocial || {}),
      accidents: { ...current, ...patch },
    },
  };
};

/**
 * Génère le bilan social complet (toutes sections agrégées).
 *
 * @param {object} options
 * @param {object} options.direction
 * @param {Array}  options.services
 * @param {object} options.poleSupport
 * @param {Array}  options.poolRH
 * @param {object} options.globalParams
 * @param {object} options.statsFormation — optionnel (sinon recalculé)
 * @param {number} options.anneeRef
 */
export const genererBilanSocial = ({
  direction = null,
  services = [],
  poleSupport = null,
  poolRH = [],
  globalParams = {},
  statsFormation = null,
  anneeRef = new Date().getFullYear(),
} = {}) => {
  // 1. Effectifs
  const effectifs = compterEffectifs(direction, services, poleSupport, poolRH);

  // 2. Rémunérations
  const remunerations = calculerMasseSalariale(direction, services, poleSupport, poolRH, globalParams);

  // 3. Pyramide & ancienneté (réutilise pyramideAges)
  const pyramide = calculerIndicateursRH(direction, services, poleSupport, anneeRef, globalParams);

  // 4. Parité & turn-over (réutilise pariteTurnOver)
  const pariteTurnOver = calculerIndicateursPariteTurnOver(direction, services, poleSupport, poolRH, anneeRef, globalParams);

  // 5. OETH (réutilise calculations)
  const tousAgents = [
    ...(direction?.personnel || []),
    ...(poleSupport?.personnel || []),
    ...(services || []).flatMap(s => s.personnel || []),
    ...(poolRH || []),
  ];
  const oeth = calculerIndicateursOETH(tousAgents, {
    seuilOETH: safe(globalParams?.seuilOETH) || 20,
    tauxOETH: safe(globalParams?.tauxOETH) || 0.06,
  });

  // 6. Formation
  const formation = calculerFormation(services, statsFormation, globalParams);

  // 7. Conditions de travail (DUER + AT)
  const duer = calculerDUER({ services, poleSupport, direction, globalParams });
  const securite = calculerSecuriteTravail(globalParams);

  // ─── Indicateurs de complétude ─────────────────────────────────────
  const sectionsCompletes = {
    effectifs:   effectifs.totalAgents > 0,
    remunerations: remunerations.brutAnnuel > 0,
    pyramide:    pyramide.totaux.nbAgeRenseigne > 0,
    parite:      pariteTurnOver.pariteConsolidee.nbRenseignes > 0,
    oeth:        oeth.nbAgents > 0,
    formation:   formation.effectifTotal > 0,
    duer:        duer.totalRisques > 0,
    securite:    securite.saisi,
  };
  const sectionsTotal = Object.keys(sectionsCompletes).length;
  const sectionsRenseignees = Object.values(sectionsCompletes).filter(Boolean).length;
  const completude = round1((sectionsRenseignees / sectionsTotal) * 100);

  // ─── Niveau global ────────────────────────────────────────────────
  // Hiérarchie d'alerte : DUER (priorité légale) > sécurité > pyramide/parité/turn-over > complétude
  let niveauGlobal = 'success';
  const alertes = [];

  if (duer.niveauGlobal === 'danger') {
    niveauGlobal = 'danger';
    alertes.push({ niveau: 'danger', section: 'DUER', message: 'Le DUER présente des manquements critiques (voir module dédié).' });
  }
  if (securite.niveauTF === 'danger' || securite.niveauTG === 'danger') {
    niveauGlobal = 'danger';
    alertes.push({ niveau: 'danger', section: 'Sécurité', message: 'Sinistralité élevée — taux de fréquence ou de gravité au-dessus des références sectorielles.' });
  }
  if (pyramide.totaux.niveau === 'danger') {
    if (niveauGlobal === 'success') niveauGlobal = 'warning';
    alertes.push({ niveau: 'warning', section: 'Pyramide âges', message: `${pyramide.totaux.pctSeniors} % de seniors > 55 ans — risque de vague de départs en retraite.` });
  }
  if (pariteTurnOver.pariteConsolidee.niveau === 'danger') {
    if (niveauGlobal === 'success') niveauGlobal = 'warning';
    alertes.push({ niveau: 'warning', section: 'Parité H/F', message: `Index parité ${pariteTurnOver.pariteConsolidee.indexParite} % — sous la cible loi Rixain.` });
  }
  if (pariteTurnOver.turnOverConsolide.niveau === 'danger') {
    if (niveauGlobal === 'success') niveauGlobal = 'warning';
    alertes.push({ niveau: 'warning', section: 'Turn-over', message: `Turn-over ${pariteTurnOver.turnOverConsolide.turnOver} % — au-dessus de la norme APEC.` });
  }
  if (!oeth.estConforme && oeth.totalETP >= (safe(globalParams?.seuilOETH) || 20)) {
    if (niveauGlobal === 'success') niveauGlobal = 'warning';
    alertes.push({ niveau: 'warning', section: 'OETH', message: `Obligation d'emploi non atteinte — contribution AGEFIPH estimée ${round(oeth.contributionEstimee).toLocaleString('fr-FR')} €.` });
  }
  if (!securite.saisi) {
    alertes.push({ niveau: 'warning', section: 'Sécurité', message: 'Données accidents du travail non saisies — la section "Conditions d\'hygiène et de sécurité" est obligatoire au CSE.' });
    if (niveauGlobal === 'success') niveauGlobal = 'warning';
  }
  if (completude < 80) {
    alertes.push({ niveau: 'warning', section: 'Complétude', message: `${sectionsRenseignees}/${sectionsTotal} sections renseignées — compléter les sections manquantes avant présentation au CSE/AG.` });
  }

  return {
    exercice: anneeRef,
    sections: {
      effectifs,
      remunerations,
      pyramide,
      pariteTurnOver,
      oeth,
      formation,
      conditionsTravail: { duer, securite },
    },
    sectionsCompletes,
    sectionsRenseignees,
    sectionsTotal,
    completude,
    alertes,
    niveauGlobal,
  };
};

/**
 * Recommandation contextuelle DAF / DRH selon l'état du bilan social.
 */
export const recommendationBilanSocial = (bilan) => {
  if (!bilan) return '';
  const nbDangers  = bilan.alertes.filter(a => a.niveau === 'danger').length;
  const nbWarnings = bilan.alertes.filter(a => a.niveau === 'warning').length;
  if (nbDangers > 0) {
    return `✕ ${nbDangers} alerte${nbDangers > 1 ? 's' : ''} critique${nbDangers > 1 ? 's' : ''} — réviser avant présentation au CSE / AG. La direction est légalement engagée sur les manquements DUER et sécurité au travail.`;
  }
  if (bilan.completude < 80) {
    return `⚠ Bilan partiel (${bilan.completude} % des sections renseignées) — compléter les saisies manquantes (notamment AT/MP) avant présentation officielle.`;
  }
  if (nbWarnings > 0) {
    return `⚠ ${nbWarnings} point${nbWarnings > 1 ? 's' : ''} de vigilance — accompagner la présentation par un plan d'action documenté.`;
  }
  return `✓ Bilan social complet (${bilan.completude} %) et conforme. Présentation CSE/AG validée — archiver avec les PV.`;
};
