# Ring for Candy · Halloween soundboard

An installable mobile web soundboard for an iPhone controlling a Halloween statue. Photo-inspired ghoulish cartoon styling for the doorbell statue and balcony candy drop; no film audio or artwork is bundled. The Halloween library includes 64 original procedural audio compositions released under CC0. These are synthesized audio, not human voice recordings. The twelve initial buttons play synthesized demo tones. Replace these with your own recordings or licensed audio.

## Run locally

No dependencies or build step:

```sh
cd /workspace/Halloween-project-01
python3 -m http.server 8000
```

Open with a local browser for development. Microphone recording requires a secure context: localhost works on the development machine, but an iPhone connecting to a Windows LAN IP needs HTTPS. Avoid serving sensitive files in the web root.

## Deploy to GitHub Pages

Push these files to `main`. In the repository's Settings → Pages, choose **Deploy from a branch**, select **main** and **/(root)**, and save. GitHub publishes these static files directly; `.nojekyll` disables Jekyll processing. No deployment has been performed as part of creating these files. GitHub Pages hosting availability depends on your account and repository visibility.

On your iPhone, open the resulting HTTPS site in Safari, then Share → Add to Home Screen. Connect the Bluetooth speaker in iOS Settings before using the soundboard. Select the output through Control Center if needed. The app cannot pair with or force a Bluetooth audio destination. Keep the app open and phone unlocked during your event; iOS background playback is not guaranteed.

A Windows IIS or other static server can also host these files with a trusted HTTPS certificate. GitHub Pages avoids maintaining a publicly reachable Windows server. Pages is static hosting: server-side API code must run elsewhere.

## Features

- Twelve programmable buttons, exclusive or overlapping playback, and emergency Stop all audio.
- Upload audio (25 MB per clip), microphone recording with preview, and IndexedDB persistence.
- Export/restore all twelve clips as a JSON backup. Restore validates the full backup before replacing data in one transaction.
- A standalone Halloween-library tab with 64 clips grouped into eight categories, search and one-tap playback. Library playback does not assign clips to or modify the custom soundpad. Playing a new library clip stops the previous one; the Stop controls cancel playback.
- Cached application shell for offline use after the first successful visit. User clips remain in IndexedDB.
- Live device-microphone selection with input verification and meter, adjustable gain, Natural/Witch/Zombie/Ghoul/Demon/Ghost presets, speaker test, explicit start/stop and microphone release when the app is hidden.

Local browser storage is not permanent or synced. Safari and an installed home-screen app may use separate storage. Make backups, especially before clearing data or changing where you open the app. Prefer MP3, WAV or AAC for uploads; actual codec support depends on iOS. Recording uses the browser's supported format.

## Halloween library

For guests on the Lenovo tablet, open **Halloween library**, choose a category or search, then tap a sound to play it. Tap the playing sound again or use **Stop sound** to stop. Playbacks are exclusive across the library and custom pads. The twelve programmable pads, recording and upload features retain their separate workflow and stored data.

The included `library.json` automatically loads 64 MP3 clips grouped into Ghosts & spirits, Creatures & monsters, Eerie melodies, Haunted atmospheres, Cursed radio, Rituals & dark magic, Suspense & reveals, and Synthesized shrieks. These are original procedural audio compositions, including synthesized ghost/creature textures. They do not contain real human voices or film recordings. They are offered under CC0 1.0 with no account, provider subscription or API key. See `audio/spooky/CREDITS.md` and `audio/LICENSE-CC0.txt`.

The original twelve Kenney prop clips remain in `audio/` for compatibility but are no longer listed in the guest library. No unrelated third-party recordings have been imported. This is a self-hosted original collection, not an integration with a third-party audio archive.

The app shell and catalog are cached for offline use. Individual library clips become available offline after playback successfully fetches and caches them; the whole collection is not automatically downloaded. Browser storage can be evicted. MP3 range requests are served from cached full files to support mobile audio playback. Keep the tablet online or test the desired clips offline before the event.

To regenerate this collection from the repository root, install Python packages `numpy` and `scipy` and have `ffmpeg` available, then run `python3 tools/generate_library.py`. None of these tools is required to host or run the app.

