// Personalised learning path from the onboarding survey.
import { COURSES, LESSONS } from './content/courses.js';
import { SCENARIOS } from './content/scenarios.js';

export const GOALS = [
  { id: 'daily', icon: '💬', vi: 'Giao tiếp hằng ngày', en: 'Daily communication', courses: ['daily', 'travel'] },
  { id: 'travel', icon: '✈️', vi: 'Du lịch', en: 'Travel', courses: ['travel', 'daily'] },
  { id: 'work', icon: '💼', vi: 'Công việc', en: 'Work', courses: ['business', 'daily'] },
  { id: 'ielts', icon: '🎓', vi: 'Luyện thi IELTS', en: 'IELTS', courses: ['ielts', 'daily'] },
];
export const LEVELS = [
  { id: 0, vi: 'Mới bắt đầu', desc: 'Biết vài từ, chưa nói được câu', cefr: 'A1' },
  { id: 1, vi: 'Sơ cấp', desc: 'Nói được câu đơn giản về bản thân', cefr: 'A2' },
  { id: 2, vi: 'Trung cấp', desc: 'Giao tiếp được các chủ đề quen thuộc', cefr: 'B1' },
  { id: 3, vi: 'Trung cấp trên', desc: 'Nói khá trôi chảy, muốn chuẩn hơn', cefr: 'B2' },
  { id: 4, vi: 'Nâng cao', desc: 'Tự tin, muốn đạt độ chính xác cao', cefr: 'C1+' },
];
export const MINUTES = [5, 10, 15, 30];

/** Daily XP goal: about 4 XP per minute of practice. */
export const dailyGoalXp = (minutes) => Math.max(20, Math.round(minutes * 4));

/**
 * Build an ordered list of steps ({kind: 'lesson'|'scenario', id}).
 * Beginners get every pronunciation lesson first; higher levels get the hardest sounds mixed in.
 */
export function buildPath({ goal = 'daily', level = 0 } = {}) {
  const g = GOALS.find((x) => x.id === goal) || GOALS[0];
  const maxLevel = Math.min(4, level + 1);
  const minLevel = Math.max(0, level - 1);
  const sounds = LESSONS.filter((l) => l.course === 'sounds').filter((l, i) => level <= 1 || i >= 2 || ['th', 'endings'].includes(l.id));
  const goalLessons = LESSONS.filter((l) => l.course === g.courses[0]).sort((a, b) => a.level - b.level);
  const fit = goalLessons.filter((l) => l.level <= maxLevel);
  const main = fit.length >= 3 ? fit : goalLessons.slice(0, 3);
  const second = LESSONS.filter((l) => l.course === g.courses[1] && l.level <= maxLevel && l.level >= minLevel).slice(0, 3);
  const scen = SCENARIOS.filter((s) => s.goals.includes(goal) && s.level <= maxLevel).sort((a, b) => a.level - b.level);

  const topic = [...main, ...second];
  const steps = [];
  const queues = { s: [...sounds], t: topic, r: [...scen] };
  // Rhythm: sound → topic → topic → role-play …
  const pattern = ['s', 't', 't', 'r'];
  for (let k = 0; queues.s.length || queues.t.length || queues.r.length; k++) {
    const q = queues[pattern[k % pattern.length]];
    const item = q.shift();
    if (!item) continue;
    steps.push(pattern[k % pattern.length] === 'r' ? { kind: 'scenario', id: item.id } : { kind: 'lesson', id: item.id });
  }
  return steps;
}

export function pathSummary(profile) {
  const g = GOALS.find((x) => x.id === profile.goal) || GOALS[0];
  const lvl = LEVELS[profile.level] || LEVELS[0];
  const courses = g.courses.map((id) => COURSES.find((c) => c.id === id)?.vi).filter(Boolean);
  return { goal: g, level: lvl, courses, dailyXp: dailyGoalXp(profile.minutes || 10) };
}
