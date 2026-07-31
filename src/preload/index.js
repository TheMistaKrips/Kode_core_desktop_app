import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  // Система
  getSystemStats: () => ipcRenderer.invoke('get-system-stats'),
  
  // Файлы
  selectFiles: () => ipcRenderer.invoke('select-files'),
  createFile: (fileName, base64Content) => 
    ipcRenderer.invoke('create-file', fileName, base64Content),
  createMultipleFiles: (files) => 
    ipcRenderer.invoke('create-multiple-files', files),
  
  // Чат
  sendChatMessage: (prompt, files, userName, aiName, chatId, chatHistory, webSearchEnabled) => 
    ipcRenderer.invoke('send-chat-message', prompt, files, userName, aiName, chatId, chatHistory, webSearchEnabled),
  generateChatTitle: (prompt, chatId) => 
    ipcRenderer.invoke('generate-chat-title', prompt, chatId),
  abortGeneration: () => 
    ipcRenderer.invoke('abort-generation'),
  resetChat: () => 
    ipcRenderer.invoke('reset-chat'),
  
  // Чаты
  getChats: () => ipcRenderer.invoke('get-chats'),
  getCurrentSession: () => ipcRenderer.invoke('get-current-session'),
  createNewChat: (title) => ipcRenderer.invoke('create-new-chat', title),
  deleteChat: (chatId) => ipcRenderer.invoke('delete-chat', chatId),
  togglePinChat: (chatId) => ipcRenderer.invoke('toggle-pin-chat', chatId),
  updateChatTitle: (chatId, title) => ipcRenderer.invoke('update-chat-title', chatId, title),
  searchChats: (query) => ipcRenderer.invoke('search-chats', query),
  
  // Экспорт
  exportTableToExcel: (data, fileName) => 
    ipcRenderer.invoke('export-table-to-excel', data, fileName),
  
  // Knowledge Base
  addToKnowledgeBase: (files) => 
    ipcRenderer.invoke('add-to-knowledge-base', files),
  searchKnowledgeBase: (query) => 
    ipcRenderer.invoke('search-knowledge-base', query),
  getKnowledgeBase: () => 
    ipcRenderer.invoke('get-knowledge-base'),
  
  // Окно
  windowControl: (action) => 
    ipcRenderer.invoke('window-control', action),
  finishBoot: () => 
    ipcRenderer.invoke('finish-boot'),
  relaunchApp: () => 
    ipcRenderer.invoke('relaunch-app'),
  
  // Модели
  unloadModel: () => 
    ipcRenderer.invoke('unload-model'),
  isModelReady: () => 
    ipcRenderer.invoke('is-model-ready'),
  getCurrentModelType: () => 
    ipcRenderer.invoke('get-current-model-type'),
  
  // Кэш
  clearCache: () => 
    ipcRenderer.invoke('clear-cache'),
  
  // Стриминг
  onChatToken: (callback) => {
    ipcRenderer.on('chat-token', (event, data) => callback(data))
  },
  removeChatTokenListener: () => {
    ipcRenderer.removeAllListeners('chat-token')
  },

  // 🔥 АГЕНТЫ
  getAgents: () => ipcRenderer.invoke('get-agents'),
  getAgent: (id) => ipcRenderer.invoke('get-agent', id),
  createAgent: (config) => ipcRenderer.invoke('create-agent', config),
  deleteAgent: (id) => ipcRenderer.invoke('delete-agent', id),
  runAgentTask: (agentId, task) => ipcRenderer.invoke('run-agent-task', agentId, task),
  orchestrateTask: (task) => ipcRenderer.invoke('orchestrate-task', task),
  getAgentsStats: () => ipcRenderer.invoke('get-agents-stats')
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}