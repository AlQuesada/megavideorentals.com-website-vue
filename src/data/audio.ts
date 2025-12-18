// ===== MUSIC CONFIGURATION =====
// Edit these values to customize the music behavior
const MUSIC_ENABLED = true;     // Set to false to disable all music
const MASTER_VOLUME = 0.20;     // Keep it lowkey (0.0 - 1.0)
const BPM = 85;                 // Chill tempo for browsing

// ===== 8-BIT SYNTHWAVE AUDIO ENGINE =====

type OscillatorType = 'sine' | 'square' | 'sawtooth' | 'triangle';

class SynthwaveAudio {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying = false;
  private isMutedState = false;
  private schedulerId: number | null = null;
  private currentStep = 0;
  private nextNoteTime = 0;

  // Musical constants - A minor pentatonic for that chill 80s vibe
  private readonly ROOT = 220; // A3

  // Chord progression (i - VI - III - VII in A minor)
  private readonly CHORDS = [
    [0, 3, 7],      // Am
    [5, 8, 12],     // F
    [3, 7, 10],     // C
    [7, 10, 14],    // G
  ];

  // Bass pattern (simple root notes, 2 bars per chord)
  private readonly BASS_PATTERN = [
    0, -1, 0, -1, 0, -1, 0, 0,
    5, -1, 5, -1, 5, -1, 5, 5,
    3, -1, 3, -1, 3, -1, 3, 3,
    7, -1, 7, -1, 7, -1, 7, 7,
  ];

  // Arpeggio pattern indices (which chord tone to play)
  private readonly ARP_PATTERN = [0, 1, 2, 1, 0, 2, 1, 0];

  init(): void {
    if (!MUSIC_ENABLED || this.ctx) return;

    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = MASTER_VOLUME;
    this.masterGain.connect(this.ctx.destination);
  }

  private noteToFreq(semitones: number): number {
    return this.ROOT * Math.pow(2, semitones / 12);
  }

  private playNote(
    type: OscillatorType,
    freq: number,
    startTime: number,
    duration: number,
    volume: number,
    attack = 0.01,
    release = 0.1
  ): void {
    if (!this.ctx || !this.masterGain) return;

    const oscillator = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.value = freq;

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + attack);
    gain.gain.setValueAtTime(volume, startTime + duration - release);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);

    oscillator.connect(gain);
    gain.connect(this.masterGain);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.1);
  }

  private scheduleNotes(): void {
    if (!this.ctx || !this.isPlaying) return;

    const secondsPerBeat = 60 / BPM;
    const secondsPerStep = secondsPerBeat / 2; // 8th notes

    // Schedule ahead by 100ms for smooth playback
    while (this.nextNoteTime < this.ctx.currentTime + 0.1) {
      const step = this.currentStep % 32; // 32 steps = 4 bars
      const chordIndex = Math.floor(step / 8); // Change chord every 8 steps
      const chord = this.CHORDS[chordIndex];
      if (!chord) return;

      // Bass (square wave, low octave)
      const bassNote = this.BASS_PATTERN[step];
      if (bassNote !== undefined && bassNote !== -1) {
        const bassFreq = this.noteToFreq(bassNote - 12); // One octave down
        this.playNote('square', bassFreq, this.nextNoteTime, secondsPerStep * 0.8, 0.12, 0.01, 0.05);
      }

      // Arpeggio (triangle wave)
      const arpIndex = this.ARP_PATTERN[step % 8];
      if (arpIndex === undefined) return;
      const arpNote = chord[arpIndex];
      if (arpNote === undefined) return;
      const arpFreq = this.noteToFreq(arpNote + 12); // One octave up
      this.playNote('triangle', arpFreq, this.nextNoteTime, secondsPerStep * 0.6, 0.08, 0.005, 0.1);

      // Pad (soft sine, play on beat 1 of each chord change)
      if (step % 8 === 0) {
        chord.forEach((note) => {
          const padFreq = this.noteToFreq(note);
          this.playNote('sine', padFreq, this.nextNoteTime, secondsPerStep * 7.5, 0.04, 0.3, 0.5);
        });
      }

      // Hi-hat style click (noise approximation with high freq)
      if (step % 2 === 0) {
        this.playNote('square', 8000 + Math.random() * 2000, this.nextNoteTime, 0.02, 0.015, 0.001, 0.015);
      }

      this.nextNoteTime += secondsPerStep;
      this.currentStep++;
    }

    // Continue scheduling
    this.schedulerId = window.setTimeout(() => this.scheduleNotes(), 25);
  }

  play(): void {
    if (!MUSIC_ENABLED || !this.ctx || this.isPlaying || this.isMutedState) return;

    // Resume context if suspended (browser autoplay policy)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.isPlaying = true;
    this.nextNoteTime = this.ctx.currentTime;
    this.scheduleNotes();
  }

  pause(): void {
    if (!this.ctx) return;

    this.isPlaying = false;
    if (this.schedulerId !== null) {
      window.clearTimeout(this.schedulerId);
      this.schedulerId = null;
    }
  }

  toggleMute(): boolean {
    this.isMutedState = !this.isMutedState;

    if (this.isMutedState) {
      this.pause();
    } else {
      this.play();
    }

    return this.isMutedState;
  }

  isMuted(): boolean {
    return this.isMutedState;
  }

  isInitialized(): boolean {
    return this.ctx !== null;
  }

  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }

  isEnabled(): boolean {
    return MUSIC_ENABLED;
  }
}

// Export singleton instance
export const audio = new SynthwaveAudio();

