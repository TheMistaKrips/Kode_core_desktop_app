process.on('exit', (code) => {
  require('fs').writeFileSync('crash.log', `exit code: ${code}\n`)
})

import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import si from 'systeminformation'
import fs from 'fs'
import path from 'path'
import icon from '../../resources/spark.png?asset'

// ============================================================
// ИМПОРТ ВСЕХ МОДУЛЕЙ AI
// ============================================================

import { 
  initAI, 
  generateChatResponse, 
  generateChatTitle, 
  abortGeneration, 
  resetChatSession,
  exportTableToExcel,
  addToKnowledgeBase,
  searchKnowledgeBase,
  getKnowledgeBase,
  loadChats,
  saveChats,
  getChats,
  getCurrentSessionId,
  setCurrentSessionId,
  createNewChat,
  addMessageToSession,
  updateChatTitle,
  deleteChat,
  togglePinChat,
  searchChats,
  getSessionMessages,
  getCurrentSession,
  unloadModel,
  preloadModel,
  clearUserData,
  getAgents,
  getAgent,
  createAgent,
  deleteAgent,
  runAgentTask,
  orchestrateTask,
  getAgentsStats,
  loadAgents,
  saveAgents,
  isModelReady,
  getCurrentModelType
} from './ai/index.js'

// ============================================================
// ОТКЛЮЧАЕМ АППАРАТНОЕ УСКОРЕНИЕ (фикс нативного краша на Windows)
// Важно: НЕ влияет на инференс модели (node-llama-cpp использует свой GPU-бэкенд).
// ============================================================

app.disableHardwareAcceleration()
console.log('[STARTUP] main модуль загружен, HW-ускорение отключено')

// ============================================================
// ГЛОБАЛЬНАЯ ОБРАБОТКА ОШИБОК (диагностика)
// ============================================================

process.on('uncaughtException', (error) => {
  console.error('[FATAL] Необработанная ошибка:', error)
  try {
    dialog.showErrorBox('Prismi: ошибка', error?.stack || String(error))
  } catch {}
})

process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Необработанный Promise:', reason)
})

// ============================================================
// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
// ============================================================

let mainWindow;

