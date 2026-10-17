/**
 * Rickshaw Rush — a three-lane traffic dodger set in Dhaka rush hour.
 * Everything is drawn with Canvas 2D paths; sizes scale with the lane width.
 */
(function () {
  'use strict';

  var LANES = 3;
  var METERS_PER_LANE = 3.5;
  var CHA_POINTS = 25;

  // Sizes are in lane widths. Colours are the vehicles' own paint, not theme colours.
  var TYPES = {
    bus: { w: 0.74, h: 1.9, paints: ['#c8553d', '#3d6f9e', '#cf9230', '#4f8a5b'], weight: 2 },
    cng: { w: 0.5, h: 0.86, paints: ['#3e8e57'], weight: 4 },
    car: { w: 0.56, h: 1.05, paints: ['#ece7da', '#5b6b78', '#9a4a4a', '#2f4f6f', '#c4ae80'], weight: 3 },
    rick: { w: 0.42, h: 0.8, paints: ['#2f6fb0', '#d9a23a', '#7a4fa0'], weight: 3 }
  };
  var TYPE_BAG = [];
  Object.keys(TYPES).forEach(function (k) {
    for (var i = 0; i < TYPES[k].weight; i++) TYPE_BAG.push(k);
  });

  var api, frame, canvas, ctx, overlay, scoreEl;
  var W = 0, H = 0, roadX = 0, roadW = 0, laneW = 0;
  var state = 'idle';    // idle | playing | crashing | paused | over
  var player, traffic, cups, trees, pops;
  var dist = 0, cha = 0, elapsed = 0, scroll = 0, spawnIn = 0, crashAt = 0, bellAt = -1e9;
  var raf = 0, last = 0;
  var colors = {};

  function readColors() {
    colors.road = api.css('--rr-road');
    colors.line = api.css('--rr-line');
    colors.verge = api.css('--rr-verge');
    colors.tree = api.css('--rr-tree');
    colors.treeDark = api.css('--rr-tree-dark');
    colors.hud = api.css('--chip-bg');
    colors.ink = api.css('--ink');
    colors.red = api.css('--red');
  }

  function laneX(l) {
    return roadX + laneW * (l + 0.5);
  }

  function rand(a, b) {
    return a + Math.random() * (b - a);
  }

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function score() {
    return Math.floor((dist / laneW) * METERS_PER_LANE) + cha * CHA_POINTS;
  }

  function speed() {
    return Math.min(8.6, 3.4 + elapsed * 0.065) * laneW;   // px per second
  }

  /* ---------------------------------------------------------------------
     Drawing helpers
     --------------------------------------------------------------------- */
  function rr(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function fillRR(x, y, w, h, r, color) {
    rr(x, y, w, h, r);
    ctx.fillStyle = color;
    ctx.fill();
  }

  function shadow(x, y, w, h) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.13)';
    ctx.beginPath();
    ctx.ellipse(x + 3, y + h / 2 + 4, w * 0.58, h * 0.52, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Top-down rickshaw facing up: rider and front wheel at the top, hood behind.
  function drawRickshaw(cx, y, w, h, hood) {
    shadow(cx, y, w, h);
    var wheel = '#2a2a2a';
    fillRR(cx - w * 0.07, y - h * 0.02, w * 0.14, h * 0.2, w * 0.05, wheel);
    fillRR(cx - w / 2 - w * 0.12, y + h * 0.58, w * 0.16, h * 0.26, w * 0.05, wheel);
    fillRR(cx + w / 2 - w * 0.04, y + h * 0.58, w * 0.16, h * 0.26, w * 0.05, wheel);
    ctx.fillStyle = '#5a4632';
    ctx.fillRect(cx - w * 0.04, y + h * 0.1, w * 0.08, h * 0.32);
    ctx.strokeStyle = '#3b3b3b';
    ctx.lineWidth = Math.max(1.5, w * 0.06);
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.32, y + h * 0.1);
    ctx.lineTo(cx + w * 0.32, y + h * 0.1);
    ctx.stroke();
    // Rider: white shirt, dark hair.
    ctx.fillStyle = '#ece6d6';
    ctx.beginPath();
    ctx.ellipse(cx, y + h * 0.27, w * 0.3, h * 0.11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2b211a';
    ctx.beginPath();
    ctx.arc(cx, y + h * 0.25, w * 0.15, 0, Math.PI * 2);
    ctx.fill();
    // Hood with painted stripes — a nod to rickshaw art.
    rr(cx - w / 2, y + h * 0.4, w, h * 0.6, w * 0.42);
    ctx.fillStyle = hood;
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = '#f2c94c';
    ctx.fillRect(cx - w / 2, y + h * 0.58, w, h * 0.05);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - w / 2, y + h * 0.7, w, h * 0.035);
    ctx.fillStyle = '#2f8f5b';
    ctx.fillRect(cx - w / 2, y + h * 0.8, w, h * 0.05);
    ctx.restore();
  }

  function drawCng(cx, y, w, h, paint) {
    shadow(cx, y, w, h);
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.3, y);
    ctx.lineTo(cx + w * 0.3, y);
    ctx.quadraticCurveTo(cx + w / 2, y + h * 0.08, cx + w / 2, y + h * 0.3);
    ctx.lineTo(cx + w / 2, y + h * 0.92);
    ctx.quadraticCurveTo(cx + w / 2, y + h, cx + w * 0.4, y + h);
    ctx.lineTo(cx - w * 0.4, y + h);
    ctx.quadraticCurveTo(cx - w / 2, y + h, cx - w / 2, y + h * 0.92);
    ctx.lineTo(cx - w / 2, y + h * 0.3);
    ctx.quadraticCurveTo(cx - w / 2, y + h * 0.08, cx - w * 0.3, y);
    ctx.closePath();
    ctx.fillStyle = paint;
    ctx.fill();
    fillRR(cx - w * 0.36, y + h * 0.26, w * 0.72, h * 0.66, w * 0.1, '#2d5f3d');
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    for (var i = 1; i < 4; i++) {
      var ly = y + h * (0.26 + i * 0.165);
      ctx.beginPath();
      ctx.moveTo(cx - w * 0.36, ly);
      ctx.lineTo(cx + w * 0.36, ly);
      ctx.stroke();
    }
    fillRR(cx - w * 0.26, y + h * 0.08, w * 0.52, h * 0.12, w * 0.05, '#cfe3ea');
    ctx.fillStyle = '#f2c94c';
    ctx.beginPath();
    ctx.arc(cx, y + h * 0.03, w * 0.06, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBus(cx, y, w, h, paint) {
    shadow(cx, y, w, h);
    fillRR(cx - w / 2, y, w, h, w * 0.12, paint);
    fillRR(cx - w * 0.42, y + h * 0.03, w * 0.84, h * 0.08, w * 0.06, '#2b3640');
    fillRR(cx - w * 0.36, y + h * 0.16, w * 0.72, h * 0.78, w * 0.08, 'rgba(255, 255, 255, 0.18)');
    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    for (var i = 0; i < 4; i++) {
      ctx.fillRect(cx - w * 0.22, y + h * (0.22 + i * 0.18), w * 0.44, h * 0.08);
    }
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.fillRect(cx - w * 0.5, y + h * 0.13, w * 0.04, h * 0.8);
  }

  function drawCar(cx, y, w, h, paint) {
    shadow(cx, y, w, h);
    fillRR(cx - w / 2, y, w, h, w * 0.3, paint);
    ctx.fillStyle = '#26323a';
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.36, y + h * 0.3);
    ctx.lineTo(cx + w * 0.36, y + h * 0.3);
    ctx.lineTo(cx + w * 0.3, y + h * 0.17);
    ctx.lineTo(cx - w * 0.3, y + h * 0.17);
    ctx.closePath();
    ctx.fill();
    fillRR(cx - w * 0.32, y + h * 0.78, w * 0.64, h * 0.1, w * 0.06, '#26323a');
    fillRR(cx - w * 0.34, y + h * 0.34, w * 0.68, h * 0.42, w * 0.14, 'rgba(255, 255, 255, 0.16)');
  }

  function drawVehicle(v) {
    var w = v.w * laneW, h = v.h * laneW;
    if (v.type === 'bus') drawBus(v.x, v.y, w, h, v.paint);
    else if (v.type === 'cng') drawCng(v.x, v.y, w, h, v.paint);
    else if (v.type === 'car') drawCar(v.x, v.y, w, h, v.paint);
    else drawRickshaw(v.x, v.y, w, h, v.paint);
  }

  function drawCup(c, radius) {
    var r = radius || laneW * 0.15;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.beginPath();
    ctx.arc(c.x + 2, c.y + 3, r * 1.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f4f1ea';
    ctx.beginPath();
    ctx.arc(c.x, c.y, r * 1.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(c.x, c.y, r * 0.85, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#b07a46';
    ctx.beginPath();
    ctx.arc(c.x, c.y, r * 0.62, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(1.5, r * 0.22);
    ctx.beginPath();
    ctx.arc(c.x + r * 0.95, c.y, r * 0.3, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
  }

  function drawRoad() {
    ctx.fillStyle = colors.verge;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = colors.road;
    ctx.fillRect(roadX, 0, roadW, H);

    ctx.fillStyle = colors.line;
    ctx.fillRect(roadX + 2, 0, 3, H);
    ctx.fillRect(roadX + roadW - 5, 0, 3, H);
    var dash = laneW * 0.55, gap = laneW * 0.55, period = dash + gap;
    var off = scroll % period;
    for (var l = 1; l < LANES; l++) {
      var x = roadX + laneW * l - 1.5;
      for (var y = -period + off; y < H; y += period) ctx.fillRect(x, y, 3, dash);
    }

    trees.forEach(function (t) {
      ctx.fillStyle = colors.treeDark;
      ctx.beginPath();
      ctx.arc(t.x + t.r * 0.18, t.y + t.r * 0.18, t.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colors.tree;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawHud() {
    var pad = Math.max(10, W * 0.03);
    var size = Math.round(Math.max(14, Math.min(W, H) * 0.05));
    ctx.font = '700 ' + size + 'px "Bricolage Grotesque", system-ui, sans-serif';
    var text = api.fmt(score());
    var tw = ctx.measureText(text).width;
    fillRR(pad, pad, tw + size * 1.1, size * 1.7, size * 0.85, colors.hud);
    ctx.fillStyle = colors.ink;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, pad + size * 0.55, pad + size * 0.88);

    var cupText = '× ' + cha;
    ctx.font = '600 ' + Math.round(size * 0.8) + 'px "Instrument Sans", system-ui, sans-serif';
    var cw = ctx.measureText(cupText).width + size * 1.9;
    fillRR(W - pad - cw, pad, cw, size * 1.7, size * 0.85, colors.hud);
    drawCup({ x: W - pad - cw + size * 0.85, y: pad + size * 0.85 }, size * 0.36);
    ctx.fillStyle = colors.ink;
    ctx.fillText(cupText, W - pad - cw + size * 1.45, pad + size * 0.88);
  }

  function draw(now) {
    var shake = 0;
    if (state === 'crashing' && api.motion()) shake = Math.max(0, 1 - (now - crashAt) / 500) * laneW * 0.08;
    ctx.save();
    if (shake) ctx.translate(rand(-shake, shake), rand(-shake, shake));
    drawRoad();
    cups.forEach(drawCup);
    traffic.forEach(drawVehicle);
    drawRickshaw(player.x, player.y, player.w * laneW, player.h * laneW, '#c93c4a');

    // Bell rings
    var bk = (now - bellAt) / 450;
    if (bk >= 0 && bk < 1) {
      ctx.strokeStyle = colors.ink;
      ctx.globalAlpha = 1 - bk;
      ctx.lineWidth = 2;
      for (var i = 0; i < 2; i++) {
        ctx.beginPath();
        ctx.arc(player.x, player.y + laneW * 0.1, laneW * (0.35 + bk * 0.35 + i * 0.12), -Math.PI * 0.8, -Math.PI * 0.2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    pops.forEach(function (p) {
      var k = (now - p.t0) / 700;
      ctx.globalAlpha = Math.max(0, 1 - k);
      ctx.fillStyle = colors.ink;
      ctx.textAlign = 'center';
      ctx.font = '700 ' + Math.round(laneW * 0.22) + 'px "Bricolage Grotesque", system-ui, sans-serif';
      ctx.fillText(p.text, p.x, p.y - k * laneW * 0.6);
      ctx.globalAlpha = 1;
    });

    if (state === 'crashing' || state === 'over') {
      var cx = player.x, cy = player.y + laneW * 0.1;
      ctx.fillStyle = colors.red;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      for (var s = 0; s < 16; s++) {
        var a = (s / 16) * Math.PI * 2;
        var r = laneW * (s % 2 ? 0.16 : 0.34);
        ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    drawHud();
  }

  /* ---------------------------------------------------------------------
     Game logic
     --------------------------------------------------------------------- */
  function layout() {
    roadW = W * 0.78;
    roadX = (W - roadW) / 2;
    laneW = roadW / LANES;
  }

  function seedTrees() {
    trees = [];
    if (!laneW) return;
    for (var y = 0; y < H + laneW; y += laneW * rand(0.7, 1.2)) addTree(y);
  }

  function addTree(y) {
    var verge = roadX;
    var left = Math.random() < 0.5;
    var r = verge * rand(0.24, 0.36);
    trees.push({ x: left ? verge * rand(0.35, 0.65) : W - verge * rand(0.35, 0.65), y: y, r: r });
  }

  function reset() {
    traffic = [];
    cups = [];
    pops = [];
    dist = 0;
    cha = 0;
    elapsed = 0;
    scroll = 0;
    spawnIn = laneW * 2;
    player = { lane: 1, x: laneX(1), y: H * 0.74, w: 0.42, h: 0.82 };
    seedTrees();
    setScore();
  }

  function spawnRow() {
    var lanes = [0, 1, 2].sort(function () { return Math.random() - 0.5; });
    var twoBlocked = Math.random() < Math.min(0.45, 0.12 + elapsed * 0.008);
    var blocked = lanes.slice(0, twoBlocked ? 2 : 1);
    var free = lanes.slice(blocked.length);
    var tallest = 0;

    blocked.forEach(function (l) {
      var type = pick(TYPE_BAG);
      if (type === 'bus' && elapsed < 6) type = 'car';
      var t = TYPES[type];
      tallest = Math.max(tallest, t.h);
      traffic.push({ type: type, w: t.w, h: t.h, paint: pick(t.paints), x: laneX(l), y: -t.h * laneW - rand(0, 0.4) * laneW });
    });
    if (Math.random() < 0.4) {
      cups.push({ x: laneX(pick(free)), y: -laneW * 0.5 });
    }
    // Leave enough room to cross two lanes at the current speed.
    spawnIn = (tallest + rand(1.5, 2.6)) * laneW + speed() * 0.2;
  }

  function hit(a, b) {
    return a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
  }

  function playerBox() {
    var w = player.w * laneW, h = player.h * laneW;
    return { x0: player.x - w * 0.38, x1: player.x + w * 0.38, y0: player.y + h * 0.06, y1: player.y + h * 0.94 };
  }

  function update(dt, now) {
    var v = speed();
    var dy = v * dt;
    elapsed += dt;
    dist += dy;
    scroll += dy;

    player.x += (laneX(player.lane) - player.x) * Math.min(1, dt * 16);

    // Traffic and cups share one relative speed so a cup never drifts under a vehicle.
    traffic.forEach(function (c) { c.y += dy * 0.78; });
    cups.forEach(function (c) { c.y += dy * 0.78; });
    trees.forEach(function (t) { t.y += dy; });
    traffic = traffic.filter(function (c) { return c.y < H + laneW; });
    cups = cups.filter(function (c) { return !c.taken && c.y < H + laneW; });
    trees = trees.filter(function (t) { return t.y < H + t.r * 2; });
    pops = pops.filter(function (p) { return now - p.t0 < 700; });
    while (!trees.length || trees[trees.length - 1].y > -laneW * 0.2) {
      addTree((trees.length ? trees[trees.length - 1].y : H) - laneW * rand(0.7, 1.3));
    }

    spawnIn -= dy * 0.78;
    if (spawnIn <= 0) spawnRow();

    var pb = playerBox();
    for (var i = 0; i < traffic.length; i++) {
      var c = traffic[i];
      var w = c.w * laneW, h = c.h * laneW;
      if (hit(pb, { x0: c.x - w * 0.44, x1: c.x + w * 0.44, y0: c.y + h * 0.05, y1: c.y + h * 0.95 })) {
        crash(now);
        return;
      }
    }
    cups.forEach(function (c) {
      var r = laneW * 0.2;
      if (hit(pb, { x0: c.x - r, x1: c.x + r, y0: c.y - r, y1: c.y + r })) {
        c.taken = true;
        cha++;
        pops.push({ text: '+' + CHA_POINTS, x: c.x, y: c.y, t0: now });
        api.tone(880, 0.08, { type: 'triangle', vol: 0.06 });
        api.tone(1320, 0.1, { type: 'triangle', vol: 0.05, delay: 0.06 });
      }
    });
    setScore();
  }

  function setScore() {
    var s = score();
    scoreEl.textContent = api.fmt(s);
  }

  function steer(dir) {
    if (state !== 'playing') return;
    var next = Math.max(0, Math.min(LANES - 1, player.lane + dir));
    if (next !== player.lane) {
      player.lane = next;
      api.tone(300, 0.04, { type: 'sine', vol: 0.03 });
    }
  }

  function ring() {
    if (state !== 'playing') return;
    bellAt = performance.now();
    api.tone(1760, 0.09, { type: 'triangle', vol: 0.05 });
    api.tone(2350, 0.12, { type: 'triangle', vol: 0.04, delay: 0.1 });
  }

  function crash(now) {
    state = 'crashing';
    crashAt = now;
    api.noise(0.35, 0.14);
    var s = score();
    var isBest = api.submitScore('rickshaw', s);
    api.announce('Crash. Score ' + api.fmt(s) + '.');
    setTimeout(function () {
      if (state !== 'crashing') return;
      state = 'over';
      overlay.show({
        kicker: isBest ? 'New best' : 'Crashed',
        title: api.fmt(s) + ' points',
        text: Math.floor((dist / laneW) * METERS_PER_LANE) + ' m · ' + cha + ' cups of cha · Best ' + api.fmt(api.getBest('rickshaw')),
        button: 'Ride again',
        onAction: start
      });
      draw(performance.now());
    }, api.motion() ? 650 : 0);
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
    overlay.show({ kicker: 'Paused', title: api.fmt(score()) + ' points', button: 'Resume', onAction: resume });
  }

  function resume() {
    overlay.hide();
    state = 'playing';
    last = 0;
    kick();
  }

  /* ---------------------------------------------------------------------
     Loop
     --------------------------------------------------------------------- */
  function step(now) {
    raf = 0;
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    if (state === 'playing') update(dt, now);
    draw(now);
    var animating = state === 'playing' || state === 'crashing' || pops.length || now - bellAt < 450;
    if (animating && api.isActive('rickshaw') && !document.hidden) raf = requestAnimationFrame(step);
  }

  function kick() {
    if (!raf) raf = requestAnimationFrame(step);
  }

  function resize() {
    var rect = canvas.getBoundingClientRect();
    if (!rect.width) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var oldLane = laneW || 1, oldH = H || 1;
    W = rect.width;
    H = rect.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var oldRoadX = roadX;
    layout();
    if (player) {
      // Rescale the world so a mid-game resize (e.g. rotating a phone) stays fair.
      var k = laneW / oldLane;
      traffic.forEach(function (c) { c.x = laneX(Math.round((c.x - oldRoadX) / oldLane - 0.5)); c.y *= H / oldH; });
      cups.forEach(function (c) { c.x = laneX(Math.round((c.x - oldRoadX) / oldLane - 0.5)); c.y *= H / oldH; });
      dist *= k;
      spawnIn *= k;
      player.x = laneX(player.lane);
      player.y = H * 0.74;
      seedTrees();
      draw(performance.now());
    }
  }

  /* ---------------------------------------------------------------------
     Mount
     --------------------------------------------------------------------- */
  function mount(panel, arcadeApi) {
    api = arcadeApi;
    var stage = panel.querySelector('[data-stage]');
    scoreEl = panel.querySelector('[data-score]');

    frame = document.createElement('div');
    frame.className = 'stage-canvas';
    frame.tabIndex = 0;
    frame.setAttribute('data-focus', '');
    canvas = document.createElement('canvas');
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'Rickshaw Rush road. Use the left and right arrow keys to change lane.');
    frame.appendChild(canvas);

    var bell = document.createElement('button');
    bell.type = 'button';
    bell.className = 'stage-bell';
    bell.setAttribute('aria-label', 'Ring the bell');
    bell.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3a4.5 4.5 0 0 0-4.5 4.5c0 3.5-1.5 5-2 5.5h13c-.5-.5-2-2-2-5.5A4.5 4.5 0 0 0 10 3zM8.3 15.5a1.8 1.8 0 0 0 3.4 0" /></svg>';
    bell.addEventListener('click', ring);
    frame.appendChild(bell);

    stage.appendChild(frame);
    ctx = canvas.getContext('2d');
    overlay = api.makeOverlay(frame);
    readColors();

    // Touch: swipe sideways, or tap the left/right half.
    var touch = null;
    frame.addEventListener('pointerdown', function (e) {
      if (e.target.closest('button')) return;
      if (overlay.visible) {
        overlay.trigger();
        return;
      }
      touch = { x: e.clientX, t: performance.now(), used: false };
    });
    frame.addEventListener('pointermove', function (e) {
      if (!touch || touch.used) return;
      var dx = e.clientX - touch.x;
      if (Math.abs(dx) > 28) {
        steer(dx > 0 ? 1 : -1);
        touch.used = true;
      }
    });
    frame.addEventListener('pointerup', function (e) {
      if (!touch) return;
      if (!touch.used) {
        var rect = frame.getBoundingClientRect();
        steer(e.clientX - rect.left < rect.width / 2 ? -1 : 1);
      }
      touch = null;
    });
    frame.addEventListener('pointercancel', function () { touch = null; });

    panel.querySelector('[data-action="new"]').addEventListener('click', start);

    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
    resize();
    reset();
    draw(performance.now());

    overlay.show({
      kicker: 'Rickshaw Rush',
      title: 'Dhaka, 6 pm. Go.',
      text: 'Change lanes with the arrow keys, or by tapping either side.',
      button: 'Start riding',
      onAction: start
    });
  }

  Arcade.register('rickshaw', {
    mount: mount,
    activate: function () {
      resize();
    },
    deactivate: function () {
      pause();
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    },
    onKey: function (e) {
      var k = e.key;
      if (k === 'ArrowLeft' || k === 'a' || k === 'A') {
        steer(-1);
        return true;
      }
      if (k === 'ArrowRight' || k === 'd' || k === 'D') {
        steer(1);
        return true;
      }
      if (k === ' ' || k === 'Enter') {
        if (e.repeat) return true;
        if (overlay.visible) overlay.trigger();
        else ring();
        return true;
      }
      if (k === 'Escape' || k === 'p' || k === 'P') {
        pause();
        return true;
      }
      return k === 'ArrowUp' || k === 'ArrowDown';
    },
    onTheme: function () {
      readColors();
      draw(performance.now());
    }
  });
})();
