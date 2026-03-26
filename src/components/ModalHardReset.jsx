import React, { useState } from 'react';
import { Trash2, X, AlertTriangle } from 'lucide-react';
import { hardReset } from '../utils/storage';

const MOT_CONFIRMATION = 'SUPPRIMER';

/**
 * ModalHardReset — double confirmation avant effacement total.
 * Étape 1 : checkbox "Je comprends que toutes les données seront perdues"
 * Étape 2 : saisir le mot "SUPPRIMER"
 */
export default function ModalHardReset({ onClose, darkMode }) {
  const [accepted, setAccepted] = useState(false);
  const [motSaisi, setMotSaisi] = useState('');

  const peutConfirmer = accepted && motSaisi === MOT_CONFIRMATION;

  const handleReset = () => {
    if (!peutConfirmer) return;
    hardReset();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className={`w-full max-w-md mx-4 rounded-2xl border shadow-2xl ${darkMode ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-slate-200'}`}>
        {/* En-tête */}
        <div className="flex items-center justify-between p-5 border-b border-red-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-500/20">
              <AlertTriangle size={20} className="text-red-400" />
            </div>
            <span className={`font-bold text-base ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Réinitialisation complète
            </span>
          </div>
          <button onClick={onClose} className={`p-1.5 rounded-lg hover:bg-zinc-700/50 ${darkMode ? 'text-zinc-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}>
            <X size={18} />
          </button>
        </div>

        {/* Corps */}
        <div className="p-5 space-y-5">
          <p className={`text-sm leading-relaxed ${darkMode ? 'text-zinc-300' : 'text-slate-600'}`}>
            Cette action <strong>effacera définitivement</strong> toutes les données saisies :
            services, personnel, budget, formations, paramètres.
            <br /><br />
            Cette opération est <strong>irréversible</strong>. Exportez vos données avant de continuer.
          </p>

          {/* Étape 1 */}
          <label className={`flex items-start gap-3 cursor-pointer rounded-xl p-3 border transition-colors ${accepted ? 'border-red-500/40 bg-red-500/10' : (darkMode ? 'border-zinc-700 bg-zinc-800' : 'border-slate-200 bg-slate-50')}`}>
            <input
              type="checkbox"
              checked={accepted}
              onChange={e => setAccepted(e.target.checked)}
              className="mt-0.5 accent-red-500 w-4 h-4 flex-shrink-0"
            />
            <span className={`text-sm ${darkMode ? 'text-zinc-300' : 'text-slate-700'}`}>
              Je comprends que toutes les données seront perdues et que cette action est irréversible.
            </span>
          </label>

          {/* Étape 2 */}
          <div>
            <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
              Tapez <strong className="text-red-400">{MOT_CONFIRMATION}</strong> pour confirmer
            </label>
            <input
              type="text"
              value={motSaisi}
              onChange={e => setMotSaisi(e.target.value)}
              placeholder={MOT_CONFIRMATION}
              disabled={!accepted}
              className={`w-full rounded-lg px-3 py-2 text-sm font-mono border transition-colors focus:outline-none ${
                !accepted
                  ? (darkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-600' : 'bg-slate-100 border-slate-200 text-slate-400')
                  : motSaisi === MOT_CONFIRMATION
                    ? 'bg-red-500/10 border-red-500/50 text-red-400'
                    : (darkMode ? 'bg-zinc-800 border-zinc-600 text-white' : 'bg-white border-slate-300 text-slate-900')
              }`}
            />
          </div>
        </div>

        {/* Pied */}
        <div className="flex gap-3 p-5 pt-0">
          <button
            onClick={onClose}
            className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${darkMode ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            Annuler
          </button>
          <button
            onClick={handleReset}
            disabled={!peutConfirmer}
            className={`flex-1 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              peutConfirmer
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/40'
                : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
            }`}
          >
            <Trash2 size={15} />
            Tout effacer
          </button>
        </div>
      </div>
    </div>
  );
}
