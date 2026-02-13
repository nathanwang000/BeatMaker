
import React from 'react';
import { Play, Pause, Square, Download, Wand2 } from 'lucide-react';

interface TransportProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStop: () => void;
  bpm: number;
  onBpmChange: (bpm: number) => void;
  onExport: () => void;
  onOpenAI: () => void;
}

const Transport: React.FC<TransportProps> = ({
  isPlaying,
  onTogglePlay,
  onStop,
  bpm,
  onBpmChange,
  onExport,
  onOpenAI
}) => {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 md:p-6 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl md:rounded-3xl shadow-2xl">
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={onTogglePlay}
          className="w-14 h-14 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 active:scale-95 rounded-2xl text-white transition-all shadow-lg shadow-indigo-500/20"
        >
          {isPlaying ? <Pause size={28} /> : <Play size={28} fill="currentColor" />}
        </button>
        <button
          onClick={onStop}
          className="w-14 h-14 flex items-center justify-center bg-slate-800 hover:bg-slate-700 active:scale-95 rounded-2xl text-slate-300 transition-all"
        >
          <Square size={24} fill="currentColor" />
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-800/50 px-4 py-3 rounded-2xl">
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">BPM</label>
          <input
            type="number"
            value={bpm}
            onChange={(e) => onBpmChange(parseInt(e.target.value) || 0)}
            className="bg-transparent text-xl font-bold w-14 focus:outline-none text-indigo-400 text-center"
            min="40"
            max="240"
          />
        </div>
        <input
          type="range"
          min="40"
          max="240"
          value={bpm}
          onChange={(e) => onBpmChange(parseInt(e.target.value))}
          className="w-full sm:w-32 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onOpenAI}
          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-br from-violet-600 to-indigo-700 hover:from-violet-500 hover:to-indigo-600 active:scale-95 rounded-2xl font-bold text-sm transition-all hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]"
        >
          <Wand2 size={18} />
          <span className="whitespace-nowrap">AI Gen</span>
        </button>
        <button
          onClick={onExport}
          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 active:scale-95 rounded-2xl font-bold text-sm transition-all border border-slate-700"
        >
          <Download size={18} />
          <span className="whitespace-nowrap">MIDI</span>
        </button>
      </div>
    </div>
  );
};

export default Transport;
