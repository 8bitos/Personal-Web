import { 
  canvasToBmpBlob, 
  canvasToIcoBlob, 
  canvasToCurBlob, 
  canvasToTgaBlob, 
  canvasToPpmBlob, 
  canvasToSvgBlob, 
  canvasToPdfBlob,
  canvasToWbmpBlob,
  canvasToDngBlob,
  canvasToAvifBlob,
  canvasToGifBlob
} from './encoders.js';
import { getFunFacts } from './funfacts.js';
import { translations, formatCategories } from './i18n.js';

// State
let filesQueue = [];
let formatMode = 'batch'; // 'batch' or 'custom'
let masterTargetFormat = 'webp';
let currentLang = 'id';
let currentFactIndex = 0;
let factInterval = null;
let isFactPaused = false;

// DOM Elements
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const queueSection = document.getElementById('queue-section');
const queueList = document.getElementById('queue-list');
const queueCount = document.getElementById('queue-count');
const masterFormatSelect = document.getElementById('master-format');
const masterFormatLabel = document.getElementById('master-format-label');
const modeBatchBtn = document.getElementById('mode-batch-btn');
const modeCustomBtn = document.getElementById('mode-custom-btn');
const modeHint = document.getElementById('mode-hint');
const convertAllBtn = document.getElementById('convert-all-btn');
const downloadZipBtn = document.getElementById('download-zip-btn');
const clearAllBtn = document.getElementById('clear-all-btn');
const emptyPlaceholder = document.getElementById('empty-placeholder');

// Mobile Action Bar Elements
const mobileActionBar = document.getElementById('mobile-action-bar');
const mobileConvertBtn = document.getElementById('mobile-convert-btn');
const mobileDownloadBtn = document.getElementById('mobile-download-btn');
const mobileBtnTextConvert = document.getElementById('mobile-btn-text-convert');
const mobileBtnTextZip = document.getElementById('mobile-btn-text-zip');

// Modal Elements
const modal = document.getElementById('preview-modal');
const modalClose = document.getElementById('modal-close');
const modalOriginalImg = document.getElementById('modal-orig-img');
const modalConvertedImg = document.getElementById('modal-conv-img');
const modalOrigInfo = document.getElementById('modal-orig-info');
const modalConvInfo = document.getElementById('modal-conv-info');

// Language Dropdown Elements
const langToggleBtn = document.getElementById('lang-toggle-btn');
const langMenu = document.getElementById('lang-menu');
const currentFlagEl = document.getElementById('current-flag');
const currentLangCodeEl = document.getElementById('current-lang-code');

// Fun Fact Elements
const funfactCard = document.getElementById('funfact-card');
const funfactText = document.getElementById('funfact-text');

// Flags Mapping
const flagMap = {
  en: '🇬🇧',
  id: '🇮🇩',
  zh: '🇨🇳',
  es: '🇪🇸',
  ar: '🇸🇦',
  fr: '🇫🇷',
  ja: '🇯🇵',
  pt: '🇧🇷'
};

// Initialize App
initApp();

function initApp() {
  initLanguage();
  initEvents();
  initFunFactCarousel();
}

// Language Logic
function initLanguage() {
  const saved = localStorage.getItem('user_lang');
  if (saved && translations[saved]) {
    currentLang = saved;
  } else {
    const browserLang = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
    if (browserLang.startsWith('id')) currentLang = 'id';
    else if (browserLang.startsWith('zh')) currentLang = 'zh';
    else if (browserLang.startsWith('es')) currentLang = 'es';
    else if (browserLang.startsWith('ar')) currentLang = 'ar';
    else if (browserLang.startsWith('fr')) currentLang = 'fr';
    else if (browserLang.startsWith('ja')) currentLang = 'ja';
    else if (browserLang.startsWith('pt')) currentLang = 'pt';
    else currentLang = 'en';
  }

  applyLanguage(currentLang);

  // Toggle dropdown
  langToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    langMenu.classList.toggle('hidden');
  });

  document.addEventListener('click', () => {
    if (!langMenu.classList.contains('hidden')) {
      langMenu.classList.add('hidden');
    }
  });

  // Select language
  langMenu.querySelectorAll('[data-lang]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const selected = e.currentTarget.getAttribute('data-lang');
      if (selected && translations[selected]) {
        currentLang = selected;
        localStorage.setItem('user_lang', currentLang);
        applyLanguage(currentLang);
        langMenu.classList.add('hidden');
      }
    });
  });
}

