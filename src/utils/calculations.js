import { CHARGES_PATRONALES, TAUX_CHARGE_TOTAL, PRIME_SEGUR, JOURS_ANNEE, JOURS_OUVRES_AN, JOURS_CONGES_LEGAL, JOURS_CARENCE_MALADIE, CHARGES_VACATAIRE, SEUIL_HEURES_VACATAIRE, SEUIL_RATIO_VACATAIRE, calculerStatsFormation, SMIC_MENSUEL, TAUX_FILLON_MAX, TAUX_CHARGES_APPRENTI, TAUX_TAXE_SALAIRES, SEUIL_TAXE_SALAIRES_T2, SEUIL_TAXE_SALAIRES_T3, TAUX_TAXE_SALAIRES_T2, TAUX_TAXE_SALAIRES_T3, FILIERES_DEFAULT } from './constants';

/**
 * Ventile l'enveloppe de formation nette par filière selon les clés de répartition.
 *
 * Formule par filière :
 *   enveloppe = (subvention × clé%) − (salaires × clé%) − (exploitation × clé%)
 *   soit      = (subvention − salaires − exploitation) × clé%
 *
 * @param {Array}  filieres           - Tableau de { id, label, cle } (%, somme = 100)
 * @param {number} subventionTotal    - Subvention Région sur agents éligibles (€/an)
 * @param {number} salairesTotaux     - Masse salariale totale toutes entités (€/an)
 * @param {number} exploitationTotale - Charges d'exploitation totales toutes entités (€/an)
 * @returns {{
 *   enveloppeGlobale: number,
 *   chargesTotales: number,
 *   lignes: Array<{ id, label, cle, subvention, salaires, exploitation, charges, enveloppe, mensuel }>
 * }}
 */
export const calculerEnveloppeParFiliere = (filieres, subventionTotal, salairesTotaux, exploitationTotale = 0) => {
  const src = filieres?.length > 0 ? filieres : FILIERES_DEFAULT;
  const chargesTotales  = salairesTotaux + exploitationTotale;
  const enveloppeGlobale = subventionTotal - chargesTotales;
  const lignes = src.map(f => {
    const cle         = parseFloat(f.cle) || 0;
    const subvention  = subventionTotal    * cle / 100;
    const salaires    = salairesTotaux     * cle / 100;
    const exploitation = exploitationTotale * cle / 100;
    const charges     = chargesTotales     * cle / 100;
    const enveloppe   = enveloppeGlobale   * cle / 100;
    return { id: f.id, label: f.label, cle, subvention, salaires, exploitation, charges, enveloppe, mensuel: enveloppe / 12 };
  });
  return { enveloppeGlobale, chargesTotales, lignes };
};

// Normalise une saisie en notation française (2.500 → 2500, 2 500,50 → 2500.5)
const parseLocaleNumber = (valeur) => {
  if (typeof valeur === 'number') return valeur;
  const s = String(valeur).trim()
    .replace(/[€%$£]/g, '')   // symboles monétaires / pourcentage
    .replace(/\s/g, '');       // espaces (y compris insécables \u00a0)
  const lastDot = s.lastIndexOf('.');
  const lastComma = s.lastIndexOf(',');
  let normalized;
  if (lastComma > lastDot) {
    // virgule = séparateur décimal : "2.500,50" → "2500.50"
    normalized = s.replace(/\./g, '').replace(',', '.');
  } else if (lastDot > lastComma) {
    const afterDot = s.slice(lastDot + 1);
    // point suivi de 3 chiffres = séparateur de milliers : "2.500" → "2500"
    if (/^\d{3}$/.test(afterDot)) normalized = s.replace(/\./g, '');
    else normalized = s.replace(/,/g, '');
  } else {
    normalized = s;
  }
  return parseFloat(normalized);
};

/**
 * Norme une saisie en float, accepte la notation française (virgule décimale, espaces milliers).
 * Retourne `min` si la valeur est vide ou non numérique.
 * @param {string|number} valeur
 * @param {number} [min=0]
 * @param {number} [max=Infinity]
 * @returns {number}
 */
export const validerNombre = (valeur, min = 0, max = Infinity) => {
  const num = parseLocaleNumber(valeur);
  if (isNaN(num)) return min;
  return Math.min(Math.max(num, min), max);
};

/**
 * Identique à `validerNombre` mais tronque à l'entier (pas de décimales).
 * @param {string|number} valeur
 * @param {number} [min=0]
 * @param {number} [max=Infinity]
 * @returns {number}
 */
export const validerEntier = (valeur, min = 0, max = Infinity) => {
  const num = Math.trunc(parseLocaleNumber(valeur));
  if (isNaN(num)) return min;
  return Math.min(Math.max(num, min), max);
};

/** @param {string|number} valeur @returns {number} Taux en % [0–100] */
export const validerTaux = (valeur) => validerNombre(valeur, 0, 100);
/** @param {string|number} valeur @returns {number} ETP [0–100] */
export const validerETP = (valeur) => validerNombre(valeur, 0, 100);
/** @param {string|number} valeur @returns {number} Salaire brut mensuel [0–50 000 €] (décimales acceptées) */
export const validerSalaire = (valeur) => validerNombre(valeur, 0, 50000);
/** @param {string|number} valeur @returns {number} Montant entier positif [0–10 M€] */
export const validerMontant = (valeur) => validerEntier(valeur, 0, 10000000);
/** @param {string|number} valeur @returns {number} Montant entier signé [−10 M€ – +10 M€] */
export const validerMontantSigne = (valeur) => validerEntier(valeur, -10000000, 10000000);
/** @param {string|number} valeur @returns {number} Durée d'amortissement en années [1–50] */
export const validerDuree = (valeur) => validerEntier(valeur, 1, 50);

/**
 * Calcule la taxe sur les salaires pour un agent (CGI art. 231 — barème progressif 2026).
 * Barème : ≤ 8 572 € → 4,25 % | 8 572–17 114 € → 8,50 % | > 17 114 € → 13,60 %
 * @param {number} brutAnnuel - Brut versé annuel (salaire + Ségur + primes) d'un seul agent
 * @returns {number} Taxe sur les salaires due pour cet agent
 */
export const calculerTaxeSalairesProgressif = (brutAnnuel) => {
  if (brutAnnuel <= 0) return 0;
  const t1 = Math.min(brutAnnuel, SEUIL_TAXE_SALAIRES_T2) * TAUX_TAXE_SALAIRES;
  const t2 = brutAnnuel > SEUIL_TAXE_SALAIRES_T2
    ? Math.min(brutAnnuel - SEUIL_TAXE_SALAIRES_T2, SEUIL_TAXE_SALAIRES_T3 - SEUIL_TAXE_SALAIRES_T2) * TAUX_TAXE_SALAIRES_T2
    : 0;
  const t3 = brutAnnuel > SEUIL_TAXE_SALAIRES_T3
    ? (brutAnnuel - SEUIL_TAXE_SALAIRES_T3) * TAUX_TAXE_SALAIRES_T3
    : 0;
  return t1 + t2 + t3;
};
/** @param {string|number} valeur @returns {number} Nombre de jours [0–365] */
export const validerJours = (valeur) => validerEntier(valeur, 0, 365);
/** @param {string|number} valeur @returns {number} Nombre d'unités/stagiaires [1–1 000] */
export const validerUnites = (valeur) => validerEntier(valeur, 1, 1000);

/**
 * Calcule la mensualité d'un prêt (formule de l'annuité constante).
 * @param {number} capital       - Montant emprunté en €
 * @param {number} dureeAnnees   - Durée en années
 * @param {number} tauxAnnuel    - Taux annuel en % (ex: 3.5 pour 3,5 %)
 * @returns {number} Mensualité en €
 */
export const calculerMensualitePret = (capital, dureeAnnees, tauxAnnuel) => {
  if (tauxAnnuel === 0 || capital === 0) return 0;
  const tauxMensuel = tauxAnnuel / 100 / 12;
  const nombreMois = dureeAnnees * 12;
  const mensualite = capital * (tauxMensuel * Math.pow(1 + tauxMensuel, nombreMois)) / (Math.pow(1 + tauxMensuel, nombreMois) - 1);
  return mensualite;
};

// Résout le montant mensuel Ségur d'un agent selon son flag booléen et le montant ETP global.
// Rétrocompatible : si segur est déjà un nombre (ancienne saisie manuelle), l'utilise directement.
const resolveSegur = (agentSegur, montantSegurETP = PRIME_SEGUR) => {
  if (agentSegur === true)  return montantSegurETP;
  if (!agentSegur)          return 0;
  return parseFloat(agentSegur) || 0; // ancien format numérique conservé
};

// ─── ALLÈGEMENTS DE CHARGES PATRONALES ───────────────────────────────────────

/**
 * Calcule le taux de charges patronales réel selon le type de contrat et le salaire.
 * - Stage / Stagiaire : 0 % (seule la gratification est due)
 * - Apprentissage / Contrat pro : ~12 % (cotisations réduites)
 * - CDI / CDD : 44 % avec allègement Fillon dégressif si salaire < 1,6 × SMIC annuel
 *
 * Formule Fillon officielle :
 *   coeff = (TAUX_FILLON_MAX / 0.6) × (1,6 × SmicAnnuel / SalaireBrut - 1)
 *   réduction = coeff × SalaireBrut, plafonnée à TAUX_FILLON_MAX × SmicAnnuel
 *   taux_net = CHARGES_PATRONALES - réduction / SalaireBrut
 */
export const calculerTauxCharges = (salaireAnnuelBrut, etp, typeContrat = 'CDI', tauxBase = CHARGES_PATRONALES) => {
  if (typeContrat === 'Stage' || typeContrat === 'Stagiaire') return 0;
  if (typeContrat === 'Apprentissage' || typeContrat === 'contrat_pro') return TAUX_CHARGES_APPRENTI;

  const etpNum = parseFloat(etp) || 0;
  if (etpNum <= 0 || salaireAnnuelBrut <= 0) return tauxBase;

  const smicAnnuel = SMIC_MENSUEL * 12 * etpNum;
  const seuilFillon = 1.6 * smicAnnuel;
  if (salaireAnnuelBrut >= seuilFillon) return tauxBase;

  const coeffBrut = (TAUX_FILLON_MAX / 0.6) * (seuilFillon / salaireAnnuelBrut - 1);
  const coeff = Math.max(0, Math.min(TAUX_FILLON_MAX, coeffBrut));
  return Math.max(0, tauxBase - coeff);
};

// Calcul du salaire annuel
/**
 * Calcule le coût annuel employeur d'un agent.
 *
 * Règles appliquées (par priorité) :
 *  1. Si tauxChargesManuel (0-100) est renseigné et > 0 : taux forcé, Fillon ignoré.
 *  2. Sinon : calculerTauxCharges() → Fillon automatique selon contrat + salaire.
 *
 *  - Salaire brut annuel   = salaire mensuel × 12 × ETP
 *  - Prime Ségur           = montant mensuel × ETP  (proratisée ETP, soumise aux charges)
 *  - ETP peut être < 1 (temps partiel) ou > 1 (heures supplémentaires structurelles)
 *
 * Champs retournés :
 *  brut            : salaire brut annuel (hors Ségur, hors charges)
 *  brutSegur       : prime Ségur brute annuelle (montant × 12 × ETP)
 *  charges         : total charges patronales employeur (sur salaire + Ségur)
 *  tauxCharges     : taux effectif appliqué
 *  tauxChargesAuto : true = Fillon / false = taux manuel forcé (utile pour l'UI)
 *  segur           : coût Ségur total employeur (brut + charges patronales sur Ségur)
 *  total           : coût employeur complet = brut + charges + segur
 */
export const calculerSalaireAnnuel = (salaire, etp, segur, typeContrat = 'CDI', tauxChargesManuel = null, dateDebutPrevue = null, moisPrime = null, montantPrime = 0, tauxChargesBase = null) => {
  const etpNum             = parseFloat(etp) || 0;
  const salaireNum         = parseFloat(salaire) || 0;

  // Prorata temporis si poste à pourvoir avec date de début prévue (YYYY-MM)
  let coeffPresence = 1;
  if (dateDebutPrevue && typeof dateDebutPrevue === 'string' && dateDebutPrevue.includes('-')) {
    const startMonth = parseInt(dateDebutPrevue.split('-')[1], 10);
    if (startMonth >= 1 && startMonth <= 12) {
      coeffPresence = (13 - startMonth) / 12;
    }
  }

  // Salaire brut annuel (hors Ségur), proraté si poste à pourvoir
  const salaireAnnuel      = salaireNum * 12 * etpNum * coeffPresence;

  // Prime Ségur : rétrocompat booléen (true → 238 €) ou montant numérique
  const montantSegurMensuel = segur === true ? PRIME_SEGUR
                            : (typeof segur === 'number' ? segur : 0);
  // Ségur brut annuel (proraté ETP et présence)
  const brutSegur           = montantSegurMensuel * 12 * etpNum * coeffPresence;

  // Taux de charges : manuel prioritaire, Fillon automatique sinon
  const baseCharges         = salaireAnnuel + brutSegur;
  const tauxManuelNum       = parseFloat(tauxChargesManuel);
  const tauxChargesAuto     = !(tauxManuelNum > 0);
  const tauxCharges         = tauxChargesAuto
    ? calculerTauxCharges(baseCharges, etpNum * coeffPresence, typeContrat, tauxChargesBase ?? CHARGES_PATRONALES)
    : tauxManuelNum / 100;

  const charges             = baseCharges * tauxCharges;

  // Coût Ségur total employeur = Ségur brut + charges patronales sur Ségur
  const segurEmployeur      = brutSegur * (1 + tauxCharges);

  // Prime exceptionnelle / saisonnière (versée une fois dans l'année)
  const moisPrimeNum        = moisPrime ? parseInt(moisPrime, 10) : null;
  const primeMontantNum     = parseFloat(montantPrime) || 0;
  const primeBrute          = (moisPrimeNum >= 1 && moisPrimeNum <= 12 && primeMontantNum > 0)
    ? primeMontantNum * etpNum * coeffPresence
    : 0;
  const primeEmployeur      = primeBrute * (1 + tauxCharges);

  return {
    brut:            salaireAnnuel,
    brutSegur:       brutSegur,
    charges:         charges,
    tauxCharges:     tauxCharges,
    tauxChargesAuto: tauxChargesAuto,
    segur:           segurEmployeur,
    primeBrute,
    primeEmployeur,
    moisPrime:       moisPrimeNum,
    total:           salaireAnnuel + charges + brutSegur + primeEmployeur,
  };
};

/**
 * Génère le tableau d'amortissement annuel d'un emprunt.
 * @param {number} capital      - Capital en €
 * @param {number} dureeAnnees  - Durée en années
 * @param {number} tauxAnnuel   - Taux annuel en % (0 = remboursement linéaire sans intérêts)
 * @returns {Array<{interets: number, capitalRembourse: number, capitalRestant: number}>}
 */
