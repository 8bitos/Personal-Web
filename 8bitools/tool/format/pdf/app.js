/**
 * 8BitDoc - Main Application Controller
 * High performance client-side Document Scanner & Image-to-PDF Studio
 * Artstyle faithfully consistent with 8BitShiftIMG (Universal Image Converter)
 */

import {
  perspectiveWarp,
  autoDetectDocumentCorners,
  rotateAndFlipCanvas,
  applyDocumentFilter
} from './scanner.js';
import { translations } from './i18n.js';

// Global App State
let pages = [];
let activePageIndex = -1;
let currentLang = 'id';

// Working copy for editor modal
let editorState = {
  activeTab: 'perspective', // 'perspective' | 'filter' | 'rotate'
  corners: [],
  angleDeg: 0,
  flipH: false,
  flipV: false,
  filter: 'magic',
  brightness: 0,
  contrast: 0,
  sharpen: 25,
  threshold: 50,
  showGrid: true,
  isDraggingCorner: false,
  draggedCornerIndex: -1
};

// PDF Preview State
let previewState = {
  currentPage: 0
};

// DOM References
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const cameraInput = document.getElementById('camera-input');
const browseBtn = document.getElementById('browse-btn');
const cameraBtn = document.getElementById('camera-btn');

const queueSection = document.getElementById('queue-section');
const queueList = document.getElementById('queue-list');
const queueCountBadge = document.getElementById('queue-count-badge');
const emptyPlaceholder = document.getElementById('empty-placeholder');
const addMoreBtn = document.getElementById('add-more-btn');
const clearAllBtn = document.getElementById('clear-all-btn');

// PDF Output Control Elements
const pdfPageSize = document.getElementById('pdf-page-size');
const pdfOrientation = document.getElementById('pdf-orientation');
const pdfMargin = document.getElementById('pdf-margin');
const pdfQuality = document.getElementById('pdf-quality');
const pdfPageNumbers = document.getElementById('pdf-page-numbers');
const pdfFilename = document.getElementById('pdf-filename');

const previewPdfBtn = document.getElementById('preview-pdf-btn');
const downloadPdfBtn = document.getElementById('download-pdf-btn');
const downloadZipBtn = document.getElementById('download-zip-btn');

// Studio Modal Elements
const studioModal = document.getElementById('studio-modal');
const studioModalTitle = document.getElementById('studio-modal-title');
const studioModalClose = document.getElementById('studio-modal-close');
const editorCanvas = document.getElementById('editor-canvas');
const loupeCanvas = document.getElementById('loupe-canvas');
const loupeBox = document.getElementById('loupe-box');

// Studio Tabs
const tabPerspectiveBtn = document.getElementById('tab-perspective-btn');
const tabFilterBtn = document.getElementById('tab-filter-btn');
const tabRotateBtn = document.getElementById('tab-rotate-btn');
const panelPerspective = document.getElementById('panel-perspective');
const panelFilter = document.getElementById('panel-filter');
const panelRotate = document.getElementById('panel-rotate');

// Perspective Panel Controls
const autoDetectBtn = document.getElementById('btn-auto-detect');
const resetCornersBtn = document.getElementById('btn-reset-corners');
const snapA4Btn = document.getElementById('btn-snap-a4');

// Rotation & Deskew Controls
const deskewSlider = document.getElementById('deskew-slider');
const deskewValue = document.getElementById('deskew-value');
const resetAngleBtn = document.getElementById('btn-reset-angle');
const gridToggle = document.getElementById('grid-toggle');
const rotateLeftBtn = document.getElementById('btn-rotate-left');
const rotateRightBtn = document.getElementById('btn-rotate-right');
const flipHBtn = document.getElementById('btn-flip-h');
const flipVBtn = document.getElementById('btn-flip-v');

// Filter Panel Controls
const filterPresets = document.querySelectorAll('.filter-preset-btn');
const sliderBrightness = document.getElementById('slider-brightness');
const valBrightness = document.getElementById('val-brightness');
const sliderContrast = document.getElementById('slider-contrast');
const valContrast = document.getElementById('val-contrast');
const sliderSharpen = document.getElementById('slider-sharpen');
const valSharpen = document.getElementById('val-sharpen');
const sliderThreshold = document.getElementById('slider-threshold');
const valThreshold = document.getElementById('val-threshold');
const resetAdjustmentsBtn = document.getElementById('btn-reset-adjustments');

// Modal Footer Buttons
const applySingleBtn = document.getElementById('btn-apply-single');
const applyAllPagesBtn = document.getElementById('btn-apply-all-pages');
const cancelModalBtn = document.getElementById('btn-cancel-modal');

// Preview Modal Elements
const previewModal = document.getElementById('preview-modal');
const previewModalClose = document.getElementById('preview-modal-close');
const previewCanvas = document.getElementById('preview-canvas');
const previewPrevBtn = document.getElementById('preview-prev-btn');
const previewNextBtn = document.getElementById('preview-next-btn');
const previewPageInfo = document.getElementById('preview-page-info');

// Language Elements
const langToggleBtn = document.getElementById('lang-toggle-btn');
const langMenu = document.getElementById('lang-menu');
const currentFlag = document.getElementById('current-flag');
const currentLangCode = document.getElementById('current-lang-code');

// Theme Switcher Elements
const themeToggle = document.getElementById('theme-toggle');

// Toast Notification
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

// Flags Mapping for all 8 Languages
const flagMap = {
  id: '🇮🇩',
  en: '🇬🇧',
  zh: '🇨🇳',
  es: '🇪🇸',
  ar: '🇸🇦',
  fr: '🇫🇷',
  ja: '🇯🇵',
  pt: '🇧🇷'
};

// PWA Install State
let deferredPrompt = null;
const pwaInstallBtn = document.getElementById('pwa-install-btn');

// Register Service Worker for Offline / PWA Support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => {
      console.warn('DocScan Service Worker registration:', err);
    });
  });
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (pwaInstallBtn) {
    pwaInstallBtn.classList.remove('hidden');
  }
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  if (pwaInstallBtn) pwaInstallBtn.classList.add('hidden');
});

/**
 * Show Toast Notification
 */
function showToast(msg, duration = 3000) {
  if (!toast || !toastMessage) return;
  toastMessage.textContent = msg;
  toast.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-4');
  toast.classList.add('opacity-100', 'translate-y-0');

  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove('opacity-100', 'translate-y-0');
    toast.classList.add('opacity-0', 'pointer-events-none', 'translate-y-4');
  }, duration);
}

/**
 * Update UI text based on active language (Full 8 languages support)
 */
