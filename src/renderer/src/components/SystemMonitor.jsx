import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

import bgGauge from '../assets/gauge_bg.svg';
import bgTokens from '../assets/block_tokens.svg';
import bgBattery from '../assets/block_battery.svg';
import bgCpu from '../assets/block_cpu.svg';
import bgRam from '../assets/block_ram.svg';
import bgTemp from '../assets/block_temp.svg';
import bgGpu from '../assets/block_gpu.svg';
import bgDisk from '../assets/block_disk.svg';

import arrowW2B from '../assets/white_to_black_arrow.svg';
import arrowB2W from '../assets/black_to_white_arrow.svg';

import iconBattery from '../assets/icon_battery.svg';
import iconCpu from '../assets/icon_cpu.svg';
import iconRam from '../assets/icon_ram.svg';
import iconTemp from '../assets/icon_temp.svg';
import iconWebSearch from '../assets/icon_web_search.svg';

export default function SystemMonitor({ expanded = false, setCurrentView }) {
  const [stats, setStats] = useState({
    cpuLoad: 0, ramLoad: 0, batteryPercent: 100, isCharging: false, gpuLoad: 0, cpuTemp: 0
  });

  const [history, setHistory] = useState({ cpu: [], ram: [], gpu: [] });
  const [totalTokens, setTotalTokens] = useState(0);
  const [isReloading, setIsReloading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      if (window.api && window.api.getSystemStats) {
        const data = await window.api.getSystemStats();
        setStats(data);
        
        setHistory(prev => ({
          cpu: [...prev.cpu, data.cpuLoad].slice(-20),
          ram: [...prev.ram, data.ramLoad].slice(-20),
          gpu: [...prev.gpu, data.gpuLoad].slice(-20)
        }));

        if (data.cpuLoad > 10 || data.gpuLoad > 10) {
          const tps = Math.round((data.cpuLoad + data.gpuLoad) / 4);
          setTotalTokens(prev => prev + tps);
        }
      }
    };
    
    fetchStats();
    const interval = setInterval(fetchStats, 1000);
    return () => clearInterval(interval);
  }, []);

  const currentTps = Math.round((stats.cpuLoad + stats.gpuLoad) / 4);
  const aiLoad = Math.max(stats.cpuLoad, stats.gpuLoad);
  
  const needleRotation = -90 + (aiLoad * 1.8);

  const handleCardClick = (sectionId) => {
    if (setCurrentView) {
      setCurrentView('settings');
      setTimeout(() => {
        const container = document.getElementById('settings-scroll-container');
        const el = document.getElementById(`section-${sectionId}`);
        if (container && el) {
          container.scrollTo({ top: el.offsetTop - 40, behavior: 'smooth' });
          
          el.classList.add('ring-4', 'ring-[var(--color-black)]', 'scale-[1.02]', 'shadow-2xl');
          setTimeout(() => el.classList.remove('ring-4', 'ring-[var(--color-black)]', 'scale-[1.02]', 'shadow-2xl'), 1500);
        }
      }, 150);
    }
  };

  // 🔥 ПЕРЕЗАГРУЗКА МОДЕЛИ
  const handleReloadModel = async () => {
    setIsReloading(true);
    try {
      if (window.api && window.api.unloadModel) {
        await window.api.unloadModel();
        // Ждём 2 секунды и загружаем заново
        setTimeout(async () => {
          if (window.api && window.api.preloadModel) {
            await window.api.preloadModel('3b');
          }
          setIsReloading(false);
          alert('Модель перезагружена');
        }, 2000);
      }
    } catch (error) {
      console.error('[RELOAD] ошибка:', error);
      setIsReloading(false);
      alert('Ошибка перезагрузки модели');
    }
  };

  if (!expanded) {
    return (
      <div className="w-full h-full flex items-center justify-center pb-50 px-10">
        <div className="w-full max-w-[1100px] flex gap-20 items-end justify-center">
          
          <div className="w-[300px] flex flex-col justify-end gap-10 shrink-0">
            <div className="relative w-full flex justify-center">
              <img src={bgGauge} alt="Gauge" className="absolute bottom-[-120px] w-[280px] max-w-none pointer-events-none" />
              
              <motion.div 
                className="absolute bottom-[5px] w-[4px] h-[160px] bg-[var(--color-black)] rounded-full z-10"
                style={{ left: 'calc(50% - 2px)', transformOrigin: 'bottom center' }}
                animate={{ rotate: needleRotation }}
                transition={{ type: 'spring', stiffness: 60, damping: 15 }}
              />
              <div className="absolute bottom-[0px] left-[calc(50%-7px)] w-[14px] h-[14px] bg-[var(--color-black)] rounded-full z-20" />
            </div>

            <div className="relative w-full h-[180px] overflow-hidden flex flex-col justify-between p-8 shadow-sm" style={{ borderRadius: 'var(--radius-main)' }}>
              <img src={bgTokens} alt="Tokens BG" className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none" />
              <div className="relative z-10 text-[14px] text-[var(--color-black)] font-medium">Total tokens</div>
              <div className="relative z-10 flex items-end justify-between">
                <span className="text-[28px] text-[var(--color-black)] leading-none">{totalTokens}</span>
                <span className="text-[14px] text-[var(--color-black)] font-bold opacity-60 leading-none pb-1">
                  <span className="text-[12px] font-normal mr-1">TPS</span>{currentTps}
                </span>
              </div>
            </div>
          </div>

          <div className="w-full max-w-[800px] grid grid-cols-3 gap-2">
            <DashboardCard bg={bgBattery} title="Battery usage" value={stats.batteryPercent} unit="%" icon={iconBattery} arrow={arrowB2W} isDarkText={false} onClick={() => handleCardClick('battery')} />
            <DashboardCard bg={bgCpu} title="CPU Memory" value={stats.cpuLoad} unit="%" icon={iconCpu} arrow={arrowW2B} isDarkText={true} history={history.cpu} onClick={() => handleCardClick('cpu')} />
            <DashboardCard bg={bgRam} title="RAM Memory" value={stats.ramLoad} unit="%" icon={iconRam} arrow={arrowW2B} isDarkText={true} history={history.ram} onClick={() => handleCardClick('ram')} />
            
            <DashboardCard bg={bgTemp} title="Temperature" value={stats.cpuTemp > 0 ? stats.cpuTemp : '--'} unit="°C" icon={iconTemp} arrow={arrowW2B} isDarkText={true} onClick={() => handleCardClick('temp')} />
            <DashboardCard bg={bgGpu} title="GPU Usage" value={stats.gpuLoad} unit="%" icon={iconCpu} arrow={arrowW2B} isDarkText={true} history={history.gpu} onClick={() => handleCardClick('gpu')} />
            <DashboardCard bg={bgDisk} title="System Load" value={Math.round((stats.cpuLoad + stats.ramLoad) / 2)} unit="%" icon={iconRam} arrow={arrowW2B} isDarkText={true} history={history.cpu} onClick={() => handleCardClick('system')} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="settings-scroll-container" className="flex flex-col gap-8 w-full max-w-6xl mx-auto py-8 h-full overflow-y-auto hidden-scroll relative px-4">
      <div className="flex justify-between items-center shrink-0">
        <h2 className="text-[28px] text-[var(--color-white)] font-bold">System Monitoring</h2>
        
        {/* 🔥 КНОПКА ПЕРЕЗАГРУЗКИ МОДЕЛИ */}
        <button
          onClick={handleReloadModel}
          disabled={isReloading}
          className="px-6 py-3 bg-[var(--color-white)] text-[var(--color-black)] text-[14px] font-bold rounded-full hover:opacity-80 transition-opacity disabled:opacity-50 flex items-center gap-2"
        >
          <img src={iconWebSearch} alt="Reload" className="w-5 h-5 invert" />
          {isReloading ? 'Перезагрузка...' : 'Перезагрузить модель'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 shrink-0 pb-20">
        <DetailSection id="section-battery" title="Battery Usage" value={`${stats.batteryPercent}%`} subvalue={stats.isCharging ? 'Charging' : 'On Battery'}>
          <div className="w-full h-6 bg-[var(--color-input)] rounded-full overflow-hidden mt-4">
            <motion.div className="h-full bg-[var(--color-black)]" initial={{ width: 0 }} animate={{ width: `${stats.batteryPercent}%` }} transition={{ duration: 0.8, ease: "easeOut" }} />
          </div>
        </DetailSection>

        <DetailSection id="section-cpu" title="CPU Memory (Load)" value={`${stats.cpuLoad}%`}><AnimatedChart history={history.cpu} /></DetailSection>
        <DetailSection id="section-ram" title="RAM Memory (Usage)" value={`${stats.ramLoad}%`}><AnimatedChart history={history.ram} /></DetailSection>
        <DetailSection id="section-gpu" title="GPU Usage" value={`${stats.gpuLoad}%`}><AnimatedChart history={history.gpu} /></DetailSection>
        
        <DetailSection id="section-temp" title="System Temperature" value={`${stats.cpuTemp > 0 ? stats.cpuTemp : '--'} °C`}>
          <div className="w-full h-6 bg-[var(--color-input)] rounded-full overflow-hidden mt-4 flex">
             <motion.div className="h-full bg-[var(--color-black)]" initial={{ width: 0 }} animate={{ width: `${Math.min(stats.cpuTemp, 100)}%` }} transition={{ duration: 0.8, ease: "easeOut" }} />
          </div>
        </DetailSection>
      </div>
    </div>
  );
}

// ... DashboardCard, DetailSection, AnimatedChart — без изменений
function DashboardCard({ bg, title, value, unit, icon, arrow, isDarkText, history, onClick }) {
  const textColor = isDarkText ? 'text-[var(--color-black)]' : 'text-[var(--color-white)]';
  const circleBg = isDarkText ? 'bg-[var(--color-black)]' : 'bg-[var(--color-white)]';
  
  return (
    <div className="relative w-full aspect-[284/250] overflow-hidden flex flex-col justify-between p-5 cursor-pointer group shadow-sm transition-transform duration-300 hover:scale-[1.03]" style={{ borderRadius: 'var(--radius-main)' }}>
      <img src={bg} alt="" className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none" />
      
      <div className="relative z-10 flex justify-between items-start w-full">
        <div className="flex flex-col">
          <span className={`text-[14px] font-medium ${textColor} max-w-[90%] leading-tight`}>{title}</span>
          
          <div className="flex items-baseline mt-1">
            <span className={`text-[28px] font-bold ${textColor} leading-none`}>{value}</span>
            <span className={`text-[14px] font-bold ${textColor} ml-1 opacity-70`}>{unit}</span>
          </div>
        </div>
        
        <button onClick={onClick} className={`w-[40px] h-[40px] rounded-full ${circleBg} flex items-center justify-center transition-transform shrink-0 shadow-md`}>
          <img src={arrow} alt="Go" style={{ width: '8px', height: '7px' }} />
        </button>
      </div>
      
      <div className="relative z-10 flex justify-between items-end w-full h-full mt-3">
        {history ? (
          <div className="flex items-end gap-[5px] h-[35px] w-[70px]">
            {history.slice(-4).map((val, i) => (
              <motion.div 
                key={i} 
                className={`w-[8px] rounded-t-sm ${isDarkText ? 'bg-[var(--color-black)]' : 'bg-[var(--color-white)]'}`}
                initial={{ height: 0 }} 
                animate={{ height: `${Math.max(val, 15)}%` }} 
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
              />
            ))}
          </div>
        ) : <div />}
        
        <img src={icon} alt="" className="w-6 h-6 relative z-10" />
      </div>
    </div>
  );
}

function DetailSection({ id, title, value, subvalue, children }) {
  return (
    <div id={id} className="w-full bg-[var(--color-white)] p-8 flex flex-col shadow-sm shrink-0 transition-all duration-500" style={{ borderRadius: 'var(--radius-main)' }}>
      <div className="flex justify-between items-end w-full">
        <span className="text-[14px] text-[var(--color-black)] opacity-60 font-bold">{title}</span>
        <div className="flex flex-col items-end">
           <span className="text-[28px] text-[var(--color-black)] leading-none">{value}</span>
           {subvalue && <span className="text-[12px] text-[var(--color-black)] font-bold mt-1 opacity-50 uppercase tracking-widest">{subvalue}</span>}
        </div>
      </div>
      {children}
    </div>
  );
}

function AnimatedChart({ history }) {
  const displayData = [...history];
  while (displayData.length < 20) displayData.unshift(0);
  return (
    <div className="w-full h-[100px] flex items-end gap-1.5 mt-6">
      {displayData.map((val, i) => (
        <div key={i} className="flex-1 bg-[var(--color-input)] rounded-t-lg h-full flex items-end overflow-hidden">
          <motion.div className="w-full bg-[var(--color-black)] rounded-t-lg" initial={{ height: 0 }} animate={{ height: `${Math.max(val, 2)}%` }} transition={{ type: "spring", stiffness: 100, damping: 20 }} />
        </div>
      ))}
    </div>
  );
}