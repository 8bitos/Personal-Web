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

    const count = Math.min(80, Math.floor((canvas.width * canvas.height) / 15000));
    for (let i = 0; i < count; i++) particles.push(new Particle());

    function drawConnections() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 120) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(0, 212, 255, ${0.06 * (1 - dist / 120)})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => { p.update(); p.draw(); });
        drawConnections();
        animId = requestAnimationFrame(animate);
    }
    animate();

    document.addEventListener('mousemove', e => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });
}

/* ============ CURSOR GLOW ============ */
function initCursorGlow() {
    const glow = document.getElementById('cursor-glow');
    if (!glow || window.innerWidth < 768) return;

    document.addEventListener('mousemove', e => {
        glow.style.left = e.clientX + 'px';
        glow.style.top = e.clientY + 'px';
    });
}

/* ============ TYPING EFFECT ============ */
function initTypingEffect() {
    const el = document.getElementById('typed-text');
    if (!el) return;

    const words = Array.isArray(window.__typedWords) && window.__typedWords.length
        ? window.__typedWords
        : ['Web Developer', 'UI Designer', 'Tech Enthusiast', 'Problem Solver', 'Creative Coder'];
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    function type() {
        const currentWord = words[wordIndex];

        if (isDeleting) {
            el.textContent = currentWord.substring(0, charIndex - 1);
            charIndex--;
        } else {
            el.textContent = currentWord.substring(0, charIndex + 1);
            charIndex++;
        }

        let delay = isDeleting ? 40 : 80;

        if (!isDeleting && charIndex === currentWord.length) {
            delay = 2000; // pause at end
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            wordIndex = (wordIndex + 1) % words.length;
            delay = 400;
        }

        setTimeout(type, delay);
    }

    setTimeout(type, 1000);
}

/* ============ P3R MENU SYSTEM (inline hero nav) ============ */
function initNavbar() {
    const navbar = document.getElementById('navbar');
    const items = document.querySelectorAll('.p3r-menu-item');
    const heroNav = document.querySelector('.p3r-hero-nav');
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const mobileBackdrop = document.getElementById('mobile-menu-backdrop');
    let focusedIndex = -1;

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
    function setFocus(index) {
        items.forEach(it => it.classList.remove('focused'));
        focusedIndex = index;
        if (index >= 0 && index < items.length) {
            items[index].classList.add('focused');
            items[index].focus();
            playSound('navigate');
        }
    }

    // ---- Select item (scroll to section) ----
    function selectItem(index) {
        if (index < 0 || index >= items.length) return;
        const section = items[index].getAttribute('data-section');
        playSound('select');

        const target = document.getElementById(section);
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // ---- Click on menu item ----
    items.forEach((item, i) => {
        item.addEventListener('click', () => {
            selectItem(i);
            closeMobileMenu();
        });

        // Hover sounds
        item.addEventListener('mouseenter', () => {
            focusedIndex = i;
            items.forEach(it => it.classList.remove('focused'));
            item.classList.add('focused');
            playSound('hover');
        });
        item.addEventListener('mouseleave', () => {
            item.classList.remove('focused');
        });
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

    // ---- Keyboard navigation (always active) ----
    document.addEventListener('keydown', (e) => {
        // Only handle keys when not typing in inputs
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setFocus(focusedIndex < items.length - 1 ? focusedIndex + 1 : 0);
                break;
            case 'ArrowUp':
                e.preventDefault();
                setFocus(focusedIndex > 0 ? focusedIndex - 1 : items.length - 1);
                break;
            case 'Enter':
                if (focusedIndex >= 0) {
                    e.preventDefault();
                    selectItem(focusedIndex);
                }
                break;
        }
    });

    // ---- Scroll: topbar effect + active section ----
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        if (scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        updateActiveSection(items);
    });
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
            renderHero(data.hero);
            renderAbout(data.about);
            renderSkills(data.skills);
            renderProjects(data.projects);
            renderExperience(data.experience);
            renderContact(data.contact);

            if (window.lucide) lucide.createIcons();
            initTypingEffect();
            initSkillBars();
            initStatCounter();
            initScrollReveal();
        })
        .catch(() => {});
}

function renderSectionTitle(num, title) {
    return `
        <h2 class="section-title reveal-up">
            <span class="section-number">${num}.</span> ${title}
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
            <span id="typed-text" class="typed-text"></span>
            <span class="cursor-blink">|</span>
        </div>
        <p class="hero-description reveal-up">${hero.description || ''}</p>
        <div class="hero-cta reveal-up">${ctas}</div>
        <div class="hero-socials reveal-up">${socials}</div>
    `;

    if (Array.isArray(hero.typedWords)) {
        window.__typedWords = hero.typedWords.slice();
    }
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
    const paragraphs = (about.paragraphs || []).map(p => `<p>${p}</p>`).join('');
    const stats = (about.stats || []).map(s => `
        <div class="stat-card glass-card">
            <span class="stat-number" data-count="${Number(s.value) || 0}">0</span><span class="stat-plus">${s.suffix || ''}</span>
            <span class="stat-label">${s.label || ''}</span>
        </div>
    `).join('');

    container.innerHTML = `
        ${renderSectionTitle(about.number || '01', about.title || 'About Me')}
        <div class="about-grid">
            <div class="about-text reveal-up">${paragraphs}</div>
            <div class="about-stats reveal-up">${stats}</div>
        </div>
    `;
}

