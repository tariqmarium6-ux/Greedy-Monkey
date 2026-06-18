class AudioManager {
    constructor() {
        this.ctx = null;
        this.soundEnabled = localStorage.getItem('greedy_monkey_sound_enabled') !== 'false';
        const savedVol = localStorage.getItem('greedy_monkey_volume');
        this.volume = (savedVol !== null && !isNaN(parseFloat(savedVol))) ? parseFloat(savedVol) : 0.5;
        this.bgmInterval = null;
        this.currentNoteIndex = 0;
        this.masterGain = null;
        this.filter = null;

        // Childish happy chiptune melody (frequency values)
        // C5, E5, G5, E5, F5, A5, C6, A5, G5, E5, D5, G5, C5, C5
        this.melody = [
            523.25, 659.25, 783.99, 659.25,
            698.46, 880.00, 1046.50, 880.00,
            783.99, 659.25, 587.33, 783.99,
            523.25, 523.25
        ];
        this.noteDuration = 0.22; // slightly faster for a more driving gameplay feel
    }

    init() {
        if (this.ctx) return;
        
        // Create audio context (must be initialized after user interaction)
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();

        // Create master gain control
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.soundEnabled ? this.volume : 0, this.ctx.currentTime);

        // Lowpass filter for smooth vintage retro arcade warmth
        this.filter = this.ctx.createBiquadFilter();
        this.filter.type = 'lowpass';
        this.filter.frequency.setValueAtTime(1400, this.ctx.currentTime);
        this.filter.Q.setValueAtTime(1.5, this.ctx.currentTime);

        // Connections: Synth -> Master Gain -> Lowpass Filter -> Output
        this.masterGain.connect(this.filter);
        this.filter.connect(this.ctx.destination);
    }

    resumeContext() {
        this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        localStorage.setItem('greedy_monkey_sound_enabled', this.soundEnabled.toString());
        
        this.resumeContext();
        if (this.masterGain) {
            const targetVolume = this.soundEnabled ? this.volume : 0;
            this.masterGain.gain.linearRampToValueAtTime(targetVolume, this.ctx.currentTime + 0.1);
        }

        if (this.soundEnabled && !this.bgmInterval) {
            this.playBgm();
        } else if (!this.soundEnabled) {
            this.stopBgm();
        }
        return this.soundEnabled;
    }

    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
        localStorage.setItem('greedy_monkey_volume', this.volume.toString());

        this.resumeContext();
        if (this.masterGain && this.soundEnabled) {
            this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        }
    }

    // Play a bouncy jump sound (oscillator frequency sweep with subtle pitch wobble)
    playJump() {
        if (!this.soundEnabled) return;
        this.resumeContext();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.type = 'triangle'; // Warmer chiptune jump
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(650, now + 0.15);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.start();
        osc.stop(now + 0.15);
    }

    // Play a shiny banana collection sound (fast ascending arpeggio with high pass shimmer)
    playCollect() {
        if (!this.soundEnabled) return;
        this.resumeContext();

        const now = this.ctx.currentTime;
        const notes = [659.25, 783.99, 1046.50]; // E5, G5, C6 (Ascending C major chord)

        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.05);

            gain.gain.setValueAtTime(0.2, now + idx * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.12);

            osc.start(now + idx * 0.05);
            osc.stop(now + idx * 0.05 + 0.12);
        });
    }

    // Combo progression chime (rising frequency and pitch based on combo count)
    playCombo(count) {
        if (!this.soundEnabled) return;
        this.resumeContext();

        const now = this.ctx.currentTime;
        const baseFreq = 523.25 * (1 + count * 0.15); // Scale frequency based on combo count
        
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.masterGain);

        osc1.type = 'triangle';
        osc2.type = 'sine';
        
        osc1.frequency.setValueAtTime(baseFreq, now);
        osc2.frequency.setValueAtTime(baseFreq * 1.5, now); // Perfect fifth harmony

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc1.start();
        osc2.start();
        osc1.stop(now + 0.25);
        osc2.stop(now + 0.25);
    }

    // Play a funny hit sound (falling retro crash sound)
    playHit() {
        if (!this.soundEnabled) return;
        this.resumeContext();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const noiseGain = this.ctx.createGain();

        // White noise-like effect with low frequency sweep
        osc.connect(noiseGain);
        noiseGain.connect(this.masterGain);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.35);

        noiseGain.gain.setValueAtTime(0.35, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.start();
        osc.stop(now + 0.35);
    }

    // Play a sad retro game over tune (downward minor arpeggio)
    playGameOverTune() {
        if (!this.soundEnabled) return;
        this.resumeContext();

        const now = this.ctx.currentTime;
        const notes = [392.00, 349.23, 311.13, 261.63]; // G4, F4, Eb4, C4 (Descending C minor)

        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.15);

            gain.gain.setValueAtTime(0.3, now + idx * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.4);

            osc.start(now + idx * 0.15);
            osc.stop(now + idx * 0.15 + 0.4);
        });
    }

    // Play procedural background music melody loop + deep arcade bassline
    playBgm() {
        if (!this.soundEnabled) return;
        this.resumeContext();
        this.stopBgm(); // Avoid multiple music loops

        this.bgmInterval = setInterval(() => {
            if (!this.soundEnabled || !this.ctx || !this.masterGain) return;
            
            const now = this.ctx.currentTime;
            
            // 1. Lead voice (Melody)
            const oscLead = this.ctx.createOscillator();
            const gainLead = this.ctx.createGain();

            oscLead.connect(gainLead);
            gainLead.connect(this.masterGain);

            oscLead.type = 'triangle'; // Warm chiptune vibe
            const freq = this.melody[this.currentNoteIndex];
            oscLead.frequency.setValueAtTime(freq, now);

            // Staccato notes: gain fades out quickly before note end
            gainLead.gain.setValueAtTime(0.12, now);
            gainLead.gain.exponentialRampToValueAtTime(0.001, now + this.noteDuration - 0.04);

            oscLead.start();
            oscLead.stop(now + this.noteDuration);

            // 2. Bass Voice accompaniment (plays on every beat, 2 octaves down)
            const oscBass = this.ctx.createOscillator();
            const gainBass = this.ctx.createGain();

            oscBass.connect(gainBass);
            gainBass.connect(this.masterGain);

            oscBass.type = 'sine'; // Deep smooth bass pulse
            oscBass.frequency.setValueAtTime(freq / 4, now); // 2 octaves down

            gainBass.gain.setValueAtTime(0.15, now);
            gainBass.gain.exponentialRampToValueAtTime(0.001, now + this.noteDuration - 0.02);

            oscBass.start();
            oscBass.stop(now + this.noteDuration);

            this.currentNoteIndex = (this.currentNoteIndex + 1) % this.melody.length;
        }, this.noteDuration * 1000);
    }

    stopBgm() {
        if (this.bgmInterval) {
            clearInterval(this.bgmInterval);
            this.bgmInterval = null;
        }
    }
}

// Global instantiation
const gameAudio = new AudioManager();