function applyLanguage(lang) {
  const t = translations[lang] || translations.en;
  
  currentFlagEl.textContent = flagMap[lang] || '🌐';
  currentLangCodeEl.textContent = lang.toUpperCase();

  // Set RTL for Arabic
  if (lang === 'ar') {
    document.documentElement.dir = 'rtl';
  } else {
    document.documentElement.dir = 'ltr';
  }

  // Update text nodes
  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  setText('app-title', t.title);
  setText('mode-label', t.modeLabel);
  setText('mode-batch-btn', t.modeBatchBtn);
  setText('mode-custom-btn', t.modeCustomBtn);
  setText('mode-hint', formatMode === 'batch' ? t.modeBatchHint : t.modeCustomHint);
  setText('master-format-label', formatMode === 'batch' ? t.targetFormatLabel : t.setAllLabel);
  setText('drop-title', t.dropTitle);
  setText('drop-browse', t.dropBrowse);
  setText('drop-supported', t.dropSupported);
  setText('drop-paste-hint', t.dropPasteHint);
  setText('queue-title', t.queueTitle);
  setText('btn-text-convert-all', t.convertAllBtn);
  setText('btn-text-download-zip', t.downloadZipBtn);
  setText('mobile-btn-text-convert', t.convertAllBtn);
  setText('mobile-btn-text-zip', t.downloadZipBtn);
  setText('empty-queue-text', t.emptyQueue);
  setText('funfact-title-label', t.funFactTitle);
  setText('privacy-title-label', t.privacyTitle);
  setText('privacy-desc', t.privacyDesc);
  setText('modal-orig-label', t.modalOrigLabel);
  setText('modal-conv-label', t.modalConvLabel);

  // Update Master Format Options in translated language
  updateMasterFormatOptions(lang);

  // Refresh current funfact with new language
  const facts = getFunFacts(lang);
  showFact(currentFactIndex % facts.length, false);

  renderQueue();
}

function updateMasterFormatOptions(lang) {
  const t = translations[lang] || translations.en;
  const currentVal = masterTargetFormat;
  masterFormatSelect.innerHTML = '';

  for (const [catKey, formatKeys] of Object.entries(formatCategories)) {
    const optgroup = document.createElement('optgroup');
    optgroup.label = t.categories && t.categories[catKey] ? t.categories[catKey] : catKey.toUpperCase();

    formatKeys.forEach(fmt => {
      const opt = document.createElement('option');
      opt.value = fmt;
      opt.textContent = t.formats && t.formats[fmt] ? t.formats[fmt] : fmt.toUpperCase();
      if (fmt === currentVal) opt.selected = true;
      optgroup.appendChild(opt);
    });

    masterFormatSelect.appendChild(optgroup);
  }
}

// Fun Fact 10-Second Auto-Slide (Clean, minimal, no timer/counter UI)
function initFunFactCarousel() {
  const facts = getFunFacts(currentLang);
  currentFactIndex = Math.floor(Math.random() * facts.length);
  showFact(currentFactIndex, false);
  startFactTimer();

  // Pause on hover so the user can comfortably finish reading
  funfactCard.addEventListener('mouseenter', () => {
    isFactPaused = true;
  });

  funfactCard.addEventListener('mouseleave', () => {
    isFactPaused = false;
  });

  // Pause when tab/screen is hidden to save mobile CPU/battery
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopFactTimer();
    } else {
      startFactTimer();
    }
  });
}

function showFact(index, animate = true) {
  const facts = getFunFacts(currentLang);
  const factText = facts[index % facts.length] || facts[0];

  if (animate) {
    funfactText.classList.remove('slide-in');
    funfactText.classList.add('slide-out');

    setTimeout(() => {
      funfactText.textContent = `"${factText}"`;
      funfactText.classList.remove('slide-out');
      funfactText.classList.add('slide-in');
    }, 280);
  } else {
    funfactText.textContent = `"${factText}"`;
    funfactText.classList.add('slide-in');
  }
}

function startFactTimer() {
  if (factInterval) clearInterval(factInterval);
  factInterval = setInterval(() => {
    if (!isFactPaused) {
      const facts = getFunFacts(currentLang);
      currentFactIndex = (currentFactIndex + 1) % facts.length;
      showFact(currentFactIndex, true);
    }
  }, 10000);
}

// Event Listeners
function initEvents() {
  // Drag & drop
  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('drag-active');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('drag-active');
    }, false);
  });

  dropZone.addEventListener('drop', (e) => {
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleNewFiles(droppedFiles);
  });

  dropZone.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', (e) => {
    const selectedFiles = Array.from(e.target.files);
    handleNewFiles(selectedFiles);
    fileInput.value = '';
  });

  // Paste from clipboard (Ctrl+V)
  window.addEventListener('paste', (e) => {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    const pastedFiles = [];
    for (let item of items) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        pastedFiles.push(file);
      }
    }
    if (pastedFiles.length > 0) {
      handleNewFiles(pastedFiles);
    }
  });

  // Mode Toggle (Batch vs Custom)
  modeBatchBtn.addEventListener('click', () => setFormatMode('batch'));
  modeCustomBtn.addEventListener('click', () => setFormatMode('custom'));

  // Master Target Format
  masterFormatSelect.addEventListener('change', (e) => {
    masterTargetFormat = e.target.value;
    filesQueue.forEach(item => {
      item.targetFormat = masterTargetFormat;
      item.isConverted = false;
      item.convertedBlob = null;
    });
    renderQueue();
  });

  // Bulk Actions
  convertAllBtn.addEventListener('click', convertAll);
  clearAllBtn.addEventListener('click', clearAll);
  downloadZipBtn.addEventListener('click', downloadAllZip);
  if (mobileConvertBtn) mobileConvertBtn.addEventListener('click', convertAll);
  if (mobileDownloadBtn) mobileDownloadBtn.addEventListener('click', downloadAllZip);

  // Modal close
  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
}

