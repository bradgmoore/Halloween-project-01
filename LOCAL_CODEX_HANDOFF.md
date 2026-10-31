# Local Codex handoff: finish the Ring for Candy audio catalogue

> **Latest update, 31 October 2026, v3.3.0:** the published catalogue now has **20 effects plus 4 CC0 spooky music tracks** (Haunted House, Spooky Tune, Haunted Arcade, Spooky Dungeon), alongside the existing two custom slots. Use **Show → Spooky music**; Loop music is enabled by default. All 24 entries are bundled for immediate startup, hosted locally and cached offline in root and beta. Current source, credits and hashes are in the manifests and `audio/imported/halloween/CREDITS.md`. Re-import music with `node tools/import-music.cjs`; `tools/sync-catalog.cjs` updates beta and both bundled fallbacks. Tests cover 26 buttons, real output from 48 root/beta tracks, filtering/loop/Stop, offline hashes/ranges and recording preservation. The older scope below is historical. Continue pushing completed updates and verifying Pages plus regression checks.

> **Continuation update, 31 October 2026:** the user changed the scope to **20 Halloween sounds** and requested completed updates be pushed automatically. Version 3.2.0 now contains twenty actual recordings from bart's OpenGameArt spooky pack under CC BY 3.0, shared by production and beta. See `README.md`, the populated manifests, and `audio/imported/halloween/CREDITS.md` for current state, provenance and exact inventory. The blocked Pixabay file was not retrieved; Pixabay/Epidemic counts remain zero. The original handoff below records the earlier scope and cloud state and is retained as history.

Exported 31 October 2026, Australia/Sydney.

Open the repository in local Codex and give it this entire file. This is a continuation of an existing application, not a new build or a cloud-environment onboarding task.

## Your task

Complete the missing audio content. The user needs real Halloween sounds and music available as buttons on the Soundpad. The interface already supports this, but **zero Pixabay or Epidemic Sound tracks have been imported**. Do not mistake the existing interface, passing fixture tests, or empty catalogue for a completed feature.

The user has repeatedly requested:

> Keep the first two custom sound buttons I made. Remove the other ten custom buttons from view. Put a button for every Halloween audio clip from the two pages below on the same Soundpad. Pressing a button must play the audio inside this app. Do not send visitors to another website. If streaming/embedding is unsuitable, download and host the audio when permitted. Keep it simple.

Do the work through importing, testing, pushing, and verifying deployment. Code changes and publication to the existing GitHub Pages site are already authorized. Do not stop at another plan, upload picker, source-link card, or empty integration. Preserve any local changes you find.

## Repository and hosting

- Repository: https://github.com/bradgmoore/Halloween-project-01
- Branch to publish: `main`.
- Live app: https://bradgmoore.github.io/Halloween-project-01/
- Beta app: https://bradgmoore.github.io/Halloween-project-01/beta/
- Application baseline: version **3.1.0**, commit `71a44a96dcbfb1af095a2acd40cbd3428db4f93d`.
- Start from the latest `main`; later documentation commits may follow that application baseline. Do not reset to the old SHA.
- Hosting: GitHub Pages, `main` branch, `/(root)`, with `.nojekyll`.
- No runtime dependencies, server process, or production build step. Pushes to `main` trigger Pages publication. There is no hosted server to restart.
- `.github/workflows/checks.yml` runs tests independently of Pages. A successful deployment does not mean the tests passed.

## Exact sources requested

1. **Sound effects:** https://pixabay.com/sound-effects/search/halloween/
2. **Music:** https://www.epidemicsound.com/music/themes/horror-thriller/halloween-town/

The scope is the Halloween search results and Halloween Town collection linked above, including pagination where applicable. It is not every unrelated asset on either entire website. Do not silently limit the import to the first page or a handful of clips. Record how many tracks were discovered, imported, failed, or excluded, with reasons.

Use real source audio. The user rejected the earlier procedural/synthetic sounds and generic prop sounds. Old files under `audio/`, the Kenney collection, and `tools/generate_library.py` are historical leftovers, not an acceptable substitute for these provider tracks. Do not relabel generated clips or test tones as imported provider audio.

## Why the cloud task stopped

The managed cloud workspace had an enforced network allowlist that blocked both provider domains before an HTTP request reached them. A draft allowing `pixabay.com`, `*.pixabay.com`, `epidemicsound.com`, and `*.epidemicsound.com` was saved, but never applied to that running environment.

That is a cloud-workspace restriction, not evidence that the user's iPhone cannot play provider audio. Check connectivity normally on the local machine and respect its network controls. Do not spend this local task repeatedly editing the old cloud configuration. No provider track list, playback endpoint, download mechanism, API availability, or current hosting terms was verified in the cloud task.

Do not assume either webpage URL is an audio feed. Retrieve and inspect the actual pages and supported playback/download mechanisms. A webpage, HTML error document, or expired preview URL is not an audio file.

Check the actual provider terms for the intended public soundboard. “Royalty-free” does not automatically mean public domain or permission to mirror an entire catalogue. Epidemic Sound may require licensed account access or a different permitted playback arrangement. Use authorized downloads or supported playback; do not buy subscriptions or assume redistribution permission. If a provider genuinely requires a missing account, licence, or permission, identify the exact prerequisite and complete the available work for the other provider. Do not report a restricted or unavailable track as imported.

