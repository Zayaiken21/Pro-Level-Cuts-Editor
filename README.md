# Pro Level Cuts

Photo Showcase and Video Editor for **Pro Level Cuts** (Curtis) — live at **https://zayaiken21.github.io/Pro-Level-Cuts-Editor/**

| Page | File | What it does |
|---|---|---|
| Home | `index.html` | Brand page with the two tools |
| Photo Showcase | `showcase.html` · `js/showcase.js` · `js/showcase-fx.js` · `js/showcase-fold.js` · `js/showcase-p2p.js` | Crop and style cut photos, Before / After per client, 168 effects, beat-synced slideshow video, projects, name + PIN accounts, send a project by name straight to another person's phone, backup / share files with the photos inside |
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

## Sending to other people

Sign in with your name and PIN. In a project tap **📤 Share**, type the person's name and tap **📲 Send to “name” on their phone** — the whole project with its photos goes phone to phone into their account (they need Pro Level Cuts' Photo Showcase open and signed in, and tap OK). Nothing is stored online; the free PeerJS connector only helps the two phones find each other. Pro Level Cuts users and Youtube Blue users are separate. **Send as a file** / **Open backup or shared file** works any time, with the actual photos inside the file.
