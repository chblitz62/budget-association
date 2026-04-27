import { describe, it, expect } from 'vitest';
import {
  normaliserReferentiel, creerEntree, detecterDoublonsCode,
  calculerSyntheseReferentiel, trouverEntree, trouverParCode, genererOptions,
  TYPES_SERVICE, NIVEAUX_FILIERE, REFERENTIEL_DEFAULT, slugifyCode,
} from '../referentielStructure';

describe('Référentiel de Structure — Axe 6 S6.2', () => {
  it('REFERENTIEL_DEFAULT a les 3 catégories vides', () => {
    expect(REFERENTIEL_DEFAULT).toEqual({ lieux: [], services: [], filieres: [] });
  });

  it('TYPES_SERVICE expose les 5 types attendus', () => {
    const ids = TYPES_SERVICE.map(t => t.id);
    expect(ids).toContain('pedagogie');
    expect(ids).toContain('restauration');
    expect(ids).toContain('technique');
    expect(ids).toContain('support');
    expect(ids).toContain('autre');
  });

  it('NIVEAUX_FILIERE expose les niveaux RNCP', () => {
    const ids = NIVEAUX_FILIERE.map(n => n.id);
    expect(ids).toContain('niveau3');
    expect(ids).toContain('niveau7');
    expect(ids).toContain('fc');
  });

  it('normaliserReferentiel gère null/undefined/champs manquants', () => {
    expect(normaliserReferentiel(null)).toEqual(REFERENTIEL_DEFAULT);
    expect(normaliserReferentiel(undefined)).toEqual(REFERENTIEL_DEFAULT);
    expect(normaliserReferentiel({})).toEqual(REFERENTIEL_DEFAULT);
    expect(normaliserReferentiel({ lieux: 'pas un tableau' })).toEqual(REFERENTIEL_DEFAULT);
  });

  it('normaliserReferentiel filtre les entrées falsy', () => {
    const r = normaliserReferentiel({ lieux: [{ id: '1' }, null, undefined, { id: '2' }] });
    expect(r.lieux.length).toBe(2);
  });

  it('creerEntree lieu : id unique + code auto-slug + adresse', () => {
    const e = creerEntree('lieu', { libelle: 'Centre d\'Arras', adresse: '12 rue X' });
    expect(e.id).toMatch(/^lieu_/);
    expect(e.code).toBe('CENTRE_D');  // slug 8 chars max
    expect(e.libelle).toBe('Centre d\'Arras');
    expect(e.adresse).toBe('12 rue X');
    expect(e.actif).toBe(true);
  });

  it('creerEntree service : type par défaut "pedagogie"', () => {
    const e = creerEntree('service', { libelle: 'IRTS' });
    expect(e.type).toBe('pedagogie');
    expect(e.code).toBe('IRTS');
  });

  it('creerEntree filiere : niveau + certificateur', () => {
    const e = creerEntree('filiere', { libelle: 'DEES Éducateur', niveau: 'niveau6', certificateur: 'Min. Solidarités' });
    expect(e.niveau).toBe('niveau6');
    expect(e.certificateur).toBe('Min. Solidarités');
  });

  it('slugifyCode gère accents et casse', () => {
    expect(slugifyCode('Éducateur Spécialisé')).toBe('EDUCATEU');
    expect(slugifyCode('arras')).toBe('ARRAS');
    expect(slugifyCode('Pôle Support')).toBe('POLE_SUP');
  });

  it('detecterDoublonsCode signale les codes en doublon', () => {
    const entries = [
      { id: '1', code: 'ARR' },
      { id: '2', code: 'LIL' },
      { id: '3', code: 'arr' }, // doublon avec '1' (case insensitive)
    ];
    const conflits = detecterDoublonsCode(entries);
    expect(conflits['3']).toBe('duplicate');
    expect(conflits['1']).toBeUndefined();
    expect(conflits['2']).toBeUndefined();
  });

  it('detecterDoublonsCode ignore les codes vides', () => {
    const entries = [
      { id: '1', code: '' },
      { id: '2', code: '' },
      { id: '3', code: 'X' },
    ];
    const conflits = detecterDoublonsCode(entries);
    expect(Object.keys(conflits).length).toBe(0);
  });

  it('calculerSyntheseReferentiel compte actifs/archives par catégorie', () => {
    const ref = {
      lieux: [
        { id: 'l1', actif: true },
        { id: 'l2', actif: false },
        { id: 'l3', actif: true },
      ],
      services: [{ id: 's1', actif: true }],
      filieres: [],
    };
    const s = calculerSyntheseReferentiel(ref);
    expect(s.lieux.total).toBe(3);
    expect(s.lieux.actifs).toBe(2);
    expect(s.lieux.archives).toBe(1);
    expect(s.services.actifs).toBe(1);
    expect(s.filieres.total).toBe(0);
    expect(s.total).toBe(4);
  });

  it('trouverEntree cherche dans toutes les catégories', () => {
    const ref = {
      lieux:    [{ id: 'l1', libelle: 'Lieu 1' }],
      services: [{ id: 's1', libelle: 'Service 1' }],
      filieres: [{ id: 'f1', libelle: 'Filière 1' }],
    };
    expect(trouverEntree(ref, 'l1')?.libelle).toBe('Lieu 1');
    expect(trouverEntree(ref, 's1')?.libelle).toBe('Service 1');
    expect(trouverEntree(ref, 'f1')?.libelle).toBe('Filière 1');
    expect(trouverEntree(ref, 'inexistant')).toBeNull();
  });

  it('trouverParCode insensible à la casse', () => {
    const ref = {
      lieux: [{ id: 'l1', code: 'ARR', libelle: 'Arras' }],
      services: [], filieres: [],
    };
    expect(trouverParCode(ref, 'lieux', 'arr')?.libelle).toBe('Arras');
    expect(trouverParCode(ref, 'lieux', 'ARR')?.libelle).toBe('Arras');
    expect(trouverParCode(ref, 'lieux', 'INEXISTANT')).toBeNull();
  });

  it('genererOptions filtre les inactifs par défaut', () => {
    const ref = {
      lieux: [
        { id: 'l1', code: 'ARR', libelle: 'Arras', actif: true },
        { id: 'l2', code: 'LIL', libelle: 'Lille', actif: false },
      ],
      services: [], filieres: [],
    };
    const opts = genererOptions(ref, 'lieux');
    expect(opts.length).toBe(1);
    expect(opts[0].label).toBe('ARR — Arras');
  });

  it('genererOptions inclut inactifs si incluireInactifs=true', () => {
    const ref = {
      lieux: [
        { id: 'l1', actif: true, libelle: 'A', code: 'A' },
        { id: 'l2', actif: false, libelle: 'B', code: 'B' },
      ],
      services: [], filieres: [],
    };
    expect(genererOptions(ref, 'lieux', { incluireInactifs: true }).length).toBe(2);
  });

  it('genererOptions retourne value=id et expose code+libelle', () => {
    const ref = {
      lieux: [{ id: 'l1', code: 'ARR', libelle: 'Arras', actif: true }],
      services: [], filieres: [],
    };
    const [opt] = genererOptions(ref, 'lieux');
    expect(opt.value).toBe('l1');
    expect(opt.code).toBe('ARR');
    expect(opt.libelle).toBe('Arras');
  });
});
