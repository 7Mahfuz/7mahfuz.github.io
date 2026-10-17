/**
 * Portfolio v3 — section backdrop.
 *
 * One fixed WebGL particle field behind the page. As you scroll, the same
 * points re-form into a shape for each section:
 *
 *   top        dust (hidden)        the hero globe owns the first screen
 *   work       river-delta surface  Dhaka's rivers / data flowing through systems
 *   live       five orbiting worlds the five live products
 *   stack      six stacked layers   the six skill groups — literally a stack
 *   education  rising steps         SSC, HSC, B.Sc., training
 *   contact    the red sun          the flag's sun, closing what the globe opened
 *
 * Three.js is loaded lazily (after the hero), drawn as a single Points object
 * whose shader blends between two formations. Colours come from the theme's
 * CSS tokens. Respects reduced motion, pauses when hidden.
 */

const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';

const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isSmall = () => window.innerWidth < 760;

/* ------------------------------------------------------------------------
   Formations — each returns N points as a flat Float32Array (x, y, z)
   ------------------------------------------------------------------------ */
function rand(seed) {
  // Small deterministic PRNG so shapes are identical on every visit.
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function dust(n) {
  const r = rand(7), out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    out[i * 3] = (r() - 0.5) * 28;
    out[i * 3 + 1] = (r() - 0.5) * 16;
    out[i * 3 + 2] = -10 + r() * 12;
  }
  return out;
}

function delta(n) {
  // Fine lines receding into the distance — ledger lines that flow like rivers.
  const out = new Float32Array(n * 3);
  const rows = 24, cols = Math.ceil(n / rows);
  for (let i = 0; i < n; i++) {
    const c = i % cols, w = Math.floor(i / cols);
    out[i * 3] = -17 + (34 * c) / Math.max(1, cols - 1);
    out[i * 3 + 1] = -2.4;
    out[i * 3 + 2] = -18 + (16 * w) / (rows - 1);
  }
  return out;
}

function five(n) {
  // Five small worlds, each with a ring — five products and their users.
  const r = rand(23), out = new Float32Array(n * 3);
  const centers = [[-7, 0.9, -2.5], [-3.5, -0.5, -0.5], [0, 0.6, -1.8], [3.5, -0.6, -0.4], [7, 0.8, -2.2]];
  for (let i = 0; i < n; i++) {
    const k = i % 5, c = centers[k];
    const radius = 1.05 + (k % 2) * 0.3;
    let x, y, z;
    if (r() < 0.32) {
      const a = r() * Math.PI * 2, rr = radius * (1.55 + r() * 0.25);
      x = Math.cos(a) * rr; y = (r() - 0.5) * 0.06; z = Math.sin(a) * rr;
      const t = 0.42; // tilt the ring
      const y2 = y * Math.cos(t) - z * Math.sin(t);
      z = y * Math.sin(t) + z * Math.cos(t); y = y2;
    } else {
      const u = r() * 2 - 1, a = r() * Math.PI * 2, s = Math.sqrt(1 - u * u);
      x = s * Math.cos(a) * radius; y = u * radius; z = s * Math.sin(a) * radius;
    }
    out[i * 3] = c[0] + x; out[i * 3 + 1] = c[1] + y; out[i * 3 + 2] = c[2] + z;
  }
  return out;
}

function layers(n) {
  // Six plates stacked vertically, each a little turned from the last.
  const r = rand(31), out = new Float32Array(n * 3);
  const per = Math.ceil(n / 6), side = Math.ceil(Math.sqrt(per * 0.62));
  for (let i = 0; i < n; i++) {
    const layer = Math.floor(i / per), j = i % per;
    const cols = Math.ceil(side * 1.6), rowsPer = Math.ceil(per / cols);
    const gx = (j % cols) / (cols - 1) - 0.5, gz = Math.floor(j / cols) / Math.max(1, rowsPer - 1) - 0.5;
    const width = 4.8 - layer * 0.25, depth = 2.2, turn = layer * 0.12;
    const x = gx * width, z = gz * depth;
    out[i * 3] = x * Math.cos(turn) - z * Math.sin(turn) + (r() - 0.5) * 0.03;
    out[i * 3 + 1] = -3.1 + layer * 1.24;
    out[i * 3 + 2] = x * Math.sin(turn) + z * Math.cos(turn) + (r() - 0.5) * 0.03;
  }
  return out;
}

