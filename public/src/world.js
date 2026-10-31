// Builds the playable world (meshes + colliders) from generated level data
// and animates everything that moves.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Collider } from './physics.js';
import { blockGeometry, lighten, textTexture } from './materials.js';
import { CHARACTERS } from '../shared/constants.js';
import { touchText } from './touch.js';

const POL_COLOR = { 1: new THREE.Color(CHARACTERS[0].color), '-1': new THREE.Color(CHARACTERS[1].color) };
const UP = new THREE.Vector3(0, 1, 0);
const smooth = (u) => u * u * (3 - 2 * u);
const _v = new THREE.Vector3();
const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3(1, 1, 1);
const FLAG_ON = new THREE.Color('#ffd166');
const FLAG_OFF = new THREE.Color('#f4f0ea');
const SIGN_STYLES = {
  horror: { bg: 'rgba(18, 14, 16, 0.94)', border: '#5a1414', color: '#e9e1d2' },
  paper: { bg: 'rgba(236, 226, 200, 0.97)', border: '#6e5d3e', color: '#2a2020' },
  chalk: { bg: 'rgba(30, 58, 44, 0.97)', border: '#6b4a2a', color: '#f1f1e6' },
  prank: { bg: 'rgba(255, 246, 200, 0.96)', border: '#ff5d8f', color: '#3a2b4f' },
};

export function moverTransform(m, t, out) {
  const mo = m.motion;
  if (mo.type === 'linear') {
    const u = (1 - Math.cos(2 * Math.PI * (t / mo.period + mo.phase))) / 2;
    out.x = mo.a[0] + (mo.b[0] - mo.a[0]) * u;
    out.y = mo.a[1] + (mo.b[1] - mo.a[1]) * u;
    out.z = mo.a[2] + (mo.b[2] - mo.a[2]) * u;
    out.yaw = m.yaw;
  } else if (mo.type === 'orbit') {
    const th = mo.phase + mo.speed * t;
    out.x = mo.center[0] + mo.radius * Math.cos(th);
    out.y = mo.center[1];
    out.z = mo.center[2] - mo.radius * Math.sin(th);
    out.yaw = m.yaw;
  } else {
    out.x = mo.center[0];
    out.y = mo.center[1];
    out.z = mo.center[2];
    out.yaw = mo.phase + mo.speed * t;
  }
  return out;
}

function glowMaterial(color, intensity = 1) {
  return new THREE.MeshStandardMaterial({
    color, emissive: color, emissiveIntensity: intensity, roughness: 0.35, metalness: 0.1,
  });
}

export class World {
  constructor(game, level) {
    this.game = game;
    this.level = level;
    this.theme = level.theme;
    this.physics = game.physics;
    this.mats = game.mats;
    this.tex = game.tex;
    this.group = new THREE.Group();
    game.scene.add(this.group);

    this.state = { sig: {}, act: {} };
    this.movers = [];
    this.acts = [];
    this.plates = new Map();
    this.switches = new Map();
    this.pads = [];
    this.seesaws = new Map();
    this.bouncers = new Map();
    this.fields = [];
    this.gems = new Map();
    this.checkpoints = [];
    this.wires = [];
    this.blinks = [];
    this.crumbles = new Map();
    this.pendulums = [];
    this.conveyors = [];
    this.fans = [];
    this.signs = [];
    this.time = 0;
    this.disposables = [];

    this.buildStatic();
    this.buildMovers();
    this.buildPlates();
    this.buildSwitches();
    this.buildActs();
    this.buildPads();
    this.buildSeesaws();
    this.buildBouncers();
    this.buildFields();
    this.buildGems();
    this.buildCheckpoints();
    this.buildGoal();
    this.buildSigns();
    this.buildWires();
    this.buildBlinks();
    this.buildCrumbles();
    this.buildPendulums();
    this.buildConveyors();
    this.buildFans();
  }

  track(o) {
    this.disposables.push(o);
    return o;
  }

  addMesh(geo, mat, parent = this.group, shadows = true) {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = shadows;
    m.receiveShadow = true;
    parent.add(m);
    this.track(geo);
    return m;
  }

  // -- static ---------------------------------------------------------------

  buildStatic() {
    const buckets = { toy: [], wood: [], metal: [] };
    const stitches = [];
    const th = this.theme;
    for (const s of this.level.solids) {
      let bucket, opts;
      if (s.mat === 'wood') {
        bucket = 'wood';
        opts = { color: s.color, top: lighten(s.color, 0.12), radius: 0.18 };
      } else if (s.mat === 'hub') {
        bucket = 'wood';
        opts = { color: th.wood, top: lighten(th.felt, 0.22), radius: 0.35, segments: 3 };
        this.hubStitches(s, stitches);
      } else if (s.mat === 'metal' || s.ice) {
        bucket = 'metal';
        opts = { color: s.color, top: lighten(s.color, 0.15), radius: 0.12 };
      } else {
        bucket = 'toy';
        opts = { color: s.color, top: lighten(s.color, 0.3), radius: 0.24 };
      }
      const g = blockGeometry(s.sx, s.sy, s.sz, opts);
      _q.setFromAxisAngle(UP, s.yaw);
      _m.compose(_v.set(s.x, s.y, s.z), _q, _s);
      g.applyMatrix4(_m);
      buckets[bucket].push(g);
      const c = new Collider(s.id, s.sx / 2, s.sy / 2, s.sz / 2);
      c.set(s.x, s.y, s.z, s.yaw);
      if (s.ice) c.ice = true;
      this.physics.add(c);
    }
    for (const [k, list] of Object.entries(buckets)) {
      if (!list.length) continue;
      const merged = mergeGeometries(list);
      list.forEach((g) => g.dispose());
      this.addMesh(merged, this.mats[k]);
    }
    if (stitches.length) {
      const geo = this.track(new THREE.BoxGeometry(0.28, 0.03, 0.07));
      const mat = this.track(new THREE.MeshStandardMaterial({ color: lighten(th.felt, 0.7), roughness: 0.8 }));
      const inst = new THREE.InstancedMesh(geo, mat, stitches.length);
      stitches.forEach((m, i) => inst.setMatrixAt(i, m));
      inst.receiveShadow = true;
      this.group.add(inst);
    }
  }

  hubStitches(s, out) {
    const inset = 0.55;
    const half = s.sx / 2 - inset;
    const y = s.y + s.sy / 2 + 0.01;
    const step = 0.55;
    for (let side = 0; side < 4; side++) {
      for (let d = -half + 0.2; d <= half - 0.2; d += step) {
        const lx = side === 0 ? d : side === 1 ? half : side === 2 ? -d : -half;
        const lz = side === 0 ? -half : side === 1 ? d : side === 2 ? half : -d;
        const rot = side % 2 === 0 ? 0 : Math.PI / 2;
        const m = new THREE.Matrix4();
        _q.setFromAxisAngle(UP, rot + s.yaw);
        const c = Math.cos(s.yaw), sn = Math.sin(s.yaw);
        m.compose(new THREE.Vector3(s.x + lx * c + lz * sn, y, s.z - lx * sn + lz * c), _q.clone(), _s);
        out.push(m);
      }
    }
  }

  // -- movers ---------------------------------------------------------------

