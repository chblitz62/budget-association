import React, { useState, useRef, useEffect } from 'react';
import { Plus, FileSpreadsheet, Calculator } from 'lucide-react';
import PilotageFinancier, { zeroSites as pilotageZeroSites, calcSalarie as calcSalarieFormateur } from './components/PilotageFinancier';
import PresentationMode from './components/PresentationMode';
import SubventionRegion from './components/SubventionRegion';
import DAF from './components/DAF';
import VentilationBP from './components/VentilationBP';
import LoginScreen from './components/LoginScreen';
import Layout from './components/ui/Layout';
import TabAnalyse from './components/tabs/TabAnalyse';
import TabRH from './components/tabs/TabRH';
import TabFormation from './components/tabs/TabFormation';
import TabDashboard from './components/tabs/TabDashboard';
import TabBudget from './components/tabs/TabBudget';
import TabParametres from './components/tabs/TabParametres';
import TabReporting from './components/tabs/TabReporting';
import TabDevis from './components/tabs/TabDevis';
import TabRepartitionTemps from './components/TabRepartitionTemps';
import CalculateurVacataires from './components/CalculateurVacataires';
import ModalFI from './components/modals/ModalFI';
import ModalSaisonnalite from './components/modals/ModalSaisonnalite';
import BalanceImportModal from './components/BalanceImportModal';
import { useUIPrefs } from './hooks/useUIPrefs';
import { useAuth, checkPassword } from './hooks/useAuth';
import { useDafMode } from './hooks/useDafMode';
import { useBudget } from './contexts/BudgetContext';
import { defaultPoleSupport, calculerStatsFormation } from './utils/constants';
import {
  calculerBudgetDirection,
  calculerBudgetService,
  calculerBudgetPoleSupport,
  calculerSalaireAnnuel,
} from './utils/calculations';
import { hasStoredData, importData } from './utils/storage';
import { genererCSVComptable, telechargerCSVComptable } from './utils/csvExport';