export const calculerTableauAmortissement = (capital, dureeAnnees, tauxAnnuel) => {
  if (capital === 0 || dureeAnnees === 0) {
    return Array(dureeAnnees).fill({ interets: 0, capitalRembourse: 0, capitalRestant: 0 });
  }

  if (tauxAnnuel === 0) {
    const remboursementAnnuel = capital / dureeAnnees;
    return Array.from({ length: dureeAnnees }, (_, i) => ({
      interets: 0,
      capitalRembourse: remboursementAnnuel,
      capitalRestant: capital - remboursementAnnuel * (i + 1)
    }));
  }

  const tauxMensuel = tauxAnnuel / 100 / 12;
  const nombreMois = dureeAnnees * 12;
  const mensualite = capital * (tauxMensuel * Math.pow(1 + tauxMensuel, nombreMois)) / (Math.pow(1 + tauxMensuel, nombreMois) - 1);

  const tableau = [];
  let capitalRestant = capital;

  for (let annee = 0; annee < dureeAnnees; annee++) {
    let interetsAnnee = 0;
    let capitalAnnee = 0;

    for (let mois = 0; mois < 12; mois++) {
      if (capitalRestant <= 0) break;
      const interetsMois = capitalRestant * tauxMensuel;
      const capitalMois = Math.min(mensualite - interetsMois, capitalRestant);
      interetsAnnee += interetsMois;
      capitalAnnee += capitalMois;
      capitalRestant -= capitalMois;
    }

    tableau.push({
      interets: interetsAnnee,
      capitalRembourse: capitalAnnee,
      capitalRestant: Math.max(0, capitalRestant)
    });
  }

  return tableau;
};

/**
 * Calcule l'amortissement annuel, les intérêts et le coût total d'un investissement.
 * @param {{ montant: number, duree: number, taux: number }} investissement
 * @returns {{
 *   amortissement: number,
 *   mensualite: number,
 *   coutTotal: number,
 *   coutCredit: number,
 *   tableau: Array<{interets: number, capitalRembourse: number, capitalRestant: number}>
 * }}
 */
export const calculerAmortissementEtInterets = (investissement) => {
  const { montant, duree, taux, dateMiseEnService } = investissement;

  // Prorata temporis en année d'acquisition (PCG art. 214-9)
  let prorata = 1;
  if (dateMiseEnService && typeof dateMiseEnService === 'string') {
    const match = dateMiseEnService.match(/^(\d{4})-(\d{2})$/);
    if (match) {
      const moisAcq = parseInt(match[2], 10);
      if (moisAcq >= 1 && moisAcq <= 12) prorata = (13 - moisAcq) / 12;
    }
  }
  const amortissement = duree > 0 ? (montant / duree) * prorata : 0;
  const mensualite = calculerMensualitePret(montant, duree, taux);
  const coutTotal = mensualite * duree * 12;
  const coutCredit = coutTotal - montant;

  const tableauAmort = calculerTableauAmortissement(montant, duree, taux);
  const interetsAnnee1 = tableauAmort.length > 0 ? tableauAmort[0].interets : 0;

  return {
    amortissement,
    interets: interetsAnnee1,
    interetsParAnnee: tableauAmort.map(a => a.interets),
    mensualite,
    coutTotal,
    coutCredit,
    tableauAmort
  };
};

/**
 * Calcule le budget annuel de la Direction / Siège.
 *
 * @param {Object}  direction        - Objet Direction : { personnel[], chargesSiege[], exploitation[], recettes[], investissements }
 * @param {Object|null} planningAbsences - Planning des absences { [YYYY-MM]: { [agentKey]: { [YYYY-MM-DD]: type } } }
 * @param {number}  annee            - Exercice (défaut 2026)
 * @param {number}  montantSegurETP  - Prime Ségur mensuelle pour 1 ETP (€, défaut PRIME_SEGUR = 238 €)
 * @param {Array}   poolRH           - Agents du Pool RH mutualisés (leur quote-part siège est incluse)
 * @param {Object|null} tvaParams    - { gestionTVA: bool, tauxTVAMoyen: number } — null = pas de TVA
 * @param {number}  coefficientBP    - Coefficient BP en % (défaut 100). Appliqué à exploitation et recettes uniquement.
 *                                     La masse salariale n'est JAMAIS multipliée par ce coefficient.
 * @returns {{
 *   salaires: number,          Total masse salariale employeur (salaires + charges + Ségur + Pool RH)
 *   salairesPermanents: number, Masse salariale hors Pool RH
 *   detailsSalaires: Array,    Détail par agent (brut, charges, segur, total, tauxCharges, presence)
 *   detailsPoolRH: Array,      Agents Pool RH affectés à la Direction
 *   chargesSiege: number,      Exploitation totale (legacy alias = exploitation)
 *   exploitation: number,      Exploitation totale ajustée coefficientBP
 *   recettes: number,          Recettes propres ajustées coefficientBP
 *   recettesFD: number,        Part fonds dédiés (Compte 19) dans les recettes
 *   amortissements: number,    Dotations aux amortissements (charge comptable non décaissée)
 *   coutCarenceMaladie: number, Coût des jours de carence (3 jours/épisode, à la charge de l'employeur)
 *   etpContractuel: number,    ETP total contractuel
 *   etpReel: number,           ETP réel (après déduction absences si planningAbsences fourni)
 *   total: number,             Charges totales = salaires + exploitation + amortissements + carence
 *   solde: number,             Résultat = recettes - total
 * }}
 *
 * @note Taxe sur les salaires (calculerBudgetAnnuelMensuel) : appliquée sur `salaires` (total
 *       employeur) par approximation prudente. La base légale est le brut versé (CGI art. 231).
 *       Cela surestime légèrement la taxe (~42% d'excès), ce qui est conservateur.
 */
export const calculerBudgetDirection = (direction, planningAbsences = null, annee = 2026, montantSegurETP = PRIME_SEGUR, poolRH = [], tvaParams = null, coefficientBP = 100, tauxChargesBase = CHARGES_PATRONALES) => {
  if (!direction || typeof direction !== 'object') return { salaires: 0, salairesPermanents: 0, detailsSalaires: [], detailsPoolRH: [], chargesSiege: 0, exploitation: 0, recettes: 0, recettesFD: 0, amortissements: 0, coutCarenceMaladie: 0, etpContractuel: 0, etpReel: 0, total: 0, solde: 0 };
  const detailsSalaires = (direction.personnel || []).filter(Boolean).map(p => {
    const sal = calculerSalaireAnnuel(p.salaire, p.etp, resolveSegur(p.segur, montantSegurETP), p.typeContrat, p.tauxChargesManuel, p.estPosteAPourvoir ? p.dateDebutPrevue : null, p.moisPrime, p.montantPrime, tauxChargesBase);
    const presence = planningAbsences
      ? calculerPresenceAgent(p, 'Direction', planningAbsences, annee)
      : null;
    return {
      titre: p.titre,
      etp: p.etp,
      salaire: p.salaire,
      ...sal,
      presence,
      coutCarence: presence ? presence.coutCarence : 0,
    };
  });

  const salairesPermanents = detailsSalaires.reduce((sum, s) => sum + s.total, 0);
  const coutCarenceMaladie = detailsSalaires.reduce((sum, s) => sum + s.coutCarence, 0);
  const etpContractuel = detailsSalaires.reduce((s, d) => s + parseFloat(d.etp || 0), 0);
  const etpReel = detailsSalaires.reduce((s, d) => s + (d.presence ? d.presence.etpReel : parseFloat(d.etp || 0)), 0);

  // Quote-part Pool RH affectée à la Direction
  const partPool = calculerPartPoolRH(poolRH, 'direction', null, montantSegurETP);
  const totalSalaires = salairesPermanents + partPool.totalSalaires;

  // Exploitation = chargesSiege[] (legacy) + exploitation[] (nouveau) + anciens champs loyer/charges
  const chargesSiegeLeg = direction.chargesSiege
    ? direction.chargesSiege.reduce((sum, c) => sum + _montantReelExploitation(c, tvaParams) * 12, 0)
    : ((direction.loyer || 0) + (direction.charges || 0) + (direction.autresCharges || 0)) * 12;
  const exploitationSup = (direction.exploitation || [])
    .reduce((sum, c) => sum + _montantReelExploitation(c, tvaParams) * 12, 0);
  const exploitation = chargesSiegeLeg + exploitationSup;

  const exploitationRealisee = [
    ...(direction.chargesSiege || []),
    ...(direction.exploitation || []),
  ].reduce((sum, c) => c.realise != null ? sum + c.realise * 12 : sum, 0);

  const recettesRealisees = (direction.recettes || []).reduce((sum, r) => r.realise != null ? sum + r.realise * 12 : sum, 0);
  const hasRealise = (direction.chargesSiege || []).some(c => c.realise != null)
    || (direction.exploitation || []).some(c => c.realise != null)
    || (direction.recettes || []).some(r => r.realise != null);

  // Recettes propres de la direction (total + part fonds dédiés identifiée séparément)
  const recettes = (direction.recettes || [])
    .reduce((sum, r) => sum + (parseFloat(r.montant) || 0), 0) * 12;
  const recettesFD = (direction.recettes || [])
    .filter(r => r.fondsDedie)
    .reduce((sum, r) => sum + (parseFloat(r.montant) || 0) * 12, 0);

  // Amortissements et intérêts (si investissements renseignés)
  let amortissements = 0;
  let interets = 0;
  if (direction.investissements) {
    Object.values(direction.investissements).forEach(inv => {
      if ((inv.montant || 0) > 0 && (inv.duree || 0) > 0) {
        const calc = calculerAmortissementEtInterets(inv);
        amortissements += calc.amortissement;
        interets += calc.interets;
      }
    });
  }

  const bpCoeff = coefficientBP / 100;
  const exploitationAj = exploitation * bpCoeff;
  const recettesAj = recettes * bpCoeff;
  const recettesFDAj = recettesFD * bpCoeff;
  const total = totalSalaires + exploitationAj + amortissements + interets + coutCarenceMaladie;

  return {
    salaires: totalSalaires,
    salairesPermanents,
    detailsSalaires,
    detailsPoolRH: partPool.details,
    chargesSiege: exploitationAj,
    exploitation: exploitationAj,
    recettes: recettesAj,
    recettesFD: recettesFDAj,
    recettesRealisees,
    exploitationRealisee,
    hasRealise,
    amortissements,
    interets,
    coutCarenceMaladie,
    etpContractuel,
    etpReel,
    total,
    solde: recettesAj - total,
  };
};

/**
 * Calcule le budget annuel d'un Service de formation.
 *
 * @param {Object}  service          - Service : { id, nom, personnel[], exploitation[], recettes[], investissements,
 *                                     vacataires[], promos?, unites?, tauxActivite, budgetVacataires? }
 * @param {Object|null} planningAbsences - Planning absences (même format que calculerBudgetDirection)
 * @param {number}  annee            - Exercice (défaut 2026)
 * @param {number}  montantSegurETP  - Prime Ségur mensuelle pour 1 ETP (€)
 * @param {Array}   poolRH           - Pool RH (quote-part affectée au service incluse dans salaires)
 * @param {Object|null} tvaParams    - Paramètres TVA
 * @param {number}  coefficientBP    - Coefficient BP en % (appliqué à exploitation + recettes uniquement)
 * @returns {{
 *   salaires: number,               Masse salariale totale (permanents + vacataires + Pool RH)
 *   salairesPersonnelPermanent: number,
 *   coutVacataires: number,
 *   coutVacatairesFI: number,       Part vacataires imputée Formation Initiale
 *   coutVacatairesFC: number,       Part vacataires imputée Formation Continue
 *   salairesAllouesFI: number,      Part masse salariale permanents imputée FI (via repartitionFC)
 *   salairesAllouesFC: number,      Complément FC
 *   exploitation: number,           Charges d'exploitation ajustées coefficientBP
 *   recettes: number,               Recettes totales (explicites + subvention Région calculée)
 *   subventionRegionAgents: number, Subvention Région calculée sur les agents éligibles
 *   recettesFD: number,             Part fonds dédiés
 *   amortissements: number,
 *   interets: number,               Intérêts financiers année 1
 *   total: number,                  Charges totales
 *   solde: number,
 *   statsFormation: Object|null,    Statistiques promos (effectifs, abandons, taux rétention)
 *   ratioVacataires: number,        % vacataires / masse salariale totale
 *   alerteRatioVacataires: boolean, true si > SEUIL_RATIO_VACATAIRE (30%)
 * }}
 *
 * @throws Aucune exception — tous les champs manquants sont défensifs (tableau vide, 0)
 */
