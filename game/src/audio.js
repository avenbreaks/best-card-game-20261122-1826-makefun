// Ember Pact — tiny WebAudio blips, synthesized at runtime. No sound files.
let ctx = null;

function ac() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

export function blip(freq, dur = 0.09, type = 'sine', gain = 0.05) {
  const c = ac();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(gain, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
  o.connect(g).connect(c.destination);
  o.start(); o.stop(c.currentTime + dur);
}

export const sfx = {
  deal: () => blip(520, 0.07, 'triangle', 0.04),
  play: () => { blip(330, 0.1, 'triangle', 0.05); setTimeout(() => blip(494, 0.12, 'triangle', 0.05), 70); },
  hit: () => blip(140, 0.14, 'sawtooth', 0.05),
  heal: () => { blip(660, 0.1, 'sine', 0.04); setTimeout(() => blip(880, 0.14, 'sine', 0.04), 80); },
  win: () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => blip(f, 0.22, 'triangle', 0.06), i * 130)),
  lose: () => [392, 330, 262, 196].forEach((f, i) => setTimeout(() => blip(f, 0.22, 'sine', 0.05), i * 150)),
};
