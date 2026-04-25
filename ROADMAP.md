# Roadmap — AFERTES Budget Association
Dernière mise à jour : 2026-04-25 | Version : 4.3 (Tier 1 Conformité livré — 237 tests verts)

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
- [ ] **C3 — Bilan prévisionnel actif/passif équilibré** : tableau formel pour bailleurs et CAC.
- [ ] **F1 — TVA multi-taux différenciée** : 5,5/10/20 par recette ou charge (formation continue Art. 261 4-4° CGI vs annexes assujetties).
- [ ] **F2 — Provision IDR actuarielle** : méthode UCP (Unités de Crédit Projetées, IAS 19) avec hypothèses turn-over, taux d'actualisation, table mortalité TF/TH.
- [ ] **A1 — Détection double-comptage Pool RH ↔ personnel direct** : moteur de réconciliation par identifiant agent.
- [ ] **C4 — Tableau de financement (PCG 532-7)** : ressources/emplois durables.

### 💡 Tier 3 — Roadmap 2027
- [ ] **DSN paie automatisée** (déjà Phase 6) : import via API DSN-FI.
- [ ] **Connecteur balance comptable** : import FEC inverse (logiciel certifié → application).
- [ ] **Benchmarking sectoriel** : API DataAssociations / UNAFORIS / CNESMS.
- [ ] **Open Data subventions** : data.gouv.fr DataSubventions pour anticiper.
- [ ] **Plan financement triennal formel** : avec contrats pluriannuels CTP/CER.
- [ ] **Reporting fiscal CFE/CET** : pour associations avec activités lucratives > 78 596 €.
- [ ] **Indicateurs RSE/sociétal** (parité, OETH).
- [ ] **Versionnement constantes fiscales** : historique modifications + auditabilité rétroactive.

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