export const calculerBudgetService = (service, planningAbsences = null, annee = 2026, montantSegurETP = PRIME_SEGUR, poolRH = [], tvaParams = null, coefficientBP = 100, tauxChargesBase = CHARGES_PATRONALES) => {
  if (!service || typeof service !== 'object') return { salaires: 0, salairesPersonnelPermanent: 0, coutVacataires: 0, coutVacatairesFI: 0, coutVacatairesFC: 0, salairesAllouesFI: 0, salairesAllouesFC: 0, detailsSalaires: [], detailsPoolRH: [], detailsVacataires: [], ratioVacataires: 0, alerteRatioVacataires: false, alerteEnveloppe: false, enveloppeVacataires: 0, coutParEtudiant: null, coutCarenceMaladie: 0, etpContractuel: 0, etpReel: 0, exploitation: 0, exploitationRealisee: 0, recettes: 0, subventionRegionAgents: 0, recettesFD: 0, recettesRealisees: 0, hasRealise: false, recettesDetails: [], amortissements: 0, interets: 0, interetsParAnnee: [0,0,0], detailsInvest: {}, unitesAnnuelles: 0, unites: 0, total: 0, solde: 0, coutUnite: 0, totalInvestissements: 0, statsFormation: null };
  // Guards défensifs : exploitation et investissements peuvent être absents sur anciens formats
  if (!Array.isArray(service.exploitation)) service = { ...service, exploitation: [] };
  if (!service.investissements || typeof service.investissements !== 'object') service = { ...service, investissements: {} };
  const detailsSalaires = (service.personnel || []).filter(Boolean).map(p => {
    const sal = calculerSalaireAnnuel(p.salaire, p.etp, resolveSegur(p.segur, montantSegurETP), p.typeContrat, p.tauxChargesManuel, p.estPosteAPourvoir ? p.dateDebutPrevue : null, p.moisPrime, p.montantPrime, tauxChargesBase);
    const presence = planningAbsences
      ? calculerPresenceAgent(p, service.nom, planningAbsences, annee)
      : null;
    return {
      titre: p.titre,
      etp: p.etp,
      salaire: p.salaire,
      segur: p.segur,
      eligibleSubvention: !!p.eligibleSubvention,
      tauxSubvRegion: p.eligibleSubvention ? (p.tauxSubvRegion ?? 100) : 0,
      ...sal,
      presence,
      coutCarence: presence ? presence.coutCarence : 0,
    };
  });

  const salairesPersonnelPermanent = detailsSalaires.reduce((sum, s) => sum + s.total, 0);
  const coutCarenceMaladie = detailsSalaires.reduce((sum, s) => sum + s.coutCarence, 0);
  const etpContractuel = detailsSalaires.reduce((s, d) => s + parseFloat(d.etp || 0), 0);
  const etpReel = detailsSalaires.reduce((s, d) => s + (d.presence ? d.presence.etpReel : parseFloat(d.etp || 0)), 0);

  // Quote-part Pool RH affectée à ce service
  const partPool = calculerPartPoolRH(poolRH, 'service', service.id, montantSegurETP);

  // Vacataires pédagogiques (FC / FI)
  const MOIS_VAC = ['jan','fev','mar','avr','mai','jun','jul','aou','sep','oct','nov','dec'];
  const vacataires = service.vacataires || [];
  const detailsVacataires = vacataires.map(v => {
    // Heures depuis planningMensuel si renseigné, sinon heuresAnnuelles
    const planMois = v.planningMensuel;
    const heuresMensuelles = MOIS_VAC.map(m => parseFloat(planMois?.[m]) || 0);
    const heures = heuresMensuelles.reduce((s, h) => s + h, 0) || (parseFloat(v.heuresAnnuelles) || 0);
    const tauxH = parseFloat(v.tauxHoraire) || 0;
    const charges = parseFloat(v.tauxCharges ?? CHARGES_VACATAIRE) / 100;
    const coutBrut = heures * tauxH;
    const coutCharge = coutBrut * (1 + charges);
    const pctFI = v.type === 'fi' ? 100 : v.type === 'fc' ? 0 : (parseFloat(v.pctFI) || 0);
    const pctFC = 100 - pctFI;
    const coutMensuel = MOIS_VAC.map((m, i) => {
      const h = heuresMensuelles[i] || (heures / 12);
      return h * tauxH * (1 + charges);
    });
    const depasse = heures > SEUIL_HEURES_VACATAIRE;
    const contratExpire = v.dateFin && new Date(v.dateFin) < new Date();
    return { ...v, heures, coutBrut, coutCharge, coutFI: coutCharge * pctFI / 100, coutFC: coutCharge * pctFC / 100, coutMensuel, heuresMensuelles, depasse, contratExpire };
  });
  const coutVacataires = detailsVacataires.reduce((s, v) => s + v.coutCharge, 0);
  const coutVacatairesFI = detailsVacataires.reduce((s, v) => s + v.coutFI, 0);
  const coutVacatairesFC = detailsVacataires.reduce((s, v) => s + v.coutFC, 0);

  const salaires = salairesPersonnelPermanent + coutVacataires + partPool.totalSalaires;

  const moisKeysFI = ['janvier','fevrier','mars','avril','mai','juin','juillet','aout','septembre','octobre','novembre','decembre'];
  // repartitionFC = % mensuel du temps passé en FC (anciennement repartitionFI, sémantique inversée)
  // salairesAllouesFC = part du salaire imputable en FC (reste dans le service)
  // salairesAllouesFI = complément imputable en FI (extrait du budget service)
  let salairesAllouesFC = 0;
  let salairesAllouesFI = 0;
  (service.personnel || []).forEach(p => {
    const rfc = p.repartitionFC || p.repartitionFI; // backward compat
    if (!rfc) return;
    const sal = calculerSalaireAnnuel(p.salaire, p.etp, resolveSegur(p.segur, montantSegurETP), p.typeContrat, p.tauxChargesManuel, p.estPosteAPourvoir ? p.dateDebutPrevue : null, null, 0, tauxChargesBase);
    const pctFC = moisKeysFI.reduce((s, m) => s + (rfc[m] || 0), 0) / 12;
    salairesAllouesFC += sal.total * pctFC / 100;
    salairesAllouesFI += sal.total * (1 - pctFC / 100);
  });

  const exploitation = service.exploitation.reduce((sum, item) => sum + _montantReelExploitation(item, tvaParams) * 12, 0);
  const exploitationRealisee = service.exploitation.reduce((sum, item) => item.realise != null ? sum + item.realise * 12 : sum, 0);

  // Calcul des recettes annuelles (total + part fonds dédiés identifiée séparément)
  const recettesExplicites = service.recettes ? service.recettes.reduce((sum, item) => sum + item.montant * 12, 0) : 0;
  const subventionRegionPersonnel = detailsSalaires.reduce((s, d) =>
    d.eligibleSubvention ? s + d.total * (d.tauxSubvRegion / 100) : s, 0);
  const subventionRegionPool = partPool.details.reduce((s, d) =>
    d.eligibleSubvention ? s + d.coutQuotePart * ((d.tauxSubvRegion ?? 100) / 100) : s, 0);
  const subventionRegionAgents = subventionRegionPersonnel + subventionRegionPool;
  const recettes = recettesExplicites + subventionRegionAgents;
  const recettesFD = (service.recettes || []).filter(r => r.fondsDedie).reduce((sum, r) => sum + r.montant * 12, 0);
  const recettesRealisees = (service.recettes || []).reduce((sum, item) => item.realise != null ? sum + item.realise * 12 : sum, 0);
  const hasRealise = (service.recettes || []).some(r => r.realise != null) || service.exploitation.some(e => e.realise != null);

  let amortissements = 0;
  let interets = 0;
  let totalInvestissements = 0;
  const detailsInvest = {};
  const interetsParAnnee = [0, 0, 0];

  Object.entries(service.investissements).forEach(([key, inv]) => {
    const calc = calculerAmortissementEtInterets(inv);
    amortissements += calc.amortissement;
    interets += calc.interets;
    totalInvestissements += inv.montant;
    detailsInvest[key] = calc;

    for (let i = 0; i < 3; i++) {
      if (calc.interetsParAnnee && calc.interetsParAnnee[i] !== undefined) {
        interetsParAnnee[i] += calc.interetsParAnnee[i];
      }
    }
  });

  // Pour les services de formation, calculer les unités à partir des promos
  let unites = service.unites || 0;
  let statsFormation = null;

  if (service.promos) {
    statsFormation = calculerStatsFormation(service);
    unites = statsFormation.effectifActuel;
  }

  const bpCoeff = coefficientBP / 100;
  const exploitationAj = exploitation * bpCoeff;
  const recettesAj = recettes * bpCoeff;
  const recettesFDAj = recettesFD * bpCoeff;
  const unitesAnnuelles = unites * (service.tauxActivite / 100) * JOURS_ANNEE;
  const totalAvantAmort = salaires + exploitationAj + interets + coutCarenceMaladie;
  const totalCharges = totalAvantAmort + amortissements;
  const solde = recettesAj - totalCharges;
  const coutUnite = unitesAnnuelles > 0 ? totalCharges / unitesAnnuelles : 0;

  // Ratio vacataires / masse salariale totale
  const ratioVacataires = salaires > 0 ? (coutVacataires / salaires) * 100 : 0;
  const alerteRatioVacataires = ratioVacataires > SEUIL_RATIO_VACATAIRE;

  // Enveloppe budgétaire vacataires
  const enveloppeVacataires = parseFloat(service.budgetVacataires) || 0;
  const alerteEnveloppe = enveloppeVacataires > 0 && coutVacataires > enveloppeVacataires;

  // Coût par étudiant (si service a des promos)
  let coutParEtudiant = null;
  if (statsFormation && statsFormation.effectifActuel > 0) {
    const totalChargesService = salaires + exploitationAj;
    const effectifInitial = statsFormation.totalEtudiants || statsFormation.effectifActuel;
    coutParEtudiant = {
      totalCharges: totalChargesService,
      effectif: statsFormation.effectifActuel,
      effectifInitial,
      coutParEtudiant: totalChargesService / statsFormation.effectifActuel,
      coutParEtudiantInitial: effectifInitial > 0 ? totalChargesService / effectifInitial : 0,
      coutVacatairesParEtudiant: coutVacataires > 0 ? coutVacataires / statsFormation.effectifActuel : 0,
    };
  }

  return {
    salaires,
    salairesPersonnelPermanent,
    detailsPoolRH: partPool.details,
    coutVacataires,
    coutVacatairesFI,
    coutVacatairesFC,
    detailsVacataires,
    ratioVacataires,
    alerteRatioVacataires,
    enveloppeVacataires,
    alerteEnveloppe,
    coutParEtudiant,
    salairesAllouesFI,
    salairesAllouesFC,
    detailsSalaires,
    coutCarenceMaladie,
    etpContractuel,
    etpReel,
    exploitation: exploitationAj,
    exploitationRealisee,
    exploitationDetails: service.exploitation,
    recettes: recettesAj,
    subventionRegionAgents,
    recettesFD: recettesFDAj,
    recettesRealisees,
    hasRealise,
    recettesDetails: service.recettes || [],
    amortissements,
    interets,
    interetsParAnnee,
    detailsInvest,
    unitesAnnuelles,
    unites,
    total: totalCharges,
    solde,
    coutUnite,
    totalInvestissements,
    statsFormation
  };
};

// Alias pour compatibilité
export const calculerBudgetLieu = calculerBudgetService;

/**
 * Calcule le budget annuel du Pôle Support (structure mutualisée).
 *
 * Le Pôle Support suit le même modèle que calculerBudgetDirection mais représente
 * une entité organisationnelle distincte (fonctions support transverses).
 * Sa répartition vers les services est gérée via `poleSupport.repartition`.
 *
 * @param {Object}  poleSupport      - { personnel[], exploitation[], recettes[], repartition, investissements }
 * @param {Object|null} planningAbsences - Planning absences
 * @param {number}  annee            - Exercice
 * @param {number}  montantSegurETP  - Prime Ségur mensuelle / ETP (€)
 * @param {Array}   poolRH           - Pool RH mutualisé
 * @param {Object|null} tvaParams    - Paramètres TVA
 * @param {number}  coefficientBP    - Coefficient BP en %
 * @returns {{ salaires, salairesPermanents, detailsSalaires, detailsPoolRH,
 *             exploitation, recettes, recettesFD, amortissements, coutCarenceMaladie,
 *             etpContractuel, etpReel, total, solde }}
 *
 * @note Ségur : appliqué via resolveSegur() identique aux 3 modules (Direction, Service, PôleSupport).
 *       Le montant (238 €/mois par défaut, configurable via globalParams.montantSegurETP) est proratisé
 *       à l'ETP et au temps de présence. Il est soumis aux charges patronales (non Fillon).
 */
export const calculerBudgetPoleSupport = (poleSupport, planningAbsences = null, annee = 2026, montantSegurETP = PRIME_SEGUR, poolRH = [], tvaParams = null, coefficientBP = 100, tauxChargesBase = CHARGES_PATRONALES) => {
  if (!poleSupport || typeof poleSupport !== 'object') return { salaires: 0, salairesPermanents: 0, detailsSalaires: [], detailsPoolRH: [], exploitation: 0, recettes: 0, recettesFD: 0, amortissements: 0, coutCarenceMaladie: 0, etpContractuel: 0, etpReel: 0, total: 0, solde: 0 };
  const detailsSalaires = (poleSupport.personnel || []).filter(Boolean).map(p => {
    const sal = calculerSalaireAnnuel(p.salaire, p.etp, resolveSegur(p.segur, montantSegurETP), p.typeContrat, p.tauxChargesManuel, p.estPosteAPourvoir ? p.dateDebutPrevue : null, p.moisPrime, p.montantPrime, tauxChargesBase);
    const presence = planningAbsences
      ? calculerPresenceAgent(p, 'Pôle Support', planningAbsences, annee)
      : null;
    return {
      titre: p.titre,
      etp: p.etp,
      salaire: p.salaire,
      ...sal,
      presence,
      coutCarence: presence ? presence.coutCarence : 0,
    };
  });
  const salairesPermanents = detailsSalaires.reduce((sum, s) => sum + s.total, 0);
  const coutCarenceMaladie = detailsSalaires.reduce((sum, s) => sum + s.coutCarence, 0);
  const etpContractuel = detailsSalaires.reduce((s, d) => s + parseFloat(d.etp || 0), 0);
  const etpReel = detailsSalaires.reduce((s, d) => s + (d.presence ? d.presence.etpReel : parseFloat(d.etp || 0)), 0);
  const partPool = calculerPartPoolRH(poolRH, 'poleSupport', null, montantSegurETP);
  const salaires = salairesPermanents + partPool.totalSalaires;
  const exploitation = (poleSupport.exploitation || []).reduce((sum, item) => sum + _montantReelExploitation(item, tvaParams) * 12, 0);
  const exploitationRealisee = (poleSupport.exploitation || []).reduce((sum, c) => c.realise != null ? sum + c.realise * 12 : sum, 0);
  const recettesRealisees = (poleSupport.recettes || []).reduce((sum, r) => r.realise != null ? sum + r.realise * 12 : sum, 0);
  const hasRealise = (poleSupport.exploitation || []).some(c => c.realise != null)
    || (poleSupport.recettes || []).some(r => r.realise != null);
  const recettes = (poleSupport.recettes || []).reduce((sum, item) => sum + (parseFloat(item.montant) || 0) * 12, 0);
  const recettesFD = (poleSupport.recettes || []).filter(r => r.fondsDedie).reduce((sum, r) => sum + (parseFloat(r.montant) || 0) * 12, 0);

  // Amortissements + intérêts (prorata temporis PCG art. 214-9)
  let amortissements = 0;
  let interets = 0;
  if (poleSupport.investissements) {
    Object.values(poleSupport.investissements).forEach(inv => {
      if ((inv.montant || 0) > 0 && (inv.duree || 0) > 0) {
        const ai = calculerAmortissementEtInterets(inv);
        amortissements += ai.amortissement;
        interets += ai.interets;
      }
    });
  }

  const bpCoeff = coefficientBP / 100;
  const exploitationAj = exploitation * bpCoeff;
  const recettesAj = recettes * bpCoeff;
  const recettesFDAj = recettesFD * bpCoeff;
  const total = salaires + exploitationAj + amortissements + interets + coutCarenceMaladie;
  return {
    salaires, salairesPermanents, detailsSalaires, detailsPoolRH: partPool.details,
    exploitation: exploitationAj, recettes: recettesAj, recettesFD: recettesFDAj,
    recettesRealisees, exploitationRealisee, hasRealise,
    amortissements, interets, coutCarenceMaladie, etpContractuel, etpReel,
    total,
    solde: recettesAj - total,
  };
};

/**
 * Calcule les provisions de l'association selon les catégories personnalisées.
 *
 * Les provisions sont calculées sur 3 bases configurables (globalParams.provisions[].baseCalcul) :
 *  - 'salaires'       : masse salariale totale consolidée (direction + services + pôle support)
 *  - 'investissements': total des immobilisations de tous les services
 *  - 'chiffre_affaires': total des recettes de tous les services
 *
 * @param {Object} direction    - Direction
 * @param {Array}  services     - Tableau de services
 * @param {Object} globalParams - Paramètres globaux (provisions[], coefficientBP, ...)
 * @param {Object|null} poleSupport
 * @param {Array}  poolRH
 * @returns {{ details: Array, total: number, totalSalaires, totalInvestissements, chiffreAffaires }}
 */
export const calculerProvisions = (direction, services, globalParams, poleSupport = null, poolRH = []) => {
  if (!Array.isArray(services)) services = [];
  const msETP = globalParams.montantSegurETP ?? PRIME_SEGUR;
  const tvaParams = globalParams?.gestionTVA ? { gestionTVA: true, tauxTVAMoyen: globalParams.tauxTVAMoyen ?? 20 } : null;
  const bpCoeff = globalParams?.coefficientBP ?? 100;
  const budgetDir = calculerBudgetDirection(direction, null, 2026, msETP, poolRH, tvaParams, bpCoeff);
  let totalSalaires = budgetDir.salaires;
  let totalInvestissements = 0;
  let chiffreAffaires = 0;

  // Base légale provision congés payés = brut versé (art. L.3141-22) — hors charges patronales
  const _sumBrutDetails = (details) => (details || []).reduce((s, d) => s + (d.brut || 0) + (d.brutSegur || 0) + (d.primeBrute || 0), 0);
  let totalBrutVerse = _sumBrutDetails(budgetDir.detailsSalaires);

  services.forEach(s => {
    const bService = calculerBudgetService(s, null, 2026, msETP, poolRH, tvaParams, bpCoeff);
    totalSalaires += bService.salaires;
    totalInvestissements += bService.totalInvestissements;
    chiffreAffaires += bService.recettes;
    totalBrutVerse += _sumBrutDetails(bService.detailsSalaires);
  });

  if (poleSupport) {
    const bPS = calculerBudgetPoleSupport(poleSupport, null, 2026, msETP, poolRH, tvaParams, bpCoeff);
    totalSalaires += bPS.salaires;
    totalBrutVerse += _sumBrutDetails(bPS.detailsSalaires);
  }

  // Bases de calcul : 'salaires' = brut versé (base légale CP), totalSalaires conservé pour référence
  const bases = {
    salaires: totalBrutVerse,
    investissements: totalInvestissements,
    chiffre_affaires: chiffreAffaires
  };

  // Calcul des provisions personnalisables
  const provisions = globalParams.provisions || [];
  const detailProvisions = provisions.map(prov => {
    const base = bases[prov.baseCalcul] || 0;
    const montant = base * (prov.taux / 100);
    return {
      id: prov.id,
      nom: prov.nom,
      baseCalcul: prov.baseCalcul,
      taux: prov.taux,
      baseValeur: base,
      montant: montant
    };
  });

  const total = detailProvisions.reduce((sum, p) => sum + p.montant, 0);

  return {
    details: detailProvisions,
    total,
    // Valeurs de base pour référence
    totalSalaires,
    totalInvestissements,
    chiffreAffaires
  };
};

