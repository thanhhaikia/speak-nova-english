import { html, h, raw, ring, bar, stars } from '../ui.js';
import { lessonById, courseById, lessonItems } from '../content/courses.js';
import { recordAttempt, finishLesson } from '../store.js';
import { estimateLevel } from '../scoring.js';
import { speakCard, voiceSwitch, tutorText } from '../components.js';
import { stepDone, stepInfo } from './home.js';

export function render(app, [id]) {
  const lesson = lessonById(id);
  if (!lesson) return app.go('/learn');
  const course = courseById(lesson.course);
  const items = lessonItems(lesson);
  const best = new Array(items.length).fill(null); // best report per item
  let idx = -1; // -1 = intro screen

  const root = document.createElement('section');
  root.className = 'lesson';
  app.main.appendChild(root);

  const header = () => html`<div class="lesson-head"><a href="#/course/${course.id}" class="back-link">← ${course.vi}</a>
    <h1>${lesson.vi}</h1><small class="muted">${lesson.title}</small>
    ${idx >= 0 && idx < items.length ? h`<div class="steps-bar">${items.map((_, i) => h`<i class="${i < idx ? 'done' : i === idx ? 'on' : ''} ${best[i] ? (best[i].overall >= 80 ? 'good' : best[i].overall >= 60 ? 'ok' : 'bad') : ''}"></i>`)}</div>` : ''}</div>`;

  const intro = () => {
    root.innerHTML = header() + html`<div class="card tutor"><div class="tutor-av">🧑‍🏫</div><div>
      <b>${raw(tutorText(app, 'Gia sư SpeakSiri', 'SpeakSiri tutor'))}</b>
      ${lesson.intro ? h`<p>${raw(tutorText(app, lesson.intro.vi, lesson.intro.en))}</p>` : h`<p>${raw(tutorText(app, `Bài này luyện ${items.length} bài tập: ${lesson.words.length} từ vựng, ${lesson.sentences.length} câu và 1 đoạn văn về chủ đề "${lesson.vi}". Nghe mẫu 🔊, sau đó bấm 🎙️ và đọc to.`, `This lesson has ${items.length} exercises about "${lesson.title}". Listen first, then press the mic and read aloud.`))}</p>`}
      ${lesson.prompt ? h`<p class="prompt"><b>IELTS Part ${lesson.prompt.part}:</b> ${lesson.prompt.q}<br><small class="muted">${lesson.prompt.vi}</small> — <a href="#/analyzer?q=${encodeURIComponent(lesson.prompt.q)}">trả lời tự do trong Phân tích giọng nói</a></p>` : ''}
      </div></div>
      <div class="card"><h3>Từ vựng trong bài</h3><div class="chips">${lesson.words.map((w) => h`<span class="chip">${w}</span>`)}</div></div>
      <button class="btn primary block" data-start>Bắt đầu ▶</button>`;
  };

  const exercise = () => {
    const at = idx;
    const item = items[at];
    root.innerHTML = header();
    const vs = voiceSwitch(app, () => card.refreshVoice());
    root.appendChild(vs);
    const card = speakCard(app, item, {
      autoplay: true,
      onResult: (r) => {
        const xp = recordAttempt(app.state, r, { lesson: lesson.id });
        if (!best[at] || r.overall > best[at].overall) best[at] = r;
        app.reward(xp);
        nav.querySelector('[data-next]').textContent = at === items.length - 1 ? 'Xem kết quả 🏁' : 'Tiếp theo →';
        nav.querySelector('[data-next]').classList.add('primary');
      },
    });
    root.appendChild(card);
    const nav = document.createElement('div');
    nav.className = 'lesson-nav';
    nav.innerHTML = `<button class="btn ghost" data-prev ${idx === 0 ? 'disabled' : ''}>← Trước</button><span class="muted">${idx + 1}/${items.length}</span><button class="btn" data-next>${best[idx] ? 'Tiếp theo →' : 'Bỏ qua →'}</button>`;
    root.appendChild(nav);
  };

  const summary = () => {
    const scores = best.map((r) => r?.overall ?? 0);
    const res = finishLesson(app.state, lesson.id, scores);
    app.reward(res.bonus, 'thưởng hoàn thành bài');
    const avgOf = (k, type) => {
      const xs = best.filter((r) => r && (!type || r.type === type) && r[k] != null).map((r) => r[k]);
      return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
    };
    const lvl = estimateLevel(res.avg);
    const weakest = best.map((r, i) => ({ r, i })).filter((x) => x.r).sort((a, b) => a.r.overall - b.r.overall).slice(0, 3);
    const nextStep = app.state.path.find((x) => !stepDone(app.state, x));
    root.innerHTML = header() + html`<div class="card center summary"><h2>${res.passed ? '🎉 Hoàn thành bài học!' : '💪 Cố gắng thêm chút nữa!'}</h2>
      ${raw(ring(res.avg, 130, 'điểm TB'))}<div class="stars big">${stars(res.stars)}</div>
      <p class="muted">${res.passed ? `+${res.bonus} XP thưởng` : 'Cần ≥ 50 điểm trung bình để qua bài.'}</p></div>
      <div class="card"><h3>📊 Báo cáo phân tích giọng nói</h3>
        ${raw(bar('Phát âm (Pronunciation)', avgOf('pronunciation')))}${raw(bar('Độ trôi chảy (Fluency)', avgOf('fluency')))}${raw(bar('Độ đầy đủ (Completeness)', avgOf('completeness')))}
        ${raw(bar('Từ vựng', avgOf('overall', 'word')))}${raw(bar('Câu', avgOf('overall', 'sentence')))}${raw(bar('Đoạn văn', avgOf('overall', 'paragraph')))}
        <div class="level-chip"><span>Trình độ ước tính</span><b>${lvl.cefr}</b><small>${lvl.vi} · IELTS Speaking ≈ ${lvl.ielts}</small></div></div>
      ${weakest.length ? h`<div class="card"><h3>🎯 Nên luyện lại</h3>${weakest.map((x) => h`<button class="redo" data-goto="${x.i}"><span class="${x.r.overall >= 80 ? 'good' : x.r.overall >= 60 ? 'ok' : 'bad'}-t">${x.r.overall}</span> ${items[x.i].text}</button>`)}</div>` : ''}
      <div class="row-btns"><button class="btn" data-restart>↻ Học lại</button>
      ${nextStep ? h`<a class="btn primary" href="${stepInfo(nextStep).href}">Chặng tiếp: ${stepInfo(nextStep).it.vi} →</a>` : h`<a class="btn primary" href="#/">Về trang chủ</a>`}</div>`;
  };

  const draw = () => (idx < 0 ? intro() : idx >= items.length ? summary() : exercise());
  root.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.start != null) idx = 0;
    else if (b.dataset.next != null) idx++;
    else if (b.dataset.prev != null) idx = Math.max(0, idx - 1);
    else if (b.dataset.restart != null) { best.fill(null); idx = 0; }
    else if (b.dataset.goto != null) idx = +b.dataset.goto;
    else return;
    draw();
    window.scrollTo(0, 0);
  });
  draw();
}
