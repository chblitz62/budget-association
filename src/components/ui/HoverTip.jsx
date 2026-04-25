import React, { useEffect, useRef, useState, cloneElement } from 'react';
import { createPortal } from 'react-dom';
import { surface } from '../../styles/tokens';

/**
 * <HoverTip /> — Tooltip pédagogique riche, position-aware, sans icône intrusive.
 *
 * Différence avec `<Tooltip>` historique (qui affiche une HelpCircle à côté) :
 *   - Pas d'icône injectée → le déclencheur reste pur
 *   - Format multi-ligne avec hiérarchie (titre + description + interprétation)
 *   - Position calculée auto selon viewport (top/bottom/left/right)
 *   - Animation fade-in
 *   - Délai d'ouverture configurable (default 300ms)
 *   - Portal sur document.body (z-index sans souci)
 *
 * Usage simple :
 *   <HoverTip content="Définition courte" darkMode={dm}>
 *     <span>BFR</span>
 *   </HoverTip>
 *
 * Usage riche (pédagogique) :
 *   <HoverTip
 *     darkMode={dm}
 *     title="Résultat prévisionnel"
 *     description="Différence entre les recettes et les charges projetées sur l'année."
 *     interpretation="Excellent — l'association dégage un excédent."
 *     level="success"
 *   >
 *     <KpiHero ... />
 *   </HoverTip>
 */
const ACCENT = {
  success: 'border-l-4 border-l-emerald-500',
  warning: 'border-l-4 border-l-amber-500',
  danger:  'border-l-4 border-l-rose-500',
  info:    'border-l-4 border-l-indigo-500',
  neutral: 'border-l-4 border-l-slate-400',
};

export default function HoverTip({
  children,
  content,
  title,
  description,
  interpretation,
  level = 'neutral',
  placement = 'auto',
  delay = 300,
  darkMode = false,
  className = '',
  maxWidth = 280,
  disabled = false,
}) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const tipRef = useRef(null);
  const timeoutRef = useRef(null);

  const compute = () => {
    const trig = triggerRef.current;
    const tip = tipRef.current;
    if (!trig || !tip) return;
    const tr = trig.getBoundingClientRect();
    const tt = tip.getBoundingClientRect();
    const margin = 10;
    let place = placement;
    if (place === 'auto') {
      const above = tr.top;
      const below = window.innerHeight - tr.bottom;
      place = above >= tt.height + margin ? 'top' : 'bottom';
    }
    let top, left;
    if (place === 'top') {
      top = tr.top - tt.height - margin;
      left = tr.left + tr.width / 2 - tt.width / 2;
    } else if (place === 'bottom') {
      top = tr.bottom + margin;
      left = tr.left + tr.width / 2 - tt.width / 2;
    } else if (place === 'left') {
      top = tr.top + tr.height / 2 - tt.height / 2;
      left = tr.left - tt.width - margin;
    } else {
      top = tr.top + tr.height / 2 - tt.height / 2;
      left = tr.right + margin;
    }
    left = Math.max(8, Math.min(left, window.innerWidth - tt.width - 8));
    top = Math.max(8, top);
    setPos({ top, left });
  };

  useEffect(() => {
    if (!show) return;
    compute();
    const handle = () => compute();
    window.addEventListener('scroll', handle, true);
    window.addEventListener('resize', handle);
    return () => {
      window.removeEventListener('scroll', handle, true);
      window.removeEventListener('resize', handle);
    };
  }, [show]);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const handleEnter = () => {
    if (disabled) return;
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setShow(true), delay);
  };
  const handleLeave = () => {
    clearTimeout(timeoutRef.current);
    setShow(false);
  };

  const dm = darkMode;
  const triggerProps = { onMouseEnter: handleEnter, onMouseLeave: handleLeave, onFocus: handleEnter, onBlur: handleLeave };

  // Wrap dans un span (forwardRef nécessaire sinon).
  // On évite cloneElement pour ne pas casser le ref-forwarding des enfants composites.
  const wrappedTrigger = (
    <span ref={triggerRef} {...triggerProps} className="inline-flex items-center">
      {children}
    </span>
  );

  const isRich = title || description || interpretation;

  return (
    <>
      {wrappedTrigger}
      {show && !disabled && createPortal(
        <div
          ref={tipRef}
          role="tooltip"
          style={{ top: pos.top, left: pos.left, maxWidth, position: 'fixed' }}
          className={`z-[110] pointer-events-none animate-fade-in
            ${surface.elevated(dm)} ${isRich ? ACCENT[level] : ''} px-3 py-2 ${className}`}
        >
          {isRich ? (
            <>
              {title && <div className={`text-sm font-bold mb-1 ${dm ? 'text-zinc-100' : 'text-slate-900'}`}>{title}</div>}
              {description && <div className={`text-xs leading-relaxed ${dm ? 'text-zinc-300' : 'text-slate-600'}`}>{description}</div>}
              {interpretation && (
                <div className={`text-xs mt-2 pt-2 border-t font-medium ${dm ? 'text-zinc-200 border-zinc-800' : 'text-slate-700 border-slate-200'}`}>
                  {interpretation}
                </div>
              )}
            </>
          ) : (
            <div className={`text-xs leading-relaxed ${dm ? 'text-zinc-200' : 'text-slate-700'}`}>{content}</div>
          )}
        </div>,
        document.body
      )}
    </>
  );
}
