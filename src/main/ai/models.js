import path from 'path'
import fs from 'fs'
import os from 'os'
import { app } from 'electron'
import { modelDir, getModelPath, yieldEventLoop } from './utils.js'

// ============================================================
// КОНСТАНТЫ МОДЕЛЕЙ
// ============================================================

const MODEL_7B = 'qwen2.5-7b-instruct-q4_k_m-00001-of-00002.gguf';
const MODEL_3B = 'qwen2.5-3b-instruct-q4_k_m.gguf';

// 🔥 ПУТЬ ДЛЯ КЭША МОДЕЛИ (В userData)
const CACHE_DIR = path.join(app.getPath('userData'), 'cache');
const MODEL_CACHE_FILE = path.join(CACHE_DIR, 'model_3b_cache.bin');

// ============================================================
// СОСТОЯНИЕ
// ============================================================

let llama = null;
let loadedModel = null;
let LlamaChatSessionClass = null;
let isModelLoaded = false;
let isInitializing = false;
let currentModelType = null;

const optimalThreads = Math.max(2, Math.min(4, Math.floor(os.cpus().length / 2)));

// ============================================================
// ИНИЦИАЛИЗАЦИЯ LLAMA
// ============================================================

export async function initLlama() {
  if (llama) return llama;
  
  const nodeLlamaCpp = await import('node-llama-cpp');
  const getLlama = nodeLlamaCpp.getLlama;
  LlamaChatSessionClass = nodeLlamaCpp.LlamaChatSession;
  
  llama = await getLlama({
    gpu: false, // вместо "auto"
    logLevel: "warn"
  });
  
  return llama;
}

export function getLlamaChatSessionClass() {
  return LlamaChatSessionClass;
}

export function getOptimalThreads() {
  return optimalThreads;
}

// ============================================================
// 🔥 КЭШИРОВАНИЕ МОДЕЛИ В ФАЙЛ
// ============================================================

function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function saveModelToCache(modelData) {
  try {
    ensureCacheDir();
    fs.writeFileSync(MODEL_CACHE_FILE, modelData);
    console.log('[CACHE] модель сохранена в кэш');
    return true;
  } catch (error) {
    console.error('[CACHE] ошибка сохранения:', error);
    return false;
  }
}

function loadModelFromCache() {
  try {
    if (fs.existsSync(MODEL_CACHE_FILE)) {
      const data = fs.readFileSync(MODEL_CACHE_FILE);
      console.log('[CACHE] модель загружена из кэша');
      return data;
    }
  } catch (error) {
    console.error('[CACHE] ошибка загрузки из кэша:', error);
  }
  return null;
}

function clearModelCache() {
  try {
    if (fs.existsSync(MODEL_CACHE_FILE)) {
      fs.unlinkSync(MODEL_CACHE_FILE);
      console.log('[CACHE] кэш модели очищен');
      return true;
    }
  } catch (error) {
    console.error('[CACHE] ошибка очистки:', error);
  }
  return false;
}

// ============================================================
// ЗАГРУЗКА МОДЕЛИ (С КЭШИРОВАНИЕМ)
// ============================================================

