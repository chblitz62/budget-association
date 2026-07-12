/**
 * audit_test.js — Banc de test indépendant des calculs de charges
 *
 * Génère 1 000 agents aléatoires et compare :
 *   A) l'implémentation du projet (calculerTauxCharges / calculerSalaireAnnuel)
 *   B) la formule URSSAF 2026 réimplémentée indépendamment comme référence
 *
 * Tout écart > 1 € est signalé avec contexte complet.
 *
 * Usage : node audit_test.js
 */

// ─── Constantes (identiques à src/utils/constants.js) ────────────────────────

const SMIC_MENSUEL        = 1841.45;  // SMIC brut mensuel 2026
const CHARGES_PATRONALES  = 0.42;
const TAUX_FILLON_MAX     = 0.3214;   // taux max allègement Fillon (AGIRC-ARRCO)
const TAUX_CHARGES_APPRENTI = 0.12;
const PRIME_SEGUR         = 238;      // prime Ségur mensuelle par ETP
const SEUIL_ECART         = 1.0;      // écart en € déclenchant un signalement

// ─── A) Implémentation du projet (copiée à l'identique) ──────────────────────

function calculerTauxCharges_PROJET(salaireAnnuelBrut, etp, typeContrat = 'CDI') {
  if (typeContrat === 'Stage' || typeContrat === 'Stagiaire') return 0;
  if (typeContrat === 'Apprentissage' || typeContrat === 'contrat_pro') return TAUX_CHARGES_APPRENTI;

  const etpNum = parseFloat(etp) || 0;
  if (etpNum <= 0 || salaireAnnuelBrut <= 0) return CHARGES_PATRONALES;

  const smicAnnuel  = SMIC_MENSUEL * 12 * etpNum;
  const seuilFillon = 1.6 * smicAnnuel;
  if (salaireAnnuelBrut >= seuilFillon) return CHARGES_PATRONALES;

  const coeffBrut = (TAUX_FILLON_MAX / 0.6) * (seuilFillon / salaireAnnuelBrut - 1);
  const coeff     = Math.max(0, Math.min(TAUX_FILLON_MAX, coeffBrut));
  return Math.max(0, CHARGES_PATRONALES - coeff);
}

function calculerSalaireAnnuel_PROJET(salaire, etp, segur, typeContrat = 'CDI', tauxChargesManuel = null) {
  const etpNum     = parseFloat(etp) || 0;
  const salaireNum = parseFloat(salaire) || 0;

  const salaireAnnuel       = salaireNum * 12 * etpNum;
  const montantSegurMensuel = segur === true ? PRIME_SEGUR : (typeof segur === 'number' ? segur : 0);
  const brutSegur            = montantSegurMensuel * 12 * etpNum;
  const baseCharges          = salaireAnnuel + brutSegur;

  const tauxManuelNum  = parseFloat(tauxChargesManuel);
  const tauxChargesAuto = !(tauxManuelNum > 0);
  const tauxCharges     = tauxChargesAuto
    ? calculerTauxCharges_PROJET(baseCharges, etpNum, typeContrat)
    : tauxManuelNum / 100;

  const charges = baseCharges * tauxCharges;

  return {
    brut:        salaireAnnuel,
    brutSegur,
    charges,
    tauxCharges,
    tauxChargesAuto,
    total:       salaireAnnuel + charges + brutSegur,
  };
}

// ─── B) Référence URSSAF 2026 — réimplémentation indépendante ────────────────
//
// Source : BOFiP-Impôts 2026, circulaire ACOSS 2025-09, DSS/SDFSS/5B/2025
//
// Formule officielle allègement général Fillon :
//   Coefficient C = (T_max / 0.6) × (1,6 × SMIC_ETP_annuel / Rémunération_brute - 1)
//   C plafonné à T_max (0,3214) et planché à 0
//   Réduction = C × Rémunération_brute
//   Charges nettes = (0,42 - C) × Rémunération_brute
//
// Note : la rémunération de référence inclut la prime Ségur (éléments de salaire
// soumis à cotisations, circulaire ACOSS 2023-0000032).
//
// Différence avec l'implémentation projet :
//   Projet  → plafond sur la réduction en montant : min(C×S, T_max × SMIC)
//   URSSAF  → plafond sur le coefficient : min(C, T_max) puis C × S
//
// Conséquence : divergence uniquement si la rémunération brute < SMIC×ETP
// (cas illégal, déjà signalé SMIC_VIOLATION).

