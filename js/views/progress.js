import { html, h, raw, ring, bar } from '../ui.js';
import { levelInfo, liveStreak, dayKey, ACHIEVEMENTS, leagueFor, LEAGUES } from '../gamify.js';
import { dailyGoalXp } from '../path.js';
import { estimateFromHistory } from '../scoring.js';
import { LESSONS } from '../content/courses.js';

export function render(app) {
  const s = app.state;
  const lv = levelInfo(s.xp);
  const goal = dailyGoalXp(s.profile.minutes);
  const est = estimateFromHistory(s.attempts);
  const league = leagueFor(s.xp);
  const nextLeague = LEAGUES.find((l) => l.min > s.xp);
  const days = [...Array(14)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - 13 + i); const k = dayKey(d); return { k, xp: s.days[k] || 0, label: d.toLocaleDateString('vi-VN', { weekday: 'narrow' }) }; });
  const maxXp = Math.max(goal, ...days.map((d) => d.xp));
  const avg = (key, filter = () => true) => { const xs = s.attempts.filter(filter).map((a) => a[key]).filter((v) => v != null).slice(0, 30); return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null; };
  const doneLessons = LESSONS.filter((l) => s.lessons[l.id]?.done).length;
  const weakWords = Object.entries(s.words).filter(([, v]) => v.best < 70).sort((a, b) => a[1].best - b[1].best).slice(0, 12);

  app.main.innerHTML = html`<section class="progress"><h1>📈 Tiến độ</h1>
    <div class="grid stats4">
      <div class="card center big-stat"><span>⭐</span><b>Lv ${lv.level}</b><small>${lv.xpInLevel}/${lv.xpToNext} XP</small><div class="mini-bar"><i style="width:${lv.progress * 100}%"></i></div></div>
      <div class="card center big-stat"><span>🔥</span><b>${liveStreak(s.streak)}</b><small>Chuỗi · kỷ lục ${s.streak.best}</small></div>
      <div class="card center big-stat"><span>${league.icon}</span><b>${s.xp}</b><small>XP · hạng ${league.vi}${nextLeague ? ` · còn ${nextLeague.min - s.xp} lên ${nextLeague.vi}` : ''}</small></div>
      <div class="card center big-stat"><span>🎤</span><b>${s.stats.attempts}</b><small>bài nói · ${doneLessons}/${LESSONS.length} bài học</small></div>
    </div>
    <div class="card"><h3>XP 14 ngày qua <small class="muted">(mục tiêu ${goal} XP/ngày)</small></h3>
      <div class="chart">${days.map((d) => h`<div class="col ${d.xp >= goal ? 'hit' : ''}" title="${d.k}: ${d.xp} XP"><i style="height:${(d.xp / maxXp) * 100}%"></i><small>${d.label}</small></div>`)}
      <div class="goal-line" style="bottom:calc(${(goal / maxXp) * 100}% * 0.8 + 18px)"></div></div></div>
    <div class="card"><h3>📊 Phân tích giọng nói tổng hợp</h3>
      ${est ? h`<div class="report-top">${raw(ring(est.score, 100, 'TB'))}<div class="report-bars">
        ${raw(bar('Phát âm', avg('pronunciation')))}${raw(bar('Độ trôi chảy', avg('fluency')))}${raw(bar('Độ đầy đủ', avg('completeness', (a) => a.type !== 'word')))}</div></div>
        <div class="level-chip"><span>Trình độ ước tính</span><b>${est.cefr}</b><small>${est.vi} · IELTS Speaking ≈ ${est.ielts} · ${est.samples} bài gần nhất</small></div>`
        : h`<p class="muted">Hoàn thành ít nhất 3 bài nói để xem phân tích.</p>`}</div>
    ${weakWords.length ? h`<div class="card"><h3>🎯 Từ cần luyện thêm</h3><div class="chips">${weakWords.map(([w, v]) => h`<a class="chip bad" href="#/practice?text=${encodeURIComponent(w)}">${w} · ${v.best}</a>`)}</div></div>` : ''}
    <div class="card"><h3>🏅 Thành tích (${Object.keys(s.achievements).length}/${ACHIEVEMENTS.length})</h3>
      <div class="ach-grid">${ACHIEVEMENTS.map((a) => h`<div class="ach ${s.achievements[a.id] ? 'on' : ''}" title="${a.desc}"><span>${a.icon}</span><b>${a.vi}</b><small>${s.achievements[a.id] ? `✓ ${s.achievements[a.id]}` : a.desc}</small></div>`)}</div></div>
    <div class="card"><h3>🕘 Bài nói gần đây</h3>${s.attempts.length ? h`${s.attempts.slice(0, 15).map((a) => h`<div class="hist-row"><b class="${a.overall >= 80 ? 'good' : a.overall >= 60 ? 'ok' : 'bad'}-t">${a.overall}</b><span>${a.target}</span><small class="muted">${a.day}</small></div>`)}` : h`<p class="muted">Chưa có bài nói nào.</p>`}</div>
    <a href="#/settings" class="btn ghost block">⚙️ Cài đặt, giọng đọc & dữ liệu</a></section>`;
}
