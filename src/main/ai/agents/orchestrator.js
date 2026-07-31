// ============================================================
// МАСТЕР-АГЕНТ (ОРКЕСТРАТОР)
// ============================================================

import { BaseAgent } from './base-agent.js'
import { createAgent, runAgentTask, getAgent } from './agent-manager.js'

export class OrchestratorAgent extends BaseAgent {
  constructor(config = {}) {
    super({
      ...config,
      type: 'orchestrator',
      name: config.name || 'Мастер-агент',
      description: 'Координирует работу других агентов'
    })
    this.subAgents = []
  }

  // ============================================================
  // ОСНОВНАЯ ЛОГИКА
  // ============================================================

  async _execute(task) {
    console.log(`[ORCHESTRATOR] Задача: "${task}"`)

    // 1. Анализируем задачу
    const analysis = await this._analyzeTask(task)
    console.log(`[ORCHESTRATOR] Анализ:`, analysis)

    // 2. Создаём подзадачи
    const subTasks = this._createSubTasks(task, analysis)
    console.log(`[ORCHESTRATOR] Создано ${subTasks.length} подзадач`)

    // 3. Распределяем между агентами
    const results = await this._distributeTasks(subTasks)
    console.log(`[ORCHESTRATOR] Получено ${results.length} результатов`)

    // 4. Собираем финальный результат
    const finalResult = await this._aggregateResults(results, task)
    console.log(`[ORCHESTRATOR] Финальный результат готов`)

    return finalResult
  }

  // ============================================================
  // АНАЛИЗ ЗАДАЧИ
  // ============================================================

  async _analyzeTask(task) {
    // 🔥 ИСПОЛЬЗУЕМ AI ДЛЯ АНАЛИЗА
    const { generateChatResponse } = await import('../generator.js')
    
    const analysisPrompt = `
    Проанализируй задачу и определи:
    1. Тип задачи (research, code, analysis, writing)
    2. Какие подзадачи нужны
    3. Какие агенты нужны для выполнения

    Задача: "${task}"

    Ответь в формате JSON:
    {
      "type": "research|code|analysis|writing|mixed",
      "subTasks": [
        {
          "id": "1",
          "description": "...",
          "agentType": "researcher|coder|analyst|writer",
          "dependsOn": []
        }
      ]
    }
    `

    const response = await generateChatResponse(analysisPrompt, [], 'System', 'Spark', 'orchestrator', [], false)
    try {
      const parsed = JSON.parse(response)
      return parsed
    } catch {
      // Фолбэк — если AI не вернул JSON
      return {
        type: 'mixed',
        subTasks: [
          {
            id: '1',
            description: task,
            agentType: this._detectAgentType(task),
            dependsOn: []
          }
        ]
      }
    }
  }

  _detectAgentType(task) {
    const lower = task.toLowerCase()
    if (lower.includes('найди') || lower.includes('поищи') || lower.includes('исследуй') || lower.includes('статьи')) {
      return 'researcher'
    }
    if (lower.includes('код') || lower.includes('лендинг') || lower.includes('сайт') || lower.includes('программа')) {
      return 'coder'
    }
    if (lower.includes('таблиц') || lower.includes('эксель') || lower.includes('данные') || lower.includes('анализ')) {
      return 'analyst'
    }
    if (lower.includes('статья') || lower.includes('отчёт') || lower.includes('текст')) {
      return 'writer'
    }
    return 'researcher'
  }

  // ============================================================
  // СОЗДАНИЕ ПОДЗАДАЧ
  // ============================================================

  _createSubTasks(task, analysis) {
    if (analysis && analysis.subTasks && analysis.subTasks.length > 0) {
      return analysis.subTasks
    }
    
    // Фолбэк — одна подзадача
    return [
      {
        id: '1',
        description: task,
        agentType: this._detectAgentType(task),
        dependsOn: []
      }
    ]
  }

  // ============================================================
  // РАСПРЕДЕЛЕНИЕ ЗАДАЧ
  // ============================================================

  async _distributeTasks(subTasks) {
    const results = []

    for (const subTask of subTasks) {
      try {
        // Создаём агента для задачи
        const agent = createAgent({
          type: subTask.agentType,
          name: `${subTask.agentType}-${subTask.id}`
        })

        if (!agent) {
          results.push({
            id: subTask.id,
            success: false,
            error: `Не удалось создать агента типа ${subTask.agentType}`
          })
          continue
        }

        // Выполняем задачу
        const result = await runAgentTask(agent.id, subTask.description)
        results.push({
          id: subTask.id,
          success: true,
          result: result
        })

      } catch (error) {
        results.push({
          id: subTask.id,
          success: false,
          error: error.message
        })
      }
    }

    return results
  }

  // ============================================================
  // АГРЕГАЦИЯ РЕЗУЛЬТАТОВ
  // ============================================================

  async _aggregateResults(results, originalTask) {
    const successful = results.filter(r => r.success)
    const failed = results.filter(r => !r.success)

    // Если всё упало — возвращаем ошибку
    if (successful.length === 0) {
      return {
        success: false,
        error: 'Все подзадачи завершились ошибкой',
        details: failed
      }
    }

    // Собираем результаты
    const aggregated = {
      success: true,
      task: originalTask,
      results: successful.map(r => r.result),
      errors: failed.map(r => r.error),
      summary: `Выполнено ${successful.length} из ${results.length} подзадач`
    }

    return aggregated
  }

  // ============================================================
  // УПРАВЛЕНИЕ АГЕНТАМИ
  // ============================================================

  addAgent(agent) {
    this.subAgents.push(agent)
  }

  removeAgent(agentId) {
    this.subAgents = this.subAgents.filter(a => a.id !== agentId)
  }

  getAgents() {
    return this.subAgents.map(a => a.getStatus())
  }

  toJSON() {
    return {
      ...super.toJSON(),
      subAgents: this.subAgents.map(a => a.toJSON())
    }
  }
}