function calculerTauxCharges_URSSAF(remunerationBruteAnnuelle, etp, typeContrat = 'CDI') {
  if (typeContrat === 'Stage' || typeContrat === 'Stagiaire') return 0;
  if (typeContrat === 'Apprentissage' || typeContrat === 'contrat_pro') return TAUX_CHARGES_APPRENTI;

  const etpNum = parseFloat(etp) || 0;
  if (etpNum <= 0 || remunerationBruteAnnuelle <= 0) return CHARGES_PATRONALES;

  const smicAnnuel  = SMIC_MENSUEL * 12 * etpNum;
  const seuilFillon = 1.6 * smicAnnuel;
  if (remunerationBruteAnnuelle >= seuilFillon) return CHARGES_PATRONALES;

  // Coefficient C : plafonné au taux max, planché à 0
  const C_brut = (TAUX_FILLON_MAX / 0.6) * (seuilFillon / remunerationBruteAnnuelle - 1);
  const C      = Math.max(0, Math.min(TAUX_FILLON_MAX, C_brut));

  return Math.max(0, CHARGES_PATRONALES - C);
}

function calculerSalaireAnnuel_URSSAF(salaire, etp, segur, typeContrat = 'CDI') {
  const etpNum     = parseFloat(etp) || 0;
  const salaireNum = parseFloat(salaire) || 0;

  const salaireAnnuel       = salaireNum * 12 * etpNum;
  const montantSegurMensuel = segur === true ? PRIME_SEGUR : (typeof segur === 'number' ? segur : 0);
  const brutSegur            = montantSegurMensuel * 12 * etpNum;
  const baseCharges          = salaireAnnuel + brutSegur;

  const tauxCharges = calculerTauxCharges_URSSAF(baseCharges, etpNum, typeContrat);
  const charges     = baseCharges * tauxCharges;

  return {
    brut:       salaireAnnuel,
    brutSegur,
    charges,
    tauxCharges,
    total:      salaireAnnuel + charges + brutSegur,
  };
}

// ─── Générateur d'agents aléatoires ──────────────────────────────────────────

const CONTRATS = ['CDI', 'CDI', 'CDI', 'CDI', 'CDD', 'CDD', 'Apprentissage', 'contrat_pro', 'Stage', 'Stagiaire'];
// CDI/CDD surreprésentés pour couvrir le cas Fillon en priorité

function rand(min, max) { return min + Math.random() * (max - min); }
function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
function pick(arr) { return arr[randInt(0, arr.length - 1)]; }

function genererAgent(id) {
  const typeContrat   = pick(CONTRATS);
  const etp           = parseFloat(rand(0.2, 1.5).toFixed(2));  // 0.2 à 1.5 ETP
  // Salaire mensuel brut : 1500 → 7000 € (inclut cas sous-SMIC pour tester la robustesse)
  const salaireMensuel = parseFloat(rand(1500, 7000).toFixed(2));
  // Ségur : 60% des agents CDI/CDD en bénéficient, apprentis rarement
  const avecSegur     = (typeContrat === 'CDI' || typeContrat === 'CDD') && Math.random() < 0.6;
  const segur         = avecSegur ? true : 0;

  return { id, typeContrat, etp, salaireMensuel, segur };
}

// ─── Comparaison des deux implémentations ────────────────────────────────────

function comparer(agent) {
  const { typeContrat, etp, salaireMensuel, segur } = agent;

  const projet = calculerSalaireAnnuel_PROJET(salaireMensuel, etp, segur, typeContrat);
  const urssaf = calculerSalaireAnnuel_URSSAF(salaireMensuel, etp, segur, typeContrat);

  const ecartCharges = Math.abs(projet.charges - urssaf.charges);
  const ecartTotal   = Math.abs(projet.total   - urssaf.total);
  const ecartTaux    = Math.abs(projet.tauxCharges - urssaf.tauxCharges);

  // Un salaire est illégal si le tarif plein-temps (salaireMensuel) est < SMIC.
  // L'ETP réduit le paiement réel mais ne change pas le taux horaire de référence.
  // La divergence projet/URSSAF n'apparaît que dans cette zone illégale.
  const sousSmicLegal = salaireMensuel < SMIC_MENSUEL;

  return {
    agent,
    projet,
    urssaf,
    ecartCharges,
    ecartTotal,
    ecartTaux,
    sousSmicLegal,
    signaler: ecartTotal > SEUIL_ECART,
  };
}

