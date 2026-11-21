// Reusable speaking widgets: model-voice controls, recorder, Speech Analyzer report, word popover.
import { html, raw, h, esc, ring, bar, modal, toast, scoreClass } from './ui.js';
import { speak, listen, srSupported, ttsSupported, SR_ERRORS_VI } from './speech.js';
import { scoreAttempt } from './scoring.js';
import { buildTips } from './tips.js';
import { lookup } from './content/dictionary.js';

/** Render text according to tutor mode: 'vi' (Vietnamese), 'en' (English) or 'both'. */
export function tutorText(app, vi, en) {
  const m = app.state.settings.tutor;
  if (m === 'en') return esc(en || vi);
  if (m === 'both' && en) return `${esc(vi)}<span class="en-sub">${esc(en)}</span>`;
  return esc(vi);
}

export function voiceOpts(app, extra = {}) {
  const s = app.state.settings;
  return { accent: s.accent, gender: s.gender, rate: s.rate, voiceName: s.voices?.[`${s.accent}-${s.gender}`] || null, ...extra };
}

export const accentLabel = (s) => `${s.accent === 'en-GB' ? '🇬🇧 UK' : '🇺🇸 US'} · ${s.gender === 'male' ? 'Nam' : 'Nữ'}`;

/** Accent / gender quick switcher used above every exercise. */
export function voiceSwitch(app, onChange) {
  const s = app.state.settings;
  const el = document.createElement('div');
  el.className = 'voice-switch';
  const draw = () => {
    el.innerHTML = html`<div class="seg" role="group" aria-label="Giọng">
      <button data-accent="en-US" class="${s.accent === 'en-US' ? 'on' : ''}">🇺🇸 Mỹ</button>
      <button data-accent="en-GB" class="${s.accent === 'en-GB' ? 'on' : ''}">🇬🇧 Anh</button></div>
      <div class="seg" role="group" aria-label="Giới tính"><button data-gender="female" class="${s.gender === 'female' ? 'on' : ''}">👩 Nữ</button>
      <button data-gender="male" class="${s.gender === 'male' ? 'on' : ''}">👨 Nam</button></div>`;
  };
  el.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.accent) s.accent = b.dataset.accent;
    if (b.dataset.gender) s.gender = b.dataset.gender;
    app.save();
    draw();
    onChange?.();
  });
  draw();
  return el;
}

/** Highlighted target text from a report (or plain clickable words before an attempt). */
export function wordsHtml(words) {
  return words.map((w) => {
    const title = w.status === 'correct' ? 'Đúng' : w.status === 'missing' ? 'Bị thiếu' : `Máy nghe thành: "${w.heard}"`;
    return `<button class="w w-${w.status}" data-word="${esc(w.norm)}" title="${esc(title)}">${esc(w.text)}</button>`;
  }).join(' ');
}
export const plainWords = (text) => text.split(/\s+/).filter(Boolean)
  .map((t) => `<button class="w" data-word="${esc(t.toLowerCase().replace(/[^a-z'-]/g, ''))}">${esc(t)}</button>`).join(' ');

