import React, { useMemo, useState } from 'react';
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Users, Euro, BarChart2,
  Clock, Shield, Zap, MapPin, Briefcase, GraduationCap, FileText, BookOpen,
  PiggyBank, Droplets, Target, AlertCircle, Activity, ChevronDown, ChevronUp,
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import {
  calculerBudgetService,
  calculerBudgetDirection,
  calculerBudgetPoleSupport,
  calculerSalaireAnnuel,
  appliquerStressTest,
  calculerBFR,
  calculerTresorerieMensuelle,
  calculerStatsVacataires,
  runFinancialAudit,
  calculerAlertesRH,
  calculerIFC,
  calculerSynthese3Ans,
  verifierCoherencePoolRH,
} from '../utils/calculations';
import { PRIME_SEGUR, FINANCIAL_HELP } from '../utils/constants';
import HelpIcon from './ui/HelpIcon';

// ── KPI compact (strip du haut) ───────────────────────────────────────────────
function KpiPill({ label, value, sub, color, icon: Icon, darkMode, help }) {
  const dm = darkMode;
  const colors = {
    green:  { bg: dm ? 'bg-emerald-900/40 border-emerald-700' : 'bg-emerald-50 border-emerald-200', val: dm ? 'text-emerald-300' : 'text-emerald-700' },
    red:    { bg: dm ? 'bg-red-900/40 border-red-700'         : 'bg-red-50 border-red-200',         val: dm ? 'text-red-300'     : 'text-red-700' },
    amber:  { bg: dm ? 'bg-amber-900/40 border-amber-700'     : 'bg-amber-50 border-amber-200',     val: dm ? 'text-amber-300'   : 'text-amber-700' },
    blue:   { bg: dm ? 'bg-blue-900/40 border-blue-700'       : 'bg-blue-50 border-blue-200',       val: dm ? 'text-blue-300'    : 'text-blue-700' },
    violet: { bg: dm ? 'bg-violet-900/40 border-violet-700'   : 'bg-violet-50 border-violet-200',   val: dm ? 'text-violet-300'  : 'text-violet-700' },
    slate:  { bg: dm ? 'bg-zinc-800 border-zinc-700'          : 'bg-slate-50 border-slate-200',     val: dm ? 'text-white'       : 'text-slate-800' },
  };
  const c = colors[color] || colors.slate;
  return (
    <div className={`rounded-xl border p-3 flex flex-col gap-0.5 ${c.bg}`}>
      <div className={`flex items-center justify-between text-[10px] font-bold uppercase tracking-wide ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
        <div className="flex items-center gap-1">
          {Icon && <Icon size={11} />}
          {label}
        </div>
        {help && <HelpIcon {...help} darkMode={darkMode} position="bottom" />}
      </div>
      <div className={`text-xl font-black leading-tight ${c.val}`}>{value}</div>
      {sub && <div className={`text-[10px] leading-tight ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>{sub}</div>}
    </div>
  );
}

// ── Section accordéon ─────────────────────────────────────────────────────────
function Section({ title, icon: Icon, open, onToggle, darkMode, badge, children }) {
  const dm = darkMode;
  return (
    <div className={`rounded-2xl border overflow-hidden ${dm ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-slate-200'}`}>
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-5 py-3.5 text-left transition-colors ${dm ? 'hover:bg-zinc-800' : 'hover:bg-slate-50'}`}
      >
        <span className={`flex items-center gap-2 text-sm font-black uppercase tracking-wide ${dm ? 'text-zinc-300' : 'text-slate-600'}`}>
          {Icon && <Icon size={14} className={dm ? 'text-zinc-500' : 'text-slate-400'} />}
          {title}
        </span>
        <div className="flex items-center gap-2">
          {badge}
          {open ? <ChevronUp size={15} className={dm ? 'text-zinc-500' : 'text-slate-400'} /> : <ChevronDown size={15} className={dm ? 'text-zinc-500' : 'text-slate-400'} />}
        </div>
      </button>
      {open && <div className="px-5 pb-5 pt-1">{children}</div>}
    </div>
  );
}

// ── Badge compteur ────────────────────────────────────────────────────────────
function CountBadge({ n, color = 'red', darkMode }) {
  if (!n) return null;
  const dm = darkMode;
  const cls = color === 'red'
    ? (dm ? 'bg-red-900/50 text-red-300 border-red-700' : 'bg-red-100 text-red-700 border-red-200')
    : (dm ? 'bg-amber-900/50 text-amber-300 border-amber-700' : 'bg-amber-100 text-amber-700 border-amber-200');
  return <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full border ${cls}`}>{n}</span>;
}

// ── Barre de progression ──────────────────────────────────────────────────────
function ProgressBar({ pct, color = 'blue', darkMode }) {
  const dm = darkMode;
  const bar = { blue: 'bg-blue-500', green: 'bg-emerald-500', amber: 'bg-amber-400', red: 'bg-red-500', violet: 'bg-violet-500' };
  return (
    <div className={`h-2 rounded-full overflow-hidden ${dm ? 'bg-zinc-700' : 'bg-slate-200'}`}>
      <div className={`h-full rounded-full ${bar[color] || bar.blue}`} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </div>
  );
}