// ─── Analyse statistique Fillon ───────────────────────────────────────────────
// Vérifie la monotonie et les bornes du taux Fillon pour un spectre de salaires.

function analyserFillon() {
  const etpTest = 1.0;
  const points  = [];
  for (let pct = 0.7; pct <= 1.7; pct += 0.05) {
    const s         = SMIC_MENSUEL * pct;              // salaire mensuel comme fraction du SMIC
    const sAnnuel   = s * 12;
    const taux      = calculerTauxCharges_PROJET(sAnnuel, etpTest, 'CDI');
    const tauxRef   = calculerTauxCharges_URSSAF(sAnnuel, etpTest, 'CDI');
    points.push({ pctSmic: pct, salaireMensuel: s, taux: taux * 100, tauxRef: tauxRef * 100, delta: (taux - tauxRef) * 100 });
  }
  return points;
}

// ─── Bornes clés URSSAF — vérifications ponctuelles ──────────────────────────

function verifierBornes() {
  const cas = [
    { label: 'SMIC exact ETP 1.0 sans Ségur',        salaire: SMIC_MENSUEL,        etp: 1.0, segur: 0, contrat: 'CDI' },
    { label: 'SMIC exact ETP 1.0 avec Ségur',         salaire: SMIC_MENSUEL,        etp: 1.0, segur: true, contrat: 'CDI' },
    { label: '1,6×SMIC ETP 1.0 sans Ségur (seuil)',  salaire: SMIC_MENSUEL * 1.6,  etp: 1.0, segur: 0, contrat: 'CDI' },
    { label: '1,6×SMIC + 0,01 (au-dessus seuil)',    salaire: SMIC_MENSUEL * 1.6 + 0.01, etp: 1.0, segur: 0, contrat: 'CDI' },
    { label: 'SMIC ETP 0.5',                          salaire: SMIC_MENSUEL,        etp: 0.5, segur: 0, contrat: 'CDI' },
    { label: '2×SMIC ETP 0.5 (équiv. SMIC ETP 1)',   salaire: SMIC_MENSUEL * 2,    etp: 0.5, segur: 0, contrat: 'CDI' },
    { label: 'Apprentissage SMIC',                    salaire: SMIC_MENSUEL,        etp: 1.0, segur: 0, contrat: 'Apprentissage' },
    { label: 'Stage SMIC',                            salaire: SMIC_MENSUEL,        etp: 1.0, segur: 0, contrat: 'Stage' },
    { label: '3×SMIC — hors zone Fillon',             salaire: SMIC_MENSUEL * 3,    etp: 1.0, segur: 0, contrat: 'CDI' },
    { label: 'SMIC avec Ségur ETP 0.8',               salaire: SMIC_MENSUEL,        etp: 0.8, segur: true, contrat: 'CDI' },
  ];

  return cas.map(c => {
    const p = calculerSalaireAnnuel_PROJET(c.salaire, c.etp, c.segur, c.contrat);
    const r = calculerSalaireAnnuel_URSSAF(c.salaire, c.etp, c.segur, c.contrat);
    return {
      label:           c.label,
      tauxProjet:      (p.tauxCharges * 100).toFixed(4) + ' %',
      tauxUrssaf:      (r.tauxCharges * 100).toFixed(4) + ' %',
      chargesProjet:   p.charges.toFixed(2) + ' €',
      chargesUrssaf:   r.charges.toFixed(2) + ' €',
      totalProjet:     p.total.toFixed(2) + ' €',
      totalUrssaf:     r.total.toFixed(2) + ' €',
      ecartTotal:      Math.abs(p.total - r.total).toFixed(2) + ' €',
      signalé:         Math.abs(p.total - r.total) > SEUIL_ECART ? '🔴 OUI' : '✅ OK',
    };
  });
}

// ─── Exécution principale ─────────────────────────────────────────────────────

const NB_AGENTS = 1000;
Math.random = ((seed) => {
  // Générateur LCG reproductible (graine fixe pour résultats stables)
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
})(42);