function setFormatMode(newMode) {
  formatMode = newMode;
  const t = translations[currentLang] || translations.en;

  if (formatMode === 'batch') {
    modeBatchBtn.className = 'px-3 py-1.5 rounded-lg font-semibold transition-all shadow-sm bg-white dark:bg-sky-500/20 text-sky-600 dark:text-sky-300 border border-black/[0.05] dark:border-sky-400/30';
    modeCustomBtn.className = 'px-3 py-1.5 rounded-lg font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all';
    if (modeHint) modeHint.textContent = t.modeBatchHint;
    if (masterFormatLabel) masterFormatLabel.textContent = t.targetFormatLabel;

    filesQueue.forEach(item => {
      item.targetFormat = masterTargetFormat;
      item.isConverted = false;
      item.convertedBlob = null;
    });
  } else {
    modeCustomBtn.className = 'px-3 py-1.5 rounded-lg font-semibold transition-all shadow-sm bg-white dark:bg-sky-500/20 text-sky-600 dark:text-sky-300 border border-black/[0.05] dark:border-sky-400/30';
    modeBatchBtn.className = 'px-3 py-1.5 rounded-lg font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all';
    if (modeHint) modeHint.textContent = t.modeCustomHint;
    if (masterFormatLabel) masterFormatLabel.textContent = t.setAllLabel;
  }
  renderQueue();
}

// Handle Incoming Files
async function handleNewFiles(files) {
  if (!files || files.length === 0) return;

  for (const file of files) {
    const ext = getFileExtension(file.name);
    const id = 'img_' + Math.random().toString(36).substring(2, 9);

    const item = {
      id,
      file,
      name: file.name,
      originalExt: ext,
      originalSize: file.size,
      targetFormat: masterTargetFormat,
      targetSize: null,
      convertedBlob: null,
      convertedUrl: null,
      originalUrl: URL.createObjectURL(file),
      previewBlob: null,
      previewUrl: null,
      thumbUrl: null,
      heicPreviewReady: false,
      isHeicLoading: isHeic(file.name),
      rawPreviewReady: false,
      isRawLoading: isRaw(file.name),
      width: null,
      height: null,
      isConverting: false,
      isConverted: false,
      error: null
    };

    filesQueue.push(item);

    // If HEIC or RAW, immediately decode/extract preview
    if (isHeic(file.name)) {
      generateHeicPreview(item);
    } else if (isRaw(file.name)) {
      generateRawPreview(item);
    } else {
      detectDimensions(item);
    }
  }

  updateQueueUI();
}

// Generate real visual preview for HEIC files
async function generateHeicPreview(item) {
  try {
    if (window.heic2any) {
      const jpegBlob = await window.heic2any({
        blob: item.file,
        toType: 'image/jpeg',
        quality: 0.9
      });
      const resolvedBlob = Array.isArray(jpegBlob) ? jpegBlob[0] : jpegBlob;
      item.previewBlob = resolvedBlob;
      item.previewUrl = URL.createObjectURL(resolvedBlob);
      item.heicPreviewReady = true;

      // Extract natural dimensions
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        item.width = img.naturalWidth;
        item.height = img.naturalHeight;
        item.isHeicLoading = false;
        createQuickThumb(item, img);
        renderQueueDebounced();
      };
      img.src = item.previewUrl;
    }
  } catch (err) {
    console.warn('HEIC preview decode error:', err);
    item.isHeicLoading = false;
    renderQueueDebounced();
  }
}

// Generate visual preview for Camera RAW files (CR2, NEF, ARW, DNG, etc.)
async function generateRawPreview(item) {
  try {
    const rawBlob = await extractRawImage(item.file);
    item.previewBlob = rawBlob;
    item.previewUrl = URL.createObjectURL(rawBlob);
    item.rawPreviewReady = true;

    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      item.width = img.naturalWidth;
      item.height = img.naturalHeight;
      item.isRawLoading = false;
      createQuickThumb(item, img);
      renderQueueDebounced();
    };
    img.src = item.previewUrl;
  } catch (err) {
    console.warn('RAW preview extraction error:', err);
    item.isRawLoading = false;
    renderQueueDebounced();
  }
}

