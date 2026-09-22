(() => {
  const logo = document.querySelector('.home-wordmark');
  const intro = document.querySelector('.brand-intro');
  if (!logo || !intro) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let pending = false;
  function render() {
    pending = false;
    const mobile = innerWidth < 650;
    const startWidth = Math.min(innerWidth * .78, 850);
    const endWidth = mobile ? 76 : 104;
    const ratio = logo.firstElementChild.naturalHeight / logo.firstElementChild.naturalWidth || .25;
    const raw = Math.max(0, Math.min(1, scrollY / (intro.offsetHeight * .72)));
    const p = reduced.matches ? (raw > .12 ? 1 : 0) : raw * raw * (3 - 2 * raw);
    const startX = (innerWidth - startWidth) / 2;
    const startY = Math.min(intro.offsetHeight * .21, 210);
    const endX = innerWidth * (mobile ? .05 : .045);
    const endY = ((mobile ? 72 : 84) - endWidth * ratio) / 2;
    logo.style.width = startWidth + 'px';
    logo.style.transform = 'translate3d(' + (startX + (endX - startX) * p) + 'px,' + (startY + (endY - startY) * p) + 'px,0) scale(' + (1 + (endWidth / startWidth - 1) * p) + ')';
    document.body.classList.toggle('journey-entered', scrollY >= intro.offsetHeight - (mobile ? 72 : 84));
    document.body.classList.toggle('logo-docked', raw >= 1);
  }
  function schedule() { if (!pending) { pending = true; requestAnimationFrame(render); } }
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule, { passive: true });
  logo.firstElementChild.addEventListener('load', schedule);
  reduced.addEventListener('change', schedule);
  render();
})();
