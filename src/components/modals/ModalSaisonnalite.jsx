/**
 * ModalSaisonnalite — Saisie de la répartition mensuelle d'une ligne de recette
 * Permet de configurer comment une recette annuelle se distribue sur les 12 mois
 * (ex : droits d'inscription concentrés en septembre, subvention en plusieurs versements)
 */
import React from 'react';
import { X, AlertTriangle, Calendar } from 'lucide-react';

const MOIS_LABELS = ['Jan','Févr','Mars','Avr','Mai','Juin','Juil','Août','Sept','Oct','Nov','Déc'];
const MOIS_FULL   = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

const PRESETS = [
  { label: 'Uniforme (8,3%/mois)', fn: () => Array(12).fill(+(100/12).toFixed(2)) },
  { label: 'Sept uniquement',       fn: () => Array(12).fill(0).map((_, i) => i === 8 ? 100 : 0) },
  { label: 'Trim 1 (Jan–Mar)',      fn: () => Array(12).fill(0).map((_, i) => i < 3 ? +(100/3).toFixed(2) : 0) },
  { label: 'Trim 3 (Jul–Sep)',      fn: () => Array(12).fill(0).map((_, i) => i >= 6 && i < 9 ? +(100/3).toFixed(2) : 0) },
  { label: 'Semestre 1',            fn: () => Array(12).fill(0).map((_, i) => i < 6 ? +(100/6).toFixed(2) : 0) },
  { label: 'Semestre 2',            fn: () => Array(12).fill(0).map((_, i) => i >= 6 ? +(100/6).toFixed(2) : 0) },
  { label: '3 versements (jan/mai/sept)', fn: () => Array(12).fill(0).map((_, i) => [0,4,8].includes(i) ? +(100/3).toFixed(2) : 0) },
];

