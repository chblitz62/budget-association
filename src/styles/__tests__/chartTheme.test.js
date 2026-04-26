import { describe, it, expect } from 'vitest';
import {
  axisProps, gridProps, tooltipProps, legendProps,
  lineColors, paletteSequence, lineStroke, areaStroke, barStroke,
  compactMargin, standardMargin,
} from '../chartTheme';

describe('chartTheme — Soft SaaS Recharts', () => {
  it('axisProps adapte le stroke selon darkMode', () => {
    const light = axisProps(false);
    const dark = axisProps(true);
    expect(light.stroke).not.toBe(dark.stroke);
    expect(light.tickLine).toBe(false);
    expect(light.axisLine).toBe(false);
    expect(light.fontSize).toBe(11);
  });

  it('gridProps utilise lignes horizontales seulement', () => {
    const g = gridProps(false);
    expect(g.vertical).toBe(false);
    expect(g.strokeDasharray).toBe('3 3');
  });

  it('tooltipProps a un border radius arrondi (12px)', () => {
    const t = tooltipProps(false);
    expect(t.contentStyle.borderRadius).toBe(12);
    expect(t.contentStyle.fontSize).toBe(12);
  });

  it('tooltipProps adapte les couleurs selon darkMode', () => {
    const light = tooltipProps(false);
    const dark = tooltipProps(true);
    expect(light.contentStyle.backgroundColor).not.toBe(dark.contentStyle.backgroundColor);
  });

  it('legendProps utilise iconType=circle (Soft SaaS)', () => {
    const l = legendProps(false);
    expect(l.iconType).toBe('circle');
    expect(l.iconSize).toBe(8);
  });

  it('lineColors expose les couleurs sémantiques', () => {
    expect(lineColors.emerald).toMatch(/^#[0-9a-f]{6}$/i);
    expect(lineColors.rose).toMatch(/^#[0-9a-f]{6}$/i);
    expect(lineColors.indigo).toMatch(/^#[0-9a-f]{6}$/i);
    expect(lineColors.violet).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('paletteSequence contient au moins 6 couleurs distinctes', () => {
    expect(paletteSequence.length).toBeGreaterThanOrEqual(6);
    const unique = new Set(paletteSequence);
    expect(unique.size).toBe(paletteSequence.length);
  });

  it('lineStroke configure thin (1.5) sans dots', () => {
    expect(lineStroke.strokeWidth).toBe(1.5);
    expect(lineStroke.dot).toBe(false);
  });

  it('barStroke applique radius arrondi sur le top', () => {
    expect(barStroke.radius).toEqual([6, 6, 0, 0]);
  });

  it('compactMargin et standardMargin sont des objets de marges Recharts', () => {
    expect(compactMargin).toHaveProperty('top');
    expect(compactMargin).toHaveProperty('left');
    expect(standardMargin).toHaveProperty('top');
  });
});
