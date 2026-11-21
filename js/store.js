// Progress persisted in localStorage.
import { bumpStreak, dayKey, xpFor, newAchievements, starsFor } from './gamify.js';
import { dailyGoalXp } from './path.js';

export const KEY = 'speak-nova-english.v1';
const MAX_ATTEMPTS = 300;

export const defaultState = () => ({
  version: 1,
  profile: null, // {name, goal, level, minutes, createdAt}
  settings: { accent: 'en-US', gender: 'female', rate: 0.9, tutor: 'vi' },
  path: [],
  xp: 0,
  days: {}, // YYYY-MM-DD → xp earned
  streak: { current: 0, best: 0, last: null },
  lessons: {}, // id → {best, avg, stars, done, plays}
  scenarios: {}, // id → {best, plays}
  words: {}, // word → {best, plays}
  attempts: [], // newest first: compact speaking reports
  achievements: {}, // id → date
  stats: { attempts: 0, perfect: 0, free: 0, turns: 0 },
});

let storage = typeof localStorage !== 'undefined' ? localStorage : null;
export const setStorage = (s) => { storage = s; };

export function load() {
  try {
    const raw = storage?.getItem(KEY);
    if (!raw) return defaultState();
    const d = defaultState();
    const s = JSON.parse(raw);
    return { ...d, ...s, settings: { ...d.settings, ...s.settings }, stats: { ...d.stats, ...s.stats }, streak: { ...d.streak, ...s.streak } };
  } catch {
    return defaultState();
  }
}
export function save(state) {
  try { storage?.setItem(KEY, JSON.stringify(state)); } catch { /* quota or private mode */ }
}

/** Add XP for today and update the streak. Returns earned XP. */
export function addXp(state, xp, today = dayKey()) {
  state.xp += xp;
  state.days[today] = (state.days[today] || 0) + xp;
  state.streak = bumpStreak(state.streak, today);
  return xp;
}

/** Record a scored speaking attempt (report from scoring.scoreAttempt). */
export function recordAttempt(state, report, meta = {}, today = dayKey()) {
  const kind = meta.kind || report.type;
  const xp = addXp(state, xpFor(kind, report.overall), today);
  state.stats.attempts++;
  if (report.overall >= 100) state.stats.perfect++;
  if (kind === 'free') state.stats.free++;
  if (report.type === 'word') {
    const k = report.target.toLowerCase().replace(/[^a-z' -]/g, '');
    const w = state.words[k] || { best: 0, plays: 0 };
    state.words[k] = { best: Math.max(w.best, report.overall), plays: w.plays + 1 };
  }
  state.attempts.unshift({
    t: Date.now(), day: today, kind, type: report.type, target: report.target.slice(0, 160), transcript: (report.transcript || '').slice(0, 200),
    overall: report.overall, pronunciation: report.pronunciation, fluency: report.fluency, completeness: report.completeness, lesson: meta.lesson || null,
  });
  state.attempts.length = Math.min(state.attempts.length, MAX_ATTEMPTS);
  return xp;
}

export function finishLesson(state, lessonId, scores) {
  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / Math.max(scores.length, 1));
  const prev = state.lessons[lessonId] || { best: 0, plays: 0, stars: 0 };
  const stars = starsFor(avg);
  state.lessons[lessonId] = { best: Math.max(prev.best, avg), avg, stars: Math.max(prev.stars, stars), done: prev.done || avg >= 50, plays: prev.plays + 1 };
  const bonus = avg >= 50 ? addXp(state, 20 + stars * 10) : 0;
  return { avg, stars, bonus, passed: avg >= 50 };
}

export function finishScenario(state, scenarioId, scores) {
  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / Math.max(scores.length, 1));
  const prev = state.scenarios[scenarioId] || { best: 0, plays: 0 };
  state.scenarios[scenarioId] = { best: Math.max(prev.best, avg), plays: prev.plays + 1 };
  const bonus = addXp(state, 15 + Math.round(avg / 10) * 2);
  return { avg, bonus };
}

export function recordTurn(state, score, today = dayKey()) {
  state.stats.turns++;
  return addXp(state, xpFor('turn', score), today);
}

/** Unlock and return new achievements. */
export function checkAchievements(state, ctx) {
  const unlocked = newAchievements(state, { dailyGoal: dailyGoalXp(state.profile?.minutes || 10), ...ctx });
  for (const a of unlocked) state.achievements[a.id] = dayKey();
  return unlocked;
}

export function exportJson(state) { return JSON.stringify(state, null, 2); }
export function importJson(text) {
  const s = JSON.parse(text);
  if (!s || typeof s !== 'object' || Array.isArray(s) || typeof s.xp !== 'number') throw new Error('invalid');
  const d = defaultState();
  const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
  const out = { ...d, ...s };
  for (const k of Object.keys(d)) {
    if (d[k] === null || s[k] === undefined) continue;
    if (Array.isArray(d[k]) ? !Array.isArray(s[k]) : isObj(d[k]) ? !isObj(s[k]) : typeof s[k] !== typeof d[k]) throw new Error(`invalid ${k}`);
    if (isObj(d[k])) out[k] = { ...d[k], ...s[k] };
  }
  return out;
}
