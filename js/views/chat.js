import { html, h, raw, toast, esc } from '../ui.js';
import { SCENARIOS, scenarioById } from '../content/scenarios.js';
import { evaluateReply, fillName } from '../roleplay.js';
import { recordTurn, finishScenario } from '../store.js';
import { listen, srSupported, speak, SR_ERRORS_VI } from '../speech.js';
import { tutorText, voiceOpts, voiceSwitch } from '../components.js';
import { LEVELS } from '../path.js';

export function renderList(app) {
  const s = app.state;
  const goal = s.profile.goal;
  const sorted = [...SCENARIOS].sort((a, b) => (b.goals.includes(goal) - a.goals.includes(goal)) || a.level - b.level);
  app.main.innerHTML = html`<section><h1>🤖 Hội thoại nhập vai với AI</h1>
    <p class="muted">Gia sư AI đóng vai nhân vật trong tình huống thực tế. Bạn trả lời bằng giọng nói hoặc gõ phím và nhận góp ý cho từng câu.</p>
    <div class="scen-grid">${sorted.map((sc) => {
      const p = s.scenarios[sc.id];
      return h`<a class="card scen" href="#/chat/${sc.id}"><span class="scen-i">${sc.icon}</span><b>${sc.vi}</b><small class="muted">${sc.title}</small>
        <small><span class="pill">${LEVELS[sc.level].cefr}</span> ${sc.turns.length} lượt${sc.goals.includes(goal) ? ' · ⭐ hợp mục tiêu' : ''}</small>
        ${p ? h`<small class="good-t">✓ Tốt nhất ${p.best}đ</small>` : ''}</a>`;
    })}</div></section>`;
}

