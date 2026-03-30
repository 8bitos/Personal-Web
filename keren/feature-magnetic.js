(function () {
    'use strict';

    const K = window.Keren;
    if (!K) return;

    function startMagnetic() {
        const targets = document.querySelectorAll('.btn, .social-link, .project-link-btn, .nav-link');
        function onMove(e) {
            targets.forEach(el => {
                const rect = el.getBoundingClientRect();
                const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
                const dx = e.clientX - cx, dy = e.clientY - cy;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 100) {
                    const pull = (1 - dist / 100) * 12;
                    el.style.transform = `translate(${(dx / dist) * pull}px, ${(dy / dist) * pull}px)`;
                    el.classList.add('magnetic-active');
                } else if (el.classList.contains('magnetic-active')) {
                    el.style.transform = '';
                    el.classList.remove('magnetic-active');
                }
            });
        }
        document.addEventListener('mousemove', onMove);
        K.features.magneticHandler = onMove;
        K.features.magneticTargets = targets;
    }

    function stopMagnetic() {
        if (K.features.magneticHandler) document.removeEventListener('mousemove', K.features.magneticHandler);
        if (K.features.magneticTargets) K.features.magneticTargets.forEach(el => { el.style.transform = ''; el.classList.remove('magnetic-active'); });
    }

    K.registerFeature('magnetic', { start: startMagnetic, stop: stopMagnetic, pausable: true });
})();


