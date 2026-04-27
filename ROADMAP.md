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
- [~] **Mode Novice (Progressive Disclosure)** : Sidebar "Premiers pas" (4 onboarding actions) · 3 onglets essentiels + bouton "Plus" disclosure · Dashboard "Synthèse Simple" avec hero status ✓/⚠/✕ · libellés humanisés (Solde→Résultat, ETP→Effectifs) · `<Term>` glossaire inline auto (BFR/ETP/FRNG/CAF/Ségur soulignés pointillés + tooltip définition+levier). *Reste : tour guidé react-joyride.*
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

## 🏗️ Axe 6 : Pilotage Analytique Multidimensionnel (Expert Comptable)
*Objectif : Passer d'une vision globale à une analyse de rentabilité par centre de profit.*

- [ ] [Claude Code] **Moteur de Ventilation Quadridimensionnel** : Restructuration du `BudgetContext` pour supporter les "Splits".
    *   **S6.1 : Normalisation du Schéma** : Migration vers `AnalyticValue { total, splits: [] }`.
    *   **S6.2 : Référentiel de Structure (Dictionnaire)** ✅ : `referentielStructure.js` + `ReferentielStructurePanel.jsx` — CRUD 3 catégories (Lieux, Services, Filières), 5 types de service + 7 niveaux RNCP, code unique stable (slugify auto), détection doublons, archivage soft (préserve historique), helpers `genererOptions` pour selects, intégré TabParametres après ConstantesHistoriquePanel. 17 tests.
    *   **S6.3 : Moteur de Clés de Répartition (Overheads)** ✅ : `clesRepartition.js` + `ClesRepartitionPanel.jsx` — 7 clés (uniforme/ETP/recettes/charges/surface/heures/manuel) avec round-trip safe (somme distribuée = budget siège), calcul du coût complet par service (charges directes + quote-part siège), comparatif solde direct vs solde complet, persistance `globalParams.cleRepartition.{type, params}`. 16 tests.
    *   **S6.4 : Sélecteur de Contexte Analytique** : Toggle global UI pour basculer toute l'application en vue "Site" ou "Service".
- [ ] [Claude Code] **Contrôle Budgétaire Analytique (Prévu vs Réel)** :
    *   **Matching Engine** : Interface de "tagging" pour affecter les écritures de la balance comptable importée (Réel) aux sections analytiques (Prévu).
    *   **Analyse des Écarts** : Dashboard de comparaison avec alertes sur les dérives par centre de profit.
- [ ] [Claude Code] **Expertise Comptable Approfondie** :
    *   **Amortissements Analytiques** : Module de calcul de la charge d'usure des immobilisations par site pour un résultat net analytique fidèle.
    *   **Middleware IDR/TVA Analytique** : Ventilation automatique des charges fiscales et provisions.
- [ ] [Claude Code] **Dashboards de Profitabilité par Unité (P&L Analytique)** :
    - **Espace Lieu** : Compte de résultat par site géographique avec réallocation des frais de siège.
    - **Espace Service** : Analyse des marges par fonction (Pédagogie vs Restauration vs Technique).
- [ ] [Claude Code] **Analyse RH par Centre de Coût (Professionnel)** : Liaison dynamique entre `PoolRHManager.jsx` et les sections analytiques.
- [ ] [Claude Code] **Calcul du Coût de Revient par Unité d'Œuvre (Étudiant)** : Automatisation du calcul du coût complet par étudiant (Charges directes + Quote-part frais de structure).
- [ ] [Claude Code] **Reporting de Contribution** : Visualisation de la marge contributive par section pour identifier les leviers de performance.

---

## 🤝 Axe 7 : Gouvernance Associative & Engagement
*Objectif : Valoriser l'impact social et sécuriser les fonds publics.*

- [x] [Claude Code] **Moteur de Fonds Dédiés (CRC 2018-06)** : `fondsDedies.js` + `FondsDediesPanel.jsx` — Reports de subventions non consommées avec ventilation 194/195/197 (passif), schéma comptable 689→19→78. Statuts auto (actif/échu/soldé), alerte échéance <60j, tauxConsommation, recommandations contextuelles. CRUD inline, export CSV. Persistance `assoc_fonds_dedies`. 17 tests.
- [x] **Valorisation du Bénévolat (Compta Classe 8)** : `valorisationBenevolat.js` + `ValorisationBenevolatPanel.jsx` — CRC 2018-06. Comptes 871 (Bénévolat) / 872 (Prestations en nature) / 875 (Dons en nature). Coefficient ×1 standard / ×2 professionnel / ×3 expert sur SMIC chargé. Taux horaire personnalisable. Équilibre 86 = 87 visualisé. CRUD inline avec édition cellule par cellule. Export CSV pour annexe AG. 15 tests.
- [ ] [Claude Code] **Reporting Stratégique CPOM (5 ans)** : Dashboard pluriannuel comparant les objectifs négociés avec les financeurs (Région, ARS) et la trajectoire budgétaire réelle cumulée.
- [ ] [Claude Code] **Générateur de Rapport de Gestion pour l'AG** : Export automatisé d'une synthèse visuelle, pédagogique et commentée destinée aux administrateurs.

