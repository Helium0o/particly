'use strict';
/*
 * Property widgets. Each widget gets:
 *   get()      -> current value
 *   set(v)     -> live update (preview reacts immediately)
 *   commit()   -> called when an edit is finished (creates an undo step)
 */

const Editors = (() => {
  const el = U.el;

  function numberField({ get, set, commit, min = 0, max = 1, step = 0.01 }) {
    const range = el('input', { type: 'range', min, max, step });
    const num = el('input', { type: 'number', step });
    const sync = () => { const v = get(); range.value = v; num.value = U.fmt(v); };
    range.addEventListener('input', () => { set(+range.value); num.value = U.fmt(+range.value); });
    range.addEventListener('change', commit);
    num.addEventListener('input', () => { if (num.value !== '' && isFinite(+num.value)) { set(+num.value); range.value = num.value; } });
    num.addEventListener('change', () => { sync(); commit(); });
    sync();
    return el('div', { class: 'num-field' }, range, num);
  }

  function multiField({ get, set, commit, labels, step = 0.1, min, max }) {
    const inputs = labels.map((lab, i) => {
      const inp = el('input', { type: 'number', step, min, max });
      inp.value = U.fmt(get()[i]);
      inp.addEventListener('input', () => {
        if (inp.value === '' || !isFinite(+inp.value)) return;
        const v = [...get()];
        v[i] = +inp.value;
        set(v);
      });
      inp.addEventListener('change', () => {
        const v = [...get()];
        // keep ranges ordered (min <= max)
        if (labels[0] === 'min' && v[0] > v[1]) { if (i === 0) v[1] = v[0]; else v[0] = v[1]; set(v); inputs.forEach((x, j) => { x.value = U.fmt(v[j]); }); }
        commit();
      });
      return el('label', { class: 'axis' }, el('span', null, lab), inp);
    });
    return el('div', { class: 'multi' }, inputs);
  }

  function enumField({ get, set, commit, items }) {
    const s = el('select', null, items.map((i) => el('option', { value: i }, i.replace(/([a-z])([A-Z0-9])/g, '$1 $2'))));
    s.value = get();
    s.addEventListener('change', () => { set(s.value); commit(); });
    return s;
  }

  function boolField({ get, set, commit }) {
    const c = el('input', { type: 'checkbox' });
    c.checked = !!get();
    c.addEventListener('change', () => { set(c.checked); commit(); });
    return el('div', null, c);
  }

  function seg({ items, get, set }) {
    const box = el('div', { class: 'seg' });
    const draw = () => {
      box.replaceChildren(...items.map(([v, label]) => el('button', { class: get() === v ? 'on' : '', onclick: () => { set(v); draw(); } }, label)));
    };
    draw();
    return box;
  }

  /* ----------------------- NumberSequence editor ----------------------- */
  const NUM_TEMPLATES = {
    Size: [['Const', (m) => [[0, m], [1, m]]], ['Grow', (m) => [[0, m * 0.2], [1, m]]], ['Shrink', (m) => [[0, m], [1, 0]]], ['Pop', (m) => [[0, 0], [0.2, m], [1, 0]]], ['Pulse', (m) => [[0, m * 0.5], [0.25, m], [0.5, m * 0.5], [0.75, m], [1, m * 0.5]]]],
    Transparency: [['Solid', () => [[0, 0], [1, 0]]], ['Fade out', () => [[0, 0], [1, 1]]], ['Fade in/out', () => [[0, 1], [0.2, 0], [0.8, 0], [1, 1]]], ['Late fade', () => [[0, 0], [0.7, 0], [1, 1]]], ['Flicker', () => [[0, 0], [0.2, 0.6], [0.4, 0], [0.6, 0.6], [0.8, 0], [1, 1]]]],
    Squash: [['None', () => [[0, 0], [1, 0]]], ['Wide', () => [[0, 1], [1, 1]]], ['Tall', () => [[0, -1.5], [1, -1.5]]], ['Wobble', () => [[0, 0], [0.25, 1], [0.5, 0], [0.75, -1], [1, 0]]]],
  };

  function numSeqField({ get, set, commit, min, max, soft, key }) {
    const wrap = el('div', { style: { display: 'flex', flexDirection: 'column', gap: '5px' } });
    const canvas = el('canvas', { class: 'seq-canvas' });
    const tools = el('div', { class: 'seq-tools' });
    const fields = el('div', { class: 'kp-fields' });
    let sel = 0, yMax = max, yMin = min;
    const fitRange = () => {
      if (key === 'Size') {
        const top = Math.max(...get().map((k) => k.v + k.e));
        yMax = Math.max(soft || 5, Math.ceil(top * 1.25 * 2) / 2);
        yMin = 0;
      } else { yMin = min; yMax = max; }
    };
    fitRange();
    const PAD = 8;
    const geom = () => {
      const r = canvas.getBoundingClientRect();
      return { w: r.width, h: r.height, r };
    };
    const toX = (t, w) => PAD + t * (w - PAD * 2);
    const toY = (v, h) => h - PAD - ((v - yMin) / (yMax - yMin)) * (h - PAD * 2);
    const fromX = (x, w) => U.clamp((x - PAD) / (w - PAD * 2), 0, 1);
    const fromY = (y, h) => U.clamp(yMin + ((h - PAD - y) / (h - PAD * 2)) * (yMax - yMin), min, max);

    function draw() {
      const { w, h } = geom();
      if (!w) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr; canvas.height = h * dpr;
      const c = canvas.getContext('2d');
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, w, h);
      // grid
      c.strokeStyle = '#ffffff10'; c.lineWidth = 1;
      for (let i = 0; i <= 4; i++) { const y = PAD + i * (h - PAD * 2) / 4; c.beginPath(); c.moveTo(PAD, y); c.lineTo(w - PAD, y); c.stroke(); }
      if (yMin < 0 && yMax > 0) { c.strokeStyle = '#ffffff30'; const y0 = toY(0, h); c.beginPath(); c.moveTo(PAD, y0); c.lineTo(w - PAD, y0); c.stroke(); }
      c.fillStyle = '#ffffff55'; c.font = '10px sans-serif';
      c.fillText(U.fmt(yMax), PAD + 2, PAD + 9); c.fillText(U.fmt(yMin), PAD + 2, h - PAD - 2);
      const k = get();
      // envelope band
      c.fillStyle = '#4c8dff26';
      c.beginPath();
      k.forEach((p, i) => { const x = toX(p.t, w), y = toY(p.v + p.e, h); i ? c.lineTo(x, y) : c.moveTo(x, y); });
      [...k].reverse().forEach((p) => c.lineTo(toX(p.t, w), toY(p.v - p.e, h)));
      c.fill();
      // curve
      c.strokeStyle = '#7fb0ff'; c.lineWidth = 2;
      c.beginPath();
      k.forEach((p, i) => { const x = toX(p.t, w), y = toY(p.v, h); i ? c.lineTo(x, y) : c.moveTo(x, y); });
      c.stroke();
      k.forEach((p, i) => {
        c.fillStyle = i === sel ? '#ffb547' : '#e6e9f2';
        c.beginPath(); c.arc(toX(p.t, w), toY(p.v, h), i === sel ? 5 : 4, 0, Math.PI * 2); c.fill();
      });
    }

    function drawFields() {
      const k = get();
      sel = U.clamp(sel, 0, k.length - 1);
      const p = k[sel];
      const mk = (label, val, onSet, opts = {}) => {
        const i = el('input', { type: 'number', step: opts.step || 0.01, disabled: opts.disabled });
        i.value = U.fmt(val);
        i.addEventListener('change', () => { if (isFinite(+i.value)) { onSet(+i.value); commit(); draw(); drawFields(); } });
        return [el('span', null, label), i];
      };
      const endpoint = sel === 0 || sel === k.length - 1;
      fields.replaceChildren(
        ...mk('Time', p.t, (v) => { const kk = U.clone(get()); kk[sel].t = U.clamp(v, 0.001, 0.999); const moved = kk[sel]; kk.sort((a, b) => a.t - b.t); sel = kk.indexOf(moved); set(kk); }, { disabled: endpoint }),
        ...mk('Value', p.v, (v) => { const kk = U.clone(get()); kk[sel].v = U.clamp(v, min, max); set(kk); fitRange(); }),
        ...mk('Env', p.e, (v) => { const kk = U.clone(get()); kk[sel].e = Math.max(0, v); set(kk); fitRange(); }),
        el('button', { class: 'btn small danger', title: 'Delete keypoint (or double-click it)', disabled: endpoint || k.length <= 2, onclick: () => remove(sel) }, '✕'),
      );
    }
    function remove(i) {
      const k = U.clone(get());
      if (i <= 0 || i >= k.length - 1 || k.length <= 2) return;
      k.splice(i, 1); sel = Math.min(i, k.length - 1);
      set(k); commit(); draw(); drawFields();
    }

    let drag = null;
    const hit = (e) => {
      const { w, h, r } = geom();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      const k = get();
      let best = -1, bd = 9;
      k.forEach((p, i) => { const d = Math.hypot(toX(p.t, w) - x, toY(p.v, h) - y); if (d < bd) { bd = d; best = i; } });
      return { best, x, y, w, h };
    };
    canvas.addEventListener('pointerdown', (e) => {
      const { best, x, y, w, h } = hit(e);
      const k = U.clone(get());
      if (best >= 0) sel = best;
      else {
        if (k.length >= 20) { U.toast('Roblox allows at most 20 keypoints', 'warn'); return; }
        const t = fromX(x, w);
        const kp = { t: U.clamp(t, 0.001, 0.999), v: fromY(y, h), e: Model.evalNum(k, t, 1) - Model.evalNum(k, t, 0) };
        kp.e = Math.max(0, kp.e);
        k.push(kp); k.sort((a, b) => a.t - b.t); sel = k.indexOf(kp);
        set(k);
      }
      drag = { shift: e.shiftKey, startY: y, startE: get()[sel].e };
      canvas.setPointerCapture(e.pointerId);
      draw(); drawFields();
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const { w, h, r } = geom();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      const k = U.clone(get());
      const p = k[sel];
      if (drag.shift) {
        p.e = Math.max(0, drag.startE + (drag.startY - y) / (h - PAD * 2) * (yMax - yMin));
      } else {
        if (sel > 0 && sel < k.length - 1) p.t = U.clamp(fromX(x, w), k[sel - 1].t + 0.001, k[sel + 1].t - 0.001);
        p.v = fromY(y, h);
        if (e.ctrlKey || e.metaKey) p.v = Math.round(p.v * 10) / 10;
      }
      set(k); draw(); drawFields();
    });
    const end = () => { if (drag) { drag = null; fitRange(); draw(); commit(); } };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
    canvas.addEventListener('dblclick', (e) => { const { best } = hit(e); if (best >= 0) remove(best); });
    canvas.title = 'Click to add a point · drag to move · Shift+drag = random envelope · double-click to delete';

    const tpl = NUM_TEMPLATES[key] || NUM_TEMPLATES.Size;
    tpl.forEach(([name, fn]) => tools.append(el('button', {
      onclick: () => {
        const ref = key === 'Size' ? Math.max(0.1, ...get().map((k) => k.v)) : 1;
        set(Model.numSeq(fn(ref)));
        sel = 0; fitRange(); commit(); draw(); drawFields();
      },
    }, name)));
    tools.append(el('button', {
      title: 'Add ±20% random variation to every point', onclick: () => {
        const k = U.clone(get()); k.forEach((p) => { p.e = Math.abs(p.v) * 0.2; }); set(k); fitRange(); commit(); draw(); drawFields();
      },
    }, '± Random'));

    wrap.append(canvas, fields, tools);
    requestAnimationFrame(() => { draw(); drawFields(); });
    new ResizeObserver(() => draw()).observe(canvas);
    return wrap;
  }

  /* ----------------------- ColorSequence editor ----------------------- */
  const PALETTES = {
    White: ['#ffffff'],
    Fire: ['#fff3b0', '#ff9a2a', '#d42a0c'],
    Ice: ['#ffffff', '#8fe3ff', '#2a6aff'],
    Toxic: ['#eaff8a', '#5aff3a', '#1a7a2a'],
    Magic: ['#ffd6ff', '#c04aff', '#4a2aff'],
    Gold: ['#fff6c0', '#ffc83a', '#c47a10'],
    Blood: ['#ff6a6a', '#a00010'],
    Smoke: ['#bbbbbb', '#444444'],
    Rainbow: ['#ff3a3a', '#ffb02a', '#ffff3a', '#3aff6a', '#3ab0ff', '#9a3aff'],
  };

  function colorSeqField({ get, set, commit }) {
    const wrap = el('div', { style: { display: 'flex', flexDirection: 'column', gap: '6px' } });
    const gw = el('div', { class: 'grad-wrap' });
    const bar = el('div', { class: 'grad-bar', title: 'Click to add a colour stop' });
    const fields = el('div', { class: 'kp-fields' });
    const tools = el('div', { class: 'seq-tools' });
    let sel = 0;
    const css = (k) => `linear-gradient(90deg, ${k.map((p) => `${U.rgbToHex(p.c)} ${(p.t * 100).toFixed(2)}%`).join(', ')})`;
    function draw() {
      const k = get();
      sel = U.clamp(sel, 0, k.length - 1);
      bar.style.background = css(k);
      gw.querySelectorAll('.grad-stop').forEach((s) => s.remove());
      k.forEach((p, i) => {
        const s = el('button', { class: 'grad-stop' + (i === sel ? ' sel' : ''), style: { left: (p.t * 100) + '%', background: U.rgbToHex(p.c) }, title: 'Drag to move · double-click to delete' });
        s.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          sel = i; draw(); drawFields();
          if (i === 0 || i === k.length - 1) return;
          const r = bar.getBoundingClientRect();
          const move = (ev) => {
            const kk = U.clone(get());
            kk[sel].t = U.clamp((ev.clientX - r.left) / r.width, kk[sel - 1].t + 0.001, kk[sel + 1].t - 0.001);
            set(kk); draw(); drawFields();
          };
          const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); commit(); };
          window.addEventListener('pointermove', move);
          window.addEventListener('pointerup', up);
        });
        s.addEventListener('dblclick', () => remove(i));
        gw.append(s);
      });
    }
    function remove(i) {
      const k = U.clone(get());
      if (i <= 0 || i >= k.length - 1) return;
      k.splice(i, 1); sel = 0;
      set(k); commit(); draw(); drawFields();
    }
    function drawFields() {
      const k = get();
      const p = k[sel];
      const color = el('input', { type: 'color', value: U.rgbToHex(p.c) });
      color.addEventListener('input', () => { const kk = U.clone(get()); kk[sel].c = U.hexToRgb(color.value); set(kk); draw(); });
      color.addEventListener('change', commit);
      const hex = el('input', { type: 'text', value: U.rgbToHex(p.c), style: { width: '74px' } });
      hex.addEventListener('change', () => { if (/^#?[0-9a-f]{3}([0-9a-f]{3})?$/i.test(hex.value.trim())) { const kk = U.clone(get()); kk[sel].c = U.hexToRgb(hex.value); set(kk); commit(); draw(); drawFields(); } });
      const endpoint = sel === 0 || sel === k.length - 1;
      fields.replaceChildren(
        color, hex,
        el('span', null, `t=${U.fmt(p.t)}`),
        el('span', { class: 'grow' }),
        el('button', { class: 'btn small', title: 'Reverse gradient', onclick: () => { set(get().map((q) => ({ t: 1 - q.t, c: [...q.c] })).reverse()); commit(); draw(); drawFields(); } }, '⇄'),
        el('button', { class: 'btn small danger', disabled: endpoint, title: 'Delete stop', onclick: () => remove(sel) }, '✕'),
      );
    }
    bar.addEventListener('click', (e) => {
      const r = bar.getBoundingClientRect();
      const t = U.clamp((e.clientX - r.left) / r.width, 0.001, 0.999);
      const k = U.clone(get());
      if (k.length >= 20) { U.toast('Roblox allows at most 20 keypoints', 'warn'); return; }
      const kp = { t, c: Model.evalColor(k, t, [0, 0, 0]) };
      k.push(kp); k.sort((a, b) => a.t - b.t); sel = k.indexOf(kp);
      set(k); commit(); draw(); drawFields();
    });
    for (const [name, cols] of Object.entries(PALETTES)) {
      const b = el('button', { title: name, style: { background: cols.length > 1 ? `linear-gradient(90deg, ${cols.join(',')})` : cols[0], width: '22px', height: '16px', padding: '0' } });
      b.addEventListener('click', () => { set(Model.colorSeq(cols)); sel = 0; commit(); draw(); drawFields(); });
      tools.append(b);
    }
    gw.append(bar);
    wrap.append(gw, fields, tools);
    draw(); drawFields();
    return wrap;
  }

  return { numberField, multiField, enumField, boolField, seg, numSeqField, colorSeqField, PALETTES };
})();