// ============================================================
// СОЗДАНИЕ ОКНА
// ============================================================

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false,
    title: 'Prismi',
    frame: false,
    transparent: false,
    resizable: true, 
    icon: icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  mainWindow.setMinimumSize(1400, 900)
  mainWindow.maximize()

  mainWindow.on('ready-to-show', () => {
    console.log('[WINDOW] окно готово к показу')
    mainWindow.show()
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

// ============================================================
// ПРИЛОЖЕНИЕ ГОТОВО
// ============================================================

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.prismi.app')
  app.on('browser-window-created', (_, window) => optimizer.watchWindowShortcuts(window))

  console.log('Запуск Prismi AI...')
  
  loadChats()
  loadAgents()
  
  await initAI()

  setTimeout(() => {
    console.log('[BACKGROUND] предзагрузка модели 3b...')
    preloadModel('3b').catch((err) => {
      console.error('[BACKGROUND] ошибка предзагрузки:', err)
    })
  }, 500)

  // ============================================================
  // IPC: СИСТЕМНАЯ СТАТИСТИКА
  // ============================================================

  let lastGpuLoad = 0
  let lastCpuTemp = 0
  let lastHeavyPollTime = 0
  let statsCache = null
  let statsCacheTime = 0

  ipcMain.handle('get-system-stats', async () => {
    try {
      const now = Date.now()
      
      if (statsCache && (now - statsCacheTime) < 500) {
        return statsCache
      }

      const [cpu, mem, battery] = await Promise.all([
        si.currentLoad(), 
        si.mem(), 
        si.battery()
      ])

      if (now - lastHeavyPollTime > 5000) {
        const [graphics, temp] = await Promise.all([
          si.graphics(), 
          si.cpuTemperature()
        ])
        
        lastGpuLoad = graphics.controllers.length > 0 && graphics.controllers[0].memoryUsed
          ? Math.round((graphics.controllers[0].memoryUsed / graphics.controllers[0].memoryTotal) * 100) || 0 
          : 0
        lastCpuTemp = temp.main > 0 ? Math.round(temp.main) : 0
        lastHeavyPollTime = now
      }
      
      statsCache = {
        cpuLoad: Math.round(cpu.currentLoad),
        ramLoad: Math.round((mem.active / mem.total) * 100),
        batteryPercent: battery.hasBattery ? battery.percent : 100,
        isCharging: battery.acConnected,
        gpuLoad: lastGpuLoad,
        cpuTemp: lastCpuTemp
      }
      statsCacheTime = now
      
      return statsCache
    } catch (error) {
      return { 
        cpuLoad: 0, 
        ramLoad: 0, 
        batteryPercent: 0, 
        isCharging: false, 
        gpuLoad: 0, 
        cpuTemp: 0 
      }
    }
  })

  // ============================================================
  // IPC: ПЕРЕЗАГРУЗКА МОДЕЛИ (СБРОС КЭША)
  // ============================================================

  ipcMain.handle('reload-model', async (_, modelType = '3b') => {
    try {
      const { reloadModel } = await import('./ai/models.js')
      await reloadModel(modelType)
      return { success: true, message: 'Модель перезагружена' }
    } catch (error) {
      console.error('[RELOAD] ошибка:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('preload-model', async (_, modelType = '3b') => {
    try {
      await preloadModel(modelType)
      return { success: true, message: 'Модель загружена' }
    } catch (error) {
      console.error('[PRELOAD] ошибка:', error)
      return { success: false, error: error.message }
    }
  })

  // ============================================================
  // IPC: ВЫБОР ФАЙЛОВ
  // ============================================================

  ipcMain.handle('select-files', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      title: 'Выберите файлы для контекста'
    })
    if (canceled) return []
    return filePaths.map(filePath => {
      const fileName = filePath.split(/[/\\]/).pop()
      return { path: filePath, name: fileName }
    })
  })

  // ============================================================
  // IPC: СОЗДАНИЕ ФАЙЛА
  // ============================================================

  ipcMain.handle('create-file', async (_, fileName, base64Content) => {
    console.log(`[FILE] сохранение: ${fileName}`)
    
    const { canceled, filePath } = await dialog.showSaveDialog({
      defaultPath: fileName,
      title: 'Сохранить файл',
      buttonLabel: 'Сохранить'
    })
    
    if (!canceled && filePath) {
      try {
        const dir = path.dirname(filePath)
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true })
        }
        
        const buffer = Buffer.from(base64Content, 'base64')
        fs.writeFileSync(filePath, buffer)
        
        console.log(`[FILE] сохранён: ${filePath} (${buffer.length} байт)`)
        return { success: true, path: filePath }
      } catch (error) {
        console.error('[FILE] ошибка:', error)
        return { success: false, error: error.message }
      }
    }
    return { success: false, cancelled: true }
  })

  // ============================================================
  // IPC: ЭКСПОРТ ТАБЛИЦЫ
  // ============================================================

  ipcMain.handle('export-table-to-excel', async (_, data, fileName) => {
    return await exportTableToExcel(data, fileName)
  })

  // ============================================================
  // IPC: KNOWLEDGE BASE
  // ============================================================

  ipcMain.handle('add-to-knowledge-base', async (_, files) => {
    const filePaths = files.map(f => f.path)
    const items = addToKnowledgeBase(filePaths)
    return { success: true, items }
  })

  ipcMain.handle('search-knowledge-base', async (_, query) => {
    return searchKnowledgeBase(query)
  })

  ipcMain.handle('get-knowledge-base', async () => {
    return getKnowledgeBase()
  })

  // ============================================================
  // IPC: ОТПРАВКА СООБЩЕНИЯ
  // ============================================================

  ipcMain.handle('send-chat-message', async (event, prompt, files, userName, aiName, chatId, chatHistory, webSearchEnabled) => {
    addMessageToSession(chatId, 'user', prompt, files)
    
    try {
      const response = await generateChatResponse(
        prompt, 
        files, 
        userName, 
        aiName, 
        chatId, 
        chatHistory, 
        webSearchEnabled,
        (token) => {
          event.sender.send('chat-token', {
            chatId: chatId,
            text: token
          })
        }
      )
      
      addMessageToSession(
        chatId, 
        'ai', 
        response.text, 
        response.files || [], 
        response.tableData || null, 
        response.webResults || []
      )
      
      return response
    } catch (error) {
      if (error.name === 'AbortError' || error.message?.includes('abort')) {
        return { 
          text: 'Пользователь отменил генерацию', 
          files: [], 
          tableData: null, 
          webResults: [], 
          cancelled: true 
        }
      }
      throw error
    }
  })
  
  // ============================================================
  // IPC: ГЕНЕРАЦИЯ ЗАГОЛОВКА
  // ============================================================

  ipcMain.handle('generate-chat-title', async (_, prompt, chatId) => {
    const title = await generateChatTitle(prompt)
    if (chatId) {
      updateChatTitle(chatId, title)
    }
    return title
  })
  
  // ============================================================
  // IPC: ОТМЕНА ГЕНЕРАЦИИ
  // ============================================================

  ipcMain.handle('abort-generation', () => {
    abortGeneration()
    return { success: true }
  })
  
  // ============================================================
  // IPC: СБРОС СЕССИИ
  // ============================================================

  ipcMain.handle('reset-chat', async () => await resetChatSession())

  // ============================================================
  // IPC: УПРАВЛЕНИЕ ЧАТАМИ
  // ============================================================

  ipcMain.handle('get-chats', () => {
    return getChats()
  })

  ipcMain.handle('get-current-session', () => {
    return getCurrentSession()
  })

  ipcMain.handle('create-new-chat', (_, title) => {
    return createNewChat(title)
  })

  ipcMain.handle('delete-chat', (_, chatId) => {
    return deleteChat(chatId)
  })

  ipcMain.handle('toggle-pin-chat', (_, chatId) => {
    return togglePinChat(chatId)
  })

  ipcMain.handle('update-chat-title', (_, chatId, title) => {
    return updateChatTitle(chatId, title)
  })

  ipcMain.handle('search-chats', (_, query) => {
    return searchChats(query)
  })

  // ============================================================
  // IPC: УПРАВЛЕНИЕ МОДЕЛЯМИ
  // ============================================================

  ipcMain.handle('is-model-ready', () => {
    return isModelReady()
  })

  ipcMain.handle('get-current-model-type', () => {
    return getCurrentModelType()
  })

  // ============================================================
  // IPC: ВЫГРУЗКА МОДЕЛИ
  // ============================================================

  ipcMain.handle('unload-model', async () => {
    await unloadModel()
    return { success: true }
  })

  // ============================================================
  // IPC: ОЧИСТКА КЭША
  // ============================================================

  ipcMain.handle('clear-cache', async () => {
    const result = await clearUserData()
    return { success: result }
  })

  // ============================================================
  // 🔥 IPC: АГЕНТНАЯ СИСТЕМА
  // ============================================================

  ipcMain.handle('get-agents', () => {
    return getAgents().map(a => a.toJSON())
  })

  ipcMain.handle('get-agent', (_, id) => {
    const agent = getAgent(id)
    return agent ? agent.toJSON() : null
  })

  ipcMain.handle('create-agent', (_, config) => {
    console.log('[IPC] создание агента:', config)
    const agent = createAgent(config)
    return agent.toJSON()
  })

  ipcMain.handle('delete-agent', (_, id) => {
    return deleteAgent(id)
  })

  ipcMain.handle('run-agent-task', async (_, agentId, task) => {
    return await runAgentTask(agentId, task)
  })

  ipcMain.handle('orchestrate-task', async (_, task) => {
    return await orchestrateTask(task)
  })

  ipcMain.handle('get-agents-stats', () => {
    return getAgentsStats()
  })

  // ============================================================
  // IPC: УПРАВЛЕНИЕ ОКНОМ
  // ============================================================

  ipcMain.handle('window-control', (_, action) => {
    if (!mainWindow) return
    if (action === 'minimize') mainWindow.minimize()
    if (action === 'maximize') {
      mainWindow.isMaximized() 
        ? (mainWindow.unmaximize(), mainWindow.setSize(1400, 900), mainWindow.center()) 
        : mainWindow.maximize()
    }
    if (action === 'close') mainWindow.close()
  })

  ipcMain.handle('finish-boot', () => {
    if (mainWindow && mainWindow.isMaximized()) {
      mainWindow.unmaximize()
      mainWindow.setSize(1400, 900)
      mainWindow.center()
    }
  })

  ipcMain.handle('relaunch-app', () => { 
    app.relaunch()
    app.exit(0) 
  })

  try {
    createWindow()
  } catch (error) {
    console.error('[FATAL] Ошибка создания окна:', error)
    try { dialog.showErrorBox('Prismi: ошибка окна', error?.stack || String(error)) } catch {}
  }
  
  app.on('activate', function () { 
    if (BrowserWindow.getAllWindows().length === 0) createWindow() 
  })
}).catch((error) => {
  console.error('[FATAL] Ошибка запуска приложения:', error)
  try { dialog.showErrorBox('Prismi: ошибка запуска', error?.stack || String(error)) } catch {}
})

app.on('window-all-closed', () => { 
  if (process.platform !== 'darwin') app.quit() 
})