const ModalSaisonnalite = ({ dialog, setDialog, services, setServices, poleSupport, setPoleSupport, direction, setDirection, darkMode }) => {
  if (!dialog) return null;

  // Résoudre l'entité concernée (service, poleSupport, direction)
  let recettesList = [];
  if (dialog.type === 'service') {
    const svc = services.find(s => s.id === dialog.entityId);
    recettesList = svc?.recettes || [];
  } else if (dialog.type === 'poleSupport') {
    recettesList = poleSupport?.recettes || [];
  } else if (dialog.type === 'direction') {
    recettesList = direction?.recettes || [];
  }

  const recette = recettesList.find(r => r.id === dialog.recetteId);
  if (!recette) return null;

  const repartition = Array.isArray(recette.repartitionMensuelle) && recette.repartitionMensuelle.length === 12
    ? recette.repartitionMensuelle
    : Array(12).fill(+(100/12).toFixed(2));

  const total = repartition.reduce((s, v) => s + (parseFloat(v) || 0), 0);
  const totalArrondi = Math.round(total * 10) / 10;
  const ok = Math.abs(total - 100) < 0.5;

  const updateRepartition = (newRep) => {
    const updateRecette = (list) =>
      list.map(r => r.id === dialog.recetteId ? { ...r, repartitionMensuelle: newRep } : r);

    if (dialog.type === 'service') {
      setServices(services.map(s => s.id !== dialog.entityId ? s : { ...s, recettes: updateRecette(s.recettes || []) }));
    } else if (dialog.type === 'poleSupport') {
      setPoleSupport({ ...poleSupport, recettes: updateRecette(poleSupport.recettes || []) });
    } else if (dialog.type === 'direction') {
      setDirection({ ...direction, recettes: updateRecette(direction.recettes || []) });
    }
  };

  const updateMois = (i, val) => {
    const next = [...repartition];
    next[i] = Math.max(0, parseFloat(val) || 0);
    updateRepartition(next);
  };

  const appliquerPreset = (fn) => updateRepartition(fn());

  const normaliser = () => {
    if (total === 0) return;
    updateRepartition(repartition.map(v => +((v / total) * 100).toFixed(2)));
  };

  const montantAnnuel = (recette.montant || 0) * 12;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 no-print" onClick={() => setDialog(null)}>
      <div className={`w-full max-w-2xl rounded-3xl shadow-2xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${darkMode ? 'bg-cyan-900/50' : 'bg-cyan-100'}`}>
              <Calendar className="text-cyan-500" size={22} />
            </div>
            <div>
              <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>Saisonnalité des recettes</h3>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{recette.nom}</p>
              <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                {recette.montant?.toLocaleString()} €/mois · Total annuel : {montantAnnuel.toLocaleString()} €
              </p>
            </div>
          </div>
          <button onClick={() => setDialog(null)} className={`p-2 rounded-xl ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-slate-100 text-slate-400'}`}><X size={20} /></button>
        </div>

        {/* Presets */}
        <div className={`mb-5 p-3 rounded-2xl ${darkMode ? 'bg-gray-700/60' : 'bg-slate-50'}`}>
          <div className={`text-xs font-bold mb-2 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Modèles prédéfinis</div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset, i) => (
              <button
                key={i}
                onClick={() => appliquerPreset(preset.fn)}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-colors ${darkMode ? 'bg-gray-600 text-gray-200 hover:bg-cyan-800/60 hover:text-cyan-200' : 'bg-white border border-slate-200 text-slate-600 hover:bg-cyan-50 hover:border-cyan-300 hover:text-cyan-800'}`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grille 12 mois */}
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-2 mb-4">
          {repartition.map((pct, i) => {
            const montantMois = montantAnnuel * (pct / 100);
            return (
              <div key={i} className="text-center">
                <div className={`text-xs font-bold mb-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{MOIS_LABELS[i]}</div>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  title={`${MOIS_FULL[i]} : ${pct}% → ${Math.round(montantMois).toLocaleString()} €`}
                  className={`w-full text-center text-sm font-black rounded-xl py-2.5 outline-none border-2 transition-all ${
                    pct > 0
                      ? darkMode ? 'bg-cyan-800/50 border-cyan-500 text-cyan-100' : 'bg-cyan-100 border-cyan-400 text-cyan-800'
                      : darkMode ? 'bg-gray-700 border-gray-600 text-gray-400 focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-400 focus:border-cyan-400'
                  }`}
                  value={pct}
                  onChange={e => updateMois(i, e.target.value)}
                />
                <div className={`mt-1.5 h-1.5 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-slate-200'}`}>
                  <div className="h-full rounded-full bg-cyan-500 transition-all" style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
                {pct > 0 && (
                  <div className={`text-[10px] mt-1 font-bold ${darkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>
                    {Math.round(montantMois / 1000) > 0 ? Math.round(montantMois / 1000) + 'k' : Math.round(montantMois) + '€'}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Barre visuelle */}
        <div className="flex gap-0.5 h-3 rounded-full overflow-hidden mb-4">
          {repartition.map((pct, i) => (
            <div
              key={i}
              className="flex-1 transition-all"
              style={{ background: `rgba(6, 182, 212, ${Math.min(1, pct / 20)})`, minWidth: '1px' }}
              title={`${MOIS_FULL[i]}: ${pct}%`}
            />
          ))}
        </div>

        {/* Total et alerte */}
        <div className={`grid grid-cols-2 gap-3 mb-4 p-4 rounded-2xl ${darkMode ? 'bg-gray-700/60' : 'bg-cyan-50'}`}>
          <div className="text-center">
            <div className={`text-xs font-bold mb-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Total des % saisis</div>
            <div className={`text-2xl font-black ${ok ? (darkMode ? 'text-emerald-300' : 'text-emerald-700') : 'text-red-500'}`}>
              {totalArrondi}%
            </div>
          </div>
          <div className="text-center">
            <div className={`text-xs font-bold mb-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Recette annuelle effective</div>
            <div className={`text-2xl font-black ${darkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>
              {Math.round(montantAnnuel * total / 100).toLocaleString()} €
            </div>
          </div>
        </div>

        {!ok && (
          <div className={`flex items-start gap-2 mb-4 p-3 rounded-xl text-xs ${darkMode ? 'bg-amber-900/30 text-amber-300 border border-amber-700' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
            <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
            <span>
              <strong>Total à {totalArrondi}%</strong> — la somme doit être égale à 100% pour que la recette annuelle reste inchangée.
              {' '}
              <button onClick={normaliser} className="underline font-black">Normaliser automatiquement</button>
            </span>
          </div>
        )}

        <button
          onClick={() => setDialog(null)}
          className="w-full py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-black rounded-2xl hover:shadow-lg transition-all"
        >
          Valider la saisonnalité
        </button>
      </div>
    </div>
  );
};

export default ModalSaisonnalite;
