import { useCallback, useEffect, useState } from 'react';
import { checkDafPassword, storeDafPassword, hasDafPassword, clearDafPassword } from '../utils/auth';

const SESSION_KEY = 'budget_daf_session';
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 min — session DAF auto-expirée

const readSession = () => {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    const ts = parseInt(raw, 10);
    if (!Number.isFinite(ts)) return false;
    if (Date.now() - ts > SESSION_TTL_MS) {
      sessionStorage.removeItem(SESSION_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

export const useDafMode = () => {
  const [dafConfigured, setDafConfigured] = useState(() => hasDafPassword());
  const [dafUnlocked, setDafUnlocked]     = useState(() => readSession());

  useEffect(() => {
    if (!dafUnlocked) return;
    const id = setInterval(() => {
      if (!readSession()) setDafUnlocked(false);
    }, 60_000);
    return () => clearInterval(id);
  }, [dafUnlocked]);

  const unlockDaf = useCallback(async (typed) => {
    const ok = await checkDafPassword(typed);
    if (ok) {
      sessionStorage.setItem(SESSION_KEY, String(Date.now()));
      setDafUnlocked(true);
    }
    return ok;
  }, []);

  const lockDaf = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setDafUnlocked(false);
  }, []);

  const setupDaf = useCallback(async (newPassword) => {
    if (!newPassword || newPassword.length < 4) return false;
    await storeDafPassword(newPassword);
    sessionStorage.setItem(SESSION_KEY, String(Date.now()));
    setDafConfigured(true);
    setDafUnlocked(true);
    return true;
  }, []);

  const resetDaf = useCallback(() => {
    clearDafPassword();
    sessionStorage.removeItem(SESSION_KEY);
    setDafConfigured(false);
    setDafUnlocked(false);
  }, []);

  // Verrouillage effectif : si pas de password configuré → tout est ouvert (bootstrap)
  // Sinon → verrouillé sauf si session DAF active
  const dafLocked = dafConfigured && !dafUnlocked;

  return {
    dafConfigured,
    dafUnlocked,
    dafLocked,
    unlockDaf,
    lockDaf,
    setupDaf,
    resetDaf,
  };
};
