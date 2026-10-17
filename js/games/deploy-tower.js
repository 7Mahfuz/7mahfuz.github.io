/**
 * Deploy Tower — a one-tap isometric stacking game. A block slides over the
 * tower; drop it, and whatever overhangs is trimmed off and falls away.
 */
(function () {
  'use strict';

  var BASE = 100;        // footprint of the first block, in world units
  var LAYER = 18;        // block height
  var PEDESTAL = 520;    // depth of the plinth under the first block
  var TOLERANCE = 3.5;   // how close counts as a perfect drop
  var RANGE = 150;       // how far a block slides either side of centre
  var ISO_X = Math.cos(Math.PI / 6);
  var ISO_Y = Math.sin(Math.PI / 6);

  var api, stage, canvas, ctx, overlay, scoreEl;
  var W = 0, H = 0, baseZoom = 1;
  var state = 'idle';    // idle | playing | paused | over
  var layers = [], moving = null, debris = [], ripples = [];
  var combo = 0, perfects = 0, flashText = '', flashUntil = 0;
  var camY = 0, camTarget = 0, zoom = 1, zoomTarget = 1;
  var raf = 0, last = 0;
  var colors = {};

  /* ---------------------------------------------------------------------
     Colours (from theme tokens in css/games.css)
     --------------------------------------------------------------------- */
  function readColors() {
    colors.skyTop = api.css('--tower-sky-top');
    colors.skyBottom = api.css('--tower-sky-bottom');
    colors.sat = parseFloat(api.css('--tower-sat')) || 30;
    colors.light = parseFloat(api.css('--tower-light')) || 62;
    colors.hue = parseFloat(api.css('--tower-hue')) || 152;
    colors.range = parseFloat(api.css('--tower-hue-range')) || 0;
    colors.milestone = parseFloat(api.css('--tower-milestone-hue')) || 354;
    colors.ink = api.css('--ink');
    colors.muted = api.css('--muted');
    colors.red = api.css('--red');
  }

  // Block hues drift gently around the theme's base hue (greens and teals in
  // light/dark, clays and sands in Claude); every tenth release stands out.
  function face(i, delta) {
    var hue = colors.hue + colors.range * Math.sin(i * 0.23);
    var sat = colors.sat;
    if (i > 0 && i % 10 === 0) {
      hue = colors.milestone;
      sat = colors.sat + 26;
    }
    var l = Math.max(8, Math.min(92, colors.light + delta));
    return 'hsl(' + hue.toFixed(1) + ', ' + sat + '%, ' + l + '%)';
  }

  /* ---------------------------------------------------------------------
     Projection and drawing
     --------------------------------------------------------------------- */
  function proj(x, y, z) {
    return [
      W / 2 + (x - z) * ISO_X * zoom,
      H * 0.6 + (x + z) * ISO_Y * zoom - (y - camY) * zoom
    ];
  }

  function poly(points, fill) {
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (var i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  }

  function drawBox(b, alpha) {
    var x0 = b.x - b.w / 2, x1 = b.x + b.w / 2;
    var z0 = b.z - b.d / 2, z1 = b.z + b.d / 2;
    var y0 = b.y, y1 = b.y + b.h;
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    poly([proj(x1, y1, z0), proj(x1, y1, z1), proj(x1, y0, z1), proj(x1, y0, z0)], face(b.i, -2));
    poly([proj(x0, y1, z1), proj(x1, y1, z1), proj(x1, y0, z1), proj(x0, y0, z1)], face(b.i, -12));
    poly([proj(x0, y1, z0), proj(x1, y1, z0), proj(x1, y1, z1), proj(x0, y1, z1)], face(b.i, 10));
    ctx.globalAlpha = 1;
  }

  function drawRipple(r, now) {
    var k = (now - r.t0) / 650;
    if (k >= 1) return false;
    var grow = 1 + k * 0.35;
    var b = r.box;
    var hw = (b.w / 2) * grow, hd = (b.d / 2) * grow, y = b.y + b.h;
    ctx.globalAlpha = 1 - k;
    ctx.strokeStyle = colors.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    var pts = [proj(b.x - hw, y, b.z - hd), proj(b.x + hw, y, b.z - hd), proj(b.x + hw, y, b.z + hd), proj(b.x - hw, y, b.z + hd)];
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < 4; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.globalAlpha = 1;
    return true;
  }

  function draw(now) {
    var sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, colors.skyTop);
    sky.addColorStop(1, colors.skyBottom);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Debris that fell off the back edges belongs behind the tower.
    debris.forEach(function (d) { if (d.back) drawBox(d.box, d.alpha); });
    var from = Math.max(0, layers.length - 46);
    for (var i = from; i < layers.length; i++) drawBox(layers[i]);
    debris.forEach(function (d) { if (!d.back) drawBox(d.box, d.alpha); });
    ripples = ripples.filter(function (r) { return drawRipple(r, now); });
    if (moving && state !== 'over') drawBox(moving);

    // Height counter
    var height = Math.max(0, layers.length - 1);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = colors.ink;
    ctx.globalAlpha = state === 'idle' ? 0.25 : 0.9;
    ctx.font = '700 ' + Math.round(Math.min(W, H) * 0.14) + 'px "Bricolage Grotesque", system-ui, sans-serif';
    ctx.fillText(String(height), W / 2, H * 0.16);
    ctx.globalAlpha = 1;

    if (flashText && now < flashUntil) {
      var k = 1 - (flashUntil - now) / 900;
      ctx.globalAlpha = Math.min(1, 2 - k * 2);
      ctx.fillStyle = combo >= 3 ? colors.red : colors.muted;
      ctx.font = '500 ' + Math.round(Math.min(W, H) * 0.032) + 'px "Martian Mono", ui-monospace, monospace';
      ctx.fillText(flashText, W / 2, H * 0.16 + Math.min(W, H) * 0.06);
      ctx.globalAlpha = 1;
    }
  }

  /* ---------------------------------------------------------------------
     Game logic
     --------------------------------------------------------------------- */
  function reset() {
    layers = [{ x: 0, z: 0, w: BASE, d: BASE, y: -PEDESTAL, h: PEDESTAL, i: 0 }];
    debris = [];
    ripples = [];
    combo = 0;
    perfects = 0;
    flashText = '';
    camY = camTarget = 0;
    zoom = zoomTarget = baseZoom;
    spawnNext();
    setScore();
  }

  function speed() {
    return Math.min(270, 115 + (layers.length - 1) * 3.2);
  }

  function spawnNext() {
    var top = layers[layers.length - 1];
    var axis = layers.length % 2 ? 'x' : 'z';
    moving = { x: top.x, z: top.z, w: top.w, d: top.d, y: top.y + top.h, h: LAYER, i: layers.length, axis: axis, dir: 1 };
    moving[axis] = top[axis] - RANGE;
  }

  function setScore() {
    var height = Math.max(0, layers.length - 1);
    scoreEl.textContent = api.fmt(height);
    api.submitScore('tower', height);
  }

  function flash(text) {
    flashText = text;
    flashUntil = performance.now() + 900;
  }

  function drop() {
    if (state !== 'playing' || !moving) return;
    var top = layers[layers.length - 1];
    var axis = moving.axis;
    var dim = axis === 'x' ? 'w' : 'd';
    var size = moving[dim];
    var delta = moving[axis] - top[axis];
    var miss = Math.abs(delta);

    if (miss <= TOLERANCE) {
      moving[axis] = top[axis];
      combo++;
      perfects++;
      if (combo >= 3) {
        moving.w = Math.min(BASE, moving.w + 5);
        moving.d = Math.min(BASE, moving.d + 5);
      }
      ripples.push({ box: moving, t0: performance.now() });
      api.tone(440 * Math.pow(2, Math.min(combo, 12) / 12), 0.16, { type: 'triangle', vol: 0.07 });
      flash(combo >= 2 ? 'Perfect ×' + combo : 'Perfect');
      land(moving);
      return;
    }

    if (miss >= size) {
      debris.push({ box: moving, vy: 0, alpha: 1, back: delta < 0 });
      moving = null;
      gameOver();
      return;
    }

    combo = 0;
    var keep = size - miss;
    var chop = {};
    for (var k in moving) chop[k] = moving[k];
    chop[dim] = miss;
    chop[axis] = top[axis] + Math.sign(delta) * (size / 2 + miss / 2);
    moving[dim] = keep;
    moving[axis] = top[axis] + delta / 2;
    debris.push({ box: chop, vy: 0, alpha: 1, back: delta < 0 });
    api.tone(200 + keep * 2, 0.07, { type: 'square', vol: 0.03 });
    land(moving);
  }

  function land(b) {
    delete b.dir;
    layers.push(b);
    camTarget = b.y + b.h;
    setScore();
    spawnNext();
    kick();
  }

  function gameOver() {
    state = 'over';
    api.noise(0.25, 0.08);
    var height = Math.max(0, layers.length - 1);
    // Pull the camera back to show the whole tower.
    var total = height * LAYER;
    camTarget = total * 0.45;
    zoomTarget = Math.min(baseZoom, (H * 0.55) / (total + 160));
    var best = api.getBest('tower');
    api.announce('Tower finished at height ' + height + '.');
    setTimeout(function () {
      if (state !== 'over') return;
      overlay.show({
        kicker: height >= best && height > 0 ? 'New best' : 'Build failed',
        title: 'Height ' + height,
        text: 'Best ' + api.fmt(best) + ' · Perfect drops ' + perfects,
        button: 'Build again',
        onAction: start
      });
    }, api.motion() ? 700 : 0);
    kick();
  }

  function start() {
    overlay.hide();
    reset();
    state = 'playing';
    last = 0;
    kick();
  }

  function pause() {
    if (state !== 'playing') return;
    state = 'paused';
    overlay.show({ kicker: 'Paused', title: 'Height ' + Math.max(0, layers.length - 1), button: 'Resume', onAction: resume });
  }

  function resume() {
    overlay.hide();
    state = 'playing';
    last = 0;
    kick();
  }

  /* ---------------------------------------------------------------------
     Loop — runs only while something moves
     --------------------------------------------------------------------- */
  function busy() {
    return state === 'playing' || debris.length || ripples.length ||
      Math.abs(camTarget - camY) > 0.3 || Math.abs(zoomTarget - zoom) > 0.002 ||
      (flashText && performance.now() < flashUntil);
  }

  function step(now) {
    raf = 0;
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;

    if (state === 'playing' && moving) {
      var axis = moving.axis;
      var top = layers[layers.length - 1];
      moving[axis] += moving.dir * speed() * dt;
      if (moving[axis] > top[axis] + RANGE) moving.dir = -1;
      if (moving[axis] < top[axis] - RANGE) moving.dir = 1;
    }

    var ease = api.motion() ? 1 - Math.pow(0.002, dt) : 1;
    camY += (camTarget - camY) * ease;
    zoom += (zoomTarget - zoom) * ease;

    debris = debris.filter(function (d) {
      d.vy += 900 * dt;
      d.box.y -= d.vy * dt;
      if (d.box.y < camY - 140) d.alpha = Math.max(0, d.alpha - dt * 2.5);
      return d.alpha > 0;
    });

    draw(now);
    if (busy() && api.isActive('tower') && !document.hidden) raf = requestAnimationFrame(step);
  }

  function kick() {
    if (!raf) raf = requestAnimationFrame(step);
  }

  function resize() {
    var rect = canvas.getBoundingClientRect();
    if (!rect.width) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = rect.width;
    H = rect.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var old = baseZoom;
    baseZoom = Math.min(W, H * 0.85) / 300;
    zoom *= baseZoom / old;
    zoomTarget *= baseZoom / old;
    draw(performance.now());
  }

  /* ---------------------------------------------------------------------
     Mount
     --------------------------------------------------------------------- */
  function mount(panel, arcadeApi) {
    api = arcadeApi;
    stage = panel.querySelector('[data-stage]');
    scoreEl = panel.querySelector('[data-score]');

    var frame = document.createElement('div');
    frame.className = 'stage-canvas';
    frame.tabIndex = 0;
    frame.setAttribute('data-focus', '');
    canvas = document.createElement('canvas');
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'Deploy Tower play area. Press Space or tap to drop the block.');
    frame.appendChild(canvas);
    stage.appendChild(frame);
    ctx = canvas.getContext('2d');
    overlay = api.makeOverlay(frame);

    readColors();
    reset();

    frame.addEventListener('pointerdown', function (e) {
      if (e.target.closest('button')) return;
      if (overlay.visible) overlay.trigger();
      else drop();
    });
    panel.querySelector('[data-action="new"]').addEventListener('click', start);

    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
    resize();

    overlay.show({
      kicker: 'Deploy Tower',
      title: 'Stack every release.',
      text: 'Tap or press Space to drop each block.',
      button: 'Start building',
      onAction: start
    });
  }

  Arcade.register('tower', {
    mount: mount,
    activate: function () {
      resize();
      kick();
    },
    deactivate: function () {
      pause();
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    },
    onKey: function (e) {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowDown') {
        if (e.repeat) return true;
        if (overlay.visible) overlay.trigger();
        else drop();
        return true;
      }
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        pause();
        return true;
      }
      return false;
    },
    onTheme: function () {
      readColors();
      draw(performance.now());
    }
  });
})();