/**
 * Calcule le Besoin en Fonds de Roulement (BFR).
 *
 * Formule : BFR = Stocks + Créances clients − Dettes fournisseurs
 *
 * Les délais sont en jours (configurables via globalParams) :
 *  - delaiPaiementClients     : retard d'encaissement des recettes (ex: subventions versées en N+60j)
 *  - delaiPaiementFournisseurs: délai de règlement des charges d'exploitation
 *
 * Un BFR positif signifie que l'association avance de la trésorerie (cas typique des asso de formation
 * dont les subventions arrivent en décalage par rapport aux dépenses).
 *
 * @param {Object} direction
 * @param {Array}  services
 * @param {Object} globalParams - { delaiPaiementClients, delaiPaiementFournisseurs, stocksValeur, ... }
 * @param {Object|null} poleSupport
 * @param {Array}  poolRH
 * @returns {{ stocks, creancesClients, dettesFournisseurs, bfr, bfrEnJours, chiffreAffaires, achatsExploitation }}
 */
export const calculerBFR = (direction, services, globalParams, poleSupport = null, poolRH = []) => {
  if (!Array.isArray(services)) services = [];
  const msETP = globalParams?.montantSegurETP ?? PRIME_SEGUR;
  const tvaParams = globalParams?.gestionTVA ? { gestionTVA: true, tauxTVAMoyen: globalParams.tauxTVAMoyen ?? 20 } : null;
  const bpCoeff = globalParams?.coefficientBP ?? 100;
  let chiffreAffaires = 0;
  let achatsExploitation = 0;
  let totalSalaires = 0;

  const budgetDir = calculerBudgetDirection(direction, null, 2026, msETP, poolRH, tvaParams, bpCoeff);
  achatsExploitation += budgetDir.chargesSiege || 0;
  chiffreAffaires    += budgetDir.recettes     || 0;
  totalSalaires      += budgetDir.salaires     || 0;

  services.forEach(s => {
    const bService = calculerBudgetService(s, null, 2026, msETP, poolRH, tvaParams, bpCoeff);
    chiffreAffaires    += bService.recettes;
    achatsExploitation += bService.exploitation;
    totalSalaires      += bService.salaires || 0;
  });

  if (poleSupport) {
    const bPS = calculerBudgetPoleSupport(poleSupport, null, 2026, msETP, poolRH, tvaParams, bpCoeff);
    achatsExploitation += bPS.exploitation;
    totalSalaires      += bPS.salaires || 0;
  }

  const delaiURSSAF = globalParams.delaiPaiementURSSAF ?? 45;
  // Dettes sociales URSSAF : charges patronales ≈ totalSalaires × tauxCP/(1+tauxCP)
  const tauxCP = CHARGES_PATRONALES;
  const chargesPatronalesAnnuelles = totalSalaires * (tauxCP / (1 + tauxCP));
  const dettesURSSAF = (chargesPatronalesAnnuelles / JOURS_ANNEE) * delaiURSSAF;

  const stocks = globalParams.stocksValeur || 0;
  // Créances : calculées per-recette si delaiEncaissement individuel défini, sinon délai global
  const globalDelai = globalParams.delaiPaiementClients ?? 30;
  const bpFrac = (bpCoeff ?? 100) / 100;
  const allRecettes = [
    ...(direction?.recettes || []),
    ...(poleSupport?.recettes || []),
    ...services.flatMap(s => s.recettes || []),
  ];
  const hasCustomDelais = allRecettes.some(r => r.delaiEncaissement != null);
  const creancesClients = hasCustomDelais
    ? allRecettes.reduce((sum, r) => {
        const montantAnnuel = (parseFloat(r.montant) || 0) * 12 * bpFrac;
        const delai = r.delaiEncaissement != null ? r.delaiEncaissement : globalDelai;
        return sum + (montantAnnuel / JOURS_ANNEE) * delai;
      }, 0)
    : (chiffreAffaires / JOURS_ANNEE) * globalDelai;
  const dettesFournisseurs = (achatsExploitation / JOURS_ANNEE) * globalParams.delaiPaiementFournisseurs;
  const bfr = stocks + creancesClients - dettesFournisseurs - dettesURSSAF;
  const bfrEnJours = chiffreAffaires > 0 ? (bfr / chiffreAffaires) * 365 : 0;

  return {
    stocks,
    creancesClients,
    dettesFournisseurs,
    dettesURSSAF,
    bfr,
    bfrEnJours,
    chiffreAffaires,
    achatsExploitation
  };
};

/**
 * Calcule le Fonds de Roulement prévisionnel.
 *
 * FR = Capitaux permanents (réserves + résultat prévisionnel) − Immobilisations nettes année 1.
 *
 * @param {import('../types/index').Direction}    direction
 * @param {import('../types/index').Service[]}    services
 * @param {import('../types/index').GlobalParams} globalParams
 * @param {import('../types/index').PoleSupport|null} poleSupport
 * @param {number|null} soldeGlobal - Résultat prévisionnel (recettes − charges). Recalculé en fallback si null.
 * @returns {{
 *   details: import('../types/index').FondRoulement[],
 *   totalCapitauxManuels: number,
 *   resultatPrevisionnel: number,
 *   totalCapitauxPermanents: number,
 *   immobilisationsNettes: number,
 *   totalImmobilisations: number,
 *   totalAmortissementsCumules: number,
 *   fondRoulement: number
 * }}
 */
export const calculerFondRoulement = (direction, services, globalParams, poleSupport = null, soldeGlobal = null) => {
  if (!Array.isArray(services)) services = [];
  const msETP    = globalParams?.montantSegurETP ?? PRIME_SEGUR;
  const bpCoeff  = globalParams?.coefficientBP   ?? 100;

  // Calcul des immobilisations nettes (valeur d'acquisition − amortissements 1re année)
  let totalImmobilisations = 0;
  let totalAmortissementsCumules = 0;

  const addInvest = (investissements) => {
    if (!investissements || typeof investissements !== 'object') return;
    Object.values(investissements).forEach(inv => {
      if (!inv || typeof inv !== 'object') return;
      totalImmobilisations += inv.montant || 0;
      if ((inv.montant || 0) > 0 && (inv.duree || 0) > 0)
        totalAmortissementsCumules += calculerAmortissementEtInterets(inv).amortissement;
    });
  };

  addInvest(direction?.investissements);
  if (poleSupport) addInvest(poleSupport.investissements);
  services.forEach(s => addInvest(s.investissements));

  const immobilisationsNettes = totalImmobilisations - totalAmortissementsCumules;

  // Capitaux permanents (saisie manuelle : réserves, report à nouveau, subventions d'investissement…)
  const fondRoulementItems       = globalParams.fondRoulement || [];
  const totalCapitauxManuels     = fondRoulementItems.reduce((sum, item) => sum + (item.montant || 0), 0);

  // Résultat prévisionnel de l'exercice (lien automatique avec le budget)
  // Si non fourni on essaie de le recalculer ici (fallback)
  let resultatPrevisionnel = soldeGlobal;
  if (resultatPrevisionnel === null) {
    try {
      const poolRH = [];
      const bDir   = calculerBudgetDirection(direction,   null, 2026, msETP, poolRH, null, bpCoeff);
      const bPS    = poleSupport ? calculerBudgetPoleSupport(poleSupport, null, 2026, msETP, poolRH, null, bpCoeff) : { total: 0, recettes: 0 };
      let recTot   = (bDir.recettes || 0) + (bPS.recettes || 0);
      let chgTot   = bDir.total           + bPS.total;
      services.forEach(s => {
        const b   = calculerBudgetService(s, null, 2026, msETP, poolRH, null, bpCoeff);
        recTot   += b.recettes;
        chgTot   += b.total;
      });
      resultatPrevisionnel = recTot - chgTot;
    } catch { resultatPrevisionnel = 0; }
  }

  const totalCapitauxPermanents = totalCapitauxManuels + (resultatPrevisionnel || 0);

  // Fonds de roulement = Capitaux permanents − Immobilisations nettes
  const fondRoulement = totalCapitauxPermanents - immobilisationsNettes;

  return {
    details: fondRoulementItems,
    totalCapitauxManuels,
    resultatPrevisionnel,
    totalCapitauxPermanents,
    immobilisationsNettes,
    totalImmobilisations,
    totalAmortissementsCumules,
    fondRoulement
  };
};

/**
 * Calcule la projection financière sur 3 ans avec inflation différenciée.
 *
 * Hypothèses appliquées par année (configurables dans globalParams) :
 *  - augmentationAnnuelle : taux de revalorisation des salaires (%)
 *  - tauxGVT              : Glissement Vieillesse Technicité — progression automatique de grille (%)
 *  - inflationEnergie     : inflation spécifique aux charges énergie/eau/gaz (%)
 *  - inflationLoyers      : inflation spécifique aux loyers et baux (%)
 *  - inflationAutres      : inflation des autres charges d'exploitation (%)
 *
 * L'inflaton différenciée est appliquée ligne par ligne sur les items d'exploitation
 * en détectant automatiquement la catégorie via les mots-clés du libellé.
 *
 * @param {Object} direction
 * @param {Array}  services
 * @param {Object} globalParams
 * @param {Object|null} poleSupport
 * @param {Array}  poolRH
 * @returns {Array<{ annee, total, coutUnite, amortissements, interets, unites, budgetDirection, detailsServices }>}
 *          Tableau de 3 éléments (annees 1, 2, 3 = N, N+1, N+2)
 */
export const calculerSynthese3Ans = (direction, services, globalParams, poleSupport = null, poolRH = []) => {
  if (!Array.isArray(services)) services = [];
  if (!globalParams || typeof globalParams !== 'object') globalParams = {};
  const msETP = globalParams?.montantSegurETP ?? PRIME_SEGUR;
  const tvaParams = globalParams?.gestionTVA ? { gestionTVA: true, tauxTVAMoyen: globalParams.tauxTVAMoyen ?? 20 } : null;
  const bpCoeff = globalParams?.coefficientBP ?? 100;
  const bServices = services.map(s => calculerBudgetService(s, null, 2026, msETP, poolRH, tvaParams, bpCoeff));
  const bPoleSupport = poleSupport ? calculerBudgetPoleSupport(poleSupport, null, 2026, msETP, poolRH, tvaParams, bpCoeff) : null;

  return [1, 2, 3].map(annee => {
    const indexAnnee = annee - 1;
    const augmentation = Math.pow(1 + globalParams.augmentationAnnuelle / 100, indexAnnee);
    // GVT : glissement vieillesse technicité appliqué aux salaires uniquement
    const gvtCoeff = indexAnnee > 0 ? Math.pow(1 + (globalParams.tauxGVT ?? 1.5) / 100, indexAnnee) : 1;
    // Inflation différenciée par catégorie (si non renseignée, repli sur augmentationAnnuelle)
    const augmEnergie = Math.pow(1 + (globalParams.inflationEnergie ?? globalParams.augmentationAnnuelle) / 100, indexAnnee);
    const augmLoyers  = Math.pow(1 + (globalParams.inflationLoyers  ?? globalParams.augmentationAnnuelle) / 100, indexAnnee);
    const augmAutres  = Math.pow(1 + (globalParams.inflationAutres  ?? globalParams.augmentationAnnuelle) / 100, indexAnnee);

    // Catégoriser les items d'exploitation (labels en minuscules)
    const categoriserItem = (label = '') => {
      const l = label.toLowerCase();
      if (/énergi|electr|élect|gaz|eau|chauff|fuel|fioul|carburant/.test(l)) return 'energie';
      if (/loyer|bail|location/.test(l)) return 'loyers';
      return 'autres';
    };

    // Revalorisation des recettes (configurable, défaut = augmentationAnnuelle)
    const augmRecettes = Math.pow(1 + (globalParams.augmentationRecettes ?? globalParams.augmentationAnnuelle) / 100, indexAnnee);

    const budgetDir = calculerBudgetDirection(direction, null, 2026, msETP, poolRH, tvaParams, bpCoeff);
    const budgetDirAjuste = budgetDir.salaires * augmentation * gvtCoeff + budgetDir.chargesSiege * augmentation;
    const budgetPSAjuste = bPoleSupport
      ? bPoleSupport.salaires * augmentation * gvtCoeff + bPoleSupport.exploitation * augmentation
      : 0;

    // Total des unités calculé depuis bServices (correct pour les services avec promos)
    const totalUnitesGlobal = bServices.reduce((sum, b) => sum + b.unitesAnnuelles, 0);

    let totalGlobal = budgetDirAjuste + budgetPSAjuste;
    let totalUnites = 0;
    let amortTotal = 0;
    let interetsTotal = 0;
    let detailsServices = [];

    bServices.forEach((bService, idx) => {
      const s = services[idx];
      // Inflation différenciée : recalcul par catégorie à partir des items bruts
      const exploitationAjustee = (bService.exploitationDetails || []).reduce((sum, item) => {
        const cat = categoriserItem(item.label || item.nom || '');
        const inflCoeff = cat === 'energie' ? augmEnergie : cat === 'loyers' ? augmLoyers : augmAutres;
        return sum + (parseFloat(item.montant) || 0) * 12 * inflCoeff * (bpCoeff / 100);
      }, 0) || bService.exploitation * augmAutres;
      const budgetServiceAjuste = bService.salaires * augmentation * gvtCoeff + exploitationAjustee;
      const interetsAnnee = bService.interetsParAnnee[indexAnnee] || 0;
      const proportionService = totalUnitesGlobal > 0 ? bService.unitesAnnuelles / totalUnitesGlobal : 0;
      const partSiege = budgetDirAjuste * proportionService;
      const budgetServiceTotal = budgetServiceAjuste + bService.amortissements + interetsAnnee + partSiege;

      totalGlobal += budgetServiceAjuste + bService.amortissements + interetsAnnee;
      totalUnites += bService.unitesAnnuelles;
      amortTotal += bService.amortissements;
      interetsTotal += interetsAnnee;

      detailsServices.push({
        nom: s.nom,
        budget: budgetServiceTotal,
        budgetSansAllocSiege: budgetServiceAjuste + bService.amortissements + interetsAnnee,
        partSiege: partSiege,
        proportionService: proportionService * 100,
        unites: bService.unitesAnnuelles,
        coutUnite: bService.unitesAnnuelles > 0 ? budgetServiceTotal / bService.unitesAnnuelles : 0,
        coutUniteSansAllocSiege: bService.unitesAnnuelles > 0 ? (budgetServiceAjuste + bService.amortissements + interetsAnnee) / bService.unitesAnnuelles : 0
      });
    });

    let totalRecettes = budgetDir.recettes * augmRecettes;
    if (bPoleSupport) totalRecettes += bPoleSupport.recettes * augmRecettes;
    bServices.forEach(b => { totalRecettes += b.recettes * augmRecettes; });

    return {
      annee,
      total: totalGlobal,
      recettes: totalRecettes,
      solde: totalRecettes - totalGlobal,
      coutUnite: totalUnites > 0 ? totalGlobal / totalUnites : 0,
      amortissements: amortTotal,
      interets: interetsTotal,
      unites: totalUnites,
      budgetDirection: budgetDirAjuste,
      detailsServices
    };
  });
};