  buildMovers() {
    for (const m of this.level.movers) {
      const hazard = m.mat === 'hazard';
      const geo = blockGeometry(m.sx, m.sy, m.sz, {
        color: m.color, top: lighten(m.color, 0.3), radius: Math.min(0.3, Math.min(m.sx, m.sy, m.sz) / 2 - 0.02), uvScale: hazard ? 1 : 0.25,
      });
      const mat = hazard ? this.mats.hazard : this.mats.toy;
      const mesh = this.addMesh(geo, mat);
      const c = new Collider(m.id, m.sx / 2, m.sy / 2, m.sz / 2, { dynamic: true, kind: 'mover', hazard: m.hazard });
      this.physics.add(c);
      const tf = moverTransform(m, 0, {});
      c.set(tf.x, tf.y, tf.z, tf.yaw);
      c.beginMove();
      mesh.position.set(tf.x, tf.y, tf.z);
      mesh.rotation.y = tf.yaw;
      // Little "engine" glow under moving platforms reads well from above.
      if (!hazard) {
        const glow = new THREE.Mesh(
          this.track(new THREE.CylinderGeometry(0.35, 0.5, 0.18, 20)),
          this.track(glowMaterial(lighten(m.color, 0.4), 1.4)),
        );
        glow.position.y = -m.sy / 2 - 0.06;
        mesh.add(glow);
      }
      this.movers.push({ def: m, mesh, c, tf });
    }
  }

  // -- plates / switches ------------------------------------------------------

