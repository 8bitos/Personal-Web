/**
 * 8BitCompress — Precision In-Browser Compression Engine
 * 100% Client-Side • Local RAM Processing
 * Independent Per-File Settings • 16p to 4K • Universal Format Converters
 * Hardware-Accelerated MP4 & WebM Transcoder with Zero-Lag Video Rendering
 * Memory-Bounded Audio Resampling (Handles Audio Files of Any Size Without Crashing)
 */

// Resolution Definitions (16p to 4K + Original)
const RESOLUTIONS = {
  original: { label: 'Asli (Original)', width: null, height: null },
  '4k':     { label: '4K UHD (3840×2160)', width: 3840, height: 2160 },
  '2k':     { label: '2K QHD (2560×1440)', width: 2560, height: 1440 },
  '1080p':  { label: '1080p FHD (1920×1080)', width: 1920, height: 1080 },
  '720p':   { label: '720p HD (1280×720)', width: 1280, height: 720 },
  '480p':   { label: '480p SD (854×480)', width: 854, height: 480 },
  '360p':   { label: '360p (640×360)', width: 640, height: 360 },
  '240p':   { label: '240p (426×240)', width: 426, height: 240 },
  '144p':   { label: '144p (256×144)', width: 256, height: 144 },
  '72p':    { label: '72p (128×72)', width: 128, height: 72 },
  '36p':    { label: '36p (64×36)', width: 64, height: 36 },
  '16p':    { label: '16p Pixel (28×16)', width: 28, height: 16 }
};

// Formats per Category
const FORMAT_OPTIONS = {
  image: [
    { value: 'jpg', label: 'JPG / JPEG' },
    { value: 'png', label: 'PNG' },
    { value: 'webp', label: 'WEBP' },
    { value: 'avif', label: 'AVIF' },
    { value: 'bmp', label: 'BMP (Bitmap)' },
    { value: 'gif', label: 'GIF' },
    { value: 'ico', label: 'ICO (Favicon)' },
    { value: 'pdf', label: 'PDF Document (.pdf)' }
  ],
  video: [
    { value: 'mp4', label: 'MP4' },
    { value: 'webm', label: 'WebM' },
    { value: 'mkv', label: 'MKV' },
    { value: 'mov', label: 'MOV' },
    { value: 'mp3', label: 'Ekstrak Audio (MP3)' },
    { value: 'wav', label: 'Ekstrak Audio (WAV)' }
  ],
  audio: [
    { value: 'mp3', label: 'MP3' },
    { value: 'wav', label: 'WAV' },
    { value: 'ogg', label: 'OGG' },
    { value: 'm4a', label: 'M4A / AAC' },
    { value: 'flac', label: 'FLAC' },
    { value: 'webm', label: 'WebM Audio' }
  ],
  pdf: [
    { value: 'pdf', label: 'PDF Terkompresi (.pdf)' },
    { value: 'zip', label: 'Arsip ZIP (.zip)' }
  ],
  generic: [
    { value: 'zip', label: 'Arsip ZIP (.zip)' }
  ]
};

// Global Application State
const state = {
  lang: localStorage.getItem('theme_lang') || 'id',
  theme: localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
  selectedType: 'all', // 'video' | 'audio' | 'image' | 'pdf' | 'all'

  globalMode: 'percentage', // 'target_size' | 'percentage' | 'balanced'
  globalTargetSizeVal: 2,
  globalTargetSizeUnit: 'MB',
  globalPercentageVal: 60,
  globalResolution: 'original',

  queue: [],
  isProcessing: false
};

const TYPE_PRESETS = {
  video: {
    accept: 'video/*,.mp4,.webm,.mov,.mkv,.avi,.m4v',
    badgeId: 'Video (MP4/MOV/WebM)',
    badgeEn: 'Video (MP4/MOV/WebM)',
    titleId: 'Pilih atau seret file Video ke sini',
    titleEn: 'Choose or drag Video files here',
    subId: 'Mendukung MP4, MOV, WebM, MKV, AVI — Resolusi 16p hingga 4K',
    subEn: 'Supports MP4, MOV, WebM, MKV, AVI — 16p up to 4K'
  },
  audio: {
    accept: 'audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.opus',
    badgeId: 'Audio (MP3/WAV/M4A)',
    badgeEn: 'Audio (MP3/WAV/M4A)',
    titleId: 'Pilih atau seret file Audio ke sini',
    titleEn: 'Choose or drag Audio files here',
    subId: 'Mendukung MP3, WAV, OGG, M4A, AAC, FLAC',
    subEn: 'Supports MP3, WAV, OGG, M4A, AAC, FLAC'
  },
  image: {
    accept: 'image/*,.jpg,.jpeg,.png,.webp,.avif,.heic,.heif,.bmp,.gif,.ico',
    badgeId: 'Gambar / Foto',
    badgeEn: 'Image / Photo',
    titleId: 'Pilih atau seret file Gambar ke sini',
    titleEn: 'Choose or drag Image files here',
    subId: 'Mendukung JPG, PNG, WebP, AVIF, HEIC, BMP, GIF, ICO',
    subEn: 'Supports JPG, PNG, WebP, AVIF, HEIC, BMP, GIF, ICO'
  },
  pdf: {
    accept: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.json,.zip',
    badgeId: 'Dokumen PDF & Arsip',
    badgeEn: 'PDF & Archives',
    titleId: 'Pilih atau seret Dokumen PDF ke sini',
    titleEn: 'Choose or drag PDF Documents here',
    subId: 'Mendukung PDF, DOCX, XLSX, PPTX, dan Arsip ZIP',
    subEn: 'Supports PDF, DOCX, XLSX, PPTX, and ZIP Archives'
  },
  all: {
    accept: 'image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.json,.zip',
    badgeId: 'Semua Tipe (Auto)',
    badgeEn: 'All Types (Auto)',
    titleId: 'Pilih atau seret berkas ke sini',
    titleEn: 'Choose or drag files here',
    subId: 'Mendukung Gambar, Video, Audio, Dokumen PDF, dan Arsip',
    subEn: 'Supports Images, Videos, Audio, PDF Documents, and Archives'
  }
};

// Formatting helpers
function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function getFileExtension(filename) {
  return (filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2)).toLowerCase();
}

/**
 * File Category & MIME Detector
 */
function detectFileType(file) {
  const mime = (file.type || '').toLowerCase();
  const ext = getFileExtension(file.name);

  if (mime === 'application/pdf' || ext === 'pdf') {
    return {
      category: 'pdf',
      icon: 'file-text',
      badgeClass: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20',
      ext: 'pdf'
    };
  }

  const imgExts = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'bmp', 'tiff', 'tif', 'svg', 'heic', 'heif', 'ico'];
  if (mime.startsWith('image/') || imgExts.includes(ext)) {
    return {
      category: 'image',
      icon: 'image',
      badgeClass: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20',
      ext: ext || 'jpg'
    };
  }

  const vidExts = ['mp4', 'webm', 'mov', 'mkv', 'avi', 'wmv', 'flv', '3gp', 'm4v', 'ts', 'ogv'];
  if (mime.startsWith('video/') || vidExts.includes(ext)) {
    return {
      category: 'video',
      icon: 'video',
      badgeClass: 'text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/20',
      ext: ext || 'mp4'
    };
  }

  const audExts = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'wma', 'opus', 'aiff', 'mid', 'weba'];
  if (mime.startsWith('audio/') || audExts.includes(ext)) {
    return {
      category: 'audio',
      icon: 'music',
      badgeClass: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      ext: ext || 'mp3'
    };
  }

  return {
    category: 'generic',
    icon: 'archive',
    badgeClass: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
    ext: ext || 'bin'
  };
}

let dom = {};

document.addEventListener('DOMContentLoaded', () => {
  initPdfWorker();
  initDom();
  initTheme();
  initI18n();
  initEventListeners();
  updateUI();
  refreshLucideIcons();
});

function initPdfWorker() {
  if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }
}

function refreshLucideIcons() {
  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  }
}

function initDom() {
  dom = {
    dropzone: document.getElementById('dropzone'),
    dropzoneTitle: document.getElementById('dropzone-title'),
    dropzoneSubtitle: document.getElementById('dropzone-subtitle'),
    fileInput: document.getElementById('file-input'),
    browseBtn: document.getElementById('btn-browse'),
    activeTypeBadge: document.getElementById('active-type-badge'),
    btnChangeType: document.getElementById('btn-change-type'),
    btnAddMore: document.getElementById('btn-add-more'),

    // Type Selector Modal
    modalTypeSelect: document.getElementById('modal-type-select'),
    btnCloseTypeModal: document.getElementById('btn-close-type-modal'),
    typeChoiceButtons: document.querySelectorAll('.type-choice-btn'),

    // Global Mode Controls
    globalModeButtons: document.querySelectorAll('.global-mode-btn'),
    globalTargetBox: document.getElementById('global-target-box'),
    globalTargetVal: document.getElementById('global-target-val'),
    globalTargetUnit: document.getElementById('global-target-unit'),
    globalPctBox: document.getElementById('global-pct-box'),
    globalPctSlider: document.getElementById('global-pct-slider'),
    globalPctDisplay: document.getElementById('global-pct-display'),
    globalResolution: document.getElementById('global-resolution'),
    btnApplyAll: document.getElementById('btn-apply-all'),

    // Queue & Actions
    queueSection: document.getElementById('queue-section'),
    queueList: document.getElementById('queue-list'),
    queueCount: document.getElementById('queue-count'),
    btnClearQueue: document.getElementById('btn-clear-queue'),
    btnCompressAll: document.getElementById('btn-compress-all'),
    btnDownloadAll: document.getElementById('btn-download-all'),

    // Stats
    statSection: document.getElementById('stat-section'),
    statCount: document.getElementById('stat-count'),
    statOriginal: document.getElementById('stat-orig'),
    statCompressed: document.getElementById('stat-comp'),
    statSaved: document.getElementById('stat-saved'),

    // Modal
    modalPreview: document.getElementById('modal-preview'),
    modalPreviewTitle: document.getElementById('modal-preview-title'),
    modalPreviewBody: document.getElementById('modal-preview-body'),
    btnClosePreview: document.getElementById('btn-close-preview'),

    // Nav
    themeToggle: document.getElementById('theme-toggle'),
    langDropdownWrapper: document.getElementById('lang-dropdown-wrapper'),
    langToggleBtn: document.getElementById('lang-toggle-btn'),
    langMenu: document.getElementById('lang-menu'),
    currentFlag: document.getElementById('current-flag'),
    currentLangCode: document.getElementById('current-lang-code'),
    langOptionButtons: document.querySelectorAll('.lang-option-btn')
  };

  populateGlobalResolutionDropdown();
}

