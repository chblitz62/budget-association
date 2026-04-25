import React, { useMemo, useState } from 'react';
import { Landmark, Settings2, AlertTriangle, RefreshCw, PieChart, FileText, Archive, ChevronLeft, ChevronRight } from 'lucide-react';
import { FILIERES_DEFAULT } from '../../utils/constants';
import { calculerEnveloppeParFiliere } from '../../utils/calculations';
import { exportRapportFilieresPDF } from '../../utils/pdfExport';
import HelpIcon from '../ui/HelpIcon';

const fmt = (n) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n || 0);

const pct = (val, total) => total > 0 ? Math.round(val / total * 100) : 0;

// Palette de couleurs pour la synthèse (une couleur par filière)
const FILIERE_COLORS = ['#7c3aed','#2563eb','#0891b2','#059669','#d97706','#dc2626'];

function ArchiveButton({ dm, onArchive }) {
  const [showInput, setShowInput] = useState(false);
  const [label, setLabel] = useState(() => {
    const y = new Date().getFullYear();
    return `${y-1}-${y}`;
  });
  if (!showInput) return (
    <button onClick={() => setShowInput(true)}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold border transition-all ${dm ? 'bg-zinc-700 border-zinc-600 text-zinc-300 hover:bg-zinc-600' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}>
      <Archive size={13} /> Archiver
    </button>
  );
  return (
    <div className="flex items-center gap-1">
      <input
        className={`text-xs rounded-lg px-2 py-1.5 border outline-none w-28 ${dm ? 'bg-zinc-700 border-zinc-600 text-white' : 'bg-white border-slate-300 text-slate-800'}`}
        value={label} onChange={e => setLabel(e.target.value)}
        placeholder="2024-2025"
        onKeyDown={e => { if (e.key === 'Enter') { onArchive(label); setShowInput(false); } if (e.key === 'Escape') setShowInput(false); }}
        autoFocus
      />
      <button onClick={() => { onArchive(label); setShowInput(false); }}
        className="text-xs px-2 py-1.5 bg-violet-600 text-white rounded-lg font-bold hover:bg-violet-700">✓</button>
      <button onClick={() => setShowInput(false)}
        className={`text-xs px-2 py-1.5 rounded-lg font-bold ${dm ? 'bg-zinc-700 text-zinc-300' : 'bg-slate-100 text-slate-500'}`}>✕</button>
    </div>
  );
}

