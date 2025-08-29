const { app, BrowserWindow, screen, globalShortcut, Menu, Tray, ipcMain } = require('electron/main')
const path = require('node:path')
const { createConfigFile, loadConfigFile, openConfigFile, updateConfigFile } = require("./configManager");
const DEBUG = process.argv[2] && process.argv[2] === '-d'

var mainWindow
var settingsWindow
var config
const WIDTH = 290

function createWindow (px, py) {
    var HEIGHT = 70 * config.cryptoList.length
    var x = 0
    var y = 0
    switch(config.position.type){
        case "top-right":
            x = px - WIDTH
            y = 10
            break
        case "bottom-right":
            x = px - WIDTH 
            y = py - HEIGHT - 50 
            break
        case "bottom-left":
            x = 0
            y = py - HEIGHT - 50
            break
        case "top-left":
            x = 0
            y = 10
            break
        default: // custom
            x = config.position.x
            y = config.position.y
            break
    }

    mainWindow = new BrowserWindow({
        width: WIDTH,
        height: HEIGHT,
        alwaysOnTop: config.alwaysOnTop,
        roundedCorners: true,
        frame: false,
        transparent:true,
        hasShadow: false,
        resizable:DEBUG,
        skipTaskbar: !DEBUG,
        x: x,
        y: y,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false, 
            preload: path.join(__dirname, "preload.js"),
            allowTransparency: true
        }
    })

    mainWindow.setAlwaysOnTop(config.alwaysOnTop, 'screen-saver');
    mainWindow.loadFile(path.join(__dirname, "src", "index.html"))

    mainWindow.on('moved', () => {
        config.position.x = mainWindow.getBounds().x;
        config.position.y = mainWindow.getBounds().y;
        config.position.type = "custom";
        updateConfigFile(config);
        if (settingsWindow) {
            settingsWindow.webContents.send('current-settings', config);
        }
    });
    
}

const toggleDevTools = ()=>{
    mainWindow.webContents.openDevTools({mode: 'detach'})
}

const createSettingsWindow = () => {
    if (settingsWindow) {
        settingsWindow.focus()
        return
    }

    settingsWindow = new BrowserWindow({
        width: 820,
        height: 510,
        resizable: false,
        title: 'CryptoWidget Settings',
        roundedCorners: true,
        frame: false,
        maximizable: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, "preload.js")
        }
    })

    settingsWindow.loadFile(path.join(__dirname, "src", "settings.html"))
    
    settingsWindow.on('closed', () => {
        settingsWindow = null
    })
    if(DEBUG) settingsWindow.webContents.openDevTools({mode: 'detach'})
}

const recreateMainWindow = () => {
    if (mainWindow) {
        mainWindow.close()
    }
    const displays = screen.getAllDisplays()
    const mainDisplay = displays.find((display) => {
        return display.bounds.x == 0 && display.bounds.y == 0
    })
    createWindow(mainDisplay.bounds.width, mainDisplay.bounds.height)
}

const trayInit = () => {
    let tray = new Tray(path.join(__dirname, "cw.png"))
    let temp = [
      { label: 'Settings', click: createSettingsWindow },
      { label: 'Edit Config File', click: openConfigFile},
      { label: 'Toggle Move', type: 'checkbox', click: (event) => {
        mainWindow.webContents.send('enableMove', event.checked)
        mainWindow.setIgnoreMouseEvents(!event.checked, { forward: true }) // Fix a bug where the window is not focused when the checkbox is checked due to "-webkit-app-region: drag"
      }},
      { label: 'Exit', click: () => {app.exit(0)}}
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
    if(DEBUG) data = true
    mainWindow.setIgnoreMouseEvents(!data, { forward: true })
})

ipcMain.on('get-settings', (event) => {
    event.reply('current-settings', config)
})

ipcMain.on('apply-settings', (event, newConfig) => {
    config = newConfig
    updateConfigFile(config)
    recreateMainWindow()
})

ipcMain.on('resize', (event, newHeight) => {
    mainWindow.setSize(WIDTH, newHeight, false)
})