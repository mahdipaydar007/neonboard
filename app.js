'use strict';

/* ==========================================================================
   Neonboard — task tracker (vanilla JS, no dependencies)
   1. Helpers  2. State & storage  3. Domain helpers  4. Views  5. Modals
   6. Actions & events  7. Boot
   ========================================================================== */

/* 1. Helpers --------------------------------------------------------------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseYmd = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const todayStr = () => ymd(new Date());
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const PALETTE = [['Cyan', '#19f3ff'], ['Magenta', '#ff2e9a'], ['Amber', '#ffd23f'], ['Mint', '#3dffa2'], ['Violet', '#9b6bff'], ['Orange', '#ff7a3d']];
const ACCENTS = [['cyan', 'Cyan', '#19f3ff'], ['magenta', 'Magenta', '#ff2e9a'], ['amber', 'Amber', '#ffd23f'], ['green', 'Mint', '#3dffa2']];
const safeColor = c => (/^#[0-9a-f]{6}$/i.test(c) ? c : PALETTE[0][1]);

const PRI = { high: { label: 'High', rank: 0 }, med: { label: 'Medium', rank: 1 }, low: { label: 'Low', rank: 2 } };
const PRI_PAIRS = [['high', 'High'], ['med', 'Medium'], ['low', 'Low']];
const STATUS = ['todo', 'doing', 'done'];
const STATUS_LABEL = { todo: 'To do', doing: 'In progress', done: 'Done' };
const DAYNAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const options = (pairs, sel) => pairs.map(([v, l]) => `<option value="${esc(v)}" ${String(v) === String(sel) ? 'selected' : ''}>${esc(l)}</option>`).join('');
const initials = n => (String(n).trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('') || '?').toUpperCase();

const ICONS = {
  dashboard: '<rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>',
  tasks: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  calendar: '<rect x="3" y="4" width="18" height="18"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  timers: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/>',
  projects: '<path d="M3 7h6l2 2h10v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/>',
  routines: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
  account: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  play: '<path d="M6 4l14 8-14 8z"/>',
  pause: '<path d="M7 4h4v16H7zM13 4h4v16h-4z"/>',
  reset: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  left: '<path d="M15 18l-6-6 6-6"/>',
  right: '<path d="M9 18l6-6-6-6"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  flame: '<path d="M12 22c4 0 7-3 7-7 0-3-2-5-3-7-1 2-2 3-4 3 0-4-2-6-4-8-1 4-3 6-3 11 0 4 3 8 7 8z"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
  upload: '<path d="M12 15V3M7 8l5-5 5 5M4 21h16"/>',
  guide: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7M12 17h.01"/>'
};
const icon = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true">${ICONS[n]}</svg>`;

/* 2. State & storage ------------------------------------------------------- */
const STORE_KEY = 'neonboard.v1';
const LEGACY_KEY = 'nightdesk.v1'; // pre-rebrand data, migrated on first load

const DEFAULTS = () => ({
  v: 1,
  profile: null,
  settings: { accent: 'cyan', scanlines: true, glow: true, reduceMotion: false, time24: true, weekStart: 1, sound: true },
  tasks: [], projects: [], timers: [], routines: []
});

/* Everything read from storage or an imported file passes through here, so a
   hand-edited or corrupt backup can never inject markup or break the UI. */
function normalize(data) {
  const d = DEFAULTS();
  data = data && typeof data === 'object' ? data : {};
  const objs = v => (Array.isArray(v) ? v.filter(x => x && typeof x === 'object') : []);
  const str = (v, max = 200) => String(v ?? '').slice(0, max);
  const safeId = v => String(v ?? '').replace(/[^\w-]/g, '') || uid();
  const out = { ...d };

  if (data.profile && typeof data.profile === 'object') {
    out.profile = {
      name: str(data.profile.name, 40) || 'Runner',
      handle: str(data.profile.handle, 24).toLowerCase().replace(/[^a-z0-9_]/g, ''),
      bio: str(data.profile.bio, 160),
      color: safeColor(data.profile.color),
      createdAt: str(data.profile.createdAt, 40) || new Date().toISOString()
    };
  }
  const s = data.settings && typeof data.settings === 'object' ? data.settings : {};
  out.settings = {
    accent: ACCENTS.some(a => a[0] === s.accent) ? s.accent : d.settings.accent,
    scanlines: s.scanlines !== false,
    glow: s.glow !== false,
    reduceMotion: !!s.reduceMotion,
    time24: s.time24 !== false,
    sound: s.sound !== false,
    weekStart: [0, 1, 6].includes(Number(s.weekStart)) ? Number(s.weekStart) : 1
  };
  out.projects = objs(data.projects).map(p => ({ id: safeId(p.id), name: str(p.name, 60) || 'Untitled', desc: str(p.desc, 200), color: safeColor(p.color) }));
  out.tasks = objs(data.tasks).map(t => ({
    id: safeId(t.id), title: str(t.title, 140) || 'Untitled', notes: str(t.notes, 1000),
    priority: PRI[t.priority] ? t.priority : 'med',
    status: STATUS.includes(t.status) ? t.status : 'todo',
    due: DATE_RE.test(t.due) ? t.due : '',
    projectId: t.projectId ? safeId(t.projectId) : '',
    createdAt: str(t.createdAt, 40), doneAt: t.doneAt ? str(t.doneAt, 40) : null
  }));
  out.timers = objs(data.timers).map(t => ({
    id: safeId(t.id), label: str(t.label, 60) || 'Timer',
    target: Math.max(0, Math.min(1440, Number(t.target) || 0)),
    taskId: t.taskId ? safeId(t.taskId) : '',
    elapsed: Math.max(0, Number(t.elapsed) || 0),
    startedAt: Number(t.startedAt) > 0 ? Number(t.startedAt) : null
  }));
  out.routines = objs(data.routines).map(r => {
    const days = [...new Set((Array.isArray(r.days) ? r.days : []).map(Number).filter(n => n >= 0 && n <= 6))];
    const log = {};
    if (r.log && typeof r.log === 'object') Object.keys(r.log).forEach(k => { if (DATE_RE.test(k) && r.log[k]) log[k] = true; });
    return { id: safeId(r.id), title: str(r.title, 80) || 'Routine', days: days.length ? days : [0, 1, 2, 3, 4, 5, 6], log };
  });
  return out;
}

function load() {
  let raw = null;
  try {
    raw = localStorage.getItem(STORE_KEY);
    if (!raw) { raw = localStorage.getItem(LEGACY_KEY); if (raw) localStorage.setItem(STORE_KEY, raw); }
    return raw ? normalize(JSON.parse(raw)) : DEFAULTS();
  } catch (e) {
    console.warn('Neonboard: could not read saved data.', e);
    try { if (raw) localStorage.setItem(STORE_KEY + '.corrupt', raw); } catch (_) { /* ignore */ }
    return DEFAULTS();
  }
}

let state = load();
const ui = {
  view: 'dashboard', param: null,
  filters: { status: 'open', priority: 'all', project: 'all', sort: 'due' },
  query: '',
  cal: { y: new Date().getFullYear(), m: new Date().getMonth(), sel: todayStr() },
  accountTab: 'profile',
  savedAt: null,
  notified: new Set(),
  refocus: null,
  ringAnimated: false,
  day: todayStr()
};

let saveTimer = null;
function saveNow() {
  clearTimeout(saveTimer);
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
    ui.savedAt = new Date();
    updateSaveBadge();
  } catch (e) {
    toast('Could not save. Browser storage is full or blocked.', 'error');
  }
}
function save() { clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 150); }

function applySettings() {
  const s = state.settings, r = document.documentElement;
  r.dataset.accent = s.accent;
  r.dataset.scan = s.scanlines ? 'on' : 'off';
  r.dataset.glow = s.glow ? 'on' : 'off';
  r.dataset.motion = s.reduceMotion ? 'reduce' : 'full';
}

/* 3. Domain helpers -------------------------------------------------------- */
const projectOf = id => state.projects.find(p => p.id === id);
const taskOf = id => state.tasks.find(t => t.id === id);
const timerOf = id => state.timers.find(t => t.id === id);
const routineOf = id => state.routines.find(r => r.id === id);
const isOverdue = t => t.status !== 'done' && t.due && t.due < todayStr();

function dueLabel(s) {
  if (s === todayStr()) return 'Today';
  if (s === ymd(addDays(new Date(), 1))) return 'Tomorrow';
  if (s === ymd(addDays(new Date(), -1))) return 'Yesterday';
  return parseYmd(s).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
const longDate = s => parseYmd(s).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
const timeStr = d => d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hourCycle: state.settings.time24 ? 'h23' : 'h12' });
const greet = () => { const h = new Date().getHours(); return h < 5 ? 'Still up' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; };

