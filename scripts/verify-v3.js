// Static checks for portfolio v3 (index.html, css/v3.css, js/v3.js).
// Run from the repo root: node scripts/verify-v3.js
const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('css/v3.css', 'utf8');
const js = fs.readFileSync('js/v3.js', 'utf8');

let allPassed = true;
function check(ok, pass, fail) {
  if (ok) {
    console.log(`[PASS] ${pass}`);
  } else {
    console.error(`[FAIL] ${fail}`);
    allPassed = false;
  }
}

console.log('--- 1. Assets referenced by index.html exist ---');
const localRefs = [...html.matchAll(/(?:href|src)="([^"#:]+)"/g)].map(m => m[1]);
[...new Set(localRefs)].forEach(ref => {
  check(fs.existsSync(ref), `found ${ref}`, `missing local file: ${ref}`);
});

console.log('\n--- 2. Every project trigger has data in js/v3.js ---');
const projectIds = [...new Set([...html.matchAll(/data-project="([^"]+)"/g)].map(m => m[1]))];
const horizonIds = [...new Set([...html.matchAll(/data-horizon="([^"]+)"/g)].map(m => m[1]))];
[...new Set(projectIds.concat(horizonIds))].forEach(id => {
  check(js.includes(`'${id}': {`), `project data for ${id}`, `no PROJECTS entry for "${id}"`);
});
const stopIds = [...js.matchAll(/\{ project: '([^']+)'/g)].map(m => m[1]);
stopIds.forEach(id => {
  check(js.includes(`'${id}': {`), `tour stop ${id} has project data`, `tour stop "${id}" has no PROJECTS entry`);
});

console.log('\n--- 3. Section anchors used by navigation exist ---');
const anchors = [...new Set([...html.matchAll(/href="#([^"]+)"/g)].map(m => m[1]))];
anchors.forEach(id => {
  check(html.includes(`id="${id}"`), `#${id} exists`, `link to #${id} has no target`);
});

console.log('\n--- 4. Baked land data decodes ---');
const land = (js.match(/var LAND = '([^']+)'/) || [])[1];
let dots = 0, rowsOk = true;
if (land) {
  land.split('|').slice(1).forEach(row => {
    const [cells, runs] = row.split(':');
    const total = runs.split('.').reduce((s, r) => s + parseInt(r, 36), 0);
    if (total !== parseInt(cells, 36)) rowsOk = false;
    runs.split('.').forEach((r, i) => { if (i % 2) dots += parseInt(r, 36); });
  });
}
check(Boolean(land) && rowsOk, `land rows add up (${dots} dots)`, 'LAND string missing or a row does not sum to its cell count');

console.log('\n--- 5. Accessibility and motion basics ---');
check(css.includes('prefers-reduced-motion'), 'reduced-motion styles present', 'no prefers-reduced-motion handling in css/v3.css');
check(js.includes('prefers-reduced-motion'), 'globe respects reduced motion', 'js/v3.js ignores prefers-reduced-motion');
check(css.includes(':focus-visible'), 'visible focus styles present', 'no :focus-visible styles');
check(/role="dialog"[^>]*aria-modal="true"/.test(html), 'drawer is a modal dialog', 'drawer missing role="dialog" aria-modal="true"');
check(html.includes('class="skip-link"'), 'skip link present', 'skip link missing');

console.log('\n--- 6. Themes: light, dark, Claude ---');
check(css.includes(':root[data-theme="dark"]'), 'dark theme tokens defined', 'no :root[data-theme="dark"] block in css/v3.css');
check(html.includes('data-theme-switch') && ['light', 'dark', 'claude'].every(t => html.includes('data-theme-value="' + t + '"')), 'theme switch offers light, dark and Claude', 'theme switch missing or incomplete in index.html');
check(css.includes(':root[data-theme="claude"]'), 'Claude theme tokens defined', 'no :root[data-theme="claude"] block in css/v3.css');
check(/localStorage\.getItem\('v3-theme'\)/.test(html), 'saved theme applied before first paint', 'inline theme script missing from <head>');
['--globe-disc-hi', '--globe-dot', '--globe-arc', '--horizon-top', '--horizon-dot'].forEach(token => {
  const defs = css.split(token + ':').length - 1;
  check(defs >= 3, `${token} set for all three themes`, `${token} must be defined in all three theme blocks (found ${defs})`);
});

console.log('\n--- 7. Arcade (games.html) ---');
const games = fs.readFileSync('games.html', 'utf8');
const gamesCss = fs.readFileSync('css/games.css', 'utf8');
check(html.includes('href="games.html"'), 'index.html links to the arcade', 'index.html does not link to games.html');
[...new Set([...games.matchAll(/(?:href|src)="([^"#:]+)"/g)].map(m => m[1]))].forEach(ref => {
  check(fs.existsSync(ref), `games.html asset ${ref}`, `games.html references missing file: ${ref}`);
});
['dino', '2048', 'tower', 'rickshaw', 'codedle'].forEach(id => {
  const tab = games.includes(`data-game="${id}"`) && games.includes(`data-panel="${id}"`);
  const registered = fs.readdirSync('js/games').some(f => fs.readFileSync('js/games/' + f, 'utf8').includes(`Arcade.register('${id}'`));
  check(tab && registered, `game ${id}: tab, panel and script registered`, `game ${id} is missing a tab, panel or Arcade.register call`);
});
['--rr-road', '--tower-sky-top', '--cd-hit', '--board-bg'].forEach(token => {
  const defs = gamesCss.split(token + ':').length - 1;
  check(defs >= 3, `${token} set for all three themes`, `${token} must be defined in all three theme blocks (found ${defs})`);
});
const codedle = fs.readFileSync('js/games/codedle.js', 'utf8');
const wordSrc = (codedle.match(/var WORDS = \(([\s\S]*?)\)\.split/) || [])[1] || '';
const words = wordSrc.replace(/'\s*\+\s*'/g, '').replace(/'/g, '').trim().split(/\s+/);
const badWords = words.filter(w => !/^[A-Z]{5}$/.test(w));
const dupWords = words.filter((w, i) => words.indexOf(w) !== i);
check(words.length >= 100 && !badWords.length && !dupWords.length,
  `Code-dle word list: ${words.length} five-letter words, no duplicates`,
  `Code-dle word list problems: bad=${badWords.join(',')} dup=${dupWords.join(',')} count=${words.length}`);

console.log('\n--- 8. CV links ---');
const cvLinks = html.match(/<a [^>]*href="Net_CV_MahfuzurRahman\.pdf"[^>]*>/g) || [];
check(cvLinks.length > 0 && cvLinks.every(a => a.includes('target="_blank"') && a.includes('rel="noopener"')),
  `all ${cvLinks.length} CV links open in a new tab`, "a CV link would replace the portfolio page (missing target=_blank / rel=noopener)");
check(fs.existsSync("Net_CV_MahfuzurRahman.pdf"), "CV PDF present", "Net_CV_MahfuzurRahman.pdf missing");

console.log('\n--- 9. Phone & WhatsApp ---');
const waLinks = html.split('href="https://wa.me/8801625632942').length - 1;
const telLinks = html.split('href="tel:+8801625632942"').length - 1;
check(waLinks >= 2 && telLinks >= 2, `${waLinks} WhatsApp and ${telLinks} phone links`, "phone/WhatsApp links missing from index.html");

console.log('\n--- 10. Section backdrop (Three.js) ---');
const backdrop = fs.existsSync('js/v3-backdrop.js') ? fs.readFileSync('js/v3-backdrop.js', 'utf8') : '';
check(html.includes('<script type="module" src="js/v3-backdrop.js">'), 'backdrop module loaded by index.html', 'index.html does not load js/v3-backdrop.js');
check(/three@\d+\.\d+\.\d+\//.test(backdrop), 'Three.js pinned to an exact version', 'Three.js URL must pin an exact version');
check(backdrop.includes('prefers-reduced-motion'), 'backdrop respects reduced motion', 'backdrop ignores prefers-reduced-motion');
['work', 'live', 'stack', 'education', 'contact'].forEach(id => {
  const hasForm = new RegExp('\\b' + id + ':\\s*\\{ make:').test(backdrop);
  check(hasForm && html.includes('id="' + id + '"'), `formation for #${id}`, `no backdrop formation or section for #${id}`);
});

if (!allPassed) {
  process.exit(1);
} else {
  console.log('\nAll v3 checks passed.');
}
