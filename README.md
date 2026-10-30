# Ring for Candy · iPhone soundboard

A Halloween doorbell soundboard for **one iPhone paired directly to a Bluetooth speaker**. The photo-inspired girl, cat and candy-drop artwork remains the theme.

## Soundpad · 3.2.0

The Soundpad has the first **two custom buttons**, followed by one direct Play button for every published or locally added audio track. There is no separate library tab and no provider website link in the app. Playback stays on this page. Sound effects and music share the same button grid; music can loop. Search filters the tracks while retaining the two custom buttons. Party mode opens the Soundpad.

The existing device database and its blobs are preserved. Buttons 3–12 are retired from the interface; their saved audio remains in the database and legacy setup exports to avoid deleting recordings. Editing and beta inbox assignment now target only buttons 1–2. Record & assign also retains optional local audio-file import; imported files get their own Soundpad buttons rather than replacing the two custom recordings.

Saved files and the speaker test use native inline audio playback, started directly by the tap. They do not depend on microphone permission, an AudioContext or the live microphone output stream. The toolbar and footer show **3.2.0**. On iPhone, hardware volume buttons control speaker level; iOS may ignore programmatic media volume.

**Twenty real Halloween recordings are included.** A fresh browser sees twenty Play buttons after the two custom buttons: witch cackle, three screams, three zombie voices, monster/ghost groans, a roar, creepy breathing, haunted stairs, knocking, doors, creaks and thumps. No local upload or provider navigation is required.

The recordings are by **bart**, from [25 spooky sound effects on OpenGameArt.org](https://opengameart.org/content/25-spooky-sound-effects), licensed [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/). The original human recordings were converted from WAV to MP3; they are not the retired synthesized or Kenney sounds. Source filenames, licence, durations and SHA-256 hashes are in both published manifests. See the [credits and exact import inventory](audio/imported/halloween/CREDITS.md).

The twenty MP3s total about 1.8 MB and are shared by production and beta. The service worker saves the full published collection during installation, with separate production/beta media caches. Published tracks also play when browser storage is unavailable, while online. Local imports remain private in IndexedDB and are merged with the published tracks. They are not included in custom-button setup exports; keep the original files as backup. Each local import is limited to 25 MB.

The final scope is twenty Halloween effects, rather than every result from the original providers. Pixabay and Epidemic Sound imports remain at zero: the blocked Pixabay file was not retrieved and no Epidemic subscription was purchased. This release supplies hosting-permitted OpenGameArt recordings instead.

## iPhone speaking

1. Pair the Bluetooth speaker directly to the iPhone and open the HTTPS app in Safari.
2. Open **Push to talk**, tap **Find device microphone**, and allow access before holding the talk button. Prefer the named iPhone/built-in input. Automatic input remains available when Safari hides input IDs.
3. Select **Natural** first. Hold to talk; release to close the microphone. Natural uses gain/analyser nodes without loading the pitch worklet. Filter presets remain available when AudioWorklet is supported.
4. Use **Test speaker output** and the input meter. If the meter responds but sound goes to the iPhone, select the Bluetooth speaker in Control Center while capture is active.

Only live mic monitoring uses a `playsinline` audio element fed by the processed Web Audio stream. Saved clips and library files play directly through native audio elements, separately from the microphone graph. Startup calls audio-element playback and AudioContext resume synchronously in the gesture before awaiting microphone permission. Where supported, the Audio Session API is set to `play-and-record` during capture and restored to `playback` after microphone shutdown. The input's reported identity is shown; a hidden Safari device ID alone no longer aborts a valid capture. A positively identified Bluetooth/headset mic or a reported explicit-ID mismatch still stops capture.

Release, pointer cancellation, focus loss, hiding the page, input loss and Stop close capture and invalidate pending requests. The microphone meter distinguishes input arrival from speaker output; browser tests cannot confirm physical Bluetooth routing. AudioContext interruptions and muted input are reported. iOS ultimately controls routing and Bluetooth introduces delay. A real iPhone/speaker test is still required; this release does not claim the user's hardware has been verified.

## Custom pads, recordings and beta

Existing custom recordings remain stored, with the first two assignments shown on the Soundpad. Recording/upload, voice filters, preview, complete pad setup export/share/restore and legacy backups remain. Clip recordings are limited to 25 MB and three minutes. Original browser data and downloads should be backed up separately.

The beta at `/beta/` has separate storage. Its Recording inbox, Keep flags, tester bundle import/export and baseline reset tools remain. Resetting beta pads does not erase archived takes. See [testing plan](TESTING_PLAN.md). The original v2.0 source hashes in `beta/SNAPSHOT.json` remain historical provenance; both app variants have now been intentionally upgraded to v3.2.0.

There is no phone-to-tablet relay and no remote microphone dependency. Secure admin login and automatic cloud submissions remain unconfigured; the local owner tools are not authentication.

## Run and validate

No runtime dependencies or build step:

```sh
python3 -m http.server 8000
```

Use trusted HTTPS for microphone access on an iPhone. Localhost is only secure on the machine serving it.

Regression checks:

```sh
npm ci
npx playwright install --with-deps chromium
# Install ffmpeg/ffprobe for real-asset validation (Ubuntu: sudo apt-get install ffmpeg).
npm test
```

Tests validate the twenty real published files, hashes, decoded durations, MP3 integrity and shared production/beta paths. Browser tests load the real manifests and exercise the actual recordings. The existing fixture suites separately verify preservation of both custom recordings byte-for-byte, hiding of retired buttons without deleting their blobs, no external navigation, search/party/mobile layouts and playback without local storage. They also measure native file output with the microphone/live graph unavailable, overlap/Stop cleanup, volume, the speaker test, offline ranges, migration, recording/backup, PTT cancellation and beta archive isolation. Simulated capture and Audio Session checks are not physical iPhone/Bluetooth certification.

GitHub Pages publishes `main → /(root)`. Regression checks run independently on pushes and PRs. The service worker preserves media and unrelated caches across shell updates; imported library media is stored in IndexedDB. Use the app's update notice after publication. No API key or audio-storage service is configured. Uploaded and recorded files are not sent to GitHub.
