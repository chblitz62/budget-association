import { CHARGES_PATRONALES, TAUX_CHARGE_TOTAL, PRIME_SEGUR, JOURS_ANNEE, JOURS_OUVRES_AN, JOURS_CONGES_LEGAL, JOURS_CARENCE_MALADIE, CHARGES_VACATAIRE, SEUIL_HEURES_VACATAIRE, SEUIL_RATIO_VACATAIRE, calculerStatsFormation, SMIC_MENSUEL, TAUX_FILLON_MAX, TAUX_CHARGES_APPRENTI } from './constants';

// Fonctions de validation des champs numériques
export const validerNombre = (valeur, min = 0, max = Infinity) => {
  const num = parseFloat(valeur);
  if (isNaN(num)) return min;
  return Math.min(Math.max(num, min), max);
};

export const validerEntier = (valeur, min = 0, max = Infinity) => {
  const num = parseInt(valeur);
  if (isNaN(num)) return min;
  return Math.min(Math.max(num, min), max);
};

export const validerTaux = (valeur) => validerNombre(valeur, 0, 100);
export const validerETP = (valeur) => validerNombre(valeur, 0, 100);
export const validerSalaire = (valeur) => validerEntier(valeur, 0, 50000);
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
 * Règles appliquées :
 *  - Salaire brut annuel   = salaire mensuel × 12 × ETP
 *  - Charges patronales    = selon type de contrat + allègement Fillon automatique
 *  - Prime Ségur           = montant mensuel × ETP  (proratisée ETP, soumise aux charges patronales)
 *  - ETP peut être < 1 (temps partiel) ou > 1 (heures supplémentaires structurelles)
 *
 * Champs retournés :
 *  brut          : salaire brut annuel (hors Ségur, hors charges)
 *  brutSegur     : prime Ségur brute annuelle (montant × 12 × ETP)
 *  charges       : total charges patronales employeur (sur salaire + Ségur)
 *  tauxCharges   : taux effectif appliqué (après allègement Fillon si applicable)
 *  segur         : coût Ségur total employeur (brut + charges patronales sur Ségur)
 *  total         : coût employeur complet = brut + charges + segur
 */
