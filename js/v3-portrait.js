/**
 * Portfolio v3 — the contact photo's flip side.
 *
 * Every so often the round photo in Contact flips over to the same face as a
 * halftone of about 5,000 dots, after the Dot portrait in demo/heroes.html
 * (without its world map). The dots re-form into the name, back into the face,
 * and the card flips back. The dots scatter away from the cursor, and hovering
 * the circle holds it where it is.
 *
 * Drawn on a 2D canvas from the data below: neither shape is read back from a
 * canvas at run time, because browsers with canvas anti-fingerprinting hand
 * back blank pixels. With reduced motion the photo stays put; nothing runs
 * while the card is off screen.
 */

// Photo: 96 × 96 grayscale from assets/img/portrait.jpg, one byte per pixel.
const PORTRAIT = 'wsPExMTEw8LCwsPExMbHx8fHyMrJycnKysrKyMjHxsbGxsbHx8rJycrJy8zNzc7NzczLysjHxsXFxcXFxMLAvr29vby+v8LDwcPBwb++vr69ubi4uLe3t7i4ubi4t7WzxMTExMXFxcXFxcTExcbHycnKysrKysrKy8vLycfHx8jHx8fHyMrKysrKy8zNzc3Ozc3My8nIx8bFxsXEwsG/vby9vr6/wsTExMTDwsC/v7++u7q4uLe2tre3uLi3t7SyxMXExMXFxcXGxcXGx8fJysrKysvKy8vLy8vLycfIysvJyMjIysvKysvKzM3Nzc3NzM3NzMrIx8bHxsXDwcHBv76+v8DCxMbGxsbEw8HAwcC/vbq5uLe2tra4ubi3t7WzxMXExMXFxcbGxsbHyMnKy8rKy8vKy8vMzMzLysnJysvKycnKy8vLy8vKysrLzM/Rzs3MzMrIx8bGxcTEwsHBwcDBwcLExcfIx8fGxMPAwcC/vbu5uLi4uLi4ubm4uLazxMXExMXHx8jIyMfIycnLy8vMy8zMzMzNzc3MzMvKysvKysrLysrKyszR09TV08i+w8vMycjGx8bFxcTEwsHDw8HCw8TGx8jIyMjGxcPDwsC+vby7ubi5ubm5uLm5uLWzxcbFxcfHx8rKycnKy8vLy8vMzc3Nzc3Nzc3NzMzLy8vMzMzO0NLQzMWwn5F7SjNCa5G1y9DMxsXFxcTExMTExMPExcbHx8nKysrHxsTDwsDAvr28ubm5ubq5ubm4uLazxsfHx8jIycnKy8vLzMzMy8vNzs7Ozs7NzM3Nzc3NzM3OzdLQvZ+Kclc8MDEfGhghKzRRepCmw8rHxcXGxcXFxcTFxsfJycrKy8vIx8XEwsHBv767urq5ubq6ubq4uLa0yMnIycrKy8rLzMzNzM3Nzc3Ozs/R0M3Nzc3MzM3Ozc7O1Kt2SUI7NDM1ODYrNjUxKSw5Ojs+b5SwxMXExcbGx8bGxsnLy8vMy8rIx8fGxMPCwL67u7u7uru8u7u5uLa1ysvLy8vLy8rKy8vMzMzMzc7Oz9HS0M3NzczMzc3Pzs/WoUQuMTUzNS8qJiMnJisgKS8wOkJBQj1RdY65yMbGxsfIycrKy8vLy8vJx8fFxcTCwL69vby8vby+vbu5uLe2ysvKy8vLy8rKy8vMzMzMzc7Pz9HR0M7NzczNzs7Pz9SpQjI6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9e/v5rpTHxsgJyouKSUuLCotLzQyLBg6n8nf7PD19exKBRUXGx8fISQjIR8fHx8kGxQbHB0eHiAhICAiOzo2MzU0LiwrKSUlKCckHx4cFxcgHB0eISgpJiYkIRsXAG7/+/788OrcfyIhKzE2OzdAQkRFQj09KTWm1t/t9ff39uBABhYXGB0gIiMhISAgHyERCBcaGhscHR0gHx4hMTAxMCwqKikqKCUlJSMgHhwaGB8iHyEjJCgnJyUlHRkbA1f//v//+vLv45w/Kj5GSkVRU1NUTko5QKvf5+/1+vnz9NtACBYWFhodICQhHR8kIwwCEhoYGRsbHR0fHx4fKy0vLigpKScnJigmJSEeHhsYGSMeHyQnKisoJyYiGxoYCUD3//7///317u7OdzxEUllZXV9aWUxEt+vp8PP3+vfz8ttJCRkYGRoaGxwfHiAgDQYSFxsZGBoaHB4eHB4eKCoqKCcnKCclJCUmIyAdHBsXIyEcHyMkKCooJiIgHxkYDCnb//7////8+PP26qdWR1xhZmdpXkyz8Ovx9Pj49/X17thTChoZGhkXGRsbHRoHCxgWGh4bGxsaHB4cGxweKSkmJSYkJSUlJSMjIR8eHBsXGCMiIiElJiopHx4eHRsaESHE//7////+/fr29fbUjl1cZWdnZrv48PP1+fn59/b38NlXCxkYGRkbGRobHBcRGBcYGx8dHB0cGx0eHRscKCclJSQkJiQlJSQhHx8dHRsXCgshJSUpKSUgHx8cHR0dEiK7//7///////78/Pr68sp/aH+Azf31+fr6+vn49/f48uBfChoYGRodGhkbGhocHBkWGRodHh4cGhkcHRwcJSYlJCYmJyMjIiMhHh4dHBoYFQoJIConIx0fIB0dHh4eFCS3/v/////////////+/9rT2OTy//v7+/z7+/r5+fn48uZkDBsYGBobGhsbGRcXGhwbGRcZHR8bHBsbHB0dJCUlJSUmJiIgIB4gHh0eGhgbGRcQCRkgIB0cHR8fHh0aFSSx+f///////////v/6wKTK7e////7+/fz7+/r6+vn58+hjDRwYGBkaGRwbGRkYGBkaHB8eGx0eGxgZHB0dIyUmKCQlJiIeHBwfGxoZGBsdHxoaGBciIBwdHSIgHhscGCKu8f/+///////+//nc0PL18OLk+f///v78/Pv6+vn59epmDxwaGBoZGxwcGxwZFhkaGRsgFhYaGhgaHB0cIiIjJSUlIiIfHR0cGxwXGBwbICEiIB4dHCAgICEeHBwdGh2o7v/+////////9t/z//7+/frt4+/////+/fz7+vn49u93Dh4cGRkZGxscHRwaGRkZGhsbERQZGxkaHR0cISAiIyQkHx8eHR0aGxoVGRoeIh8eHR4cHx8eHyEgHBsbGhmf7v7////////2yu///v///v39+ejj+/79/v78+/v69/OHDRwaGxwcHBscHBsZGRkaHB4cDxcZGRsaGhsc';
// Name: "Mahfuz" in Bricolage Grotesque 800 at 118px on a 420 × 140 canvas,
// sampled every 3px into a 140 × 47 bitmask (bit k is column k % 140, row k / 140).
const NAME = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAcAAAAAAAAAAAAAAAAAPwAA/wMAAAAAAMD/APwHAADwAwD4fwAAAAAAAPwPwH8AAAA/AMD/BwAAAAAAwP8A/AcAAPADAPx/AAAAAAAA/B/gfwAAAD8AwP8DAAAAAADA/wH+BwAA8AMA/DkAAAAAAAD8H+B/AP8AP3zADwAAAAAAAMD/Af4H/D/w8x98AH/gz/9/APw/8H/g/we//4MP8Af+/P8HwO8D/wf///D7P/ABf+DP/38A/D7wf/j/D///5//3B/78/wfA74fvhz/88f9//n9/4M//fwD8fPh++IEf3/Dn//cH/gD4B8DPh++HD/jxBX7+f3/gD8A/APz8eH7wwB9f4Of/9wf+AP4BwM/P5wfA//EHfvADf+AP8A8A/Ph8fsD/Hz/gBz/wB/6AfwDAj8/jB///8QN+8AN/4A/8AwD8+D1++I8fP+AHP/AH/uAfAMAP/+PHH/jxA37wA3/gD/8AAPzwP378gB8/4Ac/4Af/+AcAwA//4ccP9PEDfvADfvjPPwAA/OAffvxgHz/gBz/g//38/wfAD/7hx//38QN+8AP+38//fwD84A9+/D8fP+AHP+D//fz/B8AP/uCH//PxA37wA/zPz/9/APzAD374Dx8/4Ac/gH/8/P8HAAAAAAA+AAAAAAAA4AEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==';

