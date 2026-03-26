import { CHARGES_PATRONALES, TAUX_CHARGE_TOTAL, PRIME_SEGUR, JOURS_ANNEE, JOURS_OUVRES_AN, JOURS_CONGES_LEGAL, JOURS_CARENCE_MALADIE, CHARGES_VACATAIRE, SEUIL_HEURES_VACATAIRE, SEUIL_RATIO_VACATAIRE, calculerStatsFormation, SMIC_MENSUEL, TAUX_FILLON_MAX, TAUX_CHARGES_APPRENTI, TAUX_TAXE_SALAIRES } from './constants';

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

// Fonctions de validation des champs numériques
export const validerNombre = (valeur, min = 0, max = Infinity) => {
  const num = parseLocaleNumber(valeur);
  if (isNaN(num)) return min;
  return Math.min(Math.max(num, min), max);
};

export const validerEntier = (valeur, min = 0, max = Infinity) => {
  const num = Math.trunc(parseLocaleNumber(valeur));
  if (isNaN(num)) return min;
  return Math.min(Math.max(num, min), max);
};

export const validerTaux = (valeur) => validerNombre(valeur, 0, 100);
export const validerETP = (valeur) => validerNombre(valeur, 0, 100);
// Salaire : on accepte les décimales (ex : 2500,50 → 2500.5)
export const validerSalaire = (valeur) => validerNombre(valeur, 0, 50000);
export const validerMontant = (valeur) => validerEntier(valeur, 0, 10000000);
export const validerMontantSigne = (valeur) => validerEntier(valeur, -10000000, 10000000);
export const validerDuree = (valeur) => validerEntier(valeur, 1, 50);
export const validerJours = (valeur) => validerEntier(valeur, 0, 365);
export const validerUnites = (valeur) => validerEntier(valeur, 1, 1000);

// Calcul de mensualité de prêt
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
 * - CDI / CDD : 42 % avec allègement Fillon dégressif si salaire < 1,6 × SMIC annuel
 *
 * Formule Fillon officielle :
 *   coeff = (TAUX_FILLON_MAX / 0.6) × (1,6 × SmicAnnuel / SalaireBrut - 1)
 *   réduction = coeff × SalaireBrut, plafonnée à TAUX_FILLON_MAX × SmicAnnuel
 *   taux_net = CHARGES_PATRONALES - réduction / SalaireBrut
 */
