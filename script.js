/* ==============================
   🚀 PERSONAL WEBSITE — SCRIPTS
   ============================== */

document.addEventListener('DOMContentLoaded', () => {
    // Init Lucide Icons
    if (window.lucide) lucide.createIcons();

    // Page Loader
    initLoader();

    // Particle Background
    initParticles();

    // Cursor Glow
    initCursorGlow();

    // Typing Effect (after hero render)

    // Navbar
    initNavbar();

    // Scroll Reveal
    initScrollReveal();

    // Content from JSON
    initContentFromJson();

    // Stat Counter (after JSON render)

    // 3D Tilt on Project Cards
    initTiltEffect();

    // Contact Form
    initContactForm();

    // Bird Spawner
    initBirdSpawner();
});

/* ============ LOADER ============ */
function initLoader() {
    document.body.classList.add('loading');
    window.addEventListener('load', () => {
        setTimeout(() => {
            document.getElementById('page-loader').classList.add('hidden');
            document.body.classList.remove('loading');
        }, 600);
    });
    // Fallback: hide loader after 3s
    setTimeout(() => {
        document.getElementById('page-loader').classList.add('hidden');
        document.body.classList.remove('loading');
    }, 3000);
}

/* ============ PARTICLE BACKGROUND ============ */
function initParticles() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    let mouseX = 0, mouseY = 0;
    let animId;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    class Particle {
        constructor() {
            this.reset();
        }
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 0.5;
            this.speedX = (Math.random() - 0.5) * 0.3;
            this.speedY = (Math.random() - 0.5) * 0.3;
            this.opacity = Math.random() * 0.5 + 0.1;
            this.color = Math.random() > 0.5 ? '0, 212, 255' : '139, 92, 246';
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            // Mouse influence
            const dx = mouseX - this.x;
            const dy = mouseY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150) {
                this.x -= dx * 0.005;
                this.y -= dy * 0.005;
            }

            if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
            if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${this.color}, ${this.opacity})`;
            ctx.fill();
        }
    }

    if (window.innerWidth <= 768) return;
    const count = Math.min(16, Math.floor((canvas.width * canvas.height) / 60000));
    for (let i = 0; i < count; i++) particles.push(new Particle());

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();
        }
        animId = requestAnimationFrame(animate);
    }
    animate();

    document.addEventListener('mousemove', e => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    }, { passive: true });
}

/* ============ CURSOR GLOW ============ */
function initCursorGlow() {
    const glow = document.getElementById('cursor-glow');
    if (!glow) return;
    glow.style.display = 'none';
}

/* ============ GLITCH SWAP EFFECT — P3R Themed ============ */
function initWordRotator() {
    const el = document.getElementById('rotator-text');
    if (!el) return;

    const words = Array.isArray(window.__typedWords) && window.__typedWords.length
        ? window.__typedWords
        : ['Web Developer', 'UI Designer', 'Tech Enthusiast', 'Problem Solver', 'Creative Coder'];

    // Characters to scramble through during glitch
    const glitchChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#@!%&?/$';

    let index = 0;
    let scrambleInterval = null;

    // Set initial word
    el.textContent = words[index];

    function scramble(targetWord, duration, onDone) {
        const len = targetWord.length;
        const start = Date.now();
        clearInterval(scrambleInterval);
        scrambleInterval = setInterval(() => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);

            // Number of locked (correct) chars increases over time
            const lockedCount = Math.floor(progress * len);
            let result = '';
            for (let i = 0; i < len; i++) {
                if (targetWord[i] === ' ') {
                    result += ' ';
                } else if (i < lockedCount) {
                    result += targetWord[i];
                } else {
                    result += glitchChars[Math.floor(Math.random() * glitchChars.length)];
                }
            }
            el.textContent = result;

            if (progress >= 1) {
                clearInterval(scrambleInterval);
                el.textContent = targetWord;
                if (onDone) onDone();
            }
        }, 30);
    }

    function rotate() {
        const nextIndex = (index + 1) % words.length;
        const nextWord = words[nextIndex];

        // 1. Glitch OUT current word
        el.classList.add('glitching');

        // 2. At peak of glitch, swap & scramble IN
        setTimeout(() => {
            el.classList.remove('glitching');
            index = nextIndex;
            el.textContent = nextWord;
            el.classList.add('glitch-in');

            // Scramble resolve after glitch-in starts
            setTimeout(() => {
                el.classList.remove('glitch-in');
                scramble(nextWord, 400, null);
            }, 100);

        }, 450); // matches glitch out duration
    }

    // Rotate every 3.5 seconds
    setInterval(rotate, 3500);
}

/* ============ P3R / LIQUID GLASS TABLET TAB NAVIGATION ============ */
function moveLiquidGlider({ container, gliderId, gliderClass, activeSelector, targetItem, animate = true }) {
    if (!container) return;
    let glider = document.getElementById(gliderId);
    if (!glider) {
        glider = document.createElement('div');
        glider.id = gliderId;
        glider.className = gliderClass;
        glider.setAttribute('aria-hidden', 'true');
        container.prepend(glider);
    }

    const active = targetItem || container.querySelector(activeSelector);
    if (!active || active.offsetWidth === 0) return;

    const x = active.offsetLeft;
    const y = active.offsetTop;
    const w = active.offsetWidth;
    const h = active.offsetHeight;

    if (!animate || typeof glider._prevX !== 'number') {
        glider.style.transition = 'none';
        glider.style.width = `${w}px`;
        glider.style.height = `${h}px`;
        glider.style.transform = `translate3d(${x}px, ${y}px, 0) scale(1, 1)`;
        glider._prevX = x;
        glider._prevY = y;
        glider._prevW = w;
        requestAnimationFrame(() => {
            glider.style.transition = '';
        });
        return;
    }

    const dx = x - glider._prevX;
    const dy = y - glider._prevY;
    const dist = Math.hypot(dx, dy);

    glider.style.width = `${w}px`;
    glider.style.height = `${h}px`;
    glider.style.transform = `translate3d(${x}px, ${y}px, 0) scale(1, 1)`;

    if (dist > 4 && glider.animate) {
        const stretchX = Math.abs(dx) > Math.abs(dy) ? 1 + Math.min(0.34, Math.abs(dx) / 260) : 0.94;
        const stretchY = Math.abs(dx) > Math.abs(dy) ? 0.9 : 1 + Math.min(0.25, Math.abs(dy) / 180);
        const midX = glider._prevX + dx * 0.52;
        const midY = glider._prevY + dy * 0.52;

        glider.classList.add('gliding');
        clearTimeout(glider._gliderTimeout);
        glider._gliderTimeout = setTimeout(() => glider.classList.remove('gliding'), 480);

        glider.animate([
            { transform: `translate3d(${glider._prevX}px, ${glider._prevY}px, 0) scale(1, 1)` },
            { transform: `translate3d(${midX}px, ${midY}px, 0) scale(${stretchX}, ${stretchY})`, offset: 0.45 },
            { transform: `translate3d(${x}px, ${y}px, 0) scale(1.03, 0.98)`, offset: 0.82 },
            { transform: `translate3d(${x}px, ${y}px, 0) scale(1, 1)` }
        ], {
            duration: 480,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)'
        });
    }

    glider._prevX = x;
    glider._prevY = y;
    glider._prevW = w;
}

function updateNavGlider(targetItem, animate = true) {
    moveLiquidGlider({
        container: document.getElementById('p3r-menu-list'),
        gliderId: 'nav-glider-pill',
        gliderClass: 'nav-glider-pill',
        activeSelector: '.p3r-menu-item.active',
        targetItem,
        animate
    });
}

function updateFilterGlider(targetPill, animate = true) {
    moveLiquidGlider({
        container: document.querySelector('.proj-filter-dock'),
        gliderId: 'proj-filter-glider',
        gliderClass: 'proj-filter-glider',
        activeSelector: '.proj-filter-pill.active',
        targetItem: targetPill,
        animate
    });
}

function updateExpFilterGlider(targetPill, animate = true) {
    moveLiquidGlider({
        container: document.querySelector('.exp-filter-dock'),
        gliderId: 'exp-filter-glider',
        gliderClass: 'proj-filter-glider',
        activeSelector: '.exp-filter-pill.active',
        targetItem: targetPill,
        animate
    });
}

function binaryFitFont(el, minPx, maxPx, fitsFn) {
    let lo = Math.round(minPx * 2);
    let hi = Math.round(maxPx * 2);
    let best = lo;
    while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        el.style.fontSize = `${mid / 2}px`;
        if (fitsFn()) {
            best = mid;
            lo = mid + 1;
        } else {
            hi = mid - 1;
        }
    }
    el.style.fontSize = `${best / 2}px`;
}

function fitSpotlightText() {
    const spotlight = document.getElementById('proj-spotlight');
    const titleSlot = spotlight?.querySelector('.proj-meta-slot--title');
    const title = spotlight?.querySelector('.proj-spotlight-title');
    if (titleSlot && title) {
        const maxH = titleSlot.clientHeight;
        const maxW = titleSlot.clientWidth;
        if (maxH > 20 && maxW > 40) {
            title.style.lineHeight = '1.16';
            binaryFitFont(title, 16.5, 28, () => title.scrollHeight <= maxH && title.scrollWidth <= maxW);
        }
    }

    const body = spotlight?.querySelector('.proj-spotlight-body');
    const desc = spotlight?.querySelector('.proj-spotlight-desc');
    const footer = spotlight?.querySelector('.proj-spotlight-footer');
    if (!body || !desc || !footer) return;

    const bodyStyle = getComputedStyle(body);
    const padTop = parseFloat(bodyStyle.paddingTop) || 0;
    const gap = parseFloat(bodyStyle.gap) || 12;
    const availableH = body.clientHeight - padTop - footer.offsetHeight - gap - 6;
    if (availableH <= 40) return;

    desc.style.lineHeight = '1.6';
    binaryFitFont(desc, 13.5, 19.5, () => desc.scrollHeight <= availableH);
}

function switchTab(sectionId) {
    const items = document.querySelectorAll('.p3r-menu-item');
    const sections = document.querySelectorAll('.tablet-viewport > section[id]');
    const viewport = document.getElementById('tablet-viewport');
    const targetSection = document.getElementById(sectionId);
    if (!targetSection) return;

    let activeItem = null;
    items.forEach(item => {
        const isMatch = item.getAttribute('data-section') === sectionId;
        item.classList.toggle('active', isMatch);
        item.setAttribute('tabindex', isMatch ? '0' : '-1');
        if (isMatch) activeItem = item;
    });

    if (activeItem) {
        updateNavGlider(activeItem, true);
    }

    sections.forEach(sec => {
        const isMatch = sec.id === sectionId;
        sec.classList.toggle('active-tab', isMatch);
        if (isMatch) {
            sec.querySelectorAll('.reveal-up, .reveal-left, .reveal-right').forEach(el => {
                el.classList.add('revealed');
            });
        }
    });

    if (viewport) {
        viewport.scrollTo({ top: 0, behavior: 'instant' });
    }

    if (window.history && window.history.replaceState) {
        const nextUrl = sectionId === 'hero' ? (location.pathname + location.search) : `#${sectionId}`;
        if (location.hash !== (sectionId === 'hero' ? '' : `#${sectionId}`)) {
            window.history.replaceState(null, '', nextUrl);
        }
    }

    if (sectionId === 'projects') {
        requestAnimationFrame(() => {
            updateFilterGlider(null, false);
            fitSpotlightText();
        });
    } else if (sectionId === 'experience') {
        requestAnimationFrame(() => updateExpFilterGlider(null, false));
    }

    // Synchronously update liquidGL in the exact same frame so old tab lenses never flash behind new tab
    initLiquidGL(targetSection);
    if (window.__liquidGLRenderer__) {
        window.__liquidGLRenderer__.render();
        if (window.__liquidGLRenderer__.requestRender) {
            window.__liquidGLRenderer__.requestRender(4);
        }
    }
}

