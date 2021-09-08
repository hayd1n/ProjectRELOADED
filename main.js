/*
 *   Copyright (c) 2021 CRT_HAO 張皓鈞
 *   All rights reserved.
 *   CISH Robotics Team
 */

// Modules to control application life and create native browser window
const {app, BrowserWindow, Menu, Tray} = require('electron');
const path = require('path');

require('@electron/remote/main').initialize();

let mainWindow;

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    show: false,
    width: 800,
    height: 600,
    fullscreenable: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: "#3F51B5",
      symbolColor: "#FFFFFF"
    },
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'src/js/preload.js')
    }
  });

  mainWindow.webContents.on('new-window', function(e, url) {
    e.preventDefault();
    require('electron').shell.openExternal(url);
  });

  // and load the index.html of the app.
  mainWindow.loadFile('src/index.html');

  
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
  
  // Open the DevTools.
  mainWindow.webContents.openDevTools({ mode: 'detach' });

  mainWindow.on('closed', (event) => {
      mainWindow = null;
  });
  mainWindow.on('close', (event) => {
      event.preventDefault();
      mainWindow.hide();
      mainWindow.setSkipTaskbar(true);
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createTray();
  createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

let tray;
function createTray() {
  tray = new Tray(path.join(__dirname, './assets/icon-tray-black.png'));
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '打開',
      click: () => {
        mainWindow.show();
        mainWindow.setSkipTaskbar(false);
      }
    },
    {
      type: 'separator',
    },
    {
      label: '退出 ProjectRELOADED',
      click: () => {
        app.quit();
      }
    }
  ]);
  tray.setToolTip('ProjectRELOADED');
  tray.setContextMenu(contextMenu);
}