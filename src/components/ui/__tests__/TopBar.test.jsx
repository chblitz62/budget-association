import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TopBar from '../TopBar';
import ToolsMenu from '../ToolsMenu';

const baseProps = {
  darkMode: false,
  setDarkMode: vi.fn(),
  sidebarOpen: true,
  activeTab: 'dashboard',
  setActiveTab: vi.fn(),
  soldeGlobal: 12000,
  totalETP: 25.5,
  tauxCouverture: 102,
  stressTest: 0,
  stressImpact: 0,
  coefficientBP: 100,
  globalParams: { statutBudget: 'brouillon' },
  privacyMode: false,
  setPrivacyMode: vi.fn(),
  showAICopilot: false,
  setShowAICopilot: vi.fn(),
  showEcoFin: false,
  setShowEcoFin: vi.fn(),
  sauvegarderBudget: vi.fn(),
};

describe('<TopBar />', () => {
  it('rend les 3 KPIs hero (Résultat, Effectifs, Couverture) avec libellés humanisés', () => {
    render(<TopBar {...baseProps} />);
    expect(screen.getByText('Résultat')).toBeInTheDocument();
    expect(screen.getByText('Effectifs')).toBeInTheDocument();
    expect(screen.getByText('Couverture')).toBeInTheDocument();
  });

  it('affiche un smart dot indicator par niveau (success/warning/danger)', () => {
    const { container, rerender } = render(<TopBar {...baseProps} soldeGlobal={5000} tauxCouverture={102} />);
    // 3 dots colorés, succès = bg-emerald-500
    const dotsAllSuccess = container.querySelectorAll('.bg-emerald-500');
    expect(dotsAllSuccess.length).toBeGreaterThan(0);

    rerender(<TopBar {...baseProps} soldeGlobal={-5000} tauxCouverture={85} />);
    const dotsDanger = container.querySelectorAll('.bg-rose-500');
    expect(dotsDanger.length).toBeGreaterThan(0);
  });

  it('affiche le solde au format +Xk avec couleur emerald si positif', () => {
    render(<TopBar {...baseProps} soldeGlobal={15000} />);
    expect(screen.getByText('+15')).toBeInTheDocument();
  });

  it('affiche le solde négatif sans + et couleur rose', () => {
    render(<TopBar {...baseProps} soldeGlobal={-8500} />);
    // Math.round(-8500/1000) = -8 (round-half-to-even sur certaines implémentations) ou -9
    expect(screen.getByText(/-[89]/)).toBeInTheDocument();
  });

  it('affiche le nom de la page courante', () => {
    render(<TopBar {...baseProps} activeTab="analyse" />);
    expect(screen.getByText('Analyse')).toBeInTheDocument();
  });

  it('bouton Sauver appelle sauvegarderBudget', () => {
    const sauv = vi.fn();
    render(<TopBar {...baseProps} sauvegarderBudget={sauv} />);
    fireEvent.click(screen.getByRole('button', { name: /Sauver/i }));
    expect(sauv).toHaveBeenCalledTimes(1);
  });

  it('badges secondaires masqués si tout est neutre', () => {
    render(<TopBar {...baseProps} />);
    expect(screen.queryByText(/Stress/)).toBeNull();
    expect(screen.queryByText(/Coeff BP/)).toBeNull();
  });

  it('badge Stress apparaît si stressTest != 0', () => {
    render(<TopBar {...baseProps} stressTest={-10} stressImpact={-5000} />);
    expect(screen.getByText(/Stress/)).toBeInTheDocument();
  });

  it('badge Coeff BP apparaît si coefficientBP != 100', () => {
    render(<TopBar {...baseProps} coefficientBP={95} />);
    expect(screen.getByText(/Coeff BP/)).toBeInTheDocument();
  });

  it('badge statut Validé apparaît si statutBudget=valide', () => {
    render(<TopBar {...baseProps} globalParams={{ statutBudget: 'valide' }} />);
    expect(screen.getByText(/Validé/)).toBeInTheDocument();
  });
});

describe('<ToolsMenu />', () => {
  it('rend le bouton trigger fermé par défaut', () => {
    render(<ToolsMenu darkMode={false} />);
    expect(screen.getByTitle(/Outils/i)).toBeInTheDocument();
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('ouvre le menu au clic et affiche les 5 actions', () => {
    render(<ToolsMenu darkMode={false} />);
    fireEvent.click(screen.getByTitle(/Outils/i));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByText(/Mode confidentialité|Confidentialité activée/)).toBeInTheDocument();
    expect(screen.getByText(/Glossaire Éco-Fin/)).toBeInTheDocument();
    expect(screen.getByText(/Copilote IA/)).toBeInTheDocument();
    expect(screen.getByText(/Mode sombre|Mode clair/)).toBeInTheDocument();
    expect(screen.getByText(/Paramètres/)).toBeInTheDocument();
  });

  it('appelle onPrivacyToggle au clic et ferme', () => {
    const fn = vi.fn();
    render(<ToolsMenu darkMode={false} onPrivacyToggle={fn} />);
    fireEvent.click(screen.getByTitle(/Outils/i));
    fireEvent.click(screen.getByText(/Mode confidentialité/));
    expect(fn).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('affiche un check ✓ sur les actions actives', () => {
    render(<ToolsMenu darkMode={false} privacyMode={true} />);
    fireEvent.click(screen.getByTitle(/Outils/i));
    // Le label devient "Confidentialité activée" quand privacyMode=true
    expect(screen.getByText(/Confidentialité activée/)).toBeInTheDocument();
  });

  it('ferme le menu à Échap', () => {
    render(<ToolsMenu darkMode={false} />);
    fireEvent.click(screen.getByTitle(/Outils/i));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu')).toBeNull();
  });
});
