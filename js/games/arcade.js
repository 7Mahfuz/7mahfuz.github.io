/**
 * Arcade shell for games.html — tabs, deep links, keyboard routing, saved best
 * scores, stage overlays and a tiny Web Audio synth shared by every game.
 *
 * A game registers itself with:
 *   Arcade.register(id, {
 *     mount(panel, api),   // build DOM inside the panel's [data-stage]; called once, lazily
 *     activate(),          // panel became visible (redraw; never auto-resume play)
 *     deactivate(),        // panel hidden or page backgrounded (pause play)
 *     onKey(event),        // return true when the key was used (default is prevented)
 *     onKeyUp(event),      // optional: key releases, same rules as onKey
 *     onTheme(),           // colours changed; re-read tokens and redraw
 *     badge(api)           // optional: paint the picker badge at boot instead of the best score
 *   });
 */
(function () {
  'use strict';

  var games = {};
  var mounted = {};
  var inView = {};
  var activeId = null;

  /* Storage that never throws (private mode, blocked storage). */
  var store = {
    get: function (key, fallback) {
      try {
        var raw = localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (e) {
        return fallback;
      }
    },
    set: function (key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* not persisted */ }
    }
  };

  var motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  function motion() {
    return !(motionQuery && motionQuery.matches);
  }

  function css(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function fmt(n) {
    return Math.round(n).toLocaleString('en-US');
  }

  /* ---------------------------------------------------------------------
     Sound — short synthesized blips; nothing is downloaded.
     --------------------------------------------------------------------- */
  var muted = store.get('arcade-muted', false);
  var actx = null;

  function audio() {
    if (actx) return actx;
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    try { actx = new Ctx(); } catch (e) { actx = null; }
    return actx;
  }

  function tone(freq, dur, opts) {
    if (muted) return;
    var ctx = audio();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    opts = opts || {};
    var t = ctx.currentTime + (opts.delay || 0);
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = opts.type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (opts.slide) osc.frequency.exponentialRampToValueAtTime(opts.slide, t + dur);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(opts.vol || 0.07, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.03);
  }

  function noise(dur, vol) {
    if (muted) return;
    var ctx = audio();
    if (!ctx) return;
    var len = Math.floor(ctx.sampleRate * dur);
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var src = ctx.createBufferSource();
    var filter = ctx.createBiquadFilter();
    var gain = ctx.createGain();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    gain.gain.value = vol || 0.12;
    src.buffer = buf;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start();
  }

  function initSoundToggle() {
    var btn = document.querySelector('[data-sound-toggle]');
    if (!btn) return;
    function paint() {
      btn.setAttribute('aria-pressed', String(!muted));
      btn.setAttribute('aria-label', muted ? 'Sound off' : 'Sound on');
      btn.classList.toggle('is-muted', muted);
    }
    paint();
    btn.addEventListener('click', function () {
      muted = !muted;
      store.set('arcade-muted', muted);
      paint();
      if (!muted) tone(660, 0.12, { type: 'triangle' });
    });
  }

  /* ---------------------------------------------------------------------
     Best scores
     --------------------------------------------------------------------- */
  function getBest(id) {
    return store.get('arcade-best-' + id, 0);
  }

  function paintBest(id, value) {
    document.querySelectorAll('[data-best="' + id + '"]').forEach(function (el) {
      el.textContent = fmt(value);
    });
  }

  function submitScore(id, score) {
    var best = getBest(id);
    if (score <= best) return false;
    store.set('arcade-best-' + id, score);
    paintBest(id, score);
    return true;
  }

  /* ---------------------------------------------------------------------
     Screen-reader announcements
     --------------------------------------------------------------------- */
  var announcer = null;
  function announce(message) {
    if (!announcer) announcer = document.querySelector('[data-announce]');
    if (!announcer) return;
    announcer.textContent = '';
    setTimeout(function () { announcer.textContent = message; }, 30);
  }

  /* ---------------------------------------------------------------------
     Stage overlay (start / paused / game over)
     --------------------------------------------------------------------- */
  function makeOverlay(stage) {
    var el = document.createElement('div');
    el.className = 'stage-overlay';
    el.hidden = true;
    el.innerHTML =
      '<div class="overlay-card">' +
      '<p class="overlay-kicker"></p>' +
      '<p class="overlay-title"></p>' +
      '<p class="overlay-text"></p>' +
      '<button class="btn btn-primary" type="button"></button>' +
      '</div>';
    stage.appendChild(el);
    var kicker = el.querySelector('.overlay-kicker');
    var title = el.querySelector('.overlay-title');
    var text = el.querySelector('.overlay-text');
    var button = el.querySelector('button');
    var action = null;
    var shownAt = 0;

    button.addEventListener('click', function (e) {
      e.stopPropagation();
      if (action) action();
    });

    return {
      show: function (o) {
        kicker.textContent = o.kicker || '';
        kicker.hidden = !o.kicker;
        title.textContent = o.title || '';
        text.textContent = o.text || '';
        text.hidden = !o.text;
        button.textContent = o.button || 'Play';
        action = o.onAction || null;
        el.hidden = false;
        shownAt = performance.now();
        if (o.focus) button.focus({ preventScroll: true });
      },
      hide: function () {
        el.hidden = true;
      },
      get visible() {
        return !el.hidden;
      },
      // Taps on the backdrop and Space/Enter wait briefly, so frantic tapping at the
      // moment of a crash can't skip past the result. The button works immediately.
      trigger: function () {
        if (!el.hidden && action && performance.now() - shownAt > 500) action();
      }
    };
  }

  var api = {
    store: store,
    css: css,
    fmt: fmt,
    motion: motion,
    tone: tone,
    noise: noise,
    getBest: getBest,
    submitScore: submitScore,
    paintBest: paintBest,
    announce: announce,
    makeOverlay: makeOverlay,
    isActive: function (id) { return activeId === id; }
  };

  /* ---------------------------------------------------------------------
     Tabs and panels
     --------------------------------------------------------------------- */
  var tabs = [];
  var panels = {};

  function select(id, opts) {
    opts = opts || {};
    if (!games[id] || !panels[id]) return;
    if (id === activeId) return;

    if (activeId && games[activeId].deactivate) games[activeId].deactivate();
    activeId = id;

    tabs.forEach(function (t) {
      var on = t.getAttribute('data-game') === id;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    Object.keys(panels).forEach(function (key) {
      panels[key].hidden = key !== id;
    });

    if (!mounted[id]) {
      games[id].mount(panels[id], api);
      mounted[id] = true;
    }
    if (games[id].activate) games[id].activate();

    if (opts.updateHash && history.replaceState) history.replaceState(null, '', '#' + id);
    if (opts.scroll) {
      var stage = panels[id].querySelector('[data-stage]');
      var r = stage.getBoundingClientRect();
      if (r.top < 60 || r.bottom > window.innerHeight) {
        panels[id].scrollIntoView({ behavior: motion() ? 'smooth' : 'auto', block: 'start' });
      }
    }
  }

  function initTabs() {
    tabs = Array.prototype.slice.call(document.querySelectorAll('[data-picker] [role="tab"]'));
    document.querySelectorAll('[data-panel]').forEach(function (p) {
      panels[p.getAttribute('data-panel')] = p;
    });

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function (e) {
        var id = tab.getAttribute('data-game');
        select(id, { updateHash: true, scroll: true });
        // A mouse or touch pick hands the keyboard to the game (arrow keys would otherwise
        // keep moving between tabs). Keyboard activation (detail 0) leaves focus on the tab.
        if (e.detail > 0) {
          var target = panels[id].querySelector('[data-focus]');
          if (target) target.focus({ preventScroll: true });
        }
      });
      tab.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = tabs[(i + 1) % tabs.length];
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (e.key === 'Home') next = tabs[0];
        else if (e.key === 'End') next = tabs[tabs.length - 1];
        if (!next) return;
        e.preventDefault();
        next.focus();
        select(next.getAttribute('data-game'), { updateHash: true });
      });
    });

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          inView[entry.target.getAttribute('data-panel')] = entry.intersectionRatio > 0.3;
        });
      }, { threshold: [0, 0.3, 0.6, 1] });
      Object.keys(panels).forEach(function (key) { io.observe(panels[key]); });
    }
  }

  /* Keys go to the active game when its panel is on screen and focus isn't on
     the tab list or a form control. Enter/Space on a focused button stay with it. */
  function routable(e, handler) {
    if (!activeId || !games[activeId][handler]) return false;
    if (e.metaKey || e.ctrlKey || e.altKey) return false;
    var t = e.target;
    if (t.closest && t.closest('[role="tablist"], [role="radiogroup"], input, textarea, select, [contenteditable="true"]')) return false;
    if ((e.key === 'Enter' || e.key === ' ') && t.closest && t.closest('button, a[href]')) return false;
    return inView[activeId] !== false;
  }

  function initKeys() {
    document.addEventListener('keydown', function (e) {
      if (routable(e, 'onKey') && games[activeId].onKey(e)) e.preventDefault();
    });
    // Releases matter for hold-to-jump-higher and ducking (Dino Jump).
    document.addEventListener('keyup', function (e) {
      if (routable(e, 'onKeyUp') && games[activeId].onKeyUp(e)) e.preventDefault();
    });
  }

  function initLifecycle() {
    document.addEventListener('visibilitychange', function () {
      if (!activeId) return;
      var g = games[activeId];
      if (document.hidden) {
        if (g.deactivate) g.deactivate();
      } else if (g.activate) {
        g.activate();
      }
    });
    document.addEventListener('themechange', function () {
      Object.keys(mounted).forEach(function (id) {
        if (games[id].onTheme) games[id].onTheme();
      });
    });
  }

  function boot() {
    initSoundToggle();
    initTabs();
    initKeys();
    initLifecycle();
    // Picker badges: best score by default, or a game's own badge (Code-dle shows its streak).
    Object.keys(games).forEach(function (id) {
      if (games[id].badge) games[id].badge(api);
      else paintBest(id, getBest(id));
    });

    var fromHash = location.hash.replace('#', '');
    select(games[fromHash] ? fromHash : 'dino', { scroll: !!games[fromHash] });
    window.addEventListener('hashchange', function () {
      var id = location.hash.replace('#', '');
      if (games[id]) select(id, { scroll: true });
    });
  }

  window.Arcade = {
    register: function (id, game) {
      games[id] = game;
    },
    api: api
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else setTimeout(boot, 0);
})();
