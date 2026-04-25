import React, { useRef } from 'react';
import { Save, Upload, Download, Printer, Key, RotateCcw, Monitor, Shield, Users, Layers, Camera, Cog, Target, Calculator, FileSpreadsheet, Trash2, LogOut, HelpCircle, Moon, Sun, Clock, Lock, CheckCircle, Send, FileEdit } from 'lucide-react';
import { exportToExcel, exportReportingFC } from '../../utils/excelExport';
import { exportToPDF } from '../../utils/pdfExport';
import { exportFEC } from '../../utils/fecExport';
import SnapshotManager from '../SnapshotManager';
import ScenariosManager from '../ScenariosManager';
import DafLockPanel from '../DafLockPanel';
import InfoTooltip from '../ui/Tooltip';
import { validerTaux } from '../../utils/calculations';
import { repartirFraisSiege } from '../../utils/calculations';
import { TARIFS_VACATAIRES } from '../../utils/constants';

export default function TabParametres({
  darkMode,
  setDarkMode,
  direction,
  poleSupport,
  services,
  poolRH,
  globalParams,
  setGlobalParams,
  setShowPasswordModal,
  setShowRolesModal,
  setShowImportN1,
  setShowWizardBP,
  isLocalhost,
  sauvegarderBudget,
  genererCSVComptable,
  telechargerCSVComptable,
  compareSnapshot,
  setCompareSnapshot,
  fileInputRef,
  chargerBudget,
  restaurerBackup,
  handleLogout,
  setPresentationMode,
  setSlideIndex,
  setShowResetModal,
  showTooltips,
  setShowTooltips,
  donneesN1,
  repartirSiege,
  setRepartirSiege,
  getBudgetDirection,
  getBudgetService,
  setShowHardReset,
  auditTrail = [],
  appendAuditEntry,
  dafMode,
}) {
  const dafLocked = !!dafMode?.dafLocked;
  const lockedInputCls = dafLocked ? 'opacity-60 cursor-not-allowed' : '';
  const LockBadge = () => dafLocked ? (
    <span title="Verrouillé — réservé au profil DAF" className="inline-flex items-center gap-1 text-[10px] font-bold ml-2 px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
      <Lock size={10} /> DAF
    </span>
  ) : null;
  return (
<div className="space-y-6 max-w-3xl mx-auto">

  <DafLockPanel
    darkMode={darkMode}
    dafConfigured={dafMode?.dafConfigured}
    dafUnlocked={dafMode?.dafUnlocked}
    dafLocked={dafLocked}
    setupDaf={dafMode?.setupDaf}
    unlockDaf={dafMode?.unlockDaf}
    lockDaf={dafMode?.lockDaf}
    resetDaf={dafMode?.resetDaf}
    appendAuditEntry={appendAuditEntry}
  />

  {/* Paramètres globaux */}
  <div className={`rounded-3xl border p-6 shadow-md ${darkMode ? 'bg-zinc-900/80 border-zinc-700/30' : 'bg-white border-slate-100/80'}`}>
    <h2 className={`text-lg font-black mb-5 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
      <Cog size={20} className="text-teal-500" /> Paramètres globaux
    </h2>
    {/* ── Workflow d'approbation (4.1 / 4.3) ── */}
    {(() => {
      const statut = globalParams.statutBudget || 'brouillon';
      const STATUTS = [
        { id: 'brouillon', label: 'Brouillon', icon: <FileEdit size={14}/>, desc: 'Budget en cours de saisie. Toutes les modifications sont autorisées.' },
        { id: 'soumis',    label: 'Soumis',    icon: <Send size={14}/>,     desc: 'Budget soumis pour validation. La saisie reste ouverte mais le budget est marqué pour revue.' },
        { id: 'valide',    label: 'Validé',    icon: <CheckCircle size={14}/>, desc: 'Budget approuvé par la direction. Un avertissement s\'affiche avant toute modification.' },
        { id: 'gele',      label: 'Gelé',      icon: <Lock size={14}/>,     desc: 'Budget gelé. Les données sont en lecture seule (hors paramètres). Protège l\'historique.' },
      ];
      const idx = STATUTS.findIndex(s => s.id === statut);
      const current = STATUTS[idx] || STATUTS[0];
      const COLORS = {
        brouillon: { bg: darkMode ? 'bg-slate-700/60 border-slate-600' : 'bg-slate-50 border-slate-300', badge: darkMode ? 'bg-slate-600 text-slate-200' : 'bg-slate-200 text-slate-700', btn: darkMode ? 'bg-blue-700/40 text-blue-300 hover:bg-blue-700/60' : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200' },
        soumis:    { bg: darkMode ? 'bg-blue-900/30 border-blue-700'   : 'bg-blue-50 border-blue-300',   badge: darkMode ? 'bg-blue-700 text-blue-200'   : 'bg-blue-100 text-blue-700',   btn: darkMode ? 'bg-emerald-700/40 text-emerald-300 hover:bg-emerald-700/60' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200' },
        valide:    { bg: darkMode ? 'bg-emerald-900/30 border-emerald-700' : 'bg-emerald-50 border-emerald-300', badge: darkMode ? 'bg-emerald-700 text-emerald-200' : 'bg-emerald-100 text-emerald-700', btn: darkMode ? 'bg-violet-700/40 text-violet-300 hover:bg-violet-700/60' : 'bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200' },
        gele:      { bg: darkMode ? 'bg-violet-900/30 border-violet-700' : 'bg-violet-50 border-violet-300', badge: darkMode ? 'bg-violet-700 text-violet-200' : 'bg-violet-100 text-violet-700', btn: darkMode ? 'bg-red-700/40 text-red-300 hover:bg-red-700/60' : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200' },
      };
      const col = COLORS[statut] || COLORS.brouillon;
      const setStatut = (s) => setGlobalParams({ ...globalParams, statutBudget: s });

      return (
        <div className={`mb-4 rounded-2xl p-4 border-2 ${col.bg}`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-sm font-black uppercase tracking-widest flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              <Lock size={16} /> Workflow — Statut du budget
            </span>
            <span className={`flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full ${col.badge}`}>
              {current.icon} {current.label}
            </span>
          </div>
          <p className={`text-xs mb-3 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{current.desc}</p>
          {/* Pipeline visuel */}
          <div className="flex items-center gap-1 mb-3 text-[10px] font-bold">
            {STATUTS.map((s, i) => (
              <React.Fragment key={s.id}>
                <span className={`flex items-center gap-1 px-2 py-1 rounded-lg ${s.id === statut ? (darkMode ? 'bg-white/20 text-white' : 'bg-slate-800 text-white') : (darkMode ? 'text-gray-500' : 'text-slate-400')}`}>
                  {s.icon} {s.label}
                </span>
                {i < STATUTS.length - 1 && <span className={darkMode ? 'text-gray-600' : 'text-slate-300'}>→</span>}
              </React.Fragment>
            ))}
          </div>
          {/* Boutons de transition */}
          <div className="flex flex-wrap gap-2">
            {statut !== 'gele' && idx < STATUTS.length - 1 && (
              <button onClick={() => setStatut(STATUTS[idx + 1].id)}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors ${col.btn}`}>
                {STATUTS[idx + 1].icon} Passer à « {STATUTS[idx + 1].label} »
              </button>
            )}
            {statut !== 'brouillon' && statut !== 'gele' && (
              <button onClick={() => setStatut(STATUTS[idx - 1].id)}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'}`}>
                <RotateCcw size={12} /> Revenir à « {STATUTS[idx - 1].label} »
              </button>
            )}
            {statut === 'gele' && (
              <button onClick={() => { if (window.confirm('Dégeler le budget ? Les données seront à nouveau modifiables.')) setStatut('valide'); }}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors ${darkMode ? 'bg-red-900/40 text-red-300 hover:bg-red-900/60' : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'}`}>
                <Lock size={12} /> Dégeler (repasser en Validé)
              </button>
            )}
          </div>
        </div>
      );
    })()}

    {/* ── Coefficient BP global ── */}
    <div className={`mb-4 rounded-2xl p-4 border-2 ${(globalParams.coefficientBP ?? 100) !== 100 ? (darkMode ? 'bg-amber-900/20 border-amber-600' : 'bg-amber-50 border-amber-400') : (darkMode ? 'bg-zinc-800/60 border-zinc-700' : 'bg-slate-50 border-slate-200')}`}>
      <div className="flex items-center justify-between mb-2">
        <InfoTooltip content="Coefficient appliqué à toutes les charges d'exploitation et recettes dans tous les onglets. 100 % = budget plein. Ex : 85 % = scenario de réduction ou de réalisation partielle. La masse salariale n'est pas affectée." darkMode={darkMode} position="top">
          <label className={`text-sm font-black uppercase tracking-widest cursor-help flex items-center gap-2 ${(globalParams.coefficientBP ?? 100) !== 100 ? (darkMode ? 'text-amber-300' : 'text-amber-700') : (darkMode ? 'text-white' : 'text-slate-800')}`}>
            <Calculator size={16} /> Coefficient BP — charges &amp; recettes
          </label>
        </InfoTooltip>
        {(globalParams.coefficientBP ?? 100) !== 100 && (
          <button onClick={() => setGlobalParams({...globalParams, coefficientBP: 100})}
            className={`text-xs px-2 py-1 rounded-lg font-bold ${darkMode ? 'bg-amber-700/40 text-amber-300 hover:bg-amber-700/60' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}>
            Réinitialiser à 100 %
          </button>
        )}
      </div>
      <div className="flex items-center gap-3">
        <input type="number" step="0.1" min="0" max="200"
          value={globalParams.coefficientBP ?? 100}
          onChange={(e) => setGlobalParams({...globalParams, coefficientBP: Math.max(0, Math.min(200, parseFloat(e.target.value) || 100))})}
          className={`rounded-xl px-3 py-2 font-black text-2xl outline-none w-28 border ${(globalParams.coefficientBP ?? 100) !== 100 ? (darkMode ? 'bg-gray-700 text-amber-300 border-amber-600' : 'bg-white text-amber-700 border-amber-400') : (darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-slate-300')}`}
        />
        <span className={`text-2xl font-black ${(globalParams.coefficientBP ?? 100) !== 100 ? (darkMode ? 'text-amber-400' : 'text-amber-600') : (darkMode ? 'text-gray-400' : 'text-slate-500')}`}>%</span>
        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Appliqué à toutes les charges d'exploitation et recettes — transversal à tous les onglets</p>
      </div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className={`rounded-2xl p-4 border ${darkMode ? 'bg-teal-900/20 border-teal-800' : 'bg-teal-50 border-teal-200'}`}>
        <InfoTooltip content="Taux d'augmentation général des salaires appliqué à tous les agents chaque année dans les projections N+1 et N+2. Distinct du GVT qui est lié à l'ancienneté." darkMode={darkMode} position="top">
          <label className={`text-xs font-bold uppercase tracking-widest cursor-help flex items-center ${darkMode ? 'text-teal-400' : 'text-teal-600'}`}>Augmentation salariale annuelle<LockBadge /></label>
        </InfoTooltip>
        <div className="flex items-center gap-2">
          <input type="number" step="0.1" value={globalParams.augmentationAnnuelle}
            disabled={dafLocked}
            onChange={(e) => setGlobalParams({...globalParams, augmentationAnnuelle: validerTaux(e.target.value)})}
            className={`rounded-xl px-3 py-2 font-black text-2xl outline-none w-24 border ${lockedInputCls} ${darkMode ? 'bg-gray-700 text-teal-300 border-teal-700' : 'bg-white text-teal-700 border-teal-200'}`}
          />
          <span className={`text-2xl font-black ${darkMode ? 'text-teal-400' : 'text-teal-600'}`}>%</span>
        </div>
        <p className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Appliqué aux charges d'exploitation pour les années N+1 et N+2</p>
      </div>
      <div className={`rounded-2xl p-4 border ${darkMode ? 'bg-indigo-900/20 border-indigo-800' : 'bg-indigo-50 border-indigo-200'}`}>
        <InfoTooltip content="Hausse automatique de la masse salariale liée aux progressions de carrière (ancienneté, changements d'échelon, promotions). S'applique aux salaires en plus de l'augmentation générale. Typiquement 1 à 2% par an dans le secteur médico-social." darkMode={darkMode} position="top">
          <label className={`text-xs font-bold uppercase tracking-widest cursor-help flex items-center ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>GVT — Glissement Vieillesse Technicité<LockBadge /></label>
        </InfoTooltip>
        <div className="flex items-center gap-2">
          <input type="number" step="0.1" min="0" max="10" value={globalParams.tauxGVT ?? 1.5}
            disabled={dafLocked}
            onChange={(e) => setGlobalParams({...globalParams, tauxGVT: validerTaux(e.target.value)})}
            className={`rounded-xl px-3 py-2 font-black text-2xl outline-none w-24 border ${lockedInputCls} ${darkMode ? 'bg-gray-700 text-indigo-300 border-indigo-700' : 'bg-white text-indigo-700 border-indigo-200'}`}
          />
          <span className={`text-2xl font-black ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>%/an</span>
        </div>
        <p className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Hausse annuelle automatique des salaires (échelons, ancienneté) — s'ajoute à l'inflation</p>
      </div>
      <div className={`rounded-2xl p-4 border col-span-2 ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
        <label className={`text-xs font-bold uppercase tracking-widest block mb-3 flex items-center ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Inflation différenciée — Synthèse N+1 / N+2<LockBadge /></label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: 'inflationEnergie', label: 'Énergie', color: 'amber', default: 8.0 },
            { key: 'inflationLoyers', label: 'Loyers', color: 'orange', default: 3.5 },
            { key: 'inflationAutres', label: 'Autres charges', color: 'slate', default: 2.5 },
          ].map(({ key, label, color, default: def }) => (
            <div key={key}>
              <label className={`text-xs font-semibold block mb-1 ${darkMode ? `text-${color}-400` : `text-${color}-600`}`}>{label}</label>
              <div className="flex items-center gap-1">
                <input type="number" step="0.1" min="0" max="50" value={globalParams[key] ?? def}
                  disabled={dafLocked}
                  onChange={(e) => setGlobalParams({...globalParams, [key]: validerTaux(e.target.value)})}
                  className={`rounded-lg px-2 py-1 font-black text-lg outline-none w-16 border ${lockedInputCls} ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-slate-200'}`}
                />
                <span className={`font-bold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>%</span>
              </div>
            </div>
          ))}
        </div>
        <p className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Appliqués aux charges d'exploitation selon leur nature (label des lignes) pour les projections N+1 et N+2</p>
      </div>
      <div className={`rounded-2xl p-4 border ${darkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'}`}>
        <InfoTooltip content="Montant mensuel brut de la prime Ségur de la santé, versée par ETP à chaque agent éligible (case Ségur cochée sur la fiche agent). Soumise aux charges patronales. Montant fixé à 238 €/mois depuis les accords 2021." darkMode={darkMode} position="top">
          <label className={`text-xs font-bold uppercase tracking-widest cursor-help flex items-center ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>Prime Ségur médico-social / ETP<LockBadge /></label>
        </InfoTooltip>
        <div className="flex items-center gap-2">
          <input type="number" step="1" min="0" value={globalParams.montantSegurETP ?? 238}
            disabled={dafLocked}
            onChange={(e) => setGlobalParams({...globalParams, montantSegurETP: parseInt(e.target.value) || 0})}
            className={`rounded-xl px-3 py-2 font-black text-2xl outline-none w-28 border ${lockedInputCls} ${darkMode ? 'bg-gray-700 text-blue-300 border-blue-700' : 'bg-white text-blue-700 border-blue-200'}`}
          />
          <span className={`text-lg font-black ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>€/mois</span>
        </div>
        <p className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Montant brut ajouté au salaire des agents éligibles</p>
      </div>
      <div className={`rounded-2xl p-4 border ${(globalParams.tauxChargesPatronales ?? 44) !== 44 ? (darkMode ? 'bg-orange-900/20 border-orange-600' : 'bg-orange-50 border-orange-400') : (darkMode ? 'bg-zinc-800/60 border-zinc-700' : 'bg-slate-50 border-slate-200')}`}>
        <InfoTooltip content="Taux moyen de charges patronales appliqué à la masse salariale CDI/CDD. Valeur par défaut : 44 % (CCN 66 : URSSAF ~40% + prévoyance CHORUM ~3,5% + médecine du travail ~0,5%). La réduction Fillon reste calculée automatiquement par-dessus ce taux." darkMode={darkMode} position="top">
          <label className={`text-xs font-bold uppercase tracking-widest cursor-help flex items-center gap-2 ${(globalParams.tauxChargesPatronales ?? 44) !== 44 ? (darkMode ? 'text-orange-300' : 'text-orange-700') : (darkMode ? 'text-white' : 'text-slate-800')}`}>
            <Calculator size={14} /> Charges patronales CDI/CDD<LockBadge />
          </label>
        </InfoTooltip>
        <div className="flex items-center gap-2 mt-1">
          <input type="number" step="0.1" min="0" max="100"
            value={globalParams.tauxChargesPatronales ?? 44}
            disabled={dafLocked}
            onChange={(e) => setGlobalParams({...globalParams, tauxChargesPatronales: Math.max(0, Math.min(100, parseFloat(e.target.value) || 44))})}
            className={`rounded-xl px-3 py-2 font-black text-2xl outline-none w-24 border ${lockedInputCls} ${(globalParams.tauxChargesPatronales ?? 44) !== 44 ? (darkMode ? 'bg-gray-700 text-orange-300 border-orange-600' : 'bg-white text-orange-700 border-orange-400') : (darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-slate-300')}`}
          />
          <span className={`text-2xl font-black ${(globalParams.tauxChargesPatronales ?? 44) !== 44 ? (darkMode ? 'text-orange-400' : 'text-orange-600') : (darkMode ? 'text-gray-400' : 'text-slate-500')}`}>%</span>
        </div>
        {(globalParams.tauxChargesPatronales ?? 44) === 44 && (
          <p className={`text-xs mt-1.5 font-semibold flex items-center gap-1 ${darkMode ? 'text-teal-400' : 'text-teal-700'}`}>
            ✓ Taux CCN 66 — URSSAF + prévoyance CHORUM/OCIRP + médecine du travail
          </p>
        )}
        {(globalParams.tauxChargesPatronales ?? 44) !== 44 && (
          <p className={`text-xs mt-1 font-semibold ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>⚠ Valeur modifiée — vérifier la conformité CCN 66 / FEHAP avant validation</p>
        )}
        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Taux de base — la réduction Fillon s'applique automatiquement pour les bas salaires</p>
      </div>
      <div>
        <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Solde FD au 01/01 (€)</label>
        <input type="number" className={`w-full rounded-lg px-3 py-2 text-sm border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-slate-300'}`} value={globalParams.soldeFDOuverture ?? 0} onChange={e => setGlobalParams({...globalParams, soldeFDOuverture: parseFloat(e.target.value)||0})} />
        <p className={`text-[10px] mt-0.5 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Compte 19 — report N-1</p>
      </div>
      <div className={`rounded-2xl p-4 border col-span-2 ${globalParams.taxeSalaires ? (darkMode ? 'bg-rose-900/20 border-rose-700' : 'bg-rose-50 border-rose-200') : (darkMode ? 'bg-gray-700/30 border-gray-600' : 'bg-slate-50 border-slate-200')}`}>
        <div className="flex items-center justify-between mb-2">
          <InfoTooltip content="Taxe sur les salaires (CGI art. 231) : due par les associations non assujetties à la TVA sur tout ou partie de leur activité. Taux progressif : 4,25 % jusqu'à 8 985 €, 8,50 % de 8 986 à 17 936 €, 13,60 % au-delà. Saisir le taux moyen effectif de votre structure." darkMode={darkMode} position="top">
            <label className={`text-xs font-bold uppercase tracking-widest cursor-help flex items-center ${globalParams.taxeSalaires ? (darkMode ? 'text-rose-400' : 'text-rose-600') : (darkMode ? 'text-gray-400' : 'text-slate-500')}`}>Taxe sur les salaires<LockBadge /></label>
          </InfoTooltip>
          <button
            onClick={() => !dafLocked && setGlobalParams({...globalParams, taxeSalaires: !globalParams.taxeSalaires})}
            disabled={dafLocked}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${lockedInputCls} ${globalParams.taxeSalaires ? 'bg-rose-500 text-white' : (darkMode ? 'bg-gray-600 text-gray-300' : 'bg-slate-200 text-slate-600')}`}
          >
            {globalParams.taxeSalaires ? 'Active' : 'Inactive'}
          </button>
        </div>
        {globalParams.taxeSalaires && (
          <div className="flex items-center gap-2 mt-1">
            <input type="number" step="0.01" min="0" max="20"
              value={globalParams.tauxTaxeSalaires ?? 4.25}
              disabled={dafLocked}
              onChange={e => setGlobalParams({...globalParams, tauxTaxeSalaires: validerTaux(e.target.value)})}
              className={`rounded-xl px-3 py-2 font-black text-2xl outline-none w-24 border ${lockedInputCls} ${darkMode ? 'bg-gray-700 text-rose-300 border-rose-700' : 'bg-white text-rose-700 border-rose-200'}`}
            />
            <span className={`text-lg font-black ${darkMode ? 'text-rose-400' : 'text-rose-600'}`}>%</span>
            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>appliqué au salaire brut estimé (base légale CGI art. 231 — coût employeur ÷ (1 + taux charges))</span>
          </div>
        )}
        {!globalParams.taxeSalaires && (
          <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Activez si votre association est non assujettie à la TVA (ou partiellement) — impacte trésorerie et synthèse annuelle</p>
        )}
      </div>
    </div>
    <div className={`mt-4 rounded-2xl p-4 border ${globalParams.gestionTVA ? (darkMode ? 'bg-amber-900/20 border-amber-700' : 'bg-amber-50 border-amber-200') : (darkMode ? 'bg-gray-700/30 border-gray-600' : 'bg-slate-50 border-slate-200')}`}>
      <div className="flex items-center justify-between mb-2">
        <InfoTooltip content="Active la gestion TVA sur les lignes d'exploitation. Chaque charge peut être saisie HT ou TTC, avec indication si la TVA est récupérable (déductible) ou non récupérable (coût définitif pour l'asso). Le coût réel intégré dans les budgets est ajusté automatiquement." darkMode={darkMode} position="top">
          <p className={`font-bold cursor-help ${globalParams.gestionTVA ? (darkMode ? 'text-amber-300' : 'text-amber-700') : (darkMode ? 'text-white' : 'text-slate-800')}`}>Gestion TVA sur les charges</p>
        </InfoTooltip>
        <button
          onClick={() => setGlobalParams({...globalParams, gestionTVA: !globalParams.gestionTVA})}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${globalParams.gestionTVA ? 'bg-amber-500 text-white' : (darkMode ? 'bg-gray-600 text-gray-300' : 'bg-slate-200 text-slate-600')}`}
        >
          {globalParams.gestionTVA ? 'Active' : 'Inactive'}
        </button>
      </div>
      {globalParams.gestionTVA ? (
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Taux TVA moyen</span>
          <input type="number" step="0.1" min="0" max="30"
            value={globalParams.tauxTVAMoyen ?? 20}
            onChange={e => setGlobalParams({...globalParams, tauxTVAMoyen: validerTaux(e.target.value)})}
            className={`rounded-lg px-2 py-1 font-black text-lg outline-none w-16 border ${darkMode ? 'bg-gray-700 text-amber-300 border-amber-700' : 'bg-white text-amber-700 border-amber-300'}`}
          />
          <span className={`text-lg font-black ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>%</span>
          <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>utilisé si non précisé sur la ligne</span>
        </div>
      ) : (
        <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Activez pour préciser HT/TTC et récupérabilité TVA sur chaque charge d'exploitation</p>
      )}
    </div>
    <div className={`mt-3 rounded-2xl p-4 border flex items-center justify-between gap-4 ${darkMode ? 'bg-amber-900/20 border-amber-700/50' : 'bg-amber-50 border-amber-200'}`}>
      <div>
        <InfoTooltip content="Seuil d'alerte du taux de couverture (recettes / charges × 100). Si le taux passe sous cette valeur, une alerte est déclenchée dans les tableaux de bord. L'objectif cible reste toujours 100 %." darkMode={darkMode} position="top">
          <p className={`font-bold cursor-help flex items-center gap-1 ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}><Target size={14}/> Seuil d'alerte — taux de couverture</p>
        </InfoTooltip>
        <p className={`text-xs mt-0.5 ${darkMode ? 'text-amber-400/70' : 'text-amber-600/70'}`}>Alerte si taux de couverture &lt; seuil. Objectif cible : 100 %</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <input type="number" step="1" min="50" max="100"
          value={globalParams.seuilCouverture ?? 90}
          onChange={e => setGlobalParams({...globalParams, seuilCouverture: Math.min(100, Math.max(50, parseInt(e.target.value) || 90))})}
          className={`rounded-xl px-3 py-2 font-black text-2xl outline-none w-20 border ${darkMode ? 'bg-gray-700 text-amber-300 border-amber-600' : 'bg-white text-amber-700 border-amber-300'}`}
        />
        <span className={`text-2xl font-black ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>%</span>
      </div>
    </div>
    <div className={`mt-3 rounded-2xl p-4 border flex items-center justify-between ${darkMode ? 'bg-gray-700/40 border-gray-600' : 'bg-slate-50 border-slate-200'}`}>
      <div>
        <p className={`font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>Mode sombre</p>
        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Basculer entre thème clair et sombre</p>
      </div>
      <button onClick={() => setDarkMode(!darkMode)} className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors ${darkMode ? 'bg-yellow-500 text-gray-900' : 'bg-gray-800 text-white'}`}>
        {darkMode ? <><Sun size={16} /> Clair</> : <><Moon size={16} /> Sombre</>}
      </button>
    </div>
    <div className={`mt-3 rounded-2xl p-4 border flex items-center justify-between ${darkMode ? 'bg-gray-700/40 border-gray-600' : 'bg-slate-50 border-slate-200'}`}>
      <div>
        <p className={`font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>Infobulles d'aide</p>
        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Afficher les icônes ? et les explications au survol sur tous les champs</p>
      </div>
      <button onClick={() => setShowTooltips(v => !v)} className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors ${showTooltips ? 'bg-blue-500 text-white' : (darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600')}`}>
        <HelpCircle size={16} /> {showTooltips ? 'Actives' : 'Désactivées'}
      </button>
    </div>
  </div>

  {/* Grille tarifaire vacataires */}
  <div className={`rounded-3xl border p-6 shadow-md ${darkMode ? 'bg-zinc-900/80 border-zinc-700/30' : 'bg-white border-slate-100/80'}`}>
    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
      <h2 className={`text-lg font-black flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
        <Users size={20} className="text-indigo-500" /> Grille tarifaire vacataires<LockBadge />
      </h2>
      <div className="flex items-center gap-2">
        {globalParams.tarifsVacataires && !dafLocked && (
          <button
            onClick={() => setGlobalParams({ ...globalParams, tarifsVacataires: null, tarifsVacatairesUpdatedAt: null })}
            className={`text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 ${darkMode ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            <RotateCcw size={12} /> Réinitialiser
          </button>
        )}
        {globalParams.tarifsVacatairesUpdatedAt && (
          <span className={`text-xs ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
            Mis à jour le {new Date(globalParams.tarifsVacatairesUpdatedAt).toLocaleDateString('fr-FR')}
          </span>
        )}
      </div>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className={`text-xs font-black uppercase tracking-wide ${darkMode ? 'text-zinc-400 border-b border-zinc-700' : 'text-slate-500 border-b border-slate-200'}`}>
            <th className="pb-2 text-left">Prestation</th>
            <th className="pb-2 text-right">Salarié (€/h)</th>
            <th className="pb-2 text-right">Prestataire (€/h)</th>
            <th className="pb-2 text-right">Multiplicateur</th>
          </tr>
        </thead>
        <tbody>
          {(globalParams.tarifsVacataires ?? TARIFS_VACATAIRES).map((t, i) => {
            const updateTarif = (field, val) => {
              if (dafLocked) return;
              const updated = (globalParams.tarifsVacataires ?? TARIFS_VACATAIRES).map((tt, j) =>
                j === i ? { ...tt, [field]: val === '' ? null : parseFloat(val) || null } : tt
              );
              setGlobalParams({ ...globalParams, tarifsVacataires: updated, tarifsVacatairesUpdatedAt: Date.now() });
            };
            return (
              <tr key={t.id} className={`border-t ${darkMode ? 'border-zinc-800' : 'border-slate-100'}`}>
                <td className={`py-1.5 pr-2 font-medium text-xs ${darkMode ? 'text-zinc-300' : 'text-slate-700'}`}>
                  {t.label}{t.note && <span className={`ml-1 text-[10px] ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>({t.note})</span>}
                </td>
                <td className="py-1.5 px-1 text-right">
                  <input
                    type="number" step="0.01" min="0"
                    value={t.salarie ?? ''}
                    placeholder="—"
                    disabled={dafLocked}
                    onChange={e => updateTarif('salarie', e.target.value)}
                    className={`w-20 text-right rounded-lg px-2 py-1 text-sm font-mono border outline-none ${lockedInputCls} ${darkMode ? 'bg-zinc-700 border-zinc-600 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                  />
                </td>
                <td className="py-1.5 px-1 text-right">
                  <input
                    type="number" step="0.01" min="0"
                    value={t.prestataire ?? ''}
                    placeholder="—"
                    disabled={dafLocked}
                    onChange={e => updateTarif('prestataire', e.target.value)}
                    className={`w-20 text-right rounded-lg px-2 py-1 text-sm font-mono border outline-none ${lockedInputCls} ${darkMode ? 'bg-zinc-700 border-zinc-600 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                  />
                </td>
                <td className="py-1.5 pl-1 text-right">
                  <input
                    type="number" step="0.5" min="1"
                    value={t.multiplicateur ?? 1}
                    disabled={dafLocked}
                    onChange={e => updateTarif('multiplicateur', e.target.value === '' ? 1 : e.target.value)}
                    className={`w-16 text-right rounded-lg px-2 py-1 text-sm font-mono border outline-none ${lockedInputCls} ${darkMode ? 'bg-zinc-700 border-zinc-600 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
    <p className={`text-xs mt-3 ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
      Tarifs utilisés dans l'onglet Vacataires pour le calcul du coût employeur. Laissez vide pour "tarif sur appel d'offre".
    </p>
  </div>

  {/* Sauvegarde & Export */}
  <div className={`rounded-3xl border p-6 shadow-md ${darkMode ? 'bg-zinc-900/80 border-zinc-700/30' : 'bg-white border-slate-100/80'}`}>
    <h2 className={`text-lg font-black mb-5 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
      <Save size={20} className="text-teal-500" /> Sauvegarde & Export
    </h2>
    <div className="flex flex-wrap gap-3">
      <button onClick={sauvegarderBudget} className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2"><Save size={18} /> Sauver (JSON)</button>
      <button onClick={() => fileInputRef.current.click()} className={`px-4 py-3 rounded-xl font-bold flex items-center gap-2 border ${darkMode ? 'bg-slate-700 text-white border-slate-600' : 'bg-slate-600 text-white border-slate-700'}`}><Upload size={18} /> Charger (JSON)</button>
      <input type="file" ref={fileInputRef} onChange={chargerBudget} accept=".json" className="hidden" />
      {localStorage.getItem('assoc_backup_last') && (
        <button
          onClick={restaurerBackup}
          title={`Restaurer backup auto (${new Date(localStorage.getItem('assoc_backup_last')).toLocaleString('fr-FR')})`}
          className={`px-4 py-3 rounded-xl font-bold flex items-center gap-2 border-2 transition-colors ${darkMode ? 'border-amber-600 text-amber-400 hover:bg-amber-900/30' : 'border-amber-400 text-amber-700 hover:bg-amber-50'}`}
        >
          <RotateCcw size={18} /> Restaurer backup
        </button>
      )}
      <button onClick={() => exportToExcel(direction, services, globalParams, poleSupport)} className="bg-green-600 text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2"><FileSpreadsheet size={18} /> Export Excel</button>
      <button onClick={() => exportToPDF(direction, services, globalParams, poleSupport)} className="bg-red-600 text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2"><Download size={18} /> Export PDF</button>
      <button
        onClick={() => {
          const csv = genererCSVComptable(direction, services, poleSupport, 2026, getBudgetService, getBudgetDirection, getBudgetPoleSupport);
          telechargerCSVComptable(csv, 2026);
        }}
        className={`px-4 py-3 rounded-xl font-bold flex items-center gap-2 border-2 transition-colors ${darkMode ? 'border-indigo-600 text-indigo-300 hover:bg-indigo-900/30' : 'border-indigo-400 text-indigo-700 hover:bg-indigo-50'}`}
        title="Génère un CSV au format journal comptable (Sage, Cegid, EBP…)"
      >
        <Calculator size={18} /> Export Sage/Cegid
      </button>
      <button
        onClick={() => {
          const stats = exportFEC(direction, services, poleSupport, globalParams);
          appendAuditEntry?.('Export FEC', 'Paramètres', `${stats.ecritures} écritures · Σ Débit ${Math.round(stats.totalDebit)} €`);
        }}
        className={`px-4 py-3 rounded-xl font-bold flex items-center gap-2 border-2 transition-colors ${darkMode ? 'border-amber-600 text-amber-300 hover:bg-amber-900/30' : 'border-amber-500 text-amber-700 hover:bg-amber-50'}`}
        title="Fichier des Écritures Comptables — format BOI-CF-IOR-60-40, opposable à l'administration fiscale"
      >
        <FileSpreadsheet size={18} /> Export FEC (BOI-CF)
      </button>
      <button onClick={() => window.print()} className={`px-4 py-3 rounded-xl font-bold flex items-center gap-2 border ${darkMode ? 'bg-slate-700 text-white border-slate-600' : 'bg-slate-500 text-white border-slate-600'}`}><Printer size={18} /> Imprimer</button>
    </div>
    <p className={`mt-3 text-xs ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Le CSV Sage/Cegid génère un journal OD (CodeJournal, Date, CompteGénéral PCG, Libellé, Débit, Crédit) prêt à importer.</p>
  </div>

  {/* Import de données */}
  <div className={`rounded-3xl border p-6 shadow-md ${darkMode ? 'bg-zinc-900/80 border-zinc-700/30' : 'bg-white border-slate-100/80'}`}>
    <h2 className={`text-lg font-black mb-5 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
      <Upload size={20} className="text-violet-500" /> Import de données
    </h2>
    <div className="flex flex-wrap gap-3">
      <button onClick={() => setShowImportN1(true)} className={`px-4 py-3 rounded-xl font-bold flex items-center gap-2 border-2 transition-colors ${donneesN1 ? (darkMode ? 'border-violet-500 text-violet-300 bg-violet-900/30' : 'border-violet-400 text-violet-700 bg-violet-50') : (darkMode ? 'border-gray-600 text-gray-400 hover:bg-gray-700' : 'border-slate-300 text-slate-600 hover:bg-slate-50')}`}>
        <Upload size={18} /> {donneesN1 ? `Données N-1 chargées (${donneesN1.annee}) ✓` : 'Importer données N-1'}
      </button>
      <button onClick={() => setShowWizardBP(true)} className="bg-amber-500 text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2"><Upload size={18} /> Wizard Import BP</button>
    </div>
    {donneesN1 && (
      <p className={`mt-3 text-xs ${darkMode ? 'text-violet-400' : 'text-violet-600'}`}>
        Données N-1 actives : exercice {donneesN1.annee} — colonnes N-1 visibles dans la Synthèse Analytique
      </p>
    )}
  </div>

  {/* Budget Voté — Snapshot */}
  <div className={`rounded-3xl border p-6 shadow-md ${darkMode ? 'bg-zinc-900/80 border-zinc-700/30' : 'bg-white border-slate-100/80'}`}>
    <h2 className={`text-lg font-black mb-2 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
      <Camera size={20} className="text-violet-500" /> Budget Voté (Snapshot)
    </h2>
    <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
      Figez l'état actuel comme référence. Activez la comparaison pour voir les écarts dans la Synthèse.
    </p>
    <SnapshotManager
      currentData={{ direction, services, poleSupport, globalParams }}
      onToggleCompare={() => setCompareSnapshot(v => !v)}
      compareMode={compareSnapshot}
      darkMode={darkMode}
    />
    <div className="mt-4">
      <ScenariosManager darkMode={darkMode} />
    </div>
  </div>

  {/* Clés de répartition — Frais de siège */}
  <div className={`rounded-3xl border p-6 shadow-md ${darkMode ? 'bg-zinc-900/80 border-zinc-700/30' : 'bg-white border-slate-100/80'}`}>
    <h2 className={`text-lg font-black mb-2 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
      <Layers size={20} className="text-teal-500" /> Clés de répartition — Frais de Siège
    </h2>
    <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
      Répartit automatiquement le budget Direction/Siège sur les services au prorata des ETP.
    </p>
    <div className="flex items-center gap-3 mb-4">
      <button
        onClick={() => setRepartirSiege(v => !v)}
        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${repartirSiege ? 'bg-teal-600 text-white' : (darkMode ? 'bg-zinc-800 border border-zinc-700 text-zinc-300' : 'bg-slate-100 text-slate-600 border border-slate-200')}`}
      >
        {repartirSiege ? '✓ Actif — Quote-parts visibles' : 'Activer la répartition'}
      </button>
    </div>
    {repartirSiege && (() => {
      const repartition = repartirFraisSiege(getBudgetDirection(), services);
      const totalSiege = getBudgetDirection().total;
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`text-xs font-bold uppercase tracking-wide ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
                <th className="text-left py-2">Service</th>
                <th className="text-right py-2">ETP</th>
                <th className="text-right py-2">% ETP</th>
                <th className="text-right py-2">Quote-part Siège</th>
              </tr>
            </thead>
            <tbody>
              {repartition.map(r => (
                <tr key={r.serviceId} className={`border-t ${darkMode ? 'border-zinc-800' : 'border-slate-100'}`}>
                  <td className={`py-2 font-medium ${darkMode ? 'text-white' : 'text-slate-800'}`}>{r.nom}</td>
                  <td className={`py-2 text-right font-mono-numbers ${darkMode ? 'text-zinc-300' : 'text-slate-600'}`}>{r.etp.toFixed(2)}</td>
                  <td className={`py-2 text-right font-mono-numbers ${darkMode ? 'text-zinc-300' : 'text-slate-600'}`}>{r.pctETP.toFixed(1)} %</td>
                  <td className={`py-2 text-right font-black font-mono-numbers ${darkMode ? 'text-teal-400' : 'text-teal-600'}`}>{Math.round(r.quotePart).toLocaleString()} €</td>
                </tr>
              ))}
              <tr className={`border-t-2 ${darkMode ? 'border-zinc-700' : 'border-slate-200'}`}>
                <td className={`py-2 font-black ${darkMode ? 'text-white' : 'text-slate-800'}`} colSpan={3}>Total Budget Siège</td>
                <td className={`py-2 text-right font-black font-mono-numbers ${darkMode ? 'text-white' : 'text-slate-900'}`}>{Math.round(totalSiege).toLocaleString()} €</td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    })()}
  </div>

  {/* Présentation */}
  <div className={`rounded-3xl border p-6 shadow-md ${darkMode ? 'bg-zinc-900/80 border-zinc-700/30' : 'bg-white border-slate-100/80'}`}>
    <h2 className={`text-lg font-black mb-5 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
      <Monitor size={20} className="text-indigo-500" /> Présentation CA/AG
    </h2>
    <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Mode diaporama 6 slides — navigation clavier ← →</p>
    <button onClick={() => { setPresentationMode(true); setSlideIndex(0); }} className="bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2"><Monitor size={18} /> Lancer la présentation</button>
  </div>

  {/* Administration */}
  <div className={`rounded-3xl border p-6 shadow-md ${darkMode ? 'bg-zinc-900/80 border-zinc-700/30' : 'bg-white border-slate-100/80'}`}>
    <h2 className={`text-lg font-black mb-5 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
      <Shield size={20} className="text-slate-500" /> Administration
    </h2>
    <div className="flex flex-wrap gap-3">
      <button onClick={() => setShowRolesModal(true)} className={`px-4 py-3 rounded-xl font-bold flex items-center gap-2 border-2 transition-colors ${darkMode ? 'border-slate-600 text-slate-400 hover:bg-slate-700' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}><Users size={18} /> Gérer les rôles</button>
      {isLocalhost && (
        <button onClick={() => setShowPasswordModal(true)} className="bg-purple-600 text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2"><Key size={18} /> Changer le mot de passe</button>
      )}
      <button
        onClick={() => { setShowResetModal(true); setResetError(''); setResetPassword(''); }}
        className={`px-4 py-3 rounded-xl font-bold flex items-center gap-2 border-2 transition-colors ${darkMode ? 'border-red-700 text-red-400 hover:bg-red-900/30' : 'border-red-300 text-red-600 hover:bg-red-50'}`}
      >
        <RotateCcw size={18} /> Réinitialiser toutes les données
      </button>
      <button
        onClick={() => setShowHardReset(true)}
        className={`px-4 py-3 rounded-xl font-bold flex items-center gap-2 border-2 transition-colors ${darkMode ? 'border-red-900 text-red-500 hover:bg-red-950/40' : 'border-red-400 text-red-700 hover:bg-red-50'}`}
      >
        <Trash2 size={18} /> Réinitialisation complète
      </button>
      <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2"><LogOut size={18} /> Déconnexion</button>
    </div>
  </div>

  {/* Wizard setup */}
  <div className={`rounded-3xl border p-6 shadow-md ${darkMode ? 'bg-zinc-900/80 border-zinc-700/30' : 'bg-white border-slate-100/80'}`}>
    <h2 className={`text-lg font-black mb-3 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
      <Cog size={20} className="text-teal-500" /> Configuration de l'organisation
    </h2>
    <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
      Relancer le wizard pour reconfigurer les services, le personnel, les contrats et les paramètres RH depuis le début.
    </p>
    <div className="flex gap-3">
      <button onClick={() => setShowWizardSetup(true)} className="bg-teal-500 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2">
        <Users size={18} /> Reconfigurer l'organisation
      </button>
      {poolRH.length > 0 && (
        <div className={`px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-bold ${darkMode ? 'bg-purple-900/40 text-purple-300' : 'bg-purple-50 text-purple-700'}`}>
          <Users size={16} /> {poolRH.length} agent{poolRH.length > 1 ? 's' : ''} en Pool RH
        </div>
      )}
    </div>
  </div>

  {/* Piste d'audit */}
  <div className={`rounded-3xl border p-6 shadow-md ${darkMode ? 'bg-zinc-900/80 border-zinc-700/30' : 'bg-white border-slate-100/80'}`}>
    <div className="flex items-center justify-between mb-4">
      <h2 className={`text-lg font-black flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
        <Clock size={20} className="text-indigo-500" /> Piste d'audit
      </h2>
      <div className="flex items-center gap-2">
        <span className={`text-xs px-2 py-1 rounded-lg font-bold ${darkMode ? 'bg-zinc-700 text-zinc-300' : 'bg-slate-100 text-slate-500'}`}>
          {auditTrail.length} entrée{auditTrail.length !== 1 ? 's' : ''}
        </span>
        {auditTrail.length > 0 && (
          <button
            onClick={() => {
              const header = 'Horodatage\tAction\tModule\tDétails\n';
              const rows = auditTrail.map(e =>
                `${new Date(e.ts).toLocaleString('fr-FR')}\t${e.action}\t${e.module}\t${e.details}`
              ).join('\n');
              const blob = new Blob([header + rows], { type: 'text/plain' });
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = `audit_trail_${new Date().toISOString().split('T')[0]}.tsv`;
              a.click();
              appendAuditEntry?.('Export piste d\'audit', 'Paramètres');
            }}
            className={`text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-colors ${darkMode ? 'bg-indigo-700/40 text-indigo-300 hover:bg-indigo-700/60' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}
          >
            <Download size={12} /> Exporter TSV
          </button>
        )}
      </div>
    </div>
    {auditTrail.length === 0 ? (
      <p className={`text-sm ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>Aucune entrée enregistrée.</p>
    ) : (
      <div className={`rounded-2xl overflow-hidden border ${darkMode ? 'border-zinc-700' : 'border-slate-200'}`}>
        <table className="w-full text-xs">
          <thead>
            <tr className={darkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-50 text-slate-500'}>
              <th className="text-left px-3 py-2 font-bold">Horodatage</th>
              <th className="text-left px-3 py-2 font-bold">Action</th>
              <th className="text-left px-3 py-2 font-bold">Module</th>
              <th className="text-left px-3 py-2 font-bold">Détails</th>
            </tr>
          </thead>
          <tbody>
            {auditTrail.slice(0, 50).map((entry, i) => (
              <tr key={i} className={i % 2 === 0 ? (darkMode ? 'bg-zinc-900/50' : 'bg-white') : (darkMode ? 'bg-zinc-800/40' : 'bg-slate-50')}>
                <td className={`px-3 py-2 font-mono whitespace-nowrap ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
                  {new Date(entry.ts).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </td>
                <td className={`px-3 py-2 font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{entry.action}</td>
                <td className={`px-3 py-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>{entry.module}</td>
                <td className={`px-3 py-2 ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>{entry.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {auditTrail.length > 50 && (
          <p className={`text-center text-xs py-2 ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
            {auditTrail.length - 50} entrées plus anciennes non affichées — exporter le TSV pour l'historique complet
          </p>
        )}
      </div>
    )}
  </div>

</div>
  );
}
