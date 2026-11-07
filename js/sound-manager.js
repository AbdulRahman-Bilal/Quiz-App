/**
 * @fileoverview SoundManager - tiny sound-effects engine built on the Web
 * Audio API. Sounds are synthesized, so no audio files are needed.
 */
export default class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  /** Lazily create / resume the AudioContext (browsers need a user gesture). */
  getContext() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx) this.ctx = new AudioCtx();
    if (this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  }

  /** Call from a click/key handler so later sounds are allowed to play. */
  unlock() {
    this.getContext();
  }

  /**
   * Play one note.
   * @param {number} frequency Hz
   * @param {number} start seconds from now
   * @param {number} duration seconds
   * @param {OscillatorType} type
   * @param {number} volume 0..1
   */
  tone(frequency, start, duration, type = "sine", volume = 0.2) {
    const ctx = this.getContext();
    if (!ctx) return;
    const t0 = ctx.currentTime + start;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
  }

  /** Happy two-note rising "ding-ding". */
  playCorrect() {
    if (!this.enabled) return;
    this.tone(659.25, 0, 0.14, "sine"); // E5
    this.tone(987.77, 0.12, 0.28, "sine"); // B5
  }

  /** Low, buzzy "wrong" sound. */
  playWrong() {
    if (!this.enabled) return;
    this.tone(220, 0, 0.18, "sawtooth", 0.15);
    this.tone(155.56, 0.16, 0.35, "sawtooth", 0.15);
  }
}

/** Shared instance used by the whole app. */
export const sounds = new SoundManager();
