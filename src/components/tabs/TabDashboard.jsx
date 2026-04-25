import React, { useState } from 'react';
import { TrendingUp, TrendingDown, BarChart3, Calendar, Target, Users, FileSpreadsheet, Clock, Bell, Leaf, GitCompare, AlertTriangle, RefreshCw, Edit3, CheckCircle, Presentation, Wand2 } from 'lucide-react';
import NoviceDashboard from '../NoviceDashboard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';
import DashboardDG from '../DashboardDG';
import TabTresorerie from '../TabTresorerie';
import InfoTooltip from '../ui/Tooltip';
import { loadSnapshot } from '../SnapshotManager';
import BoardModeView from '../BoardModeView';
import {
  calculerBudgetService,
  calculerPresenceEquipe,
  calculerStatsVacataires,
  calculerIFC,
  calculerSalaireAnnuel,
} from '../../utils/calculations';
import { calculerStatsFormation } from '../../utils/constants';

export default function TabDashboard({
  darkMode,
  direction,
  poleSupport,
  services,
  poolRH,
  globalParams,
  setGlobalParams,
  getBFR,
  getBudgetService,
  getBudgetDirection,
  getBudgetPoleSupport,
  compareSnapshot,
  setCompareSnapshot,
  summary3Ans,
  budgetAnnuel,
  tresorerie,
  totalCharges,
  totalRecettes,
  soldeGlobal,
  tauxCouverture,
  masseSalarialeTotal,
  planningAbsences,
  msETP,
  nomsMois,
  seuilCouverture,
  projection36 = [],
  rollingForecastData = [],
  rollingForecast = null,
  setRollingForecast = null,
}) {
  const [showRollingEditor, setShowRollingEditor] = useState(false);
  const [showBoardMode, setShowBoardMode] = useState(false);

  // Mode "Synthèse Simple" pour novice (par défaut) — bascule via globalParams.expertMode
  const expertMode = !!globalParams?.expertMode;
  const onToggleExpertMode = setGlobalParams
    ? () => setGlobalParams({ ...globalParams, expertMode: !expertMode })
    : null;

  // Vue novice — Synthèse Simple, return early
  if (!expertMode) {
    return (
      <>
        {showBoardMode && <BoardModeView open onClose={() => setShowBoardMode(false)} />}
        <NoviceDashboard darkMode={darkMode} onToggleExpertMode={onToggleExpertMode} />
      </>
    );
  }

  return (
    <>
        {showBoardMode && <BoardModeView open onClose={() => setShowBoardMode(false)} />}

        {/* ─── BOUTON RETOUR VUE SIMPLE (Mode Expert actif) ─── */}
        {onToggleExpertMode && (
          <div className="flex justify-end mb-4">
            <button
              onClick={onToggleExpertMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${darkMode
                ? 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
              title="Revenir à la vue simple (Mode Novice)"
            >
              <Wand2 size={12} strokeWidth={1.5} />
              Vue simple
            </button>
          </div>
        )}

        {/* ─── BANDEAU MODE CA ─── */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowBoardMode(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border-2 ${darkMode
              ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:border-indigo-500'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-indigo-50 hover:border-indigo-400'}`}
            title="Vue épurée plein écran pour présentation au Conseil d'Administration"
          >
            <Presentation size={16} className="text-indigo-500" />
            Mode CA
          </button>
        </div>

        {/* ─── TABLEAU DE BORD DG ─── */}
        <DashboardDG
          direction={direction}
          poleSupport={poleSupport}
          services={services}
          poolRH={poolRH}
          globalParams={globalParams}
          darkMode={darkMode}
          getBFR={getBFR}
        />

        {/* COMPARAISON BUDGET VOTÉ */}
        {compareSnapshot && (() => {
          const snap = loadSnapshot();
          if (!snap) return null;
          const fmtDelta = (cur, ref) => {
            const d = cur - ref;
            const pct = ref !== 0 ? ((d / Math.abs(ref)) * 100).toFixed(1) : '—';
            const cls = d >= 0 ? 'text-emerald-500' : 'text-rose-500';
            return <span className={`font-black font-mono-numbers text-xs ${cls}`}>{d >= 0 ? '+' : ''}{Math.round(d).toLocaleString()} € ({pct} %)</span>;
          };
          const snapServices = snap.services || [];
          return (
            <div className={`rounded-3xl border p-6 mb-6 ${darkMode ? 'bg-indigo-950/40 border-indigo-700/40' : 'bg-indigo-50 border-indigo-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-base font-black flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                  <GitCompare size={18} className="text-indigo-500" /> Comparaison — Budget Voté vs Actuel
                  <span className={`text-xs font-normal ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
                    Figé le {new Date(snap.savedAt).toLocaleDateString('fr-FR')}
                  </span>
                </h2>
                <button onClick={() => setCompareSnapshot(false)} className={`text-xs px-2 py-1 rounded-lg ${darkMode ? 'text-zinc-400 hover:bg-zinc-800' : 'text-slate-400 hover:bg-white'}`}>✕</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`text-[10px] font-bold uppercase tracking-wide border-b ${darkMode ? 'text-zinc-500 border-zinc-700' : 'text-slate-400 border-slate-200'}`}>
                      <th className="text-left py-2 pr-4">Service</th>
                      <th className="text-right py-2 px-3">Budget Voté</th>
                      <th className="text-right py-2 px-3">Actuel</th>
                      <th className="text-right py-2 pl-3">Écart</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map(srv => {
                      const cur = getBudgetService(srv);
                      const ref = snapServices.find(s => s.id === srv.id);
                      if (!ref) return null;
                      const refBudget = calculerBudgetService(ref, null, 2026, msETP, poolRH);
                      return (
                        <tr key={srv.id} className={`border-b ${darkMode ? 'border-zinc-800' : 'border-slate-100'}`}>
                          <td className={`py-2 pr-4 font-medium ${darkMode ? 'text-white' : 'text-slate-800'}`}>{srv.nom}</td>
                          <td className={`py-2 px-3 text-right font-mono-numbers ${darkMode ? 'text-zinc-300' : 'text-slate-600'}`}>{Math.round(refBudget.total).toLocaleString()} €</td>
                          <td className={`py-2 px-3 text-right font-mono-numbers ${darkMode ? 'text-zinc-300' : 'text-slate-600'}`}>{Math.round(cur.total).toLocaleString()} €</td>
                          <td className="py-2 pl-3 text-right">{fmtDelta(cur.total, refBudget.total)}</td>
                        </tr>
                      );
                    })}
                    <tr className={`border-t-2 ${darkMode ? 'border-zinc-700' : 'border-slate-300'}`}>
                      <td className={`py-2 pr-4 font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>TOTAL CHARGES</td>
                      <td className={`py-2 px-3 text-right font-black font-mono-numbers ${darkMode ? 'text-zinc-200' : 'text-slate-700'}`}>
                        {Math.round(snapServices.reduce((s, r) => s + calculerBudgetService(r, null, 2026, msETP, poolRH).total, 0)).toLocaleString()} €
                      </td>
                      <td className={`py-2 px-3 text-right font-black font-mono-numbers ${darkMode ? 'text-zinc-200' : 'text-slate-700'}`}>{Math.round(totalCharges).toLocaleString()} €</td>
                      <td className="py-2 pl-3 text-right">
                        {fmtDelta(totalCharges, snapServices.reduce((s, r) => s + calculerBudgetService(r, null, 2026, msETP, poolRH).total, 0))}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        {/* BUDGET ANNUEL */}
        <div id="budget-annuel" className={`rounded-3xl border p-8 mb-8 backdrop-blur-md transition-all duration-300 ${darkMode ? 'bg-zinc-900/80 border-zinc-700/30 shadow-[0_8px_30px_rgb(0,0,0,0.12)]' : 'bg-white border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'}`}>
          <h2 className={`text-xl font-black mb-6 flex items-center gap-3 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-500"><Calendar size={22} /></div>
            Budget Annuel - Répartition mensuelle
          </h2>
          <div className="grid grid-cols-12 gap-3 mb-8 h-48 items-end">
            {budgetAnnuel.mois.map((m, i) => {
              const maxMois = Math.max(...budgetAnnuel.mois.map(x => x.total));
              const heightPct = maxMois > 0 ? (m.total / maxMois) * 100 : 0;
              return (
                <div key={i} className="flex flex-col items-center group h-full justify-end">
                  <div className="w-full relative group">
                    <div className="w-full bg-gradient-to-t from-teal-500 to-cyan-400 rounded-t-xl transition-all duration-500 group-hover:brightness-110 group-hover:shadow-lg group-hover:shadow-teal-500/20" 
                         style={{ height: `${heightPct}%`, minHeight: '4px' }}>
                    </div>
                    {/* Tooltip on hover */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                      {Math.round(m.total).toLocaleString()} €
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold mt-3 uppercase tracking-tighter ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>{nomsMois[i]}</span>
                  <span className={`text-[11px] font-black font-mono-numbers ${darkMode ? 'text-teal-400' : 'text-teal-600'}`}>{Math.round(m.total / 1000)}k</span>
                </div>
              );
            })}
          </div>
          <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t ${darkMode ? 'border-white/5' : 'border-slate-100'}`}>
            {[
              { label: 'Masse salariale', val: budgetAnnuel.salaires, cls: darkMode ? 'text-blue-400' : 'text-blue-600' },
              { label: 'Exploitation', val: budgetAnnuel.exploitation, cls: darkMode ? 'text-teal-400' : 'text-teal-600' },
              { label: 'Amortissements', val: budgetAnnuel.amortissements, cls: darkMode ? 'text-orange-400' : 'text-orange-600' },
              { label: 'Total annuel', val: budgetAnnuel.totalAnnuel, cls: darkMode ? 'text-purple-400' : 'text-purple-600' }
            ].map((k, idx) => (
              <div key={idx} className={`p-4 rounded-2xl transition-all duration-300 ${
                darkMode ? 'bg-gray-700/30 hover:bg-gray-700/50' : 'bg-slate-50/50 hover:bg-slate-50'
              }`}>
                <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${k.cls}`}>{k.label}</div>
                <div className={`text-lg font-black font-mono-numbers ${darkMode ? 'text-white' : 'text-slate-900'}`}>{Math.round(k.val).toLocaleString()} <span className="text-xs font-bold opacity-50 text-slate-500">€</span></div>
              </div>
            ))}
          </div>
        </div>

        <TabTresorerie tresorerie={tresorerie} darkMode={darkMode} />

        {/* KPI IMPACT ABSENCES — Planning → Budget */}
        {(() => {
          const ANNEE = 2026;
          const tousAgentsDash = [
            ...(direction?.personnel || []).map(p => ({ ...p, source: 'Direction' })),
            ...(poleSupport?.personnel || []).map(p => ({ ...p, source: 'Pôle Ressources' })),
            ...services.flatMap(s => (s.personnel || []).map(p => ({ ...p, source: s.nom }))),
            ...(poolRH || []).map(p => ({ ...p, source: 'Pool RH' })),
          ];
          const apDash = calculerPresenceEquipe(tousAgentsDash, planningAbsences, ANNEE);
          const totalETPc = apDash.reduce((s, a) => s + parseFloat(a.etp), 0);
          const totalETPr = apDash.reduce((s, a) => s + a.presence.etpReel, 0);
          const deltaETP = totalETPc - totalETPr;
          const totalCarence = apDash.reduce((s, a) => s + a.presence.coutCarence, 0);
          const totalMaladieJ = apDash.reduce((s, a) => s + a.presence.joursMaladiePlanning, 0);
          const tauxPres = totalETPc > 0 ? (totalETPr / totalETPc) * 100 : 100;
          const hasAbsences = apDash.some(a => a.presence.absences.total > 0);
          if (!hasAbsences) return null;
          return (
            <div className={`rounded-2xl border-2 px-5 py-3 mb-6 flex flex-wrap items-center gap-4 ${darkMode ? 'bg-gray-800/60 border-amber-800' : 'bg-amber-50 border-amber-200'}`}>
              <div className="flex items-center gap-2 mr-2">
                <AlertTriangle size={18} className={darkMode ? 'text-amber-400' : 'text-amber-600'} />
                <span className={`text-sm font-black ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>Impact absences planning {ANNEE}</span>
              </div>
              {[
                { label: 'ETP contrat', val: totalETPc.toFixed(1), color: darkMode ? 'text-gray-300' : 'text-slate-700' },
                { label: 'ETP réel (planning)', val: totalETPr.toFixed(1), color: darkMode ? 'text-teal-300' : 'text-teal-700' },
                { label: 'ETP perdus', val: `-${deltaETP.toFixed(2)}`, color: deltaETP > 0.1 ? (darkMode ? 'text-red-400' : 'text-red-600') : (darkMode ? 'text-emerald-400' : 'text-emerald-600') },
                { label: 'Taux présence', val: `${tauxPres.toFixed(1)}%`, color: tauxPres < 95 ? (darkMode ? 'text-amber-400' : 'text-amber-700') : (darkMode ? 'text-emerald-400' : 'text-emerald-600') },
                { label: 'J. maladie', val: `${totalMaladieJ}j`, color: darkMode ? 'text-red-400' : 'text-red-600' },
                { label: 'Coût carence', val: `${Math.round(totalCarence).toLocaleString()} €`, color: darkMode ? 'text-orange-400' : 'text-orange-700' },
              ].map((k, i) => (
                <div key={i} className="text-center">
                  <div className={`text-xs font-bold opacity-70 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{k.label}</div>
                  <div className={`text-base font-black ${k.color}`}>{k.val}</div>
                </div>
              ))}
            </div>
          );
        })()}

        {/* SYNTHESE 3 ANS - CARTES */}
        {/* ── INDICE GVT ─────────────────────────────────────────── */}
        {(() => {
          const tauxGVT = globalParams.tauxGVT ?? 1.5;
          const gvtAn2 = (Math.pow(1 + tauxGVT / 100, 1) - 1) * 100;
          const gvtAn3 = (Math.pow(1 + tauxGVT / 100, 2) - 1) * 100;
          const impactGVTAn2 = masseSalarialeTotal * (Math.pow(1 + tauxGVT / 100, 1) - 1);
          const impactGVTAn3 = masseSalarialeTotal * (Math.pow(1 + tauxGVT / 100, 2) - 1);
          return (
            <div className={`rounded-2xl border p-4 mb-5 flex flex-wrap items-center gap-4 ${darkMode ? 'bg-zinc-800/60 border-zinc-700' : 'bg-amber-50 border-amber-200'}`}>
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${darkMode ? 'bg-amber-900/40' : 'bg-amber-100'}`}>
                  <TrendingUp size={15} className={darkMode ? 'text-amber-400' : 'text-amber-600'} />
                </div>
                <div>
                  <span className={`text-xs font-black uppercase tracking-wide ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>Indice GVT</span>
                  <InfoTooltip darkMode={darkMode} content="GVT = Glissement Vieillesse Technicité. Mesure l'augmentation automatique de la masse salariale liée à l'ancienneté et aux changements d'échelon, indépendamment des augmentations générales. Taux paramétrable dans les Paramètres généraux." />
                </div>
              </div>
              <div className="flex gap-4 text-xs flex-wrap">
                <div className={`px-3 py-1.5 rounded-lg ${darkMode ? 'bg-zinc-700' : 'bg-white border border-amber-100'}`}>
                  <span className={`font-bold ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Taux / an : </span>
                  <span className={`font-black ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>{tauxGVT.toFixed(1)}%</span>
                </div>
                {masseSalarialeTotal > 0 && <>
                  <div className={`px-3 py-1.5 rounded-lg ${darkMode ? 'bg-zinc-700' : 'bg-white border border-amber-100'}`}>
                    <span className={`font-bold ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>An 2 : </span>
                    <span className={`font-black text-amber-500`}>+{gvtAn2.toFixed(1)}% → +{Math.round(impactGVTAn2 / 1000)}k €</span>
                  </div>
                  <div className={`px-3 py-1.5 rounded-lg ${darkMode ? 'bg-zinc-700' : 'bg-white border border-amber-100'}`}>
                    <span className={`font-bold ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>An 3 : </span>
                    <span className={`font-black text-orange-500`}>+{gvtAn3.toFixed(1)}% → +{Math.round(impactGVTAn3 / 1000)}k €</span>
                  </div>
                </>}
              </div>
              <div className={`ml-auto text-[10px] ${darkMode ? 'text-zinc-600' : 'text-amber-400'}`}>impact cumulé sur la masse salariale</div>
            </div>
          );
        })()}

        <div id="synthese-3ans" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {summary3Ans.map((s, idx) => {
            const tauxGVT = globalParams.tauxGVT ?? 1.5;
            const gvtPct = idx > 0 ? (Math.pow(1 + tauxGVT / 100, idx) - 1) * 100 : 0;
            return (
            <div key={s.annee} className={`p-6 rounded-3xl shadow-lg border-2 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gradient-to-br from-white to-cyan-50 border-teal-200'}`}>
              <div className="flex justify-between items-start mb-4">
                <span className="text-sm font-black uppercase text-teal-400">Année {s.annee}</span>
                <div className="flex items-center gap-2">
                  {idx > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-black">
                      GVT +{gvtPct.toFixed(1)}%
                    </span>
                  )}
                  <TrendingUp className="text-teal-500" size={20} />
                </div>
              </div>
              <div className={`text-3xl font-black mb-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>{Math.round(s.total).toLocaleString()} €</div>
              <div className={`text-sm space-y-1 ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1">
                    Amortissements
                    <InfoTooltip darkMode={darkMode} content="Charge comptable uniquement — étalement du coût d'un investissement sur sa durée de vie. N'est PAS un flux de trésorerie (pas de décaissement bancaire). À distinguer du remboursement d'emprunt." />
                  </span>
                  <span className="font-bold">{Math.round(s.amortissements).toLocaleString()} €</span>
                </div>
                <div className="flex justify-between"><span>Intérêts:</span><span className="font-bold">{Math.round(s.interets).toLocaleString()} €</span></div>
                <div className="flex justify-between"><span>Siège:</span><span className="font-bold">{Math.round(s.budgetDirection).toLocaleString()} €</span></div>
              </div>
              <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-teal-200'}`}>
                <div className={`text-xs font-black uppercase mb-2 ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>Par service</div>
                {s.detailsServices.map(serv => (
                  <div key={serv.nom} className={`p-2 rounded-lg mb-1 ${darkMode ? 'bg-gray-700/50' : 'bg-white/60'}`}>
                    <div className={`font-bold text-sm ${darkMode ? 'text-gray-200' : 'text-slate-700'}`}>{serv.nom}</div>
                    <div className={`text-xs ${darkMode ? 'text-teal-400' : 'text-teal-700'}`}>{Math.round(serv.budget).toLocaleString()} €</div>
                  </div>
                ))}
              </div>
            </div>
          );})}
        </div>

        {/* ── SYNTHÈSE BUDGÉTAIRE AUTOMATIQUE + IFC ───────────────────────────── */}
        {(() => {
          // ── Synthèse textuelle ──
          const bDir = getBudgetDirection();
          const bPS  = getBudgetPoleSupport();
          const masseSalariale = services.reduce((s, srv) => s + getBudgetService(srv).salaires, 0)
            + bDir.salaires + bPS.salaires;
          const ratioSal = totalCharges > 0 ? Math.round(masseSalariale / totalCharges * 100) : 0;
          const toutesLignes = [
            ...(direction.chargesSiege || []),
            ...(poleSupport?.exploitation || []),
            ...services.flatMap(s => s.exploitation || []),
          ];
          const topPoste = toutesLignes
            .map(l => ({ nom: l.nom || '—', montant: (l.montant || 0) * 12 }))
            .sort((a, b) => b.montant - a.montant)[0];
          const signeSolde = soldeGlobal >= 0 ? 'excédentaire' : 'déficitaire';
          let synthese = `Le budget prévisionnel 2026 présente un résultat ${signeSolde} de ${Math.abs(Math.round(soldeGlobal)).toLocaleString('fr-FR')} €`;
          synthese += ` (taux de couverture : ${Math.round(tauxCouverture)}%).`;
          synthese += ` La masse salariale représente ${ratioSal}% des charges totales (${Math.round(masseSalariale).toLocaleString('fr-FR')} €).`;
          if (topPoste?.montant > 0) synthese += ` Le poste de dépense le plus important hors salaires est "${topPoste.nom}" avec ${Math.round(topPoste.montant).toLocaleString('fr-FR')} €/an.`;
          if (soldeGlobal < 0) synthese += ` ⚠️ Un déficit prévisionnel est identifié — revoir les leviers de recettes ou contenir les charges.`;
          else if (tauxCouverture >= 105) synthese += ` ✓ L'excédent constitue une réserve de gestion permettant de sécuriser la trésorerie.`;

          // ── IFC — msETP transmis pour cohérence avec le budget ──
          const ifc = calculerIFC(direction, services, poleSupport, 2026, 62, 8, msETP);

          return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Synthèse automatique */}
              <div className={`rounded-3xl shadow-lg border-2 p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
                <h2 className={`text-lg font-black mb-3 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                  <FileSpreadsheet size={20} className="text-violet-500" /> Synthèse automatique
                </h2>
                <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>{synthese}</p>
                <div className={`mt-4 pt-4 border-t flex gap-6 ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
                  <div>
                    <div className={`text-[10px] font-bold uppercase ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Solde</div>
                    <div className={`text-lg font-black ${soldeGlobal >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {soldeGlobal >= 0 ? '+' : ''}{Math.round(soldeGlobal).toLocaleString()} €
                    </div>
                  </div>
                  <div>
                    <div className={`text-[10px] font-bold uppercase ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Masse sal.</div>
                    <div className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>{ratioSal}%</div>
                  </div>
                  <div>
                    <div className={`text-[10px] font-bold uppercase ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Couverture</div>
                    <div className={`text-lg font-black ${tauxCouverture >= 100 ? 'text-emerald-500' : tauxCouverture >= seuilCouverture ? 'text-amber-500' : 'text-rose-500'}`}>{Math.round(tauxCouverture)}%</div>
                  </div>
                </div>
              </div>

              {/* IFC — Indemnités de Fin de Carrière */}
              <div className={`rounded-3xl shadow-lg border-2 p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
                <h2 className={`text-lg font-black mb-1 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                  <Clock size={20} className="text-rose-500" /> Provisions IFC
                </h2>
                <p className={`text-xs mb-3 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Indemnités de Fin de Carrière — agents à ≤ 8 ans de la retraite</p>
                {ifc.agents.length === 0
                  ? <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Aucun agent avec année de naissance et d'entrée renseignées, ou aucun départ prévu dans les 8 ans.</p>
                  : <>
                    <div className="space-y-2 mb-3">
                      {ifc.agents.slice(0, 4).map(a => (
                        <div key={a.id} className={`p-2 rounded-xl ${darkMode ? 'bg-gray-700/60' : 'bg-slate-50'}`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{a.nom}</span>
                              <span className={`text-xs ml-2 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{a.source}</span>
                            </div>
                            <div className="text-right">
                              <div className={`text-xs font-black ${a.anneesAvantRetraite <= 2 ? 'text-rose-500' : a.anneesAvantRetraite <= 5 ? 'text-orange-500' : 'text-amber-500'}`}>
                                retraite dans {a.anneesAvantRetraite} an{a.anneesAvantRetraite > 1 ? 's' : ''}
                              </div>
                              <div className={`text-sm font-black ${darkMode ? 'text-white' : 'text-slate-700'}`}>{a.provision.toLocaleString()} €</div>
                            </div>
                          </div>
                          <div className={`text-[10px] mt-1 flex gap-2 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                            <span>{a.age} ans · {a.anciennete} ans anc.</span>
                            <span>base : {a.salaireBrutMensuel.toLocaleString()} €/mois{a.segurInclus ? ' (Ségur inclus)' : ''}</span>
                          </div>
                        </div>
                      ))}
                      {ifc.agents.length > 4 && <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>+{ifc.agents.length - 4} autre(s)…</p>}
                    </div>
                    <div className={`pt-3 border-t flex justify-between items-center ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
                      <span className={`text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Provision totale estimée</span>
                      <span className={`text-lg font-black text-rose-500`}>{ifc.totalProvision.toLocaleString()} €</span>
                    </div>
                  </>
                }
              </div>
            </div>
          );
        })()}

        {/* ── POINT MORT PAR SERVICE ──────────────────────────────────────────── */}
        {(() => {
          const MOTS_RSE = ['énergie','electricité','électricité','carburant','transport','gaz','fuel','déplacement','co2'];
          const MOTS_AGENDA_TOP = 5;

          // Point mort
          const pointsMorts = services.map(s => {
            const b = getBudgetService(s);
            const stats = calculerStatsFormation(s);
            const effectifActuel = stats.effectifActuel || s.unites || 0;
            const recetteParEtudiant = effectifActuel > 0 ? b.recettes / effectifActuel : 0;
            const pointMort = recetteParEtudiant > 0 ? Math.ceil(b.total / recetteParEtudiant) : null;
            return { nom: s.nom, total: b.total, recettes: b.recettes, effectifActuel, recetteParEtudiant, pointMort };
          }).filter(pm => pm.pointMort !== null && pm.effectifActuel > 0);

          // RSE : cumul par entité toutes exploitations
          const toutesExploitations = [
            ...(direction.chargesSiege || []),
            ...(poleSupport?.exploitation || []),
            ...services.flatMap(s => s.exploitation || []),
          ];
          const rseCategs = { Énergie: 0, Carburant: 0, Transport: 0, Gaz: 0, Autres: 0 };
          toutesExploitations.forEach(ligne => {
            const nom = (ligne.nom || '').toLowerCase();
            const montantAnnuel = (ligne.montant || 0) * 12;
            if (nom.includes('énerg') || nom.includes('electr') || nom.includes('électr')) rseCategs.Énergie += montantAnnuel;
            else if (nom.includes('carburant') || nom.includes('fuel')) rseCategs.Carburant += montantAnnuel;
            else if (nom.includes('transport') || nom.includes('déplacement') || nom.includes('deplacement')) rseCategs.Transport += montantAnnuel;
            else if (nom.includes('gaz')) rseCategs.Gaz += montantAnnuel;
            else if (MOTS_RSE.some(m => nom.includes(m))) rseCategs.Autres += montantAnnuel;
          });
          const totalRSE = Object.values(rseCategs).reduce((a, b) => a + b, 0);
          const rseData = Object.entries(rseCategs).filter(([, v]) => v > 0).map(([k, v]) => ({ name: k, montant: v }));

          // Agenda : top charges
          const agendaItems = toutesExploitations
            .map(l => ({ nom: l.nom || '—', montant: (l.montant || 0) * 12 }))
            .filter(l => l.montant > 0)
            .sort((a, b) => b.montant - a.montant)
            .slice(0, MOTS_AGENDA_TOP);

          return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

              {/* Point mort par service */}
              <div className={`rounded-3xl shadow-lg border-2 p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
                <h2 className={`text-lg font-black mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                  <Target size={20} className="text-rose-500" /> Seuil de rentabilité
                </h2>
                {pointsMorts.length === 0
                  ? <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Aucun service avec effectif et recettes définis.</p>
                  : pointsMorts.map(pm => {
                    const pct = pm.pointMort > 0 ? Math.min(100, Math.round(pm.effectifActuel / pm.pointMort * 100)) : 0;
                    const ok = pm.effectifActuel >= pm.pointMort;
                    return (
                      <div key={pm.nom} className="mb-4 last:mb-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <span className={`text-xs font-bold truncate max-w-[55%] ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>{pm.nom}</span>
                          <span className={`text-xs font-black ${ok ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {pm.effectifActuel} / {pm.pointMort} étud.
                          </span>
                        </div>
                        <div className={`h-2.5 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-slate-100'}`}>
                          <div className={`h-full rounded-full transition-all ${ok ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${pct}%` }} />
                        </div>
                        <div className={`mt-0.5 text-[10px] ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                          Seuil : {pm.pointMort} étudiants · {ok ? '✓ équilibré' : `−${pm.pointMort - pm.effectifActuel} manquant${pm.pointMort - pm.effectifActuel > 1 ? 's' : ''}`}
                        </div>
                      </div>
                    );
                  })
                }
              </div>

              {/* Dashboard RSE */}
              <div className={`rounded-3xl shadow-lg border-2 p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
                <h2 className={`text-lg font-black mb-1 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                  <Leaf size={20} className="text-emerald-500" /> Budget RSE
                </h2>
                <p className={`text-xs mb-4 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Dépenses énergie / transport / carburant</p>
                {totalRSE === 0
                  ? <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Aucune ligne de type RSE détectée. Nommez vos lignes exploitation : "Énergie", "Carburant", "Transport"…</p>
                  : <>
                    <div className={`text-2xl font-black mb-3 ${darkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>{Math.round(totalRSE).toLocaleString()} €/an</div>
                    <div className="space-y-2">
                      {rseData.map(d => (
                        <div key={d.name}>
                          <div className="flex justify-between text-xs mb-0.5">
                            <span className={darkMode ? 'text-gray-300' : 'text-slate-600'}>{d.name}</span>
                            <span className={`font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>{Math.round(d.montant).toLocaleString()} €</span>
                          </div>
                          <div className={`h-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-slate-100'}`}>
                            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${Math.round(d.montant / totalRSE * 100)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                }
              </div>

              {/* Notification Agenda */}
              <div className={`rounded-3xl shadow-lg border-2 p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
                <h2 className={`text-lg font-black mb-1 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                  <Bell size={20} className="text-amber-500" /> Top décaissements
                </h2>
                <p className={`text-xs mb-4 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>5 postes d'exploitation les plus lourds</p>
                {agendaItems.length === 0
                  ? <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Aucune charge d'exploitation saisie.</p>
                  : <ol className="space-y-2">
                    {agendaItems.map((item, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                          i === 0 ? 'bg-amber-500 text-white' : i === 1 ? 'bg-amber-400/80 text-white' : darkMode ? 'bg-gray-700 text-gray-400' : 'bg-slate-100 text-slate-500'
                        }`}>{i + 1}</span>
                        <span className={`flex-1 text-sm truncate ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>{item.nom}</span>
                        <span className={`text-sm font-black flex-shrink-0 ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>{Math.round(item.montant).toLocaleString()} €</span>
                      </li>
                    ))}
                  </ol>
                }
              </div>
            </div>
          );
        })()}

        {/* GRAPHIQUES */}
        <div id="graphiques" className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Graphique évolution 3 ans */}
          <div className={`rounded-3xl shadow-lg border-2 p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
            <h2 className={`text-xl font-black mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              <BarChart3 size={24} className="text-teal-500" /> Évolution Budget sur 3 ans
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={summary3Ans.map(s => ({
                name: `Année ${s.annee}`,
                Budget: Math.round(s.total),
                Siège: Math.round(s.budgetDirection),
                Amortissements: Math.round(s.amortissements)
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e2e8f0'} />
                <XAxis dataKey="name" stroke={darkMode ? '#9ca3af' : '#64748b'} />
                <YAxis stroke={darkMode ? '#9ca3af' : '#64748b'} tickFormatter={(v) => `${Math.round(v/1000)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: darkMode ? '#1f2937' : '#fff', border: 'none', borderRadius: '12px' }}
                  formatter={(value) => `${value.toLocaleString()} €`}
                />
                <Legend />
                <Bar dataKey="Budget" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Siège" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Amortissements" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Répartition par service */}
          <div className={`rounded-3xl shadow-lg border-2 p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
            <h2 className={`text-xl font-black mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              <Users size={24} className="text-purple-500" /> Répartition par service (Année 1)
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Siège', value: Math.round(summary3Ans[0].budgetDirection) },
                    ...summary3Ans[0].detailsServices.map(s => ({ name: s.nom, value: Math.round(s.budget) }))
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {['#14b8a6', '#8b5cf6', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'].map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value.toLocaleString()} €`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── PROJECTION TRÉSORERIE 36 MOIS ── */}
        {projection36.length === 36 && (() => {
          const alertesMois = projection36.filter(m => m.soldeCumule < 0).map(m => m.moisAbsolu);
          const minCumul = Math.min(...projection36.map(m => m.soldeCumule));
          const maxCumul = Math.max(...projection36.map(m => m.soldeCumule));
          const ANNEE_COLORS = ['#14b8a6', '#8b5cf6', '#f59e0b'];
          return (
            <div id="projection-36" className={`rounded-3xl shadow-lg border-2 p-6 mb-8 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center justify-between mb-5">
                <h2 className={`text-xl font-black flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                  <Clock size={24} className="text-indigo-500" /> Projection trésorerie — 36 mois
                </h2>
                <div className="flex gap-3 text-xs font-bold">
                  {[2026, 2027, 2028].map((y, i) => (
                    <span key={y} className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full inline-block" style={{ background: ANNEE_COLORS[i] }} />
                      <span className={darkMode ? 'text-gray-300' : 'text-slate-600'}>{y}</span>
                    </span>
                  ))}
                </div>
              </div>

              {alertesMois.length > 0 && (
                <div className={`flex items-center gap-2 text-xs mb-4 px-3 py-2 rounded-xl ${darkMode ? 'bg-red-900/30 border border-red-700 text-red-300' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                  <AlertTriangle size={14} />
                  <span><strong>{alertesMois.length} mois</strong> en solde cumulé négatif — mois {alertesMois.map(m => m).join(', ')}</span>
                </div>
              )}

              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={projection36} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <defs>
                    <linearGradient id="gradEncaiss" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradDecaiss" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradCumul" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e2e8f0'} />
                  <XAxis
                    dataKey="moisAbsolu"
                    stroke={darkMode ? '#9ca3af' : '#64748b'}
                    tickFormatter={(v) => {
                      const m = projection36[v - 1];
                      if (!m) return '';
                      return m.moisAnnee === 1 ? String(m.annee) : (m.moisAnnee === 7 ? m.nomMois : '');
                    }}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis stroke={darkMode ? '#9ca3af' : '#64748b'} tickFormatter={(v) => `${Math.round(v/1000)}k`} tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: darkMode ? '#1f2937' : '#fff', border: 'none', borderRadius: '12px', fontSize: 12 }}
                    formatter={(value, name) => [`${value.toLocaleString()} €`, name]}
                    labelFormatter={(v) => {
                      const m = projection36[v - 1];
                      return m ? `${m.nomMois} ${m.annee}` : '';
                    }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="encaissements" name="Encaissements" stroke="#14b8a6" fill="url(#gradEncaiss)" strokeWidth={1.5} dot={false} />
                  <Area type="monotone" dataKey="decaissements" name="Décaissements" stroke="#ef4444" fill="url(#gradDecaiss)" strokeWidth={1.5} dot={false} />
                  <Area type="monotone" dataKey="soldeCumule"   name="Solde cumulé" stroke="#6366f1" fill="url(#gradCumul)"   strokeWidth={2}   dot={false} />
                </AreaChart>
              </ResponsiveContainer>

              {/* KPIs résumé par année */}
              <div className="grid grid-cols-3 gap-4 mt-5">
                {[0, 1, 2].map(yIdx => {
                  const annee = projection36.filter(m => m.annee === 2026 + yIdx);
                  const totalEnc = annee.reduce((s, m) => s + m.encaissements, 0);
                  const totalDec = annee.reduce((s, m) => s + m.decaissements, 0);
                  const solde = totalEnc - totalDec;
                  return (
                    <div key={yIdx} className={`rounded-2xl p-4 border ${darkMode ? 'bg-gray-700/60 border-gray-600' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: ANNEE_COLORS[yIdx] }} />
                        <span className={`text-xs font-black uppercase ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{2026 + yIdx}</span>
                      </div>
                      <div className={`text-sm font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>{Math.round(totalEnc).toLocaleString()} €</div>
                      <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>encaissements</div>
                      <div className={`text-sm font-black mt-1 ${solde >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{solde >= 0 ? '+' : ''}{Math.round(solde).toLocaleString()} €</div>
                      <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>solde annuel</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* ── ROLLING FORECAST ── */}
        {rollingForecastData.length === 12 && (() => {
          const moisCourant = rollingForecast?.moisCourant ?? 0;
          const atterrissageRecettes = rollingForecastData.reduce((s, m) => s + m.recettesUsed, 0);
          const atterrissageCharges  = rollingForecastData.reduce((s, m) => s + m.chargesUsed, 0);
          const atterrissageSolde    = atterrissageRecettes - atterrissageCharges;
          const MOIS_OPTIONS = ['Désactivé','Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
          return (
            <div className={`rounded-3xl shadow-lg border-2 p-6 mb-8 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <h2 className={`text-xl font-black flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                  <RefreshCw size={22} className="text-sky-500" /> Rolling Forecast — Atterrissage {new Date().getFullYear()}
                </h2>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Mois courant :</span>
                    <select
                      value={moisCourant}
                      onChange={e => setRollingForecast && setRollingForecast(rf => ({ ...rf, moisCourant: parseInt(e.target.value) }))}
                      className={`text-xs font-bold rounded-lg px-2 py-1 border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-slate-200 text-slate-700'}`}
                    >
                      {MOIS_OPTIONS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                    </select>
                  </div>
                  {moisCourant > 0 && (
                    <button onClick={() => setShowRollingEditor(v => !v)} className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${darkMode ? 'bg-sky-900/40 text-sky-300 hover:bg-sky-800/50' : 'bg-sky-50 text-sky-700 hover:bg-sky-100'}`}>
                      <Edit3 size={13} /> Saisir réalisés
                    </button>
                  )}
                </div>
              </div>

              {moisCourant === 0 && (
                <p className={`text-sm text-center py-6 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                  Sélectionnez le mois courant pour activer le suivi des réalisés et calculer l'atterrissage prévisionnel.
                </p>
              )}

              {moisCourant > 0 && (
                <>
                  {/* KPIs atterrissage */}
                  <div className="grid grid-cols-3 gap-4 mb-5">
                    {[
                      { label: 'Recettes atterrissage', value: atterrissageRecettes, color: 'text-emerald-500' },
                      { label: 'Charges atterrissage',  value: atterrissageCharges,  color: 'text-red-500' },
                      { label: 'Solde atterrissage',    value: atterrissageSolde,    color: atterrissageSolde >= 0 ? 'text-emerald-600' : 'text-red-600' },
                    ].map(kpi => (
                      <div key={kpi.label} className={`rounded-2xl p-4 text-center ${darkMode ? 'bg-gray-700/60' : 'bg-slate-50'}`}>
                        <div className={`text-xs font-semibold mb-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{kpi.label}</div>
                        <div className={`text-xl font-black ${kpi.color}`}>{(atterrissageSolde === kpi.value && kpi.value < 0 ? '−' : '')}{Math.abs(Math.round(kpi.value)).toLocaleString()} €</div>
                      </div>
                    ))}
                  </div>

                  {/* Éditeur réalisés */}
                  {showRollingEditor && (
                    <div className={`rounded-2xl p-4 mb-5 border ${darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-sky-50/50 border-sky-200'}`}>
                      <h3 className={`text-sm font-black mb-3 ${darkMode ? 'text-sky-300' : 'text-sky-700'}`}>Saisie des réalisés (mois {1}–{moisCourant})</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className={darkMode ? 'text-gray-400' : 'text-slate-500'}>
                              <th className="text-left py-1 pr-3 font-semibold">Mois</th>
                              <th className="text-right py-1 px-2 font-semibold">Recettes réelles (€)</th>
                              <th className="text-right py-1 px-2 font-semibold">Charges réelles (€)</th>
                              <th className="text-right py-1 px-2 font-semibold">Solde</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rollingForecastData.slice(0, moisCourant).map((m, i) => {
                              const rf = rollingForecast?.mois?.[i] || { recettes: 0, charges: 0 };
                              return (
                                <tr key={i} className={`border-t ${darkMode ? 'border-gray-600' : 'border-slate-200'}`}>
                                  <td className={`py-1.5 pr-3 font-bold ${darkMode ? 'text-white' : 'text-slate-700'}`}>{m.mois}</td>
                                  <td className="py-1.5 px-2">
                                    <input
                                      type="number"
                                      value={rf.recettes}
                                      onChange={e => {
                                        if (!setRollingForecast) return;
                                        setRollingForecast(prev => {
                                          const mois = [...(prev.mois || [])];
                                          mois[i] = { ...(mois[i] || {}), recettes: parseFloat(e.target.value) || 0 };
                                          return { ...prev, mois };
                                        });
                                      }}
                                      className={`w-28 text-right rounded px-2 py-0.5 text-xs ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'bg-white border-slate-300'} border`}
                                    />
                                  </td>
                                  <td className="py-1.5 px-2">
                                    <input
                                      type="number"
                                      value={rf.charges}
                                      onChange={e => {
                                        if (!setRollingForecast) return;
                                        setRollingForecast(prev => {
                                          const mois = [...(prev.mois || [])];
                                          mois[i] = { ...(mois[i] || {}), charges: parseFloat(e.target.value) || 0 };
                                          return { ...prev, mois };
                                        });
                                      }}
                                      className={`w-28 text-right rounded px-2 py-0.5 text-xs ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'bg-white border-slate-300'} border`}
                                    />
                                  </td>
                                  <td className={`py-1.5 px-2 text-right font-bold ${rf.recettes - rf.charges >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {(rf.recettes - rf.charges >= 0 ? '' : '−')}{Math.abs(Math.round(rf.recettes - rf.charges)).toLocaleString()} €
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Mini-tableau mensuel */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className={darkMode ? 'text-gray-400' : 'text-slate-400'}>
                          <th className="text-left py-1 pr-2 font-semibold">Mois</th>
                          <th className="text-right py-1 px-1 font-semibold">Source</th>
                          <th className="text-right py-1 px-1 font-semibold">Recettes</th>
                          <th className="text-right py-1 px-1 font-semibold">Charges</th>
                          <th className="text-right py-1 px-1 font-semibold">Solde mois</th>
                          <th className="text-right py-1 px-1 font-semibold">Cumul</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rollingForecastData.map((m, i) => (
                          <tr key={i} className={`border-t ${darkMode ? 'border-gray-700' : 'border-slate-100'} ${m.estReel ? (darkMode ? 'bg-sky-900/10' : 'bg-sky-50/40') : ''}`}>
                            <td className={`py-1 pr-2 font-bold ${darkMode ? 'text-white' : 'text-slate-700'}`}>{m.mois}</td>
                            <td className="py-1 px-1 text-right">
                              {m.estReel
                                ? <span className="inline-flex items-center gap-1 text-sky-500 font-bold"><CheckCircle size={10}/> Réel</span>
                                : <span className={`${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Prév.</span>}
                            </td>
                            <td className={`py-1 px-1 text-right ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>{Math.round(m.recettesUsed).toLocaleString()}</td>
                            <td className={`py-1 px-1 text-right ${darkMode ? 'text-red-400' : 'text-red-600'}`}>{Math.round(m.chargesUsed).toLocaleString()}</td>
                            <td className={`py-1 px-1 text-right font-semibold ${m.solde >= 0 ? (darkMode ? 'text-emerald-400' : 'text-emerald-600') : (darkMode ? 'text-red-400' : 'text-red-600')}`}>
                              {m.solde >= 0 ? '' : '−'}{Math.abs(Math.round(m.solde)).toLocaleString()}
                            </td>
                            <td className={`py-1 px-1 text-right font-bold ${m.soldeCumule >= 0 ? (darkMode ? 'text-white' : 'text-slate-700') : 'text-red-500'}`}>
                              {m.soldeCumule >= 0 ? '' : '−'}{Math.abs(Math.round(m.soldeCumule)).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          );
        })()}

        {/* ── ANALYSE DE SCÉNARIOS ── */}
        <div id="scenarios" className={`rounded-3xl shadow-lg border-2 p-6 mb-8 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
          <h2 className={`text-xl font-black mb-5 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
            <TrendingUp size={24} className="text-violet-500" /> Analyse de scénarios — Projection an 3
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Pessimiste', augmCharges: 4, deltaRec: -5,  icon: <TrendingDown size={18}/>, bg: darkMode ? 'bg-red-900/20 border-red-700'     : 'bg-red-50 border-red-200',    hdr: darkMode ? 'bg-red-900/40 text-red-300'    : 'bg-red-100 text-red-700',    acc: 'text-red-500'     },
              { label: 'Réaliste',   augmCharges: globalParams.augmentationAnnuelle, deltaRec: 0, icon: <TrendingUp size={18}/>, bg: darkMode ? 'bg-teal-900/20 border-teal-700' : 'bg-teal-50 border-teal-200', hdr: darkMode ? 'bg-teal-900/40 text-teal-300' : 'bg-teal-100 text-teal-700', acc: 'text-teal-500' },
              { label: 'Optimiste',  augmCharges: 2, deltaRec: +5,  icon: <TrendingUp size={18}/>,  bg: darkMode ? 'bg-green-900/20 border-green-700'  : 'bg-green-50 border-green-200', hdr: darkMode ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-700', acc: 'text-green-500' },
            ].map((sc, si) => {
              const factCharges3 = Math.pow(1 + sc.augmCharges / 100, 3);
              const factRec3     = Math.pow(1 + sc.deltaRec / 100, 3);
              const charges3 = Math.round(totalCharges * factCharges3);
              const recettes3 = Math.round(totalRecettes * factRec3);
              const solde3 = recettes3 - charges3;
              const couv3 = charges3 > 0 ? (recettes3 / charges3 * 100).toFixed(1) : '—';
              const data = [1,2,3].map(n => ({
                an: `An ${n}`,
                Charges: Math.round(totalCharges * Math.pow(1 + sc.augmCharges/100, n)),
                Recettes: Math.round(totalRecettes * Math.pow(1 + sc.deltaRec/100, n)),
              }));
              return (
                <div key={si} className={`rounded-2xl border-2 overflow-hidden ${sc.bg}`}>
                  <div className={`px-4 py-3 flex items-center gap-2 font-black text-sm ${sc.hdr}`}>
                    {sc.icon} {sc.label}
                    <span className="ml-auto font-normal text-xs">charges +{sc.augmCharges}%/an · recettes {sc.deltaRec >= 0 ? '+' : ''}{sc.deltaRec}%/an</span>
                  </div>
                  <div className="p-4">
                    <ResponsiveContainer width="100%" height={120}>
                      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                        <defs>
                          <linearGradient id={`gc${si}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
                          <linearGradient id={`gr${si}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/><stop offset="95%" stopColor="#22c55e" stopOpacity={0}/></linearGradient>
                        </defs>
                        <XAxis dataKey="an" tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#64748b' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1f2937' : '#fff', border: 'none', borderRadius: '8px', fontSize: 11 }} formatter={v => `${v.toLocaleString()} €`} />
                        <Area type="monotone" dataKey="Charges" stroke="#ef4444" fill={`url(#gc${si})`} strokeWidth={2} dot={false} />
                        <Area type="monotone" dataKey="Recettes" stroke="#22c55e" fill={`url(#gr${si})`} strokeWidth={2} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                    <div className={`mt-3 grid grid-cols-2 gap-2 text-xs ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>
                      <div className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white'}`}><div className="text-gray-400">Charges an 3</div><div className="font-black">{charges3.toLocaleString()} €</div></div>
                      <div className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white'}`}><div className="text-gray-400">Recettes an 3</div><div className="font-black">{recettes3.toLocaleString()} €</div></div>
                      <div className={`p-2 rounded-lg col-span-2 ${solde3 >= 0 ? (darkMode ? 'bg-emerald-900/30' : 'bg-emerald-50') : (darkMode ? 'bg-red-900/30' : 'bg-red-50')}`}>
                        <div className="flex justify-between items-center">
                          <span className={solde3 >= 0 ? 'text-emerald-500' : 'text-red-500'}>Solde an 3</span>
                          <span className={`font-black ${solde3 >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{solde3 >= 0 ? '+' : ''}{solde3.toLocaleString()} €</span>
                        </div>
                        <div className={`text-right ${darkMode ? 'text-gray-400' : 'text-slate-400'}`}>Couverture : {couv3}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Scénario personnalisé What-if ── */}
          {(() => {
            const [wcDeltaRec, setWcDeltaRec] = React.useState(0);
            const [wcDeltaCharges, setWcDeltaCharges] = React.useState(0);
            const [wcDeltaMS, setWcDeltaMS] = React.useState(0);
            const [wcDeltaSubv, setWcDeltaSubv] = React.useState(0);
            const [wcNom, setWcNom] = React.useState('Mon scénario');
            const chargesHorsMS = totalCharges - masseSalarialeTotal;
            const data3 = [1,2,3].map(n => {
              const ms = Math.round(masseSalarialeTotal * Math.pow(1 + wcDeltaMS/100, n));
              const charges = Math.round(chargesHorsMS * Math.pow(1 + wcDeltaCharges/100, n)) + ms;
              const recettes = Math.round((totalRecettes - totalRecettes * wcDeltaSubv/100) * Math.pow(1 + wcDeltaRec/100, n) + totalRecettes * wcDeltaSubv/100);
              return { an: `An ${n}`, Charges: charges, Recettes: recettes };
            });
            const solde3 = data3[2].Recettes - data3[2].Charges;
            const couv3  = data3[2].Charges > 0 ? (data3[2].Recettes / data3[2].Charges * 100).toFixed(1) : '—';
            return (
              <div className={`mt-4 rounded-2xl border-2 overflow-hidden ${darkMode ? 'bg-violet-900/10 border-violet-700' : 'bg-violet-50 border-violet-200'}`}>
                <div className={`px-4 py-3 flex items-center gap-2 flex-wrap ${darkMode ? 'bg-violet-900/30 text-violet-300' : 'bg-violet-100 text-violet-700'}`}>
                  <Target size={18} />
                  <input value={wcNom} onChange={e => setWcNom(e.target.value)} className={`font-black text-sm bg-transparent border-b border-current outline-none w-36`} />
                  <span className="ml-auto text-xs font-normal opacity-70">Scénario personnalisé — What-if</span>
                </div>
                <div className="p-4 grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    {[
                      { label: 'Δ Recettes (%/an)', val: wcDeltaRec,     set: setWcDeltaRec,     color: 'text-emerald-500' },
                      { label: 'Δ Charges exploit. (%/an)', val: wcDeltaCharges, set: setWcDeltaCharges, color: 'text-orange-500' },
                      { label: 'Δ Masse salariale (%/an)', val: wcDeltaMS,    set: setWcDeltaMS,    color: 'text-red-500' },
                      { label: 'Subvention perdue (%)', val: wcDeltaSubv,   set: setWcDeltaSubv,   color: 'text-amber-500' },
                    ].map(p => (
                      <div key={p.label} className="flex items-center gap-2">
                        <span className={`text-xs w-44 shrink-0 ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>{p.label}</span>
                        <input type="range" min={-20} max={20} step={0.5} value={p.val} onChange={e => p.set(parseFloat(e.target.value))} className="flex-1 accent-violet-500" />
                        <span className={`text-xs font-black w-10 text-right ${p.color}`}>{p.val >= 0 ? '+' : ''}{p.val}%</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <ResponsiveContainer width="100%" height={120}>
                      <AreaChart data={data3} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                        <defs>
                          <linearGradient id="gwc" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
                          <linearGradient id="grwc" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/><stop offset="95%" stopColor="#22c55e" stopOpacity={0}/></linearGradient>
                        </defs>
                        <XAxis dataKey="an" tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#64748b' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1f2937' : '#fff', border: 'none', borderRadius: '8px', fontSize: 11 }} formatter={v => `${v.toLocaleString()} €`} />
                        <Area type="monotone" dataKey="Charges" stroke="#ef4444" fill="url(#gwc)" strokeWidth={2} dot={false} />
                        <Area type="monotone" dataKey="Recettes" stroke="#22c55e" fill="url(#grwc)" strokeWidth={2} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                    <div className={`mt-2 p-3 rounded-xl ${solde3 >= 0 ? (darkMode ? 'bg-emerald-900/30' : 'bg-emerald-50') : (darkMode ? 'bg-red-900/30' : 'bg-red-50')}`}>
                      <div className="flex justify-between items-center text-sm">
                        <span className={solde3 >= 0 ? 'text-emerald-500' : 'text-red-500'}>Solde an 3</span>
                        <span className={`font-black text-lg ${solde3 >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{solde3 >= 0 ? '+' : ''}{solde3.toLocaleString()} €</span>
                      </div>
                      <div className={`text-right text-xs ${darkMode ? 'text-gray-400' : 'text-slate-400'}`}>Couverture : {couv3}%</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

    </>
  );
}