// ─── HELPER INTERNE : coût réel d'une ligne d'exploitation selon régime TVA ──
//
// Modèle retenu (DAF médico-social) :
//   saisieType = 'HT' | 'TTC'  — comment le montant a été saisi
//   tvaRecuperable = true | false — TVA déductible ou à la charge définitive de l'asso
//   tauxTVA = null → utilise tvaParams.tauxTVAMoyen
//
// Coût réel = HT si TVA récupérable, TTC si TVA non récupérable.
const _montantReelExploitation = (item, tvaParams) => {
  const montant = parseFloat(item.montant) || 0;
  if (!tvaParams?.gestionTVA) return montant;

  const taux = ((item.tauxTVA != null ? item.tauxTVA : (tvaParams.tauxTVAMoyen ?? 20)) / 100);
  const saisieType = item.saisieType || 'HT';
  const tvaRecup = item.tvaRecuperable !== false; // true par défaut

  const montantHT = saisieType === 'TTC' ? montant / (1 + taux) : montant;
  return tvaRecup ? montantHT : montantHT * (1 + taux);
};

// ─── HELPER INTERNE : distribution mensuelle des primes ──────────────────────
// Retourne un tableau de 12 valeurs (coût employeur prime par mois).
// Les agents sans prime (moisPrime absent ou nul) contribuent 0.
const _calculerPrimesMensuelles = (agents, montantSegurETP = PRIME_SEGUR) => {
  const arr = Array(12).fill(0);
  (agents || []).forEach(p => {
    const mois = parseInt(p.moisPrime, 10);
    const montant = parseFloat(p.montantPrime) || 0;
    if (mois >= 1 && mois <= 12 && montant > 0) {
      const etpNum = parseFloat(p.etp) || 0;
      const sal = calculerSalaireAnnuel(p.salaire, etpNum, resolveSegur(p.segur, montantSegurETP), p.typeContrat, p.tauxChargesManuel);
      arr[mois - 1] += montant * etpNum * (1 + sal.tauxCharges);
    }
  });
  return arr;
};

/**
 * Calcule le budget annuel consolidé et le ventile sur 12 mois.
 *
 * Logique de mensualisation :
 *  - Salaires de base : répartis uniformément sur 12 mois
 *  - Primes saisonnières : imputées sur le mois de versement (via agent.moisPrime)
 *  - Exploitation : uniforme par défaut, saisonnalisable (item.moisPaiement ou item.repartitionMensuelle)
 *  - Taxe sur les salaires : répartie uniformément sur 12 mois (calculée sur masse salariale totale)
 *
 * @note Taxe sur les salaires (Art. 231 CGI) : calculée sur `totalSalaires` (coût employeur complet
 *       incluant charges patronales) par approximation. La base légale stricte est le brut versé
 *       (hors charges patronales). Cette approche surestime la taxe d'environ 30–40%, ce qui est
 *       prudent et conservateur pour un budget prévisionnel.
 *
 * @param {Object} direction
 * @param {Array}  services
 * @param {Object} globalParams - { taxeSalaires, tauxTaxeSalaires, coefficientBP, ... }
 * @param {Object|null} poleSupport
 * @param {Array}  poolRH
 * @returns {{ totalAnnuel, salaires, exploitation, amortissements, interets, taxeSalaires,
 *             totalRecettes, mois: Array<{ mois, salaires, exploitation, amortissements,
 *             interets, taxeSalaires, total, recettes, solde }> }}
 */
export const calculerBudgetAnnuelMensuel = (direction, services, globalParams, poleSupport = null, poolRH = []) => {
  if (!Array.isArray(services)) services = [];
  const msETP = globalParams?.montantSegurETP ?? PRIME_SEGUR;
  const tvaParams = globalParams?.gestionTVA
    ? { gestionTVA: true, tauxTVAMoyen: globalParams.tauxTVAMoyen ?? 20 }
    : null;
  const coeffBP = globalParams?.coefficientBP ?? 100;
  const bpFrac  = coeffBP / 100;
  const tauxChargesBase = (globalParams?.tauxChargesPatronales ?? (CHARGES_PATRONALES * 100)) / 100;
  const budgetDir = calculerBudgetDirection(direction, null, 2026, msETP, poolRH, tvaParams, coeffBP, tauxChargesBase);

  let totalSalaires = budgetDir.salaires;
  let totalExploitation = budgetDir.chargesSiege;
  let totalAmortissements = 0;
  let totalInterets = 0;

  // Taxe sur les salaires : barème progressif CGI art. 231 — calculé par agent (pas sur l'agrégat)
  const _sumTaxeProgressif = (details) =>
    (details || []).reduce((s, d) => {
      const brut = (d.brut || 0) + (d.brutSegur || 0) + (d.primeBrute || 0);
      return s + calculerTaxeSalairesProgressif(brut);
    }, 0);
  let totalTaxeBase = _sumTaxeProgressif(budgetDir.detailsSalaires) + _sumTaxeProgressif(budgetDir.detailsPoolRH);

  // subventionRegionAgents par service (CA8 : absent du tableau s.recettes, doit être mensualisé séparément)
  const subvRegionParService = [];

  services.forEach(s => {
    const bService = calculerBudgetService(s, null, 2026, msETP, poolRH, tvaParams, coeffBP, tauxChargesBase);
    totalSalaires += bService.salaires;
    totalExploitation += bService.exploitation;
    totalAmortissements += bService.amortissements;
    totalInterets += bService.interets;
    totalTaxeBase += _sumTaxeProgressif(bService.detailsSalaires) + _sumTaxeProgressif(bService.detailsPoolRH);
    subvRegionParService.push(bService.subventionRegionAgents);
  });

  if (poleSupport) {
    const bPS = calculerBudgetPoleSupport(poleSupport, null, 2026, msETP, poolRH, tvaParams, coeffBP, tauxChargesBase);
    totalSalaires += bPS.salaires;
    totalExploitation += bPS.exploitation;
    totalTaxeBase += _sumTaxeProgressif(bPS.detailsSalaires) + _sumTaxeProgressif(bPS.detailsPoolRH);
  }

  // ── Taxe sur les salaires (associations non assujetties TVA) ────────────────
  // Barème progressif CGI art. 231 — appliqué par agent, pas sur le total agrégé.
  const taxeSalairesActive = globalParams?.taxeSalaires === true;
  const taxeSalaires = taxeSalairesActive ? totalTaxeBase : 0;

  const total = totalSalaires + totalExploitation + totalAmortissements + totalInterets + taxeSalaires;

  // ── Primes saisonnalisées (un pic mensuel par agent ayant moisPrime) ────────
  const allAgents = [
    ...(direction?.personnel || []),
    ...(poleSupport?.personnel || []),
    ...services.flatMap(s => s.personnel || []),
  ];
  const primesMensuelles = _calculerPrimesMensuelles(allAgents, msETP);
  const totalPrimesAnnuelles = primesMensuelles.reduce((a, b) => a + b, 0);
  const totalSalairesBase = totalSalaires - totalPrimesAnnuelles;

  // ── Recettes mensualisées (saisonnalisées si repartitionMensuelle définie) ──
  const recettesMensuelles = Array(12).fill(0);

  // Services — saisonnalité par item (repartitionMensuelle, moisPaiement, ou uniforme)
  services.forEach((s, idx) => {
    (s.recettes || []).forEach(item => {
      const annuel = (item.montant || 0) * 12 * bpFrac;
      const mensuel = repartirSur12Mois(annuel, item);
      for (let i = 0; i < 12; i++) recettesMensuelles[i] += mensuel[i];
    });
    // subventionRegionAgents : calculée depuis les flags agents, absente de s.recettes — ventilation uniforme
    const subvRegion = (subvRegionParService[idx] || 0) * bpFrac;
    for (let i = 0; i < 12; i++) recettesMensuelles[i] += subvRegion / 12;
  });

  // Direction et Pôle Support — saisonnalité par item
  (direction?.recettes || []).forEach(item => {
    const annuel = (item.montant || 0) * 12 * bpFrac;
    const mensuel = repartirSur12Mois(annuel, item);
    for (let i = 0; i < 12; i++) recettesMensuelles[i] += mensuel[i];
  });
  (poleSupport?.recettes || []).forEach(item => {
    const annuel = (item.montant || 0) * 12 * bpFrac;
    const mensuel = repartirSur12Mois(annuel, item);
    for (let i = 0; i < 12; i++) recettesMensuelles[i] += mensuel[i];
  });

  // ── Charges mensualisées : base uniforme + pic prime dans le bon mois ───────
  const mois = [];
  for (let i = 0; i < 12; i++) {
    const salMois = totalSalairesBase / 12 + primesMensuelles[i];
    const chargesMois = salMois + totalExploitation / 12 + totalAmortissements / 12 + totalInterets / 12 + taxeSalaires / 12;
    mois.push({
      mois: i + 1,
      salaires: salMois,
      exploitation: totalExploitation / 12,
      amortissements: totalAmortissements / 12,
      interets: totalInterets / 12,
      taxeSalaires: taxeSalaires / 12,
      total: chargesMois,
      recettes: recettesMensuelles[i],
      solde: recettesMensuelles[i] - chargesMois
    });
  }

  const totalRecettes = recettesMensuelles.reduce((a, b) => a + b, 0);

  return {
    totalAnnuel: total,
    salaires: totalSalaires,
    exploitation: totalExploitation,
    amortissements: totalAmortissements,
    interets: totalInterets,
    taxeSalaires,
    totalRecettes,
    mois
  };
};

// ─── CALCULS DE PRÉSENCE / ABSENCES ─────────────────────────────────────────

/**
 * Compte les jours d'absence d'un agent dans le planning mensuel pour une année donnée.
 * planningAbsences : { [monthKey: "YYYY-MM"]: { [agentKey: "id-source"]: { [dayKey: "YYYY-MM-DD"]: type } } }
 * Retourne { conge, rtt, maladie, formation, arret, total } en jours ouvrés
 * et un Set `joursCouverts` des dates déjà comptées (pour éviter les doublons avec les plages budget)
 */
export const calculerJoursAbsencesPlanning = (agentId, source, planningAbsences, annee) => {
  const result = { conge: 0, rtt: 0, maladie: 0, formation: 0, arret: 0, total: 0 };
  const joursCouverts = new Set();
  if (!planningAbsences) return { ...result, joursCouverts };
  const agentKey = `${agentId}-${source}`;
  for (let m = 1; m <= 12; m++) {
    const monthKey = `${annee}-${String(m).padStart(2, '0')}`;
    const monthData = planningAbsences[monthKey]?.[agentKey];
    if (!monthData) continue;
    Object.entries(monthData).forEach(([dayKey, type]) => {
      const date = new Date(dayKey);
      const dow = date.getDay();
      if (dow === 0 || dow === 6) return; // ne compte que les jours ouvrés
      if (result[type] !== undefined) result[type]++;
      result.total++;
      joursCouverts.add(dayKey);
    });
  }
  return { ...result, joursCouverts };
};

/**
 * Compte les jours d'absence budget (plages dateDebut/dateFin sur agent.absences)
 * pour une année donnée, en excluant les jours déjà couverts par la grille planning.
 * Retourne { conge, rtt, maladie, formation, arret, total }
 */
const calculerJoursAbsencesBudget = (agent, annee, joursDejaCouverts = new Set()) => {
  const result = { conge: 0, rtt: 0, maladie: 0, formation: 0, arret: 0, total: 0 };
  if (!agent.absences || agent.absences.length === 0) return result;
  const debutAnnee = new Date(`${annee}-01-01`);
  const finAnnee   = new Date(`${annee}-12-31`);

  agent.absences.forEach(ab => {
    if (!ab.dateDebut || !ab.dateFin) return;
    const debut = new Date(Math.max(new Date(ab.dateDebut), debutAnnee));
    const fin   = new Date(Math.min(new Date(ab.dateFin),   finAnnee));
    if (debut > fin) return;

    const type = ab.type || 'maladie';
    const cur = new Date(debut);
    while (cur <= fin) {
      const dow = cur.getDay();
      if (dow !== 0 && dow !== 6) {
        const dayKey = cur.toISOString().slice(0, 10);
        if (!joursDejaCouverts.has(dayKey)) {
          if (result[type] !== undefined) result[type]++;
          else result.arret++; // fallback pour types inconnus
          result.total++;
        }
      }
      cur.setDate(cur.getDate() + 1);
    }
  });

  return result;
};

/**
 * Calcule les indicateurs de présence effective d'un agent pour une année.
 * Intègre : jours ouvrés base, congés (légaux/accordés), RTT,
 * absences du planning (grille cliquable) ET absences budget (plages de dates).
 */
export const calculerPresenceAgent = (agent, source, planningAbsences, annee = 2026) => {
  const joursOuvresBase = JOURS_OUVRES_AN;
  const joursConges = agent.joursConges ?? JOURS_CONGES_LEGAL;
  const nbJoursRTT = agent.nbJoursRTT ?? 0;

  // Absences grille planning (avec liste des jours déjà couverts)
  const absencesPlanning = calculerJoursAbsencesPlanning(agent.id, source, planningAbsences, annee);

  // Absences budget (plages) — on exclut les jours déjà dans la grille pour éviter les doublons
  const absencesBudget = calculerJoursAbsencesBudget(agent, annee, absencesPlanning.joursCouverts);

  // Fusion des deux sources
  const absences = {
    conge:     absencesPlanning.conge     + absencesBudget.conge,
    rtt:       absencesPlanning.rtt       + absencesBudget.rtt,
    maladie:   absencesPlanning.maladie   + absencesBudget.maladie,
    formation: absencesPlanning.formation + absencesBudget.formation,
    arret:     absencesPlanning.arret     + absencesBudget.arret,
    total:     absencesPlanning.total     + absencesBudget.total,
  };

  const joursMaladie           = absences.maladie + absences.arret;
  const joursCongesPlanning    = absences.conge;
  const joursRTTPlanning       = absences.rtt;
  const joursFormationPlanning = absences.formation;

  // Congés et RTT : on prend le MAX entre jours réels saisis et valeur configurée.
  // Cela garantit qu'au minimum les droits contractuels sont déduits de la présence,
  // et qu'une saisie supérieure au quota (accord employeur) est bien prise en compte.
  const joursCongesEffectifs = Math.max(joursCongesPlanning, joursConges);
  const joursRTTEffectifs    = Math.max(joursRTTPlanning,    nbJoursRTT);

  // Jours de présence effective = jours ouvrés - congés - RTT - maladie/arrêts
  const joursPresence = Math.max(0,
    joursOuvresBase - joursCongesEffectifs - joursRTTEffectifs - joursMaladie
  );
  const tauxPresence = joursOuvresBase > 0 ? joursPresence / joursOuvresBase : 1;
  const etpReel = parseFloat(agent.etp) * tauxPresence;

  // Coût des jours de carence maladie (non récupérable auprès de la SS).
  // La carence de 3 jours s'applique PAR ÉPISODE d'arrêt, pas par année.
  // On compte les épisodes depuis les plages budget (chaque entrée = 1 épisode)
  // et les blocs contigus dans la grille planning.
  const debutAnnee = new Date(`${annee}-01-01`);
  const finAnnee   = new Date(`${annee}-12-31`);
  const episodesBudget = (agent.absences || []).filter(ab =>
    (ab.type === 'maladie' || ab.type === 'arret') && ab.dateDebut && ab.dateFin &&
    new Date(ab.dateDebut) <= finAnnee && new Date(ab.dateFin) >= debutAnnee
  ).length;

  let episodesPlanning = 0;
  if (planningAbsences) {
    const agentKey = `${agent.id}-${source}`;
    const sickDays = [];
    for (let m = 1; m <= 12; m++) {
      const mk = `${annee}-${String(m).padStart(2, '0')}`;
      const data = planningAbsences?.[mk]?.[agentKey] || {};
      Object.entries(data).forEach(([dk, t]) => {
        if ((t === 'maladie' || t === 'arret') && new Date(dk).getDay() % 6 !== 0)
          sickDays.push(dk);
      });
    }
    sickDays.sort();
    if (sickDays.length > 0) {
      episodesPlanning = 1;
      for (let i = 1; i < sickDays.length; i++) {
        // Nouveau bloc si l'écart est > 3 jours calendaires (week-end entre deux jours de maladie)
        if ((new Date(sickDays[i]) - new Date(sickDays[i - 1])) / 86400000 > 3) episodesPlanning++;
      }
    }
  }

  // Si les plages budget existent, elles sont la référence d'épisodes (données structurées).
  // Sinon, on s'appuie sur les blocs de la grille planning.
  const nbEpisodes = episodesBudget > 0 ? episodesBudget : episodesPlanning;
  const salaireJournalier = (parseFloat(agent.salaire) * TAUX_CHARGE_TOTAL * 12) / JOURS_OUVRES_AN;
  const joursCarienceTotaux = Math.min(nbEpisodes * JOURS_CARENCE_MALADIE, joursMaladie);
  const coutCarence = joursCarienceTotaux * salaireJournalier * parseFloat(agent.etp);

  return {
    joursOuvresBase,
    joursConges,
    nbJoursRTT,
    joursPresence,
    tauxPresence,
    etpReel,
    absences,
    absencesBudget,
    absencesPlanning,
    joursCongesPlanning,
    joursRTTPlanning,
    joursMaladiePlanning: joursMaladie,
    joursFormationPlanning,
    coutCarence,
  };
};

