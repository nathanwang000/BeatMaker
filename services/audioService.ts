
import { Instrument } from '../types';

class AudioEngine {
  private ctx: AudioContext | null = null;

  init() {
    if (!this.ctx) {
      // @ts-ignore - support older webkit browsers
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    
    // Crucial for mobile: resume context if it's suspended by the browser's auto-play policy
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(err => console.error("Could not resume AudioContext:", err));
    }
    
    return this.ctx;
  }

  isReady() {
    return this.ctx && this.ctx.state === 'running';
  }

  getCurrentTime() {
    return this.ctx?.currentTime || 0;
  }

  playInstrument(inst: Instrument, scheduledTime?: number) {
    if (!this.ctx) this.init();
    if (!this.ctx) return;

    // Ensure we are in a running state before playing
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const time = scheduledTime !== undefined ? scheduledTime : this.ctx.currentTime;
    
    switch (inst) {
      case 'Kick':
        this.playKick(time);
        break;
      case 'Snare':
        this.playSnare(time);
        break;
      case 'HiHat':
        this.playHiHat(time, 0.05);
        break;
      case 'OpenHH':
        this.playHiHat(time, 0.2);
        break;
      case 'Clap':
        this.playClap(time);
        break;
      case 'Cowbell':
        this.playCowbell(time);
        break;
    }
  }

  private playKick(time: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
    gain.gain.setValueAtTime(1, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

    osc.start(time);
    osc.stop(time + 0.5);
  }

  private playSnare(time: number) {
    if (!this.ctx) return;
    const noise = this.ctx.createBufferSource();
    const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.1, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000;
    noise.connect(noiseFilter);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(1, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(100, time);
    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(0.7, time);
    oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);

    noise.start(time);
    osc.start(time);
    noise.stop(time + 0.2);
    osc.stop(time + 0.2);
  }

  private playHiHat(time: number, duration: number) {
    if (!this.ctx) return;
    const noise = this.ctx.createBufferSource();
    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * duration, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7000;
    noise.connect(filter);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(time);
    noise.stop(time + duration);
  }

  private playClap(time: number) {
    if (!this.ctx) return;
    const noise = this.ctx.createBufferSource();
    const bufferSize = this.ctx.sampleRate * 0.1;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1500;
    noise.connect(filter);

    const gain = this.ctx.createGain();
    for (let i = 0; i < 4; i++) {
      gain.gain.setValueAtTime(0.8, time + i * 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, time + i * 0.01 + 0.01);
    }
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
    
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(time);
    noise.stop(time + 0.2);
  }

  private playCowbell(time: number) {
    if (!this.ctx) return;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = 'square';
    osc2.type = 'square';
    osc1.frequency.value = 540;
    osc2.frequency.value = 800;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + 0.3);
    osc2.stop(time + 0.3);
  }
}

export const audioEngine = new AudioEngine();
