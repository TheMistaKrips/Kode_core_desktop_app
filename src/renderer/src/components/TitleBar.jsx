import React from 'react';
import { Minus, Square, X } from 'lucide-react';

export default function TitleBar() {
  const handleControl = (action) => {
    if (window.api && window.api.windowControl) {
      window.api.windowControl(action);
    }
  };

  return (
    <div className="titlebar-drag h-12 w-full flex items-center justify-between px-4 z-[500] shrink-0 pointer-events-none relative rounded-t-[30px] overflow-hidden">
      <div className="flex items-center gap-2 pl-2 pointer-events-auto mix-blend-difference text-white opacity-80">
        <span className="text-[12px] font-bold tracking-widest uppercase">Prismi</span>
      </div>
      
      <div className="flex items-center h-full titlebar-nodrag -mr-4 pointer-events-auto mix-blend-difference text-white">
        <button onClick={() => handleControl('minimize')} className="h-full px-5 hover:bg-white/20 transition-colors flex items-center justify-center">
          <Minus size={18} />
        </button>
        <button onClick={() => handleControl('maximize')} className="h-full px-5 hover:bg-white/20 transition-colors flex items-center justify-center">
          <Square size={14} />
        </button>
        <button onClick={() => handleControl('close')} className="h-full px-5 hover:bg-red-500 transition-colors flex items-center justify-center rounded-tr-[30px]">
          <X size={20} />
        </button>
      </div>
    </div>
  );
}