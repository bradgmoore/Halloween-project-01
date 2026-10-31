'use strict';

// Validate the actual release catalogue and its audio, without browser fixtures.
// Requires ffprobe and ffmpeg on PATH, or FFPROBE_PATH / FFMPEG_PATH overrides.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');

const root = fs.realpathSync(path.resolve(__dirname, '..'));
const expectedTracks = 24;
const projectPath = '/Halloween-project-01/';
const ffprobe = process.env.FFPROBE_PATH || 'ffprobe';
const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';

function inside(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative !== '' && relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

function run(executable, args, label) {
  const result = spawnSync(executable, args, {
    encoding: 'utf8', windowsHide: true, timeout: 60000, maxBuffer: 1024 * 1024
  });
  assert.ifError(result.error && new Error(`${label}: ${result.error.message}. Install ffmpeg/ffprobe or set FFMPEG_PATH/FFPROBE_PATH.`));
  assert.equal(result.status, 0, `${label}: ${(result.stderr || result.stdout || `exit ${result.status}`).trim()}`);
  return result.stdout;
}

function requireText(value, label) {
  assert.equal(typeof value, 'string', `${label} must be a string`);
  assert(value.trim(), `${label} must not be empty`);
}

function requireHttps(value, label) {
  requireText(value, label);
  const url = new URL(value);
  assert.equal(url.protocol, 'https:', `${label} must use HTTPS`);
  assert(!url.username && !url.password, `${label} must not contain credentials`);
}

function mediaFile(clip, manifest) {
  const label = `${manifest}: ${clip.id}`;
  requireText(clip.url, `${label} url`);
  assert(!/^[a-z][a-z\d+.-]*:|^[\/\\]/i.test(clip.url) && !clip.url.includes('\\'), `${label} needs a project-relative audio URL`);
  const base = new URL(`https://published-assets.invalid${projectPath}${manifest.startsWith('beta/') ? 'beta/' : ''}`);
  const url = new URL(clip.url, base);
  assert.equal(url.origin, base.origin, `${label} must use hosted project audio`);
  assert(url.pathname.startsWith(projectPath), `${label} resolves outside the GitHub Pages project`);
  const relativePath = decodeURIComponent(url.pathname.slice(projectPath.length));
  const file = path.resolve(root, ...relativePath.split('/'));
  assert(inside(root, file), `${label} resolves outside the repository`);
  const permittedRoots = [path.join(root, 'audio', 'imported')];
  if (manifest.startsWith('beta/')) permittedRoots.push(path.join(root, 'beta', 'audio', 'imported'));
  assert(permittedRoots.some(directory => inside(directory, file)), `${label} must reference imported audio, not historical clips or fixtures`);
  assert.equal(path.extname(file).toLowerCase(), '.mp3', `${label} must use MP3 covered by the service worker`);
  assert(fs.existsSync(file), `${label} audio file does not exist: ${relativePath}`);
  const resolved = fs.realpathSync(file);
  assert(inside(root, resolved) && permittedRoots.some(directory => inside(directory, resolved)), `${label} audio symlink escapes the permitted media roots`);
  assert(fs.statSync(resolved).isFile(), `${label} audio path is not a file`);
  return resolved;
}

function readCatalog(manifest) {
  const data = JSON.parse(fs.readFileSync(path.join(root, manifest), 'utf8'));
  requireText(data.title, `${manifest} title`);
  assert(Array.isArray(data.clips), `${manifest} needs a clips array`);
  assert.equal(data.clips.length, expectedTracks, `${manifest} must publish all ${expectedTracks} real tracks`);
  assert.equal(data.clips.filter(clip => clip.kind === 'effects').length, 20, 'Preserve all twenty Halloween effects');
  assert.equal(data.clips.filter(clip => clip.kind === 'music').length, 4, 'Publish four spooky music tracks');
  assert(data.clips.filter(clip => clip.kind === 'music').every(clip => clip.duration > 20), 'Publish full music compositions, not effect snippets');
  const ids = new Set(), files = new Set(), hashes = new Set();
  return data.clips.map(clip => {
    assert(clip && typeof clip === 'object' && !Array.isArray(clip), `${manifest} contains an invalid track`);
    requireText(clip.id, `${manifest} id`);
    const label = `${manifest}: ${clip.id}`;
    assert(!ids.has(clip.id), `${label} has a duplicate ID`); ids.add(clip.id);
    requireText(clip.title, `${label} title`);
    assert(['effects', 'music'].includes(clip.kind), `${label} kind must be effects or music`);
    requireHttps(clip.sourceUrl, `${label} sourceUrl`);
    requireText(clip.creator, `${label} creator`);
    requireText(clip.license, `${label} license`);
    assert(/^(?:CC0(?:\s+1\.0(?:\s+Universal)?)?|CC[\s-]*BY[\s-]*(?:3|4)\.0)$/i.test(clip.license.trim()), `${label} needs the reviewed CC0, CC BY 3.0 or CC BY 4.0 license`);
    if (clip.licenseUrl !== undefined) requireHttps(clip.licenseUrl, `${label} licenseUrl`);
    assert.equal(typeof clip.sha256, 'string', `${label} sha256 must be a string`);
    assert(/^[a-f\d]{64}$/i.test(clip.sha256), `${label} needs a complete SHA-256 hash`);
    const hash = clip.sha256.toLowerCase();
    assert(!hashes.has(hash), `${label} duplicates another audio file's bytes`); hashes.add(hash);
    assert(typeof clip.duration === 'number' && Number.isFinite(clip.duration) && clip.duration > 0, `${label} needs a positive measured duration`);
    const file = mediaFile(clip, manifest);
    assert(!files.has(file), `${label} reuses another track's file`); files.add(file);
    const bytes = fs.readFileSync(file);
    assert(bytes.length > 0, `${label} has an empty file`);
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), hash, `${label} file hash differs from its provenance`);
    return { clip, file };
  });
}

