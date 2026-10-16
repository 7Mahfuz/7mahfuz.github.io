# 3D Voxel Dino Runner Mini-Game Design Specification

- **Date:** 2026-10-16
- **Author:** Al-Amin Mahfuzur Rahman & Antigravity
- **Target File(s):** `arcade.html`, `js/dino-runner.js`, `css/dino-runner.css`
- **Dependencies:** Three.js r128 (already loaded in `arcade.html`), Web Audio API (native browser)

---

## 1. Overview & Objectives

Expand the dedicated Arcade Lab (`arcade.html`) by introducing a second high-speed, 3D mini-game: **"3D Cyber Dino Runner"**, inspired by the classic Chrome T-Rex offline runner, reimagined in real-time 3D voxel graphics.

### Key Objectives
1. **Multi-Game Arcade Hub:** Provide a tabbed switcher in `arcade.html` allowing visitors to switch between **3D Bug Blaster** and **3D Dino Runner** with zero page reloads.
2. **Procedural 3D Voxel Assets:** Construct the T-Rex, obstacles (cacti & pterodactyls), and background scenery using procedural Three.js geometries (no external 3D models or textures needed).
3. **Responsive Jump & Duck Physics:** Smooth parabolic jumping, ducking under flying pterodactyls, fast-falling, and forgiving bounding-box collision detection.
4. **Day & Night Atmosphere:** Dynamic day/night horizon cycle transitioning every 500 score points.
5. **Zero External Audio Files:** Procedural Web Audio API sound synthesizer for jump blips, 100-point milestone chimes, and crash impacts.
6. **Battery & Performance Efficiency:** Only the currently selected game executes an animation loop. Switching tabs pauses the inactive game and frees CPU/GPU cycles.

---

## 2. Page Architecture & Tab Switcher (`arcade.html`)

### 2.1 Tab Switcher Layout
In `arcade.html`, above the game stage:
```html
<div class="arcade-tabs-wrap">
  <button type="button" class="arcade-tab-btn active" data-game="blaster" id="tab-blaster">
    <i class="fas fa-crosshairs"></i>
    <span>3D Bug Blaster</span>
  </button>
  <button type="button" class="arcade-tab-btn" data-game="dino" id="tab-dino">
    <i class="fas fa-dragon"></i>
    <span>3D Dino Runner</span>
    <span class="tab-badge-new">NEW</span>
  </button>
</div>
```

### 2.2 Dual Game Panels
```html
<!-- Panel 1: Bug Blaster (Existing) -->
<div class="arcade-game-panel active" id="panel-blaster">
  <section class="arcade-section" id="arcade" style="padding: 0;">
    <!-- Bug Blaster Card & Canvas -->
  </section>
</div>

<!-- Panel 2: 3D Dino Runner (New) -->
<div class="arcade-game-panel hidden" id="panel-dino">
  <div class="arcade-card dino-card">
    <!-- Dino HUD Top Bar -->
    <div class="arcade-hud dino-hud">
      <div class="hud-group">
        <div class="hud-item">
          <span class="hud-label">GAME</span>
          <span class="hud-value" style="color: #10b981;">3D DINO RUN</span>
        </div>
        <div class="hud-item">
          <span class="hud-label">SPEED</span>
          <span class="hud-value" id="dino-speed-val">1.0x</span>
        </div>
      </div>
      <div class="hud-group">
        <div class="hud-item">
          <span class="hud-label">HI</span>
          <span class="hud-value hi-score" id="dino-hi-score">00000</span>
        </div>
        <div class="hud-item">
          <span class="hud-label">SCORE</span>
          <span class="hud-value" id="dino-score">00000</span>
        </div>
        <div class="hud-actions">
          <button type="button" class="arcade-btn" id="dino-mute-btn" title="Toggle Sound" aria-label="Toggle Sound">
            <i class="fas fa-volume-high"></i>
          </button>
          <button type="button" class="arcade-btn" id="dino-pause-btn" title="Pause Game" aria-label="Pause Game">
            <i class="fas fa-pause"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Dino 3D Viewport & Canvas -->
    <div class="arcade-viewport dino-viewport" id="dino-viewport">
      <canvas id="dino-canvas"></canvas>

      <!-- Start & Game Over Overlay -->
      <div class="arcade-overlay" id="dino-overlay">
        <div class="overlay-card">
          <div class="overlay-icon" style="color: #10b981;"><i class="fas fa-dragon"></i></div>
          <h3 class="overlay-title" id="dino-overlay-title">CYBER DINO RUNNER</h3>
          <p class="overlay-desc" id="dino-overlay-desc">
            Leap over 3D cacti and duck under flying pterodactyls across an endless cyber desert.
          </p>
          <div class="overlay-stats" id="dino-overlay-stats" style="display: none;">
            <div class="stat-box">
              <span class="stat-label">DISTANCE</span>
              <span class="stat-num" id="dino-final-score">00000</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">HIGH SCORE</span>
              <span class="stat-num" id="dino-final-hi">00000</span>
            </div>
          </div>
          <button type="button" class="btn-play-arcade" id="dino-play-btn" style="background: linear-gradient(135deg, #059669, #10b981);">
            <i class="fas fa-play"></i>
            <span id="dino-play-text">START RUN</span>
          </button>
          <span class="overlay-hint">Controls: Space / Up / Tap to Jump &bull; Down Arrow to Duck</span>
        </div>
      </div>
    </div>
  </div>
</div>
```

