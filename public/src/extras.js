// Pieces used by the hand-designed modes: prank blocks, keys and locks, story
// notes, lights, trigger zones, monsters and (in the dark) flashlights. Built
// from level data alongside World; shared state comes from the server.

import * as THREE from 'three';
import { Collider } from './physics.js';
import { blockGeometry, lighten, textTexture } from './materials.js';
import { LOOKS } from './looks.js';
import { CHARACTERS } from '../shared/constants.js';
import { inside, redState } from '../shared/zones.js';

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const easeIn = (u) => u * u;
const easeOut = (u) => 1 - (1 - u) * (1 - u);
const smooth = (u) => u * u * (3 - 2 * u);
const c01 = (u) => Math.max(0, Math.min(1, u));
const hash = (n) => {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
};

export const inZone = (z, p, pad = 0) => inside(z, p.x, p.y, p.z, pad);
export { redState };

export class Extras {
  constructor(game, level) {
    this.game = game;
    this.level = level;
    this.physics = game.physics;
    this.mats = game.mats;
    this.group = new THREE.Group();
    game.scene.add(this.group);
    this.disposables = [];
    this.traps = new Map();
    this.items = new Map();
    this.locks = new Map();
    this.notes = new Map();
    this.lights = [];
    this.pool = [];
    this.monsters = [];
    this.ghosts = [];
    this.zones = level.zones || [];
    this.figures = [];
    this.dials = new Map();
    this.dialState = {};
    this.uvSigns = [];
    this.itemState = {};
    this.found = new Set();
    this.blackout = 0;
    this.time = 0;
    this.dark = !!level.theme.dark;

    this.buildTraps();
    this.buildItems();
    this.buildLocks();
    this.buildNotes();
    this.buildLights();
    this.buildMonsters();
    this.buildFigures();
    this.buildDials();
    this.buildSafeZones();
    this.buildUvSigns();
    this.buildFloods();
    this.buildFloats();
    this.buildSwaps();
    this.buildFieldZones();
    this.buildPortals();
    this.buildGlass();
    if (this.dark) this.buildFlashlights();
  }

  track(o) {
    this.disposables.push(o);
    return o;
  }

  sig(id) {
    return this.game.world.sig(id);
  }

  // -- prank blocks ------------------------------------------------------------

