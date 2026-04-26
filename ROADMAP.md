# Roadmap Stratégique — Budget Association AFERTES
Dernière mise à jour : 25 Avril 2026 | Version : 7.1 (Excellence Décisionnelle & Gouvernance — état d'avancement)

---

## 🎯 Vision : Le Système de Soutien à la Décision (DSS)
> L'objectif est de dépasser le stade de la "Saisie Budgétaire" pour devenir le **Cerveau Financier** de l'association. Nous fusionnons l'excellence de l'ingénierie logicielle (UX sémantique) avec l'expertise métier des Organismes de Formation (Rentabilité pédagogique et gestion des risques).

---

## 🟢 Axe 1 : UX Sémantique & "Smart Data"
*Objectif : Passer de la lecture de chiffres à l'interprétation de signaux.*

- [x] **Design System Soft SaaS** : Tokens centralisés, surfaces glass, atomiques (Card, Button, Modal, Pill, Badge), TopBar 64px, Sidebar floating glass.
- [~] **Bibliothèque de "Smart Indicators"** : `<HoverTip>` riche (titre + description + interprétation contextuelle) · dots sémantiques 5 niveaux avec animate-pulse warning/danger · `<PanelStat>` KPI hero. *Reste : jauges d'énergie, alertes masse salariale visuelles.*
- [~] **Mode Novice (Progressive Disclosure)** : Sidebar "Premiers pas" (4 onboarding actions) · 3 onglets essentiels + bouton "Plus" disclosure · Dashboard "Synthèse Simple" avec hero status ✓/⚠/✕ · libellés humanisés (Solde→Résultat, ETP→Effectifs). *Reste : tour guidé react-joyride, glossaire inline auto sur termes techniques.*
- [ ] **Universal Search & Commands** : Raccourcis clavier (Type 'Spotlight') pour naviguer entre les filières et les salariés.
- [~] **Tableaux de Bord Sémantiques** : `<NoviceDashboard>` Synthèse Simple livré (hero status + 3 KPIs hero + AreaChart trésorerie soft + top 3 vigilances + CTA mode expert). *Reste : "Stories" par promo/filière, sankey flux financiers.*

---

## 🔵 Axe 2 : Cockpit de Résilience & Trésorerie
*Objectif : Anticiper les ruptures de cash et sécuriser les instances.*

- [x] **Radar de Santé Financière** : `radarSante.js` — score stratégique externalisé, ratios solvabilité, génération rapport stratégique PDF.
- [~] **Simulateur de Stress-Test** : Curseur global ±% sur recettes/charges + scénario what-if 4 paramètres (Δrecettes/Δcharges/ΔMS/subv.perdue) avec graphique 3 ans. *Reste : décalage spécifique des subventions Région/OPCO (impact retard paiement).*
- [x] **Dashboard "Board Mode" (CA)** : `BoardModeView.jsx` — overlay plein écran fond slate-900, KPIs grands chiffres, trajectoire 3 ans, trésorerie 12 mois, points de vigilance, sortie Échap.
- [x] **Projection d'Atterrissage N+1** : Rolling Forecast (saisie réalisé mensuel + fusion prévisionnel) · Projection 36 mois avec inflation/GVT différenciés · alertes mois en solde cumulé négatif.

---

## 🟠 Axe 3 : Ingénierie Pédagogico-Financière
*Objectif : Piloter la rentabilité réelle des formations.*

- [x] **Calculateur Vacataires Expert** : Coûts complets, grille tarifaire personnalisable, seuil 450h URSSAF, alerte ratio MS > 30 %, multiplicateurs (correction copies ×3).
- [ ] **Indicateur CCHS (Coût Complet Horaire Stagiaire)** : Coût de revient réel d'une heure de formation, incluant les charges de structure (loyer, énergie, support).
- [~] **Portefeuille de Programmes (Filières)** : `EnveloppeFiliere.jsx` — répartition subvention/charges par filière + coût/diplômé éditable. *Reste : management "Business Unit" avec marge nette par filière, leviers d'optimisation chiffrés.*
- [~] **Suivi des Quotas & Rupture de Charge** : Alerte automatique abandons + simulateur impact taux d'abandon. *Reste : seuil de rentabilité chiffré par promo et alerte automatique en dessous.*

---

## 🟣 Axe 4 : Gouvernance, Workflow & Audit
*Objectif : Sécuriser la chaîne de responsabilité et automatiser l'intelligence.*

- [x] **Audit Trail SHA-256** : `auditTrail.js` chaîne cryptographique du journal · vérification d'intégrité au montage · migration legacy auto · bannière rouge si rupture.
- [~] **Workflow d'Approbation Multiniveaux** : Statut budget Brouillon→Soumis→Validé→Gelé · verrouillage DAF (PBKDF2 600k) sur constantes fiscales. *Reste : commentaires contextuels par étape, validation Collaborateur→DAF→DG explicite.*
- [~] **Versionnement Comparatif (Snapshot)** : `ScenariosManager.jsx` (8 scénarios versionnés) · Versionnement constantes fiscales (12 constantes historisées + audit rétroactif `valeurALaDate`). *Reste : comparaison visuelle "Budget Initial vs Révisé vs Réalisé" en interface unique.*
- [~] **Copilote IA Prescriptif** : `AICopilot.jsx` (analyse stratégique) · Audit prédictif (10 familles d'anomalies dont double-comptage Pool RH). *Reste : narratifs ciblés type "Votre masse salariale dérive de 4 % sur Arras à cause du recours accru aux vacataires".*
- [ ] **Connecteur ETL (Paie/Compta)** : Import DSN automatisé · synchronisation balance comptable inverse (FEC importé depuis logiciel certifié).

---

## ⚖️ Axe 5 : Conformité Réglementaire & Sécurité (Phase 7 livrée)
*Objectif : Garantir l'opposabilité fiscale et la robustesse du SI.*

- [x] **Sécurité applicative** : PBKDF2 600 000 itérations (OWASP 2023) · masquage `demo2025` en production · audit trail SHA-256 chaîné.
- [x] **États financiers prévisionnels** : Compte de Résultat formel PCG associatif (CRC 99-01) · Bilan prévisionnel actif/passif équilibré · Tableau de Financement PCG 532-7 · Provision IDR actuarielle UCP/IAS 19.
- [x] **Export FEC opposable** : Format BOI-CF-IOR-60-40 — 18 colonnes pipe-delimited UTF-8, écritures équilibrées, nommage `<SIREN>FEC<AAAA>1231.txt`.
- [x] **Fiscal multi-taux** : TVA différenciée 0/5,5/10/20 avec coefficient de déduction activité mixte (BOI-TVA-DED-20-10) · taxe salaires barème progressif CGI 231 · IFC CCN 66 art. 26 graduel.
- [x] **Détection anomalies** : Audit prédictif 10 familles (sous-provisionnement, dérive N-1, omissions fiscales, double-comptage Pool RH).
- [ ] **Backend Supabase + RBAC** : Multi-utilisateurs concurrents avec séparation des fonctions (DG/DAF/Resp. site/Comptable). Seul item Tier 2 audit DAF non livré (chantier infra serveur).

---

## 📊 État d'avancement Phase 8 — Modernisation UI/UX

| Sprint | Livrable | Statut | Tests |
|---|---|---|---|
| S1.1 | Design tokens (`tokens.js`) | ✅ | — |
| S1.2 | `<DataPanel>` + `<PanelStat>` + `<EmptyState>` | ✅ | — |
| S1.3 | `<Card>` / `<Button>` / `<Modal>` / `<Pill>` / `<Badge>` | ✅ | 22 |
| S2.1 | `<TopBar>` 64px 3 zones + `<ToolsMenu>` dropdown | ✅ | 14 |
| S2.2 | KPIs humanisés + `<HoverTip>` riche pédagogique | ✅ | 9 |
| S3.1 | Sidebar floating glass + section "Premiers pas" | ✅ | 9 |
| S3.2 | `<TabBar>` Mode Essentiel (3 onglets + Plus) | ✅ | 9 |
| S4.1 | `<NoviceDashboard>` Synthèse Simple | ✅ | 11 |
| S4.2 | Recharts modernisés globalement (thin, soft fills) | 🟡 partiel | — |
| S5.1 | `<DataTable>` moderne (padding, hover, empty) | ⏳ | — |
| S5.2 | Modals Soft (animations + focus trap) | ✅ via `<Modal>` | — |
| S5.3 | Migration 6 panels analyse vers `<DataPanel>` | ⏳ | — |
| S6.1 | `<Term>` glossaire inline auto | ⏳ | — |
| S6.2 | Tour guidé `react-joyride` 5 étapes | ⏳ | — |

**Phase 8 : 8/14 sprints livrés** | **74 tests dédiés** | **369/369 verts | Build ✓**

---

## 📊 Indicateurs de Performance de l'Outil (KPIs 2026)
| Dimension | Objectif | Mesure de succès | État |
|---|---|---|---|
| **Accessibilité** | Excellence Novice | Utilisation autonome par les coordinateurs de site | 🟢 Sidebar Premiers pas + Dashboard Synthèse Simple livrés |
| **Sécurité** | Zéro Défaut Audit | Validation sans réserve par le Commissaire aux Comptes | 🟢 PBKDF2 600k + audit trail signé + FEC opposable |
| **Pilotage** | Agilité Totale | Nouveau scénario "Stress-test" en < 5 min | 🟡 Multi-scénarios livré, stress-test simplifié à finaliser |
| **Rentabilité** | Maîtrise des Coûts | Marge nette précise par filière de formation | 🟡 Coût/diplômé + enveloppe filière, CCHS à venir |

---

## 📅 Chronologie des Livrables Majeurs
1. **Avril 2026** ✅ : Phase 7 Conformité (FEC, CR PCG, Bilan, IDR, TVA, Tableau financement) + Phase 8 P1+P2 UI Modernisation.
2. **Mai 2026** : Finaliser Mode Novice (tour guidé + glossaire inline auto) + Recharts modernisés globalement.
3. **Juin 2026** : Workflow d'approbation multiniveaux complet + Stress-Test trésorerie ciblé subventions.
4. **Septembre 2026** : Module CCHS + Analyse rentabilité Business Unit par filière.
5. **Décembre 2026** : IA Prescriptive narrative + Connecteurs ETL DSN/Compta + Backend Supabase RBAC.

---

## 🔖 Légende
- [x] Livré · [~] En cours / partiel · [ ] Backlog
- 🟢 OK · 🟡 Partiel · 🔴 À démarrer

---
**Document de travail confidentiel — Direction Générale & DAF AFERTES**