const dueKey = t => t.due || '9999-99-99';
function sortTasks(list, mode) {
  const cmp = {
    due: (a, b) => dueKey(a).localeCompare(dueKey(b)) || PRI[a.priority].rank - PRI[b.priority].rank,
    priority: (a, b) => PRI[a.priority].rank - PRI[b.priority].rank || dueKey(a).localeCompare(dueKey(b)),
    created: (a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')
  }[mode] || (() => 0);
  return [...list].sort((a, b) => (a.status === 'done') - (b.status === 'done') || cmp(a, b));
}

function addTask(data) {
  const now = new Date().toISOString();
  const t = {
    id: uid(), title: data.title.trim(), notes: (data.notes || '').trim(),
    priority: PRI[data.priority] ? data.priority : 'med',
    status: STATUS.includes(data.status) ? data.status : 'todo',
    due: DATE_RE.test(data.due || '') ? data.due : '',
    projectId: data.projectId || '', createdAt: now, doneAt: null
  };
  if (t.status === 'done') t.doneAt = now;
  state.tasks.push(t);
  save();
  return t;
}
function setStatus(id, status) {
  const t = taskOf(id);
  if (!t || t.status === status) return;
  t.status = status;
  t.doneAt = status === 'done' ? new Date().toISOString() : null;
  save(); render();
}

const projectStats = id => {
  const ts = state.tasks.filter(t => t.projectId === id);
  const done = ts.filter(t => t.status === 'done').length;
  return { total: ts.length, done, open: ts.length - done, pct: ts.length ? Math.round(done / ts.length * 100) : 0 };
};

/* Timers keep wall-clock time, so a running timer survives a page reload. */
const elapsedOf = t => (t.elapsed || 0) + (t.startedAt ? Date.now() - t.startedAt : 0);
const fmtDur = (ms, up = false) => {
  const s = Math.max(0, up ? Math.ceil(ms / 1000) : Math.floor(ms / 1000));
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
};
function timerDisplay(t) {
  const el = elapsedOf(t);
  if (t.target) {
    const total = t.target * 60000, rem = total - el;
    return rem >= 0
      ? { text: fmtDur(rem, true), over: false, pct: Math.min(100, el / total * 100) }
      : { text: '+' + fmtDur(-rem), over: true, pct: 100 };
  }
  return { text: fmtDur(el), over: false, pct: 0 };
}

const routineDue = (r, date) => r.days.includes(parseYmd(date).getDay());
function streakOf(r) {
  let s = 0, d = new Date();
  const today = todayStr();
  for (let i = 0; i < 730; i++) {
    const key = ymd(d);
    if (routineDue(r, key)) {
      if (r.log[key]) s++;
      else if (key !== today) break;
    }
    d = addDays(d, -1);
  }
  return s;
}
const weekOrder = () => [0, 1, 2, 3, 4, 5, 6].map(i => (state.settings.weekStart + i) % 7);
const daysText = days => {
  if (days.length === 7) return 'Every day';
  if (days.length === 5 && [1, 2, 3, 4, 5].every(d => days.includes(d))) return 'Weekdays';
  return weekOrder().filter(d => days.includes(d)).map(d => DAYNAMES[d]).join(', ');
};

function seedSample() {
  const D = n => ymd(addDays(new Date(), n));
  const p1 = { id: uid(), name: 'Portfolio redesign', desc: 'Rebuild the personal site with a new case-study layout.', color: '#19f3ff' };
  const p2 = { id: uid(), name: 'Training block', desc: 'Eight weeks of consistent sessions.', color: '#ff2e9a' };
  state.projects.push(p1, p2);
  addTask({ title: 'Sketch dashboard wireframes', priority: 'high', due: D(0), projectId: p1.id, status: 'doing' });
  addTask({ title: 'Fix navbar on mobile', priority: 'high', due: D(-1), projectId: p1.id });
  addTask({ title: 'Write case study intro', priority: 'med', due: D(1), projectId: p1.id });
  addTask({ title: 'Export final logo assets', priority: 'low', due: D(4), projectId: p1.id });
  addTask({ title: 'Plan next week\'s sessions', priority: 'med', due: D(0), projectId: p2.id });
  addTask({ title: 'Reply to client emails', priority: 'med', due: D(0) });
  addTask({ title: 'Pay internet bill', priority: 'high', due: D(2) });
  addTask({ title: 'Back up project files', priority: 'low', due: D(-3), status: 'done' });
  state.timers.push({ id: uid(), label: 'Deep work', target: 25, taskId: '', elapsed: 0, startedAt: null });
  const log = {};
  [-1, -2].forEach(n => { log[D(n)] = true; });
  state.routines.push({ id: uid(), title: 'Morning stretch', days: [0, 1, 2, 3, 4, 5, 6], log: { ...log } });
  const wk = {};
  [-1, -2, -3].forEach(n => { if (routineDue({ days: [1, 2, 3, 4, 5] }, D(n))) wk[D(n)] = true; });
  state.routines.push({ id: uid(), title: 'Review inbox', days: [1, 2, 3, 4, 5], log: wk });
  save();
}

/* 4. Views ----------------------------------------------------------------- */
const emptyState = (title, text, extra = '') => `<div class="empty"><p class="empty-t">${esc(title)}</p><p>${esc(text)}</p>${extra}</div>`;
const avatar = (cls = '') => {
  const p = state.profile;
  return `<span class="avatar ${cls}" style="--c:${p ? safeColor(p.color) : '#9a92c4'}">${esc(initials(p ? p.name : '?'))}</span>`;
};
const swatches = (name, sel) => `<div class="swatches" role="radiogroup">${PALETTE.map(([n, c]) =>
  `<label class="sw" style="--c:${c}"><input type="radio" name="${name}" value="${c}" ${c.toLowerCase() === String(sel).toLowerCase() ? 'checked' : ''}><span></span><span class="sr-only">${n}</span></label>`).join('')}</div>`;

function taskChips(t) {
  const p = projectOf(t.projectId);
  return `<span class="chip pri-${t.priority}">${PRI[t.priority].label}</span>`
    + (t.due ? `<span class="chip ${isOverdue(t) ? 'late' : ''}">${isOverdue(t) ? 'Overdue, ' : ''}${esc(dueLabel(t.due))}</span>` : '')
    + (p ? `<span class="chip" style="--c:${safeColor(p.color)}">${esc(p.name)}</span>` : '')
    + (t.status === 'doing' ? '<span class="chip doing">In progress</span>' : '');
}

function taskRow(t) {
  const done = t.status === 'done';
  const firstLine = (t.notes || '').split('\n')[0];
  return `<li class="task ${done ? 'is-done' : ''}">
    <button class="check" type="button" data-action="toggle-task" data-id="${t.id}" aria-pressed="${done}" aria-label="${done ? 'Mark as not done' : 'Mark as done'}: ${esc(t.title)}">${icon('check')}</button>
    <div class="task-main">
      <span class="task-title">${esc(t.title)}</span>
      ${firstLine ? `<span class="task-note">${esc(firstLine)}</span>` : ''}
      <span class="task-meta">${taskChips(t)}</span>
    </div>
    <div class="row-actions">
      ${done ? '' : `<button class="icon-btn" type="button" data-action="start-task" data-id="${t.id}" aria-label="${t.status === 'doing' ? 'Move back to to do' : 'Mark in progress'}">${icon(t.status === 'doing' ? 'pause' : 'play')}</button>`}
      <button class="icon-btn" type="button" data-action="edit-task" data-id="${t.id}" aria-label="Edit task">${icon('edit')}</button>
      <button class="icon-btn bad" type="button" data-action="delete-task" data-id="${t.id}" aria-label="Delete task">${icon('trash')}</button>
    </div>
  </li>`;
}

/* Dashboard */
function vDashboard() {
  const t0 = todayStr();
  const open = state.tasks.filter(t => t.status !== 'done');
  const dueToday = state.tasks.filter(t => t.due === t0);
  const overdue = open.filter(isOverdue);
  const doneToday = t => t.status === 'done' && t.doneAt && ymd(new Date(t.doneAt)) === t0;
  // Planned today = due today + overdue + anything finished today (so completing a task counts)
  const planned = state.tasks.filter(t => t.due === t0 || isOverdue(t) || doneToday(t));
  const total = planned.length;
  const done = planned.filter(t => t.status === 'done').length;
  const pct = total ? Math.round(done / total * 100) : 0;
  const C = 2 * Math.PI * 52;
  const running = state.timers.filter(t => t.startedAt).length;
  const next = sortTasks(open.filter(t => t.due && t.due > t0), 'due')[0];
  const name = state.profile ? state.profile.name : 'Runner';
  const prevPct = ui.ringPct ?? 0;
  const animate = ui.ringPct !== pct;   // animate whenever the value changes
  ui.ringPct = pct;
  const fromLen = (prevPct / 100 * C).toFixed(1);

  const todayList = sortTasks([...overdue, ...dueToday], 'priority').slice(0, 7);
  const upcoming = sortTasks(open.filter(t => t.due > t0), 'due').slice(0, 3);

  const timers = [...state.timers].sort((a, b) => !!b.startedAt - !!a.startedAt).slice(0, 3);
  const routinesToday = state.routines.filter(r => routineDue(r, t0));
  const projects = state.projects.slice(0, 4);

  const days = [...Array(7)].map((_, i) => addDays(new Date(), i - 6));
  const counts = days.map(d => state.tasks.filter(t => t.doneAt && ymd(new Date(t.doneAt)) === ymd(d)).length);
  const max = Math.max(1, ...counts);

  return `
  <div class="grid">
    <section class="panel hot hero s12" aria-label="Today at a glance">
      <div class="ring ${animate ? 'anim' : ''}" style="--from:${fromLen}" role="img" aria-label="${pct}% of today's planned tasks are done">
        <svg viewBox="0 0 120 120" aria-hidden="true"><circle class="trk" cx="60" cy="60" r="52"/><circle class="val" cx="60" cy="60" r="52" stroke-dasharray="${(pct / 100 * C).toFixed(1)} ${C.toFixed(1)}"/></svg>
        <span class="ring-n glow">${pct}<small>%</small></span>
      </div>
      <div class="hero-text">
        <p class="hero-date">${esc(longDate(t0))}</p>
        <h1 class="glow">${esc(greet())}, ${esc(name)}.</h1>
        <p class="lede">${total ? `${done} of ${total} planned tasks done today.` : 'Nothing planned for today yet.'}</p>
        <ul class="hero-facts">
          <li class="${overdue.length ? 'bad' : ''}"><b>${overdue.length}</b>overdue</li>
          <li><b>${open.length}</b>open</li>
          <li><b>${running}</b>${running === 1 ? 'timer' : 'timers'} running</li>
        </ul>
        ${next ? `<p class="hero-next">Next deadline: ${esc(next.title)}, ${esc(dueLabel(next.due))}.</p>` : ''}
      </div>
    </section>

    <section class="panel s7" aria-labelledby="h-today">
      <div class="panel-head"><h2 id="h-today">Today and overdue</h2><a class="link" href="#/tasks">All tasks</a></div>
      ${todayList.length ? `<ul class="tasklist">${todayList.map(taskRow).join('')}</ul>`
      : emptyState('Nothing due today', 'Add a task with a due date and it will show up here.', `<button class="btn primary sm" type="button" data-action="new-task">${icon('plus')}New task</button>`)}
      ${upcoming.length ? `<p class="mini-label">Coming up</p><ul class="tasklist">${upcoming.map(taskRow).join('')}</ul>` : ''}
    </section>

    <section class="panel s5" aria-labelledby="h-timers">
      <div class="panel-head"><h2 id="h-timers">Timers</h2><a class="link" href="#/timers">Manage</a></div>
      ${timers.length ? `<ul class="mini-list">${timers.map(t => {
        const d = timerDisplay(t);
        return `<li class="mini-row"><div class="grow"><div class="t">${esc(t.label)}</div><span class="readout-sm ${d.over ? 'over' : ''}" data-timer="${t.id}">${d.text}</span></div>
          <button class="icon-btn" type="button" data-action="timer-toggle" data-id="${t.id}" aria-label="${t.startedAt ? 'Pause' : 'Start'} ${esc(t.label)}">${icon(t.startedAt ? 'pause' : 'play')}</button></li>`;
      }).join('')}</ul>`
      : emptyState('No timers yet', 'Create one to track focused work.', '<a class="btn ghost sm" href="#/timers">Go to timers</a>')}
    </section>

    <section class="panel s4" aria-labelledby="h-routines">
      <div class="panel-head"><h2 id="h-routines">Routines today</h2><a class="link" href="#/routines">Manage</a></div>
      ${routinesToday.length ? `<ul class="mini-list">${routinesToday.map(r => `
        <li class="mini-row">
          <button class="check" type="button" data-action="routine-toggle" data-id="${r.id}" data-date="${t0}" aria-pressed="${!!r.log[t0]}" aria-label="${r.log[t0] ? 'Undo' : 'Complete'} ${esc(r.title)}">${icon('check')}</button>
          <span class="grow t ${r.log[t0] ? 'done' : ''}">${esc(r.title)}</span>
          ${streakOf(r) ? `<span class="chip streak">${icon('flame')}${streakOf(r)}</span>` : ''}
        </li>`).join('')}</ul>`
      : emptyState('No routines today', 'Recurring tasks scheduled for today appear here.', '<a class="btn ghost sm" href="#/routines">Add a routine</a>')}
    </section>

    <section class="panel s4" aria-labelledby="h-projects">
      <div class="panel-head"><h2 id="h-projects">Projects</h2><a class="link" href="#/projects">All projects</a></div>
      ${projects.length ? projects.map(p => {
        const st = projectStats(p.id);
        return `<div class="proj-row"><div class="top-line"><a href="#/projects/${p.id}">${esc(p.name)}</a><span class="count">${st.pct}%</span></div>
          <div class="progress" style="--c:${safeColor(p.color)}"><i style="width:${st.pct}%"></i></div></div>`;
      }).join('') : emptyState('No projects yet', 'Group related tasks on a board.', '<a class="btn ghost sm" href="#/projects">Create a project</a>')}
    </section>

    <section class="panel s4" aria-labelledby="h-week">
      <div class="panel-head"><h2 id="h-week">Completed, last 7 days</h2></div>
      <div class="bars" role="img" aria-label="Tasks completed per day: ${counts.join(', ')}">
        ${days.map((d, i) => `<div class="bar-col"><span class="bar-n">${counts[i]}</span><div class="bar-track"><i style="height:${counts[i] ? Math.max(6, counts[i] / max * 100) : 0}%"></i></div><span class="bar-l">${d.toLocaleDateString(undefined, { weekday: 'short' })}</span></div>`).join('')}
      </div>
    </section>
  </div>`;
}

/* Tasks */
function vTasks() {
  const f = ui.filters, q = ui.query.trim().toLowerCase();
  let list = state.tasks.filter(t => {
    if (f.status === 'open' && t.status === 'done') return false;
    if (STATUS.includes(f.status) && t.status !== f.status) return false;
    if (f.priority !== 'all' && t.priority !== f.priority) return false;
    if (f.project === 'none' && t.projectId) return false;
    if (f.project !== 'all' && f.project !== 'none' && t.projectId !== f.project) return false;
    if (q && !(t.title.toLowerCase().includes(q) || (t.notes || '').toLowerCase().includes(q))) return false;
    return true;
  });
  list = sortTasks(list, f.sort);
  const openCount = state.tasks.filter(t => t.status !== 'done').length;
  const doneCount = state.tasks.filter(t => t.status === 'done').length;
  const projOpts = [['all', 'All projects'], ['none', 'No project'], ...state.projects.map(p => [p.id, p.name])];

  return `
  <div class="page-head"><div><h1>Tasks</h1><p class="sub">${list.length} shown, ${openCount} open</p></div>
  ${doneCount ? `<button class="btn ghost sm" type="button" data-action="clear-completed">${icon('trash')}Clear completed (${doneCount})</button>` : ''}</div>
  <section class="panel">
    <form class="quick" data-form="quick-task">
      <input id="quick-title" name="title" required maxlength="140" placeholder="Add a task and press Enter" aria-label="Task title" autocomplete="off">
      <select name="priority" aria-label="Priority">${options(PRI_PAIRS, 'med')}</select>
      <input type="date" name="due" aria-label="Due date">
      <button class="btn primary" type="submit">Add task</button>
      <textarea class="quick-notes" name="notes" rows="2" maxlength="1000" placeholder="Notes (optional)" aria-label="Notes"></textarea>
    </form>
    <div class="filters">
      <label class="field inline"><span>Show</span><select data-filter="status">${options([['open', 'Open'], ['all', 'All'], ['todo', 'To do'], ['doing', 'In progress'], ['done', 'Done']], f.status)}</select></label>
      <label class="field inline"><span>Priority</span><select data-filter="priority">${options([['all', 'Any'], ...PRI_PAIRS], f.priority)}</select></label>
      <label class="field inline"><span>Project</span><select data-filter="project">${options(projOpts, f.project)}</select></label>
      <label class="field inline"><span>Sort by</span><select data-filter="sort">${options([['due', 'Due date'], ['priority', 'Priority'], ['created', 'Newest']], f.sort)}</select></label>
    </div>
    ${ui.query ? `<p class="qline">Searching for “${esc(ui.query)}”. <button class="link" type="button" data-action="clear-query">Clear search</button></p>` : ''}
    ${list.length ? `<ul class="tasklist">${list.map(taskRow).join('')}</ul>`
      : emptyState(state.tasks.length ? 'No tasks match these filters' : 'No tasks yet', state.tasks.length ? 'Change the filters or clear the search.' : 'Type a title above and press Enter to add your first task.')}
  </section>`;
}

/* Calendar */
function vCalendar() {
  const { y, m, sel } = ui.cal;
  const t0 = todayStr(), ws = state.settings.weekStart;
  const first = new Date(y, m, 1);
  const offset = (first.getDay() - ws + 7) % 7;
  const dim = new Date(y, m + 1, 0).getDate();
  const rows = Math.ceil((offset + dim) / 7);
  const start = addDays(first, -offset);
  const byDate = {};
  state.tasks.forEach(t => { if (t.due) (byDate[t.due] ||= []).push(t); });

  let cells = '';
  for (let i = 0; i < rows * 7; i++) {
    const d = addDays(start, i), key = ymd(d), list = sortTasks(byDate[key] || [], 'priority');
    cells += `<button type="button" class="day ${d.getMonth() !== m ? 'out' : ''} ${key === t0 ? 'today' : ''} ${key === sel ? 'sel' : ''}" data-action="cal-select" data-id="${key}" aria-pressed="${key === sel}" aria-label="${esc(longDate(key))}, ${list.length} ${list.length === 1 ? 'task' : 'tasks'}">
      <span class="dn">${d.getDate()}</span>
      <span class="evs">${list.slice(0, 2).map(t => `<i class="ev pri-${t.priority} ${t.status === 'done' ? 'done' : ''}">${esc(t.title)}</i>`).join('')}${list.length > 2 ? `<i class="more">+${list.length - 2} more</i>` : ''}</span>
    </button>`;
  }
  const selTasks = sortTasks(byDate[sel] || [], 'priority');

  return `
  <div class="page-head"><div><h1>Calendar</h1><p class="sub">Tasks plotted by due date</p></div></div>
  <div class="cal-layout">
    <section class="panel">
      <div class="cal-head">
        <h2>${first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h2>
        <button class="icon-btn" type="button" data-action="cal-prev" aria-label="Previous month">${icon('left')}</button>
        <button class="btn ghost sm" type="button" data-action="cal-today">Today</button>
        <button class="icon-btn" type="button" data-action="cal-next" aria-label="Next month">${icon('right')}</button>
      </div>
      <div class="cal-wd" aria-hidden="true">${weekOrder().map(d => `<span>${DAYNAMES[d]}</span>`).join('')}</div>
      <div class="cal-grid">${cells}</div>
    </section>
    <section class="panel" aria-labelledby="h-day">
      <div class="panel-head"><h2 id="h-day">${esc(longDate(sel))}</h2></div>
      ${selTasks.length ? `<ul class="tasklist">${selTasks.map(taskRow).join('')}</ul>` : emptyState('Nothing planned', 'No tasks are due on this day.')}
      <button class="btn ghost sm" type="button" data-action="new-task-on" data-id="${sel}" style="margin-top:12px">${icon('plus')}Add task on this day</button>
    </section>
  </div>`;
}

/* Timers */
function vTimers() {
  const openTasks = state.tasks.filter(t => t.status !== 'done');
  return `
  <div class="page-head"><div><h1>Timers</h1><p class="sub">Countdowns for focus blocks, stopwatches for everything else</p></div></div>
  <section class="panel" style="margin-bottom:18px">
    <form class="timer-form" data-form="timer">
      <label class="field"><span>Label</span><input name="label" required maxlength="60" placeholder="Deep work" autocomplete="off"></label>
      <label class="field"><span>Minutes (0 = stopwatch)</span><input type="number" name="target" min="0" max="1440" value="25"></label>
      <label class="field"><span>Linked task (optional)</span><select name="taskId"><option value="">None</option>${openTasks.map(t => `<option value="${t.id}">${esc(t.title)}</option>`).join('')}</select></label>
      <button class="btn primary" type="submit">${icon('plus')}Add timer</button>
    </form>
  </section>
  ${state.timers.length ? `<div class="cards">${state.timers.map(t => {
    const d = timerDisplay(t), task = taskOf(t.taskId);
    return `<article class="panel timer ${t.startedAt ? 'running' : ''}">
      <div class="timer-top"><div><h3>${esc(t.label)}</h3>${task ? `<span class="chip">${esc(task.title)}</span>` : ''}</div>
        <button class="icon-btn bad" type="button" data-action="delete-timer" data-id="${t.id}" aria-label="Delete timer ${esc(t.label)}">${icon('trash')}</button></div>
      <div class="readout ${d.over ? 'over' : ''}" data-timer="${t.id}">${d.text}</div>
      ${t.target ? `<div class="progress"><i data-timer-bar="${t.id}" style="width:${d.pct}%"></i></div>` : ''}
      <div class="timer-foot">
        <button class="btn ${t.startedAt ? 'ghost' : 'primary'} sm" type="button" data-action="timer-toggle" data-id="${t.id}">${icon(t.startedAt ? 'pause' : 'play')}${t.startedAt ? 'Pause' : (elapsedOf(t) ? 'Resume' : 'Start')}</button>
        <button class="btn ghost sm" type="button" data-action="timer-reset" data-id="${t.id}">${icon('reset')}Reset</button>
        <span class="grow"></span>
        <span class="count">${t.target ? `${t.target} min` : 'stopwatch'}</span>
      </div></article>`;
  }).join('')}</div>` : `<section class="panel">${emptyState('No timers yet', 'Add a label above to create your first timer.')}</section>`}`;
}

/* Projects */
function vProjects() {
  if (ui.param) {
    const p = projectOf(ui.param);
    return p ? vBoard(p) : vNotFound();
  }
  return `
  <div class="page-head"><div><h1>Projects</h1><p class="sub">${state.projects.length} ${state.projects.length === 1 ? 'project' : 'projects'}</p></div>
    <button class="btn primary" type="button" data-action="new-project">${icon('plus')}New project</button></div>
  ${state.projects.length ? `<div class="cards">${state.projects.map(pr => {
    const st = projectStats(pr.id);
    return `<article class="panel pcard" style="--c:${safeColor(pr.color)}">
      <div class="pcard-top"><span class="swatch-dot"></span><h2><a href="#/projects/${pr.id}">${esc(pr.name)}</a></h2>
        <div class="row-actions">
          <button class="icon-btn" type="button" data-action="edit-project" data-id="${pr.id}" aria-label="Edit ${esc(pr.name)}">${icon('edit')}</button>
          <button class="icon-btn bad" type="button" data-action="delete-project" data-id="${pr.id}" aria-label="Delete ${esc(pr.name)}">${icon('trash')}</button>
        </div></div>
      <p class="muted-p">${esc(pr.desc) || 'No description yet.'}</p>
      <div class="progress" role="progressbar" aria-valuenow="${st.pct}" aria-valuemin="0" aria-valuemax="100" aria-label="${esc(pr.name)} progress"><i style="width:${st.pct}%"></i></div>
      <p class="pstat">${st.open} open, ${st.done} done</p>
    </article>`;
  }).join('')}</div>` : `<section class="panel">${emptyState('No projects yet', 'A project is a board that groups related tasks.', `<button class="btn primary" type="button" data-action="new-project">${icon('plus')}New project</button>`)}</section>`}`;
}

function vBoard(p) {
  const ts = state.tasks.filter(t => t.projectId === p.id);
  const st = projectStats(p.id);
  const kcard = t => `<article class="kcard" draggable="true" data-id="${t.id}" style="--c:${t.priority === 'high' ? 'var(--red)' : t.priority === 'med' ? 'var(--amber)' : 'var(--cyan)'}">
    <p class="k-title">${esc(t.title)}</p>
    ${t.notes ? `<p class="k-note">${esc(t.notes.split('\n')[0])}</p>` : ''} 
    <div class="task-meta">${t.due ? `<span class="chip ${isOverdue(t) ? 'late' : ''}">${esc(dueLabel(t.due))}</span>` : ''}<span class="chip pri-${t.priority}">${PRI[t.priority].label}</span></div>
    <div class="k-actions">
      <button class="icon-btn" type="button" data-action="move-task" data-id="${t.id}" data-dir="-1" aria-label="Move to previous column" ${t.status === 'todo' ? 'disabled' : ''}>${icon('left')}</button>
      <button class="icon-btn" type="button" data-action="move-task" data-id="${t.id}" data-dir="1" aria-label="Move to next column" ${t.status === 'done' ? 'disabled' : ''}>${icon('right')}</button>
      <button class="icon-btn" type="button" data-action="edit-task" data-id="${t.id}" aria-label="Edit task">${icon('edit')}</button>
      <button class="icon-btn bad" type="button" data-action="delete-task" data-id="${t.id}" aria-label="Delete task">${icon('trash')}</button>
    </div></article>`;
  const cols = STATUS.map(s => {
    const items = sortTasks(ts.filter(t => t.status === s), 'priority');
    return `<section class="col" data-status="${s}" aria-label="${STATUS_LABEL[s]}">
      <header class="col-head"><h2>${STATUS_LABEL[s]}</h2><span class="count">${items.length}</span></header>
      <div class="col-body">${items.map(kcard).join('') || '<p class="col-empty">Drop a task here</p>'}</div>
      ${s === 'todo' ? `<form class="col-add" data-form="board-task" data-project="${p.id}"><input name="title" required maxlength="140" placeholder="Add a task" aria-label="New task title" autocomplete="off"></form>` : ''}
    </section>`;
  }).join('');

  return `
  <a class="back" href="#/projects">${icon('left')}Projects</a>
  <div class="board-head">
    <div class="grow"><h1>${esc(p.name)}</h1><p class="sub">${esc(p.desc) || 'No description yet.'}</p></div>
    <div style="min-width:180px;--c:${safeColor(p.color)}"><p class="pstat" style="margin-bottom:6px">${st.pct}% complete, ${st.open} open</p><div class="progress"><i style="width:${st.pct}%"></i></div></div>
    <button class="btn ghost sm" type="button" data-action="edit-project" data-id="${p.id}">${icon('edit')}Edit</button>
    <button class="btn ghost sm" type="button" data-action="delete-project" data-id="${p.id}">${icon('trash')}Delete</button>
  </div>
  <div class="board">${cols}</div>`;
}

/* Routines */
function routineDaysPicker(sel) {
  return `<div class="day-picks" role="group" aria-label="Days">${weekOrder().map(d =>
    `<label class="pick"><input type="checkbox" name="day" value="${d}" ${sel.includes(d) ? 'checked' : ''}><span>${DAYNAMES[d]}</span></label>`).join('')}</div>`;
}
function vRoutines() {
  const t0 = todayStr();
  const strip = r => [6, 5, 4, 3, 2, 1, 0].map(i => {
    const d = addDays(new Date(), -i), key = ymd(d), due = routineDue(r, key), done = !!r.log[key];
    const label = d.toLocaleDateString(undefined, { weekday: 'short' });
    const inner = `<span>${label}</span><span class="mark">${icon('check')}</span>`;
    const cls = `cell ${!due ? 'off' : done ? 'done' : key < t0 ? 'missed' : ''} ${key === t0 ? 'today' : ''}`;
    return due
      ? `<button type="button" class="${cls}" data-action="routine-toggle" data-id="${r.id}" data-date="${key}" aria-pressed="${done}" aria-label="${esc(longDate(key))}: ${done ? 'done' : 'not done'}">${inner}</button>`
      : `<span class="${cls}" aria-hidden="true">${inner}</span>`;
  }).join('');

  return `
  <div class="page-head"><div><h1>Routines</h1><p class="sub">Recurring tasks that reset on their own schedule</p></div></div>
  <section class="panel" style="margin-bottom:18px">
    <form class="routine-form" data-form="routine">
      <div class="line">
        <label class="field"><span>Routine</span><input name="title" required maxlength="80" placeholder="Morning stretch" autocomplete="off"></label>
        <button class="btn primary" type="submit">${icon('plus')}Add routine</button>
      </div>
      <div class="field"><span>Repeats on</span>${routineDaysPicker([0, 1, 2, 3, 4, 5, 6])}</div>
    </form>
  </section>
  ${state.routines.length ? `<div class="cards" style="grid-template-columns:repeat(auto-fill,minmax(340px,1fr))">${state.routines.map(r => {
    const s = streakOf(r);
    return `<article class="panel routine">
      <div class="routine-top"><div class="grow"><h3>${esc(r.title)}</h3><span class="task-meta"><span class="chip">${esc(daysText(r.days))}</span>${s ? `<span class="chip streak">${icon('flame')}${s} ${s === 1 ? 'day' : 'days'}</span>` : ''}</span></div>
        <div class="row-actions">
          <button class="icon-btn" type="button" data-action="edit-routine" data-id="${r.id}" aria-label="Edit ${esc(r.title)}">${icon('edit')}</button>
          <button class="icon-btn bad" type="button" data-action="delete-routine" data-id="${r.id}" aria-label="Delete ${esc(r.title)}">${icon('trash')}</button>
        </div></div>
      <div class="strip">${strip(r)}</div></article>`;
  }).join('')}</div>` : `<section class="panel">${emptyState('No routines yet', 'Name a habit above and pick the days it repeats.')}</section>`}`;
}

/* Account */
function vAccount() {
  const p = state.profile || { name: '', handle: '', bio: '', color: PALETTE[0][1], createdAt: new Date().toISOString() };
  const s = state.settings, tab = ui.accountTab;
  const tabs = [['profile', 'Profile'], ['appearance', 'Appearance'], ['data', 'Data'], ['stats', 'Stats']];
  let body = '';

  if (tab === 'profile') {
    body = `<h2 class="sec-title">Profile</h2><p class="muted-p" style="margin-bottom:18px">Shown on this device only.</p>
    <form class="stack" data-form="profile">
      <label class="field"><span>Display name</span><input name="name" required maxlength="40" value="${esc(p.name)}" autocomplete="name"></label>
      <label class="field"><span>Handle</span><div class="prefixed"><i>@</i><input name="handle" maxlength="24" value="${esc(p.handle)}" pattern="[A-Za-z0-9_]*" autocomplete="off"></div></label>
      <label class="field"><span>Bio</span><textarea name="bio" rows="3" maxlength="160">${esc(p.bio)}</textarea></label>
      <fieldset class="field"><legend>Avatar color</legend>${swatches('color', p.color)}</fieldset>
      <div><button class="btn primary" type="submit">Save profile</button></div>
    </form>`;
  } else if (tab === 'appearance') {
    const sw = (key, label, hint) => `<label class="switch"><input type="checkbox" data-setting="${key}" ${s[key] ? 'checked' : ''}><span class="track"></span><span class="sw-text">${label}<small>${hint}</small></span></label>`;
    body = `<h2 class="sec-title">Appearance</h2><p class="muted-p" style="margin-bottom:18px">Changes apply immediately.</p>
    <div class="field" style="margin-bottom:12px"><span>Accent color</span>
      <div class="swatches">${ACCENTS.map(([k, n, hex]) => `<button type="button" class="sw ${s.accent === k ? 'on' : ''}" style="--c:${hex}" data-action="set-accent" data-id="${k}" aria-pressed="${s.accent === k}" aria-label="${n}"><span></span></button>`).join('')}</div></div>
    ${sw('scanlines', 'Scanlines', 'A faint CRT line texture over the whole screen')}
    ${sw('glow', 'Neon glow', 'Glowing headings and the progress ring')}
    ${sw('reduceMotion', 'Reduce motion', 'Turns off animations and transitions')}
    ${sw('time24', '24-hour clock', 'Off shows 12-hour time')}
    ${sw('sound', 'Timer sound', 'Play a beep when a countdown finishes')}
    <label class="field" style="margin-top:16px;max-width:260px"><span>Week starts on</span>
      <select data-setting="weekStart">${options([[1, 'Monday'], [0, 'Sunday'], [6, 'Saturday']], s.weekStart)}</select></label>`;
  } else if (tab === 'data') {
    const kb = (new Blob([JSON.stringify(state)]).size / 1024).toFixed(1);
    body = `<h2 class="sec-title">Your data</h2>
    <p class="muted-p" style="margin-bottom:16px">Everything is stored in this browser's localStorage (${kb} KB used of roughly 5 MB). Clearing site data or switching browsers removes it, so export a backup now and then.</p>
    <div class="btn-row">
      <button class="btn primary" type="button" data-action="export">${icon('download')}Export backup</button>
      <button class="btn ghost" type="button" data-action="import-pick">${icon('upload')}Import backup</button>
      <input type="file" id="import-file" accept="application/json,.json" hidden>
    </div>
    <div class="danger-zone"><h3>Danger zone</h3><p class="muted-p">Deletes your profile, tasks, projects, timers and routines from this browser.</p>
      <div><button class="btn danger" type="button" data-action="reset-all">${icon('trash')}Delete all data</button></div></div>`;
  } else {
    const done = state.tasks.filter(t => t.status === 'done').length;
    const tracked = state.timers.reduce((sum, t) => sum + elapsedOf(t), 0);
    const best = Math.max(0, ...state.routines.map(streakOf));
    const hrs = Math.floor(tracked / 3600000), mins = Math.floor(tracked / 60000) % 60;
    const stat = (n, l) => `<div class="stat"><b>${n}</b><span>${l}</span></div>`;
    body = `<h2 class="sec-title" style="margin-bottom:16px">Stats</h2><div class="stats">
      ${stat(done, 'Tasks completed')}${stat(state.tasks.length - done, 'Tasks open')}${stat(state.projects.length, 'Projects')}
      ${stat(state.routines.length, 'Routines')}${stat(best, 'Best current streak')}${stat(`${hrs}h ${pad(mins)}m`, 'Time tracked')}</div>`;
  }

  return `
  <div class="page-head"><div><h1>Account</h1><p class="sub">Your local profile, preferences and data</p></div></div>
  <div class="acct">
    <section class="panel hot id-card">
      ${avatar('lg')}
      <div><p class="id-name">${esc(p.name || 'Runner')}</p>${p.handle ? `<p class="id-handle">@${esc(p.handle)}</p>` : ''}</div>
      ${p.bio ? `<p class="id-bio">${esc(p.bio)}</p>` : ''}
      <p class="id-since">Member since ${esc(new Date(p.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }))}</p>
    </section>
    <section class="panel">
      <div class="tabs" role="tablist" aria-label="Account sections">${tabs.map(([k, l]) => `<button class="tab" type="button" role="tab" aria-selected="${tab === k}" data-action="account-tab" data-id="${k}">${l}</button>`).join('')}</div>
      <div role="tabpanel">${body}</div>
    </section>
  </div>`;
}

/* 404 */
function vNotFound() {
  const path = esc((location.hash || '#/').slice(0, 60));
  return `
  <section class="nf">
    <div class="panel hot nf-card">
      <p class="nf-err">ERR_ROUTE_NOT_FOUND</p>
      <h1 class="nf-code glow" data-text="404">404</h1>
      <h2 class="nf-title">Signal lost</h2>
      <p class="muted-p">There is nothing at this address. The page may have moved, or the project it pointed to was deleted.</p>
      <p class="nf-path"><span aria-hidden="true">&gt;</span> ${path}<i class="nf-cursor" aria-hidden="true"></i></p>
      <div class="btn-row">
        <a class="btn primary" href="#/dashboard">${icon('left')}Back to dashboard</a>
        <a class="btn ghost" href="#/tasks">Open tasks</a>
      </div>
    </div>
  </section>`;
}

/* Guide */
function vGuide() {
  const step = (n, title, text, href, label) => `<li class="g-step"><span class="g-n">${n}</span>
    <div><h3>${title}</h3><p class="muted-p">${text}</p><a class="btn ghost sm" href="${href}">${label}</a></div></li>`;
  const feat = (id, title, items, href, label) => `<section class="panel s4" aria-labelledby="g-${id}">
    <div class="panel-head"><h2 id="g-${id}">${title}</h2><a class="link" href="${href}">${label}</a></div>
    <ul class="g-list">${items.map(i => `<li>${i}</li>`).join('')}</ul></section>`;
  const faq = (q, a) => `<details><summary>${q}</summary><p>${a}</p></details>`;

  return `
  <div class="page-head"><div><h1>Guide</h1><p class="sub">Everything Neonboard does, on one screen</p></div></div>
  <div class="grid">
    <section class="panel hot s12" aria-labelledby="g-start">
      <div class="panel-head"><h2 id="g-start">Quick start</h2></div>
      <ol class="g-steps">
        ${step(1, 'Add a task', 'Type a title in the quick-add bar on the Tasks page, or press <kbd>N</kbd> anywhere.', '#/tasks', 'Open Tasks')}
        ${step(2, 'Start a timer', 'Set minutes for a countdown, or 0 for a stopwatch.', '#/timers', 'Open Timers')}
        ${step(3, 'Build a routine', 'Pick the days it repeats, then tick it off each day to grow a streak.', '#/routines', 'Open Routines')}
      </ol>
    </section>

    ${feat('dash', 'Dashboard', [
    'The ring shows how much of today\'s plan is done: tasks due today, overdue tasks, and anything you finished today.',
    'Timers, today\'s routines, project progress and a 7-day completion chart sit below it.'
  ], '#/dashboard', 'Open')}
    ${feat('tasks', 'Tasks', [
    'Quick-add takes a title, priority, due date and optional notes.',
    'Filter and sort the list, or search with <kbd>/</kbd>.',
    'The play button marks a task <b>In progress</b>. Deleting shows an <b>Undo</b>.',
    '<b>Clear completed</b> removes all finished tasks at once.'
  ], '#/tasks', 'Open')}
    ${feat('cal', 'Calendar', [
    'Tasks appear on their due date.',
    'Click a day to see its tasks or add a new one on that day.',
    'Change the first day of the week in Account, Appearance.'
  ], '#/calendar', 'Open')}
    ${feat('timers', 'Timers', [
    'Minutes above 0 make a countdown. 0 makes a stopwatch.',
    'Timers use the real clock, so they keep running through a page reload.',
    'Starting a timer linked to a task moves that task to In progress.',
    'A countdown beeps when it ends. You can turn the sound off in Account, Appearance.'
  ], '#/timers', 'Open')}
    ${feat('proj', 'Projects', [
    'Each project is a board with To do, In progress and Done columns.',
    'Drag cards between columns, or use the arrow buttons.',
    'Deleting a project keeps its tasks. They just become unassigned.'
  ], '#/projects', 'Open')}
    ${feat('rout', 'Routines', [
    'A routine repeats on the days you choose.',
    'Click any of the last 7 days to tick it or fix a mistake.',
    'A streak counts consecutive <b>scheduled</b> days. Days off are skipped, and today only breaks it once the day has passed.'
  ], '#/routines', 'Open')}

    <section class="panel s6" aria-labelledby="g-keys">
      <div class="panel-head"><h2 id="g-keys">Shortcuts</h2></div>
      <ul class="keys">
        <li><span>Focus the search box</span><kbd>/</kbd></li>
        <li><span>New task</span><kbd>N</kbd></li>
        <li><span>Close a dialog</span><kbd>Esc</kbd></li>
      </ul>
      <p class="muted-p" style="font-size:13px;margin-top:10px">Shortcuts are off while you are typing in a field or have a dialog open.</p>
    </section>

    <section class="panel s6" aria-labelledby="g-data">
      <div class="panel-head"><h2 id="g-data">Your data</h2></div>
      <p class="muted-p" style="margin-bottom:14px">Everything is stored in this browser only. There is no account and no server. Clearing site data, using a private window or switching browsers means your tasks will not be there, so export a backup now and then. Tabs of the same browser stay in sync.</p>
      <div class="btn-row">
        <button class="btn primary sm" type="button" data-action="export">${icon('download')}Export backup</button>
        <button class="btn ghost sm" type="button" data-action="open-data">Data settings</button>
      </div>
    </section>

    <section class="panel s12 faq" aria-labelledby="g-faq">
      <div class="panel-head"><h2 id="g-faq">FAQ</h2></div>
      ${faq('Why did my percentage change?', 'It is done tasks divided by planned tasks, where planned means due today, overdue, or finished today. Adding a task due today, or letting one pass its deadline, raises the total and lowers the percentage.')}
      ${faq('Why is my timer late in a background tab?', 'Browsers slow down hidden tabs. The timer itself stays accurate because it uses the real clock, but the beep and the tab title can lag by up to a minute.')}
      ${faq('Why did my streak reset?', 'A day the routine was scheduled passed without being ticked. Days it is not scheduled never count against you, and you can tick past days on the Routines page.')}
      ${faq('Where did my tasks go?', 'Most likely the browser data was cleared, or you are in a different browser or private window. If you exported a backup, restore it in Account, Data, Import backup.')}
      ${faq('Can I use it on two devices?', 'There is no automatic sync between devices. Export a backup on one and import it on the other. Importing replaces what is there.')}
    </section>
  </div>`;
}

/* Shell rendering */
const NAV = [['dashboard', 'Dashboard'], ['tasks', 'Tasks'], ['calendar', 'Calendar'], ['timers', 'Timers'], ['projects', 'Projects'], ['routines', 'Routines'], ['guide', 'Guide'], ['account', 'Account']];
const renderers = { dashboard: vDashboard, tasks: vTasks, calendar: vCalendar, timers: vTimers, projects: vProjects, routines: vRoutines, guide: vGuide, account: vAccount, notfound: vNotFound };

function renderNav() {
  const open = state.tasks.filter(t => t.status !== 'done').length;
  $('#nav').innerHTML = NAV.map(([k, l]) =>
    `<a href="#/${k}" class="${ui.navGlitch === k ? 'glitch' : ''}" ${ui.view === k ? 'aria-current="page"' : ''}>${icon(k)}<span>${l}</span>${k === 'tasks' && open ? `<em class="count">${open}</em>` : ''}</a>`).join('');
  ui.navGlitch = null;
}
function renderTop() {
  $('#avatar').innerHTML = avatar();
  tickClock();
}
function updateSaveBadge() {
  $('#save-badge').textContent = ui.savedAt ? `Saved ${timeStr(ui.savedAt)}` : 'Saved on this device';
}
function render() {
  renderNav();
  renderTop();
  const el = $('#view');
  el.dataset.view = ui.view;
  el.innerHTML = renderers[ui.view]();
  if (ui.refocus) {
    try { $(ui.refocus)?.focus({ preventScroll: true }); } catch (_) { /* ignore */ }
    ui.refocus = null;
  }
}

/* 5. Modals & toasts ------------------------------------------------------- */
function openModal({ title, body, submitLabel = 'Save', danger = false, onSubmit, locked = false, hideFooter = false }) {
  const dlg = $('#modal');
  dlg.dataset.locked = locked ? '1' : '';
  dlg.innerHTML = `<form method="dialog" class="modal-in panel hot" aria-labelledby="modal-title">
    <header class="modal-head"><h2 id="modal-title">${esc(title)}</h2>${locked ? '' : `<button type="button" class="icon-btn" data-close aria-label="Close">${icon('close')}</button>`}</header>
    <div class="modal-body">${body}</div>
    ${hideFooter ? '' : `<footer class="modal-foot"><button type="button" class="btn ghost" data-close>Cancel</button><button type="submit" class="btn ${danger ? 'danger' : 'primary'}">${esc(submitLabel)}</button></footer>`}
  </form>`;
  const form = $('form', dlg);
  form.addEventListener('submit', e => {
    e.preventDefault();
    const res = onSubmit ? onSubmit(new FormData(form)) : undefined;
    if (res !== false) dlg.close();
  });
  $$('[data-close]', dlg).forEach(b => b.addEventListener('click', () => dlg.close()));
  if (!dlg.open) dlg.showModal();
  ($('[autofocus]', form) || $('input, select, textarea', form))?.focus();
  return { dlg, form };
}

function confirmModal(title, text, label, onYes) {
  openModal({ title, body: `<p class="muted-p">${esc(text)}</p>`, submitLabel: label, danger: true, onSubmit() { onYes(); } });
}

function toast(msg, kind = 'info', action) {
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.innerHTML = `<span>${esc(msg)}</span>${action ? `<button type="button" class="link">${esc(action.label)}</button>` : ''}`;
  if (action) $('button', el).addEventListener('click', () => { action.fn(); el.remove(); });
  $('#toasts').append(el);
  setTimeout(() => el.remove(), action ? 6000 : 3200);
}

function taskModal(t = {}, preset = {}) {
  const isEdit = !!t.id;
  const v = {
    title: t.title || '', notes: t.notes || '', priority: t.priority || 'med',
    due: t.due ?? preset.due ?? '', projectId: t.projectId ?? preset.projectId ?? '', status: t.status || 'todo'
  };
  openModal({
    title: isEdit ? 'Edit task' : 'New task',
    submitLabel: isEdit ? 'Save changes' : 'Add task',
    body: `
      <label class="field"><span>Title</span><input name="title" required maxlength="140" value="${esc(v.title)}" autofocus autocomplete="off"></label>
      <label class="field"><span>Notes</span><textarea name="notes" rows="3" maxlength="1000">${esc(v.notes)}</textarea></label>
      <div class="row2">
        <label class="field"><span>Priority</span><select name="priority">${options(PRI_PAIRS, v.priority)}</select></label>
        <label class="field"><span>Due date</span><input type="date" name="due" value="${esc(v.due)}"></label>
      </div>
      <div class="row2">
        <label class="field"><span>Project</span><select name="projectId">${options([['', 'No project'], ...state.projects.map(p => [p.id, p.name])], v.projectId)}</select></label>
        ${isEdit ? `<label class="field"><span>Status</span><select name="status">${options(STATUS.map(s => [s, STATUS_LABEL[s]]), v.status)}</select></label>` : ''}
      </div>`,
    onSubmit(fd) {
      const title = String(fd.get('title')).trim();
      if (!title) return false;
      const data = { title, notes: fd.get('notes'), priority: fd.get('priority'), due: fd.get('due'), projectId: fd.get('projectId') };
      if (isEdit) {
        Object.assign(t, data, { notes: String(data.notes).trim() });
        const ns = fd.get('status');
        if (ns && ns !== t.status) { t.status = ns; t.doneAt = ns === 'done' ? new Date().toISOString() : null; }
        save(); toast('Task updated', 'good');
      } else {
        addTask(data); toast('Task added', 'good');
      }
      render();
    }
  });
}

function projectModal(p) {
  const isEdit = !!p;
  const v = p || { name: '', desc: '', color: PALETTE[0][1] };
  openModal({
    title: isEdit ? 'Edit project' : 'New project',
    submitLabel: isEdit ? 'Save changes' : 'Create project',
    body: `
      <label class="field"><span>Name</span><input name="name" required maxlength="60" value="${esc(v.name)}" autofocus autocomplete="off"></label>
      <label class="field"><span>Description</span><textarea name="desc" rows="2" maxlength="200">${esc(v.desc)}</textarea></label>
      <fieldset class="field"><legend>Color</legend>${swatches('color', v.color)}</fieldset>`,
    onSubmit(fd) {
      const name = String(fd.get('name')).trim();
      if (!name) return false;
      const data = { name, desc: String(fd.get('desc')).trim(), color: safeColor(fd.get('color')) };
      if (isEdit) Object.assign(p, data); else state.projects.push({ id: uid(), ...data });
      save(); render(); toast(isEdit ? 'Project updated' : 'Project created', 'good');
    }
  });
}

function routineModal(r) {
  openModal({
    title: 'Edit routine', submitLabel: 'Save changes',
    body: `<label class="field"><span>Routine</span><input name="title" required maxlength="80" value="${esc(r.title)}" autofocus autocomplete="off"></label>
      <div class="field"><span>Repeats on</span>${routineDaysPicker(r.days)}</div>`,
    onSubmit(fd) {
      const title = String(fd.get('title')).trim();
      const days = fd.getAll('day').map(Number);
      if (!title) return false;
      if (!days.length) { toast('Pick at least one day.', 'error'); return false; }
      r.title = title; r.days = days;
      save(); render(); toast('Routine updated', 'good');
    }
  });
}

function createProfile(name) {
  function createProfile(name) {
    state.profile = { name: name.trim().slice(0, 40) || 'Runner', handle: '', bio: '', color: PALETTE[0][1], createdAt: new Date().toISOString() };
    saveNow();
    toast('Welcome! New here? The guide takes a minute.', 'info', { label: 'Open guide', fn() { location.hash = '#/guide'; } });
  }
}
function welcome() {
  const { dlg, form } = openModal({
    title: 'Create your local profile', locked: true, hideFooter: true,
    body: `<p class="muted-p">Neonboard keeps everything in this browser. There is no server and no sign-up.</p>
      <label class="field"><span>What should we call you?</span><input name="name" required maxlength="40" autofocus autocomplete="given-name"></label>
      <div class="modal-actions"><button class="btn primary" type="submit">Start empty</button><button class="btn ghost" type="button" data-sample>Load sample data</button></div>`,
    onSubmit(fd) {
      const name = String(fd.get('name')).trim();
      if (!name) return false;
      createProfile(name); render();
    }
  });
  $('[data-sample]', form).addEventListener('click', () => {
    const name = form.elements.name.value.trim();
    if (!name) { form.reportValidity(); return; }
    createProfile(name); seedSample(); dlg.close(); render();
  });
}

/* Data import / export */
function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `neonboard-backup-${todayStr()}.json`;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast('Backup downloaded', 'good');
}
function importData(file) {
  if (!file) return;
  const fr = new FileReader();
  fr.onload = () => {
    let data;
    try {
      data = JSON.parse(fr.result);
      if (!data || !Array.isArray(data.tasks) || !Array.isArray(data.projects)) throw new Error('shape');
    } catch (e) { toast('That file is not a Neonboard backup.', 'error'); return; }
    confirmModal('Replace current data?', 'Importing replaces everything in this browser with the backup. Export first if you want to keep what is here.', 'Replace data', () => {
      state = normalize(data);
      saveNow(); applySettings(); route();
      toast('Backup imported', 'good');
    });
  };
  fr.readAsText(file);
}

