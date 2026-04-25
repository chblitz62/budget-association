/**
 * Tests de migration v2.1 → v2.3
 *
 * Vérifie que les données au format legacy (v2.1) sont correctement
 * transformées par les migrations de storage.js pour être compatibles
 * avec le schéma actuel (v2.3).
 *
 * Fichier de référence : v2.1_legacy_test.json
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import legacyData from './v2.1_legacy_test.json';

// ─── Mock localStorage ────────────────────────────────────────────────────────
let store = {};
const localStorageMock = {
  getItem: vi.fn(key => store[key] ?? null),
  setItem: vi.fn((key, val) => { store[key] = val; }),
  removeItem: vi.fn(key => { delete store[key]; }),
  clear: vi.fn(() => { store = {}; }),
};
vi.stubGlobal('localStorage', localStorageMock);

import { loadFromStorage, importData, STORAGE_SCHEMA, SCHEMA_VERSION } from '../storage';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const applyMigration = (key) => {
  const schema = STORAGE_SCHEMA[key];
  const shortKey = key.replace('assoc_', '');
  const raw = legacyData[key] ?? legacyData[shortKey];
  if (!schema || raw === undefined) return null;
  const migrated = schema.migrate ? schema.migrate(raw) : raw;
  return migrated;
};

// ─── Tests migrateDirection ───────────────────────────────────────────────────
describe('migrateDirection — format 1 → format 2', () => {
  it('convertit loyer/charges/autresCharges en chargesSiege[]', () => {
    const migrated = applyMigration('assoc_direction');
    expect(migrated.chargesSiege).toBeInstanceOf(Array);
    expect(migrated.chargesSiege).toHaveLength(3);
    expect(migrated.chargesSiege[0]).toMatchObject({ nom: 'Loyer',          montant: 2500 });
    expect(migrated.chargesSiege[1]).toMatchObject({ nom: 'Charges',        montant: 800  });
    expect(migrated.chargesSiege[2]).toMatchObject({ nom: 'Autres charges', montant: 400  });
  });

  it('supprime les anciens champs plats', () => {
    const migrated = applyMigration('assoc_direction');
    expect(migrated).not.toHaveProperty('loyer');
    expect(migrated).not.toHaveProperty('charges');
    expect(migrated).not.toHaveProperty('autresCharges');
  });

  it('préserve le personnel de direction', () => {
    const migrated = applyMigration('assoc_direction');
    expect(migrated.personnel).toHaveLength(2);
    expect(migrated.personnel[0].titre).toBe('Directrice');
  });

  it('passe la validation du schéma', () => {
    const migrated = applyMigration('assoc_direction');
    const schema = STORAGE_SCHEMA['assoc_direction'];
    expect(schema.validate(migrated)).toBe(true);
  });
});

// ─── Tests migrateGlobalParams ────────────────────────────────────────────────
describe('migrateGlobalParams — champs manquants', () => {
  it('ajoute coefficientBP manquant avec valeur par défaut 100', () => {
    const migrated = applyMigration('assoc_globalParams');
    expect(migrated.coefficientBP).toBe(100);
  });

  it('ajoute seuilCouverture manquant', () => {
    const migrated = applyMigration('assoc_globalParams');
    expect(typeof migrated.seuilCouverture).toBe('number');
  });

  it('préserve les valeurs existantes (ne les écrase pas)', () => {
    const migrated = applyMigration('assoc_globalParams');
    expect(migrated.augmentationAnnuelle).toBe(1.5);
    expect(migrated.montantSegurETP).toBe(238);
    expect(migrated.delaiPaiementClients).toBe(30);
    expect(migrated.delaiPaiementFournisseurs).toBe(45);
  });

  it('passe la validation du schéma', () => {
    const migrated = applyMigration('assoc_globalParams');
    const schema = STORAGE_SCHEMA['assoc_globalParams'];
    expect(schema.validate(migrated)).toBe(true);
  });
});

// ─── Tests migrateServices ────────────────────────────────────────────────────
describe('migrateServices — champs manquants dans les services', () => {
  it('ajoute vacataires:[] aux services qui n\'en ont pas', () => {
    const migrated = applyMigration('assoc_services');
    migrated.forEach(s => {
      expect(s.vacataires).toBeInstanceOf(Array);
    });
  });

  it('ajoute recettes:[] aux services qui n\'en ont pas', () => {
    const migrated = applyMigration('assoc_services');
    migrated.forEach(s => {
      expect(s.recettes).toBeInstanceOf(Array);
    });
  });

  it('ajoute investissements:{} aux services qui n\'en ont pas', () => {
    const migrated = applyMigration('assoc_services');
    migrated.forEach(s => {
      expect(typeof s.investissements).toBe('object');
    });
  });

  it('préserve les données existantes (personnel, exploitation, promos)', () => {
    const migrated = applyMigration('assoc_services');
    const bts = migrated.find(s => s.id === 2001);
    expect(bts.personnel).toHaveLength(1);
    expect(bts.exploitation).toHaveLength(2);
    expect(bts.promos).toHaveLength(1);
  });

  it('passe la validation du schéma', () => {
    const migrated = applyMigration('assoc_services');
    const schema = STORAGE_SCHEMA['assoc_services'];
    expect(schema.validate(migrated)).toBe(true);
  });
});

// ─── Tests migrateFormation ───────────────────────────────────────────────────
describe('migrateFormation — champ actions manquant', () => {
  it('ajoute actions:[] si manquant', () => {
    const migrated = applyMigration('assoc_enveloppe_formation');
    expect(migrated.actions).toBeInstanceOf(Array);
    expect(migrated.actions).toHaveLength(0);
  });

  it('préserve le budget existant', () => {
    const migrated = applyMigration('assoc_enveloppe_formation');
    expect(migrated.budget).toBe(5000);
  });

  it('passe la validation du schéma', () => {
    const migrated = applyMigration('assoc_enveloppe_formation');
    const schema = STORAGE_SCHEMA['assoc_enveloppe_formation'];
    expect(schema.validate(migrated)).toBe(true);
  });
});

// ─── Test importData (pipeline complet) ──────────────────────────────────────
describe('importData — pipeline complet depuis v2.1_legacy_test.json', () => {
  beforeEach(() => { store = {}; });

  it('importe le fichier legacy sans erreur', async () => {
    const jsonStr = JSON.stringify(legacyData);
    const file = new File([jsonStr], 'v2.1_legacy_test.json', { type: 'application/json' });

    const result = await importData(file);
    expect(result).toHaveProperty('warnings');
    expect(result.warnings).toBeInstanceOf(Array);
  });

  it('direction migrée est lisible après import (clé courte → clé assoc_)', async () => {
    const jsonStr = JSON.stringify(legacyData);
    const file = new File([jsonStr], 'v2.1_legacy_test.json', { type: 'application/json' });

    await importData(file);

    const saved = JSON.parse(store['assoc_direction']);
    expect(saved.chargesSiege).toBeInstanceOf(Array);
    expect(saved).not.toHaveProperty('loyer');
  });

  it('globalParams migré contient coefficientBP après import', async () => {
    const jsonStr = JSON.stringify(legacyData);
    const file = new File([jsonStr], 'v2.1_legacy_test.json', { type: 'application/json' });

    await importData(file);

    const saved = JSON.parse(store['assoc_globalParams']);
    expect(saved.coefficientBP).toBe(100);
  });

  it('services migrés contiennent vacataires[] après import', async () => {
    const jsonStr = JSON.stringify(legacyData);
    const file = new File([jsonStr], 'v2.1_legacy_test.json', { type: 'application/json' });

    await importData(file);

    const saved = JSON.parse(store['assoc_services']);
    saved.forEach(s => expect(s.vacataires).toBeInstanceOf(Array));
  });

  it('reporting_fc importé et lisible', async () => {
    const jsonStr = JSON.stringify(legacyData);
    const file = new File([jsonStr], 'v2.1_legacy_test.json', { type: 'application/json' });

    await importData(file);

    const saved = JSON.parse(store['assoc_reporting_fc']);
    expect(saved).toHaveLength(1);
    expect(saved[0].stagiaire).toBe('Martin Dupont');
  });
});

// ─── Test version courante ────────────────────────────────────────────────────
describe('SCHEMA_VERSION', () => {
  it('est bien la version 2.3 (actuelle)', () => {
    expect(SCHEMA_VERSION).toBe('2.3');
  });

  it('le fichier legacy est bien une version antérieure', () => {
    const legacyVersion = legacyData.version;
    const [legMaj, legMin] = legacyVersion.split('.').map(Number);
    const [curMaj, curMin] = SCHEMA_VERSION.split('.').map(Number);
    expect(legMaj * 100 + legMin).toBeLessThan(curMaj * 100 + curMin);
  });
});
