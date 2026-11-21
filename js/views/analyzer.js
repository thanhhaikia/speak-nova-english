import { html, h, raw, ring, bar, toast, esc } from '../ui.js';
import { ALL_PROMPTS } from '../content/courses.js';
import { analyzeFree, freeTips } from '../analyzer.js';
import { recordAttempt } from '../store.js';
import { listen, srSupported, speak, SR_ERRORS_VI } from '../speech.js';
import { tutorText, voiceOpts } from '../components.js';
import { isFiller } from '../scoring.js';

const LIMIT = { 1: 45, 2: 120, 3: 75 };

export function render(app, _p, query) {
  const q0 = query.get('q');
  let prompt = ALL_PROMPTS.find((p) => p.q === q0) || ALL_PROMPTS[Math.floor(Math.random() * ALL_PROMPTS.length)];
  let ctl = null, timer = null;
  const root = document.createElement('section');
  root.className = 'analyzer';
  app.main.appendChild(root);

  const history = () => app.state.attempts.filter((a) => a.kind === 'free').slice(0, 5);
  const draw = () => {
    root.innerHTML = html`<h1>📊 Phân tích giọng nói</h1>
      <p class="muted">Trả lời tự do câu hỏi kiểu IELTS Speaking. Hệ thống chấm độ trôi chảy, phát âm (độ rõ), từ vựng, ngữ pháp, mạch lạc và ước tính trình độ.</p>
      <div class="seg wide" id="parts">${[1, 2, 3].map((n) => h`<button data-part="${n}" class="${prompt.part === n ? 'on' : ''}">Part ${n}</button>`)}</div>
      <div class="card prompt-card"><small class="pill">IELTS Part ${prompt.part} · tối đa ${LIMIT[prompt.part]}s</small>
        <h2>${prompt.q}</h2><p class="muted">${prompt.vi}</p>
        <div class="row-btns"><button class="btn sm ghost" data-say>🔊 Nghe câu hỏi</button><button class="btn sm ghost" data-shuffle>🔀 Câu khác</button></div></div>
      <div class="rec-zone"><button class="btn mic big" data-rec><span class="mic-i">🎙️</span><span class="mic-t">Bấm để trả lời</span></button>
        <div class="timer muted" id="timer"></div><div class="interim muted" id="interim" aria-live="polite"></div></div>
      <details class="type-answer" ${srSupported() ? '' : 'open'}><summary>⌨️ Gõ câu trả lời thay vì nói</summary>
        ${srSupported() ? '' : h`<p class="warn">${SR_ERRORS_VI.unsupported}</p>`}
        <form id="typed"><textarea name="t" rows="4" placeholder="Type your answer in English…"></textarea><button class="btn sm">Phân tích</button></form></details>
      <div id="report"></div>
      ${history().length ? h`<div class="card"><h3>Lịch sử gần đây</h3>${history().map((a) => h`<div class="hist-row"><b class="${a.overall >= 80 ? 'good' : a.overall >= 60 ? 'ok' : 'bad'}-t">${a.overall}</b><span>${a.target}</span></div>`)}</div>` : ''}`;
  };

  const show = (transcript, meta) => {
    const r = analyzeFree(transcript, { ...meta, part: prompt.part });
    const out = root.querySelector('#report');
    if (!r) { out.innerHTML = `<div class="card warn">Chưa nghe được câu trả lời. Hãy thử lại và nói to, rõ hơn.</div>`; return; }
    const tips = freeTips(r);
    const marked = transcript.split(/\s+/).map((w) => (isFiller(w.toLowerCase().replace(/[^a-z]/g, '')) ? `<mark class="filler">${esc(w)}</mark>` : esc(w))).join(' ');
    out.innerHTML = html`<div class="card report">
      <div class="report-top">${raw(ring(r.overall, 120, 'điểm'))}<div class="report-bars">
        ${raw(bar('Độ trôi chảy (Fluency)', r.fluency, r.wpm ? `${r.wpm} từ/phút · ${r.words} từ · ${r.fillers} âm ngập ngừng` : `${r.words} từ`))}
        ${raw(bar('Phát âm – độ rõ (Pronunciation)', r.pronunciation, 'Dựa trên độ tin cậy của bộ nhận diện giọng nói'))}
        ${raw(bar('Từ vựng (Lexical resource)', r.vocabulary))}${raw(bar('Ngữ pháp (Grammar)', r.grammar))}${raw(bar('Mạch lạc (Coherence)', r.coherence, r.connectors.length ? `Từ nối: ${r.connectors.join(', ')}` : 'Chưa dùng từ nối'))}
      </div></div>
      <div class="level-chip"><span>Trình độ ước tính</span><b>${r.level.cefr}</b><small>${r.level.vi} · IELTS Speaking ≈ ${r.level.ielts}</small></div>
      <div class="cmp"><small class="muted">Bạn đã nói</small><p class="heard">${raw(marked)}</p></div>
      ${r.issues.length ? h`<div class="fixes"><h4>✏️ Sửa lỗi ngữ pháp</h4>${r.issues.map((i) => h`<div class="fix"><s>${i.wrong}</s> → <b>${i.right}</b><small>${raw(tutorText(app, i.vi, i.en))}</small></div>`)}</div>` : ''}
      <div class="tips"><h4>💡 ${raw(tutorText(app, 'Gia sư góp ý', 'Tutor tips'))}</h4>${tips.map((t) => h`<div class="tip"><span class="tip-i">${t.icon}</span><div>${raw(tutorText(app, t.vi, t.en))}</div></div>`)}</div>
      <p class="muted sm">⚠️ Điểm chỉ mang tính tham khảo, ước tính từ văn bản nhận diện và thời gian nói — không phải điểm IELTS chính thức.</p></div>`;
    const xp = recordAttempt(app.state, { type: 'free', target: prompt.q, transcript, overall: r.overall, pronunciation: r.pronunciation, fluency: r.fluency, completeness: r.lengthScore }, { kind: 'free' });
    app.reward(xp, 'Phân tích giọng nói');
    out.scrollIntoView({ behavior: 'smooth' });
  };

  const stopRec = () => { ctl?.stop(); };
  root.addEventListener('click', async (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.part) { const n = +b.dataset.part; const pool = ALL_PROMPTS.filter((p) => p.part === n); prompt = pool[Math.floor(Math.random() * pool.length)]; draw(); }
    else if (b.dataset.shuffle != null) { const pool = ALL_PROMPTS.filter((p) => p.part === prompt.part && p !== prompt); prompt = pool[Math.floor(Math.random() * pool.length)] || prompt; draw(); }
    else if (b.dataset.say != null) speak(prompt.q, voiceOpts(app));
    else if (b.dataset.rec != null) {
      if (ctl) return stopRec();
      if (!srSupported()) return toast(SR_ERRORS_VI.unsupported, 'warn', 5000);
      const lim = LIMIT[prompt.part];
      const t0 = Date.now();
      ctl = listen({ lang: app.state.settings.accent, continuous: true, maxSec: lim,
        onStart: () => { b.classList.add('on'); b.querySelector('.mic-t').textContent = 'Đang nghe… bấm để kết thúc'; },
        onInterim: (t) => { root.querySelector('#interim').textContent = t; } });
      timer = setInterval(() => { const s = Math.round((Date.now() - t0) / 1000); root.querySelector('#timer').textContent = `⏱️ ${s}s / ${lim}s`; }, 500);
      try {
        const rec = await ctl.promise;
        show(rec.alternatives[0] || '', { durationSec: rec.durationSec, confidence: rec.confidence });
      } catch (err) {
        toast(SR_ERRORS_VI[err.message] || `Lỗi: ${esc(err.message)}`, 'warn', 6000);
      } finally {
        clearInterval(timer); ctl = null;
        b.classList.remove('on'); b.querySelector('.mic-t').textContent = 'Bấm để trả lời';
      }
    }
  });
  root.addEventListener('submit', (e) => {
    if (e.target.id !== 'typed') return;
    e.preventDefault();
    const t = e.target.t.value.trim();
    if (t) show(t, { durationSec: 0, confidence: 0 });
  });
  draw();
}