// High-speed embedded preview extraction for RAW formats
async function extractRawImage(file) {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // Scan for embedded high-resolution JPEG preview stream (FF D8 ... FF D9)
  let bestJpeg = null;
  let maxLen = 0;

  for (let i = 0; i < bytes.length - 4; i++) {
    if (bytes[i] === 0xFF && bytes[i + 1] === 0xD8 && bytes[i + 2] === 0xFF) {
      const start = i;
      for (let j = start + 4096; j < bytes.length - 1; j++) {
        if (bytes[j] === 0xFF && bytes[j + 1] === 0xD9) {
          const len = j + 2 - start;
          if (len > maxLen && len > 50000) {
            maxLen = len;
            bestJpeg = bytes.subarray(start, j + 2);
          }
          i = j + 1;
          break;
        }
      }
    }
  }

  if (bestJpeg) {
    return new Blob([bestJpeg], { type: 'image/jpeg' });
  }

  // Fallback to UTIF.js for DNG or TIFF-based RAW files
  if (window.UTIF) {
    try {
      const ifds = window.UTIF.decode(buffer);
      if (ifds && ifds.length > 0) {
        window.UTIF.decodeImage(buffer, ifds[0]);
        const rgba = window.UTIF.toRGBA8(ifds[0]);
        const canvas = document.createElement('canvas');
        canvas.width = ifds[0].width;
        canvas.height = ifds[0].height;
        const ctx = canvas.getContext('2d');
        const imgData = ctx.createImageData(canvas.width, canvas.height);
        imgData.data.set(rgba);
        ctx.putImageData(imgData, 0, 0);
        return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      }
    } catch (e) {
      console.warn('UTIF RAW decode attempt failed:', e);
    }
  }

  throw new Error('Format RAW tidak memiliki preview terintegrasi.');
}

let renderRafId = null;
function renderQueueDebounced() {
  if (renderRafId) cancelAnimationFrame(renderRafId);
  renderRafId = requestAnimationFrame(() => {
    renderQueue();
  });
}

// Generate lightweight thumbnail (max 100x100) to avoid decoding massive 48MP phone images in DOM
function createQuickThumb(item, img) {
  try {
    const maxDim = 100;
    let tw = img.naturalWidth;
    let th = img.naturalHeight;
    if (!tw || !th) return;

    if (tw > maxDim || th > maxDim) {
      if (tw > th) {
        th = Math.round((th * maxDim) / tw);
        tw = maxDim;
      } else {
        tw = Math.round((tw * maxDim) / th);
        th = maxDim;
      }
    }
    const canvas = document.createElement('canvas');
    canvas.width = tw;
    canvas.height = th;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, tw, th);
    canvas.toBlob((blob) => {
      if (blob) {
        if (item.thumbUrl) URL.revokeObjectURL(item.thumbUrl);
        item.thumbUrl = URL.createObjectURL(blob);
        renderQueueDebounced();
      }
    }, 'image/jpeg', 0.7);
  } catch (e) {
    // Non-critical, fallback to displayUrl
  }
}

function detectDimensions(item) {
  const img = new Image();
  img.decoding = 'async';
  img.onload = () => {
    item.width = img.naturalWidth;
    item.height = img.naturalHeight;
    createQuickThumb(item, img);
    renderQueueDebounced();
  };
  img.src = item.originalUrl;
}

function updateQueueUI() {
  if (filesQueue.length > 0) {
    queueSection.classList.remove('hidden');
    emptyPlaceholder.classList.add('hidden');
    queueCount.textContent = `(${filesQueue.length})`;
  } else {
    queueSection.classList.add('hidden');
    emptyPlaceholder.classList.remove('hidden');
    queueCount.textContent = '';
  }
  renderQueueDebounced();
}