/* 6. Actions & events ------------------------------------------------------ */
const actions = {
  'new-task'() { taskModal({}, { projectId: ui.view === 'projects' && ui.param ? ui.param : '' }); },
  'new-task-on'(date) { taskModal({}, { due: date }); },
  'toggle-task'(id) { const t = taskOf(id); if (t) setStatus(id, t.status === 'done' ? 'todo' : 'done'); },
  'start-task'(id) { const t = taskOf(id); if (t) setStatus(id, t.status === 'doing' ? 'todo' : 'doing'); },
  'edit-task'(id) { const t = taskOf(id); if (t) taskModal(t); },
  'delete-task'(id) {
    const i = state.tasks.findIndex(t => t.id === id);
    if (i < 0) return;
    const [removed] = state.tasks.splice(i, 1);
    save(); render();
    toast('Task deleted', 'info', { label: 'Undo', fn() { state.tasks.splice(Math.min(i, state.tasks.length), 0, removed); save(); render(); } });
  },
  'clear-completed'() {
    const removed = state.tasks.filter(t => t.status === 'done');
    if (!removed.length) return;
    state.tasks = state.tasks.filter(t => t.status !== 'done');
    save(); render();
    toast(`${removed.length} completed ${removed.length === 1 ? 'task' : 'tasks'} cleared`, 'info', { label: 'Undo', fn() { state.tasks.push(...removed); save(); render(); } });
  },
  'move-task'(id, el) {
    const t = taskOf(id), dir = Number(el.dataset.dir);
    if (!t) return;
    const next = STATUS[STATUS.indexOf(t.status) + dir];
    if (next) setStatus(id, next);
  },
  'clear-query'() { ui.query = ''; $('#search').value = ''; render(); },

  'cal-prev'() { ui.cal.m--; if (ui.cal.m < 0) { ui.cal.m = 11; ui.cal.y--; } render(); },
  'cal-next'() { ui.cal.m++; if (ui.cal.m > 11) { ui.cal.m = 0; ui.cal.y++; } render(); },
  'cal-today'() { const d = new Date(); ui.cal = { y: d.getFullYear(), m: d.getMonth(), sel: todayStr() }; render(); },
  'cal-select'(date) { const d = parseYmd(date); ui.cal = { y: d.getFullYear(), m: d.getMonth(), sel: date }; render(); },

  'timer-toggle'(id) {
    const t = timerOf(id);
    if (!t) return;
    if (t.startedAt) { t.elapsed = elapsedOf(t); t.startedAt = null; }
    else {
      t.startedAt = Date.now();
      const task = taskOf(t.taskId);
      if (task && task.status === 'todo') task.status = 'doing';
    }
    save(); render();
  },
  'timer-reset'(id) { const t = timerOf(id); if (!t) return; t.elapsed = 0; t.startedAt = null; ui.notified.delete(id); save(); render(); },
  'delete-timer'(id) {
    const i = state.timers.findIndex(t => t.id === id);
    if (i < 0) return;
    const [removed] = state.timers.splice(i, 1);
    save(); render();
    toast('Timer deleted', 'info', { label: 'Undo', fn() { state.timers.splice(Math.min(i, state.timers.length), 0, removed); save(); render(); } });
  },

  'new-project'() { projectModal(); },
  'edit-project'(id) { const p = projectOf(id); if (p) projectModal(p); },
  'delete-project'(id) {
    const p = projectOf(id);
    if (!p) return;
    confirmModal('Delete project?', `"${p.name}" will be removed. Its tasks are kept and become unassigned.`, 'Delete project', () => {
      state.projects = state.projects.filter(x => x.id !== id);
      state.tasks.forEach(t => { if (t.projectId === id) t.projectId = ''; });
      if (ui.filters.project === id) ui.filters.project = 'all';
      save();
      if (ui.view === 'projects' && ui.param) location.hash = '#/projects'; else render();
      toast('Project deleted');
    });
  },

  'routine-toggle'(id, el) {
    const r = routineOf(id), date = el.dataset.date;
    if (!r || !DATE_RE.test(date) || date > todayStr()) return;
    if (r.log[date]) delete r.log[date]; else r.log[date] = true;
    save(); render();
  },
  'edit-routine'(id) { const r = routineOf(id); if (r) routineModal(r); },
  'delete-routine'(id) {
    const r = routineOf(id);
    if (!r) return;
    confirmModal('Delete routine?', `"${r.title}" and its history will be removed.`, 'Delete routine', () => {
      state.routines = state.routines.filter(x => x.id !== id);
      save(); render(); toast('Routine deleted');
    });
  },

  'account-tab'(tab) { ui.accountTab = tab; render(); },
  'set-accent'(key) { state.settings.accent = key; applySettings(); save(); render(); },
  'export'() { exportData(); },
  'open-data'() { ui.accountTab = 'data'; location.hash = '#/account'; },
  'import-pick'() { $('#import-file').click(); },
  'reset-all'() {
    confirmModal('Delete all data?', 'This removes your profile, tasks, projects, timers and routines from this browser. It cannot be undone.', 'Delete everything', () => {
      try { localStorage.removeItem(STORE_KEY); } catch (_) { /* ignore */ }
      state = DEFAULTS(); ui.savedAt = null;
      applySettings(); location.hash = '#/dashboard'; route();
      setTimeout(welcome, 0);
    });
  }
};

