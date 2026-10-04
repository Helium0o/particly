'use strict';
/*
 * Particle simulation + WebGL2 renderer that approximates Roblox's ParticleEmitter.
 * Units are studs. Roblox axes: +Y up, Front = -Z.
 */

const M4 = {
  perspective(fovy, aspect, near, far) {
    const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
  },
  lookAt(e, t, up) {
    let z = V3.norm(V3.sub(e, t)), x = V3.norm(V3.cross(up, z)), y = V3.cross(z, x);
    return new Float32Array([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -V3.dot(x, e), -V3.dot(y, e), -V3.dot(z, e), 1]);
  },
  mul(a, b) {
    const o = new Float32Array(16);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    }
    return o;
  },
};
const V3 = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  scale: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  len: (a) => Math.hypot(a[0], a[1], a[2]),
  norm(a) { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
  /** Rotate v around unit axis k by angle (Rodrigues). */
  rot(v, k, ang) {
    const c = Math.cos(ang), s = Math.sin(ang), d = V3.dot(k, v) * (1 - c), x = V3.cross(k, v);
    return [v[0] * c + x[0] * s + k[0] * d, v[1] * c + x[1] * s + k[1] * d, v[2] * c + x[2] * s + k[2] * d];
  },
};

// NormalId order: Right, Top, Back, Left, Bottom, Front
const NORMALS = [[1, 0, 0], [0, 1, 0], [0, 0, 1], [-1, 0, 0], [0, -1, 0], [0, 0, -1]];
// Two tangents per normal (axis-aligned so we can scale by part half-size)
const TANGENTS = [[[0, 1, 0], [0, 0, 1]], [[1, 0, 0], [0, 0, 1]], [[1, 0, 0], [0, 1, 0]], [[0, 1, 0], [0, 0, 1]], [[1, 0, 0], [0, 0, 1]], [[1, 0, 0], [0, 1, 0]]];
const GRID_N = { None: 1, Grid2x2: 2, Grid4x4: 4, Grid8x8: 8 };
const MAX_PER_LAYER = 5000;
const DRIVE_SPEED = 45; // studs/s for the "Drive" preview (car moves toward -Z / Front)
const DEG = Math.PI / 180;

class Sim {
  constructor() { this.state = new Map(); this.reset(); }
  reset() {
    this.state.clear();
    this.time = 0;
    this.emitterPos = [0, 0, 0];
    this.emitterVel = [0, 0, 0];
    this.manualBurst = false;
  }
  count() { let n = 0; for (const s of this.state.values()) n += s.p.length; return n; }
  ls(L) {
    let s = this.state.get(L.id);
    if (!s) { s = { p: [], acc: 0, k: -1 }; this.state.set(L.id, s); }
    return s;
  }
  baseY(effect) { return effect.partSize[1] / 2 + 0.5; }

  step(effect, dt, opts) {
    dt = Math.min(dt, 0.1);
    this.time += dt;
    const by = this.baseY(effect);
    const prev = this.emitterPos;
    if (opts.move && !opts.drive) {
      const a = this.time * 1.3;
      this.emitterPos = [Math.cos(a) * 7, by + Math.sin(a * 2) * 0.8, Math.sin(a) * 7];
    } else this.emitterPos = [0, by, 0];
    this.emitterVel = dt > 0 ? V3.scale(V3.sub(this.emitterPos, prev), 1 / dt) : [0, 0, 0];
    if (V3.len(this.emitterVel) > 200) this.emitterVel = [0, 0, 0];
    // Drive: the camera rides with the car, so the world (and detached particles) streams backwards.
    this.driveShift = opts.drive ? DRIVE_SPEED * dt : 0;
    this.driveOffset = ((this.driveOffset || 0) + this.driveShift) % 2;
    if (opts.drive) this.emitterVel = [0, 0, -DRIVE_SPEED];

    const ids = new Set(effect.layers.map((l) => l.id));
    for (const id of this.state.keys()) if (!ids.has(id)) this.state.delete(id);

    const burst = this.manualBurst;
    this.manualBurst = false;
    for (const L of effect.layers) {
      const s = this.ls(L);
      const ldt = dt * U.clamp(L.TimeScale, 0, 10);
      if (!L.hidden) {
        if (L.mode === 'continuous' && L.Enabled) {
          s.acc += L.Rate * ldt;
          let n = Math.floor(s.acc);
          s.acc -= n;
          n = Math.min(n, 400);
          for (let i = 0; i < n; i++) this.spawn(L, s, effect);
        } else if (L.mode === 'burst' && opts.autoBurst) {
          const d = L.emitDelay, loop = Math.max(0.1, effect.burstLoop);
          if (this.time >= d) {
            const k = Math.floor((this.time - d) / loop);
            if (k !== s.k) { s.k = k; this.emit(L, s, effect, L.emitCount); }
          }
        }
        if (burst) {
          if (L.emitDelay > 0 && L.mode === 'burst') setTimeout(() => this.emit(L, this.ls(L), effect, L.emitCount), L.emitDelay * 1000);
          else this.emit(L, s, effect, L.emitCount);
        }
      }
      this.update(L, s, ldt, this.driveShift);
    }
  }
  emit(L, s, effect, n) { n = Math.min(n, 2000); for (let i = 0; i < n; i++) this.spawn(L, s, effect); }

