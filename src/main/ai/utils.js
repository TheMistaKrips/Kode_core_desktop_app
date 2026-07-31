import path from 'path'
import fs from 'fs'
import { app } from 'electron'

// ============================================================
// ПУТИ И КОНСТАНТЫ
// ============================================================

// 🔥 РЕЖИМ РАЗРАБОТКИ
export const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// 🔥 ПУТЬ К ПАПКЕ С МОДЕЛЯМИ
export const modelDir = isDev 
  ? path.join(process.cwd(), 'models') 
  : path.join(process.resourcesPath, 'models');

// 🔥 ПУТЬ К ФАЙЛУ С ЧАТАМИ
export const CHATS_FILE = path.join(app.getPath('userData'), 'chats.json');

// 🔥 ПУТЬ К ФАЙЛУ С KNOWLEDGE BASE
export const KNOWLEDGE_FILE = path.join(app.getPath('userData'), 'knowledge_base.json');

// 🔥 ПУТЬ К ЛОГАМ
export const LOGS_DIR = path.join(app.getPath('userData'), 'logs');
export const ERROR_LOG = path.join(LOGS_DIR, 'error.log');

// ============================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

/**
 * Задержка для освобождения event loop
 */
export const yieldEventLoop = () => new Promise(resolve => setTimeout(resolve, 10));

/**
 * Получить полный путь к модели по имени
 * @param {string} modelName - имя файла модели
 * @returns {string} - полный путь
 */
export function getModelPath(modelName) {
  return path.join(modelDir, modelName);
}

// ============================================================
// ДЕКОДИРОВАНИЕ ОТВЕТА
// ============================================================

/**
 * Декодирует ответ из Buffer/ArrayBuffer в строку
 * @param {any} response - ответ от модели
 * @returns {string} - декодированная строка
 */
export function decodeResponse(response) {
  // 🔥 ЕСЛИ Buffer
  if (Buffer.isBuffer(response)) {
    return response.toString('utf-8');
  }
  
  // 🔥 ЕСЛИ Uint8Array
  if (response instanceof Uint8Array) {
    return new TextDecoder('utf-8').decode(response);
  }
  
  // 🔥 ЕСЛИ СТРОКА
  if (typeof response === 'string') {
    return response;
  }
  
  // 🔥 ЕСЛИ ОБЪЕКТ
  if (response && typeof response === 'object') {
    if (response.text) return String(response.text);
    if (response.response) return String(response.response);
    if (response.content) return String(response.content);
    return JSON.stringify(response);
  }
  
  // 🔥 ЕСЛИ ВСЁ ОСТАЛЬНОЕ
  return String(response);
}

// ============================================================
// ЛОГГИРОВАНИЕ ОШИБОК
// ============================================================

/**
 * Записывает ошибку в лог-файл
 * @param {string} message - сообщение об ошибке
 * @param {Error} error - объект ошибки
 */
export function logError(message, error) {
  try {
    // Создаём папку для логов, если её нет
    if (!fs.existsSync(LOGS_DIR)) {
      fs.mkdirSync(LOGS_DIR, { recursive: true });
    }
    
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n${error?.stack || error}\n---\n`;
    
    fs.appendFileSync(ERROR_LOG, logEntry);
  } catch (e) {
    console.error('[LOG] ошибка записи в лог:', e);
  }
}

// ============================================================
// РАБОТА С КЭШЕМ
// ============================================================

/**
 * Очищает папку userData (кеш)
 * @returns {Promise<boolean>} - успешность
 */
export async function clearUserData() {
  try {
    const userData = app.getPath('userData');
    const files = fs.readdirSync(userData);
    
    for (const file of files) {
      const filePath = path.join(userData, file);
      if (fs.statSync(filePath).isFile()) {
        fs.unlinkSync(filePath);
      } else {
        fs.rmSync(filePath, { recursive: true, force: true });
      }
    }
    
    console.log('[CACHE] кеш очищен');
    return true;
  } catch (error) {
    console.error('[CACHE] ошибка очистки:', error);
    return false;
  }
}

// ============================================================
// ПРОВЕРКА НАЛИЧИЯ ФАЙЛОВ
// ============================================================

/**
 * Проверяет, существует ли файл
 * @param {string} filePath - путь к файлу
 * @returns {boolean} - существует ли файл
 */
export function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

/**
 * Получает размер файла в байтах
 * @param {string} filePath - путь к файлу
 * @returns {number} - размер в байтах или 0
 */
export function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

// ============================================================
// ФОРМАТИРОВАНИЕ РАЗМЕРА
// ============================================================

/**
 * Форматирует размер в байтах в читаемый вид
 * @param {number} bytes - размер в байтах
 * @returns {string} - отформатированный размер
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = (bytes / Math.pow(k, i)).toFixed(2);
  
  return `${size} ${units[i]}`;
}