// Render Conversion Queue with Google Material Symbols & i18n
function renderQueue() {
  const t = translations[currentLang] || translations.en;
  queueList.innerHTML = '';

  filesQueue.forEach((item, index) => {
    const row = document.createElement('div');
    row.className = 'liquid-glass flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-black/[0.08] dark:border-white/10 gap-2 sm:gap-4 transition-all hover:border-sky-500/40 shadow-sm';

    // Top Row on Mobile / Left Column on Desktop
    const leftCol = document.createElement('div');
    leftCol.className = 'flex items-center justify-between sm:justify-start gap-2.5 w-full sm:w-5/12 min-w-0';

    const infoWrapper = document.createElement('div');
    infoWrapper.className = 'flex items-center gap-2.5 min-w-0 flex-1';

    const thumbWrapper = document.createElement('div');
    thumbWrapper.className = 'w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-black/[0.04] dark:bg-black/40 flex-shrink-0 flex items-center justify-center overflow-hidden border border-black/[0.08] dark:border-white/10 cursor-pointer relative group';
    thumbWrapper.title = t.previewBtnTitle;
    thumbWrapper.onclick = () => openPreviewModal(item);

    const displayUrl = item.thumbUrl || item.convertedUrl || item.previewUrl || item.originalUrl;

    if (item.isHeicLoading && !item.previewUrl) {
      thumbWrapper.innerHTML = `
        <div class="flex flex-col items-center justify-center text-[9px] text-sky-600 dark:text-sky-400 font-mono text-center">
          <svg class="animate-spin h-3.5 w-3.5 mb-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
          HEIC
        </div>`;
    } else if (item.isRawLoading && !item.previewUrl) {
      thumbWrapper.innerHTML = `
        <div class="flex flex-col items-center justify-center text-[9px] text-amber-600 dark:text-amber-400 font-mono text-center">
          <svg class="animate-spin h-3.5 w-3.5 mb-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
          RAW
        </div>`;
    } else {
      const img = document.createElement('img');
      img.src = displayUrl;
      img.className = 'w-full h-full object-cover';
      img.loading = 'lazy';
      img.decoding = 'async';
      thumbWrapper.appendChild(img);
    }

    const hoverOverlay = document.createElement('div');
    hoverOverlay.className = 'absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-sky-300 text-xs font-medium';
    hoverOverlay.innerHTML = `<span class="material-symbols-outlined text-[16px] sm:text-[18px]">visibility</span>`;
    thumbWrapper.appendChild(hoverOverlay);

    const infoDiv = document.createElement('div');
    infoDiv.className = 'min-w-0 flex-1';

    const nameP = document.createElement('p');
    nameP.className = 'font-display font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate';
    nameP.textContent = item.name;

    const metaP = document.createElement('p');
    metaP.className = 'text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5';
    metaP.innerHTML = `
      <span class="px-1.5 py-0.2 rounded bg-black/[0.05] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.06] uppercase font-mono text-[9px] sm:text-[10px] text-slate-800 dark:text-slate-300 font-semibold">${item.originalExt || 'IMG'}</span>
      <span>${formatBytes(item.originalSize)}</span>
      ${item.width ? `<span>• ${item.width}×${item.height}px</span>` : ''}
    `;

    infoDiv.appendChild(nameP);
    infoDiv.appendChild(metaP);
    infoWrapper.appendChild(thumbWrapper);
    infoWrapper.appendChild(infoDiv);
    leftCol.appendChild(infoWrapper);

    // Mobile-only Quick Close / Delete button on the top right
    const mobileRemoveBtn = document.createElement('button');
    mobileRemoveBtn.className = 'sm:hidden btn-liquid-ghost text-slate-400 hover:text-rose-500 p-1 rounded-lg flex-shrink-0';
    mobileRemoveBtn.title = t.removeBtnTitle;
    mobileRemoveBtn.innerHTML = `<span class="material-symbols-outlined text-[17px]">close</span>`;
    mobileRemoveBtn.onclick = () => removeFile(index);
    leftCol.appendChild(mobileRemoveBtn);

    // Bottom Row on Mobile / Center Column on Desktop
    const centerCol = document.createElement('div');
    centerCol.className = 'flex items-center justify-between sm:justify-center gap-2 w-full sm:w-4/12 pt-2 sm:pt-0 border-t sm:border-t-0 border-black/[0.05] dark:border-white/[0.05]';

    const formatSelect = document.createElement('select');
    formatSelect.className = 'glass-input text-[11px] sm:text-xs rounded-lg sm:rounded-xl px-2 sm:px-2.5 py-1 sm:py-1.5 font-medium cursor-pointer text-slate-800 dark:text-slate-200 max-w-[125px] sm:max-w-none';
    formatSelect.disabled = item.isConverting;
    
    for (const [catKey, formatKeys] of Object.entries(formatCategories)) {
      const optgroup = document.createElement('optgroup');
      optgroup.label = t.categories && t.categories[catKey] ? t.categories[catKey] : catKey.toUpperCase();

      formatKeys.forEach(fmt => {
        const opt = document.createElement('option');
        opt.value = fmt;
        opt.textContent = `➔ ${fmt.toUpperCase()}`;
        if (fmt === item.targetFormat) opt.selected = true;
        optgroup.appendChild(opt);
      });

      formatSelect.appendChild(optgroup);
    }

    formatSelect.addEventListener('change', (e) => {
      item.targetFormat = e.target.value;
      item.isConverted = false;
      item.convertedBlob = null;
      if (formatMode === 'batch') {
        setFormatMode('custom');
      } else {
        renderQueue();
      }
    });

    // Status / Result Size
    const statusDiv = document.createElement('div');
    statusDiv.className = 'text-[11px] sm:text-xs text-center flex-1 sm:flex-initial';

    if (item.isConverting) {
      statusDiv.innerHTML = `<span class="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 font-medium animate-pulse text-[11px]">
        <svg class="animate-spin h-3 w-3 text-sky-600 dark:text-sky-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
        ${t.processingStatus}
      </span>`;
    } else if (item.isConverted) {
      const diff = item.targetSize - item.originalSize;
      const percent = Math.round((diff / item.originalSize) * 100);
      const isSaved = percent < 0;

      statusDiv.innerHTML = `
        <div class="font-mono font-medium text-slate-800 dark:text-slate-200 text-[11px] sm:text-xs">${formatBytes(item.targetSize)}</div>
        <div class="text-[9px] sm:text-[10px] font-semibold ${isSaved ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}">
          ${isSaved ? `${t.savedPercent} ${Math.abs(percent)}%` : `+${percent}%`}
        </div>
      `;
    } else if (item.error) {
      statusDiv.innerHTML = `<span class="text-rose-500 dark:text-rose-400 font-medium text-[11px]" title="${item.error}">${t.failedStatus}</span>`;
    } else {
      statusDiv.innerHTML = `<span class="text-slate-400 dark:text-slate-500 font-mono text-[10px] sm:text-[11px]">${t.readyStatus}</span>`;
    }

    centerCol.appendChild(formatSelect);
    centerCol.appendChild(statusDiv);

    // Mobile-only Action Button in the bottom row
    const mobileActionDiv = document.createElement('div');
    mobileActionDiv.className = 'sm:hidden flex items-center flex-shrink-0';

    if (item.isConverted) {
      const mDlBtn = document.createElement('button');
      mDlBtn.className = 'btn-liquid-success px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1';
      mDlBtn.innerHTML = `<span class="material-symbols-outlined text-[15px]">download</span>`;
      mDlBtn.onclick = () => downloadSingle(item);
      mobileActionDiv.appendChild(mDlBtn);
    } else {
      const mConvBtn = document.createElement('button');
      mConvBtn.className = 'btn-liquid-primary px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 disabled:opacity-40';
      mConvBtn.disabled = item.isConverting;
      mConvBtn.innerHTML = `<span class="material-symbols-outlined text-[15px]">play_arrow</span>`;
      mConvBtn.onclick = () => convertItem(item);
      mobileActionDiv.appendChild(mConvBtn);
    }
    centerCol.appendChild(mobileActionDiv);

    // Desktop-only Right Column: Action Buttons + Delete
    const rightCol = document.createElement('div');
    rightCol.className = 'hidden sm:flex items-center justify-end gap-2 sm:w-3/12';

    if (item.isConverted) {
      const dlBtn = document.createElement('button');
      dlBtn.className = 'btn-liquid-success flex-1 sm:flex-initial justify-center px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5';
      dlBtn.innerHTML = `<span class="material-symbols-outlined text-[16px]">download</span> ${t.downloadBtn}`;
      dlBtn.onclick = () => downloadSingle(item);
      rightCol.appendChild(dlBtn);
    } else {
      const singleConvertBtn = document.createElement('button');
      singleConvertBtn.className = 'btn-liquid-primary flex-1 sm:flex-initial justify-center px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40';
      singleConvertBtn.disabled = item.isConverting;
      singleConvertBtn.innerHTML = `<span class="material-symbols-outlined text-[16px]">play_arrow</span> ${t.convertBtn}`;
      singleConvertBtn.onclick = () => convertItem(item);
      rightCol.appendChild(singleConvertBtn);
    }

    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn-liquid-ghost text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 p-1.5 rounded-lg transition-colors flex items-center justify-center';
    removeBtn.title = t.removeBtnTitle;
    removeBtn.innerHTML = `<span class="material-symbols-outlined text-[18px]">delete</span>`;
    removeBtn.onclick = () => removeFile(index);
    rightCol.appendChild(removeBtn);

    row.appendChild(leftCol);
    row.appendChild(centerCol);
    row.appendChild(rightCol);

    queueList.appendChild(row);
  });

  const hasConverted = filesQueue.some(f => f.isConverted);
  downloadZipBtn.disabled = !hasConverted;
  if (mobileDownloadBtn) mobileDownloadBtn.disabled = !hasConverted;

  // Manage Mobile Action Bar visibility
  if (mobileActionBar) {
    if (filesQueue.length > 0) {
      mobileActionBar.classList.remove('translate-y-full');
      mobileActionBar.classList.add('translate-y-0');
    } else {
      mobileActionBar.classList.remove('translate-y-0');
      mobileActionBar.classList.add('translate-y-full');
    }
  }
}

