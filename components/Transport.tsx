
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Square, Download, Wand2, Trash2, Plus, Minus, Timer } from 'lucide-react';

interface TransportProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStop: () => void;
  bpm: number;
  onBpmChange: (bpm: number) => void;
  onExport: () => void;
  onOpenAI: () => void;
  onClearAll: () => void;
}

const Transport: React.FC<TransportProps> = ({
  isPlaying,
  onTogglePlay,
  onStop,
  bpm,
  onBpmChange,
  onExport,
  onOpenAI,
  onClearAll
}) => {
  const tapTimes = useRef<number[]>([]);
  const [isTapping, setIsTapping] = useState(false);

  const handleTap = () => {
    const now = Date.now();
    setIsTapping(true);
    setTimeout(() => setIsTapping(false), 100);

    // Filter out taps that are too far apart (reset if > 2 seconds)
    if (tapTimes.current.length > 0 && now - tapTimes.current[tapTimes.current.length - 1] > 2000) {
      tapTimes.current = [];
    }

    tapTimes.current.push(now);

    if (tapTimes.current.length >= 2) {
      const intervals = [];
      for (let i = 1; i < tapTimes.current.length; i++) {
        intervals.push(tapTimes.current[i] - tapTimes.current[i - 1]);
      }
      
      const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
      const newBpm = Math.round(60000 / avgInterval);
      
      if (newBpm >= 40 && newBpm <= 240) {
        onBpmChange(newBpm);
      }
    }

    if (tapTimes.current.length > 4) {
      tapTimes.current.shift();
    }
  };

  const adjustBpm = (delta: number) => {
    const next = bpm + delta;
    if (next >= 40 && next <= 240) {
      onBpmChange(next);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 md:p-6 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl md:rounded-3xl shadow-2xl">
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={onTogglePlay}
          className="w-14 h-14 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 active:scale-95 rounded-2xl text-white transition-all shadow-lg shadow-indigo-500/20"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause size={28} /> : <Play size={28} fill="currentColor" />}
        </button>
        <button
          onClick={onStop}
          className="w-14 h-14 flex items-center justify-center bg-slate-800 hover:bg-slate-700 active:scale-95 rounded-2xl text-slate-300 transition-all"
          title="Stop & Reset"
        >
          <Square size={24} fill="currentColor" />
        </button>
      </div>

      <div className="flex flex-col gap-3 flex-grow max-w-lg">
        <div className="flex items-center gap-2 bg-slate-800/50 p-2 rounded-2xl">
          <button 
            onClick={() => adjustBpm(-1)}
            className="w-10 h-10 flex items-center justify-center bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            <Minus size={18} />
          </button>
          
          <div className="flex-grow flex flex-col items-center justify-center px-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-0.5">BPM</span>
            <input
              type="number"
              value={bpm}
              onChange={(e) => onBpmChange(parseInt(e.target.value) || 0)}
              className="bg-transparent text-2xl font-black focus:outline-none text-indigo-400 text-center w-full"
              min="40"
              max="240"
            />
          </div>

          <button 
            onClick={() => adjustBpm(1)}
            className="w-10 h-10 flex items-center justify-center bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            <Plus size={18} />
          </button>

          <div className="w-px h-8 bg-slate-700 mx-1" />

          <button
            onClick={handleTap}
            className={`
              h-10 px-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all
              ${isTapping 
                ? 'bg-indigo-500 text-white scale-95 shadow-[0_0_15px_rgba(99,102,241,0.5)]' 
                : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'}
            `}
          >
            Tap
          </button>
        </div>
        
        <div className="px-2">
          <input
            type="range"
            min="40"
            max="240"
            value={bpm}
            onChange={(e) => onBpmChange(parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 sm:flex items-center gap-2">
        <button
          onClick={onClearAll}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800/50 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/50 active:scale-95 rounded-2xl font-bold text-sm transition-all border border-slate-700 text-slate-400"
          title="Clear All Tracks"
        >
          <Trash2 size={18} />
          <span className="hidden sm:inline whitespace-nowrap">Clear</span>
        </button>
        <button
          onClick={onOpenAI}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-br from-violet-600 to-indigo-700 hover:from-violet-500 hover:to-indigo-600 active:scale-95 rounded-2xl font-bold text-sm transition-all hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] text-white"
        >
          <Wand2 size={18} />
          <span className="hidden sm:inline whitespace-nowrap">AI Gen</span>
          <span className="sm:hidden">AI</span>
        </button>
        <button
          onClick={onExport}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 active:scale-95 rounded-2xl font-bold text-sm transition-all border border-slate-700 text-slate-200"
        >
          <Download size={18} />
          <span className="hidden sm:inline whitespace-nowrap">Export</span>
          <span className="sm:hidden">MIDI</span>
        </button>
      </div>
    </div>
  );
};

export default Transport;
