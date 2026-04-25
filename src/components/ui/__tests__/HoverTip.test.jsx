import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import HoverTip from '../HoverTip';

describe('<HoverTip />', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('rend le déclencheur sans afficher la tooltip par défaut', () => {
    render(<HoverTip content="Définition"><span>Cible</span></HoverTip>);
    expect(screen.getByText('Cible')).toBeInTheDocument();
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('affiche la tooltip simple au survol après le délai', () => {
    render(<HoverTip content="Définition" delay={300}><span>Cible</span></HoverTip>);
    fireEvent.mouseEnter(screen.getByText('Cible').parentElement);
    act(() => { vi.advanceTimersByTime(350); });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    expect(screen.getByRole('tooltip')).toHaveTextContent('Définition');
  });

  it('cache la tooltip immédiatement à mouseLeave', () => {
    render(<HoverTip content="X"><span>Cible</span></HoverTip>);
    const trig = screen.getByText('Cible').parentElement;
    fireEvent.mouseEnter(trig);
    act(() => { vi.advanceTimersByTime(350); });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    fireEvent.mouseLeave(trig);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('ne s\'affiche pas si le délai est interrompu', () => {
    render(<HoverTip content="X" delay={300}><span>Cible</span></HoverTip>);
    const trig = screen.getByText('Cible').parentElement;
    fireEvent.mouseEnter(trig);
    act(() => { vi.advanceTimersByTime(150); });
    fireEvent.mouseLeave(trig);
    act(() => { vi.advanceTimersByTime(500); });
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('rend le format riche (title + description + interprétation)', () => {
    render(
      <HoverTip
        title="Résultat prévisionnel"
        description="Recettes − Charges"
        interpretation="✓ Excédent"
        level="success"
      >
        <span>Cible</span>
      </HoverTip>
    );
    fireEvent.mouseEnter(screen.getByText('Cible').parentElement);
    act(() => { vi.advanceTimersByTime(400); });
    const tip = screen.getByRole('tooltip');
    expect(tip).toHaveTextContent('Résultat prévisionnel');
    expect(tip).toHaveTextContent('Recettes − Charges');
    expect(tip).toHaveTextContent('✓ Excédent');
  });

  it('disabled bloque l\'affichage', () => {
    render(<HoverTip content="X" disabled><span>Cible</span></HoverTip>);
    fireEvent.mouseEnter(screen.getByText('Cible').parentElement);
    act(() => { vi.advanceTimersByTime(500); });
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('tooltip avec niveau success applique la bordure emerald', () => {
    render(
      <HoverTip title="T" description="D" level="success">
        <span>X</span>
      </HoverTip>
    );
    fireEvent.mouseEnter(screen.getByText('X').parentElement);
    act(() => { vi.advanceTimersByTime(400); });
    expect(screen.getByRole('tooltip').className).toContain('border-l-emerald-500');
  });

  it('s\'affiche aussi au focus clavier (a11y)', () => {
    render(<HoverTip content="X"><button>Btn</button></HoverTip>);
    fireEvent.focus(screen.getByText('Btn').parentElement);
    act(() => { vi.advanceTimersByTime(400); });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });
});
