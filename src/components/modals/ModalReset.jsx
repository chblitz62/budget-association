import React, { useState } from 'react';
import { Eye, EyeOff, AlertTriangle, RotateCcw, Lock } from 'lucide-react';

const ModalReset = ({ darkMode, showResetModal, setShowResetModal, onConfirm }) => {
  const [resetPassword, setResetPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetShowPwd, setResetShowPwd] = useState(false);

  const handleSubmit = async () => {
    if (!resetPassword) { setResetError('Veuillez saisir le mot de passe'); return; }
    const error = await onConfirm(resetPassword);
    if (error) {
      setResetError(error);
      setResetPassword('');
    } else {
      setResetPassword('');
      setResetError('');
      setShowResetModal(false);
    }
  };

  if (!showResetModal) return null;
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 no-print">
      <div className={`max-w-md w-full rounded-3xl shadow-2xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-2xl bg-red-100"><RotateCcw className="text-red-600" size={24} /></div>
          <div>
            <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>Remise à zéro globale</h3>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Action irréversible</p>
          </div>
        </div>
        <div className={`mb-5 p-4 rounded-2xl border-2 text-sm ${darkMode ? 'bg-red-900/20 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-700'}`}>
          <div className="flex items-start gap-2">
            <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
            <div>
              <strong>Cette action supprimera définitivement :</strong>
              <ul className="mt-1 list-disc list-inside space-y-0.5 font-normal">
                <li>Tous les budgets (Direction &amp; Services)</li>
                <li>Tous les paramètres globaux</li>
                <li>Toutes les données du Pilotage Financier</li>
                <li>L'historique localStorage de l'application</li>
              </ul>
            </div>
          </div>
        </div>
        <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>
          <Lock size={14} className="inline mr-1" />
          Confirmez avec le mot de passe de l'application
        </label>
        <div className="relative mb-3">
          <input
            type={resetShowPwd ? 'text' : 'password'}
            value={resetPassword}
            onChange={e => { setResetPassword(e.target.value); setResetError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            autoFocus
            className={`w-full px-4 py-3 pr-12 rounded-xl border-2 outline-none transition-all ${
              resetError
                ? 'border-red-400 bg-red-50'
                : darkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-red-500' : 'bg-slate-50 border-slate-200 focus:border-red-400'
            }`}
            placeholder="Mot de passe…"
          />
          <button type="button" onClick={() => setResetShowPwd(!resetShowPwd)}
            className={`absolute right-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-slate-400'}`}>
            {resetShowPwd ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {resetError && (
          <div className="mb-3 p-3 bg-red-100 text-red-700 rounded-xl text-sm font-bold flex items-center gap-2">
            <AlertTriangle size={15} /> {resetError}
          </div>
        )}
        <div className="flex gap-3">
          <button
            onClick={() => { setShowResetModal(false); setResetPassword(''); setResetError(''); }}
            className={`flex-1 py-3 rounded-xl font-bold ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold rounded-xl hover:shadow-lg flex items-center justify-center gap-2"
          >
            <RotateCcw size={16} /> Réinitialiser tout
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalReset;
