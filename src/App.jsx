import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Download, Building2, Users, Landmark, Settings, Calendar, TrendingUp, Euro, Save, Upload, Printer, Moon, Sun, Lock, LogOut, GraduationCap, MapPin, UserMinus, Banknote, TrendingDown, CheckCircle, AlertTriangle, FileSpreadsheet, Key, Eye, EyeOff, HelpCircle, X, AlertCircle, Clock, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { exportToExcel } from './utils/excelExport';
import { exportToPDF } from './utils/pdfExport';

// Import des constantes et valeurs par défaut
import {
  CHARGES_PATRONALES,
  PRIME_SEGUR,
  JOURS_ANNEE,
  COMPTES_IMMO,
  COMPTES_EXPLOITATION,
  COMPTES_RECETTES,
  DEFAULT_PASSWORD,
  SITES,
  MOIS,
  calculerEffectifActuel,
  calculerStatsFormation,
  calculerTotalRealisations,
  defaultRealisations,
  defaultGlobalParams,
  defaultDirection,
  defaultServices
} from './utils/constants';

// Import des fonctions de calcul
import {
  validerNombre,
  validerEntier,
  validerTaux,
  validerETP,
  validerSalaire,
  validerMontant,
  validerDuree,
  validerUnites,
  calculerBudgetDirection,
  calculerBudgetService,
  calculerProvisions,
  calculerBFR,
  calculerFondRoulement,
  calculerSynthese3Ans,
  calculerBudgetAnnuelMensuel,
  loadFromStorage
} from './utils/calculations';

// Fonction pour obtenir le mot de passe actuel (custom ou défaut)
const getPassword = () => {
  const customPassword = localStorage.getItem('budget_custom_password');
  return customPassword || DEFAULT_PASSWORD;
};

// Composant de connexion
const LoginScreen = ({ onLogin, darkMode }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const currentPassword = getPassword();
    if (password === currentPassword) {
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

        {/* Bouton mot de passe oublié */}
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

// Composant de confirmation de suppression
const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, darkMode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 no-print">
      <div className={`max-w-md w-full mx-4 p-6 rounded-3xl shadow-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-full bg-red-100">
            <AlertCircle className="text-red-600" size={24} />
          </div>
          <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>{title}</h3>
        </div>
        <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-xl font-bold ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
          >
            Annuler
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className="px-4 py-2 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
};

// Composant indicateur de sauvegarde
const SaveIndicator = ({ darkMode }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleStorage = () => {
      setVisible(true);
      setTimeout(() => setVisible(false), 2000);
    };
    window.addEventListener('storage-save', handleStorage);
    return () => window.removeEventListener('storage-save', handleStorage);
  }, []);

  if (!visible) return null;
  return (
    <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 z-40 ${darkMode ? 'bg-teal-900 text-teal-300' : 'bg-teal-500 text-white'}`}>
      <CheckCircle size={18} />
      <span className="font-bold text-sm">Sauvegardé</span>
    </div>
  );
};

