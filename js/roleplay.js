// Deterministic "AI tutor" feedback for role-play replies: relevance (keywords), completeness
// (length), grammar (rule checker) and, for spoken replies, recognition confidence.
import { normalizeTokens } from './scoring.js';
import { checkGrammar } from './grammar.js';

const hasPhrase = (tokens, phrase) => {
  const p = normalizeTokens(phrase);
  outer: for (let i = 0; i + p.length <= tokens.length; i++) {
    for (let k = 0; k < p.length; k++) if (tokens[i + k] !== p[k]) continue outer;
    return true;
  }
  return false;
};

const NOT_NAMES = new Set(['a', 'an', 'the', 'from', 'fine', 'good', 'ok', 'okay', 'not', 'very', 'so', 'here', 'sorry', 'student', 'teacher', 'engineer', 'ready', 'happy', 'glad', 'looking', 'doing', 'working', 'interested', 'and', 'in', 'at']);

/** Try to pull the learner's first name out of "my name is X" / "I'm X" / "call me X". */
export function extractName(text) {
  const m = String(text).match(/\b(?:my name is|my name's|call me|i am|i'm|this is)\s+([a-zà-ỹ][a-zà-ỹ'-]*)/i);
  if (!m) return null;
  const n = m[1];
  if (NOT_NAMES.has(n.toLowerCase())) return null;
  return n[0].toUpperCase() + n.slice(1).toLowerCase();
}

/**
 * @param {object} turn scenario turn ({kw, samples, min, hint})
 * @param {string} reply learner's reply text
 * @param {{voice?: boolean, confidence?: number}} opts
 */
export function evaluateReply(turn, reply, opts = {}) {
  const tokens = normalizeTokens(reply);
  const wordCount = tokens.length;
  const matched = turn.kw.filter((k) => hasPhrase(tokens, k));
  const relevance = wordCount === 0 ? 0 : matched.length >= 2 ? 100 : matched.length === 1 ? 85 : 35;
  const completeness = Math.min(100, Math.round((wordCount / Math.max(turn.min, 1)) * 100));
  const grammar = checkGrammar(reply);
  const grammarScore = wordCount === 0 ? 0 : Math.round(Math.max(30, 100 - grammar.issues.length * 25) * Math.min(1, wordCount / Math.max(turn.min, 1)));
  const parts = [relevance * 0.45, completeness * 0.25, grammarScore * 0.3];
  let score = parts.reduce((a, b) => a + b, 0);
  let clarity = null;
  if (opts.voice && opts.confidence > 0) {
    clarity = Math.round(opts.confidence * 100);
    score = score * 0.85 + clarity * 0.15;
  }
  score = Math.round(score);

  const vi = [];
  const en = [];
  if (!wordCount) {
    vi.push('Bạn chưa trả lời. Hãy thử nói hoặc gõ một câu nhé.');
    en.push('You did not answer yet.');
  } else {
    if (relevance >= 85) { vi.push('Câu trả lời đúng ý, phù hợp với câu hỏi. 👍'); en.push('Your answer fits the question.'); }
    else { vi.push(`Câu trả lời chưa đúng trọng tâm. Gợi ý: ${turn.hint}`); en.push('Your answer does not quite answer the question.'); }
    if (completeness < 100) { vi.push(`Câu hơi ngắn (${wordCount} từ). Hãy nói thành câu đầy đủ, thêm chi tiết (ít nhất ${turn.min} từ).`); en.push(`Try a full sentence of at least ${turn.min} words.`); }
    if (grammar.issues.length) { vi.push(`Có ${grammar.issues.length} lỗi ngữ pháp cần sửa (xem bên dưới).`); en.push('Check the grammar notes below.'); }
    else if (wordCount >= 3) { vi.push('Không phát hiện lỗi ngữ pháp phổ biến. ✅'); en.push('No common grammar mistakes found.'); }
    if (clarity != null && clarity < 70) { vi.push('Máy nhận diện giọng chưa chắc chắn — hãy nói chậm, rõ các âm cuối.'); en.push('Speak more slowly and clearly.'); }
  }
  const rating = score >= 85 ? 'excellent' : score >= 65 ? 'good' : score >= 40 ? 'ok' : 'retry';
  return {
    score, rating, relevance, completeness, grammarScore, clarity, matched, wordCount,
    issues: grammar.issues, corrected: grammar.issues.length ? grammar.corrected : null,
    feedbackVi: vi, feedbackEn: en, better: turn.samples[0], name: extractName(reply),
  };
}

export const fillName = (text, name) => text.replace(/,?\s*\{name\}/g, (m) => (name ? m.replace('{name}', name) : '')).replace(/\s+([!?.])/g, '$1');
