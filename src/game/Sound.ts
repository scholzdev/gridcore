// ── Procedural Sound Engine ─────────────────────────────────
// All sounds are synthesized via Web Audio API — no audio files needed.
// Richer, multi-layered synthesis for satisfying game audio.

let ctx: AudioContext | null = null;
let muted = false;
let volume = 0.3;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function isMuted(): boolean { return muted; }
export function toggleMute(): boolean { muted = !muted; return muted; }
export function setVolume(v: number) { volume = Math.max(0, Math.min(1, v)); }

// ── Noise buffer (shared, created once) ─────────────────────

let noiseBuffer: AudioBuffer | null = null;
function getNoiseBuffer(): AudioBuffer {
  if (noiseBuffer) return noiseBuffer;
  const c = getCtx();
  const len = c.sampleRate * 0.5;
  noiseBuffer = c.createBuffer(1, len, c.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return noiseBuffer;
}

// ── Helpers ─────────────────────────────────────────────────

function gain(c: AudioContext, v: number): GainNode {
  const g = c.createGain();
  g.gain.value = v * volume;
  g.connect(c.destination);
  return g;
}

// ── Sound definitions ───────────────────────────────────────

/** Turret/tower fires a projectile — snappier, more impact */
export function playShoot() {
  if (muted) return;
  const c = getCtx();
  const now = c.currentTime;

  // Main shot — filtered square wave
  const osc = c.createOscillator();
  const g = gain(c, 0.06);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
  osc.type = 'square';
  osc.frequency.setValueAtTime(1100, now);
  osc.frequency.exponentialRampToValueAtTime(200, now + 0.06);
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 3000;
  filter.Q.value = 2;
  osc.connect(filter);
  filter.connect(g);
  osc.start(now);
  osc.stop(now + 0.08);

  // Transient click
  const click = c.createOscillator();
  const g2 = gain(c, 0.04);
  g2.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);
  click.type = 'sine';
  click.frequency.setValueAtTime(3000, now);
  click.frequency.exponentialRampToValueAtTime(800, now + 0.02);
  click.connect(g2);
  click.start(now);
  click.stop(now + 0.025);
}

/** Enemy killed — satisfying pop with sub bass */
export function playKill() {
  if (muted) return;
  const c = getCtx();
  const now = c.currentTime;

  // Sub bass thump
  const sub = c.createOscillator();
  const gSub = gain(c, 0.1);
  gSub.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
  sub.type = 'sine';
  sub.frequency.setValueAtTime(120, now);
  sub.frequency.exponentialRampToValueAtTime(40, now + 0.1);
  sub.connect(gSub);
  sub.start(now);
  sub.stop(now + 0.12);

  // Filtered noise burst
  const noise = c.createBufferSource();
  noise.buffer = getNoiseBuffer();
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 400;
  bp.Q.value = 2;
  const gNoise = gain(c, 0.08);
  gNoise.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
  noise.connect(bp);
  bp.connect(gNoise);
  noise.start(now);
  noise.stop(now + 0.1);

  // Pop
  const pop = c.createOscillator();
  const gPop = gain(c, 0.05);
  gPop.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
  pop.type = 'sine';
  pop.frequency.setValueAtTime(600, now);
  pop.frequency.exponentialRampToValueAtTime(80, now + 0.08);
  pop.connect(gPop);
  pop.start(now);
  pop.stop(now + 0.08);
}

/** Building placed — pleasant two-tone confirmation */
export function playBuild() {
  if (muted) return;
  const c = getCtx();
  const now = c.currentTime;

  // Two ascending tones
  [400, 600].forEach((freq, i) => {
    const osc = c.createOscillator();
    const g = gain(c, 0.08);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.12 + i * 0.06);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + i * 0.06);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.2, now + 0.1 + i * 0.06);
    osc.connect(g);
    osc.start(now + i * 0.06);
    osc.stop(now + 0.12 + i * 0.06);
  });

  // Soft click
  const click = c.createOscillator();
  const gClick = gain(c, 0.03);
  gClick.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
  click.type = 'sine';
  click.frequency.value = 2000;
  click.connect(gClick);
  click.start(now);
  click.stop(now + 0.03);
}

/** Building removed / sold — descending tone with thud */
export function playSell() {
  if (muted) return;
  const c = getCtx();
  const now = c.currentTime;

  // Descending two tones
  [600, 350].forEach((freq, i) => {
    const osc = c.createOscillator();
    const g = gain(c, 0.07);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.1 + i * 0.06);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + i * 0.06);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.7, now + 0.08 + i * 0.06);
    osc.connect(g);
    osc.start(now + i * 0.06);
    osc.stop(now + 0.1 + i * 0.06);
  });

  // Noise thud
  const noise = c.createBufferSource();
  noise.buffer = getNoiseBuffer();
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 300;
  const gN = gain(c, 0.06);
  gN.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
  noise.connect(lp);
  lp.connect(gN);
  noise.start(now);
  noise.stop(now + 0.08);
}