// 1:1 Conversion without Quality Degradation (Lossless/High-Fidelity)
async function convertItem(item) {
  if (item.isConverting) return;
  item.isConverting = true;
  item.error = null;
  renderQueue();

  try {
    const canvas = await fileToCanvas(item);
    item.width = canvas.width;
    item.height = canvas.height;

    const targetFormat = item.targetFormat.toLowerCase();
    let blob = null;

    // 1:1 conversion quality (quality parameter = 1.0 for high fidelity)
    if (targetFormat === 'jpg' || targetFormat === 'jpeg') {
      const flattened = flattenCanvasBackground(canvas, '#ffffff');
      blob = await new Promise(res => flattened.toBlob(res, 'image/jpeg', 1.0));
    } else if (targetFormat === 'png') {
      blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
    } else if (targetFormat === 'webp') {
      blob = await new Promise(res => canvas.toBlob(res, 'image/webp', 1.0));
    } else if (targetFormat === 'avif') {
      try {
        blob = await canvasToAvifBlob(canvas);
      } catch (err) {
        const t = translations[currentLang] || translations.en;
        throw new Error(t.avifUnsupported || 'Browser Anda belum mendukung encoder AVIF langsung. Gunakan Chrome/Edge atau pilih WEBP.');
      }
    } else if (targetFormat === 'gif') {
      try {
        blob = await canvasToGifBlob(canvas);
      } catch (err) {
        const t = translations[currentLang] || translations.en;
        throw new Error(t.gifUnsupported || 'Browser Anda belum mendukung pembuatan format GIF.');
      }
    } else if (targetFormat === 'pdf') {
      blob = await canvasToPdfBlob(canvas);
    } else if (targetFormat === 'ico') {
      const icoCanvas = document.createElement('canvas');
      const size = Math.min(Math.max(canvas.width, canvas.height), 256);
      icoCanvas.width = size;
      icoCanvas.height = size;
      const ctx = icoCanvas.getContext('2d');
      ctx.drawImage(canvas, 0, 0, size, size);
      blob = await canvasToIcoBlob(icoCanvas);
    } else if (targetFormat === 'cur') {
      const curCanvas = document.createElement('canvas');
      const size = Math.min(Math.max(canvas.width, canvas.height), 128);
      curCanvas.width = size;
      curCanvas.height = size;
      const ctx = curCanvas.getContext('2d');
      ctx.drawImage(canvas, 0, 0, size, size);
      blob = await canvasToCurBlob(curCanvas);
    } else if (targetFormat === 'svg') {
      blob = canvasToSvgBlob(canvas);
    } else if (targetFormat === 'tiff') {
      if (window.UTIF) {
        const ctx = canvas.getContext('2d');
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const tiffBuffer = window.UTIF.encodeImage(imgData.data, canvas.width, canvas.height);
        blob = new Blob([tiffBuffer], { type: 'image/tiff' });
      } else {
        const flattened = flattenCanvasBackground(canvas, '#ffffff');
        const ctx = flattened.getContext('2d');
        blob = canvasToBmpBlob(ctx, flattened.width, flattened.height);
      }
    } else if (targetFormat === 'tga') {
      const ctx = canvas.getContext('2d');
      blob = canvasToTgaBlob(ctx, canvas.width, canvas.height);
    } else if (targetFormat === 'bmp') {
      const flattened = flattenCanvasBackground(canvas, '#ffffff');
      const ctx = flattened.getContext('2d');
      blob = canvasToBmpBlob(ctx, flattened.width, flattened.height);
    } else if (targetFormat === 'ppm') {
      const ctx = canvas.getContext('2d');
      blob = canvasToPpmBlob(ctx, canvas.width, canvas.height);
    } else if (targetFormat === 'wbmp') {
      const ctx = canvas.getContext('2d');
      blob = canvasToWbmpBlob(ctx, canvas.width, canvas.height);
    } else if (targetFormat === 'dng') {
      blob = await canvasToDngBlob(canvas);
    }

    if (!blob) throw new Error('Conversion failed.');

    item.convertedBlob = blob;
    item.targetSize = blob.size;
    if (item.convertedUrl) URL.revokeObjectURL(item.convertedUrl);
    item.convertedUrl = URL.createObjectURL(blob);
    item.isConverted = true;
  } catch (err) {
    console.error('Conversion error:', err);
    item.error = err.message || 'Conversion error';
  } finally {
    item.isConverting = false;
    renderQueue();
  }
}

