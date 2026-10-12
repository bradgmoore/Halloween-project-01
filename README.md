# Ring for Candy · Halloween soundboard

Ring the bell. Candy descends. A static mobile web app for the doorbell statue, balcony candy drop, and Bluetooth speaker. Install it on an iPhone or Lenovo tablet from the browser. No backend, account, paid API, or runtime dependencies are required.

## Party workflow

1. Connect the Bluetooth speaker in the device’s settings, open the app, and test its output.
2. Use **Download all for offline** in Halloween library. Wait for **Ready offline: all 96 sounds saved**.
3. Tap **Party mode**. Guests see larger sound controls and the library first; owner editing is hidden. A supported browser requests a screen wake lock. Owner controls returns after confirmation. This is an accidental-edit guard, not authentication.
4. Star favorite sounds or use Recently played. Search and category filters still work.
5. Optionally start a looping atmosphere in Haunting scenes. The background automatically quiets while another sound plays or while the mic is open.
6. Use **Stop all audio** to stop foreground audio, atmosphere, previews, recording and pending capture/playback.

A direct guest URL is the app address followed by `?mode=party`. Offline navigation supports this link.

## Push-to-talk only

In **Push to talk**, tap **Find device microphone**, grant permission if needed, and check the selected input. A recognizable built-in device microphone is preferred. Bluetooth/headset/USB inputs are excluded; ambiguous labeled device inputs can be selected manually. The app displays the selected and active input. The preference is specific to that browser/device and is not copied in setup files.

Hold **Hold to talk** to open the mic and speak; release it to mute and close the capture. Mouse, touch/pointer, and keyboard Space/Enter holds are supported. Release, pointer cancellation, lost capture, focus loss, leaving the live tab, page hiding, device loss, or emergency Stop cancels the capture, including pending microphone permission requests. There is no latched Start/End speaking mode.

The app requests an exact microphone `deviceId`, checks the browser-reported result and stops if it differs or cannot be identified. The signal meter helps verify audio arrival. Natural, Witch, Zombie, Ghoul, Demon and Ghost processing runs locally using AudioWorklet. Live audio is not uploaded or recorded. Pitch processing, echoes and Bluetooth buffering add latency.

**A browser cannot guarantee physical built-in-mic/Bluetooth-output routing on iOS or Android.** Input identity checks confirm the browser’s report, not the OS hardware route. If the meter moves but nothing comes from the speaker, use Test speaker output, adjust master/live volume and check the OS output destination. Keep the device away from the speaker and start at low volume. Test your actual phone/tablet and speaker before the event. A native audio integration or separate speaker-connected mic may be needed if the OS cannot maintain the desired route.

## Custom sounds and filtered recordings

The front page retains twelve independent programmable pads. Record & assign supports uploads, previews, naming and button assignment. Natural or filtered recordings use the same selected device microphone. Filtered recording sends processed audio to a local recording stream, not to the speaker, reducing dependence on duplex Bluetooth routing.

Uploads and recordings are limited to 25 MB per clip; recordings automatically finish at three minutes. Oversized takes are discarded. Files are decoded before saving/importing. Prefer MP3, WAV or AAC; microphone recording uses the browser-supported format. Browser storage retains clips across reloads but may be evicted. No clips are uploaded to GitHub or a server.

## Copy setup from phone to tablet

Use **Export setup** or **Share setup to tablet** in Record & assign. A supporting browser opens the native share sheet; otherwise the app downloads a JSON file. Transfer that file to the tablet, open Record & assign there and choose Restore backup.

Version 2 setup files include the twelve custom clips, favorites, recently played list, scene choice/volume and master volume. They exclude microphone IDs and library cache contents. Legacy version 1 backups are supported. The full import is validated before replacing clips in one IndexedDB transaction. JSON imports are limited to 420 MB; an exported setup containing the maximum supported twelve clips fits within this allowance. Large backups can use substantial browser memory; smaller clips are preferable.

## Halloween library and rights

96 self-hosted, CC0 clips:

- 64 original procedural compositions grouped into eight categories: ghosts, creatures, eerie melodies, haunted atmospheres, cursed radio, rituals, suspense, and synthesized shrieks. These are synthesized textures, not human voice recordings or film samples.
- 32 Kenney prerecorded scare phrases: sixteen source phrases across two voices, in original and Demon-processed forms. These are spoken phrases, not recorded screams or laughter. Source revision, CC0 license and SHA-256 checksums are included in `audio/recorded/`. No unidentified third-party scream packs were imported.

See [audio credits](audio/CREDITS.md). The original twelve Kenney prop sounds remain for compatibility but are not shown in the guest list. No external archive API or secret key is configured.

The complete collection can be downloaded locally. Partial/cancelled downloads retain completed clips and show readiness counts. A stable cache scoped to this app preserves audio through shell updates. Legacy audio caches are migrated; unrelated same-origin caches are preserved. Browser cache eviction remains possible. The Update notice lets you stop audio and activate a new shell. Offline MP3 range responses support mobile playback.

To regenerate procedural clips, install Python `numpy`, `scipy` and `ffmpeg`, then run `python3 tools/generate_library.py`. To reproduce the reviewed voice import, check out the exact pinned source revision documented in `tools/import_recorded_voices.py`, then pass its local path to that script. Hosting the generated app requires none of these tools.

## Run, test and deploy

Serve the files locally:

```sh
python3 -m http.server 8000
```

Microphone access needs trusted HTTPS on a physical phone/tablet; localhost is secure only on the development machine. A phone reaching a Windows LAN IP needs HTTPS. Windows can host the static files behind a trusted certificate, but GitHub Pages avoids maintaining that server.

GitHub Pages is configured for **main → /(root)**. `.nojekyll` serves the static files directly. Pushing to main triggers publication. App regression checks also run on pushes and PRs through `.github/workflows/checks.yml`. Branch-based Pages publication currently runs independently of those checks; a required pre-deployment gate would require switching Pages to a reviewed Actions deployment workflow in repository settings.

For regression tests:

```sh
npm ci
npx playwright install --with-deps chromium
npm test
```

The runner starts its own local server. `CHROMIUM_PATH` can select an installed Chromium. Tests cover actual audio decoding, favorites/history, offline pack and ranges, scene ducking, hold/release and keyboard PTT, cancelled capture, microphone mismatch rejection, filtered recording, Stop, pending recording/playback cancellation, setup round-trip, legacy audio migration, unrelated cache preservation and phone/tablet layouts. Tests use generated fake microphone audio and mocked input identities; they do not validate physical Bluetooth devices or voice intelligibility on those devices.

## Artwork and data

The generated cartoon illustration is inspired by the user’s statue photo and includes the tuxedo cat, glowing doorbell and rope-lowered candy bucket. The original personal photo is not published. Artwork is cached offline. No doorbell hardware automation is implemented.

The existing IndexedDB name and clip keys are retained to preserve custom sounds. All local data stays in this browser until exported. GitHub serves public app files; no analytics or cloud audio-storage service is configured. The manifest supports a home-screen app. It is not a signed native iOS application.

## Beta testing and recording retention

`/beta/` is an isolated copy of released v2.0 with a separate local database/settings, an automatic recording inbox, Keep flags, recording import/export/sharing, per-clip assignment, saved starting setup and reset controls that preserve recordings. Live application files remain separate. Testers use their own devices; recordings reach the organiser only through exported files at this stage. See [testing plan](TESTING_PLAN.md) and the beta's mobile-friendly `tester-guide.html`. A secure backend admin login is proposed in that plan and is not yet configured.
