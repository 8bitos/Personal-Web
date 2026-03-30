(function () {
    'use strict';

    const K = window.Keren;
    if (!K) return;

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

    K.registerFeature('scanlines', { start: startScanlines, stop: stopScanlines, pausable: true });
})();


