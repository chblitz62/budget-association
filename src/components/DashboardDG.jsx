import React, { useMemo } from 'react';
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Users, Euro, BarChart2,
  Clock, Shield, Zap, MapPin, Briefcase, GraduationCap, FileText, BookOpen,
  PiggyBank, Droplets, Target, AlertCircle,
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
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
} from '../utils/calculations';
import { PRIME_SEGUR, FINANCIAL_HELP } from '../utils/constants';
import HelpIcon from './ui/HelpIcon';

// ── Carte KPI ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color, icon: Icon, darkMode, help }) {
  const dm = darkMode;
  const colorMap = {
    green:  { bg: dm ? 'bg-emerald-900/30 border-emerald-700' : 'bg-emerald-50 border-emerald-200', text: dm ? 'text-emerald-300' : 'text-emerald-700', icon: dm ? 'text-emerald-400' : 'text-emerald-500' },
    red:    { bg: dm ? 'bg-red-900/30 border-red-700'         : 'bg-red-50 border-red-200',         text: dm ? 'text-red-300'     : 'text-red-700',     icon: dm ? 'text-red-400'     : 'text-red-500' },
    amber:  { bg: dm ? 'bg-amber-900/30 border-amber-700'     : 'bg-amber-50 border-amber-200',     text: dm ? 'text-amber-300'   : 'text-amber-700',   icon: dm ? 'text-amber-400'   : 'text-amber-500' },
    blue:   { bg: dm ? 'bg-blue-900/30 border-blue-700'       : 'bg-blue-50 border-blue-200',       text: dm ? 'text-blue-300'    : 'text-blue-700',    icon: dm ? 'text-blue-400'    : 'text-blue-500' },
    violet: { bg: dm ? 'bg-violet-900/30 border-violet-700'   : 'bg-violet-50 border-violet-200',   text: dm ? 'text-violet-300'  : 'text-violet-700',  icon: dm ? 'text-violet-400'  : 'text-violet-500' },
    slate:  { bg: dm ? 'bg-zinc-800 border-zinc-700'          : 'bg-slate-50 border-slate-200',     text: dm ? 'text-white'       : 'text-slate-700',   icon: dm ? 'text-zinc-400'    : 'text-slate-400' },
  };
  const c = colorMap[color] || colorMap.slate;
  return (
    <div className={`rounded-2xl border p-5 flex flex-col gap-1 ${c.bg}`}>
      <div className={`flex items-center justify-between text-xs font-bold uppercase tracking-wide ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>
        <div className="flex items-center gap-1.5">
          {Icon && <Icon size={14} className={c.icon} />}
          {label}
        </div>
        {help && <HelpIcon {...help} darkMode={darkMode} position="bottom" />}
      </div>
      <div className={`text-3xl font-black leading-tight ${c.text}`}>{value}</div>
      {sub && <div className={`text-xs font-semibold ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>{sub}</div>}
    </div>
  );
}

