/**
 * Portfolio v3 — page backdrop.
 *
 * One fixed WebGL canvas behind the page, with backgrounds ported from
 * demo/backgrounds.html:
 *
 *   Hero, Work, Live projects   Flock: birds over the Padma. They follow the
 *                               cursor and wander when it leaves.
 *   Stack                       Ilish school: fish that split around the cursor;
 *                               frightened ones flash red.
 *   Contact                     Constellation: drifting nodes that link when
 *                               close; the cursor connects to everything nearby.
 *
 * Education has kites of its own (initKites in js/v3.js), so the backdrop steps
 * aside there. The backgrounds crossfade as each section's top rises through
 * the middle of the screen; nothing else is tied to scrolling. Colours come
 * from the theme's CSS tokens. Three.js is shared with js/v3-globe-looks.js and loaded once the page
 * is idle. Respects reduced motion (everything holds still), pauses when hidden.
 */

const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';

const MOTION = !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
const isSmall = () => window.innerWidth < 760;
const aspect = () => window.innerWidth / window.innerHeight;
const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const TAU = Math.PI * 2;

// The mouse, in screen units (x and y in -1…1, y up); eased each frame.
const M = { x: 0, y: 0, tx: 0, ty: 0, in: false };

/* ------------------------------------------------------------------------
   Shared pieces
   ------------------------------------------------------------------------ */