export default function EnveloppeFiliere({
  darkMode,
  services = [],
  direction = null,
  poleSupport = null,
  calculerBudgetService,
  calculerBudgetDirection,
  calculerBudgetPoleSupport,
  enveloppeFormation,
  setEnveloppeFormation,
}) {
  const [editCles, setEditCles] = useState(false);
  const [showSynthese, setShowSynthese] = useState(false);
  const [anneeSelectionnee, setAnneeSelectionnee] = useState(null); // null = année courante

  // ── Historique filières par année académique ────────────────────────────────
  const historique = enveloppeFormation.historiqueFilieres || {};
  const anneesArchivees = Object.keys(historique).sort().reverse();
  const anneeActive = anneeSelectionnee && historique[anneeSelectionnee]
    ? anneeSelectionnee : null;

  const archiverAnnee = (label) => {
    if (!label.trim()) return;
    const snapshot = { filieres: filieres, archivedAt: new Date().toISOString() };
    setEnveloppeFormation({ ...enveloppeFormation, historiqueFilieres: { ...historique, [label.trim()]: snapshot } });
  };

  // ── Filières (persistées ou défaut centralisé) ──────────────────────────────
  const filieres = anneeActive
    ? (historique[anneeActive]?.filieres || FILIERES_DEFAULT)
    : (enveloppeFormation.filieres?.length > 0 ? enveloppeFormation.filieres : FILIERES_DEFAULT);

  const canEdit = !anneeActive; // Lecture seule sur archives
  const hasSeuil = filieres.some(f => (parseFloat(f.recetteParEtudiant) || 0) > 0);
  const showSeuilCol = (editCles && canEdit) || hasSeuil;

  const totalCles = filieres.reduce((s, f) => s + (parseFloat(f.cle) || 0), 0);

  const updateFiliere = (id, field, val) => {
    const updated = filieres.map(f => f.id === id ? { ...f, [field]: val } : f);
    setEnveloppeFormation({ ...enveloppeFormation, filieres: updated });
  };

  const resetFilieres = () =>
    setEnveloppeFormation({ ...enveloppeFormation, filieres: FILIERES_DEFAULT });

  // ── Calculs — recalculés dynamiquement à chaque modification RH ou Budget ───
  const { subventionRegionTotal, salairesTotaux, exploitationTotale } = useMemo(() => {
    // Subvention Région = agents cochés éligibles × taux Région, par service
    const subv = services.reduce((s, svc) =>
      s + (calculerBudgetService?.(svc)?.subventionRegionAgents || 0), 0);

    // Masse salariale totale (Siège + Pôle Support + Services)
    const dir  = calculerBudgetDirection?.(direction)?.salaires     || 0;
    const ps   = calculerBudgetPoleSupport?.(poleSupport)?.salaires || 0;
    const svcs = services.reduce((s, svc) =>
      s + (calculerBudgetService?.(svc)?.salaires || 0), 0);

    // Charges d'exploitation totales (Siège + Pôle Support + Services)
    const dirExp  = calculerBudgetDirection?.(direction)?.exploitation     || 0;
    const psExp   = calculerBudgetPoleSupport?.(poleSupport)?.exploitation || 0;
    const svcsExp = services.reduce((s, svc) =>
      s + (calculerBudgetService?.(svc)?.exploitation || 0), 0);

    return {
      subventionRegionTotal: subv,
      salairesTotaux:        dir + ps + svcs,
      exploitationTotale:    dirExp + psExp + svcsExp,
    };
  }, [services, direction, poleSupport,
      calculerBudgetService, calculerBudgetDirection, calculerBudgetPoleSupport]);

  // Ventilation par filière via la fonction utilitaire centralisée
  const { enveloppeGlobale, chargesTotales, lignes } = useMemo(
    () => calculerEnveloppeParFiliere(filieres, subventionRegionTotal, salairesTotaux, exploitationTotale),
    [filieres, subventionRegionTotal, salairesTotaux, exploitationTotale]
  );

  // Couverture plan d'actions vs enveloppe calculée
  const actions = enveloppeFormation.actions || [];
  const consoParFiliere = useMemo(() =>
    filieres.reduce((acc, f) => {
      acc[f.id] = actions
        .filter(a => a.filiereId === f.id && a.statut !== 'annule')
        .reduce((s, a) => s + (parseFloat(a.cout) || 0), 0);
      return acc;
    }, {}),
  [filieres, actions]);

  // ── Styles ──────────────────────────────────────────────────────────────────
  const dm = darkMode;
  const cl = {
    title:  dm ? 'text-white'     : 'text-slate-800',
    muted:  dm ? 'text-zinc-400'  : 'text-slate-500',
    row0:   dm ? 'bg-zinc-900/40' : 'bg-white',
    row1:   dm ? 'bg-zinc-800/40' : 'bg-violet-50/40',
    thead:  dm ? 'bg-zinc-700 text-zinc-300'    : 'bg-violet-100 text-slate-600',
    tfoot:  dm ? 'bg-zinc-700/80 text-zinc-100' : 'bg-violet-100 text-slate-700',
    border: dm ? 'border-zinc-700' : 'border-violet-200',
    inp:    dm ? 'bg-zinc-700 border-zinc-600 text-white' : 'bg-white border-slate-300 text-slate-800',
  };

  const envColor = (v) => v >= 0
    ? dm ? 'text-emerald-300' : 'text-emerald-700'
    : dm ? 'text-red-400'     : 'text-red-600';

  return (
    <div className={`rounded-3xl shadow-lg border-2 p-6 mb-8 print-avoid-break ${
      dm ? 'bg-zinc-800 border-violet-900' : 'bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200'
    }`}>
      {/* ── En-tête ── */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-2xl ${dm ? 'bg-violet-900/40' : 'bg-violet-100'}`}>
            <Landmark className={dm ? 'text-violet-400' : 'text-violet-600'} size={22} />
          </div>
          <div>
            <h2 className={`text-xl font-black flex items-center gap-2 ${cl.title}`}>
              Enveloppes de Formation par Filière
              <HelpIcon type="info" position="bottom" wide content="Ce tableau ventile les ressources disponibles par filière pédagogique. La formule est : Enveloppe filière = (Subvention Région − Masse salariale − Charges d'exploitation) × clé de répartition. Une enveloppe positive signifie qu'il reste un budget de fonctionnement pour financer les formations continues du personnel." />
            </h2>
            <p className={`text-sm ${cl.muted}`}>
              Lié au Budget &amp; RH · Subvention Région − (Salaires + Exploitation) × clé
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Navigation historique */}
          {anneesArchivees.length > 0 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setAnneeSelectionnee(null)}
                className={`text-xs px-2 py-1.5 rounded-lg font-bold border transition-all ${
                  !anneeActive
                    ? dm ? 'bg-violet-700 border-violet-500 text-white' : 'bg-violet-100 border-violet-400 text-violet-800'
                    : dm ? 'bg-zinc-700 border-zinc-600 text-zinc-300' : 'bg-white border-slate-300 text-slate-500'
                }`}
              >Actuel</button>
              {anneesArchivees.map(y => (
                <button key={y}
                  onClick={() => setAnneeSelectionnee(y)}
                  className={`text-xs px-2 py-1.5 rounded-lg font-bold border transition-all ${
                    anneeActive === y
                      ? dm ? 'bg-amber-700 border-amber-500 text-white' : 'bg-amber-100 border-amber-400 text-amber-800'
                      : dm ? 'bg-zinc-700 border-zinc-600 text-zinc-300' : 'bg-white border-slate-300 text-slate-500'
                  }`}
                >{y}</button>
              ))}
            </div>
          )}
          {!anneeActive && (
            <ArchiveButton dm={dm} onArchive={archiverAnnee} />
          )}
          <button
            onClick={() => exportRapportFilieresPDF({ filieres, lignes, consoParFiliere, enveloppeGlobale, actions })}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold border transition-all ${
              dm ? 'bg-violet-900/40 border-violet-700 text-violet-300 hover:bg-violet-800/60'
                 : 'bg-violet-50 border-violet-300 text-violet-700 hover:bg-violet-100'
            }`}
          >
            <FileText size={14} /> Rapport PDF
          </button>
          <button
            onClick={() => setShowSynthese(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold border transition-all ${
              showSynthese
                ? dm ? 'bg-violet-800 border-violet-600 text-white'  : 'bg-violet-100 border-violet-400 text-violet-800'
                : dm ? 'bg-zinc-700 border-zinc-600 text-zinc-300'   : 'bg-white border-slate-300 text-slate-600'
            }`}
          >
            <PieChart size={14} /> Synthèse
          </button>
          {editCles && (
            <button
              onClick={resetFilieres}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold border ${
                dm ? 'bg-zinc-700 border-zinc-600 text-zinc-300 hover:bg-zinc-600'
                   : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <RefreshCw size={13} /> Réinitialiser
            </button>
          )}
          {canEdit && (
            <button
              onClick={() => setEditCles(v => !v)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold border transition-all ${
                editCles
                  ? dm ? 'bg-zinc-700 border-zinc-600 text-zinc-200'  : 'bg-slate-100 border-slate-400 text-slate-700'
                  : dm ? 'bg-zinc-700 border-zinc-600 text-zinc-300'  : 'bg-white border-slate-300 text-slate-600'
              }`}
            >
              <Settings2 size={14} /> {editCles ? 'Fermer' : 'Modifier les clés'}
            </button>
          )}
          {anneeActive && (
            <span className={`text-xs px-2 py-1.5 rounded-xl font-bold border ${dm ? 'bg-amber-900/30 border-amber-700 text-amber-300' : 'bg-amber-50 border-amber-300 text-amber-700'}`}>
              📅 Archive {anneeActive} — lecture seule
            </span>
          )}
        </div>
      </div>

      {/* ── KPIs (4 indicateurs) ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className={`rounded-2xl p-4 border ${dm ? 'bg-violet-900/20 border-violet-700' : 'bg-violet-50 border-violet-200'}`}>
          <p className={`text-xs font-bold mb-1 flex items-center gap-1 ${dm ? 'text-violet-400' : 'text-violet-600'}`}>
            Subvention Région
            <HelpIcon type="info" position="bottom" content="Somme des subventions Région calculées pour tous les agents cochés comme éligibles dans chaque service. À configurer agent par agent dans l'onglet Budget (case « Éligible subvention »)." />
          </p>
          <p className={`text-lg font-black ${dm ? 'text-violet-300' : 'text-violet-700'}`}>{fmt(subventionRegionTotal)}</p>
          {subventionRegionTotal === 0 && (
            <p className={`text-xs mt-1 ${cl.muted}`}>Cochez des agents éligibles</p>
          )}
        </div>
        <div className={`rounded-2xl p-4 border ${dm ? 'bg-red-900/20 border-red-800/50' : 'bg-red-50 border-red-200'}`}>
          <p className={`text-xs font-bold mb-1 flex items-center gap-1 ${dm ? 'text-red-400' : 'text-red-600'}`}>
            Masse salariale
            <HelpIcon type="info" position="bottom" content="Masse salariale totale : Siège + Pôle Support + tous les services. Inclut salaires bruts, charges patronales et prime Ségur. Calculée dynamiquement depuis l'onglet Budget." />
          </p>
          <p className={`text-lg font-black ${dm ? 'text-red-300' : 'text-red-700'}`}>{fmt(salairesTotaux)}</p>
        </div>
        <div className={`rounded-2xl p-4 border ${dm ? 'bg-orange-900/20 border-orange-800/50' : 'bg-orange-50 border-orange-200'}`}>
          <p className={`text-xs font-bold mb-1 flex items-center gap-1 ${dm ? 'text-orange-400' : 'text-orange-600'}`}>
            Charges d'exploitation
            <HelpIcon type="info" position="bottom" content="Total des charges d'exploitation (loyers, fournitures, assurances, etc.) de tous les entités. Hors masse salariale et investissements." />
          </p>
          <p className={`text-lg font-black ${dm ? 'text-orange-300' : 'text-orange-700'}`}>{fmt(exploitationTotale)}</p>
        </div>
        <div className={`rounded-2xl p-4 border-2 ${
          enveloppeGlobale > 0 ? dm ? 'bg-emerald-900/20 border-emerald-600' : 'bg-emerald-50 border-emerald-400'
          : enveloppeGlobale < 0 ? dm ? 'bg-red-900/20 border-red-700'       : 'bg-red-50 border-red-300'
          : dm ? 'bg-zinc-700 border-zinc-600' : 'bg-slate-50 border-slate-300'
        }`}>
          <p className={`text-xs font-bold mb-1 flex items-center gap-1 ${
            enveloppeGlobale > 0 ? dm ? 'text-emerald-400' : 'text-emerald-600'
            : enveloppeGlobale < 0 ? dm ? 'text-red-400'   : 'text-red-600'
            : cl.muted
          }`}>
            Enveloppe nette disponible
            <HelpIcon type="warning" position="left" content="Enveloppe nette = Subvention Région − (Masse salariale + Exploitation). Si positive : marge disponible pour financer le plan de formation. Si négative : la subvention ne couvre pas les charges — déficit à compenser par d'autres recettes." />
          </p>
          <p className={`text-lg font-black ${envColor(enveloppeGlobale)}`}>{fmt(enveloppeGlobale)}</p>
          {enveloppeGlobale < 0 && (
            <p className={`text-xs mt-0.5 flex items-center gap-1 ${dm ? 'text-red-400' : 'text-red-500'}`}>
              <AlertTriangle size={10} /> Subvention insuffisante
            </p>
          )}
        </div>
      </div>

      {/* ── Alerte filières en déficit ── */}
      {lignes.filter(l => l.enveloppe < 0).length > 0 && (
        <div className={`rounded-2xl p-4 mb-5 flex flex-wrap items-start gap-3 border-2 ${dm ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-300'}`}>
          <AlertTriangle className={dm ? 'text-red-400 flex-shrink-0 mt-0.5' : 'text-red-500 flex-shrink-0 mt-0.5'} size={18} />
          <div className="flex-1">
            <p className={`text-sm font-black mb-1 ${dm ? 'text-red-300' : 'text-red-700'}`}>
              {lignes.filter(l => l.enveloppe < 0).length} filière{lignes.filter(l => l.enveloppe < 0).length > 1 ? 's' : ''} en déficit
            </p>
            <div className="flex flex-wrap gap-2">
              {lignes.filter(l => l.enveloppe < 0).map(l => (
                <span key={l.id} className={`text-xs font-bold px-2.5 py-1 rounded-lg ${dm ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-700'}`}>
                  {l.label} : {fmt(l.enveloppe)}
                </span>
              ))}
            </div>
            <p className={`text-xs mt-1.5 ${dm ? 'text-red-400/70' : 'text-red-500/80'}`}>
              La subvention affectée à ces filières ne couvre pas leurs charges — ajustez les clés ou complétez par d'autres recettes.
            </p>
          </div>
        </div>
      )}

      {/* ── Synthèse de répartition (100% ventilé par filière) ── */}
      {showSynthese && (
        <div className={`rounded-2xl border p-4 mb-5 ${dm ? 'bg-zinc-700/60 border-zinc-600' : 'bg-white border-slate-200'}`}>
          <p className={`text-xs font-black uppercase tracking-widest mb-3 ${cl.muted}`}>
            Synthèse de répartition — ventilation des charges totales ({fmt(chargesTotales)})
          </p>
          {/* Barre 100% par filière */}
          <div className="flex h-7 rounded-xl overflow-hidden mb-3 gap-px">
            {lignes.map((l, i) => (
              <div
                key={l.id}
                style={{ width: `${l.cle}%`, backgroundColor: FILIERE_COLORS[i % FILIERE_COLORS.length] }}
                title={`${l.label} : ${l.cle}% — ${fmt(l.charges)}`}
                className="h-full flex items-center justify-center"
              >
                {l.cle >= 8 && (
                  <span className="text-white text-[10px] font-black truncate px-1">{l.cle}%</span>
                )}
              </div>
            ))}
          </div>
          {/* Légende */}
          <div className="flex flex-wrap gap-2">
            {lignes.map((l, i) => (
              <div key={l.id} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: FILIERE_COLORS[i % FILIERE_COLORS.length] }} />
                <span className={`text-xs font-bold ${cl.title}`}>{l.label}</span>
                <span className={`text-xs ${cl.muted}`}>{fmt(l.charges)}</span>
              </div>
            ))}
          </div>
          {/* Taux de couverture par filière */}
          <div className={`mt-3 pt-3 border-t ${cl.border} grid grid-cols-3 md:grid-cols-6 gap-2`}>
            {lignes.map((l, i) => {
              const taux = l.charges > 0 ? Math.round(l.subvention / l.charges * 100) : 0;
              return (
                <div key={l.id} className={`text-center p-2 rounded-xl ${dm ? 'bg-zinc-800' : 'bg-slate-50'}`}>
                  <p className={`text-xs font-bold truncate ${cl.muted}`}>{l.label}</p>
                  <p className={`text-sm font-black ${taux >= 100 ? dm ? 'text-emerald-300' : 'text-emerald-700' : taux >= 70 ? dm ? 'text-amber-300' : 'text-amber-600' : dm ? 'text-red-400' : 'text-red-600'}`}>
                    {taux}%
                  </p>
                  <p className={`text-[10px] ${cl.muted}`}>couverture</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Tableau filières ── */}
      <div className={`rounded-2xl overflow-hidden border ${cl.border}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={cl.thead}>
                <th className="px-4 py-2.5 text-left font-black whitespace-nowrap">Filière</th>
                <th className="px-4 py-2.5 text-center font-black whitespace-nowrap">
                  <span className="flex items-center justify-center gap-1">
                    Clé
                    <HelpIcon type="info" position="bottom" content="Pourcentage de répartition des charges sur cette filière. La somme de toutes les clés doit être égale à 100 %. Exemple : si la filière ES représente 40 % de l'activité, saisir 40." />
                  </span>
                </th>
                <th className="px-4 py-2.5 text-right font-black whitespace-nowrap">
                  <span className="flex items-center justify-end gap-1">
                    Subv. Région
                    <HelpIcon type="info" position="bottom" content="Part de la subvention Région affectée à cette filière = Subvention totale × clé ÷ 100." />
                  </span>
                </th>
                <th className="px-4 py-2.5 text-right font-black whitespace-nowrap">Salaires</th>
                <th className="px-4 py-2.5 text-right font-black whitespace-nowrap">Exploitation</th>
                <th className="px-4 py-2.5 text-right font-black whitespace-nowrap">
                  <span className="flex items-center justify-end gap-1">
                    Charges totales
                    <HelpIcon type="info" position="bottom" content="Charges totales filière = (Masse salariale + Exploitation) × clé ÷ 100." />
                  </span>
                </th>
                <th className="px-4 py-2.5 text-right font-black whitespace-nowrap">
                  <span className="flex items-center justify-end gap-1">
                    Enveloppe nette
                    <HelpIcon type="warning" position="bottom" content="Enveloppe nette = Subvention filière − Charges filière. Montant disponible pour financer les actions de formation continue du personnel de cette filière." />
                  </span>
                </th>
                <th className="px-4 py-2.5 text-right font-black whitespace-nowrap">
                  <span className="flex items-center justify-end gap-1">
                    Mensuel
                    <HelpIcon type="info" position="bottom" content="Enveloppe nette ÷ 12 — budget mensuel disponible pour la formation continue de cette filière." />
                  </span>
                </th>
                {showSeuilCol && (
                  <th className="px-4 py-2.5 text-right font-black whitespace-nowrap">
                    <span className="flex items-center justify-end gap-1">
                      Seuil / étud.
                      <HelpIcon type="info" position="bottom" content="Effectif minimum pour couvrir les charges de la filière. Saisir la recette moyenne par étudiant (droits d'inscription + subvention par place) en mode édition. Seuil = ⌈Charges filière ÷ Recette/étud.⌉" />
                    </span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {lignes.map((l, i) => (
                <tr key={l.id} className={`border-t ${cl.border} ${i % 2 === 0 ? cl.row0 : cl.row1}`}>
                  <td className={`px-4 py-3 font-bold ${cl.title}`}>
                    {editCles ? (
                      <input
                        value={filieres.find(f => f.id === l.id)?.label ?? l.label}
                        onChange={e => updateFiliere(l.id, 'label', e.target.value)}
                        className={`rounded-lg px-2 py-1 text-sm font-bold border outline-none w-28 ${cl.inp}`}
                      />
                    ) : l.label}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {editCles ? (
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number" min="0" max="100" step="0.01"
                          value={filieres.find(f => f.id === l.id)?.cle ?? l.cle}
                          onChange={e => updateFiliere(l.id, 'cle', parseFloat(e.target.value) || 0)}
                          className={`rounded-lg px-2 py-1 text-sm font-bold text-center border outline-none w-20 ${cl.inp}`}
                        />
                        <span className={`text-xs ${cl.muted}`}>%</span>
                      </div>
                    ) : (
                      <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                        dm ? 'bg-violet-900/40 text-violet-300' : 'bg-violet-100 text-violet-700'
                      }`}>{l.cle}%</span>
                    )}
                  </td>
                  <td className={`px-4 py-3 text-right font-mono ${dm ? 'text-violet-300' : 'text-violet-700'}`}>{fmt(l.subvention)}</td>
                  <td className={`px-4 py-3 text-right font-mono ${dm ? 'text-red-300' : 'text-red-600'}`}>{fmt(l.salaires)}</td>
                  <td className={`px-4 py-3 text-right font-mono ${dm ? 'text-orange-300' : 'text-orange-600'}`}>{fmt(l.exploitation)}</td>
                  <td className={`px-4 py-3 text-right font-mono font-bold ${dm ? 'text-zinc-300' : 'text-slate-700'}`}>{fmt(l.charges)}</td>
                  <td className={`px-4 py-3 text-right font-black ${envColor(l.enveloppe)}`}>{fmt(l.enveloppe)}</td>
                  <td className={`px-4 py-3 text-right ${cl.muted}`}>{fmt(l.mensuel)}/m</td>
                  {showSeuilCol && (() => {
                    const rpe = parseFloat(filieres.find(f => f.id === l.id)?.recetteParEtudiant) || 0;
                    const seuil = rpe > 0 ? Math.ceil(l.charges / rpe) : null;
                    return (
                      <td className="px-4 py-3 text-right">
                        {editCles ? (
                          <div className="flex items-center justify-end gap-1">
                            <input
                              type="number" min="0" step="100"
                              value={filieres.find(f => f.id === l.id)?.recetteParEtudiant ?? ''}
                              placeholder="€/étud."
                              onChange={e => updateFiliere(l.id, 'recetteParEtudiant', parseFloat(e.target.value) || 0)}
                              className={`rounded-lg px-2 py-1 text-xs font-bold text-right border outline-none w-24 ${cl.inp}`}
                            />
                          </div>
                        ) : seuil !== null ? (
                          <span className={`font-black text-sm ${dm ? 'text-teal-300' : 'text-teal-700'}`}>
                            ≥ {seuil} étud.
                          </span>
                        ) : <span className={`text-xs ${cl.muted}`}>—</span>}
                      </td>
                    );
                  })()}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className={`border-t-2 ${cl.border} ${cl.tfoot}`}>
                <td className="px-4 py-2.5 font-black">TOTAL</td>
                <td className="px-4 py-2.5 text-center">
                  <span className={`font-black ${Math.abs(totalCles - 100) > 0.05 ? 'text-red-500' : dm ? 'text-emerald-300' : 'text-emerald-700'}`}>
                    {totalCles.toFixed(2)}%
                    {Math.abs(totalCles - 100) > 0.05 && <span className="ml-1 text-xs"> ≠ 100%</span>}
                  </span>
                </td>
                <td className={`px-4 py-2.5 text-right font-mono font-black ${dm ? 'text-violet-300' : 'text-violet-700'}`}>{fmt(subventionRegionTotal)}</td>
                <td className={`px-4 py-2.5 text-right font-mono font-black ${dm ? 'text-red-300' : 'text-red-600'}`}>{fmt(salairesTotaux)}</td>
                <td className={`px-4 py-2.5 text-right font-mono font-black ${dm ? 'text-orange-300' : 'text-orange-600'}`}>{fmt(exploitationTotale)}</td>
                <td className={`px-4 py-2.5 text-right font-mono font-black ${dm ? 'text-zinc-300' : 'text-slate-700'}`}>{fmt(chargesTotales)}</td>
                <td className={`px-4 py-2.5 text-right font-black ${envColor(enveloppeGlobale)}`}>{fmt(enveloppeGlobale)}</td>
                <td className={`px-4 py-2.5 text-right ${cl.muted}`}>{fmt(enveloppeGlobale / 12)}/m</td>
                {showSeuilCol && <td />}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ── Couverture plan d'actions vs enveloppe calculée (2.5) ── */}
      {actions.length > 0 && enveloppeGlobale !== 0 && (
        <div className={`mt-4 p-4 rounded-2xl border ${dm ? 'bg-zinc-700/40 border-zinc-600' : 'bg-white border-slate-200'}`}>
          <p className={`text-xs font-black uppercase tracking-widest mb-3 ${cl.muted}`}>
            Plan d'actions de formation — couverture par filière
          </p>
          <div className="space-y-3">
            {lignes.map((l, i) => {
              const conso = consoParFiliere[l.id] || 0;
              if (l.enveloppe <= 0 && conso === 0) return null;
              const tauxCouv = l.enveloppe > 0 ? Math.min(200, Math.round(conso / l.enveloppe * 100)) : (conso > 0 ? 100 : 0);
              const surcharge = l.enveloppe > 0 && conso > l.enveloppe;
              return (
                <div key={l.id}>
                  <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: FILIERE_COLORS[i % FILIERE_COLORS.length] }} />
                      <span className={`text-xs font-bold ${cl.title}`}>{l.label}</span>
                    </span>
                    <span className="flex items-center gap-3 text-xs">
                      <span className={cl.muted}>Enveloppe : <span className={`font-bold ${envColor(l.enveloppe)}`}>{fmt(l.enveloppe)}</span></span>
                      <span className={cl.muted}>Plan : <span className={`font-bold ${surcharge ? (dm ? 'text-red-400' : 'text-red-600') : (dm ? 'text-emerald-300' : 'text-emerald-700')}`}>{fmt(conso)}</span></span>
                      <span className={`font-black ${tauxCouv > 100 ? (dm ? 'text-red-400' : 'text-red-600') : tauxCouv >= 50 ? (dm ? 'text-amber-300' : 'text-amber-600') : (dm ? 'text-zinc-400' : 'text-slate-500')}`}>
                        {tauxCouv}%
                      </span>
                    </span>
                  </div>
                  {l.enveloppe > 0 && (
                    <div className={`h-2 rounded-full overflow-hidden ${dm ? 'bg-zinc-600' : 'bg-slate-200'}`}>
                      <div
                        className={`h-full rounded-full transition-all ${surcharge ? 'bg-red-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(100, tauxCouv)}%` }}
                      />
                    </div>
                  )}
                  {surcharge && (
                    <p className={`text-xs mt-0.5 flex items-center gap-1 ${dm ? 'text-red-400' : 'text-red-600'}`}>
                      <AlertTriangle size={10} /> Dépassement de {fmt(conso - l.enveloppe)} — plan supérieur à l'enveloppe calculée
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          <div className={`mt-3 pt-3 border-t ${cl.border} flex flex-wrap gap-4 text-xs`}>
            <span className={cl.muted}>
              Total plan (hors annulé) : <span className={`font-black ${dm ? 'text-white' : 'text-slate-800'}`}>{fmt(Object.values(consoParFiliere).reduce((s, v) => s + v, 0))}</span>
            </span>
            <span className={cl.muted}>
              Enveloppe globale : <span className={`font-black ${envColor(enveloppeGlobale)}`}>{fmt(enveloppeGlobale)}</span>
            </span>
          </div>
        </div>
      )}

      {/* Seuils d'équilibre (3.1) */}
      {hasSeuil && (() => {
        const alertes = lignes.filter(l => {
          const rpe = parseFloat(filieres.find(f => f.id === l.id)?.recetteParEtudiant) || 0;
          const seuil = rpe > 0 ? Math.ceil(l.charges / rpe) : null;
          const eff = parseFloat(filieres.find(f => f.id === l.id)?.effectifActuel) || 0;
          return seuil !== null && eff > 0 && eff < seuil;
        });
        const infos = lignes.filter(l => {
          const rpe = parseFloat(filieres.find(f => f.id === l.id)?.recetteParEtudiant) || 0;
          const seuil = rpe > 0 ? Math.ceil(l.charges / rpe) : null;
          const eff = parseFloat(filieres.find(f => f.id === l.id)?.effectifActuel) || 0;
          return seuil !== null && eff === 0;
        });
        if (alertes.length === 0 && infos.length === 0) return null;
        return (
          <div className={`mt-3 p-3 rounded-xl border ${dm ? 'bg-zinc-700/40 border-zinc-600' : 'bg-slate-50 border-slate-200'}`}>
            <p className={`text-xs font-black uppercase tracking-widest mb-2 ${cl.muted}`}>Seuils d'équilibre</p>
            <div className="space-y-1.5">
              {lignes.filter(l => (parseFloat(filieres.find(f => f.id === l.id)?.recetteParEtudiant) || 0) > 0).map(l => {
                const rpe = parseFloat(filieres.find(f => f.id === l.id)?.recetteParEtudiant) || 0;
                const eff = parseFloat(filieres.find(f => f.id === l.id)?.effectifActuel) || 0;
                const seuil = Math.ceil(l.charges / rpe);
                const ok = eff === 0 || eff >= seuil;
                return (
                  <div key={l.id} className="flex items-center gap-3 text-xs flex-wrap">
                    <span className={`font-bold w-20 shrink-0 ${cl.title}`}>{l.label}</span>
                    <span className={cl.muted}>{fmt(l.charges)} ÷ {fmt(rpe)}/étud. =</span>
                    <span className={`font-black ${ok ? (dm ? 'text-emerald-300' : 'text-emerald-700') : (dm ? 'text-red-400' : 'text-red-600')}`}>
                      seuil {seuil} étudiants
                    </span>
                    {eff > 0 && (
                      <span className={`flex items-center gap-1 font-bold ${ok ? (dm ? 'text-emerald-400' : 'text-emerald-600') : (dm ? 'text-red-400' : 'text-red-600')}`}>
                        {ok ? '✓' : <><AlertTriangle size={10} className="shrink-0" /></>}
                        Effectif actuel : {eff} {!ok && `(-${seuil - eff} manquants)`}
                      </span>
                    )}
                    {editCles && (
                      <input type="number" min="0" step="1" placeholder="Effectif actuel"
                        value={filieres.find(f => f.id === l.id)?.effectifActuel ?? ''}
                        onChange={e => updateFiliere(l.id, 'effectifActuel', parseInt(e.target.value) || 0)}
                        className={`rounded-lg px-2 py-0.5 text-xs font-bold border outline-none w-24 ${cl.inp}`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Alerte clés ≠ 100% */}
      {editCles && Math.abs(totalCles - 100) > 0.05 && (
        <div className={`mt-3 p-3 rounded-xl flex items-center gap-2 text-sm ${
          dm ? 'bg-red-900/20 border border-red-700 text-red-300' : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          <AlertTriangle size={14} />
          La somme des clés ({totalCles.toFixed(2)}%) doit être égale à 100%.
          <button onClick={resetFilieres} className="ml-auto underline font-bold text-xs">Réinitialiser</button>
        </div>
      )}
    </div>
  );
}
