// Procedural textures and shared materials. Everything is generated at
// startup from canvases, so the game ships without image assets.

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

function canvas(size) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return c;
}

// Tileable value noise.
function makeNoise(size, cells, seed = 1) {
  const grid = new Float32Array(cells * cells);
  let s = seed * 9301 + 49297;
  for (let i = 0; i < grid.length; i++) {
    s = (s * 9301 + 49297) % 233280;
    grid[i] = s / 233280;
  }
  const at = (x, y) => grid[((y % cells) + cells) % cells * cells + (((x % cells) + cells) % cells)];
  const out = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const fx = (x / size) * cells;
      const fy = (y / size) * cells;
      const ix = Math.floor(fx);
      const iy = Math.floor(fy);
      const tx = fx - ix;
      const ty = fy - iy;
      const sx = tx * tx * (3 - 2 * tx);
      const sy = ty * ty * (3 - 2 * ty);
      const a = at(ix, iy) + (at(ix + 1, iy) - at(ix, iy)) * sx;
      const b = at(ix, iy + 1) + (at(ix + 1, iy + 1) - at(ix, iy + 1)) * sx;
      out[y * size + x] = a + (b - a) * sy;
    }
  }
  return out;
}

function fbm(size, base, octaves, seed) {
  const out = new Float32Array(size * size);
  let amp = 0.5;
  let total = 0;
  for (let o = 0; o < octaves; o++) {
    const n = makeNoise(size, base << o, seed + o * 17);
    for (let i = 0; i < out.length; i++) out[i] += n[i] * amp;
    total += amp;
    amp *= 0.5;
  }
  for (let i = 0; i < out.length; i++) out[i] /= total;
  return out;
}