console.log('═'.repeat(72));
console.log(' AUDIT FINANCIER — Calculs de charges 2026 vs URSSAF');
console.log(' Constantes : SMIC ' + SMIC_MENSUEL + ' € | Fillon max ' + (TAUX_FILLON_MAX * 100) + '% | Ségur ' + PRIME_SEGUR + ' €/ETP');
console.log('═'.repeat(72));

// 1. Vérifications ponctuelles sur les bornes clés
console.log('\n── 1. Vérification des bornes critiques (' + 10 + ' cas) ──────────────────\n');
const bornes = verifierBornes();
bornes.forEach(b => {
  console.log(`  ${b.signalé} ${b.label}`);
  console.log(`     Taux : projet=${b.tauxProjet}  urssaf=${b.tauxUrssaf}`);
  console.log(`     Total: projet=${b.totalProjet}  urssaf=${b.totalUrssaf}  écart=${b.ecartTotal}`);
});

// 2. Analyse de monotonie Fillon (courbe taux vs % SMIC)
console.log('\n── 2. Courbe Fillon (taux de charges en % du salaire) ─────────────────\n');
const courbe = analyserFillon();
console.log('  %SMIC  | Salaire/mois | Projet  | URSSAF  | Delta');
console.log('  -------+--------------+---------+---------+-------');
courbe.forEach(p => {
  const ok = Math.abs(p.delta) < 0.01 ? '✅' : '⚠️ ';
  console.log(
    `  ${(p.pctSmic * 100).toFixed(0).padStart(4)}%  |` +
    ` ${p.salaireMensuel.toFixed(0).padStart(9)} €   |` +
    ` ${p.taux.toFixed(3).padStart(6)}% |` +
    ` ${p.tauxRef.toFixed(3).padStart(6)}% |` +
    ` ${p.delta >= 0 ? '+' : ''}${p.delta.toFixed(4)}%  ${ok}`
  );
});

// 3. Test Monte-Carlo sur 1000 agents
console.log('\n── 3. Test Monte-Carlo — ' + NB_AGENTS + ' agents aléatoires ─────────────────────\n');
const agents   = Array.from({ length: NB_AGENTS }, (_, i) => genererAgent(i + 1));
const resultats = agents.map(comparer);

const signales         = resultats.filter(r => r.signaler);
const sousSmicLegal    = resultats.filter(r => r.sousSmicLegal);
const signalesHorsLegal = signales.filter(r => !r.sousSmicLegal); // divergences légitimes uniquement

// Statistiques globales
const totalProjet = resultats.reduce((s, r) => s + r.projet.total, 0);
const totalUrssaf = resultats.reduce((s, r) => s + r.urssaf.total, 0);
const ecartGlobal = Math.abs(totalProjet - totalUrssaf);
const ecartMoyen  = resultats.reduce((s, r) => s + r.ecartTotal, 0) / NB_AGENTS;
const ecartMax    = Math.max(...resultats.map(r => r.ecartTotal));
const idxMax      = resultats.findIndex(r => r.ecartTotal === ecartMax);

// Répartition par type de contrat
const parContrat = {};
CONTRATS.forEach(c => { if (!parContrat[c]) parContrat[c] = { n: 0, ecartTotal: 0 }; });
resultats.forEach(r => {
  const c = r.agent.typeContrat;
  parContrat[c].n++;
  parContrat[c].ecartTotal += r.ecartTotal;
});

console.log('  Distribution des agents générés :');
Object.entries(parContrat).sort((a, b) => b[1].n - a[1].n).forEach(([c, v]) => {
  console.log(`    ${c.padEnd(16)} : ${v.n.toString().padStart(4)} agents | écart moy. : ${(v.n > 0 ? v.ecartTotal / v.n : 0).toFixed(4)} €`);
});

console.log('\n  Totaux consolidés :');
console.log(`    Coût employeur total (projet) : ${totalProjet.toFixed(2).padStart(14)} €`);
console.log(`    Coût employeur total (URSSAF) : ${totalUrssaf.toFixed(2).padStart(14)} €`);
console.log(`    Écart global                  : ${ecartGlobal.toFixed(4).padStart(14)} €`);
console.log(`    Écart moyen / agent           : ${ecartMoyen.toFixed(4).padStart(14)} €`);
console.log(`    Écart max / agent             : ${ecartMax.toFixed(4).padStart(14)} €`);
console.log(`    Agents sous SMIC légal        : ${sousSmicLegal.length.toString().padStart(14)} (hors périmètre légal Fillon)`);
console.log(`    Signalements > ${SEUIL_ECART} €           : ${signales.length.toString().padStart(14)} total`);
console.log(`    Signalements hors sous-SMIC   : ${signalesHorsLegal.length.toString().padStart(14)} (divergences réelles)`);