async function convertAll() {
  convertAllBtn.disabled = true;
  for (const item of filesQueue) {
    if (!item.isConverted) {
      await convertItem(item);
    }
  }
  convertAllBtn.disabled = false;
}

// Convert File to HTML5 Canvas (reuses previewBlob for HEIC)
async function fileToCanvas(item) {
  let sourceBlob = item.previewBlob || item.file;

  // If HEIC without preview blob yet
  if (isHeic(item.name) && !item.previewBlob) {
    if (window.heic2any) {
      try {
        const res = await window.heic2any({
          blob: item.file,
          toType: 'image/jpeg',
          quality: 1.0
        });
        sourceBlob = Array.isArray(res) ? res[0] : res;
      } catch (e) {
        throw new Error('HEIC decoding failed: ' + e.message);
      }
    } else {
      throw new Error('HEIC library loading...');
    }
  }

  // If RAW without preview blob yet
  if (isRaw(item.name) && !item.previewBlob) {
    try {
      item.previewBlob = await extractRawImage(item.file);
      sourceBlob = item.previewBlob;
    } catch (e) {
      throw new Error('RAW decoding failed: ' + e.message);
    }
  }

  // TIFF handling
  if (isTiff(item.name) && window.UTIF) {
    const arrayBuffer = await item.file.arrayBuffer();
    const ifds = window.UTIF.decode(arrayBuffer);
    window.UTIF.decodeImage(arrayBuffer, ifds[0]);
    const rgba = window.UTIF.toRGBA8(ifds[0]);
    const canvas = document.createElement('canvas');
    canvas.width = ifds[0].width;
    canvas.height = ifds[0].height;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(canvas.width, canvas.height);
    imgData.data.set(rgba);
    ctx.putImageData(imgData, 0, 0);
    return canvas;
  }

  // Standard loading
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(sourceBlob);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(canvas);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Browser unable to decode image.'));
    };

    img.src = objectUrl;
  });
}