/* ============ NAUGHTYDUK/LIQUIDGL INTEGRATION (OPTIMIZED FOR DESKTOP & MOBILE) ============ */
function initLiquidGL(scopeEl) {
    if (typeof window.liquidGL !== 'function') return;
    const isMobile = window.innerWidth <= 768;
    const snapRes = isMobile ? 0.65 : 1.0;

    // 1. Top Navigation Pill Dock (only once)
    const navDock = document.querySelector('.liquidGL-nav:not([data-lgl-bound])');
    if (navDock && navDock.offsetWidth > 0) {
        navDock.setAttribute('data-lgl-bound', 'true');
        window.liquidGL({
            target: '.liquidGL-nav',
            snapshot: 'body',
            resolution: snapRes,
            refraction: 0.016,
            aberration: 0.004,
            bevelDepth: 0.075,
            bevelWidth: 0.14,
            frost: 2,
            shadow: false,
            specular: true,
            tilt: false,
            reveal: 'none'
        });
    }

    // 2. Visible glass cards inside current scope
    const root = scopeEl || document.querySelector('.tablet-viewport > section.active-tab') || document;
    const cards = root.querySelectorAll('.bento-card, .about-text, .project-card, .timeline-content, .contact-strip');
    const unbound = Array.from(cards).filter(el => !el.hasAttribute('data-lgl-bound') && el.offsetWidth > 0 && el.offsetHeight > 0);
    if (unbound.length === 0) return;

    unbound.forEach(el => {
        el.setAttribute('data-lgl-bound', 'true');
        el.classList.add('lgl-pending');
    });

    window.liquidGL({
        target: '.lgl-pending',
        snapshot: 'body',
        resolution: snapRes,
        refraction: 0.012,
        aberration: 0.004,
        bevelDepth: 0.05,
        bevelWidth: 0.06,
        frost: 0,
        shadow: false,
        specular: true,
        tilt: false,
        reveal: 'none'
    });

    unbound.forEach(el => el.classList.remove('lgl-pending'));
}

