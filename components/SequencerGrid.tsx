
import React, { useRef } from 'react';
import { Track } from '../types';
import { TOTAL_STEPS, STEPS_PER_BAR } from '../constants';
import { Circle, Trash2, XCircle } from 'lucide-react';

interface SequencerGridProps {
  tracks: Track[];
  currentStep: number;
  onToggleStep: (trackIdx: number, stepIdx: number) => void;
  onClearTrack: (trackIdx: number) => void;
  onDeleteFreeform: (trackIdx: number, noteId: string) => void;
  isPlaying: boolean;
  selectedTrackIdx: number;
  onSelectTrack: (index: number) => void;
}

const SequencerGrid: React.FC<SequencerGridProps> = ({ 
  tracks, 
  currentStep, 
  onToggleStep, 
  onClearTrack,
  onDeleteFreeform,
  isPlaying, 
  selectedTrackIdx, 
  onSelectTrack 
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-col gap-1 w-full overflow-x-auto pb-4 custom-scrollbar" ref={scrollRef}>
      {tracks.map((track, trackIdx) => {
        const isSelected = selectedTrackIdx === trackIdx;
        
        return (
          <div key={track.id} className="flex items-center gap-2 min-w-max group">
            <div className="w-32 flex-shrink-0 flex items-center gap-1">
              <button 
                onClick={() => onSelectTrack(trackIdx)}
                className={`
                  flex-grow flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200
                  ${isSelected 
                    ? 'bg-slate-800 text-white ring-1 ring-indigo-500/50 shadow-lg' 
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}
                `}
              >
                <span className="text-xs font-bold uppercase tracking-wider truncate">{track.name}</span>
                {isSelected && <Circle size={8} className="fill-indigo-500 text-indigo-500 animate-pulse ml-2" />}
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClearTrack(trackIdx);
                }}
                className="p-2 text-slate-600 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                title="Clear Track"
              >
                <Trash2 size={14} />
              </button>
            </div>
            
            <div className={`
              relative flex gap-1 p-1 rounded-lg transition-colors duration-200
              ${isSelected ? 'bg-slate-800/30' : 'bg-transparent'}
            `}>
              {/* Grid Cells */}
              {track.steps.map((active, stepIdx) => {
                const isBarStart = stepIdx % STEPS_PER_BAR === 0;
                const isBeatsStart = stepIdx % 4 === 0;
                const isCurrent = isPlaying && currentStep === stepIdx;
                
                return (
                  <button
                    key={stepIdx}
                    onClick={() => onToggleStep(trackIdx, stepIdx)}
                    className={`
                      w-8 h-10 rounded-sm transition-all duration-75
                      ${active ? `${track.color} shadow-lg shadow-${track.color}/20` : 'bg-slate-800 hover:bg-slate-700'}
                      ${isBarStart ? 'border-l-2 border-slate-600' : ''}
                      ${isBeatsStart && !isBarStart ? 'border-l border-slate-700' : ''}
                      ${isCurrent ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 z-10' : ''}
                      ${active && isCurrent ? 'brightness-125 scale-105' : ''}
                      ${!active && isSelected && isCurrent ? 'bg-slate-600' : ''}
                    `}
                  />
                );
              })}

              {/* Freeform Notes Layer */}
              <div className="absolute inset-y-1 left-1 right-1 pointer-events-none">
                {track.freeformNotes.map((note) => (
                  <button
                    key={note.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteFreeform(trackIdx, note.id);
                    }}
                    className={`
                      absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border border-white/30 pointer-events-auto
                      ${track.color} shadow-[0_0_8px_rgba(255,255,255,0.4)] hover:scale-150 transition-transform cursor-pointer flex items-center justify-center
                    `}
                    style={{ left: `calc(${note.offset * 100}% - 6px)` }}
                    title="Delete Freeform Note"
                  >
                    <div className="w-1 h-1 bg-white rounded-full" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SequencerGrid;
