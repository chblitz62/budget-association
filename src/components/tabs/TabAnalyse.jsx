import React, { useState, useMemo } from 'react';
import { Plus, Trash2, HelpCircle, X, Upload, BarChart3, Calculator, RotateCcw, TrendingDown, Waves, Brain, FileText, AlertTriangle, ChevronDown, ChevronUp, Table, TrendingUp, ClipboardList, CheckCircle, Users } from 'lucide-react';
import HelpIcon from '../ui/HelpIcon';
import { validerTaux, validerEntier, validerMontant, validerMontantSigne, calculerProvisions, calculerBFR, calculerFondRoulement, calculerBudgetService, calculerSalaireAnnuel, calculerTaxeSalairesProgressif } from '../../utils/calculations';
import { FINANCIAL_HELP as H } from '../../utils/constants';
import { exportEPRD } from '../../utils/excelExport';
import { exportSyntheseNarrative } from '../../utils/pdfExport';
import { calculerRadarSante, genererRapportStrategique } from '../../utils/radarSante';
import AuditPredictifPanel from '../AuditPredictifPanel';
import CompteResultatPanel from '../CompteResultatPanel';
import BilanPrevisionnelPanel from '../BilanPrevisionnelPanel';
import ProvisionIDRPanel from '../ProvisionIDRPanel';
import TVAMultiTauxPanel from '../TVAMultiTauxPanel';
import TableauFinancementPanel from '../TableauFinancementPanel';
import ResteAEngagerPanel from '../ResteAEngagerPanel';
import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Line, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

