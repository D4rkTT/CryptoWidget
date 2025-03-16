const { app, BrowserWindow, screen, globalShortcut, Menu, Tray, ipcMain } = require('electron/main')
const path = require('node:path')
const { createConfigFile, loadConfigFile, openConfigFile } = require("./configManager");
const DEBUG = process.argv[2] && process.argv[2] === '-d'

var mainWindow
var config

function createWindow (px, py) {
    var WIDTH = 380
    var HEIGHT = 160 * config.cryptoList.length
    mainWindow = new BrowserWindow({
        width: WIDTH,
        height: HEIGHT,
        alwaysOnTop: true,
        roundedCorners: true,
        frame: DEBUG,
        transparent:true,
        resizable:DEBUG,
        skipTaskbar: !DEBUG,
        x: px - WIDTH - 20,
        y: py - HEIGHT - 56,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false, 
            preload: path.join(__dirname, "preload.js")
        }
    })
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    mainWindow.setBackgroundMaterial("none")
    mainWindow.loadFile(path.join(__dirname, "src", "index.html"))
}

const toggleDevTools = ()=>{
    mainWindow.webContents.toggleDevTools()
}

const trayInit = () => {
    let tray = new Tray(path.join(__dirname, "cw.png"))
    let temp = [
      { label: 'Edit Config File', click: openConfigFile},
      { label: 'Exit', click: () => {app.exit(0)}},
    ]
    if(DEBUG) temp.push({label: 'Toggle DevTools', click: toggleDevTools})
    const contextMenu = Menu.buildFromTemplate(temp)
    tray.setToolTip('CryptoWidget Menu')
    tray.setContextMenu(contextMenu)
  }

app.whenReady().then(() => {
    createConfigFile()
    config = loadConfigFile()

    const displays = screen.getAllDisplays()
    const mainDisplay = displays.find((display) => {
        return display.bounds.x == 0 && display.bounds.y == 0
    })
      
    createWindow(mainDisplay.bounds.width, mainDisplay.bounds.height)
    trayInit()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow(mainDisplay.bounds.width, mainDisplay.bounds.height)
        }
    })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.on('ready', (event) => {
    mainWindow.webContents.send('symbols', config.cryptoList)
})

ipcMain.on('focus', (event, data) => {
    mainWindow.setIgnoreMouseEvents(!data, { forward: true })
})