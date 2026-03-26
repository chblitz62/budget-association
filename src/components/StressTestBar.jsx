import React from 'react';
import { Zap, RotateCcw } from 'lucide-react';
import HelpIcon from './ui/HelpIcon';

/**
 * StressTestBar — bandeau de simulation d'aléas sur les subventions.
 * stressTest : -20 à +20 (en %)
 * impact : delta en € sur le solde global (positif = amélioration, négatif = dégradation)
 */
export default function StressTestBar({ stressTest, setStressTest, impact, darkMode }) {
  const isActive = stressTest !== 0;
  const fmt = (n) => (n >= 0 ? '+' : '') + Math.round(n).toLocaleString('fr-FR') + ' €';
  const fmtPct = (n) => (n >= 0 ? '+' : '') + n + ' %';

  return (
    <div className={`rounded-2xl border px-5 py-3.5 mb-4 no-print transition-all duration-300 ${
      isActive
        ? darkMode
          ? 'bg-amber-950/40 border-amber-700/60 shadow-amber-900/20 shadow-lg'
          : 'bg-amber-50 border-amber-200 shadow-amber-100 shadow-md'
        : darkMode
          ? 'bg-zinc-900/60 border-zinc-700/30'
          : 'bg-slate-50/80 border-slate-200/60'
    }`}>
      <div className="flex flex-wrap items-center gap-4">
        {/* Label */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className={`p-1.5 rounded-lg ${isActive ? 'bg-amber-500/20' : (darkMode ? 'bg-zinc-800' : 'bg-white')}`}>
            <Zap size={15} className={isActive ? 'text-amber-500' : (darkMode ? 'text-zinc-500' : 'text-slate-400')} />
          </div>
          <span className={`text-xs font-bold ${isActive ? (darkMode ? 'text-amber-300' : 'text-amber-700') : (darkMode ? 'text-zinc-400' : 'text-slate-500')}`}>
            Simulateur d'Aléas
          </span>
          <HelpIcon
            type="warning"
            position="bottom"
            wide
            darkMode={darkMode}
            content="Simule une variation (−20 % à +20 %) appliquée uniquement aux recettes de type subvention (Région, État, OPCO, CPOM, département…). Les recettes pédagogiques (frais de scolarité, droits d'inscription) ne sont pas affectées. L'impact affiché correspond à la différence sur le solde global par rapport au budget de référence."
          />
        </div>

        {/* Badge valeur */}
        <div className={`px-2.5 py-1 rounded-lg text-xs font-black font-mono-numbers flex-shrink-0 ${
          stressTest < 0
            ? 'bg-rose-500/20 text-rose-500'
            : stressTest > 0
              ? 'bg-emerald-500/20 text-emerald-500'
              : darkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-white text-slate-400'
        }`}>
          {fmtPct(stressTest)}
        </div>

        {/* Slider */}
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <span className={`text-[10px] font-bold flex-shrink-0 ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>−20%</span>
          <input
            type="range"
            min={-20}
            max={20}
            step={1}
            value={stressTest}
            onChange={e => setStressTest(parseInt(e.target.value))}
            className="flex-1 h-1.5 accent-amber-500 cursor-pointer"
          />
          <span className={`text-[10px] font-bold flex-shrink-0 ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>+20%</span>
        </div>

        {/* Impact solde */}
        {isActive && (
          <div className={`flex items-center gap-1.5 text-xs font-bold flex-shrink-0 ${
            impact >= 0 ? 'text-emerald-500' : 'text-rose-500'
          }`}>
            <span className={`text-[10px] font-normal ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>Impact solde :</span>
            <span className="font-black font-mono-numbers">{fmt(impact)}</span>
          </div>
        )}

        {/* Reset */}
        {isActive && (
          <button
            onClick={() => setStressTest(0)}
            className={`p-1.5 rounded-lg flex-shrink-0 transition-colors ${darkMode ? 'text-zinc-400 hover:bg-zinc-800' : 'text-slate-400 hover:bg-white'}`}
            title="Annuler la simulation"
          >
            <RotateCcw size={13} />
          </button>
        )}
      </div>
    </div>
  );
}
