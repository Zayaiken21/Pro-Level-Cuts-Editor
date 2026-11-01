# Pro Level Cuts

Professional photo and video editing for barbers — **Pro Level Cuts** — live at **https://zayaiken21.github.io/Pro-Level-Cuts-Editor/**

| Page | File | What it does |
|---|---|---|
| Home | `index.html` | Brand page with the two tools |
| Photo Showcase | `showcase.html` · `js/showcase.js` · `js/showcase-fx.js` · `js/showcase-fold.js` · `js/showcase-p2p.js` | Crop and style cut photos, Before / After per client, 168 effects, beat-synced slideshow video, projects, name + PIN accounts, send a project by name straight to another person's phone, backup / share files with the photos inside |
| Video Editor | `formatter.html` · `js/formatter.js` | Trim and order clips, fit them to Reels / TikTok / Shorts / YouTube / posts, backgrounds, frames, text and overlays, MP4 export |

Everything runs in the browser and is saved on the device (IndexedDB `pro-level-cuts-showcase` and `pro-level-cuts-video`, settings under `plc:` in localStorage) — separate from Youtube Blue even though both live on `zayaiken21.github.io`. Works offline and can be added to the home screen.

## Brand

From the Pro Level Cuts card: deep black with bright gold.

| | Colour |
|---|---|
| Black (background) | `#070707` |
| Gold (main) | `#E0AA3E` |
| Light gold | `#F2CB6B` / `#FFE7A3` |
| Deep gold | `#C8922B` |
| Ivory (text) | `#F6EEDB` |

Logo: the black box truck with gold trim and the **PLC** monogram on its side (gold P, a barber-pole L with a crown, gold C), above **PRO LEVEL CUTS** in Cinzel and **MOBILE BARBER** (`icons/logo-lockup.svg`). The app icon is the truck in a gold-framed black tile (`icons/logo.svg`); the header uses the monogram and name (`icons/logo-wordmark.svg`). Headings use Cinzel, text uses Montserrat.

## Tutorial

Every page has a **❓ Tutorial** button at the top right. The tour opens by itself the first time a page is visited, points at each part with an arrow and explains it; **Skip tour** closes it, and it won't open by itself again (`js/tour.js`).

## Where the code comes from

The tools are the same code as Youtube Blue's Photo Showcase and Video Formatter, rebranded by a build script (own storage names, colours, pages, icons). Improvements made in Youtube Blue are brought over by re-running the build.

## Sending to other people

Sign in with your name and PIN. In a project tap **📤 Share**, type the person's name and tap **📲 Send to “name” on their phone** — it goes into your **📤 Outbox** and is delivered phone to phone by itself the next time you're both on Photo Showcase — no need to wait. They see a request and tap **Accept** or **Decline**, and the answer comes back to your Outbox. Nothing is stored online; the free PeerJS connector only helps the two phones find each other. Pro Level Cuts users and Youtube Blue users are separate. **Send as a file** / **Open backup or shared file** works any time, with the actual photos inside the file.