function initNavbar() {
    const navbar = document.getElementById('navbar');
    const items = document.querySelectorAll('.p3r-menu-item');
    const heroNav = document.querySelector('.p3r-hero-nav');
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const mobileBackdrop = document.getElementById('mobile-menu-backdrop');
    const viewport = document.getElementById('tablet-viewport');
    let focusedIndex = 0;

    // ---- Sound Manager ----
    const sounds = {
        navigate: new Audio('assets/Audio/deck_ui_navigation.wav'),
        select: new Audio('assets/Audio/deck_ui_tab_transition_01.wav'),
        hover: new Audio('assets/Audio/deck_ui_slider_up.wav'),
    };

    sounds.navigate.volume = 0.4;
    sounds.select.volume = 0.5;
    sounds.hover.volume = 0.25;

    function playSound(key) {
        const s = sounds[key];
        if (!s) return;
        s.currentTime = 0;
        s.play().catch(() => {});
    }

    // ---- Focus management ----
    function setFocus(index, shouldSwitch = false) {
        items.forEach(it => it.classList.remove('focused'));
        focusedIndex = index;
        if (index >= 0 && index < items.length) {
            items[index].classList.add('focused');
            items[index].focus({ preventScroll: true });
            playSound('navigate');
            if (shouldSwitch) {
                const section = items[index].getAttribute('data-section');
                switchTab(section);
            }
        }
    }

    // ---- Select item (switch tablet tab or scroll) ----
    function selectItem(index) {
        if (index < 0 || index >= items.length) return;
        focusedIndex = index;
        const section = items[index].getAttribute('data-section');
        playSound('select');

        if (document.getElementById('tablet-shell')) {
            switchTab(section);
        } else {
            const target = document.getElementById(section);
            if (target) target.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // ---- Click on menu item ----
    items.forEach((item, i) => {
        item.addEventListener('click', () => {
            selectItem(i);
            closeMobileMenu();
        });

        // Hover highlight (silent — sound only plays on click/select)
        item.addEventListener('mouseenter', () => {
            focusedIndex = i;
            items.forEach(it => it.classList.remove('focused'));
            item.classList.add('focused');
        });
        item.addEventListener('mouseleave', () => {
            item.classList.remove('focused');
        });
    });

    // ---- Delegate clicks for Bento cards & section anchor links inside tablet ----
    document.addEventListener('click', (e) => {
        const extTrigger = e.target.closest('[data-external-url]');
        if (extTrigger) {
            e.preventDefault();
            playSound('select');
            window.open(extTrigger.getAttribute('data-external-url'), '_blank', 'noopener,noreferrer');
            return;
        }
        const tabTrigger = e.target.closest('[data-tab-target]');
        if (tabTrigger) {
            e.preventDefault();
            const targetId = tabTrigger.getAttribute('data-tab-target');
            const idx = Array.from(items).findIndex(it => it.getAttribute('data-section') === targetId);
            if (idx >= 0) focusedIndex = idx;
            playSound('select');
            switchTab(targetId);
            return;
        }
        const anchor = e.target.closest('a[href^="#"]');
        if (anchor && document.getElementById('tablet-shell')) {
            const targetId = anchor.getAttribute('href').slice(1);
            if (document.getElementById(targetId)) {
                e.preventDefault();
                const idx = Array.from(items).findIndex(it => it.getAttribute('data-section') === targetId);
                if (idx >= 0) focusedIndex = idx;
                playSound('select');
                switchTab(targetId);
            }
        }
    });

    function isMobile() {
        return window.matchMedia('(max-width: 768px)').matches;
    }

    function openMobileMenu() {
        if (!heroNav || !mobileBtn || !mobileBackdrop) return;
        heroNav.classList.add('open');
        mobileBtn.classList.add('active');
        mobileBtn.setAttribute('aria-expanded', 'true');
        mobileBackdrop.classList.add('active');
    }

    function closeMobileMenu() {
        if (!heroNav || !mobileBtn || !mobileBackdrop) return;
        heroNav.classList.remove('open');
        mobileBtn.classList.remove('active');
        mobileBtn.setAttribute('aria-expanded', 'false');
        mobileBackdrop.classList.remove('active');
    }

    if (mobileBtn && mobileBackdrop && heroNav) {
        mobileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!isMobile()) return;
            heroNav.classList.contains('open') ? closeMobileMenu() : openMobileMenu();
        });
        mobileBackdrop.addEventListener('click', closeMobileMenu);
        window.addEventListener('resize', () => {
            if (!isMobile()) closeMobileMenu();
        });
    }

    // ---- Keyboard navigation (supports ArrowLeft/Right & ArrowUp/Down + Enter) ----
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        const phoneFrame = document.getElementById('phone-frame');
        if (phoneFrame && phoneFrame.classList.contains('open')) return;

        switch (e.key) {
            case 'ArrowRight':
            case 'ArrowDown':
                e.preventDefault();
                setFocus(focusedIndex < items.length - 1 ? focusedIndex + 1 : 0, true);
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
                e.preventDefault();
                setFocus(focusedIndex > 0 ? focusedIndex - 1 : items.length - 1, true);
                break;
            case 'Enter':
            case ' ':
                if (document.activeElement && document.activeElement.classList.contains('p3r-menu-item')) {
                    e.preventDefault();
                    selectItem(focusedIndex);
                } else if (e.key === 'Enter' && focusedIndex >= 0) {
                    e.preventDefault();
                    selectItem(focusedIndex);
                }
                break;
        }
    });

    // ---- Scroll: topbar effect ----
    const scrollTarget = viewport || window;
    scrollTarget.addEventListener('scroll', () => {
        const scrollY = viewport ? viewport.scrollTop : window.scrollY;
        if (scrollY > 20) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
    // Initialize glider pill position on load & resize
    requestAnimationFrame(() => updateNavGlider( null, false ));
    window.addEventListener('resize', () => {
        updateNavGlider( null, false );
        updateFilterGlider( null, false );
        updateExpFilterGlider( null, false );
        fitSpotlightText();
    }, { passive: true });
}

function updateActiveSection(menuItems) {
    const sections = document.querySelectorAll('section[id]');
    const items = menuItems || document.querySelectorAll('.p3r-menu-item');
    const scrollY = window.scrollY + 120;

    sections.forEach(section => {
        const top = section.offsetTop;
        const height = section.offsetHeight;
        const id = section.id;

        if (scrollY >= top && scrollY < top + height) {
            items.forEach(item => {
                item.classList.remove('active');
                if (item.getAttribute('data-section') === id) {
                    item.classList.add('active');
                }
            });
        }
    });
}

/* ============ SCROLL REVEAL ============ */
let scrollRevealObserver = null;
function initScrollReveal() {
    const elements = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');

    if (!scrollRevealObserver) {
        scrollRevealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    scrollRevealObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
    }

    elements.forEach(el => {
        if (el.dataset.revealBound) return;
        el.dataset.revealBound = 'true';
        scrollRevealObserver.observe(el);
    });
}

/* ============ SKILLS FROM JSON ============ */
function initContentFromJson() {
    fetch('content.json')
        .then(r => r.json())
        .then(data => {
            applyMenuComments(data.menu);
            requestAnimationFrame(() => updateNavGlider(null, false));
            renderHero(data.hero);
            renderHomeBento(data);
            renderAbout(data.about);
            renderSkills(data.skills);
            renderProjects(data.projects);
            renderExperience(data.experience);
            renderContact(data.contact);

            if (window.lucide) lucide.createIcons();
            initWordRotator();
            initSkillBars();
            initStatCounter();
            initScrollReveal();
            initProjectsCarousel();
            initProjectCardClicks();
            requestAnimationFrame(() => initLiquidGL(document.getElementById('hero')));
        })
        .catch(err => console.error("Error loading content:", err));
}

function renderSectionTitle(num, title) {
    return `
        <h2 class="section-title reveal-up">
            ${title}
        </h2>
    `;
}

function renderHero(hero) {
    const container = document.getElementById('hero-content');
    if (!container || !hero) return;
    const ctas = (hero.cta || []).map(c => `
        <a href="${c.href || '#'}" class="btn ${c.style === 'outline' ? 'btn-outline' : 'btn-primary'}">
            <span>${c.label || ''}</span>
            <i data-lucide="${c.icon || 'arrow-right'}" class="btn-icon"></i>
        </a>
    `).join('');
    const socials = (hero.socials || []).map(s => `
        <a href="${s.href || '#'}" ${s.target ? 'target=\"_blank\" rel=\"noopener noreferrer\"' : ''} class="social-link" aria-label="${s.label || 'Social'}">
            <i data-lucide="${s.icon || 'link'}"></i>
        </a>
    `).join('');

    container.innerHTML = `
        <p class="hero-greeting reveal-up">${hero.greeting || ''}</p>
        <h1 class="hero-name reveal-up">
            <span class="gradient-text">${hero.name || ''}</span>
        </h1>
        <div class="hero-title-wrapper reveal-up">
            <span class="hero-prefix">I'm a&nbsp;</span>
            <span class="word-rotator">
                <span id="rotator-text" class="rotator-text"></span>
            </span>
        </div>
        <p class="hero-description reveal-up">${hero.description || ''}</p>
        <div class="hero-cta reveal-up">${ctas}</div>
        <div class="hero-socials reveal-up">${socials}</div>
    `;

    if (Array.isArray(hero.typedWords)) {
        window.__typedWords = hero.typedWords.slice();
    }
}

function renderHomeBento(data) {
    const grid = document.getElementById('home-bento-grid');
    if (!grid || !data) return;

    const firstProj = (data.projects && data.projects.items && data.projects.items[0]) ? data.projects.items[0] : null;
    const eightBiToolsHome = {
        title: '8BiTools — Client-Side Web Suite',
        thumbnail: 'assets/Project/8bitools.svg',
        tech: ['HTML5', 'WebAssembly', 'Zero-Backend'],
        externalUrl: '8bitools/index.html'
    };
    const projItems = [firstProj, eightBiToolsHome].filter(Boolean);
    const expItems = (data.experience && data.experience.items) ? data.experience.items.slice(0, 2) : [];
    const skillCats = (data.skills && data.skills.categories) ? data.skills.categories : [];
    const totalSkillsCount = skillCats.reduce((acc, c) => acc + ((c.skills && c.skills.length) || 0), 0);
    const pickedSkills = [];
    skillCats.forEach(c => {
        const list = c.skills || [];
        if (list[0]) pickedSkills.push(list[0].shortName || list[0].name);
        if (list[1] && pickedSkills.length < 6) pickedSkills.push(list[1].shortName || list[1].name);
    });
    const topSkills = pickedSkills.filter(Boolean).slice(0, 6);
    const aboutText = (data.about && Array.isArray(data.about.paragraphs) && data.about.paragraphs[0])
        ? data.about.paragraphs[0]
        : '';

    const projCards = projItems.map((p, idx) => {
        const thumb = (p.thumbnail && p.thumbnail !== 'UAS')
            ? `<img src="${p.thumbnail}" alt="${p.title || ''}" class="bento-proj-img">`
            : `<div class="bento-proj-placeholder"><span>UAS</span></div>`;
        const tags = (p.tech || []).slice(0, 3).map(t => `<span class="bento-chip">${t}</span>`).join('');
        const actionAttr = p.externalUrl ? `data-external-url="${p.externalUrl}"` : 'data-tab-target="projects"';
        const arrowIcon = p.externalUrl ? 'arrow-up-right' : 'arrow-right';
        return `
            <article class="bento-card bento-project-card glass-card" ${actionAttr} role="button" tabindex="0">
                <div class="bento-card-head">
                    <span class="bento-card-title">${idx === 0 ? 'Featured Projects' : ''}</span>
                    ${idx === 1 ? `<span class="bento-arrow"><i data-lucide="${arrowIcon}"></i></span>` : ''}
                </div>
                <div class="bento-proj-media">${thumb}</div>
                <div class="bento-proj-meta">
                    <span class="bento-proj-index">${p.externalUrl ? 'Tools Suite' : `Project 0${idx + 1}`}</span>
                    <h3 class="bento-proj-name">${p.title || ''}</h3>
                    <div class="bento-chips">${tags}</div>
                </div>
            </article>
        `;
    }).join('');

    const expRows = expItems.map(e => `
        <div class="bento-exp-row">
            <span class="bento-exp-dot"></span>
            <div class="bento-exp-info">
                <div class="bento-exp-title">${e.title || ''}</div>
                <div class="bento-exp-date">${e.date || ''}</div>
            </div>
        </div>
    `).join('');

    const skillPills = topSkills.map(s => `<span class="bento-chip">${s}</span>`).join('');

    grid.innerHTML = `
        <div class="bento-projects-col">
            ${projCards}
        </div>
        <div class="bento-right-col">
            <article class="bento-card bento-exp-card glass-card" data-tab-target="experience" role="button" tabindex="0">
                <div class="bento-card-head">
                    <span class="bento-card-title">Experience</span>
                    <span class="bento-arrow"><i data-lucide="arrow-right"></i></span>
                </div>
                <div class="bento-exp-list">${expRows}</div>
            </article>
            <div class="bento-bottom-row">
                <article class="bento-card bento-skills-card glass-card" data-tab-target="skills" role="button" tabindex="0">
                    <div class="bento-card-head">
                        <span class="bento-card-title">Skills</span>
                        <span class="bento-arrow"><i data-lucide="arrow-right"></i></span>
                    </div>
                    <div class="bento-card-sub">${totalSkillsCount} Skills &bull; ${skillCats.length} Branches</div>
                    <div class="bento-chips">${skillPills}</div>
                </article>
                <article class="bento-card bento-about-card glass-card" data-tab-target="about" role="button" tabindex="0">
                    <div class="bento-card-head">
                        <span class="bento-card-title">Who’s Sapta?</span>
                        <span class="bento-arrow"><i data-lucide="arrow-right"></i></span>
                    </div>
                    <div class="bento-about-body">
                        <span class="bento-about-badge">Undiksha &bull; 3.90 GPA</span>
                        <p class="bento-about-snippet">${aboutText}</p>
                    </div>
                </article>
            </div>
        </div>
    `;
}

function applyMenuComments(menu) {
    if (!Array.isArray(menu)) return;
    const items = document.querySelectorAll('.p3r-menu-item');
    menu.forEach(m => {
        const match = Array.from(items).find(it => it.getAttribute('data-section') === m.section);
        if (!match) return;
        const textEl = match.querySelector('.p3r-item-text');
        if (textEl && m.label) textEl.textContent = m.label;
        if (m.comment) {
            match.setAttribute('data-comment', m.comment);
            match.setAttribute('title', m.comment);
        }
    });
}

function renderAbout(about) {
    const container = document.querySelector('#about .container');
    if (!container || !about) return;

    const chapters = Array.isArray(about.chapters) && about.chapters.length
        ? about.chapters
        : (about.paragraphs || []).map((p, i) => ({
            index: String(i + 1).padStart(2, '0'),
            label: `Chapter ${i + 1}`,
            headline: about.title || 'About Me',
            summary: p,
            detail: '',
            highlights: []
        }));

    const snapshot = Array.isArray(about.snapshot) ? about.snapshot : [];
    const milestones = Array.isArray(about.milestones) ? about.milestones : [];

    const chapterTabsHtml = chapters.map((ch, i) => `
        <button type="button"
                class="about-chapter-btn ${i === 0 ? 'active' : ''}"
                data-chapter-index="${i}"
                role="tab"
                aria-selected="${i === 0 ? 'true' : 'false'}">
            <span class="about-chapter-num">${ch.index || String(i + 1).padStart(2, '0')}</span>
            <span class="about-chapter-sep">/</span>
            <span class="about-chapter-label">${ch.label}</span>
        </button>
    `).join('');

    const snapshotHtml = snapshot.length ? `
        <div class="about-snapshot">
            <div class="about-snapshot-title">Quick Snapshot</div>
            <div class="about-snapshot-pills">
                ${snapshot.map(item => `<span class="about-snapshot-pill">${item}</span>`).join('')}
            </div>
        </div>
    ` : '';

    const milestonesHtml = milestones.length ? `
        <div class="about-milestone-rail" aria-label="Career journey milestones">
            ${milestones.map((m, idx) => `
                <div class="about-milestone-step">
                    <div class="about-milestone-node">
                        <span class="about-milestone-stage">${m.stage}</span>
                        <span class="about-milestone-title">${m.title}</span>
                    </div>
                    ${idx < milestones.length - 1 ? '<span class="about-milestone-connector" aria-hidden="true"></span>' : ''}
                </div>
            `).join('')}
        </div>
    ` : '';

    const buildStageBody = (ch) => {
        const bodyParas = Array.isArray(ch.paragraphs) && ch.paragraphs.length
            ? ch.paragraphs.map((p, idx) => `<p class="${idx === 0 ? 'about-stage-lead' : 'about-stage-detail'}">${p}</p>`).join('')
            : `
                <p class="about-stage-lead">${ch.summary || ''}</p>
                ${ch.detail ? `<p class="about-stage-detail">${ch.detail}</p>` : ''}
            `;
        return `
            <div class="about-stage-eyebrow">Chapter ${ch.index || '01'} &bull; ${ch.label || ''}</div>
            <h3 class="about-stage-headline">${ch.headline || ''}</h3>
            ${bodyParas}
        `;
    };

    container.innerHTML = `
        ${renderSectionTitle(about.number || '01', about.title || 'About Me')}
        <div class="about-deck glass-card reveal-up">
            <aside class="about-deck-sidebar">
                <div class="about-chapter-list" role="tablist" aria-label="About chapters">
                    ${chapterTabsHtml}
                </div>
                ${snapshotHtml}
            </aside>
            <div class="about-deck-stage">
                <div class="about-stage-body" role="tabpanel">
                    ${buildStageBody(chapters[0])}
                </div>
                ${milestonesHtml}
            </div>
        </div>
    `;

    const tabButtons = Array.from(container.querySelectorAll('.about-chapter-btn'));
    const stageBody = container.querySelector('.about-stage-body');
    if (!tabButtons.length || !stageBody) return;

    const selectChapter = (idx) => {
        const chapter = chapters[idx];
        if (!chapter) return;

        tabButtons.forEach((btn, i) => {
            const isActive = i === idx;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        stageBody.classList.remove('is-switching');
        void stageBody.offsetWidth;
        stageBody.innerHTML = buildStageBody(chapter);
        stageBody.classList.add('is-switching');
    };

    tabButtons.forEach((btn, idx) => {
        btn.addEventListener('click', () => selectChapter(idx));
        btn.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                e.preventDefault();
                const next = (idx + 1) % tabButtons.length;
                selectChapter(next);
                tabButtons[next].focus();
            } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                e.preventDefault();
                const prev = (idx - 1 + tabButtons.length) % tabButtons.length;
                selectChapter(prev);
                tabButtons[prev].focus();
            }
        });
    });
}