## User experience that must remain

- One **iPhone paired directly to a Bluetooth speaker**. There is no Lenovo/tablet in the current event setup and no phone-to-tablet audio relay.
- Existing “Ring for Candy” artwork and Halloween doorbell theme remain. The statue is the long-haired girl, with a cat; visitors ring a doorbell and candy is lowered from a balcony on a rope. Do not rename it “The Well.”
- Soundpad: first two custom buttons, then one button per real audio track. All tracks appear on that same page.
- No external provider navigation, source-link cards, or visitor redirects. Provenance URLs may be stored in metadata/documentation without becoming navigation in the app.
- Existing search, music looping, Stop all audio, overlap option, and Party mode remain simple and functional.
- Recording/upload and editing of the first two custom buttons remain.
- Existing push-to-talk and voice presets remain. Live speaking must stay hold-to-talk, releasing the mic on release/cancel/focus loss. Do not replace it with a toggle.
- Do not spend the audio-catalogue task redesigning the interface or rebuilding the microphone system.

## Storage: preserve the user's recordings

The user's two custom audio clips live in browser storage on their device. They are **not** in Git and cannot be recovered by cloning the repository. Preserve the storage schema and origin so the deployed app continues to find them.

- Production IndexedDB: `the-well`, version `2`; stores `clips` and `library_media`.
- Beta IndexedDB: `ring-candy-beta`, version `3`; stores `clips`, `library_media`, `recordings`, and `baseline`.
- Production settings use existing localStorage keys, including `candy-*` and `well-device-mic`. Beta settings use their separate `beta:` prefix.
- `CUSTOM_PAD_COUNT = 2` controls visible/editable custom buttons.
- `clips` is still a legacy 12-element array; setup exports/restores still support that shape. Indices 0 and 1 are the visible custom buttons. Retired indices 2–11 remain stored and backed up to avoid deleting recordings.
- Provider tracks belong in the published catalogue, not in custom slots. Do not overwrite indices 0 or 1 with downloaded sounds.
- Never clear IndexedDB/localStorage or unregister/erase all caches as an update strategy.
- Keep production and beta storage, service workers, and cache namespaces isolated.
- Beta recording inbox, Keep flags, tester imports/exports, and baseline reset controls must retain archived takes. These controls are local tools; secure admin authentication and automatic cloud submissions are not implemented.

## Existing implementation: add content to it

The runtime is plain HTML/CSS/JavaScript. Relevant files:

| File | Purpose |
| --- | --- |
| `app.js` | `loadPublishedCatalog()`, `loadCatalog()`, `renderPads()`, `playMedia()`; two custom pads followed by catalogue buttons |
| `library.json` | Published catalogue; currently `clips: []` |
| `index.html`, `style.css` | Soundpad, recording controls, push-to-talk, and theme |
| `iphone-audio.js` | Live microphone output endpoint and Natural voice processing |
| `microphone.js` | Device mic discovery/selection and input validation |
| `voice-effects.js`, `voice-processor.js` | Voice effects and AudioWorklet processing |
| `sw.js`, `cache-config.js` | Offline shell/media handling and cache isolation |
| `beta/` | Separate beta runtime copies; keep changes compatible with beta tools |
| `beta/beta-tools.js` | Recording archive, import/export, Keep flags, resets |
| `tests/` | Existing browser regression suites |

`loadPublishedCatalog()` fetches `./library.json`. Each entry needs a unique string `id`, a nonempty `title`, `kind` equal to `effects` or `music`, and a playable `url`. A same-origin relative file URL or HTTPS audio URL is supported. The app prefixes published IDs internally with `published:`; supply stable source IDs in the manifest.

`loadCatalog()` merges published entries with local `library_media` uploads. `renderPads()` automatically creates one direct Play button per entry after the two custom buttons. No per-track assignment UI is needed. Published audio can play even when browser storage is unavailable.

Schema illustration only; replace every placeholder with verified source data and a real file:

```json
{
  "title": "Ring for Candy · Sound effects and Music",
  "clips": [
    {
      "id": "pixabay-REAL-ASSET-ID",
      "title": "REAL SOURCE TITLE",
      "kind": "effects",
      "url": "./audio/imported/pixabay/REAL-ASSET-ID.mp3",
      "duration": 12.34,
      "sourceUrl": "VERIFIED ORIGINAL TRACK PAGE",
      "creator": "VERIFIED CREATOR",
      "license": "VERIFIED USAGE TERMS",
      "sha256": "ACTUAL FILE HASH"
    }
  ]
}
```

Only `id`, `title`, `kind`, and `url` are required by the current loader. Keep useful provenance, permissions evidence, and file hashes in metadata or a credits/inventory document. Do not commit the illustrative placeholder entry.

Prefer licensed, downloaded files hosted with the app when possible; this avoids expiring third-party URLs and visitor redirects. Use stable unique filenames. Validate that each download is an actual decodable audio file with a nonzero duration. Do not substitute previews for complete tracks without clearly identifying the difference and resolving it with the user.

