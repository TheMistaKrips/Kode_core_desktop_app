import https from 'https'

// ============================================================
// КЭШ ВЕБ-ПОИСКА
// ============================================================

const webCache = new Map();
const WEB_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 часа

// ============================================================
// ОСНОВНАЯ ФУНКЦИЯ ПОИСКА
// ============================================================

export async function webSearch(query) {
  // 🔥 1. ПРОВЕРЯЕМ КЭШ
  const cacheKey = query.toLowerCase().trim();
  if (webCache.has(cacheKey)) {
    const cached = webCache.get(cacheKey);
    if (Date.now() - cached.timestamp < WEB_CACHE_TTL) {
      console.log(`[SEARCH] из кэша: "${query}"`);
      return cached.results;
    }
    webCache.delete(cacheKey);
  }

  // 🔥 2. ПРОВЕРЯЕМ ИНТЕРНЕТ-СОЕДИНЕНИЕ
  const isOnline = await checkInternetConnection();
  if (!isOnline) {
    console.log('[SEARCH] нет интернета');
    return [{
      title: 'Нет подключения к интернету',
      snippet: 'Проверьте подключение и попробуйте снова.',
      url: ''
    }];
  }

  // 🔥 3. ВЫПОЛНЯЕМ ПОИСК
  return new Promise((resolve) => {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://api.duckduckgo.com/?q=${encodedQuery}&format=json&no_html=1&skip_disambig=1&t=prismi_app`;
    
    console.log(`[SEARCH] запрос: "${query}"`);
    
    const req = https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const results = [];
          
          // 🔥 3.1. ОСНОВНОЙ ОТВЕТ (Instant Answer)
          if (json.AbstractText) {
            results.push({
              title: json.Heading || json.AbstractSource || 'Результат поиска',
              snippet: json.AbstractText.substring(0, 500),
              url: json.AbstractURL || `https://duckduckgo.com/?q=${encodedQuery}`
            });
          }
          
          // 🔥 3.2. СВЯЗАННЫЕ ТЕМЫ (Related Topics)
          if (json.RelatedTopics && json.RelatedTopics.length > 0) {
            json.RelatedTopics.slice(0, 4).forEach(topic => {
              if (topic.Text && topic.Text.length > 10) {
                const titleMatch = topic.Text.match(/^(.+?) - /);
                const title = titleMatch ? titleMatch[1] : topic.Text.substring(0, 60);
                results.push({
                  title: title,
                  snippet: topic.Text.substring(0, 300),
                  url: topic.FirstURL || `https://duckduckgo.com/?q=${encodedQuery}`
                });
              }
            });
          }
          
          // 🔥 3.3. ЕСЛИ РЕЗУЛЬТАТОВ НЕТ — ИНФОРМАЦИЯ
          if (results.length === 0) {
            const date = new Date();
            results.push({
              title: `Результаты поиска: "${query}"`,
              snippet: `Поиск выполнен ${date.toLocaleDateString()}. Попробуйте уточнить запрос.`,
              url: `https://duckduckgo.com/?q=${encodedQuery}`
            });
          }
          
          // 🔥 3.4. СОХРАНЯЕМ В КЭШ
          webCache.set(cacheKey, {
            timestamp: Date.now(),
            results: results
          });
          
          console.log(`[SEARCH] найдено ${results.length} результатов`);
          resolve(results);
          
        } catch (error) {
          console.error('[SEARCH] ошибка парсинга:', error);
          resolve([]);
        }
      });
    });

    // 🔥 3.5. ОБРАБОТКА ОШИБОК ЗАПРОСА
    req.on('error', (error) => {
      console.error('[SEARCH] ошибка запроса:', error);
      resolve([{
        title: 'Ошибка поиска',
        snippet: 'Не удалось выполнить поиск. Попробуйте позже.',
        url: ''
      }]);
    });

    // 🔥 3.6. ТАЙМАУТ 10 СЕКУНД
    req.setTimeout(10000, () => {
      req.destroy();
      console.log('[SEARCH] таймаут');
      resolve([{
        title: 'Превышено время ожидания',
        snippet: 'Поиск занял слишком много времени. Попробуйте позже.',
        url: ''
      }]);
    });
  });
}

// ============================================================
// ПРОВЕРКА ИНТЕРНЕТ-СОЕДИНЕНИЯ
// ============================================================

function checkInternetConnection() {
  return new Promise((resolve) => {
    const req = https.get('https://duckduckgo.com', (res) => {
      resolve(res.statusCode === 200);
    });
    
    req.on('error', () => {
      resolve(false);
    });
    
    req.setTimeout(3000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// ============================================================
// ОЧИСТКА КЭША
// ============================================================

export function clearWebCache() {
  const size = webCache.size;
  webCache.clear();
  console.log(`[SEARCH] кэш очищен (${size} записей)`);
  return size;
}

// ============================================================
// СТАТИСТИКА КЭША
// ============================================================

export function getWebCacheStats() {
  const entries = [];
  for (const [key, value] of webCache) {
    entries.push({
      query: key,
      results: value.results.length,
      age: Math.round((Date.now() - value.timestamp) / 60000) // в минутах
    });
  }
  
  return {
    totalEntries: webCache.size,
    entries: entries
  };
}

// ============================================================
// ЭКСПОРТ ДЛЯ ВНЕШНЕГО ИСПОЛЬЗОВАНИЯ
// ============================================================

export default {
  webSearch,
  clearWebCache,
  getWebCacheStats
};