function renderSkills(skills) {
    const container = document.querySelector('#skills .container');
    if (!container || !skills) return;

    const categories = Array.isArray(skills.categories) ? skills.categories : [];
    const coreData = skills.core || {
        name: 'Core Logic',
        branch: 'Developer Foundation',
        tier: 'CORE HUB',
        level: 95,
        desc: 'Understanding core logic and system flow across every stack.',
        projects: ['System Architecture', 'AI Workflow']
    };

    const getRingPositions = (count) => {
        if (count <= 5) {
            return [
                { x: 24, y: 26, from: ['core'] },
                { x: 76, y: 26, from: ['core'] },
                { x: 18, y: 68, from: ['core', 0] },
                { x: 50, y: 82, from: ['core'] },
                { x: 82, y: 68, from: ['core', 1] }
            ].slice(0, count);
        }
        if (count === 6) {
            return [
                { x: 24, y: 24, from: ['core'] },
                { x: 50, y: 16, from: ['core'] },
                { x: 76, y: 24, from: ['core'] },
                { x: 22, y: 74, from: ['core', 0] },
                { x: 50, y: 84, from: ['core'] },
                { x: 78, y: 74, from: ['core', 2] }
            ];
        }
        if (count === 7) {
            return [
                { x: 20, y: 24, from: ['core'] },
                { x: 50, y: 15, from: ['core'] },
                { x: 80, y: 24, from: ['core'] },
                { x: 16, y: 60, from: ['core', 0] },
                { x: 36, y: 84, from: ['core', 3] },
                { x: 64, y: 84, from: ['core', 6] },
                { x: 84, y: 60, from: ['core', 2] }
            ];
        }
        return [
            { x: 18, y: 20, from: ['core'] },
            { x: 50, y: 15, from: ['core'] },
            { x: 82, y: 20, from: ['core'] },
            { x: 14, y: 51, from: ['core', 0] },
            { x: 86, y: 51, from: ['core', 2] },
            { x: 19, y: 80, from: ['core', 3] },
            { x: 40, y: 86, from: ['core'] },
            { x: 60, y: 86, from: ['core'] },
            { x: 81, y: 80, from: ['core', 4] }
        ].slice(0, count);
    };

    const allNodes = [];
    categories.forEach((cat, bIdx) => {
        (cat.skills || []).forEach((sk, sIdx) => {
            allNodes.push({
                id: `b${bIdx}-s${sIdx}`,
                branchIdx: bIdx,
                branchTitle: cat.title || `Branch ${bIdx + 1}`,
                name: sk.name || '',
                shortName: sk.shortName || sk.name || '',
                icon: sk.icon || 'sparkles',
                level: sk.level || 75,
                tier: sk.tier || 'Tier I',
                desc: sk.desc || `Applied ${sk.name} across production projects and workflows.`,
                projects: Array.isArray(sk.projects) ? sk.projects : []
            });
        });
    });

    const filterPillsHtml = [
        `<button type="button" class="skill-branch-pill active" data-view="overview">Overview (${categories.length})</button>`,
        ...categories.map((cat, idx) =>
            `<button type="button" class="skill-branch-pill" data-view="${idx}">${cat.shortTitle || cat.title}</button>`
        )
    ].join('');

    const renderInspectorContent = (node) => {
        const tags = (node.projects || []).map(p => `<span class="tech-tag">${p}</span>`).join('');
        return `
            <div class="skill-inspector-top">
                <span class="skill-inspector-eyebrow">Node Inspector</span>
                <span class="skill-inspector-tier">${node.tier || 'Tier I'}</span>
            </div>
            <div class="skill-inspector-hero">
                <div class="skill-inspector-orb">
                    <i data-lucide="${node.icon || 'sparkles'}"></i>
                </div>
                <div>
                    <h3 class="skill-inspector-name">${node.name}</h3>
                    <div class="skill-inspector-branch">${node.branchTitle}</div>
                </div>
            </div>
            <div class="skill-mastery-block">
                <div class="skill-mastery-meta">
                    <span>Mastery</span>
                    <strong>${node.level}%</strong>
                </div>
                <div class="skill-mastery-track">
                    <div class="skill-mastery-fill" style="width: ${node.level}%"></div>
                </div>
            </div>
            <p class="skill-inspector-desc">${node.desc}</p>
            ${tags ? `
                <div class="skill-inspector-synergy">
                    <div class="skill-synergy-label">Applied In &amp; Synergy</div>
                    <div class="skill-synergy-tags">${tags}</div>
                </div>
            ` : ''}
        `;
    };

    const defaultNode = allNodes[0] || {
        id: 'core',
        branchIdx: -1,
        branchTitle: coreData.branch,
        name: coreData.name,
        icon: 'cpu',
        level: coreData.level,
        tier: coreData.tier,
        desc: coreData.desc,
        projects: coreData.projects
    };

    container.innerHTML = `
        ${renderSectionTitle(skills.number || '02', skills.title || 'Skills & Tech Stack')}
        <div class="skills-tree-shell reveal-up" id="skills-grid">
            <div class="skills-constellation glass-card">
                <div class="skills-constellation-bar">
                    <div class="skills-branch-filters" role="tablist" aria-label="Skill branches">
                        ${filterPillsHtml}
                    </div>
                    <div class="skills-unlocked-badge">${allNodes.length} / ${allNodes.length} Nodes Unlocked</div>
                </div>
                <div class="skills-graph-canvas" id="skills-graph-canvas"></div>
            </div>

            <aside class="skills-inspector glass-card" aria-live="polite">
                <div class="skills-inspector-body">
                    ${renderInspectorContent(defaultNode)}
                </div>
                <div class="skills-inspector-footer">
                    <span class="skills-node-counter" id="skills-node-counter"></span>
                    <div class="skills-inspector-nav">
                        <button type="button" class="exp-nav-btn" id="skills-prev-btn" aria-label="Previous skill node">
                            <i data-lucide="chevron-left"></i>
                        </button>
                        <button type="button" class="exp-nav-btn" id="skills-next-btn" aria-label="Next skill node">
                            <i data-lucide="chevron-right"></i>
                        </button>
                    </div>
                </div>
            </aside>
        </div>
    `;

    const canvas = container.querySelector('#skills-graph-canvas');
    const inspectorBody = container.querySelector('.skills-inspector-body');
    const counterEl = container.querySelector('#skills-node-counter');
    const filterBtns = Array.from(container.querySelectorAll('.skill-branch-pill'));
    const prevBtn = container.querySelector('#skills-prev-btn');
    const nextBtn = container.querySelector('#skills-next-btn');

    let currentView = 'overview';
    let currentNodeId = 'core';

    const updateInspector = (nodeData, counterText) => {
        if (inspectorBody) inspectorBody.innerHTML = renderInspectorContent(nodeData);
        if (counterEl) counterEl.textContent = counterText;
        if (window.lucide) lucide.createIcons();
    };

    const buildCurvedEdge = (x1, y1, x2, y2) => {
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const cx = mx - dy * 0.1;
        const cy = my + dx * 0.1;
        return `M ${x1} ${y1} Q ${cx.toFixed(2)} ${cy.toFixed(2)} ${x2} ${y2}`;
    };

    const renderGraphView = (view) => {
        currentView = view;
        filterBtns.forEach(b => b.classList.toggle('active', b.dataset.view === String(view)));
        if (!canvas) return;

        if (view === 'overview') {
            const branchPositions = [
                { x: 50, y: 17 },
                { x: 81, y: 39 },
                { x: 70, y: 79 },
                { x: 30, y: 79 },
                { x: 19, y: 39 }
            ];

            const paths = categories.slice(0, 5).map((cat, idx) => {
                const pos = branchPositions[idx];
                const d = buildCurvedEdge(50, 50, pos.x, pos.y);
                return `<path class="skill-edge lit" d="${d}" />`;
            }).join('');

            const branchOrbs = categories.slice(0, 5).map((cat, idx) => {
                const pos = branchPositions[idx];
                const count = (cat.skills || []).length;
                return `
                    <button type="button"
                            class="skill-node skill-branch-hub"
                            data-open-branch="${idx}"
                            style="left:${pos.x}%; top:${pos.y}%;">
                        <span class="skill-node-orb">
                            <i data-lucide="${cat.icon || 'sparkles'}"></i>
                        </span>
                        <span class="skill-node-name">${cat.title} (${count})</span>
                    </button>
                `;
            }).join('');

            canvas.innerHTML = `
                <svg class="skill-constellation-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${paths}</svg>
                <button type="button"
                        class="skill-core-node ${currentNodeId === 'core' ? 'active' : ''}"
                        data-node-id="core"
                        style="left:50%; top:50%;"
                        aria-label="Core Logic Hub">
                    <span class="skill-core-ring"></span>
                    <span class="skill-core-label">CORE<br>LOGIC</span>
                </button>
                ${branchOrbs}
            `;

            canvas.querySelectorAll('[data-open-branch]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const bIdx = Number(btn.dataset.openBranch);
                    const firstSkill = allNodes.find(n => n.branchIdx === bIdx);
                    if (firstSkill) currentNodeId = firstSkill.id;
                    renderGraphView(bIdx);
                });
            });

            const coreBtn = canvas.querySelector('.skill-core-node');
            if (coreBtn) {
                coreBtn.addEventListener('click', () => {
                    currentNodeId = 'core';
                    coreBtn.classList.add('active');
                    updateInspector({ ...coreData, branchTitle: coreData.branch, icon: 'cpu' }, `CORE • ${allNodes.length} NODES`);
                });
            }

            if (currentNodeId === 'core') {
                updateInspector({ ...coreData, branchTitle: coreData.branch, icon: 'cpu' }, `CORE • ${allNodes.length} NODES`);
            }
            if (window.lucide) lucide.createIcons();
            return;
        }

        const bIdx = Number(view);
        const cat = categories[bIdx];
        if (!cat) return;
        const branchNodes = allNodes.filter(n => n.branchIdx === bIdx);
        const positions = getRingPositions(branchNodes.length);

        const edges = [];
        branchNodes.forEach((node, idx) => {
            const pos = positions[idx];
            if (!pos) return;
            (pos.from || ['core']).forEach(src => {
                const srcPos = src === 'core' ? { x: 50, y: 50 } : positions[src];
                if (!srcPos) return;
                edges.push({
                    sourceId: src === 'core' ? 'core' : branchNodes[src].id,
                    targetId: node.id,
                    d: buildCurvedEdge(srcPos.x, srcPos.y, pos.x, pos.y)
                });
            });
        });

        if (!branchNodes.some(n => n.id === currentNodeId)) {
            currentNodeId = branchNodes[0]?.id || 'core';
        }

        canvas.innerHTML = `
            <svg class="skill-constellation-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                ${edges.map(e => `<path class="skill-edge" data-source="${e.sourceId}" data-target="${e.targetId}" d="${e.d}" />`).join('')}
            </svg>
            <button type="button"
                    class="skill-core-node skill-core-branch"
                    data-back-overview="true"
                    style="left:50%; top:50%;"
                    title="Back to Overview"
                    aria-label="${cat.title} Core">
                <span class="skill-core-ring"></span>
                <span class="skill-core-label">${cat.shortTitle || cat.title}</span>
            </button>
            ${branchNodes.map((n, idx) => {
                const pos = positions[idx];
                return `
                    <button type="button"
                            class="skill-node ${n.id === currentNodeId ? 'active' : ''}"
                            data-node-id="${n.id}"
                            style="left:${pos.x}%; top:${pos.y}%;"
                            aria-label="${n.name} (${n.level}%)">
                        <span class="skill-node-orb">
                            <i data-lucide="${n.icon}"></i>
                        </span>
                        <span class="skill-node-name">${n.shortName}</span>
                    </button>
                `;
            }).join('')}
        `;

        const selectBranchNode = (nodeId) => {
            currentNodeId = nodeId;
            const nodeData = allNodes.find(n => n.id === nodeId);
            if (!nodeData) return;

            canvas.querySelectorAll('.skill-node').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.nodeId === nodeId);
            });
            canvas.querySelectorAll('.skill-edge').forEach(edge => {
                const lit = edge.dataset.target === nodeId || edge.dataset.source === nodeId;
                edge.classList.toggle('lit', lit);
            });

            const globalIdx = allNodes.findIndex(n => n.id === nodeId);
            updateInspector(nodeData, `${String(globalIdx + 1).padStart(2, '0')} / ${String(allNodes.length).padStart(2, '0')}`);
        };

        canvas.querySelectorAll('.skill-node[data-node-id]').forEach(btn => {
            btn.addEventListener('click', () => selectBranchNode(btn.dataset.nodeId));
        });

        const branchCoreBtn = canvas.querySelector('[data-back-overview]');
        if (branchCoreBtn) {
            branchCoreBtn.addEventListener('click', () => {
                currentNodeId = 'core';
                renderGraphView('overview');
            });
        }

        selectBranchNode(currentNodeId);
    };

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            if (view === 'overview') {
                currentNodeId = 'core';
                renderGraphView('overview');
            } else {
                const bIdx = Number(view);
                const firstSkill = allNodes.find(n => n.branchIdx === bIdx);
                if (firstSkill) currentNodeId = firstSkill.id;
                renderGraphView(bIdx);
            }
        });
    });

    const stepNode = (delta) => {
        if (!allNodes.length) return;
        const idx = allNodes.findIndex(n => n.id === currentNodeId);
        const nextIdx = idx < 0 ? 0 : (idx + delta + allNodes.length) % allNodes.length;
        const target = allNodes[nextIdx];
        currentNodeId = target.id;
        renderGraphView(target.branchIdx);
    };

    if (prevBtn) prevBtn.addEventListener('click', () => stepNode(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => stepNode(1));

    renderGraphView('overview');
}

