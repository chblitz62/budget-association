/**
 * Tooltip — enveloppe n'importe quel élément avec une infobulle stylisée
 * Usage : <Tooltip content="Texte" darkMode={dm}><span>label</span></Tooltip>
 * Props :
 *  content  : string | JSX
 *  darkMode : bool
 *  position : 'top'|'bottom'|'left'|'right'  (défaut 'top')
 *  wide     : bool
 */
import React from 'react';

export default function Tooltip({ content, darkMode, position = 'top', wide = false, children }) {
  if (!content) return children;

  const posClass = {
    top:    'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left:   'right-full top-1/2 -translate-y-1/2 mr-2',
    right:  'left-full top-1/2 -translate-y-1/2 ml-2',
  }[position] || 'bottom-full left-1/2 -translate-x-1/2 mb-2';

  const widthClass = wide ? 'w-96' : 'w-72';

  return (
    <span className="relative inline-flex items-center group">
      {children}
      <span
        className={`
          pointer-events-none absolute z-[9999] ${posClass} ${widthClass}
          rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-2xl
          opacity-0 invisible group-hover:opacity-100 group-hover:visible
          transition-all duration-200 delay-0 group-hover:delay-500
          ${darkMode
            ? 'bg-gray-800 text-gray-100 border border-gray-600'
            : 'bg-slate-900 text-slate-50 border border-slate-700'}
        `}
      >
        {content}
      </span>
    </span>
  );
}