export async function loadModel(modelType) {
  if (isModelLoaded && currentModelType === modelType) {
    console.log(`[MODEL] ${modelType} уже загружена (кэш)`);
    return { model: loadedModel };
  }

  if (isModelLoaded) {
    await unloadModel();
  }

  if (isInitializing) {
    console.log(`[MODEL] ${modelType} уже загружается, ждём...`);
    while (isInitializing) {
      await yieldEventLoop();
    }
    if (isModelLoaded && currentModelType === modelType) {
      return { model: loadedModel };
    }
  }

  isInitializing = true;
  try {
    const modelName = modelType === '7b' ? MODEL_7B : MODEL_3B;
    const modelPath = getModelPath(modelName);
    
    if (!fs.existsSync(modelPath)) {
      throw new Error(`Модель не найдена: ${modelPath}`);
    }

    console.log(`[MODEL] загрузка ${modelType}...`);
    const startTime = Date.now();

    const llamaInstance = await initLlama();
    
    // 🔥 ПЫТАЕМСЯ ЗАГРУЗИТЬ ИЗ КЭША
    const cachedData = loadModelFromCache();
    if (cachedData) {
      try {
        // Пробуем восстановить модель из кэша
        console.log('[MODEL] попытка восстановления из кэша...');
        loadedModel = await llamaInstance.loadModelFromBuffer(cachedData);
        if (loadedModel) {
          currentModelType = modelType;
          isModelLoaded = true;
          const loadTime = ((Date.now() - startTime) / 1000).toFixed(1);
          console.log(`[MODEL] ${modelType} восстановлена из кэша за ${loadTime} сек`);
          return { model: loadedModel };
        }
      } catch (e) {
        console.log('[MODEL] кэш повреждён, загружаем заново');
        clearModelCache();
      }
    }

    // 🔥 ЗАГРУЖАЕМ МОДЕЛЬ С ДИСКА
    loadedModel = await llamaInstance.loadModel({
      modelPath,
      gpuLayers: "max",
      useMlock: false,
      useMmap: true,
    });

    // 🔥 СОХРАНЯЕМ В КЭШ ДЛЯ БУДУЩИХ ЗАПУСКОВ
    try {
      const modelBuffer = await loadedModel.exportToBuffer();
      saveModelToCache(modelBuffer);
    } catch (e) {
      console.log('[MODEL] кэширование не поддерживается, пропускаем');
    }

    currentModelType = modelType;
    isModelLoaded = true;

    const loadTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[MODEL] ${modelType} загружена за ${loadTime} сек`);

    return { model: loadedModel };
  } catch (error) {
    console.error(`[MODEL] ошибка загрузки ${modelType}:`, error);
    isModelLoaded = false;
    throw error;
  } finally {
    isInitializing = false;
  }
}

// ============================================================
// ВЫГРУЗКА МОДЕЛИ
// ============================================================

export async function unloadModel() {
  if (!isModelLoaded) return;
  console.log(`[MODEL] выгрузка ${currentModelType}...`);
  const model = loadedModel;
  loadedModel = null;
  currentModelType = null;
  isModelLoaded = false;
  if (model && typeof model.dispose === 'function') {
    try {
      const result = model.dispose();
      if (result && typeof result.then === 'function') await result;
    } catch (e) {
      console.log('[MODEL] ошибка освобождения модели:', e.message);
    }
  }
  console.log('[MODEL] модель выгружена (кэш сохранён)');
}

// ============================================================
// ПЕРЕЗАГРУЗКА МОДЕЛИ (СБРОС КЭША)
// ============================================================

export async function reloadModel(modelType = '3b') {
  console.log('[MODEL] принудительная перезагрузка с очисткой кэша');
  clearModelCache();
  await unloadModel();
  return await loadModel(modelType);
}

// ============================================================
// ГЕТТЕРЫ
// ============================================================

export function getLoadedModel() {
  return loadedModel;
}

export function getCurrentModelType() {
  return currentModelType;
}

export function isModelReady() {
  return isModelLoaded;
}

// ============================================================
// ПРОВЕРКА ЗАГРУЗКИ МОДЕЛИ
// ============================================================

export async function ensureModelLoaded(modelType) {
  if (isModelLoaded && currentModelType === modelType) {
    return true;
  }
  await loadModel(modelType);
  return true;
}

// ============================================================
// ПРОВЕРКА НАЛИЧИЯ МОДЕЛИ НА ДИСКЕ
// ============================================================

export function checkModelExists(modelType) {
  const modelName = modelType === '7b' ? MODEL_7B : MODEL_3B;
  const exists = fs.existsSync(getModelPath(modelName));
  console.log(`[MODEL] ${modelName} ${exists ? 'найдена' : 'не найдена'}`);
  return exists;
}

// ============================================================
// ПРЕДЗАГРУЗКА МОДЕЛИ (ФОНОВАЯ)
// ============================================================

export async function preloadModel(modelType = '3b') {
  console.log(`[PRELOAD] фоновая загрузка ${modelType}...`);
  try {
    if (!checkModelExists(modelType)) {
      console.log(`[PRELOAD] модель ${modelType} не найдена, пропускаем`);
      return;
    }
    await loadModel(modelType);
    console.log(`[PRELOAD] ${modelType} успешно загружена в фоне`);
  } catch (error) {
    console.error(`[PRELOAD] ошибка при загрузке ${modelType}:`, error);
  }
}

// ============================================================
// ОЧИСТКА КЭША МОДЕЛИ (API)
// ============================================================

export function clearModelCacheFile() {
  return clearModelCache();
}