---

## 🌿 Axe 8 : Pilotage RSE & Budget Vert
*Objectif : Aligner la finance sur les objectifs de transition écologique.*

- [ ] [Claude Code] **Indicateurs de Performance Sociale** : Suivi des index d'égalité, taux d'emploi handicap et turn-over par service analytique.
- [ ] [Claude Code] **Module "Budget Vert"** : Classification des dépenses selon leur impact environnemental (Taxonomie verte simplifiée) pour les rapports financeurs.
- [ ] [Claude Code] **Calculateur d'Empreinte Carbone** : Estimation des émissions de CO2 par parcours de formation (calcul basé sur les unités d'œuvre : fluides, repas, déplacements).

---

## 🛡️ Axe 9 : Sécurisation du Cycle d'Achat & Engagements
*Objectif : Maîtriser les dépenses dès l'intention d'achat.*

- [ ] [Claude Code] **Workflow de Demande d'Achat (DA)** : Circuit de validation électronique (Collaborateur → Responsable → DAF) avant engagement.
- [x] **Suivi du "Reste à Engager"** : `resteAEngager.js` + `ResteAEngagerPanel.jsx` — Budget exploitation annuel − Engagements ouverts par entité (Siège/Pôle/Services). Taux d'engagement avec 4 niveaux (✓ &lt; 70 % · ⚠ 70-90 % · ✕ 90-100 % · 🔴 dépassement &gt; 100 %). Barre de progression colorée + bannière alerte + recommandation contextuelle DAF. Intégré TabAnalyse, total consolidé en footer. 16 tests.
- [ ] [Claude Code] **Coffre-Fort Numérique (Doc-Hub)** : Archivage sécurisé des pièces justificatives (contrats, conventions, factures) lié à l'Audit Trail.

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
| S4.2 | Recharts modernisés (`chartTheme.jsx`) | ✅ | 10 |
| S5.1 | `<DataTable>` composable (padding 12px, sortable, empty intégré) | ✅ | 19 |
| S5.2 | Modals Soft (animations + focus trap) | ✅ via `<Modal>` | — |
| S5.3 | Migration panels analyse vers `<DataTable>` | ✅ partiel (3/6) | — |
| S6.1 | `<Term>` glossaire inline auto | ✅ | 13 |
| S6.2 | Tour guidé `react-joyride` 5 étapes | ⏳ | — |

**Phase 8 : 12/14 sprints livrés** (S5.3 partiel) | **116 tests dédiés** | **411/411 verts | Build ✓**

---

## 📊 Indicateurs de Performance de l'Outil (KPIs 2026)
| Dimension | Objectif | Mesure de succès | État |
|---|---|---|---|
| **Accessibilité** | Excellence Novice | Utilisation autonome par les coordinateurs de site | 🟢 Sidebar Premiers pas + Dashboard Synthèse Simple livrés |
| **Sécurité** | Zéro Défaut Audit | Validation sans réserve par le Commissaire aux Comptes | 🟢 PBKDF2 600k + audit trail signé + FEC opposable |
| **Pilotage** | Agilité Totale | Nouveau scénario "Stress-test" en < 5 min | 🟡 Multi-scénarios livré, stress-test simplifié à finaliser |
| **Rentabilité** | Maîtrise des Coûts | Marge nette précise par filière de formation | 🟡 Coût/diplômé + enveloppe filière, CCHS à venir |
| **Analytique** | Vision 360° | Ventilation 100% des charges par Lieu/Service/Étudiant | 🔴 À démarrer (Axe 6) |

---

## 📅 Chronologie des Livrables Majeurs
1. **Avril 2026** ✅ : Phase 7 Conformité (FEC, CR PCG, Bilan, IDR, TVA, Tableau financement) + Phase 8 P1+P2 UI Modernisation.
2. **Mai 2026** : Finaliser Mode Novice (tour guidé + glossaire inline auto) + Recharts modernisés globalement.
3. **Juin 2026** : Workflow d'approbation multiniveaux complet + Stress-Test trésorerie ciblé subventions.
4. **Juillet 2026** : Lancement **Axe 6** — Refonte Moteur Analytique (Splits multidimensionnels).
5. **Septembre 2026** : Module CCHS + Analyse rentabilité Business Unit par filière + Dashboard par Lieu.
6. **Décembre 2026** : IA Prescriptive narrative + Connecteurs ETL DSN/Compta + Backend Supabase RBAC.

---

## 🔖 Légende
- [x] Livré · [~] En cours / partiel · [ ] Backlog
- 🟢 OK · 🟡 Partiel · 🔴 À démarrer

---
**Document de travail confidentiel — Direction Générale & DAF AFERTES**
