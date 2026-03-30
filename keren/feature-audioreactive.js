(function () {
    'use strict';

    const K = window.Keren;
    if (!K) return;

    let audioVizRAF = null;
    let audioAnalyser = null;
    let audioData = null;

    function connectAudioAnalyser() {
        const sharedAudio = K.getSharedAudio();
        if (!sharedAudio) return null;
        const ctx = K.getAudioCtx();
        if (!K.features.audioSource) {
            try {
                K.features.audioSource = ctx.createMediaElementSource(sharedAudio);
                audioAnalyser = ctx.createAnalyser();
                audioAnalyser.fftSize = 256;
                K.features.audioSource.connect(audioAnalyser);
                audioAnalyser.connect(ctx.destination);
                audioData = new Uint8Array(audioAnalyser.frequencyBinCount);
            } catch (e) { return null; }
        }
        if (!audioAnalyser) {
            audioAnalyser = ctx.createAnalyser();
            audioAnalyser.fftSize = 256;
            K.features.audioSource.connect(audioAnalyser);
            audioAnalyser.connect(ctx.destination);
            audioData = new Uint8Array(audioAnalyser.frequencyBinCount);
        }
        return audioAnalyser;
    }

    function startAudioReactive() {
        const canvas = document.getElementById('audio-reactive-canvas');
        if (!canvas) return;
        canvas.classList.add('active');
        const ctx = canvas.getContext('2d');

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resize();
        K.features.audioResize = resize;
        window.addEventListener('resize', resize);

        const analyser = connectAudioAnalyser();
        const draw = () => {
            audioVizRAF = requestAnimationFrame(draw);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (!analyser || !audioData) return;
            analyser.getByteFrequencyData(audioData);

            const centerX = canvas.width * 0.5;
            const centerY = canvas.height * 0.55;
            const radius = Math.min(canvas.width, canvas.height) * 0.12;
            const bars = 48;
            const step = Math.floor(audioData.length / bars);

            ctx.save();
            ctx.translate(centerX, centerY);
            for (let i = 0; i < bars; i++) {
                const v = audioData[i * step] / 255;
                const barLen = radius + v * radius * 1.4;
                const angle = (i / bars) * Math.PI * 2;
                const x1 = Math.cos(angle) * radius;
                const y1 = Math.sin(angle) * radius;
                const x2 = Math.cos(angle) * barLen;
                const y2 = Math.sin(angle) * barLen;
                const grad = ctx.createLinearGradient(x1, y1, x2, y2);
                grad.addColorStop(0, 'rgba(0,180,255,0.2)');
                grad.addColorStop(1, 'rgba(0,180,255,0.85)');
                ctx.strokeStyle = grad;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
            ctx.restore();
        };

        K.getAudioCtx().resume().catch(() => {});
        draw();
    }

    function stopAudioReactive() {
        const canvas = document.getElementById('audio-reactive-canvas');
        if (canvas) canvas.classList.remove('active');
        if (audioVizRAF) cancelAnimationFrame(audioVizRAF);
        audioVizRAF = null;
        if (K.features.audioResize) window.removeEventListener('resize', K.features.audioResize);
    }

    K.registerFeature('audioReactive', { start: startAudioReactive, stop: stopAudioReactive, pausable: true });
})();


