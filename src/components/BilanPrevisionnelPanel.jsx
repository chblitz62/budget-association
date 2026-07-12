import React, { useMemo, useState } from 'react';
import { Scale, ChevronDown, ChevronUp, Download, AlertTriangle, CheckCircle } from 'lucide-react';
import { calculerBilanPrevisionnel } from '../utils/bilanPrevisionnel';

const fmt = (n) => Math.round(n || 0).toLocaleString('fr-FR') + ' €';

const Row = ({ label, value, indent = 0, bold = false, dark, isSubtotal = false, isTotal = false }) => {
  const padding = indent * 16;
  const cls = isTotal
    ? (dark ? 'bg-violet-900/40 text-white font-black border-t-2 border-violet-500' : 'bg-violet-100 text-violet-900 font-black border-t-2 border-violet-500')
    : isSubtotal
      ? (dark ? 'bg-zinc-700/40 text-zinc-100 font-bold' : 'bg-slate-200 text-slate-800 font-bold')
      : (dark ? 'bg-zinc-900/30 text-zinc-300' : 'bg-white text-slate-700');
  return (
    <tr className={cls}>
      <td className="py-1.5 px-3" style={{ paddingLeft: padding + 12 }}>
        <span className={bold ? 'font-bold' : ''}>{label}</span>
      </td>
      <td className="py-1.5 px-3 text-right font-mono">
        {value === null ? '' : fmt(value)}
      </td>
    </tr>
  );
};