export const calculerTauxCharges = (salaireAnnuelBrut, etp, typeContrat = 'CDI') => {
  if (typeContrat === 'Stage' || typeContrat === 'Stagiaire') return 0;
  if (typeContrat === 'Apprentissage' || typeContrat === 'contrat_pro') return TAUX_CHARGES_APPRENTI;

  const etpNum = parseFloat(etp) || 0;
  if (etpNum <= 0 || salaireAnnuelBrut <= 0) return CHARGES_PATRONALES;

  const smicAnnuel = SMIC_MENSUEL * 12 * etpNum;
  const seuilFillon = 1.6 * smicAnnuel;
  if (salaireAnnuelBrut >= seuilFillon) return CHARGES_PATRONALES;

  const reductionMax = TAUX_FILLON_MAX * smicAnnuel;
  const coeff = (TAUX_FILLON_MAX / 0.6) * (seuilFillon / salaireAnnuelBrut - 1);
  const reduction = Math.min(Math.max(coeff * salaireAnnuelBrut, 0), reductionMax);
  return Math.max(0, CHARGES_PATRONALES - reduction / salaireAnnuelBrut);
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
export const calculerSalaireAnnuel = (salaire, etp, segur, typeContrat = 'CDI', tauxChargesManuel = null, dateDebutPrevue = null, moisPrime = null, montantPrime = 0) => {
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
    ? calculerTauxCharges(baseCharges, etpNum * coeffPresence, typeContrat)
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

// Calcul du tableau d'amortissement détaillé par année
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

// Calcul d'amortissement et intérêts
export const calculerAmortissementEtInterets = (investissement) => {
  const { montant, duree, taux } = investissement;
  const amortissement = duree > 0 ? montant / duree : 0;
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

// Calcul du budget Direction (avec impact absences si planningAbsences fourni)
export const calculerBudgetDirection = (direction, planningAbsences = null, annee = 2026, montantSegurETP = PRIME_SEGUR, poolRH = [], tvaParams = null) => {
  const detailsSalaires = (direction.personnel || []).map(p => {
    const sal = calculerSalaireAnnuel(p.salaire, p.etp, resolveSegur(p.segur, montantSegurETP), p.typeContrat, p.tauxChargesManuel, p.estPosteAPourvoir ? p.dateDebutPrevue : null, p.moisPrime, p.montantPrime);
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

  // Recettes propres de la direction
  const recettes = (direction.recettes || [])
    .reduce((sum, r) => sum + (parseFloat(r.montant) || 0), 0) * 12;

  // Amortissements (si investissements renseignés)
  let amortissements = 0;
  if (direction.investissements) {
    Object.values(direction.investissements).forEach(inv => {
      if ((inv.montant || 0) > 0 && (inv.duree || 0) > 0) amortissements += inv.montant / inv.duree;
    });
  }

  const total = totalSalaires + exploitation + amortissements + coutCarenceMaladie;

  return {
    salaires: totalSalaires,
    salairesPermanents,
    detailsSalaires,
    detailsPoolRH: partPool.details,
    chargesSiege: exploitation,   // alias backward-compat (= exploitation complète)
    exploitation,
    recettes,
    amortissements,
    coutCarenceMaladie,
    etpContractuel,
    etpReel,
    total,
    solde: recettes - total,
  };
};

// Calcul du budget Service (remplace calculerBudgetLieu)
// planningAbsences optionnel : si fourni, intègre l'impact des arrêts maladie (coût carence)
export const calculerBudgetService = (service, planningAbsences = null, annee = 2026, montantSegurETP = PRIME_SEGUR, poolRH = [], tvaParams = null) => {
  const detailsSalaires = (service.personnel || []).map(p => {
    const sal = calculerSalaireAnnuel(p.salaire, p.etp, resolveSegur(p.segur, montantSegurETP), p.typeContrat, p.tauxChargesManuel, p.estPosteAPourvoir ? p.dateDebutPrevue : null, p.moisPrime, p.montantPrime);
    const presence = planningAbsences
      ? calculerPresenceAgent(p, service.nom, planningAbsences, annee)
      : null;
    return {
      titre: p.titre,
      etp: p.etp,
      salaire: p.salaire,
      segur: p.segur,
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
    const sal = calculerSalaireAnnuel(p.salaire, p.etp, resolveSegur(p.segur, montantSegurETP), p.typeContrat, p.tauxChargesManuel, p.estPosteAPourvoir ? p.dateDebutPrevue : null);
    const pctFC = moisKeysFI.reduce((s, m) => s + (rfc[m] || 0), 0) / 12;
    salairesAllouesFC += sal.total * pctFC / 100;
    salairesAllouesFI += sal.total * (1 - pctFC / 100);
  });

  const exploitation = service.exploitation.reduce((sum, item) => sum + _montantReelExploitation(item, tvaParams) * 12, 0);
  const exploitationRealisee = service.exploitation.reduce((sum, item) => item.realise != null ? sum + item.realise * 12 : sum, 0);

  // Calcul des recettes annuelles
  const recettes = service.recettes ? service.recettes.reduce((sum, item) => sum + item.montant * 12, 0) : 0;
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

  const unitesAnnuelles = unites * (service.tauxActivite / 100) * JOURS_ANNEE;
  const totalAvantAmort = salaires + exploitation + interets + coutCarenceMaladie;
  const totalCharges = totalAvantAmort + amortissements;
  const solde = recettes - totalCharges;
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
    const totalChargesService = salaires + exploitation;
    coutParEtudiant = {
      totalCharges: totalChargesService,
      effectif: statsFormation.effectifActuel,
      coutParEtudiant: totalChargesService / statsFormation.effectifActuel,
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
    exploitation,
    exploitationRealisee,
    exploitationDetails: service.exploitation,
    recettes,
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

// Calcul du budget Pôle Support
export const calculerBudgetPoleSupport = (poleSupport, planningAbsences = null, annee = 2026, montantSegurETP = PRIME_SEGUR, poolRH = [], tvaParams = null) => {
  const detailsSalaires = (poleSupport.personnel || []).map(p => {
    const sal = calculerSalaireAnnuel(p.salaire, p.etp, resolveSegur(p.segur, montantSegurETP), p.typeContrat, p.tauxChargesManuel, p.estPosteAPourvoir ? p.dateDebutPrevue : null, p.moisPrime, p.montantPrime);
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
  const recettes = (poleSupport.recettes || []).reduce((sum, item) => sum + (parseFloat(item.montant) || 0) * 12, 0);

  // Amortissements (si investissements renseignés)
  let amortissements = 0;
  if (poleSupport.investissements) {
    Object.values(poleSupport.investissements).forEach(inv => {
      if ((inv.montant || 0) > 0 && (inv.duree || 0) > 0) amortissements += inv.montant / inv.duree;
    });
  }

  const total = salaires + exploitation + amortissements + coutCarenceMaladie;
  return {
    salaires, salairesPermanents, detailsSalaires, detailsPoolRH: partPool.details,
    exploitation, recettes, amortissements, coutCarenceMaladie, etpContractuel, etpReel,
    total,
    solde: recettes - total,
  };
};

// Calcul des provisions (dynamique avec catégories personnalisables)
export const calculerProvisions = (direction, services, globalParams, poleSupport = null, poolRH = []) => {
  const msETP = globalParams.montantSegurETP ?? PRIME_SEGUR;
  const tvaParams = globalParams?.gestionTVA ? { gestionTVA: true, tauxTVAMoyen: globalParams.tauxTVAMoyen ?? 20 } : null;
  const budgetDir = calculerBudgetDirection(direction, null, 2026, msETP, poolRH, tvaParams);
  let totalSalaires = budgetDir.salaires;
  let totalInvestissements = 0;
  let chiffreAffaires = 0;

  services.forEach(s => {
    const bService = calculerBudgetService(s, null, 2026, msETP, poolRH, tvaParams);
    totalSalaires += bService.salaires;
    totalInvestissements += bService.totalInvestissements;
    chiffreAffaires += bService.recettes; // CA = recettes, pas les charges totales
  });

  if (poleSupport) {
    const bPS = calculerBudgetPoleSupport(poleSupport, null, 2026, msETP, poolRH, tvaParams);
    totalSalaires += bPS.salaires;
  }

  // Bases de calcul disponibles
  const bases = {
    salaires: totalSalaires,
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

// Calcul du BFR
export const calculerBFR = (direction, services, globalParams, poleSupport = null, poolRH = []) => {
  const msETP = globalParams?.montantSegurETP ?? PRIME_SEGUR;
  const tvaParams = globalParams?.gestionTVA ? { gestionTVA: true, tauxTVAMoyen: globalParams.tauxTVAMoyen ?? 20 } : null;
  let chiffreAffaires = 0;
  let achatsExploitation = 0;

  const budgetDir = calculerBudgetDirection(direction, null, 2026, msETP, poolRH, tvaParams);
  achatsExploitation += budgetDir.chargesSiege;

  services.forEach(s => {
    const bService = calculerBudgetService(s, null, 2026, msETP, poolRH, tvaParams);
    chiffreAffaires += bService.recettes;
    achatsExploitation += bService.exploitation;
  });

  if (poleSupport) {
    const bPS = calculerBudgetPoleSupport(poleSupport, null, 2026, msETP, poolRH, tvaParams);
    achatsExploitation += bPS.exploitation;
  }

  const stocks = globalParams.stocksValeur || 0;
  const creancesClients = (chiffreAffaires / JOURS_ANNEE) * globalParams.delaiPaiementClients;
  const dettesFournisseurs = (achatsExploitation / JOURS_ANNEE) * globalParams.delaiPaiementFournisseurs;
  const bfr = stocks + creancesClients - dettesFournisseurs;
  const bfrEnJours = chiffreAffaires > 0 ? (bfr / chiffreAffaires) * 365 : 0;

  return {
    stocks,
    creancesClients,
    dettesFournisseurs,
    bfr,
    bfrEnJours,
    chiffreAffaires,
    achatsExploitation
  };
};

// Calcul du Fond de Roulement
export const calculerFondRoulement = (direction, services, globalParams) => {
  // Calcul des immobilisations nettes (valeur d'acquisition - amortissements cumulés)
  let totalImmobilisations = 0;
  let totalAmortissementsCumules = 0;

  services.forEach(s => {
    Object.values(s.investissements).forEach(inv => {
      totalImmobilisations += inv.montant;
      // Approximation : amortissement première année
      if (inv.duree > 0) {
        totalAmortissementsCumules += inv.montant / inv.duree;
      }
    });
  });

  const immobilisationsNettes = totalImmobilisations - totalAmortissementsCumules;

  // Capitaux permanents (personnalisables)
  const fondRoulementItems = globalParams.fondRoulement || [];
  const totalCapitauxPermanents = fondRoulementItems.reduce((sum, item) => sum + (item.montant || 0), 0);

  // Fonds de roulement = Capitaux permanents - Immobilisations nettes
  const fondRoulement = totalCapitauxPermanents - immobilisationsNettes;

  return {
    details: fondRoulementItems,
    totalCapitauxPermanents,
    immobilisationsNettes,
    totalImmobilisations,
    totalAmortissementsCumules,
    fondRoulement
  };
};

// Calcul synthèse 3 ans
export const calculerSynthese3Ans = (direction, services, globalParams, poleSupport = null, poolRH = []) => {
  const msETP = globalParams?.montantSegurETP ?? PRIME_SEGUR;
  const tvaParams = globalParams?.gestionTVA ? { gestionTVA: true, tauxTVAMoyen: globalParams.tauxTVAMoyen ?? 20 } : null;
  const bServices = services.map(s => calculerBudgetService(s, null, 2026, msETP, poolRH, tvaParams));
  const bPoleSupport = poleSupport ? calculerBudgetPoleSupport(poleSupport, null, 2026, msETP, poolRH, tvaParams) : null;

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

    const budgetDir = calculerBudgetDirection(direction, null, 2026, msETP, poolRH, tvaParams);
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
        const coeff = cat === 'energie' ? augmEnergie : cat === 'loyers' ? augmLoyers : augmAutres;
        return sum + (parseFloat(item.montant) || 0) * 12 * coeff;
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

    return {
      annee,
      total: totalGlobal,
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

// Calcul budget annuel détaillé par mois
export const calculerBudgetAnnuelMensuel = (direction, services, globalParams, poleSupport = null, poolRH = []) => {
  const msETP = globalParams?.montantSegurETP ?? PRIME_SEGUR;
  const tvaParams = globalParams?.gestionTVA
    ? { gestionTVA: true, tauxTVAMoyen: globalParams.tauxTVAMoyen ?? 20 }
    : null;
  const budgetDir = calculerBudgetDirection(direction, null, 2026, msETP, poolRH, tvaParams);

  let totalSalaires = budgetDir.salaires;
  let totalExploitation = budgetDir.chargesSiege;
  let totalAmortissements = 0;
  let totalInterets = 0;

  services.forEach(s => {
    const bService = calculerBudgetService(s, null, 2026, msETP, poolRH, tvaParams);
    totalSalaires += bService.salaires;
    totalExploitation += bService.exploitation;
    totalAmortissements += bService.amortissements;
    totalInterets += bService.interets;
  });

  if (poleSupport) {
    const bPS = calculerBudgetPoleSupport(poleSupport, null, 2026, msETP, poolRH, tvaParams);
    totalSalaires += bPS.salaires;
    totalExploitation += bPS.exploitation;
  }

  // ── Taxe sur les salaires (associations non assujetties TVA) ────────────────
  const taxeSalairesActive = globalParams?.taxeSalaires === true;
  const tauxTaxe = taxeSalairesActive ? ((globalParams.tauxTaxeSalaires ?? 4.25) / 100) : 0;
  const taxeSalaires = totalSalaires * tauxTaxe;

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

  // Services (avec saisonnalité possible)
  services.forEach(s => {
    (s.recettes || []).forEach(item => {
      const annuel = item.montant * 12;
      if (Array.isArray(item.repartitionMensuelle) && item.repartitionMensuelle.length === 12) {
        const somme = item.repartitionMensuelle.reduce((a, b) => a + b, 0) || 100;
        item.repartitionMensuelle.forEach((p, i) => {
          recettesMensuelles[i] += annuel * (p / somme);
        });
      } else {
        for (let i = 0; i < 12; i++) recettesMensuelles[i] += annuel / 12;
      }
    });
  });

  // Direction et Pôle Support — recettes uniformes (pas de saisonnalité configurée)
  const recettesDirMois = (direction?.recettes || []).reduce((s, r) => s + (r.montant || 0), 0);
  const recettesPS_mois = (poleSupport?.recettes || []).reduce((s, r) => s + (r.montant || 0), 0);
  for (let i = 0; i < 12; i++) recettesMensuelles[i] += recettesDirMois + recettesPS_mois;

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
export const calculerETPReelParMoisParService = (services, direction, poleSupport, planningAbsences, annee = 2026) => {
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

    const pct = aff.pct / 100;
    const etpEffectif = (parseFloat(agent.etp) || 0) * pct;
    const montantSegur = agent.segur === true ? montantSegurETP : (parseFloat(agent.segur) || 0);
    const sal = calculerSalaireAnnuel(agent.salaire, etpEffectif, montantSegur, agent.typeContrat, agent.tauxChargesManuel);

    totalSalaires += sal.total;
    details.push({ ...agent, etpEffectif, pctAffecte: aff.pct, coutQuotePart: sal.total });
  });

  return { totalSalaires, details };
};

// ─── ALERTES RH ─────────────────────────────────────────────────────────────

/**
 * Génère des alertes RH : fins de contrat et départs en retraite imminents.
 * dateRef : Date de référence (défaut = aujourd'hui)
 * Retourne un tableau d'objets { lvl: 'error'|'warning'|'info', type: 'rh', msg: string }
 */
export const calculerAlertesRH = (direction, poleSupport, services, dateRef = new Date()) => {
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
  const budgetDir = calculerBudgetDirection(direction, null, 2026, msETP, poolRH, tvaParams);

  // ── DÉCAISSEMENTS ──────────────────────────────────────────────────────────

  // 1. Salaires + charges sociales : versements mensuels fixes
  let totalSalairesAnnuels = budgetDir.salaires;

  // 2. Remboursement emprunts (flux réel de trésorerie) :
  //    intérêts financiers + capital remboursé année 1
  //    Les dotations aux amortissements sont EXCLUES (charge non décaissée)
  let totalInteretsAnnuels = 0;
  let capitalRembourseAnnuel = 0;

  // 3. Exploitation saisonnalisée par ligne (moisPaiement ou repartitionMensuelle)
  const exploitationMensuels = Array(12).fill(0);

  // Direction — exploitation uniforme, salaires déjà dans budgetDir.salaires
  for (let i = 0; i < 12; i++) exploitationMensuels[i] += budgetDir.chargesSiege / 12;

  services.forEach(s => {
    const b = calculerBudgetService(s, null, 2026, msETP, poolRH, tvaParams);
    totalSalairesAnnuels += b.salaires;
    totalInteretsAnnuels += b.interets; // intérêts financiers année 1 (décaissés)

    // Capital remboursé sur emprunts (flux réel, distinct de la dotation comptable)
    Object.values(b.detailsInvest || {}).forEach(inv => {
      if (inv.tableauAmort && inv.tableauAmort.length > 0) {
        capitalRembourseAnnuel += inv.tableauAmort[0].capitalRembourse;
      }
    });

    // Exploitation du service — saisonnalisable (montant réel TVA-ajusté)
    (s.exploitation || []).forEach(item => {
      const annuel = _montantReelExploitation(item, tvaParams) * 12;
      const mensuel = repartirSur12Mois(annuel, item);
      for (let i = 0; i < 12; i++) exploitationMensuels[i] += mensuel[i];
    });
  });

  if (poleSupport) {
    const bPS = calculerBudgetPoleSupport(poleSupport, null, 2026, msETP, poolRH, tvaParams);
    totalSalairesAnnuels += bPS.salaires;
    (poleSupport.exploitation || []).forEach(item => {
      const annuel = _montantReelExploitation(item, tvaParams) * 12;
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
  const taxeSalairesActive = globalParams?.taxeSalaires === true;
  const taxeSalaires = taxeSalairesActive
    ? totalSalairesAnnuels * ((globalParams.tauxTaxeSalaires ?? 4.25) / 100)
    : 0;

  // Charges fixes décaissées chaque mois : salaires base + annuité d'emprunt (÷ 12)
  // Les primes s'ajoutent mois par mois selon _calculerPrimesMensuelles
  const chargesFixesParMois = (totalSalairesBase + totalInteretsAnnuels + capitalRembourseAnnuel) / 12;

  // ── ENCAISSEMENTS ──────────────────────────────────────────────────────────

  const encaissementsMensuels = Array(12).fill(0);

  services.forEach(s => {
    // Facteurs mensuels selon effectifs réels (abandons cumulatifs) — services avec promos uniquement
    const facteurs = calculerFacteursMoisService(s);
    (s.recettes || []).forEach(item => {
      const annuel = (item.montant || 0) * 12;
      const mensuel = repartirSur12Mois(annuel, item);
      for (let i = 0; i < 12; i++) encaissementsMensuels[i] += mensuel[i] * facteurs[i];
    });
  });

  // Recettes direction et pôle support (uniformes)
  const recettesDir = (direction?.recettes || []).reduce((s, r) => s + (r.montant || 0), 0);
  const recettesPS  = (poleSupport?.recettes  || []).reduce((s, r) => s + (r.montant || 0), 0);
  for (let i = 0; i < 12; i++) encaissementsMensuels[i] += recettesDir + recettesPS;

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
    _debug: { totalSalairesAnnuels, totalInteretsAnnuels, capitalRembourseAnnuel, totalPrimesAnnuelles },
    alertesMois,
  };
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
      // IFC = 1/4 de mois brut × ancienneté (convention collective type CCN 66 / FEHAP)
      const provision = Math.round((salaireBrutMensuel / 4) * anciennete);
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

// Vérificateur de cohérence financière
// Retourne un tableau d'alertes { type: 'ER'|'WA', code, message, entity }
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

// Fonction pour charger depuis localStorage
export const loadFromStorage = (key, defaultValue) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch {
    return defaultValue;
  }
};