/**
 * Agrège les indicateurs de présence pour une liste d'agents (avec source).
 */
export const calculerPresenceEquipe = (agents, planningAbsences, annee = 2026) => {
  return agents.map(a => ({
    ...a,
    presence: calculerPresenceAgent(a, a.source, planningAbsences, annee),
  }));
};

/**
 * Calcule les statistiques globales vacataires sur tous les services.
 */
export const calculerStatsVacataires = (services, montantSegurETP = PRIME_SEGUR) => {
  const MOIS_COURTS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
  let totalVacataires = 0, totalHeures = 0, totalCout = 0, totalFI = 0, totalFC = 0;
  const parService = [];
  const alertes = [];

  services.forEach(service => {
    const budget = calculerBudgetService(service, null, 2026, montantSegurETP);
    const vacList = budget.detailsVacataires || [];
    const coutService = vacList.reduce((s, v) => s + v.coutCharge, 0);
    const heuresService = vacList.reduce((s, v) => s + v.heures, 0);
    const fIService = vacList.reduce((s, v) => s + v.coutFI, 0);
    const fCService = vacList.reduce((s, v) => s + v.coutFC, 0);

    totalVacataires += vacList.length;
    totalHeures += heuresService;
    totalCout += coutService;
    totalFI += fIService;
    totalFC += fCService;

    // Coût mensuel agrégé service
    const coutMensuelService = Array(12).fill(0);
    vacList.forEach(v => {
      (v.coutMensuel || []).forEach((c, i) => { coutMensuelService[i] += c; });
    });

    // Alertes
    vacList.forEach(v => {
      if (v.depasse) alertes.push({ service: service.nom, nom: v.nom, type: 'heures', msg: `${v.heures}h (seuil ${SEUIL_HEURES_VACATAIRE}h)` });
      if (v.contratExpire) alertes.push({ service: service.nom, nom: v.nom, type: 'contrat', msg: `Contrat expiré le ${v.dateFin}` });
      if (!v.dateFin) alertes.push({ service: service.nom, nom: v.nom, type: 'contrat', msg: 'Pas de date de fin de contrat' });
    });
    if (budget.alerteEnveloppe) alertes.push({ service: service.nom, nom: '', type: 'enveloppe', msg: `Budget dépassé : ${Math.round(coutService).toLocaleString()} € / ${Math.round(budget.enveloppeVacataires).toLocaleString()} €` });
    if (budget.alerteRatioVacataires) alertes.push({ service: service.nom, nom: '', type: 'ratio', msg: `Ratio vacataires ${budget.ratioVacataires.toFixed(0)}% (seuil ${SEUIL_RATIO_VACATAIRE}%)` });

    if (vacList.length > 0) {
      parService.push({ service: service.nom, vacataires: vacList, coutService, heuresService, fIService, fCService, coutMensuelService, ratioVacataires: budget.ratioVacataires, coutParEtudiant: budget.coutParEtudiant });
    }
  });

  // Coût mensuel global
  const coutMensuelTotal = Array(12).fill(0);
  parService.forEach(s => s.coutMensuelService.forEach((c, i) => { coutMensuelTotal[i] += c; }));

  return { totalVacataires, totalHeures, totalCout, totalFI, totalFC, parService, coutMensuelTotal, moisCourts: MOIS_COURTS, alertes };
};

// ─── ETP RÉEL MENSUEL ─────────────────────────────────────────────────────────

