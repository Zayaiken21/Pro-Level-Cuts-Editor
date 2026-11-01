# Pro Level Cuts

Photo Showcase and Video Editor for **Pro Level Cuts** (Curtis) — live at **https://zayaiken21.github.io/Pro-Level-Cuts-Editor/**

| Page | File | What it does |
|---|---|---|
| Home | `index.html` | Brand page with the two tools |
| Photo Showcase | `showcase.html` · `js/showcase.js` · `js/showcase-fx.js` · `js/showcase-fold.js` | Crop and style cut photos, Before / After per client, 168 effects, beat-synced slideshow video, projects, name + PIN accounts, sharing |
| Video Editor | `formatter.html` · `js/formatter.js` | Trim and order clips, fit them to Reels / TikTok / Shorts / YouTube / posts, backgrounds, frames, text and overlays, MP4 export |

Everything runs in the browser and is saved on the device (IndexedDB `pro-level-cuts-showcase` and `pro-level-cuts-video`, settings under `plc:` in localStorage) — separate from Youtube Blue even though both live on `zayaiken21.github.io`. Works offline and can be added to the home screen.

## Brand

| | Colour |
|---|---|
| Onyx (background) | `#0E0C0A` |
| Champagne gold (main) | `#D6A84A` |
| Light gold | `#EBC46A` |
| Ember (the razor cut line) | `#E4572E` |
| Ivory (text) | `#F6EFE3` |

Logo: a gold **PL** monogram in a rounded gold frame with an ember razor line cut through it (`icons/logo.svg`). Headings use Oswald. Photo Showcase starts with the shop name **Pro Level Cuts** and the gold colour; the @handle and booking line are set once in *Your brand*.

## Where the code comes from

The tools are the same code as Youtube Blue's Photo Showcase and Video Formatter, rebranded by a build script (own storage names, colours, pages, icons). Improvements made in Youtube Blue are brought over by re-running the build.
