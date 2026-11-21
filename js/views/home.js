import { html, h, raw, ring } from '../ui.js';
import { levelInfo, liveStreak, dayKey, leagueFor } from '../gamify.js';
import { dailyGoalXp, pathSummary } from '../path.js';
import { lessonById, courseById } from '../content/courses.js';
import { scenarioById } from '../content/scenarios.js';
import { estimateFromHistory } from '../scoring.js';

export const stepDone = (state, s) => (s.kind === 'lesson' ? !!state.lessons[s.id]?.done : !!state.scenarios[s.id]);
export const stepInfo = (s) => {
  const it = s.kind === 'lesson' ? lessonById(s.id) : scenarioById(s.id);
  return { it, href: s.kind === 'lesson' ? `#/lesson/${s.id}` : `#/chat/${s.id}`, icon: s.kind === 'lesson' ? courseById(it.course).icon : it.icon, label: s.kind === 'lesson' ? courseById(it.course).vi : 'Hội thoại nhập vai' };
};

export function render(app) {
  const s = app.state;
  const p = s.profile;
  const goal = dailyGoalXp(p.minutes);
  const today = s.days[dayKey()] || 0;
  const lv = levelInfo(s.xp);
  const sum = pathSummary(p);
  const done = s.path.filter((x) => stepDone(s, x)).length;
  const nextIdx = s.path.findIndex((x) => !stepDone(s, x));
  const next = nextIdx >= 0 ? s.path[nextIdx] : null;
  const est = estimateFromHistory(s.attempts);
  const league = leagueFor(s.xp);
  const hour = new Date().getHours();
  const hello = hour < 11 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

  app.main.innerHTML = html`<section class="home">
    <h1 class="greet">${hello}${p.name ? `, ${p.name}` : ''}! 👋</h1>
    <div class="grid stats3">
      <div class="card center">${raw(ring((Math.min(today, goal) / goal) * 100, 84, ''))}<small>Hôm nay ${today}/${goal} XP</small></div>
      <div class="card center big-stat"><span class="flame">🔥</span><b>${liveStreak(s.streak)}</b><small>ngày liên tiếp</small></div>
      <div class="card center big-stat"><span>${league.icon}</span><b>Lv ${lv.level}</b><small>${s.xp} XP · hạng ${league.vi}</small><div class="mini-bar"><i style="width:${lv.progress * 100}%"></i></div></div>
    </div>
    ${next ? h`<a class="card next-up" href="${stepInfo(next).href}"><small>TIẾP TỤC LỘ TRÌNH · chặng ${nextIdx + 1}/${s.path.length}</small>
      <div class="nu-row"><span class="nu-i">${stepInfo(next).icon}</span><div><b>${stepInfo(next).it.vi}</b><small class="muted">${stepInfo(next).it.title} · ${stepInfo(next).label}</small></div><span class="btn primary sm">Học ▶</span></div></a>`
      : h`<div class="card next-up done"><b>🏆 Bạn đã hoàn thành toàn bộ lộ trình!</b><small>Hãy ôn lại để đạt 3 sao, hoặc <a href="#/settings">làm lại khảo sát</a> để nhận lộ trình mới.</small></div>`}
    <div class="quick">
      <a href="#/practice" class="q"><span>🎯</span>Huấn luyện phát âm</a>
      <a href="#/analyzer" class="q"><span>📊</span>Phân tích giọng nói</a>
      <a href="#/chat" class="q"><span>🤖</span>Hội thoại AI</a>
      <a href="#/dictionary" class="q"><span>📖</span>Từ điển</a>
    </div>
    ${est ? h`<div class="card est"><span>📈</span><div><b>Trình độ nói ước tính: ${est.cefr}</b> <small class="muted">(${est.vi} · IELTS ≈ ${est.ielts})</small><small class="muted">Dựa trên ${est.samples} bài nói gần nhất, điểm TB ${est.score}</small></div></div>` : ''}
    <div class="sec-head"><h2>Lộ trình của bạn</h2><small class="muted">${sum.goal.icon} ${sum.goal.vi} · ${sum.level.cefr} · ${done}/${s.path.length} chặng</small></div>
    <ol class="path">${s.path.map((x, i) => {
      const inf = stepInfo(x);
      const st = stepDone(s, x) ? 'done' : i === nextIdx ? 'current' : 'todo';
      const stars = x.kind === 'lesson' ? s.lessons[x.id]?.stars || 0 : 0;
      return h`<li class="node ${st}"><a href="${inf.href}"><span class="dot">${st === 'done' ? '✓' : inf.icon}</span>
        <div><b>${inf.it.vi}</b><small class="muted">${inf.label}${stars ? ` · ${'★'.repeat(stars)}` : ''}</small></div></a></li>`;
    })}</ol></section>`;
}
