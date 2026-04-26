import React from 'react';
import { ArrowUpDown, ArrowDown, ArrowUp } from 'lucide-react';
import { surface, text } from '../../styles/tokens';

/**
 * <DataTable /> — Famille de composants tableau Soft SaaS.
 *
 * Composition flexible :
 *   <Table>
 *     <THead>
 *       <TR>
 *         <TH>Libellé</TH>
 *         <TH align="right">Montant</TH>
 *       </TR>
 *     </THead>
 *     <TBody>
 *       {rows.map(r => (
 *         <TR key={r.id}>
 *           <TD>{r.libelle}</TD>
 *           <TD align="right" mono>{r.montant}</TD>
 *         </TR>
 *       ))}
 *     </TBody>
 *   </Table>
 *
 * Caractéristiques :
 *   - Padding cellules 12px (vs 6-8 ancien) — confort de lecture
 *   - Hover row subtle (bg-slate-50/50 ou zinc-800/40)
 *   - Zebra striping optionnel
 *   - Sticky header optionnel (top: 0 + bg)
 *   - Empty state intégré via <EmptyTable />
 *   - Surface "verre" cohérente avec <Card>
 *
 * Bonus : <SortIndicator /> pour colonnes triables.
 */

// ── Table racine ──────────────────────────────────────────────────────
export const Table = ({
  darkMode = false,
  variant = 'default', // 'default' (glass card) | 'borderless' (sans wrapper)
  zebra = false,
  hoverable = true,
  stickyHeader = false,
  className = '',
  children,
}) => {
  const dm = darkMode;
  const wrapperCls = variant === 'borderless'
    ? ''
    : `${surface.card(dm)} overflow-hidden`;

  return (
    <div
      data-zebra={zebra ? 'true' : 'false'}
      data-hoverable={hoverable ? 'true' : 'false'}
      data-darkmode={dm ? 'true' : 'false'}
      data-sticky={stickyHeader ? 'true' : 'false'}
      className={`${wrapperCls} ${className}`}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          {children}
        </table>
      </div>
    </div>
  );
};

// ── Head / Body / Foot ────────────────────────────────────────────────
export const THead = ({ className = '', children }) => (
  <thead className={className}>{children}</thead>
);

export const TBody = ({ className = '', children }) => (
  <tbody className={className}>{children}</tbody>
);

export const TFoot = ({ darkMode = false, className = '', children }) => {
  const dm = darkMode;
  return (
    <tfoot className={`${dm ? 'bg-zinc-800/60 border-t border-zinc-700' : 'bg-slate-100 border-t border-slate-200'} font-bold ${className}`}>
      {children}
    </tfoot>
  );
};

// ── Row ───────────────────────────────────────────────────────────────
export const TR = ({
  darkMode,             // hérite du Table parent si non précisé
  highlight = false,    // ligne en évidence (subtotal/total)
  level = null,         // 'success' | 'warning' | 'danger' | null
  className = '',
  children,
  ...rest
}) => {
  // Hover et zebra sont gérés via CSS sur les TD avec attribut
  const levelCls = level === 'success' ? 'data-tr-success'
    : level === 'warning' ? 'data-tr-warning'
    : level === 'danger' ? 'data-tr-danger'
    : '';
  const hl = highlight ? 'data-tr-highlight' : '';
  return (
    <tr className={`${levelCls} ${hl} ${className} group`} {...rest}>
      {children}
    </tr>
  );
};

