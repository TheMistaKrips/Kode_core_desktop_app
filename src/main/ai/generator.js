import { 
  ensureModelLoaded, 
  getLoadedModel,
  getLlamaChatSessionClass,
  getOptimalThreads
} from './models.js'
import { routeRequest } from './router.js'
import { parseFileContent } from './file-processor.js'
import { webSearch } from './web-search.js'
import { parseAIResponse } from './code-generator.js'
import { getSystemPrompt } from './prompts.js'
import { decodeResponse } from './utils.js'

// ============================================================
// СОСТОЯНИЕ СТРИМИНГА
// ============================================================

let currentAbortController = null;
let currentOnToken = null;

// ============================================================
// ДЕКОДИРОВАНИЕ ТОКЕНА ЧЕРЕЗ model.detokenize()
// ============================================================

function decodeTokenWithModel(token, modelInstance) {
  try {
    if (typeof token === 'number') {
      const result = modelInstance.detokenize(token);
      if (result) {
        if (Buffer.isBuffer(result)) {
          return result.toString('utf-8');
        }
        if (result instanceof Uint8Array) {
          return new TextDecoder('utf-8').decode(result);
        }
        return String(result);
      }
      return '';
    }
    
    if (Array.isArray(token)) {
      let text = '';
      for (const t of token) {
        text += decodeTokenWithModel(t, modelInstance);
      }
      return text;
    }
    
    if (typeof token === 'string') {
      return token;
    }
    
    return '';
  } catch (e) {
    console.log('[DECODE] ошибка detokenize:', e.message);
    return '';
  }
}

// ============================================================
// ГЕНЕРАЦИЯ ОТВЕТА
// ============================================================

export async function generateChatResponse(
  prompt,
  files = [],
  userName = "User",
  aiName = "Spark",
  chatId = "default",
  chatHistory = [],
  webSearchEnabled = false,
  onToken = null
) {
  const totalStart = Date.now();
  
  try {
    console.log('[GENERATE] === НАЧАЛО ГЕНЕРАЦИИ ===');
    
    const modelType = routeRequest(prompt);
    console.log('[GENERATE] модель:', modelType);

    const loadStart = Date.now();
    await ensureModelLoaded(modelType);
    console.log('[GENERATE] загрузка модели:', ((Date.now() - loadStart) / 1000).toFixed(1), 'сек');

    const loadedModel = getLoadedModel();
    const LlamaChatSessionClass = getLlamaChatSessionClass();
    const threads = getOptimalThreads();

    if (!loadedModel) {
      throw new Error('Модель не загружена');
    }

    const context = await loadedModel.createContext({
      threads: threads,
      batchSize: 512,
      contextSize: 16384
    });

    let systemPrompt = getSystemPrompt(aiName);

    let webResults = [];
    if (webSearchEnabled) {
      const searchStart = Date.now();
      webResults = await webSearch(prompt);
      console.log('[GENERATE] веб-поиск:', webResults.length, 'результатов за', ((Date.now() - searchStart) / 1000).toFixed(1), 'сек');
      
      if (webResults.length > 0) {
        systemPrompt += "\n\nАКТУАЛЬНАЯ ИНФОРМАЦИЯ ИЗ ИНТЕРНЕТА:\n";
        webResults.slice(0, 5).forEach((result, i) => {
          systemPrompt += `\n${i+1}. ${result.title}\n${result.snippet}\nИсточник: ${result.url}\n`;
        });
        systemPrompt += "\nИспользуй эту информацию для ответа. Если информация противоречит твоим знаниям, используй данные из интернета как более актуальные.\n";
      }
    }

    if (chatHistory && chatHistory.length > 0) {
      const relevantHistory = chatHistory.slice(-30);
      systemPrompt += "\n\nИСТОРИЯ ДИАЛОГА:\n";
      relevantHistory.forEach(msg => {
        const role = msg.role === 'user' ? userName : aiName;
        systemPrompt += `${role}: ${msg.text}\n`;
      });
      systemPrompt += "\n--- КОНЕЦ ИСТОРИИ ---\n";
    }

    const session = new LlamaChatSessionClass({
      contextSequence: context.getSequence(),
      systemPrompt: systemPrompt
    });

    let userMessage = "";

    if (files && files.length > 0) {
      userMessage += "Файлы:\n\n";
      const fileStart = Date.now();
      const fileContents = await Promise.all(
        files.map(async (file) => {
          const content = await parseFileContent(file.path);
          return `--- ${file.name} ---\n${content}\n`;
        })
      );
      userMessage += fileContents.join('\n');
      userMessage += "\nВыполни запрос на основе файлов.\n\n";
      console.log('[GENERATE] файлы:', files.length, 'за', ((Date.now() - fileStart) / 1000).toFixed(1), 'сек');
    }

    userMessage += `${userName}: ${prompt}`;

    currentAbortController = new AbortController();
    currentOnToken = onToken;

    const genStart = Date.now();
    console.log('[GENERATE] началась генерация...');

    let fullResponse = '';

    const response = await session.prompt(userMessage, {
      signal: currentAbortController.signal,
      maxTokens: 4096,
      onToken: (token) => {
        const decoded = decodeTokenWithModel(token, loadedModel);
        if (decoded) {
          fullResponse += decoded;
          if (currentOnToken) {
            currentOnToken(fullResponse);
          }
        }
      }
    });
    
    currentAbortController = null;
    currentOnToken = null;
    console.log('[GENERATE] генерация завершена за', ((Date.now() - genStart) / 1000).toFixed(1), 'сек');

    try {
      await context.dispose();
    } catch (e) {
      console.log('[GENERATE] ошибка очистки контекста:', e.message);
    }

    let responseText = fullResponse || '';
    
    console.log('[GENERATE] fullResponse длина:', fullResponse.length);
    
    if (!responseText) {
      try {
        if (Buffer.isBuffer(response)) {
          responseText = response.toString('utf-8');
          console.log('[GENERATE] декодировано из Buffer');
        } else if (response instanceof Uint8Array) {
          responseText = new TextDecoder('utf-8').decode(response);
          console.log('[GENERATE] декодировано из Uint8Array');
        } else if (typeof response === 'string') {
          responseText = response;
          console.log('[GENERATE] это строка');
        } else if (Array.isArray(response)) {
          let text = '';
          for (const t of response) {
            text += decodeTokenWithModel(t, loadedModel);
          }
          responseText = text;
          console.log('[GENERATE] декодировано из массива через модель');
        } else {
          responseText = decodeResponse(response);
          console.log('[GENERATE] декодировано через decodeResponse');
        }
      } catch (e) {
        console.log('[GENERATE] ошибка декодирования:', e.message);
        responseText = String(response);
      }
    }

    console.log('[GENERATE] финальный текст, длина:', responseText.length);
    console.log('[GENERATE] финальный текст (первые 100 символов):', responseText.substring(0, 100));

    const { files: generatedFiles, cleanText, tableData } = parseAIResponse(responseText);

    const totalTime = ((Date.now() - totalStart) / 1000).toFixed(1);
    console.log('[GENERATE] === ЗАВЕРШЕНО ЗА', totalTime, 'сек ===');

    return JSON.stringify({
      text: cleanText || responseText || 'Ответ не получен',
      files: generatedFiles,
      tableData: tableData,
      webResults: webResults,
      modelUsed: modelType
    });

  } catch (error) {
    console.log('[GENERATE] === ОШИБКА ===');
    console.error('[GENERATE]', error);
    
    currentAbortController = null;
    currentOnToken = null;
    
    if (error.name === 'AbortError' || error.message?.includes('abort')) {
      console.log('[GENERATE] генерация отменена пользователем');
      throw new Error('AbortError');
    }
    
    return JSON.stringify({
      text: "Ошибка при генерации. Попробуйте еще раз.",
      files: [],
      tableData: null,
      webResults: []
    });
  }
}

