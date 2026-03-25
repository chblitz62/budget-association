/**
 * HelpIcon — icône "?" au survol, bulle d'aide colorée.
 * Props :
 *   content  : string | JSX   — contenu de l'infobulle
 *   type     : 'info' | 'warning' | 'default'  — code couleur
 *   position : 'top'|'bottom'|'left'|'right'   — placement bulle
 *   wide     : bool — bulle plus large (w-96 vs w-72)
 *   darkMode : bool (non utilisé — bulle toujours foncée pour le contraste)
 *
 * Palette unifiée :
 *   info    → icône bleue   · bulle fond #0a0a0f · bordure bleue  · badge "💡 Calcul"
 *   warning → icône orange  · bulle fond #0a0a0f · bordure orange · badge "⚠️ Impact"
 *   default → icône grise   · bulle fond #0a0a0f · bordure grise
 */
import React, { useState, useRef } from 'react';
import { HelpCircle } from 'lucide-react';
import { useTooltips } from '../../utils/TooltipContext';

const TYPE_STYLES = {
  info: {
    icon: 'text-blue-400 hover:text-blue-300',
    bubble: 'border-blue-500/40',
    badge: 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
    badgeText: '💡 Calcul',
    dot: 'bg-blue-500',
  },
  warning: {
    icon: 'text-orange-400 hover:text-orange-300',
    bubble: 'border-orange-500/40',
    badge: 'bg-orange-500/15 text-orange-300 border border-orange-500/30',
    badgeText: '⚠️ Impact financier',
    dot: 'bg-orange-500',
  },
  default: {
    icon: 'text-slate-400 hover:text-slate-200',
    bubble: 'border-slate-600/50',
    badge: null,
    badgeText: null,
    dot: null,
  },
};

export default function HelpIcon({ content, text, type = 'default', position = 'top', wide = false, darkMode }) {
  const [visible, setVisible] = useState(false);
  const timer = useRef(null);
  const tooltipsEnabled = useTooltips();

  const show = () => { clearTimeout(timer.current); setVisible(true); };
  const hide = () => { timer.current = setTimeout(() => setVisible(false), 150); };

  const s = TYPE_STYLES[type] || TYPE_STYLES.default;
  const widthClass = wide ? 'w-96' : 'w-72';
  const body = content ?? text ?? null;

  const posClass = {
    top:    'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left:   'right-full top-1/2 -translate-y-1/2 mr-2',
    right:  'left-full top-1/2 -translate-y-1/2 ml-2',
  }[position] ?? 'bottom-full left-1/2 -translate-x-1/2 mb-2';

  if (!body || !tooltipsEnabled) return null;

  return (
    <span
      className="relative inline-flex items-center flex-shrink-0"
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      <HelpCircle
        size={14}
        className={`cursor-help transition-colors ${s.icon}`}
      />

      {visible && (
        <span
          className={`
            absolute z-[9999] ${posClass} ${widthClass}
            rounded-xl border shadow-2xl
            bg-gray-950 text-white
            ${s.bubble}
          `}
          style={{ fontFamily: 'inherit' }}
          onMouseEnter={show}
          onMouseLeave={hide}
        >
          {s.dot && (
            <span className={`block h-0.5 w-full rounded-t-xl ${s.dot} opacity-70`} />
          )}
          <span className="block px-3.5 py-3">
            {s.badge && (
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mb-2 ${s.badge}`}>
                {s.badgeText}
              </span>
            )}
            <span className="block text-xs leading-relaxed font-medium text-white/90">{body}</span>
          </span>
        </span>
      )}
    </span>
  );
}
