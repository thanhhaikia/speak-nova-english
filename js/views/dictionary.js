import { html, h } from '../ui.js';
import { WORDS } from '../content/dictionary.js';
import { LESSONS } from '../content/courses.js';
import { speak } from '../speech.js';
import { voiceOpts, speakCard } from '../components.js';
import { recordAttempt } from '../store.js';

const lessonOf = new Map();
for (const l of LESSONS) for (const w of l.words) if (!lessonOf.has(w)) lessonOf.set(w, l);
const strip = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLowerCase();

export function render(app, _p, query) {
  let q = query.get('q') || '';
  const root = document.createElement('section');
  root.className = 'dict';
  app.main.appendChild(root);
  root.innerHTML = html`<h1>📖 Từ điển phát âm</h1><p class="muted">${WORDS.length} từ luyện tập với phiên âm IPA Anh – Mỹ, nghĩa tiếng Việt. Tìm bằng tiếng Anh hoặc tiếng Việt.</p>
    <input class="search" id="q" type="search" placeholder="Tìm từ… (vd: thought, khách sạn)" value="${q}" autocomplete="off">
    <div id="practice"></div><div class="dict-list" id="list"></div>`;
  const list = root.querySelector('#list');
  const draw = () => {
    const nq = strip(q.trim());
    const hits = WORDS.filter((w) => !nq || w.w.includes(nq) || strip(w.vi).includes(nq)).slice(0, 120);
    list.innerHTML = hits.length ? html`${hits.map((w) => {
      const best = app.state.words[w.w]?.best;
      const l = lessonOf.get(w.w);
      return h`<div class="card dict-row"><div class="dw"><b>${w.w}</b> <small class="muted">${w.pos}</small><div class="vi">${w.vi}</div>
        ${l ? h`<a class="muted sm" href="#/lesson/${l.id}">Bài: ${l.vi}</a>` : ''}</div>
        <div class="ipa-btns"><button class="btn sm" data-say="${w.w}" data-acc="en-US">🇺🇸 ${w.us}</button><button class="btn sm" data-say="${w.w}" data-acc="en-GB">🇬🇧 ${w.uk}</button>
        <button class="btn sm ${best != null ? (best >= 80 ? 'good' : best >= 60 ? 'ok' : 'bad') : 'primary'}" data-rec="${w.w}">🎙️ ${best != null ? best : 'Luyện'}</button></div></div>`;
    })}` : '<p class="muted">Không tìm thấy từ phù hợp.</p>';
  };
  root.querySelector('#q').addEventListener('input', (e) => { q = e.target.value; draw(); });
  root.addEventListener('click', (e) => {
    const s = e.target.closest('[data-say]');
    if (s) return speak(s.dataset.say, voiceOpts(app, { accent: s.dataset.acc }));
    const r = e.target.closest('[data-rec]');
    if (r) {
      const card = speakCard(app, { type: 'word', text: r.dataset.rec }, { autoplay: true, onResult: (rep) => { app.reward(recordAttempt(app.state, rep)); draw(); } });
      const box = root.querySelector('#practice');
      box.replaceChildren(card);
      box.scrollIntoView({ behavior: 'smooth' });
    }
  });
  draw();
}