  spawn(L, s, effect) {
    if (s.p.length >= MAX_PER_LAYER) return;
    const hs = V3.scale(effect.partSize, 0.5);
    const di = Math.max(0, ENUMS.EmissionDirection.items.indexOf(L.EmissionDirection));
    const N = NORMALS[di], [T1, T2] = TANGENTS[di];
    const ext = (axis) => Math.abs(axis[0]) * hs[0] + Math.abs(axis[1]) * hs[1] + Math.abs(axis[2]) * hs[2];
    const eN = ext(N), e1 = ext(T1), e2 = ext(T2);
    const surface = L.ShapeStyle === 'Surface';
    const partial = U.clamp(L.ShapePartial, 0, 1);
    let pos, dir;
    // Emitters inside an Attachment emit from a single point
    if (L.point) { pos = [0, 0, 0]; dir = N; } else switch (L.Shape) {
      case 'Sphere': {
        const cosMax = Math.cos(Math.max(partial, 0.001) * Math.PI);
        const ct = U.lerp(cosMax, 1, Math.random()), st = Math.sqrt(1 - ct * ct), ph = Math.random() * Math.PI * 2;
        const u = [N[0] * ct + (T1[0] * Math.cos(ph) + T2[0] * Math.sin(ph)) * st,
          N[1] * ct + (T1[1] * Math.cos(ph) + T2[1] * Math.sin(ph)) * st,
          N[2] * ct + (T1[2] * Math.cos(ph) + T2[2] * Math.sin(ph)) * st];
        const r = surface ? 1 : Math.cbrt(Math.random());
        pos = [u[0] * hs[0] * r, u[1] * hs[1] * r, u[2] * hs[2] * r];
        dir = u;
        break;
      }
      case 'Cylinder':
      case 'Disc': {
        const inner = 1 - partial;
        const r = surface ? 1 : Math.sqrt(U.lerp(inner * inner, 1, Math.random()));
        const ph = Math.random() * Math.PI * 2, c = Math.cos(ph), sn = Math.sin(ph);
        const h = L.Shape === 'Cylinder' ? U.rand(-eN, eN) : 0;
        pos = [T1[0] * c * e1 * r + T2[0] * sn * e2 * r + N[0] * h,
          T1[1] * c * e1 * r + T2[1] * sn * e2 * r + N[1] * h,
          T1[2] * c * e1 * r + T2[2] * sn * e2 * r + N[2] * h];
        dir = L.Shape === 'Cylinder' ? V3.norm([T1[0] * c + T2[0] * sn, T1[1] * c + T2[1] * sn, T1[2] * c + T2[2] * sn]) : N;
        break;
      }
      default: { // Box
        const a = U.rand(-e1, e1), b = U.rand(-e2, e2), h = surface ? eN : U.rand(-eN, eN);
        pos = [T1[0] * a + T2[0] * b + N[0] * h, T1[1] * a + T2[1] * b + N[1] * h, T1[2] * a + T2[2] * b + N[2] * h];
        dir = N;
      }
    }
    if (L.ShapeInOut === 'Inward' || (L.ShapeInOut === 'InAndOut' && Math.random() < 0.5)) dir = V3.scale(dir, -1);
    const sx = L.SpreadAngle[0] * DEG, sy = L.SpreadAngle[1] * DEG;
    if (sx) dir = V3.rot(dir, T2, U.rand(-sx, sx));
    if (sy) dir = V3.rot(dir, T1, U.rand(-sy, sy));
    const speed = U.rand(L.Speed[0], L.Speed[1]);
    let vel = V3.scale(dir, speed);
    if (L.VelocityInheritance) vel = V3.add(vel, V3.scale(this.emitterVel, L.VelocityInheritance));
    const locked = !!L.LockedToPart;
    const life = Math.max(0.01, U.rand(L.Lifetime[0], L.Lifetime[1]));
    const n = GRID_N[L.FlipbookLayout] || 1;
    s.p.push({
      p: locked ? pos : V3.add(pos, this.emitterPos), v: vel, locked,
      age: 0, life,
      rs: U.rand(-1, 1), rt: U.rand(-1, 1), rq: U.rand(-1, 1),
      rot: U.rand(L.Rotation[0], L.Rotation[1]), rs2: U.rand(L.RotSpeed[0], L.RotSpeed[1]),
      f0: L.FlipbookStartRandom ? Math.floor(Math.random() * n * n) : 0,
      fps: U.rand(L.FlipbookFramerate[0], L.FlipbookFramerate[1]),
      seed: Math.floor(Math.random() * 1e6),
    });
  }

