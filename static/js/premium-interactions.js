// static/js/premium-interactions.js — MACE-Connect v5.0 Premium Interactions Engine
document.addEventListener('DOMContentLoaded', () => {
  // Respect reduced motion
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  // ═══════════════════════════════════════════
  // 1. CURSOR GLOW TRACKER
  // ═══════════════════════════════════════════
  const cursorGlow = document.createElement('div');
  cursorGlow.className = 'cursor-glow';
  document.body.appendChild(cursorGlow);

  let mouseX = 0, mouseY = 0;
  let glowX = 0, glowY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursorGlow.classList.add('visible');
  });

  document.addEventListener('mouseleave', () => {
    cursorGlow.classList.remove('visible');
  });

  function animateGlow() {
    glowX += (mouseX - glowX) * 0.08;
    glowY += (mouseY - glowY) * 0.08;
    cursorGlow.style.left = glowX + 'px';
    cursorGlow.style.top = glowY + 'px';
    requestAnimationFrame(animateGlow);
  }
  animateGlow();

  // ═══════════════════════════════════════════
  // 2. ENHANCED SCROLL REVEAL (supports all variants)
  // ═══════════════════════════════════════════
  const revealSelectors = '.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right, .scroll-reveal-scale';
  const scrollElements = document.querySelectorAll(revealSelectors);

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  scrollElements.forEach(el => revealObserver.observe(el));

  // ═══════════════════════════════════════════
  // 3. SMOOTH SCROLL FOR ANCHOR LINKS
  // ═══════════════════════════════════════════
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ═══════════════════════════════════════════
  // 4. RIPPLE EFFECT ON BUTTONS
  // ═══════════════════════════════════════════
  document.querySelectorAll('.ripple-effect').forEach(el => {
    el.addEventListener('click', function(e) {
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });

  // ═══════════════════════════════════════════
  // 5. TYPEWRITER EFFECT
  // ═══════════════════════════════════════════
  window.typewriterEffect = function(element, text, speed = 50) {
    return new Promise(resolve => {
      element.textContent = '';
      let i = 0;
      const cursor = document.createElement('span');
      cursor.className = 'typewriter-cursor';
      element.appendChild(cursor);

      function type() {
        if (i < text.length) {
          element.insertBefore(document.createTextNode(text.charAt(i)), cursor);
          i++;
          setTimeout(type, speed);
        } else {
          // Keep cursor blinking for a moment, then remove
          setTimeout(() => cursor.remove(), 2000);
          resolve();
        }
      }
      type();
    });
  };

  // ═══════════════════════════════════════════
  // 6. LIGHTWEIGHT PARALLAX
  // ═══════════════════════════════════════════
  const parallaxElements = document.querySelectorAll('[data-parallax]');
  if (parallaxElements.length > 0) {
    window.addEventListener('scroll', () => {
      const scrollY = window.pageYOffset;
      parallaxElements.forEach(el => {
        const speed = parseFloat(el.dataset.parallax) || 0.1;
        const rect = el.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const offset = (center - window.innerHeight / 2) * speed;
        el.style.transform = `translateY(${offset}px)`;
      });
    }, { passive: true });
  }

  // ═══════════════════════════════════════════
  // 7. PAGE ENTRANCE ANIMATION
  // ═══════════════════════════════════════════
  document.body.classList.add('page-load-anim');

  // ═══════════════════════════════════════════
  // 8. NAVBAR SCROLL EFFECT (enhance existing)
  // ═══════════════════════════════════════════
  const navbar = document.querySelector('.glass-navbar');
  if (navbar) {
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
      const currentScroll = window.pageYOffset;
      if (currentScroll > 100) {
        navbar.style.boxShadow = '0 15px 40px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.6)';
        navbar.style.background = 'rgba(255, 255, 255, 0.85)';
      } else {
        navbar.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.6)';
        navbar.style.background = 'rgba(255, 255, 255, 0.7)';
      }
      lastScroll = currentScroll;
    }, { passive: true });
  }
});
