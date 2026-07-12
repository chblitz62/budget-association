# Roadmap Stratégique — Budget Association AFERTES
Dernière mise à jour : 05 Mai 2026 | Version : 7.17 (Bilan Social annuel livré · Axe 8 RH bouclé · 774 tests verts)

---

## 🎯 Vision : ERP DAF complet pour OF associatif (validée Mai 2026)
> L'objectif est de dépasser le stade de la "Saisie Budgétaire" pour devenir le **ERP DAF complet** de l'association — le système de référence couvrant la totalité du cycle de gestion : pilotage budgétaire, conformité comptable PCG/CRC, conformité sectorielle OF (BPF/Qualiopi), reporting Direction (PPI/Risques), fiscalité étendue, gouvernance associative, RH stratégique. Nous fusionnons l'excellence de l'ingénierie logicielle (UX sémantique) avec l'expertise métier des Organismes de Formation (Rentabilité pédagogique et gestion des risques).
>
> **Périmètre AFERTES validé** : ≈ 40 ETP consolidés (sous seuil 50 ETP Pénicaud). Trajectoire ERP DAF actée. Backend Supabase repriorisé comme prérequis structurant des modules multi-utilisateurs et de l'archivage 10 ans.

## 🩺 Audit DAF Senior — Mai 2026 (synthèse)
Audit de l'outil sous l'angle d'un DAF senior d'OF associatif (post-livraison Axes 5/6/7/8 indicateurs sociaux). **Forces** : conformité PCG/CRC niveau Tier 1 (FEC, CR formel, bilan, IDR actuarielle), pilotage analytique multi-dimensionnel naissant, sécurité OWASP 2023, indicateurs sociaux Pénicaud-compatibles. **Gaps DAF prioritaires identifiés** :

| # | Manque | Criticité | Axe ajouté |
|---|---|---|---|
| 1 | BPF (Bilan Pédagogique & Financier — CERFA 10443) | 🔴 Légal OF — perte NDA si non transmis | Axe 10 |
| 2 | Indicateurs Qualiopi opposables (RNQ — I-9, I-23, I-24, I-30, I-31) | 🔴 Légal — perte CPF/OPCO si raté audit triennal | Axe 10 |
| 3 | CFE / CVAE / Solde Taxe d'Apprentissage (1599 ter) | 🔴 Fiscal — non couvert | Axe 12 |
| 3bis | Index Égalité Pro Pénicaud officiel /100 (5 indicateurs) | 🟡 Best practice — AFERTES ≈ 40 ETP < seuil 50 ETP, **non obligatoire à ce jour** mais à activer si franchissement | Axe 10 |
| 4 | DSO/DPO + suivi conventionnement multi-financeurs | 🟠 Cash — Région CPOM = créances 60-180 j | Axe 11 |
| 5 | Plan Pluriannuel d'Investissement (PPI 5 ans, VAN/TRI) | 🟠 Stratégique — exigé Région validation EPRD | Axe 11 |
| 6 | Indicateurs Qualiopi opposables (insertion 6 m, satisfaction…) | 🟠 Légal — audit triennal, perte CPF/OPCO | Axe 10 |
| 7 | RGPD apprenants (registre + purge auto) | 🟡 Légal RGPD | Axe 10 |
| 8 | Cofinancement européen (FSE+ / FEDER) | 🟡 Recettes | Axe 12 |
| 9 | Réconciliation bancaire + détection Benford | 🟡 Audit interne | Axe 9 enrichi |
| 10 | DUER + GEPP + Bilan Social | 🟡 RH légal/bonne pratique | Axe 8 enrichi |
| 11 | Cartographie des risques COSO + Test Monte-Carlo | 🟡 Gouvernance | Axe 11 |
| 12 | Reporting Trimestriel CA standardisé + PV automatisé | 🟡 Gouvernance | Axes 7/11 |

**Conclusion** : 22 items DAF prioritaires ajoutés à la roadmap (3 nouveaux axes + enrichissement Axes 4/7/8/9). Le programme passe d'un focus "outil de pilotage budgétaire avancé" à une cible "ERP DAF complet pour OF associatif". Estimation effort : 8-10 mois de développement à cadence actuelle (1-2 modules/semaine).

**Trois décisions structurantes validées (2026-05-04)** :
1. ✅ Cible ERP DAF complet confirmée (vs simple outil de pilotage)
2. ✅ Backend Supabase repriorisé — prérequis pour Doc-Hub, RBAC, archivage 10 ans, RGPD apprenants
3. ✅ Effectif AFERTES ≈ 40 ETP < seuil 50 ETP → **Index Pénicaud officiel /100 dépriorité 🔴→🟡** (à activer en moins d'1 trimestre si franchissement seuil). BPF + Qualiopi + DUER restent prioritaires (aucun seuil d'effectif).

---

## 📈 Synthèse globale (T1 2026)

| Indicateur | Valeur |
|---|---|
| **Tests automatisés** | 774 / 774 verts ✓ |
| **Build production** | ✓ |
| **Phase 7 (Conformité réglementaire)** | 100 % livrée |
| **Phase 8 (UI/UX Soft SaaS)** | 13/14 sprints livrés (1 backlog) |
| **Axes stratégiques** | 7/12 substantiellement avancés · **Axe 10 (2/5 items livrés : BPF + Qualiopi RNQ)** · **Axe 8 RH bouclé (DUER + Bilan Social PDF)** |
| **Modules métier opérationnels** | 30 panels d'analyse · 48+ utils calc · 14 atomiques UI |
| **Backlog DAF étendu** | 18 items prioritaires identifiés restants (Index Pénicaud, PPI, COSO, fiscalité étendue, RGPD apprenants, GEPP) |

---

## 🟢 Axe 1 : UX Sémantique & "Smart Data"
*Objectif : Passer de la lecture de chiffres à l'interprétation de signaux.*

