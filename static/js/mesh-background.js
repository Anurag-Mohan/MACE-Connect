/* mesh-background.js — Subtle professional mesh grid */
(function () {
  const canvas = document.createElement('canvas');
  canvas.id = 'mesh-bg';
  Object.assign(canvas.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    zIndex: '-1',
    pointerEvents: 'none',
    opacity: '1'
  });
  document.body.prepend(canvas);

  const ctx = canvas.getContext('2d');
  let W, H, nodes = [], mouse = { x: -999, y: -999 };

  const SETTINGS = {
    nodeCount: 55,
    maxDist: 160,
    nodeSpeed: 0.15,
    nodeRadius: 1.5,
    lineWidth: 0.5,
    lineColor: [217, 119, 6],     /* #D97706 */
    nodeColor: [217, 119, 6],
    lineOpacity: 0.06,
    nodeOpacity: 0.12,
    mouseRadius: 200,
    mouseInfluence: 0.08
  };

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function createNodes() {
    nodes = [];
    for (let i = 0; i < SETTINGS.nodeCount; i++) {
      nodes.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * SETTINGS.nodeSpeed,
        vy: (Math.random() - 0.5) * SETTINGS.nodeSpeed
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Update positions
    for (const n of nodes) {
      // Mouse interaction
      const mdx = mouse.x - n.x;
      const mdy = mouse.y - n.y;
      const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
      if (mDist < SETTINGS.mouseRadius) {
        n.vx -= mdx * SETTINGS.mouseInfluence * 0.001;
        n.vy -= mdy * SETTINGS.mouseInfluence * 0.001;
      }

      n.x += n.vx;
      n.y += n.vy;

      // Dampen
      n.vx *= 0.999;
      n.vy *= 0.999;

      // Soft boundary
      if (n.x < 0 || n.x > W) n.vx *= -1;
      if (n.y < 0 || n.y > H) n.vy *= -1;
      n.x = Math.max(0, Math.min(W, n.x));
      n.y = Math.max(0, Math.min(H, n.y));
    }

    // Draw connections
    const [lr, lg, lb] = SETTINGS.lineColor;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < SETTINGS.maxDist) {
          const alpha = SETTINGS.lineOpacity * (1 - dist / SETTINGS.maxDist);
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = `rgba(${lr},${lg},${lb},${alpha})`;
          ctx.lineWidth = SETTINGS.lineWidth;
          ctx.stroke();
        }
      }
    }

    // Draw nodes
    const [nr, ng, nb] = SETTINGS.nodeColor;
    for (const n of nodes) {
      ctx.beginPath();
      ctx.arc(n.x, n.y, SETTINGS.nodeRadius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${nr},${ng},${nb},${SETTINGS.nodeOpacity})`;
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => { resize(); createNodes(); });
  window.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });

  resize();
  createNodes();
  draw();
})();
