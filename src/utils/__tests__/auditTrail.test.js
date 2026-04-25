import { describe, it, expect } from 'vitest';
import { appendSigned, verifyChain, migrateLegacyEntries } from '../auditTrail';

describe('auditTrail — chaînage SHA-256', () => {
  it('crée une entrée genesis valide quand prevEntry est null', async () => {
    const entry = await appendSigned(null, 'Test genesis', 'Mod', 'detail');
    expect(entry.prevHash).toBe('0'.repeat(64));
    expect(entry.hash).toMatch(/^[a-f0-9]{64}$/);
    expect(entry.action).toBe('Test genesis');
  });

  it('chaîne deux entrées : prevHash de la 2e = hash de la 1re', async () => {
    const e1 = await appendSigned(null, 'a', 'm', 'd1');
    const e2 = await appendSigned(e1, 'b', 'm', 'd2');
    expect(e2.prevHash).toBe(e1.hash);
    expect(e2.hash).not.toBe(e1.hash);
  });

  it('verifyChain valide une chaîne intègre (stockée en ordre inverse — head = plus récent)', async () => {
    const e1 = await appendSigned(null, 'a', 'm', '');
    const e2 = await appendSigned(e1, 'b', 'm', '');
    const e3 = await appendSigned(e2, 'c', 'm', '');
    const journal = [e3, e2, e1];
    const status = await verifyChain(journal);
    expect(status.valid).toBe(true);
    expect(status.signedCount).toBe(3);
  });

  it('verifyChain détecte une altération du contenu', async () => {
    const e1 = await appendSigned(null, 'a', 'm', '');
    const e2 = await appendSigned(e1, 'b', 'm', '');
    const e3 = await appendSigned(e2, 'c', 'm', '');
    const altered = { ...e2, details: 'modifié' }; // hash devient invalide
    const journal = [e3, altered, e1];
    const status = await verifyChain(journal);
    expect(status.valid).toBe(false);
    expect(status.brokenAt).not.toBeNull();
  });

  it('verifyChain détecte une rupture de prevHash (entrée injectée)', async () => {
    const e1 = await appendSigned(null, 'a', 'm', '');
    const e2 = await appendSigned(e1, 'b', 'm', '');
    const fake = await appendSigned(null, 'fake', 'm', ''); // prevHash = genesis
    const journal = [fake, e2, e1];
    const status = await verifyChain(journal);
    expect(status.valid).toBe(false);
  });

  it('migrateLegacyEntries reconstitue une chaîne valide à partir d\'entrées non signées', async () => {
    const legacy = [
      { ts: '2026-04-25T10:00:00Z', action: 'c', module: 'm', details: 'd3' },
      { ts: '2026-04-25T09:00:00Z', action: 'b', module: 'm', details: 'd2' },
      { ts: '2026-04-25T08:00:00Z', action: 'a', module: 'm', details: 'd1' },
    ];
    const migrated = await migrateLegacyEntries(legacy);
    const status = await verifyChain(migrated);
    expect(status.valid).toBe(true);
    expect(migrated.length).toBe(3);
    expect(migrated[2].prevHash).toBe('0'.repeat(64)); // entrée la plus ancienne = genesis
  });

  it('verifyChain accepte un journal vide', async () => {
    const status = await verifyChain([]);
    expect(status.valid).toBe(true);
    expect(status.total).toBe(0);
  });
});
