# Portfolio v2 Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a high-impact, modern, standalone executive portfolio (`v2.html`) for Al-Amin Mahfuzur Rahman featuring an interactive Three.js 3D wireframe data sphere, an enhanced studio headshot, and bento-grid showcases for enterprise ERP/ASP.NET projects.

**Architecture:** A standalone modern single-page architecture (`v2.html`, `css/v2.css`, `js/v2.js`) utilizing CDN-delivered Three.js (r128) and modern CSS variable-driven design tokens (light slate & enterprise blue). The existing `index.html` remains 100% untouched.

**Tech Stack:** HTML5, CSS3 (CSS Grid, Bento layouts, Glassmorphism, CSS Custom Properties), JavaScript (ES6+, Three.js r128, IntersectionObserver, PointerEvents), Font Awesome 6.

## Global Constraints
- Target test file MUST be `v2.html` at repository root.
- Existing files `index.html`, `css/styles.css`, `xCSS.css`, and `Net_CV_MahfuzurRahman.pdf` MUST NOT be modified or deleted.
- Three.js MUST run via standard CDN (`https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js`), handle window resizing, and cap `devicePixelRatio` to `2`.
- All links must function properly (CV download directly opens/downloads `Net_CV_MahfuzurRahman.pdf`).

---

### Task 1: Generate & Prepare Enhanced Studio Portrait

**Files:**
- Create/Place: `assets/img/profile-executive.jpg`
- Reference: `assets/img/profilePic.jpg`

**Interfaces:**
- Consumes: `assets/img/profilePic.jpg`
- Produces: `assets/img/profile-executive.jpg` (used by `v2.html`)

- [ ] **Step 1: Check existing profile image source**
Verify `assets/img/profilePic.jpg` is available and readable.

- [ ] **Step 2: Generate polished executive studio headshot**
Generate or process a polished executive headshot with professional studio illumination, modern corporate blurred backdrop, crisp focus on facial features, suit, and beard, saving to `assets/img/profile-executive.jpg`.

- [ ] **Step 3: Verify image format and resolution**
Verify `assets/img/profile-executive.jpg` exists and is non-empty.

- [ ] **Step 4: Commit image asset**
```bash
git add assets/img/profile-executive.jpg
git commit -m "feat(assets): add polished executive portrait"
```

---

### Task 2: Create CSS Design System & Bento Styling (`css/v2.css`)

**Files:**
- Create: `css/v2.css`

**Interfaces:**
- Consumes: CSS custom properties (`--bg-canvas`, `--surface`, `--primary`, `--slate-900`, etc.)
- Produces: Complete styling rules for navigation, hero split, 3D canvas container, bento cards, experience timeline, skills matrix, badges, and responsive media queries.

- [ ] **Step 1: Write `css/v2.css` foundation tokens and typography**
Define CSS custom properties:
```css
:root {
  --bg-canvas: #f8fafc;
  --bg-canvas-subtle: #f1f5f9;
  --surface: #ffffff;
  --surface-border: #e2e8f0;
  --surface-hover: #f8fafc;
  --primary: #2563eb;
  --primary-hover: #1d4ed8;
  --primary-glow: rgba(37, 99, 235, 0.15);
  --text-main: #0f172a;
  --text-muted: #475569;
  --text-light: #64748b;
  --accent-green: #10b981;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.03);
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 18px;
  --radius-xl: 24px;
}
```

- [ ] **Step 2: Add styles for navigation, hero split, and 3D stage**
Include floating glass navbar (`backdrop-filter: blur(12px)`), hero split grid, status pulse indicator, CTA button styling, and the 3D canvas container with responsive aspect ratios.

- [ ] **Step 3: Add bento grid, project cards, experience timeline, and skills matrix styles**
Include:
- Bento grid layout (`display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr))`)
- Tech badges and client tags (`background: #eff6ff; color: #1d4ed8`)
- Timeline tree with connected node markers
- Responsive breakpoints (`@media (max-width: 992px)`, `@media (max-width: 640px)`)

- [ ] **Step 4: Verify CSS syntax and rules**
Check that `css/v2.css` is valid CSS without missing brackets.

- [ ] **Step 5: Commit `css/v2.css`**
```bash
git add css/v2.css
git commit -m "feat(css): add v2 design system and bento styles"
```

---

### Task 3: Implement Three.js 3D Wireframe Canvas & Interactive Controller (`js/v2.js`)

**Files:**
- Create: `js/v2.js`

**Interfaces:**
- Consumes: `<canvas id="three-hero-canvas">` element in `v2.html` and Three.js global `THREE`.
- Produces: `initThreeHero()`, smooth cursor tracking, window resize handling, and UI interactions (smooth scroll, active link highlighter, copy email tooltip).

