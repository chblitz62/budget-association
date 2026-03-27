import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Users, Euro, BarChart2, Clock, Shield, Zap, Activity } from 'lucide-react';
import {
  calculerBudgetService,
  calculerBudgetDirection,
  calculerBudgetPoleSupport,
  calculerSalaireAnnuel,
  appliquerStressTest,
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
        {Math.round(bs.salaires + bs.exploitation).toLocaleString()} €
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

    // Fonds Dédiés (Compte 19) exclus du taux de couverture — ressources fléchées non disponibles librement
    const totalFD = (bd.recettesFD || 0) + (bp.recettesFD || 0) + bServices.reduce((s, { bs }) => s + (bs.recettesFD || 0), 0);
    const totalRecettesLibres = totalRecettes - totalFD;

    const resultat = totalRecettes - totalCharges;
    const tauxCouverture = totalCharges > 0 ? (totalRecettesLibres / totalCharges) * 100 : 0;

    // Suivi réalisé consolidé
    const chargesRealiseesSvc = bServices.reduce((s, { bs }) => s + (bs.exploitationRealisee || 0), 0);
    const recettesRealiseesSvc = bServices.reduce((s, { bs }) => s + (bs.recettesRealisees || 0), 0);
    const totalChargesRealisees = (bd.exploitationRealisee || 0) + (bp.exploitationRealisee || 0) + chargesRealiseesSvc;
    const totalRecettesRealisees = (bd.recettesRealisees || 0) + (bp.recettesRealisees || 0) + recettesRealiseesSvc;
    const hasRealise = bd.hasRealise || bp.hasRealise || bServices.some(({ bs }) => bs.hasRealise);

    // Masse salariale totale
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

    // ETP total
    const etpTotal = allPersonnel.reduce((s, p) => s + parseFloat(p.etp || 0), 0);

    // Nb stagiaires
    const nbStagiaires = services.reduce((tot, s) => {
      return tot + (s.promos || []).reduce((st, p) => {
        const eff = parseInt(p.effectif) || 0;
        return st + eff;
      }, 0);
    }, 0);

    // Réserves
    const reserves = (globalParams.fondRoulement || []).reduce((s, f) => s + (parseFloat(f.montant) || 0), 0);
    const dureeVieReserves = resultat < 0 && reserves > 0 ? reserves / Math.abs(resultat) : null;

    // Stress test — impact -20% subventions
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
      reserves, dureeVieReserves,
      impactStress, totalFD,
      totalChargesRealisees, totalRecettesRealisees, hasRealise,
    };
  }, [direction, poleSupport, services, poolRH, globalParams, msETP]);

  const { tauxCouverture, resultat, totalCharges, totalRecettes, masseSalariale, pctMS } = agg;

  const couleurCouverture = tauxCouverture >= 100 ? 'green' : tauxCouverture >= seuilCouverture ? 'amber' : 'red';
  const couleurResultat   = resultat >= 0 ? 'green' : 'red';
  const couleurReserves   = agg.dureeVieReserves === null ? 'green'
    : agg.dureeVieReserves >= 2 ? 'amber'
    : 'red';

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
            : agg.reserves > 0 ? 'Budget à l\'équilibre' : 'Saisir dans Paramètres → Fonds de roulement'}
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
          <KpiCard
            label="ETP total"
            value={agg.etpTotal.toFixed(1)}
            color="slate"
            icon={Users}
            darkMode={darkMode}
          />
          <KpiCard
            label="Stagiaires"
            value={agg.nbStagiaires || '—'}
            sub="toutes promos"
            color="slate"
            darkMode={darkMode}
          />
        </div>
      </div>

      {/* ── Tableau détail par entité ─────────────────────────────────────── */}
      <div className={`rounded-2xl border p-5 ${dm ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-slate-200'}`}>
        <h3 className={`text-sm font-black uppercase tracking-wide mb-4 flex items-center gap-2 ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>
          <BarChart2 size={14} /> Détail par entité
        </h3>
        {/* En-têtes */}
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
        {/* Ligne totale */}
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

      {/* ── Suivi d'exécution (si données réalisées saisies) ────────────────── */}
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
                  <div className={`h-full rounded-full transition-all ${pctChargesExec > 100 ? 'bg-red-500' : pctChargesExec > 80 ? 'bg-amber-400' : 'bg-blue-500'}`} style={{ width: `${Math.min(100, pctChargesExec)}%` }} />
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
                  <div className={`h-full rounded-full transition-all ${pctRecettesExec >= 100 ? 'bg-emerald-500' : pctRecettesExec > 80 ? 'bg-blue-500' : 'bg-amber-400'}`} style={{ width: `${Math.min(100, pctRecettesExec)}%` }} />
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
