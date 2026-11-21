import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeTokens, compareText, scoreAttempt, estimateLevel, rateScore, estimateFromHistory, levenshtein } from '../js/scoring.js';
import { buildTips } from '../js/tips.js';

test('normalises contractions, numbers, spelling variants and punctuation', () => {
  assert.deepEqual(normalizeTokens("I'm 25, it's 7:00!"), ['i', 'am', 'twenty', 'five', 'it', 'is', 'seven', 'oclock']);
  assert.deepEqual(normalizeTokens('My favourite colour'), ['my', 'favorite', 'color']);
  assert.deepEqual(normalizeTokens('twenty-five Wi-Fi'), ['twenty', 'five', 'wi', 'fi']);
  assert.equal(levenshtein('think', 'sink'), 2);
});

test('perfect reading scores 100 with every word correct', () => {
  const r = scoreAttempt("I'd like a glass of water, please.", { alternatives: ['I would like a glass of water please'], durationSec: 2.6 }, 'sentence');
  assert.ok(r.words.every((w) => w.status === 'correct'));
  assert.equal(r.pronunciation, 100);
  assert.ok(r.overall >= 95, `overall ${r.overall}`);
});

test('word-by-word comparison marks close, wrong and missing words', () => {
  const c = compareText('I think this is the right street.', 'I sink this is right three');
  const st = Object.fromEntries(c.words.map((w) => [w.norm, w.status]));
  assert.equal(st.think, 'close');
  assert.equal(st.the, 'missing');
  assert.equal(st.right, 'correct');
  assert.notEqual(st.street, 'correct');
  assert.ok(c.accuracy < 80);
});

test('homophones are not penalised', () => {
  const c = compareText('Turn right at the corner.', 'turn write at the corner');
  assert.ok(c.words.every((w) => w.status === 'correct'));
});

test('picks the best recognition alternative', () => {
  const r = scoreAttempt('ship', { alternatives: ['sheep', 'ship'] }, 'word');
  assert.equal(r.overall, 100);
  assert.equal(r.transcript, 'ship');
  assert.equal(r.fluency, null);
});

test('no speech gives zero and a microphone tip', () => {
  const r = scoreAttempt('Hello there', { alternatives: [] }, 'sentence');
  assert.equal(r.pronunciation, 0);
  assert.ok(r.words.every((w) => w.status === 'missing'));
  assert.equal(buildTips(r)[0].id, 'noSpeech');
});

test('fluency drops for very slow speech and fillers', () => {
  const t = 'Could you tell me the way to the station?';
  const good = scoreAttempt(t, { alternatives: ['could you tell me the way to the station'], durationSec: 3.5 }, 'sentence');
  const slow = scoreAttempt(t, { alternatives: ['um could you uh tell me the way to the station'], durationSec: 14 }, 'sentence');
  assert.ok(good.fluency > slow.fluency + 20, `${good.fluency} vs ${slow.fluency}`);
  assert.equal(rateScore(130), 100);
});

test('tips detect TH and dropped endings', () => {
  const r = scoreAttempt('I think she worked yesterday.', { alternatives: ['I sink she work yesterday'], durationSec: 2 }, 'sentence');
  const ids = buildTips(r).map((t) => t.id);
  assert.ok(ids.includes('th'), ids.join());
  assert.ok(ids.includes('ed'), ids.join());
});

test('level bands and history estimate', () => {
  assert.equal(estimateLevel(95).cefr, 'C2');
  assert.equal(estimateLevel(60).cefr, 'B1');
  assert.equal(estimateLevel(10).cefr, 'A1');
  assert.equal(estimateFromHistory([{ overall: 90, type: 'word' }]), null);
  const est = estimateFromHistory([{ overall: 80, type: 'sentence' }, { overall: 70, type: 'paragraph' }, { overall: 100, type: 'word' }]);
  assert.equal(est.cefr, 'B2');
});
