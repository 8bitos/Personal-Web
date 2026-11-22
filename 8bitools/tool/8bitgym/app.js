(() => {
  'use strict';

  const STORAGE_KEY = 'ironlog_state_v1';
  const CATALOG = window.IRONLOG_CATALOG || {
    MUSCLE_GROUPS: ['Chest', 'Lats', 'Upper Back', 'Lower Back', 'Traps', 'Shoulders', 'Biceps', 'Triceps', 'Forearms', 'Quadriceps', 'Hamstrings', 'Glutes', 'Calves', 'Adductors', 'Abductors', 'Abdominals', 'Cardio', 'Full Body'],
    EQUIPMENT_LIST: ['Barbell', 'Dumbbell', 'Cable', 'Machine', 'Smith Machine', 'EZ Bar', 'Kettlebell', 'Trap Bar', 'Bodyweight', 'Resistance Band', 'Cardio Machine', 'Other'],
    EXERCISE_TYPES: [
      { id: 'weight_reps', label: 'Beban & Reps (kg × reps)' },
      { id: 'weighted_bodyweight', label: 'Weighted Bodyweight (+kg × reps)' },
      { id: 'assisted_bodyweight', label: 'Assisted Bodyweight (-kg × reps)' },
      { id: 'reps_only', label: 'Bodyweight (Reps saja)' },
      { id: 'duration', label: 'Durasi (Detik)' },
      { id: 'distance_duration', label: 'Jarak & Durasi (km & menit)' }
    ],
    EXERCISES: []
  };

  const MUSCLE_GROUPS = CATALOG.MUSCLE_GROUPS;
  const EQUIPMENT_LIST = CATALOG.EQUIPMENT_LIST;
  const EXERCISE_TYPES = CATALOG.EXERCISE_TYPES;
  const DEFAULT_EXERCISES = CATALOG.EXERCISES;

  const DEFAULT_FOLDERS = [
    { id: 'fld-ppl', name: 'Push Pull Legs', collapsed: false },
    { id: 'fld-ul', name: 'Upper / Lower', collapsed: false }
  ];

  const DEFAULT_ROUTINES = [
    {
      id: 'rt-push',
      folderId: 'fld-ppl',
      name: 'Push Day (Chest, Shoulders, Triceps)',
      exercises: [
        { exerciseId: 'ex-bench', targetSets: 4, targetReps: '6-8' },
        { exerciseId: 'ex-incline-db', targetSets: 3, targetReps: '8-10' },
        { exerciseId: 'ex-ohp', targetSets: 3, targetReps: '8-10' },
        { exerciseId: 'ex-lat-raise', targetSets: 3, targetReps: '12-15' },
        { exerciseId: 'ex-tricep-push', targetSets: 3, targetReps: '10-12' }
      ]
    },
    {
      id: 'rt-pull',
      folderId: 'fld-ppl',
      name: 'Pull Day (Lats, Upper Back, Biceps)',
      exercises: [
        { exerciseId: 'ex-bb-row', targetSets: 4, targetReps: '6-8' },
        { exerciseId: 'ex-lat-pulldown', targetSets: 3, targetReps: '8-12' },
        { exerciseId: 'ex-face-pull', targetSets: 3, targetReps: '12-15' },
        { exerciseId: 'ex-ez-curl', targetSets: 3, targetReps: '10-12' }
      ]
    },
    {
      id: 'rt-legs',
      folderId: 'fld-ppl',
      name: 'Leg Day (Quads, Hamstrings, Calves)',
      exercises: [
        { exerciseId: 'ex-squat', targetSets: 4, targetReps: '6-8' },
        { exerciseId: 'ex-rdl', targetSets: 3, targetReps: '8-10' },
        { exerciseId: 'ex-leg-press', targetSets: 3, targetReps: '10-12' },
        { exerciseId: 'ex-leg-curl', targetSets: 3, targetReps: '12-15' },
        { exerciseId: 'ex-standing-calf', targetSets: 3, targetReps: '12-15' }
      ]
    },
    {
      id: 'rt-upper',
      folderId: 'fld-ul',
      name: 'Upper Body Strength',
      exercises: [
        { exerciseId: 'ex-incline-bb-bench', targetSets: 4, targetReps: '6-8' },
        { exerciseId: 'ex-seated-cable-row', targetSets: 4, targetReps: '8-10' },
        { exerciseId: 'ex-db-shoulder-press', targetSets: 3, targetReps: '8-10' },
        { exerciseId: 'ex-hammer-curl', targetSets: 3, targetReps: '10-12' },
        { exerciseId: 'ex-overhead-cable-ext', targetSets: 3, targetReps: '10-12' }
      ]
    }
  ];

  const SET_TYPES = ['normal', 'warmup', 'dropset', 'failure'];
  const SUPERSET_LABELS = ['A', 'B', 'C', 'D'];
  const FREE_DB_JSON_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
  const FREE_DB_IMG_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';
  const FREE_DB_CACHE = 'ironlog-freedb-v1';
  const FALLBACK_THUMB = "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="10" fill="#0f172a"/><g fill="#38bdf8"><rect x="10" y="24" width="6" height="16" rx="2"/><rect x="17" y="19" width="7" height="26" rx="2"/><rect x="24" y="29" width="16" height="6" rx="2"/><rect x="40" y="19" width="7" height="26" rx="2"/><rect x="48" y="24" width="6" height="16" rx="2"/></g></svg>');

  let state = loadState();
  let workoutTicker = null;
  let restInterval = null;
  let demoInterval = null;
  let restRemaining = 0;
  let deferredInstallPrompt = null;
  let selectedExerciseForChart = null;
  let chartMetric = '1rm'; // '1rm' | 'weight' | 'volume'
  let calendarCursor = new Date();
  let selectedCalendarDateKey = null;
  let freeDbList = [];
  let freeDbById = new Map();
  let freeDbPromise = null;
  let freeDbFailedAt = 0;
  let threeLoadPromise = null;

  function loadScriptOnce(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = resolve;
      s.onerror = () => reject(new Error(`Gagal memuat ${src}`));
      document.head.appendChild(s);
    });
  }

  function ensure3DLoaded() {
    if (window.IRONLOG_3D) return Promise.resolve(window.IRONLOG_3D);
    if (threeLoadPromise) return threeLoadPromise;
    threeLoadPromise = (async () => {
      if (!window.THREE) await loadScriptOnce('./three.min.js');
      if (!window.IRONLOG_3D) await loadScriptOnce('./exercise-3d.js');
      return window.IRONLOG_3D;
    })().catch((err) => {
      console.warn('3D engine gagal dimuat:', err);
      threeLoadPromise = null;
      return null;
    });
    return threeLoadPromise;
  }

  // --- Catalog Merge & Persistence ---
  function mergeBuiltInExercises(existingList) {
    const byId = new Map();
    const builtInMap = new Map(DEFAULT_EXERCISES.map((e) => [e.id, e]));

    for (const ex of existingList) {
      const ref = builtInMap.get(ex.id);
      if (ref) {
        byId.set(ex.id, { ...ex, ...ref });
      } else {
        byId.set(ex.id, { secondary: [], type: 'weight_reps', ...ex });
      }
    }
    for (const ref of DEFAULT_EXERCISES) {
      if (!byId.has(ref.id)) {
        byId.set(ref.id, { ...ref });
      }
    }
    return Array.from(byId.values());
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const exercises = Array.isArray(parsed.exercises) && parsed.exercises.length
          ? mergeBuiltInExercises(parsed.exercises)
          : [...DEFAULT_EXERCISES];
        return {
          settings: {
            lang: 'id',
            theme: 'dark',
            unit: 'kg',
            defaultRestSec: 90,
            dumbbellPerHand: false,
            googleClientId: '',
            googleEmail: '',
            lastSyncAt: null,
            ...(parsed.settings || {})
          },
          exercises,
          folders: Array.isArray(parsed.folders) ? parsed.folders : [...DEFAULT_FOLDERS],
          routines: Array.isArray(parsed.routines) ? parsed.routines : [...DEFAULT_ROUTINES],
          workouts: Array.isArray(parsed.workouts) ? parsed.workouts : [],
          pinnedNotes: parsed.pinnedNotes && typeof parsed.pinnedNotes === 'object' ? parsed.pinnedNotes : {},
          exerciseRestTimers: parsed.exerciseRestTimers && typeof parsed.exerciseRestTimers === 'object' ? parsed.exerciseRestTimers : {},
          measurements: Array.isArray(parsed.measurements) ? parsed.measurements : [],
          activeWorkout: parsed.activeWorkout || null
        };
      }
    } catch (err) {
      console.warn('Gagal memuat state, menggunakan default:', err);
    }
    return {
      settings: { lang: 'id', theme: 'dark', unit: 'kg', defaultRestSec: 90, dumbbellPerHand: false, googleClientId: '', googleEmail: '', lastSyncAt: null },
      exercises: [...DEFAULT_EXERCISES],
      folders: [...DEFAULT_FOLDERS],
      routines: [...DEFAULT_ROUTINES],
      workouts: [],
      pinnedNotes: {},
      exerciseRestTimers: {},
      measurements: [],
      activeWorkout: null
    };
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  // --- Localization ---
  const I18N = window.IRONLOG_I18N;
  function curLang() {
    return state.settings.lang === 'en' ? 'en' : 'id';
  }
  function localeTag() {
    return curLang() === 'en' ? 'en-US' : 'id-ID';
  }
  function t(key, vars = {}) {
    return I18N ? I18N.t(curLang(), key, vars) : key;
  }
  function tMuscle(m) {
    return I18N ? I18N.tMuscle(m, curLang()) : m;
  }
  function tEquip(eq) {
    return I18N ? I18N.tEquip(eq, curLang()) : eq;
  }
  function tExType(typeId) {
    return I18N ? I18N.tExType(typeId, curLang()) : typeId;
  }

  const FLAG_ICONS = {
    id: '<svg viewBox="0 0 20 14" width="20" height="14" style="border-radius:3px;display:block;border:1px solid rgba(128,128,128,0.28)" aria-hidden="true"><rect width="20" height="7" fill="#ef4444"/><rect y="7" width="20" height="7" fill="#ffffff"/></svg>',
    en: '<svg viewBox="0 0 20 14" width="20" height="14" style="border-radius:3px;display:block;border:1px solid rgba(128,128,128,0.28)" aria-hidden="true"><rect width="20" height="14" fill="#ffffff"/><rect y="0" width="20" height="2" fill="#dc2626"/><rect y="4" width="20" height="2" fill="#dc2626"/><rect y="8" width="20" height="2" fill="#dc2626"/><rect y="12" width="20" height="2" fill="#dc2626"/><rect width="9" height="8" fill="#1d4ed8"/><circle cx="2.5" cy="2.5" r="0.8" fill="#fff"/><circle cx="6.5" cy="2.5" r="0.8" fill="#fff"/><circle cx="4.5" cy="4" r="0.8" fill="#fff"/><circle cx="2.5" cy="5.5" r="0.8" fill="#fff"/><circle cx="6.5" cy="5.5" r="0.8" fill="#fff"/></svg>'
  };

  function applyStaticTranslations() {
    const l = curLang();
    document.documentElement.lang = l;
    const langBtn = document.getElementById('langToggleBtn');
    if (langBtn) {
      langBtn.innerHTML = FLAG_ICONS[l] || FLAG_ICONS.id;
      langBtn.title = l === 'en' ? 'English (EN)' : 'Bahasa Indonesia (ID)';
    }

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      el.placeholder = t(el.dataset.i18nPlaceholder);
    });
    document.querySelectorAll('[data-i18n-title]').forEach((el) => {
      el.title = t(el.dataset.i18nTitle);
    });
    document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
      el.setAttribute('aria-label', t(el.dataset.i18nAria));
    });
    populateExerciseFilters();
  }

  function setLanguage(newLang) {
    state.settings.lang = newLang === 'en' ? 'en' : 'id';
    saveState();
    applyStaticTranslations();
    renderAll();
    if (state.activeWorkout) renderActiveWorkout();
  }

  function curTheme() {
    return state.settings.theme === 'light' ? 'light' : 'dark';
  }

  function applyTheme() {
    const theme = curTheme();
    document.documentElement.dataset.theme = theme;
    const meta = document.getElementById('themeColorMeta');
    if (meta) meta.content = theme === 'light' ? '#f2f2f7' : '#000000';
    const btn = document.getElementById('themeToggleBtn');
    const icon = document.getElementById('themeToggleIcon');
    if (icon) {
      icon.textContent = theme === 'light' ? 'light_mode' : 'dark_mode';
    }
    if (btn) {
      btn.title = t('themeTooltip');
    }
    if (window.IRONLOG_3D && typeof window.IRONLOG_3D.setTheme === 'function') {
      window.IRONLOG_3D.setTheme(theme);
    }
  }

  function setTheme(newTheme) {
    state.settings.theme = newTheme === 'light' ? 'light' : 'dark';
    saveState();
    applyTheme();
  }

  // --- Utilities ---
  function gIcon(name, cls = '') {
    return `<span class="material-symbols-rounded g-icon ${cls}" aria-hidden="true">${name}</span>`;
  }

  function uid(prefix = 'id') {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function esc(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDuration(totalSec) {
    const sec = Math.max(0, Math.floor(totalSec));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  }

  function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString(localeTag(), { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }

  function dateDayKey(dateInput) {
    const d = new Date(dateInput);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }

  function calc1RM(weight, reps) {
    const w = Number(weight) || 0;
    const r = Number(reps) || 0;
    if (w <= 0 || r <= 0) return 0;
    return r === 1 ? w : w * (1 + r / 30);
  }

  function getExerciseById(id) {
    return state.exercises.find((e) => e.id === id) || {
      id,
      name: t('deletedExercise'),
      muscle: 'Other',
      secondary: [],
      equipment: '',
      type: 'weight_reps'
    };
  }

  function getExerciseTypeLabel(typeId) {
    return tExType(typeId || 'weight_reps');
  }

  function calcSetVolume(exMeta, setObj) {
    const type = exMeta.type || 'weight_reps';
    if (type === 'duration' || type === 'distance_duration' || type === 'reps_only') return 0;
    const w = Number(setObj.weight) || 0;
    const r = Number(setObj.reps) || 0;
    const mult = (state.settings.dumbbellPerHand && exMeta.equipment === 'Dumbbell') ? 2 : 1;
    return w * r * mult;
  }

  function formatSetSummary(exMeta, s) {
    const type = exMeta.type || 'weight_reps';
    const unit = state.settings.unit;
    if (type === 'reps_only') return `${s.reps || 0} reps`;
    if (type === 'duration') return `${s.durationSec || s.reps || 0} ${t('unitSec')}`;
    if (type === 'distance_duration') return `${s.distance || 0} km • ${s.durationMin || 0} ${t('unitMin')}`;
    const prefix = type === 'weighted_bodyweight' ? '+' : type === 'assisted_bodyweight' ? '-' : '';
    return `${prefix}${s.weight || 0} ${unit} × ${s.reps || 0}`;
  }

  function getPreviousSet(exerciseId, setIndex) {
    const exMeta = getExerciseById(exerciseId);
    const type = exMeta.type || 'weight_reps';
    for (const w of state.workouts) {
      const ex = w.exercises.find((e) => e.exerciseId === exerciseId);
      if (ex && ex.sets[setIndex] && ex.sets[setIndex].completed) {
        const s = ex.sets[setIndex];
        if (type === 'reps_only') return `${s.reps || 0} reps`;
        if (type === 'duration') return `${s.durationSec || 0}s`;
        if (type === 'distance_duration') return `${s.distance || 0}km/${s.durationMin || 0}m`;
        const prefix = type === 'weighted_bodyweight' ? '+' : type === 'assisted_bodyweight' ? '-' : '';
        return `${prefix}${s.weight || 0} × ${s.reps || 0}`;
      }
    }
    return '—';
  }

  function getExerciseImages(exMeta) {
    if (Array.isArray(exMeta.images) && exMeta.images.length) {
      return exMeta.images.map((p) => (p.startsWith('http') ? p : `${FREE_DB_IMG_BASE}${p}`));
    }
    if (exMeta.freeDbId) {
      return [`${FREE_DB_IMG_BASE}${exMeta.freeDbId}/0.jpg`, `${FREE_DB_IMG_BASE}${exMeta.freeDbId}/1.jpg`];
    }
    return [];
  }

  function mapFreeDbMuscle(m) {
    const map = {
      chest: 'Chest',
      lats: 'Lats',
      'middle back': 'Upper Back',
      'lower back': 'Lower Back',
      traps: 'Traps',
      shoulders: 'Shoulders',
      neck: 'Traps',
      biceps: 'Biceps',
      triceps: 'Triceps',
      forearms: 'Forearms',
      quadriceps: 'Quadriceps',
      hamstrings: 'Hamstrings',
      glutes: 'Glutes',
      calves: 'Calves',
      adductors: 'Adductors',
      abductors: 'Abductors',
      abdominals: 'Abdominals'
    };
    return map[(m || '').toLowerCase()] || 'Full Body';
  }

  function mapFreeDbEquipment(eq) {
    const map = {
      barbell: 'Barbell',
      dumbbell: 'Dumbbell',
      cable: 'Cable',
      machine: 'Machine',
      'e-z curl bar': 'EZ Bar',
      kettlebells: 'Kettlebell',
      'body only': 'Bodyweight',
      bands: 'Resistance Band',
      none: 'Bodyweight'
    };
    return map[(eq || '').toLowerCase()] || 'Other';
  }

  async function ensureFreeDbLoaded() {
    if (freeDbList.length) return freeDbList;
    if (freeDbPromise) return freeDbPromise;

    freeDbPromise = (async () => {
      try {
        let data = null;
        if ('caches' in window) {
          const cache = await caches.open(FREE_DB_CACHE);
          const cached = await cache.match(FREE_DB_JSON_URL);
          if (cached) {
            data = await cached.json();
          } else {
            const res = await fetch(FREE_DB_JSON_URL);
            if (res.ok) {
              await cache.put(FREE_DB_JSON_URL, res.clone());
              data = await res.json();
            }
          }
        } else {
          const res = await fetch(FREE_DB_JSON_URL);
          if (res.ok) data = await res.json();
        }
        if (Array.isArray(data)) {
          freeDbList = data;
          freeDbById = new Map(data.map((item) => [item.id, item]));
        }
      } catch (err) {
        console.warn('Free Exercise DB tidak dapat dimuat (offline/network):', err);
      }
      if (!freeDbList.length) {
        freeDbFailedAt = Date.now();
        freeDbPromise = null;
      }
      return freeDbList;
    })();

    return freeDbPromise;
  }

  function convertFreeDbItem(item) {
    const primary = item.category === 'cardio'
      ? 'Cardio'
      : mapFreeDbMuscle((item.primaryMuscles && item.primaryMuscles[0]) || 'full_body');
    const secondary = (item.secondaryMuscles || []).map(mapFreeDbMuscle).filter((m) => m !== primary);
    const equip = mapFreeDbEquipment(item.equipment);
    const type = item.category === 'cardio'
      ? 'distance_duration'
      : equip === 'Bodyweight' ? 'reps_only' : 'weight_reps';

    return {
      id: `fdb-${item.id}`,
      freeDbId: item.id,
      name: item.name,
      muscle: primary,
      secondary: Array.from(new Set(secondary)),
      equipment: equip,
      type,
      images: item.images || []
    };
  }

  function searchFreeDbExtras(query, muscle, equip, limit = 30) {
    if (!query || query.length < 2 || !freeDbList.length) return [];

    const existingFreeIds = new Set(state.exercises.map((e) => e.freeDbId).filter(Boolean));
    const existingNames = new Set(state.exercises.map((e) => e.name.toLowerCase()));
    const matches = [];

    for (const item of freeDbList) {
      if (existingFreeIds.has(item.id) || existingNames.has((item.name || '').toLowerCase())) continue;
      const ex = convertFreeDbItem(item);
      const secText = (ex.secondary || []).join(' ').toLowerCase();
      const matchQuery =
        ex.name.toLowerCase().includes(query) ||
        ex.equipment.toLowerCase().includes(query) ||
        ex.muscle.toLowerCase().includes(query) ||
        secText.includes(query);
      if (!matchQuery) continue;

      const matchMuscle = muscle === 'all' || ex.muscle === muscle || (ex.secondary || []).includes(muscle);
      const matchEquip = equip === 'all' || ex.equipment === equip;
      if (!matchMuscle || !matchEquip) continue;

      matches.push(ex);
      if (matches.length >= limit) break;
    }

    return matches;
  }

  function ensureExerciseInState(exObj) {
    const exists = state.exercises.some(
      (e) => e.id === exObj.id || (exObj.freeDbId && e.freeDbId === exObj.freeDbId)
    );
    if (!exists) {
      state.exercises.push(exObj);
      saveState();
      renderHeaderStats();
    }
    return exObj.id;
  }

  function playRestBeep() {
    try {
      if (navigator.vibrate) navigator.vibrate([180, 80, 180]);
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (_) {}
  }

  // --- Firebase Google Auth & Cloud Firestore Sync ---
  function getCloudApi() {
    return window.EIGHTBIT_CLOUD || null;
  }

  function getCloudUser() {
    const api = getCloudApi();
    return api ? api.getUser() : null;
  }

  function setSyncUI(status, text, visible = true) {
    const btn = document.getElementById('syncStatusBtn');
    const dot = document.getElementById('syncDot');
    const label = document.getElementById('syncLabel');
    if (!dot || !label) return;
    if (btn) btn.classList.toggle('hidden', !visible);
    dot.className = `sync-dot ${status}`;
    label.textContent = text;
  }

  function refreshSyncStatusUI() {
    const user = getCloudUser();
    if (user) {
      const shortName = user.displayName || (user.email ? user.email.split('@')[0] : '') || t('syncSynced');
      setSyncUI('online', shortName, true);
    } else {
      setSyncUI('offline', '', false);
    }
  }

  async function pushToDrive(silent = false) {
    const api = getCloudApi();
    if (!api || !api.getUser()) return;
    setSyncUI('syncing', t('syncSaving'), true);
    try {
      const payload = {
        updatedAt: new Date().toISOString(),
        settings: {
          lang: curLang(),
          theme: curTheme(),
          unit: state.settings.unit,
          defaultRestSec: state.settings.defaultRestSec,
          dumbbellPerHand: Boolean(state.settings.dumbbellPerHand)
        },
        exercises: state.exercises,
        folders: state.folders,
        routines: state.routines,
        workouts: state.workouts,
        pinnedNotes: state.pinnedNotes,
        exerciseRestTimers: state.exerciseRestTimers,
        measurements: state.measurements
      };
      await api.saveBackup(payload);
      state.settings.lastSyncAt = new Date().toISOString();
      saveState();
      refreshSyncStatusUI();
      if (!silent) await uiAlert(t('alertDriveSaved'));
    } catch (err) {
      refreshSyncStatusUI();
      if (!silent) await uiAlert(t('alertDriveSaveErr', { msg: err.message }));
    }
  }

  async function pullFromDrive(silent = false) {
    const api = getCloudApi();
    if (!api || !api.getUser()) return;
    setSyncUI('syncing', t('syncPulling'), true);
    try {
      const remote = await api.loadBackup();
      if (!remote) {
        if (!silent) await uiAlert(t('alertDriveEmpty'));
        refreshSyncStatusUI();
        return;
      }
      if (Array.isArray(remote.exercises) && Array.isArray(remote.workouts)) {
        state.exercises = mergeBuiltInExercises(remote.exercises);
        state.folders = Array.isArray(remote.folders) ? remote.folders : state.folders;
        state.routines = Array.isArray(remote.routines) ? remote.routines : state.routines;
        state.workouts = remote.workouts;
        state.pinnedNotes = remote.pinnedNotes || state.pinnedNotes;
        state.exerciseRestTimers = remote.exerciseRestTimers || state.exerciseRestTimers;
        state.measurements = Array.isArray(remote.measurements) ? remote.measurements : state.measurements;
        if (remote.settings) {
          if (remote.settings.lang) state.settings.lang = remote.settings.lang;
          if (remote.settings.theme) state.settings.theme = remote.settings.theme;
          state.settings.unit = remote.settings.unit || state.settings.unit;
          state.settings.defaultRestSec = remote.settings.defaultRestSec || state.settings.defaultRestSec;
          state.settings.dumbbellPerHand = Boolean(remote.settings.dumbbellPerHand);
        }
        state.settings.lastSyncAt = new Date().toISOString();
        saveState();
        applyTheme();
        applyStaticTranslations();
        renderAll();
        refreshSyncStatusUI();
        if (!silent) await uiAlert(t('alertDrivePulled'));
      }
    } catch (err) {
      refreshSyncStatusUI();
      if (!silent) await uiAlert(t('alertDrivePullErr', { msg: err.message }));
    }
  }

  async function connectGoogleAccount(afterConnectAction = 'sync') {
    const api = getCloudApi();
    if (!api) {
      await uiAlert(t('alertGisNotReady'));
      return;
    }
    if (!api.isConfigured()) {
      await uiAlert(t('alertNeedClientId'));
      return;
    }
    setSyncUI('syncing', t('syncConnecting'), true);
    try {
      const user = await api.signInWithGoogle();
      if (!user) return; // redirect fallback
      state.settings.googleEmail = user.email || '';
      saveState();
      if (afterConnectAction === 'pull') await pullFromDrive(false);
      else await pushToDrive(false);
      if (!document.getElementById('modalBackdrop').classList.contains('hidden')) openSettingsModal();
    } catch (err) {
      refreshSyncStatusUI();
      if (err && err.code !== 'auth/popup-closed-by-user') {
        await uiAlert(t('alertGoogleLoginErr', { err: err.message || err.code }));
      }
    }
  }

  async function disconnectGoogleAccount() {
    const api = getCloudApi();
    if (api) await api.signOutUser();
    state.settings.googleEmail = '';
    state.settings.lastSyncAt = null;
    saveState();
    refreshSyncStatusUI();
  }

  // --- Navigation & Header ---
  function initNavigation() {
    document.querySelectorAll('.nav-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        document.querySelectorAll('.nav-item').forEach((b) => b.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`tab-${tab}`).classList.add('active');
        if (tab === 'history') renderHistory();
        if (tab === 'exercises') renderExercisesTab();
        if (tab === 'body') renderBodyTab();
      });
    });
  }

  function renderHeaderStats() {
    const el = document.getElementById('headerStats');
    if (!el) return;
    const total = state.workouts.length;
    el.textContent = total > 0
      ? t('headerSubCount', { wkCount: total, exCount: state.exercises.length })
      : t('headerSubEmpty', { exCount: state.exercises.length });
  }

  function renderDashboardBento() {
    const kpiEl = document.getElementById('dashboardKpiGrid');
    const weeklyEl = document.getElementById('weeklyVolumeCard');
    const streakEl = document.getElementById('heroStreakBadge');
    const heroDescEl = document.getElementById('heroDesc');
    const streak = calculateWeeklyStreak();
    if (streakEl) {
      streakEl.classList.toggle('hidden', streak <= 0);
      if (streak > 0) {
        streakEl.innerHTML = `${gIcon('local_fire_department', 'g-icon-sm')}<span>${esc(t('heroStreak', { n: streak }))}</span>`;
      }
    }
    if (heroDescEl) {
      heroDescEl.textContent = state.workouts.length > 0
        ? t('heroLastSession', { name: state.workouts[0].name, date: formatDate(state.workouts[0].date) })
        : t('heroNoSession');
    }

    const dateEl = document.getElementById('summaryDateLabel');
    if (dateEl) {
      dateEl.textContent = new Date().toLocaleDateString(localeTag(), {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      }).toUpperCase();
    }

    const ringsEl = document.getElementById('activityRingsBody');
    const focusEl = document.getElementById('muscleFocusCard');
    let weekSets = 0;
    let weekMin = 0;
    let lastWeekVol = 0;
    const now = new Date();
    const startOfWeek = new Date(now);
    const dowOffset = (now.getDay() + 6) % 7; // Mon = 0 .. Sun = 6
    startOfWeek.setDate(now.getDate() - dowOffset);
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setDate(startOfWeek.getDate() - 7);

    const dayVols = [0, 0, 0, 0, 0, 0, 0];
    const daySets = [0, 0, 0, 0, 0, 0, 0];
    const dayDurs = [0, 0, 0, 0, 0, 0, 0];
    const dayPrs = [0, 0, 0, 0, 0, 0, 0];
    const muscleCounts = {};
    let totalMuscleUnits = 0;
    let weekWorkouts = 0;
    let weekVol = 0;
    let totalVol = 0;
    let totalSets = 0;
    let totalDurSec = 0;
    let totalPrs = 0;
    let latestPrName = '';

    for (const w of state.workouts) {
      const vol = w.totalVolume || 0;
      totalVol += vol;
      totalSets += w.totalSets || 0;
      totalDurSec += w.durationSec || 0;
      if (w.prs && w.prs.length) {
        totalPrs += w.prs.length;
        if (!latestPrName) latestPrName = w.prs[0].exerciseName || '';
      }
      for (const ex of (w.exercises || [])) {
        const meta = getExerciseById(ex.exerciseId);
        const working = (ex.sets || []).filter((s) => (s.type || 'normal') !== 'warmup').length;
        if (working > 0) {
          muscleCounts[meta.muscle] = (muscleCounts[meta.muscle] || 0) + working;
          totalMuscleUnits += working;
        }
      }
      const d = new Date(w.date);
      if (d >= startOfWeek) {
        weekWorkouts++;
        weekVol += vol;
        weekSets += w.totalSets || 0;
        weekMin += Math.round((w.durationSec || 0) / 60);
        const idx = (d.getDay() + 6) % 7;
        dayVols[idx] += vol;
        daySets[idx] += w.totalSets || 0;
        dayDurs[idx] += Math.round((w.durationSec || 0) / 60);
        dayPrs[idx] += (w.prs ? w.prs.length : 0);
      } else if (d >= startOfLastWeek && d < startOfWeek) {
        lastWeekVol += vol;
      }
    }

    const unit = state.settings.unit;
    const fmtVol = (v) => {
      if (v >= 1000) return `${(v / 1000).toFixed(1)}k ${unit}`;
      return `${Math.round(v).toLocaleString(localeTag())} ${unit}`;
    };
    const avgMin = state.workouts.length ? Math.round((totalDurSec / state.workouts.length) / 60) : 0;

    if (ringsEl) {
      const pMove = Math.min(1, Math.max(weekVol > 0 ? 0.08 : 0.03, weekVol / 5000));
      const pEx = Math.min(1, Math.max(weekMin > 0 ? 0.08 : 0.03, weekMin / 150));
      const pStand = Math.min(1, Math.max(weekSets > 0 ? 0.08 : 0.03, weekSets / 45));
      const ringSvg = (r, pct, color) => {
        const c = 2 * Math.PI * r;
        const dash = `${(c * pct).toFixed(1)} ${c.toFixed(1)}`;
        return `
          <circle cx="64" cy="64" r="${r}" fill="none" stroke="${color}" stroke-opacity="0.2" stroke-width="11" />
          <circle cx="64" cy="64" r="${r}" fill="none" stroke="${color}" stroke-width="11" stroke-linecap="round"
            stroke-dasharray="${dash}" transform="rotate(-90 64 64)" />
        `;
      };
      ringsEl.innerHTML = `
        <div class="af-rings-stats">
          <div>
            <span class="af-ring-stat-label">${esc(t('ringMoveLabel'))}</span>
            <span class="af-ring-stat-val move tabular">${esc(fmtVol(weekVol))}</span>
          </div>
          <div>
            <span class="af-ring-stat-label">${esc(t('ringExLabel'))}</span>
            <span class="af-ring-stat-val exercise tabular">${weekMin}m</span>
          </div>
          <div>
            <span class="af-ring-stat-label">${esc(t('ringStandLabel'))}</span>
            <span class="af-ring-stat-val stand tabular">${weekSets}</span>
          </div>
        </div>
        <svg viewBox="0 0 128 128" width="122" height="122" style="flex-shrink:0" aria-hidden="true">
          ${ringSvg(52, pMove, 'var(--ring-move)')}
          ${ringSvg(38, pEx, 'var(--ring-exercise)')}
          ${ringSvg(24, pStand, 'var(--ring-stand)')}
        </svg>
      `;
    }

    const buildMiniSpikeSvg = (vals, colorVar) => {
      const W = 136;
      const H = 40;
      const max = Math.max(...vals, 1);
      const dayLbls = t('dowShortList').split(',');
      const step = W / vals.length;
      const gridLines = [0, 2, 4, 6].map((i) => {
        const gx = (i * step + step * 0.5).toFixed(1);
        return `<line x1="${gx}" y1="2" x2="${gx}" y2="27" stroke="var(--border)" stroke-width="1" stroke-dasharray="2 2" />`;
      }).join('');
      const bars = vals.map((v, i) => {
        const bh = v > 0 ? Math.max(5, Math.round((v / max) * 23)) : 3;
        const bx = (i * step + step * 0.5 - 2.5).toFixed(1);
        const by = (27 - bh).toFixed(1);
        const op = v > 0 ? '1' : '0.28';
        return `
          <rect x="${bx}" y="${by}" width="5" height="${bh}" rx="2.5" fill="${colorVar}" fill-opacity="${op}" />
          <text x="${(i * step + step * 0.5).toFixed(1)}" y="38" text-anchor="middle" fill="var(--muted)" font-size="8" font-weight="600">${esc(dayLbls[i] || '')}</text>
        `;
      }).join('');
      return `<svg class="af-mini-chart" viewBox="0 0 ${W} ${H}" aria-hidden="true">${gridLines}${bars}</svg>`;
    };

    if (kpiEl) {
      kpiEl.innerHTML = `
        <div class="bento-kpi-card" data-kpi-detail="workouts">
          <div class="af-kpi-top"><span class="bento-kpi-label">${esc(t('kpiWorkouts'))}</span><span class="af-chevron">›</span></div>
          <span class="bento-kpi-val purple tabular">${state.workouts.length}</span>
          <span class="bento-kpi-sub" style="color:var(--muted)">${esc(t('kpiWorkoutsSub', { n: weekWorkouts }))}</span>
          ${buildMiniSpikeSvg(daySets, 'var(--ring-purple)')}
        </div>
        <div class="bento-kpi-card" data-kpi-detail="volume">
          <div class="af-kpi-top"><span class="bento-kpi-label">${esc(t('kpiTotalVol'))}</span><span class="af-chevron">›</span></div>
          <span class="bento-kpi-val stand tabular">${esc(fmtVol(totalVol))}</span>
          <span class="bento-kpi-sub" style="color:var(--muted)">${esc(t('kpiTotalVolSub', { vol: fmtVol(weekVol) }))}</span>
          ${buildMiniSpikeSvg(dayVols, 'var(--ring-stand)')}
        </div>
        <div class="bento-kpi-card" data-kpi-detail="prs">
          <div class="af-kpi-top"><span class="bento-kpi-label">${esc(t('kpiPrs'))}</span><span class="af-chevron">›</span></div>
          <span class="bento-kpi-val move tabular">${totalPrs}</span>
          <span class="bento-kpi-sub" style="color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(latestPrName || t('kpiPrsSubEmpty'))}</span>
          ${buildMiniSpikeSvg(dayPrs, 'var(--ring-move)')}
        </div>
        <div class="bento-kpi-card" data-kpi-detail="duration">
          <div class="af-kpi-top"><span class="bento-kpi-label">${esc(t('kpiAvgDur'))}</span><span class="af-chevron">›</span></div>
          <span class="bento-kpi-val exercise tabular">${avgMin}m</span>
          <span class="bento-kpi-sub" style="color:var(--muted)">${esc(t('kpiAvgDurSub', { sets: totalSets }))}</span>
          ${buildMiniSpikeSvg(dayDurs, 'var(--ring-exercise)')}
        </div>
      `;
      kpiEl.querySelectorAll('[data-kpi-detail]').forEach((card) => {
        card.addEventListener('click', () => openKpiDetailModal(card.dataset.kpiDetail));
      });
    }

  function openKpiDetailModal(metric) {
    const isEn = curLang() === 'en';
    const unit = state.settings.unit;
    const workouts = state.workouts || [];

    const buildWeeklyTrend = (valueFn) => {
      const weeks = [];
      const curMon = new Date();
      curMon.setHours(0, 0, 0, 0);
      curMon.setDate(curMon.getDate() - ((curMon.getDay() + 6) % 7));
      for (let i = 7; i >= 0; i--) {
        const ws = new Date(curMon);
        ws.setDate(curMon.getDate() - i * 7);
        const key = getWeekKey(ws);
        const label = `${ws.getDate()}/${ws.getMonth() + 1}`;
        const list = workouts.filter((w) => getWeekKey(w.date) === key);
        weeks.push({ label, val: valueFn(list), isCur: i === 0 });
      }
      return weeks;
    };

    const renderBarChartSvg = (weeks, colorVar, fmtVal) => {
      const W = 320, H = 128, padB = 22, padT = 18;
      const plotH = H - padB - padT;
      const maxV = Math.max(...weeks.map((w) => w.val), 1);
      const colW = W / weeks.length;
      const bars = weeks.map((w, i) => {
        const cx = i * colW + colW / 2;
        const bh = w.val > 0 ? Math.max(8, Math.round((w.val / maxV) * plotH)) : 4;
        const by = padT + plotH - bh;
        const fill = w.val > 0 ? colorVar : 'var(--bar-muted)';
        const op = w.isCur ? 1 : (w.val > 0 ? 0.72 : 0.45);
        return `
          <rect x="${(cx - 10).toFixed(1)}" y="${by.toFixed(1)}" width="20" height="${bh}" rx="6" fill="${fill}" opacity="${op}" />
          ${w.val > 0 ? `<text x="${cx.toFixed(1)}" y="${(by - 4).toFixed(1)}" text-anchor="middle" font-size="9" font-weight="700" fill="var(--text)">${esc(fmtVal(w.val))}</text>` : ''}
          <text x="${cx.toFixed(1)}" y="${H - 5}" text-anchor="middle" font-size="9" font-weight="${w.isCur ? '700' : '500'}" fill="${w.isCur ? 'var(--text)' : 'var(--muted)'}">${esc(w.label)}</text>
        `;
      }).join('');
      return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block">${bars}</svg>`;
    };

    let title = '';
    let bodyHtml = '';

    if (metric === 'workouts') {
      title = t('kpiWorkouts');
      const weeks = buildWeeklyTrend((list) => list.length);
      const totalSets = workouts.reduce((s, w) => s + (w.totalSets || 0), 0);
      const streak = calculateWeeklyStreak();
      const recent = workouts.slice(0, 5).map((w) => `
        <div class="list-card" style="padding:10px 12px;cursor:pointer" data-kd-wk="${esc(w.id)}">
          <div class="list-card-top">
            <strong style="font-size:0.9rem">${esc(w.name)}</strong>
            <span class="muted" style="font-size:0.78rem">${formatDate(w.date)}</span>
          </div>
          <div class="muted" style="font-size:0.78rem">${w.totalSets || 0} set • ${Math.round(w.totalVolume || 0)} ${esc(unit)} • ${formatDuration(w.durationSec || 0)}</div>
        </div>
      `).join('');
      bodyHtml = `
        <div class="summary-grid">
          <div class="stat-box"><span class="stat-value tabular" style="color:var(--ring-purple)">${workouts.length}</span><span class="stat-label">${isEn ? 'Total' : 'Total Sesi'}</span></div>
          <div class="stat-box"><span class="stat-value tabular">${streak}w</span><span class="stat-label">Streak</span></div>
          <div class="stat-box"><span class="stat-value tabular">${totalSets}</span><span class="stat-label">${isEn ? 'Sets' : 'Total Set'}</span></div>
        </div>
        <div class="card" style="padding:12px">
          <div class="muted" style="font-size:0.76rem;margin-bottom:6px">${isEn ? 'Workouts per Week (Last 8 Weeks)' : 'Sesi per Minggu (8 Minggu Terakhir)'}</div>
          ${renderBarChartSvg(weeks, 'var(--ring-purple)', (v) => String(v))}
        </div>
        <div class="stack-list">${recent || `<div class="empty-state">${esc(t('historyEmptyAll'))}</div>`}</div>
      `;
    } else if (metric === 'volume') {
      title = t('kpiTotalVol');
      const totalVol = workouts.reduce((s, w) => s + (w.totalVolume || 0), 0);
      const avgVol = workouts.length ? Math.round(totalVol / workouts.length) : 0;
      const bestVol = workouts.reduce((m, w) => Math.max(m, w.totalVolume || 0), 0);
      const weeks = buildWeeklyTrend((list) => Math.round(list.reduce((s, w) => s + (w.totalVolume || 0), 0)));
      const exVol = new Map();
      workouts.forEach((w) => w.exercises.forEach((ex) => {
        const meta = getExerciseById(ex.exerciseId);
        const v = ex.sets.reduce((s, st) => s + calcSetVolume(meta, st), 0);
        exVol.set(meta.name, (exVol.get(meta.name) || 0) + v);
      }));
      const topEx = [...exVol.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
      const topMax = topEx[0]?.[1] || 1;
      const topHtml = topEx.map(([name, val]) => `
        <div style="margin-bottom:8px">
          <div style="display:flex;justify-content:space-between;font-size:0.82rem;margin-bottom:3px">
            <strong>${esc(name)}</strong>
            <span class="muted tabular">${Math.round(val).toLocaleString(localeTag())} ${esc(unit)}</span>
          </div>
          <div style="height:6px;border-radius:999px;background:var(--bar-muted);overflow:hidden">
            <div style="height:100%;width:${Math.max(8, Math.round((val / topMax) * 100))}%;background:var(--ring-stand);border-radius:999px"></div>
          </div>
        </div>
      `).join('');
      bodyHtml = `
        <div class="summary-grid">
          <div class="stat-box"><span class="stat-value tabular" style="color:var(--ring-stand)">${Math.round(totalVol).toLocaleString(localeTag())}</span><span class="stat-label">${esc(unit)} Total</span></div>
          <div class="stat-box"><span class="stat-value tabular">${avgVol.toLocaleString(localeTag())}</span><span class="stat-label">${isEn ? 'Avg/Session' : 'Rata-rata'}</span></div>
          <div class="stat-box"><span class="stat-value tabular">${Math.round(bestVol).toLocaleString(localeTag())}</span><span class="stat-label">${isEn ? 'Best' : 'Tertinggi'}</span></div>
        </div>
        <div class="card" style="padding:12px">
          <div class="muted" style="font-size:0.76rem;margin-bottom:6px">${isEn ? `Weekly Volume (${unit})` : `Volume Mingguan (${unit})`}</div>
          ${renderBarChartSvg(weeks, 'var(--ring-stand)', (v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))}
        </div>
        <div class="card" style="padding:12px">
          <strong style="display:block;font-size:0.84rem;margin-bottom:8px">${isEn ? 'Top Exercises by Volume' : 'Latihan dengan Volume Tertinggi'}</strong>
          ${topHtml || `<p class="muted" style="margin:0">${isEn ? 'No volume data yet.' : 'Belum ada data volume.'}</p>`}
        </div>
      `;
    } else if (metric === 'prs') {
      title = t('kpiPrs');
      const allPrs = [];
      workouts.forEach((w) => {
        (w.prs || []).forEach((prName) => {
          allPrs.push({ prName, wkId: w.id, wkName: w.name, date: w.date });
        });
      });
      const prRows = allPrs.slice(0, 20).map((item) => `
        <div class="list-card" style="padding:10px 12px;cursor:pointer" data-kd-wk="${esc(item.wkId)}">
          <div class="list-card-top">
            <strong style="font-size:0.88rem;color:var(--ring-move)">${esc(item.prName)}</strong>
            <span class="muted" style="font-size:0.75rem">${formatDate(item.date)}</span>
          </div>
          <div class="muted" style="font-size:0.78rem">${esc(item.wkName)}</div>
        </div>
      `).join('');
      bodyHtml = `
        <div class="summary-grid" style="grid-template-columns:repeat(2,1fr)">
          <div class="stat-box"><span class="stat-value tabular" style="color:var(--ring-move)">${allPrs.length}</span><span class="stat-label">${isEn ? 'Total PRs' : 'Total Rekor PR'}</span></div>
          <div class="stat-box"><span class="stat-value tabular">${workouts.filter((w) => w.prs && w.prs.length).length}</span><span class="stat-label">${isEn ? 'PR Sessions' : 'Sesi dengan PR'}</span></div>
        </div>
        <div class="stack-list" style="max-height:48vh;overflow-y:auto">${prRows || `<div class="empty-state">${esc(t('kpiPrsSubEmpty'))}</div>`}</div>
      `;
    } else {
      title = t('kpiAvgDur');
      const totalSec = workouts.reduce((s, w) => s + (w.durationSec || 0), 0);
      const avgMin = workouts.length ? Math.round(totalSec / workouts.length / 60) : 0;
      const maxMin = workouts.reduce((m, w) => Math.max(m, Math.round((w.durationSec || 0) / 60)), 0);
      const weeks = buildWeeklyTrend((list) => list.length ? Math.round(list.reduce((s, w) => s + (w.durationSec || 0), 0) / list.length / 60) : 0);
      const recent = workouts.slice(0, 5).map((w) => `
        <div class="list-card" style="padding:10px 12px;cursor:pointer" data-kd-wk="${esc(w.id)}">
          <div class="list-card-top">
            <strong style="font-size:0.9rem">${esc(w.name)}</strong>
            <span class="tabular" style="color:var(--ring-exercise);font-weight:700">${formatDuration(w.durationSec || 0)}</span>
          </div>
          <div class="muted" style="font-size:0.78rem">${formatDate(w.date)} • ${w.totalSets || 0} set</div>
        </div>
      `).join('');
      bodyHtml = `
        <div class="summary-grid">
          <div class="stat-box"><span class="stat-value tabular" style="color:var(--ring-exercise)">${avgMin}m</span><span class="stat-label">${isEn ? 'Avg' : 'Rata-rata'}</span></div>
          <div class="stat-box"><span class="stat-value tabular">${Math.round(totalSec / 60)}m</span><span class="stat-label">${isEn ? 'Total' : 'Total Menit'}</span></div>
          <div class="stat-box"><span class="stat-value tabular">${maxMin}m</span><span class="stat-label">${isEn ? 'Longest' : 'Terlama'}</span></div>
        </div>
        <div class="card" style="padding:12px">
          <div class="muted" style="font-size:0.76rem;margin-bottom:6px">${isEn ? 'Avg Duration per Week (min)' : 'Rata-rata Durasi per Minggu (menit)'}</div>
          ${renderBarChartSvg(weeks, 'var(--ring-exercise)', (v) => `${v}m`)}
        </div>
        <div class="stack-list">${recent || `<div class="empty-state">${esc(t('historyEmptyAll'))}</div>`}</div>
      `;
    }

    openModal(`
      <div class="modal-header">
        <h3>${esc(title)}</h3>
        <button type="button" class="btn btn-ghost btn-xs" id="modalCloseBtn">${esc(t('btnClose'))}</button>
      </div>
      ${bodyHtml}
      <button type="button" class="btn btn-secondary btn-sm btn-block" id="kdGoHistoryBtn">${isEn ? 'Open Full History' : 'Buka Semua History'}</button>
    `);

    document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
    document.querySelectorAll('[data-kd-wk]').forEach((el) => {
      el.addEventListener('click', () => openWorkoutDetailModal(el.dataset.kdWk, false));
    });
    document.getElementById('kdGoHistoryBtn').addEventListener('click', () => {
      closeModal();
      const btn = document.querySelector('.nav-item[data-tab="history"]');
      if (btn) btn.click();
    });
  }

    if (weeklyEl) {
      const maxBar = Math.max(...dayVols, 1);
      const dayLabels = t('dowShortList').split(',');
      const barsHtml = dayVols.map((v, idx) => {
        const isToday = idx === dowOffset;
        const pct = v > 0 ? Math.max(18, Math.round((v / maxBar) * 100)) : 14;
        return `
          <div class="weekly-bar-col">
            <div class="weekly-bar-track">
              <div class="weekly-bar-fill ${v > 0 ? 'has-val' : ''} ${isToday ? 'today' : ''}" style="height:${pct}%" title="${Math.round(v)} ${esc(unit)}"></div>
            </div>
            <span class="weekly-bar-day ${isToday ? 'today' : ''}">${esc(dayLabels[idx] || '')}</span>
          </div>
        `;
      }).join('');

      weeklyEl.innerHTML = `
        <div class="weekly-hdr">
          <strong style="font-size:0.95rem">${esc(t('weeklyVolTitle'))}</strong>
          <span class="badge tabular">${esc(t('weeklyVolTotal', { vol: fmtVol(weekVol) }))}</span>
        </div>
        <div class="weekly-bars-grid">${barsHtml}</div>
      `;
    }

    if (focusEl) {
      const trendLabel = lastWeekVol > 0
        ? (weekVol >= lastWeekVol ? `↑ ${t('trendUp')}` : `↓ ${t('trendDown')}`)
        : t('trendSteady');
      const sortedMuscles = Object.entries(muscleCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
      const donutColors = ['var(--ring-move)', 'var(--ring-exercise)', 'var(--ring-stand)', 'var(--ring-purple)', 'var(--warning)'];
      const r = 38;
      const circ = 2 * Math.PI * r;
      let offset = 0;
      const arcs = totalMuscleUnits > 0
        ? sortedMuscles.map(([, val], idx) => {
            const frac = val / totalMuscleUnits;
            const len = Math.max(4, frac * circ);
            const seg = `<circle cx="48" cy="48" r="${r}" fill="none" stroke="${donutColors[idx % donutColors.length]}" stroke-width="11" stroke-dasharray="${len.toFixed(1)} ${circ.toFixed(1)}" stroke-dashoffset="${(-offset).toFixed(1)}" transform="rotate(-90 48 48)" />`;
            offset += frac * circ;
            return seg;
          }).join('')
        : `<circle cx="48" cy="48" r="${r}" fill="none" stroke="var(--surface-2)" stroke-width="11" />`;

      const legendHtml = sortedMuscles.length
        ? sortedMuscles.map(([m, val], idx) => {
            const pct = Math.round((val / totalMuscleUnits) * 100);
            return `
              <div class="af-legend-row">
                <div class="af-legend-left">
                  <span class="af-legend-dot" style="background:${donutColors[idx % donutColors.length]}"></span>
                  <span class="af-legend-name">${esc(tMuscle(m))}</span>
                </div>
                <span class="muted tabular">${pct}%</span>
              </div>
            `;
          }).join('')
        : `<p class="muted" style="margin:0">${esc(t('muscleFocusEmpty'))}</p>`;

      focusEl.innerHTML = `
        <div class="weekly-hdr" style="margin-bottom:0">
          <strong style="font-size:0.95rem">${esc(t('muscleFocusTitle'))}</strong>
          <span class="badge">${esc(trendLabel)}</span>
        </div>
        <div class="af-donut-body">
          <svg viewBox="0 0 96 96" width="96" height="96" style="flex-shrink:0" aria-hidden="true">${arcs}</svg>
          <div class="af-donut-legend">${legendHtml}</div>
        </div>
      `;
    }
  }

  function renderAll() {
    renderHeaderStats();
    refreshSyncStatusUI();
    renderDashboardBento();
    renderRoutines();
    renderHistory();
    renderExercisesTab();
    renderBodyTab();
  }

  // --- Routines & Folders ---
  function renderRoutineCard(r) {
    const names = r.exercises.map((item) => esc(getExerciseById(item.exerciseId).name)).join(', ');
    return `
      <div class="list-card">
        <div class="list-card-top" style="align-items:center">
          <div style="display:flex;align-items:center;gap:12px;min-width:0">
            <span class="af-icon-circle">${gIcon('fitness_center')}</span>
            <div style="min-width:0">
              <h4 class="list-card-title">${esc(r.name)}</h4>
              <p class="muted" style="margin:3px 0 0">${esc(t('exCountLabel', { count: r.exercises.length }))} • ${names || esc(t('emptyWord'))}</p>
            </div>
          </div>
        </div>
        <div class="card-actions">
          <button class="btn btn-primary btn-sm" data-start-routine="${esc(r.id)}">${esc(t('btnStart'))}</button>
          <button class="btn btn-secondary btn-sm" data-edit-routine="${esc(r.id)}">${esc(t('btnEdit'))}</button>
          <button class="btn btn-ghost btn-sm" data-dup-routine="${esc(r.id)}">${esc(t('btnDup'))}</button>
          <button class="btn btn-danger-ghost btn-sm" data-delete-routine="${esc(r.id)}">${esc(t('btnDelete'))}</button>
        </div>
      </div>
    `;
  }

  function renderRoutines() {
    const list = document.getElementById('routinesList');
    if (!state.routines.length && !state.folders.length) {
      list.innerHTML = `<div class="empty-state">${esc(t('emptyRoutines'))}</div>`;
      return;
    }

    let html = '';
    for (const folder of state.folders) {
      const items = state.routines.filter((r) => r.folderId === folder.id);
      html += `
        <div class="folder-box">
          <div class="folder-head" data-toggle-folder="${esc(folder.id)}">
            <div style="display:flex;align-items:center;gap:6px">
              ${gIcon('folder', 'g-icon-sm')}
              <strong>${esc(folder.name)}</strong>
              <span class="muted">(${items.length})</span>
            </div>
            <div style="display:flex;gap:6px;align-items:center">
              <button class="btn btn-ghost btn-xs" data-rename-folder="${esc(folder.id)}" title="Rename">${gIcon('edit', 'g-icon-sm')}</button>
              <button class="btn btn-danger-ghost btn-xs" data-del-folder="${esc(folder.id)}" title="${esc(t('btnDelete'))}">${gIcon('close', 'g-icon-sm')}</button>
              <span class="muted">${gIcon(folder.collapsed ? 'chevron_right' : 'expand_more', 'g-icon-sm')}</span>
            </div>
          </div>
          ${folder.collapsed ? '' : `
            <div class="folder-body">
              ${items.length ? items.map(renderRoutineCard).join('') : `<div class="muted" style="padding:6px">${esc(t('emptyFolder'))}</div>`}
            </div>
          `}
        </div>
      `;
    }

    const folderIds = new Set(state.folders.map((f) => f.id));
    const uncategorized = state.routines.filter((r) => !r.folderId || !folderIds.has(r.folderId));
    if (uncategorized.length) {
      html += uncategorized.map(renderRoutineCard).join('');
    }

    list.innerHTML = html;

    list.querySelectorAll('[data-toggle-folder]').forEach((el) => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        const f = state.folders.find((item) => item.id === el.dataset.toggleFolder);
        if (f) {
          f.collapsed = !f.collapsed;
          saveState();
          renderRoutines();
        }
      });
    });

    list.querySelectorAll('[data-rename-folder]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const f = state.folders.find((item) => item.id === btn.dataset.renameFolder);
        if (!f) return;
        const name = await uiPrompt(t('promptRenameFolder'), f.name);
        if (name && name.trim()) {
          f.name = name.trim();
          saveState();
          renderRoutines();
        }
      });
    });

    list.querySelectorAll('[data-del-folder]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!(await uiConfirm(t('confirmDelFolder')))) return;
        const fid = btn.dataset.delFolder;
        state.folders = state.folders.filter((f) => f.id !== fid);
        state.routines.forEach((r) => { if (r.folderId === fid) r.folderId = null; });
        saveState();
        renderRoutines();
      });
    });

    list.querySelectorAll('[data-start-routine]').forEach((btn) => {
      btn.addEventListener('click', () => startWorkoutFromRoutine(btn.dataset.startRoutine));
    });
    list.querySelectorAll('[data-edit-routine]').forEach((btn) => {
      btn.addEventListener('click', () => openRoutineModal(btn.dataset.editRoutine));
    });
    list.querySelectorAll('[data-dup-routine]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const orig = state.routines.find((r) => r.id === btn.dataset.dupRoutine);
        if (!orig) return;
        const copy = JSON.parse(JSON.stringify(orig));
        copy.id = uid('rt');
        copy.name = `${orig.name} ${t('copySuffix')}`;
        state.routines.push(copy);
        saveState();
        renderRoutines();
      });
    });
    list.querySelectorAll('[data-delete-routine]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (await uiConfirm(t('confirmDelRoutine'))) {
          state.routines = state.routines.filter((r) => r.id !== btn.dataset.deleteRoutine);
          saveState();
          renderRoutines();
        }
      });
    });
  }

  async function createNewFolder() {
    const name = await uiPrompt(t('promptNewFolder'));
    if (!name || !name.trim()) return;
    state.folders.push({ id: uid('fld'), name: name.trim(), collapsed: false });
    saveState();
    renderRoutines();
  }

  // --- Active Workout ---
  function makeEmptySet(exType) {
    return {
      type: 'normal',
      weight: '',
      reps: '',
      durationSec: '',
      distance: '',
      durationMin: '',
      rpe: '',
      completed: false
    };
  }

  function openStartWorkoutModal() {
    const isEn = curLang() === 'en';
    const folderMap = new Map((state.folders || []).map((f) => [f.id, f.name]));
    const routineCards = (state.routines || []).map((r) => {
      const fName = r.folderId ? folderMap.get(r.folderId) : '';
      const exNames = (r.exercises || []).slice(0, 3).map((item) => getExerciseById(item.exerciseId).name).join(', ');
      const extra = (r.exercises || []).length > 3 ? ` +${r.exercises.length - 3}` : '';
      return `
        <div class="list-card" style="padding:12px;cursor:pointer" data-sw-routine="${esc(r.id)}">
          <div class="list-card-top">
            <div>
              <strong style="font-size:0.95rem">${esc(r.name)}</strong>
              ${fName ? `<span class="badge" style="margin-left:6px">${esc(fName)}</span>` : ''}
            </div>
            <span class="btn btn-primary btn-xs">${isEn ? 'Start' : 'Mulai'}</span>
          </div>
          <p class="muted" style="margin:4px 0 0;font-size:0.8rem">${(r.exercises || []).length} ${isEn ? 'exercises' : 'latihan'}${exNames ? ` • ${esc(exNames + extra)}` : ''}</p>
        </div>
      `;
    }).join('');

    openModal(`
      <div class="modal-header">
        <h3>${isEn ? 'Start Workout' : 'Mulai Latihan'}</h3>
        <button type="button" class="btn btn-ghost btn-xs" id="modalCloseBtn">${esc(t('btnClose'))}</button>
      </div>
      <button type="button" class="btn btn-primary btn-block" id="swEmptyBtn">
        ${gIcon('add', 'g-icon-sm')}<span>${isEn ? 'Start Empty Workout' : 'Mulai Latihan Kosong'}</span>
      </button>
      <div style="margin-top:12px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <strong style="font-size:0.86rem">${esc(t('routinesHeading'))}</strong>
          <button type="button" class="btn btn-ghost btn-xs" id="swNewRoutineBtn">${esc(t('newRoutineBtn'))}</button>
        </div>
        <div class="stack-list" style="max-height:46vh;overflow-y:auto">
          ${routineCards || `<div class="empty-state">${isEn ? 'No routine templates yet.' : 'Belum ada template routine.'}</div>`}
        </div>
      </div>
    `);

    document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
    document.getElementById('swEmptyBtn').addEventListener('click', () => {
      closeModal();
      startEmptyWorkout();
    });
    document.getElementById('swNewRoutineBtn').addEventListener('click', () => {
      openRoutineModal(null);
    });
    document.querySelectorAll('[data-sw-routine]').forEach((el) => {
      el.addEventListener('click', () => {
        const rId = el.dataset.swRoutine;
        closeModal();
        startWorkoutFromRoutine(rId);
      });
    });
  }

  async function startEmptyWorkout() {
    if (state.activeWorkout && !(await uiConfirm(t('confirmReplaceActive'), { danger: false }))) return;
    state.activeWorkout = {
      id: uid('wk'),
      name: t('newWorkoutDefault'),
      routineId: null,
      startedAt: Date.now(),
      exercises: []
    };
    saveState();
    openActiveWorkoutSheet();
  }

  async function startWorkoutFromRoutine(routineId) {
    if (state.activeWorkout && !(await uiConfirm(t('confirmReplaceRoutine'), { danger: false }))) return;
    const routine = state.routines.find((r) => r.id === routineId);
    if (!routine) return;

    state.activeWorkout = {
      id: uid('wk'),
      name: routine.name,
      routineId: routine.id,
      startedAt: Date.now(),
      exercises: routine.exercises.map((item) => {
        const count = Math.max(1, Number(item.targetSets) || 3);
        const exMeta = getExerciseById(item.exerciseId);
        const sets = [];
        for (let i = 0; i < count; i++) sets.push(makeEmptySet(exMeta.type));
        return {
          exerciseId: item.exerciseId,
          supersetGroup: item.supersetGroup || null,
          sets
        };
      })
    };
    saveState();
    openActiveWorkoutSheet();
  }

  function openActiveWorkoutSheet() {
    if (!state.activeWorkout) return;
    document.getElementById('activeWorkoutSheet').classList.remove('hidden');
    document.getElementById('minimizedWorkoutBar').classList.add('hidden');
    document.getElementById('activeWorkoutName').value = state.activeWorkout.name;
    renderActiveWorkout();
    startWorkoutTicker();
  }

  function minimizeActiveWorkout() {
    document.getElementById('activeWorkoutSheet').classList.add('hidden');
    if (state.activeWorkout) {
      document.getElementById('minimizedWorkoutBar').classList.remove('hidden');
      document.getElementById('minWorkoutTitle').textContent = state.activeWorkout.name;
    }
  }

  function startWorkoutTicker() {
    if (workoutTicker) clearInterval(workoutTicker);
    const update = () => {
      if (!state.activeWorkout) {
        clearInterval(workoutTicker);
        return;
      }
      const elapsed = Math.floor((Date.now() - state.activeWorkout.startedAt) / 1000);
      const formatted = formatDuration(elapsed);
      document.getElementById('activeWorkoutTimer').textContent = formatted;
      document.getElementById('minWorkoutTimer').textContent = formatted;
    };
    update();
    workoutTicker = setInterval(update, 1000);
  }

  function updateActiveWorkoutStats() {
    if (!state.activeWorkout) return;
    let vol = 0;
    let completedSets = 0;
    for (const ex of state.activeWorkout.exercises) {
      const exMeta = getExerciseById(ex.exerciseId);
      for (const s of ex.sets) {
        if (s.completed) {
          completedSets++;
          vol += calcSetVolume(exMeta, s);
        }
      }
    }
    document.getElementById('activeWorkoutVolume').textContent = `${Math.round(vol)} ${state.settings.unit}`;
    document.getElementById('activeWorkoutSets').textContent = `${completedSets} set`;
  }

  function getSetTypeDisplay(setObj, normalIndex) {
    const typeKey = setObj.type || 'normal';
    if (typeKey === 'warmup') return { label: 'W', cls: 'warmup', title: t('setTypeWarmup') };
    if (typeKey === 'dropset') return { label: 'D', cls: 'dropset', title: t('setTypeDropset') };
    if (typeKey === 'failure') return { label: 'F', cls: 'failure', title: t('setTypeFailure') };
    return { label: String(normalIndex), cls: '', title: t('setTypeNormal') };
  }

  function getSupersetClass(group) {
    if (!group) return '';
    const idx = SUPERSET_LABELS.indexOf(group);
    return idx >= 0 ? `superset-${idx % 4}` : 'superset-0';
  }

  function renderSetColumns(exMeta, exIdx, s, setIdx) {
    const type = exMeta.type || 'weight_reps';
    if (type === 'reps_only') {
      return `
        <td><input type="number" step="1" min="0" class="set-input" placeholder="0" value="${esc(s.reps)}" data-ex="${exIdx}" data-set="${setIdx}" data-field="reps" /></td>
      `;
    }
    if (type === 'duration') {
      return `
        <td><input type="number" step="5" min="0" class="set-input" placeholder="60" value="${esc(s.durationSec)}" data-ex="${exIdx}" data-set="${setIdx}" data-field="durationSec" /></td>
      `;
    }
    if (type === 'distance_duration') {
      return `
        <td><input type="number" step="0.1" min="0" class="set-input" placeholder="0" value="${esc(s.distance)}" data-ex="${exIdx}" data-set="${setIdx}" data-field="distance" /></td>
        <td><input type="number" step="1" min="0" class="set-input" placeholder="0" value="${esc(s.durationMin)}" data-ex="${exIdx}" data-set="${setIdx}" data-field="durationMin" /></td>
      `;
    }
    return `
      <td><input type="number" step="0.5" min="0" class="set-input" placeholder="0" value="${esc(s.weight)}" data-ex="${exIdx}" data-set="${setIdx}" data-field="weight" /></td>
      <td><input type="number" step="1" min="0" class="set-input" placeholder="0" value="${esc(s.reps)}" data-ex="${exIdx}" data-set="${setIdx}" data-field="reps" /></td>
    `;
  }

  function renderTableHeaders(exMeta) {
    const type = exMeta.type || 'weight_reps';
    const unit = state.settings.unit;
    if (type === 'reps_only') return `<th>${esc(t('thSet'))}</th><th>${esc(t('thPrev'))}</th><th>${esc(t('thReps'))}</th><th>✓</th><th></th>`;
    if (type === 'duration') return `<th>${esc(t('thSet'))}</th><th>${esc(t('thPrev'))}</th><th>${esc(t('thSec'))}</th><th>✓</th><th></th>`;
    if (type === 'distance_duration') return `<th>${esc(t('thSet'))}</th><th>${esc(t('thPrev'))}</th><th>${esc(t('thKm'))}</th><th>${esc(t('thMin'))}</th><th>✓</th><th></th>`;
    const weightCol = type === 'weighted_bodyweight' ? `+${unit}` : type === 'assisted_bodyweight' ? `-${unit}` : unit;
    return `<th>${esc(t('thSet'))}</th><th>${esc(t('thPrev'))}</th><th>${esc(weightCol)}</th><th>${esc(t('thReps'))}</th><th>✓</th><th></th>`;
  }

  function renderActiveWorkout() {
    const container = document.getElementById('activeExercisesContainer');
    const wk = state.activeWorkout;
    if (!wk) return;

    updateActiveWorkoutStats();

    if (!wk.exercises.length) {
      container.innerHTML = `<div class="empty-state">${t('emptyActiveWk')}</div>`;
      return;
    }

    container.innerHTML = wk.exercises.map((exItem, exIdx) => {
      const exMeta = getExerciseById(exItem.exerciseId);
      const pinnedNote = state.pinnedNotes[exItem.exerciseId] || '';
      const exRest = state.exerciseRestTimers[exItem.exerciseId] || state.settings.defaultRestSec;
      const ssClass = getSupersetClass(exItem.supersetGroup);
      const ssPrevSame = Boolean(exItem.supersetGroup && exIdx > 0 && wk.exercises[exIdx - 1].supersetGroup === exItem.supersetGroup);
      const ssNextSame = Boolean(exItem.supersetGroup && exIdx < wk.exercises.length - 1 && wk.exercises[exIdx + 1].supersetGroup === exItem.supersetGroup);
      const ssPosClass = ssPrevSame && ssNextSame ? 'ss-mid' : ssNextSame ? 'ss-start' : ssPrevSame ? 'ss-end' : '';
      const ssBadge = exItem.supersetGroup ? `<span class="superset-badge ${ssClass}">${esc(t('btnSuperset'))} ${esc(exItem.supersetGroup)}</span>` : '';
      const dbHint = (state.settings.dumbbellPerHand && exMeta.equipment === 'Dumbbell') ? ` ${esc(t('perHandVol'))}` : '';
      let normalCounter = 0;

      const rows = exItem.sets.map((s, setIdx) => {
        const setType = s.type || 'normal';
        if (setType !== 'warmup') normalCounter++;
        const badge = getSetTypeDisplay(s, normalCounter || setIdx + 1);
        const prev = getPreviousSet(exItem.exerciseId, setIdx);
        return `
          <tr class="set-row ${s.completed ? 'completed' : ''}">
            <td><button class="set-type-btn ${badge.cls}" data-cycle-type="${exIdx}:${setIdx}" title="${esc(badge.title)}">${badge.label}</button></td>
            <td class="prev-cell">${esc(prev)}</td>
            ${renderSetColumns(exMeta, exIdx, s, setIdx)}
            <td><button class="check-btn ${s.completed ? 'checked' : ''}" data-toggle-set="${exIdx}:${setIdx}" title="${esc(t('titleToggleSet'))}">${gIcon('check', 'g-icon-sm')}</button></td>
            <td><button class="del-set-btn" data-del-set="${exIdx}:${setIdx}" title="${esc(t('titleDelSet'))}">${gIcon('close', 'g-icon-sm')}</button></td>
          </tr>
        `;
      }).join('');

      const showCalc = !['reps_only', 'duration', 'distance_duration'].includes(exMeta.type || 'weight_reps');

      return `
        <div class="exercise-block ${ssClass} ${ssPosClass}" data-ex-block="${exIdx}">
          <div class="exercise-block-head">
            <div class="ex-head-main">
              <button type="button" class="ex-head-thumb" data-demo-ex="${esc(exItem.exerciseId)}" title="${esc(t('btnDemo'))}">
                ${renderThumbHtml(exMeta, 40)}
              </button>
              <div class="ex-head-info">
                <h4>${esc(exMeta.name)}${ssBadge}</h4>
                <div class="ex-head-sub">
                  <span class="muted">${esc(tMuscle(exMeta.muscle))} • ${esc(tEquip(exMeta.equipment))}${dbHint}</span>
                  <button type="button" class="ex-rest-inline" data-ex-rest="${esc(exItem.exerciseId)}">${gIcon('timer', 'g-icon-sm')}<span>${exRest}s</span></button>
                </div>
              </div>
            </div>
            <div class="ex-head-actions">
              <button type="button" class="ex-icon-btn drag-handle-btn" data-drag-ex="${exIdx}" title="${curLang() === 'en' ? 'Hold & drag to reorder' : 'Tahan & geser untuk urutkan'}" ${wk.exercises.length < 2 ? 'disabled' : ''}>${gIcon('drag_indicator', 'g-icon-sm')}</button>
              <button type="button" class="ex-icon-btn ex-icon-danger" data-remove-ex="${exIdx}" title="${esc(t('btnClose'))}">${gIcon('close', 'g-icon-sm')}</button>
            </div>
          </div>
          <input type="text" class="pinned-note-input" placeholder="${esc(t('pinnedNotePh'))}"
            value="${esc(pinnedNote)}" data-pinned-note="${esc(exItem.exerciseId)}" />
          <div class="ex-tools-row">
            <button type="button" class="ex-chip-btn ${exItem.supersetGroup ? 'active' : ''}" data-toggle-ss="${exIdx}">${gIcon('link', 'g-icon-sm')}<span>${exItem.supersetGroup ? `SS ${exItem.supersetGroup}` : esc(t('btnSuperset'))}</span></button>
            ${showCalc ? `<button type="button" class="ex-chip-btn" data-plate-calc="${exIdx}">${gIcon('fitness_center', 'g-icon-sm')}<span>${esc(t('btnPlate'))}</span></button>` : ''}
            ${showCalc ? `<button type="button" class="ex-chip-btn" data-warmup-calc="${exIdx}">${gIcon('local_fire_department', 'g-icon-sm')}<span>${esc(t('btnWarmup'))}</span></button>` : ''}
          </div>
          <table class="sets-table">
            <thead><tr>${renderTableHeaders(exMeta)}</tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <button class="btn-add-set" data-add-set="${exIdx}">${esc(t('btnAddSet'))}</button>
        </div>
      `;
    }).join('');

    // Bindings inside active workout
    container.querySelectorAll('[data-pinned-note]').forEach((inp) => {
      inp.addEventListener('input', () => {
        const exId = inp.dataset.pinnedNote;
        if (inp.value.trim()) state.pinnedNotes[exId] = inp.value;
        else delete state.pinnedNotes[exId];
        saveState();
      });
    });

    container.querySelectorAll('[data-cycle-type]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const [exIdx, setIdx] = btn.dataset.cycleType.split(':').map(Number);
        const s = state.activeWorkout.exercises[exIdx].sets[setIdx];
        const currIdx = SET_TYPES.indexOf(s.type || 'normal');
        s.type = SET_TYPES[(currIdx + 1) % SET_TYPES.length];
        saveState();
        renderActiveWorkout();
      });
    });

    container.querySelectorAll('[data-drag-ex]').forEach((btn) => {
      btn.addEventListener('pointerdown', (e) => {
        const arr = state.activeWorkout.exercises;
        if (arr.length < 2) return;
        e.preventDefault();
        const fromIdx = Number(btn.dataset.dragEx);
        const blocks = [...container.querySelectorAll('.exercise-block[data-ex-block]')];
        const draggedBlock = blocks[fromIdx];
        if (!draggedBlock) return;

        const startY = e.clientY;
        const rects = blocks.map((b) => b.getBoundingClientRect());
        const dragStep = rects[fromIdx].height + (fromIdx + 1 < rects.length ? Math.max(0, rects[fromIdx + 1].top - rects[fromIdx].bottom) : 12);
        let targetIdx = fromIdx;
        draggedBlock.classList.add('dragging');
        try { btn.setPointerCapture(e.pointerId); } catch (_) {}

        const applyShifts = (tIdx) => {
          blocks.forEach((b, i) => {
            if (i === fromIdx) return;
            if (fromIdx < tIdx && i > fromIdx && i <= tIdx) {
              b.style.transform = `translateY(${-dragStep}px)`;
            } else if (fromIdx > tIdx && i >= tIdx && i < fromIdx) {
              b.style.transform = `translateY(${dragStep}px)`;
            } else {
              b.style.transform = '';
            }
          });
        };

        const onMove = (ev) => {
          const dy = ev.clientY - startY;
          draggedBlock.style.transform = `translateY(${dy}px) scale(1.015)`;

          let nextTarget = fromIdx;
          if (ev.clientY <= rects[0].top + rects[0].height / 2) {
            nextTarget = 0;
          } else {
            for (let i = 0; i < rects.length; i++) {
              const mid = rects[i].top + rects[i].height / 2;
              if (ev.clientY > mid) nextTarget = i;
            }
          }
          if (nextTarget !== targetIdx) {
            targetIdx = nextTarget;
            applyShifts(targetIdx);
          }
        };

        const cleanup = () => {
          draggedBlock.classList.remove('dragging');
          blocks.forEach((b) => { b.style.transform = ''; });
          btn.removeEventListener('pointermove', onMove);
          btn.removeEventListener('pointerup', onUp);
          btn.removeEventListener('pointercancel', onUp);
        };

        const onUp = () => {
          cleanup();
          if (targetIdx !== fromIdx) {
            const [moved] = arr.splice(fromIdx, 1);
            arr.splice(targetIdx, 0, moved);
            saveState();
            renderActiveWorkout();
          }
        };

        btn.addEventListener('pointermove', onMove);
        btn.addEventListener('pointerup', onUp);
        btn.addEventListener('pointercancel', onUp);
      });
    });

    container.querySelectorAll('[data-toggle-ss]').forEach((btn) => {
      btn.addEventListener('click', () => {
        openSupersetModal(Number(btn.dataset.toggleSs));
      });
    });

    container.querySelectorAll('[data-demo-ex]').forEach((btn) => {
      btn.addEventListener('click', () => openExerciseDemoModal(btn.dataset.demoEx));
    });
    container.querySelectorAll('[data-ex-rest]').forEach((btn) => {
      btn.addEventListener('click', () => openExerciseRestModal(btn.dataset.exRest));
    });
    container.querySelectorAll('[data-plate-calc]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const exItem = state.activeWorkout.exercises[Number(btn.dataset.plateCalc)];
        const sampleWeight = Number(exItem.sets.find((s) => Number(s.weight) > 0)?.weight) || 60;
        openPlateCalculatorModal(sampleWeight);
      });
    });
    container.querySelectorAll('[data-warmup-calc]').forEach((btn) => {
      btn.addEventListener('click', () => openWarmupCalculatorModal(Number(btn.dataset.warmupCalc)));
    });

    container.querySelectorAll('.set-input').forEach((inp) => {
      inp.addEventListener('input', () => {
        const exIdx = Number(inp.dataset.ex);
        const setIdx = Number(inp.dataset.set);
        state.activeWorkout.exercises[exIdx].sets[setIdx][inp.dataset.field] = inp.value;
        saveState();
        updateActiveWorkoutStats();
      });
    });

    container.querySelectorAll('[data-toggle-set]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const [exIdx, setIdx] = btn.dataset.toggleSet.split(':').map(Number);
        const exItem = state.activeWorkout.exercises[exIdx];
        const set = exItem.sets[setIdx];
        set.completed = !set.completed;
        saveState();
        renderActiveWorkout();
        if (set.completed) {
          let shouldStartRest = true;
          if (exItem.supersetGroup) {
            const groupExercises = state.activeWorkout.exercises.filter((e) => e.supersetGroup === exItem.supersetGroup);
            if (groupExercises.length > 1) {
              shouldStartRest = groupExercises.every((e) => !e.sets[setIdx] || e.sets[setIdx].completed);
            }
          }
          if (shouldStartRest) {
            const restSec = state.exerciseRestTimers[exItem.exerciseId] || state.settings.defaultRestSec;
            startRestTimer(restSec);
          }
        }
      });
    });

    container.querySelectorAll('[data-del-set]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const [exIdx, setIdx] = btn.dataset.delSet.split(':').map(Number);
        state.activeWorkout.exercises[exIdx].sets.splice(setIdx, 1);
        saveState();
        renderActiveWorkout();
      });
    });

    container.querySelectorAll('[data-add-set]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const exIdx = Number(btn.dataset.addSet);
        const sets = state.activeWorkout.exercises[exIdx].sets;
        const last = sets[sets.length - 1];
        sets.push({
          ...makeEmptySet(),
          weight: last ? last.weight : '',
          reps: last ? last.reps : '',
          durationSec: last ? last.durationSec : '',
          distance: last ? last.distance : '',
          durationMin: last ? last.durationMin : ''
        });
        saveState();
        renderActiveWorkout();
      });
    });

    container.querySelectorAll('[data-remove-ex]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.activeWorkout.exercises.splice(Number(btn.dataset.removeEx), 1);
        saveState();
        renderActiveWorkout();
      });
    });
  }

  async function finishWorkout() {
    const wk = state.activeWorkout;
    if (!wk) return;

    const cleanedExercises = wk.exercises
      .map((ex) => {
        const exMeta = getExerciseById(ex.exerciseId);
        const type = exMeta.type || 'weight_reps';
        const validSets = ex.sets.filter((s) => {
          if (s.completed) return true;
          if (type === 'duration') return Number(s.durationSec) > 0;
          if (type === 'distance_duration') return Number(s.distance) > 0 || Number(s.durationMin) > 0;
          if (type === 'reps_only') return Number(s.reps) > 0;
          return Number(s.weight) > 0 && Number(s.reps) > 0;
        }).map((s) => ({
          type: s.type || 'normal',
          weight: Number(s.weight) || 0,
          reps: Number(s.reps) || 0,
          durationSec: Number(s.durationSec) || 0,
          distance: Number(s.distance) || 0,
          durationMin: Number(s.durationMin) || 0,
          rpe: s.rpe ? Number(s.rpe) : null,
          completed: true
        }));
        return { exerciseId: ex.exerciseId, supersetGroup: ex.supersetGroup || null, sets: validSets };
      })
      .filter((ex) => ex.sets.length > 0);

    if (!cleanedExercises.length) {
      await uiAlert(t('alertNeedOneSet'));
      return;
    }

    const durationSec = Math.floor((Date.now() - wk.startedAt) / 1000);
    let totalVolume = 0;
    let totalSets = 0;
    let totalReps = 0;
    const prs = [];

    for (const ex of cleanedExercises) {
      const exMeta = getExerciseById(ex.exerciseId);
      const type = exMeta.type || 'weight_reps';
      let prevBest = 0;
      for (const oldW of state.workouts) {
        const oldEx = oldW.exercises.find((e) => e.exerciseId === ex.exerciseId);
        if (oldEx) {
          for (const s of oldEx.sets) {
            if ((s.type || 'normal') !== 'warmup') {
              const score = type === 'duration' ? (s.durationSec || 0)
                : type === 'distance_duration' ? (s.distance || 0)
                : type === 'reps_only' ? (s.reps || 0)
                : calc1RM(s.weight, s.reps);
              prevBest = Math.max(prevBest, score);
            }
          }
        }
      }

      let currentBest = 0;
      for (const s of ex.sets) {
        totalSets++;
        totalReps += Number(s.reps) || 0;
        totalVolume += calcSetVolume(exMeta, s);
        if (s.type !== 'warmup') {
          const score = type === 'duration' ? (s.durationSec || 0)
            : type === 'distance_duration' ? (s.distance || 0)
            : type === 'reps_only' ? (s.reps || 0)
            : calc1RM(s.weight, s.reps);
          currentBest = Math.max(currentBest, score);
        }
      }

      if (currentBest > prevBest && prevBest > 0) {
        const suffix = type === 'duration' ? `${currentBest} ${t('unitSec')}`
          : type === 'distance_duration' ? `${currentBest} km`
          : type === 'reps_only' ? `${currentBest} reps`
          : `Est. 1RM ${Math.round(currentBest)} ${state.settings.unit}`;
        prs.push(`${exMeta.name} (${suffix})`);
      }
    }

    const completedWorkout = {
      id: wk.id,
      name: wk.name.trim() || 'Workout',
      routineId: wk.routineId,
      date: new Date().toISOString(),
      durationSec,
      totalVolume: Math.round(totalVolume),
      totalSets,
      totalReps,
      prs,
      exercises: cleanedExercises
    };

    state.workouts.unshift(completedWorkout);
    state.activeWorkout = null;
    stopRestTimer();
    saveState();

    document.getElementById('activeWorkoutSheet').classList.add('hidden');
    document.getElementById('minimizedWorkoutBar').classList.add('hidden');
    renderHeaderStats();
    renderHistory();
    openWorkoutDetailModal(completedWorkout.id, true);
    if (getCloudUser()) pushToDrive(true);
  }

  async function discardWorkout() {
    if (!(await uiConfirm(t('confirmDiscardWk')))) return;
    state.activeWorkout = null;
    stopRestTimer();
    saveState();
    document.getElementById('activeWorkoutSheet').classList.add('hidden');
    document.getElementById('minimizedWorkoutBar').classList.add('hidden');
  }

  // --- Rest Timer ---
  function startRestTimer(seconds) {
    restRemaining = Math.max(5, seconds);
    document.getElementById('restTimerPill').classList.remove('hidden');
    updateRestDisplay();
    if (restInterval) clearInterval(restInterval);
    restInterval = setInterval(() => {
      restRemaining--;
      if (restRemaining <= 0) {
        stopRestTimer();
        playRestBeep();
      } else {
        updateRestDisplay();
      }
    }, 1000);
  }

  function updateRestDisplay() {
    document.getElementById('restTimerDisplay').textContent = formatDuration(restRemaining);
  }

  function stopRestTimer() {
    if (restInterval) clearInterval(restInterval);
    restInterval = null;
    restRemaining = 0;
    document.getElementById('restTimerPill').classList.add('hidden');
  }

  // --- History, Monthly Report, Calendar, Streak & Muscle Distribution ---
  function getWeekKey(dateObj) {
    const d = new Date(dateObj);
    d.setHours(0, 0, 0, 0);
    const day = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - day);
    return d.toISOString().slice(0, 10);
  }

  function calculateWeeklyStreak() {
    if (!state.workouts.length) return 0;
    const weekSet = new Set(state.workouts.map((w) => getWeekKey(w.date)));
    let streak = 0;
    const cursor = new Date();
    if (!weekSet.has(getWeekKey(cursor))) cursor.setDate(cursor.getDate() - 7);
    while (weekSet.has(getWeekKey(cursor))) {
      streak++;
      cursor.setDate(cursor.getDate() - 7);
    }
    return streak;
  }

  function renderMonthlyReportCard() {
    const card = document.getElementById('monthlyReportCard');
    if (!card) return;
    const now = new Date();
    const curMonth = now.getMonth();
    const curYear = now.getFullYear();

    const thisMonthWorkouts = state.workouts.filter((w) => {
      const d = new Date(w.date);
      return d.getMonth() === curMonth && d.getFullYear() === curYear;
    });

    const monthName = now.toLocaleDateString(localeTag(), { month: 'long', year: 'numeric' });
    const count = thisMonthWorkouts.length;
    const sets = thisMonthWorkouts.reduce((a, w) => a + (w.totalSets || 0), 0);
    const vol = thisMonthWorkouts.reduce((a, w) => a + (w.totalVolume || 0), 0);
    const dur = thisMonthWorkouts.reduce((a, w) => a + (w.durationSec || 0), 0);
    const prs = thisMonthWorkouts.reduce((a, w) => a + (w.prs ? w.prs.length : 0), 0);

    card.innerHTML = `
      <div class="modal-header">
        <strong style="display:inline-flex;align-items:center;gap:6px">${gIcon('bar_chart', 'g-icon-sm')}<span>${esc(t('monthlyReportTitle', { month: monthName }))}</span></strong>
        <span class="badge">${prs} PR</span>
      </div>
      <p class="muted" style="margin:6px 0 0">
        ${t('monthlyReportLine', {
          count,
          sets,
          vol: vol.toLocaleString(localeTag()),
          unit: esc(state.settings.unit),
          mins: Math.round(dur / 60)
        })}
      </p>
    `;
  }

  function renderCalendarCard() {
    const card = document.getElementById('calendarCard');
    if (!card) return;
    const year = calendarCursor.getFullYear();
    const month = calendarCursor.getMonth();
    const monthLabel = calendarCursor.toLocaleDateString(localeTag(), { month: 'long', year: 'numeric' });

    const activeDates = new Set(state.workouts.map((w) => dateDayKey(w.date)));
    const firstDow = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayKey = dateDayKey(new Date());
    const streak = calculateWeeklyStreak();

    let cells = t('dowList').split(',')
      .map((d) => `<div class="cal-dow">${esc(d)}</div>`).join('');

    for (let i = 0; i < firstDow; i++) cells += `<div></div>`;
    for (let day = 1; day <= daysInMonth; day++) {
      const key = `${year}-${month}-${day}`;
      const isToday = key === todayKey;
      const isActive = activeDates.has(key);
      const isSel = selectedCalendarDateKey === key;
      cells += `<div class="cal-day ${isToday ? 'today' : ''} ${isActive ? 'active-day' : ''} ${isSel ? 'selected-day' : ''}" data-cal-key="${key}">${day}</div>`;
    }

    card.innerHTML = `
      <div class="cal-header">
        <div>
          <strong style="text-transform:capitalize">${esc(monthLabel)}</strong>
          <span class="badge" style="margin-left:6px;gap:4px">${gIcon('local_fire_department', 'g-icon-sm')}<span>${esc(t('weekStreakBadge', { n: streak }))}</span></span>
        </div>
        <div style="display:flex;gap:6px">
          <button class="btn btn-ghost btn-xs" id="calPrevBtn">‹</button>
          <button class="btn btn-ghost btn-xs" id="calNextBtn">›</button>
        </div>
      </div>
      <div class="cal-grid">${cells}</div>
    `;

    document.getElementById('calPrevBtn').addEventListener('click', () => {
      calendarCursor = new Date(year, month - 1, 1);
      renderCalendarCard();
    });
    document.getElementById('calNextBtn').addEventListener('click', () => {
      calendarCursor = new Date(year, month + 1, 1);
      renderCalendarCard();
    });
    card.querySelectorAll('[data-cal-key]').forEach((el) => {
      el.addEventListener('click', () => {
        const key = el.dataset.calKey;
        selectedCalendarDateKey = selectedCalendarDateKey === key ? null : key;
        renderHistory();
      });
    });
  }

  function renderMuscleDistCard() {
    const card = document.getElementById('muscleDistCard');
    if (!card) return;
    const counts = {};
    let totalUnits = 0;
    for (const w of state.workouts) {
      for (const ex of w.exercises) {
        const meta = getExerciseById(ex.exerciseId);
        const working = ex.sets.filter((s) => (s.type || 'normal') !== 'warmup').length;
        if (working > 0) {
          counts[meta.muscle] = (counts[meta.muscle] || 0) + working;
          totalUnits += working;
          for (const sec of (meta.secondary || [])) {
            counts[sec] = (counts[sec] || 0) + working * 0.5;
            totalUnits += working * 0.5;
          }
        }
      }
    }

    if (!totalUnits) {
      card.innerHTML = `<strong>${esc(t('muscleDistEmptyTitle'))}</strong><p class="muted" style="margin:6px 0 0">${esc(t('muscleDistEmptyDesc'))}</p>`;
      return;
    }

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const rows = sorted.map(([muscle, val]) => {
      const pct = Math.round((val / totalUnits) * 100);
      return `
        <div class="dist-row">
          <span class="dist-label">${esc(tMuscle(muscle))}</span>
          <div class="dist-bar-bg"><div class="dist-bar-fill" style="width:${pct}%"></div></div>
          <span class="dist-val tabular">${val % 1 === 0 ? val : val.toFixed(1)} (${pct}%)</span>
        </div>
      `;
    }).join('');

    card.innerHTML = `<strong>${esc(t('muscleDistTitle'))}</strong>${rows}`;
  }

  function renderHistory() {
    const summaryEl = document.getElementById('summaryCards');
    const listEl = document.getElementById('historyList');
    const clearBtn = document.getElementById('clearDateFilterBtn');

    const totalWorkouts = state.workouts.length;
    const totalVol = state.workouts.reduce((acc, w) => acc + (w.totalVolume || 0), 0);
    const totalSets = state.workouts.reduce((acc, w) => acc + (w.totalSets || 0), 0);

    summaryEl.innerHTML = `
      <div class="stat-box"><span class="stat-value tabular">${totalWorkouts}</span><span class="stat-label">${esc(t('statWorkouts'))}</span></div>
      <div class="stat-box"><span class="stat-value tabular">${totalSets}</span><span class="stat-label">${esc(t('statSets'))}</span></div>
      <div class="stat-box"><span class="stat-value tabular">${totalVol.toLocaleString(localeTag())}</span><span class="stat-label">${esc(t('statVol', { unit: state.settings.unit }))}</span></div>
    `;

    renderMonthlyReportCard();
    renderCalendarCard();
    renderMuscleDistCard();

    if (clearBtn) clearBtn.classList.toggle('hidden', !selectedCalendarDateKey);

    const visibleWorkouts = selectedCalendarDateKey
      ? state.workouts.filter((w) => dateDayKey(w.date) === selectedCalendarDateKey)
      : state.workouts;

    if (!visibleWorkouts.length) {
      listEl.innerHTML = `<div class="empty-state">${esc(selectedCalendarDateKey ? t('historyEmptyDate') : t('historyEmptyAll'))}</div>`;
      return;
    }

    listEl.innerHTML = visibleWorkouts.map((w) => {
      const prBadge = w.prs && w.prs.length ? `<span class="badge badge-pr" style="gap:4px">${gIcon('emoji_events', 'g-icon-sm')}<span>${w.prs.length} PR</span></span>` : '';
      return `
        <div class="list-card">
          <div class="list-card-top">
            <div>
              <h4 class="list-card-title">${esc(w.name)}</h4>
              <p class="muted" style="margin:3px 0 0">${formatDate(w.date)} • ${formatDuration(w.durationSec)}</p>
            </div>
            ${prBadge}
          </div>
          <p class="muted" style="margin:0">${esc(t('exCountLabel', { count: w.exercises.length }))} • ${w.totalSets} set • ${w.totalVolume} ${esc(state.settings.unit)}</p>
          <div class="card-actions">
            <button class="btn btn-secondary btn-sm" data-view-wk="${esc(w.id)}">${esc(t('btnDetail'))}</button>
            <button class="btn btn-secondary btn-sm" data-edit-wk="${esc(w.id)}">${curLang() === 'en' ? 'Edit' : 'Edit'}</button>
            <button class="btn btn-danger-ghost btn-sm" data-del-wk="${esc(w.id)}">${esc(t('btnDelete'))}</button>
          </div>
        </div>
      `;
    }).join('');

    listEl.querySelectorAll('[data-view-wk]').forEach((btn) => {
      btn.addEventListener('click', () => openWorkoutDetailModal(btn.dataset.viewWk, false));
    });
    listEl.querySelectorAll('[data-edit-wk]').forEach((btn) => {
      btn.addEventListener('click', () => openEditWorkoutModal(btn.dataset.editWk));
    });
    listEl.querySelectorAll('[data-del-wk]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (await uiConfirm(t('confirmDelWorkout'))) {
          state.workouts = state.workouts.filter((w) => w.id !== btn.dataset.delWk);
          saveState();
          renderHeaderStats();
          renderDashboardBento();
          renderHistory();
        }
      });
    });
  }

  // --- Exercises & 3-PR Progress Tab ---
  function populateExerciseFilters() {
    const mSel = document.getElementById('muscleFilterSelect');
    const eSel = document.getElementById('equipmentFilterSelect');
    if (mSel) {
      const prevM = mSel.value || 'all';
      mSel.innerHTML = `<option value="all">${esc(t('allMusclesOpt', { count: MUSCLE_GROUPS.length }))}</option>` +
        MUSCLE_GROUPS.map((m) => `<option value="${esc(m)}">${esc(tMuscle(m))}</option>`).join('');
      mSel.value = prevM;
    }
    renderMuscleChips();
    if (eSel) {
      const prevE = eSel.value || 'all';
      eSel.innerHTML = `<option value="all">${esc(t('allEquipOpt', { count: EQUIPMENT_LIST.length }))}</option>` +
        EQUIPMENT_LIST.map((eq) => `<option value="${esc(eq)}">${esc(tEquip(eq))}</option>`).join('');
      eSel.value = prevE;
    }
  }

  function renderMuscleChips() {
    const bar = document.getElementById('muscleChipsBar');
    const mSel = document.getElementById('muscleFilterSelect');
    if (!bar || !mSel) return;
    const active = mSel.value || 'all';
    const quickMuscles = ['all', 'Chest', 'Lats', 'Upper Back', 'Shoulders', 'Biceps', 'Triceps', 'Quadriceps', 'Abdominals'];
    bar.innerHTML = quickMuscles.map((m) => {
      const label = m === 'all' ? t('chipAll') : tMuscle(m);
      return `<button type="button" class="chip-btn ${active === m ? 'active' : ''}" data-muscle-chip="${esc(m)}">${esc(label)}</button>`;
    }).join('');
    bar.querySelectorAll('[data-muscle-chip]').forEach((btn) => {
      btn.addEventListener('click', () => {
        mSel.value = btn.dataset.muscleChip;
        renderMuscleChips();
        renderExercisesTab();
      });
    });
  }

  function renderThumbHtml(ex, size = 50) {
    if (window.IRONLOG_ANIMATOR) {
      const fn = window.IRONLOG_ANIMATOR.renderThumbSvg || window.IRONLOG_ANIMATOR.renderSvg;
      return `<div class="ex-thumb" style="width:${size}px;height:${size}px">${fn(ex)}</div>`;
    }
    return `<img class="ex-thumb" style="width:${size}px;height:${size}px" src="${FALLBACK_THUMB}" alt="${esc(ex.name)}" />`;
  }

  function renderExercisesTab() {
    const query = document.getElementById('exerciseSearchInput').value.trim().toLowerCase();
    const muscle = document.getElementById('muscleFilterSelect').value;
    const equip = document.getElementById('equipmentFilterSelect').value;
    const listEl = document.getElementById('exercisesList');

    const localFiltered = state.exercises.filter((ex) => {
      const secText = (ex.secondary || []).join(' ').toLowerCase();
      const matchQuery = !query || ex.name.toLowerCase().includes(query) || ex.equipment.toLowerCase().includes(query) || ex.muscle.toLowerCase().includes(query) || secText.includes(query);
      const matchMuscle = muscle === 'all' || ex.muscle === muscle || (ex.secondary || []).includes(muscle);
      const matchEquip = equip === 'all' || ex.equipment === equip;
      return matchQuery && matchMuscle && matchEquip;
    });

    if (query.length >= 2 && !freeDbList.length && !freeDbPromise && (Date.now() - freeDbFailedAt > 30000)) {
      ensureFreeDbLoaded().then((list) => {
        if (!list.length) return;
        const curQ = (document.getElementById('exerciseSearchInput')?.value || '').trim().toLowerCase();
        if (curQ.length >= 2) renderExercisesTab();
      });
    }

    const extras = query.length >= 2 ? searchFreeDbExtras(query, muscle, equip, 30) : [];
    const filtered = [...localFiltered, ...extras];
    const extrasById = new Map(extras.map((ex) => [ex.id, ex]));

    const matchList = filtered;
    const countBadge = document.getElementById('exercisesCountBadge');
    if (countBadge) {
      countBadge.textContent = t('exMovementsBadge', { count: matchList.length });
    }

    if (!filtered.length) {
      listEl.innerHTML = `<div class="empty-state">${esc(t('emptyExercises'))}</div>`;
    } else {
      const renderLimit = filtered.slice(0, 150);
      listEl.innerHTML = renderLimit.map((ex) => {
        const secLabel = ex.secondary && ex.secondary.length ? ` (+${ex.secondary.map(tMuscle).join(', ')})` : '';
        return `
          <div class="list-card">
            <div class="list-card-top" style="align-items:center">
              <div class="ex-card-left">
                ${renderThumbHtml(ex, 50)}
                <div>
                  <h4 class="list-card-title">${esc(ex.name)}</h4>
                  <p class="muted" style="margin:3px 0 0">${esc(tMuscle(ex.muscle))}${esc(secLabel)} • ${esc(tEquip(ex.equipment))}</p>
                </div>
              </div>
              <div style="display:flex;gap:6px;flex-shrink:0">
                <button class="btn btn-secondary btn-sm" data-demo-ex="${esc(ex.id)}" title="${esc(t('btnVisualTitle'))}" style="color:var(--accent)">${esc(t('btn3dView'))}</button>
                <button class="btn btn-ghost btn-sm" data-chart-ex="${esc(ex.id)}">${esc(t('btnProgress'))}</button>
              </div>
            </div>
          </div>
        `;
      }).join('') + (filtered.length > 150 ? `<div class="muted" style="text-align:center;padding:8px">${esc(t('showingLimit', { total: filtered.length }))}</div>` : '');

      listEl.querySelectorAll('[data-demo-ex]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.demoEx;
          if (extrasById.has(id)) ensureExerciseInState(extrasById.get(id));
          openExerciseDemoModal(id);
        });
      });
      listEl.querySelectorAll('[data-chart-ex]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.chartEx;
          if (extrasById.has(id)) ensureExerciseInState(extrasById.get(id));
          selectedExerciseForChart = id;
          renderExerciseProgressCard();
          document.getElementById('exerciseProgressCard').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
      });
    }

    renderExerciseProgressCard();
  }

  function renderExerciseProgressCard() {
    const card = document.getElementById('exerciseProgressCard');
    if (!selectedExerciseForChart) {
      card.classList.add('hidden');
      return;
    }

    const exMeta = getExerciseById(selectedExerciseForChart);
    const points = [];
    let bestWeight = 0;
    let best1RM = 0;
    let bestSetVol = 0;

    for (let i = state.workouts.length - 1; i >= 0; i--) {
      const w = state.workouts[i];
      const found = w.exercises.find((e) => e.exerciseId === selectedExerciseForChart);
      if (found && found.sets.length) {
        let sess1RM = 0;
        let sessMaxW = 0;
        let sessVol = 0;
        for (const s of found.sets) {
          if ((s.type || 'normal') === 'warmup') continue;
          const val1RM = calc1RM(s.weight, s.reps);
          const wVal = Number(s.weight) || 0;
          const setV = calcSetVolume(exMeta, s);
          sess1RM = Math.max(sess1RM, val1RM);
          sessMaxW = Math.max(sessMaxW, wVal);
          sessVol += setV;
          bestWeight = Math.max(bestWeight, wVal);
          best1RM = Math.max(best1RM, val1RM);
          bestSetVol = Math.max(bestSetVol, setV);
        }
        const yVal = chartMetric === 'weight' ? sessMaxW : chartMetric === 'volume' ? Math.round(sessVol) : Math.round(sess1RM);
        points.push({ date: w.date, val: yVal });
      }
    }

    card.classList.remove('hidden');
    const secHtml = exMeta.secondary && exMeta.secondary.length
      ? `<p class="muted" style="margin:2px 0 6px">${esc(t('secMusclesLabel', { list: exMeta.secondary.map(tMuscle).join(', ') }))} • ${esc(t('exTypeLabel', { label: getExerciseTypeLabel(exMeta.type) }))}</p>`
      : `<p class="muted" style="margin:2px 0 6px">${esc(t('exTypeLabel', { label: getExerciseTypeLabel(exMeta.type) }))}</p>`;

    if (!points.length) {
      card.innerHTML = `
        <div class="modal-header">
          <h3>${esc(exMeta.name)}</h3>
          <button class="btn btn-ghost btn-xs" id="closeChartBtn">${esc(t('btnClose'))}</button>
        </div>
        ${secHtml}
        <p class="muted" style="margin:8px 0 0">${esc(t('exNoData'))}</p>
      `;
    } else {
      const unit = state.settings.unit;
      card.innerHTML = `
        <div class="modal-header">
          <h3>${esc(exMeta.name)}</h3>
          <button class="btn btn-ghost btn-xs" id="closeChartBtn">${esc(t('btnClose'))}</button>
        </div>
        ${secHtml}
        <div class="pr-grid">
          <div class="pr-box"><strong>${Math.round(best1RM)} ${esc(unit)}</strong><span>${esc(t('best1RM'))}</span></div>
          <div class="pr-box"><strong>${bestWeight} ${esc(unit)}</strong><span>${esc(t('bestWeight'))}</span></div>
          <div class="pr-box"><strong>${Math.round(bestSetVol)} ${esc(unit)}</strong><span>${esc(t('bestSetVol'))}</span></div>
        </div>
        <div class="chip-row" style="margin-top:8px">
          <button class="chip-btn ${chartMetric === '1rm' ? 'active' : ''}" data-metric="1rm">${esc(t('metric1RM'))}</button>
          <button class="chip-btn ${chartMetric === 'weight' ? 'active' : ''}" data-metric="weight">${esc(t('metricWeight'))}</button>
          <button class="chip-btn ${chartMetric === 'volume' ? 'active' : ''}" data-metric="volume">${esc(t('metricVolume'))}</button>
        </div>
        <div class="chart-wrap">${buildSvgChart(points)}</div>
      `;

      card.querySelectorAll('[data-metric]').forEach((b) => {
        b.addEventListener('click', () => {
          chartMetric = b.dataset.metric;
          renderExerciseProgressCard();
        });
      });
    }

    document.getElementById('closeChartBtn').addEventListener('click', () => {
      selectedExerciseForChart = null;
      card.classList.add('hidden');
    });
  }

  function buildSvgChart(points) {
    const W = 440;
    const H = 160;
    const padX = 28;
    const padY = 22;
    const vals = points.map((p) => p.val ?? p.est1RM ?? 0);
    const minVal = Math.min(...vals) * 0.9;
    const maxVal = Math.max(...vals, minVal + 10) * 1.05;

    const coords = points.map((p, idx) => {
      const v = p.val ?? p.est1RM ?? 0;
      const x = points.length === 1 ? W / 2 : padX + (idx / (points.length - 1)) * (W - padX * 2);
      const y = H - padY - ((v - minVal) / (maxVal - minVal || 1)) * (H - padY * 2);
      return { x, y, val: v };
    });

    const polyline = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
    const areaPoints = coords.length > 1
      ? `${coords[0].x.toFixed(1)},${H - padY} ${polyline} ${coords[coords.length - 1].x.toFixed(1)},${H - padY}`
      : '';
    const dots = coords.map((c) => `
      <circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="4.5" fill="var(--surface)" stroke="var(--primary)" stroke-width="2.5" />
      <text x="${c.x.toFixed(1)}" y="${(c.y - 10).toFixed(1)}" text-anchor="middle" fill="var(--muted)" font-size="10" font-weight="600">${c.val}</text>
    `).join('');

    return `
      <svg viewBox="0 0 ${W} ${H}" width="100%" height="160" style="background:var(--chart-bg);border-radius:14px;border:1px solid var(--border)">
        <defs>
          <linearGradient id="nordicBlueArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--primary)" stop-opacity="0.32" />
            <stop offset="100%" stop-color="var(--primary)" stop-opacity="0.0" />
          </linearGradient>
        </defs>
        ${coords.length > 1 ? `<polygon fill="url(#nordicBlueArea)" points="${areaPoints}" />` : ''}
        ${coords.length > 1 ? `<polyline fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" points="${polyline}" />` : ''}
        ${dots}
      </svg>
    `;
  }

  // --- Body Measurements Tab ---
  function renderBodyTab() {
    const chartCard = document.getElementById('bodyWeightChartCard');
    const listEl = document.getElementById('measurementsList');
    if (!chartCard || !listEl) return;

    const weightPoints = [...state.measurements]
      .reverse()
      .filter((m) => Number(m.weight) > 0)
      .map((m) => ({ date: m.date, val: Number(m.weight) }));

    if (!weightPoints.length) {
      chartCard.innerHTML = `<strong>${esc(t('bodyTrendTitle'))}</strong><p class="muted" style="margin:6px 0 0">${esc(t('bodyEmptyChart'))}</p>`;
    } else {
      const latest = weightPoints[weightPoints.length - 1].val;
      chartCard.innerHTML = `
        <div class="modal-header">
          <strong>${esc(t('bodyTrendTitle'))}</strong>
          <span class="badge">${latest} ${esc(state.settings.unit)}</span>
        </div>
        <div class="chart-wrap">${buildSvgChart(weightPoints)}</div>
      `;
    }

    if (!state.measurements.length) {
      listEl.innerHTML = `<div class="empty-state">${esc(t('bodyEmptyList'))}</div>`;
      return;
    }

    listEl.innerHTML = state.measurements.map((m) => {
      const parts = [];
      if (m.weight) parts.push(`${esc(t('lblBW'))}: <strong>${m.weight} ${esc(state.settings.unit)}</strong>`);
      if (m.bodyFat) parts.push(`${esc(t('lblBF'))}: ${m.bodyFat}%`);
      if (m.waist) parts.push(`${esc(t('lblWaist'))}: ${m.waist} cm`);
      if (m.chest) parts.push(`${esc(t('lblChest'))}: ${m.chest} cm`);
      if (m.arms) parts.push(`${esc(t('lblArms'))}: ${m.arms} cm`);
      if (m.thigh) parts.push(`${esc(t('lblThigh'))}: ${m.thigh} cm`);
      return `
        <div class="list-card">
          <div class="list-card-top">
            <div>
              <h4 class="list-card-title">${formatDate(m.date)}</h4>
              <p class="muted" style="margin:4px 0 0">${parts.join(' • ') || '—'}</p>
            </div>
            <button class="btn btn-danger-ghost btn-xs" data-del-meas="${esc(m.id)}">${esc(t('btnDelete'))}</button>
          </div>
        </div>
      `;
    }).join('');

    listEl.querySelectorAll('[data-del-meas]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.measurements = state.measurements.filter((m) => m.id !== btn.dataset.delMeas);
        saveState();
        renderBodyTab();
      });
    });
  }

  function openAddMeasurementModal() {
    openModal(`
      <div class="modal-header">
        <h3>${esc(t('modalMeasTitle'))}</h3>
        <button class="btn btn-ghost btn-xs" id="modalCloseBtn">${esc(t('btnCancel'))}</button>
      </div>
      <div class="form-group">
        <label for="measWeight">${esc(t('lblWeightUnit', { unit: state.settings.unit }))}</label>
        <input type="number" step="0.1" id="measWeight" class="input" placeholder="${esc(t('phWeight'))}" />
      </div>
      <div class="form-group">
        <label for="measBf">${esc(t('lblBodyFat'))}</label>
        <input type="number" step="0.1" id="measBf" class="input" placeholder="${esc(t('phOptional'))}" />
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div class="form-group"><label for="measWaist">${esc(t('lblWaistCm'))}</label><input type="number" step="0.5" id="measWaist" class="input" placeholder="${esc(t('phOptional'))}" /></div>
        <div class="form-group"><label for="measChest">${esc(t('lblChestCm'))}</label><input type="number" step="0.5" id="measChest" class="input" placeholder="${esc(t('phOptional'))}" /></div>
        <div class="form-group"><label for="measArms">${esc(t('lblArmsCm'))}</label><input type="number" step="0.5" id="measArms" class="input" placeholder="${esc(t('phOptional'))}" /></div>
        <div class="form-group"><label for="measThigh">${esc(t('lblThighCm'))}</label><input type="number" step="0.5" id="measThigh" class="input" placeholder="${esc(t('phOptional'))}" /></div>
      </div>
      <button class="btn btn-primary btn-block" id="saveMeasBtn">${esc(t('btnSaveEntry'))}</button>
    `);

    document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
    document.getElementById('saveMeasBtn').addEventListener('click', async () => {
      const entry = {
        id: uid('ms'),
        date: new Date().toISOString(),
        weight: document.getElementById('measWeight').value || null,
        bodyFat: document.getElementById('measBf').value || null,
        waist: document.getElementById('measWaist').value || null,
        chest: document.getElementById('measChest').value || null,
        arms: document.getElementById('measArms').value || null,
        thigh: document.getElementById('measThigh').value || null
      };
      if (!entry.weight && !entry.bodyFat && !entry.waist && !entry.chest && !entry.arms && !entry.thigh) {
        await uiAlert(t('alertNeedOneMeas'));
        return;
      }
      state.measurements.unshift(entry);
      saveState();
      renderBodyTab();
      closeModal();
      if (getCloudUser()) pushToDrive(true);
    });
  }

  // --- Gym Utilities: Per-Exercise Rest, Plate Calc, Warmup Calc ---
  function openExerciseRestModal(exerciseId) {
    const exMeta = getExerciseById(exerciseId);
    const current = state.exerciseRestTimers[exerciseId] || state.settings.defaultRestSec;
    openModal(`
      <div class="modal-header">
        <h3>${esc(t('modalExRestTitle', { name: exMeta.name }))}</h3>
        <button class="btn btn-ghost btn-xs" id="modalCloseBtn">${esc(t('btnClose'))}</button>
      </div>
      <div class="form-group">
        <label for="exRestInput">${esc(t('lblRestSec'))}</label>
        <input type="number" id="exRestInput" class="input" min="15" max="600" step="15" value="${current}" />
      </div>
      <div class="card-actions">
        ${[60, 90, 120, 180].map((s) => `<button class="btn btn-secondary btn-sm" data-preset-rest="${s}">${s}s</button>`).join('')}
      </div>
      <button class="btn btn-primary btn-block" id="saveExRestBtn">${esc(t('btnSave'))}</button>
    `);
    document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
    document.querySelectorAll('[data-preset-rest]').forEach((b) => {
      b.addEventListener('click', () => { document.getElementById('exRestInput').value = b.dataset.presetRest; });
    });
    document.getElementById('saveExRestBtn').addEventListener('click', () => {
      state.exerciseRestTimers[exerciseId] = Math.max(15, Number(document.getElementById('exRestInput').value) || 90);
      saveState();
      renderActiveWorkout();
      closeModal();
    });
  }

  function openSupersetModal(exIdx) {
    const wk = state.activeWorkout;
    if (!wk || !wk.exercises[exIdx]) return;
    const arr = wk.exercises;
    const curr = arr[exIdx];
    const exMeta = getExerciseById(curr.exerciseId);
    const isEn = curLang() === 'en';
    const colors = { A: '#38bdf8', B: '#a855f7', C: '#f59e0b', D: '#10b981' };

    const renderPicker = () => {
      const selected = curr.supersetGroup || '';
      const groupBtns = SUPERSET_LABELS.map((lbl) => {
        const active = selected === lbl;
        const col = colors[lbl];
        const count = arr.filter((e) => e.supersetGroup === lbl).length;
        return `
          <button type="button" class="ss-group-btn ${active ? 'active' : ''}" data-pick-ss="${lbl}"
            style="--ss-col:${col}">
            <strong>Superset ${lbl}</strong>
            <span>${count ? `${count} ${isEn ? 'ex' : 'latihan'}` : (isEn ? 'Empty' : 'Kosong')}</span>
          </button>
        `;
      }).join('');

      const partnerRows = arr.map((item, idx) => {
        if (idx === exIdx) return '';
        const meta = getExerciseById(item.exerciseId);
        const inSame = Boolean(selected && item.supersetGroup === selected);
        const otherTag = item.supersetGroup && !inSame
          ? `<span class="superset-badge ${getSupersetClass(item.supersetGroup)}">SS ${esc(item.supersetGroup)}</span>`
          : '';
        return `
          <label class="ss-partner-item ${inSame ? 'checked' : ''}">
            <input type="checkbox" data-ss-partner="${idx}" ${inSame ? 'checked' : ''} ${!selected ? 'disabled' : ''} />
            <span>${esc(meta.name)}${otherTag}</span>
          </label>
        `;
      }).join('');

      openModal(`
        <div class="modal-header">
          <h3>${isEn ? 'Superset Group' : 'Atur Superset'}</h3>
          <button class="btn btn-ghost btn-xs" id="modalCloseBtn">${esc(t('btnClose'))}</button>
        </div>
        <p class="muted" style="margin:0 0 12px">${esc(exMeta.name)}</p>
        <div class="ss-group-grid">${groupBtns}</div>
        <div style="margin-top:14px">
          <strong style="display:block;font-size:0.85rem;margin-bottom:8px">
            ${selected
              ? (isEn ? `Pair with exercises in Superset ${selected}:` : `Gabungkan dengan latihan di Superset ${selected}:`)
              : (isEn ? 'Select a group (A–D) above to pair exercises' : 'Pilih grup (A–D) di atas untuk menggabungkan latihan')}
          </strong>
          <div class="ss-partner-list">${partnerRows || `<p class="muted" style="margin:0">${isEn ? 'Add another exercise to pair.' : 'Tambah latihan lain untuk digabung.'}</p>`}</div>
        </div>
        <div style="display:flex;gap:8px;margin-top:14px">
          ${selected ? `<button type="button" class="btn btn-danger-ghost btn-sm" id="clearSsBtn" style="flex:1">${isEn ? 'Remove Superset' : 'Lepas Superset'}</button>` : ''}
          <button type="button" class="btn btn-primary btn-sm" id="doneSsBtn" style="flex:1">${isEn ? 'Done' : 'Selesai'}</button>
        </div>
      `);

      document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
      document.getElementById('doneSsBtn').addEventListener('click', closeModal);
      const clearBtn = document.getElementById('clearSsBtn');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          curr.supersetGroup = null;
          saveState();
          renderActiveWorkout();
          closeModal();
        });
      }

      document.querySelectorAll('[data-pick-ss]').forEach((b) => {
        b.addEventListener('click', () => {
          curr.supersetGroup = b.dataset.pickSs;
          saveState();
          renderActiveWorkout();
          renderPicker();
        });
      });

      document.querySelectorAll('[data-ss-partner]').forEach((cb) => {
        cb.addEventListener('change', () => {
          const pIdx = Number(cb.dataset.ssPartner);
          if (!curr.supersetGroup) return;
          arr[pIdx].supersetGroup = cb.checked ? curr.supersetGroup : null;
          saveState();
          renderActiveWorkout();
          renderPicker();
        });
      });
    };

    renderPicker();
  }

  function openPlateCalculatorModal(initialWeight = 60) {
    const isLbs = state.settings.unit === 'lbs';
    const defaultBar = isLbs ? 45 : 20;
    const availablePlates = isLbs ? [45, 35, 25, 10, 5, 2.5] : [25, 20, 15, 10, 5, 2.5, 1.25];

    openModal(`
      <div class="modal-header">
        <h3 style="display:inline-flex;align-items:center;gap:6px">${gIcon('fitness_center')}<span>${esc(t('modalPlateTitle'))}</span></h3>
        <button class="btn btn-ghost btn-xs" id="modalCloseBtn">${esc(t('btnClose'))}</button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div class="form-group"><label for="plateTargetInput">${esc(t('lblTargetWeight', { unit: state.settings.unit }))}</label><input type="number" step="0.5" id="plateTargetInput" class="input" value="${initialWeight}" /></div>
        <div class="form-group"><label for="plateBarInput">${esc(t('lblBarWeight', { unit: state.settings.unit }))}</label><input type="number" step="0.5" id="plateBarInput" class="input" value="${defaultBar}" /></div>
      </div>
      <div id="plateResultArea"></div>
    `);

    const renderPlates = () => {
      const target = Number(document.getElementById('plateTargetInput').value) || 0;
      const bar = Number(document.getElementById('plateBarInput').value) || 0;
      const area = document.getElementById('plateResultArea');
      if (target <= bar) {
        area.innerHTML = `<p class="muted">${esc(t('plateLowMsg', { bar, unit: state.settings.unit }))}</p>`;
        return;
      }
      let perSide = (target - bar) / 2;
      const chosen = [];
      for (const p of availablePlates) {
        while (perSide >= p - 0.001) {
          chosen.push(p);
          perSide -= p;
        }
      }
      const visualChips = chosen.map((p) => `<span class="plate-chip">${p}</span>`).join('');
      const summary = chosen.length
        ? t('platePerSide', { list: chosen.join(' + '), unit: esc(state.settings.unit) })
        : esc(t('plateStandardErr'));
      const remTxt = perSide > 0.1 ? esc(t('plateRem', { rem: perSide.toFixed(2), unit: state.settings.unit })) : '';
      area.innerHTML = `
        <p style="margin:0 0 8px">${summary}${remTxt}</p>
        <div class="plate-visual"><div class="plate-bar-core"></div>${visualChips}</div>
      `;
    };
    renderPlates();
    document.getElementById('plateTargetInput').addEventListener('input', renderPlates);
    document.getElementById('plateBarInput').addEventListener('input', renderPlates);
    document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
  }

  function openWarmupCalculatorModal(exIdx) {
    const exItem = state.activeWorkout.exercises[exIdx];
    const exMeta = getExerciseById(exItem.exerciseId);
    const guess = Number(exItem.sets.find((s) => Number(s.weight) > 0)?.weight) || 60;

    openModal(`
      <div class="modal-header">
        <h3 style="display:inline-flex;align-items:center;gap:6px">${gIcon('local_fire_department')}<span>${esc(t('modalWarmupTitle'))}</span></h3>
        <button class="btn btn-ghost btn-xs" id="modalCloseBtn">${esc(t('btnCancel'))}</button>
      </div>
      <p class="muted" style="margin:0">${esc(exMeta.name)}</p>
      <div class="form-group">
        <label for="warmupTargetInput">${esc(t('lblWarmupTarget', { unit: state.settings.unit }))}</label>
        <input type="number" step="2.5" id="warmupTargetInput" class="input" value="${guess}" />
      </div>
      <div id="warmupPreview" class="stack-list"></div>
      <button class="btn btn-primary btn-block" id="insertWarmupBtn">${esc(t('btnInsertWarmup'))}</button>
    `);

    const buildWarmups = () => {
      const target = Number(document.getElementById('warmupTargetInput').value) || 0;
      const roundTo = (v) => Math.max(0, Math.round(v / 2.5) * 2.5);
      return [
        { ...makeEmptySet(), type: 'warmup', weight: String(roundTo(target * 0.4)), reps: '10' },
        { ...makeEmptySet(), type: 'warmup', weight: String(roundTo(target * 0.6)), reps: '6' },
        { ...makeEmptySet(), type: 'warmup', weight: String(roundTo(target * 0.8)), reps: '3' }
      ];
    };

    const renderPreview = () => {
      const sets = buildWarmups();
      document.getElementById('warmupPreview').innerHTML = sets.map((s, idx) => `
        <div class="picker-item" style="cursor:default">
          <span>${esc(t('warmupStep', { n: idx + 1 }))}</span>
          <strong>${s.weight} ${esc(state.settings.unit)} × ${s.reps} reps</strong>
        </div>
      `).join('');
    };
    renderPreview();
    document.getElementById('warmupTargetInput').addEventListener('input', renderPreview);
    document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
    document.getElementById('insertWarmupBtn').addEventListener('click', () => {
      state.activeWorkout.exercises[exIdx].sets.unshift(...buildWarmups());
      saveState();
      renderActiveWorkout();
      closeModal();
    });
  }

  // --- Modals: Visual Demo, Picker, Routine, Custom Exercise, Workout Detail, Settings ---
  function stopDemoInterval() {
    if (demoInterval) {
      clearInterval(demoInterval);
      demoInterval = null;
    }
    if (window.IRONLOG_3D) {
      window.IRONLOG_3D.stop();
    }
  }

  function openModal(html) {
    stopDemoInterval();
    document.getElementById('modalContent').innerHTML = html;
    document.getElementById('modalBackdrop').classList.remove('hidden');
  }

  function closeModal() {
    stopDemoInterval();
    document.getElementById('modalBackdrop').classList.add('hidden');
    document.getElementById('modalContent').innerHTML = '';
  }

  function showUiDialog({ mode = 'alert', title = '', message = '', defaultValue = '', placeholder = '', danger = false, confirmText = '', cancelText = '' }) {
    return new Promise((resolve) => {
      const isEn = curLang() === 'en';
      const existing = document.getElementById('uiDialogBackdrop');
      if (existing) existing.remove();

      const backdrop = document.createElement('div');
      backdrop.id = 'uiDialogBackdrop';
      backdrop.className = 'ui-dialog-backdrop';

      const okLabel = confirmText || (mode === 'confirm' && danger ? (isEn ? 'Delete' : 'Hapus') : (isEn ? 'OK' : 'OK'));
      const cancelLabel = cancelText || (isEn ? 'Cancel' : 'Batal');
      const okClass = danger ? 'btn btn-danger btn-sm' : 'btn btn-primary btn-sm';
      const titleHtml = title ? `<h4 class="ui-dialog-title">${esc(title)}</h4>` : '';
      const inputHtml = mode === 'prompt'
        ? `<input type="text" id="uiDialogInput" class="input" style="margin-bottom:14px" value="${esc(defaultValue)}" placeholder="${esc(placeholder)}" />`
        : '';
      const cancelBtnHtml = mode !== 'alert'
        ? `<button type="button" class="btn btn-secondary btn-sm" id="uiDialogCancel">${esc(cancelLabel)}</button>`
        : '';

      backdrop.innerHTML = `
        <div class="ui-dialog-card" role="dialog" aria-modal="true">
          ${titleHtml}
          <p class="ui-dialog-msg">${esc(message)}</p>
          ${inputHtml}
          <div class="ui-dialog-actions">
            ${cancelBtnHtml}
            <button type="button" class="${okClass}" id="uiDialogOk">${esc(okLabel)}</button>
          </div>
        </div>
      `;
      document.body.appendChild(backdrop);

      const inputEl = document.getElementById('uiDialogInput');
      const okBtn = document.getElementById('uiDialogOk');
      const cancelBtn = document.getElementById('uiDialogCancel');

      const finish = (val) => {
        window.removeEventListener('keydown', onKey);
        backdrop.remove();
        resolve(val);
      };
      const onKey = (e) => {
        if (e.key === 'Escape') finish(mode === 'confirm' ? false : mode === 'prompt' ? null : undefined);
        else if (e.key === 'Enter' && (mode === 'prompt' || mode === 'alert')) {
          e.preventDefault();
          finish(mode === 'prompt' ? (inputEl ? inputEl.value : '') : undefined);
        }
      };

      window.addEventListener('keydown', onKey);
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) finish(mode === 'confirm' ? false : mode === 'prompt' ? null : undefined);
      });
      okBtn.addEventListener('click', () => {
        if (mode === 'confirm') finish(true);
        else if (mode === 'prompt') finish(inputEl ? inputEl.value : '');
        else finish();
      });
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => finish(mode === 'confirm' ? false : null));
      }

      setTimeout(() => {
        if (inputEl) { inputEl.focus(); inputEl.select(); }
        else okBtn.focus();
      }, 10);
    });
  }

  function uiAlert(message, title = '') {
    const isEn = curLang() === 'en';
    return showUiDialog({ mode: 'alert', title: title || (isEn ? 'Notice' : 'Info'), message });
  }

  function uiConfirm(message, opts = {}) {
    const isEn = curLang() === 'en';
    return showUiDialog({
      mode: 'confirm',
      title: opts.title || (isEn ? 'Confirm' : 'Konfirmasi'),
      message,
      danger: opts.danger !== false,
      confirmText: opts.confirmText || (opts.danger === false ? (isEn ? 'Continue' : 'Lanjutkan') : '')
    });
  }

  function uiPrompt(message, defaultValue = '', placeholder = '') {
    return showUiDialog({ mode: 'prompt', title: message, message: '', defaultValue, placeholder });
  }

  async function openExerciseDemoModal(exerciseId) {
    const exMeta = getExerciseById(exerciseId);
    const imgs = getExerciseImages(exMeta);
    const hasImgs = imgs.length > 0;
    const hasVector = Boolean(window.IRONLOG_ANIMATOR);
    let mode = '3d';
    let frame = 0;
    let playing = imgs.length > 1;

    const buildMetaChips = (dbItem) => {
      const chips = [
        `<span class="badge">${esc(tMuscle(exMeta.muscle))}</span>`,
        `<span class="badge">${esc(tEquip(exMeta.equipment))}</span>`
      ];
      if (dbItem?.level) chips.push(`<span class="badge">${esc(I18N ? I18N.tLevel(dbItem.level, curLang()) : dbItem.level)}</span>`);
      if (dbItem?.mechanic) chips.push(`<span class="badge">${esc(I18N ? I18N.tMech(dbItem.mechanic, curLang()) : dbItem.mechanic)}</span>`);
      return chips.join('');
    };

    const buildInstructions = (dbItem) => {
      const pat = hasVector ? window.IRONLOG_ANIMATOR.getPattern(exMeta) : 'squat_back';
      const steps = I18N ? I18N.getInstructions(exMeta, pat, curLang(), dbItem) : (dbItem?.instructions || []);
      if (steps && steps.length) {
        return `<ol class="instructions-list">${steps.map((step) => `<li>${esc(step)}</li>`).join('')}</ol>`;
      }
      return `<p class="muted" style="margin:0">${esc(t('guideCustom'))}</p>`;
    };

    const renderBody = (dbItem) => {
      stopDemoInterval();
      const modeButtons = [
        mode !== '3d' ? `<button class="btn btn-secondary btn-xs" data-set-mode="3d">${gIcon('view_in_ar', 'g-icon-sm')}<span>${esc(t('btnMode3D'))}</span></button>` : '',
        hasVector && mode !== 'vector' ? `<button class="btn btn-ghost btn-xs" data-set-mode="vector">${gIcon('movie', 'g-icon-sm')}<span>${esc(t('btnMode2D'))}</span></button>` : '',
        hasImgs && mode !== 'photo' ? `<button class="btn btn-ghost btn-xs" data-set-mode="photo">${gIcon('photo_camera', 'g-icon-sm')}<span>${esc(t('btnModePhoto'))}</span></button>` : ''
      ].filter(Boolean).join('');

      const pattern = hasVector ? window.IRONLOG_ANIMATOR.getPattern(exMeta) : '';
      let stageHtml = '';
      if (mode === '3d') {
        stageHtml = `
          <div class="demo-stage">
            <div class="demo-3d-box" id="demo3dMount">
              <div class="demo-cam-overlay">
                <span class="demo-cam-hint">${esc(t('modalDemoHint'))}</span>
                <div style="display:flex;gap:4px">
                  <button class="btn btn-ghost btn-xs" data-cam-preset="iso">${esc(t('cam34'))}</button>
                  <button class="btn btn-ghost btn-xs" data-cam-preset="side">${esc(t('camSide'))}</button>
                  <button class="btn btn-ghost btn-xs" data-cam-preset="front">${esc(t('camFront'))}</button>
                  <button class="btn btn-secondary btn-xs" id="demo3dPauseBtn">${gIcon('pause', 'g-icon-sm')}</button>
                </div>
              </div>
              ${!window.IRONLOG_3D ? `<div id="demo3dLoading" class="muted" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">${esc(t('demoLoading3D'))}</div>` : ''}
            </div>
            <div class="demo-controls">
              <span class="muted">${esc(t('demo3DLabel', { pattern }))}</span>
              <div style="display:flex;gap:6px">${modeButtons}</div>
            </div>
          </div>
        `;
      } else if (mode === 'vector' && hasVector) {
        stageHtml = `
          <div class="demo-stage">
            <div class="demo-svg-box">${window.IRONLOG_ANIMATOR.renderSvg(exMeta)}</div>
            <div class="demo-controls">
              <span class="muted">${esc(t('demo2DLabel', { pattern }))}</span>
              <div style="display:flex;gap:6px">${modeButtons}</div>
            </div>
          </div>
        `;
      } else if (hasImgs) {
        stageHtml = `
          <div class="demo-stage">
            <img id="demoStageImg" class="demo-img" src="${esc(imgs[frame])}" alt="${esc(exMeta.name)}" onerror="this.src='${FALLBACK_THUMB}'" />
            <div class="demo-controls">
              <span class="muted" id="demoStepLabel">${esc(t('demoPhotoLabel', { cur: frame + 1, total: imgs.length }))}</span>
              <div style="display:flex;gap:6px">
                ${imgs.length > 1 ? `<button class="btn btn-ghost btn-xs" id="demoTogglePlayBtn">${gIcon(playing ? 'pause' : 'play_arrow', 'g-icon-sm')}</button>` : ''}
                ${modeButtons}
              </div>
            </div>
          </div>
        `;
      } else {
        stageHtml = `<div class="demo-stage" style="padding:24px"><img src="${FALLBACK_THUMB}" width="64" height="64" alt="" /></div>`;
      }

      openModal(`
        <div class="modal-header">
          <h3>${esc(exMeta.name)}</h3>
          <button class="btn btn-ghost btn-xs" id="modalCloseBtn">${esc(t('btnClose'))}</button>
        </div>
        <div class="chip-row" id="demoMetaChips">${buildMetaChips(dbItem)}</div>
        ${stageHtml}
        <div>
          <strong style="display:block;margin-bottom:6px">${esc(t('guideTitle'))}</strong>
          <div id="demoInstructionsBox">${buildInstructions(dbItem)}</div>
        </div>
      `);

      document.getElementById('modalCloseBtn').addEventListener('click', closeModal);

      if (mode === '3d') {
        const mount3DIfOpen = (d3) => {
          const mountEl = document.getElementById('demo3dMount');
          const backdrop = document.getElementById('modalBackdrop');
          if (!mountEl || !mountEl.isConnected || backdrop.classList.contains('hidden') || mode !== '3d') return;
          const loaderEl = document.getElementById('demo3dLoading');
          if (loaderEl) loaderEl.remove();
          if (d3) {
            d3.mount(mountEl, exMeta);
          } else if (hasVector) {
            mode = 'vector';
            renderBody(exMeta.freeDbId ? freeDbById.get(exMeta.freeDbId) : null);
          }
        };

        if (window.IRONLOG_3D) {
          mount3DIfOpen(window.IRONLOG_3D);
        } else {
          ensure3DLoaded().then((d3) => mount3DIfOpen(d3));
        }

        document.querySelectorAll('[data-cam-preset]').forEach((b) => {
          b.addEventListener('click', () => window.IRONLOG_3D && window.IRONLOG_3D.setCameraPreset(b.dataset.camPreset));
        });
        const pause3d = document.getElementById('demo3dPauseBtn');
        if (pause3d) {
          pause3d.addEventListener('click', () => {
            if (!window.IRONLOG_3D) return;
            const pState = window.IRONLOG_3D.togglePause();
            pause3d.innerHTML = gIcon(pState ? 'play_arrow' : 'pause', 'g-icon-sm');
          });
        }
      }

      document.querySelectorAll('[data-set-mode]').forEach((b) => {
        b.addEventListener('click', () => {
          mode = b.dataset.setMode;
          renderBody(exMeta.freeDbId ? freeDbById.get(exMeta.freeDbId) : null);
        });
      });

      if (mode === 'photo' && hasImgs && imgs.length > 1) {
        const updateFrame = () => {
          const imgEl = document.getElementById('demoStageImg');
          const lblEl = document.getElementById('demoStepLabel');
          if (!imgEl || !lblEl) return stopDemoInterval();
          imgEl.src = imgs[frame];
          lblEl.textContent = t('demoPhotoLabel', { cur: frame + 1, total: imgs.length });
        };

        const startLoop = () => {
          stopDemoInterval();
          if (!playing) return;
          demoInterval = setInterval(() => {
            frame = (frame + 1) % imgs.length;
            updateFrame();
          }, 900);
        };

        startLoop();

        const playBtn = document.getElementById('demoTogglePlayBtn');
        if (playBtn) {
          playBtn.addEventListener('click', (e) => {
            playing = !playing;
            e.currentTarget.innerHTML = gIcon(playing ? 'pause' : 'play_arrow', 'g-icon-sm');
            if (playing) startLoop();
            else stopDemoInterval();
          });
        }
      }
    };

    const existingDb = exMeta.freeDbId ? freeDbById.get(exMeta.freeDbId) : null;
    renderBody(existingDb);
    if (exMeta.freeDbId && !existingDb) {
      await ensureFreeDbLoaded();
      const loadedDb = freeDbById.get(exMeta.freeDbId);
      const chipsEl = document.getElementById('demoMetaChips');
      const instEl = document.getElementById('demoInstructionsBox');
      if (loadedDb && chipsEl && instEl && !document.getElementById('modalBackdrop').classList.contains('hidden')) {
        chipsEl.innerHTML = buildMetaChips(loadedDb);
        instEl.innerHTML = buildInstructions(loadedDb);
      }
    }
  }

  function openExercisePickerModal(onPick) {
    const isEn = curLang() === 'en';
    const selectedIds = [];
    const selectedSet = new Set();
    const selectedExtras = new Map();

    openModal(`
      <div class="modal-header">
        <h3>${esc(t('modalPickerTitle'))}</h3>
        <button class="btn btn-ghost btn-xs" id="modalCloseBtn">${esc(t('btnClose'))}</button>
      </div>
      <div class="filter-bar" style="margin-bottom:0;flex-wrap:wrap">
        <input type="search" id="pickerSearch" class="input" placeholder="${esc(t('phPickerSearch'))}" autofocus />
        <select id="pickerMuscle" class="input select-sm" style="flex:1">
          <option value="all">${esc(t('allMusclesOpt', { count: MUSCLE_GROUPS.length }))}</option>
          ${MUSCLE_GROUPS.map((m) => `<option value="${esc(m)}">${esc(tMuscle(m))}</option>`).join('')}
        </select>
        <select id="pickerEquip" class="input select-sm" style="flex:1">
          <option value="all">${esc(t('allEquipOpt', { count: EQUIPMENT_LIST.length }))}</option>
          ${EQUIPMENT_LIST.map((eq) => `<option value="${esc(eq)}">${esc(tEquip(eq))}</option>`).join('')}
        </select>
      </div>
      <div id="pickerList" class="stack-list" style="max-height:48vh;overflow-y:auto"></div>
      <div class="picker-footer">
        <button type="button" class="btn btn-primary btn-block" id="pickerConfirmBtn" disabled>
          ${isEn ? 'Select exercises above' : 'Pilih latihan di atas'}
        </button>
      </div>
    `);

    const updateConfirmBtn = () => {
      const btn = document.getElementById('pickerConfirmBtn');
      if (!btn) return;
      const n = selectedIds.length;
      btn.disabled = n === 0;
      btn.textContent = n === 0
        ? (isEn ? 'Select exercises above' : 'Pilih latihan di atas')
        : (isEn ? `+ Add ${n} Exercise${n > 1 ? 's' : ''}` : `+ Tambah ${n} Latihan`);
    };

    const renderPicker = () => {
      const query = document.getElementById('pickerSearch').value.trim().toLowerCase();
      const muscle = document.getElementById('pickerMuscle').value;
      const equip = document.getElementById('pickerEquip').value;
      const localItems = state.exercises.filter((e) => {
        const matchQ = !query || e.name.toLowerCase().includes(query) || e.muscle.toLowerCase().includes(query);
        const matchM = muscle === 'all' || e.muscle === muscle || (e.secondary || []).includes(muscle);
        const matchE = equip === 'all' || e.equipment === equip;
        return matchQ && matchM && matchE;
      });

      if (query.length >= 2 && !freeDbList.length && !freeDbPromise && (Date.now() - freeDbFailedAt > 30000)) {
        ensureFreeDbLoaded().then((list) => {
          if (!list.length) return;
          const el = document.getElementById('pickerSearch');
          if (el && el.isConnected && el.value.trim().length >= 2) renderPicker();
        });
      }

      const extras = query.length >= 2 ? searchFreeDbExtras(query, muscle, equip, 25) : [];
      const items = [...localItems, ...extras];
      const extrasById = new Map(extras.map((e) => [e.id, e]));

      const list = document.getElementById('pickerList');
      list.innerHTML = items.slice(0, 120).map((e) => {
        const isSel = selectedSet.has(e.id);
        return `
          <div class="picker-item ${isSel ? 'selected' : ''}" data-pick-id="${esc(e.id)}">
            <div class="ex-card-left">
              ${renderThumbHtml(e, 40)}
              <div>
                <strong>${esc(e.name)}</strong>
                <div class="muted">${esc(tMuscle(e.muscle))} • ${esc(tEquip(e.equipment))}</div>
              </div>
            </div>
            <span class="badge ${isSel ? 'badge-selected' : ''}">${isSel ? '✓' : esc(t('btnPick'))}</span>
          </div>
        `;
      }).join('') || `<div class="empty-state">${esc(t('notFound'))}</div>`;

      list.querySelectorAll('[data-pick-id]').forEach((el) => {
        el.addEventListener('click', () => {
          const pickId = el.dataset.pickId;
          if (selectedSet.has(pickId)) {
            selectedSet.delete(pickId);
            const idx = selectedIds.indexOf(pickId);
            if (idx !== -1) selectedIds.splice(idx, 1);
            selectedExtras.delete(pickId);
          } else {
            selectedSet.add(pickId);
            selectedIds.push(pickId);
            if (extrasById.has(pickId)) selectedExtras.set(pickId, extrasById.get(pickId));
          }
          const badge = el.querySelector('.badge');
          const nowSel = selectedSet.has(pickId);
          el.classList.toggle('selected', nowSel);
          if (badge) {
            badge.classList.toggle('badge-selected', nowSel);
            badge.textContent = nowSel ? '✓' : t('btnPick');
          }
          updateConfirmBtn();
        });
      });
    };

    renderPicker();
    updateConfirmBtn();
    document.getElementById('pickerSearch').addEventListener('input', renderPicker);
    document.getElementById('pickerMuscle').addEventListener('change', renderPicker);
    document.getElementById('pickerEquip').addEventListener('change', renderPicker);
    document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
    document.getElementById('pickerConfirmBtn').addEventListener('click', () => {
      if (!selectedIds.length) return;
      selectedExtras.forEach((item) => ensureExerciseInState(item));
      const picked = [...selectedIds];
      closeModal();
      onPick(picked);
    });
  }

  function openRoutineModal(routineId = null) {
    const existing = routineId ? state.routines.find((r) => r.id === routineId) : null;
    const draft = existing
      ? JSON.parse(JSON.stringify(existing))
      : { id: uid('rt'), folderId: state.folders[0]?.id || null, name: '', exercises: [] };

    const renderRoutineEditor = () => {
      const folderOpts = `<option value="">${esc(t('optNoFolder'))}</option>` +
        state.folders.map((f) => `<option value="${esc(f.id)}" ${draft.folderId === f.id ? 'selected' : ''}>${esc(f.name)}</option>`).join('');

      const itemsHtml = draft.exercises.map((item, idx) => {
        const meta = getExerciseById(item.exerciseId);
        return `
          <div class="picker-item" style="cursor:default">
            <div>
              <strong>${esc(meta.name)}</strong>
              <div class="muted">${item.targetSets} set × ${esc(item.targetReps)}</div>
            </div>
            <div style="display:flex;gap:4px;align-items:center">
              <button class="btn btn-ghost btn-xs" data-rt-move="${idx}:-1" ${idx === 0 ? 'disabled' : ''}>↑</button>
              <button class="btn btn-ghost btn-xs" data-rt-move="${idx}:1" ${idx === draft.exercises.length - 1 ? 'disabled' : ''}>↓</button>
              <input type="number" min="1" max="12" value="${item.targetSets}" data-rt-sets="${idx}" class="set-input" style="max-width:48px" />
              <button class="del-set-btn" data-rt-del="${idx}">×</button>
            </div>
          </div>
        `;
      }).join('') || `<div class="empty-state">${esc(t('emptyRoutineEx'))}</div>`;

      openModal(`
        <div class="modal-header">
          <h3>${esc(existing ? t('modalEditRoutine') : t('modalNewRoutine'))}</h3>
          <button class="btn btn-ghost btn-xs" id="modalCloseBtn">${esc(t('btnCancel'))}</button>
        </div>
        <div class="form-group">
          <label for="routineNameInput">${esc(t('lblRoutineName'))}</label>
          <input type="text" id="routineNameInput" class="input" placeholder="${esc(t('phRoutineName'))}" value="${esc(draft.name)}" />
        </div>
        <div class="form-group">
          <label for="routineFolderSelect">${esc(t('lblFolder'))}</label>
          <select id="routineFolderSelect" class="input">${folderOpts}</select>
        </div>
        <div class="stack-list">${itemsHtml}</div>
        <button class="btn btn-secondary btn-block" id="routineAddExBtn">${esc(t('btnRoutineAddEx'))}</button>
        <button class="btn btn-primary btn-block" id="saveRoutineBtn">${esc(t('btnSaveRoutine'))}</button>
      `);

      document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
      document.getElementById('routineNameInput').addEventListener('input', (e) => { draft.name = e.target.value; });
      document.getElementById('routineFolderSelect').addEventListener('change', (e) => { draft.folderId = e.target.value || null; });
      document.querySelectorAll('[data-rt-sets]').forEach((inp) => {
        inp.addEventListener('input', () => {
          draft.exercises[Number(inp.dataset.rtSets)].targetSets = Math.max(1, Number(inp.value) || 3);
        });
      });
      document.querySelectorAll('[data-rt-move]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const [idx, dir] = btn.dataset.rtMove.split(':').map(Number);
          const target = idx + dir;
          if (target < 0 || target >= draft.exercises.length) return;
          [draft.exercises[idx], draft.exercises[target]] = [draft.exercises[target], draft.exercises[idx]];
          renderRoutineEditor();
        });
      });
      document.querySelectorAll('[data-rt-del]').forEach((btn) => {
        btn.addEventListener('click', () => {
          draft.exercises.splice(Number(btn.dataset.rtDel), 1);
          renderRoutineEditor();
        });
      });
      document.getElementById('routineAddExBtn').addEventListener('click', () => {
        openExercisePickerModal((exIds) => {
          exIds.forEach((exId) => {
            draft.exercises.push({ exerciseId: exId, targetSets: 3, targetReps: '8-12' });
          });
          renderRoutineEditor();
        });
      });
      document.getElementById('saveRoutineBtn').addEventListener('click', async () => {
        if (!draft.name.trim()) {
          await uiAlert(t('alertRoutineName'));
          return;
        }
        if (existing) {
          const idx = state.routines.findIndex((r) => r.id === existing.id);
          if (idx !== -1) state.routines[idx] = draft;
        } else {
          state.routines.push(draft);
        }
        saveState();
        renderRoutines();
        closeModal();
      });
    };

    renderRoutineEditor();
  }

  function openNewExerciseModal() {
    const selectedSec = new Set();
    openModal(`
      <div class="modal-header">
        <h3>${esc(t('modalCustomExTitle'))}</h3>
        <button class="btn btn-ghost btn-xs" id="modalCloseBtn">${esc(t('btnClose'))}</button>
      </div>
      <div class="form-group">
        <label for="customExName">${esc(t('lblCustomExName'))}</label>
        <input type="text" id="customExName" class="input" placeholder="${esc(t('phCustomExName'))}" />
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div class="form-group">
          <label for="customExMuscle">${esc(t('lblPrimaryMuscle'))}</label>
          <select id="customExMuscle" class="input">
            ${MUSCLE_GROUPS.map((m) => `<option value="${esc(m)}">${esc(tMuscle(m))}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label for="customExEquip">${esc(t('lblEquipment'))}</label>
          <select id="customExEquip" class="input">
            ${EQUIPMENT_LIST.map((eq) => `<option value="${esc(eq)}">${esc(tEquip(eq))}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-group">
        <label for="customExType">${esc(t('lblInputCategory'))}</label>
        <select id="customExType" class="input">
          ${EXERCISE_TYPES.map((tp) => `<option value="${esc(tp.id)}">${esc(tExType(tp.id))}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>${esc(t('lblSecondaryMuscles'))}</label>
        <div class="chip-row" id="secMuscleChips">
          ${MUSCLE_GROUPS.map((m) => `<button type="button" class="chip-btn" data-sec-m="${esc(m)}">${esc(tMuscle(m))}</button>`).join('')}
        </div>
      </div>
      <button class="btn btn-primary btn-block" id="saveCustomExBtn">${esc(t('btnSaveEx'))}</button>
    `);

    document.querySelectorAll('[data-sec-m]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const m = btn.dataset.secM;
        if (selectedSec.has(m)) {
          selectedSec.delete(m);
          btn.classList.remove('active');
        } else {
          selectedSec.add(m);
          btn.classList.add('active');
        }
      });
    });

    document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
    document.getElementById('saveCustomExBtn').addEventListener('click', async () => {
      const name = document.getElementById('customExName').value.trim();
      const muscle = document.getElementById('customExMuscle').value;
      const equipment = document.getElementById('customExEquip').value;
      const type = document.getElementById('customExType').value;
      if (!name) {
        await uiAlert(t('alertExName'));
        return;
      }
      const secondary = Array.from(selectedSec).filter((m) => m !== muscle);
      state.exercises.unshift({ id: uid('ex'), name, muscle, secondary, equipment, type });
      saveState();
      renderHeaderStats();
      renderExercisesTab();
      closeModal();
    });
  }

  function openWorkoutDetailModal(workoutId, isJustFinished) {
    const w = state.workouts.find((item) => item.id === workoutId);
    if (!w) return;

    const prBlock = w.prs && w.prs.length
      ? `<div class="card" style="border-color:var(--warning);background:rgba(245,158,11,0.08)">
           <strong style="color:var(--warning);display:inline-flex;align-items:center;gap:6px">${gIcon('emoji_events', 'g-icon-sm')}<span>${esc(t('prBanner'))}</span></strong>
           <ul style="margin:6px 0 0;padding-left:18px">${w.prs.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
         </div>`
      : '';

    const exHtml = w.exercises.map((ex) => {
      const meta = getExerciseById(ex.exerciseId);
      const ssTag = ex.supersetGroup ? ` <span class="superset-badge">SS ${esc(ex.supersetGroup)}</span>` : '';
      const setsText = ex.sets.map((s, idx) => {
        const typeTag = s.type && s.type !== 'normal' ? `[${s.type[0].toUpperCase()}] ` : '';
        return `Set ${idx + 1}: ${typeTag}${formatSetSummary(meta, s)}${s.rpe ? ` (RPE ${s.rpe})` : ''}`;
      }).join('<br>');
      return `
        <div class="list-card" style="padding:10px 12px">
          <strong>${esc(meta.name)}${ssTag}</strong>
          <div class="muted">${setsText}</div>
        </div>
      `;
    }).join('');

    const matchingRoutine = w.routineId ? state.routines.find((r) => r.id === w.routineId) : null;
    const updateRoutineBtn = isJustFinished && matchingRoutine
      ? `<button class="btn btn-secondary btn-block" id="updateRoutineFromWkBtn">${gIcon('sync', 'g-icon-sm')}<span>${esc(t('btnUpdateRoutine', { name: matchingRoutine.name }))}</span></button>`
      : '';

    const editHistBtn = !isJustFinished
      ? `<button class="btn btn-secondary btn-block" id="detailEditWkBtn">${gIcon('edit', 'g-icon-sm')}<span>${curLang() === 'en' ? 'Edit Workout' : 'Edit Riwayat Latihan'}</span></button>`
      : '';

    openModal(`
      <div class="modal-header">
        <h3 style="display:inline-flex;align-items:center;gap:6px">${isJustFinished ? `${gIcon('celebration')}<span>${esc(t('wkFinishedTitle'))}</span>` : esc(w.name)}</h3>
        <button class="btn btn-ghost btn-xs" id="modalCloseBtn">${esc(t('btnClose'))}</button>
      </div>
      <p class="muted" style="margin:0">${formatDate(w.date)} • ${formatDuration(w.durationSec)} • ${w.totalVolume} ${esc(state.settings.unit)} • ${w.totalSets} set</p>
      ${prBlock}
      <div class="stack-list">${exHtml}</div>
      ${editHistBtn}
      ${updateRoutineBtn}
    `);

    document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
    const detailEditBtn = document.getElementById('detailEditWkBtn');
    if (detailEditBtn) {
      detailEditBtn.addEventListener('click', () => openEditWorkoutModal(w.id));
    }
    const updBtn = document.getElementById('updateRoutineFromWkBtn');
    if (updBtn && matchingRoutine) {
      updBtn.addEventListener('click', () => {
        matchingRoutine.exercises = w.exercises.map((ex) => ({
          exerciseId: ex.exerciseId,
          supersetGroup: ex.supersetGroup || null,
          targetSets: ex.sets.filter((s) => s.type !== 'warmup').length || ex.sets.length,
          targetReps: '8-12'
        }));
        saveState();
        renderRoutines();
        updBtn.textContent = t('btnRoutineUpdated');
        updBtn.disabled = true;
      });
    }
  }

  function openEditWorkoutModal(workoutId) {
    const orig = state.workouts.find((item) => item.id === workoutId);
    if (!orig) return;
    const isEn = curLang() === 'en';
    const draft = JSON.parse(JSON.stringify(orig));
    const unit = state.settings.unit;

    const toLocalInput = (iso) => {
      const d = new Date(iso || Date.now());
      const off = d.getTimezoneOffset();
      return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
    };

    let dateVal = toLocalInput(draft.date);
    let durMinVal = Math.max(1, Math.round((draft.durationSec || 60) / 60));

    const renderSetInputs = (exMeta, exIdx, s, setIdx) => {
      const type = exMeta.type || 'weight_reps';
      if (type === 'reps_only') {
        return `<td><input type="number" step="1" min="0" class="set-input" value="${esc(s.reps)}" data-he-ex="${exIdx}" data-he-set="${setIdx}" data-he-field="reps" /></td>`;
      }
      if (type === 'duration') {
        return `<td><input type="number" step="5" min="0" class="set-input" value="${esc(s.durationSec)}" data-he-ex="${exIdx}" data-he-set="${setIdx}" data-he-field="durationSec" /></td>`;
      }
      if (type === 'distance_duration') {
        return `
          <td><input type="number" step="0.1" min="0" class="set-input" value="${esc(s.distance)}" data-he-ex="${exIdx}" data-he-set="${setIdx}" data-he-field="distance" /></td>
          <td><input type="number" step="1" min="0" class="set-input" value="${esc(s.durationMin)}" data-he-ex="${exIdx}" data-he-set="${setIdx}" data-he-field="durationMin" /></td>
        `;
      }
      return `
        <td><input type="number" step="0.5" min="0" class="set-input" value="${esc(s.weight)}" data-he-ex="${exIdx}" data-he-set="${setIdx}" data-he-field="weight" /></td>
        <td><input type="number" step="1" min="0" class="set-input" value="${esc(s.reps)}" data-he-ex="${exIdx}" data-he-set="${setIdx}" data-he-field="reps" /></td>
      `;
    };

    const renderHeaders = (exMeta) => {
      const type = exMeta.type || 'weight_reps';
      if (type === 'reps_only') return `<th>${esc(t('thSet'))}</th><th>${esc(t('thReps'))}</th><th></th>`;
      if (type === 'duration') return `<th>${esc(t('thSet'))}</th><th>${esc(t('thSec'))}</th><th></th>`;
      if (type === 'distance_duration') return `<th>${esc(t('thSet'))}</th><th>${esc(t('thKm'))}</th><th>${esc(t('thMin'))}</th><th></th>`;
      const weightCol = type === 'weighted_bodyweight' ? `+${unit}` : type === 'assisted_bodyweight' ? `-${unit}` : unit;
      return `<th>${esc(t('thSet'))}</th><th>${esc(weightCol)}</th><th>${esc(t('thReps'))}</th><th></th>`;
    };

    const renderEditor = () => {
      const exHtml = draft.exercises.map((ex, exIdx) => {
        const meta = getExerciseById(ex.exerciseId);
        let normalCounter = 0;
        const rows = ex.sets.map((s, setIdx) => {
          if ((s.type || 'normal') !== 'warmup') normalCounter++;
          const badge = getSetTypeDisplay(s, normalCounter || setIdx + 1);
          return `
            <tr class="set-row">
              <td><button type="button" class="set-type-btn ${badge.cls}" data-he-cycle="${exIdx}:${setIdx}">${badge.label}</button></td>
              ${renderSetInputs(meta, exIdx, s, setIdx)}
              <td><button type="button" class="del-set-btn" data-he-delset="${exIdx}:${setIdx}">${gIcon('close', 'g-icon-sm')}</button></td>
            </tr>
          `;
        }).join('');

        return `
          <div class="exercise-block" style="padding:12px">
            <div class="exercise-block-head" style="margin-bottom:8px">
              <h4 style="margin:0;font-size:0.92rem">${esc(meta.name)}</h4>
              <button type="button" class="ex-icon-btn ex-icon-danger" data-he-delex="${exIdx}">${gIcon('close', 'g-icon-sm')}</button>
            </div>
            <table class="sets-table">
              <thead><tr>${renderHeaders(meta)}</tr></thead>
              <tbody>${rows}</tbody>
            </table>
            <button type="button" class="btn-add-set" data-he-addset="${exIdx}">${esc(t('btnAddSet'))}</button>
          </div>
        `;
      }).join('');

      openModal(`
        <div class="modal-header">
          <h3>${isEn ? 'Edit Workout' : 'Edit Riwayat Latihan'}</h3>
          <button type="button" class="btn btn-ghost btn-xs" id="modalCloseBtn">${esc(t('btnClose'))}</button>
        </div>
        <div class="form-group">
          <label for="heNameInput">${isEn ? 'Workout Name' : 'Nama Latihan'}</label>
          <input type="text" id="heNameInput" class="input" value="${esc(draft.name)}" />
        </div>
        <div style="display:grid;grid-template-columns:1fr 110px;gap:8px">
          <div class="form-group" style="margin:0">
            <label for="heDateInput">${isEn ? 'Date & Time' : 'Tanggal & Jam'}</label>
            <input type="datetime-local" id="heDateInput" class="input" value="${esc(dateVal)}" />
          </div>
          <div class="form-group" style="margin:0">
            <label for="heDurInput">${isEn ? 'Duration (min)' : 'Durasi (mnt)'}</label>
            <input type="number" id="heDurInput" class="input" min="1" value="${esc(durMinVal)}" />
          </div>
        </div>
        <div class="stack-list" style="max-height:38vh;overflow-y:auto;margin:10px 0">${exHtml || `<div class="empty-state">${esc(t('emptyActiveWk'))}</div>`}</div>
        <button type="button" class="btn btn-secondary btn-sm btn-block" id="heAddExBtn">${esc(t('addExToWkBtn'))}</button>
        <div style="display:flex;gap:8px;margin-top:10px">
          <button type="button" class="btn btn-ghost btn-sm" id="heCancelBtn" style="flex:1">${isEn ? 'Cancel' : 'Batal'}</button>
          <button type="button" class="btn btn-primary btn-sm" id="heSaveBtn" style="flex:1">${esc(t('btnSave'))}</button>
        </div>
      `);

      document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
      document.getElementById('heCancelBtn').addEventListener('click', closeModal);
      document.getElementById('heNameInput').addEventListener('input', (e) => { draft.name = e.target.value; });
      document.getElementById('heDateInput').addEventListener('change', (e) => { dateVal = e.target.value; });
      document.getElementById('heDurInput').addEventListener('input', (e) => { durMinVal = Math.max(1, Number(e.target.value) || 1); });

      document.querySelectorAll('[data-he-field]').forEach((inp) => {
        inp.addEventListener('input', () => {
          const exIdx = Number(inp.dataset.heEx);
          const setIdx = Number(inp.dataset.heSet);
          const field = inp.dataset.heField;
          draft.exercises[exIdx].sets[setIdx][field] = Number(inp.value) || 0;
        });
      });

      document.querySelectorAll('[data-he-cycle]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const [exIdx, setIdx] = btn.dataset.heCycle.split(':').map(Number);
          const s = draft.exercises[exIdx].sets[setIdx];
          const currIdx = SET_TYPES.indexOf(s.type || 'normal');
          s.type = SET_TYPES[(currIdx + 1) % SET_TYPES.length];
          renderEditor();
        });
      });

      document.querySelectorAll('[data-he-delset]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const [exIdx, setIdx] = btn.dataset.heDelset.split(':').map(Number);
          draft.exercises[exIdx].sets.splice(setIdx, 1);
          renderEditor();
        });
      });

      document.querySelectorAll('[data-he-addset]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const exIdx = Number(btn.dataset.heAddset);
          const sets = draft.exercises[exIdx].sets;
          const last = sets[sets.length - 1];
          const meta = getExerciseById(draft.exercises[exIdx].exerciseId);
          const newSet = last ? { ...last, type: 'normal', completed: true } : { ...makeEmptySet(meta.type), completed: true };
          sets.push(newSet);
          renderEditor();
        });
      });

      document.querySelectorAll('[data-he-delex]').forEach((btn) => {
        btn.addEventListener('click', () => {
          draft.exercises.splice(Number(btn.dataset.heEx || btn.dataset.heDelex), 1);
          renderEditor();
        });
      });

      document.getElementById('heAddExBtn').addEventListener('click', () => {
        openExercisePickerModal((exIds) => {
          exIds.forEach((exId) => {
            const meta = getExerciseById(exId);
            draft.exercises.push({
              exerciseId: exId,
              supersetGroup: null,
              sets: [{ ...makeEmptySet(meta.type), completed: true }]
            });
          });
          renderEditor();
        });
      });

      document.getElementById('heSaveBtn').addEventListener('click', async () => {
        const cleaned = draft.exercises
          .map((ex) => ({
            exerciseId: ex.exerciseId,
            supersetGroup: ex.supersetGroup || null,
            sets: ex.sets.map((s) => ({
              type: s.type || 'normal',
              weight: Number(s.weight) || 0,
              reps: Number(s.reps) || 0,
              durationSec: Number(s.durationSec) || 0,
              distance: Number(s.distance) || 0,
              durationMin: Number(s.durationMin) || 0,
              rpe: null,
              completed: true
            }))
          }))
          .filter((ex) => ex.sets.length > 0);

        if (!cleaned.length) {
          await uiAlert(t('alertNeedOneSet'));
          return;
        }

        let totalVolume = 0;
        let totalSets = 0;
        let totalReps = 0;
        for (const ex of cleaned) {
          const meta = getExerciseById(ex.exerciseId);
          for (const s of ex.sets) {
            totalSets++;
            totalReps += Number(s.reps) || 0;
            totalVolume += calcSetVolume(meta, s);
          }
        }

        const parsedDate = new Date(dateVal);
        orig.name = draft.name.trim() || orig.name;
        orig.date = Number.isNaN(parsedDate.getTime()) ? orig.date : parsedDate.toISOString();
        orig.durationSec = Math.max(60, Math.round(durMinVal * 60));
        orig.exercises = cleaned;
        orig.totalSets = totalSets;
        orig.totalReps = totalReps;
        orig.totalVolume = Math.round(totalVolume);

        state.workouts.sort((a, b) => new Date(b.date) - new Date(a.date));
        saveState();
        renderHeaderStats();
        renderDashboardBento();
        renderHistory();
        renderExercisesTab();
        closeModal();
      });
    };

    renderEditor();
  }

  function openSettingsModal() {
    const api = getCloudApi();
    const user = getCloudUser();
    const isConfigured = Boolean(api && api.isConfigured());
    const isSignedIn = Boolean(user);
    const displayLabel = user ? (user.displayName ? `${user.displayName} (${user.email})` : user.email) : '';
    const emailInfo = isSignedIn
      ? `<p class="muted" style="margin:0">${esc(t('accLabel'))}: <strong style="color:var(--text)">${esc(displayLabel)}</strong> <span class="badge" style="color:var(--success)">${esc(t('accActive'))}</span></p>`
      : `<p class="muted" style="margin:0">${esc(t('accNone'))}</p>`;
    const syncTimeInfo = state.settings.lastSyncAt
      ? `<p class="muted" style="margin:0">${esc(t('lastSyncLabel', { time: new Date(state.settings.lastSyncAt).toLocaleString(localeTag()) }))}</p>`
      : '';
    const configHint = !isConfigured
      ? `<p class="muted" style="margin:0;font-size:0.78rem">${t('firebaseNotReadyHint')}</p>`
      : '';

    openModal(`
      <div class="modal-header">
        <h3>${esc(t('modalSettingsTitle'))}</h3>
        <button class="btn btn-ghost btn-xs" id="modalCloseBtn">${esc(t('btnClose'))}</button>
      </div>

      <div class="card" style="background:var(--bg);display:flex;flex-direction:column;gap:10px">
        <strong style="color:var(--accent);display:inline-flex;align-items:center;gap:6px">${gIcon('cloud_upload', 'g-icon-sm')}<span>${esc(t('driveBoxTitle'))}</span></strong>
        ${emailInfo}
        ${syncTimeInfo}
        ${configHint}
        <div class="card-actions">
          ${isSignedIn
            ? `<button class="btn btn-primary btn-sm" id="pushDriveBtn">${esc(t('btnPushDrive'))}</button>
               <button class="btn btn-secondary btn-sm" id="pullDriveBtn">${esc(t('btnPullDrive'))}</button>
               <button class="btn btn-danger-ghost btn-sm" id="disconnectGoogleBtn">${esc(t('btnDisconnect'))}</button>`
            : `<button class="btn btn-primary btn-sm" id="connectGooglePushBtn" ${!isConfigured ? 'disabled' : ''}>${esc(t('btnLoginSave'))}</button>
               <button class="btn btn-secondary btn-sm" id="connectGooglePullBtn" ${!isConfigured ? 'disabled' : ''}>${esc(t('btnLoginPull'))}</button>`
          }
        </div>
      </div>

      <div class="form-group">
        <label for="settingTheme">${esc(t('lblTheme'))}</label>
        <select id="settingTheme" class="input">
          <option value="dark" ${curTheme() === 'dark' ? 'selected' : ''}>${esc(t('optThemeDark'))}</option>
          <option value="light" ${curTheme() === 'light' ? 'selected' : ''}>${esc(t('optThemeLight'))}</option>
        </select>
      </div>
      <div class="form-group">
        <label for="settingLang">${esc(t('lblLanguage'))}</label>
        <select id="settingLang" class="input">
          <option value="id" ${curLang() === 'id' ? 'selected' : ''}>Bahasa Indonesia (ID)</option>
          <option value="en" ${curLang() === 'en' ? 'selected' : ''}>English (EN)</option>
        </select>
      </div>
      <div class="form-group">
        <label for="settingUnit">${esc(t('lblWeightUnitSetting'))}</label>
        <select id="settingUnit" class="input">
          <option value="kg" ${state.settings.unit === 'kg' ? 'selected' : ''}>${esc(t('optKg'))}</option>
          <option value="lbs" ${state.settings.unit === 'lbs' ? 'selected' : ''}>${esc(t('optLbs'))}</option>
        </select>
      </div>
      <div class="form-group">
        <label for="settingRest">${esc(t('lblDefaultRest'))}</label>
        <input type="number" id="settingRest" class="input" min="15" max="600" step="15" value="${state.settings.defaultRestSec}" />
      </div>
      <label style="display:flex;align-items:center;gap:8px;font-size:0.88rem;cursor:pointer">
        <input type="checkbox" id="settingDbPerHand" ${state.settings.dumbbellPerHand ? 'checked' : ''} />
        <span>${esc(t('lblDbPerHand'))}</span>
      </label>
      <button class="btn btn-primary btn-block" id="saveSettingsBtn">${esc(t('btnSaveSettings'))}</button>
      <hr style="border:none;border-top:1px solid var(--border);width:100%;margin:4px 0" />
      <div class="card-actions">
        <button class="btn btn-secondary" style="flex:1" id="exportJsonBtn">${esc(t('btnExportJson'))}</button>
        <button class="btn btn-secondary" style="flex:1" id="importJsonBtn">${esc(t('btnImportJson'))}</button>
      </div>
    `);

    document.getElementById('modalCloseBtn').addEventListener('click', closeModal);

    if (isSignedIn) {
      document.getElementById('pushDriveBtn').addEventListener('click', () => pushToDrive(false));
      document.getElementById('pullDriveBtn').addEventListener('click', async () => {
        if (await uiConfirm(t('confirmPullDrive'), { danger: false })) pullFromDrive(false);
      });
      document.getElementById('disconnectGoogleBtn').addEventListener('click', async () => {
        await disconnectGoogleAccount();
        openSettingsModal();
      });
    } else {
      document.getElementById('connectGooglePushBtn').addEventListener('click', () => connectGoogleAccount('sync'));
      document.getElementById('connectGooglePullBtn').addEventListener('click', () => connectGoogleAccount('pull'));
    }

    document.getElementById('saveSettingsBtn').addEventListener('click', () => {
      state.settings.theme = document.getElementById('settingTheme').value === 'light' ? 'light' : 'dark';
      state.settings.lang = document.getElementById('settingLang').value === 'en' ? 'en' : 'id';
      state.settings.unit = document.getElementById('settingUnit').value;
      state.settings.defaultRestSec = Math.max(15, Number(document.getElementById('settingRest').value) || 90);
      state.settings.dumbbellPerHand = document.getElementById('settingDbPerHand').checked;
      saveState();
      applyTheme();
      applyStaticTranslations();
      renderAll();
      if (state.activeWorkout) renderActiveWorkout();
      closeModal();
    });

    document.getElementById('exportJsonBtn').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `8bitgym-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    document.getElementById('importJsonBtn').addEventListener('click', () => {
      document.getElementById('importFileInput').click();
    });
  }

  // --- Event Bindings ---
  function initEvents() {
    document.getElementById('startEmptyWorkoutBtn').addEventListener('click', openStartWorkoutModal);
    document.getElementById('newFolderBtn').addEventListener('click', createNewFolder);
    document.getElementById('newRoutineBtn').addEventListener('click', () => openRoutineModal(null));
    document.getElementById('newExerciseBtn').addEventListener('click', openNewExerciseModal);
    document.getElementById('addMeasurementBtn').addEventListener('click', openAddMeasurementModal);
    document.getElementById('settingsBtn').addEventListener('click', openSettingsModal);
    document.getElementById('themeToggleBtn').addEventListener('click', () => {
      setTheme(curTheme() === 'dark' ? 'light' : 'dark');
    });
    document.getElementById('langToggleBtn').addEventListener('click', () => {
      setLanguage(curLang() === 'id' ? 'en' : 'id');
    });
    document.getElementById('clearDateFilterBtn').addEventListener('click', () => {
      selectedCalendarDateKey = null;
      renderHistory();
    });

    document.getElementById('syncStatusBtn').addEventListener('click', () => {
      if (getCloudUser()) pushToDrive(false);
      else openSettingsModal();
    });

    document.getElementById('minimizeWorkoutBtn').addEventListener('click', minimizeActiveWorkout);
    document.getElementById('expandWorkoutBtn').addEventListener('click', openActiveWorkoutSheet);
    document.getElementById('resumeWorkoutBtn').addEventListener('click', openActiveWorkoutSheet);
    document.getElementById('finishWorkoutBtn').addEventListener('click', finishWorkout);
    document.getElementById('discardWorkoutBtn').addEventListener('click', discardWorkout);

    document.getElementById('activeWorkoutName').addEventListener('input', (e) => {
      if (state.activeWorkout) {
        state.activeWorkout.name = e.target.value;
        saveState();
      }
    });

    document.getElementById('addExerciseToWorkoutBtn').addEventListener('click', () => {
      openExercisePickerModal((exIds) => {
        exIds.forEach((exId) => {
          const exMeta = getExerciseById(exId);
          state.activeWorkout.exercises.push({
            exerciseId: exId,
            supersetGroup: null,
            sets: [makeEmptySet(exMeta.type)]
          });
        });
        saveState();
        renderActiveWorkout();
      });
    });

    document.getElementById('restMinusBtn').addEventListener('click', () => {
      restRemaining = Math.max(5, restRemaining - 15);
      updateRestDisplay();
    });
    document.getElementById('restPlusBtn').addEventListener('click', () => {
      restRemaining += 15;
      updateRestDisplay();
    });
    document.getElementById('restSkipBtn').addEventListener('click', stopRestTimer);

    document.getElementById('exerciseSearchInput').addEventListener('input', renderExercisesTab);
    document.getElementById('muscleFilterSelect').addEventListener('change', () => {
      renderMuscleChips();
      renderExercisesTab();
    });
    document.getElementById('equipmentFilterSelect').addEventListener('change', renderExercisesTab);

    document.getElementById('modalBackdrop').addEventListener('click', (e) => {
      if (e.target.id === 'modalBackdrop') closeModal();
    });

    document.getElementById('importFileInput').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result);
          if (!parsed || !Array.isArray(parsed.workouts) || !Array.isArray(parsed.exercises)) {
            throw new Error(t('alertInvalidJson'));
          }
          state = {
            settings: {
              lang: curLang(),
              theme: curTheme(),
              unit: 'kg',
              defaultRestSec: 90,
              dumbbellPerHand: false,
              googleClientId: state.settings.googleClientId || '',
              googleEmail: state.settings.googleEmail || '',
              lastSyncAt: null,
              ...(parsed.settings || {})
            },
            exercises: mergeBuiltInExercises(parsed.exercises),
            folders: Array.isArray(parsed.folders) ? parsed.folders : [...DEFAULT_FOLDERS],
            routines: Array.isArray(parsed.routines) ? parsed.routines : [],
            workouts: parsed.workouts,
            pinnedNotes: parsed.pinnedNotes || {},
            exerciseRestTimers: parsed.exerciseRestTimers || {},
            measurements: Array.isArray(parsed.measurements) ? parsed.measurements : [],
            activeWorkout: null
          };
          saveState();
          applyTheme();
          applyStaticTranslations();
          renderAll();
          closeModal();
          uiAlert(t('alertImportOk'));
        } catch (err) {
          uiAlert(t('alertImportErr', { msg: err.message }));
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    });

    window.addEventListener('pagehide', () => {
      if (state.activeWorkout) saveState();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && state.activeWorkout) {
        saveState();
      }
    });

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      document.getElementById('installBtn').classList.remove('hidden');
    });

    document.getElementById('installBtn').addEventListener('click', async () => {
      if (!deferredInstallPrompt) return;
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      document.getElementById('installBtn').classList.add('hidden');
    });
  }

  // --- Boot ---
  function init() {
    initNavigation();
    applyTheme();
    applyStaticTranslations();
    initEvents();
    renderAll();

    if (state.activeWorkout) {
      openActiveWorkoutSheet();
      startWorkoutTicker();
    }

    const bindCloudAuth = () => {
      const api = getCloudApi();
      if (!api) return;
      api.onAuthChange((user) => {
        if (user && user.email) {
          state.settings.googleEmail = user.email;
          saveState();
        }
        refreshSyncStatusUI();
      });
    };
    if (getCloudApi()) bindCloudAuth();
    else window.addEventListener('eightbitcloud:ready', bindCloudAuth, { once: true });

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch((err) => {
        console.warn('Service Worker gagal didaftarkan:', err);
      });
    }
  }

  init();
})();
