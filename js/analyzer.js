// Free-speaking Speech Analyzer: scores an unscripted answer from its transcript and timing.
import { normalizeTokens, isFiller, estimateLevel, rateScore } from './scoring.js';
import { checkGrammar } from './grammar.js';

const CONNECTORS = ['because', 'so', 'but', 'however', 'although', 'also', 'first', 'firstly', 'second', 'then', 'finally', 'for example', 'for instance', 'in addition', 'moreover', 'on the other hand', 'in my opinion', 'i think', 'i believe', 'as a result', 'which', 'when', 'while', 'actually', 'especially', 'overall'];
const BASIC = new Set('i you he she it we they a an the is am are was were be to of and in on at for with my your it this that have has do does did not very good bad like go get make so but because yes no can will would there here what when where how why me him her them our their its'.split(' '));

export function analyzeFree(transcript, { durationSec = 0, confidence = 0, part = 1 } = {}) {
  const all = normalizeTokens(transcript);
  const fillers = all.filter(isFiller).length;
  const tokens = all.filter((w) => !isFiller(w));
  const n = tokens.length;
  if (!n) return null;
  const text = ' ' + tokens.join(' ') + ' ';
  const wpm = durationSec > 1 ? Math.round(n / (durationSec / 60)) : null;
  const target = part === 2 ? 120 : part === 3 ? 60 : 30; // words for a full answer
  const lengthScore = Math.min(100, Math.round((n / target) * 100));
  // Fluency: speaking rate + fillers + answer length.
  const rate = wpm == null ? 70 : rateScore(Math.min(wpm, 200));
  const fluency = Math.round(Math.max(0, Math.min(100, rate * 0.6 + lengthScore * 0.4 - Math.min(30, (fillers / n) * 300))));
  // Vocabulary: lexical variety + share of less-basic words.
  const unique = new Set(tokens);
  const variety = unique.size / n;
  const advanced = [...unique].filter((w) => !BASIC.has(w) && w.length >= 6).length;
  const vocabulary = Math.round(Math.min(100, 30 + variety * 30 + Math.min(40, (advanced / unique.size) * 100) - (n >= 20 ? 0 : 15)));
  // Grammar.
  const g = checkGrammar(transcript);
  const grammar = Math.round(Math.max(20, 100 - (g.issues.length / Math.max(1, n / 20)) * 18));
  // Coherence: connectors.
  const used = CONNECTORS.filter((c) => text.includes(` ${c} `));
  const coherence = Math.round(Math.min(100, 45 + used.length * 12 + (n >= target ? 10 : 0)));
  // Pronunciation proxy: recogniser confidence (when provided) — words it was unsure about lower it.
  const pronunciation = confidence > 0 ? Math.round(Math.min(100, 40 + confidence * 60)) : null;
  const parts = [[fluency, 0.3], [vocabulary, 0.2], [grammar, 0.2], [coherence, 0.15], [pronunciation ?? fluency, 0.15]];
  // Short answers cannot demonstrate a high level: cap the score until the answer is ~2× the target length.
  const cap = 35 + 65 * Math.min(1, n / (target * 2));
  const overall = Math.round(Math.min(cap, parts.reduce((s, [v, w]) => s + v * w, 0)));
  return {
    overall, fluency, vocabulary, grammar, coherence, pronunciation, wpm, words: n, fillers,
    connectors: used, issues: g.issues, corrected: g.issues.length ? g.corrected : null,
    level: estimateLevel(overall), lengthScore, target,
  };
}

export function freeTips(r) {
  const tips = [];
  if (r.lengthScore < 70) tips.push({ icon: '📏', vi: `Câu trả lời còn ngắn (${r.words}/${r.target} từ). Hãy thêm lý do và ví dụ: "because…", "for example…".`, en: 'Your answer is short. Add reasons and examples.' });
  if (r.fillers >= 3) tips.push({ icon: '🤐', vi: `Có ${r.fillers} âm ngập ngừng (uh, um). Hãy dừng ngắn im lặng hoặc dùng "Well, …", "Let me think…".`, en: 'Replace fillers with short silent pauses or "Well, …".' });
  if (r.wpm != null && r.wpm < 80) tips.push({ icon: '🐢', vi: `Tốc độ ${r.wpm} từ/phút hơi chậm. Mục tiêu 110–150 từ/phút: luyện nói theo cụm, nối âm.`, en: 'Aim for 110–150 words per minute.' });
  if (r.wpm != null && r.wpm > 190) tips.push({ icon: '🐇', vi: `Tốc độ ${r.wpm} từ/phút khá nhanh — chậm lại để rõ âm cuối.`, en: 'Slow down a little.' });
  if (r.connectors.length < 2) tips.push({ icon: '🔗', vi: 'Dùng thêm từ nối để câu trả lời mạch lạc: because, however, for example, in addition, overall.', en: 'Use linking words: because, however, for example.' });
  if (r.vocabulary < 60) tips.push({ icon: '📚', vi: 'Từ vựng còn lặp lại. Thử thay từ cơ bản bằng từ cụ thể hơn (good → delicious / helpful / impressive).', en: 'Vary your vocabulary.' });
  if (r.issues.length) tips.push({ icon: '✏️', vi: `Có ${r.issues.length} lỗi ngữ pháp phổ biến — xem phần sửa lỗi.`, en: 'See the grammar corrections.' });
  if (!tips.length) tips.push({ icon: '🌟', vi: 'Câu trả lời tốt! Thử câu hỏi Part 2/3 để thử thách hơn.', en: 'Great answer! Try a Part 2 or 3 question.' });
  return tips;
}
