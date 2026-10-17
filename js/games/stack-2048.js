/**
 * Stack 2048 — the 2048 sliding puzzle, with tiles that climb a developer
 * stack instead of plain numbers. DOM tiles animate with CSS transforms.
 */
(function () {
  'use strict';

  var LADDER = ['HTML', 'CSS', 'JS', 'jQuery', 'C#', 'SQL', '.NET', 'AL', 'Flutter', 'AWS', 'Senior', 'Lead', 'CTO', 'Founder', 'Legend'];
  var NOTES = { 'AL': 'Business Central', 'Senior': 'you win', 'Legend': 'and beyond' };
  var SIZE = 4;
  var WIN = 2048;
  var STATE_KEY = 'arcade-2048-state';
  var VEC = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] };
  var KEYS = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right'
  };

  var api, board, tileLayer, overlay, scoreEl;
  var grid, score, won, keepPlaying, over, moveCount = 0, nextId = 1;

  function level(v) {
    return Math.min(LADDER.length - 1, Math.round(Math.log(v) / Math.LN2) - 1);
  }

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function moveMs() {
    return api.motion() ? 110 : 0;
  }

  /* ---------------------------------------------------------------------
     Tiles
     --------------------------------------------------------------------- */
  function paintTile(t, extra) {
    var lv = level(t.v);
    var name = LADDER[lv];
    t.el.className = 'tile lv-' + lv + (name.length >= 6 ? ' is-long' : '') + (extra ? ' ' + extra : '');
    t.label.textContent = name;
    t.num.textContent = t.v;
  }

  function place(t) {
    t.el.style.setProperty('--r', t.r);
    t.el.style.setProperty('--c', t.c);
  }

  function createTile(v, r, c, extra) {
    var t = { id: nextId++, v: v, r: r, c: c, mergedAt: -1 };
    t.el = el('div', 'tile');
    t.label = el('span', 'tile-label');
    t.num = el('span', 'tile-num');
    t.el.appendChild(t.label);
    t.el.appendChild(t.num);
    paintTile(t, extra);
    place(t);
    tileLayer.appendChild(t.el);
    grid[r][c] = t;
    return t;
  }

  function emptyCells() {
    var cells = [];
    for (var r = 0; r < SIZE; r++) {
      for (var c = 0; c < SIZE; c++) if (!grid[r][c]) cells.push([r, c]);
    }
    return cells;
  }

  function addRandom() {
    var cells = emptyCells();
    if (!cells.length) return;
    var pick = cells[Math.floor(Math.random() * cells.length)];
    createTile(Math.random() < 0.9 ? 2 : 4, pick[0], pick[1], api.motion() ? 'is-new' : '');
  }

  function canMove() {
    if (emptyCells().length) return true;
    for (var r = 0; r < SIZE; r++) {
      for (var c = 0; c < SIZE; c++) {
        var v = grid[r][c].v;
        if ((c + 1 < SIZE && grid[r][c + 1].v === v) || (r + 1 < SIZE && grid[r + 1][c].v === v)) return true;
      }
    }
    return false;
  }

  function highest() {
    var max = 0;
    grid.forEach(function (row) { row.forEach(function (t) { if (t && t.v > max) max = t.v; }); });
    return max;
  }

  /* ---------------------------------------------------------------------
     Game flow
     --------------------------------------------------------------------- */
  function reset() {
    grid = [];
    for (var r = 0; r < SIZE; r++) grid.push([null, null, null, null]);
    tileLayer.textContent = '';
    score = 0;
    won = false;
    keepPlaying = false;
    over = false;
    overlay.hide();
  }

  function newGame() {
    reset();
    addRandom();
    addRandom();
    updateScore(0);
    save();
  }

  function save() {
    api.store.set(STATE_KEY, {
      cells: grid.map(function (row) { return row.map(function (t) { return t ? t.v : 0; }); }),
      score: score,
      won: won,
      keepPlaying: keepPlaying
    });
  }

  function restore() {
    var s = api.store.get(STATE_KEY, null);
    if (!s || !s.cells || s.cells.length !== SIZE) return false;
    reset();
    var any = false;
    s.cells.forEach(function (row, r) {
      row.forEach(function (v, c) {
        if (v) {
          createTile(v, r, c);
          any = true;
        }
      });
    });
    if (!any || !canMove()) return false;
    score = s.score || 0;
    won = !!s.won;
    keepPlaying = !!s.keepPlaying;
    updateScore(0);
    if (won && !keepPlaying) showWin();
    return true;
  }

  function updateScore(gained) {
    scoreEl.textContent = api.fmt(score);
    if (gained > 0 && api.motion()) {
      var pop = el('span', 'score-pop', '+' + gained);
      scoreEl.parentNode.appendChild(pop);
      setTimeout(function () { pop.remove(); }, 700);
    }
    api.submitScore('2048', score);
  }

  function move(dir) {
    if (over || (won && !keepPlaying)) return;
    var vec = VEC[dir];
    var rows = [0, 1, 2, 3], cols = [0, 1, 2, 3];
    if (vec[0] === 1) rows.reverse();
    if (vec[1] === 1) cols.reverse();
    moveCount++;

    var moved = false, gained = 0, topMerge = 0;
    var ms = moveMs();

    rows.forEach(function (r) {
      cols.forEach(function (c) {
        var t = grid[r][c];
        if (!t) return;
        var nr = r, nc = c;
        for (;;) {
          var tr = nr + vec[0], tc = nc + vec[1];
          if (tr < 0 || tr >= SIZE || tc < 0 || tc >= SIZE) break;
          var other = grid[tr][tc];
          if (!other) {
            nr = tr;
            nc = tc;
            continue;
          }
          if (other.v === t.v && other.mergedAt !== moveCount) {
            // Slide into the neighbour, then fold into it.
            grid[r][c] = null;
            other.v *= 2;
            other.mergedAt = moveCount;
            gained += other.v;
            topMerge = Math.max(topMerge, other.v);
            t.r = tr;
            t.c = tc;
            t.el.classList.add('is-leaving');
            place(t);
            (function (gone, target) {
              setTimeout(function () {
                gone.el.remove();
                paintTile(target);
                if (api.motion()) {
                  void target.el.offsetWidth;
                  target.el.classList.add('is-merged');
                }
              }, ms);
            })(t, other);
            moved = true;
            return;
          }
          break;
        }
        if (nr !== r || nc !== c) {
          grid[r][c] = null;
          grid[nr][nc] = t;
          t.r = nr;
          t.c = nc;
          place(t);
          moved = true;
        }
      });
    });

    if (!moved) {
      if (api.motion()) {
        board.classList.remove('is-nudge-' + dir);
        void board.offsetWidth;
        board.classList.add('is-nudge-' + dir);
      }
      return;
    }

    score += gained;
    if (topMerge) api.tone(260 + level(topMerge) * 55, 0.1, { type: 'triangle', vol: 0.06 });
    else api.tone(190, 0.04, { type: 'sine', vol: 0.025 });

    setTimeout(function () {
      addRandom();
      updateScore(gained);
      if (!won && highest() >= WIN) {
        won = true;
        showWin();
      } else if (!canMove()) {
        over = true;
        showOver();
      }
      save();
    }, ms);
  }

  function showWin() {
    api.tone(523, 0.14, { type: 'triangle' });
    api.tone(659, 0.14, { type: 'triangle', delay: 0.12 });
    api.tone(784, 0.24, { type: 'triangle', delay: 0.24 });
    api.announce('You reached Senior. Score ' + api.fmt(score) + '.');
    overlay.show({
      kicker: '2048 reached',
      title: 'You made Senior.',
      text: 'Keep merging to reach Lead, CTO and beyond, or start fresh.',
      button: 'Keep playing',
      onAction: function () {
        keepPlaying = true;
        overlay.hide();
        save();
        board.focus({ preventScroll: true });
      }
    });
  }

  function showOver() {
    api.tone(330, 0.16, { type: 'sine' });
    api.tone(247, 0.3, { type: 'sine', delay: 0.14 });
    var top = LADDER[level(highest())];
    api.announce('No moves left. Score ' + api.fmt(score) + '. Highest tile ' + top + '.');
    overlay.show({
      kicker: 'No moves left',
      title: 'You reached ' + top + '.',
      text: 'Score ' + api.fmt(score) + ' · Best ' + api.fmt(api.getBest('2048')),
      button: 'Try again',
      onAction: function () {
        newGame();
        board.focus({ preventScroll: true });
      }
    });
  }

  /* ---------------------------------------------------------------------
     Mount
     --------------------------------------------------------------------- */
  function buildLadder(list) {
    LADDER.slice(0, 11).forEach(function (name, i) {
      var li = el('li');
      li.appendChild(el('span', 'swatch lv-' + i));
      li.appendChild(el('span', 'ladder-name', name));
      li.appendChild(el('span', 'ladder-num', String(Math.pow(2, i + 1)) + (NOTES[name] ? ' · ' + NOTES[name] : '')));
      list.appendChild(li);
    });
  }

  function mount(panel, arcadeApi) {
    api = arcadeApi;
    var stage = panel.querySelector('[data-stage]');
    scoreEl = panel.querySelector('[data-score]');

    board = el('div', 'g2048');
    board.tabIndex = 0;
    board.setAttribute('data-focus', '');
    board.setAttribute('role', 'group');
    board.setAttribute('aria-label', 'Stack 2048 board. Use the arrow keys to slide tiles.');
    var cells = el('div', 'g2048-cells');
    for (var i = 0; i < SIZE * SIZE; i++) cells.appendChild(el('div', 'g2048-cell'));
    tileLayer = el('div', 'g2048-tiles');
    board.appendChild(cells);
    board.appendChild(tileLayer);
    stage.appendChild(board);
    overlay = api.makeOverlay(board);

    buildLadder(panel.querySelector('[data-ladder]'));
    panel.querySelector('[data-action="new"]').addEventListener('click', function () {
      newGame();
      board.focus({ preventScroll: true });
    });

    // Swipe on the board.
    var start = null;
    board.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.stage-overlay')) return;
      start = { x: e.clientX, y: e.clientY };
    });
    board.addEventListener('pointerup', function (e) {
      if (!start) return;
      var dx = e.clientX - start.x, dy = e.clientY - start.y;
      start = null;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
      if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 'right' : 'left');
      else move(dy > 0 ? 'down' : 'up');
    });
    board.addEventListener('pointercancel', function () { start = null; });

    if (!restore()) newGame();
  }

  Arcade.register('2048', {
    mount: mount,
    onKey: function (e) {
      var dir = KEYS[e.key];
      if (dir) {
        move(dir);
        return true;
      }
      if ((e.key === 'Enter' || e.key === ' ') && overlay.visible) {
        overlay.trigger();
        return true;
      }
      return false;
    }
  });
})();
