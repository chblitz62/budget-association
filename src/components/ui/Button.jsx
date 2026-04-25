import React from 'react';
import { Loader2 } from 'lucide-react';
import { button } from '../../styles/tokens';

/**
 * <Button /> — Soft SaaS — 5 variantes hiérarchisées
 *
 * variant : 'primary' (gradient indigo→violet, action principale)
 *         | 'secondary' (border, neutre)
 *         | 'ghost' (sans border, hover bg)
 *         | 'tertiary' (lien, sans bg)
 *         | 'destructive' (rouge, action irréversible)
 *
 * size    : 'sm' | 'md' (default) | 'lg'
 *
 * Props additionnelles :
 *   leftIcon  — icône Lucide à gauche (auto strokeWidth=1.5)
 *   rightIcon — icône à droite
 *   loading   — affiche un spinner et désactive
 *   fullWidth — w-full
 *   iconOnly  — bouton carré (pour actions dans toolbars)
 *
 * Convention : maximum 1 bouton primary par zone visible (hiérarchie claire).
 */
const sizeMap = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-base gap-2',
};

const iconSizeMap = { sm: 13, md: 16, lg: 18 };

const Button = React.forwardRef(({
  variant = 'secondary',
  size = 'md',
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  loading = false,
  fullWidth = false,
  iconOnly = false,
  darkMode = false,
  disabled,
  children,
  className = '',
  type = 'button',
  ...rest
}, ref) => {
  const base = button[variant]?.(darkMode) || button.secondary(darkMode);
  // Override padding/text size selon size — on remplace les classes par défaut du token
  const sized = base
    .replace(/px-\d+(\.\d+)?/g, '')
    .replace(/py-\d+(\.\d+)?/g, '')
    .replace(/text-(xs|sm|base|lg)/g, '')
    .replace(/gap-\d+(\.\d+)?/g, '');
  const sizing = iconOnly
    ? `${size === 'sm' ? 'p-1.5' : size === 'lg' ? 'p-2.5' : 'p-2'}`
    : sizeMap[size];
  const iconSize = iconSizeMap[size];

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={`${sized} ${sizing} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {loading ? (
        <Loader2 size={iconSize} strokeWidth={1.5} className="animate-spin" />
      ) : LeftIcon ? (
        <LeftIcon size={iconSize} strokeWidth={1.5} />
      ) : null}
      {!iconOnly && children}
      {!loading && RightIcon && <RightIcon size={iconSize} strokeWidth={1.5} />}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
