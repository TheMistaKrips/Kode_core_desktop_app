// ============================================================
// АГЕНТНАЯ СИСТЕМА — ГЛАВНЫЙ ВХОД
// ============================================================

export { OrchestratorAgent } from './orchestrator.js'
export { BaseAgent } from './base-agent.js'
export { ResearcherAgent } from './researcher-agent.js'
export { CoderAgent } from './coder-agent.js'
export { AnalystAgent } from './analyst-agent.js'
export { WriterAgent } from './writer-agent.js'

export {
  loadAgents,
  saveAgents,
  getAgents,
  getAgent,
  createAgent,
  deleteAgent,
  runAgentTask,
  orchestrateTask,
  getAgentsStats
} from './agent-manager.js'