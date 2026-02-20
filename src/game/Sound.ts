// ── Procedural Sound Engine ─────────────────────────────────
// All sounds are synthesized via Web Audio API — no audio files needed.

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

// ── Helper ──────────────────────────────────────────────────

function gain(c: AudioContext, v: number): GainNode {
  const g = c.createGain();
  g.gain.value = v * volume;
  g.connect(c.destination);
  return g;
}

// ── Sound definitions ───────────────────────────────────────

/** Turret/tower fires a projectile */
export function playShoot() {
  if (muted) return;
  const c = getCtx();
  const now = c.currentTime;
  const osc = c.createOscillator();
  const g = gain(c, 0.08);
  osc.type = 'square';
  osc.frequency.setValueAtTime(900, now);
  osc.frequency.exponentialRampToValueAtTime(300, now + 0.06);
  osc.connect(g);
  osc.start(now);
  osc.stop(now + 0.06);
}

/** Enemy killed */
export function playKill() {
  if (muted) return;
  const c = getCtx();
  const now = c.currentTime;

  // Low rumble via noise
  const noise = c.createBufferSource();
  noise.buffer = getNoiseBuffer();
  const bandpass = c.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = 200;
  bandpass.Q.value = 1;
  const g = gain(c, 0.12);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  noise.connect(bandpass);
  bandpass.connect(g);
  noise.start(now);
  noise.stop(now + 0.15);

  // Pop
  const osc = c.createOscillator();
  const g2 = gain(c, 0.06);
  g2.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
  osc.frequency.setValueAtTime(500, now);
  osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
  osc.connect(g2);
  osc.start(now);
  osc.stop(now + 0.1);
}

/** Building placed */
export function playBuild() {
  if (muted) return;
  const c = getCtx();
  const now = c.currentTime;
  const osc = c.createOscillator();
  const g = gain(c, 0.1);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(400, now);
  osc.frequency.exponentialRampToValueAtTime(700, now + 0.12);
  osc.connect(g);
  osc.start(now);
  osc.stop(now + 0.12);
}

/** Building removed / sold */
export function playSell() {
  if (muted) return;
  const c = getCtx();
  const now = c.currentTime;
  const osc = c.createOscillator();
  const g = gain(c, 0.08);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(600, now);
  osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
  osc.connect(g);
  osc.start(now);
  osc.stop(now + 0.1);
}

/** New wave starts */
export function playWaveStart() {
  if (muted) return;
  const c = getCtx();
  const now = c.currentTime;
  // Rising fanfare — three quick ascending notes
  [440, 554, 659].forEach((freq, i) => {
    const osc = c.createOscillator();
    const g = gain(c, 0.1);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.12 + i * 0.08);
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, now + i * 0.08);
    osc.connect(g);
    osc.start(now + i * 0.08);
    osc.stop(now + 0.12 + i * 0.08);
  });
}

/** Game over */
export function playGameOver() {
  if (muted) return;
  const c = getCtx();
  const now = c.currentTime;
  // Descending sad tone
  [440, 370, 311, 261].forEach((freq, i) => {
    const osc = c.createOscillator();
    const g = gain(c, 0.12);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.3 + i * 0.15);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now + i * 0.15);
    osc.connect(g);
    osc.start(now + i * 0.15);
    osc.stop(now + 0.3 + i * 0.15);
  });
}

/** Upgrade */
export function playUpgrade() {
  if (muted) return;
  const c = getCtx();
  const now = c.currentTime;
  const osc = c.createOscillator();
  const g = gain(c, 0.1);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(500, now);
  osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
  osc.connect(g);
  osc.start(now);
  osc.stop(now + 0.2);
}

/** Core hit / damage */
export function playCoreHit() {
  if (muted) return;
  const c = getCtx();
  const now = c.currentTime;
  const noise = c.createBufferSource();
  noise.buffer = getNoiseBuffer();
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 400;
  const g = gain(c, 0.2);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
  noise.connect(lp);
  lp.connect(g);
  noise.start(now);
  noise.stop(now + 0.2);
}

/** Module installed */
export function playModuleInstall() {
  if (muted) return;
  const c = getCtx();
  const now = c.currentTime;
  const osc = c.createOscillator();
  const g = gain(c, 0.08);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, now);
  osc.frequency.exponentialRampToValueAtTime(1400, now + 0.1);
  osc.connect(g);
  osc.start(now);
  osc.stop(now + 0.15);
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
