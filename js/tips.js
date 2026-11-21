// Pronunciation tips (Vietnamese + English) derived from the words a learner got wrong.
const TIP_DEFS = {
  th: { icon: '👅', vi: 'Âm TH (/θ/, /ð/): đặt đầu lưỡi giữa hai hàm răng và đẩy hơi ra. Đừng đọc thành "t", "d", "s" hay "ph".', en: 'TH (/θ/, /ð/): put your tongue between your teeth and blow air. Do not say t, d, s or f.' },
  final: { icon: '🔚', vi: 'Âm cuối: người Việt hay nuốt âm cuối (t, d, k, p, s…). Hãy kết thúc từ thật rõ, chặn hơi ở cuối.', en: 'Final consonants: finish every word clearly — do not drop t, d, k, p, s at the end.' },
  ed: { icon: '⏮️', vi: 'Đuôi -ed: đọc /t/ sau âm vô thanh (worked), /d/ sau âm hữu thanh (played), /ɪd/ sau t, d (wanted).', en: '-ed ending: /t/ after voiceless sounds, /d/ after voiced sounds, /ɪd/ after t or d.' },
  s: { icon: '🐍', vi: 'Đuôi -s/-es: đọc /s/ (cats), /z/ (dogs) hoặc /ɪz/ (watches). Đừng bỏ đuôi — nó cho biết số nhiều/ngôi thứ ba.', en: '-s ending: /s/, /z/ or /ɪz/. Never drop it — it marks plurals and third person.' },
  sh: { icon: '🤫', vi: 'Âm /ʃ/ (sh, -tion): chu môi tròn, lưỡi lùi về sau như khi nói "suỵt". Khác với /s/ môi dẹt.', en: '/ʃ/ (sh, -tion): round your lips and pull the tongue back, like "shh".' },
  ch: { icon: '🚂', vi: 'Âm /tʃ/ (ch) và /dʒ/ (j, g, dge): bật hơi mạnh, môi hơi chu. /dʒ/ không phải "gi" tiếng Việt.', en: '/tʃ/ and /dʒ/: a short stop then a hiss, lips slightly rounded.' },
  r: { icon: '🌀', vi: 'Âm /r/: cong lưỡi về sau, không chạm vòm miệng, không rung lưỡi.', en: '/r/: curl your tongue back without touching the roof of your mouth.' },
  l: { icon: '🎈', vi: 'Âm /l/ cuối từ ("L tối" như call, feel): nâng cuống lưỡi, đầu lưỡi chạm lợi trên — đừng đọc thành "u".', en: 'Dark L at the end of words: keep the tongue tip on the ridge, do not turn it into "oo".' },
  v: { icon: '🦷', vi: 'Âm /v/: răng trên chạm nhẹ môi dưới và rung. Âm /f/ giống vậy nhưng không rung.', en: '/v/: top teeth on the bottom lip with voice; /f/ is the same without voice.' },
  z: { icon: '🐝', vi: 'Âm /z/ (zoo, easy, is): giống /s/ nhưng có rung dây thanh — đặt tay lên cổ để cảm nhận.', en: '/z/ is a voiced /s/ — feel the vibration in your throat.' },
  cluster: { icon: '🔗', vi: 'Cụm phụ âm (str, spr, -sts, -nths): nối các phụ âm liền nhau, không chèn "ơ" vào giữa và không bỏ bớt âm.', en: 'Consonant clusters: join the consonants without adding vowels or dropping sounds.' },
  longI: { icon: '😁', vi: 'Nguyên âm dài /iː/ (ee, ea): kéo dài và bành môi như cười; phân biệt với /ɪ/ ngắn (ship – sheep).', en: 'Long /iː/: stretch it and smile; short /ɪ/ is quick and relaxed (ship – sheep).' },
  stress: { icon: '🎯', vi: 'Trọng âm: từ nhiều âm tiết có một âm được nhấn mạnh, to và dài hơn. Nghe mẫu và nhại theo nhịp.', en: 'Word stress: one syllable is louder and longer. Copy the rhythm of the model.' },
  weak: { icon: '🪶', vi: 'Bạn bỏ sót các từ nhỏ (a, the, to, of, and…). Khi nói nhanh chúng được đọc nhẹ (dạng yếu /ə/) nhưng vẫn phải có.', en: 'You skipped small words (a, the, to, of, and). Say them lightly, but say them.' },
  slow: { icon: '🐢', vi: 'Bạn nói hơi chậm hoặc ngắt quãng. Hãy đọc theo cụm ý và nối âm giữa các từ (turn‿it‿on).', en: 'You are speaking slowly or with pauses. Read in chunks and link words together.' },
  fast: { icon: '🐇', vi: 'Bạn nói hơi nhanh. Chậm lại một chút để từng âm cuối được rõ ràng.', en: 'You are speaking a bit fast. Slow down so every ending is clear.' },
  fillers: { icon: '🤐', vi: 'Có nhiều âm ngập ngừng (uh, um) hoặc từ thừa. Hãy dừng ngắn im lặng thay vì "ừm".', en: 'Too many fillers (uh, um) or extra words. Pause silently instead.' },
  great: { icon: '🌟', vi: 'Tuyệt vời! Phát âm rất rõ. Hãy thử nói nhanh và tự nhiên hơn, hoặc chuyển sang bài khó hơn.', en: 'Excellent! Try speaking more naturally or move on to a harder exercise.' },
  noSpeech: { icon: '🎙️', vi: 'Chưa nghe được giọng của bạn. Kiểm tra micro, nói to và gần micro hơn.', en: 'No speech detected. Check your microphone and speak louder.' },
};

