// Authentic Original Ludo King Sampled Audio Engine + Android Haptic Vibration
// Uses the real recorded Ludo King MP3 sound effects (dice_roll, pile_move, collide, safe_spot, home_win, game_start, ui)

import { LUDO_KING_SFX_BASE64 } from './ludoKingSfxData';

type SfxKey =
  | 'dice_roll'
  | 'pile_move'
  | 'collide'
  | 'safe_spot'
  | 'home_win'
  | 'game_start'
  | 'ui';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private decodedBuffers: Partial<Record<SfxKey, AudioBuffer>> = {};
  private htmlAudioPool: Partial<Record<SfxKey, HTMLAudioElement[]>> = {};
  private decodingStarted: boolean = false;

  public enabled: boolean = true;
  public hapticsEnabled: boolean = true;
  public musicEnabled: boolean = false;
  public volume: number = 0.92;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initHtmlAudioFallbacks();
    }
  }

  private initHtmlAudioFallbacks(): void {
    const keys = Object.keys(LUDO_KING_SFX_BASE64) as SfxKey[];
    for (const key of keys) {
      const dataUri = `data:audio/mpeg;base64,${LUDO_KING_SFX_BASE64[key]}`;
      const poolSize = key === 'pile_move' ? 4 : 2;
      const pool: HTMLAudioElement[] = [];
      for (let i = 0; i < poolSize; i++) {
        const audio = new Audio(dataUri);
        audio.preload = 'auto';
        pool.push(audio);
      }
      this.htmlAudioPool[key] = pool;
    }
  }

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
    if (this.ctx && !this.decodingStarted) {
      this.decodingStarted = true;
      this.decodeAllSfx(this.ctx);
    }
    return this.ctx;
  }

  private decodeAllSfx(ctx: AudioContext): void {
    const keys = Object.keys(LUDO_KING_SFX_BASE64) as SfxKey[];
    for (const key of keys) {
      try {
        const b64 = LUDO_KING_SFX_BASE64[key];
        const binStr = window.atob(b64);
        const len = binStr.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binStr.charCodeAt(i);
        }
        ctx.decodeAudioData(
          bytes.buffer.slice(0),
          (decoded) => {
            this.decodedBuffers[key] = decoded;
          },
          () => {}
        );
      } catch {
        // Fallback to HTMLAudioPool if decodeAudioData fails
      }
    }
  }

  /**
   * Play an original Ludo King MP3 sample with zero latency via Web Audio AudioBuffer
   * (with automatic HTMLAudioElement fallback if Web Audio buffer is still decoding)
   */
  private playSample(key: SfxKey, gainScale: number = 1.0, playbackRate: number = 1.0): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    const buf = this.decodedBuffers[key];

    if (ctx && buf) {
      const source = ctx.createBufferSource();
      source.buffer = buf;
      source.playbackRate.value = playbackRate;

      const gain = ctx.createGain();
      gain.gain.value = Math.min(1.0, this.volume * gainScale);

      source.connect(gain);
      gain.connect(ctx.destination);
      source.start(0);
      return;
    }

    // Immediate HTMLAudioElement fallback if decoded buffer is not ready yet
    const pool = this.htmlAudioPool[key];
    if (pool && pool.length > 0) {
      const available = pool.find((a) => a.paused || a.ended) ?? pool[0];
      try {
        available.currentTime = 0;
        available.volume = Math.min(1.0, this.volume * gainScale);
        available.playbackRate = playbackRate;
        available.play().catch(() => {});
      } catch {
        // Ignore autoplay restrictions
      }
    }
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
   * Original Ludo King UI Button Tap (`ui.mp3`)
   */
  public playClick(): void {
    this.vibrate(8);
    this.playSample('ui', 0.9, 1.0);
  }

  public playMenuSelect(): void {
    this.vibrate(12);
    this.playSample('ui', 1.0, 1.0);
  }

  /**
   * Original Ludo King Match Start Sound (`game_start.mp3`)
   */
  public playModeStart(): void {
    this.vibrate([15, 25, 22]);
    this.playSample('game_start', 0.95, 1.0);
  }

  /**
   * Original Ludo King Dice Roll Sound (`dice_roll.mp3`)
   */
  public playDiceRoll(): void {
    this.vibrate([14, 28, 12, 32, 18]);
    this.playSample('dice_roll', 1.0, 1.0);
  }

  /**
   * Original Ludo King Piece Moving Sound (`pile_move.mp3`)
   */
  public playTokenStep(_stepIndex: number = 0): void {
    this.vibrate(10);
    this.playSample('pile_move', 1.0, 1.0);
  }

  /**
   * Captured piece stepping backward to its home yard
   */
  public playRewindTick(_stepIdx: number = 0): void {
    this.playSample('pile_move', 0.55, 1.35);
  }

  /**
   * Rolling a 6
   */
  public playRollSix(): void {
    this.vibrate([20, 25, 30]);
    this.playSample('safe_spot', 0.9, 1.08);
  }

  /**
   * Original Ludo King Piece Capture / Cut Sound (`collide.mp3`)
   */
  public playCaptureClash(): void {
    this.vibrate([45, 30, 65]);
    this.playSample('collide', 1.0, 1.0);
  }

  /**
   * Original Ludo King Safe Star Spot Sound (`safe_spot.mp3`)
   */
  public playSafeZoneShield(): void {
    this.vibrate(15);
    this.playSample('safe_spot', 1.0, 1.0);
  }

  /**
   * Original Ludo King Piece Reaching Home Triangle (`home_win.mp3`)
   */
  public playCitadelAscend(): void {
    this.vibrate([25, 25, 45]);
    this.playSample('home_win', 1.0, 1.0);
  }

  /**
   * Original Ludo King Match Victory Cheer (`cheer.mp3` + `home_win.mp3`)
   */
  public playVictoryFanfare(): void {
    this.vibrate([60, 40, 60, 40, 120]);
    this.playSample('home_win', 1.0, 1.0);
    if (typeof window !== 'undefined') {
      try {
        const cheer = new Audio('./sfx/cheer.mp3');
        cheer.volume = Math.min(1.0, this.volume * 0.9);
        cheer.play().catch(() => {});
      } catch {
        // ignore
      }
    }
  }

  public startMusic(): void {}

  public stopMusic(): void {
    this.musicEnabled = false;
  }

  public toggleMusic(): boolean {
    this.musicEnabled = !this.musicEnabled;
    return this.musicEnabled;
  }
}

export const soundEngine = new SoundEngine();