  update(L, s, dt, worldShift = 0) {
    const a = L.Acceleration, drag = L.Drag > 0 ? Math.pow(2, -L.Drag * dt) : 1;
    const arr = s.p;
    for (let i = arr.length - 1; i >= 0; i--) {
      const q = arr[i];
      q.age += dt;
      if (q.age >= q.life) { arr[i] = arr[arr.length - 1]; arr.pop(); continue; }
      q.v[0] = (q.v[0] + a[0] * dt) * drag;
      q.v[1] = (q.v[1] + a[1] * dt) * drag;
      q.v[2] = (q.v[2] + a[2] * dt) * drag;
      q.p[0] += q.v[0] * dt; q.p[1] += q.v[1] * dt; q.p[2] += q.v[2] * dt;
      if (!q.locked) q.p[2] += worldShift;
    }
  }

  worldPos(q, out) {
    if (q.locked) { out[0] = q.p[0] + this.emitterPos[0]; out[1] = q.p[1] + this.emitterPos[1]; out[2] = q.p[2] + this.emitterPos[2]; }
    else { out[0] = q.p[0]; out[1] = q.p[1]; out[2] = q.p[2]; }
    return out;
  }
}

const PARTICLE_VS = `#version 300 es
in vec3 aPos; in vec2 aUV; in vec4 aCol;
uniform mat4 uVP;
out vec2 vUV; out vec4 vCol;
void main(){ gl_Position = uVP * vec4(aPos, 1.0); vUV = aUV; vCol = aCol; }`;
const PARTICLE_FS = `#version 300 es
precision mediump float;
in vec2 vUV; in vec4 vCol;
uniform sampler2D uTex; uniform float uEmit;
out vec4 o;
void main(){
  vec4 t = texture(uTex, vUV);
  float a = t.a * vCol.a;
  o = vec4(t.rgb * vCol.rgb * a, a * (1.0 - uEmit));
}`;
const LINE_VS = `#version 300 es
in vec3 aPos; in vec4 aCol; uniform mat4 uVP; out vec4 vCol;
void main(){ gl_Position = uVP * vec4(aPos, 1.0); vCol = aCol; }`;
const LINE_FS = `#version 300 es
precision mediump float; in vec4 vCol; out vec4 o;
void main(){ o = vec4(vCol.rgb * vCol.a, vCol.a); }`;

const BACKGROUNDS = {
  night: [0.07, 0.08, 0.12],
  dusk: [0.16, 0.13, 0.22],
  sky: [0.55, 0.72, 0.9],
  grey: [0.35, 0.36, 0.4],
  black: [0, 0, 0],
  white: [0.94, 0.95, 0.97],
};