const forms = {
  'quick-task'(fd, f) {
    const title = String(fd.get('title')).trim();
    if (!title) return;
    const projectId = !['all', 'none'].includes(ui.filters.project) ? ui.filters.project : '';
    addTask({ title, notes: fd.get('notes'), priority: fd.get('priority'), due: fd.get('due'), projectId });
    ui.refocus = '#quick-title';
    render();
  },
  'board-task'(fd, f) {
    const title = String(fd.get('title')).trim();
    if (!title) return;
    addTask({ title, projectId: f.dataset.project });
    ui.refocus = '.col-add input';
    render();
  },
  'timer'(fd) {
    const label = String(fd.get('label')).trim();
    if (!label) return;
    state.timers.push({ id: uid(), label, target: Math.max(0, Math.min(1440, Number(fd.get('target')) || 0)), taskId: fd.get('taskId') || '', elapsed: 0, startedAt: null });
    save(); render(); toast('Timer added', 'good');
  },
  'routine'(fd) {
    const title = String(fd.get('title')).trim();
    const days = fd.getAll('day').map(Number);
    if (!title) return;
    if (!days.length) { toast('Pick at least one day.', 'error'); return; }
    state.routines.push({ id: uid(), title, days, log: {} });
    save(); render(); toast('Routine added', 'good');
  },
  'profile'(fd) {
    const name = String(fd.get('name')).trim();
    if (!name) return;
    state.profile = {
      ...(state.profile || { createdAt: new Date().toISOString() }),
      name: name.slice(0, 40),
      handle: String(fd.get('handle')).toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 24),
      bio: String(fd.get('bio')).trim().slice(0, 160),
      color: safeColor(fd.get('color'))
    };
    saveNow(); render(); toast('Profile saved', 'good');
  }
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el || !actions[el.dataset.action]) return;
  const { action, id, date } = el.dataset;
  if (el.tagName === 'BUTTON' && !el.closest('dialog')) {
    ui.refocus = `[data-action="${action}"]${id ? `[data-id="${id}"]` : ''}${date ? `[data-date="${date}"]` : ''}`;
  }
  actions[action](id, el, e);
});