// ── Ligne service ─────────────────────────────────────────────────────────────
function ServiceRow({ label, bs, darkMode, seuilCouverture = 90 }) {
  const dm = darkMode;
  const recettesLibres = bs.recettes - (bs.recettesFD || 0);
  const totalChargesRow = bs.salaires + bs.exploitation;
  const couverture = totalChargesRow > 0 ? (recettesLibres / totalChargesRow) * 100 : (recettesLibres > 0 ? 100 : 0);
  const ok = couverture >= seuilCouverture;
  const warn = couverture >= 80 && couverture < seuilCouverture;
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${dm ? 'bg-zinc-800/60' : 'bg-slate-50'}`}>
      <span className={`flex-1 text-sm font-semibold truncate ${dm ? 'text-white' : 'text-slate-700'}`}>{label}</span>
      <span className={`text-xs font-bold w-28 text-right ${dm ? 'text-red-400' : 'text-red-600'}`}>
        {Math.round(totalChargesRow).toLocaleString()} €
      </span>
      <span className={`text-xs font-bold w-28 text-right ${dm ? 'text-emerald-400' : 'text-emerald-600'}`}>
        {Math.round(bs.recettes).toLocaleString()} €
      </span>
      <span className={`text-xs font-bold w-24 text-right ${bs.solde >= 0 ? (dm ? 'text-emerald-400' : 'text-emerald-700') : (dm ? 'text-red-400' : 'text-red-700')}`}>
        {bs.solde >= 0 ? '+' : ''}{Math.round(bs.solde).toLocaleString()} €
      </span>
      <div className="w-28 flex items-center gap-1.5">
        <div className={`flex-1 h-2 rounded-full overflow-hidden ${dm ? 'bg-zinc-700' : 'bg-slate-200'}`}>
          <div
            className={`h-full rounded-full ${ok ? 'bg-emerald-500' : warn ? 'bg-amber-400' : 'bg-red-500'}`}
            style={{ width: `${Math.min(100, couverture)}%` }}
          />
        </div>
        <span className={`text-[11px] font-black w-10 text-right ${ok ? (dm ? 'text-emerald-400' : 'text-emerald-600') : warn ? (dm ? 'text-amber-400' : 'text-amber-600') : (dm ? 'text-red-400' : 'text-red-600')}`}>
          {couverture > 0 ? `${Math.round(couverture)}%` : '—'}
        </span>
      </div>
    </div>
  );
}

// ── Barre de répartition horizontale ──────────────────────────────────────────
function BarRepartition({ items, darkMode }) {
  const total = items.reduce((s, i) => s + i.value, 0);
  if (total === 0) return null;
  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const pct = (item.value / total) * 100;
        return (
          <div key={i}>
            <div className="flex justify-between mb-0.5">
              <span className={`text-xs font-semibold ${darkMode ? 'text-zinc-300' : 'text-slate-600'}`}>{item.label}</span>
              <span className={`text-xs font-black ${item.textColor}`}>
                {Math.round(pct)}% · {Math.round(item.value / 1000)}k€
              </span>
            </div>
            <div className={`h-2.5 rounded-full overflow-hidden ${darkMode ? 'bg-zinc-700' : 'bg-slate-200'}`}>
              <div className={`h-full rounded-full ${item.barColor}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function DashboardDG({
  direction, poleSupport, services, poolRH, globalParams, darkMode,
}) {
  const dm = darkMode;
  const msETP = globalParams.montantSegurETP ?? PRIME_SEGUR;
  const seuilCouverture = globalParams.seuilCouverture ?? 90;

  // ── Calculs agrégés ───────────────────────────────────────────────────────
  const agg = useMemo(() => {
    const bd = calculerBudgetDirection(direction, null, 2026, msETP, poolRH);
    const bp = calculerBudgetPoleSupport(poleSupport, null, 2026, msETP, poolRH);
    const bServices = services.map(s => ({
      service: s,
      bs: calculerBudgetService(s, null, 2026, msETP, poolRH),
    }));

    const totalChargesDir = bd.salaires + bd.exploitation;
    const totalChargesPS  = bp.salaires + bp.exploitation;
    const totalChargesSvc = bServices.reduce((s, { bs }) => s + bs.salaires + bs.exploitation, 0);
    const totalCharges    = totalChargesDir + totalChargesPS + totalChargesSvc;

    const totalRecettesDir = bd.recettes;
    const totalRecettesPS  = bp.recettes;
    const totalRecettesSvc = bServices.reduce((s, { bs }) => s + bs.recettes, 0);
    const totalRecettes    = totalRecettesDir + totalRecettesPS + totalRecettesSvc;

    const totalFD = (bd.recettesFD || 0) + (bp.recettesFD || 0) + bServices.reduce((s, { bs }) => s + (bs.recettesFD || 0), 0);
    const totalRecettesLibres = totalRecettes - totalFD;

    const resultat = totalRecettes - totalCharges;
    const tauxCouverture = totalCharges > 0 ? (totalRecettesLibres / totalCharges) * 100 : 0;

    const chargesRealiseesSvc = bServices.reduce((s, { bs }) => s + (bs.exploitationRealisee || 0), 0);
    const recettesRealiseesSvc = bServices.reduce((s, { bs }) => s + (bs.recettesRealisees || 0), 0);
    const totalChargesRealisees = (bd.exploitationRealisee || 0) + (bp.exploitationRealisee || 0) + chargesRealiseesSvc;
    const totalRecettesRealisees = (bd.recettesRealisees || 0) + (bp.recettesRealisees || 0) + recettesRealiseesSvc;
    const hasRealise = bd.hasRealise || bp.hasRealise || bServices.some(({ bs }) => bs.hasRealise);

    const allPersonnel = [
      ...(direction?.personnel || []),
      ...(poleSupport?.personnel || []),
      ...services.flatMap(s => s.personnel || []),
      ...(poolRH || []),
    ];
    const masseSalariale = allPersonnel.reduce((tot, p) => {
      const sr = p.segur === true ? msETP : (parseFloat(p.segur) || 0);
      return tot + calculerSalaireAnnuel(p.salaire, p.etp, sr, p.typeContrat, p.tauxChargesManuel).total;
    }, 0);

    const etpTotal = allPersonnel.reduce((s, p) => s + parseFloat(p.etp || 0), 0);

    // Nb stagiaires — effectifActuel issu de statsFormation (promos est un objet, pas un tableau)
    const nbStagiaires = bServices.reduce((tot, { bs }) =>
      tot + (bs.statsFormation?.effectifActuel || 0), 0);

    const chargesParETP       = etpTotal > 0 ? totalCharges / etpTotal : 0;
    const recettesParETP      = etpTotal > 0 ? totalRecettes / etpTotal : 0;
    const chargesParEtudiant  = nbStagiaires > 0 ? totalCharges / nbStagiaires : 0;
    const recettesParEtudiant = nbStagiaires > 0 ? totalRecettes / nbStagiaires : 0;

    // Charges & recettes par site géographique
    const chargesParSite = {};
    bServices.forEach(({ service, bs }) => {
      if (!service.promos || typeof service.promos !== 'object') return;
      const effectifParSite = {};
      let effTotal = 0;
      Object.entries(service.promos).forEach(([siteName, items]) => {
        if (!Array.isArray(items)) return;
        let eff = 0;
        items.forEach(item => {
          if (typeof item.effectifInitial === 'number') eff += item.effectifInitial;
          else if (Array.isArray(item.promos)) item.promos.forEach(p => { eff += p.effectifInitial || 0; });
        });
        effectifParSite[siteName] = eff;
        effTotal += eff;
      });
      const nbSites = Object.keys(effectifParSite).length;
      if (nbSites === 0) return;
      const svcCharges  = bs.salaires + bs.exploitation;
      const svcRecettes = bs.recettes;
      Object.entries(effectifParSite).forEach(([siteName, eff]) => {
        if (!chargesParSite[siteName]) chargesParSite[siteName] = { charges: 0, recettes: 0, etudiants: 0 };
        const ratio = effTotal > 0 ? eff / effTotal : 1 / nbSites;
        chargesParSite[siteName].charges  += svcCharges * ratio;
        chargesParSite[siteName].recettes += svcRecettes * ratio;
        chargesParSite[siteName].etudiants += eff;
      });
    });

    const reserves = (globalParams.fondRoulement || []).reduce((s, f) => s + (parseFloat(f.montant) || 0), 0);
    const dureeVieReserves = resultat < 0 && reserves > 0 ? reserves / Math.abs(resultat) : null;

    const allRecettes = [
      ...(direction.recettes || []),
      ...(poleSupport.recettes || []),
      ...services.flatMap(s => s.recettes || []),
    ];
    const totalStress = appliquerStressTest(allRecettes, -20);
    const totalSansStress = appliquerStressTest(allRecettes, 0);
    const impactStress = totalSansStress - totalStress;

    return {
      bd, bp, bServices,
      totalCharges, totalRecettes, resultat, tauxCouverture,
      masseSalariale, pctMS: totalCharges > 0 ? (masseSalariale / totalCharges) * 100 : 0,
      etpTotal, nbStagiaires,
      chargesParETP, recettesParETP, chargesParEtudiant, recettesParEtudiant,
      chargesParSite,
      reserves, dureeVieReserves,
      impactStress, totalFD,
      totalChargesRealisees, totalRecettesRealisees, hasRealise,
    };
  }, [direction, poleSupport, services, poolRH, globalParams, msETP]);

  // ── Calculs DAF avancés ───────────────────────────────────────────────────
  const daf = useMemo(() => {
    // CAF = Résultat + Amortissements
    const amortDir = agg.bd.amortissements || 0;
    const amortPS  = agg.bp.amortissements || 0;
    const amortSvc = agg.bServices.reduce((s, { bs }) => s + (bs.amortissements || 0), 0);
    const totalAmort = amortDir + amortPS + amortSvc;
    const caf = agg.resultat + totalAmort;

    // Structure de coûts : charges fixes (salaires + amort) vs variables (vacataires + exploit)
    const totalVacataires = agg.bServices.reduce((s, { bs }) => s + (bs.coutVacataires || 0), 0);
    const chargesFixees   = agg.masseSalariale + totalAmort;
    const chargesVariables = agg.totalCharges - chargesFixees;
    const pctChargesFixees = agg.totalCharges > 0 ? (chargesFixees / agg.totalCharges) * 100 : 0;

    // Point mort : niveau de recettes nécessaire pour atteindre l'équilibre
    const ecartPointMort = agg.totalRecettes - agg.totalCharges;
    const pctAtteinte = agg.totalCharges > 0 ? Math.min(100, (agg.totalRecettes / agg.totalCharges) * 100) : 0;

    // Concentration des recettes (subvention vs propres vs FD)
    const motsClesSubv = ['subvention', 'région', 'region', 'état', 'etat', 'département', 'departement', 'opco', 'taxe apprentissage', "taxe d'apprentissage", 'taxe apprentissage', 'fonds de formation'];
    const allRecettesItems = [
      ...(direction.recettes || []),
      ...(poleSupport.recettes || []),
      ...services.flatMap(s => s.recettes || []),
    ];
    let totalSubventions = 0;
    let totalPropres = 0;
    allRecettesItems.forEach(r => {
      const nom = (r.nom || '').toLowerCase();
      const montant = (parseFloat(r.montant) || 0) * 12;
      if (r.fondsDedie) return; // FD comptés séparément
      if (motsClesSubv.some(m => nom.includes(m))) totalSubventions += montant;
      else totalPropres += montant;
    });
    const pctSubventions = (totalSubventions + totalPropres) > 0
      ? (totalSubventions / (totalSubventions + totalPropres)) * 100 : 0;

    // Trésorerie mensuelle
    let tresorerie = null;
    try { tresorerie = calculerTresorerieMensuelle(direction, services, globalParams, poleSupport, poolRH); } catch {}

    // BFR
    let bfr = null;
    try { bfr = calculerBFR(direction, services, globalParams, poleSupport, poolRH); } catch {}

    // Stats vacataires
    let statsVac = null;
    try { statsVac = calculerStatsVacataires(services, msETP); } catch {}

    // Audit financier automatique
    let auditItems = [];
    try { auditItems = runFinancialAudit(direction, services, poleSupport, globalParams) || []; } catch {}

    // Alertes RH
    let alertesRH = [];
    try { alertesRH = calculerAlertesRH(direction, poleSupport, services, new Date()) || []; } catch {}

    // IFC — provision retraite horizon 8 ans
    let ifc = null;
    try { ifc = calculerIFC(direction, services, poleSupport, 2026, 62, 8, msETP); } catch {}

    // Pilotage pédagogique par service
    const pilotPeda = agg.bServices
      .filter(({ bs }) => bs.statsFormation && bs.statsFormation.totalEtudiants > 0)
      .map(({ service, bs }) => {
        const sf = bs.statsFormation;
        const tauxRetention = sf.totalEtudiants > 0 ? (sf.effectifActuel / sf.totalEtudiants) * 100 : 100;
        return {
          nom: service.nom,
          effectifInitial: sf.totalEtudiants,
          effectifActuel: sf.effectifActuel,
          abandons: sf.totalAbandons,
          tauxRetention,
          coutParEtudiant: bs.coutParEtudiant || 0,
          recetteParEtudiant: sf.effectifActuel > 0 ? bs.recettes / sf.effectifActuel : 0,
        };
      });

    return {
      caf, totalAmort, chargesFixees, chargesVariables, pctChargesFixees, totalVacataires,
      ecartPointMort, pctAtteinte,
      totalSubventions, totalPropres, pctSubventions,
      tresorerie, bfr, statsVac, auditItems, alertesRH, ifc, pilotPeda,
    };
  }, [agg, direction, poleSupport, services, poolRH, globalParams, msETP]);

  const { tauxCouverture, resultat, totalCharges, totalRecettes, masseSalariale, pctMS } = agg;
  const couleurCouverture = tauxCouverture >= 100 ? 'green' : tauxCouverture >= seuilCouverture ? 'amber' : 'red';
  const couleurResultat   = resultat >= 0 ? 'green' : 'red';
  const couleurReserves   = agg.dureeVieReserves === null ? 'green' : agg.dureeVieReserves >= 2 ? 'amber' : 'red';

  return (
    <div className="space-y-5">

      {/* ── Titre ─────────────────────────────────────────────────────────── */}
      <div className={`rounded-2xl border px-6 py-4 flex items-center justify-between ${dm ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-slate-200'}`}>
        <div>
          <h2 className={`text-xl font-black flex items-center gap-2 ${dm ? 'text-white' : 'text-slate-800'}`}>
            <BarChart2 size={22} className="text-blue-500" />
            Tableau de Bord — Direction Générale
          </h2>
          <p className={`text-xs mt-0.5 ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>
            Budget prévisionnel 2026 · Consolidé — {services.length} service{services.length > 1 ? 's' : ''} + Direction + Pôle Support
          </p>
        </div>
        <div className={`text-xs font-semibold px-3 py-1 rounded-full ${dm ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-500'}`}>
          {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* ── KPIs critiques ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Taux de couverture"
          value={`${Math.round(tauxCouverture)}%`}
          sub={`Hors FD · Seuil : ${seuilCouverture}% · ${tauxCouverture >= seuilCouverture ? 'OK' : 'ALERTE'}`}
          color={couleurCouverture}
          icon={tauxCouverture >= seuilCouverture ? CheckCircle : AlertTriangle}
          darkMode={darkMode}
          help={FINANCIAL_HELP.tauxCouverture}
        />
        <KpiCard
          label="Résultat prévisionnel"
          value={`${resultat >= 0 ? '+' : ''}${Math.round(resultat / 1000)}k€`}
          sub={resultat >= 0 ? 'Excédent' : 'Déficit — puise dans les réserves'}
          color={couleurResultat}
          icon={resultat >= 0 ? TrendingUp : TrendingDown}
          darkMode={darkMode}
        />
        <KpiCard
          label="Réserves"
          value={agg.reserves > 0 ? `${Math.round(agg.reserves / 1000)}k€` : 'Non renseignées'}
          sub={agg.dureeVieReserves !== null
            ? `${agg.dureeVieReserves.toFixed(1)} an${agg.dureeVieReserves >= 2 ? 's' : ''} au rythme actuel`
            : agg.reserves > 0 ? "Budget à l'équilibre" : 'Saisir dans Paramètres → Fonds de roulement'}
          color={couleurReserves}
          icon={Shield}
          darkMode={darkMode}
          help={FINANCIAL_HELP.reservesAsso}
        />
        <KpiCard
          label="Impact -20% subventions"
          value={`-${Math.round(agg.impactStress / 1000)}k€`}
          sub="Recettes si choc subventions -20%"
          color="violet"
          icon={Zap}
          darkMode={darkMode}
        />
      </div>

      {/* ── KPIs RH ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Masse salariale"
          value={`${Math.round(masseSalariale / 1000)}k€`}
          sub={`${Math.round(pctMS)}% des charges totales`}
          color={pctMS > 80 ? 'amber' : 'blue'}
          icon={Euro}
          darkMode={darkMode}
        />
        <KpiCard
          label="Total charges"
          value={`${Math.round(totalCharges / 1000)}k€`}
          sub="Salaires + exploitation + amort."
          color="slate"
          darkMode={darkMode}
        />
        <KpiCard
          label="Total recettes"
          value={`${Math.round(totalRecettes / 1000)}k€`}
          sub={agg.totalFD > 0 ? `dont ${Math.round(agg.totalFD / 1000)}k€ fonds dédiés (Cte 19)` : 'Subventions + recettes propres'}
          color="slate"
          darkMode={darkMode}
        />
        <div className="grid grid-cols-2 gap-4">
          <KpiCard label="ETP total" value={agg.etpTotal.toFixed(1)} color="slate" icon={Users} darkMode={darkMode} />
          <KpiCard label="Stagiaires" value={agg.nbStagiaires || '—'} sub="toutes promos" color="slate" darkMode={darkMode} />
        </div>
      </div>

      {/* ── KPIs d'efficience ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Charges / ETP"
          value={agg.chargesParETP > 0 ? `${Math.round(agg.chargesParETP / 1000)}k€` : '—'}
          sub={agg.etpTotal > 0 ? `Pour ${agg.etpTotal.toFixed(1)} ETP` : 'Aucun ETP renseigné'}
          color="slate" icon={Users} darkMode={darkMode}
          help={{ title: 'Charges par ETP', text: 'Coût total de structure rapporté à un équivalent temps plein. Indicateur de productivité et de comparaison N/N-1.' }}
        />
        <KpiCard
          label="Recettes / ETP"
          value={agg.recettesParETP > 0 ? `${Math.round(agg.recettesParETP / 1000)}k€` : '—'}
          sub={agg.etpTotal > 0 ? `Pour ${agg.etpTotal.toFixed(1)} ETP` : 'Aucun ETP renseigné'}
          color="slate" icon={Users} darkMode={darkMode}
          help={{ title: 'Recettes par ETP', text: "Revenu moyen généré par équivalent temps plein. Permet d'identifier les entités sous-génératrices de ressources." }}
        />
        <KpiCard
          label="Charges / Étudiant"
          value={agg.chargesParEtudiant > 0 ? `${Math.round(agg.chargesParEtudiant).toLocaleString()} €` : '—'}
          sub={agg.nbStagiaires > 0 ? `Pour ${agg.nbStagiaires} apprenant${agg.nbStagiaires > 1 ? 's' : ''}` : 'Aucun apprenant renseigné'}
          color="slate" darkMode={darkMode}
          help={{ title: 'Charges par apprenant', text: 'Coût de revient global de la structure rapporté à chaque apprenant. Indicateur de coût de formation.' }}
        />
        <KpiCard
          label="Recettes / Étudiant"
          value={agg.recettesParEtudiant > 0 ? `${Math.round(agg.recettesParEtudiant).toLocaleString()} €` : '—'}
          sub={agg.nbStagiaires > 0 ? `Pour ${agg.nbStagiaires} apprenant${agg.nbStagiaires > 1 ? 's' : ''}` : 'Aucun apprenant renseigné'}
          color="slate" darkMode={darkMode}
          help={{ title: 'Recettes par apprenant', text: "Recette moyenne générée par apprenant. Permet d'estimer le seuil d'équilibre par effectif." }}
        />
      </div>

      {/* ── CAF & Structure de coûts ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="CAF"
          value={`${daf.caf >= 0 ? '+' : ''}${Math.round(daf.caf / 1000)}k€`}
          sub={`Résultat + ${Math.round(daf.totalAmort / 1000)}k€ amort.`}
          color={daf.caf >= 0 ? 'green' : 'red'}
          icon={PiggyBank}
          darkMode={darkMode}
          help={{ title: 'Capacité d\'autofinancement', text: 'CAF = Résultat net + Amortissements. Mesure la capacité à autofinancer les investissements et rembourser les emprunts sans recourir à des financements externes.' }}
        />
        <KpiCard
          label="Amortissements"
          value={`${Math.round(daf.totalAmort / 1000)}k€`}
          sub="Dotations annuelles toutes entités"
          color="slate"
          icon={Briefcase}
          darkMode={darkMode}
          help={{ title: 'Amortissements', text: 'Dotations aux amortissements. Charge calculée non décaissée — à intégrer dans la CAF pour connaître la capacité réelle de financement.' }}
        />
        <KpiCard
          label="Charges fixes"
          value={`${Math.round(daf.pctChargesFixees)}%`}
          sub={`${Math.round(daf.chargesFixees / 1000)}k€ salaires + amort. sur ${Math.round(totalCharges / 1000)}k€`}
          color={daf.pctChargesFixees > 85 ? 'amber' : 'slate'}
          icon={Target}
          darkMode={darkMode}
          help={{ title: 'Part des charges fixes', text: "Salaires + amortissements / charges totales. Plus ce ratio est élevé, moins la structure est flexible face à une baisse d'activité." }}
        />
        <KpiCard
          label="Point mort"
          value={daf.ecartPointMort >= 0 ? `+${Math.round(daf.ecartPointMort / 1000)}k€` : `${Math.round(daf.ecartPointMort / 1000)}k€`}
          sub={daf.ecartPointMort >= 0 ? `Équilibre atteint à ${Math.round(daf.pctAtteinte)}%` : `Recettes à trouver pour l'équilibre`}
          color={daf.ecartPointMort >= 0 ? 'green' : 'red'}
          icon={daf.ecartPointMort >= 0 ? CheckCircle : AlertTriangle}
          darkMode={darkMode}
          help={{ title: 'Point mort', text: "Écart entre recettes et charges totales. Positif = excédent au-delà du seuil d'équilibre. Négatif = montant manquant pour couvrir les charges." }}
        />
      </div>

      {/* ── Trésorerie mensuelle ──────────────────────────────────────────── */}
      {daf.tresorerie && (
        <div className={`rounded-2xl border p-5 ${dm ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-slate-200'}`}>
          <div className="flex items-start justify-between mb-4 gap-4">
            <h3 className={`text-sm font-black uppercase tracking-wide flex items-center gap-2 ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>
              <Droplets size={14} /> Trésorerie prévisionnelle 2026
            </h3>
            <div className="flex gap-6 shrink-0">
              {daf.bfr && (
                <div className="text-right">
                  <div className={`text-[10px] font-bold uppercase ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>BFR</div>
                  <div className={`text-sm font-black ${daf.bfr.bfr >= 0 ? (dm ? 'text-amber-300' : 'text-amber-600') : (dm ? 'text-emerald-300' : 'text-emerald-600')}`}>
                    {daf.bfr.bfr >= 0 ? '+' : ''}{Math.round(daf.bfr.bfr / 1000)}k€
                  </div>
                  <div className={`text-[10px] ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
                    {daf.bfr.bfrEnJours > 0 ? `${Math.round(daf.bfr.bfrEnJours)} j de CA` : 'Excédent fournisseurs'}
                  </div>
                </div>
              )}
              <div className="text-right">
                <div className={`text-[10px] font-bold uppercase ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>Mois déficitaires</div>
                <div className={`text-sm font-black ${daf.tresorerie.alertesMois?.length > 0 ? (dm ? 'text-red-300' : 'text-red-600') : (dm ? 'text-emerald-300' : 'text-emerald-600')}`}>
                  {daf.tresorerie.alertesMois?.length || 0} / 12
                </div>
              </div>
              <div className="text-right">
                <div className={`text-[10px] font-bold uppercase ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>Solde cumulé déc.</div>
                <div className={`text-sm font-black ${daf.tresorerie.mois?.at(-1)?.soldeCumule >= 0 ? (dm ? 'text-emerald-300' : 'text-emerald-600') : (dm ? 'text-red-300' : 'text-red-600')}`}>
                  {Math.round((daf.tresorerie.mois?.at(-1)?.soldeCumule || 0) / 1000)}k€
                </div>
              </div>
            </div>
          </div>
          {daf.tresorerie.mois?.length > 0 && (
            <ResponsiveContainer width="100%" height={90}>
              <AreaChart data={daf.tresorerie.mois} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                <defs>
                  <linearGradient id="gradTreso" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="nom" tick={{ fontSize: 10, fill: dm ? '#71717a' : '#94a3b8' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: dm ? '#18181b' : '#fff', border: `1px solid ${dm ? '#3f3f46' : '#e2e8f0'}`, borderRadius: 8, fontSize: 11 }}
                  formatter={(v) => [`${Math.round(v / 1000)}k€`, 'Solde cumulé']}
                />
                <Area type="monotone" dataKey="soldeCumule" stroke="#3b82f6" strokeWidth={2} fill="url(#gradTreso)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
          {/* Barre mensuelle solde */}
          <div className="mt-3 flex gap-1">
            {(daf.tresorerie.mois || []).map((m, i) => {
              const isAlert = daf.tresorerie.alertesMois?.includes(i);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5" title={`${m.nom} : ${Math.round(m.solde / 1000)}k€`}>
                  <div className={`w-full rounded-sm ${isAlert ? 'bg-red-500' : (dm ? 'bg-blue-600' : 'bg-blue-400')}`}
                    style={{ height: `${Math.max(4, Math.min(24, Math.abs(m.solde) / (daf.tresorerie.totalEncaissements / 12) * 24))}px` }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Concentration & structure des recettes ────────────────────────── */}
      <div className={`rounded-2xl border p-5 ${dm ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-slate-200'}`}>
        <h3 className={`text-sm font-black uppercase tracking-wide mb-4 flex items-center gap-2 ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>
          <BookOpen size={14} /> Structure & concentration des recettes
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <BarRepartition
              darkMode={darkMode}
              items={[
                {
                  label: 'Subventions publiques',
                  value: daf.totalSubventions,
                  barColor: 'bg-blue-500',
                  textColor: dm ? 'text-blue-300' : 'text-blue-700',
                },
                {
                  label: 'Recettes propres (inscriptions, prestations…)',
                  value: daf.totalPropres,
                  barColor: 'bg-emerald-500',
                  textColor: dm ? 'text-emerald-300' : 'text-emerald-700',
                },
                ...(agg.totalFD > 0 ? [{
                  label: 'Fonds dédiés (Compte 19)',
                  value: agg.totalFD,
                  barColor: 'bg-violet-500',
                  textColor: dm ? 'text-violet-300' : 'text-violet-700',
                }] : []),
              ]}
            />
          </div>
          <div className="space-y-3">
            <div className={`rounded-xl p-3 ${dm ? 'bg-zinc-800' : 'bg-slate-50'}`}>
              <div className={`text-[10px] font-bold uppercase mb-1 ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>Indice de dépendance subventions</div>
              <div className={`text-2xl font-black ${daf.pctSubventions > 70 ? (dm ? 'text-amber-300' : 'text-amber-600') : (dm ? 'text-emerald-300' : 'text-emerald-600')}`}>
                {Math.round(daf.pctSubventions)}%
              </div>
              <div className={`text-xs mt-0.5 ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>
                {daf.pctSubventions > 80 ? 'Dépendance forte — risque si baisse de dotation' :
                  daf.pctSubventions > 60 ? 'Dépendance modérée — diversifier les recettes' :
                  'Bonne diversification des recettes'}
              </div>
            </div>
            <div className={`rounded-xl p-3 ${dm ? 'bg-zinc-800' : 'bg-slate-50'}`}>
              <div className={`text-[10px] font-bold uppercase mb-1 ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>Recettes propres annuelles</div>
              <div className={`text-2xl font-black ${dm ? 'text-emerald-300' : 'text-emerald-700'}`}>
                {Math.round(daf.totalPropres / 1000)}k€
              </div>
              <div className={`text-xs mt-0.5 ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>
                Inscriptions, prestations, formations facturées
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Pilotage pédagogique par service ─────────────────────────────── */}
      {daf.pilotPeda.length > 0 && (
        <div className={`rounded-2xl border p-5 ${dm ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-slate-200'}`}>
          <h3 className={`text-sm font-black uppercase tracking-wide mb-4 flex items-center gap-2 ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>
            <GraduationCap size={14} /> Pilotage pédagogique — rétention & coûts
          </h3>
          <div className={`flex items-center gap-3 px-4 py-2 text-[10px] font-black uppercase tracking-wider mb-2 ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
            <span className="flex-1">Service</span>
            <span className="w-20 text-right">Inscriptions</span>
            <span className="w-20 text-right">Actuel</span>
            <span className="w-20 text-right">Abandons</span>
            <span className="w-32 text-right">Rétention</span>
            <span className="w-32 text-right">Coût / étudiant</span>
            <span className="w-32 text-right">Recette / étudiant</span>
          </div>
          <div className="space-y-1.5">
            {daf.pilotPeda.map((p, i) => {
              const ok = p.tauxRetention >= 90;
              const warn = p.tauxRetention >= 75 && p.tauxRetention < 90;
              return (
                <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl ${dm ? 'bg-zinc-800/60' : 'bg-slate-50'}`}>
                  <span className={`flex-1 text-sm font-semibold truncate ${dm ? 'text-white' : 'text-slate-700'}`}>{p.nom}</span>
                  <span className={`text-xs font-bold w-20 text-right ${dm ? 'text-zinc-300' : 'text-slate-600'}`}>{p.effectifInitial}</span>
                  <span className={`text-xs font-bold w-20 text-right ${dm ? 'text-blue-300' : 'text-blue-700'}`}>{p.effectifActuel}</span>
                  <span className={`text-xs font-bold w-20 text-right ${p.abandons > 0 ? (dm ? 'text-red-400' : 'text-red-600') : (dm ? 'text-zinc-500' : 'text-slate-400')}`}>
                    {p.abandons > 0 ? `-${p.abandons}` : '0'}
                  </span>
                  <div className="w-32 flex items-center gap-1.5">
                    <div className={`flex-1 h-2 rounded-full overflow-hidden ${dm ? 'bg-zinc-700' : 'bg-slate-200'}`}>
                      <div className={`h-full rounded-full ${ok ? 'bg-emerald-500' : warn ? 'bg-amber-400' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(100, p.tauxRetention)}%` }} />
                    </div>
                    <span className={`text-[11px] font-black w-10 text-right ${ok ? (dm ? 'text-emerald-400' : 'text-emerald-600') : warn ? (dm ? 'text-amber-400' : 'text-amber-600') : (dm ? 'text-red-400' : 'text-red-600')}`}>
                      {Math.round(p.tauxRetention)}%
                    </span>
                  </div>
                  <span className={`text-xs font-bold w-32 text-right ${dm ? 'text-red-400' : 'text-red-600'}`}>
                    {p.coutParEtudiant > 0 ? `${Math.round(p.coutParEtudiant).toLocaleString()} €` : '—'}
                  </span>
                  <span className={`text-xs font-bold w-32 text-right ${dm ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    {p.recetteParEtudiant > 0 ? `${Math.round(p.recetteParEtudiant).toLocaleString()} €` : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Structure masse salariale (vacataires) ───────────────────────── */}
      {daf.statsVac && (daf.statsVac.totalVacataires > 0 || daf.statsVac.totalCout > 0) && (
        <div className={`rounded-2xl border p-5 ${dm ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-slate-200'}`}>
          <h3 className={`text-sm font-black uppercase tracking-wide mb-4 flex items-center gap-2 ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>
            <Users size={14} /> Structure de la masse salariale
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className={`rounded-xl p-3 ${dm ? 'bg-zinc-800' : 'bg-slate-50'}`}>
              <div className={`text-[10px] font-bold uppercase ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>Permanents</div>
              <div className={`text-xl font-black mt-0.5 ${dm ? 'text-white' : 'text-slate-800'}`}>
                {Math.round((masseSalariale - (daf.statsVac.totalCout || 0)) / 1000)}k€
              </div>
              <div className={`text-[10px] ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
                {totalCharges > 0 ? `${Math.round(((masseSalariale - (daf.statsVac.totalCout || 0)) / totalCharges) * 100)}% des charges` : ''}
              </div>
            </div>
            <div className={`rounded-xl p-3 ${dm ? 'bg-zinc-800' : 'bg-slate-50'}`}>
              <div className={`text-[10px] font-bold uppercase ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>Vacataires</div>
              <div className={`text-xl font-black mt-0.5 ${dm ? 'text-amber-300' : 'text-amber-700'}`}>
                {Math.round((daf.statsVac.totalCout || 0) / 1000)}k€
              </div>
              <div className={`text-[10px] ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
                {daf.statsVac.totalHeures > 0 ? `${Math.round(daf.statsVac.totalHeures)}h · ${daf.statsVac.totalVacataires} intervenants` : `${daf.statsVac.totalVacataires} intervenants`}
              </div>
            </div>
            <div className={`rounded-xl p-3 ${dm ? 'bg-zinc-800' : 'bg-slate-50'}`}>
              <div className={`text-[10px] font-bold uppercase ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>Vacataires FI</div>
              <div className={`text-xl font-black mt-0.5 ${dm ? 'text-blue-300' : 'text-blue-700'}`}>
                {Math.round((daf.statsVac.totalFI || 0) / 1000)}k€
              </div>
              <div className={`text-[10px] ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>Formation initiale</div>
            </div>
            <div className={`rounded-xl p-3 ${dm ? 'bg-zinc-800' : 'bg-slate-50'}`}>
              <div className={`text-[10px] font-bold uppercase ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>Vacataires FC</div>
              <div className={`text-xl font-black mt-0.5 ${dm ? 'text-violet-300' : 'text-violet-700'}`}>
                {Math.round((daf.statsVac.totalFC || 0) / 1000)}k€
              </div>
              <div className={`text-[10px] ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>Formation continue</div>
            </div>
          </div>
          {/* Alertes vacataires */}
          {daf.statsVac.alertes?.length > 0 && (
            <div className="space-y-1.5">
              {daf.statsVac.alertes.map((a, i) => (
                <div key={i} className={`flex items-start gap-2 rounded-lg px-3 py-2 text-xs font-semibold border ${dm ? 'bg-amber-900/20 border-amber-800 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                  <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                  <span><strong>{a.service}</strong>{a.nom ? ` — ${a.nom}` : ''} : {a.msg}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── IFC — Provision retraite ──────────────────────────────────────── */}
      {daf.ifc && daf.ifc.agents?.length > 0 && (
        <div className={`rounded-2xl border p-5 ${dm ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-slate-200'}`}>
          <div className="flex items-start justify-between mb-4">
            <h3 className={`text-sm font-black uppercase tracking-wide flex items-center gap-2 ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>
              <Shield size={14} /> IFC — Indemnités de fin de carrière (horizon 8 ans)
            </h3>
            <div className="text-right">
              <div className={`text-2xl font-black ${dm ? 'text-amber-300' : 'text-amber-700'}`}>
                {Math.round(daf.ifc.totalProvision / 1000)}k€
              </div>
              <div className={`text-[10px] ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>Provision à constituer</div>
            </div>
          </div>
          <div className="space-y-1.5">
            {daf.ifc.agents.slice(0, 5).map((a, i) => (
              <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs ${dm ? 'bg-zinc-800/60' : 'bg-slate-50'}`}>
                <span className={`flex-1 font-semibold ${dm ? 'text-white' : 'text-slate-700'}`}>{a.nom}</span>
                <span className={`w-24 text-right ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>{a.source}</span>
                <span className={`w-16 text-right ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>{a.age} ans</span>
                <span className={`w-32 text-right ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>retraite dans {a.anneesAvantRetraite} an{a.anneesAvantRetraite > 1 ? 's' : ''}</span>
                <span className={`w-24 text-right font-bold ${dm ? 'text-amber-300' : 'text-amber-700'}`}>
                  {Math.round(a.provision / 1000)}k€
                </span>
              </div>
            ))}
            {daf.ifc.agents.length > 5 && (
              <div className={`text-xs text-center py-1 ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
                + {daf.ifc.agents.length - 5} agent{daf.ifc.agents.length - 5 > 1 ? 's' : ''} supplémentaire{daf.ifc.agents.length - 5 > 1 ? 's' : ''}
              </div>
            )}
          </div>
          <p className={`text-[10px] mt-3 px-1 ${dm ? 'text-zinc-600' : 'text-slate-400'}`}>
            * Agents dont la retraite est prévue dans les 8 prochaines années (départ à 62 ans). Provision estimée selon ancienneté et salaire brut.
          </p>
        </div>
      )}

      {/* ── Audit financier automatique ───────────────────────────────────── */}
      {(daf.auditItems.length > 0 || daf.alertesRH.filter(a => a.lvl !== 'info').length > 0) && (
        <div className={`rounded-2xl border p-5 ${dm ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-slate-200'}`}>
          <h3 className={`text-sm font-black uppercase tracking-wide mb-4 flex items-center gap-2 ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>
            <FileText size={14} /> Audit automatique — anomalies & vigilances
          </h3>
          <div className="space-y-1.5">
            {daf.auditItems.map((item, i) => (
              <div key={`audit-${i}`} className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm font-semibold border ${
                item.type === 'ER'
                  ? (dm ? 'bg-red-900/30 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-700')
                  : (dm ? 'bg-amber-900/30 border-amber-700 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-700')
              }`}>
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <div>
                  <span className="font-black mr-1.5">[{item.code}]</span>
                  {item.entity && <span className="opacity-70 mr-1.5">{item.entity} —</span>}
                  {item.message}
                </div>
              </div>
            ))}
            {daf.alertesRH.filter(a => a.lvl !== 'info').map((a, i) => (
              <div key={`rh-${i}`} className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm font-semibold border ${
                a.lvl === 'error'
                  ? (dm ? 'bg-red-900/30 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-700')
                  : (dm ? 'bg-amber-900/30 border-amber-700 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-700')
              }`}>
                <Users size={15} className="shrink-0 mt-0.5" />
                {a.msg}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Ventilation par site géographique ────────────────────────────── */}
      {Object.keys(agg.chargesParSite).length > 0 && (
        <div className={`rounded-2xl border p-5 ${dm ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-slate-200'}`}>
          <h3 className={`text-sm font-black uppercase tracking-wide mb-4 flex items-center gap-2 ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>
            <MapPin size={14} /> Ventilation par site géographique
          </h3>
          <div className={`flex items-center gap-3 px-4 py-2 text-[10px] font-black uppercase tracking-wider mb-2 ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
            <span className="flex-1">Site</span>
            <span className="w-32 text-right">Charges imputées</span>
            <span className="w-32 text-right">Recettes imputées</span>
            <span className="w-24 text-right">Solde</span>
            <span className="w-28 text-right">Apprenants</span>
            <span className="w-36 text-right">Coût / Apprenant</span>
          </div>
          <div className="space-y-1.5">
            {Object.entries(agg.chargesParSite)
              .sort((a, b) => b[1].charges - a[1].charges)
              .map(([siteName, data]) => {
                const solde = data.recettes - data.charges;
                const coutApp = data.etudiants > 0 ? data.charges / data.etudiants : 0;
                return (
                  <div key={siteName} className={`flex items-center gap-3 px-4 py-3 rounded-xl ${dm ? 'bg-zinc-800/60' : 'bg-slate-50'}`}>
                    <span className={`flex-1 text-sm font-semibold flex items-center gap-1.5 ${dm ? 'text-white' : 'text-slate-700'}`}>
                      <MapPin size={13} className={dm ? 'text-blue-400' : 'text-blue-500'} />{siteName}
                    </span>
                    <span className={`text-xs font-bold w-32 text-right ${dm ? 'text-red-400' : 'text-red-600'}`}>
                      {Math.round(data.charges).toLocaleString()} €
                    </span>
                    <span className={`text-xs font-bold w-32 text-right ${dm ? 'text-emerald-400' : 'text-emerald-600'}`}>
                      {Math.round(data.recettes).toLocaleString()} €
                    </span>
                    <span className={`text-xs font-bold w-24 text-right ${solde >= 0 ? (dm ? 'text-emerald-400' : 'text-emerald-700') : (dm ? 'text-red-400' : 'text-red-700')}`}>
                      {solde >= 0 ? '+' : ''}{Math.round(solde).toLocaleString()} €
                    </span>
                    <span className={`text-xs font-bold w-28 text-right ${dm ? 'text-zinc-300' : 'text-slate-600'}`}>{data.etudiants}</span>
                    <span className={`text-xs font-bold w-36 text-right ${dm ? 'text-blue-300' : 'text-blue-700'}`}>
                      {coutApp > 0 ? `${Math.round(coutApp).toLocaleString()} €` : '—'}
                    </span>
                  </div>
                );
              })}
          </div>
          <p className={`text-[10px] mt-3 px-1 ${dm ? 'text-zinc-600' : 'text-slate-400'}`}>
            * Charges et recettes réparties proportionnellement aux effectifs par site. Direction et Pôle Support non inclus.
          </p>
        </div>
      )}

      {/* ── Tableau détail par entité ─────────────────────────────────────── */}
      <div className={`rounded-2xl border p-5 ${dm ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-slate-200'}`}>
        <h3 className={`text-sm font-black uppercase tracking-wide mb-4 flex items-center gap-2 ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>
          <BarChart2 size={14} /> Détail par entité
        </h3>
        <div className={`flex items-center gap-3 px-4 py-2 text-[10px] font-black uppercase tracking-wider mb-2 ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
          <span className="flex-1">Entité</span>
          <span className="w-28 text-right">Charges</span>
          <span className="w-28 text-right">Recettes</span>
          <span className="w-24 text-right">Solde</span>
          <span className="w-28 text-right">Couverture</span>
        </div>
        <div className="space-y-1.5">
          <ServiceRow label="Direction / Siège" bs={agg.bd} darkMode={darkMode} seuilCouverture={seuilCouverture} />
          <ServiceRow label="Pôle Support" bs={agg.bp} darkMode={darkMode} seuilCouverture={seuilCouverture} />
          {agg.bServices.map(({ service, bs }) => (
            <ServiceRow key={service.id} label={service.nom} bs={bs} darkMode={darkMode} seuilCouverture={seuilCouverture} />
          ))}
        </div>
        <div className={`flex items-center gap-3 px-4 py-3 mt-3 rounded-xl border-2 font-black ${dm ? 'bg-zinc-800 border-zinc-600 text-white' : 'bg-slate-100 border-slate-300 text-slate-800'}`}>
          <span className="flex-1 text-sm">TOTAL CONSOLIDÉ</span>
          <span className={`text-sm w-28 text-right ${dm ? 'text-red-400' : 'text-red-700'}`}>{Math.round(totalCharges).toLocaleString()} €</span>
          <span className={`text-sm w-28 text-right ${dm ? 'text-emerald-400' : 'text-emerald-700'}`}>{Math.round(totalRecettes).toLocaleString()} €</span>
          <span className={`text-sm w-24 text-right ${resultat >= 0 ? (dm ? 'text-emerald-300' : 'text-emerald-700') : (dm ? 'text-red-300' : 'text-red-700')}`}>
            {resultat >= 0 ? '+' : ''}{Math.round(resultat).toLocaleString()} €
          </span>
          <span className={`text-sm font-black w-28 text-right ${tauxCouverture >= 100 ? (dm ? 'text-emerald-300' : 'text-emerald-700') : tauxCouverture >= seuilCouverture ? (dm ? 'text-amber-300' : 'text-amber-700') : (dm ? 'text-red-300' : 'text-red-700')}`}>
            {Math.round(tauxCouverture)}%
          </span>
        </div>
      </div>

      {/* ── Suivi d'exécution (si données réalisées saisies) ─────────────── */}
      {agg.hasRealise && (() => {
        const pctChargesExec = totalCharges > 0 ? (agg.totalChargesRealisees / totalCharges) * 100 : 0;
        const pctRecettesExec = totalRecettes > 0 ? (agg.totalRecettesRealisees / totalRecettes) * 100 : 0;
        const ecartCharges = agg.totalChargesRealisees - totalCharges;
        const ecartRecettes = agg.totalRecettesRealisees - totalRecettes;
        return (
          <div className={`rounded-2xl border p-5 ${dm ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-slate-200'}`}>
            <h3 className={`text-sm font-black uppercase tracking-wide mb-4 flex items-center gap-2 ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>
              <Clock size={14} /> Suivi d'exécution budgétaire
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className={`text-xs font-bold ${dm ? 'text-zinc-300' : 'text-slate-700'}`}>Charges réalisées</span>
                  <span className={`text-xs font-black ${ecartCharges > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                    {Math.round(agg.totalChargesRealisees / 1000)}k€ / {Math.round(totalCharges / 1000)}k€
                    {' '}({ecartCharges >= 0 ? '+' : ''}{Math.round(ecartCharges / 1000)}k€)
                  </span>
                </div>
                <div className={`h-3 rounded-full overflow-hidden ${dm ? 'bg-zinc-700' : 'bg-slate-200'}`}>
                  <div className={`h-full rounded-full transition-all ${pctChargesExec > 100 ? 'bg-red-500' : pctChargesExec > 80 ? 'bg-amber-400' : 'bg-blue-500'}`}
                    style={{ width: `${Math.min(100, pctChargesExec)}%` }} />
                </div>
                <div className={`text-[10px] mt-0.5 ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>{Math.round(pctChargesExec)}% du budget</div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className={`text-xs font-bold ${dm ? 'text-zinc-300' : 'text-slate-700'}`}>Recettes réalisées</span>
                  <span className={`text-xs font-black ${ecartRecettes >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {Math.round(agg.totalRecettesRealisees / 1000)}k€ / {Math.round(totalRecettes / 1000)}k€
                    {' '}({ecartRecettes >= 0 ? '+' : ''}{Math.round(ecartRecettes / 1000)}k€)
                  </span>
                </div>
                <div className={`h-3 rounded-full overflow-hidden ${dm ? 'bg-zinc-700' : 'bg-slate-200'}`}>
                  <div className={`h-full rounded-full transition-all ${pctRecettesExec >= 100 ? 'bg-emerald-500' : pctRecettesExec > 80 ? 'bg-blue-500' : 'bg-amber-400'}`}
                    style={{ width: `${Math.min(100, pctRecettesExec)}%` }} />
                </div>
                <div className={`text-[10px] mt-0.5 ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>{Math.round(pctRecettesExec)}% du budget</div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Alertes ────────────────────────────────────────────────────────── */}
      {(() => {
        const alertes = [];
        if (tauxCouverture < seuilCouverture) alertes.push({ level: 'red', msg: `Taux de couverture global ${Math.round(tauxCouverture)}% sous le seuil de ${seuilCouverture}%` });
        if (agg.dureeVieReserves !== null && agg.dureeVieReserves < 1) alertes.push({ level: 'red', msg: `Réserves épuisées dans ${agg.dureeVieReserves.toFixed(1)} an — risque de cessation de paiement` });
        if (agg.dureeVieReserves !== null && agg.dureeVieReserves < 2 && agg.dureeVieReserves >= 1) alertes.push({ level: 'amber', msg: `Réserves limitées à ${agg.dureeVieReserves.toFixed(1)} an au rythme actuel` });
        if (pctMS > 80) alertes.push({ level: 'amber', msg: `Masse salariale à ${Math.round(pctMS)}% des charges — médiane médico-social : 70–75%` });
        if (daf.pctSubventions > 80) alertes.push({ level: 'amber', msg: `Dépendance aux subventions à ${Math.round(daf.pctSubventions)}% — vulnérabilité aux décisions de financement public` });
        if (daf.tresorerie?.alertesMois?.length >= 3) alertes.push({ level: 'amber', msg: `${daf.tresorerie.alertesMois.length} mois de trésorerie déficitaire prévus — anticiper une ligne de trésorerie` });
        if (daf.bfr?.bfr > 0 && agg.reserves > 0 && daf.bfr.bfr > agg.reserves * 0.5) alertes.push({ level: 'amber', msg: `BFR de ${Math.round(daf.bfr.bfr / 1000)}k€ représente plus de 50% des réserves` });
        agg.bServices.forEach(({ service, bs }) => {
          const rec = bs.recettes - (bs.recettesFD || 0);
          const chg = bs.salaires + bs.exploitation;
          const tc = chg > 0 ? (rec / chg) * 100 : (rec > 0 ? 100 : 0);
          if (tc < seuilCouverture && tc > 0) alertes.push({ level: 'amber', msg: `${service.nom} : taux de couverture ${Math.round(tc)}%` });
        });
        if (alertes.length === 0) return null;
        return (
          <div className="space-y-2">
            {alertes.map((a, i) => (
              <div key={i} className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm font-semibold border ${a.level === 'red' ? (dm ? 'bg-red-900/30 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-700') : (dm ? 'bg-amber-900/30 border-amber-700 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-700')}`}>
                <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                {a.msg}
              </div>
            ))}
          </div>
        );
      })()}

    </div>
  );
}