function renderSkills(skills) {
    const container = document.querySelector('#skills .container');
    if (!container || !skills) return;
    const categories = (skills.categories || []).map(cat => {
        const items = (cat.skills || []).map(sk => {
            const level = Math.max(0, Math.min(100, Number(sk.level) || 0));
            const skillIcon = sk.icon || 'sparkles';
            const name = sk.name || 'Skill';
            return `
                <div class="skill-item glass-card">
                    <div class="skill-icon">
                        <i data-lucide="${skillIcon}"></i>
                    </div>
                    <span class="skill-name">${name}</span>
                    <div class="skill-bar"><div class="skill-fill" data-level="${level}"></div></div>
                </div>
            `;
        }).join('');
        return `
            <div class="skill-category reveal-up">
                <h3 class="skill-category-title">
                    <i data-lucide="${cat.icon || 'star'}" class="skill-cat-icon"></i>
                    ${cat.title || 'Skills'}
                </h3>
                <div class="skill-items">${items}</div>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        ${renderSectionTitle(skills.number || '02', skills.title || 'Skills & Tech Stack')}
        <div class="skills-grid" id="skills-grid">${categories}</div>
    `;
}

function renderProjects(projects) {
    const container = document.querySelector('#projects .container');
    if (!container || !projects) return;
    const cards = (projects.items || []).map(p => {
        const tech = (p.tech || []).map(t => `<span class="tech-tag">${t}</span>`).join('');
        const pickIcon = (url) => {
            if (!url) return 'external-link';
            if (/github\\.com/i.test(url)) return 'github';
            if (/youtu\\.be|youtube\\.com/i.test(url)) return 'youtube';
            return 'external-link';
        };
        const codeLink = p.codeUrl ? `
            <a href="${p.codeUrl}" class="project-link-btn" aria-label="View Code">
                <i data-lucide="${pickIcon(p.codeUrl)}"></i>
            </a>` : '';
        const liveLink = p.liveUrl ? `
            <a href="${p.liveUrl}" class="project-link-btn" aria-label="Live Demo">
                <i data-lucide="${pickIcon(p.liveUrl)}"></i>
            </a>` : '';
        return `
            <div class="project-card glass-card reveal-up" data-tilt>
                <div class="project-image">
                    <div class="project-placeholder">
                        <i data-lucide="${p.icon || 'layers'}" class="project-placeholder-icon"></i>
                    </div>
                    <div class="project-overlay">
                        <div class="project-links">
                            ${codeLink}
                            ${liveLink}
                        </div>
                    </div>
                </div>
                <div class="project-info">
                    <h3 class="project-title">${p.title || ''}</h3>
                    <p class="project-desc">${p.desc || ''}</p>
                    <div class="project-tech">${tech}</div>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        ${renderSectionTitle(projects.number || '03', projects.title || 'Featured Projects')}
        <div class="projects-grid">${cards}</div>
    `;
}

function renderExperience(exp) {
    const container = document.querySelector('#experience .container');
    if (!container || !exp) return;
    const items = (exp.items || []).map((e, i) => `
        <div class="timeline-item ${i % 2 === 0 ? 'reveal-left' : 'reveal-right'}">
            <div class="timeline-dot"></div>
            <div class="timeline-content glass-card">
                <span class="timeline-date">${e.date || ''}</span>
                <h3 class="timeline-title">${e.title || ''}</h3>
                <p class="timeline-desc">${e.desc || ''}</p>
            </div>
        </div>
    `).join('');

    container.innerHTML = `
        ${renderSectionTitle(exp.number || '04', exp.title || 'Experience')}
        <div class="timeline">${items}</div>
    `;
}

function renderContact(contact) {
    const container = document.querySelector('#contact .container');
    if (!container || !contact) return;
    const links = (contact.links || []).map(l => `
        <a href="${l.href || '#'}" ${l.target ? 'target=\"_blank\" rel=\"noopener noreferrer\"' : ''} class="contact-link glass-card">
            <i data-lucide="${l.icon || 'link'}" class="contact-icon"></i>
            <div>
                <span class="contact-link-label">${l.label || ''}</span>
                <span class="contact-link-value">${l.value || ''}</span>
            </div>
        </a>
    `).join('');

    container.innerHTML = `
        ${renderSectionTitle(contact.number || '05', contact.title || 'Get In Touch')}
        <div class="contact-grid">
            <div class="contact-info reveal-up">
                <p class="contact-desc">${contact.desc || ''}</p>
                <div class="contact-links">${links}</div>
            </div>
            <form id="contact-form" class="contact-form glass-card reveal-up" autocomplete="off">
                <div class="form-group">
                    <input type="text" id="form-name" name="name" placeholder=" " required>
                    <label for="form-name">Your Name</label>
                    <div class="form-line"></div>
                </div>
                <div class="form-group">
                    <input type="email" id="form-email" name="email" placeholder=" " required>
                    <label for="form-email">Your Email</label>
                    <div class="form-line"></div>
                </div>
                <div class="form-group">
                    <textarea id="form-message" name="message" rows="4" placeholder=" " required></textarea>
                    <label for="form-message">Your Message</label>
                    <div class="form-line"></div>
                </div>
                <button type="submit" class="btn btn-primary btn-submit">
                    <span>Send Message</span>
                    <i data-lucide="send" class="btn-icon"></i>
                </button>
            </form>
        </div>
    `;
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
                const target = parseInt(entry.target.getAttribute('data-count'));
                animateCounter(entry.target, target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    stats.forEach(stat => observer.observe(stat));
}

function animateCounter(el, target) {
    let current = 0;
    const duration = 1500;
    const step = target / (duration / 16);

    function update() {
        current += step;
        if (current >= target) {
            el.textContent = target;
            return;
        }
        el.textContent = Math.floor(current);
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