function updateLanguage(lang) {
  if (!translations[lang]) lang = 'id';
  currentLang = lang;
  localStorage.setItem('docscan_lang', lang);

  const t = translations[lang] || translations.id;

  if (currentFlag) currentFlag.textContent = flagMap[lang] || '🌐';
  if (currentLangCode) currentLangCode.textContent = lang.toUpperCase();

  // Direction & Language attributes for HTML root
  document.documentElement.lang = lang;
  if (lang === 'ar') {
    document.documentElement.dir = 'rtl';
  } else {
    document.documentElement.dir = 'ltr';
  }

  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el && text !== undefined) el.textContent = text;
  };

  const setHTML = (id, html) => {
    const el = document.getElementById(id);
    if (el && html !== undefined) el.innerHTML = html;
  };

  // Header & Title
  setText('html-title', `8BitDoc — ${t.appTitle}`);
  setText('app-title', t.appTitle);

  // Paper Settings Console
  setText('paper-settings-title', t.paperSettingsTitle);
  setText('paper-settings-sub', t.paperSettingsSubtitle);
  setText('paper-ready-badge', t.paperReadyBadge);
  setText('label-page-size', t.labelPageSize);
  setText('label-orientation', t.labelOrientation);
  setText('label-margin', t.labelMargin);
  setText('label-quality', t.labelQuality);
  setText('label-page-numbers', t.labelPageNumbers);
  setText('label-filename', t.labelFilename);

  // Dropzone
  setText('drop-title-text', t.dropTitle);
  setText('drop-browse-text', t.dropBrowse);
  setText('drop-supported-text', t.dropSupported);
  setText('btn-browse-text', t.btnChooseFiles);
  setText('btn-camera-text', t.btnTakePhoto);
  setText('drop-paste-hint', t.dropPasteHint);

  // Queue Toolbar
  setText('queue-title', t.queueTitle);
  setText('btn-add-more-text', t.btnAdd);
  setText('btn-preview-text', t.btnPreview);
  setText('btn-download-pdf-text', t.btnDownloadPdf);
  setText('btn-download-zip-text', t.btnDownloadZip);
  setText('empty-placeholder-text', t.emptyQueue);

  // Sidebar Guides
  setText('guide-title', t.guideTitle);
  const formatStep = (stepText) => {
    if (!stepText) return '';
    const colonIdx = stepText.indexOf(':');
    if (colonIdx !== -1) {
      return `<strong>${stepText.slice(0, colonIdx + 1)}</strong>${stepText.slice(colonIdx + 1)}`;
    }
    return stepText;
  };
  setHTML('guide-step-1', formatStep(t.guide1));
  setHTML('guide-step-2', formatStep(t.guide2));
  setHTML('guide-step-3', formatStep(t.guide3));
  setText('privacy-card-title', t.privacyTitle);
  setText('privacy-card-desc', t.privacyDesc);

  // Studio Modal Tabs & Labels
  setText('tab-perspective-text', t.tabPerspective);
  setText('tab-filter-text', t.tabFilter);
  setText('tab-rotate-text', t.tabRotate);
  setText('perspective-desc-text', t.perspectiveDesc);
  setText('btn-auto-detect-text', t.btnAutoDetect);
  setText('btn-snap-a4-text', t.btnSnapA4);
  setText('btn-reset-corners-text', t.btnResetCorners);
  setText('loupe-hint-text', t.loupeHint);
  setText('filter-presets-title', t.filterPresets);
  setText('label-brightness-text', t.labelBrightness);
  setText('label-contrast-text', t.labelContrast);
  setText('label-sharpen-text', t.labelSharpen);
  setText('label-threshold-text', t.labelThreshold);
  setText('btn-reset-adjustments', t.btnResetAdjustments);
  setText('deskew-label-text', t.deskewAngle);
  setText('btn-reset-angle', t.resetAngle);
  setText('grid-toggle-text', t.gridToggle);
  setText('btn-cancel-modal', t.btnCancel);
  setText('btn-apply-all-pages', t.btnApplyAll);
  setText('btn-apply-single', t.btnApplySingle);

  // PDF Preview Modal
  setText('preview-modal-title-text', t.previewModalTitle);
  setText('preview-prev-text', t.previewPrev);
  setText('preview-next-text', t.previewNext);

  // Mobile Action Bar
  setText('mobile-preview-label', t.btnPreview);
  setText('mobile-download-label', t.btnDownloadPdf);

  // PWA Install Button
  setText('pwa-install-text', t.installBtn);

  // Filter Preset Labels & Rotate/Flip Labels
  setText('filter-lbl-magic', t.filterMagic);
  setText('filter-lbl-bw', t.filterBw);
  setText('filter-lbl-gray', t.filterGray);
  setText('filter-lbl-soft', t.filterSoft);
  setText('filter-lbl-vivid', t.filterVivid);
  setText('filter-lbl-original', t.filterOriginal);
  setText('btn-flip-h-text', t.flipH);
  setText('btn-flip-v-text', t.flipV);

  // Translate Select Optgroups & Options
  if (t.optgroups) {
    const setOptgroup = (id, label) => {
      const el = document.getElementById(id);
      if (el && label) el.label = label;
    };
    setOptgroup('og-iso', t.optgroups.isoA);
    setOptgroup('og-asia', t.optgroups.asia);
    setOptgroup('og-us', t.optgroups.us);
    setOptgroup('og-card', t.optgroups.card);
    setOptgroup('og-custom', t.optgroups.custom);
  }
  setText('opt-fit', t.fitOption);

  const translateSelect = (selectEl, map) => {
    if (!selectEl || !map) return;
    Array.from(selectEl.options).forEach(opt => {
      if (map[opt.value]) opt.textContent = map[opt.value];
    });
  };

  translateSelect(pdfOrientation, t.orientations);
  translateSelect(pdfMargin, t.margins);
  translateSelect(pdfQuality, t.qualities);
  if (t.pageNumbers) {
    translateSelect(pdfPageNumbers, {
      'none': t.pageNumbers.none,
      'bottom-center': t.pageNumbers.bottomCenter,
      'bottom-right': t.pageNumbers.bottomRight
    });
  }

  // Settings Accordion Label & Summary
  const settingsBody = document.getElementById('settings-collapse-body');
  const settingsToggleLbl = document.getElementById('settings-toggle-label');
  if (settingsToggleLbl && settingsBody) {
    settingsToggleLbl.textContent = settingsBody.classList.contains('hidden') ? (t.btnEditToggle || 'Ubah') : (t.btnCloseToggle || 'Tutup');
  }
  const summaryBadge = document.getElementById('settings-summary-badge');
  if (summaryBadge) {
    const sizeVal = pdfPageSize ? (pdfPageSize.options[pdfPageSize.selectedIndex]?.text.split('(')[0].trim() || 'A4') : 'A4';
    const orientVal = pdfOrientation ? (pdfOrientation.options[pdfOrientation.selectedIndex]?.text.split('(')[0].trim() || 'Auto') : 'Auto';
    const marginVal = pdfMargin ? (pdfMargin.options[pdfMargin.selectedIndex]?.text.split('(')[0].trim() || '') : '';
    summaryBadge.textContent = `${sizeVal} • ${orientVal}${marginVal ? ' • ' + marginVal : ''}`;
  }

  // Update Studio Modal Title if currently open
  if (activePageIndex >= 0 && studioModalTitle) {
    studioModalTitle.innerHTML = `
      <span class="material-symbols-outlined text-sky-600 dark:text-sky-400 text-[18px]">tune</span>
      ${t.modalTitle.replace('{num}', activePageIndex + 1)}
    `;
  }

  updateQueueUI();
}

/**
 * Handle Theme (Dark / Light) with OS real-time sync
 */
