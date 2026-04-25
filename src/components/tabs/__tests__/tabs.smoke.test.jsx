/**
 * Smoke tests pour les composants Tab.
 * Objectif : détecter les imports manquants (icônes, fonctions) et les props
 * non transmises AVANT de lancer l'application.
 * Ces tests ne vérifient pas le comportement fonctionnel.
 */
import React from 'react';
import { render } from '@testing-library/react';
import { vi } from 'vitest';
import { TooltipContext } from '../../../utils/TooltipContext';

// ─── Données minimales partagées ────────────────────────────────────────────

const noop = vi.fn();
const noopReturn = (v) => v ?? {};

const direction = {
  personnel: [],
  chargesSiege: [],
  recettes: [],
};

const poleSupport = {
  personnel: [],
  exploitation: [],
  recettes: [],
  repartition: {},
};

const globalParams = {
  augmentationAnnuelle: 0,
  montantSegurETP: 238,
  delaiPaiementClients: 30,
  delaiPaiementFournisseurs: 30,
  provisions: [],
  fondRoulement: [],
  stocksValeur: 0,
  rolesPersonnel: [
    { id: 'formateur', label: 'Formateur' },
    { id: 'direction', label: 'Siège' },
  ],
  coefficientBP: 100,
};

const services = [];
const poolRH = [];
const planningAbsences = {};
const pilotageSites = [];
const roles = [{ id: 'formateur', label: 'Formateur' }];
const donneesN1 = null;
const msETP = { direction: {}, services: {}, poleSupport: {} };
const getBudgetService = () => ({ solde: 0, totalCharges: 0, totalRecettes: 0, masseSalariale: 0, salairesAllouesFI: 0 });
const getBudgetDirection = () => ({ solde: 0, totalCharges: 0, totalRecettes: 0, masseSalariale: 0 });
const getBudgetPoleSupport = () => ({ solde: 0, totalCharges: 0, totalRecettes: 0, masseSalariale: 0 });

// Wrapper pour fournir le contexte Tooltip
const Wrapper = ({ children }) => (
  <TooltipContext.Provider value={false}>{children}</TooltipContext.Provider>
);

const renderWithCtx = (ui) => render(ui, { wrapper: Wrapper });

// ─── TabBudget ───────────────────────────────────────────────────────────────

import TabBudget from '../TabBudget';

describe('TabBudget — smoke test', () => {
  it('renders without crashing', () => {
    renderWithCtx(
      <TabBudget
        darkMode={false}
        direction={direction}
        setDirection={noop}
        poleSupport={poleSupport}
        setPoleSupport={noop}
        services={services}
        setServices={noop}
        poolRH={poolRH}
        setPoolRH={noop}
        globalParams={globalParams}
        getBudgetService={getBudgetService}
        getBudgetDirection={getBudgetDirection}
        getBudgetPoleSupport={getBudgetPoleSupport}
        planningAbsences={planningAbsences}
        dragId={null}
        setDragId={noop}
        dragOverId={null}
        setDragOverId={noop}
        simulationsOuvertes={new Set()}
        setSimulationsOuvertes={noop}
        fiPanelsOuverts={new Set()}
        setFiPanelsOuverts={noop}
        setFiDialog={noop}
        setSaisonnaliteDialog={noop}
        directionPosition={0}
        setDirectionPosition={noop}
        poleSupportPosition={1}
        setPoleSupportPosition={noop}
        focusedAgentId={null}
        navigateToRHAgent={noop}
        privacyMode={false}
        setShowWizardBP={noop}
        setShowWizardSetup={noop}
        pilotageSites={pilotageSites}
        roles={roles}
      />
    );
  });
});

// ─── TabAnalyse ──────────────────────────────────────────────────────────────

import TabAnalyse from '../TabAnalyse';

describe('TabAnalyse — smoke test', () => {
  it('renders without crashing', () => {
    renderWithCtx(
      <TabAnalyse
        darkMode={false}
        direction={direction}
        poleSupport={poleSupport}
        services={services}
        globalParams={globalParams}
        setGlobalParams={noop}
        donneesN1={donneesN1}
        setDonneesN1={noop}
        setShowImportN1={noop}
        simCharges={0}
        setSimCharges={noop}
        getBudgetDirection={getBudgetDirection}
        getBudgetPoleSupport={getBudgetPoleSupport}
        getBudgetService={getBudgetService}
        getProvisions={() => []}
        getBFR={() => ({ bfr: 0 })}
        getFondRoulement={() => ({ total: 0 })}
        soldeGlobal={0}
        msETP={msETP}
        planningAbsences={planningAbsences}
        simRegion={0}
        setSimRegion={noop}
        poolRH={poolRH}
        masseSalarialeTotal={0}
        statsFormation={{}}
        personnelEligibleSubvention={[]}
      />
    );
  });
});

// ─── TabDashboard ────────────────────────────────────────────────────────────

import TabDashboard from '../TabDashboard';

