// ============================================================
// СТРИМИНГ — УПРАВЛЕНИЕ ПОТОКОВОЙ ПЕРЕДАЧЕЙ ТОКЕНОВ
// ============================================================

// 🔥 ХРАНИЛИЩЕ АКТИВНЫХ СТРИМОВ
// Ключ: chatId (строка)
// Значение: { onToken: function, active: boolean }
const activeStreams = new Map();

// ============================================================
// ЗАПУСК СТРИМИНГА
// ============================================================

/**
 * Запускает стриминг для указанного чата
 * @param {string} chatId - ID чата
 * @param {function} onToken - колбэк, вызываемый при получении токена
 * @returns {boolean} - успешность запуска
 */
export function startStream(chatId, onToken) {
  if (!chatId || typeof onToken !== 'function') {
    console.error('[STREAM] ошибка: неверные параметры');
    return false;
  }

  // 🔥 ОСТАНАВЛИВАЕМ ПРЕДЫДУЩИЙ СТРИМ, ЕСЛИ БЫЛ
  if (activeStreams.has(chatId)) {
    console.log(`[STREAM] остановка предыдущего стрима для ${chatId}`);
    stopStream(chatId);
  }

  // 🔥 СОЗДАЁМ НОВЫЙ СТРИМ
  activeStreams.set(chatId, {
    onToken: onToken,
    active: true,
    startTime: Date.now(),
    tokenCount: 0
  });

  console.log(`[STREAM] запущен для ${chatId}`);
  return true;
}

// ============================================================
// ОТПРАВКА ТОКЕНА
// ============================================================

/**
 * Отправляет токен в активный стрим
 * @param {string} chatId - ID чата
 * @param {string} token - текст токена
 * @returns {boolean} - успешность отправки
 */
export function sendToken(chatId, token) {
  const stream = activeStreams.get(chatId);
  
  if (!stream || !stream.active) {
    return false;
  }

  if (!token || token.length === 0) {
    return false;
  }

  // 🔥 ВЫЗЫВАЕМ КОЛБЭК
  try {
    stream.onToken(token);
    stream.tokenCount++;
    return true;
  } catch (error) {
    console.error(`[STREAM] ошибка отправки токена:`, error);
    return false;
  }
}

// ============================================================
// ОСТАНОВКА СТРИМИНГА
// ============================================================

/**
 * Останавливает стриминг для указанного чата
 * @param {string} chatId - ID чата
 * @returns {boolean} - успешность остановки
 */
export function stopStream(chatId) {
  const stream = activeStreams.get(chatId);
  
  if (!stream) {
    return false;
  }

  stream.active = false;
  activeStreams.delete(chatId);
  
  const duration = ((Date.now() - stream.startTime) / 1000).toFixed(1);
  console.log(`[STREAM] остановлен для ${chatId} (${stream.tokenCount} токенов, ${duration} сек)`);
  
  return true;
}

// ============================================================
// ПРОВЕРКА АКТИВНОСТИ СТРИМИНГА
// ============================================================

/**
 * Проверяет, активен ли стриминг для чата
 * @param {string} chatId - ID чата
 * @returns {boolean} - активен ли стриминг
 */
export function isStreamActive(chatId) {
  const stream = activeStreams.get(chatId);
  return stream && stream.active;
}

/**
 * Получает количество отправленных токенов для чата
 * @param {string} chatId - ID чата
 * @returns {number} - количество токенов
 */
export function getStreamTokenCount(chatId) {
  const stream = activeStreams.get(chatId);
  return stream ? stream.tokenCount : 0;
}

// ============================================================
// ОЧИСТКА ВСЕХ СТРИМОВ
// ============================================================

/**
 * Останавливает все активные стримы
 * @returns {number} - количество остановленных стримов
 */
export function cleanupStreams() {
  const count = activeStreams.size;
  
  for (const [chatId, stream] of activeStreams) {
    stream.active = false;
    console.log(`[STREAM] принудительная остановка ${chatId}`);
  }
  
  activeStreams.clear();
  console.log(`[STREAM] очищено ${count} стримов`);
  
  return count;
}

// ============================================================
// ПОЛУЧЕНИЕ СТАТИСТИКИ
// ============================================================

/**
 * Получает статистику по всем активным стримам
 * @returns {object} - статистика
 */
export function getStreamStats() {
  const stats = {
    activeCount: activeStreams.size,
    streams: []
  };

  for (const [chatId, stream] of activeStreams) {
    stats.streams.push({
      chatId: chatId,
      tokenCount: stream.tokenCount,
      duration: ((Date.now() - stream.startTime) / 1000).toFixed(1)
    });
  }

  return stats;
}

// ============================================================
// ЭКСПОРТ ДЛЯ ВНЕШНЕГО ИСПОЛЬЗОВАНИЯ
// ============================================================

export default {
  startStream,
  sendToken,
  stopStream,
  isStreamActive,
  getStreamTokenCount,
  cleanupStreams,
  getStreamStats
};