import { describe, it, expect } from 'vitest';
import {
  calculerTauxHoraireDefault, valoriserContribution, calculerSyntheseBenevolat,
  QUALIFICATIONS, CATEGORIES_COMPTABLES_LIST,
} from '../valorisationBenevolat';

describe('Valorisation du bénévolat — CRC 2018-06', () => {
  it('taux horaire défaut ≈ SMIC chargé (~17 €/h)', () => {
    const taux = calculerTauxHoraireDefault();
    expect(taux).toBeGreaterThan(15);
    expect(taux).toBeLessThan(20);
  });

  it('valorise 0 si heures = 0', () => {
    const r = valoriserContribution({ heures: 0 });
    expect(r.valorisation).toBe(0);
  });

  it('contribution standard : valorisation = heures × tauxSMICchargé', () => {
    const r = valoriserContribution({ heures: 100, qualification: 'standard' });
    const tauxAttendu = calculerTauxHoraireDefault();
    expect(r.tauxAppliqué).toBeCloseTo(tauxAttendu, 2);
    expect(r.valorisation).toBeCloseTo(100 * tauxAttendu, 1);
  });

  it('contribution "professionnel" applique coef ×2', () => {
    const r = valoriserContribution({ heures: 50, qualification: 'professionnel' });
    expect(r.tauxAppliqué).toBeCloseTo(calculerTauxHoraireDefault() * 2, 2);
  });

  it('contribution "expert" applique coef ×3', () => {
    const r = valoriserContribution({ heures: 50, qualification: 'expert' });
    expect(r.tauxAppliqué).toBeCloseTo(calculerTauxHoraireDefault() * 3, 2);
  });

  it('tauxHoraireCustom prend priorité sur la qualification', () => {
    const r = valoriserContribution({ heures: 100, qualification: 'expert', tauxHoraireCustom: 50 });
    expect(r.tauxAppliqué).toBe(50);
    expect(r.valorisation).toBe(5000);
  });

  it('liste vide retourne synthèse à zéro', () => {
    const s = calculerSyntheseBenevolat([]);
    expect(s.totalValorisation).toBe(0);
    expect(s.totalHeures).toBe(0);
    expect(s.compte86).toBe(0);
    expect(s.compte87).toBe(0);
    expect(s.equilibre).toBe(true);
  });

  it('compte 86 = compte 87 (équilibre comptable obligatoire)', () => {
    const benevoles = [
      { id: 'b1', nom: 'Marie', heures: 100, qualification: 'standard', categorie: 'benevolat' },
      { id: 'b2', nom: 'Paul',  heures: 50,  qualification: 'professionnel', categorie: 'benevolat' },
    ];
    const s = calculerSyntheseBenevolat(benevoles);
    expect(s.compte86).toBe(s.compte87);
    expect(s.equilibre).toBe(true);
  });

  it('total heures et total valorisation sont cohérents', () => {
    const benevoles = [
      { id: 'b1', nom: 'A', heures: 100, qualification: 'standard' },
      { id: 'b2', nom: 'B', heures: 50,  qualification: 'standard' },
    ];
    const s = calculerSyntheseBenevolat(benevoles);
    expect(s.totalHeures).toBe(150);
    expect(s.totalValorisation).toBeGreaterThan(0);
  });

  it('ventilation par catégorie comptable (871 / 872 / 875)', () => {
    const benevoles = [
      { id: 'b1', nom: 'Bénévole 1', heures: 100, categorie: 'benevolat' },
      { id: 'b2', nom: 'Prestation 2', heures: 20, categorie: 'prestations_nature' },
      { id: 'b3', nom: 'Don 3', heures: 0, tauxHoraireCustom: 500, categorie: 'dons_nature' },
    ];
    const s = calculerSyntheseBenevolat(benevoles);
    expect(s.parCategorie.benevolat.count).toBe(1);
    expect(s.parCategorie.benevolat.compte).toBe('871');
    expect(s.parCategorie.prestations_nature.compte).toBe('872');
    expect(s.parCategorie.dons_nature.compte).toBe('875');
  });

  it('catégorie par défaut "benevolat" si non précisée', () => {
    const s = calculerSyntheseBenevolat([{ id: 'b', nom: 'X', heures: 10 }]);
    expect(s.contributions[0].categorie).toBe('benevolat');
  });

  it('taux moyen pondéré quand qualifications mixtes', () => {
    const tauxBase = calculerTauxHoraireDefault();
    const benevoles = [
      { id: 'b1', heures: 100, qualification: 'standard' },     // 100h × tauxBase
      { id: 'b2', heures: 100, qualification: 'professionnel' }, // 100h × tauxBase × 2
    ];
    const s = calculerSyntheseBenevolat(benevoles);
    // Moyenne pondérée = total / totalHeures = (100×t + 100×2t) / 200 = 1.5×t
    expect(s.tauxMoyen).toBeCloseTo(tauxBase * 1.5, 1);
  });

  it('robuste aux valeurs invalides (heures null, NaN)', () => {
    const benevoles = [
      { id: 'b1', heures: null },
      { id: 'b2', heures: 'abc' },
      { id: 'b3' }, // pas de heures du tout
    ];
    const s = calculerSyntheseBenevolat(benevoles);
    expect(s.totalValorisation).toBe(0);
    expect(s.contributions.length).toBe(3);
  });

  it('QUALIFICATIONS expose 3 niveaux avec coefficient', () => {
    expect(QUALIFICATIONS.length).toBe(3);
    expect(QUALIFICATIONS.find(q => q.id === 'standard').coef).toBe(1);
    expect(QUALIFICATIONS.find(q => q.id === 'expert').coef).toBe(3);
  });

  it('CATEGORIES_COMPTABLES_LIST expose les 3 comptes 87 ventilés', () => {
    expect(CATEGORIES_COMPTABLES_LIST.length).toBe(3);
    const comptes = CATEGORIES_COMPTABLES_LIST.map(c => c.compte);
    expect(comptes).toContain('871');
    expect(comptes).toContain('872');
    expect(comptes).toContain('875');
  });
});