- [x] **Design System Soft SaaS** : Tokens centralisés, surfaces glass, atomiques (Card, Button, Modal, Pill, Badge), TopBar 64px, Sidebar floating glass.
- [~] **Bibliothèque de "Smart Indicators"** : `<HoverTip>` riche (titre + description + interprétation contextuelle) · dots sémantiques 5 niveaux avec animate-pulse warning/danger · `<PanelStat>` KPI hero · ProgressBar custom (RAE / Fonds Dédiés). *Reste : jauges d'énergie globales, alertes masse salariale visuelles.*
- [~] **Mode Novice (Progressive Disclosure)** : Sidebar "Premiers pas" (4 onboarding actions) · 3 onglets essentiels + bouton "Plus" disclosure · Dashboard "Synthèse Simple" avec hero status ✓/⚠/✕ · libellés humanisés (Solde→Résultat, ETP→Effectifs) · `<Term>` glossaire inline auto (BFR/ETP/FRNG/CAF/Ségur soulignés pointillés + tooltip définition+levier). *Reste : tour guidé react-joyride.*
- [ ] **Universal Search & Commands** : Raccourcis clavier (Type 'Spotlight') pour naviguer entre les filières et les salariés.
- [~] **Tableaux de Bord Sémantiques** : `<NoviceDashboard>` Synthèse Simple livré (hero status + 3 KPIs hero + AreaChart trésorerie soft + top 3 vigilances + CTA mode expert). *Reste : "Stories" par promo/filière, sankey flux financiers.*

---

## 🔵 Axe 2 : Cockpit de Résilience & Trésorerie
*Objectif : Anticiper les ruptures de cash et sécuriser les instances.*

- [x] **Radar de Santé Financière** : `radarSante.js` — score stratégique externalisé, ratios solvabilité, génération rapport stratégique PDF.
- [x] **Simulateur de Stress-Test** : Curseur global ±% sur recettes/charges + scénario what-if 4 paramètres (Δrecettes/Δcharges/ΔMS/subv.perdue) avec graphique 3 ans + **stress-test ciblé subventions** : `simulateurSubventions.js` + `SimulateurSubventionsPanel.jsx` — extraction auto des recettes-subventions (Région, OPCO, CPOM, État, FSE, AGEFIPH…), simulation par subvention de retard de paiement (mois) + coupe (%) cumulés, recalcul cumul mensuel ajusté, métriques (pire mois, mois en rupture, recovery, perte sèche), recommandations contextuelles, export CSV. 14 tests.
- [x] **Dashboard "Board Mode" (CA)** : `BoardModeView.jsx` — overlay plein écran fond slate-900, KPIs grands chiffres, trajectoire 3 ans, trésorerie 12 mois, points de vigilance, sortie Échap.
- [x] **Projection d'Atterrissage N+1** : Rolling Forecast (saisie réalisé mensuel + fusion prévisionnel) · Projection 36 mois avec inflation/GVT différenciés · alertes mois en solde cumulé négatif.

---

## 🟠 Axe 3 : Ingénierie Pédagogico-Financière
*Objectif : Piloter la rentabilité réelle des formations.*

- [x] **Calculateur Vacataires Expert** : Coûts complets, grille tarifaire personnalisable, seuil 450h URSSAF, alerte ratio MS > 30 %, multiplicateurs (correction copies ×3).
- [x] **Indicateur CCHS (Coût Complet Horaire Stagiaire)** : `coutUniteOeuvre.js` + `CoutUniteOeuvrePanel.jsx` — déclinaison du coût complet (S6.3) en CCHS = coût complet ÷ (effectif × heures stagiaires/an), avec coût/étudiant direct et complet, marge unitaire, niveau success/warning/danger, saisie inline du volume horaire par service (`globalParams.heuresStagiairesParService`, défaut 1500 h/an), HoverTip de recommandation contextuelle, export CSV, terme glossaire `cchs`. 13 tests. Intégré TabAnalyse après ClesRepartitionPanel.
- [~] **Portefeuille de Programmes (Filières)** : `EnveloppeFiliere.jsx` — répartition subvention/charges par filière + coût/diplômé éditable. *Reste : management "Business Unit" avec marge nette par filière, leviers d'optimisation chiffrés.*
- [x] **Seuil de Rentabilité (Point Mort) par filière** : `seuilRentabilite.js` + `SeuilRentabilitePanel.jsx` — décomposition CF/CV configurable (défaut 75 % CF, ajustable par service via `globalParams.ratioChargesFixesParService`), calcul du point mort en effectif (CF ÷ marge sur coût variable par étudiant), marge de sécurité (%), nombre d'étudiants manquants, niveau ✓/⚠/✕ (≥25 % / 0-25 % / <0). HoverTip recommandation DAF, bannière alerte rose, totaux consolidés, export CSV, glossaire `marge_securite`. 15 tests. Intégré TabAnalyse après CoutUniteOeuvrePanel.
- [x] **Suivi des Quotas & Rupture de Charge** : Alerte automatique abandons + simulateur impact taux d'abandon · seuil de rentabilité par filière + **Suivi par Promo individuelle** : `suiviPromos.js` + `SuiviPromosPanel.jsx` — aplatit toutes les promos (structure plate ou filière conteneur), calcule par promo : effectif initial / abandons / actuel / taux d'abandon / taux rétention. 4 niveaux ✓ saine (< warning) / ⚠ vigilance (warning-danger) / ✕ rupture (≥ danger) / neutral. Seuils configurables (`globalParams.seuilAbandonWarning` défaut 10 %, `seuilAbandonDanger` défaut 20 %) avec garde-fou danger ≥ warning. Tri automatique critiques en tête puis par taux décroissant. Bannière rose si rupture détectée + recommandation contextuelle DAF (audit pédagogique, tutorat). 16 tests. Intégré TabAnalyse après SeuilRentabilitePanel. *Reste : alerte automatique seuil dans le tableau de bord novice.*

---

## 🟣 Axe 4 : Gouvernance, Workflow & Audit
*Objectif : Sécuriser la chaîne de responsabilité et automatiser l'intelligence.*

