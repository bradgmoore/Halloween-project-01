# Ring for Candy · iPhone soundboard

A Halloween doorbell soundboard for **one iPhone paired directly to a Bluetooth speaker**. The photo-inspired girl, cat and candy-drop artwork remains the theme.

## Soundpad · 3.1.0

The Soundpad has the first **two custom buttons**, followed by one direct Play button for every published or locally added audio track. There is no separate library tab and no provider website link in the app. Playback stays on this page. Sound effects and music share the same button grid; music can loop. Search filters the tracks while retaining the two custom buttons. Party mode opens the Soundpad.

The existing device database and its blobs are preserved. Buttons 3–12 are retired from the interface; their saved audio remains in the database and legacy setup exports to avoid deleting recordings. Editing and beta inbox assignment now target only buttons 1–2. Record & assign also retains optional local audio-file import; imported files get their own Soundpad buttons rather than replacing the two custom recordings.

Saved files and the speaker test use native inline audio playback, started directly by the tap. They do not depend on microphone permission, an AudioContext or the live microphone output stream. The toolbar and footer show **3.1.0**. On iPhone, hardware volume buttons control speaker level; iOS may ignore programmatic media volume.

**Provider content remains blocked and incomplete.** The published `library.json` still contains zero provider tracks. This cloud environment's enforced network policy denies Pixabay and Epidemic Sound, so no track list, direct audio URL or provider playback terms have been verified. A domain-access draft was saved in Codex Environment settings; it has not been applied to the running environment. The app does not invent source URLs, substitute its retired generated sounds, or send users to provider websites.

Once verified track data is available, add it to `library.json` (and the beta copy) with `clips` entries containing `id`, `title`, `kind` (`effects` or `music`) and a playable HTTPS `url` or same-origin audio path. Every entry automatically becomes a Soundpad button without local assignment or import. Optional duration metadata is not required. Local imports are merged with the published entries. Published tracks can play even if browser storage is unavailable. A provider webpage URL is not itself a playable media URL; full-track availability and embedding permissions still require verification.

Added files stay privately in the browser's IndexedDB and work offline after the application shell has been cached. They are not included in the custom-button setup export; keep the original files as backup. Each imported file is limited to 25 MB. No provider catalogue has been copied into this repository.

## iPhone speaking

1. Pair the Bluetooth speaker directly to the iPhone and open the HTTPS app in Safari.
2. Open **Push to talk**, tap **Find device microphone**, and allow access before holding the talk button. Prefer the named iPhone/built-in input. Automatic input remains available when Safari hides input IDs.
3. Select **Natural** first. Hold to talk; release to close the microphone. Natural uses gain/analyser nodes without loading the pitch worklet. Filter presets remain available when AudioWorklet is supported.
4. Use **Test speaker output** and the input meter. If the meter responds but sound goes to the iPhone, select the Bluetooth speaker in Control Center while capture is active.

Only live mic monitoring uses a `playsinline` audio element fed by the processed Web Audio stream. Saved clips and library files play directly through native audio elements, separately from the microphone graph. Startup calls audio-element playback and AudioContext resume synchronously in the gesture before awaiting microphone permission. Where supported, the Audio Session API is set to `play-and-record` during capture and restored to `playback` after microphone shutdown. The input's reported identity is shown; a hidden Safari device ID alone no longer aborts a valid capture. A positively identified Bluetooth/headset mic or a reported explicit-ID mismatch still stops capture.

Release, pointer cancellation, focus loss, hiding the page, input loss and Stop close capture and invalidate pending requests. The microphone meter distinguishes input arrival from speaker output; browser tests cannot confirm physical Bluetooth routing. AudioContext interruptions and muted input are reported. iOS ultimately controls routing and Bluetooth introduces delay. A real iPhone/speaker test is still required; this release does not claim the user's hardware has been verified.

## Custom pads, recordings and beta

Existing custom recordings remain stored, with the first two assignments shown on the Soundpad. Recording/upload, voice filters, preview, complete pad setup export/share/restore and legacy backups remain. Clip recordings are limited to 25 MB and three minutes. Original browser data and downloads should be backed up separately.

The beta at `/beta/` has separate storage. Its Recording inbox, Keep flags, tester bundle import/export and baseline reset tools remain. Resetting beta pads does not erase archived takes. See [testing plan](TESTING_PLAN.md). The original v2.0 source hashes in `beta/SNAPSHOT.json` remain historical provenance; both app variants have now been intentionally upgraded to v3.1.0.

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
npm test
```

Tests verify preservation of both custom recordings byte-for-byte, hiding of the ten retired custom buttons without deleting their blobs, one Soundpad button per supplied catalogue entry, no external navigation, search/party/mobile layouts and playback without local storage. Catalogue tests use labelled test fixtures, not actual provider tracks. Tests also measure native file output with the microphone and live output graph deliberately unavailable, plus overlap/Stop cleanup, volume changes, the bundled speaker test and offline range requests. They also cover migration of existing pads, published catalogue loading, sound/music imports, playback/looping/offline persistence, Natural without worklets, **measured non-silent live output**, Audio Session transitions, missing input IDs, explicit input mismatch, PTT release/cancellation/keyboard, recording/backup, beta inbox retention/isolation and layouts. Inputs and Audio Session are simulated; these tests are not physical iPhone/Bluetooth certification.

GitHub Pages publishes `main → /(root)`. Regression checks run independently on pushes and PRs. The service worker preserves media and unrelated caches across shell updates; imported library media is stored in IndexedDB. Use the app's update notice after publication. No API key or audio-storage service is configured. Uploaded and recorded files are not sent to GitHub.
