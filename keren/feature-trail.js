(function () {
    'use strict';

    const K = window.Keren;
    if (!K) return;

    let trailCanvas = null, trailCtx = null, trailRAF = null;
    const trailDots = [];

    function trailMouseHandler(e) {
        trailDots.push({ x: e.clientX, y: e.clientY, size: 4 + Math.random() * 3, life: 1 });
        if (trailDots.length > 50) trailDots.shift();
    }

    function startTrail() {
        if (trailCanvas) return;
        trailCanvas = document.createElement('canvas');
        trailCanvas.id = 'trail-canvas';
        trailCanvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:9998;pointer-events:none;';
        document.body.appendChild(trailCanvas);
        trailCtx = trailCanvas.getContext('2d');

        function resize() {
            trailCanvas.width = window.innerWidth;
            trailCanvas.height = window.innerHeight;
        }
        resize();
        window.addEventListener('resize', resize);
        K.features.trailResize = resize;

        document.addEventListener('mousemove', trailMouseHandler);

        function animate() {
            trailCtx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);
            for (let i = trailDots.length - 1; i >= 0; i--) {
                const d = trailDots[i];
                d.life -= 0.02;
                d.size *= 0.97;
                if (d.life <= 0) { trailDots.splice(i, 1); continue; }

                trailCtx.beginPath();
                trailCtx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
                trailCtx.fillStyle = `rgba(0, 180, 255, ${d.life})`;
                trailCtx.shadowColor = '#00b4ff';
                trailCtx.shadowBlur = 12;
                trailCtx.fill();
                trailCtx.shadowBlur = 0;
            }
            trailRAF = requestAnimationFrame(animate);
        }
        trailRAF = requestAnimationFrame(animate);
    }

    function stopTrail() {
        document.removeEventListener('mousemove', trailMouseHandler);
        if (trailRAF) cancelAnimationFrame(trailRAF);
        trailRAF = null;
        if (K.features.trailResize) window.removeEventListener('resize', K.features.trailResize);
        if (trailCanvas) { trailCanvas.remove(); trailCanvas = null; trailCtx = null; }
        trailDots.length = 0;
    }

    K.registerFeature('trail', { start: startTrail, stop: stopTrail, pausable: true });
})();


