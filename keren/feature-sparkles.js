(function () {
    'use strict';

    const K = window.Keren;
    if (!K) return;

    function startSparkles() {
        const canvas = document.getElementById('sparkle-canvas');
        if (!canvas) return;
        canvas.classList.add('active');
        const ctx = canvas.getContext('2d');

        function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
        resize();
        window.addEventListener('resize', resize);
        K.features.sparkleResize = resize;

        const sparkles = [];
        const colors = ['#00b4ff', '#2060ff', '#8040ff', '#ff2050', '#ffcc00'];

        function spawnSparkle(x, y) {
            for (let i = 0; i < 2; i++) {
                sparkles.push({
                    x: x + (Math.random() - 0.5) * 10,
                    y: y + (Math.random() - 0.5) * 10,
                    vx: (Math.random() - 0.5) * 2.5,
                    vy: (Math.random() - 0.5) * 2 - 1,
                    size: Math.random() * 4 + 1.5,
                    life: 1,
                    decay: Math.random() * 0.02 + 0.015,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    rotation: Math.random() * Math.PI * 2,
                    rotSpeed: (Math.random() - 0.5) * 0.2,
                });
            }
        }

        let lastX = 0, lastY = 0;
        function onMove(e) {
            const dx = e.clientX - lastX, dy = e.clientY - lastY;
            if (dx * dx + dy * dy > 50) {
                spawnSparkle(e.clientX, e.clientY);
                lastX = e.clientX; lastY = e.clientY;
            }
        }
        document.addEventListener('mousemove', onMove);
        K.features.sparkleMouseHandler = onMove;

        function render() {
            if (!K.state.sparkles) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (let i = sparkles.length - 1; i >= 0; i--) {
                const s = sparkles[i];
                s.x += s.vx; s.y += s.vy;
                s.vy += 0.03;
                s.life -= s.decay;
                s.rotation += s.rotSpeed;

                if (s.life <= 0) { sparkles.splice(i, 1); continue; }

                ctx.save();
                ctx.translate(s.x, s.y);
                ctx.rotate(s.rotation);
                ctx.globalAlpha = s.life;

                ctx.beginPath();
                ctx.moveTo(0, -s.size);
                ctx.lineTo(s.size * 0.6, 0);
                ctx.lineTo(0, s.size);
                ctx.lineTo(-s.size * 0.6, 0);
                ctx.closePath();
                ctx.fillStyle = s.color;
                ctx.shadowColor = s.color;
                ctx.shadowBlur = 8;
                ctx.fill();
                ctx.restore();
            }
            K.features.sparkleAnim = requestAnimationFrame(render);
        }
        K.features.sparkleAnim = requestAnimationFrame(render);
    }

    function stopSparkles() {
        const canvas = document.getElementById('sparkle-canvas');
        if (canvas) canvas.classList.remove('active');
        if (K.features.sparkleAnim) cancelAnimationFrame(K.features.sparkleAnim);
        if (K.features.sparkleMouseHandler) document.removeEventListener('mousemove', K.features.sparkleMouseHandler);
        if (K.features.sparkleResize) window.removeEventListener('resize', K.features.sparkleResize);
    }

    K.registerFeature('sparkles', { start: startSparkles, stop: stopSparkles, pausable: true });
})();


