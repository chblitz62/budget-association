import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TabBar from '../TabBar';

const tabs = [
  { id: 'dashboard',  label: 'Tableau de bord', icon: <span>i</span>, essential: true },
  { id: 'budget',     label: 'Budget',           icon: <span>i</span>, essential: true },
  { id: 'analyse',    label: 'Analyse',          icon: <span>i</span>, essential: true },
  { id: 'rh',         label: 'RH',               icon: <span>i</span>, essential: false },
  { id: 'formation',  label: 'Formation',        icon: <span>i</span>, essential: false },
  { id: 'subvention', label: 'Subvention',       icon: <span>i</span>, essential: false },
  { id: 'parametres', label: 'Paramètres',       icon: <span>i</span>, essential: false },
];

// Helper : matcher partiel (icone + " " + label)
const containsLabel = (label) => (_, node) =>
  node?.textContent?.includes(label) && Array.from(node.children).every(c => !c.textContent?.includes(label));

describe('<TabBar /> — Progressive Disclosure', () => {
  it('mode novice (par défaut) : affiche uniquement les 3 onglets essentiels', () => {
    render(<TabBar tabs={tabs} activeTab="dashboard" onChange={vi.fn()} />);
    expect(screen.getByText(/Tableau de bord/)).toBeInTheDocument();
    expect(screen.getByText(/Budget/)).toBeInTheDocument();
    expect(screen.getByText(/Analyse/)).toBeInTheDocument();
    // RH non essentiel — masqué
    expect(screen.queryByText(/RH/)).toBeNull();
  });

  it('mode novice : bouton "Plus" affiche le compteur d\'onglets cachés', () => {
    render(<TabBar tabs={tabs} activeTab="dashboard" onChange={vi.fn()} />);
    expect(screen.getByText('Plus')).toBeInTheDocument();
    expect(screen.getByText('+4')).toBeInTheDocument(); // 4 non-essentiels
  });

  it('clic sur "Plus" ouvre le menu avec les onglets non essentiels', () => {
    render(<TabBar tabs={tabs} activeTab="dashboard" onChange={vi.fn()} />);
    fireEvent.click(screen.getByText('Plus'));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByText(/RH/)).toBeInTheDocument();
    expect(screen.getByText(/Formation/)).toBeInTheDocument();
    expect(screen.getByText(/Subvention/)).toBeInTheDocument();
  });

  it('clic sur un onglet du menu Plus appelle onChange et ferme le menu', () => {
    const onChange = vi.fn();
    render(<TabBar tabs={tabs} activeTab="dashboard" onChange={onChange} />);
    fireEvent.click(screen.getByText('Plus'));
    fireEvent.click(screen.getByText(/Formation/));
    expect(onChange).toHaveBeenCalledWith('formation');
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('si activeTab n\'est pas essentiel, il est inclus dans la barre visible', () => {
    const { container } = render(<TabBar tabs={tabs} activeTab="formation" onChange={vi.fn()} />);
    expect(container.querySelector('[aria-current="page"]')?.textContent).toContain('Formation');
    expect(screen.getByText(/Tableau de bord/)).toBeInTheDocument();
  });

  it('mode expert : affiche tous les onglets, pas de bouton "Plus"', () => {
    render(<TabBar tabs={tabs} activeTab="dashboard" onChange={vi.fn()} expertMode />);
    expect(screen.getByText(/RH/)).toBeInTheDocument();
    expect(screen.getByText(/Formation/)).toBeInTheDocument();
    expect(screen.queryByText('Plus')).toBeNull();
  });

  it('mode expert : affiche bouton retour "Mode essentiel" si onToggleExpertMode fourni', () => {
    const toggle = vi.fn();
    render(<TabBar tabs={tabs} activeTab="dashboard" onChange={vi.fn()} expertMode onToggleExpertMode={toggle} />);
    fireEvent.click(screen.getByText('Mode essentiel'));
    expect(toggle).toHaveBeenCalledTimes(1);
  });

  it('menu Plus contient le bouton "Activer le mode expert" si onToggleExpertMode fourni', () => {
    const toggle = vi.fn();
    render(<TabBar tabs={tabs} activeTab="dashboard" onChange={vi.fn()} onToggleExpertMode={toggle} />);
    fireEvent.click(screen.getByText('Plus'));
    expect(screen.getByText('Activer le mode expert')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Activer le mode expert'));
    expect(toggle).toHaveBeenCalledTimes(1);
  });

  it('menu Plus se ferme à Échap', () => {
    render(<TabBar tabs={tabs} activeTab="dashboard" onChange={vi.fn()} />);
    fireEvent.click(screen.getByText('Plus'));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu')).toBeNull();
  });
});