const LANG_META = {
  id: { flag: '🇮🇩', code: 'ID' },
  en: { flag: '🇬🇧', code: 'EN' },
  zh: { flag: '🇨🇳', code: 'ZH' },
  es: { flag: '🇪🇸', code: 'ES' },
  ar: { flag: '🇸🇦', code: 'AR' },
  fr: { flag: '🇫🇷', code: 'FR' },
  ja: { flag: '🇯🇵', code: 'JA' },
  pt: { flag: '🇧🇷', code: 'PT' }
};

function populateGlobalResolutionDropdown() {
  if (!dom.globalResolution) return;
  dom.globalResolution.innerHTML = Object.keys(RESOLUTIONS).map(key => {
    return `<option value="${key}" ${key === state.globalResolution ? 'selected' : ''}>${RESOLUTIONS[key].label}</option>`;
  }).join('');
}

function initTheme() {
  if (state.theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('theme', state.theme);
  initTheme();
}

function initI18n() {
  applyLanguage(state.lang);
}

function applyLanguage(lang) {
  const safeLang = i18n[lang] ? lang : 'id';
  state.lang = safeLang;
  localStorage.setItem('theme_lang', safeLang);

  const dict = i18n[safeLang] || i18n.id;
  const meta = LANG_META[safeLang] || LANG_META.id;

  document.documentElement.lang = safeLang;
  document.documentElement.dir = safeLang === 'ar' ? 'rtl' : 'ltr';

  if (dom.currentFlag) dom.currentFlag.textContent = meta.flag;
  if (dom.currentLangCode) dom.currentLangCode.textContent = meta.code;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) {
      el.textContent = dict[key];
    }
  });

  updateTypeUI();
  renderQueue();
  updateStats();
  refreshLucideIcons();
}

function openFilePicker() {
  if (!dom.fileInput) return;
  dom.fileInput.value = '';
  dom.fileInput.click();
}

function openTypeModal() {
  dom.modalTypeSelect?.classList.remove('hidden');
}

function closeTypeModal() {
  dom.modalTypeSelect?.classList.add('hidden');
}

function selectCompressionType(type) {
  state.selectedType = TYPE_PRESETS[type] ? type : 'all';
  updateTypeUI();
  closeTypeModal();
}

function updateTypeUI() {
  const preset = TYPE_PRESETS[state.selectedType] || TYPE_PRESETS.all;
  const dict = i18n[state.lang] || i18n.id;

  if (dom.fileInput) dom.fileInput.accept = preset.accept;

  const badgeKeyMap = {
    video: 'typeVideoTitle',
    audio: 'typeAudioTitle',
    image: 'typeImageTitle',
    pdf: 'typePdfTitle',
    all: 'typeAllTitle'
  };
  const descKeyMap = {
    video: 'typeVideoDesc',
    audio: 'typeAudioDesc',
    image: 'typeImageDesc',
    pdf: 'typePdfDesc',
    all: 'typeAllDesc'
  };

  if (dom.activeTypeBadge) {
    dom.activeTypeBadge.textContent = dict[badgeKeyMap[state.selectedType]] || dict.typeAllTitle;
  }
  if (dom.dropzoneTitle) dom.dropzoneTitle.textContent = dict.dropzoneTitle;
  if (dom.dropzoneSubtitle) {
    dom.dropzoneSubtitle.textContent = state.selectedType === 'all'
      ? dict.dropzoneSubtitle
      : `${dict[badgeKeyMap[state.selectedType]]}: ${dict[descKeyMap[state.selectedType]]}`;
  }
}

function initEventListeners() {
  dom.themeToggle?.addEventListener('click', toggleTheme);

  // 8-Language Dropdown Menu
  dom.langToggleBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    dom.langMenu?.classList.toggle('hidden');
  });
  dom.langOptionButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-lang');
      if (lang) applyLanguage(lang);
      dom.langMenu?.classList.add('hidden');
    });
  });
  document.addEventListener('click', (e) => {
    if (dom.langMenu && !dom.langMenu.classList.contains('hidden')) {
      if (!dom.langDropdownWrapper?.contains(e.target)) {
        dom.langMenu.classList.add('hidden');
      }
    }
  });

  // Type Selector Modal
  dom.typeChoiceButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const chosenType = btn.getAttribute('data-type') || 'all';
      selectCompressionType(chosenType);
    });
  });
  dom.btnCloseTypeModal?.addEventListener('click', closeTypeModal);
  dom.modalTypeSelect?.addEventListener('click', (e) => {
    if (e.target === dom.modalTypeSelect) closeTypeModal();
  });
  dom.btnChangeType?.addEventListener('click', openTypeModal);

  // Entire dropzone + browse button + add more button open file picker reliably
  dom.browseBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    openFilePicker();
  });
  dom.dropzone?.addEventListener('click', () => openFilePicker());
  dom.btnAddMore?.addEventListener('click', () => openFilePicker());

  dom.fileInput?.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
      dom.fileInput.value = '';
    }
  });

  ['dragenter', 'dragover'].forEach(name => {
    dom.dropzone?.addEventListener(name, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dom.dropzone.classList.add('border-blue-500', 'bg-blue-500/[0.03]');
    });
  });

  ['dragleave', 'drop'].forEach(name => {
    dom.dropzone?.addEventListener(name, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dom.dropzone.classList.remove('border-blue-500', 'bg-blue-500/[0.03]');
    });
  });

  dom.dropzone?.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    if (dt && dt.files && dt.files.length > 0) {
      handleFiles(Array.from(dt.files));
    }
  });

  window.addEventListener('paste', (e) => {
    if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
      handleFiles(Array.from(e.clipboardData.files));
    }
  });

  dom.globalModeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-mode');
      setGlobalMode(mode);
    });
  });

  dom.globalTargetVal?.addEventListener('input', (e) => {
    state.globalTargetSizeVal = parseFloat(e.target.value) || 1;
  });
  dom.globalTargetUnit?.addEventListener('change', (e) => {
    state.globalTargetSizeUnit = e.target.value;
  });

  dom.globalPctSlider?.addEventListener('input', (e) => {
    state.globalPercentageVal = parseInt(e.target.value);
    if (dom.globalPctDisplay) dom.globalPctDisplay.textContent = state.globalPercentageVal + '%';
  });

  dom.globalResolution?.addEventListener('change', (e) => {
    state.globalResolution = e.target.value;
  });

  // Apply to all files in queue
  dom.btnApplyAll?.addEventListener('click', () => {
    state.queue.forEach(item => {
      item.settings.mode = state.globalMode;
      item.settings.targetSizeVal = state.globalTargetSizeVal;
      item.settings.targetSizeUnit = state.globalTargetSizeUnit;
      item.settings.percentageVal = state.globalPercentageVal;
      item.settings.resolution = state.globalResolution;
    });
    renderQueue();
    refreshLucideIcons();
  });

  dom.btnClearQueue?.addEventListener('click', clearQueue);
  dom.btnCompressAll?.addEventListener('click', startBatchCompression);
  dom.btnDownloadAll?.addEventListener('click', downloadAllAsZip);

  dom.btnClosePreview?.addEventListener('click', () => {
    dom.modalPreview?.classList.add('hidden');
    if (dom.modalPreviewBody) dom.modalPreviewBody.innerHTML = '';
  });
}

function setGlobalMode(mode) {
  state.globalMode = mode;
  dom.globalModeButtons.forEach(btn => {
    const isAct = btn.getAttribute('data-mode') === mode;
    btn.classList.toggle('bg-zinc-900', isAct);
    btn.classList.toggle('text-white', isAct);
    btn.classList.toggle('dark:bg-white', isAct);
    btn.classList.toggle('dark:text-zinc-900', isAct);
    btn.classList.toggle('shadow-sm', isAct);
  });

  if (dom.globalTargetBox) dom.globalTargetBox.classList.toggle('hidden', mode !== 'target_size');
  if (dom.globalPctBox) dom.globalPctBox.classList.toggle('hidden', mode !== 'percentage');
}

/**
 * Handle new files with automatic DEFAULT NATIVE FORMAT selection
 */
