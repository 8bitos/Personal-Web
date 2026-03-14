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

    // Typing Effect
    initTypingEffect();

    // Navbar
    initNavbar();

    // Scroll Reveal
    initScrollReveal();

    // Skill Bars
    initSkillBars();

    // Stat Counter
    initStatCounter();

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

    const words = ['Web Developer', 'UI Designer', 'Tech Enthusiast', 'Problem Solver', 'Creative Coder'];
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
        item.addEventListener('click', () => selectItem(i));

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
function initScrollReveal() {
    const elements = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    elements.forEach(el => observer.observe(el));
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
