import React, { useState } from 'react';
import { X, Key } from 'lucide-react';
import { DEFAULT_PASSWORD } from '../../utils/constants';
import { storePassword } from '../../utils/auth';

const ModalPassword = ({ darkMode, showPasswordModal, setShowPasswordModal }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

  const handleChangePassword = async () => {
    if (newPassword.length < 4) {
      setPasswordMessage('Le mot de passe doit contenir au moins 4 caractères');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage('Les mots de passe ne correspondent pas');
      return;
    }
    await storePassword(newPassword);
    setPasswordMessage('Mot de passe modifié avec succès !');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => {
      setShowPasswordModal(false);
      setPasswordMessage('');
    }, 1500);
  };

  const handleResetPassword = () => {
    localStorage.removeItem('budget_custom_password');
    localStorage.removeItem('budget_custom_password_hash');
    setPasswordMessage('Mot de passe réinitialisé au défaut : ' + DEFAULT_PASSWORD);
    setTimeout(() => setPasswordMessage(''), 3000);
  };

  if (!showPasswordModal) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 no-print">
      <div className={`max-w-md w-full mx-4 p-6 rounded-3xl shadow-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h3 className={`text-xl font-black mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
          <Key size={24} className="text-purple-500" /> Changer le mot de passe
        </h3>
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-bold mb-1 ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>Nouveau mot de passe</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={`w-full px-4 py-2 rounded-xl border-2 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-slate-50 border-slate-200'}`}
              placeholder="Minimum 4 caractères"
            />
          </div>
          <div>
            <label className={`block text-sm font-bold mb-1 ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>Confirmer le mot de passe</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full px-4 py-2 rounded-xl border-2 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-slate-50 border-slate-200'}`}
              placeholder="Confirmer"
            />
          </div>
          {passwordMessage && (
            <div className={`p-3 rounded-xl text-sm font-bold ${passwordMessage.includes('succès') ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
              {passwordMessage}
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={handleChangePassword}
              className="flex-1 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl"
            >
              Valider
            </button>
            <button
              onClick={handleResetPassword}
              className={`px-4 py-2 rounded-xl font-bold ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-slate-200 text-slate-600'}`}
            >
              Réinitialiser
            </button>
            <button
              onClick={() => { setShowPasswordModal(false); setPasswordMessage(''); setNewPassword(''); setConfirmPassword(''); }}
              className="px-4 py-2 bg-slate-500 text-white font-bold rounded-xl"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalPassword;
