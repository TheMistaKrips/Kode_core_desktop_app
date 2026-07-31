import fs from 'fs'
import { CHATS_FILE } from './utils.js'

// ============================================================
// СОСТОЯНИЕ
// ============================================================

let chatSessions = [];
let currentSessionId = null;
let isLoaded = false;

// ============================================================
// ЗАГРУЗКА ЧАТОВ
// ============================================================

export function loadChats() {
  try {
    if (fs.existsSync(CHATS_FILE)) {
      const data = fs.readFileSync(CHATS_FILE, 'utf-8');
      chatSessions = JSON.parse(data);
      
      // 🔥 ПРОВЕРЯЕМ, ЕСТЬ ЛИ ХОТЯ БЫ ОДИН ЧАТ
      if (chatSessions.length > 0) {
        currentSessionId = chatSessions[0].id;
      } else {
        // 🔥 СОЗДАЁМ ДЕФОЛТНЫЙ ЧАТ
        chatSessions = [createDefaultChat()];
        currentSessionId = chatSessions[0].id;
        saveChats();
      }
    } else {
      // 🔥 ФАЙЛА НЕТ — СОЗДАЁМ
      chatSessions = [createDefaultChat()];
      currentSessionId = chatSessions[0].id;
      saveChats();
    }
    
    isLoaded = true;
    console.log(`[CHATS] загружено ${chatSessions.length} чатов`);
    return chatSessions;
  } catch (error) {
    console.error('[CHATS] ошибка загрузки:', error);
    chatSessions = [createDefaultChat()];
    currentSessionId = chatSessions[0].id;
    isLoaded = true;
    return chatSessions;
  }
}

// ============================================================
// СОЗДАНИЕ ДЕФОЛТНОГО ЧАТА
// ============================================================

