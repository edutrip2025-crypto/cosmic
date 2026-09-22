// scroll-fx.js — Intersection Observer driven scroll animations + counter animation

// Fade-up reveal for any element with [data-reveal]
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('[data-reveal]').forEach(el => revealObserver.observe(el));

// Animated number counter
function animateCounter(el) {
  const target = parseFloat(el.dataset.target);
  const suffix = el.dataset.suffix || '';
  const prefix = el.dataset.prefix || '';
  const duration = 1800;
  const start = performance.now();
  const isDecimal = target % 1 !== 0;

  function tick(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = target * eased;
    el.textContent = prefix + (isDecimal ? value.toFixed(1) : Math.floor(value).toLocaleString()) + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('[data-counter]').forEach(el => counterObserver.observe(el));

// Staggered children reveal
const staggerObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const children = entry.target.querySelectorAll('[data-stagger-child]');
      children.forEach((child, i) => {
        setTimeout(() => child.classList.add('visible'), i * 120);
      });
      staggerObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });

document.querySelectorAll('[data-stagger]').forEach(el => staggerObserver.observe(el));

// Progress bar on journey page
const fill = document.querySelector('#journey-fill');
const journey = document.querySelector('#journey');
if (fill && journey) {
  window.addEventListener('scroll', () => {
    const bounds = journey.getBoundingClientRect();
    const total  = journey.offsetHeight - window.innerHeight;
    const progress = Math.max(0, Math.min(1, -bounds.top / Math.max(total, 1)));
    fill.style.width = (progress * 100) + '%';
  }, { passive: true });
}