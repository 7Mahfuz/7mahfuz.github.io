const fs = require('fs');

const html = fs.readFileSync('v2.html', 'utf8');
const css = fs.readFileSync('css/bug-blaster.css', 'utf8');
const js = fs.readFileSync('js/bug-blaster.js', 'utf8');

const requiredIds = [
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

console.log('--- Verifying HTML Elements ---');
requiredIds.forEach(id => {
  if (html.includes(`id="${id}"`)) {
    console.log(`[PASS] ID found in HTML: ${id}`);
  } else {
    console.error(`[FAIL] ID missing in HTML: ${id}`);
    allPassed = false;
  }
});

console.log('\n--- Verifying Script Ordering ---');
const threeIndex = html.indexOf('three.min.js');
const v2Index = html.indexOf('js/v2.js');
const bugBlasterIndex = html.indexOf('js/bug-blaster.js');

if (threeIndex !== -1 && v2Index !== -1 && bugBlasterIndex !== -1) {
  if (threeIndex < bugBlasterIndex) {
    console.log('[PASS] Three.js is loaded BEFORE bug-blaster.js');
  } else {
    console.error('[FAIL] Three.js must be loaded before bug-blaster.js');
    allPassed = false;
  }
} else {
  console.error('[FAIL] Script tag not found in v2.html');
  allPassed = false;
}

console.log('\n--- Verifying CSS & Stylesheet Inclusion ---');
if (html.includes('css/bug-blaster.css')) {
  console.log('[PASS] bug-blaster.css is linked in v2.html');
} else {
  console.error('[FAIL] bug-blaster.css missing in v2.html');
  allPassed = false;
}

console.log('\n--- Verifying Nav Link ---');
if (html.includes('href="#arcade"')) {
  console.log('[PASS] #arcade navigation link is present');
} else {
  console.error('[FAIL] #arcade nav link missing');
  allPassed = false;
}

if (!allPassed) {
  process.exit(1);
} else {
  console.log('\nAll structural assertions PASSED successfully!');
}
