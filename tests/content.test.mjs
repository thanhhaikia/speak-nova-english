import test from 'node:test';
import assert from 'node:assert/strict';
import { COURSES, LESSONS, lessonItems, ALL_PROMPTS } from '../js/content/courses.js';
import { SCENARIOS } from '../js/content/scenarios.js';
import { WORDS, lookup } from '../js/content/dictionary.js';

test('courses cover the requested topics', () => {
  assert.deepEqual(COURSES.map((c) => c.id), ['sounds', 'daily', 'travel', 'business', 'ielts']);
  assert.equal(new Set(LESSONS.map((l) => l.id)).size, LESSONS.length);
  for (const l of LESSONS) {
    assert.ok(l.words.length >= 3 && l.sentences.length >= 2, l.id);
    assert.ok(l.paragraph[0].split(' ').length >= 15, `${l.id} paragraph`);
    assert.ok(l.sentences.every(([en, vi]) => en && vi), `${l.id} translations`);
    assert.deepEqual(lessonItems(l).map((x) => x.type).slice(-1), ['paragraph']);
  }
  assert.ok(ALL_PROMPTS.length >= 10);
});

test('every practice word is in the pronunciation dictionary', () => {
  const missing = [...new Set(LESSONS.flatMap((l) => l.words))].filter((w) => !lookup(w));
  assert.deepEqual(missing, []);
  for (const w of WORDS) assert.ok(w.us.length > 2 && w.uk.length > 2 && w.vi, w.w);
  assert.equal(new Set(WORDS.map((w) => w.w)).size, WORDS.length, 'no duplicate entries');
});

test('scenarios include the requested situations with complete turns', () => {
  for (const id of ['introduce', 'order-food', 'job-interview', 'airport', 'hotel', 'shopping']) assert.ok(SCENARIOS.find((s) => s.id === id), id);
  for (const s of SCENARIOS) {
    assert.ok(s.turns.length >= 3, s.id);
    for (const t of s.turns) assert.ok(t.ai && t.vi && t.hint && t.kw.length && t.samples.length, `${s.id}: ${t.ai}`);
    assert.ok(s.closing.ai && s.closing.vi);
  }
});
