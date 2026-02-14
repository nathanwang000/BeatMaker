
import React from 'react';
import { Track } from '../types';

interface PerformancePadsProps {
  tracks: Track[];
  onTriggerPad: (trackIdx: number) => void;
}

const PerformancePads: React.FC<PerformancePadsProps> = React.memo(({ tracks, onTriggerPad }) => {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
      {tracks.map((track, idx) => {
        // Unified pointer handling for high-performance touch and mouse interaction
        const handlePointerDown = (e: React.PointerEvent) => {
          // Prevent browser scrolling or multi-touch gestures from interfering with the pad
          if (e.pointerType === 'touch') {
            e.currentTarget.releasePointerCapture(e.pointerId);
          }
          onTriggerPad(idx);
        };

        return (
          <button
            key={track.id}
            onPointerDown={handlePointerDown}
            // touch-action: none is critical to prevent ghost clicks and gesture delays
            style={{ touchAction: 'none' }}
            className={`
              relative group aspect-square rounded-2xl border border-slate-800 bg-slate-900/40 
              flex flex-col items-center justify-center gap-2 transition-all duration-75
              active:scale-95 active:brightness-125 select-none
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
});

PerformancePads.displayName = 'PerformancePads';

export default PerformancePads;
