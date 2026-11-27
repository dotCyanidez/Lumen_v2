// Procedural Web Audio API synthesizer & generative music engine for LUMEN
// Produces crystalline SFX and a dynamic melodic soundtrack (felt keys, harp arpeggios, bowed swells).

const PENTATONIC_SCALE = [
  587.33, // D5
  659.25, // E5
  739.99, // F#5
  880.0, // A5
  987.77, // B5
  1174.66, // D6
  1318.51, // E6
  1479.98, // F#6
  1760.0, // A6
];

// Three harmonic banks that evolve across sanctuary depth phases without jarring jumps
const HARMONIC_BANKS = [
  // Bank 0: Luminous Dmaj9 -> Bm9 -> Gmaj9 -> Em9 (Phases 1-2: serene open radiance)
  [
    { bass: 73.42, pad: [146.83, 220.0, 277.18, 329.63], arp: [293.66, 369.99, 440.0, 554.37, 659.25, 739.99] },
    { bass: 61.74, pad: [123.47, 185.0, 293.66, 329.63], arp: [246.94, 369.99, 440.0, 587.33, 659.25, 739.99] },
    { bass: 98.0, pad: [196.0, 246.94, 293.66, 369.99], arp: [293.66, 392.0, 493.88, 587.33, 739.99, 880.0] },
    { bass: 82.41, pad: [164.81, 246.94, 293.66, 369.99], arp: [329.63, 440.0, 493.88, 659.25, 739.99, 987.77] },
  ],
  // Bank 1: Suspended Dorian Twilight Em9 -> Cmaj7#11 -> Am9 -> B7sus4 (Phase 3: mystery)
  [
    { bass: 82.41, pad: [164.81, 246.94, 293.66, 369.99], arp: [329.63, 392.0, 493.88, 587.33, 739.99, 987.77] },
    { bass: 65.41, pad: [130.81, 196.0, 246.94, 369.99], arp: [261.63, 369.99, 493.88, 587.33, 739.99, 880.0] },
    { bass: 110.0, pad: [220.0, 261.63, 329.63, 392.0], arp: [329.63, 440.0, 493.88, 659.25, 783.99, 987.77] },
    { bass: 61.74, pad: [123.47, 185.0, 246.94, 329.63], arp: [246.94, 329.63, 440.0, 493.88, 659.25, 880.0] },
  ],
  // Bank 2: Eclipse Intensification Bm9 -> Gmaj9 -> Em9 -> F#7sus4 (Phase 4+: urgent shimmer)
  [
    { bass: 61.74, pad: [123.47, 185.0, 293.66, 369.99], arp: [246.94, 369.99, 440.0, 587.33, 739.99, 987.77] },
    { bass: 98.0, pad: [196.0, 293.66, 369.99, 440.0], arp: [293.66, 392.0, 493.88, 659.25, 739.99, 880.0] },
    { bass: 82.41, pad: [164.81, 246.94, 329.63, 392.0], arp: [329.63, 440.0, 587.33, 659.25, 783.99, 987.77] },
    { bass: 92.5, pad: [185.0, 246.94, 329.63, 369.99], arp: [369.99, 493.88, 554.37, 739.99, 880.0, 1108.73] },
  ],
  // Bank 3: Overdrive Supernova F#m9 -> Dmaj7#11 -> Bm9 -> C#7sus4 (Overdrive+: incandescent momentum)
  [
    { bass: 92.5, pad: [185.0, 220.0, 277.18, 329.63], arp: [369.99, 440.0, 554.37, 659.25, 739.99, 1108.73] },
    { bass: 73.42, pad: [146.83, 220.0, 277.18, 369.99], arp: [293.66, 440.0, 554.37, 659.25, 739.99, 1174.66] },
    { bass: 61.74, pad: [123.47, 185.0, 293.66, 329.63], arp: [246.94, 369.99, 493.88, 587.33, 739.99, 987.77] },
    { bass: 69.3, pad: [138.59, 207.65, 277.18, 329.63], arp: [277.18, 415.3, 493.88, 659.25, 830.61, 1108.73] },
  ],
];

const MUSIC_PROGRESSION = HARMONIC_BANKS[0];

