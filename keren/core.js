(function () {
    'use strict';

    const K = window.Keren = window.Keren || {};
    if (K.__initialized) return;
    K.__initialized = true;

    K.state = {
        lanyard: false,
        sparkles: false,
        gravity: false,
        magnetic: false,
        sounds: false,
        trail: false,
        glitch: false,
        scanlines: false,
        gyro: false,
        audioReactive: false,
        dvd: false,
        vortex: false
    };

    K.features = K.features || {};
    K.registry = {};
    K.pausable = [];
    K.inits = [];

    K.registerInit = function (fn) {
        if (typeof fn === 'function') K.inits.push(fn);
    };

    K.init = function () {
        if (K.__started) return;
        K.__started = true;
        K.inits.forEach(fn => {
            try { fn(); } catch (e) { /* ignore */ }
        });
    };

    K.registerFeature = function (name, opts) {
        K.registry[name] = opts || {};
        if (opts && opts.pausable && !K.pausable.includes(name)) {
            K.pausable.push(name);
        }
    };

    K.toggleFeature = function (name, isOn) {
        K.state[name] = !!isOn;
        const reg = K.registry[name];
        if (!reg) return;
        if (isOn && reg.start) reg.start();
        if (!isOn && reg.stop) reg.stop();
    };

    K.setSharedAudio = function (audio) {
        K.sharedAudio = audio || null;
    };

    K.getSharedAudio = function () {
        return K.sharedAudio || null;
    };

    let audioCtx = null;
    K.getAudioCtx = function () {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        return audioCtx;
    };

    K.playSound = function (type) {
        if (!K.state.sounds) return;
        try {
            const ctx = K.getAudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
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
    };

    K.initSoundListeners = function () {
        document.querySelectorAll('.btn, .social-link, .nav-link').forEach(el => {
            el.addEventListener('mouseenter', () => { if (K.state.sounds) K.playSound('hover'); });
            el.addEventListener('click', () => { if (K.state.sounds) K.playSound('click'); });
        });
    };

    const visibilityPause = { active: false, features: {} };

    K.pauseForVisibility = function () {
        if (visibilityPause.active) return;
        visibilityPause.active = true;
        visibilityPause.features = {};
        K.pausable.forEach(name => {
            if (!K.state[name]) return;
            visibilityPause.features[name] = true;
            const reg = K.registry[name];
            if (reg && reg.stop) reg.stop();
        });
        if (K.media && typeof K.media.pause === 'function') {
            if (!K.media.audio || !K.media.audio.paused) K.media.pause();
        }
    };

    K.resumeFromVisibility = function () {
        if (!visibilityPause.active) return;
        const paused = visibilityPause.features || {};
        K.pausable.forEach(name => {
            if (!paused[name] || !K.state[name]) return;
            const reg = K.registry[name];
            if (reg && reg.start) reg.start();
        });
        visibilityPause.active = false;
        visibilityPause.features = {};
    };

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            K.pauseForVisibility();
        } else {
            K.resumeFromVisibility();
        }
    });
    window.addEventListener('blur', K.pauseForVisibility);
    window.addEventListener('pagehide', K.pauseForVisibility);
    window.addEventListener('focus', K.resumeFromVisibility);
})();


