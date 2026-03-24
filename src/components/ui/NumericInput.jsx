/**
 * NumericInput — champ numérique tolérant virgule/point (notation française)
 * Garde la saisie en string localement, commit la valeur numérique au onBlur.
 * Exemples acceptés : 2500 · 2.500 · 2 500 · 2500,50 · 2.500,50
 *
 * Props :
 *  value    : number
 *  onChange : (number) => void
 *  integer  : bool   — arrondit au plus proche entier (défaut false)
 *  className: string
 *  + tous attributs input HTML (placeholder, min, max…)
 */
import React, { useState, useEffect, useRef } from 'react';

export function parseLocaleNumber(str) {
  if (typeof str === 'number') return str;
  const s = String(str).trim().replace(/\s/g, '');
  const lastDot = s.lastIndexOf('.');
  const lastComma = s.lastIndexOf(',');
  let normalized;
  if (lastComma > lastDot) {
    // virgule = séparateur décimal : "2.500,50" → "2500.50"
    normalized = s.replace(/\./g, '').replace(',', '.');
  } else if (lastDot > lastComma) {
    const afterDot = s.slice(lastDot + 1);
    // point suivi de 3 chiffres = séparateur de milliers : "2.500" → "2500"
    if (/^\d{3}$/.test(afterDot)) normalized = s.replace(/\./g, '');
    else normalized = s.replace(/,/g, '');
  } else {
    normalized = s;
  }
  return parseFloat(normalized);
}

export default function NumericInput({ value, onChange, integer = false, className, ...props }) {
  const [str, setStr] = useState(String(value ?? ''));
  const lastExternal = useRef(value);

  useEffect(() => {
    if (value !== lastExternal.current) {
      const parsedStr = parseLocaleNumber(str);
      if (isNaN(parsedStr) || parsedStr !== value) setStr(String(value ?? ''));
      lastExternal.current = value;
    }
  }, [value]);

  return (
    <input
      {...props}
      type="text"
      inputMode="decimal"
      className={className}
      value={str}
      onChange={e => setStr(e.target.value)}
      onBlur={() => {
        const parsed = parseLocaleNumber(str);
        if (!isNaN(parsed)) {
          const v = integer ? Math.round(parsed) : parsed;
          lastExternal.current = v;
          onChange(v);
        } else {
          setStr(String(value ?? ''));
        }
      }}
    />
  );
}
