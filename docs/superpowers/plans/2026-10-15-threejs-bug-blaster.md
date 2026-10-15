# 3D Bug Blaster Mini-Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate a responsive, high-performance 3D "Bug Blaster" target arcade game into `v2.html` between Personal Projects and Skills, powered by Three.js and the native Web Audio API.

**Architecture:** A self-contained, modular arcade engine in `js/bug-blaster.js` styled by `css/bug-blaster.css`. Enemies spawn in a 3D coordinate space with raycaster targeting, dynamic laser line tracers, and volumetric particle shatter. Scene loop is lazily managed via `IntersectionObserver` to ensure zero performance impact when the game is off-screen.

**Tech Stack:** Vanilla JavaScript (ES6+), Three.js r128 (CDN already loaded), Web Audio API (native browser), CSS3 Glassmorphism & Flexbox/Grid.

## Global Constraints

- Must use existing Three.js library loaded via `https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js`.
- Zero external audio file downloads — all sounds must be generated via browser `AudioContext`.
- No disruption to existing `v2.js` or `v2.css` — standalone files `js/bug-blaster.js` and `css/bug-blaster.css` must encapsulate game logic and styles.
- Strict performance: `IntersectionObserver` must pause rendering loop when `#arcade` is not in viewport.
- Mobile friendly: Support touch interactions (`touch-action: none` on canvas, direct tap to shoot).

---

### Task 1: Create Arcade Stylesheet (`css/bug-blaster.css`)

**Files:**
- Create: `css/bug-blaster.css`

**Interfaces:**
- Produces: CSS rules for `.arcade-section`, `.arcade-card`, `.arcade-hud`, `.arcade-viewport`, `#bug-blaster-canvas`, `.arcade-crosshair`, `.arcade-overlay`, and mobile responsiveness breakpoints.

- [ ] **Step 1: Write `css/bug-blaster.css`**

```css
/* ==========================================================================
   3D Bug Blaster Arcade Mini-Game Stylesheet
   Portfolio v2 Cyber Glassmorphic Theme
   ========================================================================== */

.arcade-section {
  padding: 5rem 0;
  position: relative;
  background: radial-gradient(circle at 50% 20%, rgba(37, 99, 235, 0.08) 0%, transparent 70%);
}

.arcade-card {
  position: relative;
  margin-top: 2rem;
  background: rgba(15, 23, 42, 0.88);
  border: 1px solid rgba(59, 130, 246, 0.28);
  border-radius: 1.25rem;
  overflow: hidden;
  box-shadow: 0 20px 40px -15px rgba(2, 6, 23, 0.7), 0 0 30px -10px rgba(37, 99, 235, 0.25);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

/* --- HUD Top Bar --- */
.arcade-hud {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: rgba(10, 15, 29, 0.95);
  border-bottom: 1px solid rgba(59, 130, 246, 0.2);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.875rem;
  user-select: none;
}

.hud-group {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.hud-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.hud-label {
  color: #64748b;
  font-weight: 600;
  letter-spacing: 0.05em;
}

.hud-value {
  color: #38bdf8;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-shadow: 0 0 10px rgba(56, 189, 248, 0.5);
}

.streak-pill {
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.4);
  color: #f59e0b;
  text-shadow: 0 0 8px rgba(245, 158, 11, 0.6);
  font-size: 0.75rem;
}

.integrity-bar {
  width: 120px;
  height: 8px;
  background: rgba(30, 41, 59, 0.8);
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.integrity-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #3b82f6);
  transition: width 0.3s ease, background 0.3s ease;
}

.integrity-fill.danger {
  background: #ef4444;
  box-shadow: 0 0 10px #ef4444;
}

.hud-actions {
  display: flex;
  gap: 0.5rem;
}

.arcade-btn {
  background: rgba(30, 41, 59, 0.7);
  border: 1px solid rgba(59, 130, 246, 0.3);
  color: #94a3b8;
  padding: 0.4rem 0.75rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.arcade-btn:hover {
  color: #f8fafc;
  background: rgba(59, 130, 246, 0.3);
  border-color: #3b82f6;
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.4);
}

/* --- Viewport & Canvas --- */
.arcade-viewport {
  position: relative;
  width: 100%;
  height: 520px;
  background: #090d16;
  overflow: hidden;
  cursor: crosshair;
}

#bug-blaster-canvas {
  width: 100%;
  height: 100%;
  display: block;
  touch-action: none;
}

/* --- Custom Crosshair --- */
.arcade-crosshair {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 32px;
  height: 32px;
  pointer-events: none;
  transform: translate(-50%, -50%);
  display: none;
  z-index: 10;
}

.arcade-viewport:hover .arcade-crosshair {
  display: block;
}

.reticle-circle {
  width: 100%;
  height: 100%;
  border: 2px dashed rgba(56, 189, 248, 0.8);
  border-radius: 50%;
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.6);
  animation: reticleSpin 6s linear infinite;
}

.reticle-dot {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 4px;
  height: 4px;
  background: #38bdf8;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 6px #38bdf8;
}

@keyframes reticleSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* --- Overlays: Start Screen & Game Over --- */
.arcade-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(9, 13, 22, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 20;
  transition: opacity 0.3s ease;
  padding: 1.5rem;
}

.arcade-overlay.hidden {
  opacity: 0;
  pointer-events: none;
}

.overlay-card {
  max-width: 460px;
  width: 100%;
  text-align: center;
  padding: 2.5rem 2rem;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(59, 130, 246, 0.4);
  border-radius: 1rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 35px rgba(37, 99, 235, 0.3);
}

.overlay-icon {
  font-size: 2.75rem;
  color: #38bdf8;
  margin-bottom: 1rem;
  text-shadow: 0 0 20px rgba(56, 189, 248, 0.7);
}

.overlay-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #f8fafc;
  margin-bottom: 0.5rem;
  letter-spacing: 0.05em;
}

.overlay-desc {
  font-size: 0.9rem;
  color: #94a3b8;
  line-height: 1.5;
  margin-bottom: 1.5rem;
}

.overlay-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-box {
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(59, 130, 246, 0.2);
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-family: 'JetBrains Mono', monospace;
}

.stat-label {
  display: block;
  font-size: 0.7rem;
  color: #64748b;
  font-weight: 600;
}

.stat-num {
  font-size: 1.25rem;
  color: #38bdf8;
  font-weight: 700;
}

.btn-play-arcade {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.85rem 1.5rem;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  border: 1px solid #3b82f6;
  border-radius: 0.6rem;
  color: #ffffff;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 0 20px rgba(37, 99, 235, 0.5);
}

.btn-play-arcade:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 30px rgba(59, 130, 246, 0.8);
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}

.overlay-hint {
  display: block;
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 1rem;
}

/* --- Mobile Responsiveness --- */
@media (max-width: 768px) {
  .arcade-viewport {
    height: 380px;
  }
  .hud-group {
    gap: 0.75rem;
  }
  .integrity-bar {
    width: 80px;
  }
  .overlay-card {
    padding: 1.75rem 1.25rem;
  }
}
```

