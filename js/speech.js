// Browser speech: speechSynthesis for the model voice, (webkit)SpeechRecognition for the learner.
const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
const Recognition = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

export const ttsSupported = () => !!synth;
export const srSupported = () => !!Recognition;

const FEMALE = /female|woman|samantha|victoria|karen|moira|tessa|serena|kate|susan|zira|hazel|libby|sonia|jenny|aria|ava|allison|fiona|emma|amy|joanna|salli|kimberly|kendra|ivy|olivia|natasha|catherine|martha|stephanie|nicky|shelley|sandy|flo|grandma|maisie|michelle|ana|clara|lily|mia|sara|jane|zoe|isla|elsa|heather|linda|eva/i;
const MALE = /\bmale|\bman\b|david|mark|daniel|alex|fred|tom\b|george|ryan|guy|arthur|oliver|james|aaron|rishi|gordon|lee|thomas|brian|matthew|joey|justin|kevin|eric|steffan|christopher|roger|reed|rocko|ralph|eddy|grandpa|junior|albert|andrew|brandon|davis|jason|tony|william|noah|liam|ethan/i;

/** 'female' | 'male' | null, guessed from the voice name (browsers do not expose gender). */
export function guessGender(name) {
  if (/female/i.test(name)) return 'female';
  if (/\bmale\b/i.test(name)) return 'male';
  if (FEMALE.test(name)) return 'female';
  if (MALE.test(name)) return 'male';
  return null;
}

let cache = [];
export function voices() {
  if (!synth) return [];
  const list = synth.getVoices();
  if (list.length) cache = list;
  return cache;
}
export function onVoicesChanged(cb) {
  if (!synth) return;
  synth.addEventListener?.('voiceschanged', () => { voices(); cb(); });
}

const norm = (lang) => (lang || '').replace('_', '-').toLowerCase();

/** English voices grouped for the picker: [{voice, accent: 'en-US'|'en-GB'|'en-other', gender}] */
export function englishVoices() {
  return voices()
    .filter((v) => norm(v.lang).startsWith('en'))
    .map((v) => ({ voice: v, name: v.name, lang: v.lang, accent: norm(v.lang) === 'en-us' ? 'en-US' : norm(v.lang) === 'en-gb' ? 'en-GB' : 'en-other', gender: guessGender(v.name), local: v.localService }));
}

/** Best voice for an accent + preferred gender. Falls back to any voice of that accent, then any English voice. */
export function pickVoice(accent = 'en-US', gender = 'female', voiceName = null) {
  const list = englishVoices();
  if (voiceName) {
    const exact = list.find((v) => v.name === voiceName);
    if (exact) return exact.voice;
  }
  const sameAccent = list.filter((v) => v.accent === accent);
  const rank = (v) => (v.gender === gender ? 0 : v.gender == null ? 1 : 2) + (/google|natural|neural|online|premium|enhanced/i.test(v.name) ? -0.5 : 0);
  const pool = sameAccent.length ? sameAccent : list;
  return [...pool].sort((a, b) => rank(a) - rank(b))[0]?.voice || null;
}

/** Speak text with the model voice. Resolves when finished (or immediately if unsupported). */
export function speak(text, { accent = 'en-US', gender = 'female', rate = 0.9, voiceName = null, onBoundary } = {}) {
  return new Promise((resolve) => {
    if (!synth) return resolve(false);
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = pickVoice(accent, gender, voiceName);
    if (v) u.voice = v;
    u.lang = v?.lang || accent;
    u.rate = rate;
    u.pitch = !v && gender === 'male' ? 0.8 : 1;
    if (onBoundary) u.onboundary = onBoundary;
    u.onend = () => resolve(true);
    u.onerror = () => resolve(false);
    synth.speak(u);
    // Chrome sometimes pauses long utterances; keep it alive.
    const keep = setInterval(() => { if (!synth.speaking) clearInterval(keep); else { synth.pause(); synth.resume(); } }, 10000);
  });
}
export const stopSpeaking = () => synth?.cancel();

