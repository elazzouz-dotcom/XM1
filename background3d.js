/* خلفية MX1 ثلاثية الأبعاد — شبكة نقاط دوارة بمنظور */
(function () {
  const canvas = document.createElement('canvas');
  canvas.id = 'bg3d';
  canvas.style.cssText = 'position:fixed;inset:0;z-index:-1;pointer-events:none;width:100%;height:100%;display:block';
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');

  let W, H, cx, cy, dpr;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.width = innerWidth * dpr;
    H = canvas.height = innerHeight * dpr;
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
    cx = W / 2;
    cy = H / 2;
  }
  resize();
  addEventListener('resize', resize);

  // بناء شبكة نقاط على مستوى ثلاثي الأبعاد
  const gridSize = 6;
  const spacing = 90;
  const points = [];
  for (let x = -gridSize; x <= gridSize; x++) {
    for (let z = -gridSize; z <= gridSize; z++) {
      points.push({ x: x * spacing, y: 0, z: z * spacing });
    }
  }

  // موجات تتحرك صعودًا وهبوطًا
  let angleY = 0, angleX = 0.42, t = 0;
  let mouseX = 0, mouseY = 0;
  addEventListener('mousemove', e => {
    mouseX = (e.clientX / innerWidth - 0.5) * 0.6;
    mouseY = (e.clientY / innerHeight - 0.5) * 0.4;
  });

  const fov = 600;
  const dist = 700;

  function project(p) {
    // تدوير حول Y
    const cosY = Math.cos(angleY), sinY = Math.sin(angleY);
    const cosX = Math.cos(angleX), sinX = Math.sin(angleX);
    let x = p.x * cosY - p.z * sinY;
    let z = p.x * sinY + p.z * cosY;
    let y = p.y;
    // تدوير حول X
    const y2 = y * cosX - z * sinX;
    const z2 = y * sinX + z * cosX;
    // إسقاط منظوري
    const scale = fov / (fov + z2 + dist);
    return {
      sx: cx + x * scale * dpr,
      sy: cy + y2 * scale * dpr,
      scale: scale,
      depth: z2 + dist
    };
  }

  function draw() {
    t += 0.012;
    angleY += 0.0035 + mouseX * 0.01;
    angleX = 0.42 + Math.sin(t * 0.3) * 0.12 + mouseY * 0.3;

    // خلفية متدرجة
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.7);
    grad.addColorStop(0, '#0d1220');
    grad.addColorStop(0.5, '#0b0f19');
    grad.addColorStop(1, '#070a12');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // تحديث ارتفاعات النقاط بالموجة
    const projected = points.map((p, i) => {
      const row = Math.floor(i / (gridSize * 2 + 1));
      const col = i % (gridSize * 2 + 1);
      const wave = Math.sin(t * 1.4 + row * 0.5 + col * 0.5) * 45 +
                   Math.cos(t * 0.8 + (col - row) * 0.4) * 25;
      const pp = project({ x: p.x, y: wave, z: p.z });
      return { ...pp, row, col };
    });

    // رسم خطوط الشبكة
    ctx.lineWidth = 1 * dpr;
    for (let i = 0; i < projected.length; i++) {
      const p = projected[i];
      // خط أفقي (نفس الصف)
      if (p.col < gridSize * 2) {
        const next = projected[i + 1];
        const alpha = Math.min(p.scale, next.scale) * 0.35;
        ctx.strokeStyle = `rgba(243,128,32,${alpha})`;
        ctx.beginPath();
        ctx.moveTo(p.sx, p.sy);
        ctx.lineTo(next.sx, next.sy);
        ctx.stroke();
      }
      // خط عمودي (نفس العمود)
      if (p.row < gridSize * 2) {
        const next = projected[i + gridSize * 2 + 1];
        const alpha = Math.min(p.scale, next.scale) * 0.35;
        ctx.strokeStyle = `rgba(56,189,248,${alpha})`;
        ctx.beginPath();
        ctx.moveTo(p.sx, p.sy);
        ctx.lineTo(next.sx, next.sy);
        ctx.stroke();
      }
    }

    // رسم النقاط
    for (const p of projected) {
      const r = Math.max(0.8, p.scale * 3.5) * dpr;
      const alpha = p.scale * 0.85;
      ctx.fillStyle = `rgba(243,128,32,${alpha})`;
      ctx.beginPath();
      ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2);
      ctx.fill();
      // توهج خفيف للنقاط القريبة
      if (p.scale > 0.55) {
        ctx.fillStyle = `rgba(251,146,60,${alpha * 0.15})`;
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, r * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    requestAnimationFrame(draw);
  }

  draw();
})();