  buildTraps() {
    for (const d of this.level.traps || []) {
      const mat = this.track((d.mat === 'wood' ? this.mats.wood : this.mats.toy).clone());
      mat.transparent = true;
      const geo = this.track(blockGeometry(d.sx, d.sy, d.sz, { color: d.color, top: lighten(d.color, 0.3), radius: 0.22 }));
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = mesh.receiveShadow = true;
      mesh.position.set(d.x, d.y, d.z);
      mesh.rotation.y = d.yaw;
      this.group.add(mesh);
      if (d.kind === 'hidden') {
        mat.opacity = 0;
        mat.depthWrite = false;
        mesh.castShadow = false;
      }
      let spring = null;
      if (d.look === 'spring') {
        spring = new THREE.Group();
        const pad = new THREE.Mesh(this.track(new THREE.CylinderGeometry(Math.min(d.sx, d.sz) * 0.38, Math.min(d.sx, d.sz) * 0.4, 0.18, 28)),
          this.track(new THREE.MeshStandardMaterial({ color: '#ffd166', roughness: 0.35, emissive: '#ffb703', emissiveIntensity: 0.2 })));
        pad.position.y = 0.45;
        const coilMat = this.track(new THREE.MeshStandardMaterial({ color: '#c3cbd6', metalness: 0.8, roughness: 0.25 }));
        for (let i = 0; i < 3; i++) {
          const coil = new THREE.Mesh(this.track(new THREE.TorusGeometry(Math.min(d.sx, d.sz) * 0.22, 0.05, 8, 24)), coilMat);
          coil.rotation.x = Math.PI / 2;
          coil.position.y = 0.1 + i * 0.12;
          spring.add(coil);
        }
        spring.add(pad);
        spring.position.y = d.sy / 2;
        mesh.add(spring);
      }
      // Outline shown when a reveal plate is held (red = mean, green = hidden step).
      const edges = new THREE.LineSegments(
        this.track(new THREE.EdgesGeometry(new THREE.BoxGeometry(d.sx + 0.08, d.sy + 0.08, d.sz + 0.08))),
        this.track(new THREE.LineBasicMaterial({ color: d.kind === 'hidden' ? '#7dffb0' : '#ff3b3b', transparent: true, opacity: 0, depthTest: false })),
      );
      edges.renderOrder = 5;
      mesh.add(edges);
      let c = null;
      if (d.kind !== 'fake') {
        c = new Collider(d.id, d.sx / 2, d.sy / 2, d.sz / 2, { dynamic: true, kind: 'trap', ref: d });
        c.set(d.x, d.y, d.z, d.yaw);
        c.beginMove();
        this.physics.add(c);
      }
      let glove = null;
      if (d.glove) {
        const g = new THREE.Group();
        const s = d.glove.size;
        const fist = new THREE.Mesh(this.track(blockGeometry(s, s * 0.9, s * 0.9, { color: '#ff3b3b', top: '#ff6b6b', radius: 0.35 })), this.mats.toy);
        fist.castShadow = true;
        g.add(fist);
        const cuff = new THREE.Mesh(this.track(new THREE.CylinderGeometry(s * 0.36, s * 0.36, s * 0.5, 20)), this.track(new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.6 })));
        cuff.rotation.z = Math.PI / 2;
        cuff.position.x = s * 0.55;
        g.add(cuff);
        const [fx, fy, fz] = d.glove.from;
        const [tx, , tz] = d.glove.to;
        g.position.set(fx, fy, fz);
        g.rotation.y = Math.atan2(-(tz - fz), tx - fx);
        g.visible = false;
        this.group.add(g);
        const gc = new Collider(`${d.id}:g`, s / 2, s * 0.45, s / 2, { dynamic: true, kind: 'glove', hazard: 'push' });
        gc.set(fx, fy, fz, 0);
        gc.enabled = false;
        gc.beginMove();
        this.physics.add(gc);
        glove = { mesh: g, c: gc };
      }
      this.traps.set(d.id, { def: d, mesh, mat, c, glove, spring, edges, phase: 'idle', t: 0, ghost: 0 });
    }
  }

  // Someone stepped on a trap. Returns true if it just went off.
  trigger(id) {
    const tr = this.traps.get(id);
    if (!tr) return false;
    const d = tr.def;
    if (d.kind === 'hidden') {
      tr.ghost = 2.5;
      return false;
    }
    if (tr.phase !== 'idle' || d.kind === 'fake') return false;
    if (d.off && this.sig(d.off)) return false;
    if (d.on && !this.sig(d.on)) return false;
    tr.phase = 'on';
    tr.t = 0;
    const a = this.game.audio;
    const sp = this.game.spatial ? this.game.spatial(tr.mesh.position) : {};
    if (d.kind === 'launch') a?.play('boing', sp);
    else if (d.kind === 'punch') a?.play('punch', { ...sp, delay: d.delay });
    else a?.play('honk', sp);
    return true;
  }

  updateTraps(dt, t) {
    for (const tr of this.traps.values()) {
      const d = tr.def;
      if (tr.phase === 'on') tr.t += dt;
      const k = tr.t - d.delay;
      let ox = 0, oy = 0, oz = 0, scale = 1, solid = true, visible = true, shake = 0;
      if (tr.phase === 'on') {
        if (k < 0) shake = 0.06;
        switch (d.kind) {
          case 'vanish':
            if (k >= 0 && k < d.reset) {
              solid = false;
              scale = Math.max(0, 1 - k / 0.12);
              visible = scale > 0.01;
            } else if (k >= d.reset) {
              scale = easeOut(c01((k - d.reset) / 0.3));
              if (k > d.reset + 0.3) tr.phase = 'idle';
            }
            break;
          case 'drop':
            if (k >= 0 && k < d.reset) {
              oy = -16 * k * k;
              solid = k < 0.45;
              visible = k < 1.4;
            } else if (k >= d.reset) {
              scale = easeOut(c01((k - d.reset) / 0.3));
              if (k > d.reset + 0.3) tr.phase = 'idle';
            }
            break;
          case 'slide': {
            const m = d.move;
            let u = 0;
            if (k >= 0) {
              if (k < 0.35) u = easeIn(k / 0.35);
              else if (k < 0.35 + d.hold) u = 1;
              else u = 1 - smooth(c01((k - 0.35 - d.hold) / 1.2));
              if (k > 0.35 + d.hold + 1.2) tr.phase = 'idle';
            }
            ox = m[0] * u;
            oy = m[1] * u;
            oz = m[2] * u;
            break;
          }
          case 'launch':
            if (tr.spring) tr.spring.scale.y = 1 + 2.2 * Math.max(0, 1 - Math.abs(tr.t - 0.08) / 0.2);
            if (tr.t > d.reset) tr.phase = 'idle';
            break;
          case 'punch':
            if (tr.t > d.delay + 1.2) tr.phase = 'idle';
            break;
          default:
            if (tr.t > d.reset) tr.phase = 'idle';
        }
      }
      if (tr.glove) {
        const gl = tr.glove;
        const g = d.glove;
        let u = 0;
        if (tr.phase === 'on' && k >= 0) {
          if (k < 0.16) u = easeIn(k / 0.16);
          else if (k < 0.45) u = 1;
          else u = 1 - smooth(c01((k - 0.45) / 0.5));
        }
        gl.c.beginMove();
        gl.c.set(g.from[0] + (g.to[0] - g.from[0]) * u, g.from[1], g.from[2] + (g.to[2] - g.from[2]) * u, 0);
        gl.c.endMove(dt);
        gl.c.enabled = u > 0.05 && k < 0.45;
        gl.mesh.visible = u > 0.02;
        gl.mesh.position.copy(gl.c.pos);
      }
      if (shake) {
        ox += (Math.random() - 0.5) * shake;
        oz += (Math.random() - 0.5) * shake;
      }
      tr.ghost = Math.max(0, tr.ghost - dt);
      // reveal: signals that show it to everyone. seer: an eye plate that
      // shows it only to whoever stands on it (so they have to talk you through).
      const revealed = (!!d.reveal && (Array.isArray(d.reveal) ? d.reveal.some((r) => this.sig(r)) : this.sig(d.reveal)))
        || (!!d.seer && [].concat(d.seer).includes(this.game.myPlate));
      tr.edges.material.opacity += ((revealed ? 0.95 : 0) - tr.edges.material.opacity) * Math.min(1, dt * 10);
      if (d.kind === 'hidden') {
        const op = revealed ? 0.55 : tr.ghost > 0 ? Math.min(0.45, tr.ghost) : 0;
        tr.mat.opacity += (op - tr.mat.opacity) * Math.min(1, dt * 8);
      }
      tr.mesh.position.set(d.x + ox, d.y + oy, d.z + oz);
      tr.mesh.scale.setScalar(Math.max(0.001, scale));
      tr.mesh.visible = visible;
      if (tr.c) {
        tr.c.beginMove();
        tr.c.set(d.x + ox, d.y + oy, d.z + oz, d.yaw);
        tr.c.endMove(dt);
        tr.c.enabled = solid && visible;
      }
    }
  }

  // -- carried items and locks -------------------------------------------------

  itemMesh(kind, color) {
    const g = new THREE.Group();
    const mat = this.track(new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.55, metalness: 0.55, roughness: 0.28 }));
    const add = (geo, x = 0, y = 0, z = 0, rx = 0, rz = 0, m = mat) => {
      const mesh = new THREE.Mesh(this.track(geo), m);
      mesh.position.set(x, y, z);
      mesh.rotation.set(rx, 0, rz);
      mesh.castShadow = true;
      g.add(mesh);
      return mesh;
    };
    if (kind === 'key' || kind === 'half') {
      add(new THREE.TorusGeometry(0.22, 0.07, 10, 24), 0, 0.32, 0);
      add(new THREE.BoxGeometry(0.09, 0.62, 0.09), 0, -0.12, 0);
      add(new THREE.BoxGeometry(0.2, 0.07, 0.08), 0.1, -0.32, 0);
      add(new THREE.BoxGeometry(0.15, 0.07, 0.08), 0.08, -0.18, 0);
      if (kind === 'half') add(new THREE.BoxGeometry(0.05, 0.9, 0.12), -0.06, 0, 0, 0, 0, this.track(new THREE.MeshBasicMaterial({ color: '#ffffff' })));
    } else if (kind === 'fuse') {
      add(new THREE.CylinderGeometry(0.13, 0.13, 0.5, 16), 0, 0, 0, 0, 0,
        this.track(new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.35, roughness: 0.05 })));
      add(new THREE.CylinderGeometry(0.15, 0.15, 0.12, 16), 0, 0.3, 0, 0, 0, this.mats.metal);
      add(new THREE.CylinderGeometry(0.15, 0.15, 0.12, 16), 0, -0.3, 0, 0, 0, this.mats.metal);
      add(new THREE.CylinderGeometry(0.04, 0.04, 0.48, 8), 0, 0, 0);
    } else if (kind === 'gear') {
      add(new THREE.TorusGeometry(0.24, 0.09, 8, 20), 0, 0, 0);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        add(new THREE.BoxGeometry(0.12, 0.14, 0.14), Math.cos(a) * 0.36, Math.sin(a) * 0.36, 0, 0, a);
      }
    } else if (kind === 'candy') {
      // A wrapped sweet: a ball with a twist of wrapper on each side.
      add(new THREE.SphereGeometry(0.26, 18, 14), 0, 0, 0);
      add(new THREE.ConeGeometry(0.14, 0.26, 10), 0.36, 0, 0, 0, Math.PI / 2);
      add(new THREE.ConeGeometry(0.14, 0.26, 10), -0.36, 0, 0, 0, -Math.PI / 2);
    } else if (kind === 'snowball') {
      add(new THREE.SphereGeometry(0.3, 18, 14), 0, 0, 0);
    } else if (kind === 'parcel') {
      // A cardboard box in the carrier's colour, taped up.
      add(new THREE.BoxGeometry(0.62, 0.5, 0.5), 0, 0, 0);
      const tape = this.track(new THREE.MeshStandardMaterial({ color: '#f4e6c8', roughness: 0.6 }));
      add(new THREE.BoxGeometry(0.64, 0.52, 0.1), 0, 0, 0, 0, 0, tape);
      add(new THREE.BoxGeometry(0.1, 0.52, 0.52), 0, 0, 0, 0, 0, tape);
    } else if (kind === 'tag') {
      add(new THREE.BoxGeometry(0.5, 0.32, 0.04), 0, 0, 0);
      add(new THREE.TorusGeometry(0.06, 0.02, 6, 12), -0.2, 0.1, 0.03);
    } else {
      add(new THREE.OctahedronGeometry(0.3), 0, 0, 0);
    }
    return { group: g, mat };
  }

  buildItems() {
    for (const d of this.level.items || []) {
      const { group, mat } = this.itemMesh(d.kind, d.color);
      const holder = new THREE.Group();
      holder.add(group);
      // Ring on the floor in the color of whoever may carry it.
      const ringColor = d.who === null ? '#ffffff' : CHARACTERS[d.who].color;
      const ring = new THREE.Mesh(this.track(new THREE.RingGeometry(0.55, 0.75, 32)),
        this.track(new THREE.MeshBasicMaterial({ color: ringColor, transparent: true, opacity: 0.75, depthWrite: false, side: THREE.DoubleSide })));
      ring.rotation.x = -Math.PI / 2;
      this.group.add(holder);
      this.group.add(ring);
      this.items.set(d.id, { def: d, holder, spin: group, mat, ring, pos: new THREE.Vector3(d.x, d.y, d.z), sent: 0 });
    }
  }

  buildLocks() {
    for (const d of this.level.locks || []) {
      const g = new THREE.Group();
      g.position.set(d.x, d.y, d.z);
      g.rotation.y = d.yaw;
      if (d.style !== 'wall') {
        const ped = new THREE.Mesh(this.track(blockGeometry(1.0, 1.1, 1.0, { color: '#5d5670', top: '#7d748c', radius: 0.1 })), this.mats.metal);
        ped.position.y = 0.55;
        ped.castShadow = ped.receiveShadow = true;
        g.add(ped);
      }
      const plateY = d.style === 'wall' ? 0 : 1.2;
      const plate = new THREE.Mesh(this.track(blockGeometry(0.4 + 0.42 * d.accepts.length, 0.5, 0.18, { color: '#2b2140', top: '#3b3156', radius: 0.06 })), this.mats.metal);
      plate.position.set(0, plateY, 0);
      g.add(plate);
      const slots = d.accepts.map((id, i) => {
        const it = (this.level.items || []).find((x) => x.id === id);
        const color = it ? it.color : '#ffffff';
        const m = this.track(new THREE.MeshStandardMaterial({ color: '#222', emissive: color, emissiveIntensity: 0.08, roughness: 0.3 }));
        const s = new THREE.Mesh(this.track(new THREE.SphereGeometry(0.13, 16, 12)), m);
        s.position.set((i - (d.accepts.length - 1) / 2) * 0.42, plateY, 0.12);
        g.add(s);
        return { id, mat: m };
      });
      this.group.add(g);
      this.locks.set(d.id, { def: d, group: g, slots, sent: 0 });
    }
  }

  applyState(state) {
    if (state.items) this.itemState = state.items;
    if (state.fl) this.floodState = state.fl;
    if (state.fp) this.floodPause = state.fp;
    if (state.dl) {
      this.dialState = state.dl;
      for (const [id, v] of Object.entries(state.dl)) this.showDial(id, v);
    }
  }

  holderOf(id) {
    const s = this.itemState[id];
    return s ? s[0] : -1;
  }

  heldBy(slot) {
    for (const [id, s] of Object.entries(this.itemState)) if (s[0] === slot) return this.items.get(id)?.def || null;
    return null;
  }

  updateItems(dt, t) {
    const chars = this.game.chars;
    for (const it of this.items.values()) {
      const d = it.def;
      const [holder, used] = this.itemState[d.id] || [-1, 0];
      const available = !d.when || this.sig(d.when);
      it.holder.visible = !used && available && (holder === -1 || chars[holder]?.root.visible);
      it.ring.visible = !used && available && holder === -1;
      if (holder >= 0 && chars[holder]) {
        _v.copy(chars[holder].root.position);
        _v.y += 2.12; // held overhead in both hands
        it.pos.lerp(_v, Math.min(1, dt * 22));
      } else {
        it.pos.lerp(_v.set(d.x, d.y + 0.25 + Math.sin(t * 2 + d.x) * 0.12, d.z), Math.min(1, dt * 8));
      }
      it.holder.position.copy(it.pos);
      it.spin.rotation.y += dt * 1.6;
      it.ring.position.set(d.x, d.y - 0.6, d.z);
      it.mat.emissiveIntensity = 0.45 + 0.25 * Math.sin(t * 4);
    }
    for (const l of this.locks.values()) {
      for (const s of l.slots) {
        const used = (this.itemState[s.id] || [-1, 0])[1] === 1;
        s.mat.emissiveIntensity += ((used ? 2.2 : 0.08 + 0.06 * Math.sin(t * 3)) - s.mat.emissiveIntensity) * Math.min(1, dt * 6);
      }
    }
  }

  // -- notes ---------------------------------------------------------------------

  buildNotes() {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 160;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#efe6cf';
    ctx.fillRect(0, 0, 128, 160);
    ctx.strokeStyle = 'rgba(40,30,30,0.6)';
    ctx.lineWidth = 2;
    for (let y = 22; y < 150; y += 12) {
      ctx.beginPath();
      ctx.moveTo(12, y);
      for (let x = 12; x < 116; x += 8) ctx.lineTo(x, y + Math.sin(x * 0.7 + y) * 1.5);
      ctx.stroke();
    }
    const tex = this.track(new THREE.CanvasTexture(c));
    tex.colorSpace = THREE.SRGBColorSpace;
    const geo = this.track(new THREE.PlaneGeometry(0.55, 0.7));
    for (const d of this.level.notes || []) {
      const mat = this.track(new THREE.MeshStandardMaterial({ map: tex, emissive: '#fff2c4', emissiveIntensity: 0.35, side: THREE.DoubleSide, roughness: 0.9 }));
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(d.x, d.y, d.z);
      mesh.rotation.set(-Math.PI / 2 + 0.25, 0, hash(d.x + d.z) * 6);
      this.group.add(mesh);
      this.notes.set(d.id, { def: d, mesh, mat, sent: 0 });
    }
  }

  markNote(id) {
    this.found.add(id);
    const n = this.notes.get(id);
    if (n) n.mesh.visible = false;
  }

  // -- lights --------------------------------------------------------------------

  buildLights() {
    const defs = this.level.lights || [];
    if (!defs.length) return;
    defs.forEach((d, i) => {
      let fixture = null, mat = null;
      if (d.fixture !== 'none') {
        mat = this.track(new THREE.MeshStandardMaterial({ color: '#222', emissive: d.color, emissiveIntensity: 2, roughness: 0.4 }));
        let geo;
        if (d.fixture === 'tube') geo = new THREE.BoxGeometry(1.5, 0.08, 0.22);
        else if (d.fixture === 'candle') geo = new THREE.ConeGeometry(0.06, 0.2, 8);
        else geo = new THREE.SphereGeometry(0.14 * (d.size || 1), 14, 10);
        fixture = new THREE.Mesh(this.track(geo), mat);
        fixture.position.set(d.x, d.y, d.z);
        this.group.add(fixture);
        if (d.fixture === 'candle') {
          const stick = new THREE.Mesh(this.track(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 10)), this.track(new THREE.MeshStandardMaterial({ color: '#efe6cf', roughness: 0.8 })));
          stick.position.set(d.x, d.y - 0.25, d.z);
          this.group.add(stick);
        }
      }
      const zone = d.rule ? this.zones.find((z) => z.id === d.rule) : null;
      this.lights.push({ def: d, fixture, mat, zone, level: 1, i });
    });
    const q = this.game.settings.quality;
    const n = q === 'low' ? 2 : q === 'medium' ? 3 : 4;
    for (let i = 0; i < n; i++) {
      const L = new THREE.PointLight('#ffffff', 0, 10, 2);
      this.group.add(L);
      this.pool.push(L);
    }
  }

  lightLevel(l, t) {
    const d = l.def;
    if (d.when && !this.sig(d.when)) return 0;
    if (d.off && this.sig(d.off)) return 0;
    if (d.pulse) {
      const [per, ph = 0, duty = 0.5] = d.pulse;
      if ((((t / per + ph) % 1) + 1) % 1 >= duty) return 0;
    }
    if (this.blackout > 0) return 0.03;
    let k = 1;
    if (d.flicker > 0) {
      const n = Math.sin(t * 23.1 + l.i * 7.3) * Math.sin(t * 7.7 + l.i * 3.1);
      k = 1 - d.flicker * 0.4 * (n * 0.5 + 0.5);
      if (hash(Math.floor(t * 7) + l.i * 31) < d.flicker * 0.18) k = 0.04;
    }
    return k;
  }

  updateLights(dt, t, focus) {
    if (!this.lights.length) return;
    this.blackout = Math.max(0, this.blackout - dt);
    for (const l of this.lights) {
      l.level = this.lightLevel(l, t);
      let color = l.def.color;
      if (l.zone) {
        const s = redState(l.zone, t);
        if (s.red) color = '#ff1e1e';
        else if (s.warn && Math.sin(t * 30) > 0) l.level *= 0.25;
      }
      l.color = color;
      if (l.mat) {
        l.mat.emissive.set(color);
        // Big pattern lamps keep a faint glow when off, so you can see where they are.
        l.mat.emissiveIntensity = (l.def.size > 1 ? 0.28 : 0.1) + 2.4 * l.level;
      }
      l.score = l.level < 0.05 ? Infinity : _v.set(l.def.x, l.def.y, l.def.z).distanceToSquared(focus) / (l.def.dist * l.def.dist);
    }
    const best = this.lights.filter((l) => l.score < 4).sort((a, b) => a.score - b.score);
    this.pool.forEach((L, i) => {
      const l = best[i];
      if (!l) {
        L.intensity = 0;
        return;
      }
      L.position.set(l.def.x, l.def.y - 0.15, l.def.z);
      L.color.set(l.color);
      L.distance = l.def.dist;
      L.intensity = l.def.intensity * l.level;
    });
  }

  // -- monsters ------------------------------------------------------------------

  classicMesh(look) {
    const g = new THREE.Group();
    const dorm = look === 'dorm';
    const coat = this.track(new THREE.MeshStandardMaterial({ color: dorm ? '#cfc9bb' : '#0d0b0e', roughness: 0.95 }));
    // Faintly self-lit skin so the face reads in the dark.
    const skin = this.track(new THREE.MeshStandardMaterial({ color: '#d4d0c4', emissive: '#4a4740', emissiveIntensity: 0.6, roughness: 0.75 }));
    const black = this.track(new THREE.MeshBasicMaterial({ color: '#000000' }));
    const eyeMat = this.track(new THREE.MeshBasicMaterial({ color: dorm ? '#ff2a2a' : '#ffffff' }));
    const add = (geo, m, x, y, z, parent = g) => {
      const mesh = new THREE.Mesh(this.track(geo), m);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      parent.add(mesh);
      return mesh;
    };
    const H = dorm ? 2.25 : 2.95;
    if (!dorm) {
      // Stick-thin legs under a long coat that hangs open at the bottom.
      for (const s of [-1, 1]) add(new THREE.CylinderGeometry(0.05, 0.04, 1.2, 8), coat, s * 0.13, 0.6, 0);
      add(new THREE.CylinderGeometry(0.19, 0.46, 1.5, 14, 1, true), coat, 0, 1.55, 0).material.side = THREE.DoubleSide;
      add(new THREE.BoxGeometry(0.66, 0.16, 0.26), coat, 0, 2.3, 0);
      add(new THREE.CylinderGeometry(0.045, 0.06, 0.3, 8), skin, 0, 2.48, 0.02);
    } else {
      // A long white nightdress, bare feet.
      add(new THREE.CylinderGeometry(0.18, 0.42, 1.65, 14), coat, 0, 0.95, 0);
      for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.09, 0.06, 0.22), skin, s * 0.1, 0.05, 0.04);
    }
    const head = new THREE.Group();
    head.position.set(0, H * 0.9, 0.04);
    g.add(head);
    if (!dorm) {
      const skull = add(new THREE.SphereGeometry(0.2, 20, 16), skin, 0, 0.12, 0, head);
      skull.scale.set(0.82, 1.45, 0.88);
      for (const s of [-1, 1]) {
        const socket = add(new THREE.SphereGeometry(0.06, 12, 10), black, s * 0.075, 0.2, 0.15, head);
        socket.scale.set(1, 1.3, 0.6);
        add(new THREE.SphereGeometry(0.014, 8, 6), eyeMat, s * 0.075, 0.2, 0.19, head);
      }
      const mouth = add(new THREE.BoxGeometry(0.07, 0.24, 0.02), black, 0, -0.08, 0.17, head);
      mouth.rotation.z = 0.08;
      head.rotation.z = 0.32;
    } else {
      // Long black hair over the face; red eyes peeking through.
      const hair = this.track(new THREE.MeshStandardMaterial({ color: '#050505', roughness: 1 }));
      const h1 = add(new THREE.SphereGeometry(0.21, 16, 12), hair, 0, 0.05, 0, head);
      h1.scale.set(1, 1.15, 1);
      add(new THREE.BoxGeometry(0.44, 1.0, 0.32), hair, 0, -0.5, 0.03, head);
      add(new THREE.SphereGeometry(0.022, 8, 6), eyeMat, -0.06, 0.0, 0.21, head);
      add(new THREE.SphereGeometry(0.022, 8, 6), eyeMat, 0.06, 0.0, 0.21, head);
    }
    // Long arms, hanging to the knees.
    const arms = [-1, 1].map((s) => {
      const pivot = new THREE.Group();
      pivot.position.set(s * (dorm ? 0.22 : 0.31), H * (dorm ? 0.72 : 0.78), 0);
      g.add(pivot);
      const len = dorm ? 1.0 : 1.75;
      add(new THREE.BoxGeometry(0.07, len, 0.07), skin, 0, -len / 2, 0, pivot);
      for (let f = -1; f <= 1; f++) {
        const finger = add(new THREE.BoxGeometry(0.025, 0.26, 0.025), skin, f * 0.035, -len - 0.12, 0.02, pivot);
        finger.rotation.x = 0.15;
      }
      return pivot;
    });
    return { group: g, head, arms };
  }

  monsterMesh(look) {
    if (look === 'tall' || look === 'dorm' || !LOOKS[look]) return this.classicMesh(look === 'dorm' ? 'dorm' : 'tall');
    return LOOKS[look](this);
  }

  // Shared bits for the other looks.
  part(g, geo, m, x, y, z) {
    const mesh = new THREE.Mesh(this.track(geo), m);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    g.add(mesh);
    return mesh;
  }

  mat(color, o = {}) {
    return this.track(new THREE.MeshStandardMaterial({ color, roughness: o.rough ?? 0.85, emissive: o.emissive || '#000000', emissiveIntensity: o.ei ?? 0, side: o.side ?? THREE.FrontSide, transparent: !!o.transparent, opacity: o.opacity ?? 1 }));
  }

  armPair(g, x, y, len, m, o = {}) {
    return [-1, 1].map((s) => {
      const pivot = new THREE.Group();
      pivot.position.set(s * x, y, 0);
      g.add(pivot);
      this.part(pivot, new THREE.BoxGeometry(o.w ?? 0.08, len, o.d ?? 0.08), m, 0, -len / 2, 0);
      if (o.hand) this.part(pivot, new THREE.SphereGeometry(0.07, 10, 8), o.hand, 0, -len - 0.04, 0);
      return pivot;
    });
  }

  buildMonsters() {
    for (const d of this.level.monsters || []) {
      const m = this.monsterMesh(d.look);
      m.group.visible = false;
      this.group.add(m.group);
      this.monsters.push({ def: d, ...m, prev: null, cur: null, recv: 0, mode: 0, step: 0, pos: new THREE.Vector3(), yaw: 0 });
    }
  }

  onMon(list) {
    const now = performance.now();
    list.forEach((s, i) => {
      const m = this.monsters[i];
      if (!m) return;
      m.prev = m.cur || s;
      m.cur = s;
      m.recv = now;
      if (s[4] === 6 && m.mode !== 6 && m.mode !== 0) this.game.onMonsterFrozen?.(m);
      m.mode = s[4];
    });
  }

  updateMonsters(dt, t) {
    const now = performance.now();
    for (const m of this.monsters) {
      if (!m.cur) continue;
      const u = c01((now - m.recv) / 50);
      const a = m.prev, b = m.cur;
      m.pos.set(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u);
      let dy = b[3] - a[3];
      while (dy > Math.PI) dy -= Math.PI * 2;
      while (dy < -Math.PI) dy += Math.PI * 2;
      m.yaw = a[3] + dy * u;
      // 0 asleep · 1 patrol · 2 search · 3 chase · 4 stunned · 5 going home · 6 frozen · 7 gone
      if (m.mode === 7) {
        m.fade = Math.max(0, (m.fade ?? 1) - dt * 1.5);
      } else {
        m.fade = 1;
      }
      m.group.visible = m.mode > 0 && m.fade > 0;
      if (m.mode === 7 && m.fade > 0) m.group.position.y -= dt * 0.6;
      if (m.mode === 7) continue;
      const moving = m.mode === 1 || m.mode === 2 || m.mode === 3 || m.mode === 5;
      const chase = m.mode === 3;
      if (m.mode === 6) {
        // Caught in the light: rigid, trembling.
        m.group.position.set(m.pos.x + (Math.random() - 0.5) * 0.03, m.pos.y, m.pos.z + (Math.random() - 0.5) * 0.03);
        m.group.rotation.y = m.yaw;
        m.head.rotation.z = (m.def.look === 'tall' ? 0.32 : 0.12) + (Math.random() - 0.5) * 0.12;
        continue;
      }
      m.step += dt * (chase ? 9 : 4) * (moving ? 1 : 0);
      m.group.position.set(m.pos.x, m.pos.y + (moving ? Math.abs(Math.sin(m.step)) * 0.08 : 0), m.pos.z);
      m.group.rotation.y = m.yaw;
      m.group.rotation.x = chase ? 0.18 : 0.05;
      // Twitchy head, dangling arms reaching out in a chase.
      const tw = hash(Math.floor(t * 5) + m.def.x) > 0.8 ? (hash(Math.floor(t * 5)) - 0.5) * 0.9 : 0;
      const tilt = m.def.look === 'dorm' ? 0.12 : 0.32;
      m.head.rotation.z += (tilt + tw - m.head.rotation.z) * Math.min(1, dt * 20);
      m.head.rotation.y = Math.sin(t * 0.7) * 0.3;
      m.arms.forEach((arm, i) => {
        const reach = chase ? -1.35 : -0.08;
        arm.rotation.x += (reach + Math.sin(m.step + i * Math.PI) * (chase ? 0.25 : 0.15) - arm.rotation.x) * Math.min(1, dt * 8);
      });
      if (moving && Math.floor(m.step / Math.PI) !== m.lastStep) {
        m.lastStep = Math.floor(m.step / Math.PI);
        const sp = this.game.spatial ? this.game.spatial(m.pos) : {};
        this.game.audio?.play('thud', { ...sp, vol: (sp.vol ?? 1) * (chase ? 1 : 0.6) });
      }
    }
  }

  // Closest awake monster (for heartbeat and music).
  threat(p) {
    let best = Infinity, chasing = false;
    for (const m of this.monsters) {
      if (!m.cur || m.mode === 0 || m.mode === 7) continue;
      const d = m.pos.distanceTo(p);
      if (d < best) best = d;
      if (m.mode === 3) chasing = true;
    }
    return { dist: best, chasing };
  }

  // A figure that appears for a moment and is gone.
  apparition(at, yaw) {
    const m = this.monsterMesh('tall');
    m.group.position.set(at[0], at[1], at[2]);
    m.group.rotation.y = yaw;
    m.group.traverse((o) => {
      if (o.isMesh) {
        o.material = o.material.clone();
        o.material.transparent = true;
        this.track(o.material);
      }
    });
    this.group.add(m.group);
    this.ghosts.push({ group: m.group, t: 0 });
  }

  updateGhosts(dt) {
    this.ghosts = this.ghosts.filter((g) => {
      g.t += dt;
      const op = g.t < 1.1 ? 1 : Math.max(0, 1 - (g.t - 1.1) / 0.3);
      g.group.traverse((o) => {
        if (o.isMesh) o.material.opacity = op;
      });
      g.group.position.x += (Math.random() - 0.5) * 0.02;
      if (op <= 0) {
        this.group.remove(g.group);
        return false;
      }
      return true;
    });
  }

  // -- figures, dials, safe rooms, hidden writing ---------------------------------

  buildFigures() {
    for (const d of this.level.figures || []) {
      const m = this.monsterMesh(d.look);
      m.group.position.set(d.x, d.y, d.z);
      m.group.rotation.y = d.yaw;
      m.group.scale.setScalar(d.scale);
      this.group.add(m.group);
      this.figures.push({ def: d, ...m });
    }
  }

  updateFigures(dt, t) {
    const p = this.game.player?.pos;
    for (const f of this.figures) {
      const d = f.def;
      const vis = (!d.when || this.sig(d.when)) && (!d.until || !this.sig(d.until));
      f.group.visible = vis;
      if (!vis || !p) continue;
      if (d.watch) {
        // Its head follows you around the room.
        let a = Math.atan2(p.x - d.x, p.z - d.z) - d.yaw;
        while (a > Math.PI) a -= Math.PI * 2;
        while (a < -Math.PI) a += Math.PI * 2;
        f.head.rotation.y += (Math.max(-1.6, Math.min(1.6, a)) - f.head.rotation.y) * Math.min(1, dt * 3);
      }
      if (hash(Math.floor(t * 3) + d.x * 7) > 0.97) f.head.rotation.z = (hash(Math.floor(t * 3)) - 0.5) * 0.6;
    }
  }

  dialTexture(style, value) {
    this.dialTex ||= new Map();
    const key = `${style}|${value}`;
    if (this.dialTex.has(key)) return this.dialTex.get(key);
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const ctx = c.getContext('2d');
    ctx.fillStyle = 'rgba(16, 14, 22, 0.92)';
    ctx.beginPath();
    ctx.roundRect(8, 8, 240, 240, 40);
    ctx.fill();
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#d9b25a';
    ctx.stroke();
    if (style === 'color') {
      ctx.fillStyle = value;
      ctx.beginPath();
      ctx.arc(128, 128, 82, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const text = String(value);
      ctx.fillStyle = '#fff4d6';
      ctx.font = `700 ${text.length > 2 ? 70 : text.length > 1 ? 110 : 150}px Fredoka, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 128, 138);
    }
    const tex = this.track(new THREE.CanvasTexture(c));
    tex.colorSpace = THREE.SRGBColorSpace;
    this.dialTex.set(key, tex);
    return tex;
  }

  buildDials() {
    for (const d of this.level.dials || []) {
      const mat = this.track(new THREE.SpriteMaterial({ map: this.dialTexture(d.style, d.values[d.start || 0]), depthWrite: false }));
      const spr = new THREE.Sprite(mat);
      spr.position.set(d.x, d.y + d.h, d.z);
      spr.scale.set(0.95, 0.95, 1);
      this.group.add(spr);
      this.dials.set(d.id, { def: d, spr, mat, v: d.start || 0, pop: 0 });
    }
  }

  showDial(id, v) {
    const d = this.dials.get(id);
    if (!d || d.v === v) return;
    d.v = v;
    d.mat.map = this.dialTexture(d.def.style, d.def.values[v]);
    d.mat.needsUpdate = true;
    d.spr.scale.set(1.2, 1.2, 1);
    setTimeout(() => d.spr.scale.set(0.95, 0.95, 1), 120);
  }

  buildSafeZones() {
    for (const z of this.zones) {
      if (z.kind !== 'safe') continue;
      const y = z.y - z.sy / 2 + 0.03;
      const mat = this.track(new THREE.MeshBasicMaterial({ color: '#7dffb0', transparent: true, opacity: 0.045, depthWrite: false }));
      const floor = new THREE.Mesh(this.track(new THREE.PlaneGeometry(z.sx, z.sz)), mat);
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(z.x, y, z.z);
      this.group.add(floor);
      const edge = new THREE.LineSegments(
        this.track(new THREE.EdgesGeometry(new THREE.BoxGeometry(z.sx, 0.02, z.sz))),
        this.track(new THREE.LineBasicMaterial({ color: '#7dffb0', transparent: true, opacity: 0.35 })),
      );
      edge.position.set(z.x, y, z.z);
      this.group.add(edge);
    }
  }

  // Writing that only shows up in a flashlight beam.
  buildUvSigns() {
    for (const s of this.level.signs || []) {
      if (s.style !== 'uv') continue;
      const { texture, aspect } = textTexture(s.text, { bg: 'rgba(0,0,0,0)', border: 'rgba(0,0,0,0)', color: '#c86bff', glow: '#a040ff' });
      this.track(texture);
      const w = s.w || 3;
      const mat = this.track(new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
      const mesh = new THREE.Mesh(this.track(new THREE.PlaneGeometry(w, w / aspect)), mat);
      mesh.position.set(s.x, s.y, s.z);
      mesh.rotation.y = s.yaw ?? Math.PI;
      this.group.add(mesh);
      this.uvSigns.push({ def: s, mesh, mat });
    }
  }

  updateUvSigns(dt) {
    if (!this.uvSigns.length) return;
    const g = this.game;
    const p = g.player?.pos;
    if (!p) return;
    const f = g.rig.forward;
    const fl = Math.hypot(f.x, f.z) || 1;
    for (const u of this.uvSigns) {
      const dx = u.def.x - p.x, dz = u.def.z - p.z;
      const d = Math.hypot(dx, dz);
      const cos = d > 0.01 ? (dx * f.x + dz * f.z) / (d * fl) : 1;
      const want = d < 9 && cos > 0.9 ? 1 : 0;
      u.mat.opacity += (want - u.mat.opacity) * Math.min(1, dt * (want ? 3 : 1.5));
    }
  }

  // -- floods, swap blocks, low gravity, the rope ----------------------------------

  buildFloods() {
    this.floods = [];
    this.floodState = {};
    for (const z of this.zones) {
      if (z.kind !== 'flood') continue;
      const lava = z.look !== 'water';
      const mat = this.track(new THREE.MeshStandardMaterial({
        color: lava ? '#ff5a1f' : '#3aa7ff', emissive: lava ? '#ff3a00' : '#0a3a66', emissiveIntensity: lava ? 1.1 : 0.35,
        roughness: lava ? 0.6 : 0.15, metalness: 0, transparent: !lava, opacity: lava ? 1 : 0.72,
      }));
      const mesh = new THREE.Mesh(this.track(new THREE.BoxGeometry(z.sx, 0.4, z.sz)), mat);
      mesh.position.set(z.x, z.y0 - 0.2, z.z);
      this.group.add(mesh);
      this.floods.push({ def: z, mesh, mat, y: z.y0 });
    }
  }

  // Current surface height of a flood.
  floodLevel(f) {
    const d = f.def;
    const t0 = this.floodState[d.id] || 0;
    if (t0 === -1 || t0 <= 0) return d.y0;
    // Paused by its hold signal: frozen where it was.
    const ps = (this.floodPause && this.floodPause[d.id]) || 0;
    const now = ps > 0 ? ps : this.game.net.serverNow();
    return d.y0 + Math.max(0, Math.min(d.y1 - d.y0, ((now - t0) / 1000) * d.speed));
  }

  updateFloods(dt, t) {
    for (const f of this.floods) {
      const want = this.floodLevel(f);
      // Drains and resets glide down; rising follows the clock exactly.
      f.y = want >= f.y ? want : Math.max(want, f.y - dt * 4);
      f.mesh.position.y = f.y - 0.2;
      f.mesh.visible = f.y > f.def.y0 + 0.01 || this.floodState[f.def.id] > 0;
      // Held back: it crusts over and dims.
      const held = this.floodPause && this.floodPause[f.def.id] > 0;
      if (f.def.look !== 'water') f.mat.emissiveIntensity = held ? 0.35 : 0.9 + 0.25 * Math.sin(t * 3 + f.def.x);
    }
  }

  // Rafts riding the water (see LevelBuilder.float).
  buildFloats() {
    this.floats = [];
    for (const d of this.level.floats || []) {
      const mesh = new THREE.Mesh(this.track(blockGeometry(d.sx, d.sy, d.sz, { color: d.color, top: lighten(d.color, 0.25), radius: 0.12 })), this.mats.wood);
      mesh.castShadow = mesh.receiveShadow = true;
      this.group.add(mesh);
      const c = new Collider(d.id, d.sx / 2, d.sy / 2, d.sz / 2, { dynamic: true, kind: 'float' });
      c.set(d.x, d.base - d.sy / 2, d.z, 0);
      c.beginMove();
      this.physics.add(c);
      this.floats.push({ def: d, mesh, c, floods: d.flood.map((id) => this.floods.find((f) => f.def.id === id)).filter(Boolean) });
    }
  }

  updateFloats(dt) {
    for (const r of this.floats) {
      const d = r.def;
      let top = d.base;
      for (const f of r.floods) top = Math.max(top, f.y + d.offset);
      r.c.beginMove();
      r.c.set(d.x, top - d.sy / 2, d.z, 0);
      r.c.endMove(dt);
      r.mesh.position.set(d.x, top - d.sy / 2, d.z);
    }
  }

  // Is p under the surface of a flood?
  inFlood(p) {
    for (const f of this.floods) {
      const d = f.def;
      if (Math.abs(p.x - d.x) > d.sx / 2 || Math.abs(p.z - d.z) > d.sz / 2) continue;
      // The real level, not the slower draining animation.
      if (p.y < Math.min(f.y, this.floodLevel(f)) - 0.15) return f;
    }
    return null;
  }

  buildSwaps() {
    this.swaps = [];
    for (const d of this.level.swaps || []) {
      const mat = this.track(new THREE.MeshStandardMaterial({ color: d.color, emissive: d.color, emissiveIntensity: 0.3, roughness: 0.4, transparent: true }));
      const mesh = new THREE.Mesh(this.track(blockGeometry(d.sx, d.sy, d.sz, { color: '#ffffff', top: '#ffffff', radius: 0.18 })), mat);
      mesh.position.set(d.x, d.y, d.z);
      mesh.rotation.y = d.yaw;
      mesh.castShadow = mesh.receiveShadow = true;
      const edges = new THREE.LineSegments(this.track(new THREE.EdgesGeometry(new THREE.BoxGeometry(d.sx, d.sy, d.sz))), this.track(new THREE.LineBasicMaterial({ color: d.color })));
      mesh.add(edges);
      this.group.add(mesh);
      const c = new Collider(d.id, d.sx / 2, d.sy / 2, d.sz / 2, { kind: 'swap' });
      c.set(d.x, d.y, d.z, d.yaw);
      this.physics.add(c);
      const dial = (this.level.dials || []).find((q) => q.id === d.dial);
      this.swaps.push({ def: d, mesh, mat, c, start: dial ? dial.start || 0 : 0, op: 1 });
    }
  }

  updateSwaps(dt) {
    for (const s of this.swaps) {
      const v = this.dialState[s.def.dial] ?? s.start;
      const on = v === s.def.on;
      s.c.enabled = on;
      s.op += ((on ? 1 : 0.14) - s.op) * Math.min(1, dt * 10);
      s.mat.opacity = s.op;
      s.mat.depthWrite = s.op > 0.6;
    }
  }

  // Faint markers for low-gravity and rope zones.
  buildFieldZones() {
    for (const z of this.zones) {
      if (z.kind !== 'gravity' && z.kind !== 'tether') continue;
      const color = z.kind === 'gravity' ? '#b58cff' : '#ff9ed2';
      const edge = new THREE.LineSegments(
        this.track(new THREE.EdgesGeometry(new THREE.BoxGeometry(z.sx, z.sy, z.sz))),
        this.track(new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.35 })),
      );
      edge.position.set(z.x, z.y - 0.8, z.z);
      this.group.add(edge);
    }
    this.rope = null;
    if (this.zones.some((z) => z.kind === 'tether')) {
      const geo = this.track(new THREE.CylinderGeometry(0.05, 0.05, 1, 6, 1, true));
      geo.translate(0, 0.5, 0);
      geo.rotateX(Math.PI / 2);
      this.rope = new THREE.Mesh(geo, this.track(new THREE.MeshStandardMaterial({ color: '#ff7ab8', emissive: '#ff4f9a', emissiveIntensity: 0.5, roughness: 0.6 })));
      this.rope.visible = false;
      this.group.add(this.rope);
    }
  }

  // Warp zones with a `portal` colour: a glowing ring you walk into, and a
  // flat ring where you come out. Dim while the portal is switched off.
  buildPortals() {
    this.portals = [];
    for (const z of this.zones) {
      if (z.kind !== 'warp' || !z.portal) continue;
      const g = new THREE.Group();
      const flat = z.sy < Math.min(z.sx, z.sz); // a portal in the floor
      const r = flat ? Math.min(z.sx, z.sz) / 2 : Math.min(Math.max(z.sx, z.sz), z.sy) / 2;
      const ringMat = this.track(new THREE.MeshStandardMaterial({ color: z.portal, emissive: z.portal, emissiveIntensity: 1.4, roughness: 0.3 }));
      const discMat = this.track(new THREE.MeshBasicMaterial({ color: z.portal, transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide }));
      const ring = new THREE.Mesh(this.track(new THREE.TorusGeometry(r * 0.92, 0.12, 10, 40)), ringMat);
      const disc = new THREE.Mesh(this.track(new THREE.CircleGeometry(r * 0.88, 40)), discMat);
      g.add(ring, disc);
      if (flat) {
        g.rotation.x = -Math.PI / 2;
        g.position.set(z.x, z.y - z.sy / 2 + 0.06, z.z);
      } else {
        g.position.set(z.x, z.y - z.sy / 2 + r + 0.05, z.z);
        g.rotation.y = z.sx > z.sz ? 0 : Math.PI / 2;
      }
      this.group.add(g);
      // Where it lets you out.
      let exit = null;
      if (z.to) {
        exit = new THREE.Mesh(this.track(new THREE.RingGeometry(0.9, 1.2, 32)), this.track(new THREE.MeshBasicMaterial({ color: z.portal, transparent: true, opacity: 0.7, depthWrite: false, side: THREE.DoubleSide })));
        exit.rotation.x = -Math.PI / 2;
        exit.position.set(z.to[0], z.to[1] + 0.04, z.to[2]);
        this.group.add(exit);
      }
      this.portals.push({ def: z, g, ringMat, discMat, exit, on: 1 });
    }
  }

  updatePortals(t) {
    if (!this.portals || !this.portals.length) return;
    for (const p of this.portals) {
      const d = p.def;
      const on = (!d.when || this.sig(d.when)) && (!d.until || !this.sig(d.until));
      p.on += ((on ? 1 : 0) - p.on) * 0.15;
      p.ringMat.emissiveIntensity = 0.15 + 1.4 * p.on;
      p.discMat.opacity = 0.05 + 0.35 * p.on * (0.8 + 0.2 * Math.sin(t * 4 + d.x));
      p.disc = p.disc || p.g.children[1];
      p.disc.rotation.z = t * 1.5;
      if (p.exit) p.exit.visible = p.on > 0.5;
    }
  }

  // -- light glass ------------------------------------------------------------

  buildGlass() {
    this.glassBlocks = [];
    for (const d of this.level.glass || []) {
      const mat = this.track(new THREE.MeshStandardMaterial({ color: d.color, emissive: d.color, emissiveIntensity: 0.1, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.12, depthWrite: false }));
      const mesh = new THREE.Mesh(this.track(new THREE.BoxGeometry(d.sx, d.sy, d.sz)), mat);
      mesh.position.set(d.x, d.y, d.z);
      mesh.rotation.y = d.yaw;
      const edges = new THREE.LineSegments(this.track(new THREE.EdgesGeometry(new THREE.BoxGeometry(d.sx, d.sy, d.sz))),
        this.track(new THREE.LineBasicMaterial({ color: d.color, transparent: true, opacity: 0.35 })));
      mesh.add(edges);
      this.group.add(mesh);
      const c = new Collider(d.id, d.sx / 2, d.sy / 2, d.sz / 2, { kind: 'glass' });
      c.set(d.x, d.y, d.z, d.yaw);
      c.enabled = false;
      this.physics.add(c);
      this.glassBlocks.push({ def: d, mesh, mat, edges, c, hold: 0, glow: 0 });
    }
  }

  // Each flashlight: where it is, which way it points, whose it is.
  torchSources() {
    const g = this.game;
    const out = [];
    const p = g.player;
    if (p && !p.dead) {
      const f = g.rig.forward;
      out.push({ slot: g.slot, x: p.pos.x, y: p.pos.y, z: p.pos.z, yaw: Math.atan2(f.x, f.z) });
    }
    const r = g.remote;
    if (r && r.present && Number.isFinite(r.look) && g.chars[g.partnerSlot]?.root.visible) out.push({ slot: g.partnerSlot, x: r.pos.x, y: r.pos.y, z: r.pos.z, yaw: r.look });
    return out;
  }

  updateGlass(dt) {
    if (!this.glassBlocks.length) return;
    const src = this.torchSources();
    for (const gb of this.glassBlocks) {
      const d = gb.def;
      const top = d.y + d.sy / 2;
      const c = Math.cos(d.yaw), s = Math.sin(d.yaw);
      let n = 0;
      for (const q of src) {
        if (d.who !== null && d.who !== q.slot) continue;
        const dx = d.x - q.x, dz = d.z - q.z;
        // Standing on it counts: your light is on what's under your feet.
        const lx = -dx * c + dz * s, lz = -dx * s - dz * c;
        if (Math.abs(lx) < d.sx / 2 + 0.3 && Math.abs(lz) < d.sz / 2 + 0.3 && q.y > top - 0.6 && q.y < top + 3) {
          n++;
          continue;
        }
        const dist = Math.hypot(dx, dz);
        if (dist > 26 || Math.abs(d.y - q.y) > 7) continue;
        let da = Math.atan2(dx, dz) - q.yaw;
        while (da > Math.PI) da -= Math.PI * 2;
        while (da < -Math.PI) da += Math.PI * 2;
        if (Math.abs(da) < 0.36 + Math.atan2(Math.max(d.sx, d.sz) / 2, Math.max(1, dist))) n++;
      }
      // A short grace so a flicker of the beam doesn't drop you.
      if (n >= d.need) gb.hold = 0.35;
      else gb.hold = Math.max(0, gb.hold - dt);
      const on = gb.hold > 0;
      gb.c.enabled = on;
      gb.glow += ((on ? 1 : 0) - gb.glow) * Math.min(1, dt * 12);
      gb.mat.opacity = 0.12 + 0.7 * gb.glow;
      gb.mat.emissiveIntensity = 0.1 + 1.1 * gb.glow;
      gb.mat.depthWrite = gb.glow > 0.6;
    }
  }

  // The rope zone the point is in (if any).
  tetherAt(p) {
    for (const z of this.zones) if (z.kind === 'tether' && inZone(z, p)) return z;
    return null;
  }

  updateTether() {
    if (!this.rope) return;
    const g = this.game;
    const a = g.chars[0].root, b = g.chars[1].root;
    const on = a.visible && b.visible && this.tetherAt(a.position) && this.tetherAt(b.position);
    this.rope.visible = !!on;
    if (!on) return;
    _v.set(a.position.x, a.position.y + 1.0, a.position.z);
    _w.set(b.position.x, b.position.y + 1.0, b.position.z);
    this.rope.position.copy(_v);
    this.rope.lookAt(_w);
    this.rope.scale.set(1, 1, Math.max(0.01, _v.distanceTo(_w)));
  }

  // -- flashlights -------------------------------------------------------------

  buildFlashlights() {
    const shadows = this.game.settings.quality === 'high';
    this.torches = [0, 1].map((i) => {
      // A touch of each hero's colour, so you can tell whose light is whose.
      const L = new THREE.SpotLight(i === 0 ? '#ffe2cf' : '#dbe8ff', 60, 30, 0.46, 0.55, 1.7);
      L.castShadow = shadows && i === this.game.slot;
      if (L.castShadow) {
        L.shadow.mapSize.set(1024, 1024);
        L.shadow.bias = -0.0008;
        L.shadow.camera.near = 0.3;
      }
      this.group.add(L);
      this.group.add(L.target);
      return L;
    });
  }

  updateFlashlights() {
    if (!this.torches) return;
    const g = this.game;
    this.torches.forEach((L, i) => {
      const ch = g.chars[i];
      const vis = ch.root.visible;
      L.visible = vis;
      if (!vis) return;
      const p = ch.root.position;
      // Held out in front, so the beam doesn't light up your own back.
      let fx, fy, fz;
      if (i === g.slot) {
        // Where the camera looks, so the beam goes where you aim.
        const f = g.rig.forward;
        const l = Math.hypot(f.x, f.z) || 1;
        fx = f.x / l;
        fz = f.z / l;
        fy = f.y;
      } else {
        const look = g.remote && Number.isFinite(g.remote.look) ? g.remote.look : ch.root.rotation.y;
        fx = Math.sin(look);
        fz = Math.cos(look);
        fy = -0.08;
      }
      L.position.set(p.x + fx * 0.55, p.y + 1.3, p.z + fz * 0.55);
      L.target.position.set(p.x + fx * 10, p.y + 1.3 + fy * 10 - 0.5, p.z + fz * 10);
    });
  }

  // -- frame -----------------------------------------------------------------------

  update(dt, t, focus) {
    this.time = t;
    this.updateTraps(dt, t);
    this.updateItems(dt, t);
    for (const n of this.notes.values()) {
      if (this.found.has(n.def.id)) continue;
      n.mesh.position.y = n.def.y + Math.sin(t * 2 + n.def.x) * 0.04;
      n.mat.emissiveIntensity = 0.25 + 0.2 * Math.sin(t * 3 + n.def.z);
    }
    this.updateLights(dt, t, focus);
    this.updateMonsters(dt, t);
    this.updateFigures(dt, t);
    this.updateUvSigns(dt);
    this.updateFloods(dt, t);
    this.updateFloats(dt);
    this.updateSwaps(dt);
    this.updateTether();
    this.updatePortals(t);
    this.updateGlass(dt);
    this.updateGhosts(dt);
    this.updateFlashlights();
  }

  dispose() {
    this.game.scene.remove(this.group);
    for (const d of this.disposables) d.dispose?.();
    this.group.traverse((o) => {
      if (o.isMesh && o.geometry) o.geometry.dispose();
    });
  }
}
