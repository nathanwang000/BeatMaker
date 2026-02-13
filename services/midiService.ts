
import { Track } from '../types';
import { INSTRUMENT_MIDI_MAP, TOTAL_STEPS } from '../constants';

/**
 * Encodes a number into a MIDI variable-length quantity.
 */
function encodeVariableLength(value: number): number[] {
  const bytes: number[] = [];
  bytes.push(value & 0x7F);
  while (value > 0x7F) {
    value >>= 7;
    bytes.push((value & 0x7F) | 0x80);
  }
  return bytes.reverse();
}

/**
 * Encodes a 32-bit integer into a 4-byte array.
 */
function encodeInt32(value: number): number[] {
  return [
    (value >> 24) & 0xFF,
    (value >> 16) & 0xFF,
    (value >> 8) & 0xFF,
    value & 0xFF
  ];
}

interface MidiEvent {
  tick: number;
  status: number;
  data1: number;
  data2: number;
}

/**
 * Creates a Standard MIDI File (SMF) Type 0 from the sequencer grid.
 */
export const exportToMIDI = (tracks: Track[], bpm: number) => {
  const TICKS_PER_QUARTER = 128;
  const TICKS_PER_STEP = 32; // (128 ticks / 4 steps per quarter)
  const TOTAL_TICKS = TOTAL_STEPS * TICKS_PER_STEP;
  const DRUM_CHANNEL = 0x09;
  
  const midiEvents: MidiEvent[] = [];

  tracks.forEach(track => {
    const midiNote = INSTRUMENT_MIDI_MAP[track.id];

    // 1. Process Quantized Steps
    track.steps.forEach((active, step) => {
      if (active) {
        const startTick = step * TICKS_PER_STEP;
        midiEvents.push({
          tick: startTick,
          status: 0x90 | DRUM_CHANNEL,
          data1: midiNote,
          data2: 100
        });
        midiEvents.push({
          tick: startTick + 10,
          status: 0x80 | DRUM_CHANNEL,
          data1: midiNote,
          data2: 0
        });
      }
    });

    // 2. Process Freeform Notes (Precise)
    track.freeformNotes.forEach(note => {
      const startTick = Math.round(note.offset * TOTAL_TICKS);
      midiEvents.push({
        tick: startTick,
        status: 0x90 | DRUM_CHANNEL,
        data1: midiNote,
        data2: 110 // Slightly louder accent for human feel
      });
      midiEvents.push({
        tick: startTick + 10,
        status: 0x80 | DRUM_CHANNEL,
        data1: midiNote,
        data2: 0
      });
    });
  });

  // 3. Sort events by tick time
  midiEvents.sort((a, b) => a.tick - b.tick);

  // 4. Build the Track Data
  const trackBytes: number[] = [];
  const tempo = Math.round(60000000 / bpm);
  trackBytes.push(0x00, 0xFF, 0x51, 0x03, (tempo >> 16) & 0xFF, (tempo >> 8) & 0xFF, tempo & 0xFF);

  let lastTick = 0;
  midiEvents.forEach(event => {
    const deltaTime = Math.max(0, event.tick - lastTick);
    trackBytes.push(...encodeVariableLength(deltaTime));
    trackBytes.push(event.status, event.data1, event.data2);
    lastTick = event.tick;
  });

  trackBytes.push(0x00, 0xFF, 0x2F, 0x00);

  const headerChunk = [
    0x4D, 0x54, 0x68, 0x64, 0x00, 0x00, 0x00, 0x06, 0x00, 0x00, 0x00, 0x01, (TICKS_PER_QUARTER >> 8) & 0xFF, TICKS_PER_QUARTER & 0xFF
  ];

  const trackChunkHeader = [
    0x4D, 0x54, 0x72, 0x6B, ...encodeInt32(trackBytes.length)
  ];

  const fileData = new Uint8Array([...headerChunk, ...trackChunkHeader, ...trackBytes]);
  const blob = new Blob([fileData], { type: 'audio/midi' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `midnight_human_beat_${bpm}bpm.mid`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
