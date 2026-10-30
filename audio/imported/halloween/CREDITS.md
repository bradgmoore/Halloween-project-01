# Halloween sound credits

Twenty recordings from **25 spooky sound effects** by **bart**, via [OpenGameArt.org](https://opengameart.org/content/25-spooky-sound-effects), used under [Creative Commons Attribution 3.0 Unported (CC BY 3.0)](https://creativecommons.org/licenses/by/3.0/).

The source author recorded these sounds with a Tascam DR-07 and shotgun microphone and edited them in Audacity. These are imported recordings, not sounds synthesized by this app. The source offers several licences; this distribution uses CC BY 3.0.

Changes: balanced each original recording's peak to -3 dB, then converted WAV files to 160 kbps, 44.1 kHz MP3 for browser playback. This makes the quiet recordings audible alongside the loud screams. Display titles were shortened. No endorsement by the author or OpenGameArt is implied.

| Soundpad title | Original recording |
| --- | --- |
| Witch cackle | witch_cackle.wav |
| Terrified scream | scream1.wav |
| Horror scream | scream2.wav |
| Spooky scream | scream3.wav |
| Zombie: Brains! | brains.wav |
| Zombie voice: Brains | brains2.wav |
| Hungry zombie | brains3.wav |
| Crackling monster groan | crackly_groan.wav |
| Ghostly groan | groan.wav |
| Monster roar | rar.wav |
| Creepy breathing | creepy_mouth_breathing.wav |
| Creaks and breathing | creaking_and_breathing.wav |
| Haunted stairs | stairs,wav.wav |
| Ghostly knocking | knocking.wav |
| Haunted door slam | doorslam.wav |
| Spooky door closing | doorclose.wav |
| Attic creak | creak1.wav |
| Creaking floorboards | creak2.wav |
| Heavy thuds | thuds.wav |
| Sudden thump | thud2.wav |

## Import inventory

The source page calls the collection “25 spooky sound effects”; the downloaded archive actually contains **26 WAV files**. This app includes **20**. The six excluded recordings are `creak3.wav`, `creak4.wav`, `creak5.wav`, `creak6.wav`, `creak7.wav`, and `thud.wav`; these extra creak/thud variations were left out to meet the requested twenty-sound limit.

Original archive SHA-256: `9d9b07dcecde46fe56be265e2d4b96ad84f85c191c5006a20458731829e8cdd3`.

All twenty MP3s are hosted with the app. Both production and beta use these same files; track IDs, original names, decoded durations and SHA-256 hashes are recorded in their published `library.json` catalogues.

Pixabay: 0 imported. Epidemic Sound: 0 imported. The downloadable, hosting-permitted OpenGameArt recordings provide the requested twenty Halloween sounds after the original source download was blocked. No blocked Pixabay file was retrieved, no subscription was purchased, and no custom recording slot was overwritten.

## Reproduce the import

Download the archive linked by the original source page: [spookysounds.zip](https://opengameart.org/sites/default/files/spookysounds.zip). With Python 3, ffmpeg and ffprobe available, run:

```text
node tools/import-spooky.cjs path/to/spookysounds.zip
node tests/published-assets.cjs
```

The original ZIP and WAV files are kept outside the published catalogue. The original author retains attribution under CC BY 3.0; this application's own licensing does not replace the audio licence.
