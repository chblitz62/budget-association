/**
 * Tooltip (InfoTooltip) — affichage au survol (hover), style unifié avec HelpIcon.
 * Usage : <Tooltip content="Texte" darkMode={dm}><span>label</span></Tooltip>
 * Props :
 *  content  : string | JSX
 *  darkMode : bool (ignoré — bulle toujours foncée pour le contraste)
 *  position : 'top'|'bottom'|'left'|'right'  (défaut 'top')
 *  wide     : bool
 *  children : déclencheur (label, icône…)
 */
import React, { useState, useRef } from 'react';
import { HelpCircle } from 'lucide-react';
import { useTooltips } from '../../utils/TooltipContext';

export default function Tooltip({ content, darkMode, position = 'top', wide = false, children }) {
  const [visible, setVisible] = useState(false);
  const timer = useRef(null);
  const tooltipsEnabled = useTooltips();

  const show = () => { clearTimeout(timer.current); setVisible(true); };
  const hide = () => { timer.current = setTimeout(() => setVisible(false), 150); };

  if (!content) return children ?? null;
  // Si les infobulles sont désactivées, on retourne juste les enfants sans l'icône
  if (!tooltipsEnabled) return <>{children}</>;

  const posClass = {
    top:    'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left:   'right-full top-1/2 -translate-y-1/2 mr-2',
    right:  'left-full top-1/2 -translate-y-1/2 ml-2',
  }[position] || 'bottom-full left-1/2 -translate-x-1/2 mb-2';

  const widthClass = wide ? 'w-96' : 'w-72';

  return (
    <span
      className="relative inline-flex items-center gap-1"
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      {children}
      <HelpCircle
        size={13}
        className="flex-shrink-0 cursor-help text-blue-400 hover:text-blue-300 transition-colors"
      />
      {visible && (
        <span
          className={`
            absolute z-[9999] ${posClass} ${widthClass}
            rounded-xl border border-blue-500/40 shadow-2xl
            bg-gray-950
          `}
          style={{ fontFamily: 'inherit' }}
          onMouseEnter={show}
          onMouseLeave={hide}
        >
          <span className="block h-0.5 w-full rounded-t-xl bg-blue-500 opacity-70" />
          <span className="block px-3.5 py-3">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mb-2 bg-blue-500/15 text-blue-300 border border-blue-500/30">
              💡 Calcul
            </span>
            <span className="block text-xs leading-relaxed font-medium text-white/90">{content}</span>
          </span>
        </span>
      )}
    </span>
  );
}