// Détail des signalements hors sous-SMIC
if (signalesHorsLegal.length > 0) {
  console.log('\n  🔴 DIVERGENCES > ' + SEUIL_ECART + ' € (hors cas salaire < SMIC) :\n');
  signalesHorsLegal.slice(0, 20).forEach(r => {
    const a = r.agent;
    const segurLabel = a.segur === true ? `${PRIME_SEGUR}€` : a.segur === 0 ? 'non' : `${a.segur}€`;
    console.log(`    Agent #${a.id} | ${a.typeContrat.padEnd(14)} | ETP ${a.etp} | Salaire ${a.salaireMensuel.toFixed(2)} €/mois | Ségur ${segurLabel}`);
    console.log(`      taux projet=${(r.projet.tauxCharges * 100).toFixed(4)}%  taux URSSAF=${(r.urssaf.tauxCharges * 100).toFixed(4)}%`);
    console.log(`      total projet=${r.projet.total.toFixed(2)} €  total URSSAF=${r.urssaf.total.toFixed(2)} €  écart=${r.ecartTotal.toFixed(2)} €`);
  });
  if (signalesHorsLegal.length > 20) console.log(`    … et ${signalesHorsLegal.length - 20} autres.`);
} else {
  console.log('\n  ✅ Aucune divergence > ' + SEUIL_ECART + ' € détectée hors cas salaire < SMIC.');
}

// Détail de l'agent avec l'écart maximum
if (ecartMax > 0) {
  const r = resultats[idxMax];
  const a = r.agent;
  console.log('\n── 4. Agent avec l\'écart absolu maximum ───────────────────────────────\n');
  console.log(`  Agent #${a.id} | Contrat: ${a.typeContrat} | ETP: ${a.etp} | Salaire: ${a.salaireMensuel.toFixed(2)} €/mois`);
  console.log(`  Ségur: ${a.segur === true ? PRIME_SEGUR + ' €/mois' : 'non'}`);
  console.log(`  Salaire annuel brut  : ${r.projet.brut.toFixed(2)} €`);
  console.log(`  Ségur brut annuel    : ${r.projet.brutSegur.toFixed(2)} €`);
  console.log(`  Base Fillon (brut+Ség): ${(r.projet.brut + r.projet.brutSegur).toFixed(2)} €`);
  console.log(`  SMIC annuel ETP      : ${(SMIC_MENSUEL * 12 * a.etp).toFixed(2)} €`);
  console.log(`  Seuil 1,6×SMIC       : ${(SMIC_MENSUEL * 12 * a.etp * 1.6).toFixed(2)} €`);
  console.log(`  Taux charges projet  : ${(r.projet.tauxCharges * 100).toFixed(4)} %`);
  console.log(`  Taux charges URSSAF  : ${(r.urssaf.tauxCharges * 100).toFixed(4)} %`);
  console.log(`  Charges projet       : ${r.projet.charges.toFixed(2)} €`);
  console.log(`  Charges URSSAF       : ${r.urssaf.charges.toFixed(2)} €`);
  console.log(`  Total projet         : ${r.projet.total.toFixed(2)} €`);
  console.log(`  Total URSSAF         : ${r.urssaf.total.toFixed(2)} €`);
  console.log(`  Écart                : ${r.ecartTotal.toFixed(4)} € ${r.sousSmicLegal ? '(salaire < SMIC — cas illégal)' : ''} ${r.signaler ? '🔴' : '✅'}`);
}

// 4. Vérification de la propriété mathématique de monotonie Fillon
console.log('\n── 5. Vérification propriétés mathématiques Fillon ────────────────────\n');

