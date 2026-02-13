
import { Instrument, Track } from './types';

export const TOTAL_STEPS = 64;
export const STEPS_PER_BAR = 16;
export const DEFAULT_BPM = 120;

export const INITIAL_TRACKS: Track[] = [
  { id: 'Kick', name: 'Kick', color: 'bg-rose-500', steps: Array(TOTAL_STEPS).fill(false), freeformNotes: [] },
  { id: 'Snare', name: 'Snare', color: 'bg-indigo-500', steps: Array(TOTAL_STEPS).fill(false), freeformNotes: [] },
  { id: 'HiHat', name: 'Hi-Hat', color: 'bg-emerald-400', steps: Array(TOTAL_STEPS).fill(false), freeformNotes: [] },
  { id: 'OpenHH', name: 'Open HH', color: 'bg-yellow-400', steps: Array(TOTAL_STEPS).fill(false), freeformNotes: [] },
  { id: 'Clap', name: 'Clap', color: 'bg-orange-400', steps: Array(TOTAL_STEPS).fill(false), freeformNotes: [] },
  { id: 'Cowbell', name: 'Cowbell', color: 'bg-fuchsia-400', steps: Array(TOTAL_STEPS).fill(false), freeformNotes: [] },
];

export const INSTRUMENT_MIDI_MAP: Record<Instrument, number> = {
  Kick: 36,
  Snare: 38,
  HiHat: 42,
  OpenHH: 46,
  Clap: 39,
  Cowbell: 56,
};

export interface BeatPreset {
  name: string;
  bpm: number;
  patterns: Record<string, number[]>;
}

export const BEAT_PRESETS: BeatPreset[] = [
  {
    name: "Classic House",
    bpm: 126,
    patterns: {
      Kick: [0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60],
      Clap: [4, 12, 20, 28, 36, 44, 52, 60],
      HiHat: [2, 6, 10, 14, 18, 22, 26, 30, 34, 38, 42, 46, 50, 54, 58, 62],
      OpenHH: [2, 10, 18, 26, 34, 42, 50, 58]
    }
  },
  {
    name: "Trap Banger",
    bpm: 140,
    patterns: {
      Kick: [0, 10, 16, 26, 32, 42, 48, 58],
      Snare: [8, 24, 40, 56],
      HiHat: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62, 63],
      Cowbell: [14, 30, 46, 62]
    }
  },
  {
    name: "Boom Bap",
    bpm: 92,
    patterns: {
      Kick: [0, 11, 16, 19, 32, 43, 48, 51],
      Snare: [8, 24, 40, 56],
      HiHat: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62],
    }
  },
  {
    name: "Dark Techno",
    bpm: 132,
    patterns: {
      Kick: [0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60],
      HiHat: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31],
      Clap: [8, 24, 40, 56],
      Cowbell: [2, 6, 10, 14, 18, 22, 26, 30, 34, 38, 42, 46, 50, 54, 58, 62]
    }
  }
];