  buildPlates() {
    const baseGeo = this.track(blockGeometry(2.7, 0.2, 2.7, { color: '#6b6378', top: '#7d748c', radius: 0.08 }));
    const topGeo = this.track(blockGeometry(2.2, 0.16, 2.2, { color: '#ffd166', top: '#ffe08a', radius: 0.07 }));
    for (const p of this.level.plates) {
      const g = new THREE.Group();
      g.position.set(p.x, p.y, p.z);
      g.rotation.y = p.yaw;
      const base = new THREE.Mesh(baseGeo, this.mats.metal);
      base.position.y = -0.04;
      base.receiveShadow = true;
      g.add(base);
      const mat = this.track(new THREE.MeshStandardMaterial({
        vertexColors: true, roughness: 0.3, metalness: 0.2, emissive: '#ffb703', emissiveIntensity: 0,
      }));
      const top = new THREE.Mesh(topGeo, mat);
      top.position.y = 0.1;
      top.castShadow = true;
      top.receiveShadow = true;
      g.add(top);
      // Arrow ring marker
      const ring = new THREE.Mesh(
        this.track(new THREE.RingGeometry(0.55, 0.72, 32)),
        this.track(new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.7, depthWrite: false })),
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.19;
      top.add(ring);
      this.group.add(g);
      const c = new Collider(p.id, 1.2, 0.12, 1.2, { kind: 'plate', ref: p });
      c.set(p.x, p.y, p.z, p.yaw);
      this.physics.add(c);
      this.plates.set(p.id, { def: p, group: g, top, mat, ring, press: 0, localOn: false });
    }
  }

  buildSwitches() {
    const baseGeo = this.track(new THREE.CylinderGeometry(0.85, 0.95, 0.32, 32));
    const capGeo = this.track(new THREE.CylinderGeometry(0.62, 0.66, 0.34, 32));
    for (const w of this.level.switches) {
      const g = new THREE.Group();
      g.position.set(w.x, w.y, w.z);
      const base = new THREE.Mesh(baseGeo, this.track(new THREE.MeshStandardMaterial({ color: '#5d5670', roughness: 0.4, metalness: 0.5 })));
      base.position.y = 0.16;
      base.castShadow = base.receiveShadow = true;
      g.add(base);
      const color = w.color || (w.latch ? '#ff6b9a' : '#ffb347');
      const mat = this.track(new THREE.MeshStandardMaterial({ color, roughness: 0.3, emissive: color, emissiveIntensity: 0.15 }));
      const cap = new THREE.Mesh(capGeo, mat);
      cap.position.y = 0.48;
      cap.castShadow = true;
      g.add(cap);
      // Downward chevron hint floating above.
      const hint = new THREE.Mesh(
        this.track(new THREE.ConeGeometry(0.22, 0.4, 4)),
        this.track(new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.85 })),
      );
      hint.rotation.x = Math.PI;
      hint.position.y = 1.8;
      g.add(hint);
      this.group.add(g);
      const c = new Collider(w.id, 0.72, 0.32, 0.72, { kind: 'switch', ref: w });
      c.set(w.x, w.y + 0.32, w.z);
      this.physics.add(c);
      this.switches.set(w.id, { def: w, group: g, cap, mat, hint, press: 0, flash: 0 });
    }
  }

  // -- actuators --------------------------------------------------------------

  buildActs() {
    for (const a of this.level.acts) {
      const parts = a.parts.map((p, i) => {
        const len = Math.hypot(...p.move);
        const mat = a.mat === 'toy' ? this.mats.toy : this.mats.metal;
        const geo = blockGeometry(p.sx, p.sy, p.sz, {
          color: a.color, top: lighten(a.color, 0.3), radius: Math.min(0.14, Math.min(p.sx, p.sy, p.sz) / 2 - 0.02),
        });
        const mesh = this.addMesh(geo, mat);
        mesh.position.set(p.x, p.y, p.z);
        mesh.rotation.y = p.yaw;
        if (a.style === 'lift') {
          const col = new THREE.Mesh(
            this.track(new THREE.CylinderGeometry(0.4, 0.4, 24, 16)),
            this.mats.metal,
          );
          col.position.y = -12 - p.sy / 2;
          col.castShadow = true;
          mesh.add(col);
          const stripe = new THREE.Mesh(
            this.track(blockGeometry(p.sx * 0.98, 0.06, p.sz * 0.98, { color: '#ffd166', radius: 0.02 })),
            this.mats.toy,
          );
          stripe.position.y = p.sy / 2 + 0.01;
          stripe.scale.set(0.5, 1, 0.5);
          mesh.add(stripe);
        }
        if (a.style === 'door') {
          // Porthole window
          const win = new THREE.Mesh(
            this.track(new THREE.CircleGeometry(Math.min(0.7, p.sx * 0.15), 32)),
            this.track(new THREE.MeshStandardMaterial({ color: '#bfe9ff', roughness: 0.05, metalness: 0.3, emissive: '#5ab4ff', emissiveIntensity: 0.3 })),
          );
          win.position.set(0, p.sy * 0.15, p.sz / 2 + 0.01);
          mesh.add(win);
          const win2 = win.clone();
          win2.position.z = -p.sz / 2 - 0.01;
          win2.rotation.y = Math.PI;
          mesh.add(win2);
        }
        const c = new Collider(`${a.id}#${i}`, p.sx / 2, p.sy / 2, p.sz / 2, { dynamic: true, kind: 'act' });
        c.set(p.x, p.y, p.z, p.yaw);
        c.beginMove();
        this.physics.add(c);
        return { def: p, mesh, c, u: 0, len: Math.max(0.01, len), wait: 0 };
      });
      // Indicator lamp
      const lampMat = this.track(new THREE.MeshStandardMaterial({ color: '#555066', emissive: '#7cff9e', emissiveIntensity: 0, roughness: 0.2 }));
      const lamp = new THREE.Mesh(this.track(new THREE.SphereGeometry(0.22, 20, 14)), lampMat);
      lamp.position.set(a.x, a.y, a.z);
      this.group.add(lamp);
      // Bridges wait far below the gap and steps wait inside the cliff; hide
      // them (and their colliders) until they start moving.
      const hideWhenDown = a.style === 'bridge' || a.style === 'steps';
      this.acts.push({ def: a, parts, on: 0, lamp, lampMat, hideWhenDown });
    }
  }

  // -- magnets ----------------------------------------------------------------

  buildPads() {
    const discGeo = this.track(new THREE.CylinderGeometry(1.0, 1.08, 0.16, 40));
    const faceGeo = this.track(new THREE.CylinderGeometry(0.82, 0.82, 0.04, 40));
    const ringGeo = this.track(new THREE.TorusGeometry(1.15, 0.05, 8, 48));
    const barGeo = this.track(new THREE.BoxGeometry(0.9, 0.05, 0.22));
    for (const p of this.level.pads) {
      const col = POL_COLOR[p.pol];
      const g = new THREE.Group();
      g.position.set(p.x, p.y, p.z);
      const n = _v.set(...p.n).normalize();
      g.quaternion.setFromUnitVectors(UP, n);
      const disc = new THREE.Mesh(discGeo, this.mats.metal);
      disc.castShadow = disc.receiveShadow = true;
      g.add(disc);
      const faceMat = this.track(glowMaterial(col, 0.6));
      const face = new THREE.Mesh(faceGeo, faceMat);
      face.position.y = 0.09;
      g.add(face);
      const symMat = this.track(new THREE.MeshBasicMaterial({ color: '#ffffff' }));
      const bar = new THREE.Mesh(barGeo, symMat);
      bar.position.y = 0.12;
      g.add(bar);
      if (p.pol > 0) {
        const bar2 = bar.clone();
        bar2.rotation.y = Math.PI / 2;
        g.add(bar2);
      }
      const ringMat = this.track(new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.6, depthWrite: false }));
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.1;
      g.add(ring);
      if (p.launch && (Math.abs(p.launch[0]) > 0.1 || Math.abs(p.launch[2]) > 0.1)) {
        // Cannon: an arrow showing where it fires.
        const dir = new THREE.Vector3(...p.launch).normalize();
        const arrow = new THREE.Group();
        const shaft = new THREE.Mesh(this.track(new THREE.CylinderGeometry(0.09, 0.09, 1.2, 10)), symMat);
        shaft.position.y = 0.6;
        const head = new THREE.Mesh(this.track(new THREE.ConeGeometry(0.26, 0.5, 14)), faceMat);
        head.position.y = 1.4;
        arrow.add(shaft, head);
        arrow.position.set(p.x, p.y + 0.2, p.z);
        arrow.quaternion.setFromUnitVectors(UP, dir);
        this.group.add(arrow);
      }
      this.group.add(g);
      if (p.n[1] > 0.5) {
        const c = new Collider(p.id, 0.95, 0.08, 0.95, { kind: 'pad', ref: p });
        c.set(p.x, p.y, p.z);
        this.physics.add(c);
      }
      const pad = { ...p, pos: new THREE.Vector3(p.x, p.y, p.z), normal: new THREE.Vector3(...p.n), group: g, ring, faceMat, ringMat, glow: 0, highlight: 0 };
      this.pads.push(pad);
    }
  }

  // -- seesaws / bouncers / fields --------------------------------------------

  buildSeesaws() {
    for (const e of this.level.seesaws) {
      const g = new THREE.Group();
      g.position.set(e.x, e.y, e.z);
      g.rotation.y = e.yaw;
      this.group.add(g);
      // The plank sits 1 m above the floor; the pivot fills the space beneath it.
      const pivotH = 0.66;
      const pivot = new THREE.Mesh(this.track(new THREE.CylinderGeometry(0.12, 0.8, pivotH, 3)), this.mats.metal);
      pivot.rotation.y = Math.PI / 2;
      pivot.position.y = -0.35 - pivotH / 2;
      pivot.castShadow = true;
      g.add(pivot);
      const plank = new THREE.Group();
      g.add(plank);
      const color = this.theme.blocks[(e.id.length + 2) % this.theme.blocks.length];
      const board = this.addMesh(blockGeometry(e.len, 0.35, e.w, { color, top: lighten(color, 0.3), radius: 0.12 }), this.mats.toy, plank);
      board.position.y = -0.175;
      for (const side of [-1, 1]) {
        const tag = new THREE.Mesh(
          this.track(new THREE.CircleGeometry(0.45, 32)),
          this.track(new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.85 })),
        );
        tag.rotation.x = -Math.PI / 2;
        tag.position.set(side * (e.len / 2 - 0.8), 0.01, 0);
        plank.add(tag);
      }
      // Each half is a collider that rises and sinks with the plank, so whoever
      // stands on it rides the tilt.
      const ends = {};
      for (const [end, side] of [['A', -1], ['B', 1]]) {
        const hx = e.len / 4 - 0.05;
        const lx = side * (e.len / 4 + 0.05);
        const c = Math.cos(e.yaw), s = Math.sin(e.yaw);
        const col = new Collider(`${e.id}:${end}`, hx, 0.175, e.w / 2, { kind: 'seesaw', dynamic: true, ref: { seesaw: e.id, end } });
        col.set(e.x + lx * c, e.y - 0.175, e.z - lx * s, e.yaw);
        col.beginMove();
        col.baseY = e.y - 0.175;
        col.side = side;
        this.physics.add(col);
        ends[end] = col;
      }
      // Furthest the plank can tip before an end would touch the floor
      // (plank top is 1 m up, 0.35 m thick).
      const maxTilt = Math.asin(Math.min(0.9, (1.0 - 0.35 - 0.06) / (e.len / 2)));
      this.seesaws.set(e.id, { def: e, group: g, plank, tilt: 0, tiltV: 0, kickT: 0, kickDir: 0, maxTilt, ends });
    }
  }

  buildBouncers() {
    for (const b of this.level.bouncers) {
      const g = new THREE.Group();
      g.position.set(b.x, b.y, b.z);
      this.group.add(g);
      const color = b.tint || this.theme.blocks[(b.id.charCodeAt(b.id.length - 1)) % this.theme.blocks.length];
      const body = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(b.r, b.r * 0.94, 0.7, 40)),
        this.track(new THREE.MeshStandardMaterial({ color, roughness: 0.35 })),
      );
      body.position.y = -0.35;
      body.castShadow = body.receiveShadow = true;
      g.add(body);
      const skinGroup = new THREE.Group();
      g.add(skinGroup);
      const skin = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(b.r * 0.96, b.r * 0.96, 0.06, 40)),
        this.track(new THREE.MeshStandardMaterial({ color: '#fff8ee', roughness: 0.6 })),
      );
      skin.position.y = 0.0;
      skin.receiveShadow = true;
      skinGroup.add(skin);
      const rim = new THREE.Mesh(
        this.track(new THREE.TorusGeometry(b.r, 0.08, 10, 40)),
        this.track(new THREE.MeshStandardMaterial({ color: '#ffd166', metalness: 0.6, roughness: 0.25 })),
      );
      rim.rotation.x = Math.PI / 2;
      rim.position.y = 0.02;
      g.add(rim);
      // Zig-zag cords on the drum body
      const cordMat = this.track(new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.5 }));
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const cord = new THREE.Mesh(this.track(new THREE.CylinderGeometry(0.03, 0.03, 0.78, 6)), cordMat);
        cord.position.set(Math.cos(a) * b.r * 1.0, -0.35, Math.sin(a) * b.r * 1.0);
        cord.rotation.z = 0.5 * (i % 2 ? 1 : -1);
        cord.rotation.y = -a;
        g.add(cord);
      }
      const c = new Collider(b.id, b.r * 0.82, 0.35, b.r * 0.82, { kind: 'bounce', ref: b, dynamic: !!b.move });
      c.set(b.x, b.y - 0.35, b.z);
      this.physics.add(c);
      this.bouncers.set(b.id, { def: b, group: g, skinGroup, squash: 0, squashV: 0, c, u: 0, show: 1 });
    }
  }

  buildFields() {
    for (const f of this.level.fields) {
      const col = POL_COLOR[f.pol];
      const mat = this.track(new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uColor: { value: col.clone() }, uSize: { value: new THREE.Vector2(f.sx, f.sy) } },
        vertexShader: `
          varying vec2 vUv;
          void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
        `,
        fragmentShader: `
          uniform float uTime; uniform vec3 uColor; uniform vec2 uSize;
          varying vec2 vUv;
          void main() {
            vec2 p = vUv * uSize;
            float lines = smoothstep(0.92, 1.0, sin(p.y * 6.0 - uTime * 3.0) * 0.5 + 0.5);
            vec2 h = abs(fract(p * vec2(0.9, 1.04) + vec2(0.0, uTime * 0.1)) - 0.5);
            float hex = smoothstep(0.42, 0.5, max(h.x * 1.6, h.y + h.x * 0.5));
            float edge = smoothstep(0.08, 0.0, min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y)) * 4.0);
            float a = 0.10 + lines * 0.22 + hex * 0.18 + edge * 0.6;
            gl_FragColor = vec4(uColor * a * 1.6, a);
          }
        `,
      }));
      const mesh = new THREE.Mesh(this.track(new THREE.PlaneGeometry(f.sx, f.sy)), mat);
      mesh.position.set(f.x, f.y, f.z);
      mesh.rotation.y = f.yaw;
      this.group.add(mesh);
      const c = new Collider(f.id, f.sx / 2, f.sy / 2, Math.max(0.2, f.sz / 2), {
        kind: 'field', filter: (ctx) => ctx.pol !== f.pol, noCamera: true,
      });
      c.set(f.x, f.y, f.z, f.yaw);
      this.physics.add(c);
      this.fields.push({ def: f, mesh, mat });
    }
  }

  // -- pickups, checkpoints, goal -----------------------------------------------

  buildGems() {
    const bodyGeo = this.track(new THREE.CylinderGeometry(0.38, 0.38, 0.12, 32));
    const rimGeo = this.track(new THREE.TorusGeometry(0.38, 0.06, 10, 32));
    const holeGeo = this.track(new THREE.CylinderGeometry(0.06, 0.06, 0.14, 12));
    const mat = this.track(new THREE.MeshStandardMaterial({ color: '#ffcf4d', metalness: 0.75, roughness: 0.22, emissive: '#ff9f1c', emissiveIntensity: 0.35 }));
    const holeMat = this.track(new THREE.MeshStandardMaterial({ color: '#7a4a12', roughness: 0.6 }));
    for (const gdef of this.level.gems) {
      const g = new THREE.Group();
      g.position.set(gdef.x, gdef.y, gdef.z);
      const inner = new THREE.Group();
      inner.rotation.x = Math.PI / 2;
      g.add(inner);
      const body = new THREE.Mesh(bodyGeo, mat);
      body.castShadow = true;
      inner.add(body);
      const rim = new THREE.Mesh(rimGeo, mat);
      rim.rotation.x = Math.PI / 2;
      inner.add(rim);
      for (const [hx, hz] of [[-0.11, -0.11], [0.11, -0.11], [-0.11, 0.11], [0.11, 0.11]]) {
        const h = new THREE.Mesh(holeGeo, holeMat);
        h.position.set(hx, 0, hz);
        inner.add(h);
      }
      this.group.add(g);
      this.gems.set(gdef.id, { def: gdef, group: g, taken: false, anim: 0, phase: Math.random() * 6 });
    }
  }

  buildCheckpoints() {
    const poleGeo = this.track(new THREE.CylinderGeometry(0.07, 0.09, 3.2, 10));
    const knobGeo = this.track(new THREE.SphereGeometry(0.16, 16, 12));
    const bulbGeo = this.track(new THREE.SphereGeometry(0.13, 16, 12));
    for (const cp of this.level.checkpoints) {
      const entry = { def: cp, reached: [false, false], flag: null, bulbs: [] };
      if (cp.flag) {
        const g = new THREE.Group();
        g.position.set(...cp.flag);
        const pole = new THREE.Mesh(poleGeo, this.mats.metal);
        pole.position.y = 1.6;
        pole.castShadow = true;
        g.add(pole);
        const knob = new THREE.Mesh(knobGeo, this.track(new THREE.MeshStandardMaterial({ color: '#ffd166', metalness: 0.7, roughness: 0.2 })));
        knob.position.y = 3.25;
        g.add(knob);
        const flagGeo = this.track(new THREE.PlaneGeometry(1.3, 0.85, 12, 4));
        flagGeo.translate(0.65, 0, 0);
        const flagMat = this.track(new THREE.MeshStandardMaterial({ color: '#f4f0ea', side: THREE.DoubleSide, roughness: 0.8 }));
        const flag = new THREE.Mesh(flagGeo, flagMat);
        flag.position.y = 2.7;
        flag.castShadow = true;
        g.add(flag);
        CHARACTERS.forEach((ch, i) => {
          const m = this.track(new THREE.MeshStandardMaterial({ color: '#5a5468', emissive: ch.color, emissiveIntensity: 0, roughness: 0.3 }));
          const b = new THREE.Mesh(bulbGeo, m);
          b.position.set(i === 0 ? -0.2 : 0.2, 0.25, 0);
          g.add(b);
          entry.bulbs.push(m);
        });
        g.rotation.y = cp.yaw;
        this.group.add(g);
        entry.flag = { mesh: flag, mat: flagMat, base: flagGeo.attributes.position.array.slice() };
      }
      this.checkpoints.push(entry);
    }
  }

  buildGoal() {
    const gl = this.level.goal;
    for (const fake of this.level.fakeGoals || []) this.goalArch(fake);
    if (!gl) return;
    if (gl.style === 'exit') {
      this.goal = this.exitDoor(gl);
      return;
    }
    this.goal = this.goalArch(gl);
  }

  // Horror levels end at a glowing exit door instead of a rainbow arch.
  exitDoor(gl) {
    const g = new THREE.Group();
    g.position.set(gl.x, gl.y, gl.z);
    g.rotation.y = gl.yaw;
    this.group.add(g);
    const frameMat = this.track(new THREE.MeshStandardMaterial({ color: '#2a2a2a', roughness: 0.6, metalness: 0.4 }));
    for (const x of [-1.6, 1.6]) {
      const post = this.addMesh(new THREE.BoxGeometry(0.3, 3.6, 0.3), frameMat, g);
      post.position.set(x, 1.8, 2.4);
    }
    const top = this.addMesh(new THREE.BoxGeometry(3.5, 0.3, 0.3), frameMat, g);
    top.position.set(0, 3.6, 2.4);
    const discMat = this.track(new THREE.MeshBasicMaterial({ color: '#9dffb5', transparent: true, opacity: 0.4, depthWrite: false }));
    const disc = new THREE.Mesh(this.track(new THREE.CircleGeometry(3.3, 48)), discMat);
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = 0.03;
    g.add(disc);
    const ringMat = this.track(new THREE.MeshBasicMaterial({ color: '#7dffa0', transparent: true, opacity: 0.8, depthWrite: false }));
    const ring = new THREE.Mesh(this.track(new THREE.RingGeometry(3.2, 3.45, 64)), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.04;
    g.add(ring);
    const tex = textTexture('EXIT', { width: 512, lineHeight: 140, bg: 'rgba(10, 60, 25, 0.95)', border: '#7dffa0', color: '#d8ffe2' });
    this.track(tex.texture);
    const banner = this.twoSided(tex, 2.2);
    banner.position.set(0, 4.3, 2.4);
    g.add(banner);
    const glow = new THREE.PointLight('#7dffa0', 14, 9, 2);
    glow.position.set(0, 2.5, 2);
    g.add(glow);
    return { def: gl, group: g, disc, discMat, ring, ringMat, banner };
  }

  // A sign that reads the right way round from both sides (a single
  // double-sided plane shows its text mirrored from the back).
  twoSided(tex, w) {
    const g = new THREE.Group();
    const geo = this.track(new THREE.PlaneGeometry(w, w / tex.aspect));
    const mat = this.track(new THREE.MeshBasicMaterial({ map: tex.texture, transparent: true }));
    const front = new THREE.Mesh(geo, mat);
    const back = new THREE.Mesh(geo, mat);
    back.rotation.y = Math.PI;
    back.position.z = -0.01;
    g.add(front, back);
    return g;
  }

  goalArch(gl) {
    const g = new THREE.Group();
    g.position.set(gl.x, gl.y, gl.z);
    g.rotation.y = gl.yaw;
    this.group.add(g);
    const archColors = this.theme.blocks;
    // Rainbow arch made of stacked toy arcs.
    for (let i = 0; i < 5; i++) {
      const r = 4.6 - i * 0.42;
      const arc = new THREE.Mesh(
        this.track(new THREE.TorusGeometry(r, 0.21, 12, 48, Math.PI)),
        this.track(new THREE.MeshStandardMaterial({ color: archColors[i % archColors.length], roughness: 0.4 })),
      );
      arc.position.set(0, 0, 2.4);
      arc.castShadow = true;
      g.add(arc);
    }
    const discMat = this.track(new THREE.MeshBasicMaterial({ color: '#fff3b0', transparent: true, opacity: 0.55, depthWrite: false }));
    const disc = new THREE.Mesh(this.track(new THREE.CircleGeometry(3.3, 48)), discMat);
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = 0.03;
    g.add(disc);
    const ringMat = this.track(new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.8, depthWrite: false }));
    const ring = new THREE.Mesh(this.track(new THREE.RingGeometry(3.2, 3.45, 64)), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.04;
    g.add(ring);
    const tex = textTexture('FINISH', { width: 512, lineHeight: 140, border: '#ffd166' });
    this.track(tex.texture);
    const banner = this.twoSided(tex, 2.6);
    banner.position.set(0, 5.2, 2.4);
    g.add(banner);
    return { def: gl, group: g, disc, discMat, ring, ringMat, banner };
  }

  buildSigns() {
    for (const s of this.level.signs) {
      if (s.style === 'uv') continue; // drawn by Extras: only visible in a flashlight beam
      const text = this.game.app && this.game.app.input.usingTouch ? touchText(s.text) : s.text;
      const { texture, aspect } = textTexture(text, s.fit ? { ...(SIGN_STYLES[s.style] || {}), fit: true } : SIGN_STYLES[s.style] || {});
      this.track(texture);
      const w = s.w || 5.6;
      // Dark-level posters are lit like everything else; floating signs glow.
      const Mat = s.fixed ? THREE.MeshStandardMaterial : THREE.MeshBasicMaterial;
      const mesh = new THREE.Mesh(
        this.track(new THREE.PlaneGeometry(w, w / aspect)),
        this.track(new Mat({ map: texture, transparent: true, side: THREE.DoubleSide, fog: !!s.fixed, ...(s.fixed ? { roughness: 0.9, emissive: '#ffffff', emissiveMap: texture, emissiveIntensity: 0.08 } : {}) })),
      );
      mesh.position.set(s.x, s.y, s.z);
      if (s.fixed) mesh.rotation.y = s.yaw;
      this.group.add(mesh);
      this.signs.push({ mesh, baseY: s.y, phase: Math.random() * 6, fixed: !!s.fixed });
    }
  }

  buildWires() {
    for (const w of this.level.wires) {
      const mat = this.track(new THREE.MeshStandardMaterial({ color: '#4b4458', emissive: '#ffcf4d', emissiveIntensity: 0, roughness: 0.5 }));
      for (let i = 0; i < w.pts.length - 1; i++) {
        const a = new THREE.Vector3(...w.pts[i]);
        const b = new THREE.Vector3(...w.pts[i + 1]);
        const len = a.distanceTo(b);
        if (len < 0.01) continue;
        const m = new THREE.Mesh(this.track(new THREE.BoxGeometry(0.16, 0.04, len + 0.16)), mat);
        m.position.copy(a).add(b).multiplyScalar(0.5);
        m.position.y += 0.02;
        m.rotation.y = Math.atan2(b.x - a.x, b.z - a.z);
        m.receiveShadow = true;
        this.group.add(m);
      }
      this.wires.push({ sig: w.sig, mat, glow: 0 });
    }
  }

  // -- timing & hazards ----------------------------------------------------------

  buildBlinks() {
    const colors = ['#ff6fae', '#3fd6c6'];
    for (const b of this.level.blinks) {
      const color = colors[b.group];
      const mat = this.track(new THREE.MeshStandardMaterial({
        color, emissive: color, emissiveIntensity: 0.25, roughness: 0.35, transparent: true, map: this.tex.plastic,
      }));
      const mesh = this.addMesh(blockGeometry(b.sx, b.sy, b.sz, { color: '#ffffff', top: '#ffffff', radius: 0.2 }), mat);
      mesh.position.set(b.x, b.y, b.z);
      mesh.rotation.y = b.yaw;
      // A bright outline so ghosted blocks still read.
      const edges = new THREE.LineSegments(
        this.track(new THREE.EdgesGeometry(new THREE.BoxGeometry(b.sx, b.sy, b.sz))),
        this.track(new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.9 })),
      );
      mesh.add(edges);
      const c = new Collider(b.id, b.sx / 2, b.sy / 2, b.sz / 2, { kind: 'blink' });
      c.set(b.x, b.y, b.z, b.yaw);
      this.physics.add(c);
      this.blinks.push({ def: b, mesh, mat, edges, c, op: 1 });
    }
  }

  buildCrumbles() {
    for (const r of this.level.crumbles) {
      const base = lighten(this.theme.wood, 0.25);
      const mat = this.track(this.mats.wood.clone());
      mat.transparent = true;
      // Thin ice (r.ice): pale blue, and slippery like the rest of the ice.
      const mesh = this.addMesh(blockGeometry(r.sx, r.sy, r.sz, r.ice ? { color: '#bfe6ff', top: '#e6f7ff', radius: 0.16 } : { color: this.theme.wood, top: base, radius: 0.16 }), mat);
      mesh.position.set(r.x, r.y, r.z);
      mesh.rotation.y = r.yaw;
      // Cracks on top.
      const crackMat = this.track(new THREE.MeshBasicMaterial({ color: '#5a3b22', transparent: true, opacity: 0.55 }));
      for (let i = 0; i < 3; i++) {
        const crack = new THREE.Mesh(this.track(new THREE.PlaneGeometry(r.sx * (0.4 + i * 0.15), 0.05)), crackMat);
        crack.rotation.set(-Math.PI / 2, 0, (i - 1) * 0.9 + 0.3);
        crack.position.y = r.sy / 2 + 0.012;
        mesh.add(crack);
      }
      const c = new Collider(r.id, r.sx / 2, r.sy / 2, r.sz / 2, { kind: 'crumble' });
      c.set(r.x, r.y, r.z, r.yaw);
      if (r.ice) c.ice = true;
      this.physics.add(c);
      this.crumbles.set(r.id, { def: r, mesh, mat, c, phase: 'idle', t: 0 });
    }
  }

  buildPendulums() {
    for (const h of this.level.pendulums) {
      const pivot = new THREE.Group();
      pivot.position.set(h.x, h.y, h.z);
      pivot.rotation.y = h.yaw;
      this.group.add(pivot);
      const swing = new THREE.Group();
      pivot.add(swing);
      const arm = new THREE.Mesh(this.track(new THREE.CylinderGeometry(0.11, 0.11, h.len, 10)), this.mats.metal);
      arm.position.y = -h.len / 2;
      arm.castShadow = true;
      swing.add(arm);
      const head = this.addMesh(blockGeometry(h.hx * 2, h.hy * 2, h.hz * 2, { radius: 0.3, uvScale: 1 }), this.mats.hazard, swing);
      head.position.y = -h.len;
      head.rotation.y = 0;
      for (const side of [-1, 1]) {
        const cap = new THREE.Mesh(this.track(new THREE.CylinderGeometry(h.hy * 0.9, h.hy * 0.9, 0.22, 24)), this.mats.metal);
        cap.rotation.x = Math.PI / 2;
        cap.position.set(0, -h.len, side * (h.hz + 0.08));
        swing.add(cap);
      }
      const c = new Collider(h.id, h.hx, h.hy, h.hz, { dynamic: true, kind: 'mover', hazard: 'push' });
      c.set(h.x, h.y - h.len, h.z, h.yaw);
      c.beginMove();
      this.physics.add(c);
      this.pendulums.push({ def: h, swing, c });
    }
  }

  buildConveyors() {
    const slatGeo = this.track(new THREE.BoxGeometry(1, 0.07, 0.22));
    const slatMat = this.track(new THREE.MeshStandardMaterial({ color: '#ffd166', roughness: 0.5 }));
    for (const v of this.level.conveyors) {
      const g = new THREE.Group();
      g.position.set(v.x, v.y, v.z);
      g.rotation.y = v.yaw;
      this.group.add(g);
      this.addMesh(blockGeometry(v.sx, v.sy, v.sz, { color: '#3b3550', top: '#4b4566', radius: 0.12 }), this.mats.toy, g);
      // Belt direction relative to the box: along local x or z.
      const rel = v.beltYaw - v.yaw;
      const dx = Math.round(Math.sin(rel)), dz = Math.round(Math.cos(rel));
      const L = Math.abs(dx) * v.sx + Math.abs(dz) * v.sz;
      const W = Math.abs(dx) * v.sz + Math.abs(dz) * v.sx;
      const spacing = 0.75;
      const count = Math.floor(L / spacing);
      const inst = new THREE.InstancedMesh(slatGeo, slatMat, count);
      inst.receiveShadow = true;
      g.add(inst);
      for (const side of [-1, 1]) {
        const rail = this.addMesh(blockGeometry(dz ? 0.18 : L, 0.3, dz ? L : 0.18, { color: this.theme.metal, radius: 0.06 }), this.mats.metal, g);
        rail.position.set(dz ? side * (W / 2) : 0, v.sy / 2 + 0.1, dz ? 0 : side * (W / 2));
      }
      const c = new Collider(v.id, v.sx / 2, v.sy / 2, v.sz / 2, { kind: 'conveyor' });
      c.set(v.x, v.y, v.z, v.yaw);
      c.belt = new THREE.Vector3(Math.sin(v.beltYaw) * v.speed, 0, Math.cos(v.beltYaw) * v.speed);
      this.physics.add(c);
      this.conveyors.push({ def: v, inst, count, spacing, L, W, dx, dz, c, phase: 0 });
    }
  }

  buildFans() {
    for (const f of this.level.fans) {
      const g = new THREE.Group();
      g.position.set(f.x, f.y, f.z);
      this.group.add(g);
      const ring = new THREE.Mesh(this.track(new THREE.TorusGeometry(f.r, 0.14, 10, 40)), this.mats.metal);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.08;
      g.add(ring);
      const grill = new THREE.Mesh(this.track(new THREE.CircleGeometry(f.r, 40)), this.track(new THREE.MeshStandardMaterial({ color: '#2d2840', roughness: 0.8 })));
      grill.rotation.x = -Math.PI / 2;
      grill.position.y = 0.015;
      g.add(grill);
      const blades = new THREE.Group();
      blades.position.y = 0.06;
      const bladeMat = this.track(new THREE.MeshStandardMaterial({ color: '#e8eef8', roughness: 0.4, metalness: 0.3 }));
      for (let i = 0; i < 5; i++) {
        const blade = new THREE.Mesh(this.track(new THREE.BoxGeometry(f.r * 0.9, 0.04, 0.42)), bladeMat);
        blade.position.x = f.r * 0.45;
        const holder = new THREE.Group();
        holder.rotation.y = (i / 5) * Math.PI * 2;
        blade.rotation.x = 0.35;
        holder.add(blade);
        blades.add(holder);
      }
      g.add(blades);
      const colMat = this.track(new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uPower: { value: 0 }, uH: { value: f.h } },
        vertexShader: `
          varying vec2 vUv;
          void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
        `,
        fragmentShader: `
          uniform float uTime; uniform float uPower; uniform float uH;
          varying vec2 vUv;
          void main() {
            float streak = smoothstep(0.75, 1.0, sin(vUv.x * 60.0 + sin(vUv.y * 9.0) * 1.5) * 0.5 + 0.5);
            float flow = fract(vUv.y * uH * 0.25 - uTime * 1.6);
            float band = smoothstep(0.0, 0.2, flow) * smoothstep(1.0, 0.5, flow);
            float fade = smoothstep(0.0, 0.08, vUv.y) * smoothstep(1.0, 0.75, vUv.y);
            float a = (0.05 + streak * band * 0.35) * fade * uPower;
            gl_FragColor = vec4(vec3(0.85, 0.95, 1.0) * a * 1.6, a);
          }
        `,
      }));
      const col = new THREE.Mesh(this.track(new THREE.CylinderGeometry(f.r * 0.95, f.r, f.h, 28, 1, true)), colMat);
      col.position.y = f.h / 2;
      g.add(col);
      this.fans.push({ def: f, blades, colMat, power: f.when ? 0 : 1, emit: 0 });
    }
  }

  fanOn(f) {
    return !f.def.when || f.def.when.in.some((id) => this.sig(id));
  }

  // Upward acceleration at a point (0 when not in a running fan's column).
  windAt(p) {
    for (const f of this.fans) {
      if (f.power < 0.5) continue;
      const d = f.def;
      if (p.y < d.y - 0.6 || p.y > d.y + d.h) continue;
      if (Math.hypot(p.x - d.x, p.z - d.z) > d.r) continue;
      return d.strength;
    }
    return 0;
  }

  crumbleState(id) {
    const c = this.crumbles.get(id);
    return c ? c.phase : null;
  }

  // Start a tile crumbling. Returns true if it was intact.
  triggerCrumble(id) {
    const c = this.crumbles.get(id);
    if (!c || c.phase !== 'idle') return false;
    c.phase = 'shake';
    c.t = 0;
    return true;
  }

  updateMechanics(dt, t) {
    for (const b of this.blinks) {
      const per = b.def.period;
      const cyc = (((t / per) % 1) + 1) % 1;
      const firstHalf = cyc < 0.5;
      const solid = b.def.group === 0 ? firstHalf : !firstHalf;
      const remain = (firstHalf ? 0.5 - cyc : 1 - cyc) * per;
      b.c.enabled = solid;
      b.op += ((solid ? 1 : 0.14) - b.op) * Math.min(1, dt * 18);
      b.mat.opacity = b.op;
      b.mat.depthWrite = solid;
      b.mesh.castShadow = solid;
      const warn = solid && remain < 0.55;
      b.mat.emissiveIntensity = solid ? (warn ? (Math.sin(t * 38) > 0 ? 1.3 : 0.3) : 0.25) : 0.55;
      b.mesh.scale.setScalar(0.96 + 0.04 * b.op);
    }

    for (const c of this.crumbles.values()) {
      const d = c.def;
      c.t += dt;
      if (c.phase === 'shake') {
        c.mesh.position.set(d.x + (Math.random() - 0.5) * 0.09, d.y + (Math.random() - 0.5) * 0.05, d.z + (Math.random() - 0.5) * 0.09);
        if (c.t >= 0.55) {
          c.phase = 'fall';
          c.t = 0;
          c.c.enabled = false;
          this.game.audio?.play('crumble', this.game.spatial ? this.game.spatial(c.mesh.position) : {});
        }
      } else if (c.phase === 'fall') {
        c.mesh.position.set(d.x, d.y - 9 * c.t * c.t, d.z);
        c.mesh.rotation.x = c.t * 0.8;
        c.mat.opacity = Math.max(0, 1 - c.t / 0.8);
        if (c.t >= 0.8) {
          c.phase = 'gone';
          c.t = 0;
          c.mesh.visible = false;
        }
      } else if (c.phase === 'gone' && c.t >= 3.2) {
        c.phase = 'back';
        c.t = 0;
        c.mesh.visible = true;
        c.mesh.position.set(d.x, d.y, d.z);
        c.mesh.rotation.set(0, d.yaw, 0);
        c.mat.opacity = 1;
        c.c.enabled = true;
      } else if (c.phase === 'back') {
        const k = Math.min(1, c.t / 0.35);
        c.mesh.scale.setScalar(0.3 + 0.7 * (1 - Math.pow(1 - k, 3)));
        if (k >= 1) c.phase = 'idle';
      }
    }

    for (const p of this.pendulums) {
      const h = p.def;
      const th = h.amp * Math.sin(2 * Math.PI * (this.clock(p, t, dt) / h.period + h.phase));
      p.swing.rotation.z = th;
      const lx = h.len * Math.sin(th);
      p.c.beginMove();
      p.c.set(h.x + lx * Math.cos(h.yaw), h.y - h.len * Math.cos(th), h.z - lx * Math.sin(h.yaw), h.yaw);
      p.c.endMove(dt);
    }

    const m = _m;
    const q = _q;
    const one = _s;
    const pos = _v;
    for (const v of this.conveyors) {
      const d = v.def;
      // A belt with `flip` runs backwards while that signal is on.
      const dir = d.flip && this.sigAny(d.flip) ? -1 : 1;
      v.c.belt.set(Math.sin(d.beltYaw) * d.speed * dir, 0, Math.cos(d.beltYaw) * d.speed * dir);
      v.phase += dt * d.speed * dir;
      const shift = ((v.phase % v.spacing) + v.spacing) % v.spacing;
      q.setFromAxisAngle(UP, v.dz ? 0 : Math.PI / 2);
      const sx = v.W * 0.92;
      for (let i = 0; i < v.count; i++) {
        const along = -v.L / 2 + ((i * v.spacing + shift) % v.L);
        pos.set(v.dx * along, d.sy / 2 + 0.035, v.dz * along);
        m.compose(pos, q, one.set(sx, 1, 1));
        v.inst.setMatrixAt(i, m);
      }
      one.set(1, 1, 1);
      v.inst.instanceMatrix.needsUpdate = true;
    }

    for (const f of this.fans) {
      const on = this.fanOn(f);
      f.power += ((on ? 1 : 0) - f.power) * Math.min(1, dt * 3);
      f.blades.rotation.y += dt * (1.5 + 24 * f.power);
      f.colMat.uniforms.uTime.value = t;
      f.colMat.uniforms.uPower.value = f.power;
      if (f.power > 0.4 && this.game.fx) {
        f.emit += dt * 16 * f.power;
        while (f.emit > 1) {
          f.emit--;
          const a = Math.random() * Math.PI * 2, r = Math.random() * f.def.r * 0.85;
          this.game.fx.updraft(f.def.x + Math.cos(a) * r, f.def.y + 0.2, f.def.z + Math.sin(a) * r, f.def.h);
        }
      }
    }
  }

  // -- runtime -------------------------------------------------------------------

  applyState(state) {
    if (state.sig) this.state.sig = state.sig;
    if (state.act) this.state.act = state.act;
  }

  sig(id) {
    return this.state.sig[id] === 1;
  }

  // Called once per frame before players move. t = shared level time (s).
  // Movers and pendulums run on the shared clock. One with `stop` freezes while
  // that signal is on; one with `run` only moves while its signal is on. Those
  // keep their own clock, so they carry on from where they stopped.
  clock(o, t, dt) {
    const d = o.def;
    if (!d.stop && !d.run) return t;
    if (o.lt === undefined) {
      o.lt = 0;
      o.lastT = t;
    }
    const going = d.run ? this.sigAny(d.run) : !this.sigAny(d.stop);
    // Advance by the shared level time (not this screen's frame time, which is
    // clamped when the frame rate drops), so both players' copies stay in step.
    const step = Math.max(0, Math.min(0.5, t - o.lastT));
    o.lastT = t;
    if (going && t > 0) o.lt += step;
    return o.lt;
  }

  sigAny(s) {
    return Array.isArray(s) ? s.some((id) => this.sig(id)) : this.sig(s);
  }

  update(dt, t, camera) {
    this.time = t;
    for (const mv of this.movers) {
      mv.c.beginMove();
      moverTransform(mv.def, this.clock(mv, t, dt), mv.tf);
      mv.c.set(mv.tf.x, mv.tf.y, mv.tf.z, mv.tf.yaw);
      mv.c.endMove(dt);
      mv.mesh.position.set(mv.tf.x, mv.tf.y, mv.tf.z);
      mv.mesh.rotation.y = mv.tf.yaw;
    }

    for (const a of this.acts) {
      const on = this.state.act[a.def.id] === 1 ? 1 : 0;
      if (on && !a.on) for (const p of a.parts) p.wait = p.def.delay;
      a.on = on;
      for (const p of a.parts) {
        p.c.beginMove();
        if (on) {
          if (p.wait > 0) p.wait -= dt;
          else p.u = Math.min(1, p.u + (dt * a.def.speed) / p.len);
        } else {
          p.u = Math.max(0, p.u - (dt * a.def.speed) / p.len);
        }
        const k = smooth(p.u);
        const d = p.def;
        const x = d.x + d.move[0] * k, y = d.y + d.move[1] * k, z = d.z + d.move[2] * k;
        p.c.set(x, y, z, d.yaw);
        p.c.endMove(dt);
        p.mesh.position.set(x, y, z);
        if (a.hideWhenDown) {
          const up = p.u > 0;
          p.mesh.visible = up;
          p.c.enabled = up;
        }
      }
      a.lampMat.emissiveIntensity += ((on ? 2.4 : 0) - a.lampMat.emissiveIntensity) * Math.min(1, dt * 8);
    }

    for (const p of this.plates.values()) {
      const on = this.sig(p.def.id) || p.localOn;
      p.press += ((on ? 1 : 0) - p.press) * Math.min(1, dt * 14);
      p.top.position.y = 0.1 - p.press * 0.09;
      p.mat.emissiveIntensity = p.press * 1.2;
      p.ring.material.opacity = 0.35 + 0.4 * (0.5 + 0.5 * Math.sin(t * 4)) * (1 - p.press);
    }

    for (const w of this.switches.values()) {
      const on = this.sig(w.def.id);
      w.flash = Math.max(0, w.flash - dt);
      const target = on || w.flash > 0 ? 1 : 0;
      w.press += (target - w.press) * Math.min(1, dt * 16);
      w.cap.position.y = 0.48 - w.press * 0.2;
      w.mat.emissiveIntensity = 0.15 + w.press * 1.6;
      w.hint.visible = !(w.def.latch && on);
      w.hint.position.y = 1.8 + Math.sin(t * 3 + w.def.x) * 0.15;
      w.hint.rotation.y = t * 1.5;
    }

    for (const pad of this.pads) {
      pad.highlight += ((pad.targeted ? 1 : 0) - pad.highlight) * Math.min(1, dt * 10);
      const pulse = 0.5 + 0.5 * Math.sin(t * 3 + pad.x);
      pad.faceMat.emissiveIntensity = 0.5 + pulse * 0.4 + pad.highlight * 1.6 + pad.glow * 2;
      pad.ring.scale.setScalar(1 + pulse * 0.08 + pad.highlight * 0.18);
      pad.ringMat.opacity = 0.35 + pulse * 0.25 + pad.highlight * 0.4;
      pad.glow = Math.max(0, pad.glow - dt * 2);
    }

    for (const s of this.seesaws.values()) {
      // Snap down to full tilt when pounded, hold briefly, then wobble back
      // to level. Never past the floor.
      s.kickT = Math.max(0, s.kickT - dt);
      const target = s.kickT > 0 ? s.kickDir * s.maxTilt : 0;
      const stiff = s.kickT > 0 ? 900 : 120;
      s.tiltV += ((target - s.tilt) * stiff - s.tiltV * (s.kickT > 0 ? 50 : 9)) * dt;
      s.tilt += s.tiltV * dt;
      if (Math.abs(s.tilt) > s.maxTilt) {
        s.tilt = Math.sign(s.tilt) * s.maxTilt;
        s.tiltV *= -0.3;
      }
      s.plank.rotation.z = s.tilt;
      const lift = Math.sin(s.tilt) * (s.def.len / 4);
      for (const c of Object.values(s.ends)) {
        c.beginMove();
        c.set(c.pos.x, c.baseY + c.side * lift, c.pos.z);
        c.endMove(dt);
      }
    }

    for (const b of this.bouncers.values()) {
      const d = b.def;
      // Drums that only exist while a signal is on, or slide into place.
      if (d.when) {
        const on = this.sigAny(d.when);
        b.c.enabled = on;
        b.show += ((on ? 1 : 0) - b.show) * Math.min(1, dt * 10);
        b.group.visible = b.show > 0.03;
      }
      if (d.move) {
        const on = this.sigAny(d.moveWhen);
        const len = Math.hypot(...d.move) || 1;
        b.u = Math.max(0, Math.min(1, b.u + ((on ? 1 : -1) * dt * (d.speed || 5)) / len));
        const k = b.u * b.u * (3 - 2 * b.u);
        const x = d.x + d.move[0] * k, y = d.y + d.move[1] * k, z = d.z + d.move[2] * k;
        b.c.beginMove();
        b.c.set(x, y - 0.35, z);
        b.c.endMove(dt);
        b.group.position.set(x, y, z);
      }
      b.squashV += (-b.squash * 400 - b.squashV * 12) * dt;
      b.squash += b.squashV * dt;
      b.skinGroup.position.y = -b.squash * 0.25;
      const sh = d.when ? Math.max(0.01, b.show) : 1;
      b.group.scale.set((1 + b.squash * 0.15) * sh, sh, (1 + b.squash * 0.15) * sh);
    }

    for (const f of this.fields) f.mat.uniforms.uTime.value = t;

    for (const g of this.gems.values()) {
      if (g.taken) {
        if (g.anim < 1) {
          g.anim = Math.min(1, g.anim + dt * 2.5);
          g.group.position.y = g.def.y + g.anim * 1.6;
          g.group.scale.setScalar(Math.max(0.001, 1 - g.anim));
          g.group.rotation.y += dt * 20;
        } else g.group.visible = false;
        continue;
      }
      g.group.position.y = g.def.y + Math.sin(t * 2 + g.phase) * 0.15;
      g.group.rotation.y = t * 1.8 + g.phase;
    }

    for (const cp of this.checkpoints) {
      cp.bulbs.forEach((m, i) => {
        m.emissiveIntensity += ((cp.reached[i] ? 2.2 : 0) - m.emissiveIntensity) * Math.min(1, dt * 6);
      });
      if (cp.flag) {
        const pos = cp.flag.mesh.geometry.attributes.position;
        const base = cp.flag.base;
        for (let i = 0; i < pos.count; i++) {
          const x = base[i * 3];
          pos.setZ(i, Math.sin(x * 3 - t * 5 + cp.def.idx) * 0.12 * x);
        }
        pos.needsUpdate = true;
        cp.flag.mesh.geometry.computeVertexNormals();
        const any = cp.reached[0] || cp.reached[1];
        cp.flag.mat.color.lerp(any ? FLAG_ON : FLAG_OFF, Math.min(1, dt * 4));
      }
    }

    if (this.goal) {
      const pulse = 0.5 + 0.5 * Math.sin(t * 2.5);
      this.goal.discMat.opacity = 0.35 + pulse * 0.3;
      this.goal.ring.scale.setScalar(1 + pulse * 0.05);
      if (this.goal.def.style !== 'exit') this.goal.banner.position.y = 5.2 + Math.sin(t * 1.6) * 0.15;
    }

    for (const s of this.signs) {
      if (s.fixed) continue;
      s.mesh.position.y = s.baseY + Math.sin(t * 1.4 + s.phase) * 0.12;
      if (camera) s.mesh.rotation.y = Math.atan2(camera.position.x - s.mesh.position.x, camera.position.z - s.mesh.position.z);
    }

    for (const w of this.wires) {
      w.glow += ((this.sig(w.sig) ? 1 : 0) - w.glow) * Math.min(1, dt * 10);
      w.mat.emissiveIntensity = w.glow * 2.2;
    }

    this.updateMechanics(dt, t);
  }

  // Visual reactions -----------------------------------------------------------

  seesawFire(id, end) {
    const s = this.seesaws.get(id);
    if (!s) return;
    // Pounding end A pushes A down (positive tilt raises the B end).
    s.kickDir = end === 'A' ? 1 : -1;
    s.kickT = 0.35;
  }

  bounce(id, strength) {
    const b = this.bouncers.get(id);
    if (b) b.squashV += 6 + strength * 0.3;
  }

  takeGem(id) {
    const g = this.gems.get(id);
    if (!g || g.taken) return false;
    g.taken = true;
    g.anim = 0;
    return true;
  }

  dispose() {
    this.game.scene.remove(this.group);
    for (const d of this.disposables) d.dispose?.();
    this.group.traverse((o) => {
      if (o.isMesh && o.geometry) o.geometry.dispose();
    });
  }
}