describe('TabDashboard — smoke test', () => {
  it('renders without crashing', () => {
    renderWithCtx(
      <TabDashboard
        darkMode={false}
        direction={direction}
        poleSupport={poleSupport}
        services={services}
        poolRH={poolRH}
        globalParams={{ ...globalParams, expertMode: true }}
        getBFR={() => ({ bfr: 0 })}
        getBudgetService={getBudgetService}
        getBudgetDirection={getBudgetDirection}
        getBudgetPoleSupport={getBudgetPoleSupport}
        compareSnapshot={false}
        setCompareSnapshot={noop}
        summary3Ans={[{ annee: 2026, budgetDirection: 0, detailsServices: [], totalCharges: 0, totalRecettes: 0, solde: 0 }]}
        budgetAnnuel={{ mois: Array(12).fill(0).map((_, i) => ({ mois: i + 1, nom: String(i+1), total: 0, recettes: 0, charges: 0 })), total: {} }}
        tresorerie={{ mois: [], totalEncaissements: 0, totalDecaissements: 0, alertesMois: [], _debug: {} }}
        totalCharges={0}
        totalRecettes={0}
        soldeGlobal={0}
        tauxCouverture={100}
        masseSalarialeTotal={0}
        planningAbsences={planningAbsences}
        msETP={msETP}
        nomsMois={[]}
        seuilCouverture={90}
      />
    );
  });
});

// ─── TabRH ───────────────────────────────────────────────────────────────────

import TabRH from '../TabRH';

describe('TabRH — smoke test', () => {
  it('renders without crashing', () => {
    renderWithCtx(
      <TabRH
        darkMode={false}
        direction={direction}
        poleSupport={poleSupport}
        services={services}
        poolRH={[]}
        planningAbsences={planningAbsences}
        setPlanningAbsences={noop}
        globalParams={globalParams}
        msETP={msETP}
        focusedAgentId={null}
        navigateToBudgetAgent={noop}
        getBudgetDirection={getBudgetDirection}
        getBudgetPoleSupport={getBudgetPoleSupport}
        getBudgetService={getBudgetService}
        donneesN1={donneesN1}
        setDonneesN1={noop}
        setShowImportN1={noop}
      />
    );
  });
});

// ─── TabFormation ────────────────────────────────────────────────────────────

import TabFormation from '../TabFormation';

describe('TabFormation — smoke test', () => {
  it('renders without crashing', () => {
    renderWithCtx(
      <TabFormation
        darkMode={false}
        services={services}
        enveloppeFormation={{ budget: 0, depenses: [] }}
        setEnveloppeFormation={noop}
        reportingFC={[]}
        setReportingFC={noop}
        pilotageSites={pilotageSites}
        setPilotageSites={noop}
        pilotageResetKey={0}
        direction={direction}
        poleSupport={poleSupport}
        globalParams={globalParams}
        checkPassword={() => Promise.resolve(true)}
      />
    );
  });
});

// ─── TabReporting ────────────────────────────────────────────────────────────

import TabReporting from '../TabReporting';

describe('TabReporting — smoke test', () => {
  it('renders without crashing', () => {
    renderWithCtx(
      <TabReporting
        darkMode={false}
        direction={direction}
        poleSupport={poleSupport}
        services={services}
        poolRH={poolRH}
        globalParams={globalParams}
        privacyMode={false}
      />
    );
  });
});

// ─── TabParametres ───────────────────────────────────────────────────────────

import TabParametres from '../TabParametres';
import { createRef } from 'react';

describe('TabParametres — smoke test', () => {
  it('renders without crashing', () => {
    renderWithCtx(
      <TabParametres
        darkMode={false}
        setDarkMode={noop}
        direction={direction}
        poleSupport={poleSupport}
        services={services}
        poolRH={poolRH}
        globalParams={globalParams}
        setGlobalParams={noop}
        setShowPasswordModal={noop}
        setShowRolesModal={noop}
        setShowImportN1={noop}
        setShowWizardBP={noop}
        isLocalhost={false}
        sauvegarderBudget={noop}
        genererCSVComptable={noop}
        telechargerCSVComptable={noop}
        compareSnapshot={false}
        setCompareSnapshot={noop}
        fileInputRef={createRef()}
        chargerBudget={noop}
        restaurerBackup={noop}
        handleLogout={noop}
        setPresentationMode={noop}
        setSlideIndex={noop}
        setShowResetModal={noop}
        showTooltips={false}
        setShowTooltips={noop}
        donneesN1={donneesN1}
        repartirSiege={false}
        setRepartirSiege={noop}
        getBudgetDirection={getBudgetDirection}
        getBudgetService={getBudgetService}
        setShowHardReset={noop}
      />
    );
  });
});

// ─── TabDevis ────────────────────────────────────────────────────────────────

import TabDevis from '../TabDevis';

describe('TabDevis — smoke test', () => {
  it('renders without crashing (mode clair)', () => {
    renderWithCtx(<TabDevis darkMode={false} />);
  });

  it('renders without crashing (dark mode)', () => {
    renderWithCtx(<TabDevis darkMode={true} />);
  });
});