function createDefaultChat() {
  return {
    id: Date.now() + Math.random(),
    title: 'New chat',
    messages: [],
    pinned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

// ============================================================
// СОХРАНЕНИЕ ЧАТОВ
// ============================================================

export function saveChats() {
  try {
    fs.writeFileSync(CHATS_FILE, JSON.stringify(chatSessions, null, 2));
    return true;
  } catch (error) {
    console.error('[CHATS] ошибка сохранения:', error);
    return false;
  }
}

// ============================================================
// ПОЛУЧЕНИЕ ЧАТОВ
// ============================================================

export function getChats() {
  if (!isLoaded) {
    return loadChats();
  }
  return chatSessions;
}

export function getCurrentSessionId() {
  return currentSessionId;
}

export function setCurrentSessionId(id) {
  if (chatSessions.some(s => s.id === id)) {
    currentSessionId = id;
    saveChats();
    return true;
  }
  return false;
}

export function getCurrentSession() {
  const session = chatSessions.find(s => s.id === currentSessionId);
  return session || chatSessions[0] || null;
}

export function getSessionMessages(sessionId) {
  const session = chatSessions.find(s => s.id === sessionId);
  return session ? session.messages : [];
}

// ============================================================
// ДОБАВЛЕНИЕ СООБЩЕНИЙ
// ============================================================

export function addMessageToSession(sessionId, role, text, files = [], tableData = null, webResults = []) {
  const session = chatSessions.find(s => s.id === sessionId);
  if (!session) {
    console.error(`[CHATS] сессия ${sessionId} не найдена`);
    return false;
  }
  
  // 🔥 ДОБАВЛЯЕМ СООБЩЕНИЕ
  session.messages.push({
    role, // 'user' или 'ai'
    text,
    files: files || [],
    tableData: tableData || null,
    webResults: webResults || [],
    timestamp: new Date().toISOString()
  });
  
  // 🔥 ОБНОВЛЯЕМ ДАТУ
  session.updatedAt = new Date().toISOString();
  
  // 🔥 ЕСЛИ ЭТО ПЕРВОЕ СООБЩЕНИЕ ПОЛЬЗОВАТЕЛЯ И ЗАГОЛОВОК "New chat"
  if (role === 'user' && session.title === 'New chat' && session.messages.length === 1) {
    // Заголовок будет сгенерирован позже через generateChatTitle
  }
  
  saveChats();
  return true;
}

// ============================================================
// УПРАВЛЕНИЕ ЧАТАМИ
// ============================================================

export function createNewChat(title = 'New chat') {
  const newChat = {
    id: Date.now() + Math.random(),
    title: title,
    messages: [],
    pinned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  chatSessions.unshift(newChat); // 🔥 В НАЧАЛО СПИСКА
  currentSessionId = newChat.id;
  saveChats();
  
  console.log(`[CHATS] создан новый чат: ${title}`);
  return newChat;
}

export function updateChatTitle(sessionId, title) {
  const session = chatSessions.find(s => s.id === sessionId);
  if (!session) return false;
  
  session.title = title.trim() || 'New chat';
  session.updatedAt = new Date().toISOString();
  saveChats();
  
  return true;
}

export function deleteChat(sessionId) {
  const index = chatSessions.findIndex(s => s.id === sessionId);
  if (index === -1) return false;
  
  chatSessions.splice(index, 1);
  
  // 🔥 ЕСЛИ ЧАТОВ НЕ ОСТАЛОСЬ — СОЗДАЁМ ДЕФОЛТНЫЙ
  if (chatSessions.length === 0) {
    const newChat = createDefaultChat();
    chatSessions.push(newChat);
    currentSessionId = newChat.id;
  } else if (currentSessionId === sessionId) {
    // 🔥 ЕСЛИ УДАЛИЛИ ТЕКУЩИЙ ЧАТ — ПЕРЕКЛЮЧАЕМСЯ НА ПЕРВЫЙ
    currentSessionId = chatSessions[0].id;
  }
  
  saveChats();
  console.log(`[CHATS] удалён чат ${sessionId}`);
  return true;
}

export function togglePinChat(sessionId) {
  const session = chatSessions.find(s => s.id === sessionId);
  if (!session) return false;
  
  session.pinned = !session.pinned;
  session.updatedAt = new Date().toISOString();
  saveChats();
  
  return true;
}

// ============================================================
// ПОИСК ПО ЧАТАМ
// ============================================================

export function searchChats(query) {
  if (!query || !query.trim()) {
    return chatSessions;
  }
  
  const lowerQuery = query.toLowerCase().trim();
  const results = chatSessions.filter(session => {
    // 🔥 ПОИСК ПО ЗАГОЛОВКУ
    const titleMatch = session.title.toLowerCase().includes(lowerQuery);
    
    // 🔥 ПОИСК ПО СООБЩЕНИЯМ
    const messageMatch = session.messages.some(msg => 
      msg.text.toLowerCase().includes(lowerQuery)
    );
    
    return titleMatch || messageMatch;
  });
  
  return results;
}

// ============================================================
// ОЧИСТКА ИСТОРИИ
// ============================================================

export function clearChatHistory(sessionId) {
  const session = chatSessions.find(s => s.id === sessionId);
  if (!session) return false;
  
  session.messages = [];
  session.updatedAt = new Date().toISOString();
  saveChats();
  
  console.log(`[CHATS] очищена история чата ${sessionId}`);
  return true;
}

// ============================================================
// ПОЛУЧЕНИЕ СТАТИСТИКИ
// ============================================================

export function getChatStats() {
  const totalMessages = chatSessions.reduce((sum, s) => sum + s.messages.length, 0);
  const totalChats = chatSessions.length;
  const pinnedChats = chatSessions.filter(s => s.pinned).length;
  
  return {
    totalChats,
    totalMessages,
    pinnedChats,
    currentSessionId
  };
}

// ============================================================
// ЭКСПОРТ КОНСТАНТ
// ============================================================

export const DEFAULT_CHAT_TITLE = 'New chat';