// ─── États "zéro" pour la remise à zéro globale ───────────────────
const zeroDirection = { personnel: [], chargesSiege: [] };
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

  // ── Données métier + calculs dérivés (BudgetContext) ──────────────
  const {
    globalParams, setGlobalParams,
    direction, setDirection,
    services, setServices,
    poleSupport, setPoleSupport,
    pilotageSites, setPilotageSites,
    poolRH, setPoolRH,
    planningAbsences, setPlanningAbsences,
    enveloppeFormation, setEnveloppeFormation,
    reportingFC, setReportingFC,
    donneesN1, setDonneesN1,
    balanceComptable, setBalanceComptable,
    benevoles, setBenevoles,
    fondsDedies, setFondsDedies,
    referentielStructure, setReferentielStructure,
    repartitionTemps, setRepartitionTemps,
    engagements, setEngagements,
    msETP, coefficientBP,
    stressTest, setStressTest,
    getBudgetDirection, getBudgetPoleSupport, getBudgetService,
    getProvisions, getBFR, getFondRoulement,
    cbBudgetSvc, cbBudgetDir, cbBudgetPS,
    summary3Ans, budgetAnnuel, tresorerie, projection36, rollingForecastData,
    masseSalarialeTotal, personnelEligibleSubvention, statsFormation,
    kpiGlobaux, alertes,
    auditTrail, appendAuditEntry,
    rollingForecast, setRollingForecast,
  } = useBudget();

  // ── Préférences UI ────────────────────────────────────────────────
  const {
    darkMode, setDarkMode,
    sidebarOpen, setSidebarOpen,
    activeTab, setActiveTab,
    dafSub, setDafSub,
    showTooltips, setShowTooltips,
    privacyMode, setPrivacyMode,
    directionPosition, setDirectionPosition,
    poleSupportPosition, setPoleSupportPosition,
  } = useUIPrefs();

  // ── Authentification ──────────────────────────────────────────────
  const {
    isAuthenticated, setIsAuthenticated,
    showPasswordModal, setShowPasswordModal,
    showAICopilot, setShowAICopilot,
    isLocalhost, handleLogout,
  } = useAuth();

  // ── États UI locaux ───────────────────────────────────────────────
  const [showStartupGate, setShowStartupGate] = useState(() => !hasStoredData());
  const [showHardReset, setShowHardReset]     = useState(false);
  const [compareSnapshot, setCompareSnapshot] = useState(false);
  const [repartirSiege, setRepartirSiege]     = useState(false);
  const [searchQuery, setSearchQuery]         = useState('');
  const [dragId, setDragId]                   = useState(null);
  const [dragOverId, setDragOverId]           = useState(null);
  const [simulationsOuvertes, setSimulationsOuvertes] = useState(new Set());
  const [fiPanelsOuverts, setFiPanelsOuverts]         = useState(new Set());
  const [fiDialog, setFiDialog]                       = useState(null);
  const [saisonnaliteDialog, setSaisonnaliteDialog]   = useState(null);
  const [showImportN1, setShowImportN1]         = useState(false);
  const [showWizardBP, setShowWizardBP]         = useState(false);
  const [showBalanceImport, setShowBalanceImport] = useState(false);
  const [simCharges, setSimCharges]       = useState({ augSalaires: 0, augCharges: 0, augExploitation: 0 });
  const [simRegion, setSimRegion]         = useState(0);
  const [presentationMode, setPresentationMode] = useState(false);
  const [slideIndex, setSlideIndex]             = useState(0);
  const [focusedAgentId, setFocusedAgentId]     = useState(null);
  const [showRolesModal, setShowRolesModal]     = useState(false);
  const [showResetModal, setShowResetModal]     = useState(false);
  const [pilotageResetKey, setPilotageResetKey] = useState(0);

  const isFirstLaunch = !localStorage.getItem('assoc_services') && !localStorage.getItem('assoc_direction');
  const [showWizardSetup, setShowWizardSetup] = useState(isFirstLaunch);

  // ── Mode DAF (verrouillage institutionnel) ───────────────────────
  const dafMode = useDafMode();

  // ── Rôles ─────────────────────────────────────────────────────────
  const roles = globalParams.rolesPersonnel || [];
  const setRoles = (fn) => setGlobalParams(prev => ({
    ...prev,
    rolesPersonnel: typeof fn === 'function' ? fn(prev.rolesPersonnel || []) : fn,
  }));

  // ── Navigation inter-onglets RH ↔ Budget ─────────────────────────
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

  // ── Remise à zéro globale ─────────────────────────────────────────
  const handleGlobalReset = async (resetPassword) => {
    const ok = await checkPassword(resetPassword);
    if (!ok) return 'Mot de passe incorrect';
    ['assoc_globalParams','assoc_direction','assoc_services','assoc_data_version','assoc_pilotage_sites',
     'assoc_direction_position','assoc_pole_support','assoc_pole_support_position','assoc_darkMode']
      .forEach(k => localStorage.removeItem(k));
    setDirectionPosition(0);
    setPoleSupportPosition(1);
    setEnveloppeFormation({ budget: 0, actions: [] });
    ['assoc_enveloppe_formation','assoc_reporting_fc','assoc_donnees_n1',
     'assoc_planning_absences','assoc_benevoles','assoc_repartition_temps','assoc_pool_rh']
      .forEach(k => localStorage.removeItem(k));
    setReportingFC([]); setDonneesN1(null); setPlanningAbsences({});
    setBenevoles([]); setRepartitionTemps({}); setDarkMode(false); setPoolRH([]);
    setGlobalParams(zeroGlobalParams);
    setDirection(zeroDirection);
    setServices(zeroServices);
    setPoleSupport(defaultPoleSupport);
    setPilotageSites(pilotageZeroSites);
    setPilotageResetKey(k => k + 1);
    appendAuditEntry('Remise à zéro globale', 'Paramètres', 'Toutes les données effacées après confirmation mot de passe');
    window.appToast?.('Données réinitialisées avec succès', 'success');
    return null;
  };

  // ── Wizard setup ──────────────────────────────────────────────────
  const handleWizardComplete = (data) => {
    if (data.globalParams) setGlobalParams(prev => ({ ...prev, ...data.globalParams }));
    if (data.direction)    setDirection(data.direction);
    if (data.poleSupport)  setPoleSupport(data.poleSupport);
    if (data.services)     setServices(data.services);
    if (data.poolRH)       setPoolRH(data.poolRH);
    setShowWizardSetup(false);
    setActiveTab('budget');
  };

  // ── Sauvegarde / restauration ─────────────────────────────────────
  const sauvegarderBudget = () => {
    const date = new Date().toISOString().split('T')[0];
    const data = {
      version: '2.1', type: 'association', date: new Date().toISOString(),
      globalParams, direction, services, poleSupport, poolRH,
      enveloppeFormation, reportingFC, donneesN1, planningAbsences,
      benevoles, repartitionTemps, pilotageSites, directionPosition, poleSupportPosition,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `budget_association_${date}.json`;
    link.click();
    appendAuditEntry('Export JSON', 'Paramètres', `budget_association_${date}.json`);
  };

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        sauvegarderBudget();
        window.appToast?.('Export JSON téléchargé', 'info');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const restaurerBackup = async () => {
    try {
      const slot = parseInt(localStorage.getItem('assoc_backup_slot') || '0', 10);
      if (!slot) { window.appToast?.('Aucun backup automatique disponible.', 'warning'); return; }
      const snapshots = [1, 2, 3]
        .map(i => { try { return JSON.parse(localStorage.getItem(`assoc_backup_${i}`) || 'null'); } catch(e) { return null; } })
        .filter(Boolean)
        .sort((a, b) => new Date(b.ts) - new Date(a.ts));
      if (!snapshots.length) { window.appToast?.('Aucun backup automatique disponible.', 'warning'); return; }
      const snap = snapshots[0];
      const d = new Date(snap.ts).toLocaleString('fr-FR');
      const ok = await window.appConfirm?.(
        'Restaurer le backup',
        `Restaurer le backup du ${d} ?\nCela remplacera les données actuelles.`,
        { confirmLabel: 'Restaurer', danger: true }
      );
      if (!ok) return;
      if (snap.globalParams)       setGlobalParams(snap.globalParams);
      if (snap.direction)          setDirection(snap.direction);
      if (snap.services)           setServices(snap.services);
      if (snap.poleSupport)        setPoleSupport(snap.poleSupport);
      if (snap.poolRH)             setPoolRH(snap.poolRH);
      if (snap.pilotageSites)      setPilotageSites(snap.pilotageSites);
      if (snap.enveloppeFormation) setEnveloppeFormation(snap.enveloppeFormation);
      if (snap.reportingFC)        setReportingFC(snap.reportingFC);
      if (snap.donneesN1)          setDonneesN1(snap.donneesN1);
      if (snap.planningAbsences)   setPlanningAbsences(snap.planningAbsences);
      if (snap.benevoles)          setBenevoles(snap.benevoles);
      if (snap.repartitionTemps)   setRepartitionTemps(snap.repartitionTemps);
      appendAuditEntry('Restauration backup', 'Paramètres', `Backup du ${d}`);
      window.appToast?.(`Backup du ${d} restauré avec succès.`, 'success');
    } catch(e) { window.appToast?.('Erreur lors de la restauration du backup.', 'error'); }
  };

  const chargerBudget = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    try {
      const { warnings } = await importData(file);
      if (warnings?.length) console.warn('[Import]', warnings.join(', '));
      appendAuditEntry('Import JSON', 'Paramètres', file.name);
      window.appToast?.('Budget importé — rechargement en cours…', 'success');
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      window.appToast?.(`Erreur d'import : ${err.message}`, 'error');
    }
  };

  // ── KPI déstructurés ──────────────────────────────────────────────
  const {
    totalRecettes, totalRecettesBase, totalCharges,
    soldeGlobal, soldeGlobalBase, stressImpact, hasDeficit,
    totalETP, totalEtudiants, tauxCouverture, coutParEtudiant, totalProvisions,
  } = kpiGlobaux;

  const nomsMois = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'];
  const seuilCouverture = globalParams.seuilCouverture ?? 90;

  if (!isAuthenticated) {
    return <LoginScreen onLogin={() => setIsAuthenticated(true)} checkPassword={checkPassword} darkMode={darkMode} />;
  }

  return (
    <Layout
      showTooltips={showTooltips}
      darkMode={darkMode} setDarkMode={setDarkMode}
      sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
      activeTab={activeTab} setActiveTab={setActiveTab}
      privacyMode={privacyMode} setPrivacyMode={setPrivacyMode}
      showAICopilot={showAICopilot} setShowAICopilot={setShowAICopilot}
      showStartupGate={showStartupGate} setShowStartupGate={setShowStartupGate}
      showHardReset={showHardReset} setShowHardReset={setShowHardReset}
      showImportN1={showImportN1} setShowImportN1={setShowImportN1} setDonneesN1={setDonneesN1}
      showWizardSetup={showWizardSetup} handleWizardComplete={handleWizardComplete} setShowWizardSetup={setShowWizardSetup}
      showWizardBP={showWizardBP} setShowWizardBP={setShowWizardBP}
      services={services} setServices={setServices}
      poleSupport={poleSupport} setPoleSupport={setPoleSupport}
      direction={direction} setDirection={setDirection}
      globalParams={globalParams} setGlobalParams={setGlobalParams}
      showRolesModal={showRolesModal} setShowRolesModal={setShowRolesModal} roles={roles} setRoles={setRoles}
      showResetModal={showResetModal} setShowResetModal={setShowResetModal} handleGlobalReset={handleGlobalReset}
      showPasswordModal={showPasswordModal} setShowPasswordModal={setShowPasswordModal}
      soldeGlobal={soldeGlobal} totalETP={totalETP} tauxCouverture={tauxCouverture}
      stressTest={stressTest} setStressTest={setStressTest} stressImpact={stressImpact} coefficientBP={coefficientBP}
      totalRecettes={totalRecettes} totalCharges={totalCharges} totalEtudiants={totalEtudiants} coutParEtudiant={coutParEtudiant}
      alertes={alertes}
      getBudgetDirection={getBudgetDirection} getBudgetPoleSupport={getBudgetPoleSupport} getBudgetService={getBudgetService}
      masseSalarialeTotal={masseSalarialeTotal} tresorerie={tresorerie}
      sauvegarderBudget={sauvegarderBudget}
    >
    <>
      {activeTab === 'dashboard' && (
        <TabDashboard
          darkMode={darkMode}
          direction={direction} poleSupport={poleSupport} services={services} poolRH={poolRH}
          globalParams={globalParams} setGlobalParams={setGlobalParams}
          getBFR={getBFR}
          getBudgetService={getBudgetService} getBudgetDirection={getBudgetDirection} getBudgetPoleSupport={getBudgetPoleSupport}
          compareSnapshot={compareSnapshot} setCompareSnapshot={setCompareSnapshot}
          summary3Ans={summary3Ans} budgetAnnuel={budgetAnnuel} tresorerie={tresorerie} projection36={projection36}
          rollingForecastData={rollingForecastData} rollingForecast={rollingForecast} setRollingForecast={setRollingForecast}
          totalCharges={totalCharges} totalRecettes={totalRecettes} soldeGlobal={soldeGlobal}
          tauxCouverture={tauxCouverture} masseSalarialeTotal={masseSalarialeTotal}
          planningAbsences={planningAbsences} msETP={msETP} nomsMois={nomsMois}
          seuilCouverture={seuilCouverture}
        />
      )}

      {activeTab === 'analyse' && (
        <TabAnalyse
          darkMode={darkMode}
          direction={direction} poleSupport={poleSupport} services={services}
          globalParams={globalParams} setGlobalParams={setGlobalParams}
          donneesN1={donneesN1} setDonneesN1={setDonneesN1} setShowImportN1={setShowImportN1}
          simCharges={simCharges} setSimCharges={setSimCharges}
          simRegion={simRegion} setSimRegion={setSimRegion}
          getBudgetDirection={getBudgetDirection} getBudgetPoleSupport={getBudgetPoleSupport} getBudgetService={getBudgetService}
          getProvisions={getProvisions} getBFR={getBFR} getFondRoulement={getFondRoulement}
          soldeGlobal={soldeGlobal} msETP={msETP} planningAbsences={planningAbsences}
          poolRH={poolRH} masseSalarialeTotal={masseSalarialeTotal}
          statsFormation={statsFormation} personnelEligibleSubvention={personnelEligibleSubvention}
          balanceComptable={balanceComptable} setShowBalanceImport={setShowBalanceImport}
          engagements={engagements} setEngagements={setEngagements}
          benevoles={benevoles} setBenevoles={setBenevoles}
          fondsDedies={fondsDedies} setFondsDedies={setFondsDedies}
          appendAuditEntry={appendAuditEntry}
          tresorerie={tresorerie}
        />
      )}

      {activeTab === 'budget' && (
        <TabBudget
          darkMode={darkMode}
          direction={direction} setDirection={setDirection}
          poleSupport={poleSupport} setPoleSupport={setPoleSupport}
          services={services} setServices={setServices}
          poolRH={poolRH} setPoolRH={setPoolRH}
          globalParams={globalParams}
          getBudgetService={getBudgetService} getBudgetDirection={getBudgetDirection} getBudgetPoleSupport={getBudgetPoleSupport}
          planningAbsences={planningAbsences}
          dragId={dragId} setDragId={setDragId}
          dragOverId={dragOverId} setDragOverId={setDragOverId}
          simulationsOuvertes={simulationsOuvertes} setSimulationsOuvertes={setSimulationsOuvertes}
          fiPanelsOuverts={fiPanelsOuverts} setFiPanelsOuverts={setFiPanelsOuverts}
          setFiDialog={setFiDialog} setSaisonnaliteDialog={setSaisonnaliteDialog}
          directionPosition={directionPosition} setDirectionPosition={setDirectionPosition}
          poleSupportPosition={poleSupportPosition} setPoleSupportPosition={setPoleSupportPosition}
          focusedAgentId={focusedAgentId} navigateToRHAgent={navigateToRHAgent}
          privacyMode={privacyMode}
          setShowWizardBP={setShowWizardBP} setShowWizardSetup={setShowWizardSetup}
          pilotageSites={pilotageSites} roles={roles}
          calcSalarieFormateur={calcSalarieFormateur}
        />
      )}

      {activeTab === 'rh' && (
        <TabRH
          darkMode={darkMode}
          direction={direction} poleSupport={poleSupport} services={services} poolRH={poolRH}
          planningAbsences={planningAbsences} setPlanningAbsences={setPlanningAbsences}
          globalParams={globalParams} msETP={msETP}
          focusedAgentId={focusedAgentId} navigateToBudgetAgent={navigateToBudgetAgent}
          getBudgetDirection={getBudgetDirection} getBudgetPoleSupport={getBudgetPoleSupport} getBudgetService={getBudgetService}
          donneesN1={donneesN1} setDonneesN1={setDonneesN1} setShowImportN1={setShowImportN1}
        />
      )}

      {activeTab === 'temps' && (
        <TabRepartitionTemps
          direction={direction} poleSupport={poleSupport} services={services} poolRH={poolRH}
          darkMode={darkMode}
          repartitionTemps={repartitionTemps} setRepartitionTemps={setRepartitionTemps}
          privacyMode={privacyMode}
        />
      )}

      {activeTab === 'formation' && (
        <TabFormation
          darkMode={darkMode}
          services={services}
          enveloppeFormation={enveloppeFormation} setEnveloppeFormation={setEnveloppeFormation}
          reportingFC={reportingFC} setReportingFC={setReportingFC}
          pilotageSites={pilotageSites} setPilotageSites={setPilotageSites}
          pilotageResetKey={pilotageResetKey}
          direction={direction} poleSupport={poleSupport} globalParams={globalParams} setGlobalParams={setGlobalParams}
          checkPassword={checkPassword}
          calculerBudgetService={cbBudgetSvc}
          calculerBudgetDirection={cbBudgetDir}
          calculerBudgetPoleSupport={cbBudgetPS}
        />
      )}

      {activeTab === 'vacataires' && (
        <CalculateurVacataires
          darkMode={darkMode}
          tarifsVacataires={globalParams.tarifsVacataires ?? undefined}
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

      {activeTab === 'subvention' && (
        <SubventionRegion
          darkMode={darkMode}
          services={services} direction={direction} poleSupport={poleSupport}
          calculerBudgetService={cbBudgetSvc}
          calculerBudgetDirection={cbBudgetDir}
          calculerBudgetPoleSupport={cbBudgetPS}
          personnelEligible={personnelEligibleSubvention}
        />
      )}

      {activeTab === 'daf' && <>
        <div className={`flex gap-1 mb-6 p-1 rounded-xl w-fit ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-100 border border-gray-200'}`}>
          {[
            { id: 'subvention',    label: 'Demande de subvention', icon: <Calculator size={15}/> },
            { id: 'ventilationBP', label: 'Ventilation BP 2026',   icon: <FileSpreadsheet size={15}/> },
          ].map(sub => (
            <button
              key={sub.id}
              onClick={() => setDafSub(sub.id)}
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
            services={services} direction={direction} poleSupport={poleSupport} globalParams={globalParams}
            calculerBudgetService={cbBudgetSvc}
            calculerBudgetDirection={cbBudgetDir}
            calculerBudgetPoleSupport={cbBudgetPS}
            enveloppeFormation={enveloppeFormation}
          />
        )}
        {dafSub === 'ventilationBP' && (
          <VentilationBP
            darkMode={darkMode}
            services={services} direction={direction} poleSupport={poleSupport}
            setServices={setServices} setDirection={setDirection} setPoleSupport={setPoleSupport}
          />
        )}
      </>}

      {activeTab === 'parametres' && (
        <TabParametres
          darkMode={darkMode} setDarkMode={setDarkMode}
          direction={direction} poleSupport={poleSupport} services={services} poolRH={poolRH}
          globalParams={globalParams} setGlobalParams={setGlobalParams}
          setShowPasswordModal={setShowPasswordModal}
          setShowRolesModal={setShowRolesModal}
          setShowImportN1={setShowImportN1}
          setShowWizardBP={setShowWizardBP}
          isLocalhost={isLocalhost}
          sauvegarderBudget={sauvegarderBudget}
          genererCSVComptable={genererCSVComptable}
          telechargerCSVComptable={telechargerCSVComptable}
          compareSnapshot={compareSnapshot} setCompareSnapshot={setCompareSnapshot}
          fileInputRef={fileInputRef} chargerBudget={chargerBudget}
          restaurerBackup={restaurerBackup}
          handleLogout={handleLogout}
          setPresentationMode={setPresentationMode} setSlideIndex={setSlideIndex}
          setShowResetModal={setShowResetModal}
          showTooltips={showTooltips} setShowTooltips={setShowTooltips}
          donneesN1={donneesN1}
          repartirSiege={repartirSiege} setRepartirSiege={setRepartirSiege}
          getBudgetDirection={getBudgetDirection} getBudgetService={getBudgetService}
          setShowHardReset={setShowHardReset}
          auditTrail={auditTrail} appendAuditEntry={appendAuditEntry}
          dafMode={dafMode}
          referentielStructure={referentielStructure} setReferentielStructure={setReferentielStructure}
        />
      )}

      {activeTab === 'devis' && <TabDevis darkMode={darkMode} />}

      {activeTab === 'reporting' && (
        <TabReporting
          darkMode={darkMode}
          direction={direction} poleSupport={poleSupport} services={services}
          poolRH={poolRH} globalParams={globalParams} privacyMode={privacyMode}
        />
      )}

      {activeTab === 'budget' && globalParams?.statutBudget !== 'gele' && (
        <button
          onClick={() => {
            const nouveau = { ...services[0], id: Date.now(), nom: `Service ${services.length + 1}`,
              personnel: services[0].personnel.map(p => ({ ...p, id: Date.now() + Math.random() })),
              exploitation: services[0].exploitation.map(e => ({ ...e, id: Date.now() + Math.random() })),
              recettes: (services[0].recettes || []).map(r => ({ ...r, id: Date.now() + Math.random() })),
              promos: undefined, unites: 10,
            };
            setServices([...services, nouveau]);
          }}
          className="w-full mt-8 py-5 border-2 border-dashed border-teal-300 rounded-3xl text-teal-500 font-black text-lg hover:bg-teal-50 transition-all flex items-center justify-center gap-3 no-print"
        >
          <Plus size={24} /> AJOUTER UN SERVICE
        </button>
      )}

      <ModalFI fiDialog={fiDialog} setFiDialog={setFiDialog} services={services} setServices={setServices} msETP={msETP} darkMode={darkMode} />
      <ModalSaisonnalite dialog={saisonnaliteDialog} setDialog={setSaisonnaliteDialog} services={services} setServices={setServices} poleSupport={poleSupport} setPoleSupport={setPoleSupport} direction={direction} setDirection={setDirection} darkMode={darkMode} />
      <BalanceImportModal
        isOpen={showBalanceImport}
        onClose={() => setShowBalanceImport(false)}
        onConfirm={(data) => { setBalanceComptable(data); appendAuditEntry('Import balance comptable', 'Analyse', `${data.entries.length} comptes — exercice ${data.annee}`); }}
        darkMode={darkMode}
      />

      {presentationMode && (
        <PresentationMode
          direction={direction} poleSupport={poleSupport} services={services} darkMode={darkMode}
          onClose={() => setPresentationMode(false)}
          calculerBudgetDirection={calculerBudgetDirection}
          calculerBudgetService={calculerBudgetService}
          calculerBudgetPoleSupport={calculerBudgetPoleSupport}
          calculerSalaireAnnuel={calculerSalaireAnnuel}
          calculerStatsFormation={calculerStatsFormation}
        />
      )}
    </>
    </Layout>
  );
};

export default BudgetTool;
