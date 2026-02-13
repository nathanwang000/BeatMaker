
export type Instrument = 'Kick' | 'Snare' | 'HiHat' | 'OpenHH' | 'Clap' | 'Cowbell';

export interface FreeformNote {
  id: string;
  offset: number; // 0 to 1 representing position in the 4-bar loop
}

export interface Track {
  id: Instrument;
  name: string;
  color: string;
  steps: boolean[]; // 64 steps for 4 bars (quantized)
  freeformNotes: FreeformNote[]; // Unquantized notes
}

export interface SequencerState {
  bpm: number;
  isPlaying: boolean;
  currentStep: number;
  tracks: Track[];
}

export interface AIPatternResponse {
  patterns: {
    [key in Instrument]?: number[]; // Array of indices (0-63) where notes are played
  };
  genre: string;
}
