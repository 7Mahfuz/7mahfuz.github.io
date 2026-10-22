/**
 * Portfolio v3 — hero globe looks.
 *
 * The hero globe cross-fades through three looks, one every second tour stop:
 *
 *   flag      the 2D canvas globe in js/v3.js: a red sun over green land
 *   daynight  live sunlight, the line between day and night, city lights after dark
 *   kantha    land sewn in running stitches, routes in red thread, a flower over Dhaka
 *
 * The two WebGL looks are ports of demo/globes.html (same camera, shaders and
 * values) drawn on their own canvases under the 2D one, each with its own chips
 * for Dhaka and the active stop. The 2D globe keeps the tour and drag, and fades
 * out (labels too) while another look is showing. Three.js is shared with
 * js/v3-backdrop.js and loaded after the page. With reduced motion, or without
 * WebGL, the flag globe stays on its own.
 */

const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';

const ORDER = ['flag', 'daynight', 'kantha'];
const STOPS_PER_LOOK = 2;
const FADE_MS = 1400;
const CAM_D = 4.2;           // camera distance, in globe radii (as in the demo)

const DEG = Math.PI / 180, TAU = Math.PI * 2;
const DHAKA = { lat: 23.81, lon: 90.41 };

// Big cities for the night lights: [lat, lon, weight].
const CITIES = [
  [23.81, 90.41, 1.4], [22.57, 88.36, 1.2], [28.61, 77.21, 1.3], [19.08, 72.88, 1.3], [24.86, 67.0, 1.1],
  [31.55, 74.34, 0.9], [13.08, 80.27, 0.9], [12.97, 77.59, 0.9], [39.9, 116.4, 1.3], [31.23, 121.47, 1.4],
  [22.54, 114.06, 1.2], [35.68, 139.69, 1.5], [34.69, 135.5, 1.0], [37.57, 126.98, 1.2], [14.6, 120.98, 1.0],
  [13.76, 100.5, 1.0], [-6.21, 106.85, 1.2], [1.35, 103.82, 0.8], [3.14, 101.69, 0.8], [10.82, 106.63, 0.9],
  [21.03, 105.85, 0.8], [35.69, 51.39, 1.0], [24.71, 46.68, 0.9], [25.2, 55.27, 0.9], [41.01, 28.98, 1.1],
  [30.04, 31.24, 1.2], [6.52, 3.38, 1.0], [-1.29, 36.82, 0.6], [-26.2, 28.05, 0.9], [33.57, -7.59, 0.6],
  [55.76, 37.62, 1.2], [59.93, 30.34, 0.8], [51.51, -0.13, 1.2], [48.86, 2.35, 1.1], [52.52, 13.4, 0.9],
  [40.42, -3.7, 0.9], [41.9, 12.5, 0.8], [45.46, 9.19, 0.8], [52.37, 4.9, 0.8], [50.85, 4.35, 0.7],
  [53.48, -2.24, 0.7], [40.71, -74.0, 1.4], [34.05, -118.24, 1.3], [41.88, -87.63, 1.1], [37.77, -122.42, 1.0],
  [47.61, -122.33, 0.8], [29.76, -95.37, 1.0], [33.75, -84.39, 0.9], [25.76, -80.19, 0.9], [38.9, -77.04, 0.9],
  [42.36, -71.06, 0.8], [43.65, -79.38, 0.9], [45.5, -73.57, 0.7], [19.43, -99.13, 1.2], [4.71, -74.07, 0.8],
  [-12.05, -77.04, 0.8], [-23.55, -46.63, 1.3], [-22.91, -43.17, 1.0], [-34.6, -58.38, 1.0], [-33.45, -70.67, 0.8],
  [-33.87, 151.21, 0.9], [-37.81, 144.96, 0.8], [-27.47, 153.03, 0.5], [37.34, -121.89, 0.9], [34.17, -118.61, 0.6]
];

/* ------------------------------------------------------------------------
   Pure helpers
   ------------------------------------------------------------------------ */