const LINE_VS = /* glsl */ `
  attribute float aAlpha; attribute vec3 aColor; varying float vA; varying vec3 vC;
  void main() { vA = aAlpha; vC = aColor; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const LINE_FS = /* glsl */ `
  uniform float uFade; varying float vA; varying vec3 vC;
  void main() { gl_FragColor = vec4(vC, vA * uFade); }`;
const PT_VS = /* glsl */ `
  uniform float uScale; attribute float aSize; attribute float aAlpha; attribute vec3 aColor; varying float vA; varying vec3 vC;
  void main() { vA = aAlpha; vC = aColor; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = aSize * uScale / -mv.z; gl_Position = projectionMatrix * mv; }`;
const PT_FS = /* glsl */ `
  uniform float uFade; varying float vA; varying vec3 vC;
  void main() { float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard; gl_FragColor = vec4(vC, vA * uFade * smoothstep(0.5, 0.35, d)); }`;

const attr = (THREE, n, size) => new THREE.BufferAttribute(new Float32Array(n * size), size).setUsage(THREE.DynamicDrawUsage);

// Line segments with per-vertex colour and alpha, rewritten every frame.
// `fade` is the background's shared opacity uniform.
function dynLines(THREE, maxSegs, fade) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', attr(THREE, maxSegs * 2, 3));
  g.setAttribute('aColor', attr(THREE, maxSegs * 2, 3));
  g.setAttribute('aAlpha', attr(THREE, maxSegs * 2, 1));
  const m = new THREE.LineSegments(g, new THREE.ShaderMaterial({
    uniforms: { uFade: fade },
    vertexShader: LINE_VS, fragmentShader: LINE_FS, transparent: true, depthWrite: false
  }));
  m.frustumCulled = false;
  return m;
}

// Round points with per-vertex colour, alpha and size (in world units).
function dynPoints(THREE, n, fade, scale) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', attr(THREE, n, 3));
  g.setAttribute('aColor', attr(THREE, n, 3));
  g.setAttribute('aAlpha', attr(THREE, n, 1));
  g.setAttribute('aSize', attr(THREE, n, 1));
  const p = new THREE.Points(g, new THREE.ShaderMaterial({
    uniforms: { uFade: fade, uScale: scale },
    vertexShader: PT_VS, fragmentShader: PT_FS, transparent: true, depthWrite: false
  }));
  p.frustumCulled = false;
  return p;
}

// Flocking (cohesion, alignment, separation) on a spatial grid, plus an optional
// goal to swim towards, a predator to flee, and soft walls.
function boids(B, o, step) {
  const inv = 1 / o.r, r2 = o.r * o.r, s2 = o.sepR * o.sepR, map = new Map();
  const cellKey = (x, y) => (x + 512) * 1024 + (y + 512);
  for (let i = 0; i < B.length; i++) {
    const k = cellKey(Math.floor(B[i].x * inv), Math.floor(B[i].y * inv));
    let list = map.get(k);
    if (!list) map.set(k, (list = []));
    list.push(i);
  }
  for (let i = 0; i < B.length; i++) {
    const b = B[i], gx = Math.floor(b.x * inv), gy = Math.floor(b.y * inv);
    let n = 0, cx = 0, cy = 0, ax = 0, ay = 0, sx = 0, sy = 0;
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
      const list = map.get(cellKey(gx + dx, gy + dy));
      if (!list) continue;
      for (const j of list) {
        if (j === i) continue;
        const q = B[j], ex = q.x - b.x, ey = q.y - b.y, d2 = ex * ex + ey * ey;
        if (d2 > r2) continue;
        n++; cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
        if (d2 < s2) { const w = 1 / (d2 + 1e-5); sx -= ex * w; sy -= ey * w; }
      }
    }
    let fx = sx * o.sep, fy = sy * o.sep;
    if (n) {
      fx += (cx / n - b.x) * o.coh + (ax / n - b.vx) * o.ali;
      fy += (cy / n - b.y) * o.coh + (ay / n - b.vy) * o.ali;
    }
    const g = o.goal, ex = g.x - b.x, ey = g.y - b.y, gd = Math.hypot(ex, ey) || 1;
    fx += (ex / gd) * g.w; fy += (ey / gd) * g.w;
    b.fear = 0;
    if (o.flee) {
      const f = o.flee, px = b.x - f.x, py = b.y - f.y, d = Math.hypot(px, py) || 1;
      if (d < f.r) { const k = (1 - d / f.r) * f.w; fx += (px / d) * k; fy += (py / d) * k; b.fear = 1 - d / f.r; }
    }
    const bd = o.bounds, e = o.edge;
    if (b.x > bd.x) fx -= (b.x - bd.x) * e; else if (b.x < -bd.x) fx -= (b.x + bd.x) * e;
    if (b.y > bd.y) fy -= (b.y - bd.y) * e; else if (b.y < -bd.y) fy -= (b.y + bd.y) * e;
    b.vx += fx * step; b.vy += fy * step;
    const sp = Math.hypot(b.vx, b.vy) || 1, k = sp > o.max ? o.max / sp : sp < o.min ? o.min / sp : 1;
    b.vx *= k; b.vy *= k;
  }
  for (const b of B) { b.x += b.vx * step; b.y += b.vy * step; }
}

/* ------------------------------------------------------------------------
   Flock — birds that follow the cursor
   ------------------------------------------------------------------------ */
function buildFlock(THREE, P, camera) {
  const N = isSmall() ? 140 : 260;
  const fade = { value: 0 }, scene = new THREE.Scene(), lines = dynLines(THREE, N * 2, fade);
  scene.add(lines);
  const pos = lines.geometry.getAttribute('position'), colA = lines.geometry.getAttribute('aColor'), alA = lines.geometry.getAttribute('aAlpha');
  const birds = [];
  // Start as a few loose flocks already flying together, so it reads as birds from the first frame.
  const groups = [0, 1, 2].map(() => ({ x: (Math.random() - 0.5) * 1.4 * aspect(), y: Math.random() * 1.2 - 0.6, ang: Math.random() * TAU }));
  for (let i = 0; i < N; i++) {
    const g = groups[i % groups.length], ang = g.ang + (Math.random() - 0.5) * 0.5, r = Math.sqrt(Math.random()) * 0.28, a2 = Math.random() * TAU;
    birds.push({ x: g.x + Math.cos(a2) * r * 1.6, y: g.y + Math.sin(a2) * r, vx: Math.cos(ang) * 0.25, vy: Math.sin(ang) * 0.25, ph: Math.random() * TAU, near: 0 });
  }
  const tmp = new THREE.Color();
  return {
    scene, camera, fade,
    update(t, dt, step) {
      const a = aspect(), alpha = P.dark ? 0.85 : 0.7;
      // Follow the cursor; without it, chase a slow wandering point.
      const gx = M.in ? M.x * a : Math.sin(t * 0.21) * a * 0.6;
      const gy = M.in ? M.y : Math.cos(t * 0.29) * 0.5;
      for (let i = 0; i < N; i++) {
        const b = birds[i];
        let cx = 0, cy = 0, ax = 0, ay = 0, sx = 0, sy = 0, n = 0;
        for (let j = 0; j < N; j++) {
          if (i === j) continue;
          const o = birds[j], dx = o.x - b.x, dy = o.y - b.y, d2 = dx * dx + dy * dy;
          if (d2 > 0.02) continue;
          n++; cx += o.x; cy += o.y; ax += o.vx; ay += o.vy;
          if (d2 < 0.0016) { sx -= dx / (d2 + 1e-4); sy -= dy / (d2 + 1e-4); }
        }
        let fx = sx * 0.0016, fy = sy * 0.0016;
        if (n) {
          fx += (cx / n - b.x) * 0.9 + (ax / n - b.vx) * 1.2;
          fy += (cy / n - b.y) * 0.9 + (ay / n - b.vy) * 1.2;
        }
        const gdx = gx - b.x, gdy = gy - b.y, gd = Math.hypot(gdx, gdy) || 1;
        fx += (gdx / gd) * 0.5;
        fy += (gdy / gd) * 0.5;
        b.vx += fx * step; b.vy += fy * step;
        const sp = Math.hypot(b.vx, b.vy) || 1, k = sp > 0.45 ? 0.45 / sp : sp < 0.16 ? 0.16 / sp : 1;
        b.vx *= k; b.vy *= k;
        b.x += b.vx * step; b.y += b.vy * step;
        if (b.x > a + 0.1) b.x = -a - 0.1; else if (b.x < -a - 0.1) b.x = a + 0.1;
        if (b.y > 1.1) b.y = -1.1; else if (b.y < -1.1) b.y = 1.1;
        // A flapping chevron pointing along the flight direction.
        const ux = b.vx / (Math.hypot(b.vx, b.vy) || 1), uy = b.vy / (Math.hypot(b.vx, b.vy) || 1);
        const flap = MOTION ? Math.sin(t * 11 + b.ph) : 0, w = 0.015, spread = w * (0.5 + flap * 0.3);
        const bx = b.x - ux * w, by = b.y - uy * w;
        pos.setXYZ(i * 4, bx - uy * spread, by + ux * spread, 0); pos.setXYZ(i * 4 + 1, b.x, b.y, 0);
        pos.setXYZ(i * 4 + 2, bx + uy * spread, by - ux * spread, 0); pos.setXYZ(i * 4 + 3, b.x, b.y, 0);
        // Birds near the cursor warm to red.
        const near = M.in ? Math.exp(-((b.x - gx) ** 2 + (b.y - gy) ** 2) * 6) : 0;
        b.near += (near - b.near) * Math.min(1, dt * 4);
        tmp.copy(P.dot).lerp(P.red, b.near * 0.8);
        for (let v = 0; v < 4; v++) { colA.setXYZ(i * 4 + v, tmp.r, tmp.g, tmp.b); alA.setX(i * 4 + v, alpha); }
      }
      pos.needsUpdate = colA.needsUpdate = alA.needsUpdate = true;
    }
  };
}

/* ------------------------------------------------------------------------
   Ilish school — fish that part around the cursor
   ------------------------------------------------------------------------ */
function buildFish(THREE, P, camera) {
  const N = isSmall() ? 110 : 180;
  const fade = { value: 0 }, scene = new THREE.Scene(), lines = dynLines(THREE, N * 5, fade);
  scene.add(lines);
  const pos = lines.geometry.getAttribute('position'), colA = lines.geometry.getAttribute('aColor'), alA = lines.geometry.getAttribute('aAlpha');
  const fish = [];
  for (let i = 0; i < N; i++) {
    const a = (Math.random() - 0.5) * 0.6;
    fish.push({ x: -0.6 + (Math.random() - 0.5) * 0.6, y: (Math.random() - 0.5) * 0.5, vx: Math.cos(a) * 0.2, vy: Math.sin(a) * 0.2, ph: Math.random() * TAU, red: 0, fear: 0 });
  }
  const tmp = new THREE.Color();
  return {
    scene, camera, fade,
    update(t, dt, step) {
      const a = aspect(), alpha = P.dark ? 0.85 : 0.7;
      // The current: a slow drifting point the school follows.
      const goal = { x: Math.sin(t * 0.13) * a * 0.55, y: Math.cos(t * 0.19) * 0.45, w: 0.28 };
      // The cursor is a predator: the school splits around it.
      const flee = M.in ? { x: M.x * a, y: M.y, r: 0.38, w: 3.2 } : null;
      if (step) boids(fish, { r: 0.13, sepR: 0.035, coh: 0.5, ali: 1.0, sep: 0.0011, min: 0.12, max: 0.32, goal, flee, bounds: { x: a * 0.92, y: 0.88 }, edge: 1.5 }, step);
      let s = 0;
      const seg = (p, q, c, al) => {
        pos.setXYZ(s * 2, p[0], p[1], 0); pos.setXYZ(s * 2 + 1, q[0], q[1], 0);
        colA.setXYZ(s * 2, c.r, c.g, c.b); colA.setXYZ(s * 2 + 1, c.r, c.g, c.b);
        alA.setX(s * 2, al); alA.setX(s * 2 + 1, al);
        s++;
      };
      for (let i = 0; i < N; i++) {
        const f = fish[i], sp = Math.hypot(f.vx, f.vy) || 1, ux = f.vx / sp, uy = f.vy / sp, nx = -uy, ny = ux;
        f.ph += step * (6 + sp * 30);
        f.red += (f.fear * 1.6 - f.red) * Math.min(1, dt * 5);
        // Spine of 4 points; the wiggle grows toward the tail.
        const L = 0.055, pts = [];
        for (let k = 0; k < 4; k++) {
          const back = (k / 3) * L, sway = Math.sin(f.ph - k * 1.1) * 0.0065 * (k / 3);
          pts.push([f.x - ux * back + nx * sway, f.y - uy * back + ny * sway]);
        }
        const [tx, ty] = pts[3], fl = Math.sin(f.ph) * 0.004;
        tmp.copy(P.dot).lerp(P.red, clamp(f.red, 0, 1));
        seg(pts[0], pts[1], tmp, alpha);
        seg(pts[1], pts[2], tmp, alpha);
        seg(pts[2], pts[3], tmp, alpha);
        seg([tx, ty], [tx - ux * 0.012 + nx * (0.009 + fl), ty - uy * 0.012 + ny * (0.009 + fl)], tmp, alpha * 0.7);
        seg([tx, ty], [tx - ux * 0.012 - nx * (0.009 - fl), ty - uy * 0.012 - ny * (0.009 - fl)], tmp, alpha * 0.7);
      }
      pos.needsUpdate = colA.needsUpdate = alA.needsUpdate = true;
    }
  };
}

/* ------------------------------------------------------------------------
   Constellation — nodes that link when close, and to the cursor
   ------------------------------------------------------------------------ */
function buildNetwork(THREE, P) {
  const V3 = THREE.Vector3;
  const fade = { value: 0 }, scale = { value: 800 };
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(45, aspect(), 0.1, 50);
  camera.position.set(0, 0, 6);
  const group = new THREE.Group();
  scene.add(group);
  const N = isSmall() ? 80 : 140, MAX = 1600, D = 1.25, D2 = D * D, LIM = [4.8, 3.2, 2.2];
  const nodes = [];
  for (let i = 0; i < N; i++) nodes.push({ p: new V3((Math.random() - 0.5) * 9, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 4), v: new V3((Math.random() - 0.5) * 0.15, (Math.random() - 0.5) * 0.15, (Math.random() - 0.5) * 0.1) });
  const lines = dynLines(THREE, MAX, fade), dots = dynPoints(THREE, N, fade, scale);
  group.add(lines, dots);
  const lp = lines.geometry.getAttribute('position'), lc = lines.geometry.getAttribute('aColor'), la = lines.geometry.getAttribute('aAlpha');
  const dp = dots.geometry.getAttribute('position'), dc = dots.geometry.getAttribute('aColor'), da = dots.geometry.getAttribute('aAlpha'), ds = dots.geometry.getAttribute('aSize');
  const ray = new THREE.Raycaster(), plane = new THREE.Plane(new V3(0, 0, 1), 0), hit = new V3(), cursor = new V3(99, 99, 0), local = new V3(), ndc = new THREE.Vector2(), c = new THREE.Color();
  return {
    scene, camera, fade,
    resize(bufferHeight) {
      camera.aspect = aspect();
      camera.updateProjectionMatrix();
      scale.value = bufferHeight / (2 * Math.tan((camera.fov * Math.PI) / 360));
    },
    update(t, dt, step) {
      // The mouse tilts the network a little.
      group.rotation.y += (M.x * 0.25 - group.rotation.y) * 0.05;
      group.rotation.x += (-M.y * 0.15 - group.rotation.x) * 0.05;
      group.updateMatrixWorld();
      if (M.in) {
        ray.setFromCamera(ndc.set(M.x, M.y), camera);
        if (ray.ray.intersectPlane(plane, hit)) { local.copy(hit); group.worldToLocal(local); cursor.lerp(local, 0.3); }
      } else cursor.set(99, 99, 0);
      nodes.forEach((n, i) => {
        n.p.addScaledVector(n.v, step);
        if (Math.abs(n.p.x) > LIM[0]) n.v.x *= -1;
        if (Math.abs(n.p.y) > LIM[1]) n.v.y *= -1;
        if (Math.abs(n.p.z) > LIM[2]) n.v.z *= -1;
        // Nodes near the cursor drift towards it and warm to red.
        const dx = cursor.x - n.p.x, dy = cursor.y - n.p.y, d2 = dx * dx + dy * dy;
        if (d2 < 2.2 && step) { n.p.x += dx * 0.004; n.p.y += dy * 0.004; }
        dp.setXYZ(i, n.p.x, n.p.y, n.p.z);
        const near = Math.exp(-d2 * 1.2);
        c.copy(P.dot).lerp(P.red, near);
        dc.setXYZ(i, c.r, c.g, c.b); da.setX(i, 0.55 + near * 0.4); ds.setX(i, 0.05 + near * 0.06);
      });
      let s = 0;
      for (let i = 0; i < N && s < MAX; i++) for (let j = i + 1; j < N && s < MAX; j++) {
        const a = nodes[i].p, b = nodes[j].p, d2 = a.distanceToSquared(b);
        if (d2 > D2) continue;
        const al = (1 - Math.sqrt(d2) / D) * (P.dark ? 0.5 : 0.4);
        lp.setXYZ(s * 2, a.x, a.y, a.z); lp.setXYZ(s * 2 + 1, b.x, b.y, b.z);
        lc.setXYZ(s * 2, P.dot.r, P.dot.g, P.dot.b); lc.setXYZ(s * 2 + 1, P.dot.r, P.dot.g, P.dot.b);
        la.setX(s * 2, al); la.setX(s * 2 + 1, al);
        s++;
      }
      // Lines from the cursor to every nearby node.
      for (let i = 0; i < N && s < MAX; i++) {
        const a = nodes[i].p, d = Math.hypot(a.x - cursor.x, a.y - cursor.y);
        if (d > 1.6) continue;
        lp.setXYZ(s * 2, cursor.x, cursor.y, 0); lp.setXYZ(s * 2 + 1, a.x, a.y, a.z);
        lc.setXYZ(s * 2, P.red.r, P.red.g, P.red.b); lc.setXYZ(s * 2 + 1, P.red.r, P.red.g, P.red.b);
        la.setX(s * 2, 0.7 * (1 - d / 1.6)); la.setX(s * 2 + 1, 0.15);
        s++;
      }
      lines.geometry.setDrawRange(0, s * 2);
      lp.needsUpdate = lc.needsUpdate = la.needsUpdate = true;
      dp.needsUpdate = dc.needsUpdate = da.needsUpdate = ds.needsUpdate = true;
    }
  };
}

/* ------------------------------------------------------------------------
   Theme colours
   ------------------------------------------------------------------------ */
function palette(THREE) {
  const cs = getComputedStyle(document.documentElement);
  // Colours go in and come out as written (the renderer outputs without conversion).
  const col = name => {
    const v = cs.getPropertyValue(name).trim();
    if (v.startsWith('#')) return new THREE.Color().setStyle(v, THREE.LinearSRGBColorSpace);
    const m = v.match(/[\d.]+/g) || [0, 0, 0];
    return new THREE.Color(+m[0] / 255, +m[1] / 255, +m[2] / 255);
  };
  return { dot: col('--globe-dot'), red: col('--red'), dark: document.documentElement.getAttribute('data-theme') === 'dark' };
}

/* ------------------------------------------------------------------------
   Scene
   ------------------------------------------------------------------------ */
async function start() {
  let THREE;
  try {
    THREE = await import(THREE_URL);
  } catch (e) {
    return; // offline or blocked CDN: the page is complete without it
  }

  const canvas = document.createElement('canvas');
  canvas.className = 'backdrop';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  } catch (e) {
    canvas.remove();
    return;
  }
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  renderer.autoClear = false;

  // Flock and fish are flat (screen units); the constellation has its own 3D camera.
  const flat = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1);
  const P = palette(THREE);
  const BG = { flock: buildFlock(THREE, P, flat), fish: buildFish(THREE, P, flat), network: buildNetwork(THREE, P) };

  // How far a section's top has risen through the screen: 0 until it reaches
  // 70% of the height, 1 once it passes 30%.
  const risen = id => {
    const el = document.getElementById(id);
    if (!el) return 0;
    const top = el.getBoundingClientRect().top, h = window.innerHeight;
    const k = clamp((h * 0.7 - top) / (h * 0.4), 0, 1);
    return k * k * (3 - 2 * k);
  };
  // Birds until Stack, fish for Stack, the constellation for Contact; nothing
  // behind Education's kites.
  const wanted = () => {
    const s = risen('stack'), e = risen('education'), c = risen('contact');
    return { flock: 1 - s, fish: s * (1 - e), network: c };
  };
  const first = wanted();
  Object.keys(BG).forEach(k => { BG[k].fade.value = first[k]; });
  let last = 0, raf = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(dpr);
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    const a = aspect();
    flat.left = -a; flat.right = a;
    flat.updateProjectionMatrix();
    BG.network.resize(renderer.getDrawingBufferSize(new THREE.Vector2()).y);
    kick();
  }

  function frame(now) {
    raf = 0;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
    last = now;
    const t = now / 1000, step = MOTION ? Math.min(dt, 0.033) : 0;
    const e = Math.min(1, dt * 5);
    M.x += (M.tx - M.x) * e;
    M.y += (M.ty - M.y) * e;
    const want = wanted(), ease = MOTION ? Math.min(1, dt * 6) : 1;
    renderer.clear();
    // Only the backgrounds that are showing move.
    Object.keys(BG).forEach(k => {
      const bg = BG[k];
      bg.fade.value += (want[k] - bg.fade.value) * ease;
      if (bg.fade.value <= 0.001) return;
      bg.update(t, dt, step);
      renderer.render(bg.scene, bg.camera);
    });
    // With reduced motion, draw only when something changed (scroll, resize, theme).
    if (MOTION && !document.hidden) raf = requestAnimationFrame(frame);
  }

  function kick() {
    if (!raf) {
      last = 0;
      raf = requestAnimationFrame(frame);
    }
  }

  window.addEventListener('pointermove', ev => {
    M.tx = (ev.clientX / window.innerWidth) * 2 - 1;
    M.ty = -((ev.clientY / window.innerHeight) * 2 - 1);
    M.in = true;
  }, { passive: true });
  document.addEventListener('pointerleave', () => { M.in = false; });
  if (!MOTION) window.addEventListener('scroll', kick, { passive: true });
  document.addEventListener('themechange', () => {
    Object.assign(P, palette(THREE));
    kick();
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) kick(); });
  window.addEventListener('resize', resize);

  resize();
  canvas.classList.add('is-on');
}

/* Load once the page has settled, after the hero. */
(function boot() {
  let started = false;
  const begin = () => {
    if (started) return;
    started = true;
    start();
  };
  const idle = () => ('requestIdleCallback' in window ? requestIdleCallback(begin, { timeout: 3000 }) : setTimeout(begin, 800));
  if (document.readyState === 'complete') idle();
  else window.addEventListener('load', idle, { once: true });
})();
