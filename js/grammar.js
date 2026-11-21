// Lightweight rule-based grammar checker for common Vietnamese-learner mistakes.
const PAST = { go: 'went', eat: 'ate', buy: 'bought', see: 'saw', have: 'had', meet: 'met', visit: 'visited', watch: 'watched', play: 'played', come: 'came', take: 'took', make: 'made', get: 'got' };
const BASE = Object.fromEntries(Object.entries(PAST).map(([b, p]) => [p, b]));
const THIRD = { go: 'goes', work: 'works', live: 'lives', like: 'likes', want: 'wants', play: 'plays', study: 'studies', watch: 'watches', do: 'does', love: 'loves', need: 'needs', speak: 'speaks', have: 'has', don: 'don' };
const ING = { go: 'going', work: 'working', study: 'studying', live: 'living', play: 'playing', learn: 'learning', watch: 'watching' };
const VOWEL_JOBS = ['engineer', 'accountant', 'architect', 'employee', 'officer', 'artist', 'actor', 'office worker', 'english teacher'];
const JOBS = ['student', 'teacher', 'engineer', 'doctor', 'nurse', 'developer', 'designer', 'accountant', 'manager', 'lawyer', 'programmer', 'farmer', 'worker', 'officer', 'employee', 'freelancer', 'architect', 'chef', 'driver', 'artist', 'actor', 'singer', 'salesman'];
const AUX = '(?<!\\b(?:does|did|can|will|would|should|could|might|may|must|to|let|make|doesn\'t|didn\'t|can\'t|won\'t) )';

