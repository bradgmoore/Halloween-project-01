# Ring for Candy · iPhone soundboard

A Halloween doorbell soundboard for **one iPhone paired directly to a Bluetooth speaker**. The photo-inspired girl, cat and candy-drop artwork remains the theme.

## Simple audio library

**Sounds & music** has two sections:

- **Sound effects** opens the user's [Pixabay Halloween search](https://pixabay.com/sound-effects/search/halloween/). Play on Pixabay, or download selected clips and use **Add sound effect files**.
- **Music** opens the user's [Epidemic Sound Halloween Town collection](https://www.epidemicsound.com/music/themes/horror-thriller/halloween-town/). Listen on the provider site, or add downloaded tracks when your licence covers their use. Music can loop.

Added files are stored privately in this browser's IndexedDB and work offline after the application shell has been cached. Multiple audio files can be added at once. Search finds added files; Remove deletes only the library copy. The public site does not upload or redistribute those files. Imported library files are not included in the twelve-pad setup export: retain the original downloads as backup. Each file is limited to 25 MB; MP3/AAC are suitable for longer music tracks.

The generated catalogue, synthetic demo pad tones, multi-category lists and scene controls have been removed from the offered interface. Empty custom pads stay silent and explain how to add audio. Historical source files remain in Git for rollback, but the app does not list or automatically play them.

**No provider catalogue was downloaded or embedded.** This execution environment blocks requests to Pixabay and Epidemic Sound, and a search/playlist URL is not an authorised audio API. Both provider links are real browse links, not claims of an in-app integration. We have not verified provider download/embedding terms from this environment. Do not copy an entire catalogue into the public repository without establishing redistribution rights. User-added files remain local.

## iPhone speaking

1. Pair the Bluetooth speaker directly to the iPhone and open the HTTPS app in Safari.
2. Open **Push to talk**, tap **Find device microphone**, and allow access before holding the talk button. Prefer the named iPhone/built-in input. Automatic input remains available when Safari hides input IDs.
3. Select **Natural** first. Hold to talk; release to close the microphone. Natural uses gain/analyser nodes without loading the pitch worklet. Filter presets remain available when AudioWorklet is supported.
4. Use **Test speaker output** and the input meter. If the meter responds but sound goes to the iPhone, select the Bluetooth speaker in Control Center while capture is active.

Speaker playback, including live mic monitoring, is routed through one `playsinline` audio element fed by the processed Web Audio stream. Startup calls audio-element playback and AudioContext resume synchronously in the gesture before awaiting microphone permission. Where supported, the Audio Session API is set to `play-and-record` during capture and restored to `playback` after microphone shutdown. The input's reported identity is shown; a hidden Safari device ID alone no longer aborts a valid capture. A positively identified Bluetooth/headset mic or a reported explicit-ID mismatch still stops capture.

Release, pointer cancellation, focus loss, hiding the page, input loss and Stop close capture and invalidate pending requests. The microphone meter distinguishes input arrival from speaker output; browser tests cannot confirm physical Bluetooth routing. AudioContext interruptions and muted input are reported. iOS ultimately controls routing and Bluetooth introduces delay. A real iPhone/speaker test is still required; this release does not claim the user's hardware has been verified.

## Custom pads, recordings and beta

Existing twelve-pad assignments and recordings are preserved during IndexedDB migration. Recording/upload, voice filters, preview, complete pad setup export/share/restore and legacy backups remain. Clip recordings are limited to 25 MB and three minutes. Original browser data and downloads should be backed up separately.

The beta at `/beta/` has separate storage. Its Recording inbox, Keep flags, tester bundle import/export and baseline reset tools remain. Resetting beta pads does not erase archived takes. See [testing plan](TESTING_PLAN.md). The original v2.0 source hashes in `beta/SNAPSHOT.json` remain historical provenance; both app variants have now been intentionally upgraded to v3.0.

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

Tests cover migration of existing pads, provider URLs, separate sound/music imports, playback/looping/offline persistence, Natural without worklets, **measured non-silent live output**, Audio Session transitions, missing input IDs, explicit input mismatch, PTT release/cancellation/keyboard, recording/backup, beta inbox retention/isolation and layouts. Inputs and Audio Session are simulated; these tests are not physical iPhone/Bluetooth certification.

GitHub Pages publishes `main → /(root)`. Regression checks run independently on pushes and PRs. The service worker preserves media and unrelated caches across shell updates; imported library media is stored in IndexedDB. Use the app's update notice after publication. No API key or audio-storage service is configured. Uploaded and recorded files are not sent to GitHub.
