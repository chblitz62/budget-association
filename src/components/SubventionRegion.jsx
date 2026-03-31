/**
 * SubventionRegion.jsx
 * Calcul de la demande de subvention régionale avec transversalité complète :
 * les coûts sont tirés automatiquement des données RH/Budget de chaque service.
 * Seuls les taux d'éligibilité et de financement sont saisis ici.
 */
import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  Plus, Trash2, FileSpreadsheet, GraduationCap, Building2,
  RotateCcw, Info, CheckCircle, Percent, RefreshCw,
  ChevronDown, ChevronUp, Link, Link2Off, Zap
} from 'lucide-react';

// ─── Valeurs par défaut des taux ─────────────────────────────────────────────

const TAUX_DEFAULT = {
  fi:         70,   // % taux régional pour la FI
  fc:         30,   // % taux régional pour la FC
  transversal: 60,  // % taux régional pour les services transversaux
  manuel:      70,  // % taux pour les lignes manuelles
};

// Clés d'éligibilité par défaut pour les services connus
const ELIG_DEFAULT = {
  // Formations (keyed by service.id)
  'service-1':   100,  // FI Site 1 → 100% éligible
  'service-2':   100,  // FI Site 2 → 100% éligible
  'service-3':   40,   // Formation Continue → partiellement éligible
  // Transversaux
  'direction':   60,
  'poleSupport': 50,
};

const fmt = (n) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n || 0);

// ─── Composant principal ─────────────────────────────────────────────────────

