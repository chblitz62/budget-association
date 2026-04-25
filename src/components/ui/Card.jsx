import React from 'react';
import { surface, text } from '../../styles/tokens';

/**
 * <Card /> — Surface verre Soft SaaS
 *
 * variant : 'default' (glass blur, principal)
 *         | 'elevated' (modal, popover — solide + ombre prononcée)
 *         | 'muted'    (sous-section discrète — bg-muted)
 *
 * padding : 'none' | 'sm' (16px) | 'md' (24px, default) | 'lg' (32px)
 *
 * Composition : <Card.Header>, <Card.Body>, <Card.Footer> pour structurer.
 * Compatible avec children direct (sans sous-composants) pour usage simple.
 */
const padMap = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const variantMap = (dark, variant) => {
  if (variant === 'elevated') return surface.elevated(dark);
  if (variant === 'muted') return `${surface.muted(dark)} rounded-2xl border ${dark ? 'border-zinc-800/40' : 'border-slate-200/40'}`;
  return surface.card(dark);
};

const Card = ({
  darkMode = false,
  variant = 'default',
  padding = 'md',
  hover = false,
  className = '',
  children,
  ...rest
}) => {
  const hoverCls = hover ? 'transition-all hover:-translate-y-0.5 hover:shadow-md' : '';
  return (
    <div
      className={`${variantMap(darkMode, variant)} ${padMap[padding]} ${hoverCls} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
};

Card.Header = ({ darkMode = false, title, subtitle, actions, divider = false, className = '' }) => (
  <div className={`${className} ${divider ? `pb-4 mb-4 border-b ${darkMode ? 'border-zinc-800/60' : 'border-slate-200/60'}` : 'mb-4'}`}>
    <div className="flex items-start justify-between gap-3 flex-wrap">
      <div className="min-w-0 flex-1">
        {title && <h3 className={text.title(darkMode)}>{title}</h3>}
        {subtitle && <p className={`${text.muted(darkMode)} mt-1`}>{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  </div>
);

Card.Body = ({ className = '', children }) => (
  <div className={className}>{children}</div>
);

Card.Footer = ({ darkMode = false, divider = true, className = '', children }) => (
  <div className={`${className} ${divider ? `pt-4 mt-4 border-t ${darkMode ? 'border-zinc-800/60' : 'border-slate-200/60'}` : 'mt-4'} flex items-center justify-end gap-2`}>
    {children}
  </div>
);

export default Card;