class ParticleView {
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.thumb = !!opts.thumb;
    const gl = canvas.getContext('webgl2', { alpha: false, antialias: true, preserveDrawingBuffer: this.thumb });
    if (!gl || gl.isContextLost()) throw new Error('WebGL2 is not available in this browser.');
    this.gl = gl;
    this.sim = new Sim();
    this.effect = null;
    this.settings = { grid: true, part: true, move: false, drive: false, autoBurst: true, bg: 'night', paused: false, speed: 1 };
    this.cam = { yaw: 0.7, pitch: 0.28, dist: 24, target: [0, 3, 0] };
    this.texCache = {};
    this.pBuf = new Float32Array(9 * 6 * 2048);
    this._initGL();
    if (!this.thumb) this._initControls();
  }

  _shader(vs, fs) {
    const gl = this.gl;
    const mk = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const p = gl.createProgram();
    gl.attachShader(p, mk(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    return p;
  }

  _initGL() {
    const gl = this.gl;
    this.pProg = this._shader(PARTICLE_VS, PARTICLE_FS);
    this.lProg = this._shader(LINE_VS, LINE_FS);
    this.pVao = gl.createVertexArray();
    this.pVbo = gl.createBuffer();
    gl.bindVertexArray(this.pVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.pVbo);
    const P = (n) => gl.getAttribLocation(this.pProg, n);
    gl.enableVertexAttribArray(P('aPos')); gl.vertexAttribPointer(P('aPos'), 3, gl.FLOAT, false, 36, 0);
    gl.enableVertexAttribArray(P('aUV')); gl.vertexAttribPointer(P('aUV'), 2, gl.FLOAT, false, 36, 12);
    gl.enableVertexAttribArray(P('aCol')); gl.vertexAttribPointer(P('aCol'), 4, gl.FLOAT, false, 36, 20);
    this.lVao = gl.createVertexArray();
    this.lVbo = gl.createBuffer();
    gl.bindVertexArray(this.lVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.lVbo);
    const Lp = (n) => gl.getAttribLocation(this.lProg, n);
    gl.enableVertexAttribArray(Lp('aPos')); gl.vertexAttribPointer(Lp('aPos'), 3, gl.FLOAT, false, 28, 0);
    gl.enableVertexAttribArray(Lp('aCol')); gl.vertexAttribPointer(Lp('aCol'), 4, gl.FLOAT, false, 28, 12);
    gl.bindVertexArray(null);
    this.uVP = gl.getUniformLocation(this.pProg, 'uVP');
    this.uEmit = gl.getUniformLocation(this.pProg, 'uEmit');
    this.uTex = gl.getUniformLocation(this.pProg, 'uTex');
    this.uVPl = gl.getUniformLocation(this.lProg, 'uVP');
  }

  _initControls() {
    const c = this.canvas;
    let drag = null;
    c.addEventListener('pointerdown', (e) => {
      drag = { x: e.clientX, y: e.clientY, pan: e.button === 2 || e.shiftKey };
      c.setPointerCapture(e.pointerId);
    });
    c.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      drag.x = e.clientX; drag.y = e.clientY;
      if (drag.pan) {
        const { right, up } = this._basis();
        const k = this.cam.dist * 0.0018;
        this.cam.target = V3.add(this.cam.target, V3.add(V3.scale(right, -dx * k), V3.scale(up, dy * k)));
      } else {
        this.cam.yaw -= dx * 0.008;
        this.cam.pitch = U.clamp(this.cam.pitch + dy * 0.008, -1.5, 1.5);
      }
    });
    const end = () => { drag = null; };
    c.addEventListener('pointerup', end);
    c.addEventListener('pointercancel', end);
    c.addEventListener('contextmenu', (e) => e.preventDefault());
    c.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.cam.dist = U.clamp(this.cam.dist * Math.exp(e.deltaY * 0.0012), 2, 400);
    }, { passive: false });
    c.addEventListener('dblclick', () => this.frame());
  }

  setEffect(effect) { this.effect = effect; }
  reset() { this.sim.reset(); }
  burst() { this.sim.manualBurst = true; }
  resetCamera() {
    this.cam = { yaw: 0.7, pitch: 0.28, dist: 24, target: [0, this.effect ? this.sim.baseY(this.effect) + 2 : 3, 0] };
  }

  _eye() {
    const { yaw, pitch, dist, target } = this.cam;
    return [target[0] + Math.sin(yaw) * Math.cos(pitch) * dist, target[1] + Math.sin(pitch) * dist, target[2] + Math.cos(yaw) * Math.cos(pitch) * dist];
  }
  _basis() {
    const eye = this._eye();
    const fwd = V3.norm(V3.sub(this.cam.target, eye));
    const right = V3.norm(V3.cross(fwd, [0, 1, 0]));
    const up = V3.cross(right, fwd);
    return { eye, fwd, right, up };
  }

  /** Point the camera at the bulk of the live particles. */
  frame() {
    if (this.settings.drive) {
      // Ride along with the car: look at the exhaust with the trail streaming away behind it.
      const ep = this.sim.emitterPos;
      const size = this.effect ? Math.max(...this.effect.partSize) : 1;
      this.cam = { yaw: 0.9, pitch: 0.22, dist: U.clamp(9 + size * 2, 9, 60), target: [ep[0], ep[1] + 0.5, ep[2] + 3 + size] };
      return;
    }
    const pts = [];
    const tmp = [0, 0, 0];
    for (const s of this.sim.state.values()) {
      const step = Math.max(1, Math.floor(s.p.length / 300));
      for (let i = 0; i < s.p.length; i += step) pts.push([...this.sim.worldPos(s.p[i], tmp)]);
    }
    const ep = this.sim.emitterPos;
    if (pts.length < 3) { this.cam.target = [ep[0], ep[1] + 2, ep[2]]; this.cam.dist = 20; return; }
    const c = pts.reduce((a, p) => V3.add(a, p), [0, 0, 0]).map((v) => v / pts.length);
    const d = pts.map((p) => V3.len(V3.sub(p, c))).sort((a, b) => a - b);
    const r = Math.max(2, d[Math.floor(d.length * 0.8)], Math.max(...this.effect.partSize) * 0.6);
    this.cam.target = c;
    this.cam.dist = U.clamp(r / Math.sin(35 * DEG) * 1.5, 6, 400);
  }

  _texture(key) {
    const gl = this.gl;
    const src = TextureStore.source(key);
    if (!src) return key === 'rbx_ff_glow' ? null : this._texture('rbx_ff_glow');
    const ver = TextureStore.isUser(key) ? TextureStore._version : 0;
    let rec = this.texCache[key];
    if (rec && rec.ver === ver && rec.src === src) return rec.tex;
    if (!rec) { rec = { tex: gl.createTexture() }; this.texCache[key] = rec; }
    rec.ver = ver; rec.src = src;
    gl.bindTexture(gl.TEXTURE_2D, rec.tex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return rec.tex;
  }

  step(dt) {
    if (!this.effect || this.settings.paused) return;
    this.sim.step(this.effect, dt * this.settings.speed, this.settings);
  }

  /** Simulate offscreen (used for thumbnails / warm starts). */
  warm(seconds, dt = 1 / 30) {
    for (let t = 0; t < seconds; t += dt) this.sim.step(this.effect, dt, this.settings);
  }

  _resize() {
    const c = this.canvas;
    const dpr = this.thumb ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(c.clientWidth * dpr)) || c.width, h = Math.max(1, Math.round(c.clientHeight * dpr)) || c.height;
    if (!this.thumb && (c.width !== w || c.height !== h)) { c.width = w; c.height = h; }
  }

  _lines(vp) {
    const gl = this.gl, s = this.settings, out = [];
    const bg = BACKGROUNDS[s.bg] || BACKGROUNDS.night;
    const light = bg[0] + bg[1] + bg[2] > 1.5;
    const gc = light ? [0, 0, 0, 0.12] : [1, 1, 1, 0.08];
    const L = (a, b, c) => out.push(...a, ...c, ...b, ...c);
    if (s.grid) {
      const R = 30, dz = this.sim.driveOffset || 0;
      for (let i = -R; i <= R; i += 2) {
        const c = i === 0 ? (light ? [0, 0, 0, 0.3] : [1, 1, 1, 0.22]) : gc;
        L([i, 0, -R], [i, 0, R], c);
        if (i + dz <= R) L([-R, 0, i + dz], [R, 0, i + dz], gc);
      }
    }
    if (s.part && this.effect) {
      const p = this.sim.emitterPos, h = V3.scale(this.effect.partSize, 0.5);
      const c = [0.35, 0.65, 1, 0.75];
      const v = (x, y, z) => [p[0] + x * h[0], p[1] + y * h[1], p[2] + z * h[2]];
      for (const [a, b] of [[[-1, -1, -1], [1, -1, -1]], [[-1, 1, -1], [1, 1, -1]], [[-1, -1, 1], [1, -1, 1]], [[-1, 1, 1], [1, 1, 1]],
        [[-1, -1, -1], [-1, 1, -1]], [[1, -1, -1], [1, 1, -1]], [[-1, -1, 1], [-1, 1, 1]], [[1, -1, 1], [1, 1, 1]],
        [[-1, -1, -1], [-1, -1, 1]], [[1, -1, -1], [1, -1, 1]], [[-1, 1, -1], [-1, 1, 1]], [[1, 1, -1], [1, 1, 1]]]) L(v(...a), v(...b), c);
    }
    if (!out.length) return;
    gl.useProgram(this.lProg);
    gl.uniformMatrix4fv(this.uVPl, false, vp);
    gl.bindVertexArray(this.lVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.lVbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(out), gl.STREAM_DRAW);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArrays(gl.LINES, 0, out.length / 7);
  }

  render() {
    const gl = this.gl;
    this._resize();
    const W = this.canvas.width, H = this.canvas.height;
    gl.viewport(0, 0, W, H);
    const bg = BACKGROUNDS[this.settings.bg] || BACKGROUNDS.night;
    gl.clearColor(bg[0], bg[1], bg[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    const { eye, fwd, right, up } = this._basis();
    const vp = M4.mul(M4.perspective(70 * DEG, W / H, 0.1, 2000), M4.lookAt(eye, this.cam.target, [0, 1, 0]));
    this._lines(vp);
    if (!this.effect) return;

    gl.useProgram(this.pProg);
    gl.uniformMatrix4fv(this.uVP, false, vp);
    gl.uniform1i(this.uTex, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindVertexArray(this.pVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.pVbo);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const layers = this.effect.layers.map((L, i) => ({ L, i })).filter(({ L }) => !L.hidden)
      .sort((a, b) => (a.L.ZOffset - b.L.ZOffset) || (a.i - b.i));
    const wp = [0, 0, 0], col = [0, 0, 0];
    for (const { L } of layers) {
      const s = this.sim.state.get(L.id);
      if (!s || !s.p.length) continue;
      // sort back-to-front
      const list = s.p.map((q) => { this.sim.worldPos(q, wp); return { q, x: wp[0], y: wp[1], z: wp[2], d: (wp[0] - eye[0]) * fwd[0] + (wp[1] - eye[1]) * fwd[1] + (wp[2] - eye[2]) * fwd[2] }; });
      if (L.LightEmission < 1) list.sort((a, b) => b.d - a.d);
      const need = list.length * 54;
      if (this.pBuf.length < need) this.pBuf = new Float32Array(need * 1.5);
      const B = this.pBuf;
      let o = 0;
      const n = GRID_N[L.FlipbookLayout] || 1, nf = n * n;
      const bright = Math.max(0, L.Brightness);
      for (const it of list) {
        const q = it.q;
        if (it.d < 0.1) continue;
        const t = q.age / q.life;
        const size = Model.evalNum(L.Size, t, q.rs);
        if (size <= 0) continue;
        const alpha = 1 - U.clamp(Model.evalNum(L.Transparency, t, q.rt), 0, 1);
        if (alpha <= 0.002) continue;
        Model.evalColor(L.Color, t, col);
        const sq = U.clamp(Model.evalNum(L.Squash, t, q.rq), -3, 3);
        const sx = sq >= 0 ? 1 + sq : 1 / (1 - sq), sy = sq >= 0 ? 1 / (1 + sq) : 1 - sq;
        const hw = size * 0.5 * sx, hh = size * 0.5 * sy;
        let px = it.x, py = it.y, pz = it.z;
        const toCam = V3.norm([eye[0] - px, eye[1] - py, eye[2] - pz]);
        if (L.ZOffset) { px += toCam[0] * L.ZOffset; py += toCam[1] * L.ZOffset; pz += toCam[2] * L.ZOffset; }
        let R, Up;
        switch (L.Orientation) {
          case 'FacingCameraWorldUp': Up = [0, 1, 0]; R = V3.norm(V3.cross(Up, toCam)); break;
          case 'VelocityParallel': {
            const vl = V3.len(q.v);
            Up = vl > 1e-4 ? V3.scale(q.v, 1 / vl) : up;
            R = V3.cross(Up, toCam);
            R = V3.len(R) < 1e-4 ? right : V3.norm(R);
            break;
          }
          case 'VelocityPerpendicular': {
            const vl = V3.len(q.v);
            const nrm = vl > 1e-4 ? V3.scale(q.v, 1 / vl) : [0, 1, 0];
            const ref = Math.abs(nrm[1]) < 0.95 ? [0, 1, 0] : [1, 0, 0];
            R = V3.norm(V3.cross(ref, nrm)); Up = V3.cross(nrm, R);
            break;
          }
          default: R = right; Up = up;
        }
        const ang = (q.rot + q.rs2 * q.age) * DEG;
        if (ang) {
          const c = Math.cos(ang), sn = Math.sin(ang);
          const R2 = [R[0] * c + Up[0] * sn, R[1] * c + Up[1] * sn, R[2] * c + Up[2] * sn];
          Up = [Up[0] * c - R[0] * sn, Up[1] * c - R[1] * sn, Up[2] * c - R[2] * sn];
          R = R2;
        }
        // flipbook frame
        let u0 = 0, v0 = 0, du = 1;
        if (nf > 1) {
          const k = Math.floor(q.age * q.fps);
          let f;
          switch (L.FlipbookMode) {
            case 'OneShot': f = Math.min(nf - 1, Math.floor(t * nf)); break;
            case 'PingPong': { const per = 2 * nf - 2, m = (q.f0 + k) % per; f = m < nf ? m : per - m; break; }
            case 'Random': f = ((q.seed + k) * 2654435761 >>> 0) % nf; break;
            default: f = (q.f0 + k) % nf;
          }
          du = 1 / n; u0 = (f % n) * du; v0 = Math.floor(f / n) * du;
        }
        const r = col[0] * bright, g = col[1] * bright, b = col[2] * bright;
        const ax = R[0] * hw, ay = R[1] * hw, az = R[2] * hw, bx = Up[0] * hh, by = Up[1] * hh, bz = Up[2] * hh;
        // corners: TL, TR, BR, BL
        const V = (x, y, z, u, v) => { B[o++] = x; B[o++] = y; B[o++] = z; B[o++] = u; B[o++] = v; B[o++] = r; B[o++] = g; B[o++] = b; B[o++] = alpha; };
        const tlx = px - ax + bx, tly = py - ay + by, tlz = pz - az + bz;
        const trx = px + ax + bx, try_ = py + ay + by, trz = pz + az + bz;
        const brx = px + ax - bx, bry = py + ay - by, brz = pz + az - bz;
        const blx = px - ax - bx, bly = py - ay - by, blz = pz - az - bz;
        V(tlx, tly, tlz, u0, v0); V(trx, try_, trz, u0 + du, v0); V(brx, bry, brz, u0 + du, v0 + du);
        V(tlx, tly, tlz, u0, v0); V(brx, bry, brz, u0 + du, v0 + du); V(blx, bly, blz, u0, v0 + du);
      }
      if (!o) continue;
      gl.bindTexture(gl.TEXTURE_2D, this._texture(TextureStore.previewKey(L)));
      gl.uniform1f(this.uEmit, U.clamp(L.LightEmission, 0, 1));
      gl.bufferData(gl.ARRAY_BUFFER, B.subarray(0, o), gl.STREAM_DRAW);
      gl.drawArrays(gl.TRIANGLES, 0, o / 9);
    }
    gl.bindVertexArray(null);
  }

  /** Render a still of an effect after a short warm-up and return a data URL. */
  snapshot(effect) {
    this.setEffect(effect);
    this.sim.reset();
    const allBurst = effect.layers.every((l) => l.mode === 'burst');
    const warm = allBurst ? Math.min(...effect.layers.map((l) => l.emitDelay)) + 0.45 : U.clamp(Math.max(...effect.layers.map((l) => l.Lifetime[1])) * 0.8, 0.8, 3);
    this.warm(warm);
    this.frame();
    this.cam.yaw = 0.6; this.cam.pitch = 0.2;
    this.render();
    return this.canvas.toDataURL('image/jpeg', 0.85);
  }
}
