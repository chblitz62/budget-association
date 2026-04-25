import React, { useState, useEffect } from 'react';
import { Save, RotateCcw, Trash2, Plus, GitBranch } from 'lucide-react';
import { STORAGE_KEYS } from '../utils/storage';

const SCENARIOS_KEY = 'assoc_scenarios';
const MAX_SCENARIOS = 8;

const loadScenarios = () => {
  try {
    const raw = localStorage.getItem(SCENARIOS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const saveScenarios = (list) => {
  localStorage.setItem(SCENARIOS_KEY, JSON.stringify(list));
};

const captureCurrentState = () => {
  const data = {};
  STORAGE_KEYS.forEach(key => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) data[key] = JSON.parse(raw);
    } catch { /* ignore */ }
  });
  return data;
};

export default function ScenariosManager({ darkMode }) {
  const [scenarios, setScenarios] = useState(loadScenarios);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setScenarios(loadScenarios());
  }, []);

  const handleSave = () => {
    const name = newName.trim() || `Scénario ${new Date().toLocaleDateString('fr-FR')}`;
    if (scenarios.length >= MAX_SCENARIOS) {
      window.appToast?.(`Maximum ${MAX_SCENARIOS} scénarios — supprimez-en un d'abord.`, 'error');
      return;
    }
    const entry = {
      id: Date.now(),
      name,
      savedAt: new Date().toISOString(),
      data: captureCurrentState(),
    };
    const updated = [entry, ...scenarios];
    saveScenarios(updated);
    setScenarios(updated);
    setNewName('');
    setSaving(true);
    setTimeout(() => setSaving(false), 1500);
  };

  const handleRestore = async (sc) => {
    const ok = await window.appConfirm?.(
      'Restaurer ce scénario',
      `Cela écrasera le budget actuel par "${sc.name}".\nLa page sera rechargée.`,
      { confirmLabel: 'Restaurer' }
    ) ?? window.confirm(`Restaurer le scénario "${sc.name}" ? Le budget actuel sera remplacé.`);
    if (!ok) return;
    STORAGE_KEYS.forEach(key => {
      if (sc.data[key] !== undefined) {
        localStorage.setItem(key, JSON.stringify(sc.data[key]));
      }
    });
    window.location.reload();
  };

  const handleDelete = async (sc) => {
    const ok = await window.appConfirm?.(
      'Supprimer ce scénario',
      `Supprimer "${sc.name}" ? Cette action est irréversible.`,
      { confirmLabel: 'Supprimer' }
    ) ?? window.confirm(`Supprimer le scénario "${sc.name}" ?`);
    if (!ok) return;
    const updated = scenarios.filter(s => s.id !== sc.id);
    saveScenarios(updated);
    setScenarios(updated);
  };

  return (
    <div className={`rounded-2xl border p-5 ${darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-slate-50 border-slate-200'}`}>
      <h3 className={`font-black text-sm flex items-center gap-2 mb-4 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
        <GitBranch size={16} className="text-indigo-500" /> Scénarios budgétaires ({scenarios.length}/{MAX_SCENARIOS})
      </h3>

      {/* Nouveau scénario */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="Nom du scénario (ex: Budget Initial V0)"
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          className={`flex-1 text-xs rounded-lg px-3 py-2 border ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'bg-white border-slate-300'}`}
        />
        <button
          onClick={handleSave}
          disabled={scenarios.length >= MAX_SCENARIOS}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
            saving ? 'bg-emerald-500 text-white' :
            scenarios.length >= MAX_SCENARIOS ? 'opacity-40 cursor-not-allowed bg-slate-200 text-slate-500' :
            darkMode ? 'bg-indigo-700 text-white hover:bg-indigo-600' : 'bg-indigo-500 text-white hover:bg-indigo-600'
          }`}
        >
          {saving ? '✓ Sauvé' : <><Save size={13} /> Sauvegarder</>}
        </button>
      </div>

      {/* Liste des scénarios */}
      {scenarios.length === 0 ? (
        <p className={`text-xs text-center py-4 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
          Aucun scénario sauvegardé. Cliquez "Sauvegarder" pour créer une version figée du budget actuel.
        </p>
      ) : (
        <div className="space-y-2">
          {scenarios.map(sc => (
            <div key={sc.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${darkMode ? 'bg-gray-600/60 border-gray-600' : 'bg-white border-slate-200'} border`}>
              <div className="flex-1 min-w-0">
                <div className={`text-xs font-bold truncate ${darkMode ? 'text-white' : 'text-slate-800'}`}>{sc.name}</div>
                <div className={`text-[10px] ${darkMode ? 'text-gray-400' : 'text-slate-400'}`}>
                  {new Date(sc.savedAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <button onClick={() => handleRestore(sc)}
                className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg transition-all ${darkMode ? 'bg-amber-900/30 text-amber-300 hover:bg-amber-800/50' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}>
                <RotateCcw size={11} /> Restaurer
              </button>
              <button onClick={() => handleDelete(sc)}
                className={`p-1.5 rounded-lg transition-all ${darkMode ? 'hover:bg-red-900/30 text-gray-500 hover:text-red-400' : 'hover:bg-red-50 text-slate-300 hover:text-red-500'}`}>
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
