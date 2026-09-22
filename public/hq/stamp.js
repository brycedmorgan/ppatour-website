/* Code stamping for ambassador graphics. Shared by Ambassador HQ and the public Ambassador Kit page,
   so a graphic renders the same in both. A "stamp" describes one text box on the image:
   { x, y, w, h }      box position and size as fractions of the image (0–1)
   text                template, e.g. "USE CODE {CODE}"; {FIRST} and {NAME} also work; \n = new line
   font                "Family|weight", one of STAMP_FONTS
   color, bg           text color and optional box fill ("" = no fill)
   radius              corner rounding as a fraction of the box's short side
   align               left | center | right
   upper               true = uppercase the text */
(function () {
  const STAMP_FONTS = [
    ['Barlow Condensed|700', 'Barlow Condensed'],
    ['Source Sans 3|700', 'Source Sans'],
    ['IBM Plex Mono|600', 'Plex Mono'],
    ['Arial|900', 'Arial Black'],
    ['Impact|400', 'Impact'],
    ['Georgia|700', 'Georgia'],
  ];
  const DEFAULT_STAMP = { x: 0.15, y: 0.45, w: 0.7, h: 0.14, text: 'USE CODE {CODE}', font: 'Barlow Condensed|700', color: '#FFFFFF', bg: '', radius: 0.15, align: 'center', upper: true };

  function fillTemplate(t, v) {
    return String(t || '{CODE}').replace(/\{(CODE|FIRST|NAME)\}/gi, (m, k) => v[k.toUpperCase()] || '');
  }
  async function ensureFont(font) {
    const [fam, wt] = String(font || DEFAULT_STAMP.font).split('|');
    try { await document.fonts.load(`${wt} 48px "${fam}"`); } catch (e) {}
  }
  function loadImage(src) {
    return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  }
  function drawStamp(ctx, img, st, vars) {
    const W = img.naturalWidth, H = img.naturalHeight;
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(img, 0, 0, W, H);
    if (!st) return;
    const x = st.x * W, y = st.y * H, w = st.w * W, h = st.h * H;
    if (st.bg) {
      const r = Math.min(w, h) * (st.radius || 0);
      ctx.fillStyle = st.bg; ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
      ctx.fill();
    }
    let txt = fillTemplate(st.text, vars || {});
    if (st.upper) txt = txt.toUpperCase();
    const lines = txt.split('\n').map(s => s.trim()).filter(Boolean);
    if (!lines.length) return;
    const [fam, wt] = String(st.font || DEFAULT_STAMP.font).split('|');
    const pad = Math.min(w, h) * 0.08;
    let size = (h - 2 * pad) / lines.length / 1.08;
    const setFont = () => { ctx.font = `${wt} ${size}px "${fam}", "Arial Black", Arial, sans-serif`; };
    setFont();
    while (size > 6 && Math.max(...lines.map(l => ctx.measureText(l).width)) > w - 2 * pad) { size *= 0.96; setFont(); }
    ctx.fillStyle = st.color || '#FFFFFF';
    ctx.textBaseline = 'middle';
    ctx.textAlign = st.align || 'center';
    const tx = st.align === 'left' ? x + pad : st.align === 'right' ? x + w - pad : x + w / 2;
    const lh = size * 1.08, y0 = y + h / 2 - (lines.length - 1) * lh / 2;
    lines.forEach((l, i) => ctx.fillText(l, tx, y0 + i * lh));
  }
  async function renderStamped(img, st, vars, type) {
    await ensureFont(st && st.font);
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    drawStamp(c.getContext('2d'), img, st, vars);
    return new Promise(res => c.toBlob(res, type || 'image/png', 0.92));
  }
  window.Stamp = { STAMP_FONTS, DEFAULT_STAMP, fillTemplate, ensureFont, loadImage, drawStamp, renderStamped };
})();