/**
 * Start listening. Returns a controller: { promise, stop() }.
 * promise resolves with { alternatives: string[], confidence, durationSec } (alternatives empty if nothing heard).
 * Long texts use continuous mode and concatenate final segments.
 */
export function listen({ lang = 'en-US', continuous = false, maxSec = 20, onInterim, onStart } = {}) {
  if (!Recognition) return { promise: Promise.reject(new Error('unsupported')), stop() {} };
  const rec = new Recognition();
  rec.lang = lang;
  rec.interimResults = true;
  rec.maxAlternatives = 5;
  rec.continuous = continuous;
  let finals = []; // per segment: [{transcript, confidence}...]
  let interim = '';
  let t0 = 0, tSpeech = 0, tLast = 0;
  let timer;
  const promise = new Promise((resolve, reject) => {
    rec.onstart = () => { t0 = performance.now(); onStart?.(); timer = setTimeout(() => rec.stop(), maxSec * 1000); };
    rec.onspeechstart = () => { tSpeech = tSpeech || performance.now(); };
    rec.onresult = (e) => {
      tLast = performance.now();
      tSpeech = tSpeech || tLast;
      interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finals[i] = Array.from(r).map((a) => ({ transcript: a.transcript.trim(), confidence: a.confidence }));
        else interim += r[0].transcript;
      }
      onInterim?.([...finals.filter(Boolean).map((f) => f[0].transcript), interim].join(' ').trim());
    };
    rec.onerror = (e) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      clearTimeout(timer);
      reject(new Error(e.error || 'error'));
    };
    rec.onend = () => {
      clearTimeout(timer);
      const segs = finals.filter(Boolean);
      if (!segs.length && interim) segs.push([{ transcript: interim.trim(), confidence: 0 }]);
      const alternatives = [];
      if (segs.length === 1) segs[0].forEach((a) => alternatives.push(a.transcript));
      else if (segs.length > 1) {
        alternatives.push(segs.map((s) => s[0].transcript).join(' '));
        // Variant per segment: swap in that segment's 2nd alternative.
        segs.forEach((s, k) => { if (s[1]) alternatives.push(segs.map((x, j) => (j === k ? s[1] : x[0]).transcript).join(' ')); });
      }
      const confs = segs.map((s) => s[0].confidence).filter((c) => c > 0);
      const confidence = confs.length ? confs.reduce((a, b) => a + b, 0) / confs.length : 0;
      const end = tLast || performance.now();
      const durationSec = Math.max(0, (end - (tSpeech || t0)) / 1000);
      resolve({ alternatives: alternatives.filter(Boolean), confidence, durationSec });
    };
  });
  try { rec.start(); } catch (e) { return { promise: Promise.reject(e), stop() {} }; }
  return { promise, stop: () => { try { rec.stop(); } catch { /* already stopped */ } } };
}

export const SR_ERRORS_VI = {
  'not-allowed': 'Trình duyệt chưa được cấp quyền dùng micro. Hãy bấm biểu tượng 🔒 trên thanh địa chỉ và cho phép Microphone.',
  'service-not-allowed': 'Trình duyệt không cho phép nhận diện giọng nói trên trang này (cần HTTPS hoặc localhost).',
  'audio-capture': 'Không tìm thấy micro. Hãy kiểm tra thiết bị thu âm.',
  network: 'Nhận diện giọng nói của trình duyệt cần kết nối Internet (Chrome gửi âm thanh tới dịch vụ của Google).',
  unsupported: 'Trình duyệt này không hỗ trợ nhận diện giọng nói. Hãy dùng Chrome, Edge hoặc Safari mới nhất — hoặc gõ câu trả lời.',
  'language-not-supported': 'Trình duyệt không hỗ trợ ngôn ngữ nhận diện đã chọn.',
};