/** New wave starts — dramatic rising fanfare */
export function playWaveStart() {
  if (muted) return;
  const c = getCtx();
  const now = c.currentTime;

  // Three-note ascending fanfare with harmonics
  const notes = [330, 440, 554, 659];
  notes.forEach((freq, i) => {
    const osc1 = c.createOscillator();
    const osc2 = c.createOscillator();
    const g = gain(c, 0.07);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.15 + i * 0.1);
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(freq, now + i * 0.1);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, now + i * 0.1);
    const gOsc2 = c.createGain();
    gOsc2.gain.value = 0.3;
    osc1.connect(g);
    osc2.connect(gOsc2);
    gOsc2.connect(g);
    osc1.start(now + i * 0.1);
    osc1.stop(now + 0.15 + i * 0.1);
    osc2.start(now + i * 0.1);
    osc2.stop(now + 0.15 + i * 0.1);
  });

  // Sub rumble
  const sub = c.createOscillator();
  const gSub = gain(c, 0.08);
  gSub.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
  sub.type = 'sine';
  sub.frequency.value = 60;
  sub.connect(gSub);
  sub.start(now);
  sub.stop(now + 0.5);
}

/** Game over — dramatic descending with dissonance */
export function playGameOver() {
  if (muted) return;
  const c = getCtx();
  const now = c.currentTime;

  // Descending sad chord
  const notes = [440, 370, 311, 261, 220];
  notes.forEach((freq, i) => {
    const osc = c.createOscillator();
    const g = gain(c, 0.1);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.4 + i * 0.18);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now + i * 0.18);

    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(2000, now + i * 0.18);
    lp.frequency.exponentialRampToValueAtTime(200, now + 0.4 + i * 0.18);

    osc.connect(lp);
    lp.connect(g);
    osc.start(now + i * 0.18);
    osc.stop(now + 0.4 + i * 0.18);
  });

  // Deep rumble
  const noise = c.createBufferSource();
  noise.buffer = getNoiseBuffer();
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 150;
  const gN = gain(c, 0.15);
  gN.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
  noise.connect(lp);
  lp.connect(gN);
  noise.start(now);
  noise.stop(now + 1.0);
}

/** Upgrade — shimmering ascending sparkle */
export function playUpgrade() {
  if (muted) return;
  const c = getCtx();
  const now = c.currentTime;

  // Quick ascending arpeggio
  [500, 750, 1000, 1500].forEach((freq, i) => {
    const osc = c.createOscillator();
    const g = gain(c, 0.06);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.08 + i * 0.04);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + i * 0.04);
    osc.connect(g);
    osc.start(now + i * 0.04);
    osc.stop(now + 0.08 + i * 0.04);
  });

  // Harmonic shimmer
  const osc2 = c.createOscillator();
  const g2 = gain(c, 0.04);
  g2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(600, now);
  osc2.frequency.exponentialRampToValueAtTime(2000, now + 0.2);
  osc2.connect(g2);
  osc2.start(now);
  osc2.stop(now + 0.25);
}

/** Core hit / damage — alarming, impactful */
export function playCoreHit() {
  if (muted) return;
  const c = getCtx();
  const now = c.currentTime;

  // Filtered noise impact
  const noise = c.createBufferSource();
  noise.buffer = getNoiseBuffer();
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(800, now);
  lp.frequency.exponentialRampToValueAtTime(100, now + 0.15);
  const g = gain(c, 0.18);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
  noise.connect(lp);
  lp.connect(g);
  noise.start(now);
  noise.stop(now + 0.2);

  // Alarm-like tone
  const osc = c.createOscillator();
  const g2 = gain(c, 0.08);
  g2.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  osc.type = 'square';
  osc.frequency.setValueAtTime(300, now);
  osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
  osc.connect(g2);
  osc.start(now);
  osc.stop(now + 0.15);
}

/** Module installed — satisfying tech click */
export function playModuleInstall() {
  if (muted) return;
  const c = getCtx();
  const now = c.currentTime;

  // Ascending sparkle
  [800, 1200, 1600].forEach((freq, i) => {
    const osc = c.createOscillator();
    const g = gain(c, 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.06 + i * 0.04);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + i * 0.04);
    osc.connect(g);
    osc.start(now + i * 0.04);
    osc.stop(now + 0.06 + i * 0.04);
  });

  // Confirmation tone
  const osc = c.createOscillator();
  const g3 = gain(c, 0.04);
  g3.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(1000, now + 0.12);
  osc.frequency.exponentialRampToValueAtTime(1400, now + 0.18);
  osc.connect(g3);
  osc.start(now + 0.12);
  osc.stop(now + 0.2);
}

// ── Throttled shoot sound (max 1 every 80ms to not overwhelm) ──

let lastShootTime = 0;
export function playShootThrottled() {
  if (muted) return;
  const now = performance.now();
  if (now - lastShootTime < 80) return;
  lastShootTime = now;
  playShoot();
}

let lastKillTime = 0;
export function playKillThrottled() {
  if (muted) return;
  const now = performance.now();
  if (now - lastKillTime < 60) return;
  lastKillTime = now;
  playKill();
}
