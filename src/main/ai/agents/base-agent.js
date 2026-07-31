// ============================================================
// БАЗОВЫЙ КЛАСС АГЕНТА
// ============================================================

import { randomUUID } from 'crypto'

export class BaseAgent {
  constructor(config = {}) {
    this.id = config.id || randomUUID()
    this.name = config.name || 'Агент'
    this.type = config.type || 'base'
    this.description = config.description || 'Базовый агент'
    this.status = 'idle' // idle | running | completed | error
    this.progress = 0
    this.result = null
    this.error = null
    this.createdAt = new Date().toISOString()
    this.updatedAt = new Date().toISOString()
    this.tasks = []
    this.currentTask = null
    this.history = []
  }

  // ============================================================
  // ОСНОВНЫЕ МЕТОДЫ
  // ============================================================

  async execute(task) {
    this.status = 'running'
    this.currentTask = task
    this.progress = 0
    this.error = null
    this.updatedAt = new Date().toISOString()

    try {
      const result = await this._execute(task)
      this.result = result
      this.status = 'completed'
      this.progress = 100
      this.history.push({
        task: task,
        result: result,
        timestamp: new Date().toISOString()
      })
      this.updatedAt = new Date().toISOString()
      return result
    } catch (error) {
      this.status = 'error'
      this.error = error.message
      this.updatedAt = new Date().toISOString()
      throw error
    }
  }

  async _execute(task) {
    throw new Error('Метод _execute должен быть переопределён')
  }

  // ============================================================
  // ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
  // ============================================================

  getStatus() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      status: this.status,
      progress: this.progress,
      result: this.result,
      error: this.error,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }

  reset() {
    this.status = 'idle'
    this.progress = 0
    this.result = null
    this.error = null
    this.currentTask = null
    this.updatedAt = new Date().toISOString()
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      description: this.description,
      status: this.status,
      progress: this.progress,
      result: this.result,
      error: this.error,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      tasks: this.tasks,
      history: this.history.slice(-10)
    }
  }
}