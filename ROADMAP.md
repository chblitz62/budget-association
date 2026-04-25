# Roadmap — AFERTES Budget Association
Dernière mise à jour : 2026-04-25 | Version : 4.9 (Phase 8 S2.1 livré — TopBar + ToolsMenu — 331 tests verts)

---

## Vision 2026 : Pilotage Stratégique & Résilience Financière
> L’exercice 2026 marque la transition du budget-association vers un dispositif de **pilotage stratégique et de résilience financière** de haut niveau. Cette phase se concentre sur trois axes directeurs validés par la Direction Générale et Financière : la **fiabilisation de la masse salariale** par l'intégration native des barèmes fiscaux 2026 et du coût réel de l'absentéisme, la **sécurisation de la ventilation analytique** via un moteur d'import Excel intelligent capable de prévenir les risques de double-comptage, et l'évolution de l'**AICopilot vers une intelligence prescriptive**. L'objectif est de transformer la donnée comptable brute en un véritable levier d'aide à la décision, capable de simuler l'impact des taux d'abandon sur la trésorerie à 36 mois et d'automatiser le benchmarking opérationnel inter-sites, tout en garantissant une conformité RGPD rigoureuse pour les données RH mutualisées.

---

## État global

| Dimension | Score actuel | Cible |
|---|---|---|
| Précision des calculs | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Transversalité des données | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Gouvernance & Rôles | ⭐ | ⭐⭐⭐⭐⭐ |
| Aide à la Décision (IA) | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| Pédagogie Financière | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| Fiabilité DAF | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Interopérabilité | ⭐ | ⭐⭐⭐⭐⭐ |

**Verdict DG/DAF** : ✅ L'outil est désormais **fiscalement et mathématiquement robuste** (Corrections Audit CAC 2026-04-19 terminées). Le moteur de calcul est certifié conforme CCN 66 et CGI 2026. Le focus se déplace maintenant vers la **Gouvernance**, l'**Acculturation Financière** des responsables de sites et l'**Intelligence Prédictive**.

---

## 🟣 Phase 4 — Pilotage Stratégique & Gouvernance (Q2-Q3 2026)

### Pilotage de la Masse Salariale & RH
- [x] **Détection proactive des dépassements vacataires** : Alerte visuelle inline (`border-red-400` + badge "Seuil 450h dépassé") dans chaque carte vacataire `TabBudget.jsx` ; alerte ratio vacataires au-dessus de 30% MS déjà affichée. *(Déjà implémenté)*
- [x] **Simulateur de recrutement stratégique** : Widget interactif dans `TabAnalyse` — paramètres salaire/ETP/contrat/Ségur/date ; KPIs coût annuel, taxe sur salaires, impact BFR URSSAF, nouveau solde prévisionnel. *(Implémenté 2026-04-20)*
- [x] **Pilotage de l'Atterrissage (Rolling Forecast)** : Fusion du réalisé comptable (mois écoulés) et du prévisionnel pour projeter l'atterrissage à fin d'année. *(Implémenté 2026-04-20 — saisie réalisés par mois, tableau et KPIs atterrissage dans TabDashboard)*

### Stratégie & Scénarios
- [x] **Gestion Multi-Scénarios (Versioning)** : `ScenariosManager.jsx` — sauvegarde/restauration jusqu'à 8 scénarios nommés (capture complète localStorage), intégré dans `TabParametres`. *(Implémenté 2026-04-20)*
- [x] **Mode "What-if" DG** : Scénario personnalisé avec 4 paramètres (Δ recettes, Δ charges exploit., Δ masse salariale, subvention perdue) et graphique 3 ans interactif, dans la section Analyse de scénarios du Dashboard. *(Implémenté 2026-04-20)*
- [x] **Verrouillage Institutionnel** : `useDafMode` hook + `DafLockPanel` dans `TabParametres` — mot de passe DAF distinct (PBKDF2), session 30 min en `sessionStorage`. Verrouille charges patronales, Ségur, taxe salaires, GVT, augmentation annuelle, inflations différenciées et grille tarifaire vacataires. *(Implémenté 2026-04-25)*

---

## 🎨 Phase 5 — UX Décisionnelle & Pédagogie (Q3-Q4 2026)