const MOTION = !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
const EXTENT = 1.16;              // world units from the centre to each edge, as framed in the demo
const MORPH = 2400;
// One turn of the card, in ms: what shows, for how long, and the dot shape it ends on.
const STEPS = [
  { side: 'photo', ms: 5000 },
  { side: 'dots', ms: 900 + 2200, shape: 0 },   // the flip, then the dotted face
  { side: 'dots', ms: MORPH, shape: 1 },        // face → name
  { side: 'dots', ms: 3000, shape: 1 },
  { side: 'dots', ms: MORPH, shape: 0 },        // name → face
  { side: 'dots', ms: 1200, shape: 0 }
];
const TAU = Math.PI * 2;
const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function rng(seed) {
  return function () {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Dots as { x, y, s }: position in world units (y up) and diameter.
function photoDots() {
  const raw = atob(PORTRAIT), N = 96, out = [];
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const l = raw.charCodeAt(j * N + i) / 255;
    const d = Math.pow(clamp((0.72 - l) / 0.6, 0, 1), 0.85);
    if (d < 0.05 || i < 2 || i > 93) continue;
    out.push({ x: ((i + 0.5) / N) * 2 - 1, y: 1 - ((j + 0.5) / N) * 2, s: 0.0225 * Math.sqrt(d) });
  }
  return out;
}

function nameDots() {
  const raw = atob(NAME), cols = 140, rows = 47, sx = 2.1 / 420, out = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const k = r * cols + c;
    if (raw.charCodeAt(k >> 3) & (1 << (k & 7))) out.push({ x: (c * 3 - 210) * sx, y: -(r * 3 - 70) * sx, s: 0.017 });
  }
  return out;
}

