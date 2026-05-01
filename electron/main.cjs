const { app, BrowserWindow, Menu } = require("electron");
const path = require("path");

const ASPECT_RATIO = 16 / 9;
const WINDOW_WIDTH = 1440;
const WINDOW_HEIGHT = 810;
const MIN_WIDTH = 1280;
const MIN_HEIGHT = 720;

function createWindow() {
  const win = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    minWidth: MIN_WIDTH,
    minHeight: MIN_HEIGHT,
    backgroundColor: "#071017",
    title: "Poker Tracker",
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  Menu.setApplicationMenu(null);
  win.setAspectRatio(ASPECT_RATIO);
  win.once("ready-to-show", () => win.show());

  // Electron's aspect lock is not equally strict on every Windows setup,
  // so keep the content window snapped back to 16:9 after manual resize.
  win.on("resize", () => {
    if (win.isMaximized() || win.isFullScreen()) return;

    const [width, height] = win.getSize();
    const expectedHeight = Math.round(width / ASPECT_RATIO);
    if (Math.abs(expectedHeight - height) <= 1) return;

    win.setSize(width, Math.max(MIN_HEIGHT, expectedHeight));
  });

  win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
}

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