- [x] **Audit Trail SHA-256** : `auditTrail.js` chaîne cryptographique du journal · vérification d'intégrité au montage · migration legacy auto · bannière rouge si rupture.
- [~] **Workflow d'Approbation Multiniveaux** : Statut budget Brouillon→Soumis→Validé→Gelé · verrouillage DAF (PBKDF2 600k) sur constantes fiscales. *Reste : commentaires contextuels par étape, validation Collaborateur→DAF→DG explicite, **workflow 4 yeux (deux validateurs distincts) pour les engagements > seuil**.*
- [~] **Versionnement Comparatif (Snapshot)** : `ScenariosManager.jsx` (8 scénarios versionnés) · Versionnement constantes fiscales (12 constantes historisées + audit rétroactif `valeurALaDate`). *Reste : comparaison visuelle "Budget Initial vs Révisé vs Réalisé" en interface unique.*
- [~] **Copilote IA Prescriptif** : `AICopilot.jsx` (analyse stratégique) · Audit prédictif (10 familles d'anomalies dont double-comptage Pool RH). *Reste : narratifs ciblés type "Votre masse salariale dérive de 4 % sur Arras à cause du recours accru aux vacataires".*
- [ ] **Connecteur ETL (Paie/Compta)** : Import DSN automatisé · synchronisation balance comptable inverse (FEC importé depuis logiciel certifié).
- [ ] **Plan de Contrôle Interne annuel** : Calendrier des contrôles (mensuels/trimestriels/annuels) + check-list par procédure (clôture, paie, factures, subventions), traçabilité des contrôles effectués + écarts identifiés, escalade automatique vers DAF.

---

## ⚖️ Axe 5 : Conformité Réglementaire & Sécurité (Phase 7 livrée)
*Objectif : Garantir l'opposabilité fiscale et la robustesse du SI.*

- [x] **Sécurité applicative** : PBKDF2 600 000 itérations (OWASP 2023) · masquage `demo2025` en production · audit trail SHA-256 chaîné.
- [x] **États financiers prévisionnels** : Compte de Résultat formel PCG associatif (CRC 99-01) · Bilan prévisionnel actif/passif équilibré · Tableau de Financement PCG 532-7 · Provision IDR actuarielle UCP/IAS 19.
- [x] **Export FEC opposable** : Format BOI-CF-IOR-60-40 — 18 colonnes pipe-delimited UTF-8, écritures équilibrées, nommage `<SIREN>FEC<AAAA>1231.txt`.
- [x] **Fiscal multi-taux** : TVA différenciée 0/5,5/10/20 avec coefficient de déduction activité mixte (BOI-TVA-DED-20-10) · taxe salaires barème progressif CGI 231 · IFC CCN 66 art. 26 graduel.
- [x] **Détection anomalies** : Audit prédictif 10 familles (sous-provisionnement, dérive N-1, omissions fiscales, double-comptage Pool RH).
- [~] **Backend Supabase + RBAC** — 🟠 **Repriorisé Mai 2026** : devient prérequis structurant pour Doc-Hub (archivage 10 ans), RBAC DG/DAF/Resp.site/Comptable, Workflow 4 yeux distribué, Conventionnement multi-financeurs partagé, BPF certifié signature électronique, RGPD apprenants registre auditable. **Phasage** : (v1 Août 2026) schéma SQL Postgres + migration douce localStorage → Supabase + auth multi-utilisateurs + RLS sur les tables sensibles ; (v2 Sept 2026) RBAC granulaire DG/DAF/Resp.site/Comptable + audit trail signé persistant côté serveur ; (v3 plus tard) signature électronique des arbitrages + connexion BPF DGEFP. **Modules pure frontend continuent en localStorage en attendant** avec design migrable.

---

## 🏗️ Axe 6 : Pilotage Analytique Multidimensionnel (Expert Comptable)
*Objectif : Passer d'une vision globale à une analyse de rentabilité par centre de profit.*

- [~] [Claude Code] **Moteur de Ventilation Quadridimensionnel** : Restructuration du `BudgetContext` pour supporter les "Splits".
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
- [~] [Claude Code] **Dashboards de Profitabilité par Unité (P&L Analytique)** :
    - **Espace Service** ✅ : `pnlAnalytique.js` + `PnlAnalytiquePanel.jsx` — compte de résultat formel PCG (CRC 99-01) par service. Produits ventilés en classes 70/74/75 (regex sur libellés, cohérent avec `compteResultat.js`), charges directes décomposées en 60/61/62/65 (35/30/20/15 % du poste exploitation), 64 (brut + charges sociales via `CHARGES_PATRONALES`), 68 (amortissements). Quote-part siège réallouée via `cleRepartition` active. Résultat brut (avant siège) + Résultat net (après siège) + Marge nette %. 4 niveaux sémantiques (✓ ≥ 5 % / ⚠ 0-5 % / ✕ < 0 / neutral si recettes = 0). Classement par résultat net décroissant (Crown sur centre de profit #1). Drill-down expansible affichant le détail PCG ligne à ligne. Bannière rose si déficitaires détectés. HoverTip recommandation contextuelle DAF. Export CSV avec ventilation complète. Glossaire `pnl_analytique`. 20 tests. Intégré TabAnalyse après AnalyseRHCentreCoutPanel.
    - **Espace Lieu** : Compte de résultat par site géographique avec réallocation des frais de siège (en attente du Sélecteur de Contexte S6.4 + Splits AnalyticValue S6.1).
- [x] [Claude Code] **Analyse RH par Centre de Coût (Professionnel)** : `analyseRH.js` + `AnalyseRHCentreCoutPanel.jsx` — pour chaque service : MS interne (personnel direct) + quote-part Pool RH affectée (via `affectations[].pct`, normalisée anti double-comptage), ETP cumulés, coût moyen/ETP, coût RH/étudiant, ratios MS/charges et MS/recettes. 3 niveaux sémantiques : ✓ soutenable (MS/recettes ≤ 70 %) · ⚠ tension (70-90 %) ou RH-intensif (MS/charges > 80 %) · ✕ critique (> 90 %). Stacked bar interne (indigo) / pool (violet) par service, classement automatique par MS décroissante (Crown sur le pivot RH #1), Pill warning sur ratio MS/charges, mention mutualisation Pool RH consolidée. Reuse `calculerSalaireAnnuel` (Fillon auto sur bas salaires, primes, prorata postes à pourvoir). HoverTip recommandation contextuelle DAF (mix vacataires/permanents, Pool RH). Export CSV. 20 tests. Intégré TabAnalyse après MargeContributionPanel.
- [x] [Claude Code] **Calcul du Coût de Revient par Unité d'Œuvre (Étudiant)** : `coutUniteOeuvre.js` + `CoutUniteOeuvrePanel.jsx` — module dédié déclinant le coût complet par service en coût/étudiant direct, coût/étudiant complet (avec quote-part siège), recettes/étudiant, marge unitaire et CCHS €/h. Statut sémantique 4 niveaux (success ≥ 5 % marge / warning ≥ 0 / danger < 0 / neutral si effectif = 0). HoverTip de recommandation contextuelle, export CSV, totaux consolidés pondérés par effectif. *Reste : déclinaison par promo/filière (granularité fine) + comparaison automatique avec tarifs OPCO.*
- [x] [Claude Code] **Reporting de Contribution** : `margeContribution.js` + `MargeContributionPanel.jsx` — Marge contributive (recettes − CV) par service, taux de contribution, part relative, couverture des CF du service. Classement automatique par marge décroissante (Trophy sur le levier #1), niveaux ✓ levier ≥ 30 % / ⚠ marginal 0-30 % / ✕ poids mort < 0. Bannière alerte rose si poids morts détectés ou amber si sous-couverture consolidée. Barre d'absorption des CF consolidés (gradient emerald si couverts, amber→rose sinon). HoverTip recommandation contextuelle DAF (renforcer leviers / restructurer marginaux / arrêter poids morts). Reuse du ratio CF/CV partagé avec `seuilRentabilite.js` (`globalParams.ratioChargesFixesParService`). Glossaire `marge_contribution`. Export CSV. 18 tests. Intégré TabAnalyse après SeuilRentabilitePanel.

---

## 🤝 Axe 7 : Gouvernance Associative & Engagement
*Objectif : Valoriser l'impact social et sécuriser les fonds publics.*

- [x] [Claude Code] **Moteur de Fonds Dédiés (CRC 2018-06)** : `fondsDedies.js` + `FondsDediesPanel.jsx` — Reports de subventions non consommées avec ventilation 194/195/197 (passif), schéma comptable 689→19→78. Statuts auto (actif/échu/soldé), alerte échéance <60j, tauxConsommation, recommandations contextuelles. CRUD inline, export CSV. Persistance `assoc_fonds_dedies`. 17 tests.
- [x] [Claude Code] **Valorisation du Bénévolat (Compta Classe 8)** : `valorisationBenevolat.js` + `ValorisationBenevolatPanel.jsx` — CRC 2018-06. Comptes 871 (Bénévolat) / 872 (Prestations en nature) / 875 (Dons en nature). Coefficient ×1 standard / ×2 professionnel / ×3 expert sur SMIC chargé. Taux horaire personnalisable. Équilibre 86 = 87 visualisé. CRUD inline avec édition cellule par cellule. Export CSV pour annexe AG. 15 tests.
- [ ] [Claude Code] **Reporting Stratégique CPOM (5 ans)** : Dashboard pluriannuel comparant les objectifs négociés avec les financeurs (Région, ARS) et la trajectoire budgétaire réelle cumulée. **Suivi conventionnement multi-financeurs** : Région / OPCO / FSE+ / mécénat avec dates clés (signature, demande de versement, échéance justificatif), agenda automatique des appels à fonds.
- [ ] [Claude Code] **Générateur de Rapport de Gestion pour l'AG** : Export automatisé d'une synthèse visuelle, pédagogique et commentée destinée aux administrateurs (résultat, faits marquants, perspectives, ratios sociaux et environnementaux). Format conforme aux statuts associatifs et à l'art. L.612-4 du Code de commerce pour les associations recevant > 153 k€ de subventions publiques.
- [ ] [Claude Code] **Procès-verbal automatisé des arbitrages CA** : Trace structurée des décisions soumises au vote (objet, contexte, montant impacté, options examinées, vote, décision finale), exportable en PV signé électroniquement, archivé dans Doc-Hub avec lien Audit Trail.

---

## 🌿 Axe 8 : Pilotage RSE & Budget Vert
*Objectif : Aligner la finance sur les objectifs de transition écologique.*

- [x] [Claude Code] **Indicateurs de Performance Sociale** : `calculerIndicateursOETH` (taux RQTH, obligation ETP, contribution AGEFIPH, aides emploi durable) + **Pyramide des Âges & Ancienneté** + **Parité H/F & Turn-over** :
    *   `pyramideAges.js` + `PyramideAgesPanel.jsx` — exploite `anneeNaissance` + `dateEntree`. 9 tranches d'âge (≤25 → ≥60), âge moyen + médian, ancienneté moyenne + médiane, % seniors > 55 ans par entité. 4 niveaux (✓ < 25 % / ⚠ 25-30 % / ✕ > 30 % / neutral). Seuils configurables `globalParams.seuilVieillissementWarning/Danger` (garde-fou danger ≥ warning). Pyramide horizontale (couleur amber pour seniors, indigo sinon). Glossaire `pyramide_ages`. 17 tests.
    *   `pariteTurnOver.js` + `PariteTurnOverPanel.jsx` — exploite les nouveaux champs `genre` ('H'/'F'/'') + `dateEntree` + `dateSortie` (0 = en activité, année > 0 = sortie). Index parité = % du genre minoritaire (50 = parfait), 4 niveaux (✓ ≥ 45 % / ⚠ 30-45 % / ✕ < 30 % / neutral si < 3 agents renseignés — loi Rixain 30 % cadres dirigeants 2027). Turn-over (norme APEC 2024) = (entrées + sorties)/2 / effectif moyen avec photo 31/12 (un sortant en cours d'année est exclu de l'effectif fin), 4 niveaux (✓ < 10 % / ⚠ 10-15 % / ✕ > 15 % / neutral). Seuils configurables `globalParams.seuilParite*` / `seuilTurnOver*`. Inclut Pool RH comme entité distincte. Barre stack H/F (bleu/rose) consolidée + par service. Tri par niveau turn-over puis index parité décroissant. 16 tests.
    *   **Migration douce** : ajout des champs `genre` / `dateSortie` dans templates `newAgent()` (PoolRHManager + WizardSetup + WizardImportBP) avec valeurs par défaut neutres ('' / 0). UI Pool RH étendue : sélecteur genre (H/F/non renseigné), inputs année naissance / entrée / sortie. Aucun impact sur les calculs financiers existants.
- [ ] [Claude Code] **Module "Budget Vert"** : Classification des dépenses selon leur impact environnemental (Taxonomie verte simplifiée) pour les rapports financeurs.
- [ ] [Claude Code] **Calculateur d'Empreinte Carbone** : Estimation des émissions de CO2 par parcours de formation (calcul basé sur les unités d'œuvre : fluides, repas, déplacements).
- [ ] [Claude Code] **GEPP (Gestion des Emplois et Parcours Professionnels)** : Plan de transmission/recrutement triennal alimenté par la pyramide des âges + turn-over (Axe 8 livrés). Pour chaque service en risque démographique : identification des compétences critiques détenues par les seniors, plan de tutorat avec date cible, recrutements à anticiper avec budget impact. Obligation art. L.2242-2 (entreprises > 300 ETP, bonne pratique en deçà).
- [x] [Claude Code] **DUER (Document Unique d'Évaluation des Risques)** : `duer.js` + `DUERPanel.jsx` — Inventaire formalisé des risques professionnels par unité de travail (8 catégories INRS : physique, psychosocial, ergonomique, biologique, chimique, organisationnel, routier, incendie). Cotation Probabilité × Gravité matrice 5×5, niveau auto faible (1-5) / modéré (6-12) / élevé (13-19) / critique (20-25). Persistance via `globalParams.duer = { dateMAJ, exercice, risques: [{ uniteId, categorie, libelle, sourceDanger, probabilite, gravite, maitrise, plansAction: [...] }] }`. Plans d'action chaînés (mesure / responsable / échéance / statut à-faire-en-cours-fait / coût). Détection auto : MAJ obsolète (>12 mois) / urgente (>18 mois ou jamais), plans d'action en retard d'échéance, risques élevés/critiques sans plan, unités de travail non couvertes. Construction auto des UT depuis services + pôle support + siège. CRUD inline complet, drill-down expansible par risque (source danger + maîtrise + table plans d'action), export CSV (risques + plans). Glossaire `duer`. 39 tests. Lien futur avec la cartographie des risques (Axe 11).
- [x] [Claude Code] **Bilan Social annuel (synthèse)** : `bilanSocial.js` + `BilanSocialPanel.jsx` + `bilanSocialPdf.js` — Module agrégateur consolidant 7 sections RH normalisées (effectifs avec ventilation contrat/genre/entité, rémunérations brut/charges/coût employeur, pyramide & ancienneté, parité H/F + turn-over, OETH, formation, conditions de travail DUER + sinistralité). Calcul des taux INRS opposables : Taux de Fréquence (TF = AT avec arrêt × 1 000 000 / heures travaillées) et Taux de Gravité (TG = jours d'arrêt × 1 000 / heures travaillées) avec niveaux sectoriels (TF success ≤ 15, warning ≤ 30, danger > 30). Saisie manuelle complémentaire AT/MP via `globalParams.bilanSocial.accidents` (5 inputs + observations). Synthèse niveau global (success/warning/danger) calculée avec hiérarchie d'alerte (DUER > sinistralité > pyramide/parité/turn-over > OETH > complétude). Export PDF multi-pages normalisé (jsPDF + autoTable) avec page de garde, bandeau synthèse, 7 sections détaillées et points de vigilance. Glossaire `bilan_social`. 33 tests. Format conforme art. L.2312-28 (CSE > 50 ETP, obligation > 300 ETP, recommandé pour AG association).

---

## 🛡️ Axe 9 : Sécurisation du Cycle d'Achat & Engagements
*Objectif : Maîtriser les dépenses dès l'intention d'achat.*

- [ ] [Claude Code] **Workflow de Demande d'Achat (DA)** : Circuit de validation électronique (Collaborateur → Responsable → DAF) avant engagement.
- [x] [Claude Code] **Suivi du "Reste à Engager"** : `resteAEngager.js` + `ResteAEngagerPanel.jsx` — Budget exploitation annuel − Engagements ouverts par entité (Siège/Pôle/Services). Taux d'engagement avec 4 niveaux (✓ < 70 % · ⚠ 70-90 % · ✕ 90-100 % · 🔴 dépassement > 100 %). Barre de progression colorée + bannière alerte + recommandation contextuelle DAF. Intégré TabAnalyse, total consolidé en footer. 16 tests.
- [ ] [Claude Code] **Coffre-Fort Numérique (Doc-Hub)** : Archivage sécurisé des pièces justificatives (contrats, conventions, factures) lié à l'Audit Trail.
- [ ] [Claude Code] **Réconciliation Bancaire Automatique** : Matching écritures bancaires (CSV/MT940) vs balance comptable importée, détection des suspens (chèques non encaissés, prélèvements hors délai).
- [ ] [Claude Code] **Détection de Fraude (Benford + doublons fournisseurs)** : Loi de Benford sur les premiers chiffres des factures, détection de doublons fournisseurs (RIB identiques, libellés similaires fuzzy match), alertes sur écarts statistiques.

---

## 🎓 Axe 10 : Conformité Sectorielle Organisme de Formation
*Objectif : Couvrir les obligations légales propres aux OF (Code du travail L.6 + Qualiopi + RGPD apprenants).*

- [x] [Claude Code] **Indicateurs Qualiopi opposables (RNQ)** : `qualiopi.js` + `QualiopiPanel.jsx` — 5 indicateurs RNQ ciblés (I-9 abandon réutilisant `suiviPromos`, I-23 insertion 6 mois, I-24 obtention certification, I-30 satisfaction stagiaires, I-31 satisfaction financeurs). Niveau sémantique par indicateur (`success`/`warning`/`danger`/`neutral`) selon seuils sectoriels DGEFP/Carif-Oref par défaut, surchargeables via `globalParams.seuilsQualiopi[code].{warning,danger,sens}` (sens `min` pour I-9 où un taux élevé est mauvais, `plus` pour les autres). Garde-fous cohérence sens/seuils. Agrégation : moyenne pondérée par effectif actuel (avec fallback arithmétique si tous les effectifs nuls). Persistance des taux saisis via `globalParams.qualiopiTaux[promoId][champ]` (extension douce — aucune migration de la structure promo, écriture via `setGlobalParams`). Fallback sur les champs `promo.tauxXxx` si présents. Synthèse audit-readiness (`auditReady`, `scoreGlobal`, `completude`) + alertes par indicateur en danger. UI : 3 PanelStat (score conformité / complétude / répartition ✓⚠✕∅) + bandeau alertes contextualisé + table synthèse 5 indicateurs avec drill-down expansible (saisie inline du taux par promo). Recommandations contextuelles DAF/Référent qualité par indicateur et par niveau. Glossaire `qualiopi`. Export CSV (synthèse + détail par promo). 33 tests. Intégré TabAnalyse après BPFPanel. *Reste : intégration des indicateurs documentaires non couverts (I-1 information préalable, I-32 traitement des réclamations) qui demandent un Doc-Hub (Backend Supabase v1).*
- [x] [Claude Code] **BPF — Bilan Pédagogique & Financier (CERFA 10443)** : `bpf.js` + `BPFPanel.jsx` — Cadre A (identification OF : NDA, SIRET, raison sociale, statut, adresse, persistance via `globalParams.bpfIdentite`) + Cadre B1 (produits par origine B11 entreprises / B12 OPCO 11 mots-clés / B131 Région / B132 France Travail / B133 État-DGEFP-FSE+ / B134 collectivités / B14 particuliers / B15 OF sous-traitance entrante / B16 CPF-apprentissage-pro) + Cadre B2 (charges B21 sous-traitance avec lookahead négatif "entrante" / B22 brut formateurs internes via `calculerSalaireAnnuel` Fillon-aware / B23 charges sociales / B24 autres) + Cadre C (stagiaires + heures-stagiaires depuis promos via `heuresStagiairesParService`, ventilation par origine au prorata des produits). Validation cohérence : 3 alertes danger (NDA/SIRET/raison sociale) + 4 alertes warning (produits/formateurs/stagiaires/charges>150 % produits). Export CSV CERFA nommé `BPF_<NDA>_<année>.csv`. Export désactivé si `isValide=false`. Glossaire `bpf`. 28 tests (classification origines, sous-traitance lookahead, totaux, robustesse, recommandations). Soumission DREETS via bilanpedagogique.travail-emploi.gouv.fr avant 30 avril N+1. *Reste : export XML EDI-DGEFP pour télé-soumission directe (nécessite Backend Supabase pour signature).*
<!-- Indicateurs Qualiopi RNQ — déplacé en haut comme item livré -->
<!-- Reste à couvrir : I-1 (information préalable du public), I-32 (traitement des réclamations) — nécessitent Doc-Hub Supabase. -->

- [ ] [Claude Code] **Index Égalité Pro Pénicaud (loi Avenir 2018)** — 🟡 **Best practice à ce jour** : AFERTES ≈ 40 ETP < seuil 50 ETP → **non obligatoire**. Note sur 100 à publier sur le site web AVANT le 1er mars chaque année si franchissement seuil. **5 indicateurs** : (1) écart de rémunération H/F par CSP/tranche d'âge — 40 pts ; (2) écart de taux d'augmentation — 20 pts ; (3) écart de taux de promotion — 15 pts (>250 ETP) ou (2bis) écart unique 35 pts (<250) ; (4) % salariées augmentées au retour de congé maternité — 15 pts ; (5) nombre de salariés du sexe sous-représenté dans les 10 plus hautes rému — 10 pts. Pénalité 1 % MS si < 75/100 sur 3 ans. Réutilise `genre` + `salaire` + `dateEntree` + nouveau champ `dateRetourMaternite`. **Module préparatoire** : Parité H/F + Turn-over déjà livrés (Axe 8) — extension Index officiel à activer en moins d'un trimestre si franchissement seuil.
- [ ] [Claude Code] **Suivi flux CPF / OPCO / France Travail** : Modèle de données dédié pour les facturations OPCO/CPF nominatives par stagiaire (n° de dossier, montant pris en charge, date de la décision de prise en charge, date d'échéance), distinction des avances / soldes / refus, alerte sur dossiers en attente > 60 j. Intégré au DSO global.
- [ ] [Claude Code] **RGPD apprenants** : Registre des traitements (RGPD art. 30) — inventaire des données apprenants collectées avec finalité, base légale, destinataires, durée de conservation. Module purge automatique des données apprenants au-delà de la durée légale (10 ans pour comptabilité, 6 ans pour fiscal, 5 ans pour BPF, 3 ans pour Qualiopi sortie de stage). Bouton "Demande d'effacement RGPD" (droit à l'oubli art. 17).

---

## 🏛️ Axe 11 : Reporting Direction, PPI & Cartographie des Risques
*Objectif : Donner au CA et à la DG une vision pluriannuelle, prospective et risquée.*

- [ ] [Claude Code] **Plan Pluriannuel d'Investissement (PPI 5 ans)** : Saisie projets d'investissement avec montant, durée, financement (autofin / emprunt / subv invest), date démarrage, gain attendu (€/an). Calcul automatique : VAN, TRI, payback period, ratio Bénéfice/Coût. Capacité d'autofinancement (CAF) projetée 5 ans. Trajectoire CAF cumulée vs investissements cumulés → alerte si écart négatif (besoin de financement non identifié). **Exigé par la Région pour validation EPRD pluriannuel.**
- [ ] [Claude Code] **Cartographie des Risques (méthode COSO)** : Matrice probabilité × impact 5×5, taxonomie des risques (financiers / opérationnels / RH / cyber / conformité / réputation), plan de traitement par risque (acceptation / réduction / transfert / suppression), revue annuelle. Liaison automatique avec : audit prédictif (10 familles), turn-over critique (Axe 8), trésorerie en rupture (Axe 2). Rapport CA exportable PDF.
- [ ] [Claude Code] **Reporting Trimestriel CA standardisé** : Dossier de séance CA généré automatiquement — synthèse exécutive (1 page) + détail (10-15 pages) avec : exécution budgétaire vs prévisionnel, ratios bilan, KPI sociaux (effectif, parité, turn-over), KPI pédagogiques (effectifs, taux insertion), risques majeurs identifiés, arbitrages soumis au vote. Format PDF + .pptx pour présentation séance.
- [ ] [Claude Code] **Test de Sensibilité Monte-Carlo** : Simulation probabiliste 10 000 itérations sur les paramètres critiques (taux d'abandon, retard subv Région, dérive MS, inflation exploitation). Output : distribution du résultat net (médiane, quartiles, VaR 5 %), probabilité de rupture de trésorerie. Plus rigoureux que le stress-test 4-paramètres actuel (déterministe).
- [ ] [Claude Code] **DSO/DPO + Suivi Conventionnement Subventions** : Délais Sales Outstanding (créances clients) / Days Payable Outstanding (dettes fournisseurs) par entité, tableau des conventions pluriannuelles signées avec montant total / annuel / cumul perçu / cumul justifié / restes à percevoir, alerte si justification > 90 j en retard, agenda des appels à fonds.

---

## 💰 Axe 12 : Fiscalité étendue & Optimisation
*Objectif : Couvrir les impôts économiques locaux et optimiser les leviers d'allègement.*

- [ ] [Claude Code] **CFE (Cotisation Foncière des Entreprises)** : Calcul automatique sur la base d'imposition (valeur locative cadastrale × taux communal), exonération possible pour les associations d'intérêt général art. 1449 CGI. Alerte si éligibilité non vérifiée.
- [ ] [Claude Code] **CVAE (Cotisation sur la Valeur Ajoutée des Entreprises)** : Pour les structures > 500 k€ HT de CA. Calcul VA (selon liasse 2059-E) × taux progressif. **Note : taxe en suppression progressive 2024-2027 — module à concevoir avec date de fin paramétrable.**
- [ ] [Claude Code] **Solde de Taxe d'Apprentissage (article 1599 ter)** : 0,09 % de la masse salariale brute affectée aux établissements habilités (formations professionnelles et technologiques). Si AFERTES est elle-même habilitée à recevoir la TA → calcul des recettes potentielles + base nominative entreprises.
- [ ] [Claude Code] **Mécénat (art. 200 et 238 bis CGI)** : Si l'OF bénéficie de dons → reçus fiscaux automatisés (66 % / 60 % selon donateur), registre annuel des donateurs, alerte plafonnement à 5 ‰ du CA pour les entreprises mécènes.
- [ ] [Claude Code] **Cofinancement Européen (FSE+ / FEDER)** : Suivi des opérations cofinancées avec règles spécifiques européennes — temps passé par les agents (timesheets), pièces probantes dématérialisées, clé de répartition par opération, archivage 10 ans. Compatible avec le règlement FSE+ 2021/1057.

---

## 📊 État d'avancement Phase 8 — Modernisation UI/UX

> Sprints internes UI préfixés `S` ; à ne pas confondre avec les jalons stratégiques `S6.x` de l'**Axe 6** (Pilotage Analytique).

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
| S-G | `<Term>` glossaire inline auto | ✅ | 13 |
| S-T | Tour guidé `react-joyride` 5 étapes | ⏳ | — |

**Phase 8 : 13/14 sprints livrés** (S5.3 partiel · S-T en backlog) | **116 tests dédiés UI**

---

## 📦 Modules métier livrés (Axes 5-9 + Phase 7)

> Modules ajoutés entre 2026-04-25 et 2026-04-27 — chaque ligne représente un fichier util + un panel + tests.

| Domaine | Module | Tests |
|---|---|---|
| Compta CRC 99-01 | `compteResultat.js` + `CompteResultatPanel` | 6 |
| Compta CRC 99-01 | `bilanPrevisionnel.js` + `BilanPrevisionnelPanel` | 8 |
| Compta CRC 99-01 | `tableauFinancement.js` + `TableauFinancementPanel` (PCG 532-7) | 9 |
| Fiscal CGI 231 | `tvaMultiTaux.js` + `TVAMultiTauxPanel` | 10 |
| Provisions IAS 19 | `provisionIDR.js` + `ProvisionIDRPanel` (UCP) | 10 |
| Audit BOI-CF | `fecExport.js` + bouton TabParametres | 7 |
| Audit signé | `auditTrail.js` SHA-256 chaîné | 7 |
| Anomalies prédictives | `anomaliesHistorique.js` + `AuditPredictifPanel` | — |
| Anomalies | `doubleComptageDetection.js` (Pool RH) | 9 |
| Versionnement | `constantsVersionRegistry.js` + `ConstantesHistoriquePanel` | 12 |
| Cycle d'achat | `resteAEngager.js` + `ResteAEngagerPanel` | 16 |
| Gouvernance asso | `valorisationBenevolat.js` + `ValorisationBenevolatPanel` | 15 |
| Gouvernance asso | `fondsDedies.js` + `FondsDediesPanel` | 17 |
| Pilotage analytique | `referentielStructure.js` + `ReferentielStructurePanel` | 17 |
| Pilotage analytique | `clesRepartition.js` + `ClesRepartitionPanel` | 16 |
| Pilotage analytique | `coutUniteOeuvre.js` + `CoutUniteOeuvrePanel` (CCHS + Coût/étud.) | 13 |
| Pilotage analytique | `seuilRentabilite.js` + `SeuilRentabilitePanel` (Point mort par filière) | 15 |
| Pilotage analytique | `margeContribution.js` + `MargeContributionPanel` (Reporting de Contribution — leviers/poids morts) | 18 |
| Pilotage analytique | `analyseRH.js` + `AnalyseRHCentreCoutPanel` (MS interne + Pool RH par service, ratios MS/charges-recettes) | 20 |
| Pilotage analytique | `pnlAnalytique.js` + `PnlAnalytiquePanel` (P&L formel PCG par service avec quote-part siège + drill-down) | 20 |
| Pilotage pédagogique | `suiviPromos.js` + `SuiviPromosPanel` (Suivi des Quotas par Promo individuelle, rupture de charge) | 16 |
| RSE / Performance sociale | `pyramideAges.js` + `PyramideAgesPanel` (Pyramide des Âges + Ancienneté + détection vieillissement par service) | 17 |
| RSE / Performance sociale | `pariteTurnOver.js` + `PariteTurnOverPanel` (Parité H/F index Rixain + Turn-over APEC par entité) | 16 |
| **Conformité OF (Axe 10)** | **`bpf.js` + `BPFPanel` — BPF CERFA 10443 ventilation B1/B2/C, classification regex 11 mots-clés OPCO** | **28** |
| **Conformité OF (Axe 10)** | **`qualiopi.js` + `QualiopiPanel` — 5 indicateurs RNQ opposables (I-9/I-23/I-24/I-30/I-31), niveau audit-ready, persistance via globalParams** | **33** |
| **RH/Prévention (Axe 8)** | **`duer.js` + `DUERPanel` — Document Unique d'Évaluation des Risques, matrice criticité 5×5 INRS, plans d'action chaînés, détection MAJ obsolète + plans en retard** | **39** |
| **RH/Synthèse (Axe 8)** | **`bilanSocial.js` + `BilanSocialPanel` + `bilanSocialPdf` — Bilan Social annuel 7 sections agrégées, calculs TF/TG INRS, export PDF normalisé CSE/AG L.2312-28** | **33** |
| Trésorerie / Stress | `simulateurSubventions.js` + `SimulateurSubventionsPanel` (retard + coupe ciblés) | 14 |

**Total tests métier livrés (post audit DAF) : 441 tests dédiés** | Cumul global : **774/774 verts**

---

## 📊 Indicateurs de Performance de l'Outil (KPIs 2026)
| Dimension | Objectif | Mesure de succès | État |
|---|---|---|---|
| **Accessibilité** | Excellence Novice | Utilisation autonome par les coordinateurs de site | 🟢 Sidebar Premiers pas + Dashboard Synthèse Simple + glossaire inline auto livrés |
| **RSE / Social** | Indicateurs Pénicaud / Rixain | Reporting CSE + AG conformes (RQTH, parité, turn-over) | 🟢 OETH + Pyramide des âges + Parité H/F + Turn-over APEC livrés (Axe 8 bouclé) |
| **Sécurité** | Zéro Défaut Audit | Validation sans réserve par le Commissaire aux Comptes | 🟢 PBKDF2 600k + audit trail signé + FEC opposable + 12 constantes historisées |
| **Pilotage** | Agilité Totale | Nouveau scénario "Stress-test" en < 5 min | 🟢 Multi-scénarios + stress-test global + stress-test trésorerie ciblé Région/OPCO livrés |
| **Rentabilité** | Maîtrise des Coûts | Marge nette précise par filière de formation | 🟢 Coût/étudiant direct & complet + CCHS dédié + clés de répartition + enveloppe filière + seuil de rentabilité + Reporting de Contribution + **P&L Analytique formel par service** livrés ; déclinaison promo individuelle à venir |
| **Analytique** | Vision 360° | Ventilation 100 % des charges par Lieu/Service/Étudiant | 🟢 Référentiel + clés de répartition + **P&L Analytique par Service (compte de résultat PCG par centre de profit)** livrés ; Splits S6.1 + Espace Lieu à venir |
| **Conformité asso** | CRC 2018-06 complet | Annexe AG conforme (bénévolat + fonds dédiés + Bilan Social PDF) | 🟢 Compte 86=87 + ventilation 19/689/78 + Bilan Social annuel exportable PDF normalisé livrés |
| **Conformité OF** | Code travail L.6 + Qualiopi | BPF + indicateurs Qualiopi opposables | 🟢 BPF CERFA 10443 livré ✓ + Qualiopi RNQ (I-9/23/24/30/31) livré ✓ — reste I-1 et I-32 documentaires (Doc-Hub Supabase) |
| **Égalité Pro** | Loi Avenir 2018 / Rixain | Index Pénicaud /100 publié | 🟢 Parité de base livrée (Axe 8) — AFERTES ≈ 40 ETP sous seuil 50 ETP, Index officiel non obligatoire à ce jour, en best practice |
| **Fiscalité éco. locale** | CGI 1447-1599 ter | CFE + CVAE + Taxe Apprentissage | 🔴 Axe 12 ouvert — non couvert |
| **Reporting CA** | Pluriannuel + risques | PPI 5 ans + cartographie risques COSO | 🔴 Axe 11 ouvert — Board Mode existe mais pas le PPI ni la cartographie |

---

## 📅 Chronologie des Livrables Majeurs

| Période | Livrables | Statut |
|---|---|---|
| **Avril 2026** | Phase 7 Conformité (FEC, CR PCG, Bilan, IDR, TVA, Tableau financement) + Phase 8 P1+P2+P3 UI Modernisation + Axes 6/7/9 amorcés + CCHS dédié + Stress-Test Trésorerie ciblé Subventions (Axe 2 bouclé) + Seuil de Rentabilité par filière (Axe 3) + Reporting de Contribution (Axe 6) + Analyse RH par Centre de Coût (Axe 6) + P&L Analytique par Service (Axe 6) + Suivi des Quotas par Promo (Axe 3 bouclé) + Pyramide des Âges & Ancienneté (Axe 8 amorcé) | ✅ |
| **Mai 2026** | **Parité H/F & Turn-over (Axe 8 indicateurs sociaux bouclés)** ✅ · **Audit DAF senior + ajout Axes 10/11/12** ✅ · **3 décisions stratégiques actées (cible ERP DAF / Backend Supabase / 40 ETP)** ✅ · **🔴 BPF CERFA 10443 (Axe 10 — 1er item livré)** ✅ · **🔴 Indicateurs Qualiopi RNQ (Axe 10 — 2e item livré, I-9/23/24/30/31)** ✅ · **🔴 DUER R.4121-1 (Axe 8 — RH/Prévention)** ✅ · **🟡 Bilan Social annuel + PDF normalisé (Axe 8 RH bouclé)** ✅ | En cours |
| **Juin 2026** | BPF Export PDF + XML EDI-DGEFP (compléments Axe 10) · Compléments Qualiopi documentaires I-1/I-32 (en attente Doc-Hub Supabase) · GEPP triennale (Axe 8 — exploite Pyramide + DUER + Turn-over) | À venir |
| **Juillet 2026** | **🟠 PPI 5 ans + VAN/TRI (Axe 11 — exigé Région EPRD)** · **🔴 CFE / Solde Taxe d'Apprentissage / Mécénat (Axe 12 — fiscal critique)** · Workflow d'approbation 4 yeux (Axe 4) | À venir |
| **Août 2026** | **🟠 Backend Supabase v1 (Axe 5 — chantier infra structurant)** : schéma SQL, migration localStorage, auth multi-utilisateurs, RLS Supabase | À venir |
| **Septembre 2026** | **Doc-Hub (Axe 9 — exploite Backend)** · **RBAC DG/DAF/Resp.site/Comptable (Axe 5)** · DSO/DPO + Suivi Conventionnement (Axe 11) · Reporting CPOM 5 ans (Axe 7) | À venir |
| **Octobre 2026** | **Cartographie des Risques COSO (Axe 11)** · **Suivi flux CPF/OPCO/France Travail (Axe 10)** · Réconciliation bancaire automatique (Axe 9) · Reporting Trimestriel CA (Axe 11) | À venir |
| **Novembre 2026** | **RGPD apprenants — registre + purge auto (Axe 10)** · **Détection Fraude Benford (Axe 9)** · Test Sensibilité Monte-Carlo (Axe 11) · GEPP (Axe 8) · PV automatisé CA (Axe 7) | À venir |
| **Décembre 2026** | **Cofinancement européen FSE+/FEDER (Axe 12)** · **🟡 Index Pénicaud officiel /100 — best practice si non franchissement seuil 50 ETP (Axe 10)** · IA Prescriptive narrative · Connecteurs ETL DSN/Compta · Module Budget Vert · Empreinte Carbone | À venir |

---

## 🔖 Légende
- [x] Livré · [~] En cours / partiel · [ ] Backlog
- 🟢 OK · 🟡 Partiel · 🔴 À démarrer
- [Claude Code] = item cadré pour développement assisté

---
**Document de travail confidentiel — Direction Générale & DAF AFERTES**
