document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('.site-header');

    const handleScroll = () => {
        if (!header) return;
        header.classList.toggle('scrolled', window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    const revealElements = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const delay = parseInt(entry.target.dataset.delay || '0', 10);
                    setTimeout(() => {
                        entry.target.classList.add('visible');
                    }, delay);
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });

        revealElements.forEach(el => observer.observe(el));
    } else {
        revealElements.forEach(el => el.classList.add('visible'));
    }

    if (typeof particlesJS === 'function') {
        particlesJS('particles-js', {
            particles: {
                number: { value: 70, density: { enable: true, value_area: 900 } },
                color: { value: '#9cb4ff' },
                shape: { type: 'circle' },
                opacity: { value: 0.5 },
                size: { value: 3, random: true },
                line_linked: {
                    enable: true,
                    distance: 150,
                    color: '#ffb703',
                    opacity: 0.35,
                    width: 1
                },
                move: {
                    enable: true,
                    speed: 1.6,
                    direction: 'none',
                    out_mode: 'out'
                }
            },
            interactivity: {
                detect_on: 'canvas',
                events: {
                    onhover: { enable: true, mode: 'grab' },
                    onclick: { enable: false },
                    resize: true
                },
                modes: {
                    grab: { distance: 140, line_linked: { opacity: 0.8 } }
                }
            },
            retina_detect: true
        });
    }
});
