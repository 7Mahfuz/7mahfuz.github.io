# Design Spec: Portfolio v2 Redesign (Three.js & Executive Modern UI)

**Date:** 2026-10-15  
**Target:** `v2.html`, `css/v2.css`, `js/v2.js`, and `assets/img/profile-executive.jpg`  
**Status:** Approved by User  

---

## 1. Overview & Goals
The objective is to create a high-impact, modern, and clean executive portfolio (`v2.html`) for **Al-Amin Mahfuzur Rahman**, an experienced Enterprise Software Engineer specializing in Microsoft Dynamics 365 Business Central and ASP.NET Core web architecture.

The existing portfolio (`index.html`) relies on a 2021 Bootstrap sidebar template. The redesign elevates the visual and technical credibility with:
- A Clean Executive Minimalist design system (light slate canvas, pure white elevation cards, professional enterprise blue/indigo accents).
- An interactive **Three.js** 3D wireframe data lattice sphere that responds smoothly to mouse movement.
- An enhanced studio-quality executive portrait based on `profilePic.jpg`.
- A modern split-screen hero and bento-grid showcase for enterprise ERP and web projects.
- Complete non-destructive isolation: `v2.html` is standalone so `index.html` remains 100% untouched.

---

## 2. Visual Identity & Styling System

### 2.1 Color Palette
- **Canvas Background:** `#f8fafc` (Slate-50) with subtle linear gradients to `#f1f5f9` (Slate-100).
- **Cards & Surfaces:** `#ffffff` with 1px border `#e2e8f0` and soft dual-layer shadow (`box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 20px 25px -5px rgba(0,0,0,0.03)`).
- **Primary Brand / Enterprise Indigo:** `#2563eb` (Blue-600) / `#1d4ed8` (Blue-700).
- **Secondary Slate Accents:** `#0f172a` (Slate-900) for high-contrast headlines; `#475569` (Slate-600) for body text; `#64748b` (Slate-500) for secondary metadata.
- **Success / Status Accent:** `#10b981` (Emerald-500) for "Open to Enterprise Roles" pulse badge.

### 2.2 Typography
- **Headings & Brand:** `Plus Jakarta Sans`, sans-serif (700 / 600 weight).
- **Body & Captions:** `Inter`, sans-serif (400 / 500 weight).
- **Code & Tech Pills:** `JetBrains Mono` or system monospace font (500 weight).

---

## 3. Page Structure & Components (`v2.html`)

### 3.1 Floating Glass Navigation
- **Behavior:** Fixed top bar with frosted glass backdrop blur (`backdrop-filter: blur(12px)`, `rgba(248, 250, 252, 0.85)`).
- **Left:** Monogram brand pill (`MR • Al-Amin Mahfuzur Rahman`) with live pulsing availability dot.
- **Center:** Smooth-scrolling navigation links: `About`, `Projects`, `Experience`, `Skills`, `Education`.
- **Right:** Prominent primary CTA button **"Download CV"** linking directly to `Net_CV_MahfuzurRahman.pdf`.
- **Mobile:** Accessible mobile toggle menu with clean slide-down animation.

### 3.2 Split Hero Section
- **Left Column (Value Proposition & Trust):**
  - Availability Pill: 🟢 `Open to Enterprise Roles & ERP Consulting`
  - Name & Title: `Al-Amin Mahfuzur Rahman` — *Enterprise Software Engineer*
  - Value summary: Specializing in Microsoft Dynamics 365 Business Central AL extensions, ASP.NET Core, and scalable ERP systems with 3+ years of production experience.
  - Location & Contact Chips: Uttara, Dhaka | `7mahfuzur.rahman@gmail.com` | LinkedIn | GitHub.
  - Action Group: Primary `[Download CV]` (PDF direct download) + Secondary `[Explore Enterprise Projects]`.
- **Right Column (Interactive 3D Stage & Portrait):**
  - Interactive Three.js canvas container.
  - Executive Portrait Card with backdrop blur, fine border, and floating experience badge (*"3+ Years Enterprise Experience"*).