function applyTheme(isDark, userInitiated = false) {
  if (isDark) {
    document.documentElement.classList.add('dark');
    if (userInitiated) {
      localStorage.setItem('theme', 'dark');
      localStorage.setItem('theme_user_chosen', 'true');
    }
  } else {
    document.documentElement.classList.remove('dark');
    if (userInitiated) {
      localStorage.setItem('theme', 'light');
      localStorage.setItem('theme_user_chosen', 'true');
    }
  }
}

function initTheme() {
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = saved === 'dark' || (!saved && prefersDark);
  applyTheme(isDark, false);

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme_user_chosen')) {
      applyTheme(e.matches, false);
    }
  });
}

function toggleTheme() {
  const willBeDark = !document.documentElement.classList.contains('dark');
  applyTheme(willBeDark, true);
}

/**
 * Process and Add Files
 */
async function handleFiles(files) {
  if (!files || files.length === 0) return;

  const validFiles = Array.from(files).filter(f => 
    f.type.startsWith('image/') || 
    /\.(heic|heif|tiff|tif|bmp|webp|jpg|jpeg|png|avif)$/i.test(f.name)
  );

  if (validFiles.length === 0) return;

  for (const file of validFiles) {
    try {
      let imageSource = file;

      // Handle HEIC
      if (/\.(heic|heif)$/i.test(file.name) || file.type === 'image/heic') {
        if (window.heic2any) {
          const convertedBlob = await window.heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 });
          imageSource = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
        }
      }

      // Load Image
      const img = await loadImageFromFile(imageSource);
      
      // Create Base Canvas
      const baseCanvas = document.createElement('canvas');
      baseCanvas.width = img.naturalWidth || img.width;
      baseCanvas.height = img.naturalHeight || img.height;
      const bCtx = baseCanvas.getContext('2d');
      bCtx.drawImage(img, 0, 0);

      // Auto detect corners
      const corners = autoDetectDocumentCorners(baseCanvas);

      const pageItem = {
        id: 'page_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
        name: file.name,
        sourceCanvas: baseCanvas,
        width: baseCanvas.width,
        height: baseCanvas.height,
        corners: corners,
        angleDeg: 0,
        flipH: false,
        flipV: false,
        filter: 'magic', // Default smart document filter!
        brightness: 0,
        contrast: 0,
        sharpen: 25,
        threshold: 50,
        renderedCanvas: null
      };

      // Generate initial processed canvas
      pageItem.renderedCanvas = renderPageResult(pageItem);

      pages.push(pageItem);
    } catch (err) {
      console.error('Error loading image:', file.name, err);
    }
  }

  updateQueueUI();
}

function loadImageFromFile(fileOrBlob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(fileOrBlob);
    const img = new Image();
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

/**
 * Render Processed Result for a Page (Warp -> Rotate/Flip -> Filter)
 */
function renderPageResult(page) {
  const warped = perspectiveWarp(page.sourceCanvas, page.corners);
  const rotated = rotateAndFlipCanvas(warped, page.angleDeg, page.flipH, page.flipV);
  const filtered = applyDocumentFilter(rotated, page.filter, {
    brightness: page.brightness,
    contrast: page.contrast,
    sharpen: page.sharpen,
    threshold: page.threshold
  });
  return filtered;
}

/**
 * Update Document Queue (Exact match to Image Converter row card aesthetic)
 */
function updateQueueUI() {
  const t = translations[currentLang] || translations.id;
  const mobileActionBar = document.getElementById('mobile-action-bar');
  const mainEl = document.querySelector('main');

  if (queueCountBadge) {
    queueCountBadge.textContent = t.pageCount ? t.pageCount.replace('{count}', pages.length) : `${pages.length} Halaman`;
  }

  if (pages.length === 0) {
    if (emptyPlaceholder) emptyPlaceholder.classList.remove('hidden');
    if (queueSection) queueSection.classList.add('hidden');
    if (queueList) queueList.innerHTML = '';
    if (mobileActionBar) {
      mobileActionBar.classList.remove('translate-y-0');
      mobileActionBar.classList.add('translate-y-full');
    }
    if (mainEl) mainEl.classList.remove('pb-24');
    return;
  }

  if (emptyPlaceholder) emptyPlaceholder.classList.add('hidden');
  if (queueSection) queueSection.classList.remove('hidden');
  if (mobileActionBar) {
    mobileActionBar.classList.remove('translate-y-full');
    mobileActionBar.classList.add('translate-y-0');
  }
  if (mainEl) mainEl.classList.add('pb-24');

  if (!queueList) return;

  queueList.innerHTML = '';

  pages.forEach((page, index) => {
    const row = document.createElement('div');
    row.className = 'liquid-glass flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-3.5 sm:p-4 rounded-xl border border-black/[0.08] dark:border-white/10 gap-3 sm:gap-4 transition-all hover:border-sky-500/40 shadow-sm';
    row.dataset.index = index;

    // Filter label translated
    let filterName = t.filterMagic || 'Magic Color';
    if (page.filter === 'bw') filterName = t.filterBw || 'Scanner B&W';
    else if (page.filter === 'gray') filterName = t.filterGray || 'Grayscale';
    else if (page.filter === 'soft') filterName = t.filterSoft || 'Soft White';
    else if (page.filter === 'vivid') filterName = t.filterVivid || 'Vivid';
    else if (page.filter === 'original') filterName = t.filterOriginal || 'Original';

    const thumbUrl = page.renderedCanvas.toDataURL('image/jpeg', 0.85);
    const pageNumText = t.pageLabel ? t.pageLabel.replace('{num}', index + 1) : `Hal ${index + 1}`;

    row.innerHTML = `
      <!-- Left: Thumbnail + Title + Meta -->
      <div class="flex items-center gap-3 w-full sm:w-7/12 min-w-0">
        <div class="w-12 h-14 rounded-lg bg-black/[0.04] dark:bg-black/40 flex-shrink-0 flex items-center justify-center overflow-hidden border border-black/[0.08] dark:border-white/10 cursor-pointer relative group" data-action="edit" title="${t.btnStraighten}">
          <img src="${thumbUrl}" class="w-full h-full object-cover" alt="${pageNumText}" />
          <div class="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-sky-300">
            <span class="material-symbols-outlined text-[18px]">tune</span>
          </div>
        </div>

        <div class="min-w-0 flex-1">
          <p class="font-display font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
            ${pageNumText} — ${page.name}
          </p>
          <div class="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span class="px-1.5 py-0.5 rounded bg-black/[0.05] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.06] font-mono text-[10px] text-slate-800 dark:text-slate-300 font-semibold">
              ${pageNumText}
            </span>
            <span>${page.renderedCanvas.width}×${page.renderedCanvas.height}px</span>
            <span>•</span>
            <span class="text-sky-700 dark:text-sky-300 font-medium">${filterName}</span>
            ${page.angleDeg !== 0 ? `<span>• ${page.angleDeg.toFixed(1)}°</span>` : ''}
          </div>
        </div>
      </div>

      <!-- Right: Rotate + Edit Studio + Reorder + Delete -->
      <div class="flex items-center justify-end gap-1.5 w-full sm:w-5/12">
        <button class="btn-liquid-ghost p-1.5 rounded-xl text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400" title="${t.btnRotateRight}" data-action="rotate-right">
          <span class="material-symbols-outlined text-[18px]">rotate_right</span>
        </button>

        <button class="btn-liquid-ghost hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400 py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 text-slate-800 dark:text-slate-200" data-action="edit">
          <span class="material-symbols-outlined text-[15px]">tune</span>
          <span>${t.btnStraighten}</span>
        </button>

        <button class="btn-liquid-ghost p-1.5 rounded-lg text-slate-700 dark:text-slate-300 text-xs ${index === 0 ? 'opacity-30 cursor-not-allowed' : ''}" title="${t.btnMoveUp}" data-action="move-up" ${index === 0 ? 'disabled' : ''}>
          <span class="material-symbols-outlined text-[16px]">arrow_upward</span>
        </button>
        <button class="btn-liquid-ghost p-1.5 rounded-lg text-slate-700 dark:text-slate-300 text-xs ${index === pages.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}" title="${t.btnMoveDown}" data-action="move-down" ${index === pages.length - 1 ? 'disabled' : ''}>
          <span class="material-symbols-outlined text-[16px]">arrow_downward</span>
        </button>

        <button class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors" title="${t.btnDelete}" data-action="delete">
          <span class="material-symbols-outlined text-[18px]">delete</span>
        </button>
      </div>
    `;

    // Row Event Delegation
    row.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;

      if (action === 'edit') {
        openStudioModal(index);
      } else if (action === 'move-up' && index > 0) {
        const temp = pages[index - 1];
        pages[index - 1] = pages[index];
        pages[index] = temp;
        updateQueueUI();
        showToast(t.notifyReordered);
      } else if (action === 'move-down' && index < pages.length - 1) {
        const temp = pages[index + 1];
        pages[index + 1] = pages[index];
        pages[index] = temp;
        updateQueueUI();
        showToast(t.notifyReordered);
      } else if (action === 'rotate-right') {
        page.angleDeg = (page.angleDeg + 90) % 360;
        page.renderedCanvas = renderPageResult(page);
        updateQueueUI();
      } else if (action === 'delete') {
        pages.splice(index, 1);
        updateQueueUI();
      }
    });

    queueList.appendChild(row);
  });
}

