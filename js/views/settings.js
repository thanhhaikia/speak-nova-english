import { html, h, toast } from '../ui.js';
import { englishVoices, speak, ttsSupported, srSupported } from '../speech.js';
import { exportJson, importJson, defaultState, KEY } from '../store.js';
import { GOALS, LEVELS, MINUTES, buildPath } from '../path.js';

export function render(app) {
  const root = document.createElement('section');
  root.className = 'settings';
  app.main.appendChild(root);
  const draw = () => {
    const s = app.state.settings;
    const p = app.state.profile;
    const vs = englishVoices();
    const group = (acc, g) => vs.filter((v) => v.accent === acc && (v.gender === g || v.gender == null));
    root.innerHTML = html`<h1>⚙️ Cài đặt</h1>
      <div class="card"><h3>🧑‍🏫 Chế độ gia sư song ngữ</h3><p class="muted sm">Ngôn ngữ của lời giải thích, góp ý và gợi ý.</p>
        <div class="seg wide" data-set="tutor">${[['vi', '🇻🇳 Tiếng Việt'], ['both', '🇻🇳+🇬🇧 Song ngữ'], ['en', '🇬🇧 English']].map(([v, l]) => h`<button data-v="${v}" class="${s.tutor === v ? 'on' : ''}">${l}</button>`)}</div></div>
      <div class="card"><h3>🔊 Giọng đọc mẫu</h3>
        <div class="seg wide" data-set="accent"><button data-v="en-US" class="${s.accent === 'en-US' ? 'on' : ''}">🇺🇸 Anh – Mỹ</button><button data-v="en-GB" class="${s.accent === 'en-GB' ? 'on' : ''}">🇬🇧 Anh – Anh</button></div>
        <div class="seg wide" data-set="gender"><button data-v="female" class="${s.gender === 'female' ? 'on' : ''}">👩 Giọng nữ</button><button data-v="male" class="${s.gender === 'male' ? 'on' : ''}">👨 Giọng nam</button></div>
        <label class="field"><span>Tốc độ đọc: <b>${s.rate.toFixed(2)}×</b></span><input type="range" id="rate" min="0.5" max="1.3" step="0.05" value="${s.rate}"></label>
        <label class="field"><span>Chọn giọng cụ thể (${group(s.accent, s.gender).length} giọng phù hợp trên trình duyệt này)</span>
          <select id="voice"><option value="">Tự động chọn giọng tốt nhất</option>${group(s.accent, s.gender).map((v) => h`<option value="${v.name}" ${s.voices?.[`${s.accent}-${s.gender}`] === v.name ? 'selected' : ''}>${v.name} (${v.lang}${v.gender ? '' : ', chưa rõ giới tính'})</option>`)}</select></label>
        <button class="btn" id="test">▶ Nghe thử</button>
        <p class="muted sm">Danh sách giọng do trình duyệt/hệ điều hành cung cấp. Nếu không có giọng nam/nữ hoặc Anh–Anh, ứng dụng dùng giọng gần nhất. Chrome có sẵn "Google US English" và "Google UK English Female/Male".</p></div>
      <div class="card"><h3>🧭 Lộ trình học</h3>
        <label class="field"><span>Mục tiêu</span><select id="goal">${GOALS.map((g) => h`<option value="${g.id}" ${p.goal === g.id ? 'selected' : ''}>${g.icon} ${g.vi}</option>`)}</select></label>
        <label class="field"><span>Trình độ</span><select id="level">${LEVELS.map((l) => h`<option value="${l.id}" ${p.level === l.id ? 'selected' : ''}>${l.cefr} – ${l.vi}</option>`)}</select></label>
        <label class="field"><span>Thời gian mỗi ngày</span><select id="minutes">${MINUTES.map((m) => h`<option value="${m}" ${p.minutes === m ? 'selected' : ''}>${m} phút</option>`)}</select></label>
        <label class="field"><span>Tên</span><input id="name" value="${p.name || ''}" maxlength="30"></label>
        <button class="btn primary" id="repath">Cập nhật lộ trình</button> <a class="btn ghost" href="#/onboarding">Làm lại khảo sát</a></div>
      <div class="card"><h3>💾 Dữ liệu</h3><p class="muted sm">Tiến độ được lưu trong trình duyệt (localStorage, khóa <code>${KEY}</code>). Sao lưu để chuyển sang máy khác.</p>
        <div class="row-btns"><button class="btn" id="export">⬇️ Xuất JSON</button><label class="btn">⬆️ Nhập JSON<input type="file" id="import" accept="application/json" hidden></label><button class="btn danger" id="reset">🗑️ Xóa toàn bộ</button></div></div>
      <div class="card"><h3>🩺 Kiểm tra trình duyệt</h3><ul class="checks">
        <li>${ttsSupported() ? '✅' : '❌'} Đọc mẫu (speechSynthesis) · ${vs.length} giọng tiếng Anh</li>
        <li>${srSupported() ? '✅' : '❌'} Nhận diện giọng nói (SpeechRecognition)</li>
        <li>${window.isSecureContext ? '✅' : '❌'} Kết nối an toàn (HTTPS/localhost — bắt buộc cho micro)</li></ul></div>`;
  };
  root.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const seg = b.closest('[data-set]');
    const s = app.state.settings;
    if (seg && b.dataset.v) { s[seg.dataset.set] = b.dataset.v; app.save(); draw(); return; }
    if (b.id === 'test') speak('Hello! This is your model voice. Practice makes perfect.', { accent: s.accent, gender: s.gender, rate: s.rate, voiceName: s.voices?.[`${s.accent}-${s.gender}`] });
    if (b.id === 'repath') {
      const p = app.state.profile;
      Object.assign(p, { goal: root.querySelector('#goal').value, level: +root.querySelector('#level').value, minutes: +root.querySelector('#minutes').value, name: root.querySelector('#name').value.trim() });
      app.state.path = buildPath(p);
      app.save();
      toast('✅ Đã cập nhật lộ trình', 'info');
    }
    if (b.id === 'export') {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([exportJson(app.state)], { type: 'application/json' }));
      a.download = `speaksiri-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
    }
    if (b.id === 'reset' && confirm('Xóa toàn bộ tiến độ? Không thể hoàn tác.')) { app.state = defaultState(); app.save(); app.go('/onboarding'); }
  });
  root.addEventListener('input', (e) => {
    if (e.target.id === 'rate') { app.state.settings.rate = +e.target.value; app.save(); e.target.previousElementSibling.querySelector('b').textContent = `${(+e.target.value).toFixed(2)}×`; }
  });
  root.addEventListener('change', async (e) => {
    const s = app.state.settings;
    if (e.target.id === 'voice') { s.voices = { ...s.voices, [`${s.accent}-${s.gender}`]: e.target.value || null }; app.save(); }
    if (e.target.id === 'import' && e.target.files[0]) {
      const prev = app.state;
      try { app.state = importJson(await e.target.files[0].text()); app.save(); toast('✅ Đã nhập dữ liệu', 'info'); draw(); } catch { app.state = prev; app.save(); toast('❌ File không hợp lệ', 'warn'); }
    }
  });
  document.addEventListener('voices', () => root.isConnected && draw());
  draw();
}
