/* ═══════════════════════════════════════════════════════════════
   Dashboard – script.js
   Greeting · Theme Toggle · Focus Timer · To-Do List · Quick Links
   All persistent data stored in LocalStorage.
═══════════════════════════════════════════════════════════════ */

/* ── tiny helpers ─────────────────────────────────────────────── */
const $ = id => document.getElementById(id);
const DAYS   = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni',
                'Juli','Agustus','September','Oktober','November','Desember'];
const pad = n => String(n).padStart(2, '0');

/* ═══════════════════════════════════════════════════════════════
   1. THEME TOGGLE  (Light / Dark)
═══════════════════════════════════════════════════════════════ */
(function initTheme() {
  const html       = document.documentElement;
  const toggleBtn  = $('themeToggle');
  const iconEl     = $('themeIcon');

  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    iconEl.textContent = theme === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('dash_theme', theme);
  }

  // load saved or prefer system default
  const saved = localStorage.getItem('dash_theme');
  const preferred = saved ||
    (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  applyTheme(preferred);

  toggleBtn.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });
})();


/* ═══════════════════════════════════════════════════════════════
   2. GREETING  – clock, date, time-based greeting, custom name
═══════════════════════════════════════════════════════════════ */
(function initGreeting() {
  const clockEl   = $('clock');
  const dateEl    = $('dateDisplay');
  const greetEl   = $('greetingText');
  const nameEl    = $('greetingName');
  const editBtn   = $('editNameBtn');
  const overlay   = $('nameOverlay');
  const nameInput = $('nameInput');
  const saveBtn   = $('saveNameBtn');
  const cancelBtn = $('cancelNameBtn');

  function greeting(h) {
    if (h <  5) return 'Selamat Malam 🌙';
    if (h < 11) return 'Selamat Pagi ☀️';
    if (h < 15) return 'Selamat Siang 🌤️';
    if (h < 18) return 'Selamat Sore 🌇';
    return 'Selamat Malam 🌙';
  }

  function getName() {
    return localStorage.getItem('dash_name') || 'Pengguna';
  }

  function tick() {
    const now = new Date();
    const h = now.getHours();
    clockEl.textContent =
      `${pad(h)}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    dateEl.textContent =
      `${DAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
    greetEl.textContent = greeting(h);
    nameEl.textContent  = `Halo, ${getName()} 👋`;
  }

  tick();
  setInterval(tick, 1000);

  /* modal */
  editBtn.addEventListener('click', () => {
    nameInput.value = getName();
    overlay.hidden = false;
    nameInput.focus();
    nameInput.select();
  });
  function closeModal() { overlay.hidden = true; }
  cancelBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

  saveBtn.addEventListener('click', () => {
    const val = nameInput.value.trim();
    if (val) localStorage.setItem('dash_name', val);
    closeModal();
    tick();
  });
  nameInput.addEventListener('keydown', e => {
    if (e.key === 'Enter')  saveBtn.click();
    if (e.key === 'Escape') closeModal();
  });
})();


/* ═══════════════════════════════════════════════════════════════
   3. FOCUS TIMER  – presets + custom duration
═══════════════════════════════════════════════════════════════ */
(function initTimer() {
  const displayEl    = $('timerDisplay');
  const subEl        = $('timerSub');
  const startBtn     = $('timerStartBtn');
  const resetBtn     = $('timerResetBtn');
  const ringFill     = $('ringFill');
  const presetBtns   = document.querySelectorAll('.preset');
  const customInput  = $('customMinInput');
  const customSetBtn = $('customMinBtn');

  const CIRCUMFERENCE = 2 * Math.PI * 52; // r = 52
  ringFill.style.strokeDasharray = CIRCUMFERENCE;

  let totalSeconds  = 25 * 60;
  let remainSeconds = totalSeconds;
  let intervalId    = null;
  let running       = false;

  /* ── ring render ── */
  function renderRing() {
    const m = Math.floor(remainSeconds / 60);
    const s = remainSeconds % 60;
    displayEl.textContent = `${pad(m)}:${pad(s)}`;

    const progress = totalSeconds > 0 ? remainSeconds / totalSeconds : 0;
    ringFill.style.strokeDashoffset = CIRCUMFERENCE * (1 - progress);

    if (progress <= 0.25)      ringFill.style.stroke = 'var(--danger)';
    else if (progress <= 0.5)  ringFill.style.stroke = 'var(--warn)';
    else                       ringFill.style.stroke = 'var(--primary)';
  }

  /* ── set duration ── */
  function setDuration(minutes) {
    clearInterval(intervalId);
    running = false;
    totalSeconds  = Math.max(1, minutes) * 60;
    remainSeconds = totalSeconds;
    startBtn.textContent = '▶ Mulai';
    subEl.textContent    = 'Fokus';
    renderRing();
  }

  /* ── start / stop ── */
  function start() {
    if (remainSeconds === 0) return;
    running = true;
    startBtn.textContent = '⏸ Berhenti';
    subEl.textContent    = 'Berjalan…';
    intervalId = setInterval(() => {
      remainSeconds--;
      renderRing();
      if (remainSeconds <= 0) {
        clearInterval(intervalId);
        running = false;
        startBtn.textContent = '▶ Mulai';
        subEl.textContent    = 'Selesai! 🎉';
        try { new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg').play(); }
        catch (_) {}
      }
    }, 1000);
  }

  function stop() {
    clearInterval(intervalId);
    running = false;
    startBtn.textContent = '▶ Lanjut';
    subEl.textContent    = 'Dijeda';
  }

  /* ── events ── */
  startBtn.addEventListener('click', () => running ? stop() : start());

  resetBtn.addEventListener('click', () => {
    clearInterval(intervalId);
    remainSeconds = totalSeconds;
    running = false;
    startBtn.textContent = '▶ Mulai';
    subEl.textContent    = 'Fokus';
    renderRing();
  });

  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      presetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      customInput.value = '';
      setDuration(parseInt(btn.dataset.min));
    });
  });

  /* ── custom duration ── */
  function applyCustom() {
    const val = parseInt(customInput.value);
    if (!val || val < 1 || val > 180) {
      customInput.focus();
      customInput.style.borderColor = 'var(--danger)';
      setTimeout(() => { customInput.style.borderColor = ''; }, 1200);
      return;
    }
    presetBtns.forEach(b => b.classList.remove('active'));
    setDuration(val);
  }

  customSetBtn.addEventListener('click', applyCustom);
  customInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); applyCustom(); }
  });

  renderRing();
})();


