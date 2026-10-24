// ============================================================
// АГЕНТ-ПИСАТЕЛЬ (СТАТЬИ, ОТЧЁТЫ)
// ============================================================

import { BaseAgent } from './base-agent.js'
import { generateRawResponse } from '../generator.js'

export class WriterAgent extends BaseAgent {
  constructor(config = {}) {
    super({
      ...config,
      type: 'writer',
      name: config.name || 'Писатель',
      description: 'Пишет статьи, отчёты и тексты'
    })
  }

  async _execute(task) {
    console.log(`[WRITER] Задача: "${task}"`)

    // 1. Определяем тип текста
    const textType = this._detectTextType(task)
    console.log(`[WRITER] Тип текста: ${textType}`)

    // 2. Генерируем текст
    const text = await this._generateText(task, textType)
    console.log(`[WRITER] Текст сгенерирован (${text.length} символов)`)

    // 3. Форматируем результат
    return {
      task: task,
      textType: textType,
      text: text,
      summary: `Создан текст на тему "${task}" (${text.length} символов)`
    }
  }

  _detectTextType(task) {
    const lower = task.toLowerCase()
    if (lower.includes('стать') || lower.includes('обзор') || lower.includes('анализ')) {
      return 'article'
    }
    if (lower.includes('отчёт') || lower.includes('доклад') || lower.includes('реферат')) {
      return 'report'
    }
    if (lower.includes('новост') || lower.includes('пресс-релиз')) {
      return 'news'
    }
    return 'article'
  }

  async _generateText(task, textType) {
    let prompt = ''
    
    switch (textType) {
      case 'article':
        prompt = `
        Напиши статью на тему: "${task}"
        Требования:
        - Структура: введение, основная часть, заключение
        - Объём: 500-1000 слов
        - Стиль: научно-публицистический
        `
        break
      case 'report':
        prompt = `
        Составь отчёт на тему: "${task}"
        Требования:
        - Структура: цель, методы, результаты, выводы
        - Объём: 300-500 слов
        `
        break
      case 'news':
        prompt = `
        Напиши новостную заметку на тему: "${task}"
        Требования:
        - Структура: заголовок, лид, основная часть
        - Объём: 200-300 слов
        `
        break
      default:
        prompt = `Напиши текст на тему: "${task}"`
    }

    const response = await generateRawResponse(prompt, [], 'System', 'Prismi', 'writer', [], false)
    return response
  }
}