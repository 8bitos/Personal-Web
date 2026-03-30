(function () {
    'use strict';

    const K = window.Keren;
    if (!K || typeof K.init !== 'function') return;

    function start() {
        K.init();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();


