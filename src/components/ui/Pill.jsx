import React from 'react';
import { status } from '../../styles/tokens';

/**
 * <Pill /> — Petite étiquette ronde avec icône optionnelle (statut, catégorie).
 *
 * variant : 'success' | 'warning' | 'danger' | 'info' | 'neutral'
 * size    : 'xs' | 'sm' (default) | 'md'
 *
 * Exemples :
 *   <Pill variant="success" icon={CheckCircle2}>Validé</Pill>
 *   <Pill variant="warning">3 alertes</Pill>
 */
const sizeMap = {
  xs: 'px-2 py-0.5 text-[10px] gap-1',
  sm: 'px-2.5 py-0.5 text-xs gap-1',
  md: 'px-3 py-1 text-sm gap-1.5',
};

const iconSizeMap = { xs: 10, sm: 12, md: 14 };

const Pill = ({
  variant = 'neutral',
  size = 'sm',
  icon: Icon,
  darkMode = false,
  className = '',
  children,
}) => {
  const tone = status[variant](darkMode);
  return (
    <span className={`inline-flex items-center font-semibold rounded-full border ${tone.bg} ${tone.text} ${sizeMap[size]} ${className}`}>
      {Icon && <Icon size={iconSizeMap[size]} strokeWidth={1.5} className={tone.accent} />}
      {children}
    </span>
  );
};

/**
 * <Badge /> — Variante carrée (rounded-md) pour comptes/notifications.
 *
 * <Badge variant="danger">12</Badge>
 */
export const Badge = ({
  variant = 'info',
  darkMode = false,
  className = '',
  children,
}) => {
  const tone = status[variant](darkMode);
  return (
    <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-md text-[10px] font-bold ${tone.bg} ${tone.text} border ${className}`}>
      {children}
    </span>
  );
};

export default Pill;
