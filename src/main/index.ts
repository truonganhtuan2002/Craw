/* eslint-disable prefer-const */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { open } from 'sqlite'
import sqlite3 from 'sqlite3'
import 'reflect-metadata'
import 'reflect-metadata'
import './account'
import './craw'
import './post'

export let mainWindow: BrowserWindow | null = null

// Mở kết nối cơ sở dữ liệu SQLite
export const dbPromise = open({
  filename: './src/databases/mytest.sqlite',
  driver: sqlite3.Database
})

// Hàm để tạo bảng nếu chưa tồn tại
export const createTables = async (): Promise<void> => {
  const db = await dbPromise
  await db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT,
      password TEXT,
      account_type INTEGER NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS crawl_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      keyword TEXT NOT NULL,
      time TEXT NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS crawl_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      crawl_id INTEGER NOT NULL,
      data TEXT NOT NULL,
      url TEXT NOT NULL,
      content TEXT,
      FOREIGN KEY (crawl_id) REFERENCES crawl_history(id) ON DELETE CASCADE
    );
  `)
}

// Tạo cửa sổ chính
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    icon: process.platform === 'linux' ? join(__dirname, '../assets/icon.png') : undefined,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then((): void => {
  electronApp.setAppUserModelId('com.electron')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', (): void => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', (): void => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