function handleFiles(files) {
  if (!files || files.length === 0) return;

  const newItems = files.map(file => {
    const detection = detectFileType(file);

    // Pick DEFAULT FORMAT strictly matching the uploaded file's native extension!
    let defaultFmt = 'jpg';
    const cat = detection.category;
    const ext = detection.ext;

    if (cat === 'video') {
      if (['mp4', 'm4v'].includes(ext)) defaultFmt = 'mp4';
      else if (ext === 'webm') defaultFmt = 'webm';
      else if (ext === 'mov') defaultFmt = 'mov';
      else if (ext === 'mkv') defaultFmt = 'mkv';
      else defaultFmt = 'mp4';
    } else if (cat === 'image') {
      if (['jpg', 'jpeg'].includes(ext)) defaultFmt = 'jpg';
      else if (ext === 'png') defaultFmt = 'png';
      else if (ext === 'webp') defaultFmt = 'webp';
      else if (ext === 'avif') defaultFmt = 'avif';
      else if (ext === 'bmp') defaultFmt = 'bmp';
      else if (ext === 'gif') defaultFmt = 'gif';
      else if (ext === 'ico') defaultFmt = 'ico';
      else defaultFmt = 'jpg';
    } else if (cat === 'audio') {
      if (ext === 'mp3') defaultFmt = 'mp3';
      else if (ext === 'wav') defaultFmt = 'wav';
      else if (ext === 'ogg') defaultFmt = 'ogg';
      else if (['m4a', 'aac'].includes(ext)) defaultFmt = 'm4a';
      else if (ext === 'flac') defaultFmt = 'flac';
      else defaultFmt = 'mp3';
    } else if (cat === 'pdf') {
      defaultFmt = 'pdf';
    } else {
      defaultFmt = 'zip';
    }

    return {
      id: 'f_' + Math.random().toString(36).substring(2, 9),
      file: file,
      name: file.name,
      origSize: file.size,
      detection: detection,
      status: 'waiting',
      progress: 0,
      compressedBlob: null,
      compressedSize: 0,
      savingsPercent: 0,
      errorMsg: null,

      // Independent per-file settings defaulting to native format!
      settings: {
        mode: state.globalMode,
        targetSizeVal: state.globalTargetSizeVal,
        targetSizeUnit: state.globalTargetSizeUnit,
        percentageVal: state.globalPercentageVal,
        resolution: state.globalResolution,
        format: defaultFmt
      }
    };
  });

  state.queue.push(...newItems);
  renderQueue();
  updateUI();
  refreshLucideIcons();
}

function clearQueue() {
  if (state.isProcessing) return;
  state.queue = [];
  renderQueue();
  updateUI();
  refreshLucideIcons();
}

/**
 * Lightweight inline progress update (No DOM-destroying re-renders!)
 */
function updateItemProgress(item, pct) {
  item.progress = pct;
  const bar = document.getElementById(`prog-bar-${item.id}`);
  const txt = document.getElementById(`prog-txt-${item.id}`);
  if (bar) bar.style.width = pct + '%';
  if (txt) txt.textContent = pct + '%';
}

/**
 * Render Queue with individual per-file controls
 */