function flattenCanvasBackground(sourceCanvas, fillColor = '#ffffff') {
  const newCanvas = document.createElement('canvas');
  newCanvas.width = sourceCanvas.width;
  newCanvas.height = sourceCanvas.height;
  const ctx = newCanvas.getContext('2d');

  ctx.fillStyle = fillColor;
  ctx.fillRect(0, 0, newCanvas.width, newCanvas.height);
  ctx.drawImage(sourceCanvas, 0, 0);

  return newCanvas;
}

function downloadSingle(item) {
  if (!item.convertedBlob) return;
  const a = document.createElement('a');
  const baseName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
  a.download = `${baseName}.${item.targetFormat}`;
  a.href = item.convertedUrl;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

async function downloadAllZip() {
  if (!window.JSZip) return;
  const zip = new window.JSZip();
  let count = 0;

  filesQueue.forEach(item => {
    if (item.convertedBlob) {
      const baseName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
      const fileName = `${baseName}.${item.targetFormat}`;
      zip.file(fileName, item.convertedBlob);
      count++;
    }
  });

  if (count === 0) return;

  downloadZipBtn.innerHTML = `<svg class="animate-spin h-3.5 w-3.5 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg> ZIP...`;
  downloadZipBtn.disabled = true;

  try {
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.download = `converted_images_${Date.now()}.zip`;
    a.href = URL.createObjectURL(zipBlob);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (err) {
    alert('ZIP generation failed: ' + err.message);
  } finally {
    const t = translations[currentLang] || translations.en;
    downloadZipBtn.innerHTML = `<span class="material-symbols-outlined text-[16px]">folder_zip</span> ${t.downloadZipBtn}`;
    downloadZipBtn.disabled = false;
  }
}

function removeFile(index) {
  const [removed] = filesQueue.splice(index, 1);
  if (removed) {
    if (removed.thumbUrl) URL.revokeObjectURL(removed.thumbUrl);
    if (removed.originalUrl) URL.revokeObjectURL(removed.originalUrl);
    if (removed.previewUrl) URL.revokeObjectURL(removed.previewUrl);
    if (removed.convertedUrl) URL.revokeObjectURL(removed.convertedUrl);
  }
  updateQueueUI();
}

function clearAll() {
  filesQueue.forEach(item => {
    if (item.thumbUrl) URL.revokeObjectURL(item.thumbUrl);
    if (item.originalUrl) URL.revokeObjectURL(item.originalUrl);
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    if (item.convertedUrl) URL.revokeObjectURL(item.convertedUrl);
  });
  filesQueue = [];
  updateQueueUI();
}

// Preview Modal (Inspect)
function openPreviewModal(item) {
  const t = translations[currentLang] || translations.en;
  // Always use previewUrl for HEIC so it's fully visible!
  modalOriginalImg.src = item.previewUrl || item.originalUrl;
  modalConvertedImg.src = item.convertedUrl || item.previewUrl || item.originalUrl;

  modalOrigInfo.innerHTML = `
    <span class="font-bold text-slate-800 dark:text-slate-100">${item.name}</span><br>
    Size: ${formatBytes(item.originalSize)}<br>
    Format: ${item.originalExt.toUpperCase()}
  `;

  if (item.isConverted) {
    const diff = item.targetSize - item.originalSize;
    const percent = Math.round((diff / item.originalSize) * 100);
    modalConvInfo.innerHTML = `
      <span class="font-bold text-slate-800 dark:text-slate-100">Output: .${item.targetFormat.toUpperCase()}</span><br>
      Size: ${formatBytes(item.targetSize)} (${percent < 0 ? `${t.savedPercent} ${Math.abs(percent)}%` : `+${percent}%`})<br>
      Status: ${t.modalConverted}
    `;
  } else {
    modalConvInfo.innerHTML = `
      <span class="font-bold text-slate-800 dark:text-slate-100">Target: .${item.targetFormat.toUpperCase()}</span><br>
      Status: ${t.modalNotConverted}
    `;
  }

  modal.classList.remove('hidden');
}

function closeModal() {
  modal.classList.add('hidden');
}

// Utilities
function getFileExtension(filename) {
  return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2).toLowerCase();
}

function isHeic(filename) {
  const ext = getFileExtension(filename);
  return ext === 'heic' || ext === 'heif';
}

function isTiff(filename) {
  const ext = getFileExtension(filename);
  return ext === 'tiff' || ext === 'tif';
}

function isRaw(filename) {
  const ext = getFileExtension(filename);
  return ['dng', 'cr2', 'cr3', 'nef', 'nrw', 'arw', 'srf', 'sr2', 'raf', 'orf', 'rw2', 'pef', 'raw'].includes(ext);
}

function formatBytes(bytes, decimals = 1) {
  if (!+bytes) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