const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const wrapLon = lon => ((((lon + 180) % 360) + 360) % 360) - 180;
const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
function hash(a, b) { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); }
function rng(seed) {
  return function () {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function gauss(r) { let u = 0; while (!u) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * r()); }

// Land grid from the same run-length string as the 2D globe (see js/v3.js).
function decodeGrid(str) {
  const rows = str.split('|');
  const [lat0, step] = rows[0].split(',').map(parseFloat);
  const out = [];
  for (let r = 1; r < rows.length; r++) {
    const [cs, rs] = rows[r].split(':');
    const cells = parseInt(cs, 36), land = new Uint8Array(cells);
    let j = 0, on = false;
    for (const run of rs.split('.')) {
      const n = parseInt(run, 36);
      if (on) land.fill(1, j, j + n);
      j += n;
      on = !on;
    }
    out.push({ lat: lat0 + (r - 1) * step, cells, land });
  }
  return { lat0, step, rows: out };
}

// Approximate subsolar point for a date.
function subsolar(d) {
  const doy = (d - Date.UTC(d.getUTCFullYear(), 0, 0)) / 864e5;
  const decl = -23.44 * Math.cos((TAU / 365) * (doy + 10));
  const B = (TAU * (doy - 81)) / 364;
  const eot = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
  const utcH = d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600;
  return { lat: decl, lon: wrapLon(-15 * (utcH - 12 + eot / 60)) };
}

const fmtCache = {};
function fmtTime(tz, d) {
  try {
    fmtCache[tz] = fmtCache[tz] || new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
    return fmtCache[tz].format(d);
  } catch (e) {
    return '';
  }
}

/* ------------------------------------------------------------------------
   Shaders (from demo/globes.html). Transparent ones write premultiplied colour,
   so glows stay glows on a see-through canvas over a light page.
   ------------------------------------------------------------------------ */
const LIGHT = 'normalize(vec3(-0.45, 0.55, 0.72))';
const SPHERE_VS = `
  varying vec3 vN; varying vec3 vV; varying vec3 vObj;
  void main() {
    vObj = normalize(position);
    vN = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }`;
const DN_FS = `
  uniform vec3 uSun; uniform vec3 uDay; uniform vec3 uNight; uniform vec3 uTwi; uniform vec3 uGlow;
  varying vec3 vN; varying vec3 vV; varying vec3 vObj;
  void main() {
    float s = dot(vObj, uSun);
    float day = smoothstep(-0.1, 0.1, s);
    float l = clamp(dot(vN, ${LIGHT}) * 0.5 + 0.5, 0.0, 1.0);
    vec3 c = mix(uNight, uDay * (0.88 + 0.2 * l), day);
    c = mix(c, uTwi, exp(-pow(s / 0.07, 2.0)) * 0.45);
    float f = pow(1.0 - max(dot(vN, vV), 0.0), 2.6);
    gl_FragColor = vec4(mix(c, uGlow, f * 0.25), 1.0);
  }`;
const KANTHA_FS = `
  uniform vec3 uCloth; uniform vec3 uShade;
  varying vec3 vN; varying vec3 vV; varying vec3 vObj;
  void main() {
    float lon = atan(vObj.x, vObj.z);
    float lat = asin(clamp(vObj.y, -1.0, 1.0));
    float weave = 0.5 + 0.5 * sin(lon * 260.0) * sin(lat * 260.0);
    float l = clamp(dot(vN, ${LIGHT}) * 0.5 + 0.5, 0.0, 1.0);
    vec3 c = mix(uShade, uCloth, smoothstep(0.15, 0.85, l)) * (0.97 + 0.045 * weave);
    c *= mix(0.86, 1.0, smoothstep(0.0, 0.5, max(dot(vN, vV), 0.0)));
    gl_FragColor = vec4(c, 1.0);
  }`;
const HALO_VS = `varying vec2 vP; void main() { vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const HALO_FS = `
  uniform vec3 uColor; uniform float uStrength; uniform float uWidth; uniform float uEdge;
  varying vec2 vP;
  void main() {
    float k = clamp(1.0 - (length(vP) - uEdge) / uWidth, 0.0, 1.0);
    float a = pow(k, 2.2) * uStrength;
    gl_FragColor = vec4(uColor * a, a);
  }`;
const DOT_VS = `
  uniform float uScale; uniform float uTime; uniform vec3 uSun; uniform float uTwinkle;
  attribute vec3 aColor; attribute float aSize; attribute float aAlpha;
  varying vec3 vColor; varying float vAlpha; varying float vFace; varying float vDay;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vec3 dir = normalize(position + vec3(1e-6));
    vFace = dot(normalize(normalMatrix * dir), normalize(-mv.xyz));
    vDay = dot(dir, uSun);
    vColor = aColor;
    vAlpha = aAlpha;
    if (uTwinkle > 0.5) vAlpha *= 0.72 + 0.28 * sin(uTime * 2.2 + position.x * 41.0 + position.y * 23.0);
    gl_PointSize = aSize * uScale / -mv.z;
    gl_Position = projectionMatrix * mv;
  }`;
const DOT_FS = `
  uniform float uShape; uniform float uFaceMin; uniform float uFlat;
  uniform float uDN; uniform float uNightMode; uniform vec3 uNightColor;
  varying vec3 vColor; varying float vAlpha; varying float vFace; varying float vDay;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float a = 1.0;
    if (uShape < 0.5) { if (d > 0.5) discard; a = smoothstep(0.5, 0.36, d); }
    else if (uShape > 1.5) { if (d > 0.5) discard; a = exp(-d * d * 14.0); }
    if (uFlat < 0.5 && vFace < -0.05) discard;
    float face = uFlat > 0.5 ? 1.0 : smoothstep(-0.02, 0.55, vFace);
    vec3 col = vColor;
    float alpha = vAlpha * a * mix(uFaceMin, 1.0, face);
    if (uDN > 0.5) {
      float day = smoothstep(-0.1, 0.1, vDay);
      if (uNightMode < 0.5) { col = mix(uNightColor, vColor, day); alpha *= mix(0.55, 1.0, day); }
      else alpha *= 1.0 - day;
    }
    gl_FragColor = vec4(col * alpha, alpha);
  }`;
// Thread for kantha stitches and petals: a twisted capsule drawn in the shader, laid
// out like a 64 × 16 texture. It used to be a canvas texture, but browsers with
// canvas anti-fingerprinting upload a blank canvas, which erased every stitch.
const STITCH_VS = `
  varying vec2 vUv; varying vec3 vColor;
  void main() {
    vUv = uv;
    vColor = vec3(1.0);
    #ifdef USE_INSTANCING_COLOR
      vColor = instanceColor;
    #endif
    vec4 p = vec4(position, 1.0);
    #ifdef USE_INSTANCING
      p = instanceMatrix * p;
    #endif
    gl_Position = projectionMatrix * modelViewMatrix * p;
  }`;
const STITCH_FS = `
  varying vec2 vUv; varying vec3 vColor;
  void main() {
    vec2 p = vec2(vUv.x * 64.0, (1.0 - vUv.y) * 16.0);
    float dx = max(max(8.0 - p.x, p.x - 56.0), 0.0);
    if (length(vec2(dx, p.y - 8.0)) > 7.0) discard;
    // The twist: diagonal stripes, averaged out once they're too fine to draw.
    float s = mod(p.x - (16.0 - p.y) * 0.5, 6.0);
    float stripe = mix(step(s, 2.2), 0.37, smoothstep(0.6, 1.4, fwidth(p.x)));
    float shade = p.y < 7.2 ? mix(0.25, 0.0, p.y / 7.2) : mix(0.0, 0.3, (p.y - 7.2) / 8.8);
    gl_FragColor = vec4(vColor * (1.0 - 0.16 * stripe) * (1.0 - shade), 1.0);
  }`;
const ARC_VS = `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const ARC_FS = `
  uniform vec3 uColor; uniform vec3 uColor2; uniform vec3 uActive; uniform float uUseActive; uniform vec3 uHeadColor;
  uniform float uOpacity; uniform float uIdle; uniform float uBoost;
  uniform float uDash; uniform float uDashRatio;
  uniform float uHeads; uniform float uSpeed; uniform float uPhase; uniform float uTail; uniform float uHeadAlpha;
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    float u = vUv.x;
    if (uDash > 0.0 && fract(u * uDash) > uDashRatio) discard;
    vec3 c = mix(mix(uColor, uColor2, u), uActive, uBoost * uUseActive);
    float a = uOpacity * mix(uIdle, 1.0, uBoost);
    float h = 0.0;
    for (int k = 0; k < 4; k++) {
      if (float(k) >= uHeads) break;
      float pos = fract(uTime * uSpeed + uPhase + float(k) / max(uHeads, 1.0));
      float dd = pos - u;
      if (dd >= 0.0 && dd < uTail) h = max(h, pow(1.0 - dd / uTail, 2.0));
    }
    h *= uHeadAlpha;
    float o = max(a, h);
    gl_FragColor = vec4(mix(c, uHeadColor, h) * o, o);
  }`;