export const calculerSalaireAnnuel = (salaire, etp, segur, typeContrat = 'CDI') => {
  const etpNum             = parseFloat(etp) || 0;
  const salaireNum         = parseFloat(salaire) || 0;

  // Salaire brut annuel (hors Ségur)
  const salaireAnnuel      = salaireNum * 12 * etpNum;

  // Prime Ségur : rétrocompat booléen (true → 238 €) ou montant numérique
  const montantSegurMensuel = segur === true ? PRIME_SEGUR
                            : (typeof segur === 'number' ? segur : 0);
  // Ségur brut annuel (proraté ETP)
  const brutSegur           = montantSegurMensuel * 12 * etpNum;

  // Taux de charges selon contrat (Fillon calculé sur la rémunération totale)
  const baseCharges         = salaireAnnuel + brutSegur;
  const tauxCharges         = calculerTauxCharges(baseCharges, etpNum, typeContrat);
  const charges             = baseCharges * tauxCharges;

  // Coût Ségur total employeur = Ségur brut + charges patronales sur Ségur
  const segurEmployeur      = brutSegur * (1 + tauxCharges);

  return {
    brut:        salaireAnnuel,
    brutSegur:   brutSegur,
    charges:     charges,
    tauxCharges: tauxCharges,
    segur:       segurEmployeur,
    total:       salaireAnnuel + charges + brutSegur
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
  const amortissement = montant / duree;
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
export const calculerBudgetDirection = (direction, planningAbsences = null, annee = 2026, montantSegurETP = PRIME_SEGUR, poolRH = []) => {
  const detailsSalaires = (direction.personnel || []).map(p => {
    const sal = calculerSalaireAnnuel(p.salaire, p.etp, resolveSegur(p.segur, montantSegurETP), p.typeContrat);
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

  // Support ancien format (loyer/charges/autresCharges) et nouveau format (chargesSiege[])
  const chargesSiege = direction.chargesSiege
    ? direction.chargesSiege.reduce((sum, c) => sum + (parseFloat(c.montant) || 0), 0) * 12
    : ((direction.loyer || 0) + (direction.charges || 0) + (direction.autresCharges || 0)) * 12;

  return {
    salaires: totalSalaires,
    salairesPermanents,
    detailsSalaires,
    detailsPoolRH: partPool.details,
    chargesSiege,
    coutCarenceMaladie,
    etpContractuel,
    etpReel,
    total: totalSalaires + chargesSiege + coutCarenceMaladie
  };
};

// Calcul du budget Service (remplace calculerBudgetLieu)
// planningAbsences optionnel : si fourni, intègre l'impact des arrêts maladie (coût carence)
export const calculerBudgetService = (service, planningAbsences = null, annee = 2026, montantSegurETP = PRIME_SEGUR, poolRH = []) => {
  const detailsSalaires = (service.personnel || []).map(p => {
    const sal = calculerSalaireAnnuel(p.salaire, p.etp, resolveSegur(p.segur, montantSegurETP), p.typeContrat);
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
  const salairesAllouesFI = (service.personnel || []).reduce((sum, p) => {
    if (!p.repartitionFI) return sum;
    const sal = calculerSalaireAnnuel(p.salaire, p.etp, resolveSegur(p.segur, montantSegurETP));
    const pctMoyen = moisKeysFI.reduce((s, m) => s + (p.repartitionFI[m] || 0), 0) / 12;
    return sum + sal.total * pctMoyen / 100;
  }, 0);

  const exploitation = service.exploitation.reduce((sum, item) => sum + item.montant * 12, 0);
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
export const calculerBudgetPoleSupport = (poleSupport, planningAbsences = null, annee = 2026, montantSegurETP = PRIME_SEGUR, poolRH = []) => {
  const detailsSalaires = (poleSupport.personnel || []).map(p => {
    const sal = calculerSalaireAnnuel(p.salaire, p.etp, resolveSegur(p.segur, montantSegurETP), p.typeContrat);
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
  const exploitation = (poleSupport.exploitation || []).reduce((sum, item) => sum + item.montant * 12, 0);
  const recettes = (poleSupport.recettes || []).reduce((sum, item) => sum + item.montant * 12, 0);
  return { salaires, salairesPermanents, detailsSalaires, detailsPoolRH: partPool.details, exploitation, recettes, coutCarenceMaladie, etpContractuel, etpReel, total: salaires + exploitation + coutCarenceMaladie };
};

// Calcul des provisions (dynamique avec catégories personnalisables)
export const calculerProvisions = (direction, services, globalParams, poleSupport = null, poolRH = []) => {
  const msETP = globalParams.montantSegurETP ?? PRIME_SEGUR;
  const budgetDir = calculerBudgetDirection(direction, null, 2026, msETP, poolRH);
  let totalSalaires = budgetDir.salaires;
  let totalInvestissements = 0;
  let chiffreAffaires = 0;

  services.forEach(s => {
    const bService = calculerBudgetService(s, null, 2026, msETP, poolRH);
    totalSalaires += bService.salaires;
    totalInvestissements += bService.totalInvestissements;
    chiffreAffaires += bService.recettes; // CA = recettes, pas les charges totales
  });

  if (poleSupport) {
    const bPS = calculerBudgetPoleSupport(poleSupport, null, 2026, msETP, poolRH);
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
  let chiffreAffaires = 0;
  let achatsExploitation = 0;

  const budgetDir = calculerBudgetDirection(direction, null, 2026, msETP, poolRH);
  achatsExploitation += budgetDir.chargesSiege;

  services.forEach(s => {
    const bService = calculerBudgetService(s, null, 2026, msETP, poolRH);
    chiffreAffaires += bService.recettes;
    achatsExploitation += bService.exploitation;
  });

  if (poleSupport) {
    const bPS = calculerBudgetPoleSupport(poleSupport, null, 2026, msETP, poolRH);
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
  const bServices = services.map(s => calculerBudgetService(s, null, 2026, msETP, poolRH));
  const bPoleSupport = poleSupport ? calculerBudgetPoleSupport(poleSupport, null, 2026, msETP, poolRH) : null;

  return [1, 2, 3].map(annee => {
    const indexAnnee = annee - 1;
    const augmentation = Math.pow(1 + globalParams.augmentationAnnuelle / 100, indexAnnee);
    const budgetDir = calculerBudgetDirection(direction, null, 2026, msETP, poolRH);
    const budgetDirAjuste = (budgetDir.salaires + budgetDir.chargesSiege) * augmentation;
    const budgetPSAjuste = bPoleSupport ? (bPoleSupport.salaires + bPoleSupport.exploitation) * augmentation : 0;

    // Total des unités calculé depuis bServices (correct pour les services avec promos)
    const totalUnitesGlobal = bServices.reduce((sum, b) => sum + b.unitesAnnuelles, 0);

    let totalGlobal = budgetDirAjuste + budgetPSAjuste;
    let totalUnites = 0;
    let amortTotal = 0;
    let interetsTotal = 0;
    let detailsServices = [];

    bServices.forEach((bService, idx) => {
      const s = services[idx];
      const budgetServiceAjuste = (bService.salaires + bService.exploitation) * augmentation;
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

// Calcul budget annuel détaillé par mois
export const calculerBudgetAnnuelMensuel = (direction, services, globalParams, poleSupport = null, poolRH = []) => {
  const msETP = globalParams?.montantSegurETP ?? PRIME_SEGUR;
  const budgetDir = calculerBudgetDirection(direction, null, 2026, msETP, poolRH);

  let totalSalaires = budgetDir.salaires;
  let totalExploitation = budgetDir.chargesSiege;
  let totalAmortissements = 0;
  let totalInterets = 0;

  services.forEach(s => {
    const bService = calculerBudgetService(s, null, 2026, msETP, poolRH);
    totalSalaires += bService.salaires;
    totalExploitation += bService.exploitation;
    totalAmortissements += bService.amortissements;
    totalInterets += bService.interets;
  });

  if (poleSupport) {
    const bPS = calculerBudgetPoleSupport(poleSupport, null, 2026, msETP, poolRH);
    totalSalaires += bPS.salaires;
    totalExploitation += bPS.exploitation;
  }

  const total = totalSalaires + totalExploitation + totalAmortissements + totalInterets;

  // Répartition mensuelle (simplifiée - uniforme)
  const mois = [];
  for (let i = 0; i < 12; i++) {
    mois.push({
      mois: i + 1,
      salaires: totalSalaires / 12,
      exploitation: totalExploitation / 12,
      amortissements: totalAmortissements / 12,
      interets: totalInterets / 12,
      total: total / 12
    });
  }

  return {
    totalAnnuel: total,
    salaires: totalSalaires,
    exploitation: totalExploitation,
    amortissements: totalAmortissements,
    interets: totalInterets,
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
    const sal = calculerSalaireAnnuel(agent.salaire, etpEffectif, montantSegur, agent.typeContrat);

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
 * Calcule un tableau de trésorerie mensuel sur 12 mois.
 * Prend en compte la saisonnalité des recettes si configurée (item.saisonnalite + item.repartitionMensuelle[12]).
 * Retourne { mois[12], totalEncaissements, totalDecaissements, alertesMois[] }
 */
export const calculerTresorerieMensuelle = (direction, services, globalParams, poleSupport = null, poolRH = []) => {
  const msETP = globalParams?.montantSegurETP ?? PRIME_SEGUR;
  const budgetDir = calculerBudgetDirection(direction, null, 2026, msETP, poolRH);

  let totalChargesAnnuelles = budgetDir.salaires + budgetDir.chargesSiege;
  let totalAmortissements = 0;
  let totalInterets = 0;

  services.forEach(s => {
    const b = calculerBudgetService(s, null, 2026, msETP, poolRH);
    totalChargesAnnuelles += b.salaires + b.exploitation;
    totalAmortissements += b.amortissements;
    totalInterets += b.interets;
  });

  if (poleSupport) {
    const bPS = calculerBudgetPoleSupport(poleSupport, null, 2026, msETP, poolRH);
    totalChargesAnnuelles += bPS.salaires + bPS.exploitation;
  }

  const decaissementsParMois = (totalChargesAnnuelles + totalAmortissements + totalInterets) / 12;

  // Encaissements mensuels (avec saisonnalité par ligne de recette)
  const encaissementsMensuels = Array(12).fill(0);

  services.forEach(s => {
    (s.recettes || []).forEach(item => {
      if (item.saisonnalite && Array.isArray(item.repartitionMensuelle) && item.repartitionMensuelle.length === 12) {
        item.repartitionMensuelle.forEach((pct, i) => {
          encaissementsMensuels[i] += item.montant * 12 * (pct / 100);
        });
      } else {
        for (let i = 0; i < 12; i++) encaissementsMensuels[i] += item.montant;
      }
    });
  });

  // Recettes direction et pôle support (uniformes)
  const recettesDir = (direction?.recettes || []).reduce((s, r) => s + (r.montant || 0), 0);
  const recettesPS = (poleSupport?.recettes || []).reduce((s, r) => s + (r.montant || 0), 0);
  for (let i = 0; i < 12; i++) encaissementsMensuels[i] += recettesDir + recettesPS;

  const MOIS_LABELS = ['Janv.','Févr.','Mars','Avr.','Mai','Juin','Juil.','Août','Sept.','Oct.','Nov.','Déc.'];

  let soldeCumule = 0;
  const alertesMois = [];
  const mois = MOIS_LABELS.map((nom, i) => {
    const encaissements = encaissementsMensuels[i];
    const decaissements = decaissementsParMois;
    const solde = encaissements - decaissements;
    soldeCumule += solde;
    if (soldeCumule < 0) alertesMois.push(i);
    return { nom, encaissements, decaissements, solde, soldeCumule };
  });

  return {
    mois,
    totalEncaissements: encaissementsMensuels.reduce((s, v) => s + v, 0),
    totalDecaissements: decaissementsParMois * 12,
    alertesMois,
  };
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
