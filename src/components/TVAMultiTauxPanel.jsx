import React, { useMemo, useState } from 'react';
import { Receipt, ChevronDown, ChevronUp, Download, AlertTriangle } from 'lucide-react';
import { calculerSyntheseTVA, TAUX_TVA_USUELS } from '../utils/tvaMultiTaux';

const fmt = (n) => Math.round(n || 0).toLocaleString('fr-FR') + ' €';
const pct = (n) => (n * 100).toFixed(1) + ' %';

export default function TVAMultiTauxPanel({ darkMode, direction, services, poleSupport, globalParams }) {
  const [expanded, setExpanded] = useState(false);
  const tva = useMemo(
    () => calculerSyntheseTVA(direction, services, poleSupport, globalParams),
    [direction, services, poleSupport, globalParams]
  );

  const exportCSV = () => {
    const head = ['Taux', 'Recettes HT (€)', 'TVA collectée (€)', 'Charges HT (€)', 'TVA déductible (€)', 'Solde (€)'];
    const rows = tva.parTaux.map(e => [
      e.label || `${e.taux} %`,
      e.recettesHT.toFixed(2),
      e.tvaCollectee.toFixed(2),
      e.chargesHT.toFixed(2),
      e.tvaDeductible.toFixed(2),
      e.solde.toFixed(2),
    ]);
    rows.push([]);
    rows.push(['TOTAL', '', tva.totalTVACollectee.toFixed(2), '', tva.totalTVADeductible.toFixed(2), tva.soldeTVA.toFixed(2)]);
    rows.push(['Coefficient de déduction', `${(tva.coefficientDeduction * 100).toFixed(2)} %`]);
    const csv = [head, ...rows].map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `tva_synthese_${new Date().getFullYear()}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const dm = darkMode;
  const statutBg = tva.statut === 'aReverser'
    ? (dm ? 'bg-rose-950/40 border-rose-700' : 'bg-rose-50 border-rose-300')
    : tva.statut === 'creditTVA'
      ? (dm ? 'bg-emerald-950/40 border-emerald-700' : 'bg-emerald-50 border-emerald-300')
      : (dm ? 'bg-zinc-800/60 border-zinc-700' : 'bg-slate-100 border-slate-300');
  const statutTxt = tva.statut === 'aReverser'
    ? (dm ? 'text-rose-200' : 'text-rose-800')
    : tva.statut === 'creditTVA'
      ? (dm ? 'text-emerald-200' : 'text-emerald-800')
      : (dm ? 'text-zinc-300' : 'text-slate-700');
  const statutLabel = tva.statut === 'aReverser' ? 'TVA à reverser' : tva.statut === 'creditTVA' ? 'Crédit de TVA' : 'Position neutre';

  return (
    <div className={`rounded-3xl border p-6 mb-6 ${dm ? 'bg-zinc-900/80 border-zinc-700/30' : 'bg-white border-slate-100/80'}`}>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-2xl ${dm ? 'bg-cyan-900/40' : 'bg-cyan-100'}`}>
            <Receipt size={20} className={dm ? 'text-cyan-300' : 'text-cyan-600'} />
          </div>
          <div>
            <h2 className={`text-lg font-black ${dm ? 'text-white' : 'text-slate-800'}`}>
              TVA multi-taux différenciée
            </h2>
            <p className={`text-xs ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>
              CGI Art. 261 4-4° (formation continue exonérée) — taux 0 / 5,5 / 10 / 20
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV}
            className={`p-2 rounded-xl flex items-center gap-1 text-xs font-bold ${dm ? 'bg-cyan-900/40 text-cyan-300 hover:bg-cyan-900/60' : 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100'}`}>
            <Download size={14} /> CSV
          </button>
          <button onClick={() => setExpanded(v => !v)}
            className={`p-2 rounded-xl ${dm ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Synthèse */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className={`rounded-2xl p-3 ${dm ? 'bg-emerald-950/30 border border-emerald-700/40' : 'bg-emerald-50 border border-emerald-200'}`}>
          <p className={`text-[10px] font-bold uppercase tracking-widest ${dm ? 'text-emerald-300' : 'text-emerald-600'}`}>TVA collectée</p>
          <p className={`text-xl font-black ${dm ? 'text-emerald-100' : 'text-emerald-800'}`}>{fmt(tva.totalTVACollectee)}</p>
        </div>
        <div className={`rounded-2xl p-3 ${dm ? 'bg-blue-950/30 border border-blue-700/40' : 'bg-blue-50 border border-blue-200'}`}>
          <p className={`text-[10px] font-bold uppercase tracking-widest ${dm ? 'text-blue-300' : 'text-blue-600'}`}>TVA déductible</p>
          <p className={`text-xl font-black ${dm ? 'text-blue-100' : 'text-blue-800'}`}>{fmt(tva.totalTVADeductible)}</p>
        </div>
        <div className={`rounded-2xl p-3 border-2 ${statutBg}`}>
          <p className={`text-[10px] font-bold uppercase tracking-widest ${statutTxt}`}>Solde TVA</p>
          <p className={`text-xl font-black ${statutTxt}`}>
            {tva.soldeTVA >= 0 ? '+' : ''}{fmt(tva.soldeTVA)}
          </p>
          <p className={`text-[10px] mt-1 ${statutTxt}`}>{statutLabel}</p>
        </div>
        <div className={`rounded-2xl p-3 ${dm ? 'bg-violet-950/30 border border-violet-700/40' : 'bg-violet-50 border border-violet-200'}`}>
          <p className={`text-[10px] font-bold uppercase tracking-widest ${dm ? 'text-violet-300' : 'text-violet-600'}`}>Coef. déduction</p>
          <p className={`text-xl font-black ${dm ? 'text-violet-100' : 'text-violet-800'}`}>{pct(tva.coefficientDeduction)}</p>
          <p className={`text-[10px] mt-1 ${dm ? 'text-violet-400' : 'text-violet-600'}`}>CA assujetti / CA total</p>
        </div>
      </div>

      {tva.coefficientDeduction < 0.99 && tva.coefficientDeduction > 0.01 && (
        <div className={`rounded-2xl p-3 mb-4 flex items-start gap-2 ${dm ? 'bg-amber-950/30 border border-amber-700' : 'bg-amber-50 border border-amber-200'}`}>
          <AlertTriangle size={16} className={dm ? 'text-amber-400 mt-0.5' : 'text-amber-600 mt-0.5'} />
          <p className={`text-xs ${dm ? 'text-amber-200' : 'text-amber-800'}`}>
            <span className="font-bold">Activité mixte détectée</span> — la TVA déductible est proratisée à {pct(tva.coefficientDeduction)}
            (CA assujetti / CA total). Confirmer le coefficient avec votre cabinet comptable, idéalement par
            comptabilisation de secteurs distincts (BOI-TVA-DED-20-10).
          </p>
        </div>
      )}

      {expanded && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className={dm ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-100 text-slate-700'}>
                <th className="text-left p-2">Taux</th>
                <th className="text-right p-2">Recettes HT</th>
                <th className="text-right p-2">TVA collectée</th>
                <th className="text-right p-2">Charges HT</th>
                <th className="text-right p-2">TVA déductible</th>
                <th className="text-right p-2">Solde</th>
              </tr>
            </thead>
            <tbody>
              {tva.parTaux.filter(e => e.recettesHT > 0 || e.chargesHT > 0).map(e => (
                <tr key={e.taux} className={dm ? 'bg-zinc-900/40' : 'bg-white'}>
                  <td className={`p-2 font-bold ${dm ? 'text-zinc-100' : 'text-slate-800'}`}>
                    {e.label || `${e.taux} %`}
                    {e.taux === 0 && <span className={`ml-2 text-[10px] ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>(exonérée)</span>}
                  </td>
                  <td className={`p-2 text-right font-mono ${dm ? 'text-zinc-300' : 'text-slate-700'}`}>{fmt(e.recettesHT)}</td>
                  <td className={`p-2 text-right font-mono ${dm ? 'text-emerald-300' : 'text-emerald-700'}`}>{fmt(e.tvaCollectee)}</td>
                  <td className={`p-2 text-right font-mono ${dm ? 'text-zinc-300' : 'text-slate-700'}`}>{fmt(e.chargesHT)}</td>
                  <td className={`p-2 text-right font-mono ${dm ? 'text-blue-300' : 'text-blue-700'}`}>{fmt(e.tvaDeductible)}</td>
                  <td className={`p-2 text-right font-mono font-bold ${e.solde >= 0 ? (dm ? 'text-rose-300' : 'text-rose-700') : (dm ? 'text-emerald-300' : 'text-emerald-700')}`}>
                    {e.solde >= 0 ? '+' : ''}{fmt(e.solde)}
                  </td>
                </tr>
              ))}
              <tr className={dm ? 'bg-zinc-700/60 text-white font-black border-t-2 border-zinc-500' : 'bg-slate-200 text-slate-800 font-black border-t-2 border-slate-400'}>
                <td className="p-2">TOTAL</td>
                <td className="p-2"></td>
                <td className="p-2 text-right font-mono">{fmt(tva.totalTVACollectee)}</td>
                <td className="p-2"></td>
                <td className="p-2 text-right font-mono">{fmt(tva.totalTVADeductible)}</td>
                <td className="p-2 text-right font-mono">{tva.soldeTVA >= 0 ? '+' : ''}{fmt(tva.soldeTVA)}</td>
              </tr>
            </tbody>
          </table>
          <p className={`mt-3 text-[10px] italic ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
            Saisissez le taux applicable par recette (champ <code>tauxTVA</code>) ou par charge
            (<code>tauxTVA</code> + <code>saisieType</code> HT/TTC + <code>tvaRecuperable</code>).
            Préparation déclaration CA3 mensuelle ou trimestrielle.
          </p>
        </div>
      )}
    </div>
  );
}
