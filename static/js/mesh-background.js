// static/js/mesh-background.js — MACE Connect v3.0 Drifting Dot Grid Background
document.addEventListener('DOMContentLoaded', () => {
  // Check for prefers-reduced-motion before initializing
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

  const points = [];
  const spacing = 60; // grid spacing in px
  const cols = Math.ceil(width / spacing) + 2;
  const rows = Math.ceil(height / spacing) + 2;

  // Initialize dot positions with small offsets
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      points.push({
        baseX: (c - 1) * spacing,
        baseY: (r - 1) * spacing,
        x: (c - 1) * spacing,
        y: (r - 1) * spacing,
        angle: Math.random() * Math.PI * 2,
        speed: 0.1 + Math.random() * 0.15, // speed < 0.3px per frame
        radius: Math.random() * 1.5 + 0.8,
        // Alternate colors between graphite and amber
        color: Math.random() > 0.85 ? 'rgba(232, 162, 61, 0.12)' : 'rgba(107, 113, 120, 0.08)'
      });
    }
  }

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);

  let angleOffset = 0;

  function animate() {
    ctx.clearRect(0, 0, width, height);
    angleOffset += 0.002;

    points.forEach(p => {
      // Slow flow-field/drift using sine and cosine waves
      const dx = Math.cos(p.angle + angleOffset) * p.speed * 8;
      const dy = Math.sin(p.angle + angleOffset) * p.speed * 8;

      p.x = p.baseX + dx;
      p.y = p.baseY + dy;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    });

    // Draw very subtle lines for close connections to build a network layout
    ctx.strokeStyle = 'rgba(107, 113, 120, 0.03)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < points.length; i += 2) {
      const p1 = points[i];
      // connect to neighbor in the array
      if (i + 1 < points.length) {
        const p2 = points[i + 1];
        const distSq = (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2;
        if (distSq < 8000) {
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
