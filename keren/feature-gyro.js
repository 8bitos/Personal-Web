(function () {
    'use strict';

    const K = window.Keren;
    if (!K) return;

    let gyroHandler = null;
    let gyroActive = false;

    function startGyro() {
        if (gyroActive) return;
        const enable = () => {
            gyroActive = true;
            document.body.classList.add('gyro-enabled');
            gyroHandler = (e) => {
                const gamma = Math.max(-30, Math.min(30, e.gamma || 0));
                const beta = Math.max(-30, Math.min(30, e.beta || 0));
                const x = (gamma / 30) * 8;
                const y = (beta / 30) * 8;
                const hero = document.querySelector('.hero');
                const phonePanel = document.getElementById('phone-panel');
                const particleCanvas = document.getElementById('particle-canvas');
                if (hero) hero.style.transform = `translate3d(${x}px, ${y}px, 0)`;
                if (phonePanel) phonePanel.style.transform = `translate3d(${x * 1.4}px, ${y * 1.4}px, 0)`;
                if (particleCanvas) particleCanvas.style.transform = `translate3d(${x * -0.6}px, ${y * -0.6}px, 0)`;
            };
            window.addEventListener('deviceorientation', gyroHandler, true);
        };

        if (typeof DeviceOrientationEvent !== 'undefined' &&
            typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission()
                .then(res => { if (res === 'granted') enable(); })
                .catch(() => {});
        } else {
            enable();
        }
    }

    function stopGyro() {
        gyroActive = false;
        document.body.classList.remove('gyro-enabled');
        if (gyroHandler) window.removeEventListener('deviceorientation', gyroHandler, true);
        gyroHandler = null;
        const hero = document.querySelector('.hero');
        const phonePanel = document.getElementById('phone-panel');
        const particleCanvas = document.getElementById('particle-canvas');
        if (hero) hero.style.transform = '';
        if (phonePanel) phonePanel.style.transform = '';
        if (particleCanvas) particleCanvas.style.transform = '';
    }

    K.registerFeature('gyro', { start: startGyro, stop: stopGyro, pausable: true });
})();


