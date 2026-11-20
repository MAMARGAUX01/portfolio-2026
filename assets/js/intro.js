(function () {
  var stage = document.querySelector('[data-intro]');
  if (!stage) return;

  var root = document.documentElement;
  var video = stage.querySelector('video');
  var layer = stage.querySelector('.bubbles');
  var btnPlay = document.getElementById('intro-play');
  var btnSkip = document.getElementById('intro-skip');
  var live = document.getElementById('intro-status');
  var hero = document.getElementById('hero');
  var useVideo = false;

  var L = {
    play: stage.dataset.lPlay || 'Lecture', pause: stage.dataset.lPause || 'Pause',
    replay: stage.dataset.lReplay || "Revoir l'intro", done: stage.dataset.lDone || 'Intro terminée',
    sp: stage.dataset.lSp || 'Lecture', spa: stage.dataset.lSpa || 'Pause'
  };

  var cues = [].slice.call(document.querySelectorAll('#transcript li')).map(function (li) {
    return { start: parseFloat(li.dataset.start), end: parseFloat(li.dataset.end), text: li.textContent.trim() };
  });
  if (!cues.length) return;
  var total = Math.max.apply(null, cues.map(function (c) { return c.end; })) + 1.2;

  var bubbles = cues.map(function (c, i) {
    var p = document.createElement('p');
    p.className = 'bubble';
    p.dataset.side = i % 2 ? 'left' : 'right';
    var body = document.createElement('span');
    body.className = 'bubble__body';
    p.appendChild(body);
    c.words = c.text.split(/\s+/).map(function (w) {
      var s = document.createElement('span');
      s.className = 'w';
      s.textContent = w + ' ';
      body.appendChild(s);
      return s;
    });
    layer.appendChild(p);
    return p;
  });

  var state = 'idle';
  var clock = 0;
  var last = 0;
  var raf = 0;
  var ready = false;

  function reduced() { return root.dataset.motion === 'reduced'; }
  function clamp(v) { return Math.max(0, Math.min(1, v)); }
  function say(msg) { if (ready && live) live.textContent = msg; }

  function render(t) {
    cues.forEach(function (c, i) {
      var on = t >= c.start && t < c.end;
      bubbles[i].classList.toggle('is-on', on);
      if (!on) return;
      var dur = Math.max(0.6, Math.min(c.end - c.start - 0.5, c.words.length * 0.32));
      var n = Math.ceil(clamp((t - c.start) / dur) * c.words.length);
      c.words.forEach(function (w, k) { w.classList.toggle('in', k < n); });
    });
  }

  function clearBubbles() {
    bubbles.forEach(function (b) { b.classList.remove('is-on'); });
    cues.forEach(function (c) { c.words.forEach(function (w) { w.classList.remove('in'); }); });
  }

  function setButton() {
    var label = state === 'playing' ? L.pause : (state === 'done' ? L.replay : L.play);
    var icon = state === 'playing'
      ? '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="2" width="3.5" height="12" rx="1" fill="currentColor"/><rect x="9.5" y="2" width="3.5" height="12" rx="1" fill="currentColor"/></svg>'
      : '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.2v11.6a.6.6 0 0 0 .9.5l9-5.8a.6.6 0 0 0 0-1L4.9 1.7a.6.6 0 0 0-.9.5z" fill="currentColor"/></svg>';
    btnPlay.innerHTML = icon + '<span>' + label + '</span>';
    if (btnSkip) btnSkip.hidden = state === 'done';
  }

  function tick(now) {
    clock += (now - last) / 1000;
    last = now;
    if (useVideo && video.readyState > 1) clock = video.currentTime;
    render(clock);
    if (clock >= total || (useVideo && video.ended)) { finish(false); return; }
    raf = requestAnimationFrame(tick);
  }

  function restartFallback() {
    stage.classList.remove('is-playing');
    void stage.offsetWidth;
  }

  function play() {
    if (state === 'done') { clock = 0; clearBubbles(); if (useVideo) video.currentTime = 0; restartFallback(); }
    state = 'playing';
    stage.classList.add('is-playing');
    stage.classList.remove('is-paused', 'is-done');
    if (useVideo) { var pr = video.play(); if (pr && pr.catch) pr.catch(function () { pause(); }); }
    last = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(tick);
    setButton();
    say(L.sp);
  }

  function pause() {
    if (state !== 'playing') return;
    state = 'paused';
    cancelAnimationFrame(raf);
    if (useVideo) video.pause();
    stage.classList.add('is-paused');
    setButton();
    say(L.spa);
  }

  function finish(viaSkip) {
    cancelAnimationFrame(raf);
    if (useVideo) video.pause();
    state = 'done';
    clearBubbles();
    stage.classList.remove('is-playing', 'is-paused');
    stage.classList.add('is-done');
    try { sessionStorage.setItem('mi-intro-seen', '1'); } catch (e) {}
    setButton();
    say(L.done);
    if (viaSkip && hero) {
      hero.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
      var h1 = hero.querySelector('h1');
      if (h1) { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); }
    }
  }

  btnPlay.addEventListener('click', function () {
    if (state === 'playing') pause(); else play();
  });
  if (btnSkip) btnSkip.addEventListener('click', function () { finish(true); });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden && state === 'playing') pause();
  });

  function init() {
    var seen = false;
    try { seen = sessionStorage.getItem('mi-intro-seen') === '1'; } catch (e) {}
    if (reduced() || seen) {
      finish(false);
    } else {
      setButton();
      setTimeout(function () { if (state === 'idle') play(); }, 400);
    }
    ready = true;
  }

  var sources = video ? video.querySelectorAll('source') : [];
  if (video && sources.length) {
    var settled = false;
    var go = function (ok) {
      if (settled) return;
      settled = true;
      if (ok) {
        useVideo = true;
        stage.dataset.video = 'on';
        if (isFinite(video.duration) && video.duration > 0) total = video.duration;
      }
      init();
    };
    video.addEventListener('loadedmetadata', function () { go(true); });
    sources[sources.length - 1].addEventListener('error', function () { go(false); });
    setTimeout(function () { go(video.readyState > 0); }, 1800);
    video.load();
  } else {
    init();
  }
})();