/**
 * Open Studio Modal for Page
 */
function openStudioModal(index) {
  if (index < 0 || index >= pages.length) return;
  activePageIndex = index;
  const page = pages[index];

  if (studioModalTitle) {
    studioModalTitle.innerHTML = `
      <span class="material-symbols-outlined text-sky-600 dark:text-sky-400 text-[18px]">tune</span>
      Studio Perapih Dokumen — Halaman ${index + 1}
    `;
  }

  // Clone page settings into editorState
  editorState = {
    activeTab: 'perspective',
    corners: JSON.parse(JSON.stringify(page.corners)),
    angleDeg: page.angleDeg,
    flipH: page.flipH,
    flipV: page.flipV,
    filter: page.filter,
    brightness: page.brightness,
    contrast: page.contrast,
    sharpen: page.sharpen,
    threshold: page.threshold,
    showGrid: true,
    isDraggingCorner: false,
    draggedCornerIndex: -1
  };

  switchStudioTab('perspective');

  if (deskewSlider) deskewSlider.value = editorState.angleDeg;
  if (deskewValue) deskewValue.textContent = editorState.angleDeg.toFixed(1) + '°';
  if (gridToggle) gridToggle.checked = editorState.showGrid;

  if (sliderBrightness) sliderBrightness.value = editorState.brightness;
  if (valBrightness) valBrightness.textContent = editorState.brightness;
  if (sliderContrast) sliderContrast.value = editorState.contrast;
  if (valContrast) valContrast.textContent = editorState.contrast;
  if (sliderSharpen) sliderSharpen.value = editorState.sharpen;
  if (valSharpen) valSharpen.textContent = editorState.sharpen;
  if (sliderThreshold) sliderThreshold.value = editorState.threshold;
  if (valThreshold) valThreshold.textContent = editorState.threshold;

  updateFilterButtonUI();
  redrawEditorCanvas();

  studioModal.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
}

function closeStudioModal() {
  studioModal.classList.add('hidden');
  document.body.classList.remove('overflow-hidden');
  activePageIndex = -1;
}

/**
 * Switch Tab in Studio Modal (Clean segmented style matching Image Converter)
 */
function switchStudioTab(tab) {
  editorState.activeTab = tab;

  [tabPerspectiveBtn, tabFilterBtn, tabRotateBtn].forEach(b => {
    b.className = 'flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 rounded-lg font-medium text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white transition-all flex items-center justify-center gap-1.5 text-center';
  });

  panelPerspective.classList.add('hidden');
  panelFilter.classList.add('hidden');
  panelRotate.classList.add('hidden');

  const activeClasses = 'flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 rounded-lg font-semibold transition-all shadow-sm bg-white dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-black/[0.08] dark:border-sky-400/30 flex items-center justify-center gap-1.5 text-center';

  if (tab === 'perspective') {
    tabPerspectiveBtn.className = activeClasses;
    panelPerspective.classList.remove('hidden');
  } else if (tab === 'filter') {
    tabFilterBtn.className = activeClasses;
    panelFilter.classList.remove('hidden');
  } else if (tab === 'rotate') {
    tabRotateBtn.className = activeClasses;
    panelRotate.classList.remove('hidden');
  }

  redrawEditorCanvas();
}

function updateFilterButtonUI() {
  filterPresets.forEach(btn => {
    if (btn.dataset.filter === editorState.filter) {
      btn.className = 'filter-preset-btn p-1.5 sm:p-2 rounded-xl text-xs font-semibold text-left border border-sky-500 bg-sky-500/10 text-sky-700 dark:text-sky-300 shadow-sm';
    } else {
      btn.className = 'filter-preset-btn p-1.5 sm:p-2 rounded-xl text-xs font-semibold text-left border border-black/[0.08] dark:border-white/10 hover:border-sky-500 transition-all text-slate-800 dark:text-slate-200';
    }
  });
}

/**
 * Redraw Editor Canvas
 */
