# 3-Way Theme Switcher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate a 3-Way Theme Switcher (Executive Light, Midnight Dark, Cyberpunk Neon) into `v2.html` and `arcade.html`, with zero FOUC, persistent `localStorage` state, and reactive Three.js 3D hero scene color synchronization.

**Architecture:** Data-attribute-driven CSS custom properties in `css/v2.css` (`[data-theme="dark"]`, `[data-theme="cyber"]`). A standalone `js/theme.js` manages cycle/dropdown interactions and fires `themechange` events. Inline `<head>` script applies theme before DOM paint. `js/v2.js` dynamically tints the 3D wireframe mesh materials on theme change.

**Tech Stack:** Vanilla JavaScript (ES6+), CSS Custom Properties (CSS variables), Three.js r128 material updates.

## Global Constraints

- Zero flash of unstyled content (FOUC): inline `<head>` snippet must execute synchronously before body render.
- Seamless persistence in `localStorage.getItem('portfolio_theme')` shared across `v2.html` and `arcade.html`.
- Responsive navbar widget: fits cleanly on desktop, tablet, and mobile displays.
- High contrast and readability across all 3 themes (Executive Light, Midnight Dark, Cyberpunk Neon).

---

### Task 1: Add Theme Variables & Widget Styling to `css/v2.css`

**Files:**
- Modify: `css/v2.css`

**Interfaces:**
- Produces: `[data-theme="dark"]` and `[data-theme="cyber"]` variable overrides, `.theme-switcher-wrap`, `.theme-toggle-btn`, `.theme-dropdown-menu`, `.theme-opt-btn`, and smooth theme transitions.

- [ ] **Step 1: Add CSS variable overrides and theme widget styles in `css/v2.css`**

Add tokens for `[data-theme="dark"]` and `[data-theme="cyber"]`, plus styling for `.theme-switcher-wrap` and its dropdown menu.

- [ ] **Step 2: Commit stylesheet changes**

```bash
git add css/v2.css
git commit -m "feat(theme): add dark and cyber theme CSS tokens and navbar widget styling"
```

---

### Task 2: Build Theme Controller Script (`js/theme.js`)

**Files:**
- Create: `js/theme.js`

**Interfaces:**
- Produces: `ThemeManager` class handling theme cycle (`light` -> `dark` -> `cyber`), dropdown toggling, keyboard accessibility, `localStorage` persistence, and `themechange` event dispatch.

- [ ] **Step 1: Write `js/theme.js`**

Implement `ThemeManager` with:
- `applyTheme(theme, save = true)`: updates `data-theme` on `<html>`, updates active icon and label text in all buttons, updates dropdown checkmarks, dispatches `themechange`.
- `cycleTheme()`: cycles to next theme in sequence.
- Outside-click & `Escape` key handlers to close dropdown.

- [ ] **Step 2: Commit theme controller script**

```bash
git add js/theme.js
git commit -m "feat(theme): create ThemeManager controller script with event dispatch and persistence"
```

---

### Task 3: Integrate FOUC Prevention & Widget into `v2.html`

**Files:**
- Modify: `v2.html`

**Interfaces:**
- Produces: Head inline script in `v2.html`, theme switcher widget in `.nav-actions`, and `<script src="js/theme.js"></script>` before closing body.

- [ ] **Step 1: Add inline FOUC prevention script to `<head>` of `v2.html`**

```html
<script>
  (function(){try{var t=localStorage.getItem('portfolio_theme')||(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.setAttribute('data-theme',t);}catch(e){}})();
</script>
```

- [ ] **Step 2: Add theme switcher widget in `.nav-actions` of `v2.html`**
- [ ] **Step 3: Add `<script src="js/theme.js"></script>` before `</body>` in `v2.html`**
- [ ] **Step 4: Commit `v2.html` integration**

```bash
git add v2.html
git commit -m "feat(portfolio): integrate theme switcher widget and FOUC prevention in v2.html"
```

---

### Task 4: Integrate FOUC Prevention & Widget into `arcade.html`

**Files:**
- Modify: `arcade.html`

**Interfaces:**
- Produces: Head inline script in `arcade.html`, theme switcher widget in header nav container, and `<script src="js/theme.js"></script>` before closing body.

- [ ] **Step 1: Add inline FOUC prevention script to `<head>` of `arcade.html`**
- [ ] **Step 2: Add theme switcher widget in header nav of `arcade.html`**
- [ ] **Step 3: Add `<script src="js/theme.js"></script>` before `</body>` in `arcade.html`**
- [ ] **Step 4: Commit `arcade.html` integration**

```bash
git add arcade.html
git commit -m "feat(arcade): integrate theme switcher widget and FOUC prevention in arcade.html"
```

---

### Task 5: Add Real-Time 3D Wireframe Scene Dynamic Tinting in `js/v2.js`

**Files:**
- Modify: `js/v2.js`

**Interfaces:**
- Consumes: `themechange` window event
- Produces: Dynamic updates to Three.js materials for outer wireframe mesh, inner lattice, core mesh, and particle points cloud.

- [ ] **Step 1: Wire `themechange` event listener in `initThreeHero()` inside `js/v2.js`**

Update materials when theme switches:
- `light`: outer mesh `0x2563eb`, inner mesh `0x60a5fa`, particles `0x1d4ed8`
- `dark`: outer mesh `0x38bdf8`, inner mesh `0x93c5fd`, particles `0x60a5fa`
- `cyber`: outer mesh `0x00f5ff`, inner mesh `0xc084fc`, particles `0xec4899`

- [ ] **Step 2: Commit 3D scene reactive tinting**

```bash
git add js/v2.js
git commit -m "feat(hero): dynamically tint Three.js 3D wireframe mesh and particles on theme change"
```

---

### Task 6: Verification & Cross-Page Testing

**Files:**
- Modify: `scripts/verify-bug-blaster.js` to assert theme widget, inline scripts, and CSS tokens.

- [ ] **Step 1: Update verification test script and run test suite**
- [ ] **Step 2: Verify zero syntax or runtime errors**
- [ ] **Step 3: Commit verified code**

```bash
git add -A
git commit -m "chore(theme): complete verification of 3-way theme switcher"
```