For a future external audio archive, verify per-clip download/redistribution licenses and hosting access before adding files. A service requiring secret API credentials needs a separate HTTPS backend; never put credentials in GitHub Pages source.

## Live voice: microphone and filters

In **Speak live**, tap **Find device microphone**, grant microphone permission, and select the phone/tablet input. Recognizable built-in input names are preferred. Inputs named Bluetooth, headset, AirPods, wireless or USB are excluded. Browsers with unlabeled/ambiguous inputs require manual choice; the app refuses to automatically start with an unverified default. The selected input is remembered on this browser. Before labels are available, a temporary permission stream may be opened only for device discovery and is released without playback.

**Start speaking** requests the selected microphone with an exact `deviceId`, checks the actual track settings, and stops if the browser reports a different or unidentifiable device. This verifies browser-reported identity, not the physical hardware route. The active input label and signal meter help diagnose capture. If the meter responds but the speaker stays silent, check live volume, **Test speaker output**, and the OS audio-output route. If mic access fails, check site microphone permissions, HTTPS and browser version. Microphone loss or device changes stop live playback when the input can no longer be verified. Stop and hidden-page events release microphone tracks, including captures still starting.

Choose **Natural**, **Witch**, **Zombie**, **Ghoul**, **Demon**, or **Ghost** before or while speaking. AudioWorklet processing changes pitch without changing speech speed; EQ, distortion, modulation and echo create the preset character. Natural bypasses pitch effects. Gain and a compressor limit output. Filters run locally; live audio is not recorded or uploaded. Modern Chrome or Safari with AudioWorklet over HTTPS is required. Pitch processing and echoes add latency in addition to Bluetooth buffering. Keep the device away from the speaker and begin at low volume to avoid feedback.

A web app cannot guarantee that a built-in microphone and Bluetooth speaker remain simultaneously routed by iOS or Android. iOS may switch output or use a headset mode after capture begins, even when the browser reports the requested mic. Physical iPhone/Lenovo/speaker tests are required. The app cannot pair devices or force an iOS output. If the OS cannot expose the built-in mic while using the speaker, use a native audio integration or a separate microphone connected to the speaker.

A native version can use SwiftUI with AVAudioEngine/AVAudioSession, or a Capacitor native audio plugin, for greater audio-session control. Native APIs still do not remove Bluetooth latency or guarantee compatibility with every speaker. Native iOS builds require a Mac, Xcode and signing; a home-screen web app avoids signing.

## Validation

Browser checks exercise the 64 audio files (non-silent and decodable), eight categories, search, playback and stop, rapid-tap cancellation, exclusive playback across library and pads, custom upload persistence, tablet/phone layouts, and offline catalog/cached playback. Live-voice tests use simulated microphone identities and real browser audio processing: explicit selection, Bluetooth exclusion, input mismatch rejection, meter signal, preset switching, gain, capture cleanup, pending-start cancellation, and six non-silent distinct rendered presets. Physical Lenovo Bluetooth and iPhone microphone routing still require device testing. No external provider API is configured.

See [CODEX_PROMPT.md](CODEX_PROMPT.md) for the reusable build brief.

To rerun the live tests, serve the repository locally, make Playwright and Chromium available to Node, and run `WELL_TEST_URL=http://localhost:8000 node tests/live-voice.cjs`. `CHROMIUM_PATH` can select an alternative Chromium executable. These tests use generated fake audio and browser input mocks; they do not test Bluetooth hardware.

## Ring for Candy theme

The name plays on the haunted girl and the doorbell visitors ring before candy is lowered from the balcony. The illustration in `assets/ring-for-candy.png` was generated from the user's statue photo and includes the tuxedo cat, glowing bell and rope-lowered candy bucket. It appears as the main artwork and a subdued page wallpaper. The source personal photo is not published. The dark panels keep controls readable; the phone navigation exposes all four tabs. No doorbell hardware control is implemented.

App names, colours and icons have been updated while retaining the existing IndexedDB name and storage keys to preserve custom recordings and assignments. The service worker caches the illustration for offline use.
