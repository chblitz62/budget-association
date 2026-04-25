import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { useBudgetData } from '../hooks/useBudgetData';
import { PRIME_SEGUR, calculerStatsFormation } from '../utils/constants';
import {
  calculerBudgetDirection,
  calculerBudgetService,
  calculerBudgetPoleSupport,
  calculerSalaireAnnuel,
  calculerProvisions,
  calculerBFR,
  calculerFondRoulement,
  calculerSynthese3Ans,
  calculerBudgetAnnuelMensuel,
  calculerTresorerieMensuelle,
  calculerProjection36Mois,
  calculerAlertesRH,
  appliquerStressTest,
  verifierCoherencePoolRH,
  calculerRollingForecast,
} from '../utils/calculations';

const BudgetContext = createContext(null);

export const BudgetProvider = ({ children }) => {
  const budgetData = useBudgetData();
  const {
    globalParams,
    direction, services, poleSupport,
    poolRH, planningAbsences,
    enveloppeFormation, reportingFC, donneesN1,
    benevoles, repartitionTemps, pilotageSites,
  } = budgetData;

  const [stressTest, setStressTest] = useState(0);

  const msETP = globalParams.montantSegurETP ?? PRIME_SEGUR;
  const coefficientBP = globalParams.coefficientBP ?? 100;
  const seuilCouverture = globalParams.seuilCouverture ?? 90;

  const tvaParams = useMemo(
    () => globalParams.gestionTVA
      ? { gestionTVA: true, tauxTVAMoyen: globalParams.tauxTVAMoyen ?? 20 }
      : null,
    [globalParams.gestionTVA, globalParams.tauxTVAMoyen]
  );

  // Budget functions avec planningAbsences (calcul complet)
  const getBudgetDirection   = useCallback(() => calculerBudgetDirection(direction, planningAbsences, 2026, msETP, poolRH, tvaParams, coefficientBP),   [direction, planningAbsences, msETP, poolRH, tvaParams, coefficientBP]);
  const getBudgetPoleSupport = useCallback(() => calculerBudgetPoleSupport(poleSupport, planningAbsences, 2026, msETP, poolRH, tvaParams, coefficientBP), [poleSupport, planningAbsences, msETP, poolRH, tvaParams, coefficientBP]);
  const getBudgetService     = useCallback((s) => calculerBudgetService(s, planningAbsences, 2026, msETP, poolRH, tvaParams, coefficientBP),             [planningAbsences, msETP, poolRH, tvaParams, coefficientBP]);
  const getProvisions        = useCallback(() => calculerProvisions(direction, services, globalParams, poleSupport, poolRH),                              [direction, services, globalParams, poleSupport, poolRH]);
  const getBFR               = useCallback(() => calculerBFR(direction, services, globalParams, poleSupport, poolRH),                                    [direction, services, globalParams, poleSupport, poolRH]);
  const getFondRoulement     = useCallback((sg) => calculerFondRoulement(direction, services, globalParams, poleSupport, sg ?? null),                    [direction, services, globalParams, poleSupport]);

  // Callbacks sans planningAbsences (SubventionRegion / DAF — calcul budget pur)
  const cbBudgetSvc = useCallback((s)  => calculerBudgetService(s, null, 2026, msETP, poolRH, null, coefficientBP),    [msETP, poolRH, coefficientBP]);
  const cbBudgetDir = useCallback((d)  => calculerBudgetDirection(d, null, 2026, msETP, poolRH, null, coefficientBP),   [msETP, poolRH, coefficientBP]);
  const cbBudgetPS  = useCallback((ps) => calculerBudgetPoleSupport(ps, null, 2026, msETP, poolRH, null, coefficientBP),[msETP, poolRH, coefficientBP]);

  const summary3Ans    = useMemo(() => calculerSynthese3Ans(direction, services, globalParams, poleSupport, poolRH),         [direction, services, globalParams, poleSupport, poolRH]);
  const budgetAnnuel   = useMemo(() => calculerBudgetAnnuelMensuel(direction, services, globalParams, poleSupport, poolRH), [direction, services, globalParams, poleSupport, poolRH]);
  const tresorerie     = useMemo(() => calculerTresorerieMensuelle(direction, services, globalParams, poleSupport, poolRH), [direction, services, globalParams, poleSupport, poolRH]);
  const projection36   = useMemo(() => calculerProjection36Mois(direction, services, globalParams, poleSupport, poolRH),    [direction, services, globalParams, poleSupport, poolRH]);
  const rollingForecastData = useMemo(() => calculerRollingForecast(budgetData.rollingForecast, budgetAnnuel), [budgetData.rollingForecast, budgetAnnuel]);

  const masseSalarialeTotal = useMemo(() => {
    const allP = [
      ...(direction?.personnel || []),
      ...(poleSupport?.personnel || []),
      ...services.flatMap(s => s.personnel || []),
      ...(poolRH || []),
    ];
    return allP.reduce((tot, p) => {
      const sr = p.segur === true ? msETP : (parseFloat(p.segur) || 0);
      return tot + calculerSalaireAnnuel(p.salaire, p.etp, sr, p.typeContrat, p.tauxChargesManuel).total;
    }, 0);
  }, [direction, poleSupport, services, poolRH, msETP]);

  const personnelEligibleSubvention = useMemo(() => {
    const all = [
      ...(direction?.personnel || []).map(p => ({ ...p, _source: 'Direction' })),
      ...(poleSupport?.personnel || []).map(p => ({ ...p, _source: 'Pôle Ressources' })),
      ...services.flatMap(s => (s.personnel || []).map(p => ({ ...p, _source: s.nom }))),
      ...(poolRH || []).map(p => ({ ...p, _source: 'Pool RH' })),
    ].filter(p => p.eligibleSubvention);
    return all.map(p => {
      const sr = p.segur === true ? msETP : (parseFloat(p.segur) || 0);
      const sal = calculerSalaireAnnuel(p.salaire, p.etp, sr, p.typeContrat, p.tauxChargesManuel);
      const rfc = p.repartitionFC || p.repartitionFI;
      const pctFCraw = rfc
        ? Math.min(1, Object.values(rfc).reduce((s, v) => s + (parseFloat(v) || 0), 0) / 1200)
        : 0;
      const pctFI = 1 - pctFCraw;
      return { ...p, coutAnnuel: sal.total, pctFI: Math.round(pctFI * 100), coutSubventionnable: sal.total * pctFI };
    });
  }, [direction, poleSupport, services, msETP]);

  const statsFormation = useMemo(() => ({
    effectifTotal: services.reduce((s, srv) => s + (srv.promos ? calculerStatsFormation(srv).effectifActuel : (srv.unites || 0)), 0),
    parService: services.map(srv => ({ id: srv.id, nom: srv.nom, stats: srv.promos ? calculerStatsFormation(srv) : null })),
  }), [services]);

  const kpiGlobaux = useMemo(() => {
    const budgetDir = getBudgetDirection();
    const budgetPS  = getBudgetPoleSupport();
    const recettes = services.reduce((sum, s) => {
      if (stressTest !== 0) return sum + appliquerStressTest(s.recettes || [], stressTest);
      return sum + getBudgetService(s).recettes;
    }, 0)
    + (stressTest !== 0 ? appliquerStressTest(direction.recettes || [], stressTest) : budgetDir.recettes)
    + (stressTest !== 0 ? appliquerStressTest(poleSupport.recettes || [], stressTest) : budgetPS.recettes);
    const recettesBase = services.reduce((sum, s) => sum + getBudgetService(s).recettes, 0) + budgetDir.recettes + budgetPS.recettes;
    const charges = services.reduce((sum, s) => sum + getBudgetService(s).total, 0) + budgetDir.total + budgetPS.total;
    const solde = recettes - charges;
    const etp = (direction.personnel || []).reduce((s, p) => s + (parseFloat(p.etp) || 0), 0)
      + (poleSupport.personnel || []).reduce((s, p) => s + (parseFloat(p.etp) || 0), 0)
      + services.reduce((s, srv) => s + (srv.personnel || []).reduce((s2, p) => s2 + (parseFloat(p.etp) || 0), 0), 0)
      + (poolRH || []).reduce((s, p) => s + (parseFloat(p.etp) || 0), 0);
    const etudiants = services.reduce((s, srv) => {
      if (srv.promos) return s + calculerStatsFormation(srv).effectifActuel;
      return s + (srv.unites || 0);
    }, 0);
    const totalEngagementsOuverts = (budgetData.engagements || [])
      .filter(e => e.statut === 'ouvert')
      .reduce((s, e) => s + (parseFloat(e.montant) || 0), 0);
    return {
      totalRecettes: recettes, totalRecettesBase: recettesBase,
      totalCharges: charges,
      soldeGlobal: solde, soldeGlobalBase: recettesBase - charges,
      stressImpact: solde - (recettesBase - charges),
      hasDeficit: solde < 0,
      totalETP: etp, totalEtudiants: etudiants,
      tauxCouverture: charges > 0 ? (recettes / charges) * 100 : 0,
      coutParEtudiant: etudiants > 0 ? Math.round(charges / etudiants) : 0,
      totalProvisions: getProvisions().total,
      totalEngagementsOuverts,
    };
  }, [services, direction, poleSupport, stressTest, getBudgetService, getBudgetDirection, getBudgetPoleSupport, getProvisions, budgetData.engagements]);

  const alertes = useMemo(() => {
    const { hasDeficit, soldeGlobal, totalRecettes, totalCharges, tauxCouverture } = kpiGlobaux;
    const list = [];
    if (hasDeficit)
      list.push({ lvl: 'error', msg: `Déficit global : ${Math.round(-soldeGlobal).toLocaleString()} € (recettes ${Math.round(totalRecettes).toLocaleString()} € vs charges ${Math.round(totalCharges).toLocaleString()} €)` });
    services.forEach(srv => {
      const bs = getBudgetService(srv);
      if (bs.solde < 0) list.push({ lvl: 'warning', msg: `Service « ${srv.nom} » en déficit : ${Math.round(-bs.solde).toLocaleString()} €` });
    });
    const bfrData = getBFR(); const frData = getFondRoulement(soldeGlobal);
    if (bfrData.bfr > 0 && frData.fondRoulement < bfrData.bfr)
      list.push({ lvl: 'warning', msg: `BFR (${Math.round(bfrData.bfr).toLocaleString()} €) supérieur au Fonds de Roulement (${Math.round(frData.fondRoulement).toLocaleString()} €) — risque trésorerie` });
    if (tauxCouverture > 0 && tauxCouverture < seuilCouverture)
      list.push({ lvl: 'info', msg: `Taux de couverture faible : ${tauxCouverture.toFixed(1)}% (seuil d'alerte : ${seuilCouverture}% — objectif cible : 100%)` });
    if (kpiGlobaux.totalProvisions === 0)
      list.push({ lvl: 'info', msg: 'Aucune provision constituée — vérifier les taux dans le bloc Provisions' });
    calculerAlertesRH(direction, poleSupport, services, new Date(), poolRH || []).forEach(a => list.push(a));
    verifierCoherencePoolRH(poolRH).forEach(a =>
      list.push({ lvl: a.totalPct > 100 ? 'error' : 'warning', msg: `Pool RH — ${a.msg}` })
    );
    if (tresorerie.alertesMois.length > 0)
      list.push({ lvl: 'warning', msg: `Tension de trésorerie prévisionnelle : solde cumulé négatif en ${tresorerie.alertesMois.map(i => ['janv','févr','mars','avr','mai','juin','juil','août','sept','oct','nov','déc'][i]).join(', ')}` });
    return list;
  }, [kpiGlobaux, services, direction, poleSupport, poolRH, tresorerie, getBudgetService, getBFR, getFondRoulement, seuilCouverture]);

  const value = {
    // Raw data + setters (from useBudgetData)
    ...budgetData,
    // Derived scalars
    msETP, coefficientBP, seuilCouverture, tvaParams,
    // Stress test
    stressTest, setStressTest,
    // Budget functions
    getBudgetDirection, getBudgetPoleSupport, getBudgetService,
    getProvisions, getBFR, getFondRoulement,
    cbBudgetSvc, cbBudgetDir, cbBudgetPS,
    // Aggregates
    summary3Ans, budgetAnnuel, tresorerie, projection36, rollingForecastData,
    masseSalarialeTotal, personnelEligibleSubvention, statsFormation,
    // KPIs + alertes
    kpiGlobaux, alertes,
  };

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
};

export const useBudget = () => {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error('useBudget doit être utilisé dans BudgetProvider');
  return ctx;
};
