# 3D Cyber Dino Runner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate a 3D procedural voxel "Cyber Dino Runner" mini-game into `arcade.html` alongside 3D Bug Blaster, complete with a tab switcher, jump & duck physics, and day/night cycle.

**Architecture:** A self-contained, modular engine in `js/dino-runner.js` styled by `css/dino-runner.css`. High-speed 2.5D side-view in real-time 3D space with procedural voxel meshes. Tab switcher in `arcade.html` toggles between Bug Blaster and Dino Runner, safely pausing the inactive game loop to preserve 60 FPS performance and conserve battery.

**Tech Stack:** Vanilla JavaScript (ES6+), Three.js r128 (CDN loaded in `arcade.html`), Web Audio API, CSS3 Glassmorphism.

## Global Constraints

- Reuses existing Three.js CDN script loaded in `arcade.html`.
- Zero external 3D model files (GLTF/OBJ) or audio files (MP3/WAV) — all procedural.
- Tab switcher must cleanly pause the inactive game loop (`requestAnimationFrame`) so only 1 WebGL context renders at any time.
- Controls must support Desktop (`Space`, `ArrowUp`, `W` to Jump; `ArrowDown`, `S` to Duck) and Mobile (Tap upper area to Jump, tap/hold lower area to Duck).
- High score must persist in `localStorage.getItem('dino_hi_score')`.

---

### Task 1: Create Runner Stylesheet & Tab Bar Styles (`css/dino-runner.css`)

**Files:**
- Create: `css/dino-runner.css`

**Interfaces:**
- Produces: CSS rules for `.arcade-tabs-wrap`, `.arcade-tab-btn`, `.arcade-game-panel`, `.dino-card`, `.dino-hud`, `.dino-viewport`, `.hi-score`, and mobile responsiveness.

- [ ] **Step 1: Write `css/dino-runner.css`**

```css
/* ==========================================================================
   3D Dino Runner & Arcade Tab Switcher Stylesheet
   ========================================================================== */

/* --- Game Tab Switcher --- */
.arcade-tabs-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.arcade-tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.75rem 1.4rem;
  background: rgba(15, 23, 42, 0.75);
  border: 1px solid rgba(59, 130, 246, 0.25);
  border-radius: 0.75rem;
  color: #94a3b8;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.25s ease;
  backdrop-filter: blur(10px);
}

.arcade-tab-btn:hover {
  color: #f8fafc;
  border-color: rgba(59, 130, 246, 0.5);
  background: rgba(30, 41, 59, 0.85);
  transform: translateY(-1px);
}

.arcade-tab-btn.active {
  color: #ffffff;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.4), rgba(16, 185, 129, 0.3));
  border-color: #3b82f6;
  box-shadow: 0 0 20px rgba(37, 99, 235, 0.35);
}

.tab-badge-new {
  font-size: 0.65rem;
  font-weight: 800;
  padding: 0.15rem 0.45rem;
  background: #10b981;
  color: #ffffff;
  border-radius: 9999px;
  letter-spacing: 0.05em;
}

/* --- Panel Visibility --- */
.arcade-game-panel {
  display: block;
  transition: opacity 0.25s ease;
}

.arcade-game-panel.hidden {
  display: none;
}

/* --- Dino Runner HUD & Viewport --- */
.dino-card {
  border-color: rgba(16, 185, 129, 0.28);
  box-shadow: 0 20px 40px -15px rgba(2, 6, 23, 0.7), 0 0 30px -10px rgba(16, 185, 129, 0.25);
}

.dino-hud {
  border-bottom-color: rgba(16, 185, 129, 0.2);
}

.dino-viewport {
  position: relative;
  width: 100%;
  height: 480px;
  background: #090d16;
  overflow: hidden;
  cursor: pointer;
  touch-action: none;
}

#dino-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.hi-score {
  color: #f59e0b;
  text-shadow: 0 0 8px rgba(245, 158, 11, 0.5);
}

/* --- Touch Action Bar for Mobile --- */
.dino-touch-controls {
  display: none;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(10, 15, 29, 0.95);
  border-top: 1px solid rgba(16, 185, 129, 0.2);
}

.btn-dino-touch {
  padding: 0.85rem;
  background: rgba(30, 41, 59, 0.9);
  border: 1px solid rgba(16, 185, 129, 0.35);
  border-radius: 0.5rem;
  color: #ffffff;
  font-weight: 700;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  user-select: none;
}

@media (max-width: 768px) {
  .dino-viewport {
    height: 360px;
  }
  .dino-touch-controls {
    display: grid;
  }
}
```

- [ ] **Step 2: Commit stylesheet**

```bash
git add css/dino-runner.css
git commit -m "feat(dino): add 3D Dino Runner stylesheet and arcade tab switcher styles"
```

---

### Task 2: Build Dino Sound Synthesizer & Physics State in `js/dino-runner.js`

**Files:**
- Create: `js/dino-runner.js`

