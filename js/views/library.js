import { html, h } from '../ui.js';
import { COURSES, courseById, lessonItems } from '../content/courses.js';
import { SCENARIOS } from '../content/scenarios.js';
import { LEVELS } from '../path.js';
import { stars } from '../ui.js';

const lvl = (n) => LEVELS[n]?.cefr || 'A1';

export function render(app) {
  const s = app.state;
  app.main.innerHTML = html`<section><h1>Khóa học & Chủ đề</h1><p class="muted">Mỗi bài gồm từ vựng → câu → đoạn văn ngắn. Hoàn thành ≥ 50 điểm để qua bài, ≥ 85 điểm đạt 3 sao.</p>
    <div class="courses">${COURSES.map((c) => {
      const done = c.lessons.filter((l) => s.lessons[l.id]?.done).length;
      return h`<a class="card course" href="#/course/${c.id}"><span class="course-i">${c.icon}</span><div><b>${c.vi}</b><small class="muted">${c.title} · ${c.lessons.length} bài</small>
        <p class="sm">${c.desc}</p><div class="mini-bar"><i style="width:${(done / c.lessons.length) * 100}%"></i></div><small class="muted">${done}/${c.lessons.length} bài đã hoàn thành</small></div></a>`;
    })}
    <a class="card course" href="#/chat"><span class="course-i">🤖</span><div><b>Hội thoại nhập vai</b><small class="muted">AI role-play · ${SCENARIOS.length} tình huống</small><p class="sm">Giới thiệu bản thân, gọi món, phỏng vấn, sân bay, khách sạn, mua sắm…</p></div></a>
    <a class="card course" href="#/analyzer"><span class="course-i">📊</span><div><b>Phân tích giọng nói (IELTS)</b><small class="muted">Speech Analyzer</small><p class="sm">Trả lời câu hỏi IELTS Speaking Part 1–3, nhận điểm trôi chảy, từ vựng, ngữ pháp và trình độ ước tính.</p></div></a>
    </div></section>`;
}

export function renderCourse(app, [id]) {
  const c = courseById(id);
  if (!c) return app.go('/learn');
  const s = app.state;
  app.main.innerHTML = html`<section><a href="#/learn" class="back-link">← Khóa học</a>
    <h1>${c.icon} ${c.vi}</h1><p class="muted">${c.title} — ${c.desc}</p>
    <div class="lessons">${c.lessons.map((l, i) => {
      const p = s.lessons[l.id];
      return h`<a class="card lesson-row ${p?.done ? 'done' : ''}" href="#/lesson/${l.id}"><span class="num">${p?.done ? '✓' : i + 1}</span>
        <div><b>${l.vi}</b><small class="muted">${l.title} · ${lvl(l.level)} · ${lessonItems(l).length} bài tập</small>
        <small class="chips">${l.words.slice(0, 5).map((w) => h`<span class="chip">${w}</span>`)}</small></div>
        <div class="lr-end">${p ? h`<span class="stars">${stars(p.stars)}</span><small>${p.best}đ</small>` : h`<span class="btn sm">Học</span>`}</div></a>`;
    })}</div></section>`;
}
