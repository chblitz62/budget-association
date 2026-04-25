import React, { useState, useMemo } from 'react';
import { Clock, Edit3, X, RotateCcw } from 'lucide-react';

const MOIS_KEYS = ['janvier','fevrier','mars','avril','mai','juin','juillet','aout','septembre','octobre','novembre','decembre'];
const MOIS_COURTS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Août','Sep','Oct','Nov','Déc'];

const TYPES = [
  { key: 'fc',    label: 'FC',              color: '#F59E0B', dark: '#FBBF24' },
  { key: 'fi',    label: 'FI',              color: '#2DD4BF', dark: '#5EEAD4' },
  { key: 'admin', label: 'Administratif',   color: '#A78BFA', dark: '#C4B5FD' },
  { key: 'coord', label: 'Coord./Réunions', color: '#60A5FA', dark: '#93C5FD' },
  { key: 'autre', label: 'Autre',           color: '#94A3B8', dark: '#CBD5E1' },
];

const ABS = {
  conge:   { color: '#BAE6FD', label: 'Congé/RTT' },
  maladie: { color: '#FCA5A5', label: 'Maladie/Arrêt' },
  absent:  { color: '#E2E8F0', label: 'Absence' },
};

// Infer default activity from role
function inferType(agent) {
  const role = (agent.role || '').toLowerCase();
  if (['formateur', 'responsable'].includes(role)) return 'fc';
  if (['direction', 'directeur_adjoint'].includes(role)) return 'coord';
  return 'admin';
}

// Approx absence fraction for a month from agent.absences (date ranges)
function absenceMois(agent, moisIdx) {
  const y = 2026;
  const debut = new Date(y, moisIdx, 1);
  const fin = new Date(y, moisIdx + 1, 0);
  let jours = 0;
  let type = 'absent';
  (agent.absences || []).forEach(ab => {
    if (!ab.dateDebut || !ab.dateFin) return;
    const d = new Date(ab.dateDebut);
    const f = new Date(ab.dateFin);
    if (d > fin || f < debut) return;
    const overlap = (Math.min(f, fin) - Math.max(d, debut)) / 86400000 + 1;
    jours += Math.max(0, overlap);
    if (ab.type === 'maladie' || ab.type === 'arret') type = 'maladie';
    else if (type !== 'maladie') type = 'conge';
  });
  return { pct: Math.min(100, (jours / 22) * 100), type };
}

// Compute allocation for one agent + one month
function getAlloc(agent, moisKey, moisIdx, repartitionTemps) {
  const override = repartitionTemps?.[agent.id]?.[moisKey];
  let base;
  if (override) {
    base = override;
  } else {
    const rfc = agent.repartitionFC || agent.repartitionFI;
    if (rfc) {
      const pctFC = rfc[moisKey] || 0;
      base = { fc: pctFC, fi: Math.max(0, 100 - pctFC), admin: 0, coord: 0, autre: 0 };
    } else {
      const t = inferType(agent);
      base = { fc: 0, fi: 0, admin: 0, coord: 0, autre: 0 };
      base[t] = 100;
    }
  }
  const abs = absenceMois(agent, moisIdx);
  return { ...base, _absPct: abs.pct, _absType: abs.type };
}

// ─────────────────────────────────────────────────────────────────────────────

