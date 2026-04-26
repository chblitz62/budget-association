import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Term, { AutoTerms } from '../Term';

describe('<Term /> — glossaire inline', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('rend le texte enfant tel quel si terme inconnu', () => {
    render(<Term id="terme_inexistant">Inconnu</Term>);
    expect(screen.getByText('Inconnu')).toBeInTheDocument();
    // Pas de span underline appliqué
    expect(screen.queryByText('Inconnu').closest('.cursor-help')).toBeNull();
  });

  it('applique soulignement pointillé sur terme reconnu (id explicite)', () => {
    const { container } = render(<Term id="bfr">BFR</Term>);
    expect(container.querySelector('.cursor-help')).toBeInTheDocument();
    expect(container.querySelector('.border-dotted')).toBeInTheDocument();
  });

  it('reconnaît un terme via le texte enfant (pas d\'id)', () => {
    const { container } = render(<Term>BFR</Term>);
    expect(container.querySelector('.cursor-help')).toBeInTheDocument();
  });

  it('reconnaît "ETP" via le polyfill (pas dans glossaire)', () => {
    const { container } = render(<Term>ETP</Term>);
    expect(container.querySelector('.cursor-help')).toBeInTheDocument();
  });

  it('reconnaît la casse insensible (BFR / bfr / Bfr)', () => {
    const { container, rerender } = render(<Term>BFR</Term>);
    expect(container.querySelector('.cursor-help')).toBeInTheDocument();
    rerender(<Term>bfr</Term>);
    expect(container.querySelector('.cursor-help')).toBeInTheDocument();
  });

  it('reconnaît "Ségur" avec accent (raccourci shortcut)', () => {
    const { container } = render(<Term>Ségur</Term>);
    expect(container.querySelector('.cursor-help')).toBeInTheDocument();
  });

  it('underline=false désactive le soulignement', () => {
    const { container } = render(<Term id="bfr" underline={false}>BFR</Term>);
    expect(container.querySelector('.border-dotted')).toBeNull();
  });

  it('affiche tooltip riche au survol (titre + définition + levier)', () => {
    render(<Term id="bfr">BFR</Term>);
    fireEvent.mouseEnter(screen.getByText('BFR').parentElement);
    act(() => { vi.advanceTimersByTime(400); });
    const tip = screen.getByRole('tooltip');
    expect(tip).toHaveTextContent(/BFR/i);
    expect(tip).toHaveTextContent(/Trésorerie nécessaire/i);
    expect(tip).toHaveTextContent(/💡 Levier/i);
  });
});

describe('<AutoTerms /> — détection automatique de termes', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('passthrough si children n\'est pas une string', () => {
    render(<AutoTerms><div>Block</div></AutoTerms>);
    expect(screen.getByText('Block')).toBeInTheDocument();
  });

  it('wrap les termes détectés dans une phrase', () => {
    const { container } = render(
      <AutoTerms>Le BFR augmente avec les retards OPCO.</AutoTerms>
    );
    // BFR + OPCO doivent être détectés
    const cursorElems = container.querySelectorAll('.cursor-help');
    expect(cursorElems.length).toBeGreaterThanOrEqual(2);
  });

  it('ne wrap pas un mot non reconnu', () => {
    const { container } = render(<AutoTerms>Du texte sans terme connu.</AutoTerms>);
    expect(container.querySelectorAll('.cursor-help').length).toBe(0);
  });

  it('respecte la frontière de mots (ne wrap pas dans un sous-mot)', () => {
    const { container } = render(<AutoTerms>BFRX et OPCOY ne sont pas des termes.</AutoTerms>);
    expect(container.querySelectorAll('.cursor-help').length).toBe(0);
  });

  it('détecte "ETP" et "Ségur" dans une phrase', () => {
    const { container } = render(
      <AutoTerms>Cet ETP est éligible au Ségur 2026.</AutoTerms>
    );
    expect(container.querySelectorAll('.cursor-help').length).toBeGreaterThanOrEqual(2);
  });
});
