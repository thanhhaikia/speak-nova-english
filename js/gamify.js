// XP, levels, streaks and achievements. Pure functions over the saved state.

export const XP_BASE = { word: 5, sentence: 10, paragraph: 20, free: 25, turn: 8 };

/** XP for one attempt: more for longer exercises and better scores. */
export function xpFor(kind, score) {
  const base = XP_BASE[kind] ?? 5;
  const factor = score >= 90 ? 1.5 : score >= 80 ? 1.2 : score >= 60 ? 1 : score >= 40 ? 0.6 : 0.3;
  return Math.max(1, Math.round(base * factor));
}

/** Level n needs 60·n·(n+1)/2 total XP (60, 180, 360, 600…). */
export const xpForLevel = (n) => (60 * n * (n + 1)) / 2;
export function levelInfo(xp) {
  let lvl = 0;
  while (xp >= xpForLevel(lvl + 1)) lvl++;
  const floor = xpForLevel(lvl), next = xpForLevel(lvl + 1);
  return { level: lvl + 1, xpInLevel: xp - floor, xpToNext: next - floor, progress: (xp - floor) / (next - floor) };
}

export const LEAGUES = [
  { min: 0, vi: 'Đồng', icon: '🥉' }, { min: 300, vi: 'Bạc', icon: '🥈' }, { min: 1000, vi: 'Vàng', icon: '🥇' },
  { min: 2500, vi: 'Bạch kim', icon: '💠' }, { min: 5000, vi: 'Kim cương', icon: '💎' },
];
export const leagueFor = (xp) => [...LEAGUES].reverse().find((l) => xp >= l.min);

export const dayKey = (d = new Date()) => {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
};
const dayDiff = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);

/** Update streak for activity on `today` (YYYY-MM-DD). Returns a new streak object. */
export function bumpStreak(streak = { current: 0, best: 0, last: null }, today = dayKey()) {
  if (streak.last === today) return streak;
  const gap = streak.last ? dayDiff(streak.last, today) : null;
  const current = gap === 1 ? streak.current + 1 : 1;
  return { current, best: Math.max(streak.best, current), last: today };
}
/** Streak as displayed (0 if the learner skipped yesterday). */
export const liveStreak = (streak, today = dayKey()) => (streak?.last && dayDiff(streak.last, today) <= 1 ? streak.current : 0);

export const ACHIEVEMENTS = [
  { id: 'first-word', icon: '🎤', vi: 'Lời đầu tiên', desc: 'Hoàn thành bài nói đầu tiên', test: (s) => s.stats.attempts >= 1 },
  { id: 'perfect', icon: '💯', vi: 'Hoàn hảo', desc: 'Đạt 100 điểm một bài nói', test: (s) => s.stats.perfect >= 1 },
  { id: 'fifty', icon: '🗣️', vi: 'Chăm chỉ', desc: 'Luyện 50 bài nói', test: (s) => s.stats.attempts >= 50 },
  { id: 'two-hundred', icon: '🏋️', vi: 'Bền bỉ', desc: 'Luyện 200 bài nói', test: (s) => s.stats.attempts >= 200 },
  { id: 'lesson-1', icon: '📗', vi: 'Bài học đầu tiên', desc: 'Hoàn thành 1 bài học', test: (s) => doneLessons(s) >= 1 },
  { id: 'lesson-10', icon: '📚', vi: 'Mọt sách', desc: 'Hoàn thành 10 bài học', test: (s) => doneLessons(s) >= 10 },
  { id: 'three-stars', icon: '⭐', vi: 'Ba sao', desc: 'Đạt 3 sao ở một bài học', test: (s) => Object.values(s.lessons).some((l) => l.stars >= 3) },
  { id: 'sounds-master', icon: '👅', vi: 'Bậc thầy phát âm', desc: 'Hoàn thành toàn bộ khóa Phát âm chuẩn', test: (s, ctx) => ctx.soundLessons.every((id) => s.lessons[id]?.done) },
  { id: 'th-hero', icon: '🦷', vi: 'Chinh phục TH', desc: 'Đạt ≥ 80 điểm bài âm TH', test: (s) => (s.lessons.th?.best || 0) >= 80 },
  { id: 'chat-1', icon: '💬', vi: 'Bắt chuyện', desc: 'Hoàn thành 1 hội thoại nhập vai', test: (s) => Object.keys(s.scenarios).length >= 1 },
  { id: 'chat-all', icon: '🌏', vi: 'Công dân toàn cầu', desc: 'Hoàn thành tất cả hội thoại nhập vai', test: (s, ctx) => ctx.scenarioIds.every((id) => s.scenarios[id]) },
  { id: 'analyzer', icon: '📊', vi: 'Tự đánh giá', desc: 'Làm 1 bài Phân tích giọng nói tự do', test: (s) => s.stats.free >= 1 },
  { id: 'streak-3', icon: '🔥', vi: 'Lửa nhỏ', desc: 'Chuỗi 3 ngày học liên tục', test: (s) => s.streak.best >= 3 },
  { id: 'streak-7', icon: '🔥', vi: 'Một tuần rực lửa', desc: 'Chuỗi 7 ngày', test: (s) => s.streak.best >= 7 },
  { id: 'streak-30', icon: '🏆', vi: 'Không thể cản', desc: 'Chuỗi 30 ngày', test: (s) => s.streak.best >= 30 },
  { id: 'goal', icon: '🎯', vi: 'Đạt mục tiêu', desc: 'Đạt mục tiêu XP trong ngày', test: (s, ctx) => Object.values(s.days).some((x) => x >= ctx.dailyGoal) },
  { id: 'xp-500', icon: '⚡', vi: '500 XP', desc: 'Tích lũy 500 XP', test: (s) => s.xp >= 500 },
  { id: 'xp-2000', icon: '🚀', vi: '2.000 XP', desc: 'Tích lũy 2.000 XP', test: (s) => s.xp >= 2000 },
  { id: 'dictionary', icon: '📖', vi: 'Tra từ', desc: 'Luyện 20 từ trong từ điển', test: (s) => Object.keys(s.words).length >= 20 },
];
function doneLessons(s) { return Object.values(s.lessons).filter((l) => l.done).length; }

/** Achievements newly satisfied by the state (ids not yet unlocked). */
export function newAchievements(state, ctx) {
  return ACHIEVEMENTS.filter((a) => !state.achievements[a.id] && a.test(state, ctx));
}

/** 1–3 stars from a lesson average. */
export const starsFor = (avg) => (avg >= 85 ? 3 : avg >= 70 ? 2 : avg >= 50 ? 1 : 0);
