import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from 'lottie-react';

import TitleBar from './components/TitleBar';
import SystemMonitor from './components/SystemMonitor';
import ChatPanel from './components/ChatPanel';
import AgentsPanel from './components/AgentsPanel';

import logonSoundFile from './assets/logon.mp3';
import clickSoundFile from './assets/click.mp3';
import helloAnimation from './assets/Hello.json';

import bgHello from './assets/background_hello.svg';
import bgMain from './assets/background_main.svg';
import bgSystem from './assets/system_bacgkround.svg';
import iconSoundOn from './assets/icon_sound_on.svg';
import iconSoundOff from './assets/icon_sound_off.svg';
import iconSettingsProfile from './assets/icon_settings_profile.svg';
import iconUserGhost from './assets/icon_user_ghost.svg';
import roundedCircle from './assets/rounded_circle.svg';

const logonAudio = new Audio(logonSoundFile);
const clickAudio = new Audio(clickSoundFile);
logonAudio.volume = 0.5;
clickAudio.volume = 0.4;

export default function App() {
  const checkFirstRun = () => !localStorage.getItem('spark_userName');
  
  const [appState, setAppState] = useState(checkFirstRun() ? 'boot' : 'main'); 
  const [currentView, setCurrentView] = useState('main'); 
  
  const [userName, setUserName] = useState('');
  const [userAge, setUserAge] = useState('');
  const [aiName, setAiName] = useState('Spark');
  
  const [isMuted, setIsMuted] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [chatSessions, setChatSessions] = useState([
    { id: 1, title: 'New chat', messages: [] }
  ]);
  const [currentSessionId, setCurrentSessionId] = useState(1);

  // 🔥 СОСТОЯНИЕ ЗАГРУЗКИ МОДЕЛИ
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [modelLoadProgress, setModelLoadProgress] = useState(0);
  const [modelLoadStatus, setModelLoadStatus] = useState('Инициализация...');

  // 🔥 ЭФФЕКТ ДЛЯ ОТСЛЕЖИВАНИЯ ЗАГРУЗКИ МОДЕЛИ
  useEffect(() => {
    let checkInterval = null;
    let progressInterval = null;
    
    const checkModelStatus = async () => {
      try {
        if (window.api && window.api.isModelReady) {
          const ready = await window.api.isModelReady();
          if (ready) {
            setIsModelLoading(false);
            setModelLoadProgress(100);
            setModelLoadStatus('Готово');
            if (checkInterval) clearInterval(checkInterval);
            if (progressInterval) clearInterval(progressInterval);
            return;
          }
        }
      } catch (error) {
        console.error('[APP] ошибка проверки модели:', error);
      }
    };

    checkModelStatus();
    checkInterval = setInterval(checkModelStatus, 1000);
    
    progressInterval = setInterval(() => {
      setModelLoadProgress(prev => {
        if (prev >= 90) return 90;
        return Math.min(prev + 2, 90);
      });
    }, 2000);

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      if (progressInterval) clearInterval(progressInterval);
    };
  }, []);

  useEffect(() => {
    if (!checkFirstRun()) {
      const storedUserName = localStorage.getItem('spark_userName') || 'User';
      const storedAiName = localStorage.getItem('spark_aiName') || 'Spark';
      setUserName(storedUserName);
      setAiName(storedAiName);
      setUserAge(localStorage.getItem('spark_userAge') || '');
      
      if (chatSessions[0].messages.length === 0) {
        setChatSessions([
          { id: 1, title: 'New chat', messages: [{ role: 'ai', text: `Hi, ${storedUserName}! I am ${storedAiName}. Ready to help.` }] }
        ]);
      }
      if (window.api && window.api.finishBoot) window.api.finishBoot();
    }
  }, []);

  useEffect(() => {
    if (appState === 'boot') {
      if (!isMuted) logonAudio.play().catch(() => {});
      const timer = setTimeout(() => {
        if (window.api && window.api.finishBoot) window.api.finishBoot();
        setAppState('onboarding');
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [appState, isMuted]);

  const playClick = () => {
    if (!isMuted) {
      clickAudio.currentTime = 0;
      clickAudio.play().catch(() => {});
    }
  };

  const saveProfileData = () => {
    const finalUserName = userName.trim() || 'User';
    const finalAiName = aiName.trim() || 'Spark';
    
    setUserName(finalUserName);
    setAiName(finalAiName);
    localStorage.setItem('spark_userName', finalUserName);
    localStorage.setItem('spark_aiName', finalAiName);
    if (userAge) localStorage.setItem('spark_userAge', userAge);
  };

  const handleCompleteOnboarding = () => {
    playClick();
    saveProfileData();
    if (chatSessions[0].messages.length === 0) {
      setChatSessions([
        { id: 1, title: 'New chat', messages: [{ role: 'ai', text: `Hi, ${userName || 'User'}! I am ${aiName || 'Spark'}. Ready to help.` }] }
      ]);
    }
    setAppState('main');
  };

  const handleResetProfile = () => {
    playClick();
    localStorage.clear();
    if (window.api && window.api.relaunchApp) {
      window.api.relaunchApp();
    } else {
      window.location.reload();
    }
  };

  const handleViewChange = (view) => {
    playClick();
    setCurrentView(view);
  };

  let translateY = '0%';
  if (currentView === 'chat') translateY = '-100%';
  if (currentView === 'agents') translateY = '-200%';
  if (currentView === 'settings') translateY = '-300%';

  const isDarkBg = currentView === 'chat' || currentView === 'agents' || currentView === 'settings';

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden bg-[var(--color-black)] font-sans rounded-[30px] border border-white/5 shadow-2xl">
      
      <TitleBar />

      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence>
          {appState === 'boot' && (
            <motion.div
              key="boot"
              initial={{ backgroundColor: 'rgba(17,17,17,1)' }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
              className="absolute inset-0 z-[200] flex items-center justify-center titlebar-drag"
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 1 }}
                className="w-[500px] h-[500px]"
              >
                <Lottie animationData={helloAnimation} loop={false} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {appState === 'onboarding' && (
            <motion.div
              key="onboarding"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0 z-[150] flex items-center justify-center titlebar-drag bg-[var(--color-black)]"
            >
              <img src={bgHello} alt="" className="absolute inset-0 w-full h-full object-cover z-0" />
              <div className="relative z-10 bg-[var(--color-white)] p-12 flex flex-col gap-6 w-full max-w-md shadow-2xl titlebar-nodrag" style={{ borderRadius: 'var(--radius-main)' }}>
                <h1 className="text-large text-center mb-2 text-[var(--color-black)]">Welcome</h1>
                
                <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Your name (User)"
                  className="w-full bg-[var(--color-input)] text-[var(--color-black)] px-6 py-4 text-default focus:outline-none transition-all placeholder:text-[var(--color-black)]/50" style={{ borderRadius: 'var(--radius-main)' }} />
                
                <input type="number" value={userAge} onChange={(e) => setUserAge(e.target.value)} placeholder="Age (optional)"
                  className="w-full bg-[var(--color-input)] text-[var(--color-black)] px-6 py-4 text-default focus:outline-none transition-all placeholder:text-[var(--color-black)]/50" style={{ borderRadius: 'var(--radius-main)' }} />
                
                <input type="text" value={aiName} onChange={(e) => setAiName(e.target.value)} placeholder="AI Name (Spark)"
                  className="w-full bg-[var(--color-input)] text-[var(--color-black)] px-6 py-4 text-default focus:outline-none transition-all placeholder:text-[var(--color-black)]/50" style={{ borderRadius: 'var(--radius-main)' }} />

                <button onClick={handleCompleteOnboarding} className="mt-4 bg-[var(--color-black)] text-[var(--color-white)] px-8 py-4 text-default hover:opacity-80 transition-opacity" style={{ borderRadius: 'var(--radius-main)' }}>
                  Start working
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {appState === 'main' && (
          <>
            <AnimatePresence>
              {isModelLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-[150] bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center"
                >
                  <div className="bg-white rounded-3xl p-10 max-w-md w-full shadow-2xl">
                    <h3 className="text-large font-bold text-black mb-2 text-center">Загрузка Spark</h3>
                    <p className="text-small text-black/60 text-center mb-6">{modelLoadStatus}</p>
                    
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-4">
                      <motion.div 
                        className="h-full bg-black rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(modelLoadProgress, 100)}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    
                    <p className="text-[12px] text-black/40 text-center">{Math.round(Math.min(modelLoadProgress, 100))}%</p>
                    
                    <div className="mt-6 space-y-3">
                      <div className="skeleton h-4 w-3/4 rounded-lg"></div>
                      <div className="skeleton h-4 w-1/2 rounded-lg"></div>
                      <div className="skeleton h-4 w-2/3 rounded-lg"></div>
                      <div className="skeleton h-4 w-3/4 rounded-lg"></div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="absolute top-0 left-0 w-full h-24 px-10 flex justify-between items-center z-[100] pointer-events-none transition-colors duration-700">
              <div className="w-64 pointer-events-auto"></div>

              <div className="flex items-center gap-3 titlebar-nodrag pointer-events-auto">
                <NavPill label="Main" isActive={currentView === 'main'} isDark={isDarkBg} onClick={() => handleViewChange('main')} />
                <NavPill label="Chat" isActive={currentView === 'chat'} isDark={isDarkBg} onClick={() => handleViewChange('chat')} />
                <NavPill label="Agents" isActive={currentView === 'agents'} isDark={isDarkBg} onClick={() => handleViewChange('agents')} />
                <NavPill label="Settings" isActive={currentView === 'settings'} isDark={isDarkBg} onClick={() => handleViewChange('settings')} />
              </div>

              <div className="flex items-center gap-4 titlebar-nodrag pointer-events-auto">
                <button onClick={() => { playClick(); setIsMuted(!isMuted); }} className="relative w-[50px] h-[50px] flex items-center justify-center hover:scale-105 transition-transform">
                  <img src={roundedCircle} alt="" className={`absolute inset-0 w-full h-full ${isDarkBg ? 'invert opacity-30' : 'opacity-100'}`} />
                  <img src={isMuted ? iconSoundOff : iconSoundOn} alt="Sound" className={`w-5 h-5 z-10 ${isDarkBg ? 'invert' : ''}`} />
                </button>
                
                <button onClick={() => { playClick(); setIsProfileModalOpen(true); }} className="relative w-[50px] h-[50px] flex items-center justify-center hover:scale-105 transition-transform">
                  <img src={roundedCircle} alt="" className={`absolute inset-0 w-full h-full ${isDarkBg ? 'invert opacity-30' : 'opacity-100'}`} />
                  <img src={iconSettingsProfile} alt="Settings" className={`w-5 h-5 z-10 ${isDarkBg ? 'invert' : ''}`} />
                </button>
                
                <div className="flex items-center gap-3 ml-2">
                  <div className="relative w-[50px] h-[50px] flex items-center justify-center bg-[var(--color-black)] rounded-full overflow-hidden shrink-0">
                    <img src={iconUserGhost} alt="User" className="w-6 h-6 object-contain" />
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className={`text-small font-bold leading-none mb-1 transition-colors duration-700 ${isDarkBg ? 'text-white' : 'text-black'}`}>{userName}</span>
                    <span className={`text-[11px] leading-none transition-colors duration-700 ${isDarkBg ? 'text-gray-400' : 'text-gray-500'}`}>Default plan</span>
                  </div>
                </div>
              </div>
            </div>

            <div 
              className="absolute left-0 w-full h-full transition-transform duration-700 ease-in-out z-10" 
              style={{ transform: `translateY(${translateY})` }}
            >
              
              <div className="absolute top-0 left-0 w-full h-full">
                <img src={bgMain} alt="" className="absolute inset-0 w-full h-full object-cover z-0" />
                <div className="absolute inset-0 z-10 pt-28 px-10 pb-10">
                  <SystemMonitor expanded={false} setCurrentView={setCurrentView} />
                </div>
              </div>

              <div className="absolute top-[100%] left-0 w-full h-full bg-[var(--color-black)]">
                <div className="absolute inset-0 z-10 pt-24 px-10 pb-6 flex">
                  <ChatPanel 
                    selectedFiles={selectedFiles} 
                    setSelectedFiles={setSelectedFiles} 
                    userName={userName} 
                    aiName={aiName} 
                    chatSessions={chatSessions}
                    setChatSessions={setChatSessions}
                    currentSessionId={currentSessionId}
                    setCurrentSessionId={setCurrentSessionId}
                    playClick={playClick}
                  />
                </div>
              </div>

              <div className="absolute top-[200%] left-0 w-full h-full bg-[var(--color-black)]">
                <div className="absolute inset-0 z-10 pt-24 px-10 pb-10">
                  <AgentsPanel playClick={playClick} />
                </div>
              </div>

              <div className="absolute top-[300%] left-0 w-full h-full bg-[var(--color-black)]">
                <img src={bgSystem} alt="" className="absolute inset-0 w-full h-full object-cover z-0" />
                <div className="absolute inset-0 z-10 pt-28 px-10 pb-10 overflow-y-auto hidden-scroll">
                   <SystemMonitor expanded={true} setCurrentView={setCurrentView} />
                </div>
              </div>

            </div>

            <AnimatePresence>
              {isProfileModalOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-[300] flex items-center justify-center bg-[var(--color-black)]/40 backdrop-blur-md titlebar-nodrag pointer-events-auto"
                >
                  <motion.div 
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="bg-[var(--color-white)] p-10 flex flex-col gap-5 w-full max-w-md shadow-2xl" 
                    style={{ borderRadius: 'var(--radius-main)' }}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h2 className="text-default font-bold text-[var(--color-black)]">Account Settings</h2>
                      <button onClick={() => { playClick(); setIsProfileModalOpen(false); }} className="text-[var(--color-black)]/50 hover:text-[var(--color-black)] font-bold text-xl">✕</button>
                    </div>
                    
                    <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Name"
                      className="w-full bg-[var(--color-input)] text-[var(--color-black)] px-5 py-4 text-small focus:outline-none placeholder:text-[var(--color-black)]/50" style={{ borderRadius: 'var(--radius-main)' }} />
                    
                    <input type="text" value={aiName} onChange={(e) => setAiName(e.target.value)} placeholder="Assistant name"
                      className="w-full bg-[var(--color-input)] text-[var(--color-black)] px-5 py-4 text-small focus:outline-none placeholder:text-[var(--color-black)]/50" style={{ borderRadius: 'var(--radius-main)' }} />
                    
                    <div className="flex gap-4 mt-2">
                      <button onClick={() => { playClick(); saveProfileData(); setIsProfileModalOpen(false); }} className="flex-1 bg-[var(--color-black)] text-[var(--color-white)] py-4 text-small font-bold hover:opacity-80 transition-opacity" style={{ borderRadius: 'var(--radius-main)' }}>
                        Save
                      </button>
                      <button onClick={handleResetProfile} className="flex-1 bg-red-500/10 text-red-600 py-4 text-small font-bold hover:bg-red-500 hover:text-white transition-colors" style={{ borderRadius: 'var(--radius-main)' }}>
                        Reset Cache
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}

function NavPill({ label, isActive, isDark, onClick }) {
  let baseClass = "px-8 py-3 text-nav transition-colors duration-500 cursor-pointer border border-[1.5px]";
  if (isActive) {
    baseClass += isDark ? " bg-[var(--color-white)] text-[var(--color-black)] border-[var(--color-white)]" : " bg-[var(--color-black)] text-[var(--color-white)] border-[var(--color-black)]";
  } else {
    baseClass += isDark ? " bg-transparent text-[var(--color-white)] border-[var(--color-white)] hover:bg-white/10" : " bg-transparent text-[var(--color-black)] border-[var(--color-black)] hover:bg-black/5";
  }
  return <button onClick={onClick} className={baseClass} style={{ borderRadius: 'var(--radius-main)' }}>{label}</button>;
}