// Pronunciation scoring: normalise target + recognised transcript, align them word by word,
// and turn the alignment into pronunciation / fluency / completeness scores and a level estimate.

const ONES = 'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split(' ');
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const ORD = { one: 'first', two: 'second', three: 'third', five: 'fifth', eight: 'eighth', nine: 'ninth', twelve: 'twelfth' };

export function numberToWords(n) {
  n = Math.floor(Math.abs(n));
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : '');
  if (n < 1000) return ONES[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' ' + numberToWords(n % 100) : '');
  if (n < 1e6) return numberToWords(Math.floor(n / 1000)) + ' thousand' + (n % 1000 ? ' ' + numberToWords(n % 1000) : '');
  return String(n);
}

function ordinalWords(n) {
  const words = numberToWords(n).split(' ');
  const last = words.pop();
  const ord = ORD[last] || (last.endsWith('y') ? last.slice(0, -1) + 'ieth' : last + 'th');
  return [...words, ord].join(' ');
}

const CONTRACTIONS = {
  "i'm": 'i am', "you're": 'you are', "he's": 'he is', "she's": 'she is', "it's": 'it is', "we're": 'we are', "they're": 'they are',
  "that's": 'that is', "there's": 'there is', "what's": 'what is', "where's": 'where is', "who's": 'who is', "how's": 'how is', "let's": 'let us',
  "i've": 'i have', "you've": 'you have', "we've": 'we have', "they've": 'they have', "i'd": 'i would', "you'd": 'you would', "he'd": 'he would',
  "she'd": 'she would', "we'd": 'we would', "they'd": 'they would', "i'll": 'i will', "you'll": 'you will', "he'll": 'he will', "she'll": 'she will',
  "we'll": 'we will', "they'll": 'they will', "it'll": 'it will', "isn't": 'is not', "aren't": 'are not', "wasn't": 'was not', "weren't": 'were not',
  "don't": 'do not', "doesn't": 'does not', "didn't": 'did not', "can't": 'can not', cannot: 'can not', "couldn't": 'could not', "won't": 'will not',
  "wouldn't": 'would not', "shouldn't": 'should not', "haven't": 'have not', "hasn't": 'has not', "hadn't": 'had not', "mustn't": 'must not',
  "o'clock": 'oclock', "name's": 'name is',
};

// British ↔ American spellings and written forms the recogniser may output differently.
const VARIANTS = {
  favourite: 'favorite', colour: 'color', centre: 'center', practise: 'practice', theatre: 'theater', travelling: 'traveling', travelled: 'traveled',
  organise: 'organize', realise: 'realize', apologise: 'apologize', prioritise: 'prioritize', neighbour: 'neighbor', honour: 'honor', grey: 'gray',
  programme: 'program', metres: 'meters', metre: 'meter', ok: 'okay', mr: 'mister', mrs: 'missus', dr: 'doctor', wifi: 'wi fi', tv: 't v',
  email: 'e mail', percent: 'percent', '%': 'percent', cheque: 'check',
};

// Words a speech recogniser cannot tell apart; saying one counts as saying the other.
const HOMOPHONES = [
  ['to', 'two', 'too'], ['there', 'their', 'theyre'], ['right', 'write'], ['see', 'sea'], ['for', 'four'], ['by', 'buy', 'bye'], ['hear', 'here'],
  ['know', 'no'], ['new', 'knew'], ['one', 'won'], ['ate', 'eight'], ['week', 'weak'], ['meet', 'meat'], ['whole', 'hole'], ['son', 'sun'],
  ['mail', 'male'], ['pair', 'pear'], ['peace', 'piece'], ['plane', 'plain'], ['sale', 'sail'], ['wait', 'weight'], ['wear', 'where'],
  ['which', 'witch'], ['would', 'wood'], ['your', 'youre'], ['its', 'it is'], ['road', 'rode'], ['flour', 'flower'], ['our', 'hour'],
  ['allowed', 'aloud'], ['break', 'brake'], ['cell', 'sell'], ['sent', 'cent', 'scent'], ['seen', 'scene'], ['steal', 'steel'], ['tail', 'tale'],
  ['through', 'threw'], ['weather', 'whether'], ['red', 'read'], ['lead', 'led'], ['in', 'inn'], ['be', 'bee'], ['so', 'sew'], ['blue', 'blew'],
  ['eye', 'i'], ['oh', 'o'], ['okay', 'k'], ['mister', 'mr'], ['grey', 'gray'],
];
const HOMO = new Map();
for (const group of HOMOPHONES) for (const w of group) HOMO.set(w, new Set(group));

