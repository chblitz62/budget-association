import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { surface, text, button } from '../../styles/tokens';
import Button from './Button';

/**
 * <Modal /> — Modal Soft SaaS animée
 *
 * - Backdrop : zinc-950/40 + backdrop-blur-sm + animate-fade-in
 * - Panel    : zoom-in 200ms (cubic-bezier "easeOutExpo")
 * - Échap pour fermer (sauf si dismissOnEsc=false)
 * - Click backdrop pour fermer (sauf si dismissOnBackdrop=false)
 * - Focus trap : focus initial sur premier élément focusable
 * - Restitution focus à l'élément déclencheur après fermeture
 * - Body scroll lock pendant l'ouverture
 *
 * Sous-composants : <Modal.Header>, <Modal.Body>, <Modal.Footer>
 *
 * size : 'sm' (max-w-md) | 'md' (max-w-lg) | 'lg' (max-w-2xl) | 'xl' (max-w-4xl) | 'full'
 */
const sizeMap = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[95vw] max-h-[95vh]',
};

export default function Modal({
  open,
  onClose,
  darkMode = false,
  size = 'md',
  dismissOnEsc = true,
  dismissOnBackdrop = true,
  showCloseButton = true,
  initialFocusRef,
  className = '',
  children,
}) {
  const panelRef = useRef(null);
  const triggerRef = useRef(null); // mémorise l'élément actif au moment de l'ouverture

  // Mémorise l'élément actif et focus initial
  useEffect(() => {
    if (!open) return;
    triggerRef.current = document.activeElement;
    // Body scroll lock
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus initial : ref custom > 1er focusable > panel
    setTimeout(() => {
      const target = initialFocusRef?.current
        || panelRef.current?.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
        || panelRef.current;
      target?.focus?.();
    }, 50);

    return () => {
      document.body.style.overflow = prevOverflow;
      // Restaure focus au déclencheur
      try { triggerRef.current?.focus?.(); } catch { /* noop */ }
    };
  }, [open, initialFocusRef]);

  // Échap pour fermer + focus trap basique
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && dismissOnEsc) {
      e.stopPropagation();
      onClose?.();
      return;
    }
    if (e.key === 'Tab' && panelRef.current) {
      // Focus trap minimaliste
      const focusables = panelRef.current.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, [dismissOnEsc, onClose]);

  if (!open) return null;

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget && dismissOnBackdrop) onClose?.();
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onMouseDown={handleBackdrop}
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm animate-fade-in"
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`${surface.elevated(darkMode)} w-full ${sizeMap[size]} max-h-[90vh] flex flex-col outline-none animate-zoom-in ${className}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {showCloseButton && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className={`absolute top-3 right-3 ${button.iconOnly(darkMode)}`}
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        )}
        {children}
      </div>
    </div>,
    document.body
  );
}

Modal.Header = ({ darkMode = false, title, subtitle, icon: Icon, className = '' }) => (
  <header className={`px-6 pt-6 pb-4 border-b ${darkMode ? 'border-zinc-800/60' : 'border-slate-200/60'} ${className}`}>
    <div className="flex items-start gap-3">
      {Icon && (
        <div className={`shrink-0 p-2 rounded-xl ${darkMode ? 'bg-indigo-950/40 text-indigo-300' : 'bg-indigo-50 text-indigo-600'}`}>
          <Icon size={20} strokeWidth={1.5} />
        </div>
      )}
      <div className="min-w-0 flex-1 pr-8">
        {title && <h2 className={text.title(darkMode)}>{title}</h2>}
        {subtitle && <p className={`${text.muted(darkMode)} mt-1`}>{subtitle}</p>}
      </div>
    </div>
  </header>
);

Modal.Body = ({ className = '', children }) => (
  <div className={`px-6 py-5 overflow-y-auto flex-1 ${className}`}>{children}</div>
);

Modal.Footer = ({ darkMode = false, className = '', children }) => (
  <footer className={`px-6 py-4 border-t flex items-center justify-end gap-2 ${darkMode ? 'border-zinc-800/60 bg-zinc-900/40' : 'border-slate-200/60 bg-slate-50/50'} rounded-b-2xl ${className}`}>
    {children}
  </footer>
);

/**
 * Helper : Modal de confirmation prête à l'emploi.
 *
 * <ConfirmModal
 *   open={...} onConfirm={...} onCancel={...}
 *   title="Supprimer ce service ?"
 *   description="Cette action est irréversible."
 *   confirmLabel="Supprimer" variant="destructive"
 * />
 */
export const ConfirmModal = ({
  open, onConfirm, onCancel,
  title = 'Confirmer',
  description,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'primary',
  darkMode = false,
  loading = false,
}) => (
  <Modal open={open} onClose={onCancel} darkMode={darkMode} size="sm" showCloseButton={false}>
    <Modal.Header darkMode={darkMode} title={title} />
    {description && (
      <Modal.Body>
        <p className={text.body(darkMode)}>{description}</p>
      </Modal.Body>
    )}
    <Modal.Footer darkMode={darkMode}>
      <Button variant="ghost" darkMode={darkMode} onClick={onCancel}>{cancelLabel}</Button>
      <Button variant={variant} darkMode={darkMode} onClick={onConfirm} loading={loading}>
        {confirmLabel}
      </Button>
    </Modal.Footer>
  </Modal>
);