### Architecture du Glossaire Interactif
- [x] **Centralisation `glossary.js`** : `src/utils/glossary.js` regroupe 12 termes (BFR, Fillon, Point Mort, IFC, Ségur, GVT, OPCO, taxe salaires, etc.) avec catégorisation. *(Implémenté 2026-04-25)*
- [x] **Ton "Impact & Action"** : Chaque entrée du glossaire suit le triptyque *Définition* → *Impact sur le solde* → *Levier d'action conseillé*. *(Implémenté 2026-04-25)*
- [x] **Panneau "Éco-Fin"** : `EcoFinPanel.jsx` accessible depuis le bouton 📖 dans la barre du haut (toujours visible) — recherche full-text, filtre par catégorie, vue détaillée 3 sections. *(Implémenté 2026-04-25)*

### Expérience Utilisateur Haute Direction
- [x] **Visualisation du Point Mort** : Graphique Break-Even (ComposedChart) dans `TabAnalyse` — courbes Recettes / Charges totales avec ligne verticale au point mort, affiché sous le tableau des promotions. *(Implémenté 2026-04-20)*
- [x] **Dashboard "Mode CA"** : `BoardModeView.jsx` — vue épurée plein écran (fond slate-900) avec KPIs grands chiffres, trajectoire 3 ans, trésorerie 12 mois et points de vigilance ; bouton « Mode CA » dans `TabDashboard`, sortie par Échap. *(Implémenté 2026-04-25)*
- [ ] **Optimisation Tactile** : Adaptation de l'interface pour une consultation fluide sur tablette (mobilité DG).

---

## 🚀 Phase 6 — Intelligence Collective & Interopérabilité (2027)

### Reporting d'Impact (Plaidoyer)
- [x] **Indicateurs de Performance Sociale** : Table "Coût/diplômé" dans `TabAnalyse` — `tauxDiplomationParService` éditable par service dans `globalParams` ; coût/diplômé = coût/étudiant ÷ taux diplomation. *(Implémenté 2026-04-20)*
- [x] **Note de Synthèse Narrative** : `exportSyntheseNarrative` dans `pdfExport.js` ; bouton "Exporter PDF" à côté du bouton "Rapport stratégique" dans `TabAnalyse`. *(Implémenté 2026-04-20)*

### Connexion Écosystème (ETL)
- [ ] **Connecteurs Paie/Compta** : Import automatisé des DSN (Paie) et des journaux d'achats pour supprimer la double saisie manuelle.
- [x] **Intelligence Prédictive** : `anomaliesHistorique.js` + `AuditPredictifPanel.jsx` — détecte 6 familles d'anomalies (sous-provisionnement congés/IFC, omission taxe salaires, charges patronales hors plage CCN 66, chute recettes vs N-1, dérive charges vs N-1+inflation+GVT, déficits récurrents par service, sous-estimation MS, coefficient BP minorant). Affiché en tête de `TabAnalyse` avec filtre par niveau (Critiques / Avertissements / Info) et levier d'action par anomalie. *(Implémenté 2026-04-25)*

---

## 🔒 Phase 7 — Conformité Réglementaire & Sécurité Production (2026 Q2)

> Audit DAF senior 2026-04-25 — application notée ⭐⭐⭐½. Outil de pilotage excellent mais **pas un SI comptable certifié**. Corrections Tier 1 non négociables avant déploiement multi-sites.

### 🚨 Tier 1 — Bloquant déploiement (≤ 30 jours)
- [x] **S1 — Suppression `demo2025` en production** : `LoginScreen.jsx` conditionné à `import.meta.env.DEV`. *(Implémenté 2026-04-25)*
- [x] **S2 — PBKDF2 100k → 600k itérations** : préfixe `pbkdf2v2:` ; migration douce v1→v2 au prochain login ; OWASP 2023 (SHA-256). *(Implémenté 2026-04-25)*
- [x] **C1 — Export FEC conforme BOI-CF-IOR-60-40** : `fecExport.js` — 18 colonnes pipe-delimited UTF-8, écritures équilibrées (ΣD=ΣC), bouton dans TabParametres ; nommage `<SIREN>FEC<AAAA>1231.txt`. 7 tests dédiés. *(Implémenté 2026-04-25)*
- [x] **C2 — Compte de résultat formel PCG associatif** : `compteResultat.js` + `CompteResultatPanel.jsx` — classes 60-68/70-78 (CRC 99-01 / Règl. ANC 2018-06), soldes intermédiaires (résultat exploitation/financier/exceptionnel/courant/net), export CSV ; intégré dans TabAnalyse. 6 tests. *(Implémenté 2026-04-25)*
- [x] **G2 — Audit trail signé (chaînage SHA-256)** : `auditTrail.js` — chaque entrée référence le hash de la précédente ; vérification d'intégrité au montage ; migration legacy automatique ; bannière d'alerte rouge si chaîne rompue ; sérialisation des appends concurrents. 7 tests. *(Implémenté 2026-04-25)*

