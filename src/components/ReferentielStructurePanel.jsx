import React, { useMemo, useState } from 'react';
import {
  Library, MapPin, Users, GraduationCap, Plus, Trash2, Archive, ArchiveRestore,
  AlertTriangle, Download, Upload,
} from 'lucide-react';
import {
  normaliserReferentiel, creerEntree, detecterDoublonsCode,
  calculerSyntheseReferentiel, slugifyCode,
  TYPES_SERVICE, NIVEAUX_FILIERE,
} from '../utils/referentielStructure';
import DataPanel, { PanelStat, EmptyState } from './ui/DataPanel';
import DataTable from './ui/DataTable';
import Button from './ui/Button';
import Pill from './ui/Pill';
import HoverTip from './ui/HoverTip';
import { surface, text } from '../styles/tokens';

// Classes statiques (Tailwind ne purge pas les classes dynamiques)
const ACCENT_CLASSES = {
  cyan:   { iconLight: 'text-cyan-600',   iconDark: 'text-cyan-400',   bgActiveLight: 'bg-cyan-50 border-cyan-300',     bgActiveDark: 'bg-cyan-900/40 border-cyan-700' },
  indigo: { iconLight: 'text-indigo-600', iconDark: 'text-indigo-400', bgActiveLight: 'bg-indigo-50 border-indigo-300', bgActiveDark: 'bg-indigo-900/40 border-indigo-700' },
  violet: { iconLight: 'text-violet-600', iconDark: 'text-violet-400', bgActiveLight: 'bg-violet-50 border-violet-300', bgActiveDark: 'bg-violet-900/40 border-violet-700' },
};

const CATEGORIES = [
  { id: 'lieux',    label: 'Lieux géographiques', icon: MapPin,        type: 'lieu',    accent: 'cyan' },
  { id: 'services', label: 'Services / Fonctions', icon: Users,         type: 'service', accent: 'indigo' },
  { id: 'filieres', label: 'Filières / Formations', icon: GraduationCap, type: 'filiere', accent: 'violet' },
];

/**
 * <ReferentielStructurePanel /> — Dictionnaire CRUD des unités analytiques.
 *
 * Persistance via globalParams.referentielStructure (NEW dans useBudgetData).
 * Permet la ventilation analytique future (S6.1) et alimente les listes
 * déroulantes des engagements, fonds dédiés, etc.
 *
 * 3 onglets internes : Lieux / Services / Filières.
 */