// ── Cells ─────────────────────────────────────────────────────────────
export const TH = ({
  darkMode = false,
  align = 'left',
  sticky = false,
  sortable = false,
  sortDir = null,           // 'asc' | 'desc' | null
  onSort,
  className = '',
  children,
  ...rest
}) => {
  const dm = darkMode;
  const alignCls = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  const stickyCls = sticky ? `sticky top-0 z-10 ${dm ? 'bg-zinc-900/95 backdrop-blur' : 'bg-slate-50/95 backdrop-blur'}` : '';
  const baseCls = `px-4 py-3 ${text.label(dm)} ${alignCls} font-bold ${dm ? 'border-b border-zinc-700/60' : 'border-b border-slate-200'} ${stickyCls}`;

  if (sortable) {
    return (
      <th
        scope="col"
        onClick={onSort}
        className={`${baseCls} cursor-pointer select-none transition-colors ${dm ? 'hover:bg-zinc-800/60' : 'hover:bg-slate-100'} ${className}`}
        aria-sort={sortDir === 'asc' ? 'ascending' : sortDir === 'desc' ? 'descending' : 'none'}
        {...rest}
      >
        <span className={`inline-flex items-center gap-1.5 ${align === 'right' ? 'justify-end' : ''}`}>
          {children}
          <SortIndicator dir={sortDir} darkMode={dm} />
        </span>
      </th>
    );
  }

  return (
    <th scope="col" className={`${baseCls} ${className}`} {...rest}>
      {children}
    </th>
  );
};

export const TD = ({
  darkMode = false,
  align = 'left',
  mono = false,
  bold = false,
  truncate = false,
  className = '',
  children,
  ...rest
}) => {
  const dm = darkMode;
  const alignCls = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  const monoCls = mono ? 'tabular-nums font-mono' : '';
  const boldCls = bold ? 'font-semibold' : '';
  const truncateCls = truncate ? 'truncate max-w-xs' : '';
  const colorCls = dm ? 'text-zinc-200' : 'text-slate-700';
  return (
    <td
      className={`px-4 py-3 ${alignCls} ${monoCls} ${boldCls} ${truncateCls} ${colorCls}
        ${dm ? 'border-b border-zinc-800/40' : 'border-b border-slate-100'}
        group-hover:${dm ? 'bg-zinc-800/30' : 'bg-slate-50/60'}
        transition-colors ${className}`}
      {...rest}
    >
      {children}
    </td>
  );
};

// ── Sort indicator ────────────────────────────────────────────────────
export const SortIndicator = ({ dir, darkMode = false }) => {
  const dm = darkMode;
  const inactiveColor = dm ? 'text-zinc-600' : 'text-slate-300';
  const activeColor = dm ? 'text-indigo-400' : 'text-indigo-600';
  if (dir === 'asc')  return <ArrowUp size={12} strokeWidth={1.5} className={activeColor} />;
  if (dir === 'desc') return <ArrowDown size={12} strokeWidth={1.5} className={activeColor} />;
  return <ArrowUpDown size={12} strokeWidth={1.5} className={inactiveColor} />;
};

// ── Empty state intégré ───────────────────────────────────────────────
export const EmptyTable = ({
  darkMode = false,
  colSpan = 1,
  icon: Icon,
  title = 'Aucune donnée',
  description,
  action,
}) => {
  const dm = darkMode;
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center">
        {Icon && (
          <div className={`inline-flex p-3 rounded-2xl mb-3 ${dm ? 'bg-zinc-800/60' : 'bg-slate-100'}`}>
            <Icon size={24} strokeWidth={1.5} className={dm ? 'text-zinc-500' : 'text-slate-400'} />
          </div>
        )}
        <h3 className={`text-base font-bold mb-1 ${dm ? 'text-zinc-200' : 'text-slate-800'}`}>
          {title}
        </h3>
        {description && (
          <p className={`${text.muted(dm)} max-w-md mx-auto mb-3`}>{description}</p>
        )}
        {action}
      </td>
    </tr>
  );
};

// ── Default export : Table avec tous les sous-composants attachés ─────
const DataTable = Object.assign(Table, {
  Head: THead,
  Body: TBody,
  Foot: TFoot,
  Row: TR,
  HeadCell: TH,
  Cell: TD,
  Empty: EmptyTable,
  SortIndicator,
});

export default DataTable;
