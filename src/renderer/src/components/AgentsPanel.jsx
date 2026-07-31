import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import iconPlus from '../assets/icon_plus.svg';
import iconSearch from '../assets/icon_search.svg';
import iconFile from '../assets/icon_library.svg';
import iconDownload from '../assets/icon_download.svg';
import iconWebSearch from '../assets/icon_web_search.svg';

export default function AgentsPanel({ playClick }) {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [taskInput, setTaskInput] = useState('');
  const [results, setResults] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentType, setNewAgentType] = useState('researcher');
  const [agentWebSearch, setAgentWebSearch] = useState(false);

  const agentTypes = [
    { value: 'researcher', label: 'Исследователь' },
    { value: 'coder', label: 'Кодер' },
    { value: 'analyst', label: 'Аналитик' },
    { value: 'writer', label: 'Писатель' },
    { value: 'orchestrator', label: 'Мастер-агент' }
  ];

  const loadAgents = async () => {
    try {
      if (window.api && window.api.getAgents) {
        const data = await window.api.getAgents();
        setAgents(data || []);
        console.log('[AGENTS] загружено:', data?.length || 0);
      }
    } catch (error) {
      console.error('[AGENTS] ошибка загрузки:', error);
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  const handleCreateAgent = async () => {
    if (!newAgentName.trim()) {
      alert('Введите имя агента');
      return;
    }

    try {
      if (window.api && window.api.createAgent) {
        const agent = await window.api.createAgent({
          name: newAgentName,
          type: newAgentType
        });
        if (agent) {
          setAgents(prev => [...prev, agent]);
          setShowCreateModal(false);
          setNewAgentName('');
          if (playClick) playClick();
        }
      }
    } catch (error) {
      console.error('[AGENTS] ошибка создания:', error);
      alert('Ошибка создания агента: ' + error.message);
    }
  };

  const handleDeleteAgent = async (id) => {
    if (!confirm('Удалить агента?')) return;
    try {
      if (window.api && window.api.deleteAgent) {
        await window.api.deleteAgent(id);
        setAgents(prev => prev.filter(a => a.id !== id));
        if (selectedAgent?.id === id) setSelectedAgent(null);
        if (playClick) playClick();
      }
    } catch (error) {
      console.error('[AGENTS] ошибка удаления:', error);
    }
  };

  const handleRunTask = async () => {
    if (!taskInput.trim()) {
      alert('Введите задачу');
      return;
    }
    if (!selectedAgent) {
      alert('Выберите агента');
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      if (window.api && window.api.runAgentTask) {
        const result = await window.api.runAgentTask(selectedAgent.id, taskInput);
        setResults(result);
        await loadAgents();
      }
    } catch (error) {
      console.error('[AGENTS] ошибка выполнения:', error);
      setResults({ error: error.message });
    } finally {
      setLoading(false);
      if (playClick) playClick();
    }
  };

  const handleOrchestrate = async () => {
    if (!taskInput.trim()) {
      alert('Введите задачу');
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      if (window.api && window.api.orchestrateTask) {
        const result = await window.api.orchestrateTask(taskInput);
        setResults(result);
        await loadAgents();
      }
    } catch (error) {
      console.error('[AGENTS] ошибка оркестрации:', error);
      setResults({ error: error.message });
    } finally {
      setLoading(false);
      if (playClick) playClick();
    }
  };

  return (
    <div className="w-full h-full flex gap-6 p-6 bg-[var(--color-black)]">
      
      <div className="w-[320px] bg-[var(--color-white)] rounded-3xl p-6 flex flex-col shrink-0 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-default font-bold text-[var(--color-black)]">Агенты</h2>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="w-10 h-10 bg-[var(--color-black)] rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
          >
            <img src={iconPlus} alt="Add" className="w-5 h-5 invert" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto hidden-scroll flex flex-col gap-2">
          {agents.length === 0 ? (
            <div className="text-center text-[var(--color-black)]/40 py-10 text-small">
              Нет агентов. Создайте первого!
            </div>
          ) : (
            agents.map(agent => (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(agent)}
                className={`p-4 rounded-2xl text-left transition-all ${
                  selectedAgent?.id === agent.id 
                    ? 'bg-[var(--color-input)]' 
                    : 'hover:bg-black/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-small font-bold text-[var(--color-black)]">
                      {agent.name}
                    </div>
                    <div className="text-[12px] text-[var(--color-black)]/50">
                      {agentTypes.find(t => t.value === agent.type)?.label || agent.type}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      agent.status === 'idle' ? 'bg-gray-400' :
                      agent.status === 'running' ? 'bg-yellow-500 animate-pulse' :
                      agent.status === 'completed' ? 'bg-green-500' :
                      agent.status === 'error' ? 'bg-red-500' : 'bg-gray-400'
                    }`} />
                    <button 
                      onClick={() => handleDeleteAgent(agent.id)}
                      className="text-[var(--color-black)]/30 hover:text-red-500 transition-colors text-sm"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                {agent.progress > 0 && agent.status === 'running' && (
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-[var(--color-black)] h-1.5 rounded-full transition-all" style={{ width: `${agent.progress}%` }} />
                  </div>
                )}
                {agent.status === 'completed' && agent.result && (
                  <div className="mt-1 text-[11px] text-[var(--color-black)]/50 truncate">
                    {typeof agent.result === 'object' ? agent.result.summary || 'Готово' : String(agent.result).substring(0, 50)}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 bg-[var(--color-white)] rounded-3xl p-8 flex flex-col shadow-lg">
        <h2 className="text-default font-bold text-[var(--color-black)] mb-2">
          Управление задачами
        </h2>
        <p className="text-small text-[var(--color-black)]/50 mb-6">
          Выберите агента или используйте автоматическую оркестрацию
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {agents.map(agent => (
            <button
              key={agent.id}
              onClick={() => setSelectedAgent(agent)}
              className={`px-4 py-2 rounded-full text-small transition-all ${
                selectedAgent?.id === agent.id
                  ? 'bg-[var(--color-black)] text-[var(--color-white)]'
                  : 'bg-[var(--color-input)] text-[var(--color-black)] hover:opacity-70'
              }`}
            >
              {agent.name}
            </button>
          ))}
          {agents.length === 0 && (
            <span className="text-small text-[var(--color-black)]/40">Создайте агента для работы</span>
          )}
        </div>

        {/* 🔥 WEB SEARCH ДЛЯ АГЕНТА */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setAgentWebSearch(!agentWebSearch)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-[12px] transition-all ${
              agentWebSearch 
                ? 'bg-[var(--color-black)] text-[var(--color-white)]' 
                : 'bg-[var(--color-input)] text-[var(--color-black)] hover:opacity-70'
            }`}
          >
            <img 
              src={iconWebSearch} 
              alt="Web Search" 
              className="w-4 h-4"
              style={{
                filter: agentWebSearch ? 'brightness(0) invert(1)' : 'none'
              }}
            />
            Web Search {agentWebSearch && '✓'}
          </button>
          <span className="text-[11px] text-[var(--color-black)]/40">
            {agentWebSearch ? 'Агент будет искать в интернете' : 'Агент будет работать офлайн'}
          </span>
        </div>

        <textarea
          value={taskInput}
          onChange={(e) => setTaskInput(e.target.value)}
          placeholder="Опишите задачу для агента..."
          className="w-full flex-1 min-h-[120px] bg-[var(--color-input)] rounded-2xl p-4 text-default text-[var(--color-black)] placeholder:text-[var(--color-black)]/40 border-none outline-none resize-none"
        />

        <div className="flex gap-3 mt-4 flex-wrap">
          <button
            onClick={handleRunTask}
            disabled={!selectedAgent || !taskInput.trim() || loading}
            className="px-6 py-3 bg-[var(--color-black)] text-[var(--color-white)] text-small font-bold rounded-full hover:opacity-80 transition-opacity disabled:opacity-40"
          >
            {loading ? 'Выполняется...' : 'Запустить агента'}
          </button>
          <button
            onClick={handleOrchestrate}
            disabled={!taskInput.trim() || loading}
            className="px-6 py-3 bg-[var(--color-black)]/10 text-[var(--color-black)] text-small font-bold rounded-full hover:bg-[var(--color-black)]/20 transition-opacity disabled:opacity-40"
          >
            {loading ? 'Оркестрация...' : 'Авто-распределение'}
          </button>
          <button
            onClick={() => { setTaskInput(''); setResults(null); }}
            className="px-6 py-3 text-[var(--color-black)]/40 text-small font-bold rounded-full hover:text-[var(--color-black)] transition-colors"
          >
            Очистить
          </button>
        </div>

        {results && (
          <div className="mt-6 flex-1 overflow-y-auto hidden-scroll">
            <div className="bg-[var(--color-input)] rounded-2xl p-4">
              <div className="text-small font-bold text-[var(--color-black)] mb-2">Результат:</div>
              {results.error ? (
                <div className="text-red-500 text-small whitespace-pre-wrap break-words">
                  {results.error}
                </div>
              ) : (
                <pre className="text-small text-[var(--color-black)] whitespace-pre-wrap break-words max-h-[300px] overflow-y-auto hidden-scroll">
                  {typeof results === 'object' ? JSON.stringify(results, null, 2) : String(results)}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[var(--color-white)] p-8 rounded-3xl w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-default font-bold text-[var(--color-black)] mb-4">Создать агента</h3>
              
              <input
                type="text"
                value={newAgentName}
                onChange={(e) => setNewAgentName(e.target.value)}
                placeholder="Имя агента"
                className="w-full bg-[var(--color-input)] rounded-xl px-4 py-3 text-default text-[var(--color-black)] placeholder:text-[var(--color-black)]/40 border-none outline-none mb-4"
              />
              
              <select
                value={newAgentType}
                onChange={(e) => setNewAgentType(e.target.value)}
                className="w-full bg-[var(--color-input)] rounded-xl px-4 py-3 text-default text-[var(--color-black)] border-none outline-none mb-4"
              >
                {agentTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              
              <div className="flex gap-3">
                <button
                  onClick={handleCreateAgent}
                  className="flex-1 px-6 py-3 bg-[var(--color-black)] text-[var(--color-white)] text-small font-bold rounded-full hover:opacity-80 transition-opacity"
                >
                  Создать
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-3 text-[var(--color-black)]/40 text-small font-bold rounded-full hover:text-[var(--color-black)] transition-colors"
                >
                  Отмена
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}