const WEAK_WORDS = new Set(['a', 'an', 'the', 'to', 'of', 'and', 'for', 'at', 'in', 'on', 'is', 'are', 'was', 'can', 'do', 'does', 'some', 'your', 'my']);

/** Which sound categories a target word contains (rough spelling-based detection). */
export function soundCategories(word) {
  const w = word.toLowerCase().replace(/[^a-z']/g, '');
  const cats = [];
  if (/th/.test(w)) cats.push('th');
  if (/[^aeiou]ed$/.test(w) && w.length > 3) cats.push('ed');
  else if (/[^s']s$|es$/.test(w) && w.length > 3) cats.push('s');
  else if (/[bdgkpt]$|ck$|ct$|pt$|ft$/.test(w)) cats.push('final');
  if (/sh|tion|sion|ssure|sure|cial|cious/.test(w)) cats.push('sh');
  if (/ch|tch|dge|^j|ge$|gi|gy/.test(w)) cats.push('ch');
  if (/^r|[bcdfgkpt]r|rr/.test(w)) cats.push('r');
  if (/[^l]l$|ll$|le$/.test(w)) cats.push('l');
  if (/v/.test(w)) cats.push('v');
  if (/z|[aeiou]s[aeiouy]/.test(w)) cats.push('z');
  if (/^(str|spr|spl|scr|squ|thr|shr)|(sts|sks|xts|nths|ths|cts|pts|lds|nds)$/.test(w)) cats.push('cluster');
  if (/ee|ea|ie/.test(w)) cats.push('longI');
  if ((w.match(/[aeiouy]+/g) || []).length >= 3) cats.push('stress');
  return cats;
}

/**
 * Build tips from a scored attempt (see scoring.scoreAttempt).
 * @returns {{id, icon, vi, en, words: string[]}[]}
 */
export function buildTips(report) {
  if (!report.transcript) return [{ id: 'noSpeech', ...TIP_DEFS.noSpeech, words: [] }];
  const found = new Map();
  const add = (id, word) => {
    if (!found.has(id)) found.set(id, { id, ...TIP_DEFS[id], words: [] });
    if (word && !found.get(id).words.includes(word)) found.get(id).words.push(word);
  };
  for (const w of report.words) {
    if (w.status === 'correct') continue;
    const bare = w.norm;
    if (w.status === 'missing' && WEAK_WORDS.has(bare)) {
      add('weak', bare);
      continue;
    }
    const cats = soundCategories(bare);
    // Heard a word that matches the target minus its ending → ending dropped.
    if (w.heard && bare.startsWith(w.heard) && bare.length > w.heard.length) add(/ed$/.test(bare) ? 'ed' : /s$/.test(bare) ? 's' : 'final', bare);
    if (w.heard && /th/.test(bare) && !/th/.test(w.heard)) add('th', bare);
    const pick = cats.filter((c) => c !== 'stress').slice(0, 2);
    if (pick.length) pick.forEach((c) => add(c, bare));
    else if (cats.includes('stress')) add('stress', bare);
    else add('final', bare);
  }
  if (report.extras?.length >= 2) add('fillers');
  if (report.wpm != null && report.type !== 'word') {
    if (report.wpm < 80) add('slow');
    else if (report.wpm > 190) add('fast');
  }
  if (!found.size && report.overall >= 85) add('great');
  return [...found.values()].slice(0, 5);
}

export { TIP_DEFS };
