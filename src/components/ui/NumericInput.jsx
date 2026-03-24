/**
 * NumericInput — cellule comptable : mise à jour immédiate sur frappe valide,
 * tolère virgule/point et notation française (2.500 → 2500, 2 500,50 → 2500.5).
 * Enter = valide ; valeur intermédiaire (se terminant par . ou ,) = pas de mise à jour.
 *
 * Props :
 *  value    : number
 *  onChange : (number) => void
 *  integer  : bool   — arrondit au plus proche entier (défaut false)
 *  className: string
 *  + tous attributs input HTML (placeholder…)
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

// Vrai si la saisie est en cours (ex : "2." ou "2,")
const isPartial = (s) => /[.,]$/.test(s.trim());

export default function NumericInput({ value, onChange, integer = false, className, ...props }) {
  const [str, setStr] = useState(String(value ?? ''));
  const lastExternal = useRef(value);

  // Synchronise si la valeur externe change (ex : reset)
  useEffect(() => {
    if (value !== lastExternal.current) {
      const parsedStr = parseLocaleNumber(str);
      if (isNaN(parsedStr) || parsedStr !== value) setStr(String(value ?? ''));
      lastExternal.current = value;
    }
  }, [value]);

  const commit = (raw) => {
    const parsed = parseLocaleNumber(raw);
    if (!isNaN(parsed)) {
      const v = integer ? Math.round(parsed) : parsed;
      lastExternal.current = v;
      onChange(v);
    }
  };

  return (
    <input
      {...props}
      type="text"
      inputMode="decimal"
      className={className}
      value={str}
      onChange={e => {
        const raw = e.target.value;
        setStr(raw);
        // Mise à jour immédiate si la valeur est complète (pas de . ou , final)
        if (!isPartial(raw)) commit(raw);
      }}
      onBlur={() => {
        // Assure le commit final même si le dernier char était . ou ,
        commit(str);
        // Remet un affichage propre si saisie invalide
        const parsed = parseLocaleNumber(str);
        if (isNaN(parsed)) setStr(String(value ?? ''));
      }}
      onKeyDown={e => {
        if (e.key === 'Enter') e.target.blur();
      }}
    />
  );
}