export default function TabAnalyse({
  darkMode,
  direction,
  poleSupport,
  services,
  globalParams,
  setGlobalParams,
  donneesN1,
  setDonneesN1,
  setShowImportN1,
  simCharges,
  setSimCharges,
  getBudgetDirection,
  getBudgetPoleSupport,
  getBudgetService,
  getProvisions: getProvisionsProp,
  getBFR: getBFRProp,
  getFondRoulement: getFondRoulementProp,
  soldeGlobal,
  msETP,
  planningAbsences,
  simRegion,
  setSimRegion,
  poolRH,
  masseSalarialeTotal,
  statsFormation,
  personnelEligibleSubvention,
  balanceComptable = null,
  setShowBalanceImport = null,
  engagements = [],
  setEngagements = null,
}) {
  const getProvisions = getProvisionsProp || (() => calculerProvisions(direction, services, globalParams, poleSupport));
  const getBFR = getBFRProp || (() => calculerBFR(direction, services, globalParams, poleSupport));
  const getFondRoulement = getFondRoulementProp
    ? () => getFondRoulementProp(soldeGlobal ?? null)
    : () => calculerFondRoulement(direction, services, globalParams, poleSupport, soldeGlobal ?? null);

  const [activeKpi, setActiveKpi] = useState(null);
  const [showRapport, setShowRapport] = useState(false);

  // ── Radar de Santé — calculs memoïsés via radarSante.js (2.6) ──────────────
  const radarSante = useMemo(() =>
    calculerRadarSante({ services, getBudgetDirection, getBudgetPoleSupport, getBudgetService, masseSalarialeTotal }),
    [services, getBudgetDirection, getBudgetPoleSupport, getBudgetService, masseSalarialeTotal]);

  // ── Rapport stratégique — calculé seulement quand showRapport=true (2.6) ───
  const rapport = useMemo(() => {
    if (!showRapport) return null;
    return genererRapportStrategique({ radarSante, statsFormation, masseSalarialeTotal });
  }, [showRapport, radarSante, statsFormation, masseSalarialeTotal]);

  // ── kpiGlobaux dérivé pour AuditPredictifPanel ─────────────────────────
  const kpiGlobauxDerives = useMemo(() => {
    const recettesDir = (getBudgetDirection?.() || {}).recettes || 0;
    const recettesPS  = (getBudgetPoleSupport?.() || {}).recettes || 0;
    const totalDir = (getBudgetDirection?.() || {}).total || 0;
    const totalPS  = (getBudgetPoleSupport?.() || {}).total || 0;
    let totalRecettes = recettesDir + recettesPS;
    let totalCharges  = totalDir + totalPS;
    services.forEach(s => {
      const b = getBudgetService?.(s) || {};
      totalRecettes += b.recettes || 0;
      totalCharges  += b.total    || 0;
    });
    return { totalRecettes, totalCharges, soldeGlobal: totalRecettes - totalCharges };
  }, [services, getBudgetService, getBudgetDirection, getBudgetPoleSupport]);

  return (
    <>
      {/* ═══ AUDIT PRÉDICTIF — DÉTECTION D'ANOMALIES ═══ */}
      <AuditPredictifPanel
        darkMode={darkMode}
        donneesN1={donneesN1}
        kpiGlobaux={kpiGlobauxDerives}
        services={services}
        direction={direction}
        poleSupport={poleSupport}
        globalParams={globalParams}
        masseSalarialeTotal={masseSalarialeTotal}
        getBudgetService={getBudgetService}
        poolRH={poolRH}
      />

      {/* ═══ COMPTE DE RÉSULTAT FORMEL — PCG ASSOCIATIF ═══ */}
      <CompteResultatPanel
        darkMode={darkMode}
        direction={direction}
        services={services}
        poleSupport={poleSupport}
        globalParams={globalParams}
      />

      {/* ═══ BILAN PRÉVISIONNEL ACTIF/PASSIF ═══ */}
      <BilanPrevisionnelPanel
        darkMode={darkMode}
        direction={direction}
        services={services}
        poleSupport={poleSupport}
        globalParams={globalParams}
      />

      {/* ═══ PROVISION IDR ACTUARIELLE (UCP / IAS 19) ═══ */}
      <ProvisionIDRPanel
        darkMode={darkMode}
        direction={direction}
        services={services}
        poleSupport={poleSupport}
        globalParams={globalParams}
        setGlobalParams={setGlobalParams}
      />

      {/* ═══ TVA MULTI-TAUX DIFFÉRENCIÉE (CGI 261 4-4°) ═══ */}
      <TVAMultiTauxPanel
        darkMode={darkMode}
        direction={direction}
        services={services}
        poleSupport={poleSupport}
        globalParams={globalParams}
      />

      {/* ═══ TABLEAU DE FINANCEMENT (PCG 532-7) ═══ */}
      <TableauFinancementPanel
        darkMode={darkMode}
        direction={direction}
        services={services}
        poleSupport={poleSupport}
        globalParams={globalParams}
      />

      {/* ═══ RESTE À ENGAGER (RAE) — Cycle d'achat ═══ */}
      <ResteAEngagerPanel
        darkMode={darkMode}
        direction={direction}
        services={services}
        poleSupport={poleSupport}
        engagements={engagements}
        globalParams={globalParams}
      />

      {/* ═══ SYNTHÈSE CONSOLIDÉE CROSS-MODULES ═══ */}
      {(masseSalarialeTotal > 0 || statsFormation?.effectifTotal > 0) && (
        <div className={`rounded-2xl border p-5 mb-6 ${darkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-gradient-to-r from-slate-50 to-indigo-50 border-indigo-100'}`}>
          <div className="flex items-center gap-2 mb-4">
            <div className={`p-1.5 rounded-lg ${darkMode ? 'bg-indigo-900/40' : 'bg-indigo-100'}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={darkMode ? '#818cf8' : '#4f46e5'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h18v18H3z"/><path d="M3 9h18M3 15h18M9 3v18"/></svg>
            </div>
            <span className={`text-sm font-black uppercase tracking-wide ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>Synthèse consolidée — Sources croisées</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {masseSalarialeTotal > 0 && (
              <div className={`rounded-xl p-3 ${darkMode ? 'bg-zinc-700' : 'bg-white border border-indigo-100'}`}>
                <div className={`text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Masse salariale totale</div>
                <div className={`text-lg font-black tabular-nums ${darkMode ? 'text-white' : 'text-slate-800'}`}>{Math.round(masseSalarialeTotal / 1000)}k €</div>
                <div className={`text-[10px] mt-0.5 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>RH + Pool RH</div>
              </div>
            )}
            {statsFormation?.effectifTotal > 0 && (
              <div className={`rounded-xl p-3 ${darkMode ? 'bg-zinc-700' : 'bg-white border border-indigo-100'}`}>
                <div className={`text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Effectifs formation</div>
                <div className={`text-lg font-black tabular-nums ${darkMode ? 'text-white' : 'text-slate-800'}`}>{statsFormation.effectifTotal}</div>
                <div className={`text-[10px] mt-0.5 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>étudiants actifs</div>
              </div>
            )}
            {masseSalarialeTotal > 0 && statsFormation?.effectifTotal > 0 && (
              <div className={`rounded-xl p-3 ${darkMode ? 'bg-zinc-700' : 'bg-white border border-indigo-100'}`}>
                <div className={`text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>MS / étudiant</div>
                <div className={`text-lg font-black tabular-nums ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>{Math.round(masseSalarialeTotal / statsFormation.effectifTotal).toLocaleString()} €</div>
                <div className={`text-[10px] mt-0.5 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>coût RH unitaire</div>
              </div>
            )}
            {personnelEligibleSubvention?.length > 0 && (
              <div className={`rounded-xl p-3 ${darkMode ? 'bg-zinc-700' : 'bg-white border border-violet-100'}`}>
                <div className={`text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Personnel éligible subv.</div>
                <div className={`text-lg font-black tabular-nums ${darkMode ? 'text-violet-300' : 'text-violet-700'}`}>{personnelEligibleSubvention.length} agent{personnelEligibleSubvention.length > 1 ? 's' : ''}</div>
                <div className={`text-[10px] mt-0.5 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>{Math.round(personnelEligibleSubvention.reduce((s, p) => s + p.coutSubventionnable, 0) / 1000)}k € → DAF</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ RADAR DE SANTÉ ═══ */}
      {(() => {
        const { radarData, scoreGlobal, scoreColor, totalRecettes } = radarSante;
        return (
          <div className={`rounded-3xl shadow-lg border-2 p-6 mb-8 print-avoid-break ${darkMode ? 'bg-gray-800 border-violet-900' : 'bg-gradient-to-br from-violet-50 to-fuchsia-50 border-violet-200'}`}>
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-3">
                <Brain className={darkMode ? 'text-violet-400' : 'text-violet-600'} size={24} />
                <div>
                  <h2 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>Radar de Santé</h2>
                  <span className={`text-xs font-bold ${darkMode ? 'text-violet-400' : 'text-violet-600'}`}>5 KPIs stratégiques · Cliquez un axe pour le détail</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`text-center px-4 py-2 rounded-xl ${darkMode ? 'bg-zinc-700' : 'bg-white border border-violet-100'}`}>
                  <div className={`text-[10px] font-bold uppercase tracking-wide ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Score global</div>
                  <div className={`text-2xl font-black ${scoreColor}`}>{scoreGlobal}<span className="text-sm">/100</span></div>
                </div>
                <button
                  onClick={() => setShowRapport(v => !v)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs transition-all ${
                    showRapport
                      ? 'bg-violet-500 text-white shadow-md'
                      : darkMode ? 'bg-zinc-700 text-violet-300 hover:bg-violet-900/40' : 'bg-violet-100 text-violet-700 hover:bg-violet-200'
                  }`}
                >
                  <FileText size={13} />
                  {showRapport ? 'Fermer rapport' : 'Rapport stratégique'}
                </button>
                {showRapport && rapport && (
                  <button
                    onClick={() => {
                      const { totalRecettes: tr } = radarSante;
                      const tc = tr - (soldeGlobal || 0);
                      exportSyntheseNarrative({ rapport, radarSante, kpiGlobaux: { totalRecettes: tr, totalCharges: tc, soldeGlobal: soldeGlobal || 0, tauxCouverture: tc > 0 ? tr / tc * 100 : 0, totalETP: 0 } });
                    }}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs transition-all ${darkMode ? 'bg-zinc-700 text-orange-300 hover:bg-orange-900/30' : 'bg-orange-50 text-orange-700 hover:bg-orange-100'}`}
                  >
                    <FileText size={13} /> Exporter PDF
                  </button>
                )}
              </div>
            </div>

            {/* Radar + Légende */}
            <div className="flex flex-wrap gap-6 items-start">
              <div className="flex-1 min-w-[260px]">
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                    <PolarGrid stroke={darkMode ? '#374151' : '#e2e8f0'} />
                    <PolarAngleAxis
                      dataKey="kpi"
                      tick={({ payload, x, y, cx, cy, ...rest }) => {
                        const d = radarData.find(r => r.kpi === payload.value);
                        const isActive = activeKpi === payload.value;
                        return (
                          <text
                            x={x} y={y}
                            textAnchor={x > cx ? 'start' : x < cx ? 'end' : 'middle'}
                            dominantBaseline="central"
                            fontSize={11}
                            fontWeight={isActive ? 800 : 600}
                            fill={isActive ? (darkMode ? '#c084fc' : '#7c3aed') : (darkMode ? '#9ca3af' : '#475569')}
                            style={{ cursor: 'pointer' }}
                            onClick={() => setActiveKpi(v => v === payload.value ? null : payload.value)}
                          >
                            {payload.value}
                          </text>
                        );
                      }}
                    />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                      name="Score"
                      dataKey="val"
                      stroke={darkMode ? '#a78bfa' : '#7c3aed'}
                      fill={darkMode ? '#7c3aed' : '#8b5cf6'}
                      fillOpacity={0.3}
                      strokeWidth={2}
                      dot={{ r: 4, fill: darkMode ? '#c084fc' : '#7c3aed', cursor: 'pointer' }}
                      onClick={(data) => setActiveKpi(v => v === data?.kpi ? null : data?.kpi)}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: darkMode ? '#1f2937' : '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: 12 }}
                      formatter={(v, n, p) => [`${v}/100`, p?.payload?.raw]}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* KPI liste */}
              <div className="flex-1 min-w-[200px] space-y-2">
                {radarData.map(d => (
                  <button
                    key={d.kpi}
                    onClick={() => setActiveKpi(v => v === d.kpi ? null : d.kpi)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      activeKpi === d.kpi
                        ? darkMode ? 'bg-violet-900/40 border-violet-500' : 'bg-violet-50 border-violet-300'
                        : darkMode ? 'bg-zinc-700/50 border-zinc-600 hover:bg-zinc-700' : 'bg-white border-slate-100 hover:border-violet-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-black ${darkMode ? 'text-white' : 'text-slate-700'}`}>{d.kpi}</span>
                      <span className={`text-xs font-black ${d.val >= 70 ? 'text-emerald-500' : d.val >= 40 ? 'text-amber-500' : 'text-rose-500'}`}>{d.val}/100</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-zinc-600 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${d.val >= 70 ? 'bg-emerald-400' : d.val >= 40 ? 'bg-amber-400' : 'bg-rose-400'}`}
                        style={{ width: `${d.val}%` }}
                      />
                    </div>
                    <div className={`text-[10px] mt-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{d.raw}</div>
                    {activeKpi === d.kpi && (
                      <div className={`mt-2 pt-2 border-t text-[11px] ${darkMode ? 'border-zinc-500 text-gray-300' : 'border-slate-200 text-slate-600'}`}>
                        {d.detail}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Rapport stratégique */}
            {showRapport && rapport && (
              <div className={`mt-5 pt-5 border-t ${darkMode ? 'border-zinc-700' : 'border-violet-100'}`}>
                <div className="flex items-center gap-2 mb-4">
                  <FileText size={16} className={darkMode ? 'text-violet-400' : 'text-violet-600'} />
                  <span className={`font-black text-sm ${darkMode ? 'text-white' : 'text-slate-800'}`}>Note de Synthèse Stratégique — {rapport.date}</span>
                  <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-bold ${rapport.scoreGlobal >= 70 ? 'bg-emerald-100 text-emerald-700' : rapport.scoreGlobal >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                    Score {rapport.scoreGlobal}/100
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`rounded-xl p-4 border ${darkMode ? 'bg-rose-900/20 border-rose-700/40' : 'bg-rose-50 border-rose-200'}`}>
                    <div className={`font-black text-xs mb-3 flex items-center gap-1 ${darkMode ? 'text-rose-300' : 'text-rose-700'}`}>
                      <AlertTriangle size={12} /> 1. Points de vigilance
                    </div>
                    {rapport.vigilance.length === 0
                      ? <p className={`text-[11px] ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Aucun point critique détecté.</p>
                      : rapport.vigilance.map((v, i) => <p key={i} className={`text-[11px] mb-2 ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>{v}</p>)
                    }
                  </div>
                  <div className={`rounded-xl p-4 border ${darkMode ? 'bg-emerald-900/20 border-emerald-700/40' : 'bg-emerald-50 border-emerald-200'}`}>
                    <div className={`font-black text-xs mb-3 flex items-center gap-1 ${darkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
                      2. Opportunités d'optimisation
                    </div>
                    {rapport.opportunites.map((v, i) => <p key={i} className={`text-[11px] mb-2 ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>{v}</p>)}
                  </div>
                  <div className={`rounded-xl p-4 border ${darkMode ? 'bg-blue-900/20 border-blue-700/40' : 'bg-blue-50 border-blue-200'}`}>
                    <div className={`font-black text-xs mb-3 ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>3. Prévision d'atterrissage</div>
                    <p className={`text-[11px] ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>{rapport.prevision}</p>
                    {masseSalarialeTotal > 0 && totalRecettes > 0 && (
                      <p className={`text-[11px] mt-2 ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>
                        Ratio MS/Recettes : <strong>{Math.round(masseSalarialeTotal / totalRecettes * 100)}%</strong>{' '}
                        {masseSalarialeTotal / totalRecettes > 0.75 ? '— levier prioritaire à surveiller.' : '— dans les normes.'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* ═══ POINT MORT PAR PROMOTION ═══ */}
      {services.some(s => s.promos?.length > 0) && (() => {
        const promoData = [];
        services.forEach(svc => {
          if (!svc.promos?.length) return;
          const bs = getBudgetService(svc);
          const nPersonnel = (svc.personnel || []).length;
          const chargesFixesAnnuelles = bs.total - (bs.vacataires || 0);
          const totalEtus = svc.promos.reduce((s, p) => s + (p.effectif || 0), 0);
          const totalAbandons = svc.promos.reduce((s, p) => {
            const ab = p.abandons || {};
            return s + Object.values(ab).reduce((a, v) => a + (parseInt(v) || 0), 0);
          }, 0);
          const etusActuels = Math.max(0, totalEtus - totalAbandons);

          svc.promos.forEach(promo => {
            const effectif = promo.effectif || 0;
            const chargesPromo = totalEtus > 0 ? chargesFixesAnnuelles * (effectif / totalEtus) : chargesFixesAnnuelles;
            // Recettes par étudiant (droits d'inscription + autres recettes variables)
            const recettesVarParEtu = totalEtus > 0 ? bs.recettes / totalEtus : 0;
            const chargesVarParEtu = bs.vacataires && totalEtus > 0 ? (bs.vacataires / totalEtus) : 0;
            const margeContrib = recettesVarParEtu - chargesVarParEtu;
            const pointMort = margeContrib > 0 ? Math.ceil(chargesPromo / margeContrib) : null;
            const abandonsCumul = (() => {
              const ab = promo.abandons || {};
              return Object.values(ab).reduce((a, v) => a + (parseInt(v) || 0), 0);
            })();
            const etusRestants = effectif - abandonsCumul;
            const risque = pointMort !== null && etusRestants < pointMort;

            promoData.push({
              service: svc.nom,
              promo: promo.nom || `Promo ${promo.id}`,
              effectif,
              abandonsCumul,
              etusRestants,
              pointMort,
              risque,
            });
          });
        });

        if (promoData.length === 0) return null;

        return (
          <div className={`rounded-3xl shadow-lg border-2 p-6 mb-8 print-avoid-break ${darkMode ? 'bg-gray-800 border-amber-900' : 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'}`}>
            <div className="flex items-center gap-3 mb-5">
              <AlertTriangle className={darkMode ? 'text-amber-400' : 'text-amber-600'} size={24} />
              <div>
                <h2 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>Point Mort par Promotion</h2>
                <span className={`text-xs font-bold ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>Effectif minimum pour couvrir les charges fixes · Alertes temps réel</span>
              </div>
              {promoData.some(p => p.risque) && (
                <span className="ml-auto px-3 py-1 rounded-full bg-rose-500 text-white text-xs font-black animate-pulse">
                  {promoData.filter(p => p.risque).length} RISQUE{promoData.filter(p => p.risque).length > 1 ? 'S' : ''} RENTABILITÉ
                </span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className={darkMode ? 'text-gray-400' : 'text-slate-500'}>
                    <th className="text-left py-2 px-3 font-bold">Service</th>
                    <th className="text-left py-2 px-3 font-bold">Promotion</th>
                    <th className="text-right py-2 px-3 font-bold">Effectif initial</th>
                    <th className="text-right py-2 px-3 font-bold">Abandons</th>
                    <th className="text-right py-2 px-3 font-bold">Étudiants actifs</th>
                    <th className="text-right py-2 px-3 font-bold">Point mort</th>
                    <th className="text-center py-2 px-3 font-bold">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {promoData.map((p, i) => (
                    <tr key={i} className={`border-t ${darkMode ? 'border-zinc-700' : 'border-slate-100'} ${p.risque ? (darkMode ? 'bg-rose-900/20' : 'bg-rose-50') : ''}`}>
                      <td className={`py-2.5 px-3 font-bold ${darkMode ? 'text-gray-200' : 'text-slate-700'}`}>{p.service}</td>
                      <td className={`py-2.5 px-3 ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>{p.promo}</td>
                      <td className={`py-2.5 px-3 text-right tabular-nums ${darkMode ? 'text-gray-200' : 'text-slate-700'}`}>{p.effectif}</td>
                      <td className={`py-2.5 px-3 text-right tabular-nums ${p.abandonsCumul > 0 ? 'text-rose-500 font-bold' : darkMode ? 'text-gray-400' : 'text-slate-400'}`}>
                        {p.abandonsCumul > 0 ? `−${p.abandonsCumul}` : '—'}
                      </td>
                      <td className={`py-2.5 px-3 text-right tabular-nums font-bold ${p.risque ? 'text-rose-500' : 'text-emerald-500'}`}>{p.etusRestants}</td>
                      <td className={`py-2.5 px-3 text-right tabular-nums ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>
                        {p.pointMort !== null ? p.pointMort : <span className="opacity-40">n/a</span>}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {p.risque ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black">⚠ RISQUE</span>
                        ) : p.pointMort !== null ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">OK</span>
                        ) : (
                          <span className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={`mt-3 text-[11px] ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
              Point mort = charges fixes promo ÷ marge de contribution par étudiant. Si les étudiants actifs passent sous ce seuil, le service génère un déficit.
            </div>

            {/* Graphique Break-Even — premier service avec promos */}
            {(() => {
              const svcAvecPromo = services.find(s => s.promos?.length > 0);
              if (!svcAvecPromo) return null;
              const bs = getBudgetService(svcAvecPromo);
              const chargesFixes = bs.total - (bs.vacataires || 0);
              const totalEtus = svcAvecPromo.promos.reduce((s, p) => s + (p.effectif || 0), 0);
              const recParEtu = totalEtus > 0 ? bs.recettes / totalEtus : 0;
              const chVarParEtu = totalEtus > 0 ? ((bs.vacataires || 0) / totalEtus) : 0;
              const maxEtu = Math.max(totalEtus * 1.2, 10);
              const step = Math.max(1, Math.round(maxEtu / 20));
              const chartData = [];
              for (let n = 0; n <= Math.ceil(maxEtu); n += step) {
                chartData.push({
                  n,
                  'Recettes': Math.round(n * recParEtu),
                  'Charges totales': Math.round(chargesFixes + n * chVarParEtu),
                });
              }
              const pm = promoData.find(p => p.pointMort !== null);
              return (
                <div className="mt-5">
                  <h3 className={`text-sm font-black mb-2 ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>
                    Graphique Break-Even — {svcAvecPromo.nom}
                  </h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <ComposedChart data={chartData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e2e8f0'} />
                      <XAxis dataKey="n" tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#64748b' }} label={{ value: 'Étudiants', position: 'insideRight', offset: 0, fontSize: 10, fill: darkMode ? '#9ca3af' : '#64748b' }} />
                      <YAxis tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#64748b' }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                      <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1f2937' : '#fff', border: 'none', borderRadius: '8px', fontSize: 11 }} formatter={v => `${Math.round(v).toLocaleString()} €`} />
                      {pm && <ReferenceLine x={pm.pointMort} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: `PM=${pm.pointMort}`, fill: '#f59e0b', fontSize: 10 }} />}
                      <Line type="monotone" dataKey="Recettes" stroke="#22c55e" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="Charges totales" stroke="#ef4444" strokeWidth={2} dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                  <div className={`flex gap-4 justify-center text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                    <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-emerald-500 inline-block"></span> Recettes</span>
                    <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-red-500 inline-block"></span> Charges totales</span>
                    {pm && <span className="flex items-center gap-1"><span className="w-4 h-0.5 border-t-2 border-dashed border-amber-500 inline-block"></span> Point mort ({pm.pointMort} étudiants)</span>}
                  </div>
                </div>
              );
            })()}
          </div>
        );
      })()}

      {/* ── SIMULATEUR DE RECRUTEMENT STRATÉGIQUE ── */}
      {(() => {
        const [simSalaire, setSimSalaire] = React.useState(2500);
        const [simETP, setSimETP] = React.useState(1);
        const [simTypeContrat, setSimTypeContrat] = React.useState('CDI');
        const [simSegur, setSimSegur] = React.useState(false);
        const [simDateDebut, setSimDateDebut] = React.useState('');
        const tauxCharges = (globalParams?.tauxChargesPatronales ?? 44) / 100;
        const delaiURSSAF = globalParams?.delaiPaiementURSSAF ?? 45;
        const taxeActive = globalParams?.taxeSalaires === true;
        const soldeGlobalNumeric = soldeGlobal ?? 0;

        const sal = calculerSalaireAnnuel(simSalaire, simETP, simSegur ? msETP : 0, simTypeContrat, null, simDateDebut || null);
        const coutAnnuel = sal.total;
        const brutAnnuel = sal.totalBrutVerse;
        const taxeDelta = taxeActive ? calculerTaxeSalairesProgressif(brutAnnuel) : 0;
        const bfrDelta = (sal.salaires ?? 0) * tauxCharges / 365 * delaiURSSAF;
        const impactSolde = -(coutAnnuel + taxeDelta);
        const soldeApres = soldeGlobalNumeric + impactSolde;

        return (
          <div className={`mb-8 rounded-3xl border-2 p-6 shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
            <h2 className={`text-xl font-black mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              <Users size={22} className="text-teal-500" /> Simulateur de recrutement stratégique
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Paramètres */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <label className={`text-xs font-semibold w-36 shrink-0 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Salaire brut mensuel</label>
                  <input type="number" min="1000" step="50" value={simSalaire} onChange={e => setSimSalaire(parseFloat(e.target.value)||0)}
                    className={`w-28 text-right rounded-lg px-2 py-1 text-sm font-bold border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-slate-300'}`} />
                  <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>€/mois</span>
                </div>
                <div className="flex items-center gap-3">
                  <label className={`text-xs font-semibold w-36 shrink-0 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>ETP</label>
                  <input type="number" min="0.1" max="1" step="0.1" value={simETP} onChange={e => setSimETP(parseFloat(e.target.value)||1)}
                    className={`w-20 text-right rounded-lg px-2 py-1 text-sm font-bold border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-slate-300'}`} />
                </div>
                <div className="flex items-center gap-3">
                  <label className={`text-xs font-semibold w-36 shrink-0 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Type contrat</label>
                  <select value={simTypeContrat} onChange={e => setSimTypeContrat(e.target.value)}
                    className={`rounded-lg px-2 py-1 text-xs border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-slate-300'}`}>
                    <option value="CDI">CDI</option>
                    <option value="CDD">CDD</option>
                    <option value="apprentissage">Apprentissage</option>
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <label className={`text-xs font-semibold w-36 shrink-0 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Prime Ségur</label>
                  <input type="checkbox" checked={simSegur} onChange={e => setSimSegur(e.target.checked)} className="w-4 h-4" />
                  {simSegur && <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>+{msETP} €/mois</span>}
                </div>
                <div className="flex items-center gap-3">
                  <label className={`text-xs font-semibold w-36 shrink-0 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Date de prise de poste</label>
                  <input type="month" value={simDateDebut} onChange={e => setSimDateDebut(e.target.value ? e.target.value + '-01' : '')}
                    className={`rounded-lg px-2 py-1 text-xs border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-slate-300'}`} />
                </div>
              </div>

              {/* Résultats */}
              <div className="space-y-3">
                {[
                  { label: 'Coût employeur annuel', value: coutAnnuel, color: 'text-red-500', note: simTypeContrat === 'apprentissage' ? '(exo charges apprenti)' : `(charges ${Math.round((coutAnnuel/brutAnnuel - 1)*100)}%)` },
                  { label: 'dont Ségur', value: simSegur ? msETP * 12 * simETP : null, color: darkMode ? 'text-gray-300' : 'text-slate-600', note: 'inclus dans coût ci-dessus' },
                  taxeActive ? { label: 'Taxe sur salaires', value: taxeDelta, color: 'text-orange-500', note: 'CGI art. 231' } : null,
                  { label: 'Impact BFR URSSAF', value: bfrDelta, color: 'text-amber-500', note: `+${delaiURSSAF}j` },
                  { label: 'Nouveau solde prévisionnel', value: soldeApres, color: soldeApres >= 0 ? 'text-emerald-500' : 'text-red-600', note: `(avant: ${Math.round(soldeGlobalNumeric).toLocaleString()} €)`, big: true },
                ].filter(Boolean).map((kpi, i) => kpi.value !== null && (
                  <div key={i} className={`flex justify-between items-center px-3 py-2 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-slate-50'}`}>
                    <div>
                      <div className={`text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>{kpi.label}</div>
                      {kpi.note && <div className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>{kpi.note}</div>}
                    </div>
                    <div className={`font-black ${kpi.big ? 'text-lg' : 'text-sm'} ${kpi.color}`}>
                      {kpi.value > 0 && !kpi.label.includes('solde') ? '−' : kpi.value >= 0 ? '+' : '−'}{Math.abs(Math.round(kpi.value)).toLocaleString()} €
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── INDICATEURS DE PERFORMANCE SOCIALE ── */}
      {services.length > 0 && (() => {
        const tauxMap = globalParams?.tauxDiplomationParService || {};
        const rows = services.map(svc => {
          const bs = getBudgetService(svc);
          const nEtudiants = svc.promos
            ? svc.promos.reduce((s, p) => {
                const ab = p.abandons ? Object.values(p.abandons).reduce((a, v) => a + (parseInt(v)||0), 0) : 0;
                return s + Math.max(0, (p.effectif||0) - ab);
              }, 0)
            : (svc.unites || 0);
          const coutParEtu = nEtudiants > 0 ? bs.total / nEtudiants : null;
          const taux = tauxMap[svc.id] !== undefined ? tauxMap[svc.id] : null;
          const coutParDiplome = coutParEtu !== null && taux !== null && taux > 0 ? coutParEtu / (taux / 100) : null;
          return { svc, bs, nEtudiants, coutParEtu, taux, coutParDiplome };
        });
        return (
          <div className={`mb-8 rounded-3xl border-2 p-6 shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
            <h2 className={`text-xl font-black mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              <BarChart3 size={22} className="text-pink-500" /> Indicateurs de Performance Sociale
            </h2>
            <p className={`text-xs mb-4 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
              Saisissez le taux de diplomation observé par service pour calculer le coût par diplômé — indicateur clé pour justifier la subvention publique.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className={darkMode ? 'text-gray-400' : 'text-slate-500'}>
                    <th className="text-left py-2 pr-3 font-semibold">Service</th>
                    <th className="text-right py-2 px-2 font-semibold">Charges totales</th>
                    <th className="text-right py-2 px-2 font-semibold">Étudiants actifs</th>
                    <th className="text-right py-2 px-2 font-semibold">Coût/étudiant</th>
                    <th className="text-right py-2 px-2 font-semibold">Taux diplomation</th>
                    <th className="text-right py-2 px-2 font-semibold">Coût/diplômé</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ svc, bs, nEtudiants, coutParEtu, taux, coutParDiplome }) => (
                    <tr key={svc.id} className={`border-t ${darkMode ? 'border-gray-700' : 'border-slate-100'}`}>
                      <td className={`py-2 pr-3 font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{svc.nom}</td>
                      <td className={`py-2 px-2 text-right ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>{Math.round(bs.total).toLocaleString()} €</td>
                      <td className={`py-2 px-2 text-right ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>{nEtudiants > 0 ? nEtudiants : '—'}</td>
                      <td className={`py-2 px-2 text-right font-bold ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                        {coutParEtu !== null ? `${Math.round(coutParEtu).toLocaleString()} €` : '—'}
                      </td>
                      <td className="py-2 px-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number" min="0" max="100" step="1"
                            value={taux ?? ''}
                            placeholder="?"
                            onChange={e => {
                              const v = e.target.value === '' ? undefined : parseFloat(e.target.value);
                              setGlobalParams(prev => ({ ...prev, tauxDiplomationParService: { ...(prev.tauxDiplomationParService||{}), [svc.id]: v } }));
                            }}
                            className={`w-14 text-right rounded px-1.5 py-0.5 text-xs border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-slate-300'}`}
                          />
                          <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>%</span>
                        </div>
                      </td>
                      <td className={`py-2 px-2 text-right font-black text-sm ${coutParDiplome !== null ? (darkMode ? 'text-pink-300' : 'text-pink-700') : (darkMode ? 'text-gray-600' : 'text-slate-300')}`}>
                        {coutParDiplome !== null ? `${Math.round(coutParDiplome).toLocaleString()} €` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* PROVISIONS & BFR & FONDS DE ROULEMENT */}
      <div id="provisions-bfr-fr" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* PROVISIONS */}
        <div className={`rounded-3xl shadow-lg border-2 p-6 ${darkMode ? 'bg-gray-800 border-orange-900' : 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-200'}`}>
          {(() => { const p = getProvisions(); return (<>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <h2 className={`text-xl font-black ${darkMode ? 'text-orange-400' : 'text-orange-900'}`}>Provisions pour risque</h2>
                <HelpIcon darkMode={darkMode} position="right" wide content="Les provisions permettent d'anticiper des charges futures probables (congés non pris, litiges, grosses réparations…). Formule : Montant = Base × Taux%. La base peut être la masse salariale, les investissements ou le chiffre d'affaires. Obligatoire pour respecter le principe de prudence comptable." />
              </div>
              <button
                onClick={() => setGlobalParams({
                  ...globalParams,
                  provisions: [...(globalParams.provisions || []), {
                    id: `prov_${Date.now()}`,
                    nom: 'Nouvelle provision',
                    baseCalcul: 'salaires',
                    taux: 0
                  }]
                })}
                className="bg-orange-500 text-white p-2 rounded-lg no-print"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className={`text-xs mb-3 p-3 rounded-lg ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-orange-100 text-orange-700'}`}>
              <div className="font-bold mb-1">Formule :</div>
              <div className="font-mono">Montant = Base × Taux %</div>
              <div className="mt-1 opacity-75">Base : masse salariale, investissements ou chiffre d'affaires</div>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {(p.details || []).map((prov, idx) => (
                <div key={prov.id} className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-white'} group relative`}>
                  <button
                    onClick={() => setGlobalParams({
                      ...globalParams,
                      provisions: globalParams.provisions.filter(pr => pr.id !== prov.id)
                    })}
                    className="absolute -top-2.5 -right-2.5 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 no-print"
                  >
                    <Trash2 size={14} />
                  </button>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      className={`flex-1 font-bold text-sm bg-transparent outline-none ${darkMode ? 'text-white' : 'text-slate-700'}`}
                      value={globalParams.provisions[idx]?.nom || prov.nom}
                      onChange={(e) => setGlobalParams({
                        ...globalParams,
                        provisions: globalParams.provisions.map(pr =>
                          pr.id === prov.id ? {...pr, nom: e.target.value} : pr
                        )
                      })}
                    />
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <HelpIcon darkMode={darkMode} position="right" content="Assiette de calcul de la provision : masse salariale totale, valeur des investissements, ou chiffre d'affaires (recettes totales). Le montant provisionné = base × taux." />
                      <select
                        className={`rounded px-2 py-1 ${darkMode ? 'bg-gray-600 text-white' : 'bg-orange-50'}`}
                        value={globalParams.provisions[idx]?.baseCalcul || prov.baseCalcul}
                        onChange={(e) => setGlobalParams({
                          ...globalParams,
                          provisions: globalParams.provisions.map(pr =>
                            pr.id === prov.id ? {...pr, baseCalcul: e.target.value} : pr
                          )
                        })}
                      >
                        <option value="salaires">% Salaires</option>
                        <option value="investissements">% Investissements</option>
                        <option value="chiffre_affaires">% Chiffre d'affaires</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-1">
                      <HelpIcon darkMode={darkMode} position="right" content="Taux de provisionnement appliqué à la base sélectionnée. Ex : 10% des salaires pour les congés payés, 1% du CA pour les créances douteuses." />
                      <input
                        type="number"
                        step="0.1"
                        className={`w-16 text-right rounded px-2 py-1 font-bold ${darkMode ? 'bg-gray-600 text-white' : 'bg-orange-50'}`}
                        value={globalParams.provisions[idx]?.taux || 0}
                        onChange={(e) => setGlobalParams({
                          ...globalParams,
                          provisions: globalParams.provisions.map(pr =>
                            pr.id === prov.id ? {...pr, taux: validerTaux(e.target.value)} : pr
                          )
                        })}
                      />
                      <span className={darkMode ? 'text-gray-400' : 'text-slate-500'}>%</span>
                    </div>
                  </div>
                  <div className={`text-right mt-1 font-black text-orange-600`}>
                    {Math.round(prov.montant).toLocaleString()} €
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white flex justify-between">
              <span className="font-bold">TOTAL</span>
              <span className="text-xl font-black">{Math.round(p.total).toLocaleString()} €</span>
            </div>
          </>); })()}
        </div>

        {/* FOND DE ROULEMENT */}
        <div className={`rounded-3xl shadow-lg border-2 p-6 ${darkMode ? 'bg-gray-800 border-purple-900' : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200'}`}>
          {(() => { const fr = getFondRoulement(); return (<>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <h2 className={`text-xl font-black ${darkMode ? 'text-purple-400' : 'text-purple-900'}`}>Fonds de Roulement</h2>
                <HelpIcon {...H.fondsRoulement} darkMode={darkMode} position="right" wide />
              </div>
              <button
                onClick={() => setGlobalParams({
                  ...globalParams,
                  fondRoulement: [...(globalParams.fondRoulement || []), {
                    id: `fr_${Date.now()}`,
                    nom: 'Nouveau poste',
                    montant: 0
                  }]
                })}
                className="bg-purple-500 text-white p-2 rounded-lg no-print"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className={`text-xs mb-3 p-3 rounded-lg ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-purple-100 text-purple-700'}`}>
              <div className="font-bold mb-1">Formule :</div>
              <div className="font-mono">FR = Σ Capitaux permanents - Immobilisations nettes</div>
            </div>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {(fr.details || []).map((item, idx) => (
                <div key={item.id} className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-white'} group relative`}>
                  <button
                    onClick={() => setGlobalParams({
                      ...globalParams,
                      fondRoulement: globalParams.fondRoulement.filter(f => f.id !== item.id)
                    })}
                    className="absolute -top-2.5 -right-2.5 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 no-print"
                  >
                    <Trash2 size={14} />
                  </button>
                  <div className="flex items-center justify-between gap-2">
                    <input
                      className={`flex-1 font-bold text-sm bg-transparent outline-none ${darkMode ? 'text-white' : 'text-slate-700'}`}
                      value={globalParams.fondRoulement[idx]?.nom || item.nom}
                      onChange={(e) => setGlobalParams({
                        ...globalParams,
                        fondRoulement: globalParams.fondRoulement.map(f =>
                          f.id === item.id ? {...f, nom: e.target.value} : f
                        )
                      })}
                    />
                    <div className="flex items-center gap-1">
                      <HelpIcon darkMode={darkMode} position="left" content={item.id === 'reportNouveau' ? "Report à nouveau : résultat excédentaire ou déficitaire des exercices précédents, repris en fonds propres. Peut être négatif si l'association a accumulé des déficits." : item.id === 'subventionsInvest' ? "Subventions d'investissement reçues non encore amorties. Constituent des ressources stables mais doivent être progressivement reprises en résultat." : "Réserves accumulées par l'association sur les exercices précédents (excédents mis en réserve). Constituent un filet de sécurité financier."} />
                      <input
                        type="number"
                        className={`w-24 text-right rounded px-2 py-1 font-bold ${darkMode ? 'bg-gray-600 text-white' : 'bg-purple-50'}`}
                        value={globalParams.fondRoulement[idx]?.montant || 0}
                        onChange={(e) => setGlobalParams({
                          ...globalParams,
                          fondRoulement: globalParams.fondRoulement.map(f =>
                            f.id === item.id ? {...f, montant: (item.id === 'reportNouveau' ? validerMontantSigne : validerMontant)(e.target.value)} : f
                          )
                        })}
                      />
                      <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>€</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Résultat prévisionnel auto-calculé depuis le budget */}
            <div className={`mt-3 flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
              (fr.resultatPrevisionnel ?? 0) >= 0
                ? darkMode ? 'bg-emerald-900/30 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
                : darkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-700'
            }`}>
              <span className="font-semibold flex items-center gap-1">
                <Calculator size={13} />
                Résultat prévisionnel N (auto)
              </span>
              <span className="font-black">
                {(fr.resultatPrevisionnel ?? 0) >= 0 ? '+' : ''}{Math.round(fr.resultatPrevisionnel ?? 0).toLocaleString()} €
              </span>
            </div>
            <div className={`mt-2 pt-3 border-t ${darkMode ? 'border-gray-600' : 'border-purple-200'} space-y-2 text-sm`}>
              <div className="flex justify-between">
                <span className={darkMode ? 'text-gray-400' : 'text-slate-600'}>Capitaux permanents (saisie + résultat N)</span>
                <span className={`font-bold ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>+{Math.round(fr.totalCapitauxPermanents).toLocaleString()} €</span>
              </div>
              <div className="flex justify-between">
                <span className={darkMode ? 'text-gray-400' : 'text-slate-600'}>Immobilisations nettes</span>
                <span className={`font-bold ${darkMode ? 'text-red-300' : 'text-red-600'}`}>-{Math.round(fr.immobilisationsNettes).toLocaleString()} €</span>
              </div>
            </div>
            <div className={`mt-3 p-4 rounded-xl ${fr.fondRoulement >= 0 ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gradient-to-r from-red-500 to-orange-500'} text-white flex justify-between`}>
              <span className="font-bold">FR</span>
              <span className="text-xl font-black">{Math.round(fr.fondRoulement).toLocaleString()} €</span>
            </div>
          </>); })()}
        </div>

        {/* BFR */}
        <div className={`rounded-3xl shadow-lg border-2 p-6 ${darkMode ? 'bg-gray-800 border-blue-900' : 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200'}`}>
          {(() => { const b = getBFR(); return (<>
            <div className="flex items-center gap-2 mb-4">
              <h2 className={`text-xl font-black ${darkMode ? 'text-blue-400' : 'text-blue-900'}`}>Besoin en Fonds de Roulement</h2>
              <HelpIcon {...H.bfr} darkMode={darkMode} position="right" wide />
            </div>
            <div className={`text-xs mb-3 p-3 rounded-lg ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-blue-100 text-blue-700'}`}>
              <div className="font-bold mb-1">Formule :</div>
              <div className="font-mono">BFR = Stocks + (CA/365 × {globalParams.delaiPaiementClients}j) - (Achats/365 × {globalParams.delaiPaiementFournisseurs}j)</div>
            </div>
            <div className="space-y-2">
              <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                <div className="flex items-center justify-between">
                  <span className={`flex items-center gap-1 ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>
                    Stocks
                    <HelpIcon darkMode={darkMode} position="right" content="Valeur des stocks de fournitures, matières ou marchandises en fin d'exercice. Pour une association de formation, il peut s'agir de matériel pédagogique non encore consommé. Augmente le BFR car immobilise de la trésorerie." />
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      className={`w-24 text-right rounded px-2 py-1 font-bold ${darkMode ? 'bg-gray-600 text-white' : 'bg-blue-50'}`}
                      value={globalParams.stocksValeur || 0}
                      onChange={(e) => setGlobalParams({...globalParams, stocksValeur: validerMontant(e.target.value)})}
                    />
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>€</span>
                  </div>
                </div>
              </div>
              <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={darkMode ? 'text-gray-300' : 'text-slate-600'}>Créances clients</span>
                  <span className="font-black text-blue-600">+{Math.round(b.creancesClients).toLocaleString()} €</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className={`flex items-center gap-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                    Délai <HelpIcon {...H.delaiPaiement} darkMode={darkMode} position="right" wide />
                  </span>
                  <input
                    type="number"
                    className={`w-16 text-center rounded px-2 py-1 font-bold ${darkMode ? 'bg-gray-600 text-white' : 'bg-blue-50'}`}
                    value={globalParams.delaiPaiementClients}
                    onChange={(e) => setGlobalParams({...globalParams, delaiPaiementClients: validerEntier(e.target.value, 0, 365)})}
                  />
                  <span className={darkMode ? 'text-gray-400' : 'text-slate-500'}>jours</span>
                </div>
              </div>
              <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={darkMode ? 'text-gray-300' : 'text-slate-600'}>Dettes fournisseurs</span>
                  <span className="font-black text-teal-600">-{Math.round(b.dettesFournisseurs).toLocaleString()} €</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className={`flex items-center gap-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                    Délai
                    <HelpIcon darkMode={darkMode} position="right" content="Délai moyen de paiement de vos fournisseurs (jours). Plus ce délai est long, plus les dettes fournisseurs sont élevées et réduisent le BFR (ressource de trésorerie gratuite). Légalement plafonné à 60 jours (Loi LME)." />
                  </span>
                  <input
                    type="number"
                    className={`w-16 text-center rounded px-2 py-1 font-bold ${darkMode ? 'bg-gray-600 text-white' : 'bg-blue-50'}`}
                    value={globalParams.delaiPaiementFournisseurs}
                    onChange={(e) => setGlobalParams({...globalParams, delaiPaiementFournisseurs: validerEntier(e.target.value, 0, 365)})}
                  />
                  <span className={darkMode ? 'text-gray-400' : 'text-slate-500'}>jours</span>
                </div>
              </div>
              <div className={`p-4 rounded-xl ${b.bfr > 0 ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-gradient-to-r from-teal-500 to-cyan-500'} text-white flex justify-between`}>
                <div><span className="font-bold block">BFR</span><span className="text-xs">{Math.round(b.bfrEnJours)} jours</span></div>
                <span className="text-xl font-black">{Math.round(b.bfr).toLocaleString()} €</span>
              </div>
            </div>
          </>); })()}
        </div>
      </div>

      {/* ═══ SYNTHÈSE ANALYTIQUE ═══ */}
      {(() => {
        const bdDir = getBudgetDirection();
        const bdPS = getBudgetPoleSupport();
        const rows = [
          {
            nom: '📋 Direction / Siège',
            personnel: bdDir.salaires,
            exploitation: bdDir.chargesSiege,
            recettes: 0,
            isDirection: true,
          },
          {
            nom: '🔧 Pôle Ressource',
            personnel: bdPS.salaires,
            exploitation: bdPS.exploitation,
            recettes: bdPS.recettes,
            isDirection: true,
          },
          ...services.map(s => {
            const bd = getBudgetService(s);
            return {
              nom: s.nom,
              serviceId: s.id,
              personnel: bd.salaires,
              exploitation: bd.exploitation,
              recettes: bd.recettes,
              isDirection: false,
            };
          }),
        ];
        const totPerso  = rows.reduce((s, r) => s + r.personnel, 0);
        const totExpl   = rows.reduce((s, r) => s + r.exploitation, 0);
        const totRec    = rows.reduce((s, r) => s + r.recettes, 0);
        const totCharges = totPerso + totExpl;
        const totResult = totRec - totCharges;

        const fmt = (n) => Math.round(n).toLocaleString('fr-FR');
        const col = `px-3 py-2 text-right text-sm font-bold`;
        const colH = `px-3 py-2 text-right text-xs font-black uppercase`;

        const getN1Row = (r) => {
          if (!donneesN1) return null;
          const nomLow = r.nom.toLowerCase();
          if (nomLow.includes('direction') || nomLow.includes('siège') || nomLow.includes('siege')) return donneesN1.direction;
          if (nomLow.includes('support') || nomLow.includes('pôle')) return donneesN1.poleSupport;
          return (donneesN1.services || []).find(s => s.nom && r.nom.toLowerCase().includes(s.nom.toLowerCase().slice(0, 5)));
        };
        const evolPct = (current, n1) => {
          if (n1 === null || n1 === undefined || Math.abs(n1) < 1) return null;
          return ((current - n1) / Math.abs(n1) * 100).toFixed(1);
        };

        return (
          <div id="synthese-analytique" className={`rounded-3xl shadow-lg border-2 p-6 mb-8 print-avoid-break ${darkMode ? 'bg-gray-800 border-violet-900' : 'bg-gradient-to-br from-violet-50 to-indigo-50 border-violet-200'}`}>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                <BarChart3 className={darkMode ? 'text-violet-400' : 'text-violet-600'} size={28} />
                <div>
                  <h2 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>Synthèse Analytique</h2>
                  <span className={`text-xs font-bold ${darkMode ? 'text-violet-400' : 'text-violet-600'}`}>Tableau croisé par service · montants annuels{donneesN1 ? ` · comparatif N-1 (${donneesN1.annee})` : ''}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 no-print">
                {donneesN1 && (
                  <button onClick={() => setDonneesN1(null)} className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    <X size={13} /> Effacer N-1
                  </button>
                )}
                <button onClick={() => setShowImportN1(true)} className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold ${darkMode ? 'bg-violet-900/40 text-violet-300 hover:bg-violet-900/60 border border-violet-700' : 'bg-violet-100 text-violet-700 hover:bg-violet-200'}`}>
                  <Upload size={13} /> {donneesN1 ? 'Recharger N-1' : 'Importer N-1'}
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={`${darkMode ? 'bg-gray-700' : 'bg-white/70'} rounded-xl`}>
                    <th className="px-3 py-2 text-left text-xs font-black uppercase text-slate-500">Service</th>
                    <th className={`${colH} ${darkMode ? 'text-teal-400' : 'text-teal-700'}`}>
                      <span className="flex items-center justify-end gap-1">Personnel <HelpIcon {...H.chargesPatronales} darkMode={darkMode} position="bottom" /></span>
                    </th>
                    <th className={`${colH} ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                      <span className="flex items-center justify-end gap-1">Exploitation <HelpIcon {...H.exploitation} darkMode={darkMode} position="bottom" /></span>
                    </th>
                    <th className={`${colH} ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Total charges</th>
                    <th className={`${colH} ${darkMode ? 'text-green-400' : 'text-green-700'}`}>
                      <span className="flex items-center justify-end gap-1">Recettes <HelpIcon {...H.subventions} darkMode={darkMode} position="bottom" /></span>
                    </th>
                    <th className={`${colH} ${darkMode ? 'text-violet-400' : 'text-violet-700'}`}>
                      <span className="flex items-center justify-end gap-1">Résultat <HelpIcon {...H.tauxCouverture} darkMode={darkMode} position="bottom" /></span>
                    </th>
                    {donneesN1 && <th className={`${colH} ${darkMode ? 'text-amber-400' : 'text-amber-700'}`}>N-1 charges</th>}
                    {donneesN1 && <th className={`${colH} ${darkMode ? 'text-amber-400' : 'text-amber-700'}`}>Évol. %</th>}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => {
                    const totalChargesRow = r.personnel + r.exploitation;
                    const allocPS = (!r.isDirection && r.serviceId != null)
                      ? Math.round(bdPS.total * (poleSupport.repartition?.[String(r.serviceId)] || 0) / 100)
                      : 0;
                    const bdDir = getBudgetDirection();
                    const allocDir = (!r.isDirection && r.serviceId != null)
                      ? Math.round(bdDir.total * (direction.repartition?.[String(r.serviceId)] || 0) / 100)
                      : 0;
                    const resultat = r.recettes - totalChargesRow;
                    const isPos = resultat >= 0;
                    const n1Row = getN1Row(r);
                    const n1Charges = n1Row ? ((n1Row.salaires || 0) + (n1Row.exploitation || 0)) : null;
                    const ePct = n1Charges !== null ? evolPct(totalChargesRow, n1Charges) : null;
                    return (
                      <tr key={idx} className={`border-t ${darkMode ? 'border-gray-700' : 'border-violet-100'} ${r.isDirection ? (darkMode ? 'bg-gray-700/30' : 'bg-white/50') : ''}`}>
                        <td className={`px-3 py-2 font-bold text-sm ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                          {r.nom}
                          {allocDir > 0 && (
                            <div className={`text-xs font-normal mt-0.5 ${darkMode ? 'text-teal-400' : 'text-teal-600'}`}>
                              + Direction : {allocDir.toLocaleString('fr-FR')} €
                            </div>
                          )}
                          {allocPS > 0 && (
                            <div className={`text-xs font-normal mt-0.5 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>
                              + Pôle Ressource : {allocPS.toLocaleString('fr-FR')} €
                            </div>
                          )}
                        </td>
                        <td className={`${col} ${darkMode ? 'text-teal-300' : 'text-teal-700'}`}>{fmt(r.personnel)} €</td>
                        <td className={`${col} ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>{fmt(r.exploitation)} €</td>
                        <td className={`${col} ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{fmt(totalChargesRow)} €</td>
                        <td className={`${col} ${r.recettes > 0 ? (darkMode ? 'text-green-300' : 'text-green-700') : (darkMode ? 'text-gray-500' : 'text-slate-400')}`}>
                          {r.recettes > 0 ? fmt(r.recettes) + ' €' : '—'}
                        </td>
                        <td className={`${col} font-black ${isPos ? (darkMode ? 'text-emerald-300' : 'text-emerald-700') : (darkMode ? 'text-red-300' : 'text-red-600')}`}>
                          {r.recettes > 0 ? (isPos ? '+' : '') + fmt(resultat) + ' €' : '—'}
                        </td>
                        {donneesN1 && (
                          <td className={`${col} ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>
                            {n1Charges !== null ? fmt(n1Charges) + ' €' : '—'}
                          </td>
                        )}
                        {donneesN1 && (
                          <td className="px-3 py-2 text-right">
                            {ePct !== null ? (
                              <span className={`text-xs font-black px-2 py-0.5 rounded-full ${parseFloat(ePct) > 0 ? (darkMode ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-700') : parseFloat(ePct) < 0 ? (darkMode ? 'bg-emerald-900/40 text-emerald-300' : 'bg-emerald-100 text-emerald-700') : (darkMode ? 'bg-gray-700 text-gray-400' : 'bg-slate-100 text-slate-500')}`}>
                                {parseFloat(ePct) > 0 ? '+' : ''}{ePct}%
                              </span>
                            ) : '—'}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className={`border-t-2 font-black ${darkMode ? 'border-violet-700 bg-violet-900/20' : 'border-violet-300 bg-violet-100/80'}`}>
                    <td className={`px-3 py-3 font-black text-sm ${darkMode ? 'text-white' : 'text-slate-800'}`}>TOTAL</td>
                    <td className={`${col} ${darkMode ? 'text-teal-200' : 'text-teal-800'}`}>{fmt(totPerso)} €</td>
                    <td className={`${col} ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>{fmt(totExpl)} €</td>
                    <td className={`${col} ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{fmt(totCharges)} €</td>
                    <td className={`${col} ${darkMode ? 'text-green-200' : 'text-green-800'}`}>{fmt(totRec)} €</td>
                    <td className={`${col} text-base ${totResult >= 0 ? (darkMode ? 'text-emerald-200' : 'text-emerald-800') : (darkMode ? 'text-red-200' : 'text-red-800')}`}>
                      {totResult >= 0 ? '+' : ''}{fmt(totResult)} €
                    </td>
                    {donneesN1 && (() => {
                      const n1Tot = ((donneesN1.direction?.salaires || 0) + (donneesN1.direction?.exploitation || 0))
                        + ((donneesN1.poleSupport?.salaires || 0) + (donneesN1.poleSupport?.exploitation || 0))
                        + (donneesN1.services || []).reduce((s, sv) => s + (sv.salaires || 0) + (sv.exploitation || 0), 0);
                      const eTot = evolPct(totCharges, n1Tot);
                      return (<>
                        <td className={`${col} ${darkMode ? 'text-amber-200' : 'text-amber-800'}`}>{fmt(n1Tot)} €</td>
                        <td className="px-3 py-2 text-right">
                          {eTot !== null ? (
                            <span className={`text-xs font-black px-2 py-0.5 rounded-full ${parseFloat(eTot) > 0 ? (darkMode ? 'bg-red-900/60 text-red-200' : 'bg-red-200 text-red-800') : (darkMode ? 'bg-emerald-900/60 text-emerald-200' : 'bg-emerald-200 text-emerald-800')}`}>
                              {parseFloat(eTot) > 0 ? '+' : ''}{eTot}%
                            </span>
                          ) : '—'}
                        </td>
                      </>);
                    })()}
                  </tr>
                </tfoot>
              </table>
            </div>
            {/* Mini KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              {[
                { label: 'Masse salariale', val: fmt(totPerso) + ' €', pct: totCharges > 0 ? Math.round(totPerso/totCharges*100) : 0, color: darkMode ? 'text-teal-300' : 'text-teal-700', bg: darkMode ? 'bg-teal-900/30' : 'bg-teal-50' },
                { label: 'Exploitation', val: fmt(totExpl) + ' €', pct: totCharges > 0 ? Math.round(totExpl/totCharges*100) : 0, color: darkMode ? 'text-blue-300' : 'text-blue-700', bg: darkMode ? 'bg-blue-900/30' : 'bg-blue-50' },
                { label: 'Recettes totales', val: fmt(totRec) + ' €', pct: totCharges > 0 ? Math.round(totRec/totCharges*100) : 0, color: darkMode ? 'text-green-300' : 'text-green-700', bg: darkMode ? 'bg-green-900/30' : 'bg-green-50', label2: '% couverture' },
                { label: 'Résultat net', val: (totResult >= 0 ? '+' : '') + fmt(totResult) + ' €', pct: null, color: totResult >= 0 ? (darkMode ? 'text-emerald-300' : 'text-emerald-700') : (darkMode ? 'text-red-300' : 'text-red-700'), bg: totResult >= 0 ? (darkMode ? 'bg-emerald-900/30' : 'bg-emerald-50') : (darkMode ? 'bg-red-900/30' : 'bg-red-50') },
              ].map((k, i) => (
                <div key={i} className={`p-3 rounded-2xl ${k.bg}`}>
                  <div className={`text-xs font-bold mb-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{k.label}</div>
                  <div className={`text-lg font-black ${k.color}`}>{k.val}</div>
                  {k.pct !== null && (
                    <div className={`text-xs font-bold mt-1 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>{k.label2 || '% des charges'} : {k.pct}%</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* SIMULATION CHARGES INTERACTIF */}
      {(() => {
        const bdDir = getBudgetDirection();
        const totalPers0 = [bdDir.salaires, ...services.map(s => getBudgetService(s).salaires)].reduce((a, b) => a + b, 0);
        const totalExpl0 = [bdDir.chargesSiege, ...services.map(s => getBudgetService(s).exploitation)].reduce((a, b) => a + b, 0);
        const totalRec0  = services.reduce((s, svc) => s + getBudgetService(svc).recettes, 0);

        const factS = 1 + (simCharges.augSalaires || 0) / 100;
        const factC = 1 + (simCharges.augCharges || 0) / 100;
        const factE = 1 + (simCharges.augExploitation || 0) / 100;

        const totalPers1 = totalPers0 * factS * factC;
        const totalExpl1 = totalExpl0 * factE;
        const total0 = totalPers0 + totalExpl0;
        const total1 = totalPers1 + totalExpl1;
        const delta  = total1 - total0;
        const result1 = totalRec0 - total1;

        const fmt = n => Math.round(n).toLocaleString('fr-FR');
        const SLIDER_COLOR_CLS = {
          teal:  [darkMode ? 'text-teal-300'  : 'text-teal-700'],
          blue:  [darkMode ? 'text-blue-300'  : 'text-blue-700'],
          amber: [darkMode ? 'text-amber-300' : 'text-amber-700'],
        };
        const Slider = ({ label, field, min, max, color }) => (
          <div>
            <div className="flex justify-between mb-1">
              <span className={`text-xs font-bold ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>{label}</span>
              <span className={`text-sm font-black ${simCharges[field] > 0 ? (SLIDER_COLOR_CLS[color]?.[0] || (darkMode ? 'text-teal-300' : 'text-teal-700')) : (darkMode ? 'text-gray-400' : 'text-slate-400')}`}>
                {simCharges[field] > 0 ? '+' : ''}{simCharges[field]}%
              </span>
            </div>
            <input type="range" min={min} max={max} step="0.5" value={simCharges[field]}
              onChange={e => setSimCharges({...simCharges, [field]: parseFloat(e.target.value)})}
              className="w-full accent-teal-500"
            />
            <div className={`flex justify-between text-xs ${darkMode ? 'text-gray-600' : 'text-slate-400'}`}><span>{min}%</span><span>{max}%</span></div>
          </div>
        );

        return (
          <div id="simulation-charges" className={`rounded-3xl shadow-lg border-2 p-6 mb-8 print-avoid-break ${darkMode ? 'bg-gray-800 border-sky-900' : 'bg-gradient-to-br from-sky-50 to-blue-50 border-sky-200'}`}>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-3">
                <Calculator className={darkMode ? 'text-sky-400' : 'text-sky-600'} size={28} />
                <div>
                  <h2 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>Simulation de charges</h2>
                  <span className={`text-xs font-bold ${darkMode ? 'text-sky-400' : 'text-sky-600'}`}>Testez l'impact d'une variation des charges sur le résultat</span>
                </div>
              </div>
              <button onClick={() => setSimCharges({ augSalaires: 0, augCharges: 0, augExploitation: 0 })}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                <RotateCcw size={13} /> Réinitialiser
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-5">
                <Slider label="Augmentation salariale (masse brute)" field="augSalaires" min={-5} max={15} color="teal" />
                <Slider label="Variation taux de charges patronales" field="augCharges" min={-5} max={10} color="blue" />
                <Slider label="Variation charges d'exploitation" field="augExploitation" min={-10} max={20} color="amber" />
              </div>

              <div className="space-y-3">
                <div className={`p-4 rounded-2xl ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                  <div className={`text-xs font-bold uppercase mb-3 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Impact sur le budget</div>
                  <div className="space-y-2 text-sm">
                    {[
                      { label: 'Personnel (base)', val: fmt(totalPers0) + ' €', sim: fmt(totalPers1) + ' €', delta: totalPers1 - totalPers0 },
                      { label: 'Exploitation (base)', val: fmt(totalExpl0) + ' €', sim: fmt(totalExpl1) + ' €', delta: totalExpl1 - totalExpl0 },
                      { label: 'TOTAL charges', val: fmt(total0) + ' €', sim: fmt(total1) + ' €', delta: delta, bold: true },
                    ].map((r, i) => (
                      <div key={i} className={`flex justify-between items-center ${r.bold ? `pt-2 border-t font-black ${darkMode ? 'border-gray-600' : 'border-slate-200'}` : ''}`}>
                        <span className={darkMode ? 'text-gray-300' : 'text-slate-600'}>{r.label}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs line-through ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>{r.val}</span>
                          <span className={darkMode ? 'text-white' : 'text-slate-800'}>{r.sim}</span>
                          {r.delta !== 0 && (
                            <span className={`text-xs font-black px-2 py-0.5 rounded-full ${r.delta > 0 ? (darkMode ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-700') : (darkMode ? 'bg-emerald-900/40 text-emerald-300' : 'bg-emerald-100 text-emerald-700')}`}>
                              {r.delta > 0 ? '+' : ''}{fmt(r.delta)} €
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className={`p-4 rounded-2xl font-black text-center ${result1 >= 0 ? (darkMode ? 'bg-emerald-900/30 border border-emerald-700' : 'bg-emerald-50 border border-emerald-200') : (darkMode ? 'bg-red-900/30 border border-red-700' : 'bg-red-50 border border-red-200')}`}>
                  <div className={`text-xs font-bold mb-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Résultat simulé (Recettes {fmt(totalRec0)} € − Charges simulées)</div>
                  <div className={`text-2xl ${result1 >= 0 ? (darkMode ? 'text-emerald-300' : 'text-emerald-700') : (darkMode ? 'text-red-300' : 'text-red-700')}`}>
                    {result1 >= 0 ? '+' : ''}{fmt(result1)} €
                  </div>
                  <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                    vs résultat actuel : {totalRec0 - total0 >= 0 ? '+' : ''}{fmt(totalRec0 - total0)} €
                    {' '}({delta >= 0 ? '+' : ''}{fmt(delta)} € de variation)
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* SIMULATION BAISSE SUBVENTION RÉGION */}
      {(() => {
        const fmt = n => Math.round(n).toLocaleString('fr-FR');
        const pct = simRegion ?? 0;
        const facteur = 1 + pct / 100;

        // Identifie les recettes "Subvention Région" par mot-clé
        const isSubvRegion = nom => /r[eé]gion/i.test(nom);

        const lignesServices = services
          .filter(s => s.recettes && s.recettes.some(r => isSubvRegion(r.nom)))
          .map(s => {
            const bs = getBudgetService(s);
            const subvBase = s.recettes
              .filter(r => isSubvRegion(r.nom))
              .reduce((sum, r) => sum + r.montant * 12, 0);
            const autresRec = bs.recettes - subvBase;
            const recSim = autresRec + subvBase * facteur;
            const soldeSim = recSim - bs.total;
            const tauxBase = bs.total > 0 ? (bs.recettes / bs.total) * 100 : 0;
            const tauxSim  = bs.total > 0 ? (recSim / bs.total) * 100 : 0;
            return { nom: s.nom, subvBase, recBase: bs.recettes, recSim, soldeBase: bs.solde, soldeSim, tauxBase, tauxSim, totalCharges: bs.total };
          });

        const totalSubvBase = lignesServices.reduce((s, l) => s + l.subvBase, 0);
        const totalRecBase  = lignesServices.reduce((s, l) => s + l.recBase, 0);
        const totalRecSim   = lignesServices.reduce((s, l) => s + l.recSim, 0);
        const totalSoldeBase = lignesServices.reduce((s, l) => s + l.soldeBase, 0);
        const totalSoldeSim  = lignesServices.reduce((s, l) => s + l.soldeSim, 0);
        const deltaRec = totalRecSim - totalRecBase;

        return (
          <div id="simulation-region" className={`rounded-3xl shadow-lg border-2 p-6 mb-8 print-avoid-break ${darkMode ? 'bg-gray-800 border-rose-900' : 'bg-gradient-to-br from-rose-50 to-pink-50 border-rose-200'}`}>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-3">
                <TrendingDown className={darkMode ? 'text-rose-400' : 'text-rose-600'} size={28} />
                <div>
                  <h2 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>Simulation — Subvention Région</h2>
                  <span className={`text-xs font-bold ${darkMode ? 'text-rose-400' : 'text-rose-600'}`}>
                    Impact d'une variation des subventions Région sur le résultat par service
                  </span>
                </div>
              </div>
              <button onClick={() => setSimRegion(0)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                <RotateCcw size={13} /> Réinitialiser
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Slider */}
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className={`text-sm font-bold ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>
                      Variation subvention Région
                    </span>
                    <span className={`text-xl font-black ${pct < 0 ? 'text-rose-500' : pct > 0 ? 'text-emerald-500' : (darkMode ? 'text-gray-400' : 'text-slate-400')}`}>
                      {pct > 0 ? '+' : ''}{pct}%
                    </span>
                  </div>
                  <input type="range" min={-30} max={10} step={1} value={pct}
                    onChange={e => setSimRegion(parseFloat(e.target.value))}
                    className="w-full accent-rose-500"
                  />
                  <div className={`flex justify-between text-xs mt-1 ${darkMode ? 'text-gray-600' : 'text-slate-400'}`}>
                    <span>−30% (perte majeure)</span><span>0%</span><span>+10%</span>
                  </div>
                </div>

                {/* Résumé global */}
                <div className={`p-4 rounded-2xl ${darkMode ? 'bg-gray-700' : 'bg-white'} space-y-2`}>
                  <div className={`text-xs font-bold uppercase mb-2 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Impact global</div>
                  {[
                    { label: 'Subventions Région (base)', val: fmt(totalSubvBase) + ' €' },
                    { label: 'Subventions simulées', val: fmt(totalSubvBase * facteur) + ' €', delta: totalSubvBase * facteur - totalSubvBase },
                    { label: 'Δ Recettes totales', val: (deltaRec >= 0 ? '+' : '') + fmt(deltaRec) + ' €', color: deltaRec >= 0 ? 'text-emerald-500' : 'text-rose-500' },
                  ].map((r, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className={darkMode ? 'text-gray-300' : 'text-slate-600'}>{r.label}</span>
                      <span className={`font-black ${r.color || (darkMode ? 'text-white' : 'text-slate-800')}`}>{r.val}</span>
                    </div>
                  ))}
                </div>

                {/* Résultat global simulé */}
                <div className={`p-4 rounded-2xl font-black text-center border ${totalSoldeSim >= 0 ? (darkMode ? 'bg-emerald-900/30 border-emerald-700' : 'bg-emerald-50 border-emerald-200') : (darkMode ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-200')}`}>
                  <div className={`text-xs font-bold mb-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Résultat global simulé</div>
                  <div className={`text-2xl ${totalSoldeSim >= 0 ? (darkMode ? 'text-emerald-300' : 'text-emerald-700') : (darkMode ? 'text-red-300' : 'text-red-700')}`}>
                    {totalSoldeSim >= 0 ? '+' : ''}{fmt(totalSoldeSim)} €
                  </div>
                  <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                    vs résultat actuel : {totalSoldeBase >= 0 ? '+' : ''}{fmt(totalSoldeBase)} €
                    {' '}({totalSoldeSim - totalSoldeBase >= 0 ? '+' : ''}{fmt(totalSoldeSim - totalSoldeBase)} € de variation)
                  </div>
                </div>
              </div>

              {/* Tableau par service */}
              <div className={`rounded-2xl overflow-hidden border ${darkMode ? 'border-gray-600' : 'border-slate-200'}`}>
                <table className="w-full text-xs">
                  <thead>
                    <tr className={darkMode ? 'bg-gray-700 text-gray-300' : 'bg-slate-100 text-slate-600'}>
                      <th className="text-left p-3 font-bold">Service</th>
                      <th className="text-right p-3 font-bold">Subv. Région</th>
                      <th className="text-right p-3 font-bold">Taux couv. base</th>
                      <th className="text-right p-3 font-bold">Taux couv. sim.</th>
                      <th className="text-right p-3 font-bold">Solde simulé</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lignesServices.map((l, i) => {
                      const tauxOk = l.tauxSim >= 100;
                      const tauxWarn = l.tauxSim >= 90 && l.tauxSim < 100;
                      return (
                        <tr key={i} className={`border-t ${darkMode ? 'border-gray-600' : 'border-slate-100'}`}>
                          <td className={`p-3 font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{l.nom}</td>
                          <td className={`p-3 text-right font-mono ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>{fmt(l.subvBase)} €</td>
                          <td className="p-3 text-right">
                            <span className={`px-2 py-0.5 rounded-full font-black ${l.tauxBase >= 100 ? (darkMode ? 'bg-emerald-900/50 text-emerald-300' : 'bg-emerald-100 text-emerald-700') : (darkMode ? 'bg-amber-900/50 text-amber-300' : 'bg-amber-100 text-amber-700')}`}>
                              {l.tauxBase.toFixed(1)}%
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <span className={`px-2 py-0.5 rounded-full font-black ${tauxOk ? (darkMode ? 'bg-emerald-900/50 text-emerald-300' : 'bg-emerald-100 text-emerald-700') : tauxWarn ? (darkMode ? 'bg-amber-900/50 text-amber-300' : 'bg-amber-100 text-amber-700') : (darkMode ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-700')}`}>
                              {l.tauxSim.toFixed(1)}%
                            </span>
                          </td>
                          <td className={`p-3 text-right font-black ${l.soldeSim >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {l.soldeSim >= 0 ? '+' : ''}{fmt(l.soldeSim)} €
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {lignesServices.length === 0 && (
                    <tbody>
                      <tr><td colSpan={5} className={`p-4 text-center text-xs ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Aucune recette "Subvention Région" trouvée dans les services</td></tr>
                    </tbody>
                  )}
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* GRAPHIQUE TRÉSORERIE MENSUELLE SAISONNALISÉE */}
      {(() => {
        const MOIS_LABELS = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'];
        const fmt = n => Math.round(n).toLocaleString('fr-FR');

        // Charges mensuelles uniformes (salaires + exploitation divisés par 12)
        const bdDir = getBudgetDirection();
        const totalSalaires = [bdDir.salaires, ...services.map(s => getBudgetService(s).salaires)].reduce((a, b) => a + b, 0)
          + (getBudgetPoleSupport ? getBudgetPoleSupport().salaires : 0);
        const totalExpl = [bdDir.chargesSiege, ...services.map(s => getBudgetService(s).exploitation)].reduce((a, b) => a + b, 0)
          + (getBudgetPoleSupport ? getBudgetPoleSupport().exploitation : 0);
        const totalAmort = services.reduce((s, svc) => s + getBudgetService(svc).amortissements, 0);
        const chargesMois = (totalSalaires + totalExpl + totalAmort) / 12;

        // Recettes saisonnalisées par mois
        const recMens = Array(12).fill(0);
        services.forEach(svc => {
          (svc.recettes || []).forEach(item => {
            const annuel = (item.montant || 0) * 12;
            if (Array.isArray(item.repartitionMensuelle) && item.repartitionMensuelle.length === 12) {
              const somme = item.repartitionMensuelle.reduce((a, b) => a + b, 0) || 100;
              item.repartitionMensuelle.forEach((p, i) => { recMens[i] += annuel * (p / somme); });
            } else {
              for (let i = 0; i < 12; i++) recMens[i] += annuel / 12;
            }
          });
        });

        // Construction des données du graphique avec cumul trésorerie
        let cumul = 0;
        const data = MOIS_LABELS.map((label, i) => {
          const solde = recMens[i] - chargesMois;
          cumul += solde;
          return { label, recettes: Math.round(recMens[i]), charges: -Math.round(chargesMois), solde: Math.round(solde), cumul: Math.round(cumul) };
        });

        const totalRecAnnuel = recMens.reduce((a, b) => a + b, 0);
        const moisDeficit = data.filter(d => d.solde < 0).length;
        const deficitMax = Math.min(...data.map(d => d.solde));
        const cumulMin = Math.min(...data.map(d => d.cumul));

        return (
          <div id="tresorerie-mensuelle" className={`rounded-3xl shadow-lg border-2 p-6 mb-8 print-avoid-break ${darkMode ? 'bg-gray-800 border-sky-900' : 'bg-gradient-to-br from-sky-50 to-cyan-50 border-sky-200'}`}>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-3">
                <Waves className={darkMode ? 'text-sky-400' : 'text-sky-600'} size={28} />
                <div>
                  <h2 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>Trésorerie mensuelle 2026</h2>
                  <span className={`text-xs font-bold ${darkMode ? 'text-sky-400' : 'text-sky-600'}`}>
                    Recettes saisonnalisées vs charges — configurer via le bouton 🗓 sur chaque recette
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {[
                  { label: 'Mois déficitaires', val: `${moisDeficit}/12`, color: moisDeficit > 0 ? 'text-rose-500' : 'text-emerald-500' },
                  { label: 'Déficit max/mois', val: deficitMax < 0 ? `${fmt(deficitMax)} €` : '—', color: deficitMax < 0 ? 'text-rose-500' : 'text-emerald-500' },
                  { label: 'Besoin tréso. cumulé', val: cumulMin < 0 ? `${fmt(Math.abs(cumulMin))} €` : '—', color: cumulMin < 0 ? 'text-amber-500' : 'text-emerald-500' },
                ].map((k, i) => (
                  <div key={i} className={`text-center px-3 py-2 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                    <div className={`text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{k.label}</div>
                    <div className={`text-sm font-black ${k.color}`}>{k.val}</div>
                  </div>
                ))}
              </div>
            </div>

            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e2e8f0'} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: darkMode ? '#9ca3af' : '#64748b' }} />
                <YAxis tickFormatter={v => `${Math.round(v/1000)}k`} tick={{ fontSize: 10, fill: darkMode ? '#6b7280' : '#94a3b8' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: darkMode ? '#1f2937' : '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: 12 }}
                  formatter={(value, name) => {
                    const v = Math.round(value);
                    const label = name === 'recettes' ? 'Recettes' : name === 'charges' ? 'Charges' : name === 'solde' ? 'Solde mois' : 'Cumul tréso.';
                    return [`${v >= 0 ? '+' : ''}${v.toLocaleString('fr-FR')} €`, label];
                  }}
                />
                <ReferenceLine y={0} stroke={darkMode ? '#6b7280' : '#94a3b8'} strokeWidth={1.5} />
                <Bar dataKey="charges" name="charges" fill={darkMode ? '#ef4444' : '#fca5a5'} radius={[0, 0, 4, 4]} maxBarSize={40} />
                <Bar dataKey="recettes" name="recettes" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {data.map((d, i) => (
                    <Cell key={i} fill={d.solde >= 0 ? (darkMode ? '#34d399' : '#6ee7b7') : (darkMode ? '#fb923c' : '#fdba74')} />
                  ))}
                </Bar>
                <Line type="monotone" dataKey="cumul" name="cumul" stroke={darkMode ? '#38bdf8' : '#0284c7'} strokeWidth={2.5} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>

            <div className={`mt-4 flex flex-wrap gap-4 text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-400 inline-block"></span> Mois excédentaire (recettes &gt; charges)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-orange-400 inline-block"></span> Mois déficitaire (recettes &lt; charges)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-400 inline-block"></span> Charges mensuelles fixes</span>
              <span className="flex items-center gap-1.5"><span className="inline-block w-6 h-0.5 bg-sky-500"></span> Cumul trésorerie (axe droit)</span>
            </div>

            {cumulMin < 0 && (
              <div className={`mt-4 p-3 rounded-xl text-xs flex items-start gap-2 border ${darkMode ? 'bg-amber-900/30 border-amber-700 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                <span className="text-base leading-none">⚠️</span>
                <span>
                  <strong>Besoin de trésorerie : {fmt(Math.abs(cumulMin))} €</strong> — la trésorerie cumulée passe en négatif.
                  Prévoir une ligne de crédit ou avancer le versement d'une tranche de subvention Région.
                  {moisDeficit > 0 && <> Configurez la saisonnalité des recettes (bouton 🗓) pour affiner cette projection.</>}
                </span>
              </div>
            )}
          </div>
        );
      })()}

      {/* ── BALANCE COMPTABLE — RÉALISÉ VS PRÉVISIONNEL ── */}
      {(() => {
        const bdDir = getBudgetDirection();
        const bdPS  = getBudgetPoleSupport();
        const budgetChargesTotal   = services.reduce((s, svc) => s + getBudgetService(svc).total, 0) + bdDir.total + bdPS.total;
        const budgetRecettesTotal  = services.reduce((s, svc) => s + getBudgetService(svc).recettes, 0)
          + (direction?.recettes || []).reduce((s, r) => s + (r.montant || 0) * 12, 0)
          + (poleSupport?.recettes || []).reduce((s, r) => s + (r.montant || 0) * 12, 0);

        return (
          <div className={`rounded-3xl shadow-lg border-2 p-6 mb-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between mb-5">
              <h2 className={`text-xl font-black flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                <Table size={22} className="text-blue-500" /> Réalisé vs Prévisionnel — Balance comptable
              </h2>
              <div className="flex gap-2 no-print">
                <button onClick={() => exportEPRD(direction, services, poleSupport, globalParams, balanceComptable)}
                  className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl transition-colors ${darkMode ? 'bg-emerald-900/40 border border-emerald-700 text-emerald-300 hover:bg-emerald-800/60' : 'bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100'}`}
                  title="Exporter EPRD (+ ERRD si balance importée)">
                  <FileText size={14} /> EPRD Excel
                </button>
                {setShowBalanceImport && (
                  <button onClick={() => setShowBalanceImport(true)}
                    className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl transition-colors ${darkMode ? 'bg-blue-900/40 border border-blue-700 text-blue-300 hover:bg-blue-800/60' : 'bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100'}`}>
                    <Upload size={14} /> {balanceComptable ? 'Mettre à jour' : 'Importer balance'}
                  </button>
                )}
              </div>
            </div>

            {!balanceComptable ? (
              <div className={`text-center py-10 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                <Table size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm font-bold">Aucune balance importée</p>
                <p className="text-xs mt-1">Importez votre balance comptable pour comparer réalisé et prévisionnel</p>
              </div>
            ) : (
              <>
                <div className={`flex items-center gap-3 mb-5 text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                  <span className={`px-2 py-1 rounded-lg font-bold ${darkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>Exercice {balanceComptable.annee}</span>
                  <span>{balanceComptable.entries?.length || 0} comptes</span>
                  <span>Import : {new Date(balanceComptable.importedAt).toLocaleDateString('fr-FR')}</span>
                  {balanceComptable.fileName && <span className="italic">{balanceComptable.fileName}</span>}
                </div>

                {/* 4 KPIs comparatifs */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: 'Charges réalisées',  val: balanceComptable.totalCharges,  previsionnel: budgetChargesTotal,  color: 'red'   },
                    { label: 'Recettes réalisées', val: balanceComptable.totalRecettes, previsionnel: budgetRecettesTotal, color: 'teal'  },
                    { label: 'Solde réalisé',      val: balanceComptable.totalRecettes - balanceComptable.totalCharges, previsionnel: budgetRecettesTotal - budgetChargesTotal, color: 'indigo' },
                    { label: 'Taux couv. réel',   val: balanceComptable.totalCharges > 0 ? Math.round(balanceComptable.totalRecettes / balanceComptable.totalCharges * 100) : 0, previsionnel: budgetChargesTotal > 0 ? Math.round(budgetRecettesTotal / budgetChargesTotal * 100) : 0, suffix: '%', color: 'emerald' },
                  ].map(({ label, val, previsionnel, color, suffix = '€' }) => {
                    const ecart = val - previsionnel;
                    const ecartPct = previsionnel !== 0 ? (ecart / Math.abs(previsionnel) * 100) : 0;
                    const isGood = label.includes('Recettes') || label.includes('Solde') || label.includes('Taux') ? ecart >= 0 : ecart <= 0;
                    return (
                      <div key={label} className={`rounded-2xl p-4 border ${darkMode ? 'bg-gray-700/60 border-gray-600' : 'bg-slate-50 border-slate-200'}`}>
                        <div className={`text-xs font-bold uppercase mb-2 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{label}</div>
                        <div className={`text-2xl font-black mb-1 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                          {suffix === '%' ? `${val}%` : `${Math.round(val).toLocaleString()} €`}
                        </div>
                        <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                          Prévu : {suffix === '%' ? `${previsionnel}%` : `${Math.round(previsionnel).toLocaleString()} €`}
                        </div>
                        <div className={`text-xs font-bold mt-1 ${isGood ? 'text-emerald-500' : 'text-red-500'}`}>
                          {ecart >= 0 ? '+' : ''}{suffix === '%' ? `${ecart.toFixed(1)} pt` : `${Math.round(ecart).toLocaleString()} €`}
                          {' '}({ecartPct >= 0 ? '+' : ''}{ecartPct.toFixed(1)}%)
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Tableau par classe PCG */}
                <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
                  <table className="w-full text-sm">
                    <thead className={darkMode ? 'bg-gray-700' : 'bg-slate-100'}>
                      <tr>
                        {['Catégorie','Nb comptes','Réalisé (€)','Prévisionnel (€)','Écart (€)','Écart %'].map(h => (
                          <th key={h} className={`px-4 py-3 text-left text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const cats = [
                          { id: 'salaires',       label: 'Charges personnel (64)',   previsionnel: services.reduce((s, svc) => s + getBudgetService(svc).salaires, 0) + bdDir.salaires + bdPS.salaires },
                          { id: 'exploitation',   label: 'Charges exploitation (6)', previsionnel: services.reduce((s, svc) => s + getBudgetService(svc).exploitation, 0) + bdDir.chargesSiege + bdPS.exploitation },
                          { id: 'amortissements', label: 'Amortissements (68)',       previsionnel: services.reduce((s, svc) => s + getBudgetService(svc).amortissements, 0) },
                          { id: 'recettes',       label: 'Produits (7)',              previsionnel: budgetRecettesTotal },
                        ];
                        return cats.map(({ id, label, previsionnel }) => {
                          const entries = (balanceComptable.entries || []).filter(e => e.categorie === id);
                          const realise = entries.reduce((s, e) => s + Math.abs(e.solde), 0);
                          const ecart = realise - previsionnel;
                          const ecartPct = previsionnel !== 0 ? (ecart / Math.abs(previsionnel) * 100) : 0;
                          const isGood = id === 'recettes' ? ecart >= 0 : ecart <= 0;
                          return (
                            <tr key={id} className={darkMode ? 'border-t border-gray-700' : 'border-t border-slate-100'}>
                              <td className={`px-4 py-3 font-bold text-sm ${darkMode ? 'text-white' : 'text-slate-800'}`}>{label}</td>
                              <td className={`px-4 py-3 text-center ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{entries.length}</td>
                              <td className={`px-4 py-3 text-right font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{Math.round(realise).toLocaleString()}</td>
                              <td className={`px-4 py-3 text-right ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{Math.round(previsionnel).toLocaleString()}</td>
                              <td className={`px-4 py-3 text-right font-bold ${isGood ? 'text-emerald-500' : 'text-red-500'}`}>{ecart >= 0 ? '+' : ''}{Math.round(ecart).toLocaleString()}</td>
                              <td className={`px-4 py-3 text-right text-xs font-bold ${isGood ? 'text-emerald-500' : 'text-red-500'}`}>{ecartPct >= 0 ? '+' : ''}{ecartPct.toFixed(1)}%</td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        );
      })()}

      {/* ── ENGAGEMENTS NON FACTURÉS (4.5) ── */}
      {(() => {
        const ouverts = engagements.filter(e => e.statut !== 'solde');
        const soldes  = engagements.filter(e => e.statut === 'solde');
        const totalOuverts = ouverts.reduce((s, e) => s + (parseFloat(e.montant) || 0), 0);
        const CATEGORIES = ['Exploitation', 'Personnel', 'Investissement', 'Autre'];
        const allEntites = ['Direction', 'Pôle Support', ...services.map(s => s.nom)];
        const addEngagement = () => setEngagements && setEngagements(prev => [
          ...prev,
          { id: Date.now(), nom: 'Nouvel engagement', fournisseur: '', montant: 0, dateEcheance: '', categorie: 'Exploitation', entite: 'Direction', statut: 'ouvert' }
        ]);
        return (
          <div className={`mt-8 rounded-3xl shadow-sm border p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h2 className={`text-xl font-black flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                <ClipboardList size={22} className="text-amber-500" /> Engagements non facturés
              </h2>
              <div className="flex items-center gap-3 flex-wrap">
                <div className={`rounded-xl px-4 py-1.5 font-black text-sm ${totalOuverts > 0 ? (darkMode ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-50 text-amber-700') : (darkMode ? 'bg-gray-700 text-gray-400' : 'bg-slate-100 text-slate-500')}`}>
                  {ouverts.length} engagement{ouverts.length !== 1 ? 's' : ''} ouvert{ouverts.length !== 1 ? 's' : ''} — {Math.round(totalOuverts).toLocaleString()} €
                </div>
                {setEngagements && (
                  <button onClick={addEngagement} className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl ${darkMode ? 'bg-amber-900/30 text-amber-300 hover:bg-amber-800/40' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}>
                    <Plus size={13} /> Ajouter
                  </button>
                )}
              </div>
            </div>
            {engagements.length === 0 ? (
              <p className={`text-sm text-center py-8 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                Aucun engagement saisi. Cliquez « Ajouter » pour enregistrer des dépenses engagées non facturées.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className={`text-left ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                      <th className="py-2 pr-3 font-semibold">Description</th>
                      <th className="py-2 px-2 font-semibold">Fournisseur</th>
                      <th className="py-2 px-2 font-semibold">Entité</th>
                      <th className="py-2 px-2 font-semibold">Catégorie</th>
                      <th className="py-2 px-2 font-semibold text-right">Montant (€)</th>
                      <th className="py-2 px-2 font-semibold">Échéance</th>
                      <th className="py-2 px-2 font-semibold text-center">Statut</th>
                      {setEngagements && <th className="py-2 pl-2 font-semibold"></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {engagements.map(eng => (
                      <tr key={eng.id} className={`border-t ${darkMode ? 'border-gray-700' : 'border-slate-100'} ${eng.statut === 'solde' ? 'opacity-50' : ''}`}>
                        <td className="py-2 pr-3">
                          {setEngagements
                            ? <input type="text" value={eng.nom} onChange={e => setEngagements(prev => prev.map(x => x.id === eng.id ? { ...x, nom: e.target.value } : x))}
                                className={`w-40 rounded px-1.5 py-0.5 text-xs ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-slate-300'} border`} />
                            : <span className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{eng.nom}</span>}
                        </td>
                        <td className="py-2 px-2">
                          {setEngagements
                            ? <input type="text" value={eng.fournisseur} onChange={e => setEngagements(prev => prev.map(x => x.id === eng.id ? { ...x, fournisseur: e.target.value } : x))}
                                className={`w-28 rounded px-1.5 py-0.5 text-xs ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-slate-300'} border`} />
                            : eng.fournisseur}
                        </td>
                        <td className="py-2 px-2">
                          {setEngagements
                            ? <select value={eng.entite} onChange={e => setEngagements(prev => prev.map(x => x.id === eng.id ? { ...x, entite: e.target.value } : x))}
                                className={`text-xs rounded px-1.5 py-0.5 ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-slate-300'} border`}>
                                {allEntites.map(en => <option key={en} value={en}>{en}</option>)}
                              </select>
                            : eng.entite}
                        </td>
                        <td className="py-2 px-2">
                          {setEngagements
                            ? <select value={eng.categorie} onChange={e => setEngagements(prev => prev.map(x => x.id === eng.id ? { ...x, categorie: e.target.value } : x))}
                                className={`text-xs rounded px-1.5 py-0.5 ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-slate-300'} border`}>
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                            : eng.categorie}
                        </td>
                        <td className="py-2 px-2 text-right">
                          {setEngagements
                            ? <input type="number" value={eng.montant} onChange={e => setEngagements(prev => prev.map(x => x.id === eng.id ? { ...x, montant: parseFloat(e.target.value) || 0 } : x))}
                                className={`w-24 text-right rounded px-1.5 py-0.5 text-xs ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-slate-300'} border`} />
                            : <span className="font-bold">{Math.round(eng.montant).toLocaleString()}</span>}
                        </td>
                        <td className="py-2 px-2">
                          {setEngagements
                            ? <input type="date" value={eng.dateEcheance} onChange={e => setEngagements(prev => prev.map(x => x.id === eng.id ? { ...x, dateEcheance: e.target.value } : x))}
                                className={`text-xs rounded px-1.5 py-0.5 ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-slate-300'} border`} />
                            : eng.dateEcheance}
                        </td>
                        <td className="py-2 px-2 text-center">
                          {setEngagements ? (
                            <button onClick={() => setEngagements(prev => prev.map(x => x.id === eng.id ? { ...x, statut: x.statut === 'ouvert' ? 'solde' : 'ouvert' } : x))}
                              className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${eng.statut === 'solde' ? (darkMode ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-600') : (darkMode ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-50 text-amber-700')}`}>
                              {eng.statut === 'solde' ? <><CheckCircle size={10}/> Soldé</> : 'Ouvert'}
                            </button>
                          ) : (
                            <span className={`text-xs font-bold ${eng.statut === 'solde' ? 'text-emerald-500' : 'text-amber-500'}`}>{eng.statut === 'solde' ? 'Soldé' : 'Ouvert'}</span>
                          )}
                        </td>
                        {setEngagements && (
                          <td className="py-2 pl-2">
                            <button onClick={() => setEngagements(prev => prev.filter(x => x.id !== eng.id))} className={`p-1 rounded ${darkMode ? 'hover:bg-red-900/30 text-gray-500 hover:text-red-400' : 'hover:bg-red-50 text-slate-300 hover:text-red-500'}`}>
                              <Trash2 size={12} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  {engagements.length > 0 && (
                    <tfoot>
                      <tr className={`border-t-2 font-bold ${darkMode ? 'border-gray-600 text-white' : 'border-slate-300 text-slate-800'}`}>
                        <td colSpan={4} className="py-2 pr-3 text-right text-xs uppercase tracking-wide">Total ouverts</td>
                        <td className={`py-2 px-2 text-right ${totalOuverts > 0 ? 'text-amber-500' : (darkMode ? 'text-gray-400' : 'text-slate-500')}`}>
                          {Math.round(totalOuverts).toLocaleString()}
                        </td>
                        <td colSpan={3}></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}
          </div>
        );
      })()}
    </>
  );
}
