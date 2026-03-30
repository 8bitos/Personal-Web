(function () {
    'use strict';

    const K = window.Keren;
    if (!K) return;

    let vortexRAF = null;
    let vortexParticles = [];
    let vortexActive = false;
    let vortexPos = { x: 0, y: 0 };

    function startVortex() {
        const canvas = document.getElementById('vortex-canvas');
        if (!canvas) return;
        canvas.classList.add('active');
        const ctx = canvas.getContext('2d');

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resize();
        K.features.vortexResize = resize;
        window.addEventListener('resize', resize);

        vortexParticles = [];
        const count = 180;
        for (let i = 0; i < count; i++) {
            vortexParticles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.6,
                vy: (Math.random() - 0.5) * 0.6,
            });
        }

        const onDown = (e) => {
            vortexActive = true;
            vortexPos.x = e.clientX;
            vortexPos.y = e.clientY;
        };
        const onMove = (e) => {
            if (!vortexActive) return;
            vortexPos.x = e.clientX;
            vortexPos.y = e.clientY;
        };
        const onUp = () => { vortexActive = false; };

        canvas.addEventListener('pointerdown', onDown);
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        K.features.vortexDown = onDown;
        K.features.vortexMove = onMove;
        K.features.vortexUp = onUp;

        function render() {
            vortexRAF = requestAnimationFrame(render);
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (const p of vortexParticles) {
                if (vortexActive) {
                    const dx = vortexPos.x - p.x;
                    const dy = vortexPos.y - p.y;
                    const dist = Math.max(20, Math.hypot(dx, dy));
                    const pull = 120 / dist;
                    const tx = -dy / dist;
                    const ty = dx / dist;
                    p.vx += (dx / dist) * pull * 0.05 + tx * 0.2;
                    p.vy += (dy / dist) * pull * 0.05 + ty * 0.2;
                }

                p.vx *= 0.98;
                p.vy *= 0.98;
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;

                ctx.fillStyle = 'rgba(0, 180, 255, 0.7)';
                ctx.fillRect(p.x, p.y, 2, 2);
            }

            if (vortexActive) {
                ctx.beginPath();
                ctx.strokeStyle = 'rgba(0,180,255,0.35)';
                ctx.lineWidth = 2;
                ctx.arc(vortexPos.x, vortexPos.y, 26, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
        render();
    }

    function stopVortex() {
        const canvas = document.getElementById('vortex-canvas');
        if (canvas) {
            canvas.classList.remove('active');
            canvas.removeEventListener('pointerdown', K.features.vortexDown);
        }
        if (K.features.vortexMove) window.removeEventListener('pointermove', K.features.vortexMove);
        if (K.features.vortexUp) window.removeEventListener('pointerup', K.features.vortexUp);
        if (K.features.vortexResize) window.removeEventListener('resize', K.features.vortexResize);
        if (vortexRAF) cancelAnimationFrame(vortexRAF);
        vortexRAF = null;
        vortexParticles = [];
        vortexActive = false;
    }

    K.registerFeature('vortex', { start: startVortex, stop: stopVortex, pausable: true });
})();