// ============================================================
// ГЕНЕРАЦИЯ ЗАГОЛОВКА
// ============================================================

export async function generateChatTitle(prompt) {
  try {
    console.log('[TITLE] генерация заголовка для:', prompt.substring(0, 50));
    
    await ensureModelLoaded('3b');
    const loadedModel = getLoadedModel();
    const LlamaChatSessionClass = getLlamaChatSessionClass();
    const threads = getOptimalThreads();

    if (!loadedModel) {
      return "Новый диалог";
    }

    const context = await loadedModel.createContext({
      threads: threads,
      batchSize: 512,
      contextSize: 1024
    });

    const tempSession = new LlamaChatSessionClass({
      contextSequence: context.getSequence(),
      systemPrompt: "Создай краткий заголовок (максимум 5 слов). Ответь только заголовком."
    });

    const response = await tempSession.prompt(`Заголовок для: "${prompt}"`);
    
    try {
      await context.dispose();
    } catch (e) {}

    let title = '';
    if (Buffer.isBuffer(response)) {
      title = response.toString('utf-8');
    } else if (response instanceof Uint8Array) {
      title = new TextDecoder('utf-8').decode(response);
    } else if (typeof response === 'string') {
      title = response;
    } else {
      title = String(response);
    }

    console.log('[TITLE] заголовок:', title);
    return title.trim().replace(/["']/g, '').substring(0, 50);
  } catch (error) {
    console.error('[TITLE] ошибка:', error);
    return "Новый диалог";
  }
}

// ============================================================
// ОТМЕНА ГЕНЕРАЦИИ
// ============================================================

export function abortGeneration() {
  if (currentAbortController) {
    console.log('[GENERATE] === ОТМЕНА ГЕНЕРАЦИИ ===');
    currentAbortController.abort();
    currentAbortController = null;
    currentOnToken = null;
  }
}

// ============================================================
// СБРОС СЕССИИ
// ============================================================

export async function resetChatSession() {
  console.log('[GENERATE] сброс сессии');
  return true;
}

// ============================================================
// ИНИЦИАЛИЗАЦИЯ AI
// ============================================================

export async function initAI() {
  console.log('[GENERATE] инициализация AI');
  return true;
}