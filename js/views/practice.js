import { html } from '../ui.js';
import { LESSONS } from '../content/courses.js';
import { recordAttempt } from '../store.js';
import { speakCard, voiceSwitch } from '../components.js';

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function randomItem(type) {
  const l = pick(LESSONS);
  if (type === 'word') return { type, text: pick(l.words) };
  if (type === 'sentence') { const [text, vi] = pick(l.sentences); return { type, text, vi }; }
  return { type: 'paragraph', text: l.paragraph[0], vi: l.paragraph[1] };
}
const typeOf = (text) => { const n = text.trim().split(/\s+/).length; return n === 1 ? 'word' : n <= 20 ? 'sentence' : 'paragraph'; };

export function render(app, _p, query) {
  let type = query.get('type') || 'sentence';
  const preset = query.get('text');
  let item = preset ? { type: typeOf(preset), text: preset } : randomItem(type);
  if (preset) type = item.type;
  const root = document.createElement('section');
  root.className = 'practice';
  app.main.appendChild(root);
  root.innerHTML = html`<h1>🎯 Huấn luyện phát âm</h1><p class="muted">Nghe giọng mẫu, đọc to và xem ngay từ nào đúng, từ nào sai hoặc bị thiếu.</p>
    <div class="seg wide" id="types"><button data-type="word">Từ</button><button data-type="sentence">Câu</button><button data-type="paragraph">Đoạn văn</button></div>
    <form class="custom" id="custom"><input name="t" placeholder="Hoặc nhập câu bạn muốn luyện…" maxlength="400" autocomplete="off"><button class="btn sm">Luyện</button></form>
    <div id="vs"></div><div id="card"></div>
    <div class="row-btns"><button class="btn" id="another">🔀 Bài khác</button><a class="btn ghost" href="#/analyzer">📊 Nói tự do (Speech Analyzer)</a></div>`;
  let card;
  const mount = () => {
    root.querySelectorAll('#types button').forEach((b) => b.classList.toggle('on', b.dataset.type === type));
    card = speakCard(app, item, { onResult: (r) => app.reward(recordAttempt(app.state, r)) });
    root.querySelector('#card').replaceChildren(card);
  };
  root.querySelector('#vs').appendChild(voiceSwitch(app, () => card.refreshVoice()));
  root.querySelector('#types').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    type = b.dataset.type;
    item = randomItem(type);
    mount();
  });
  root.querySelector('#another').addEventListener('click', () => { item = randomItem(type); mount(); });
  root.querySelector('#custom').addEventListener('submit', (e) => {
    e.preventDefault();
    const t = e.target.t.value.trim();
    if (!/[a-z]/i.test(t)) return;
    item = { type: typeOf(t), text: t };
    type = item.type;
    mount();
  });
  mount();
}