---

## 3. Game Engine & 3D Mechanics (`js/dino-runner.js`)

### 3.1 Camera & Scene
- **Camera:** `PerspectiveCamera(45, width / height, 0.1, 150)` positioned slightly elevated at `(0, 4, 18)` looking toward `(0, 2, 0)`.
- **Directional & Ambient Lighting:** Ambient light `#334155` (1.4), warm directional sun/moon light from `(12, 18, 10)` casting depth onto voxel faces.

### 3.2 3D Voxel T-Rex Character
- **Head & Snout:** Box geometries with stylized eye voxels.
- **Body & Arms:** Torso box with small front arms.
- **Articulated Legs:** Left and right leg groups pivoting from hips. While running on ground, leg rotations oscillate in anti-phase:
  `leftLeg.rotation.x = Math.sin(time * 18) * 0.7;`
  `rightLeg.rotation.x = -Math.sin(time * 18) * 0.7;`
- **Ducking State:** When `isDucking = true`, torso and head tilt forward horizontally, leg stride flattens, and character bounding height decreases by 45%.

### 3.3 Obstacles
1. **3D Voxel Cacti:**
   - Single Column: Main ribbed vertical column with 2 perpendicular branch arms.
   - Cluster: 2–3 cacti grouped together.
2. **3D Low-Poly Pterodactyls (Spawns above 350 score):**
   - Head with beak, body, and two wing meshes.
   - Wing flapping: `wingL.rotation.z = Math.sin(time * 14) * 0.5; wingR.rotation.z = -Math.sin(time * 14) * 0.5;`
   - Spawns at 2 distinct heights:
     - `y = 3.6` (Can be ducked under or jumped over)
     - `y = 1.8` (Must duck under)

### 3.4 Physics & Collision
- **Jump Mechanics:**
  - `vy = 0.48` on jump trigger.
  - `gravity = -0.022` per frame.
  - Ground level `y = 0`. When `pos.y <= 0`, `pos.y = 0`, `vy = 0`, `isGrounded = true`.
- **Fast-Fall:** Pressing `Down Arrow` while airborne accelerates gravity by `2.5x` for rapid landing.
- **Bounding Boxes:** `THREE.Box3` computed per frame for Dino and active obstacles with 10% tolerance padding.

---

## 4. Web Audio Synthesizer (Native Web Audio API)

No audio file downloads:
- **Jump Blip:** Sine oscillator upward sweep (`160Hz → 460Hz` over 0.08s).
- **100-Point Milestone Chime:** Two-tone classic chime (`587Hz` for 0.08s then `880Hz` for 0.12s).
- **Crash Sound:** Square-wave impact rumble (`130Hz → 35Hz` over 0.25s).
- **Mute Sync:** Synchronized with `localStorage.getItem('bb_muted')`.

---

## 5. Lifecycle & Performance Optimization

- Only the currently visible tab's game engine runs `requestAnimationFrame`.
- Tab switcher automatically pauses the inactive game and resets camera aspect ratios when toggling.
- `IntersectionObserver` on the arcade container pauses the active game when scrolled off-screen.

---

## 6. Testing & Verification Plan

1. **DOM & Tab Switching:**
   - Verify tab switcher buttons toggle `.active` and `.hidden` on respective game panels.
   - Verify switching tabs pauses inactive game with zero console warnings.
2. **Dino Gameplay Mechanics:**
   - Jump, duck, and fast-fall respond smoothly to `Space`, `ArrowUp`, `ArrowDown`, and touch taps.
   - 3D cacti and pterodactyls spawn, move leftward, and animate properly.
   - Collision detection triggers game over on contact.
3. **Audio & High Score:**
   - Milestone chime sounds every 100 points.
   - High score persists in `localStorage` across page reloads.