function redrawEditorCanvas() {
  if (activePageIndex < 0 || !pages[activePageIndex]) return;
  const page = pages[activePageIndex];
  const src = page.sourceCanvas;

  const ctx = editorCanvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;

  const container = editorCanvas.parentElement;
  const maxW = container.clientWidth || 600;
  const maxH = container.clientHeight || 500;

  if (editorState.activeTab === 'perspective') {
    const scale = Math.min(maxW / src.width, maxH / src.height, 1.0);
    const cw = Math.round(src.width * scale);
    const ch = Math.round(src.height * scale);

    editorCanvas.width = cw * dpr;
    editorCanvas.height = ch * dpr;
    editorCanvas.style.width = cw + 'px';
    editorCanvas.style.height = ch + 'px';

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, cw, ch);

    ctx.drawImage(src, 0, 0, cw, ch);

    const pts = editorState.corners.map(p => ({ x: p.x * scale, y: p.y * scale }));

    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(0, 0, cw, ch);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    ctx.lineTo(pts[1].x, pts[1].y);
    ctx.lineTo(pts[2].x, pts[2].y);
    ctx.lineTo(pts[3].x, pts[3].y);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(src, 0, 0, cw, ch);

    if (editorState.showGrid) {
      drawPerspectiveGrid(ctx, pts);
    }
    ctx.restore();

    // Clean boundary line (Sky blue)
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    ctx.lineTo(pts[1].x, pts[1].y);
    ctx.lineTo(pts[2].x, pts[2].y);
    ctx.lineTo(pts[3].x, pts[3].y);
    ctx.closePath();
    ctx.stroke();

    // Corner Handles
    const cornerLabels = ['TL', 'TR', 'BR', 'BL'];
    pts.forEach((pt, i) => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 13, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(2, 132, 199, 0.25)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2.5;
      ctx.fill();
      ctx.stroke();

      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(cornerLabels[i], pt.x, pt.y - 16);
    });

    ctx.restore();
  } else {
    const tempPage = {
      sourceCanvas: src,
      corners: editorState.corners,
      angleDeg: editorState.angleDeg,
      flipH: editorState.flipH,
      flipV: editorState.flipV,
      filter: editorState.filter,
      brightness: editorState.brightness,
      contrast: editorState.contrast,
      sharpen: editorState.sharpen,
      threshold: editorState.threshold
    };

    const rendered = renderPageResult(tempPage);
    const scale = Math.min(maxW / rendered.width, maxH / rendered.height, 1.0);
    const cw = Math.round(rendered.width * scale);
    const ch = Math.round(rendered.height * scale);

    editorCanvas.width = cw * dpr;
    editorCanvas.height = ch * dpr;
    editorCanvas.style.width = cw + 'px';
    editorCanvas.style.height = ch + 'px';

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(rendered, 0, 0, cw, ch);

    if (editorState.activeTab === 'rotate' && editorState.showGrid) {
      drawAlignmentGrid(ctx, cw, ch);
    }

    ctx.restore();
  }
}

function drawPerspectiveGrid(ctx, pts) {
  ctx.strokeStyle = 'rgba(2, 132, 199, 0.4)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);

  const divisions = 4;
  for (let i = 1; i < divisions; i++) {
    const t = i / divisions;

    const lx = pts[0].x + (pts[3].x - pts[0].x) * t;
    const ly = pts[0].y + (pts[3].y - pts[0].y) * t;
    const rx = pts[1].x + (pts[2].x - pts[1].x) * t;
    const ry = pts[1].y + (pts[2].y - pts[1].y) * t;

    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(rx, ry);
    ctx.stroke();

    const tx = pts[0].x + (pts[1].x - pts[0].x) * t;
    const ty = pts[0].y + (pts[1].y - pts[0].y) * t;
    const bx = pts[3].x + (pts[2].x - pts[3].x) * t;
    const by = pts[3].y + (pts[2].y - pts[3].y) * t;

    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(bx, by);
    ctx.stroke();
  }
}