For shared files stored under root `audio/imported/`, the production manifest can use `./audio/imported/...`; beta can use `../audio/imported/...`. Alternatively copy files into beta and use beta-local paths. Verify the chosen paths on GitHub Pages under `/Halloween-project-01/` and `/Halloween-project-01/beta/`; bare `/audio/...` paths would point outside the project. Avoid unnecessary duplicate music files and check current GitHub Pages/repository size limits before publishing a large collection.

## Playback and service-worker constraints

Saved/custom/catalogue files now play through native inline audio elements, with `play()` called from the user action. They must not depend on microphone permission or the live microphone output graph. An earlier implementation sent files through the live graph and caused playback failures. Preserve the independent native file playback path.

Only live microphone monitoring uses `PhoneAudioOutput`. Natural voice does not require the pitch AudioWorklet. Where available, the Audio Session API switches between `play-and-record` and `playback`. The live output element is paused when capture stops.

Current release markers:

- Version `3.1.0` in package files, both HTML pages, and script/style query strings.
- Root shell cache suffix: `shell-v9`.
- Beta shell cache suffix: `shell-beta-v4`.
- Stable media cache names are defined by `cache-config.js`; preserve them.

Bump release markers/cache revisions consistently for the completed import. Maintain the update notice and “Stop audio and update” flow. Preserve existing media and unrelated caches. The current service worker handles byte ranges for same-origin MP3s under `/audio/` and the speaker-test WAV; extend handling appropriately if introducing other formats. Do not claim a complete offline collection merely because the shell is cached—audio must actually be downloaded/cached and tested.

## Local setup and checks

Use the existing local checkout if present. Otherwise, these commands work in PowerShell with Git, Node.js 22 or newer, and Python installed:

```powershell
git clone https://github.com/bradgmoore/Halloween-project-01.git
cd Halloween-project-01
npm ci
npx playwright install chromium
npm test
```

For a local preview, run this in a separate terminal from the repository:

```powershell
py -m http.server 8000
```

If Python is available as `python` instead of `py`, use `python -m http.server 8000`. This is a development preview, not the production host. A physical iPhone needs trusted HTTPS for microphone access; a desktop's HTTP LAN address does not provide that. Use the deployed HTTPS site for the actual iPhone/speaker test.

On Linux, Playwright may need `npx playwright install --with-deps chromium`. The test scripts use `CHROMIUM_PATH` if set, otherwise `/usr/bin/chromium` if present, otherwise Playwright's installed browser.

Existing suites run by `npm test`:

- `tests/catalog.cjs`: manifest entries become Soundpad buttons; first two custom recordings stay byte-for-byte; retired pads remain stored; no external navigation; search/loop/party/layout and playback without storage.
- `tests/playback.cjs`: measures file audio output while mic/live graph are unavailable; overlap, volume, Stop cleanup, offline speaker test and range responses.
- `tests/e2e.cjs`: old database migration, imported files, recording/backup, simulated mic selection, measured live output, PTT release/cancellation, offline use, responsive layout.
- `tests/beta.cjs`: beta/live isolation, archived takes, Keep/assignment, baseline reset/restore retention, bundle import/deduplication.

**The catalogue suite currently injects test entries using an original test tone. It does not prove any real provider file exists.** Add checks against the actual populated manifests and downloaded assets: counts, unique IDs, existing files, valid audio, root/beta paths, and playback of real imported clips. Do not weaken existing assertions to get a pass.

Latest baseline local tests and GitHub checks passed. One earlier GitHub run failed without retrieved diagnostics; a subsequent run passed. `tests/report-error.cjs` now exposes future failures in GitHub check annotations. Investigate any recurrence rather than silently rerunning until green.

Browser tests simulate capture and cannot certify physical iPhone/Bluetooth routing or latency. Do not claim the live microphone hardware issue is verified resolved without testing the actual phone and speaker.

## Completion criteria and publication

1. Retrieve the real catalogues from the two requested pages using local access. Establish the discoverable scope and permitted playback/hosting method.
2. Download or integrate the actual usable audio. Populate production and beta manifests; keep an exact import inventory and identify any verified blockers or excluded tracks.
3. Confirm a fresh browser sees the real audio buttons without manually uploading anything. Preserve both existing custom assignments. All track playback stays inside the Soundpad.
4. Validate real audio assets and run the regression suites. Check root/beta paths, Stop, music looping, responsive layout, and service-worker update behavior.
5. Commit and push the completed work to the existing repository using normal local Git authentication. Do not discard local work or force-push over others' changes.
6. Verify the Pages deployment and regression checks for the exact pushed commit. Open the deployed site and verify actual media responses/playback; a push alone is not proof of a live working collection.
7. Report the live URL, version/commit, exact imported counts for each provider, any missing/restricted items, test results, and remaining physical-device checks. Do not say “all clips imported” while manifests are empty, URLs fail, only fixtures play, or some requested tracks remain unresolved.

Keep the user informed in short, plain updates. The user is frustrated by repeated layout changes while the core audio content remains absent. The priority is actual playable content and an accurate account of what is complete.