/* ------------------------------------------------------------------------
   Looks
   ------------------------------------------------------------------------ */
function makeLooks(THREE, hero, U) {
  const V3 = THREE.Vector3, C = THREE.Color, Z = new V3(0, 0, 1);
  // Colours go in and come out as written (the renderer outputs without conversion).
  const hex = s => new C().setStyle(s, THREE.LinearSRGBColorSpace);

  const vec = (lat, lon, r = 1) => {
    const p = lat * DEG, l = lon * DEG;
    return new V3(Math.cos(p) * Math.sin(l) * r, Math.sin(p) * r, Math.cos(p) * Math.cos(l) * r);
  };
  const DHAKA_V = vec(DHAKA.lat, DHAKA.lon);

  const GRID = decodeGrid(hero.land);
  function isLand(lat, lon) {
    const r = Math.round((lat - GRID.lat0) / GRID.step);
    if (r < 0 || r >= GRID.rows.length) return false;
    const row = GRID.rows[r];
    return row.land[Math.min(row.cells - 1, Math.floor(((wrapLon(lon) + 180) / 360) * row.cells))] === 1;
  }
  const CELLS = [];
  GRID.rows.forEach(row => {
    for (let c = 0; c < row.cells; c++) {
      if (row.land[c]) CELLS.push({ lat: row.lat, lon: -180 + ((c + 0.5) * 360) / row.cells });
    }
  });
  const LAND_V = CELLS.map(c => vec(c.lat, c.lon));

  function cityLights() {
    const r = rng(11), out = [];
    CITIES.forEach(([la, lo, w]) => {
      const n = Math.round(22 * w);
      for (let k = 0; k < n; k++) {
        const core = k === 0;
        const lat = core ? la : la + gauss(r) * 0.75 * w;
        const lon = core ? lo : lo + (gauss(r) * 0.95 * w) / Math.max(0.3, Math.cos(la * DEG));
        if (!core && !isLand(lat, lon) && r() < 0.75) continue;
        out.push({ lat, lon, core, s: core ? 0.05 * w : 0.016 + r() * 0.02, a: core ? 0.95 : 0.35 + r() * 0.5 });
      }
    });
    CELLS.forEach(c => {
      if (Math.abs(c.lat) > 62 || hash(c.lat, c.lon) > 0.05) return;
      out.push({ lat: c.lat + hash(c.lon, c.lat) - 0.5, lon: c.lon + hash(c.lat * 2, c.lon) - 0.5, s: 0.012, a: 0.22 + hash(c.lon * 3, c.lat) * 0.3 });
    });
    return out;
  }
  const lightDots = (s = 1) => cityLights().map(l => ({ p: vec(l.lat, l.lon, 1.004), c: hex(l.core ? '#fff1cf' : '#ffc56e'), s: l.s * s, a: l.a }));

  function themePalette() {
    const cs = getComputedStyle(document.documentElement);
    const col = name => {
      const v = cs.getPropertyValue(name).trim();
      if (v.startsWith('#')) return hex(v);
      const m = v.match(/[\d.]+/g) || [0, 0, 0];
      return new C(+m[0] / 255, +m[1] / 255, +m[2] / 255);
    };
    return {
      mid: col('--globe-disc-mid'), glow: col('--globe-glow'), dot: col('--globe-dot'),
      arc: col('--globe-arc'), red: col('--red'),
      dark: document.documentElement.getAttribute('data-theme') === 'dark'
    };
  }

  /* Building blocks */
  const sphereMesh = (fs, uniforms) =>
    new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), new THREE.ShaderMaterial({ vertexShader: SPHERE_VS, fragmentShader: fs, uniforms }));
  // A soft ring of light just outside the globe's edge (camera-facing).
  function halo(color, strength, width, additive) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.ShaderMaterial({
      uniforms: { uColor: { value: color }, uStrength: { value: strength }, uWidth: { value: width }, uEdge: U.uEdge },
      vertexShader: HALO_VS, fragmentShader: HALO_FS, transparent: true, premultipliedAlpha: true, depthWrite: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending
    }));
    mesh.renderOrder = -1;
    return mesh;
  }
  // items: [{ p: Vector3, c: Color, s: size (world units), a: alpha }]
  function dots(items, o = {}) {
    const n = items.length;
    const pos = new Float32Array(n * 3), colr = new Float32Array(n * 3), size = new Float32Array(n), alpha = new Float32Array(n);
    items.forEach((it, i) => {
      pos[i * 3] = it.p.x; pos[i * 3 + 1] = it.p.y; pos[i * 3 + 2] = it.p.z;
      colr[i * 3] = it.c.r; colr[i * 3 + 1] = it.c.g; colr[i * 3 + 2] = it.c.b;
      size[i] = it.s; alpha[i] = it.a;
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aColor', new THREE.BufferAttribute(colr, 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    g.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1));
    const pts = new THREE.Points(g, new THREE.ShaderMaterial({
      uniforms: {
        uScale: U.uScale, uTime: U.uTime,
        uShape: { value: o.shape || 0 }, uFaceMin: { value: o.faceMin || 0 }, uFlat: { value: o.flat ? 1 : 0 },
        uSun: o.sun || { value: new V3(0, 0, 1) }, uDN: { value: o.dayNight ? 1 : 0 },
        uNightMode: { value: o.nightMode || 0 }, uNightColor: { value: o.nightColor || new C(0, 0, 0) },
        uTwinkle: { value: o.twinkle ? 1 : 0 }
      },
      vertexShader: DOT_VS, fragmentShader: DOT_FS, transparent: true, premultipliedAlpha: true, depthWrite: false,
      blending: o.additive ? THREE.AdditiveBlending : THREE.NormalBlending
    }));
    pts.frustumCulled = false;
    return pts;
  }
  function arcPoints(a, b, h, n = 96) {
    const omega = a.angleTo(b), s = Math.sin(omega), pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const p = s < 1e-6 ? a.clone() : a.clone().multiplyScalar(Math.sin((1 - t) * omega) / s).add(b.clone().multiplyScalar(Math.sin(t * omega) / s));
      pts.push(p.normalize().multiplyScalar(1.002 + h * Math.sin(Math.PI * t)));
    }
    return pts;
  }
  const clientsOf = () => hero.stops.map((s, i) => (s.to ? { i, n: vec(s.to.lat, s.to.lon) } : null)).filter(Boolean);
  // Routes out of Dhaka as tubes: dashes, a one-off highlight sweep, or looping packets.
  function arcsFrom(parent, st) {
    const arcs = clientsOf().map(c => {
      const pts = arcPoints(DHAKA_V, c.n, 0.06 + (0.36 * DHAKA_V.angleTo(c.n)) / Math.PI);
      const curve = new THREE.CatmullRomCurve3(pts);
      const u = {
        uTime: U.uTime, uColor: { value: st.color }, uColor2: { value: st.color2 || st.color },
        uActive: { value: st.active || st.color }, uUseActive: { value: st.active ? 1 : 0 },
        uHeadColor: { value: st.head || new C(1, 1, 1) },
        uOpacity: { value: st.opacity ?? 1 }, uIdle: { value: st.idle ?? 0.5 }, uBoost: { value: 0 },
        uDash: { value: st.dashDensity ? st.dashDensity * curve.getLength() : 0 }, uDashRatio: { value: st.dashRatio || 0.55 },
        uHeads: { value: 0 }, uSpeed: { value: 0 }, uPhase: { value: 0 }, uTail: { value: st.tail || 0.22 }, uHeadAlpha: { value: 1 }
      };
      parent.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 140, st.radius, 6, false), new THREE.ShaderMaterial({
        uniforms: u, vertexShader: ARC_VS, fragmentShader: ARC_FS, transparent: true, premultipliedAlpha: true, depthWrite: false,
        blending: st.additive ? THREE.AdditiveBlending : THREE.NormalBlending
      })));
      return { idx: c.i, u, target: 0, sweep: -1 };
    });
    return {
      setActive(i, now) {
        arcs.forEach(a => {
          a.target = a.idx === i ? 1 : 0;
          if (a.idx === i && !st.packets) a.sweep = now + 700;
        });
      },
      update(now, dt) {
        arcs.forEach(a => {
          const u = a.u;
          u.uBoost.value += (a.target - u.uBoost.value) * Math.min(1, dt * 0.006);
          if (st.packets) {
            u.uHeads.value = st.packets; u.uSpeed.value = st.speed; u.uPhase.value = a.idx * 0.137;
            u.uHeadAlpha.value = st.packetAlpha + (1 - st.packetAlpha) * u.uBoost.value;
          } else if (a.sweep > 0) {
            const p = (now - a.sweep) / 1300;
            if (p < 0) u.uHeads.value = 0;
            else if (p < 1.35) {
              u.uHeads.value = 1; u.uSpeed.value = 0; u.uPhase.value = Math.min(p, 0.999);
              u.uHeadAlpha.value = p < 1 ? 1 : Math.max(0, 1 - (p - 1) / 0.35);
            } else { u.uHeads.value = 0; a.sweep = -1; }
          }
        });
      }
    };
  }
  function pinDot(parent, n, color, r = 0.012, lift = 1.004) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), new THREE.MeshBasicMaterial({ color }));
    m.position.copy(n).normalize().multiplyScalar(lift);
    parent.add(m);
    return m;
  }
  // An expanding ring that fades out, lying flat on the surface at n.
  function pulse(parent, n, color, o = {}) {
    const mesh = new THREE.Mesh(new THREE.RingGeometry(0.8, 1, 48), new THREE.MeshBasicMaterial({
      color, transparent: true, premultipliedAlpha: true, depthWrite: false, side: THREE.DoubleSide,
      blending: o.additive ? THREE.AdditiveBlending : THREE.NormalBlending
    }));
    const dir = n.clone().normalize();
    mesh.quaternion.setFromUnitVectors(Z, dir);
    mesh.position.copy(dir.multiplyScalar(1.004));
    parent.add(mesh);
    return {
      mesh, on: o.on ?? true, size: o.size || 0.07, alpha: o.alpha ?? 0.6, period: o.period || 2200, offset: o.offset || 0,
      update(now) {
        const k = (now / this.period + this.offset) % 1;
        mesh.scale.setScalar(this.size * (0.12 + 0.88 * k));
        mesh.material.opacity = this.on ? this.alpha * (1 - k) * (1 - k) : 0;
      }
    };
  }
  function tangent(n) {
    const d = n.clone().normalize();
    const up = Math.abs(d.y) > 0.98 ? new V3(1, 0, 0) : new V3(0, 1, 0);
    const e = new V3().crossVectors(up, d).normalize();
    return { e, n: new V3().crossVectors(d, e).normalize(), d };
  }
  // Instanced quads lying on the sphere: { p, n, ang (radians from east), len, w, c }.
  function quads(list, mat) {
    const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), mat, list.length);
    const m = new THREE.Matrix4();
    list.forEach((q, i) => {
      const { e, n, d } = tangent(q.n);
      const ca = Math.cos(q.ang || 0), sa = Math.sin(q.ang || 0);
      const ax = e.clone().multiplyScalar(ca).addScaledVector(n, sa).multiplyScalar(q.len);
      const ay = e.clone().multiplyScalar(-sa).addScaledVector(n, ca).multiplyScalar(q.w);
      m.makeBasis(ax, ay, d);
      m.setPosition(q.p);
      mesh.setMatrixAt(i, m);
      mesh.setColorAt(i, q.c);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.frustumCulled = false;
    return mesh;
  }
  // Thread with a twist, for stitches and petals (see STITCH_FS).
  const stitchMaterial = () => new THREE.ShaderMaterial({
    vertexShader: STITCH_VS, fragmentShader: STITCH_FS, extensions: { derivatives: true }, depthWrite: false
  });
  // Dhaka pin + pulse, a pin per client, and a pulse on the active one.
  function withPins(globe, arcs, o) {
    pinDot(globe, DHAKA_V, o.home, o.homeR || 0.016);
    const homeP = pulse(globe, DHAKA_V, o.home, { size: 0.1, alpha: 0.5, additive: o.additive });
    const pins = clientsOf().map(c => {
      pinDot(globe, c.n, o.pin, o.pinR || 0.011);
      return { i: c.i, ring: pulse(globe, c.n, o.pin, { size: 0.075, additive: o.additive, on: false }) };
    });
    return {
      pins,
      update(now, dt) { arcs.update(now, dt); homeP.update(now); pins.forEach(p => p.ring.update(now)); },
      setStop(i, now) { arcs.setActive(i, now); pins.forEach(p => { p.ring.on = p.i === i; }); }
    };
  }
  function base() {
    const scene = new THREE.Scene(), globe = new THREE.Group();
    scene.add(globe);
    return { scene, globe };
  }

  // Day / night: live sunlight, the terminator and city lights on the night side.
  function buildDayNight() {
    const P = themePalette(), { scene, globe } = base();
    const sun = { value: new V3(0, 0, 1) };
    scene.add(halo(P.glow, P.dark ? 0.18 : 0.24, 0.3));
    globe.add(sphereMesh(DN_FS, { uSun: sun, uDay: { value: P.mid }, uNight: { value: hex(P.dark ? '#0a121a' : '#17252f') }, uTwi: { value: hex('#f0a35e') }, uGlow: { value: P.glow } }));
    globe.add(dots(LAND_V.map(p => ({ p: p.clone().multiplyScalar(1.003), c: P.dot, s: 0.0165, a: 0.85 })), { faceMin: 0.35, sun, dayNight: true, nightColor: hex('#56717f') }));
    globe.add(dots(lightDots(0.9), { shape: 2, additive: true, sun, dayNight: true, nightMode: 1 }));
    const ring = [];
    for (let k = 0; k < 180; k++) { const t = (k / 180) * TAU; ring.push(new V3(Math.cos(t) * 1.004, Math.sin(t) * 1.004, 0)); }
    const term = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ring, true), 240, 0.0032, 6, true), new THREE.MeshBasicMaterial({ color: hex('#e8893a'), transparent: true, premultipliedAlpha: true, opacity: 0.85, depthWrite: false }));
    globe.add(term);
    const sunDot = new THREE.Mesh(new THREE.SphereGeometry(0.022, 20, 14), new THREE.MeshBasicMaterial({ color: hex('#ffbf2e') }));
    globe.add(sunDot);
    const sunRing = pulse(globe, Z, hex('#ffbf2e'), { size: 0.13, alpha: 0.75, period: 2600 });
    const arcs = arcsFrom(globe, { radius: 0.0042, color: P.arc, idle: 0.45, opacity: 0.95, head: new C(1, 1, 1) });
    const V = withPins(globe, arcs, { home: P.red, pin: P.red });
    const baseUpdate = V.update;
    let lastSun = -Infinity;
    V.update = (now, dt) => {
      baseUpdate(now, dt);
      if (now - lastSun > 10000) {
        lastSun = now;
        const ss = subsolar(new Date());
        sun.value.copy(vec(ss.lat, ss.lon));
        term.quaternion.setFromUnitVectors(Z, sun.value);
        sunDot.position.copy(sun.value).multiplyScalar(1.014);
        sunRing.mesh.position.copy(sun.value).multiplyScalar(1.005);
        sunRing.mesh.quaternion.setFromUnitVectors(Z, sun.value);
      }
      sunRing.update(now);
    };
    // Chips show each place's local time and whether it's day or night there.
    const isDay = ll => vec(ll.lat, ll.lon).dot(sun.value) > 0;
    V.chipSub = s => `${s.place} · ${fmtTime(s.tz, new Date())} · ${isDay(s.to) ? 'day' : 'night'}`;
    V.homeSub = () => `${fmtTime('Asia/Dhaka', new Date())} · ${isDay(DHAKA) ? 'day' : 'night'}`;
    return Object.assign(V, { scene, globe });
  }

  // Nakshi kantha: running stitches on cloth, red-thread routes, a stitched flower.
  function buildKantha() {
    const { scene, globe } = base();
    const CLOTH = hex('#f6eedc'), SHADE = hex('#d8c7a3'), RED = hex('#b3261e'), INDIGO = hex('#27407e'), MUSTARD = hex('#d3961c'), GREEN = hex('#3d7a4a');
    const SEA = CLOTH.clone().lerp(INDIGO, 0.3);
    globe.add(sphereMesh(KANTHA_FS, { uCloth: { value: CLOTH }, uShade: { value: SHADE } }));
    const mat = stitchMaterial();
    const stitches = [];
    GRID.rows.forEach((row, r) => {
      const lat = row.lat, cl = Math.cos(lat * DEG);
      const n = Math.max(6, Math.floor((360 * cl) / 1.6)), step = 360 / n, off = (r % 2) * step * 0.5;
      for (let k = 0; k < n; k++) {
        const lon = -180 + off + (k + 0.5) * step;
        if (isLand(lat, lon)) {
          const coast = !isLand(lat, lon + step) || !isLand(lat, lon - step) || !isLand(lat + GRID.step, lon) || !isLand(lat - GRID.step, lon);
          const h = hash(lat, lon);
          const p = vec(lat, lon, 1.0035);
          stitches.push({ p, n: p, ang: 0, len: step * 0.64 * DEG * cl, w: 0.0068, c: coast ? INDIGO : h < 0.06 ? MUSTARD : h < 0.13 ? GREEN : RED });
        } else if (r % 2 === 0) {
          // Kantha-style wavy rows across the sea.
          const p = vec(lat + 0.55 * Math.sin(lon * DEG * 18), lon, 1.003);
          const ang = Math.atan2(0.55 * 18 * DEG * Math.cos(lon * DEG * 18), cl);
          stitches.push({ p, n: p, ang, len: step * 0.5 * DEG * cl, w: 0.0045, c: SEA });
        }
      }
    });
    globe.add(quads(stitches, mat));
    const { e, n: north } = tangent(DHAKA_V);
    const petals = [];
    for (let k = 0; k < 8; k++) {
      const t = (k / 8) * TAU, t2 = t + Math.PI / 8;
      const d1 = e.clone().multiplyScalar(Math.cos(t)).addScaledVector(north, Math.sin(t));
      const d2 = e.clone().multiplyScalar(Math.cos(t2)).addScaledVector(north, Math.sin(t2));
      petals.push({ p: DHAKA_V.clone().addScaledVector(d1, 0.03).normalize().multiplyScalar(1.006), n: DHAKA_V, ang: t, len: 0.042, w: 0.017, c: RED });
      petals.push({ p: DHAKA_V.clone().addScaledVector(d2, 0.017).normalize().multiplyScalar(1.007), n: DHAKA_V, ang: t2, len: 0.022, w: 0.01, c: MUSTARD });
    }
    globe.add(quads(petals, mat));
    pinDot(globe, DHAKA_V, INDIGO, 0.007, 1.008);
    const crosses = [];
    const pins = clientsOf().map(c => {
      [Math.PI / 4, -Math.PI / 4].forEach(a => crosses.push({ p: c.n.clone().multiplyScalar(1.006), n: c.n, ang: a, len: 0.04, w: 0.009, c: INDIGO }));
      return { i: c.i, ring: pulse(globe, c.n, MUSTARD, { size: 0.07, alpha: 0.8, on: false, period: 2600 }) };
    });
    globe.add(quads(crosses, mat));
    const arcs = arcsFrom(globe, { radius: 0.0052, color: RED, active: MUSTARD, head: MUSTARD, idle: 0.75, opacity: 1, dashDensity: 40, dashRatio: 0.6 });
    const homeP = pulse(globe, DHAKA_V, RED, { size: 0.12, alpha: 0.35, period: 3000 });
    return {
      scene, globe,
      update(now, dt) { arcs.update(now, dt); homeP.update(now); pins.forEach(p => p.ring.update(now)); },
      setStop(i, now) { arcs.setActive(i, now); pins.forEach(p => { p.ring.on = p.i === i; }); },
      homeTitle: 'ঢাকা · Dhaka',
      homeSub: () => 'Home, Bangladesh'
    };
  }

  return { vec, build: { daynight: buildDayNight, kantha: buildKantha } };
}

