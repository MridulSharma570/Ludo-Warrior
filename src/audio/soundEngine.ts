// Authentic Ludo King Clean Tactile Audio + Android Haptic Vibration Engine
// Zero harsh static/white-noise: uses pure resonant pitched percussive envelopes

class SoundEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  public hapticsEnabled: boolean = true;
  public musicEnabled: boolean = false;
  public volume: number = 0.85;
  private musicTimer: number | null = null;
  private musicStep: number = 0;

  private getContext(): AudioContext | null {
    if (!this.enabled) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Native Android Haptic Vibration (`navigator.vibrate`)
   */
  public vibrate(pattern: number | number[]): void {
    if (!this.hapticsEnabled) return;
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignore on unsupported browsers
      }
    }
  }

  public toggleHaptics(): boolean {
    this.hapticsEnabled = !this.hapticsEnabled;
    if (this.hapticsEnabled) {
      this.vibrate(18);
    }
    return this.hapticsEnabled;
  }

  /**
   * Helper: Clean resonant hollow plastic/wood knock (ZERO static noise)
   */
  private triggerCleanKnock(
    delaySec: number,
    startFreq: number,
    endFreq: number,
    durSec: number,
    gainAmt: number,
    oscType: OscillatorType = 'sine'
  ): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const startTime = ctx.currentTime + delaySec;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = oscType;
    osc.frequency.setValueAtTime(startFreq, startTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), startTime + durSec);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(gainAmt * this.volume, startTime + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + durSec);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + durSec + 0.005);
  }

  /**
   * Clean Ludo King UI Button Tap + Android Micro-Haptic
   */
  public playClick(): void {
    this.vibrate(8);
    this.triggerCleanKnock(0, 620, 340, 0.035, 0.32, 'sine');
  }

  public playMenuSelect(): void {
    this.vibrate(12);
    this.triggerCleanKnock(0, 520, 680, 0.045, 0.35, 'sine');
  }

  public playModeStart(): void {
    this.vibrate([15, 25, 22]);
    this.triggerCleanKnock(0, 523.25, 523.25, 0.07, 0.32, 'triangle');
    this.triggerCleanKnock(0.065, 659.25, 659.25, 0.07, 0.35, 'triangle');
    this.triggerCleanKnock(0.13, 783.99, 783.99, 0.12, 0.4, 'triangle');
  }

  /**
   * Authentic Ludo King 3D Dice Rattle & Roll + Android Tactile Rattle
   * 7 crisp, hollow plastic-cube tumbles with natural deceleration — zero static noise
   */
  public playDiceRoll(): void {
    this.vibrate([14, 28, 12, 32, 18]);
    const bounceTimes = [0, 0.042, 0.084, 0.128, 0.176, 0.228, 0.285];
    const baseFreqs = [740, 660, 790, 620, 720, 680, 580];

    bounceTimes.forEach((t, i) => {
      const pitchJitter = 0.96 + Math.random() * 0.08;
      const f1 = baseFreqs[i] * pitchJitter;
      const amp = (i === bounceTimes.length - 1 ? 0.48 : 0.36) * (0.85 + (i / 7) * 0.15);

      // Hollow plastic cube body
      this.triggerCleanKnock(t, f1, f1 * 0.38, 0.026, amp, 'triangle');
      // Crisp rim tap harmonic
      this.triggerCleanKnock(t, f1 * 1.85, f1 * 0.75, 0.014, amp * 0.45, 'sine');
    });
  }

  /**
   * Authentic Ludo King Pawn Hop ("Pop-Bloop" wooden/plastic token step)
   */
  public playTokenStep(stepIndex: number = 0): void {
    this.vibrate(10);
    const subtlePitch = 1 + Math.min(stepIndex, 5) * 0.025;
    // Soft board touch
    this.triggerCleanKnock(0, 240 * subtlePitch, 110, 0.038, 0.38, 'sine');
    // Signature Ludo King bubbly pawn pop
    this.triggerCleanKnock(0.003, 390 * subtlePitch, 640 * subtlePitch, 0.048, 0.44, 'sine');
  }

  /**
   * Smooth descending marimba tick as a captured pawn glides back to its yard
   */
  public playRewindTick(stepIdx: number = 0): void {
    const freq = Math.max(340, 820 - (stepIdx % 16) * 28);
    this.triggerCleanKnock(0, freq, freq * 0.75, 0.028, 0.22, 'sine');
  }

  /**
   * Rolling a 6 — Bright Golden Chime + Double Haptic Pulse
   */
  public playRollSix(): void {
    this.vibrate([20, 25, 30]);
    this.triggerCleanKnock(0, 659.25, 659.25, 0.08, 0.4, 'triangle');
    this.triggerCleanKnock(0.07, 880.0, 880.0, 0.14, 0.46, 'triangle');
  }

  /**
   * Capturing an opponent pawn — Punchy Ludo King Impact + Heavy Haptic
   */
  public playCaptureClash(): void {
    this.vibrate([45, 30, 65]);
    this.triggerCleanKnock(0, 480, 120, 0.09, 0.55, 'triangle');
    this.triggerCleanKnock(0.04, 720, 260, 0.11, 0.48, 'sine');
  }

  /**
   * Landing on a Star / Safe Square
   */
  public playSafeZoneShield(): void {
    this.vibrate(15);
    this.triggerCleanKnock(0, 587.33, 880.0, 0.09, 0.35, 'sine');
  }

  /**
   * Pawn reaching the Center Home Triangle
   */
  public playCitadelAscend(): void {
    this.vibrate([25, 25, 45]);
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      this.triggerCleanKnock(idx * 0.065, freq, freq, 0.12, 0.42, 'triangle');
    });
  }

  /**
   * Match Victory Fanfare
   */
  public playVictoryFanfare(): void {
    this.vibrate([60, 40, 60, 40, 120]);
    const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];
    const delays = [0, 0.09, 0.18, 0.27, 0.42, 0.54];
    notes.forEach((freq, idx) => {
      this.triggerCleanKnock(delays[idx], freq, freq, 0.18, 0.48, 'triangle');
    });
  }

  public startMusic(): void {
    // Kept off by default so gameplay is pure Ludo King SFX
  }

  public stopMusic(): void {
    this.musicEnabled = false;
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  public toggleMusic(): boolean {
    if (this.musicEnabled) {
      this.stopMusic();
      return false;
    }
    this.musicEnabled = true;
    const ctx = this.getContext();
    if (!ctx) return false;

    const chords = [
      [261.63, 329.63, 392.0],
      [293.66, 369.99, 440.0],
      [329.63, 392.0, 493.88],
      [261.63, 329.63, 392.0],
    ];

    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
    }

    this.musicTimer = window.setInterval(() => {
      if (!this.musicEnabled || !this.enabled) return;
      const chord = chords[this.musicStep % chords.length];
      chord.forEach((f, i) => {
        this.triggerCleanKnock(i * 0.04, f, f, 0.45, 0.08, 'sine');
      });
      this.musicStep = (this.musicStep + 1) % chords.length;
    }, 1200);

    return true;
  }
}

export const soundEngine = new SoundEngine();
