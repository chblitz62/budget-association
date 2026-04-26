// chartTheme.js — Thème Soft SaaS pour Recharts (Phase 8 S4.2)
//
// Source unique de vérité pour les graphiques de l'app : axes minimalistes,
// strokeWidth thin, gradients soft, tooltips arrondis, palette indigo/violet/emerald/rose.
//
// Usage :
//   import { axisProps, gridProps, tooltipProps, lineColors, gradientDefs } from '@/styles/chartTheme';
//
//   <LineChart data={...}>
//     <CartesianGrid {...gridProps(dm)} />
//     <XAxis dataKey="nom" {...axisProps(dm)} />
//     <YAxis {...axisProps(dm)} />
//     <Tooltip {...tooltipProps(dm)} />
//     <defs>{gradientDefs.indigo}</defs>
//     <Line dataKey="solde" stroke={lineColors.indigo} fill="url(#grIndigo)" strokeWidth={1.5} />
//   </LineChart>

import React from 'react';

// ── Couleurs de courbes (cohérent avec tokens.status) ──────────────────
export const lineColors = {
  emerald: '#10b981',
  rose:    '#f43f5e',
  indigo:  '#6366f1',
  violet:  '#8b5cf6',
  amber:   '#f59e0b',
  cyan:    '#06b6d4',
  slate:   '#64748b',
  zinc:    '#71717a',
};

// ── Axes minimalistes ──────────────────────────────────────────────────
export const axisProps = (dark) => ({
  stroke: dark ? '#71717a' : '#94a3b8',     // zinc-500 / slate-400
  fontSize: 11,
  tickLine: false,
  axisLine: false,
  tickMargin: 6,
});

// ── Grid sobre (lignes horizontales seulement) ─────────────────────────
export const gridProps = (dark) => ({
  strokeDasharray: '3 3',
  stroke: dark ? '#27272a' : '#e2e8f0',     // zinc-800 / slate-200
  vertical: false,
});

// ── Tooltip arrondi card ───────────────────────────────────────────────
export const tooltipProps = (dark) => ({
  contentStyle: {
    backgroundColor: dark ? '#18181b' : '#ffffff',  // zinc-900 / white
    border: `1px solid ${dark ? '#3f3f46' : '#e2e8f0'}`,
    borderRadius: 12,
    fontSize: 12,
    boxShadow: dark ? '0 10px 25px -5px rgba(0,0,0,0.5)' : '0 10px 25px -5px rgba(15,23,42,0.1)',
    padding: '8px 12px',
  },
  labelStyle: {
    fontWeight: 700,
    color: dark ? '#e4e4e7' : '#0f172a',
    marginBottom: 4,
  },
  itemStyle: {
    color: dark ? '#a1a1aa' : '#475569',
    padding: '2px 0',
  },
  cursor: { stroke: dark ? '#3f3f46' : '#cbd5e1', strokeWidth: 1, strokeDasharray: '3 3' },
});

// ── Légende sobre ──────────────────────────────────────────────────────
export const legendProps = (dark) => ({
  iconType: 'circle',
  iconSize: 8,
  wrapperStyle: { fontSize: 11, color: dark ? '#a1a1aa' : '#64748b', paddingTop: 8 },
});

// ── Strokes uniformisés (Soft SaaS thin) ───────────────────────────────
export const lineStroke = { strokeWidth: 1.5, dot: false, activeDot: { r: 4, strokeWidth: 1.5 } };
export const areaStroke = { strokeWidth: 1.5, fillOpacity: 1 };
export const barStroke  = { radius: [6, 6, 0, 0] };

// ── Gradients prêts à l'emploi (à insérer dans <defs>) ─────────────────
// Usage : <defs>{gradientDefs.emerald()}</defs>
//         <Area fill="url(#grEmerald)" ... />
export const gradientDefs = {
  emerald: () => (
    <linearGradient id="grEmerald" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
    </linearGradient>
  ),
  rose: () => (
    <linearGradient id="grRose" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.18} />
      <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
    </linearGradient>
  ),
  indigo: () => (
    <linearGradient id="grIndigo" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.25} />
      <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
    </linearGradient>
  ),
  violet: () => (
    <linearGradient id="grViolet" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.25} />
      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
    </linearGradient>
  ),
  amber: () => (
    <linearGradient id="grAmber" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.22} />
      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
    </linearGradient>
  ),
};

// ── Helper : palette ordonnée pour séries multiples ────────────────────
// Usage : <Bar fill={paletteSequence[i]} />
export const paletteSequence = [
  lineColors.indigo,
  lineColors.emerald,
  lineColors.violet,
  lineColors.amber,
  lineColors.rose,
  lineColors.cyan,
];

// ── Margins par défaut (compact) ───────────────────────────────────────
export const compactMargin = { top: 8, right: 8, bottom: 0, left: -10 };
export const standardMargin = { top: 12, right: 12, bottom: 0, left: 0 };