**Interfaces:**
- Produces: `DinoAudio` procedural Web Audio synthesizer, jump/duck kinematic calculations, score incrementer, speed scaling, and high-score storage.

- [ ] **Step 1: Write `DinoAudio` and State structure in `js/dino-runner.js`**

Implement `DinoAudio` with:
- `jump()`: `160Hz → 460Hz` upward sine sweep (0.08s).
- `milestone()`: 100-point two-tone chime (`587Hz` then `880Hz`).
- `crash()`: Square-wave crash impact (`130Hz → 35Hz`).
- `muted` state synced with `localStorage.getItem('bb_muted')`.

- [ ] **Step 2: Commit audio core**

```bash
git add js/dino-runner.js
git commit -m "feat(dino): create DinoAudio synthesizer and physics state container"
```

---

### Task 3: Build 3D Voxel T-Rex Mesh & Animation Rig

**Files:**
- Modify: `js/dino-runner.js`

**Interfaces:**
- Produces: `createDinoMesh()` returning articulated low-poly T-Rex (torso, snout, eyes, arms, articulated left/right legs), running gait cycler, jump trajectory, duck pose handler.

- [ ] **Step 1: Implement voxel T-Rex geometry and limb rig**

Include:
- Torso, snout, white/dark eye voxels.
- Pivot groups for left and right legs.
- `updateDinoPose(time, isGrounded, isDucking)`:
  - When running: alternating leg swing `sin(time * 18) * 0.7`.
  - When ducking: lower head and torso, flatten legs, tilt body.

- [ ] **Step 2: Commit voxel dino model**

```bash
git add js/dino-runner.js
git commit -m "feat(dino): build 3D procedural voxel T-Rex geometry with articulated leg cycle"
```

---

### Task 4: Build 3D Obstacles (Cacti, Pterodactyls), Parallax Dunes, and Day/Night Cycle

**Files:**
- Modify: `js/dino-runner.js`

**Interfaces:**
- Produces: Procedural 3D voxel cacti (single & cluster), animated flying pterodactyls (with wing flapping), scrolling textured ground, background parallax dunes/clouds, and 500-point day/night transition.

- [ ] **Step 1: Implement obstacle spawner and parallax layers**

Include:
- Single cactus and clustered cacti.
- Pterodactyl with flapping wings (`sin(time * 14) * 0.5`) spawned at high/low altitudes when score > 350.
- Endless scrolling ground with road marks.
- Day/night color interpolation every 500 points (`scene.background` and `scene.fog`).

- [ ] **Step 2: Commit obstacle and environment engine**

```bash
git add js/dino-runner.js
git commit -m "feat(dino): implement 3D cacti, animated pterodactyls, and day-night cycle"
```

---

### Task 5: Implement Physics, Collision Detection, and Input Handlers

**Files:**
- Modify: `js/dino-runner.js`

**Interfaces:**
- Produces: `THREE.Box3` bounding box collision detection, jump kinematics, duck handling, keyboard listeners (`Space`, `ArrowUp`, `ArrowDown`), touch listeners, and game loop.

- [ ] **Step 1: Implement collision loop and game lifecycle**

Include:
- `start()`, `pause()`, `gameOver()`, `reset()`.
- Keyboard event listeners (`keydown`, `keyup` for ducking).
- Touch event listeners for mobile tapping and sliding.
- High score comparison and persistence in `localStorage`.

- [ ] **Step 2: Commit complete Dino Runner engine**

```bash
git add js/dino-runner.js
git commit -m "feat(dino): implement collision detection, jump physics, and game lifecycle"
```

---

### Task 6: Integrate Game Tabs and Dino Runner Panel into `arcade.html`

**Files:**
- Modify: `arcade.html`

**Interfaces:**
- Consumes: `css/dino-runner.css`, `js/dino-runner.js`
- Produces: Game Switcher tab bar (`#tab-blaster`, `#tab-dino`), dual panels (`#panel-blaster`, `#panel-dino`), tab switching event handlers, and script inclusion.

- [ ] **Step 1: Add stylesheet link in `<head>` of `arcade.html`**

```html
<link rel="stylesheet" href="css/dino-runner.css" />
```

- [ ] **Step 2: Add Game Tabs and Panel Markup in `arcade.html`**

Wrap Bug Blaster in `#panel-blaster` and add `#panel-dino` as designed.

- [ ] **Step 3: Add Tab Switcher controller script & load `js/dino-runner.js`**

Include tab toggle logic that pauses the inactive game and unpauses the active game.

- [ ] **Step 4: Commit `arcade.html` integration**

```bash
git add arcade.html
git commit -m "feat(arcade): integrate game switcher tabs and 3D Dino Runner panel"
```

---

### Task 7: End-to-End Verification & Performance Audit

**Files:**
- Modify: `scripts/verify-bug-blaster.js` to verify both games and tab switcher.

- [ ] **Step 1: Run automated verification tests & syntax checks**
- [ ] **Step 2: Commit verified code**

```bash
git add -A
git commit -m "chore(arcade): verify dual-game arcade hub and 3D Dino Runner"
```
