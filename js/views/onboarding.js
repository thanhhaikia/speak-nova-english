import { html, h } from '../ui.js';
import { GOALS, LEVELS, MINUTES, buildPath, pathSummary } from '../path.js';
import { lessonById } from '../content/courses.js';
import { scenarioById } from '../content/scenarios.js';
import { defaultState } from '../store.js';

export function render(app) {
  const ans = { name: app.state.profile?.name || '', goal: app.state.profile?.goal || null, level: app.state.profile?.level ?? null, minutes: app.state.profile?.minutes || null };
  let step = 0;
  const root = document.createElement('div');
  root.className = 'onboard';
  app.main.appendChild(root);

  const steps = [
    () => html`<div class="ob-hero"><div class="logo-big">🗣️</div><h1>Chào mừng đến với <span class="brand">SpeakSiri</span></h1>
      <p class="muted">Huấn luyện viên phát âm tiếng Anh cho người Việt — luyện nói, nhận phản hồi tức thì, ngay trên trình duyệt.</p></div>
      <label class="field"><span>Bạn tên là gì? (tùy chọn)</span><input id="ob-name" maxlength="30" value="${ans.name}" placeholder="VD: Lan"></label>
      <button class="btn primary block" data-next>Bắt đầu khảo sát →</button>`,
    () => html`<h2>Mục tiêu học tiếng Anh của bạn là gì?</h2><div class="choices">${GOALS.map((g) => h`<button class="choice ${ans.goal === g.id ? 'on' : ''}" data-goal="${g.id}"><span class="ci">${g.icon}</span><b>${g.vi}</b><small>${g.en}</small></button>`)}</div>`,
    () => html`<h2>Trình độ hiện tại của bạn?</h2><div class="choices col">${LEVELS.map((l) => h`<button class="choice row ${ans.level === l.id ? 'on' : ''}" data-level="${l.id}"><span class="pill">${l.cefr}</span><div><b>${l.vi}</b><small>${l.desc}</small></div></button>`)}</div>`,
    () => html`<h2>Mỗi ngày bạn có thể học bao lâu?</h2><div class="choices">${MINUTES.map((m) => h`<button class="choice ${ans.minutes === m ? 'on' : ''}" data-min="${m}"><span class="ci">⏱️</span><b>${m} phút</b><small>${m <= 5 ? 'Nhẹ nhàng' : m <= 10 ? 'Đều đặn' : m <= 15 ? 'Nghiêm túc' : 'Tăng tốc'}</small></button>`)}</div>`,
    () => {
      const sum = pathSummary(ans);
      const path = buildPath(ans);
      return html`<h2>🎉 Lộ trình của bạn đã sẵn sàng!</h2>
        <div class="card plan"><p><b>Mục tiêu:</b> ${sum.goal.icon} ${sum.goal.vi}</p><p><b>Trình độ:</b> ${sum.level.vi} (${sum.level.cefr})</p>
        <p><b>Mục tiêu mỗi ngày:</b> ${ans.minutes} phút ≈ ${sum.dailyXp} XP</p><p><b>Khóa học trọng tâm:</b> Phát âm chuẩn cho người Việt, ${sum.courses.join(', ')}</p></div>
        <h3>${path.length} chặng đầu tiên</h3><ol class="plan-list">${path.slice(0, 8).map((s) => {
          const it = s.kind === 'lesson' ? lessonById(s.id) : scenarioById(s.id);
          return h`<li><span>${s.kind === 'lesson' ? '📘' : '💬'}</span> ${it.vi} <small class="muted">${s.kind === 'lesson' ? 'Bài phát âm' : 'Hội thoại nhập vai'}</small></li>`;
        })}</ol><button class="btn primary block" data-finish>Bắt đầu học ngay 🚀</button>`;
    },
  ];

  const draw = () => {
    root.innerHTML = `<div class="ob-progress">${steps.map((_, i) => `<i class="${i <= step ? 'on' : ''}"></i>`).join('')}</div>
      ${step > 0 ? '<button class="btn ghost sm back" data-back>← Quay lại</button>' : ''}<div class="ob-step">${steps[step]()}</div>`;
  };
  root.addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.dataset.back != null) step--;
    else if (t.dataset.next != null) { ans.name = root.querySelector('#ob-name').value.trim(); step++; }
    else if (t.dataset.goal) { ans.goal = t.dataset.goal; step++; }
    else if (t.dataset.level) { ans.level = +t.dataset.level; step++; }
    else if (t.dataset.min) { ans.minutes = +t.dataset.min; step++; }
    else if (t.dataset.finish != null) {
      const s = app.state.profile ? app.state : defaultState();
      s.profile = { ...ans, createdAt: s.profile?.createdAt || Date.now() };
      s.path = buildPath(ans);
      app.state = s;
      app.save();
      app.go('/');
      return;
    } else return;
    draw();
  });
  draw();
}