function getProjectBucket(category = '') {
    if (/mobile|iot|uas/i.test(category)) return 'Mobile & IoT';
    if (/game|animation|education|media/i.test(category)) return 'Games & Media';
    return 'Web & AI';
}

function renderProjects(projects) {
    const container = document.querySelector('#projects .container');
    if (!container || !projects) return;

    const allItems = projects.items || [];
    window.__projectsData = allItems;
    window.__projectFilter = 'All';
    window.__activeProjectIdx = 0;

    const filters = ['All', 'Web & AI', 'Mobile & IoT', 'Games & Media'];
    const filterPills = filters.map(f => `
        <button class="proj-filter-pill ${f === 'All' ? 'active' : ''}" data-proj-filter="${f}" type="button">${f}</button>
    `).join('');

    container.innerHTML = `
        <div class="proj-header-bar">
            ${renderSectionTitle(projects.number || '03', projects.title || 'Featured Projects')}
            <div class="proj-filter-dock" role="tablist" aria-label="Filter projects">
                ${filterPills}
            </div>
        </div>
        <div class="proj-hybrid-stage">
            <div class="proj-spotlight-card glass-card" id="proj-spotlight"></div>
            <div class="proj-bento-selector" id="proj-bento-selector"></div>
        </div>
    `;

    updateProjectsView();
}

