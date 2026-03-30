(function () {
    'use strict';

    const K = window.Keren;
    if (!K) return;

    function initTogglePager() {
        const pager = document.querySelector('.phone-toggles-pager');
        const dots = Array.from(document.querySelectorAll('.phone-dot'));
        if (!pager || dots.length === 0) return;

        let rafId = null;
        let snapTimer = null;
        const updateDots = () => {
            const pageWidth = pager.clientWidth || 1;
            const index = Math.max(0, Math.min(dots.length - 1, Math.round(pager.scrollLeft / pageWidth)));
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
                dot.setAttribute('aria-selected', i === index ? 'true' : 'false');
            });
        };

        pager.addEventListener('scroll', () => {
            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(updateDots);
            if (snapTimer) clearTimeout(snapTimer);
            snapTimer = setTimeout(() => {
                const pageWidth = pager.clientWidth || 1;
                const index = Math.max(0, Math.min(dots.length - 1, Math.round(pager.scrollLeft / pageWidth)));
                pager.scrollTo({ left: index * pageWidth, behavior: 'smooth' });
            }, 120);
        }, { passive: true });

        dots.forEach((dot, i) => {
            dot.addEventListener('click', (e) => {
                e.stopPropagation();
                pager.scrollTo({ left: i * pager.clientWidth, behavior: 'smooth' });
            });
        });

        updateDots();
    }

    function initTogglePanel() {
        const trigger = document.getElementById('phone-trigger');
        const frame = document.getElementById('phone-frame');
        const backdrop = document.getElementById('phone-backdrop');
        const tiles = document.querySelectorAll('.phone-toggle-tile');

        if (!trigger || !frame) return;

        const phoneOpenSound = new Audio('assets/Audio/deck_ui_side_menu_fly_in.wav');
        const phoneCloseSound = new Audio('assets/Audio/deck_ui_side_menu_fly_out.wav');
        phoneOpenSound.preload = 'none';
        phoneCloseSound.preload = 'none';
        phoneOpenSound.volume = 0.5;
        phoneCloseSound.volume = 0.5;

        let isOpen = false;

        function openPhone() {
            if (isOpen) return;
            isOpen = true;
            frame.classList.add('open');
            backdrop.classList.add('active');
            trigger.classList.add('active');
            phoneOpenSound.currentTime = 0;
            phoneOpenSound.play().catch(() => {});
            updatePhoneClock();
        }

        function closePhone() {
            if (!isOpen) return;
            isOpen = false;
            frame.classList.remove('open');
            backdrop.classList.remove('active');
            trigger.classList.remove('active');
            phoneCloseSound.currentTime = 0;
            phoneCloseSound.play().catch(() => {});
        }

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            isOpen ? closePhone() : openPhone();
        });

        backdrop.addEventListener('click', closePhone);

        function updatePhoneClock() {
            const el = document.getElementById('phone-time');
            if (!el) return;
            const now = new Date();
            el.textContent = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
        }
        setInterval(updatePhoneClock, 30000);
        updatePhoneClock();

        tiles.forEach(tile => {
            const feature = tile.dataset.feature;
            const input = tile.querySelector('.toggle-input');

            const saved = localStorage.getItem('interactive_' + feature);
            if (saved === 'true') {
                if (input) input.checked = true;
                tile.classList.add('active');
                tile.setAttribute('aria-pressed', 'true');
                K.toggleFeature(feature, true);
            } else {
                tile.setAttribute('aria-pressed', 'false');
            }

            tile.addEventListener('click', (e) => {
                e.stopPropagation();
                const isNowActive = !tile.classList.contains('active');
                tile.classList.toggle('active');
                tile.setAttribute('aria-pressed', isNowActive ? 'true' : 'false');
                if (input) input.checked = isNowActive;
                localStorage.setItem('interactive_' + feature, isNowActive);
                K.toggleFeature(feature, isNowActive);
                if (K.state.sounds) K.playSound(isNowActive ? 'on' : 'off');
            });
        });

        if (K.mediaPlayer && typeof K.mediaPlayer.init === 'function') {
            K.mediaPlayer.init();
        }

        initTogglePager();
    }

    K.registerInit(() => {
        initTogglePanel();
        K.initSoundListeners();
    });
})();


