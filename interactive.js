/* ==============================
   ⚡ INTERACTIVE FEATURES MODULE
   P3R Style — Lazy-loaded
   All features are OFF by default.
   ============================== */

(function () {
    'use strict';

    // ——— State Manager ———
    const state = {
        lanyard: false,
        sparkles: false,
        gravity: false,
        magnetic: false,
        sounds: false,
        trail: false,
        glitch: false,
        scanlines: false,
    };

    const features = {};

    // Preload images for lanyard
    let profileImg = null;
    let backImg = null;
    function preloadImg(src) {
        return new Promise(resolve => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = src;
        });
    }
    preloadImg('assets/profile.png').then(img => { profileImg = img; });
    preloadImg('assets/bglanyard.png').then(img => { backImg = img; });

    // ——— Phone UI Logic ———
    function initTogglePanel() {
        const trigger = document.getElementById('phone-trigger');
        const frame = document.getElementById('phone-frame');
        const backdrop = document.getElementById('phone-backdrop');
        const tiles = document.querySelectorAll('.phone-toggle-tile');

        if (!trigger || !frame) return;

        // Phone sounds
        const phoneOpenSound = new Audio('assets/Audio/deck_ui_side_menu_fly_in.wav');
        const phoneCloseSound = new Audio('assets/Audio/deck_ui_side_menu_fly_out.wav');
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

        // Update phone clock
        function updatePhoneClock() {
            const el = document.getElementById('phone-time');
            if (!el) return;
            const now = new Date();
            el.textContent = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
        }
        setInterval(updatePhoneClock, 30000);
        updatePhoneClock();

        // ---- Toggle tiles ----
        tiles.forEach(tile => {
            const feature = tile.dataset.feature;
            const input = tile.querySelector('.toggle-input');

            // Restore from localStorage
            const saved = localStorage.getItem('interactive_' + feature);
            if (saved === 'true') {
                if (input) input.checked = true;
                tile.classList.add('active');
                toggleFeature(feature, true);
            }

            tile.addEventListener('click', (e) => {
                e.stopPropagation();
                const isNowActive = !tile.classList.contains('active');
                tile.classList.toggle('active');
                if (input) input.checked = isNowActive;
                localStorage.setItem('interactive_' + feature, isNowActive);
                toggleFeature(feature, isNowActive);
                if (state.sounds) playSound(isNowActive ? 'on' : 'off');
            });
        });

        // ---- Media Player ----
        initMediaPlayer();
    }

    // ——— Media Player ———
    function initMediaPlayer() {
        const titleEl = document.getElementById('media-title');
        const artistEl = document.getElementById('media-artist');
        const thumbEl = document.getElementById('media-thumb');
        const progressEl = document.getElementById('media-progress');
        const currentTimeEl = document.getElementById('media-current-time');
        const durationEl = document.getElementById('media-duration');
        const playBtn = document.getElementById('media-play');
        const prevBtn = document.getElementById('media-prev');
        const nextBtn = document.getElementById('media-next');
        const shuffleBtn = document.getElementById('media-shuffle');
        const repeatBtn = document.getElementById('media-repeat');
        const playIcon = document.getElementById('play-icon');
        const pauseIcon = document.getElementById('pause-icon');
        const artWrap = document.querySelector('.media-widget-art');

        if (!playBtn) return;

        let songs = [];
        let currentIndex = 0;
        let audio = new Audio();
        let isPlaying = false;
        let progressRAF = null;
        let shuffleOn = false;
        let repeatOn = false;

        // Load songlist.json
        fetch('songlist.json')
            .then(r => r.json())
            .then(list => {
                songs = list;
                if (songs.length > 0) loadSong(0);
            })
            .catch(() => {
                if (titleEl) titleEl.textContent = 'No Songs Found';
            });

        function setMarquee(el, text, separator) {
            if (!el) return;
            el.textContent = text;
            el.classList.remove('marquee');

            // Check if text overflows
            requestAnimationFrame(() => {
                if (el.scrollWidth > el.clientWidth) {
                    el.classList.add('marquee');
                    const sep = separator || '     •     ';
                    el.innerHTML = '<span class="marquee-inner">' + text + sep + text + sep + '</span>';
                }
            });
        }

        function loadSong(index) {
            if (songs.length === 0) return;
            currentIndex = index;
            const song = songs[currentIndex];

            audio.src = 'assets/Audio/' + song.file;
            setMarquee(titleEl, song.title || 'Unknown', '     ♪     ');
            setMarquee(artistEl, song.artist || 'Unknown Artist', '     •     ');

            // Try to load thumbnail
            const thumbPath = 'assets/thumbs/' + (song.thumb || ('thumbs' + (currentIndex + 1) + '.png'));
            const testImg = new Image();
            testImg.onload = () => { if (thumbEl) thumbEl.src = thumbPath; };
            testImg.onerror = () => { if (thumbEl) thumbEl.src = 'assets/thumbs/default.png'; };
            testImg.src = thumbPath;

            // Reset progress
            if (progressEl) { progressEl.value = 0; progressEl.style.setProperty('--progress', '0%'); }
            if (currentTimeEl) currentTimeEl.textContent = '0:00';
            if (durationEl) durationEl.textContent = '0:00';
        }

        function playSong() {
            if (songs.length === 0) return;
            audio.play().then(() => {
                isPlaying = true;
                if (playIcon) playIcon.style.display = 'none';
                if (pauseIcon) pauseIcon.style.display = 'inline';
                if (artWrap) artWrap.classList.add('spinning');
                updateProgress();
            }).catch(() => {});
        }

        function pauseSong() {
            audio.pause();
            isPlaying = false;
            if (playIcon) playIcon.style.display = 'inline';
            if (pauseIcon) pauseIcon.style.display = 'none';
            if (artWrap) artWrap.classList.remove('spinning');
            cancelAnimationFrame(progressRAF);
        }

        function formatTime(sec) {
            if (isNaN(sec)) return '0:00';
            const m = Math.floor(sec / 60);
            const s = Math.floor(sec % 60);
            return m + ':' + s.toString().padStart(2, '0');
        }

        function updateProgress() {
            if (!audio.duration) {
                progressRAF = requestAnimationFrame(updateProgress);
                return;
            }
            const pct = (audio.currentTime / audio.duration) * 100;
            if (progressEl) {
                progressEl.value = pct;
                progressEl.style.setProperty('--progress', pct + '%');
            }
            if (currentTimeEl) currentTimeEl.textContent = formatTime(audio.currentTime);
            if (durationEl) durationEl.textContent = formatTime(audio.duration);
            if (isPlaying) progressRAF = requestAnimationFrame(updateProgress);
        }

        function getNextIndex() {
            if (shuffleOn && songs.length > 1) {
                let rand;
                do { rand = Math.floor(Math.random() * songs.length); } while (rand === currentIndex);
                return rand;
            }
            return (currentIndex + 1) % songs.length;
        }

        function getPrevIndex() {
            if (shuffleOn && songs.length > 1) {
                let rand;
                do { rand = Math.floor(Math.random() * songs.length); } while (rand === currentIndex);
                return rand;
            }
            return (currentIndex - 1 + songs.length) % songs.length;
        }

        // Events
        playBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            isPlaying ? pauseSong() : playSong();
        });

        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (songs.length === 0) return;
            const wasPlaying = isPlaying;
            pauseSong();
            loadSong(getPrevIndex());
            if (wasPlaying) setTimeout(playSong, 100);
        });

        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (songs.length === 0) return;
            const wasPlaying = isPlaying;
            pauseSong();
            loadSong(getNextIndex());
            if (wasPlaying) setTimeout(playSong, 100);
        });

        // Shuffle toggle
        if (shuffleBtn) {
            shuffleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                shuffleOn = !shuffleOn;
                shuffleBtn.classList.toggle('shuffle-active', shuffleOn);
            });
        }

        // Repeat toggle
        if (repeatBtn) {
            repeatBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                repeatOn = !repeatOn;
                repeatBtn.classList.toggle('shuffle-active', repeatOn);
            });
        }

        // Seeking
        progressEl.addEventListener('input', (e) => {
            e.stopPropagation();
            if (audio.duration) {
                audio.currentTime = (progressEl.value / 100) * audio.duration;
                progressEl.style.setProperty('--progress', progressEl.value + '%');
            }
        });

        // Auto-next on song end
        audio.addEventListener('ended', () => {
            if (repeatOn) {
                audio.currentTime = 0;
                playSong();
            } else if (songs.length > 1) {
                loadSong(getNextIndex());
                setTimeout(playSong, 100);
            } else {
                pauseSong();
                audio.currentTime = 0;
                if (progressEl) { progressEl.value = 0; progressEl.style.setProperty('--progress', '0%'); }
                if (currentTimeEl) currentTimeEl.textContent = '0:00';
            }
        });
    }

    function toggleFeature(name, isOn) {
        state[name] = isOn;
        switch (name) {
            case 'lanyard': isOn ? startLanyard() : stopLanyard(); break;
            case 'sparkles': isOn ? startSparkles() : stopSparkles(); break;
            case 'gravity': isOn ? startGravity() : stopGravity(); break;
            case 'magnetic': isOn ? startMagnetic() : stopMagnetic(); break;
            case 'trail': isOn ? startTrail() : stopTrail(); break;
            case 'glitch': isOn ? startGlitch() : stopGlitch(); break;
            case 'scanlines': isOn ? startScanlines() : stopScanlines(); break;
            case 'sounds': break;
        }
    }

    // =============================================
    //  🎫 PHYSICS LANYARD — 3D FLIP CARD
    //  Front: P3R ID Card | Back: bglanyard.png
    //  Double-click to flip with 3D rotation
    // =============================================
    function startLanyard() {
        const canvas = document.getElementById('lanyard-canvas');
        if (!canvas) return;
        canvas.classList.add('active');
        const ctx = canvas.getContext('2d');

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resize();
        const resizeHandler = () => resize();
        window.addEventListener('resize', resizeHandler);
        features.lanyardResizeHandler = resizeHandler;

        // Rope
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

        // Card dimensions
        const cardW = 170;
        const cardH = 238;

        // Flip sound
        const flipSound = new Audio('assets/Audio/deck_ui_lanyardflip.wav');
        flipSound.volume = 0.5;

        // 3D Flip State
        let flipAngle = 0;          // 0 = front, PI = back
        let flipTarget = 0;         // target angle
        let isFlipping = false;
        let showingBack = false;

        // Drag
        let dragging = false;
        let dragOff = null;

        function getLast() { return points[points.length - 1]; }

        function isOnCard(mx, my) {
            const last = getLast();
            return Math.abs(mx - last.x) < cardW / 2 + 30 && Math.abs(my - last.y - cardH / 2 + 10) < cardH / 2 + 30;
        }

        // Double-click to flip
        canvas.addEventListener('dblclick', e => {
            if (isOnCard(e.clientX, e.clientY) && !isFlipping) {
                isFlipping = true;
                showingBack = !showingBack;
                flipTarget = showingBack ? Math.PI : 0;
                flipSound.currentTime = 0;
                flipSound.play().catch(() => {});
            }
        });

        canvas.addEventListener('mousedown', e => {
            if (isOnCard(e.clientX, e.clientY)) {
                dragging = true;
                const last = getLast();
                dragOff = { x: e.clientX - last.x, y: e.clientY - last.y };
            }
        });
        canvas.addEventListener('mousemove', e => {
            if (dragging && dragOff) {
                const last = getLast();
                last.x = e.clientX - dragOff.x;
                last.y = e.clientY - dragOff.y;
            }
            canvas.style.cursor = isOnCard(e.clientX, e.clientY) ? 'grab' : 'default';
        });
        canvas.addEventListener('mouseup', () => { dragging = false; dragOff = null; });

        // Touch
        let lastTap = 0;
        canvas.addEventListener('touchstart', e => {
            const t = e.touches[0];
            if (isOnCard(t.clientX, t.clientY)) {
                // Double-tap detection
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
        }, { passive: false });
        canvas.addEventListener('touchmove', e => {
            if (dragging && dragOff) {
                const t = e.touches[0];
                const last = getLast();
                last.x = t.clientX - dragOff.x;
                last.y = t.clientY - dragOff.y;
                e.preventDefault();
            }
        }, { passive: false });
        canvas.addEventListener('touchend', () => { dragging = false; dragOff = null; });

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

        // Update flip animation
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

        // Cached QR pattern
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

        // Draw FRONT face (ID card)
        function drawFrontFace(ctx, bx, by) {
            // Card background (rectangle)
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

            // Top accent
            ctx.beginPath();
            ctx.moveTo(bx, by);
            ctx.lineTo(bx + cardW, by);
            const topGrad = ctx.createLinearGradient(bx, by, bx + cardW, by);
            topGrad.addColorStop(0, '#00b4ff');
            topGrad.addColorStop(1, '#2060ff');
            ctx.strokeStyle = topGrad;
            ctx.lineWidth = 3;
            ctx.stroke();

            // Header
            ctx.fillStyle = 'rgba(0, 180, 255, 0.4)';
            ctx.font = '700 8px "Space Grotesk", sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText('IDENTIFICATION CARD', bx + 14, by + 12);

            // Corner accents
            ctx.strokeStyle = 'rgba(0, 180, 255, 0.25)';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(bx + 4, by + 4); ctx.lineTo(bx + 4, by + 14); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(bx + cardW - 4, by + 4); ctx.lineTo(bx + cardW - 4, by + 14); ctx.stroke();

            // Profile photo
            const photoSize = 64;
            const photoCut = 10;
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

            // Photo border
            ctx.beginPath();
            ctx.rect(photoX, photoY, photoSize, photoSize);
            ctx.strokeStyle = 'rgba(0, 180, 255, 0.4)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Name & Role
            ctx.textAlign = 'center'; ctx.textBaseline = 'top';
            ctx.fillStyle = '#e4eaf8';
            ctx.font = '700 17px "Space Grotesk", sans-serif';
            ctx.fillText('SAPTA', cx, photoY + photoSize + 14);
            ctx.fillStyle = '#00b4ff';
            ctx.font = '700 10px "Inter", sans-serif';
            ctx.fillText('WEB DEVELOPER', cx, photoY + photoSize + 36);

            // Divider + diamond
            const divY = photoY + photoSize + 54;
            ctx.beginPath();
            ctx.moveTo(bx + 16, divY); ctx.lineTo(cx - 10, divY);
            ctx.moveTo(cx + 10, divY); ctx.lineTo(bx + cardW - 16, divY);
            ctx.strokeStyle = 'rgba(0, 180, 255, 0.15)'; ctx.lineWidth = 1; ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx, divY - 4); ctx.lineTo(cx + 5, divY); ctx.lineTo(cx, divY + 4); ctx.lineTo(cx - 5, divY); ctx.closePath();
            ctx.fillStyle = 'rgba(0, 180, 255, 0.3)'; ctx.fill();

            // Info
            const infoY = divY + 16;
            ctx.textAlign = 'left'; ctx.font = '700 8px "Inter", sans-serif';
            ctx.fillStyle = 'rgba(0, 180, 255, 0.4)';
            ctx.fillText('STATUS', bx + 16, infoY);
            ctx.fillStyle = '#10b981'; ctx.font = '700 10px "Inter", sans-serif';
            ctx.fillText('● ACTIVE', bx + 16, infoY + 12);
            ctx.fillStyle = 'rgba(0, 180, 255, 0.4)'; ctx.font = '700 8px "Inter", sans-serif';
            ctx.fillText('CLASS', bx + cardW / 2, infoY);
            ctx.fillStyle = '#e4eaf8'; ctx.font = '700 10px "Inter", sans-serif';
            ctx.fillText('DEVELOPER', bx + cardW / 2, infoY + 12);

            // QR
            const qrX = bx + cardW / 2 - 14;
            const qrY = infoY + 36;
            const qrSz = 28, cs = qrSz / 8;
            ctx.fillStyle = 'rgba(0, 180, 255, 0.5)';
            for (const p of getQRPattern()) ctx.fillRect(qrX + p.c * cs, qrY + p.r * cs, cs - 0.5, cs - 0.5);
            ctx.strokeStyle = 'rgba(0, 180, 255, 0.15)'; ctx.lineWidth = 0.5;
            ctx.strokeRect(qrX - 2, qrY - 2, qrSz + 4, qrSz + 4);

            // Serial
            ctx.fillStyle = 'rgba(0, 180, 255, 0.25)';
            ctx.font = '600 7px "Inter", monospace'; ctx.textAlign = 'center';
            ctx.fillText('P3R-2026-SAPTA', cx, by + cardH - 10);

            // Bottom accent
            ctx.beginPath(); ctx.moveTo(bx, by + cardH); ctx.lineTo(bx + cardW, by + cardH);
            const botGrad = ctx.createLinearGradient(bx, 0, bx + cardW, 0);
            botGrad.addColorStop(0, '#ff2050'); botGrad.addColorStop(1, '#ffcc00');
            ctx.strokeStyle = botGrad; ctx.lineWidth = 2; ctx.stroke();
        }

        // Draw BACK face (bglanyard.png)
        function drawBackFace(ctx, bx, by) {
            // Card background shape (rectangle)
            ctx.beginPath();
            ctx.rect(bx, by, cardW, cardH);

            // Clip and draw bg image
            ctx.save();
            ctx.clip();

            if (backImg) {
                // Fill the card area with bglanyard.png, maintaining cover
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
                // Fallback: dark card with "?" symbol
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

            // Border on top of image
            ctx.beginPath();
            ctx.rect(bx, by, cardW, cardH);
            ctx.strokeStyle = 'rgba(100, 130, 180, 0.4)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Top accent bar
            ctx.beginPath();
            ctx.moveTo(bx, by); ctx.lineTo(bx + cardW, by);
            const topGrad = ctx.createLinearGradient(bx, by, bx + cardW, by);
            topGrad.addColorStop(0, 'rgba(100, 130, 180, 0.6)');
            topGrad.addColorStop(1, 'rgba(60, 80, 140, 0.6)');
            ctx.strokeStyle = topGrad; ctx.lineWidth = 3; ctx.stroke();

            // Bottom accent
            ctx.beginPath(); ctx.moveTo(bx, by + cardH); ctx.lineTo(bx + cardW, by + cardH);
            ctx.strokeStyle = 'rgba(100, 130, 180, 0.4)'; ctx.lineWidth = 2; ctx.stroke();
        }

        // Draw card with 3D flip perspective
        function drawCard(ctx, x, y, ropeAngle) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(ropeAngle);

            updateFlip();

            // 3D perspective: scaleX based on cos(flipAngle)
            const scaleX = Math.cos(flipAngle);
            const absScale = Math.abs(scaleX);

            // Determine which face is visible
            const isFront = scaleX >= 0;

            // Shadow (always)
            ctx.shadowColor = 'rgba(0, 180, 255, 0.12)';
            ctx.shadowBlur = 30;
            ctx.shadowOffsetY = 10;

            // Apply horizontal scale for 3D effect
            ctx.scale(absScale, 1);

            ctx.shadowColor = 'transparent';

            const bx = -cardW / 2;
            const by = 0;

            if (isFront) {
                drawFrontFace(ctx, bx, by);
            } else {
                // Mirror horizontally for back face (like flipping a real card)
                ctx.scale(-1, 1);
                drawBackFace(ctx, bx, by);
            }

            // "Double-click to flip" hint when not flipping
            if (!isFlipping && absScale > 0.95) {
                ctx.scale(isFront ? 1 : -1, 1); // undo mirror for text
                ctx.fillStyle = 'rgba(0, 180, 255, 0.2)';
                ctx.font = '600 7px "Inter", sans-serif';
                ctx.textAlign = 'center'; ctx.textBaseline = 'top';
                ctx.fillText('DOUBLE-CLICK TO FLIP', 0, by + cardH + 8);
            }

            ctx.restore();
        }

        function render() {
            if (!state.lanyard) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            simulate();

            // Strap
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

            // Card with 3D flip
            const last = getLast();
            const prev = points[points.length - 2];
            const ropeAngle = (Math.atan2(last.y - prev.y, last.x - prev.x) - Math.PI / 2) * 0.25;
            drawCard(ctx, last.x, last.y, ropeAngle);

            // Clip holder diamond
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

            features.lanyardAnim = requestAnimationFrame(render);
        }

        features.lanyardAnim = requestAnimationFrame(render);
    }

    function stopLanyard() {
        const canvas = document.getElementById('lanyard-canvas');
        if (canvas) canvas.classList.remove('active');
        if (features.lanyardAnim) cancelAnimationFrame(features.lanyardAnim);
        if (features.lanyardResizeHandler) window.removeEventListener('resize', features.lanyardResizeHandler);
    }

    // =============================================
    //  ✨ CURSOR SPARKLE TRAIL
    // =============================================
    function startSparkles() {
        const canvas = document.getElementById('sparkle-canvas');
        if (!canvas) return;
        canvas.classList.add('active');
        const ctx = canvas.getContext('2d');

        function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
        resize();
        window.addEventListener('resize', resize);
        features.sparkleResize = resize;

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
        features.sparkleMouseHandler = onMove;

        function render() {
            if (!state.sparkles) return;
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

                // P3R diamond sparkle
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
            features.sparkleAnim = requestAnimationFrame(render);
        }
        features.sparkleAnim = requestAnimationFrame(render);
    }

    function stopSparkles() {
        const canvas = document.getElementById('sparkle-canvas');
        if (canvas) canvas.classList.remove('active');
        if (features.sparkleAnim) cancelAnimationFrame(features.sparkleAnim);
        if (features.sparkleMouseHandler) document.removeEventListener('mousemove', features.sparkleMouseHandler);
    }

    // =============================================
    //  🎱 GRAVITY BALL PLAYGROUND
    // =============================================
    function startGravity() {
        const canvas = document.getElementById('gravity-canvas');
        if (!canvas) return;
        canvas.classList.add('active');
        const ctx = canvas.getContext('2d');

        function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
        resize();
        window.addEventListener('resize', resize);
        features.gravityResize = resize;

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
            if (state.sounds) playSound('pop');
        }
        canvas.addEventListener('click', onClick);
        features.gravityClickHandler = onClick;

        function render() {
            if (!state.gravity) return;
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

                // Collision
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

                // Draw — P3R angular balls (hexagons)
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

                // Inner diamond highlight
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
            features.gravityAnim = requestAnimationFrame(render);
        }
        features.gravityAnim = requestAnimationFrame(render);
    }

    function stopGravity() {
        const canvas = document.getElementById('gravity-canvas');
        if (canvas) { canvas.classList.remove('active'); canvas.removeEventListener('click', features.gravityClickHandler); }
        if (features.gravityAnim) cancelAnimationFrame(features.gravityAnim);
    }

    // =============================================
    //  🧲 MAGNETIC HOVER EFFECT
    // =============================================
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
        features.magneticHandler = onMove;
        features.magneticTargets = targets;
    }

    function stopMagnetic() {
        if (features.magneticHandler) document.removeEventListener('mousemove', features.magneticHandler);
        if (features.magneticTargets) features.magneticTargets.forEach(el => { el.style.transform = ''; el.classList.remove('magnetic-active'); });
    }

    // =============================================
    //  💫 CURSOR TRAIL
    // =============================================
    let trailCanvas = null, trailCtx = null, trailRAF = null;
    const trailDots = [];

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
                trailCtx.fillStyle = `rgba(0, 180, 255, ${d.life * 0.6})`;
                trailCtx.fill();
                // glow
                trailCtx.beginPath();
                trailCtx.arc(d.x, d.y, d.size * 2, 0, Math.PI * 2);
                trailCtx.fillStyle = `rgba(0, 180, 255, ${d.life * 0.15})`;
                trailCtx.fill();
            }
            trailRAF = requestAnimationFrame(animate);
        }
        animate();
    }

    function trailMouseHandler(e) {
        trailDots.push({ x: e.clientX, y: e.clientY, size: 4 + Math.random() * 3, life: 1 });
        if (trailDots.length > 50) trailDots.shift();
    }

    function stopTrail() {
        document.removeEventListener('mousemove', trailMouseHandler);
        cancelAnimationFrame(trailRAF);
        if (trailCanvas) { trailCanvas.remove(); trailCanvas = null; trailCtx = null; }
        trailDots.length = 0;
    }

    // =============================================
    //  📺 GLITCH FX (CSS glitch on headings)
    // =============================================
    let glitchStyle = null;

    function startGlitch() {
        if (glitchStyle) return;
        glitchStyle = document.createElement('style');
        glitchStyle.id = 'glitch-fx-style';
        glitchStyle.textContent = `
            .section-title, .hero-name {
                position: relative;
                animation: glitch-skew 4s infinite linear alternate-reverse;
            }
            .section-title::before, .hero-name::before,
            .section-title::after, .hero-name::after {
                content: attr(data-text);
                position: absolute;
                top: 0; left: 0;
                width: 100%; height: 100%;
                pointer-events: none;
            }
            .section-title::before, .hero-name::before {
                color: #0ff;
                animation: glitch-clip 3s infinite linear alternate-reverse;
                clip-path: inset(20% 0 50% 0);
                transform: translateX(-2px);
            }
            .section-title::after, .hero-name::after {
                color: #f0f;
                animation: glitch-clip2 2.5s infinite linear alternate-reverse;
                clip-path: inset(60% 0 10% 0);
                transform: translateX(2px);
            }
            @keyframes glitch-skew {
                0% { transform: skew(0deg); }
                20% { transform: skew(0deg); }
                21% { transform: skew(2deg); }
                22% { transform: skew(0deg); }
                50% { transform: skew(0deg); }
                51% { transform: skew(-1deg); }
                52% { transform: skew(0deg); }
                100% { transform: skew(0deg); }
            }
            @keyframes glitch-clip {
                0% { clip-path: inset(40% 0 30% 0); }
                20% { clip-path: inset(10% 0 70% 0); }
                40% { clip-path: inset(80% 0 5% 0); }
                60% { clip-path: inset(20% 0 60% 0); }
                80% { clip-path: inset(60% 0 20% 0); }
                100% { clip-path: inset(30% 0 40% 0); }
            }
            @keyframes glitch-clip2 {
                0% { clip-path: inset(70% 0 10% 0); }
                25% { clip-path: inset(5% 0 80% 0); }
                50% { clip-path: inset(50% 0 30% 0); }
                75% { clip-path: inset(15% 0 65% 0); }
                100% { clip-path: inset(85% 0 5% 0); }
            }
        `;
        document.head.appendChild(glitchStyle);

        // Set data-text attribute for pseudo-elements
        document.querySelectorAll('.section-title, .hero-name').forEach(el => {
            el.setAttribute('data-text', el.textContent);
        });
    }

    function stopGlitch() {
        if (glitchStyle) { glitchStyle.remove(); glitchStyle = null; }
    }

    // =============================================
    //  📡 SCANLINES (CRT retro overlay)
    // =============================================
    let scanlineOverlay = null;

    function startScanlines() {
        if (scanlineOverlay) return;
        scanlineOverlay = document.createElement('div');
        scanlineOverlay.id = 'scanline-overlay';
        scanlineOverlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            z-index: 9997; pointer-events: none;
            background: repeating-linear-gradient(
                0deg,
                rgba(0, 0, 0, 0.06) 0px,
                rgba(0, 0, 0, 0.06) 1px,
                transparent 1px,
                transparent 3px
            );
            animation: scanline-flicker 0.1s infinite;
        `;
        // Add flicker keyframe
        const style = document.createElement('style');
        style.id = 'scanline-keyframes';
        style.textContent = `
            @keyframes scanline-flicker {
                0% { opacity: 0.8; }
                50% { opacity: 0.9; }
                100% { opacity: 0.8; }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(scanlineOverlay);
    }

    function stopScanlines() {
        if (scanlineOverlay) { scanlineOverlay.remove(); scanlineOverlay = null; }
        const kf = document.getElementById('scanline-keyframes');
        if (kf) kf.remove();
    }

    // =============================================
    //  🔊 UI SOUND EFFECTS (Web Audio API)
    // =============================================
    let audioCtx = null;
    function getAudioCtx() {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        return audioCtx;
    }

    function playSound(type) {
        if (!state.sounds) return;
        try {
            const ctx = getAudioCtx();
            const osc = ctx.createOscillator(), gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.type = 'sine';
            const t = ctx.currentTime;
            switch (type) {
                case 'click':
                    osc.frequency.setValueAtTime(800, t);
                    osc.frequency.exponentialRampToValueAtTime(400, t + 0.08);
                    gain.gain.setValueAtTime(0.08, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
                    osc.start(t); osc.stop(t + 0.08); break;
                case 'on':
                    osc.frequency.setValueAtTime(500, t);
                    osc.frequency.exponentialRampToValueAtTime(1000, t + 0.12);
                    gain.gain.setValueAtTime(0.06, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
                    osc.start(t); osc.stop(t + 0.12); break;
                case 'off':
                    osc.frequency.setValueAtTime(800, t);
                    osc.frequency.exponentialRampToValueAtTime(300, t + 0.12);
                    gain.gain.setValueAtTime(0.06, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
                    osc.start(t); osc.stop(t + 0.12); break;
                case 'pop':
                    osc.frequency.setValueAtTime(600, t);
                    osc.frequency.exponentialRampToValueAtTime(200, t + 0.06);
                    gain.gain.setValueAtTime(0.05, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
                    osc.start(t); osc.stop(t + 0.06); break;
                case 'hover':
                    osc.frequency.setValueAtTime(1200, t);
                    gain.gain.setValueAtTime(0.02, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
                    osc.start(t); osc.stop(t + 0.04); break;
            }
        } catch (e) { /* Audio not available */ }
    }

    function initSoundListeners() {
        document.querySelectorAll('.btn, .social-link, .nav-link').forEach(el => {
            el.addEventListener('mouseenter', () => { if (state.sounds) playSound('hover'); });
            el.addEventListener('click', () => { if (state.sounds) playSound('click'); });
        });
    }

    // ——— Init (works even if DOMContentLoaded already fired) ———
    function init() {
        initTogglePanel();
        initSoundListeners();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

