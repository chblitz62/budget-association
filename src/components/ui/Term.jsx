import React from 'react';
import { GLOSSARY, findGlossaryTerm } from '../../utils/glossary';
import HoverTip from './HoverTip';

/**
 * <Term /> — Inline glossary term avec tooltip pédagogique riche au survol.
 *
 * Usage explicite (auteur connaît l'id) :
 *   <Term id="bfr">BFR</Term>
 *   <Term id="etp">ETP</Term>
 *
 * Usage par texte (auto-lookup sur le texte enfant) :
 *   <Term>BFR</Term>          → cherche un terme dont le label commence par "BFR"
 *
 * Si l'id ou le texte ne correspond à aucune entrée du glossaire, le composant
 * rend simplement les enfants en passthrough (zéro tooltip, zéro souligné).
 *
 * Style :
 *   - Soulignement pointillé subtil (border-bottom dotted) pour signaler "term cliquable"
 *   - cursor-help pour confirmer le caractère interactif sans clic
 *   - HoverTip s'ouvre après 300ms (cohérent avec autres tooltips)
 *   - Format triple : titre du glossaire + définition + levier d'action
 *
 * Props additionnelles :
 *   - darkMode    : passé à HoverTip
 *   - level       : tone du HoverTip (défaut : 'info' pour identification visuelle)
 *   - underline   : false pour désactiver le soulignement (mode discret)
 */

// Mappings raccourcis fréquents → ids glossaire (recherche rapide)
const SHORTCUT_MAP = {
  'bfr': 'bfr',
  'etp': 'etp',
  'fillon': 'fillon',
  'taxe sur les salaires': 'taxe_salaires',
  'taxe salaires': 'taxe_salaires',
  'ifc': 'ifc',
  'ségur': 'segur',
  'segur': 'segur',
  'fonds de roulement': 'fonds_roulement',
  'frng': 'fonds_roulement',
  'fr': 'fonds_roulement',
  'opco': 'opca_opco',
  'opca': 'opca_opco',
  'gvt': 'gvt',
  'taux de couverture': 'taux_couverture',
  'amortissement': 'amortissement',
  'amortissements': 'amortissement',
  'urssaf': 'urssaf',
  'point mort': 'point_mort',
  'cchs': 'cchs',
};

// Auto-add ETP if not in glossary (it's referenced as label)
const buildEtpEntry = () => ({
  id: 'etp',
  term: 'ETP — Équivalent Temps Plein',
  categorie: 'masse_salariale',
  definition: '1 ETP = 1 poste à temps complet (35 h/semaine, toute l\'année). Un agent à mi-temps compte pour 0,5 ETP.',
  impact: 'L\'ETP est la base de calcul du coût employeur, des subventions au prorata et de la productivité (étudiants/ETP).',
  levier: 'Optimiser le mix temps plein/partiel selon les pics d\'activité ; éviter les sur-effectifs en intersaison.',
});

const lookupTerm = (idOrText) => {
  if (!idOrText) return null;
  const key = String(idOrText).toLowerCase().trim();
  // Try direct id lookup
  let entry = findGlossaryTerm(key);
  if (entry) return entry;
  // Try shortcut map
  const mappedId = SHORTCUT_MAP[key];
  if (mappedId) entry = findGlossaryTerm(mappedId);
  if (entry) return entry;
  // Polyfill ETP si pas dans glossaire
  if (key === 'etp') return buildEtpEntry();
  return null;
};

export default function Term({
  id,
  children,
  darkMode = false,
  level = 'info',
  underline = true,
  className = '',
}) {
  // Détermine la clé : prop id explicite > texte enfant
  const lookupKey = id || (typeof children === 'string' ? children : null);
  const entry = lookupTerm(lookupKey);

  // Pas trouvé → passthrough sans souligné ni tooltip
  if (!entry) return <>{children}</>;

  const dm = darkMode;
  const underlineCls = underline
    ? (dm
      ? 'border-b border-dotted border-zinc-600 hover:border-indigo-400'
      : 'border-b border-dotted border-slate-400 hover:border-indigo-500')
    : '';

  return (
    <HoverTip
      darkMode={dm}
      level={level}
      title={entry.term}
      description={entry.definition}
      interpretation={entry.levier ? `💡 Levier : ${entry.levier}` : undefined}
      maxWidth={320}
    >
      <span className={`cursor-help inline ${underlineCls} ${className}`}>
        {children}
      </span>
    </HoverTip>
  );
}

/**
 * <AutoTerms /> — Wrapper qui scanne le texte enfant et wrap automatiquement
 * tous les termes du glossaire détectés.
 *
 * Usage :
 *   <AutoTerms darkMode={dm}>
 *     Le BFR de l'association reste contenu grâce aux délais OPCO maîtrisés.
 *   </AutoTerms>
 *
 * Limitations :
 *   - Fonctionne uniquement avec un enfant string (pas de React nodes mélangés)
 *   - Match insensible à la casse, mots entiers (pas de sous-chaînes)
 *   - Premier match par mot (ne wrap pas plusieurs fois le même mot)
 */
const TERM_PATTERNS = (() => {
  // Construit une regex unique pour tous les raccourcis + ids du glossaire
  const keys = new Set([
    ...Object.keys(SHORTCUT_MAP),
    ...GLOSSARY.map(g => g.id.replace(/_/g, ' ')),
  ]);
  // Tri par longueur décroissante pour matcher les plus longs en premier
  const sorted = Array.from(keys).sort((a, b) => b.length - a.length);
  // Échappe les caractères regex et joint
  const escaped = sorted.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');
})();

export const AutoTerms = ({ children, darkMode = false, className = '' }) => {
  if (typeof children !== 'string') return <>{children}</>;
  const text = children;
  const parts = [];
  let lastIndex = 0;
  let match;
  // Reset regex state
  TERM_PATTERNS.lastIndex = 0;

  while ((match = TERM_PATTERNS.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <Term key={match.index} darkMode={darkMode}>
        {match[0]}
      </Term>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));

  return <span className={className}>{parts}</span>;
};
