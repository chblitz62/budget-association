import React, { useRef } from 'react';
import { FolderOpen, FilePlus, Upload, BarChart3 } from 'lucide-react';
import { importData } from '../utils/storage';

/**
 * StartupGate — affiché au premier lancement (pas de données localStorage).
 * Trois options : reprendre (ne devrait pas apparaître si données présentes),
 * importer un JSON, ou démarrer un budget vide.
 */
export default function StartupGate({ onStart, darkMode }) {
  const fileRef = useRef(null);

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importData(file);
      window.location.reload();
    } catch (err) {
      alert(`Erreur d'import : ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950">
      <div className="w-full max-w-lg px-6">
        {/* Logo / titre */}
        <div className="flex flex-col items-center mb-10">
          <div className="p-4 rounded-2xl bg-indigo-600/20 mb-4">
            <BarChart3 size={40} className="text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Budget Association</h1>
          <p className="text-zinc-400 text-sm mt-1">Outil de pilotage budgétaire</p>
        </div>

        {/* Cartes d'action */}
        <div className="flex flex-col gap-3">
          {/* Importer */}
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-4 p-5 rounded-2xl bg-zinc-900 border border-zinc-700/50 hover:border-indigo-500/60 hover:bg-zinc-800/80 transition-all text-left group"
          >
            <div className="p-2.5 rounded-xl bg-indigo-600/20 group-hover:bg-indigo-600/30 transition-colors">
              <Upload size={22} className="text-indigo-400" />
            </div>
            <div>
              <div className="text-white font-semibold text-sm">Importer une sauvegarde</div>
              <div className="text-zinc-400 text-xs mt-0.5">Charger un fichier JSON exporté précédemment</div>
            </div>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />

          {/* Nouveau budget */}
          <button
            onClick={onStart}
            className="flex items-center gap-4 p-5 rounded-2xl bg-zinc-900 border border-zinc-700/50 hover:border-emerald-500/60 hover:bg-zinc-800/80 transition-all text-left group"
          >
            <div className="p-2.5 rounded-xl bg-emerald-600/20 group-hover:bg-emerald-600/30 transition-colors">
              <FilePlus size={22} className="text-emerald-400" />
            </div>
            <div>
              <div className="text-white font-semibold text-sm">Nouveau budget</div>
              <div className="text-zinc-400 text-xs mt-0.5">Partir d'une structure vide et saisir vos données</div>
            </div>
          </button>
        </div>

        <p className="text-center text-zinc-600 text-xs mt-8">
          Données stockées localement dans votre navigateur — aucune transmission externe
        </p>
      </div>
    </div>
  );
}