document.addEventListener('submit', e => {
  const f = e.target.closest('form[data-form]');
  if (!f || !forms[f.dataset.form]) return;
  e.preventDefault();
  forms[f.dataset.form](new FormData(f), f);
});

document.addEventListener('change', e => {
  const t = e.target;
  if (t.id === 'import-file') {
    importData(t.files[0]); t.value = ''; return;
  }
  if (t.dataset.filter) {
    ui.filters[t.dataset.filter] = t.value; ui.refocus = `[data-filter="${t.dataset.filter}"]`; render(); return;
  }
  if (t.dataset.setting) {
    const key = t.dataset.setting;
    state.settings[key] = t.type === 'checkbox' ? t.checked : Number(t.value);
    applySettings(); save();
    ui.refocus = `[data-setting="${key}"]`;
    render();
  }
});

$('#search').addEventListener('input', e => {
  ui.query = e.target.value;
  if (ui.view !== 'tasks') location.hash = '#/tasks'; else render();
});

document.addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || e.target.isContentEditable || $('#modal').open) return;
  if (e.key === '/') { e.preventDefault(); $('#search').focus(); }
  else if (e.key === 'n') { e.preventDefault(); actions['new-task'](); }
});

/* Modal behaviour: Esc and backdrop clicks close it, except the welcome step. */
$('#modal').addEventListener('cancel', e => { if ($('#modal').dataset.locked === '1') e.preventDefault(); });
$('#modal').addEventListener('click', e => { if (e.target === e.currentTarget && e.currentTarget.dataset.locked !== '1') e.currentTarget.close(); });

