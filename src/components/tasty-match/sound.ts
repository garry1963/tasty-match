"use client";

class SoundEngine {
  private ctx: AudioContext | null = null;
  public muted = false;

  private getContext(): AudioContext | null {
    if (this.muted || typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private tone(
    freq: number,
    duration: number,
    type: OscillatorType = "sine",
    gainValue = 0.08,
    delay = 0
  ) {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainValue, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playSelect() {
    this.tone(540, 0.07, "triangle", 0.07);
  }

  playDeselect() {
    this.tone(360, 0.06, "sine", 0.05);
  }

  playMatch(stars: number, combo: number) {
    const base = 523.25 * Math.pow(1.06, Math.min(combo, 6));
    this.tone(base, 0.14, "triangle", 0.09, 0);
    this.tone(base * 1.25, 0.16, "triangle", 0.09, 0.06);
    if (stars >= 2) {
      this.tone(base * 1.5, 0.2, "sine", 0.09, 0.12);
    }
    if (stars >= 3) {
      this.tone(base * 2, 0.24, "sine", 0.1, 0.18);
    }
  }

  playInvalid() {
    this.tone(210, 0.1, "sawtooth", 0.05, 0);
    this.tone(175, 0.12, "sawtooth", 0.05, 0.07);
  }

  playHint() {
    this.tone(660, 0.1, "sine", 0.07, 0);
    this.tone(880, 0.14, "sine", 0.07, 0.08);
  }

  playShuffle() {
    [330, 440, 554, 659].forEach((f, idx) => {
      this.tone(f, 0.08, "triangle", 0.06, idx * 0.04);
    });
  }

  playWin() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
      this.tone(f, 0.24, "triangle", 0.1, idx * 0.09);
    });
  }

  playChest() {
    [523.25, 659.25, 783.99, 987.77, 1318.5].forEach((f, idx) => {
      this.tone(f, 0.28, "sine", 0.1, idx * 0.08);
    });
  }

  playGameOver() {
    [392, 349.23, 311.13, 261.63].forEach((f, idx) => {
      this.tone(f, 0.22, "sawtooth", 0.05, idx * 0.12);
    });
  }
}

export const soundFX = new SoundEngine();
