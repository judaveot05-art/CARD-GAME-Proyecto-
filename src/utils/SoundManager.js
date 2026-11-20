let audioCtx = null;

function getContext() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) audioCtx = new AudioContext();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(freq, type = 'sine', duration = 0.12, delay = 0, gainVal = 0.15) {
  const ctx = getContext();
  if (!ctx) return;

  const start = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);

  gain.gain.setValueAtTime(gainVal, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(start);
  osc.stop(start + duration);
}

export function playSound(soundPath = '') {
  try {
    const name = soundPath.toLowerCase();

    if (name.includes('attack')) {
      playTone(220, 'sawtooth', 0.12, 0, 0.18);
      playTone(130, 'square', 0.15, 0.06, 0.15);
    } else if (name.includes('special')) {
      playTone(440, 'sawtooth', 0.12, 0, 0.16);
      playTone(587, 'sawtooth', 0.14, 0.08, 0.18);
      playTone(880, 'triangle', 0.25, 0.16, 0.2);
    } else if (name.includes('defend')) {
      playTone(330, 'triangle', 0.15, 0, 0.16);
      playTone(495, 'triangle', 0.2, 0.08, 0.16);
    } else if (name.includes('ko')) {
      playTone(240, 'sawtooth', 0.18, 0, 0.2);
      playTone(160, 'sawtooth', 0.22, 0.12, 0.2);
      playTone(95, 'sawtooth', 0.35, 0.24, 0.22);
    } else if (name.includes('victory')) {
      playTone(523.25, 'triangle', 0.14, 0, 0.18);
      playTone(659.25, 'triangle', 0.14, 0.12, 0.18);
      playTone(783.99, 'triangle', 0.14, 0.24, 0.18);
      playTone(1046.5, 'triangle', 0.4, 0.36, 0.22);
    } else if (name.includes('confirm')) {
      playTone(520, 'sine', 0.1, 0, 0.15);
      playTone(780, 'sine', 0.18, 0.09, 0.16);
    } else if (name.includes('select')) {
      playTone(620, 'sine', 0.09, 0, 0.14);
    } else {
      // click por defecto
      playTone(460, 'sine', 0.06, 0, 0.12);
    }
  } catch {
    // Ignorar si el navegador bloquea audio antes de interacción
  }
}