// Memorable melodic contours (indices into chord.arp)
const MELODY_PATTERNS = [
  [0, 2, 4, 3, 5, 4, 2, 1],
  [2, 4, 5, 3, 4, 1, 2, 0],
  [0, 3, 2, 5, 4, 2, 3, 4],
  [1, 4, 3, 5, 2, 4, 0, 3],
];

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.sfxBus = null;
    this.reverbSend = null;
    this.cathedralIn = null;
    this.ambientGain = null;
    this.ambientDryBus = null;
    this.noiseBuffer = null;

    this.sfxVolume = 0.85;
    this.ambientVolume = 0.75;
    this.ambientActive = false;

    this.schedulerId = null;
    this.nextStepTime = 0;
    this.stepIndex = 0;
    this.chordIndex = 0;
    this.patternIndex = 0;
    this.beatPulse = 0;
    this.musicFilter = null;

    this.mood = { intensity: 0, paused: false, active: false, dying: false, overdriveTier: 0 };
    this.unlocked = false;
  }

  get sfxEnabled() {
    return this.sfxVolume > 0.005;
  }

  get ambientEnabled() {
    return this.ambientVolume > 0.005;
  }

  setPreferences({ sfxVolume, ambientVolume, sfxEnabled, ambientEnabled } = {}) {
    if (typeof sfxVolume === 'number') {
      this.sfxVolume = Math.max(0, Math.min(1, sfxVolume));
    } else if (typeof sfxEnabled === 'boolean') {
      this.sfxVolume = sfxEnabled ? 0.85 : 0;
    }
    if (typeof ambientVolume === 'number') {
      this.ambientVolume = Math.max(0, Math.min(1, ambientVolume));
    } else if (typeof ambientEnabled === 'boolean') {
      this.ambientVolume = ambientEnabled ? 0.75 : 0;
    }
    this._syncGains();
  }

  setAmbientMood({ intensity = 0, paused = false, active = false, dying = false, overdriveTier = 0 }) {
    this.mood.intensity = intensity;
    this.mood.paused = paused;
    this.mood.active = active;
    this.mood.dying = dying;
    this.mood.overdriveTier = Math.max(0, Math.floor(overdriveTier || 0));
    this._syncGains();
  }

  getVisualPulse(dt) {
    this.beatPulse *= Math.exp(-3.4 * dt);
    return this.beatPulse;
  }

  unlock() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this._buildGraph();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    this.unlocked = true;
    this._syncGains();
  }

  _buildGraph() {
    const ctx = this.ctx;

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -16;
    compressor.knee.value = 18;
    compressor.ratio.value = 3.2;
    compressor.attack.value = 0.01;
    compressor.release.value = 0.25;

    this.master = ctx.createGain();
    this.master.gain.value = 0.88;
    this.master.connect(compressor);
    compressor.connect(ctx.destination);

    const sfxCurve = this.sfxEnabled ? Math.pow(this.sfxVolume, 1.35) : 0;
    const ambCurve = this.ambientEnabled ? Math.pow(this.ambientVolume, 1.35) : 0;

    this.sfxBus = ctx.createGain();
    this.sfxBus.gain.value = sfxCurve > 0 ? 0.96 * sfxCurve : 0.0001;
    this.sfxBus.connect(this.master);

    // Spacious stereo cathedral delay reverb
    const delayL = ctx.createDelay(1.5);
    const delayR = ctx.createDelay(1.5);
    delayL.delayTime.value = 0.33;
    delayR.delayTime.value = 0.49;

    const fbL = ctx.createGain();
    const fbR = ctx.createGain();
    fbL.gain.value = 0.44;
    fbR.gain.value = 0.41;

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2600;

    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 150;

    const merger = ctx.createChannelMerger(2);
    const wetGain = ctx.createGain();
    wetGain.gain.value = 0.45;

    this.cathedralIn = ctx.createGain();
    this.cathedralIn.gain.value = 0.72;

    this.reverbSend = ctx.createGain();
    this.reverbSend.gain.value = sfxCurve > 0 ? sfxCurve : 0.0001;
    this.reverbSend.connect(this.cathedralIn);

    this.cathedralIn.connect(hp);
    hp.connect(delayL);
    hp.connect(delayR);
    delayL.connect(fbL);
    fbL.connect(delayR);
    delayR.connect(fbR);
    fbR.connect(lp);
    lp.connect(delayL);

    delayL.connect(merger, 0, 0);
    delayR.connect(merger, 0, 1);
    merger.connect(wetGain);
    wetGain.connect(this.master);

    // Music bus with dynamic lowpass filter (warm underwater hush when paused / dying)
    this.musicFilter = ctx.createBiquadFilter();
    this.musicFilter.type = 'lowpass';
    this.musicFilter.frequency.value = 8800;
    this.musicFilter.Q.value = 0.7;

    this.ambientGain = ctx.createGain();
    this.ambientGain.gain.value = ambCurve > 0 ? 0.72 * ambCurve : 0.0001;
    this.ambientGain.connect(this.musicFilter);
    this.musicFilter.connect(this.master);

    const musicWetTap = ctx.createGain();
    musicWetTap.gain.value = 0.85;
    this.ambientGain.connect(musicWetTap);
    musicWetTap.connect(this.cathedralIn);

    this.ambientDryBus = ctx.createGain();
    this.ambientDryBus.gain.value = 0.85;
    this.ambientDryBus.connect(this.ambientGain);

    // Filtered air buffer used ONLY for short Dash whoosh SFX
    const sr = ctx.sampleRate;
    const length = Math.floor(sr * 1.2);
    this.noiseBuffer = ctx.createBuffer(1, length, sr);
    const data = this.noiseBuffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.04 * white) / 1.04;
      data[i] = lastOut * 2.5 + white * 0.25;
    }

    this._startMusicSequencer();
  }

  _startMusicSequencer() {
    if (!this.ctx || this.ambientActive) return;
    this.ambientActive = true;
    this.nextStepTime = this.ctx.currentTime + 0.12;
    this.stepIndex = 0;
    this.chordIndex = 0;

    // Lookahead musical step scheduler (every 100ms, schedules up to 220ms ahead)
    this.schedulerId = window.setInterval(() => {
      if (!this.ctx || this.ctx.state !== 'running' || !this.ambientEnabled) {
        if (this.ctx) this.nextStepTime = this.ctx.currentTime + 0.1;
        return;
      }

      // Prevent catch-up note bursts after browser tab throttling
      if (this.nextStepTime < this.ctx.currentTime - 0.1) {
        this.nextStepTime = this.ctx.currentTime + 0.05;
      }

      // Tempo gently accelerates in intense phases (78 calm -> 96 Eclipse -> up to 108 Overdrive)
      const odBoost = Math.min(12, (this.mood.overdriveTier || 0) * 1.1);
      const bpm = this.mood.active ? 78 + this.mood.intensity * 18 + odBoost : 72;
      const eighthNote = 60 / bpm / 2;
      if (!(eighthNote > 0) || !Number.isFinite(eighthNote)) return;

      let steps = 0;
      while (this.nextStepTime < this.ctx.currentTime + 0.24 && steps < 24) {
        steps++;
        this._scheduleMusicStep(this.stepIndex, this.nextStepTime, eighthNote);
        this.nextStepTime += eighthNote;
        this.stepIndex++;
        if (this.stepIndex >= 16) {
          this.stepIndex = 0;
          this.chordIndex = (this.chordIndex + 1) % MUSIC_PROGRESSION.length;
          if (this.chordIndex === 0) {
            this.patternIndex = (this.patternIndex + 1) % MELODY_PATTERNS.length;
          }
        }
      }
      if (steps >= 24) {
        this.nextStepTime = this.ctx.currentTime + 0.05;
      }
    }, 100);
  }

  _scheduleMusicStep(step, time, eighthDur) {
    const intensity = this.mood.active ? this.mood.intensity : 0;
    const od = this.mood.active ? this.mood.overdriveTier || 0 : 0;
    const bankIdx = !this.mood.active
      ? 0
      : od >= 1
        ? 3
        : intensity >= 0.65
          ? 2
          : intensity >= 0.35
            ? 1
            : 0;
    const bank = HARMONIC_BANKS[bankIdx] || MUSIC_PROGRESSION;
    const chord = bank[this.chordIndex % bank.length];
    const pattern = MELODY_PATTERNS[this.patternIndex];
    const paused = this.mood.paused;

    // Downbeat of each 2-bar measure (step 0): warm felt bass anchor + gentle breathing chord bloom
    if (step === 0) {
      this.beatPulse = Math.max(this.beatPulse, paused ? 0.35 : 0.92);
      this._playBassPulse(chord.bass, time, eighthDur * 10, paused ? 0.08 : 0.14 + intensity * 0.05);
      // Soft bowed chord swell (fades in & out naturally, never holds indefinitely)
      const swellNotes = paused ? [chord.pad[0], chord.pad[2]] : chord.pad;
      swellNotes.forEach((freq, i) => {
        const pan = (i - 1.5) * 0.28;
        this._playGlassSwell(
          freq,
          time + i * 0.08,
          eighthDur * 13,
          paused ? 0.022 : 0.036,
          pan
        );
      });
    }

    // Subtle mid-bar harmonic pulse in active gameplay (step 8)
    if (step === 8 && !paused && (this.mood.active || Math.random() < 0.65)) {
      this.beatPulse = Math.max(this.beatPulse, 0.55);
      this._playBassPulse(chord.bass * 2, time, eighthDur * 5, 0.055 + intensity * 0.035);
    }

    // Melodic felt-piano / harp motif
    const playCalmPattern = step === 0 || step === 3 || step === 6 || step === 10 || step === 13;
    const playMidPattern = playCalmPattern || step === 8 || step === 14;
    const playStormPattern = step % 2 === 0 || step === 3 || step === 7 || step === 11 || step === 15;

    const shouldPlayNote = paused
      ? step === 2 || step === 10
      : !this.mood.active
        ? playCalmPattern
        : intensity > 0.55
          ? playStormPattern
          : intensity > 0.2
            ? playMidPattern
            : playCalmPattern;

    if (shouldPlayNote) {
      const patIdx = Math.floor(step / 2) % pattern.length;
      const noteIdx = pattern[patIdx];
      let freq = chord.arp[noteIdx % chord.arp.length];

      // Occasional luminous octave sparkle on high steps
      if ((step === 6 || step === 13 || step === 15) && Math.random() < 0.45 + intensity * 0.35) {
        freq *= 2;
      }

      const pan = ((step % 5) - 2) * 0.22;
      const vel = paused ? 0.035 : (step % 4 === 0 ? 0.095 : 0.072) * (1 + intensity * 0.15);

      this._playFeltHarpNote(freq, time, eighthDur * (paused ? 6.5 : 4.2), vel, pan);
    }

    // Gentle muted kalimba/marimba off-beat pulse during intense gameplay
    if (this.mood.active && !paused && intensity >= 0.25 && step % 2 === 1 && (intensity > 0.5 || step % 4 === 3)) {
      const pulseFreq = chord.pad[step % 2 === 1 ? 1 : 2];
      this._playMutedPluck(pulseFreq, time, 0.28, 0.03 + intensity * 0.03, (step % 4 - 1.5) * 0.25);
    }

    // Overdrive incandescent harmonic shimmer layer (scales gently with overdriveTier)
    if (this.mood.active && !paused && od >= 1 && (step % 4 === 2 || (od >= 6 && step % 4 === 0))) {
      const odScale = Math.min(1, od / 10);
      const shimmerFreq = chord.arp[(step + this.patternIndex) % chord.arp.length] * 2;
      this._playFeltHarpNote(
        shimmerFreq,
        time,
        eighthDur * 2.4,
        0.028 + odScale * 0.024,
        step % 4 === 2 ? 0.36 : -0.36
      );
    }
  }

  _playFeltHarpNote(freq, time, duration, volume, panValue = 0) {
    const ctx = this.ctx;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const env = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, time);
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2.0, time);
    g2.gain.value = 0.16;

    // Warm felt-hammer lowpass sweep gives an acoustic celesta/piano warmth
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(Math.min(3600, freq * 4.2), time);
    filter.frequency.exponentialRampToValueAtTime(Math.max(320, freq * 1.35), time + duration * 0.75);

    env.gain.setValueAtTime(0.0001, time);
    env.gain.exponentialRampToValueAtTime(volume, time + 0.018);
    env.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc1.connect(filter);
    osc2.connect(g2);
    g2.connect(filter);
    filter.connect(env);

    this._routePanned(env, panValue, this.ambientDryBus);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + duration + 0.06);
    osc2.stop(time + duration + 0.06);
  }

  _playMutedPluck(freq, time, duration, volume, panValue = 0) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const env = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(950, time);
    filter.frequency.exponentialRampToValueAtTime(240, time + duration);

    env.gain.setValueAtTime(0.0001, time);
    env.gain.exponentialRampToValueAtTime(volume, time + 0.008);
    env.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(filter);
    filter.connect(env);
    this._routePanned(env, panValue, this.ambientDryBus);

    osc.start(time);
    osc.stop(time + duration + 0.04);
  }

  _playBassPulse(freq, time, duration, volume) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const env = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(240, time);
    filter.frequency.exponentialRampToValueAtTime(110, time + duration);

    env.gain.setValueAtTime(0.0001, time);
    env.gain.exponentialRampToValueAtTime(volume, time + 0.16);
    env.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(filter);
    filter.connect(env);
    env.connect(this.ambientGain);

    osc.start(time);
    osc.stop(time + duration + 0.05);
  }

  _playGlassSwell(freq, time, duration, volume, panValue = 0) {
    const ctx = this.ctx;
    const oscA = ctx.createOscillator();
    const oscB = ctx.createOscillator();
    const env = ctx.createGain();

    oscA.type = 'sine';
    oscB.type = 'sine';
    oscA.frequency.setValueAtTime(freq, time);
    oscB.frequency.setValueAtTime(freq, time);
    oscA.detune.value = -4;
    oscB.detune.value = 4;

    const attack = duration * 0.34;
    env.gain.setValueAtTime(0.0001, time);
    env.gain.exponentialRampToValueAtTime(volume, time + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    oscA.connect(env);
    oscB.connect(env);
    this._routePanned(env, panValue, this.ambientDryBus);

    oscA.start(time);
    oscB.start(time);
    oscA.stop(time + duration + 0.06);
    oscB.stop(time + duration + 0.06);
  }

  _routePanned(node, panValue, dest) {
    if (this.ctx.createStereoPanner) {
      const pan = this.ctx.createStereoPanner();
      pan.pan.value = Math.max(-1, Math.min(1, panValue));
      node.connect(pan);
      pan.connect(dest);
    } else {
      node.connect(dest);
    }
  }

  _syncGains() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const sfxCurve = this.sfxEnabled ? Math.pow(this.sfxVolume, 1.35) : 0;
    const ambCurve = this.ambientEnabled ? Math.pow(this.ambientVolume, 1.35) : 0;
    if (this.sfxBus) {
      this.sfxBus.gain.setTargetAtTime(sfxCurve > 0 ? 0.96 * sfxCurve : 0.0001, now, 0.035);
    }
    if (this.reverbSend) {
      this.reverbSend.gain.setTargetAtTime(sfxCurve > 0 ? sfxCurve : 0.0001, now, 0.035);
    }
    if (this.ambientGain) {
      const baseAmb = this.mood.paused ? 0.44 : 0.74;
      const target = ambCurve > 0 ? baseAmb * ambCurve : 0.0001;
      this.ambientGain.gain.setTargetAtTime(target, now, 0.16);
    }
    if (this.musicFilter) {
      const cutoff = this.mood.dying ? 440 : this.mood.paused ? 720 : 8800;
      this.musicFilter.frequency.setTargetAtTime(cutoff, now, 0.22);
    }
  }

  playUIClick() {
    if (!this.sfxEnabled) return;
    this.unlock();
    if (!this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(920, now);
    osc.frequency.exponentialRampToValueAtTime(1380, now + 0.06);
    g.gain.setValueAtTime(0.001, now);
    g.gain.exponentialRampToValueAtTime(0.09, now + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
    osc.connect(g);
    g.connect(this.sfxBus);
    g.connect(this.reverbSend);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  playMote(combo = 1) {
    if (!this.sfxEnabled || !this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const idx = Math.min(PENTATONIC_SCALE.length - 1, Math.max(0, combo - 1));
    const baseFreq = PENTATONIC_SCALE[idx] * (0.99 + Math.random() * 0.02);

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const g = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(baseFreq, now);
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(baseFreq * 2.0, now);

    const g2 = ctx.createGain();
    g2.gain.value = 0.18;

    g.gain.setValueAtTime(0.001, now);
    g.gain.exponentialRampToValueAtTime(0.16, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);

    osc1.connect(g);
    osc2.connect(g2);
    g2.connect(g);
    g.connect(this.sfxBus);
    g.connect(this.reverbSend);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.45);
    osc2.stop(now + 0.45);
  }

  playPrism() {
    if (!this.sfxEnabled || !this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const chord = [587.33, 739.99, 880.0, 1174.66, 1318.51];
    chord.forEach((freq, i) => {
      const t = now + i * 0.045;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.11, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.95);
      osc.connect(g);
      g.connect(this.sfxBus);
      g.connect(this.reverbSend);
      osc.start(t);
      osc.stop(t + 1.0);
    });
  }

  playDash() {
    if (!this.sfxEnabled || !this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    if (this.noiseBuffer) {
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.Q.value = 1.6;
      bp.frequency.setValueAtTime(520, now);
      bp.frequency.exponentialRampToValueAtTime(2800, now + 0.14);
      bp.frequency.exponentialRampToValueAtTime(700, now + 0.34);

      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.001, now);
      ng.gain.exponentialRampToValueAtTime(0.26, now + 0.03);
      ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);

      src.connect(bp);
      bp.connect(ng);
      ng.connect(this.sfxBus);
      ng.connect(this.reverbSend);
      src.start(now);
      src.stop(now + 0.36);
    }

    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(640, now + 0.11);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.25);

    g.gain.setValueAtTime(0.001, now);
    g.gain.exponentialRampToValueAtTime(0.17, now + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);

    osc.connect(g);
    g.connect(this.sfxBus);
    osc.start(now);
    osc.stop(now + 0.28);
  }

  playGraze() {
    if (!this.sfxEnabled || !this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1650 + Math.random() * 260, now);
    osc.frequency.exponentialRampToValueAtTime(2400, now + 0.08);
    g.gain.setValueAtTime(0.001, now);
    g.gain.exponentialRampToValueAtTime(0.085, now + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    osc.connect(g);
    g.connect(this.sfxBus);
    g.connect(this.reverbSend);
    osc.start(now);
    osc.stop(now + 0.17);
  }

  playPurge() {
    if (!this.sfxEnabled || !this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const sub = ctx.createOscillator();
    const subG = ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(165, now);
    sub.frequency.exponentialRampToValueAtTime(48, now + 0.26);
    subG.gain.setValueAtTime(0.28, now);
    subG.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    sub.connect(subG);
    subG.connect(this.sfxBus);
    sub.start(now);
    sub.stop(now + 0.3);

    const chime = ctx.createOscillator();
    const chimeG = ctx.createGain();
    chime.type = 'triangle';
    chime.frequency.setValueAtTime(1174.66, now);
    chime.frequency.exponentialRampToValueAtTime(1760, now + 0.09);
    chimeG.gain.setValueAtTime(0.14, now);
    chimeG.gain.exponentialRampToValueAtTime(0.0001, now + 0.36);
    chime.connect(chimeG);
    chimeG.connect(this.sfxBus);
    chimeG.connect(this.reverbSend);
    chime.start(now);
    chime.stop(now + 0.38);
  }

  playHit() {
    if (!this.sfxEnabled || !this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const lp = ctx.createBiquadFilter();
    const g = ctx.createGain();

    osc.type = 'sawtooth';
    osc2.type = 'triangle';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.42);
    osc2.frequency.setValueAtTime(106, now);
    osc2.frequency.exponentialRampToValueAtTime(34, now + 0.42);

    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(900, now);
    lp.frequency.exponentialRampToValueAtTime(180, now + 0.4);

    g.gain.setValueAtTime(0.32, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    osc.connect(lp);
    osc2.connect(lp);
    lp.connect(g);
    g.connect(this.sfxBus);
    g.connect(this.reverbSend);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + 0.46);
    osc2.stop(now + 0.46);
  }

  playPhaseShift() {
    if (!this.sfxEnabled || !this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const notes = [293.66, 440.0, 587.33, 880.0];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.06);
      g.gain.setValueAtTime(0.0001, now + i * 0.06);
      g.gain.exponentialRampToValueAtTime(0.085, now + i * 0.06 + 0.12);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);
      osc.connect(g);
      g.connect(this.sfxBus);
      g.connect(this.reverbSend);
      osc.start(now + i * 0.06);
      osc.stop(now + 1.6);
    });
  }

  playLancerCharge() {
    this._playChargeCue('lancer', {
      type: 'sine',
      startFreq: 340,
      endFreq: 1040,
      duration: 0.95,
      peakGain: 0.055,
      peakAt: 0.35,
      cooldown: 0.22,
    });
  }

  playSpitterCharge() {
    this._playChargeCue('spitter', {
      type: 'triangle',
      startFreq: 520,
      endFreq: 860,
      duration: 0.48,
      peakGain: 0.036,
      peakAt: 0.18,
      cooldown: 0.26,
    });
  }

  playArtilleryCharge() {
    this._playChargeCue('artillery', {
      type: 'triangle',
      startFreq: 210,
      endFreq: 490,
      duration: 0.72,
      peakGain: 0.048,
      peakAt: 0.3,
      cooldown: 0.32,
    });
  }

  playHarbingerRingCharge() {
    this._playChargeCue('harbinger_ring', {
      type: 'sine',
      startFreq: 260,
      endFreq: 680,
      duration: 0.82,
      peakGain: 0.068,
      peakAt: 0.36,
      cooldown: 0.35,
    });
  }

  playHarbingerBoltCharge() {
    this._playChargeCue('harbinger_bolt', {
      type: 'triangle',
      startFreq: 440,
      endFreq: 980,
      duration: 0.46,
      peakGain: 0.055,
      peakAt: 0.2,
      cooldown: 0.25,
    });
  }

  playBehemothCharge() {
    this._playChargeCue('behemoth', {
      type: 'sawtooth',
      startFreq: 145,
      endFreq: 78,
      duration: 0.84,
      peakGain: 0.052,
      peakAt: 0.28,
      cooldown: 0.35,
    });
  }

  playCoreRingCharge() {
    this._playChargeCue('core_ring', {
      type: 'sine',
      startFreq: 195,
      endFreq: 560,
      duration: 0.78,
      peakGain: 0.062,
      peakAt: 0.32,
      cooldown: 0.35,
    });
  }

  _playChargeCue(key, { type = 'sine', startFreq, endFreq, duration, peakGain, peakAt, cooldown = 0.2 }) {
    if (!this.sfxEnabled || !this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    this._cueLastTime ||= {};
    if (now - (this._cueLastTime[key] || -10) < cooldown) return;
    this._cueLastTime[key] = now;

    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), now + duration);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(peakGain, now + peakAt);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration + 0.1);
    osc.connect(g);
    g.connect(this.sfxBus);
    g.connect(this.reverbSend);
    osc.start(now);
    osc.stop(now + duration + 0.14);
  }

  playConstellationStep(stepIndex) {
    if (!this.sfxEnabled || !this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    if (stepIndex < 3) {
      const notes = [880, 1174.66, 1479.98];
      const f = notes[Math.min(2, stepIndex - 1)] || 880;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.14, now + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
      osc.connect(g);
      g.connect(this.sfxBus);
      g.connect(this.reverbSend);
      osc.start(now);
      osc.stop(now + 0.72);
    } else {
      // Supernova golden chord burst!
      const chord = [587.33, 880.0, 1108.73, 1479.98, 1760.0];
      chord.forEach((f, idx) => {
        const t = now + idx * 0.035;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.13, t + 0.025);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.35);
        osc.connect(g);
        g.connect(this.sfxBus);
        g.connect(this.reverbSend);
        osc.start(t);
        osc.stop(t + 1.4);
      });
    }
  }

  playCoreCrack(remainingShields = 2) {
    if (!this.sfxEnabled || !this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const pitch = 680 + (3 - remainingShields) * 210;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(pitch * 1.45, now + 0.14);
    g.gain.setValueAtTime(0.001, now);
    g.gain.exponentialRampToValueAtTime(0.22, now + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);
    osc.connect(g);
    g.connect(this.sfxBus);
    g.connect(this.reverbSend);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  playEclipseShatter() {
    if (!this.sfxEnabled || !this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const chord = [293.66, 440.0, 587.33, 880.0, 1174.66, 1479.98];
    chord.forEach((f, idx) => {
      const t = now + idx * 0.032;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = idx === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.14, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
      osc.connect(g);
      g.connect(this.sfxBus);
      g.connect(this.reverbSend);
      osc.start(t);
      osc.stop(t + 1.55);
    });
  }

  playLowRadiancePulse() {
    if (!this.sfxEnabled || !this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(92, now);
    osc.frequency.exponentialRampToValueAtTime(56, now + 0.22);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.09, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);
    osc.connect(g);
    g.connect(this.sfxBus);
    osc.start(now);
    osc.stop(now + 0.28);
  }

  playGameOver() {
    if (!this.sfxEnabled || !this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const notes = [440.0, 369.99, 293.66, 146.83];
    notes.forEach((freq, i) => {
      const t = now + i * 0.14;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = i === 3 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.001, t);
      g.gain.exponentialRampToValueAtTime(0.14, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
      osc.connect(g);
      g.connect(this.sfxBus);
      g.connect(this.reverbSend);
      osc.start(t);
      osc.stop(t + 1.9);
    });
  }

  playRecordChime() {
    if (!this.sfxEnabled || !this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const notes = [587.33, 880.0, 1174.66, 1760.0];
    notes.forEach((freq, idx) => {
      const t = now + idx * 0.048;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = idx === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.13, t + 0.018);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.95);
      osc.connect(g);
      g.connect(this.sfxBus);
      g.connect(this.reverbSend);
      osc.start(t);
      osc.stop(t + 1.0);
    });
  }

  playIgnitionChime() {
    if (!this.sfxEnabled || !this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const notes = [440.0, 659.25, 880.0, 1318.51];
    notes.forEach((freq, idx) => {
      const t = now + idx * 0.038;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.11, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.65);
      osc.connect(g);
      g.connect(this.sfxBus);
      g.connect(this.reverbSend);
      osc.start(t);
      osc.stop(t + 0.7);
    });
  }

  playBolt(accent = false) {
    if (!this.sfxEnabled || !this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = accent ? 'triangle' : 'sine';
    const base = accent ? 940 + Math.random() * 140 : 1280 + Math.random() * 180;
    osc.frequency.setValueAtTime(base, now);
    osc.frequency.exponentialRampToValueAtTime(accent ? 520 : 880, now + 0.08);
    g.gain.setValueAtTime(0.0005, now);
    g.gain.exponentialRampToValueAtTime(accent ? 0.065 : 0.045, now + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.095);
    osc.connect(g);
    g.connect(this.sfxBus);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  playLevelUp() {
    if (!this.sfxEnabled || !this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const notes = [587.33, 739.99, 880.0, 1174.66];
    notes.forEach((freq, idx) => {
      const t = now + idx * 0.042;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = idx === 3 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.11, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
      osc.connect(g);
      g.connect(this.sfxBus);
      g.connect(this.reverbSend);
      osc.start(t);
      osc.stop(t + 0.58);
    });
  }

  playAscensionStinger(tier = 5) {
    if (!this.sfxEnabled || !this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const isSupernova = tier >= 10;
    const chord = isSupernova
      ? [293.66, 440.0, 587.33, 880.0, 1174.66, 1479.98, 1760.0]
      : [440.0, 587.33, 739.99, 1174.66, 1479.98];

    // Warm sub-bass bloom for LV 10 Supernova
    if (isSupernova) {
      const sub = ctx.createOscillator();
      const subG = ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(146.83, now);
      sub.frequency.exponentialRampToValueAtTime(73.42, now + 0.75);
      subG.gain.setValueAtTime(0.0001, now);
      subG.gain.exponentialRampToValueAtTime(0.18, now + 0.04);
      subG.gain.exponentialRampToValueAtTime(0.0001, now + 1.15);
      sub.connect(subG);
      subG.connect(this.sfxBus);
      sub.start(now);
      sub.stop(now + 1.2);
    }

    chord.forEach((freq, idx) => {
      const t = now + idx * (isSupernova ? 0.045 : 0.04);
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = idx >= chord.length - 2 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(isSupernova ? 0.13 : 0.11, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + (isSupernova ? 1.55 : 0.95));
      osc.connect(g);
      this._routePanned(g, ((idx % 2 === 0 ? -1 : 1) * (0.15 + idx * 0.06)), this.sfxBus);
      g.connect(this.reverbSend);
      osc.start(t);
      osc.stop(t + (isSupernova ? 1.6 : 1.0));
    });
  }

  playSynergyUnlock() {
    if (!this.sfxEnabled || !this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    // Two opposing panned voices weaving into a unified major-9th chord
    const leftVoice = [440.0, 587.33, 880.0];
    const rightVoice = [659.25, 739.99, 1318.51];
    [
      { notes: leftVoice, pan: -0.5 },
      { notes: rightVoice, pan: 0.5 },
    ].forEach(({ notes, pan }) => {
      notes.forEach((freq, idx) => {
        const t = now + idx * 0.065;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = idx === 2 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.11, t + 0.018);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.95);
        osc.connect(g);
        this._routePanned(g, idx === 2 ? pan * 0.3 : pan, this.sfxBus);
        g.connect(this.reverbSend);
        osc.start(t);
        osc.stop(t + 1.0);
      });
    });
  }

  playVoidParryResonance() {
    if (!this.sfxEnabled || !this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Brief tactile music lowpass dip (slow-mo parry resonance feel)
    if (this.musicFilter && !this.mood.paused) {
      const targetFreq = this.mood.active ? 8800 : 4800;
      this.musicFilter.frequency.cancelScheduledValues(now);
      this.musicFilter.frequency.setValueAtTime(620, now);
      this.musicFilter.frequency.exponentialRampToValueAtTime(targetFreq, now + 0.32);
    }

    // Deep resonant sub-impact
    const sub = ctx.createOscillator();
    const subG = ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(145, now);
    sub.frequency.exponentialRampToValueAtTime(48, now + 0.24);
    subG.gain.setValueAtTime(0.0001, now);
    subG.gain.exponentialRampToValueAtTime(0.22, now + 0.01);
    subG.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    sub.connect(subG);
    subG.connect(this.sfxBus);
    sub.start(now);
    sub.stop(now + 0.3);

    // Bright crystalline harmonic ring
    [1174.66, 1760.0, 2349.32].forEach((freq, idx) => {
      const t = now + idx * 0.022;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = idx === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.11 - idx * 0.02, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.65);
      osc.connect(g);
      g.connect(this.sfxBus);
      g.connect(this.reverbSend);
      osc.start(t);
      osc.stop(t + 0.7);
    });
  }
}
