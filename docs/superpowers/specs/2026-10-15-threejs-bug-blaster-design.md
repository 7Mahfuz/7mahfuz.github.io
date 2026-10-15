# 3D Bug Blaster Mini-Game Design Specification

- **Date:** 2026-10-15
- **Author:** Al-Amin Mahfuzur Rahman & Antigravity
- **Target File(s):** `v2.html`, `js/bug-blaster.js`, `css/bug-blaster.css`
- **Dependencies:** Three.js r128 (already loaded in `v2.html`), Web Audio API (native browser)

---

## 1. Overview & Objectives

Add an interactive, high-performance 3D arcade mini-game titled **"Bug Blaster"** to the modern portfolio (`v2.html`). The game provides visitors with a fun, engaging 60–90 second interactive experience where they aim and blast incoming cyber "system bugs" (faceted 3D wireframe drones) in real-time 3D space.

### Key Objectives
1. **Interactive Delight:** Showcases creative technical proficiency in WebGL, 3D graphics, and real-time JavaScript engineering.
2. **Zero Performance Impact on Portfolio:** Uses `IntersectionObserver` to run WebGL and animation loops strictly when the game section is visible and unpaused.
3. **Zero External Asset Overhead:** Relies entirely on procedural Three.js geometries, shaders/materials, and native Web Audio API oscillators for sound effects (no heavy external audio or 3D asset downloads).
4. **Seamless Aesthetic Integration:** Matches the sleek dark glassmorphism, glowing cyber blue/cyan palette, and `JetBrains Mono` typography of Portfolio v2.

---

## 2. Page Placement & Layout

### Section Placement
- Positioned on `v2.html` directly between **Personal Projects** (`#personal-projects`) and **Skills** (`#skills`).
- An item is added to the top floating navigation: `<a class="nav-link" href="#arcade">Arcade</a>`.

### HTML Structure (`v2.html`)
```html
<section class="arcade-section" id="arcade">
  <div class="container">
    <div class="section-badge">
      <i class="fas fa-gamepad"></i>
      <span>Interactive Lab</span>
    </div>
    <h2 class="section-title">3D Bug Blaster</h2>
    <p class="section-subtitle">
      Take a quick break: aim and neutralize incoming system bugs in real-time 3D space.
    </p>

    <div class="arcade-card">
      <!-- Arcade Top HUD -->
      <div class="arcade-hud">
        <div class="hud-group">
          <div class="hud-item">
            <span class="hud-label">SCORE</span>
            <span class="hud-value" id="bb-score">00000</span>
          </div>
          <div class="hud-item">
            <span class="hud-label">STREAK</span>
            <span class="hud-value streak-pill" id="bb-streak">x1</span>
          </div>
        </div>
        <div class="hud-group">
          <div class="hud-item">
            <span class="hud-label">INTEGRITY</span>
            <div class="integrity-bar">
              <div class="integrity-fill" id="bb-integrity" style="width: 100%;"></div>
            </div>
          </div>
          <div class="hud-actions">
            <button type="button" class="arcade-btn" id="bb-mute-btn" title="Toggle Sound" aria-label="Toggle Sound">
              <i class="fas fa-volume-high"></i>
            </button>
            <button type="button" class="arcade-btn" id="bb-pause-btn" title="Pause Game" aria-label="Pause Game">
              <i class="fas fa-pause"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Canvas Viewport -->
      <div class="arcade-viewport" id="arcade-viewport">
        <canvas id="bug-blaster-canvas"></canvas>

        <!-- Custom Reticle -->
        <div class="arcade-crosshair" id="arcade-crosshair">
          <div class="reticle-circle"></div>
          <div class="reticle-dot"></div>
        </div>

        <!-- Overlays: Start Screen & Game Over -->
        <div class="arcade-overlay" id="arcade-overlay">
          <div class="overlay-card">
            <div class="overlay-icon"><i class="fas fa-shield-virus"></i></div>
            <h3 class="overlay-title" id="overlay-title">SYSTEM DEFENSE</h3>
            <p class="overlay-desc" id="overlay-desc">
              Neutralize incoming memory leaks and null-pointers before they compromise system integrity.
            </p>
            <div class="overlay-stats" id="overlay-stats" style="display: none;">
              <div class="stat-box">
                <span class="stat-label">FINAL SCORE</span>
                <span class="stat-num" id="final-score">0</span>
              </div>
              <div class="stat-box">
                <span class="stat-label">MAX STREAK</span>
                <span class="stat-num" id="final-streak">x1</span>
              </div>
            </div>
            <button type="button" class="btn-play-arcade" id="bb-play-btn">
              <i class="fas fa-play"></i>
              <span id="bb-play-text">START MISSION</span>
            </button>
            <span class="overlay-hint">Tip: Click / Tap anywhere to aim & blast. Press Space to Pause.</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
```

---

## 3. Game Engine & 3D Architecture (`js/bug-blaster.js`)

### 3.1 Scene & Camera Setup
- **Renderer:** `THREE.WebGLRenderer` with `alpha: false`, `antialias: true`, background `#090d16`.
- **Camera:** `THREE.PerspectiveCamera(55, width / height, 0.1, 300)` at `(0, 0, 14)`.
- **Lighting:**
  - Ambient Light: `#1e293b` (intensity 1.2)
  - Directional Light: `#60a5fa` from `(5, 10, 7)`
  - Point Light: `#38bdf8` attached near player camera
- **Environment:**
  - Infinite grid floor (`THREE.GridHelper`) scrolling along the Z-axis.
  - Floating background starfield / particle matrix (`THREE.Points`) providing spatial motion cues.

