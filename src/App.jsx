import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Download, Building2, Users, Landmark, Settings, Calendar, TrendingUp, Euro, Save, Upload, Printer, Moon, Sun, Lock, LogOut, GraduationCap, MapPin, UserMinus, Banknote, TrendingDown, CheckCircle, AlertTriangle, FileSpreadsheet, Key, Eye, EyeOff, HelpCircle, X, AlertCircle, Clock, BarChart3, Search, Menu, ChevronLeft, ChevronRight, Home, Shield, Wallet, Building, Layers, Calculator, RotateCcw, Target, Gauge, Bell, GripVertical, ChevronDown, ChevronUp, UserCheck, UserX, Zap, Monitor } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { exportToExcel, exportReportingFC } from './utils/excelExport';
import { exportToPDF, exportReportingFCPdf } from './utils/pdfExport';
import PilotageFinancier, { defaultSites as pilotageDefaultSites, zeroSites as pilotageZeroSites, calcSalarie as calcSalarieFormateur } from './components/PilotageFinancier';
import PresentationMode from './components/PresentationMode';
import PlanningAbsences from './components/PlanningAbsences';
import ReportingFC from './components/ReportingFC';
import ImportN1Modal from './components/ImportN1Modal';
import WizardImportBP from './components/WizardImportBP';

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
  defaultPoleSupport,
  defaultServices,
  DATA_VERSION
} from './utils/constants';

// Import des fonctions de calcul
import {
  validerNombre,
  validerEntier,
  validerTaux,
  validerETP,
  validerSalaire,
  validerMontant,
  validerMontantSigne,
  validerDuree,
  validerUnites,
  calculerBudgetDirection,
  calculerBudgetService,
  calculerBudgetPoleSupport,
  calculerSalaireAnnuel,
  calculerProvisions,
  calculerBFR,
  calculerFondRoulement,
  calculerSynthese3Ans,
  calculerBudgetAnnuelMensuel,
  loadFromStorage
} from './utils/calculations';

// Hachage SHA-256 du mot de passe (natif navigateur)
const hashPassword = async (password) => {
  const data = new TextEncoder().encode(password);
  const buffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0')).join('');
};

// Vérifie le mot de passe saisi (supporte hash SHA-256 et migration depuis clair)
const checkPassword = async (typed) => {
  const storedHash = localStorage.getItem('budget_custom_password_hash');
  if (storedHash) {
    return await hashPassword(typed) === storedHash;
  }
  // Compatibilité : ancien mot de passe en clair → migre au hash
  const oldClear = localStorage.getItem('budget_custom_password');
  if (oldClear) {
    if (typed === oldClear) {
      localStorage.setItem('budget_custom_password_hash', await hashPassword(typed));
      localStorage.removeItem('budget_custom_password');
      return true;
    }
    return false;
  }
  return typed === DEFAULT_PASSWORD;
};

// Composant de connexion
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

