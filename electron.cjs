const { app, BrowserWindow, shell, ipcMain } = require('electron')
const path = require('path')
const fs   = require('fs')

// ── Chemin du fichier de données principal ────────────────────────────────────
// Disponible dès que app est prêt (app.getPath requiert app.whenReady)
let DATA_PATH = null
let DATA_DIR  = null

function getDataPath() {
  if (!DATA_PATH) {
    DATA_DIR  = app.getPath('userData')
    DATA_PATH = path.join(DATA_DIR, 'data.json')
  }
  return DATA_PATH
}

// ── Écriture atomique : temp → fsync → rename ─────────────────────────────────
// Évite la corruption du fichier si l'appli crashe pendant l'écriture.
function writeAtomic(filePath, data) {
  const tmp = filePath + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8')
  // fsync garantit l'écriture sur disque avant le rename
  const fd = fs.openSync(tmp, 'r+')
  fs.fsyncSync(fd)
  fs.closeSync(fd)
  fs.renameSync(tmp, filePath)
}

// ── Handlers IPC ──────────────────────────────────────────────────────────────

// Réponse synchrone au preload (AVANT le premier render React)
ipcMain.on('storage:getPathSync', event => {
  event.returnValue = getDataPath()
})

// Sauvegarde synchrone — utilisée uniquement dans beforeunload pour garantir l'écriture fichier
ipcMain.on('storage:saveSync', (event, dataMap) => {
  try {
    const p = getDataPath()
    let existing = {}
    try {
      if (fs.existsSync(p)) existing = JSON.parse(fs.readFileSync(p, 'utf-8'))
    } catch { /* fichier absent — on repart de zéro */ }
    writeAtomic(p, { ...existing, ...dataMap, _savedAt: new Date().toISOString() })
    event.returnValue = { ok: true }
  } catch (e) {
    event.returnValue = { ok: false, reason: e.message }
  }
})

// Sauvegarde de données : merge avec l'existant, puis écriture atomique
ipcMain.handle('storage:save', async (event, dataMap) => {
  const p = getDataPath()
  let existing = {}
  try {
    if (fs.existsSync(p)) existing = JSON.parse(fs.readFileSync(p, 'utf-8'))
  } catch { /* fichier absent ou corrompu — on repart de zéro */ }

  const merged = { ...existing, ...dataMap, _savedAt: new Date().toISOString() }
  writeAtomic(p, merged)
  return { ok: true, path: p }
})

// Snapshot auto-save : copie data.json → data_autosave.json (rotation 3 slots)
ipcMain.handle('storage:backup', async () => {
  const src = getDataPath()
  if (!fs.existsSync(src)) return { ok: false, reason: 'data.json inexistant' }

  try {
    const slot = ((parseInt(readMeta('backup_slot') || '0') % 3) + 1)
    const dest = path.join(DATA_DIR, `data_autosave_${slot}.json`)
    fs.copyFileSync(src, dest)
    writeMeta('backup_slot', String(slot))
    writeMeta('backup_last', new Date().toISOString())
    return { ok: true, path: dest, slot }
  } catch (e) {
    return { ok: false, reason: e.message }
  }
})

// Chemin absolu du fichier (affiché dans l'UI)
ipcMain.handle('storage:getPath', async () => getDataPath())

// Ouvre le dossier AppData dans l'explorateur de fichiers natif
ipcMain.handle('storage:openFolder', async () => {
  shell.openPath(DATA_DIR)
})

// ── Métadonnées légères (backup_slot, backup_last) ────────────────────────────
// Stockées dans meta.json à côté de data.json pour ne pas polluer les données.
function metaPath() { return path.join(DATA_DIR, 'meta.json') }
function readMeta(key)        {
  try { return JSON.parse(fs.readFileSync(metaPath(), 'utf-8'))[key] ?? null }
  catch { return null }
}
function writeMeta(key, val)  {
  let m = {}
  try { m = JSON.parse(fs.readFileSync(metaPath(), 'utf-8')) } catch {}
  m[key] = val
  fs.writeFileSync(metaPath(), JSON.stringify(m), 'utf-8')
}

// ── Fenêtre principale ────────────────────────────────────────────────────────
function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 600,
    icon: path.join(__dirname, 'public', 'logo.png'),
    title: 'Budget AFERTES 2026',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  })

  win.loadFile(path.join(__dirname, 'dist', 'index.html'))

  // Ouvrir les liens externes dans le navigateur système
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

app.whenReady().then(() => {
  // Initialise DATA_PATH maintenant que app est prêt
  getDataPath()

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