const RULES = [
  { re: /\b(i am|i'm) agree\b/g, fix: () => 'i agree', vi: '"agree" là động từ, không đi với "am": nói "I agree".', en: '"Agree" is a verb: say "I agree", not "I am agree".' },
  { re: /\bi very (like|love|enjoy|want)\b/g, fix: (m, v) => `i really ${v}`, vi: 'Không đặt "very" trước động từ: dùng "I really like…" hoặc "I like … very much".', en: 'Use "I really like…" or "I like… very much", not "I very like".' },
  { re: /\bi have (\w+(?: \w+)?) years old\b/g, fix: (m, n) => `i am ${n} years old`, vi: 'Nói tuổi dùng "to be": "I am 25 years old", không dùng "have".', en: 'Use "be" for age: "I am 25 years old".' },
  { re: new RegExp(`\\b(i am|i'm|he is|she is|he's|she's) (${JOBS.join('|')})\\b`, 'g'), fix: (m, s, j) => `${s} ${VOWEL_JOBS.includes(j) ? 'an' : 'a'} ${j}`, vi: 'Danh từ nghề nghiệp số ít cần mạo từ "a/an": "I am a student", "an engineer".', en: 'Use "a/an" before a singular job: "I am a student".' },
  { re: /\b(he|she|it) don't\b/g, fix: (m, s) => `${s} doesn't`, vi: 'Ngôi thứ ba số ít dùng "doesn\'t": "She doesn\'t…".', en: 'Use "doesn\'t" with he/she/it.' },
  { re: new RegExp(`${AUX}\\b(he|she|it) (go|work|live|like|want|play|study|watch|love|need|speak|have)\\b`, 'g'), fix: (m, s, v) => `${s} ${THIRD[v]}`, vi: 'Thì hiện tại đơn, ngôi thứ ba số ít thêm -s/-es: "he goes", "she works", "it has".', en: 'Present simple with he/she/it adds -s: "he goes", "she has".' },
  { re: /\b(did|didn't|did not) (you |i |he |she |we |they |it )?(went|ate|bought|saw|had|met|came|took|made|got)\b/g, fix: (m, d, s = '', v) => `${d} ${s}${BASE[v]}`, vi: 'Sau "did/didn\'t" động từ ở dạng nguyên mẫu: "Did you go…?", "I didn\'t see…".', en: 'After "did/didn\'t" use the base verb: "Did you go?".' },
  { re: /\b(yesterday|last night|last week|last year|last month|last weekend|last summer|last (?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|\w+ (?:days|weeks|years) ago),? (i|we|they) (go|eat|buy|see|have|meet|visit|watch|play)\b/g, fix: (m, t, s, v) => `${t} ${s} ${PAST[v]}`, vi: 'Có mốc thời gian quá khứ (yesterday, last…) thì dùng thì quá khứ đơn: "Yesterday I went…".', en: 'Use the past simple with past time words: "Yesterday I went…".' },
  { re: /\b(want|need|would like|'d like) (go|eat|buy|see|order|work|learn|become|visit|travel|try|ask|know|book|pay|get|improve|study|speak)\b/g, fix: (m, a, v) => `${a} to ${v}`, vi: '"want/need/would like" + to + động từ: "I want to go", "I would like to order".', en: 'Use "to" after want/need/would like: "I want to go".' },
  { re: /\b(i am|i'm) (go|work|study|live|play|learn|watch)\b/g, fix: (m, s, v) => `${s} ${ING[v]}`, vi: 'Không dùng "am" + động từ nguyên mẫu. Nói "I go…" (thói quen) hoặc "I am going…" (đang diễn ra).', en: 'Do not use "am" + base verb: say "I go" or "I am going".' },
  { re: /\bmore (better|worse|bigger|smaller|easier|cheaper|faster|happier|older|younger)\b/g, fix: (m, a) => a, vi: 'So sánh hơn của tính từ ngắn đã có -er, không thêm "more": "better", "cheaper".', en: 'Do not use "more" with -er adjectives: "better", not "more better".' },
  { re: /\bdiscuss about\b/g, fix: () => 'discuss', vi: '"discuss" không đi với "about": "discuss the plan".', en: '"Discuss" takes no "about".' },
  { re: /\bexplain me\b/g, fix: () => 'explain to me', vi: 'Nói "explain to me", không nói "explain me".', en: 'Say "explain to me".' },
  { re: /\b(i am|i'm) interesting in\b/g, fix: (m, s) => `${s} interested in`, vi: 'Cảm xúc của bản thân dùng -ed: "I am interested in…"; "interesting" là "thú vị".', en: 'Use "interested in" for your feelings; "interesting" describes things.' },
  { re: /\b(i am|i'm|i feel) boring\b/g, fix: (m, s) => `${s} bored`, vi: '"I am boring" nghĩa là "tôi là người nhàm chán". Muốn nói "tôi thấy chán" hãy dùng "I am bored".', en: '"I am bored" = I feel bored; "I am boring" = I am a boring person.' },
  { re: /\bpeople is\b/g, fix: () => 'people are', vi: '"people" là danh từ số nhiều: "people are".', en: '"People" is plural: "people are".' },
  { re: /\b(we|they|you) was\b/g, fix: (m, s) => `${s} were`, vi: 'Với we/they/you dùng "were".', en: 'Use "were" with we/they/you.' },
  { re: /\bin (monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/g, fix: (m, d) => `on ${d}`, vi: 'Trước thứ trong tuần dùng "on": "on Monday".', en: 'Use "on" with days: "on Monday".' },
  { re: /\bat the (morning|afternoon|evening)\b/g, fix: (m, p) => `in the ${p}`, vi: 'Buổi trong ngày dùng "in the morning/afternoon/evening" (nhưng "at night").', en: 'Say "in the morning", but "at night".' },
  { re: /\bmarried with\b/g, fix: () => 'married to', vi: 'Nói "married to someone".', en: 'Say "married to someone".' },
  { re: /\ba (apple|hour|honest|egg|orange|umbrella|interesting|old|idea|office|eight|expensive|english)\b/g, fix: (m, w) => `an ${w}`, vi: 'Trước âm nguyên âm dùng "an": "an apple", "an hour".', en: 'Use "an" before a vowel sound.' },
  { re: /\ban (university|book|car|house|european|uniform|big|good|new|small)\b/g, fix: (m, w) => `a ${w}`, vi: 'Trước âm phụ âm dùng "a" (kể cả "a university" vì đọc /juː/).', en: 'Use "a" before a consonant sound ("a university").' },
  { re: /\bmuch (people|friends|things|books|cars|students|countries)\b/g, fix: (m, w) => `many ${w}`, vi: 'Danh từ đếm được số nhiều dùng "many", không dùng "much".', en: 'Use "many" with countable nouns.' },
  { re: /\b(been|go|went|going|come|came) to (there|home)\b/g, fix: (m, v, p) => `${v} ${p}`, vi: '"there" và "home" không cần "to": "go home", "been there".', en: 'No "to" before "there" or "home".' },
  { re: /\bthanks you\b/g, fix: () => 'thank you', vi: 'Nói "Thank you" hoặc "Thanks".', en: 'Say "Thank you" or "Thanks".' },
  { re: /\bthe (vietnam|japan|china|korea|thailand|england|france|hanoi|london|tokyo)\b/g, fix: (m, w) => w, vi: 'Tên hầu hết quốc gia/thành phố không dùng "the".', en: 'Most country and city names take no "the".' },
];

const cap = (s) => s.replace(/\bi\b/g, 'I').replace(/(^|[.!?]\s+)([a-z])/g, (m, a, b) => a + b.toUpperCase());

/** Check a reply. Returns detected issues and a corrected version (lower-risk rewrite of the input). */
export function checkGrammar(text) {
  let s = ' ' + String(text || '').toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim() + ' ';
  const issues = [];
  for (const rule of RULES) {
    rule.re.lastIndex = 0;
    s = s.replace(rule.re, (...args) => {
      const match = args[0];
      const right = rule.fix(...args);
      if (right !== match) issues.push({ wrong: match.trim(), right: right.trim(), vi: rule.vi, en: rule.en });
      return right;
    });
  }
  return { issues, corrected: cap(s.trim()) };
}