### ⚠️ Tier 2 — Avant clôture 2026 (≤ 90 jours)
- [ ] **Backend Supabase + RBAC 4 rôles** (DG, DAF, Resp. site, Comptable) : multi-utilisateurs concurrents, séparation des fonctions saisie/validation.
- [x] **C3 — Bilan prévisionnel actif/passif équilibré** : `bilanPrevisionnel.js` + `BilanPrevisionnelPanel.jsx` — Actif (immo nettes, stocks, créances, disponibilités) = Passif (capitaux propres, provisions, dettes financières/fournisseurs/URSSAF, découvert) ; vérification d'équilibre à 1 € près ; export CSV. 8 tests. *(Implémenté 2026-04-25)*
- [x] **F1 — TVA multi-taux différenciée** : `tvaMultiTaux.js` + `TVAMultiTauxPanel.jsx` — taux 0/5,5/10/20, agrégation par taux, coefficient de déduction (CA assujetti / CA total) pour activité mixte BOI-TVA-DED-20-10, TVA collectée/déductible, solde à reverser ou crédit, alerte activité mixte. 10 tests. *(Implémenté 2026-04-25)*
- [x] **F2 — Provision IDR actuarielle** : `provisionIDR.js` + `ProvisionIDRPanel.jsx` — méthode UCP / IAS 19 / ANC 2013-02. Hypothèses paramétrables (taux actu., turn-over, âge retraite 64, charges 47 %, mortalité). Calcul agent par agent : engagement nominal × P_présence × P_survie × actualisation. Table détaillée + export CSV. 10 tests. *(Implémenté 2026-04-25)*
- [x] **A1 — Détection double-comptage Pool RH ↔ personnel direct** : `doubleComptageDetection.js` — match exact (numeroAgent) + fuzzy (slug du titre), 3 niveaux de confiance (haute/moyenne/basse), surcoût annuel estimé. Intégré dans audit prédictif. 9 tests. *(Implémenté 2026-04-25)*
- [x] **C4 — Tableau de financement (PCG 532-7)** : `tableauFinancement.js` + `TableauFinancementPanel.jsx` — Ressources durables (CAF + emprunts + subv. invest. + cessions) vs Emplois durables (investissements + remboursements capital + distribution résultat). CAF = Résultat + Dot.amort + Dot.prov. ΔFRNG = Ress. − Emplois. ΔTrésorerie = ΔFRNG − ΔBFR. 9 tests. *(Implémenté 2026-04-25)*