// Composant menu latéral de navigation
const SidebarNav = ({ services, darkMode, isOpen, onToggle, searchQuery, onSearchChange }) => {
  const navItems = [
    { id: 'header', label: 'Accueil', icon: Home },
    { id: 'budget-annuel', label: 'Budget Annuel', icon: Calendar },
    { id: 'synthese-3ans', label: 'Synthèse 3 ans', icon: TrendingUp },
    { id: 'graphiques', label: 'Graphiques', icon: BarChart3 },
    { id: 'provisions-bfr-fr', label: 'Provisions / BFR / FR', icon: Shield },
    { id: 'direction', label: 'Direction & Siège', icon: Building2 },
    { id: 'pole-support', label: 'Pôle Support', icon: Building },
    { id: 'planning-absences', label: 'Planning Absences', icon: Calendar },
    { id: 'enveloppe-formation', label: 'Enveloppe Formation', icon: GraduationCap },
    { id: 'reporting-fc', label: 'Reporting FC', icon: FileSpreadsheet },
    { id: 'pilotage-financier', label: 'Pilotage Financier', icon: Calculator },
  ];

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Filter services based on search query
  const filteredServices = services.filter(s =>
    s.nom.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`sidebar-container fixed left-0 top-0 h-screen z-50 transition-all duration-300 no-print ${isOpen ? 'w-64' : 'w-16'}`}>
      <div className={`h-full ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-slate-200'} border-r shadow-lg flex flex-col`}>
        {/* Toggle button */}
        <button
          onClick={onToggle}
          className={`absolute -right-3 top-20 w-6 h-6 rounded-full shadow-lg flex items-center justify-center ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-slate-600'} border ${darkMode ? 'border-gray-600' : 'border-slate-200'}`}
        >
          {isOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>

        {/* Logo/Title */}
        <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
          {isOpen ? (
            <div className="flex items-center gap-2">
              <Menu className="text-teal-500" size={24} />
              <span className={`font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>Navigation</span>
            </div>
          ) : (
            <Menu className="text-teal-500 mx-auto" size={24} />
          )}
        </div>

        {/* Search bar */}
        {isOpen && (
          <div className="p-3">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-slate-100'}`}>
              <Search size={16} className={darkMode ? 'text-gray-400' : 'text-slate-400'} />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className={`flex-1 bg-transparent outline-none text-sm ${darkMode ? 'text-white placeholder:text-gray-500' : 'text-slate-700 placeholder:text-slate-400'}`}
              />
              {searchQuery && (
                <button onClick={() => onSearchChange('')} className={darkMode ? 'text-gray-400' : 'text-slate-400'}>
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Navigation items */}
        <nav className="flex-1 overflow-y-auto sidebar-nav p-2">
          {/* Main sections */}
          {isOpen && <div className={`text-xs font-bold uppercase px-3 py-2 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Sections</div>}
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl mb-1 transition-colors ${darkMode ? 'hover:bg-gray-800 text-gray-300 hover:text-white' : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'}`}
              title={!isOpen ? item.label : undefined}
            >
              <item.icon size={18} className="text-teal-500 flex-shrink-0" />
              {isOpen && <span className="text-sm font-medium truncate">{item.label}</span>}
            </button>
          ))}

          {/* Services section */}
          {isOpen && (
            <>
              <div className={`text-xs font-bold uppercase px-3 py-2 mt-4 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                Services ({filteredServices.length})
              </div>
              {filteredServices.map(service => (
                <button
                  key={service.id}
                  onClick={() => scrollToSection(`service-${service.id}`)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl mb-1 transition-colors ${darkMode ? 'hover:bg-gray-800 text-gray-300 hover:text-white' : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'}`}
                >
                  {service.type === 'prestation' ? (
                    <Calendar size={16} className="text-orange-500 flex-shrink-0" />
                  ) : service.promos ? (
                    <GraduationCap size={16} className="text-purple-500 flex-shrink-0" />
                  ) : (
                    <Layers size={16} className="text-teal-500 flex-shrink-0" />
                  )}
                  <span className="text-sm font-medium truncate">{service.nom}</span>
                </button>
              ))}
            </>
          )}

          {!isOpen && (
            <button
              onClick={() => scrollToSection('services-section')}
              className={`w-full flex items-center justify-center p-3 rounded-xl mb-1 transition-colors ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-slate-100'}`}
              title="Services"
            >
              <Layers size={18} className="text-purple-500" />
            </button>
          )}
        </nav>

        {/* Footer with quick stats */}
        {isOpen && (
          <div className={`p-3 border-t ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
            <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
              {services.length} service{services.length > 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── États "zéro" : tout vide, aucun intitulé pré-rempli ──────────
const zeroDirection = {
  personnel: [],
  chargesSiege: [],
};

const zeroServices = [];

const zeroGlobalParams = {
  augmentationAnnuelle: 0,
  delaiPaiementClients: 30,
  delaiPaiementFournisseurs: 30,
  provisions: [
    { id: 'conges',      nom: 'Congés payés',           baseCalcul: 'salaires',          taux: 0 },
    { id: 'reparations', nom: 'Grosses réparations',     baseCalcul: 'investissements',   taux: 0 },
    { id: 'creances',    nom: 'Créances douteuses',      baseCalcul: 'chiffre_affaires',  taux: 0 },
    { id: 'retraite',    nom: 'Provision retraite',      baseCalcul: 'salaires',          taux: 0 },
    { id: 'prudhommes',  nom: "Prud'hommes",             baseCalcul: 'salaires',          taux: 0 },
  ],
  fondRoulement: [
    { id: 'reserves',          nom: 'Réserves',                       montant: 0 },
    { id: 'reportNouveau',     nom: 'Report à nouveau',               montant: 0 },
    { id: 'subventionsInvest', nom: "Subventions d'investissement",   montant: 0 },
  ],
  stocksValeur: 0,
};

const BudgetTool = () => {
  const fileInputRef = useRef(null);

  // Authentification
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('budget_authenticated') === 'true';
  });

  // État pour la confirmation de suppression
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // État pour le menu latéral
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('budget_sidebar_open');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Sauvegarder l'état du sidebar
  useEffect(() => {
    localStorage.setItem('budget_sidebar_open', JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  const [globalParams, setGlobalParams] = useState(() => loadFromStorage('assoc_globalParams', defaultGlobalParams));
  const [direction, setDirection] = useState(() => {
    // Réinitialiser les données si la version a changé
    if (localStorage.getItem('assoc_data_version') !== DATA_VERSION) {
      ['assoc_direction', 'assoc_services', 'assoc_globalParams'].forEach(k => localStorage.removeItem(k));
      localStorage.setItem('assoc_data_version', DATA_VERSION);
    }
    const d = loadFromStorage('assoc_direction', defaultDirection);
    // Migration ancien format (loyer/charges/autresCharges) → chargesSiege[]
    if (!d.chargesSiege && (d.loyer !== undefined || d.charges !== undefined || d.autresCharges !== undefined)) {
      const migrated = { ...d, chargesSiege: [] };
      if (d.loyer)        migrated.chargesSiege.push({ id: 1, nom: 'Loyer', montant: d.loyer });
      if (d.charges)      migrated.chargesSiege.push({ id: 2, nom: 'Charges', montant: d.charges });
      if (d.autresCharges) migrated.chargesSiege.push({ id: 3, nom: 'Autres charges', montant: d.autresCharges });
      delete migrated.loyer; delete migrated.charges; delete migrated.autresCharges;
      return migrated;
    }
    return d;
  });
  const [services, setServices] = useState(() => loadFromStorage('assoc_services', defaultServices));
  const [poleSupport, setPoleSupport] = useState(() => loadFromStorage('assoc_pole_support', defaultPoleSupport));
  const [pilotageSites, setPilotageSites] = useState(() => loadFromStorage('assoc_pilotage_sites', pilotageDefaultSites));

  // Position de la Direction dans la liste unifiée (0 = avant tout, 1 = après service[0], etc.)
  const [directionPosition, setDirectionPosition] = useState(() => loadFromStorage('assoc_direction_position', 0));

  // Position du Pôle Support dans la liste unifiée
  const [poleSupportPosition, setPoleSupportPosition] = useState(() => loadFromStorage('assoc_pole_support_position', 1));

  // État drag-and-drop unifié (direction ou service)
  const [dragId, setDragId] = useState(null);       // 'direction' ou service.id
  const [dragOverId, setDragOverId] = useState(null);

  // Panels simulation ouverts (Set d'ids de services)
  const [simulationsOuvertes, setSimulationsOuvertes] = useState(new Set());

  // Panels FI% ouverts par agent (Set de clés "${serviceId}-${personnelId}")
  const [fiPanelsOuverts, setFiPanelsOuverts] = useState(new Set());

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
  const [enveloppeFormation, setEnveloppeFormation] = useState(() => loadFromStorage('assoc_enveloppe_formation', { budget: 0, actions: [] }));
  const [reportingFC, setReportingFC] = useState(() => loadFromStorage('assoc_reporting_fc', []));
  const [donneesN1, setDonneesN1] = useState(() => loadFromStorage('assoc_donnees_n1', null));
  const [showImportN1, setShowImportN1] = useState(false);
  const [showWizardBP, setShowWizardBP] = useState(false);
  const [simCharges, setSimCharges] = useState({ augSalaires: 0, augCharges: 0, augExploitation: 0 });
  const [presentationMode, setPresentationMode] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [planningAbsences, setPlanningAbsences] = useState(() => loadFromStorage('assoc_planning_absences', {}));
  useEffect(() => { localStorage.setItem('assoc_planning_absences', JSON.stringify(planningAbsences)); }, [planningAbsences]);
  useEffect(() => { localStorage.setItem('assoc_services', JSON.stringify(services)); triggerSaveIndicator(); }, [services]);
  useEffect(() => { localStorage.setItem('assoc_pole_support', JSON.stringify(poleSupport)); triggerSaveIndicator(); }, [poleSupport]);
  useEffect(() => { localStorage.setItem('assoc_pilotage_sites', JSON.stringify(pilotageSites)); triggerSaveIndicator(); }, [pilotageSites]);
  useEffect(() => { localStorage.setItem('assoc_direction_position', JSON.stringify(directionPosition)); }, [directionPosition]);
  useEffect(() => { localStorage.setItem('assoc_pole_support_position', JSON.stringify(poleSupportPosition)); }, [poleSupportPosition]);
  useEffect(() => { localStorage.setItem('assoc_darkMode', JSON.stringify(darkMode)); }, [darkMode]);
  useEffect(() => { localStorage.setItem('assoc_enveloppe_formation', JSON.stringify(enveloppeFormation)); triggerSaveIndicator(); }, [enveloppeFormation]);
  useEffect(() => { localStorage.setItem('assoc_reporting_fc', JSON.stringify(reportingFC)); triggerSaveIndicator(); }, [reportingFC]);
  useEffect(() => { localStorage.setItem('assoc_donnees_n1', JSON.stringify(donneesN1)); triggerSaveIndicator(); }, [donneesN1]);

  // Remise à zéro globale
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetShowPwd, setResetShowPwd] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [pilotageResetKey, setPilotageResetKey] = useState(0);

  const handleGlobalReset = async () => {
    if (!resetPassword) { setResetError('Veuillez saisir le mot de passe'); return; }
    const ok = await checkPassword(resetPassword);
    if (!ok) { setResetError('Mot de passe incorrect'); setResetPassword(''); return; }
    // Supprimer toutes les clés localStorage de l'application
    ['assoc_globalParams', 'assoc_direction', 'assoc_services', 'assoc_data_version', 'assoc_pilotage_sites', 'assoc_direction_position', 'assoc_pole_support', 'assoc_pole_support_position', 'assoc_darkMode'].forEach(k => localStorage.removeItem(k));
    setDirectionPosition(0);
    setPoleSupportPosition(1);
    setEnveloppeFormation({ budget: 0, actions: [] });
    localStorage.removeItem('assoc_enveloppe_formation');
    localStorage.removeItem('assoc_reporting_fc');
    setReportingFC([]);
    localStorage.removeItem('assoc_donnees_n1');
    setDonneesN1(null);
    localStorage.removeItem('assoc_planning_absences');
    setPlanningAbsences({});
    setDarkMode(false);
    // Remettre tous les états à zéro (aucun intitulé, aucun montant)
    setGlobalParams(zeroGlobalParams);
    setDirection(zeroDirection);
    setServices(zeroServices);
    setPoleSupport(defaultPoleSupport);
    setPilotageSites(pilotageZeroSites);
    setPilotageResetKey(k => k + 1); // force remount PilotageFinancier → zeroSites
    setShowResetModal(false);
    setResetPassword('');
    setResetError('');
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 4000);
  };

  // Gestion du mot de passe (uniquement en local)
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  const handleChangePassword = async () => {
    if (newPassword.length < 4) {
      setPasswordMessage('Le mot de passe doit contenir au moins 4 caractères');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage('Les mots de passe ne correspondent pas');
      return;
    }
    localStorage.setItem('budget_custom_password_hash', await hashPassword(newPassword));
    localStorage.removeItem('budget_custom_password');
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

  const handleLogout = () => {
    localStorage.removeItem('budget_authenticated');
    setIsAuthenticated(false);
  };

  const getBudgetDirection = () => calculerBudgetDirection(direction);
  const getBudgetPoleSupport = () => calculerBudgetPoleSupport(poleSupport);
  const getBudgetService = (service) => calculerBudgetService(service);
  const getProvisions = () => calculerProvisions(direction, services, globalParams, poleSupport);
  const getBFR = () => calculerBFR(direction, services, globalParams, poleSupport);
  const getFondRoulement = () => calculerFondRoulement(direction, services, globalParams);
  const summary3Ans = calculerSynthese3Ans(direction, services, globalParams, poleSupport);
  const budgetAnnuel = calculerBudgetAnnuelMensuel(direction, services, globalParams, poleSupport);

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
    return <LoginScreen onLogin={() => setIsAuthenticated(true)} checkPassword={checkPassword} darkMode={darkMode} />;
  }

  const nomsMois = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

  // Calcul des alertes
  const totalRecettes = services.reduce((sum, s) => sum + getBudgetService(s).recettes, 0);
  const totalCharges = services.reduce((sum, s) => sum + getBudgetService(s).total, 0) + getBudgetDirection().total + getBudgetPoleSupport().total;
  const soldeGlobal = totalRecettes - totalCharges;
  const hasDeficit = soldeGlobal < 0;

  // ── KPI globaux ──────────────────────────────────────────────────
  const totalETP = direction.personnel.reduce((s, p) => s + p.etp, 0)
    + poleSupport.personnel.reduce((s, p) => s + p.etp, 0)
    + services.reduce((s, srv) => s + srv.personnel.reduce((s2, p) => s2 + p.etp, 0), 0);
  const totalEtudiants = services.reduce((s, srv) => {
    if (srv.promos) return s + calculerStatsFormation(srv).effectifActuel;
    return s + (srv.unites || 0);
  }, 0);
  const tauxCouverture = totalCharges > 0 ? (totalRecettes / totalCharges) * 100 : 0;
  const coutParEtudiant = totalEtudiants > 0 ? Math.round(totalCharges / totalEtudiants) : 0;
  const totalProvisions = getProvisions().total;

  // ── Alertes automatiques ──────────────────────────────────────────
  const alertes = [];
  if (hasDeficit) alertes.push({ lvl: 'error', msg: `Déficit global : ${Math.round(-soldeGlobal).toLocaleString()} € (recettes ${Math.round(totalRecettes).toLocaleString()} € vs charges ${Math.round(totalCharges).toLocaleString()} €)` });
  services.forEach(srv => {
    const bs = getBudgetService(srv);
    if (bs.solde < 0) alertes.push({ lvl: 'warning', msg: `Service « ${srv.nom} » en déficit : ${Math.round(-bs.solde).toLocaleString()} €` });
  });
  const bfrData = getBFR(); const frData = getFondRoulement();
  if (bfrData.bfr > 0 && frData.fondRoulement < bfrData.bfr)
    alertes.push({ lvl: 'warning', msg: `BFR (${Math.round(bfrData.bfr).toLocaleString()} €) supérieur au Fonds de Roulement (${Math.round(frData.fondRoulement).toLocaleString()} €) — risque trésorerie` });
  if (tauxCouverture > 0 && tauxCouverture < 90)
    alertes.push({ lvl: 'info', msg: `Taux de couverture faible : ${tauxCouverture.toFixed(1)}% (objectif ≥ 100%)` });
  if (totalProvisions === 0)
    alertes.push({ lvl: 'info', msg: 'Aucune provision constituée — vérifier les taux dans le bloc Provisions' });

  return (
    <>
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-slate-50 to-slate-100'}`}>
      {/* Menu latéral de navigation */}
      <SidebarNav
        services={services}
        darkMode={darkMode}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

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
      <ImportN1Modal
        isOpen={showImportN1}
        onClose={() => setShowImportN1(false)}
        onConfirm={(data) => setDonneesN1(data)}
        darkMode={darkMode}
      />
      {showWizardBP && (
        <WizardImportBP
          onClose={() => setShowWizardBP(false)}
          services={services}
          setServices={setServices}
          poleSupport={poleSupport}
          setPoleSupport={setPoleSupport}
          direction={direction}
          setDirection={setDirection}
          darkMode={darkMode}
        />
      )}

      {/* Contenu principal avec marge pour le sidebar */}
      <div className={`main-content p-4 md:p-8 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <div className="max-w-7xl mx-auto">

          {/* ── TABLEAU DE BORD KPI ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {[
              { label: 'Recettes', val: `${Math.round(totalRecettes/1000)}k €`, sub: 'annuelles', color: darkMode ? 'bg-green-900/40 border-green-700' : 'bg-green-50 border-green-200', txt: darkMode ? 'text-green-300' : 'text-green-700', icon: <Banknote size={16}/> },
              { label: 'Charges', val: `${Math.round(totalCharges/1000)}k €`, sub: 'annuelles', color: darkMode ? 'bg-red-900/30 border-red-800' : 'bg-red-50 border-red-200', txt: darkMode ? 'text-red-300' : 'text-red-700', icon: <TrendingDown size={16}/> },
              { label: 'Solde', val: `${soldeGlobal >= 0 ? '+' : ''}${Math.round(soldeGlobal/1000)}k €`, sub: 'résultat', color: soldeGlobal >= 0 ? (darkMode ? 'bg-emerald-900/40 border-emerald-700' : 'bg-emerald-50 border-emerald-200') : (darkMode ? 'bg-orange-900/40 border-orange-700' : 'bg-orange-50 border-orange-200'), txt: soldeGlobal >= 0 ? (darkMode ? 'text-emerald-300' : 'text-emerald-700') : (darkMode ? 'text-orange-300' : 'text-orange-700'), icon: soldeGlobal >= 0 ? <CheckCircle size={16}/> : <AlertTriangle size={16}/> },
              { label: 'Couverture', val: `${tauxCouverture.toFixed(1)}%`, sub: 'recettes/charges', color: tauxCouverture >= 100 ? (darkMode ? 'bg-teal-900/40 border-teal-700' : 'bg-teal-50 border-teal-200') : (darkMode ? 'bg-amber-900/40 border-amber-700' : 'bg-amber-50 border-amber-200'), txt: tauxCouverture >= 100 ? (darkMode ? 'text-teal-300' : 'text-teal-700') : (darkMode ? 'text-amber-300' : 'text-amber-700'), icon: <Target size={16}/> },
              { label: 'ETP total', val: totalETP.toFixed(1), sub: 'équivalents temps plein', color: darkMode ? 'bg-blue-900/40 border-blue-700' : 'bg-blue-50 border-blue-200', txt: darkMode ? 'text-blue-300' : 'text-blue-700', icon: <Users size={16}/> },
              { label: 'Coût/étudiant', val: totalEtudiants > 0 ? `${coutParEtudiant.toLocaleString()} €` : '—', sub: `${totalEtudiants} étudiants`, color: darkMode ? 'bg-purple-900/40 border-purple-700' : 'bg-purple-50 border-purple-200', txt: darkMode ? 'text-purple-300' : 'text-purple-700', icon: <GraduationCap size={16}/> },
            ].map((k, i) => (
              <div key={i} className={`rounded-2xl border p-3 ${k.color}`}>
                <div className={`flex items-center gap-1 text-xs font-bold mb-1 ${k.txt}`}>{k.icon} {k.label}</div>
                <div className={`text-xl font-black ${k.txt}`}>{k.val}</div>
                <div className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* ── ALERTES AUTOMATIQUES ── */}
          {alertes.length > 0 && (
            <div className={`mb-6 rounded-2xl border-2 overflow-hidden ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
              <div className={`px-4 py-2 flex items-center gap-2 ${darkMode ? 'bg-gray-700' : 'bg-slate-100'}`}>
                <Bell size={16} className={alertes.some(a => a.lvl === 'error') ? 'text-red-500' : 'text-amber-500'} />
                <span className={`text-sm font-black ${darkMode ? 'text-white' : 'text-slate-700'}`}>{alertes.length} point{alertes.length > 1 ? 's' : ''} de vigilance</span>
              </div>
              <div className="divide-y divide-slate-100">
                {alertes.map((a, i) => (
                  <div key={i} className={`px-4 py-2.5 flex items-start gap-3 text-sm ${
                    a.lvl === 'error'   ? (darkMode ? 'bg-red-900/20 text-red-300'    : 'bg-red-50 text-red-700')
                  : a.lvl === 'warning' ? (darkMode ? 'bg-amber-900/20 text-amber-300' : 'bg-amber-50 text-amber-700')
                  :                       (darkMode ? 'bg-blue-900/20 text-blue-300'   : 'bg-blue-50 text-blue-700')
                  }`}>
                    {a.lvl === 'error' ? <AlertTriangle size={15} className="flex-shrink-0 mt-0.5"/> : <AlertCircle size={15} className="flex-shrink-0 mt-0.5"/>}
                    {a.msg}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* HEADER */}
          <div id="header" className={`rounded-3xl shadow-lg border p-6 mb-6 no-print ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
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
              <button onClick={() => { setPresentationMode(true); setSlideIndex(0); }} className="bg-indigo-600 text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2"><Monitor size={18} /> Présentation</button>
              <button onClick={sauvegarderBudget} className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2"><Save size={18} /> Sauver</button>
              <button onClick={() => fileInputRef.current.click()} className="bg-slate-600 text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2"><Upload size={18} /> Charger</button>
              <input type="file" ref={fileInputRef} onChange={chargerBudget} accept=".json" className="hidden" />
              <button onClick={() => exportToExcel(direction, services, globalParams, poleSupport)} className="bg-green-600 text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2"><FileSpreadsheet size={18} /> Excel</button>
              <button onClick={() => exportToPDF(direction, services, globalParams, poleSupport)} className="bg-red-600 text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2"><Download size={18} /> PDF</button>
              <button onClick={() => setShowImportN1(true)} className={`px-4 py-3 rounded-xl font-bold flex items-center gap-2 border-2 transition-colors ${donneesN1 ? (darkMode ? 'border-violet-500 text-violet-300 bg-violet-900/30' : 'border-violet-400 text-violet-700 bg-violet-50') : (darkMode ? 'border-gray-600 text-gray-400 hover:bg-gray-700' : 'border-slate-300 text-slate-600 hover:bg-slate-50')}`} title={donneesN1 ? `Données N-1 chargées (${donneesN1.annee})` : 'Importer données N-1'}><Upload size={18} /> {donneesN1 ? `N-1 (${donneesN1.annee})` : 'Importer N-1'}</button>
              <button onClick={() => setShowWizardBP(true)} className="bg-amber-500 text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2"><Upload size={18} /> Import BP</button>
              <button onClick={() => window.print()} className="bg-slate-500 text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2"><Printer size={18} /></button>
              {isLocalhost && (
                <button onClick={() => setShowPasswordModal(true)} className="bg-purple-600 text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2"><Key size={18} /></button>
              )}
              <button
                onClick={() => { setShowResetModal(true); setResetError(''); setResetPassword(''); }}
                className={`px-4 py-3 rounded-xl font-bold flex items-center gap-2 border-2 transition-colors ${darkMode ? 'border-red-700 text-red-400 hover:bg-red-900/30' : 'border-red-300 text-red-600 hover:bg-red-50'}`}
                title="Remettre à zéro toutes les données"
              >
                <RotateCcw size={18} />
              </button>
              <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2"><LogOut size={18} /></button>
            </div>
          </div>
        </div>

        {/* Modal remise à zéro globale */}
        {showResetModal && (
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
                  onKeyDown={e => e.key === 'Enter' && handleGlobalReset()}
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
                  onClick={handleGlobalReset}
                  className="flex-1 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold rounded-xl hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <RotateCcw size={16} /> Réinitialiser tout
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notification remise à zéro */}
        {resetSuccess && (
          <div className={`mb-4 p-4 rounded-2xl flex items-center gap-3 ${darkMode ? 'bg-green-900/40 border border-green-700' : 'bg-green-50 border border-green-200'}`}>
            <CheckCircle className="text-green-500 flex-shrink-0" size={20} />
            <span className={`font-bold text-sm ${darkMode ? 'text-green-300' : 'text-green-700'}`}>
              Toutes les données ont été réinitialisées avec succès.
            </span>
          </div>
        )}

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
        {/* BUDGET ANNUEL */}
        <div id="budget-annuel" className={`rounded-3xl shadow-lg border-2 p-6 mb-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
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
        <div id="synthese-3ans" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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
        <div id="graphiques" className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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

        {/* ── ANALYSE DE SCÉNARIOS ── */}
        <div id="scenarios" className={`rounded-3xl shadow-lg border-2 p-6 mb-8 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
          <h2 className={`text-xl font-black mb-5 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
            <TrendingUp size={24} className="text-violet-500" /> Analyse de scénarios — Projection an 3
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Pessimiste', augmCharges: 4, deltaRec: -5,  icon: <TrendingDown size={18}/>, bg: darkMode ? 'bg-red-900/20 border-red-700'     : 'bg-red-50 border-red-200',    hdr: darkMode ? 'bg-red-900/40 text-red-300'    : 'bg-red-100 text-red-700',    acc: 'text-red-500'     },
              { label: 'Réaliste',   augmCharges: globalParams.augmentationAnnuelle, deltaRec: 0, icon: <TrendingUp size={18}/>, bg: darkMode ? 'bg-teal-900/20 border-teal-700' : 'bg-teal-50 border-teal-200', hdr: darkMode ? 'bg-teal-900/40 text-teal-300' : 'bg-teal-100 text-teal-700', acc: 'text-teal-500' },
              { label: 'Optimiste',  augmCharges: 2, deltaRec: +5,  icon: <TrendingUp size={18}/>,  bg: darkMode ? 'bg-green-900/20 border-green-700'  : 'bg-green-50 border-green-200', hdr: darkMode ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-700', acc: 'text-green-500' },
            ].map((sc, si) => {
              const factCharges3 = Math.pow(1 + sc.augmCharges / 100, 3);
              const factRec3     = Math.pow(1 + sc.deltaRec / 100, 3);
              const charges3 = Math.round(totalCharges * factCharges3);
              const recettes3 = Math.round(totalRecettes * factRec3);
              const solde3 = recettes3 - charges3;
              const couv3 = charges3 > 0 ? (recettes3 / charges3 * 100).toFixed(1) : '—';
              const data = [1,2,3].map(n => ({
                an: `An ${n}`,
                Charges: Math.round(totalCharges * Math.pow(1 + sc.augmCharges/100, n)),
                Recettes: Math.round(totalRecettes * Math.pow(1 + sc.deltaRec/100, n)),
              }));
              return (
                <div key={si} className={`rounded-2xl border-2 overflow-hidden ${sc.bg}`}>
                  <div className={`px-4 py-3 flex items-center gap-2 font-black text-sm ${sc.hdr}`}>
                    {sc.icon} {sc.label}
                    <span className="ml-auto font-normal text-xs">charges +{sc.augmCharges}%/an · recettes {sc.deltaRec >= 0 ? '+' : ''}{sc.deltaRec}%/an</span>
                  </div>
                  <div className="p-4">
                    <ResponsiveContainer width="100%" height={120}>
                      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                        <defs>
                          <linearGradient id={`gc${si}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
                          <linearGradient id={`gr${si}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/><stop offset="95%" stopColor="#22c55e" stopOpacity={0}/></linearGradient>
                        </defs>
                        <XAxis dataKey="an" tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#64748b' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1f2937' : '#fff', border: 'none', borderRadius: '8px', fontSize: 11 }} formatter={v => `${v.toLocaleString()} €`} />
                        <Area type="monotone" dataKey="Charges" stroke="#ef4444" fill={`url(#gc${si})`} strokeWidth={2} dot={false} />
                        <Area type="monotone" dataKey="Recettes" stroke="#22c55e" fill={`url(#gr${si})`} strokeWidth={2} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                    <div className={`mt-3 grid grid-cols-2 gap-2 text-xs ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>
                      <div className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white'}`}><div className="text-gray-400">Charges an 3</div><div className="font-black">{charges3.toLocaleString()} €</div></div>
                      <div className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white'}`}><div className="text-gray-400">Recettes an 3</div><div className="font-black">{recettes3.toLocaleString()} €</div></div>
                      <div className={`p-2 rounded-lg col-span-2 ${solde3 >= 0 ? (darkMode ? 'bg-emerald-900/30' : 'bg-emerald-50') : (darkMode ? 'bg-red-900/30' : 'bg-red-50')}`}>
                        <div className="flex justify-between items-center">
                          <span className={solde3 >= 0 ? 'text-emerald-500' : 'text-red-500'}>Solde an 3</span>
                          <span className={`font-black ${solde3 >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{solde3 >= 0 ? '+' : ''}{solde3.toLocaleString()} €</span>
                        </div>
                        <div className={`text-right ${darkMode ? 'text-gray-400' : 'text-slate-400'}`}>Couverture : {couv3}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PROVISIONS & BFR & FONDS DE ROULEMENT */}
        <div id="provisions-bfr-fr" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                      className="absolute -top-2.5 -right-2.5 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 no-print"
                    >
                      <Trash2 size={14} />
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
                      className="absolute -top-2.5 -right-2.5 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 no-print"
                    >
                      <Trash2 size={14} />
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
                              f.id === item.id ? {...f, montant: (item.id === 'reportNouveau' ? validerMontantSigne : validerMontant)(e.target.value)} : f
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

        {/* DIRECTION + SERVICES + PÔLE SUPPORT : section unifiée réordonnable */}
        <div id="services-section" className="space-y-8">
          {(() => {
            const makeAbandons = () => ({ janvier:0,fevrier:0,mars:0,avril:0,mai:0,juin:0,juillet:0,aout:0,septembre:0,octobre:0,novembre:0,decembre:0 });
            const makeRepartitionFI = () => ({ janvier:0,fevrier:0,mars:0,avril:0,mai:0,juin:0,juillet:0,aout:0,septembre:0,octobre:0,novembre:0,decembre:0 });
            const moisKeysFI = ['janvier','fevrier','mars','avril','mai','juin','juillet','aout','septembre','octobre','novembre','decembre'];
            const moisLabelsFI = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'];
            // Construction de la liste unifiée pour le drag-and-drop
            // Positions: 0..services.length+1 (services.length+2 slots total)
            const buildOrder = () => {
              const N = services.length;
              // Clamp positions to valid range
              const dirPos = Math.min(directionPosition, N + 1);
              const psPos  = Math.min(poleSupportPosition, N + 1);
              // Start with service ids in current array order
              const serviceIds = services.map(s => s.id);
              // Build order by inserting direction and pole-support at their positions
              // We iterate over (N+2) slots and fill them
              const slots = [...serviceIds]; // N slots
              // Insert direction at dirPos (clamped)
              const clampedDirPos = Math.min(dirPos, slots.length);
              slots.splice(clampedDirPos, 0, 'direction');
              // Insert pole-support at psPos (relative to original N slots, then adjust for direction insertion)
              const adjustedPsPos = psPos >= clampedDirPos ? Math.min(psPos + 1, slots.length) : Math.min(psPos, slots.length);
              slots.splice(adjustedPsPos, 0, 'pole-support');
              return slots;
            };
            const handleUnifiedDrop = (targetId) => {
              if (dragId === targetId) return;
              const order = buildOrder();
              const fromIdx = order.indexOf(dragId);
              const toIdx   = order.indexOf(targetId);
              if (fromIdx === -1 || toIdx === -1) return;
              const newOrder = [...order];
              const [moved] = newOrder.splice(fromIdx, 1);
              newOrder.splice(toIdx, 0, moved);
              const newDirPos = newOrder.indexOf('direction');
              const newPSPos  = newOrder.indexOf('pole-support');
              const newServices = newOrder.filter(id => id !== 'direction' && id !== 'pole-support').map(id => services.find(s => s.id === id));
              setDirectionPosition(newDirPos);
              setPoleSupportPosition(newPSPos);
              setServices(newServices);
              setDragId(null);
              setDragOverId(null);
            };

            const orderedItems = buildOrder();
            const items = [];

            for (let pos = 0; pos < orderedItems.length; pos++) {
              const itemId = orderedItems[pos];

              // ── DIRECTION ──────────────────────────────────────────────
              if (itemId === 'direction') {
                const isDirDragging = dragId === 'direction';
                const isDirOver     = dragOverId === 'direction' && !isDirDragging;
                items.push(
                  <div
                    key="direction"
                    id="direction"
                    draggable
                    onDragStart={() => setDragId('direction')}
                    onDragOver={(e) => { e.preventDefault(); setDragOverId('direction'); }}
                    onDrop={() => handleUnifiedDrop('direction')}
                    onDragEnd={() => { setDragId(null); setDragOverId(null); }}
                    className={`rounded-3xl shadow-lg border-2 p-8 print-avoid-break transition-all duration-150
                      ${isDirDragging ? 'opacity-40' : ''}
                      ${isDirOver ? 'ring-2 ring-teal-400 ring-offset-2' : ''}
                      ${darkMode ? 'bg-gray-800 border-teal-900' : 'bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-300'}`}
                  >
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-3">
                        <div className={`cursor-grab active:cursor-grabbing p-1 rounded no-print ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-teal-200 hover:text-teal-500'}`} title="Déplacer Direction"><GripVertical size={22} /></div>
                        <div className="flex flex-col gap-0.5 no-print">
                          <button disabled={pos === 0} onClick={() => setDirectionPosition(p => Math.max(0, p-1))} className={`p-0.5 rounded ${pos===0?'opacity-20 cursor-not-allowed':'hover:bg-teal-100'}`}><ChevronUp size={14}/></button>
                          <button disabled={pos === orderedItems.length - 1} onClick={() => setDirectionPosition(p => Math.min(services.length + 1, p+1))} className={`p-0.5 rounded ${pos===orderedItems.length-1?'opacity-20 cursor-not-allowed':'hover:bg-teal-100'}`}><ChevronDown size={14}/></button>
                        </div>
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
                          <button onClick={() => setDirection({...direction, personnel: [...direction.personnel, { id: Date.now(), titre: 'Nouveau', etp: 1, salaire: 2500, segur: 0, typeContrat: 'CDI', rtt: false, dateFinContrat: '' }]})} className="bg-teal-500 text-white p-2 rounded-lg no-print"><Plus size={18} /></button>
                        </div>
                        <div className="space-y-3 max-h-[350px] overflow-y-auto">
                          {direction.personnel.map((p, pIdx) => (
                            <div key={p.id} className={`p-3 rounded-xl border group relative ${darkMode ? 'bg-gray-600 border-gray-500' : 'bg-slate-50 border-slate-200'}`}>
                              <button onClick={() => setDirection({...direction, personnel: direction.personnel.filter(x => x.id !== p.id)})} className="absolute -top-2.5 -right-2.5 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 no-print"><Trash2 size={14} /></button>
                              <div className="flex items-center gap-1 mb-2">
                                <div className="flex flex-col gap-0 no-print">
                                  <button disabled={pIdx===0} onClick={() => { const a=[...direction.personnel]; a.splice(pIdx-1,0,a.splice(pIdx,1)[0]); setDirection({...direction,personnel:a}); }} className={`p-0.5 rounded ${pIdx===0?'opacity-20':'hover:bg-teal-100'}`}><ChevronUp size={10}/></button>
                                  <button disabled={pIdx===direction.personnel.length-1} onClick={() => { const a=[...direction.personnel]; a.splice(pIdx+1,0,a.splice(pIdx,1)[0]); setDirection({...direction,personnel:a}); }} className={`p-0.5 rounded ${pIdx===direction.personnel.length-1?'opacity-20':'hover:bg-teal-100'}`}><ChevronDown size={10}/></button>
                                </div>
                                <input className={`font-bold text-sm flex-1 outline-none bg-transparent ${darkMode ? 'text-white' : ''}`} value={p.titre} onChange={(e) => setDirection({...direction, personnel: direction.personnel.map(x => x.id === p.id ? {...x, titre: e.target.value} : x)})} />
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs mb-1">
                                <div><label className={darkMode ? 'text-gray-400' : 'text-slate-500'}>ETP</label><input type="number" step="0.1" className={`w-full rounded px-2 py-1 font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-white'}`} value={p.etp} onChange={(e) => setDirection({...direction, personnel: direction.personnel.map(x => x.id === p.id ? {...x, etp: validerETP(e.target.value)} : x)})} /></div>
                                <div><label className={darkMode ? 'text-gray-400' : 'text-slate-500'}>Salaire</label><input type="number" className={`w-full rounded px-2 py-1 font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-white'}`} value={p.salaire} onChange={(e) => setDirection({...direction, personnel: direction.personnel.map(x => x.id === p.id ? {...x, salaire: validerSalaire(e.target.value)} : x)})} /></div>
                              </div>
                              <div className="flex items-center gap-3 text-xs flex-wrap">
                                <select className={`rounded px-2 py-1 text-xs ${darkMode ? 'bg-gray-500 text-white' : 'bg-white border'}`} value={p.role || 'administratif'} onChange={e => setDirection({...direction, personnel: direction.personnel.map(x => x.id === p.id ? {...x, role: e.target.value} : x)})}>
                                  <option value="direction">Direction</option>
                                  <option value="directeur_adjoint">Directeur adjoint</option>
                                  <option value="administratif">Administratif</option>
                                  <option value="technique">Technique</option>
                                  <option value="documentation">Documentation</option>
                                  <option value="communication">Communication</option>
                                  <option value="formateur">Formateur</option>
                                  <option value="responsable">Resp. secteur</option>
                                </select>
                                <label className="flex items-center gap-1"><input type="checkbox" checked={p.rqth || false} onChange={e => setDirection({...direction, personnel: direction.personnel.map(x => x.id === p.id ? {...x, rqth: e.target.checked} : x)})} /><span className={p.rqth ? 'text-amber-500 font-black' : (darkMode ? 'text-gray-400' : 'text-slate-500')}>RQTH</span></label>
                                <div className="flex items-center gap-1"><span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Ségur</span><input type="number" min="0" step="1" className={`w-16 text-xs text-right rounded px-1 py-0.5 ${darkMode ? 'bg-gray-600 text-white' : 'bg-slate-50 border'}`} value={p.segur === true ? 238 : (p.segur || 0)} onChange={(e) => setDirection({...direction, personnel: direction.personnel.map(x => x.id === p.id ? {...x, segur: parseInt(e.target.value) || 0} : x)})} /><span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>€/m</span></div>
                                <div className="flex items-center gap-1">
                                  <span className={darkMode ? 'text-gray-400' : 'text-slate-500'}>Né(e) en</span>
                                  <input type="number" min="1940" max="2005" placeholder="1980"
                                    className={`w-16 rounded px-2 py-1 font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-white border'}`}
                                    value={p.anneeNaissance || ''}
                                    onChange={e => setDirection({...direction, personnel: direction.personnel.map(x => x.id === p.id ? {...x, anneeNaissance: parseInt(e.target.value) || 0} : x)})}
                                  />
                                </div>
                              </div>
                              <div className="flex items-center gap-3 text-xs flex-wrap mt-1">
                                <select className={`rounded px-2 py-1 text-xs font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-white border'}`} value={p.typeContrat || 'CDI'} onChange={e => setDirection({...direction, personnel: direction.personnel.map(x => x.id === p.id ? {...x, typeContrat: e.target.value, dateFinContrat: e.target.value === 'CDI' ? '' : x.dateFinContrat} : x)})}>
                                  <option value="CDI">CDI</option>
                                  <option value="CDD">CDD</option>
                                  <option value="Apprentissage">Apprentissage</option>
                                  <option value="Stage">Stage</option>
                                  <option value="Vacataire">Vacataire</option>
                                  <option value="Autre">Autre</option>
                                </select>
                                <label className="flex items-center gap-1"><input type="checkbox" checked={p.rtt || false} onChange={e => setDirection({...direction, personnel: direction.personnel.map(x => x.id === p.id ? {...x, rtt: e.target.checked} : x)})} /><span className={p.rtt ? 'text-blue-500 font-black' : (darkMode ? 'text-gray-400' : 'text-slate-500')}>RTT</span></label>
                                {(p.typeContrat && p.typeContrat !== 'CDI') && (
                                  <div className="flex items-center gap-1">
                                    <span className={darkMode ? 'text-gray-400' : 'text-slate-500'}>Fin contrat</span>
                                    <input type="date" className={`rounded px-2 py-0.5 text-xs ${darkMode ? 'bg-gray-500 text-white' : 'bg-white border'}`} value={p.dateFinContrat || ''} onChange={e => setDirection({...direction, personnel: direction.personnel.map(x => x.id === p.id ? {...x, dateFinContrat: e.target.value} : x)})} />
                                  </div>
                                )}
                              </div>
                              {/* Absences */}
                              <details className="mt-2">
                                <summary className={`text-xs cursor-pointer select-none flex items-center gap-1 ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-slate-400 hover:text-slate-600'}`}>
                                  <Calendar size={12} />
                                  {(p.absences||[]).length > 0 ? `${(p.absences||[]).length} période(s)` : 'Congés / Arrêts'}
                                </summary>
                                <div className="mt-1.5 space-y-1 pl-1">
                                  {(p.absences||[]).map(ab => (
                                    <div key={ab.id} className={`flex flex-wrap items-center gap-1 text-xs rounded-lg px-2 py-1 ${ab.type==='conge'?(darkMode?'bg-blue-900/40 text-blue-300':'bg-blue-50 border border-blue-200'):ab.type==='maladie'?(darkMode?'bg-red-900/40 text-red-300':'bg-red-50 border border-red-200'):ab.type==='rtt'?(darkMode?'bg-purple-900/40 text-purple-300':'bg-purple-50 border border-purple-200'):(darkMode?'bg-orange-900/40 text-orange-300':'bg-orange-50 border border-orange-200')}`}>
                                      <select className="bg-transparent font-bold outline-none text-xs" value={ab.type} onChange={e => setDirection({...direction, personnel: direction.personnel.map(x => x.id===p.id?{...x,absences:(x.absences||[]).map(a=>a.id===ab.id?{...a,type:e.target.value}:a)}:x)})}>
                                        <option value="conge">Congé</option>
                                        <option value="maladie">Maladie</option>
                                        <option value="rtt">RTT</option>
                                        <option value="arret">Arrêt travail</option>
                                      </select>
                                      <input type="date" className="bg-transparent outline-none text-xs" value={ab.dateDebut||''} onChange={e => setDirection({...direction, personnel: direction.personnel.map(x => x.id===p.id?{...x,absences:(x.absences||[]).map(a=>a.id===ab.id?{...a,dateDebut:e.target.value}:a)}:x)})} />
                                      <span>→</span>
                                      <input type="date" className="bg-transparent outline-none text-xs" value={ab.dateFin||''} onChange={e => setDirection({...direction, personnel: direction.personnel.map(x => x.id===p.id?{...x,absences:(x.absences||[]).map(a=>a.id===ab.id?{...a,dateFin:e.target.value}:a)}:x)})} />
                                      <button onClick={() => setDirection({...direction, personnel: direction.personnel.map(x => x.id===p.id?{...x,absences:(x.absences||[]).filter(a=>a.id!==ab.id)}:x)})} className="ml-auto text-red-400 hover:text-red-600 no-print"><X size={12}/></button>
                                    </div>
                                  ))}
                                  <button onClick={() => setDirection({...direction, personnel: direction.personnel.map(x => x.id===p.id?{...x,absences:[...(x.absences||[]),{id:Date.now(),type:'conge',dateDebut:'',dateFin:''}]}:x)})} className={`text-xs flex items-center gap-1 px-2 py-0.5 rounded border border-dashed no-print ${darkMode?'border-gray-500 text-gray-400 hover:text-gray-200':'border-slate-300 text-slate-400 hover:text-slate-600'}`}>
                                    <Plus size={10}/> Ajouter
                                  </button>
                                </div>
                              </details>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className={`p-6 rounded-2xl shadow-lg ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                        <div className="flex justify-between items-center mb-4">
                          <h3 className={`font-black flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-700'}`}><Landmark size={20} className="text-teal-500" /> Charges siège</h3>
                          <button onClick={() => setDirection({ ...direction, chargesSiege: [...(direction.chargesSiege || []), { id: Date.now(), nom: 'Nouvelle charge', montant: 0 }] })} className="bg-teal-500 text-white p-2 rounded-lg no-print"><Plus size={18} /></button>
                        </div>
                        <div className="space-y-3 max-h-[350px] overflow-y-auto">
                          {(direction.chargesSiege || []).map((c, cIdx) => (
                            <div key={c.id} className={`p-3 rounded-xl border group relative ${darkMode ? 'bg-gray-600 border-gray-500' : 'bg-slate-50 border-slate-200'}`}>
                              <button onClick={() => setDirection({ ...direction, chargesSiege: direction.chargesSiege.filter(x => x.id !== c.id) })} className="absolute -top-2.5 -right-2.5 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 no-print"><Trash2 size={14} /></button>
                              <div className="flex items-center gap-1 mb-2">
                                <div className="flex flex-col gap-0 no-print">
                                  <button disabled={cIdx===0} onClick={() => { const a=[...(direction.chargesSiege||[])]; a.splice(cIdx-1,0,a.splice(cIdx,1)[0]); setDirection({...direction,chargesSiege:a}); }} className={`p-0.5 rounded ${cIdx===0?'opacity-20':'hover:bg-teal-100'}`}><ChevronUp size={10}/></button>
                                  <button disabled={cIdx===(direction.chargesSiege||[]).length-1} onClick={() => { const a=[...(direction.chargesSiege||[])]; a.splice(cIdx+1,0,a.splice(cIdx,1)[0]); setDirection({...direction,chargesSiege:a}); }} className={`p-0.5 rounded ${cIdx===(direction.chargesSiege||[]).length-1?'opacity-20':'hover:bg-teal-100'}`}><ChevronDown size={10}/></button>
                                </div>
                                <input className={`font-bold text-sm flex-1 outline-none bg-transparent ${darkMode ? 'text-white' : ''}`} value={c.nom} onChange={e => setDirection({ ...direction, chargesSiege: direction.chargesSiege.map(x => x.id === c.id ? { ...x, nom: e.target.value } : x) })} />
                              </div>
                              <div className="flex items-center gap-2">
                                <Euro className="text-teal-500" size={16} />
                                <input type="number" className={`w-28 text-right font-black text-lg rounded-lg px-3 py-1.5 outline-none ${darkMode ? 'bg-gray-500 text-white' : 'bg-white'}`} value={c.montant} onChange={e => setDirection({ ...direction, chargesSiege: direction.chargesSiege.map(x => x.id === c.id ? { ...x, montant: validerMontant(e.target.value) } : x) })} />
                                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>/mois</span>
                              </div>
                            </div>
                          ))}
                          {(direction.chargesSiege || []).length === 0 && <p className={`text-sm text-center py-4 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Aucune charge — cliquez + pour en ajouter</p>}
                        </div>
                        {(direction.chargesSiege || []).length > 0 && (
                          <div className={`mt-3 pt-3 border-t flex justify-between text-sm font-bold ${darkMode ? 'border-gray-600 text-gray-300' : 'border-slate-200 text-slate-600'}`}>
                            <span>Total mensuel</span>
                            <span className="text-teal-600">{(direction.chargesSiege || []).reduce((s, c) => s + (parseFloat(c.montant) || 0), 0).toLocaleString()} €</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              // ── PÔLE SUPPORT ───────────────────────────────────────────
              if (itemId === 'pole-support') {
                const isPSDragging = dragId === 'pole-support';
                const isPSOver = dragOverId === 'pole-support' && !isPSDragging;
                items.push(
                  <div
                    key="pole-support"
                    id="pole-support"
                    draggable
                    onDragStart={() => setDragId('pole-support')}
                    onDragOver={(e) => { e.preventDefault(); setDragOverId('pole-support'); }}
                    onDrop={() => handleUnifiedDrop('pole-support')}
                    onDragEnd={() => { setDragId(null); setDragOverId(null); }}
                    className={`rounded-3xl shadow-lg border-2 p-8 print-avoid-break transition-all duration-150
                      ${isPSDragging ? 'opacity-40' : ''}
                      ${isPSOver ? 'ring-2 ring-cyan-400 ring-offset-2' : ''}
                      ${darkMode ? 'bg-gray-800 border-cyan-900' : 'bg-gradient-to-br from-cyan-50 to-sky-50 border-cyan-300'}`}
                  >
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-3">
                        <div className={`cursor-grab active:cursor-grabbing p-1 rounded no-print ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-cyan-200 hover:text-cyan-500'}`} title="Déplacer Pôle Support"><GripVertical size={22} /></div>
                        <div className="flex flex-col gap-0.5 no-print">
                          <button disabled={pos === 0} onClick={() => setPoleSupportPosition(p => Math.max(0, p-1))} className={`p-0.5 rounded ${pos===0?'opacity-20 cursor-not-allowed':'hover:bg-cyan-100'}`}><ChevronUp size={14}/></button>
                          <button disabled={pos === orderedItems.length - 1} onClick={() => setPoleSupportPosition(p => Math.min(services.length + 1, p+1))} className={`p-0.5 rounded ${pos===orderedItems.length-1?'opacity-20 cursor-not-allowed':'hover:bg-cyan-100'}`}><ChevronDown size={14}/></button>
                        </div>
                        <Building className="text-cyan-600" size={32} />
                        <div>
                          <h2 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>Pôle Support</h2>
                          <span className="text-sm text-cyan-600 font-bold">{poleSupport.personnel.reduce((s, p) => s + p.etp, 0).toFixed(1)} ETP · Ressources transversales</span>
                        </div>
                      </div>
                      <span className={`text-2xl font-black ${darkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>{Math.round(getBudgetPoleSupport().total).toLocaleString()} €</span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Personnel */}
                      <div className={`p-6 rounded-2xl shadow-lg ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                        <div className="flex justify-between items-center mb-4">
                          <h3 className={`font-black flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-700'}`}><Users size={20} className="text-cyan-500" /> Personnel</h3>
                          <button onClick={() => setPoleSupport({...poleSupport, personnel: [...poleSupport.personnel, { id: Date.now(), titre: 'Nouveau', etp: 1, salaire: 2500, segur: 0, role: 'administratif', rqth: false, anneeNaissance: 0, typeContrat: 'CDI', rtt: false, dateFinContrat: '' }]})} className="bg-cyan-500 text-white p-2 rounded-lg no-print"><Plus size={18} /></button>
                        </div>
                        <div className="space-y-3 max-h-[350px] overflow-y-auto">
                          {poleSupport.personnel.map((p) => (
                            <div key={p.id} className={`p-3 rounded-xl border group relative ${darkMode ? 'bg-gray-600 border-gray-500' : 'bg-slate-50 border-slate-200'}`}>
                              <button onClick={() => setPoleSupport({...poleSupport, personnel: poleSupport.personnel.filter(x => x.id !== p.id)})} className="absolute -top-2.5 -right-2.5 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 no-print"><Trash2 size={14} /></button>
                              <input className={`font-bold text-sm w-full outline-none bg-transparent mb-2 ${darkMode ? 'text-white' : ''}`} value={p.titre} onChange={(e) => setPoleSupport({...poleSupport, personnel: poleSupport.personnel.map(x => x.id === p.id ? {...x, titre: e.target.value} : x)})} />
                              <div className="grid grid-cols-2 gap-2 text-xs mb-1">
                                <div><label className={darkMode ? 'text-gray-400' : 'text-slate-500'}>ETP</label><input type="number" step="0.1" className={`w-full rounded px-2 py-1 font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-white'}`} value={p.etp} onChange={(e) => setPoleSupport({...poleSupport, personnel: poleSupport.personnel.map(x => x.id === p.id ? {...x, etp: validerETP(e.target.value)} : x)})} /></div>
                                <div><label className={darkMode ? 'text-gray-400' : 'text-slate-500'}>Salaire</label><input type="number" className={`w-full rounded px-2 py-1 font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-white'}`} value={p.salaire} onChange={(e) => setPoleSupport({...poleSupport, personnel: poleSupport.personnel.map(x => x.id === p.id ? {...x, salaire: validerSalaire(e.target.value)} : x)})} /></div>
                              </div>
                              <div className="flex items-center gap-3 text-xs flex-wrap">
                                <select className={`rounded px-2 py-1 text-xs ${darkMode ? 'bg-gray-500 text-white' : 'bg-white border'}`} value={p.role || 'administratif'} onChange={e => setPoleSupport({...poleSupport, personnel: poleSupport.personnel.map(x => x.id === p.id ? {...x, role: e.target.value} : x)})}>
                                  <option value="direction">Direction</option>
                                  <option value="administratif">Administratif</option>
                                  <option value="technique">Technique</option>
                                  <option value="documentation">Documentation</option>
                                  <option value="formateur">Formateur</option>
                                </select>
                                <label className="flex items-center gap-1"><input type="checkbox" checked={p.rqth || false} onChange={e => setPoleSupport({...poleSupport, personnel: poleSupport.personnel.map(x => x.id === p.id ? {...x, rqth: e.target.checked} : x)})} /><span className={p.rqth ? 'text-amber-500 font-black' : (darkMode ? 'text-gray-400' : 'text-slate-500')}>RQTH</span></label>
                                <div className="flex items-center gap-1"><span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Ségur</span><input type="number" min="0" step="1" className={`w-16 text-xs text-right rounded px-1 py-0.5 ${darkMode ? 'bg-gray-600 text-white' : 'bg-slate-50 border'}`} value={p.segur === true ? 238 : (p.segur || 0)} onChange={(e) => setPoleSupport({...poleSupport, personnel: poleSupport.personnel.map(x => x.id === p.id ? {...x, segur: parseInt(e.target.value) || 0} : x)})} /><span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>€/m</span></div>
                                <div className="flex items-center gap-1">
                                  <span className={darkMode ? 'text-gray-400' : 'text-slate-500'}>Né(e) en</span>
                                  <input type="number" min="1940" max="2005" placeholder="1980" className={`w-16 rounded px-2 py-1 font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-white border'}`} value={p.anneeNaissance || ''} onChange={e => setPoleSupport({...poleSupport, personnel: poleSupport.personnel.map(x => x.id === p.id ? {...x, anneeNaissance: parseInt(e.target.value) || 0} : x)})} />
                                </div>
                              </div>
                              <div className="flex items-center gap-3 text-xs flex-wrap mt-1">
                                <select className={`rounded px-2 py-1 text-xs font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-white border'}`} value={p.typeContrat || 'CDI'} onChange={e => setPoleSupport({...poleSupport, personnel: poleSupport.personnel.map(x => x.id === p.id ? {...x, typeContrat: e.target.value, dateFinContrat: e.target.value === 'CDI' ? '' : x.dateFinContrat} : x)})}>
                                  <option value="CDI">CDI</option>
                                  <option value="CDD">CDD</option>
                                  <option value="Apprentissage">Apprentissage</option>
                                  <option value="Stage">Stage</option>
                                  <option value="Vacataire">Vacataire</option>
                                  <option value="Autre">Autre</option>
                                </select>
                                <label className="flex items-center gap-1"><input type="checkbox" checked={p.rtt || false} onChange={e => setPoleSupport({...poleSupport, personnel: poleSupport.personnel.map(x => x.id === p.id ? {...x, rtt: e.target.checked} : x)})} /><span className={p.rtt ? 'text-blue-500 font-black' : (darkMode ? 'text-gray-400' : 'text-slate-500')}>RTT</span></label>
                                {(p.typeContrat && p.typeContrat !== 'CDI') && (
                                  <div className="flex items-center gap-1">
                                    <span className={darkMode ? 'text-gray-400' : 'text-slate-500'}>Fin contrat</span>
                                    <input type="date" className={`rounded px-2 py-0.5 text-xs ${darkMode ? 'bg-gray-500 text-white' : 'bg-white border'}`} value={p.dateFinContrat || ''} onChange={e => setPoleSupport({...poleSupport, personnel: poleSupport.personnel.map(x => x.id === p.id ? {...x, dateFinContrat: e.target.value} : x)})} />
                                  </div>
                                )}
                              </div>
                              {/* Absences */}
                              <details className="mt-2">
                                <summary className={`text-xs cursor-pointer select-none flex items-center gap-1 ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-slate-400 hover:text-slate-600'}`}>
                                  <Calendar size={12} />
                                  {(p.absences||[]).length > 0 ? `${(p.absences||[]).length} période(s)` : 'Congés / Arrêts'}
                                </summary>
                                <div className="mt-1.5 space-y-1 pl-1">
                                  {(p.absences||[]).map(ab => (
                                    <div key={ab.id} className={`flex flex-wrap items-center gap-1 text-xs rounded-lg px-2 py-1 ${ab.type==='conge'?(darkMode?'bg-blue-900/40 text-blue-300':'bg-blue-50 border border-blue-200'):ab.type==='maladie'?(darkMode?'bg-red-900/40 text-red-300':'bg-red-50 border border-red-200'):ab.type==='rtt'?(darkMode?'bg-purple-900/40 text-purple-300':'bg-purple-50 border border-purple-200'):(darkMode?'bg-orange-900/40 text-orange-300':'bg-orange-50 border border-orange-200')}`}>
                                      <select className="bg-transparent font-bold outline-none text-xs" value={ab.type} onChange={e => setPoleSupport({...poleSupport, personnel: poleSupport.personnel.map(x => x.id===p.id?{...x,absences:(x.absences||[]).map(a=>a.id===ab.id?{...a,type:e.target.value}:a)}:x)})}>
                                        <option value="conge">Congé</option>
                                        <option value="maladie">Maladie</option>
                                        <option value="rtt">RTT</option>
                                        <option value="arret">Arrêt travail</option>
                                      </select>
                                      <input type="date" className="bg-transparent outline-none text-xs" value={ab.dateDebut||''} onChange={e => setPoleSupport({...poleSupport, personnel: poleSupport.personnel.map(x => x.id===p.id?{...x,absences:(x.absences||[]).map(a=>a.id===ab.id?{...a,dateDebut:e.target.value}:a)}:x)})} />
                                      <span>→</span>
                                      <input type="date" className="bg-transparent outline-none text-xs" value={ab.dateFin||''} onChange={e => setPoleSupport({...poleSupport, personnel: poleSupport.personnel.map(x => x.id===p.id?{...x,absences:(x.absences||[]).map(a=>a.id===ab.id?{...a,dateFin:e.target.value}:a)}:x)})} />
                                      <button onClick={() => setPoleSupport({...poleSupport, personnel: poleSupport.personnel.map(x => x.id===p.id?{...x,absences:(x.absences||[]).filter(a=>a.id!==ab.id)}:x)})} className="ml-auto text-red-400 hover:text-red-600 no-print"><X size={12}/></button>
                                    </div>
                                  ))}
                                  <button onClick={() => setPoleSupport({...poleSupport, personnel: poleSupport.personnel.map(x => x.id===p.id?{...x,absences:[...(x.absences||[]),{id:Date.now(),type:'conge',dateDebut:'',dateFin:''}]}:x)})} className={`text-xs flex items-center gap-1 px-2 py-0.5 rounded border border-dashed no-print ${darkMode?'border-gray-500 text-gray-400 hover:text-gray-200':'border-slate-300 text-slate-400 hover:text-slate-600'}`}>
                                    <Plus size={10}/> Ajouter
                                  </button>
                                </div>
                              </details>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Exploitation */}
                      <div className={`p-6 rounded-2xl shadow-lg ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                        <div className="flex justify-between items-center mb-4">
                          <h3 className={`font-black flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-700'}`}><Landmark size={20} className="text-cyan-500" /> Exploitation</h3>
                          <button onClick={() => setPoleSupport({...poleSupport, exploitation: [...(poleSupport.exploitation||[]), { id: Date.now(), nom: 'Nouvelle charge', montant: 0 }]})} className="bg-cyan-500 text-white p-2 rounded-lg no-print"><Plus size={18} /></button>
                        </div>
                        <div className="space-y-2 max-h-[200px] overflow-y-auto">
                          {(poleSupport.exploitation||[]).map(c => (
                            <div key={c.id} className={`p-2 rounded-xl border group relative flex items-center gap-2 ${darkMode ? 'bg-gray-600 border-gray-500' : 'bg-slate-50 border-slate-200'}`}>
                              <button onClick={() => setPoleSupport({...poleSupport, exploitation: poleSupport.exploitation.filter(x => x.id !== c.id)})} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 no-print"><Trash2 size={12} /></button>
                              <input className={`font-bold text-xs flex-1 outline-none bg-transparent ${darkMode ? 'text-white' : ''}`} value={c.nom} onChange={e => setPoleSupport({...poleSupport, exploitation: poleSupport.exploitation.map(x => x.id === c.id ? {...x, nom: e.target.value} : x)})} />
                              <input type="number" className={`w-24 text-right text-xs font-bold rounded px-2 py-1 ${darkMode ? 'bg-gray-500 text-white' : 'bg-white border'}`} value={c.montant} onChange={e => setPoleSupport({...poleSupport, exploitation: poleSupport.exploitation.map(x => x.id === c.id ? {...x, montant: validerMontant(e.target.value)} : x)})} />
                              <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>/mois</span>
                            </div>
                          ))}
                          {(poleSupport.exploitation||[]).length === 0 && <p className={`text-xs text-center py-3 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Aucune charge</p>}
                        </div>
                        {/* Recettes */}
                        <div className="mt-4">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className={`font-black text-sm flex items-center gap-1 ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}><Banknote size={16} className="text-green-500" /> Recettes</h4>
                            <button onClick={() => setPoleSupport({...poleSupport, recettes: [...(poleSupport.recettes||[]), { id: Date.now(), nom: 'Nouvelle recette', montant: 0 }]})} className="bg-green-500 text-white p-1 rounded-lg no-print"><Plus size={14} /></button>
                          </div>
                          <div className="space-y-2 max-h-[120px] overflow-y-auto">
                            {(poleSupport.recettes||[]).map(r => (
                              <div key={r.id} className={`p-2 rounded-xl border group relative flex items-center gap-2 ${darkMode ? 'bg-gray-600 border-gray-500' : 'bg-slate-50 border-slate-200'}`}>
                                <button onClick={() => setPoleSupport({...poleSupport, recettes: poleSupport.recettes.filter(x => x.id !== r.id)})} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 no-print"><Trash2 size={12} /></button>
                                <input className={`font-bold text-xs flex-1 outline-none bg-transparent ${darkMode ? 'text-white' : ''}`} value={r.nom} onChange={e => setPoleSupport({...poleSupport, recettes: poleSupport.recettes.map(x => x.id === r.id ? {...x, nom: e.target.value} : x)})} />
                                <input type="number" className={`w-24 text-right text-xs font-bold rounded px-2 py-1 ${darkMode ? 'bg-gray-500 text-white' : 'bg-white border'}`} value={r.montant} onChange={e => setPoleSupport({...poleSupport, recettes: poleSupport.recettes.map(x => x.id === r.id ? {...x, montant: validerMontant(e.target.value)} : x)})} />
                                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>/mois</span>
                              </div>
                            ))}
                            {(poleSupport.recettes||[]).length === 0 && <p className={`text-xs text-center py-2 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Aucune recette</p>}
                          </div>
                        </div>
                      </div>

                      {/* Répartition coût */}
                      <div className={`p-6 rounded-2xl shadow-lg ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                        <h3 className={`font-black flex items-center gap-2 mb-4 ${darkMode ? 'text-white' : 'text-slate-700'}`}><Layers size={20} className="text-cyan-500" /> Répartition du coût</h3>
                        {(() => {
                          const totalPct = services.reduce((sum, s) => sum + (poleSupport.repartition?.[String(s.id)] || 0), 0);
                          const totalPS = getBudgetPoleSupport().total;
                          return (
                            <div className="space-y-2">
                              {services.map(s => {
                                const pct = poleSupport.repartition?.[String(s.id)] || 0;
                                const montant = Math.round(totalPS * pct / 100);
                                return (
                                  <div key={s.id} className={`flex items-center gap-2 p-2 rounded-xl ${darkMode ? 'bg-gray-600' : 'bg-slate-50'}`}>
                                    <span className={`text-xs font-bold flex-1 truncate ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>{s.nom}</span>
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      className={`w-16 text-right text-xs font-bold rounded px-2 py-1 ${darkMode ? 'bg-gray-500 text-white' : 'bg-white border'}`}
                                      value={pct}
                                      onChange={e => setPoleSupport({...poleSupport, repartition: {...(poleSupport.repartition||{}), [String(s.id)]: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0))}})}
                                    />
                                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>%</span>
                                    <span className={`text-xs font-bold w-20 text-right ${darkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>{montant.toLocaleString()} €</span>
                                  </div>
                                );
                              })}
                              <div className={`flex items-center justify-between pt-2 mt-1 border-t text-xs font-black ${darkMode ? 'border-gray-600' : 'border-slate-200'}`}>
                                <span className={darkMode ? 'text-gray-300' : 'text-slate-600'}>Total</span>
                                <span className={totalPct === 100 ? 'text-green-600' : 'text-red-500'}>{totalPct}%</span>
                                <span className={darkMode ? 'text-cyan-300' : 'text-cyan-700'}>{Math.round(totalPS).toLocaleString()} €</span>
                              </div>
                              {totalPct !== 100 && totalPct > 0 && (
                                <div className="text-xs text-red-500 font-bold flex items-center gap-1">
                                  <AlertTriangle size={12} /> Le total doit être 100%
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                );
              }

              // ── SERVICE ─────────────────────────────────────────────────
              if (itemId !== 'direction' && itemId !== 'pole-support') {
                const service = services.find(s => s.id === itemId);
                if (!service) continue;
                const serviceIndex = services.indexOf(service);
            const bs = getBudgetService(service);
            const hasPromos = service.promos && Object.keys(service.promos).length > 0;
            const isPrestation = service.type === 'prestation';
            const stats = hasPromos ? calculerStatsFormation(service) : null;
            const totalRealisations = isPrestation ? calculerTotalRealisations(service.realisations) : 0;
            const accueilPublic = service.accueilPublic !== false;
            const sessionsSimulees = service.sessionsSimulees || [];
            const simOuverte = simulationsOuvertes.has(service.id);
            const isDragging = dragId === service.id;
            const isDragOver = dragOverId === service.id && !isDragging;

            // Tous les salariés de tous les sites Pilotage
            const tousSalariesPilotage = pilotageSites.flatMap(site =>
              site.salaries.map(s => ({ ...s, siteNom: site.nom, siteId: site.id }))
            );

            // Calcul résultat d'une session simulée
            const calcSession = (sess) => {
              const formateur = tousSalariesPilotage.find(s => s.id === sess.formateurId);
              if (!formateur) return { ca: 0, coutFormateur: 0, marge: 0 };
              const calc = calcSalarieFormateur(formateur);
              const coutFormateur = calc.coutHoraireFacture * (sess.nbHeures || 0);
              const ca = (sess.nbParticipants || 0) * (sess.prixParParticipant || 0);
              return { ca, coutFormateur, marge: ca - coutFormateur - (sess.fraisDeplacements || 0) - (sess.fraisSupports || 0) };
            };

            items.push(
              <div
                key={service.id}
                id={`service-${service.id}`}
                draggable
                onDragStart={() => setDragId(service.id)}
                onDragOver={(e) => { e.preventDefault(); setDragOverId(service.id); }}
                onDrop={() => handleUnifiedDrop(service.id)}
                onDragEnd={() => { setDragId(null); setDragOverId(null); }}
                className={`rounded-3xl shadow-lg border-2 p-8 print-avoid-break transition-all duration-150
                  ${isDragging ? 'opacity-40 scale-98' : ''}
                  ${isDragOver && !isDragging ? 'ring-2 ring-teal-400 ring-offset-2' : ''}
                  ${!accueilPublic ? (darkMode ? 'bg-gray-800 border-amber-700' : 'bg-amber-50 border-amber-300') : (darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-100')}`}
              >
                <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                  <div className="flex items-center gap-4 flex-wrap">
                    {/* Poignée de déplacement */}
                    <div className={`cursor-grab active:cursor-grabbing p-1 rounded ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-slate-300 hover:text-slate-500'} no-print`} title="Déplacer ce service">
                      <GripVertical size={22} />
                    </div>
                    {/* Boutons haut/bas */}
                    <div className="flex flex-col gap-0.5 no-print">
                      <button
                        disabled={serviceIndex === 0}
                        onClick={() => {
                          const arr = [...services]; arr.splice(serviceIndex - 1, 0, arr.splice(serviceIndex, 1)[0]);
                          setServices(arr);
                        }}
                        className={`p-0.5 rounded ${serviceIndex === 0 ? 'opacity-20 cursor-not-allowed' : 'hover:bg-slate-100'}`}
                      ><ChevronUp size={14} /></button>
                      <button
                        disabled={serviceIndex === services.length - 1}
                        onClick={() => {
                          const arr = [...services]; arr.splice(serviceIndex + 1, 0, arr.splice(serviceIndex, 1)[0]);
                          setServices(arr);
                        }}
                        className={`p-0.5 rounded ${serviceIndex === services.length - 1 ? 'opacity-20 cursor-not-allowed' : 'hover:bg-slate-100'}`}
                      ><ChevronDown size={14} /></button>
                    </div>
                    {isPrestation ? <Calendar className="text-orange-500" size={28} /> : hasPromos ? <GraduationCap className="text-purple-500" size={28} /> : <Settings className="text-teal-500" size={28} />}
                    <input className={`text-2xl font-black outline-none border-b-2 border-transparent focus:border-teal-500 bg-transparent ${darkMode ? 'text-white' : 'text-slate-800'}`} value={service.nom} onChange={(e) => setServices(services.map(s => s.id === service.id ? {...s, nom: e.target.value} : s))} />
                    {isPrestation && <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold uppercase">Prestation</span>}
                    {/* Badge accueil public */}
                    <button
                      onClick={() => setServices(services.map(s => s.id === service.id ? {...s, accueilPublic: !accueilPublic} : s))}
                      className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-colors no-print ${accueilPublic ? 'bg-teal-100 text-teal-700 hover:bg-teal-200' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}
                      title={accueilPublic ? "Cliquer pour marquer sans accueil public" : "Cliquer pour marquer avec accueil public"}
                    >
                      {accueilPublic ? <UserCheck size={14} /> : <UserX size={14} />}
                      {accueilPublic ? 'Accueil public' : 'Sans accueil public'}
                    </button>
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
                    {bs.salairesAllouesFI > 0 && (
                      <span className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 ${darkMode ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-100 text-amber-700'}`}>
                        <Zap size={12} /> dont -{Math.round(bs.salairesAllouesFI).toLocaleString()} € → FI
                      </span>
                    )}
                    {stats && (
                      <span className="bg-purple-100 text-purple-700 px-3 py-2 rounded-xl text-xs font-bold">
                        {stats.effectifActuel} étudiants ({stats.totalAbandons} abandons)
                      </span>
                    )}
                    {stats && stats.effectifActuel > 0 && (() => {
                      // Coût par étudiant = charges service / effectif actuel
                      const cout = Math.round(bs.total / stats.effectifActuel);
                      // Avec allocation direction (prorata ETP)
                      const etpTotal = [
                        ...direction.personnel.map(p => p.etp),
                        ...services.flatMap(s => s.personnel.map(p => p.etp))
                      ].reduce((a, b) => a + b, 0);
                      const etpService = service.personnel.reduce((s, p) => s + p.etp, 0);
                      const bdDir = getBudgetDirection();
                      const allocDir = etpTotal > 0 ? bdDir.total * (etpService / etpTotal) : 0;
                      const coutAvecDir = Math.round((bs.total + allocDir) / stats.effectifActuel);
                      return (
                        <span className={`px-3 py-2 rounded-xl text-xs font-bold ${darkMode ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`} title={`Sans direction : ${cout.toLocaleString()} €/étudiant — Avec allocation direction : ${coutAvecDir.toLocaleString()} €/étudiant`}>
                          ~{coutAvecDir.toLocaleString()} €/étudiant
                        </span>
                      );
                    })()}
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
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                      <h3 className={`text-lg font-black flex items-center gap-2 ${darkMode ? 'text-purple-400' : 'text-purple-700'}`}>
                        <GraduationCap size={22} /> Effectifs par site et promo
                      </h3>
                      {/* Ajouter un nouveau site */}
                      {Object.values(SITES).filter(s => !Object.keys(service.promos).includes(s)).length > 0 && (
                        <select
                          className={`text-xs rounded-lg px-3 py-1.5 font-bold border-2 border-dashed cursor-pointer no-print ${darkMode ? 'bg-gray-700 border-purple-700 text-purple-300' : 'bg-white border-purple-300 text-purple-600'}`}
                          defaultValue=""
                          onChange={e => {
                            if (!e.target.value) return;
                            const newSite = e.target.value;
                            setServices(services.map(s => s.id === service.id ? {
                              ...s,
                              promos: {
                                ...s.promos,
                                [newSite]: [{ id: `${newSite}-${Date.now()}`, nom: 'Nouvelle promo', effectifInitial: 20, abandons: makeAbandons() }]
                              }
                            } : s));
                            e.target.value = '';
                          }}
                        >
                          <option value="">+ Ajouter un site…</option>
                          {Object.values(SITES).filter(s => !Object.keys(service.promos).includes(s)).map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      )}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {Object.entries(service.promos).map(([site, promos]) => (
                        <div key={site} className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className={`font-black flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                              <MapPin size={18} className="text-purple-500" /> {site}
                            </h4>
                            <div className="flex items-center gap-2 no-print">
                              {/* Bouton ajouter promo */}
                              <button
                                onClick={() => setServices(services.map(s => s.id === service.id ? {
                                  ...s,
                                  promos: { ...s.promos, [site]: [...s.promos[site], { id: `${site}-${Date.now()}`, nom: 'Nouvelle promo', effectifInitial: 20, abandons: makeAbandons(), type: 'standard' }] }
                                } : s))}
                                className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${darkMode ? 'bg-purple-800 text-purple-200 hover:bg-purple-700' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}
                              ><Plus size={12} /> Promo</button>
                              {/* Bouton supprimer ce site */}
                              <button
                                onClick={() => {
                                  const newPromos = {...service.promos};
                                  delete newPromos[site];
                                  setServices(services.map(s => s.id === service.id ? { ...s, promos: Object.keys(newPromos).length > 0 ? newPromos : undefined } : s));
                                }}
                                className={`text-xs p-1 rounded-lg ${darkMode ? 'text-red-400 hover:bg-red-900/30' : 'text-red-400 hover:bg-red-50'}`}
                                title={`Supprimer le site ${site}`}
                              ><Trash2 size={12} /></button>
                            </div>
                          </div>
                          <div className="space-y-3">
                            {promos.map(promo => {
                              const effectifActuel = calculerEffectifActuel(promo);
                              const totalAbandons = Object.values(promo.abandons).reduce((sum, v) => sum + v, 0);
                              return (
                                <div key={promo.id} className={`p-3 rounded-lg border group/promo ${darkMode ? 'bg-gray-600 border-gray-500' : 'bg-slate-50 border-slate-200'}`}>
                                  <div className="flex justify-between items-center mb-2">
                                    {/* Nom éditable */}
                                    <input
                                      className={`font-bold text-sm bg-transparent outline-none border-b border-transparent focus:border-purple-400 w-28 ${darkMode ? 'text-white' : 'text-slate-700'}`}
                                      value={promo.nom}
                                      onChange={e => setServices(services.map(s => s.id !== service.id ? s : {
                                        ...s, promos: { ...s.promos, [site]: s.promos[site].map(p => p.id === promo.id ? {...p, nom: e.target.value} : p) }
                                      }))}
                                    />
                                    <div className="flex items-center gap-2">
                                      {/* Type de promo */}
                                      <select
                                        value={promo.type || 'standard'}
                                        onChange={e => {
                                          const newType = e.target.value;
                                          const ventilInit = newType === 'contrat_pro' && !promo.ventilationMensuelle
                                            ? Object.fromEntries(moisKeysFI.map(m => [m, {fc:100, fi:0}]))
                                            : promo.ventilationMensuelle;
                                          setServices(services.map(s => s.id !== service.id ? s : {
                                            ...s, promos: { ...s.promos, [site]: s.promos[site].map(p => p.id === promo.id ? {...p, type: newType, ...(newType === 'contrat_pro' ? {ventilationMensuelle: ventilInit} : {})} : p) }
                                          }));
                                        }}
                                        className={`text-xs rounded px-1 py-0.5 ${darkMode ? 'bg-gray-500 text-white border-gray-400' : 'bg-white border border-slate-300 text-slate-700'} no-print`}
                                      >
                                        <option value="standard">Standard</option>
                                        <option value="apprentissage">Apprentissage</option>
                                        <option value="contrat_pro">Contrat pro</option>
                                      </select>
                                      <span className={`text-xs px-2 py-0.5 rounded font-medium print-only ${
                                        (promo.type || 'standard') === 'apprentissage'
                                          ? (darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700')
                                          : (promo.type || 'standard') === 'contrat_pro'
                                            ? (darkMode ? 'bg-amber-900 text-amber-300' : 'bg-amber-100 text-amber-700')
                                            : (darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600')
                                      }`}>
                                        {(promo.type || 'standard') === 'apprentissage' ? 'Apprentissage' : (promo.type || 'standard') === 'contrat_pro' ? 'Contrat pro' : 'Standard'}
                                      </span>
                                      {/* Bouton supprimer promo */}
                                      <button
                                        onClick={() => setServices(services.map(s => s.id !== service.id ? s : {
                                          ...s, promos: { ...s.promos, [site]: s.promos[site].filter(p => p.id !== promo.id) }
                                        }))}
                                        className={`opacity-0 group-hover/promo:opacity-100 transition-opacity p-1 rounded ${darkMode ? 'text-red-400 hover:bg-red-900/30' : 'text-red-400 hover:bg-red-50'} no-print`}
                                        title="Supprimer cette promo"
                                      ><Trash2 size={12} /></button>
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
                                  {/* Dates de formation */}
                                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                                    <div className="flex items-center gap-1">
                                      <label className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Début:</label>
                                      <input
                                        type="date"
                                        className={`text-xs rounded px-2 py-1 font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-white border'}`}
                                        value={promo.dateDebut || ''}
                                        onChange={e => setServices(services.map(s => s.id !== service.id ? s : {
                                          ...s, promos: { ...s.promos, [site]: s.promos[site].map(p => p.id === promo.id ? {...p, dateDebut: e.target.value} : p) }
                                        }))}
                                      />
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <label className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Fin:</label>
                                      <input
                                        type="date"
                                        className={`text-xs rounded px-2 py-1 font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-white border'}`}
                                        value={promo.dateFin || ''}
                                        onChange={e => setServices(services.map(s => s.id !== service.id ? s : {
                                          ...s, promos: { ...s.promos, [site]: s.promos[site].map(p => p.id === promo.id ? {...p, dateFin: e.target.value} : p) }
                                        }))}
                                      />
                                    </div>
                                    {promo.dateDebut && promo.dateFin && (() => {
                                      const d1 = new Date(promo.dateDebut), d2 = new Date(promo.dateFin);
                                      if (d2 > d1) {
                                        const mois = Math.round((d2 - d1) / (1000*60*60*24*30.44));
                                        return <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${darkMode ? 'bg-indigo-900 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>{mois} mois</span>;
                                      }
                                      return null;
                                    })()}
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
                                  {/* Ventilation FC / FI — contrat pro uniquement */}
                                  {(promo.type === 'contrat_pro') && (() => {
                                    const ventil = promo.ventilationMensuelle || Object.fromEntries(moisKeysFI.map(m => [m, {fc:100, fi:0}]));
                                    return (
                                      <div className={`mt-3 p-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-blue-50 border-blue-200'}`}>
                                        <div className={`text-xs font-black mb-2 ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>Ventilation FC / FI (%)</div>
                                        <div className="grid grid-cols-6 gap-1">
                                          {moisKeysFI.map((mois, i) => {
                                            const v = ventil[mois] || {fc:100, fi:0};
                                            return (
                                              <div key={mois} className="text-center">
                                                <div className={`text-[10px] mb-0.5 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>{moisLabelsFI[i]}</div>
                                                <div className="flex flex-col gap-0.5">
                                                  <div className="flex items-center gap-0.5">
                                                    <span className={`text-[9px] ${darkMode ? 'text-teal-400' : 'text-teal-600'}`}>FC</span>
                                                    <input
                                                      type="number"
                                                      min="0" max="100"
                                                      className={`w-full text-center text-[10px] rounded px-0.5 py-0.5 font-bold ${darkMode ? 'bg-gray-600 text-white' : 'bg-white border'}`}
                                                      value={v.fc}
                                                      onChange={e => {
                                                        const fcVal = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                                                        const newVentil = {...ventil, [mois]: {fc: fcVal, fi: 100-fcVal}};
                                                        setServices(services.map(s => s.id !== service.id ? s : {
                                                          ...s, promos: {...s.promos, [site]: s.promos[site].map(p => p.id !== promo.id ? p : {...p, ventilationMensuelle: newVentil})}
                                                        }));
                                                      }}
                                                    />
                                                  </div>
                                                  <div className={`text-[10px] text-center font-bold ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>FI:{100-v.fc}%</div>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                        {(() => {
                                          const vals = moisKeysFI.map(m => (ventil[m] || {fc:100,fi:0}).fc);
                                          const moyFC = vals.reduce((a,b) => a+b, 0) / 12;
                                          return (
                                            <div className={`mt-2 flex justify-between text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                                              <span className={darkMode ? 'text-teal-400' : 'text-teal-700'}>Moy. FC : {moyFC.toFixed(1)}%</span>
                                              <span className={darkMode ? 'text-amber-300' : 'text-amber-700'}>Moy. FI : {(100-moyFC).toFixed(1)}%</span>
                                            </div>
                                          );
                                        })()}
                                      </div>
                                    );
                                  })()}
                                  {/* Courbe d'attrition */}
                                  {totalAbandons > 0 && (() => {
                                    const moisKeys = ['janvier','fevrier','mars','avril','mai','juin','juillet','aout','septembre','octobre','novembre','decembre'];
                                    const moisLbl  = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
                                    let cumulAbandons = 0;
                                    const attrData = moisKeys.map((m, i) => {
                                      cumulAbandons += (promo.abandons[m] || 0);
                                      return { mois: moisLbl[i], effectif: Math.max(0, promo.effectifInitial - cumulAbandons) };
                                    });
                                    const tauxRet = (attrData[11].effectif / promo.effectifInitial * 100).toFixed(0);
                                    return (
                                      <div className="mt-3">
                                        <div className={`flex justify-between text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                                          <span className="flex items-center gap-1"><TrendingDown size={11}/> Courbe d'attrition</span>
                                          <span className={parseInt(tauxRet) >= 90 ? 'text-green-500 font-bold' : parseInt(tauxRet) >= 75 ? 'text-amber-500 font-bold' : 'text-red-500 font-bold'}>Rétention : {tauxRet}%</span>
                                        </div>
                                        <ResponsiveContainer width="100%" height={60}>
                                          <AreaChart data={attrData} margin={{ top: 2, right: 2, bottom: 0, left: 0 }}>
                                            <defs><linearGradient id={`attr-${promo.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient></defs>
                                            <XAxis dataKey="mois" tick={{ fontSize: 8, fill: darkMode ? '#6b7280' : '#94a3b8' }} axisLine={false} tickLine={false} />
                                            <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1f2937':'#fff', border:'none', borderRadius:'8px', fontSize:10 }} formatter={v => [`${v} étudiants`]} />
                                            <Area type="monotone" dataKey="effectif" stroke="#8b5cf6" fill={`url(#attr-${promo.id})`} strokeWidth={2} dot={false} />
                                          </AreaChart>
                                        </ResponsiveContainer>
                                      </div>
                                    );
                                  })()}
                                </div>
                              );
                            })}
                          </div>
                          {/* Total par site + bouton ajouter promo bas */}
                          <button
                            onClick={() => setServices(services.map(s => s.id === service.id ? {
                              ...s,
                              promos: { ...s.promos, [site]: [...s.promos[site], { id: `${site}-${Date.now()}`, nom: 'Nouvelle promo', effectifInitial: 20, abandons: makeAbandons() }] }
                            } : s))}
                            className={`w-full mt-2 py-1.5 border-dashed border-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 no-print ${darkMode ? 'border-purple-700 text-purple-400 hover:bg-purple-900/20' : 'border-purple-200 text-purple-500 hover:bg-purple-50'}`}
                          ><Plus size={12} /> Ajouter une promo</button>
                          <div className={`mt-3 pt-3 border-t ${darkMode ? 'border-gray-600' : 'border-slate-200'} flex justify-between text-sm font-bold`}>
                            <span className={darkMode ? 'text-purple-400' : 'text-purple-600'}>Total {site}:</span>
                            <span className={darkMode ? 'text-white' : 'text-slate-800'}>
                              {promos.reduce((sum, p) => sum + calculerEffectifActuel(p), 0)} étudiants
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Synthèse par site */}
                    {Object.keys(service.promos).length > 1 && (() => {
                      const siteTotals = Object.entries(service.promos).map(([site, promos]) => {
                        const effectif = promos.reduce((sum, p) => sum + calculerEffectifActuel(p), 0);
                        const nbPromos = promos.length;
                        return { site, effectif, nbPromos };
                      });
                      const totalEff = siteTotals.reduce((s, t) => s + t.effectif, 0);
                      return (
                        <div className={`mt-4 p-3 rounded-xl ${darkMode ? 'bg-gray-700 border border-gray-600' : 'bg-white border border-purple-100'}`}>
                          <div className={`text-xs font-black uppercase mb-2 ${darkMode ? 'text-gray-400' : 'text-purple-500'}`}>Répartition par site</div>
                          <div className="flex flex-wrap gap-3">
                            {siteTotals.map(t => (
                              <div key={t.site} className={`flex-1 min-w-[120px] p-2 rounded-lg text-center ${darkMode ? 'bg-gray-600' : 'bg-purple-50'}`}>
                                <div className={`text-xs font-bold mb-1 ${darkMode ? 'text-gray-300' : 'text-purple-700'}`}>{t.site}</div>
                                <div className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>{t.effectif}</div>
                                <div className={`text-[10px] ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{t.nbPromos} promo{t.nbPromos > 1 ? 's' : ''} · {totalEff > 0 ? Math.round(t.effectif/totalEff*100) : 0}%</div>
                                {/* mini jauge */}
                                <div className={`mt-1 h-1.5 rounded-full ${darkMode ? 'bg-gray-500' : 'bg-purple-100'}`}>
                                  <div className="h-full rounded-full bg-purple-500" style={{ width: `${totalEff > 0 ? (t.effectif/totalEff*100) : 0}%` }} />
                                </div>
                              </div>
                            ))}
                            <div className={`flex-1 min-w-[120px] p-2 rounded-lg text-center ${darkMode ? 'bg-purple-900/40' : 'bg-purple-100'}`}>
                              <div className={`text-xs font-bold mb-1 ${darkMode ? 'text-purple-400' : 'text-purple-700'}`}>TOTAL</div>
                              <div className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>{totalEff}</div>
                              <div className={`text-[10px] ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{Object.values(service.promos).flat().length} promos</div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
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
                      {service.exploitation.map((item, expIdx) => (
                        <div key={item.id} className={`flex items-center gap-1 p-2 rounded-xl group relative ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
                          <button onClick={() => setServices(services.map(s => s.id === service.id ? {...s, exploitation: s.exploitation.filter(e => e.id !== item.id)} : s))} className="absolute -top-1 -left-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 no-print"><Trash2 size={14} /></button>
                          <div className="flex flex-col gap-0 no-print">
                            <button disabled={expIdx===0} onClick={() => { const a=[...service.exploitation]; a.splice(expIdx-1,0,a.splice(expIdx,1)[0]); setServices(services.map(s=>s.id===service.id?{...s,exploitation:a}:s)); }} className={`p-0.5 rounded ${expIdx===0?'opacity-20':'hover:bg-teal-100'}`}><ChevronUp size={10}/></button>
                            <button disabled={expIdx===service.exploitation.length-1} onClick={() => { const a=[...service.exploitation]; a.splice(expIdx+1,0,a.splice(expIdx,1)[0]); setServices(services.map(s=>s.id===service.id?{...s,exploitation:a}:s)); }} className={`p-0.5 rounded ${expIdx===service.exploitation.length-1?'opacity-20':'hover:bg-teal-100'}`}><ChevronDown size={10}/></button>
                          </div>
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
                      <button onClick={() => setServices(services.map(s => s.id === service.id ? {...s, personnel: [...s.personnel, { id: Date.now(), titre: 'Nouveau', etp: 1, salaire: 2500, segur: 0, typeContrat: 'CDI', rtt: false, dateFinContrat: '' }]} : s))} className="bg-slate-700 text-white p-1.5 rounded-lg no-print"><Plus size={16} /></button>
                    </div>
                    <div className="space-y-2 max-h-[350px] overflow-y-auto">
                      {service.personnel.map((p, pIdx) => (
                        <div key={p.id} className={`p-3 rounded-xl group relative ${darkMode ? 'bg-gray-600' : 'bg-white'} border ${darkMode ? 'border-gray-500' : 'border-teal-100'}`}>
                          <button onClick={() => setServices(services.map(s => s.id === service.id ? {...s, personnel: s.personnel.filter(x => x.id !== p.id)} : s))} className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 no-print"><Trash2 size={14} /></button>
                          <div className="flex items-center gap-1 mb-2">
                            <div className="flex flex-col gap-0 no-print">
                              <button disabled={pIdx===0} onClick={() => { const a=[...service.personnel]; a.splice(pIdx-1,0,a.splice(pIdx,1)[0]); setServices(services.map(s=>s.id===service.id?{...s,personnel:a}:s)); }} className={`p-0.5 rounded ${pIdx===0?'opacity-20':'hover:bg-slate-100'}`}><ChevronUp size={10}/></button>
                              <button disabled={pIdx===service.personnel.length-1} onClick={() => { const a=[...service.personnel]; a.splice(pIdx+1,0,a.splice(pIdx,1)[0]); setServices(services.map(s=>s.id===service.id?{...s,personnel:a}:s)); }} className={`p-0.5 rounded ${pIdx===service.personnel.length-1?'opacity-20':'hover:bg-slate-100'}`}><ChevronDown size={10}/></button>
                            </div>
                            <input className={`font-bold text-sm flex-1 outline-none bg-transparent ${darkMode ? 'text-white' : ''}`} value={p.titre} onChange={(e) => setServices(services.map(s => s.id === service.id ? {...s, personnel: s.personnel.map(x => x.id === p.id ? {...x, titre: e.target.value} : x)} : s))} />
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs mb-1">
                            <div><label className={darkMode ? 'text-gray-400' : 'text-slate-500'}>ETP</label><input type="number" step="0.1" className={`w-full rounded px-2 py-1 font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-teal-50'}`} value={p.etp} onChange={(e) => setServices(services.map(s => s.id === service.id ? {...s, personnel: s.personnel.map(x => x.id === p.id ? {...x, etp: validerETP(e.target.value)} : x)} : s))} /></div>
                            <div><label className={darkMode ? 'text-gray-400' : 'text-slate-500'}>Salaire</label><input type="number" className={`w-full rounded px-2 py-1 font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-teal-50'}`} value={p.salaire} onChange={(e) => setServices(services.map(s => s.id === service.id ? {...s, personnel: s.personnel.map(x => x.id === p.id ? {...x, salaire: validerSalaire(e.target.value)} : x)} : s))} /></div>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap text-xs mt-1">
                            <select className={`rounded px-2 py-1 text-xs ${darkMode ? 'bg-gray-500 text-white' : 'bg-teal-50 border'}`} value={p.role || 'formateur'} onChange={e => setServices(services.map(s => s.id === service.id ? {...s, personnel: s.personnel.map(x => x.id === p.id ? {...x, role: e.target.value} : x)} : s))}>
                              <option value="formateur">Formateur</option>
                              <option value="responsable">Resp. secteur</option>
                              <option value="directeur_adjoint">Directeur adjoint</option>
                              <option value="administratif">Administratif</option>
                              <option value="technique">Technique</option>
                              <option value="documentation">Documentation</option>
                              <option value="vacataire">Vacataire</option>
                            </select>
                            <label className="flex items-center gap-1"><input type="checkbox" checked={p.rqth || false} onChange={e => setServices(services.map(s => s.id === service.id ? {...s, personnel: s.personnel.map(x => x.id === p.id ? {...x, rqth: e.target.checked} : x)} : s))} /><span className={p.rqth ? 'text-amber-500 font-black' : (darkMode ? 'text-gray-400' : 'text-slate-500')}>RQTH</span></label>
                            <div className="flex items-center gap-1"><span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Ségur</span><input type="number" min="0" step="1" className={`w-16 text-xs text-right rounded px-1 py-0.5 ${darkMode ? 'bg-gray-600 text-white' : 'bg-slate-50 border'}`} value={p.segur === true ? 238 : (p.segur || 0)} onChange={(e) => setServices(services.map(s => s.id === service.id ? {...s, personnel: s.personnel.map(x => x.id === p.id ? {...x, segur: parseInt(e.target.value) || 0} : x)} : s))} /><span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>€/m</span></div>
                            <div className="flex items-center gap-1">
                              <span className={darkMode ? 'text-gray-400' : 'text-slate-500'}>Né(e) en</span>
                              <input type="number" min="1940" max="2005" placeholder="1980"
                                className={`w-16 rounded px-2 py-1 font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-teal-50 border'}`}
                                value={p.anneeNaissance || ''}
                                onChange={e => setServices(services.map(s => s.id === service.id ? {...s, personnel: s.personnel.map(x => x.id === p.id ? {...x, anneeNaissance: parseInt(e.target.value) || 0} : x)} : s))}
                              />
                            </div>
                            <select className={`rounded px-2 py-1 text-xs font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-teal-50 border'}`} value={p.typeContrat || 'CDI'} onChange={e => setServices(services.map(s => s.id === service.id ? {...s, personnel: s.personnel.map(x => x.id === p.id ? {...x, typeContrat: e.target.value, dateFinContrat: e.target.value === 'CDI' ? '' : x.dateFinContrat} : x)} : s))}>
                              <option value="CDI">CDI</option>
                              <option value="CDD">CDD</option>
                              <option value="Apprentissage">Apprentissage</option>
                              <option value="Stage">Stage</option>
                              <option value="Vacataire">Vacataire</option>
                              <option value="Autre">Autre</option>
                            </select>
                            <label className="flex items-center gap-1"><input type="checkbox" checked={p.rtt || false} onChange={e => setServices(services.map(s => s.id === service.id ? {...s, personnel: s.personnel.map(x => x.id === p.id ? {...x, rtt: e.target.checked} : x)} : s))} /><span className={p.rtt ? 'text-blue-500 font-black' : (darkMode ? 'text-gray-400' : 'text-slate-500')}>RTT</span></label>
                            {(p.typeContrat && p.typeContrat !== 'CDI') && (
                              <div className="flex items-center gap-1">
                                <span className={darkMode ? 'text-gray-400' : 'text-slate-500'}>Fin contrat</span>
                                <input type="date" className={`rounded px-2 py-0.5 text-xs ${darkMode ? 'bg-gray-500 text-white' : 'bg-teal-50 border'}`} value={p.dateFinContrat || ''} onChange={e => setServices(services.map(s => s.id === service.id ? {...s, personnel: s.personnel.map(x => x.id === p.id ? {...x, dateFinContrat: e.target.value} : x)} : s))} />
                              </div>
                            )}
                          </div>
                          {/* Absences */}
                          <details className="mt-1.5">
                            <summary className={`text-xs cursor-pointer select-none flex items-center gap-1 ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-slate-400 hover:text-slate-600'}`}>
                              <Calendar size={12} />
                              {(p.absences||[]).length > 0 ? `${(p.absences||[]).length} période(s)` : 'Congés / Arrêts'}
                            </summary>
                            <div className="mt-1.5 space-y-1 pl-1">
                              {(p.absences||[]).map(ab => (
                                <div key={ab.id} className={`flex flex-wrap items-center gap-1 text-xs rounded-lg px-2 py-1 ${ab.type==='conge'?(darkMode?'bg-blue-900/40 text-blue-300':'bg-blue-50 border border-blue-200'):ab.type==='maladie'?(darkMode?'bg-red-900/40 text-red-300':'bg-red-50 border border-red-200'):ab.type==='rtt'?(darkMode?'bg-purple-900/40 text-purple-300':'bg-purple-50 border border-purple-200'):(darkMode?'bg-orange-900/40 text-orange-300':'bg-orange-50 border border-orange-200')}`}>
                                  <select className="bg-transparent font-bold outline-none text-xs" value={ab.type} onChange={e => setServices(services.map(s => s.id===service.id?{...s,personnel:s.personnel.map(x=>x.id===p.id?{...x,absences:(x.absences||[]).map(a=>a.id===ab.id?{...a,type:e.target.value}:a)}:x)}:s))}>
                                    <option value="conge">Congé</option>
                                    <option value="maladie">Maladie</option>
                                    <option value="rtt">RTT</option>
                                    <option value="arret">Arrêt travail</option>
                                  </select>
                                  <input type="date" className="bg-transparent outline-none text-xs" value={ab.dateDebut||''} onChange={e => setServices(services.map(s => s.id===service.id?{...s,personnel:s.personnel.map(x=>x.id===p.id?{...x,absences:(x.absences||[]).map(a=>a.id===ab.id?{...a,dateDebut:e.target.value}:a)}:x)}:s))} />
                                  <span>→</span>
                                  <input type="date" className="bg-transparent outline-none text-xs" value={ab.dateFin||''} onChange={e => setServices(services.map(s => s.id===service.id?{...s,personnel:s.personnel.map(x=>x.id===p.id?{...x,absences:(x.absences||[]).map(a=>a.id===ab.id?{...a,dateFin:e.target.value}:a)}:x)}:s))} />
                                  <button onClick={() => setServices(services.map(s => s.id===service.id?{...s,personnel:s.personnel.map(x=>x.id===p.id?{...x,absences:(x.absences||[]).filter(a=>a.id!==ab.id)}:x)}:s))} className="ml-auto text-red-400 hover:text-red-600 no-print"><X size={12}/></button>
                                </div>
                              ))}
                              <button onClick={() => setServices(services.map(s => s.id===service.id?{...s,personnel:s.personnel.map(x=>x.id===p.id?{...x,absences:[...(x.absences||[]),{id:Date.now(),type:'conge',dateDebut:'',dateFin:''}]}:x)}:s))} className={`text-xs flex items-center gap-1 px-2 py-0.5 rounded border border-dashed no-print ${darkMode?'border-gray-500 text-gray-400 hover:text-gray-200':'border-slate-300 text-slate-400 hover:text-slate-600'}`}>
                                <Plus size={10}/> Ajouter
                              </button>
                            </div>
                          </details>
                          <div className="flex items-center gap-2 flex-wrap text-xs mt-1">
                            {/* Bouton toggle FI% */}
                            <button
                              onClick={() => {
                                const key = `${service.id}-${p.id}`;
                                const next = new Set(fiPanelsOuverts);
                                if (next.has(key)) next.delete(key); else next.add(key);
                                setFiPanelsOuverts(next);
                              }}
                              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold no-print transition-colors ${fiPanelsOuverts.has(`${service.id}-${p.id}`) ? (darkMode ? 'bg-amber-700 text-amber-100' : 'bg-amber-200 text-amber-800') : (darkMode ? 'bg-gray-600 text-gray-300 hover:bg-amber-800/50 hover:text-amber-200' : 'bg-slate-100 text-slate-500 hover:bg-amber-100 hover:text-amber-700')}`}
                              title="Répartition mensuelle du salaire en Formation Initiale (FI%)"
                            >
                              <Zap size={11} /> FI%
                            </button>
                          </div>
                          {/* Panel répartition FI mensuelle */}
                          {fiPanelsOuverts.has(`${service.id}-${p.id}`) && (() => {
                            const rfi = p.repartitionFI || makeRepartitionFI();
                            const pctMoyen = moisKeysFI.reduce((s, m) => s + (rfi[m] || 0), 0) / 12;
                            const sal = calculerSalaireAnnuel(p.salaire, p.etp, p.segur);
                            const montantFI = Math.round(sal.total * pctMoyen / 100);
                            return (
                              <div className={`mt-2 p-3 rounded-lg border no-print ${darkMode ? 'bg-amber-900/20 border-amber-700' : 'bg-amber-50 border-amber-200'}`}>
                                <div className={`text-xs font-black mb-2 ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>Répartition mensuelle en FI (%)</div>
                                <div className="grid grid-cols-6 gap-1 mb-2">
                                  {moisKeysFI.map((mois, i) => (
                                    <div key={mois} className="text-center">
                                      <div className={`text-[10px] mb-0.5 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>{moisLabelsFI[i]}</div>
                                      <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        className={`w-full text-center text-xs rounded px-0.5 py-0.5 font-bold ${(rfi[mois] || 0) > 0 ? (darkMode ? 'bg-amber-800 text-amber-100' : 'bg-amber-100 text-amber-800') : (darkMode ? 'bg-gray-600 text-white' : 'bg-white border')}`}
                                        value={rfi[mois] || 0}
                                        onChange={e => {
                                          const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                                          setServices(services.map(s => s.id !== service.id ? s : {
                                            ...s,
                                            personnel: s.personnel.map(p2 => p2.id !== p.id ? p2 : {
                                              ...p2,
                                              repartitionFI: { ...(p2.repartitionFI || makeRepartitionFI()), [mois]: val }
                                            })
                                          }));
                                        }}
                                      />
                                    </div>
                                  ))}
                                </div>
                                <div className={`flex justify-between text-xs ${darkMode ? 'text-amber-400' : 'text-amber-700'}`}>
                                  <span>Moy. annuelle : <strong>{pctMoyen.toFixed(1)}%</strong></span>
                                  <span>Montant alloué FI : <strong>{montantFI.toLocaleString()} €/an</strong></span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      ))}
                    </div>
                    <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-600' : 'border-teal-200'} flex justify-between font-bold`}>
                      <span className={darkMode ? 'text-gray-300' : 'text-slate-700'}>Masse salariale:</span>
                      <span className={darkMode ? 'text-white' : 'text-slate-800'}>{Math.round(bs.salaires).toLocaleString()} €</span>
                    </div>
                    {bs.salairesAllouesFI > 0 && (
                      <div className={`mt-1 flex justify-between text-xs font-bold ${darkMode ? 'text-amber-400' : 'text-amber-700'}`}>
                        <span className="flex items-center gap-1"><Zap size={11} /> dont alloué FI:</span>
                        <span>{Math.round(bs.salairesAllouesFI).toLocaleString()} €</span>
                      </div>
                    )}
                  </div>

                  {/* Recettes */}
                  <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-gray-700 border-green-800' : 'bg-green-50 border-green-200'}`}>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className={`text-sm font-black uppercase flex items-center gap-2 ${darkMode ? 'text-green-400' : 'text-green-700'}`}><Banknote size={18} /> Recettes</h3>
                      <button onClick={() => setServices(services.map(s => s.id === service.id ? {...s, recettes: [...(s.recettes || []), { id: Date.now(), nom: 'Nouvelle recette', montant: 0 }]} : s))} className="bg-green-600 text-white p-1.5 rounded-lg no-print"><Plus size={16} /></button>
                    </div>
                    <div className="space-y-2 max-h-[350px] overflow-y-auto">
                      {(service.recettes || []).map((item, recIdx) => (
                        <div key={item.id} className={`flex items-center gap-1 p-2 rounded-xl group relative ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
                          <button onClick={() => setServices(services.map(s => s.id === service.id ? {...s, recettes: s.recettes.filter(r => r.id !== item.id)} : s))} className="absolute -top-1 -left-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 no-print"><Trash2 size={14} /></button>
                          <div className="flex flex-col gap-0 no-print">
                            <button disabled={recIdx===0} onClick={() => { const a=[...(service.recettes||[])]; a.splice(recIdx-1,0,a.splice(recIdx,1)[0]); setServices(services.map(s=>s.id===service.id?{...s,recettes:a}:s)); }} className={`p-0.5 rounded ${recIdx===0?'opacity-20':'hover:bg-green-100'}`}><ChevronUp size={10}/></button>
                            <button disabled={recIdx===(service.recettes||[]).length-1} onClick={() => { const a=[...(service.recettes||[])]; a.splice(recIdx+1,0,a.splice(recIdx,1)[0]); setServices(services.map(s=>s.id===service.id?{...s,recettes:a}:s)); }} className={`p-0.5 rounded ${recIdx===(service.recettes||[]).length-1?'opacity-20':'hover:bg-green-100'}`}><ChevronDown size={10}/></button>
                          </div>
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

                    {/* Seuil de rentabilité */}
                    {(() => {
                      const srvStats = hasPromos ? calculerStatsFormation(service) : null;
                      const effectif = srvStats ? srvStats.effectifActuel : (service.unites || 0);
                      if (!effectif || effectif === 0 || bs.recettes === 0) return null;
                      const recParEtudiant = bs.recettes / effectif;
                      const seuil = recParEtudiant > 0 ? Math.ceil(bs.total / recParEtudiant) : null;
                      if (!seuil) return null;
                      const couvert = effectif >= seuil;
                      const pct = Math.min(100, Math.round((effectif / seuil) * 100));
                      return (
                        <div className={`mt-2 p-3 rounded-xl border ${couvert ? (darkMode ? 'bg-teal-900/20 border-teal-700' : 'bg-teal-50 border-teal-200') : (darkMode ? 'bg-amber-900/20 border-amber-700' : 'bg-amber-50 border-amber-200')}`}>
                          <div className="flex items-center gap-1 mb-2">
                            <Target size={13} className={couvert ? 'text-teal-500' : 'text-amber-500'} />
                            <span className={`text-xs font-black ${couvert ? (darkMode ? 'text-teal-300' : 'text-teal-700') : (darkMode ? 'text-amber-300' : 'text-amber-700')}`}>Seuil de rentabilité</span>
                          </div>
                          <div className={`flex justify-between text-xs mb-1.5 ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>
                            <span>Effectif : <strong>{effectif}</strong></span>
                            <span>Seuil : <strong>{seuil}</strong></span>
                            <span className={couvert ? 'text-teal-500 font-bold' : 'text-amber-500 font-bold'}>{pct}% couvert</span>
                          </div>
                          <div className={`w-full h-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-slate-200'} overflow-hidden`}>
                            <div className={`h-full rounded-full ${couvert ? 'bg-teal-500' : 'bg-amber-400'}`} style={{ width: `${pct}%` }} />
                          </div>
                          {!couvert && <div className={`text-xs mt-1 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>Manque {seuil - effectif} étudiant{seuil - effectif > 1 ? 's' : ''} pour atteindre l'équilibre</div>}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* PANEL SIMULATION SESSIONS */}
                <div className={`mt-6 rounded-2xl border-2 overflow-hidden no-print ${darkMode ? 'border-indigo-800' : 'border-indigo-200'}`}>
                  <button
                    onClick={() => {
                      const next = new Set(simulationsOuvertes);
                      if (next.has(service.id)) next.delete(service.id); else next.add(service.id);
                      setSimulationsOuvertes(next);
                    }}
                    className={`w-full flex items-center justify-between px-5 py-3 font-black text-sm ${darkMode ? 'bg-indigo-900/40 text-indigo-300 hover:bg-indigo-900/60' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}
                  >
                    <span className="flex items-center gap-2">
                      <Calculator size={16} />
                      Simuler des sessions de formation
                      {sessionsSimulees.length > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-xs ${darkMode ? 'bg-indigo-700 text-indigo-200' : 'bg-indigo-200 text-indigo-800'}`}>
                          {sessionsSimulees.length} session{sessionsSimulees.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </span>
                    {simOuverte ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {simOuverte && (
                    <div className={`p-5 ${darkMode ? 'bg-indigo-900/20' : 'bg-indigo-50/50'}`}>
                      {tousSalariesPilotage.length === 0 ? (
                        <p className={`text-sm text-center py-4 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                          Aucun formateur dans le Pilotage Financier. Ajoutez des formateurs/vacataires dans la section ci-dessous.
                        </p>
                      ) : (
                        <>
                          {/* Liste sessions simulées */}
                          <div className="space-y-3 mb-4">
                            {sessionsSimulees.map((sess, sessIdx) => {
                              const res = calcSession(sess);
                              const formateur = tousSalariesPilotage.find(s => s.id === sess.formateurId);
                              return (
                                <div key={sess.id} className={`p-4 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-indigo-100'}`}>
                                  <div className="flex items-start gap-3 flex-wrap">
                                    {/* Grip pour réordonner */}
                                    <div className="flex flex-col gap-0.5 pt-1">
                                      <button
                                        disabled={sessIdx === 0}
                                        onClick={() => {
                                          const arr = [...sessionsSimulees]; arr.splice(sessIdx - 1, 0, arr.splice(sessIdx, 1)[0]);
                                          setServices(services.map(s => s.id === service.id ? {...s, sessionsSimulees: arr} : s));
                                        }}
                                        className={`p-0.5 rounded ${sessIdx === 0 ? 'opacity-20' : 'hover:bg-indigo-100'}`}
                                      ><ChevronUp size={12} /></button>
                                      <button
                                        disabled={sessIdx === sessionsSimulees.length - 1}
                                        onClick={() => {
                                          const arr = [...sessionsSimulees]; arr.splice(sessIdx + 1, 0, arr.splice(sessIdx, 1)[0]);
                                          setServices(services.map(s => s.id === service.id ? {...s, sessionsSimulees: arr} : s));
                                        }}
                                        className={`p-0.5 rounded ${sessIdx === sessionsSimulees.length - 1 ? 'opacity-20' : 'hover:bg-indigo-100'}`}
                                      ><ChevronDown size={12} /></button>
                                    </div>

                                    {/* Nom session */}
                                    <div className="flex-1 min-w-[120px]">
                                      <label className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Nom</label>
                                      <input
                                        className={`w-full font-bold text-sm rounded px-2 py-1 ${darkMode ? 'bg-gray-600 text-white' : 'bg-indigo-50'}`}
                                        value={sess.nom}
                                        onChange={e => setServices(services.map(s => s.id === service.id ? {...s, sessionsSimulees: s.sessionsSimulees.map(ss => ss.id === sess.id ? {...ss, nom: e.target.value} : ss)} : s))}
                                      />
                                    </div>

                                    {/* Formateur */}
                                    <div className="flex-1 min-w-[160px]">
                                      <label className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Formateur / Vacataire</label>
                                      <select
                                        className={`w-full text-sm rounded px-2 py-1 font-bold ${darkMode ? 'bg-gray-600 text-white' : 'bg-indigo-50'}`}
                                        value={sess.formateurId || ''}
                                        onChange={e => setServices(services.map(s => s.id === service.id ? {...s, sessionsSimulees: s.sessionsSimulees.map(ss => ss.id === sess.id ? {...ss, formateurId: parseInt(e.target.value) || e.target.value} : ss)} : s))}
                                      >
                                        <option value="">— Choisir —</option>
                                        {pilotageSites.map(site => (
                                          <optgroup key={site.id} label={site.nom}>
                                            {site.salaries.map(sal => {
                                              const c = calcSalarieFormateur(sal);
                                              return (
                                                <option key={sal.id} value={sal.id}>
                                                  {sal.nom} ({sal.type === 'vacataire' ? `${sal.tauxHoraire}€/h` : `${Math.round(c.coutHoraireFacture)}€/h facturé`})
                                                </option>
                                              );
                                            })}
                                          </optgroup>
                                        ))}
                                      </select>
                                    </div>

                                    {/* Heures */}
                                    <div className="w-16">
                                      <label className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Heures</label>
                                      <input type="number" min="0"
                                        className={`w-full text-sm rounded px-2 py-1 font-bold text-center ${darkMode ? 'bg-gray-600 text-white' : 'bg-indigo-50'}`}
                                        value={sess.nbHeures}
                                        onChange={e => setServices(services.map(s => s.id === service.id ? {...s, sessionsSimulees: s.sessionsSimulees.map(ss => ss.id === sess.id ? {...ss, nbHeures: Math.max(0, parseFloat(e.target.value) || 0)} : ss)} : s))}
                                      />
                                    </div>

                                    {/* Participants */}
                                    <div className="w-20">
                                      <label className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Participants</label>
                                      <input type="number" min="0"
                                        className={`w-full text-sm rounded px-2 py-1 font-bold text-center ${darkMode ? 'bg-gray-600 text-white' : 'bg-indigo-50'}`}
                                        value={sess.nbParticipants}
                                        onChange={e => setServices(services.map(s => s.id === service.id ? {...s, sessionsSimulees: s.sessionsSimulees.map(ss => ss.id === sess.id ? {...ss, nbParticipants: Math.max(0, parseInt(e.target.value) || 0)} : ss)} : s))}
                                      />
                                    </div>

                                    {/* Prix/participant */}
                                    <div className="w-24">
                                      <label className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Prix/part. €</label>
                                      <input type="number" min="0"
                                        className={`w-full text-sm rounded px-2 py-1 font-bold text-center ${darkMode ? 'bg-gray-600 text-white' : 'bg-indigo-50'}`}
                                        value={sess.prixParParticipant}
                                        onChange={e => setServices(services.map(s => s.id === service.id ? {...s, sessionsSimulees: s.sessionsSimulees.map(ss => ss.id === sess.id ? {...ss, prixParParticipant: Math.max(0, parseFloat(e.target.value) || 0)} : ss)} : s))}
                                      />
                                    </div>

                                    {/* Frais déplacements */}
                                    <div className="w-20">
                                      <label className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Dépl. €</label>
                                      <input type="number" min="0"
                                        className={`w-full text-sm rounded px-2 py-1 font-bold text-center ${darkMode ? 'bg-gray-600 text-white' : 'bg-indigo-50'}`}
                                        value={sess.fraisDeplacements}
                                        onChange={e => setServices(services.map(s => s.id === service.id ? {...s, sessionsSimulees: s.sessionsSimulees.map(ss => ss.id === sess.id ? {...ss, fraisDeplacements: Math.max(0, parseFloat(e.target.value) || 0)} : ss)} : s))}
                                      />
                                    </div>

                                    {/* Supprimer */}
                                    <button
                                      onClick={() => setServices(services.map(s => s.id === service.id ? {...s, sessionsSimulees: s.sessionsSimulees.filter(ss => ss.id !== sess.id)} : s))}
                                      className="mt-4 p-1.5 text-red-400 hover:bg-red-50 rounded-lg"
                                    ><Trash2 size={16} /></button>
                                  </div>

                                  {/* Résultats session */}
                                  {formateur && (
                                    <div className={`mt-3 grid grid-cols-3 gap-2 text-xs pt-3 border-t ${darkMode ? 'border-gray-600' : 'border-indigo-100'}`}>
                                      <div className={`p-2 rounded-lg ${darkMode ? 'bg-green-900/30' : 'bg-green-50'}`}>
                                        <div className={darkMode ? 'text-green-400' : 'text-green-600'}>CA</div>
                                        <div className={`font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>{Math.round(res.ca).toLocaleString()} €</div>
                                      </div>
                                      <div className={`p-2 rounded-lg ${darkMode ? 'bg-red-900/30' : 'bg-red-50'}`}>
                                        <div className={darkMode ? 'text-red-400' : 'text-red-600'}>Coût formateur</div>
                                        <div className={`font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>{Math.round(res.coutFormateur).toLocaleString()} €</div>
                                      </div>
                                      <div className={`p-2 rounded-lg ${res.marge >= 0 ? (darkMode ? 'bg-emerald-900/30' : 'bg-emerald-50') : (darkMode ? 'bg-orange-900/30' : 'bg-orange-50')}`}>
                                        <div className={res.marge >= 0 ? (darkMode ? 'text-emerald-400' : 'text-emerald-600') : (darkMode ? 'text-orange-400' : 'text-orange-600')}>Marge</div>
                                        <div className={`font-black ${res.marge >= 0 ? (darkMode ? 'text-emerald-300' : 'text-emerald-700') : (darkMode ? 'text-orange-300' : 'text-orange-700')}`}>
                                          {res.marge >= 0 ? '+' : ''}{Math.round(res.marge).toLocaleString()} €
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Bouton ajouter session */}
                          <button
                            onClick={() => {
                              const defFormateur = tousSalariesPilotage[0];
                              setServices(services.map(s => s.id === service.id ? {...s, sessionsSimulees: [...(s.sessionsSimulees || []), {
                                id: Date.now(),
                                nom: `Session ${(s.sessionsSimulees || []).length + 1}`,
                                formateurId: defFormateur?.id || null,
                                nbHeures: 7,
                                nbParticipants: 10,
                                prixParParticipant: 0,
                                fraisDeplacements: 0,
                                fraisSupports: 0
                              }]} : s));
                            }}
                            className={`w-full py-2 border-2 border-dashed rounded-xl text-sm font-bold flex items-center justify-center gap-2 mb-4 ${darkMode ? 'border-indigo-700 text-indigo-400 hover:bg-indigo-900/20' : 'border-indigo-300 text-indigo-500 hover:bg-indigo-50'}`}
                          >
                            <Plus size={16} /> Ajouter une session
                          </button>

                          {/* Totaux simulation */}
                          {sessionsSimulees.length > 0 && (() => {
                            const totCA    = sessionsSimulees.reduce((sum, s) => sum + calcSession(s).ca, 0);
                            const totCout  = sessionsSimulees.reduce((sum, s) => sum + calcSession(s).coutFormateur + (s.fraisDeplacements || 0), 0);
                            const totMarge = totCA - totCout;
                            return (
                              <div className={`grid grid-cols-4 gap-3 p-4 rounded-xl ${darkMode ? 'bg-indigo-900/30' : 'bg-indigo-100'}`}>
                                <div className="text-center">
                                  <div className={`text-xs font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>CA total simulé</div>
                                  <div className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>{Math.round(totCA).toLocaleString()} €</div>
                                </div>
                                <div className="text-center">
                                  <div className={`text-xs font-bold ${darkMode ? 'text-red-400' : 'text-red-600'}`}>Coût total</div>
                                  <div className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>{Math.round(totCout).toLocaleString()} €</div>
                                </div>
                                <div className="text-center">
                                  <div className={`text-xs font-bold ${totMarge >= 0 ? (darkMode ? 'text-emerald-400' : 'text-emerald-600') : (darkMode ? 'text-orange-400' : 'text-orange-600')}`}>Marge totale</div>
                                  <div className={`text-lg font-black ${totMarge >= 0 ? (darkMode ? 'text-emerald-300' : 'text-emerald-700') : (darkMode ? 'text-orange-300' : 'text-orange-700')}`}>
                                    {totMarge >= 0 ? '+' : ''}{Math.round(totMarge).toLocaleString()} €
                                  </div>
                                </div>
                                {(() => {
                                  const totalPart = sessionsSimulees.reduce((sum, s) => sum + (s.nbParticipants || 0), 0);
                                  if (totalPart === 0) return null;
                                  const coutParPart = Math.round(totCout / totalPart);
                                  const caParPart = Math.round(totCA / totalPart);
                                  return (
                                    <div className="text-center">
                                      <div className={`text-xs font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>Coût / participant</div>
                                      <div className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>{coutParPart.toLocaleString()} €</div>
                                      <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>CA: {caParPart.toLocaleString()} €/part.</div>
                                    </div>
                                  );
                                })()}
                              </div>
                            );
                          })()}
                        </>
                      )}
                    </div>
                  )}
                </div>

              </div>
            );
              }  // end if service block
            }  // end for loop
            return items;
          })()}
        </div>

        {/* ═══════════════════════════════════════════════════════
            PILOTAGE MASSE SALARIALE — TOUS SALARIÉS
            ═══════════════════════════════════════════════════════ */}
        {(() => {
          const tousP = [
            ...direction.personnel.map(p => ({ ...p, source: 'Direction', couleur: 'slate' })),
            ...poleSupport.personnel.map(p => ({ ...p, source: 'Pôle Support', couleur: 'cyan' })),
            ...services.flatMap(s => s.personnel.map(p => ({ ...p, source: s.nom, couleur: 'teal' }))),
          ];
          const total = tousP.reduce((acc, p) => {
            const s = calculerSalaireAnnuel(p.salaire, p.etp, p.segur);
            return acc + s.total;
          }, 0);
          const ROLES_COLOR = {
            direction: 'violet', formateur: 'teal', administratif: 'blue',
            technique: 'orange', documentation: 'amber', autre: 'slate',
          };
          const roleLabel = { direction: 'Direction', formateur: 'Formateur', administratif: 'Administratif', technique: 'Technique', documentation: 'Documentation', autre: 'Autre' };
          // Regroupement par rôle pour mini-graphe
          const parRole = {};
          tousP.forEach(p => {
            const r = p.role || 'autre';
            const s = calculerSalaireAnnuel(p.salaire, p.etp, p.segur);
            parRole[r] = (parRole[r] || 0) + s.total;
          });

          return (
            <div id="masse-salariale" className={`rounded-3xl shadow-lg border-2 p-6 mb-8 print-avoid-break ${darkMode ? 'bg-gray-800 border-teal-900' : 'bg-gradient-to-br from-slate-50 to-teal-50 border-teal-200'}`}>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                <div className="flex items-center gap-3">
                  <Users className={darkMode ? 'text-teal-400' : 'text-teal-600'} size={28} />
                  <div>
                    <h2 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>Pilotage Masse Salariale</h2>
                    <span className={`text-xs font-bold ${darkMode ? 'text-teal-400' : 'text-teal-600'}`}>{tousP.length} agents · {tousP.reduce((s, p) => s + p.etp, 0).toFixed(1)} ETP total</span>
                  </div>
                </div>
                <div className={`text-right`}>
                  <div className={`text-xs font-bold mb-0.5 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Masse salariale totale</div>
                  <div className={`text-2xl font-black ${darkMode ? 'text-teal-300' : 'text-teal-700'}`}>{Math.round(total).toLocaleString()} €/an</div>
                </div>
              </div>

              {/* Répartition par rôle */}
              <div className="flex flex-wrap gap-2 mb-4">
                {Object.entries(parRole).sort((a, b) => b[1] - a[1]).map(([role, montant]) => {
                  const pct = total > 0 ? Math.round(montant / total * 100) : 0;
                  const c = ROLES_COLOR[role] || 'slate';
                  return (
                    <div key={role} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${darkMode ? `bg-${c}-900/40 text-${c}-300` : `bg-${c}-100 text-${c}-700`}`}>
                      {roleLabel[role] || role} · {pct}% · {Math.round(montant/1000)}k€
                    </div>
                  );
                })}
              </div>

              {/* Barre de décomposition */}
              <div className="flex rounded-full overflow-hidden h-3 mb-5">
                {Object.entries(parRole).sort((a, b) => b[1] - a[1]).map(([role, montant]) => {
                  const pct = total > 0 ? (montant / total) * 100 : 0;
                  const colors = { direction: '#8b5cf6', formateur: '#14b8a6', administratif: '#3b82f6', technique: '#f97316', documentation: '#f59e0b', autre: '#94a3b8' };
                  return <div key={role} style={{ width: `${pct}%`, background: colors[role] || '#94a3b8' }} title={`${roleLabel[role]||role}: ${Math.round(montant).toLocaleString()} €`} />;
                })}
              </div>

              {/* Tableau détaillé */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className={`${darkMode ? 'text-gray-400' : 'text-slate-500'} uppercase font-black`}>
                      <th className="text-left pb-2 pl-1">Agent</th>
                      <th className="text-left pb-2">Service</th>
                      <th className="text-left pb-2">Rôle</th>
                      <th className="text-right pb-2">ETP</th>
                      <th className="text-right pb-2">Sal. brut/mois</th>
                      <th className="text-right pb-2">Ségur</th>
                      <th className="text-right pb-2">Charges</th>
                      <th className="text-right pb-2 pr-1">Coût total/an</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tousP.map((p, idx) => {
                      const s = calculerSalaireAnnuel(p.salaire, p.etp, p.segur);
                      const isDir = p.source === 'Direction';
                      return (
                        <tr key={idx} className={`border-t ${darkMode ? 'border-gray-700' : 'border-slate-100'} ${isDir ? (darkMode ? 'bg-violet-900/10' : 'bg-violet-50/50') : ''}`}>
                          <td className={`py-1.5 pl-1 font-bold ${darkMode ? 'text-white' : 'text-slate-800'} max-w-[180px] truncate`} title={p.titre}>{p.titre}</td>
                          <td className={`py-1.5 text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'} max-w-[120px] truncate`} title={p.source}>{p.source}</td>
                          <td className="py-1.5">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-slate-100 text-slate-600'}`}>
                              {roleLabel[p.role] || p.role || '—'}
                            </span>
                            {p.rqth && <span className={`ml-1 px-1 py-0.5 rounded text-[10px] font-bold ${darkMode ? 'bg-orange-900/50 text-orange-400' : 'bg-orange-100 text-orange-700'}`}>RQTH</span>}
                          </td>
                          <td className={`py-1.5 text-right ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>{p.etp}</td>
                          <td className={`py-1.5 text-right ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>{p.salaire.toLocaleString()} €</td>
                          <td className={`py-1.5 text-right ${s.segur > 0 ? (darkMode ? 'text-blue-400' : 'text-blue-600') : (darkMode ? 'text-gray-600' : 'text-slate-300')}`}>
                            {s.segur > 0 ? `+${Math.round(s.segur/12).toLocaleString()} €/m` : '—'}
                          </td>
                          <td className={`py-1.5 text-right ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{Math.round(s.charges).toLocaleString()} €</td>
                          <td className={`py-1.5 text-right pr-1 font-black ${darkMode ? 'text-teal-300' : 'text-teal-700'}`}>{Math.round(s.total).toLocaleString()} €</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className={`border-t-2 font-black ${darkMode ? 'border-teal-700 bg-teal-900/20' : 'border-teal-300 bg-teal-50'}`}>
                      <td colSpan={3} className={`py-2 pl-1 text-sm ${darkMode ? 'text-white' : 'text-slate-800'}`}>TOTAL</td>
                      <td className={`py-2 text-right text-sm ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>{tousP.reduce((s, p) => s + p.etp, 0).toFixed(1)}</td>
                      <td colSpan={3} />
                      <td className={`py-2 text-right pr-1 text-base ${darkMode ? 'text-teal-200' : 'text-teal-800'}`}>{Math.round(total).toLocaleString()} €</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          );
        })()}

        {/* ═══════════════════════════════════════════════════════
            SYNTHÈSE ANALYTIQUE — TABLEAU CROISÉ SERVICES × POSTES
            ═══════════════════════════════════════════════════════ */}
        {(() => {
          const bdDir = getBudgetDirection();
          const bdPS = getBudgetPoleSupport();
          const rows = [
            {
              nom: '📋 Direction / Siège',
              personnel: bdDir.salaires,
              exploitation: bdDir.chargesSiege,
              recettes: 0,
              isDirection: true,
            },
            {
              nom: '🔧 Pôle Support',
              personnel: bdPS.salaires,
              exploitation: bdPS.exploitation,
              recettes: bdPS.recettes,
              isDirection: true,
            },
            ...services.map(s => {
              const bd = getBudgetService(s);
              return {
                nom: s.nom,
                serviceId: s.id,
                personnel: bd.salaires,
                exploitation: bd.exploitation,
                recettes: bd.recettes,
                isDirection: false,
              };
            }),
          ];
          const totPerso  = rows.reduce((s, r) => s + r.personnel, 0);
          const totExpl   = rows.reduce((s, r) => s + r.exploitation, 0);
          const totRec    = rows.reduce((s, r) => s + r.recettes, 0);
          const totCharges = totPerso + totExpl;
          const totResult = totRec - totCharges;

          const fmt = (n) => Math.round(n).toLocaleString('fr-FR');
          const col = `px-3 py-2 text-right text-sm font-bold`;
          const colH = `px-3 py-2 text-right text-xs font-black uppercase`;

          const getN1Row = (r) => {
            if (!donneesN1) return null;
            const nomLow = r.nom.toLowerCase();
            if (nomLow.includes('direction') || nomLow.includes('siège') || nomLow.includes('siege')) return donneesN1.direction;
            if (nomLow.includes('support') || nomLow.includes('pôle')) return donneesN1.poleSupport;
            return (donneesN1.services || []).find(s => s.nom && r.nom.toLowerCase().includes(s.nom.toLowerCase().slice(0, 5)));
          };
          const evolPct = (current, n1) => {
            if (n1 === null || n1 === undefined || Math.abs(n1) < 1) return null;
            return ((current - n1) / Math.abs(n1) * 100).toFixed(1);
          };

          return (
            <div id="synthese-analytique" className={`rounded-3xl shadow-lg border-2 p-6 mb-8 print-avoid-break ${darkMode ? 'bg-gray-800 border-violet-900' : 'bg-gradient-to-br from-violet-50 to-indigo-50 border-violet-200'}`}>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-3">
                  <BarChart3 className={darkMode ? 'text-violet-400' : 'text-violet-600'} size={28} />
                  <div>
                    <h2 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>Synthèse Analytique</h2>
                    <span className={`text-xs font-bold ${darkMode ? 'text-violet-400' : 'text-violet-600'}`}>Tableau croisé par service · montants annuels{donneesN1 ? ` · comparatif N-1 (${donneesN1.annee})` : ''}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 no-print">
                  {donneesN1 && (
                    <button onClick={() => setDonneesN1(null)} className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                      <X size={13} /> Effacer N-1
                    </button>
                  )}
                  <button onClick={() => setShowImportN1(true)} className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold ${darkMode ? 'bg-violet-900/40 text-violet-300 hover:bg-violet-900/60 border border-violet-700' : 'bg-violet-100 text-violet-700 hover:bg-violet-200'}`}>
                    <Upload size={13} /> {donneesN1 ? 'Recharger N-1' : 'Importer N-1'}
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`${darkMode ? 'bg-gray-700' : 'bg-white/70'} rounded-xl`}>
                      <th className="px-3 py-2 text-left text-xs font-black uppercase text-slate-500">Service</th>
                      <th className={`${colH} ${darkMode ? 'text-teal-400' : 'text-teal-700'}`}>Personnel</th>
                      <th className={`${colH} ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>Exploitation</th>
                      <th className={`${colH} ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Total charges</th>
                      <th className={`${colH} ${darkMode ? 'text-green-400' : 'text-green-700'}`}>Recettes</th>
                      <th className={`${colH} ${darkMode ? 'text-violet-400' : 'text-violet-700'}`}>Résultat</th>
                      {donneesN1 && <th className={`${colH} ${darkMode ? 'text-amber-400' : 'text-amber-700'}`}>N-1 charges</th>}
                      {donneesN1 && <th className={`${colH} ${darkMode ? 'text-amber-400' : 'text-amber-700'}`}>Évol. %</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, idx) => {
                      const totalChargesRow = r.personnel + r.exploitation;
                      const allocPS = (!r.isDirection && r.serviceId != null)
                        ? Math.round(bdPS.total * (poleSupport.repartition?.[String(r.serviceId)] || 0) / 100)
                        : 0;
                      const resultat = r.recettes - totalChargesRow;
                      const isPos = resultat >= 0;
                      const n1Row = getN1Row(r);
                      const n1Charges = n1Row ? ((n1Row.salaires || 0) + (n1Row.exploitation || 0)) : null;
                      const ePct = n1Charges !== null ? evolPct(totalChargesRow, n1Charges) : null;
                      return (
                        <tr key={idx} className={`border-t ${darkMode ? 'border-gray-700' : 'border-violet-100'} ${r.isDirection ? (darkMode ? 'bg-gray-700/30' : 'bg-white/50') : ''}`}>
                          <td className={`px-3 py-2 font-bold text-sm ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                            {r.nom}
                            {allocPS > 0 && (
                              <div className={`text-xs font-normal mt-0.5 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>
                                + Pôle Support : {allocPS.toLocaleString('fr-FR')} €
                              </div>
                            )}
                          </td>
                          <td className={`${col} ${darkMode ? 'text-teal-300' : 'text-teal-700'}`}>{fmt(r.personnel)} €</td>
                          <td className={`${col} ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>{fmt(r.exploitation)} €</td>
                          <td className={`${col} ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{fmt(totalChargesRow)} €</td>
                          <td className={`${col} ${r.recettes > 0 ? (darkMode ? 'text-green-300' : 'text-green-700') : (darkMode ? 'text-gray-500' : 'text-slate-400')}`}>
                            {r.recettes > 0 ? fmt(r.recettes) + ' €' : '—'}
                          </td>
                          <td className={`${col} font-black ${isPos ? (darkMode ? 'text-emerald-300' : 'text-emerald-700') : (darkMode ? 'text-red-300' : 'text-red-600')}`}>
                            {r.recettes > 0 ? (isPos ? '+' : '') + fmt(resultat) + ' €' : '—'}
                          </td>
                          {donneesN1 && (
                            <td className={`${col} ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>
                              {n1Charges !== null ? fmt(n1Charges) + ' €' : '—'}
                            </td>
                          )}
                          {donneesN1 && (
                            <td className="px-3 py-2 text-right">
                              {ePct !== null ? (
                                <span className={`text-xs font-black px-2 py-0.5 rounded-full ${parseFloat(ePct) > 0 ? (darkMode ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-700') : parseFloat(ePct) < 0 ? (darkMode ? 'bg-emerald-900/40 text-emerald-300' : 'bg-emerald-100 text-emerald-700') : (darkMode ? 'bg-gray-700 text-gray-400' : 'bg-slate-100 text-slate-500')}`}>
                                  {parseFloat(ePct) > 0 ? '+' : ''}{ePct}%
                                </span>
                              ) : '—'}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className={`border-t-2 font-black ${darkMode ? 'border-violet-700 bg-violet-900/20' : 'border-violet-300 bg-violet-100/80'}`}>
                      <td className={`px-3 py-3 font-black text-sm ${darkMode ? 'text-white' : 'text-slate-800'}`}>TOTAL</td>
                      <td className={`${col} ${darkMode ? 'text-teal-200' : 'text-teal-800'}`}>{fmt(totPerso)} €</td>
                      <td className={`${col} ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>{fmt(totExpl)} €</td>
                      <td className={`${col} ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{fmt(totCharges)} €</td>
                      <td className={`${col} ${darkMode ? 'text-green-200' : 'text-green-800'}`}>{fmt(totRec)} €</td>
                      <td className={`${col} text-base ${totResult >= 0 ? (darkMode ? 'text-emerald-200' : 'text-emerald-800') : (darkMode ? 'text-red-200' : 'text-red-800')}`}>
                        {totResult >= 0 ? '+' : ''}{fmt(totResult)} €
                      </td>
                      {donneesN1 && (() => {
                        const n1Tot = ((donneesN1.direction?.salaires || 0) + (donneesN1.direction?.exploitation || 0))
                          + ((donneesN1.poleSupport?.salaires || 0) + (donneesN1.poleSupport?.exploitation || 0))
                          + (donneesN1.services || []).reduce((s, sv) => s + (sv.salaires || 0) + (sv.exploitation || 0), 0);
                        const eTot = evolPct(totCharges, n1Tot);
                        return (<>
                          <td className={`${col} ${darkMode ? 'text-amber-200' : 'text-amber-800'}`}>{fmt(n1Tot)} €</td>
                          <td className="px-3 py-2 text-right">
                            {eTot !== null ? (
                              <span className={`text-xs font-black px-2 py-0.5 rounded-full ${parseFloat(eTot) > 0 ? (darkMode ? 'bg-red-900/60 text-red-200' : 'bg-red-200 text-red-800') : (darkMode ? 'bg-emerald-900/60 text-emerald-200' : 'bg-emerald-200 text-emerald-800')}`}>
                                {parseFloat(eTot) > 0 ? '+' : ''}{eTot}%
                              </span>
                            ) : '—'}
                          </td>
                        </>);
                      })()}
                    </tr>
                  </tfoot>
                </table>
              </div>
              {/* Mini KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                {[
                  { label: 'Masse salariale', val: fmt(totPerso) + ' €', pct: totCharges > 0 ? Math.round(totPerso/totCharges*100) : 0, color: darkMode ? 'text-teal-300' : 'text-teal-700', bg: darkMode ? 'bg-teal-900/30' : 'bg-teal-50' },
                  { label: 'Exploitation', val: fmt(totExpl) + ' €', pct: totCharges > 0 ? Math.round(totExpl/totCharges*100) : 0, color: darkMode ? 'text-blue-300' : 'text-blue-700', bg: darkMode ? 'bg-blue-900/30' : 'bg-blue-50' },
                  { label: 'Recettes totales', val: fmt(totRec) + ' €', pct: totCharges > 0 ? Math.round(totRec/totCharges*100) : 0, color: darkMode ? 'text-green-300' : 'text-green-700', bg: darkMode ? 'bg-green-900/30' : 'bg-green-50', label2: '% couverture' },
                  { label: 'Résultat net', val: (totResult >= 0 ? '+' : '') + fmt(totResult) + ' €', pct: null, color: totResult >= 0 ? (darkMode ? 'text-emerald-300' : 'text-emerald-700') : (darkMode ? 'text-red-300' : 'text-red-700'), bg: totResult >= 0 ? (darkMode ? 'bg-emerald-900/30' : 'bg-emerald-50') : (darkMode ? 'bg-red-900/30' : 'bg-red-50') },
                ].map((k, i) => (
                  <div key={i} className={`p-3 rounded-2xl ${k.bg}`}>
                    <div className={`text-xs font-bold mb-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{k.label}</div>
                    <div className={`text-lg font-black ${k.color}`}>{k.val}</div>
                    {k.pct !== null && (
                      <div className={`text-xs font-bold mt-1 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>{k.label2 || '% des charges'} : {k.pct}%</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* ═══ PYRAMIDE DES ÂGES ═══ */}
        {(() => {
          const ANNEE = 2026;
          const tousP = [
            ...direction.personnel.map(p => ({ ...p, source: 'Direction' })),
            ...poleSupport.personnel.map(p => ({ ...p, source: 'Pôle Support' })),
            ...services.flatMap(s => s.personnel.map(p => ({ ...p, source: s.nom }))),
          ];
          const avecAge = tousP.filter(p => p.anneeNaissance > 0);

          if (avecAge.length === 0) {
            return (
              <div className={`rounded-3xl shadow-lg border-2 p-6 mb-8 ${darkMode ? 'bg-gray-800 border-purple-900' : 'bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <Users className={darkMode ? 'text-purple-400' : 'text-purple-600'} size={28} />
                  <div>
                    <h2 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>Pyramide des âges</h2>
                    <span className={`text-xs font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>Renseignez les années de naissance sur les fiches personnel pour afficher la pyramide</span>
                  </div>
                </div>
              </div>
            );
          }

          // Tranches
          const TRANCHES = [
            { label: '< 30 ans',  min: 0,  max: 29  },
            { label: '30–39 ans', min: 30, max: 39  },
            { label: '40–49 ans', min: 40, max: 49  },
            { label: '50–54 ans', min: 50, max: 54  },
            { label: '55–59 ans', min: 55, max: 59  },
            { label: '60 ans +',  min: 60, max: 999 },
          ];
          const COLORS = ['#6366f1','#14b8a6','#3b82f6','#f59e0b','#f97316','#ef4444'];

          const ageCounts = TRANCHES.map(t => ({
            ...t,
            agents: avecAge.filter(p => {
              const age = ANNEE - p.anneeNaissance;
              return age >= t.min && age <= t.max;
            }),
          }));

          const ages = avecAge.map(p => ANNEE - p.anneeNaissance);
          const ageMoyen = ages.length > 0 ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : 0;
          const seniors = avecAge.filter(p => (ANNEE - p.anneeNaissance) >= 55);
          const retraite5ans = avecAge.filter(p => (ANNEE - p.anneeNaissance) >= 57); // retraite ~62 ans
          const retraite10ans = avecAge.filter(p => (ANNEE - p.anneeNaissance) >= 52);
          const maxCount = Math.max(...ageCounts.map(t => t.agents.length), 1);

          return (
            <div id="pyramide-ages" className={`rounded-3xl shadow-lg border-2 p-6 mb-8 print-avoid-break ${darkMode ? 'bg-gray-800 border-purple-900' : 'bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200'}`}>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                <div className="flex items-center gap-3">
                  <Users className={darkMode ? 'text-purple-400' : 'text-purple-600'} size={28} />
                  <div>
                    <h2 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>Pyramide des âges</h2>
                    <span className={`text-xs font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                      {avecAge.length}/{tousP.length} agents renseignés · Projection {ANNEE}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <div className={`text-center px-4 py-2 rounded-2xl ${darkMode ? 'bg-purple-900/40' : 'bg-purple-100'}`}>
                    <div className={`text-xs font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>Âge moyen</div>
                    <div className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>{ageMoyen} ans</div>
                  </div>
                  <div className={`text-center px-4 py-2 rounded-2xl ${darkMode ? 'bg-orange-900/40' : 'bg-orange-100'}`}>
                    <div className={`text-xs font-bold ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>≥ 55 ans (séniors)</div>
                    <div className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>{seniors.length}</div>
                  </div>
                  <div className={`text-center px-4 py-2 rounded-2xl ${darkMode ? 'bg-red-900/40' : 'bg-red-100'}`}>
                    <div className={`text-xs font-bold ${darkMode ? 'text-red-400' : 'text-red-600'}`}>Retraite ~5 ans</div>
                    <div className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>{retraite5ans.length}</div>
                  </div>
                  <div className={`text-center px-4 py-2 rounded-2xl ${darkMode ? 'bg-amber-900/40' : 'bg-amber-100'}`}>
                    <div className={`text-xs font-bold ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>Retraite ~10 ans</div>
                    <div className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>{retraite10ans.length}</div>
                  </div>
                </div>
              </div>

              {/* Barres horizontales */}
              <div className="space-y-3 mb-5">
                {ageCounts.map((t, i) => (
                  <div key={t.label} className="flex items-center gap-3">
                    <div className={`w-24 text-right text-xs font-bold flex-shrink-0 ${
                      t.min >= 60 ? (darkMode ? 'text-red-400' : 'text-red-600') :
                      t.min >= 55 ? (darkMode ? 'text-orange-400' : 'text-orange-600') :
                      darkMode ? 'text-gray-300' : 'text-slate-600'
                    }`}>{t.label}</div>
                    <div className={`flex-1 h-8 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white'} overflow-hidden relative`}>
                      <div
                        className="h-full rounded-lg flex items-center justify-end pr-2 transition-all"
                        style={{ width: `${(t.agents.length / maxCount) * 100}%`, backgroundColor: COLORS[i], minWidth: t.agents.length > 0 ? '2rem' : '0' }}
                      >
                        {t.agents.length > 0 && <span className="text-white text-xs font-black">{t.agents.length}</span>}
                      </div>
                    </div>
                    <div className={`w-8 text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{t.agents.length}</div>
                    {/* Noms agents */}
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {t.agents.slice(0, 3).map(p => (
                        <span key={p.id + p.source} className={`text-[10px] px-1.5 py-0.5 rounded ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-white border text-slate-500'}`}>
                          {p.titre.split(' ')[0]} {p.titre.includes('(') ? p.titre.match(/\(([^)]+)\)/)?.[1]?.split(' ')[0] : ''}
                        </span>
                      ))}
                      {t.agents.length > 3 && <span className={`text-[10px] px-1.5 py-0.5 rounded ${darkMode ? 'bg-gray-600 text-gray-400' : 'bg-slate-100 text-slate-400'}`}>+{t.agents.length - 3}</span>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Alerte séniors */}
              {seniors.length > 0 && (
                <div className={`p-3 rounded-xl text-sm ${darkMode ? 'bg-orange-900/30 border border-orange-700 text-orange-300' : 'bg-orange-50 border border-orange-200 text-orange-700'}`}>
                  <AlertTriangle size={14} className="inline mr-1" />
                  <strong>{seniors.length} agent{seniors.length > 1 ? 's' : ''} ≥ 55 ans</strong> — anticipez les recrutements et transferts de compétences.
                  {retraite5ans.length > 0 && <span className="ml-2 font-bold">Départs retraite estimés d'ici 5 ans : {retraite5ans.length}</span>}
                </div>
              )}
            </div>
          );
        })()}

        {/* ═══════════════════════════════════════════════════════
            RQTH / AGEFIPH — OBLIGATION D'EMPLOI DES TH
            ═══════════════════════════════════════════════════════ */}
        {(() => {
          // Rassembler tout le personnel (direction + services)
          const tousPersonnels = [
            ...direction.personnel.map(p => ({ ...p, source: 'Direction' })),
            ...poleSupport.personnel.map(p => ({ ...p, source: 'Pôle Support' })),
            ...services.flatMap(s => s.personnel.map(p => ({ ...p, source: s.nom }))),
          ];
          const totalETP = tousPersonnels.reduce((s, p) => s + (parseFloat(p.etp) || 0), 0);
          const rqthPersonnels = tousPersonnels.filter(p => p.rqth);
          const totalETPRqth = rqthPersonnels.reduce((s, p) => s + (parseFloat(p.etp) || 0), 0);

          // OETH : obligation 6% (DOETH) au-dessus de 20 salariés
          const SEUIL_OETH = 20;
          const TAUX_OETH = 0.06;
          const SMIC_HORAIRE = 11.88;
          const HEURES_ANNUELLES = 1820;
          const SMIC_ANNUEL = SMIC_HORAIRE * HEURES_ANNUELLES;

          const obligationETP = totalETP >= SEUIL_OETH ? totalETP * TAUX_OETH : 0;
          const ecartETP = totalETPRqth - obligationETP;
          const estConforme = ecartETP >= 0 || totalETP < SEUIL_OETH;

          // Contribution AGEFIPH si non conforme
          const unitesMontantContrib = 400; // coefficient unités manquantes
          const contribution = !estConforme && totalETP >= SEUIL_OETH
            ? Math.abs(ecartETP) * SMIC_ANNUEL * (unitesMontantContrib / HEURES_ANNUELLES)
            : 0;

          // Aides estimées si conforme (aide à l'emploi durable ~1800€/ETP RQTH/an)
          const AIDE_EMPLOI_DURABLE = 1800;
          const aidesEstimees = estConforme && totalETPRqth > 0 ? totalETPRqth * AIDE_EMPLOI_DURABLE : 0;

          const tauxRqth = totalETP > 0 ? (totalETPRqth / totalETP) * 100 : 0;
          const fmt = n => Math.round(n).toLocaleString('fr-FR');

          return (
            <div id="rqth-agefiph" className={`rounded-3xl shadow-lg border-2 p-6 mb-8 print-avoid-break ${darkMode ? 'bg-gray-800 border-orange-900' : 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200'}`}>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                <div className="flex items-center gap-3">
                  <UserCheck className={darkMode ? 'text-orange-400' : 'text-orange-600'} size={28} />
                  <div>
                    <h2 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>RQTH & OETH</h2>
                    <span className={`text-xs font-bold ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                      Obligation Emploi Travailleurs Handicapés · AGEFIPH
                    </span>
                  </div>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-sm ${
                  totalETP < SEUIL_OETH
                    ? darkMode ? 'bg-gray-700 text-gray-400' : 'bg-slate-100 text-slate-500'
                    : estConforme
                      ? darkMode ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-700' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : darkMode ? 'bg-red-900/40 text-red-300 border border-red-700' : 'bg-red-100 text-red-800 border border-red-300'
                }`}>
                  {totalETP < SEUIL_OETH ? '— Non soumis (< 20 ETP)' : estConforme ? '✓ Conforme OETH' : '⚠ Non conforme OETH'}
                </div>
              </div>

              {/* KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                {[
                  { label: 'Effectif total (ETP)', val: totalETP.toFixed(1), sub: `${tousPersonnels.length} agents`, color: darkMode ? 'text-slate-300' : 'text-slate-700', bg: darkMode ? 'bg-gray-700' : 'bg-white' },
                  { label: 'ETP RQTH', val: totalETPRqth.toFixed(1), sub: `${rqthPersonnels.length} agents · ${tauxRqth.toFixed(1)}%`, color: darkMode ? 'text-orange-300' : 'text-orange-700', bg: darkMode ? 'bg-orange-900/30' : 'bg-orange-50' },
                  { label: totalETP >= SEUIL_OETH ? 'Obligation OETH (6%)' : 'Obligation OETH', val: totalETP >= SEUIL_OETH ? obligationETP.toFixed(1) + ' ETP' : 'Non applicable', sub: totalETP >= SEUIL_OETH ? `Seuil ≥ ${SEUIL_OETH} ETP` : `Effectif < ${SEUIL_OETH} ETP`, color: darkMode ? 'text-blue-300' : 'text-blue-700', bg: darkMode ? 'bg-blue-900/30' : 'bg-blue-50' },
                  estConforme
                    ? { label: 'Aides AGEFIPH estimées', val: aidesEstimees > 0 ? fmt(aidesEstimees) + ' €/an' : '—', sub: '~1 800 €/ETP RQTH', color: darkMode ? 'text-emerald-300' : 'text-emerald-700', bg: darkMode ? 'bg-emerald-900/30' : 'bg-emerald-50' }
                    : { label: 'Contribution AGEFIPH', val: contribution > 0 ? fmt(contribution) + ' €/an' : '—', sub: 'Estimation (coeff. 400)', color: darkMode ? 'text-red-300' : 'text-red-700', bg: darkMode ? 'bg-red-900/30' : 'bg-red-50' },
                ].map((k, i) => (
                  <div key={i} className={`p-3 rounded-2xl ${k.bg}`}>
                    <div className={`text-xs font-bold mb-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{k.label}</div>
                    <div className={`text-lg font-black ${k.color}`}>{k.val}</div>
                    <div className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>{k.sub}</div>
                  </div>
                ))}
              </div>

              {/* Jauge RQTH */}
              {totalETP >= SEUIL_OETH && (
                <div className="mb-5">
                  <div className="flex justify-between text-xs mb-1">
                    <span className={`font-bold ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>Taux RQTH actuel : <strong className={darkMode ? 'text-orange-300' : 'text-orange-700'}>{tauxRqth.toFixed(1)}%</strong></span>
                    <span className={`font-bold ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>Objectif OETH : 6%</span>
                  </div>
                  <div className={`w-full h-4 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-slate-200'} overflow-hidden relative`}>
                    <div className={`h-full rounded-full transition-all ${tauxRqth >= 6 ? 'bg-emerald-500' : 'bg-orange-500'}`} style={{ width: `${Math.min(100, tauxRqth / 6 * 100)}%` }} />
                    <div className="absolute top-0 bottom-0 w-0.5 bg-blue-500" style={{ left: '100%', transform: 'translateX(-1px)' }} title="Objectif 6%" />
                  </div>
                  <div className={`text-xs mt-1 ${tauxRqth >= 6 ? (darkMode ? 'text-emerald-400' : 'text-emerald-600') : (darkMode ? 'text-orange-400' : 'text-orange-600')} font-bold`}>
                    {tauxRqth >= 6 ? `Excédent : +${(totalETPRqth - obligationETP).toFixed(1)} ETP` : `Manque : ${(obligationETP - totalETPRqth).toFixed(1)} ETP pour atteindre l'objectif`}
                  </div>
                </div>
              )}

              {/* Liste agents RQTH */}
              {rqthPersonnels.length > 0 ? (
                <div>
                  <div className={`text-xs font-black uppercase mb-2 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Agents RQTH</div>
                  <div className="flex flex-wrap gap-2">
                    {rqthPersonnels.map(p => (
                      <div key={p.id + p.source} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold ${darkMode ? 'bg-orange-900/30 border border-orange-700 text-orange-300' : 'bg-orange-100 border border-orange-200 text-orange-800'}`}>
                        <UserCheck size={12} />
                        {p.titre}
                        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>({p.source} · {p.etp} ETP)</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className={`text-sm text-center py-3 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                  Aucun agent RQTH déclaré — cochez la case RQTH sur les fiches personnel pour les déclarer.
                </p>
              )}
            </div>
          );
        })()}

        {/* PLANNING DES ABSENCES */}
        <PlanningAbsences
          direction={direction}
          poleSupport={poleSupport}
          services={services}
          planningAbsences={planningAbsences}
          setPlanningAbsences={setPlanningAbsences}
          darkMode={darkMode}
        />

        {/* ENVELOPPE DE FORMATION */}
        <div id="enveloppe-formation" className={`rounded-3xl shadow-lg border-2 p-8 mb-8 print-avoid-break ${darkMode ? 'bg-gray-800 border-emerald-900' : 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-300'}`}>
          <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
            <div className="flex items-center gap-3">
              <GraduationCap className="text-emerald-600" size={32} />
              <div>
                <h2 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>Enveloppe de Formation</h2>
                <span className={`text-sm font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>Formation continue du personnel</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className={`text-right`}>
                <div className={`text-xs font-bold mb-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Budget alloué</div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    className={`w-36 text-right font-black text-xl rounded-xl px-3 py-2 outline-none ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-slate-800'}`}
                    value={enveloppeFormation.budget}
                    onChange={e => setEnveloppeFormation({...enveloppeFormation, budget: Math.max(0, parseFloat(e.target.value) || 0)})}
                  />
                  <span className={`font-bold ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>€</span>
                </div>
              </div>
            </div>
          </div>

          {/* Barre de consommation */}
          {(() => {
            const totalConsomme = (enveloppeFormation.actions || []).reduce((s, a) => s + (parseFloat(a.cout) || 0), 0);
            const pct = enveloppeFormation.budget > 0 ? Math.min(100, Math.round(totalConsomme / enveloppeFormation.budget * 100)) : 0;
            const restant = enveloppeFormation.budget - totalConsomme;
            return (
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className={`font-bold ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>Consommé : <strong className="text-emerald-600">{Math.round(totalConsomme).toLocaleString()} €</strong></span>
                  <span className={`font-bold ${restant >= 0 ? (darkMode ? 'text-emerald-400' : 'text-emerald-600') : (darkMode ? 'text-red-400' : 'text-red-600')}`}>
                    {restant >= 0 ? 'Restant' : 'Dépassement'} : {Math.abs(Math.round(restant)).toLocaleString()} €
                  </span>
                </div>
                <div className={`w-full h-4 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-slate-200'} overflow-hidden`}>
                  <div className={`h-full rounded-full transition-all ${pct > 100 ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{width: `${Math.min(100, pct)}%`}} />
                </div>
                <div className={`text-right text-xs mt-1 font-bold ${pct > 80 ? 'text-amber-500' : (darkMode ? 'text-gray-400' : 'text-slate-400')}`}>{pct}% consommé</div>
              </div>
            );
          })()}

          {/* Liste des actions de formation */}
          <div className="space-y-3 mb-4">
            {(enveloppeFormation.actions || []).map((action, aIdx) => (
              <div key={action.id} className={`p-4 rounded-2xl border group relative ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-emerald-100'}`}>
                <button onClick={() => setEnveloppeFormation({...enveloppeFormation, actions: enveloppeFormation.actions.filter(a => a.id !== action.id)})} className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 no-print"><Trash2 size={14} /></button>
                <div className="flex flex-wrap gap-3 items-start">
                  <div className="flex-1 min-w-[150px]">
                    <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Intitulé formation</label>
                    <input className={`w-full font-bold text-sm rounded-lg px-3 py-1.5 outline-none ${darkMode ? 'bg-gray-600 text-white' : 'bg-emerald-50'}`} value={action.nom} onChange={e => setEnveloppeFormation({...enveloppeFormation, actions: enveloppeFormation.actions.map(a => a.id === action.id ? {...a, nom: e.target.value} : a)})} />
                  </div>
                  <div className="w-36">
                    <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Bénéficiaire</label>
                    <input className={`w-full text-sm rounded-lg px-3 py-1.5 outline-none ${darkMode ? 'bg-gray-600 text-white' : 'bg-emerald-50'}`} value={action.beneficiaire || ''} onChange={e => setEnveloppeFormation({...enveloppeFormation, actions: enveloppeFormation.actions.map(a => a.id === action.id ? {...a, beneficiaire: e.target.value} : a)})} />
                  </div>
                  <div className="w-28">
                    <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Date</label>
                    <input type="date" className={`w-full text-sm rounded-lg px-3 py-1.5 outline-none ${darkMode ? 'bg-gray-600 text-white' : 'bg-emerald-50'}`} value={action.date || ''} onChange={e => setEnveloppeFormation({...enveloppeFormation, actions: enveloppeFormation.actions.map(a => a.id === action.id ? {...a, date: e.target.value} : a)})} />
                  </div>
                  <div className="w-28">
                    <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Coût (€)</label>
                    <input type="number" min="0" className={`w-full font-black text-sm rounded-lg px-3 py-1.5 outline-none ${darkMode ? 'bg-gray-600 text-white' : 'bg-emerald-50'}`} value={action.cout || 0} onChange={e => setEnveloppeFormation({...enveloppeFormation, actions: enveloppeFormation.actions.map(a => a.id === action.id ? {...a, cout: Math.max(0, parseFloat(e.target.value) || 0)} : a)})} />
                  </div>
                  <div className="w-28">
                    <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Statut</label>
                    <select className={`w-full text-xs rounded-lg px-2 py-1.5 font-bold ${darkMode ? 'bg-gray-600 text-white' : 'bg-emerald-50'}`} value={action.statut || 'planifie'} onChange={e => setEnveloppeFormation({...enveloppeFormation, actions: enveloppeFormation.actions.map(a => a.id === action.id ? {...a, statut: e.target.value} : a)})}>
                      <option value="planifie">Planifié</option>
                      <option value="en_cours">En cours</option>
                      <option value="realise">Réalisé</option>
                      <option value="annule">Annulé</option>
                    </select>
                  </div>
                  <div className={`self-end px-3 py-1.5 rounded-lg text-xs font-black ${
                    action.statut === 'realise' ? (darkMode ? 'bg-emerald-900/50 text-emerald-300' : 'bg-emerald-100 text-emerald-700') :
                    action.statut === 'en_cours' ? (darkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700') :
                    action.statut === 'annule' ? (darkMode ? 'bg-gray-600 text-gray-400' : 'bg-gray-100 text-gray-500') :
                    (darkMode ? 'bg-amber-900/50 text-amber-300' : 'bg-amber-100 text-amber-700')
                  }`}>
                    {action.statut === 'realise' ? '✓ Réalisé' : action.statut === 'en_cours' ? '⟳ En cours' : action.statut === 'annule' ? '✕ Annulé' : '◷ Planifié'}
                  </div>
                </div>
              </div>
            ))}
            {(enveloppeFormation.actions || []).length === 0 && (
              <p className={`text-center py-6 text-sm ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Aucune action de formation — cliquez + pour en ajouter</p>
            )}
          </div>
          <button
            onClick={() => setEnveloppeFormation({...enveloppeFormation, actions: [...(enveloppeFormation.actions || []), { id: Date.now(), nom: 'Nouvelle formation', beneficiaire: '', date: '', cout: 0, statut: 'planifie' }]})}
            className={`w-full py-3 border-2 border-dashed rounded-2xl text-sm font-bold flex items-center justify-center gap-2 no-print ${darkMode ? 'border-emerald-700 text-emerald-400 hover:bg-emerald-900/20' : 'border-emerald-300 text-emerald-600 hover:bg-emerald-50'}`}
          >
            <Plus size={16} /> Ajouter une action de formation
          </button>
        </div>


        {/* REPORTING FC */}
        <ReportingFC
          reportingFC={reportingFC}
          setReportingFC={setReportingFC}
          services={services}
          darkMode={darkMode}
          onExportExcel={() => exportReportingFC(reportingFC, services)}
          onExportPdf={() => exportReportingFCPdf(reportingFC, services)}
        />

        {/* SIMULATION CHARGES INTERACTIF */}
        {(() => {
  const bdDir = getBudgetDirection();
  const totalPers0 = [bdDir.salaires, ...services.map(s => getBudgetService(s).salaires)].reduce((a, b) => a + b, 0);
  const totalExpl0 = [bdDir.chargesSiege, ...services.map(s => getBudgetService(s).exploitation)].reduce((a, b) => a + b, 0);
  const totalRec0  = services.reduce((s, svc) => s + getBudgetService(svc).recettes, 0);

  const factS = 1 + (simCharges.augSalaires || 0) / 100;
  const factC = 1 + (simCharges.augCharges || 0) / 100;
  const factE = 1 + (simCharges.augExploitation || 0) / 100;

  const totalPers1 = totalPers0 * factS * factC;
  const totalExpl1 = totalExpl0 * factE;
  const total0 = totalPers0 + totalExpl0;
  const total1 = totalPers1 + totalExpl1;
  const delta  = total1 - total0;
  const result1 = totalRec0 - total1;

  const fmt = n => Math.round(n).toLocaleString('fr-FR');
  const Slider = ({ label, field, min, max, color }) => (
    <div>
      <div className="flex justify-between mb-1">
        <span className={`text-xs font-bold ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>{label}</span>
        <span className={`text-sm font-black ${simCharges[field] > 0 ? (darkMode ? `text-${color}-300` : `text-${color}-700`) : (darkMode ? 'text-gray-400' : 'text-slate-400')}`}>
          {simCharges[field] > 0 ? '+' : ''}{simCharges[field]}%
        </span>
      </div>
      <input type="range" min={min} max={max} step="0.5" value={simCharges[field]}
        onChange={e => setSimCharges({...simCharges, [field]: parseFloat(e.target.value)})}
        className="w-full accent-teal-500"
      />
      <div className={`flex justify-between text-[10px] ${darkMode ? 'text-gray-600' : 'text-slate-400'}`}><span>{min}%</span><span>{max}%</span></div>
    </div>
  );

  return (
    <div id="simulation-charges" className={`rounded-3xl shadow-lg border-2 p-6 mb-8 print-avoid-break ${darkMode ? 'bg-gray-800 border-sky-900' : 'bg-gradient-to-br from-sky-50 to-blue-50 border-sky-200'}`}>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <Calculator className={darkMode ? 'text-sky-400' : 'text-sky-600'} size={28} />
          <div>
            <h2 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>Simulation de charges</h2>
            <span className={`text-xs font-bold ${darkMode ? 'text-sky-400' : 'text-sky-600'}`}>Testez l'impact d'une variation des charges sur le résultat</span>
          </div>
        </div>
        <button onClick={() => setSimCharges({ augSalaires: 0, augCharges: 0, augExploitation: 0 })}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
          <RotateCcw size={13} /> Réinitialiser
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Sliders */}
        <div className="space-y-5">
          <Slider label="Augmentation salariale (masse brute)" field="augSalaires" min={-5} max={15} color="teal" />
          <Slider label="Variation taux de charges patronales" field="augCharges" min={-5} max={10} color="blue" />
          <Slider label="Variation charges d'exploitation" field="augExploitation" min={-10} max={20} color="amber" />
        </div>

        {/* Résultats */}
        <div className="space-y-3">
          <div className={`p-4 rounded-2xl ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
            <div className={`text-xs font-bold uppercase mb-3 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Impact sur le budget</div>
            <div className="space-y-2 text-sm">
              {[
                { label: 'Personnel (base)', val: fmt(totalPers0) + ' €', sim: fmt(totalPers1) + ' €', delta: totalPers1 - totalPers0 },
                { label: 'Exploitation (base)', val: fmt(totalExpl0) + ' €', sim: fmt(totalExpl1) + ' €', delta: totalExpl1 - totalExpl0 },
                { label: 'TOTAL charges', val: fmt(total0) + ' €', sim: fmt(total1) + ' €', delta: delta, bold: true },
              ].map((r, i) => (
                <div key={i} className={`flex justify-between items-center ${r.bold ? `pt-2 border-t font-black ${darkMode ? 'border-gray-600' : 'border-slate-200'}` : ''}`}>
                  <span className={darkMode ? 'text-gray-300' : 'text-slate-600'}>{r.label}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs line-through ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>{r.val}</span>
                    <span className={darkMode ? 'text-white' : 'text-slate-800'}>{r.sim}</span>
                    {r.delta !== 0 && (
                      <span className={`text-xs font-black px-2 py-0.5 rounded-full ${r.delta > 0 ? (darkMode ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-700') : (darkMode ? 'bg-emerald-900/40 text-emerald-300' : 'bg-emerald-100 text-emerald-700')}`}>
                        {r.delta > 0 ? '+' : ''}{fmt(r.delta)} €
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className={`p-4 rounded-2xl font-black text-center ${result1 >= 0 ? (darkMode ? 'bg-emerald-900/30 border border-emerald-700' : 'bg-emerald-50 border border-emerald-200') : (darkMode ? 'bg-red-900/30 border border-red-700' : 'bg-red-50 border border-red-200')}`}>
            <div className={`text-xs font-bold mb-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Résultat simulé (Recettes {fmt(totalRec0)} € − Charges simulées)</div>
            <div className={`text-2xl ${result1 >= 0 ? (darkMode ? 'text-emerald-300' : 'text-emerald-700') : (darkMode ? 'text-red-300' : 'text-red-700')}`}>
              {result1 >= 0 ? '+' : ''}{fmt(result1)} €
            </div>
            <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
              vs résultat actuel : {totalRec0 - total0 >= 0 ? '+' : ''}{fmt(totalRec0 - total0)} €
              {' '}({delta >= 0 ? '+' : ''}{fmt(delta)} € de variation)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
})()}

        {/* PILOTAGE FINANCIER */}
        <PilotageFinancier
          key={pilotageResetKey}
          darkMode={darkMode}
          checkPassword={checkPassword}
          startEmpty={pilotageResetKey > 0}
          budgetPersonnel={[
            ...direction.personnel.map(p => ({ ...p, source: 'Direction' })),
            ...services.flatMap(s => s.personnel.map(p => ({ ...p, source: s.nom })))
          ]}
          externalSites={pilotageSites}
          setExternalSites={setPilotageSites}
        />

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
    </div>
    {presentationMode && (
      <PresentationMode
        direction={direction}
        poleSupport={poleSupport}
        services={services}
        darkMode={darkMode}
        onClose={() => setPresentationMode(false)}
        calculerBudgetDirection={calculerBudgetDirection}
        calculerBudgetService={calculerBudgetService}
        calculerBudgetPoleSupport={calculerBudgetPoleSupport}
        calculerSalaireAnnuel={calculerSalaireAnnuel}
        calculerStatsFormation={calculerStatsFormation}
      />
    )}
    </>
  );
};

export default BudgetTool;
