/**
 * preload.cjs — Pont sécurisé entre le processus principal Electron et le renderer
 *
 * Ce script s'exécute dans le contexte Node.js AVANT que React s'initialise.
 * Il lit data.json de façon synchrone pour que loadFromStorage() ait les données
 * disponibles dès le premier useState() — sans flash ni rechargement.
 *
 * API exposée via contextBridge → window.electronAPI :
 *   initialData      : Object | null  — snapshot lu depuis data.json au démarrage
 *   saveData(map)    : Promise<{ok,path}> — sauvegarde atomique dans data.json
 *   triggerBackup()  : Promise<{ok,path}> — snapshot 5-min dans data_autosave.json
 *   getDataPath()    : Promise<string>    — chemin absolu de data.json
 *   openDataFolder() : void              — ouvre le dossier AppData dans l'explorateur
 */

const { contextBridge, ipcRenderer } = require('electron')
const fs   = require('fs')
const path = require('path')

// ── Lecture synchrone du fichier de données ───────────────────────────────────
// ipcRenderer.sendSync bloque jusqu'à ce que le main process réponde avec le chemin.
// C'est intentionnel : on doit avoir les données AVANT le premier render React.
let initialData = null
try {
  const dataPath = ipcRenderer.sendSync('storage:getPathSync')
  if (dataPath && fs.existsSync(dataPath)) {
    const raw = fs.readFileSync(dataPath, 'utf-8')
    initialData = JSON.parse(raw)
  }
} catch (e) {
  console.warn('[preload] Impossible de lire data.json :', e.message)
}

// ── Exposition sécurisée vers le renderer ─────────────────────────────────────
contextBridge.exposeInMainWorld('electronAPI', {
  // Données préchargées (objet plat clé→valeur, comme localStorage)
  initialData,

  // Sauvegarde atomique : écrit dataMap dans data.json (merge avec existant)
  saveData: dataMap => ipcRenderer.invoke('storage:save', dataMap),

  // Sauvegarde synchrone — uniquement pour beforeunload (bloquant intentionnel)
  saveDataSync: dataMap => ipcRenderer.sendSync('storage:saveSync', dataMap),

  // Snapshot auto-save : copie data.json vers data_autosave.json
  triggerBackup: () => ipcRenderer.invoke('storage:backup'),

  // Chemin absolu du fichier de données (pour affichage dans l'UI)
  getDataPath: () => ipcRenderer.invoke('storage:getPath'),

  // Ouvre le dossier AppData dans l'explorateur de fichiers
  openDataFolder: () => ipcRenderer.invoke('storage:openFolder'),
})
