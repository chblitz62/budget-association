import React, { useState } from 'react';
import { Lock, Eye, EyeOff, HelpCircle } from 'lucide-react';
import { DEFAULT_PASSWORD } from '../utils/constants';

/**
 * @typedef {{ onLogin: () => void, checkPassword: (pwd: string) => Promise<boolean>, darkMode: boolean }} LoginScreenProps
 * @param {LoginScreenProps} props
 */
const LoginScreen = ({ onLogin, checkPassword, darkMode }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (await checkPassword(password)) {
      localStorage.setItem('budget_authenticated', 'true');
      onLogin();
    } else {
      setError('Mot de passe incorrect');
      setPassword('');
    }
  };

  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-slate-50 to-slate-100'}`}>
      <div className={`max-w-md w-full p-8 rounded-3xl shadow-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="text-center mb-8">
          <img src="/logo.png" alt="AFERTES" className="h-20 mx-auto mb-4" />
          <h1 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>Budget Association</h1>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Accès sécurisé</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>
              <Lock size={16} className="inline mr-2" />
              Mot de passe
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-3 pr-12 rounded-xl border-2 outline-none transition-all ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-teal-500'
                    : 'bg-slate-50 border-slate-200 focus:border-teal-500'
                }`}
                placeholder="Entrez le mot de passe"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-slate-400'}`}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl text-sm font-bold">
              {error}
            </div>
          )}
          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold rounded-xl hover:shadow-lg transition-all"
          >
            Se connecter
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setShowHint(!showHint)}
            className={`text-sm flex items-center justify-center gap-1 mx-auto ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <HelpCircle size={14} />
            Mot de passe oublié ?
          </button>
          {showHint && (
            <div className={`mt-2 p-3 rounded-xl text-sm ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-slate-100 text-slate-600'}`}>
              {isLocalhost ? (
                <>Mot de passe par défaut : <strong className="text-teal-600">{DEFAULT_PASSWORD}</strong></>
              ) : (
                <>Contactez l'administrateur pour obtenir le mot de passe.</>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
