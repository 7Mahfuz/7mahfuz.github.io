/**
 * Dino Jump — an endless runner in the spirit of the offline-browser dinosaur
 * game, with original pixel art drawn in the page's theme colours.
 *
 * World units: the play area is always 300 units tall; its width follows the
 * canvas aspect. Sprites are pixel maps scaled by PX units per pixel.
 */
(function () {
  'use strict';

  var WORLD_H = 300;
  var GROUND = 246;          // y of the ground line
  var PX = 2.4;              // world units per sprite pixel
  var DINO_X = 56;
  var GRAVITY = 2600;        // units / s²
  var JUMP_V = 880;          // take-off speed
  var CUT_V = 360;           // releasing early caps the rise at this speed
  var FAST_FALL = 5200;      // gravity while ducking mid-air
  var START_SPEED = 380;
  var MAX_SPEED = 840;
  var ACCEL = 4.4;           // speed gained per second
  var BIRDS_FROM = 250;      // score before birds appear

  /* ---------------------------------------------------------------------
     Sprites ('#' = ink). Original drawings.
     --------------------------------------------------------------------- */
  var BODY = [
    '..........########..',
    '.........##########.',
    '.........##.########',
    '.........###########',
    '.........###########',
    '.........######.....',
    '.........########...',
    '.........#####......',
    '#.......######......',
    '#.....#########.....',
    '##...##########.##..',
    '###.###########.#...',
    '###############.....',
    '.#############......',
    '..###########.......',
    '....########........'
  ];
  var LEGS = {
    stand: ['.....###..###.......', '.....##....##.......', '.....#......#.......', '.....##.....##......'],
    runA: ['.....###..###.......', '......##...##.......', '............#.......', '............##......'],
    runB: ['.....###..###.......', '.....##.....##......', '.....#..............', '.....##.............']
  };
  var DEAD_HEAD = [
    '..........########..',
    '.........##########.',
    '.........#.#.#######',
    '.........##.########',
    '.........#.#.#######',
    '.........##.........',
    '.........########...'
  ];
  var DUCK = {
    runA: [
      '..................########',
      '#........#######.##.######',
      '##......##################',
      '###....###################',
      '##########################',
      '.##################.......',
      '..###############.##......',
      '...############...........',
      '.....###...###............',
      '.....##.....##............',
      '.....#.......#............',
      '.....##......##...........'
    ],
    runB: [
      '..................########',
      '#........#######.##.######',
      '##......##################',
      '###....###################',
      '##########################',
      '.##################.......',
      '..###############.##......',
      '...############...........',
      '.....###...###............',
      '......##...##.............',
      '...........#..............',
      '...........##.............'
    ]
  };
  var CACTUS = [
    '...##...',
    '..####..',
    '..####..',
    '#.####..',
    '#.####.#',
    '#.####.#',
    '#.####.#',
    '######.#',
    '.#######',
    '..####..',
    '..####..',
    '..####..',
    '..####..',
    '..####..',
    '..####..',
    '..####..',
    '..####..'
  ];
  var BIRD = {
    up: [
      '.......#............',
      '.......##...........',
      '.......###..........',
      '...#...####.........',
      '..##...#####........',
      '.###...######.......',
      '################....',
      '....##############..',
      '......###########...',
      '....................',
      '....................',
      '....................'
    ],
    down: [
      '....................',
      '....................',
      '....................',
      '...#................',
      '..##................',
      '.###................',
      '################....',
      '....##############..',
      '......#########.....',
      '.......######.......',
      '.......####.........',
      '.......##...........'
    ]
  };

  // Turn rows of '#' into horizontal runs once, so drawing is a few rects per row.
  function compile(rows) {
    var runs = [];
    rows.forEach(function (row, y) {
      var start = -1;
      for (var x = 0; x <= row.length; x++) {
        var on = row[x] === '#';
        if (on && start < 0) start = x;
        if (!on && start >= 0) {
          runs.push([start, y, x - start]);
          start = -1;
        }
      }
    });
    return { w: rows[0].length, h: rows.length, runs: runs };
  }

  var S = {
    standA: compile(BODY.concat(LEGS.runA)),
    standB: compile(BODY.concat(LEGS.runB)),
    stand: compile(BODY.concat(LEGS.stand)),
    dead: compile(DEAD_HEAD.concat(BODY.slice(DEAD_HEAD.length), LEGS.stand)),
    duckA: compile(DUCK.runA),
    duckB: compile(DUCK.runB),
    cactus: compile(CACTUS),
    birdUp: compile(BIRD.up),
    birdDown: compile(BIRD.down)
  };

  // Hit boxes in sprite pixels: generous to the player, like the original.
  var BOXES = {
    stand: [[10, 0, 9, 7], [2, 8, 12, 7], [5, 15, 7, 5]],
    duck: [[1, 1, 24, 7], [5, 8, 9, 4]],
    cactus: [[2, 0, 4, 17], [0, 3, 8, 6]],
    bird: [[1, 5, 16, 4]]
  };

  var api, frame, canvas, ctx, overlay, scoreEl;
  var W = 0, H = 0, scale = 1, worldW = 600;
  var state = 'idle';
  var dino, obstacles, clouds, pebbles;
  var speed = START_SPEED, dist = 0, score = 0, runTime = 0, flashUntil = 0, lastMilestone = 0;
  var jumpHeld = false, duckHeld = false;
  var raf = 0, last = 0;
  var colors = {};

  function readColors() {
    colors.sky = api.css('--surface');
    colors.ink = api.css('--ink');
    colors.muted = api.css('--muted');
    colors.dim = api.css('--dim');
    colors.cloud = api.css('--line-strong');
    colors.sun = api.css('--red');
    colors.halo = api.css('--red-halo');
  }

  function rand(a, b) {
    return a + Math.random() * (b - a);
  }

  /* ---------------------------------------------------------------------
     Drawing
     --------------------------------------------------------------------- */
  function drawSprite(sprite, x, y, px) {
    var p = (px || PX) * scale;
    var ox = x * scale, oy = y * scale;
    for (var i = 0; i < sprite.runs.length; i++) {
      var r = sprite.runs[i];
      var sx = Math.round(ox + r[0] * p);
      var sy = Math.round(oy + r[1] * p);
      ctx.fillRect(sx, sy, Math.round(ox + (r[0] + r[2]) * p) - sx, Math.round(oy + (r[1] + 1) * p) - sy);
    }
  }

  function dinoSprite() {
    if (state === 'over') return S.dead;
    if (state === 'idle') return S.stand;
    if (dino.alt > 0) return S.stand;
    var step = Math.floor(runTime * 10) % 2;
    if (dino.ducking) return step ? S.duckB : S.duckA;
    return step ? S.standB : S.standA;
  }

  function drawCloud(c) {
    var s = scale;
    ctx.fillStyle = colors.cloud;
    ctx.beginPath();
    ctx.arc((c.x + 14) * s, (c.y + 10) * s, 10 * s, Math.PI, 0);
    ctx.arc((c.x + 30) * s, (c.y + 6) * s, 13 * s, Math.PI, 0);
    ctx.arc((c.x + 46) * s, (c.y + 11) * s, 9 * s, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
  }

  function pad(n) {
    var s = String(Math.floor(n));
    while (s.length < 5) s = '0' + s;
    return s;
  }

  function draw(now) {
    ctx.fillStyle = colors.sky;
    ctx.fillRect(0, 0, W, H);

    // Red sun — the flag's sun, low in the sky.
    var sunX = worldW * 0.8, sunY = 74, sunR = 20;
    ctx.fillStyle = colors.halo;
    ctx.beginPath();
    ctx.arc(sunX * scale, sunY * scale, (sunR + 9) * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.sun;
    ctx.beginPath();
    ctx.arc(sunX * scale, sunY * scale, sunR * scale, 0, Math.PI * 2);
    ctx.fill();

    clouds.forEach(drawCloud);

    // Ground line and pebbles
    ctx.fillStyle = colors.muted;
    ctx.fillRect(0, Math.round(GROUND * scale), W, Math.max(1, Math.round(1.6 * scale)));
    ctx.fillStyle = colors.dim;
    pebbles.forEach(function (p) {
      ctx.fillRect(Math.round(p.x * scale), Math.round((GROUND + p.y) * scale), Math.max(1, Math.round(p.w * scale)), Math.max(1, Math.round(1.4 * scale)));
    });

    ctx.fillStyle = colors.ink;
    obstacles.forEach(function (o) {
      if (o.type === 'cactus') {
        for (var i = 0; i < o.count; i++) drawSprite(S.cactus, o.x + i * (o.cw + o.gap), GROUND - o.h, o.px);
      } else {
        var flap = Math.floor((now / 1000) * 6) % 2;
        drawSprite(flap ? S.birdUp : S.birdDown, o.x, GROUND - o.alt - o.h, PX);
      }
    });

    var sprite = dinoSprite();
    drawSprite(sprite, DINO_X, GROUND - dino.alt - sprite.h * PX);

    // Score, top right, in the page's mono face.
    var visible = now > flashUntil || Math.floor(now / 120) % 2 === 0;
    var size = Math.max(11, Math.round(13 * scale));
    ctx.font = '500 ' + size + 'px "Martian Mono", ui-monospace, monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    var best = api.getBest('dino');
    var right = W - 16 * scale;
    if (visible) {
      ctx.fillStyle = colors.ink;
      ctx.fillText(pad(score), right, 16 * scale);
    }
    var scoreW = ctx.measureText(pad(score)).width;
    if (best > 0) {
      ctx.fillStyle = colors.dim;
      ctx.fillText('HI ' + pad(best), right - scoreW - 14 * scale, 16 * scale);
    }
  }

  /* ---------------------------------------------------------------------
     World
     --------------------------------------------------------------------- */
  function reset() {
    dino = { alt: 0, vy: 0, ducking: false };
    obstacles = [];
    clouds = [];
    pebbles = [];
    speed = START_SPEED;
    dist = 0;
    score = 0;
    runTime = 0;
    lastMilestone = 0;
    flashUntil = 0;
    jumpHeld = false;
    duckHeld = false;
    for (var x = 0; x < worldW + 40; x += rand(18, 60)) pebbles.push(makePebble(x));
    for (var c = 0; c < 3; c++) clouds.push({ x: rand(0, worldW), y: rand(30, 120) });
    setScore();
  }

  function makePebble(x) {
    return { x: x, y: rand(5, 22), w: rand(1.5, 6) };
  }

  function spawnObstacle() {
    var x = worldW + 20;
    if (score >= BIRDS_FROM && Math.random() < 0.28) {
      // Low: jump it. Middle: duck under (or jump). High: keep running — jumping hits it.
      var alts = [8, 30, 62];
      obstacles.push({ type: 'bird', x: x, alt: alts[Math.floor(Math.random() * alts.length)], w: S.birdUp.w * PX, h: S.birdUp.h * PX });
      return;
    }
    var big = Math.random() < 0.45;
    var px = big ? PX * 1.4 : PX;
    var maxCount = speed > 520 ? 3 : speed > 430 ? 2 : 1;
    var count = 1 + Math.floor(Math.random() * maxCount);
    var cw = S.cactus.w * px, gap = 3;
    obstacles.push({ type: 'cactus', x: x, count: count, px: px, cw: cw, gap: gap, w: count * cw + (count - 1) * gap, h: S.cactus.h * px });
  }

  function nextGap() {
    // Room to land and take off again, growing with speed.
    return rand(0.95, 1.6) * speed * 0.62 + 90;
  }

  function boxes(list, x, top, px) {
    return list.map(function (b) {
      return { x0: x + b[0] * px, y0: top + b[1] * px, x1: x + (b[0] + b[2]) * px, y1: top + (b[1] + b[3]) * px };
    });
  }

  function overlap(a, b) {
    for (var i = 0; i < a.length; i++) {
      for (var j = 0; j < b.length; j++) {
        if (a[i].x0 < b[j].x1 && a[i].x1 > b[j].x0 && a[i].y0 < b[j].y1 && a[i].y1 > b[j].y0) return true;
      }
    }
    return false;
  }

  function update(dt, now) {
    runTime += dt;
    speed = Math.min(MAX_SPEED, speed + ACCEL * dt);
    dist += speed * dt;
    score = Math.floor(dist * 0.025);

    if (score >= lastMilestone + 100) {
      lastMilestone = score - (score % 100);
      flashUntil = now + 800;
      api.tone(784, 0.09, { type: 'square', vol: 0.03 });
      api.tone(1046, 0.12, { type: 'square', vol: 0.03, delay: 0.1 });
    }

    // Dino
    dino.ducking = duckHeld && dino.alt === 0;
    if (dino.alt > 0 || dino.vy > 0) {
      dino.vy -= (duckHeld ? FAST_FALL : GRAVITY) * dt;
      dino.alt += dino.vy * dt;
      if (dino.alt <= 0) {
        dino.alt = 0;
        dino.vy = 0;
        if (jumpHeld && !duckHeld) jump();   // holding through a landing hops again
      }
    }

    // Scenery
    clouds.forEach(function (c) { c.x -= speed * 0.12 * dt; });
    clouds = clouds.filter(function (c) { return c.x > -70; });
    if (clouds.length < 3 && Math.random() < dt * 0.6) clouds.push({ x: worldW + rand(0, 60), y: rand(30, 120) });

    pebbles.forEach(function (p) { p.x -= speed * dt; });
    pebbles = pebbles.filter(function (p) { return p.x > -10; });
    var lastPebble = pebbles.length ? pebbles[pebbles.length - 1].x : 0;
    while (lastPebble < worldW + 40) {
      lastPebble += rand(18, 60);
      pebbles.push(makePebble(lastPebble));
    }

    // Obstacles
    obstacles.forEach(function (o) { o.x -= (o.type === 'bird' ? speed * 1.06 : speed) * dt; });
    obstacles = obstacles.filter(function (o) { return o.x + o.w > -20; });
    var tail = obstacles.length ? obstacles[obstacles.length - 1] : null;
    if (!tail || tail.x + tail.w < worldW - (tail.gapAfter || 0)) {
      if (tail || runTime > 0.8) {
        spawnObstacle();
        obstacles[obstacles.length - 1].gapAfter = nextGap();
      }
    }

    // Collisions
    var sprite = dinoSprite();
    var dinoTop = GROUND - dino.alt - sprite.h * PX;
    var mine = boxes(dino.ducking ? BOXES.duck : BOXES.stand, DINO_X, dinoTop, PX);
    for (var i = 0; i < obstacles.length; i++) {
      var o = obstacles[i];
      if (o.x > DINO_X + 80 || o.x + o.w < DINO_X - 10) continue;
      var theirs;
      if (o.type === 'cactus') {
        theirs = [];
        for (var k = 0; k < o.count; k++) {
          theirs = theirs.concat(boxes(BOXES.cactus, o.x + k * (o.cw + o.gap), GROUND - o.h, o.px));
        }
      } else {
        theirs = boxes(BOXES.bird, o.x, GROUND - o.alt - o.h, PX);
      }
      if (overlap(mine, theirs)) {
        crash();
        return;
      }
    }
    setScore();
  }

  function setScore() {
    scoreEl.textContent = api.fmt(score);
  }

  /* ---------------------------------------------------------------------
     Actions
     --------------------------------------------------------------------- */
  function jump() {
    if (state !== 'playing' || dino.alt > 0 || dino.vy > 0) return;
    dino.vy = JUMP_V;
    dino.alt = 0.01;
    api.tone(420, 0.09, { type: 'square', vol: 0.025, slide: 720 });
  }

  function pressJump() {
    jumpHeld = true;
    if (overlay.visible) {
      overlay.trigger();
      return;
    }
    jump();
  }

  function releaseJump() {
    jumpHeld = false;
    if (dino && dino.vy > CUT_V) dino.vy = CUT_V;
  }

  function crash() {
    state = 'over';
    jumpHeld = false;
    duckHeld = false;
    setScore();   // the crash frame's points count too
    api.noise(0.22, 0.1);
    api.tone(160, 0.25, { type: 'square', vol: 0.03 });
    var isBest = api.submitScore('dino', score);
    api.announce('Game over. Score ' + score + '.');
    draw(performance.now());
    setTimeout(function () {
      if (state !== 'over') return;
      overlay.show({
        kicker: isBest && score > 0 ? 'New best' : 'Game over',
        title: 'Score ' + api.fmt(score),
        text: 'Best ' + api.fmt(api.getBest('dino')),
        button: 'Run again',
        onAction: start
      });
    }, api.motion() ? 450 : 0);
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
    jumpHeld = false;
    duckHeld = false;
    overlay.show({ kicker: 'Paused', title: 'Score ' + api.fmt(score), button: 'Resume', onAction: resume });
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
    var dt = last ? Math.min(0.034, (now - last) / 1000) : 0;
    last = now;
    if (state === 'playing') update(dt, now);
    draw(now);
    if (state === 'playing' && api.isActive('dino') && !document.hidden) raf = requestAnimationFrame(step);
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
    scale = H / WORLD_H;
    worldW = W / scale;
    if (dino) draw(performance.now());
  }

  /* ---------------------------------------------------------------------
     Mount
     --------------------------------------------------------------------- */
  function mount(panel, arcadeApi) {
    api = arcadeApi;
    var stage = panel.querySelector('[data-stage]');
    scoreEl = panel.querySelector('[data-score]');

    frame = document.createElement('div');
    frame.className = 'stage-canvas stage-wide';
    frame.tabIndex = 0;
    frame.setAttribute('data-focus', '');
    canvas = document.createElement('canvas');
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'Dino Jump play area. Press Space or the up arrow to jump, down arrow to duck.');
    frame.appendChild(canvas);
    stage.appendChild(frame);
    ctx = canvas.getContext('2d');
    overlay = api.makeOverlay(frame);
    readColors();

    // Touch: tap to jump (hold for higher), swipe down to duck.
    var touch = null;
    frame.addEventListener('pointerdown', function (e) {
      if (e.target.closest('button')) return;
      touch = { y: e.clientY };
      pressJump();
    });
    frame.addEventListener('pointermove', function (e) {
      if (!touch) return;
      if (e.clientY - touch.y > 24 && !duckHeld) {
        duckHeld = true;
        releaseJump();
      }
    });
    function lift() {
      if (!touch) return;
      touch = null;
      releaseJump();
      duckHeld = false;
    }
    frame.addEventListener('pointerup', lift);
    frame.addEventListener('pointercancel', lift);

    panel.querySelector('[data-action="new"]').addEventListener('click', function () {
      start();
      frame.focus({ preventScroll: true });
    });

    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
    resize();
    reset();
    draw(performance.now());

    overlay.show({
      kicker: 'Dino Jump',
      title: 'Jump the cacti. Duck the birds.',
      text: 'Space or ↑ to jump (hold for higher), ↓ to duck. On a phone, tap to jump and swipe down to duck.',
      button: 'Start running',
      onAction: start
    });
  }

  var JUMP_KEYS = { ' ': 1, ArrowUp: 1, w: 1, W: 1 };
  var DUCK_KEYS = { ArrowDown: 1, s: 1, S: 1 };

  Arcade.register('dino', {
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
      if (JUMP_KEYS[e.key]) {
        if (!e.repeat) pressJump();
        return true;
      }
      if (e.key === 'Enter') {
        if (overlay.visible) overlay.trigger();
        return true;
      }
      if (DUCK_KEYS[e.key]) {
        duckHeld = true;
        return true;
      }
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        pause();
        return true;
      }
      return false;
    },
    onKeyUp: function (e) {
      if (JUMP_KEYS[e.key]) {
        releaseJump();
        return true;
      }
      if (DUCK_KEYS[e.key]) {
        duckHeld = false;
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
