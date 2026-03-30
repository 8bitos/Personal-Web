(function () {
    'use strict';

    const K = window.Keren;
    if (!K) return;

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
        const audio = new Audio();
        audio.preload = 'metadata';
        K.setSharedAudio(audio);
        let isPlaying = false;
        let progressRAF = null;
        let shuffleOn = false;
        let repeatOn = false;
        let resumeOnInteraction = false;

        K.media = {
            pause: pauseSong,
            isPlaying: () => isPlaying,
            audio
        };

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
            requestAnimationFrame(() => {
                if (el.scrollWidth > el.clientWidth) {
                    el.classList.add('marquee');
                    const sep = separator || '     *     ';
                    el.innerHTML = '<span class="marquee-inner">' + text + sep + text + sep + '</span>';
                }
            });
        }

        function loadSong(index) {
            if (songs.length === 0) return;
            currentIndex = index;
            const song = songs[currentIndex];

            audio.src = 'assets/Audio/' + song.file;
            setMarquee(titleEl, song.title || 'Unknown', '     *     ');
            setMarquee(artistEl, song.artist || 'Unknown Artist', '     *     ');

            const thumbPath = 'assets/thumbs/' + (song.thumb || ('thumbs' + (currentIndex + 1) + '.png'));
            const testImg = new Image();
            testImg.onload = () => { if (thumbEl) thumbEl.src = thumbPath; };
            testImg.onerror = () => { if (thumbEl) thumbEl.src = 'assets/thumbs/default.png'; };
            testImg.src = thumbPath;

            if (progressEl) { progressEl.value = 0; progressEl.style.setProperty('--progress', '0%'); }
            if (currentTimeEl) currentTimeEl.textContent = '0:00';
            if (durationEl) durationEl.textContent = '0:00';
        }

        function playSong(mode) {
            if (songs.length === 0) return;
            if (document.hidden || document.visibilityState !== 'visible') return;
            audio.play().then(() => {
                isPlaying = true;
                if (playIcon) playIcon.style.display = 'none';
                if (pauseIcon) pauseIcon.style.display = 'inline';
                if (artWrap) artWrap.classList.add('spinning');
                updateProgress();
                resumeOnInteraction = false;
            }).catch(() => {
                if (mode === 'resume') resumeOnInteraction = true;
            });
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

        playBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            isPlaying ? pauseSong() : playSong('user');
        });

        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (songs.length === 0) return;
            const wasPlaying = isPlaying;
            pauseSong();
            loadSong(getPrevIndex());
            if (wasPlaying) setTimeout(() => playSong('user'), 100);
        });

        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (songs.length === 0) return;
            const wasPlaying = isPlaying;
            pauseSong();
            loadSong(getNextIndex());
            if (wasPlaying) setTimeout(() => playSong('user'), 100);
        });

        if (shuffleBtn) {
            shuffleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                shuffleOn = !shuffleOn;
                shuffleBtn.classList.toggle('shuffle-active', shuffleOn);
            });
        }

        if (repeatBtn) {
            repeatBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                repeatOn = !repeatOn;
                repeatBtn.classList.toggle('shuffle-active', repeatOn);
            });
        }

        if (progressEl) {
            progressEl.addEventListener('input', (e) => {
                e.stopPropagation();
                if (audio.duration) {
                    audio.currentTime = (progressEl.value / 100) * audio.duration;
                    progressEl.style.setProperty('--progress', progressEl.value + '%');
                }
            });
        }

        audio.addEventListener('ended', () => {
            if (repeatOn) {
                audio.currentTime = 0;
                playSong('user');
            } else if (songs.length > 1) {
                loadSong(getNextIndex());
                setTimeout(() => playSong('user'), 100);
            } else {
                pauseSong();
                audio.currentTime = 0;
                if (progressEl) { progressEl.value = 0; progressEl.style.setProperty('--progress', '0%'); }
                if (currentTimeEl) currentTimeEl.textContent = '0:00';
            }
        });

        let wasPlayingBeforeHide = false;
        const enforceBackgroundPause = () => {
            if (document.hidden || document.visibilityState !== 'visible') {
                wasPlayingBeforeHide = isPlaying;
                pauseSong();
            }
        };

        const resumeIfNeeded = () => {
            if (document.hidden || document.visibilityState !== 'visible') return;
            if (wasPlayingBeforeHide) {
                wasPlayingBeforeHide = false;
                playSong('resume');
            }
        };

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                enforceBackgroundPause();
            } else {
                resumeIfNeeded();
            }
        });
        window.addEventListener('blur', enforceBackgroundPause);
        window.addEventListener('focus', resumeIfNeeded);
        window.addEventListener('pagehide', enforceBackgroundPause);

        function tryResumeFromInteraction() {
            if (!resumeOnInteraction) return;
            resumeOnInteraction = false;
            playSong('user');
        }
        document.addEventListener('click', tryResumeFromInteraction, { passive: true });
        document.addEventListener('keydown', tryResumeFromInteraction);
        document.addEventListener('touchstart', tryResumeFromInteraction, { passive: true });
    }

    K.mediaPlayer = { init: initMediaPlayer };
})();