function steps(n) {
  // Four rising steps — SSC, HSC, B.Sc. and professional training.
  const r = rand(37), out = new Float32Array(n * 3);
  const count = 4, w = 2.2, d = 1.6, rise = 0.95;
  for (let i = 0; i < n; i++) {
    const k = i % count;
    const x0 = -3.3 + k * w, y0 = -1.8 + k * rise;
    let x, y, z;
    if (r() < 0.72) {            // the tread (top face)
      x = x0 + r() * w; y = y0; z = (r() - 0.5) * d;
    } else {                     // the riser (front face)
      x = x0 + r() * w; y = y0 - r() * rise; z = d / 2;
    }
    out[i * 3] = x; out[i * 3 + 1] = y; out[i * 3 + 2] = z;
  }
  return out;
}

function sun(n) {
  // Fibonacci sphere plus a thin corona.
  const r = rand(47), out = new Float32Array(n * 3);
  const core = Math.floor(n * 0.82), golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    let x, y, z;
    if (i < core) {
      const t = core > 1 ? i / (core - 1) : 0, yy = 1 - 2 * t, rad = Math.sqrt(1 - yy * yy), a = i * golden;
      x = Math.cos(a) * rad * 2.6; y = yy * 2.6; z = Math.sin(a) * rad * 2.6;
    } else {
      const a = r() * Math.PI * 2, rr = 3 + Math.pow(r(), 1.6) * 1.8;
      x = Math.cos(a) * rr; y = Math.sin(a) * rr; z = (r() - 0.5) * 0.6;
    }
    out[i * 3] = x; out[i * 3 + 1] = y; out[i * 3 + 2] = z;
  }
  return out;
}

/* Per-section look: shape, colour token, opacity, flow, tilt, facing (yaw),
   gentle sway amplitude, and offset. Shapes sway around their best angle
   rather than spinning, so a staircase never turns edge-on. */
const FORMS = {
  top:       { make: dust,    color: 'dot',    alpha: 0,    wave: 0, tilt: 0,    yaw: 0,     sway: 0,    x: 0,   y: 0,   z: 0 },
  work:      { make: delta,   color: 'dot',    alpha: 0.6,  wave: 1, tilt: 0,    yaw: 0,     sway: 0,    x: 0,   y: 0,   z: 0 },
  live:      { make: five,    color: 'accent', alpha: 0.3,  wave: 0, tilt: 0.12, yaw: 0,     sway: 0.3,  x: 2.4, y: 1.5, z: -4 },
  stack:     { make: layers,  color: 'dot',    alpha: 0.34, wave: 0, tilt: 0.18, yaw: 0.55,  sway: 0.25, x: 5.2, y: 0.2, z: -3 },
  education: { make: steps,   color: 'accent', alpha: 0.32, wave: 0, tilt: 0.25, yaw: -0.45, sway: 0.12, x: 3.6, y: 0.2, z: -5 },
  contact:   { make: sun,     color: 'red',    alpha: 0.62, wave: 0, tilt: 0.2,  yaw: 0,     sway: 0.6,  x: 4.6, y: 0.5, z: -2 }
};
const ORDER = ['top', 'work', 'live', 'stack', 'education', 'contact'];

/* ------------------------------------------------------------------------
   Theme colours
   ------------------------------------------------------------------------ */