export default function ReferentielStructurePanel({
  darkMode = false, referentielStructure, setReferentielStructure, appendAuditEntry,
}) {
  const dm = darkMode;
  const [activeCategory, setActiveCategory] = useState('lieux');
  const [editingId, setEditingId] = useState(null);

  const ref = useMemo(() => normaliserReferentiel(referentielStructure), [referentielStructure]);
  const synthese = useMemo(() => calculerSyntheseReferentiel(ref), [ref]);
  const currentCat = CATEGORIES.find(c => c.id === activeCategory);
  const currentList = ref[activeCategory] || [];
  const conflits = useMemo(() => detecterDoublonsCode(currentList), [currentList]);

  const ajouter = () => {
    if (!setReferentielStructure) return;
    const newEntry = creerEntree(currentCat.type);
    setReferentielStructure({
      ...ref,
      [activeCategory]: [...currentList, newEntry],
    });
    setEditingId(newEntry.id);
    appendAuditEntry?.('Ajout référentiel', 'Paramètres', `${currentCat.label} : ${newEntry.libelle}`);
  };

  const update = (id, field, value) => {
    if (!setReferentielStructure) return;
    setReferentielStructure({
      ...ref,
      [activeCategory]: currentList.map(e => e.id === id ? { ...e, [field]: value } : e),
    });
  };

  const supprimer = (id) => {
    if (!setReferentielStructure) return;
    if (!confirm('Supprimer définitivement cette entrée ? Préférez l\'archivage pour préserver l\'historique.')) return;
    setReferentielStructure({
      ...ref,
      [activeCategory]: currentList.filter(e => e.id !== id),
    });
    appendAuditEntry?.('Suppression référentiel', 'Paramètres', `${currentCat.label} : ${id}`);
  };

  const toggleArchive = (id) => {
    if (!setReferentielStructure) return;
    const entry = currentList.find(e => e.id === id);
    const nouvelEtat = !entry?.actif;
    update(id, 'actif', nouvelEtat);
    appendAuditEntry?.(nouvelEtat ? 'Restauration référentiel' : 'Archivage référentiel',
      'Paramètres', `${currentCat.label} : ${entry?.libelle}`);
  };

  const exportCSV = () => {
    const lignes = [['Catégorie', 'Code', 'Libellé', 'Détail', 'Actif']];
    CATEGORIES.forEach(cat => {
      (ref[cat.id] || []).forEach(e => {
        const detail = cat.id === 'lieux' ? e.adresse
          : cat.id === 'services' ? (TYPES_SERVICE.find(t => t.id === e.type)?.label || e.type)
          : `${NIVEAUX_FILIERE.find(n => n.id === e.niveau)?.label || ''}${e.certificateur ? ` | ${e.certificateur}` : ''}`;
        lignes.push([cat.label, e.code, e.libelle, detail, e.actif ? 'oui' : 'non']);
      });
    });
    const csv = lignes.map(l => l.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `referentiel_structure_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const inputCls = `w-full px-2 py-1 rounded-md text-xs ${dm ? 'bg-zinc-800 border border-zinc-700 text-white' : 'bg-white border border-slate-300 text-slate-700'}`;

  const nbConflits = Object.keys(conflits).length;

  return (
    <DataPanel
      darkMode={dm}
      icon={Library}
      title="Référentiel de Structure"
      subtitle="Dictionnaire centralisé des unités analytiques (lieux, services, filières)"
      level={nbConflits > 0 ? 'warning' : 'info'}
      help="Centralise tous les libellés des unités analytiques pour permettre la ventilation comptable, alimenter les listes déroulantes (engagements, fonds dédiés, etc.) et fournir un code stable pour les clés de répartition."
      collapsible
      actions={
        <>
          <Button variant="ghost" size="sm" leftIcon={Download} darkMode={dm} onClick={exportCSV}>
            CSV
          </Button>
          {setReferentielStructure && (
            <Button variant="primary" size="sm" leftIcon={Plus} darkMode={dm} onClick={ajouter}>
              Ajouter
            </Button>
          )}
        </>
      }
      summary={
        <>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const data = synthese[cat.id];
              const accentCls = ACCENT_CLASSES[cat.accent];
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => { setActiveCategory(cat.id); setEditingId(null); }}
                  className={`p-3 rounded-xl text-left transition-all border-2 ${isActive
                    ? (dm ? accentCls.bgActiveDark : accentCls.bgActiveLight)
                    : (dm ? 'bg-zinc-800/40 border-zinc-700/40 hover:bg-zinc-800/60' : 'bg-slate-50 border-slate-200/60 hover:bg-white')
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon size={14} strokeWidth={1.5} className={dm ? accentCls.iconDark : accentCls.iconLight} />
                    <span className={text.label(dm)}>{cat.label.split(' / ')[0]}</span>
                  </div>
                  <div className={`text-xl font-bold tabular-nums ${dm ? 'text-zinc-100' : 'text-slate-800'}`}>{data.total}</div>
                  <div className={`text-[10px] ${dm ? 'text-zinc-500' : 'text-slate-500'}`}>
                    {data.actifs} actif{data.actifs > 1 ? 's' : ''}
                    {data.archives > 0 && ` · ${data.archives} archivé${data.archives > 1 ? 's' : ''}`}
                  </div>
                </button>
              );
            })}
          </div>

          {nbConflits > 0 && (
            <div className={`rounded-xl px-4 py-3 mb-4 flex items-start gap-2 border-l-4 ${
              dm ? 'bg-amber-950/30 border-l-amber-500' : 'bg-amber-50 border-l-amber-500'
            }`}>
              <AlertTriangle size={16} strokeWidth={1.5} className={`shrink-0 mt-0.5 ${dm ? 'text-amber-300' : 'text-amber-600'}`} />
              <p className={`text-sm ${dm ? 'text-amber-200' : 'text-amber-800'}`}>
                <strong>{nbConflits} code{nbConflits > 1 ? 's' : ''} en doublon</strong> dans la catégorie « {currentCat.label} ».
                Modifiez les codes en conflit pour garantir l'unicité analytique.
              </p>
            </div>
          )}
        </>
      }
    >
      {/* Liste de la catégorie active */}
      {currentList.length === 0 ? (
        <EmptyState
          darkMode={dm}
          icon={currentCat.icon}
          title={`Aucun${currentCat.id === 'filieres' ? 'e filière' : ' ' + currentCat.label.toLowerCase().split(' ')[0]} enregistré${currentCat.id === 'filieres' ? 'e' : ''}`}
          description="Saisissez vos unités analytiques pour les utiliser dans les engagements, fonds dédiés et la ventilation comptable."
          action={setReferentielStructure && (
            <Button variant="primary" size="md" leftIcon={Plus} darkMode={dm} onClick={ajouter}>
              Ajouter
            </Button>
          )}
        />
      ) : (
        <DataTable darkMode={dm} variant="borderless">
          <DataTable.Head>
            <DataTable.Row>
              <DataTable.HeadCell darkMode={dm}>Code</DataTable.HeadCell>
              <DataTable.HeadCell darkMode={dm}>Libellé</DataTable.HeadCell>
              {activeCategory === 'lieux' && <DataTable.HeadCell darkMode={dm}>Adresse</DataTable.HeadCell>}
              {activeCategory === 'services' && <DataTable.HeadCell darkMode={dm}>Type</DataTable.HeadCell>}
              {activeCategory === 'filieres' && (
                <>
                  <DataTable.HeadCell darkMode={dm}>Niveau</DataTable.HeadCell>
                  <DataTable.HeadCell darkMode={dm}>Certificateur</DataTable.HeadCell>
                </>
              )}
              <DataTable.HeadCell darkMode={dm} align="center">Statut</DataTable.HeadCell>
              <DataTable.HeadCell darkMode={dm} align="center" />
            </DataTable.Row>
          </DataTable.Head>
          <DataTable.Body>
            {currentList.map(e => {
              const isEditing = editingId === e.id;
              const isInactive = e.actif === false;
              const isDup = conflits[e.id] === 'duplicate';
              return (
                <DataTable.Row key={e.id} className={isInactive ? 'opacity-60' : ''}>
                  <DataTable.Cell darkMode={dm}>
                    {isEditing ? (
                      <input
                        className={`${inputCls} font-mono uppercase ${isDup ? 'border-amber-500' : ''}`}
                        value={e.code || ''}
                        onChange={ev => update(e.id, 'code', slugifyCode(ev.target.value))}
                        placeholder="ex : ARR"
                        maxLength={8}
                      />
                    ) : (
                      <HoverTip
                        darkMode={dm}
                        content={isDup ? '⚠ Code en doublon dans cette catégorie' : `Identifiant analytique stable de cette unité`}
                      >
                        <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                          isDup
                            ? (dm ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-100 text-amber-700')
                            : (dm ? 'bg-indigo-900/40 text-indigo-300' : 'bg-indigo-50 text-indigo-700')
                        }`}>{e.code || '—'}</span>
                      </HoverTip>
                    )}
                  </DataTable.Cell>
                  <DataTable.Cell darkMode={dm}>
                    {isEditing ? (
                      <input className={inputCls} value={e.libelle || ''}
                        onChange={ev => update(e.id, 'libelle', ev.target.value)} placeholder="Nom complet" />
                    ) : (
                      <button onClick={() => setEditingId(e.id)} className={`text-left hover:underline font-semibold ${dm ? 'text-zinc-100' : 'text-slate-800'}`}>
                        {e.libelle}
                      </button>
                    )}
                  </DataTable.Cell>

                  {activeCategory === 'lieux' && (
                    <DataTable.Cell darkMode={dm}>
                      {isEditing ? (
                        <input className={inputCls} value={e.adresse || ''}
                          onChange={ev => update(e.id, 'adresse', ev.target.value)} placeholder="Adresse postale" />
                      ) : <span className={`text-xs ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>{e.adresse || '—'}</span>}
                    </DataTable.Cell>
                  )}

                  {activeCategory === 'services' && (
                    <DataTable.Cell darkMode={dm}>
                      {isEditing ? (
                        <select className={inputCls} value={e.type || 'pedagogie'}
                          onChange={ev => update(e.id, 'type', ev.target.value)}>
                          {TYPES_SERVICE.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                        </select>
                      ) : (
                        <Pill variant="info" size="xs" darkMode={dm}>
                          {TYPES_SERVICE.find(t => t.id === e.type)?.label || 'Autre'}
                        </Pill>
                      )}
                    </DataTable.Cell>
                  )}

                  {activeCategory === 'filieres' && (
                    <>
                      <DataTable.Cell darkMode={dm}>
                        {isEditing ? (
                          <select className={inputCls} value={e.niveau || 'autre'}
                            onChange={ev => update(e.id, 'niveau', ev.target.value)}>
                            {NIVEAUX_FILIERE.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
                          </select>
                        ) : (
                          <span className={`text-xs ${dm ? 'text-zinc-300' : 'text-slate-700'}`}>
                            {NIVEAUX_FILIERE.find(n => n.id === e.niveau)?.label || 'Non défini'}
                          </span>
                        )}
                      </DataTable.Cell>
                      <DataTable.Cell darkMode={dm}>
                        {isEditing ? (
                          <input className={inputCls} value={e.certificateur || ''}
                            onChange={ev => update(e.id, 'certificateur', ev.target.value)} placeholder="ex : Min. Solidarités" />
                        ) : <span className={`text-xs ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>{e.certificateur || '—'}</span>}
                      </DataTable.Cell>
                    </>
                  )}

                  <DataTable.Cell darkMode={dm} align="center">
                    <Pill variant={isInactive ? 'neutral' : 'success'} size="xs" darkMode={dm}>
                      {isInactive ? 'Archivé' : 'Actif'}
                    </Pill>
                  </DataTable.Cell>

                  <DataTable.Cell darkMode={dm} align="center">
                    {setReferentielStructure && (
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => toggleArchive(e.id)}
                          className={`p-1 rounded transition-colors ${isInactive
                            ? (dm ? 'text-emerald-400 hover:bg-emerald-500/20' : 'text-emerald-500 hover:bg-emerald-50')
                            : (dm ? 'text-amber-400 hover:bg-amber-500/20' : 'text-amber-500 hover:bg-amber-50')}`}
                          title={isInactive ? 'Restaurer' : 'Archiver'}>
                          {isInactive ? <ArchiveRestore size={13} strokeWidth={1.5} /> : <Archive size={13} strokeWidth={1.5} />}
                        </button>
                        <button onClick={() => supprimer(e.id)}
                          className={`p-1 rounded hover:bg-rose-500/20 ${dm ? 'text-rose-400' : 'text-rose-500'}`}
                          title="Supprimer définitivement">
                          <Trash2 size={13} strokeWidth={1.5} />
                        </button>
                      </div>
                    )}
                  </DataTable.Cell>
                </DataTable.Row>
              );
            })}
          </DataTable.Body>
        </DataTable>
      )}

      <p className={`mt-3 text-[10px] italic ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
        Ce référentiel alimente les listes déroulantes des engagements, fonds dédiés et la ventilation analytique
        (S6.1 — précurseur). Préférez l'archivage à la suppression pour préserver l'historique des opérations.
      </p>

      {editingId && (
        <div className="mt-4 flex justify-end">
          <Button variant="secondary" size="sm" darkMode={dm} onClick={() => setEditingId(null)}>
            Terminer l'édition
          </Button>
        </div>
      )}
    </DataPanel>
  );
}