/** Nombre de jours ouvrés (hors weekends) dans un mois donné. */
const joursOuvresDansMois = (annee, mois) => {
  const nbJours = new Date(annee, mois, 0).getDate();
  let count = 0;
  for (let d = 1; d <= nbJours; d++) {
    const dow = new Date(annee, mois - 1, d).getDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
};

/** Absences grille planning pour un mois précis. Retourne { total, joursCouverts }. */
const absencesPlanningMois = (agentId, source, planningAbsences, annee, mois) => {
  const monthKey = `${annee}-${String(mois).padStart(2, '0')}`;
  const agentKey = `${agentId}-${source}`;
  const monthData = planningAbsences?.[monthKey]?.[agentKey] || {};
  let total = 0;
  const joursCouverts = new Set();
  Object.entries(monthData).forEach(([dayKey, _type]) => {
    const dow = new Date(dayKey).getDay();
    if (dow !== 0 && dow !== 6) { total++; joursCouverts.add(dayKey); }
  });
  return { total, joursCouverts };
};

/** Absences budget (plages) pour un mois précis, en excluant les jours déjà couverts. */
const absencesBudgetMois = (agent, annee, mois, joursDejaCouverts) => {
  const debutMois = new Date(annee, mois - 1, 1);
  const finMois   = new Date(annee, mois, 0);
  let total = 0;
  (agent.absences || []).forEach(ab => {
    if (!ab.dateDebut || !ab.dateFin) return;
    const debut = new Date(Math.max(new Date(ab.dateDebut), debutMois));
    const fin   = new Date(Math.min(new Date(ab.dateFin),   finMois));
    if (debut > fin) return;
    const cur = new Date(debut);
    while (cur <= fin) {
      const dow = cur.getDay();
      if (dow !== 0 && dow !== 6) {
        const dayKey = cur.toISOString().slice(0, 10);
        if (!joursDejaCouverts.has(dayKey)) total++;
      }
      cur.setDate(cur.getDate() + 1);
    }
  });
  return total;
};

/**
 * Calcule l'ETP réel de l'agent pour chacun des 12 mois de l'année.
 * Retourne un tableau de 12 valeurs (index 0 = janvier).
 */
export const calculerETPMensuelAgent = (agent, source, planningAbsences, annee = 2026) => {
  const etpContractuel = parseFloat(agent.etp) || 0;
  const joursCongesCfg = agent.joursConges ?? JOURS_CONGES_LEGAL;
  const joursRTTCfg    = agent.nbJoursRTT ?? 0;

  // Répartition uniforme des congés/RTT configurés sur les 12 mois (si aucune absence réelle saisie)
  const congesMoisCfg = joursCongesCfg / 12;
  const rttMoisCfg    = joursRTTCfg / 12;

  return Array.from({ length: 12 }, (_, i) => {
    const mois = i + 1;
    const joursOuvres = joursOuvresDansMois(annee, mois);
    if (joursOuvres === 0) return etpContractuel;

    const { total: absGrid, joursCouverts } = absencesPlanningMois(agent.id, source, planningAbsences, annee, mois);
    const absBudget = absencesBudgetMois(agent, annee, mois, joursCouverts);
    const totalAbsences = absGrid + absBudget;

    // Si aucune absence saisie ce mois : applique la fraction mensuelle des congés/RTT configurés
    const absSaisies = totalAbsences > 0 ? totalAbsences : (congesMoisCfg + rttMoisCfg);
    const joursPresence = Math.max(0, joursOuvres - absSaisies);
    return etpContractuel * (joursPresence / joursOuvres);
  });
};

/**
 * Calcule l'ETP réel par mois pour chaque entité (direction, pôle support, services).
 * Retourne { lignes: [{ nom, etpContractuel, etpMensuel[12] }], total[12], moisLabels[12] }
 */
export const calculerETPReelParMoisParService = (services, direction, poleSupport, planningAbsences, annee = 2026, poolRH = []) => {
  const MOIS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

  const aggrETP = (personnel, source) => {
    if (!personnel || personnel.length === 0) return { etp: 0, mensuel: Array(12).fill(0) };
    const etpC = personnel.reduce((s, p) => s + (parseFloat(p.etp) || 0), 0);
    const mensuel = Array(12).fill(0);
    personnel.forEach(p => {
      const mois = calculerETPMensuelAgent(p, source, planningAbsences, annee);
      mois.forEach((v, i) => { mensuel[i] += v; });
    });
    return { etp: etpC, mensuel };
  };

  const lignes = [
    { nom: 'Siège',        ...aggrETP(direction?.personnel,    'Direction') },
    { nom: 'Pôle Ressource', ...aggrETP(poleSupport?.personnel, 'Pôle Support') },
    ...services.map(s => ({ nom: s.nom, ...aggrETP(s.personnel, s.nom) })),
  ];

  if (poolRH.length > 0) {
    lignes.push({ nom: 'Pool RH', isPoolRH: true, ...aggrETP(poolRH, 'Pool RH') });
  }

  const total = Array.from({ length: 12 }, (_, m) =>
    lignes.reduce((sum, l) => sum + l.mensuel[m], 0)
  );
  const totalContractuel = lignes.reduce((s, l) => s + l.etp, 0);

  return { lignes, total, totalContractuel, moisLabels: MOIS };
};

// ─── POOL RH — agents partagés entre plusieurs entités ───────────────────────

/**
 * Calcule la quote-part de coût salarial des agents du Pool RH affectés à une entité.
 * entityType : 'direction' | 'poleSupport' | 'service'
 * entityId   : id du service (ignoré pour direction/poleSupport)
 */
export const calculerPartPoolRH = (poolRH = [], entityType, entityId, montantSegurETP = PRIME_SEGUR) => {
  const details = [];
  let totalSalaires = 0;

  poolRH.forEach(agent => {
    const aff = (agent.affectations || []).find(a =>
      a.entityType === entityType && (entityType !== 'service' || a.entityId === entityId)
    );
    if (!aff || !aff.pct) return;

    // Normalise si la somme des affectations dépasse 100% (évite le double-comptage)
    const totalAff = (agent.affectations || []).reduce((s, a) => s + (parseFloat(a.pct) || 0), 0);
    const facteurNorm = totalAff > 100 ? 100 / totalAff : 1;
    const pctNorm = aff.pct * facteurNorm;

    const pct = pctNorm / 100;
    const etpEffectif = (parseFloat(agent.etp) || 0) * pct;
    const montantSegur = agent.segur === true ? montantSegurETP : (parseFloat(agent.segur) || 0);
    const sal = calculerSalaireAnnuel(agent.salaire, etpEffectif, montantSegur, agent.typeContrat, agent.tauxChargesManuel);

    totalSalaires += sal.total;
    details.push({
      ...agent, etpEffectif, pctAffecte: pctNorm, coutQuotePart: sal.total,
      // Composantes brutes de la quote-part (base taxe sur salaires + décomposition 641/645)
      brut: sal.brut, brutSegur: sal.brutSegur, primeBrute: sal.primeBrute,
    });
  });

  return { totalSalaires, details };
};

// ─── ALERTES RH ─────────────────────────────────────────────────────────────

/**
 * Génère des alertes RH : fins de contrat et départs en retraite imminents.
 * dateRef : Date de référence (défaut = aujourd'hui)
 * Retourne un tableau d'objets { lvl: 'error'|'warning'|'info', type: 'rh', msg: string }
 */
export const calculerAlertesRH = (direction, poleSupport, services, dateRef = new Date(), poolRH = []) => {
  const alertes = [];
  const AGE_RETRAITE = 64;
  const anneeRef = dateRef.getFullYear();
  const moisRef = dateRef.getMonth(); // 0-indexed

  const analyserAgent = (agent, source) => {
    const nom = agent.titre || 'Agent';

    // Alerte retraite (depuis anneeNaissance)
    const annee = parseInt(agent.anneeNaissance);
    if (annee && annee > 1900) {
      const anneeRetraite = annee + AGE_RETRAITE;
      const moisRestants = (anneeRetraite - anneeRef) * 12 - moisRef;
      if (moisRestants <= 0 && moisRestants > -12) {
        alertes.push({ lvl: 'error', type: 'rh', msg: `Retraite prévue cette année : ${nom} (${source}) — né(e) en ${annee}` });
      } else if (moisRestants > 0 && moisRestants <= 6) {
        alertes.push({ lvl: 'warning', type: 'rh', msg: `Retraite dans ${moisRestants} mois : ${nom} (${source}) — prévoir le remplacement` });
      } else if (moisRestants > 6 && moisRestants <= 12) {
        alertes.push({ lvl: 'info', type: 'rh', msg: `Retraite dans moins de 12 mois : ${nom} (${source}) — à anticiper` });
      }
    }

    // Alerte fin de contrat (dateFinContrat optionnel)
    if (agent.dateFinContrat) {
      const fin = new Date(agent.dateFinContrat);
      const diffJours = Math.round((fin - dateRef) / 86400000);
      if (diffJours < 0) {
        alertes.push({ lvl: 'error', type: 'rh', msg: `Contrat expiré : ${nom} (${source}) — fin le ${fin.toLocaleDateString('fr-FR')}` });
      } else if (diffJours <= 30) {
        alertes.push({ lvl: 'error', type: 'rh', msg: `CDD expire dans ${diffJours} jour${diffJours > 1 ? 's' : ''} : ${nom} (${source})` });
      } else if (diffJours <= 90) {
        alertes.push({ lvl: 'warning', type: 'rh', msg: `CDD expire dans ${Math.round(diffJours / 30)} mois : ${nom} (${source}) — renouvellement à prévoir` });
      } else if (diffJours <= 180) {
        alertes.push({ lvl: 'info', type: 'rh', msg: `CDD expire dans ${Math.round(diffJours / 30)} mois : ${nom} (${source})` });
      }
    }
  };

  (direction?.personnel || []).forEach(a => analyserAgent(a, 'Siège'));
  (poleSupport?.personnel || []).forEach(a => analyserAgent(a, 'Pôle Ressource'));
  services.forEach(s => (s.personnel || []).forEach(a => analyserAgent(a, s.nom)));
  poolRH.forEach(a => analyserAgent(a, 'Pool RH'));

  return alertes;
};

// ─── TRÉSORERIE MENSUELLE ────────────────────────────────────────────────────

/**
 * Répartit un montant annuel sur 12 mois selon la politique définie sur l'item :
 *  - item.repartitionMensuelle [12 %]  : saisonnalité libre (somme ≠ 100 → normalisée)
 *  - item.moisPaiement [1-12]          : paiement en une seule échéance annuelle
 *  - (défaut)                          : étalement linéaire (÷ 12)
 */
const repartirSur12Mois = (montantAnnuel, item) => {
  const result = Array(12).fill(0);
  if (Array.isArray(item.repartitionMensuelle) && item.repartitionMensuelle.length === 12) {
    const somme = item.repartitionMensuelle.reduce((a, b) => a + b, 0) || 100;
    item.repartitionMensuelle.forEach((pct, i) => { result[i] = montantAnnuel * (pct / somme); });
  } else if (item.moisPaiement >= 1 && item.moisPaiement <= 12) {
    result[item.moisPaiement - 1] = montantAnnuel;
  } else {
    for (let i = 0; i < 12; i++) result[i] = montantAnnuel / 12;
  }
  return result;
};

// Noms des mois d'abandon (clés dans promo.abandons)
const ABANDON_MONTH_KEYS = ['janvier','fevrier','mars','avril','mai','juin','juillet','aout','septembre','octobre','novembre','decembre'];

/**
 * Calcule pour un service les facteurs de pondération mensuels des recettes
 * en fonction des effectifs réels (abandons cumulatifs par mois).
 * Retourne un tableau [12] de facteurs ∈ [0,1].
 * Pour les services sans promos, retourne [1,1,...,1].
 */
const calculerFacteursMoisService = (service) => {
  const facteurs = Array(12).fill(1);
  if (!service.promos) return facteurs;

  const allPromos = [];
  const items = typeof service.promos === 'object' ? Object.values(service.promos) : [];
  items.forEach(arr => {
    (Array.isArray(arr) ? arr : [arr]).forEach(item => {
      if (item && item.promos) {
        item.promos.forEach(p => allPromos.push(p));
      } else if (item && item.effectifInitial !== undefined) {
        allPromos.push(item);
      }
    });
  });

  if (allPromos.length === 0) return facteurs;
  const totalInitial = allPromos.reduce((s, p) => s + (p.effectifInitial || 0), 0);
  if (totalInitial === 0) return facteurs;

  for (let m = 0; m < 12; m++) {
    let effectifMois = 0;
    allPromos.forEach(p => {
      const cumul = ABANDON_MONTH_KEYS.slice(0, m + 1)
        .reduce((s, k) => s + ((p.abandons || {})[k] || 0), 0);
      effectifMois += Math.max(0, (p.effectifInitial || 0) - cumul);
    });
    facteurs[m] = effectifMois / totalInitial;
  }
  return facteurs;
};

/**
 * Calcule un tableau de trésorerie mensuel sur 12 mois.
 *
 * Règles comptables appliquées :
 *  • ENCAISSEMENTS  = recettes saisonnalisées (services + direction + pôle support)
 *  • DÉCAISSEMENTS  = salaires/charges + exploitation (saisonnalisable) + intérêts financiers
 *                   + remboursement capital emprunts (flux réel)
 *  • HORS SCOPE     = dotations aux amortissements (charge comptable non décaissée)
 *
 * Retourne { mois[12], totalEncaissements, totalDecaissements, alertesMois[] }
 */
export const calculerTresorerieMensuelle = (direction, services, globalParams, poleSupport = null, poolRH = []) => {
  const msETP = globalParams?.montantSegurETP ?? PRIME_SEGUR;
  const tvaParams = globalParams?.gestionTVA
    ? { gestionTVA: true, tauxTVAMoyen: globalParams.tauxTVAMoyen ?? 20 }
    : null;
  const coeffBP = globalParams?.coefficientBP ?? 100;
  const bpFrac  = coeffBP / 100;
  const budgetDir = calculerBudgetDirection(direction, null, 2026, msETP, poolRH, tvaParams, coeffBP);

  // ── DÉCAISSEMENTS ──────────────────────────────────────────────────────────

  // 1. Salaires + charges sociales : versements mensuels fixes
  let totalSalairesAnnuels = budgetDir.salaires;

  // 2. Remboursement emprunts (flux réel de trésorerie) :
  //    intérêts financiers + capital remboursé par année (tableau[0..2] = années 1, 2, 3)
  //    Les dotations aux amortissements sont EXCLUES (charge non décaissée)
  let totalInteretsAnnuels = 0;
  let capitalRembourseAnnuel = 0;
  const loanParAnnee = [{ interets: 0, capital: 0 }, { interets: 0, capital: 0 }, { interets: 0, capital: 0 }];

  // 3. Exploitation saisonnalisée par ligne (moisPaiement ou repartitionMensuelle)
  const exploitationMensuels = Array(12).fill(0);

  // Taxe sur les salaires : barème progressif par agent (CGI art. 231)
  const _sumTaxeProgressifTreso = (details) =>
    (details || []).reduce((s, d) => {
      const brut = (d.brut || 0) + (d.brutSegur || 0) + (d.primeBrute || 0);
      return s + calculerTaxeSalairesProgressif(brut);
    }, 0);
  let totalTaxeBaseTreso = _sumTaxeProgressifTreso(budgetDir.detailsSalaires) + _sumTaxeProgressifTreso(budgetDir.detailsPoolRH);

  // subventionRegionAgents par service pour encaissements (CA8)
  const subvRegionTreso = [];

  // Direction — exploitation uniforme, salaires déjà dans budgetDir.salaires
  for (let i = 0; i < 12; i++) exploitationMensuels[i] += budgetDir.chargesSiege / 12;

  services.forEach(s => {
    const b = calculerBudgetService(s, null, 2026, msETP, poolRH, tvaParams, coeffBP);
    totalSalairesAnnuels += b.salaires;
    totalInteretsAnnuels += b.interets; // intérêts financiers année 1 (décaissés)
    totalTaxeBaseTreso += _sumTaxeProgressifTreso(b.detailsSalaires) + _sumTaxeProgressifTreso(b.detailsPoolRH);
    subvRegionTreso.push(b.subventionRegionAgents);

    // Capital + intérêts remboursés (flux réel) — collectés sur 3 ans pour la projection 36 mois
    Object.values(b.detailsInvest || {}).forEach(inv => {
      if (inv.tableauAmort && inv.tableauAmort.length > 0) {
        capitalRembourseAnnuel += inv.tableauAmort[0].capitalRembourse;
        for (let y = 0; y < 3; y++) {
          const row = inv.tableauAmort[y];
          if (row) {
            loanParAnnee[y].capital  += row.capitalRembourse || 0;
            loanParAnnee[y].interets += row.interets        || 0;
          }
        }
      }
    });

    // Exploitation du service — saisonnalisable (montant réel TVA-ajusté)
    (s.exploitation || []).forEach(item => {
      const annuel = _montantReelExploitation(item, tvaParams) * 12 * bpFrac;
      const mensuel = repartirSur12Mois(annuel, item);
      for (let i = 0; i < 12; i++) exploitationMensuels[i] += mensuel[i];
    });
  });

  if (poleSupport) {
    const bPS = calculerBudgetPoleSupport(poleSupport, null, 2026, msETP, poolRH, tvaParams, coeffBP);
    totalSalairesAnnuels += bPS.salaires;
    totalTaxeBaseTreso += _sumTaxeProgressifTreso(bPS.detailsSalaires) + _sumTaxeProgressifTreso(bPS.detailsPoolRH);
    (poleSupport.exploitation || []).forEach(item => {
      const annuel = _montantReelExploitation(item, tvaParams) * 12 * bpFrac;
      const mensuel = repartirSur12Mois(annuel, item);
      for (let i = 0; i < 12; i++) exploitationMensuels[i] += mensuel[i];
    });
  }

  // ── Primes saisonnalisées ────────────────────────────────────────────────────
  const allAgentsTreso = [
    ...(direction?.personnel || []),
    ...(poleSupport?.personnel || []),
    ...services.flatMap(s => s.personnel || []),
  ];
  const primesMensuellesTreso = _calculerPrimesMensuelles(allAgentsTreso, msETP);
  const totalPrimesAnnuelles = primesMensuellesTreso.reduce((a, b) => a + b, 0);
  const totalSalairesBase = totalSalairesAnnuels - totalPrimesAnnuelles;

  // ── Taxe sur les salaires ────────────────────────────────────────────────────
  // Barème progressif CGI art. 231 — calculé par agent via calculerTaxeSalairesProgressif.
  const taxeSalairesActive = globalParams?.taxeSalaires === true;
  const taxeSalaires = taxeSalairesActive ? totalTaxeBaseTreso : 0;

  // Charges fixes décaissées chaque mois : salaires base + annuité d'emprunt (÷ 12)
  // Les primes s'ajoutent mois par mois selon _calculerPrimesMensuelles
  const chargesFixesParMois = (totalSalairesBase + totalInteretsAnnuels + capitalRembourseAnnuel) / 12;

  // ── ENCAISSEMENTS ──────────────────────────────────────────────────────────

  const encaissementsMensuels = Array(12).fill(0);

  services.forEach((s, idx) => {
    // Facteurs mensuels selon effectifs réels (abandons cumulatifs) — services avec promos uniquement
    const facteurs = calculerFacteursMoisService(s);
    (s.recettes || []).forEach(item => {
      const annuel = (item.montant || 0) * 12 * bpFrac;
      const mensuel = repartirSur12Mois(annuel, item);
      for (let i = 0; i < 12; i++) encaissementsMensuels[i] += mensuel[i] * facteurs[i];
    });
    // subventionRegionAgents : absente de s.recettes, ventilée uniformément (CA8)
    const subvR = (subvRegionTreso[idx] || 0) * bpFrac;
    for (let i = 0; i < 12; i++) encaissementsMensuels[i] += subvR / 12;
  });

  // Recettes direction et pôle support — saisonnalité par item
  (direction?.recettes || []).forEach(item => {
    const annuel = (item.montant || 0) * 12 * bpFrac;
    const mensuel = repartirSur12Mois(annuel, item);
    for (let i = 0; i < 12; i++) encaissementsMensuels[i] += mensuel[i];
  });
  (poleSupport?.recettes || []).forEach(item => {
    const annuel = (item.montant || 0) * 12 * bpFrac;
    const mensuel = repartirSur12Mois(annuel, item);
    for (let i = 0; i < 12; i++) encaissementsMensuels[i] += mensuel[i];
  });

  // ── SOLDE MENSUEL / CUMULÉ ─────────────────────────────────────────────────

  const MOIS_LABELS = ['Janv.','Févr.','Mars','Avr.','Mai','Juin','Juil.','Août','Sept.','Oct.','Nov.','Déc.'];

  let soldeCumule = 0;
  const alertesMois = [];
  const mois = MOIS_LABELS.map((nom, i) => {
    const encaissements = encaissementsMensuels[i];
    const decaissements = chargesFixesParMois + primesMensuellesTreso[i] + exploitationMensuels[i] + taxeSalaires / 12;
    const solde = encaissements - decaissements;
    soldeCumule += solde;
    if (soldeCumule < 0) alertesMois.push(i);
    return { nom, encaissements, decaissements, solde, soldeCumule };
  });

  const totalDecaissements = chargesFixesParMois * 12 + totalPrimesAnnuelles + exploitationMensuels.reduce((s, v) => s + v, 0) + taxeSalaires;

  return {
    mois,
    totalEncaissements: encaissementsMensuels.reduce((s, v) => s + v, 0),
    totalDecaissements,
    taxeSalaires,
    _debug: {
      totalSalairesAnnuels, totalInteretsAnnuels, capitalRembourseAnnuel, totalPrimesAnnuelles,
      exploitationMensuels: [...exploitationMensuels],
      encaissementsMensuels: [...encaissementsMensuels],
      primesMensuelles: [...primesMensuellesTreso],
      totalTaxeBase: totalTaxeBaseTreso,
      loanParAnnee,
    },
    alertesMois,
  };
};

// ─── PROJECTION 36 MOIS ──────────────────────────────────────────────────────

/**
 * Projection de trésorerie sur 36 mois (3 années) en appliquant des taux d'évolution annuels.
 * Année 1 = données exactes de calculerTresorerieMensuelle.
 * Années 2-3 = même distribution mensuelle saisonnière, montants mis à l'échelle.
 *
 * @returns {Array<{moisAbsolu, annee, moisAnnee, nomMois, encaissements, decaissements, solde, soldeCumule}>}
 */
export const calculerProjection36Mois = (direction, services, globalParams, poleSupport = null, poolRH = []) => {
  const treso1 = calculerTresorerieMensuelle(direction, services, globalParams, poleSupport, poolRH);
  const d = treso1._debug;

  const tauxGVT         = (globalParams?.tauxGVT           ?? 1.5) / 100;
  const augmentation    = (globalParams?.augmentationAnnuelle ?? 2.5) / 100;
  const augmRecettes    = (globalParams?.augmentationRecettes ?? globalParams?.augmentationAnnuelle ?? 2.5) / 100;
  const taxeActive      = globalParams?.taxeSalaires === true;

  // Année 1 totaux (décaissements ventilés)
  const salBase1     = d.totalSalairesAnnuels - d.totalPrimesAnnuelles; // hors primes
  const exploit1     = d.exploitationMensuels.reduce((s, v) => s + v, 0);
  const encaiss1     = d.encaissementsMensuels.reduce((s, v) => s + v, 0);
  const taxe1        = taxeActive ? d.totalTaxeBase : 0;
  const loan1Service = (d.loanParAnnee[0].interets + d.loanParAnnee[0].capital);

  const MOIS_LABELS = ['Janv.','Févr.','Mars','Avr.','Mai','Juin','Juil.','Août','Sept.','Oct.','Nov.','Déc.'];
  const result = [];
  let soldeCumule = 0;

  for (let anneeIdx = 0; anneeIdx < 3; anneeIdx++) {
    const gvtCoeff    = Math.pow(1 + tauxGVT,      anneeIdx);
    const inflCoeff   = Math.pow(1 + augmentation,  anneeIdx);
    const recCoeff    = Math.pow(1 + augmRecettes,  anneeIdx);

    // Loan service pour cette année (peut être 0 si emprunt remboursé)
    const lY = d.loanParAnnee[anneeIdx] || { interets: 0, capital: 0 };
    const loanServiceY = lY.interets + lY.capital;

    // Salaire base mensuel pour cette année (hors primes — primes gardent leur mois mais scalées)
    const salBaseMensuelY = (salBase1 / 12) * gvtCoeff;
    const taxeMensuelleY  = (taxe1 / 12) * gvtCoeff;
    const loanMensuelY    = loanServiceY / 12;

    for (let m = 0; m < 12; m++) {
      const moisAbsolu = anneeIdx * 12 + m + 1;

      // Encaissements : proportions saisonnières de l'année 1 × coefficient recettes
      const encaissY = encaiss1 > 0
        ? (d.encaissementsMensuels[m] / encaiss1) * (encaiss1 * recCoeff)
        : 0;

      // Exploitation : même distribution saisonnière × coefficient inflation
      const exploitY = exploit1 > 0
        ? (d.exploitationMensuels[m] / exploit1) * (exploit1 * inflCoeff)
        : 0;

      // Primes : saisonnalité conservée × GVT
      const primesY = d.primesMensuelles[m] * gvtCoeff;

      const decaissY = salBaseMensuelY + primesY + exploitY + taxeMensuelleY + loanMensuelY;
      const solde    = encaissY - decaissY;
      soldeCumule   += solde;

      result.push({
        moisAbsolu,
        annee:    2026 + anneeIdx,
        moisAnnee: m + 1,
        nomMois:  MOIS_LABELS[m],
        encaissements: Math.round(encaissY),
        decaissements: Math.round(decaissY),
        solde:         Math.round(solde),
        soldeCumule:   Math.round(soldeCumule),
      });
    }
  }

  return result;
};

// ─── VALIDATION POOL RH ──────────────────────────────────────────────────────

/**
 * Vérifie la cohérence des affectations du Pool RH.
 * Règle : la somme des pct d'affectation d'un agent ne peut pas dépasser 100 %.
 * Retourne un tableau d'alertes { agentId, nom, totalPct, msg }
 */
export const verifierCoherencePoolRH = (poolRH = []) => {
  const alertes = [];

  poolRH.forEach(agent => {
    const affectations = agent.affectations || [];
    const totalPct = affectations.reduce((s, a) => s + (parseFloat(a.pct) || 0), 0);

    if (totalPct > 100) {
      alertes.push({
        agentId: agent.id,
        nom: agent.titre || 'Agent sans nom',
        totalPct,
        msg: `"${agent.titre || 'Agent sans nom'}" est affecté à ${totalPct.toFixed(0)} % (dépasse 100 %)`,
      });
    } else if (totalPct < 100 && affectations.length > 0) {
      alertes.push({
        agentId: agent.id,
        nom: agent.titre || 'Agent sans nom',
        totalPct,
        msg: `"${agent.titre || 'Agent sans nom'}" n'est affecté qu'à ${totalPct.toFixed(0)} % — ${(100 - totalPct).toFixed(0)} % non imputés`,
      });
    }
  });

  return alertes;
};

/**
 * Calcule les indicateurs OETH/AGEFIPH pour l'ensemble du personnel.
 *
 * @param {Array} personnels - Tableau d'agents enrichis avec `.source` (entité d'appartenance)
 * @param {Object} options   - Paramètres légaux configurables (valeurs 2026 par défaut)
 * @returns {{
 *   totalETP: number,
 *   totalETPRqth: number,
 *   obligationETP: number,
 *   contributionEstimee: number,
 *   aidesEstimees: number,
 *   estConforme: boolean,
 *   tauxRqth: number,
 *   agentsRqth: Array,
 *   nbAgents: number
 * }}
 */
export const calculerIndicateursOETH = (personnels, options = {}) => {
  const {
    seuilOETH        = 20,
    tauxOETH         = 0.06,
    smicHoraire      = 11.88,
    heuresAnnuelles  = 1820,
    aideEmploiDurable = 1800,
    unitesMontantContrib = 400,
  } = options;

  const totalETP      = personnels.reduce((s, p) => s + (parseFloat(p.etp) || 0), 0);
  const agentsRqth    = personnels.filter(p => p.rqth);
  const totalETPRqth  = agentsRqth.reduce((s, p) => s + (parseFloat(p.etp) || 0), 0);

  const smicAnnuel    = smicHoraire * heuresAnnuelles;
  const obligationETP = totalETP >= seuilOETH ? totalETP * tauxOETH : 0;
  const ecartETP      = totalETPRqth - obligationETP;
  const estConforme   = ecartETP >= 0 || totalETP < seuilOETH;

  const contributionEstimee = !estConforme && totalETP >= seuilOETH
    ? Math.abs(ecartETP) * smicAnnuel * (unitesMontantContrib / heuresAnnuelles)
    : 0;

  const aidesEstimees = estConforme && totalETPRqth > 0 ? totalETPRqth * aideEmploiDurable : 0;
  const tauxRqth      = totalETP > 0 ? (totalETPRqth / totalETP) * 100 : 0;

  return {
    totalETP,
    totalETPRqth,
    obligationETP,
    contributionEstimee,
    aidesEstimees,
    estConforme,
    tauxRqth,
    agentsRqth,
    nbAgents: personnels.length,
  };
};

/**
 * Normalise les affectations du Pool RH pour que chaque agent soit à exactement 100 %.
 * Si un agent est à 0 %, il est laissé tel quel (pas encore configuré).
 */
export const syncPoolRH = (poolRH = []) => {
  return poolRH.map(agent => {
    const affectations = agent.affectations || [];
    if (affectations.length === 0) return agent;
    const totalPct = affectations.reduce((s, a) => s + (parseFloat(a.pct) || 0), 0);
    if (totalPct === 0 || Math.abs(totalPct - 100) < 0.01) return agent;
    const factor = 100 / totalPct;
    return {
      ...agent,
      affectations: affectations.map(a => ({
        ...a,
        pct: Math.round((parseFloat(a.pct) || 0) * factor * 100) / 100,
      })),
    };
  });
};

/**
 * Répartit le budget Direction/Siège sur les services au prorata de leurs ETP.
 * Retourne un tableau { serviceId, nom, etp, quote_part } avec le total Direction inclus.
 */
export const repartirFraisSiege = (budgetDirection, services) => {
  const totalETP = services.reduce((s, srv) => {
    const etp = (srv.personnel || []).reduce((e, p) => e + (parseFloat(p.etp) || 0), 0);
    return s + etp;
  }, 0);
  if (totalETP === 0) return services.map(s => ({ serviceId: s.id, nom: s.nom, etp: 0, quotePart: 0 }));
  const totalSiege = budgetDirection.total || 0;
  return services.map(srv => {
    const etp = (srv.personnel || []).reduce((e, p) => e + (parseFloat(p.etp) || 0), 0);
    return {
      serviceId: srv.id,
      nom: srv.nom,
      etp,
      pctETP: totalETP > 0 ? (etp / totalETP) * 100 : 0,
      quotePart: totalETP > 0 ? (etp / totalETP) * totalSiege : 0,
    };
  });
};

/**
 * Applique un coefficient stress test sur les recettes de subvention d'un service.
 * stressTest : nombre entre -20 et +20 (pourcentage d'ajustement)
 * Retourne les recettes totales ajustées.
 */
const MOTS_SUBVENTION = ['subvention', 'subv.', 'région', 'region', 'état', 'etat', 'département', 'departement', 'commune', 'opco', 'cpom'];
export const appliquerStressTest = (recettes, stressTest) => {
  if (!stressTest || stressTest === 0) return recettes.reduce((s, r) => s + (r.montant || 0) * 12, 0);
  const coeff = 1 + stressTest / 100;
  return recettes.reduce((s, r) => {
    const montantAnnuel = (r.montant || 0) * 12;
    const estSubvention = MOTS_SUBVENTION.some(mot => (r.nom || '').toLowerCase().includes(mot));
    return s + (estSubvention ? montantAnnuel * coeff : montantAnnuel);
  }, 0);
};

/**
 * Calcule les Indemnités de Fin de Carrière (IFC) pour les agents proches de la retraite.
 * Provision estimée = 1/4 de mois de salaire brut de référence par année d'ancienneté.
 *
 * Le salaire brut de référence est identique à celui du budget :
 *   brut_mensuel = (salaire_base + Ségur_si_eligible) × ETP
 *
 * Nécessite anneeNaissance (pour l'âge) ET dateEntree (pour l'ancienneté).
 *
 * @param {number} msETP  — montant Ségur mensuel par ETP (issu de globalParams.montantSegurETP)
 */
export const calculerIFC = (direction, services, poleSupport, anneeRef = 2026, ageLimite = 62, horizonAns = 8, msETP = PRIME_SEGUR) => {
  const tousAgents = [
    ...(direction?.personnel || []).map(p => ({ ...p, _source: 'Siège' })),
    ...(poleSupport?.personnel || []).map(p => ({ ...p, _source: 'Pôle Support' })),
    ...services.flatMap(s => (s.personnel || []).map(p => ({ ...p, _source: s.nom }))),
  ];

  const resultats = tousAgents
    .filter(p => p.anneeNaissance > 0 && p.dateEntree > 0)
    .map(p => {
      const age = anneeRef - p.anneeNaissance;
      const anciennete = Math.max(0, anneeRef - p.dateEntree);
      const anneesAvantRetraite = ageLimite - age;
      const etp = parseFloat(p.etp) || 1;
      // Même base que calculerSalaireAnnuel : brut + Ségur si éligible, proratisé par ETP
      const segurMensuel = p.segur === true ? msETP : (parseFloat(p.segur) || 0);
      const salaireBrutMensuel = ((parseFloat(p.salaire) || 0) + segurMensuel) * etp;
      // IFC CCN 66 art. 26 : 1/4 mois/an jusqu'à 10 ans, puis 1/3 mois/an au-delà
      const tranche1 = Math.min(anciennete, 10);
      const tranche2 = Math.max(0, anciennete - 10);
      const provision = Math.round((salaireBrutMensuel / 4) * tranche1 + (salaireBrutMensuel / 3) * tranche2);
      return {
        id: p.id,
        nom: p.titre || p.nom || '—',
        source: p._source,
        age,
        anciennete,
        anneesAvantRetraite,
        salaireBrutMensuel: Math.round(salaireBrutMensuel),
        segurInclus: segurMensuel > 0,
        provision,
      };
    })
    .filter(p => p.anneesAvantRetraite <= horizonAns && p.anneesAvantRetraite >= 0)
    .sort((a, b) => a.anneesAvantRetraite - b.anneesAvantRetraite);

  const totalProvision = resultats.reduce((s, p) => s + p.provision, 0);
  return { agents: resultats, totalProvision };
};

/**
 * Vérifie la cohérence financière globale et retourne une liste d'alertes.
 *
 * Vérifications effectuées :
 *  - Salaires inférieurs au SMIC (SMIC_VIOLATION)
 *  - Investissements sans durée d'amortissement (INVEST_NO_DURATION)
 *  - Taux de couverture < 80% sur les services avec promos (LOW_COVERAGE)
 *  - Services avec charges > 10k€ et aucune recette (NO_REVENUE)
 *
 * @param {import('../types/index').Direction}    direction
 * @param {import('../types/index').Service[]}    services
 * @param {import('../types/index').PoleSupport}  poleSupport
 * @param {import('../types/index').GlobalParams} globalParams
 * @returns {Array<{ type: 'ER'|'WA', code: string, message: string, entity: string }>}
 */
export const runFinancialAudit = (direction, services, poleSupport, globalParams) => {
  const alertes = [];
  const msETP = globalParams?.montantSegurETP ?? PRIME_SEGUR;

  // Vérification salaires < SMIC
  const tousPersonnels = [
    ...(direction?.personnel || []).map(p => ({ ...p, _source: 'Siège' })),
    ...(poleSupport?.personnel || []).map(p => ({ ...p, _source: 'Pôle Support' })),
    ...services.flatMap(s => (s.personnel || []).map(p => ({ ...p, _source: s.nom }))),
  ];
  tousPersonnels.forEach(p => {
    const salaireMensuel = (parseFloat(p.salaire) || 0) * (parseFloat(p.etp) || 1);
    if (salaireMensuel > 0 && salaireMensuel < SMIC_MENSUEL * (parseFloat(p.etp) || 1)) {
      alertes.push({
        type: 'ER',
        code: 'SMIC_VIOLATION',
        message: `Salaire inférieur au SMIC (${SMIC_MENSUEL.toFixed(2)} €/mois) — vérifier l'ETP ou le salaire brut`,
        entity: `${p.titre || p.nom || '?'} — ${p._source}`,
      });
    }
  });

  // Investissements sans durée d'amortissement
  const sourcesInvest = [
    ...(direction?.investissements ? [{ nom: 'Siège', invs: direction.investissements }] : []),
    ...services.map(s => ({ nom: s.nom, invs: s.investissements })),
  ];
  sourcesInvest.forEach(({ nom, invs }) => {
    if (!invs) return;
    Object.entries(invs).forEach(([type, inv]) => {
      if ((inv.montant || 0) > 0 && !(inv.duree > 0)) {
        alertes.push({
          type: 'WA',
          code: 'INVEST_NO_DURATION',
          message: `Investissement sans durée d'amortissement — le coût annuel sera nul dans les projections`,
          entity: `${nom} — ${type}`,
        });
      }
    });
  });

  // Point mort : services avec promos dont rentabilité < 80% (manque > 20%)
  services.forEach(s => {
    if (!s.promos || s.promos.length === 0) return;
    const bService = calculerBudgetService(s, null, 2026, msETP);
    const statsF = calculerStatsFormation ? null : null; // already in bService.statsFormation
    const effectif = bService.statsFormation?.effectifActuel || 0;
    if (effectif === 0) return;
    const coutParEtudiant = bService.coutParEtudiant;
    if (!coutParEtudiant) return;
    const tauxCouverture = bService.recettes > 0 ? bService.recettes / bService.total : 0;
    if (tauxCouverture < 0.8 && bService.total > 0) {
      alertes.push({
        type: 'WA',
        code: 'LOW_COVERAGE',
        message: `Taux de couverture ${(tauxCouverture * 100).toFixed(0)}% — dépendance subvention élevée (seuil : 80%)`,
        entity: s.nom,
      });
    }
  });

  // Recettes nulles avec charges non nulles
  services.forEach(s => {
    const bService = calculerBudgetService(s, null, 2026, msETP);
    if (bService.total > 10000 && bService.recettes === 0) {
      alertes.push({
        type: 'WA',
        code: 'NO_REVENUE',
        message: `Service avec charges (${Math.round(bService.total / 1000)}k€) mais aucune recette saisie`,
        entity: s.nom,
      });
    }
  });

  return alertes;
};

/**
 * Rolling Forecast — fusionne les réalisés (mois passés) avec le prévisionnel (mois futurs).
 * @param {object} rollingForecast - { moisCourant: number (1-12, 0=désactivé), mois: [{recettes,charges}×12] }
 * @param {object} budgetAnnuelMensuel - retour de calculerBudgetAnnuelMensuel (encaissements/decaissements mensuels)
 * @returns {Array<{mois:string, recettesPrev:number, chargesPrev:number, recettesReel:number, chargesReel:number,
 *                  recettesUsed:number, chargesUsed:number, solde:number, soldeCumule:number, estReel:boolean}>}
 */
export const calculerRollingForecast = (rollingForecast, budgetAnnuelMensuel) => {
  const MOIS_LABELS = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'];
  const moisCourant = rollingForecast?.moisCourant ?? 0;
  const reelMois = rollingForecast?.mois ?? [];
  const prevMensuel = budgetAnnuelMensuel?.mois ?? [];

  const result = [];
  let soldeCumule = 0;
  for (let i = 0; i < 12; i++) {
    const prev = prevMensuel[i] || { encaissements: 0, decaissements: 0 };
    const reel = reelMois[i] || { recettes: 0, charges: 0 };
    const estReel = moisCourant > 0 && i < moisCourant;
    const recettesUsed = estReel ? reel.recettes : prev.encaissements;
    const chargesUsed  = estReel ? reel.charges  : prev.decaissements;
    const solde = recettesUsed - chargesUsed;
    soldeCumule += solde;
    result.push({
      mois: MOIS_LABELS[i],
      recettesPrev: prev.encaissements,
      chargesPrev: prev.decaissements,
      recettesReel: reel.recettes,
      chargesReel: reel.charges,
      recettesUsed,
      chargesUsed,
      solde,
      soldeCumule,
      estReel,
    });
  }
  return result;
};

// Re-exporté depuis storage.js (source unique de vérité)
export { loadFromStorage } from './storage';
