/**
 * AICopilot.jsx — Panneau d'analyse stratégique en temps réel
 * Analyse rule-based (pas d'API externe) : détecte anomalies et génère des insights.
 */
import React, { useMemo, useState } from 'react';
import { X, Brain, AlertTriangle, TrendingDown, TrendingUp, Info, CheckCircle, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { calculerStatsFormation } from '../utils/constants';

const SEV = {
  critical: { color: 'text-red-600', bg: 'bg-red-50 border-red-200', bgDark: 'bg-red-900/20 border-red-700/40', icon: AlertTriangle, dot: 'bg-red-500' },
  warning:  { color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', bgDark: 'bg-amber-900/20 border-amber-700/40', icon: TrendingDown, dot: 'bg-amber-400' },
  good:     { color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', bgDark: 'bg-emerald-900/20 border-emerald-700/40', icon: CheckCircle, dot: 'bg-emerald-500' },
  info:     { color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', bgDark: 'bg-blue-900/20 border-blue-700/40', icon: Info, dot: 'bg-blue-400' },
};

function Insight({ item, darkMode }) {
  const [open, setOpen] = useState(false);
  const s = SEV[item.severity] || SEV.info;
  const Icon = s.icon;
  return (
    <div className={`rounded-xl border p-3 mb-2 ${darkMode ? s.bgDark : s.bg}`}>
      <div className="flex items-start gap-2 cursor-pointer" onClick={() => item.detail && setOpen(o => !o)}>
        <Icon size={14} className={`flex-shrink-0 mt-0.5 ${s.color}`} />
        <div className="flex-1 min-w-0">
          <div className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{item.title}</div>
          <div className={`text-[11px] mt-0.5 ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>{item.message}</div>
        </div>
        {item.detail && (
          <button className={`flex-shrink-0 ${s.color}`}>
            {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        )}
      </div>
      {open && item.detail && (
        <div className={`mt-2 pt-2 border-t text-[11px] ${darkMode ? 'border-gray-600 text-gray-400' : 'border-slate-200 text-slate-500'}`}>
          {item.detail}
        </div>
      )}
    </div>
  );
}

export default function AICopilot({ darkMode, onClose, direction, poleSupport, services, getBudgetDirection, getBudgetPoleSupport, getBudgetService, masseSalarialeTotal, tresorerie }) {
  const [filter, setFilter] = useState('all');

  const insights = useMemo(() => {
    const out = [];
    const bdDir = getBudgetDirection ? getBudgetDirection() : { total: 0 };
    const bdPS  = getBudgetPoleSupport ? getBudgetPoleSupport() : { total: 0 };

    const totalCharges = services.reduce((s, svc) => s + (getBudgetService ? getBudgetService(svc).total : 0), 0) + bdDir.total + bdPS.total;
    const totalRecettes = services.reduce((s, svc) => s + (getBudgetService ? getBudgetService(svc).recettes : 0), 0);
    const soldeGlobal = totalRecettes - totalCharges;
    const tauxCouverture = totalCharges > 0 ? totalRecettes / totalCharges * 100 : 0;

    // ── Santé globale ──────────────────────────────────────────────
    if (tauxCouverture >= 95) {
      out.push({ id: 'global_ok', category: 'budget', severity: 'good', title: 'Équilibre budgétaire', message: `Taux de couverture : ${tauxCouverture.toFixed(1)}% — situation saine.` });
    } else if (tauxCouverture >= 80) {
      out.push({ id: 'global_warn', category: 'budget', severity: 'warning', title: 'Couverture insuffisante', message: `Taux de couverture : ${tauxCouverture.toFixed(1)}% — des recettes manquent.`, detail: `Déficit estimé : ${Math.abs(Math.round(soldeGlobal)).toLocaleString('fr-FR')} €. Vérifiez les subventions non saisies ou réduisez les charges fixes.` });
    } else if (totalCharges > 0) {
      out.push({ id: 'global_crit', category: 'budget', severity: 'critical', title: '⚠ Déséquilibre budgétaire critique', message: `Couverture : ${tauxCouverture.toFixed(1)}% — déficit de ${Math.abs(Math.round(soldeGlobal)).toLocaleString('fr-FR')} €.`, detail: 'Revenus insuffisants pour couvrir les charges. Actionnez rapidement les leviers : renégociation subventions, réduction coûts variables, nouvelles promotions.' });
    }

    // ── Overhead (structure vs opérationnel) ──────────────────────
    const overhead = totalCharges > 0 ? (bdDir.total + bdPS.total) / totalCharges * 100 : 0;
    if (overhead > 45) {
      out.push({ id: 'overhead_crit', category: 'budget', severity: 'critical', title: 'Overhead structurel élevé', message: `Direction + Pôle Support = ${overhead.toFixed(0)}% des charges totales.`, detail: 'Seuil recommandé < 30%. Un overhead élevé pénalise l\'efficience opérationnelle et réduit la capacité d\'investissement pédagogique.' });
    } else if (overhead > 30) {
      out.push({ id: 'overhead_warn', category: 'budget', severity: 'warning', title: 'Overhead à surveiller', message: `Structure = ${overhead.toFixed(0)}% des charges (seuil : 30%).`, detail: `Charges Direction : ${Math.round(bdDir.total).toLocaleString('fr-FR')} € | Pôle Support : ${Math.round(bdPS.total).toLocaleString('fr-FR')} €.` });
    } else if (overhead > 0) {
      out.push({ id: 'overhead_ok', category: 'budget', severity: 'good', title: 'Structure maîtrisée', message: `Overhead Direction+PS : ${overhead.toFixed(0)}% — dans les normes.` });
    }

    // ── Services en déficit ────────────────────────────────────────
    services.forEach(svc => {
      if (!getBudgetService) return;
      const bs = getBudgetService(svc);
      if (bs.recettes > 0 && bs.solde < 0) {
        const pct = Math.abs(bs.solde / bs.total * 100);
        out.push({ id: `deficit_${svc.id}`, category: 'budget', severity: pct > 20 ? 'critical' : 'warning', title: `Déficit — ${svc.nom}`, message: `Solde : ${Math.round(bs.solde).toLocaleString('fr-FR')} € (−${pct.toFixed(0)}% des charges).`, detail: `Charges : ${Math.round(bs.total).toLocaleString('fr-FR')} € | Recettes : ${Math.round(bs.recettes).toLocaleString('fr-FR')} €. Un service déficitaire avec effectif complet indique soit un sous-tarif soit une surcharge structurelle.` });
      } else if (bs.recettes === 0 && bs.total > 0) {
        out.push({ id: `norev_${svc.id}`, category: 'budget', severity: 'info', title: `Aucune recette — ${svc.nom}`, message: `Budget de charges : ${Math.round(bs.total).toLocaleString('fr-FR')} € sans recettes propres saisies.`, detail: 'Ce service dépend entièrement de financements externes (subventions, dotations). Pensez à saisir les recettes prévisionnelles pour une analyse complète.' });
      }
    });

    // ── Masse salariale vs recettes ───────────────────────────────
    if (totalRecettes > 0 && masseSalarialeTotal > 0) {
      const ratioPMS = masseSalarialeTotal / totalRecettes * 100;
      if (ratioPMS > 85) {
        out.push({ id: 'ms_ratio_crit', category: 'rh', severity: 'critical', title: 'Masse salariale disproportionnée', message: `MS = ${ratioPMS.toFixed(0)}% des recettes — seuil critique (85%).`, detail: 'À ce niveau, une variation de 5% des recettes suffit à créer un déficit de trésorerie. Envisagez une optimisation des ETP ou une hausse des tarifs.' });
      } else if (ratioPMS > 70) {
        out.push({ id: 'ms_ratio_warn', category: 'rh', severity: 'warning', title: 'Poids MS élevé', message: `Masse salariale = ${ratioPMS.toFixed(0)}% des recettes (seuil d'alerte : 70%).` });
      } else {
        out.push({ id: 'ms_ratio_ok', category: 'rh', severity: 'good', title: 'Ratio MS/Recettes sain', message: `Masse salariale = ${ratioPMS.toFixed(0)}% des recettes — bonne maîtrise.` });
      }
    }

    // ── Alertes abandons ──────────────────────────────────────────
    services.forEach(svc => {
      if (!svc.promos) return;
      const stats = calculerStatsFormation(svc);
      if (stats.totalEtudiants > 0) {
        const tauxAbandon = stats.totalAbandons / stats.totalEtudiants * 100;
        if (tauxAbandon > 25) {
          out.push({ id: `abandon_${svc.id}`, category: 'formation', severity: 'critical', title: `Taux d'abandon critique — ${svc.nom}`, message: `${stats.totalAbandons} abandons / ${stats.totalEtudiants} étudiants (${tauxAbandon.toFixed(0)}%).`, detail: 'Chaque abandon réduit les recettes sans réduire les charges fixes. Impact trésorerie immédiat. Analysez les causes : difficultés pédagogiques, conditions d\'accueil, inadéquation promo.' });
        } else if (tauxAbandon > 10) {
          out.push({ id: `abandon_warn_${svc.id}`, category: 'formation', severity: 'warning', title: `Abandons à surveiller — ${svc.nom}`, message: `Taux d'abandon : ${tauxAbandon.toFixed(0)}% (${stats.totalAbandons} / ${stats.totalEtudiants}).` });
        }
      }
    });

    // ── Vacataires ────────────────────────────────────────────────
    services.forEach(svc => {
      if (!getBudgetService) return;
      const bs = getBudgetService(svc);
      if (bs.ratioVacataires > 30) {
        out.push({ id: `vac_${svc.id}`, category: 'rh', severity: 'warning', title: `Ratio vacataires élevé — ${svc.nom}`, message: `Vacataires = ${bs.ratioVacataires?.toFixed(0)}% de la MS (seuil : 30%).`, detail: 'Un ratio élevé expose au risque de requalification en CDI. En dessous de 450h/an par vacataire, ce risque est limité.' });
      }
    });

    // ── Liaison Formation ↔ Vacataires ───────────────────────────
    services.forEach(svc => {
      if (!svc.promos || !getBudgetService) return;
      const bs = getBudgetService(svc);
      const stats = calculerStatsFormation(svc);
      const heuresPermanents = (svc.personnel || []).filter(p => p.typeContrat !== 'vacataire').reduce((s, p) => s + ((p.etp || 1) * 1607), 0);
      const totalPromos = svc.promos.length;
      if (totalPromos > 0 && bs.vacataires > 0) {
        const besoin = Math.round(bs.vacataires);
        out.push({
          id: `formation_vac_${svc.id}`,
          category: 'formation',
          severity: besoin > 20000 ? 'warning' : 'info',
          title: `Budget vacataires nécessaire — ${svc.nom}`,
          message: `${totalPromos} promo${totalPromos > 1 ? 's' : ''} → besoin vacataires estimé : ${besoin.toLocaleString('fr-FR')} €/an.`,
          detail: `Liaison formation↔budget : les heures de cours non assurées par les permanents génèrent un besoin de ${besoin.toLocaleString('fr-FR')} € de financement vacataire. Vérifiez l'enveloppe budget.`,
        });
      }
    });

    // ── Benchmarking inter-sites (services par site) ──────────────
    const siteMap = {};
    services.forEach(svc => {
      if (!getBudgetService) return;
      const bs = getBudgetService(svc);
      const site = svc.site || 'Non assigné';
      if (!siteMap[site]) siteMap[site] = { charges: 0, recettes: 0, etudiants: 0, ms: 0 };
      siteMap[site].charges  += bs.total;
      siteMap[site].recettes += bs.recettes;
      siteMap[site].ms       += bs.masseSalariale || 0;
      if (svc.promos) {
        const st = calculerStatsFormation(svc);
        siteMap[site].etudiants += st.effectifActuel || 0;
      }
    });
    const siteNames = Object.keys(siteMap).filter(k => k !== 'Non assigné');
    if (siteNames.length >= 2) {
      const siteStats = siteNames.map(s => ({
        nom: s,
        coutEtu: siteMap[s].etudiants > 0 ? Math.round(siteMap[s].charges / siteMap[s].etudiants) : 0,
        poidsPMS: siteMap[s].charges > 0 ? Math.round(siteMap[s].ms / siteMap[s].charges * 100) : 0,
        tauxMarge: siteMap[s].charges > 0 ? Math.round((siteMap[s].recettes - siteMap[s].charges) / siteMap[s].charges * 100) : 0,
      }));
      siteStats.sort((a, b) => a.coutEtu - b.coutEtu);
      const best = siteStats[0];
      const worst = siteStats[siteStats.length - 1];
      if (best.coutEtu > 0 && worst.coutEtu > 0 && best.nom !== worst.nom) {
        const diff = Math.round((worst.coutEtu - best.coutEtu) / best.coutEtu * 100);
        out.push({
          id: 'bench_sites',
          category: 'budget',
          severity: diff > 30 ? 'warning' : 'info',
          title: 'Benchmarking inter-sites',
          message: `${best.nom} : coût/étudiant le plus bas (${best.coutEtu.toLocaleString('fr-FR')} €).`,
          detail: `${worst.nom} est ${diff}% plus coûteux par étudiant (${worst.coutEtu.toLocaleString('fr-FR')} €). Poids MS : ${best.nom} ${best.poidsPMS}% vs ${worst.nom} ${worst.poidsPMS}%. Taux de marge : ${best.nom} ${best.tauxMarge >= 0 ? '+' : ''}${best.tauxMarge}% vs ${worst.nom} ${worst.tauxMarge >= 0 ? '+' : ''}${worst.tauxMarge}%.`,
        });
      }
    }

    // ── Trésorerie ────────────────────────────────────────────────
    if (tresorerie && tresorerie.length > 0) {
      const minTrso = Math.min(...tresorerie.map(m => m.tresorerieCumulee || 0));
      const hasNegative = tresorerie.some(m => (m.tresorerieCumulee || 0) < 0);
      if (hasNegative) {
        out.push({ id: 'trso_neg', category: 'tresorerie', severity: 'critical', title: 'Rupture de trésorerie prévue', message: `Solde cumulé minimum : ${Math.round(minTrso).toLocaleString('fr-FR')} €.`, detail: 'Des mois en trésorerie négative indiquent un risque de découvert bancaire. Anticipez par un décalage de paiements ou une mobilisation des réserves.' });
      } else if (minTrso < totalCharges / 12) {
        out.push({ id: 'trso_low', category: 'tresorerie', severity: 'warning', title: 'Trésorerie sous 1 mois de charges', message: `Minimum mensuel : ${Math.round(minTrso).toLocaleString('fr-FR')} € — tampon insuffisant.` });
      } else {
        out.push({ id: 'trso_ok', category: 'tresorerie', severity: 'good', title: 'Trésorerie confortable', message: `Solde minimum projeté : ${Math.round(minTrso).toLocaleString('fr-FR')} €.` });
      }
    }

    return out;
  }, [direction, poleSupport, services, getBudgetDirection, getBudgetPoleSupport, getBudgetService, masseSalarialeTotal, tresorerie]);

  const categories = [
    { id: 'all', label: 'Tout' },
    { id: 'budget', label: 'Budget' },
    { id: 'rh', label: 'RH' },
    { id: 'formation', label: 'Formation' },
    { id: 'tresorerie', label: 'Trésorerie' },
  ];

  const filtered = filter === 'all' ? insights : insights.filter(i => i.category === filter);
  const critCount = insights.filter(i => i.severity === 'critical').length;
  const warnCount = insights.filter(i => i.severity === 'warning').length;

  return (
    <div className={`fixed right-0 top-14 bottom-0 w-80 z-50 flex flex-col shadow-2xl border-l transition-all ${darkMode ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-slate-200'}`}>
      {/* Header */}
      <div className={`p-4 border-b flex items-center gap-2 ${darkMode ? 'border-zinc-700 bg-zinc-800' : 'border-slate-200 bg-slate-50'}`}>
        <div className="p-1.5 rounded-lg bg-violet-500/10">
          <Brain size={18} className="text-violet-500" />
        </div>
        <div className="flex-1">
          <div className={`font-black text-sm ${darkMode ? 'text-white' : 'text-slate-800'}`}>Copilote IA</div>
          <div className={`text-[10px] ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
            {critCount > 0 && <span className="text-red-500 font-bold">{critCount} critique{critCount > 1 ? 's' : ''} · </span>}
            {warnCount > 0 && <span className="text-amber-500 font-bold">{warnCount} alerte{warnCount > 1 ? 's' : ''} · </span>}
            {insights.length} insights
          </div>
        </div>
        <button onClick={onClose} className={`p-1 rounded-lg hover:bg-red-100 ${darkMode ? 'text-gray-400 hover:text-red-400' : 'text-slate-400 hover:text-red-500'}`}>
          <X size={16} />
        </button>
      </div>

      {/* Filtres */}
      <div className={`flex gap-1 p-2 border-b flex-wrap ${darkMode ? 'border-zinc-700' : 'border-slate-200'}`}>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setFilter(cat.id)}
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${
              filter === cat.id
                ? 'bg-violet-500 text-white'
                : darkMode ? 'bg-zinc-700 text-gray-300 hover:bg-zinc-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {cat.label}
            {cat.id !== 'all' && (
              <span className="ml-1 opacity-70">
                {insights.filter(i => i.category === cat.id).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Insights list */}
      <div className="flex-1 overflow-y-auto p-3">
        {filtered.length === 0 ? (
          <div className={`text-center py-8 text-xs ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
            <CheckCircle size={32} className="mx-auto mb-2 text-emerald-400" />
            Aucune anomalie détectée
          </div>
        ) : (
          filtered.map(item => <Insight key={item.id} item={item} darkMode={darkMode} />)
        )}
      </div>

      {/* Footer */}
      <div className={`p-2 border-t text-center ${darkMode ? 'border-zinc-700' : 'border-slate-200'}`}>
        <div className={`text-[9px] flex items-center justify-center gap-1 ${darkMode ? 'text-zinc-600' : 'text-slate-400'}`}>
          <Zap size={9} /> Analyse temps réel · Mise à jour automatique
        </div>
      </div>
    </div>
  );
}
