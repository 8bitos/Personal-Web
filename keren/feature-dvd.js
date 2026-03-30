(function () {
    'use strict';

    const K = window.Keren;
    if (!K) return;

    let dvdRAF = null;
    let dvdState = null;

    function startDVD() {
        const canvas = document.getElementById('dvd-canvas');
        if (!canvas) return;
        canvas.classList.add('active');
        const ctx = canvas.getContext('2d');

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resize();
        K.features.dvdResize = resize;
        window.addEventListener('resize', resize);

        const colors = ['#00b4ff', '#ff2050', '#ffcc00', '#80ffea', '#8a4dff', '#00ff7a'];
        dvdState = {
            w: 140,
            h: 70,
            x: Math.random() * (canvas.width - 140),
            y: Math.random() * (canvas.height - 70),
            vx: (Math.random() > 0.5 ? 1 : -1) * (2 + Math.random() * 2),
            vy: (Math.random() > 0.5 ? 1 : -1) * (2 + Math.random() * 2),
            color: colors[Math.floor(Math.random() * colors.length)]
        };

        function drawLogo(x, y, w, h, color) {
            ctx.save();
            ctx.fillStyle = color;
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.shadowColor = color;
            ctx.shadowBlur = 18;
            ctx.beginPath();
            ctx.roundRect(x, y, w, h, 12);
            ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.font = 'bold 28px "Space Grotesk", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('DVD', x + w / 2, y + h / 2);
            ctx.restore();
        }

        function tick() {
            dvdRAF = requestAnimationFrame(tick);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (!dvdState) return;

            dvdState.x += dvdState.vx;
            dvdState.y += dvdState.vy;

            let bounced = false;
            if (dvdState.x <= 0 || dvdState.x + dvdState.w >= canvas.width) {
                dvdState.vx *= -1;
                bounced = true;
            }
            if (dvdState.y <= 0 || dvdState.y + dvdState.h >= canvas.height) {
                dvdState.vy *= -1;
                bounced = true;
            }

            if (bounced) {
                dvdState.color = colors[Math.floor(Math.random() * colors.length)];
            }

            drawLogo(dvdState.x, dvdState.y, dvdState.w, dvdState.h, dvdState.color);
        }
        tick();
    }

    function stopDVD() {
        const canvas = document.getElementById('dvd-canvas');
        if (canvas) canvas.classList.remove('active');
        if (K.features.dvdResize) window.removeEventListener('resize', K.features.dvdResize);
        if (dvdRAF) cancelAnimationFrame(dvdRAF);
        dvdRAF = null;
        dvdState = null;
    }

    K.registerFeature('dvd', { start: startDVD, stop: stopDVD, pausable: true });
})();