function readColors(THREE) {
  const cs = getComputedStyle(document.documentElement);
  const triple = name => {
    const parts = cs.getPropertyValue(name).split(',').map(v => parseFloat(v) / 255);
    return new THREE.Color(parts[0] || 0, parts[1] || 0, parts[2] || 0);
  };
  return {
    dot: triple('--globe-dot'),
    accent: new THREE.Color(cs.getPropertyValue('--accent').trim() || '#2c7360'),
    red: new THREE.Color(cs.getPropertyValue('--red').trim() || '#c93c4a')
  };
}

const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a, b, t) => a + (b - a) * t;

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
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'low-power' });
  } catch (e) {
    canvas.remove();
    return;
  }
  renderer.setClearColor(0x000000, 0);

  const N = isSmall() ? 2200 : 4200;
  const shapes = {};
  ORDER.forEach(id => { shapes[id] = FORMS[id].make(N); });

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 60);
  camera.position.set(0, 2.2, 12);
  camera.lookAt(0, 0, 0);

  const from = new Float32Array(shapes.top);
  const to = new Float32Array(shapes.top);
  const seeds = new Float32Array(N);
  const seedRand = rand(99);
  for (let i = 0; i < N; i++) seeds[i] = seedRand();

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
  geometry.setAttribute('aFrom', new THREE.BufferAttribute(from, 3));
  geometry.setAttribute('aTo', new THREE.BufferAttribute(to, 3));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 40);

  const uniforms = {
    uMix: { value: 1 },
    uTime: { value: 0 },
    uWaveFrom: { value: 0 },
    uWaveTo: { value: 0 },
    uSize: { value: 0.05 },
    uScale: { value: 1 },
    uColor: { value: new THREE.Color() },
    uOpacity: { value: 0 }
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    vertexShader: /* glsl */ `
      attribute vec3 aFrom;
      attribute vec3 aTo;
      attribute float aSeed;
      uniform float uMix, uTime, uWaveFrom, uWaveTo, uSize, uScale;
      varying float vFade;
      void main() {
        vec3 p = mix(aFrom, aTo, uMix);
        float w = mix(uWaveFrom, uWaveTo, uMix);
        p.y += w * (0.5 * sin(p.x * 0.5 + uTime * 0.45) * cos(p.z * 0.55 + uTime * 0.32)
                  + 0.2 * sin(p.x * 1.3 - uTime * 0.8 + p.z * 0.45));
        p += 0.035 * vec3(sin(uTime * 0.7 + aSeed * 6.283), cos(uTime * 0.6 + aSeed * 12.0), sin(uTime * 0.5 + aSeed * 3.0));
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * uScale * (0.7 + 0.6 * aSeed) / -mv.z;
        vFade = smoothstep(30.0, 8.0, -mv.z);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying float vFade;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        float a = smoothstep(0.5, 0.15, d);
        gl_FragColor = vec4(uColor, a * uOpacity * (0.35 + 0.65 * vFade));
      }`
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  let colors = readColors(THREE);
  const fromColor = new THREE.Color(), toColor = new THREE.Color();
  let state = { id: 'top', alpha: 0, tilt: 0, yaw: 0, sway: 0, x: 0, y: 0, z: 0 };
  let fromState = { ...state }, target = { ...state };
  let mixT = 1, last = 0, raf = 0;

  function look(id) {
    const f = FORMS[id];
    const small = isSmall();
    return {
      id,
      alpha: f.alpha * (small ? 0.6 : 1),
      tilt: f.tilt,
      yaw: f.yaw,
      sway: f.sway,
      // On phones everything sits centred and further back, behind the text.
      x: small ? 0 : f.x,
      y: f.y,
      z: small ? f.z - 3 : f.z
    };
  }

  function current() {
    const k = easeInOut(mixT);
    return {
      alpha: lerp(fromState.alpha, target.alpha, k),
      tilt: lerp(fromState.tilt, target.tilt, k),
      yaw: lerp(fromState.yaw, target.yaw, k),
      sway: lerp(fromState.sway, target.sway, k),
      x: lerp(fromState.x, target.x, k),
      y: lerp(fromState.y, target.y, k),
      z: lerp(fromState.z, target.z, k)
    };
  }

  function go(id) {
    if (id === target.id) return;
    const k = easeInOut(mixT);
    // Freeze where the points are now, then head for the new shape.
    for (let i = 0; i < from.length; i++) from[i] = from[i] + (to[i] - from[i]) * k;
    to.set(shapes[id]);
    geometry.attributes.aFrom.needsUpdate = true;
    geometry.attributes.aTo.needsUpdate = true;
    uniforms.uWaveFrom.value = lerp(uniforms.uWaveFrom.value, uniforms.uWaveTo.value, k);
    uniforms.uWaveTo.value = FORMS[id].wave;
    fromColor.copy(uniforms.uColor.value);
    toColor.copy(colors[FORMS[id].color]);
    fromState = { ...current(), id: target.id };
    target = look(id);
    mixT = reduceMotion ? 1 : 0;
    kick();
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, isSmall() ? 1.5 : 1.75);
    renderer.setPixelRatio(dpr);
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    uniforms.uScale.value = (window.innerHeight * dpr) / (2 * Math.tan((camera.fov * Math.PI) / 360));
    target = look(target.id);
    kick();
  }

  function frame(now) {
    raf = 0;
    const real = last ? (now - last) / 1000 : 0;
    const dt = Math.min(0.05, real);   // motion step: capped so a stall does not jump
    last = now;
    // Shape changes run on wall-clock time, so slow devices still finish in ~1.6 s.
    if (mixT < 1) mixT = Math.min(1, mixT + Math.min(real, 0.25) / 1.6);
    const k = easeInOut(mixT);
    const s = current();

    if (!reduceMotion) uniforms.uTime.value += dt;
    uniforms.uMix.value = k;
    uniforms.uOpacity.value = s.alpha;
    uniforms.uColor.value.copy(fromColor).lerp(toColor, k);
    points.rotation.set(s.tilt, s.yaw + s.sway * Math.sin(uniforms.uTime.value * 0.12), 0);
    points.position.set(s.x, s.y, s.z);

    renderer.render(scene, camera);

    // Keep animating while visible; with reduced motion, stop once settled.
    const moving = !reduceMotion || mixT < 1;
    if (moving && !document.hidden && (target.alpha > 0 || s.alpha > 0.001)) raf = requestAnimationFrame(frame);
  }

  function kick() {
    if (!raf) {
      last = 0;
      raf = requestAnimationFrame(frame);
    }
  }

  // Which section is in the middle of the screen?
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting && FORMS[e.target.id]) go(e.target.id);
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ORDER.forEach(id => {
    const el = document.getElementById(id);
    if (el) io.observe(el);
  });

  document.addEventListener('themechange', () => {
    colors = readColors(THREE);
    toColor.copy(colors[FORMS[target.id].color]);
    if (mixT >= 1) fromColor.copy(toColor);
    kick();
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) kick(); });
  window.addEventListener('resize', resize);

  uniforms.uColor.value.copy(colors.dot);
  fromColor.copy(colors.dot);
  toColor.copy(colors.dot);
  resize();
  canvas.classList.add('is-on');
}

/* Load only once the visitor heads past the hero (or the browser is idle). */
(function boot() {
  const work = document.getElementById('work');
  if (!work || !('IntersectionObserver' in window)) return;
  let started = false;
  const begin = () => {
    if (started) return;
    started = true;
    start();
  };
  const near = new IntersectionObserver(entries => {
    if (entries.some(e => e.isIntersecting)) {
      near.disconnect();
      begin();
    }
  }, { rootMargin: '0px 0px 60% 0px' });
  near.observe(work);
  if ('requestIdleCallback' in window) requestIdleCallback(begin, { timeout: 6000 });
})();
