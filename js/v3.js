/**
 * Portfolio v3 — "Built in Dhaka"
 * Canvas globe (flag-styled: red disc, green land dots), client-location tour,
 * project drawer and page interactions. Vanilla JS, no dependencies.
 *
 * Land dots: Natural Earth 110m land (public domain), sampled on a 1.6° grid and
 * run-length encoded. Format: "<lat0>,<step>|<cells>:<sea>.<land>.<sea>..." per
 * latitude row, numbers in base 36.
 */
(function () {
  'use strict';

  /* ------------------------------------------------------------------------
     Geometry helpers
     ------------------------------------------------------------------------ */
  var LAND = '-56,1.6|3i:3i|3n:13.2.2i|3s:14.1.2n|3x:15.2.2q|42:16.4.1j.1.18|47:18.4.2v|4b:19.3.2u.1.4|4g:1b.4.2v.2.4|4k:1d.3.2o.1.b.1.3|4o:1d.5.2q.1.b.1.3|4s:1f.5.36.1.1|4w:1g.7.2s.1.d.2.1|50:1h.9.2q.5.c.1.2|54:1j.8.2s.6.b.1.3|57:1k.a.11.4.1a.5.6.8.f|5b:1m.a.11.6.1a.6.3.b.e|5e:1m.c.10.8.19.k.f|5h:1n.d.10.8.19.m.e|5k:1p.c.z.a.19.m.f|5n:1q.c.10.a.1a.m.f|5q:1r.e.y.c.5.2.12.m.g|5s:1r.h.w.d.4.3.12.l.h|5u:1s.h.w.c.6.2.14.j.9.1.8|5w:1t.i.u.e.5.3.17.f.j|5y:1t.j.u.f.4.3.18.e.i.1.1|60:1s.l.u.h.3.3.19.7.3.2.l|62:1r.m.v.i.4.1.1a.1.1.4.4.2.l|63:1r.n.v.h.5.1.1d.4.3.1.m|65:1r.p.v.g.2e|66:1r.q.u.h.1c.1.2.1.e.1.6.1.c|67:1q.s.u.g.18.3.e.4.1.1.k|68:1q.s.u.g.16.1.g.1.2.6.4.1.f|68:1p.s.u.h.14.2.8.1.1.1.8.6.3.1.h|69:1q.q.v.j.12.3.3.3.2.2.2.3.1.7.5.1.h|69:1q.m.y.l.10.3.3.4.2.2.6.1.t|69:1q.j.11.l.10.2.4.5.1.1.4.1.w|69:1r.i.11.n.x.2.1.1.3.5.6.1.w|69:1s.h.12.n.v.2.1.1.6.3.13|68:1s.g.q.2.7.r.t.2.2.1.7.3.12|68:1s.c.t.12.j.1.b.1.9.1.4.2.x|67:1p.1.1.c.s.13.j.1.b.1.d.3.x|66:1m.2.4.9.t.14.g.3.f.1.b.1.x|65:1m.1.6.1.1.1.x.10.3.2.f.3.b.1.2.3.8.1.1.1.x|63:1k.3.14.12.i.3.b.1.1.5.17|62:1h.6.14.z.1.4.f.4.a.7.7.1.z|60:1d.2.1.3.17.y.2.5.d.5.a.6.7.1.z|5y:1b.8.16.x.2.8.b.5.7.7.9.1.y|5w:e.1.t.5.3.2.9.2.v.w.2.a.9.7.5.7.2.1.15|5u:17.5.4.2.5.2.y.w.1.b.7.a.3.8.2.1.14|5s:17.4.8.1.1.2.10.u.2.c.5.c.1.d.12|5q:16.5.b.1.z.t.2.b.6.s.2.1.x|5n:12.1.1.7.1a.s.1.9.4.y.y|5k:10.2.1.7.8.1.12.q.1.7.2.12.x|5h:11.9.7.1.13.n.2.7.1.13.w|5e:y.1.1.h.13.1y.w|5b:x.k.11.e.2.2.6.1a.v|57:w.l.10.a.d.18.5.2.o|54:u.n.10.9.6.1.5.17.4.1.2.4.k|50:t.n.z.2.3.3.2.1.6.1b.2.2.3.2.k|4w:s.n.w.5.a.2.1.b.2.w.3.2.5.1.j|4s:r.o.v.4.4.1.2.1.1.2.2.b.1.w.1.3.6.1.i|4o:q.p.t.5.5.1.2.4.2.2.2.4.2.10.4.1.i|4k:p.p.s.6.3.1.2.5.5.4.1.12.3.2.g|4g:p.p.1.1.r.6.2.6.2.1.1.4.2.12.j|4b:o.r.q.g.1.5.1.11.i|47:n.n.1.1.3.2.l.1o.h|42:n.n.1.1.1.1.n.1l.1.1.e|3x:k.t.k.2.1.1j.e|3s:j.i.1.9.i.3.2.1f.6.1.8|3n:i.i.1.8.h.1.1.1.6.18.7.2.7|3i:7.1.9.f.4.6.j.1.4.2.2.15.6.3.6|3d:7.1.8.d.6.5.j.1.4.2.3.12.6.2.6|37:6.2.5.e.6.2.1.1.m.4.2.12.3.1.2.1.5|32:4.m.5.3.7.1.f.3.2.15.2.2.3|2w:4.l.7.1.5.2.e.3.1.19.1|2r:5.k.1.1.2.3.3.3.5.2.7.3.1.17|2l:2.1c.2.1.3.1.10|2f:1.1a.6.1.x|29:0.18.5.5.1.1.p|23:4.2.8.2.1.1.1.4.3.6.a.2.7.k.4|1y:b.5.1.3.4.6.f.1.2.c.2.2.6|1s:a.1.3.3.5.6.i.7.b|1l:a.2.1.3.3.6.c.1.5.3.4.1.6|1f:8.1.4.1.1.8.h.1.a|19:9.2.1.8.4.1.a.1.9|13:9.9.3.1.h|x:8.2.1.3.j';

  var DEG = Math.PI / 180;
  var TAU = Math.PI * 2;
  var DHAKA = { lat: 23.81, lon: 90.41 };

  // Canvas colours come from the active theme's CSS custom properties
  // (--globe-*, --horizon-*, --red in css/v3.css) and are re-read on theme change.
  var PAL = {};
  var GLOBES = [];

  function rgba(triple, a) {
    return 'rgba(' + triple + ', ' + a + ')';
  }

  function readPalette() {
    var cs = getComputedStyle(document.documentElement);
    function v(name) { return cs.getPropertyValue(name).trim(); }
    function alphas(name) { return v(name).split(',').map(parseFloat); }
    var dot = v('--globe-dot'), hzDot = v('--horizon-dot'), ink = v('--globe-ink');
    PAL = {
      discHi: v('--globe-disc-hi'),
      discMid: v('--globe-disc-mid'),
      discLo: v('--globe-disc-lo'),
      glow: v('--globe-glow'),
      discDots: alphas('--globe-dot-alpha').map(function (a) { return rgba(dot, a); }),
      arc: v('--globe-arc'),
      ink: ink,
      inkSolid: 'rgb(' + ink + ')',
      red: v('--red'),
      labelBg: v('--globe-label-bg'),
      labelText: v('--globe-label-text'),
      hzTop: v('--horizon-top'),
      hzBottom: v('--horizon-bottom'),
      horizonDots: alphas('--horizon-dot-alpha').map(function (a) { return rgba(hzDot, a); }),
      hzRim: v('--horizon-rim'),
      hzHalo: v('--horizon-halo')
    };
  }

  function vec(lat, lon) {
    var p = lat * DEG, l = lon * DEG;
    return [Math.cos(p) * Math.sin(l), Math.sin(p), Math.cos(p) * Math.cos(l)];
  }

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  function wrapLon(lon) {
    return ((((lon + 180) % 360) + 360) % 360) - 180;
  }

  function easeInOut(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function easeOut(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function angleBetween(a, b) {
    var va = vec(a.lat, a.lon), vb = vec(b.lat, b.lon);
    return Math.acos(clamp(va[0] * vb[0] + va[1] * vb[1] + va[2] * vb[2], -1, 1));
  }

  function decodeLand(str) {
    var rows = str.split('|');
    var head = rows[0].split(',');
    var lat0 = parseFloat(head[0]), step = parseFloat(head[1]);
    var out = [];
    for (var r = 1; r < rows.length; r++) {
      var lat = lat0 + (r - 1) * step;
      var parts = rows[r].split(':');
      var cells = parseInt(parts[0], 36);
      var runs = parts[1].split('.');
      var j = 0, land = false;
      for (var k = 0; k < runs.length; k++) {
        var len = parseInt(runs[k], 36);
        if (land) {
          for (var c = j; c < j + len; c++) {
            var v = vec(lat, -180 + ((c + 0.5) * 360) / cells);
            out.push(v[0], v[1], v[2]);
          }
        }
        j += len;
        land = !land;
      }
    }
    return new Float32Array(out);
  }

  var LAND_DOTS = decodeLand(LAND);
  var DOT_COUNT = LAND_DOTS.length / 3;

  // Where the view should sit to frame an arc from Dhaka to `to`.
  function viewFor(to) {
    if (!to) return { lon: DHAKA.lon, lat: 20 };
    var a = vec(DHAKA.lat, DHAKA.lon), b = vec(to.lat, to.lon);
    var m = [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
    var len = Math.sqrt(m[0] * m[0] + m[1] * m[1] + m[2] * m[2]) || 1;
    return {
      lon: Math.atan2(m[0], m[2]) / DEG,
      lat: clamp(Math.asin(m[1] / len) / DEG, -20, 56)
    };
  }

  function makeArc(from, to, t0, dur) {
    var a = vec(from.lat, from.lon), b = vec(to.lat, to.lon);
    var omega = Math.acos(clamp(a[0] * b[0] + a[1] * b[1] + a[2] * b[2], -1, 1));
    return { a: a, b: b, omega: omega, h: 0.06 + 0.36 * (omega / Math.PI), t0: t0, dur: dur, seed: Math.random() };
  }

  var motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  function motionOK() {
    return !(motionQuery && motionQuery.matches);
  }

  /* ------------------------------------------------------------------------
     Shared animation loop
     ------------------------------------------------------------------------ */
  var loopers = [];
  var rafId = 0;

  function loop(now) {
    rafId = 0;
    for (var i = 0; i < loopers.length; i++) loopers[i](now);
    if (loopers.length) rafId = requestAnimationFrame(loop);
  }

  function startLoop(fn) {
    if (loopers.indexOf(fn) === -1) loopers.push(fn);
    if (!rafId) rafId = requestAnimationFrame(loop);
  }

  function stopLoop(fn) {
    var i = loopers.indexOf(fn);
    if (i !== -1) loopers.splice(i, 1);
  }

  /* ------------------------------------------------------------------------
     Globe renderer
     style 'disc'    — the hero globe: shaded sphere, land dots, arcs from Dhaka
                       (a red "flag sun" pin), destination pins and labels
     style 'horizon' — a slice of planet edge for project cards, with one red pin
     ------------------------------------------------------------------------ */
  function Globe(canvas, opts) {
    opts = opts || {};
    GLOBES.push(this);
    this.lastNow = 0;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.style = opts.style || 'disc';
    this.fill = opts.fill || 0.36;
    this.labels = !!opts.labels;
    this.dotScale = opts.dotScale || 1;
    this.labelInset = opts.labelInset || 0;
    this.motion = motionOK();
    this.view = { lon: DHAKA.lon, lat: 20 };
    this.anim = null;
    this.spin = 0;
    this.arcs = [];
    this.pins = [];
    this.activeArc = null;
    this.focus = null;
    this.burst = 0;
    this.showHome = this.style === 'disc';
    this.bodyAlpha = 1;
    this.homeV = vec(DHAKA.lat, DHAKA.lon);
    this.homeLabel = {};
    this.sx = new Float32Array(DOT_COUNT);
    this.sy = new Float32Array(DOT_COUNT);
    this.sz = new Float32Array(DOT_COUNT);
    this.tmp = [0, 0, 0, 0];
    this.last = 0;
    this.w = this.h = 0;
    this.resize();
  }

  Globe.prototype.resize = function () {
    var rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = rect.width;
    this.h = rect.height;
    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (this.style === 'horizon') {
      this.R = Math.max(this.w * 0.62, this.h * 1.2);
      this.cx = this.w / 2;
      this.cy = this.h * 0.3 + this.R;
    } else {
      this.R = Math.min(this.w, this.h) * this.fill;
      this.cx = this.w / 2;
      this.cy = this.h / 2;
    }
    return true;
  };

  Globe.prototype.animateTo = function (lon, lat, dur, now) {
    if (!dur) {
      this.view.lon = lon;
      this.view.lat = lat;
      this.anim = null;
      return;
    }
    var dLon = wrapLon(lon - this.view.lon);
    this.anim = { lon0: this.view.lon, lat0: this.view.lat, dLon: dLon, dLat: lat - this.view.lat, t0: now, dur: dur };
  };

  Globe.prototype.frame = function (now) {
    var dt = this.last ? Math.min(64, now - this.last) : 16;
    this.last = now;
    if (this.anim) {
      var a = this.anim;
      var k = clamp((now - a.t0) / a.dur, 0, 1);
      var e = easeInOut(k);
      this.view.lon = a.lon0 + a.dLon * e;
      this.view.lat = a.lat0 + a.dLat * e;
      if (k >= 1) this.anim = null;
    } else if (this.spin) {
      this.view.lon += this.spin * dt;
    }
    this.view.lon = wrapLon(this.view.lon);
    this.render(now);
  };

  Globe.prototype.setRotation = function () {
    var l = this.view.lon * DEG, p = this.view.lat * DEG;
    this.cl = Math.cos(l);
    this.sl = Math.sin(l);
    this.cp = Math.cos(p);
    this.sp = Math.sin(p);
  };

  // Rotates a world-space point into view space and projects it.
  // out = [screenX, screenY, depth (z toward viewer), squared radial distance in R units]
  Globe.prototype.project = function (x, y, z, out) {
    var x1 = x * this.cl - z * this.sl;
    var z1 = x * this.sl + z * this.cl;
    var y2 = y * this.cp - z1 * this.sp;
    var z2 = y * this.sp + z1 * this.cp;
    out[0] = this.cx + this.R * x1;
    out[1] = this.cy - this.R * y2;
    out[2] = z2;
    out[3] = x1 * x1 + y2 * y2;
    return out;
  };

  // bodyAlpha fades this globe out (labels included) while another look from
  // js/v3-globe-looks.js takes over the drawing.
  Globe.prototype.render = function (now) {
    if (!this.w) return;
    this.lastNow = now;
    var ctx = this.ctx, a = this.bodyAlpha == null ? 1 : this.bodyAlpha, labels;
    ctx.clearRect(0, 0, this.w, this.h);
    this.setRotation();
    if (a >= 0.999) {
      labels = this.drawBody(now);
    } else if (a > 0.001) {
      var off = this.offscreen();
      off.clearRect(0, 0, this.w, this.h);
      this.ctx = off;
      labels = this.drawBody(now);
      this.ctx = ctx;
      ctx.globalAlpha = a;
      ctx.drawImage(off.canvas, 0, 0, this.w, this.h);
      ctx.globalAlpha = 1;
    } else {
      return;
    }
    if (labels.length) this.drawLabels(labels, a);
  };

  Globe.prototype.drawBody = function (now) {
    if (this.style === 'disc') this.drawDisc();
    else this.drawHorizon();
    this.drawDots();
    for (var i = 0; i < this.arcs.length; i++) this.drawArc(this.arcs[i], now);
    return this.drawPins(now);
  };

  Globe.prototype.offscreen = function () {
    var c = this.off && this.off.canvas;
    if (!c) {
      c = document.createElement('canvas');
      this.off = c.getContext('2d');
    }
    if (c.width !== this.canvas.width || c.height !== this.canvas.height) {
      c.width = this.canvas.width;
      c.height = this.canvas.height;
    }
    this.off.setTransform(this.canvas.width / this.w, 0, 0, this.canvas.height / this.h, 0, 0);
    return this.off;
  };

  Globe.prototype.drawDisc = function () {
    var ctx = this.ctx, R = this.R, cx = this.cx, cy = this.cy;

    var glow = ctx.createRadialGradient(cx, cy, R * 0.92, cx, cy, R * 1.32);
    glow.addColorStop(0, rgba(PAL.glow, 0.14));
    glow.addColorStop(1, rgba(PAL.glow, 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.32, 0, TAU);
    ctx.fill();

    var body = ctx.createRadialGradient(cx - R * 0.36, cy - R * 0.42, R * 0.04, cx, cy, R * 1.02);
    body.addColorStop(0, PAL.discHi);
    body.addColorStop(0.5, PAL.discMid);
    body.addColorStop(1, PAL.discLo);
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(PAL.ink, 0.08);
    ctx.lineWidth = 1;
    ctx.stroke();
  };

  Globe.prototype.drawHorizon = function () {
    var ctx = this.ctx, R = this.R, cx = this.cx, cy = this.cy;
    var top = cy - R;

    var halo = ctx.createRadialGradient(cx, cy, R * 0.98, cx, cy, R * 1.12);
    halo.addColorStop(0, rgba(PAL.hzHalo, 0.16));
    halo.addColorStop(1, rgba(PAL.hzHalo, 0));
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.12, 0, TAU);
    ctx.fill();

    var body = ctx.createLinearGradient(0, top, 0, top + this.h);
    body.addColorStop(0, PAL.hzTop);
    body.addColorStop(1, PAL.hzBottom);
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = PAL.hzRim;
    ctx.lineWidth = 1;
    ctx.stroke();
  };

  Globe.prototype.drawDots = function () {
    var d = LAND_DOTS, n = DOT_COUNT;
    var R = this.R, cx = this.cx, cy = this.cy;
    var cl = this.cl, sl = this.sl, cp = this.cp, sp = this.sp;
    var sx = this.sx, sy = this.sy, sz = this.sz;
    var i, j;

    for (i = 0, j = 0; i < n; i++, j += 3) {
      var x = d[j], y = d[j + 1], z = d[j + 2];
      var x1 = x * cl - z * sl;
      var z1 = x * sl + z * cl;
      sx[i] = cx + R * x1;
      sy[i] = cy - R * (y * cp - z1 * sp);
      sz[i] = y * sp + z1 * cp;
    }

    var ctx = this.ctx;
    var base = R * 0.0098 * this.dotScale;
    var fills = this.style === 'disc' ? PAL.discDots : PAL.horizonDots;
    for (var b = 0; b < 3; b++) {
      var lo = b / 3, hi = (b + 1) / 3;
      ctx.beginPath();
      for (i = 0; i < n; i++) {
        var depth = sz[i];
        if (depth <= lo || depth > hi) continue;
        var r = base * (0.45 + 0.55 * depth);
        ctx.moveTo(sx[i] + r, sy[i]);
        ctx.arc(sx[i], sy[i], r, 0, TAU);
      }
      ctx.fillStyle = fills[b];
      ctx.fill();
    }
  };

  Globe.prototype.arcPoint = function (arc, t, out) {
    var w = arc.omega, s = Math.sin(w);
    var k0 = s > 1e-4 ? Math.sin((1 - t) * w) / s : 1 - t;
    var k1 = s > 1e-4 ? Math.sin(t * w) / s : t;
    var alt = 1 + arc.h * Math.sin(Math.PI * t);
    return this.project(
      (k0 * arc.a[0] + k1 * arc.b[0]) * alt,
      (k0 * arc.a[1] + k1 * arc.b[1]) * alt,
      (k0 * arc.a[2] + k1 * arc.b[2]) * alt,
      out
    );
  };

  // A point is visible when it faces the viewer or floats outside the disc silhouette.
  function visible(p) {
    return p[2] > 0 || p[3] > 1;
  }

  Globe.prototype.strokeSpan = function (arc, t0, t1) {
    var ctx = this.ctx, p = this.tmp;
    var steps = Math.max(2, Math.ceil((t1 - t0) * 80));
    var pen = false;
    ctx.beginPath();
    for (var i = 0; i <= steps; i++) {
      this.arcPoint(arc, t0 + ((t1 - t0) * i) / steps, p);
      if (visible(p)) {
        if (pen) ctx.lineTo(p[0], p[1]);
        else {
          ctx.moveTo(p[0], p[1]);
          pen = true;
        }
      } else {
        pen = false;
      }
    }
    ctx.stroke();
  };

  Globe.prototype.dotAt = function (arc, t, r, color) {
    var p = this.arcPoint(arc, t, this.tmp);
    if (!visible(p)) return;
    var ctx = this.ctx;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p[0], p[1], r, 0, TAU);
    ctx.fill();
  };

  Globe.prototype.drawArc = function (arc, now) {
    if (now < arc.t0) return;
    var ctx = this.ctx;
    var p = this.motion ? clamp((now - arc.t0) / arc.dur, 0, 1) : 1;
    var active = arc === this.activeArc;
    ctx.lineCap = 'round';

    if (p < 1) {
      var e = easeOut(p);
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = rgba(PAL.arc, 0.3);
      this.strokeSpan(arc, 0, e);
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = rgba(PAL.arc, 0.95);
      this.strokeSpan(arc, Math.max(0, e - 0.22), e);
      this.dotAt(arc, e, 3.2, PAL.red);
      return;
    }

    ctx.lineWidth = active ? 1.8 : 1.1;
    ctx.strokeStyle = active ? rgba(PAL.arc, 0.85) : rgba(PAL.arc, 0.34);
    this.strokeSpan(arc, 0, 1);

    // When a stop becomes active, a bright pulse sweeps along its arc once —
    // the line itself stays, so the whole network is always visible.
    if (this.motion && arc.hl && now >= arc.hl && now - arc.hl < arc.dur) {
      var h = easeOut((now - arc.hl) / arc.dur);
      ctx.lineWidth = 2.4;
      ctx.strokeStyle = rgba(PAL.arc, 1);
      this.strokeSpan(arc, Math.max(0, h - 0.22), h);
      this.dotAt(arc, h, 3.2, PAL.red);
    }

    if (this.motion) {
      var travel = (now - arc.t0 - arc.dur) / 2600;
      for (var k = 0; k < 2; k++) {
        var q = (((travel + arc.seed + k * 0.5) % 1) + 1) % 1;
        this.dotAt(arc, q, active ? 2.4 : 1.7, active ? PAL.red : rgba(PAL.ink, 0.5));
      }
    }
  };

  Globe.prototype.drawRing = function (x, y, r, color, alpha, width) {
    if (alpha <= 0) return;
    var ctx = this.ctx;
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = width || 1.2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = 1;
  };

  Globe.prototype.drawPins = function (now) {
    var ctx = this.ctx, p = this.tmp;
    var labels = [];
    var i, k;

    for (i = 0; i < this.pins.length; i++) {
      var pin = this.pins[i];
      if (now < pin.t0) continue;
      this.project(pin.v[0], pin.v[1], pin.v[2], p);
      if (p[2] <= 0.02) continue;
      var x = p[0], y = p[1];

      if (this.style === 'horizon') {
        this.drawRing(x, y, 10, PAL.red, 0.5, 1.2);
        ctx.fillStyle = PAL.red;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, TAU);
        ctx.fill();
        continue;
      }

      if (this.motion) {
        // Ping when the pin first lands, and again when its stop is highlighted.
        k = (now - (pin.ping && now >= pin.ping ? pin.ping : pin.t0)) / 1400;
        if (k >= 0 && k < 1) this.drawRing(x, y, 3 + Math.min(24, this.R * 0.2) * easeOut(k), PAL.inkSolid, 1 - k, 1.4);
      }
      ctx.fillStyle = PAL.inkSolid;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, TAU);
      ctx.fill();
      if (this.labels && pin.label) {
        labels.push({ src: pin, x: x, y: y, title: pin.label, sub: pin.sub, active: pin === this.focus, depth: p[2] });
      }
    }

    this.drawHome(now, labels);
    return labels;
  };

  Globe.prototype.drawHome = function (now, labels) {
    if (!this.showHome) return;
    var ctx = this.ctx, p = this.tmp, k;
    this.project(this.homeV[0], this.homeV[1], this.homeV[2], p);
    if (p[2] <= 0.02) return;
    var hx = p[0], hy = p[1];

    if (this.burst && now >= this.burst) {
      for (k = 0; k < 3; k++) {
        var ph = this.motion ? (((now - this.burst) / 2400 + k / 3) % 1) : 0.35 + k * 0.2;
        this.drawRing(hx, hy, 6 + this.R * 0.3 * ph, PAL.red, 0.7 * (1 - ph), 1.3);
      }
    }

    // Dhaka is the flag's red sun: a red dot with a soft pulse.
    var pulse = this.motion ? (now % 2000) / 2000 : 0.5;
    this.drawRing(hx, hy, 5 + 13 * pulse, PAL.red, 0.8 * (1 - pulse), 1.3);
    ctx.fillStyle = PAL.labelBg;
    ctx.beginPath();
    ctx.arc(hx, hy, 5.6, 0, TAU);
    ctx.fill();
    ctx.fillStyle = PAL.red;
    ctx.beginPath();
    ctx.arc(hx, hy, 4.2, 0, TAU);
    ctx.fill();
    if (this.labels) {
      labels.push({ src: this.homeLabel, x: hx, y: hy, title: 'Dhaka', sub: 'Home base, Bangladesh', active: !!this.burst, home: true, depth: p[2] });
    }
  };

  /* Label layout: every pin gets a chip (client + place). Chips are placed one by
     one (the highlighted stop first, then Dhaka, then the nearest pins) at the
     first candidate spot that overlaps nothing already placed. A chip keeps its
     spot from frame to frame while it still fits, so labels don't jump as the
     globe turns; when a chip has to sit away from its pin, a leader line joins them. */
  var LABEL_SPOTS = [
    [1, -1], [-1, -1], [1, 1], [-1, 1], [1, 0], [-1, 0],
    [0, -1.6], [0, 1.6], [1, -2.3], [-1, -2.3], [1, 2.3], [-1, 2.3]
  ];

  function spotRect(x, y, w, h, s) {
    var gap = 10;
    var lx = s[0] > 0 ? x + gap : s[0] < 0 ? x - w - gap : x - w / 2;
    var ly;
    if (s[1] === 0) ly = y - h / 2;
    else if (s[1] < 0) ly = y - h - 6 - (Math.abs(s[1]) - 1) * (h + 4);
    else ly = y + 6 + (Math.abs(s[1]) - 1) * (h + 4);
    return [lx, ly, w, h];
  }

  function overlapArea(a, b) {
    var ox = Math.min(a[0] + a[2], b[0] + b[2]) - Math.max(a[0], b[0]);
    var oy = Math.min(a[1] + a[3], b[1] + b[3]) - Math.max(a[1], b[1]);
    return ox > 0 && oy > 0 ? ox * oy : 0;
  }

  Globe.prototype.drawLabels = function (labels, fade) {
    var ctx = this.ctx;
    fade = fade == null ? 1 : fade;
    var compact = this.R < 175;              // phone-sized globe: one line for quiet chips
    // Keep chips inside the visible stage: the hero canvas overhangs its box
    // (labelInset is the overhang as a fraction of the canvas size).
    var inset = this.labelInset;
    var reach = this.R * 1.14;
    var minX = inset ? this.w * inset + 2 : Math.max(4, this.cx - reach);
    var maxX = inset ? this.w * (1 - inset) - 2 : Math.min(this.w - 4, this.cx + reach);
    var minY = inset ? this.h * inset + 2 : Math.max(4, this.cy - reach);
    var maxY = inset ? this.h * (1 - inset) - 2 : Math.min(this.h - 4, this.cy + reach);
    var titleFont = '500 ' + (compact ? 9 : 10) + 'px "Martian Mono", ui-monospace, monospace';
    var subFont = '400 ' + (compact ? 10 : 11) + 'px "Instrument Sans", system-ui, sans-serif';
    var all = LABEL_SPOTS.map(function (_, n) { return n; });
    var i, j, q;

    labels.sort(function (a, b) {
      if (a.active !== b.active) return a.active ? -1 : 1;
      if (!!a.home !== !!b.home) return a.home ? -1 : 1;
      return b.depth - a.depth;
    });

    // Pins are obstacles too, so a chip never hides another pin.
    var pinBoxes = labels.map(function (l) { return [l.x - 6, l.y - 6, 12, 12]; });
    // The stage's corner captions ("Dhaka 23.81°N…", "Drag to spin") stay clear.
    var chips = inset ? [[minX, minY, 185, 16], [maxX - 120, maxY - 16, 120, 16]] : [];

    for (i = 0; i < labels.length; i++) {
      var l = labels[i];
      l.two = !!l.sub && (l.active || !compact);
      l.t = l.title.toUpperCase();
      ctx.font = titleFont;
      var w = ctx.measureText(l.t).width;
      if (l.two) {
        ctx.font = subFont;
        w = Math.max(w, ctx.measureText(l.sub).width);
      }
      w = Math.ceil(w) + 18;
      var h = l.two ? (compact ? 32 : 36) : 22;

      var keep = l.src && l.src.slot != null ? l.src.slot : -1;
      var order = keep >= 0 ? [keep].concat(all.filter(function (n) { return n !== keep; })) : all;
      var best = null, bestScore = Infinity, bestSlot = 0;

      for (j = 0; j < order.length; j++) {
        var r = spotRect(l.x, l.y, w, h, LABEL_SPOTS[order[j]]);
        r[0] = clamp(r[0], minX, maxX - w);
        r[1] = clamp(r[1], minY, maxY - h);
        var score = 0;
        for (q = 0; q < pinBoxes.length; q++) if (q !== i) score += overlapArea(r, pinBoxes[q]);
        for (q = 0; q < chips.length; q++) score += overlapArea(r, chips[q]);
        if (score < bestScore) {
          best = r;
          bestScore = score;
          bestSlot = order[j];
          if (score === 0) break;
        }
      }
      if (l.src) l.src.slot = bestSlot;
      l.rect = best;
      chips.push(best);
    }

    // Leader lines first, then chips on top (highlighted chip drawn last).
    for (i = 0; i < labels.length; i++) {
      var a = labels[i], rc = a.rect;
      var nx = clamp(a.x, rc[0], rc[0] + rc[2]), ny = clamp(a.y, rc[1], rc[1] + rc[3]);
      if (Math.hypot(nx - a.x, ny - a.y) < 5) continue;
      ctx.globalAlpha = Math.min(1, (a.depth - 0.02) / 0.18) * fade;
      ctx.strokeStyle = a.active ? PAL.red : rgba(PAL.ink, 0.38);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(nx, ny);
      ctx.stroke();
    }

    for (i = labels.length - 1; i >= 0; i--) {
      var b = labels[i], rr = b.rect;
      ctx.globalAlpha = Math.min(1, (b.depth - 0.02) / 0.18) * (b.active ? 1 : 0.92) * fade;
      ctx.fillStyle = PAL.labelBg;
      ctx.strokeStyle = b.active ? PAL.red : rgba(PAL.ink, 0.16);
      ctx.lineWidth = b.active ? 1.3 : 1;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(rr[0], rr[1], rr[2], rr[3], b.two ? 10 : rr[3] / 2);
      else ctx.rect(rr[0], rr[1], rr[2], rr[3]);
      ctx.fill();
      ctx.stroke();

      ctx.textBaseline = 'middle';
      ctx.font = titleFont;
      ctx.fillStyle = PAL.labelText;
      if (b.two) {
        ctx.fillText(b.t, rr[0] + 9, rr[1] + rr[3] * 0.33);
        ctx.font = subFont;
        ctx.fillStyle = rgba(PAL.ink, 0.72);
        ctx.fillText(b.sub, rr[0] + 9, rr[1] + rr[3] * 0.7);
      } else {
        ctx.fillText(b.t, rr[0] + 9, rr[1] + rr[3] / 2 + 0.5);
      }
    }
    ctx.globalAlpha = 1;
  };

  /* ------------------------------------------------------------------------
     Projects
     ------------------------------------------------------------------------ */
  var BANGLADESH = { label: 'Bangladesh', lat: 23.7, lon: 90.4 };

  var PROJECTS = {
    'western-digital': {
      client: 'Western Digital',
      title: 'CIO Management Application',
      org: 'Bizzntek Ltd. · client via Altios',
      role: 'Senior Software Engineer',
      status: 'In progress',
      where: { label: 'USA', lat: 37.34, lon: -121.89 },
      desc: 'Engineering the CIO Management Application for Western Digital, a Fortune 500 leader in data storage, as an enterprise client engagement through Altios: governance tools for IT leadership, resource monitoring, automated data aggregation, and secure APIs connecting Western Digital\'s enterprise systems.',
      highlights: [
        'Building the core application that gives IT leadership a view of enterprise infrastructure, budget allocation and operational health.',
        'Architecting high-throughput, fault-tolerant backend modules with strict transaction consistency.',
        'Built secure API interfaces and automated aggregation pipelines across internal enterprise systems.',
        'Refactored critical queries and services for sub-second response times.'
      ],
      stack: ['C#', 'ASP.NET Core', 'MS SQL Server', 'Enterprise system integration', 'High-volume data processing']
    },
    'altios-goglobal': {
      client: 'GoGlobal',
      title: 'First-version management platform',
      org: 'Bizzntek Ltd. · client via Altios',
      role: 'Senior Software Engineer',
      status: 'Delivered',
      where: null,
      whereLabel: 'Worldwide — Employer of Record across many jurisdictions',
      desc: 'Architected and built the first version of the management platform for GoGlobal, an international Employer of Record (EOR) and global expansion provider, in partnership with Altios. It supports market entry, entity setup, cross-border compliance tracking and ERP data harmonization for companies hiring worldwide.',
      highlights: [
        'Built the foundational platform behind global Employer of Record workflows across jurisdictions.',
        'Designed scalable backend APIs and business logic for multi-country compliance and entity onboarding.',
        'Engineered ERP synchronization between Microsoft Business Central and web services.',
        'Worked directly with international stakeholders on cross-border data security and localization.'
      ],
      stack: ['C#', 'ASP.NET Core', 'Dynamics 365 Business Central', 'AL', 'REST APIs', 'MS SQL Server']
    },
    'bc-localization': {
      client: 'Microsoft',
      title: 'Business Central localization for Bangladesh',
      org: 'Bizzntek Ltd.',
      role: 'Lead extension developer',
      status: 'Delivered',
      where: { label: 'USA (client) · built for the Bangladesh market', lat: 47.67, lon: -122.12 },
      desc: 'Preparing Microsoft Dynamics 365 Business Central for the Bangladesh market: custom AL extensions that follow National Board of Revenue (NBR) tax protocols, fiscal law, VAT withholding and statutory audit reporting.',
      highlights: [
        'Wrote Business Central extensions in AL to meet Bangladesh Government and NBR fiscal requirements.',
        'Designed RDLC reports for tax withholding, VAT summaries and statutory audit registers.',
        'Worked with domain architects and fiscal advisors to keep every rule compliant.'
      ],
      stack: ['AL', 'Dynamics 365 Business Central', 'RDLC reports', 'NBR fiscal standards', 'VAT & tax accounting']
    },
    'piramids': {
      client: 'PIRAMIDS',
      title: 'Real estate portfolio management suite',
      org: 'Bizzntek Ltd.',
      role: 'Full-stack ERP developer',
      status: 'Live',
      url: 'https://piramids.com/',
      where: { label: 'Woodland Hills, California, USA · 34.17°N 118.61°W', lat: 34.17, lon: -118.61 },
      desc: 'Real estate portfolio management software for US owners and operators. Property and rental management, hospitality and financial reporting run in one system: units and leases, tenant onboarding, online rent payments, room bookings, guest billing and the ledgers behind them.',
      highlights: [
        'Built tenant onboarding, unit lease tracking and scheduled rent invoicing.',
        'Integrated third-party payment gateways so tenants can pay rent online.',
        'Built hospitality operations: room allocation with live status, housekeeping schedules and unified guest billing.',
        'Developed ledger reporting for income, expenses and security deposits, plus occupancy and revenue dashboards.'
      ],
      stack: ['C#', 'ASP.NET MVC', 'MS Business Central', 'Payment gateways', 'REST APIs', 'jQuery', 'Bootstrap 4', 'MS SQL Server']
    },
    'factory-mgmt': {
      client: 'MH Golden Jute Ltd.',
      title: 'Factory Management ERP',
      org: 'SmartSoft Technology',
      role: 'Full-stack engineer',
      status: 'Delivered',
      where: BANGLADESH,
      desc: 'Industrial ERP for a jute manufacturer: raw material intake, multi-stage production workflows, warehouse inventory and automated financial accounting.',
      highlights: [
        'Built modules for raw jute batch processing, weight logs and production tracking.',
        'Wrote optimized stored procedures for ledger calculation and inventory reconciliation.',
        'Designed reporting dashboards for plant supervisors and accountants.'
      ],
      stack: ['C#', 'ASP.NET Web Forms', 'MS SQL Server', 'T-SQL stored procedures', 'jQuery']
    },
    'task-mgmt': {
      client: 'MH Golden Jute Ltd.',
      title: 'Task & workflow management',
      org: 'SmartSoft Technology',
      role: 'Full-stack engineer',
      status: 'Delivered',
      where: BANGLADESH,
      desc: 'Internal platform for assigning work across departments, updating status, tracking milestones and reporting on progress.',
      highlights: [
        'Built role-based task delegation with a Pending → In progress → Review → Completed pipeline.',
        'Added deadline tracking and notifications for department staff.',
        'Built exportable progress and performance reports.'
      ],
      stack: ['C#', 'ASP.NET Web Forms', 'MS SQL Server', 'jQuery', 'Role-based access control']
    },
    'smart-sell': {
      client: 'Kushtia Tech',
      title: 'Smart Sell — POS & inventory ledger',
      org: 'SmartSoft Technology',
      role: 'Full-stack engineer',
      status: 'Delivered',
      where: BANGLADESH,
      desc: 'Point-of-sale and field-sales software: reps take orders on the road, stock is tracked across warehouses, and admins see the ledger.',
      highlights: [
        'Built the sales-rep portal for order taking and dispatch logs.',
        'Built warehouse inventory tracking with replenishment triggers.',
        'Built double-entry financial and customer billing ledgers.'
      ],
      stack: ['C#', 'ASP.NET Web Forms', 'MS SQL Server', 'jQuery']
    },
    'garments-hr': {
      client: 'FnF Fashion BD',
      title: 'Garments HR & biometric payroll',
      org: 'GTRBD Ltd.',
      role: 'Software engineer',
      status: 'Delivered',
      where: BANGLADESH,
      desc: 'HR and payroll for a garment manufacturer, integrated with ZKT fingerprint devices to ingest punch data, record shifts and calculate monthly salaries.',
      highlights: [
        'Connected ZKT biometric punch hardware to the attendance database.',
        'Built the calculation engine for overtime, late arrivals, absences and festival bonuses.',
        'Automated monthly payroll and pay-slip printing for hundreds of workers.'
      ],
      stack: ['C#', 'ASP.NET MVC 5', 'MS SQL Server', 'ZKT device SDK', 'jQuery', 'Bootstrap 3']
    },
    // personal
    'mapcars': {
      client: 'MapCars Ltd',
      title: 'MapCars UK — ride-hailing apps',
      org: 'Independent project',
      role: 'Full-stack & mobile developer',
      status: 'Live',
      url: 'https://mapcars.uk/',
      where: { label: 'Chichester, UK · 50.84°N 0.78°W', lat: 50.84, lon: -0.78 },
      desc: 'Passenger mobility for England\'s South Coast — Southampton, Portsmouth, Chichester, Brighton and Worthing. Passenger and driver apps with real-time dispatch, upfront fares and cloud-hosted infrastructure.',
      highlights: [
        'Built cross-platform apps in Flutter and published them on Google Play and the Apple App Store.',
        'Integrated Firebase real-time data, Authentication and Cloud Messaging for ride matching and push notifications.',
        'Configured Google Cloud VMs for backend API hosting and persistence.',
        'Built the driver registration portal with commission calculation and credential checks.'
      ],
      stack: ['Flutter (Android & iOS)', 'Firebase Auth & FCM', 'Google Cloud VMs', 'Next.js', 'Google Play', 'App Store']
    },
    'motorshut': {
      client: 'Motors Hut Ltd',
      title: 'Motorshut — used-car marketplace',
      org: 'Independent project',
      role: 'Full-stack web architect',
      status: 'Live',
      url: 'https://motorshut.com/',
      where: { label: 'Rainham, Essex, UK · 51.52°N 0.19°E', lat: 51.52, lon: 0.19 },
      desc: 'Online dealership and verified vehicle marketplace: inspection histories, MOT verification, service records, vehicle filtering and consultation booking.',
      highlights: [
        'Built the vehicle catalog with image galleries and detailed specifications.',
        'Set up hosting on AWS and Google Cloud VMs with backups and SSL/TLS.',
        'Built the SEO architecture with AutoDealer Schema.org JSON-LD.',
        'Built buyer inquiry flows, WhatsApp contact and test-drive scheduling.'
      ],
      stack: ['AWS (EC2 & S3)', 'Google Cloud VMs', 'Schema.org JSON-LD', 'Vehicle filtering', 'Lead pipeline']
    },
    'vetmartbd': {
      client: 'VetMart Bangladesh',
      title: 'VetMart BD — veterinary e-commerce',
      org: 'Independent project',
      role: 'Full-stack e-commerce developer',
      status: 'Live',
      url: 'https://vetmartbd.vercel.app/',
      where: { label: 'Bangladesh · nationwide', lat: 23.7, lon: 90.4 },
      desc: 'Agro-veterinary marketplace for livestock farm owners, vets and cattle and poultry breeders, making verified medicines, feed supplements and farm supplies easier to source.',
      highlights: [
        'Built the catalog with search and species filters (cattle, poultry, dairy, fish).',
        'Implemented Bengali and English throughout for farm managers and vets.',
        'Deployed on Vercel with edge caching.'
      ],
      stack: ['Next.js', 'React', 'Tailwind CSS', 'PostgreSQL / Prisma', 'Vercel']
    },
    'aykorgpt': {
      client: 'AykorGPT',
      title: 'AykorGPT — AI tax & legal advisor',
      org: 'Independent project',
      role: 'Full-stack AI & LegalTech developer',
      status: 'Live',
      url: 'https://aykorgpt.vercel.app/',
      where: { label: 'Bangladesh', lat: 23.7, lon: 90.4 },
      desc: 'AI advisor for Bangladesh taxation and law, answering only from cited sources: the Income Tax Act 2023, VAT Act 2012, Customs Act 2023 and 50,000+ NBR statutory regulatory orders and gazettes.',
      highlights: [
        'Built sub-second (< 0.5 s) citation retrieval across tax clauses and NBR circulars.',
        'Built a progressive tax calculator for individual and corporate slabs, FY 2026-27.',
        'Covered allowable deductions, investment rebates, Mushak 9.1 VAT returns and the TDS Section 52 series.',
        'Built the chat interface with citation export, PDF memos and SRO verification.'
      ],
      stack: ['Next.js 15', 'React', 'Tailwind CSS', 'AI citation engine', 'Vercel serverless']
    },
    'cumilla-resort': {
      client: 'Cumilla Resort',
      title: 'Cumilla Resort — heritage hospitality',
      org: 'Independent project',
      role: 'Front-end & UI engineer',
      status: 'Live',
      url: 'https://resortmahfuz.netlify.app/',
      where: { label: 'Kotbari, Cumilla · 23.43°N 91.13°E', lat: 23.43, lon: 91.13 },
      desc: 'Booking site for an eco-heritage resort on 45 acres of the Lalmai Hills, near the archaeological ruins of Shalban Vihara in Kotbari, Cumilla.',
      highlights: [
        'Built the booking bar with villa availability, guest counts and date ranges.',
        'Implemented English and Bengali with a persistent language toggle.',
        'Built the media showcase: video background, villa gallery and heritage tours (Mainamati ruins, Lalmai trek).',
        'Deployed on Netlify with edge rendering and Supabase media delivery.'
      ],
      stack: ['Next.js (App Router)', 'React', 'Tailwind CSS', 'Supabase', 'Netlify Edge']
    }
    // /personal
  };

  // Hero tour: one stop per client region, in order of significance.
  var STOPS = [
    { project: 'western-digital', to: { lat: 37.34, lon: -121.89 }, tag: 'Western Digital', place: 'San Jose, USA', tz: 'America/Los_Angeles', route: 'Dhaka → USA', title: 'Western Digital', sub: 'CIO Management Application, in progress via Altios' },
    { project: 'bc-localization', to: { lat: 47.67, lon: -122.12 }, tag: 'Microsoft', place: 'Redmond, USA', tz: 'America/Los_Angeles', route: 'Dhaka → USA', title: 'Microsoft', sub: 'Business Central localization for the Bangladesh market' },
    { project: 'piramids', to: { lat: 34.17, lon: -118.61 }, tag: 'PIRAMIDS', place: 'Woodland Hills, USA', tz: 'America/Los_Angeles', route: 'Dhaka → USA', title: 'PIRAMIDS', sub: 'Real estate portfolio management suite' },
    // personal
    { project: 'mapcars', to: { lat: 50.84, lon: -0.78 }, tag: 'MapCars', place: 'Chichester, UK', tz: 'Europe/London', route: 'Dhaka → Chichester, UK', title: 'MapCars UK', sub: 'Ride-hailing apps on Google Play and the App Store' },
    { project: 'motorshut', to: { lat: 51.52, lon: 0.19 }, tag: 'Motorshut', place: 'Rainham, UK', tz: 'Europe/London', route: 'Dhaka → Rainham, UK', title: 'Motorshut', sub: 'Used-car marketplace' },
    { project: null, to: null, tag: 'Dhaka', route: 'Dhaka → Bangladesh', title: 'Home market', sub: 'VetMart BD, AykorGPT, Cumilla Resort and four enterprise systems' }
    // /personal
    // pro: { project: null, to: null, tag: 'Dhaka', route: 'Dhaka → Bangladesh', title: 'Home market', sub: 'Factory ERP, POS, task management and biometric payroll' }
  ];

  /* ------------------------------------------------------------------------
     Hero globe + tour
     ------------------------------------------------------------------------ */
  function initHero() {
    var stage = document.querySelector('[data-globe-stage]');
    var canvas = document.getElementById('globe');
    if (!stage || !canvas || !canvas.getContext) return;

    var g = new Globe(canvas, { style: 'disc', labels: true, fill: 0.36, labelInset: 0.18 / 1.36 });
    var ui = {
      text: document.querySelector('[data-tour-text]'),
      route: document.querySelector('[data-tour-route]'),
      count: document.querySelector('[data-tour-count]'),
      title: document.querySelector('[data-tour-title]'),
      sub: document.querySelector('[data-tour-sub]'),
      ticks: document.querySelector('[data-tour-ticks]'),
      toggle: document.querySelector('[data-tour-toggle]'),
      toggleLabel: document.querySelector('[data-tour-toggle-label]'),
      open: document.querySelector('[data-tour-open]'),
      openLabel: document.querySelector('[data-tour-open-label]'),
      caption: document.querySelector('[data-tour]')
    };

    var arcs = STOPS.map(function (s) {
      return s.to ? makeArc(DHAKA, s.to, Infinity, 1300) : null;
    });
    var pins = STOPS.map(function (s) {
      return s.to ? { v: vec(s.to.lat, s.to.lon), t0: Infinity, label: s.tag, sub: s.place } : null;
    });
    g.arcs = arcs.filter(Boolean);
    g.pins = pins.filter(Boolean);

    // Without motion, show every connection at once.
    if (!g.motion) {
      g.arcs.forEach(function (a) { a.t0 = -1e9; });
      g.pins.forEach(function (p) { p.t0 = -1e9; });
    }

    var index = -1;
    var nextAt = 0;
    var holdUntil = 0;
    var paused = !g.motion;
    var ticks = [];

    // js/v3-globe-looks.js draws the other globe looks under this canvas and
    // follows the tour through these callbacks.
    var hook = window.v3Hero = {
      globe: g,
      stops: STOPS,
      land: LAND,
      motion: g.motion,
      index: function () { return index; },
      onStop: null,
      onAdvance: null,
      onFrame: null
    };

    STOPS.forEach(function (s, k) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'tour-tick';
      b.setAttribute('aria-label', 'Show ' + s.title + ' (' + s.route.replace('→', 'to') + ')');
      b.addEventListener('click', function () {
        go(k, performance.now());
        hold(9000);
      });
      ui.ticks.appendChild(b);
      ticks.push(b);
    });

    function go(k, now) {
      index = (k + STOPS.length) % STOPS.length;
      var s = STOPS[index];
      var v = viewFor(s.to);
      g.animateTo(v.lon, v.lat, g.motion ? 1500 : 0, now);

      var arc = arcs[index];
      if (arc) {
        if (g.motion) {
          // Keep the arc; sweep a highlight along it once the globe has turned
          // (and never before the arc's own launch at load has finished).
          arc.hl = Math.max(now + 900, arc.t0 + arc.dur);
          pins[index].ping = arc.hl + arc.dur;
        }
        g.activeArc = arc;
        g.focus = pins[index];
        g.burst = 0;
      } else {
        g.activeArc = null;
        g.focus = null;
        g.burst = g.motion ? now + 1100 : 1;
      }

      ui.route.textContent = s.route;
      ui.count.textContent = index + 1 + ' / ' + STOPS.length;
      ui.title.textContent = s.title;
      ui.sub.textContent = s.sub;
      if (s.project) {
        ui.open.setAttribute('data-project', s.project);
        ui.openLabel.textContent = 'Open project';
      } else {
        ui.open.removeAttribute('data-project');
        ui.openLabel.textContent = document.getElementById('live') ? 'See live projects' : 'See the work';
      }
      ticks.forEach(function (t, i) {
        if (i === index) t.setAttribute('aria-current', 'true');
        else t.removeAttribute('aria-current');
      });
      if (g.motion) {
        ui.text.classList.remove('is-swapping');
        void ui.text.offsetWidth;
        ui.text.classList.add('is-swapping');
      }

      nextAt = now + 6800;
      if (hook.onStop) hook.onStop(index, now);
      if (!g.motion) g.render(now);
    }

    function hold(ms) {
      holdUntil = performance.now() + ms;
    }

    ui.open.addEventListener('click', function () {
      if (!ui.open.hasAttribute('data-project')) {
        (document.getElementById('live') || document.getElementById('work')).scrollIntoView({ behavior: g.motion ? 'smooth' : 'auto' });
      }
    });

    ui.toggle.addEventListener('click', function () {
      paused = !paused;
      ui.toggle.setAttribute('aria-pressed', String(paused));
      ui.toggleLabel.textContent = paused ? 'Play tour' : 'Pause tour';
      if (!paused) nextAt = Math.min(nextAt, performance.now() + 1200);
    });
    // With reduced motion there is no auto-play; the ticks step through stops.
    if (!g.motion) ui.toggle.hidden = true;

    // Reading the caption pauses the tour.
    ui.caption.addEventListener('pointerenter', function () { holdUntil = Infinity; });
    ui.caption.addEventListener('pointerleave', function () { hold(2500); });
    ui.caption.addEventListener('focusin', function () { holdUntil = Infinity; });
    ui.caption.addEventListener('focusout', function () { hold(2500); });

    // Drag to spin.
    var drag = null;
    stage.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      drag = { x: e.clientX, y: e.clientY };
      stage.setPointerCapture(e.pointerId);
      stage.classList.add('is-dragging');
      g.anim = null;
      holdUntil = Infinity;
    });
    stage.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      drag.x = e.clientX;
      drag.y = e.clientY;
      g.view.lon -= dx / g.R / DEG;
      g.view.lat = clamp(g.view.lat + dy / g.R / DEG, -60, 75);
      if (!g.motion) g.render(performance.now());
    });
    function endDrag() {
      if (!drag) return;
      drag = null;
      stage.classList.remove('is-dragging');
      hold(5000);
    }
    stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointercancel', endDrag);

    function tick(now) {
      if (!paused && now >= holdUntil && now >= nextAt) {
        go(index + 1, now);
        if (hook.onAdvance) hook.onAdvance(now);
      }
      g.frame(now);
      if (hook.onFrame) hook.onFrame(now);
    }

    if ('ResizeObserver' in window) {
      new ResizeObserver(function () {
        if (g.resize() && !g.motion) g.render(performance.now());
      }).observe(canvas);
    }

    var start = performance.now();
    g.view = { lon: DHAKA.lon, lat: 20 };
    if (g.motion) {
      // Every connection flies out from Dhaka once at load, one after another;
      // the tour then highlights a single client at a time.
      arcs.forEach(function (a, k) {
        if (!a) return;
        a.t0 = start + 300 + k * 220;
        pins[k].t0 = a.t0 + a.dur;
      });
      nextAt = start + 1800;
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          if (entries[0].isIntersecting) startLoop(tick);
          else stopLoop(tick);
        }).observe(stage);
      } else {
        startLoop(tick);
      }
    } else {
      go(0, start);
      // Static frames don't redraw on their own; repaint once the label font arrives.
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () { g.render(performance.now()); });
      }
    }

    requestAnimationFrame(function () {
      stage.classList.add('is-ready');
    });
    document.dispatchEvent(new CustomEvent('v3hero'));
  }

  /* ------------------------------------------------------------------------
     Card horizons — a slice of the planet with a pin at each project
     ------------------------------------------------------------------------ */
  function initHorizons() {
    document.querySelectorAll('canvas[data-horizon]').forEach(function (canvas) {
      var p = PROJECTS[canvas.getAttribute('data-horizon')];
      if (!p || !p.where) return;
      var g = new Globe(canvas, { style: 'horizon' });
      var shift = parseFloat(canvas.getAttribute('data-shift'));
      if (isNaN(shift)) shift = 16;
      g.motion = false;
      g.pins = [{ v: vec(p.where.lat, p.where.lon), t0: 0 }];

      function draw() {
        if (!g.resize()) return;
        // Tilt the planet so the pin sits just below the middle of the band;
        // `shift` (degrees of longitude) slides the pin off-centre.
        var a = Math.asin(clamp((g.cy - g.h * 0.54) / g.R, -1, 1)) / DEG;
        g.view = { lon: p.where.lon - shift, lat: p.where.lat - a };
        g.render(0);
      }

      if ('ResizeObserver' in window) new ResizeObserver(draw).observe(canvas);
      else draw();
    });
  }

  /* ------------------------------------------------------------------------
     Kites — Shakrain kites behind Degree and training, flown from the bottom
     of the section, after the Kites background in demo/backgrounds.html. The
     wind follows the mouse; nothing is tied to scrolling.
     ------------------------------------------------------------------------ */
  function initKites() {
    var canvas = document.querySelector('[data-kites]');
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var motion = motionOK();
    var TAIL = 9;
    var W = 0, H = 0, kites = [], colours = [], ink = [0, 0, 0];
    var wind = 0, windTarget = 0, last = 0;

    function rgbOf(v) {
      v = v.trim();
      if (v.charAt(0) === '#') {
        if (v.length === 4) v = '#' + v[1] + v[1] + v[2] + v[2] + v[3] + v[3];
        return [parseInt(v.substr(1, 2), 16), parseInt(v.substr(3, 2), 16), parseInt(v.substr(5, 2), 16)];
      }
      var m = v.match(/[\d.]+/g) || [0, 0, 0];
      return [+m[0], +m[1], +m[2]];
    }

    function css(rgb, a) {
      return 'rgba(' + Math.round(rgb[0]) + ', ' + Math.round(rgb[1]) + ', ' + Math.round(rgb[2]) + ', ' + a + ')';
    }

    // The demo's kite colours, taken from the active theme.
    function readColours() {
      var cs = getComputedStyle(document.documentElement);
      function v(name) { return rgbOf(cs.getPropertyValue(name)); }
      var red = v('--red'), bg = v('--bg');
      var mustard = document.documentElement.getAttribute('data-theme') === 'dark' ? [231, 183, 95] : [211, 150, 28];
      ink = v('--ink');
      colours = [red, v('--accent'), mustard, ink, red.map(function (c, i) { return c + (bg[i] - c) * 0.3; }), v('--globe-dot')];
    }

    function layout() {
      var n = W < 760 ? 5 : 8, seed = 11;
      function r() {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 4294967296;
      }
      kites = [];
      for (var i = 0; i < n; i++) {
        kites.push({ ax: (i + 0.5) / n, len: 0.55 + r() * 0.3, s: 0.75 + r() * 0.5, lean: (r() - 0.5) * 0.5, seed: r() * 50, colour: i % 6, ang: 0, x: 0, y: 0, tail: null });
      }
    }

    function resize() {
      var rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return false;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = rect.width;
      H = rect.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      layout();
      return true;
    }

    // step is the frame time in seconds; 0 draws a still frame.
    function draw(t, step) {
      if (!W) return;
      ctx.clearRect(0, 0, W, H);
      ctx.lineCap = 'round';
      // Kites keep their size and stay in the lower part of a tall section.
      var ay = H, sky = Math.min(H, 820), unit = Math.min(H, 300) * 0.9;
      kites.forEach(function (k) {
        var us = unit * k.s;                // pixels per unit of the kite's shape
        var ax = k.ax * W, j;
        var wobble = (Math.sin(t * 0.4 + k.seed) * 0.6 + Math.sin(t * 0.93 + k.seed * 1.7) * 0.4) * 0.25;
        var target = k.lean + wind * 0.55 + wobble;
        k.ang += (target - k.ang) * (step ? Math.min(1, step * 2) : 1);
        var L = k.len * sky;
        k.x = ax + Math.sin(k.ang) * L;
        k.y = ay - Math.cos(k.ang) * L;
        var rot = k.ang * 0.8 + (step ? Math.sin(t * 1.3 + k.seed) * 0.12 : 0);
        var col = colours[k.colour];

        // String: a sagging curve from the bottom of the section up to the kite.
        ctx.strokeStyle = css(ink, 0.22);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.quadraticCurveTo((ax + k.x) / 2 + Math.sin(k.ang) * 0.07 * L, (ay + k.y) / 2 + 0.1 * L, k.x, k.y);
        ctx.stroke();

        // Tail: each knot follows the one above it, pulled down and blown by the wind.
        var d = 0.085 * us, gap = 0.028 * us;
        var px = k.x - Math.sin(rot) * d, py = k.y + Math.cos(rot) * d;
        if (!k.tail) {
          k.tail = [];
          for (j = 0; j < TAIL; j++) k.tail.push([px, py + (j + 1) * gap]);
        }
        var e = step ? Math.min(1, step * 9) : 1;
        ctx.lineWidth = 1.2;
        for (j = 0; j < TAIL; j++) {
          var p = k.tail[j];
          p[0] += (px - wind * 0.02 * us + Math.sin(t * 3 + j * 0.8 + k.seed) * 0.008 * us - p[0]) * e;
          p[1] += (py + gap - p[1]) * e;
          ctx.strokeStyle = css(col, 0.75 * (1 - j / TAIL));
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(p[0], p[1]);
          ctx.stroke();
          px = p[0];
          py = p[1];
        }

        // The kite, then its spars (the path is built in kite space, stroked in page space).
        ctx.save();
        ctx.translate(k.x, k.y);
        ctx.rotate(rot);
        ctx.scale(us, us);
        ctx.beginPath();
        ctx.moveTo(0, -0.075);
        ctx.lineTo(0.052, -0.012);
        ctx.lineTo(0, 0.085);
        ctx.lineTo(-0.052, -0.012);
        ctx.closePath();
        ctx.fillStyle = css(col, 0.92);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(0, -0.075);
        ctx.lineTo(0, 0.085);
        ctx.moveTo(-0.052, -0.012);
        ctx.lineTo(0.052, -0.012);
        ctx.restore();
        ctx.strokeStyle = css(ink, 0.45);
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    }

    function tick(now) {
      var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
      last = now;
      wind += (windTarget - wind) * Math.min(1, dt * 1.5);
      draw(now / 1000, dt);
    }

    readColours();
    resize();
    document.addEventListener('themechange', function () {
      readColours();
      if (!motion) draw(0, 0);
    });

    if (!motion) {
      // Reduced motion: the kites hang still.
      draw(0, 0);
      if ('ResizeObserver' in window) new ResizeObserver(function () { if (resize()) draw(0, 0); }).observe(canvas);
      return;
    }

    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
    window.addEventListener('pointermove', function (e) {
      windTarget = clamp((e.clientX / window.innerWidth) * 2 - 1, -1, 1);
    }, { passive: true });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) startLoop(tick);
        else {
          stopLoop(tick);
          last = 0;
        }
      }).observe(canvas);
    } else {
      startLoop(tick);
    }
  }

  /* ------------------------------------------------------------------------
     Project drawer
     ------------------------------------------------------------------------ */
  function initDrawer() {
    var root = document.getElementById('drawer');
    if (!root) return;
    var panel = root.querySelector('.drawer-panel');
    var closeBtn = root.querySelector('.drawer-close');
    var canvas = root.querySelector('[data-drawer-globe]');
    var outside = [document.querySelector('[data-nav]'), document.getElementById('main'), document.querySelector('.footer')];
    var field = {};
    root.querySelectorAll('[data-d]').forEach(function (el) {
      field[el.getAttribute('data-d')] = el;
    });

    var g = new Globe(canvas, { style: 'disc', fill: 0.36, dotScale: 1.25 });
    var opener = null;
    var tick = function (now) { g.frame(now); };

    function setupGlobe(where) {
      var now = performance.now();
      g.motion = motionOK();
      g.arcs = [];
      g.pins = [];
      g.activeArc = null;
      g.burst = 0;
      g.spin = 0;
      g.anim = null;
      g.last = 0;

      if (!where) {
        g.view = { lon: DHAKA.lon, lat: 18 };
        g.spin = g.motion ? 0.014 : 0;
        return;
      }
      if (angleBetween(DHAKA, where) < 4 * DEG) {
        g.view = viewFor(null);
        g.burst = g.motion ? now + 300 : 1;
        return;
      }
      var v = viewFor(where);
      g.view = { lon: v.lon, lat: v.lat };
      var arc = makeArc(DHAKA, where, g.motion ? now + 350 : -1e9, 1200);
      g.arcs = [arc];
      g.activeArc = arc;
      g.pins = [{ v: vec(where.lat, where.lon), t0: g.motion ? arc.t0 + arc.dur : -1e9 }];
    }

    function open(id, trigger) {
      var p = PROJECTS[id];
      if (!p) return;
      opener = trigger || document.activeElement;

      field.org.textContent = p.org;
      field.client.textContent = p.client;
      field.title.textContent = p.title;
      field.role.textContent = p.role;
      field.status.textContent = p.status;
      field.desc.textContent = p.desc;
      field.where.textContent = p.where ? p.where.label : p.whereLabel;
      field.stack.textContent = p.stack.join(' · ');
      field.highlights.textContent = '';
      p.highlights.forEach(function (h) {
        var li = document.createElement('li');
        li.textContent = h;
        field.highlights.appendChild(li);
      });
      if (p.url) {
        field.url.href = p.url;
        field.url.hidden = false;
      } else {
        field.url.hidden = true;
      }

      root.classList.add('is-open');
      root.setAttribute('aria-hidden', 'false');
      document.body.classList.add('is-locked');
      outside.forEach(function (el) { if (el) el.inert = true; });
      panel.scrollTop = 0;

      requestAnimationFrame(function () {
        g.resize();
        setupGlobe(p.where);
        if (g.motion) startLoop(tick);
        else g.render(performance.now());
        closeBtn.focus({ preventScroll: true });
      });
    }

    function close() {
      if (!root.classList.contains('is-open')) return;
      root.classList.remove('is-open');
      root.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('is-locked');
      outside.forEach(function (el) { if (el) el.inert = false; });
      stopLoop(tick);
      if (opener && opener.focus) opener.focus({ preventScroll: true });
    }

    document.addEventListener('click', function (e) {
      var trigger = e.target.closest('[data-project]');
      if (trigger && !root.contains(trigger)) {
        e.preventDefault();
        open(trigger.getAttribute('data-project'), trigger);
        return;
      }
      if (e.target.closest('[data-drawer-close]')) close();
    });

    document.addEventListener('keydown', function (e) {
      if (!root.classList.contains('is-open')) return;
      if (e.key === 'Escape') {
        close();
        return;
      }
      if (e.key !== 'Tab') return;
      var focusables = Array.prototype.filter.call(
        panel.querySelectorAll('a[href]:not([hidden]), button:not([disabled])'),
        function (el) { return el.offsetParent !== null; }
      );
      if (!focusables.length) return;
      var first = focusables[0], last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  /* ------------------------------------------------------------------------
     Navigation: scrolled state, mobile sheet, scrollspy
     ------------------------------------------------------------------------ */
  function initNav() {
    var nav = document.querySelector('[data-nav]');
    var toggle = document.querySelector('[data-nav-toggle]');
    var sheet = document.getElementById('nav-sheet');
    if (!nav) return;

    function onScroll() {
      nav.classList.toggle('is-scrolled', window.scrollY > 24);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    function setSheet(open) {
      sheet.hidden = !open;
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('is-locked', open);
    }

    if (toggle && sheet) {
      toggle.addEventListener('click', function () {
        setSheet(sheet.hidden);
      });
      sheet.addEventListener('click', function (e) {
        if (e.target.closest('a')) setSheet(false);
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !sheet.hidden) {
          setSheet(false);
          toggle.focus();
        }
      });
      window.addEventListener('resize', function () {
        if (window.innerWidth > 960 && !sheet.hidden) setSheet(false);
      });
    }

    var links = document.querySelectorAll('.nav-links a');
    if (!('IntersectionObserver' in window)) return;
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = '#' + entry.target.id;
        links.forEach(function (a) {
          if (a.getAttribute('href') === id) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('main > section[id]').forEach(function (s) { spy.observe(s); });
  }

  /* ------------------------------------------------------------------------
     Scroll reveals
     ------------------------------------------------------------------------ */
  function initReveal() {
    var items = document.querySelectorAll('[data-reveal]');
    if (!('IntersectionObserver' in window) || !motionOK()) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------------------------------------------------
     Dhaka clock, copy email, toast
     ------------------------------------------------------------------------ */
  function initClock() {
    var els = document.querySelectorAll('[data-clock]');
    if (!els.length || !window.Intl) return;
    var fmt;
    try {
      fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Dhaka' });
    } catch (e) {
      return;
    }
    function update() {
      var t = fmt.format(new Date()) + ' GMT+6';
      els.forEach(function (el) { el.textContent = t; });
    }
    update();
    setInterval(update, 20000);
  }

  var toastTimer = 0;
  function toast(message) {
    var el = document.querySelector('[data-toast]');
    if (!el) return;
    el.textContent = message;
    el.classList.add('is-shown');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('is-shown'); }, 2600);
  }

  function initCopy() {
    var email = '7mahfuzur.rahman@gmail.com';
    document.querySelectorAll('[data-copy-email]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(email).then(function () {
            toast('Email copied');
          }, fallback);
        } else {
          fallback();
        }
      });
    });

    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = email;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      if (ok) toast('Email copied');
      else window.location.href = 'mailto:' + email;
    }
  }

  /* ------------------------------------------------------------------------
     Theme switch (light / dark / claude). The initial theme is applied by the
     inline script in <head>; this handles the radio group and persistence.
     ------------------------------------------------------------------------ */
  var THEMES = ['light', 'dark', 'claude'];

  function initTheme() {
    var root = document.documentElement;
    var group = document.querySelector('[data-theme-switch]');
    var meta = document.querySelector('meta[name="theme-color"]');
    var options = group ? Array.prototype.slice.call(group.querySelectorAll('[data-theme-value]')) : [];
    var switchTimer = 0;

    function current() {
      var t = root.getAttribute('data-theme');
      return THEMES.indexOf(t) === -1 ? 'light' : t;
    }

    // Radio semantics: the chosen option is checked and is the group's one tab stop.
    function sync() {
      var t = current();
      options.forEach(function (o) {
        var on = o.getAttribute('data-theme-value') === t;
        o.setAttribute('aria-checked', String(on));
        o.tabIndex = on ? 0 : -1;
      });
      if (meta) meta.setAttribute('content', getComputedStyle(root).getPropertyValue('--bg').trim());
    }

    function apply(next) {
      if (next === current()) return;
      if (motionOK()) {
        root.classList.add('theme-switching');
        clearTimeout(switchTimer);
        switchTimer = setTimeout(function () { root.classList.remove('theme-switching'); }, 500);
      }
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('v3-theme', next); } catch (e) { /* private mode: theme just won't persist */ }
      readPalette();
      GLOBES.forEach(function (g) { g.render(g.lastNow); });
      sync();
      // Other canvases (the arcade games) listen for this to repaint.
      document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: next } }));
    }

    sync();

    options.forEach(function (o, i) {
      o.addEventListener('click', function () {
        apply(o.getAttribute('data-theme-value'));
      });
      o.addEventListener('keydown', function (e) {
        var step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
        if (!step) return;
        e.preventDefault();
        var next = options[(i + step + options.length) % options.length];
        apply(next.getAttribute('data-theme-value'));
        next.focus();
      });
    });
  }

  /* ------------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------------ */
  function boot() {
    readPalette();
    initTheme();
    initNav();
    initReveal();
    initClock();
    initCopy();
    initDrawer();
    initHero();
    initHorizons();
    initKites();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
