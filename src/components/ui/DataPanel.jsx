import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { surface, text, button, status, iconProps } from '../../styles/tokens';

/**
 * <DataPanel /> — Template Soft SaaS pour panel de données novice-friendly.
 *
 * Slots structurés :
 *   icon   : icône Lucide (size 20, strokeWidth 1.5 idéalement)
 *   title  : titre court (max 50 chars)
 *   subtitle : explication 1 ligne pour novice (qu'est-ce que c'est ?)
 *   help   : tooltip pédagogique étendu (HelpIcon survol)
 *   level  : 'success' | 'warning' | 'danger' | 'info' | 'neutral' (couleur d'accent)
 *   collapsible : booléen — permet de plier la card
 *   defaultCollapsed : ouvert/fermé par défaut
 *   actions : éléments à droite du header (boutons CSV, settings…)
 *   children : contenu principal
 *   summary  : élément(s) toujours visibles (KPIs hero, statut), même si collapsé
 *   emptyState : élément à afficher si children est vide (cf. <EmptyState />)
 *
 * Convention visuelle :
 *   - Surface "verre" (backdrop-blur, border subtile, rounded-2xl)
 *   - Padding 24px
 *   - Header : icon dans pastille colorée (level) + title + subtitle
 *   - Pas plus de 2 actions à droite (sinon dropdown)
 *   - Tout terme jargonneux → <Glossary term="BFR" /> (à venir Sprint S6)
 */
export default function DataPanel({
  darkMode = false,
  icon: Icon,
  title,
  subtitle,
  help,
  level = 'neutral',
  collapsible = false,
  defaultCollapsed = false,
  actions,
  summary,
  children,
  emptyState,
  className = '',
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const dm = darkMode;
  const tone = status[level](dm);

  const isEmpty = !children || (Array.isArray(children) && children.filter(Boolean).length === 0);

  return (
    <section className={`${surface.card(dm)} p-6 ${className}`}>
      {/* HEADER */}
      <header className="flex items-start justify-between gap-4 mb-4 flex-wrap">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {Icon && (
            <div className={`shrink-0 p-2.5 rounded-xl border ${tone.bg}`}>
              <Icon size={20} strokeWidth={1.5} className={tone.accent} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className={text.title(dm)}>{title}</h2>
              {help && (
                <button
                  type="button"
                  className={`${button.iconOnly(dm)} !p-1`}
                  title={help}
                  aria-label="Aide"
                >
                  <HelpCircle size={14} strokeWidth={1.5} />
                </button>
              )}
            </div>
            {subtitle && (
              <p className={`${text.muted(dm)} mt-1`}>{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {actions}
          {collapsible && (
            <button
              type="button"
              onClick={() => setCollapsed(v => !v)}
              className={button.iconOnly(dm)}
              aria-label={collapsed ? 'Déplier' : 'Replier'}
            >
              {collapsed ? <ChevronDown {...iconProps.button} /> : <ChevronUp {...iconProps.button} />}
            </button>
          )}
        </div>
      </header>

      {/* SUMMARY toujours visible (KPIs hero, statut, etc.) */}
      {summary && <div className="mb-4">{summary}</div>}

      {/* CONTENT collapsible */}
      {!collapsed && (
        <div className="animate-in fade-in duration-300">
          {isEmpty ? (emptyState ?? null) : children}
        </div>
      )}
    </section>
  );
}

/**
 * <PanelStat /> — KPI hero pour zone summary.
 * Typographie large, label discret, optionnellement comparaison N-1 / variation.
 */
export const PanelStat = ({
  darkMode = false,
  label,
  value,
  unit,
  delta,        // string ou nombre — variation
  deltaLabel,   // ex : 'vs N-1', 'vs prévu'
  level = 'neutral',
  hint,         // info-bulle pédagogique pour novice
}) => {
  const dm = darkMode;
  const tone = status[level](dm);
  const deltaPositive = (typeof delta === 'number' ? delta >= 0 : String(delta || '').startsWith('+'));
  return (
    <div className={`${surface.muted(dm)} rounded-2xl p-5`}>
      <div className="flex items-center gap-1.5 mb-2">
        <span className={text.label(dm)}>{label}</span>
        {hint && (
          <span title={hint} className={dm ? 'text-zinc-600' : 'text-slate-400'}>
            <Info size={11} strokeWidth={1.5} />
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className={`${text.hero(dm)} ${tone.accent}`}>{value}</span>
        {unit && <span className={`${text.muted(dm)} text-base`}>{unit}</span>}
      </div>
      {delta != null && (
        <p className={`mt-1 text-xs font-medium ${deltaPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
          {deltaPositive ? '↗' : '↘'} {delta} {deltaLabel && <span className={dm ? 'text-zinc-500' : 'text-slate-400'}>{deltaLabel}</span>}
        </p>
      )}
    </div>
  );
};

/**
 * <PanelStatusBadge /> — Pour les vues novice "Tout va bien / Action requise / Attention".
 */
export const PanelStatusBadge = ({ darkMode = false, level = 'success', children }) => {
  const dm = darkMode;
  const tone = status[level](dm);
  const Icon = level === 'success' ? CheckCircle2 : level === 'danger' ? AlertTriangle : Info;
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${tone.bg} ${tone.text}`}>
      <Icon size={14} strokeWidth={1.5} />
      {children}
    </div>
  );
};

/**
 * <EmptyState /> — État vide novice-friendly avec call-to-action.
 */
export const EmptyState = ({
  darkMode = false,
  icon: Icon,
  title = 'Aucune donnée pour l\'instant',
  description,
  action,
}) => {
  const dm = darkMode;
  return (
    <div className={`${surface.muted(dm)} rounded-2xl py-12 px-6 text-center`}>
      {Icon && (
        <div className={`inline-flex p-3 rounded-2xl ${dm ? 'bg-zinc-800' : 'bg-white'} mb-3`}>
          <Icon size={24} strokeWidth={1.5} className={dm ? 'text-zinc-500' : 'text-slate-400'} />
        </div>
      )}
      <h3 className={`text-base font-bold mb-1 ${dm ? 'text-zinc-200' : 'text-slate-800'}`}>{title}</h3>
      {description && <p className={`${text.muted(dm)} max-w-md mx-auto mb-4`}>{description}</p>}
      {action}
    </div>
  );
};