export default function SubventionRegion({
  darkMode,
  services           = [],
  direction          = null,
  poleSupport        = null,
  calculerBudgetService,
  calculerBudgetDirection,
  calculerBudgetPoleSupport,
  personnelEligible  = [],   // agents cochés "Subv." dans RH/Budget → liaison automatique
}) {

  // Taux de financement régional (persistés)
  const [taux, setTaux] = useState(() => {
    try { return { ...TAUX_DEFAULT, ...JSON.parse(localStorage.getItem('subv_taux') || '{}') }; }
    catch { return TAUX_DEFAULT; }
  });

  // Taux d'éligibilité par ligne (persistés)
  const [eligibilite, setEligibilite] = useState(() => {
    try { return { ...ELIG_DEFAULT, ...JSON.parse(localStorage.getItem('subv_eligibilite') || '{}') }; }
    catch { return ELIG_DEFAULT; }
  });

  // Lignes manuelles supplémentaires
  const [lignesManuel, setLignesManuel] = useState(() => {
    try { return JSON.parse(localStorage.getItem('subv_lignes_manuel') || '[]'); }
    catch { return []; }
  });

  // Sections dépliées
  const [open, setOpen] = useState({ formations: true, transversal: true, recap: true });

  // ── Persistance ────────────────────────────────────────────────────────────
  const persist = (t, e, lm) => {
    localStorage.setItem('subv_taux',           JSON.stringify(t));
    localStorage.setItem('subv_eligibilite',    JSON.stringify(e));
    localStorage.setItem('subv_lignes_manuel',  JSON.stringify(lm));
  };

  const setTauxP      = (val)    => { const n = { ...taux, ...val };           setTaux(n);        persist(n, eligibilite, lignesManuel); };
  const setElig       = (k, v)   => { const n = { ...eligibilite, [k]: v };    setEligibilite(n); persist(taux, n, lignesManuel);        };
  const setLignesM    = (lm)     => { setLignesManuel(lm);                                       persist(taux, eligibilite, lm);         };

  // ── Calcul des coûts réels depuis les données budget ───────────────────────
  const budgets = useMemo(() => {
    const out = {};
    services.forEach(s => {
      if (calculerBudgetService) out[`service-${s.id}`] = calculerBudgetService(s);
    });
    if (direction         && calculerBudgetDirection)   out['direction']   = calculerBudgetDirection(direction);
    if (poleSupport       && calculerBudgetPoleSupport) out['poleSupport'] = calculerBudgetPoleSupport(poleSupport);
    return out;
  }, [services, direction, poleSupport, calculerBudgetService, calculerBudgetDirection, calculerBudgetPoleSupport]);

  // ── Construction des lignes formations ─────────────────────────────────────
  const rowsFormations = useMemo(() => {
    return services
      .filter(s => s.type === 'formation')
      .map(s => {
        const key       = `service-${s.id}`;
        const budget    = budgets[key];
        const coutTotal = budget ? budget.total : 0;
        const isFI      = s.useFiliere === true;
        const tauxSubv  = isFI ? taux.fi : taux.fc;
        const tauxElig  = eligibilite[key] ?? (isFI ? 100 : 40);
        const coutEligible = coutTotal * (tauxElig / 100);
        const subvention   = coutEligible * (tauxSubv / 100);
        return { key, id: s.id, nom: s.nom, isFI, coutTotal, tauxElig, tauxSubv, coutEligible, subvention,
                 detail: budget ? { salaires: budget.salaires, exploitation: budget.exploitation } : null };
      });
  }, [services, budgets, taux, eligibilite]);

  // ── Construction des lignes transversales ──────────────────────────────────
  const rowsTransversal = useMemo(() => {
    const rows = [];
    if (budgets['direction']) {
      const b = budgets['direction'];
      const tauxElig = eligibilite['direction'] ?? 60;
      const coutEligible = b.total * (tauxElig / 100);
      rows.push({ key: 'direction', nom: 'Direction & Siège', coutTotal: b.total,
                  tauxElig, tauxSubv: taux.transversal, coutEligible,
                  subvention: coutEligible * (taux.transversal / 100),
                  detail: { salaires: b.salaires, exploitation: b.chargesSiege } });
    }
    if (budgets['poleSupport']) {
      const b = budgets['poleSupport'];
      const tauxElig = eligibilite['poleSupport'] ?? 50;
      const coutEligible = b.total * (tauxElig / 100);
      rows.push({ key: 'poleSupport', nom: 'Pôle Support', coutTotal: b.total,
                  tauxElig, tauxSubv: taux.transversal, coutEligible,
                  subvention: coutEligible * (taux.transversal / 100),
                  detail: { salaires: b.salaires, exploitation: b.exploitation } });
    }
    // Lignes manuelles
    lignesManuel.forEach(l => {
      const coutEligible = l.coutTotal * (l.tauxElig / 100);
      rows.push({ ...l, key: l.id, tauxSubv: taux.manuel, coutEligible,
                  subvention: coutEligible * (taux.manuel / 100), isManuel: true });
    });
    return rows;
  }, [budgets, taux, eligibilite, lignesManuel]);

  // ── Totaux ─────────────────────────────────────────────────────────────────
  const totF = useMemo(() => ({
    coutTotal:    rowsFormations.reduce((s, r) => s + r.coutTotal,    0),
    coutEligible: rowsFormations.reduce((s, r) => s + r.coutEligible, 0),
    subvention:   rowsFormations.reduce((s, r) => s + r.subvention,   0),
  }), [rowsFormations]);
  const totT = useMemo(() => ({
    coutTotal:    rowsTransversal.reduce((s, r) => s + r.coutTotal,    0),
    coutEligible: rowsTransversal.reduce((s, r) => s + r.coutEligible, 0),
    subvention:   rowsTransversal.reduce((s, r) => s + r.subvention,   0),
  }), [rowsTransversal]);
  // ── Masse salariale RH éligible (agents cochés "Subv." depuis l'onglet Budget) ──
  const totRH = useMemo(() => {
    const total     = personnelEligible.reduce((s, p) => s + (p.coutAnnuel || 0), 0);
    const eligible  = personnelEligible.reduce((s, p) => s + (p.coutSubventionnable || 0), 0);
    const subv      = eligible * (taux.fi / 100);
    return { coutTotal: total, coutEligible: eligible, subvention: subv };
  }, [personnelEligible, taux.fi]);

  const grand = {
    coutTotal:    totF.coutTotal    + totT.coutTotal    + totRH.coutTotal,
    coutEligible: totF.coutEligible + totT.coutEligible + totRH.coutEligible,
    subvention:   totF.subvention   + totT.subvention   + totRH.subvention,
  };

  // ── Export Excel ──────────────────────────────────────────────────────────
  const exportExcel = () => {
    const h  = ['Activité / Service', 'Coût total (€)', '% Éligible', 'Coût éligible (€)', 'Taux subvention (%)', 'Subvention (€)'];
    const mk = (r) => [r.nom, Math.round(r.coutTotal), r.tauxElig, Math.round(r.coutEligible), r.tauxSubv, Math.round(r.subvention)];
    const rows = [
      h,
      ['── FORMATIONS ──','','','','',''],
      ...rowsFormations.map(mk),
      ['Sous-total Formations', Math.round(totF.coutTotal),'',Math.round(totF.coutEligible),'',Math.round(totF.subvention)],
      ['','','','','',''],
      ['── SERVICES TRANSVERSAUX ──','','','','',''],
      ...rowsTransversal.map(mk),
      ['Sous-total Transversal', Math.round(totT.coutTotal),'',Math.round(totT.coutEligible),'',Math.round(totT.subvention)],
      ['','','','','',''],
      ['TOTAL GÉNÉRAL', Math.round(grand.coutTotal),'',Math.round(grand.coutEligible),'',Math.round(grand.subvention)],
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 40 },{ wch: 16 },{ wch: 14 },{ wch: 18 },{ wch: 20 },{ wch: 20 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Subvention Région');
    XLSX.writeFile(wb, `subvention_region_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const reset = async () => {
    const ok = await window.appConfirm?.('Réinitialiser la subvention', 'Remettre tous les taux à leurs valeurs par défaut ?', { confirmLabel: 'Réinitialiser' }) ?? window.confirm('Réinitialiser tous les taux de la subvention ?');
    if (!ok) return;
    setTaux(TAUX_DEFAULT);       localStorage.setItem('subv_taux', JSON.stringify(TAUX_DEFAULT));
    setEligibilite(ELIG_DEFAULT);localStorage.setItem('subv_eligibilite', JSON.stringify(ELIG_DEFAULT));
    setLignesM([]);
  };

  // ── Styles ────────────────────────────────────────────────────────────────
  const card  = `rounded-2xl border p-6 mb-6 ${darkMode ? 'bg-gray-800/60 border-white/10' : 'bg-white border-slate-200'}`;
  const th    = `px-3 py-2 text-left text-xs font-black uppercase tracking-wide ${darkMode ? 'text-gray-400' : 'text-slate-500'}`;
  const td    = `px-3 py-2 text-sm ${darkMode ? 'text-gray-200' : 'text-slate-700'}`;
  const tdR   = `px-3 py-2 text-sm text-right font-semibold tabular-nums ${darkMode ? 'text-gray-200' : 'text-slate-700'}`;
  const inp   = `rounded px-2 py-1 text-xs font-semibold outline-none border focus:ring-1 focus:ring-teal-400 ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-slate-300 text-slate-700'}`;

  const sectionIconCls = (color) => {
    if (color === 'purple') return darkMode ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-600';
    if (color === 'blue')   return darkMode ? 'bg-blue-900/30 text-blue-400'   : 'bg-blue-100 text-blue-600';
    return darkMode ? 'bg-teal-900/30 text-teal-400' : 'bg-teal-100 text-teal-600';
  };
  const SectionHead = ({ title, icon, id, color = 'teal', badge }) => (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl ${sectionIconCls(color)}`}>{icon}</div>
        <div>
          <h3 className={`text-base font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>{title}</h3>
          {badge && <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-400'}`}>{badge}</span>}
        </div>
      </div>
      <button onClick={() => setOpen(o => ({ ...o, [id]: !o[id] }))}
        className={`p-1 rounded-lg ${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-slate-400 hover:bg-slate-100'}`}>
        {open[id] ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
      </button>
    </div>
  );

  const EligBar = ({ val, onChange }) => (
    <div className="flex items-center gap-1">
      <input type="number" min={0} max={100} value={val}
        onChange={e => onChange(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
        className={`${inp} w-14 text-center`} />
      <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>%</span>
      <div className={`w-16 h-2 rounded-full ${darkMode ? 'bg-gray-600' : 'bg-slate-200'}`}>
        <div className="h-full rounded-full bg-teal-500 transition-all" style={{ width: `${val}%` }} />
      </div>
    </div>
  );

  const DetailBadge = ({ detail }) => detail ? (
    <div className={`mt-1 flex gap-2 flex-wrap`}>
      <span className={`text-[10px] px-1.5 py-0.5 rounded ${darkMode ? 'bg-indigo-900/60 text-indigo-300' : 'bg-indigo-50 text-indigo-600'}`}>
        👤 Sal. {fmt(detail.salaires)}
      </span>
      {detail.exploitation > 0 && (
        <span className={`text-[10px] px-1.5 py-0.5 rounded ${darkMode ? 'bg-amber-900/60 text-amber-300' : 'bg-amber-50 text-amber-700'}`}>
          🏢 Expl. {fmt(detail.exploitation)}
        </span>
      )}
    </div>
  ) : null;

  // ── Rendu ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto">

      {/* En-tête */}
      <div className={`rounded-3xl border p-8 mb-8 ${darkMode ? 'bg-gradient-to-br from-teal-900/40 to-emerald-900/20 border-teal-800/40' : 'bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-200'}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className={`text-2xl font-black mb-1 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              Demande de Subvention Régionale
            </h2>
            <div className={`flex items-center gap-2 text-sm ${darkMode ? 'text-teal-300' : 'text-teal-700'}`}>
              <Link size={14} className="text-teal-500" />
              Coûts synchronisés depuis RH &amp; Budget — saisissez uniquement les taux d'éligibilité
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={reset}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 border-gray-600' : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'}`}>
              <RotateCcw size={13}/> Réinitialiser taux
            </button>
            <button onClick={exportExcel}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-900/20">
              <FileSpreadsheet size={15}/> Exporter Excel
            </button>
          </div>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          {[
            { label: 'Coût total déclaré',  val: fmt(grand.coutTotal),    sub: 'Issu des budgets RH' },
            { label: 'Coût éligible total', val: fmt(grand.coutEligible), sub: 'Après application des % éligibles' },
            { label: 'Subvention demandée', val: fmt(grand.subvention),   sub: `Taux moyen ${grand.coutEligible > 0 ? (grand.subvention/grand.coutEligible*100).toFixed(0) : 0}%` },
          ].map(k => (
            <div key={k.label} className={`rounded-2xl p-4 text-center border ${darkMode ? 'bg-gray-800/60 border-white/10' : 'bg-white border-slate-200'} shadow-sm`}>
              <div className={`text-xs font-bold uppercase mb-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{k.label}</div>
              <div className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>{k.val}</div>
              <div className={`text-[10px] mt-1 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>{k.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Taux de financement régional */}
      <div className={card}>
        <h3 className={`text-base font-black flex items-center gap-2 mb-4 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
          <Percent size={18} className="text-teal-500"/> Taux de financement régional
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { field: 'fi',          label: 'Formation Initiale',   pct: 'text-purple-500' },
            { field: 'fc',          label: 'Formation Continue',   pct: 'text-blue-500'   },
            { field: 'transversal', label: 'Services transversaux',pct: 'text-indigo-500' },
            { field: 'manuel',      label: 'Lignes manuelles',     pct: 'text-orange-500' },
          ].map(({ field, label, pct }) => (
            <div key={field} className={`p-4 rounded-xl border ${darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-slate-50 border-slate-200'}`}>
              <label className={`block text-xs font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>{label}</label>
              <div className="flex items-center gap-2">
                <input type="number" min={0} max={100} step={1} value={taux[field]}
                  onChange={e => setTauxP({ [field]: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)) })}
                  className={`${inp} w-20 text-center text-lg`} />
                <span className={`font-black ${pct}`}>%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Formations */}
      <div className={card}>
        <SectionHead title="Formations" icon={<GraduationCap size={20}/>} id="formations" color="purple"
          badge={`${rowsFormations.length} services · coûts synchronisés depuis Budget`} />
        {open.formations && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
                  <th className={th}>Service</th>
                  <th className={`${th} text-right`}>Coût réel annuel</th>
                  <th className={`${th} text-center`}>% Éligible FI</th>
                  <th className={`${th} text-right`}>Coût éligible</th>
                  <th className={`${th} text-center`}>Taux Région</th>
                  <th className={`${th} text-right`}>Subvention</th>
                </tr>
              </thead>
              <tbody>
                {rowsFormations.map(r => (
                  <tr key={r.key} className={`border-b ${darkMode ? 'border-gray-700/40 hover:bg-gray-700/30' : 'border-slate-100 hover:bg-slate-50'}`}>
                    <td className={td}>
                      <div className="font-semibold">{r.nom}</div>
                      {r.detail && <DetailBadge detail={r.detail} />}
                    </td>
                    <td className={`${tdR}`}>
                      <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{fmt(r.coutTotal)}</span>
                      <div className={`text-[10px] flex items-center justify-end gap-1 mt-0.5 ${darkMode ? 'text-teal-400' : 'text-teal-600'}`}>
                        <RefreshCw size={9}/> synchronisé RH
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <EligBar val={r.tauxElig} onChange={v => setElig(r.key, v)} />
                    </td>
                    <td className={tdR}>{fmt(r.coutEligible)}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`text-xs font-black px-2 py-0.5 rounded-full ${r.isFI ? (darkMode ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-700') : (darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700')}`}>
                        {r.tauxSubv}%
                      </span>
                    </td>
                    <td className={`${tdR} font-black ${darkMode ? 'text-teal-300' : 'text-teal-700'}`}>{fmt(r.subvention)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className={`${darkMode ? 'bg-purple-900/20' : 'bg-purple-50'}`}>
                  <td className={`${td} font-black`}>Sous-total Formations</td>
                  <td className={`${tdR} font-black`}>{fmt(totF.coutTotal)}</td>
                  <td></td>
                  <td className={`${tdR} font-black`}>{fmt(totF.coutEligible)}</td>
                  <td></td>
                  <td className={`${tdR} font-black ${darkMode ? 'text-teal-300' : 'text-teal-700'}`}>{fmt(totF.subvention)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Services transversaux */}
      <div className={card}>
        <SectionHead title="Siège & Services transversaux" icon={<Building2 size={20}/>} id="transversal" color="blue"
          badge="Siège, Pôle Ressource + lignes manuelles" />
        {open.transversal && (
          <>
            <div className={`mb-4 p-3 rounded-xl text-xs flex items-start gap-2 ${darkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>
              <Info size={13} className="flex-shrink-0 mt-0.5"/>
              Le <strong>% éligible</strong> représente la part du coût imputable à la Formation Initiale (ex : 60% du temps de la Direction est dédié à la FI).
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
                    <th className={th}>Service</th>
                    <th className={`${th} text-right`}>Coût réel annuel</th>
                    <th className={`${th} text-center`}>% Éligible FI</th>
                    <th className={`${th} text-right`}>Coût éligible</th>
                    <th className={`${th} text-center`}>Taux Région</th>
                    <th className={`${th} text-right`}>Subvention</th>
                    <th className={th}></th>
                  </tr>
                </thead>
                <tbody>
                  {rowsTransversal.map(r => (
                    <tr key={r.key} className={`border-b ${darkMode ? 'border-gray-700/40 hover:bg-gray-700/30' : 'border-slate-100 hover:bg-slate-50'}`}>
                      <td className={td}>
                        {r.isManuel ? (
                          <input value={r.nom} onChange={e => setLignesM(lignesManuel.map(l => l.id === r.key ? { ...l, nom: e.target.value } : l))}
                            className={`${inp} w-full`} />
                        ) : (
                          <>
                            <div className="font-semibold">{r.nom}</div>
                            {r.detail && <DetailBadge detail={r.detail} />}
                          </>
                        )}
                      </td>
                      <td className={tdR}>
                        {r.isManuel ? (
                          <input type="number" min={0} step={1000} value={r.coutTotal}
                            onChange={e => setLignesM(lignesManuel.map(l => l.id === r.key ? { ...l, coutTotal: Math.max(0, parseFloat(e.target.value) || 0) } : l))}
                            className={`${inp} text-right w-28`} />
                        ) : (
                          <>
                            <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{fmt(r.coutTotal)}</span>
                            <div className={`text-[10px] flex items-center justify-end gap-1 mt-0.5 ${darkMode ? 'text-teal-400' : 'text-teal-600'}`}>
                              <RefreshCw size={9}/> synchronisé RH
                            </div>
                          </>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <EligBar val={r.tauxElig}
                          onChange={v => r.isManuel
                            ? setLignesM(lignesManuel.map(l => l.id === r.key ? { ...l, tauxElig: v } : l))
                            : setElig(r.key, v)} />
                      </td>
                      <td className={tdR}>{fmt(r.coutEligible)}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`text-xs font-black px-2 py-0.5 rounded-full ${darkMode ? 'bg-indigo-900 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>
                          {r.tauxSubv}%
                        </span>
                      </td>
                      <td className={`${tdR} font-black ${darkMode ? 'text-teal-300' : 'text-teal-700'}`}>{fmt(r.subvention)}</td>
                      <td className="px-2 py-2">
                        {r.isManuel && (
                          <button onClick={() => setLignesM(lignesManuel.filter(l => l.id !== r.key))}
                            className={`p-1 rounded ${darkMode ? 'text-red-400 hover:bg-red-900/30' : 'text-red-400 hover:bg-red-50'}`}
                            title="Supprimer"><Trash2 size={13}/></button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className={`${darkMode ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                    <td className={`${td} font-black`}>Sous-total Transversal</td>
                    <td className={`${tdR} font-black`}>{fmt(totT.coutTotal)}</td>
                    <td></td>
                    <td className={`${tdR} font-black`}>{fmt(totT.coutEligible)}</td>
                    <td></td>
                    <td className={`${tdR} font-black ${darkMode ? 'text-teal-300' : 'text-teal-700'}`}>{fmt(totT.subvention)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <button
              onClick={() => setLignesM([...lignesManuel, { id: `m-${Date.now()}`, nom: 'Nouveau service', coutTotal: 0, tauxElig: 50 }])}
              className={`mt-3 w-full py-2 rounded-xl border-2 border-dashed text-xs font-bold flex items-center justify-center gap-1 ${darkMode ? 'border-blue-700 text-blue-400 hover:bg-blue-900/20' : 'border-blue-200 text-blue-500 hover:bg-blue-50'}`}>
              <Plus size={13}/> Ajouter une ligne manuelle
            </button>
          </>
        )}
      </div>

      {/* Personnel RH éligible (liaison automatique depuis onglet Budget) */}
      {personnelEligible.length > 0 && (
        <div className={card}>
          <div className="flex items-center gap-2 mb-4">
            <span className={`p-2 rounded-xl ${sectionIconCls('purple')}`}><Zap size={18}/></span>
            <div>
              <h3 className={`font-black text-base ${darkMode ? 'text-white' : 'text-slate-800'}`}>Masse salariale RH éligible</h3>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Agents cochés « Subv. » dans l'onglet Budget — liaison automatique</p>
            </div>
            <span className={`ml-auto px-3 py-1 rounded-full text-xs font-bold ${darkMode ? 'bg-violet-900/40 text-violet-300' : 'bg-violet-100 text-violet-700'}`}>
              {personnelEligible.length} agent{personnelEligible.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={darkMode ? 'bg-gray-700' : 'bg-slate-50'}>
                  <th className={th}>Agent</th>
                  <th className={th}>Service</th>
                  <th className={`${th} text-right`}>Coût annuel</th>
                  <th className={`${th} text-right`}>% FI</th>
                  <th className={`${th} text-right`}>Coût subventionnable</th>
                  <th className={`${th} text-right`}>Subvention ({taux.fi}%)</th>
                </tr>
              </thead>
              <tbody>
                {personnelEligible.map(p => (
                  <tr key={p.id} className={`border-b ${darkMode ? 'border-gray-700' : 'border-slate-100'}`}>
                    <td className={td}>{p.titre || 'Sans nom'}</td>
                    <td className={`${td} text-xs ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>{p._source}</td>
                    <td className={tdR}>{fmt(p.coutAnnuel)}</td>
                    <td className={`${tdR} text-xs`}>{p.pctFI}%</td>
                    <td className={tdR}>{fmt(p.coutSubventionnable)}</td>
                    <td className={`${tdR} font-black ${darkMode ? 'text-violet-300' : 'text-violet-700'}`}>{fmt(p.coutSubventionnable * taux.fi / 100)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className={`font-black ${darkMode ? 'bg-violet-900/20 text-violet-300' : 'bg-violet-50 text-violet-800'}`}>
                  <td className={td} colSpan={2}>Sous-total Personnel RH éligible</td>
                  <td className={tdR}>{fmt(totRH.coutTotal)}</td>
                  <td />
                  <td className={tdR}>{fmt(totRH.coutEligible)}</td>
                  <td className={tdR}>{fmt(totRH.subvention)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Récapitulatif */}
      <div className={card}>
        <SectionHead title="Récapitulatif – Demande de subvention" icon={<CheckCircle size={20}/>} id="recap" color="teal" />
        {open.recap && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`${darkMode ? 'bg-gray-700' : 'bg-slate-100'}`}>
                    <th className={th} style={{ width: '38%' }}>Activité / Service</th>
                    <th className={`${th} text-right`}>Coût total (€)</th>
                    <th className={`${th} text-center`}>Éligible</th>
                    <th className={`${th} text-right`}>Coût éligible (€)</th>
                    <th className={`${th} text-center`}>Taux</th>
                    <th className={`${th} text-right`}>Subvention (€)</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Formations */}
                  <tr className={darkMode ? 'bg-purple-900/30' : 'bg-purple-50'}>
                    <td className={`${td} font-black text-purple-500`} colSpan={6}>Formations</td>
                  </tr>
                  {rowsFormations.map(r => (
                    <tr key={r.key} className={`border-b ${darkMode ? 'border-gray-700/50' : 'border-slate-100'}`}>
                      <td className={`${td} pl-6`}>{r.nom}</td>
                      <td className={tdR}>{fmt(r.coutTotal)}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${darkMode ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>{r.tauxElig}%</span>
                      </td>
                      <td className={tdR}>{fmt(r.coutEligible)}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${darkMode ? 'bg-teal-900 text-teal-300' : 'bg-teal-100 text-teal-700'}`}>{r.tauxSubv}%</span>
                      </td>
                      <td className={`${tdR} font-black ${darkMode ? 'text-teal-300' : 'text-teal-700'}`}>{fmt(r.subvention)}</td>
                    </tr>
                  ))}
                  <tr className={`border-b-2 ${darkMode ? 'bg-purple-900/20 border-purple-800' : 'bg-purple-50 border-purple-200'}`}>
                    <td className={`${td} font-black pl-4`}>Sous-total Formations</td>
                    <td className={`${tdR} font-black`}>{fmt(totF.coutTotal)}</td>
                    <td></td>
                    <td className={`${tdR} font-black`}>{fmt(totF.coutEligible)}</td>
                    <td></td>
                    <td className={`${tdR} font-black ${darkMode ? 'text-teal-300' : 'text-teal-700'}`}>{fmt(totF.subvention)}</td>
                  </tr>

                  {/* Transversal */}
                  <tr className={darkMode ? 'bg-blue-900/30' : 'bg-blue-50'}>
                    <td className={`${td} font-black text-blue-500`} colSpan={6}>Siège & Services transversaux</td>
                  </tr>
                  {rowsTransversal.map(r => (
                    <tr key={r.key} className={`border-b ${darkMode ? 'border-gray-700/50' : 'border-slate-100'}`}>
                      <td className={`${td} pl-6`}>{r.nom}</td>
                      <td className={tdR}>{fmt(r.coutTotal)}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>{r.tauxElig}%</span>
                      </td>
                      <td className={tdR}>{fmt(r.coutEligible)}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${darkMode ? 'bg-teal-900 text-teal-300' : 'bg-teal-100 text-teal-700'}`}>{r.tauxSubv}%</span>
                      </td>
                      <td className={`${tdR} font-black ${darkMode ? 'text-teal-300' : 'text-teal-700'}`}>{fmt(r.subvention)}</td>
                    </tr>
                  ))}
                  <tr className={`border-b-2 ${darkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'}`}>
                    <td className={`${td} font-black pl-4`}>Sous-total Transversal</td>
                    <td className={`${tdR} font-black`}>{fmt(totT.coutTotal)}</td>
                    <td></td>
                    <td className={`${tdR} font-black`}>{fmt(totT.coutEligible)}</td>
                    <td></td>
                    <td className={`${tdR} font-black ${darkMode ? 'text-teal-300' : 'text-teal-700'}`}>{fmt(totT.subvention)}</td>
                  </tr>

                  {/* Grand total */}
                  <tr className={darkMode ? 'bg-teal-900/40' : 'bg-teal-50'}>
                    <td className={`${td} font-black text-lg ${darkMode ? 'text-white' : 'text-slate-800'}`}>TOTAL GÉNÉRAL</td>
                    <td className={`${tdR} font-black text-base ${darkMode ? 'text-white' : 'text-slate-800'}`}>{fmt(grand.coutTotal)}</td>
                    <td></td>
                    <td className={`${tdR} font-black text-base ${darkMode ? 'text-white' : 'text-slate-800'}`}>{fmt(grand.coutEligible)}</td>
                    <td></td>
                    <td className={`${tdR} font-black text-lg ${darkMode ? 'text-teal-300' : 'text-teal-700'}`}>{fmt(grand.subvention)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Indicateurs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              {[
                { label: '% coûts éligibles', val: grand.coutTotal > 0 ? `${(grand.coutEligible/grand.coutTotal*100).toFixed(1)}%` : '—' },
                { label: 'Taux de couverture global', val: grand.coutTotal > 0 ? `${(grand.subvention/grand.coutTotal*100).toFixed(1)}%` : '—' },
                { label: 'Autofinancement estimé', val: fmt(grand.coutTotal - grand.subvention) },
                { label: 'Subvention / coût éligible', val: grand.coutEligible > 0 ? `${(grand.subvention/grand.coutEligible*100).toFixed(1)}%` : '—' },
              ].map(k => (
                <div key={k.label} className={`p-4 rounded-xl text-center border ${darkMode ? 'bg-gray-700/60 border-gray-600' : 'bg-white border-slate-200'}`}>
                  <div className={`text-xs font-bold mb-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{k.label}</div>
                  <div className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>{k.val}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
