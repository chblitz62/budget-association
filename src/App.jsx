import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Plus, Trash2, Download, Building2, Users, Landmark, Settings, Calendar, TrendingUp, Euro, Save, Upload, Printer, Moon, Sun, Lock, LogOut, GraduationCap, MapPin, UserMinus, Banknote, TrendingDown, CheckCircle, AlertTriangle, FileSpreadsheet, Key, Eye, EyeOff, HelpCircle, X, AlertCircle, Clock, BarChart3, Search, Menu, ChevronLeft, ChevronRight, Home, Shield, Wallet, Building, Layers, Calculator, RotateCcw, Target, Gauge, Bell, GripVertical, ChevronDown, ChevronUp, UserCheck, UserX, Zap, Monitor, Cog, ExternalLink, Camera, GitCompare, Leaf, Brain } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { exportToExcel, exportReportingFC } from './utils/excelExport';
import { exportToPDF, exportReportingFCPdf } from './utils/pdfExport';
import PilotageFinancier, { zeroSites as pilotageZeroSites, calcSalarie as calcSalarieFormateur } from './components/PilotageFinancier';
import PresentationMode from './components/PresentationMode';
import PlanningAbsences from './components/PlanningAbsences';
import ReportingFC from './components/ReportingFC';
import ImportN1Modal from './components/ImportN1Modal';
import SubventionRegion from './components/SubventionRegion';
import DAF from './components/DAF';
import VentilationBP from './components/VentilationBP';
import WizardImportBP from './components/WizardImportBP';
import WizardSetup from './components/WizardSetup';
import CalculateurVacataires from './components/CalculateurVacataires';
import NumericInput from './components/ui/NumericInput';
import ConfirmDialog from './components/ui/ConfirmDialog';
import SaveIndicator from './components/ui/SaveIndicator';
import HelpIcon from './components/ui/HelpIcon';
import ModalFI from './components/modals/ModalFI';
import ModalSaisonnalite from './components/modals/ModalSaisonnalite';
import InfoTooltip from './components/ui/Tooltip';
import ModalRoles from './components/modals/ModalRoles';
import ModalPassword from './components/modals/ModalPassword';
import ModalReset from './components/modals/ModalReset';
import TabTresorerie from './components/TabTresorerie';
import TabAnalyse from './components/tabs/TabAnalyse';
import StartupGate from './components/StartupGate';
import ModalHardReset from './components/ModalHardReset';
import StressTestBar from './components/StressTestBar';
import PoolRHManager from './components/PoolRHManager';
import SnapshotManager, { loadSnapshot } from './components/SnapshotManager';
import AICopilot from './components/AICopilot';
import DashboardCard from './components/ui/DashboardCard';
import { hasStoredData, exportData, importData } from './utils/storage';

// Import des constantes et valeurs par défaut
import {
  CHARGES_PATRONALES,
  PRIME_SEGUR,
  JOURS_ANNEE,
  JOURS_OUVRES_AN,
  JOURS_CONGES_LEGAL,
  CHARGES_VACATAIRE,
  SEUIL_HEURES_VACATAIRE,
  SEUIL_RATIO_VACATAIRE,
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
  calculerPresenceEquipe,
  calculerPresenceAgent,
  calculerETPReelParMoisParService,
  calculerStatsVacataires,
  calculerBudgetDirection,
  calculerBudgetService,
  calculerBudgetPoleSupport,
  calculerSalaireAnnuel,
  calculerProvisions,
  calculerBFR,
  calculerFondRoulement,
  calculerSynthese3Ans,
  calculerBudgetAnnuelMensuel,
  calculerAlertesRH,
  calculerTresorerieMensuelle,
  calculerPartPoolRH,
  verifierCoherencePoolRH,
  repartirFraisSiege,
  appliquerStressTest,
  calculerIFC,
  runFinancialAudit,
  loadFromStorage
} from './utils/calculations';
import { genererCSVComptable, telechargerCSVComptable } from './utils/csvExport';

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



