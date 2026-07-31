// ============================================================
// АГЕНТ-АНАЛИТИК (ТАБЛИЦЫ, ДАННЫЕ)
// ============================================================

import { BaseAgent } from './base-agent.js'
import { generateChatResponse } from '../generator.js'
import { exportTableToExcel } from '../export-excel.js'
import { parseAIResponse } from '../code-generator.js'

export class AnalystAgent extends BaseAgent {
  constructor(config = {}) {
    super({
      ...config,
      type: 'analyst',
      name: config.name || 'Аналитик',
      description: 'Анализирует данные и создаёт таблицы'
    })
  }

  async _execute(task) {
    console.log(`[ANALYST] Задача: "${task}"`)

    // 1. Собираем данные
    const data = await this._collectData(task)
    console.log(`[ANALYST] Собрано ${data.length} записей`)

    // 2. Создаём таблицу
    const table = await this._createTable(data, task)
    console.log(`[ANALYST] Таблица создана`)

    // 3. Форматируем результат
    return {
      task: task,
      data: data,
      table: table,
      summary: `Создана таблица с ${data.length} записями`
    }
  }

  async _collectData(task) {
    const prompt = `
    Из задачи извлеки данные для таблицы.
    Задача: "${task}"

    Верни данные в формате JSON:
    [
      { "категория": "значение", "показатель": "значение" },
      ...
    ]

    Если данных нет — создай примерные (моковые) данные.
    `

    const response = await generateChatResponse(prompt, [], 'System', 'Spark', 'analyst', [], false)
    try {
      return JSON.parse(response)
    } catch {
      // Фолбэк — моковые данные
      return [
        { категория: 'Категория 1', показатель: 100 },
        { категория: 'Категория 2', показатель: 200 },
        { категория: 'Категория 3', показатель: 300 }
      ]
    }
  }

  async _createTable(data, task) {
    // Формируем Markdown таблицу
    if (data.length === 0) {
      return 'Нет данных для таблицы'
    }

    const headers = Object.keys(data[0])
    let table = `| ${headers.join(' | ')} |\n`
    table += `| ${headers.map(() => '---').join(' | ')} |\n`
    data.forEach(row => {
      table += `| ${headers.map(h => row[h] || '').join(' | ')} |\n`
    })

    return table
  }
}