function drawAlignmentGrid(ctx, w, h) {
  ctx.strokeStyle = 'rgba(2, 132, 199, 0.35)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);

  const step = 40;
  for (let x = step; x < w; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = step; y < h; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
}

/**
 * Handle Pointer Drag on Corners + Magnifying Loupe
 */
function initCanvasPointerEvents() {
  const getCanvasCoords = (e) => {
    const rect = editorCanvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : (e.changedTouches ? e.changedTouches[0] : e);
    const clientX = touch.clientX;
    const clientY = touch.clientY;
    const page = pages[activePageIndex];
    const scale = rect.width / page.sourceCanvas.width;

    return {
      x: (clientX - rect.left) / scale,
      y: (clientY - rect.top) / scale,
      screenX: clientX,
      screenY: clientY,
      rect,
      scale
    };
  };

  const onPointerDown = (e) => {
    if (editorState.activeTab !== 'perspective' || activePageIndex < 0) return;
    const page = pages[activePageIndex];
    const rect = editorCanvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : (e.changedTouches ? e.changedTouches[0] : e);
    const clientX = touch.clientX;
    const clientY = touch.clientY;
    const scale = rect.width / page.sourceCanvas.width;

    // Use generous screen pixels threshold (44px) so touch hit detection on mobile is easy & responsive
    const screenThreshold = 44;
    let closestIdx = -1;
    let minDist = screenThreshold;

    editorState.corners.forEach((pt, idx) => {
      const screenPtX = rect.left + pt.x * scale;
      const screenPtY = rect.top + pt.y * scale;
      const dist = Math.hypot(screenPtX - clientX, screenPtY - clientY);
      if (dist < minDist) {
        minDist = dist;
        closestIdx = idx;
      }
    });

    if (closestIdx !== -1) {
      editorState.isDraggingCorner = true;
      editorState.draggedCornerIndex = closestIdx;
      const coords = getCanvasCoords(e);
      updateLoupe(coords.x, coords.y);
      if (e.cancelable) e.preventDefault();
    }
  };

  const onPointerMove = (e) => {
    if (!editorState.isDraggingCorner || activePageIndex < 0) return;
    const page = pages[activePageIndex];
    const coords = getCanvasCoords(e);

    const clampedX = Math.max(0, Math.min(page.sourceCanvas.width, Math.round(coords.x)));
    const clampedY = Math.max(0, Math.min(page.sourceCanvas.height, Math.round(coords.y)));

    editorState.corners[editorState.draggedCornerIndex] = { x: clampedX, y: clampedY };
    redrawEditorCanvas();
    updateLoupe(clampedX, clampedY);
    if (e.cancelable) e.preventDefault();
  };

  const onPointerUp = () => {
    if (editorState.isDraggingCorner) {
      editorState.isDraggingCorner = false;
      editorState.draggedCornerIndex = -1;
      hideLoupe();
    }
  };

  editorCanvas.addEventListener('mousedown', onPointerDown);
  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mouseup', onPointerUp);

  editorCanvas.addEventListener('touchstart', onPointerDown, { passive: false });
  window.addEventListener('touchmove', onPointerMove, { passive: false });
  window.addEventListener('touchend', onPointerUp);
  window.addEventListener('touchcancel', onPointerUp);
}

function updateLoupe(imgX, imgY) {
  if (!loupeBox || !loupeCanvas || activePageIndex < 0) return;
  const page = pages[activePageIndex];
  const src = page.sourceCanvas;

  loupeBox.classList.remove('hidden');

  // Reposition loupe away from the finger so it's never covered
  if (editorState.draggedCornerIndex === 1) { // Top-Right corner
    loupeBox.style.right = 'auto';
    loupeBox.style.left = '12px';
  } else {
    loupeBox.style.left = 'auto';
    loupeBox.style.right = '12px';
  }

  const lCtx = loupeCanvas.getContext('2d');
  const lw = loupeCanvas.width;
  const lh = loupeCanvas.height;

  lCtx.clearRect(0, 0, lw, lh);

  const zoom = 3.0;
  const sampleW = lw / zoom;
  const sampleH = lh / zoom;

  const sx = imgX - sampleW / 2;
  const sy = imgY - sampleH / 2;

  lCtx.drawImage(src, sx, sy, sampleW, sampleH, 0, 0, lw, lh);

  // Red Crosshair
  lCtx.strokeStyle = '#ef4444';
  lCtx.lineWidth = 1.5;
  lCtx.beginPath();
  lCtx.moveTo(lw / 2, 0);
  lCtx.lineTo(lw / 2, lh);
  lCtx.moveTo(0, lh / 2);
  lCtx.lineTo(lw, lh / 2);
  lCtx.stroke();

  lCtx.beginPath();
  lCtx.arc(lw / 2, lh / 2, 4, 0, Math.PI * 2);
  lCtx.stroke();
}

function hideLoupe() {
  if (loupeBox) loupeBox.classList.add('hidden');
}

/**
 * Apply Studio Modal Changes
 */
function applyStudioChanges(toAllPages = false) {
  if (activePageIndex < 0) return;
  const t = translations[currentLang] || translations.id;

  if (toAllPages) {
    pages.forEach(p => {
      p.filter = editorState.filter;
      p.brightness = editorState.brightness;
      p.contrast = editorState.contrast;
      p.sharpen = editorState.sharpen;
      p.threshold = editorState.threshold;
      p.angleDeg = editorState.angleDeg;
      p.flipH = editorState.flipH;
      p.flipV = editorState.flipV;
      p.renderedCanvas = renderPageResult(p);
    });
    showToast(t.notifyAppliedAll);
  } else {
    const p = pages[activePageIndex];
    p.corners = JSON.parse(JSON.stringify(editorState.corners));
    p.angleDeg = editorState.angleDeg;
    p.flipH = editorState.flipH;
    p.flipV = editorState.flipV;
    p.filter = editorState.filter;
    p.brightness = editorState.brightness;
    p.contrast = editorState.contrast;
    p.sharpen = editorState.sharpen;
    p.threshold = editorState.threshold;
    p.renderedCanvas = renderPageResult(p);
    showToast(t.notifyApplied);
  }

  updateQueueUI();
  closeStudioModal();
}

/**
 * PDF Document Generation using jsPDF
 */
async function generatePdf() {
  if (pages.length === 0) {
    const t = translations[currentLang] || translations.id;
    showToast(t.notifyNeedImage);
    return;
  }

  const t = translations[currentLang] || translations.id;
  showToast(t.notifyGeneratingPdf);

  const { jsPDF } = window.jspdf;
  if (!jsPDF) {
    alert('Library jsPDF belum termuat.');
    return;
  }

  const pageSizeSetting = pdfPageSize ? pdfPageSize.value : 'a4';
  const orientationSetting = pdfOrientation ? pdfOrientation.value : 'auto';
  const marginSetting = pdfMargin ? pdfMargin.value : 'none';
  const qualitySetting = pdfQuality ? pdfQuality.value : 'high';
  const pageNumbersSetting = pdfPageNumbers ? pdfPageNumbers.value : 'none';
  const outputFileName = (pdfFilename && pdfFilename.value.trim()) ? pdfFilename.value.trim() : 'Dokumen-Pindai';

  let marginMm = 0;
  if (marginSetting === 'small') marginMm = 5;
  else if (marginSetting === 'normal') marginMm = 10;
  else if (marginSetting === 'large') marginMm = 20;

  let jpegQuality = 0.92;
  if (qualitySetting === 'balanced') jpegQuality = 0.82;
  else if (qualitySetting === 'compact') jpegQuality = 0.65;

  // Comprehensive Paper Sizes in Millimeters [Width, Height]
  const paperSizes = {
    a4: [210.0, 297.0],
    a3: [297.0, 420.0],
    a5: [148.0, 210.0],
    a6: [105.0, 148.0],
    a2: [420.0, 594.0],
    f4: [215.0, 330.0],
    b5: [176.0, 250.0],
    b4: [250.0, 353.0],
    letter: [215.9, 279.4],
    legal: [215.9, 355.6],
    executive: [184.1, 266.7],
    tabloid: [279.4, 431.8],
    idcard: [85.6, 54.0],
    business_card: [90.0, 55.0],
    receipt: [80.0, 200.0]
  };

  let doc = null;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const canvas = page.renderedCanvas;
    const imgAspect = canvas.width / canvas.height;

    let isLandscape = imgAspect > 1.0;
    if (orientationSetting === 'portrait') isLandscape = false;
    if (orientationSetting === 'landscape') isLandscape = true;

    let pWidth, pHeight;

    if (pageSizeSetting === 'fit') {
      marginMm = 0;
      pWidth = isLandscape ? 297 : 210;
      pHeight = pWidth / imgAspect;
    } else {
      const dims = paperSizes[pageSizeSetting] || [210.0, 297.0];
      pWidth = dims[0];
      pHeight = dims[1];
    }

    if (isLandscape && pageSizeSetting !== 'fit') {
      const tmp = pWidth;
      pWidth = pHeight;
      pHeight = tmp;
    }

    if (i === 0) {
      doc = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [pWidth, pHeight]
      });
    } else {
      doc.addPage(
        [pWidth, pHeight],
        isLandscape ? 'landscape' : 'portrait'
      );
    }

    const availW = pWidth - marginMm * 2;
    const availH = pHeight - marginMm * 2;
    const availAspect = availW / availH;

    let renderW = availW;
    let renderH = availH;
    let offsetX = marginMm;
    let offsetY = marginMm;

    if (imgAspect > availAspect) {
      renderW = availW;
      renderH = availW / imgAspect;
      offsetY = marginMm + (availH - renderH) / 2;
    } else {
      renderH = availH;
      renderW = availH * imgAspect;
      offsetX = marginMm + (availW - renderW) / 2;
    }

    const imgDataUrl = canvas.toDataURL('image/jpeg', jpegQuality);
    doc.addImage(imgDataUrl, 'JPEG', offsetX, offsetY, renderW, renderH, undefined, 'FAST');

    if (pageNumbersSetting !== 'none') {
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      const pageStr = `${currentLang === 'id' ? 'Hal' : 'Page'} ${i + 1} / ${pages.length}`;
      if (pageNumbersSetting === 'bottom-center') {
        doc.text(pageStr, pWidth / 2, pHeight - Math.max(3, marginMm / 2), { align: 'center' });
      } else if (pageNumbersSetting === 'bottom-right') {
        doc.text(pageStr, pWidth - Math.max(6, marginMm), pHeight - Math.max(3, marginMm / 2), { align: 'right' });
      }
    }
  }

  doc.save(`${outputFileName}.pdf`);
  showToast(t.notifyPdfReady);
}

/**
 * Preview PDF Modal
 */
function openPdfPreview() {
  if (pages.length === 0) {
    const t = translations[currentLang] || translations.id;
    showToast(t.notifyNeedImage);
    return;
  }

  previewState.currentPage = 0;
  previewModal.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
  renderPreviewPage();
}

function renderPreviewPage() {
  if (pages.length === 0 || !previewCanvas) return;
  const page = pages[previewState.currentPage];

  const ctx = previewCanvas.getContext('2d');
  const canvas = page.renderedCanvas;

  previewCanvas.width = canvas.width;
  previewCanvas.height = canvas.height;
  ctx.drawImage(canvas, 0, 0);

  if (previewPageInfo) {
    previewPageInfo.textContent = `Halaman ${previewState.currentPage + 1} dari ${pages.length}`;
  }

  if (previewPrevBtn) previewPrevBtn.disabled = previewState.currentPage === 0;
  if (previewNextBtn) previewNextBtn.disabled = previewState.currentPage === pages.length - 1;
}

