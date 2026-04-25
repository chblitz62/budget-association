import React, { useMemo, useState } from 'react';
import { Sparkles, AlertTriangle, AlertCircle, Info, CheckCircle, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import { detecterAnomalies, compterAnomaliesParNiveau } from '../utils/anomaliesHistorique';

const LVL_STYLE = (lvl, dark) => {
  if (lvl === 'error') return {
    bg:    dark ? 'bg-rose-950/30 border-rose-700'   : 'bg-rose-50 border-rose-300',
    badge: dark ? 'bg-rose-700/40 text-rose-200'     : 'bg-rose-100 text-rose-700',
    text:  dark ? 'text-rose-200'                     : 'text-rose-800',
    icon: <AlertTriangle size={16} className={dark ? 'text-rose-400' : 'text-rose-600'} />,
    label: 'Critique',
  };
  if (lvl === 'warning') return {
    bg:    dark ? 'bg-amber-950/30 border-amber-700' : 'bg-amber-50 border-amber-300',
    badge: dark ? 'bg-amber-700/40 text-amber-200'   : 'bg-amber-100 text-amber-700',
    text:  dark ? 'text-amber-200'                    : 'text-amber-800',
    icon: <AlertCircle size={16} className={dark ? 'text-amber-400' : 'text-amber-600'} />,
    label: 'Avertissement',
  };
  return {
    bg:    dark ? 'bg-blue-950/30 border-blue-700'   : 'bg-blue-50 border-blue-300',
    badge: dark ? 'bg-blue-700/40 text-blue-200'     : 'bg-blue-100 text-blue-700',
    text:  dark ? 'text-blue-200'                     : 'text-blue-800',
    icon: <Info size={16} className={dark ? 'text-blue-400' : 'text-blue-600'} />,
    label: 'Info',
  };
};

export default function AuditPredictifPanel({
  darkMode,
  donneesN1,
  kpiGlobaux,
  services,
  direction,
  poleSupport,
  globalParams,
  masseSalarialeTotal,
  getBudgetService,
}) {
  const [expanded, setExpanded] = useState(true);
  const [filterLvl, setFilterLvl] = useState('all');

  const anomalies = useMemo(() =>
    detecterAnomalies({ donneesN1, kpiGlobaux, services, direction, poleSupport, globalParams, masseSalarialeTotal, getBudgetService }),
    [donneesN1, kpiGlobaux, services, direction, poleSupport, globalParams, masseSalarialeTotal, getBudgetService]
  );

  const stats = compterAnomaliesParNiveau(anomalies);
  const filtered = filterLvl === 'all' ? anomalies : anomalies.filter(a => a.lvl === filterLvl);

  return (
    <div className={`rounded-3xl border p-6 mb-6 ${darkMode ? 'bg-zinc-900/80 border-zinc-700/30' : 'bg-white border-slate-100/80'}`}>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-2xl ${darkMode ? 'bg-violet-900/40' : 'bg-violet-100'}`}>
            <Sparkles size={20} className={darkMode ? 'text-violet-300' : 'text-violet-600'} />
          </div>
          <div>
            <h2 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              Audit prédictif — Anomalies budgétaires
            </h2>
            <p className={`text-xs ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
              Détection de sous-provisionnements, dérives N/N-1 et omissions fiscales avant validation
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2 py-1 rounded-lg ${darkMode ? 'bg-zinc-700 text-zinc-300' : 'bg-slate-100 text-slate-600'}`}>
            {stats.total} {stats.total > 1 ? 'anomalies' : 'anomalie'}
          </span>
          <button onClick={() => setExpanded(v => !v)}
            className={`p-2 rounded-xl ${darkMode ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {expanded && (
        <>
          {/* Synthèse */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              { lvl: 'all',     label: 'Total',     count: stats.total,   color: 'slate' },
              { lvl: 'error',   label: 'Critiques', count: stats.error,   color: 'rose' },
              { lvl: 'warning', label: 'Avertis.',  count: stats.warning, color: 'amber' },
              { lvl: 'info',    label: 'Info',      count: stats.info,    color: 'blue' },
            ].map(({ lvl, label, count, color }) => {
              const active = filterLvl === lvl;
              return (
                <button
                  key={lvl}
                  onClick={() => setFilterLvl(lvl)}
                  className={`rounded-2xl p-3 text-left border transition-all ${active
                    ? (darkMode ? `bg-${color}-900/40 border-${color}-600` : `bg-${color}-50 border-${color}-400`)
                    : (darkMode ? 'bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800' : 'bg-slate-50 border-slate-200 hover:bg-white')}`}
                >
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>{label}</p>
                  <p className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{count}</p>
                </button>
              );
            })}
          </div>

          {!donneesN1 && (
            <div className={`rounded-2xl p-3 mb-4 text-xs ${darkMode ? 'bg-blue-900/30 text-blue-300 border border-blue-700' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
              💡 Importez des <strong>données N-1</strong> dans Paramètres pour activer la détection comparative (chute de recettes, dérive de charges, déficits récurrents).
            </div>
          )}

          {/* Liste */}
          {filtered.length === 0 ? (
            <div className={`flex items-center gap-3 p-5 rounded-2xl ${darkMode ? 'bg-emerald-950/30 border border-emerald-800' : 'bg-emerald-50 border border-emerald-200'}`}>
              <CheckCircle size={20} className={darkMode ? 'text-emerald-400' : 'text-emerald-600'} />
              <p className={`text-sm font-bold ${darkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
                {stats.total === 0
                  ? 'Aucune anomalie détectée. Le budget est cohérent au regard des contrôles automatisés.'
                  : `Aucune anomalie ${filterLvl !== 'all' ? `de niveau « ${filterLvl} »` : ''} dans cette catégorie.`}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((a, i) => {
                const s = LVL_STYLE(a.lvl, darkMode);
                return (
                  <div key={a.id || i} className={`rounded-2xl border p-4 ${s.bg}`}>
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 mt-0.5">{s.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${s.badge}`}>
                            {s.label}
                          </span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
                            · {a.categorie}
                          </span>
                        </div>
                        <h4 className={`text-sm font-black mb-1 ${s.text}`}>{a.titre}</h4>
                        <p className={`text-xs leading-relaxed ${darkMode ? 'text-zinc-300' : 'text-slate-600'}`}>{a.message}</p>
                        {a.recommandation && (
                          <div className={`mt-2 flex items-start gap-1.5 text-xs ${darkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
                            <Lightbulb size={12} className="shrink-0 mt-0.5" />
                            <p><span className="font-bold">Levier :</span> {a.recommandation}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
