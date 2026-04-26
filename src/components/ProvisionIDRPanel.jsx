import React, { useMemo, useState } from 'react';
import { TrendingUp, ChevronDown, ChevronUp, Settings, Download } from 'lucide-react';
import { calculerProvisionIDR, DEFAULT_IDR_HYPOTHESES } from '../utils/provisionIDR';
import DataTable from './ui/DataTable';

const fmt = (n) => Math.round(n || 0).toLocaleString('fr-FR') + ' €';
const pct = (n, d = 1) => (n * 100).toFixed(d) + ' %';

export default function ProvisionIDRPanel({ darkMode, direction, services, poleSupport, globalParams, setGlobalParams, dafLocked = false }) {
  const [expanded, setExpanded] = useState(false);
  const [showHyp, setShowHyp] = useState(false);

  const idr = useMemo(
    () => calculerProvisionIDR(direction, services, poleSupport, globalParams),
    [direction, services, poleSupport, globalParams]
  );

  const updateHypothese = (key, value) => {
    if (dafLocked) return;
    const v = parseFloat(value);
    if (!Number.isFinite(v)) return;
    setGlobalParams({
      ...globalParams,
      idrHypotheses: { ...(globalParams?.idrHypotheses || {}), [key]: v },
    });
  };

  const exportCSV = () => {
    const head = ['Agent', 'Source', 'Âge', 'Ancienneté', 'Années restantes', 'Salaire brut mensuel (€)', 'Provision nominale (€)', 'Provision UCP (€)', 'Avec charges (€)'];
    const rows = idr.agents.map(a => [a.nom, a.source, a.age, a.anciennete, a.anneesRestantes, a.salaireBrutMensuel, a.provisionNominale, a.provisionUCP, a.provisionAvecCharges]);
    const csv = [head, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `provision_idr_${idr.anneeRef}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const dm = darkMode;
  const inputCls = `w-24 px-2 py-1 rounded-lg text-xs font-mono ${dm ? 'bg-zinc-800 border border-zinc-700 text-white' : 'bg-white border border-slate-300 text-slate-700'} ${dafLocked ? 'opacity-60 cursor-not-allowed' : ''}`;

  return (
    <div className={`rounded-3xl border p-6 mb-6 ${dm ? 'bg-zinc-900/80 border-zinc-700/30' : 'bg-white border-slate-100/80'}`}>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-2xl ${dm ? 'bg-amber-900/40' : 'bg-amber-100'}`}>
            <TrendingUp size={20} className={dm ? 'text-amber-300' : 'text-amber-600'} />
          </div>
          <div>
            <h2 className={`text-lg font-black ${dm ? 'text-white' : 'text-slate-800'}`}>
              Provision IDR actuarielle — {idr.anneeRef}
            </h2>
            <p className={`text-xs ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>
              Méthode UCP / IAS 19 — Recommandation ANC 2013-02 — {idr.agents.length} agent(s) intégré(s)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowHyp(v => !v)}
            className={`p-2 rounded-xl flex items-center gap-1 text-xs font-bold ${dm ? 'bg-indigo-900/40 text-indigo-300 hover:bg-indigo-900/60' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}>
            <Settings size={14} /> Hypothèses
          </button>
          <button onClick={exportCSV}
            className={`p-2 rounded-xl flex items-center gap-1 text-xs font-bold ${dm ? 'bg-amber-900/40 text-amber-300 hover:bg-amber-900/60' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}>
            <Download size={14} /> CSV
          </button>
          <button onClick={() => setExpanded(v => !v)}
            className={`p-2 rounded-xl ${dm ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className={`rounded-2xl p-3 ${dm ? 'bg-zinc-800/50 border border-zinc-700' : 'bg-slate-50 border border-slate-200'}`}>
          <p className={`text-[10px] font-bold uppercase tracking-widest ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>Engagement nominal</p>
          <p className={`text-xl font-black ${dm ? 'text-zinc-200' : 'text-slate-800'}`}>{fmt(idr.totalProvisionNominale)}</p>
          <p className={`text-[10px] mt-1 ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>Sans pondération actuarielle</p>
        </div>
        <div className={`rounded-2xl p-3 border-2 ${dm ? 'bg-amber-950/40 border-amber-700' : 'bg-amber-50 border-amber-300'}`}>
          <p className={`text-[10px] font-bold uppercase tracking-widest ${dm ? 'text-amber-300' : 'text-amber-700'}`}>Provision UCP (à provisionner)</p>
          <p className={`text-2xl font-black ${dm ? 'text-amber-100' : 'text-amber-900'}`}>{fmt(idr.totalProvisionUCP)}</p>
          <p className={`text-[10px] mt-1 ${dm ? 'text-amber-400' : 'text-amber-600'}`}>Pondéré turn-over + actualisation + survie</p>
        </div>
        <div className={`rounded-2xl p-3 ${dm ? 'bg-rose-950/30 border border-rose-700/40' : 'bg-rose-50 border border-rose-200'}`}>
          <p className={`text-[10px] font-bold uppercase tracking-widest ${dm ? 'text-rose-300' : 'text-rose-600'}`}>Avec charges patronales</p>
          <p className={`text-xl font-black ${dm ? 'text-rose-200' : 'text-rose-800'}`}>{fmt(idr.totalProvisionAvecCharges)}</p>
          <p className={`text-[10px] mt-1 ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>+{idr.hypotheses.tauxChargesProvision} % URSSAF/CHORUM</p>
        </div>
      </div>

      {/* Hypothèses actuarielles */}
      {showHyp && (
        <div className={`rounded-2xl p-4 mb-4 ${dm ? 'bg-indigo-950/30 border border-indigo-800' : 'bg-indigo-50 border border-indigo-200'}`}>
          <div className="flex items-center gap-2 mb-3">
            <Settings size={16} className={dm ? 'text-indigo-400' : 'text-indigo-600'} />
            <h3 className={`text-sm font-black ${dm ? 'text-indigo-200' : 'text-indigo-800'}`}>Hypothèses actuarielles</h3>
            {dafLocked && <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${dm ? 'bg-violet-900/40 text-violet-300' : 'bg-violet-100 text-violet-700'}`}>🔒 DAF</span>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            <label className="flex flex-col gap-1">
              <span className={dm ? 'text-zinc-300' : 'text-slate-700'}>Taux actualisation (%)</span>
              <input type="number" step="0.1" disabled={dafLocked} value={idr.hypotheses.tauxActualisation}
                onChange={e => updateHypothese('tauxActualisation', e.target.value)} className={inputCls} />
              <span className={`text-[10px] ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>IBOXX A 10 ans</span>
            </label>
            <label className="flex flex-col gap-1">
              <span className={dm ? 'text-zinc-300' : 'text-slate-700'}>Turn-over annuel (%)</span>
              <input type="number" step="0.5" disabled={dafLocked} value={idr.hypotheses.tauxTurnOver}
                onChange={e => updateHypothese('tauxTurnOver', e.target.value)} className={inputCls} />
              <span className={`text-[10px] ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>Probabilité de départ</span>
            </label>
            <label className="flex flex-col gap-1">
              <span className={dm ? 'text-zinc-300' : 'text-slate-700'}>Âge retraite</span>
              <input type="number" step="1" disabled={dafLocked} value={idr.hypotheses.ageRetraite}
                onChange={e => updateHypothese('ageRetraite', e.target.value)} className={inputCls} />
              <span className={`text-[10px] ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>Réforme 2023</span>
            </label>
            <label className="flex flex-col gap-1">
              <span className={dm ? 'text-zinc-300' : 'text-slate-700'}>Charges sur IFC (%)</span>
              <input type="number" step="0.5" disabled={dafLocked} value={idr.hypotheses.tauxChargesProvision}
                onChange={e => updateHypothese('tauxChargesProvision', e.target.value)} className={inputCls} />
              <span className={`text-[10px] ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>URSSAF + CHORUM</span>
            </label>
            <label className="flex flex-col gap-1">
              <span className={dm ? 'text-zinc-300' : 'text-slate-700'}>Mortalité annuelle (%)</span>
              <input type="number" step="0.1" disabled={dafLocked} value={idr.hypotheses.tauxMortalite}
                onChange={e => updateHypothese('tauxMortalite', e.target.value)} className={inputCls} />
              <span className={`text-[10px] ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>Table TF/TH simplifiée</span>
            </label>
          </div>
        </div>
      )}

      {expanded && (
        idr.agents.length === 0 ? (
          <p className={`text-xs ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>
            Aucun agent éligible : renseigner anneeNaissance et dateEntree pour activer le calcul.
          </p>
        ) : (
          <>
          <DataTable darkMode={dm} variant="borderless">
            <DataTable.Head>
              <DataTable.Row>
                <DataTable.HeadCell darkMode={dm}>Agent</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm}>Source</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="right">Âge</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="right">Anc.</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="right">Reste</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="right">P. présence</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="right">Actu.</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="right">Nominal</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="right">UCP</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="right">Avec charges</DataTable.HeadCell>
              </DataTable.Row>
            </DataTable.Head>
            <DataTable.Body>
              {idr.agents.map((a, i) => (
                <DataTable.Row key={a.id || i}>
                  <DataTable.Cell darkMode={dm} bold>{a.nom}</DataTable.Cell>
                  <DataTable.Cell darkMode={dm} className={dm ? 'text-zinc-400' : 'text-slate-500'}>{a.source}</DataTable.Cell>
                  <DataTable.Cell darkMode={dm} align="right" mono>{a.age}</DataTable.Cell>
                  <DataTable.Cell darkMode={dm} align="right" mono>{a.anciennete}</DataTable.Cell>
                  <DataTable.Cell darkMode={dm} align="right" mono>{a.anneesRestantes}</DataTable.Cell>
                  <DataTable.Cell darkMode={dm} align="right" mono className={dm ? 'text-zinc-400' : 'text-slate-500'}>{pct(a.probabilitePresence)}</DataTable.Cell>
                  <DataTable.Cell darkMode={dm} align="right" mono className={dm ? 'text-zinc-400' : 'text-slate-500'}>{pct(a.coefficientActualisation)}</DataTable.Cell>
                  <DataTable.Cell darkMode={dm} align="right" mono>{fmt(a.provisionNominale)}</DataTable.Cell>
                  <DataTable.Cell darkMode={dm} align="right" mono bold className={dm ? 'text-amber-300' : 'text-amber-700'}>{fmt(a.provisionUCP)}</DataTable.Cell>
                  <DataTable.Cell darkMode={dm} align="right" mono bold className={dm ? 'text-rose-300' : 'text-rose-700'}>{fmt(a.provisionAvecCharges)}</DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable.Body>
          </DataTable>
          <p className={`mt-3 text-[10px] italic ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
            Méthode UCP : engagement_actuel = engagement_retraite × (anc/anc_totale) × (1−turnOver)^n × (1−mortalité)^n × (1+i)^(−n).
            Conforme ANC 2013-02 et IAS 19. La provision avec charges constitue le montant à inscrire au compte 153.
          </p>
        </>
        )
      )}
    </div>
  );
}