/* ═══════════════════════════════════════════════════════════════
   4. TO-DO LIST  – add / edit / done / delete / sort / no duplicates
═══════════════════════════════════════════════════════════════ */
(function initTodo() {
  const form       = $('todoForm');
  const input      = $('todoInput');
  const listEl     = $('todoList');
  const emptyEl    = $('todoEmpty');
  const footerEl   = $('todoFooter');
  const infoEl     = $('todoInfo');
  const clearBtn   = $('clearDoneBtn');
  const dupWarn    = $('dupWarn');
  const filterBtns = document.querySelectorAll('.filter');
  const sortSelect = $('sortSelect');

  let tasks  = load();
  let filter = 'all';
  let sort   = 'newest';

  /* ── storage ── */
  function load() {
    try { return JSON.parse(localStorage.getItem('dash_tasks')) || []; }
    catch { return []; }
  }
  function save() {
    localStorage.setItem('dash_tasks', JSON.stringify(tasks));
  }

  /* ── sort ── */
  function sortedVisible() {
    let list = tasks.filter(t => {
      if (filter === 'active') return !t.done;
      if (filter === 'done')   return  t.done;
      return true;
    });

    switch (sort) {
      case 'oldest': list = [...list].reverse();                         break;
      case 'az':     list = [...list].sort((a,b) => a.text.localeCompare(b.text)); break;
      case 'za':     list = [...list].sort((a,b) => b.text.localeCompare(a.text)); break;
      case 'active': list = [...list].sort((a,b) => a.done - b.done);   break;
      case 'done':   list = [...list].sort((a,b) => b.done - a.done);   break;
      // 'newest' keeps insertion order (unshift = newest first)
    }
    return list;
  }

  /* ── render ── */
  function render() {
    listEl.innerHTML = '';
    const visible    = sortedVisible();
    const doneCount  = tasks.filter(t => t.done).length;
    const activeCount = tasks.length - doneCount;

    emptyEl.style.display  = visible.length === 0 ? 'block' : 'none';
    footerEl.hidden        = tasks.length === 0;
    if (!footerEl.hidden)
      infoEl.textContent   = `${activeCount} aktif · ${doneCount} selesai`;

    visible.forEach(task => {
      const li = document.createElement('li');
      li.className  = `todo-item${task.done ? ' done' : ''}`;
      li.dataset.id = task.id;

      /* checkbox */
      const cb = document.createElement('input');
      cb.type      = 'checkbox';
      cb.className = 'todo-check';
      cb.checked   = task.done;
      cb.setAttribute('aria-label', 'Tandai selesai');
      cb.addEventListener('change', () => toggleDone(task.id));

      /* text */
      const span = document.createElement('span');
      span.className   = 'todo-text';
      span.textContent = task.text;
      span.setAttribute('role', 'textbox');
      span.setAttribute('aria-label', 'Teks tugas');
      span.addEventListener('dblclick', () => startEdit(span, task.id));

      /* actions */
      const actions = document.createElement('div');
      actions.className = 'todo-actions';

      const editBtn = document.createElement('button');
      editBtn.className   = 'icon-btn edit';
      editBtn.textContent = '✏️';
      editBtn.setAttribute('aria-label', 'Edit tugas');
      editBtn.addEventListener('click', () => startEdit(span, task.id));

      const delBtn = document.createElement('button');
      delBtn.className   = 'icon-btn delete';
      delBtn.textContent = '🗑️';
      delBtn.setAttribute('aria-label', 'Hapus tugas');
      delBtn.addEventListener('click', () => removeTask(task.id, li));

      actions.append(editBtn, delBtn);
      li.append(cb, span, actions);
      listEl.appendChild(li);
    });
  }

  /* ── inline edit ── */
  function startEdit(span, id) {
    span.contentEditable = 'true';
    span.focus();
    // cursor to end
    const range = document.createRange();
    range.selectNodeContents(span);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    function commit() {
      span.contentEditable = 'false';
      const newText = span.textContent.trim();
      if (!newText) { render(); return; }

      // check duplicate (excluding self)
      const isDup = tasks.some(
        t => t.id !== id && t.text.toLowerCase() === newText.toLowerCase()
      );
      if (isDup) {
        const orig = tasks.find(t => t.id === id);
        if (orig) span.textContent = orig.text;
        showDupWarn();
      } else {
        const t = tasks.find(t => t.id === id);
        if (t) { t.text = newText; save(); }
      }
      render();
    }

    span.addEventListener('blur', commit, { once: true });
    span.addEventListener('keydown', e => {
      if (e.key === 'Enter')  { e.preventDefault(); span.blur(); }
      if (e.key === 'Escape') {
        const t = tasks.find(t => t.id === id);
        if (t) span.textContent = t.text;
        span.removeEventListener('blur', commit);
        span.contentEditable = 'false';
      }
    });
  }

  function toggleDone(id) {
    const t = tasks.find(t => t.id === id);
    if (t) { t.done = !t.done; save(); render(); }
  }

  function removeTask(id, li) {
    li.classList.add('removing');
    li.addEventListener('transitionend', () => {
      tasks = tasks.filter(t => t.id !== id);
      save(); render();
    }, { once: true });
  }

  /* ── duplicate warning ── */
  let dupTimer;
  function showDupWarn() {
    dupWarn.hidden = false;
    clearTimeout(dupTimer);
    dupTimer = setTimeout(() => { dupWarn.hidden = true; }, 3000);
  }

  /* ── add task ── */
  form.addEventListener('submit', e => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    // duplicate check (case-insensitive)
    const isDup = tasks.some(
      t => t.text.toLowerCase() === text.toLowerCase()
    );
    if (isDup) {
      showDupWarn();
      input.select();
      return;
    }

    dupWarn.hidden = true;
    tasks.unshift({ id: Date.now(), text, done: false });
    save(); render();
    input.value = '';
    input.focus();
  });

  /* hide warning when user types again */
  input.addEventListener('input', () => { dupWarn.hidden = true; });

  /* ── clear done ── */
  clearBtn.addEventListener('click', () => {
    tasks = tasks.filter(t => !t.done);
    save(); render();
  });

  /* ── filters ── */
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filter = btn.dataset.f;
      render();
    });
  });

  /* ── sort ── */
  sortSelect.addEventListener('change', () => {
    sort = sortSelect.value;
    render();
  });

  render();
})();


