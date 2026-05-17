import Hls from 'hls.js';
import { api } from './api';
import type { ScTrack, ScTranscoding } from '@/types/soundcloud';

/**
 * Single shared <audio> element + Web Audio graph used for the EQ.
 * The graph is:
 *   <audio> -> MediaElementSource -> [BiquadFilter] x N -> Gain -> destination
 */

export const EQ_FREQUENCIES = [60, 150, 400, 1000, 2400, 6000, 12000, 16000];

export type AudioListenerEvent =
  | { type: 'time'; current: number; duration: number }
  | { type: 'play' }
  | { type: 'pause' }
  | { type: 'ended' }
  | { type: 'loading' }
  | { type: 'ready' }
  | { type: 'error'; message: string };

class AudioEngine {
  el: HTMLAudioElement;
  ctx: AudioContext | null = null;
  source: MediaElementAudioSourceNode | null = null;
  filters: BiquadFilterNode[] = [];
  gain: GainNode | null = null;
  hls: Hls | null = null;
  listeners = new Set<(e: AudioListenerEvent) => void>();

  constructor() {
    this.el = new Audio();
    this.el.crossOrigin = 'anonymous';
    this.el.preload = 'auto';
    let lastTimeUpdate = 0;
    this.el.addEventListener('timeupdate', () => {
      const now = performance.now();
      if (now - lastTimeUpdate < 250) return; // throttle to ~4 fps
      lastTimeUpdate = now;
      this.emit({ type: 'time', current: this.el.currentTime, duration: this.el.duration || 0 });
    });
    this.el.addEventListener('play', () => this.emit({ type: 'play' }));
    this.el.addEventListener('pause', () => this.emit({ type: 'pause' }));
    this.el.addEventListener('ended', () => this.emit({ type: 'ended' }));
    this.el.addEventListener('waiting', () => this.emit({ type: 'loading' }));
    this.el.addEventListener('canplay', () => this.emit({ type: 'ready' }));
    this.el.addEventListener('error', () =>
      this.emit({ type: 'error', message: 'Audio element error' }),
    );
  }

  on(fn: (e: AudioListenerEvent) => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(e: AudioListenerEvent) {
    for (const l of this.listeners) l(e);
  }

  private ensureGraph() {
    if (this.ctx) return;
    const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
    this.ctx = new Ctx();
    this.source = this.ctx.createMediaElementSource(this.el);

    this.filters = EQ_FREQUENCIES.map((f, i) => {
      const node = this.ctx!.createBiquadFilter();
      node.type = i === 0 ? 'lowshelf' : i === EQ_FREQUENCIES.length - 1 ? 'highshelf' : 'peaking';
      node.frequency.value = f;
      node.Q.value = 1.1;
      node.gain.value = 0;
      return node;
    });

    this.gain = this.ctx.createGain();

    let prev: AudioNode = this.source;
    for (const f of this.filters) {
      prev.connect(f);
      prev = f;
    }
    prev.connect(this.gain);
    this.gain.connect(this.ctx.destination);
  }

  setEqGain(index: number, db: number) {
    this.ensureGraph();
    this.filters[index]?.gain.setTargetAtTime(db, this.ctx!.currentTime, 0.01);
  }

  resetEq() {
    this.filters.forEach((f) => f.gain.setTargetAtTime(0, this.ctx!.currentTime, 0.01));
  }

  setVolume(v: number) {
    this.el.volume = Math.max(0, Math.min(1, v));
  }

  setSpeed(rate: number) {
    this.el.playbackRate = Math.max(0.25, Math.min(4, rate));
  }

  setPreservePitch(on: boolean) {
    this.el.preservesPitch = on;
  }

  getSpeed() {
    return this.el.playbackRate;
  }

  seek(seconds: number) {
    if (Number.isFinite(seconds)) this.el.currentTime = seconds;
  }

  pause() {
    this.el.pause();
  }

  async play() {
    try {
      await this.ctx?.resume();
      await this.el.play();
    } catch (err) {
      this.emit({ type: 'error', message: (err as Error).message });
    }
  }

  /**
   * Load a SoundCloud track for playback. Picks the best available transcoding,
   * resolves the actual stream URL, and starts playback. Re-uses the shared
   * <audio> element + EQ graph.
   */
  async loadTrack(track: ScTrack): Promise<void> {
    this.emit({ type: 'loading' });
    this.ensureGraph();

    const transcodings = track.media?.transcodings ?? [];
    if (!transcodings.length) {
      this.emit({ type: 'error', message: 'No streamable transcodings' });
      return;
    }

    // Prefer progressive (simpler), fall back to HLS.
    const progressive = transcodings.find(
      (t) => t.format.protocol === 'progressive' && !t.snipped,
    );
    const hls = transcodings.find((t) => t.format.protocol === 'hls' && !t.snipped);
    const choice: ScTranscoding | undefined = progressive ?? hls ?? transcodings[0];
    if (!choice) return;

    const streamUrl = await api.streamUrl(choice.url);

    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }

    if (choice.format.protocol === 'progressive' || this.el.canPlayType('application/vnd.apple.mpegurl')) {
      this.el.src = streamUrl;
    } else if (Hls.isSupported()) {
      this.hls = new Hls({ enableWorker: false, lowLatencyMode: false, maxBufferLength: 15, maxMaxBufferLength: 30 });
      this.hls.loadSource(streamUrl);
      this.hls.attachMedia(this.el);
    } else {
      this.el.src = streamUrl;
    }

    await this.play();
  }
}

export const audio = new AudioEngine();
