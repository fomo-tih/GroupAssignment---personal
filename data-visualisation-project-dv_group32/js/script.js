
document.addEventListener("DOMContentLoaded", function() {
    
    // --- 1. Active Nav Link Highlighter ---
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        if (currentPath.endsWith(linkHref)) {
            link.classList.add('active');
        }
    });


    // --- 2. Hero Title Animation ---
    const heroTitle = document.getElementById('hero-title');

    if (heroTitle) {
        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (entry.isIntersecting) {
                    heroTitle.classList.add('is-visible');
                    observer.unobserve(heroTitle); // Animate only once
                }
            },
            {
                threshold: 0.1 // Trigger when 10% of the element is visible
            }
        );
        observer.observe(heroTitle);
    }
});