/* ═══════════════════════════════════════════════════════════════
   5. QUICK LINKS  – add / delete / LocalStorage
═══════════════════════════════════════════════════════════════ */
(function initLinks() {
  const form      = $('linkForm');
  const nameInput = $('linkNameInput');
  const urlInput  = $('linkUrlInput');
  const grid      = $('linksGrid');
  const emptyEl   = $('linksEmpty');

  let links = load();

  function load() {
    try { return JSON.parse(localStorage.getItem('dash_links')) || []; }
    catch { return []; }
  }
  function save() {
    localStorage.setItem('dash_links', JSON.stringify(links));
  }

  function faviconUrl(url) {
    try {
      const { origin } = new URL(url);
      return `https://www.google.com/s2/favicons?domain=${origin}&sz=32`;
    } catch { return ''; }
  }

  function render() {
    grid.innerHTML = '';
    emptyEl.style.display = links.length === 0 ? 'block' : 'none';

    links.forEach(link => {
      const chip = document.createElement('a');
      chip.className = 'link-chip';
      chip.href      = link.url;
      chip.target    = '_blank';
      chip.rel       = 'noopener noreferrer';
      chip.setAttribute('aria-label', link.name);

      const fav = document.createElement('img');
      fav.className = 'link-chip__favicon';
      fav.src       = faviconUrl(link.url);
      fav.alt       = '';
      fav.onerror   = () => { fav.style.display = 'none'; };

      const nameSpan = document.createElement('span');
      nameSpan.className   = 'link-chip__name';
      nameSpan.textContent = link.name;

      const delBtn = document.createElement('button');
      delBtn.className   = 'link-chip__del';
      delBtn.textContent = '✕';
      delBtn.setAttribute('aria-label', `Hapus ${link.name}`);
      delBtn.addEventListener('click', e => {
        e.preventDefault(); e.stopPropagation();
        links = links.filter(l => l.id !== link.id);
        save(); render();
      });

      chip.append(fav, nameSpan, delBtn);
      grid.appendChild(chip);
    });
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    let url = urlInput.value.trim();
    const name = nameInput.value.trim();
    if (!name || !url) return;

    // auto-add https:// if missing
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

    links.push({ id: Date.now(), name, url });
    save(); render();
    nameInput.value = '';
    urlInput.value  = '';
    nameInput.focus();
  });

  render();
})();
