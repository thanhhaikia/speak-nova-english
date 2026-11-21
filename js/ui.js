// Small DOM helpers shared by views.
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

/** Tagged template that escapes interpolations unless wrapped with raw(). */
export function html(strings, ...vals) {
  return strings.reduce((out, s, i) => {
    if (i >= vals.length) return out + s;
    const v = vals[i];
    const str = Array.isArray(v) ? v.map((x) => (x?.__raw ? x.s : esc(x))).join('') : v?.__raw ? v.s : esc(v);
    return out + s + str;
  }, '');
}
export const raw = (s) => ({ __raw: true, s: String(s ?? '') });
/** html`` result usable as interpolation without re-escaping. */
export const h = (...a) => raw(html(...a));

export function toast(msg, kind = 'info', ms = 2800) {
  let box = $('#toasts');
  if (!box) {
    box = document.createElement('div');
    box.id = 'toasts';
    document.body.appendChild(box);
  }
  const el = document.createElement('div');
  el.className = `toast toast-${kind}`;
  el.innerHTML = msg;
  box.appendChild(el);
  setTimeout(() => el.classList.add('out'), ms);
  setTimeout(() => el.remove(), ms + 400);
}

export function modal(inner, { onClose } = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'modal-wrap';
  wrap.innerHTML = `<div class="modal" role="dialog" aria-modal="true"><button class="modal-x" aria-label="Đóng">✕</button>${inner}</div>`;
  const close = () => { wrap.remove(); onClose?.(); };
  wrap.addEventListener('click', (e) => { if (e.target === wrap || e.target.closest('.modal-x') || e.target.closest('[data-close]')) close(); });
  document.body.appendChild(wrap);
  return { el: wrap.firstElementChild, close };
}

export const scoreClass = (s) => (s >= 80 ? 'good' : s >= 60 ? 'ok' : 'bad');

export function ring(score, size = 120, label = '') {
  const r = 52, c = 2 * Math.PI * r, off = c * (1 - Math.max(0, Math.min(100, score)) / 100);
  return `<div class="ring ${scoreClass(score)}" style="width:${size}px;height:${size}px">
    <svg viewBox="0 0 120 120"><circle class="ring-bg" cx="60" cy="60" r="${r}"/><circle class="ring-fg" cx="60" cy="60" r="${r}" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"/></svg>
    <div class="ring-val"><b>${Math.round(score)}</b>${label ? `<small>${esc(label)}</small>` : ''}</div></div>`;
}

export function bar(label, value, hint = '') {
  if (value == null) return '';
  return `<div class="bar-row"><div class="bar-head"><span>${esc(label)}</span><b class="${scoreClass(value)}-t">${Math.round(value)}</b></div>
    <div class="bar"><i class="${scoreClass(value)}" style="width:${Math.max(2, value)}%"></i></div>${hint ? `<small class="muted">${esc(hint)}</small>` : ''}</div>`;
}

export const stars = (n) => '★★★'.slice(0, n) + '☆☆☆'.slice(0, 3 - n);