function getFilteredProjects() {
    const items = window.__projectsData || [];
    const filter = window.__projectFilter || 'All';
    if (filter === 'All') return items;
    return items.filter(p => getProjectBucket(p.category) === filter);
}

function updateProjectsView() {
    const spotlight = document.getElementById('proj-spotlight');
    const selector = document.getElementById('proj-bento-selector');
    if (!spotlight || !selector) return;

    const filtered = getFilteredProjects();
    if (filtered.length === 0) return;

    if (window.__activeProjectIdx >= filtered.length) {
        window.__activeProjectIdx = 0;
    }
    const activeIdx = window.__activeProjectIdx;
    const p = filtered[activeIdx];

    const pickIcon = (url) => {
        if (!url) return 'external-link';
        if (/github\.com/i.test(url)) return 'github';
        if (/youtu\.be|youtube\.com/i.test(url)) return 'youtube';
        if (/journal\.|article|submission|researchgate\.net/i.test(url)) return 'file-text';
        return 'external-link';
    };

    const mediaTag = (p.thumbnail && p.thumbnail !== 'UAS')
        ? `<img src="${p.thumbnail}" alt="${p.title || ''}" class="proj-spotlight-img" decoding="async">`
        : `<div class="project-placeholder uas-placeholder"><span class="uas-placeholder-text">UAS</span></div>`;

    const tech = (p.tech || []).map(t => `<span class="tech-tag">${t}</span>`).join('');
    const codeBtn = p.codeUrl ? `
        <a href="${p.codeUrl}" class="btn btn-outline proj-action-btn" target="_blank" rel="noopener noreferrer">
            <i data-lucide="${pickIcon(p.codeUrl)}"></i>
            <span>${p.codeLabel || 'View Code'}</span>
        </a>` : '';
    const liveBtn = p.liveDisabled ? `
        <div class="proj-disabled-wrap">
            <span class="btn proj-action-btn proj-action-btn--disabled" tabindex="0" aria-disabled="true">
                <i data-lucide="power-off"></i>
                <span>Live Demo</span>
            </span>
            <div class="proj-disabled-popover" role="tooltip">
                <p class="proj-disabled-reason">${p.liveDisabledReason || 'Live demo currently unavailable.'}</p>
                ${p.liveFallbackUrl ? `
                    <a href="${p.liveFallbackUrl}" target="_blank" rel="noopener noreferrer" class="proj-tooltip-link">
                        <i data-lucide="github"></i>
                        <span>${p.liveFallbackLabel || 'Lihat di GitHub'}</span>
                        <i data-lucide="arrow-up-right"></i>
                    </a>
                ` : ''}
            </div>
        </div>` : (p.liveUrl ? `
        <a href="${p.liveUrl}" class="btn btn-primary proj-action-btn" target="_blank" rel="noopener noreferrer">
            <i data-lucide="${pickIcon(p.liveUrl)}"></i>
            <span>Live Demo</span>
        </a>` : '');

    const numStr = String(activeIdx + 1).padStart(2, '0');
    const totalStr = String(filtered.length).padStart(2, '0');

    spotlight.innerHTML = `
        <div class="proj-spotlight-hero">
            <div class="proj-spotlight-media">${mediaTag}</div>
            <div class="proj-spotlight-meta">
                <div class="proj-meta-slot proj-meta-slot--type">
                    <div class="proj-spotlight-top">
                        <span class="project-category">${p.category || 'Project'}</span>
                        <div class="proj-nav-controls">
                            <span class="proj-counter">${numStr} / ${totalStr}</span>
                            <button class="proj-step-btn" id="proj-prev" type="button" aria-label="Previous Project">
                                <i data-lucide="chevron-left"></i>
                            </button>
                            <button class="proj-step-btn" id="proj-next" type="button" aria-label="Next Project">
                                <i data-lucide="chevron-right"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="proj-meta-slot proj-meta-slot--title">
                    <h3 class="proj-spotlight-title">${p.title || ''}</h3>
                </div>
                <div class="proj-meta-slot proj-meta-slot--stack">
                    <div class="project-tech">${tech}</div>
                </div>
            </div>
        </div>
        <div class="proj-spotlight-body">
            <p class="proj-spotlight-desc">${p.desc || ''}</p>
            <div class="proj-spotlight-footer">
                <div class="proj-spotlight-actions">${codeBtn}${liveBtn}</div>
            </div>
        </div>
    `;

    const currentFilter = window.__projectFilter || 'All';
    if (selector.dataset.renderedFilter !== currentFilter) {
        selector.dataset.renderedFilter = currentFilter;
        selector.innerHTML = filtered.map((item, idx) => {
            const thumb = (item.thumbnail && item.thumbnail !== 'UAS')
                ? `<img src="${item.thumbnail}" alt="${item.title || ''}" class="proj-bento-thumb" loading="lazy" decoding="async">`
                : `<div class="proj-bento-uas">UAS</div>`;
            const isFirstWide = idx === 0 && filtered.length > 2 ? 'featured-wide' : '';
            const isActive = idx === activeIdx ? 'active' : '';
            const miniTech = (item.tech || []).slice(0, 2).map(t => `<span class="bento-chip">${t}</span>`).join('');
            return `
                <button type="button" class="proj-bento-item glass-card ${isFirstWide} ${isActive}" data-proj-idx="${idx}">
                    <div class="proj-bento-media">${thumb}</div>
                    <div class="proj-bento-info">
                        <span class="proj-bento-cat">${item.category || ''}</span>
                        <span class="proj-bento-title">${item.title || ''}</span>
                        <div class="bento-chips">${miniTech}</div>
                    </div>
                </button>
            `;
        }).join('');
    } else {
        const prevActive = selector.querySelector('.proj-bento-item.active');
        if (prevActive) prevActive.classList.remove('active');
        const nextActive = selector.querySelector(`.proj-bento-item[data-proj-idx="${activeIdx}"]`);
        if (nextActive) nextActive.classList.add('active');
    }

    if (window.lucide) lucide.createIcons();
    requestAnimationFrame(fitSpotlightText);

    const prevBtn = document.getElementById('proj-prev');
    const nextBtn = document.getElementById('proj-next');
    if (prevBtn) prevBtn.addEventListener('click', () => {
        window.__activeProjectIdx = (activeIdx - 1 + filtered.length) % filtered.length;
        updateProjectsView();
    });
    if (nextBtn) nextBtn.addEventListener('click', () => {
        window.__activeProjectIdx = (activeIdx + 1) % filtered.length;
        updateProjectsView();
    });

    if (!selector.dataset.clickBound) {
        selector.dataset.clickBound = 'true';
        selector.addEventListener('click', (e) => {
            const btn = e.target.closest('.proj-bento-item');
            if (!btn) return;
            window.__activeProjectIdx = parseInt(btn.getAttribute('data-proj-idx'), 10) || 0;
            updateProjectsView();
        });
    }

    document.querySelectorAll('.proj-filter-pill').forEach(pill => {
        pill.onclick = () => {
            window.__projectFilter = pill.getAttribute('data-proj-filter');
            window.__activeProjectIdx = 0;
            document.querySelectorAll('.proj-filter-pill').forEach(x => x.classList.toggle('active', x === pill));
            updateFilterGlider(pill, true);
            updateProjectsView();
        };
    });
    const existingGlider = document.getElementById('proj-filter-glider');
    if (!existingGlider || typeof existingGlider._prevX !== 'number') {
        requestAnimationFrame(() => updateFilterGlider(null, false));
    }
}