const FILLERS = new Set(['uh', 'um', 'er', 'erm', 'ah', 'hmm', 'mm', 'uhm', 'eh']);
export const isFiller = (w) => FILLERS.has(w);

/** Normalise one whitespace-separated chunk into comparison tokens. */
export function normChunk(chunk) {
  let s = String(chunk).toLowerCase().replace(/[’‘`´]/g, "'");
  s = s.replace(/\$(\d+)/g, '$1 dollars').replace(/(\d)%/g, '$1 percent').replace(/%/g, ' percent');
  s = s.replace(/(\d{1,2}):00\b/g, '$1 oclock').replace(/(\d{1,2}):(\d{2})/g, '$1 $2');
  s = s.replace(/\b(\d+)(st|nd|rd|th)\b/g, (_, n) => ordinalWords(+n));
  s = s.replace(/(\d),(\d{3})/g, '$1$2');
  s = s.replace(/[-–—/]/g, ' ');
  const out = [];
  for (let part of s.split(/\s+/)) {
    part = part.replace(/[^a-z0-9']/g, '').replace(/^'+|'+$/g, '');
    if (!part) continue;
    if (/^\d+$/.test(part)) {
      out.push(...numberToWords(+part).split(' '));
      continue;
    }
    if (/^\d+[a-z]+$/.test(part)) {
      const [, d, rest] = part.match(/^(\d+)([a-z]+)$/);
      out.push(...numberToWords(+d).split(' '), rest);
      continue;
    }
    const expanded = CONTRACTIONS[part] || VARIANTS[part] || part;
    for (const w of expanded.split(' ')) out.push(VARIANTS[w] && !VARIANTS[w].includes(' ') ? VARIANTS[w] : w);
  }
  return out;
}

/** Full text → flat list of normalised tokens. */
export function normalizeTokens(text) {
  return String(text || '').split(/\s+/).flatMap(normChunk);
}
export const normalizeText = (text) => normalizeTokens(text).join(' ');

/** Target text → display tokens, each with its normalised sub-tokens. */
export function tokenizeTarget(text) {
  return String(text || '')
    .split(/\s+/)
    .filter(Boolean)
    .map((display) => ({ display, norms: normChunk(display) }))
    .filter((t) => t.norms.length);
}

export function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}

export const similarity = (a, b) => 1 - levenshtein(a, b) / Math.max(a.length, b.length, 1);
export const equivalent = (a, b) => a === b || !!HOMO.get(a)?.has(b);
const CLOSE = 0.6;

/**
 * Align target tokens with heard tokens (weighted edit distance on words).
 * Returns per-target-token { status: correct|close|wrong|missing, heard } and the extra heard tokens.
 */
export function alignTokens(target, heard) {
  const m = target.length, n = heard.length;
  const subCost = (a, b) => (equivalent(a, b) ? 0 : 1.5 * (1 - similarity(a, b)) + 0.1);
  const D = Array.from({ length: m + 1 }, () => new Float64Array(n + 1));
  for (let i = 1; i <= m; i++) D[i][0] = i;
  for (let j = 1; j <= n; j++) D[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++) D[i][j] = Math.min(D[i - 1][j] + 1, D[i][j - 1] + 1, D[i - 1][j - 1] + subCost(target[i - 1], heard[j - 1]));
  const res = new Array(m);
  const extras = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && Math.abs(D[i][j] - (D[i - 1][j - 1] + subCost(target[i - 1], heard[j - 1]))) < 1e-9) {
      const t = target[i - 1], h = heard[j - 1];
      const status = equivalent(t, h) ? 'correct' : similarity(t, h) >= CLOSE ? 'close' : 'wrong';
      res[i - 1] = { status, heard: h };
      i--; j--;
    } else if (i > 0 && Math.abs(D[i][j] - (D[i - 1][j] + 1)) < 1e-9) {
      res[i - 1] = { status: 'missing', heard: '' };
      i--;
    } else {
      extras.unshift(heard[j - 1]);
      j--;
    }
  }
  return { tokens: res, extras };
}

const WORD_VALUE = { correct: 1, close: 0.5, wrong: 0, missing: 0 };

/** Compare the target with one recognised transcript. */
export function compareText(targetText, heardText) {
  const words = tokenizeTarget(targetText);
  const flat = [];
  words.forEach((w, wi) => w.norms.forEach((t) => flat.push({ t, wi })));
  const heard = normalizeTokens(heardText);
  const { tokens, extras } = alignTokens(flat.map((x) => x.t), heard);
  const parts = words.map(() => []);
  flat.forEach((x, k) => parts[x.wi].push(tokens[k]));
  const result = words.map((w, wi) => {
    const ps = parts[wi];
    const st = ps.map((p) => p.status);
    let status;
    if (st.every((s) => s === 'correct')) status = 'correct';
    else if (st.every((s) => s === 'missing')) status = 'missing';
    else if (st.some((s) => s === 'correct' || s === 'close')) status = 'close';
    else status = 'wrong';
    return { text: w.display, norm: w.norms.join(' '), status, heard: ps.map((p) => p.heard).filter(Boolean).join(' ') };
  });
  const n = result.length || 1;
  const accuracy = (result.reduce((s, w) => s + WORD_VALUE[w.status], 0) / n) * 100;
  const completeness = (result.filter((w) => w.status !== 'missing').length / n) * 100;
  return { words: result, extras, accuracy, completeness };
}

const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));

/** Speaking-rate score for read-aloud: 100 inside the natural band, falling off outside it. */
export function rateScore(wpm) {
  if (wpm >= 100 && wpm <= 170) return 100;
  if (wpm < 100) return clamp(100 - (100 - wpm) * 1.2);
  return clamp(100 - (wpm - 170));
}

export const LEVEL_BANDS = [
  { min: 92, cefr: 'C2', ielts: '8.0+', vi: 'Thành thạo' },
  { min: 82, cefr: 'C1', ielts: '7.0–7.5', vi: 'Cao cấp' },
  { min: 70, cefr: 'B2', ielts: '6.0–6.5', vi: 'Trung cấp trên' },
  { min: 55, cefr: 'B1', ielts: '5.0–5.5', vi: 'Trung cấp' },
  { min: 40, cefr: 'A2', ielts: '4.0–4.5', vi: 'Sơ cấp' },
  { min: 0, cefr: 'A1', ielts: '≤ 3.5', vi: 'Mới bắt đầu' },
];
export const estimateLevel = (score) => LEVEL_BANDS.find((b) => score >= b.min);

/**
 * Score one speaking attempt.
 * @param {string} target text the learner was asked to read
 * @param {{alternatives: string[], confidence?: number, durationSec?: number}} rec recognition result
 * @param {'word'|'sentence'|'paragraph'} type
 */
export function scoreAttempt(target, rec, type = 'sentence') {
  const alts = (rec.alternatives || []).filter((a) => a && a.trim());
  let best = null, bestIdx = 0;
  alts.forEach((alt, i) => {
    const c = compareText(target, alt);
    if (!best || c.accuracy > best.accuracy) [best, bestIdx] = [c, i];
  });
  if (!best) best = { ...compareText(target, ''), extras: [] };
  const conf = bestIdx === 0 && rec.confidence > 0 && rec.confidence <= 1 ? rec.confidence : 0;
  const pronunciation = Math.round(clamp(best.accuracy * (conf ? 0.85 + 0.15 * conf : 1)));
  const completeness = Math.round(best.completeness);
  const said = best.words.filter((w) => w.status !== 'missing').length;
  const fillers = best.extras.filter(isFiller).length;
  const others = best.extras.length - fillers;
  let fluency = null, wpm = null;
  if (type !== 'word') {
    const dur = rec.durationSec || 0;
    const penalty = Math.min(30, fillers * 8 + others * 4);
    if (dur >= 0.4 && said > 0) {
      wpm = Math.round(said / (dur / 60));
      fluency = Math.round(clamp(0.7 * rateScore(wpm) + 0.3 * completeness - penalty));
    } else {
      fluency = Math.round(clamp(completeness * 0.9 - penalty));
    }
  }
  const overall = Math.round(fluency == null ? pronunciation : 0.55 * pronunciation + 0.25 * fluency + 0.2 * completeness);
  return {
    type, target, overall, pronunciation, fluency, completeness, wpm,
    durationSec: rec.durationSec || 0, confidence: conf,
    transcript: alts[bestIdx] || '', words: best.words, extras: best.extras,
    level: estimateLevel(overall),
  };
}

/** Learner-level estimate from recent attempts (sentences/paragraphs weigh more than single words). */
export function estimateFromHistory(attempts) {
  const recent = attempts.filter((a) => Number.isFinite(a.overall)).slice(0, 30);
  if (recent.length < 3) return null;
  let sum = 0, w = 0;
  for (const a of recent) {
    const k = a.type === 'word' ? 0.5 : a.type === 'paragraph' ? 1.5 : 1;
    sum += a.overall * k;
    w += k;
  }
  const score = Math.round(sum / w);
  return { score, ...estimateLevel(score), samples: recent.length };
}
