/* Pro Level Cuts — guided tutorial.
   Opens by itself the first time each page is visited (Skip any time), and again from the
   "Tutorial" button at the top right. An arrow points at each part while a card explains it. */
(function () {
  'use strict';
  var STEPS = {
    home: [
      { title: 'Welcome to Pro Level Cuts', text: 'Your editing studio for haircut photos and videos. This quick tour shows you around — tap Next, or Skip any time.' },
      { el: '#nav', mobile: '.menu-btn', title: 'Move between tools', text: 'Home, Photo Showcase and Video Editor live here. On a phone, tap the menu button to open them.' },
      { el: '.plc-tool[href="showcase.html"]', title: 'Photo Showcase', text: 'Crop and style your cut photos, mark Before and After, group each client and turn it all into a slideshow video with music and effects.' },
      { el: '.plc-tool[href="formatter.html"]', title: 'Video Editor', text: 'Trim and order your clips, fit them to Reels, TikTok, Shorts or YouTube, add text and overlays, and save an MP4.' },
      { el: '[data-tour-btn]', title: 'Need help again?', text: 'Tap Tutorial at the top right on any page to see its tour again.' }
    ],
    showcase: [
      { title: 'Photo Showcase', text: 'Turn your cut photos into pro posts and slideshow videos. Each part of the page folds up — tap a title to open or close it.' },
      { el: '[data-acct-btn]', title: 'Your account', text: 'Tap 👤 at the top of any page to sign in with your name and PIN. Your photo projects and your videos are kept under your name.' },
      { el: '#projCard', title: 'Projects', text: 'Keep one project per client or per day. Everything saves by itself. Share sends a project to someone by their name — requests sent to you show up here to Accept or Decline, with your Outbox below. Backup makes a file you can keep or move to another phone.' },
      { el: '#phCard', title: '1 · Add photos', text: 'Tap Choose photos to add your shots. Pick the size (Instagram, theCut, Reels, YouTube…) and tap BEFORE or AFTER under each photo.' },
      { el: '#editCard', title: '2 · Crop & style', text: 'Drag and pinch to crop, straighten and rotate. Pro looks and Fine-tune make the cut pop — then Save this photo.', after: 'Shows up once you add photos.' },
      { el: '#setCard', title: '3 · Before & after per client', text: 'Each client gets a Before side and an After side. Add as many photos to each as you like; each client becomes one before | after collage.', after: 'Shows up once you add photos.' },
      { el: '#fxCard', title: 'Effects', text: 'Pick a photo (or Every photo) and tap effects to stack them — lights, sparkle, frames, movement. Light, Medium or Strong for each.', after: 'Shows up once you add photos.' },
      { el: '#brandCard', title: 'Your brand & labels', text: 'Your shop name, @handle, booking line and logo go on every photo. Switches turn tags on or off, and Plain photos removes everything for theCut.', after: 'Shows up once you add photos.' },
      { el: '#showCard', title: '4 · Slideshow & download', text: 'Watch the slideshow, add music that cuts on the beat and text on screen, then Make the slideshow video, Save all edited photos or Download everything.', after: 'Shows up once you add photos.' },
      { el: '.sc-fold-info', title: 'Help on every part', text: 'Tap ⓘ on any part for a short explanation of it.' },
      { el: '#bigBtn', title: 'Bigger text & buttons', text: 'Makes the whole page easier to read and tap.' },
      { el: '[data-tour-btn]', title: 'You\'re ready', text: 'Tap Tutorial at the top right any time to see this again.' }
    ],
    formatter: [
      { title: 'Video Editor', text: 'Edit your cut videos for every platform — trim, frame, add text and overlays, and save an MP4.' },
      { el: '#vidCard', title: 'Your videos', text: 'One video per client or per day — each saves by itself under your account. Share sends it to someone by their name; requests sent to you show up here to Accept or Decline. Backup makes a file you can keep or move to another phone.' },
      { el: 'section[aria-labelledby="clipsTitle"]', title: '1 · Videos', text: 'Add your clips. Trim each one and drag them into the order they should play.' },
      { el: '#formatCard', title: '2 · Format & frame', text: 'Choose where you\'re posting — Instagram Reels & Stories, TikTok, YouTube Shorts, an Instagram or theCut post, or a YouTube video — then the background, frame and fit.', after: 'Shows up once you add a video.' },
      { el: '#overlayCard', title: '3 · Overlays & stickers', text: 'Add titles, text, your logo and barber stickers — clippers, razor, scissors, comb, barber pole, crown. Drag them right on the preview to place and size them.', after: 'Shows up once you add a video.' },
      { el: '#fmFxCard', title: 'Effects', text: 'Put lights, sparkle, barber effects (falling clippings, clipper buzz, razor shine), film looks and movement on the clip under the playhead or on the whole video. Stack as many as you like.', after: 'Shows up once you add a video.' },
      { el: '#tlBox', title: 'Timeline & layers', text: 'Every clip and every overlay is a layer on the timeline. Swipe a clip’s ends to make it shorter or longer, ✂ Split to cut, add photos and videos as layers and use ⬆ / ⬇ to put a layer in front of or under the main video.', after: 'Shows up once you add a video.' },
      { el: '#exportCard', title: '4 · Preview & export', text: 'Play it back, go full screen, and export the finished MP4 to save or share.', after: 'Shows up once you add a video.' },
      { el: '[data-tour-btn]', title: 'You\'re ready', text: 'Tap Tutorial at the top right any time to see this again.' }
    ]
  };
  var page = document.body.getAttribute('data-page'), steps = STEPS[page];
  if (!steps) return;
  var KEY = 'tourSeen:' + page, i = 0, ui = null;

  function visible(el) { if (!el) return false; var r = el.getBoundingClientRect(); return !el.closest('[hidden]') && r.width > 0 && r.height > 0; }
  function target(st) {
    if (!st.el) return null;
    var wide = window.innerWidth > 900, sel = (!wide && st.mobile) ? st.mobile : st.el;
    var list = document.querySelectorAll(sel);
    for (var k = 0; k < list.length; k++) if (visible(list[k])) return list[k];
    return null;
  }
  function build() {
    ui = document.createElement('div'); ui.className = 'plc-tour'; ui.setAttribute('role', 'dialog'); ui.setAttribute('aria-modal', 'true'); ui.setAttribute('aria-label', 'Tutorial');
    ui.innerHTML = '<div class="plc-tour-hole"></div><div class="plc-tour-card"><div class="plc-tour-arrow"></div>' +
      '<div class="plc-tour-count"></div><h3 class="plc-tour-title"></h3><p class="plc-tour-text"></p><p class="plc-tour-after"></p>' +
      '<div class="plc-tour-btns"><button type="button" class="btn btn-ghost plc-tour-skip">Skip tour</button><span class="plc-tour-nav">' +
      '<button type="button" class="btn btn-ghost plc-tour-back" aria-label="Back">‹ Back</button><button type="button" class="btn plc-tour-next">Next ›</button></span></div></div>';
    document.body.appendChild(ui);
    ui.querySelector('.plc-tour-skip').onclick = end;
    ui.querySelector('.plc-tour-back').onclick = function () { go(i - 1); };
    ui.querySelector('.plc-tour-next').onclick = function () { if (i >= steps.length - 1) end(); else go(i + 1); };
    ui.addEventListener('click', function (e) { if (e.target === ui) e.stopPropagation(); });
    document.addEventListener('keydown', keys);
    window.addEventListener('resize', place); window.addEventListener('scroll', place, { passive: true });
  }
  function keys(e) {
    if (!ui) return;
    if (e.key === 'Escape') end();
    if (e.key === 'ArrowRight') ui.querySelector('.plc-tour-next').click();
    if (e.key === 'ArrowLeft' && i > 0) go(i - 1);
  }
  function go(n) {
    i = Math.max(0, Math.min(steps.length - 1, n));
    var st = steps[i], el = target(st);
    ui.querySelector('.plc-tour-count').textContent = 'Step ' + (i + 1) + ' of ' + steps.length;
    ui.querySelector('.plc-tour-title').textContent = st.title;
    ui.querySelector('.plc-tour-text').textContent = st.text;
    var after = ui.querySelector('.plc-tour-after'); after.textContent = !el && st.after ? st.after : ''; after.hidden = !(!el && st.after);
    ui.querySelector('.plc-tour-back').hidden = i === 0;
    ui.querySelector('.plc-tour-next').textContent = i === steps.length - 1 ? 'Done ✓' : 'Next ›';
    ui._el = el;
    if (el) {   // bring it into view without opening or changing anything on the page
      var r = el.getBoundingClientRect(), top = r.top + window.scrollY - Math.max(90, (window.innerHeight - Math.min(r.height, window.innerHeight * .5)) / 2 - 120);
      if (r.top < 70 || r.bottom > window.innerHeight - 40) window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }
    place(); setTimeout(place, 350); setTimeout(place, 700);
    ui.querySelector('.plc-tour-next').focus({ preventScroll: true });
  }
  function place() {
    if (!ui) return;
    var el = ui._el, hole = ui.querySelector('.plc-tour-hole'), card = ui.querySelector('.plc-tour-card'), arrow = ui.querySelector('.plc-tour-arrow');
    var W = window.innerWidth, H = window.innerHeight, cw = Math.min(380, W - 24);
    card.style.width = cw + 'px';
    if (!el) {   // nothing to point at: a centred card
      hole.style.cssText = 'left:50%;top:50%;width:0;height:0';
      card.style.left = (W - cw) / 2 + 'px'; card.style.top = Math.max(16, (H - card.offsetHeight) / 2) + 'px';
      arrow.style.display = 'none'; return;
    }
    var r = el.getBoundingClientRect(), pad = 8;
    var hl = Math.max(4, r.left - pad), ht = Math.max(4, r.top - pad), hw = Math.min(W - 8, r.right + pad) - hl, hh = Math.min(H - 8, r.bottom + pad) - ht;
    hole.style.cssText = 'left:' + hl + 'px;top:' + ht + 'px;width:' + Math.max(0, hw) + 'px;height:' + Math.max(0, hh) + 'px';
    var ch = card.offsetHeight, gap = 18, below = H - (ht + hh), above = ht, x, y, side;
    if (below >= ch + gap + 8) { side = 'top'; y = ht + hh + gap; }
    else if (above >= ch + gap + 8) { side = 'bottom'; y = ht - gap - ch; }
    else { side = 'none'; y = Math.max(12, H - ch - 12); }
    var cx = r.left + r.width / 2; x = Math.max(12, Math.min(W - cw - 12, cx - cw / 2));
    card.style.left = x + 'px'; card.style.top = y + 'px';
    arrow.style.display = side === 'none' ? 'none' : 'block';
    arrow.className = 'plc-tour-arrow plc-arrow-' + side;
    arrow.style.left = Math.max(18, Math.min(cw - 18, cx - x)) + 'px';
  }
  function start() { if (ui) return; build(); go(0); }
  function end() {
    try { YB.store.set(KEY, true); } catch (e) {}
    document.removeEventListener('keydown', keys); window.removeEventListener('resize', place); window.removeEventListener('scroll', place);
    if (ui) ui.remove(); ui = null;
  }
  window.PLCTour = { start: start, end: end, steps: function () { return steps.length; } };
  function init() {
    document.querySelectorAll('[data-tour-btn]').forEach(function (b) { b.addEventListener('click', function () { if (document.getElementById('nav').classList.contains('open')) document.querySelector('.menu-btn').click(); start(); }); });
    var seen = false; try { seen = YB.store.get(KEY, false); } catch (e) {}
    if (!seen && !window.PLC_NO_TOUR) setTimeout(start, 900);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
