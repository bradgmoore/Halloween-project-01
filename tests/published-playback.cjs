'use strict';

// Exercise the real published catalogue. No manifest routes, tones or audio fixtures.
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const base = process.env.WELL_TEST_URL;
assert(base, 'WELL_TEST_URL must point to the local app test server');

async function customSnapshot(page) {
  return page.evaluate(async () => Promise.all(clips.map(async (clip, index) => clip ? {
    index, name: clip.name,
    sha256: Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', await clip.blob.arrayBuffer())), value => value.toString(16).padStart(2, '0')).join('')
  } : null)));
}

async function audioReference(page, clip) {
  const result = await page.evaluate(async entry => {
    const response = await fetch(entry.url);
    if (!response.ok) throw Error(`Real audio fetch failed: ${response.status} ${entry.url}`);
    const bytes = await response.arrayBuffer();
    const sha256 = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), value => value.toString(16).padStart(2, '0')).join('');
    const decoder = new AudioContext();
    try {
      const buffer = await decoder.decodeAudioData(bytes);
      const width = Math.min(buffer.length, Math.floor(buffer.sampleRate * 0.2));
      let maximum = 0, offset = 0;
      // Choose a real audible passage, so leading silence or a quiet transient
      // does not turn the native-output assertion into a test of the first frame.
      for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const samples = buffer.getChannelData(channel);
        for (let start = 0; start < samples.length; start += width) {
          let energy = 0;
          const end = Math.min(samples.length, start + width);
          for (let index = start; index < end; index++) energy += samples[index] * samples[index];
          const rms = Math.sqrt(energy / (end - start));
          if (rms > maximum) { maximum = rms; offset = Math.min(start / buffer.sampleRate, Math.max(0, buffer.duration - 0.2)); }
        }
      }
      return { sha256, duration: buffer.duration, maximum, offset };
    } finally { await decoder.close(); }
  }, clip);
  assert.equal(result.sha256, clip.sha256, `${clip.id} browser received different audio bytes`);
  assert(result.duration > 0 && result.maximum > 1e-7, `${clip.id} has no decoded audio signal`);
  return result;
}

