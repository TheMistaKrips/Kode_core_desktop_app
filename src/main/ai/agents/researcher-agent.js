// ============================================================
// АГЕНТ-ИССЛЕДОВАТЕЛЬ (WEB SEARCH)
// ============================================================

import { BaseAgent } from './base-agent.js'
import { webSearch } from '../web-search.js'
import { generateChatResponse } from '../generator.js'

export class ResearcherAgent extends BaseAgent {
  constructor(config = {}) {
    super({
      ...config,
      type: 'researcher',
      name: config.name || 'Исследователь',
      description: 'Ищет информацию в интернете и анализирует её'
    })
  }

  async _execute(task) {
    console.log(`[RESEARCHER] Исследование: "${task}"`)

    // 1. Определяем ключевые слова для поиска
    const keywords = await this._extractKeywords(task)
    console.log(`[RESEARCHER] Ключевые слова: ${keywords}`)

    // 2. Выполняем поиск
    const searchResults = await webSearch(keywords)
    console.log(`[RESEARCHER] Найдено ${searchResults.length} результатов`)

    // 3. Анализируем результаты
    const analysis = await this._analyzeResults(searchResults, task)
    console.log(`[RESEARCHER] Анализ завершён`)

    // 4. Форматируем результат
    return {
      task: task,
      keywords: keywords,
      results: searchResults,
      analysis: analysis,
      summary: `Найдено ${searchResults.length} результатов по запросу "${keywords}"`
    }
  }

  async _extractKeywords(task) {
    const prompt = `
    Выдели ключевые слова для поиска из задачи.
    Верни только ключевые слова через запятую (максимум 5 слов).

    Задача: "${task}"
    `
    const response = await generateChatResponse(prompt, [], 'System', 'Spark', 'researcher', [], false)
    return response.trim().split(',').slice(0, 5).join(' ').trim()
  }

  async _analyzeResults(results, task) {
    if (!results || results.length === 0) {
      return { summary: 'Результатов не найдено' }
    }

    const prompt = `
    Проанализируй результаты поиска и составь краткий отчёт.
    Задача: "${task}"

    Результаты:
    ${results.slice(0, 5).map((r, i) => `${i+1}. ${r.title}\n   ${r.snippet}`).join('\n\n')}

    Верни краткий отчёт (до 500 слов).
    `

    const response = await generateChatResponse(prompt, [], 'System', 'Spark', 'researcher', [], false)
    return response
  }
}