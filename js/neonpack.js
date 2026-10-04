'use strict';
/*
 * Neon picture packs for the "NFS Neon" tab: full-colour underglow pictures (landscape 2:1,
 * like Need for Speed: World's car neons). Particly ships no pictures itself — you load your
 * own pack once and it is kept on this computer (IndexedDB):
 *   - NFSTEXTURES.bin from the World Neon mod (texture pack with DXT5 CARNEONGLOW_* textures)
 *   - a Particly neon pack (.json: { particly: 1, type: 'neonpack', items: [{ id, name, data }] })
 *   - plain PNG / JPG / WebP pictures
 */

const NeonPack = (() => {
  const DB = 'particly', STORE = 'kv', KEY = 'neonPack';
  let items = []; // [{ id, name, data (PNG data URL), assetId }]

  function db() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  async function idb(mode, fn) {
    const d = await db();
    return new Promise((resolve, reject) => {
      const tx = d.transaction(STORE, mode);
      const req = fn(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(req && req.result);
      tx.onerror = () => reject(tx.error);
    });
  }
  async function load() {
    try { items = (await idb('readonly', (s) => s.get(KEY))) || []; } catch { items = []; }
    return items;
  }
  async function save() {
    try { await idb('readwrite', (s) => s.put(items, KEY)); return true; } catch { U.toast('Could not save the neon pack on this computer.', 'err'); return false; }
  }

  /** "CARNEONGLOW_BRAZIL_FLAG" -> "Brazil Flag" */
  function niceName(id) {
    const s = String(id).replace(/^CARNEONGLOW_?/i, '').replace(/[_-]+/g, ' ').trim() || 'Standard';
    return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  }

  /* ---------------- DXT5 texture pack (NFSTEXTURES.bin) ---------------- */
  function dxt5(bytes, W, H) {
    const out = new Uint8ClampedArray(W * H * 4);
    const c565 = (c) => [((c >> 11) & 31) * 255 / 31, ((c >> 5) & 63) * 255 / 63, (c & 31) * 255 / 31];
    let i = 0;
    for (let by = 0; by < H / 4; by++) {
      for (let bx = 0; bx < W / 4; bx++, i += 16) {
        const a0 = bytes[i], a1 = bytes[i + 1];
        const al = [a0, a1];
        if (a0 > a1) for (let k = 0; k < 6; k++) al.push(((6 - k) * a0 + (k + 1) * a1) / 7);
        else { for (let k = 0; k < 4; k++) al.push(((4 - k) * a0 + (k + 1) * a1) / 5); al.push(0, 255); }
        let abits = 0n;
        for (let k = 0; k < 6; k++) abits |= BigInt(bytes[i + 2 + k]) << BigInt(8 * k);
        const c0 = bytes[i + 8] | (bytes[i + 9] << 8), c1 = bytes[i + 10] | (bytes[i + 11] << 8);
        const cbits = (bytes[i + 12] | (bytes[i + 13] << 8) | (bytes[i + 14] << 16) | (bytes[i + 15] << 24)) >>> 0;
        const p0 = c565(c0), p1 = c565(c1);
        const cols = [p0, p1, p0.map((v, j) => (2 * v + p1[j]) / 3), p0.map((v, j) => (v + 2 * p1[j]) / 3)];
        for (let k = 0; k < 16; k++) {
          const col = cols[(cbits >>> (2 * k)) & 3], a = al[Number((abits >> BigInt(3 * k)) & 7n)];
          const o = ((by * 4 + (k >> 2)) * W + bx * 4 + (k & 3)) * 4;
          out[o] = col[0]; out[o + 1] = col[1]; out[o + 2] = col[2]; out[o + 3] = a;
        }
      }
    }
    return out;
  }
  /** Each CARNEONGLOW_* texture: its name sits 40 bytes into a chunk whose last 32 KB are 256x128 DXT5 pixels. */
  function fromTexturePack(buf) {
    const bytes = new Uint8Array(buf);
    let text = '';
    for (let i = 0; i < bytes.length; i += 65536) text += String.fromCharCode.apply(null, bytes.subarray(i, i + 65536));
    const W = 256, H = 128, SIZE = W * H; // DXT5 = 1 byte per pixel
    const found = [], seen = new Set();
    for (const m of text.matchAll(/CARNEONGLOW[A-Z0-9_]*/g)) {
      const start = m.index - 40;
      if (start < 0 || seen.has(m[0])) continue;
      const size = new DataView(buf, start + 4, 4).getUint32(0, true);
      const end = start + 8 + size;
      if (size < SIZE || end > bytes.length) continue;
      const px = dxt5(bytes.subarray(end - SIZE, end), W, H);
      const c = document.createElement('canvas');
      c.width = W; c.height = H;
      c.getContext('2d').putImageData(new ImageData(px, W, H), 0, 0);
      seen.add(m[0]);
      found.push({ id: m[0], name: niceName(m[0]), data: c.toDataURL('image/png') });
    }
    return found;
  }

  function fromJson(obj) {
    if (!obj || obj.type !== 'neonpack' || !Array.isArray(obj.items)) return null;
    return obj.items.filter((t) => t && typeof t.data === 'string' && t.data.startsWith('data:image/'))
      .map((t) => ({ id: String(t.id || t.name), name: String(t.name || niceName(t.id)), data: t.data, assetId: String(t.assetId || '') }));
  }

  async function fromImage(file) {
    const data = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
    const base = file.name.replace(/\.[^.]+$/, '');
    return [{ id: base.toUpperCase(), name: niceName(base), data }];
  }

  /** Adds pictures from files; returns how many were added. */
  async function importFiles(files) {
    const added = [], names = {};
    for (const file of files) {
      const ext = (file.name.split('.').pop() || '').toLowerCase();
      if (ext === 'bin' || ext === 'tpk') added.push(...fromTexturePack(await file.arrayBuffer()));
      else if (ext === 'json') { const list = fromJson(JSON.parse(await file.text())); if (list) added.push(...list); }
      else if (/^(png|jpe?g|webp)$/.test(ext)) added.push(...(await fromImage(file)));
      else if (ext === 'end' || ext === 'txt') { // the mod's Strings/English.end: PN_CARNEONGLOW_X "Nice Name"
        for (const m of (await file.text()).matchAll(/PN_(CARNEONGLOW[A-Z0-9_]*)\s+"([^"]{1,40})"/g)) names[m[1]] = m[2];
      }
      else if (ext === 'rar' || ext === 'zip' || ext === '7z') throw new Error(`Extract the ${ext.toUpperCase()} first, then load Binary/Collections/NFSTEXTURES.bin from it.`);
    }
    for (const it of added) if (names[it.id]) it.name = names[it.id];
    let renamed = 0;
    for (const it of items) if (names[it.id] && it.name !== names[it.id]) { it.name = names[it.id]; renamed++; }
    for (const it of added) {
      const old = items.find((x) => x.id === it.id);
      if (old) Object.assign(old, { ...it, assetId: it.assetId || old.assetId });
      else items.push({ assetId: '', ...it });
    }
    if (added.length || renamed) await save();
    return added.length || renamed;
  }

  async function setAssetId(id, assetId) {
    const it = items.find((x) => x.id === id);
    if (it && it.assetId !== assetId) { it.assetId = assetId; await save(); }
  }
  async function clear() { items = []; await save(); }
  async function remove(id) { items = items.filter((x) => x.id !== id); await save(); }
  const exportJson = () => JSON.stringify({ particly: 1, type: 'neonpack', items });

  return { load, importFiles, setAssetId, clear, remove, exportJson, fromJson, fromTexturePack, niceName, get items() { return items; } };
})();
