// Design tokens — Soft SaaS 2026
// Source unique de vérité pour la couche présentation modernisée (Phase 8).
//
// Usage : import { surface, text, button } from '@/styles/tokens';
//         <div className={surface.card(darkMode)}>...</div>
//
// Pas de Tailwind dynamique (bg-${color}) — toutes les classes sont explicites.

// ── Surfaces ──────────────────────────────────────────────────────────
export const surface = {
  // Canvas principal de l'app
  canvas: (dark) => dark
    ? 'bg-zinc-950'
    : 'bg-gradient-to-br from-slate-50 via-white to-indigo-50/30',
  // Card "verre" — surface principale de contenu
  card: (dark) => dark
    ? 'bg-zinc-900/70 backdrop-blur-xl border border-zinc-800/60 rounded-2xl shadow-sm shadow-black/20'
    : 'bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-sm shadow-slate-900/[0.02]',
  // Card élevée (modal, popover)
  elevated: (dark) => dark
    ? 'bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl shadow-black/40'
    : 'bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-900/10',
  // Header floating
  topbar: (dark) => dark
    ? 'bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/60'
    : 'bg-white/80 backdrop-blur-xl border-b border-slate-200/60',
  // Sidebar floating
  sidebar: (dark) => dark
    ? 'bg-zinc-950/90 backdrop-blur-xl border-r border-zinc-800/60'
    : 'bg-white/90 backdrop-blur-xl border-r border-slate-200/60',
  // Subdued — bg de section secondaire
  muted: (dark) => dark ? 'bg-zinc-800/40' : 'bg-slate-50',
  // Hover row
  hoverRow: (dark) => dark ? 'hover:bg-zinc-800/40' : 'hover:bg-slate-50',
};

// ── Texte ─────────────────────────────────────────────────────────────
export const text = {
  hero: (dark) => `text-3xl md:text-4xl font-bold tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`,
  title: (dark) => `text-lg font-bold leading-tight ${dark ? 'text-white' : 'text-slate-900'}`,
  body: (dark) => `text-sm font-medium leading-relaxed ${dark ? 'text-zinc-300' : 'text-slate-700'}`,
  muted: (dark) => `text-xs ${dark ? 'text-zinc-500' : 'text-slate-500'}`,
  label: (dark) => `text-[11px] font-semibold uppercase tracking-wider ${dark ? 'text-zinc-500' : 'text-slate-500'}`,
  mono: 'tabular-nums font-mono',
};

// ── Boutons ───────────────────────────────────────────────────────────
const baseBtn = 'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed';

export const button = {
  primary: (dark) =>
    `${baseBtn} bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:translate-y-0 px-4 py-2 text-sm`,
  secondary: (dark) =>
    `${baseBtn} px-4 py-2 text-sm ${dark
      ? 'bg-zinc-800/60 border border-zinc-700 text-zinc-200 hover:bg-zinc-800 hover:border-zinc-600'
      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
    }`,
  ghost: (dark) =>
    `${baseBtn} px-3 py-1.5 text-sm ${dark
      ? 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`,
  tertiary: (dark) =>
    `inline-flex items-center gap-1 text-sm font-medium transition-colors ${dark
      ? 'text-indigo-400 hover:text-indigo-300 hover:underline'
      : 'text-indigo-600 hover:text-indigo-700 hover:underline'
    }`,
  destructive: (dark) =>
    `${baseBtn} px-4 py-2 text-sm ${dark
      ? 'bg-rose-950/40 border border-rose-800 text-rose-200 hover:bg-rose-950/60'
      : 'bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100'
    }`,
  iconOnly: (dark) =>
    `inline-flex items-center justify-center rounded-xl p-2 transition-all ${dark
      ? 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
    }`,
};

// ── Statuts (5 teintes — réduit de 8 à 5) ─────────────────────────────
export const status = {
  success: (dark) => ({
    bg: dark ? 'bg-emerald-950/40 border-emerald-800/60' : 'bg-emerald-50 border-emerald-200',
    text: dark ? 'text-emerald-300' : 'text-emerald-700',
    accent: 'text-emerald-500',
  }),
  warning: (dark) => ({
    bg: dark ? 'bg-amber-950/40 border-amber-800/60' : 'bg-amber-50 border-amber-200',
    text: dark ? 'text-amber-300' : 'text-amber-700',
    accent: 'text-amber-500',
  }),
  danger: (dark) => ({
    bg: dark ? 'bg-rose-950/40 border-rose-800/60' : 'bg-rose-50 border-rose-200',
    text: dark ? 'text-rose-300' : 'text-rose-700',
    accent: 'text-rose-500',
  }),
  info: (dark) => ({
    bg: dark ? 'bg-indigo-950/40 border-indigo-800/60' : 'bg-indigo-50 border-indigo-200',
    text: dark ? 'text-indigo-300' : 'text-indigo-700',
    accent: 'text-indigo-500',
  }),
  neutral: (dark) => ({
    bg: dark ? 'bg-zinc-800/40 border-zinc-700' : 'bg-slate-100 border-slate-200',
    text: dark ? 'text-zinc-300' : 'text-slate-700',
    accent: dark ? 'text-zinc-400' : 'text-slate-500',
  }),
};

// ── Espacement (grille 8px) ──────────────────────────────────────────
export const spacing = {
  // Pour gap/space-y entre cards
  sectionGap: 'space-y-6', // 24px
  // Padding interne card
  cardPad: 'p-6',          // 24px
  // Padding compact card
  cardPadCompact: 'p-4',   // 16px
  // Gap éléments dans une card
  innerGap: 'gap-4',       // 16px
};

// ── Lucide standardisé ───────────────────────────────────────────────
// Toujours strokeWidth={1.5} (thin) pour cohérence Soft SaaS
export const iconProps = {
  thin: { strokeWidth: 1.5 },
  inline: { size: 14, strokeWidth: 1.5 },
  button: { size: 16, strokeWidth: 1.5 },
  title: { size: 20, strokeWidth: 1.5 },
};
