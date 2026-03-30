/* Interactive feature loader (refactored into ./keren modules) */
(function () {
    'use strict';

    const scripts = [
        'keren/core.js',
        'keren/feature-lanyard.js',
        'keren/feature-sparkles.js',
        'keren/feature-gravity.js',
        'keren/feature-magnetic.js',
        'keren/feature-trail.js',
        'keren/feature-glitch.js',
        'keren/feature-scanlines.js',
        'keren/feature-gyro.js',
        'keren/feature-audioreactive.js',
        'keren/feature-cloth.js',
        'keren/feature-dvd.js',
        'keren/feature-vortex.js',
        'keren/media-player.js',
        'keren/ui-panel.js',
        'keren/boot.js'
    ];

    function loadNext(i) {
        if (i >= scripts.length) return;
        const s = document.createElement('script');
        s.src = scripts[i];
        s.onload = () => loadNext(i + 1);
        document.body.appendChild(s);
    }

    loadNext(0);
})();
