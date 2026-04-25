import React, { useState } from 'react';
import {
  Settings,
  Banknote, TrendingDown, CheckCircle, AlertTriangle, AlertCircle,
  Target, Users, GraduationCap, Bell, ChevronDown, ChevronUp,
  Home, Building2, BarChart3, Clock, UserCheck, Landmark, Calculator,
} from 'lucide-react';
import { TooltipContext } from '../../utils/TooltipContext';
import { useBudget } from '../../contexts/BudgetContext';
import ConfirmModal from './ConfirmModal';
import SaveIndicator from './SaveIndicator';
import HelpIcon from './HelpIcon';
import SidebarNav from '../SidebarNav';
import ImportN1Modal from '../ImportN1Modal';
import WizardSetup from '../WizardSetup';
import WizardImportBP from '../WizardImportBP';
import StartupGate from '../StartupGate';
import ModalHardReset from '../ModalHardReset';
import AICopilot from '../AICopilot';
import StressTestBar from '../StressTestBar';
import ModalRoles from '../modals/ModalRoles';
import ModalReset from '../modals/ModalReset';
import ModalPassword from '../modals/ModalPassword';
import EcoFinPanel from '../EcoFinPanel';
import TopBar from './TopBar';

const TAB_LIST = [
  { id: 'dashboard',  label: 'Tableau de bord', icon: <Home size={15}/> },
  { id: 'budget',     label: 'Budget',           icon: <Building2 size={15}/> },
  { id: 'analyse',    label: 'Analyse',          icon: <BarChart3 size={15}/> },
  { id: 'rh',         label: 'RH',               icon: <Users size={15}/> },
  { id: 'temps',      label: 'Temps',            icon: <Clock size={15}/> },
  { id: 'formation',  label: 'Formation',        icon: <GraduationCap size={15}/> },
  { id: 'vacataires', label: 'Vacataires',       icon: <Users size={15}/> },
  { id: 'subvention', label: 'Subvention',       icon: <Landmark size={15}/> },
  { id: 'daf',        label: 'DAF',              icon: <Calculator size={15}/> },
  { id: 'parametres', label: 'Paramètres',       icon: <Settings size={15}/> },
];

const KPI_COLORS = {
  green:   { bg: 'bg-green-500',   border: 'border-green-500/20',   text: 'text-green-600',   darkText: 'text-green-400',   iconBg: 'bg-green-100',   darkIconBg: 'bg-green-900/30' },
  red:     { bg: 'bg-red-500',     border: 'border-red-500/20',     text: 'text-red-600',     darkText: 'text-red-400',     iconBg: 'bg-red-100',     darkIconBg: 'bg-red-900/30' },
  emerald: { bg: 'bg-emerald-500', border: 'border-emerald-500/20', text: 'text-emerald-600', darkText: 'text-emerald-400', iconBg: 'bg-emerald-100', darkIconBg: 'bg-emerald-900/30' },
  orange:  { bg: 'bg-orange-500',  border: 'border-orange-500/20',  text: 'text-orange-600',  darkText: 'text-orange-400',  iconBg: 'bg-orange-100',  darkIconBg: 'bg-orange-900/30' },
  teal:    { bg: 'bg-teal-500',    border: 'border-teal-500/20',    text: 'text-teal-600',    darkText: 'text-teal-400',    iconBg: 'bg-teal-100',    darkIconBg: 'bg-teal-900/30' },
  amber:   { bg: 'bg-amber-500',   border: 'border-amber-500/20',   text: 'text-amber-600',   darkText: 'text-amber-400',   iconBg: 'bg-amber-100',   darkIconBg: 'bg-amber-900/30' },
  blue:    { bg: 'bg-blue-500',    border: 'border-blue-500/20',    text: 'text-blue-600',    darkText: 'text-blue-400',    iconBg: 'bg-blue-100',    darkIconBg: 'bg-blue-900/30' },
  purple:  { bg: 'bg-purple-500',  border: 'border-purple-500/20',  text: 'text-purple-600',  darkText: 'text-purple-400',  iconBg: 'bg-purple-100',  darkIconBg: 'bg-purple-900/30' },
};

