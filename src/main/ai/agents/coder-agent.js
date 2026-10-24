// ============================================================
// АГЕНТ-КОДЕР (ЛЕНДИНГИ, КОД)
// ============================================================

import { BaseAgent } from './base-agent.js'
import { generateRawResponse } from '../generator.js'
import { parseAIResponse } from '../code-generator.js'

export class CoderAgent extends BaseAgent {
  constructor(config = {}) {
    super({
      ...config,
      type: 'coder',
      name: config.name || 'Кодер',
      description: 'Пишет код и создаёт лендинги'
    })
  }

  async _execute(task) {
    console.log(`[CODER] Задача: "${task}"`)

    // 1. Определяем тип задачи
    const taskType = this._detectTaskType(task)
    console.log(`[CODER] Тип задачи: ${taskType}`)

    // 2. Генерируем код
    const code = await this._generateCode(task, taskType)
    console.log(`[CODER] Код сгенерирован`)

    // 3. Создаём файлы
    const files = await this._createFiles(code, taskType)
    console.log(`[CODER] Создано ${files.length} файлов`)

    // 4. Форматируем результат
    return {
      task: task,
      taskType: taskType,
      files: files,
      summary: `Создано ${files.length} файлов для задачи "${task}"`
    }
  }

  _detectTaskType(task) {
    const lower = task.toLowerCase()
    if (lower.includes('лендинг') || lower.includes('сайт') || lower.includes('веб-страниц')) {
      return 'landing'
    }
    if (lower.includes('код') || lower.includes('программ')) {
      return 'code'
    }
    return 'code'
  }

  async _generateCode(task, taskType) {
    let prompt = ''
    
    if (taskType === 'landing') {
      prompt = `
      Создай лендинг на тему: "${task}"
      Верни полный код в формате [FILE:...] ... [/FILE]
      Создай минимум 3 файла: index.html, style.css, script.js
      `
    } else {
      prompt = `
      Напиши код для задачи: "${task}"
      Верни полный код в формате [FILE:...] ... [/FILE]
      Определи язык автоматически.
      `
    }

    const response = await generateRawResponse(prompt, [], 'System', 'Prismi', 'coder', [], false)
    return response
  }

  async _createFiles(code, taskType) {
    const { files } = await parseAIResponse(code)
    
    if (files.length === 0) {
      // Если нет файлов в формате [FILE:...], создаём один текстовый
      return [{
        name: taskType === 'landing' ? 'index.html' : 'code.txt',
        content: Buffer.from(code).toString('base64'),
        type: 'text',
        size: code.length
      }]
    }

    return files
  }
}