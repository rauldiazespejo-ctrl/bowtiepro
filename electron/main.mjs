import { app, BrowserWindow, shell } from 'electron'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isDev = !app.isPackaged

const appRoot = isDev
  ? path.join(__dirname, '..')
  : path.join(process.resourcesPath, 'app')

const staticRoot = path.join(appRoot, 'dist', 'desktop')
const dbPath = path.join(app.getPath('userData'), 'bowtie.db')

let mainWindow = null
let serverPort = null

async function startServer() {
  const serverBundle = path.join(appRoot, 'dist', 'desktop', 'server.mjs')
  const { startDesktopServer } = await import(pathToFileURL(serverBundle).href)
  serverPort = await startDesktopServer({ staticRoot, dbPath })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    title: 'Bowtie Studio Pro',
    backgroundColor: '#090b0f',
    icon: path.join(appRoot, 'dist', 'desktop', 'logo.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  const url = isDev && process.env.BOWTIE_DESKTOP_URL
    ? process.env.BOWTIE_DESKTOP_URL
    : `http://localhost:${serverPort}`

  void mainWindow.loadURL(url)

  mainWindow.webContents.setWindowOpenHandler(({ url: href }) => {
    void shell.openExternal(href)
    return { action: 'deny' }
  })
}

app.whenReady().then(async () => {
  if (!isDev || !process.env.BOWTIE_DESKTOP_URL) {
    await startServer()
  }
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