export function render(app, [id]) {
  const sc = scenarioById(id);
  if (!sc) return app.go('/chat');
  let turn = 0, name = app.state.profile.name || null, ctl = null, busy = false;
  const scores = [];
  const root = document.createElement('section');
  root.className = 'chat';
  root.innerHTML = html`<a href="#/chat" class="back-link">← Hội thoại</a>
    <div class="chat-head"><span class="scen-i">${sc.icon}</span><div><b>${sc.vi}</b><small class="muted">${sc.partner} — ${sc.role}</small></div></div>
    <p class="setting muted">🎬 ${sc.setting}</p><div id="vs"></div>
    <div class="msgs" id="msgs" aria-live="polite"></div>
    <div class="composer" id="composer">
      <button class="btn round mic-sm" id="mic" title="Trả lời bằng giọng nói">🎙️</button>
      <input id="reply" placeholder="Nhập câu trả lời bằng tiếng Anh…" autocomplete="off" enterkeyhint="send">
      <button class="btn primary round" id="send" title="Gửi">➤</button>
    </div>
    <div class="composer-extra"><button class="btn ghost sm" id="hint">💡 Gợi ý</button><span class="muted sm" id="interim"></span></div>`;
  app.main.appendChild(root);
  root.querySelector('#vs').appendChild(voiceSwitch(app));
  const msgs = root.querySelector('#msgs');
  const add = (cls, inner) => {
    const d = document.createElement('div');
    d.className = `msg ${cls}`;
    d.innerHTML = inner;
    msgs.appendChild(d);
    d.scrollIntoView({ behavior: 'smooth', block: 'end' });
    return d;
  };
  const aiSay = (en, vi) => {
    const showVi = app.state.settings.tutor !== 'en';
    add('ai', html`<div class="who">${sc.partner}</div><p>${en}</p><p class="vi ${showVi ? '' : 'hidden'}">${vi}</p>
      <div class="msg-tools"><button class="link" data-speak="${en}">🔊 Nghe lại</button><button class="link" data-toggle-vi>🇻🇳 Dịch</button></div>`);
    speak(en, voiceOpts(app));
  };
  const ask = () => { const t = sc.turns[turn]; aiSay(fillName(t.ai, name), fillName(t.vi, name)); };

  const feedbackCard = (r) => html`<div class="fb-head"><b class="score ${r.score >= 80 ? 'good' : r.score >= 60 ? 'ok' : 'bad'}">${r.score}</b>
      <span>${{ excellent: 'Xuất sắc! 🌟', good: 'Tốt lắm! 👍', ok: 'Khá ổn 🙂', retry: 'Thử lại nhé 💪' }[r.rating]}</span></div>
    <ul>${r.feedbackVi.map((v, i) => h`<li>${raw(tutorText(app, v, r.feedbackEn[i]))}</li>`)}</ul>
    ${r.issues.length ? h`<div class="fixes">${r.issues.map((i) => h`<div class="fix"><s>${i.wrong}</s> → <b>${i.right}</b><small>${raw(tutorText(app, i.vi, i.en))}</small></div>`)}${r.corrected ? h`<div class="fix"><small>Câu đã sửa:</small> <b>${r.corrected}</b></div>` : ''}</div>` : ''}
    <div class="better"><small>Câu mẫu tham khảo:</small> <i>${r.better}</i> <button class="link" data-speak="${r.better}">🔊</button></div>
    <div class="fb-actions"><button class="btn sm ghost" data-retry>↻ Trả lời lại</button><button class="btn sm primary" data-continue>Tiếp tục →</button></div>`;

  const submit = (text, meta = {}) => {
    if (busy || !text.trim() || turn >= sc.turns.length) return;
    busy = true;
    add('me', html`<p>${text}</p>${meta.voice ? h`<small class="muted">🎙️ giọng nói</small>` : ''}`);
    const r = evaluateReply(sc.turns[turn], text, meta);
    if (r.name && turn === 0) name = r.name;
    const card = add('fb', feedbackCard(r));
    card.dataset.score = r.score;
    root.querySelector('#reply').value = '';
    app.reward(recordTurn(app.state, r.score));
    card.addEventListener('click', (e) => {
      if (e.target.closest('[data-retry]')) { card.querySelector('.fb-actions').remove(); busy = false; root.querySelector('#reply').focus(); }
      else if (e.target.closest('[data-continue]')) {
        card.querySelector('.fb-actions').remove();
        scores.push(r.score);
        busy = false;
        turn++;
        if (turn < sc.turns.length) ask();
        else end();
      }
    });
  };

  const end = () => {
    aiSay(fillName(sc.closing.ai, name), fillName(sc.closing.vi, name));
    const res = finishScenario(app.state, sc.id, scores);
    app.reward(res.bonus, 'hoàn thành hội thoại');
    add('fb summary', html`<h3>🏁 Hoàn thành hội thoại!</h3><p>Điểm trung bình: <b>${res.avg}</b> / 100 · +${res.bonus} XP thưởng</p>
      <div class="fb-actions"><a class="btn sm" href="#/chat">Tình huống khác</a><button class="btn sm primary" data-again>↻ Luyện lại</button></div>`)
      .addEventListener('click', (e) => { if (e.target.closest('[data-again]')) { app.main.innerHTML = ''; render(app, [id]); } });
    root.querySelector('#composer').classList.add('disabled');
  };

  root.addEventListener('click', async (e) => {
    const sp = e.target.closest('[data-speak]');
    if (sp) return speak(sp.dataset.speak, voiceOpts(app));
    const tv = e.target.closest('[data-toggle-vi]');
    if (tv) return tv.closest('.msg').querySelector('.vi').classList.toggle('hidden');
    if (e.target.closest('#hint') && turn < sc.turns.length) {
      const t = sc.turns[turn];
      return add('hint', html`<p>💡 ${t.hint}</p><small class="muted">Ví dụ: ${t.samples.join(' / ')}</small>`);
    }
    if (e.target.closest('#send')) return submit(root.querySelector('#reply').value);
    if (e.target.closest('#mic')) {
      const btn = root.querySelector('#mic');
      if (ctl) return ctl.stop();
      if (busy) return toast('Bấm "Tiếp tục" hoặc "Trả lời lại" trước nhé.', 'info');
      if (!srSupported()) return toast(SR_ERRORS_VI.unsupported, 'warn', 5000);
      ctl = listen({ lang: app.state.settings.accent, maxSec: 20, onStart: () => btn.classList.add('on'), onInterim: (t) => { root.querySelector('#interim').textContent = t; } });
      try {
        const rec = await ctl.promise;
        if (rec.alternatives[0]) submit(rec.alternatives[0], { voice: true, confidence: rec.confidence });
        else toast('Chưa nghe rõ, hãy nói lại nhé.', 'warn');
      } catch (err) {
        toast(SR_ERRORS_VI[err.message] || `Lỗi: ${esc(err.message)}`, 'warn', 6000);
      } finally { ctl = null; btn.classList.remove('on'); root.querySelector('#interim').textContent = ''; }
    }
  });
  root.querySelector('#reply').addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(e.target.value); });
  add('sys', html`<p>${raw(tutorText(app, `Mục tiêu: trả lời ${sc.turns.length} câu của ${sc.partner}. Hãy nói thành câu đầy đủ. Bấm 💡 nếu cần gợi ý.`, `Goal: answer ${sc.partner}'s ${sc.turns.length} questions in full sentences.`))}</p>`);
  ask();
}
