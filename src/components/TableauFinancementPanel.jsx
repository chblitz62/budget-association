import React, { useMemo, useState } from 'react';
import { ArrowRightLeft, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { calculerTableauFinancement } from '../utils/tableauFinancement';

const fmt = (n) => Math.round(n || 0).toLocaleString('fr-FR') + ' €';

const Row = ({ label, value, indent = 0, dark, isSubtotal, isTotal, sign = false }) => {
  const padding = indent * 16;
  const cls = isTotal
    ? (dark ? 'bg-violet-900/40 text-white font-black border-t-2 border-violet-500' : 'bg-violet-100 text-violet-900 font-black border-t-2 border-violet-500')
    : isSubtotal
      ? (dark ? 'bg-zinc-700/40 text-zinc-100 font-bold' : 'bg-slate-200 text-slate-800 font-bold')
      : (dark ? 'bg-zinc-900/30 text-zinc-300' : 'bg-white text-slate-700');
  const display = value === null ? '' : (sign && value > 0 ? '+' : '') + fmt(value);
  return (
    <tr className={cls}>
      <td className="py-1.5 px-3" style={{ paddingLeft: padding + 12 }}>{label}</td>
      <td className="py-1.5 px-3 text-right font-mono">{display}</td>
    </tr>
  );
};

export default function TableauFinancementPanel({ darkMode, direction, services, poleSupport, globalParams, poolRH = [], planningAbsences = null, fondsDedies = [], benevoles = [] }) {
  const [expanded, setExpanded] = useState(false);
  const tf = useMemo(
    () => calculerTableauFinancement(direction, services, poleSupport, globalParams, poolRH, planningAbsences, { fondsDedies, benevoles }),
    [direction, services, poleSupport, globalParams, poolRH, planningAbsences, fondsDedies, benevoles]
  );

  const exportCSV = () => {
    const lignes = [
      ['Section', 'Poste', 'Montant (€)'],
      ['I. RESSOURCES DURABLES', 'Capacité d\'autofinancement (CAF)', tf.ressources.caf.toFixed(2)],
      ['  Détail CAF', '  Résultat de l\'exercice', tf.detail.caf.resultat.toFixed(2)],
      ['  Détail CAF', '  + Dotations aux amortissements', tf.detail.caf.dotAmortissements.toFixed(2)],
      ['  Détail CAF', '  + Dotations aux provisions', tf.detail.caf.dotProvisions.toFixed(2)],
      ['I. RESSOURCES DURABLES', 'Emprunts nouveaux', tf.ressources.empruntsNouveaux.toFixed(2)],
      ['I. RESSOURCES DURABLES', 'Subventions d\'investissement', tf.ressources.subventionsInvestissement.toFixed(2)],
      ['I. RESSOURCES DURABLES', 'Cessions d\'immobilisations', tf.ressources.cessionsImmo.toFixed(2)],
      ['I. RESSOURCES DURABLES', 'TOTAL RESSOURCES', tf.ressources.totalRessources.toFixed(2)],
      [],
      ['II. EMPLOIS DURABLES', 'Investissements acquis', tf.emplois.investissementsAcquis.toFixed(2)],
      ['II. EMPLOIS DURABLES', 'Remboursements de capital d\'emprunts', tf.emplois.remboursementsCapital.toFixed(2)],
      ['II. EMPLOIS DURABLES', 'Distribution résultat', tf.emplois.distributionResultat.toFixed(2)],
      ['II. EMPLOIS DURABLES', 'TOTAL EMPLOIS', tf.emplois.totalEmplois.toFixed(2)],
      [],
      ['VARIATION', 'Variation du Fonds de Roulement (FRNG)', tf.variationFRNG.toFixed(2)],
      ['VARIATION', '  − Variation du BFR', (-tf.variationBFR).toFixed(2)],
      ['VARIATION', '= Variation de la trésorerie', tf.variationTresorerie.toFixed(2)],
    ];
    const csv = lignes.map(l => l.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `tableau_financement_${tf.annee}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const dm = darkMode;
  const tresoBg = tf.variationTresorerie >= 0
    ? (dm ? 'bg-emerald-950/40 border-emerald-700' : 'bg-emerald-50 border-emerald-300')
    : (dm ? 'bg-rose-950/40 border-rose-700' : 'bg-rose-50 border-rose-300');
  const tresoTxt = tf.variationTresorerie >= 0
    ? (dm ? 'text-emerald-200' : 'text-emerald-800')
    : (dm ? 'text-rose-200' : 'text-rose-800');

  return (
    <div className={`rounded-3xl border p-6 mb-6 ${dm ? 'bg-zinc-900/80 border-zinc-700/30' : 'bg-white border-slate-100/80'}`}>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-2xl ${dm ? 'bg-teal-900/40' : 'bg-teal-100'}`}>
            <ArrowRightLeft size={20} className={dm ? 'text-teal-300' : 'text-teal-600'} />
          </div>
          <div>
            <h2 className={`text-lg font-black ${dm ? 'text-white' : 'text-slate-800'}`}>
              Tableau de financement — {tf.annee}
            </h2>
            <p className={`text-xs ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>
              PCG art. 532-7 — Ressources et emplois durables, variation FRNG/BFR/Trésorerie
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV}
            className={`p-2 rounded-xl flex items-center gap-1 text-xs font-bold ${dm ? 'bg-teal-900/40 text-teal-300 hover:bg-teal-900/60' : 'bg-teal-50 text-teal-700 hover:bg-teal-100'}`}>
            <Download size={14} /> CSV
          </button>
          <button onClick={() => setExpanded(v => !v)}
            className={`p-2 rounded-xl ${dm ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Synthèse */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className={`rounded-2xl p-3 ${dm ? 'bg-blue-950/30 border border-blue-700/40' : 'bg-blue-50 border border-blue-200'}`}>
          <p className={`text-[10px] font-bold uppercase tracking-widest ${dm ? 'text-blue-300' : 'text-blue-600'}`}>CAF</p>
          <p className={`text-2xl font-black ${dm ? 'text-blue-100' : 'text-blue-800'}`}>{fmt(tf.ressources.caf)}</p>
          <p className={`text-[10px] mt-1 ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>Capacité d'autofinancement</p>
        </div>
        <div className={`rounded-2xl p-3 ${dm ? 'bg-violet-950/30 border border-violet-700/40' : 'bg-violet-50 border border-violet-200'}`}>
          <p className={`text-[10px] font-bold uppercase tracking-widest ${dm ? 'text-violet-300' : 'text-violet-600'}`}>Δ FRNG</p>
          <p className={`text-2xl font-black ${tf.variationFRNG >= 0 ? (dm ? 'text-emerald-200' : 'text-emerald-700') : (dm ? 'text-rose-200' : 'text-rose-700')}`}>
            {tf.variationFRNG >= 0 ? '+' : ''}{fmt(tf.variationFRNG)}
          </p>
          <p className={`text-[10px] mt-1 ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>Ressources − Emplois</p>
        </div>
        <div className={`rounded-2xl p-3 border-2 ${tresoBg}`}>
          <p className={`text-[10px] font-bold uppercase tracking-widest ${tresoTxt}`}>Δ Trésorerie</p>
          <p className={`text-2xl font-black ${tresoTxt}`}>
            {tf.variationTresorerie >= 0 ? '+' : ''}{fmt(tf.variationTresorerie)}
          </p>
          <p className={`text-[10px] mt-1 ${tresoTxt}`}>ΔFRNG − ΔBFR</p>
        </div>
      </div>

      {expanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Ressources */}
          <div>
            <h3 className={`text-sm font-black mb-2 px-3 py-1.5 rounded-lg ${dm ? 'bg-emerald-900/40 text-emerald-200' : 'bg-emerald-100 text-emerald-800'}`}>
              I — Ressources durables
            </h3>
            <table className="w-full text-xs">
              <tbody>
                <Row dark={dm} label="Capacité d'autofinancement (CAF)" value={tf.ressources.caf} indent={1} />
                <Row dark={dm} label="↳ Résultat de l'exercice" value={tf.detail.caf.resultat} indent={2} />
                <Row dark={dm} label="↳ + Dot. amortissements" value={tf.detail.caf.dotAmortissements} indent={2} />
                <Row dark={dm} label="↳ + Dot. provisions" value={tf.detail.caf.dotProvisions} indent={2} />
                <Row dark={dm} label="Emprunts nouveaux" value={tf.ressources.empruntsNouveaux} indent={1} />
                <Row dark={dm} label="Subventions d'investissement" value={tf.ressources.subventionsInvestissement} indent={1} />
                <Row dark={dm} label="Cessions d'immobilisations" value={tf.ressources.cessionsImmo} indent={1} />
                <Row dark={dm} label="TOTAL RESSOURCES" value={tf.ressources.totalRessources} isTotal />
              </tbody>
            </table>
          </div>

          {/* Emplois */}
          <div>
            <h3 className={`text-sm font-black mb-2 px-3 py-1.5 rounded-lg ${dm ? 'bg-rose-900/40 text-rose-200' : 'bg-rose-100 text-rose-800'}`}>
              II — Emplois durables
            </h3>
            <table className="w-full text-xs">
              <tbody>
                <Row dark={dm} label="Investissements acquis" value={tf.emplois.investissementsAcquis} indent={1} />
                <Row dark={dm} label="Remboursements capital d'emprunt" value={tf.emplois.remboursementsCapital} indent={1} />
                <Row dark={dm} label="Distribution de résultat" value={tf.emplois.distributionResultat} indent={1} />
                <Row dark={dm} label="TOTAL EMPLOIS" value={tf.emplois.totalEmplois} isTotal />
              </tbody>
            </table>
            <table className="w-full text-xs mt-3">
              <tbody>
                <Row dark={dm} label="Variation FRNG" value={tf.variationFRNG} isSubtotal sign />
                <Row dark={dm} label="− Variation BFR" value={-tf.variationBFR} indent={1} sign />
                <Row dark={dm} label="= Variation Trésorerie" value={tf.variationTresorerie} isTotal sign />
              </tbody>
            </table>
          </div>
        </div>
      )}

      {expanded && (
        <p className={`mt-3 text-[10px] italic ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
          Tableau de financement conforme PCG art. 532-7 ; permet de relier la formation du résultat
          à l'évolution réelle de la trésorerie. Renseigner <code>subventionsInvestissementAnnuelles</code>,
          <code>cessionsImmoAnnuelles</code> et <code>variationBFRReelle</code> dans Paramètres pour affiner.
        </p>
      )}
    </div>
  );
}