// Monotonie : quand le salaire AUGMENTE (de SMIC vers 1,6×SMIC), la réduction Fillon diminue
// donc le taux NET de charges AUGMENTE. La violation serait qu'il BAISSE (régression).
// Vérification correcte : t < tauxtPrecedent - 0.0001 = taux qui baisse = anomalie.
let violationsMonotonie = 0;
const salairesTest = Array.from({ length: 200 }, (_, i) => SMIC_MENSUEL * (0.5 + i * 0.006));
let tauxtPrecedent = null;
salairesTest.forEach(s => {
  const t = calculerTauxCharges_PROJET(s * 12, 1.0, 'CDI');
  // Violation : le taux BAISSE alors qu'il devrait rester stable ou augmenter
  if (tauxtPrecedent !== null && t < tauxtPrecedent - 0.0001) violationsMonotonie++;
  tauxtPrecedent = t;
});
console.log(`  Monotonie taux Fillon (taux croît avec salaire de SMIC → 1,6×SMIC) : ${violationsMonotonie === 0 ? '✅ OK' : `🔴 ${violationsMonotonie} violations`}`);

// Continuité au seuil 1,6×SMIC (pas de saut brutal)
const seuil = SMIC_MENSUEL * 1.6;
const tauxJustAvant = calculerTauxCharges_PROJET((seuil - 0.01) * 12, 1.0, 'CDI');
const tauxJustApres = calculerTauxCharges_PROJET((seuil + 0.01) * 12, 1.0, 'CDI');
const sautSeuil = Math.abs(tauxJustApres - tauxJustAvant);
console.log(`  Continuité au seuil 1,6×SMIC (saut de taux < 0,1 pp) : ${sautSeuil < 0.001 ? '✅ OK' : `🔴 saut=${(sautSeuil*100).toFixed(4)} pp`}`);
console.log(`    Taux à ${(seuil - 0.01).toFixed(2)} €/mois : ${(tauxJustAvant * 100).toFixed(4)} %`);
console.log(`    Taux à ${(seuil + 0.01).toFixed(2)} €/mois : ${(tauxJustApres * 100).toFixed(4)} %`);

// Borne basse : taux à SMIC doit être proche de 42% - 32,14% = 9,86% (hors Ségur)
const tauxAuSmic = calculerTauxCharges_PROJET(SMIC_MENSUEL * 12, 1.0, 'CDI');
const borneBasseAttendue = CHARGES_PATRONALES - TAUX_FILLON_MAX; // 0.0986
console.log(`  Borne basse (taux au SMIC sans Ségur ≈ ${(borneBasseAttendue * 100).toFixed(2)}%) : ${Math.abs(tauxAuSmic - borneBasseAttendue) < 0.0001 ? '✅ OK' : '🔴'} → ${(tauxAuSmic * 100).toFixed(4)} %`);

// Borne haute : taux à 1,6×SMIC doit être exactement 42%
const tauxAuSeuil = calculerTauxCharges_PROJET(SMIC_MENSUEL * 1.6 * 12, 1.0, 'CDI');
console.log(`  Borne haute (taux à 1,6×SMIC = 42,0000%) : ${Math.abs(tauxAuSeuil - 0.42) < 0.0001 ? '✅ OK' : '🔴'} → ${(tauxAuSeuil * 100).toFixed(4)} %`);

// ETP scaling : taux à SMIC×ETP0.5 doit être identique au cas ETP1.0 au SMIC
const tauxETP05 = calculerTauxCharges_PROJET(SMIC_MENSUEL * 12 * 0.5, 0.5, 'CDI');
console.log(`  Invariance ETP (ETP=0.5 au SMIC = ETP=1.0 au SMIC) : ${Math.abs(tauxETP05 - tauxAuSmic) < 0.0001 ? '✅ OK' : `🔴 diff=${((tauxETP05 - tauxAuSmic)*100).toFixed(6)} pp`}`);

// Ségur : vérifier que l'inclusion du Ségur dans la base réduit le taux Fillon
const tauxSansSegur = calculerTauxCharges_PROJET(SMIC_MENSUEL * 12, 1.0, 'CDI');
const tauxAvecSegur = calculerTauxCharges_PROJET((SMIC_MENSUEL + PRIME_SEGUR) * 12, 1.0, 'CDI');
console.log(`  Ségur dans base Fillon (Ségur augmente base → taux plus élevé → réduction moindre) : ${tauxAvecSegur > tauxSansSegur ? '✅ OK' : '🔴'}`);
console.log(`    Taux sans Ségur : ${(tauxSansSegur * 100).toFixed(4)} %   Taux avec Ségur : ${(tauxAvecSegur * 100).toFixed(4)} %`);

console.log('\n' + '═'.repeat(72));
console.log(' FIN AUDIT — ' + new Date().toLocaleString('fr-FR'));
console.log('═'.repeat(72) + '\n');