function toTexture(c, srgb = true, repeat = true) {
  const t = new THREE.CanvasTexture(c);
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

function grayCanvas(size, fn) {
  const c = canvas(size);
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < size * size; i++) {
    const v = Math.max(0, Math.min(255, fn(i % size, Math.floor(i / size), i) * 255));
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

export function createTextures() {
  const S = 256;
  const n1 = fbm(S, 4, 4, 3);
  const n2 = fbm(S, 8, 3, 11);
  const fine = makeNoise(S, 64, 5);

  const wood = grayCanvas(S, (x, y, i) => {
    const warp = n1[i] * 6;
    const ring = Math.sin((x / S) * Math.PI * 2 * 7 + warp) * 0.5 + 0.5;
    const grain = fine[i] * 0.08;
    return 0.86 + ring * 0.1 + grain - n2[i] * 0.06;
  });
  const woodBump = grayCanvas(S, (x, y, i) => {
    const warp = n1[i] * 6;
    return Math.sin((x / S) * Math.PI * 2 * 7 + warp) * 0.5 + 0.5;
  });

  const felt = grayCanvas(S, (x, y, i) => 0.93 + fine[i] * 0.05 + n2[i] * 0.02);
  const plastic = grayCanvas(S, (x, y, i) => 0.96 + n1[i] * 0.04);
  const rough = grayCanvas(S, (x, y, i) => 0.55 + n2[i] * 0.3);

  const hazard = canvas(128);
  {
    const ctx = hazard.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = '#ff4d5e';
    for (let i = -2; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 32, 0);
      ctx.lineTo(i * 32 + 16, 0);
      ctx.lineTo(i * 32 + 16 + 128, 128);
      ctx.lineTo(i * 32 + 128, 128);
      ctx.fill();
    }
  }

  const blob = canvas(128);
  {
    const ctx = blob.getContext('2d');
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(0,0,0,0.55)');
    g.addColorStop(0.55, 'rgba(0,0,0,0.3)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  }

  return {
    wood: toTexture(wood),
    woodBump: toTexture(woodBump, false),
    felt: toTexture(felt),
    plastic: toTexture(plastic),
    rough: toTexture(rough, false),
    hazard: toTexture(hazard),
    blob: toTexture(blob, true, false),
  };
}

export function createMaterials(tex) {
  const toy = new THREE.MeshStandardMaterial({
    vertexColors: true, map: tex.plastic, roughness: 0.42, metalness: 0.0, roughnessMap: tex.rough,
  });
  const wood = new THREE.MeshStandardMaterial({
    vertexColors: true, map: tex.wood, bumpMap: tex.woodBump, bumpScale: 0.6, roughness: 0.7, metalness: 0,
  });
  const metal = new THREE.MeshStandardMaterial({
    vertexColors: true, map: tex.plastic, roughness: 0.32, metalness: 0.65,
  });
  const hazard = new THREE.MeshStandardMaterial({ map: tex.hazard, roughness: 0.4, metalness: 0.1 });
  const felt = new THREE.MeshStandardMaterial({ vertexColors: true, map: tex.felt, roughness: 0.95 });
  return { toy, wood, metal, hazard, felt, hub: wood };
}

// ---------------------------------------------------------------------------
// Geometry helpers

const _c = new THREE.Color();
const _c2 = new THREE.Color();

export function lighten(hex, amt) {
  return _c.set(hex).lerp(_c2.set('#ffffff'), amt).getHex();
}

// Rounded box with box-projected UVs (so textures don't stretch) and baked
// vertex colors: a lighter top, sides darkening toward the bottom.
export function blockGeometry(sx, sy, sz, opts = {}) {
  const minDim = Math.min(sx, sy, sz);
  const radius = Math.min(opts.radius ?? 0.22, minDim / 2 - 0.01);
  const g = new RoundedBoxGeometry(sx, sy, sz, opts.segments ?? 2, Math.max(0.01, radius));
  const pos = g.attributes.position;
  const nor = g.attributes.normal;
  const uv = g.attributes.uv;
  const colors = new Float32Array(pos.count * 3);
  const top = new THREE.Color(opts.top ?? opts.color ?? '#ffffff');
  const side = new THREE.Color(opts.color ?? '#ffffff');
  const bottomDark = opts.ao ?? 0.72;
  const uvs = opts.uvScale ?? 0.25;
  const fadeH = Math.min(sy, 3.5);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const nx = Math.abs(nor.getX(i)), ny = nor.getY(i), nz = Math.abs(nor.getZ(i));
    if (Math.abs(ny) >= nx && Math.abs(ny) >= nz) uv.setXY(i, x * uvs, z * uvs);
    else if (nx >= nz) uv.setXY(i, z * uvs, y * uvs);
    else uv.setXY(i, x * uvs, y * uvs);
    let col;
    if (ny > 0.55) {
      col = _c.copy(top);
    } else {
      // Darken toward the bottom over the top few meters (fake AO / grounding).
      const fromTop = sy / 2 - y;
      const t = Math.min(1, fromTop / fadeH);
      col = _c.copy(side).multiplyScalar(1 - (1 - bottomDark) * t);
      if (ny < -0.55) col.multiplyScalar(0.8);
    }
    colors[i * 3] = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return g;
}

// Builds a text texture for in-world signs.
export const FONT_STACK = 'Fredoka, "Trebuchet MS", system-ui, sans-serif';

// Break a line that is too wide at spaces (a single overlong word is split).
function wrapLine(ctx, line, max) {
  if (ctx.measureText(line).width <= max) return [line];
  const out = [];
  let cur = '';
  for (const tok of line.match(/\S+|\s+/g) || [line]) {
    const next = cur + tok;
    if (cur.trim() && ctx.measureText(next).width > max) {
      out.push(cur.trimEnd());
      cur = tok.trimStart();
    } else {
      cur = next;
    }
    while (ctx.measureText(cur).width > max && cur.length > 1) {
      let k = cur.length - 1;
      while (k > 1 && ctx.measureText(cur.slice(0, k)).width > max) k--;
      out.push(cur.slice(0, k));
      cur = cur.slice(k);
    }
  }
  if (cur.trim()) out.push(cur);
  return out.filter((l) => l.length);
}

export function textTexture(text, opts = {}) {
  let w = opts.width ?? 1024;
  const lineH = opts.lineHeight ?? 96;
  const font = `600 ${Math.round(lineH * 0.62)}px ${FONT_STACK}`;
  const measure = document.createElement('canvas').getContext('2d');
  measure.font = font;
  // fit: only as wide as the longest line, so short labels fill the sign.
  if (opts.fit) w = Math.min(w, Math.max(200, Math.ceil(Math.max(...String(text).split('\n').map((l) => measure.measureText(l).width)) + 110)));
  const lines = String(text).split('\n').flatMap((l) => wrapLine(measure, l, w - 90));
  const h = Math.max(1, lines.length) * lineH + 80;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  const r = 48;
  ctx.fillStyle = opts.bg ?? 'rgba(255, 250, 244, 0.94)';
  ctx.beginPath();
  ctx.roundRect(8, 8, w - 16, h - 16, r);
  ctx.fill();
  ctx.lineWidth = 10;
  ctx.strokeStyle = opts.border ?? '#ff8fab';
  ctx.stroke();
  ctx.fillStyle = opts.color ?? '#3a2b4f';
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (opts.glow) {
    ctx.shadowColor = opts.glow;
    ctx.shadowBlur = 24;
  }
  lines.forEach((l, i) => ctx.fillText(l, w / 2, 40 + lineH * (i + 0.5)));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return { texture: t, aspect: w / h };
}