// Composant menu latéral de navigation
const SidebarNav = ({ services, darkMode, isOpen, onToggle, activeTab, onTabChange }) => {
  const groups = [
    {
      label: 'Tableau de bord',
      items: [
        { id: 'dashboard',  label: 'Tableau de bord', icon: Home },
        { id: 'analyse',    label: 'Analyse',          icon: BarChart3 },
      ]
    },
    {
      label: 'Saisie',
      items: [
        { id: 'budget',     label: 'Budget',           icon: Building2 },
        { id: 'rh',         label: 'RH',               icon: Users },
        { id: 'formation',  label: 'Formation',        icon: GraduationCap },
        { id: 'vacataires', label: 'Vacataires',       icon: UserCheck },
      ]
    },
    {
      label: 'Pilotage',
      items: [
        { id: 'subvention', label: 'Subvention',       icon: Landmark },
        { id: 'daf',        label: 'DAF',              icon: Calculator },
        { id: 'parametres', label: 'Paramètres',       icon: Settings },
      ]
    },
    {
      label: 'Audit',
      items: [
        { id: 'reporting',  label: 'Reporting réglementaire', icon: Shield },
      ]
    },
  ];

  return (
    <div className={`sidebar-container fixed left-0 z-40 transition-all duration-300 no-print ${isOpen ? 'w-64' : 'w-14'}`}
         style={{ top: '56px', height: 'calc(100vh - 56px)' }}>
      <div className={`h-full flex flex-col border-r ${darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-slate-200'} shadow-xl`}>

        {/* Toggle */}
        <button
          onClick={onToggle}
          className={`absolute -right-3 top-6 w-6 h-6 rounded-full shadow-lg flex items-center justify-center border z-10
            ${darkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
        >
          {isOpen ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
        </button>

        {/* Nav groups */}
        <nav className="flex-1 overflow-y-auto sidebar-nav py-3 px-2">
          {groups.map(group => (
            <div key={group.label} className="mb-3">
              {isOpen && (
                <div className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 ${darkMode ? 'text-zinc-600' : 'text-slate-400'}`}>
                  {group.label}
                </div>
              )}
              {group.items.map(item => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    title={!isOpen ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 transition-all duration-150 ${
                      isActive
                        ? darkMode
                          ? 'bg-indigo-600/20 text-indigo-400'
                          : 'bg-indigo-50 text-indigo-700'
                        : darkMode
                          ? 'text-zinc-500 hover:bg-zinc-800/80 hover:text-zinc-200'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                  >
                    <item.icon size={16} className={`flex-shrink-0 ${isActive ? 'text-indigo-500' : ''}`} />
                    {isOpen && (
                      <span className={`text-xs font-semibold truncate ${isActive ? 'font-bold' : ''}`}>
                        {item.label}
                      </span>
                    )}
                    {isActive && isOpen && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
              {!isOpen && <div className={`mx-3 my-1.5 h-px ${darkMode ? 'bg-zinc-800' : 'bg-slate-100'}`} />}
            </div>
          ))}

          {/* Services — visibles seulement sidebar ouverte */}
          {isOpen && services.length > 0 && (
            <div className="mb-3">
              <div className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 ${darkMode ? 'text-zinc-600' : 'text-slate-400'}`}>
                Services ({services.length})
              </div>
              {services.map(srv => (
                <button
                  key={srv.id}
                  onClick={() => {
                    onTabChange('budget');
                    setTimeout(() => {
                      const el = document.getElementById(`service-${srv.id}`);
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl mb-0.5 transition-all duration-150 ${
                    darkMode ? 'text-zinc-500 hover:bg-zinc-800/80 hover:text-zinc-300' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  {srv.promos
                    ? <GraduationCap size={13} className="text-violet-400 flex-shrink-0" />
                    : <Layers size={13} className="text-indigo-400 flex-shrink-0" />
                  }
                  <span className="text-xs truncate">{srv.nom}</span>
                </button>
              ))}
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className={`p-3 border-t ${darkMode ? 'border-zinc-800' : 'border-slate-100'}`}>
          {isOpen ? (
            <div className={`text-[10px] font-medium ${darkMode ? 'text-zinc-600' : 'text-slate-400'}`}>
              {services.length} service{services.length !== 1 ? 's' : ''}
            </div>
          ) : (
            <div className="flex justify-center">
              <Layers size={14} className={darkMode ? 'text-zinc-700' : 'text-slate-300'} />
            </div>
          )}
        </div>
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
  montantSegurETP: 238,
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
  rolesPersonnel: [
    { id: 'direction',         label: 'Siège' },
    { id: 'directeur_adjoint', label: 'Directeur adjoint' },
    { id: 'administratif',     label: 'Administratif' },
    { id: 'technique',         label: 'Technique' },
    { id: 'documentation',     label: 'Documentation' },
    { id: 'communication',     label: 'Communication' },
    { id: 'formateur',         label: 'Formateur' },
    { id: 'responsable',       label: 'Resp. secteur' },
    { id: 'vacataire',         label: 'Vacataire' },
  ],
};

const BudgetTool = () => {
  const fileInputRef = useRef(null);

  // Startup gate — affiché si aucune donnée en localStorage
  const [showStartupGate, setShowStartupGate] = useState(() => !hasStoredData());
  const [showHardReset, setShowHardReset] = useState(false);

  // Stress Test — simulateur d'aléas sur les subventions (-20 à +20 %)
  const [stressTest, setStressTest] = useState(0);

  // Snapshot — comparaison Budget Voté
  const [compareSnapshot, setCompareSnapshot] = useState(false);

  // Clés de répartition — frais de siège répercutés sur services
  const [repartirSiege, setRepartirSiege] = useState(false);

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
    const d = loadFromStorage('assoc_direction', defaultDirection);
    // Migration format 1 (loyer/charges/autresCharges) → chargesSiege[]
    if (!d.chargesSiege && (d.loyer !== undefined || d.charges !== undefined || d.autresCharges !== undefined)) {
      const migrated = { ...d, chargesSiege: [] };
      if (d.loyer)        migrated.chargesSiege.push({ id: 1, nom: 'Loyer', montant: d.loyer });
      if (d.charges)      migrated.chargesSiege.push({ id: 2, nom: 'Charges', montant: d.charges });
      if (d.autresCharges) migrated.chargesSiege.push({ id: 3, nom: 'Autres charges', montant: d.autresCharges });
      delete migrated.loyer; delete migrated.charges; delete migrated.autresCharges;
      return migrated;
    }
    // Migration format 2 : ajout des nouveaux champs si absents
    const out = { ...d };
    if (!out.exploitation)   out.exploitation   = [];
    if (!out.recettes)        out.recettes        = [];
    if (!out.repartition)     out.repartition     = {};
    if (!out.investissements) out.investissements = { bienImmo:{montant:0,duree:25,taux:0}, travaux:{montant:0,duree:10,taux:0}, vehicule:{montant:0,duree:5,taux:0}, informatique:{montant:0,duree:3,taux:0}, mobilier:{montant:0,duree:10,taux:0} };
    return out;
  });
  const [services, setServices] = useState(() => loadFromStorage('assoc_services', defaultServices));
  const [poleSupport, setPoleSupport] = useState(() => loadFromStorage('assoc_pole_support', defaultPoleSupport));
  const [pilotageSites, setPilotageSites] = useState(() => loadFromStorage('assoc_pilotage_sites', pilotageZeroSites));

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

  // Modal FI% : { serviceId, agentId }
  const [fiDialog, setFiDialog] = useState(null);
  // Modal Saisonnalité recettes : { type:'service'|'poleSupport'|'direction', entityId, recetteId }
  const [saisonnaliteDialog, setSaisonnaliteDialog] = useState(null);

  // Pool RH — agents partagés entre plusieurs entités
  const [poolRH, setPoolRH] = useState(() => loadFromStorage('assoc_pool_rh', []));

  // Wizard setup initial
  const isFirstLaunch = !localStorage.getItem('assoc_services') && !localStorage.getItem('assoc_direction');
  const [showWizardSetup, setShowWizardSetup] = useState(isFirstLaunch);

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
  const [simRegion, setSimRegion] = useState(0);
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('assoc_active_tab') || 'dashboard');
  const [dafSub, setDafSub] = useState(() => localStorage.getItem('daf_sub') || 'subvention');
  const setDafSubP = (v) => { setDafSub(v); localStorage.setItem('daf_sub', v); };
  const [presentationMode, setPresentationMode] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [planningAbsences, setPlanningAbsences] = useState(() => loadFromStorage('assoc_planning_absences', {}));
  useEffect(() => { localStorage.setItem('assoc_planning_absences', JSON.stringify(planningAbsences)); }, [planningAbsences]);
  useEffect(() => { localStorage.setItem('assoc_services', JSON.stringify(services)); triggerSaveIndicator(); }, [services]);
  useEffect(() => { localStorage.setItem('assoc_pool_rh', JSON.stringify(poolRH)); triggerSaveIndicator(); }, [poolRH]);
  useEffect(() => { localStorage.setItem('assoc_pole_support', JSON.stringify(poleSupport)); triggerSaveIndicator(); }, [poleSupport]);
  useEffect(() => { localStorage.setItem('assoc_pilotage_sites', JSON.stringify(pilotageSites)); triggerSaveIndicator(); }, [pilotageSites]);
  useEffect(() => { localStorage.setItem('assoc_direction_position', JSON.stringify(directionPosition)); }, [directionPosition]);
  useEffect(() => { localStorage.setItem('assoc_pole_support_position', JSON.stringify(poleSupportPosition)); }, [poleSupportPosition]);
  useEffect(() => { localStorage.setItem('assoc_darkMode', JSON.stringify(darkMode)); }, [darkMode]);
  useEffect(() => { localStorage.setItem('assoc_enveloppe_formation', JSON.stringify(enveloppeFormation)); triggerSaveIndicator(); }, [enveloppeFormation]);
  useEffect(() => { localStorage.setItem('assoc_reporting_fc', JSON.stringify(reportingFC)); triggerSaveIndicator(); }, [reportingFC]);
  useEffect(() => { localStorage.setItem('assoc_donnees_n1', JSON.stringify(donneesN1)); triggerSaveIndicator(); }, [donneesN1]);
  useEffect(() => { localStorage.setItem('assoc_active_tab', activeTab); }, [activeTab]);

  // Auto-backup toutes les 10 minutes (protection contre perte de données)
  useEffect(() => {
    const doBackup = () => {
      try {
        const snapshot = {
          ts: new Date().toISOString(),
          globalParams, direction, services, poleSupport, poolRH,
          enveloppeFormation, reportingFC, donneesN1, planningAbsences, pilotageSites
        };
        // Rotation sur 3 slots
        const slot = ((parseInt(localStorage.getItem('assoc_backup_slot') || '0') % 3) + 1);
        localStorage.setItem(`assoc_backup_${slot}`, JSON.stringify(snapshot));
        localStorage.setItem('assoc_backup_slot', String(slot));
        localStorage.setItem('assoc_backup_last', snapshot.ts);
      } catch { /* ignore si localStorage plein */ }
    };
    const id = setInterval(doBackup, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, [globalParams, direction, services, poleSupport, poolRH, enveloppeFormation, reportingFC, donneesN1, planningAbsences, pilotageSites]);

  // Navigation inter-onglets RH ↔ Budget
  const [focusedAgentId, setFocusedAgentId] = useState(null);
  const navigateToBudgetAgent = (agentId) => {
    setActiveTab('budget');
    setFocusedAgentId(agentId);
    setTimeout(() => {
      const el = document.getElementById(`agent-budget-${agentId}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => setFocusedAgentId(null), 2500);
    }, 200);
  };
  const navigateToRHAgent = (agentId) => {
    setActiveTab('rh');
    setFocusedAgentId(agentId);
    setTimeout(() => {
      const el = document.getElementById(`agent-rh-${agentId}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => setFocusedAgentId(null), 2500);
    }, 200);
  };

  // Gestion des rôles personnalisés
  const [showRolesModal, setShowRolesModal] = useState(false);
  const roles = globalParams.rolesPersonnel || [];
  const setRoles = (fn) => setGlobalParams(prev => ({ ...prev, rolesPersonnel: typeof fn === 'function' ? fn(prev.rolesPersonnel || []) : fn }));

  // Remise à zéro globale
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [pilotageResetKey, setPilotageResetKey] = useState(0);

  const handleGlobalReset = async (resetPassword) => {
    const ok = await checkPassword(resetPassword);
    if (!ok) { return 'Mot de passe incorrect'; }
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
    setPoolRH([]);
    localStorage.removeItem('assoc_pool_rh');
    setGlobalParams(zeroGlobalParams);
    setDirection(zeroDirection);
    setServices(zeroServices);
    setPoleSupport(defaultPoleSupport);
    setPilotageSites(pilotageZeroSites);
    setPilotageResetKey(k => k + 1);
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 4000);
    return null;
  };

  // Gestion du mot de passe (uniquement en local)
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAICopilot, setShowAICopilot] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(false);
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  const handleLogout = () => {
    localStorage.removeItem('budget_authenticated');
    setIsAuthenticated(false);
  };

  const msETP = globalParams.montantSegurETP ?? PRIME_SEGUR;

  // Fonctions budget — useCallback pour stabiliser les références (évite re-renders en cascade dans SubventionRegion/DAF)
  const getBudgetDirection   = useCallback(() => calculerBudgetDirection(direction, planningAbsences, 2026, msETP, poolRH),   [direction, planningAbsences, msETP, poolRH]);
  const getBudgetPoleSupport = useCallback(() => calculerBudgetPoleSupport(poleSupport, planningAbsences, 2026, msETP, poolRH), [poleSupport, planningAbsences, msETP, poolRH]);
  const getBudgetService     = useCallback((service) => calculerBudgetService(service, planningAbsences, 2026, msETP, poolRH),  [planningAbsences, msETP, poolRH]);
  const getProvisions        = useCallback(() => calculerProvisions(direction, services, globalParams, poleSupport, poolRH),    [direction, services, globalParams, poleSupport, poolRH]);
  const getBFR               = useCallback(() => calculerBFR(direction, services, globalParams, poleSupport, poolRH),           [direction, services, globalParams, poleSupport, poolRH]);
  const getFondRoulement     = useCallback(() => calculerFondRoulement(direction, services, globalParams),                      [direction, services, globalParams]);

  // Callbacks stables pour SubventionRegion / DAF (sans planningAbsences = calcul budget pur)
  const cbBudgetSvc = useCallback(s  => calculerBudgetService(s, null, 2026, msETP, poolRH),   [msETP, poolRH]);
  const cbBudgetDir = useCallback(d  => calculerBudgetDirection(d, null, 2026, msETP, poolRH),  [msETP, poolRH]);
  const cbBudgetPS  = useCallback(ps => calculerBudgetPoleSupport(ps, null, 2026, msETP, poolRH),[msETP, poolRH]);
  const summary3Ans = useMemo(
    () => calculerSynthese3Ans(direction, services, globalParams, poleSupport, poolRH),
    [direction, services, globalParams, poleSupport, poolRH]
  );
  const budgetAnnuel = useMemo(
    () => calculerBudgetAnnuelMensuel(direction, services, globalParams, poleSupport, poolRH),
    [direction, services, globalParams, poleSupport, poolRH]
  );
  const tresorerie = useMemo(
    () => calculerTresorerieMensuelle(direction, services, globalParams, poleSupport, poolRH),
    [direction, services, globalParams, poleSupport, poolRH]
  );

  // ── Données consolidées cross-modules ───────────────────────────────────────

  // Masse salariale totale (RH + Pool RH), source unique de vérité
  const masseSalarialeTotal = useMemo(() => {
    const allP = [
      ...(direction?.personnel || []),
      ...(poleSupport?.personnel || []),
      ...services.flatMap(s => s.personnel || []),
      ...(poolRH || []),
    ];
    return allP.reduce((tot, p) => {
      const sr = p.segur === true ? msETP : (parseFloat(p.segur) || 0);
      return tot + calculerSalaireAnnuel(p.salaire, p.etp, sr, p.typeContrat, p.tauxChargesManuel).total;
    }, 0);
  }, [direction, poleSupport, services, poolRH, msETP]);

  // Personnel éligible subvention — cochés "Subvention" dans l'onglet RH/Budget
  const personnelEligibleSubvention = useMemo(() => {
    const all = [
      ...(direction?.personnel || []).map(p => ({ ...p, _source: 'Direction' })),
      ...(poleSupport?.personnel || []).map(p => ({ ...p, _source: 'Pôle Support' })),
      ...services.flatMap(s => (s.personnel || []).map(p => ({ ...p, _source: s.nom }))),
      ...(poolRH || []).map(p => ({ ...p, _source: 'Pool RH' })),
    ].filter(p => p.eligibleSubvention);
    return all.map(p => {
      const sr = p.segur === true ? msETP : (parseFloat(p.segur) || 0);
      const sal = calculerSalaireAnnuel(p.salaire, p.etp, sr, p.typeContrat, p.tauxChargesManuel);
      const pctFI = p.repartitionFI
        ? Math.min(1, Object.values(p.repartitionFI).reduce((s, v) => s + (parseFloat(v) || 0), 0) / 100)
        : 1;
      return { ...p, coutAnnuel: sal.total, pctFI: Math.round(pctFI * 100), coutSubventionnable: sal.total * pctFI };
    });
  }, [direction, poleSupport, services, msETP]);

  // Effectifs formation — source unique (calclerStatsFormation sur services.promos)
  const statsFormation = useMemo(() => ({
    effectifTotal: services.reduce((s, srv) => s + (srv.promos ? calculerStatsFormation(srv).effectifActuel : (srv.unites || 0)), 0),
    parService: services.map(srv => ({ id: srv.id, nom: srv.nom, stats: srv.promos ? calculerStatsFormation(srv) : null })),
  }), [services]);

  // Callback wizard setup — applique la configuration initiale à l'état global
  const handleWizardComplete = (data) => {
    if (data.globalParams) setGlobalParams(prev => ({ ...prev, ...data.globalParams }));
    if (data.direction)   setDirection(data.direction);
    if (data.poleSupport) setPoleSupport(data.poleSupport);
    if (data.services)    setServices(data.services);
    if (data.poolRH)      setPoolRH(data.poolRH);
    setShowWizardSetup(false);
    setActiveTab('budget');
  };

  const sauvegarderBudget = () => {
    const data = {
      version: '2.1', type: 'association', date: new Date().toISOString(),
      globalParams, direction, services, poleSupport, poolRH,
      enveloppeFormation, reportingFC, donneesN1, planningAbsences,
      pilotageSites, directionPosition, poleSupportPosition
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `budget_association_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const restaurerBackup = () => {
    try {
      const slot = parseInt(localStorage.getItem('assoc_backup_slot') || '0');
      if (!slot) { alert('Aucun backup automatique disponible.'); return; }
      const snapshots = [1, 2, 3]
        .map(i => { try { return JSON.parse(localStorage.getItem(`assoc_backup_${i}`) || 'null'); } catch { return null; } })
        .filter(Boolean)
        .sort((a, b) => new Date(b.ts) - new Date(a.ts));
      if (!snapshots.length) { alert('Aucun backup automatique disponible.'); return; }
      const snap = snapshots[0];
      const d = new Date(snap.ts).toLocaleString('fr-FR');
      if (!confirm(`Restaurer le backup du ${d} ?\n\nCela remplacera les données actuelles.`)) return;
      if (snap.globalParams) setGlobalParams(snap.globalParams);
      if (snap.direction)   setDirection(snap.direction);
      if (snap.services)    setServices(snap.services);
      if (snap.poleSupport) setPoleSupport(snap.poleSupport);
      if (snap.poolRH)      setPoolRH(snap.poolRH);
      if (snap.pilotageSites) setPilotageSites(snap.pilotageSites);
      if (snap.enveloppeFormation) setEnveloppeFormation(snap.enveloppeFormation);
      if (snap.reportingFC) setReportingFC(snap.reportingFC);
      if (snap.donneesN1)   setDonneesN1(snap.donneesN1);
      if (snap.planningAbsences) setPlanningAbsences(snap.planningAbsences);
      alert(`Backup du ${d} restauré avec succès.`);
    } catch { alert('Erreur lors de la restauration du backup.'); }
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
          if (data.poleSupport) setPoleSupport(data.poleSupport);
          if (data.poolRH) setPoolRH(data.poolRH);
          if (data.enveloppeFormation) setEnveloppeFormation(data.enveloppeFormation);
          if (data.reportingFC) setReportingFC(data.reportingFC);
          if (data.donneesN1) setDonneesN1(data.donneesN1);
          if (data.planningAbsences) setPlanningAbsences(data.planningAbsences);
          if (data.pilotageSites) setPilotageSites(data.pilotageSites);
          if (data.directionPosition !== undefined) setDirectionPosition(data.directionPosition);
          if (data.poleSupportPosition !== undefined) setPoleSupportPosition(data.poleSupportPosition);
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
  const totalRecettes = services.reduce((sum, s) => {
    if (stressTest !== 0) return sum + appliquerStressTest(s.recettes || [], stressTest);
    return sum + getBudgetService(s).recettes;
  }, 0);
  const totalRecettesBase = services.reduce((sum, s) => sum + getBudgetService(s).recettes, 0);
  const totalCharges = services.reduce((sum, s) => sum + getBudgetService(s).total, 0) + getBudgetDirection().total + getBudgetPoleSupport().total;
  const soldeGlobal = totalRecettes - totalCharges;
  const soldeGlobalBase = totalRecettesBase - totalCharges;
  const stressImpact = soldeGlobal - soldeGlobalBase;
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
  // Alertes RH (fins de contrat, retraites)
  calculerAlertesRH(direction, poleSupport, services).forEach(a => alertes.push(a));
  // Alertes cohérence Pool RH
  verifierCoherencePoolRH(poolRH).forEach(a =>
    alertes.push({ lvl: a.totalPct > 100 ? 'error' : 'warning', msg: `Pool RH — ${a.msg}` })
  );
  // Alerte trésorerie négative
  if (tresorerie.alertesMois.length > 0)
    alertes.push({ lvl: 'warning', msg: `Tension de trésorerie prévisionnelle : solde cumulé négatif en ${tresorerie.alertesMois.map(i => ['janv','févr','mars','avr','mai','juin','juil','août','sept','oct','nov','déc'][i]).join(', ')}` });

  return (
    <>
    {/* Startup gate — premier lancement */}
    {showStartupGate && (
      <StartupGate
        darkMode={darkMode}
        onStart={() => setShowStartupGate(false)}
      />
    )}
    {/* Modal hard reset */}
    {showHardReset && (
      <ModalHardReset
        darkMode={darkMode}
        onClose={() => setShowHardReset(false)}
      />
    )}
    {/* ═══ HEADER FIXE ═══ */}
    <div className={`fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 gap-4 border-b no-print transition-colors duration-300
      ${darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-slate-200 shadow-sm'}`}>
      {/* Logo + titre */}
      <div className="flex items-center gap-3 flex-shrink-0" style={{ paddingLeft: sidebarOpen ? '256px' : '56px', transition: 'padding-left 0.3s cubic-bezier(0.4,0,0.2,1)' }}>
        <img src="/logo.png" alt="" className={`h-7 ${darkMode ? 'brightness-200' : ''}`} onError={e => e.target.style.display='none'} />
        <div>
          <span className={`text-sm font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>Budget Association</span>
          <span className={`hidden sm:inline text-[11px] ml-2 ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>· Projection 3 ans</span>
        </div>
      </div>

      {/* KPIs inline */}
      <div className="hidden md:flex items-center gap-2 flex-1 justify-center">
        {[
          { label: 'Solde', val: `${soldeGlobal >= 0 ? '+' : ''}${Math.round(soldeGlobal/1000)}k €`, color: soldeGlobal >= 0 ? 'text-emerald-500' : 'text-rose-500' },
          { label: 'ETP', val: totalETP.toFixed(1), color: darkMode ? 'text-zinc-200' : 'text-slate-700' },
          { label: 'Couverture', val: `${Math.round(tauxCouverture)} %`, color: tauxCouverture >= 100 ? 'text-emerald-500' : 'text-rose-500' },
        ].map(k => (
          <div key={k.label} className={`text-center px-3 py-1 rounded-lg ${darkMode ? 'bg-zinc-900' : 'bg-slate-50'}`}>
            <div className={`text-[9px] font-bold uppercase tracking-wide ${darkMode ? 'text-zinc-600' : 'text-slate-400'}`}>{k.label}</div>
            <div className={`text-xs font-black font-mono-numbers ${k.color}`}>{k.val}</div>
          </div>
        ))}
        {stressTest !== 0 && (
          <div className="text-center px-3 py-1 rounded-lg bg-amber-500/15 border border-amber-500/25">
            <div className="text-[9px] font-bold uppercase tracking-wide text-amber-500">Stress {stressTest > 0 ? '+' : ''}{stressTest}%</div>
            <div className={`text-xs font-black font-mono-numbers ${stressImpact >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {stressImpact >= 0 ? '+' : ''}{Math.round(stressImpact/1000)}k €
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button onClick={sauvegarderBudget}
          className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 text-xs shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all duration-150">
          <Save size={13} /> Sauver
        </button>
        <button onClick={() => setDarkMode(!darkMode)}
          className={`p-2 rounded-xl text-sm ${darkMode ? 'bg-yellow-500 text-gray-900' : 'bg-zinc-800 text-white'}`}>
          {darkMode ? <Sun size={14} /> : <Moon size={14} />}
        </button>
        <button onClick={() => setActiveTab('parametres')}
          className={`p-2 rounded-xl border transition-colors ${darkMode ? 'border-zinc-700 text-zinc-400 hover:bg-zinc-800' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
          title="Paramètres">
          <Settings size={14} />
        </button>
        <button
          onClick={() => setPrivacyMode(v => !v)}
          title={privacyMode ? 'Désactiver le mode confidentialité' : 'Mode confidentialité — masquer les montants'}
          className={`p-2 rounded-xl border transition-all ${
            privacyMode
              ? 'bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-500/30'
              : darkMode
                ? 'border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-rose-400'
                : 'border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-500'
          }`}>
          {privacyMode ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
        <button
          onClick={() => setShowAICopilot(v => !v)}
          title="Copilote IA — Analyse stratégique"
          className={`p-2 rounded-xl border transition-all ${
            showAICopilot
              ? 'bg-violet-500 border-violet-500 text-white shadow-md shadow-violet-500/30'
              : darkMode
                ? 'border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-violet-400'
                : 'border-slate-200 text-slate-500 hover:bg-violet-50 hover:text-violet-500'
          }`}>
          <Brain size={14} />
        </button>
      </div>
    </div>

    {showAICopilot && (
      <AICopilot
        darkMode={darkMode}
        onClose={() => setShowAICopilot(false)}
        direction={direction}
        poleSupport={poleSupport}
        services={services}
        getBudgetDirection={getBudgetDirection}
        getBudgetPoleSupport={getBudgetPoleSupport}
        getBudgetService={getBudgetService}
        masseSalarialeTotal={masseSalarialeTotal}
        tresorerie={tresorerie}
      />
    )}

    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-zinc-950' : 'bg-gradient-to-br from-slate-50 via-slate-50 to-indigo-50/30'}`}>
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
      {showWizardSetup && (
        <WizardSetup
          onComplete={handleWizardComplete}
          onClose={() => setShowWizardSetup(false)}
          darkMode={darkMode}
        />
      )}
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

      <SidebarNav
        services={services}
        darkMode={darkMode}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Contenu principal — décalé du header fixe (56px) et de la sidebar */}
      <div className="main-content p-4 md:p-6 transition-all duration-300"
           style={{ marginLeft: sidebarOpen ? '256px' : '56px', marginRight: showAICopilot ? '320px' : '0', paddingTop: 'calc(56px + 1.5rem)' }}>
        <div className="max-w-[1600px] mx-auto">

          {/* ── TABLEAU DE BORD KPI ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {[
              { label: 'Recettes', val: `${Math.round(totalRecettes/1000)}k`, unit: '€', sub: 'annuelles', color: 'green', icon: <Banknote size={18}/>, help: 'Total des recettes annuelles : subventions Région, droits d\'inscription, produits des formations continues, contributions diverses.' },
              { label: 'Charges', val: `${Math.round(totalCharges/1000)}k`, unit: '€', sub: 'annuelles', color: 'red', icon: <TrendingDown size={18}/>, help: 'Total des charges annuelles : masse salariale (salaires bruts + charges patronales 42%) + frais d\'exploitation + amortissements.' },
              { label: 'Solde', val: `${soldeGlobal >= 0 ? '+' : ''}${Math.round(soldeGlobal/1000)}k`, unit: '€', sub: 'résultat', color: soldeGlobal >= 0 ? 'emerald' : 'orange', icon: soldeGlobal >= 0 ? <CheckCircle size={18}/> : <AlertTriangle size={18}/>, help: 'Solde = Recettes − Charges. Un solde positif indique un excédent ; négatif un déficit à combler (par réserves ou réduction de charges).' },
              { label: 'Couverture', val: `${tauxCouverture.toFixed(1)}`, unit: '%', sub: 'recettes/charges', color: tauxCouverture >= 100 ? 'teal' : 'amber', icon: <Target size={18}/>, help: 'Taux de couverture = Recettes / Charges × 100. Un taux ≥ 100 % signifie l\'équilibre financier. En dessous de 90 % : alerte. Objectif AFERTES : ≥ 100 %.' },
              { label: 'ETP total', val: totalETP.toFixed(1), unit: '', sub: 'équivalents temps plein', color: 'blue', icon: <Users size={18}/>, help: 'ETP = Équivalent Temps Plein. 1 ETP = 1 poste à temps complet (35h/sem). Un agent à 0,5 ETP travaille à mi-temps. Somme de tous les ETP contractuels (hors absences).' },
              { label: 'Coût/étudiant', val: totalEtudiants > 0 ? `${coutParEtudiant.toLocaleString()}` : '—', unit: '€', sub: `${totalEtudiants} étudiants`, color: 'purple', icon: <GraduationCap size={18}/>, help: 'Coût par étudiant = Charges totales / Nombre d\'étudiants (effectifs actuels de toutes les promos actives). Indicateur de rentabilité pédagogique.' },
            ].map((k, i) => {
              const colors = {
                green: { bg: 'bg-green-500', border: 'border-green-500/20', text: 'text-green-600', darkText: 'text-green-400', iconBg: 'bg-green-100', darkIconBg: 'bg-green-900/30' },
                red: { bg: 'bg-red-500', border: 'border-red-500/20', text: 'text-red-600', darkText: 'text-red-400', iconBg: 'bg-red-100', darkIconBg: 'bg-red-900/30' },
                emerald: { bg: 'bg-emerald-500', border: 'border-emerald-500/20', text: 'text-emerald-600', darkText: 'text-emerald-400', iconBg: 'bg-emerald-100', darkIconBg: 'bg-emerald-900/30' },
                orange: { bg: 'bg-orange-500', border: 'border-orange-500/20', text: 'text-orange-600', darkText: 'text-orange-400', iconBg: 'bg-orange-100', darkIconBg: 'bg-orange-900/30' },
                teal: { bg: 'bg-teal-500', border: 'border-teal-500/20', text: 'text-teal-600', darkText: 'text-teal-400', iconBg: 'bg-teal-100', darkIconBg: 'bg-teal-900/30' },
                amber: { bg: 'bg-amber-500', border: 'border-amber-500/20', text: 'text-amber-600', darkText: 'text-amber-400', iconBg: 'bg-amber-100', darkIconBg: 'bg-amber-900/30' },
                blue: { bg: 'bg-blue-500', border: 'border-blue-500/20', text: 'text-blue-600', darkText: 'text-blue-400', iconBg: 'bg-blue-100', darkIconBg: 'bg-blue-900/30' },
                purple: { bg: 'bg-purple-500', border: 'border-purple-500/20', text: 'text-purple-600', darkText: 'text-purple-400', iconBg: 'bg-purple-100', darkIconBg: 'bg-purple-900/30' },
              };
              const c = colors[k.color];
              return (
                <div key={i} className={`relative group rounded-3xl p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:z-50 border
                  ${darkMode ? 'bg-zinc-900/80 border-zinc-700/30 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.12)]' : 'bg-white border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm'}`}>
                  
                  {/* Subtle Gradient Spot */}
                  <div className={`absolute -top-10 -right-10 w-24 h-24 ${c.bg}/10 blur-3xl group-hover:${c.bg}/20 transition-all duration-500`}></div>

                  <div className="flex flex-col h-full justify-between relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2 rounded-2xl ${darkMode ? c.darkIconBg : c.iconBg}`}>
                        <span className={darkMode ? c.darkText : c.text}>{k.icon}</span>
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                        {k.sub}
                      </span>
                    </div>
                    
                    <div>
                      <h3 className={`text-xs font-bold mb-1 flex items-center gap-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                        {k.label}
                        {k.help && <HelpIcon darkMode={darkMode} content={k.help} position="top" wide />}
                      </h3>
                      <div className="flex items-baseline gap-1">
                        <span className={`text-2xl font-black font-mono-numbers tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>{k.val}</span>
                        <span className={`text-sm font-bold ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>{k.unit}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── ALERTES AUTOMATIQUES ── */}
          {alertes.length > 0 && (
            <div className={`mb-6 rounded-2xl border overflow-hidden ${darkMode ? 'border-zinc-700/50' : 'border-slate-200'}`}>
              <div className={`px-4 py-2 flex items-center gap-2 ${darkMode ? 'bg-zinc-800/60' : 'bg-slate-50'}`}>
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

          {/* Stress Test Bar — simulateur d'aléas */}
          <StressTestBar
            stressTest={stressTest}
            setStressTest={setStressTest}
            impact={stressImpact}
            darkMode={darkMode}
          />

        <ModalRoles darkMode={darkMode} showRolesModal={showRolesModal} setShowRolesModal={setShowRolesModal} roles={roles} setRoles={setRoles} />

        <ModalReset darkMode={darkMode} showResetModal={showResetModal} setShowResetModal={setShowResetModal} onConfirm={handleGlobalReset} />

        {/* Notification remise à zéro */}
        {resetSuccess && (
          <div className={`mb-4 p-4 rounded-2xl flex items-center gap-3 ${darkMode ? 'bg-green-900/40 border border-green-700' : 'bg-green-50 border border-green-200'}`}>
            <CheckCircle className="text-green-500 flex-shrink-0" size={20} />
            <span className={`font-bold text-sm ${darkMode ? 'text-green-300' : 'text-green-700'}`}>
              Toutes les données ont été réinitialisées avec succès.
            </span>
          </div>
        )}

        <ModalPassword darkMode={darkMode} showPasswordModal={showPasswordModal} setShowPasswordModal={setShowPasswordModal} />

        {/* ═══ BARRE D'ONGLETS ═══ */}
        <div className={`mb-8 p-1.5 rounded-2xl no-print backdrop-blur-md border transition-all duration-500 ${darkMode ? 'bg-zinc-900/80 border-zinc-700/40' : 'bg-slate-100/90 border-slate-200/60'}`}>
          <div className="flex gap-1 overflow-x-auto scrollbar-none">
          {[
            { id: 'dashboard',   label: 'Tableau de bord', icon: <Home size={15}/> },
            { id: 'budget',      label: 'Budget',           icon: <Building2 size={15}/> },
            { id: 'analyse',     label: 'Analyse',          icon: <BarChart3 size={15}/> },
            { id: 'rh',          label: 'RH',               icon: <Users size={15}/> },
            { id: 'formation',   label: 'Formation',        icon: <GraduationCap size={15}/> },
            { id: 'vacataires',  label: 'Vacataires',       icon: <Users size={15}/> },
            { id: 'subvention',  label: 'Subvention',       icon: <Landmark size={15}/> },
            { id: 'daf',         label: 'DAF',              icon: <Calculator size={15}/> },
            { id: 'parametres',  label: 'Paramètres',       icon: <Settings size={15}/> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 whitespace-nowrap ${
                activeTab === tab.id
                  ? darkMode ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30' : 'bg-white text-indigo-700 shadow-md shadow-indigo-100'
                  : darkMode ? 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60' : 'text-slate-500 hover:text-slate-700 hover:bg-white/70'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
          </div>
        </div>

        {/* ─── CONTENU AVEC TRANSITION ─── */}
        <div key={activeTab} className="animate-in fade-in duration-500">
        {activeTab === 'dashboard' && <>

        {/* COMPARAISON BUDGET VOTÉ */}
        {compareSnapshot && (() => {
          const snap = loadSnapshot();
          if (!snap) return null;
          const fmtDelta = (cur, ref) => {
            const d = cur - ref;
            const pct = ref !== 0 ? ((d / Math.abs(ref)) * 100).toFixed(1) : '—';
            const cls = d >= 0 ? 'text-emerald-500' : 'text-rose-500';
            return <span className={`font-black font-mono-numbers text-xs ${cls}`}>{d >= 0 ? '+' : ''}{Math.round(d).toLocaleString()} € ({pct} %)</span>;
          };
          const snapServices = snap.services || [];
          return (
            <div className={`rounded-3xl border p-6 mb-6 ${darkMode ? 'bg-indigo-950/40 border-indigo-700/40' : 'bg-indigo-50 border-indigo-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-base font-black flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                  <GitCompare size={18} className="text-indigo-500" /> Comparaison — Budget Voté vs Actuel
                  <span className={`text-xs font-normal ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
                    Figé le {new Date(snap.savedAt).toLocaleDateString('fr-FR')}
                  </span>
                </h2>
                <button onClick={() => setCompareSnapshot(false)} className={`text-xs px-2 py-1 rounded-lg ${darkMode ? 'text-zinc-400 hover:bg-zinc-800' : 'text-slate-400 hover:bg-white'}`}>✕</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`text-[10px] font-bold uppercase tracking-wide border-b ${darkMode ? 'text-zinc-500 border-zinc-700' : 'text-slate-400 border-slate-200'}`}>
                      <th className="text-left py-2 pr-4">Service</th>
                      <th className="text-right py-2 px-3">Budget Voté</th>
                      <th className="text-right py-2 px-3">Actuel</th>
                      <th className="text-right py-2 pl-3">Écart</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map(srv => {
                      const cur = getBudgetService(srv);
                      const ref = snapServices.find(s => s.id === srv.id);
                      if (!ref) return null;
                      const refBudget = calculerBudgetService(ref, null, 2026, msETP, poolRH);
                      return (
                        <tr key={srv.id} className={`border-b ${darkMode ? 'border-zinc-800' : 'border-slate-100'}`}>
                          <td className={`py-2 pr-4 font-medium ${darkMode ? 'text-white' : 'text-slate-800'}`}>{srv.nom}</td>
                          <td className={`py-2 px-3 text-right font-mono-numbers ${darkMode ? 'text-zinc-300' : 'text-slate-600'}`}>{Math.round(refBudget.total).toLocaleString()} €</td>
                          <td className={`py-2 px-3 text-right font-mono-numbers ${darkMode ? 'text-zinc-300' : 'text-slate-600'}`}>{Math.round(cur.total).toLocaleString()} €</td>
                          <td className="py-2 pl-3 text-right">{fmtDelta(cur.total, refBudget.total)}</td>
                        </tr>
                      );
                    })}
                    <tr className={`border-t-2 ${darkMode ? 'border-zinc-700' : 'border-slate-300'}`}>
                      <td className={`py-2 pr-4 font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>TOTAL CHARGES</td>
                      <td className={`py-2 px-3 text-right font-black font-mono-numbers ${darkMode ? 'text-zinc-200' : 'text-slate-700'}`}>
                        {Math.round(snapServices.reduce((s, r) => s + calculerBudgetService(r, null, 2026, msETP, poolRH).total, 0)).toLocaleString()} €
                      </td>
                      <td className={`py-2 px-3 text-right font-black font-mono-numbers ${darkMode ? 'text-zinc-200' : 'text-slate-700'}`}>{Math.round(totalCharges).toLocaleString()} €</td>
                      <td className="py-2 pl-3 text-right">
                        {fmtDelta(totalCharges, snapServices.reduce((s, r) => s + calculerBudgetService(r, null, 2026, msETP, poolRH).total, 0))}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        {/* BUDGET ANNUEL */}
        <div id="budget-annuel" className={`rounded-3xl border p-8 mb-8 backdrop-blur-md transition-all duration-300 ${darkMode ? 'bg-zinc-900/80 border-zinc-700/30 shadow-[0_8px_30px_rgb(0,0,0,0.12)]' : 'bg-white border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'}`}>
          <h2 className={`text-xl font-black mb-6 flex items-center gap-3 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-500"><Calendar size={22} /></div>
            Budget Annuel - Répartition mensuelle
          </h2>
          <div className="grid grid-cols-12 gap-3 mb-8 h-48 items-end">
            {budgetAnnuel.mois.map((m, i) => {
              const maxMois = Math.max(...budgetAnnuel.mois.map(x => x.total));
              const heightPct = maxMois > 0 ? (m.total / maxMois) * 100 : 0;
              return (
                <div key={i} className="flex flex-col items-center group h-full justify-end">
                  <div className="w-full relative group">
                    <div className="w-full bg-gradient-to-t from-teal-500 to-cyan-400 rounded-t-xl transition-all duration-500 group-hover:brightness-110 group-hover:shadow-lg group-hover:shadow-teal-500/20" 
                         style={{ height: `${heightPct}%`, minHeight: '4px' }}>
                    </div>
                    {/* Tooltip on hover */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                      {Math.round(m.total).toLocaleString()} €
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold mt-3 uppercase tracking-tighter ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>{nomsMois[i]}</span>
                  <span className={`text-[11px] font-black font-mono-numbers ${darkMode ? 'text-teal-400' : 'text-teal-600'}`}>{Math.round(m.total / 1000)}k</span>
                </div>
              );
            })}
          </div>
          <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t ${darkMode ? 'border-white/5' : 'border-slate-100'}`}>
            {[
              { label: 'Masse salariale', val: budgetAnnuel.salaires, cls: darkMode ? 'text-blue-400' : 'text-blue-600' },
              { label: 'Exploitation', val: budgetAnnuel.exploitation, cls: darkMode ? 'text-teal-400' : 'text-teal-600' },
              { label: 'Amortissements', val: budgetAnnuel.amortissements, cls: darkMode ? 'text-orange-400' : 'text-orange-600' },
              { label: 'Total annuel', val: budgetAnnuel.totalAnnuel, cls: darkMode ? 'text-purple-400' : 'text-purple-600' }
            ].map((k, idx) => (
              <div key={idx} className={`p-4 rounded-2xl transition-all duration-300 ${
                darkMode ? 'bg-gray-700/30 hover:bg-gray-700/50' : 'bg-slate-50/50 hover:bg-slate-50'
              }`}>
                <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${k.cls}`}>{k.label}</div>
                <div className={`text-lg font-black font-mono-numbers ${darkMode ? 'text-white' : 'text-slate-900'}`}>{Math.round(k.val).toLocaleString()} <span className="text-xs font-bold opacity-50 text-slate-500">€</span></div>
              </div>
            ))}
          </div>
        </div>

        <TabTresorerie tresorerie={tresorerie} darkMode={darkMode} />

        {/* KPI IMPACT ABSENCES — Planning → Budget */}
        {(() => {
          const ANNEE = 2026;
          const tousAgentsDash = [
            ...(direction?.personnel || []).map(p => ({ ...p, source: 'Direction' })),
            ...(poleSupport?.personnel || []).map(p => ({ ...p, source: 'Pôle Support' })),
            ...services.flatMap(s => (s.personnel || []).map(p => ({ ...p, source: s.nom }))),
          ];
          const apDash = calculerPresenceEquipe(tousAgentsDash, planningAbsences, ANNEE);
          const totalETPc = apDash.reduce((s, a) => s + parseFloat(a.etp), 0);
          const totalETPr = apDash.reduce((s, a) => s + a.presence.etpReel, 0);
          const deltaETP = totalETPc - totalETPr;
          const totalCarence = apDash.reduce((s, a) => s + a.presence.coutCarence, 0);
          const totalMaladieJ = apDash.reduce((s, a) => s + a.presence.joursMaladiePlanning, 0);
          const tauxPres = totalETPc > 0 ? (totalETPr / totalETPc) * 100 : 100;
          const hasAbsences = apDash.some(a => a.presence.absences.total > 0);
          if (!hasAbsences) return null;
          return (
            <div className={`rounded-2xl border-2 px-5 py-3 mb-6 flex flex-wrap items-center gap-4 ${darkMode ? 'bg-gray-800/60 border-amber-800' : 'bg-amber-50 border-amber-200'}`}>
              <div className="flex items-center gap-2 mr-2">
                <AlertTriangle size={18} className={darkMode ? 'text-amber-400' : 'text-amber-600'} />
                <span className={`text-sm font-black ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>Impact absences planning {ANNEE}</span>
              </div>
              {[
                { label: 'ETP contrat', val: totalETPc.toFixed(1), color: darkMode ? 'text-gray-300' : 'text-slate-700' },
                { label: 'ETP réel (planning)', val: totalETPr.toFixed(1), color: darkMode ? 'text-teal-300' : 'text-teal-700' },
                { label: 'ETP perdus', val: `-${deltaETP.toFixed(2)}`, color: deltaETP > 0.1 ? (darkMode ? 'text-red-400' : 'text-red-600') : (darkMode ? 'text-emerald-400' : 'text-emerald-600') },
                { label: 'Taux présence', val: `${tauxPres.toFixed(1)}%`, color: tauxPres < 95 ? (darkMode ? 'text-amber-400' : 'text-amber-700') : (darkMode ? 'text-emerald-400' : 'text-emerald-600') },
                { label: 'J. maladie', val: `${totalMaladieJ}j`, color: darkMode ? 'text-red-400' : 'text-red-600' },
                { label: 'Coût carence', val: `${Math.round(totalCarence).toLocaleString()} €`, color: darkMode ? 'text-orange-400' : 'text-orange-700' },
              ].map((k, i) => (
                <div key={i} className="text-center">
                  <div className={`text-xs font-bold opacity-70 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{k.label}</div>
                  <div className={`text-base font-black ${k.color}`}>{k.val}</div>
                </div>
              ))}
            </div>
          );
        })()}

        {/* SYNTHESE 3 ANS - CARTES */}
        {/* ── INDICE GVT ─────────────────────────────────────────── */}
        {(() => {
          const tauxGVT = globalParams.tauxGVT ?? 1.5;
          const gvtAn2 = (Math.pow(1 + tauxGVT / 100, 1) - 1) * 100;
          const gvtAn3 = (Math.pow(1 + tauxGVT / 100, 2) - 1) * 100;
          const impactGVTAn2 = masseSalarialeTotal * (Math.pow(1 + tauxGVT / 100, 1) - 1);
          const impactGVTAn3 = masseSalarialeTotal * (Math.pow(1 + tauxGVT / 100, 2) - 1);
          return (
            <div className={`rounded-2xl border p-4 mb-5 flex flex-wrap items-center gap-4 ${darkMode ? 'bg-zinc-800/60 border-zinc-700' : 'bg-amber-50 border-amber-200'}`}>
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${darkMode ? 'bg-amber-900/40' : 'bg-amber-100'}`}>
                  <TrendingUp size={15} className={darkMode ? 'text-amber-400' : 'text-amber-600'} />
                </div>
                <div>
                  <span className={`text-xs font-black uppercase tracking-wide ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>Indice GVT</span>
                  <InfoTooltip darkMode={darkMode} content="GVT = Glissement Vieillesse Technicité. Mesure l'augmentation automatique de la masse salariale liée à l'ancienneté et aux changements d'échelon, indépendamment des augmentations générales. Taux paramétrable dans les Paramètres généraux." />
                </div>
              </div>
              <div className="flex gap-4 text-xs flex-wrap">
                <div className={`px-3 py-1.5 rounded-lg ${darkMode ? 'bg-zinc-700' : 'bg-white border border-amber-100'}`}>
                  <span className={`font-bold ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Taux / an : </span>
                  <span className={`font-black ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>{tauxGVT.toFixed(1)}%</span>
                </div>
                {masseSalarialeTotal > 0 && <>
                  <div className={`px-3 py-1.5 rounded-lg ${darkMode ? 'bg-zinc-700' : 'bg-white border border-amber-100'}`}>
                    <span className={`font-bold ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>An 2 : </span>
                    <span className={`font-black text-amber-500`}>+{gvtAn2.toFixed(1)}% → +{Math.round(impactGVTAn2 / 1000)}k €</span>
                  </div>
                  <div className={`px-3 py-1.5 rounded-lg ${darkMode ? 'bg-zinc-700' : 'bg-white border border-amber-100'}`}>
                    <span className={`font-bold ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>An 3 : </span>
                    <span className={`font-black text-orange-500`}>+{gvtAn3.toFixed(1)}% → +{Math.round(impactGVTAn3 / 1000)}k €</span>
                  </div>
                </>}
              </div>
              <div className={`ml-auto text-[10px] ${darkMode ? 'text-zinc-600' : 'text-amber-400'}`}>impact cumulé sur la masse salariale</div>
            </div>
          );
        })()}

        <div id="synthese-3ans" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {summary3Ans.map((s, idx) => {
            const tauxGVT = globalParams.tauxGVT ?? 1.5;
            const gvtPct = idx > 0 ? (Math.pow(1 + tauxGVT / 100, idx) - 1) * 100 : 0;
            return (
            <div key={s.annee} className={`p-6 rounded-3xl shadow-lg border-2 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gradient-to-br from-white to-cyan-50 border-teal-200'}`}>
              <div className="flex justify-between items-start mb-4">
                <span className="text-sm font-black uppercase text-teal-400">Année {s.annee}</span>
                <div className="flex items-center gap-2">
                  {idx > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-black">
                      GVT +{gvtPct.toFixed(1)}%
                    </span>
                  )}
                  <TrendingUp className="text-teal-500" size={20} />
                </div>
              </div>
              <div className={`text-3xl font-black mb-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>{Math.round(s.total).toLocaleString()} €</div>
              <div className={`text-sm space-y-1 ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1">
                    Amortissements
                    <InfoTooltip darkMode={darkMode} content="Charge comptable uniquement — étalement du coût d'un investissement sur sa durée de vie. N'est PAS un flux de trésorerie (pas de décaissement bancaire). À distinguer du remboursement d'emprunt." />
                  </span>
                  <span className="font-bold">{Math.round(s.amortissements).toLocaleString()} €</span>
                </div>
                <div className="flex justify-between"><span>Intérêts:</span><span className="font-bold">{Math.round(s.interets).toLocaleString()} €</span></div>
                <div className="flex justify-between"><span>Siège:</span><span className="font-bold">{Math.round(s.budgetDirection).toLocaleString()} €</span></div>
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
          );})}
        </div>

        {/* ── SYNTHÈSE BUDGÉTAIRE AUTOMATIQUE + IFC ───────────────────────────── */}
        {(() => {
          // ── Synthèse textuelle ──
          const bDir = getBudgetDirection();
          const bPS  = getBudgetPoleSupport();
          const masseSalariale = services.reduce((s, srv) => s + getBudgetService(srv).salaires, 0)
            + bDir.salaires + bPS.salaires;
          const ratioSal = totalCharges > 0 ? Math.round(masseSalariale / totalCharges * 100) : 0;
          const toutesLignes = [
            ...(direction.chargesSiege || []),
            ...(poleSupport?.exploitation || []),
            ...services.flatMap(s => s.exploitation || []),
          ];
          const topPoste = toutesLignes
            .map(l => ({ nom: l.nom || '—', montant: (l.montant || 0) * 12 }))
            .sort((a, b) => b.montant - a.montant)[0];
          const signeSolde = soldeGlobal >= 0 ? 'excédentaire' : 'déficitaire';
          let synthese = `Le budget prévisionnel 2026 présente un résultat ${signeSolde} de ${Math.abs(Math.round(soldeGlobal)).toLocaleString('fr-FR')} €`;
          synthese += ` (taux de couverture : ${Math.round(tauxCouverture)}%).`;
          synthese += ` La masse salariale représente ${ratioSal}% des charges totales (${Math.round(masseSalariale).toLocaleString('fr-FR')} €).`;
          if (topPoste?.montant > 0) synthese += ` Le poste de dépense le plus important hors salaires est "${topPoste.nom}" avec ${Math.round(topPoste.montant).toLocaleString('fr-FR')} €/an.`;
          if (soldeGlobal < 0) synthese += ` ⚠️ Un déficit prévisionnel est identifié — revoir les leviers de recettes ou contenir les charges.`;
          else if (tauxCouverture >= 105) synthese += ` ✓ L'excédent constitue une réserve de gestion permettant de sécuriser la trésorerie.`;

          // ── IFC — msETP transmis pour cohérence avec le budget ──
          const ifc = calculerIFC(direction, services, poleSupport, 2026, 62, 8, msETP);

          return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Synthèse automatique */}
              <div className={`rounded-3xl shadow-lg border-2 p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
                <h2 className={`text-lg font-black mb-3 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                  <FileSpreadsheet size={20} className="text-violet-500" /> Synthèse automatique
                </h2>
                <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>{synthese}</p>
                <div className={`mt-4 pt-4 border-t flex gap-6 ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
                  <div>
                    <div className={`text-[10px] font-bold uppercase ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Solde</div>
                    <div className={`text-lg font-black ${soldeGlobal >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {soldeGlobal >= 0 ? '+' : ''}{Math.round(soldeGlobal).toLocaleString()} €
                    </div>
                  </div>
                  <div>
                    <div className={`text-[10px] font-bold uppercase ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Masse sal.</div>
                    <div className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>{ratioSal}%</div>
                  </div>
                  <div>
                    <div className={`text-[10px] font-bold uppercase ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Couverture</div>
                    <div className={`text-lg font-black ${tauxCouverture >= 100 ? 'text-emerald-500' : tauxCouverture >= 90 ? 'text-amber-500' : 'text-rose-500'}`}>{Math.round(tauxCouverture)}%</div>
                  </div>
                </div>
              </div>

              {/* IFC — Indemnités de Fin de Carrière */}
              <div className={`rounded-3xl shadow-lg border-2 p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
                <h2 className={`text-lg font-black mb-1 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                  <Clock size={20} className="text-rose-500" /> Provisions IFC
                </h2>
                <p className={`text-xs mb-3 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Indemnités de Fin de Carrière — agents à ≤ 8 ans de la retraite</p>
                {ifc.agents.length === 0
                  ? <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Aucun agent avec année de naissance et d'entrée renseignées, ou aucun départ prévu dans les 8 ans.</p>
                  : <>
                    <div className="space-y-2 mb-3">
                      {ifc.agents.slice(0, 4).map(a => (
                        <div key={a.id} className={`p-2 rounded-xl ${darkMode ? 'bg-gray-700/60' : 'bg-slate-50'}`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{a.nom}</span>
                              <span className={`text-xs ml-2 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{a.source}</span>
                            </div>
                            <div className="text-right">
                              <div className={`text-xs font-black ${a.anneesAvantRetraite <= 2 ? 'text-rose-500' : a.anneesAvantRetraite <= 5 ? 'text-orange-500' : 'text-amber-500'}`}>
                                retraite dans {a.anneesAvantRetraite} an{a.anneesAvantRetraite > 1 ? 's' : ''}
                              </div>
                              <div className={`text-sm font-black ${darkMode ? 'text-white' : 'text-slate-700'}`}>{a.provision.toLocaleString()} €</div>
                            </div>
                          </div>
                          <div className={`text-[10px] mt-1 flex gap-2 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                            <span>{a.age} ans · {a.anciennete} ans anc.</span>
                            <span>base : {a.salaireBrutMensuel.toLocaleString()} €/mois{a.segurInclus ? ' (Ségur inclus)' : ''}</span>
                          </div>
                        </div>
                      ))}
                      {ifc.agents.length > 4 && <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>+{ifc.agents.length - 4} autre(s)…</p>}
                    </div>
                    <div className={`pt-3 border-t flex justify-between items-center ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
                      <span className={`text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Provision totale estimée</span>
                      <span className={`text-lg font-black text-rose-500`}>{ifc.totalProvision.toLocaleString()} €</span>
                    </div>
                  </>
                }
              </div>
            </div>
          );
        })()}

        {/* ── POINT MORT PAR SERVICE ──────────────────────────────────────────── */}
        {(() => {
          const MOTS_RSE = ['énergie','electricité','électricité','carburant','transport','gaz','fuel','déplacement','co2'];
          const MOTS_AGENDA_TOP = 5;

          // Point mort
          const pointsMorts = services.map(s => {
            const b = getBudgetService(s);
            const stats = calculerStatsFormation(s);
            const effectifActuel = stats.effectifActuel || s.unites || 0;
            const recetteParEtudiant = effectifActuel > 0 ? b.recettes / effectifActuel : 0;
            const pointMort = recetteParEtudiant > 0 ? Math.ceil(b.total / recetteParEtudiant) : null;
            return { nom: s.nom, total: b.total, recettes: b.recettes, effectifActuel, recetteParEtudiant, pointMort };
          }).filter(pm => pm.pointMort !== null && pm.effectifActuel > 0);

          // RSE : cumul par entité toutes exploitations
          const toutesExploitations = [
            ...(direction.chargesSiege || []),
            ...(poleSupport?.exploitation || []),
            ...services.flatMap(s => s.exploitation || []),
          ];
          const rseCategs = { Énergie: 0, Carburant: 0, Transport: 0, Gaz: 0, Autres: 0 };
          toutesExploitations.forEach(ligne => {
            const nom = (ligne.nom || '').toLowerCase();
            const montantAnnuel = (ligne.montant || 0) * 12;
            if (nom.includes('énerg') || nom.includes('electr') || nom.includes('électr')) rseCategs.Énergie += montantAnnuel;
            else if (nom.includes('carburant') || nom.includes('fuel')) rseCategs.Carburant += montantAnnuel;
            else if (nom.includes('transport') || nom.includes('déplacement') || nom.includes('deplacement')) rseCategs.Transport += montantAnnuel;
            else if (nom.includes('gaz')) rseCategs.Gaz += montantAnnuel;
            else if (MOTS_RSE.some(m => nom.includes(m))) rseCategs.Autres += montantAnnuel;
          });
          const totalRSE = Object.values(rseCategs).reduce((a, b) => a + b, 0);
          const rseData = Object.entries(rseCategs).filter(([, v]) => v > 0).map(([k, v]) => ({ name: k, montant: v }));

          // Agenda : top charges
          const agendaItems = toutesExploitations
            .map(l => ({ nom: l.nom || '—', montant: (l.montant || 0) * 12 }))
            .filter(l => l.montant > 0)
            .sort((a, b) => b.montant - a.montant)
            .slice(0, MOTS_AGENDA_TOP);

          return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

              {/* Point mort par service */}
              <div className={`rounded-3xl shadow-lg border-2 p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
                <h2 className={`text-lg font-black mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                  <Target size={20} className="text-rose-500" /> Seuil de rentabilité
                </h2>
                {pointsMorts.length === 0
                  ? <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Aucun service avec effectif et recettes définis.</p>
                  : pointsMorts.map(pm => {
                    const pct = pm.pointMort > 0 ? Math.min(100, Math.round(pm.effectifActuel / pm.pointMort * 100)) : 0;
                    const ok = pm.effectifActuel >= pm.pointMort;
                    return (
                      <div key={pm.nom} className="mb-4 last:mb-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <span className={`text-xs font-bold truncate max-w-[55%] ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>{pm.nom}</span>
                          <span className={`text-xs font-black ${ok ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {pm.effectifActuel} / {pm.pointMort} étud.
                          </span>
                        </div>
                        <div className={`h-2.5 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-slate-100'}`}>
                          <div className={`h-full rounded-full transition-all ${ok ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${pct}%` }} />
                        </div>
                        <div className={`mt-0.5 text-[10px] ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                          Seuil : {pm.pointMort} étudiants · {ok ? '✓ équilibré' : `−${pm.pointMort - pm.effectifActuel} manquant${pm.pointMort - pm.effectifActuel > 1 ? 's' : ''}`}
                        </div>
                      </div>
                    );
                  })
                }
              </div>

              {/* Dashboard RSE */}
              <div className={`rounded-3xl shadow-lg border-2 p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
                <h2 className={`text-lg font-black mb-1 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                  <Leaf size={20} className="text-emerald-500" /> Budget RSE
                </h2>
                <p className={`text-xs mb-4 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Dépenses énergie / transport / carburant</p>
                {totalRSE === 0
                  ? <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Aucune ligne de type RSE détectée. Nommez vos lignes exploitation : "Énergie", "Carburant", "Transport"…</p>
                  : <>
                    <div className={`text-2xl font-black mb-3 ${darkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>{Math.round(totalRSE).toLocaleString()} €/an</div>
                    <div className="space-y-2">
                      {rseData.map(d => (
                        <div key={d.name}>
                          <div className="flex justify-between text-xs mb-0.5">
                            <span className={darkMode ? 'text-gray-300' : 'text-slate-600'}>{d.name}</span>
                            <span className={`font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>{Math.round(d.montant).toLocaleString()} €</span>
                          </div>
                          <div className={`h-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-slate-100'}`}>
                            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${Math.round(d.montant / totalRSE * 100)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                }
              </div>

              {/* Notification Agenda */}
              <div className={`rounded-3xl shadow-lg border-2 p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
                <h2 className={`text-lg font-black mb-1 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                  <Bell size={20} className="text-amber-500" /> Top décaissements
                </h2>
                <p className={`text-xs mb-4 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>5 postes d'exploitation les plus lourds</p>
                {agendaItems.length === 0
                  ? <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Aucune charge d'exploitation saisie.</p>
                  : <ol className="space-y-2">
                    {agendaItems.map((item, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                          i === 0 ? 'bg-amber-500 text-white' : i === 1 ? 'bg-amber-400/80 text-white' : darkMode ? 'bg-gray-700 text-gray-400' : 'bg-slate-100 text-slate-500'
                        }`}>{i + 1}</span>
                        <span className={`flex-1 text-sm truncate ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>{item.nom}</span>
                        <span className={`text-sm font-black flex-shrink-0 ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>{Math.round(item.montant).toLocaleString()} €</span>
                      </li>
                    ))}
                  </ol>
                }
              </div>
            </div>
          );
        })()}

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
                Siège: Math.round(s.budgetDirection),
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
                <Bar dataKey="Siège" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
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
                    { name: 'Siège', value: Math.round(summary3Ans[0].budgetDirection) },
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
        </>}

        {/* ─── ANALYSE FINANCIÈRE ─── */}
        {activeTab === 'analyse' && <TabAnalyse
          darkMode={darkMode}
          direction={direction}
          poleSupport={poleSupport}
          services={services}
          globalParams={globalParams}
          setGlobalParams={setGlobalParams}
          donneesN1={donneesN1}
          setDonneesN1={setDonneesN1}
          setShowImportN1={setShowImportN1}
          simCharges={simCharges}
          setSimCharges={setSimCharges}
          simRegion={simRegion}
          setSimRegion={setSimRegion}
          getBudgetDirection={getBudgetDirection}
          getBudgetPoleSupport={getBudgetPoleSupport}
          getBudgetService={getBudgetService}
          getProvisions={getProvisions}
          getBFR={getBFR}
          getFondRoulement={getFondRoulement}
          msETP={msETP}
          planningAbsences={planningAbsences}
          poolRH={poolRH}
          masseSalarialeTotal={masseSalarialeTotal}
          statsFormation={statsFormation}
          personnelEligibleSubvention={personnelEligibleSubvention}
        />}


        {/* ─── BUDGET ─── */}
        {activeTab === 'budget' && <>

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
                    className={`rounded-3xl shadow-xl border p-8 print-avoid-break transition-all duration-300 backdrop-blur-md
                      ${isDirDragging ? 'opacity-40 scale-95' : 'hover:shadow-2xl'}
                      ${isDirOver ? 'ring-2 ring-teal-400 ring-offset-4' : ''}
                      ${darkMode ? 'bg-zinc-900/80 border-zinc-700/30' : 'bg-white border-slate-100/80'}`}
                  >
                    <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className={`cursor-grab active:cursor-grabbing p-2 rounded-xl no-print transition-colors ${darkMode ? 'bg-white/5 text-gray-500 hover:text-gray-300' : 'bg-slate-100 text-slate-300 hover:text-slate-500'}`} title="Déplacer Siège"><GripVertical size={20} /></div>
                        <div className="flex flex-col gap-0.5 no-print">
                          <button disabled={pos === 0} onClick={() => setDirectionPosition(p => Math.max(0, p-1))} className={`p-1 rounded-lg transition-colors ${pos===0?'opacity-20 cursor-not-allowed':'hover:bg-teal-500/10 text-teal-500'}`}><ChevronUp size={14}/></button>
                          <button disabled={pos === orderedItems.length - 1} onClick={() => setDirectionPosition(p => Math.min(services.length + 1, p+1))} className={`p-1 rounded-lg transition-colors ${pos===orderedItems.length-1?'opacity-20 cursor-not-allowed':'hover:bg-teal-500/10 text-teal-500'}`}><ChevronDown size={14}/></button>
                        </div>
                        <div className="p-3 rounded-2xl bg-teal-500/10 text-teal-600 shadow-inner">
                          <Building2 size={32} />
                        </div>
                        <div>
                          <h2 className={`text-2xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-800'}`}>Siège</h2>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 font-bold">{direction.personnel.reduce((s, p) => s + p.etp, 0).toFixed(1)} ETP</span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Siège administratif</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Budget annuel estimé</div>
                        <span className={`text-3xl font-black font-mono-numbers ${darkMode ? 'text-teal-400' : 'text-teal-600'}`}>{Math.round(getBudgetDirection().total).toLocaleString()} <span className="text-lg opacity-50 font-sans">€</span></span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className={`p-6 rounded-2xl border transition-all duration-300 ${darkMode ? 'bg-white/5 border-white/5 shadow-inner' : 'bg-slate-50 border-slate-100'}`}>
                        <div className="flex justify-between items-center mb-6">
                          <h3 className={`font-black flex items-center gap-2 text-sm tracking-wide ${darkMode ? 'text-white' : 'text-slate-700'}`}><Users size={18} className="text-teal-500" /> ÉQUIPE DIRECTION</h3>
                          <button onClick={() => setDirection({...direction, personnel: [...direction.personnel, { id: Date.now(), titre: 'Nouveau', etp: 1, salaire: 2500, segur: false, typeContrat: 'CDI', nbJoursRTT: 0, joursConges: 25, dateFinContrat: '' }]})} 
                                  className="bg-teal-500 hover:bg-teal-600 text-white p-2 rounded-xl transition-all shadow-lg shadow-teal-500/20 active:scale-95 no-print"><Plus size={18} /></button>
                        </div>
                        <div className="space-y-3 max-h-[350px] overflow-y-auto">
                          {direction.personnel.map((p, pIdx) => (
                            <div key={p.id} id={`agent-budget-${p.id}`} className={`p-3 rounded-xl border group relative transition-all duration-700 ${focusedAgentId === p.id ? (darkMode ? 'ring-2 ring-yellow-400 bg-yellow-900/30' : 'ring-2 ring-yellow-400 bg-yellow-50') : (darkMode ? 'bg-gray-600 border-gray-500' : 'bg-slate-50 border-slate-200')}`}>
                              <button onClick={() => setDirection({...direction, personnel: direction.personnel.filter(x => x.id !== p.id)})} className="absolute -top-2.5 -right-2.5 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 no-print"><Trash2 size={14} /></button>
                              <div className="flex items-center gap-1 mb-2">
                                <div className="flex flex-col gap-0 no-print">
                                  <button disabled={pIdx===0} onClick={() => { const a=[...direction.personnel]; a.splice(pIdx-1,0,a.splice(pIdx,1)[0]); setDirection({...direction,personnel:a}); }} className={`p-0.5 rounded ${pIdx===0?'opacity-20':'hover:bg-teal-100'}`}><ChevronUp size={10}/></button>
                                  <button disabled={pIdx===direction.personnel.length-1} onClick={() => { const a=[...direction.personnel]; a.splice(pIdx+1,0,a.splice(pIdx,1)[0]); setDirection({...direction,personnel:a}); }} className={`p-0.5 rounded ${pIdx===direction.personnel.length-1?'opacity-20':'hover:bg-teal-100'}`}><ChevronDown size={10}/></button>
                                </div>
                                <input className={`font-bold text-sm flex-1 outline-none bg-transparent ${darkMode ? 'text-white' : ''} ${privacyMode ? 'blur-sm select-none pointer-events-none' : ''}`} value={p.titre} onChange={(e) => setDirection({...direction, personnel: direction.personnel.map(x => x.id === p.id ? {...x, titre: e.target.value} : x)})} />
                                <button onClick={() => navigateToRHAgent(p.id)} className={`no-print p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${darkMode ? 'hover:bg-gray-500 text-teal-400' : 'hover:bg-teal-50 text-teal-600'}`} title="Voir dans RH"><ExternalLink size={12} /></button>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs mb-1">
                                <div><InfoTooltip content="ETP = Équivalent Temps Plein. 1 = temps complet, 0.5 = mi-temps. Impacte directement le coût employeur." darkMode={darkMode} position="top"><label className={`cursor-help ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>ETP</label></InfoTooltip><input type="number" step="0.1" className={`w-full rounded px-2 py-1 font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-white'}`} value={p.etp} onChange={(e) => setDirection({...direction, personnel: direction.personnel.map(x => x.id === p.id ? {...x, etp: validerETP(e.target.value)} : x)})} /></div>
                                <div><InfoTooltip content="Salaire brut mensuel en euros (hors charges patronales et hors prime Ségur). Coût employeur = salaire × 12 × ETP × 1,42." darkMode={darkMode} position="top"><label className={`cursor-help ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Salaire brut/mois</label></InfoTooltip><NumericInput className={`w-full rounded px-2 py-1 font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-white'}`} value={p.salaire} onChange={v => setDirection({...direction, personnel: direction.personnel.map(x => x.id === p.id ? {...x, salaire: v} : x)})} /></div>
                              </div>
                              <div className="flex items-center gap-3 text-xs flex-wrap">
                                <select className={`rounded px-2 py-1 text-xs ${darkMode ? 'bg-gray-500 text-white' : 'bg-white border'}`} value={p.role || 'administratif'} onChange={e => setDirection({...direction, personnel: direction.personnel.map(x => x.id === p.id ? {...x, role: e.target.value} : x)})}>
                                  {roles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                                </select>
                                <InfoTooltip content="RQTH = Reconnaissance en Qualité de Travailleur Handicapé. Permet à l'employeur de comptabiliser ce poste dans l'obligation OETH (6% de l'effectif)." darkMode={darkMode} position="top"><label className="flex items-center gap-1 cursor-help"><input type="checkbox" checked={p.rqth || false} onChange={e => setDirection({...direction, personnel: direction.personnel.map(x => x.id === p.id ? {...x, rqth: e.target.checked} : x)})} /><span className={p.rqth ? 'text-amber-500 font-black' : (darkMode ? 'text-gray-400' : 'text-slate-500')}>RQTH</span></label></InfoTooltip>
                                <InfoTooltip content="Prime Ségur Médico-Social : supplément brut mensuel ajouté au salaire, soumis aux charges patronales. Montant configurable dans les paramètres globaux." darkMode={darkMode} position="top"><label className="flex items-center gap-1 cursor-help"><input type="checkbox" checked={!!p.segur} onChange={e => setDirection({...direction, personnel: direction.personnel.map(x => x.id === p.id ? {...x, segur: e.target.checked} : x)})} /><span className={`text-xs ${p.segur ? (darkMode ? 'text-blue-400 font-bold' : 'text-blue-600 font-bold') : (darkMode ? 'text-gray-400' : 'text-slate-500')}`}>Ségur {p.segur ? `(+${p.segur === true ? (globalParams.montantSegurETP ?? 238) : (parseFloat(p.segur) || 0)} €/m)` : ''}</span></label></InfoTooltip>
                                <label className="flex items-center gap-1 cursor-pointer" title="Inclure ce salarié dans le calcul de subvention régionale (onglet DAF)"><input type="checkbox" checked={!!p.eligibleSubvention} onChange={e => setDirection({...direction, personnel: direction.personnel.map(x => x.id === p.id ? {...x, eligibleSubvention: e.target.checked} : x)})} /><span className={`text-xs font-semibold ${p.eligibleSubvention ? (darkMode ? 'text-violet-400' : 'text-violet-600') : (darkMode ? 'text-gray-400' : 'text-slate-400')}`}>Subv.</span></label>
                                <div className="flex items-center gap-1">
                                  <InfoTooltip content="Année de naissance — utilisée pour la pyramide des âges et les alertes départs en retraite." darkMode={darkMode} position="top"><span className={`cursor-help ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Né(e) en</span></InfoTooltip>
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
                                <div className="flex items-center gap-1">
                                  <InfoTooltip content="RTT = Réduction du Temps de Travail. Jours de repos accordés en compensation des heures supplémentaires liées à l'annualisation du temps de travail." darkMode={darkMode} position="top"><span className={`cursor-help ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>RTT</span></InfoTooltip>
                                  <input type="number" min="0" max="30" step="0.5" className={`w-12 text-center rounded px-1 py-0.5 text-xs font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-teal-50 border'}`} value={p.nbJoursRTT ?? 0} onChange={e => setDirection({...direction, personnel: direction.personnel.map(x => x.id === p.id ? {...x, nbJoursRTT: parseFloat(e.target.value) || 0} : x)})} />
                                  <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>j</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <InfoTooltip content="CP = Congés Payés annuels. Minimum légal : 25 jours (5 semaines). Utilisé pour calculer le taux de présence effectif de l'agent." darkMode={darkMode} position="top"><span className={`cursor-help ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>CP</span></InfoTooltip>
                                  <input type="number" min="0" max="50" className={`w-12 text-center rounded px-1 py-0.5 text-xs font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-teal-50 border'}`} value={p.joursConges ?? 25} onChange={e => setDirection({...direction, personnel: direction.personnel.map(x => x.id === p.id ? {...x, joursConges: parseInt(e.target.value) || 25} : x)})} />
                                  <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>j</span>
                                </div>
                                {(p.typeContrat && p.typeContrat !== 'CDI') && (
                                  <div className="flex items-center gap-1">
                                    <span className={darkMode ? 'text-gray-400' : 'text-slate-500'}>Fin contrat</span>
                                    <input type="date" className={`rounded px-2 py-0.5 text-xs ${darkMode ? 'bg-gray-500 text-white' : 'bg-white border'}`} value={p.dateFinContrat || ''} onChange={e => setDirection({...direction, personnel: direction.personnel.map(x => x.id === p.id ? {...x, dateFinContrat: e.target.value} : x)})} />
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  <InfoTooltip content="Taux de charges patronales forcé (%). Si vide, l'outil calcule automatiquement le taux réel incluant l'allègement Fillon." darkMode={darkMode} position="top">
                                    <span className={`cursor-help font-bold ${p.tauxChargesManuel > 0 ? 'text-amber-500' : (darkMode ? 'text-gray-400' : 'text-slate-400')}`}>Ch.%</span>
                                  </InfoTooltip>
                                  <input type="number" min="0" max="100" step="0.1" placeholder="auto"
                                    className={`w-14 text-center rounded px-1 py-0.5 text-xs font-bold ${p.tauxChargesManuel > 0 ? (darkMode ? 'bg-amber-900/40 border border-amber-600 text-amber-300' : 'bg-amber-50 border border-amber-300 text-amber-700') : (darkMode ? 'bg-gray-500 text-white' : 'bg-white border')}`}
                                    value={p.tauxChargesManuel || ''}
                                    onChange={e => setDirection({...direction, personnel: direction.personnel.map(x => x.id === p.id ? {...x, tauxChargesManuel: e.target.value === '' ? null : parseFloat(e.target.value)} : x)})}
                                  />
                                </div>
                                <label className="flex items-center gap-1 cursor-pointer" title="Poste à pourvoir — le salaire sera proraté selon la date de début prévue">
                                  <input type="checkbox" checked={!!p.estPosteAPourvoir} onChange={e => setDirection({...direction, personnel: direction.personnel.map(x => x.id === p.id ? {...x, estPosteAPourvoir: e.target.checked} : x)})} />
                                  <span className={`text-xs font-semibold ${p.estPosteAPourvoir ? 'text-orange-500' : (darkMode ? 'text-gray-400' : 'text-slate-400')}`}>En recrutement</span>
                                </label>
                                {p.estPosteAPourvoir && (
                                  <div className="flex items-center gap-1">
                                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Début prévu</span>
                                    <input type="month" className={`rounded px-1 py-0.5 text-xs ${darkMode ? 'bg-orange-900/40 border border-orange-600 text-orange-300' : 'bg-orange-50 border border-orange-300 text-orange-700'}`}
                                      value={p.dateDebutPrevue || ''}
                                      onChange={e => setDirection({...direction, personnel: direction.personnel.map(x => x.id === p.id ? {...x, dateDebutPrevue: e.target.value} : x)})} />
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
                              {(() => {
                                const pr = calculerPresenceAgent(p, 'Direction', planningAbsences, 2026);
                                if (pr.absences.total === 0) return null;
                                const delta = parseFloat(p.etp) - pr.etpReel;
                                return (
                                  <div className={`mt-1.5 flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${darkMode ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-50 text-amber-700 border border-amber-200'}`} title={`${pr.absences.total}j d'absence dans le planning`}>
                                    <UserMinus size={11} /> ETP réel {pr.etpReel.toFixed(2)} <span className="opacity-60">(-{delta.toFixed(2)})</span>
                                  </div>
                                );
                              })()}
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

                      {/* ── Recettes Direction ──────────────────────────── */}
                      <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-emerald-50 border-emerald-200'}`}>
                        <div className="flex justify-between items-center mb-4">
                          <h3 className={`text-sm font-black uppercase flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}><TrendingUp size={18} className="text-emerald-500" /> Recettes propres</h3>
                          <button onClick={() => setDirection({ ...direction, recettes: [...(direction.recettes || []), { id: Date.now(), nom: 'Nouvelle recette', montant: 0 }] })} className="bg-emerald-500 text-white p-2 rounded-lg no-print"><Plus size={18} /></button>
                        </div>
                        <div className="space-y-2 max-h-[200px] overflow-y-auto">
                          {(direction.recettes || []).map(r => (
                            <div key={r.id} className={`p-3 rounded-xl border group relative ${darkMode ? 'bg-gray-600 border-gray-500' : 'bg-white border-emerald-100'}`}>
                              <button onClick={() => setDirection({ ...direction, recettes: (direction.recettes || []).filter(x => x.id !== r.id) })} className="absolute -top-2.5 -right-2.5 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 no-print"><Trash2 size={14} /></button>
                              <input className={`font-bold text-sm w-full outline-none bg-transparent mb-1 ${darkMode ? 'text-white' : ''}`} value={r.nom} onChange={e => setDirection({ ...direction, recettes: (direction.recettes || []).map(x => x.id === r.id ? { ...x, nom: e.target.value } : x) })} />
                              <div className="flex items-center gap-2">
                                <TrendingUp className="text-emerald-500" size={16} />
                                <input type="number" className={`w-28 text-right font-black text-lg rounded-lg px-3 py-1.5 outline-none ${darkMode ? 'bg-gray-500 text-white' : 'bg-white'}`} value={r.montant} onChange={e => setDirection({ ...direction, recettes: (direction.recettes || []).map(x => x.id === r.id ? { ...x, montant: validerMontant(e.target.value) } : x) })} />
                                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>/mois</span>
                              </div>
                            </div>
                          ))}
                          {(direction.recettes || []).length === 0 && <p className={`text-sm text-center py-3 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Aucune recette — cliquez + pour en ajouter</p>}
                        </div>
                        {(direction.recettes || []).length > 0 && (
                          <div className={`mt-3 pt-3 border-t flex justify-between text-sm font-bold ${darkMode ? 'border-gray-600 text-emerald-400' : 'border-emerald-200 text-emerald-700'}`}>
                            <span>Total mensuel</span>
                            <span>{(direction.recettes || []).reduce((s, r) => s + (parseFloat(r.montant) || 0), 0).toLocaleString()} €</span>
                          </div>
                        )}
                      </div>

                      {/* ── Répartition vers les services ──────────────── */}
                      <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-teal-50 border-teal-200'}`}>
                        <h3 className={`font-black flex items-center gap-2 mb-4 text-sm uppercase tracking-wide ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}><Layers size={18} className="text-teal-500" /> Répartition du coût Direction</h3>
                        {(() => {
                          const totalPct = services.reduce((sum, s) => sum + (direction.repartition?.[String(s.id)] || 0), 0);
                          const totalDir = getBudgetDirection().total;
                          return (
                            <div className="space-y-2">
                              {services.map(s => {
                                const pct = direction.repartition?.[String(s.id)] || 0;
                                const montant = Math.round(totalDir * pct / 100);
                                return (
                                  <div key={s.id} className={`flex items-center gap-2 p-2 rounded-xl ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
                                    <span className={`text-xs font-bold flex-1 truncate ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>{s.nom}</span>
                                    <input
                                      type="number" min="0" max="100"
                                      className={`w-16 text-right text-xs font-bold rounded px-2 py-1 ${darkMode ? 'bg-gray-500 text-white' : 'bg-slate-50 border'}`}
                                      value={pct}
                                      onChange={e => setDirection({...direction, repartition: {...(direction.repartition||{}), [String(s.id)]: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0))}})}
                                    />
                                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>%</span>
                                    <span className={`text-xs font-bold w-20 text-right ${darkMode ? 'text-teal-300' : 'text-teal-700'}`}>{montant.toLocaleString()} €</span>
                                  </div>
                                );
                              })}
                              <div className={`flex items-center justify-between pt-2 mt-1 border-t text-xs font-black ${darkMode ? 'border-gray-600' : 'border-teal-200'}`}>
                                <span className={darkMode ? 'text-gray-300' : 'text-slate-600'}>Total</span>
                                <span className={totalPct === 100 ? 'text-green-600' : 'text-red-500'}>{totalPct}%</span>
                                <span className={darkMode ? 'text-teal-300' : 'text-teal-700'}>{Math.round(totalDir).toLocaleString()} €</span>
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
                    className={`rounded-3xl shadow-xl border p-8 print-avoid-break transition-all duration-300 backdrop-blur-md
                      ${isPSDragging ? 'opacity-40 scale-95' : 'hover:shadow-2xl'}
                      ${isPSOver ? 'ring-2 ring-cyan-400 ring-offset-4' : ''}
                      ${darkMode ? 'bg-zinc-900/80 border-zinc-700/30' : 'bg-white border-slate-100/80'}`}
                  >
                    <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className={`cursor-grab active:cursor-grabbing p-2 rounded-xl no-print transition-colors ${darkMode ? 'bg-white/5 text-gray-500 hover:text-gray-300' : 'bg-slate-100 text-slate-300 hover:text-slate-500'}`} title="Déplacer Pôle Ressource"><GripVertical size={20} /></div>
                        <div className="flex flex-col gap-0.5 no-print">
                          <button disabled={pos === 0} onClick={() => setPoleSupportPosition(p => Math.max(0, p-1))} className={`p-1 rounded-lg transition-colors ${pos===0?'opacity-20 cursor-not-allowed':'hover:bg-cyan-500/10 text-cyan-500'}`}><ChevronUp size={14}/></button>
                          <button disabled={pos === orderedItems.length - 1} onClick={() => setPoleSupportPosition(p => Math.min(services.length + 1, p+1))} className={`p-1 rounded-lg transition-colors ${pos===orderedItems.length-1?'opacity-20 cursor-not-allowed':'hover:bg-cyan-500/10 text-cyan-500'}`}><ChevronDown size={14}/></button>
                        </div>
                        <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-600 shadow-inner">
                          <Building size={32} />
                        </div>
                        <div>
                          <h2 className={`text-2xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-800'}`}>Pôle Ressource</h2>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 font-bold">{poleSupport.personnel.reduce((s, p) => s + p.etp, 0).toFixed(1)} ETP</span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Ressources transversales</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Budget annuel estimé</div>
                        <span className={`text-3xl font-black font-mono-numbers ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>{Math.round(getBudgetPoleSupport().total).toLocaleString()} <span className="text-lg opacity-50 font-sans">€</span></span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Personnel */}
                      <div className={`p-6 rounded-2xl border transition-all duration-300 ${darkMode ? 'bg-white/5 border-white/5 shadow-inner' : 'bg-slate-50 border-slate-100'}`}>
                        <div className="flex justify-between items-center mb-6">
                          <h3 className={`font-black flex items-center gap-2 text-sm tracking-wide ${darkMode ? 'text-white' : 'text-slate-700'}`}><Users size={18} className="text-cyan-500" /> PERSONNEL PÔLE</h3>
                          <button onClick={() => setPoleSupport({...poleSupport, personnel: [...poleSupport.personnel, { id: Date.now(), titre: 'Nouveau', etp: 1, salaire: 2500, segur: 0, role: 'administratif', rqth: false, anneeNaissance: 0, typeContrat: 'CDI', nbJoursRTT: 0, joursConges: 25, dateFinContrat: '' }]})} 
                                  className="bg-cyan-500 hover:bg-cyan-600 text-white p-2 rounded-xl transition-all shadow-lg shadow-cyan-500/20 active:scale-95 no-print"><Plus size={18} /></button>
                        </div>
                        <div className="space-y-3 max-h-[350px] overflow-y-auto">
                          {poleSupport.personnel.map((p) => (
                            <div key={p.id} id={`agent-budget-${p.id}`} className={`p-3 rounded-xl border group relative transition-all duration-700 ${focusedAgentId === p.id ? (darkMode ? 'ring-2 ring-yellow-400 bg-yellow-900/30' : 'ring-2 ring-yellow-400 bg-yellow-50') : (darkMode ? 'bg-gray-600 border-gray-500' : 'bg-slate-50 border-slate-200')}`}>
                              <button onClick={() => setPoleSupport({...poleSupport, personnel: poleSupport.personnel.filter(x => x.id !== p.id)})} className="absolute -top-2.5 -right-2.5 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 no-print"><Trash2 size={14} /></button>
                              <div className="flex items-center gap-1 mb-2">
                                <input className={`font-bold text-sm flex-1 outline-none bg-transparent ${darkMode ? 'text-white' : ''} ${privacyMode ? 'blur-sm select-none pointer-events-none' : ''}`} value={p.titre} onChange={(e) => setPoleSupport({...poleSupport, personnel: poleSupport.personnel.map(x => x.id === p.id ? {...x, titre: e.target.value} : x)})} />
                                <button onClick={() => navigateToRHAgent(p.id)} className={`no-print p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${darkMode ? 'hover:bg-gray-500 text-cyan-400' : 'hover:bg-cyan-50 text-cyan-600'}`} title="Voir dans RH"><ExternalLink size={12} /></button>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs mb-1">
                                <div><InfoTooltip content="ETP = Équivalent Temps Plein. 1 = temps complet, 0.5 = mi-temps. Impacte directement le coût employeur." darkMode={darkMode} position="top"><label className={`cursor-help ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>ETP</label></InfoTooltip><input type="number" step="0.1" className={`w-full rounded px-2 py-1 font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-white'}`} value={p.etp} onChange={(e) => setPoleSupport({...poleSupport, personnel: poleSupport.personnel.map(x => x.id === p.id ? {...x, etp: validerETP(e.target.value)} : x)})} /></div>
                                <div><InfoTooltip content="Salaire brut mensuel en euros (hors charges patronales et hors prime Ségur). Coût employeur = salaire × 12 × ETP × 1,42." darkMode={darkMode} position="top"><label className={`cursor-help ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Salaire</label></InfoTooltip><NumericInput className={`w-full rounded px-2 py-1 font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-white'}`} value={p.salaire} onChange={v => setPoleSupport({...poleSupport, personnel: poleSupport.personnel.map(x => x.id === p.id ? {...x, salaire: v} : x)})} /></div>
                              </div>
                              <div className="flex items-center gap-3 text-xs flex-wrap">
                                <select className={`rounded px-2 py-1 text-xs ${darkMode ? 'bg-gray-500 text-white' : 'bg-white border'}`} value={p.role || 'administratif'} onChange={e => setPoleSupport({...poleSupport, personnel: poleSupport.personnel.map(x => x.id === p.id ? {...x, role: e.target.value} : x)})}>
                                  {roles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                                </select>
                                <label className="flex items-center gap-1"><input type="checkbox" checked={p.rqth || false} onChange={e => setPoleSupport({...poleSupport, personnel: poleSupport.personnel.map(x => x.id === p.id ? {...x, rqth: e.target.checked} : x)})} /><span className={p.rqth ? 'text-amber-500 font-black' : (darkMode ? 'text-gray-400' : 'text-slate-500')}>RQTH</span></label>
                                <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={!!p.segur} onChange={e => setPoleSupport({...poleSupport, personnel: poleSupport.personnel.map(x => x.id === p.id ? {...x, segur: e.target.checked} : x)})} /><span className={`text-xs ${p.segur ? (darkMode ? 'text-blue-400 font-bold' : 'text-blue-600 font-bold') : (darkMode ? 'text-gray-400' : 'text-slate-500')}`}>Ségur {p.segur ? `(+${p.segur === true ? (globalParams.montantSegurETP ?? 238) : (parseFloat(p.segur) || 0)} €/m)` : ''}</span></label>
                                <label className="flex items-center gap-1 cursor-pointer" title="Inclure ce salarié dans le calcul de subvention régionale (onglet DAF)"><input type="checkbox" checked={!!p.eligibleSubvention} onChange={e => setPoleSupport({...poleSupport, personnel: poleSupport.personnel.map(x => x.id === p.id ? {...x, eligibleSubvention: e.target.checked} : x)})} /><span className={`text-xs font-semibold ${p.eligibleSubvention ? (darkMode ? 'text-violet-400' : 'text-violet-600') : (darkMode ? 'text-gray-400' : 'text-slate-400')}`}>Subv.</span></label>
                                <div className="flex items-center gap-1">
                                  <InfoTooltip content="Année de naissance — utilisée pour la pyramide des âges et les alertes départs en retraite." darkMode={darkMode} position="top"><span className={`cursor-help ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Né(e) en</span></InfoTooltip>
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
                                <div className="flex items-center gap-1">
                                  <InfoTooltip content="RTT = Réduction du Temps de Travail. Jours de repos accordés en compensation des heures supplémentaires liées à l'annualisation du temps de travail." darkMode={darkMode} position="top"><span className={`cursor-help ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>RTT</span></InfoTooltip>
                                  <input type="number" min="0" max="30" step="0.5" className={`w-12 text-center rounded px-1 py-0.5 text-xs font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-cyan-50 border'}`} value={p.nbJoursRTT ?? 0} onChange={e => setPoleSupport({...poleSupport, personnel: poleSupport.personnel.map(x => x.id === p.id ? {...x, nbJoursRTT: parseFloat(e.target.value) || 0} : x)})} />
                                  <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>j</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <InfoTooltip content="CP = Congés Payés annuels. Minimum légal : 25 jours (5 semaines). Utilisé pour calculer le taux de présence effectif de l'agent." darkMode={darkMode} position="top"><span className={`cursor-help ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>CP</span></InfoTooltip>
                                  <input type="number" min="0" max="50" className={`w-12 text-center rounded px-1 py-0.5 text-xs font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-cyan-50 border'}`} value={p.joursConges ?? 25} onChange={e => setPoleSupport({...poleSupport, personnel: poleSupport.personnel.map(x => x.id === p.id ? {...x, joursConges: parseInt(e.target.value) || 25} : x)})} />
                                  <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>j</span>
                                </div>
                                {(p.typeContrat && p.typeContrat !== 'CDI') && (
                                  <div className="flex items-center gap-1">
                                    <span className={darkMode ? 'text-gray-400' : 'text-slate-500'}>Fin contrat</span>
                                    <input type="date" className={`rounded px-2 py-0.5 text-xs ${darkMode ? 'bg-gray-500 text-white' : 'bg-white border'}`} value={p.dateFinContrat || ''} onChange={e => setPoleSupport({...poleSupport, personnel: poleSupport.personnel.map(x => x.id === p.id ? {...x, dateFinContrat: e.target.value} : x)})} />
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  <InfoTooltip content="Taux de charges patronales forcé (%). Si vide, l'outil calcule automatiquement le taux réel incluant l'allègement Fillon." darkMode={darkMode} position="top">
                                    <span className={`cursor-help font-bold ${p.tauxChargesManuel > 0 ? 'text-amber-500' : (darkMode ? 'text-gray-400' : 'text-slate-400')}`}>Ch.%</span>
                                  </InfoTooltip>
                                  <input type="number" min="0" max="100" step="0.1" placeholder="auto"
                                    className={`w-14 text-center rounded px-1 py-0.5 text-xs font-bold ${p.tauxChargesManuel > 0 ? (darkMode ? 'bg-amber-900/40 border border-amber-600 text-amber-300' : 'bg-amber-50 border border-amber-300 text-amber-700') : (darkMode ? 'bg-gray-500 text-white' : 'bg-white border')}`}
                                    value={p.tauxChargesManuel || ''}
                                    onChange={e => setPoleSupport({...poleSupport, personnel: poleSupport.personnel.map(x => x.id === p.id ? {...x, tauxChargesManuel: e.target.value === '' ? null : parseFloat(e.target.value)} : x)})}
                                  />
                                </div>
                                <label className="flex items-center gap-1 cursor-pointer" title="Poste à pourvoir — le salaire sera proraté selon la date de début prévue">
                                  <input type="checkbox" checked={!!p.estPosteAPourvoir} onChange={e => setPoleSupport({...poleSupport, personnel: poleSupport.personnel.map(x => x.id === p.id ? {...x, estPosteAPourvoir: e.target.checked} : x)})} />
                                  <span className={`text-xs font-semibold ${p.estPosteAPourvoir ? 'text-orange-500' : (darkMode ? 'text-gray-400' : 'text-slate-400')}`}>En recrutement</span>
                                </label>
                                {p.estPosteAPourvoir && (
                                  <div className="flex items-center gap-1">
                                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Début prévu</span>
                                    <input type="month" className={`rounded px-1 py-0.5 text-xs ${darkMode ? 'bg-orange-900/40 border border-orange-600 text-orange-300' : 'bg-orange-50 border border-orange-300 text-orange-700'}`}
                                      value={p.dateDebutPrevue || ''}
                                      onChange={e => setPoleSupport({...poleSupport, personnel: poleSupport.personnel.map(x => x.id === p.id ? {...x, dateDebutPrevue: e.target.value} : x)})} />
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
                              {(() => {
                                const pr = calculerPresenceAgent(p, 'Pôle Support', planningAbsences, 2026);
                                if (pr.absences.total === 0) return null;
                                const delta = parseFloat(p.etp) - pr.etpReel;
                                return (
                                  <div className={`mt-1.5 flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${darkMode ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-50 text-amber-700 border border-amber-200'}`} title={`${pr.absences.total}j d'absence dans le planning`}>
                                    <UserMinus size={11} /> ETP réel {pr.etpReel.toFixed(2)} <span className="opacity-60">(-{delta.toFixed(2)})</span>
                                  </div>
                                );
                              })()}
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

            // Salariés du budget convertis au format calcSalarieFormateur
            const salariesBudget = [
              ...direction.personnel.map(p => ({
                id: `budget-${p.id}`, nom: p.titre || 'Sans nom', type: 'interne',
                salaireBrut: p.salaire || 0,
                tauxCharges: Math.round(CHARGES_PATRONALES * 100),
                heuresHebdo: Math.round(35 * (p.etp || 1)),
                heuresHorsProduction: 7, ratioPreparation: 1.2, joursAbsence: 0,
                _source: 'Direction / Siège',
              })),
              ...poleSupport.personnel.map(p => ({
                id: `budget-${p.id}`, nom: p.titre || 'Sans nom', type: 'interne',
                salaireBrut: p.salaire || 0,
                tauxCharges: Math.round(CHARGES_PATRONALES * 100),
                heuresHebdo: Math.round(35 * (p.etp || 1)),
                heuresHorsProduction: 7, ratioPreparation: 1.2, joursAbsence: 0,
                _source: 'Pôle Support',
              })),
              ...services.flatMap(svc => (svc.personnel || []).map(p => ({
                id: `budget-${p.id}`, nom: p.titre || 'Sans nom', type: 'interne',
                salaireBrut: p.salaire || 0,
                tauxCharges: Math.round(CHARGES_PATRONALES * 100),
                heuresHebdo: Math.round(35 * (p.etp || 1)),
                heuresHorsProduction: 7, ratioPreparation: 1.2, joursAbsence: 0,
                _source: svc.nom,
              }))),
              ...(poolRH || []).map(p => ({
                id: `budget-${p.id}`, nom: p.titre || 'Sans nom', type: 'interne',
                salaireBrut: p.salaire || 0,
                tauxCharges: Math.round(CHARGES_PATRONALES * 100),
                heuresHebdo: Math.round(35 * (p.etp || 1)),
                heuresHorsProduction: 7, ratioPreparation: 1.2, joursAbsence: 0,
                _source: 'Pool RH',
              })),
            ];

            // Calcul résultat d'une session simulée
            const calcSession = (sess) => {
              const formateur = tousSalariesPilotage.find(s => s.id === sess.formateurId)
                             || salariesBudget.find(s => s.id === sess.formateurId);
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
                className={`rounded-3xl shadow-xl border p-8 print-avoid-break transition-all duration-300 backdrop-blur-md
                  ${isDragging ? 'opacity-40 scale-95' : 'hover:shadow-2xl'}
                  ${isDragOver && !isDragging ? 'ring-2 ring-teal-400 ring-offset-4' : ''}
                  ${!accueilPublic 
                    ? (darkMode ? 'bg-amber-900/10 border-amber-500/20' : 'bg-amber-50/50 border-amber-200/60') 
                    : (darkMode ? 'bg-zinc-900/80 border-zinc-700/30' : 'bg-white border-slate-100/80')}`}
              >
                <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
                  <div className="flex items-center gap-4 flex-wrap">
                    {/* Poignée de déplacement */}
                    <div className={`cursor-grab active:cursor-grabbing p-2 rounded-xl no-print transition-colors ${darkMode ? 'bg-white/5 text-gray-500 hover:text-gray-300' : 'bg-slate-100 text-slate-300 hover:text-slate-500'}`} title="Déplacer ce service">
                      <GripVertical size={20} />
                    </div>
                    {/* Boutons haut/bas */}
                    <div className="flex flex-col gap-0.5 no-print">
                      <button
                        disabled={serviceIndex === 0}
                        onClick={() => {
                          const arr = [...services]; arr.splice(serviceIndex - 1, 0, arr.splice(serviceIndex, 1)[0]);
                          setServices(arr);
                        }}
                        className={`p-1 rounded-lg transition-colors ${serviceIndex === 0 ? 'opacity-20 cursor-not-allowed' : 'hover:bg-slate-100 text-slate-500'}`}
                      ><ChevronUp size={14} /></button>
                      <button
                        disabled={serviceIndex === services.length - 1}
                        onClick={() => {
                          const arr = [...services]; arr.splice(serviceIndex + 1, 0, arr.splice(serviceIndex, 1)[0]);
                          setServices(arr);
                        }}
                        className={`p-1 rounded-lg transition-colors ${serviceIndex === services.length - 1 ? 'opacity-20 cursor-not-allowed' : 'hover:bg-slate-100 text-slate-500'}`}
                      ><ChevronDown size={14} /></button>
                    </div>
                    <div className={`p-3 rounded-2xl shadow-inner ${
                      isPrestation ? 'bg-orange-500/10 text-orange-500' : 
                      hasPromos ? 'bg-purple-500/10 text-purple-500' : 
                      'bg-teal-500/10 text-teal-500'
                    }`}>
                      {isPrestation ? <Calendar size={32} /> : hasPromos ? <GraduationCap size={32} /> : <Cog size={32} className="text-red-500" />}
                    </div>
                    <div className="flex flex-col">
                      <input className={`text-2xl font-black outline-none border-b-2 border-transparent focus:border-teal-500 bg-transparent transition-all ${darkMode ? 'text-white' : 'text-slate-800'}`} 
                             value={service.nom} 
                             onChange={(e) => setServices(services.map(s => s.id === service.id ? {...s, nom: e.target.value} : s))} />
                      <div className="flex items-center gap-2 mt-1">
                        <select
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border-0 outline-none cursor-pointer no-print ${
                            service.type === 'prestation' ? 'bg-orange-500/10 text-orange-600' :
                            service.type === 'recherche'  ? 'bg-violet-500/10 text-violet-600' :
                                                            'bg-teal-500/10 text-teal-600'
                          }`}
                          value={service.type || 'formation'}
                          onChange={e => setServices(services.map(s => s.id === service.id ? {...s, type: e.target.value} : s))}
                        >
                          <option value="formation">Formation</option>
                          <option value="prestation">Prestation</option>
                          <option value="recherche">Recherche</option>
                        </select>
                        <button
                          onClick={() => setServices(services.map(s => s.id === service.id ? {...s, accueilPublic: !accueilPublic} : s))}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 transition-all no-print border ${
                            accueilPublic 
                              ? 'bg-teal-500/10 text-teal-600 border-teal-500/20 hover:bg-teal-500/20' 
                              : 'bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20'
                          }`}
                        >
                          {accueilPublic ? <UserCheck size={12} /> : <UserX size={12} />}
                          {accueilPublic ? 'Accueil public' : 'Sans accueil public'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex flex-col items-end">
                      <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Total charges</div>
                      <span className={`text-xl font-black font-mono-numbers text-red-500`}>
                        {Math.round(bs.total).toLocaleString()} <span className="text-sm opacity-50 font-sans">€</span>
                      </span>
                    </div>
                    <div className="w-px h-10 bg-slate-200/50 mx-1"></div>
                    <div className="flex flex-col items-end">
                      <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Total recettes</div>
                      <span className={`text-xl font-black font-mono-numbers text-green-500`}>
                        {Math.round(bs.recettes).toLocaleString()} <span className="text-sm opacity-50 font-sans">€</span>
                      </span>
                    </div>
                    <div className="w-px h-10 bg-slate-200/50 mx-1"></div>
                    <div className="flex flex-col items-end">
                      <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Solde</div>
                      <span className={`text-xl font-black font-mono-numbers ${bs.solde >= 0 ? 'text-emerald-500' : 'text-orange-500'}`}>
                        {bs.solde >= 0 ? '+' : ''}{Math.round(bs.solde).toLocaleString()} <span className="text-sm opacity-50 font-sans">€</span>
                      </span>
                    </div>
                    <span className={`px-3 py-2 rounded-xl text-xs font-bold ${darkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                      {service.personnel.reduce((s, p) => s + p.etp, 0).toFixed(1)} ETP
                      {bs.etpReel !== undefined && Math.abs(bs.etpReel - bs.etpContractuel) > 0.01 && (
                        <span className={`ml-1 ${darkMode ? 'text-amber-300' : 'text-amber-600'}`} title="ETP réel après absences">
                          → {bs.etpReel.toFixed(2)} réel
                        </span>
                      )}
                    </span>
                    {bs.coutCarenceMaladie > 0 && (
                      <span className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 ${darkMode ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-700'}`}
                        title="Coût des jours de carence maladie à charge de l'employeur (non remboursés par la SS)">
                        🤒 Carence: +{Math.round(bs.coutCarenceMaladie).toLocaleString()} €
                      </span>
                    )}
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
                        ...(direction?.personnel || []).map(p => p.etp),
                        ...services.flatMap(s => (s.personnel || []).map(p => p.etp))
                      ].reduce((a, b) => a + b, 0);
                      const etpService = (service.personnel || []).reduce((s, p) => s + p.etp, 0);
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

                {/* Bouton d'initialisation promos pour un service sans promos */}
                {!hasPromos && !isPrestation && (
                  <div className="mb-6 flex items-center gap-3 no-print">
                    <GraduationCap size={16} className={darkMode ? 'text-purple-400' : 'text-purple-600'} />
                    <span className={`text-sm font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>Activer les effectifs / promos</span>
                    <select
                      defaultValue=""
                      onChange={e => {
                        if (!e.target.value) return;
                        const site = e.target.value;
                        const ts = Date.now();
                        setServices(services.map(s => s.id === service.id ? {
                          ...s,
                          promos: { [site]: [{ id: `${site}-${ts}`, nom: 'Nouvelle promo', effectifInitial: 20, abandons: makeAbandons(), type: 'standard' }] }
                        } : s));
                      }}
                      className={`text-sm font-bold px-3 py-2 rounded-xl border-2 border-dashed cursor-pointer ${darkMode ? 'bg-gray-700 border-purple-700 text-purple-300' : 'bg-white border-purple-300 text-purple-700'}`}
                    >
                      <option value="">— Choisir un site…</option>
                      {Object.values(SITES).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                )}

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
                            const ts = Date.now();
                            const newSiteContent = service.useFiliere
                              ? [{ id: `fil-${newSite}-${ts}`, nom: 'Nouvelle filière', promos: [{ id: `${newSite}-${ts}`, nom: 'Nouvelle promo', effectifInitial: 20, abandons: makeAbandons() }] }]
                              : [{ id: `${newSite}-${ts}`, nom: 'Nouvelle promo', effectifInitial: 20, abandons: makeAbandons() }];
                            setServices(services.map(s => s.id === service.id ? {
                              ...s,
                              promos: { ...s.promos, [newSite]: newSiteContent }
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
                      {Object.entries(service.promos).map(([site, items]) => {
                        // Helper pour mettre à jour une promo dans la structure (avec ou sans filières)
                        const updatePromo = (filiereId, promoId, updater) => {
                          setServices(services.map(s => {
                            if (s.id !== service.id) return s;
                            return {
                              ...s,
                              promos: {
                                ...s.promos,
                                [site]: s.useFiliere
                                  ? s.promos[site].map(fil => fil.id !== filiereId ? fil : {
                                      ...fil, promos: fil.promos.map(p => p.id !== promoId ? p : updater(p))
                                    })
                                  : s.promos[site].map(p => p.id !== promoId ? p : updater(p))
                              }
                            };
                          }));
                        };
                        const deletePromo = (filiereId, promoId) => {
                          setServices(services.map(s => {
                            if (s.id !== service.id) return s;
                            return {
                              ...s,
                              promos: {
                                ...s.promos,
                                [site]: s.useFiliere
                                  ? s.promos[site].map(fil => fil.id !== filiereId ? fil : {
                                      ...fil, promos: fil.promos.filter(p => p.id !== promoId)
                                    })
                                  : s.promos[site].filter(p => p.id !== promoId)
                              }
                            };
                          }));
                        };

                        // Construit la liste des promos à afficher (avec filière context si useFiliere)
                        const promosList = service.useFiliere
                          ? null // handled separately below
                          : items;

                        const renderPromoCard = (promo, filiereId) => {
                          const effectifActuel = calculerEffectifActuel(promo);
                          const totalAbandons = Object.values(promo.abandons).reduce((sum, v) => sum + v, 0);
                          return (
                            <div key={promo.id} className={`p-3 rounded-lg border group/promo ${darkMode ? 'bg-gray-600 border-gray-500' : 'bg-slate-50 border-slate-200'}`}>
                              <div className="flex justify-between items-center mb-2">
                                {/* Nom éditable */}
                                <input
                                  className={`font-bold text-sm bg-transparent outline-none border-b border-transparent focus:border-purple-400 w-28 ${darkMode ? 'text-white' : 'text-slate-700'}`}
                                  value={promo.nom}
                                  onChange={e => updatePromo(filiereId, promo.id, p => ({...p, nom: e.target.value}))}
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
                                      updatePromo(filiereId, promo.id, p => ({...p, type: newType, ...(newType === 'contrat_pro' ? {ventilationMensuelle: ventilInit} : {})}));
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
                                    onClick={() => deletePromo(filiereId, promo.id)}
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
                                    onChange={e => updatePromo(filiereId, promo.id, p => ({...p, dateDebut: e.target.value}))}
                                  />
                                </div>
                                <div className="flex items-center gap-1">
                                  <label className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Fin:</label>
                                  <input
                                    type="date"
                                    className={`text-xs rounded px-2 py-1 font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-white border'}`}
                                    value={promo.dateFin || ''}
                                    onChange={e => updatePromo(filiereId, promo.id, p => ({...p, dateFin: e.target.value}))}
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
                                  onChange={e => updatePromo(filiereId, promo.id, p => ({...p, effectifInitial: Math.max(0, parseInt(e.target.value) || 0)}))}
                                />
                              </div>
                              {/* Abandons par mois */}
                              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                                <div className="flex items-center gap-1 mb-1">
                                  <UserMinus size={12} /> Abandons par mois:
                                </div>
                                <div className="grid grid-cols-4 sm:grid-cols-6 gap-1">
                                  {Object.entries(promo.abandons).map(([mois, val]) => (
                                    <div key={mois} className="text-center">
                                      <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                                        {mois.substring(0, 3)}
                                      </div>
                                      <input
                                        type="number"
                                        min="0"
                                        className={`w-full text-center text-xs rounded px-1 py-0.5 ${val > 0 ? (darkMode ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-700') : (darkMode ? 'bg-gray-500 text-white' : 'bg-white border')}`}
                                        value={val}
                                        onChange={e => updatePromo(filiereId, promo.id, p => ({...p, abandons: {...p.abandons, [mois]: Math.max(0, parseInt(e.target.value) || 0)}}))}
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
                                    <div className={`text-xs font-black mb-2 flex items-center gap-1 ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                                      Ventilation FC / FI (%)
                                      <HelpIcon darkMode={darkMode} position="right" content="FC = Formation Continue (financement OPCO, entreprises). FI = Formation Initiale (financement Région, étudiants). Pour les contrats pro, les coûts sont répartis entre ces deux lignes de financement chaque mois. FC + FI = 100% chaque mois." />
                                    </div>
                                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-1">
                                      {moisKeysFI.map((mois, i) => {
                                        const v = ventil[mois] || {fc:100, fi:0};
                                        return (
                                          <div key={mois} className="text-center">
                                            <div className={`text-xs mb-0.5 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>{moisLabelsFI[i]}</div>
                                            <div className="flex flex-col gap-0.5">
                                              <div className="flex items-center gap-0.5">
                                                <span className={`text-xs font-bold ${darkMode ? 'text-teal-400' : 'text-teal-600'}`}>FC</span>
                                                <input
                                                  type="number"
                                                  min="0" max="100"
                                                  className={`w-full text-center text-xs rounded px-1 py-1 font-bold ${darkMode ? 'bg-gray-600 text-white' : 'bg-white border'}`}
                                                  value={v.fc}
                                                  onChange={e => {
                                                    const fcVal = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                                                    const newVentil = {...ventil, [mois]: {fc: fcVal, fi: 100-fcVal}};
                                                    updatePromo(filiereId, promo.id, p => ({...p, ventilationMensuelle: newVentil}));
                                                  }}
                                                />
                                              </div>
                                              <div className={`text-xs text-center font-bold ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>FI:{100-v.fc}%</div>
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
                        };

                        return (
                        <div key={site} className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className={`font-black flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                              <MapPin size={18} className="text-purple-500" />
                              <select
                                value={site}
                                onChange={e => {
                                  const newSite = e.target.value;
                                  if (!newSite || newSite === site) return;
                                  // Déplace toutes les promos de l'ancien site vers le nouveau
                                  setServices(services.map(s => {
                                    if (s.id !== service.id) return s;
                                    const newPromos = { ...s.promos };
                                    newPromos[newSite] = newPromos[site];
                                    delete newPromos[site];
                                    return { ...s, promos: newPromos };
                                  }));
                                }}
                                className={`font-black text-sm bg-transparent border-b-2 border-transparent hover:border-purple-400 focus:border-purple-500 outline-none cursor-pointer no-print ${darkMode ? 'text-white' : 'text-slate-800'}`}
                              >
                                {Object.values(SITES).filter(s => s === site || !Object.keys(service.promos).includes(s)).map(s => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                            </h4>
                            <div className="flex items-center gap-2 no-print">
                              {/* Bouton ajouter filière (mode filière) ou promo (mode plat) */}
                              {service.useFiliere ? (
                                <button
                                  onClick={() => {
                                    const ts = Date.now();
                                    setServices(services.map(s => s.id !== service.id ? s : {
                                      ...s, promos: { ...s.promos, [site]: [...s.promos[site], { id: `fil-${site}-${ts}`, nom: 'Nouvelle filière', promos: [{ id: `${site}-${ts}`, nom: 'Nouvelle promo', effectifInitial: 20, abandons: makeAbandons(), type: 'standard' }] }] }
                                    }));
                                  }}
                                  className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${darkMode ? 'bg-purple-800 text-purple-200 hover:bg-purple-700' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}
                                ><Plus size={12} /> Filière</button>
                              ) : (
                                <button
                                  onClick={() => setServices(services.map(s => s.id === service.id ? {
                                    ...s,
                                    promos: { ...s.promos, [site]: [...s.promos[site], { id: `${site}-${Date.now()}`, nom: 'Nouvelle promo', effectifInitial: 20, abandons: makeAbandons(), type: 'standard' }] }
                                  } : s))}
                                  className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${darkMode ? 'bg-purple-800 text-purple-200 hover:bg-purple-700' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}
                                ><Plus size={12} /> Promo</button>
                              )}
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

                          {service.useFiliere ? (
                            /* Rendu avec filières */
                            <div className="space-y-4">
                              {items.map(filiere => {
                                const filiereEffectif = filiere.promos.reduce((sum, p) => sum + calculerEffectifActuel(p), 0);
                                return (
                                  <div key={filiere.id} className={`rounded-xl border-2 ${darkMode ? 'border-purple-800 bg-gray-800/50' : 'border-purple-200 bg-purple-50/50'}`}>
                                    {/* En-tête filière */}
                                    <div className={`flex items-center justify-between px-3 py-2 rounded-t-xl ${darkMode ? 'bg-purple-900/40' : 'bg-purple-100'}`}>
                                      <input
                                        className={`font-black text-sm bg-transparent outline-none border-b border-transparent focus:border-purple-400 flex-1 ${darkMode ? 'text-purple-200' : 'text-purple-800'}`}
                                        value={filiere.nom}
                                        onChange={e => setServices(services.map(s => s.id !== service.id ? s : {
                                          ...s, promos: { ...s.promos, [site]: s.promos[site].map(fil => fil.id !== filiere.id ? fil : { ...fil, nom: e.target.value }) }
                                        }))}
                                        title="Nom de la filière"
                                      />
                                      <div className="flex items-center gap-2 no-print">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${darkMode ? 'bg-purple-800 text-purple-200' : 'bg-purple-200 text-purple-700'}`}>
                                          {filiereEffectif} étud.
                                        </span>
                                        <button
                                          onClick={() => {
                                            const ts = Date.now();
                                            setServices(services.map(s => s.id !== service.id ? s : {
                                              ...s, promos: { ...s.promos, [site]: s.promos[site].map(fil => fil.id !== filiere.id ? fil : {
                                                ...fil, promos: [...fil.promos, { id: `${site}-${ts}`, nom: 'Nouvelle promo', effectifInitial: 20, abandons: makeAbandons(), type: 'standard' }]
                                              }) }
                                            }));
                                          }}
                                          className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${darkMode ? 'bg-gray-700 text-purple-300 hover:bg-gray-600' : 'bg-white text-purple-600 hover:bg-purple-50'}`}
                                        ><Plus size={11} /> Promo</button>
                                        <button
                                          onClick={() => setServices(services.map(s => s.id !== service.id ? s : {
                                            ...s, promos: { ...s.promos, [site]: s.promos[site].filter(fil => fil.id !== filiere.id) }
                                          }))}
                                          className={`text-xs p-1 rounded ${darkMode ? 'text-red-400 hover:bg-red-900/30' : 'text-red-400 hover:bg-red-50'}`}
                                          title="Supprimer cette filière"
                                        ><Trash2 size={12} /></button>
                                      </div>
                                    </div>
                                    {/* Promos de la filière */}
                                    <div className="p-3 space-y-3">
                                      {filiere.promos.map(promo => renderPromoCard(promo, filiere.id))}
                                    </div>
                                  </div>
                                );
                              })}
                              {/* Bouton ajouter filière bas */}
                              <button
                                onClick={() => {
                                  const ts = Date.now();
                                  setServices(services.map(s => s.id !== service.id ? s : {
                                    ...s, promos: { ...s.promos, [site]: [...s.promos[site], { id: `fil-${site}-${ts}`, nom: 'Nouvelle filière', promos: [{ id: `${site}-${ts}`, nom: 'Nouvelle promo', effectifInitial: 20, abandons: makeAbandons() }] }] }
                                  }));
                                }}
                                className={`w-full py-1.5 border-dashed border-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 no-print ${darkMode ? 'border-purple-700 text-purple-400 hover:bg-purple-900/20' : 'border-purple-200 text-purple-500 hover:bg-purple-50'}`}
                              ><Plus size={12} /> Ajouter une filière</button>
                            </div>
                          ) : (
                            /* Rendu plat (sans filières) */
                            <div className="space-y-3">
                              {promosList.map(promo => renderPromoCard(promo, null))}
                              <button
                                onClick={() => setServices(services.map(s => s.id === service.id ? {
                                  ...s,
                                  promos: { ...s.promos, [site]: [...s.promos[site], { id: `${site}-${Date.now()}`, nom: 'Nouvelle promo', effectifInitial: 20, abandons: makeAbandons() }] }
                                } : s))}
                                className={`w-full mt-2 py-1.5 border-dashed border-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 no-print ${darkMode ? 'border-purple-700 text-purple-400 hover:bg-purple-900/20' : 'border-purple-200 text-purple-500 hover:bg-purple-50'}`}
                              ><Plus size={12} /> Ajouter une promo</button>
                            </div>
                          )}

                          {/* Total par site */}
                          <div className={`mt-3 pt-3 border-t ${darkMode ? 'border-gray-600' : 'border-slate-200'} flex justify-between text-sm font-bold`}>
                            <span className={darkMode ? 'text-purple-400' : 'text-purple-600'}>Total {site}:</span>
                            <span className={darkMode ? 'text-white' : 'text-slate-800'}>
                              {service.useFiliere
                                ? items.reduce((sum, fil) => sum + fil.promos.reduce((s2, p) => s2 + calculerEffectifActuel(p), 0), 0)
                                : items.reduce((sum, p) => sum + calculerEffectifActuel(p), 0)
                              } étudiants
                            </span>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                    {/* Synthèse par site */}
                    {Object.keys(service.promos).length > 1 && (() => {
                      const siteTotals = Object.entries(service.promos).map(([site, items]) => {
                        const effectif = service.useFiliere
                          ? items.reduce((sum, fil) => sum + fil.promos.reduce((s2, p) => s2 + calculerEffectifActuel(p), 0), 0)
                          : items.reduce((sum, p) => sum + calculerEffectifActuel(p), 0);
                        const nbPromos = service.useFiliere
                          ? items.reduce((sum, fil) => sum + fil.promos.length, 0)
                          : items.length;
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
                              <div className={`text-[10px] ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{siteTotals.reduce((s, t) => s + t.nbPromos, 0)} promos</div>
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
                      <h3 className={`text-sm font-black uppercase flex items-center gap-2 ${darkMode ? 'text-teal-400' : 'text-teal-700'}`}><Cog size={18} className="text-red-500" /> Exploitation</h3>
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
                          <input type="number" placeholder="réel" title="Montant réalisé (€/mois)" className={`w-16 text-right text-xs rounded px-2 py-1 border ${item.realise != null ? (darkMode ? 'bg-blue-900/40 border-blue-600 text-blue-200' : 'bg-blue-50 border-blue-300 text-blue-800') : (darkMode ? 'bg-gray-700 border-gray-600 text-gray-500' : 'bg-white border-slate-200 text-slate-400')}`} value={item.realise ?? ''} onChange={(e) => { const v = e.target.value === '' ? null : validerMontant(e.target.value); setServices(services.map(s => s.id === service.id ? {...s, exploitation: s.exploitation.map(exp => exp.id === item.id ? {...exp, realise: v} : exp)} : s)); }} />
                          {item.realise != null && (() => { const ecart = (item.realise - item.montant); return <span className={`text-[10px] font-bold ${ecart > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{ecart > 0 ? '+' : ''}{Math.round(ecart).toLocaleString()}€</span>; })()}
                        </div>
                      ))}
                    </div>
                    <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-600' : 'border-teal-200'} flex justify-between font-bold`}>
                      <span className={darkMode ? 'text-teal-400' : 'text-teal-700'}>Total/an:</span>
                      <div className="text-right">
                        <div className={darkMode ? 'text-white' : 'text-teal-800'}>{Math.round(bs.exploitation).toLocaleString()} €</div>
                        {bs.exploitationRealisee > 0 && <div className={`text-xs ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>Réalisé: {Math.round(bs.exploitationRealisee).toLocaleString()} €</div>}
                      </div>
                    </div>
                  </div>

                  {/* Personnel */}
                  <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-slate-50 border-teal-200'}`}>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className={`text-sm font-black uppercase flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}><Users size={18} /> Équipe</h3>
                      <button onClick={() => setServices(services.map(s => s.id === service.id ? {...s, personnel: [...s.personnel, { id: Date.now(), titre: 'Nouveau', etp: 1, salaire: 2500, segur: 0, typeContrat: 'CDI', nbJoursRTT: 0, joursConges: 25, dateFinContrat: '' }]} : s))} className="bg-slate-700 text-white p-1.5 rounded-lg no-print"><Plus size={16} /></button>
                    </div>
                    <div className="space-y-2 max-h-[350px] overflow-y-auto">
                      {service.personnel.map((p, pIdx) => (
                        <div key={p.id} id={`agent-budget-${p.id}`} className={`p-3 rounded-xl group relative transition-all duration-700 border ${focusedAgentId === p.id ? (darkMode ? 'ring-2 ring-yellow-400 bg-yellow-900/30' : 'ring-2 ring-yellow-400 bg-yellow-50') : (darkMode ? 'bg-gray-600 border-gray-500' : 'bg-white border-teal-100')}`}>
                          <button onClick={() => setServices(services.map(s => s.id === service.id ? {...s, personnel: s.personnel.filter(x => x.id !== p.id)} : s))} className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 no-print"><Trash2 size={14} /></button>
                          <div className="flex items-center gap-1 mb-2">
                            <div className="flex flex-col gap-0 no-print">
                              <button disabled={pIdx===0} onClick={() => { const a=[...service.personnel]; a.splice(pIdx-1,0,a.splice(pIdx,1)[0]); setServices(services.map(s=>s.id===service.id?{...s,personnel:a}:s)); }} className={`p-0.5 rounded ${pIdx===0?'opacity-20':'hover:bg-slate-100'}`}><ChevronUp size={10}/></button>
                              <button disabled={pIdx===service.personnel.length-1} onClick={() => { const a=[...service.personnel]; a.splice(pIdx+1,0,a.splice(pIdx,1)[0]); setServices(services.map(s=>s.id===service.id?{...s,personnel:a}:s)); }} className={`p-0.5 rounded ${pIdx===service.personnel.length-1?'opacity-20':'hover:bg-slate-100'}`}><ChevronDown size={10}/></button>
                            </div>
                            <input className={`font-bold text-sm flex-1 outline-none bg-transparent ${darkMode ? 'text-white' : ''} ${privacyMode ? 'blur-sm select-none pointer-events-none' : ''}`} value={p.titre} onChange={(e) => setServices(services.map(s => s.id === service.id ? {...s, personnel: s.personnel.map(x => x.id === p.id ? {...x, titre: e.target.value} : x)} : s))} />
                            <button onClick={() => navigateToRHAgent(p.id)} className={`no-print p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${darkMode ? 'hover:bg-gray-500 text-teal-400' : 'hover:bg-teal-50 text-teal-600'}`} title="Voir dans RH"><ExternalLink size={12} /></button>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs mb-1">
                            <div><InfoTooltip content="ETP = Équivalent Temps Plein. 1 = temps complet, 0.5 = mi-temps. Impacte directement le coût employeur." darkMode={darkMode} position="top"><label className={`cursor-help ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>ETP</label></InfoTooltip><input type="number" step="0.1" className={`w-full rounded px-2 py-1 font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-teal-50'}`} value={p.etp} onChange={(e) => setServices(services.map(s => s.id === service.id ? {...s, personnel: s.personnel.map(x => x.id === p.id ? {...x, etp: validerETP(e.target.value)} : x)} : s))} /></div>
                            <div><InfoTooltip content="Salaire brut mensuel en euros (hors charges patronales et hors prime Ségur). Coût employeur = salaire × 12 × ETP × 1,42." darkMode={darkMode} position="top"><label className={`cursor-help ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Salaire</label></InfoTooltip><NumericInput className={`w-full rounded px-2 py-1 font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-teal-50'}`} value={p.salaire} onChange={v => setServices(services.map(s => s.id === service.id ? {...s, personnel: s.personnel.map(x => x.id === p.id ? {...x, salaire: v} : x)} : s))} /></div>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap text-xs mt-1">
                            <select className={`rounded px-2 py-1 text-xs ${darkMode ? 'bg-gray-500 text-white' : 'bg-teal-50 border'}`} value={p.role || 'formateur'} onChange={e => setServices(services.map(s => s.id === service.id ? {...s, personnel: s.personnel.map(x => x.id === p.id ? {...x, role: e.target.value} : x)} : s))}>
                              {roles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                            </select>
                            <label className="flex items-center gap-1"><input type="checkbox" checked={p.rqth || false} onChange={e => setServices(services.map(s => s.id === service.id ? {...s, personnel: s.personnel.map(x => x.id === p.id ? {...x, rqth: e.target.checked} : x)} : s))} /><span className={p.rqth ? 'text-amber-500 font-black' : (darkMode ? 'text-gray-400' : 'text-slate-500')}>RQTH</span></label>
                            <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={!!p.segur} onChange={e => setServices(services.map(s => s.id === service.id ? {...s, personnel: s.personnel.map(x => x.id === p.id ? {...x, segur: e.target.checked} : x)} : s))} /><span className={`text-xs ${p.segur ? (darkMode ? 'text-blue-400 font-bold' : 'text-blue-600 font-bold') : (darkMode ? 'text-gray-400' : 'text-slate-500')}`}>Ségur {p.segur ? `(+${p.segur === true ? (globalParams.montantSegurETP ?? 238) : (parseFloat(p.segur) || 0)} €/m)` : ''}</span></label>
                            <label className="flex items-center gap-1 cursor-pointer" title="Inclure ce salarié dans le calcul de subvention régionale (onglet DAF)"><input type="checkbox" checked={!!p.eligibleSubvention} onChange={e => setServices(services.map(s => s.id === service.id ? {...s, personnel: s.personnel.map(x => x.id === p.id ? {...x, eligibleSubvention: e.target.checked} : x)} : s))} /><span className={`text-xs font-semibold ${p.eligibleSubvention ? (darkMode ? 'text-violet-400' : 'text-violet-600') : (darkMode ? 'text-gray-400' : 'text-slate-400')}`}>Subv.</span></label>
                            <button
                              onClick={() => {
                                const updatedAgent = { ...p, multiAffectation: true, affectations: [{ entityType: 'service', entityId: service.id, pct: 100 }] };
                                setPoolRH([...poolRH, updatedAgent]);
                                setServices(services.map(s => s.id === service.id ? {...s, personnel: s.personnel.filter(x => x.id !== p.id)} : s));
                              }}
                              title="Marquer comme partagé — déplace l'agent dans le Pool RH commun (affectable à plusieurs services)"
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold no-print transition-colors ${darkMode ? 'bg-gray-600 text-gray-400 hover:bg-purple-900/40 hover:text-purple-300' : 'bg-slate-100 text-slate-400 hover:bg-purple-100 hover:text-purple-700'}`}
                            >Partagé</button>
                            <div className="flex items-center gap-1">
                              <InfoTooltip content="Année de naissance — utilisée pour la pyramide des âges et les alertes départs en retraite." darkMode={darkMode} position="top"><span className={`cursor-help ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Né(e) en</span></InfoTooltip>
                              <input type="number" min="1940" max="2005" placeholder="1980"
                                className={`w-16 rounded px-2 py-1 font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-teal-50 border'}`}
                                value={p.anneeNaissance || ''}
                                onChange={e => setServices(services.map(s => s.id === service.id ? {...s, personnel: s.personnel.map(x => x.id === p.id ? {...x, anneeNaissance: parseInt(e.target.value) || 0} : x)} : s))}
                              />
                              <span className={`ml-2 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Entrée</span>
                              <input type="number" min="1990" max="2026" placeholder="2020"
                                className={`w-16 rounded px-2 py-1 font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-teal-50 border'}`}
                                value={p.dateEntree || ''}
                                onChange={e => setServices(services.map(s => s.id === service.id ? {...s, personnel: s.personnel.map(x => x.id === p.id ? {...x, dateEntree: parseInt(e.target.value) || 0} : x)} : s))}
                              />
                              {p.dateEntree > 0 && (
                                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${darkMode ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>
                                  {2026 - p.dateEntree} an{2026 - p.dateEntree > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                            <select className={`rounded px-2 py-1 text-xs font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-teal-50 border'}`} value={p.typeContrat || 'CDI'} onChange={e => setServices(services.map(s => s.id === service.id ? {...s, personnel: s.personnel.map(x => x.id === p.id ? {...x, typeContrat: e.target.value, dateFinContrat: e.target.value === 'CDI' ? '' : x.dateFinContrat} : x)} : s))}>
                              <option value="CDI">CDI</option>
                              <option value="CDD">CDD</option>
                              <option value="Apprentissage">Apprentissage</option>
                              <option value="Stage">Stage</option>
                              <option value="Vacataire">Vacataire</option>
                              <option value="Autre">Autre</option>
                            </select>
                            {(p.typeContrat && p.typeContrat !== 'CDI') && (
                              <div className="flex items-center gap-1">
                                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Fin</span>
                                <input type="date" title="Date de fin de contrat — génère une alerte automatique"
                                  className={`rounded px-1 py-0.5 text-xs font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-amber-50 border border-amber-300'}`}
                                  value={p.dateFinContrat || ''}
                                  onChange={e => setServices(services.map(s => s.id === service.id ? {...s, personnel: s.personnel.map(x => x.id === p.id ? {...x, dateFinContrat: e.target.value} : x)} : s))}
                                />
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <InfoTooltip content="RTT = Réduction du Temps de Travail. Jours de repos accordés en compensation des heures supplémentaires liées à l'annualisation du temps de travail." darkMode={darkMode} position="top"><span className={`cursor-help ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>RTT</span></InfoTooltip>
                              <input type="number" min="0" max="30" step="0.5" className={`w-12 text-center rounded px-1 py-0.5 text-xs font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-teal-50 border'}`} value={p.nbJoursRTT ?? 0} onChange={e => setServices(services.map(s => s.id === service.id ? {...s, personnel: s.personnel.map(x => x.id === p.id ? {...x, nbJoursRTT: parseFloat(e.target.value) || 0} : x)} : s))} />
                              <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>j</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <InfoTooltip content="CP = Congés Payés annuels. Minimum légal : 25 jours (5 semaines). Utilisé pour calculer le taux de présence effectif de l'agent." darkMode={darkMode} position="top"><span className={`cursor-help ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>CP</span></InfoTooltip>
                              <input type="number" min="0" max="50" className={`w-12 text-center rounded px-1 py-0.5 text-xs font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-teal-50 border'}`} value={p.joursConges ?? 25} onChange={e => setServices(services.map(s => s.id === service.id ? {...s, personnel: s.personnel.map(x => x.id === p.id ? {...x, joursConges: parseInt(e.target.value) || 25} : x)} : s))} />
                              <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>j</span>
                            </div>
                            {(p.typeContrat && p.typeContrat !== 'CDI') && (
                              <div className="flex items-center gap-1">
                                <span className={darkMode ? 'text-gray-400' : 'text-slate-500'}>Fin contrat</span>
                                <input type="date" className={`rounded px-2 py-0.5 text-xs ${darkMode ? 'bg-gray-500 text-white' : 'bg-teal-50 border'}`} value={p.dateFinContrat || ''} onChange={e => setServices(services.map(s => s.id === service.id ? {...s, personnel: s.personnel.map(x => x.id === p.id ? {...x, dateFinContrat: e.target.value} : x)} : s))} />
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <InfoTooltip content="Taux de charges patronales forcé (%). Si vide, l'outil calcule automatiquement le taux réel incluant l'allègement Fillon." darkMode={darkMode} position="top">
                                <span className={`cursor-help font-bold ${p.tauxChargesManuel > 0 ? 'text-amber-500' : (darkMode ? 'text-gray-400' : 'text-slate-400')}`}>Ch.%</span>
                              </InfoTooltip>
                              <input type="number" min="0" max="100" step="0.1" placeholder="auto"
                                className={`w-14 text-center rounded px-1 py-0.5 text-xs font-bold ${p.tauxChargesManuel > 0 ? (darkMode ? 'bg-amber-900/40 border border-amber-600 text-amber-300' : 'bg-amber-50 border border-amber-300 text-amber-700') : (darkMode ? 'bg-gray-500 text-white' : 'bg-teal-50 border')}`}
                                value={p.tauxChargesManuel || ''}
                                onChange={e => setServices(services.map(s => s.id === service.id ? {...s, personnel: s.personnel.map(x => x.id === p.id ? {...x, tauxChargesManuel: e.target.value === '' ? null : parseFloat(e.target.value)} : x)} : s))}
                              />
                            </div>
                            <label className="flex items-center gap-1 cursor-pointer" title="Poste à pourvoir — le salaire sera proraté selon la date de début prévue">
                              <input type="checkbox" checked={!!p.estPosteAPourvoir} onChange={e => setServices(services.map(s => s.id === service.id ? {...s, personnel: s.personnel.map(x => x.id === p.id ? {...x, estPosteAPourvoir: e.target.checked} : x)} : s))} />
                              <span className={`text-xs font-semibold ${p.estPosteAPourvoir ? 'text-orange-500' : (darkMode ? 'text-gray-400' : 'text-slate-400')}`}>En recrutement</span>
                            </label>
                            {p.estPosteAPourvoir && (
                              <div className="flex items-center gap-1">
                                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Début prévu</span>
                                <input type="month" className={`rounded px-1 py-0.5 text-xs ${darkMode ? 'bg-orange-900/40 border border-orange-600 text-orange-300' : 'bg-orange-50 border border-orange-300 text-orange-700'}`}
                                  value={p.dateDebutPrevue || ''}
                                  onChange={e => setServices(services.map(s => s.id === service.id ? {...s, personnel: s.personnel.map(x => x.id === p.id ? {...x, dateDebutPrevue: e.target.value} : x)} : s))} />
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
                            {/* Bouton ouvre modal FI% */}
                            {(() => {
                              const rfi = p.repartitionFI || makeRepartitionFI();
                              const pctMoyen = moisKeysFI.reduce((s, m) => s + (rfi[m] || 0), 0) / 12;
                              const hasData = pctMoyen > 0;
                              return (
                                <button
                                  onClick={() => setFiDialog({ serviceId: service.id, agentId: p.id })}
                                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold no-print transition-colors ${hasData ? (darkMode ? 'bg-amber-700 text-amber-100' : 'bg-amber-200 text-amber-800') : (darkMode ? 'bg-gray-600 text-gray-300 hover:bg-amber-800/50 hover:text-amber-200' : 'bg-slate-100 text-slate-500 hover:bg-amber-100 hover:text-amber-700')}`}
                                  title="Répartition mensuelle du salaire en Formation Initiale (FI%)"
                                >
                                  <Zap size={12} /> FI% {hasData && <span className="opacity-75">{pctMoyen.toFixed(0)}% moy.</span>}
                                </button>
                              );
                            })()}
                            {(() => {
                              const pr = calculerPresenceAgent(p, service.nom, planningAbsences, 2026);
                              if (pr.absences.total === 0) return null;
                              const delta = parseFloat(p.etp) - pr.etpReel;
                              return (
                                <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${darkMode ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-50 text-amber-700 border border-amber-200'}`} title={`${pr.absences.total}j d'absence · ETP effectif selon planning`}>
                                  <UserMinus size={11} /> ETP réel {pr.etpReel.toFixed(2)} <span className="opacity-60">(-{delta.toFixed(2)})</span>
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Agents Pool RH affectés à ce service */}
                    {poolRH.filter(a => (a.affectations || []).some(aff => aff.entityType === 'service' && aff.entityId === service.id)).map(poolAgent => {
                      const aff = (poolAgent.affectations || []).find(a => a.entityType === 'service' && a.entityId === service.id);
                      return (
                        <div key={poolAgent.id} className={`mt-2 p-3 rounded-xl border group ${darkMode ? 'bg-purple-900/20 border-purple-700' : 'bg-purple-50 border-purple-200'}`}>
                          <div className="flex items-center gap-2 flex-wrap text-xs">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-purple-500 text-white">Partagé</span>
                            <span className={`font-bold flex-1 ${darkMode ? 'text-white' : 'text-slate-800'}`}>{poolAgent.titre}</span>
                            <span className={darkMode ? 'text-gray-400' : 'text-slate-500'}>Quote-part :</span>
                            <input
                              type="number" min="0" max="100"
                              className={`w-14 text-right rounded px-2 py-1 font-bold border ${darkMode ? 'bg-purple-900/40 border-purple-600 text-purple-200' : 'bg-white border-purple-300'}`}
                              value={aff?.pct ?? 100}
                              onChange={e => {
                                const newPct = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                                setPoolRH(poolRH.map(a => a.id === poolAgent.id ? {
                                  ...a,
                                  affectations: a.affectations.map(af =>
                                    af.entityType === 'service' && af.entityId === service.id ? {...af, pct: newPct} : af
                                  )
                                } : a));
                              }}
                            />
                            <span className={darkMode ? 'text-gray-500' : 'text-slate-400'}>%</span>
                            <button
                              onClick={() => {
                                const {multiAffectation: _ma, affectations: _af, ...agentBack} = poolAgent;
                                setServices(services.map(s => s.id === service.id ? {...s, personnel: [...s.personnel, agentBack]} : s));
                                setPoolRH(poolRH.filter(x => x.id !== poolAgent.id));
                              }}
                              title="Annuler le partage — replacer dans ce service uniquement"
                              className={`no-print ml-auto p-1 rounded ${darkMode ? 'text-purple-400 hover:bg-purple-800' : 'text-purple-600 hover:bg-purple-100'}`}
                            ><X size={12} /></button>
                          </div>
                        </div>
                      );
                    })}
                    {/* Vacataires pédagogiques */}
                    {(() => {
                      const MOIS_VAC_COURTS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
                      const MOIS_VAC_KEYS   = ['jan','fev','mar','avr','mai','jun','jul','aou','sep','oct','nov','dec'];
                      const updV = (vid, patch) => setServices(services.map(s => s.id === service.id ? {...s, vacataires: (s.vacataires||[]).map(x => x.id === vid ? {...x, ...patch} : x)} : s));
                      const today = new Date();
                      return (
                        <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-600' : 'border-teal-200'}`}>
                          {/* En-tête + enveloppe budgétaire */}
                          <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
                            <h4 className={`text-xs font-black uppercase flex items-center gap-1.5 ${darkMode ? 'text-purple-400' : 'text-purple-700'}`}>
                              <GraduationCap size={14} /> Vacataires FC / FI
                            </h4>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Enveloppe :</span>
                              <input type="number" min="0" step="100" placeholder="0 €"
                                className={`w-24 rounded px-2 py-0.5 text-xs font-bold ${darkMode ? 'bg-gray-600 text-white' : 'bg-white border'} ${bs.alerteEnveloppe ? 'border-red-500' : ''}`}
                                value={service.budgetVacataires || ''}
                                onChange={e => setServices(services.map(s => s.id === service.id ? {...s, budgetVacataires: parseFloat(e.target.value) || 0} : s))}
                              />
                              <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>€/an</span>
                              <button onClick={() => setServices(services.map(s => s.id === service.id ? {
                                ...s, vacataires: [...(s.vacataires||[]), { id: Date.now(), nom: 'Intervenant', type: 'fi', tauxHoraire: 50, tauxCharges: CHARGES_VACATAIRE, pctFI: 100, planningMensuel: { jan:0,fev:0,mar:0,avr:0,mai:0,jun:0,jul:0,aou:0,sep:0,oct:0,nov:0,dec:0 }, typeContrat: 'convention', siret: '', dateDebut: '', dateFin: '' }]
                              } : s))}
                                className={`text-xs flex items-center gap-1 px-2 py-1 rounded-lg no-print ${darkMode ? 'bg-purple-800 text-purple-200 hover:bg-purple-700' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}
                              ><Plus size={12} /> Ajouter</button>
                            </div>
                          </div>

                          {/* Alertes enveloppe */}
                          {bs.alerteEnveloppe && (
                            <div className={`mb-2 flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg ${darkMode ? 'bg-red-900/40 text-red-300' : 'bg-red-50 border border-red-300 text-red-700'}`}>
                              <AlertTriangle size={12} /> Enveloppe dépassée : {Math.round(bs.coutVacataires).toLocaleString()} € / {Math.round(bs.enveloppeVacataires).toLocaleString()} €
                            </div>
                          )}
                          {bs.alerteRatioVacataires && (
                            <div className={`mb-2 flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg ${darkMode ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-50 border border-amber-300 text-amber-700'}`}>
                              <AlertTriangle size={12} /> Ratio vacataires élevé : {bs.ratioVacataires.toFixed(0)}% de la masse salariale (seuil {SEUIL_RATIO_VACATAIRE}%)
                            </div>
                          )}

                          <div className="space-y-3">
                            {(service.vacataires || []).map((v) => {
                              const MOIS_VAC_K = ['jan','fev','mar','avr','mai','jun','jul','aou','sep','oct','nov','dec'];
                              const heuresMois = MOIS_VAC_K.map(m => parseFloat(v.planningMensuel?.[m]) || 0);
                              const hTotal = heuresMois.reduce((s,h) => s+h, 0) || 0;
                              const tauxH = parseFloat(v.tauxHoraire) || 0;
                              const charges = parseFloat(v.tauxCharges ?? CHARGES_VACATAIRE) / 100;
                              const coutCharge = hTotal * tauxH * (1 + charges);
                              const depasse = hTotal > SEUIL_HEURES_VACATAIRE;
                              const contratExpire = v.dateFin && new Date(v.dateFin) < today;
                              const contratManquant = !v.dateFin;
                              return (
                                <div key={v.id} className={`p-3 rounded-xl border group relative ${darkMode ? 'bg-gray-600 border-purple-900' : 'bg-purple-50 border-purple-200'} ${(depasse||contratExpire) ? 'border-red-400' : ''}`}>
                                  <button onClick={() => setServices(services.map(s => s.id === service.id ? {...s, vacataires: (s.vacataires||[]).filter(x => x.id !== v.id)} : s))} className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 no-print"><Trash2 size={12} /></button>

                                  {/* Ligne 1 : nom + type pédago + type contrat */}
                                  <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <input className={`font-bold text-xs flex-1 min-w-0 outline-none bg-transparent ${darkMode ? 'text-white' : 'text-slate-800'}`} value={v.nom} onChange={e => updV(v.id, {nom: e.target.value})} />
                                    <select className={`rounded px-1.5 py-0.5 text-xs font-black ${darkMode ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800 border border-purple-300'}`} value={v.type} onChange={e => updV(v.id, {type: e.target.value, pctFI: e.target.value==='fi'?100:e.target.value==='fc'?0:v.pctFI})}>
                                      <option value="fi">FI</option>
                                      <option value="fc">FC</option>
                                      <option value="mixte">Mixte</option>
                                    </select>
                                    <select className={`rounded px-1.5 py-0.5 text-xs ${darkMode ? 'bg-gray-500 text-gray-200' : 'bg-white border text-slate-600'}`} value={v.typeContrat || 'convention'} onChange={e => updV(v.id, {typeContrat: e.target.value})}>
                                      <option value="convention">Convention</option>
                                      <option value="intervention">Contrat d'intervention</option>
                                      <option value="auto_entrepreneur">Auto-entrepreneur</option>
                                      <option value="autre">Autre</option>
                                    </select>
                                  </div>

                                  {/* Ligne 2 : taux horaire + charges + % FI */}
                                  <div className="flex flex-wrap items-center gap-3 text-xs mb-2">
                                    <div className="flex items-center gap-1">
                                      <span className={darkMode ? 'text-gray-400' : 'text-slate-500'}>Taux</span>
                                      <input type="number" min="0" step="1" className={`w-16 rounded px-1.5 py-0.5 font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-white border'}`} value={v.tauxHoraire} onChange={e => updV(v.id, {tauxHoraire: parseFloat(e.target.value)||0})} />
                                      <span className={darkMode ? 'text-gray-400' : 'text-slate-500'}>€/h</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className={darkMode ? 'text-gray-400' : 'text-slate-500'}>Ch.</span>
                                      <input type="number" min="0" max="100" step="1" className={`w-12 rounded px-1.5 py-0.5 font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-white border'}`} value={v.tauxCharges ?? CHARGES_VACATAIRE} onChange={e => updV(v.id, {tauxCharges: parseFloat(e.target.value)||0})} />
                                      <span className={darkMode ? 'text-gray-400' : 'text-slate-500'}>%</span>
                                    </div>
                                    {v.type === 'mixte' && (
                                      <div className="flex items-center gap-1">
                                        <span className={darkMode ? 'text-gray-400' : 'text-slate-500'}>%FI</span>
                                        <input type="number" min="0" max="100" step="5" className={`w-12 rounded px-1.5 py-0.5 font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-white border'}`} value={v.pctFI ?? 50} onChange={e => updV(v.id, {pctFI: parseFloat(e.target.value)||0})} />
                                        <span className={darkMode ? 'text-gray-400' : 'text-slate-400'}>FC:{100-(v.pctFI??50)}%</span>
                                      </div>
                                    )}
                                    {v.typeContrat === 'auto_entrepreneur' && (
                                      <div className="flex items-center gap-1">
                                        <span className={darkMode ? 'text-gray-400' : 'text-slate-500'}>SIRET</span>
                                        <input type="text" maxLength={14} placeholder="14 chiffres" className={`w-32 rounded px-1.5 py-0.5 text-xs font-mono ${darkMode ? 'bg-gray-500 text-white' : 'bg-white border'}`} value={v.siret || ''} onChange={e => updV(v.id, {siret: e.target.value})} />
                                      </div>
                                    )}
                                  </div>

                                  {/* Ligne 3 : dates contrat */}
                                  <div className="flex flex-wrap items-center gap-3 text-xs mb-2">
                                    <div className="flex items-center gap-1">
                                      <span className={darkMode ? 'text-gray-400' : 'text-slate-500'}>Début</span>
                                      <input type="date" className={`rounded px-1.5 py-0.5 text-xs ${darkMode ? 'bg-gray-500 text-white' : 'bg-white border'}`} value={v.dateDebut || ''} onChange={e => updV(v.id, {dateDebut: e.target.value})} />
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className={`${darkMode ? 'text-gray-400' : 'text-slate-500'} ${contratExpire ? 'text-red-500 font-black' : ''}`}>Fin</span>
                                      <input type="date" className={`rounded px-1.5 py-0.5 text-xs ${darkMode ? 'bg-gray-500 text-white' : 'bg-white border'} ${contratExpire ? 'border-red-500' : ''}`} value={v.dateFin || ''} onChange={e => updV(v.id, {dateFin: e.target.value})} />
                                    </div>
                                    {contratExpire && <span className="text-red-500 font-black text-xs flex items-center gap-1"><AlertTriangle size={11} /> Expiré</span>}
                                    {contratManquant && <span className={`text-xs ${darkMode ? 'text-amber-400' : 'text-amber-600'} flex items-center gap-1`}><AlertCircle size={11} /> Fin manquante</span>}
                                  </div>

                                  {/* Planning mensuel 12 mois */}
                                  <div className={`rounded-lg p-2 ${darkMode ? 'bg-gray-700' : 'bg-white border border-purple-100'}`}>
                                    <div className="flex justify-between items-center mb-1">
                                      <span className={`text-xs font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>Planning mensuel (h)</span>
                                      <div className="flex gap-1">
                                        <button onClick={() => {
                                          const eq = Math.round(hTotal / 12);
                                          const plan = {};
                                          MOIS_VAC_K.forEach(m => { plan[m] = eq; });
                                          updV(v.id, {planningMensuel: plan});
                                        }} className={`text-xs px-1.5 py-0.5 rounded no-print ${darkMode ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`} title="Répartir uniformément">= Égal</button>
                                        <button onClick={() => updV(v.id, {planningMensuel: { jan:0,fev:0,mar:0,avr:0,mai:0,jun:0,jul:0,aou:0,sep:0,oct:0,nov:0,dec:0 }})} className={`text-xs px-1.5 py-0.5 rounded no-print ${darkMode ? 'bg-gray-600 text-gray-300' : 'bg-slate-100 text-slate-500'}`} title="Tout vider">RAZ</button>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-6 gap-1">
                                      {MOIS_VAC_KEYS.map((m, i) => (
                                        <div key={m} className="text-center">
                                          <div className={`text-xs mb-0.5 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>{MOIS_VAC_COURTS[i]}</div>
                                          <input type="number" min="0" step="1"
                                            className={`w-full text-center rounded px-0.5 py-0.5 text-xs font-bold ${darkMode ? 'bg-gray-600 text-white' : 'bg-purple-50 border border-purple-200'} ${heuresMois[i] > 0 ? (darkMode ? 'bg-purple-900/40' : 'bg-purple-100') : ''}`}
                                            value={v.planningMensuel?.[m] ?? 0}
                                            onChange={e => updV(v.id, {planningMensuel: {...(v.planningMensuel||{}), [m]: parseFloat(e.target.value)||0}})}
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Récapitulatif + alertes */}
                                  <div className={`mt-2 pt-2 border-t text-xs font-bold flex flex-wrap justify-between gap-1 ${darkMode ? 'border-gray-500' : 'border-purple-200'}`}>
                                    <span className={darkMode ? 'text-purple-300' : 'text-purple-700'}>
                                      {hTotal}h × {tauxH}€/h + {v.tauxCharges ?? CHARGES_VACATAIRE}% = {Math.round(coutCharge).toLocaleString()} €/an
                                    </span>
                                    {depasse && <span className="flex items-center gap-1 text-red-500"><AlertTriangle size={11} /> Seuil {SEUIL_HEURES_VACATAIRE}h dépassé</span>}
                                  </div>
                                </div>
                              );
                            })}
                            {(service.vacataires || []).length === 0 && (
                              <p className={`text-xs text-center py-2 ${darkMode ? 'text-gray-600' : 'text-slate-300'}`}>Aucun vacataire — cliquer "+ Ajouter"</p>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-600' : 'border-teal-200'} flex justify-between font-bold`}>
                      <span className={darkMode ? 'text-gray-300' : 'text-slate-700'}>Masse salariale:</span>
                      <span className={darkMode ? 'text-white' : 'text-slate-800'}>{Math.round(bs.salaires).toLocaleString()} €</span>
                    </div>
                    {bs.coutVacataires > 0 && (
                      <div className={`mt-1 flex justify-between text-xs font-bold ${darkMode ? 'text-purple-400' : 'text-purple-700'}`}>
                        <span className="flex items-center gap-1"><GraduationCap size={11} /> dont vacataires ({(service.vacataires||[]).length}) · ratio {bs.ratioVacataires.toFixed(0)}% :</span>
                        <span>{Math.round(bs.coutVacataires).toLocaleString()} €</span>
                      </div>
                    )}
                    {bs.coutVacatairesFI > 0 && (
                      <div className={`mt-0.5 flex justify-between text-xs ${darkMode ? 'text-amber-400' : 'text-amber-700'}`}>
                        <span className="pl-4">dont FI :</span><span>{Math.round(bs.coutVacatairesFI).toLocaleString()} €</span>
                      </div>
                    )}
                    {bs.coutVacatairesFC > 0 && (
                      <div className={`mt-0.5 flex justify-between text-xs ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                        <span className="pl-4">dont FC :</span><span>{Math.round(bs.coutVacatairesFC).toLocaleString()} €</span>
                      </div>
                    )}
                    {bs.coutParEtudiant && (
                      <div className={`mt-1 flex justify-between text-xs font-bold ${darkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>
                        <span>Coût total / étudiant ({bs.coutParEtudiant.effectif}) :</span>
                        <span>{Math.round(bs.coutParEtudiant.coutParEtudiant).toLocaleString()} €</span>
                      </div>
                    )}
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
                          <input type="number" placeholder="réel" title="Montant réalisé (€/mois)" className={`w-16 text-right text-xs rounded px-2 py-1 border ${item.realise != null ? (darkMode ? 'bg-blue-900/40 border-blue-600 text-blue-200' : 'bg-blue-50 border-blue-300 text-blue-800') : (darkMode ? 'bg-gray-700 border-gray-600 text-gray-500' : 'bg-white border-slate-200 text-slate-400')}`} value={item.realise ?? ''} onChange={(e) => { const v = e.target.value === '' ? null : validerMontant(e.target.value); setServices(services.map(s => s.id === service.id ? {...s, recettes: s.recettes.map(rec => rec.id === item.id ? {...rec, realise: v} : rec)} : s)); }} />
                          {item.realise != null && (() => { const ecart = (item.realise - item.montant); return <span className={`text-[10px] font-bold ${ecart >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{ecart >= 0 ? '+' : ''}{Math.round(ecart).toLocaleString()}€</span>; })()}
                          <button
                            onClick={() => setSaisonnaliteDialog({ type: 'service', entityId: service.id, recetteId: item.id })}
                            title={item.repartitionMensuelle ? 'Saisonnalité configurée — modifier' : 'Configurer la saisonnalité mensuelle'}
                            className={`no-print p-1 rounded-lg transition-colors ${item.repartitionMensuelle ? (darkMode ? 'bg-cyan-800/60 text-cyan-300' : 'bg-cyan-100 text-cyan-700') : (darkMode ? 'text-gray-500 hover:text-cyan-400' : 'text-slate-300 hover:text-cyan-500')}`}
                          ><Calendar size={13} /></button>
                        </div>
                      ))}
                    </div>
                    <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-600' : 'border-green-200'} flex justify-between font-bold`}>
                      <span className={darkMode ? 'text-green-400' : 'text-green-700'}>Total/an:</span>
                      <div className="text-right">
                        <div className={darkMode ? 'text-white' : 'text-green-800'}>{Math.round(bs.recettes).toLocaleString()} €</div>
                        {bs.recettesRealisees > 0 && <div className={`text-xs ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>Réalisé: {Math.round(bs.recettesRealisees).toLocaleString()} €</div>}
                      </div>
                    </div>
                    {bs.hasRealise && (() => {
                      const ecartRec = bs.recettesRealisees - bs.recettes;
                      const ecartExp = bs.exploitationRealisee - bs.exploitation;
                      return (
                        <div className={`mt-2 p-2 rounded-xl text-xs font-bold flex gap-3 ${darkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>
                          <span>Écart recettes: <span className={ecartRec >= 0 ? 'text-emerald-500' : 'text-red-500'}>{ecartRec >= 0 ? '+' : ''}{Math.round(ecartRec).toLocaleString()} €</span></span>
                          {bs.exploitationRealisee > 0 && <span>Écart charges: <span className={ecartExp > 0 ? 'text-red-500' : 'text-emerald-500'}>{ecartExp > 0 ? '+' : ''}{Math.round(ecartExp).toLocaleString()} €</span></span>}
                        </div>
                      );
                    })()}
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
                      {tousSalariesPilotage.length === 0 && salariesBudget.length === 0 ? (
                        <p className={`text-sm text-center py-4 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                          Aucun formateur configuré. Ajoutez des agents dans les équipes des services ou des formateurs dans le Pilotage Financier.
                        </p>
                      ) : (
                        <>
                          {/* Liste sessions simulées */}
                          <div className="space-y-3 mb-4">
                            {sessionsSimulees.map((sess, sessIdx) => {
                              const res = calcSession(sess);
                              const formateur = tousSalariesPilotage.find(s => s.id === sess.formateurId)
                                             || salariesBudget.find(s => s.id === sess.formateurId);
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
                                        {/* Salariés du budget */}
                                        {salariesBudget.length > 0 && (() => {
                                          const groupes = {};
                                          salariesBudget.forEach(s => {
                                            if (!groupes[s._source]) groupes[s._source] = [];
                                            groupes[s._source].push(s);
                                          });
                                          return Object.entries(groupes).map(([src, membres]) => (
                                            <optgroup key={`budget-${src}`} label={src}>
                                              {membres.map(sal => {
                                                const c = calcSalarieFormateur(sal);
                                                return (
                                                  <option key={sal.id} value={sal.id}>
                                                    {sal.nom} ({Math.round(c.coutHoraireFacture)}€/h)
                                                  </option>
                                                );
                                              })}
                                            </optgroup>
                                          ));
                                        })()}
                                        {/* Salariés Pilotage Financier */}
                                        {pilotageSites.map(site => (
                                          <optgroup key={site.id} label={`Pilotage — ${site.nom}`}>
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
        </>}

        {/* ─── RESSOURCES HUMAINES ─── */}
        {activeTab === 'rh' && <>

        {/* ═══════════════════════════════════════════════════════
            PILOTAGE MASSE SALARIALE — TOUS SALARIÉS
            ═══════════════════════════════════════════════════════ */}
        {(() => {
          const tousP = [
            ...(direction?.personnel || []).map(p => ({ ...p, source: 'Direction', couleur: 'slate' })),
            ...(poleSupport?.personnel || []).map(p => ({ ...p, source: 'Pôle Support', couleur: 'cyan' })),
            ...services.flatMap(s => (s.personnel || []).map(p => ({ ...p, source: s.nom, couleur: 'teal' }))),
            ...(poolRH || []).map(p => ({ ...p, source: 'Pool RH', couleur: 'purple' })),
          ];
          const agentsMS = calculerPresenceEquipe(tousP, planningAbsences, 2026);
          const total = tousP.reduce((acc, p) => {
            const segurResolu = p.segur === true ? msETP : (parseFloat(p.segur) || 0);
            const s = calculerSalaireAnnuel(p.salaire, p.etp, segurResolu);
            return acc + s.total;
          }, 0);
          const totalETPReelMS = agentsMS.reduce((s, a) => s + a.presence.etpReel, 0);
          // Vacataires de tous les services
          const MOIS_VAC_RH = ['jan','fev','mar','avr','mai','jun','jul','aou','sep','oct','nov','dec'];
          const tousVacataires = services.flatMap(s => (s.vacataires || []).map(v => {
            const planMois = v.planningMensuel;
            const heuresMensuelles = MOIS_VAC_RH.map(m => parseFloat(planMois?.[m]) || 0);
            const heures = heuresMensuelles.reduce((s, h) => s + h, 0) || (parseFloat(v.heuresAnnuelles) || 0);
            const tauxH = parseFloat(v.tauxHoraire) || 0;
            const charges = parseFloat(v.tauxCharges ?? CHARGES_VACATAIRE) / 100;
            return { ...v, serviceNom: s.nom, coutCharge: heures * tauxH * (1 + charges) };
          })).filter(v => v.coutCharge > 0);
          const totalVacataires = tousVacataires.reduce((s, v) => s + v.coutCharge, 0);
          const ROLES_COLOR = {
            direction: 'violet', formateur: 'teal', administratif: 'blue',
            technique: 'orange', documentation: 'amber', autre: 'slate',
          };
          const roleLabel = { direction: 'Siège', formateur: 'Formateur', administratif: 'Administratif', technique: 'Technique', documentation: 'Documentation', autre: 'Autre' };
          // Regroupement par rôle pour mini-graphe
          const parRole = {};
          tousP.forEach(p => {
            const r = p.role || 'autre';
            const segurResolu = p.segur === true ? msETP : (parseFloat(p.segur) || 0);
            const s = calculerSalaireAnnuel(p.salaire, p.etp, segurResolu);
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
                <div className="flex items-end gap-4">
                  {(() => {
                    const nbSegur = tousP.filter(p => !!p.segur).length;
                    const totalSegurAnnuel = tousP.reduce((s, p) => {
                      if (!p.segur) return s;
                      const montant = p.segur === true ? msETP : (parseFloat(p.segur) || 0);
                      return s + montant * 12 * (parseFloat(p.etp) || 0) * (1 + CHARGES_PATRONALES);
                    }, 0);
                    return nbSegur > 0 ? (
                      <div className={`text-right`}>
                        <div className={`text-xs font-bold mb-0.5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>Prime Ségur ({nbSegur} agents)</div>
                        <div className={`text-lg font-black ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>{Math.round(totalSegurAnnuel).toLocaleString()} €/an</div>
                        <div className={`text-xs ${darkMode ? 'text-blue-500' : 'text-blue-400'}`}>{msETP} €/ETP/mois · coût employeur</div>
                      </div>
                    ) : null;
                  })()}
                  <div className={`text-right`}>
                    <div className={`text-xs font-bold mb-0.5 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Masse salariale totale</div>
                    <div className={`text-2xl font-black ${darkMode ? 'text-teal-300' : 'text-teal-700'}`}>{Math.round(total).toLocaleString()} €/an</div>
                  </div>
                </div>
              </div>

              {/* Répartition par rôle */}
              <div className="flex flex-wrap gap-2 mb-4">
                {Object.entries(parRole).sort((a, b) => b[1] - a[1]).map(([role, montant]) => {
                  const pct = total > 0 ? Math.round(montant / total * 100) : 0;
                  const ROLE_BADGE = {
                    direction:    darkMode ? 'bg-violet-900/40 text-violet-300' : 'bg-violet-100 text-violet-700',
                    formateur:    darkMode ? 'bg-teal-900/40 text-teal-300'     : 'bg-teal-100 text-teal-700',
                    administratif:darkMode ? 'bg-blue-900/40 text-blue-300'     : 'bg-blue-100 text-blue-700',
                    technique:    darkMode ? 'bg-orange-900/40 text-orange-300' : 'bg-orange-100 text-orange-700',
                    documentation:darkMode ? 'bg-amber-900/40 text-amber-300'   : 'bg-amber-100 text-amber-700',
                    responsable:  darkMode ? 'bg-cyan-900/40 text-cyan-300'     : 'bg-cyan-100 text-cyan-700',
                  };
                  const badgeCls = ROLE_BADGE[role] || (darkMode ? 'bg-slate-900/40 text-slate-300' : 'bg-slate-100 text-slate-700');
                  return (
                    <div key={role} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${badgeCls}`}>
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
                      <th className="text-right pb-2 text-teal-500" title="ETP réel calculé depuis le planning absences">ETP réel</th>
                      <th className="text-right pb-2">Sal. brut/mois</th>
                      <th className="text-right pb-2">Ségur</th>
                      <th className="text-right pb-2">Charges</th>
                      <th className="text-right pb-2 pr-1">Coût total/an</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agentsMS.map((p, idx) => {
                      const segurResolu = p.segur === true ? msETP : (parseFloat(p.segur) || 0);
                      const s = calculerSalaireAnnuel(p.salaire, p.etp, segurResolu);
                      const isDir = p.source === 'Direction';
                      const etpReel = p.presence.etpReel;
                      const etpDelta = parseFloat(p.etp) - etpReel;
                      return (
                        <tr key={idx} id={`agent-rh-${p.id}`} className={`border-t transition-all duration-700 ${focusedAgentId === p.id ? (darkMode ? 'bg-yellow-900/40' : 'bg-yellow-50') : (darkMode ? 'border-gray-700' : 'border-slate-100')} ${isDir ? (darkMode ? 'bg-violet-900/10' : 'bg-violet-50/50') : ''}`}>
                          <td className={`py-1.5 pl-1 font-bold max-w-[180px]`}>
                            <button onClick={() => navigateToBudgetAgent(p.id)} className={`group/link flex items-center gap-1 text-left font-bold truncate max-w-full ${darkMode ? 'text-white hover:text-teal-300' : 'text-slate-800 hover:text-teal-600'} transition-colors`} title={`Voir ${p.titre} dans Budget`}>
                              <span className={`truncate ${privacyMode ? 'blur-sm select-none' : ''}`}>{p.titre}</span>
                              <ExternalLink size={10} className="opacity-0 group-hover/link:opacity-100 shrink-0 transition-opacity" />
                            </button>
                          </td>
                          <td className={`py-1.5 text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'} max-w-[120px] truncate`} title={p.source}>{p.source}</td>
                          <td className="py-1.5">
                            <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-slate-100 text-slate-600'}`}>
                              {roleLabel[p.role] || p.role || '—'}
                            </span>
                            {p.rqth && <span className={`ml-1 px-1.5 py-0.5 rounded text-xs font-bold ${darkMode ? 'bg-orange-900/50 text-orange-400' : 'bg-orange-100 text-orange-700'}`}>RQTH</span>}
                          </td>
                          <td className={`py-1.5 text-right ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>{p.etp}</td>
                          <td className={`py-1.5 text-right font-bold ${etpDelta > 0.05 ? (darkMode ? 'text-amber-400' : 'text-amber-600') : (darkMode ? 'text-teal-400' : 'text-teal-600')}`} title={etpDelta > 0.05 ? `Absences : -${etpDelta.toFixed(2)} ETP` : 'Présence nominale'}>
                            {etpReel.toFixed(2)}
                            {etpDelta > 0.05 && <span className="ml-1 text-xs opacity-70">(-{etpDelta.toFixed(2)})</span>}
                          </td>
                          <td className={`py-1.5 text-right ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>{p.salaire.toLocaleString()} €</td>
                          <td className={`py-1.5 text-right ${p.segur ? (darkMode ? 'text-blue-400' : 'text-blue-600') : (darkMode ? 'text-gray-600' : 'text-slate-300')}`}>
                            {(() => { const m = p.segur === true ? (globalParams.montantSegurETP ?? PRIME_SEGUR) : (parseFloat(p.segur) || 0); return m > 0 ? `+${m.toLocaleString()} €/m` : '—'; })()}
                          </td>
                          <td className={`py-1.5 text-right ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{Math.round(s.charges).toLocaleString()} €</td>
                          <td className={`py-1.5 text-right pr-1 font-black ${darkMode ? 'text-teal-300' : 'text-teal-700'}`}>{Math.round(s.total).toLocaleString()} €</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {tousVacataires.length > 0 && (
                    <tbody>
                      <tr className={`border-t-2 ${darkMode ? 'border-purple-800' : 'border-purple-200'}`}>
                        <td colSpan={9} className={`py-1.5 pl-1 text-xs font-black uppercase ${darkMode ? 'text-purple-400' : 'text-purple-700'}`}>
                          <GraduationCap size={12} className="inline mr-1" /> Vacataires pédagogiques
                        </td>
                      </tr>
                      {tousVacataires.map((v, idx) => (
                        <tr key={idx} className={`border-t ${darkMode ? 'border-gray-700 bg-purple-900/10' : 'border-purple-100 bg-purple-50/40'}`}>
                          <td className={`py-1.5 pl-1 font-bold ${darkMode ? 'text-purple-200' : 'text-purple-800'} max-w-[180px] truncate`} title={v.nom}>{v.nom}</td>
                          <td className={`py-1.5 text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'} max-w-[120px] truncate`}>{v.serviceNom}</td>
                          <td className="py-1.5">
                            <span className={`px-1.5 py-0.5 rounded text-xs font-black ${v.type === 'fi' ? (darkMode ? 'bg-amber-900/50 text-amber-400' : 'bg-amber-100 text-amber-700') : v.type === 'fc' ? (darkMode ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-700') : (darkMode ? 'bg-purple-900/50 text-purple-400' : 'bg-purple-100 text-purple-700')}`}>
                              {v.type === 'fi' ? 'FI' : v.type === 'fc' ? 'FC' : `Mixte ${v.pctFI}%FI`}
                            </span>
                          </td>
                          <td className={`py-1.5 text-right text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{parseFloat(v.heuresAnnuelles) || 0}h</td>
                          <td className={`py-1.5 text-right text-xs ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>—</td>
                          <td className={`py-1.5 text-right text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{parseFloat(v.tauxHoraire) || 0} €/h</td>
                          <td className={`py-1.5 text-right text-xs ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>+{v.tauxCharges ?? CHARGES_VACATAIRE}%</td>
                          <td className={`py-1.5 text-right text-xs ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>—</td>
                          <td className={`py-1.5 text-right pr-1 font-black ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>{Math.round(v.coutCharge).toLocaleString()} €</td>
                        </tr>
                      ))}
                    </tbody>
                  )}
                  <tfoot>
                    <tr className={`border-t-2 font-black ${darkMode ? 'border-teal-700 bg-teal-900/20' : 'border-teal-300 bg-teal-50'}`}>
                      <td colSpan={3} className={`py-2 pl-1 text-sm ${darkMode ? 'text-white' : 'text-slate-800'}`}>TOTAL</td>
                      <td className={`py-2 text-right text-sm ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>{tousP.reduce((s, p) => s + p.etp, 0).toFixed(1)}</td>
                      <td className={`py-2 text-right text-sm font-black ${darkMode ? 'text-teal-300' : 'text-teal-700'}`}>{totalETPReelMS.toFixed(1)}</td>
                      <td colSpan={3} />
                      <td className={`py-2 text-right pr-1 text-base ${darkMode ? 'text-teal-200' : 'text-teal-800'}`}>{Math.round(total + totalVacataires).toLocaleString()} €</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          );
        })()}

        {/* ═══ TABLEAU TRANSVERSAL PRÉSENCE / ABSENCES ═══ */}
        {(() => {
          const ANNEE = 2026;
          const tousAgents = [
            ...(direction?.personnel || []).map(p => ({ ...p, source: 'Direction' })),
            ...(poleSupport?.personnel || []).map(p => ({ ...p, source: 'Pôle Support' })),
            ...services.flatMap(s => (s.personnel || []).map(p => ({ ...p, source: s.nom }))),
          ];
          const agentsAvecPresence = calculerPresenceEquipe(tousAgents, planningAbsences, ANNEE);
          const totalETPContrat = agentsAvecPresence.reduce((s, a) => s + parseFloat(a.etp), 0);
          const totalETPReel    = agentsAvecPresence.reduce((s, a) => s + a.presence.etpReel, 0);
          const totalMaladie    = agentsAvecPresence.reduce((s, a) => s + a.presence.joursMaladiePlanning, 0);
          const totalCongesP    = agentsAvecPresence.reduce((s, a) => s + a.presence.joursCongesPlanning, 0);
          const totalRTTP       = agentsAvecPresence.reduce((s, a) => s + a.presence.joursRTTPlanning, 0);
          const totalFormationP = agentsAvecPresence.reduce((s, a) => s + a.presence.joursFormationPlanning, 0);
          const tauxPresenceMoyen = totalETPContrat > 0 ? (totalETPReel / totalETPContrat) * 100 : 100;

          return (
            <div className={`rounded-3xl shadow-lg border-2 p-6 mb-8 print-avoid-break ${darkMode ? 'bg-gray-800 border-teal-900' : 'bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200'}`}>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                <div className="flex items-center gap-3">
                  <Calendar className={darkMode ? 'text-teal-400' : 'text-teal-600'} size={28} />
                  <div>
                    <h2 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>Synthèse Présence / Absences</h2>
                    <span className={`text-xs font-bold ${darkMode ? 'text-teal-400' : 'text-teal-600'}`}>
                      Transversalité RH ↔ Budget · Année {ANNEE} · Base {JOURS_OUVRES_AN} jours ouvrés
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  {[
                    { label: 'ETP contrat', val: totalETPContrat.toFixed(1), color: darkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-700' },
                    { label: 'ETP réel', val: totalETPReel.toFixed(1), color: darkMode ? 'bg-teal-900/40 text-teal-300' : 'bg-teal-100 text-teal-700' },
                    { label: 'Taux présence', val: `${tauxPresenceMoyen.toFixed(1)}%`, color: tauxPresenceMoyen >= 95 ? (darkMode ? 'bg-emerald-900/40 text-emerald-300' : 'bg-emerald-100 text-emerald-700') : (darkMode ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-100 text-amber-700') },
                    { label: 'J. maladie (plan.)', val: totalMaladie, color: darkMode ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-700' },
                  ].map((k, i) => (
                    <div key={i} className={`px-3 py-2 rounded-2xl text-center ${k.color}`}>
                      <div className="text-xs font-bold opacity-75">{k.label}</div>
                      <div className="text-xl font-black">{k.val}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className={`${darkMode ? 'text-gray-400' : 'text-slate-500'} uppercase font-black text-[11px]`}>
                      <th className="text-left pb-2 pl-1">Agent</th>
                      <th className="text-left pb-2">Service</th>
                      <th className="text-right pb-2">ETP contrat</th>
                      <th className="text-right pb-2" title="Congés payés configurés">CP prévu</th>
                      <th className="text-right pb-2" title="RTT configurés">RTT prévu</th>
                      <th className="text-right pb-2 text-blue-500" title="Congés pris dans le planning">CP réel</th>
                      <th className="text-right pb-2 text-purple-500" title="RTT pris dans le planning">RTT réel</th>
                      <th className="text-right pb-2 text-red-500" title="Maladie/Arrêt dans le planning">Maladie</th>
                      <th className="text-right pb-2 text-green-500" title="Formation dans le planning">Formation</th>
                      <th className="text-right pb-2">Présence eff.</th>
                      <th className="text-right pb-2">ETP réel</th>
                      <th className="text-right pb-2 pr-1 text-red-500" title="Coût carence maladie à charge employeur (j1-j3 non remboursés SS)">Coût carence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agentsAvecPresence.map((a, idx) => {
                      const pr = a.presence;
                      const ecartCP   = pr.joursCongesPlanning - pr.joursConges;
                      const ecartRTT  = pr.joursRTTPlanning - pr.nbJoursRTT;
                      const alertCP   = Math.abs(ecartCP) > 2;
                      const alertMal  = pr.joursMaladiePlanning > 10;
                      return (
                        <tr key={idx} className={`border-t ${darkMode ? 'border-gray-700' : 'border-slate-100'} ${idx % 2 === 0 ? '' : darkMode ? 'bg-gray-700/20' : 'bg-slate-50/50'}`}>
                          <td className={`py-1.5 pl-1 font-bold ${darkMode ? 'text-white' : 'text-slate-800'} max-w-[160px] truncate`} title={a.titre}>{a.titre}</td>
                          <td className={`py-1.5 text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'} max-w-[120px] truncate`}>{a.source}</td>
                          <td className={`py-1.5 text-right font-bold ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>{parseFloat(a.etp).toFixed(2)}</td>
                          <td className={`py-1.5 text-right ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{pr.joursConges}j</td>
                          <td className={`py-1.5 text-right ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{pr.nbJoursRTT > 0 ? `${pr.nbJoursRTT}j` : '—'}</td>
                          <td className={`py-1.5 text-right font-bold ${alertCP ? 'text-amber-500' : (darkMode ? 'text-blue-400' : 'text-blue-600')}`}>
                            {pr.joursCongesPlanning > 0 ? `${pr.joursCongesPlanning}j` : '—'}
                            {alertCP && <span className="ml-1 text-amber-400" title={`Écart: ${ecartCP > 0 ? '+' : ''}${ecartCP}j`}>⚠</span>}
                          </td>
                          <td className={`py-1.5 text-right font-bold ${ecartRTT > 2 ? 'text-amber-500' : (darkMode ? 'text-purple-400' : 'text-purple-600')}`}>
                            {pr.joursRTTPlanning > 0 ? `${pr.joursRTTPlanning}j` : '—'}
                          </td>
                          <td className={`py-1.5 text-right font-bold ${alertMal ? 'text-red-500' : (pr.joursMaladiePlanning > 0 ? (darkMode ? 'text-red-400' : 'text-red-600') : (darkMode ? 'text-gray-600' : 'text-slate-300'))}`}>
                            {pr.joursMaladiePlanning > 0 ? `${pr.joursMaladiePlanning}j` : '—'}
                            {alertMal && <span className="ml-1" title="Absentéisme élevé (>10j)">⚠</span>}
                          </td>
                          <td className={`py-1.5 text-right ${pr.joursFormationPlanning > 0 ? (darkMode ? 'text-green-400' : 'text-green-600') : (darkMode ? 'text-gray-600' : 'text-slate-300')}`}>
                            {pr.joursFormationPlanning > 0 ? `${pr.joursFormationPlanning}j` : '—'}
                          </td>
                          <td className={`py-1.5 text-right font-bold ${pr.tauxPresence < 0.9 ? 'text-amber-500' : (darkMode ? 'text-teal-300' : 'text-teal-700')}`}>
                            {pr.joursPresence}j <span className="text-xs opacity-60">({(pr.tauxPresence*100).toFixed(0)}%)</span>
                          </td>
                          <td className={`py-1.5 text-right font-black ${pr.etpReel < parseFloat(a.etp) * 0.9 ? 'text-amber-500' : (darkMode ? 'text-teal-200' : 'text-teal-800')}`}>
                            {pr.etpReel.toFixed(2)}
                          </td>
                          <td className={`py-1.5 text-right pr-1 font-bold ${pr.coutCarence > 0 ? 'text-red-500' : (darkMode ? 'text-gray-600' : 'text-slate-300')}`}>
                            {pr.coutCarence > 0 ? `${Math.round(pr.coutCarence).toLocaleString()} €` : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    {(() => {
                      const totalCarence = agentsAvecPresence.reduce((s, a) => s + a.presence.coutCarence, 0);
                      return (
                        <tr className={`border-t-2 font-black ${darkMode ? 'border-teal-700 bg-teal-900/20' : 'border-teal-300 bg-teal-50'}`}>
                          <td colSpan={2} className={`py-2 pl-1 text-sm ${darkMode ? 'text-white' : 'text-slate-800'}`}>TOTAL</td>
                          <td className={`py-2 text-right text-sm ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>{totalETPContrat.toFixed(1)}</td>
                          <td colSpan={2} />
                          <td className={`py-2 text-right ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{totalCongesP > 0 ? `${totalCongesP}j` : '—'}</td>
                          <td className={`py-2 text-right ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>{totalRTTP > 0 ? `${totalRTTP}j` : '—'}</td>
                          <td className={`py-2 text-right ${darkMode ? 'text-red-400' : 'text-red-600'}`}>{totalMaladie > 0 ? `${totalMaladie}j` : '—'}</td>
                          <td className={`py-2 text-right ${darkMode ? 'text-green-400' : 'text-green-600'}`}>{totalFormationP > 0 ? `${totalFormationP}j` : '—'}</td>
                          <td className={`py-2 text-right ${darkMode ? 'text-teal-300' : 'text-teal-700'}`}>{tauxPresenceMoyen.toFixed(1)}%</td>
                          <td className={`py-2 text-right text-base ${darkMode ? 'text-teal-200' : 'text-teal-800'}`}>{totalETPReel.toFixed(1)}</td>
                          <td className={`py-2 text-right pr-1 text-base font-black ${totalCarence > 0 ? 'text-red-500' : (darkMode ? 'text-gray-600' : 'text-slate-300')}`}>
                            {totalCarence > 0 ? `${Math.round(totalCarence).toLocaleString()} €` : '—'}
                          </td>
                        </tr>
                      );
                    })()}
                  </tfoot>
                </table>
              </div>

              {/* Synthèse impact budgétaire des absences */}
              {(() => {
                const totalCarence = agentsAvecPresence.reduce((s, a) => s + a.presence.coutCarence, 0);
                const totalJoursAbs = totalMaladie + totalCongesP + totalRTTP;
                const impactETP = totalETPContrat - totalETPReel;
                if (totalJoursAbs === 0 && totalCarence === 0) return null;
                return (
                  <div className={`mt-4 p-4 rounded-2xl border ${darkMode ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'}`}>
                    <div className={`text-xs font-black uppercase mb-3 flex items-center gap-2 ${darkMode ? 'text-red-300' : 'text-red-700'}`}>
                      🔗 Impact budgétaire des absences (synchronisé dans Budget & Subvention)
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'Coût carence maladie', val: `${Math.round(totalCarence).toLocaleString()} €`, sub: 'Ajouté au budget employeur', bg: darkMode ? 'bg-red-900/30' : 'bg-red-50', txt: darkMode ? 'text-red-400' : 'text-red-700' },
                        { label: 'Perte ETP effective', val: `-${impactETP.toFixed(2)} ETP`, sub: 'vs ETP contractuel', bg: darkMode ? 'bg-amber-900/30' : 'bg-amber-50', txt: darkMode ? 'text-amber-400' : 'text-amber-700' },
                        { label: 'J. maladie/arrêt', val: `${totalMaladie} j`, sub: 'Saisis dans Planning', bg: darkMode ? 'bg-orange-900/30' : 'bg-orange-50', txt: darkMode ? 'text-orange-400' : 'text-orange-700' },
                        { label: 'Taux présence moyen', val: `${tauxPresenceMoyen.toFixed(1)}%`, sub: impactETP > 0.5 ? '⚠ Sous 95% recommandé' : '✓ Nominal', bg: tauxPresenceMoyen >= 95 ? (darkMode ? 'bg-emerald-900/30' : 'bg-emerald-50') : (darkMode ? 'bg-amber-900/30' : 'bg-amber-50'), txt: tauxPresenceMoyen >= 95 ? (darkMode ? 'text-emerald-400' : 'text-emerald-700') : (darkMode ? 'text-amber-400' : 'text-amber-700') },
                      ].map(k => (
                        <div key={k.label} className={`p-3 rounded-xl text-center ${k.bg}`}>
                          <div className={`text-[10px] font-bold uppercase mb-1 ${k.txt}`}>{k.label}</div>
                          <div className={`text-base font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>{k.val}</div>
                          <div className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>{k.sub}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Légende */}
              <div className={`mt-4 text-xs ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                <span className="font-bold">Légende : </span>
                CP prévu/réel = congés payés configurés vs. saisis dans le planning ·
                RTT prévu/réel = idem pour RTT ·
                Présence eff. = {JOURS_OUVRES_AN}j - CP configurés - RTT configurés - Maladie (planning) ·
                ETP réel = ETP contrat × taux présence · Coût carence = j1-j3 maladie à charge employeur ·
                <span className="text-amber-500"> ⚠</span> = écart &gt; 2j ou maladie &gt; 10j
              </div>
            </div>
          );
        })()}

        {/* ═══ TABLEAU DE BORD VACATAIRES ═══ */}
        {(() => {
          const stats = calculerStatsVacataires(services, msETP);
          if (stats.totalVacataires === 0) return null;
          const totalMassePerm = services.reduce((s, srv) => {
            const b = getBudgetService(srv);
            return s + b.salairesPersonnelPermanent;
          }, 0);
          const ratioGlobal = (totalMassePerm + stats.totalCout) > 0 ? stats.totalCout / (totalMassePerm + stats.totalCout) * 100 : 0;
          const coutHoraireGlobal = stats.totalHeures > 0 ? stats.totalCout / stats.totalHeures : 0;

          return (
            <div className={`rounded-3xl shadow-lg border-2 p-6 mb-8 print-avoid-break ${darkMode ? 'bg-gray-800 border-purple-900' : 'bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200'}`}>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                <div className="flex items-center gap-3">
                  <GraduationCap className={darkMode ? 'text-purple-400' : 'text-purple-600'} size={28} />
                  <div>
                    <h2 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>Tableau de bord Vacataires</h2>
                    <span className={`text-xs font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>{stats.totalVacataires} intervenant{stats.totalVacataires > 1 ? 's' : ''} · Analyse FC / FI · Contrôle budgétaire</span>
                  </div>
                </div>
                {/* KPIs globaux */}
                <div className="flex flex-wrap gap-3">
                  {[
                    { label: 'Coût total', val: `${Math.round(stats.totalCout).toLocaleString()} €`, color: darkMode ? 'bg-purple-900/40 text-purple-300' : 'bg-purple-100 text-purple-700' },
                    { label: 'Part FI', val: `${Math.round(stats.totalFI).toLocaleString()} €`, color: darkMode ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-100 text-amber-700' },
                    { label: 'Part FC', val: `${Math.round(stats.totalFC).toLocaleString()} €`, color: darkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-700' },
                    { label: 'Heures/an', val: `${Math.round(stats.totalHeures)} h`, color: darkMode ? 'bg-gray-700 text-gray-300' : 'bg-slate-100 text-slate-700' },
                    { label: 'Ratio / MS', val: `${ratioGlobal.toFixed(1)}%`, color: ratioGlobal > SEUIL_RATIO_VACATAIRE ? (darkMode ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-700') : (darkMode ? 'bg-emerald-900/40 text-emerald-300' : 'bg-emerald-100 text-emerald-700') },
                    { label: '€/heure moy.', val: `${Math.round(coutHoraireGlobal)} €`, color: darkMode ? 'bg-gray-700 text-gray-300' : 'bg-slate-100 text-slate-700' },
                  ].map((k, i) => (
                    <div key={i} className={`px-3 py-2 rounded-2xl text-center ${k.color}`}>
                      <div className="text-xs font-bold opacity-75">{k.label}</div>
                      <div className="text-lg font-black">{k.val}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alertes */}
              {stats.alertes.length > 0 && (
                <div className="mb-4 space-y-1">
                  {stats.alertes.map((a, i) => (
                    <div key={i} className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg font-bold ${a.type === 'contrat' ? (darkMode ? 'bg-red-900/40 text-red-300' : 'bg-red-50 border border-red-200 text-red-700') : a.type === 'heures' ? (darkMode ? 'bg-orange-900/40 text-orange-300' : 'bg-orange-50 border border-orange-200 text-orange-700') : (darkMode ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-50 border border-amber-200 text-amber-700')}`}>
                      <AlertTriangle size={12} />
                      <span className="font-black">{a.service}{a.nom ? ` · ${a.nom}` : ''} :</span> {a.msg}
                    </div>
                  ))}
                </div>
              )}

              {/* Planning mensuel coût global */}
              <div className={`mb-5 p-3 rounded-2xl ${darkMode ? 'bg-gray-700/50' : 'bg-white/70 border border-purple-100'}`}>
                <div className={`text-xs font-black uppercase mb-2 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>Coût mensuel global vacataires</div>
                <div className="flex gap-1 h-12 items-end">
                  {stats.coutMensuelTotal.map((c, i) => {
                    const max = Math.max(...stats.coutMensuelTotal, 1);
                    const pct = (c / max) * 100;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                        <div className={`w-full rounded-t ${darkMode ? 'bg-purple-600' : 'bg-purple-400'}`} style={{ height: `${pct}%`, minHeight: c > 0 ? '2px' : '0' }} title={`${stats.moisCourts[i]} : ${Math.round(c).toLocaleString()} €`} />
                        <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>{stats.moisCourts[i]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tableau par service */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className={`${darkMode ? 'text-gray-400' : 'text-slate-500'} uppercase font-black text-[11px]`}>
                      <th className="text-left pb-2 pl-1">Service</th>
                      <th className="text-left pb-2">Intervenant</th>
                      <th className="text-left pb-2">Contrat</th>
                      <th className="text-right pb-2">Heures</th>
                      <th className="text-right pb-2">€/h</th>
                      <th className="text-right pb-2">Coût chargé</th>
                      <th className="text-right pb-2 text-amber-500">FI (€)</th>
                      <th className="text-right pb-2 text-blue-500">FC (€)</th>
                      <th className="text-right pb-2">Ratio</th>
                      <th className="text-right pb-2 pr-1">Alerte</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.parService.map(ps => ps.vacataires.map((v, vi) => (
                      <tr key={`${ps.service}-${vi}`} className={`border-t ${darkMode ? 'border-gray-700' : 'border-slate-100'}`}>
                        <td className={`py-1.5 pl-1 font-bold max-w-[120px] truncate ${darkMode ? 'text-white' : 'text-slate-800'}`}>{vi === 0 ? ps.service : ''}</td>
                        <td className={`py-1.5 font-bold ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>{v.nom}</td>
                        <td className={`py-1.5 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                          <span className={`px-1.5 py-0.5 rounded text-xs ${v.type === 'fi' ? (darkMode ? 'bg-amber-900/50 text-amber-400' : 'bg-amber-100 text-amber-700') : v.type === 'fc' ? (darkMode ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-700') : (darkMode ? 'bg-purple-900/50 text-purple-400' : 'bg-purple-100 text-purple-700')}`}>{v.type.toUpperCase()}</span>
                          {' '}
                          <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>{v.typeContrat === 'auto_entrepreneur' ? 'AE' : v.typeContrat === 'convention' ? 'Conv.' : v.typeContrat === 'intervention' ? 'Interv.' : '?'}</span>
                        </td>
                        <td className={`py-1.5 text-right font-bold ${v.depasse ? 'text-red-500' : (darkMode ? 'text-gray-300' : 'text-slate-700')}`}>{v.heures}h</td>
                        <td className={`py-1.5 text-right ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{v.tauxHoraire}€</td>
                        <td className={`py-1.5 text-right font-bold ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>{Math.round(v.coutCharge).toLocaleString()} €</td>
                        <td className={`py-1.5 text-right ${v.coutFI > 0 ? (darkMode ? 'text-amber-400' : 'text-amber-700') : (darkMode ? 'text-gray-600' : 'text-slate-300')}`}>{v.coutFI > 0 ? `${Math.round(v.coutFI).toLocaleString()} €` : '—'}</td>
                        <td className={`py-1.5 text-right ${v.coutFC > 0 ? (darkMode ? 'text-blue-400' : 'text-blue-700') : (darkMode ? 'text-gray-600' : 'text-slate-300')}`}>{v.coutFC > 0 ? `${Math.round(v.coutFC).toLocaleString()} €` : '—'}</td>
                        <td className={`py-1.5 text-right text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{vi === 0 ? `${ps.ratioVacataires.toFixed(0)}%` : ''}</td>
                        <td className="py-1.5 text-right pr-1">
                          {v.depasse && <span className="text-red-500 font-black">⚠h</span>}
                          {v.contratExpire && <span className="text-red-500 font-black ml-1">⚠exp.</span>}
                          {!v.dateFin && <span className={`text-amber-500 ml-1`}>⚠∅</span>}
                        </td>
                      </tr>
                    )))}
                  </tbody>
                  <tfoot>
                    <tr className={`border-t-2 font-black ${darkMode ? 'border-purple-700 bg-purple-900/20' : 'border-purple-300 bg-purple-50'}`}>
                      <td colSpan={3} className={`py-2 pl-1 text-sm ${darkMode ? 'text-white' : 'text-slate-800'}`}>TOTAL ({stats.totalVacataires} intervenants)</td>
                      <td className={`py-2 text-right ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>{Math.round(stats.totalHeures)}h</td>
                      <td />
                      <td className={`py-2 text-right text-base ${darkMode ? 'text-purple-200' : 'text-purple-800'}`}>{Math.round(stats.totalCout).toLocaleString()} €</td>
                      <td className={`py-2 text-right ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>{Math.round(stats.totalFI).toLocaleString()} €</td>
                      <td className={`py-2 text-right ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>{Math.round(stats.totalFC).toLocaleString()} €</td>
                      <td className={`py-2 text-right ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>{ratioGlobal.toFixed(1)}%</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Coût par étudiant par service */}
              {stats.parService.some(ps => ps.coutParEtudiant) && (
                <div className={`mt-4 pt-4 border-t flex flex-wrap gap-3 ${darkMode ? 'border-gray-700' : 'border-purple-200'}`}>
                  <span className={`text-xs font-black uppercase self-center ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>Coût vacataires / étudiant :</span>
                  {stats.parService.filter(ps => ps.coutParEtudiant).map(ps => (
                    <div key={ps.service} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-white border border-purple-200 text-slate-700'}`}>
                      {ps.service} · {Math.round(ps.coutParEtudiant.coutVacatairesParEtudiant).toLocaleString()} €/étud.
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* ═══════════════════════════════════════════════════════
            POOL RH — AGENTS PARTAGÉS
            ═══════════════════════════════════════════════════════ */}
        <div className={`rounded-2xl border p-6 ${darkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-slate-200'}`}>
          <PoolRHManager
            poolRH={poolRH}
            setPoolRH={setPoolRH}
            services={services}
            direction={direction}
            poleSupport={poleSupport}
            darkMode={darkMode}
            msETP={msETP}
          />
        </div>

        </>}


        {/* ─── FORMATION : PILOTAGE FINANCIER ─── */}
        {activeTab === 'formation' && <>
        {/* PILOTAGE FINANCIER */}
        <PilotageFinancier
          key={pilotageResetKey}
          darkMode={darkMode}
          checkPassword={checkPassword}
          budgetPersonnel={[
            ...(direction?.personnel || []).map(p => ({ ...p, source: 'Direction / Siège' })),
            ...(poleSupport?.personnel || []).map(p => ({ ...p, source: 'Pôle Support' })),
            ...services.flatMap(s => (s.personnel || []).map(p => ({ ...p, source: s.nom }))),
            ...(poolRH || []).map(p => ({ ...p, source: 'Pool RH' })),
          ]}
          externalSites={pilotageSites}
          setExternalSites={setPilotageSites}
        />
        </>}

        {/* ─── ONGLET VACATAIRES ─── */}
        {activeTab === 'vacataires' && (
          <CalculateurVacataires
            darkMode={darkMode}
            vacatairesBudget={services.flatMap(s =>
              (s.vacataires || []).map(v => {
                const MOIS = ['jan','fev','mar','avr','mai','jun','jul','aou','sep','oct','nov','dec'];
                const heures = MOIS.reduce((s, m) => s + (parseFloat(v.planningMensuel?.[m]) || 0), 0) || (parseFloat(v.heuresAnnuelles) || 0);
                const taux = parseFloat(v.tauxHoraire) || 0;
                const charges = parseFloat(v.tauxCharges ?? 15) / 100;
                return { service: s.nom, nom: v.nom || 'Vacataire', heures, cout: heures * taux * (1 + charges) };
              })
            ).filter(v => v.cout > 0)}
          />
        )}

        {/* ─── ONGLET SUBVENTION RÉGION ─── */}
        {activeTab === 'subvention' && (
          <SubventionRegion
            darkMode={darkMode}
            services={services}
            direction={direction}
            poleSupport={poleSupport}
            calculerBudgetService={cbBudgetSvc}
            calculerBudgetDirection={cbBudgetDir}
            calculerBudgetPoleSupport={cbBudgetPS}
            personnelEligible={personnelEligibleSubvention}
          />
        )}

        {/* ─── ONGLET DAF ─── */}
        {activeTab === 'daf' && <>
          {/* Sous-navigation DAF */}
          <div className={`flex gap-1 mb-6 p-1 rounded-xl w-fit ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-100 border border-gray-200'}`}>
            {[
              { id: 'subvention',    label: 'Demande de subvention', icon: <Calculator size={15}/> },
              { id: 'ventilationBP', label: 'Ventilation BP 2026',   icon: <FileSpreadsheet size={15}/> },
            ].map(sub => (
              <button
                key={sub.id}
                onClick={() => setDafSubP(sub.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  dafSub === sub.id
                    ? darkMode ? 'bg-teal-600 text-white shadow' : 'bg-white text-teal-700 shadow'
                    : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {sub.icon} {sub.label}
              </button>
            ))}
          </div>

          {dafSub === 'subvention' && (
            <DAF
              darkMode={darkMode}
              services={services}
              direction={direction}
              poleSupport={poleSupport}
              globalParams={globalParams}
              calculerBudgetService={cbBudgetSvc}
              calculerBudgetDirection={cbBudgetDir}
              calculerBudgetPoleSupport={cbBudgetPS}
            />
          )}
          {dafSub === 'ventilationBP' && (
            <VentilationBP
              darkMode={darkMode}
              services={services}
              direction={direction}
              poleSupport={poleSupport}
              setServices={setServices}
              setDirection={setDirection}
              setPoleSupport={setPoleSupport}
            />
          )}
        </>}

        {/* ─── ONGLET PARAMÈTRES ─── */}
        {activeTab === 'parametres' && (
          <div className="space-y-6 max-w-3xl mx-auto">

            {/* Paramètres globaux */}
            <div className={`rounded-3xl border p-6 shadow-md ${darkMode ? 'bg-zinc-900/80 border-zinc-700/30' : 'bg-white border-slate-100/80'}`}>
              <h2 className={`text-lg font-black mb-5 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                <Cog size={20} className="text-teal-500" /> Paramètres globaux
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={`rounded-2xl p-4 border ${darkMode ? 'bg-teal-900/20 border-teal-800' : 'bg-teal-50 border-teal-200'}`}>
                  <label className={`text-xs font-bold uppercase tracking-widest block mb-2 ${darkMode ? 'text-teal-400' : 'text-teal-600'}`}>Augmentation salariale annuelle</label>
                  <div className="flex items-center gap-2">
                    <input type="number" step="0.1" value={globalParams.augmentationAnnuelle}
                      onChange={(e) => setGlobalParams({...globalParams, augmentationAnnuelle: validerTaux(e.target.value)})}
                      className={`rounded-xl px-3 py-2 font-black text-2xl outline-none w-24 border ${darkMode ? 'bg-gray-700 text-teal-300 border-teal-700' : 'bg-white text-teal-700 border-teal-200'}`}
                    />
                    <span className={`text-2xl font-black ${darkMode ? 'text-teal-400' : 'text-teal-600'}`}>%</span>
                  </div>
                  <p className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Appliqué aux charges d'exploitation pour les années N+1 et N+2</p>
                </div>
                <div className={`rounded-2xl p-4 border ${darkMode ? 'bg-indigo-900/20 border-indigo-800' : 'bg-indigo-50 border-indigo-200'}`}>
                  <label className={`text-xs font-bold uppercase tracking-widest block mb-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>GVT — Glissement Vieillesse Technicité</label>
                  <div className="flex items-center gap-2">
                    <input type="number" step="0.1" min="0" max="10" value={globalParams.tauxGVT ?? 1.5}
                      onChange={(e) => setGlobalParams({...globalParams, tauxGVT: validerTaux(e.target.value)})}
                      className={`rounded-xl px-3 py-2 font-black text-2xl outline-none w-24 border ${darkMode ? 'bg-gray-700 text-indigo-300 border-indigo-700' : 'bg-white text-indigo-700 border-indigo-200'}`}
                    />
                    <span className={`text-2xl font-black ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>%/an</span>
                  </div>
                  <p className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Hausse annuelle automatique des salaires (échelons, ancienneté) — s'ajoute à l'inflation</p>
                </div>
                <div className={`rounded-2xl p-4 border col-span-2 ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <label className={`text-xs font-bold uppercase tracking-widest block mb-3 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Inflation différenciée — Synthèse N+1 / N+2</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { key: 'inflationEnergie', label: 'Énergie', color: 'amber', default: 8.0 },
                      { key: 'inflationLoyers', label: 'Loyers', color: 'orange', default: 3.5 },
                      { key: 'inflationAutres', label: 'Autres charges', color: 'slate', default: 2.5 },
                    ].map(({ key, label, color, default: def }) => (
                      <div key={key}>
                        <label className={`text-xs font-semibold block mb-1 ${darkMode ? `text-${color}-400` : `text-${color}-600`}`}>{label}</label>
                        <div className="flex items-center gap-1">
                          <input type="number" step="0.1" min="0" max="50" value={globalParams[key] ?? def}
                            onChange={(e) => setGlobalParams({...globalParams, [key]: validerTaux(e.target.value)})}
                            className={`rounded-lg px-2 py-1 font-black text-lg outline-none w-16 border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-slate-200'}`}
                          />
                          <span className={`font-bold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Appliqués aux charges d'exploitation selon leur nature (label des lignes) pour les projections N+1 et N+2</p>
                </div>
                <div className={`rounded-2xl p-4 border ${darkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'}`}>
                  <label className={`text-xs font-bold uppercase tracking-widest block mb-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>Prime Ségur médico-social / ETP</label>
                  <div className="flex items-center gap-2">
                    <input type="number" step="1" min="0" value={globalParams.montantSegurETP ?? 238}
                      onChange={(e) => setGlobalParams({...globalParams, montantSegurETP: parseInt(e.target.value) || 0})}
                      className={`rounded-xl px-3 py-2 font-black text-2xl outline-none w-28 border ${darkMode ? 'bg-gray-700 text-blue-300 border-blue-700' : 'bg-white text-blue-700 border-blue-200'}`}
                    />
                    <span className={`text-lg font-black ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>€/mois</span>
                  </div>
                  <p className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Montant brut ajouté au salaire des agents éligibles</p>
                </div>
              </div>
              <div className={`mt-4 rounded-2xl p-4 border flex items-center justify-between ${darkMode ? 'bg-gray-700/40 border-gray-600' : 'bg-slate-50 border-slate-200'}`}>
                <div>
                  <p className={`font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>Mode sombre</p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Basculer entre thème clair et sombre</p>
                </div>
                <button onClick={() => setDarkMode(!darkMode)} className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors ${darkMode ? 'bg-yellow-500 text-gray-900' : 'bg-gray-800 text-white'}`}>
                  {darkMode ? <><Sun size={16} /> Clair</> : <><Moon size={16} /> Sombre</>}
                </button>
              </div>
            </div>

            {/* Sauvegarde & Export */}
            <div className={`rounded-3xl border p-6 shadow-md ${darkMode ? 'bg-zinc-900/80 border-zinc-700/30' : 'bg-white border-slate-100/80'}`}>
              <h2 className={`text-lg font-black mb-5 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                <Save size={20} className="text-teal-500" /> Sauvegarde & Export
              </h2>
              <div className="flex flex-wrap gap-3">
                <button onClick={sauvegarderBudget} className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2"><Save size={18} /> Sauver (JSON)</button>
                <button onClick={() => fileInputRef.current.click()} className={`px-4 py-3 rounded-xl font-bold flex items-center gap-2 border ${darkMode ? 'bg-slate-700 text-white border-slate-600' : 'bg-slate-600 text-white border-slate-700'}`}><Upload size={18} /> Charger (JSON)</button>
                <input type="file" ref={fileInputRef} onChange={chargerBudget} accept=".json" className="hidden" />
                {localStorage.getItem('assoc_backup_last') && (
                  <button
                    onClick={restaurerBackup}
                    title={`Restaurer backup auto (${new Date(localStorage.getItem('assoc_backup_last')).toLocaleString('fr-FR')})`}
                    className={`px-4 py-3 rounded-xl font-bold flex items-center gap-2 border-2 transition-colors ${darkMode ? 'border-amber-600 text-amber-400 hover:bg-amber-900/30' : 'border-amber-400 text-amber-700 hover:bg-amber-50'}`}
                  >
                    <RotateCcw size={18} /> Restaurer backup
                  </button>
                )}
                <button onClick={() => exportToExcel(direction, services, globalParams, poleSupport)} className="bg-green-600 text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2"><FileSpreadsheet size={18} /> Export Excel</button>
                <button onClick={() => exportToPDF(direction, services, globalParams, poleSupport)} className="bg-red-600 text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2"><Download size={18} /> Export PDF</button>
                <button
                  onClick={() => {
                    const csv = genererCSVComptable(direction, services, poleSupport, 2026, getBudgetService, getBudgetDirection, getBudgetPoleSupport);
                    telechargerCSVComptable(csv, 2026);
                  }}
                  className={`px-4 py-3 rounded-xl font-bold flex items-center gap-2 border-2 transition-colors ${darkMode ? 'border-indigo-600 text-indigo-300 hover:bg-indigo-900/30' : 'border-indigo-400 text-indigo-700 hover:bg-indigo-50'}`}
                  title="Génère un CSV au format journal comptable (Sage, Cegid, EBP…)"
                >
                  <Calculator size={18} /> Export Sage/Cegid
                </button>
                <button onClick={() => window.print()} className={`px-4 py-3 rounded-xl font-bold flex items-center gap-2 border ${darkMode ? 'bg-slate-700 text-white border-slate-600' : 'bg-slate-500 text-white border-slate-600'}`}><Printer size={18} /> Imprimer</button>
              </div>
              <p className={`mt-3 text-xs ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Le CSV Sage/Cegid génère un journal OD (CodeJournal, Date, CompteGénéral PCG, Libellé, Débit, Crédit) prêt à importer.</p>
            </div>

            {/* Import de données */}
            <div className={`rounded-3xl border p-6 shadow-md ${darkMode ? 'bg-zinc-900/80 border-zinc-700/30' : 'bg-white border-slate-100/80'}`}>
              <h2 className={`text-lg font-black mb-5 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                <Upload size={20} className="text-violet-500" /> Import de données
              </h2>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => setShowImportN1(true)} className={`px-4 py-3 rounded-xl font-bold flex items-center gap-2 border-2 transition-colors ${donneesN1 ? (darkMode ? 'border-violet-500 text-violet-300 bg-violet-900/30' : 'border-violet-400 text-violet-700 bg-violet-50') : (darkMode ? 'border-gray-600 text-gray-400 hover:bg-gray-700' : 'border-slate-300 text-slate-600 hover:bg-slate-50')}`}>
                  <Upload size={18} /> {donneesN1 ? `Données N-1 chargées (${donneesN1.annee}) ✓` : 'Importer données N-1'}
                </button>
                <button onClick={() => setShowWizardBP(true)} className="bg-amber-500 text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2"><Upload size={18} /> Wizard Import BP</button>
              </div>
              {donneesN1 && (
                <p className={`mt-3 text-xs ${darkMode ? 'text-violet-400' : 'text-violet-600'}`}>
                  Données N-1 actives : exercice {donneesN1.annee} — colonnes N-1 visibles dans la Synthèse Analytique
                </p>
              )}
            </div>

            {/* Budget Voté — Snapshot */}
            <div className={`rounded-3xl border p-6 shadow-md ${darkMode ? 'bg-zinc-900/80 border-zinc-700/30' : 'bg-white border-slate-100/80'}`}>
              <h2 className={`text-lg font-black mb-2 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                <Camera size={20} className="text-violet-500" /> Budget Voté (Snapshot)
              </h2>
              <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                Figez l'état actuel comme référence. Activez la comparaison pour voir les écarts dans la Synthèse.
              </p>
              <SnapshotManager
                currentData={{ direction, services, poleSupport, globalParams }}
                onToggleCompare={() => setCompareSnapshot(v => !v)}
                compareMode={compareSnapshot}
                darkMode={darkMode}
              />
            </div>

            {/* Clés de répartition — Frais de siège */}
            <div className={`rounded-3xl border p-6 shadow-md ${darkMode ? 'bg-zinc-900/80 border-zinc-700/30' : 'bg-white border-slate-100/80'}`}>
              <h2 className={`text-lg font-black mb-2 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                <Layers size={20} className="text-teal-500" /> Clés de répartition — Frais de Siège
              </h2>
              <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                Répartit automatiquement le budget Direction/Siège sur les services au prorata des ETP.
              </p>
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => setRepartirSiege(v => !v)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${repartirSiege ? 'bg-teal-600 text-white' : (darkMode ? 'bg-zinc-800 border border-zinc-700 text-zinc-300' : 'bg-slate-100 text-slate-600 border border-slate-200')}`}
                >
                  {repartirSiege ? '✓ Actif — Quote-parts visibles' : 'Activer la répartition'}
                </button>
              </div>
              {repartirSiege && (() => {
                const repartition = repartirFraisSiege(getBudgetDirection(), services);
                const totalSiege = getBudgetDirection().total;
                return (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className={`text-xs font-bold uppercase tracking-wide ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
                          <th className="text-left py-2">Service</th>
                          <th className="text-right py-2">ETP</th>
                          <th className="text-right py-2">% ETP</th>
                          <th className="text-right py-2">Quote-part Siège</th>
                        </tr>
                      </thead>
                      <tbody>
                        {repartition.map(r => (
                          <tr key={r.serviceId} className={`border-t ${darkMode ? 'border-zinc-800' : 'border-slate-100'}`}>
                            <td className={`py-2 font-medium ${darkMode ? 'text-white' : 'text-slate-800'}`}>{r.nom}</td>
                            <td className={`py-2 text-right font-mono-numbers ${darkMode ? 'text-zinc-300' : 'text-slate-600'}`}>{r.etp.toFixed(2)}</td>
                            <td className={`py-2 text-right font-mono-numbers ${darkMode ? 'text-zinc-300' : 'text-slate-600'}`}>{r.pctETP.toFixed(1)} %</td>
                            <td className={`py-2 text-right font-black font-mono-numbers ${darkMode ? 'text-teal-400' : 'text-teal-600'}`}>{Math.round(r.quotePart).toLocaleString()} €</td>
                          </tr>
                        ))}
                        <tr className={`border-t-2 ${darkMode ? 'border-zinc-700' : 'border-slate-200'}`}>
                          <td className={`py-2 font-black ${darkMode ? 'text-white' : 'text-slate-800'}`} colSpan={3}>Total Budget Siège</td>
                          <td className={`py-2 text-right font-black font-mono-numbers ${darkMode ? 'text-white' : 'text-slate-900'}`}>{Math.round(totalSiege).toLocaleString()} €</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>

            {/* Présentation */}
            <div className={`rounded-3xl border p-6 shadow-md ${darkMode ? 'bg-zinc-900/80 border-zinc-700/30' : 'bg-white border-slate-100/80'}`}>
              <h2 className={`text-lg font-black mb-5 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                <Monitor size={20} className="text-indigo-500" /> Présentation CA/AG
              </h2>
              <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Mode diaporama 6 slides — navigation clavier ← →</p>
              <button onClick={() => { setPresentationMode(true); setSlideIndex(0); }} className="bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2"><Monitor size={18} /> Lancer la présentation</button>
            </div>

            {/* Administration */}
            <div className={`rounded-3xl border p-6 shadow-md ${darkMode ? 'bg-zinc-900/80 border-zinc-700/30' : 'bg-white border-slate-100/80'}`}>
              <h2 className={`text-lg font-black mb-5 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                <Shield size={20} className="text-slate-500" /> Administration
              </h2>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => setShowRolesModal(true)} className={`px-4 py-3 rounded-xl font-bold flex items-center gap-2 border-2 transition-colors ${darkMode ? 'border-slate-600 text-slate-400 hover:bg-slate-700' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}><Users size={18} /> Gérer les rôles</button>
                {isLocalhost && (
                  <button onClick={() => setShowPasswordModal(true)} className="bg-purple-600 text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2"><Key size={18} /> Changer le mot de passe</button>
                )}
                <button
                  onClick={() => { setShowResetModal(true); setResetError(''); setResetPassword(''); }}
                  className={`px-4 py-3 rounded-xl font-bold flex items-center gap-2 border-2 transition-colors ${darkMode ? 'border-red-700 text-red-400 hover:bg-red-900/30' : 'border-red-300 text-red-600 hover:bg-red-50'}`}
                >
                  <RotateCcw size={18} /> Réinitialiser toutes les données
                </button>
                <button
                  onClick={() => setShowHardReset(true)}
                  className={`px-4 py-3 rounded-xl font-bold flex items-center gap-2 border-2 transition-colors ${darkMode ? 'border-red-900 text-red-500 hover:bg-red-950/40' : 'border-red-400 text-red-700 hover:bg-red-50'}`}
                >
                  <Trash2 size={18} /> Réinitialisation complète
                </button>
                <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2"><LogOut size={18} /> Déconnexion</button>
              </div>
            </div>

            {/* Wizard setup */}
            <div className={`rounded-3xl border p-6 shadow-md ${darkMode ? 'bg-zinc-900/80 border-zinc-700/30' : 'bg-white border-slate-100/80'}`}>
              <h2 className={`text-lg font-black mb-3 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                <Cog size={20} className="text-teal-500" /> Configuration de l'organisation
              </h2>
              <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                Relancer le wizard pour reconfigurer les services, le personnel, les contrats et les paramètres RH depuis le début.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowWizardSetup(true)} className="bg-teal-500 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2">
                  <Users size={18} /> Reconfigurer l'organisation
                </button>
                {poolRH.length > 0 && (
                  <div className={`px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-bold ${darkMode ? 'bg-purple-900/40 text-purple-300' : 'bg-purple-50 text-purple-700'}`}>
                    <Users size={16} /> {poolRH.length} agent{poolRH.length > 1 ? 's' : ''} en Pool RH
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* ── Reporting Réglementaire ─────────────────────────────────────────── */}
        {activeTab === 'reporting' && (() => {
          const msETP = globalParams.montantSegurETP ?? 238;
          const tousPersonnels = [
            ...(direction.personnel || []).map(p => ({ ...p, _source: 'Siège' })),
            ...(poleSupport?.personnel || []).map(p => ({ ...p, _source: 'Pôle Support' })),
            ...services.flatMap(s => (s.personnel || []).map(p => ({ ...p, _source: s.nom }))),
            ...(poolRH || []).map(p => ({ ...p, _source: 'Pool RH' })),
          ];

          // Pivot Rôle × agents
          const pivotRoles = {};
          tousPersonnels.forEach(p => {
            const role = p.role || 'autre';
            if (!pivotRoles[role]) pivotRoles[role] = { agents: [], etpTotal: 0, msTotal: 0 };
            const etp = parseFloat(p.etp) || 0;
            const sal = calculerSalaireAnnuel(parseFloat(p.salaire) || 0, etp, p.segur ? msETP : 0, p.typeContrat, p.tauxChargesManuel);
            pivotRoles[role].agents.push(p);
            pivotRoles[role].etpTotal += etp;
            pivotRoles[role].msTotal += sal.total;
          });

          const roles = (globalParams.rolesPersonnel || []);
          const getRoleLabel = (id) => roles.find(r => r.id === id)?.label || id;

          const auditAlertes = runFinancialAudit(direction, services, poleSupport, globalParams);
          const erreurs = auditAlertes.filter(a => a.type === 'ER');
          const avertissements = auditAlertes.filter(a => a.type === 'WA');

          return (
            <div className="space-y-6 max-w-5xl mx-auto">
              {/* Pivot Table */}
              <div className={`rounded-3xl border p-6 shadow-md ${darkMode ? 'bg-zinc-900/80 border-zinc-700/30' : 'bg-white border-slate-100/80'}`}>
                <h2 className={`text-lg font-black mb-5 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                  <Shield size={20} className="text-violet-500" /> Pivot réglementaire — Rôle × Masse Salariale
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={`text-xs font-bold uppercase tracking-wide border-b ${darkMode ? 'text-zinc-400 border-zinc-700' : 'text-slate-500 border-slate-200'}`}>
                        <th className="text-left py-2 pr-4">Rôle</th>
                        <th className="text-right py-2 pr-4">Nb agents</th>
                        <th className="text-right py-2 pr-4">ETP total</th>
                        <th className="text-right py-2">Masse salariale chargée</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(pivotRoles).sort((a,b) => b[1].msTotal - a[1].msTotal).map(([roleId, data]) => (
                        <tr key={roleId} className={`border-b text-sm ${darkMode ? 'border-zinc-800 hover:bg-zinc-800/40' : 'border-slate-100 hover:bg-slate-50'}`}>
                          <td className={`py-2 pr-4 font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{getRoleLabel(roleId)}</td>
                          <td className={`py-2 pr-4 text-right ${darkMode ? 'text-zinc-300' : 'text-slate-600'}`}>{data.agents.length}</td>
                          <td className={`py-2 pr-4 text-right ${darkMode ? 'text-zinc-300' : 'text-slate-600'}`}>{data.etpTotal.toFixed(2)}</td>
                          <td className={`py-2 text-right font-bold ${privacyMode ? 'blur-sm select-none' : ''} ${darkMode ? 'text-teal-300' : 'text-teal-700'}`}>
                            {data.msTotal.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                          </td>
                        </tr>
                      ))}
                      <tr className={`text-sm font-black ${darkMode ? 'text-white border-t border-zinc-600' : 'text-slate-900 border-t border-slate-300'}`}>
                        <td className="py-2 pr-4">TOTAL</td>
                        <td className="py-2 pr-4 text-right">{tousPersonnels.length}</td>
                        <td className="py-2 pr-4 text-right">{Object.values(pivotRoles).reduce((s, d) => s + d.etpTotal, 0).toFixed(2)}</td>
                        <td className={`py-2 text-right ${privacyMode ? 'blur-sm select-none' : ''} text-teal-600`}>
                          {Object.values(pivotRoles).reduce((s, d) => s + d.msTotal, 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Vérificateur de cohérence */}
              <div className={`rounded-3xl border p-6 shadow-md ${darkMode ? 'bg-zinc-900/80 border-zinc-700/30' : 'bg-white border-slate-100/80'}`}>
                <h2 className={`text-lg font-black mb-5 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                  <AlertTriangle size={20} className="text-amber-500" /> Vérificateur de cohérence financière
                  <span className={`ml-auto text-sm font-bold px-3 py-1 rounded-full ${auditAlertes.length === 0 ? 'bg-green-100 text-green-700' : erreurs.length > 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                    {auditAlertes.length === 0 ? '✓ RAS' : `${erreurs.length} erreur${erreurs.length > 1 ? 's' : ''} · ${avertissements.length} avertissement${avertissements.length > 1 ? 's' : ''}`}
                  </span>
                </h2>
                {auditAlertes.length === 0 ? (
                  <div className={`rounded-2xl p-4 flex items-center gap-3 ${darkMode ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'}`}>
                    <CheckCircle size={20} className="text-green-500" />
                    <span className={`font-semibold ${darkMode ? 'text-green-300' : 'text-green-700'}`}>Aucune anomalie détectée — budget cohérent</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {erreurs.map((a, i) => (
                      <div key={i} className={`rounded-2xl p-4 flex items-start gap-3 ${darkMode ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
                        <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className={`text-xs font-black uppercase tracking-wide ${darkMode ? 'text-red-400' : 'text-red-600'}`}>[ERREUR] {a.code}</span>
                          <p className={`text-sm font-semibold mt-0.5 ${darkMode ? 'text-red-200' : 'text-red-800'}`}>{a.message}</p>
                          <p className={`text-xs mt-1 ${darkMode ? 'text-red-400' : 'text-red-500'}`}>{a.entity}</p>
                        </div>
                      </div>
                    ))}
                    {avertissements.map((a, i) => (
                      <div key={i} className={`rounded-2xl p-4 flex items-start gap-3 ${darkMode ? 'bg-amber-900/20 border border-amber-800' : 'bg-amber-50 border border-amber-200'}`}>
                        <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className={`text-xs font-black uppercase tracking-wide ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>[AVERT.] {a.code}</span>
                          <p className={`text-sm font-semibold mt-0.5 ${darkMode ? 'text-amber-200' : 'text-amber-800'}`}>{a.message}</p>
                          <p className={`text-xs mt-1 ${darkMode ? 'text-amber-400' : 'text-amber-500'}`}>{a.entity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Bouton ajouter service */}
        {activeTab === 'budget' && <button onClick={() => {
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
        </button>}
        </div>
      </div>
    </div>
    {/* ═══ MODAL FI% ═══ */}
    <ModalFI fiDialog={fiDialog} setFiDialog={setFiDialog} services={services} setServices={setServices} msETP={msETP} darkMode={darkMode} />
    {/* ═══ MODAL SAISONNALITÉ RECETTES ═══ */}
    <ModalSaisonnalite dialog={saisonnaliteDialog} setDialog={setSaisonnaliteDialog} services={services} setServices={setServices} poleSupport={poleSupport} setPoleSupport={setPoleSupport} direction={direction} setDirection={setDirection} darkMode={darkMode} />

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
    </div>
    </>
  );
};

export default BudgetTool;
