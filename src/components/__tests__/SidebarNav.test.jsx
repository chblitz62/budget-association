import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SidebarNav from '../SidebarNav';

const baseProps = {
  services: [],
  darkMode: false,
  isOpen: true,
  onToggle: vi.fn(),
  activeTab: 'dashboard',
  onTabChange: vi.fn(),
};

describe('<SidebarNav /> v2 — floating glass + Premiers pas', () => {
  it('rend les groupes principaux (Tableau de bord / Saisie / Pilotage / Audit)', () => {
    render(<SidebarNav {...baseProps} />);
    expect(screen.getByText('Tableau de bord', { selector: 'div' })).toBeInTheDocument();
    expect(screen.getByText('Saisie')).toBeInTheDocument();
    expect(screen.getByText('Pilotage')).toBeInTheDocument();
    expect(screen.getByText('Audit')).toBeInTheDocument();
  });

  it('section "Premiers pas" masquée si aucune callback fournie', () => {
    render(<SidebarNav {...baseProps} />);
    expect(screen.queryByText('Premiers pas')).toBeNull();
  });

  it('section "Premiers pas" affichée si onShowWizardSetup fourni', () => {
    render(<SidebarNav {...baseProps} onShowWizardSetup={vi.fn()} />);
    expect(screen.getByText('Premiers pas')).toBeInTheDocument();
    expect(screen.getByText('Assistant de configuration')).toBeInTheDocument();
  });

  it('callbacks "Premiers pas" déclenchent les wizards', () => {
    const setup = vi.fn();
    const bp = vi.fn();
    const eco = vi.fn();
    render(<SidebarNav {...baseProps}
      onShowWizardSetup={setup}
      onShowWizardBP={bp}
      onShowEcoFin={eco}
    />);
    fireEvent.click(screen.getByText('Assistant de configuration'));
    expect(setup).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText('Importer un budget'));
    expect(bp).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText('Glossaire financier'));
    expect(eco).toHaveBeenCalledTimes(1);
  });

  it('rend les hints pédagogiques de chaque action onboarding', () => {
    render(<SidebarNav {...baseProps} onShowWizardSetup={vi.fn()} onShowWizardBP={vi.fn()} />);
    expect(screen.getByText('Premier paramétrage pas à pas')).toBeInTheDocument();
    expect(screen.getByText('Depuis un fichier Excel BP')).toBeInTheDocument();
  });

  it('en mode replié (isOpen=false), les hints sont masqués mais titles HTML conservés', () => {
    const { container } = render(<SidebarNav {...baseProps} isOpen={false} onShowWizardSetup={vi.fn()} />);
    expect(screen.queryByText('Premier paramétrage pas à pas')).toBeNull();
    // titles présents pour accessibilité
    const btns = container.querySelectorAll('button[title]');
    expect(btns.length).toBeGreaterThan(0);
  });

  it('onToggle appelé au clic sur le bouton chevron', () => {
    const toggle = vi.fn();
    render(<SidebarNav {...baseProps} onToggle={toggle} />);
    fireEvent.click(screen.getByLabelText(/Replier la barre latérale/i));
    expect(toggle).toHaveBeenCalledTimes(1);
  });

  it('onTabChange appelé avec l\'id du tab cliqué', () => {
    const onTabChange = vi.fn();
    render(<SidebarNav {...baseProps} onTabChange={onTabChange} />);
    fireEvent.click(screen.getByText('Analyse'));
    expect(onTabChange).toHaveBeenCalledWith('analyse');
  });

  it('rend le badge de solde sur les services avec budget', () => {
    const services = [{ id: 's1', nom: 'Service Test', personnel: [], recettes: [], exploitation: [] }];
    const getBudgetService = () => ({ recettes: 10000, total: 7000 });
    render(<SidebarNav {...baseProps} services={services} getBudgetService={getBudgetService} />);
    // 10000 - 7000 = 3000 → '+3k€'
    expect(screen.getByText(/\+3k€/)).toBeInTheDocument();
  });
});
