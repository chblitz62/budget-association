# Checklist de maintenance annuelle — AFERTES Budget

À effectuer chaque **début janvier** (ou dès parution des décrets).

---

## 1. Constantes légales (`src/utils/constants.js`)

### SMIC mensuel brut
```js
export const SMIC_MENSUEL = 1841.45; // vérifier arrêté au 1er novembre N-1
```
- Source : [legifrance.gouv.fr](https://www.legifrance.gouv.fr) → décret revalorisation SMIC
- Revalorisation automatique si inflation > 2% en cours d'année → surveiller

### Taux charges patronales CCN 66
```js
export const CHARGES_PATRONALES = 0.44;
```
- Décomposition : URSSAF (~40%) + prévoyance CHORUM/OCIRP (~3,5%) + médecine du travail (~0,5%)
- Vérifier : lettre circulaire URSSAF + avenant prévoyance CCN 66
- Contacte : service paie ou expert-comptable pour taux réel de l'association

### Prime Ségur
```js
export const PRIME_SEGUR = 238; // €/ETP/mois
```
- Surveiller les avenants conventionnels CCN 66 (NEXEM / FEHAP)
- Dernière révision connue : 2021 (183 €) puis extension 2022 (238 €)

### Taux de réduction Fillon
```js
export const TAUX_FILLON_MAX = 0.3214;
```
- Stable depuis 2019 — surveiller toute réforme des exonérations bas salaires
- Formule : `(0,3214 / 0,6) × (1,6 × SMIC_annuel / Rémunération_annuelle − 1)`

### Charges vacataires
```js
export const CHARGES_VACATAIRE = 0.15;
```
- Ne s'applique **pas** aux prestataires indépendants (auto-entrepreneurs)
- Vérifier si des vacataires basculent en statut salarié en cours d'année

---

## 2. Grille tarifaire vacataires (UI → Paramètres)

Vérifier et mettre à jour la grille horaire dans l'onglet **Paramètres** à chaque rentrée scolaire (septembre) :
- Tarif horaire brut par catégorie (A, B, C…)
- Alignement sur la grille de classification CCN 66 si applicable

---

## 3. Clés de répartition filières (`src/utils/constants.js`)

```js
export const CLES_FILIERE = [
  { id: 'aes',      label: 'AES',      cle: 1.79  },
  { id: 'es_arras', label: 'ES Arras', cle: 30.25 },
  // ...
];
```
- **Recalibrer selon les effectifs réels N** (inscrits définitifs, pas prévisionnels)
- Les clés doivent sommer à ~100% — vérifier en console : `CLES_FILIERE.reduce((s,f) => s + f.cle, 0)`
- Mettre à jour avant le premier CA de l'année

---

## 4. Vérifications croisées à faire avant toute présentation CA

- [ ] `npm run build` passe sans erreur ni warning
- [ ] `npm test` — tous les tests verts
- [ ] Export Excel global → ouvrir et vérifier les totaux masse salariale
- [ ] Onglet Synthèse Analytique → solde global cohérent avec le prévisionnel N-1
- [ ] Dashboard → taux de couverture ≥ 90% sur tous les services actifs
- [ ] Coefficiant BP à 100% (badge header absent)

---

## 5. Historique des valeurs

| Constante | 2025 | 2026 | Prochaine vérif. |
|---|---|---|---|
| `SMIC_MENSUEL` | — | 1 841,45 € | Nov. 2026 |
| `CHARGES_PATRONALES` | 0,42 | **0,44** | Jan. 2027 |
| `PRIME_SEGUR` | 238 € | 238 € | Dès avenant CCN 66 |
| `TAUX_FILLON_MAX` | 0,3214 | 0,3214 | Dès réforme exonérations |
| `CHARGES_VACATAIRE` | 0,15 | 0,15 | Jan. 2027 |