const BudgetTool = () => {
  const fileInputRef = useRef(null);

  // Authentification
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('budget_authenticated') === 'true';
  });

  // État pour la confirmation de suppression
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const [globalParams, setGlobalParams] = useState(() => loadFromStorage('assoc_globalParams', defaultGlobalParams));
  const [direction, setDirection] = useState(() => loadFromStorage('assoc_direction', defaultDirection));
  const [services, setServices] = useState(() => loadFromStorage('assoc_services', defaultServices));

  // Mode sombre persistant
  const [darkMode, setDarkMode] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('dark') === 'true') return true;
    if (urlParams.get('dark') === 'false') return false;
    return loadFromStorage('assoc_darkMode', false);
  });

  // Sauvegarde automatique avec notification
  const triggerSaveIndicator = () => window.dispatchEvent(new Event('storage-save'));
  useEffect(() => { localStorage.setItem('assoc_globalParams', JSON.stringify(globalParams)); triggerSaveIndicator(); }, [globalParams]);
  useEffect(() => { localStorage.setItem('assoc_direction', JSON.stringify(direction)); triggerSaveIndicator(); }, [direction]);
  useEffect(() => { localStorage.setItem('assoc_services', JSON.stringify(services)); triggerSaveIndicator(); }, [services]);
  useEffect(() => { localStorage.setItem('assoc_darkMode', JSON.stringify(darkMode)); }, [darkMode]);

  // Gestion du mot de passe (uniquement en local)
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  const handleChangePassword = () => {
    if (newPassword.length < 4) {
      setPasswordMessage('Le mot de passe doit contenir au moins 4 caractères');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage('Les mots de passe ne correspondent pas');
      return;
    }
    localStorage.setItem('budget_custom_password', newPassword);
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
    setPasswordMessage('Mot de passe réinitialisé au défaut : ' + DEFAULT_PASSWORD);
    setTimeout(() => setPasswordMessage(''), 3000);
  };

  const handleLogout = () => {
    localStorage.removeItem('budget_authenticated');
    setIsAuthenticated(false);
  };

  const getBudgetDirection = () => calculerBudgetDirection(direction);
  const getBudgetService = (service) => calculerBudgetService(service);
  const getProvisions = () => calculerProvisions(direction, services, globalParams);
  const getBFR = () => calculerBFR(direction, services, globalParams);
  const getFondRoulement = () => calculerFondRoulement(direction, services, globalParams);
  const summary3Ans = calculerSynthese3Ans(direction, services, globalParams);
  const budgetAnnuel = calculerBudgetAnnuelMensuel(direction, services, globalParams);

  const sauvegarderBudget = () => {
    const data = { version: '2.0', type: 'association', date: new Date().toISOString(), globalParams, direction, services };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `budget_association_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const chargerBudget = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          if (data.globalParams) setGlobalParams(data.globalParams);
          if (data.direction) setDirection(data.direction);
          if (data.services) setServices(data.services);
          alert('Budget chargé !');
        } catch { alert('Erreur de chargement'); }
      };
      reader.readAsText(file);
    }
  };

  if (!isAuthenticated) {
    return <LoginScreen onLogin={() => setIsAuthenticated(true)} darkMode={darkMode} />;
  }

  const nomsMois = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

  // Calcul des alertes
  const totalRecettes = services.reduce((sum, s) => sum + getBudgetService(s).recettes, 0);
  const totalCharges = services.reduce((sum, s) => sum + getBudgetService(s).total, 0) + getBudgetDirection().total;
  const soldeGlobal = totalRecettes - totalCharges;
  const hasDeficit = soldeGlobal < 0;

  return (
    <div className={`min-h-screen p-4 md:p-8 transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-slate-50 to-slate-100'}`}>
      {/* Composants globaux */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        darkMode={darkMode}
      />
      <SaveIndicator darkMode={darkMode} />

      <div className="max-w-7xl mx-auto">

        {/* ALERTE DÉFICIT */}
        {hasDeficit && (
          <div className={`mb-6 p-4 rounded-2xl border-2 flex items-center gap-4 ${darkMode ? 'bg-red-900/30 border-red-800' : 'bg-red-50 border-red-300'}`}>
            <AlertTriangle className="text-red-500" size={32} />
            <div>
              <h3 className={`font-black ${darkMode ? 'text-red-400' : 'text-red-700'}`}>Attention : Budget en déficit</h3>
              <p className={`text-sm ${darkMode ? 'text-red-300' : 'text-red-600'}`}>
                Le solde global est de <strong>{Math.round(soldeGlobal).toLocaleString()} €</strong>.
                Recettes : {Math.round(totalRecettes).toLocaleString()} € | Charges : {Math.round(totalCharges).toLocaleString()} €
              </p>
            </div>
          </div>
        )}

        {/* HEADER */}
        <div className={`rounded-3xl shadow-lg border p-6 mb-6 no-print ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img src="/logo.png" alt="AFERTES" className={`h-12 ${darkMode ? 'brightness-200' : ''}`} />
              <div>
                <h1 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>Budget Association</h1>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Gestion budgétaire - Projection sur 3 ans</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={() => setDarkMode(!darkMode)} className={`p-3 rounded-xl ${darkMode ? 'bg-yellow-500 text-gray-900' : 'bg-gray-800 text-white'}`}>
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <div className={`px-4 py-2 rounded-xl border ${darkMode ? 'bg-teal-900/30 border-teal-700' : 'bg-teal-50 border-teal-200'}`}>
                <span className={`text-xs font-bold uppercase ${darkMode ? 'text-teal-400' : 'text-teal-600'}`}>Augmentation</span>
                <div className="flex items-center gap-1">
                  <input type="number" step="0.1" value={globalParams.augmentationAnnuelle}
                    onChange={(e) => setGlobalParams({...globalParams, augmentationAnnuelle: validerTaux(e.target.value)})}
                    className={`bg-transparent font-black text-xl outline-none w-12 ${darkMode ? 'text-teal-300' : 'text-teal-700'}`}
                  />
                  <span className={`font-bold ${darkMode ? 'text-teal-400' : 'text-teal-600'}`}>%</span>
                </div>
              </div>
              <button onClick={sauvegarderBudget} className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2"><Save size={18} /> Sauver</button>
              <button onClick={() => fileInputRef.current.click()} className="bg-slate-600 text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2"><Upload size={18} /> Charger</button>
              <input type="file" ref={fileInputRef} onChange={chargerBudget} accept=".json" className="hidden" />
              <button onClick={() => exportToExcel(direction, services, globalParams)} className="bg-green-600 text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2"><FileSpreadsheet size={18} /> Excel</button>
              <button onClick={() => exportToPDF(direction, services, globalParams)} className="bg-red-600 text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2"><Download size={18} /> PDF</button>
              <button onClick={() => window.print()} className="bg-slate-500 text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2"><Printer size={18} /></button>
              {isLocalhost && (
                <button onClick={() => setShowPasswordModal(true)} className="bg-purple-600 text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2"><Key size={18} /></button>
              )}
              <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2"><LogOut size={18} /></button>
            </div>
          </div>
        </div>

        {/* Modal changement de mot de passe */}
        {showPasswordModal && (
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
        )}

        {/* GRAPHIQUE ANNUEL */}
        <div className={`rounded-3xl shadow-lg border-2 p-6 mb-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
          <h2 className={`text-xl font-black mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
            <Calendar size={24} className="text-teal-500" /> Budget Annuel - Répartition mensuelle
          </h2>
          <div className="grid grid-cols-12 gap-2 mb-4">
            {budgetAnnuel.mois.map((m, i) => {
              const maxMois = Math.max(...budgetAnnuel.mois.map(x => x.total));
              const heightPct = maxMois > 0 ? (m.total / maxMois) * 100 : 0;
              return (
                <div key={i} className="flex flex-col items-center">
                  <div className="w-full h-32 flex flex-col justify-end">
                    <div className="w-full bg-gradient-to-t from-teal-500 to-cyan-400 rounded-t-lg" style={{ height: `${heightPct}%` }} title={`${Math.round(m.total).toLocaleString()} €`}></div>
                  </div>
                  <span className={`text-xs font-bold mt-2 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{nomsMois[i]}</span>
                  <span className={`text-xs font-black ${darkMode ? 'text-white' : 'text-slate-700'}`}>{Math.round(m.total / 1000)}k</span>
                </div>
              );
            })}
          </div>
          <div className={`grid grid-cols-4 gap-4 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
            <div className={`p-3 rounded-xl ${darkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
              <div className={`text-xs font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>Masse salariale</div>
              <div className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>{Math.round(budgetAnnuel.salaires).toLocaleString()} €</div>
            </div>
            <div className={`p-3 rounded-xl ${darkMode ? 'bg-teal-900/30' : 'bg-teal-50'}`}>
              <div className={`text-xs font-bold ${darkMode ? 'text-teal-400' : 'text-teal-600'}`}>Exploitation</div>
              <div className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>{Math.round(budgetAnnuel.exploitation).toLocaleString()} €</div>
            </div>
            <div className={`p-3 rounded-xl ${darkMode ? 'bg-orange-900/30' : 'bg-orange-50'}`}>
              <div className={`text-xs font-bold ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>Amortissements</div>
              <div className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>{Math.round(budgetAnnuel.amortissements).toLocaleString()} €</div>
            </div>
            <div className={`p-3 rounded-xl ${darkMode ? 'bg-purple-900/30' : 'bg-purple-50'}`}>
              <div className={`text-xs font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>Total annuel</div>
              <div className={`text-lg font-black ${darkMode ? 'text-teal-400' : 'text-teal-600'}`}>{Math.round(budgetAnnuel.totalAnnuel).toLocaleString()} €</div>
            </div>
          </div>
        </div>

        {/* SYNTHESE 3 ANS - CARTES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {summary3Ans.map(s => (
            <div key={s.annee} className={`p-6 rounded-3xl shadow-lg border-2 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gradient-to-br from-white to-cyan-50 border-teal-200'}`}>
              <div className="flex justify-between items-start mb-4">
                <span className="text-sm font-black uppercase text-teal-400">Année {s.annee}</span>
                <TrendingUp className="text-teal-500" size={24} />
              </div>
              <div className={`text-3xl font-black mb-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>{Math.round(s.total).toLocaleString()} €</div>
              <div className={`text-sm space-y-1 ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>
                <div className="flex justify-between"><span>Amortissements:</span><span className="font-bold">{Math.round(s.amortissements).toLocaleString()} €</span></div>
                <div className="flex justify-between"><span>Intérêts:</span><span className="font-bold">{Math.round(s.interets).toLocaleString()} €</span></div>
                <div className="flex justify-between"><span>Direction:</span><span className="font-bold">{Math.round(s.budgetDirection).toLocaleString()} €</span></div>
              </div>
              <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-teal-200'}`}>
                <div className={`text-xs font-black uppercase mb-2 ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>Par service</div>
                {s.detailsServices.map(serv => (
                  <div key={serv.nom} className={`p-2 rounded-lg mb-1 ${darkMode ? 'bg-gray-700/50' : 'bg-white/60'}`}>
                    <div className={`font-bold text-sm ${darkMode ? 'text-gray-200' : 'text-slate-700'}`}>{serv.nom}</div>
                    <div className={`text-xs ${darkMode ? 'text-teal-400' : 'text-teal-700'}`}>{Math.round(serv.budget).toLocaleString()} €</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* GRAPHIQUES */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Graphique évolution 3 ans */}
          <div className={`rounded-3xl shadow-lg border-2 p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
            <h2 className={`text-xl font-black mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              <BarChart3 size={24} className="text-teal-500" /> Évolution Budget sur 3 ans
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={summary3Ans.map(s => ({
                name: `Année ${s.annee}`,
                Budget: Math.round(s.total),
                Direction: Math.round(s.budgetDirection),
                Amortissements: Math.round(s.amortissements)
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e2e8f0'} />
                <XAxis dataKey="name" stroke={darkMode ? '#9ca3af' : '#64748b'} />
                <YAxis stroke={darkMode ? '#9ca3af' : '#64748b'} tickFormatter={(v) => `${Math.round(v/1000)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: darkMode ? '#1f2937' : '#fff', border: 'none', borderRadius: '12px' }}
                  formatter={(value) => `${value.toLocaleString()} €`}
                />
                <Legend />
                <Bar dataKey="Budget" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Direction" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Amortissements" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Répartition par service */}
          <div className={`rounded-3xl shadow-lg border-2 p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
            <h2 className={`text-xl font-black mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              <Users size={24} className="text-purple-500" /> Répartition par service (Année 1)
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Direction', value: Math.round(summary3Ans[0].budgetDirection) },
                    ...summary3Ans[0].detailsServices.map(s => ({ name: s.nom, value: Math.round(s.budget) }))
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {['#14b8a6', '#8b5cf6', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'].map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value.toLocaleString()} €`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PROVISIONS & BFR & FOND DE ROULEMENT */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* PROVISIONS */}
          <div className={`rounded-3xl shadow-lg border-2 p-6 ${darkMode ? 'bg-gray-800 border-orange-900' : 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-200'}`}>
            {(() => { const p = getProvisions(); return (<>
              <div className="flex justify-between items-center mb-4">
                <h2 className={`text-xl font-black ${darkMode ? 'text-orange-400' : 'text-orange-900'}`}>Provisions pour risque</h2>
                <button
                  onClick={() => setGlobalParams({
                    ...globalParams,
                    provisions: [...(globalParams.provisions || []), {
                      id: `prov_${Date.now()}`,
                      nom: 'Nouvelle provision',
                      baseCalcul: 'salaires',
                      taux: 0
                    }]
                  })}
                  className="bg-orange-500 text-white p-2 rounded-lg no-print"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {(p.details || []).map((prov, idx) => (
                  <div key={prov.id} className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-white'} group relative`}>
                    <button
                      onClick={() => setGlobalParams({
                        ...globalParams,
                        provisions: globalParams.provisions.filter(pr => pr.id !== prov.id)
                      })}
                      className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 no-print"
                    >
                      <Trash2 size={10} />
                    </button>
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        className={`flex-1 font-bold text-sm bg-transparent outline-none ${darkMode ? 'text-white' : 'text-slate-700'}`}
                        value={globalParams.provisions[idx]?.nom || prov.nom}
                        onChange={(e) => setGlobalParams({
                          ...globalParams,
                          provisions: globalParams.provisions.map(pr =>
                            pr.id === prov.id ? {...pr, nom: e.target.value} : pr
                          )
                        })}
                      />
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <select
                        className={`rounded px-2 py-1 ${darkMode ? 'bg-gray-600 text-white' : 'bg-orange-50'}`}
                        value={globalParams.provisions[idx]?.baseCalcul || prov.baseCalcul}
                        onChange={(e) => setGlobalParams({
                          ...globalParams,
                          provisions: globalParams.provisions.map(pr =>
                            pr.id === prov.id ? {...pr, baseCalcul: e.target.value} : pr
                          )
                        })}
                      >
                        <option value="salaires">% Salaires</option>
                        <option value="investissements">% Investissements</option>
                        <option value="chiffre_affaires">% Chiffre d'affaires</option>
                      </select>
                      <input
                        type="number"
                        step="0.1"
                        className={`w-16 text-right rounded px-2 py-1 font-bold ${darkMode ? 'bg-gray-600 text-white' : 'bg-orange-50'}`}
                        value={globalParams.provisions[idx]?.taux || 0}
                        onChange={(e) => setGlobalParams({
                          ...globalParams,
                          provisions: globalParams.provisions.map(pr =>
                            pr.id === prov.id ? {...pr, taux: validerTaux(e.target.value)} : pr
                          )
                        })}
                      />
                      <span className={darkMode ? 'text-gray-400' : 'text-slate-500'}>%</span>
                    </div>
                    <div className={`text-right mt-1 font-black text-orange-600`}>
                      {Math.round(prov.montant).toLocaleString()} €
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white flex justify-between">
                <span className="font-bold">TOTAL</span>
                <span className="text-xl font-black">{Math.round(p.total).toLocaleString()} €</span>
              </div>
            </>); })()}
          </div>

          {/* FOND DE ROULEMENT */}
          <div className={`rounded-3xl shadow-lg border-2 p-6 ${darkMode ? 'bg-gray-800 border-purple-900' : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200'}`}>
            {(() => { const fr = getFondRoulement(); return (<>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <h2 className={`text-xl font-black ${darkMode ? 'text-purple-400' : 'text-purple-900'}`}>Fonds de Roulement</h2>
                  <div className="relative group">
                    <HelpCircle size={16} className={`cursor-help ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                    <div className={`absolute left-0 top-6 w-72 p-3 rounded-xl shadow-lg z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-white text-slate-700'}`}>
                      <p className="font-bold mb-2">Méthode de calcul :</p>
                      <p className="text-xs mb-1"><strong>FR = Capitaux permanents - Immobilisations nettes</strong></p>
                      <p className="text-xs text-gray-500">Le FR représente la part des capitaux permanents qui finance l'exploitation. Un FR positif signifie une marge de sécurité financière.</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setGlobalParams({
                    ...globalParams,
                    fondRoulement: [...(globalParams.fondRoulement || []), {
                      id: `fr_${Date.now()}`,
                      nom: 'Nouveau poste',
                      montant: 0
                    }]
                  })}
                  className="bg-purple-500 text-white p-2 rounded-lg no-print"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className={`text-xs mb-3 p-3 rounded-lg ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-purple-100 text-purple-700'}`}>
                <div className="font-bold mb-1">Formule :</div>
                <div className="font-mono">FR = Σ Capitaux permanents - Immobilisations nettes</div>
              </div>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {(fr.details || []).map((item, idx) => (
                  <div key={item.id} className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-white'} group relative`}>
                    <button
                      onClick={() => setGlobalParams({
                        ...globalParams,
                        fondRoulement: globalParams.fondRoulement.filter(f => f.id !== item.id)
                      })}
                      className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 no-print"
                    >
                      <Trash2 size={10} />
                    </button>
                    <div className="flex items-center justify-between gap-2">
                      <input
                        className={`flex-1 font-bold text-sm bg-transparent outline-none ${darkMode ? 'text-white' : 'text-slate-700'}`}
                        value={globalParams.fondRoulement[idx]?.nom || item.nom}
                        onChange={(e) => setGlobalParams({
                          ...globalParams,
                          fondRoulement: globalParams.fondRoulement.map(f =>
                            f.id === item.id ? {...f, nom: e.target.value} : f
                          )
                        })}
                      />
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          className={`w-24 text-right rounded px-2 py-1 font-bold ${darkMode ? 'bg-gray-600 text-white' : 'bg-purple-50'}`}
                          value={globalParams.fondRoulement[idx]?.montant || 0}
                          onChange={(e) => setGlobalParams({
                            ...globalParams,
                            fondRoulement: globalParams.fondRoulement.map(f =>
                              f.id === item.id ? {...f, montant: validerMontant(e.target.value)} : f
                            )
                          })}
                        />
                        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>€</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className={`mt-3 pt-3 border-t ${darkMode ? 'border-gray-600' : 'border-purple-200'} space-y-2 text-sm`}>
                <div className="flex justify-between">
                  <span className={darkMode ? 'text-gray-400' : 'text-slate-600'}>Capitaux permanents</span>
                  <span className={`font-bold ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>+{Math.round(fr.totalCapitauxPermanents).toLocaleString()} €</span>
                </div>
                <div className="flex justify-between">
                  <span className={darkMode ? 'text-gray-400' : 'text-slate-600'}>Immobilisations nettes</span>
                  <span className={`font-bold ${darkMode ? 'text-red-300' : 'text-red-600'}`}>-{Math.round(fr.immobilisationsNettes).toLocaleString()} €</span>
                </div>
              </div>
              <div className={`mt-3 p-4 rounded-xl ${fr.fondRoulement >= 0 ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gradient-to-r from-red-500 to-orange-500'} text-white flex justify-between`}>
                <span className="font-bold">FR</span>
                <span className="text-xl font-black">{Math.round(fr.fondRoulement).toLocaleString()} €</span>
              </div>
            </>); })()}
          </div>

          {/* BFR */}
          <div className={`rounded-3xl shadow-lg border-2 p-6 ${darkMode ? 'bg-gray-800 border-blue-900' : 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200'}`}>
            {(() => { const b = getBFR(); return (<>
              <div className="flex items-center gap-2 mb-4">
                <h2 className={`text-xl font-black ${darkMode ? 'text-blue-400' : 'text-blue-900'}`}>Besoin en Fonds de Roulement</h2>
                <div className="relative group">
                  <HelpCircle size={16} className={`cursor-help ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  <div className={`absolute right-0 top-6 w-80 p-3 rounded-xl shadow-lg z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-white text-slate-700'}`}>
                    <p className="font-bold mb-2">Méthode de calcul :</p>
                    <p className="text-xs mb-1"><strong>BFR = Stocks + Créances clients - Dettes fournisseurs</strong></p>
                    <p className="text-xs mb-1">Créances = (CA / 365) × Délai paiement clients</p>
                    <p className="text-xs mb-1">Dettes = (Achats / 365) × Délai paiement fournisseurs</p>
                    <p className="text-xs text-gray-500 mt-2">Le BFR représente le besoin de financement lié au cycle d'exploitation. Un BFR négatif est favorable.</p>
                  </div>
                </div>
              </div>
              <div className={`text-xs mb-3 p-3 rounded-lg ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-blue-100 text-blue-700'}`}>
                <div className="font-bold mb-1">Formule :</div>
                <div className="font-mono">BFR = Stocks + (CA/365 × {globalParams.delaiPaiementClients}j) - (Achats/365 × {globalParams.delaiPaiementFournisseurs}j)</div>
              </div>
              <div className="space-y-2">
                {/* Stocks éditables */}
                <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                  <div className="flex items-center justify-between">
                    <span className={darkMode ? 'text-gray-300' : 'text-slate-600'}>Stocks</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        className={`w-24 text-right rounded px-2 py-1 font-bold ${darkMode ? 'bg-gray-600 text-white' : 'bg-blue-50'}`}
                        value={globalParams.stocksValeur || 0}
                        onChange={(e) => setGlobalParams({...globalParams, stocksValeur: validerMontant(e.target.value)})}
                      />
                      <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>€</span>
                    </div>
                  </div>
                </div>
                {/* Délai paiement clients */}
                <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={darkMode ? 'text-gray-300' : 'text-slate-600'}>Créances clients</span>
                    <span className="font-black text-blue-600">+{Math.round(b.creancesClients).toLocaleString()} €</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={darkMode ? 'text-gray-400' : 'text-slate-500'}>Délai:</span>
                    <input
                      type="number"
                      className={`w-16 text-center rounded px-2 py-1 font-bold ${darkMode ? 'bg-gray-600 text-white' : 'bg-blue-50'}`}
                      value={globalParams.delaiPaiementClients}
                      onChange={(e) => setGlobalParams({...globalParams, delaiPaiementClients: validerEntier(e.target.value, 0, 365)})}
                    />
                    <span className={darkMode ? 'text-gray-400' : 'text-slate-500'}>jours</span>
                  </div>
                </div>
                {/* Délai paiement fournisseurs */}
                <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={darkMode ? 'text-gray-300' : 'text-slate-600'}>Dettes fournisseurs</span>
                    <span className="font-black text-teal-600">-{Math.round(b.dettesFournisseurs).toLocaleString()} €</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={darkMode ? 'text-gray-400' : 'text-slate-500'}>Délai:</span>
                    <input
                      type="number"
                      className={`w-16 text-center rounded px-2 py-1 font-bold ${darkMode ? 'bg-gray-600 text-white' : 'bg-blue-50'}`}
                      value={globalParams.delaiPaiementFournisseurs}
                      onChange={(e) => setGlobalParams({...globalParams, delaiPaiementFournisseurs: validerEntier(e.target.value, 0, 365)})}
                    />
                    <span className={darkMode ? 'text-gray-400' : 'text-slate-500'}>jours</span>
                  </div>
                </div>
                <div className={`p-4 rounded-xl ${b.bfr > 0 ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-gradient-to-r from-teal-500 to-cyan-500'} text-white flex justify-between`}>
                  <div><span className="font-bold block">BFR</span><span className="text-xs">{Math.round(b.bfrEnJours)} jours</span></div>
                  <span className="text-xl font-black">{Math.round(b.bfr).toLocaleString()} €</span>
                </div>
              </div>
            </>); })()}
          </div>
        </div>

        {/* DIRECTION */}
        <div className={`rounded-3xl shadow-lg border-2 p-8 mb-8 ${darkMode ? 'bg-gray-800 border-teal-900' : 'bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-300'}`}>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <Building2 className="text-teal-600" size={32} />
              <div>
                <h2 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>Direction & Siège</h2>
                <span className="text-sm text-teal-600 font-bold">{direction.personnel.reduce((s, p) => s + p.etp, 0).toFixed(1)} ETP</span>
              </div>
            </div>
            <span className={`text-2xl font-black ${darkMode ? 'text-teal-400' : 'text-teal-700'}`}>{Math.round(getBudgetDirection().total).toLocaleString()} €</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={`p-6 rounded-2xl shadow-lg ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className={`font-black flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-700'}`}><Users size={20} className="text-teal-500" /> Personnel</h3>
                <button onClick={() => setDirection({...direction, personnel: [...direction.personnel, { id: Date.now(), titre: 'Nouveau', etp: 1, salaire: 2500, segur: true }]})} className="bg-teal-500 text-white p-2 rounded-lg no-print"><Plus size={18} /></button>
              </div>
              <div className="space-y-3 max-h-[350px] overflow-y-auto">
                {direction.personnel.map(p => (
                  <div key={p.id} className={`p-3 rounded-xl border group relative ${darkMode ? 'bg-gray-600 border-gray-500' : 'bg-slate-50 border-slate-200'}`}>
                    <button onClick={() => setDirection({...direction, personnel: direction.personnel.filter(x => x.id !== p.id)})} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 no-print"><Trash2 size={12} /></button>
                    <input className={`font-bold text-sm w-full mb-2 outline-none bg-transparent ${darkMode ? 'text-white' : ''}`} value={p.titre} onChange={(e) => setDirection({...direction, personnel: direction.personnel.map(x => x.id === p.id ? {...x, titre: e.target.value} : x)})} />
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div><label className={darkMode ? 'text-gray-400' : 'text-slate-500'}>ETP</label><input type="number" step="0.1" className={`w-full rounded px-2 py-1 font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-white'}`} value={p.etp} onChange={(e) => setDirection({...direction, personnel: direction.personnel.map(x => x.id === p.id ? {...x, etp: validerETP(e.target.value)} : x)})} /></div>
                      <div><label className={darkMode ? 'text-gray-400' : 'text-slate-500'}>Salaire</label><input type="number" className={`w-full rounded px-2 py-1 font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-white'}`} value={p.salaire} onChange={(e) => setDirection({...direction, personnel: direction.personnel.map(x => x.id === p.id ? {...x, salaire: validerSalaire(e.target.value)} : x)})} /></div>
                      <div className="flex items-end"><label className="flex items-center gap-1"><input type="checkbox" checked={p.segur} onChange={(e) => setDirection({...direction, personnel: direction.personnel.map(x => x.id === p.id ? {...x, segur: e.target.checked} : x)})} /><span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Ségur</span></label></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className={`p-6 rounded-2xl shadow-lg ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
              <h3 className={`font-black mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-700'}`}><Landmark size={20} className="text-teal-500" /> Charges siège</h3>
              {[{ label: 'Loyer', key: 'loyer' }, { label: 'Charges', key: 'charges' }, { label: 'Autres', key: 'autresCharges' }].map(item => (
                <div key={item.key} className={`p-4 rounded-xl mb-3 ${darkMode ? 'bg-gray-600' : 'bg-slate-50'}`}>
                  <div className="flex items-center justify-between">
                    <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-700'}`}>{item.label}</span>
                    <div className="flex items-center gap-2">
                      <Euro className="text-teal-500" size={18} />
                      <input type="number" className={`w-24 text-right font-black text-xl rounded-lg px-3 py-2 outline-none ${darkMode ? 'bg-gray-500 text-white' : 'bg-white'}`} value={direction[item.key]} onChange={(e) => setDirection({...direction, [item.key]: validerMontant(e.target.value)})} />
                      <span className={darkMode ? 'text-gray-400' : 'text-slate-500'}>/mois</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SERVICES */}
        <div className="space-y-8">
          {services.map(service => {
            const bs = getBudgetService(service);
            const hasPromos = service.promos && Object.keys(service.promos).length > 0;
            const isPrestation = service.type === 'prestation';
            const stats = hasPromos ? calculerStatsFormation(service) : null;
            const totalRealisations = isPrestation ? calculerTotalRealisations(service.realisations) : 0;

            return (
              <div key={service.id} className={`rounded-3xl shadow-lg border-2 p-8 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-100'}`}>
                <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                  <div className="flex items-center gap-4 flex-wrap">
                    {isPrestation ? <Calendar className="text-orange-500" size={28} /> : hasPromos ? <GraduationCap className="text-purple-500" size={28} /> : <Settings className="text-teal-500" size={28} />}
                    <input className={`text-2xl font-black outline-none border-b-2 border-transparent focus:border-teal-500 bg-transparent ${darkMode ? 'text-white' : 'text-slate-800'}`} value={service.nom} onChange={(e) => setServices(services.map(s => s.id === service.id ? {...s, nom: e.target.value} : s))} />
                    {isPrestation && <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold uppercase">Prestation</span>}
                    <span className="bg-red-100 text-red-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1">
                      <TrendingDown size={16} /> {Math.round(bs.total).toLocaleString()} €
                    </span>
                    <span className="bg-green-100 text-green-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1">
                      <Banknote size={16} /> {Math.round(bs.recettes).toLocaleString()} €
                    </span>
                    <span className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1 ${bs.solde >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                      {bs.solde >= 0 ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                      Solde: {bs.solde >= 0 ? '+' : ''}{Math.round(bs.solde).toLocaleString()} €
                    </span>
                    <span className="bg-blue-100 text-blue-700 px-3 py-2 rounded-xl text-xs font-bold">{service.personnel.reduce((s, p) => s + p.etp, 0).toFixed(1)} ETP</span>
                    {stats && (
                      <span className="bg-purple-100 text-purple-700 px-3 py-2 rounded-xl text-xs font-bold">
                        {stats.effectifActuel} étudiants ({stats.totalAbandons} abandons)
                      </span>
                    )}
                    {isPrestation && (
                      <span className="bg-orange-100 text-orange-700 px-3 py-2 rounded-xl text-xs font-bold">
                        {totalRealisations} réalisations
                      </span>
                    )}
                  </div>
                  <button onClick={() => setConfirmDialog({
                    isOpen: true,
                    title: 'Supprimer ce service ?',
                    message: `Êtes-vous sûr de vouloir supprimer "${service.nom}" ? Cette action est irréversible.`,
                    onConfirm: () => setServices(services.filter(s => s.id !== service.id))
                  })} className="text-red-400 p-2 hover:bg-red-50 rounded-xl no-print"><Trash2 size={22} /></button>
                </div>

                {/* Section Promos par site - uniquement pour les services de formation */}
                {hasPromos && (
                  <div className={`mb-6 p-6 rounded-2xl border-2 ${darkMode ? 'bg-purple-900/20 border-purple-800' : 'bg-purple-50 border-purple-200'}`}>
                    <h3 className={`text-lg font-black mb-4 flex items-center gap-2 ${darkMode ? 'text-purple-400' : 'text-purple-700'}`}>
                      <GraduationCap size={22} /> Effectifs par site et promo
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {Object.entries(service.promos).map(([site, promos]) => (
                        <div key={site} className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                          <h4 className={`font-black mb-3 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                            <MapPin size={18} className="text-purple-500" /> {site}
                          </h4>
                          <div className="space-y-3">
                            {promos.map(promo => {
                              const effectifActuel = calculerEffectifActuel(promo);
                              const totalAbandons = Object.values(promo.abandons).reduce((sum, v) => sum + v, 0);
                              return (
                                <div key={promo.id} className={`p-3 rounded-lg border ${darkMode ? 'bg-gray-600 border-gray-500' : 'bg-slate-50 border-slate-200'}`}>
                                  <div className="flex justify-between items-center mb-2">
                                    <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-700'}`}>{promo.nom}</span>
                                    <div className="flex items-center gap-2">
                                      <span className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700'}`}>
                                        Initial: {promo.effectifInitial}
                                      </span>
                                      <span className={`text-xs px-2 py-1 rounded font-bold ${effectifActuel < promo.effectifInitial ? (darkMode ? 'bg-orange-900 text-orange-300' : 'bg-orange-100 text-orange-700') : (darkMode ? 'bg-teal-900 text-teal-300' : 'bg-teal-100 text-teal-700')}`}>
                                        Actuel: {effectifActuel}
                                      </span>
                                      {totalAbandons > 0 && (
                                        <span className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-700'}`}>
                                          <UserMinus size={12} className="inline mr-1" />{totalAbandons}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {/* Effectif initial éditable */}
                                  <div className="flex items-center gap-2 mb-2">
                                    <label className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Effectif initial:</label>
                                    <input
                                      type="number"
                                      className={`w-16 text-xs rounded px-2 py-1 font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-white border'}`}
                                      value={promo.effectifInitial}
                                      onChange={(e) => {
                                        const newEffectif = Math.max(0, parseInt(e.target.value) || 0);
                                        setServices(services.map(s => {
                                          if (s.id !== service.id) return s;
                                          return {
                                            ...s,
                                            promos: {
                                              ...s.promos,
                                              [site]: s.promos[site].map(p =>
                                                p.id === promo.id ? {...p, effectifInitial: newEffectif} : p
                                              )
                                            }
                                          };
                                        }));
                                      }}
                                    />
                                  </div>
                                  {/* Abandons par mois */}
                                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                                    <div className="flex items-center gap-1 mb-1">
                                      <UserMinus size={12} /> Abandons par mois:
                                    </div>
                                    <div className="grid grid-cols-6 gap-1">
                                      {Object.entries(promo.abandons).map(([mois, val]) => (
                                        <div key={mois} className="text-center">
                                          <div className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                                            {mois.substring(0, 3)}
                                          </div>
                                          <input
                                            type="number"
                                            min="0"
                                            className={`w-full text-center text-xs rounded px-1 py-0.5 ${val > 0 ? (darkMode ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-700') : (darkMode ? 'bg-gray-500 text-white' : 'bg-white border')}`}
                                            value={val}
                                            onChange={(e) => {
                                              const newVal = Math.max(0, parseInt(e.target.value) || 0);
                                              setServices(services.map(s => {
                                                if (s.id !== service.id) return s;
                                                return {
                                                  ...s,
                                                  promos: {
                                                    ...s.promos,
                                                    [site]: s.promos[site].map(p =>
                                                      p.id === promo.id ? {...p, abandons: {...p.abandons, [mois]: newVal}} : p
                                                    )
                                                  }
                                                };
                                              }));
                                            }}
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {/* Total par site */}
                          <div className={`mt-3 pt-3 border-t ${darkMode ? 'border-gray-600' : 'border-slate-200'} flex justify-between text-sm font-bold`}>
                            <span className={darkMode ? 'text-purple-400' : 'text-purple-600'}>Total {site}:</span>
                            <span className={darkMode ? 'text-white' : 'text-slate-800'}>
                              {promos.reduce((sum, p) => sum + calculerEffectifActuel(p), 0)} étudiants
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section Réalisations par mois - uniquement pour les prestations */}
                {isPrestation && (
                  <div className={`mb-6 p-6 rounded-2xl border-2 ${darkMode ? 'bg-orange-900/20 border-orange-800' : 'bg-orange-50 border-orange-200'}`}>
                    <h3 className={`text-lg font-black mb-4 flex items-center gap-2 ${darkMode ? 'text-orange-400' : 'text-orange-700'}`}>
                      <Calendar size={22} /> Réalisations par mois
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
                      {MOIS.map((mois, idx) => {
                        const moisKey = mois.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace('û', 'u');
                        return (
                          <div key={mois} className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                            <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{mois}</label>
                            <input
                              type="number"
                              min="0"
                              className={`w-full text-center font-black text-lg rounded px-2 py-1 ${darkMode ? 'bg-gray-600 text-white' : 'bg-orange-50 text-orange-700'}`}
                              value={service.realisations?.[moisKey] || 0}
                              onChange={(e) => setServices(services.map(s => s.id === service.id ? {
                                ...s,
                                realisations: {
                                  ...(s.realisations || defaultRealisations()),
                                  [moisKey]: Math.max(0, parseInt(e.target.value) || 0)
                                }
                              } : s))}
                            />
                          </div>
                        );
                      })}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                        <label className={`text-xs font-black uppercase block mb-2 ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>Prix unitaire (€)</label>
                        <input
                          type="number"
                          className={`font-black text-xl px-4 py-2 rounded-xl w-full outline-none ${darkMode ? 'bg-gray-600 text-white' : 'bg-orange-50 text-orange-700'}`}
                          value={service.prixUnitaire || 0}
                          onChange={(e) => setServices(services.map(s => s.id === service.id ? {...s, prixUnitaire: validerMontant(e.target.value)} : s))}
                        />
                      </div>
                      <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                        <label className={`text-xs font-black uppercase block mb-2 ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>Total réalisations</label>
                        <div className={`font-black text-xl px-4 py-2 ${darkMode ? 'text-orange-300' : 'text-orange-700'}`}>
                          {totalRealisations}
                        </div>
                      </div>
                      <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                        <label className={`text-xs font-black uppercase block mb-2 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>CA estimé</label>
                        <div className={`font-black text-xl px-4 py-2 ${darkMode ? 'text-green-300' : 'text-green-700'}`}>
                          {(totalRealisations * (service.prixUnitaire || 0)).toLocaleString()} €
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Unités/Taux - uniquement pour les services sans promos et non-prestation */}
                {!hasPromos && !isPrestation && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-blue-900/30 border-blue-800' : 'bg-blue-50 border-blue-200'}`}>
                      <label className={`text-xs font-black uppercase block mb-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>Unités / Bénéficiaires</label>
                      <input type="number" className={`font-black text-2xl px-4 py-2 rounded-xl w-full outline-none ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-blue-700'}`} value={service.unites} onChange={(e) => setServices(services.map(s => s.id === service.id ? {...s, unites: validerUnites(e.target.value)} : s))} />
                    </div>
                    <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-teal-900/30 border-teal-800' : 'bg-teal-50 border-teal-200'}`}>
                      <label className={`text-xs font-black uppercase block mb-2 ${darkMode ? 'text-teal-400' : 'text-slate-600'}`}>Taux d'activité (%)</label>
                      <input type="number" className={`font-black text-2xl px-4 py-2 rounded-xl w-full outline-none ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-slate-700'}`} value={service.tauxActivite} onChange={(e) => setServices(services.map(s => s.id === service.id ? {...s, tauxActivite: validerTaux(e.target.value)} : s))} />
                    </div>
                  </div>
                )}

                {/* Taux d'activité - pour les services de formation */}
                {hasPromos && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-teal-900/30 border-teal-800' : 'bg-teal-50 border-teal-200'}`}>
                      <label className={`text-xs font-black uppercase block mb-2 ${darkMode ? 'text-teal-400' : 'text-slate-600'}`}>Taux d'activité (%)</label>
                      <input type="number" className={`font-black text-2xl px-4 py-2 rounded-xl w-full outline-none ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-slate-700'}`} value={service.tauxActivite} onChange={(e) => setServices(services.map(s => s.id === service.id ? {...s, tauxActivite: validerTaux(e.target.value)} : s))} />
                    </div>
                    <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-purple-900/30 border-purple-800' : 'bg-purple-50 border-purple-200'}`}>
                      <label className={`text-xs font-black uppercase block mb-2 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>Effectif total actuel</label>
                      <div className={`font-black text-2xl px-4 py-2 ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                        {stats.effectifActuel} étudiants
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                  {/* Investissements */}
                  <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-slate-50 border-slate-200'}`}>
                    <h3 className={`text-sm font-black uppercase mb-4 flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}><Landmark size={18} /> Investissements</h3>
                    <div className="space-y-2 max-h-[350px] overflow-y-auto">
                      {Object.entries(service.investissements).map(([key, inv]) => {
                        const info = COMPTES_IMMO[key];
                        return (
                          <div key={key} className={`p-3 rounded-xl ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
                            <div className="text-xs text-teal-600 font-bold">{info.compte} - {info.libelle}</div>
                            <div className="grid grid-cols-3 gap-2 mt-2">
                              <input type="number" placeholder="Montant" className={`text-xs rounded px-2 py-1 ${darkMode ? 'bg-gray-500 text-white' : 'bg-slate-50'}`} value={inv.montant} onChange={(e) => setServices(services.map(s => s.id === service.id ? {...s, investissements: {...s.investissements, [key]: {...inv, montant: validerMontant(e.target.value)}}} : s))} />
                              <input type="number" placeholder="Durée" className={`text-xs rounded px-2 py-1 ${darkMode ? 'bg-gray-500 text-white' : 'bg-slate-50'}`} value={inv.duree} onChange={(e) => setServices(services.map(s => s.id === service.id ? {...s, investissements: {...s.investissements, [key]: {...inv, duree: validerDuree(e.target.value)}}} : s))} />
                              <input type="number" step="0.1" placeholder="Taux" className={`text-xs rounded px-2 py-1 ${darkMode ? 'bg-gray-500 text-white' : 'bg-slate-50'}`} value={inv.taux} onChange={(e) => setServices(services.map(s => s.id === service.id ? {...s, investissements: {...s.investissements, [key]: {...inv, taux: validerTaux(e.target.value)}}} : s))} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Exploitation */}
                  <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-teal-50 border-teal-200'}`}>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className={`text-sm font-black uppercase flex items-center gap-2 ${darkMode ? 'text-teal-400' : 'text-teal-700'}`}><Settings size={18} /> Exploitation</h3>
                      <button onClick={() => setServices(services.map(s => s.id === service.id ? {...s, exploitation: [...s.exploitation, { id: Date.now(), nom: 'Nouveau', montant: 0 }]} : s))} className="bg-teal-600 text-white p-1.5 rounded-lg no-print"><Plus size={16} /></button>
                    </div>
                    <div className="space-y-2 max-h-[350px] overflow-y-auto">
                      {service.exploitation.map(item => (
                        <div key={item.id} className={`flex items-center gap-2 p-2 rounded-xl group relative ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
                          <button onClick={() => setServices(services.map(s => s.id === service.id ? {...s, exploitation: s.exploitation.filter(e => e.id !== item.id)} : s))} className="absolute -top-1 -left-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 no-print"><Trash2 size={10} /></button>
                          <input className={`flex-1 text-xs font-bold bg-transparent outline-none ${darkMode ? 'text-white' : ''}`} value={item.nom} onChange={(e) => setServices(services.map(s => s.id === service.id ? {...s, exploitation: s.exploitation.map(exp => exp.id === item.id ? {...exp, nom: e.target.value} : exp)} : s))} />
                          <input type="number" className={`w-20 text-right text-xs font-black rounded px-2 py-1 ${darkMode ? 'bg-gray-500 text-white' : 'bg-teal-50'}`} value={item.montant} onChange={(e) => setServices(services.map(s => s.id === service.id ? {...s, exploitation: s.exploitation.map(exp => exp.id === item.id ? {...exp, montant: validerMontant(e.target.value)} : exp)} : s))} />
                          <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-400'}`}>€/m</span>
                        </div>
                      ))}
                    </div>
                    <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-600' : 'border-teal-200'} flex justify-between font-bold`}>
                      <span className={darkMode ? 'text-teal-400' : 'text-teal-700'}>Total/an:</span>
                      <span className={darkMode ? 'text-white' : 'text-teal-800'}>{Math.round(bs.exploitation).toLocaleString()} €</span>
                    </div>
                  </div>

                  {/* Personnel */}
                  <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-slate-50 border-teal-200'}`}>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className={`text-sm font-black uppercase flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}><Users size={18} /> Équipe</h3>
                      <button onClick={() => setServices(services.map(s => s.id === service.id ? {...s, personnel: [...s.personnel, { id: Date.now(), titre: 'Nouveau', etp: 1, salaire: 2500, segur: true }]} : s))} className="bg-slate-700 text-white p-1.5 rounded-lg no-print"><Plus size={16} /></button>
                    </div>
                    <div className="space-y-2 max-h-[350px] overflow-y-auto">
                      {service.personnel.map(p => (
                        <div key={p.id} className={`p-3 rounded-xl group relative ${darkMode ? 'bg-gray-600' : 'bg-white'} border ${darkMode ? 'border-gray-500' : 'border-teal-100'}`}>
                          <button onClick={() => setServices(services.map(s => s.id === service.id ? {...s, personnel: s.personnel.filter(x => x.id !== p.id)} : s))} className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 no-print"><Trash2 size={10} /></button>
                          <input className={`font-bold text-sm w-full mb-2 outline-none bg-transparent ${darkMode ? 'text-white' : ''}`} value={p.titre} onChange={(e) => setServices(services.map(s => s.id === service.id ? {...s, personnel: s.personnel.map(x => x.id === p.id ? {...x, titre: e.target.value} : x)} : s))} />
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div><label className={darkMode ? 'text-gray-400' : 'text-slate-500'}>ETP</label><input type="number" step="0.1" className={`w-full rounded px-2 py-1 font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-teal-50'}`} value={p.etp} onChange={(e) => setServices(services.map(s => s.id === service.id ? {...s, personnel: s.personnel.map(x => x.id === p.id ? {...x, etp: validerETP(e.target.value)} : x)} : s))} /></div>
                            <div><label className={darkMode ? 'text-gray-400' : 'text-slate-500'}>Salaire</label><input type="number" className={`w-full rounded px-2 py-1 font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-teal-50'}`} value={p.salaire} onChange={(e) => setServices(services.map(s => s.id === service.id ? {...s, personnel: s.personnel.map(x => x.id === p.id ? {...x, salaire: validerSalaire(e.target.value)} : x)} : s))} /></div>
                          </div>
                          <div className="mt-2"><label className="flex items-center gap-1"><input type="checkbox" checked={p.segur} onChange={(e) => setServices(services.map(s => s.id === service.id ? {...s, personnel: s.personnel.map(x => x.id === p.id ? {...x, segur: e.target.checked} : x)} : s))} /><span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Ségur</span></label></div>
                        </div>
                      ))}
                    </div>
                    <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-600' : 'border-teal-200'} flex justify-between font-bold`}>
                      <span className={darkMode ? 'text-gray-300' : 'text-slate-700'}>Masse salariale:</span>
                      <span className={darkMode ? 'text-white' : 'text-slate-800'}>{Math.round(bs.salaires).toLocaleString()} €</span>
                    </div>
                  </div>

                  {/* Recettes */}
                  <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-gray-700 border-green-800' : 'bg-green-50 border-green-200'}`}>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className={`text-sm font-black uppercase flex items-center gap-2 ${darkMode ? 'text-green-400' : 'text-green-700'}`}><Banknote size={18} /> Recettes</h3>
                      <button onClick={() => setServices(services.map(s => s.id === service.id ? {...s, recettes: [...(s.recettes || []), { id: Date.now(), nom: 'Nouvelle recette', montant: 0 }]} : s))} className="bg-green-600 text-white p-1.5 rounded-lg no-print"><Plus size={16} /></button>
                    </div>
                    <div className="space-y-2 max-h-[350px] overflow-y-auto">
                      {(service.recettes || []).map(item => (
                        <div key={item.id} className={`flex items-center gap-2 p-2 rounded-xl group relative ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
                          <button onClick={() => setServices(services.map(s => s.id === service.id ? {...s, recettes: s.recettes.filter(r => r.id !== item.id)} : s))} className="absolute -top-1 -left-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 no-print"><Trash2 size={10} /></button>
                          <input className={`flex-1 text-xs font-bold bg-transparent outline-none ${darkMode ? 'text-white' : ''}`} value={item.nom} onChange={(e) => setServices(services.map(s => s.id === service.id ? {...s, recettes: s.recettes.map(rec => rec.id === item.id ? {...rec, nom: e.target.value} : rec)} : s))} />
                          <input type="number" className={`w-20 text-right text-xs font-black rounded px-2 py-1 ${darkMode ? 'bg-gray-500 text-white' : 'bg-green-50'}`} value={item.montant} onChange={(e) => setServices(services.map(s => s.id === service.id ? {...s, recettes: s.recettes.map(rec => rec.id === item.id ? {...rec, montant: validerMontant(e.target.value)} : rec)} : s))} />
                          <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-400'}`}>€/m</span>
                        </div>
                      ))}
                    </div>
                    <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-600' : 'border-green-200'} flex justify-between font-bold`}>
                      <span className={darkMode ? 'text-green-400' : 'text-green-700'}>Total/an:</span>
                      <span className={darkMode ? 'text-white' : 'text-green-800'}>{Math.round(bs.recettes).toLocaleString()} €</span>
                    </div>
                    {/* Indicateur de solde */}
                    <div className={`mt-3 p-3 rounded-xl ${bs.solde >= 0 ? (darkMode ? 'bg-emerald-900/50' : 'bg-emerald-100') : (darkMode ? 'bg-orange-900/50' : 'bg-orange-100')}`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold flex items-center gap-1 ${bs.solde >= 0 ? (darkMode ? 'text-emerald-400' : 'text-emerald-700') : (darkMode ? 'text-orange-400' : 'text-orange-700')}`}>
                          {bs.solde >= 0 ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                          {bs.solde >= 0 ? 'Excédent' : 'Déficit'}
                        </span>
                        <span className={`font-black ${bs.solde >= 0 ? (darkMode ? 'text-emerald-300' : 'text-emerald-700') : (darkMode ? 'text-orange-300' : 'text-orange-700')}`}>
                          {bs.solde >= 0 ? '+' : ''}{Math.round(bs.solde).toLocaleString()} €
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bouton ajouter service */}
        <button onClick={() => {
          const nouveau = {...services[0], id: Date.now(), nom: `Service ${services.length + 1}`,
            personnel: services[0].personnel.map(p => ({...p, id: Date.now() + Math.random()})),
            exploitation: services[0].exploitation.map(e => ({...e, id: Date.now() + Math.random()})),
            recettes: (services[0].recettes || []).map(r => ({...r, id: Date.now() + Math.random()})),
            promos: undefined,
            unites: 10
          };
          setServices([...services, nouveau]);
        }} className="w-full mt-8 py-5 border-2 border-dashed border-teal-300 rounded-3xl text-teal-500 font-black text-lg hover:bg-teal-50 transition-all flex items-center justify-center gap-3 no-print">
          <Plus size={24} /> AJOUTER UN SERVICE
        </button>
      </div>
    </div>
  );
};

export default BudgetTool;
