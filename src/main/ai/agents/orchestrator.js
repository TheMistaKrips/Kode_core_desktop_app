// ============================================================
// МАСТЕР-АГЕНТ (ОРКЕСТРАТОР)
// ============================================================

import { BaseAgent } from './base-agent.js'
import { createAgent, runAgentTask, deleteAgent } from './agent-manager.js'

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

    // 2. Создаём и упорядочиваем подзадачи по важности/зависимостям
    const subTasks = this._orderTasks(this._createSubTasks(task, analysis))
    console.log(`[ORCHESTRATOR] Упорядочено ${subTasks.length} подзадач`)

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
    const { generateRawResponse } = await import('../generator.js')
    
    const analysisPrompt = `
    Разбей задачу на подзадачи и определи для каждой важность и зависимости.

    Задача: "${task}"

    Верни ТОЛЬКО JSON (без пояснений и без markdown-обёртки) в формате:
    {
      "type": "research|code|analysis|writing|mixed",
      "subTasks": [
        {
          "id": "1",
          "description": "что сделать",
          "agentType": "researcher|coder|analyst|writer",
          "priority": 10,
          "dependsOn": []
        }
      ]
    }

    Правила:
    - priority: число от 1 до 10, где 10 — самое важное/срочное.
    - dependsOn: массив id подзадач, которые должны выполниться раньше этой.
    - Располагай подзадачи по убыванию важности.
    - Если задача простая — верни ровно одну подзадачу.
    `

    const response = await generateRawResponse(analysisPrompt, [], 'System', 'Prismi', 'orchestrator', [], false)
    try {
      const cleaned = response.replace(/```json|```/g, '').trim()
      return JSON.parse(cleaned)
    } catch {
      const match = response.match(/\{[\s\S]*\}/)
      if (match) {
        try {
          return JSON.parse(match[0])
        } catch {}
      }
      // Фолбэк — если AI не вернул JSON
      return {
        type: 'mixed',
        subTasks: [
          {
            id: '1',
            description: task,
            agentType: this._detectAgentType(task),
            priority: 10,
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
        priority: 10,
        dependsOn: []
      }
    ]
  }

  // ============================================================
  // УПОРЯДОЧИВАНИЕ ПОДЗАДАЧ ПО ВАЖНОСТИ И ЗАВИСИМОСТЯМ
  // ============================================================

  _orderTasks(subTasks) {
    if (!subTasks || subTasks.length === 0) return []

    const byId = new Map(subTasks.map((t) => [String(t.id), t]))
    const done = new Set()
    const ordered = []

    while (ordered.length < subTasks.length) {
      let best = null

      for (const t of subTasks) {
        if (done.has(String(t.id))) continue
        const deps = (t.dependsOn || []).map((d) => String(d))
        // Задача доступна, только если все её зависимости уже выполнены
        if (deps.every((d) => done.has(d))) {
          if (!best || (Number(t.priority) || 1) > (Number(best.priority) || 1)) {
            best = t
          }
        }
      }

      if (!best) {
        // Циклическая или потерянная зависимость — добавляем оставшиеся как есть
        for (const t of subTasks) {
          if (!done.has(String(t.id))) {
            ordered.push(t)
            done.add(String(t.id))
          }
        }
        break
      }

      ordered.push(best)
      done.add(String(best.id))
    }

    return ordered
  }

  // ============================================================
  // РАСПРЕДЕЛЕНИЕ ЗАДАЧ
  // ============================================================

  async _distributeTasks(subTasks) {
    const results = []
    const createdAgentIds = []

    for (const subTask of subTasks) {
      try {
        // Создаём временного агента для подзадачи
        const agent = createAgent({
          type: subTask.agentType,
          name: `${subTask.agentType}-${subTask.id}`
        })

        if (!agent) {
          results.push({
            id: subTask.id,
            priority: Number(subTask.priority) || 1,
            success: false,
            error: `Не удалось создать агента типа ${subTask.agentType}`
          })
          continue
        }

        createdAgentIds.push(agent.id)

        // Выполняем задачу
        const result = await runAgentTask(agent.id, subTask.description)
        results.push({
          id: subTask.id,
          priority: Number(subTask.priority) || 1,
          success: true,
          result: result
        })
      } catch (error) {
        results.push({
          id: subTask.id,
          priority: Number(subTask.priority) || 1,
          success: false,
          error: error.message
        })
      }
    }

    // 🔥 Убираем временных субагентов, чтобы не копились в базе
    for (const id of createdAgentIds) {
      try {
        deleteAgent(id)
      } catch {}
    }

    return results
  }

  // ============================================================
  // АГРЕГАЦИЯ РЕЗУЛЬТАТОВ
  // ============================================================

  async _aggregateResults(results, originalTask) {
    const successful = results.filter((r) => r.success)
    const failed = results.filter((r) => !r.success)

    // Если всё упало — возвращаем ошибку
    if (successful.length === 0) {
      return {
        success: false,
        error: 'Все подзадачи завершились ошибкой',
        details: failed
      }
    }

    // Собираем результаты с планом выполнения (по приоритету)
    return {
      success: true,
      task: originalTask,
      plan: results.map((r) => ({ id: r.id, priority: r.priority, done: r.success })),
      results: successful.map((r) => r.result),
      errors: failed.map((r) => ({ id: r.id, error: r.error })),
      summary: `Выполнено ${successful.length} из ${results.length} подзадач`
    }
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