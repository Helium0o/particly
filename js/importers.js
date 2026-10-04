'use strict';
/*
 * Importers: Particly JSON, Roblox .rbxmx XML, Luau source code (scripts that
 * create ParticleEmitters or property tables), share links and URLs.
 * Every importer returns an array of normalised effects.
 */

const Import = (() => {
  /* ------------------------------ JSON ------------------------------ */
  function fromJson(text) {
    const data = JSON.parse(text);
    let list;
    if (Array.isArray(data)) list = data;
    else if (data && data.type === 'library' && Array.isArray(data.effects)) list = data.effects;
    else if (data && data.effect) list = [data.effect];
    else if (data && Array.isArray(data.layers)) list = [data];
    else if (data && typeof data === 'object' && ('Rate' in data || 'Size' in data || 'Color' in data)) list = [{ name: data.Name || 'Imported', layers: [data] }];
    else throw new Error('JSON does not look like a Particly effect.');
    return list.map((e) => Model.normalizeEffect({ ...e, id: undefined }));
  }

  /* ------------------------------ rbxmx ------------------------------ */
  const nums = (s) => String(s).trim().split(/\s+/).filter(Boolean).map(Number);
  const child = (el, tag) => [...el.children].find((c) => c.tagName.toLowerCase() === tag.toLowerCase());
  const childNum = (el, tag) => +(child(el, tag)?.textContent || 0);

  function decodeAttributes(b64) {
    const out = {};
    try {
      const bytes = U.b64urlToBytes(b64.trim().replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''));
      const dv = new DataView(bytes.buffer);
      let o = 0;
      const n = dv.getUint32(o, true); o += 4;
      const str = () => { const l = dv.getUint32(o, true); o += 4; const s = new TextDecoder().decode(bytes.subarray(o, o + l)); o += l; return s; };
      for (let i = 0; i < n; i++) {
        const key = str();
        const type = bytes[o++];
        if (type === 0x06) { out[key] = dv.getFloat64(o, true); o += 8; }
        else if (type === 0x05) { out[key] = dv.getFloat32(o, true); o += 4; }
        else if (type === 0x03) { out[key] = !!bytes[o++]; }
        else if (type === 0x02) { out[key] = str(); }
        else break; // unknown type: stop (we only need numbers)
      }
    } catch { /* ignore malformed attributes */ }
    return out;
  }

  function readEmitter(item) {
    const props = child(item, 'Properties');
    const L = {};
    if (!props) return L;
    for (const el of props.children) {
      const tag = el.tagName, name = el.getAttribute('name');
      if (!name) continue;
      const def = PROP_BY_KEY[name];
      switch (tag) {
        case 'NumberSequence': {
          const n = nums(el.textContent), k = [];
          for (let i = 0; i + 2 < n.length; i += 3) k.push({ t: n[i], v: n[i + 1], e: n[i + 2] });
          L[name] = k;
          break;
        }
        case 'ColorSequence': {
          const n = nums(el.textContent), k = [];
          for (let i = 0; i + 3 < n.length; i += 5) k.push({ t: n[i], c: [n[i + 1], n[i + 2], n[i + 3]] });
          L[name] = k;
          break;
        }
        case 'NumberRange': L[name] = nums(el.textContent).slice(0, 2); break;
        case 'float': case 'double': case 'int': case 'int64': L[name] = +el.textContent; break;
        case 'bool': L[name] = el.textContent.trim() === 'true'; break;
        case 'token': if (def && def.type === 'enum') L[name] = ENUMS[name].items[+el.textContent] || undefined; break;
        case 'Vector2': L[name] = [childNum(el, 'X'), childNum(el, 'Y')]; break;
        case 'Vector3': L[name] = [childNum(el, 'X'), childNum(el, 'Y'), childNum(el, 'Z')]; break;
        case 'Content': { const u = child(el, 'url'); L[name] = u ? u.textContent.trim() : ''; break; }
        case 'string': if (name === 'Name') L.Name = el.textContent; break;
        case 'BinaryString':
          if (name === 'AttributesSerialize' && el.textContent.trim()) {
            const a = decodeAttributes(el.textContent);
            if (isFinite(a.EmitCount)) { L.mode = 'burst'; L.emitCount = a.EmitCount; L.emitDelay = a.EmitDelay || 0; }
          }
          break;
      }
    }
    if (L.mode === 'burst') L.Enabled = false;
    return L;
  }

  /**
   * A disabled emitter without EmitCount is a burst layer for effects that start on, but a
   * continuous layer (switched on by its trigger) for Particly behaviours that start off.
   */
  function resolveDisabled(layers, trigger) {
    const mode = trigger && trigger.mode;
    const startsOff = mode && mode !== 'always' && mode !== 'character';
    for (const L of layers) {
      if (L.mode === 'burst' || L.Enabled !== false) continue;
      if (startsOff) L.Enabled = true;
      else { L.mode = 'burst'; L.emitCount = L.emitCount || 20; }
    }
    return layers;
  }

  function nameOf(item) {
    const props = item && child(item, 'Properties');
    const n = props && [...props.children].find((c) => c.getAttribute('name') === 'Name');
    return n ? n.textContent : '';
  }

  function fromRbxmx(text) {
    if (text.startsWith('<roblox!')) throw new Error('Binary .rbxm files are not supported. In Studio, right-click the object > "Save to File…" and choose the .rbxmx (XML) format.');
    const doc = new DOMParser().parseFromString(text, 'application/xml');
    if (doc.getElementsByTagName('parsererror').length) throw new Error('Could not read this XML file.');
    const items = [...doc.getElementsByTagName('Item')].filter((i) => i.getAttribute('class') === 'ParticleEmitter');
    if (!items.length) throw new Error('No ParticleEmitters found in this file.');
    // Group emitters by the object holding them. An emitter inside an Attachment emits
    // from a point; if that Attachment sits in a Part, it belongs to the Part's effect.
    const isItem = (e) => e && e.tagName === 'Item';
    const groups = new Map();
    const pointItems = new Set();
    for (const it of items) {
      let parent = isItem(it.parentElement) ? it.parentElement : null;
      if (parent && parent.getAttribute('class') === 'Attachment') {
        pointItems.add(it);
        if (isItem(parent.parentElement)) parent = parent.parentElement;
      }
      // Character effects: Script > Folder "Emitters" > emitters
      if (parent && parent.getAttribute('class') === 'Folder' && isItem(parent.parentElement)) parent = parent.parentElement;
      if (!groups.has(parent)) groups.set(parent, []);
      groups.get(parent).push(it);
    }
    const effects = [];
    for (const [parent, list] of groups) {
      let partSize;
      const pp = parent && child(parent, 'Properties');
      if (pp) {
        const s = [...pp.children].find((c) => /^size$/i.test(c.getAttribute('name') || '') && c.tagName === 'Vector3');
        if (s) partSize = [childNum(s, 'X'), childNum(s, 'Y'), childNum(s, 'Z')];
      }
      const layers = list.map((it) => ({ ...readEmitter(it), point: pointItems.has(it) }));
      const sources = parent ? [...parent.getElementsByTagName('ProtectedString')].map((p) => p.textContent) : [];
      const meta = sources.map(markerOf).find(Boolean) || {};
      const loop = sources.map((t) => /LOOP_SECONDS\s*=\s*([\d.]+)/.exec(t)).find(Boolean);
      resolveDisabled(layers, meta);
      // A Particly "always on" effect re-imports with its burst layers' Enabled restored by mode
      effects.push(Model.normalizeEffect({
        name: meta.name || (nameOf(parent) || (list.length === 1 && nameOf(list[0])) || 'Imported Effect').replace(/^Particly_/, ''),
        category: 'Imported', partSize: partSize || meta.partSize, layers, trigger: meta, underglow: meta.underglow,
        burstLoop: meta.burstLoop || (loop ? +loop[1] : undefined),
      }));
    }
    return effects;
  }

  /** Behaviour settings stored by Particly in exported scripts: --@particly {...} */
  function markerOf(text) {
    const m = /--@particly (\{[^\n]*\})/.exec(text || '');
    if (!m) return null;
    try { return JSON.parse(m[1]); } catch { return null; }
  }

  /* ------------------------------ Luau ------------------------------ */
  function tokenize(src) {
    const toks = [];
    let i = 0;
    const n = src.length;
    const longBracket = (start) => {
      const m = /^\[(=*)\[/.exec(src.slice(start, start + 64));
      if (!m) return null;
      const close = ']' + m[1] + ']';
      const end = src.indexOf(close, start + m[0].length);
      const stop = end < 0 ? n : end;
      return { text: src.slice(start + m[0].length, stop), next: end < 0 ? n : end + close.length };
    };
    while (i < n) {
      const c = src[i];
      if (/\s/.test(c)) { i++; continue; }
      if (c === '-' && src[i + 1] === '-') {
        const lb = src[i + 2] === '[' ? longBracket(i + 2) : null;
        if (lb) { i = lb.next; continue; }
        while (i < n && src[i] !== '\n') i++;
        continue;
      }
      if (c === '"' || c === "'" || c === '`') {
        let j = i + 1, s = '';
        while (j < n && src[j] !== c) {
          if (src[j] === '\\') {
            const e = src[j + 1];
            s += e === 'n' ? '\n' : e === 't' ? '\t' : e;
            j += 2;
          } else s += src[j++];
        }
        toks.push({ t: 'str', v: s });
        i = j + 1;
        continue;
      }
      if (c === '[') {
        const lb = longBracket(i);
        if (lb) { toks.push({ t: 'str', v: lb.text }); i = lb.next; continue; }
      }
      const num = /^(0x[0-9a-fA-F_]+|0b[01_]+|(\d[\d_]*\.?[\d_]*|\.\d[\d_]*)([eE][+-]?\d+)?)/.exec(src.slice(i, i + 64));
      if (num && /[\d.]/.test(c) && !(c === '.' && !/\d/.test(src[i + 1]))) {
        const raw = num[0].replace(/_/g, '');
        toks.push({ t: 'num', v: raw.startsWith('0b') ? parseInt(raw.slice(2), 2) : Number(raw) });
        i += num[0].length;
        continue;
      }
      const name = /^[A-Za-z_][A-Za-z0-9_]*/.exec(src.slice(i, i + 128));
      if (name) { toks.push({ t: 'name', v: name[0] }); i += name[0].length; continue; }
      const op = ['...', '..', '==', '~=', '<=', '>=', '::', '->', '+=', '-=', '*=', '/='].find((o) => src.startsWith(o, i));
      if (op) { toks.push({ t: 'op', v: op }); i += op.length; continue; }
      toks.push({ t: 'op', v: c });
      i++;
    }
    toks.push({ t: 'eof', v: '' });
    return toks;
  }

  const TABLE = Symbol('table');

  class Parser {
    constructor(toks) { this.toks = toks; this.i = 0; }
    peek(o = 0) { return this.toks[Math.min(this.i + o, this.toks.length - 1)]; }
    next() { return this.toks[this.i++] || this.toks[this.toks.length - 1]; }
    is(v, o = 0) { const t = this.peek(o); return t.t === 'op' && t.v === v; }
    eat(v) { if (this.is(v)) { this.i++; return true; } return false; }
    expect(v) { if (!this.eat(v)) throw new Error('expected ' + v); }

    expr(minPrec = 0) {
      let left = this.unary();
      const PREC = { or: 1, and: 2, '==': 3, '~=': 3, '<': 3, '>': 3, '<=': 3, '>=': 3, '..': 4, '+': 5, '-': 5, '*': 6, '/': 6, '%': 6, '//': 6, '^': 8 };
      for (;;) {
        const t = this.peek();
        const op = (t.t === 'op' || (t.t === 'name' && (t.v === 'and' || t.v === 'or'))) ? t.v : null;
        const p = op && PREC[op];
        if (!p || p < minPrec) break;
        this.next();
        const right = this.expr(op === '^' ? p : p + 1);
        if (typeof left === 'number' && typeof right === 'number') {
          left = op === '+' ? left + right : op === '-' ? left - right : op === '*' ? left * right : op === '/' ? left / right : op === '^' ? Math.pow(left, right) : op === '%' ? left % right : left;
        } else if (op === 'or') left = left === null || left === false || left === undefined ? right : left;
        else if (op === '..') left = String(left ?? '') + String(right ?? '');
      }
      return left;
    }
    unary() {
      if (this.eat('-')) { const v = this.unary(); return typeof v === 'number' ? -v : undefined; }
      if (this.eat('#')) { this.unary(); return undefined; }
      if (this.peek().t === 'name' && this.peek().v === 'not') { this.next(); this.unary(); return undefined; }
      return this.primary();
    }
    table() {
      this.expect('{');
      const arr = [], map = {};
      while (!this.is('}') && this.peek().t !== 'eof') {
        if (this.eat('[')) {
          const k = this.expr(); this.expect(']'); this.expect('=');
          map[String(k)] = this.expr();
        } else if (this.peek().t === 'name' && this.is('=', 1) && !this.is('==', 1)) {
          const k = this.next().v; this.next();
          map[k] = this.expr();
        } else arr.push(this.expr());
        if (!this.eat(',') && !this.eat(';')) break;
      }
      this.expect('}');
      return { [TABLE]: true, arr, map };
    }
    args() {
      if (this.is('{')) return [this.table()];
      if (this.peek().t === 'str') return [this.next().v];
      this.expect('(');
      const a = [];
      while (!this.is(')') && this.peek().t !== 'eof') {
        a.push(this.expr());
        if (!this.eat(',')) break;
      }
      this.expect(')');
      return a;
    }
    primary() {
      const t = this.peek();
      if (t.t === 'num') { this.next(); return t.v; }
      if (t.t === 'str') { this.next(); return t.v; }
      if (this.is('{')) return this.table();
      if (this.eat('(')) { const v = this.expr(); this.expect(')'); return this.suffix(v, null); }
      if (t.t === 'name') {
        if (t.v === 'true') { this.next(); return true; }
        if (t.v === 'false') { this.next(); return false; }
        if (t.v === 'nil') { this.next(); return null; }
        if (t.v === 'function') { this.skipFunction(); return undefined; }
        this.next();
        return this.suffix(undefined, t.v);
      }
      this.next();
      return undefined;
    }
    skipFunction() {
      // skip "function (...) ... end" by counting block keywords
      let depth = 0;
      do {
        const t = this.next();
        if (t.t === 'eof') return;
        if (t.t === 'name' && ['function', 'do', 'then', 'repeat'].includes(t.v)) depth++;
        if (t.t === 'name' && ['end', 'until', 'elseif'].includes(t.v)) depth--;
      } while (depth > 0);
    }
    /** name chains: a.b.c, calls, method calls, indexing */
    suffix(value, path) {
      for (;;) {
        if (this.is('.') && this.peek(1).t === 'name') {
          this.next();
          const k = this.next().v;
          if (path !== null) path = path + '.' + k;
          else { value = value && value[TABLE] ? value.map[k] : undefined; }
          continue;
        }
        if (this.is(':') && this.peek(1).t === 'name') {
          this.next(); const m = this.next().v;
          this.args();
          value = undefined; path = null;
          void m;
          continue;
        }
        if (this.is('(') || this.is('{') || this.peek().t === 'str') {
          const a = this.args();
          value = path !== null ? construct(path, a) : undefined;
          path = null;
          continue;
        }
        if (this.is('[')) { this.next(); this.expr(); this.expect(']'); value = undefined; path = null; continue; }
        if (this.is('::')) { this.next(); this.skipType(); continue; }
        break;
      }
      if (path !== null) return constant(path);
      return value;
    }
    skipType() {
      let depth = 0;
      for (;;) {
        const t = this.peek();
        if (t.t === 'eof') return;
        if (t.t === 'op' && '({<'.includes(t.v)) depth++;
        else if (t.t === 'op' && ')}>'.includes(t.v)) { if (!depth) return; depth--; }
        else if (!depth && t.t === 'op' && (t.v === ',' || t.v === '=')) return;
        this.next();
        if (!depth && this.peek().t !== 'op') return;
      }
    }
  }

  const isNum = (v) => typeof v === 'number' && isFinite(v);
  function constant(path) {
    const enumM = /^Enum\.(\w+)\.(\w+)$/.exec(path);
    if (enumM) return { T: 'Enum', type: enumM[1], v: enumM[2] };
    if (path === 'Vector3.zero') return { T: 'Vector3', v: [0, 0, 0] };
    if (path === 'Vector3.one') return { T: 'Vector3', v: [1, 1, 1] };
    if (path === 'Vector2.zero') return { T: 'Vector2', v: [0, 0] };
    if (path === 'Vector2.one') return { T: 'Vector2', v: [1, 1] };
    if (path === 'math.pi') return Math.PI;
    if (path === 'math.huge') return 1e9;
    if (/^(workspace|game\.Workspace|game\.workspace)\.Gravity$/.test(path)) return 196.2;
    return { T: 'Ref', path };
  }
  function construct(path, a) {
    const n = (i, d = 0) => (isNum(a[i]) ? a[i] : d);
    switch (path) {
      case 'Color3.new': return { T: 'Color3', v: [n(0), n(1), n(2)] };
      case 'Color3.fromRGB': return { T: 'Color3', v: [n(0) / 255, n(1) / 255, n(2) / 255] };
      case 'Color3.fromHex': return { T: 'Color3', v: U.hexToRgb(String(a[0] || 'fff')) };
      case 'Color3.fromHSV': return { T: 'Color3', v: U.hsvToRgb([n(0), n(1), n(2)]) };
      case 'BrickColor.new': return { T: 'Color3', v: [1, 1, 1] };
      case 'ColorSequenceKeypoint.new': return { T: 'CSK', t: n(0), c: a[1] && a[1].T === 'Color3' ? a[1].v : [1, 1, 1] };
      case 'ColorSequence.new': {
        if (a[0] && a[0][TABLE]) return { T: 'ColorSequence', v: a[0].arr.filter((k) => k && k.T === 'CSK').map((k) => ({ t: k.t, c: k.c })) };
        const c0 = a[0] && a[0].T === 'Color3' ? a[0].v : [1, 1, 1];
        const c1 = a[1] && a[1].T === 'Color3' ? a[1].v : c0;
        return { T: 'ColorSequence', v: [{ t: 0, c: c0 }, { t: 1, c: c1 }] };
      }
      case 'NumberSequenceKeypoint.new': return { T: 'NSK', t: n(0), v: n(1), e: n(2) };
      case 'NumberSequence.new': {
        if (a[0] && a[0][TABLE]) return { T: 'NumberSequence', v: a[0].arr.filter((k) => k && k.T === 'NSK').map((k) => ({ t: k.t, v: k.v, e: k.e })) };
        const v0 = n(0), v1 = isNum(a[1]) ? a[1] : v0;
        return { T: 'NumberSequence', v: [{ t: 0, v: v0, e: 0 }, { t: 1, v: v1, e: 0 }] };
      }
      case 'NumberRange.new': return { T: 'NumberRange', v: [n(0), isNum(a[1]) ? a[1] : n(0)] };
      case 'Vector2.new': return { T: 'Vector2', v: [n(0), n(1)] };
      case 'Vector3.new': return { T: 'Vector3', v: [n(0), n(1), n(2)] };
      case 'Instance.new': return { T: 'Instance', cls: String(a[0] || '') };
      case 'math.rad': return n(0) * Math.PI / 180;
      case 'math.deg': return n(0) * 180 / Math.PI;
      case 'tostring': return String(a[0]);
    }
    return undefined;
  }

  /** Convert a parsed Luau value into a Particly layer field. */
  function toField(key, v) {
    const p = PROP_BY_KEY[key];
    if (key === 'Name') return typeof v === 'string' ? v : undefined;
    if (key === 'Enabled') return typeof v === 'boolean' ? v : undefined;
    if (!p || v === undefined || v === null) return undefined;
    switch (p.type) {
      case 'colorseq': return v.T === 'ColorSequence' ? v.v : v.T === 'Color3' ? [{ t: 0, c: v.v }, { t: 1, c: v.v }] : undefined;
      case 'numseq': return v.T === 'NumberSequence' ? v.v : isNum(v) ? v : undefined;
      case 'range': return v.T === 'NumberRange' ? v.v : isNum(v) ? [v, v] : undefined;
      case 'vec2': return v.T === 'Vector2' ? v.v : undefined;
      case 'vec3': return v.T === 'Vector3' ? v.v : undefined;
      case 'number': return isNum(v) ? v : undefined;
      case 'bool': return typeof v === 'boolean' ? v : undefined;
      case 'enum': return v.T === 'Enum' ? v.v : typeof v === 'string' ? v : isNum(v) ? ENUMS[key].items[v] : undefined;
      case 'texture': return typeof v === 'string' ? v : isNum(v) ? 'rbxassetid://' + v : undefined;
    }
    return undefined;
  }
  const PROP_KEYS = new Set([...PROPS.map((p) => p.key), 'Name', 'Enabled']);

  function fromLuau(src) {
    const toks = tokenize(src);
    const P = new Parser(toks);
    const byVar = new Map(); // variable name -> layer fields
    const created = new Set(); // vars assigned Instance.new("ParticleEmitter")
    const notEmitter = new Set(); // vars assigned some other Instance class
    const tableEmitters = [];
    const meta = {};

    const layerFromMap = (map, extra = {}) => {
      const L = {};
      for (const [k, v] of Object.entries(map)) {
        if (!PROP_KEYS.has(k)) continue;
        const fv = toField(k, v);
        if (fv !== undefined) L[k] = fv;
      }
      return Object.assign(L, extra);
    };
    const walk = (tbl, depth = 0) => {
      if (!tbl || !tbl[TABLE] || depth > 6) return;
      const m = tbl.map;
      if (m.Props && m.Props[TABLE]) {
        const extra = {};
        if (typeof m.Name === 'string') extra.Name = m.Name;
        if (m.Point === true) extra.point = true;
        if (m.Burst && m.Burst[TABLE]) { extra.mode = 'burst'; extra.emitCount = m.Burst.map.Count; extra.emitDelay = m.Burst.map.Delay || 0; }
        tableEmitters.push(layerFromMap(m.Props.map, extra));
        return;
      }
      if ('Frames' in m || 'LightBrightness' in m) return; // Particly's car-neon settings table, not an emitter
      const propHits = Object.keys(m).filter((k) => PROP_BY_KEY[k]).length;
      if (propHits >= 2) { tableEmitters.push(layerFromMap(m)); return; }
      for (const v of [...Object.values(m), ...tbl.arr]) walk(v, depth + 1);
    };

    while (P.peek().t !== 'eof') {
      const start = P.i;
      try {
        const t = P.peek();
        if (t.t === 'name' && t.v === 'local') { P.next(); continue; }
        if (t.t === 'name') {
          // assignment target: a(.b)* =
          let j = 0, path = [t.v];
          while (P.is('.', j + 1) && P.peek(j + 2).t === 'name') { path.push(P.peek(j + 2).v); j += 2; }
          if (P.is(':', j + 1) && P.peek(j + 2).v === 'SetAttribute') {
            P.i += j + 3;
            const a = P.args();
            const L = byVar.get(path.join('.'));
            if (L && (a[0] === 'EmitCount' || a[0] === 'EmitDelay') && isNum(a[1])) {
              if (a[0] === 'EmitCount') { L.mode = 'burst'; L.emitCount = a[1]; } else L.emitDelay = a[1];
            }
            continue;
          }
          let typed = 0;
          if (path.length === 1 && P.is(':', j + 1) && P.peek(j + 2).t === 'name' && P.is('=', j + 3)) typed = 2; // local x: Type =
          if (P.is('=', j + 1 + typed)) {
            P.i += j + 2 + typed;
            const v = P.expr();
            const full = path.join('.');
            if (v && v.T === 'Instance') {
              if (v.cls === 'ParticleEmitter') { byVar.set(full, { Name: path[path.length - 1] }); created.add(full); notEmitter.delete(full); }
              else { notEmitter.add(full); byVar.delete(full); }
            } else if ((full === 'EFFECT_NAME' || full === 'Effect.Name') && typeof v === 'string') meta.name = v;
            else if ((full === 'PART_SIZE' || full === 'Effect.PartSize') && v && v.T === 'Vector3') meta.partSize = v.v;
            else if ((full === 'LOOP_SECONDS' || full === 'Effect.BurstLoop') && isNum(v)) meta.burstLoop = v;
            else if (path.length >= 2 && PROP_KEYS.has(path[path.length - 1])) {
              const owner = path.slice(0, -1).join('.'), key = path[path.length - 1];
              if (!notEmitter.has(owner) && (byVar.has(owner) || PROP_BY_KEY[key])) {
                if (!byVar.has(owner)) byVar.set(owner, { Name: owner });
                const fv = toField(key, v);
                if (fv !== undefined) byVar.get(owner)[key] = fv;
              }
            } else if (full === 'BURST_PLAYER_SOURCE' && typeof v === 'string') {
              const m = /LOOP_SECONDS\s*=\s*([\d.]+)/.exec(v);
              if (m) meta.burstLoop = +m[1];
            }
            if (v && v[TABLE]) walk(v);
            continue;
          }
        }
        if (P.is('{')) { walk(P.table()); continue; }
        P.next();
      } catch {
        P.i = Math.max(P.i, start + 1);
      }
    }

    // A variable counts as an emitter if it was created as one and got real properties,
    // or (when we never saw it created) if it received several particle-only properties.
    const layers = [...byVar.entries()].filter(([name, L]) => {
      const n = Object.keys(L).filter((k) => PROP_BY_KEY[k]).length;
      return created.has(name) ? n >= 1 : n >= 3;
    }).map(([, L]) => L).concat(tableEmitters);
    if (!layers.length) throw new Error('No ParticleEmitter properties found in this code.');
    const marker = markerOf(src) || {};
    resolveDisabled(layers, marker);
    return [Model.normalizeEffect({ name: meta.name || marker.name || 'Imported Script', category: 'Imported', partSize: meta.partSize || marker.partSize, burstLoop: marker.burstLoop || meta.burstLoop, trigger: marker, underglow: marker.underglow, layers })];
  }

  /* ---------------------------- share links ---------------------------- */
  async function fromShare(hashOrUrl) {
    const m = /#fx=([zr])([A-Za-z0-9_-]+)/.exec(hashOrUrl);
    if (!m) throw new Error('Not a Particly share link.');
    const bytes = U.b64urlToBytes(m[2]);
    const text = m[1] === 'z' ? await U.inflate(bytes) : new TextDecoder().decode(bytes);
    return [Model.normalizeEffect({ ...JSON.parse(text), id: undefined })];
  }

  /* --------------------------- auto-detection --------------------------- */
  async function fromText(text, hint = '') {
    const s = text.trim().replace(/^﻿/, '');
    if (!s) throw new Error('Nothing to import.');
    if (/#fx=[zr]/.test(s) && s.length < 500000 && !/\n/.test(s)) return fromShare(s);
    if (/^https?:\/\/\S+$/.test(s)) return fromUrl(s);
    if (s.startsWith('<roblox!')) return fromRbxmx(s);
    if (/\.rbxmx?$/i.test(hint) || s.startsWith('<roblox') || s.startsWith('<?xml')) return fromRbxmx(s);
    if (/\.json$/i.test(hint) || s.startsWith('{') || s.startsWith('[')) {
      try { return fromJson(s); } catch (e) { if (/\.json$/i.test(hint)) throw e; }
    }
    return fromLuau(s);
  }

  async function fromUrl(url) {
    if (/#fx=/.test(url)) return fromShare(url);
    let res;
    try { res = await fetch(url); } catch {
      throw new Error('Could not download that URL (the site may block cross-origin requests). Download the file and drop it here instead.');
    }
    if (!res.ok) throw new Error(`Download failed (${res.status}).`);
    return fromText(await res.text(), url.split('?')[0]);
  }

  return { fromJson, fromRbxmx, fromLuau, fromShare, fromText, fromUrl, tokenize };
})();
