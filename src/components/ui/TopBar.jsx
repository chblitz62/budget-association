import React from 'react';
import { Save } from 'lucide-react';
import { surface, text } from '../../styles/tokens';
import Button from './Button';
import Pill from './Pill';
import ToolsMenu from './ToolsMenu';

const TAB_NAMES = {
  dashboard: 'Tableau de bord', budget: 'Budget', analyse: 'Analyse',
  rh: 'Ressources humaines', temps: 'Temps de travail', formation: 'Formation',
  vacataires: 'Vacataires', subvention: 'Subvention',
  daf: 'Espace DAF', parametres: 'Paramètres', reporting: 'Reporting réglementaire',
  devis: 'Devis formation',
};

/**
 * <TopBar /> — Header Soft SaaS 64px en 3 zones distinctes.
 *
 * Zone 1 (gauche)  : Logo + nom app + page courante (italique secondaire)
 * Zone 2 (centre)  : 3 KPIs hero — Solde, ETP, Couverture (typo 18-20px lisible)
 * Zone 3 (droite)  : Bouton "Sauver" primary + ToolsMenu dropdown
 *
 * Sous-bande optionnelle : badges secondaires (statut budget, stress test, coeff BP)
 * affichés UNIQUEMENT si actifs (réduit le bruit visuel pour novice).
 *
 * Différences vs ancien header 56px :
 *   - h-16 (64px) avec respiration interne
 *   - Surface glass : bg-white/80 backdrop-blur-xl (vs bg-white solide)
 *   - KPIs : 18px tabular-nums au lieu de 12px
 *   - Privacy/EcoFin/AI/Mode sombre/Paramètres regroupés dans <ToolsMenu>
 *   - Statut budget en pill rounded-full (subtil, novice-friendly)
 */