// ── Ligne entité ──────────────────────────────────────────────────────────────
function EntityRow({ label, bs, darkMode, seuilCouverture = 90 }) {
  const dm = darkMode;
  const recLibres = bs.recettes - (bs.recettesFD || 0);
  const chg = bs.salaires + bs.exploitation;
  const couv = chg > 0 ? (recLibres / chg) * 100 : (recLibres > 0 ? 100 : 0);
  const ok = couv >= seuilCouverture;
  const warn = couv >= 80 && couv < seuilCouverture;
  return (
    <div className={`grid grid-cols-5 gap-2 px-3 py-2.5 rounded-xl text-xs items-center ${dm ? 'bg-zinc-800/50' : 'bg-slate-50'}`}>
      <span className={`font-semibold truncate ${dm ? 'text-white' : 'text-slate-700'}`}>{label}</span>
      <span className={`text-right font-bold ${dm ? 'text-red-400' : 'text-red-600'}`}>{Math.round(chg).toLocaleString()} €</span>
      <span className={`text-right font-bold ${dm ? 'text-emerald-400' : 'text-emerald-600'}`}>{Math.round(bs.recettes).toLocaleString()} €</span>
      <span className={`text-right font-black ${bs.solde >= 0 ? (dm ? 'text-emerald-300' : 'text-emerald-700') : (dm ? 'text-red-300' : 'text-red-700')}`}>
        {bs.solde >= 0 ? '+' : ''}{Math.round(bs.solde).toLocaleString()} €
      </span>
      <div className="flex items-center gap-1.5">
        <ProgressBar pct={couv} color={ok ? 'green' : warn ? 'amber' : 'red'} darkMode={darkMode} />
        <span className={`text-[10px] font-black w-8 text-right shrink-0 ${ok ? (dm ? 'text-emerald-400' : 'text-emerald-600') : warn ? (dm ? 'text-amber-400' : 'text-amber-600') : (dm ? 'text-red-400' : 'text-red-600')}`}>
          {couv > 0 ? `${Math.round(couv)}%` : '—'}
        </span>
      </div>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function DashboardDG({ direction, poleSupport, services, poolRH, globalParams, darkMode }) {
  const dm = darkMode;
  const msETP = globalParams.montantSegurETP ?? PRIME_SEGUR;
  const seuilCouverture = globalParams.seuilCouverture ?? 90;

  // Accordéons ouverts par défaut
  const [openSections, setOpenSections] = useState({ rh: false, peda: false, proj: false, transv: false, audit: false, site: false });
  const toggle = key => setOpenSections(s => ({ ...s, [key]: !s[key] }));

  // ── Calculs agrégés ─────────────────────────────────────────────────────────
  const agg = useMemo(() => {
    const bd = calculerBudgetDirection(direction, null, 2026, msETP, poolRH);
    const bp = calculerBudgetPoleSupport(poleSupport, null, 2026, msETP, poolRH);
    const bServices = services.map(s => ({ service: s, bs: calculerBudgetService(s, null, 2026, msETP, poolRH) }));

    const totalCharges = (bd.salaires + bd.exploitation) + (bp.salaires + bp.exploitation) + bServices.reduce((s, { bs }) => s + bs.salaires + bs.exploitation, 0);
    const totalRecettes = bd.recettes + bp.recettes + bServices.reduce((s, { bs }) => s + bs.recettes, 0);
    const totalFD = (bd.recettesFD || 0) + (bp.recettesFD || 0) + bServices.reduce((s, { bs }) => s + (bs.recettesFD || 0), 0);
    const totalRecettesLibres = totalRecettes - totalFD;
    const resultat = totalRecettes - totalCharges;
    const tauxCouverture = totalCharges > 0 ? (totalRecettesLibres / totalCharges) * 100 : 0;

    const allPersonnel = [...(direction?.personnel || []), ...(poleSupport?.personnel || []), ...services.flatMap(s => s.personnel || []), ...(poolRH || [])];
    const masseSalariale = allPersonnel.reduce((tot, p) => {
      const sr = p.segur === true ? msETP : (parseFloat(p.segur) || 0);
      return tot + calculerSalaireAnnuel(p.salaire, p.etp, sr, p.typeContrat, p.tauxChargesManuel).total;
    }, 0);
    const etpTotal = allPersonnel.reduce((s, p) => s + parseFloat(p.etp || 0), 0);
    const nbStagiaires = bServices.reduce((tot, { bs }) => tot + (bs.statsFormation?.effectifActuel || 0), 0);

    const chargesParSite = {};
    bServices.forEach(({ service, bs }) => {
      if (!service.promos || typeof service.promos !== 'object') return;
      const effParSite = {};
      let effTotal = 0;
      Object.entries(service.promos).forEach(([site, items]) => {
        if (!Array.isArray(items)) return;
        let e = 0;
        items.forEach(item => {
          if (typeof item.effectifInitial === 'number') e += item.effectifInitial;
          else if (Array.isArray(item.promos)) item.promos.forEach(p => { e += p.effectifInitial || 0; });
        });
        effParSite[site] = e; effTotal += e;
      });
      const n = Object.keys(effParSite).length;
      if (!n) return;
      Object.entries(effParSite).forEach(([site, e]) => {
        if (!chargesParSite[site]) chargesParSite[site] = { charges: 0, recettes: 0, etudiants: 0 };
        const r = effTotal > 0 ? e / effTotal : 1 / n;
        chargesParSite[site].charges += (bs.salaires + bs.exploitation) * r;
        chargesParSite[site].recettes += bs.recettes * r;
        chargesParSite[site].etudiants += e;
      });
    });

    const reserves = (globalParams.fondRoulement || []).reduce((s, f) => s + (parseFloat(f.montant) || 0), 0);
    const dureeVieReserves = resultat < 0 && reserves > 0 ? reserves / Math.abs(resultat) : null;
    const allRecettes = [...(direction.recettes || []), ...(poleSupport.recettes || []), ...services.flatMap(s => s.recettes || [])];
    const impactStress = appliquerStressTest(allRecettes, 0) - appliquerStressTest(allRecettes, -20);

    const totalChargesRealisees = (bd.exploitationRealisee || 0) + (bp.exploitationRealisee || 0) + bServices.reduce((s, { bs }) => s + (bs.exploitationRealisee || 0), 0);
    const totalRecettesRealisees = (bd.recettesRealisees || 0) + (bp.recettesRealisees || 0) + bServices.reduce((s, { bs }) => s + (bs.recettesRealisees || 0), 0);
    const hasRealise = bd.hasRealise || bp.hasRealise || bServices.some(({ bs }) => bs.hasRealise);

    return {
      bd, bp, bServices, totalCharges, totalRecettes, totalFD, resultat, tauxCouverture,
      masseSalariale, pctMS: totalCharges > 0 ? (masseSalariale / totalCharges) * 100 : 0,
      etpTotal, nbStagiaires, chargesParSite, reserves, dureeVieReserves, impactStress,
      chargesParETP: etpTotal > 0 ? totalCharges / etpTotal : 0,
      recettesParETP: etpTotal > 0 ? totalRecettes / etpTotal : 0,
      chargesParEtudiant: nbStagiaires > 0 ? totalCharges / nbStagiaires : 0,
      recettesParEtudiant: nbStagiaires > 0 ? totalRecettes / nbStagiaires : 0,
      totalChargesRealisees, totalRecettesRealisees, hasRealise,
    };
  }, [direction, poleSupport, services, poolRH, globalParams, msETP]);

  // ── Calculs DAF avancés ─────────────────────────────────────────────────────
  const daf = useMemo(() => {
    const amortTotal = (agg.bd.amortissements || 0) + (agg.bp.amortissements || 0) + agg.bServices.reduce((s, { bs }) => s + (bs.amortissements || 0), 0);
    const caf = agg.resultat + amortTotal;
    const chargesFixees = agg.masseSalariale + amortTotal;
    const pctChargesFixees = agg.totalCharges > 0 ? (chargesFixees / agg.totalCharges) * 100 : 0;
    const chargesMensuelles = agg.totalCharges / 12;
    const solvabiliteMois = chargesMensuelles > 0 && agg.reserves > 0 ? agg.reserves / chargesMensuelles : 0;

    const motsClesSubv = ['subvention', 'région', 'region', 'état', 'etat', 'département', 'departement', 'opco', 'taxe apprentissage', "taxe d'apprentissage", 'fonds de formation'];
    const allRecettesItems = [...(direction.recettes || []), ...(poleSupport.recettes || []), ...services.flatMap(s => s.recettes || [])];
    let totalSubventions = 0, totalPropres = 0;
    allRecettesItems.forEach(r => {
      if (r.fondsDedie) return;
      const montant = (parseFloat(r.montant) || 0) * 12;
      if (motsClesSubv.some(m => (r.nom || '').toLowerCase().includes(m))) totalSubventions += montant;
      else totalPropres += montant;
    });
    const pctSubventions = (totalSubventions + totalPropres) > 0 ? (totalSubventions / (totalSubventions + totalPropres)) * 100 : 0;

    let tresorerie = null; try { tresorerie = calculerTresorerieMensuelle(direction, services, globalParams, poleSupport, poolRH); } catch {}
    let bfr = null; try { bfr = calculerBFR(direction, services, globalParams, poleSupport, poolRH); } catch {}
    let statsVac = null; try { statsVac = calculerStatsVacataires(services, msETP); } catch {}
    let auditItems = []; try { auditItems = runFinancialAudit(direction, services, poleSupport, globalParams) || []; } catch {}
    let alertesRH = []; try { alertesRH = calculerAlertesRH(direction, poleSupport, services, new Date()) || []; } catch {}
    let ifc = null; try { ifc = calculerIFC(direction, services, poleSupport, 2026, 62, 8, msETP); } catch {}

    let projection3ans = null;
    try {
      const s3 = calculerSynthese3Ans(direction, services, globalParams, poleSupport, poolRH);
      const augRate = (globalParams?.augmentationAnnuelle ?? 2.5) / 100;
      projection3ans = s3.map((s, i) => {
        const rec = agg.totalRecettes * Math.pow(1 + augRate, i);
        return { annee: `${2026 + i}`, charges: Math.round(s.total), recettes: Math.round(rec), caf: Math.round(rec - s.total + s.amortissements) };
      });
    } catch {}

    const ratioLiquidite = chargesMensuelles > 0 ? (tresorerie?.mois?.[0]?.soldeCumule ?? 0) / chargesMensuelles : null;

    const pilotPeda = agg.bServices
      .filter(({ bs }) => bs.statsFormation?.totalEtudiants > 0)
      .map(({ service, bs }) => {
        const sf = bs.statsFormation;
        return { nom: service.nom, effectifInitial: sf.totalEtudiants, effectifActuel: sf.effectifActuel, abandons: sf.totalAbandons, tauxRetention: sf.totalEtudiants > 0 ? (sf.effectifActuel / sf.totalEtudiants) * 100 : 100, coutParEtudiant: bs.coutParEtudiant || 0, recetteParEtudiant: sf.effectifActuel > 0 ? bs.recettes / sf.effectifActuel : 0 };
      });

    // Transversalité
    const poolRHMatrix = (poolRH || []).map(agent => {
      const entities = {};
      let totalPct = 0;
      (agent.affectations || []).forEach(aff => {
        const label = aff.entityType === 'direction' ? 'Siège' : aff.entityType === 'poleSupport' ? 'Pôle Support' : (services.find(s => s.id === aff.entityId)?.nom || `Service ${aff.entityId}`);
        entities[label] = (entities[label] || 0) + (parseFloat(aff.pct) || 0);
        totalPct += (parseFloat(aff.pct) || 0);
      });
      const seg = agent.segur === true ? msETP : (parseFloat(agent.segur) || 0);
      return { nom: agent.titre || 'Agent', entities, totalPct, ok: Math.abs(totalPct - 100) < 0.1, coutTotal: calculerSalaireAnnuel(agent.salaire, agent.etp, seg, agent.typeContrat, agent.tauxChargesManuel).total };
    });

    const alertesPoolRH = verifierCoherencePoolRH(poolRH || []);
    const repartSiege = direction.repartition || {};
    const totalPctSiege = Object.values(repartSiege).reduce((s, v) => s + (parseFloat(v) || 0), 0);
    const siegeParService = Object.entries(repartSiege).filter(([, v]) => parseFloat(v) > 0)
      .map(([id, pct]) => ({ nom: services.find(s => s.id === parseInt(id))?.nom || `Service #${id}`, pct: parseFloat(pct) || 0, montant: Math.round((agg.bd.salaires + agg.bd.exploitation) * (parseFloat(pct) / 100)) }))
      .sort((a, b) => b.pct - a.pct);
    const repartPS = poleSupport.repartition || {};
    const totalPctPS = Object.values(repartPS).reduce((s, v) => s + (parseFloat(v) || 0), 0);
    const psParService = Object.entries(repartPS).filter(([, v]) => parseFloat(v) > 0)
      .map(([id, pct]) => ({ nom: services.find(s => s.id === parseInt(id))?.nom || `Service #${id}`, pct: parseFloat(pct) || 0, montant: Math.round((agg.bp.salaires + agg.bp.exploitation) * (parseFloat(pct) / 100)) }))
      .sort((a, b) => b.pct - a.pct);

    const fcfiParService = agg.bServices.map(({ service, bs }) => {
      const totalMS = bs.salaires || 0;
      const partFI = bs.salairesAllouesFI || 0;
      return { nom: service.nom, totalAgents: (service.personnel || []).length, agentsAvecRep: (service.personnel || []).filter(p => p.repartitionFC || p.repartitionFI).length, totalMS, partFI, partFC: totalMS - partFI, pctFI: totalMS > 0 ? (partFI / totalMS) * 100 : 0, pctFC: totalMS > 0 ? ((totalMS - partFI) / totalMS) * 100 : 0 };
    }).filter(s => s.totalMS > 0);

    const anomaliesTransv = [
      ...alertesPoolRH.map(a => ({ niveau: 'warn', msg: a.msg, cat: 'Pool RH' })),
      ...(Math.abs(totalPctSiege - 100) > 1 && Object.keys(repartSiege).length > 0 ? [{ niveau: totalPctSiege > 100 ? 'error' : 'warn', cat: 'Frais siège', msg: `Répartition frais siège = ${totalPctSiege.toFixed(0)}% (attendu 100%)` }] : []),
      ...(Math.abs(totalPctPS - 100) > 1 && Object.keys(repartPS).length > 0 ? [{ niveau: totalPctPS > 100 ? 'error' : 'warn', cat: 'Pôle Support', msg: `Répartition Pôle Support = ${totalPctPS.toFixed(0)}% (attendu 100%)` }] : []),
    ];

    const nbAlertes = auditItems.filter(a => a.type === 'ER').length + alertesRH.filter(a => a.lvl === 'error').length;
    const nbVigil = auditItems.filter(a => a.type === 'WA').length + alertesRH.filter(a => a.lvl === 'warning').length + anomaliesTransv.length;

    return {
      caf, amortTotal, chargesFixees, pctChargesFixees, solvabiliteMois, ratioLiquidite,
      totalSubventions, totalPropres, pctSubventions,
      tresorerie, bfr, statsVac, auditItems, alertesRH, ifc, pilotPeda, projection3ans,
      poolRHMatrix, alertesPoolRH, siegeParService, totalPctSiege, psParService, totalPctPS, fcfiParService, anomaliesTransv,
      nbAlertes, nbVigil,
    };
  }, [agg, direction, poleSupport, services, poolRH, globalParams, msETP]);

  const { tauxCouverture, resultat, totalCharges, totalRecettes, masseSalariale, pctMS } = agg;
  const couleurCouv = tauxCouverture >= 100 ? 'green' : tauxCouverture >= seuilCouverture ? 'amber' : 'red';

  // Alertes consolidées
  const alertesGlobales = [
    ...(tauxCouverture < seuilCouverture ? [{ level: 'red', msg: `Taux de couverture ${Math.round(tauxCouverture)}% sous le seuil de ${seuilCouverture}%` }] : []),
    ...(agg.dureeVieReserves !== null && agg.dureeVieReserves < 1 ? [{ level: 'red', msg: `Réserves épuisées dans ${agg.dureeVieReserves.toFixed(1)} an — risque de cessation de paiement` }] : []),
    ...(agg.dureeVieReserves !== null && agg.dureeVieReserves < 2 && agg.dureeVieReserves >= 1 ? [{ level: 'amber', msg: `Réserves limitées à ${agg.dureeVieReserves.toFixed(1)} an au rythme actuel` }] : []),
    ...(pctMS > 80 ? [{ level: 'amber', msg: `Masse salariale à ${Math.round(pctMS)}% des charges — médiane médico-social : 70–75%` }] : []),
    ...(daf.pctSubventions > 80 ? [{ level: 'amber', msg: `Dépendance aux subventions à ${Math.round(daf.pctSubventions)}% — vulnérabilité aux décisions publiques` }] : []),
    ...(daf.tresorerie?.alertesMois?.length >= 3 ? [{ level: 'amber', msg: `${daf.tresorerie.alertesMois.length} mois de trésorerie déficitaire prévus` }] : []),
    ...agg.bServices.map(({ service, bs }) => {
      const rec = bs.recettes - (bs.recettesFD || 0), chg = bs.salaires + bs.exploitation;
      const tc = chg > 0 ? (rec / chg) * 100 : (rec > 0 ? 100 : 0);
      return tc < seuilCouverture && tc > 0 ? { level: 'amber', msg: `${service.nom} : taux de couverture ${Math.round(tc)}%` } : null;
    }).filter(Boolean),
  ];

  return (
    <div className="space-y-4">

      {/* ── En-tête ──────────────────────────────────────────────────────────── */}
      <div className={`rounded-2xl border px-5 py-3.5 flex items-center justify-between ${dm ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-slate-200'}`}>
        <div>
          <h2 className={`text-lg font-black flex items-center gap-2 ${dm ? 'text-white' : 'text-slate-800'}`}>
            <BarChart2 size={20} className="text-blue-500" />
            Tableau de Bord — DAF
          </h2>
          <p className={`text-xs mt-0.5 ${dm ? 'text-zinc-400' : 'text-slate-400'}`}>
            Budget prévisionnel 2026 · {services.length} service{services.length > 1 ? 's' : ''} + Direction + Pôle Support
          </p>
        </div>
        <div className="flex items-center gap-2">
          {alertesGlobales.filter(a => a.level === 'red').length > 0 && (
            <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${dm ? 'bg-red-900/50 text-red-300 border border-red-700' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              <AlertTriangle size={12} /> {alertesGlobales.filter(a => a.level === 'red').length} critique{alertesGlobales.filter(a => a.level === 'red').length > 1 ? 's' : ''}
            </span>
          )}
          {alertesGlobales.filter(a => a.level === 'amber').length > 0 && (
            <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${dm ? 'bg-amber-900/50 text-amber-300 border border-amber-700' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
              <AlertTriangle size={12} /> {alertesGlobales.filter(a => a.level === 'amber').length} vigilance
            </span>
          )}
          <span className={`text-xs px-2.5 py-1 rounded-full ${dm ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-500'}`}>
            {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* ── Strip KPIs critiques ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiPill label="Couverture" value={`${Math.round(tauxCouverture)}%`} sub={`Seuil ${seuilCouverture}% · ${tauxCouverture >= seuilCouverture ? 'OK' : 'ALERTE'}`} color={couleurCouv} icon={tauxCouverture >= seuilCouverture ? CheckCircle : AlertTriangle} darkMode={darkMode} help={FINANCIAL_HELP.tauxCouverture} />
        <KpiPill label="Résultat" value={`${resultat >= 0 ? '+' : ''}${Math.round(resultat / 1000)}k€`} sub={resultat >= 0 ? 'Excédent' : 'Déficit'} color={resultat >= 0 ? 'green' : 'red'} icon={resultat >= 0 ? TrendingUp : TrendingDown} darkMode={darkMode} />
        <KpiPill label="CAF" value={`${daf.caf >= 0 ? '+' : ''}${Math.round(daf.caf / 1000)}k€`} sub={`Résultat + ${Math.round(daf.amortTotal / 1000)}k€ amort.`} color={daf.caf >= 0 ? 'green' : 'red'} icon={PiggyBank} darkMode={darkMode} help={{ title: "Capacité d'autofinancement", text: "CAF = Résultat + Amortissements. Mesure la capacité à financer les investissements sans recourir à l'emprunt." }} />
        <KpiPill label="Réserves" value={agg.reserves > 0 ? `${Math.round(agg.reserves / 1000)}k€` : '—'} sub={daf.solvabiliteMois > 0 ? `${daf.solvabiliteMois.toFixed(1)} mois de charges` : 'Non renseignées'} color={daf.solvabiliteMois >= 6 ? 'green' : daf.solvabiliteMois >= 3 ? 'amber' : agg.reserves > 0 ? 'red' : 'slate'} icon={Shield} darkMode={darkMode} help={FINANCIAL_HELP.reservesAsso} />
        <KpiPill label="Stress -20% subv." value={`-${Math.round(agg.impactStress / 1000)}k€`} sub="Impact choc subventions" color="violet" icon={Zap} darkMode={darkMode} />
      </div>

      {/* ── Corps principal : 2 colonnes ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Colonne gauche */}
        <div className="space-y-4">

          {/* Synthèse financière */}
          <div className={`rounded-2xl border p-4 space-y-3 ${dm ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-slate-200'}`}>
            <h3 className={`text-xs font-black uppercase tracking-wide ${dm ? 'text-zinc-400' : 'text-slate-400'}`}>Synthèse financière</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Total charges', val: `${Math.round(totalCharges / 1000)}k€`, sub: 'Salaires + exploit. + amort.', color: dm ? 'text-red-400' : 'text-red-600' },
                { label: 'Total recettes', val: `${Math.round(totalRecettes / 1000)}k€`, sub: agg.totalFD > 0 ? `dont ${Math.round(agg.totalFD / 1000)}k€ FD` : 'Subv. + propres', color: dm ? 'text-emerald-400' : 'text-emerald-600' },
                { label: 'Masse salariale', val: `${Math.round(masseSalariale / 1000)}k€`, sub: `${Math.round(pctMS)}% des charges`, color: pctMS > 80 ? (dm ? 'text-amber-300' : 'text-amber-700') : (dm ? 'text-blue-300' : 'text-blue-700') },
                { label: 'Charges fixes', val: `${Math.round(daf.pctChargesFixees)}%`, sub: `Sal. + amort. sur total`, color: dm ? 'text-zinc-300' : 'text-slate-700' },
              ].map((item, i) => (
                <div key={i} className={`rounded-xl p-3 ${dm ? 'bg-zinc-800' : 'bg-slate-50'}`}>
                  <div className={`text-[10px] font-bold uppercase ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>{item.label}</div>
                  <div className={`text-lg font-black ${item.color}`}>{item.val}</div>
                  <div className={`text-[10px] ${dm ? 'text-zinc-600' : 'text-slate-400'}`}>{item.sub}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'ETP', val: agg.etpTotal.toFixed(1) },
                { label: 'Apprenants', val: agg.nbStagiaires || '—' },
                { label: 'Ch./ETP', val: agg.chargesParETP > 0 ? `${Math.round(agg.chargesParETP / 1000)}k€` : '—' },
                { label: 'Ch./Étudiant', val: agg.chargesParEtudiant > 0 ? `${Math.round(agg.chargesParEtudiant / 1000)}k€` : '—' },
              ].map((item, i) => (
                <div key={i} className={`rounded-xl p-2.5 text-center ${dm ? 'bg-zinc-800' : 'bg-slate-50'}`}>
                  <div className={`text-[10px] font-bold uppercase ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>{item.label}</div>
                  <div className={`text-sm font-black ${dm ? 'text-white' : 'text-slate-800'}`}>{item.val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tableau détail par entité */}
          <div className={`rounded-2xl border p-4 ${dm ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-slate-200'}`}>
            <h3 className={`text-xs font-black uppercase tracking-wide mb-3 ${dm ? 'text-zinc-400' : 'text-slate-400'}`}>Détail par entité</h3>
            <div className={`grid grid-cols-5 gap-2 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${dm ? 'text-zinc-600' : 'text-slate-400'}`}>
              <span>Entité</span><span className="text-right">Charges</span><span className="text-right">Recettes</span><span className="text-right">Solde</span><span>Couverture</span>
            </div>
            <div className="space-y-1.5">
              <EntityRow label="Direction / Siège" bs={agg.bd} darkMode={darkMode} seuilCouverture={seuilCouverture} />
              <EntityRow label="Pôle Support" bs={agg.bp} darkMode={darkMode} seuilCouverture={seuilCouverture} />
              {agg.bServices.map(({ service, bs }) => (
                <EntityRow key={service.id} label={service.nom} bs={bs} darkMode={darkMode} seuilCouverture={seuilCouverture} />
              ))}
            </div>
            <div className={`grid grid-cols-5 gap-2 px-3 py-2.5 mt-2 rounded-xl border-2 text-xs font-black ${dm ? 'bg-zinc-800 border-zinc-600 text-white' : 'bg-slate-100 border-slate-300 text-slate-800'}`}>
              <span>TOTAL</span>
              <span className={`text-right ${dm ? 'text-red-400' : 'text-red-700'}`}>{Math.round(totalCharges).toLocaleString()} €</span>
              <span className={`text-right ${dm ? 'text-emerald-400' : 'text-emerald-700'}`}>{Math.round(totalRecettes).toLocaleString()} €</span>
              <span className={`text-right ${resultat >= 0 ? (dm ? 'text-emerald-300' : 'text-emerald-700') : (dm ? 'text-red-300' : 'text-red-700')}`}>{resultat >= 0 ? '+' : ''}{Math.round(resultat).toLocaleString()} €</span>
              <span className={`${tauxCouverture >= 100 ? (dm ? 'text-emerald-300' : 'text-emerald-700') : tauxCouverture >= seuilCouverture ? (dm ? 'text-amber-300' : 'text-amber-700') : (dm ? 'text-red-300' : 'text-red-700')}`}>{Math.round(tauxCouverture)}%</span>
            </div>
          </div>

          {/* Suivi exécution (si données réalisées) */}
          {agg.hasRealise && (() => {
            const pctC = totalCharges > 0 ? (agg.totalChargesRealisees / totalCharges) * 100 : 0;
            const pctR = totalRecettes > 0 ? (agg.totalRecettesRealisees / totalRecettes) * 100 : 0;
            return (
              <div className={`rounded-2xl border p-4 ${dm ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-slate-200'}`}>
                <h3 className={`text-xs font-black uppercase tracking-wide mb-3 flex items-center gap-2 ${dm ? 'text-zinc-400' : 'text-slate-400'}`}><Clock size={12} /> Exécution budgétaire</h3>
                <div className="space-y-3">
                  {[{ label: 'Charges réalisées', realise: agg.totalChargesRealisees, budget: totalCharges, pct: pctC, overBad: true }, { label: 'Recettes réalisées', realise: agg.totalRecettesRealisees, budget: totalRecettes, pct: pctR, overBad: false }].map((item, i) => {
                    const ecart = item.realise - item.budget;
                    const bad = item.overBad ? ecart > 0 : ecart < 0;
                    return (
                      <div key={i}>
                        <div className="flex justify-between mb-1">
                          <span className={`text-xs font-bold ${dm ? 'text-zinc-300' : 'text-slate-600'}`}>{item.label}</span>
                          <span className={`text-xs font-black ${bad ? 'text-red-500' : 'text-emerald-500'}`}>{Math.round(item.realise / 1000)}k€ / {Math.round(item.budget / 1000)}k€ ({ecart >= 0 ? '+' : ''}{Math.round(ecart / 1000)}k€)</span>
                        </div>
                        <ProgressBar pct={item.pct} color={item.pct > 100 ? 'red' : item.pct > 80 ? 'amber' : 'blue'} darkMode={darkMode} />
                        <div className={`text-[10px] mt-0.5 ${dm ? 'text-zinc-600' : 'text-slate-400'}`}>{Math.round(item.pct)}% du budget</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Colonne droite */}
        <div className="space-y-4">

          {/* Trésorerie */}
          {daf.tresorerie && (
            <div className={`rounded-2xl border p-4 ${dm ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-xs font-black uppercase tracking-wide flex items-center gap-2 ${dm ? 'text-zinc-400' : 'text-slate-400'}`}><Droplets size={12} /> Trésorerie 2026</h3>
                <div className="flex gap-3 text-right">
                  {daf.bfr && (
                    <div>
                      <div className={`text-[10px] font-bold ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>BFR</div>
                      <div className={`text-sm font-black ${daf.bfr.bfr >= 0 ? (dm ? 'text-amber-300' : 'text-amber-600') : (dm ? 'text-emerald-300' : 'text-emerald-600')}`}>{Math.round(daf.bfr.bfr / 1000)}k€</div>
                    </div>
                  )}
                  <div>
                    <div className={`text-[10px] font-bold ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>Mois déf.</div>
                    <div className={`text-sm font-black ${(daf.tresorerie.alertesMois?.length || 0) > 0 ? (dm ? 'text-red-300' : 'text-red-600') : (dm ? 'text-emerald-300' : 'text-emerald-600')}`}>{daf.tresorerie.alertesMois?.length || 0}/12</div>
                  </div>
                  <div>
                    <div className={`text-[10px] font-bold ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>Solde déc.</div>
                    <div className={`text-sm font-black ${(daf.tresorerie.mois?.at(-1)?.soldeCumule || 0) >= 0 ? (dm ? 'text-emerald-300' : 'text-emerald-600') : (dm ? 'text-red-300' : 'text-red-600')}`}>{Math.round((daf.tresorerie.mois?.at(-1)?.soldeCumule || 0) / 1000)}k€</div>
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={80}>
                <AreaChart data={daf.tresorerie.mois || []} margin={{ top: 2, right: 4, bottom: 0, left: 4 }}>
                  <defs>
                    <linearGradient id="gT" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="nom" tick={{ fontSize: 9, fill: dm ? '#71717a' : '#94a3b8' }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: dm ? '#18181b' : '#fff', border: `1px solid ${dm ? '#3f3f46' : '#e2e8f0'}`, borderRadius: 8, fontSize: 11 }} formatter={v => [`${Math.round(v / 1000)}k€`, 'Solde cumulé']} />
                  <Area type="monotone" dataKey="soldeCumule" stroke="#3b82f6" strokeWidth={2} fill="url(#gT)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Structure des recettes */}
          <div className={`rounded-2xl border p-4 ${dm ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-xs font-black uppercase tracking-wide flex items-center gap-2 ${dm ? 'text-zinc-400' : 'text-slate-400'}`}><BookOpen size={12} /> Structure des recettes</h3>
              <span className={`text-xs font-black px-2 py-0.5 rounded-full ${daf.pctSubventions > 80 ? (dm ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-50 text-amber-700') : (dm ? 'bg-emerald-900/40 text-emerald-300' : 'bg-emerald-50 text-emerald-700')}`}>
                Dép. subv. {Math.round(daf.pctSubventions)}%
              </span>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Subventions publiques', val: daf.totalSubventions, color: 'bg-blue-500', text: dm ? 'text-blue-300' : 'text-blue-700' },
                { label: 'Recettes propres', val: daf.totalPropres, color: 'bg-emerald-500', text: dm ? 'text-emerald-300' : 'text-emerald-700' },
                ...(agg.totalFD > 0 ? [{ label: 'Fonds dédiés (Cte 19)', val: agg.totalFD, color: 'bg-violet-500', text: dm ? 'text-violet-300' : 'text-violet-700' }] : []),
              ].map((item, i) => {
                const pct = totalRecettes > 0 ? (item.val / totalRecettes) * 100 : 0;
                return (
                  <div key={i}>
                    <div className="flex justify-between mb-0.5">
                      <span className={`text-xs font-semibold ${dm ? 'text-zinc-300' : 'text-slate-600'}`}>{item.label}</span>
                      <span className={`text-xs font-black ${item.text}`}>{Math.round(pct)}% · {Math.round(item.val / 1000)}k€</span>
                    </div>
                    <ProgressBar pct={pct} color={i === 0 ? 'blue' : i === 1 ? 'green' : 'violet'} darkMode={darkMode} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Indicateurs liquidité */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`rounded-2xl border p-3 ${dm ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-slate-200'}`}>
              <div className={`text-[10px] font-bold uppercase mb-1 ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>Solvabilité</div>
              <div className={`text-xl font-black ${daf.solvabiliteMois >= 6 ? (dm ? 'text-emerald-300' : 'text-emerald-700') : daf.solvabiliteMois >= 3 ? (dm ? 'text-amber-300' : 'text-amber-700') : (dm ? 'text-red-300' : 'text-red-600')}`}>
                {daf.solvabiliteMois > 0 ? `${daf.solvabiliteMois.toFixed(1)} mois` : '—'}
              </div>
              <div className={`text-[10px] mt-0.5 ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>Réserves / charges/mois</div>
            </div>
            <div className={`rounded-2xl border p-3 ${dm ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-slate-200'}`}>
              <div className={`text-[10px] font-bold uppercase mb-1 ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>Liquidité janv.</div>
              <div className={`text-xl font-black ${daf.ratioLiquidite === null ? (dm ? 'text-zinc-500' : 'text-slate-400') : daf.ratioLiquidite >= 1 ? (dm ? 'text-emerald-300' : 'text-emerald-700') : daf.ratioLiquidite >= 0.5 ? (dm ? 'text-amber-300' : 'text-amber-700') : (dm ? 'text-red-300' : 'text-red-600')}`}>
                {daf.ratioLiquidite !== null && daf.ratioLiquidite > 0 ? daf.ratioLiquidite.toFixed(2) : '—'}
              </div>
              <div className={`text-[10px] mt-0.5 ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>Tréso jan. / ch. mensuelle</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Accordéons ───────────────────────────────────────────────────────── */}

      {/* Projection 3 ans */}
      {daf.projection3ans && (
        <Section title="Projection financière 2026–2028" icon={TrendingUp} open={openSections.proj} onToggle={() => toggle('proj')} darkMode={darkMode}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={daf.projection3ans} margin={{ top: 4, right: 8, bottom: 0, left: 0 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke={dm ? '#3f3f46' : '#e2e8f0'} vertical={false} />
                <XAxis dataKey="annee" tick={{ fontSize: 11, fontWeight: 700, fill: dm ? '#a1a1aa' : '#64748b' }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={v => `${Math.round(v / 1000)}k`} tick={{ fontSize: 10, fill: dm ? '#71717a' : '#94a3b8' }} tickLine={false} axisLine={false} width={36} />
                <Tooltip contentStyle={{ background: dm ? '#18181b' : '#fff', border: `1px solid ${dm ? '#3f3f46' : '#e2e8f0'}`, borderRadius: 8, fontSize: 11 }} formatter={(v, name) => [`${Math.round(v / 1000)}k€`, name === 'charges' ? 'Charges' : 'Recettes']} />
                <Bar dataKey="charges" fill={dm ? '#f87171' : '#fca5a5'} radius={[3, 3, 0, 0]} />
                <Bar dataKey="recettes" fill={dm ? '#34d399' : '#6ee7b7'} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {daf.projection3ans.map((p, i) => (
                <div key={p.annee} className={`grid grid-cols-4 gap-2 px-3 py-2 rounded-xl text-xs font-bold ${i === 0 ? (dm ? 'bg-blue-900/30 border border-blue-700' : 'bg-blue-50 border border-blue-200') : (dm ? 'bg-zinc-800' : 'bg-slate-50')}`}>
                  <span className={`font-black ${i === 0 ? (dm ? 'text-blue-300' : 'text-blue-700') : (dm ? 'text-zinc-400' : 'text-slate-500')}`}>{p.annee}{i === 0 ? ' ★' : ''}</span>
                  <span className={dm ? 'text-red-400' : 'text-red-600'}>{Math.round(p.charges / 1000)}k€</span>
                  <span className={dm ? 'text-emerald-400' : 'text-emerald-600'}>{Math.round(p.recettes / 1000)}k€</span>
                  <span className={p.caf >= 0 ? (dm ? 'text-blue-300' : 'text-blue-700') : (dm ? 'text-amber-300' : 'text-amber-700')}>CAF {p.caf >= 0 ? '+' : ''}{Math.round(p.caf / 1000)}k€</span>
                </div>
              ))}
              <p className={`text-[10px] pt-1 ${dm ? 'text-zinc-600' : 'text-slate-400'}`}>GVT {globalParams.tauxGVT ?? 1.5}% · inflation {globalParams.augmentationAnnuelle ?? 2.5}%/an · ★ = budget actuel</p>
            </div>
          </div>
        </Section>
      )}

      {/* RH & Masse salariale */}
      <Section title="RH & Masse salariale" icon={Users} open={openSections.rh} onToggle={() => toggle('rh')} darkMode={darkMode}
        badge={daf.statsVac?.alertes?.length > 0 ? <CountBadge n={daf.statsVac.alertes.length} color="amber" darkMode={darkMode} /> : null}>
        <div className="space-y-4">
          {daf.statsVac && (daf.statsVac.totalVacataires > 0 || daf.statsVac.totalCout > 0) && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { label: 'Permanents', val: `${Math.round((masseSalariale - (daf.statsVac.totalCout || 0)) / 1000)}k€`, color: dm ? 'text-white' : 'text-slate-800' },
                { label: 'Vacataires total', val: `${Math.round((daf.statsVac.totalCout || 0) / 1000)}k€`, sub: `${daf.statsVac.totalVacataires} intervenants`, color: dm ? 'text-amber-300' : 'text-amber-700' },
                { label: 'Vacataires FI', val: `${Math.round((daf.statsVac.totalFI || 0) / 1000)}k€`, color: dm ? 'text-blue-300' : 'text-blue-700' },
                { label: 'Vacataires FC', val: `${Math.round((daf.statsVac.totalFC || 0) / 1000)}k€`, color: dm ? 'text-violet-300' : 'text-violet-700' },
              ].map((item, i) => (
                <div key={i} className={`rounded-xl p-3 ${dm ? 'bg-zinc-800' : 'bg-slate-50'}`}>
                  <div className={`text-[10px] font-bold uppercase ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>{item.label}</div>
                  <div className={`text-lg font-black ${item.color}`}>{item.val}</div>
                  {item.sub && <div className={`text-[10px] ${dm ? 'text-zinc-600' : 'text-slate-400'}`}>{item.sub}</div>}
                </div>
              ))}
            </div>
          )}
          {daf.statsVac?.alertes?.length > 0 && (
            <div className="space-y-1">
              {daf.statsVac.alertes.map((a, i) => (
                <div key={i} className={`flex items-start gap-2 rounded-lg px-3 py-2 text-xs font-semibold border ${dm ? 'bg-amber-900/20 border-amber-800 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                  <AlertTriangle size={12} className="shrink-0 mt-0.5" /><span><strong>{a.service}</strong>{a.nom ? ` — ${a.nom}` : ''} : {a.msg}</span>
                </div>
              ))}
            </div>
          )}
          {daf.ifc && daf.ifc.agents?.length > 0 && (
            <div>
              <div className={`text-xs font-black uppercase tracking-wide mb-2 flex items-center justify-between ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
                <span className="flex items-center gap-1.5"><Shield size={11} /> IFC — Provision retraite horizon 8 ans</span>
                <span className={dm ? 'text-amber-300 font-black' : 'text-amber-700 font-black'}>{Math.round(daf.ifc.totalProvision / 1000)}k€ à provisionner</span>
              </div>
              <div className="space-y-1">
                {daf.ifc.agents.slice(0, 4).map((a, i) => (
                  <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs ${dm ? 'bg-zinc-800/60' : 'bg-slate-50'}`}>
                    <span className={`flex-1 font-semibold ${dm ? 'text-white' : 'text-slate-700'}`}>{a.nom}</span>
                    <span className={dm ? 'text-zinc-400' : 'text-slate-500'}>{a.source}</span>
                    <span className={dm ? 'text-zinc-400' : 'text-slate-500'}>retraite dans {a.anneesAvantRetraite} an{a.anneesAvantRetraite > 1 ? 's' : ''}</span>
                    <span className={`font-bold ${dm ? 'text-amber-300' : 'text-amber-700'}`}>{Math.round(a.provision / 1000)}k€</span>
                  </div>
                ))}
                {daf.ifc.agents.length > 4 && <div className={`text-[10px] text-center ${dm ? 'text-zinc-600' : 'text-slate-400'}`}>+ {daf.ifc.agents.length - 4} agent(s) supplémentaire(s)</div>}
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* Pilotage pédagogique */}
      {daf.pilotPeda.length > 0 && (
        <Section title="Pilotage pédagogique" icon={GraduationCap} open={openSections.peda} onToggle={() => toggle('peda')} darkMode={darkMode}>
          <div className={`grid grid-cols-6 gap-2 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider mb-1 ${dm ? 'text-zinc-600' : 'text-slate-400'}`}>
            <span className="col-span-2">Service</span><span className="text-right">Inscrits</span><span className="text-right">Actuel</span><span>Rétention</span><span className="text-right">Coût/ét.</span>
          </div>
          <div className="space-y-1.5">
            {daf.pilotPeda.map((p, i) => {
              const ok = p.tauxRetention >= 90, warn = p.tauxRetention >= 75;
              return (
                <div key={i} className={`grid grid-cols-6 gap-2 px-3 py-2.5 rounded-xl text-xs items-center ${dm ? 'bg-zinc-800/60' : 'bg-slate-50'}`}>
                  <span className={`col-span-2 font-semibold truncate ${dm ? 'text-white' : 'text-slate-700'}`}>{p.nom}</span>
                  <span className={`text-right ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>{p.effectifInitial}</span>
                  <span className={`text-right font-bold ${dm ? 'text-blue-300' : 'text-blue-700'}`}>{p.effectifActuel}</span>
                  <div className="flex items-center gap-1">
                    <ProgressBar pct={p.tauxRetention} color={ok ? 'green' : warn ? 'amber' : 'red'} darkMode={darkMode} />
                    <span className={`text-[10px] font-black w-8 shrink-0 ${ok ? (dm ? 'text-emerald-400' : 'text-emerald-600') : warn ? (dm ? 'text-amber-400' : 'text-amber-600') : (dm ? 'text-red-400' : 'text-red-600')}`}>{Math.round(p.tauxRetention)}%</span>
                  </div>
                  <span className={`text-right font-bold ${dm ? 'text-red-400' : 'text-red-600'}`}>{p.coutParEtudiant > 0 ? `${Math.round(p.coutParEtudiant).toLocaleString()}€` : '—'}</span>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Transversalité */}
      {(daf.poolRHMatrix.length > 0 || daf.siegeParService.length > 0 || daf.psParService.length > 0) && (
        <Section title="Transversalité des données" icon={Activity} open={openSections.transv} onToggle={() => toggle('transv')} darkMode={darkMode}
          badge={daf.anomaliesTransv.length > 0 ? <CountBadge n={daf.anomaliesTransv.length} color="amber" darkMode={darkMode} /> : null}>
          <div className="space-y-5">
            {daf.anomaliesTransv.length > 0 && (
              <div className="space-y-1.5">
                {daf.anomaliesTransv.map((a, i) => (
                  <div key={i} className={`flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold border ${a.niveau === 'error' ? (dm ? 'bg-red-900/30 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-700') : (dm ? 'bg-amber-900/30 border-amber-700 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-700')}`}>
                    <AlertTriangle size={12} className="shrink-0 mt-0.5" /><span><strong>[{a.cat}]</strong> {a.msg}</span>
                  </div>
                ))}
              </div>
            )}
            {daf.poolRHMatrix.length > 0 && (() => {
              const cols = [...new Set(daf.poolRHMatrix.flatMap(a => Object.keys(a.entities)))];
              return (
                <div>
                  <div className={`text-[10px] font-black uppercase mb-2 ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>Pool RH — matrice d'affectation</div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead><tr>
                        <th className={`text-left py-1.5 px-2 font-black ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>Agent</th>
                        <th className={`text-right py-1.5 px-2 font-black ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>Coût</th>
                        {cols.map(c => <th key={c} className={`text-right py-1.5 px-2 font-black ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>{c}</th>)}
                        <th className={`text-right py-1.5 px-2 font-black ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>Total</th>
                      </tr></thead>
                      <tbody>
                        {daf.poolRHMatrix.map((agent, i) => (
                          <tr key={i} className={dm ? 'odd:bg-zinc-800/40' : 'odd:bg-slate-50'}>
                            <td className={`py-1.5 px-2 font-semibold ${dm ? 'text-white' : 'text-slate-700'}`}>{agent.nom}</td>
                            <td className={`py-1.5 px-2 text-right ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>{Math.round(agent.coutTotal / 1000)}k€</td>
                            {cols.map(c => { const pct = agent.entities[c] || 0; return <td key={c} className={`py-1.5 px-2 text-right ${pct > 0 ? (dm ? 'text-blue-300' : 'text-blue-700') : (dm ? 'text-zinc-700' : 'text-slate-300')}`}>{pct > 0 ? `${pct}%` : '—'}</td>; })}
                            <td className={`py-1.5 px-2 text-right font-black ${agent.ok ? (dm ? 'text-emerald-400' : 'text-emerald-600') : (dm ? 'text-red-400' : 'text-red-600')}`}>{agent.totalPct.toFixed(0)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
            {(daf.siegeParService.length > 0 || daf.psParService.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { title: 'Frais siège → services', items: daf.siegeParService, total: daf.totalPctSiege, barColor: 'bg-blue-500', textColor: dm ? 'text-blue-300' : 'text-blue-700' },
                  { title: 'Pôle Support → services', items: daf.psParService, total: daf.totalPctPS, barColor: 'bg-violet-500', textColor: dm ? 'text-violet-300' : 'text-violet-700' },
                ].filter(g => g.items.length > 0).map((group, i) => (
                  <div key={i}>
                    <div className={`text-[10px] font-black uppercase mb-2 flex justify-between ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
                      <span>{group.title}</span>
                      <span className={Math.abs(group.total - 100) <= 1 ? (dm ? 'text-emerald-400' : 'text-emerald-600') : (dm ? 'text-amber-400' : 'text-amber-600')}>{group.total.toFixed(0)}% alloués</span>
                    </div>
                    <div className="space-y-1.5">
                      {group.items.map((s, j) => (
                        <div key={j}>
                          <div className="flex justify-between mb-0.5">
                            <span className={`text-xs font-semibold truncate ${dm ? 'text-zinc-300' : 'text-slate-600'}`}>{s.nom}</span>
                            <span className={`text-xs font-black shrink-0 ml-2 ${group.textColor}`}>{s.pct}% · {s.montant.toLocaleString()}€</span>
                          </div>
                          <ProgressBar pct={s.pct} color={i === 0 ? 'blue' : 'violet'} darkMode={darkMode} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {daf.fcfiParService.length > 0 && (
              <div>
                <div className={`text-[10px] font-black uppercase mb-2 ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>Répartition FC / FI par service</div>
                <div className="space-y-1.5">
                  {daf.fcfiParService.map((s, i) => (
                    <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs ${dm ? 'bg-zinc-800/60' : 'bg-slate-50'}`}>
                      <span className={`flex-1 font-semibold truncate ${dm ? 'text-white' : 'text-slate-700'}`}>{s.nom}</span>
                      <span className={dm ? 'text-emerald-400' : 'text-emerald-600'}>FC {Math.round(s.pctFC)}%</span>
                      <span className={dm ? 'text-blue-300' : 'text-blue-700'}>FI {Math.round(s.pctFI)}%</span>
                      <div className="w-24 h-2 rounded-full overflow-hidden flex">
                        <div className="h-full bg-emerald-500" style={{ width: `${s.pctFC}%` }} />
                        <div className="h-full bg-blue-500" style={{ width: `${s.pctFI}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Site géographique */}
      {Object.keys(agg.chargesParSite).length > 0 && (
        <Section title="Ventilation par site géographique" icon={MapPin} open={openSections.site} onToggle={() => toggle('site')} darkMode={darkMode}>
          <div className={`grid grid-cols-6 gap-2 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider mb-1 ${dm ? 'text-zinc-600' : 'text-slate-400'}`}>
            <span className="col-span-2">Site</span><span className="text-right">Charges</span><span className="text-right">Recettes</span><span className="text-right">Solde</span><span className="text-right">Coût/apprenant</span>
          </div>
          <div className="space-y-1.5">
            {Object.entries(agg.chargesParSite).sort((a, b) => b[1].charges - a[1].charges).map(([site, data]) => {
              const solde = data.recettes - data.charges;
              return (
                <div key={site} className={`grid grid-cols-6 gap-2 px-3 py-2.5 rounded-xl text-xs items-center ${dm ? 'bg-zinc-800/60' : 'bg-slate-50'}`}>
                  <span className={`col-span-2 font-semibold flex items-center gap-1.5 ${dm ? 'text-white' : 'text-slate-700'}`}><MapPin size={11} className="text-blue-500" />{site}</span>
                  <span className={`text-right font-bold ${dm ? 'text-red-400' : 'text-red-600'}`}>{Math.round(data.charges).toLocaleString()}€</span>
                  <span className={`text-right font-bold ${dm ? 'text-emerald-400' : 'text-emerald-600'}`}>{Math.round(data.recettes).toLocaleString()}€</span>
                  <span className={`text-right font-black ${solde >= 0 ? (dm ? 'text-emerald-300' : 'text-emerald-700') : (dm ? 'text-red-300' : 'text-red-700')}`}>{solde >= 0 ? '+' : ''}{Math.round(solde).toLocaleString()}€</span>
                  <span className={`text-right font-bold ${dm ? 'text-blue-300' : 'text-blue-700'}`}>{data.etudiants > 0 ? `${Math.round(data.charges / data.etudiants).toLocaleString()}€` : '—'}</span>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Audit & alertes */}
      {(daf.auditItems.length > 0 || daf.alertesRH.filter(a => a.lvl !== 'info').length > 0 || alertesGlobales.length > 0) && (
        <Section title="Audit & alertes" icon={FileText} open={openSections.audit || daf.nbAlertes > 0} onToggle={() => toggle('audit')} darkMode={darkMode}
          badge={<div className="flex gap-1">{daf.nbAlertes > 0 && <CountBadge n={daf.nbAlertes} color="red" darkMode={darkMode} />}{daf.nbVigil > 0 && <CountBadge n={daf.nbVigil} color="amber" darkMode={darkMode} />}</div>}>
          <div className="space-y-1.5">
            {alertesGlobales.map((a, i) => (
              <div key={`g-${i}`} className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm font-semibold border ${a.level === 'red' ? (dm ? 'bg-red-900/30 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-700') : (dm ? 'bg-amber-900/30 border-amber-700 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-700')}`}>
                <AlertTriangle size={15} className="shrink-0 mt-0.5" />{a.msg}
              </div>
            ))}
            {daf.auditItems.map((item, i) => (
              <div key={`a-${i}`} className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm font-semibold border ${item.type === 'ER' ? (dm ? 'bg-red-900/30 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-700') : (dm ? 'bg-amber-900/30 border-amber-700 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-700')}`}>
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <div><span className="font-black mr-1.5">[{item.code}]</span>{item.entity && <span className="opacity-70 mr-1.5">{item.entity} —</span>}{item.message}</div>
              </div>
            ))}
            {daf.alertesRH.filter(a => a.lvl !== 'info').map((a, i) => (
              <div key={`rh-${i}`} className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm font-semibold border ${a.lvl === 'error' ? (dm ? 'bg-red-900/30 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-700') : (dm ? 'bg-amber-900/30 border-amber-700 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-700')}`}>
                <Users size={15} className="shrink-0 mt-0.5" />{a.msg}
              </div>
            ))}
          </div>
        </Section>
      )}

    </div>
  );
}
