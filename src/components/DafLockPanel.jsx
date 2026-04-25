import React, { useState } from 'react';
import { Lock, Unlock, Shield, Key, AlertTriangle } from 'lucide-react';

export default function DafLockPanel({
  darkMode,
  dafConfigured,
  dafUnlocked,
  dafLocked,
  setupDaf,
  unlockDaf,
  lockDaf,
  resetDaf,
  appendAuditEntry,
}) {
  const [pwd, setPwd]         = useState('');
  const [pwd2, setPwd2]       = useState('');
  const [error, setError]     = useState('');
  const [showSetup, setShowSetup] = useState(false);

  const onUnlock = async () => {
    setError('');
    const ok = await unlockDaf(pwd);
    if (!ok) {
      setError('Mot de passe DAF incorrect');
      return;
    }
    setPwd('');
    appendAuditEntry?.('Déverrouillage DAF', 'Paramètres', 'Session DAF ouverte (30 min)');
  };

  const onLock = () => {
    lockDaf();
    appendAuditEntry?.('Verrouillage DAF', 'Paramètres', 'Session DAF fermée manuellement');
  };

  const onSetup = async () => {
    setError('');
    if (pwd.length < 4) { setError('Mot de passe DAF — minimum 4 caractères'); return; }
    if (pwd !== pwd2)   { setError('Les deux saisies ne correspondent pas'); return; }
    await setupDaf(pwd);
    setPwd(''); setPwd2(''); setShowSetup(false);
    appendAuditEntry?.('Configuration DAF', 'Paramètres', 'Mot de passe DAF défini, constantes désormais verrouillées');
  };

  const onReset = () => {
    if (!window.confirm('Réinitialiser le mot de passe DAF ?\n\nLes constantes redeviendront modifiables sans restriction. Cette action est tracée dans la piste d\'audit.')) return;
    resetDaf();
    appendAuditEntry?.('Réinitialisation DAF', 'Paramètres', 'Mot de passe DAF effacé — constantes déverrouillées');
  };

  // ── Bootstrap : aucun mot de passe DAF défini ──
  if (!dafConfigured) {
    return (
      <div className={`mb-6 rounded-3xl border-2 border-dashed p-5 ${darkMode ? 'bg-zinc-800/40 border-zinc-600' : 'bg-slate-50 border-slate-300'}`}>
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-xl shrink-0 ${darkMode ? 'bg-amber-900/40' : 'bg-amber-100'}`}>
            <Shield size={22} className={darkMode ? 'text-amber-300' : 'text-amber-600'} />
          </div>
          <div className="flex-1">
            <h3 className={`font-black text-base mb-1 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              Verrouillage Institutionnel — non configuré
            </h3>
            <p className={`text-sm mb-3 ${darkMode ? 'text-zinc-400' : 'text-slate-600'}`}>
              Activez le mode DAF pour protéger les constantes fiscales (charges patronales, Ségur, taxe salaires, GVT, inflations, grille vacataires). Une fois configuré, seul le détenteur du mot de passe DAF pourra modifier ces paramètres.
            </p>
            {!showSetup ? (
              <button
                onClick={() => setShowSetup(true)}
                className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${darkMode ? 'bg-amber-700/40 text-amber-300 hover:bg-amber-700/60' : 'bg-amber-500 text-white hover:bg-amber-600'}`}
              >
                <Key size={14} /> Définir le mot de passe DAF
              </button>
            ) : (
              <div className="space-y-2">
                <input
                  type="password" placeholder="Mot de passe DAF (min. 4 caractères)"
                  value={pwd} onChange={e => setPwd(e.target.value)}
                  className={`w-full max-w-sm rounded-xl px-3 py-2 text-sm border outline-none ${darkMode ? 'bg-zinc-700 border-zinc-600 text-white' : 'bg-white border-slate-300'}`}
                />
                <input
                  type="password" placeholder="Confirmer"
                  value={pwd2} onChange={e => setPwd2(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && onSetup()}
                  className={`w-full max-w-sm rounded-xl px-3 py-2 text-sm border outline-none ${darkMode ? 'bg-zinc-700 border-zinc-600 text-white' : 'bg-white border-slate-300'}`}
                />
                {error && <p className="text-xs font-bold text-red-500 flex items-center gap-1"><AlertTriangle size={12} /> {error}</p>}
                <div className="flex gap-2">
                  <button onClick={onSetup} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-bold">Activer le verrouillage</button>
                  <button onClick={() => { setShowSetup(false); setPwd(''); setPwd2(''); setError(''); }}
                    className={`px-4 py-2 rounded-xl text-sm font-bold ${darkMode ? 'bg-zinc-700 text-zinc-300' : 'bg-slate-200 text-slate-600'}`}>Annuler</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Mode DAF déverrouillé — session active ──
  if (dafUnlocked) {
    return (
      <div className={`mb-6 rounded-3xl border-2 p-5 ${darkMode ? 'bg-emerald-900/20 border-emerald-700' : 'bg-emerald-50 border-emerald-300'}`}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${darkMode ? 'bg-emerald-900/40' : 'bg-emerald-100'}`}>
              <Unlock size={22} className={darkMode ? 'text-emerald-300' : 'text-emerald-600'} />
            </div>
            <div>
              <h3 className={`font-black text-base ${darkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
                Mode DAF — session ouverte
              </h3>
              <p className={`text-xs ${darkMode ? 'text-emerald-400/80' : 'text-emerald-700/80'}`}>
                Vous pouvez modifier les constantes institutionnelles. La session se ferme automatiquement après 30 min d'inactivité.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={onLock}
              className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${darkMode ? 'bg-emerald-700/40 text-emerald-200 hover:bg-emerald-700/60' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>
              <Lock size={14} /> Verrouiller maintenant
            </button>
            <button onClick={onReset}
              className={`px-3 py-2 rounded-xl text-xs font-bold ${darkMode ? 'bg-red-900/30 text-red-300 hover:bg-red-900/50' : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'}`}>
              Réinitialiser DAF
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Mode DAF verrouillé — demande mot de passe ──
  return (
    <div className={`mb-6 rounded-3xl border-2 p-5 ${darkMode ? 'bg-violet-900/20 border-violet-700' : 'bg-violet-50 border-violet-300'}`}>
      <div className="flex items-start gap-3 flex-wrap">
        <div className={`p-2.5 rounded-xl shrink-0 ${darkMode ? 'bg-violet-900/40' : 'bg-violet-100'}`}>
          <Lock size={22} className={darkMode ? 'text-violet-300' : 'text-violet-600'} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`font-black text-base mb-1 ${darkMode ? 'text-violet-200' : 'text-violet-800'}`}>
            Constantes institutionnelles — verrouillées
          </h3>
          <p className={`text-sm mb-3 ${darkMode ? 'text-violet-300/80' : 'text-violet-700/80'}`}>
            Charges patronales, Ségur, taxe salaires, GVT, inflations différenciées, grille vacataires : modifications réservées au profil DAF. Saisissez le mot de passe DAF pour ouvrir une session de 30 minutes.
          </p>
          <div className="flex flex-wrap gap-2 items-center">
            <input
              type="password" placeholder="Mot de passe DAF"
              value={pwd} onChange={e => setPwd(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onUnlock()}
              className={`rounded-xl px-3 py-2 text-sm border outline-none w-56 ${darkMode ? 'bg-zinc-700 border-zinc-600 text-white' : 'bg-white border-slate-300'}`}
            />
            <button onClick={onUnlock}
              className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${darkMode ? 'bg-violet-700/40 text-violet-200 hover:bg-violet-700/60' : 'bg-violet-600 text-white hover:bg-violet-700'}`}>
              <Unlock size={14} /> Déverrouiller
            </button>
            <button onClick={onReset}
              className={`px-3 py-2 rounded-xl text-xs font-bold ${darkMode ? 'bg-red-900/30 text-red-300 hover:bg-red-900/50' : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'}`}>
              Réinitialiser DAF
            </button>
          </div>
          {error && <p className="text-xs font-bold text-red-500 flex items-center gap-1 mt-2"><AlertTriangle size={12} /> {error}</p>}
        </div>
      </div>
    </div>
  );
}
