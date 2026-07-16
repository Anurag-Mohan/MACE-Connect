// static/js/mesh-background.js — MACE Connect v5.0 Interactive Star Grid Background
document.addEventListener('DOMContentLoaded', () => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    console.log('Mesh background disabled due to prefers-reduced-motion preference.');
    return;
  }

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
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  // Mouse tracking
  let mouseX = -1000;
  let mouseY = -1000;
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });
  document.addEventListener('mouseleave', () => {
    mouseX = -1000;
    mouseY = -1000;
  });

  const points = [];
  const spacing = 55;
  const cols = Math.ceil(width / spacing) + 2;
  const rows = Math.ceil(height / spacing) + 2;
  const REPEL_RADIUS = 150;
  const REPEL_STRENGTH = 25;

  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      points.push({
        baseX: (c - 1) * spacing,
        baseY: (r - 1) * spacing,
        x: (c - 1) * spacing,
        y: (r - 1) * spacing,
        angle: Math.random() * Math.PI * 2,
        speed: 0.1 + Math.random() * 0.15,
        radius: Math.random() * 1.5 + 0.8,
        baseRadius: Math.random() * 1.5 + 0.8,
        isAmber: Math.random() > 0.85,
        baseColor: Math.random() > 0.85 ? 'rgba(232, 162, 61, 0.12)' : 'rgba(107, 113, 120, 0.08)',
        currentAlpha: 1,
        twinkleTimer: Math.random() * 600,
        twinkleActive: false
      });
    }
  }

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);

  let angleOffset = 0;
  let frame = 0;

  function animate() {
    ctx.clearRect(0, 0, width, height);
    angleOffset += 0.002;
    frame++;

    points.forEach(p => {
      // Base drift
      const dx = Math.cos(p.angle + angleOffset) * p.speed * 8;
      const dy = Math.sin(p.angle + angleOffset) * p.speed * 8;

      let targetX = p.baseX + dx;
      let targetY = p.baseY + dy;

      // Mouse repulsion
      const distToMouse = Math.sqrt((targetX - mouseX) ** 2 + (targetY - mouseY) ** 2);
      if (distToMouse < REPEL_RADIUS && distToMouse > 0) {
        const force = (1 - distToMouse / REPEL_RADIUS) * REPEL_STRENGTH;
        const repelAngle = Math.atan2(targetY - mouseY, targetX - mouseX);
        targetX += Math.cos(repelAngle) * force;
        targetY += Math.sin(repelAngle) * force;
      }

      // Smooth interpolation
      p.x += (targetX - p.x) * 0.1;
      p.y += (targetY - p.y) * 0.1;

      // Twinkle effect
      p.twinkleTimer--;
      if (p.twinkleTimer <= 0) {
        p.twinkleActive = true;
        p.twinkleTimer = 300 + Math.random() * 800;
      }

      let dotColor = p.baseColor;
      let dotRadius = p.baseRadius;

      if (p.twinkleActive) {
        dotColor = 'rgba(245, 158, 11, 0.55)';
        dotRadius = p.baseRadius * 2;
        p.twinkleActive = false;
      }

      // Proximity glow near mouse
      if (distToMouse < REPEL_RADIUS) {
        const proximity = 1 - distToMouse / REPEL_RADIUS;
        const glowAlpha = 0.15 + proximity * 0.35;
        dotColor = `rgba(245, 158, 11, ${glowAlpha.toFixed(2)})`;
        dotRadius = p.baseRadius * (1 + proximity * 0.8);
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, dotRadius, 0, Math.PI * 2);
      ctx.fillStyle = dotColor;
      ctx.fill();
    });

    // Draw connections
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      for (let j = i + 1; j < points.length; j++) {
        const p2 = points[j];
        const distSq = (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2;
        if (distSq < 5500) {
          // Check if near mouse for amber tint
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;
          const distToMouseSq = (midX - mouseX) ** 2 + (midY - mouseY) ** 2;

          if (distToMouseSq < REPEL_RADIUS * REPEL_RADIUS) {
            const proximity = 1 - Math.sqrt(distToMouseSq) / REPEL_RADIUS;
            ctx.strokeStyle = `rgba(245, 158, 11, ${(0.04 + proximity * 0.12).toFixed(2)})`;
            ctx.lineWidth = 0.5 + proximity * 0.5;
          } else {
            ctx.strokeStyle = 'rgba(107, 113, 120, 0.04)';
            ctx.lineWidth = 0.5;
          }
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(animate);
  }

  animate();
});