export default function TopBar({
  darkMode,
  setDarkMode,
  sidebarOpen,
  activeTab,
  setActiveTab,
  // KPIs hero
  soldeGlobal,
  totalETP,
  tauxCouverture,
  // Badges secondaires
  stressTest,
  stressImpact,
  coefficientBP,
  globalParams,
  // Toggles
  privacyMode,
  setPrivacyMode,
  showAICopilot,
  setShowAICopilot,
  showEcoFin,
  setShowEcoFin,
  // Action principale
  sauvegarderBudget,
}) {
  const dm = darkMode;
  const pageName = TAB_NAMES[activeTab] || activeTab;
  const statut = globalParams?.statutBudget || 'brouillon';

  // Couleurs sémantiques pour KPIs (inline pour éviter Tailwind dynamique)
  const soldeColor = soldeGlobal >= 0 ? 'text-emerald-500' : 'text-rose-500';
  const couvColor = tauxCouverture >= 100 ? 'text-emerald-500' : tauxCouverture >= 90 ? 'text-amber-500' : 'text-rose-500';
  const etpColor = dm ? 'text-zinc-100' : 'text-slate-800';

  // Statuts budget en Pill
  const statutPillVariant = ({
    brouillon: 'neutral',
    soumis:    'info',
    valide:    'success',
    gele:      'info',
  })[statut] || 'neutral';
  const statutLabel = ({
    brouillon: 'Brouillon',
    soumis:    'Soumis',
    valide:    'Validé ✓',
    gele:      'Gelé 🔒',
  })[statut] || 'Brouillon';

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 h-16 ${surface.topbar(dm)} no-print transition-colors duration-300`}
    >
      <div
        className="h-full flex items-center justify-between gap-6 px-6"
        style={{
          paddingLeft: sidebarOpen ? '272px' : '72px',
          transition: 'padding-left 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* ── Zone 1 : Logo + page ─────────────────────────────────── */}
        <div className="flex items-center gap-3 flex-shrink-0 min-w-0">
          <img
            src="/logo.png"
            alt=""
            className={`h-8 ${dm ? 'brightness-200' : ''}`}
            onError={e => e.target.style.display = 'none'}
          />
          <div className="min-w-0">
            <h1 className={`text-sm font-bold leading-tight truncate ${dm ? 'text-white' : 'text-slate-900'}`}>
              Budget Association
            </h1>
            <p className={`text-[11px] leading-tight truncate ${dm ? 'text-zinc-500' : 'text-slate-500'}`}>
              {pageName}
            </p>
          </div>
        </div>

        {/* ── Zone 2 : KPIs hero ───────────────────────────────────── */}
        <div className="hidden md:flex items-center gap-6 flex-1 justify-center">
          <KpiHero
            label="Résultat"
            value={`${soldeGlobal >= 0 ? '+' : ''}${Math.round(soldeGlobal / 1000)}`}
            unit="k €"
            colorClass={soldeColor}
            dm={dm}
            hint={soldeGlobal >= 0 ? 'Excédent prévisionnel' : 'Déficit prévisionnel'}
          />
          <KpiSeparator dm={dm} />
          <KpiHero
            label="ETP"
            value={totalETP.toFixed(1)}
            colorClass={etpColor}
            dm={dm}
            hint="Équivalents temps plein"
          />
          <KpiSeparator dm={dm} />
          <KpiHero
            label="Couverture"
            value={`${Math.round(tauxCouverture)}`}
            unit="%"
            colorClass={couvColor}
            dm={dm}
            hint={tauxCouverture >= 100 ? 'Recettes ≥ Charges' : 'Recettes < Charges'}
          />

          {/* Badges secondaires — affichés UNIQUEMENT si actifs */}
          {(stressTest !== 0 || coefficientBP !== 100 || statut !== 'brouillon') && (
            <div className={`flex items-center gap-1.5 ml-2 pl-4 border-l ${dm ? 'border-zinc-800' : 'border-slate-200'}`}>
              {statut !== 'brouillon' && (
                <Pill
                  variant={statutPillVariant}
                  size="xs"
                  darkMode={dm}
                  className="cursor-pointer hover:opacity-80"
                  onClick={() => setActiveTab('parametres')}
                >
                  {statutLabel}
                </Pill>
              )}
              {coefficientBP !== 100 && (
                <Pill variant="warning" size="xs" darkMode={dm}
                  className="cursor-pointer hover:opacity-80"
                  onClick={() => setActiveTab('parametres')}>
                  Coeff BP {coefficientBP.toFixed(0)} %
                </Pill>
              )}
              {stressTest !== 0 && (
                <Pill variant="warning" size="xs" darkMode={dm}>
                  Stress {stressTest > 0 ? '+' : ''}{stressTest} % · {stressImpact >= 0 ? '+' : ''}{Math.round(stressImpact / 1000)}k €
                </Pill>
              )}
            </div>
          )}
        </div>

        {/* ── Zone 3 : Actions essentielles ────────────────────────── */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="primary"
            size="sm"
            leftIcon={Save}
            darkMode={dm}
            onClick={sauvegarderBudget}
          >
            Sauver
          </Button>
          <ToolsMenu
            darkMode={dm}
            privacyMode={privacyMode}
            onPrivacyToggle={() => setPrivacyMode(v => !v)}
            showEcoFin={showEcoFin}
            onEcoFinToggle={() => setShowEcoFin(v => !v)}
            showAICopilot={showAICopilot}
            onAIToggle={() => setShowAICopilot(v => !v)}
            onDarkModeToggle={() => setDarkMode(!dm)}
            onSettings={() => setActiveTab('parametres')}
          />
        </div>
      </div>
    </header>
  );
}

// ── Sous-composants ───────────────────────────────────────────────────

const KpiHero = ({ label, value, unit, colorClass, dm, hint }) => (
  <div className="text-center group" title={hint}>
    <div className={`text-[10px] font-semibold uppercase tracking-wider leading-none mb-1 ${dm ? 'text-zinc-500' : 'text-slate-500'}`}>
      {label}
    </div>
    <div className="flex items-baseline justify-center gap-0.5">
      <span className={`text-lg lg:text-xl font-bold tabular-nums leading-tight ${colorClass}`}>
        {value}
      </span>
      {unit && (
        <span className={`text-[11px] font-semibold ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
          {unit}
        </span>
      )}
    </div>
  </div>
);

const KpiSeparator = ({ dm }) => (
  <div className={`w-px h-8 ${dm ? 'bg-zinc-800' : 'bg-slate-200'}`} />
);
