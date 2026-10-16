# 3-Way Theme Switcher (Executive Light / Midnight Dark / Cyberpunk Neon) Design Specification

- **Date:** 2026-10-16
- **Author:** Al-Amin Mahfuzur Rahman & Antigravity
- **Target File(s):** `css/v2.css`, `js/theme.js`, `v2.html`, `arcade.html`, `js/v2.js`
- **Dependencies:** None (Native CSS Custom Properties & Vanilla JavaScript)

---

## 1. Overview & Objectives

Implement a comprehensive, instantaneous **3-Way Theme Switcher** across both the Portfolio (`v2.html`) and the Arcade Lab (`arcade.html`), offering three visual aesthetics:
1. **Executive Light:** Crisp enterprise slate with royal blue accents.
2. **Midnight Dark:** Deep obsidian slate (`#090d16`) with high-contrast text and electric azure glow.
3. **Cyberpunk Neon:** Ultra-dark digital void (`#050811`) with glowing neon cyan (`#00f5ff`), hot violet, and synth glass styling.

### Key Objectives
1. **Zero FOUC (Flash of Unstyled Content):** Immediate inline head script resolves saved theme before DOM render.
2. **Persistence & System Sync:** Persists in `localStorage` under `portfolio_theme`, falling back to `prefers-color-scheme`.
3. **Cross-Page Synchronization:** Theme switches seamlessly follow visitors between `v2.html` and `arcade.html`.
4. **Three.js 3D Wireframe Reactivity:** In `v2.js`, the hero 3D wireframe sphere and floating particle cloud automatically re-tint their materials to match the chosen theme in real time.
5. **Polished Navbar UI Widget:** A glassmorphic quick-cycle button with an animated icon transition (`Sun` ☀️ / `Moon` 🌙 / `Cyber Bolt` ⚡) plus a dropdown quick-select menu.

---

## 2. CSS Architecture & Palette Tokens (`css/v2.css`)

### 2.1 CSS Variables Overrides
```css
/* ==========================================================================
   Theme Palettes: Executive Light, Midnight Dark, Cyberpunk Neon
   ========================================================================== */

/* 1. Default Executive Light */
:root, [data-theme="light"] {
  --bg-canvas: #f8fafc;
  --bg-canvas-subtle: #f1f5f9;
  --surface: #ffffff;
  --surface-alt: #f8fafc;
  --surface-border: #e2e8f0;
  --surface-border-subtle: #f1f5f9;
  --surface-hover: #ffffff;
  --text-main: #0f172a;
  --text-muted: #475569;
  --text-light: #64748b;
  --primary: #2563eb;
  --primary-hover: #1d4ed8;
  --primary-subtle: #eff6ff;
  --primary-glow: rgba(37, 99, 235, 0.15);
  --header-bg: rgba(248, 250, 252, 0.85);
}

/* 2. Midnight Dark */
[data-theme="dark"] {
  --bg-canvas: #090d16;
  --bg-canvas-subtle: #0f172a;
  --surface: #0f172a;
  --surface-alt: #1e293b;
  --surface-border: rgba(148, 163, 184, 0.18);
  --surface-border-subtle: rgba(148, 163, 184, 0.1);
  --surface-hover: #1e293b;
  --text-main: #f8fafc;
  --text-muted: #94a3b8;
  --text-light: #64748b;
  --primary: #3b82f6;
  --primary-hover: #60a5fa;
  --primary-subtle: rgba(59, 130, 246, 0.15);
  --primary-glow: rgba(59, 130, 246, 0.3);
  --header-bg: rgba(9, 13, 22, 0.88);
}

/* 3. Cyberpunk Neon */
[data-theme="cyber"] {
  --bg-canvas: #050811;
  --bg-canvas-subtle: #090e1c;
  --surface: rgba(15, 23, 42, 0.92);
  --surface-alt: #0e1628;
  --surface-border: rgba(0, 245, 255, 0.35);
  --surface-border-subtle: rgba(0, 245, 255, 0.18);
  --surface-hover: #131e36;
  --text-main: #ffffff;
  --text-muted: #94a3b8;
  --text-light: #64748b;
  --primary: #00f5ff;
  --primary-hover: #38bdf8;
  --primary-subtle: rgba(0, 245, 255, 0.15);
  --primary-glow: rgba(0, 245, 255, 0.45);
  --accent-purple: #c084fc;
  --header-bg: rgba(5, 8, 17, 0.9);
}
```

---

## 3. Top Navigation Widget Markup (`v2.html` & `arcade.html`)

```html
<div class="theme-switcher-wrap">
  <button type="button" class="theme-toggle-btn" id="theme-toggle-btn" aria-label="Toggle visual theme" title="Switch Theme (Light / Dark / Cyber)">
    <i class="fas fa-sun" id="theme-icon"></i>
    <span class="theme-label-badge" id="theme-label">Light</span>
    <i class="fas fa-angle-down theme-arrow"></i>
  </button>
  
  <div class="theme-dropdown-menu" id="theme-menu">
    <button type="button" class="theme-opt-btn active" data-theme="light">
      <i class="fas fa-sun" style="color: #f59e0b;"></i>
      <span>Executive Light</span>
    </button>
    <button type="button" class="theme-opt-btn" data-theme="dark">
      <i class="fas fa-moon" style="color: #60a5fa;"></i>
      <span>Midnight Dark</span>
    </button>
    <button type="button" class="theme-opt-btn" data-theme="cyber">
      <i class="fas fa-bolt" style="color: #00f5ff;"></i>
      <span>Cyberpunk Neon</span>
    </button>
  </div>
</div>
```

---

## 4. Theme Controller & 3D WebGL Reactivity (`js/theme.js` & `js/v2.js`)

### 4.1 FOUC Prevention Snippet
Injected in `<head>`:
```javascript
(function () {
  try {
    const saved = localStorage.getItem('portfolio_theme');
    const theme = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {}
})();
```

### 4.2 Three.js 3D Wireframe Hero Sync (`js/v2.js`)
Listens for the `themechange` window event and updates:
- Outer wireframe sphere material color
- Inner core node material color
- Particle points cloud color

---

## 5. Testing & Verification Plan

1. **Theme Switching Interactions:**
   - Verify clicking the main button cycles `light` &rarr; `dark` &rarr; `cyber` &rarr; `light`.
   - Verify clicking an option inside the dropdown directly selects that theme.
   - Verify clicking outside or pressing `Escape` closes the dropdown.
2. **Visual & Styling Integrity:**
   - Verify text contrast and card readability in all 3 themes on both desktop and mobile.
   - Verify navbar glassmorphism and background blur adapt properly.
3. **Cross-Page State Persistence:**
   - Change theme on `v2.html`, navigate to `arcade.html`, and confirm theme is preserved with zero FOUC.
   - Change theme on `arcade.html`, return to `v2.html`, and verify persistence.
4. **Three.js 3D Hero Reactivity:**
   - Verify hero 3D wireframe sphere colors adapt dynamically when toggling themes.