function disposeScene(scene) {
  scene.traverse(o => {
    if (o.geometry) o.geometry.dispose();
    const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
    mats.forEach(m => { if (m.map) m.map.dispose(); m.dispose(); });
  });
}

/* ------------------------------------------------------------------------
   Start
   ------------------------------------------------------------------------ */
function whenHero() {
  return new Promise(resolve => {
    if (window.v3Hero) resolve(window.v3Hero);
    else document.addEventListener('v3hero', () => resolve(window.v3Hero), { once: true });
  });
}

function afterLoad() {
  return new Promise(resolve => {
    const go = () => (window.requestIdleCallback ? requestIdleCallback(resolve, { timeout: 2500 }) : setTimeout(resolve, 600));
    if (document.readyState === 'complete') go();
    else window.addEventListener('load', go, { once: true });
  });
}

async function start() {
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const hero = await whenHero();
  if (!hero || !hero.motion) return;
  await afterLoad();

  let THREE;
  try {
    THREE = await import(THREE_URL);
  } catch (e) {
    return; // offline or blocked CDN: the flag globe carries on alone
  }

  const g = hero.globe;
  const flat = g.canvas;
  // Two WebGL layers, so one look can fade into the next. Each has its own chips.
  const layers = [];
  for (let k = 0; k < 2; k++) {
    const canvas = document.createElement('canvas');
    canvas.className = 'globe-look';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.opacity = '0';
    flat.before(canvas);
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch (e) {
      layers.forEach(l => { l.renderer.dispose(); l.canvas.remove(); l.chips.remove(); });
      canvas.remove();
      return;
    }
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    renderer.setClearColor(0x000000, 0);
    const chips = document.createElement('div');
    chips.className = 'globe-chips';
    chips.setAttribute('aria-hidden', 'true');
    chips.style.opacity = '0';
    flat.parentNode.appendChild(chips);
    layers.push({ canvas, renderer, chips, chipEls: {}, look: null, alpha: 0 });
  }

  const U = {
    uTime: { value: 0 }, uScale: { value: 1000 }, uEdge: { value: 1.03 }
  };
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200);
  camera.position.set(0, 0, CAM_D);
  camera.lookAt(0, 0, 0);

  // The demo's camera, with the field of view chosen so the globe's edge lands
  // on the 2D disc (radius g.R in a canvas of g.w × g.h).
  function size() {
    if (!g.w || !g.R) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    layers.forEach(l => { l.renderer.setPixelRatio(dpr); l.renderer.setSize(g.w, g.h, false); });
    const tanHalf = Math.tan(Math.asin(1 / CAM_D)) * (g.h / 2) / g.R;
    camera.fov = (2 * Math.atan(tanHalf)) / DEG;
    camera.aspect = g.w / g.h;
    camera.updateProjectionMatrix();
    U.uScale.value = layers[0].renderer.getDrawingBufferSize(new THREE.Vector2()).y / (2 * tanHalf);
    U.uEdge.value = CAM_D / Math.sqrt(CAM_D * CAM_D - 1);
  }

  size();
  const { vec, build } = makeLooks(THREE, hero, U);
  const looks = {};
  let stop = Math.max(0, hero.index());
  function buildAll() {
    Object.keys(looks).forEach(k => disposeScene(looks[k].scene));
    ORDER.slice(1).forEach(k => {
      looks[k] = build[k]();
      looks[k].setStop(stop, performance.now());
    });
  }
  buildAll();

  /* Chips: Dhaka plus the active stop, as in the demo. */
  const tmp = new THREE.Vector3();
  function anchor(lk, ll) {
    const lift = 1.012;
    tmp.copy(vec(ll.lat, ll.lon, lift)).applyMatrix4(lk.globe.matrixWorld);
    const opacity = clamp((tmp.z / lift - 1 / CAM_D + 0.05) / 0.12, 0, 1);
    tmp.project(camera);
    return { x: (tmp.x * 0.5 + 0.5) * g.w, y: (-tmp.y * 0.5 + 0.5) * g.h, opacity };
  }
  function chipsFor(lk) {
    const act = hero.stops[stop] || hero.stops[0];
    const items = [{ id: 'home', ll: DHAKA, active: !act.to, title: lk.homeTitle || 'Dhaka', sub: lk.homeSub ? lk.homeSub() : 'Home base, Bangladesh' }];
    if (act.to) items.push({ id: 'stop', ll: act.to, active: true, title: act.tag, sub: lk.chipSub ? lk.chipSub(act) : act.place });
    return items;
  }
  function renderChips(l, lk) {
    // Chips stay inside the stage box (the canvas overhangs it on every side).
    const inset = g.labelInset || 0;
    const x0 = g.w * inset + 4, x1 = g.w * (1 - inset) - 4, y0 = g.h * inset + 4, y1 = g.h * (1 - inset) - 4;
    const seen = {};
    chipsFor(lk).forEach(it => {
      seen[it.id] = true;
      let el = l.chipEls[it.id];
      if (!el) {
        el = document.createElement('div');
        el.className = 'globe-chip';
        el.append(document.createElement('b'), document.createElement('span'));
        l.chips.appendChild(el);
        l.chipEls[it.id] = el;
      }
      if (el._t !== it.title) { el.firstChild.textContent = it.title; el._t = it.title; }
      if (el._s !== it.sub) { el.lastChild.textContent = it.sub; el._s = it.sub; }
      el.classList.toggle('is-active', it.active);
      const a = anchor(lk, it.ll);
      const ew = el.offsetWidth, eh = el.offsetHeight;
      let right = a.x >= g.w * 0.5;
      // Flip sides rather than let the chip slide back over its own pin.
      if (right && a.x + 12 + ew > x1) right = false;
      else if (!right && a.x - 12 - ew < x0) right = true;
      const cx = clamp(right ? a.x + 12 : a.x - 12 - ew, x0, x1 - ew);
      const cy = clamp(a.y - eh - 8, y0, y1 - eh);
      el.style.transform = `translate(${cx.toFixed(1)}px, ${cy.toFixed(1)}px)`;
      el.style.opacity = a.opacity.toFixed(2);
    });
    Object.keys(l.chipEls).forEach(id => { if (!seen[id]) l.chipEls[id].style.opacity = '0'; });
  }

  let current = 0;           // index into ORDER
  let advances = 0;
  let fade = null;           // { from, to, t0 }

  function show(next, now) {
    if (next === current) return;
    const key = ORDER[next];
    if (key !== 'flag') {
      // Reuse a layer already showing this look, else the one not in use.
      const busy = ORDER[current];
      const l = layers.find(x => x.look === key) || layers.find(x => x.look !== busy) || layers[0];
      if (l.look !== key) {
        l.look = key;
        l.chips.setAttribute('data-look', key);
      }
    }
    fade = { from: current, to: next, t0: now };
    current = next;
  }

  hero.onStop = (i, now) => {
    stop = i;
    ORDER.slice(1).forEach(k => looks[k].setStop(i, now));
  };
  hero.onAdvance = now => {
    advances++;
    if (advances % STOPS_PER_LOOK === 0) show((current + 1) % ORDER.length, now);
  };

  let last = 0, lastW = 0, lastH = 0;
  hero.onFrame = now => {
    const dt = last ? Math.min(64, now - last) : 16;
    last = now;
    if (g.w !== lastW || g.h !== lastH) { lastW = g.w; lastH = g.h; size(); }

    // Fade weights: the flag lives on the 2D canvas, the rest on the WebGL layers.
    const k = fade ? easeInOut(clamp((now - fade.t0) / FADE_MS, 0, 1)) : 1;
    const weight = key => {
      if (!fade) return ORDER[current] === key ? 1 : 0;
      return (ORDER[fade.to] === key ? k : 0) + (ORDER[fade.from] === key ? 1 - k : 0);
    };
    if (fade && k >= 1) fade = null;
    g.bodyAlpha = weight('flag');

    U.uTime.value = now / 1000;
    layers.forEach(l => {
      l.alpha = l.look ? weight(l.look) : 0;
      const o = l.alpha.toFixed(3);
      l.canvas.style.opacity = o;
      l.chips.style.opacity = o;
      if (l.alpha <= 0.001) return;
      const lk = looks[l.look];
      lk.globe.rotation.set(g.view.lat * DEG, -g.view.lon * DEG, 0);
      lk.update(now, dt);
      lk.scene.updateMatrixWorld();
      l.renderer.render(lk.scene, camera);
      renderChips(l, lk);
    });
  };

  // Theme colours feed the day / night look.
  document.addEventListener('themechange', buildAll);
}

start();