### 💡 Tier 3 — Roadmap 2027
- [ ] **DSN paie automatisée** (déjà Phase 6) : import via API DSN-FI.
- [ ] **Connecteur balance comptable** : import FEC inverse (logiciel certifié → application).
- [ ] **Benchmarking sectoriel** : API DataAssociations / UNAFORIS / CNESMS.
- [ ] **Open Data subventions** : data.gouv.fr DataSubventions pour anticiper.
- [ ] **Plan financement triennal formel** : avec contrats pluriannuels CTP/CER.
- [ ] **Reporting fiscal CFE/CET** : pour associations avec activités lucratives > 78 596 €.
- [ ] **Indicateurs RSE/sociétal** (parité, OETH).
- [x] **Versionnement constantes fiscales** : `constantsVersionRegistry.js` + `ConstantesHistoriquePanel.jsx` — 12 constantes versionnables (CHARGES_PATRONALES, SMIC, Ségur, taxe salaires T1/T2/T3, seuils, Fillon, apprenti, vacataires). Historique daté avec source légale + justification. Helper `valeurALaDate()` pour audit rétroactif (recalcul d'un budget passé). Détection automatique d'incohérences code source ↔ historique. Export CSV. Verrouillage DAF. 12 tests. *(Implémenté 2026-04-25)*

---

## 🎨 Phase 8 — Modernisation UI/UX Soft SaaS (Q3 2026)

> Audit Senior Product Designer 2026-04-25 : interface dense, typographie micro (`text-xs`/`text-[9px]` partout), 8 teintes KPI sans hiérarchie, jargon technique non accompagné. Cible : utilisateurs novices (responsables sites, élus CA) qui consultent ponctuellement sans formation.

### Direction artistique validée
- **Palette** : Slate/Zinc (neutres) + Indigo/Violet (primaire) + 5 statuts (success/warning/danger/info/neutral) — passage de 8 à 5 teintes
- **Glass surfaces** : `bg-white/80 backdrop-blur-xl border-slate-200/60 rounded-2xl shadow-sm` (vs `shadow-md` saturé actuel)
- **Typographie** : Hero KPI 36px, Title 18px, Body 14px, Label 11px uppercase tracking-wider — fin du `text-xs`/`text-[9px]` en lecture
- **Grille 8px stricte** : px-2/4/6/8 — cards padding 24px, gap 24px
- **Lucide thin** : `strokeWidth={1.5}` systématique
- **Header 56→64px** + **3 zones** (logo+page / KPIs hero / actions essentielles)

### 🔴 P1 — Sprint 1-2 (Foundation + Shell) — ≤ 5 jours
- [x] **S1.1 Design tokens centralisés** : `src/styles/tokens.js` — surface/text/button/status/spacing/iconProps. Source unique pour toute la couche présentation. *(Implémenté 2026-04-25)*
- [x] **S1.2 Composant atomique `<DataPanel>`** : header standardisé (icône pastille tone + title + subtitle novice + help bulle), summary toujours visible, content collapsible, emptyState slot. + `<PanelStat>`, `<PanelStatusBadge>`, `<EmptyState>` réutilisables. *(Implémenté 2026-04-25)*
- [x] **S1.3 Composants atomiques restants** : `<Card>` (3 variantes + Header/Body/Footer), `<Button>` (5 variantes + leftIcon/rightIcon/loading/iconOnly/fullWidth + 3 sizes), `<Modal>` (animations zoom-in/fade-in, focus trap, ESC, body scroll lock, restitution focus + sub-composants Header/Body/Footer + `<ConfirmModal>` prêt à l'emploi), `<Pill>` + `<Badge>` (5 statuts). Animations natives Tailwind (zoom-in, slide-up, fade-in dans tailwind.config.js — pas de dépendance ajoutée). 22 tests dédiés. *(Implémenté 2026-04-25)*
- [x] **S2.1 Layout shell modernisé** : `<TopBar>` 64px en 3 zones (logo+page · KPIs hero centrés · actions) ; `<ToolsMenu>` dropdown regroupant Privacy/EcoFin/AI/Dark mode/Paramètres avec `MoreHorizontal` ; surface glass `bg-white/80 backdrop-blur-xl` ; sidebar repositionnée à `top: 64px`. Header désormais lisible (typographie 18-20px tabular-nums vs 12px ancienne) ; badges secondaires (statut budget, coeff BP, stress test) en `<Pill>` rounded-full visibles UNIQUEMENT si actifs (réduction bruit visuel novice). 14 tests dédiés. *(Implémenté 2026-04-25)*
- [ ] **S2.2 KPIs topbar redesignés** : passage de 12px à 16-20px lisibles, libellés humanisés ("Solde" → "Résultat prévisionnel"), tooltip riche au survol expliquant l'impact.

### 🟠 P2 — Sprint 3-4 (Navigation + Dashboard) — ≤ 4 jours
- [ ] **S3.1 Sidebar v2 floating glass** : `bg-white/90 backdrop-blur-xl` ; section "🏠 Premiers pas" en haut pour novices avec lien wizard ; regroupement Saisie/Pilotage/Audit clair ; badges solde discrets sur services.
- [ ] **S3.2 Mode "Essentiel" pour onglets** : afficher d'abord 3 onglets clés (Tableau de bord / Budget / Analyse) + bouton "Plus" dépliant les 8 autres ; toggle "Mode expert" dans Paramètres pour tout afficher.
- [ ] **S4.1 Vue Dashboard "Synthèse Simple" (novice)** : page d'accueil avec status global ("✓ Tout va bien" / "⚠ Action requise" / "✕ Attention") basé sur `kpiGlobaux.alertes` ; 3 KPIs hero ; 1 graphique trésorerie épuré ; bouton "En savoir plus" → vue expert actuelle.
- [ ] **S4.2 Recharts modernisés** : `strokeWidth={1.5}`, area fills `fillOpacity={0.1}`, tooltip custom avec border + shadow doux, axes simplifiés (suppression grids verticales), couleurs limitées à indigo/violet/emerald/rose.

### 🟡 P3 — Sprint 5-6 (Composants + Pédagogie) — ≤ 3 jours
- [ ] **S5.1 `<DataTable>` moderne** : padding cellules 12px (vs 6-8 actuel), hover `bg-slate-50/50`, zebra striping subtil, sticky header, empty state intégré, sort UI épuré.
- [ ] **S5.2 Modals Soft** : centrage flex, backdrop `bg-zinc-950/40 backdrop-blur-sm`, animations entrée scale-95→100 + fade, focus trap, esc key, action principale en bas-droite.
- [ ] **S5.3 Migration progressive panels existants vers `<DataPanel>`** : commencer par les 6 panels d'analyse (CompteResultat, Bilan, IDR, TVA, TableauFinancement, AuditPredictif) — preuve de concept avant gros refactor.
- [ ] **S6.1 Glossaire inline auto** : composant `<Term>` qui détecte les termes du glossaire dans le texte (BFR, ETP, FRNG, CAF, Ségur…) et affiche tooltip riche au survol (définition + impact + levier). Fin du jargon brut.
- [ ] **S6.2 Tour guidé "première utilisation"** : library `react-joyride` — 5 étapes pour novice (Sidebar → KPIs → Sauver → Mode CA → Aide). Déclenchable via Sidebar "Premiers pas".

### 💡 P4 — Sprint 7+ (Polish & Animations) — backlog
- [ ] **Optimisation tactile** (déjà roadmap Phase 5) : tablette DG mobile, touch targets 44px min.
- [ ] **Micro-animations Framer Motion** : transitions onglets, apparition cards staggered, drag-and-drop services.
- [ ] **Skeleton loaders** sur calculs lourds (projection 36 mois).
- [ ] **Haptic feedback** sur actions tactiles (mobile/tablette).
- [ ] **Prefers-reduced-motion** : respect de l'option système.

### Stratégie de migration (zéro régression)
1. **Couche présentation isolée** : tokens + composants atomiques en parallèle de l'existant
2. **Migration panel par panel** : DataPanel d'abord, puis Layout, puis Sidebar
3. **Feature flag `useNewUI`** dans Paramètres pour basculer ancien/nouveau pendant phase de transition
4. **Tests visuels** : screenshots Playwright avant/après chaque sprint

---

## ✅ Historique des Corrections (Audit CAC 2026-04-19)

| Date | Correction | Impact DAF |
|---|---|---|
| 2026-04-19 | **Taxe Salaires Progressif** | Correction de l'assiette fiscale (CGI 231) |
| 2026-04-19 | **IFC CCN 66** | Alignement sur les barèmes d'ancienneté gradués |
| 2026-04-19 | **BFR URSSAF** | Intégration des dettes sociales au passif (45j) |
| 2026-04-19 | **Prorata Temporis** | Amortissements calculés au mois près (PCG 214-9) |
| 2026-04-19 | **Projection 36 mois** | Modélisation de la trajectoire financière long terme |
| 2026-04-20 | **Radar de Santé 2.6** | Externalisation du moteur de score stratégique |
| 2026-04-20 | **Export EPRD/ERRD** | Socle conforme pour le pilotage médico-social |
| 2026-04-25 | **Verrouillage DAF** | Constantes fiscales/RH protégées par mot de passe DAF dédié, session 30 min |
| 2026-04-25 | **Glossaire Éco-Fin** | 12 termes DAF centralisés (Définition / Impact / Levier) + panneau global |
| 2026-04-25 | **Mode CA** | Vue épurée plein écran pour présentation Bureau/Conseil d'Administration |
| 2026-04-25 | **Audit prédictif** | 6 familles d'anomalies détectées avant validation (sous-provisionnement, dérive N-1, omission fiscale) |
| 2026-04-25 | **S1 — `demo2025` masqué en prod** | Mot de passe par défaut visible uniquement en `import.meta.env.DEV` (LoginScreen) |
| 2026-04-25 | **S2 — PBKDF2 600k itérations** | Alignement OWASP 2023 ; migration douce v1→v2 transparente ; préfixe `pbkdf2v2:` |
| 2026-04-25 | **G2 — Audit trail signé SHA-256** | Chaîne cryptographique du journal ; détection altération a posteriori ; bannière d'alerte si rupture |
| 2026-04-25 | **C1 — Export FEC BOI-CF-IOR-60-40** | Fichier opposable contrôle fiscal ; 18 colonnes ; écritures équilibrées ; bouton TabParametres |
| 2026-04-25 | **C2 — Compte de résultat PCG associatif** | Classes 60-68/70-78 ; soldes intermédiaires ; export CSV ; CRC 99-01 / Règl. ANC 2018-06 |
| 2026-04-25 | **C3 — Bilan prévisionnel actif/passif** | Bilan équilibré construit du budget (immo, BFR, capitaux propres, dettes, trésorerie) ; export CSV |
| 2026-04-25 | **A1 — Détection double-comptage Pool RH** | Réconciliation Pool RH ↔ personnel direct ; match numéro agent + fuzzy ; surcoût estimé ; intégré audit prédictif |
| 2026-04-25 | **F2 — Provision IDR actuarielle UCP** | Méthode IAS 19 / ANC 2013-02 ; turn-over + actualisation + survie ; hypothèses paramétrables ; tableau agent par agent |
| 2026-04-25 | **F1 — TVA multi-taux différenciée** | Taux 0/5,5/10/20 par recette/charge ; coefficient de déduction activité mixte ; alerte BOI-TVA-DED-20-10 ; préparation CA3 |
| 2026-04-25 | **C4 — Tableau de financement PCG 532-7** | Ressources/emplois durables ; CAF ; ΔFRNG ; ΔBFR ; ΔTrésorerie ; export CSV |
| 2026-04-25 | **Versionnement constantes fiscales** | 12 constantes historisées avec date application + source légale + justification ; `valeurALaDate()` pour audit rétroactif ; détection incohérences code↔historique |
| 2026-04-25 | **Phase 8 — Design tokens Soft SaaS** | `src/styles/tokens.js` source unique (surfaces glass, palette 5 statuts, typographie hero/title/body/label, grille 8px, Lucide thin) — fondation du refactoring UI/UX |
| 2026-04-25 | **Phase 8 — Composant `<DataPanel>`** | Template novice-friendly : header standardisé (icône pastille + title + subtitle pédagogique + help), summary toujours visible, content collapsible, slot emptyState ; + `<PanelStat>` (KPI hero 36px), `<PanelStatusBadge>`, `<EmptyState>` |
| 2026-04-25 | **Phase 8 — Atomiques Card/Button/Modal/Pill** | `<Card>` 3 variantes + Header/Body/Footer ; `<Button>` 5 variantes (primary/secondary/ghost/tertiary/destructive) + loading + leftIcon/rightIcon/iconOnly + 3 sizes ; `<Modal>` animations zoom-in + focus trap + ESC + body scroll lock + `<ConfirmModal>` ; `<Pill>` + `<Badge>` 5 statuts ; animations natives tailwind.config |
| 2026-04-25 | **Phase 8 — TopBar 64px + ToolsMenu** | Header en 3 zones distinctes (logo+page / KPIs hero centrés / actions) ; `<ToolsMenu>` dropdown regroupe 5 actions secondaires (Privacy/EcoFin/AI/Dark mode/Paramètres) ; KPIs lisibles 18-20px vs 12px ; badges secondaires en pills affichés UNIQUEMENT si actifs |

---

## Hardcodes & Constantes Stratégiques

| Constante | Valeur 2026 | Vigilance |
|---|---|---|
| `SMIC_MENSUEL` | 1 841,45 € | 1er novembre |
| `CHARGES_PATRONALES` | 44 % | CCN 66 / Prévoyance |
| `TAUX_TAXE_SALAIRES` | Barème progressif | CGI Art. 231 |
| `PRIME_SEGUR` | 238 €/ETP/mois | Accord de branche |
| `SEUIL_VACATAIRES` | 450 h/an | Risque URSSAF |

---
**Document de travail confidentiel — Direction Générale AFERTES**
