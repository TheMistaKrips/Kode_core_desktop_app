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
// ЯДРО: выполнение запроса и возврат сырого текста
// ============================================================

async function runCompletion(
  prompt,
  files,
  userName,
  aiName,
  chatId,
  chatHistory,
  webSearchEnabled,
  onToken
) {
  const modelType = routeRequest(prompt);
  console.log('[GENERATE] модель:', modelType);

  await ensureModelLoaded(modelType);

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
    webResults = await webSearch(prompt);
    if (webResults.length > 0) {
      systemPrompt += '\n\nАКТУАЛЬНАЯ ИНФОРМАЦИЯ ИЗ ИНТЕРНЕТА:\n';
      webResults.slice(0, 5).forEach((result, i) => {
        systemPrompt += `\n${i + 1}. ${result.title}\n${result.snippet}\nИсточник: ${result.url}\n`;
      });
      systemPrompt += '\nИспользуй эту информацию для ответа. Если информация противоречит твоим знаниям, используй данные из интернета как более актуальные.\n';
    }
  }

  if (chatHistory && chatHistory.length > 0) {
    const relevantHistory = chatHistory.slice(-20);
    systemPrompt += '\n\nИСТОРИЯ ДИАЛОГА:\n';
    relevantHistory.forEach((msg) => {
      const role = msg.role === 'user' ? userName : aiName;
      const snippet = (msg.text || '').substring(0, 400);
      systemPrompt += `${role}: ${snippet}\n`;
    });
    systemPrompt += '\n--- КОНЕЦ ИСТОРИИ ---\n';
  }

  const session = new LlamaChatSessionClass({
    contextSequence: context.getSequence(),
    systemPrompt: systemPrompt
  });

  let userMessage = '';

  if (files && files.length > 0) {
    userMessage += 'Файлы:\n\n';
    const fileContents = await Promise.all(
      files.map(async (file) => {
        const content = await parseFileContent(file.path);
        return { name: file.name, content };
      })
    );

    // 🔥 Бюджет контекста: не даём файлам переполнить окно модели (16K токенов)
    const MAX_TOTAL_FILE_CHARS = 10000;
    const perFile = Math.max(800, Math.floor(MAX_TOTAL_FILE_CHARS / Math.max(fileContents.length, 1)));
    let remaining = MAX_TOTAL_FILE_CHARS;

    const budgeted = fileContents.map(({ name, content }) => {
      const cap = Math.max(0, Math.min(perFile, remaining));
      let snippet = content;
      if (snippet.length > cap) {
        snippet = snippet.substring(0, cap) + '\n...[обрезано]';
      }
      remaining = Math.max(0, remaining - snippet.length);
      return `--- ${name} ---\n${snippet}\n`;
    });

    userMessage += budgeted.join('\n');
    userMessage += '\nВыполни запрос на основе всех файлов. Если файлов несколько — обработай каждый, а при необходимости сведи данные в таблицу (markdown).\n\n';
  }

  userMessage += `${userName}: ${prompt}`;

  currentAbortController = new AbortController();
  currentOnToken = onToken;

  let fullResponse = '';

  try {
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

    let responseText = fullResponse || '';

    if (!responseText) {
      try {
        if (Buffer.isBuffer(response)) {
          responseText = response.toString('utf-8');
        } else if (response instanceof Uint8Array) {
          responseText = new TextDecoder('utf-8').decode(response);
        } else if (typeof response === 'string') {
          responseText = response;
        } else if (Array.isArray(response)) {
          let text = '';
          for (const t of response) {
            text += decodeTokenWithModel(t, loadedModel);
          }
          responseText = text;
        } else {
          responseText = decodeResponse(response);
        }
      } catch (e) {
        console.log('[GENERATE] ошибка декодирования:', e.message);
        responseText = String(response);
      }
    }

    return { responseText, webResults, modelType };
  } finally {
    currentAbortController = null;
    currentOnToken = null;
    try {
      await context.dispose();
    } catch (e) {
      console.log('[GENERATE] ошибка очистки контекста:', e.message);
    }
  }
}

// ============================================================
// ГЕНЕРАЦИЯ ОТВЕТА (структурированный объект для чата)
// ============================================================

export async function generateChatResponse(
  prompt,
  files = [],
  userName = 'User',
  aiName = 'Prismi',
  chatId = 'default',
  chatHistory = [],
  webSearchEnabled = false,
  onToken = null
) {
  const totalStart = Date.now();

  try {
    console.log('[GENERATE] === НАЧАЛО ГЕНЕРАЦИИ ===');

    const { responseText, webResults, modelType } = await runCompletion(
      prompt,
      files,
      userName,
      aiName,
      chatId,
      chatHistory,
      webSearchEnabled,
      onToken
    );

    const { files: generatedFiles, cleanText, tableData } = await parseAIResponse(responseText);

    const totalTime = ((Date.now() - totalStart) / 1000).toFixed(1);
    console.log('[GENERATE] === ЗАВЕРШЕНО ЗА', totalTime, 'сек ===');

    return {
      text: cleanText || responseText || 'Ответ не получен',
      files: generatedFiles,
      tableData: tableData,
      webResults: webResults,
      modelUsed: modelType
    };
  } catch (error) {
    console.log('[GENERATE] === ОШИБКА ===');
    console.error('[GENERATE]', error);

    if (error.name === 'AbortError' || error.message?.includes('abort')) {
      throw new Error('AbortError');
    }

    return {
      text: 'Ошибка при генерации. Попробуйте еще раз.',
      files: [],
      tableData: null,
      webResults: []
    };
  }
}

// ============================================================
// ГЕНЕРАЦИЯ СЫРОГО ТЕКСТА (для внутренних агентов)
// ============================================================

export async function generateRawResponse(
  prompt,
  files = [],
  userName = 'System',
  aiName = 'Prismi',
  chatId = 'default',
  chatHistory = [],
  webSearchEnabled = false,
  onToken = null
) {
  const { responseText } = await runCompletion(
    prompt,
    files,
    userName,
    aiName,
    chatId,
    chatHistory,
    webSearchEnabled,
    onToken
  );
  return responseText;
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
      return 'Новый диалог';
    }

    const context = await loadedModel.createContext({
      threads: threads,
      batchSize: 512,
      contextSize: 1024
    });

    const tempSession = new LlamaChatSessionClass({
      contextSequence: context.getSequence(),
      systemPrompt: 'Создай краткий заголовок (максимум 5 слов). Ответь только заголовком.'
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

    return title.trim().replace(/["']/g, '').substring(0, 50);
  } catch (error) {
    console.error('[TITLE] ошибка:', error);
    return 'Новый диалог';
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
