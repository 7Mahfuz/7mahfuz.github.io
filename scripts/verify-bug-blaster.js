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

if (!allPassed) {
  process.exit(1);
} else {
  console.log('\nAll Dual-Game Architectural Assertions PASSED successfully!');
}