function renderExperience(exp) {
    const container = document.querySelector('#experience .container');
    if (!container || !exp) return;

    const allItems = exp.items || [];
    window.__expData = allItems;
    window.__expCategory = 'All';
    window.__expYear = 'All';

    const cats = ['All', 'Tech & AI', 'Teaching', 'Awards'];
    const catPills = cats.map(c => `
        <button class="exp-filter-pill proj-filter-pill ${c === 'All' ? 'active' : ''}" data-exp-cat="${c}" type="button">${c}</button>
    `).join('');

    const years = ['2019', '2020', '2022', '2024', '2025', '2026'];
    const yearNodes = [
        `<button class="exp-year-node active" data-exp-year="All" type="button"><span class="exp-year-dot"></span><span class="exp-year-label">All</span></button>`,
        ...years.map(y => `<button class="exp-year-node" data-exp-year="${y}" type="button"><span class="exp-year-dot"></span><span class="exp-year-label">${y}</span></button>`)
    ].join('');

    container.innerHTML = `
        <div class="exp-header-bar">
            ${renderSectionTitle(exp.number || '04', exp.title || 'Experience')}
            <div class="exp-filter-dock proj-filter-dock" role="tablist" aria-label="Filter experience">
                ${catPills}
            </div>
        </div>
        <div class="exp-year-stepper" role="tablist" aria-label="Filter by year">
            <div class="exp-stepper-line" aria-hidden="true"></div>
            ${yearNodes}
        </div>
        <div class="exp-bento-grid" id="exp-bento-grid"></div>
    `;

    updateExperienceView();

    container.querySelectorAll('.exp-filter-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            window.__expCategory = pill.getAttribute('data-exp-cat');
            container.querySelectorAll('.exp-filter-pill').forEach(x => x.classList.toggle('active', x === pill));
            updateExpFilterGlider(pill, true);
            updateExperienceView();
        });
    });

    container.querySelectorAll('.exp-year-node').forEach(node => {
        node.addEventListener('click', () => {
            const yr = node.getAttribute('data-exp-year');
            window.__expYear = (window.__expYear === yr && yr !== 'All') ? 'All' : yr;
            container.querySelectorAll('.exp-year-node').forEach(x => {
                x.classList.toggle('active', x.getAttribute('data-exp-year') === window.__expYear);
            });
            updateExperienceView();
        });
    });

    requestAnimationFrame(() => updateExpFilterGlider(null, false));
}

