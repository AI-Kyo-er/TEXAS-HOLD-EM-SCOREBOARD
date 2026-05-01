const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("pokerWindow", {
  minimize: () => ipcRenderer.invoke("window:minimize"),
  close: () => ipcRenderer.invoke("window:close")
});
