// ============================================================
// ГЛАВНЫЙ ВХОД — ЭКСПОРТ ВСЕХ ФУНКЦИЙ
// ============================================================

// 🔥 ГЕНЕРАЦИЯ ОТВЕТОВ
export { 
  initAI, 
  generateChatResponse, 
  generateChatTitle, 
  abortGeneration, 
  resetChatSession 
} from './generator.js'

// 🔥 УПРАВЛЕНИЕ МОДЕЛЯМИ
export { 
  loadModel, 
  unloadModel, 
  ensureModelLoaded, 
  getCurrentModelType, 
  isModelReady,
  preloadModel,
  getLoadedModel,
  getLlamaChatSessionClass,
  getOptimalThreads
} from './models.js'

// 🔥 РОУТЕР (ВЫБОР МОДЕЛИ)
export { 
  routeRequest,
  needsComplexModel,
  getRouteReason
} from './router.js'

// 🔥 СТРИМИНГ
export { 
  startStream, 
  sendToken, 
  stopStream, 
  isStreamActive, 
  getStreamTokenCount,
  cleanupStreams,
  getStreamStats
} from './streaming.js'

// 🔥 УПРАВЛЕНИЕ ЧАТАМИ (СОХРАНЕНИЕ)
export { 
  loadChats, 
  saveChats, 
  getChats, 
  getCurrentSessionId, 
  setCurrentSessionId,
  getCurrentSession, 
  getSessionMessages, 
  addMessageToSession, 
  createNewChat,
  updateChatTitle, 
  deleteChat, 
  togglePinChat, 
  searchChats,
  clearChatHistory,
  getChatStats
} from './context-manager.js'

// 🔥 KNOWLEDGE BASE
export { 
  getKnowledgeBase, 
  addToKnowledgeBase, 
  searchKnowledgeBase, 
  deleteFromKnowledgeBase, 
  clearKnowledgeBase,
  getKnowledgeBaseStats
} from './knowledge-base.js'

// 🔥 ЭКСПОРТ В EXCEL
export { 
  exportTableToExcel,
  exportTableToExcelWithProgress,
  exportMultipleSheets
} from './export-excel.js'

// 🔥 ФАЙЛОВЫЙ ПРОЦЕССОР
export { 
  parseFileContent, 
  clearFileCache,
  getFileInfo
} from './file-processor.js'

// 🔥 ГЕНЕРАЦИЯ ФАЙЛОВ (КОД)
export { 
  generateFileContent,
  parseAIResponse
} from './code-generator.js'

// 🔥 ВЕБ-ПОИСК
export { 
  webSearch,
  clearWebCache,
  getWebCacheStats
} from './web-search.js'

// 🔥 OCR
export { 
  performOCR,
  performOCRWithLanguage,
  isOCRSupported
} from './ocr.js'

// 🔥 УТИЛИТЫ
export { 
  isDev,
  modelDir,
  CHATS_FILE,
  KNOWLEDGE_FILE,
  LOGS_DIR,
  ERROR_LOG,
  yieldEventLoop,
  getModelPath,
  decodeResponse,
  logError,
  clearUserData,
  fileExists,
  getFileSize,
  formatFileSize
} from './utils.js'

// ============================================================
// 🔥 АГЕНТНАЯ СИСТЕМА
// ============================================================

export {
  OrchestratorAgent,
  BaseAgent,
  ResearcherAgent,
  CoderAgent,
  AnalystAgent,
  WriterAgent,
  getAgents,
  getAgent,
  createAgent,
  deleteAgent,
  runAgentTask,
  orchestrateTask,
  getAgentsStats,
  loadAgents,
  saveAgents
} from './agents/index.js'

// ============================================================
// ВЕРСИЯ МОДУЛЯ
// ============================================================

export const VERSION = '1.0.0';
export const MODULE_NAME = 'Spark AI Core';

// ============================================================
// ИНФОРМАЦИЯ О МОДУЛЕ
// ============================================================

export function getModuleInfo() {
  return {
    name: MODULE_NAME,
    version: VERSION,
    exports: [
      'initAI',
      'generateChatResponse',
      'generateChatTitle',
      'abortGeneration',
      'resetChatSession',
      'loadModel',
      'unloadModel',
      'ensureModelLoaded',
      'preloadModel',
      'routeRequest',
      'startStream',
      'sendToken',
      'stopStream',
      'loadChats',
      'saveChats',
      'getChats',
      'createNewChat',
      'deleteChat',
      'togglePinChat',
      'searchChats',
      'getKnowledgeBase',
      'addToKnowledgeBase',
      'searchKnowledgeBase',
      'exportTableToExcel',
      'parseFileContent',
      'generateFileContent',
      'webSearch',
      'performOCR',
      'clearUserData',
      'getAgents',
      'getAgent',
      'createAgent',
      'deleteAgent',
      'runAgentTask',
      'orchestrateTask',
      'getAgentsStats'
    ]
  };
}