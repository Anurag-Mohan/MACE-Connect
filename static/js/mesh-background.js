// static/js/mesh-background.js — MACE Connect v2.0 Enhanced Particle Network
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.createElement('canvas');
  canvas.id = 'meshCanvas';
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.zIndex = '0';
  canvas.style.pointerEvents = 'none';
  document.body.prepend(canvas);

  const ctx = canvas.getContext('2d');
  let animationFrameId;
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  const particles = [];
  // Slightly reduced particle count for performance
  const particleCount = Math.min(80, Math.floor((width * height) / 18000));
  const connectionDistance = 130;
  const speedScale = 0.3;

  // Color palette — warm tones
  const colors = [
    'rgba(217, 119, 6, 0.35)',   // Orange
    'rgba(245, 158, 11, 0.3)',   // Gold
    'rgba(139, 92, 246, 0.2)',   // Purple (subtle)
    'rgba(20, 184, 166, 0.2)',   // Teal (subtle)
    'rgba(236, 72, 153, 0.15)',  // Pink (very subtle)
  ];

  class Particle {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * speedScale;
      this.vy = (Math.random() - 0.5) * speedScale;
      this.radius = Math.random() * 2 + 1.2;
      this.color = colors[Math.floor(Math.random() * colors.length)];
      this.baseRadius = this.radius;
      this.phase = Math.random() * Math.PI * 2;
    }

    update(time) {
      this.x += this.vx;
      this.y += this.vy;

      // Gentle pulsing radius
      this.radius = this.baseRadius + Math.sin(time * 0.002 + this.phase) * 0.4;

      // Smooth bounce from screen borders
      if (this.x < 0 || this.x > width) this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;

      // Keep within bounds
      this.x = Math.max(0, Math.min(width, this.x));
      this.y = Math.max(0, Math.min(height, this.y));
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
    }
  }

  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);

  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < connectionDistance) {
          const alpha = (1 - dist / connectionDistance) * 0.12;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(217, 119, 6, ${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }
  }

  let startTime = Date.now();

  function animate() {
    const time = Date.now() - startTime;
    ctx.clearRect(0, 0, width, height);

    particles.forEach(p => {
      p.update(time);
      p.draw();
    });

    drawConnections();
    animationFrameId = requestAnimationFrame(animate);
  }

  animate();
});
