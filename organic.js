(function () {
  var canvas = document.querySelector('canvas.organic');
  if (!canvas || !canvas.getContext) return;
  var host = canvas.parentElement;
  var ctx = canvas.getContext('2d');
  var root = document.documentElement;
  var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  var w = 0, h = 0, raf = 0, visible = true;
  var pointer = { x: 0.5, y: 0.5, active: false };
  var smooth = { x: 0.5, y: 0.5 };

  var blobs = [
    { x: 0.2,  y: 0.62, r: 0.3,  c: '201,207,240', a: 0.95, ph: 0.0, sp: 0.00032, follow: 0.55 },
    { x: 0.82, y: 0.3,  r: 0.2,  c: '242,196,166', a: 0.95, ph: 1.7, sp: 0.00041, follow: 0.8 },
    { x: 0.6,  y: 0.86, r: 0.16, c: '244,213,214', a: 0.95, ph: 3.1, sp: 0.00027, follow: 0.25 },
    { x: 0.1,  y: 0.12, r: 0.07, c: '211,78,81',   a: 0.9,  ph: 4.4, sp: 0.00036, follow: 0.4 },
    { x: 0.9,  y: 0.8,  r: 0.1,  c: '83,93,155',   a: 0.85, ph: 5.2, sp: 0.00030, follow: 0.6 }
  ];

  function size() {
    w = host.clientWidth;
    h = host.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function shape(cx, cy, r, t, ph, boost) {
    var n = 72;
    ctx.beginPath();
    for (var i = 0; i <= n; i++) {
      var a = (i / n) * Math.PI * 2;
      var k = 1 + 0.12 * Math.sin(3 * a + t + ph) + 0.07 * Math.sin(5 * a - t * 1.3 + ph) + boost * 0.12 * Math.sin(2 * a + t * 2);
      var x = cx + Math.cos(a) * r * k;
      var y = cy + Math.sin(a) * r * k;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  function draw(now) {
    var base = Math.min(w, h);
    smooth.x += (pointer.x - smooth.x) * 0.045;
    smooth.y += (pointer.y - smooth.y) * 0.045;
    ctx.clearRect(0, 0, w, h);
    blobs.forEach(function (b) {
      var t = now * b.sp * 6;
      var drift = Math.sin(t + b.ph);
      var bx = b.x * w + Math.sin(t * 0.9 + b.ph) * w * 0.04;
      var by = b.y * h + Math.cos(t * 0.7 + b.ph) * h * 0.05;
      if (pointer.active) {
        bx += (smooth.x * w - bx) * b.follow * 0.5;
        by += (smooth.y * h - by) * b.follow * 0.5;
      }
      var dx = smooth.x * w - bx, dy = smooth.y * h - by;
      var near = pointer.active ? Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / (base * 0.5)) : 0;
      var r = base * b.r * (1 + near * 0.28 + drift * 0.03);
      shape(bx, by, r, t, b.ph, near);
      ctx.fillStyle = 'rgba(' + b.c + ',' + (b.a + near * 0.1) + ')';
      ctx.fill();
    });
  }

  function loop(now) {
    draw(now);
    raf = requestAnimationFrame(loop);
  }

  function start() { if (!raf && visible && !document.hidden && root.dataset.motion !== 'reduced') raf = requestAnimationFrame(loop); }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }
  function sync() {
    if (root.dataset.motion === 'reduced') { stop(); size(); draw(1200); }
    else start();
  }

  host.addEventListener('pointermove', function (e) {
    var r = host.getBoundingClientRect();
    pointer.x = (e.clientX - r.left) / r.width;
    pointer.y = (e.clientY - r.top) / r.height;
    pointer.active = true;
  });
  host.addEventListener('pointerleave', function () { pointer.active = false; });

  window.addEventListener('resize', function () { size(); if (!raf) draw(1200); });
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else sync(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) sync(); else stop();
    }).observe(host);
  }
  if ('MutationObserver' in window) {
    new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['data-motion'] });
  }

  size();
  draw(1200);
  sync();
})();
