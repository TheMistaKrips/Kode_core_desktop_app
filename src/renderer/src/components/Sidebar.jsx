import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Activity, Folder, Settings, Sun, Moon, Plus, MessageCircle } from 'lucide-react';
import clickSoundFile from '../assets/click.mp3';

const clickAudio = new Audio(clickSoundFile);
clickAudio.volume = 0.4;

export default function Sidebar({ 
  isLightMode, toggleTheme, currentView, setCurrentView,
  chatSessions, currentSessionId, handleCreateNewChat, handleSwitchChat
}) {
  const playClick = () => {
    clickAudio.currentTime = 0;
    clickAudio.play().catch(() => {});
  };

  const handleNav = (view) => {
    playClick();
    setCurrentView(view);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="w-64 flex flex-col py-6 px-4 h-full shrink-0 z-10 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--glass-border)] shadow-sm theme-transition"
    >
      {/* Основная навигация */}
      <div className="flex flex-col gap-1 w-full shrink-0">
        <NavButton icon={MessageSquare} label="Чат ассистента" active={currentView === 'chat'} onClick={() => handleNav('chat')} playClick={playClick} />
        <NavButton icon={Activity} label="Монитор системы" active={currentView === 'system'} onClick={() => handleNav('system')} playClick={playClick} />
        <NavButton icon={Folder} label="Контекст и Файлы" active={currentView === 'files'} onClick={() => handleNav('files')} playClick={playClick} />
        <NavButton icon={Settings} label="Настройки" active={currentView === 'settings'} onClick={() => handleNav('settings')} playClick={playClick} />
      </div>
      
      <div className="h-[1px] w-full bg-[var(--glass-border)] my-5 shrink-0 theme-transition"></div>
      
      {/* Секция истории чатов */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden w-full gap-2">
        <div className="flex items-center justify-between px-2 shrink-0 mb-2">
          <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Диалоги</span>
          <button 
            onClick={() => { playClick(); handleCreateNewChat(); }}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-tertiary)] rounded-md transition-colors"
            title="Новый чат"
          >
            <Plus size={14} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-1 pr-1">
          {chatSessions && chatSessions.map(session => (
            <button
              key={session.id}
              onClick={() => { playClick(); handleSwitchChat(session.id); }}
              className={`flex items-center gap-3 w-full p-2.5 rounded-lg transition-all text-left group ${
                currentSessionId === session.id && currentView === 'chat'
                  ? 'bg-[var(--bg-tertiary)] text-[var(--text-main)] font-medium shadow-sm border border-[var(--glass-border)]' 
                  : 'text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-main)] border border-transparent'
              }`}
            >
              <MessageCircle size={16} className={currentSessionId === session.id && currentView === 'chat' ? 'text-[var(--accent-primary)] shrink-0' : 'shrink-0 text-[var(--text-muted)] transition-colors'} />
              <span className="truncate text-sm">{session.title}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="h-[1px] w-full bg-[var(--glass-border)] my-4 shrink-0 theme-transition"></div>

      {/* Переключатель темы */}
      <div className="shrink-0 w-full mt-auto">
        <button
          onMouseEnter={playClick}
          onClick={toggleTheme}
          className="flex items-center gap-4 w-full p-3 rounded-xl transition-colors text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-tertiary)]"
        >
          {isLightMode ? <Moon size={18} /> : <Sun size={18} />}
          <span className="font-medium text-sm tracking-wide">{isLightMode ? 'Темная тема' : 'Светлая тема'}</span>
        </button>
      </div>
    </motion.div>
  );
}

function NavButton({ icon: Icon, label, active, onClick, playClick }) {
  return (
    <motion.button
      onMouseEnter={playClick}
      onClick={onClick}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
      className={`flex items-center gap-3.5 w-full p-3 rounded-xl transition-all ${
        active 
          ? 'bg-[var(--bg-tertiary)] text-[var(--accent-primary)] font-semibold shadow-sm border border-[var(--glass-border)]' 
          : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-tertiary)] border border-transparent font-medium'
      }`}
    >
      <Icon size={18} className={active ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'} />
      <span className="text-sm">{label}</span>
    </motion.button>
  );
}