- [ ] **Step 2: Commit stylesheet**

```bash
git add css/bug-blaster.css
git commit -m "feat(arcade): create 3D Bug Blaster arcade styling and HUD layout"
```

---

### Task 2: Build Audio Synthesizer & Game State Core in `js/bug-blaster.js`

**Files:**
- Create: `js/bug-blaster.js`

**Interfaces:**
- Produces: `SoundFX` audio oscillator manager, `GameState` class, and HUD update methods.

- [ ] **Step 1: Write `SoundFX` and `GameState` classes in `js/bug-blaster.js`**

```javascript
/**
 * 3D Bug Blaster - Interactive Three.js Arcade Mini-Game
 * Al-Amin Mahfuzur Rahman | Senior Software Engineer Portfolio
 */

(function () {
  'use strict';

  /* --------------------------------------------------------------------------
     1. Web Audio API Procedural Sound Synthesizer
     -------------------------------------------------------------------------- */
  class SoundFX {
    constructor() {
      this.ctx = null;
      this.muted = localStorage.getItem('bb_muted') === 'true';
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    toggleMute() {
      this.muted = !this.muted;
      localStorage.setItem('bb_muted', this.muted);
      return this.muted;
    }

    playLaser() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.08);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    }

    playExplosion() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.3;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(650, now);
      filter.frequency.exponentialRampToValueAtTime(80, now + 0.28);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(now);
      noise.stop(now + 0.28);
    }

    playStreakChime() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;

      const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const now = this.ctx.currentTime;

      freqs.forEach((f, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + idx * 0.05);

        gain.gain.setValueAtTime(0.12, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.18);
      });
    }

    playDamage() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.2);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    }
  }

  // Export SoundFX to internal scope
  window.__BugBlasterSoundFX = SoundFX;
})();
```

- [ ] **Step 2: Commit sound core**

```bash
git add js/bug-blaster.js
git commit -m "feat(arcade): implement Web Audio API procedural sound synthesizer"
```

---

### Task 3: Build 3D Three.js Scene, Camera, Lighting & Enemy Spawner

**Files:**
- Modify: `js/bug-blaster.js`

**Interfaces:**
- Consumes: Three.js library (`THREE`), `SoundFX`
- Produces: 3D Scene setup, infinite scrolling grid tunnel, starfield, enemy archetypes (`NullPointer`, `MemoryLeak`, `SyntaxGlitch`), and spawn scheduler.

- [ ] **Step 1: Implement Three.js setup and Enemy management in `js/bug-blaster.js`**

Implement `BugBlasterGame` with:
- WebGL renderer, perspective camera at `z: 14`, ambient + directional lights.
- Grid helper moving along Z-axis.
- Enemy pool:
  - `NullPointer Drone`: `THREE.IcosahedronGeometry(0.85, 1)` wireframe cyan.
  - `MemoryLeak Swarm`: `THREE.OctahedronGeometry(0.6, 0)` purple with oscillatory motion.
  - `Syntax Glitch Cube`: `THREE.BoxGeometry(1.2, 1.2, 1.2)` warning crimson with 2 HP.