async function playTrack(page, clip, reference) {
  const id = `published:${clip.id}`;
  await page.locator(`.library-play[data-clip-id="${id}"]`).click();
  await page.waitForFunction(expected => [...active].some(item => item.id === expected && item.audio.currentTime > 0 && !item.audio.paused), id);
  assert.equal(await page.evaluate(expected => [...active].find(item => item.id === expected)?.audio.loop, id), clip.kind === 'music', `${clip.id} has incorrect looping`);
  let measured = false;
  if (reference) {
    const output = await page.evaluate(async ({ expected, offset }) => {
      const audio = [...active].find(item => item.id === expected)?.audio;
      if (!audio) throw Error(`Real track ended before measurement: ${expected}`);
      if (typeof audio.captureStream !== 'function' || typeof MediaRecorder === 'undefined') return { supported: false };
      audio.pause();
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(Error('Audio seek timed out')), 5000);
        audio.addEventListener('seeked', () => { clearTimeout(timer); resolve(); }, { once: true });
        audio.currentTime = offset;
      });
      const stream = audio.captureStream();
      if (!stream.getAudioTracks().length) {
        await new Promise((resolve, reject) => {
          const timer = setTimeout(() => reject(Error('Native capture has no audio track')), 5000);
          stream.addEventListener('addtrack', () => { clearTimeout(timer); resolve(); }, { once: true });
          audio.play().catch(reject);
        });
      }
      const chunks = [], recorder = new MediaRecorder(stream);
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      const stopped = new Promise((resolve, reject) => { recorder.onstop = resolve; recorder.onerror = event => reject(event.error || Error('Native audio recording failed')); });
      recorder.start();
      await audio.play();
      await new Promise(resolve => setTimeout(resolve, 200));
      if (recorder.state !== 'inactive') recorder.stop();
      await stopped;
      const decoder = new AudioContext();
      try {
        const buffer = await decoder.decodeAudioData(await new Blob(chunks, { type: recorder.mimeType }).arrayBuffer());
        let energy = 0, count = 0;
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
          for (const sample of buffer.getChannelData(channel)) { energy += sample * sample; count++; }
        }
        return { supported: true, rms: Math.sqrt(energy / count) };
      } finally { await decoder.close(); stream.getTracks().forEach(track => track.stop()); }
    }, { expected: id, offset: reference.offset });
    if (output.supported) {
      assert(Number.isFinite(output.rms) && output.rms > 1e-7, `${clip.id} native media output was silent`);
      measured = true;
    }
  }
  await page.locator('#stop').click();
  assert.equal(await page.evaluate(() => active.size), 0, `${clip.id} did not stop`);
  assert.equal(await page.locator('body > audio:not(#speaker-output)').count(), 0, `${clip.id} left a file audio element behind`);
  return measured;
}

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || (fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined),
    args: ['--no-sandbox']
  });
  let measuredTracks = 0;
  try {
    for (const suffix of ['/', '/beta/']) {
      const catalog = JSON.parse(fs.readFileSync(path.join(root, suffix === '/' ? 'library.json' : 'beta/library.json'), 'utf8')).clips;
      assert.equal(catalog.length, 20, `${suffix} published catalogue must contain the actual twenty tracks`);
      const context = await browser.newContext(), page = await context.newPage();
      const errors = [], externalRequests = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('request', request => { if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== new URL(base).origin) externalRequests.push(request.url()); });
      try {
        await page.goto(base + suffix);
        await page.waitForFunction(() => db && libraryEntries.length === 20 && document.querySelectorAll('#pad-grid .pad').length === 22);
        assert.equal(await page.locator('.library-play').count(), 20);
        assert.equal(await page.locator('[data-custom-index]').count(), 2);
        assert.equal(await page.locator('#target option').count(), 2);
        assert.equal(await page.evaluate(() => clips.filter(Boolean).length), 0, 'fresh context unexpectedly contained custom recordings');
        assert.deepEqual(await page.evaluate(() => libraryEntries.map(entry => entry.id)), catalog.map(clip => `published:${clip.id}`));
        const seed = catalog.slice(0, 4).map((clip, index) => ({
          index: [0, 1, 2, 11][index], name: ['My first custom', 'My second custom', 'Retired third', 'Retired twelfth'][index],
          bytes: Array.from(fs.readFileSync(path.resolve(root, 'audio/imported/halloween', path.basename(clip.url))))
        }));
        await page.evaluate(async entries => { for (const entry of entries) await persist(entry.index, { name: entry.name, blob: new Blob([new Uint8Array(entry.bytes)], { type: 'audio/mpeg' }) }); }, seed);
        const originalCustom = await customSnapshot(page);
        await page.evaluate(() => navigator.serviceWorker.ready);
        await page.reload();
        await page.waitForFunction(() => navigator.serviceWorker.controller && db && libraryEntries.length === 20);
        assert.deepEqual(await customSnapshot(page), originalCustom);
        const references = new Map();
        for (const clip of catalog) {
          const reference = await audioReference(page, clip); references.set(clip.id, reference);
          if (await playTrack(page, clip, reference)) measuredTracks++;
        }
        assert.deepEqual(await customSnapshot(page), originalCustom, 'published playback changed custom or retired recordings');
        assert.deepEqual(await page.locator('[data-custom-index] span').allTextContents(), ['My first custom', 'My second custom']);
        const query = catalog[0].title.toLowerCase();
        await page.locator('#library-search').fill(query);
        assert.equal(await page.locator('.library-play').count(), catalog.filter(clip => clip.title.toLowerCase().includes(query)).length);
        assert.equal(await page.locator('[data-custom-index]').count(), 2);
        await page.locator('#library-search').fill('');
        const longest = [...catalog].sort((a, b) => b.duration - a.duration).slice(0, 2);
        await page.locator('#overlap').check();
        for (const clip of longest) await page.locator(`.library-play[data-clip-id="published:${clip.id}"]`).click();
        await page.waitForFunction(() => active.size === 2);
        await page.locator('#stop').click();
        assert.equal(await page.evaluate(() => active.size), 0);
        await page.locator('#overlap').uncheck();
        assert.equal(context.pages().length, 1, 'playback opened another page');
        assert.equal(page.url(), base + suffix, 'playback navigated away from the Soundpad');
        assert.deepEqual(externalRequests, [], 'actual catalogue playback requested another website');
        await page.setViewportSize({ width: 390, height: 900 });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        assert.equal(await page.locator('#pad-grid .pad').count(), 22);
        if (process.env.WELL_PUBLISHED_SCREENSHOT && suffix === '/') await page.screenshot({ path: process.env.WELL_PUBLISHED_SCREENSHOT, fullPage: true });

        // audioReference fetched every complete MP3 through the controlling worker.
        // Confirm all twenty bytes are in this app's media namespace before offline use.
        const cached = await page.evaluate(async entries => {
          const cache = await caches.open(APP_MEDIA_CACHE), result = [];
          for (const entry of entries) {
            const response = await cache.match(new URL(entry.url, location.href).href);
            result.push({ id: entry.id, status: response?.status, size: response ? (await response.arrayBuffer()).byteLength : 0 });
          }
          return result;
        }, catalog);
        assert(cached.every(entry => entry.status === 200 && entry.size > 0), `${suffix} did not cache every complete actual MP3`);
        await context.setOffline(true);
        await page.reload();
        await page.waitForFunction(() => db && libraryEntries.length === 20 && document.querySelectorAll('#pad-grid .pad').length === 22);
        assert.deepEqual(await customSnapshot(page), originalCustom);
        for (const clip of catalog) {
          const offline = await page.evaluate(async entry => {
            const response = await fetch(entry.url), body = new Uint8Array(await response.arrayBuffer());
            const sha256 = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', body)), value => value.toString(16).padStart(2, '0')).join('');
            const first = await fetch(entry.url, { headers: { Range: 'bytes=0-31' } });
            const firstBytes = new Uint8Array(await first.arrayBuffer());
            const tail = await fetch(entry.url, { headers: { Range: 'bytes=-16' } });
            const tailBytes = new Uint8Array(await tail.arrayBuffer());
            const invalid = await fetch(entry.url, { headers: { Range: `bytes=${body.length}-` } });
            return {
              status: response.status, sha256, size: body.length,
              firstStatus: first.status, firstRange: first.headers.get('Content-Range'), firstMatches: firstBytes.length === 32 && firstBytes.every((value, index) => value === body[index]),
              tailStatus: tail.status, tailRange: tail.headers.get('Content-Range'), tailMatches: tailBytes.length === 16 && tailBytes.every((value, index) => value === body[body.length - 16 + index]),
              invalidStatus: invalid.status, invalidRange: invalid.headers.get('Content-Range')
            };
          }, clip);
          assert.equal(offline.status, 200, `${clip.id} full offline response failed`);
          assert.equal(offline.sha256, clip.sha256, `${clip.id} offline audio differs from its real asset`);
          assert.equal(offline.firstStatus, 206); assert.equal(offline.firstRange, `bytes 0-31/${offline.size}`); assert(offline.firstMatches);
          assert.equal(offline.tailStatus, 206); assert.equal(offline.tailRange, `bytes ${offline.size - 16}-${offline.size - 1}/${offline.size}`); assert(offline.tailMatches);
          assert.equal(offline.invalidStatus, 416); assert.equal(offline.invalidRange, `bytes */${offline.size}`);
          await playTrack(page, clip);
        }
        assert.deepEqual(await customSnapshot(page), originalCustom);
        assert.deepEqual(errors, []);
      } finally { await context.close(); }
    }
    console.log(`PASS: all twenty actual catalogue tracks appear and play in production and beta (22 pads each); ${measuredTracks} native outputs measured; custom/retired bytes preserved; search, overlap and Stop pass; all actual MP3s reload, hash-match, play and serve correct byte ranges offline. No provider redirects or fixture injection.`);
  } finally { await browser.close(); }
})().catch(require('./report-error.cjs'));
