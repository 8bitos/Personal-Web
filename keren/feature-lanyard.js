(function () {
    'use strict';

    const K = window.Keren;
    if (!K) return;

    let profileImg = null;
    let backImg = null;
    let profileImgPromise = null;
    let backImgPromise = null;

    function preloadImg(src) {
        return new Promise(resolve => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = src;
        });
    }

    function ensureLanyardImages() {
        if (!profileImgPromise) {
            profileImgPromise = preloadImg('assets/sapta.png').then(img => {
                profileImg = img;
                return img;
            });
        }
        if (!backImgPromise) {
            backImgPromise = preloadImg('assets/bglanyard.png').then(img => {
                backImg = img;
                return img;
            });
        }
    }

    function startLanyard() {
        const canvas = document.getElementById('lanyard-canvas');
        if (!canvas) return;
        canvas.classList.add('active');
        const ctx = canvas.getContext('2d');
        ensureLanyardImages();

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resize();
        const resizeHandler = () => resize();
        window.addEventListener('resize', resizeHandler);
        K.features.lanyardResizeHandler = resizeHandler;

        const segmentCount = 22;
        const segmentLength = 11;
        const gravity = 0.42;
        const damping = 0.99;
        const anchorX = () => canvas.width - 120;
        const anchorY = 0;

        const points = [];
        for (let i = 0; i <= segmentCount; i++) {
            points.push({
                x: anchorX() + i * 1.5,
                y: anchorY + i * segmentLength,
                oldX: anchorX() + i * 1.5,
                oldY: anchorY + i * segmentLength,
                pinned: i === 0
            });
        }

        const cardW = 170;
        const cardH = 238;

        const flipSound = new Audio('assets/Audio/deck_ui_lanyardflip.wav');
        flipSound.preload = 'none';
        flipSound.volume = 0.5;

        let flipAngle = 0;
        let flipTarget = 0;
        let isFlipping = false;
        let showingBack = false;

        let dragging = false;
        let dragOff = null;

        function getLast() { return points[points.length - 1]; }

        function isOnCard(mx, my) {
            const last = getLast();
            return Math.abs(mx - last.x) < cardW / 2 + 30 && Math.abs(my - last.y - cardH / 2 + 10) < cardH / 2 + 30;
        }

        const onDblClick = (e) => {
            if (isOnCard(e.clientX, e.clientY) && !isFlipping) {
                isFlipping = true;
                showingBack = !showingBack;
                flipTarget = showingBack ? Math.PI : 0;
                flipSound.currentTime = 0;
                flipSound.play().catch(() => {});
            }
        };
        canvas.addEventListener('dblclick', onDblClick);

        const onMouseDown = (e) => {
            if (isOnCard(e.clientX, e.clientY)) {
                dragging = true;
                const last = getLast();
                dragOff = { x: e.clientX - last.x, y: e.clientY - last.y };
            }
        };
        const onMouseMove = (e) => {
            if (dragging && dragOff) {
                const last = getLast();
                last.x = e.clientX - dragOff.x;
                last.y = e.clientY - dragOff.y;
            }
            canvas.style.cursor = isOnCard(e.clientX, e.clientY) ? 'grab' : 'default';
        };
        const onMouseUp = () => { dragging = false; dragOff = null; };
        canvas.addEventListener('mousedown', onMouseDown);
        canvas.addEventListener('mousemove', onMouseMove);
        canvas.addEventListener('mouseup', onMouseUp);

        let lastTap = 0;
        const onTouchStart = (e) => {
            const t = e.touches[0];
            if (isOnCard(t.clientX, t.clientY)) {
                const now = Date.now();
                if (now - lastTap < 350 && !isFlipping) {
                    isFlipping = true;
                    showingBack = !showingBack;
                    flipTarget = showingBack ? Math.PI : 0;
                    flipSound.currentTime = 0;
                    flipSound.play().catch(() => {});
                }
                lastTap = now;

                dragging = true;
                const last = getLast();
                dragOff = { x: t.clientX - last.x, y: t.clientY - last.y };
                e.preventDefault();
            }
        };
        const onTouchMove = (e) => {
            if (dragging && dragOff) {
                const t = e.touches[0];
                const last = getLast();
                last.x = t.clientX - dragOff.x;
                last.y = t.clientY - dragOff.y;
                e.preventDefault();
            }
        };
        const onTouchEnd = () => { dragging = false; dragOff = null; };
        canvas.addEventListener('touchstart', onTouchStart, { passive: false });
        canvas.addEventListener('touchmove', onTouchMove, { passive: false });
        canvas.addEventListener('touchend', onTouchEnd);

        K.features.lanyardHandlers = { onDblClick, onMouseDown, onMouseMove, onMouseUp, onTouchStart, onTouchMove, onTouchEnd };

        function simulate() {
            for (const p of points) {
                if (p.pinned) { p.x = anchorX(); p.y = anchorY; continue; }
                const vx = (p.x - p.oldX) * damping;
                const vy = (p.y - p.oldY) * damping;
                p.oldX = p.x;
                p.oldY = p.y;
                if (!dragging || p !== getLast()) {
                    p.x += vx;
                    p.y += vy + gravity;
                }
            }
            for (let iter = 0; iter < 6; iter++) {
                for (let i = 0; i < segmentCount; i++) {
                    const a = points[i], b = points[i + 1];
                    const dx = b.x - a.x, dy = b.y - a.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist === 0) continue;
                    const diff = (segmentLength - dist) / dist / 2;
                    const ox = dx * diff, oy = dy * diff;
                    if (!a.pinned) { a.x -= ox; a.y -= oy; }
                    if (!b.pinned && !(dragging && b === getLast())) { b.x += ox; b.y += oy; }
                }
            }
        }

        function updateFlip() {
            if (!isFlipping) return;
            const speed = 0.12;
            const diff = flipTarget - flipAngle;
            flipAngle += diff * speed;
            if (Math.abs(diff) < 0.01) {
                flipAngle = flipTarget;
                isFlipping = false;
            }
        }

        let qrPattern = null;
        function getQRPattern() {
            if (qrPattern) return qrPattern;
            qrPattern = [];
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    if (Math.random() > 0.35) qrPattern.push({ r, c });
                }
            }
            return qrPattern;
        }

        function drawFrontFace(ctx, bx, by) {
            ctx.beginPath();
            ctx.rect(bx, by, cardW, cardH);

            const bgGrad = ctx.createLinearGradient(bx, by, bx + cardW, by + cardH);
            bgGrad.addColorStop(0, 'rgba(8, 14, 32, 0.97)');
            bgGrad.addColorStop(1, 'rgba(16, 24, 52, 0.97)');
            ctx.fillStyle = bgGrad;
            ctx.fill();
            ctx.strokeStyle = 'rgba(0, 180, 255, 0.3)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(bx, by);
            ctx.lineTo(bx + cardW, by);
            const topGrad = ctx.createLinearGradient(bx, by, bx + cardW, by);
            topGrad.addColorStop(0, '#00b4ff');
            topGrad.addColorStop(1, '#2060ff');
            ctx.strokeStyle = topGrad;
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.fillStyle = 'rgba(0, 180, 255, 0.4)';
            ctx.font = '700 8px "Space Grotesk", sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText('PERSONAL LANYARD PASS', bx + 14, by + 12);

            ctx.strokeStyle = 'rgba(0, 180, 255, 0.25)';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(bx + 4, by + 4); ctx.lineTo(bx + 4, by + 14); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(bx + cardW - 4, by + 4); ctx.lineTo(bx + cardW - 4, by + 14); ctx.stroke();

            const photoSize = 64;
            const cx = bx + cardW / 2;
            const photoX = cx - photoSize / 2;
            const photoY = by + 30;

            ctx.save();
            ctx.beginPath();
            ctx.rect(photoX, photoY, photoSize, photoSize);
            ctx.clip();

            if (profileImg) {
                const aspect = profileImg.width / profileImg.height;
                let dw = photoSize, dh = photoSize;
                if (aspect > 1) dw = photoSize * aspect; else dh = photoSize / aspect;
                ctx.drawImage(profileImg, photoX + (photoSize - dw) / 2, photoY + (photoSize - dh) / 2 - 5, dw, dh);
            } else {
                ctx.fillStyle = 'rgba(0, 180, 255, 0.08)';
                ctx.fillRect(photoX, photoY, photoSize, photoSize);
                ctx.fillStyle = '#00b4ff';
                ctx.font = '700 24px "Space Grotesk", sans-serif';
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText('S', cx, photoY + photoSize / 2);
            }
            ctx.restore();

            ctx.beginPath();
            ctx.rect(photoX, photoY, photoSize, photoSize);
            ctx.strokeStyle = 'rgba(0, 180, 255, 0.4)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.textAlign = 'center'; ctx.textBaseline = 'top';
            ctx.fillStyle = '#e4eaf8';
            ctx.font = '700 17px "Space Grotesk", sans-serif';
            ctx.fillText('SAPTA', cx, photoY + photoSize + 14);
            ctx.fillStyle = '#00b4ff';
            ctx.font = '700 10px "Inter", sans-serif';
            ctx.fillText('FULL STACK DEVELOPER', cx, photoY + photoSize + 34);
            ctx.fillStyle = 'rgba(0, 180, 255, 0.6)';
            ctx.font = '600 7px "Inter", sans-serif';
            ctx.fillText('UNDIKSHA', cx, photoY + photoSize + 48);

            const divY = photoY + photoSize + 54;
            ctx.beginPath();
            ctx.moveTo(bx + 16, divY); ctx.lineTo(cx - 10, divY);
            ctx.moveTo(cx + 10, divY); ctx.lineTo(bx + cardW - 16, divY);
            ctx.strokeStyle = 'rgba(0, 180, 255, 0.15)'; ctx.lineWidth = 1; ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx, divY - 4); ctx.lineTo(cx + 5, divY); ctx.lineTo(cx, divY + 4); ctx.lineTo(cx - 5, divY); ctx.closePath();
            ctx.fillStyle = 'rgba(0, 180, 255, 0.3)'; ctx.fill();

            const infoY = divY + 14;
            ctx.textAlign = 'left'; ctx.font = '700 8px "Inter", sans-serif';
            ctx.fillStyle = 'rgba(0, 180, 255, 0.4)';
            ctx.fillText('STATUS', bx + 16, infoY);
            ctx.fillStyle = '#10b981'; ctx.font = '700 10px "Inter", sans-serif';
            ctx.fillText('ACTIVE', bx + 16, infoY + 12);
            ctx.fillStyle = 'rgba(0, 180, 255, 0.45)'; ctx.font = '700 7px "Inter", sans-serif';
            ctx.fillText('ID NO', bx + 16, infoY + 26);
            ctx.fillStyle = '#e4eaf8'; ctx.font = '700 8px "Inter", sans-serif';
            ctx.fillText('28012004', bx + 16, infoY + 36);
            ctx.fillStyle = 'rgba(0, 180, 255, 0.4)'; ctx.font = '700 8px "Inter", sans-serif';
            ctx.fillText('DEPT', bx + cardW / 2, infoY);
            ctx.fillStyle = '#e4eaf8'; ctx.font = '700 10px "Inter", sans-serif';
            ctx.fillText('WEB / APP', bx + cardW / 2, infoY + 12);
            ctx.fillStyle = 'rgba(0, 180, 255, 0.45)'; ctx.font = '700 7px "Inter", sans-serif';
            ctx.fillText('ACCESS', bx + cardW / 2, infoY + 26);
            ctx.fillStyle = '#e4eaf8'; ctx.font = '700 8px "Inter", sans-serif';
            ctx.fillText('EVERYWHERE', bx + cardW / 2, infoY + 36);

            const qrX = bx + cardW / 2 - 14;
            const qrY = infoY + 44;
            const qrSz = 28, cs = qrSz / 8;
            ctx.fillStyle = 'rgba(0, 180, 255, 0.5)';
            for (const p of getQRPattern()) ctx.fillRect(qrX + p.c * cs, qrY + p.r * cs, cs - 0.5, cs - 0.5);
            ctx.strokeStyle = 'rgba(0, 180, 255, 0.15)'; ctx.lineWidth = 0.5;
            ctx.strokeRect(qrX - 2, qrY - 2, qrSz + 4, qrSz + 4);

            ctx.fillStyle = 'rgba(0, 180, 255, 0.25)';
            ctx.font = '600 7px "Inter", monospace'; ctx.textAlign = 'center';
            ctx.fillText('ID# P3R-2026-0614', cx, by + cardH - 10);

            ctx.beginPath(); ctx.moveTo(bx, by + cardH); ctx.lineTo(bx + cardW, by + cardH);
            const botGrad = ctx.createLinearGradient(bx, 0, bx + cardW, 0);
            botGrad.addColorStop(0, '#ff2050'); botGrad.addColorStop(1, '#ffcc00');
            ctx.strokeStyle = botGrad; ctx.lineWidth = 2; ctx.stroke();
        }

        function drawBackFace(ctx, bx, by) {
            ctx.beginPath();
            ctx.rect(bx, by, cardW, cardH);

            ctx.save();
            ctx.clip();

            if (backImg) {
                const imgAspect = backImg.width / backImg.height;
                const cardAspect = cardW / cardH;
                let dw, dh;
                if (imgAspect > cardAspect) {
                    dh = cardH; dw = cardH * imgAspect;
                } else {
                    dw = cardW; dh = cardW / imgAspect;
                }
                ctx.drawImage(backImg, bx + (cardW - dw) / 2, by + (cardH - dh) / 2, dw, dh);
            } else {
                const bgGrad = ctx.createLinearGradient(bx, by, bx + cardW, by + cardH);
                bgGrad.addColorStop(0, 'rgba(20, 25, 60, 0.97)');
                bgGrad.addColorStop(1, 'rgba(10, 15, 40, 0.97)');
                ctx.fillStyle = bgGrad;
                ctx.fill();
                ctx.fillStyle = 'rgba(0, 180, 255, 0.15)';
                ctx.font = '700 60px "Space Grotesk", sans-serif';
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText('?', bx + cardW / 2, by + cardH / 2);
            }
            ctx.restore();

            ctx.beginPath();
            ctx.rect(bx, by, cardW, cardH);
            ctx.strokeStyle = 'rgba(100, 130, 180, 0.4)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(bx, by); ctx.lineTo(bx + cardW, by);
            const topGrad = ctx.createLinearGradient(bx, by, bx + cardW, by);
            topGrad.addColorStop(0, 'rgba(100, 130, 180, 0.6)');
            topGrad.addColorStop(1, 'rgba(60, 80, 140, 0.6)');
            ctx.strokeStyle = topGrad; ctx.lineWidth = 3; ctx.stroke();

            ctx.beginPath(); ctx.moveTo(bx, by + cardH); ctx.lineTo(bx + cardW, by + cardH);
            ctx.strokeStyle = 'rgba(100, 130, 180, 0.4)'; ctx.lineWidth = 2; ctx.stroke();
        }

        function drawCard(ctx, x, y, ropeAngle) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(ropeAngle);

            updateFlip();

            const scaleX = Math.cos(flipAngle);
            const absScale = Math.abs(scaleX);
            const isFront = scaleX >= 0;

            ctx.shadowColor = 'rgba(0, 180, 255, 0.12)';
            ctx.shadowBlur = 30;
            ctx.shadowOffsetY = 10;

            ctx.scale(absScale, 1);

            ctx.shadowColor = 'transparent';

            const bx = -cardW / 2;
            const by = 0;

            if (isFront) {
                drawFrontFace(ctx, bx, by);
            } else {
                ctx.scale(-1, 1);
                drawBackFace(ctx, bx, by);
            }

            if (!isFlipping && absScale > 0.95) {
                ctx.scale(isFront ? 1 : -1, 1);
                ctx.fillStyle = 'rgba(0, 180, 255, 0.2)';
                ctx.font = '600 7px "Inter", sans-serif';
                ctx.textAlign = 'center'; ctx.textBaseline = 'top';
                ctx.fillText('DOUBLE-CLICK TO FLIP', 0, by + cardH + 8);
            }

            ctx.restore();
        }

        function render() {
            if (!K.state.lanyard) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            simulate();

            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
            const strapGrad = ctx.createLinearGradient(points[0].x, points[0].y, getLast().x, getLast().y);
            strapGrad.addColorStop(0, '#00b4ff');
            strapGrad.addColorStop(0.5, '#2060ff');
            strapGrad.addColorStop(1, '#8040ff');
            ctx.strokeStyle = strapGrad;
            ctx.lineWidth = 3.5;
            ctx.lineCap = 'square';
            ctx.lineJoin = 'miter';
            ctx.stroke();

            const last = getLast();
            const prev = points[points.length - 2];
            const ropeAngle = (Math.atan2(last.y - prev.y, last.x - prev.x) - Math.PI / 2) * 0.25;
            drawCard(ctx, last.x, last.y, ropeAngle);

            ctx.beginPath();
            ctx.moveTo(last.x, last.y - 6);
            ctx.lineTo(last.x + 6, last.y);
            ctx.lineTo(last.x, last.y + 6);
            ctx.lineTo(last.x - 6, last.y);
            ctx.closePath();
            ctx.fillStyle = '#2060ff';
            ctx.fill();
            ctx.strokeStyle = 'rgba(0, 180, 255, 0.5)';
            ctx.lineWidth = 1;
            ctx.stroke();

            K.features.lanyardAnim = requestAnimationFrame(render);
        }

        K.features.lanyardAnim = requestAnimationFrame(render);
    }

    function stopLanyard() {
        const canvas = document.getElementById('lanyard-canvas');
        if (canvas) canvas.classList.remove('active');
        if (K.features.lanyardAnim) cancelAnimationFrame(K.features.lanyardAnim);
        if (K.features.lanyardResizeHandler) window.removeEventListener('resize', K.features.lanyardResizeHandler);
        if (canvas && K.features.lanyardHandlers) {
            const h = K.features.lanyardHandlers;
            canvas.removeEventListener('dblclick', h.onDblClick);
            canvas.removeEventListener('mousedown', h.onMouseDown);
            canvas.removeEventListener('mousemove', h.onMouseMove);
            canvas.removeEventListener('mouseup', h.onMouseUp);
            canvas.removeEventListener('touchstart', h.onTouchStart);
            canvas.removeEventListener('touchmove', h.onTouchMove);
            canvas.removeEventListener('touchend', h.onTouchEnd);
        }
        K.features.lanyardHandlers = null;
    }

    K.registerFeature('lanyard', { start: startLanyard, stop: stopLanyard, pausable: true });
})();


