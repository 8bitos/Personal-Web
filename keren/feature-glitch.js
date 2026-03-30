(function () {
    'use strict';

    const K = window.Keren;
    if (!K) return;

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

        document.querySelectorAll('.section-title, .hero-name').forEach(el => {
            el.setAttribute('data-text', el.textContent);
        });
    }

    function stopGlitch() {
        if (glitchStyle) { glitchStyle.remove(); glitchStyle = null; }
    }

    K.registerFeature('glitch', { start: startGlitch, stop: stopGlitch, pausable: true });
})();


