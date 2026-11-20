// audio.js
// Efeitos sonoros sintetizados via Web Audio API (sem dependência de arquivos externos)

class SoundManager {
    constructor() {
        this.ctx = null;
        this.muted = localStorage.getItem('sound_muted') === 'true';
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        localStorage.setItem('sound_muted', this.muted);
        return this.muted;
    }

    playSelect(pitchIndex = 0) {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime;

        // Frequência sobe com o tamanho da palavra selecionada
        const baseFreq = 380;
        const freq = baseFreq * Math.pow(1.08, Math.min(pitchIndex, 8));

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.25, now + 0.05);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.06);
    }

    playWordSuccess() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (Acorde Maior alegre)

        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const noteStart = now + i * 0.07;

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, noteStart);

            gain.gain.setValueAtTime(0.001, noteStart);
            gain.gain.linearRampToValueAtTime(0.18, noteStart + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.28);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(noteStart);
            osc.stop(noteStart + 0.3);
        });
    }

    playBonusWord() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [440, 554.37, 659.25]; // A4, C#5, E5

        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const noteStart = now + i * 0.06;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, noteStart);

            gain.gain.setValueAtTime(0.001, noteStart);
            gain.gain.linearRampToValueAtTime(0.12, noteStart + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.22);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(noteStart);
            osc.stop(noteStart + 0.25);
        });
    }

    playFail() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime;

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.14);

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.15);
    }

    playVictory() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        // Fanfarra triunfal: C, E, G, G, A, C
        const melody = [
            { f: 523.25, d: 0.12, delay: 0 },
            { f: 659.25, d: 0.12, delay: 0.13 },
            { f: 783.99, d: 0.15, delay: 0.26 },
            { f: 783.99, d: 0.12, delay: 0.44 },
            { f: 880.00, d: 0.18, delay: 0.58 },
            { f: 1046.50, d: 0.45, delay: 0.78 }
        ];

        melody.forEach(item => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const tStart = now + item.delay;

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(item.f, tStart);

            gain.gain.setValueAtTime(0.001, tStart);
            gain.gain.linearRampToValueAtTime(0.22, tStart + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, tStart + item.d);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(tStart);
            osc.stop(tStart + item.d + 0.02);
        });
    }

    vibrate(ms = 30) {
        if ('vibrate' in navigator) {
            try { navigator.vibrate(ms); } catch (e) {}
        }
    }
}