### 3.2 Bug Archetypes
Each enemy is built with procedural Three.js geometries and glowing wireframe/phong materials:
1. **`NullPointer Drone`:**
   - Geometry: `THREE.IcosahedronGeometry(0.9, 1)` with wireframe overlay.
   - Material: Cyber Cyan / Blue (`#0284c7` & `#38bdf8`).
   - Behavior: Moves forward at steady speed; rotates along X and Y axes. 1 hit to destroy.
2. **`MemoryLeak Swarm`:**
   - Geometry: `THREE.OctahedronGeometry(0.65, 0)` with neon purple/magenta accents (`#a855f7`).
   - Behavior: Moves 40% faster with subtle sine-wave bobbing. 1 hit to destroy.
3. **`Syntax Glitch Cube`:**
   - Geometry: `THREE.BoxGeometry(1.2, 1.2, 1.2)` with warning amber/crimson core (`#ef4444`).
   - Behavior: Armored node. Requires 2 hits. On first hit, flashes white and cracks; second hit detonates.

### 3.3 Aiming, Raycasting & Firing Mechanism
1. **Aiming:** Tracks mouse coordinates `(clientX, clientY)` or touch `(touches[0].clientX, touches[0].clientY)` mapped to canvas normalized device coordinates `[-1, 1]`.
2. **Reticle:** CSS reticle aligns with cursor position; a 3D ray projects into the scene to calculate target intersection.
3. **Firing:**
   - Spawns dual laser line bursts (`THREE.Line`) from bottom corners `(-2.5, -3, 8)` and `(2.5, -3, 8)` intersecting the target point.
   - Laser lines expand and decay over 120ms.
   - Checks `raycaster.intersectObjects(activeEnemies)`.
   - If hit: registers damage or destruction, increases streak multiplier, triggers particle shatter and sound.
   - If miss: resets streak multiplier to `x1`.

### 3.4 Volumetric Particle Shatter
When an enemy is destroyed:
- Spawns a particle burst consisting of 30 shrapnel vertices at the enemy's `(x, y, z)`.
- Velocity vectors distributed randomly outward on a sphere with gravity and drag.
- Fades opacity from 1.0 to 0.0 over 500ms before disposal from the scene.
- Brief micro-camera shake (`dx: ±0.06`, `dy: ±0.06` decaying over 80ms) gives tactile impact.

---

## 4. Web Audio Synthesizer (Native Web Audio API)

No audio files to download. Sound is synthesized in real time via an `AudioContext`:
- **Laser Sound:** Rapid downward pitch frequency sweep (`880Hz → 220Hz`) using a sawtooth oscillator and exponential gain decay (0.08s).
- **Explosion Sound:** White-noise buffer created dynamically, fed through a low-pass biquad filter (`600Hz`) with decay (0.35s).
- **Streak Chime:** Musical chord arpeggio (`523.25Hz`, `659.25Hz`, `783.99Hz`) when streak reaches `x3` or `x5`.
- **Integrity Loss / Hit:** Low rumble noise (`110Hz → 45Hz`) when a bug breaches defenses.
- **Mute Control:** State stored in `localStorage.getItem('bb_muted')`. Sound is muted by default until user toggles sound or clicks "Start Mission".

---

## 5. Game Loop, Lifecycle & Performance Optimization

### 5.1 IntersectionObserver & Tab Inactivity
- An `IntersectionObserver` monitors `#arcade`.
- If the section is out of the viewport:
  - Game automatically pauses.
  - `requestAnimationFrame` loop stops.
- When scrolled into view:
  - Only resumes rendering if the game was actively playing and unpaused.
- Page visibility API (`visibilitychange`): pauses game if visitor changes browser tabs.

### 5.2 Memory & Asset Cleanup
- Geometries and materials for particles and destroyed enemies are explicitly disposed (`geometry.dispose()`, `material.dispose()`).
- Object pooling used for laser tracer lines and particle buffers to prevent garbage collection spikes.

---

## 6. Styling & Responsive Design (`css/bug-blaster.css`)

- **Aspect Ratio:** Responsive 16:9 / 18:9 ratio with maximum height `580px`, scaling down smoothly on mobile phones (`360px` height).
- **Card Styling:** Dark glassmorphism (`background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(16px); border: 1px solid rgba(59, 130, 246, 0.2)`).
- **HUD Fonts:** `JetBrains Mono, monospace` with glowing text shadows.
- **Touch Action:** `touch-action: none` on the viewport canvas to prevent screen scrolling while aiming/blasting on mobile devices.

---

## 7. Testing & Verification Plan

1. **Visual & Layout Check:**
   - Verify `#arcade` section renders cleanly between Personal Projects and Skills on desktop, tablet, and mobile viewport widths.
   - Verify navigation link `#arcade` scrolls smoothly to the section.
2. **Gameplay & Mechanics:**
   - Test starting, playing, firing lasers, hitting targets, and streak scaling.
   - Test bug breach behavior (integrity decrease from 100% to 0% and game over screen).
   - Test replayability ("Play Again" button resets state cleanly).
3. **Audio:**
   - Verify sound synthesis on click/tap.
   - Verify Mute/Unmute button toggles sound and remembers setting in `localStorage`.
4. **Performance & Resource Verification:**
   - Verify 60 FPS animation on desktop and mobile.
   - Verify that when scrolling away from `#arcade`, the render loop stops and CPU usage drops to 0%.
   - Verify zero console errors or WebGL warnings.
