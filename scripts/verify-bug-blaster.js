const fs = require('fs');

const v2Html = fs.readFileSync('v2.html', 'utf8');
const arcadeHtml = fs.readFileSync('arcade.html', 'utf8');
const v2Css = fs.readFileSync('css/v2.css', 'utf8');
const bugCss = fs.readFileSync('css/bug-blaster.css', 'utf8');
const dinoCss = fs.readFileSync('css/dino-runner.css', 'utf8');
const bugJs = fs.readFileSync('js/bug-blaster.js', 'utf8');
const dinoJs = fs.readFileSync('js/dino-runner.js', 'utf8');

let allPassed = true;

console.log('--- 1. Verifying arcade.html Dual Game Tabs & Panels ---');
const requiredArcadeIds = [
  'tab-blaster',
  'tab-dino',
  'panel-blaster',
  'panel-dino',
  // Bug Blaster
  'bug-blaster-canvas',
  'arcade-crosshair',
  'bb-score',
  'bb-streak',
  'bb-integrity',
  'bb-play-btn',
  'bb-mute-btn',
  'bb-pause-btn',
  // Dino Runner
  'dino-viewport',
  'dino-canvas',
  'dino-score',
  'dino-hi-score',
  'dino-speed-val',
  'dino-play-btn',
  'dino-mute-btn',
  'dino-pause-btn',
  'btn-touch-jump',
  'btn-touch-duck'
];

requiredArcadeIds.forEach(id => {
  if (arcadeHtml.includes(`id="${id}"`)) {
    console.log(`[PASS] ID found on arcade.html: ${id}`);
  } else {
    console.error(`[FAIL] ID missing on arcade.html: ${id}`);
    allPassed = false;
  }
});

console.log('\n--- 2. Verifying arcade.html Script & Stylesheet Ordering ---');
const threeIndex = arcadeHtml.indexOf('three.min.js');
const bugIndex = arcadeHtml.indexOf('js/bug-blaster.js');
const dinoIndex = arcadeHtml.indexOf('js/dino-runner.js');

if (threeIndex !== -1 && bugIndex !== -1 && dinoIndex !== -1) {
  if (threeIndex < bugIndex && threeIndex < dinoIndex) {
    console.log('[PASS] Three.js loaded BEFORE both game scripts on arcade.html');
  } else {
    console.error('[FAIL] Three.js must be loaded before game scripts');
    allPassed = false;
  }
} else {
  console.error('[FAIL] Script tag missing on arcade.html');
  allPassed = false;
}

if (arcadeHtml.includes('css/bug-blaster.css') && arcadeHtml.includes('css/dino-runner.css')) {
  console.log('[PASS] Both bug-blaster.css and dino-runner.css linked in arcade.html');
} else {
  console.error('[FAIL] Missing stylesheet link in arcade.html');
  allPassed = false;
}

console.log('\n--- 3. Verifying v2.html Top Navbar Cleanliness & Footer Link ---');
const navLinksMatch = v2Html.match(/<ul class="nav-links">[\s\S]*?<\/ul>/);
if (navLinksMatch && !navLinksMatch[0].includes('arcade.html')) {
  console.log('[PASS] Game menu clean (absent from top navbar on v2.html)');
} else {
  console.error('[FAIL] Game link found in top navbar on v2.html');
  allPassed = false;
}

if (v2Html.includes('href="arcade.html"') && v2Html.includes('btn-arcade-footer')) {
  console.log('[PASS] Footer on v2.html contains link to arcade.html');
} else {
  console.error('[FAIL] Footer on v2.html missing link to arcade.html');
  allPassed = false;
}

console.log('\n--- 4. Verifying arcade.html Back Link to Portfolio ---');
if (arcadeHtml.includes('href="v2.html"')) {
  console.log('[PASS] arcade.html links back to v2.html portfolio');
} else {
  console.error('[FAIL] arcade.html missing return link to v2.html');
  allPassed = false;
}

console.log('\n--- 5. Verifying 3-Way Theme Switcher Integration ---');
const themeJs = fs.readFileSync('js/theme.js', 'utf8');
const v2Js = fs.readFileSync('js/v2.js', 'utf8');

// Theme CSS
if (v2Css.includes('[data-theme="light"]') && v2Css.includes('[data-theme="dark"]') && v2Css.includes('[data-theme="cyber"]')) {
  console.log('[PASS] CSS contains data-theme selectors for light, dark, and cyber');
} else {
  console.error('[FAIL] CSS missing theme selectors');
  allPassed = false;
}

if (v2Css.includes('.theme-switcher-wrap') && v2Css.includes('.theme-dropdown-menu')) {
  console.log('[PASS] CSS contains theme switcher widget styling');
} else {
  console.error('[FAIL] CSS missing theme switcher widget styling');
  allPassed = false;
}

// v2.html theme elements
if (v2Html.includes('id="theme-toggle-btn"') && v2Html.includes('id="theme-menu"') && v2Html.includes('js/theme.js')) {
  console.log('[PASS] v2.html contains theme widget and script');
} else {
  console.error('[FAIL] v2.html missing theme widget or script');
  allPassed = false;
}

if (v2Html.includes('localStorage.getItem(\'portfolio_theme\')')) {
  console.log('[PASS] v2.html includes inline FOUC prevention script in <head>');
} else {
  console.error('[FAIL] v2.html missing inline FOUC prevention script');
  allPassed = false;
}

// arcade.html theme elements
if (arcadeHtml.includes('id="theme-toggle-btn"') && arcadeHtml.includes('id="theme-menu"') && arcadeHtml.includes('js/theme.js')) {
  console.log('[PASS] arcade.html contains theme widget and script');
} else {
  console.error('[FAIL] arcade.html missing theme widget or script');
  allPassed = false;
}

if (arcadeHtml.includes('localStorage.getItem(\'portfolio_theme\')')) {
  console.log('[PASS] arcade.html includes inline FOUC prevention script in <head>');
} else {
  console.error('[FAIL] arcade.html missing inline FOUC prevention script');
  allPassed = false;
}

// js/theme.js functionality
if (themeJs.includes('ThemeManager') && themeJs.includes('themechange') && themeJs.includes('portfolio_theme')) {
  console.log('[PASS] js/theme.js implements ThemeManager with themechange event and localStorage persistence');
} else {
  console.error('[FAIL] js/theme.js missing required ThemeManager implementation');
  allPassed = false;
}

// js/v2.js hero tinting
if (v2Js.includes('themechange') && v2Js.includes('updateThemeColors')) {
  console.log('[PASS] js/v2.js dynamic 3D hero tinting hooked to themechange event');
} else {
  console.error('[FAIL] js/v2.js missing themechange listener for 3D hero');
  allPassed = false;
}

if (!allPassed) {
  process.exit(1);
} else {
  console.log('\nAll Dual-Game & Theme Switcher Architectural Assertions PASSED successfully!');
}
