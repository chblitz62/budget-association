import React, { useState } from 'react';
import { X, Users, Trash2, Plus } from 'lucide-react';

const ModalRoles = ({ darkMode, showRolesModal, setShowRolesModal, roles, setRoles }) => {
  const [newRoleLabel, setNewRoleLabel] = useState('');

  if (!showRolesModal) return null;
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 no-print">
      <div className={`max-w-md w-full rounded-3xl shadow-2xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}><Users className={darkMode ? 'text-slate-300' : 'text-slate-600'} size={22} /></div>
            <div>
              <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>Rôles du personnel</h3>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Personnaliser les intitulés de rôles</p>
            </div>
          </div>
          <button onClick={() => setShowRolesModal(false)} className={`p-2 rounded-xl ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-slate-100 text-slate-500'}`}><X size={18} /></button>
        </div>

        <div className="space-y-2 mb-4 max-h-72 overflow-y-auto pr-1">
          {roles.map((r, idx) => (
            <div key={r.id} className={`flex items-center gap-2 p-2 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-slate-50'}`}>
              <input
                className={`flex-1 text-sm font-bold bg-transparent outline-none px-2 py-1 rounded-lg ${darkMode ? 'text-white placeholder-gray-500' : 'text-slate-800'}`}
                value={r.label}
                onChange={e => setRoles(prev => prev.map((x, i) => i === idx ? { ...x, label: e.target.value } : x))}
                placeholder="Nom du rôle"
              />
              <button
                onClick={() => setRoles(prev => prev.filter((_, i) => i !== idx))}
                className="p-1.5 rounded-lg text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors"
                title="Supprimer ce rôle"
              ><Trash2 size={14} /></button>
            </div>
          ))}
          {roles.length === 0 && (
            <p className={`text-center text-sm py-4 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Aucun rôle défini</p>
          )}
        </div>

        <div className={`flex gap-2 p-3 rounded-2xl border-2 border-dashed ${darkMode ? 'border-gray-600' : 'border-slate-200'}`}>
          <input
            className={`flex-1 text-sm bg-transparent outline-none px-2 ${darkMode ? 'text-white placeholder-gray-500' : 'text-slate-800 placeholder-slate-400'}`}
            value={newRoleLabel}
            onChange={e => setNewRoleLabel(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && newRoleLabel.trim()) {
                const id = newRoleLabel.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                setRoles(prev => [...prev, { id: id + '_' + Date.now(), label: newRoleLabel.trim() }]);
                setNewRoleLabel('');
              }
            }}
            placeholder="Nouveau rôle..."
          />
          <button
            onClick={() => {
              if (!newRoleLabel.trim()) return;
              const id = newRoleLabel.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
              setRoles(prev => [...prev, { id: id + '_' + Date.now(), label: newRoleLabel.trim() }]);
              setNewRoleLabel('');
            }}
            className="bg-teal-500 text-white px-3 py-1.5 rounded-xl text-sm font-bold hover:bg-teal-600 flex items-center gap-1"
          ><Plus size={14} /> Ajouter</button>
        </div>

        <div className="flex justify-end mt-4">
          <button onClick={() => setShowRolesModal(false)} className="bg-teal-500 text-white px-5 py-2 rounded-xl font-bold hover:bg-teal-600">Fermer</button>
        </div>
      </div>
    </div>
  );
};

export default ModalRoles;