function updateExperienceView() {
    const grid = document.getElementById('exp-bento-grid');
    if (!grid) return;
    const allItems = window.__expData || [];
    const cat = window.__expCategory || 'All';
    const yr = window.__expYear || 'All';

    const filtered = allItems.filter(item => {
        const matchCat = cat === 'All' || item.category === cat;
        const matchYr = yr === 'All' || item.year === yr || (item.date && item.date.includes(yr));
        return matchCat && matchYr;
    });
    window.__expFiltered = filtered;

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="exp-bento-card glass-card exp-empty">No experience entries match this filter.</div>`;
        return;
    }

    grid.innerHTML = filtered.map((e, idx) => {
        const isWide = idx === 0 && filtered.length >= 2 ? 'featured-wide' : '';
        const tags = (e.tags || []).slice(0, isWide ? 4 : 3).map(t => `<span class="bento-chip">${t}</span>`).join('');
        return `
            <button type="button" class="exp-bento-card glass-card ${isWide}" data-exp-idx="${idx}">
                <div class="exp-card-top">
                    <span class="exp-cat-text">${e.category || ''}</span>
                    <span class="timeline-date">${e.date || ''}</span>
                </div>
                <div class="exp-card-headings">
                    <h3 class="exp-card-title">${e.title || ''}</h3>
                    <span class="exp-card-org">${e.org || ''}</span>
                </div>
                <p class="exp-card-desc">${e.desc || ''}</p>
                ${tags ? `<div class="bento-chips exp-card-tags">${tags}</div>` : ''}
            </button>
        `;
    }).join('');

    if (window.lucide) lucide.createIcons();

    if (!grid.dataset.modalBound) {
        grid.dataset.modalBound = 'true';
        grid.addEventListener('click', (ev) => {
            const card = ev.target.closest('.exp-bento-card[data-exp-idx]');
            if (!card) return;
            const idx = parseInt(card.getAttribute('data-exp-idx'), 10) || 0;
            openExpModal(idx);
        });
    }
}

function openExpModal(idx) {
    const items = window.__expFiltered || window.__expData || [];
    if (!items.length) return;
    const safeIdx = ((idx % items.length) + items.length) % items.length;
    const e = items[safeIdx];

    let overlay = document.getElementById('exp-detail-modal');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'exp-detail-modal';
        overlay.className = 'exp-modal-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        document.body.appendChild(overlay);

        overlay.addEventListener('click', (ev) => {
            if (ev.target === overlay) closeExpModal();
        });
        document.addEventListener('keydown', (ev) => {
            if (ev.key === 'Escape' && overlay.classList.contains('open')) {
                closeExpModal();
            }
        });
    }

    const achList = (e.achievements || []).map(a => `<li>${a}</li>`).join('');
    const tags = (e.tags || []).map(t => `<span class="tech-tag">${t}</span>`).join('');

    overlay.innerHTML = `
        <div class="exp-modal-card glass-card">
            <div class="exp-modal-header">
                <div class="exp-modal-id">
                    <div class="exp-modal-badges">
                        <span class="exp-cat-text">${e.category || 'Experience'}</span>
                        <span class="exp-modal-sep">·</span>
                        <span class="timeline-date">${e.date || ''}</span>
                    </div>
                    <h3 class="exp-modal-title">${e.title || ''}</h3>
                    <span class="exp-modal-org">${e.org || ''}</span>
                </div>
                <button type="button" class="exp-modal-close" aria-label="Close modal">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
            </div>
            <p class="exp-modal-desc">${e.fullDesc || e.desc || ''}</p>
            ${achList ? `
                <div class="exp-modal-section">
                    <span class="exp-modal-label">Highlights &amp; Impact</span>
                    <ul class="exp-modal-achievements">${achList}</ul>
                </div>
            ` : ''}
            <div class="exp-modal-footer">
                <div class="project-tech">${tags}</div>
                <div class="exp-modal-nav">
                    <button type="button" class="proj-step-btn" id="exp-modal-prev" aria-label="Previous Experience">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                    </button>
                    <span class="proj-counter">${String(safeIdx + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')}</span>
                    <button type="button" class="proj-step-btn" id="exp-modal-next" aria-label="Next Experience">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    </button>
                </div>
            </div>
        </div>
    `;

    overlay.querySelector('.exp-modal-close')?.addEventListener('click', closeExpModal);
    overlay.querySelector('#exp-modal-prev')?.addEventListener('click', () => openExpModal(safeIdx - 1));
    overlay.querySelector('#exp-modal-next')?.addEventListener('click', () => openExpModal(safeIdx + 1));

    overlay.classList.add('open');
}

function closeExpModal() {
    const overlay = document.getElementById('exp-detail-modal');
    if (overlay) overlay.classList.remove('open');
}

function renderContact(contact) {
    const container = document.querySelector('#contact .container');
    if (!container || !contact) return;

    const links = (contact.links || []).map(l => {
        const isEmail = /mailto:/i.test(l.href || '');
        const copyBtn = isEmail
            ? `<button type="button" class="contact-copy-btn" data-copy-email="${l.value || ''}" aria-label="Copy email address" title="Copy email">
                   <i data-lucide="copy"></i>
               </button>`
            : '';
        return `
            <div class="contact-channel-row">
                <a href="${l.href || '#'}" ${l.target ? 'target="_blank" rel="noopener noreferrer"' : ''} class="contact-channel-card">
                    <span class="contact-channel-icon"><i data-lucide="${l.icon || 'link'}"></i></span>
                    <span class="contact-channel-meta">
                        <span class="contact-channel-label">${l.label || ''}</span>
                        <span class="contact-channel-value">${l.value || ''}</span>
                    </span>
                    <span class="contact-channel-arrow"><i data-lucide="arrow-up-right"></i></span>
                </a>
                ${copyBtn}
            </div>
        `;
    }).join('');

    container.innerHTML = `
        ${renderSectionTitle(contact.number || '05', contact.title || 'Get In Touch')}
        <div class="contact-deck glass-card reveal-up">
            <div class="contact-deck-info">
                <h3 class="contact-deck-heading">Let’s Build Something Together</h3>
                <p class="contact-deck-desc">${contact.desc || ''}</p>
                <div class="contact-channel-list">${links}</div>
            </div>
            <form id="contact-form" class="contact-deck-form" autocomplete="off">
                <div class="contact-form-head">
                    <h4 class="contact-form-title">Send a Message</h4>
                    <span class="contact-form-sub">Have a project, question, or collaboration in mind? Drop a note below.</span>
                </div>
                <div class="contact-form-row">
                    <div class="contact-field">
                        <label for="form-name">Your Name</label>
                        <input type="text" id="form-name" name="name" placeholder="Sapta Wiguna" required>
                    </div>
                    <div class="contact-field">
                        <label for="form-email">Your Email</label>
                        <input type="email" id="form-email" name="email" placeholder="you@example.com" required>
                    </div>
                </div>
                <div class="contact-field">
                    <label for="form-message">Message</label>
                    <textarea id="form-message" name="message" rows="4" placeholder="Tell me about your project or idea..." required></textarea>
                </div>
                <button type="submit" class="btn btn-primary btn-submit contact-submit-btn">
                    <span>Send Message</span>
                    <i data-lucide="send" class="btn-icon"></i>
                </button>
            </form>
        </div>
    `;

    container.querySelectorAll('.contact-copy-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const email = btn.dataset.copyEmail || '';
            if (!email || !navigator.clipboard) return;
            navigator.clipboard.writeText(email).then(() => {
                btn.classList.add('copied');
                btn.innerHTML = '<i data-lucide="check"></i>';
                if (window.lucide) lucide.createIcons();
                setTimeout(() => {
                    btn.classList.remove('copied');
                    btn.innerHTML = '<i data-lucide="copy"></i>';
                    if (window.lucide) lucide.createIcons();
                }, 1800);
            }).catch(() => {});
        });
    });

    if (window.lucide) lucide.createIcons();
}

/* ============ SKILL BARS ============ */
function initSkillBars() {
    const fills = document.querySelectorAll('.skill-fill');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const level = entry.target.getAttribute('data-level');
                entry.target.style.width = level + '%';
                setTimeout(() => entry.target.classList.add('animated'), 1200);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    fills.forEach(fill => observer.observe(fill));
}

/* ============ STAT COUNTER ============ */
function initStatCounter() {
    const stats = document.querySelectorAll('.stat-number');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const targetAttr = entry.target.getAttribute('data-count');
                const isFloat = targetAttr.includes('.');
                const target = isFloat ? parseFloat(targetAttr) : parseInt(targetAttr);
                animateCounter(entry.target, target, isFloat);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    stats.forEach(stat => observer.observe(stat));
}

function animateCounter(el, target, isFloat) {
    let current = 0;
    const duration = 1500;
    const step = target / (duration / 16);

    function update() {
        current += step;
        if (current >= target) {
            el.textContent = isFloat ? target.toFixed(2) : target;
            return;
        }
        el.textContent = isFloat ? current.toFixed(2) : Math.floor(current);
        requestAnimationFrame(update);
    }
    update();
}

/* ============ 3D TILT EFFECT ============ */
function initTiltEffect() {
    const cards = document.querySelectorAll('[data-tilt]');

    cards.forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -5;
            const rotateY = ((x - centerX) / centerX) * 5;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
            card.style.transition = 'transform 0.5s ease';
        });

        card.addEventListener('mouseenter', () => {
            card.style.transition = 'none';
        });
    });
}

/* ============ CONTACT FORM ============ */
function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    form.addEventListener('submit', e => {
        e.preventDefault();

        const btn = form.querySelector('.btn-submit');
        const originalHTML = btn.innerHTML;

        // Success animation
        btn.innerHTML = '<span>Message Sent! ✨</span>';
        btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        btn.disabled = true;

        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.style.background = '';
            btn.disabled = false;
            form.reset();
            // Re-init icons
            if (window.lucide) lucide.createIcons();
        }, 2500);
    });
}

/* ============ PROJECTS CAROUSEL NAVIGATION ============ */
function initProjectsCarousel() {
    const grid = document.querySelector('.projects-grid');
    const prevBtn = document.getElementById('proj-prev');
    const nextBtn = document.getElementById('proj-next');
    if (!grid || !prevBtn || !nextBtn) return;

    let isAutoScrolling = true;
    let autoScrollSpeed = 0.5; // slow speed: 0.5 pixels per frame
    let animationFrameId = null;
    let interactionTimeout = null;
    let setWidth = 0;

    // Cache the setWidth and recalculate on resize or layout changes
    const updateDimensions = () => {
        setWidth = grid.scrollWidth / 3;
    };

    // Set initial scroll position once size calculations are ready
    const setInitialScroll = () => {
        updateDimensions();
        if (setWidth > 0) {
            grid.scrollLeft = setWidth;
        } else {
            requestAnimationFrame(setInitialScroll);
        }
    };
    requestAnimationFrame(setInitialScroll);

    window.addEventListener('resize', updateDimensions);

    // Click navigation
    prevBtn.addEventListener('click', () => {
        const cardWidth = grid.querySelector('.project-card')?.offsetWidth || 350;
        grid.scrollBy({ left: -(cardWidth + 24), behavior: 'smooth' });
        pauseAutoScroll();
    });

    nextBtn.addEventListener('click', () => {
        const cardWidth = grid.querySelector('.project-card')?.offsetWidth || 350;
        grid.scrollBy({ left: cardWidth + 24, behavior: 'smooth' });
        pauseAutoScroll();
    });

    // Infinite Loop Jump handler
    const handleInfiniteScroll = () => {
        if (setWidth <= 0) return;

        // If we scroll past Set 2, jump back to Set 2
        if (grid.scrollLeft >= 2 * setWidth) {
            grid.scrollLeft -= setWidth;
        }
        // If we scroll before Set 2, jump forward to Set 2
        else if (grid.scrollLeft < setWidth) {
            grid.scrollLeft += setWidth;
        }
    };

    grid.addEventListener('scroll', handleInfiniteScroll);

    // Auto-scroll controller
    const pauseAutoScroll = () => {
        isAutoScrolling = false;
        clearTimeout(interactionTimeout);
        interactionTimeout = setTimeout(() => {
            if (!grid.matches(':hover') && !prevBtn.matches(':hover') && !nextBtn.matches(':hover')) {
                isAutoScrolling = true;
            }
        }, 3000); // Resume after 3s of idle
    };

    // Listeners to pause on manual user interactions
    grid.addEventListener('touchstart', pauseAutoScroll, { passive: true });
    grid.addEventListener('mousedown', pauseAutoScroll);
    grid.addEventListener('wheel', pauseAutoScroll, { passive: true });

    // Pause on Hover
    const hoverElements = [grid, prevBtn, nextBtn];
    hoverElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            isAutoScrolling = false;
            clearTimeout(interactionTimeout);
        });
        el.addEventListener('mouseleave', () => {
            clearTimeout(interactionTimeout);
            interactionTimeout = setTimeout(() => {
                isAutoScrolling = true;
            }, 1000); // 1s delay after leaving hover
        });
    });

    // Auto Scroll Loop
    function step() {
        if (isAutoScrolling) {
            grid.scrollLeft += autoScrollSpeed;
        }
        animationFrameId = requestAnimationFrame(step);
    }
    animationFrameId = requestAnimationFrame(step);
}

/* ============ PROJECTS CARD CLICKS ============ */
function initProjectCardClicks() {
    const cards = document.querySelectorAll('.project-card[data-url]');
    cards.forEach(card => {
        card.addEventListener('click', (e) => {
            // If the user clicked on a link button inside the card, don't trigger the card's click redirect!
            if (e.target.closest('.project-link-btn')) {
                return;
            }
            
            const url = card.getAttribute('data-url');
            if (url) {
                window.open(url, '_blank', 'noopener,noreferrer');
            }
        });
    });
}

/* ============ BIRD SPAWNER ============ */
function initBirdSpawner() {
    const bird = document.querySelector('.bg-bird');
    if (!bird) return;

    function spawnBird() {
        // Remove class to reset animation and hide bird
        bird.classList.remove('flying');
        
        // Force reflow to register style reset immediately
        void bird.offsetWidth;
        
        // Random bottom position between 70% and 82% of viewport height
        const randomBottom = 70 + Math.random() * 12;
        bird.style.bottom = `${randomBottom}%`;
        
        // Trigger flight animation
        bird.classList.add('flying');
    }

    // Initial spawn
    spawnBird();

    // Spawn every 5 seconds (2s flight + 3s pause)
    setInterval(spawnBird, 5000);
}
