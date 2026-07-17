// static/js/premium-interactions.js — MACE-Connect v6.0 Futuristic Interactions
document.addEventListener('DOMContentLoaded', () => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  // ═══════════════════════════════════════════
  // 1. CURSOR GLOW
  // ═══════════════════════════════════════════
  const glow = document.createElement('div');
  glow.className = 'cursor-glow';
  document.body.appendChild(glow);
  let mx = 0, my = 0, gx = 0, gy = 0;
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; glow.classList.add('visible'); });
  document.addEventListener('mouseleave', () => glow.classList.remove('visible'));
  (function animGlow() {
    gx += (mx - gx) * 0.07;
    gy += (my - gy) * 0.07;
    glow.style.left = gx + 'px';
    glow.style.top = gy + 'px';
    requestAnimationFrame(animGlow);
  })();

  // ═══════════════════════════════════════════
  // 2. SCROLL REVEAL (IntersectionObserver)
  // ═══════════════════════════════════════════
  const revealEls = document.querySelectorAll('.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right, .scroll-reveal-scale');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('revealed'); obs.unobserve(e.target); } });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
  revealEls.forEach(el => obs.observe(el));

  // ═══════════════════════════════════════════
  // 3. SMOOTH ANCHOR SCROLL
  // ═══════════════════════════════════════════
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function(e) {
      const t = document.querySelector(this.getAttribute('href'));
      if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  });

  // ═══════════════════════════════════════════
  // 4. NAVBAR SCROLL EFFECT
  // ═══════════════════════════════════════════
  const nav = document.querySelector('.glass-navbar');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 80);
    }, { passive: true });
  }

  // ═══════════════════════════════════════════
  // 5. TYPEWRITER
  // ═══════════════════════════════════════════
  window.typewriterEffect = function(el, text, speed = 45) {
    return new Promise(resolve => {
      el.textContent = '';
      let i = 0;
      const cursor = document.createElement('span');
      cursor.style.cssText = 'display:inline-block;width:3px;height:1em;background:var(--color-coral);margin-left:4px;animation:blink-cursor 0.7s step-end infinite;vertical-align:text-bottom;';
      el.appendChild(cursor);
      const style = document.createElement('style');
      style.textContent = '@keyframes blink-cursor{0%,100%{opacity:1}50%{opacity:0}}';
      document.head.appendChild(style);
      (function type() {
        if (i < text.length) { el.insertBefore(document.createTextNode(text.charAt(i)), cursor); i++; setTimeout(type, speed); }
        else { setTimeout(() => cursor.remove(), 2500); resolve(); }
      })();
    });
  };

  // ═══════════════════════════════════════════
  // 6. PARALLAX
  // ═══════════════════════════════════════════
  const parallaxEls = document.querySelectorAll('[data-parallax]');
  if (parallaxEls.length) {
    window.addEventListener('scroll', () => {
      parallaxEls.forEach(el => {
        const s = parseFloat(el.dataset.parallax) || 0.1;
        const r = el.getBoundingClientRect();
        el.style.transform = `translateY(${(r.top + r.height / 2 - window.innerHeight / 2) * s}px)`;
      });
    }, { passive: true });
  }

  // ═══════════════════════════════════════════
  // 7. PAGE ENTRANCE
  // ═══════════════════════════════════════════
  document.body.classList.add('page-load-anim');
});