### 3.3 Three.js 3D Wireframe Data Sphere
- **Geometry:** Low-poly icosahedron wireframe combined with floating particle cloud nodes.
- **Interaction:**
  - Ambient slow rotation on X and Y axes.
  - Mouse movement / pointer coordinates drive smooth camera damping and slight mesh tilt.
- **Theme Matching:** Slate & enterprise blue wireframe material (`wireframe: true`, `color: 0x2563eb`, `transparent: true`, `opacity: 0.65`) with subtle vertex points.
- **Performance:** Capped `devicePixelRatio` at `2`, pause animation loop when canvas is scrolled off-screen via `IntersectionObserver`.

### 3.4 Featured Projects Bento Grid
Each card displays:
- Project title & brief description
- Client / Organization pill (e.g. `Client: Microsoft`, `Client: Rent Grid (USA)`, `Client: FnF Fashion`)
- Tech Stack Tags (e.g. `AL Language`, `Business Central`, `C#`, `ASP.NET Core`, `MS SQL`)
- Key business impact / technical highlights.
Projects showcased:
1. **Microsoft Business Central Localization** (Client: Microsoft | AL, NBR tax regulations, RDLC)
2. **Rent Grid (USA)** (Property & rent management ERP, online payment gateway, tenant accounting)
3. **Hotel Grid (USA)** (Hospitality ERP with reservations and guest ledger)
4. **Garment's HR & Payroll System** (FnF Fashion | ZKT biometric fingerprint integration, automated payroll)
5. **Factory Management System** (MH Golden Jute Ltd | Industrial Jute ERP, financial ledger)
6. **Smart Sell** (Kushtia Tech | Commercial POS & inventory management)
7. **Task Management** (MH Golden Jute Ltd | Internal work tracking & reporting)

### 3.5 Career Journey (Experience Timeline)
- **Bizzntek Ltd.** — Software Engineer (Oct 2020 – Present)
- **SmartSoft Technology** — Junior Software Engineer (Mar 2019 – Sep 2020)
- **GTRBD Ltd.** — Junior Software Engineer (Oct 2018 – Feb 2019)

### 3.6 Skills Matrix
Grouped into four crisp cards:
- **ERP & Enterprise Systems:** Dynamics 365 Business Central, AL Language, RDLC, Crystal Reports
- **Languages & Databases:** C#, AL, SQL (T-SQL), JavaScript, HTML5/CSS3, MS SQL Server
- **Frameworks & Web:** ASP.NET Core, ASP.NET MVC, .NET Web Forms, Entity Framework Core, REST APIs
- **Architecture & Engineering:** N-Tier Architecture, Repository Pattern, Unit of Work, SOLID, Unit Testing

### 3.7 Education & Professional Credentials
- **ISTT:** B.Sc. in Computer Science & Engineering (CGPA: 3.04, 4 years)
- **BITM:** Full Stack ASP.NET MVC Professional Training (3 months)
- **Devskill:** Full Stack ASP.NET MVC Professional Training (2 months)
- Higher Secondary & Secondary credentials.

### 3.8 Contact & Direct Connect Footer
- Card with email click-to-copy, mailto link, direct download button, and social channels.

---

## 4. File Structure & Deliverables
- `v2.html` — The new standalone portfolio.
- `css/v2.css` — Modern styling, animations, bento grid, responsive breakpoints.
- `js/v2.js` — Three.js canvas setup, smooth scrolling, active nav highlights, copy email handler.
- `assets/img/profile-executive.jpg` — Polished studio portrait.
- Preserved: `index.html`, `css/styles.css`, `xCSS.css`, `Net_CV_MahfuzurRahman.pdf`.

---

## 5. Verification & Testing Criteria
1. `v2.html` loads cleanly in modern browsers without console errors.
2. Three.js canvas renders 60fps and moves responsively with the cursor.
3. All project links, CV download button, and mailto links work properly.
4. Mobile layout collapses navigation and stacks bento cards smoothly.
5. Existing `index.html` remains functional and unchanged.