export default function Layout({
  // Contexte
  showTooltips,
  // Mode / UI
  darkMode, setDarkMode,
  sidebarOpen, setSidebarOpen,
  activeTab, setActiveTab,
  privacyMode, setPrivacyMode,
  showAICopilot, setShowAICopilot,
  // Modales startup
  showStartupGate, setShowStartupGate,
  showHardReset, setShowHardReset,
  // Modales globales
  showImportN1, setShowImportN1, setDonneesN1,
  showWizardSetup, handleWizardComplete, setShowWizardSetup,
  showWizardBP, setShowWizardBP,
  services, setServices,
  poleSupport, setPoleSupport,
  direction, setDirection,
  globalParams, setGlobalParams,
  // Modales RH
  showRolesModal, setShowRolesModal, roles, setRoles,
  showResetModal, setShowResetModal, handleGlobalReset,
  showPasswordModal, setShowPasswordModal,
  // KPIs header
  soldeGlobal, totalETP, tauxCouverture,
  stressTest, stressImpact, coefficientBP,
  // KPIs grille
  totalRecettes, totalCharges, totalEtudiants, coutParEtudiant,
  // Alertes
  alertes,
  // Stress test
  setStressTest,
  // AICopilot data
  getBudgetDirection, getBudgetPoleSupport, getBudgetService,
  masseSalarialeTotal, tresorerie,
  // Actions header
  sauvegarderBudget,
  // Contenu
  children,
}) {
  const dm = darkMode;
  const { appendAuditEntry, auditChainStatus } = useBudget();
  const [alertesCollapsed, setAlertesCollapsed] = useState(false);
  const [showEcoFin, setShowEcoFin] = useState(false);

  const kpiItems = [
    { label: 'Recettes',     val: `${Math.round(totalRecettes/1000)}k`,                          unit: '€', sub: 'annuelles',          color: 'green',                          icon: <Banknote size={18}/>,                                                    help: "Total des recettes annuelles : subventions Région, droits d'inscription, produits des formations continues, contributions diverses." },
    { label: 'Charges',      val: `${Math.round(totalCharges/1000)}k`,                           unit: '€', sub: 'annuelles',          color: 'red',                            icon: <TrendingDown size={18}/>,                                                help: 'Total des charges annuelles : masse salariale (salaires bruts + charges patronales 42%) + frais d\'exploitation + amortissements.' },
    { label: 'Solde',        val: `${soldeGlobal >= 0 ? '+' : ''}${Math.round(soldeGlobal/1000)}k`, unit: '€', sub: 'résultat',       color: soldeGlobal >= 0 ? 'emerald' : 'orange', icon: soldeGlobal >= 0 ? <CheckCircle size={18}/> : <AlertTriangle size={18}/>, help: 'Solde = Recettes − Charges. Un solde positif indique un excédent ; négatif un déficit à combler (par réserves ou réduction de charges).' },
    { label: 'Couverture',   val: `${tauxCouverture.toFixed(1)}`,                                unit: '%', sub: 'recettes/charges',   color: tauxCouverture >= 100 ? 'teal' : 'amber', icon: <Target size={18}/>,                                             help: "Taux de couverture = Recettes / Charges × 100. Un taux ≥ 100 % signifie l'équilibre financier. En dessous de 90 % : alerte. Objectif AFERTES : ≥ 100 %." },
    { label: 'ETP total',    val: totalETP.toFixed(1),                                           unit: '',  sub: 'équivalents temps plein', color: 'blue',                       icon: <Users size={18}/>,                                                       help: 'ETP = Équivalent Temps Plein. 1 ETP = 1 poste à temps complet (35h/sem). Un agent à 0,5 ETP travaille à mi-temps. Somme de tous les ETP contractuels (hors absences).' },
    { label: 'Coût/étudiant', val: totalEtudiants > 0 ? `${coutParEtudiant.toLocaleString()}` : '—', unit: '€', sub: `${totalEtudiants} étudiants`, color: 'purple',          icon: <GraduationCap size={18}/>,                                               help: "Coût par étudiant = Charges totales / Nombre d'étudiants (effectifs actuels de toutes les promos actives). Indicateur de rentabilité pédagogique." },
  ];

  return (
    <TooltipContext.Provider value={showTooltips}>
    <>
      {showStartupGate && (
        <StartupGate darkMode={dm} onStart={() => setShowStartupGate(false)} />
      )}
      {showHardReset && (
        <ModalHardReset darkMode={dm} onClose={() => setShowHardReset(false)} />
      )}

      {/* ═══ HEADER MODERNE — Soft SaaS 64px ═══ */}
      <TopBar
        darkMode={dm}
        setDarkMode={setDarkMode}
        sidebarOpen={sidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        soldeGlobal={soldeGlobal}
        totalETP={totalETP}
        tauxCouverture={tauxCouverture}
        stressTest={stressTest}
        stressImpact={stressImpact}
        coefficientBP={coefficientBP}
        globalParams={globalParams}
        privacyMode={privacyMode}
        setPrivacyMode={setPrivacyMode}
        showAICopilot={showAICopilot}
        setShowAICopilot={setShowAICopilot}
        showEcoFin={showEcoFin}
        setShowEcoFin={setShowEcoFin}
        sauvegarderBudget={sauvegarderBudget}
      />

      <EcoFinPanel darkMode={dm} open={showEcoFin} onClose={() => setShowEcoFin(false)} />

      {showAICopilot && (
        <AICopilot
          darkMode={dm}
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

      <div className={`min-h-screen transition-colors duration-300 ${dm ? 'bg-zinc-950' : 'bg-gradient-to-br from-slate-50 via-slate-50 to-indigo-50/30'}`}>
        <SaveIndicator darkMode={dm} />
        <ConfirmModal darkMode={dm} />
        <ImportN1Modal
          isOpen={showImportN1}
          onClose={() => setShowImportN1(false)}
          onConfirm={(data) => setDonneesN1(data)}
          darkMode={dm}
        />
        {showWizardSetup && (
          <WizardSetup
            onComplete={handleWizardComplete}
            onClose={() => setShowWizardSetup(false)}
            darkMode={dm}
          />
        )}
        {showWizardBP && (
          <WizardImportBP
            onClose={(imported) => { setShowWizardBP(false); if (imported) setActiveTab('dashboard'); }}
            services={services}
            setServices={setServices}
            poleSupport={poleSupport}
            setPoleSupport={setPoleSupport}
            direction={direction}
            setDirection={setDirection}
            darkMode={dm}
            globalParams={globalParams}
            setGlobalParams={setGlobalParams}
            onImportComplete={(details) => appendAuditEntry('Import BP Excel', 'Budget', details)}
          />
        )}

        <SidebarNav
          services={services}
          darkMode={dm}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          getBudgetService={getBudgetService}
          onShowWizardSetup={() => setShowWizardSetup(true)}
          onShowWizardBP={() => setShowWizardBP(true)}
          onShowEcoFin={() => setShowEcoFin(true)}
          onShowAICopilot={() => setShowAICopilot(true)}
        />

        <div className="main-content p-4 md:p-6 transition-all duration-300"
             style={{ marginLeft: sidebarOpen ? '256px' : '56px', marginRight: showAICopilot ? '320px' : '0', paddingTop: 'calc(64px + 1.5rem)' }}>
          <div className="max-w-[1600px] mx-auto">

            {/* KPI globaux — masqués sur le dashboard (DashboardDG a ses propres KPIs) */}
            {activeTab !== 'dashboard' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                {kpiItems.map((k, i) => {
                  const c = KPI_COLORS[k.color];
                  return (
                    <div key={i} className={`relative group rounded-3xl p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:z-50 border
                      ${dm ? 'bg-zinc-900/80 border-zinc-700/30 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.12)]' : 'bg-white border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm'}`}>
                      <div className={`absolute -top-10 -right-10 w-24 h-24 ${c.bg}/10 blur-3xl group-hover:${c.bg}/20 transition-all duration-500`} />
                      <div className="flex flex-col h-full justify-between relative z-10">
                        <div className="flex items-center justify-between mb-3">
                          <div className={`p-2 rounded-2xl ${dm ? c.darkIconBg : c.iconBg}`}>
                            <span className={dm ? c.darkText : c.text}>{k.icon}</span>
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${dm ? 'text-gray-500' : 'text-slate-400'}`}>{k.sub}</span>
                        </div>
                        <div>
                          <h3 className={`text-xs font-bold mb-1 flex items-center gap-1 ${dm ? 'text-gray-400' : 'text-slate-500'}`}>
                            {k.label}
                            {k.help && <HelpIcon darkMode={dm} content={k.help} position="top" wide />}
                          </h3>
                          <div className="flex items-baseline gap-1">
                            <span className={`text-2xl font-black font-mono-numbers tracking-tight ${dm ? 'text-white' : 'text-slate-900'}`}>{k.val}</span>
                            <span className={`text-sm font-bold ${dm ? 'text-gray-500' : 'text-slate-400'}`}>{k.unit}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Alertes automatiques — tableau de bord uniquement */}
            {activeTab === 'dashboard' && alertes.length > 0 && (
              <div className={`mb-6 rounded-2xl border overflow-hidden ${dm ? 'border-zinc-700/50' : 'border-slate-200'}`}>
                <button
                  onClick={() => setAlertesCollapsed(v => !v)}
                  className={`w-full px-4 py-2 flex items-center gap-2 text-left transition-colors ${dm ? 'bg-zinc-800/60 hover:bg-zinc-800' : 'bg-slate-50 hover:bg-slate-100'}`}
                >
                  <Bell size={16} className={alertes.some(a => a.lvl === 'error') ? 'text-red-500' : 'text-amber-500'} />
                  <span className={`text-sm font-black flex-1 ${dm ? 'text-white' : 'text-slate-700'}`}>
                    {alertes.length} point{alertes.length > 1 ? 's' : ''} de vigilance
                  </span>
                  {alertesCollapsed
                    ? <ChevronDown size={15} className={dm ? 'text-zinc-400' : 'text-slate-400'} />
                    : <ChevronUp   size={15} className={dm ? 'text-zinc-400' : 'text-slate-400'} />
                  }
                </button>
                {!alertesCollapsed && (
                  <div className={`divide-y ${dm ? 'divide-zinc-700/50' : 'divide-slate-100'}`}>
                    {alertes.map((a, i) => (
                      <div key={i} className={`px-4 py-2.5 flex items-start gap-3 text-sm ${
                        a.lvl === 'error'   ? (dm ? 'bg-red-900/20 text-red-300'    : 'bg-red-50 text-red-700')
                      : a.lvl === 'warning' ? (dm ? 'bg-amber-900/20 text-amber-300' : 'bg-amber-50 text-amber-700')
                      :                       (dm ? 'bg-blue-900/20 text-blue-300'   : 'bg-blue-50 text-blue-700')
                      }`}>
                        {a.lvl === 'error' ? <AlertTriangle size={15} className="flex-shrink-0 mt-0.5"/> : <AlertCircle size={15} className="flex-shrink-0 mt-0.5"/>}
                        {a.msg}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <StressTestBar stressTest={stressTest} setStressTest={setStressTest} impact={stressImpact} darkMode={dm} />

            <ModalRoles darkMode={dm} showRolesModal={showRolesModal} setShowRolesModal={setShowRolesModal} roles={roles} setRoles={setRoles} />
            <ModalReset darkMode={dm} showResetModal={showResetModal} setShowResetModal={setShowResetModal} onConfirm={handleGlobalReset} />
            <ModalPassword darkMode={dm} showPasswordModal={showPasswordModal} setShowPasswordModal={setShowPasswordModal} />

            {/* Barre d'onglets — masquée si sidebar ouverte */}
            <div className={`mb-8 p-1.5 rounded-2xl no-print backdrop-blur-md border transition-all duration-500 ${sidebarOpen ? 'hidden lg:hidden' : ''} ${dm ? 'bg-zinc-900/80 border-zinc-700/40' : 'bg-slate-100/90 border-slate-200/60'}`}>
              <div className="flex gap-1 overflow-x-auto scrollbar-none">
                {TAB_LIST.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 whitespace-nowrap ${
                      activeTab === tab.id
                        ? dm ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30' : 'bg-white text-indigo-700 shadow-md shadow-indigo-100'
                        : dm ? 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60' : 'text-slate-500 hover:text-slate-700 hover:bg-white/70'
                    }`}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Bannière intégrité audit trail */}
            {auditChainStatus?.checked && !auditChainStatus.valid && (
              <div className={`mb-4 rounded-2xl border-2 p-4 flex items-start gap-3 ${dm ? 'bg-rose-950/40 border-rose-700' : 'bg-rose-50 border-rose-300'}`}>
                <AlertTriangle size={20} className={dm ? 'text-rose-400 mt-0.5' : 'text-rose-600 mt-0.5'} />
                <div className="flex-1">
                  <p className={`text-sm font-black ${dm ? 'text-rose-200' : 'text-rose-800'}`}>
                    Intégrité du journal d'audit compromise
                  </p>
                  <p className={`text-xs mt-1 ${dm ? 'text-rose-300' : 'text-rose-700'}`}>
                    La chaîne SHA-256 du journal présente une rupture (entrée #{auditChainStatus.brokenAt}). Une modification a posteriori a été détectée. Consulter le DAF avant toute validation budgétaire.
                  </p>
                </div>
              </div>
            )}

            {/* Contenu des onglets */}
            <div key={activeTab} className="animate-in fade-in duration-500">
              {children}
            </div>

          </div>
        </div>
      </div>
    </>
    </TooltipContext.Provider>
  );
}