- Progressive spawn timing: intervals reduce gently as score increases.

- [ ] **Step 2: Commit Three.js scene architecture**

```bash
git add js/bug-blaster.js
git commit -m "feat(arcade): build Three.js 3D grid environment and enemy mesh spawners"
```

---

### Task 4: Implement Targeting, Raycasting, Laser Projectiles & Volumetric Shatter

**Files:**
- Modify: `js/bug-blaster.js`

**Interfaces:**
- Consumes: Mouse/touch coordinates, enemy meshes.
- Produces: Raycaster collision detection, 3D laser line tracers, particle explosion fragment system, camera shake effect, combo streak tracking.

- [ ] **Step 1: Implement raycasting, laser lines, and particle explosion physics**

Include:
- Crosshair positioning on mouse move and touch move.
- `fireAt(ndcX, ndcY)`:
  - Traces dual 3D laser lines from ship bottom `(-2.2, -2.8, 8)` & `(2.2, -2.8, 8)` toward 3D ray target.
  - Intersects `activeEnemies`.
  - On hit:
    - Decrement enemy HP. If 0: spawn 35 shattered fragment particles with radial velocity vectors, dispose enemy mesh, play explosion sound, trigger micro-camera shake (offset ±0.06 decaying over 80ms), increment score (`+100 * streak`) and combo streak.
    - If hit consecutive bugs: sound streak chime at `x3` and `x5`.
  - On miss: reset streak to `x1`.

- [ ] **Step 2: Commit targeting and explosion mechanics**

```bash
git add js/bug-blaster.js
git commit -m "feat(arcade): add raycaster targeting, dual laser tracers, and particle shatter"
```

---

### Task 5: Implement Game Lifecycle, HUD Controls & IntersectionObserver

**Files:**
- Modify: `js/bug-blaster.js`

**Interfaces:**
- Produces: `init()`, `start()`, `pause()`, `gameOver()`, `reset()`, HUD score/streak updates, mute persistence, and lazy `IntersectionObserver` loop.

- [ ] **Step 1: Wire HUD bindings, overlay transitions, and observer**

Include:
- Start button: unhides overlay, initializes audio context, resets health to 100%, score to 0, starts `requestAnimationFrame` loop.
- Integrity loss: When an enemy reaches `z > 4`, player integrity drops by 20%, triggering damage sound. At 0% integrity: `gameOver()`, displays final stats in overlay card.
- Pause toggle: pauses animation loop and displays paused state.
- Mute toggle: updates sound icon (`fa-volume-high` / `fa-volume-xmark`) and stores in `localStorage`.
- `IntersectionObserver`: observes `#arcade`; automatically pauses rendering loop when scrolled out of view and unpauses when scrolled back into view if game was active.
- Window resize handler: updates camera aspect ratio and renderer size.

- [ ] **Step 2: Commit complete game loop**

```bash
git add js/bug-blaster.js
git commit -m "feat(arcade): wire HUD controls, game lifecycle, and IntersectionObserver"
```

---

### Task 6: Integrate Arcade Section and Navigation into `v2.html`

**Files:**
- Modify: `v2.html`

**Interfaces:**
- Consumes: `css/bug-blaster.css`, `js/bug-blaster.js`
- Produces: Navigation item `Arcade` in `.nav-links`, `<section class="arcade-section" id="arcade">` placed between `#personal-projects` and `#skills`, script tag `<script src="js/bug-blaster.js"></script>` before closing body.

- [ ] **Step 1: Add stylesheet link in `<head>` of `v2.html`**

```html
<link rel="stylesheet" href="css/bug-blaster.css" />
```

- [ ] **Step 2: Add navigation link in header of `v2.html`**

```html
<li><a class="nav-link" href="#arcade">Arcade</a></li>
```

- [ ] **Step 3: Insert arcade section between `#personal-projects` and `#skills`**

Insert the full HTML markup specified in the design spec.

- [ ] **Step 4: Add script tag before `</body>` in `v2.html`**

```html
<script src="js/bug-blaster.js"></script>
```

- [ ] **Step 5: Commit `v2.html` integration**

```bash
git add v2.html
git commit -m "feat(portfolio): integrate 3D Bug Blaster arcade section and navigation link"
```

---

### Task 7: Verification & Performance Audit

**Files:**
- Test files / browser checks: `v2.html`, local server test

- [ ] **Step 1: Start local server and test browser interactions**

Verify:
- Page loads with zero console errors.
- Navigating to `#arcade` scrolls cleanly to the section.
- Clicking "START MISSION" initializes Three.js canvas, spawns enemies, and starts movement.
- Clicking/tapping fires dual laser beams with sound and shatters enemies into glowing shrapnel.
- Audio mute toggle works and persists across page refreshes.
- Game pauses cleanly when scrolling away or clicking Pause.
- Game Over screen appears when integrity reaches 0 and "PLAY AGAIN" resets the game cleanly.

- [ ] **Step 2: Commit any final polish or fixes**

```bash
git add -A
git commit -m "chore(arcade): polish responsive layouts and finish verification"
```