/** Popover with IPA + US/UK playback for a dictionary word. */
export function wordPopover(app, word) {
  const clean = String(word).toLowerCase().replace(/[^a-z' -]/g, '').trim();
  if (!clean) return;
  const d = lookup(clean) || lookup(clean.replace(/'s$|s$/, ''));
  const m = modal(html`<div class="word-pop"><h2>${d ? d.w : clean}</h2>
    ${d ? h`<p class="muted">${d.pos} · ${d.vi}</p>
    <div class="ipa-row"><button class="btn sm" data-acc="en-US">🇺🇸 ${d.us}</button><button class="btn sm" data-acc="en-GB">🇬🇧 ${d.uk}</button></div>`
    : h`<p class="muted">Từ này chưa có trong từ điển luyện tập.</p><div class="ipa-row"><button class="btn sm" data-acc="en-US">🇺🇸 Nghe</button><button class="btn sm" data-acc="en-GB">🇬🇧 Nghe</button></div>`}
    <div class="ipa-row"><button class="btn ghost sm" data-slow>🐢 Nghe chậm</button><a class="btn ghost sm" href="#/practice?text=${encodeURIComponent(clean)}" data-close>🎤 Luyện từ này</a></div></div>`);
  m.el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-acc],[data-slow]');
    if (!b) return;
    speak(d?.w || clean, voiceOpts(app, b.dataset.acc ? { accent: b.dataset.acc } : { rate: 0.55 }));
  });
}

export function bindWordClicks(app, root) {
  root.addEventListener('click', (e) => {
    const w = e.target.closest('.w[data-word]');
    if (w) wordPopover(app, w.dataset.word);
  });
}

/** Speech Analyzer–style report for a scored read-aloud attempt. */
export function reportHtml(app, r) {
  const tips = buildTips(r);
  const lvl = r.level;
  const typeVi = { word: 'Từ', sentence: 'Câu', paragraph: 'Đoạn văn' }[r.type] || '';
  return html`<div class="report">
    <div class="report-top">${raw(ring(r.overall, 112, 'điểm'))}
      <div class="report-bars">
        ${raw(bar('Phát âm (Pronunciation)', r.pronunciation, 'Độ chính xác từng từ so với câu mẫu'))}
        ${raw(bar('Độ trôi chảy (Fluency)', r.fluency, r.wpm ? `${r.wpm} từ/phút · lý tưởng 100–170` : ''))}
        ${raw(r.type !== 'word' ? bar('Độ đầy đủ (Completeness)', r.completeness, 'Tỷ lệ từ được nói') : '')}
      </div></div>
    <div class="level-chip"><span>Trình độ ước tính (${typeVi})</span><b>${lvl.cefr}</b><small>${lvl.vi} · IELTS Speaking ≈ ${lvl.ielts}</small></div>
    <div class="cmp">
      <div><small class="muted">Câu mẫu — chạm vào từ để nghe & xem IPA</small><p class="target">${raw(wordsHtml(r.words))}</p></div>
      <div><small class="muted">Máy nghe được</small><p class="heard">${r.transcript ? `“${r.transcript}”` : '— (không nghe thấy gì)'}</p></div>
      <div class="legend"><span class="w w-correct">đúng</span><span class="w w-close">gần đúng</span><span class="w w-wrong">sai</span><span class="w w-missing">thiếu</span></div>
    </div>
    <div class="tips"><h4>💡 ${raw(tutorText(app, 'Gia sư góp ý', 'Tutor tips'))}</h4>
      ${tips.map((t) => h`<div class="tip"><span class="tip-i">${t.icon}</span><div>${raw(tutorText(app, t.vi, t.en))}
        ${t.words.length ? h`<div class="tip-words">${t.words.map((w) => h`<button class="w w-wrong" data-word="${w}">${w}</button> `)}</div>` : ''}</div></div>`)}
    </div></div>`;
}

/**
 * Exercise card: target text, model voice buttons, record button and report.
 * opts: { item: {type, text, vi}, onResult(report), autoplay }
 */
export function speakCard(app, item, opts = {}) {
  const el = document.createElement('div');
  el.className = `speak-card type-${item.type}`;
  let ctl = null;
  const typeVi = { word: 'Từ vựng', sentence: 'Câu', paragraph: 'Đoạn văn ngắn' }[item.type];
  const dictEntry = item.type === 'word' ? lookup(item.text) : null;
  el.innerHTML = html`
    <div class="sc-head"><span class="pill">${typeVi}</span><span class="muted sm voice-label">${accentLabel(app.state.settings)}</span></div>
    <div class="sc-text ${item.type}">${raw(plainWords(item.text))}</div>
    ${dictEntry ? h`<div class="sc-ipa">${app.state.settings.accent === 'en-GB' ? dictEntry.uk : dictEntry.us} <span class="muted">· ${dictEntry.pos} · ${dictEntry.vi}</span></div>` : ''}
    ${item.vi ? h`<div class="sc-vi">${item.vi}</div>` : ''}
    <div class="sc-actions">
      <button class="btn round" data-play title="Nghe giọng mẫu">🔊</button>
      <button class="btn round" data-slow title="Nghe chậm">🐢</button>
      <button class="btn mic" data-rec><span class="mic-i">🎙️</span><span class="mic-t">Bấm để nói</span></button>
    </div>
    <div class="interim muted" aria-live="polite"></div>
    ${srSupported() ? '' : h`<form class="type-fallback"><p class="warn">${SR_ERRORS_VI.unsupported}</p><input name="t" placeholder="Gõ câu bạn đọc (chế độ thử)" autocomplete="off"><button class="btn sm">Chấm</button></form>`}
    <div class="sc-report"></div>`;
  const recBtn = el.querySelector('[data-rec]');
  const interim = el.querySelector('.interim');
  const setRec = (on) => {
    recBtn.classList.toggle('on', on);
    recBtn.querySelector('.mic-t').textContent = on ? 'Đang nghe… bấm để dừng' : 'Bấm để nói';
  };
  const finish = (rec) => {
    const report = scoreAttempt(item.text, rec, item.type);
    el.querySelector('.sc-report').innerHTML = reportHtml(app, report);
    el.querySelector('.sc-report').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    opts.onResult?.(report);
  };
  el.addEventListener('click', async (e) => {
    if (e.target.closest('[data-play]')) speak(item.text, voiceOpts(app));
    else if (e.target.closest('[data-slow]')) speak(item.text, voiceOpts(app, { rate: 0.6 }));
    else if (e.target.closest('[data-rec]')) {
      if (ctl) { ctl.stop(); return; }
      if (!srSupported()) { toast(SR_ERRORS_VI.unsupported, 'warn', 5000); return; }
      ctl = listen({
        lang: app.state.settings.accent, continuous: item.type === 'paragraph', maxSec: item.type === 'paragraph' ? 45 : 12,
        onStart: () => setRec(true), onInterim: (t) => { interim.textContent = t; },
      });
      try {
        const rec = await ctl.promise;
        finish(rec);
      } catch (err) {
        toast(SR_ERRORS_VI[err.message] || `Lỗi nhận diện: ${esc(err.message)}`, 'warn', 6000);
      } finally {
        ctl = null;
        setRec(false);
        interim.textContent = '';
      }
    }
  });
  el.querySelector('.type-fallback')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const t = e.target.t.value.trim();
    if (t) finish({ alternatives: [t], confidence: 0, durationSec: (t.split(/\s+/).length / 130) * 60 });
  });
  bindWordClicks(app, el);
  if (opts.autoplay && ttsSupported()) setTimeout(() => speak(item.text, voiceOpts(app)), 300);
  el.refreshVoice = () => { el.querySelector('.voice-label').textContent = accentLabel(app.state.settings); };
  return el;
}

export { scoreClass };
