(function () {
    'use strict';

    const K = window.Keren;
    if (!K) return;

    function startGravity() {
        const canvas = document.getElementById('gravity-canvas');
        if (!canvas) return;
        canvas.classList.add('active');
        const ctx = canvas.getContext('2d');

        function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
        resize();
        window.addEventListener('resize', resize);
        K.features.gravityResize = resize;

        const balls = [];
        const colors = ['#00b4ff', '#2060ff', '#8040ff', '#ff2050', '#ffcc00', '#10b981'];
        const gravityAccel = 0.35, friction = 0.998, bounce = 0.7, maxBalls = 60;

        function onClick(e) {
            if (e.target.closest('.interactive-panel')) return;
            if (e.target.closest('a, button, input, textarea')) return;

            const count = Math.floor(Math.random() * 3) + 2;
            for (let i = 0; i < count; i++) {
                if (balls.length >= maxBalls) balls.shift();
                balls.push({
                    x: e.clientX + (Math.random() - 0.5) * 20,
                    y: e.clientY + (Math.random() - 0.5) * 20,
                    vx: (Math.random() - 0.5) * 8,
                    vy: (Math.random() - 0.5) * 5 - 3,
                    r: Math.random() * 14 + 6,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    life: 1,
                });
            }
            if (K.state.sounds) K.playSound('pop');
        }
        canvas.addEventListener('click', onClick);
        K.features.gravityClickHandler = onClick;

        function render() {
            if (!K.state.gravity) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (let i = balls.length - 1; i >= 0; i--) {
                const b = balls[i];
                b.vy += gravityAccel;
                b.vx *= friction; b.vy *= friction;
                b.x += b.vx; b.y += b.vy;

                if (b.y + b.r > canvas.height) { b.y = canvas.height - b.r; b.vy *= -bounce; if (Math.abs(b.vy) < 0.5) b.vy = 0; }
                if (b.x - b.r < 0) { b.x = b.r; b.vx *= -bounce; }
                if (b.x + b.r > canvas.width) { b.x = canvas.width - b.r; b.vx *= -bounce; }

                if (Math.abs(b.vy) < 0.3 && b.y + b.r >= canvas.height - 1) b.life -= 0.005;
                if (b.life <= 0) { balls.splice(i, 1); continue; }

                for (let j = i + 1; j < balls.length; j++) {
                    const b2 = balls[j];
                    const dx = b2.x - b.x, dy = b2.y - b.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const minDist = b.r + b2.r;
                    if (dist < minDist && dist > 0) {
                        const nx = dx / dist, ny = dy / dist;
                        const overlap = (minDist - dist) / 2;
                        b.x -= nx * overlap; b.y -= ny * overlap;
                        b2.x += nx * overlap; b2.y += ny * overlap;
                        const dvx = b.vx - b2.vx, dvy = b.vy - b2.vy;
                        const dot = dvx * nx + dvy * ny;
                        b.vx -= dot * nx * bounce; b.vy -= dot * ny * bounce;
                        b2.vx += dot * nx * bounce; b2.vy += dot * ny * bounce;
                    }
                }

                ctx.globalAlpha = b.life;
                ctx.beginPath();
                for (let a = 0; a < 6; a++) {
                    const ang = (a / 6) * Math.PI * 2 - Math.PI / 6;
                    const px = b.x + Math.cos(ang) * b.r;
                    const py = b.y + Math.sin(ang) * b.r;
                    a === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
                }
                ctx.closePath();
                const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
                grad.addColorStop(0, b.color + 'cc');
                grad.addColorStop(1, b.color + '33');
                ctx.fillStyle = grad;
                ctx.shadowColor = b.color;
                ctx.shadowBlur = 10;
                ctx.fill();
                ctx.shadowBlur = 0;

                ctx.beginPath();
                const hs = b.r * 0.3;
                ctx.moveTo(b.x, b.y - hs);
                ctx.lineTo(b.x + hs * 0.6, b.y);
                ctx.lineTo(b.x, b.y + hs);
                ctx.lineTo(b.x - hs * 0.6, b.y);
                ctx.closePath();
                ctx.fillStyle = 'rgba(255,255,255,0.2)';
                ctx.fill();
            }

            ctx.globalAlpha = 1;
            K.features.gravityAnim = requestAnimationFrame(render);
        }
        K.features.gravityAnim = requestAnimationFrame(render);
    }

    function stopGravity() {
        const canvas = document.getElementById('gravity-canvas');
        if (canvas) { canvas.classList.remove('active'); canvas.removeEventListener('click', K.features.gravityClickHandler); }
        if (K.features.gravityAnim) cancelAnimationFrame(K.features.gravityAnim);
        if (K.features.gravityResize) window.removeEventListener('resize', K.features.gravityResize);
    }

    K.registerFeature('gravity', { start: startGravity, stop: stopGravity, pausable: true });
})();


