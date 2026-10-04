/* ============================================================
   Uniformity — Canvas object renderer
   A real 3D projection of nested hexagonal projection rings.
   No libraries. Perspective, depth sorting, glow, mouse-reactive.
   ============================================================ */
(function (global) {
  'use strict';

  var TAU = Math.PI * 2;

  function hexRing(radius, z, rotOffset, sides) {
    sides = sides || 6;
    var pts = [];
    for (var i = 0; i < sides; i++) {
      var a = (i / sides) * TAU + rotOffset;
      pts.push({ x: Math.cos(a) * radius, y: Math.sin(a) * radius, z: z });
    }
    return pts;
  }

  function rotate(p, rx, ry, rz) {
    // Z
    var c = Math.cos(rz), s = Math.sin(rz);
    var x = p.x * c - p.y * s, y = p.x * s + p.y * c, z = p.z;
    // Y
    c = Math.cos(ry); s = Math.sin(ry);
    var x2 = x * c + z * s, z2 = -x * s + z * c;
    // X
    c = Math.cos(rx); s = Math.sin(rx);
    var y2 = y * c - z2 * s, z3 = y * s + z2 * c;
    return { x: x2, y: y2, z: z3 };
  }

  function project(p, focal, cx, cy, camZ) {
    var zz = p.z + camZ;
    if (zz < 1) zz = 1;
    var k = focal / zz;
    return { x: cx + p.x * k, y: cy + p.y * k, z: zz, k: k };
  }

  function mix(a, b, t) { return a + (b - a) * t; }

  function parseRGB(c) {
    if (c[0] === '#') {
      var h = c.slice(1);
      if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
      return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
    }
    var m = c.match(/\d+/g);
    return m ? [+m[0], +m[1], +m[2]] : [255,255,255];
  }

  function rgba(c, a) {
    var p = parseRGB(c);
    return 'rgba(' + p[0] + ',' + p[1] + ',' + p[2] + ',' + a + ')';
  }

  function UniformityObject(canvas, opts) {
    opts = opts || {};
    this.cv = canvas;
    this.ctx = canvas.getContext('2d');
    this.dpr = Math.min(global.devicePixelRatio || 1, 2);
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.t = 0;
    this.mx = 0; this.my = 0;         // mouse target
    this.cx = 0; this.cy = 0;         // smoothed
    this.paused = false;
    this.colors = {
      core:  opts.core  || '#2DD4E8',
      mid:   opts.mid   || '#8B7CF6',
      outer: opts.outer || '#5A6379',
      wire:  opts.wire  || '#8B93A7'
    };
    this.resize();
    this.bind();
    this.loop = this.loop.bind(this);
    this.raf = requestAnimationFrame(this.loop);
  }

  UniformityObject.prototype.resize = function () {
    var r = this.cv.getBoundingClientRect();
    this.w = r.width; this.h = r.height;
    this.cv.width  = Math.round(this.w * this.dpr);
    this.cv.height = Math.round(this.h * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  };

  UniformityObject.prototype.bind = function () {
    var self = this;
    this._onResize = function () { self.resize(); };
    global.addEventListener('resize', this._onResize);
    this._onMove = function (e) {
      var r = self.cv.getBoundingClientRect();
      self.mx = ((e.clientX - r.left) / r.width  - 0.5) * 2;
      self.my = ((e.clientY - r.top)  / r.height - 0.5) * 2;
    };
    global.addEventListener('mousemove', this._onMove, { passive: true });
    if (global.IntersectionObserver) {
      this._io = new IntersectionObserver(function (es) {
        self.paused = !es[0].isIntersecting;
      }, { threshold: 0 });
      this._io.observe(this.cv);
    }
  };

  UniformityObject.prototype.setColors = function (c) {
    for (var k in c) if (c.hasOwnProperty(k)) this.colors[k] = c[k];
  };

  UniformityObject.prototype.destroy = function () {
    cancelAnimationFrame(this.raf);
    global.removeEventListener('resize', this._onResize);
    global.removeEventListener('mousemove', this._onMove);
    if (this._io) this._io.disconnect();
  };

  UniformityObject.prototype.loop = function () {
    this.raf = requestAnimationFrame(this.loop);
    if (this.paused) return;
    this.t += this.reduced ? 0 : 0.006;
    this.cx = mix(this.cx, this.mx, 0.055);
    this.cy = mix(this.cy, this.my, 0.055);
    this.draw();
  };

  UniformityObject.prototype.draw = function () {
    var ctx = this.ctx, w = this.w, h = this.h;
    ctx.clearRect(0, 0, w, h);

    var cx = w / 2, cy = h / 2;
    var scale = Math.min(w, h) / 620;
    var focal = 520 * scale;
    var camZ = 620 * scale;

    // global orientation driven by time + mouse
    var rx = -0.62 + this.cy * 0.30;
    var ry =  this.t * 0.55 + this.cx * 0.55;
    var rz =  this.t * 0.16;

    // ---- build geometry ----
    var R = 210 * scale;
    var rings = [
      { pts: hexRing(R * 1.00, 0,  this.t * 0.50), color: this.colors.outer, width: 1.15, alpha: 0.55, dots: 2.6, dotA: 0.75 },
      { pts: hexRing(R * 0.68, 0, -this.t * 0.78), color: this.colors.mid,   width: 1.45, alpha: 0.85, dots: 3.4, dotA: 0.95 },
      { pts: hexRing(R * 0.38, 0,  this.t * 1.10), color: this.colors.core,  width: 1.75, alpha: 1.00, dots: 4.2, dotA: 1.00 }
    ];

    var segs = [], dots = [], spokes = [];

    rings.forEach(function (ring, ri) {
      var rp = ring.pts.map(function (p) {
        return project(rotate(p, rx, ry, rz), focal, cx, cy, camZ);
      });
      for (var i = 0; i < rp.length; i++) {
        var a = rp[i], b = rp[(i + 1) % rp.length];
        segs.push({ a: a, b: b, z: (a.z + b.z) / 2, c: ring.color, w: ring.width, al: ring.alpha, ring: ri });
      }
      rp.forEach(function (p) {
        dots.push({ p: p, z: p.z, c: ring.color, r: ring.dots * p.k * 1.6, al: ring.dotA });
      });
    });

    // radial spokes from core to outer vertices
    var outer = rings[0].pts.map(function (p) { return project(rotate(p, rx, ry, rz), focal, cx, cy, camZ); });
    var inner = rings[2].pts.map(function (p) { return project(rotate(p, rx, ry, rz), focal, cx, cy, camZ); });
    for (var i = 0; i < Math.min(outer.length, inner.length); i++) {
      spokes.push({ a: inner[i], b: outer[i], z: (inner[i].z + outer[i].z) / 2 });
    }

    // core
    var core = project(rotate({ x: 0, y: 0, z: 0 }, rx, ry, rz), focal, cx, cy, camZ);

    // ---- depth sort (far first) ----
    segs.sort(function (p, q) { return q.z - p.z; });
    spokes.sort(function (p, q) { return q.z - p.z; });
    dots.sort(function (p, q) { return q.z - p.z; });

    var maxZ = camZ + R, minZ = camZ - R;
    function depth(z) { return 1 - Math.min(1, Math.max(0, (z - minZ) / (maxZ - minZ))); } // 0 far .. 1 near

    // ---- spokes ----
    ctx.lineWidth = 1;
    spokes.forEach(function (s) {
      var d = depth(s.z);
      ctx.strokeStyle = rgba(this.colors.wire, 0.05 + d * 0.14);
      ctx.beginPath(); ctx.moveTo(s.a.x, s.a.y); ctx.lineTo(s.b.x, s.b.y); ctx.stroke();
    }, this);

    // ---- ring segments with glow ----
    segs.forEach(function (s) {
      var d = depth(s.z);
      ctx.lineCap = 'round';
      ctx.lineWidth = s.w * (0.55 + d * 0.9);

      // outer glow pass
      ctx.strokeStyle = rgba(s.c, s.al * (0.05 + d * 0.13));
      ctx.lineWidth = s.w * (3.2 + d * 3.4);
      ctx.beginPath(); ctx.moveTo(s.a.x, s.a.y); ctx.lineTo(s.b.x, s.b.y); ctx.stroke();

      // core pass
      ctx.lineWidth = s.w * (0.55 + d * 0.9);
      ctx.strokeStyle = rgba(s.c, s.al * (0.22 + d * 0.78));
      ctx.beginPath(); ctx.moveTo(s.a.x, s.a.y); ctx.lineTo(s.b.x, s.b.y); ctx.stroke();
    });

    // ---- vertices ----
    dots.forEach(function (dt) {
      var d = depth(dt.z);
      var r = Math.max(0.6, dt.r * (0.5 + d * 0.8));
      ctx.beginPath(); ctx.arc(dt.p.x, dt.p.y, r * 3.4, 0, TAU);
      ctx.fillStyle = rgba(dt.c, 0.05 + d * 0.10); ctx.fill();
      ctx.beginPath(); ctx.arc(dt.p.x, dt.p.y, r, 0, TAU);
      ctx.fillStyle = rgba(dt.c, dt.al * (0.3 + d * 0.7)); ctx.fill();
    });

    // ---- core nucleus ----
    var pulse = 1 + Math.sin(this.t * 2.1) * 0.14;
    var cr = 15 * scale * pulse;
    var g = ctx.createRadialGradient(core.x, core.y, 0, core.x, core.y, cr * 5.5);
    g.addColorStop(0,   rgba(this.colors.core, 0.55));
    g.addColorStop(0.35, rgba(this.colors.core, 0.16));
    g.addColorStop(1,   rgba(this.colors.core, 0));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(core.x, core.y, cr * 5.5, 0, TAU); ctx.fill();

    ctx.beginPath(); ctx.arc(core.x, core.y, cr * 0.42, 0, TAU);
    ctx.fillStyle = rgba('#FFFFFF', 0.92); ctx.fill();

    // ---- orbital trace: a point travelling the mid ring ----
    var midPts = rings[1].pts.map(function (p) { return project(rotate(p, rx, ry, rz), focal, cx, cy, camZ); });
    var phase = (this.t * 0.5) % 1;
    var seg = Math.floor(phase * midPts.length);
    var local = phase * midPts.length - seg;
    var pa = midPts[seg % midPts.length], pb = midPts[(seg + 1) % midPts.length];
    var ox = mix(pa.x, pb.x, local), oy = mix(pa.y, pb.y, local);
    var og = ctx.createRadialGradient(ox, oy, 0, ox, oy, 22 * scale);
    og.addColorStop(0, rgba(this.colors.mid, 0.85));
    og.addColorStop(1, rgba(this.colors.mid, 0));
    ctx.fillStyle = og;
    ctx.beginPath(); ctx.arc(ox, oy, 22 * scale, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(ox, oy, 3.2 * scale, 0, TAU);
    ctx.fillStyle = rgba('#FFFFFF', 0.95); ctx.fill();
  };

  global.UniformityObject = UniformityObject;
})(window);
