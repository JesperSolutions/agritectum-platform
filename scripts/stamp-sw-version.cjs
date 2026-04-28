/**
 * Stamps the service worker with a unique BUILD_VERSION before each Vite build.
 *
 * Vite copies files from `public/` verbatim into `dist/`, so we replace the
 * "__BUILD_VERSION__" placeholder in `public/sw.js` -> `dist/sw.js` after build.
 * Running as both prebuild (writes back to public/ for `vite preview` parity) and
 * postbuild (rewrites the copied dist/sw.js with a fresh stamp) keeps every
 * deploy byte-different, which forces browsers to install + activate the new SW
 * and evict the previous cache.
 */
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const pkg = require(path.join(repoRoot, 'package.json'));

const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const stamp =
  `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}` +
  `-${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`;
const buildVersion = `v${pkg.version}-${stamp}`;

const targets = [
  path.join(repoRoot, 'public', 'sw.js'),
  path.join(repoRoot, 'dist', 'sw.js'),
];

for (const target of targets) {
  if (!fs.existsSync(target)) continue;
  const original = fs.readFileSync(target, 'utf8');
  // Replace either the placeholder or a previous stamped value.
  const stamped = original.replace(
    /const BUILD_VERSION = '[^']*';/,
    `const BUILD_VERSION = '${buildVersion}';`,
  );
  if (stamped !== original) {
    fs.writeFileSync(target, stamped);
    console.log(`[stamp-sw-version] ${path.relative(repoRoot, target)} -> ${buildVersion}`);
  }
}
