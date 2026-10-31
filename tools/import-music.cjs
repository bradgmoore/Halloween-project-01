// Four individually selected CC0 Halloween music tracks from OpenGameArt.
// Run: node tools/import-music.cjs (requires ffmpeg and ffprobe on PATH).
// Source downloads remain private; only the MP3s and provenance are published.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');
const selected = [
  {slug: 'haunted-house-music', title: 'Haunted House', originalTitle: 'Haunted Track (minor)', creator: 'Gena Sealov', page: 'haunted-track', file: 'haunted_track_minor_0.mp3'},
  {slug: 'spooky-tune-music', title: 'Spooky Tune', originalTitle: 'Spooky Tune', creator: 'tamesu', page: 'spooky-tune', file: 'spooky_tune_1.mp3'},
  {slug: 'haunted-arcade-music', title: 'Haunted Arcade', originalTitle: 'Void Estate (haunted arcade)', creator: 'Zane Little Music', page: 'haunting-chiptune-loop-void-estate', file: 'void_estate_haunted_arcade_0.ogg'},
  {slug: 'spooky-dungeon-music', title: 'Spooky Dungeon', originalTitle: 'Spooky Dungeon', creator: "Memoraphile @ You're Perfect Studio", page: 'spooky-dungeon', file: 'Memoraphile - Spooky Dungeon.mp3'}
];
const sourceDir = path.join(root, '.private-audio', 'music-originals');
const outputDir = path.join(root, 'audio', 'imported', 'halloween');
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
async function main() {
  fs.mkdirSync(sourceDir, {recursive: true});
  fs.mkdirSync(outputDir, {recursive: true});
  const clips = [];
  for (const item of selected) {
    const sourceUrl = 'https://opengameart.org/content/' + item.page;
    const downloadUrl = 'https://opengameart.org/sites/default/files/' + encodeURIComponent(item.file);
    const response = await fetch(downloadUrl);
    if (!response.ok) throw Error(`Download failed (${response.status}): ${downloadUrl}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (!bytes.length || response.headers.get('content-type')?.includes('text/html')) throw Error('Expected audio: ' + item.file);
    const original = path.join(sourceDir, item.file), output = path.join(outputDir, item.slug + '.mp3');
    fs.writeFileSync(original, bytes);
    // Keep the complete composition; normalize music to a comfortable level.
    const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';
    // No trimming or synthetic audio.
    execFileSync(ffmpeg, ['-hide_banner', '-nostdin', '-v', 'error', '-y', '-i', original,
      '-map_metadata', '-1', '-vn', '-af', 'loudnorm=I=-18:TP=-2:LRA=11', '-ar', '44100',
      '-codec:a', 'libmp3lame', '-b:a', '160k', output], {stdio: 'pipe'});
    const probe = JSON.parse(execFileSync(process.env.FFPROBE_PATH || 'ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'json', output], {encoding: 'utf8'}));
    const duration = Number(probe.format.duration);
    if (!(duration > 20)) throw Error('Expected full-length music: ' + item.title);
    clips.push({id: 'oga-music-' + item.slug, title: item.title, kind: 'music',
      url: './audio/imported/halloween/' + item.slug + '.mp3', duration, sourceUrl,
      creator: item.creator, license: 'CC0 1.0', licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
      originalTitle: item.originalTitle, originalFile: item.file, downloadUrl, sourceSha256: sha256(bytes),
      changes: 'Complete original composition, loudness-normalized to -18 LUFS and converted to 160 kbps MP3; no trimming or synthesis.',
      sha256: sha256(fs.readFileSync(output))});
    console.log(`${item.title}: ${duration.toFixed(1)}s, ${fs.statSync(output).size} bytes`);
  }
  const file = path.join(root, 'library.json'), catalog = JSON.parse(fs.readFileSync(file, 'utf8'));
  catalog.clips = [...catalog.clips.filter(clip => !clip.id.startsWith('oga-music-')), ...clips];
  catalog.version = '3.3.0';
  fs.writeFileSync(file, JSON.stringify(catalog, null, 2) + '\n');
  require('./sync-catalog.cjs');
}
main().catch(error => {console.error(error.message); process.exitCode = 1;});
