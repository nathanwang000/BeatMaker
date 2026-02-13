
import React from 'react';
import { Track } from '../types';

interface PerformancePadsProps {
  tracks: Track[];
  onTriggerPad: (trackIdx: number) => void;
}

const PerformancePads: React.FC<PerformancePadsProps> = ({ tracks, onTriggerPad }) => {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
      {tracks.map((track, idx) => {
        // Handle touch events for lower latency on mobile
        const handleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
          e.preventDefault();
          onTriggerPad(idx);
        };

        return (
          <button
            key={track.id}
            onMouseDown={handleInteraction}
            onTouchStart={handleInteraction}
            className={`
              relative group aspect-square rounded-2xl border border-slate-800 bg-slate-900/40 
              flex flex-col items-center justify-center gap-2 transition-all duration-75
              active:scale-95 active:brightness-125
            `}
          >
            {/* Visual glow on interaction */}
            <div className={`
              absolute inset-0 rounded-2xl opacity-0 group-active:opacity-20 transition-opacity duration-75
              ${track.color}
            `} />
            
            <div className={`w-3 h-3 rounded-full ${track.color} shadow-[0_0_10px_rgba(255,255,255,0.2)]`} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 group-active:text-white">
              {track.name}
            </span>

            {/* Subtle background glow */}
            <div className={`
              absolute -z-10 inset-4 blur-xl opacity-0 group-active:opacity-30 transition-opacity
              ${track.color}
            `} />
          </button>
        );
      })}
    </div>
  );
};

export default PerformancePads;
