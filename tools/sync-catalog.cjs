// Keep the beta catalogue and immediate-start fallback identical to production.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'library.json'), 'utf8'));
for (const prefix of ['', 'beta/']) {
  const clips = catalog.clips.map(clip => ({...clip, url: prefix ? '.' + clip.url : clip.url}));
  if (prefix) fs.writeFileSync(path.join(root, prefix, 'library.json'), JSON.stringify({...catalog, clips}, null, 2) + '\n');
  const file = path.join(root, prefix, 'app.js');
  const fallback = clips.map(({id, title, kind, url, duration}) => ({id, title, kind, url, duration}));
  const source = fs.readFileSync(file, 'utf8');
  if (!/^const BUNDLED_CATALOG=.*;$/m.test(source)) throw Error('Bundled catalogue declaration missing: ' + file);
  fs.writeFileSync(file, source.replace(/^const BUNDLED_CATALOG=.*;$/m, 'const BUNDLED_CATALOG=' + JSON.stringify(fallback) + ';'));
}
console.log(`Synchronized ${catalog.clips.length} published tracks and startup fallbacks.`);
