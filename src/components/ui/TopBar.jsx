import React from 'react';
import { Save } from 'lucide-react';
import { surface, text } from '../../styles/tokens';
import Button from './Button';
import Pill from './Pill';
import ToolsMenu from './ToolsMenu';
import HoverTip from './HoverTip';

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

  // Couleurs + niveaux sémantiques pour KPIs
  const soldeLevel = soldeGlobal >= 0 ? 'success' : 'danger';
  const soldeColor = soldeLevel === 'success' ? 'text-emerald-500' : 'text-rose-500';
  const couvLevel = tauxCouverture >= 100 ? 'success' : tauxCouverture >= 90 ? 'warning' : 'danger';
  const couvColor = couvLevel === 'success' ? 'text-emerald-500' : couvLevel === 'warning' ? 'text-amber-500' : 'text-rose-500';
  const etpColor = dm ? 'text-zinc-100' : 'text-slate-800';

  // Interprétations pédagogiques pour le tooltip riche
  const soldeInterpretation = soldeGlobal >= 0
    ? '✓ L\'association dégage un excédent. Pensez à provisionner pour les exercices à venir.'
    : '⚠ L\'association puise dans ses réserves. À surveiller : ratio recettes/charges, dépendance subventions.';
  const couvInterpretation = tauxCouverture >= 100
    ? '✓ Vos recettes couvrent intégralement vos charges.'
    : tauxCouverture >= 90
      ? '⚠ Sous-financement modéré (90–100 %). À combler par optimisation ou recettes complémentaires.'
      : '✕ Sous-financement critique (<90 %). Action urgente : revoir charges ou abonder les recettes.';
  const etpInterpretation = `${totalETP.toFixed(1)} équivalents temps plein actuellement budgétés. 1 ETP = 1 poste à temps complet (35 h/semaine).`;

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
          <HoverTip
            darkMode={dm}
            level={soldeLevel}
            title="Résultat prévisionnel"
            description="Différence entre les recettes et les charges projetées sur l'exercice. C'est le bénéfice ou le déficit attendu."
            interpretation={soldeInterpretation}
          >
            <KpiHero
              label="Résultat"
              value={`${soldeGlobal >= 0 ? '+' : ''}${Math.round(soldeGlobal / 1000)}`}
              unit="k €"
              colorClass={soldeColor}
              dm={dm}
              level={soldeLevel}
            />
          </HoverTip>
          <KpiSeparator dm={dm} />
          <HoverTip
            darkMode={dm}
            level="info"
            title="Effectifs (ETP)"
            description="Équivalents Temps Plein. 1 ETP = 1 poste à temps complet (35 h/semaine, toute l'année). Un agent à mi-temps compte pour 0,5 ETP."
            interpretation={etpInterpretation}
          >
            <KpiHero
              label="Effectifs"
              value={totalETP.toFixed(1)}
              unit="ETP"
              colorClass={etpColor}
              dm={dm}
              level="info"
            />
          </HoverTip>
          <KpiSeparator dm={dm} />
          <HoverTip
            darkMode={dm}
            level={couvLevel}
            title="Taux de couverture"
            description="Part des charges couverte par les recettes. À 100 %, l'équilibre est atteint. Au-dessus, vous générez un excédent ; en dessous, vous puisez dans les réserves."
            interpretation={couvInterpretation}
          >
            <KpiHero
              label="Couverture"
              value={`${Math.round(tauxCouverture)}`}
              unit="%"
              colorClass={couvColor}
              dm={dm}
              level={couvLevel}
            />
          </HoverTip>

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

// Smart indicator dot (subtle status signal — pas d'alerte agressive)
const DOT_COLOR = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger:  'bg-rose-500',
  info:    'bg-indigo-500',
  neutral: 'bg-slate-400',
};

const KpiHero = React.forwardRef(({ label, value, unit, colorClass, dm, level = 'neutral' }, ref) => (
  <div ref={ref} className="text-center group cursor-help select-none">
    <div className="flex items-center justify-center gap-1.5 mb-1">
      <span className={`w-1.5 h-1.5 rounded-full ${DOT_COLOR[level]} ${level === 'danger' || level === 'warning' ? 'animate-pulse' : ''}`} />
      <span className={`text-[10px] font-semibold uppercase tracking-wider leading-none ${dm ? 'text-zinc-500' : 'text-slate-500'}`}>
        {label}
      </span>
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
));
KpiHero.displayName = 'KpiHero';

const KpiSeparator = ({ dm }) => (
  <div className={`w-px h-8 ${dm ? 'bg-zinc-800' : 'bg-slate-200'}`} />
);
