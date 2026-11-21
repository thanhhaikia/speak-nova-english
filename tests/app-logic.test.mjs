import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPath, GOALS, dailyGoalXp } from '../js/path.js';
import { evaluateReply, extractName, fillName } from '../js/roleplay.js';
import { checkGrammar } from '../js/grammar.js';
import { analyzeFree } from '../js/analyzer.js';
import { xpFor, levelInfo, bumpStreak, liveStreak, starsFor } from '../js/gamify.js';
import { defaultState, recordAttempt, finishLesson, checkAchievements, load, save, setStorage } from '../js/store.js';
import { scoreAttempt } from '../js/scoring.js';
import { lessonById } from '../js/content/courses.js';
import { scenarioById } from '../js/content/scenarios.js';

test('learning path follows the goal and level', () => {
  for (const g of GOALS) for (const level of [0, 2, 4]) {
    const path = buildPath({ goal: g.id, level });
    assert.ok(path.length >= 8, `${g.id}/${level}`);
    for (const s of path) assert.ok(s.kind === 'lesson' ? lessonById(s.id) : scenarioById(s.id), s.id);
    assert.equal(new Set(path.map((s) => s.kind + s.id)).size, path.length, 'no duplicates');
  }
  const ielts = buildPath({ goal: 'ielts', level: 2 });
  assert.ok(ielts.some((s) => s.id.startsWith('p1-')));
  const work = buildPath({ goal: 'work', level: 2 });
  assert.ok(work.some((s) => s.id === 'job-interview'));
  assert.equal(buildPath({ goal: 'daily', level: 0 })[0].id, 'final-stops');
  assert.equal(dailyGoalXp(10), 40);
});

test('role-play reply evaluation', () => {
  const turn = scenarioById('order-food').turns[2];
  const good = evaluateReply(turn, "I'd like the grilled chicken with rice, please.");
  assert.ok(good.score >= 85, `good ${good.score}`);
  const off = evaluateReply(turn, 'Yes');
  assert.ok(off.score < 50, `off ${off.score}`);
  const bad = evaluateReply(turn, 'I want order chicken');
  assert.ok(bad.issues.length >= 1);
  assert.match(bad.corrected, /want to order/i);
  assert.equal(extractName("Hi, I'm Minh."), 'Minh');
  assert.equal(extractName("I'm fine"), null);
  assert.equal(fillName('Nice to meet you, {name}!', null), 'Nice to meet you!');
});

test('grammar checker fixes common Vietnamese-learner mistakes', () => {
  const cases = { 'I am agree': 'I agree', 'I have 20 years old': 'I am 20 years old', 'She go to work': 'She goes to work', 'Yesterday I go shopping': 'Yesterday I went shopping', 'I am student': 'I am a student' };
  for (const [wrong, right] of Object.entries(cases)) assert.equal(checkGrammar(wrong).corrected, right);
  assert.equal(checkGrammar('She has a dog and he likes cats.').issues.length, 0);
});

test('free-speech analyzer rewards longer, connected answers', () => {
  const short = analyzeFree('I like football.', { durationSec: 3, part: 1 });
  const long = analyzeFree('I usually spend my weekends with my family because we are busy during the week. For example, last Saturday we went to a lovely restaurant near the river, and then we watched a film. However, sometimes I prefer staying at home and reading.', { durationSec: 22, confidence: 0.9, part: 1 });
  assert.ok(long.overall > short.overall + 20, `${long.overall} vs ${short.overall}`);
  assert.ok(long.connectors.includes('because'));
  assert.equal(analyzeFree('', {}), null);
});

test('xp, levels, streaks and stars', () => {
  assert.ok(xpFor('paragraph', 95) > xpFor('word', 95));
  assert.equal(levelInfo(0).level, 1);
  assert.equal(levelInfo(60).level, 2);
  let s = bumpStreak(undefined, '2026-01-01');
  s = bumpStreak(s, '2026-01-02');
  s = bumpStreak(s, '2026-01-02');
  assert.equal(s.current, 2);
  s = bumpStreak(s, '2026-01-05');
  assert.deepEqual([s.current, s.best], [1, 2]);
  assert.equal(liveStreak({ current: 4, last: '2026-01-01' }, '2026-01-03'), 0);
  assert.equal(starsFor(90), 3);
});

test('store records attempts, lessons and achievements, and persists', () => {
  const mem = new Map();
  setStorage({ getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) });
  const st = defaultState();
  st.profile = { goal: 'daily', level: 0, minutes: 5 };
  const r = scoreAttempt('think', { alternatives: ['think'] }, 'word');
  const xp = recordAttempt(st, r, {}, '2026-02-01');
  assert.ok(xp > 0 && st.xp === xp && st.streak.current === 1);
  assert.equal(st.words.think.best, 100);
  const res = finishLesson(st, 'th', [90, 85, 88]);
  assert.equal(res.stars, 3);
  const ids = checkAchievements(st, { soundLessons: ['th'], scenarioIds: ['x'] }).map((a) => a.id);
  for (const id of ['first-word', 'perfect', 'lesson-1', 'three-stars', 'th-hero', 'sounds-master']) assert.ok(ids.includes(id), id);
  save(st);
  assert.equal(load().xp, st.xp);
});
