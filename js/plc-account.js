/* Pro Level Cuts — one account for the whole site.
   The 👤 button at the top of every page signs you in with your name and PIN (or makes an account).
   Photo Showcase and the Video Editor both use it: your photo projects and your videos are kept
   under your name on this device, and people can send you either one by your name.
   Accounts live in the same place Photo Showcase always kept them, so nothing already made is lost. */
(function () {
  'use strict';
  var DB = 'pro-level-cuts-showcase';
  var people = [], me = null, subs = [], tries = 0, lockUntil = 0, pick = '', ui = null;

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
  function hashPin(pin, salt) {
    var txt = salt + ':' + pin;
    if (window.crypto && crypto.subtle && window.TextEncoder) return crypto.subtle.digest('SHA-256', new TextEncoder().encode(txt)).then(function (h) { return Array.from(new Uint8Array(h)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join(''); });
    var h = 5381; for (var i = 0; i < txt.length; i++) h = ((h * 33) ^ txt.charCodeAt(i)) >>> 0; return Promise.resolve('x' + h.toString(16));
  }
  function esc(s) { return YB.esc ? YB.esc(s) : String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function $(id) { return document.getElementById(id); }

  var ready = new Promise(function (res) {
    function go() {
      get('users').then(function (l) {
        people = Array.isArray(l) ? l : [];
        var id = YB.store.get('scUser', ''); me = people.find(function (u) { return u.id === id; }) || null;
        if (id && !me) YB.store.remove('scUser');
        paint(); res(me);
      });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
  });

  function paint() {
    document.querySelectorAll('[data-acct-btn]').forEach(function (b) {
      b.classList.toggle('in', !!me);
      b.querySelector('span').textContent = me ? me.name.split(' ')[0] : 'Sign in';
      b.setAttribute('aria-label', me ? 'Account — signed in as ' + me.name : 'Sign in');
    });
  }
  function become(id, msg) {   // the whole site switches to that person: reload so every page opens their work
    if (id) YB.store.set('scUser', id); else YB.store.remove('scUser');
    try { sessionStorage.setItem('plcAcctMsg', msg || ''); } catch (e) { /* no storage */ }
    if (window.YBFmt && YBFmt.flush) try { YBFmt.flush(); } catch (e) { /* nothing open */ }
    setTimeout(function () { location.reload(); }, 150);
  }

  /* ---------- the sheet ---------- */
  function close() { if (ui) { ui.remove(); ui = null; document.removeEventListener('keydown', key); } }
  function key(e) { if (e.key === 'Escape') close(); }
  function sheet(html) {
    close();
    ui = document.createElement('div'); ui.className = 'plc-acct'; ui.setAttribute('role', 'dialog'); ui.setAttribute('aria-modal', 'true'); ui.setAttribute('aria-label', 'Your account');
    ui.innerHTML = '<div class="plc-acct-card"><button type="button" class="plc-acct-x" aria-label="Close" data-x>✕</button>' + html + '</div>';
    ui.addEventListener('click', function (e) { if (e.target === ui || e.target.closest('[data-x]')) close(); });
    document.body.appendChild(ui); document.addEventListener('keydown', key);
    return ui;
  }
  function open(mode) {
    return ready.then(function () {
      if (me) return showMe();
      if (mode === 'create' || !people.length) return showCreate();
      showSignIn();
    });
  }
  function showMe() {
    sheet('<div class="plc-acct-head">👤 <b>' + esc(me.name) + '</b></div>' +
      '<p class="muted small">You’re signed in on this device. Your photo projects and your videos are saved under your name, and people can send you either one by your name.</p>' +
      '<div class="row" style="gap:8px;flex-wrap:wrap"><a class="btn btn-ghost btn-sm" href="showcase.html">📸 My photo projects</a><a class="btn btn-ghost btn-sm" href="formatter.html">🎬 My videos</a></div>' +
      (people.length > 1 ? '<div class="label" style="margin-top:12px">Switch to someone else</div><div class="sc-people">' + people.filter(function (u) { return u.id !== me.id; }).map(function (u) { return '<button type="button" class="sc-person" data-switch="' + u.id + '">👤 ' + esc(u.name) + '</button>'; }).join('') + '</div>' : '') +
      '<div class="row" style="gap:8px;margin-top:12px"><button type="button" class="btn btn-ghost" data-out>Sign out</button></div>');
    ui.querySelector('[data-out]').onclick = function () { become('', 'Signed out — your work is safe in your account'); };
    ui.querySelectorAll('[data-switch]').forEach(function (b) { b.onclick = function () { pick = b.getAttribute('data-switch'); showSignIn(pick); }; });
  }
  function showSignIn(who) {
    sheet('<div class="plc-acct-head">🔑 Sign in</div>' +
      '<label class="sc-field"><span>Find your name</span><input id="paFind" type="search" autocomplete="off" placeholder="Start typing your name"></label>' +
      '<div class="sc-people" id="paList"></div>' +
      '<div id="paPinBox" hidden><label class="sc-field"><span>PIN for <b id="paWho"></b></span><input id="paPin" type="password" inputmode="numeric" autocomplete="current-password" maxlength="8" placeholder="••••"></label>' +
      '<button class="btn" type="button" id="paGo">🔑 Sign in</button></div>' +
      '<p class="small" id="paMsg" aria-live="polite"></p>' +
      '<p class="muted small" style="margin-top:10px">New here? <button type="button" class="btn btn-ghost btn-sm" id="paNew">✨ Make an account</button></p>');
    function list(q) {
      q = String(q || '').trim().toLowerCase();
      var l = people.filter(function (u) { return !q || u.name.toLowerCase().indexOf(q) !== -1; }).sort(function (a, b) { return a.name.localeCompare(b.name); });
      $('paList').innerHTML = l.length ? l.map(function (u) { return '<button type="button" class="sc-person' + (u.id === pick ? ' on' : '') + '" data-pa="' + u.id + '">👤 ' + esc(u.name) + '</button>'; }).join('') : '<p class="muted small">No one by that name on this device.</p>';
    }
    function choose(id) { pick = id; var u = people.find(function (x) { return x.id === id; }); if (!u) return; $('paWho').textContent = u.name; $('paPinBox').hidden = false; list($('paFind').value); $('paPin').value = ''; $('paPin').focus(); }
    list(''); if (who) choose(who); else $('paFind').focus();
    $('paFind').oninput = function () { list(this.value); };
    $('paList').onclick = function (e) { var b = e.target.closest('[data-pa]'); if (b) choose(b.getAttribute('data-pa')); };
    $('paPin').oninput = function () { this.value = this.value.replace(/\D/g, ''); };
    $('paPin').onkeydown = function (e) { if (e.key === 'Enter') signIn(); };
    $('paGo').onclick = signIn; $('paNew').onclick = showCreate;
  }
  function signIn() {
    var u = people.find(function (x) { return x.id === pick; }), pin = $('paPin').value.trim(), msg = $('paMsg');
    if (!u) return;
    if (Date.now() < lockUntil) { msg.textContent = 'Too many wrong PINs — wait ' + Math.ceil((lockUntil - Date.now()) / 1000) + ' seconds.'; return; }
    hashPin(pin, u.salt).then(function (h) {
      if (h !== u.pin) { tries++; if (tries >= 5) { lockUntil = Date.now() + 30000; tries = 0; } msg.textContent = 'That PIN isn’t right. Try again.'; $('paPin').value = ''; $('paPin').focus(); return; }
      tries = 0; become(u.id, 'Signed in as ' + u.name);
    });
  }
  function showCreate() {
    sheet('<div class="plc-acct-head">✨ Make an account</div>' +
      '<label class="sc-field"><span>Your name</span><input id="pcName" type="text" autocomplete="name" maxlength="40" placeholder="For example: Curtis"></label>' +
      '<label class="sc-field"><span>Make a PIN (4 to 8 numbers)</span><input id="pcPin" type="password" inputmode="numeric" autocomplete="new-password" maxlength="8" placeholder="••••"></label>' +
      '<label class="sc-field"><span>Type the PIN again</span><input id="pcPin2" type="password" inputmode="numeric" autocomplete="new-password" maxlength="8" placeholder="••••"></label>' +
      '<button class="btn" type="button" id="pcGo">✅ Make my account</button><p class="small" id="pcMsg" aria-live="polite"></p>' +
      (people.length ? '<p class="muted small" style="margin-top:10px">Already have one? <button type="button" class="btn btn-ghost btn-sm" id="pcHave">🔑 Sign in</button></p>' : ''));
    ['pcPin', 'pcPin2'].forEach(function (id) { $(id).oninput = function () { this.value = this.value.replace(/\D/g, ''); }; });
    ui.querySelectorAll('input').forEach(function (i) { i.onkeydown = function (e) { if (e.key === 'Enter') create(); }; });
    $('pcGo').onclick = create; if ($('pcHave')) $('pcHave').onclick = function () { showSignIn(); };
    $('pcName').focus();
  }
  function create() {
    var name = $('pcName').value.trim().replace(/\s+/g, ' '), pin = $('pcPin').value.trim(), pin2 = $('pcPin2').value.trim(), msg = $('pcMsg');
    if (name.length < 2) { msg.textContent = 'Type your name (at least 2 letters).'; return; }
    if (people.some(function (u) { return u.name.toLowerCase() === name.toLowerCase(); })) { msg.textContent = 'Someone on this device already uses that name — add your last name or a nickname.'; return; }
    if (!/^\d{4,8}$/.test(pin)) { msg.textContent = 'The PIN must be 4 to 8 numbers.'; return; }
    if (pin !== pin2) { msg.textContent = 'The two PINs are different — type them again.'; return; }
    var u = { id: 'u' + YB.uid(), name: name, salt: YB.uid() + YB.uid(), created: Date.now() }, first = !people.length;
    hashPin(pin, u.salt).then(function (h) {
      u.pin = h; people.push(u);
      return kv('readwrite', function (st) { st.put(people, 'users'); });
    }).then(function () {
      if (!first) return;
      // the very first account takes the photo projects and videos already on this device
      return get('projects').then(function (l) {
        var hasPhotos = Array.isArray(l) && l.length;
        if (!confirm('Put the photo projects and videos already on this device into ' + name + '’s account?')) return;
        YB.store.set('plcAdoptVideos', u.id);
        if (!hasPhotos) return;
        var openP = YB.store.get('scProject', '');
        return kv('readwrite', function (st) { st.put(l, 'projects:' + u.id); st.delete('projects'); }).then(function () { if (openP) YB.store.set('scProject:' + u.id, openP); YB.store.remove('scProject'); });
      });
    }).then(function () { become(u.id, 'Welcome, ' + name + '!'); });
  }

  /* ---------- the 👤 button on every page ---------- */
  function init() {
    document.querySelectorAll('[data-acct-btn]').forEach(function (b) { b.addEventListener('click', function () { var nav = $('nav'); if (nav && nav.classList.contains('open')) document.querySelector('.menu-btn').click(); open(); }); });
    var m = ''; try { m = sessionStorage.getItem('plcAcctMsg') || ''; sessionStorage.removeItem('plcAcctMsg'); } catch (e) { /* no storage */ }
    if (m) setTimeout(function () { YB.toast(m); }, 600);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  window.PLCAcct = { ready: ready, me: function () { return me; }, open: open, signOut: function () { become('', 'Signed out — your work is safe in your account'); } };
})();