export default function TabRepartitionTemps({ direction, poleSupport, services, poolRH, darkMode, repartitionTemps, setRepartitionTemps, privacyMode }) {
  const dm = darkMode;
  const [editAgent, setEditAgent] = useState(null);
  const [editData,  setEditData]  = useState({});
  const [tooltip,   setTooltip]   = useState(null);

  const groupes = useMemo(() => {
    const g = [];
    if ((direction?.personnel || []).length > 0)
      g.push({ id: 'dir', label: 'Direction / Siège',   agents: direction.personnel });
    if ((poleSupport?.personnel || []).length > 0)
      g.push({ id: 'ps',  label: 'Pôle Ressources',     agents: poleSupport.personnel });
    services.forEach(s => {
      if ((s.personnel || []).length > 0)
        g.push({ id: `s${s.id}`, label: s.nom, agents: s.personnel });
    });
    if ((poolRH || []).length > 0)
      g.push({ id: 'pool', label: 'Pool RH', agents: poolRH, isPoolRH: true });
    return g;
  }, [direction, poleSupport, services, poolRH]);

  // Open edit modal, pre-fill from current alloc
  const openEdit = agent => {
    const init = {};
    MOIS_KEYS.forEach((m, i) => {
      const a = getAlloc(agent, m, i, repartitionTemps);
      init[m] = {
        fc:    Math.round(a.fc    || 0),
        fi:    Math.round(a.fi    || 0),
        admin: Math.round(a.admin || 0),
        coord: Math.round(a.coord || 0),
        autre: Math.round(a.autre || 0),
      };
    });
    setEditData(init);
    setEditAgent(agent);
  };

  const saveEdit = () => {
    setRepartitionTemps(prev => ({ ...prev, [editAgent.id]: editData }));
    setEditAgent(null);
  };

  const resetAgent = id => {
    setRepartitionTemps(prev => { const n = { ...prev }; delete n[id]; return n; });
    setEditAgent(null);
  };

  // Propagate a month's values to all 12 months (quick fill)
  const propagate = moisSrc => {
    const src = editData[moisSrc];
    setEditData(prev => {
      const n = { ...prev };
      MOIS_KEYS.forEach(m => { n[m] = { ...src }; });
      return n;
    });
  };

  return (
    <div className="space-y-4">

      {/* ── Main panel ─────────────────────────────────────────────────────── */}
      <div className={`rounded-2xl border p-5 ${dm ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-slate-200'}`}>

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <h2 className={`text-lg font-black flex items-center gap-2 ${dm ? 'text-white' : 'text-slate-800'}`}>
            <Clock size={20} className="text-teal-500" />
            Répartition du temps de travail — 2026
          </h2>
          {/* Légende */}
          <div className="flex flex-wrap gap-3">
            {TYPES.map(t => (
              <div key={t.key} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: dm ? t.dark : t.color }} />
                <span className={`text-xs font-semibold ${dm ? 'text-zinc-400' : 'text-slate-600'}`}>{t.label}</span>
              </div>
            ))}
            {[ABS.conge, ABS.maladie].map((a, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm flex-shrink-0 border border-slate-300/50" style={{ background: a.color }} />
                <span className={`text-xs font-semibold ${dm ? 'text-zinc-400' : 'text-slate-600'}`}>{a.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Mois header */}
        <div className="flex pl-48 pr-8">
          {MOIS_COURTS.map(m => (
            <div key={m} className={`flex-1 text-center text-[10px] font-bold pb-1 ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>{m}</div>
          ))}
        </div>

        {/* Groupes */}
        {groupes.map(groupe => (
          <div key={groupe.id} className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`h-px flex-1 ${dm ? 'bg-zinc-700' : 'bg-slate-200'}`} />
              <span className={`text-[10px] font-black uppercase tracking-widest px-2 ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>{groupe.label}</span>
              <div className={`h-px flex-1 ${dm ? 'bg-zinc-700' : 'bg-slate-200'}`} />
            </div>

            {groupe.agents.map(agent => {
              const hasOverride = !!repartitionTemps?.[agent.id];
              return (
                <div key={agent.id} className="flex items-center mb-1 group">
                  {/* Nom */}
                  <div className="w-44 pr-2 flex items-center justify-end gap-1 flex-shrink-0">
                    <span className={`text-xs font-semibold truncate text-right leading-tight ${dm ? 'text-zinc-300' : 'text-slate-700'} ${privacyMode ? 'blur-sm select-none' : ''}`}>
                      {agent.titre || 'Agent'}
                    </span>
                    {hasOverride && (
                      <span className="text-[8px] text-violet-500 font-black flex-shrink-0" title="Répartition personnalisée">●</span>
                    )}
                    <button
                      onClick={() => openEdit(agent)}
                      className={`opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 p-0.5 rounded no-print ${dm ? 'text-zinc-500 hover:text-zinc-100' : 'text-slate-300 hover:text-slate-600'}`}
                      title="Modifier la répartition"
                    >
                      <Edit3 size={11} />
                    </button>
                  </div>

                  {/* Barres mensuelles */}
                  {MOIS_KEYS.map((mKey, mIdx) => {
                    const a = getAlloc(agent, mKey, mIdx, repartitionTemps);
                    const absPct  = a._absPct  || 0;
                    const absType = a._absType  || 'absent';
                    const travail = TYPES.filter(t => (a[t.key] || 0) > 0.4);
                    const totalTravail = travail.reduce((s, t) => s + (a[t.key] || 0), 0);
                    const vide = Math.max(0, 100 - totalTravail - absPct);

                    return (
                      <div
                        key={mIdx}
                        className={`flex-1 mx-px rounded overflow-hidden flex flex-col cursor-default transition-opacity hover:opacity-80 ${dm ? 'bg-zinc-800' : 'bg-slate-100'}`}
                        style={{ height: '34px' }}
                        onMouseEnter={e => setTooltip({ agent, mLabel: MOIS_COURTS[mIdx], a, absPct, absType, x: e.clientX, y: e.clientY })}
                        onMouseLeave={() => setTooltip(null)}
                        onClick={() => openEdit(agent)}
                      >
                        {travail.map(t => (
                          <div key={t.key} style={{ flex: a[t.key], background: dm ? t.dark : t.color, minHeight: a[t.key] > 2 ? '2px' : '1px' }} />
                        ))}
                        {absPct > 0.5 && (
                          <div style={{ flex: absPct, background: ABS[absType]?.color || ABS.absent.color }} />
                        )}
                        {vide > 0.5 && (
                          <div style={{ flex: vide, background: dm ? '#27272a' : '#f8fafc' }} />
                        )}
                      </div>
                    );
                  })}
                  <div className="w-6 flex-shrink-0" />
                </div>
              );
            })}
          </div>
        ))}

        {groupes.length === 0 && (
          <p className={`text-sm text-center py-10 ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
            Aucun agent — ajoutez du personnel dans les onglets Budget et RH.
          </p>
        )}
      </div>

      {/* ── Tooltip ────────────────────────────────────────────────────────── */}
      {tooltip && (
        <div
          className={`fixed z-50 p-3 rounded-xl shadow-2xl text-xs pointer-events-none border ${dm ? 'bg-zinc-800 border-zinc-600 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
          style={{ left: Math.min(tooltip.x + 14, window.innerWidth - 210), top: Math.max(10, tooltip.y - 100) }}
        >
          <div className="font-black mb-2"><span className={privacyMode ? 'blur-sm select-none' : ''}>{tooltip.agent.titre}</span> — {tooltip.mLabel}</div>
          {TYPES.filter(t => (tooltip.a[t.key] || 0) > 0.4).map(t => (
            <div key={t.key} className="flex items-center gap-2 mb-0.5">
              <div className="w-2 h-2 rounded-sm" style={{ background: t.color }} />
              <span>{t.label} : <strong>{Math.round(tooltip.a[t.key])}%</strong></span>
            </div>
          ))}
          {tooltip.absPct > 0.5 && (
            <div className="flex items-center gap-2 mt-1 pt-1 border-t border-slate-200/30">
              <div className="w-2 h-2 rounded-sm" style={{ background: ABS[tooltip.absType]?.color }} />
              <span>{ABS[tooltip.absType]?.label} : <strong>~{Math.round(tooltip.absPct)}%</strong></span>
            </div>
          )}
          <div className={`mt-1.5 text-[10px] ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>Cliquer pour modifier</div>
        </div>
      )}

      {/* ── Modale d'édition ───────────────────────────────────────────────── */}
      {editAgent && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setEditAgent(null)}>
          <div
            className={`w-full max-w-5xl rounded-2xl shadow-2xl p-6 my-4 ${dm ? 'bg-gray-800' : 'bg-white'}`}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between mb-5">
              <h3 className={`text-lg font-black ${dm ? 'text-white' : 'text-slate-800'}`}>
                <Edit3 size={18} className="inline mr-2 text-teal-500" />
                <span className={privacyMode ? 'blur-sm select-none' : ''}>{editAgent.titre}</span>
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => resetAgent(editAgent.id)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold ${dm ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  <RotateCcw size={12} /> Réinitialiser (auto)
                </button>
                <button onClick={saveEdit} className="flex items-center gap-1.5 bg-teal-500 text-white px-4 py-1.5 rounded-lg font-bold text-xs hover:bg-teal-600">
                  Enregistrer
                </button>
                <button onClick={() => setEditAgent(null)} className={`p-1.5 rounded-lg ${dm ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-slate-100 text-slate-400'}`}>
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Grille type × mois */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-separate border-spacing-0.5">
                <thead>
                  <tr>
                    <th className={`text-left py-1 pr-3 w-28 ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>Activité</th>
                    {MOIS_COURTS.map((m, i) => (
                      <th key={m} className={`text-center py-1 w-[68px] ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>
                        <div>{m}</div>
                        <button
                          onClick={() => propagate(MOIS_KEYS[i])}
                          className={`text-[9px] font-normal opacity-50 hover:opacity-100 ${dm ? 'text-zinc-400' : 'text-slate-400'}`}
                          title={`Appliquer ${m} à toute l'année`}
                        >
                          → tous
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TYPES.map(t => (
                    <tr key={t.key}>
                      <td className="py-1 pr-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: t.color }} />
                          <span className={`font-semibold ${dm ? 'text-zinc-200' : 'text-slate-700'}`}>{t.label}</span>
                        </div>
                      </td>
                      {MOIS_KEYS.map((mKey, mIdx) => {
                        const val   = editData[mKey]?.[t.key] ?? 0;
                        const total = TYPES.reduce((s, tt) => s + (editData[mKey]?.[tt.key] ?? 0), 0);
                        const over  = total > 100;
                        return (
                          <td key={mIdx} className="py-0.5">
                            <input
                              type="number" min="0" max="100"
                              className={`w-full text-center rounded-lg px-1 py-1 font-bold outline-none border-2 transition-colors ${
                                val > 0
                                  ? dm ? 'border-transparent' : 'border-transparent'
                                  : dm ? 'opacity-30 border-zinc-600' : 'opacity-30 border-slate-200'
                              } ${over ? 'border-red-400 bg-red-50 text-red-700' : val > 0 ? (dm ? 'bg-zinc-700 text-white border-zinc-500' : 'bg-slate-50 text-slate-800 border-slate-300') : (dm ? 'bg-zinc-800 text-zinc-500' : 'bg-slate-50 text-slate-400')}`}
                              style={val > 0 && !over ? { borderColor: t.color + '80', background: t.color + '18' } : undefined}
                              value={val}
                              onChange={e => setEditData(prev => ({
                                ...prev,
                                [mKey]: { ...prev[mKey], [t.key]: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) }
                              }))}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {/* Ligne total */}
                  <tr className={`border-t ${dm ? 'border-zinc-600' : 'border-slate-200'}`}>
                    <td className={`py-1 pr-3 font-black ${dm ? 'text-zinc-300' : 'text-slate-600'}`}>Total %</td>
                    {MOIS_KEYS.map((mKey, mIdx) => {
                      const total = TYPES.reduce((s, t) => s + (editData[mKey]?.[t.key] ?? 0), 0);
                      return (
                        <td key={mIdx} className="py-1 text-center">
                          <span className={`font-black text-xs ${total > 100 ? 'text-red-500' : total === 100 ? 'text-emerald-500' : dm ? 'text-zinc-400' : 'text-slate-500'}`}>
                            {total}%
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Aperçu barre */}
            <div className="mt-5">
              <div className={`text-xs font-bold mb-1.5 ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>Aperçu</div>
              <div className="flex gap-0.5">
                {MOIS_KEYS.map((mKey, mIdx) => {
                  const alloc = editData[mKey] || {};
                  const total = TYPES.reduce((s, t) => s + (alloc[t.key] || 0), 0);
                  return (
                    <div key={mIdx} title={MOIS_COURTS[mIdx]} className="flex-1 rounded overflow-hidden flex flex-col" style={{ height: '28px' }}>
                      {TYPES.filter(t => (alloc[t.key] || 0) > 0).map(t => (
                        <div key={t.key} style={{ flex: alloc[t.key], background: dm ? t.dark : t.color }} />
                      ))}
                      {total < 100 && <div style={{ flex: 100 - total, background: dm ? '#27272a' : '#f1f5f9' }} />}
                    </div>
                  );
                })}
              </div>
              <div className="flex mt-0.5">
                {MOIS_COURTS.map(m => (
                  <div key={m} className={`flex-1 text-center text-[9px] ${dm ? 'text-zinc-600' : 'text-slate-300'}`}>{m}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