export default function BilanPrevisionnelPanel({ darkMode, direction, services, poleSupport, globalParams, poolRH = [], planningAbsences = null, fondsDedies = [], benevoles = [] }) {
  const [expanded, setExpanded] = useState(false);
  const bilan = useMemo(
    () => calculerBilanPrevisionnel(direction, services, poleSupport, globalParams, poolRH, planningAbsences, { fondsDedies, benevoles }),
    [direction, services, poleSupport, globalParams, poolRH, planningAbsences, fondsDedies, benevoles]
  );

  const exporterCSV = () => {
    const lignes = [
      ['Section', 'Poste', 'Montant (€)'],
      ['ACTIF', 'Immobilisations brutes', bilan.actif.immobilisationsBrutes.toFixed(2)],
      ['ACTIF', '− Amortissements cumulés', (-bilan.actif.amortissementsCumules).toFixed(2)],
      ['ACTIF', '= Immobilisations nettes', bilan.actif.immobilisationsNettes.toFixed(2)],
      ['ACTIF', 'Stocks', bilan.actif.stocks.toFixed(2)],
      ['ACTIF', 'Créances clients', bilan.actif.creancesClients.toFixed(2)],
      ['ACTIF', 'Disponibilités', bilan.actif.disponibilites.toFixed(2)],
      ['ACTIF', 'TOTAL ACTIF', bilan.actif.totalActif.toFixed(2)],
      [],
      ['PASSIF', 'Réserves + RAN', bilan.passif.capitauxPropresManuels.toFixed(2)],
      ['PASSIF', 'Résultat de l\'exercice', bilan.passif.resultatExercice.toFixed(2)],
      ['PASSIF', '= Total capitaux propres', bilan.passif.totalCapitauxPropres.toFixed(2)],
      ['PASSIF', 'Fonds dédiés (compte 19)', bilan.passif.fondsDedies.toFixed(2)],
      ['PASSIF', 'Provisions pour risques et charges (dont IDR)', bilan.passif.provisions.toFixed(2)],
      ['PASSIF', 'Dettes financières (emprunts)', bilan.passif.dettesFinancieres.toFixed(2)],
      ['PASSIF', 'Dettes fournisseurs', bilan.passif.dettesFournisseurs.toFixed(2)],
      ['PASSIF', 'Dettes sociales URSSAF', bilan.passif.dettesURSSAF.toFixed(2)],
      ['PASSIF', 'Découvert bancaire', bilan.passif.decouvert.toFixed(2)],
      ['PASSIF', 'TOTAL PASSIF', bilan.passif.totalPassif.toFixed(2)],
      [],
      ['CONTRÔLE', 'Écart Actif − Passif', bilan.equilibre.ecart.toFixed(2)],
    ];
    const csv = lignes.map(l => l.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bilan_previsionnel_${bilan.annee}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const dm = darkMode;
  const equilibreBg = bilan.equilibre.valide
    ? (dm ? 'bg-emerald-950/40 border-emerald-700' : 'bg-emerald-50 border-emerald-300')
    : (dm ? 'bg-amber-950/40 border-amber-700' : 'bg-amber-50 border-amber-300');
  const equilibreTxt = bilan.equilibre.valide
    ? (dm ? 'text-emerald-200' : 'text-emerald-800')
    : (dm ? 'text-amber-200' : 'text-amber-800');

  return (
    <div className={`rounded-3xl border p-6 mb-6 ${dm ? 'bg-zinc-900/80 border-zinc-700/30' : 'bg-white border-slate-100/80'}`}>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-2xl ${dm ? 'bg-violet-900/40' : 'bg-violet-100'}`}>
            <Scale size={20} className={dm ? 'text-violet-300' : 'text-violet-600'} />
          </div>
          <div>
            <h2 className={`text-lg font-black ${dm ? 'text-white' : 'text-slate-800'}`}>
              Bilan prévisionnel — {bilan.annee}
            </h2>
            <p className={`text-xs ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>
              PCG associatif (CRC 99-01 / Règl. ANC 2018-06) — Actif = Passif
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exporterCSV}
            className={`p-2 rounded-xl flex items-center gap-1 text-xs font-bold ${dm ? 'bg-violet-900/40 text-violet-300 hover:bg-violet-900/60' : 'bg-violet-50 text-violet-700 hover:bg-violet-100'}`}
            title="Export CSV">
            <Download size={14} /> CSV
          </button>
          <button onClick={() => setExpanded(v => !v)}
            className={`p-2 rounded-xl ${dm ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Synthèse actif/passif */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className={`rounded-2xl p-3 ${dm ? 'bg-blue-950/30 border border-blue-700/40' : 'bg-blue-50 border border-blue-200'}`}>
          <p className={`text-[10px] font-bold uppercase tracking-widest ${dm ? 'text-blue-300' : 'text-blue-600'}`}>Total Actif</p>
          <p className={`text-2xl font-black ${dm ? 'text-blue-100' : 'text-blue-800'}`}>{fmt(bilan.actif.totalActif)}</p>
          <p className={`text-[10px] mt-1 ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
            Immo. nettes + stocks + créances + disponibilités
          </p>
        </div>
        <div className={`rounded-2xl p-3 ${dm ? 'bg-rose-950/30 border border-rose-700/40' : 'bg-rose-50 border border-rose-200'}`}>
          <p className={`text-[10px] font-bold uppercase tracking-widest ${dm ? 'text-rose-300' : 'text-rose-600'}`}>Total Passif</p>
          <p className={`text-2xl font-black ${dm ? 'text-rose-100' : 'text-rose-800'}`}>{fmt(bilan.passif.totalPassif)}</p>
          <p className={`text-[10px] mt-1 ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
            Capitaux propres + provisions + dettes
          </p>
        </div>
        <div className={`rounded-2xl p-3 border-2 ${equilibreBg}`}>
          <div className="flex items-center gap-2 mb-1">
            {bilan.equilibre.valide ? <CheckCircle size={14} className={dm ? 'text-emerald-400' : 'text-emerald-600'} /> : <AlertTriangle size={14} className={dm ? 'text-amber-400' : 'text-amber-600'} />}
            <p className={`text-[10px] font-bold uppercase tracking-widest ${equilibreTxt}`}>Équilibre</p>
          </div>
          <p className={`text-lg font-black ${equilibreTxt}`}>
            {bilan.equilibre.valide ? '✓ Bilan équilibré' : `Écart : ${fmt(bilan.equilibre.ecart)}`}
          </p>
          <p className={`text-[10px] mt-1 ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
            Actif − Passif (tolérance 1 €)
          </p>
        </div>
      </div>

      {expanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ACTIF */}
          <div>
            <h3 className={`text-sm font-black mb-2 px-3 py-1.5 rounded-lg ${dm ? 'bg-blue-900/40 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
              ACTIF
            </h3>
            <table className="w-full text-xs">
              <tbody>
                <Row dark={dm} label="Immobilisations brutes" value={bilan.actif.immobilisationsBrutes} indent={1} />
                <Row dark={dm} label="− Amortissements cumulés" value={-bilan.actif.amortissementsCumules} indent={1} />
                <Row dark={dm} label="Immobilisations nettes" value={bilan.actif.immobilisationsNettes} bold isSubtotal />
                <Row dark={dm} label="Stocks" value={bilan.actif.stocks} indent={1} />
                <Row dark={dm} label="Créances clients" value={bilan.actif.creancesClients} indent={1} />
                <Row dark={dm} label="Disponibilités (banque, caisse)" value={bilan.actif.disponibilites} indent={1} />
                <Row dark={dm} label="TOTAL ACTIF" value={bilan.actif.totalActif} isTotal />
              </tbody>
            </table>
          </div>

          {/* PASSIF */}
          <div>
            <h3 className={`text-sm font-black mb-2 px-3 py-1.5 rounded-lg ${dm ? 'bg-rose-900/40 text-rose-200' : 'bg-rose-100 text-rose-800'}`}>
              PASSIF
            </h3>
            <table className="w-full text-xs">
              <tbody>
                <Row dark={dm} label="Réserves + report à nouveau" value={bilan.passif.capitauxPropresManuels} indent={1} />
                <Row dark={dm} label="Résultat de l'exercice" value={bilan.passif.resultatExercice} indent={1} />
                <Row dark={dm} label="Capitaux propres" value={bilan.passif.totalCapitauxPropres} bold isSubtotal />
                {bilan.passif.fondsDedies > 0 && (
                  <Row dark={dm} label="Fonds dédiés (19)" value={bilan.passif.fondsDedies} indent={1} />
                )}
                <Row dark={dm} label="Provisions risques et charges (dont IDR)" value={bilan.passif.provisions} indent={1} />
                <Row dark={dm} label="Dettes financières (emprunts)" value={bilan.passif.dettesFinancieres} indent={1} />
                <Row dark={dm} label="Dettes fournisseurs" value={bilan.passif.dettesFournisseurs} indent={1} />
                <Row dark={dm} label="Dettes sociales URSSAF" value={bilan.passif.dettesURSSAF} indent={1} />
                {bilan.passif.decouvert > 0 && (
                  <Row dark={dm} label="Découvert bancaire" value={bilan.passif.decouvert} indent={1} />
                )}
                <Row dark={dm} label="TOTAL PASSIF" value={bilan.passif.totalPassif} isTotal />
              </tbody>
            </table>
          </div>
        </div>
      )}

      {expanded && (
        <p className={`mt-3 text-[10px] italic ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
          Bilan prévisionnel construit à partir du budget en cours : immobilisations (saisies en investissements),
          BFR (créances/dettes calculées sur délais de paiement), résultat de l'exercice (= solde global).
          Pour un bilan opposable, fusionner avec la balance comptable réelle (logiciel certifié).
        </p>
      )}
    </div>
  );
}