/* Kanban drag and drop (the move buttons remain for keyboard users). */
document.addEventListener('dragstart', e => {
  const c = e.target.closest('.kcard');
  if (!c) return;
  e.dataTransfer.setData('text/plain', c.dataset.id);
  e.dataTransfer.effectAllowed = 'move';
  c.classList.add('dragging');
});
document.addEventListener('dragend', () => $$('.dragging, .col.over').forEach(el => el.classList.remove('dragging', 'over')));
document.addEventListener('dragover', e => {
  const col = e.target.closest('.col');
  if (col) { e.preventDefault(); col.classList.add('over'); }
});
document.addEventListener('dragleave', e => {
  const col = e.target.closest('.col');
  if (col && !col.contains(e.relatedTarget)) col.classList.remove('over');
});
document.addEventListener('drop', e => {
  const col = e.target.closest('.col');
  if (!col) return;
  e.preventDefault();
  const id = e.dataTransfer.getData('text/plain');
  if (taskOf(id)) setStatus(id, col.dataset.status);
});

/* Glitch effect on nav links. The nav is rebuilt on each render, so we remember
   the clicked link and render() applies the class to the fresh element. */
$('#nav').addEventListener('click', e => {
  const a = e.target.closest('a');
  if (!a) return;
  ui.navGlitch = a.getAttribute('href').replace(/^#\//, '');
  if (a.getAttribute('aria-current') === 'page') {   // same page: no re-render will happen
    a.classList.remove('glitch');
    void a.offsetWidth;                                // restart the animation
    a.classList.add('glitch');
    a.addEventListener('animationend', () => a.classList.remove('glitch'), { once: true });
    ui.navGlitch = null;
  }
});

/* Routing uses the URL hash, so the browser's back and forward buttons work. */
const VIEWS = NAV.map(n => n[0]);   // real pages only, so #/notfound is itself a 404
function route() {
  const parts = (location.hash.replace(/^#\/?/, '') || 'dashboard').split('/');
  const view = VIEWS.includes(parts[0]) ? parts[0] : 'notfound';
  const changed = view !== ui.view || (parts[1] || null) !== ui.param;
  ui.view = view;
  ui.param = parts[1] ? parts[1].replace(/[^\w-]/g, '') : null;
  render();
  if (changed) {
    window.scrollTo(0, 0);
    $('#view').focus({ preventScroll: true });
    const h = $('#view h1');                 // page title glitches once per navigation
    if (h) {
      h.classList.add('glitch-once');
      h.addEventListener('animationend', () => h.classList.remove('glitch-once'), { once: true });
    }
  }
}
window.addEventListener('hashchange', route);

/* Clock and live timers (updates text in place, no re-render). */
function tickClock() {
  const now = new Date();
  $('#clock-time').textContent = timeStr(now);
  $('#clock-date').textContent = now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}
/* Timer alerts: a short beep, plus the running time in the tab title. */
let audioCtx = null;
function unlockAudio() {
  if (audioCtx && audioCtx.state === 'running') return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch (_) { /* audio unavailable */ }
}
['pointerdown', 'keydown'].forEach(ev => document.addEventListener(ev, unlockAudio));

function beep() {
  if (!state.settings.sound || !audioCtx || audioCtx.state !== 'running') return;
  const now = audioCtx.currentTime;
  [0, 0.25, 0.5].forEach(o => {
    const osc = audioCtx.createOscillator(), g = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.value = 880;
    g.gain.setValueAtTime(0.0001, now + o);
    g.gain.exponentialRampToValueAtTime(0.12, now + o + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + o + 0.18);
    osc.connect(g).connect(audioCtx.destination);
    osc.start(now + o);
    osc.stop(now + o + 0.2);
  });
}

const BASE_TITLE = document.title;
function updateTitle() {
  const running = state.timers.filter(t => t.startedAt);
  if (!running.length) { document.title = BASE_TITLE; return; }
  const left = t => t.target * 60000 - elapsedOf(t);
  const pick = running.filter(t => t.target && left(t) >= 0).sort((a, b) => left(a) - left(b))[0] || running[0];
  const d = timerDisplay(pick);
  const more = running.length > 1 ? ` (+${running.length - 1})` : '';
  document.title = `${d.over ? '⏰ ' : ''}${d.text} ${pick.label}${more} · ${BASE_TITLE}`;
}
function tick() {
  tickClock();
  if (todayStr() !== ui.day) { ui.day = todayStr(); render(); return; }
  if (ui.stale && !typingInView()) { ui.stale = false; render(); return; }
  state.timers.forEach(t => {
    const d = timerDisplay(t);
    $$(`[data-timer="${t.id}"]`).forEach(el => { el.textContent = d.text; el.classList.toggle('over', d.over); });
    $$(`[data-timer-bar="${t.id}"]`).forEach(el => { el.style.width = d.pct + '%'; });
    if (t.target && t.startedAt && d.over && !ui.notified.has(t.id)) {
      ui.notified.add(t.id);
      toast(`Timer finished: ${t.label}`, 'good');
      beep();
    }
  });
  updateTitle();
}

/* Sync between tabs: when another tab saves, adopt its data. */
function typingInView() {
  const a = document.activeElement;
  return !!a && $('#view').contains(a) && /INPUT|TEXTAREA/.test(a.tagName) && !!a.value;
}
function syncFromStorage(raw) {
  let next;
  try { next = raw ? normalize(JSON.parse(raw)) : DEFAULTS(); } catch (_) { return; }
  clearTimeout(saveTimer);                 // drop any pending save of the old state
  const dlg = $('#modal');
  if (dlg.open) dlg.close();               // an open form would edit objects that no longer exist
  state = next;
  applySettings();
  if (typingInView()) ui.stale = true;     // don't wipe text the user is typing
  else render();
  if (!state.profile) welcome();           // the other tab deleted all data
}
window.addEventListener('storage', e => {
  if (e.key !== null && e.key !== STORE_KEY) return;
  syncFromStorage(e.key === null ? null : e.newValue);
});

/* 7. Boot ------------------------------------------------------------------ */
applySettings();
state.timers.forEach(t => { if (t.target && t.startedAt && timerDisplay(t).over) ui.notified.add(t.id); });
route();
if (!state.profile) welcome();
setInterval(tick, 1000);
window.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saveNow(); });
window.addEventListener('pagehide', saveNow);
