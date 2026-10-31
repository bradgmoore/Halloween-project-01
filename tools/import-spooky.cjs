// Import the real recordings from bart's openly licensed Halloween pack.
// Usage: node tools/import-spooky.cjs path/to/spookysounds.zip
// Requires Python 3 and ffmpeg; optional PYTHON_PATH and FFMPEG_PATH overrides.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {execFileSync, spawnSync} = require('child_process');
const root = path.resolve(__dirname, '..');
const archive = path.resolve(process.argv[2] || '.private-audio/spookysounds.zip');
const sourceUrl = 'https://opengameart.org/content/25-spooky-sound-effects';
const licenseUrl = 'https://creativecommons.org/licenses/by/3.0/';
const selected = [
  ['witch_cackle.wav', 'witch-cackle', 'Witch cackle'],
  ['scream1.wav', 'scream-one', 'Terrified scream'],
  ['scream2.wav', 'scream-two', 'Horror scream'],
  ['scream3.wav', 'scream-three', 'Spooky scream'],
  ['brains.wav', 'zombie-brains', 'Zombie: Brains!'],
  ['brains2.wav', 'zombie-brains-two', 'Zombie voice: Brains'],
  ['brains3.wav', 'zombie-brains-three', 'Hungry zombie'],
  ['crackly_groan.wav', 'crackly-groan', 'Crackling monster groan'],
  ['groan.wav', 'ghost-groan', 'Ghostly groan'],
  ['rar.wav', 'monster-roar', 'Monster roar'],
  ['creepy_mouth_breathing.wav', 'creepy-breathing', 'Creepy breathing'],
  ['creaking_and_breathing.wav', 'haunted-breathing', 'Creaks and breathing'],
  ['stairs,wav.wav', 'haunted-stairs', 'Haunted stairs'],
  ['knocking.wav', 'ghost-knocking', 'Ghostly knocking'],
  ['doorslam.wav', 'haunted-door-slam', 'Haunted door slam'],
  ['doorclose.wav', 'door-closing', 'Spooky door closing'],
  ['creak1.wav', 'attic-creak', 'Attic creak'],
  ['creak2.wav', 'floorboard-creak', 'Creaking floorboards'],
  ['thuds.wav', 'heavy-thuds', 'Heavy thuds'],
  ['thud2.wav', 'sudden-thump', 'Sudden thump'],
];
const sourceDir = path.join(root, '.private-audio', 'bart-originals');
const outputDir = path.join(root, 'audio', 'imported', 'halloween');
fs.mkdirSync(sourceDir, {recursive: true});
fs.mkdirSync(outputDir, {recursive: true});
const python = process.env.PYTHON_PATH || 'python3';
const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';
const ffprobe = process.env.FFPROBE_PATH || 'ffprobe';
// Extract only exact selected names, never arbitrary archive paths.
execFileSync(python, ['-c',
  'import json,pathlib,sys,zipfile; z=zipfile.ZipFile(sys.argv[1]); out=pathlib.Path(sys.argv[2]); names=json.loads(sys.argv[3]); [(out/name).write_bytes(z.read(name)) for name in names]',
  archive, sourceDir, JSON.stringify(selected.map(([name]) => name))], {stdio: 'pipe'});
const clips = selected.map(([originalFile, slug, title]) => {
  const file = path.join(outputDir, slug + '.mp3');
  const original = path.join(sourceDir, originalFile);
  const measured = spawnSync(ffmpeg, ['-hide_banner', '-i', original, '-af', 'volumedetect', '-f', 'null', '-'], {encoding: 'utf8'});
  const peak = /max_volume:\s*(-?[\d.]+) dB/.exec(measured.stderr || '');
  if (measured.status || !peak) throw new Error('Could not measure recording: ' + originalFile);
  const gain = (-3 - Number(peak[1])).toFixed(2);
  execFileSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-i', original,
    '-map_metadata', '-1', '-vn', '-af', `volume=${gain}dB`, '-codec:a', 'libmp3lame', '-b:a', '160k', '-ar', '44100', file], {stdio: 'pipe'});
  const probe = JSON.parse(execFileSync(ffprobe, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'json', file], {encoding: 'utf8'}));
  const duration = Number(probe.format.duration);
  if (!(duration > 0)) throw new Error('Invalid audio: ' + originalFile);
  return {id: 'bart-spooky-' + slug, title, kind: 'effects', url: './audio/imported/halloween/' + slug + '.mp3',
    duration, sourceUrl, creator: 'bart', license: 'CC BY 3.0', licenseUrl, originalFile,
    changes: 'Peak-balanced original WAV recording to -3 dB and converted to 160 kbps MP3; audio not synthesized.',
    sha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')};
});
const existing = JSON.parse(fs.readFileSync(path.join(root, 'library.json'), 'utf8'));
const catalog = {title: 'Ring for Candy · Halloween sounds', version: '3.3.0', clips: [...clips, ...existing.clips.filter(clip => clip.kind === 'music')]};
fs.writeFileSync(path.join(root, 'library.json'), JSON.stringify(catalog, null, 2) + '\n');
fs.writeFileSync(path.join(root, 'beta', 'library.json'), JSON.stringify({...catalog,
  clips: catalog.clips.map(clip => ({...clip, url: '.' + clip.url}))}, null, 2) + '\n');
console.log(`Imported ${clips.length} real Halloween recordings, ${clips.reduce((n, clip) => n + fs.statSync(path.resolve(root, clip.url)).size, 0)} bytes. Root and beta catalogues populated.`);

require('./sync-catalog.cjs');
