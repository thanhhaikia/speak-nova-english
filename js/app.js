import { load, save, checkAchievements } from './store.js';
import { levelInfo, liveStreak, dayKey } from './gamify.js';
import { dailyGoalXp } from './path.js';
import { LESSONS } from './content/courses.js';
import { SCENARIOS } from './content/scenarios.js';
import { toast, esc } from './ui.js';
import { stopSpeaking, voices, onVoicesChanged } from './speech.js';
import * as onboarding from './views/onboarding.js';
import * as home from './views/home.js';
import * as library from './views/library.js';
import * as lesson from './views/lesson.js';
import * as practice from './views/practice.js';
import * as analyzer from './views/analyzer.js';
import * as chat from './views/chat.js';
import * as dictionary from './views/dictionary.js';
import * as progress from './views/progress.js';
import * as settings from './views/settings.js';

const ACH_CTX = { soundLessons: LESSONS.filter((l) => l.course === 'sounds').map((l) => l.id), scenarioIds: SCENARIOS.map((s) => s.id) };

const app = {
  state: load(),
  main: document.getElementById('main'),
  save() { save(this.state); renderTopbar(); },
  go(path) { location.hash = '#' + path; },
  /** Call after any XP-earning action: saves, shows XP toast, unlocks achievements. */
  reward(xp, label = '') {
    const before = levelInfo(this.state.xp - xp).level;
    const unlocked = checkAchievements(this.state, ACH_CTX);
    this.save();
    if (xp > 0) toast(`<b>+${xp} XP</b> ${esc(label)}`, 'xp', 1800);
    const after = levelInfo(this.state.xp).level;
    if (after > before) toast(`🎉 Lên cấp <b>${after}</b>!`, 'level', 3500);
    for (const a of unlocked) toast(`${a.icon} Thành tích mới: <b>${esc(a.vi)}</b>`, 'ach', 4000);
  },
};
window.__app = app; // handy for debugging in the console

const ROUTES = [
  [/^\/onboarding$/, onboarding.render, null],
  [/^\/$/, home.render, 'home'],
  [/^\/learn$/, library.render, 'learn'],
  [/^\/course\/([\w-]+)$/, library.renderCourse, 'learn'],
  [/^\/lesson\/([\w-]+)$/, lesson.render, 'learn'],
  [/^\/practice$/, practice.render, 'practice'],
  [/^\/analyzer$/, analyzer.render, 'practice'],
  [/^\/chat$/, chat.renderList, 'chat'],
  [/^\/chat\/([\w-]+)$/, chat.render, 'chat'],
  [/^\/dictionary$/, dictionary.render, 'dict'],
  [/^\/progress$/, progress.render, 'progress'],
  [/^\/settings$/, settings.render, 'progress'],
];

function renderTopbar() {
  const s = app.state;
  const lv = levelInfo(s.xp);
  const today = s.days[dayKey()] || 0;
  const goal = dailyGoalXp(s.profile?.minutes || 10);
  document.getElementById('topstats').innerHTML = s.profile
    ? `<a href="#/progress" class="stat" title="Chuỗi ngày học">🔥 <b>${liveStreak(s.streak)}</b></a>
       <a href="#/progress" class="stat" title="Mục tiêu hôm nay">🎯 <b>${Math.min(today, goal)}/${goal}</b></a>
       <a href="#/progress" class="stat" title="Cấp độ">⭐ <b>Lv ${lv.level}</b></a>
       <a href="#/settings" class="stat icon" title="Cài đặt">⚙️</a>`
    : '';
}

function route() {
  stopSpeaking();
  const [path, qs] = (location.hash.slice(1) || '/').split('?');
  const query = new URLSearchParams(qs || '');
  if (!app.state.profile && path !== '/onboarding') return app.go('/onboarding');
  const hit = ROUTES.find(([re]) => re.test(path)) || ROUTES[1];
  const params = path.match(hit[0])?.slice(1) || [];
  document.body.classList.toggle('no-nav', !hit[2]);
  document.querySelectorAll('.nav a').forEach((a) => a.classList.toggle('on', a.dataset.nav === hit[2]));
  app.main.innerHTML = '';
  app.main.scrollTo?.(0, 0);
  window.scrollTo(0, 0);
  hit[1](app, params, query);
  renderTopbar();
}

window.addEventListener('hashchange', route);
voices();
onVoicesChanged(() => document.dispatchEvent(new CustomEvent('voices')));
route();
