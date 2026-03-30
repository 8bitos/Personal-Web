(function () {
    'use strict';

    const K = window.Keren;
    if (!K) return;

    let clothRAF = null;
    let clothPoints = [];
    let clothConstraints = [];
    let clothDragIndex = -1;

    function startCloth() {
        const canvas = document.getElementById('cloth-canvas');
        if (!canvas) return;
        canvas.classList.add('active');
        const ctx = canvas.getContext('2d');

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resize();
        K.features.clothResize = resize;
        window.addEventListener('resize', resize);

        const cols = 18;
        const rows = 10;
        const spacing = Math.min(canvas.width, canvas.height) * 0.035;
        const startX = canvas.width * 0.2;
        const startY = canvas.height * 0.2;
        const gravity = 0.25;

        clothPoints = [];
        clothConstraints = [];

        function idx(x, y) { return y * cols + x; }

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const px = startX + x * spacing;
                const py = startY + y * spacing;
                clothPoints.push({
                    x: px, y: py,
                    oldx: px, oldy: py,
                    pinned: y === 0 && x % 2 === 0
                });
                if (x > 0) clothConstraints.push([idx(x, y), idx(x - 1, y), spacing]);
                if (y > 0) clothConstraints.push([idx(x, y), idx(x, y - 1), spacing]);
            }
        }

        const onDown = (e) => {
            let nearest = -1;
            let best = 99999;
            for (let i = 0; i < clothPoints.length; i++) {
                const p = clothPoints[i];
                const dx = e.clientX - p.x;
                const dy = e.clientY - p.y;
                const d = dx * dx + dy * dy;
                if (d < best && d < spacing * spacing * 3) {
                    best = d;
                    nearest = i;
                }
            }
            clothDragIndex = nearest;
        };
        const onMove = (e) => {
            if (clothDragIndex < 0) return;
            const p = clothPoints[clothDragIndex];
            if (!p || p.pinned) return;
            p.x = e.clientX;
            p.y = e.clientY;
            p.oldx = p.x;
            p.oldy = p.y;
        };
        const onUp = () => { clothDragIndex = -1; };

        canvas.addEventListener('pointerdown', onDown);
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        K.features.clothDown = onDown;
        K.features.clothMove = onMove;
        K.features.clothUp = onUp;

        function satisfy() {
            for (let iter = 0; iter < 4; iter++) {
                for (const c of clothConstraints) {
                    const a = clothPoints[c[0]];
                    const b = clothPoints[c[1]];
                    const dx = b.x - a.x;
                    const dy = b.y - a.y;
                    const dist = Math.hypot(dx, dy) || 1;
                    const diff = (dist - c[2]) / dist;
                    const offsetX = dx * 0.5 * diff;
                    const offsetY = dy * 0.5 * diff;
                    if (!a.pinned) { a.x += offsetX; a.y += offsetY; }
                    if (!b.pinned) { b.x -= offsetX; b.y -= offsetY; }
                }
            }
        }

        function update() {
            clothRAF = requestAnimationFrame(update);
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (const p of clothPoints) {
                if (p.pinned) continue;
                const vx = (p.x - p.oldx) * 0.99;
                const vy = (p.y - p.oldy) * 0.99;
                p.oldx = p.x;
                p.oldy = p.y;
                p.x += vx;
                p.y += vy + gravity;
            }

            satisfy();

            ctx.strokeStyle = 'rgba(0, 180, 255, 0.45)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            for (const c of clothConstraints) {
                const a = clothPoints[c[0]];
                const b = clothPoints[c[1]];
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
            }
            ctx.stroke();

            ctx.fillStyle = 'rgba(0, 180, 255, 0.22)';
            const mid = clothPoints[Math.floor(clothPoints.length * 0.6)];
            ctx.fillRect(mid.x - 70, mid.y + 10, 140, 28);
            ctx.fillStyle = 'rgba(0, 180, 255, 0.9)';
            ctx.font = '12px "Space Grotesk", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('SAPTA', mid.x, mid.y + 30);
        }
        update();
    }

    function stopCloth() {
        const canvas = document.getElementById('cloth-canvas');
        if (canvas) {
            canvas.classList.remove('active');
            canvas.removeEventListener('pointerdown', K.features.clothDown);
        }
        if (K.features.clothMove) window.removeEventListener('pointermove', K.features.clothMove);
        if (K.features.clothUp) window.removeEventListener('pointerup', K.features.clothUp);
        if (K.features.clothResize) window.removeEventListener('resize', K.features.clothResize);
        if (clothRAF) cancelAnimationFrame(clothRAF);
        clothRAF = null;
        clothPoints = [];
        clothConstraints = [];
        clothDragIndex = -1;
    }

    K.registerFeature('cloth', { start: startCloth, stop: stopCloth, pausable: true });
})();


