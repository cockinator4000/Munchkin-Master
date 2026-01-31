class SoundService {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  // Dodalem 'levelDown' do listy dozwolonych dzwiekow
  play(type: 'click' | 'levelUp' | 'victory' | 'levelDown') {
    if (!this.ctx) this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    const now = this.ctx.currentTime;
    osc.start(now);
    
    if (type === 'click') {
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      osc.stop(now + 0.1);
    } 
    else if (type === 'levelUp') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(880, now + 0.1);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.3);
      osc.stop(now + 0.3);
    } 
    else if (type === 'victory') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523, now);
      osc.frequency.linearRampToValueAtTime(1046, now + 0.5);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 1.0);
      osc.stop(now + 1.0);
    } 
    // NOWY DZWIEK: SMUTNA TRABKA
    else if (type === 'levelDown') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, now); // Start nisko
      osc.frequency.linearRampToValueAtTime(100, now + 0.4); // Zjazd w dol
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.4);
      osc.stop(now + 0.4);
    }
    else {
      osc.stop(now);
    }
  }
}

export const soundService = new SoundService();
