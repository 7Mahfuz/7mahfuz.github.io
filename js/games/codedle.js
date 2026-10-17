/**
 * Code-dle — guess the five-letter tech word in six tries. One shared word per
 * day (by the visitor's local date) plus an unlimited practice mode.
 */
(function () {
  'use strict';

  var WORDS = (
    'ABORT ADMIN AGILE ALERT ALIAS ARRAY ASYNC AWAIT AZURE BADGE BATCH BENCH BLAME BLOCK BRACE ' +
    'BREAK BUILD BYTES CACHE CATCH CHAIN CHART CHMOD CHOWN CHUNK CLASS CLICK CLONE CLOSE CLOUD ' +
    'COBOL CODEC CONST CRASH CRAWL DEBUG DEFER DELAY DEPTH DIGIT DRIVE EMAIL EMBED EMOJI EMPTY ' +
    'ENTRY ERROR EVENT FALSE FETCH FIBER FIELD FILES FINAL FLAGS FLASK FLOAT FLUSH FOCUS FORKS ' +
    'FRAME GRAPH GUARD HOOKS HOSTS HTTPS INDEX INFER INPUT ISSUE JOINS KAFKA KERAS LABEL LAYER ' +
    'LINUX LOCAL LOGIC LOGIN LOOPS MACRO MAVEN MERGE MKDIR MOCHA MODAL MODEL MOUSE MUTEX MYSQL ' +
    'NGINX NODES OAUTH PARAM PARSE PATCH PIPES PIXEL PIVOT PORTS PRINT PROPS PROXY QUERY QUEUE ' +
    'RAILS RAZOR REACT REDIS REDUX REGEX RESET ROUTE SCALA SCOPE SCRUM SETUP SHARD SHELL SLACK ' +
    'SLICE SOLID SPAWN SPLIT STACK STASH STATE STYLE SUPER SWIFT TABLE TOKEN TOUCH TRACE TUPLE ' +
    'TYPES UNION UNITY VALUE VIEWS VIRUS WATCH WHILE WIDTH WRITE YIELD'
  ).split(' ');

  var ROWS = 6, COLS = 5;
  var EPOCH = Date.UTC(2026, 0, 1);
  var STATS_KEY = 'arcade-codedle-stats';
  var DAILY_KEY = 'arcade-codedle-daily';
  var KEY_ROWS = ['QWERTYUIOP', 'ASDFGHJKL', '>ZXCVBNM<'];
  var RANK = { miss: 1, near: 2, hit: 3 };
  var EMOJI = { hit: '🟩', near: '🟨', miss: '⬛' };

  var api, panel, root, boardEl, msgEl, keysEl, resultEl, shareBtn, nextBtn;
  var tiles = [], keyEls = {};
  var mode = 'daily', answer = '', guesses = [], results = [], current = '', done = false, won = false, busy = false;
  var practice = null;
  var msgTimer = 0;

  /* ---------------------------------------------------------------------
     Words and days
     --------------------------------------------------------------------- */
  function dayNumber() {
    var now = new Date();
    return Math.floor((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - EPOCH) / 86400000);
  }

  // A fixed shuffle so the daily order isn't alphabetical, but is the same for everyone.
  var ORDER = (function () {
    var seed = 20260101;
    function rnd() {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    }
    var idx = WORDS.map(function (_, i) { return i; });
    for (var i = idx.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var t = idx[i];
      idx[i] = idx[j];
      idx[j] = t;
    }
    return idx;
  })();

  function dailyWord(day) {
    var n = WORDS.length;
    return WORDS[ORDER[((day % n) + n) % n]];
  }

  function evaluate(guess, target) {
    var out = ['miss', 'miss', 'miss', 'miss', 'miss'];
    var left = {};
    for (var i = 0; i < COLS; i++) {
      if (guess[i] === target[i]) out[i] = 'hit';
      else left[target[i]] = (left[target[i]] || 0) + 1;
    }
    for (i = 0; i < COLS; i++) {
      if (out[i] === 'hit') continue;
      if (left[guess[i]]) {
        out[i] = 'near';
        left[guess[i]]--;
      }
    }
    return out;
  }

  /* ---------------------------------------------------------------------
     Stats (daily games only)
     --------------------------------------------------------------------- */
  function loadStats() {
    return api.store.get(STATS_KEY, { played: 0, wins: 0, streak: 0, max: 0, dist: [0, 0, 0, 0, 0, 0], lastWin: null });
  }

  // A streak survives only if yesterday (or today) was won.
  function liveStreak(stats) {
    var day = dayNumber();
    return stats.lastWin === day || stats.lastWin === day - 1 ? stats.streak : 0;
  }

  function recordDaily(isWin, tries) {
    var stats = loadStats();
    var day = dayNumber();
    stats.played++;
    if (isWin) {
      stats.wins++;
      stats.dist[tries - 1]++;
      stats.streak = stats.lastWin === day - 1 ? stats.streak + 1 : 1;
      stats.max = Math.max(stats.max, stats.streak);
      stats.lastWin = day;
    } else {
      stats.streak = 0;
    }
    api.store.set(STATS_KEY, stats);
    paintStats(isWin ? tries : 0);
  }

  function paintStats(highlight) {
    var stats = loadStats();
    var streak = liveStreak(stats);
    function set(name, v) { panel.querySelector('[data-stat="' + name + '"]').textContent = v; }
    set('played', stats.played);
    set('win', stats.played ? Math.round((stats.wins / stats.played) * 100) : 0);
    set('streak', streak);
    set('max', stats.max);
    api.paintBest('codedle', streak);

    var dist = panel.querySelector('[data-dist]');
    dist.textContent = '';
    var top = Math.max.apply(null, stats.dist.concat([1]));
    stats.dist.forEach(function (n, i) {
      var row = document.createElement('div');
      row.className = 'dist-row' + (highlight === i + 1 ? ' is-today' : '');
      row.innerHTML = '<span class="dist-n"></span><span class="dist-bar"><span></span></span><span class="dist-v"></span>';
      row.querySelector('.dist-n').textContent = i + 1;
      row.querySelector('.dist-bar > span').style.width = n ? Math.max(6, (n / top) * 100) + '%' : '0';
      row.querySelector('.dist-v').textContent = n;
      dist.appendChild(row);
    });
  }

  /* ---------------------------------------------------------------------
     Rendering
     --------------------------------------------------------------------- */
  function say(text, sticky) {
    clearTimeout(msgTimer);
    msgEl.textContent = text;
    msgEl.classList.add('is-shown');
    api.announce(text);
    if (!sticky) msgTimer = setTimeout(function () { msgEl.classList.remove('is-shown'); }, 1800);
  }

  function hideMsg() {
    clearTimeout(msgTimer);
    msgEl.classList.remove('is-shown');
  }

  function paintRow(r) {
    var word = r < guesses.length ? guesses[r] : r === guesses.length ? current : '';
    for (var c = 0; c < COLS; c++) {
      var t = tiles[r][c];
      var ch = word[c] || '';
      t.textContent = ch;
      t.className = 'cd-tile' + (ch ? ' is-filled' : '') + (r < results.length ? ' ' + results[r][c] : '');
    }
  }

  function paintKeys() {
    var best = {};
    guesses.forEach(function (g, r) {
      for (var c = 0; c < COLS; c++) {
        var s = results[r][c];
        if (!best[g[c]] || RANK[s] > RANK[best[g[c]]]) best[g[c]] = s;
      }
    });
    Object.keys(keyEls).forEach(function (k) {
      keyEls[k].className = 'cd-key' + (k.length > 1 ? ' is-wide' : '') + (best[k] ? ' ' + best[k] : '');
    });
  }

  function paintAll() {
    for (var r = 0; r < ROWS; r++) paintRow(r);
    paintKeys();
    paintResult();
  }

  function paintResult() {
    resultEl.hidden = !done;
    if (!done) return;
    shareBtn.hidden = mode !== 'daily';
    nextBtn.hidden = mode !== 'practice';
  }

  /* ---------------------------------------------------------------------
     Input
     --------------------------------------------------------------------- */
  function type(ch) {
    if (done || busy || current.length >= COLS) return;
    current += ch;
    paintRow(guesses.length);
    var tile = tiles[guesses.length][current.length - 1];
    if (api.motion()) {
      tile.classList.remove('is-pop');
      void tile.offsetWidth;
      tile.classList.add('is-pop');
    }
  }

  function erase() {
    if (done || busy || !current) return;
    current = current.slice(0, -1);
    paintRow(guesses.length);
  }

  function shake(r) {
    var row = boardEl.children[r];
    if (!api.motion()) return;
    row.classList.remove('is-shake');
    void row.offsetWidth;
    row.classList.add('is-shake');
  }

  function submit() {
    if (done || busy) return;
    if (current.length < COLS) {
      shake(guesses.length);
      say('Not enough letters');
      api.tone(180, 0.08, { type: 'square', vol: 0.03 });
      return;
    }
    var row = guesses.length;
    var res = evaluate(current, answer);
    guesses.push(current);
    results.push(res);
    current = '';
    busy = true;

    var step = api.motion() ? 260 : 0;
    res.forEach(function (s, c) {
      setTimeout(function () {
        var t = tiles[row][c];
        t.classList.add(s);
        if (api.motion()) t.classList.add('is-flip');
        api.tone(s === 'hit' ? 660 : s === 'near' ? 520 : 300, 0.07, { type: 'triangle', vol: 0.035 });
      }, c * step);
    });

    setTimeout(function () {
      busy = false;
      paintRow(row);
      paintKeys();
      var isWin = res.every(function (s) { return s === 'hit'; });
      if (isWin || guesses.length === ROWS) finish(isWin);
      saveDaily();
    }, COLS * step + (step ? 120 : 0));
  }

  var PRAISE = ['Genius', 'Brilliant', 'Impressive', 'Splendid', 'Great', 'Phew'];

  function finish(isWin) {
    done = true;
    won = isWin;
    if (isWin) {
      say(PRAISE[guesses.length - 1] + ' — ' + answer + ' in ' + guesses.length, true);
      api.tone(523, 0.12, { type: 'triangle' });
      api.tone(784, 0.2, { type: 'triangle', delay: 0.1 });
      if (api.motion()) {
        var row = boardEl.children[guesses.length - 1];
        row.classList.add('is-win');
      }
    } else {
      say('The word was ' + answer, true);
      api.tone(220, 0.25, { type: 'sine' });
    }
    if (mode === 'daily') recordDaily(isWin, guesses.length);
    paintResult();
  }

  /* ---------------------------------------------------------------------
     Modes and persistence
     --------------------------------------------------------------------- */
  function saveDaily() {
    if (mode !== 'daily') return;
    api.store.set(DAILY_KEY, { day: dayNumber(), guesses: guesses, done: done, won: won });
  }

  function loadGame(word, saved) {
    answer = word;
    guesses = saved ? saved.guesses.slice() : [];
    results = guesses.map(function (g) { return evaluate(g, answer); });
    current = '';
    done = saved ? !!saved.done : false;
    won = saved ? !!saved.won : false;
    busy = false;
    hideMsg();
    Array.prototype.forEach.call(boardEl.children, function (row) { row.className = 'cd-row'; });
    paintAll();
    if (done) say(won ? 'Solved — ' + answer + ' in ' + guesses.length : 'The word was ' + answer, true);
  }

  function startDaily() {
    mode = 'daily';
    var day = dayNumber();
    var saved = api.store.get(DAILY_KEY, null);
    loadGame(dailyWord(day), saved && saved.day === day ? saved : null);
  }

  function startPractice(fresh) {
    mode = 'practice';
    if (fresh || !practice) {
      var today = dailyWord(dayNumber()), word;
      do { word = WORDS[Math.floor(Math.random() * WORDS.length)]; } while (word === today);
      practice = { word: word, guesses: [], done: false, won: false };
    }
    loadGame(practice.word, practice);
  }

  function setMode(next) {
    if (mode === 'practice') practice = { word: answer, guesses: guesses.slice(), done: done, won: won };
    panel.querySelectorAll('[data-mode]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-mode') === next));
    });
    if (next === 'daily') startDaily();
    else startPractice(false);
  }

  function share() {
    var day = dayNumber();
    var lines = results.map(function (row) { return row.map(function (s) { return EMOJI[s]; }).join(''); });
    var text = 'Code-dle #' + (day + 1) + ' ' + (won ? guesses.length : 'X') + '/6\n\n' + lines.join('\n') +
      '\n\n' + location.href.split('#')[0] + '#codedle';

    function fallback() {
      if (navigator.share) navigator.share({ text: text }).catch(function () {});
      else say('Copy failed — your browser blocked the clipboard');
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { say('Result copied'); }, fallback);
    } else {
      fallback();
    }
  }

  /* ---------------------------------------------------------------------
     Mount
     --------------------------------------------------------------------- */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function mount(p, arcadeApi) {
    api = arcadeApi;
    panel = p;
    var stage = panel.querySelector('[data-stage]');

    root = el('div', 'codedle');
    root.tabIndex = 0;
    root.setAttribute('data-focus', '');
    root.setAttribute('role', 'group');
    root.setAttribute('aria-label', 'Code-dle board. Type letters, Backspace to delete, Enter to guess.');

    msgEl = el('p', 'cd-msg');
    boardEl = el('div', 'cd-board');
    for (var r = 0; r < ROWS; r++) {
      var row = el('div', 'cd-row');
      tiles.push([]);
      for (var c = 0; c < COLS; c++) {
        var t = el('div', 'cd-tile');
        row.appendChild(t);
        tiles[r].push(t);
      }
      boardEl.appendChild(row);
    }

    resultEl = el('div', 'cd-result');
    shareBtn = el('button', 'btn btn-primary btn-sm', 'Share result');
    shareBtn.type = 'button';
    shareBtn.addEventListener('click', share);
    nextBtn = el('button', 'btn btn-primary btn-sm', 'New word');
    nextBtn.type = 'button';
    nextBtn.addEventListener('click', function () {
      startPractice(true);
      root.focus({ preventScroll: true });
    });
    resultEl.appendChild(shareBtn);
    resultEl.appendChild(nextBtn);

    keysEl = el('div', 'cd-keys');
    KEY_ROWS.forEach(function (letters) {
      var krow = el('div', 'cd-keyrow');
      letters.split('').forEach(function (ch) {
        var name = ch === '>' ? 'ENTER' : ch === '<' ? 'BACK' : ch;
        var key = el('button', 'cd-key', ch === '<' ? '⌫' : name === 'ENTER' ? 'Enter' : ch);
        key.type = 'button';
        key.tabIndex = -1;
        key.setAttribute('data-key', name);
        if (ch === '<') key.setAttribute('aria-label', 'Delete letter');
        // Keep focus on the board so the physical keyboard keeps working.
        key.addEventListener('mousedown', function (e) { e.preventDefault(); });
        key.addEventListener('click', function () {
          if (name === 'ENTER') submit();
          else if (name === 'BACK') erase();
          else type(name);
        });
        keyEls[name] = key;
        krow.appendChild(key);
      });
      keysEl.appendChild(krow);
    });

    root.appendChild(msgEl);
    root.appendChild(boardEl);
    root.appendChild(resultEl);
    root.appendChild(keysEl);
    stage.appendChild(root);

    panel.querySelectorAll('[data-mode]').forEach(function (b) {
      b.addEventListener('click', function () {
        setMode(b.getAttribute('data-mode'));
        root.focus({ preventScroll: true });
      });
    });

    paintStats(0);
    startDaily();
  }

  Arcade.register('codedle', {
    mount: mount,
    badge: function (arcadeApi) {
      api = arcadeApi;
      arcadeApi.paintBest('codedle', liveStreak(loadStats()));
    },
    onKey: function (e) {
      if (e.key === 'Enter') {
        submit();
        return true;
      }
      if (e.key === 'Backspace') {
        erase();
        return true;
      }
      if (/^[a-zA-Z]$/.test(e.key)) {
        type(e.key.toUpperCase());
        return true;
      }
      return false;
    }
  });
})();
