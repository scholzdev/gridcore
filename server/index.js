import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'fs';

const DATA_DIR = '/data';
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(`${DATA_DIR}/leaderboard.db`);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Schema ───────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS scores (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT    NOT NULL,
    wave      INTEGER NOT NULL DEFAULT 0,
    kills     INTEGER NOT NULL DEFAULT 0,
    time_s    INTEGER NOT NULL DEFAULT 0,
    difficulty TEXT   NOT NULL DEFAULT 'leicht',
    game_mode TEXT   NOT NULL DEFAULT 'endlos',
    damage    REAL   NOT NULL DEFAULT 0,
    seed      TEXT   NOT NULL DEFAULT '',
    created   TEXT   NOT NULL DEFAULT (datetime('now'))
  )
`);

// ── Prepared statements ──────────────────────────────────────
const insertScore = db.prepare(`
  INSERT INTO scores (name, wave, kills, time_s, difficulty, game_mode, damage, seed)
  VALUES (@name, @wave, @kills, @time_s, @difficulty, @game_mode, @damage, @seed)
`);

const topScores = db.prepare(`
  SELECT id, name, wave, kills, time_s, difficulty, game_mode, damage, seed, created
  FROM scores
  ORDER BY kills DESC, time_s DESC
  LIMIT 100
`);

const topScoresByMode = db.prepare(`
  SELECT id, name, wave, kills, time_s, difficulty, game_mode, damage, seed, created
  FROM scores
  WHERE game_mode = @game_mode
  ORDER BY kills DESC, time_s DESC
  LIMIT 100
`);

const personalBest = db.prepare(`
  SELECT id, name, wave, kills, time_s, difficulty, game_mode, damage, seed, created
  FROM scores
  WHERE LOWER(name) = LOWER(@name)
  ORDER BY kills DESC, time_s DESC
  LIMIT 10
`);

// ── Express ──────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json({ limit: '16kb' }));

// ── Rate Limiting (in-memory, per IP) ────────────────────────
const rateMap = new Map();  // ip -> { count, resetAt }
const RATE_WINDOW = 60_000; // 1 minute
const RATE_MAX = 3;         // max 3 score submissions per minute per IP

function rateLimit(req, res, next) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
  const now = Date.now();
  let entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + RATE_WINDOW };
    rateMap.set(ip, entry);
  }
  entry.count++;
  if (entry.count > RATE_MAX) {
    return res.status(429).json({ error: 'Zu viele Anfragen. Bitte warte einen Moment.' });
  }
  next();
}

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateMap) {
    if (now > entry.resetAt) rateMap.delete(ip);
  }
}, 300_000);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// GET leaderboard
app.get('/api/scores', (req, res) => {
  try {
    const mode = req.query.mode;
    const rows = mode ? topScoresByMode.all({ game_mode: mode }) : topScores.all();
    res.json(rows);
  } catch (err) {
    console.error('GET /api/scores error:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

// GET personal best
app.get('/api/scores/personal', (req, res) => {
  try {
    const name = req.query.name;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Name required' });
    }
    const rows = personalBest.all({ name: name.trim() });
    res.json(rows);
  } catch (err) {
    console.error('GET /api/scores/personal error:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

// POST new score
app.post('/api/scores', rateLimit, (req, res) => {
  try {
    const { name, wave, kills, time_s, difficulty, game_mode, damage, seed } = req.body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 20) {
      return res.status(400).json({ error: 'Name muss 1-20 Zeichen lang sein' });
    }
    if (typeof kills !== 'number' || kills < 0) {
      return res.status(400).json({ error: 'Ungültige Kills' });
    }
    if (typeof time_s !== 'number' || time_s < 0) {
      return res.status(400).json({ error: 'Ungültige Spielzeit' });
    }

    const result = insertScore.run({
      name: name.trim().slice(0, 20),
      wave: Number(wave) || 0,
      kills: Math.floor(kills),
      time_s: Math.floor(time_s),
      difficulty: ['leicht', 'mittel', 'schwer'].includes(difficulty) ? difficulty : 'leicht',
      game_mode: ['endlos', 'wellen'].includes(game_mode) ? game_mode : 'endlos',
      damage: Number(damage) || 0,
      seed: typeof seed === 'string' ? seed.trim().slice(0, 10) : '',
    });

    res.status(201).json({ id: result.lastInsertRowid });
  } catch (err) {
    console.error('POST /api/scores error:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Leaderboard API listening on :${PORT}`);
});