function start() {
  const flip = document.querySelector('[data-flip]');
  const canvas = flip && flip.querySelector('[data-dots]');
  if (!MOTION || !canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');

  // Both shapes share one set of dots. Shuffle each so dots travel to random
  // places, and give the shorter one invisible (size 0) dots to match.
  const r = rng(5), shapes = [photoDots(), nameDots()];
  const N = Math.max(shapes[0].length, shapes[1].length);
  const packed = shapes.map(list => {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    const pos = new Float32Array(N * 2), size = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const q = a[i % a.length];
      pos[i * 2] = q.x; pos[i * 2 + 1] = q.y;
      size[i] = i < a.length ? q.s : 0;
    }
    return { pos, size };
  });
  // Per dot: a start delay, and a direction to bulge in while travelling.
  const delay = new Float32Array(N), bx = new Float32Array(N), by = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const v = r();
    delay[i] = v * 0.35;
    bx[i] = Math.sin(v * 40) * 0.14;
    by[i] = Math.cos(v * 53) * 0.14;
  }

  let W = 0, H = 0, colour = '';
  let step = 0, clock = 0, last = 0, from = packed[0], to = packed[0];
  const mouse = { x: 9, y: 9, tx: 9, ty: 9, at: 0 };
  let raf = 0, visible = false, hovered = false, dirty = true;

  // The dot colour comes from the canvas itself (--dots), so the dot side can
  // keep its own colours in the dark theme.
  function readColour() {
    const m = getComputedStyle(canvas).getPropertyValue('--dots').match(/[\d.]+/g) || [0, 0, 0];
    colour = `rgba(${m[0]}, ${m[1]}, ${m[2]}, 0.92)`;
    dirty = true;
  }

  function resize() {
    const w = canvas.offsetWidth, h = canvas.offsetHeight;
    if (!w) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = w;
    H = h;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dirty = true;
  }

  function draw(k) {
    if (!W) return;
    const scale = Math.min(W, H) / 2 / EXTENT, cx = W / 2, cy = H / 2;
    const push = mouse.x < 5;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = colour;
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const e = ease(clamp((k - delay[i]) / 0.65, 0, 1));
      const s = from.size[i] + (to.size[i] - from.size[i]) * e;
      if (s < 0.002) continue;
      const bulge = Math.sin(Math.PI * e);
      let x = from.pos[i * 2] + (to.pos[i * 2] - from.pos[i * 2]) * e + bulge * bx[i];
      let y = from.pos[i * 2 + 1] + (to.pos[i * 2 + 1] - from.pos[i * 2 + 1]) * e + bulge * by[i];
      // Dots part around the cursor.
      if (push) {
        const dx = x - mouse.x, dy = y - mouse.y, d = Math.hypot(dx, dy);
        if (d < 0.3 && d > 1e-5) {
          const t = 1 - d / 0.3, f = t * t * (3 - 2 * t) * 0.12;
          x += (dx / d) * f;
          y += (dy / d) * f;
        }
      }
      const px = cx + x * scale, py = cy - y * scale, rad = s * 0.5 * scale;
      ctx.moveTo(px + rad, py);
      ctx.arc(px, py, rad, 0, TAU);
    }
    ctx.fill();
  }

  // Move to step i: flip the card when the side changes, and set up the dots.
  function enter(i) {
    const prev = STEPS[step], next = STEPS[i];
    step = i;
    clock = 0;
    if (next.side === 'dots') {
      from = prev.side === 'dots' ? packed[prev.shape] : packed[next.shape];
      to = packed[next.shape];
      dirty = true;
    }
    flip.classList.toggle('is-flipped', next.side === 'dots');
  }

  function frame(now) {
    raf = 0;
    if (!visible || document.hidden) {
      last = 0;
      return;
    }
    const dt = last ? Math.min(100, now - last) : 16;
    last = now;
    // Hovering the circle holds it where it is.
    if (!hovered) clock += dt;
    if (clock >= STEPS[step].ms) enter((step + 1) % STEPS.length);
    const cur = STEPS[step];
    if (cur.side === 'dots') {
      const morphing = from !== to;
      const k = morphing ? clamp(clock / MORPH, 0, 1) : 1;
      if (morphing) dirty = true;
      // Ease the cursor in; it lets go at once when it leaves.
      if (mouse.tx < 5) {
        mouse.x += (mouse.tx - mouse.x) * 0.25;
        mouse.y += (mouse.ty - mouse.y) * 0.25;
      } else {
        mouse.x = mouse.tx;
        mouse.y = mouse.ty;
      }
      if (now - mouse.at < 800) dirty = true;
      if (dirty) {
        draw(k);
        dirty = false;
      }
    }
    raf = requestAnimationFrame(frame);
  }

  function kick() {
    if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame);
  }

  readColour();
  resize();
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
  document.addEventListener('themechange', readColour);
  document.addEventListener('visibilitychange', kick);
  flip.addEventListener('pointerenter', () => { hovered = true; });
  flip.addEventListener('pointerleave', () => { hovered = false; });
  window.addEventListener('pointermove', ev => {
    const rect = canvas.getBoundingClientRect();
    const x = ((ev.clientX - rect.left) / rect.width * 2 - 1) * EXTENT;
    const y = -((ev.clientY - rect.top) / rect.height * 2 - 1) * EXTENT;
    const near = Math.abs(x) < EXTENT + 0.3 && Math.abs(y) < EXTENT + 0.3;
    if (!near && mouse.tx > 5) return;
    mouse.tx = near ? x : 9;
    mouse.ty = near ? y : 9;
    mouse.at = performance.now();
  }, { passive: true });
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    kick();
  }).observe(flip);
}

start();