function closePdfPreview() {
  previewModal.classList.add('hidden');
  document.body.classList.remove('overflow-hidden');
}

/**
 * Download Enhanced Images as ZIP
 */
async function downloadImagesZip() {
  if (pages.length === 0) {
    const t = translations[currentLang] || translations.id;
    showToast(t.notifyNeedImage);
    return;
  }

  if (!window.JSZip) {
    alert('JSZip library belum termuat.');
    return;
  }

  const zip = new window.JSZip();
  const folder = zip.folder('Dokumen-Pindai');

  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    const dataUrl = p.renderedCanvas.toDataURL('image/jpeg', 0.95);
    const base64 = dataUrl.split(',')[1];
    const paddedNum = String(i + 1).padStart(2, '0');
    folder.file(`Hal-${paddedNum}.jpg`, base64, { base64: true });
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(content);
  a.download = 'Dokumen-Pindai-Gambar.zip';
  a.click();
  URL.revokeObjectURL(a.href);

  const t = translations[currentLang] || translations.id;
  showToast(t.notifyZipReady);
}

/**
 * Initialize Event Listeners
 */
function initEvents() {
  // Theme Switcher Sync (Exact match to Image Converter)
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  // Language Dropdown
  if (langToggleBtn && langMenu) {
    langToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      langMenu.classList.toggle('hidden');
    });

    langMenu.querySelectorAll('button[data-lang]').forEach(btn => {
      btn.addEventListener('click', () => {
        updateLanguage(btn.dataset.lang);
        langMenu.classList.add('hidden');
      });
    });

    document.addEventListener('click', (e) => {
      if (!langMenu.contains(e.target) && !langToggleBtn.contains(e.target)) {
        langMenu.classList.add('hidden');
      }
    });
  }

  // Dropzone drag & drop
  if (dropZone) {
    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('drag-active');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('drag-active');
      });
    });

    dropZone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      if (dt && dt.files) {
        handleFiles(dt.files);
      }
    });

    dropZone.addEventListener('click', (e) => {
      if (e.target.closest('#camera-btn') || e.target.closest('#browse-btn')) return;
      if (fileInput) fileInput.click();
    });
  }

  // Paste from clipboard (Ctrl+V)
  window.addEventListener('paste', (e) => {
    const items = (e.clipboardData || e.originalEvent?.clipboardData)?.items;
    if (!items) return;
    const pastedFiles = [];
    for (let item of items) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        pastedFiles.push(item.getAsFile());
      }
    }
    if (pastedFiles.length > 0) {
      handleFiles(pastedFiles);
    }
  });

  if (browseBtn && fileInput) {
    browseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.click();
    });
  }

  if (cameraBtn && cameraInput) {
    cameraBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      cameraInput.click();
    });
  }

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      handleFiles(e.target.files);
      fileInput.value = '';
    });
  }

  if (cameraInput) {
    cameraInput.addEventListener('change', (e) => {
      handleFiles(e.target.files);
      cameraInput.value = '';
    });
  }

  if (addMoreBtn && fileInput) {
    addMoreBtn.addEventListener('click', () => fileInput.click());
  }

  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', () => {
      if (pages.length === 0) return;
      const t = translations[currentLang] || translations.id;
      if (confirm(t.confirmClear)) {
        pages = [];
        updateQueueUI();
      }
    });
  }

  // Studio Modal Tabs
  if (tabPerspectiveBtn) tabPerspectiveBtn.addEventListener('click', () => switchStudioTab('perspective'));
  if (tabFilterBtn) tabFilterBtn.addEventListener('click', () => switchStudioTab('filter'));
  if (tabRotateBtn) tabRotateBtn.addEventListener('click', () => switchStudioTab('rotate'));
  if (studioModalClose) studioModalClose.addEventListener('click', closeStudioModal);
  if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeStudioModal);

  // Perspective Helpers
  if (autoDetectBtn) {
    autoDetectBtn.addEventListener('click', () => {
      if (activePageIndex < 0) return;
      const p = pages[activePageIndex];
      editorState.corners = autoDetectDocumentCorners(p.sourceCanvas);
      redrawEditorCanvas();
      const t = translations[currentLang] || translations.id;
      showToast(t.notifyAutoDetected || 'Sudut otomatis terdeteksi!');
    });
  }

  if (resetCornersBtn) {
    resetCornersBtn.addEventListener('click', () => {
      if (activePageIndex < 0) return;
      const p = pages[activePageIndex];
      const w = p.sourceCanvas.width;
      const h = p.sourceCanvas.height;
      editorState.corners = [
        { x: 0, y: 0 },
        { x: w, y: 0 },
        { x: w, y: h },
        { x: 0, y: h }
      ];
      redrawEditorCanvas();
    });
  }

  if (snapA4Btn) {
    snapA4Btn.addEventListener('click', () => {
      if (activePageIndex < 0) return;
      const p = pages[activePageIndex];
      const w = p.sourceCanvas.width;
      const h = p.sourceCanvas.height;
      const targetAspect = 1.0 / 1.4142;
      let boxW = w * 0.9;
      let boxH = boxW / targetAspect;
      if (boxH > h * 0.9) {
        boxH = h * 0.9;
        boxW = boxH * targetAspect;
      }
      const mx = (w - boxW) / 2;
      const my = (h - boxH) / 2;
      editorState.corners = [
        { x: Math.round(mx), y: Math.round(my) },
        { x: Math.round(mx + boxW), y: Math.round(my) },
        { x: Math.round(mx + boxW), y: Math.round(my + boxH) },
        { x: Math.round(mx), y: Math.round(my + boxH) }
      ];
      redrawEditorCanvas();
    });
  }

  // Rotation & Deskew Controls
  if (deskewSlider) {
    deskewSlider.addEventListener('input', (e) => {
      editorState.angleDeg = parseFloat(e.target.value);
      if (deskewValue) deskewValue.textContent = editorState.angleDeg.toFixed(1) + '°';
      redrawEditorCanvas();
    });
  }

  if (resetAngleBtn) {
    resetAngleBtn.addEventListener('click', () => {
      editorState.angleDeg = 0;
      if (deskewSlider) deskewSlider.value = 0;
      if (deskewValue) deskewValue.textContent = '0.0°';
      redrawEditorCanvas();
    });
  }

  if (gridToggle) {
    gridToggle.addEventListener('change', (e) => {
      editorState.showGrid = e.target.checked;
      redrawEditorCanvas();
    });
  }

  if (rotateLeftBtn) {
    rotateLeftBtn.addEventListener('click', () => {
      editorState.angleDeg = (editorState.angleDeg - 90) % 360;
      if (deskewSlider) deskewSlider.value = editorState.angleDeg;
      if (deskewValue) deskewValue.textContent = editorState.angleDeg.toFixed(1) + '°';
      redrawEditorCanvas();
    });
  }

  if (rotateRightBtn) {
    rotateRightBtn.addEventListener('click', () => {
      editorState.angleDeg = (editorState.angleDeg + 90) % 360;
      if (deskewSlider) deskewSlider.value = editorState.angleDeg;
      if (deskewValue) deskewValue.textContent = editorState.angleDeg.toFixed(1) + '°';
      redrawEditorCanvas();
    });
  }

  if (flipHBtn) {
    flipHBtn.addEventListener('click', () => {
      editorState.flipH = !editorState.flipH;
      redrawEditorCanvas();
    });
  }

  if (flipVBtn) {
    flipVBtn.addEventListener('click', () => {
      editorState.flipV = !editorState.flipV;
      redrawEditorCanvas();
    });
  }

  // Filter Presets & Sliders
  filterPresets.forEach(btn => {
    btn.addEventListener('click', () => {
      editorState.filter = btn.dataset.filter;
      updateFilterButtonUI();
      redrawEditorCanvas();
    });
  });

  if (sliderBrightness) {
    sliderBrightness.addEventListener('input', (e) => {
      editorState.brightness = parseInt(e.target.value, 10);
      if (valBrightness) valBrightness.textContent = editorState.brightness;
      redrawEditorCanvas();
    });
  }

  if (sliderContrast) {
    sliderContrast.addEventListener('input', (e) => {
      editorState.contrast = parseInt(e.target.value, 10);
      if (valContrast) valContrast.textContent = editorState.contrast;
      redrawEditorCanvas();
    });
  }

  if (sliderSharpen) {
    sliderSharpen.addEventListener('input', (e) => {
      editorState.sharpen = parseInt(e.target.value, 10);
      if (valSharpen) valSharpen.textContent = editorState.sharpen;
      redrawEditorCanvas();
    });
  }

  if (sliderThreshold) {
    sliderThreshold.addEventListener('input', (e) => {
      editorState.threshold = parseInt(e.target.value, 10);
      if (valThreshold) valThreshold.textContent = editorState.threshold;
      redrawEditorCanvas();
    });
  }

  if (resetAdjustmentsBtn) {
    resetAdjustmentsBtn.addEventListener('click', () => {
      editorState.brightness = 0;
      editorState.contrast = 0;
      editorState.sharpen = 25;
      editorState.threshold = 50;
      if (sliderBrightness) sliderBrightness.value = 0;
      if (valBrightness) valBrightness.textContent = 0;
      if (sliderContrast) sliderContrast.value = 0;
      if (valContrast) valContrast.textContent = 0;
      if (sliderSharpen) sliderSharpen.value = 25;
      if (valSharpen) valSharpen.textContent = 25;
      if (sliderThreshold) sliderThreshold.value = 50;
      if (valThreshold) valThreshold.textContent = 50;
      redrawEditorCanvas();
    });
  }

  // Modal Actions
  if (applySingleBtn) applySingleBtn.addEventListener('click', () => applyStudioChanges(false));
  if (applyAllPagesBtn) applyAllPagesBtn.addEventListener('click', () => applyStudioChanges(true));

  // PDF Preview & Download
  if (previewPdfBtn) previewPdfBtn.addEventListener('click', openPdfPreview);
  if (previewModalClose) previewModalClose.addEventListener('click', closePdfPreview);

  if (previewPrevBtn) {
    previewPrevBtn.addEventListener('click', () => {
      if (previewState.currentPage > 0) {
        previewState.currentPage--;
        renderPreviewPage();
      }
    });
  }

  if (previewNextBtn) {
    previewNextBtn.addEventListener('click', () => {
      if (previewState.currentPage < pages.length - 1) {
        previewState.currentPage++;
        renderPreviewPage();
      }
    });
  }

  if (downloadPdfBtn) downloadPdfBtn.addEventListener('click', generatePdf);
  if (downloadZipBtn) downloadZipBtn.addEventListener('click', downloadImagesZip);

  // Mobile Action Bar Buttons (Fast mobile-first conversion)
  const mobilePreviewBtn = document.getElementById('mobile-preview-btn');
  const mobileDownloadBtn = document.getElementById('mobile-download-btn');
  if (mobilePreviewBtn) mobilePreviewBtn.addEventListener('click', openPdfPreview);
  if (mobileDownloadBtn) mobileDownloadBtn.addEventListener('click', generatePdf);

  // PWA Install Button Handler
  if (pwaInstallBtn) {
    pwaInstallBtn.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        pwaInstallBtn.classList.add('hidden');
      }
      deferredPrompt = null;
    });
  }

  // Accordion Toggle for PDF Settings Console on Mobile
  const settingsAccordionHeader = document.getElementById('settings-accordion-header');
  const settingsCollapseBody = document.getElementById('settings-collapse-body');
  const settingsChevron = document.getElementById('settings-chevron');
  const settingsSummaryBadge = document.getElementById('settings-summary-badge');
  const settingsToggleLabel = document.getElementById('settings-toggle-label');

  function updateSettingsSummary() {
    if (!settingsSummaryBadge) return;
    const sizeVal = pdfPageSize ? (pdfPageSize.options[pdfPageSize.selectedIndex]?.text.split('(')[0].trim() || 'A4') : 'A4';
    const orientVal = pdfOrientation ? (pdfOrientation.options[pdfOrientation.selectedIndex]?.text.split('(')[0].trim() || 'Otomatis') : 'Otomatis';
    const marginVal = pdfMargin ? (pdfMargin.options[pdfMargin.selectedIndex]?.text.split('(')[0].trim() || 'Tanpa Margin') : 'Tanpa Margin';
    settingsSummaryBadge.textContent = `${sizeVal} • ${orientVal} • ${marginVal}`;
  }

  if (settingsAccordionHeader && settingsCollapseBody) {
    settingsAccordionHeader.addEventListener('click', () => {
      const t = translations[currentLang] || translations.id;
      const isHidden = settingsCollapseBody.classList.contains('hidden');
      if (isHidden) {
        settingsCollapseBody.classList.remove('hidden');
        if (settingsChevron) settingsChevron.classList.add('rotate-180');
        if (settingsToggleLabel) settingsToggleLabel.textContent = t.btnCloseToggle || 'Tutup';
      } else {
        settingsCollapseBody.classList.add('hidden');
        if (settingsChevron) settingsChevron.classList.remove('rotate-180');
        if (settingsToggleLabel) settingsToggleLabel.textContent = t.btnEditToggle || 'Ubah';
      }
    });

    [pdfPageSize, pdfOrientation, pdfMargin].forEach(el => {
      if (el) el.addEventListener('change', updateSettingsSummary);
    });
    updateSettingsSummary();
  }

  initCanvasPointerEvents();
}

function bootstrapApp() {
  initTheme();
  initEvents();
  let savedLang = localStorage.getItem('docscan_lang');
  if (!savedLang || !translations[savedLang]) {
    const browserLang = (navigator.language || navigator.userLanguage || 'id').toLowerCase();
    if (browserLang.startsWith('en')) savedLang = 'en';
    else if (browserLang.startsWith('zh')) savedLang = 'zh';
    else if (browserLang.startsWith('es')) savedLang = 'es';
    else if (browserLang.startsWith('ar')) savedLang = 'ar';
    else if (browserLang.startsWith('fr')) savedLang = 'fr';
    else if (browserLang.startsWith('ja')) savedLang = 'ja';
    else if (browserLang.startsWith('pt')) savedLang = 'pt';
    else savedLang = 'id';
  }
  updateLanguage(savedLang);
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', bootstrapApp);
} else {
  bootstrapApp();
}
