const { app, BrowserWindow, Menu, ipcMain } = require("electron");
const path = require("path");

const APP_ASPECT_RATIO = 16 / 9;
const TITLEBAR_HEIGHT = 40;
const WINDOW_WIDTH = 1440;
const WINDOW_HEIGHT = 810 + TITLEBAR_HEIGHT;
const MIN_WIDTH = 1280;
const MIN_HEIGHT = 720 + TITLEBAR_HEIGHT;

function createWindow() {
  const win = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    useContentSize: true,
    minWidth: MIN_WIDTH,
    minHeight: MIN_HEIGHT,
    frame: false,
    maximizable: false,
    backgroundColor: "#071017",
    title: "Poker Tracker",
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  Menu.setApplicationMenu(null);
  win.once("ready-to-show", () => win.show());

  // Electron's aspect lock is not equally strict on every Windows setup,
  // so keep the content window snapped back to 16:9 after manual resize.
  win.on("resize", () => {
    if (win.isMaximized() || win.isFullScreen()) return;

    const [width, height] = win.getContentSize();
    const expectedHeight = TITLEBAR_HEIGHT + Math.round(width / APP_ASPECT_RATIO);
    if (Math.abs(expectedHeight - height) <= 1) return;

    win.setContentSize(width, Math.max(MIN_HEIGHT, expectedHeight));
  });

  win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
}

ipcMain.handle("window:minimize", (event) => {
  BrowserWindow.fromWebContents(event.sender)?.minimize();
});

ipcMain.handle("window:close", (event) => {
  BrowserWindow.fromWebContents(event.sender)?.close();
});

const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
  app.quit();
} else {
  app.whenReady().then(createWindow);

  app.on("second-instance", () => {
    const win = BrowserWindow.getAllWindows()[0];
    if (!win) return;
    if (win.isMinimized()) win.restore();
    win.focus();
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
