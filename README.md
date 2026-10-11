# The Well · Halloween soundboard

An installable mobile web soundboard for an iPhone controlling a Halloween statue. Original dark well / haunted television styling inspired by the requested atmosphere; no film audio, artwork or licensed sound library is bundled. The twelve initial buttons play synthesized demo tones. Replace these with your own recordings or licensed audio.

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
- An online-library tab for direct HTTPS audio URLs or a curated JSON catalog. Downloads are saved locally and require CORS-enabled sources serving an audio content type.
- Cached application shell for offline use after the first successful visit. User clips remain in IndexedDB.
- Experimental live microphone passthrough, adjustable gain, explicit start/stop and automatic microphone release when the app is hidden.

Local browser storage is not permanent or synced. Safari and an installed home-screen app may use separate storage. Make backups, especially before clearing data or changing where you open the app. Prefer MP3, WAV or AAC for uploads; actual codec support depends on iOS. Recording uses the browser's supported format.

## Online library

Host a JSON document with this shape and replace the example audio URL with a real, licensed file:

```json
{
  "clips": [
    {"title": "Creaking door", "url": "https://your-host.example/audio/door.mp3"}
  ]
}
```

The catalog and audio host must permit CORS requests from the app's origin. Select the destination in Record & assign, then download a library clip. Catalog titles are treated as text, never HTML. Only use audio you have permission to download and play.

A provider integration (for example a sound-effects search service) needs confirmation of its API terms, licensing, authentication and CORS behavior. For providers requiring secret credentials, use an HTTPS backend or serverless function which holds the key, queries the provider and returns normalized `clips` entries. Never embed a secret key in GitHub Pages source. No provider, key or paid subscription is currently configured.

## iOS live voice limitations and native option

Live voice is experimental. Bluetooth buffering causes delay; enabling the microphone can change the iOS audio route or activate a lower-quality headset mode. Some speakers have no microphone or compatible duplex profile. Browser JavaScript cannot force a particular route. Test the actual iPhone 15 Pro Max and speaker before the event, at low volume with the phone away from the speaker to prevent feedback. Browser tests establish microphone processing, not real Bluetooth routing or latency.

For a native app, either wrap this UI with Capacitor and implement a native audio plugin, or build with SwiftUI and AVAudioEngine/AVAudioSession. Native audio APIs provide more control but still cannot remove Bluetooth latency or guarantee every speaker supports live monitoring. Consider a separate wireless microphone connected to the speaker if dependable live speech is essential. Building/installing native iOS apps requires a Mac with Xcode and Apple signing. Free personal signing is short-lived and typically requires re-signing every seven days; paid developer membership supports longer distribution options such as TestFlight (builds expire after 90 days). A home-screen web app avoids signing.

## Validation

Automated Chromium checks exercised the twelve pads, playback and stop, recording, persistence after reload, recorded clip playback, live microphone start/stop, offline reload, and the 430px mobile layout. Hardware iPhone/Bluetooth checks still need to be performed. No external library service has been configured or validated.

See [CODEX_PROMPT.md](CODEX_PROMPT.md) for the reusable build brief.
