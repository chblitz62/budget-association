import React, { useState } from 'react';
import { Camera, GitCompare, Trash2, CheckCircle } from 'lucide-react';

const SNAPSHOT_KEY = 'budget_snapshot_v0';

export const saveSnapshot = (data) => {
  localStorage.setItem(SNAPSHOT_KEY, JSON.stringify({
    ...data,
    savedAt: new Date().toISOString(),
  }));
};

export const loadSnapshot = () => {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

export const deleteSnapshot = () => {
  localStorage.removeItem(SNAPSHOT_KEY);
};

/**
 * SnapshotManager — boutons "Figer comme Budget Voté" et "Comparer".
 * Intégré dans la barre header ou l'onglet Paramètres.
 */
export default function SnapshotManager({ currentData, onToggleCompare, compareMode, darkMode }) {
  const [saved, setSaved] = useState(false);
  const snapshot = loadSnapshot();

  const handleSave = () => {
    saveSnapshot(currentData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleDelete = async () => {
    const ok = await window.appConfirm?.('Supprimer le Budget Voté', 'Cette action est irréversible.', { confirmLabel: 'Supprimer' }) ?? window.confirm('Supprimer le Budget Voté enregistré ?');
    if (ok) { deleteSnapshot(); if (compareMode) onToggleCompare(); }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={handleSave}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
          saved
            ? 'bg-emerald-500 text-white'
            : darkMode
              ? 'bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700'
              : 'bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200'
        }`}
      >
        {saved ? <CheckCircle size={13} /> : <Camera size={13} />}
        {saved ? 'Figé !' : 'Figer comme Budget Voté'}
      </button>

      {snapshot && (
        <>
          <button
            onClick={onToggleCompare}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              compareMode
                ? 'bg-indigo-600 text-white'
                : darkMode
                  ? 'bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                  : 'bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <GitCompare size={13} />
            {compareMode ? 'Masquer comparaison' : 'Comparer avec Budget Voté'}
          </button>
          <button
            onClick={handleDelete}
            className={`p-2 rounded-xl text-xs transition-colors ${darkMode ? 'text-zinc-600 hover:text-rose-400 hover:bg-zinc-800' : 'text-slate-300 hover:text-rose-500 hover:bg-slate-100'}`}
            title="Supprimer le snapshot"
          >
            <Trash2 size={13} />
          </button>
          {snapshot.savedAt && (
            <span className={`text-[10px] ${darkMode ? 'text-zinc-600' : 'text-slate-400'}`}>
              Figé le {new Date(snapshot.savedAt).toLocaleDateString('fr-FR')}
            </span>
          )}
        </>
      )}
    </div>
  );
}
