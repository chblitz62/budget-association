import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import NoviceDashboard from '../NoviceDashboard';
import { BudgetContext } from '../../contexts/BudgetContext';

// Recharts requires ResizeObserver — already polyfilled in test-setup.js

const buildCtx = (overrides = {}) => ({
  kpiGlobaux: {
    totalRecettes: 500000,
    totalCharges: 480000,
    soldeGlobal: 20000,
    tauxCouverture: 104,
    totalETP: 25,
    ...(overrides.kpiGlobaux || {}),
  },
  alertes: overrides.alertes || [],
  tresorerie: overrides.tresorerie || {
    mois: Array.from({ length: 12 }, (_, i) => ({
      nom: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'][i],
      encaissements: 40000,
      decaissements: 38000,
      soldeCumule: i * 2000,
    })),
  },
  masseSalarialeTotal: overrides.masseSalarialeTotal || 300000,
});

const renderWithCtx = (ui, ctxOverrides = {}) =>
  render(<BudgetContext.Provider value={buildCtx(ctxOverrides)}>{ui}</BudgetContext.Provider>);

describe('<NoviceDashboard />', () => {
  it('hero status "Tout va bien" si aucune alerte', () => {
    renderWithCtx(<NoviceDashboard darkMode={false} />, { alertes: [] });
    expect(screen.getByText(/Tout va bien/i)).toBeInTheDocument();
  });

  it('hero status "Action requise" si warnings sans erreur', () => {
    renderWithCtx(<NoviceDashboard darkMode={false} />, {
      alertes: [{ lvl: 'warning', msg: 'Trésorerie tendue' }],
    });
    expect(screen.getByText(/Action requise/i)).toBeInTheDocument();
  });

  it('hero status "Attention requise" si erreurs', () => {
    renderWithCtx(<NoviceDashboard darkMode={false} />, {
      alertes: [{ lvl: 'error', msg: 'Solde négatif critique' }],
    });
    expect(screen.getByText(/Attention requise/i)).toBeInTheDocument();
  });

  it('rend les 3 KPIs hero (Recettes / Charges / Résultat)', () => {
    renderWithCtx(<NoviceDashboard darkMode={false} />);
    expect(screen.getByText(/Recettes annuelles/i)).toBeInTheDocument();
    expect(screen.getByText(/Charges annuelles/i)).toBeInTheDocument();
    expect(screen.getByText(/Résultat de l'exercice/i)).toBeInTheDocument();
  });

  it('formatte le résultat avec signe + et k€', () => {
    renderWithCtx(<NoviceDashboard darkMode={false} />, {
      kpiGlobaux: { totalRecettes: 500000, totalCharges: 480000, soldeGlobal: 20000, tauxCouverture: 104, totalETP: 25 },
    });
    expect(screen.getByText('+20 k €')).toBeInTheDocument();
  });

  it('affiche les points de vigilance (max 3) si alertes', () => {
    renderWithCtx(<NoviceDashboard darkMode={false} />, {
      alertes: [
        { lvl: 'error',   msg: 'Erreur critique 1' },
        { lvl: 'error',   msg: 'Erreur critique 2' },
        { lvl: 'warning', msg: 'Avertissement A' },
        { lvl: 'warning', msg: 'Avertissement B' },
      ],
    });
    expect(screen.getByText(/Points de vigilance/i)).toBeInTheDocument();
    expect(screen.getByText('Erreur critique 1')).toBeInTheDocument();
    expect(screen.getByText('Erreur critique 2')).toBeInTheDocument();
    expect(screen.getByText('Avertissement A')).toBeInTheDocument();
    // 4e n'apparaît pas (max 3)
    expect(screen.queryByText('Avertissement B')).toBeNull();
  });

  it('section "Points de vigilance" absente si aucune alerte', () => {
    renderWithCtx(<NoviceDashboard darkMode={false} />, { alertes: [] });
    expect(screen.queryByText(/Points de vigilance/i)).toBeNull();
  });

  it('CTA "En savoir plus — Mode expert" appelle onToggleExpertMode', () => {
    const toggle = vi.fn();
    renderWithCtx(<NoviceDashboard darkMode={false} onToggleExpertMode={toggle} />);
    fireEvent.click(screen.getByText(/En savoir plus/i));
    expect(toggle).toHaveBeenCalledTimes(1);
  });

  it('CTA absent si onToggleExpertMode pas fourni', () => {
    renderWithCtx(<NoviceDashboard darkMode={false} />);
    expect(screen.queryByText(/En savoir plus/i)).toBeNull();
  });

  it('priorise les erreurs avant les warnings dans le top 3', () => {
    renderWithCtx(<NoviceDashboard darkMode={false} />, {
      alertes: [
        { lvl: 'warning', msg: 'WARN-1' },
        { lvl: 'error',   msg: 'ERR-1' },
        { lvl: 'warning', msg: 'WARN-2' },
        { lvl: 'error',   msg: 'ERR-2' },
      ],
    });
    // Top 3 = ERR-1, ERR-2, WARN-1 (ou WARN-2 selon ordre stable)
    expect(screen.getByText('ERR-1')).toBeInTheDocument();
    expect(screen.getByText('ERR-2')).toBeInTheDocument();
  });

  it('rend le bandeau secondaire (ETP, taux couverture, niveau d\'alerte)', () => {
    renderWithCtx(<NoviceDashboard darkMode={false} />, {
      kpiGlobaux: { totalRecettes: 100, totalCharges: 100, soldeGlobal: 0, tauxCouverture: 95, totalETP: 12.5 },
    });
    expect(screen.getByText(/Effectifs/)).toBeInTheDocument();
    expect(screen.getByText('12.5')).toBeInTheDocument();
    expect(screen.getByText(/Taux de couverture/i)).toBeInTheDocument();
    expect(screen.getByText(/Niveau d'alerte/i)).toBeInTheDocument();
  });
});
