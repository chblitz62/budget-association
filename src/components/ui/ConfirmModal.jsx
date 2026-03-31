import React, { useState, useEffect } from 'react';
import { AlertTriangle, HelpCircle, X } from 'lucide-react';

/**
 * Modal de confirmation global.
 * API : window.appConfirm(title, message, opts?) → Promise<boolean>
 * opts : { confirmLabel, cancelLabel, danger }
 */

if (typeof window !== 'undefined') {
  window.appConfirm = (title, message, opts = {}) =>
    new Promise((resolve) => {
      window.dispatchEvent(
        new CustomEvent('app-confirm', { detail: { title, message, opts, resolve } })
      );
    });
}

const ConfirmModal = ({ darkMode }) => {
  const [state, setState] = useState(null);

  useEffect(() => {
    const handler = (e) => setState(e.detail);
    window.addEventListener('app-confirm', handler);
    return () => window.removeEventListener('app-confirm', handler);
  }, []);

  if (!state) return null;

  const { title, message, opts = {}, resolve } = state;
  const danger = opts.danger !== false;
  const confirmLabel = opts.confirmLabel || 'Confirmer';
  const cancelLabel  = opts.cancelLabel  || 'Annuler';

  const answer = (val) => { setState(null); resolve(val); };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9998] no-print"
      onClick={() => answer(false)}
    >
      <div
        className={`max-w-md w-full mx-4 p-6 rounded-3xl shadow-2xl ${darkMode ? 'bg-zinc-900 border border-zinc-700' : 'bg-white border border-slate-100'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4 mb-4">
          <div className={`p-3 rounded-2xl flex-shrink-0 ${danger ? 'bg-rose-100' : 'bg-blue-100'}`}>
            {danger
              ? <AlertTriangle size={22} className="text-rose-500" />
              : <HelpCircle size={22} className="text-blue-500" />
            }
          </div>
          <div className="flex-1">
            <h3 className={`font-black text-base ${darkMode ? 'text-white' : 'text-slate-800'}`}>{title}</h3>
            {message && (
              <p className={`mt-1 text-sm leading-relaxed ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>{message}</p>
            )}
          </div>
          <button onClick={() => answer(false)} className={`p-1 rounded-lg opacity-50 hover:opacity-100 transition-opacity ${darkMode ? 'text-zinc-400' : 'text-slate-400'}`}>
            <X size={16} />
          </button>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={() => answer(false)}
            className={`px-4 py-2 rounded-xl font-semibold text-sm transition-colors ${darkMode ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => answer(true)}
            className={`px-4 py-2 rounded-xl font-bold text-sm text-white transition-all hover:-translate-y-0.5 ${danger ? 'bg-rose-500 hover:bg-rose-600 shadow-md shadow-rose-500/20' : 'bg-indigo-500 hover:bg-indigo-600 shadow-md shadow-indigo-500/20'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
