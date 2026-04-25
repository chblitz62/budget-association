import React, { useMemo } from 'react';
import {
  CheckCircle2, AlertTriangle, AlertCircle, ArrowRight, Sparkles,
  TrendingUp, TrendingDown, Wallet, Users, Target,
} from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useBudget } from '../contexts/BudgetContext';
import { surface, text, status as statusToken } from '../styles/tokens';
import Button from './ui/Button';
import HoverTip from './ui/HoverTip';

const fmtK = (n) => `${n >= 0 ? '+' : ''}${Math.round((n || 0) / 1000)} k €`;
const fmtNum = (n) => Math.round(n || 0).toLocaleString('fr-FR');

/**
 * <NoviceDashboard /> — Synthèse Simple pour utilisateur novice.
 *
 * Composé de 4 zones :
 *   1. Hero status (✓ Tout va bien / ⚠ Action requise / ✕ Attention) — calculé depuis alertes
 *   2. 3 KPIs hero (Recettes / Charges / Solde) avec micro-graph trésorerie
 *   3. Graphique trésorerie 12 mois (area soft, 2 séries)
 *   4. Points de vigilance (top 3 alerts) + CTA "En savoir plus" → mode expert
 */
export default function NoviceDashboard({ darkMode = false, onToggleExpertMode }) {
  const {
    kpiGlobaux, alertes, tresorerie, masseSalarialeTotal,
  } = useBudget();

  const dm = darkMode;
  const totalRecettes = kpiGlobaux?.totalRecettes ?? 0;
  const totalCharges = kpiGlobaux?.totalCharges ?? 0;
  const soldeGlobal = kpiGlobaux?.soldeGlobal ?? 0;
  const tauxCouverture = kpiGlobaux?.tauxCouverture ?? 0;
  const totalETP = kpiGlobaux?.totalETP ?? 0;

  // Statut global (priorité : error > warning > success)
  const errors = (alertes || []).filter(a => a.lvl === 'error');
  const warnings = (alertes || []).filter(a => a.lvl === 'warning');
  const overallStatus = errors.length > 0 ? 'danger' : warnings.length > 0 ? 'warning' : 'success';

  const heroMessage = {
    success: {
      icon: CheckCircle2,
      title: 'Tout va bien !',
      description: 'Votre budget est cohérent et sans alerte critique. Vous pouvez consulter les détails dans les autres onglets.',
    },
    warning: {
      icon: AlertCircle,
      title: 'Action requise',
      description: `${warnings.length} point${warnings.length > 1 ? 's' : ''} de vigilance à examiner. Aucun blocage critique mais à régulariser.`,
    },
    danger: {
      icon: AlertTriangle,
      title: 'Attention requise',
      description: `${errors.length} alerte${errors.length > 1 ? 's' : ''} critique${errors.length > 1 ? 's' : ''} à traiter avant validation budgétaire.`,
    },
  }[overallStatus];

  const HeroIcon = heroMessage.icon;
  const heroTone = statusToken[overallStatus](dm);

  // Données graphique trésorerie (12 mois)
  const moisData = useMemo(() => {
    const mois = tresorerie?.mois || [];
    return mois.map((m, i) => ({
      nom: m.nom || ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'][i] || `M${i + 1}`,
      Recettes: Math.round((m.encaissements || 0) / 1000),
      Charges: Math.round((m.decaissements || 0) / 1000),
      Solde: Math.round(((m.soldeCumule || 0)) / 1000),
    }));
  }, [tresorerie]);

  const topVigilances = useMemo(() => {
    const sorted = [...(alertes || [])].sort((a, b) => {
      const order = { error: 0, warning: 1, info: 2 };
      return (order[a.lvl] ?? 3) - (order[b.lvl] ?? 3);
    });
    return sorted.slice(0, 3);
  }, [alertes]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ─────── 1. HERO STATUS ─────── */}
      <div className={`${surface.card(dm)} p-8 border-l-4 ${
        overallStatus === 'success' ? 'border-l-emerald-500'
        : overallStatus === 'warning' ? 'border-l-amber-500'
        : 'border-l-rose-500'
      }`}>
        <div className="flex items-start gap-5 flex-wrap">
          <div className={`shrink-0 p-4 rounded-2xl ${heroTone.bg}`}>
            <HeroIcon size={32} strokeWidth={1.5} className={heroTone.accent} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className={`${text.hero(dm)} mb-2`}>{heroMessage.title}</h1>
            <p className={`${text.body(dm)} max-w-3xl`}>{heroMessage.description}</p>
          </div>
        </div>
      </div>

      {/* ─────── 2. KPIs HERO ─────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiHeroCard
          dm={dm}
          icon={TrendingUp}
          accent="text-emerald-500"
          label="Recettes annuelles"
          value={fmtNum(totalRecettes)}
          unit="€"
          help={{
            title: 'Recettes prévisionnelles',
            description: 'Total des produits attendus sur l\'exercice : subventions, droits d\'inscription, prestations, dons.',
            interpretation: totalRecettes > 0 ? `${fmtNum(totalRecettes)} € budgétés en recettes.` : 'Aucune recette saisie pour l\'instant.',
            level: 'success',
          }}
        />
        <KpiHeroCard
          dm={dm}
          icon={TrendingDown}
          accent="text-rose-500"
          label="Charges annuelles"
          value={fmtNum(totalCharges)}
          unit="€"
          help={{
            title: 'Charges prévisionnelles',
            description: 'Total des dépenses attendues : masse salariale (salaires + charges patronales), exploitation, amortissements.',
            interpretation: masseSalarialeTotal > 0 ? `Dont ${fmtNum(masseSalarialeTotal)} € de masse salariale (${Math.round((masseSalarialeTotal / totalCharges) * 100)} %).` : '',
            level: 'danger',
          }}
        />
        <KpiHeroCard
          dm={dm}
          icon={Wallet}
          accent={soldeGlobal >= 0 ? 'text-emerald-500' : 'text-rose-500'}
          label="Résultat de l'exercice"
          value={fmtK(soldeGlobal)}
          help={{
            title: 'Résultat prévisionnel (solde)',
            description: 'Différence entre les recettes et les charges. Positif = excédent ; négatif = déficit à combler.',
            interpretation: soldeGlobal >= 0
              ? `✓ Excédent de ${fmtK(soldeGlobal)}. Pensez à provisionner pour les exercices futurs.`
              : `⚠ Déficit de ${fmtK(soldeGlobal)}. À combler par optimisation des charges ou recettes complémentaires.`,
            level: soldeGlobal >= 0 ? 'success' : 'danger',
          }}
        />
      </div>

      {/* Stats secondaires en bandeau discret */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <SmallStat dm={dm} icon={Users} label="Effectifs (ETP)" value={totalETP.toFixed(1)} />
        <SmallStat
          dm={dm}
          icon={Target}
          label="Taux de couverture"
          value={`${Math.round(tauxCouverture)} %`}
          accent={tauxCouverture >= 100 ? 'emerald' : tauxCouverture >= 90 ? 'amber' : 'rose'}
        />
        <SmallStat
          dm={dm}
          icon={Sparkles}
          label="Niveau d'alerte"
          value={`${errors.length} critique${errors.length > 1 ? 's' : ''} · ${warnings.length} vigilance${warnings.length > 1 ? 's' : ''}`}
          accent={overallStatus === 'success' ? 'emerald' : overallStatus === 'warning' ? 'amber' : 'rose'}
        />
      </div>

      {/* ─────── 3. GRAPHIQUE TRÉSORERIE 12 MOIS ─────── */}
      {moisData.length > 0 && (
        <div className={`${surface.card(dm)} p-6`}>
          <div className="mb-4">
            <h2 className={text.title(dm)}>Trésorerie sur 12 mois</h2>
            <p className={`${text.muted(dm)} mt-1`}>
              Évolution mensuelle des recettes (verts) et des charges (rouge) prévisionnelles.
            </p>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={moisData} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
              <defs>
                <linearGradient id="grRecettes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="grCharges" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={dm ? '#27272a' : '#e2e8f0'} vertical={false} />
              <XAxis dataKey="nom" stroke={dm ? '#71717a' : '#94a3b8'} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke={dm ? '#71717a' : '#94a3b8'} fontSize={11} tickLine={false} axisLine={false} unit=" k€" />
              <RTooltip
                contentStyle={{
                  backgroundColor: dm ? '#18181b' : '#ffffff',
                  border: `1px solid ${dm ? '#3f3f46' : '#e2e8f0'}`,
                  borderRadius: 12,
                  fontSize: 12,
                }}
                labelStyle={{ fontWeight: 700, color: dm ? '#e4e4e7' : '#0f172a' }}
                formatter={(value, name) => [`${value} k€`, name]}
              />
              <Area type="monotone" dataKey="Recettes" stroke="#10b981" strokeWidth={1.5} fill="url(#grRecettes)" />
              <Area type="monotone" dataKey="Charges"  stroke="#f43f5e" strokeWidth={1.5} fill="url(#grCharges)"  />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ─────── 4. POINTS DE VIGILANCE + CTA ─────── */}
      {topVigilances.length > 0 && (
        <div className={`${surface.card(dm)} p-6`}>
          <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className={text.title(dm)}>Points de vigilance</h2>
              <p className={`${text.muted(dm)} mt-1`}>
                {Math.min(topVigilances.length, 3)} priorité{topVigilances.length > 1 ? 's' : ''} sur {(alertes || []).length} alerte{(alertes || []).length > 1 ? 's' : ''} détectée{(alertes || []).length > 1 ? 's' : ''}.
              </p>
            </div>
          </div>
          <ul className="space-y-2">
            {topVigilances.map((a, i) => {
              const lvl = a.lvl === 'error' ? 'danger' : a.lvl === 'warning' ? 'warning' : 'info';
              const tone = statusToken[lvl](dm);
              const Icon = a.lvl === 'error' ? AlertTriangle : a.lvl === 'warning' ? AlertCircle : CheckCircle2;
              return (
                <li key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${tone.bg}`}>
                  <Icon size={16} strokeWidth={1.5} className={`mt-0.5 shrink-0 ${tone.accent}`} />
                  <p className={`text-sm ${tone.text}`}>{a.msg || a.message || 'Alerte sans détail'}</p>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* ─────── CTA "En savoir plus" ─────── */}
      {onToggleExpertMode && (
        <div className={`${surface.muted(dm)} rounded-2xl p-6 text-center border border-dashed ${dm ? 'border-zinc-700' : 'border-slate-300'}`}>
          <Sparkles size={20} strokeWidth={1.5} className={`mx-auto mb-2 ${dm ? 'text-violet-400' : 'text-violet-500'}`} />
          <p className={`${text.body(dm)} mb-3 max-w-xl mx-auto`}>
            Vue simplifiée pour une lecture rapide. Pour explorer la projection 36 mois, le radar de santé,
            les scénarios "what-if" et le pilotage RH avancé, passez en <strong>mode expert</strong>.
          </p>
          <Button variant="secondary" size="md" rightIcon={ArrowRight} onClick={onToggleExpertMode} darkMode={dm}>
            En savoir plus — Mode expert
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Sous-composants ───────────────────────────────────────────────────

const KpiHeroCard = ({ dm, icon: Icon, accent, label, value, unit, help }) => (
  <HoverTip darkMode={dm} {...help}>
    <div className={`${surface.card(dm)} p-6 cursor-help`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={16} strokeWidth={1.5} className={accent} />
        <span className={text.label(dm)}>{label}</span>
      </div>
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className={`text-3xl font-bold tabular-nums leading-tight ${accent}`}>{value}</span>
        {unit && <span className={`${text.muted(dm)} text-base`}>{unit}</span>}
      </div>
    </div>
  </HoverTip>
);

const SmallStat = ({ dm, icon: Icon, label, value, accent = 'slate' }) => {
  const accentText = {
    emerald: 'text-emerald-500',
    amber:   'text-amber-500',
    rose:    'text-rose-500',
    slate:   dm ? 'text-zinc-200' : 'text-slate-700',
  }[accent];
  return (
    <div className={`${surface.muted(dm)} rounded-2xl p-4`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon size={14} strokeWidth={1.5} className={dm ? 'text-zinc-500' : 'text-slate-400'} />
        <span className={text.label(dm)}>{label}</span>
      </div>
      <div className={`text-base font-bold tabular-nums ${accentText}`}>{value}</div>
    </div>
  );
};
