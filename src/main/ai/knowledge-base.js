import fs from 'fs'
import path from 'path'
import { KNOWLEDGE_FILE, logError } from './utils.js'

// ============================================================
// СОСТОЯНИЕ
// ============================================================

let knowledgeBase = [];
let isLoaded = false;

// ============================================================
// ЗАГРУЗКА БАЗЫ ЗНАНИЙ
// ============================================================

export function loadKnowledgeBase() {
  try {
    if (fs.existsSync(KNOWLEDGE_FILE)) {
      const data = fs.readFileSync(KNOWLEDGE_FILE, 'utf-8');
      knowledgeBase = JSON.parse(data);
      console.log(`[KB] загружено ${knowledgeBase.length} документов`);
    } else {
      knowledgeBase = [];
      console.log('[KB] создана новая база знаний');
    }
    isLoaded = true;
    return knowledgeBase;
  } catch (error) {
    console.error('[KB] ошибка загрузки:', error);
    logError('Ошибка загрузки Knowledge Base', error);
    knowledgeBase = [];
    isLoaded = true;
    return knowledgeBase;
  }
}

// ============================================================
// СОХРАНЕНИЕ БАЗЫ ЗНАНИЙ
// ============================================================

export function saveKnowledgeBase() {
  try {
    fs.writeFileSync(KNOWLEDGE_FILE, JSON.stringify(knowledgeBase, null, 2));
    return true;
  } catch (error) {
    console.error('[KB] ошибка сохранения:', error);
    logError('Ошибка сохранения Knowledge Base', error);
    return false;
  }
}

// ============================================================
// ПОЛУЧЕНИЕ БАЗЫ ЗНАНИЙ
// ============================================================

export function getKnowledgeBase() {
  if (!isLoaded) {
    return loadKnowledgeBase();
  }
  return knowledgeBase;
}

// ============================================================
// ДОБАВЛЕНИЕ ДОКУМЕНТОВ
// ============================================================

export function addToKnowledgeBase(filePaths) {
  const items = [];
  const kb = getKnowledgeBase();
  
  for (const filePath of filePaths) {
    try {
      // 🔥 ПРОВЕРЯЕМ, СУЩЕСТВУЕТ ЛИ ФАЙЛ
      if (!fs.existsSync(filePath)) {
        console.error(`[KB] файл не найден: ${filePath}`);
        continue;
      }
      
      // 🔥 ЧИТАЕМ ФАЙЛ
      const content = fs.readFileSync(filePath, 'utf-8');
      const title = path.basename(filePath);
      
      // 🔥 ПРОВЕРЯЕМ, НЕТ ЛИ УЖЕ ТАКОГО ДОКУМЕНТА
      const exists = kb.some(item => item.path === filePath);
      if (exists) {
        console.log(`[KB] документ уже существует: ${title}`);
        continue;
      }
      
      // 🔥 СОЗДАЁМ НОВЫЙ ЭЛЕМЕНТ
      const item = {
        id: Date.now() + Math.random(),
        title: title,
        content: content.substring(0, 10000), // 🔥 ОГРАНИЧИВАЕМ РАЗМЕР
        path: filePath,
        added: new Date().toISOString(),
        size: content.length
      };
      
      items.push(item);
      knowledgeBase.push(item);
      
      console.log(`[KB] добавлен документ: ${title} (${content.length} символов)`);
      
    } catch (error) {
      console.error(`[KB] ошибка добавления ${filePath}:`, error);
      logError(`Ошибка добавления в KB: ${filePath}`, error);
    }
  }
  
  if (items.length > 0) {
    saveKnowledgeBase();
  }
  
  return items;
}

// ============================================================
// ПОИСК ПО БАЗЕ ЗНАНИЙ
// ============================================================

export function searchKnowledgeBase(query) {
  const kb = getKnowledgeBase();
  
  if (!query || !query.trim()) {
    return [];
  }
  
  const lowerQuery = query.toLowerCase().trim();
  const results = kb
    .filter(item => {
      const titleMatch = item.title.toLowerCase().includes(lowerQuery);
      const contentMatch = item.content.toLowerCase().includes(lowerQuery);
      return titleMatch || contentMatch;
    })
    .map(item => ({
      ...item,
      content: item.content.substring(0, 500) // 🔥 ОГРАНИЧИВАЕМ ДЛЯ ОТВЕТА
    }))
    .slice(0, 10); // 🔥 МАКСИМУМ 10 РЕЗУЛЬТАТОВ
  
  console.log(`[KB] поиск "${query}": найдено ${results.length} результатов`);
  return results;
}

// ============================================================
// УДАЛЕНИЕ ДОКУМЕНТА
// ============================================================

export function deleteFromKnowledgeBase(id) {
  const kb = getKnowledgeBase();
  const index = kb.findIndex(item => item.id === id);
  
  if (index === -1) {
    console.log(`[KB] документ с id ${id} не найден`);
    return false;
  }
  
  const title = kb[index].title;
  knowledgeBase.splice(index, 1);
  saveKnowledgeBase();
  
  console.log(`[KB] удалён документ: ${title}`);
  return true;
}

// ============================================================
// ОЧИСТКА ВСЕЙ БАЗЫ
// ============================================================

export function clearKnowledgeBase() {
  const count = knowledgeBase.length;
  knowledgeBase = [];
  saveKnowledgeBase();
  console.log(`[KB] очищено ${count} документов`);
  return count;
}

// ============================================================
// СТАТИСТИКА БАЗЫ ЗНАНИЙ
// ============================================================

export function getKnowledgeBaseStats() {
  const kb = getKnowledgeBase();
  const totalItems = kb.length;
  const totalSize = kb.reduce((sum, item) => sum + (item.size || item.content.length), 0);
  
  return {
    totalItems,
    totalSize,
    averageSize: totalItems > 0 ? Math.round(totalSize / totalItems) : 0
  };
}

// ============================================================
// ЭКСПОРТ ДЛЯ ВНЕШНЕГО ИСПОЛЬЗОВАНИЯ
// ============================================================

export default {
  loadKnowledgeBase,
  saveKnowledgeBase,
  getKnowledgeBase,
  addToKnowledgeBase,
  searchKnowledgeBase,
  deleteFromKnowledgeBase,
  clearKnowledgeBase,
  getKnowledgeBaseStats
};