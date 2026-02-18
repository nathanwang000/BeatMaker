
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { INITIAL_TRACKS, TOTAL_STEPS, DEFAULT_BPM, BEAT_PRESETS, BeatPreset } from './constants';
import { Track, FreeformNote } from './types';
import SequencerGrid from './components/SequencerGrid';
import Transport from './components/Transport';
import PerformancePads from './components/PerformancePads';
import { audioEngine } from './services/audioService';
import { exportToMIDI } from './services/midiService';
import { generateAIPattern } from './services/geminiService';
import { Music, AlertCircle, X, Sparkles, Loader2, Keyboard, Zap, Smartphone, Trash2 } from 'lucide-react';

const DEBOUNCE_MS = 65; 

const App: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>(INITIAL_TRACKS);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [bpm, setBpm] = useState(DEFAULT_BPM);
  const [selectedTrackIdx, setSelectedTrackIdx] = useState(0);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<number | null>(null);
  const loopStartAudioTimeRef = useRef<number>(0);
  const lastStepScheduledRef = useRef<number>(-1);
  const tracksRef = useRef<Track[]>(INITIAL_TRACKS);
  const bpmRef = useRef<number>(DEFAULT_BPM);
  
  const isPlayingRef = useRef(false);
  const currentStepRef = useRef(0);
  const lastTriggerTimesRef = useRef<Record<string, number>>({});

  // Global Audio Unlocker for Mobile
  useEffect(() => {
    const unlockAudio = () => {
      audioEngine.init();
      // Only need to do this once
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);
    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);

  const handleDeleteFreeformNote = useCallback((trackIdx: number, noteId: string) => {
    setTracks(prev => {
      const next = [...prev];
      next[trackIdx] = {
        ...next[trackIdx],
        freeformNotes: next[trackIdx].freeformNotes.filter(n => n.id !== noteId)
      };
      return next;
    });
  }, []);

  const handleToggleStep = useCallback((trackIdx: number, stepIdx: number) => {
    // Crucial for mobile: init on every tap to ensure context is alive
    audioEngine.init();
    
    setTracks(prev => {
      const next = [...prev];
      next[trackIdx] = {
        ...next[trackIdx],
        steps: [...next[trackIdx].steps]
      };
      next[trackIdx].steps[stepIdx] = !next[trackIdx].steps[stepIdx];
      if (next[trackIdx].steps[stepIdx]) {
        audioEngine.playInstrument(next[trackIdx].id);
      }
      return next;
    });
  }, []);

  const handleClearTrack = useCallback((trackIdx: number) => {
    setTracks(prev => {
      const next = [...prev];
      next[trackIdx] = {
        ...next[trackIdx],
        steps: Array(TOTAL_STEPS).fill(false),
        freeformNotes: []
      };
      return next;
    });
  }, []);

  const handleClearAll = useCallback(() => {
    setTracks(prev => prev.map(track => ({
      ...track,
      steps: Array(TOTAL_STEPS).fill(false),
      freeformNotes: []
    })));
    setIsClearModalOpen(false);
  }, []);

  const handleLoadPreset = (preset: BeatPreset) => {
    audioEngine.init(); // Mobile unlock
    setBpm(preset.bpm);
    setTracks(prev => prev.map(track => {
      const newSteps = Array(TOTAL_STEPS).fill(false);
      const patternIndices = preset.patterns[track.id];
      if (patternIndices) {
        patternIndices.forEach(idx => {
          if (idx >= 0 && idx < TOTAL_STEPS) newSteps[idx] = true;
        });
      }
      return { ...track, steps: newSteps, freeformNotes: [] };
    }));
  };

  const recordNote = useCallback((trackIdx: number) => {
    const trackId = tracksRef.current[trackIdx].id;
    const nowMs = Date.now();
    
    if (lastTriggerTimesRef.current[trackId] && (nowMs - lastTriggerTimesRef.current[trackId] < DEBOUNCE_MS)) {
      return;
    }
    lastTriggerTimesRef.current[trackId] = nowMs;

    // Mobile: Init must happen in the synchronous event call chain
    const ctx = audioEngine.init();
    if (!ctx) return;
    
    audioEngine.playInstrument(trackId);

    if (!isPlayingRef.current) {
      handleToggleStep(trackIdx, currentStepRef.current);
      return;
    }

    const stepDuration = (60000 / bpmRef.current) / 4 / 1000;
    const loopDuration = stepDuration * TOTAL_STEPS;
    const currentTime = ctx.currentTime;
    
    const elapsedSinceStart = currentTime - loopStartAudioTimeRef.current;
    const offset = (elapsedSinceStart % loopDuration) / loopDuration;

    const newNote: FreeformNote = {
      id: Math.random().toString(36).substr(2, 9),
      offset: offset
    };

    setTracks(prev => {
      const next = [...prev];
      next[trackIdx] = {
        ...next[trackIdx],
        freeformNotes: [...next[trackIdx].freeformNotes, newNote]
      };
      return next;
    });
  }, [handleToggleStep]); 

  // High-Precision Sequencer Engine
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      lastStepScheduledRef.current = -1;
      return;
    }

    const ctx = audioEngine.init();
    if (!ctx) return;

    const scheduleLookahead = 0.1;
    loopStartAudioTimeRef.current = ctx.currentTime;

    const scheduler = () => {
      const stepDuration = (60000 / bpmRef.current) / 4 / 1000;
      const loopDuration = stepDuration * TOTAL_STEPS;
      const now = ctx.currentTime;
      const elapsedSinceStart = now - loopStartAudioTimeRef.current;

      const currentStepIdx = Math.floor(elapsedSinceStart / stepDuration) % TOTAL_STEPS;
      setCurrentStep(currentStepIdx);

      while ( (lastStepScheduledRef.current + 1) * stepDuration < elapsedSinceStart + scheduleLookahead ) {
        const nextStep = lastStepScheduledRef.current + 1;
        const nextStepTime = nextStep * stepDuration;
        const absoluteScheduleTime = loopStartAudioTimeRef.current + nextStepTime;
        
        const realStepIdx = nextStep % TOTAL_STEPS;
        const currentLoopIndex = Math.floor(nextStep / TOTAL_STEPS);
        
        tracksRef.current.forEach(track => {
          if (track.steps[realStepIdx]) {
            audioEngine.playInstrument(track.id, absoluteScheduleTime);
          }
          
          const stepStartOffset = realStepIdx / TOTAL_STEPS;
          const stepEndOffset = (realStepIdx + 1) / TOTAL_STEPS;
          
          track.freeformNotes.forEach(note => {
            if (note.offset >= stepStartOffset && note.offset < stepEndOffset) {
              const notePreciseTime = loopStartAudioTimeRef.current + (currentLoopIndex * loopDuration) + (note.offset * loopDuration);
              if (notePreciseTime > now - 0.01) {
                audioEngine.playInstrument(track.id, notePreciseTime);
              }
            }
          });
        });
        
        lastStepScheduledRef.current = nextStep;
      }
    };

    timerRef.current = window.setInterval(scheduler, 25);
    return () => { 
      if (timerRef.current) clearInterval(timerRef.current); 
    };
  }, [isPlaying]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const el = document.activeElement;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return;
      
      const recordKeys = ['ArrowLeft', 'ArrowRight', 'f', 'j', 'd', 'k'];
      if (recordKeys.includes(e.key)) {
        e.preventDefault();
        recordNote(selectedTrackIdx);
      }
      
      if (e.key === ' ') {
        e.preventDefault();
        audioEngine.init(); // Unlock on space too
        setIsPlaying(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [recordNote, selectedTrackIdx]);

  const handleTogglePlay = () => {
    // Explicit init on the actual button click handler
    audioEngine.init();
    setIsPlaying(prev => !prev);
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentStep(0);
    lastStepScheduledRef.current = -1;
  };

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    setError(null);
    try {
      const response = await generateAIPattern(aiPrompt);
      if (response && response.patterns) {
        setTracks(prev => prev.map(track => {
          const newSteps = Array(TOTAL_STEPS).fill(false);
          const patternIndices = response.patterns[track.id as any];
          if (patternIndices) patternIndices.forEach(idx => { if (idx >= 0 && idx < TOTAL_STEPS) newSteps[idx] = true; });
          return { ...track, steps: newSteps, freeformNotes: [] };
        }));
        setIsAIModalOpen(false);
        setAiPrompt('');
      } else {
        setError("AI couldn't catch the rhythm. Try describing it differently.");
      }
    } catch (err) {
      setError("AI is currently offline. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col p-4 md:p-8 select-none">
      <header className="max-w-7xl mx-auto w-full mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.5)]">
            <Music className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Midnight <span className="text-indigo-500">Beatmaker</span></h1>
            <p className="text-slate-500 text-sm font-medium">Unquantized 4 Bar Studio</p>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-slate-900 border border-slate-800 rounded-full text-xs font-semibold text-slate-400">
          <Keyboard size={14} className="text-indigo-400" />
          <span><kbd className="bg-slate-800 px-1 rounded text-slate-200">Space</kbd> Play | <kbd className="bg-slate-800 px-1 rounded text-slate-200">F/J/Arrows</kbd> Live Jam</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full flex flex-col gap-6 flex-grow">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest px-2">
            <Zap size={14} className="text-amber-400" />
            <span>Instant Inspiration</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 px-1 no-scrollbar">
            {BEAT_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handleLoadPreset(preset)}
                className="flex-shrink-0 px-6 py-3 bg-slate-900/50 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 rounded-2xl text-sm font-semibold transition-all hover:scale-105 active:scale-95 group"
              >
                <span className="text-slate-300 group-hover:text-white">{preset.name}</span>
                <span className="ml-2 text-[10px] text-slate-600 group-hover:text-indigo-400 uppercase tracking-tighter font-bold">{preset.bpm} BPM</span>
              </button>
            ))}
          </div>
        </div>

        <div className="relative bg-slate-900/40 border border-slate-800/60 rounded-3xl p-6 shadow-2xl overflow-hidden backdrop-blur-sm">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 0)', backgroundSize: '40px 40px' }} />
          <SequencerGrid
            tracks={tracks}
            currentStep={currentStep}
            onToggleStep={handleToggleStep}
            onClearTrack={handleClearTrack}
            onDeleteFreeform={handleDeleteFreeformNote}
            isPlaying={isPlaying}
            selectedTrackIdx={selectedTrackIdx}
            onSelectTrack={setSelectedTrackIdx}
          />
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest px-2">
            <Smartphone size={14} className="text-emerald-400" />
            <span>Performance Pads</span>
          </div>
          <PerformancePads 
            tracks={tracks} 
            onTriggerPad={recordNote} 
          />
        </div>

        <div className="sticky bottom-4 md:bottom-8 z-40">
          <Transport
            isPlaying={isPlaying}
            onTogglePlay={handleTogglePlay}
            onStop={handleStop}
            bpm={bpm}
            onBpmChange={setBpm}
            onExport={() => exportToMIDI(tracks, bpm)}
            onOpenAI={() => setIsAIModalOpen(true)}
            onClearAll={() => setIsClearModalOpen(true)}
          />
        </div>
      </main>

      {/* AI Modal */}
      {isAIModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Sparkles className="text-indigo-400" size={20} />
                <h2 className="text-lg font-bold">AI Pattern Generator</h2>
              </div>
              <button onClick={() => setIsAIModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g., A heavy phonk beat with aggressive cowbells..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-200 placeholder:text-slate-700 focus:ring-2 focus:ring-indigo-500/50 outline-none min-h-[140px]"
                disabled={isGenerating}
                autoFocus
              />
              {error && <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-lg text-sm">{error}</div>}
              <button
                onClick={handleGenerateAI}
                disabled={isGenerating || !aiPrompt.trim()}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl font-bold text-white flex items-center justify-center gap-2"
              >
                {isGenerating ? <><Loader2 className="animate-spin" size={20} />Analyzing...</> : <><Sparkles size={20} />Generate</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Confirmation Modal */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h2 className="text-xl font-bold mb-2">Clear Everything?</h2>
              <p className="text-slate-400 text-sm mb-6">This will reset all 4 bars, including unquantized performance notes. You can't undo this.</p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleClearAll}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-500 rounded-xl font-bold text-white transition-colors"
                >
                  Yes, Clear All
                </button>
                <button
                  onClick={() => setIsClearModalOpen(false)}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-slate-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="max-w-7xl mx-auto w-full mt-12 py-6 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between text-slate-600 text-[10px] uppercase tracking-widest font-semibold">
        <p>&copy; 2024 Midnight Beatmaker Studio</p>
        <div className="flex gap-6 mt-4 md:mt-0">
          <span className="hover:text-slate-400 cursor-pointer">Unquantized Engine V3.2</span>
          <span className="hover:text-slate-400 cursor-pointer">Precise MIDI</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
