// Glossaire centralisé — Termes techniques DAF / Pédagogie financière
// Structure : Définition → Impact sur le solde → Levier d'action conseillé
// Utilisé par : Tooltips, Panneau Éco-Fin, exports PDF synthèse

export const GLOSSARY = [
  {
    id: 'bfr',
    term: 'BFR — Besoin en Fonds de Roulement',
    categorie: 'tresorerie',
    definition:
      "Trésorerie nécessaire pour couvrir le décalage entre les encaissements (subventions, OPCO) et les décaissements (salaires, fournisseurs). BFR = Créances + Stocks − Dettes fournisseurs/sociales.",
    impact:
      "Un BFR élevé immobilise de la trésorerie sans générer de produit. Chaque jour de retard de paiement OPCO augmente le BFR proportionnellement aux charges quotidiennes.",
    levier:
      "Négocier les délais de paiement clients (raccourcir) et fournisseurs (allonger) ; suivre la rotation des créances ; activer les acomptes sur subvention.",
  },
  {
    id: 'fillon',
    term: 'Réduction Fillon (générale de cotisations)',
    categorie: 'masse_salariale',
    definition:
      "Allègement de cotisations patronales URSSAF sur les bas salaires (jusqu'à 1,6 SMIC). Calcul dégressif : maximum à 1 SMIC, nul à 1,6 SMIC.",
    impact:
      "Réduit mécaniquement les charges patronales sur les contrats à temps partiel ou les rémunérations modestes. Impact direct sur le coût employeur.",
    levier:
      "Recensement annuel des agents éligibles ; vérifier l'application correcte sur les fiches de paie ; intégrer la réduction dans les budgets prévisionnels.",
  },
  {
    id: 'point_mort',
    term: 'Point Mort (seuil de rentabilité)',
    categorie: 'pilotage',
    definition:
      "Niveau d'activité (en € de recettes ou en nombre d'étudiants) à partir duquel les recettes couvrent l'ensemble des charges fixes + variables.",
    impact:
      "Sous le point mort, chaque mois aggrave le déficit. Au-dessus, l'association capitalise une marge de sécurité pour les imprévus.",
    levier:
      "Réduire les charges fixes (renégociation loyers, mutualisation) ou augmenter les recettes contractuelles (CFA, formation continue) pour abaisser le point mort.",
  },
  {
    id: 'taxe_salaires',
    term: 'Taxe sur les Salaires (CGI art. 231)',
    categorie: 'fiscal',
    definition:
      "Taxe due par les employeurs non assujettis à la TVA sur tout ou partie de leur activité. Barème progressif 2026 : 4,25 % jusqu'à 8 985 €, 8,50 % de 8 986 à 17 936 €, 13,60 % au-delà.",
    impact:
      "Charge fiscale annuelle qui s'ajoute aux cotisations sociales. Pour une association non assujettie, peut atteindre 4 à 6 % de la masse salariale brute.",
    levier:
      "Vérifier l'éligibilité à l'abattement associations (article 1679 A : 22 535 € en 2026) ; analyser l'opportunité d'un assujettissement partiel à la TVA.",
  },
  {
    id: 'ifc',
    term: 'IFC — Indemnités de Fin de Carrière',
    categorie: 'provisions',
    definition:
      "Indemnités versées au moment du départ à la retraite des salariés. Calcul gradué selon l'ancienneté et la CCN 66 (du 1/4 mois au 6 mois de salaire).",
    impact:
      "Engagement social long terme à provisionner annuellement. Sous-provisionnement crée un risque comptable et un choc de trésorerie au moment des départs.",
    levier:
      "Provision annuelle calculée par méthode actuarielle (PUC) ; externaliser via contrat IFC auprès d'un assureur pour lisser la charge.",
  },
  {
    id: 'segur',
    term: 'Prime Ségur (médico-social)',
    categorie: 'masse_salariale',
    definition:
      "Prime mensuelle brute de 238 €/ETP versée aux personnels du secteur médico-social éligibles (CCN 66/FEHAP/CHRS). Soumise aux charges patronales.",
    impact:
      "Coût employeur ≈ 343 €/ETP/mois (avec charges 44 %), soit ~4 100 €/ETP/an. Compensée pour les structures financées par l'État/CD.",
    levier:
      "Recenser précisément les agents éligibles ; remonter la créance Ségur dans les budgets ; sécuriser le financement compensatoire.",
  },
  {
    id: 'fonds_roulement',
    term: 'Fonds de Roulement (FR)',
    categorie: 'tresorerie',
    definition:
      "Excédent des ressources stables (capitaux propres + dettes long terme) sur les emplois stables (immobilisations). FR = capitaux permanents − immobilisations nettes.",
    impact:
      "Doit couvrir le BFR. Un FR < BFR contraint à découvert bancaire. Un FR robuste = autonomie financière.",
    levier:
      "Reconstituer via des excédents annuels affectés aux réserves ; négocier des prêts long terme pour adosser aux investissements.",
  },
  {
    id: 'opca_opco',
    term: 'OPCO — Opérateur de Compétences',
    categorie: 'recettes',
    definition:
      "Organisme financeur de la formation professionnelle. Verse les fonds après réalisation et facturation, avec un délai moyen de 60 à 90 jours.",
    impact:
      "Décalage de trésorerie significatif : entre la prestation facturée et le règlement, l'association porte la charge cash.",
    levier:
      "Activer les acomptes contractuels ; suivre hebdomadairement les en-attente ; relances systématisées ≥ 45 j.",
  },
  {
    id: 'gvt',
    term: 'GVT — Glissement Vieillesse Technicité',
    categorie: 'masse_salariale',
    definition:
      "Hausse automatique de la masse salariale liée aux progressions de carrière (ancienneté, échelons, promotions). Indépendante des revalorisations générales.",
    impact:
      "Augmentation annuelle structurelle de 1 à 2 % de la masse salariale dans le secteur médico-social, même sans embauche.",
    levier:
      "Anticiper dans les projections N+1/N+2 ; arbitrer entre GVT et embauches ; piloter la pyramide des âges.",
  },
  {
    id: 'taux_couverture',
    term: 'Taux de Couverture',
    categorie: 'pilotage',
    definition:
      "Ratio Recettes ÷ Charges × 100. Exprime la capacité des produits à financer les charges. Cible : 100 % minimum.",
    impact:
      "Sous 100 %, l'exercice puise dans les réserves. Sous le seuil d'alerte (par défaut 90 %), une intervention urgente est nécessaire.",
    levier:
      "Diversifier les recettes (subventions, prestations, mécénat) ; rationaliser les charges variables ; renégocier les marchés fournisseurs.",
  },
  {
    id: 'amortissement',
    term: 'Amortissement (PCG 214-9)',
    categorie: 'comptable',
    definition:
      "Constatation comptable de la dépréciation d'un bien sur sa durée d'utilisation. Calculé au prorata temporis (au mois près) à partir de la date de mise en service.",
    impact:
      "Charge non décaissable mais qui réduit le résultat. Affecte le taux de couverture sans impact sur la trésorerie.",
    levier:
      "Politique d'amortissement cohérente (durées CCNSP) ; capitaliser les investissements > 500 € ; dotations annuelles intégrées au budget.",
  },
  {
    id: 'urssaf',
    term: 'Cotisations URSSAF (BFR)',
    categorie: 'tresorerie',
    definition:
      "Cotisations sociales reversées trimestriellement (ou mensuellement > 9 salariés). Décalage moyen de 45 jours entre le fait générateur (paie) et le décaissement.",
    impact:
      "Diminue le BFR car constituent une dette sociale au passif. Plus le délai est long, plus le BFR baisse mécaniquement.",
    levier:
      "Calendrier strict de déclaration (DSN) ; éviter les pénalités de retard (10 %) ; optimiser le calendrier des virements.",
  },
  {
    id: 'marge_securite',
    term: 'Marge de sécurité',
    categorie: 'pilotage',
    definition:
      "Écart entre l'effectif actuel et le point mort, exprimé en % de l'effectif. Mesure la capacité de la promo à absorber un recrutement décevant ou des abandons sans basculer en perte.",
    impact:
      "≥ 25 % = activité confortable ; entre 0 et 25 % = équilibre fragile, un aléa ferait basculer la promo ; < 0 % = perte structurelle (sous le point mort).",
    levier:
      "Sécuriser le recrutement ; valoriser un effectif minimum garanti dans les conventions OPCO ; réduire les charges fixes (mutualisation locaux/RH) pour abaisser le point mort.",
  },
  {
    id: 'cchs',
    term: 'CCHS — Coût Complet Horaire Stagiaire',
    categorie: 'pilotage',
    definition:
      "Coût complet d'un service (charges directes + quote-part siège réallouée) divisé par le total des heures stagiaires dispensées (effectif × heures/an).",
    impact:
      "Indicateur de référence pour la facturation OPCO et la négociation des tarifs CPOM Région. Permet de comparer la rentabilité de filières aux durées différentes.",
    levier:
      "Optimiser la clé de répartition (ETP, surface, heures) ; ajuster le volume horaire pédagogique ; négocier le tarif horaire OPCO.",
  },
  {
    id: 'marge_contribution',
    term: 'Marge de contribution',
    categorie: 'pilotage',
    definition:
      "Recettes du service moins ses seules charges variables (consommables, vacataires, fluides). Mesure ce que chaque service apporte pour absorber les charges fixes communes (siège, RH permanents, locaux).",
    impact:
      "Taux ≥ 30 % = service \"levier\" qui finance la structure et les autres filières ; taux entre 0 et 30 % = contribution marginale ; taux ≤ 0 = poids mort destructeur de valeur. Permet de classer les filières par rentabilité réelle.",
    levier:
      "Renforcer les leviers (effectifs, tarifs OPCO) ; renégocier ou restructurer les marginaux ; trancher stratégiquement les poids morts (arrêt ou refonte du modèle économique).",
  },
  {
    id: 'pnl_analytique',
    term: 'P&L analytique',
    categorie: 'pilotage',
    definition:
      "Compte de résultat (Profit & Loss) décliné par service, traité comme un centre de profit autonome. Produits ventilés en classes PCG 70/74/75 ; charges directes en 60-65/68 ; quote-part de structure réallouée selon une clé (ETP, surface…) pour aboutir au résultat net analytique.",
    impact:
      "Permet de juger la santé financière de chaque filière APRÈS absorption de sa part de siège — pas seulement avant. Marge nette ≥ 5 % = service durable ; négative = déficitaire après réallocation. Indicateur clé pour les arbitrages stratégiques DG/CA et la négociation CPOM par lieu.",
    levier:
      "Optimiser le mix produits (renforcer les recettes 70/74), maîtriser le poste 64 (personnel, plus gros bloc), choisir une clé de répartition siège équitable (ETP standard, surface si locaux différenciés).",
  },
  {
    id: 'bpf',
    term: 'BPF — Bilan Pédagogique et Financier',
    categorie: 'comptable',
    definition:
      "Formulaire CERFA 10443 obligatoire annuellement pour tout Organisme de Formation déclaré (art. L.6352-11 du Code du travail). Contient l'identification de l'OF (NDA, SIRET), la ventilation des produits par origine de financement (entreprises, OPCO, pouvoirs publics, particuliers, CPF/apprentissage), les charges (sous-traitance, salaires formateurs, autres dépenses) et les heures-stagiaires.",
    impact:
      "**Non-transmission avant le 30 avril N+1 = retrait du Numéro de Déclaration d'Activité**, soit la perte du statut d'OF et donc de l'accès aux financements publics (CPF, OPCO, Région). Sanction immédiate et irréversible sans recours administratif.",
    levier:
      "Préparer le BPF tout au long de l'année en classifiant rigoureusement les recettes par origine (regex sur libellés OPCO/Région/État) et en distinguant les formateurs internes des intervenants externes (rôle 'formateur' vs sous-traitance). Soumission via bilanpedagogique.travail-emploi.gouv.fr.",
  },
  {
    id: 'bilan_social',
    term: 'Bilan Social annuel',
    categorie: 'masse_salariale',
    definition:
      "Synthèse normalisée des indicateurs RH (effectifs, rémunérations, pyramide des âges, parité H/F, turn-over, OETH, formation, conditions d'hygiène/sécurité, accidents du travail) consolidée sur l'année écoulée. Référence : Code travail art. L.2312-28. Obligatoire dans les entreprises de 300 ETP et plus, fortement recommandé en deçà.",
    impact:
      "Présenté au CSE (en présence) et à l'AG annuelle des associations. Permet d'objectiver les politiques RH, de tracer les écarts H/F et de documenter les actions de prévention. **L'absence des indicateurs de sécurité (TF/TG INRS) ou la sous-déclaration des AT/MP expose à un redressement URSSAF + faute inexcusable.**",
    levier:
      "Centraliser la collecte tout au long de l'année (registre AT/MP, registre formation, fichiers RH unifiés). Présenter le bilan en CSE avec un plan d'amélioration documenté et chiffré pour les indicateurs en alerte. Archiver le PDF avec le PV de l'AG.",
  },
  {
    id: 'duer',
    term: "DUER — Document Unique d'Évaluation des Risques",
    categorie: 'masse_salariale',
    definition:
      "Inventaire formalisé des risques professionnels (physiques, psychosociaux, ergonomiques, biologiques, chimiques, organisationnels, routiers, incendie) par unité de travail, avec cotation Probabilité × Gravité (matrice 5×5 méthode INRS) et plan d'action de prévention. Obligation Code travail art. R.4121-1 dès le 1er salarié.",
    impact:
      "**Mise à jour annuelle obligatoire (R.4121-2)** ou à chaque modification importante des conditions de travail / accident du travail. Sanction pénale : amende 5e classe (1 500 € par UT manquante, 3 000 € en récidive). Engage la responsabilité civile et pénale du dirigeant en cas d'AT/MP grave (faute inexcusable de l'employeur — art. L.452-1 CSS, indemnisations triplées).",
    levier:
      "Programmer une revue annuelle pluridisciplinaire (RH + référent prévention + CSE le cas échéant), associer des plans d'action chiffrés à chaque risque élevé/critique, suivre les échéances. Le DUER est consultable par l'inspection du travail, les agents URSSAF, le médecin du travail et les salariés (R.4121-4).",
  },
  {
    id: 'qualiopi',
    term: 'Qualiopi (Référentiel National Qualité — RNQ)',
    categorie: 'comptable',
    definition:
      "Certification obligatoire (Code travail art. L.6316-1, arrêté du 6 juin 2019) attestant la qualité du processus mis en œuvre par les organismes de formation. 32 indicateurs RNQ audités tous les 3 ans, dont I-9 (taux d'abandon), I-23 (insertion 6 mois), I-24 (taux de certification), I-30 (satisfaction stagiaires) et I-31 (satisfaction financeurs).",
    impact:
      "**Perte de la certification = perte d'accès aux financements publics CPF, OPCO, Région, France Travail.** L'auditeur exige une preuve documentée pour CHAQUE indicateur (questionnaire signé, attestation employeur, PV de jury, registre nominatif) — l'absence de preuve vaut non-conformité, indépendamment de la valeur réelle du taux.",
    levier:
      "Mettre en place un dispositif de collecte continu (enquêtes fin de promo, suivi cohorte 6 mois, registre des plaintes), pas seulement en J-30 de l'audit. Documenter les écarts et les plans d'action correctifs. Conserver les preuves au minimum sur le cycle triennal complet.",
  },
  {
    id: 'pyramide_ages',
    term: 'Pyramide des âges',
    categorie: 'masse_salariale',
    definition:
      "Représentation de la répartition des effectifs par tranches d'âge (généralement 5 ans). Permet de visualiser l'équilibre démographique d'une organisation et la concentration éventuelle des départs en retraite.",
    impact:
      "Une pyramide déséquilibrée vers le haut (>30 % de seniors > 55 ans) signale un risque cumulé : vague d'IFC à provisionner, perte de savoir-faire critique, sous-effectif structurel à 5-7 ans. À l'inverse, une pyramide trop jeune fragilise la transmission d'expérience.",
    levier:
      "Plan GPEC (Gestion Prévisionnelle des Emplois et Compétences), tutorat junior/senior, recrutement structurel anticipant les départs, optimisation des départs en retraite progressive (CCN 66).",
  },
];

export const CATEGORIES = {
  tresorerie:      { label: 'Trésorerie',      color: 'cyan'    },
  masse_salariale: { label: 'Masse salariale', color: 'blue'    },
  pilotage:        { label: 'Pilotage',        color: 'teal'    },
  fiscal:          { label: 'Fiscal',          color: 'rose'    },
  provisions:      { label: 'Provisions',      color: 'amber'   },
  recettes:        { label: 'Recettes',        color: 'emerald' },
  comptable:       { label: 'Comptable',       color: 'violet'  },
};

export const findGlossaryTerm = (id) => GLOSSARY.find(g => g.id === id);

export const searchGlossary = (query) => {
  if (!query) return GLOSSARY;
  const q = query.toLowerCase().trim();
  return GLOSSARY.filter(g =>
    g.term.toLowerCase().includes(q) ||
    g.definition.toLowerCase().includes(q) ||
    g.id.includes(q)
  );
};
