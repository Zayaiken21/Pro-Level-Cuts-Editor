/* Pro Level Cuts — your videos, saved under your account, and sent to other people by name.
   Works like Photo Showcase projects: every video saves by itself, you can keep as many as you like,
   send one to someone by their name (it waits in your Outbox and goes by itself the next time you're
   both on the Video Editor), and they choose Accept or Decline. Backup makes a file with the clips in it. */
(function () {
  'use strict';
  var DB = 'pro-level-cuts-video';
  var F = null, me = null, uid = '', list = [], cur = '', inbox = [], outbox = [], receipts = [], lastSig = '', keep = {}, delivering = false, p2pState = '';
  function $(id) { return document.getElementById(id); }
  function esc(s) { return YB.esc(s); }
  function db() {
    return new Promise(function (res) {
      if (!window.indexedDB) return res(null);
      var r = indexedDB.open(DB, 1);
      r.onupgradeneeded = function () { r.result.createObjectStore('kv'); };
      r.onsuccess = function () { res(r.result); };
      r.onerror = r.onblocked = function () { res(null); };
    });
  }
  function kv(mode, fn) {
    return db().then(function (d) {
      if (!d) return null;
      return new Promise(function (res) {
        try { var t = d.transaction('kv', mode), out = { v: null }; fn(t.objectStore('kv'), out); t.oncomplete = function () { d.close(); res(out.v); }; t.onerror = t.onabort = function () { d.close(); res(null); }; }
        catch (e) { d.close(); res(null); }
      });
    });
  }
  function get(k) { return kv('readonly', function (st, out) { var r = st.get(k); r.onsuccess = function () { out.v = r.result; }; }); }
  function put(k, v) { return kv('readwrite', function (st) { st.put(v, k); }); }
  function del(k) { return kv('readwrite', function (st) { st.delete(k); }); }
  function K(n) { return n + ':' + uid; }
  function blobIds(d) {
    var ids = []; if (!d) return ids;
    (d.clips || []).forEach(function (c) { if (c.blobId && ids.indexOf(c.blobId) < 0) ids.push(c.blobId); });
    (d.overlays || []).forEach(function (o) { if (o.blobId && ids.indexOf(o.blobId) < 0) ids.push(o.blobId); });
    if (d.music && d.music.blobId) ids.push(d.music.blobId); if (d.bgImage && d.bgImage.blobId) ids.push(d.bgImage.blobId);
    return ids;
  }
  function remap(d, map) {
    (d.clips || []).forEach(function (c) { if (map[c.blobId]) c.blobId = map[c.blobId]; });
    (d.overlays || []).forEach(function (o) { if (o.blobId && map[o.blobId]) o.blobId = map[o.blobId]; });
    if (d.music && map[d.music.blobId]) d.music.blobId = map[d.music.blobId];
    if (d.bgImage && map[d.bgImage.blobId]) d.bgImage.blobId = map[d.bgImage.blobId];
    return d;
  }
  function when(t) { var d = new Date(t || Date.now()); return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }); }
  function thumb() {
    var c = $('preview'); if (!c || !c.width) return '';
    try { var t = document.createElement('canvas'), k = 160 / Math.max(c.width, c.height); t.width = Math.round(c.width * k); t.height = Math.round(c.height * k); t.getContext('2d').drawImage(c, 0, 0, t.width, t.height); return t.toDataURL('image/jpeg', 0.7); } catch (e) { return ''; }
  }
  function sig(d) { return JSON.stringify(d); }

  /* ---------- the card ---------- */
  function build() {   // the same look as the Project part of Photo Showcase
    var host = document.querySelector('.cx-layout > .stack') || document.querySelector('main');
    var sec = document.createElement('section'); sec.className = 'card sc-projcard'; sec.id = 'vidCard'; sec.setAttribute('aria-labelledby', 'vidTitle');
    sec.innerHTML = '<div class="sc-projhead">' +
        '<div><h2 id="vidTitle">🎬 Video: <span id="vidNameShow">New video</span></h2><p class="small pv-saved" id="vidSaved">Saves by itself as you work</p><p class="small sc-net" id="vidNet" aria-live="polite"></p></div>' +
        '<div class="row sc-projbtns">' +
          '<button class="btn" type="button" id="vidNew">➕ New video</button>' +
          '<button class="btn btn-ghost" type="button" id="vidRename">✏️ Rename</button>' +
          '<button class="btn btn-ghost" type="button" id="vidSend">📤 Share</button>' +
          '<button class="btn btn-ghost" type="button" id="vidDelete">🗑 Delete</button>' +
        '</div></div>' +
      '<div class="sc-sharepanel" id="vidPanel" hidden></div>' +
      '<div class="sc-inboxbox" id="vidInbox" hidden></div>' +
      '<p class="muted small">Make one video per client (or per day). Your clips, layers, effects, text and music save on this device by themselves, so you can leave one and come back to it later. Tap a video to open it.</p>' +
      '<div class="sc-projlist" id="vidList"></div>' +
      '<div class="sc-inboxbox" id="vidOutbox" hidden></div>' +
      '<details class="sc-bk"><summary>💾 Backup &amp; move to another phone or computer</summary>' +
        '<p class="muted small">Make a backup file and keep it in iCloud Drive, Google Drive, Files or your email. On any device, open this page and tap <b>Open backup or shared file</b> to get your video back.</p>' +
        '<div class="row"><button class="btn" type="button" id="vidBackup">⬇ Back up this video</button>' +
        '<label class="btn btn-ghost">⬆ Open backup or shared file<input type="file" id="vidRestore" accept=".json,application/json" hidden></label></div></details>';
    host.insertBefore(sec, host.firstChild);
  }
  function ago(t) {
    var s = Math.max(0, (Date.now() - (t || 0)) / 1000);
    return s < 60 ? 'just now' : s < 3600 ? Math.round(s / 60) + ' min ago' : s < 86400 ? Math.round(s / 3600) + ' h ago' : when(t);
  }
  function render() {
    var c = list.find(function (x) { return x.id === cur; });
    $('vidNameShow').textContent = c ? c.name : 'New video';
    $('vidList').innerHTML = list.slice().sort(function (a, b) { return b.updated - a.updated; }).map(function (x) {
      var on = x.id === cur, n = x.clips || 0;
      return '<button type="button" class="sc-proj' + (on ? ' on' : '') + '" data-vid="' + x.id + '" aria-pressed="' + on + '">' +
        (x.thumb ? '<img src="' + x.thumb + '" alt="">' : '<span class="sc-proj-ph">🎬</span>') +
        '<b>' + esc(x.name) + '</b><span class="muted small">' + n + ' clip' + (n === 1 ? '' : 's') + '</span>' +
        '<span class="muted small">' + (on ? 'Open now' : ago(x.updated)) + '</span></button>';
    }).join('');
    var ib = $('vidInbox'); ib.hidden = !inbox.length;
    ib.innerHTML = inbox.length ? '<h3>📥 Requests for you (' + inbox.length + ')</h3><div class="sc-inbox">' + inbox.map(function (it) {
      var n = ((it.data || {}).clips || []).length;
      return '<div class="sc-inb">' + (it.thumb ? '<img src="' + it.thumb + '" alt="">' : '<span class="sc-proj-ph">🎬</span>') +
        '<div><b>' + esc(it.name) + '</b><span class="muted small">' + esc(it.from) + ' wants to send you this · ' + n + ' clip' + (n === 1 ? '' : 's') + ' · ' + ago(it.received) + '</span></div>' +
        '<div class="row"><button class="btn" type="button" data-vacc="' + it.id + '">✅ Accept</button><button class="btn btn-ghost" type="button" data-vdec="' + it.id + '">✕ Decline</button></div></div>';
    }).join('') + '</div>' : '';
    var ob = $('vidOutbox'); ob.hidden = !outbox.length;
    ob.innerHTML = outbox.length ? '<h3>📤 Outbox (' + outbox.length + ')</h3><div class="sc-inbox">' + outbox.map(function (it) {
      var st = it.status === 'accepted' ? '✅ Accepted' : it.status === 'declined' ? '✖ Declined' : it.status === 'delivered' ? '📬 Delivered — waiting for them to accept' : '⏳ Waiting — goes by itself when you’re both on the Video Editor';
      return '<div class="sc-inb">' + (it.thumb ? '<img src="' + it.thumb + '" alt="">' : '<span class="sc-proj-ph">🎬</span>') + '<div><b>' + esc(it.name) + '</b><span class="muted small">to ' + esc(it.to) + ' · <span id="vob_' + it.id + '">' + st + '</span></span></div>' +
        '<div class="row"><button class="btn btn-ghost" type="button" data-vob="' + it.id + '">' + (it.status === 'waiting' ? '✕ Cancel' : '✕ Clear') + '</button></div></div>';
    }).join('') + '</div>' : '';
    var nb = document.querySelector('[data-acct-btn]'); if (nb) nb.classList.toggle('has-new', inbox.length > 0);
  }
  function panel(html) { var p = $('vidPanel'); p.innerHTML = html || ''; p.hidden = !html; }

  /* ---------- saving, opening, new ---------- */
  function saveCur(force) {
    if (!F || !cur) return Promise.resolve();
    var d = F.data(), s = sig(d); if (!force && s === lastSig) return Promise.resolve();
    lastSig = s; blobIds(d).forEach(function (id) { keep[id] = 1; });
    var c = list.find(function (x) { return x.id === cur; }); if (!c) return Promise.resolve();
    c.updated = Date.now(); c.clips = (d.clips || []).length; var th = thumb(); if (th) c.thumb = th;
    $('vidSaved').textContent = 'Saved · ' + ago(Date.now());
    return put('vproj:' + cur, d).then(function () { return put(K('vlist'), list); });
  }
  function openVid(id) {
    return saveCur().then(function () { return get('vproj:' + id); }).then(function (d) {
      cur = id; YB.store.set(K('vcur'), id); YB.store.set('fmOwner', uid);
      return F.open(d || null);
    }).then(function () { lastSig = sig(F.data()); render(); });
  }
  function newVid(data, name) {
    return saveCur().then(function () {
      var id = 'v' + YB.uid(); list.push({ id: id, name: name || 'Video ' + (list.length + 1), updated: Date.now(), thumb: '' });
      cur = id; YB.store.set(K('vcur'), id); YB.store.set('fmOwner', uid);
      return F.open(data || null).then(function () { lastSig = ''; return saveCur(true); });
    }).then(render);
  }
  function delVid(id) {
    var x = list.find(function (q) { return q.id === id; }); if (!x || !confirm('Delete "' + x.name + '"? This can’t be undone.')) return;
    list = list.filter(function (q) { return q.id !== id; });
    get('vproj:' + id).then(function (d) {
      var still = {}; return Promise.all(list.map(function (q) { return get('vproj:' + q.id).then(function (dd) { blobIds(dd).forEach(function (b) { still[b] = 1; }); }); })).then(function () {
        blobIds(d).forEach(function (b) { if (!still[b]) { delete keep[b]; F.delBlob(b); } });
      });
    }).then(function () { return del('vproj:' + id); }).then(function () { return put(K('vlist'), list); }).then(function () { render(); YB.toast('Video deleted'); });
  }

  /* ---------- sending ---------- */
  function showSend() {
    if (!me) { YB.toast('Sign in first — tap 👤 at the top'); if (window.PLCAcct) PLCAcct.open(); return; }
    var c = list.find(function (x) { return x.id === cur; }); if (!c || !(F.clips().length)) { YB.toast('Add a video first'); return; }
    panel('<h3>📤 Share "' + esc(c.name) + '"</h3><label class="sc-field"><span>Send to (their name on Pro Level Cuts)</span><input id="vsTo" type="text" autocomplete="off" maxlength="40" placeholder="Their name"></label>' +
      '<div class="row" style="gap:8px"><button type="button" class="btn" id="vsGo">📤 Send</button><button type="button" class="btn btn-ghost" id="vsNo">Cancel</button></div>' +
      '<p class="muted small" id="vsMsg">It goes into your Outbox and is delivered by itself the next time you’re both on the Video Editor. They choose Accept or Decline.</p>');
    $('vsTo').focus(); $('vsNo').onclick = function () { panel(''); };
    $('vsTo').onkeydown = function (e) { if (e.key === 'Enter') $('vsGo').click(); };
    $('vsGo').onclick = function () {
      var to = $('vsTo').value.trim().replace(/\s+/g, ' ');
      if (to.length < 2) { $('vsMsg').textContent = 'Type their name.'; return; }
      if (to.toLowerCase() === me.name.toLowerCase()) { $('vsMsg').textContent = 'That’s you — type the other person’s name.'; return; }
      saveCur(true).then(function () {
        var d = F.data();
        outbox.unshift({ id: 'o' + YB.uid(), shareId: 's' + YB.uid() + YB.uid(), to: to, name: c.name, thumb: c.thumb || '', created: Date.now(), status: 'waiting', data: d });
        return put(K('voutbox'), outbox);
      }).then(function () { panel(''); render(); YB.toast('In your Outbox — it goes to ' + to + ' by itself'); deliverSoon(); });
    };
  }
  function deliverSoon() { setTimeout(deliver, 300); }
  function deliver() {
    if (!me || delivering || !window.YBP2PV || !YBP2PV.supported() || document.hidden) return;
    var todo = outbox.filter(function (it) { return it.status === 'waiting'; });
    if (!todo.length && !receipts.length) return;
    delivering = true; var changed = false, i = 0;
    function next() {
      if (i >= todo.length) return Promise.resolve();
      var it = todo[i++];
      return Promise.all(blobIds(it.data).map(function (id) { return F.blob(id).then(function (b) { return b ? { id: id, blob: b } : null; }); })).then(function (files) {
        return YBP2PV.deliver(it.to, { shareId: it.shareId, from: me.name, name: it.name, thumb: it.thumb, data: it.data, files: files.filter(Boolean), sent: it.created }, function (t) { var e = $('vob_' + it.id); if (e) e.textContent = t; });
      }).then(function (r) { if (r) { it.status = 'delivered'; changed = true; } }, function (e) { var el = $('vob_' + it.id); if (el) el.textContent = '⏳ ' + (e && e.message ? e.message : 'Will try again'); }).then(next);
    }
    var keepR = [];
    next().then(function () {
      var j = 0;
      function nr() {
        if (j >= receipts.length) return Promise.resolve();
        var x = receipts[j++];
        return YBP2PV.receipt(x.to, { shareId: x.shareId, answer: x.answer, from: me.name }).then(function (ok) { if (!ok) keepR.push(x); }, function () { keepR.push(x); }).then(nr);
      }
      return nr();
    }).then(function () {
      receipts = keepR;
      return Promise.all([changed ? put(K('voutbox'), outbox) : null, put(K('vreceipts'), receipts)]);
    }).catch(function (e) { console.error(e); }).then(function () { delivering = false; if (changed) render(); });
  }
  var pending = null;
  var H = {
    status: function (st) { p2pState = st; $('vidNet').textContent = st === 'ready' ? '📲 Online — people can send you videos by your name, and your Outbox sends by itself' : st === 'offline' ? '📴 No internet — your Outbox sends when you’re back online' : ''; if (st === 'ready') deliverSoon(); },
    progress: function (t) { $('vidNet').textContent = '📥 ' + t.replace(/photo/g, 'file'); },
    request: function (m) { if (inbox.some(function (x) { return x.shareId === m.shareId; })) return 'have'; pending = { map: {} }; return 'yes'; },
    file: function (id, blob) { var nid = 'r' + YB.uid(); return F.putBlob(nid, blob).then(function () { keep[nid] = 1; return nid; }); },
    done: function (info, data, map) {
      inbox.unshift({ id: 'i' + YB.uid(), shareId: info.shareId, from: info.from, name: info.name, thumb: info.thumb || '', received: Date.now(), data: remap(data || {}, map || {}) });
      blobIds(inbox[0].data).forEach(function (b) { keep[b] = 1; });
      return put(K('vinbox'), inbox).then(function () { render(); YB.toast('🎬 ' + info.from + ' sent you "' + info.name + '" — Accept or Decline'); if (window.YBFold) YBFold.open('vidCard'); });
    },
    receipt: function (m) {
      var it = outbox.find(function (x) { return x.shareId === m.shareId; }); if (!it) return;
      it.status = m.answer === 'accepted' ? 'accepted' : 'declined'; delete it.data;
      return put(K('voutbox'), outbox).then(function () { render(); YB.toast((m.from || it.to) + (it.status === 'accepted' ? ' accepted "' : ' declined "') + it.name + '"'); });
    }
  };
  function answer(id, yes) {
    var it = inbox.find(function (x) { return x.id === id; }); if (!it) return;
    inbox = inbox.filter(function (x) { return x !== it; });
    receipts.push({ to: it.from, shareId: it.shareId, answer: yes ? 'accepted' : 'declined' });
    var p = yes ? newVid(it.data, it.name + ' (from ' + it.from + ')') : Promise.all(blobIds(it.data).map(function (b) { delete keep[b]; return F.delBlob(b); }));
    return p.then(function () { return Promise.all([put(K('vinbox'), inbox), put(K('vreceipts'), receipts)]); }).then(function () { render(); deliverSoon(); YB.toast(yes ? 'Added to your videos' : 'Declined'); });
  }

  /* ---------- backup ---------- */
  function toData(b) { return new Promise(function (res) { var r = new FileReader(); r.onload = function () { res(r.result); }; r.onerror = function () { res(null); }; r.readAsDataURL(b); }); }
  function fromData(u) { var m = /^data:([^;,]*)(;base64)?,(.*)$/.exec(u || ''); if (!m) return null; var bin = atob(m[3]), a = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return new Blob([a], { type: m[1] || 'application/octet-stream' }); }
  function backup() {
    var c = list.find(function (x) { return x.id === cur; }); if (!c || !F.clips().length) { YB.toast('Add a video first'); return; }
    YB.toast('Making the backup…');
    saveCur(true).then(function () {
      var d = F.data(), files = {};
      return Promise.all(blobIds(d).map(function (id) { return F.blob(id).then(function (b) { return b ? toData(b).then(function (u) { files[id] = u; }) : null; }); })).then(function () {
        var out = JSON.stringify({ app: 'pro-level-cuts-video', kind: 'backup', made: Date.now(), from: me ? me.name : '', videos: [{ name: c.name, thumb: c.thumb || '', data: d }], files: files });
        var b = new Blob([out], { type: 'application/json' }), url = URL.createObjectURL(b), a = document.createElement('a');
        a.href = url; a.download = 'pro-level-cuts-video-' + c.name.replace(/[^\w-]+/g, '-').toLowerCase() + '.json'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
      });
    });
  }
  function restore(file) {
    if (!file) return;
    file.text().then(function (t) {
      var bk = JSON.parse(t); if (!bk || bk.app !== 'pro-level-cuts-video' || !Array.isArray(bk.videos)) throw new Error('not a backup');
      var map = {}, ids = Object.keys(bk.files || {}), chain = Promise.resolve();
      ids.forEach(function (id) { chain = chain.then(function () { var b = fromData(bk.files[id]); if (!b) return; var nid = 'k' + YB.uid(); map[id] = nid; keep[nid] = 1; return F.putBlob(nid, b); }); });
      return chain.then(function () {
        var c2 = Promise.resolve();
        bk.videos.forEach(function (v) { c2 = c2.then(function () { return newVid(remap(v.data || {}, map), (v.name || 'Video') + (bk.from ? ' (from ' + bk.from + ')' : ' (restored)')); }); });
        return c2;
      });
    }).then(function () { YB.toast('Video opened from the backup'); }, function (e) { console.error(e); YB.toast('That file isn’t a Pro Level Cuts video backup'); });
  }

  /* ---------- start ---------- */
  function start() {
    F = window.YBFmt; if (!F || !F.data) return;
    window.YBFmtKeep = function (id) { return !!keep[id]; };
    var acct = window.PLCAcct ? PLCAcct.ready : Promise.resolve(null);
    Promise.all([acct, F.whenReady ? F.whenReady() : Promise.resolve()]).then(function (r) {
      me = r[0] || null; uid = me ? me.id : '';
      var adopt = YB.store.get('plcAdoptVideos', '');
      return (adopt && adopt === uid ? get('vlist:').then(function (l) { if (l && l.length) return Promise.all([put(K('vlist'), l), del('vlist:')]); }).then(function () { YB.store.remove('plcAdoptVideos'); if (YB.store.get('fmOwner', '') === '') YB.store.set('fmOwner', uid); }) : Promise.resolve())
        .then(function () { return Promise.all([get(K('vlist')), get(K('vinbox')), get(K('voutbox')), get(K('vreceipts'))]); });
    }).then(function (r) {
      list = r[0] || []; inbox = r[1] || []; outbox = r[2] || []; receipts = r[3] || [];
      // remember every file any saved video uses, so tidying up never removes them
      return kv('readonly', function (st, out) { var q = st.openCursor(); q.onsuccess = function () { var c = q.result; if (!c) return; if (String(c.key).indexOf('vproj:') === 0) blobIds(c.value).forEach(function (b) { keep[b] = 1; }); c.continue(); }; });
    }).then(function () {
      inbox.forEach(function (it) { blobIds(it.data).forEach(function (b) { keep[b] = 1; }); });
      var owner = YB.store.get('fmOwner', null), want = YB.store.get(K('vcur'), '');
      if (want && list.some(function (x) { return x.id === want; })) {
        // what the editor reopened is always the newest copy of this person's open video: keep it, don't reload an older save
        if (owner === uid) { cur = want; lastSig = ''; return saveCur(true); }
        return openVid(want);
      }
      if (list.length) return openVid(list.slice().sort(function (a, b) { return b.updated - a.updated; })[0].id);
      // first time for this person: what's on screen becomes their first video (unless it's someone else's)
      if (owner !== null && owner !== uid) return newVid(null);
      var id = 'v' + YB.uid(); list.push({ id: id, name: 'Video 1', updated: Date.now(), thumb: '' }); cur = id; YB.store.set(K('vcur'), id); YB.store.set('fmOwner', uid);
      return saveCur(true);
    }).then(function () {
      render();
      setInterval(function () { saveCur(); }, 2500);
      document.addEventListener('visibilitychange', function () { if (document.hidden) saveCur(); else deliverSoon(); });
      window.addEventListener('pagehide', function () { saveCur(); });
      if (me && window.YBP2PV) YBP2PV.listen(me.name, H);
      setInterval(deliver, 20000);
    });
    $('vidRename').addEventListener('click', function () {
      var c = list.find(function (x) { return x.id === cur; }); if (!c) return;
      var n = prompt('Name this video', c.name); if (n == null) return; n = n.trim().replace(/\s+/g, ' '); if (!n) return;
      c.name = n.slice(0, 60); put(K('vlist'), list).then(render);
    });
    $('vidDelete').addEventListener('click', function () {
      var c = list.find(function (x) { return x.id === cur; }); if (!c) return;
      if (!confirm('Delete "' + c.name + '"? This can’t be undone.')) return;
      var rest = list.filter(function (x) { return x.id !== cur; }), gone = cur;
      (rest.length ? openVid(rest.sort(function (a, b) { return b.updated - a.updated; })[0].id) : newVid(null)).then(function () {
        list = list.filter(function (x) { return x.id !== gone; });
        return get('vproj:' + gone).then(function (d) {
          var still = {}; return Promise.all(list.map(function (q) { return get('vproj:' + q.id).then(function (dd) { blobIds(dd).forEach(function (b) { still[b] = 1; }); }); })).then(function () { blobIds(d).forEach(function (b) { if (!still[b]) { delete keep[b]; F.delBlob(b); } }); });
        }).then(function () { return del('vproj:' + gone); }).then(function () { return put(K('vlist'), list); });
      }).then(function () { render(); YB.toast('Video deleted'); });
    });
    $('vidNew').addEventListener('click', function () { newVid(null).then(function () { YB.toast('New video — add your clips'); }); });
    $('vidSend').addEventListener('click', showSend);
    $('vidBackup').addEventListener('click', backup);
    $('vidRestore').addEventListener('change', function () { restore(this.files[0]); this.value = ''; });
    $('vidCard').addEventListener('click', function (e) {
      var b;
      if ((b = e.target.closest('[data-vdel]'))) { delVid(b.getAttribute('data-vdel')); return; }
      if ((b = e.target.closest('[data-vacc]'))) { answer(b.getAttribute('data-vacc'), true); return; }
      if ((b = e.target.closest('[data-vdec]'))) { answer(b.getAttribute('data-vdec'), false); return; }
      if ((b = e.target.closest('[data-vob]'))) { var id = b.getAttribute('data-vob'); outbox = outbox.filter(function (x) { return x.id !== id; }); put(K('voutbox'), outbox).then(render); return; }
      if ((b = e.target.closest('[data-vid]'))) { var v = b.getAttribute('data-vid'); if (v !== cur) openVid(v).then(function () { YB.toast('Opened'); }); }
    });
  }
  // the card is put in place right away (so it folds like the other parts); everything else starts once the editor is loaded
  function boot() { if (!document.getElementById('vidCard')) build(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  if (document.readyState === 'complete') start(); else document.addEventListener('DOMContentLoaded', start);
  window.PLCVideos = { list: function () { return list; }, current: function () { return cur; }, inbox: function () { return inbox; }, outbox: function () { return outbox; }, save: saveCur };
})();