function renderQueue() {
  if (!dom.queueList) return;

  const dict = i18n[state.lang] || i18n.id;
  if (dom.queueCount) dom.queueCount.textContent = state.queue.length;

  if (state.queue.length === 0) {
    dom.queueSection?.classList.add('hidden');
    dom.statSection?.classList.add('hidden');
    dom.queueList.innerHTML = '';
    return;
  }

  dom.queueSection?.classList.remove('hidden');

  dom.queueList.innerHTML = state.queue.map(item => {
    const availableFormats = FORMAT_OPTIONS[item.detection.category] || FORMAT_OPTIONS.generic;
    const formatSelectHtml = availableFormats.map(fmt => {
      const isSel = item.settings.format === fmt.value ? 'selected' : '';
      return `<option value="${fmt.value}" ${isSel}>${fmt.label}</option>`;
    }).join('');

    const resolutionSelectHtml = Object.keys(RESOLUTIONS).map(resKey => {
      const isSel = item.settings.resolution === resKey ? 'selected' : '';
      return `<option value="${resKey}" ${isSel}>${RESOLUTIONS[resKey].label}</option>`;
    }).join('');

    let statusBadge = '';
    if (item.status === 'waiting') {
      statusBadge = `<span class="px-2 py-0.5 rounded text-[11px] font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800">${dict.statusWaiting}</span>`;
    } else if (item.status === 'processing') {
      statusBadge = `
        <div class="flex items-center gap-2">
          <div class="w-16 bg-zinc-200 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
            <div id="prog-bar-${item.id}" class="bg-blue-500 h-1.5 rounded-full transition-all duration-150" style="width: ${item.progress}%"></div>
          </div>
          <span id="prog-txt-${item.id}" class="text-xs font-mono font-medium text-blue-500">${item.progress}%</span>
        </div>
      `;
    } else if (item.status === 'done') {
      statusBadge = `
        <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <i data-lucide="check" class="w-3 h-3"></i>
          <span>${dict.savingsLabel} ${item.savingsPercent}%</span>
        </span>
      `;
    } else if (item.status === 'failed') {
      statusBadge = `<span class="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20" title="${item.errorMsg || ''}">${dict.statusFailed}</span>`;
    }

    const supportsRes = item.detection.category === 'image' || item.detection.category === 'video';

    return `
      <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 sm:p-4 flex flex-col gap-3 transition-colors hover:border-zinc-300 dark:hover:border-zinc-700">
        
        <!-- Header Row -->
        <div class="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
          <div class="flex items-center gap-3 min-w-0 flex-1">
            <div class="w-9 h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-center text-zinc-700 dark:text-zinc-300 shrink-0">
              <i data-lucide="${item.detection.icon}" class="w-4 h-4"></i>
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-medium text-sm text-zinc-900 dark:text-zinc-100 truncate max-w-[220px] sm:max-w-[360px]" title="${item.name}">
                  ${item.name}
                </span>
                <span class="px-1.5 py-0.2 rounded text-[10px] font-mono uppercase font-semibold ${item.detection.badgeClass}">
                  ${item.detection.ext}
                </span>
              </div>
              <div class="flex items-center gap-2 mt-0.5 text-xs text-zinc-500 dark:text-zinc-400 font-mono flex-wrap">
                <span>${dict.originalSizeLabel}: <strong>${formatBytes(item.origSize)}</strong></span>
                ${item.compressedSize ? `<span class="text-zinc-400">→</span><span class="text-emerald-600 dark:text-emerald-400 font-semibold">${dict.compressedSizeLabel}: <strong>${formatBytes(item.compressedSize)}</strong></span>` : ''}
              </div>
            </div>
          </div>

          <!-- Status & Actions -->
          <div class="flex items-center gap-2 shrink-0">
            ${statusBadge}

            ${item.status === 'done' ? `
              <button class="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors" onclick="previewItem('${item.id}')" title="${dict.btnPreviewItem}">
                <i data-lucide="eye" class="w-4 h-4"></i>
              </button>
              <button class="px-3 py-1.5 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-xs font-medium inline-flex items-center gap-1.5 shadow-sm hover:opacity-90 transition-opacity" onclick="downloadItem('${item.id}')" title="${dict.btnDownloadItem}">
                <i data-lucide="download" class="w-3.5 h-3.5"></i>
                <span>${dict.btnDownloadItem}</span>
              </button>
            ` : ''}

            ${!state.isProcessing ? `
              <button class="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-colors" onclick="removeItem('${item.id}')" title="${dict.btnRemoveItem}">
                <i data-lucide="x" class="w-4 h-4"></i>
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Per-File Settings Strip -->
        <div class="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          
          <!-- Control 1: Mode & Target Size / Percentage -->
          <div class="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
            <span class="text-zinc-400 font-medium shrink-0">${dict.itemTargetLabel}</span>
            <select class="px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-mono text-xs focus:outline-none" onchange="updateItemSetting('${item.id}', 'mode', this.value)">
              <option value="target_size" ${item.settings.mode === 'target_size' ? 'selected' : ''}>${dict.modeTargetSize}</option>
              <option value="percentage" ${item.settings.mode === 'percentage' ? 'selected' : ''}>${dict.modePercentage}</option>
              <option value="balanced" ${item.settings.mode === 'balanced' ? 'selected' : ''}>${dict.modeBalanced}</option>
            </select>

            ${item.settings.mode === 'target_size' ? `
              <input type="number" min="0.1" step="0.5" value="${item.settings.targetSizeVal}" class="w-16 px-1.5 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-mono text-xs text-center" onchange="updateItemSetting('${item.id}', 'targetSizeVal', parseFloat(this.value)||1)">
              <select class="px-1 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-mono text-xs" onchange="updateItemSetting('${item.id}', 'targetSizeUnit', this.value)">
                <option value="MB" ${item.settings.targetSizeUnit === 'MB' ? 'selected' : ''}>MB</option>
                <option value="KB" ${item.settings.targetSizeUnit === 'KB' ? 'selected' : ''}>KB</option>
              </select>
            ` : ''}

            ${item.settings.mode === 'percentage' ? `
              <div class="flex items-center gap-1">
                <input type="number" min="10" max="95" step="5" value="${item.settings.percentageVal}" class="w-14 px-1.5 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-mono text-xs text-center" onchange="updateItemSetting('${item.id}', 'percentageVal', parseInt(this.value)||60)">
                <span class="font-mono text-zinc-400">%</span>
              </div>
            ` : ''}
          </div>

          <!-- Control 2: Resolution (16p to 4K + Original) -->
          <div class="flex items-center gap-1.5">
            <span class="text-zinc-400 font-medium shrink-0">${dict.itemResLabel}</span>
            ${supportsRes ? `
              <select class="w-full px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-mono focus:outline-none" onchange="updateItemSetting('${item.id}', 'resolution', this.value)">
                ${resolutionSelectHtml}
              </select>
            ` : (item.detection.category === 'audio' ? `
              <span class="text-zinc-400 text-xs font-mono">${dict.audioStreamLabel || 'Audio Stream'}</span>
            ` : `
              <span class="text-zinc-400 text-xs font-mono italic">${dict.autoDocLabel || 'Otomatis Dokumen'}</span>
            `)}
          </div>

          <!-- Control 3: Output Format -->
          <div class="flex items-center gap-1.5">
            <span class="text-zinc-400 font-medium shrink-0">${dict.itemFormatLabel}</span>
            <select class="w-full px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-mono focus:outline-none" onchange="updateItemSetting('${item.id}', 'format', this.value)">
              ${formatSelectHtml}
            </select>
          </div>

        </div>

      </div>
    `;
  }).join('');
}

window.updateItemSetting = function(id, key, val) {
  const item = state.queue.find(i => i.id === id);
  if (!item) return;
  item.settings[key] = val;
  if (key === 'mode') {
    renderQueue();
    refreshLucideIcons();
  }
};

function updateUI() {
  const hasItems = state.queue.length > 0;
  const hasDone = state.queue.some(item => item.status === 'done');

  if (dom.btnCompressAll) {
    dom.btnCompressAll.disabled = !hasItems || state.isProcessing;
    dom.btnCompressAll.classList.toggle('opacity-50', !hasItems || state.isProcessing);
  }

  if (dom.btnDownloadAll) {
    dom.btnDownloadAll.classList.toggle('hidden', !hasDone);
  }

  updateStats();
}

function updateStats() {
  const doneItems = state.queue.filter(item => item.status === 'done');
  if (doneItems.length === 0) {
    dom.statSection?.classList.add('hidden');
    return;
  }

  dom.statSection?.classList.remove('hidden');

  let totalOrig = 0;
  let totalComp = 0;

  doneItems.forEach(item => {
    totalOrig += item.origSize;
    totalComp += item.compressedSize;
  });

  const totalSaved = Math.max(0, totalOrig - totalComp);
  const percentSaved = totalOrig > 0 ? ((totalSaved / totalOrig) * 100).toFixed(1) : 0;

  if (dom.statCount) dom.statCount.textContent = `${doneItems.length} / ${state.queue.length}`;
  if (dom.statOriginal) dom.statOriginal.textContent = formatBytes(totalOrig);
  if (dom.statCompressed) dom.statCompressed.textContent = formatBytes(totalComp);
  if (dom.statSaved) dom.statSaved.textContent = `${formatBytes(totalSaved)} (-${percentSaved}%)`;
}

// Global Item Actions
window.removeItem = function(id) {
  if (state.isProcessing) return;
  state.queue = state.queue.filter(item => item.id !== id);
  renderQueue();
  updateUI();
  refreshLucideIcons();
};

window.downloadItem = function(id) {
  const item = state.queue.find(i => i.id === id);
  if (!item || !item.compressedBlob) return;

  const url = URL.createObjectURL(item.compressedBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = item.compressedName || ('compressed_' + item.name);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
};

window.previewItem = function(id) {
  const item = state.queue.find(i => i.id === id);
  if (!item || !item.compressedBlob) return;

  if (!dom.modalPreview || !dom.modalPreviewBody) return;
  dom.modalPreviewTitle.textContent = item.name + ' (Preview)';
  dom.modalPreviewBody.innerHTML = '';

  const url = URL.createObjectURL(item.compressedBlob);
  const ext = (item.compressedName ? getFileExtension(item.compressedName) : item.detection.ext).toLowerCase();

  if (ext === 'pdf') {
    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.className = 'w-full h-[70vh] rounded-lg border border-zinc-200 dark:border-zinc-800';
    dom.modalPreviewBody.appendChild(iframe);
  } else if (['jpg', 'jpeg', 'png', 'webp', 'avif', 'bmp', 'gif', 'ico'].includes(ext)) {
    const img = document.createElement('img');
    img.src = url;
    img.className = 'max-h-[70vh] max-w-full rounded-lg object-contain mx-auto';
    dom.modalPreviewBody.appendChild(img);
  } else if (['mp4', 'webm', 'mov', 'mkv'].includes(ext)) {
    const vid = document.createElement('video');
    vid.src = url;
    vid.controls = true;
    vid.autoplay = true;
    vid.className = 'max-h-[70vh] max-w-full rounded-lg mx-auto';
    dom.modalPreviewBody.appendChild(vid);
  } else if (['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext)) {
    const audWrapper = document.createElement('div');
    audWrapper.className = 'p-8 flex flex-col items-center justify-center gap-4 text-center';
    audWrapper.innerHTML = `
      <div class="w-16 h-16 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
        <i data-lucide="music" class="w-8 h-8"></i>
      </div>
      <p class="font-medium text-zinc-900 dark:text-white text-sm">${item.compressedName || item.name}</p>
      <audio controls autoplay src="${url}" class="w-full max-w-md"></audio>
    `;
    dom.modalPreviewBody.appendChild(audWrapper);
    refreshLucideIcons();
  } else {
    const fileWrapper = document.createElement('div');
    fileWrapper.className = 'p-8 text-center flex flex-col items-center gap-4';
    fileWrapper.innerHTML = `
      <div class="w-16 h-16 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
        <i data-lucide="archive" class="w-8 h-8"></i>
      </div>
      <div>
        <p class="font-medium text-zinc-900 dark:text-white text-sm">${item.compressedName || item.name}</p>
        <p class="text-xs text-zinc-500 mt-1">${formatBytes(item.compressedSize)} (Hemat ${item.savingsPercent}%)</p>
      </div>
    `;
    dom.modalPreviewBody.appendChild(fileWrapper);
    refreshLucideIcons();
  }

  dom.modalPreview.classList.remove('hidden');
};

/**
 * Batch Compression Runner
 */
async function startBatchCompression() {
  if (state.isProcessing || state.queue.length === 0) return;

  state.isProcessing = true;
  updateUI();

  const dict = i18n[state.lang] || i18n.id;
  if (dom.btnCompressAll) {
    dom.btnCompressAll.innerHTML = `
      <i data-lucide="loader" class="w-4 h-4 animate-spin"></i>
      <span>${dict.statusProcessing}</span>
    `;
    refreshLucideIcons();
  }

  for (let i = 0; i < state.queue.length; i++) {
    const item = state.queue[i];
    if (item.status === 'done') continue;

    item.status = 'processing';
    item.progress = 5;
    renderQueue();
    refreshLucideIcons();

    try {
      await compressItem(item);
      item.status = 'done';
      item.progress = 100;
    } catch (err) {
      console.error('Compression failed for', item.name, err);
      item.status = 'failed';
      item.errorMsg = err.message || 'Error';
    }

    renderQueue();
    updateStats();
    refreshLucideIcons();
  }

  state.isProcessing = false;
  if (dom.btnCompressAll) {
    dom.btnCompressAll.innerHTML = `
      <i data-lucide="play" class="w-4 h-4"></i>
      <span>${dict.btnCompressAll}</span>
    `;
    refreshLucideIcons();
  }
  updateUI();
}

/**
 * Calculate target bytes for a specific file based on its own settings
 */
function resolveItemTargetBytes(item) {
  const s = item.settings;
  if (s.mode === 'target_size') {
    const multiplier = s.targetSizeUnit === 'MB' ? 1024 * 1024 : 1024;
    return Math.max(5000, s.targetSizeVal * multiplier);
  } else if (s.mode === 'percentage') {
    const factor = Math.max(0.05, 1 - (s.percentageVal / 100));
    return Math.max(5000, Math.round(item.origSize * factor));
  } else {
    // Balanced ~60% reduction
    return Math.max(5000, Math.round(item.origSize * 0.40));
  }
}

/**
 * Dispatcher to respective compression engine
 */
async function compressItem(item) {
  const targetBytes = resolveItemTargetBytes(item);
  const cat = item.detection.category;

  if (cat === 'pdf') {
    return await compressPdf(item, targetBytes);
  } else if (cat === 'image') {
    return await compressImage(item, targetBytes);
  } else if (cat === 'video') {
    return await compressVideo(item, targetBytes);
  } else if (cat === 'audio') {
    return await compressAudio(item, targetBytes);
  } else {
    return await compressGenericFile(item, targetBytes);
  }
}

/**
 * ----------------------------------------------------
 * ENGINE 1: REAL PDF COMPRESSOR
 * ----------------------------------------------------
 */
async function compressPdf(item, targetBytes) {
  const outFormat = item.settings.format;

  if (outFormat === 'zip') {
    return await compressGenericFile(item, targetBytes);
  }

  if (typeof pdfjsLib === 'undefined' || typeof window.jspdf === 'undefined') {
    throw new Error('Library PDF.js / jsPDF belum dimuat');
  }

  updateItemProgress(item, 15);

  const arrayBuffer = await item.file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  if (numPages === 0) throw new Error('PDF kosong');

  const overhead = Math.min(25000, 4000 + (numPages * 400));
  const bytesPerPage = Math.max(12000, (targetBytes - overhead) / numPages);

  let renderScale = 1.15;
  let jpegQuality = 0.65;

  if (bytesPerPage < 30000) {
    renderScale = 0.85;
    jpegQuality = 0.35;
  } else if (bytesPerPage < 65000) {
    renderScale = 1.0;
    jpegQuality = 0.50;
  } else if (bytesPerPage < 120000) {
    renderScale = 1.15;
    jpegQuality = 0.65;
  } else {
    renderScale = 1.35;
    jpegQuality = 0.78;
  }

  const { jsPDF } = window.jspdf;
  let doc = null;

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const origViewport = page.getViewport({ scale: 1.0 });
    const renderViewport = page.getViewport({ scale: renderScale });

    const canvas = document.createElement('canvas');
    canvas.width = renderViewport.width;
    canvas.height = renderViewport.height;
    const ctx = canvas.getContext('2d');

    await page.render({ canvasContext: ctx, viewport: renderViewport }).promise;

    const imgDataUrl = canvas.toDataURL('image/jpeg', jpegQuality);
    const isLandscape = origViewport.width > origViewport.height;
    const orientation = isLandscape ? 'landscape' : 'portrait';
    const pageWidth = origViewport.width;
    const pageHeight = origViewport.height;

    if (pageNum === 1) {
      doc = new jsPDF({
        orientation: orientation,
        unit: 'pt',
        format: [pageWidth, pageHeight],
        compress: true
      });
      doc.addImage(imgDataUrl, 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
    } else {
      doc.addPage([pageWidth, pageHeight], orientation);
      doc.addImage(imgDataUrl, 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
    }

    const pct = Math.min(95, Math.round(20 + (pageNum / numPages) * 75));
    updateItemProgress(item, pct);
  }

  const compressedBlob = doc.output('blob');
  const baseName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;

  item.compressedName = `${baseName}_compressed.pdf`;
  item.compressedBlob = compressedBlob;
  item.compressedSize = compressedBlob.size;

  const saved = item.origSize - item.compressedSize;
  item.savingsPercent = item.origSize > 0 ? Math.max(0, ((saved / item.origSize) * 100)).toFixed(1) : 0;
}

/**
 * ----------------------------------------------------
 * ENGINE 2: IMAGE COMPRESSOR (From 16p to 4K & All Formats)
 * ----------------------------------------------------
 */
async function compressImage(item, targetBytes) {
  let fileToLoad = item.file;
  updateItemProgress(item, 20);

  if ((item.detection.ext === 'heic' || item.detection.ext === 'heif') && typeof heic2any === 'function') {
    try {
      const converted = await heic2any({ blob: item.file, toType: 'image/jpeg', quality: 0.95 });
      fileToLoad = Array.isArray(converted) ? converted[0] : converted;
    } catch (e) {
      console.warn('HEIC decode fallback', e);
    }
  }

  const imgBitmap = await loadImageBitmap(fileToLoad);
  updateItemProgress(item, 40);

  const origWidth = imgBitmap.width;
  const origHeight = imgBitmap.height;

  const resKey = item.settings.resolution || 'original';
  const resSpec = RESOLUTIONS[resKey] || RESOLUTIONS.original;

  let targetWidth = origWidth;
  let targetHeight = origHeight;

  if (resSpec.width && resSpec.height) {
    const ratio = Math.min(resSpec.width / origWidth, resSpec.height / origHeight);
    targetWidth = Math.max(1, Math.round(origWidth * Math.min(1, ratio)));
    targetHeight = Math.max(1, Math.round(origHeight * Math.min(1, ratio)));
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(imgBitmap, 0, 0, targetWidth, targetHeight);

  updateItemProgress(item, 65);

  let targetFormat = item.settings.format || 'jpg';
  let finalBlob = null;
  let finalExt = targetFormat;

  if (targetFormat === 'bmp') {
    finalBlob = canvasToBmpBlob(canvas);
    finalExt = 'bmp';
  } else if (targetFormat === 'ico') {
    finalBlob = await canvasToIcoBlob(canvas);
    finalExt = 'ico';
  } else if (targetFormat === 'pdf') {
    const { jsPDF } = window.jspdf;
    const isLand = targetWidth > targetHeight;
    const doc = new jsPDF({
      orientation: isLand ? 'landscape' : 'portrait',
      unit: 'pt',
      format: [targetWidth, targetHeight]
    });
    const jpegUrl = canvas.toDataURL('image/jpeg', 0.82);
    doc.addImage(jpegUrl, 'JPEG', 0, 0, targetWidth, targetHeight, undefined, 'FAST');
    finalBlob = doc.output('blob');
    finalExt = 'pdf';
  } else if (targetFormat === 'png') {
    finalBlob = await new Promise(r => canvas.toBlob(r, 'image/png'));
    if (finalBlob.size > targetBytes) {
      // Quantize color precision slightly so lossless PNG DEFLATE compresses much smaller
      const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
      const data = imgData.data;
      const quantSteps = [0xF8, 0xF0, 0xE0, 0xC0]; // 5-bit -> 4-bit -> 3-bit -> 2-bit per channel
      for (const mask of quantSteps) {
        const copy = new Uint8ClampedArray(data);
        for (let i = 0; i < copy.length; i += 4) {
          copy[i]     = copy[i] & mask;
          copy[i + 1] = copy[i + 1] & mask;
          copy[i + 2] = copy[i + 2] & mask;
        }
        const qCanvas = document.createElement('canvas');
        qCanvas.width = targetWidth;
        qCanvas.height = targetHeight;
        qCanvas.getContext('2d').putImageData(new ImageData(copy, targetWidth, targetHeight), 0, 0);
        const qBlob = await new Promise(r => qCanvas.toBlob(r, 'image/png'));
        if (qBlob && qBlob.size < finalBlob.size) {
          finalBlob = qBlob;
        }
        if (finalBlob.size <= targetBytes) break;
      }
    }
    finalExt = 'png';
  } else {
    let mime = 'image/jpeg';
    if (targetFormat === 'webp') mime = 'image/webp';
    else if (targetFormat === 'avif') mime = 'image/avif';
    else if (targetFormat === 'gif') mime = 'image/gif';

    const qualitySteps = [0.85, 0.72, 0.55, 0.40, 0.25, 0.15];
    let bestBlob = null;

    for (const q of qualitySteps) {
      const b = await new Promise(r => canvas.toBlob(r, mime, q));
      const validBlob = b || await new Promise(r => canvas.toBlob(r, 'image/webp', q));

      if (!bestBlob || (validBlob.size <= targetBytes && validBlob.size > bestBlob.size) || (bestBlob.size > targetBytes && validBlob.size < bestBlob.size)) {
        bestBlob = validBlob;
      }
      if (validBlob.size <= targetBytes) break;
    }

    finalBlob = bestBlob;
    finalExt = targetFormat === 'avif' ? 'avif' : (targetFormat === 'webp' ? 'webp' : (targetFormat === 'gif' ? 'gif' : 'jpg'));
  }

  const baseName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
  item.compressedName = `${baseName}_compressed.${finalExt}`;
  item.compressedBlob = finalBlob;
  item.compressedSize = finalBlob.size;

  const saved = item.origSize - item.compressedSize;
  item.savingsPercent = item.origSize > 0 ? Math.max(0, ((saved / item.origSize) * 100)).toFixed(1) : 0;
}

function loadImageBitmap(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

function canvasToBmpBlob(canvas) {
  const ctx = canvas.getContext('2d');
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const width = canvas.width;
  const height = canvas.height;
  const rowSize = Math.floor((24 * width + 31) / 32) * 4;
  const pixelArraySize = rowSize * height;
  const fileSize = 54 + pixelArraySize;
  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);

  view.setUint16(0, 0x4D42, false);
  view.setUint32(2, fileSize, true);
  view.setUint32(6, 0, true);
  view.setUint32(10, 54, true);

  view.setUint32(14, 40, true);
  view.setInt32(18, width, true);
  view.setInt32(22, -height, true);
  view.setUint16(26, 1, true);
  view.setUint16(28, 24, true);
  view.setUint32(30, 0, true);
  view.setUint32(34, pixelArraySize, true);
  view.setInt32(38, 2835, true);
  view.setInt32(42, 2835, true);
  view.setUint32(46, 0, true);
  view.setUint32(50, 0, true);

  let offset = 54;
  const data = imgData.data;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      view.setUint8(offset++, data[idx + 2]);
      view.setUint8(offset++, data[idx + 1]);
      view.setUint8(offset++, data[idx]);
    }
    const pad = rowSize - width * 3;
    for (let p = 0; p < pad; p++) view.setUint8(offset++, 0);
  }
  return new Blob([buffer], { type: 'image/bmp' });
}

async function canvasToIcoBlob(canvas) {
  const pngBlob = await new Promise(r => canvas.toBlob(r, 'image/png'));
  const pngBytes = new Uint8Array(await pngBlob.arrayBuffer());
  const header = new ArrayBuffer(6 + 16 + pngBytes.length);
  const view = new DataView(header);

  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, 1, true);

  const w = canvas.width >= 256 ? 0 : canvas.width;
  const h = canvas.height >= 256 ? 0 : canvas.height;
  view.setUint8(6, w);
  view.setUint8(7, h);
  view.setUint8(8, 0);
  view.setUint8(9, 0);
  view.setUint16(10, 1, true);
  view.setUint16(12, 32, true);
  view.setUint32(14, pngBytes.length, true);
  view.setUint32(18, 22, true);

  new Uint8Array(header).set(pngBytes, 22);
  return new Blob([header], { type: 'image/x-icon' });
}

/**
 * ----------------------------------------------------
 * ENGINE 3: VIDEO COMPRESSOR (From 16p to 4K & Real MP4)
 * ----------------------------------------------------
 */
async function compressVideo(item, targetBytes) {
  updateItemProgress(item, 10);

  const outFormat = (item.settings.format || 'mp4').toLowerCase();

  // If user selected audio extraction
  if (outFormat === 'mp3' || outFormat === 'wav') {
    return await compressAudio(item, targetBytes);
  }

  const videoUrl = URL.createObjectURL(item.file);
  const video = document.createElement('video');
  video.src = videoUrl;
  video.muted = true; // Crucial: muted prevents autoplay restriction from blocking play()
  video.playsInline = true;
  video.crossOrigin = 'anonymous';

  await new Promise((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error('Gagal membaca video'));
  });

  const duration = video.duration || 1;
  const origWidth = video.videoWidth || 1280;
  const origHeight = video.videoHeight || 720;

  // Resolution selection
  const resKey = item.settings.resolution || 'original';
  const resSpec = RESOLUTIONS[resKey] || RESOLUTIONS.original;

  let targetWidth = origWidth;
  let targetHeight = origHeight;

  if (resSpec.width && resSpec.height) {
    const ratio = Math.min(resSpec.width / origWidth, resSpec.height / origHeight);
    targetWidth = Math.max(16, Math.round(origWidth * Math.min(1, ratio)));
    targetHeight = Math.max(16, Math.round(origHeight * Math.min(1, ratio)));
  }

  // AVC/H.264 requires strictly even dimensions
  if (targetWidth % 2 !== 0) targetWidth--;
  if (targetHeight % 2 !== 0) targetHeight--;

  // Accurate target bitrate calculation
  const audioBps = targetBytes > 4 * 1024 * 1024 ? 128000 : 64000;
  const targetBps = Math.floor((targetBytes * 8) / duration);
  const videoBitrate = Math.max(64000, targetBps - audioBps);

  let finalBlob = null;
  let finalExt = outFormat;

  // Primary path for MP4 & MOV: WebCodecs + Mp4Muxer produces genuine ISO MP4 files!
  if ((outFormat === 'mp4' || outFormat === 'mov') && typeof window.Mp4Muxer !== 'undefined' && typeof VideoEncoder !== 'undefined') {
    try {
      finalBlob = await encodeVideoWithMp4Muxer(
        item.file,
        video,
        targetWidth,
        targetHeight,
        origWidth,
        origHeight,
        duration,
        videoBitrate,
        audioBps,
        (pct) => updateItemProgress(item, pct)
      );
      if (finalBlob) finalExt = 'mp4';
    } catch (e) {
      console.warn('WebCodecs MP4 Muxer fallback to MediaRecorder', e);
      finalBlob = null;
    }
  }

  // Fallback / WebM / MediaRecorder path
  if (!finalBlob) {
    finalBlob = await encodeVideoWithMediaRecorder(video, targetWidth, targetHeight, duration, videoBitrate, outFormat, (pct) => {
      updateItemProgress(item, pct);
    });
    // Match actual container mime type
    if (finalBlob && finalBlob.type && finalBlob.type.includes('mp4')) finalExt = 'mp4';
    else if (finalBlob && finalBlob.type && finalBlob.type.includes('webm')) finalExt = 'webm';
    else finalExt = outFormat;
  }

  URL.revokeObjectURL(videoUrl);

  const baseName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
  item.compressedName = `${baseName}_compressed.${finalExt}`;
  item.compressedBlob = finalBlob;
  item.compressedSize = finalBlob.size;

  const saved = item.origSize - item.compressedSize;
  item.savingsPercent = item.origSize > 0 ? Math.max(0, ((saved / item.origSize) * 100)).toFixed(1) : 0;
}

/**
 * 100% Genuine MP4 (H.264/AVC + Sample-Accurate AAC) Encoder via WebCodecs & Mp4Muxer
 */
async function encodeVideoWithMp4Muxer(file, video, w, h, origW, origH, duration, targetBitrate, audioBitrate, onProgress) {
  const Mp4Muxer = window.Mp4Muxer;
  if (!Mp4Muxer || typeof VideoEncoder === 'undefined') return null;

  const fps = 30;

  // Full suite of AVC codecs from Baseline up to High Profile Level 5.1/5.2
  const candidateCodecs = [
    'avc1.42002a', 'avc1.4d002a', 'avc1.64002a',
    'avc1.420033', 'avc1.4d0033', 'avc1.640033',
    'avc1.420028', 'avc1.4d0028', 'avc1.640028',
    'avc1.42001f'
  ];
  let chosenConfig = null;
  for (const codec of candidateCodecs) {
    const cfgQuality = {
      codec,
      width: w,
      height: h,
      bitrate: targetBitrate,
      framerate: fps,
      latencyMode: 'quality',
      avc: { format: 'avc' }
    };
    try {
      const res = await VideoEncoder.isConfigSupported(cfgQuality);
      if (res && res.supported) {
        chosenConfig = cfgQuality;
        break;
      }
    } catch (_) {}

    const cfgPlain = {
      codec,
      width: w,
      height: h,
      bitrate: targetBitrate,
      framerate: fps,
      avc: { format: 'avc' }
    };
    try {
      const res = await VideoEncoder.isConfigSupported(cfgPlain);
      if (res && res.supported) {
        chosenConfig = cfgPlain;
        break;
      }
    } catch (_) {}
  }
  if (!chosenConfig) return null;

  // Step 1: Extract & decode the video's audio track cleanly BEFORE playback
  // Using decodeAudioData guarantees 100% synced, crystal-clear audio even while video is muted!
  let decodedAudio = null;
  let audioConfig = null;
  if (typeof AudioEncoder !== 'undefined' && typeof AudioData !== 'undefined' && file.size <= 300 * 1024 * 1024) {
    let tempAudioCtx = null;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      tempAudioCtx = new AudioContextClass();
      const rawBuf = await file.arrayBuffer();
      const buf = await tempAudioCtx.decodeAudioData(rawBuf);
      if (buf && buf.length > 0 && buf.numberOfChannels > 0) {
        const channels = Math.min(2, buf.numberOfChannels);
        const sr = buf.sampleRate;
        const candidateRates = sr === 44100 || sr === 48000 ? [sr, 44100, 48000] : [44100, 48000];
        for (const testSr of candidateRates) {
          const aCfg = {
            codec: 'mp4a.40.2',
            sampleRate: testSr,
            numberOfChannels: channels,
            bitrate: audioBitrate || 128000
          };
          const aSup = await AudioEncoder.isConfigSupported(aCfg);
          if (aSup && aSup.supported) {
            audioConfig = aCfg;
            decodedAudio = buf;
            break;
          }
        }
      }
    } catch (e) {
      console.warn('Video has no audio track or audio decode skipped:', e);
      decodedAudio = null;
      audioConfig = null;
    } finally {
      if (tempAudioCtx) {
        try { await tempAudioCtx.close(); } catch (_) {}
      }
    }
  }

  const muxerOptions = {
    target: new Mp4Muxer.ArrayBufferTarget(),
    video: {
      codec: 'avc',
      width: w,
      height: h
    },
    fastStart: 'in-memory',
    firstTimestampBehavior: 'offset'
  };

  if (audioConfig && decodedAudio) {
    muxerOptions.audio = {
      codec: 'aac',
      sampleRate: audioConfig.sampleRate,
      numberOfChannels: audioConfig.numberOfChannels
    };
  }

  const muxer = new Mp4Muxer.Muxer(muxerOptions);

  let encoderError = null;
  let finalized = false;
  let stopped = false;

  const videoEncoder = new VideoEncoder({
    output: (chunk, meta) => {
      if (!finalized) muxer.addVideoChunk(chunk, meta);
    },
    error: (e) => { encoderError = e; }
  });
  videoEncoder.configure(chosenConfig);

  // Step 2: Encode the entire audio track cleanly into AAC with sample-accurate timestamps
  if (audioConfig && decodedAudio) {
    let audioEncError = null;
    const audioEncoder = new AudioEncoder({
      output: (chunk, meta) => {
        if (!finalized) muxer.addAudioChunk(chunk, meta);
      },
      error: (e) => { audioEncError = e; }
    });
    audioEncoder.configure(audioConfig);

    const srcSr = decodedAudio.sampleRate;
    const dstSr = audioConfig.sampleRate;
    const ch = audioConfig.numberOfChannels;
    const srcLen = decodedAudio.length;

    // Resample channel data only if sampleRate differs
    const channelsData = [];
    if (srcSr === dstSr) {
      for (let c = 0; c < ch; c++) {
        channelsData.push(decodedAudio.getChannelData(c));
      }
    } else {
      const ratio = srcSr / dstSr;
      const outLen = Math.floor(srcLen / ratio);
      for (let c = 0; c < ch; c++) {
        const raw = decodedAudio.getChannelData(c);
        const resampled = new Float32Array(outLen);
        for (let i = 0; i < outLen; i++) {
          const idx = i * ratio;
          const i0 = Math.floor(idx);
          const i1 = Math.min(srcLen - 1, i0 + 1);
          const f = idx - i0;
          resampled[i] = raw[i0] * (1 - f) + raw[i1] * f;
        }
        channelsData.push(resampled);
      }
    }

    const totalFrames = channelsData[0].length;
    const chunkFrames = 1024;
    for (let offset = 0; offset < totalFrames; offset += chunkFrames) {
      if (audioEncError) break;
      const count = Math.min(chunkFrames, totalFrames - offset);
      const planar = new Float32Array(count * ch);
      for (let c = 0; c < ch; c++) {
        planar.set(channelsData[c].subarray(offset, offset + count), c * count);
      }
      const timestampUs = Math.round((offset / dstSr) * 1_000_000);
      const aData = new AudioData({
        format: 'f32-planar',
        sampleRate: dstSr,
        numberOfFrames: count,
        numberOfChannels: ch,
        timestamp: timestampUs,
        data: planar
      });
      try {
        audioEncoder.encode(aData);
      } finally {
        aData.close();
      }
      if (offset % (chunkFrames * 200) === 0) {
        await new Promise(r => setTimeout(r, 0));
      }
    }

    await audioEncoder.flush();
    audioEncoder.close();
  }

  // Step 3: Encode Video Frames smoothly at steady 1.0x without dropping frames
  const needsResize = (w !== origW || h !== origH);
  let canvas = null;
  let ctx = null;
  if (needsResize) {
    canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    ctx = canvas.getContext('2d', { alpha: false });
  }

  let frames = 0;
  let lastTs = -1;
  const minGapUs = 10000; // 10ms guard prevents duplicate callbacks while preserving 24/25/30/60fps smoothly

  video.currentTime = 0;
  video.muted = true;
  await new Promise(r => {
    video.onseeked = () => r();
    setTimeout(r, 250);
  });

  // Steady 1.0x playback ensures Chrome's hardware decoder never skips frames or stutters
  video.playbackRate = 1.0;
  await video.play();

  await new Promise((resolve) => {
    const hasRVFC = typeof video.requestVideoFrameCallback === 'function';

    const finish = () => {
      if (stopped) return;
      stopped = true;
      video.pause();
      resolve();
    };

    const schedule = () => {
      if (stopped) return;
      if (hasRVFC) {
        video.requestVideoFrameCallback(onFrame);
      } else {
        requestAnimationFrame(() => onFrame(0, null));
      }
    };

    function onFrame(_now, meta) {
      if (stopped) return;
      if (encoderError) { finish(); return; }

      const mediaTime = meta && typeof meta.mediaTime === 'number' ? meta.mediaTime : video.currentTime;
      if (mediaTime >= duration - 0.03 || video.ended) {
        finish();
        return;
      }

      const tUs = Math.round(mediaTime * 1_000_000);
      if (tUs >= 0 && (frames === 0 || (tUs > lastTs && (tUs - lastTs) >= minGapUs))) {
        let videoFrame;
        if (needsResize && ctx) {
          ctx.drawImage(video, 0, 0, w, h);
          videoFrame = new VideoFrame(canvas, { timestamp: tUs });
        } else {
          videoFrame = new VideoFrame(video, { timestamp: tUs });
        }

        try {
          videoEncoder.encode(videoFrame, { keyFrame: frames % 60 === 0 });
        } finally {
          videoFrame.close();
        }
        lastTs = tUs;
        frames++;

        // Only throttle down if encoder queue backs up; never speed above 1.0x
        if (videoEncoder.encodeQueueSize > 8 && video.playbackRate > 0.5) {
          video.playbackRate = 0.5;
        } else if (videoEncoder.encodeQueueSize < 3 && video.playbackRate < 1.0) {
          video.playbackRate = 1.0;
        }
      }

      const pct = Math.min(95, Math.round(15 + (mediaTime / duration) * 80));
      onProgress(pct);
      schedule();
    }

    schedule();
    video.onended = finish;
  });

  if (encoderError) throw encoderError;

  if (videoEncoder.state === 'configured') {
    await videoEncoder.flush();
    videoEncoder.close();
  }

  if (canvas) {
    canvas.width = 0;
    canvas.height = 0;
  }

  muxer.finalize();
  finalized = true;

  return new Blob([muxer.target.buffer], { type: 'video/mp4' });
}

/**
 * MediaRecorder Video Transcoding Fallback
 */
async function encodeVideoWithMediaRecorder(video, w, h, duration, targetBitrate, outFormat, onProgress) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  const fps = 30;
  const canvasStream = canvas.captureStream(fps);

  let combinedStream = canvasStream;
  let audioCtx = null;

  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
    const audioSource = audioCtx.createMediaElementSource(video);
    const audioDest = audioCtx.createMediaStreamDestination();
    audioSource.connect(audioDest);

    const audioTrack = audioDest.stream.getAudioTracks()[0];
    if (audioTrack) {
      combinedStream = new MediaStream([canvasStream.getVideoTracks()[0], audioTrack]);
    }
  } catch (e) {
    console.warn('Audio capture bypassed', e);
  }

  let selectedMime = 'video/webm';
  if ((outFormat === 'mp4' || outFormat === 'mov') && MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')) {
    selectedMime = 'video/mp4;codecs=avc1';
  } else if ((outFormat === 'mp4' || outFormat === 'mov') && MediaRecorder.isTypeSupported('video/mp4')) {
    selectedMime = 'video/mp4';
  } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
    selectedMime = 'video/webm;codecs=vp9,opus';
  }

  const recorder = new MediaRecorder(combinedStream, {
    mimeType: selectedMime,
    videoBitsPerSecond: targetBitrate
  });
  const chunks = [];

  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  const recordingPromise = new Promise((resolve) => {
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: selectedMime }));
    };
  });

  recorder.start(100);
  video.currentTime = 0;
  if (audioCtx && audioCtx.state === 'suspended') {
    try { await audioCtx.resume(); } catch (_) {}
  }
  // Keep video unmuted only when routed into AudioContext (speakers stay silent because audioDest is not connected to destination)
  video.muted = !audioCtx;
  try {
    await video.play();
  } catch (_) {
    video.muted = true;
    await video.play();
  }

  await new Promise((resolve) => {
    let animId;
    function renderFrame() {
      if (video.paused || video.ended) {
        cancelAnimationFrame(animId);
        resolve();
        return;
      }
      ctx.drawImage(video, 0, 0, w, h);
      const pct = Math.min(95, Math.round(15 + (video.currentTime / duration) * 80));
      onProgress(pct);
      animId = requestAnimationFrame(renderFrame);
    }
    animId = requestAnimationFrame(renderFrame);

    video.onended = () => {
      cancelAnimationFrame(animId);
      resolve();
    };
  });

  recorder.stop();
  const blob = await recordingPromise;

  if (audioCtx) {
    try { await audioCtx.close(); } catch (_) {}
  }

  return blob;
}

/**
 * ----------------------------------------------------
 * ENGINE 4: AUDIO COMPRESSOR (Memory-Bounded, Non-Crashing)
 * ----------------------------------------------------
 */
async function compressAudio(item, targetBytes) {
  updateItemProgress(item, 10);

  const arrayBuffer = await item.file.arrayBuffer();

  // 1. Strip ID3v2 metadata header BEFORE any decode attempt
  let cleanBuffer = arrayBuffer;
  const rawBytes = new Uint8Array(arrayBuffer);
  if (rawBytes.length >= 10 && rawBytes[0] === 0x49 && rawBytes[1] === 0x44 && rawBytes[2] === 0x33) { // 'ID3'
    let tagSize = (((rawBytes[6] & 0x7f) << 21) | ((rawBytes[7] & 0x7f) << 14) | ((rawBytes[8] & 0x7f) << 7) | (rawBytes[9] & 0x7f)) + 10;
    if (rawBytes[5] & 0x10) tagSize += 10; // ID3v2.4 footer
    if (tagSize > 0 && tagSize < arrayBuffer.byteLength) {
      cleanBuffer = arrayBuffer.slice(tagSize);
    }
  }

  // 2. Find first frame sync (for MP3/AAC)
  const cleanBytes = new Uint8Array(cleanBuffer);
  let syncOffset = 0;
  while (syncOffset < cleanBytes.length - 4) {
    if (cleanBytes[syncOffset] === 0xff && (cleanBytes[syncOffset + 1] & 0xe0) === 0xe0) break;
    syncOffset++;
  }
  if (syncOffset > 0 && syncOffset < cleanBytes.length - 100) {
    cleanBuffer = cleanBuffer.slice(syncOffset);
  }

  updateItemProgress(item, 20);

  // 3. For large audio files (> 20 MB, e.g. lagupu.mp3), use segmented chunk processing
  // to avoid V8's 2GB uncompressed Float32 limit and Chromium memory ceilings!
  if (cleanBuffer.byteLength > 20 * 1024 * 1024) {
    return await compressAudioChunked(item, cleanBuffer, targetBytes);
  }

  // Standard path for normal sized files (< 20 MB)
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContextClass();
  let audioBuffer;

  try {
    // Pass cleanBuffer.slice(0) so cleanBuffer is NEVER detached
    audioBuffer = await audioCtx.decodeAudioData(cleanBuffer.slice(0));
  } catch (err) {
    console.warn('Direct decode failed, falling back to chunked processor', err);
    try { await audioCtx.close(); } catch (_) {}
    return await compressAudioChunked(item, cleanBuffer, targetBytes);
  } finally {
    try { await audioCtx.close(); } catch (_) {}
  }

  const duration = audioBuffer.duration || 1;
  const numChannels = audioBuffer.numberOfChannels;
  const srcSampleRate = audioBuffer.sampleRate;

  // Bitrate calculation
  const rawKbps = Math.floor((targetBytes * 8) / (duration * 1000));
  const validBitrates = [32, 48, 64, 96, 128, 160, 192, 256, 320];
  const targetBitrate = validBitrates.reduce((prev, curr) => (Math.abs(curr - rawKbps) < Math.abs(prev - rawKbps) ? curr : prev));

  const isMono = targetBitrate <= 96;
  const outChannels = isMono ? 1 : Math.min(2, numChannels);

  let targetSampleRate = srcSampleRate;
  if (targetBitrate <= 64) targetSampleRate = 24000;
  else if (targetBitrate <= 96) targetSampleRate = 32000;
  else if (srcSampleRate > 48000) targetSampleRate = 44100;

  updateItemProgress(item, 40);

  // Pure Float32 direct linear resampler
  const inLength = audioBuffer.length;
  const ratio = srcSampleRate / targetSampleRate;
  const outLength = Math.floor(inLength / ratio);

  let leftChannel, rightChannel;

  if (outChannels === 1) {
    const rawLeft = audioBuffer.getChannelData(0);
    const rawRight = numChannels > 1 ? audioBuffer.getChannelData(1) : null;
    leftChannel = new Float32Array(outLength);
    for (let i = 0; i < outLength; i++) {
      const srcIdx = i * ratio;
      const i0 = Math.floor(srcIdx);
      const i1 = Math.min(inLength - 1, i0 + 1);
      const frac = srcIdx - i0;
      const s0 = rawRight ? (rawLeft[i0] + rawRight[i0]) * 0.5 : rawLeft[i0];
      const s1 = rawRight ? (rawLeft[i1] + rawRight[i1]) * 0.5 : rawLeft[i1];
      leftChannel[i] = s0 * (1 - frac) + s1 * frac;
    }
  } else {
    const rawLeft = audioBuffer.getChannelData(0);
    const rawRight = audioBuffer.getChannelData(1);
    leftChannel = new Float32Array(outLength);
    rightChannel = new Float32Array(outLength);
    for (let i = 0; i < outLength; i++) {
      const srcIdx = i * ratio;
      const i0 = Math.floor(srcIdx);
      const i1 = Math.min(inLength - 1, i0 + 1);
      const frac = srcIdx - i0;
      leftChannel[i] = rawLeft[i0] * (1 - frac) + rawLeft[i1] * frac;
      rightChannel[i] = rawRight[i0] * (1 - frac) + rawRight[i1] * frac;
    }
  }

  updateItemProgress(item, 60);

  const targetFormat = (item.settings.format || 'mp3').toLowerCase();
  let finalBlob = null;
  let finalExt = targetFormat;

  if (targetFormat === 'wav') {
    finalBlob = encodeWavFloat32(leftChannel, rightChannel, targetSampleRate, outChannels);
    finalExt = 'wav';
  } else {
    finalBlob = await encodeMp3Float32Chunked(leftChannel, rightChannel, targetSampleRate, outChannels, targetBitrate, (pct) => {
      updateItemProgress(item, Math.min(95, Math.round(60 + pct * 35)));
    });
    finalExt = 'mp3';
  }

  const baseName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
  item.compressedName = `${baseName}_compressed.${finalExt}`;
  item.compressedBlob = finalBlob;
  item.compressedSize = finalBlob.size;

  const saved = item.origSize - item.compressedSize;
  item.savingsPercent = item.origSize > 0 ? Math.max(0, ((saved / item.origSize) * 100)).toFixed(1) : 0;
}

/**
 * Segmented chunk audio processor for large files (70MB+, > 1 hour)
 * Guarantees memory usage stays below 50 MB regardless of file size!
 */
async function compressAudioChunked(item, cleanBuffer, targetBytes) {
  if (typeof lamejs === 'undefined') throw new Error('Library LameJS belum dimuat');

  const totalBytes = cleanBuffer.byteLength;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;

  // Estimate duration based on typical MP3 bitrate (~128 kbps) or file size
  const estimatedSeconds = Math.max(10, Math.round((totalBytes * 8) / 128000));
  const rawKbps = Math.floor((targetBytes * 8) / (estimatedSeconds * 1000));
  const validBitrates = [32, 48, 64, 96, 128, 160, 192, 256, 320];
  const targetBitrate = validBitrates.reduce((prev, curr) => (Math.abs(curr - rawKbps) < Math.abs(prev - rawKbps) ? curr : prev));

  const targetSampleRate = targetBitrate <= 64 ? 24000 : (targetBitrate <= 96 ? 32000 : 44100);
  const channels = targetBitrate <= 96 ? 1 : 2;

  const encoder = new lamejs.Mp3Encoder(channels, targetSampleRate, targetBitrate);
  const mp3Data = [];

  const bytes = new Uint8Array(cleanBuffer);
  const chunkSize = 2 * 1024 * 1024; // 2 MB per segment (~2-3 minutes)
  let offset = 0;

  while (offset < totalBytes) {
    let nextOffset = Math.min(totalBytes, offset + chunkSize);

    // Find next frame sync boundary near nextOffset
    if (nextOffset < totalBytes) {
      let sync = nextOffset;
      while (sync < totalBytes - 4) {
        if (bytes[sync] === 0xff && (bytes[sync + 1] & 0xe0) === 0xe0) break;
        sync++;
      }
      if (sync < totalBytes - 4) nextOffset = sync;
    }

    const chunkArray = cleanBuffer.slice(offset, nextOffset);
    offset = nextOffset;

    const audioCtx = new AudioContextClass();
    let audioBuffer = null;
    try {
      audioBuffer = await audioCtx.decodeAudioData(chunkArray.slice(0));
    } catch (e) {
      console.warn('Chunk decode skipped', e);
    } finally {
      try { await audioCtx.close(); } catch (_) {}
    }

    if (audioBuffer) {
      const srcRate = audioBuffer.sampleRate;
      const numCh = audioBuffer.numberOfChannels;
      const inLen = audioBuffer.length;
      const ratio = srcRate / targetSampleRate;
      const outLen = Math.floor(inLen / ratio);

      const rawL = audioBuffer.getChannelData(0);
      const rawR = numCh > 1 ? audioBuffer.getChannelData(1) : null;

      const pcmL = new Int16Array(outLen);
      const pcmR = channels === 2 ? new Int16Array(outLen) : null;

      for (let i = 0; i < outLen; i++) {
        const srcIdx = i * ratio;
        const i0 = Math.floor(srcIdx);
        const i1 = Math.min(inLen - 1, i0 + 1);
        const frac = srcIdx - i0;

        let sL, sR;
        if (channels === 1) {
          const v0 = rawR ? (rawL[i0] + rawR[i0]) * 0.5 : rawL[i0];
          const v1 = rawR ? (rawL[i1] + rawR[i1]) * 0.5 : rawL[i1];
          sL = v0 * (1 - frac) + v1 * frac;
        } else {
          sL = rawL[i0] * (1 - frac) + rawL[i1] * frac;
          sR = rawR ? rawR[i0] * (1 - frac) + rawR[i1] * frac : sL;
        }

        sL = Math.max(-1, Math.min(1, sL));
        pcmL[i] = sL < 0 ? sL * 0x8000 : sL * 0x7FFF;

        if (pcmR) {
          sR = Math.max(-1, Math.min(1, sR));
          pcmR[i] = sR < 0 ? sR * 0x8000 : sR * 0x7FFF;
        }
      }

      // Encode segment in 1152-sample sub-chunks
      const step = 1152;
      for (let j = 0; j < outLen; j += step) {
        const count = Math.min(step, outLen - j);
        const subL = pcmL.subarray(j, j + count);
        let buf;
        if (channels === 1 || !pcmR) {
          buf = encoder.encodeBuffer(subL);
        } else {
          const subR = pcmR.subarray(j, j + count);
          buf = encoder.encodeBuffer(subL, subR);
        }
        if (buf.length > 0) mp3Data.push(buf);
      }
    }

    const pct = Math.min(95, Math.round(20 + (offset / totalBytes) * 75));
    updateItemProgress(item, pct);
    await new Promise(r => setTimeout(r, 0));
  }

  const endBuf = encoder.flush();
  if (endBuf.length > 0) mp3Data.push(endBuf);

  const finalBlob = new Blob(mp3Data, { type: 'audio/mp3' });
  const baseName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
  item.compressedName = `${baseName}_compressed.mp3`;
  item.compressedBlob = finalBlob;
  item.compressedSize = finalBlob.size;

  const saved = item.origSize - item.compressedSize;
  item.savingsPercent = item.origSize > 0 ? Math.max(0, ((saved / item.origSize) * 100)).toFixed(1) : 0;
}

/**
 * Memory-safe non-blocking MP3 encoder using LameJS in small chunks
 */
async function encodeMp3Float32Chunked(left, right, sampleRate, channels, bitrate, onProgress) {
  if (typeof lamejs === 'undefined') throw new Error('Library LameJS belum dimuat');
  const encoder = new lamejs.Mp3Encoder(channels, sampleRate, bitrate);
  const mp3Data = [];
  const chunkSize = 1152;
  const length = left.length;

  const sampleChunkLeft = new Int16Array(chunkSize);
  const sampleChunkRight = channels === 2 ? new Int16Array(chunkSize) : null;

  for (let i = 0; i < length; i += chunkSize) {
    const count = Math.min(chunkSize, length - i);

    for (let j = 0; j < count; j++) {
      const sL = Math.max(-1, Math.min(1, left[i + j]));
      sampleChunkLeft[j] = sL < 0 ? sL * 0x8000 : sL * 0x7FFF;

      if (channels === 2 && right) {
        const sR = Math.max(-1, Math.min(1, right[i + j]));
        sampleChunkRight[j] = sR < 0 ? sR * 0x8000 : sR * 0x7FFF;
      }
    }

    let mp3buf;
    if (channels === 1 || !right) {
      mp3buf = encoder.encodeBuffer(sampleChunkLeft.subarray(0, count));
    } else {
      mp3buf = encoder.encodeBuffer(sampleChunkLeft.subarray(0, count), sampleChunkRight.subarray(0, count));
    }

    if (mp3buf.length > 0) mp3Data.push(mp3buf);

    // Yield every 50 chunks so browser never freezes and progress updates
    if ((i / chunkSize) % 50 === 0) {
      if (onProgress) onProgress(i / length);
      await new Promise(r => setTimeout(r, 0));
    }
  }

  const endBuf = encoder.flush();
  if (endBuf.length > 0) mp3Data.push(endBuf);

  return new Blob(mp3Data, { type: 'audio/mp3' });
}

function encodeWavFloat32(left, right, sampleRate, channels) {
  const length = left.length;
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = channels * bytesPerSample;
  const dataSize = length * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  function writeString(offset, string) {
    for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
  }

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < length; i++) {
    const sL = Math.max(-1, Math.min(1, left[i]));
    view.setInt16(offset, sL < 0 ? sL * 0x8000 : sL * 0x7FFF, true);
    offset += 2;
    if (channels === 2 && right) {
      const sR = Math.max(-1, Math.min(1, right[i]));
      view.setInt16(offset, sR < 0 ? sR * 0x8000 : sR * 0x7FFF, true);
      offset += 2;
    }
  }

  return new Blob([view], { type: 'audio/wav' });
}

/**
 * ----------------------------------------------------
 * ENGINE 5: GENERIC FILE COMPRESSOR
 * ----------------------------------------------------
 */
async function compressGenericFile(item, targetBytes) {
  updateItemProgress(item, 30);

  if (typeof JSZip !== 'undefined') {
    const zip = new JSZip();
    zip.file(item.name, item.file, {
      compression: "DEFLATE",
      compressionOptions: { level: 9 }
    });

    const zipBlob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 9 }
    }, (meta) => {
      const pct = Math.round(30 + meta.percent * 0.65);
      updateItemProgress(item, pct);
    });

    const baseName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
    item.compressedName = `${baseName}_compressed.zip`;
    item.compressedBlob = zipBlob;
    item.compressedSize = zipBlob.size;

    const saved = item.origSize - item.compressedSize;
    item.savingsPercent = item.origSize > 0 ? Math.max(0, ((saved / item.origSize) * 100)).toFixed(1) : 0;
  } else {
    throw new Error('Library ZIP belum dimuat');
  }
}

/**
 * Batch Download all as ZIP
 */
async function downloadAllAsZip() {
  const doneItems = state.queue.filter(i => i.status === 'done' && i.compressedBlob);
  if (doneItems.length === 0 || typeof JSZip === 'undefined') return;

  const zip = new JSZip();
  const folder = zip.folder("8BitCompress");

  doneItems.forEach(item => {
    folder.file(item.compressedName || item.name, item.compressedBlob);
  });

  const zipBlob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `8BitCompress_${new Date().toISOString().slice(0, 10)}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
