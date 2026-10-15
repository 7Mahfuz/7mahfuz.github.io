const fs = require('fs');

const v2Html = fs.readFileSync('v2.html', 'utf8');
const arcadeHtml = fs.readFileSync('arcade.html', 'utf8');
const v2Css = fs.readFileSync('css/v2.css', 'utf8');
const bugCss = fs.readFileSync('css/bug-blaster.css', 'utf8');
const bugJs = fs.readFileSync('js/bug-blaster.js', 'utf8');

const requiredIdsOnArcadePage = [
  'arcade',
  'arcade-viewport',
  'bug-blaster-canvas',
  'arcade-crosshair',
  'arcade-overlay',
  'overlay-title',
  'overlay-desc',
  'overlay-stats',
  'final-score',
  'final-streak',
  'bb-play-btn',
  'bb-play-text',
  'bb-score',
  'bb-streak',
  'bb-integrity',
  'bb-mute-btn',
  'bb-pause-btn'
];

let allPassed = true;

console.log('--- 1. Verifying arcade.html Elements ---');
requiredIdsOnArcadePage.forEach(id => {
  if (arcadeHtml.includes(`id="${id}"`)) {
    console.log(`[PASS] ID found on arcade.html: ${id}`);
  } else {
    console.error(`[FAIL] ID missing on arcade.html: ${id}`);
    allPassed = false;
  }
});

console.log('\n--- 2. Verifying arcade.html Script Ordering ---');
const threeIndex = arcadeHtml.indexOf('three.min.js');
const bugBlasterIndex = arcadeHtml.indexOf('js/bug-blaster.js');

if (threeIndex !== -1 && bugBlasterIndex !== -1 && threeIndex < bugBlasterIndex) {
  console.log('[PASS] Three.js is loaded BEFORE bug-blaster.js on arcade.html');
} else {
  console.error('[FAIL] Three.js must be loaded before bug-blaster.js on arcade.html');
  allPassed = false;
}

console.log('\n--- 3. Verifying v2.html Top Navbar Cleanliness ---');
const navLinksMatch = v2Html.match(/<ul class="nav-links">[\s\S]*?<\/ul>/);
if (navLinksMatch && !navLinksMatch[0].includes('href="#arcade"') && !navLinksMatch[0].includes('arcade.html')) {
  console.log('[PASS] Game menu removed from top navbar on v2.html');
} else {
  console.error('[FAIL] Game link still found in top navbar on v2.html');
  allPassed = false;
}

console.log('\n--- 4. Verifying v2.html Footer Links ---');
if (v2Html.includes('href="arcade.html"') && v2Html.includes('btn-arcade-footer')) {
  console.log('[PASS] Footer on v2.html contains link to arcade.html');
} else {
  console.error('[FAIL] Footer on v2.html missing link to arcade.html');
  allPassed = false;
}

console.log('\n--- 5. Verifying arcade.html Back Link to Portfolio ---');
if (arcadeHtml.includes('href="v2.html"')) {
  console.log('[PASS] arcade.html links back to v2.html portfolio');
} else {
  console.error('[FAIL] arcade.html missing return link to v2.html');
  allPassed = false;
}

if (!allPassed) {
  process.exit(1);
} else {
  console.log('\nAll updated architectural assertions PASSED successfully!');
}
