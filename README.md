# The Well · Halloween soundboard

An installable mobile web soundboard for an iPhone controlling a Halloween statue. Original dark well / haunted television styling inspired by the requested atmosphere; no film audio or artwork is bundled. The Halloween library includes 64 original procedural audio compositions released under CC0. These are synthesized audio, not human voice recordings. The twelve initial buttons play synthesized demo tones. Replace these with your own recordings or licensed audio.

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
- Experimental live microphone passthrough, adjustable gain, explicit start/stop and automatic microphone release when the app is hidden.

Local browser storage is not permanent or synced. Safari and an installed home-screen app may use separate storage. Make backups, especially before clearing data or changing where you open the app. Prefer MP3, WAV or AAC for uploads; actual codec support depends on iOS. Recording uses the browser's supported format.

## Halloween library

For guests on the Lenovo tablet, open **Halloween library**, choose a category or search, then tap a sound to play it. Tap the playing sound again or use **Stop sound** to stop. Playbacks are exclusive across the library and custom pads. The twelve programmable pads, recording and upload features retain their separate workflow and stored data.

The included `library.json` automatically loads 64 MP3 clips grouped into Ghosts & spirits, Creatures & monsters, Eerie melodies, Haunted atmospheres, Cursed radio, Rituals & dark magic, Suspense & reveals, and Synthesized shrieks. These are original procedural audio compositions, including synthesized ghost/creature textures. They do not contain real human voices or film recordings. They are offered under CC0 1.0 with no account, provider subscription or API key. See `audio/spooky/CREDITS.md` and `audio/LICENSE-CC0.txt`.

The original twelve Kenney prop clips remain in `audio/` for compatibility but are no longer listed in the guest library. No unrelated third-party recordings have been imported. This is a self-hosted original collection, not an integration with a third-party audio archive.

The app shell and catalog are cached for offline use. Individual library clips become available offline after playback successfully fetches and caches them; the whole collection is not automatically downloaded. Browser storage can be evicted. MP3 range requests are served from cached full files to support mobile audio playback. Keep the tablet online or test the desired clips offline before the event.

To regenerate this collection from the repository root, install Python packages `numpy` and `scipy` and have `ffmpeg` available, then run `python3 tools/generate_library.py`. None of these tools is required to host or run the app.

For a future external audio archive, verify per-clip download/redistribution licenses and hosting access before adding files. A service requiring secret API credentials needs a separate HTTPS backend; never put credentials in GitHub Pages source.

## iOS live voice limitations and native option

Live voice is experimental. Bluetooth buffering causes delay; enabling the microphone can change the iOS audio route or activate a lower-quality headset mode. Some speakers have no microphone or compatible duplex profile. Browser JavaScript cannot force a particular route. Test the actual iPhone 15 Pro Max and speaker before the event, at low volume with the phone away from the speaker to prevent feedback. Browser tests establish microphone processing, not real Bluetooth routing or latency.

For a native app, either wrap this UI with Capacitor and implement a native audio plugin, or build with SwiftUI and AVAudioEngine/AVAudioSession. Native audio APIs provide more control but still cannot remove Bluetooth latency or guarantee every speaker supports live monitoring. Consider a separate wireless microphone connected to the speaker if dependable live speech is essential. Building/installing native iOS apps requires a Mac with Xcode and Apple signing. Free personal signing is short-lived and typically requires re-signing every seven days; paid developer membership supports longer distribution options such as TestFlight (builds expire after 90 days). A home-screen web app avoids signing.

## Validation

Browser checks exercise the 64 audio files (non-silent and decodable), eight categories, search, playback and stop, rapid-tap cancellation, exclusive playback across library and pads, custom upload persistence, tablet/phone layouts, and offline catalog/cached playback. Physical Lenovo Bluetooth and iPhone microphone routing still require device testing. No external provider API is configured.

See [CODEX_PROMPT.md](CODEX_PROMPT.md) for the reusable build brief.