function main() {
  const production = readCatalog('library.json');
  const beta = readCatalog('beta/library.json');
  const betaById = new Map(beta.map(entry => [entry.clip.id, entry]));
  const decoded = new Map();
  run(ffprobe, ['-version'], 'ffprobe availability');
  run(ffmpeg, ['-version'], 'ffmpeg availability');
  for (const entry of production) {
    const { clip, file } = entry, equivalent = betaById.get(clip.id);
    assert(equivalent, `beta is missing ${clip.id}`);
    assert.equal(equivalent.file, file, `beta ${clip.id} must reference the same shared audio file`);
    for (const key of ['title', 'kind', 'sourceUrl', 'creator', 'license', 'licenseUrl', 'sha256', 'duration']) {
      assert.deepEqual(equivalent.clip[key], clip[key], `beta ${clip.id} differs in ${key}`);
    }
    if (!decoded.has(file)) {
      const probe = JSON.parse(run(ffprobe, ['-v', 'error', '-select_streams', 'a:0', '-show_entries', 'stream=codec_name,channels,sample_rate,duration:format=duration', '-of', 'json', file], `${clip.id} audio probe`));
      const stream = probe.streams?.[0];
      assert(stream && stream.codec_name === 'mp3', `${clip.id} is not actual MP3 audio`);
      assert(Number(stream.channels) > 0 && Number(stream.sample_rate) > 0, `${clip.id} has invalid audio parameters`);
      const duration = Number(probe.format?.duration || stream.duration);
      assert(Number.isFinite(duration) && duration > 0, `${clip.id} has no measurable audio duration`);
      assert(Math.abs(duration - clip.duration) <= Math.max(0.25, duration * 0.02), `${clip.id} manifest duration does not match the audio`);
      run(ffmpeg, ['-nostdin', '-v', 'error', '-xerror', '-i', file, '-map', '0:a:0', '-f', 'null', '-'], `${clip.id} full audio decode`);
      decoded.set(file, duration);
    }
  }
  console.log(`PASS: production and beta each publish ${expectedTracks} matching real assets; IDs, provenance, project-relative paths, file hashes, measured durations and full MP3 decoding verified for ${decoded.size} distinct shared files.`);
}

try { main(); } catch (error) { require('./report-error.cjs')(error); }
