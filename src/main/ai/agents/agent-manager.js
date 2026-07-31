// ============================================================
// УПРАВЛЕНИЕ АГЕНТАМИ
// ============================================================

import fs from 'fs'
import path from 'path'
import { app } from 'electron'
import { randomUUID } from 'crypto'

const AGENTS_FILE = path.join(app.getPath('userData'), 'agents.json')

// ============================================================
// ИМПОРТ АГЕНТОВ
// ============================================================

import { ResearcherAgent } from './researcher-agent.js'
import { CoderAgent } from './coder-agent.js'
import { AnalystAgent } from './analyst-agent.js'
import { WriterAgent } from './writer-agent.js'
import { OrchestratorAgent } from './orchestrator.js'

// ============================================================
// ХРАНИЛИЩЕ АГЕНТОВ
// ============================================================

let agents = []
let isLoaded = false

// ============================================================
// ЗАГРУЗКА АГЕНТОВ
// ============================================================

export function loadAgents() {
  try {
    if (fs.existsSync(AGENTS_FILE)) {
      const data = fs.readFileSync(AGENTS_FILE, 'utf-8')
      const saved = JSON.parse(data)
      agents = saved.map(a => {
        let agent
        switch (a.type) {
          case 'orchestrator':
            agent = new OrchestratorAgent(a)
            break
          case 'researcher':
            agent = new ResearcherAgent(a)
            break
          case 'coder':
            agent = new CoderAgent(a)
            break
          case 'analyst':
            agent = new AnalystAgent(a)
            break
          case 'writer':
            agent = new WriterAgent(a)
            break
          default:
            agent = new BaseAgent(a)
        }
        // Восстанавливаем состояние
        agent.status = a.status || 'idle'
        agent.progress = a.progress || 0
        agent.result = a.result || null
        agent.error = a.error || null
        agent.createdAt = a.createdAt || new Date().toISOString()
        agent.updatedAt = a.updatedAt || new Date().toISOString()
        agent.history = a.history || []
        return agent
      })
      console.log(`[AGENTS] загружено ${agents.length} агентов`)
    } else {
      // Создаём дефолтного оркестратора
      const orchestrator = new OrchestratorAgent({ name: 'Мастер-агент' })
      agents.push(orchestrator)
      saveAgents()
    }
    isLoaded = true
    return agents
  } catch (error) {
    console.error('[AGENTS] ошибка загрузки:', error)
    agents = []
    isLoaded = true
    return agents
  }
}

// ============================================================
// СОХРАНЕНИЕ АГЕНТОВ
// ============================================================

export function saveAgents() {
  try {
    const data = JSON.stringify(agents.map(a => a.toJSON()), null, 2)
    fs.writeFileSync(AGENTS_FILE, data)
    return true
  } catch (error) {
    console.error('[AGENTS] ошибка сохранения:', error)
    return false
  }
}

// ============================================================
// ПОЛУЧЕНИЕ АГЕНТОВ
// ============================================================

export function getAgents() {
  if (!isLoaded) {
    return loadAgents()
  }
  return agents
}

export function getAgent(id) {
  return agents.find(a => a.id === id) || null
}

// ============================================================
// СОЗДАНИЕ АГЕНТА
// ============================================================

export function createAgent(config) {
  let agent
  
  switch (config.type) {
    case 'orchestrator':
      agent = new OrchestratorAgent(config)
      break
    case 'researcher':
      agent = new ResearcherAgent(config)
      break
    case 'coder':
      agent = new CoderAgent(config)
      break
    case 'analyst':
      agent = new AnalystAgent(config)
      break
    case 'writer':
      agent = new WriterAgent(config)
      break
    default:
      agent = new BaseAgent(config)
  }

  agents.push(agent)
  saveAgents()
  console.log(`[AGENTS] создан агент: ${agent.name} (${agent.type})`)
  return agent
}

// ============================================================
// УДАЛЕНИЕ АГЕНТА
// ============================================================

export function deleteAgent(id) {
  const index = agents.findIndex(a => a.id === id)
  if (index === -1) return false
  
  agents.splice(index, 1)
  saveAgents()
  console.log(`[AGENTS] удалён агент: ${id}`)
  return true
}

// ============================================================
// ЗАПУСК ЗАДАЧИ АГЕНТА
// ============================================================

export async function runAgentTask(agentId, task) {
  const agent = getAgent(agentId)
  if (!agent) {
    throw new Error(`Агент ${agentId} не найден`)
  }

  console.log(`[AGENTS] запуск задачи для ${agent.name}: "${task}"`)
  
  try {
    const result = await agent.execute(task)
    saveAgents()
    return result
  } catch (error) {
    console.error(`[AGENTS] ошибка выполнения:`, error)
    throw error
  }
}

// ============================================================
// РАСПРЕДЕЛЕНИЕ ЗАДАЧИ МЕЖДУ АГЕНТАМИ (ОРКЕСТРАЦИЯ)
// ============================================================

export async function orchestrateTask(task) {
  let orchestrator = agents.find(a => a.type === 'orchestrator')
  
  if (!orchestrator) {
    orchestrator = new OrchestratorAgent({ name: 'Мастер-агент' })
    agents.push(orchestrator)
    saveAgents()
  }

  console.log(`[AGENTS] оркестрация задачи: "${task}"`)
  
  try {
    const result = await orchestrator.execute(task)
    saveAgents()
    return result
  } catch (error) {
    console.error(`[AGENTS] ошибка оркестрации:`, error)
    throw error
  }
}

// ============================================================
// СТАТИСТИКА АГЕНТОВ
// ============================================================

export function getAgentsStats() {
  const stats = {
    total: agents.length,
    byType: {},
    byStatus: { idle: 0, running: 0, completed: 0, error: 0 }
  }

  agents.forEach(a => {
    stats.byType[a.type] = (stats.byType[a.type] || 0) + 1
    stats.byStatus[a.status] = (stats.byStatus[a.status] || 0) + 1
  })

  return stats
}

// ============================================================
// ЭКСПОРТ
// ============================================================

export default {
  loadAgents,
  saveAgents,
  getAgents,
  getAgent,
  createAgent,
  deleteAgent,
  runAgentTask,
  orchestrateTask,
  getAgentsStats
}