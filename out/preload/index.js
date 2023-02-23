'use strict'
const electron = require('electron')
const preload = require('@electron-toolkit/preload')
const api = {}
if (process.contextIsolated) {
  try {
    electron.contextBridge.exposeInMainWorld('electron', preload.electronAPI)
    electron.contextBridge.exposeInMainWorld('api', api)
    electron.contextBridge.exposeInMainWorld('ipcRenderer', {
      invoke: electron.ipcRenderer.invoke.bind(electron.ipcRenderer),
      on: electron.ipcRenderer.on.bind(electron.ipcRenderer),
      removeAllListeners: electron.ipcRenderer.removeAllListeners.bind(
        electron.ipcRenderer,
      ),
    })
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = preload.electronAPI
  window.api = api
}