- [ ] **Step 1: Write Three.js 3D wireframe sphere initialization**
Create an Icosahedron wireframe mesh:
```javascript
const geometry = new THREE.IcosahedronGeometry(2.2, 2);
const wireframeMaterial = new THREE.MeshStandardMaterial({
  color: 0x2563eb,
  wireframe: true,
  transparent: true,
  opacity: 0.65,
  roughness: 0.2,
  metalness: 0.8
});
const mesh = new THREE.Mesh(geometry, wireframeMaterial);
```
Add orbital floating particle nodes around the mesh using `THREE.Points` with a soft blue particle texture.

- [ ] **Step 2: Implement smooth mouse parallax and animation loop**
Add mousemove listener with normalized coordinates (`mouseX`, `mouseY`) and damped rotation easing in `requestAnimationFrame`:
```javascript
mesh.rotation.y += 0.003;
mesh.rotation.x += 0.001;
camera.position.x += (targetX - camera.position.x) * 0.05;
camera.position.y += (targetY - camera.position.y) * 0.05;
camera.lookAt(scene.position);
```
Pause animation loop when canvas is not visible using `IntersectionObserver`.

- [ ] **Step 3: Add interactive UI scripts (smooth scroll, mobile menu, email copy)**
Add event listeners for:
- Mobile navigation toggle with aria-expanded update
- Active section highlighting on scroll
- One-click copy email to clipboard with animated visual feedback pill

- [ ] **Step 4: Verify `js/v2.js` syntax**
Check syntax with node or browser check.

- [ ] **Step 5: Commit `js/v2.js`**
```bash
git add js/v2.js
git commit -m "feat(js): implement Three.js 3D data sphere and page interactions"
```

---

### Task 4: Build Standalone Portfolio Web Page (`v2.html`)

**Files:**
- Create: `v2.html`

**Interfaces:**
- Consumes: `css/v2.css`, `js/v2.js`, `assets/img/profile-executive.jpg` (or fallback `profilePic.jpg`), Three.js CDN, Google Fonts (`Plus Jakarta Sans`, `Inter`, `JetBrains Mono`).
- Produces: Complete semantic HTML5 document with all sections, SEO meta tags, OpenGraph tags, and accessibility attributes.

- [ ] **Step 1: Build `<head>` with fonts, meta tags, and CDN dependencies**
Include:
- Google Fonts (`Plus Jakarta Sans:wght@400;600;700;800`, `Inter:wght@400;500;600`, `JetBrains+Mono:wght@500`)
- Font Awesome 6 icons
- Three.js r128 CDN (`https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js`)
- `css/v2.css`

- [ ] **Step 2: Build Floating Glass Header & Navigation**
Include brand logo, desktop links (`About`, `Projects`, `Experience`, `Skills`, `Education`, `Contact`), mobile hamburger button, and direct **"Download CV"** button.

- [ ] **Step 3: Build Split Hero Section with 3D Canvas & Portrait Card**
- Left: Availability badge, headline, enterprise summary, contact links, and dual CTA buttons.
- Right: Interactive 3D canvas stage with executive portrait card and floating experience pill.

- [ ] **Step 4: Build Enterprise Projects Bento Grid**
Build all 7 project cards with client badges, technology pills, and clear business outcomes:
1. Microsoft Business Central Localization (Microsoft)
2. Rent Grid (USA)
3. Hotel Grid (USA)
4. Garments HR & Payroll System (FnF Fashion)
5. Factory Management System (MH Golden Jute Ltd)
6. Smart Sell (Kushtia Tech)
7. Task Management (MH Golden Jute Ltd)

- [ ] **Step 5: Build Experience Timeline, Skills Matrix & Education Sections**
- Work Experience: Bizzntek, SmartSoft Technology, GTRBD Ltd.
- Skills Matrix: 4 categories with clean badges.
- Education & Credentials: ISTT B.Sc. CSE, BITM Full Stack ASP.NET, Devskill.
- Contact Footer: Direct email link, copy button, location, and CV download.

- [ ] **Step 6: Verify HTML5 markup & references**
Verify all asset paths, IDs, script tags, and links.

- [ ] **Step 7: Commit `v2.html`**
```bash
git add v2.html
git commit -m "feat: create modern executive portfolio v2.html"
```

---

### Task 5: End-to-End Verification & Browser Testing

**Files:**
- Test target: `v2.html`
- Integrity check: `index.html`

- [ ] **Step 1: Start local web server to test `v2.html`**
Run PowerShell local HTTP server:
```powershell
python -m http.server 8000
```
or PowerShell .NET HttpListener to serve files locally.

- [ ] **Step 2: Validate HTTP responses and 3D canvas rendering**
Test that `http://localhost:8000/v2.html` returns status 200, assets load cleanly without 404s, and console is free of errors.

- [ ] **Step 3: Verify non-destructive guarantee**
Check that `index.html` matches git main branch exactly:
```bash
git status --porcelain index.html
```
Expected: No changes to `index.html`.

- [ ] **Step 4: Final verification commit & summary**
```bash
git status
```
