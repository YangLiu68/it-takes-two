// One running level (or the lobby backdrop): ties together world, players,
// camera, effects, sound, HUD and networking.

import * as THREE from 'three';
import { CHARACTERS, PHYS } from '../shared/constants.js';
import { Physics } from './physics.js';
import { World } from './world.js';
import { Environment } from './sky.js';
import { Character } from './character.js';
import { ModelCharacter, setRimStrength } from './character-model.js';
import { Effects } from './fx.js';
import { CameraRig } from './camera.js';
import { LocalPlayer } from './player.js';
import { RemotePlayer, FLAG } from './remote.js';
import { touchText } from './touch.js';
import { Extras, inZone, redState } from './extras.js';

const DOWN = new THREE.Vector3(0, -1, 0);
const r3 = (x) => Math.round(x * 1000) / 1000;
const r2 = (x) => Math.round(x * 100) / 100;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));

const NO_INPUT = {
  mx: 0, my: 0, lookX: 0, lookY: 0, zoom: 0, jumpPressed: false, jumpHeld: false, dashPressed: false,
  poundPressed: false, abilityHeld: false, wavePressed: false, pausePressed: false,
};

const BOND_COLOR = '#c48dff';
const ACT_TOASTS = { bridge: 'A bridge rose up!', steps: 'Steps slid out of the wall!', door: 'A door opened!' };
const SEQ_OK = ['', 'Click...', 'Click... click...', 'Click... click... click...'];

export class Game {
  constructor(app, opts) {
    this.app = app;
    this.gfx = app.gfx;
    this.net = app.net;
    this.hud = app.hud;
    this.audio = app.audio;
    this.settings = app.settings;
    this.mode = opts.mode || 'play';
    this.level = opts.level;
    this.slot = opts.slot ?? 0;
    this.partnerSlot = 1 - this.slot;
    this.startTime = opts.startTime ?? this.net.serverNow();
    this.tex = this.gfx.tex;
    this.mats = this.gfx.mats;

    this.scene = new THREE.Scene();
    this.scene.environment = this.gfx.envMap;
    this.scene.environmentIntensity = 0.22;
    this.physics = new Physics();
    this.env = new Environment(this, this.level);
    this.world = new World(this, this.level);
    this.extras = new Extras(this, this.level);
    this.fx = new Effects(this.scene);
    this.rig = new CameraRig(this.gfx.camera, this.physics);
    this.gfx.setMood(this.level.theme.dark ? 'dark' : 'bright');
    setRimStrength(this.level.theme.dark ? 0.1 : 0.32);
    if (this.level.theme.dark) {
      // Indoors in the dark: almost no ambient light, a closer camera.
      this.scene.environmentIntensity = 0.03;
      this.rig.targetDist = this.rig.curDist = 5.6;
    }

    this.chars = CHARACTERS.map((def, i) => {
      const c = app.models ? new ModelCharacter(def, i, app.models[i]) : new Character(def, i, this.tex);
      this.scene.add(c.root);
      return c;
    });
    this.blobMat = new THREE.MeshBasicMaterial({
      map: this.tex.blob, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4,
    });
    this.blobGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
    this.blobs = this.chars.map(() => {
      const m = new THREE.Mesh(this.blobGeo, this.blobMat.clone());
      m.renderOrder = 2;
      this.scene.add(m);
      return m;
    });
    this.beams = { local: this.fx.beam('#ffffff'), remote: this.fx.beam('#ffffff') };
    this.tmp = { a: new THREE.Vector3(), b: new THREE.Vector3(), c: new THREE.Vector3(), d: new THREE.Vector3() };

    this.time = 0;
    this.gemCount = 0;
    this.deaths = 0;
    this.cps = [0, 0];
    this.myPlate = null;
    this.plateGrace = 0;
    this.inGoal = false;
    this.partnerInGoal = false;
    this.sendAcc = 0;
    this.ev = { jump: 0, djump: 0, land: 0, dash: 0, pound: 0, bounce: 0, launch: 0, hit: 0, respawn: 0, wave: 0, stick: 0, die: 0 };
    this.lastCount = null;
    this.fadeA = 0;
    this.paused = false;
    this.complete = false;
    this.hintsShown = new Set();
    this.stepPhase = 0;
    this.prevActs = {};
    this.prevSigs = {};
    this.magnetTarget = null;
    this.partnerMissingT = 0;
    this.sent = new Map(); // throttle for pickup / zone messages
    this.hidden = false;
    this.extraStatus = null;
    this.carrying = null;
    this.objective = null;
    this.objT = 0;
    this.noteCount = 0;

    if (this.mode === 'play') this.setupPlay(opts);
    else this.setupMenu();
  }

  get partnerName() {
    return this.app.names[this.partnerSlot] || CHARACTERS[this.partnerSlot].name;
  }

  setupPlay(opts) {
    this.gfx.camera.clearViewOffset();
    this.player = new LocalPlayer(this, this.slot);
    this.remote = new RemotePlayer(this, this.partnerSlot);
    this.cps = opts.checkpoints ? [...opts.checkpoints] : [0, 0];
    const ws = opts.world || { sig: {}, act: {} };
    this.world.applyState(ws);
    this.extras.applyState(ws);
    for (const id of opts.notes || []) this.extras.markNote(id);
    this.noteCount = (opts.notes || []).length;
    this.prevActs = { ...ws.act };
    this.prevSigs = { ...ws.sig };
    for (const id of opts.gems || []) {
      this.world.takeGem(id);
      const g = this.world.gems.get(id);
      if (g) g.anim = 1;
    }
    this.gemCount = (opts.gems || []).length;
    this.markCheckpoints();
    const cp = this.level.checkpoints[Math.min(this.cps[this.slot], this.level.checkpoints.length - 1)];
    this.player.spawnAt(cp.spawns[this.slot]);
    this.rig.snap(this.player.pos, this.player.yaw);
    const hud = this.hud;
    const label = this.level.label || `Level ${this.level.index + 1}`;
    hud.setLevel(label, this.level.name, this.level.segments.length, CHARACTERS.map((c) => c.color));
    hud.setProgress(this.cps);
    hud.setGems(this.gemCount, this.level.gems.length, false);
    hud.setNotes(this.noteCount, (this.level.notes || []).length);
    hud.carry(null);
    hud.objective(null);
    hud.resetStory();
    hud.journal = (this.level.notes || []).filter((n) => this.extras.found.has(n.id));
    const story = this.level.story;
    const left = this.startTime - 2500 - this.net.serverNow();
    if (story && story.intro && left > 1500) hud.storyCard({ ...story.intro, dark: this.level.mode === 'horror' }, { ms: left });
    else hud.title(label, this.level.name, this.level.twist ? this.level.twist.text : story?.tagline || '');
    if (this.net.serverNow() > this.startTime + 800) {
      this.lastCount = 0;
      this.showHint(this.cps[this.slot]);
    }
    this.audio.startMusic(this.musicKey);
  }

  get musicKey() {
    return this.level.mode === 'horror' ? `horror:${this.level.index}` : `${this.level.seed}:${this.level.index}`;
  }

  setupMenu() {
    const cp = this.level.checkpoints[0];
    this.menuCenter = new THREE.Vector3(cp.x, cp.y, cp.z);
    this.chars.forEach((c, i) => {
      const sp = cp.spawns[i];
      c.root.position.set(sp[0], sp[1], sp[2]);
    });
    this.waveT = 2;
  }

  markCheckpoints() {
    this.world.checkpoints.forEach((cp, i) => {
      cp.reached[0] = this.cps[0] >= i;
      cp.reached[1] = this.cps[1] >= i;
    });
  }

  showHint(segIndex) {
    const seg = this.level.segments[segIndex];
    if (!seg || !this.settings.hints) return;
    const key = `${this.level.index}:${segIndex}`;
    if (this.hintsShown.has(key)) return;
    this.hintsShown.add(key);
    this.hud.hint(this.app.input.usingTouch ? touchText(seg.hint) : seg.hint, 8);
  }

  setPaused(v) {
    this.paused = v;
  }

  // ---------------------------------------------------------------------------

  frame(dt, inp) {
    this.time += dt;
    if (this.mode === 'menu') {
      this.menuFrame(dt);
      return;
    }
    const now = this.net.serverNow();
    const t = Math.max(0, (now - this.startTime) / 1000);
    const started = now >= this.startTime;
    this.countdownTick(now);

    const active = started && !this.paused && !this.complete;
    const controls = active ? inp : NO_INPUT;

    this.world.update(dt, t, this.gfx.camera);
    this.extras.update(dt, t, this.player.pos);
    this.remote.update(dt, now);
    this.computeMagnetTarget();
    this.player.update(dt, controls, { yaw: this.rig.yaw });
    this.moveInput = Math.hypot(controls.mx, controls.my) + (controls.jumpPressed || controls.dashPressed ? 1 : 0);
    this.audio.setHum(this.player.mag.mode > 0 && !this.player.dead);
    if (controls.wavePressed) this.onLocal('wave');
    this.updateTriggers(dt);

    this.sendAcc += dt;
    if (this.sendAcc >= 1 / 30) {
      this.sendAcc = 0;
      this.sendState();
    }

    this.animateCharacters(dt);
    const p = this.player;
    if (this.extras.monsters.length) {
      const th = this.extras.threat(p.pos);
      this.audio.setThreat(p.dead ? Infinity : th.dist, th.chasing);
    }
    this.rig.update(dt, this.paused ? NO_INPUT : inp, p.pos, p.grounded || p.mag.mode === 2);
    this.updateBlobs();
    this.updateBeams(t);
    const scale = this.gfx.pointScale();
    this.env.update(dt, t, this.gfx.camera, this.rig.focus, scale);
    this.fx.setScale(scale);
    this.fx.update(dt);
    this.updateOverlay(dt);
    if (!this.app.renderEvery || (this.renderN = (this.renderN || 0) + 1) % this.app.renderEvery === 0) this.gfx.render(this.scene);
  }

  menuFrame(dt) {
    const t = this.time;
    this.world.update(dt, t, this.gfx.camera);
    this.extras.update(dt, t, this.menuCenter);
    const cam = this.gfx.camera;
    const c = this.menuCenter;
    const a = t * 0.1 + 0.6;
    const r = 10.5;
    cam.position.set(c.x + Math.cos(a) * r, c.y + 3.6 + Math.sin(t * 0.3) * 0.4, c.z + Math.sin(a) * r);
    cam.lookAt(c.x, c.y + 1.3, c.z);
    const w = window.innerWidth, h = window.innerHeight;
    if (w > 960) cam.setViewOffset(w, h, -w * 0.2, 0, w, h);
    else cam.clearViewOffset();
    this.waveT -= dt;
    if (this.waveT < 0) {
      this.chars[Math.floor(t) % 2].onWave();
      this.waveT = 3 + Math.random() * 3;
    }
    for (const ch of this.chars) {
      const p = ch.root.position;
      const yaw = Math.atan2(cam.position.x - p.x, cam.position.z - p.z);
      ch.update(dt, { speed: 0, vy: 0, grounded: true, dashing: false, pound: 0, magnet: 0, stuck: false, stunned: false, yaw });
    }
    this.updateBlobs();
    const scale = this.gfx.pointScale();
    this.env.update(dt, t, cam, c, scale);
    this.fx.setScale(scale);
    this.fx.update(dt);
    this.gfx.render(this.scene);
  }

  countdownTick(now) {
    if (this.lastCount === 0 && now > this.startTime + 800) {
      this.hud.countdown(null);
      return;
    }
    const rem = (this.startTime - now) / 1000;
    if (rem > 0) {
      const n = Math.ceil(rem);
      if (n <= 3) {
        if (this.lastCount !== n) {
          this.lastCount = n;
          this.audio.play('count');
        }
        this.hud.countdown(String(n));
      }
    } else if (rem > -0.8) {
      if (this.lastCount !== 0) {
        this.lastCount = 0;
        this.audio.play('go');
        this.showHint(this.cps[this.slot]);
      }
      this.hud.countdown('Go!');
    } else {
      this.hud.countdown(null);
    }
  }

  // -- magnets -------------------------------------------------------------------

  computeMagnetTarget() {
    const p = this.player;
    for (const pad of this.world.pads) pad.targeted = false;
    if (!p || p.dead) {
      this.magnetTarget = null;
      return;
    }
    const m = p.mag;
    if (m.mode === 1 || m.mode === 2) {
      m.target.targeted = true;
      this.magnetTarget = { kind: 'pad', pad: m.target, inReach: false, same: false };
      return;
    }
    if (m.mode === 3) {
      this.magnetTarget = m.target;
      return;
    }
    const { a: chest, b: d, c: e } = this.tmp;
    chest.set(p.pos.x, p.pos.y + 1.0, p.pos.z);
    const fwd = this.rig.forward;
    let best = null;
    let bestScore = -Infinity;
    for (const pad of this.world.pads) {
      if (pad.id === m.exclId && m.exclT > 0) continue;
      const same = pad.pol === p.pol;
      d.subVectors(pad.pos, chest);
      const dist = d.length();
      let inReach = false;
      // Launch pads only repel; the other character just gets told whose it is.
      const foreign = !same && !!pad.launch;
      if (foreign) {
        if (dist > 4.5) continue;
      } else if (same) {
        const hd = Math.hypot(p.pos.x - pad.x, p.pos.z - pad.z);
        inReach = !!pad.launch && hd < pad.reach && Math.abs(p.pos.y - pad.y) < 1.6;
        if (dist > 6) continue;
      } else if (dist > PHYS.magnetRange) continue;
      const ang = Math.acos(clamp(d.dot(fwd) / dist, -1, 1));
      let score;
      if (foreign) score = 0.05;
      else if (inReach) score = 3;
      else if (ang < 0.95) score = 2 - ang * 1.2 - (dist / PHYS.magnetRange) * 0.6;
      else if (dist < 7.5) score = 0.4 - dist * 0.05;
      else continue;
      if (score <= bestScore) continue;
      e.copy(pad.pos).addScaledVector(pad.normal, 0.35).sub(chest);
      const l = e.length();
      e.divideScalar(l);
      const hit = this.physics.raycast(chest, e, l - 0.25, (c) => c.kind === 'partner' || c.kind === 'field' || c.kind === 'plate' || c.id === pad.id);
      if (hit) continue;
      best = { kind: 'pad', pad, dist, inReach, same, foreign };
      bestScore = score;
    }
    const r = this.remote;
    if (r.present && !r.dead) {
      d.set(r.pos.x, r.pos.y + 1.0, r.pos.z).sub(chest);
      const dist = d.length();
      if (dist < PHYS.bondRange && dist > 2.3) {
        const ang = Math.acos(clamp(d.dot(fwd) / dist, -1, 1));
        const calling = r.magHeld && r.magMode === 0 && r.anchored;
        let score = ang < 0.75 ? 1.9 - ang - (dist / PHYS.bondRange) * 0.5 : -1;
        if (calling) score = Math.max(score, 2.6 - dist / PHYS.bondRange);
        if (score > 0 && score > bestScore) {
          e.copy(d).divideScalar(dist);
          const hit = this.physics.raycast(chest, e, dist - 0.6, (c) => c.kind === 'partner' || c.kind === 'field' || c.kind === 'plate');
          if (!hit) {
            const myStart = m.held ? m.holdStart : this.net.serverNow();
            best = { kind: 'partner', dist, calling, canBond: r.magHeld && r.anchored && r.magT < myStart };
            bestScore = score;
          }
        }
      }
    }
    if (best && best.kind === 'pad') best.pad.targeted = true;
    this.magnetTarget = best;
  }

  // -- triggers --------------------------------------------------------------------

  updateTriggers(dt) {
    const p = this.player;
    if (p.dead) {
      this.setPlate(null);
      return;
    }
    if (p.grounded && p.ground && p.ground.kind === 'crumble' && this.world.triggerCrumble(p.ground.id)) {
      this.net.send({ t: 'crumble', id: p.ground.id });
      this.audio.play('creak');
    }
    if (p.grounded && p.ground && p.ground.kind === 'trap' && this.extras.trigger(p.ground.id)) {
      this.net.send({ t: 'trap', id: p.ground.id });
      const d = p.ground.ref;
      if (d && d.kind === 'launch') p.launch(...d.launch, null);
    }
    this.updateExtras(dt);
    let plate = p.grounded && p.ground && p.ground.kind === 'plate' ? p.ground.id : null;
    if (plate) this.plateGrace = 0.12;
    else if (this.myPlate && this.plateGrace > 0) {
      this.plateGrace -= dt;
      plate = this.myPlate;
    }
    this.setPlate(plate);

    const cps = this.level.checkpoints;
    for (let i = this.cps[this.slot] + 1; i < cps.length; i++) {
      const cp = cps[i];
      if (Math.abs(p.pos.x - cp.x) < cp.size / 2 && Math.abs(p.pos.z - cp.z) < cp.size / 2 && p.pos.y > cp.y - 0.5 && p.pos.y < cp.y + 3.5) {
        this.reachCheckpoint(i);
        break;
      }
    }

    for (const g of this.world.gems.values()) {
      if (g.taken) continue;
      const dx = g.def.x - p.pos.x, dy = g.group.position.y - (p.pos.y + 0.8), dz = g.def.z - p.pos.z;
      if (dx * dx + dy * dy + dz * dz < 1.6 * 1.6) {
        this.world.takeGem(g.def.id);
        this.net.send({ t: 'gem', id: g.def.id });
        this.gemCount++;
        this.hud.setGems(this.gemCount, this.level.gems.length, true);
        this.audio.play('collect');
        this.fx.sparkle(g.group.position, '#ffd166', 26, 5, 0.4);
      }
    }

    const gl = this.level.goal;
    const inGoal = !!gl && Math.hypot(p.pos.x - gl.x, p.pos.z - gl.z) < 3.4 && p.pos.y > gl.y - 0.5 && p.pos.y < gl.y + 3.5;
    if (inGoal !== this.inGoal) {
      this.inGoal = inGoal;
      this.net.send({ t: 'goal', in: inGoal });
      if (inGoal) this.audio.play('bondArrive');
    }
  }

  // Once per id every so often (the server ignores repeats anyway).
  once(id, every = 0.6) {
    const now = this.time;
    if ((this.sent.get(id) ?? -99) > now - every) return false;
    this.sent.set(id, now);
    return true;
  }

  updateExtras(dt) {
    const p = this.player;
    const x = this.extras;
    const chest = this.tmp.a.set(p.pos.x, p.pos.y + 0.9, p.pos.z);
    // Pick things up.
    let status = null;
    for (const it of x.items.values()) {
      const d = it.def;
      const [holder, used] = x.itemState[d.id] || [-1, 0];
      if (used || holder !== -1 || (d.when && !x.sig(d.when))) continue;
      if (chest.distanceTo(this.tmp.b.set(d.x, d.y + 0.25, d.z)) > 1.9) continue;
      if (d.who !== null && d.who !== this.slot) {
        status = `Only ${CHARACTERS[d.who].name} can take the ${d.label}`;
        continue;
      }
      if (this.once(d.id)) this.net.send({ t: 'take', id: d.id });
    }
    // Put what I carry into a lock that wants it.
    const mine = x.heldBy(this.slot);
    for (const l of x.locks.values()) {
      const d = l.def;
      if (Math.hypot(p.pos.x - d.x, p.pos.z - d.z) > d.radius || Math.abs(p.pos.y - d.y) > 2.5) continue;
      if (mine && d.accepts.includes(mine.id)) {
        if (this.once(d.id)) this.net.send({ t: 'use', id: d.id });
      } else if (!status) {
        const missing = d.accepts.filter((id) => (x.itemState[id] || [-1, 0])[1] !== 1).length;
        if (missing) status = `${d.label}: ${missing} more ${missing === 1 ? 'thing' : 'things'} needed`;
      }
    }
    // Story pages.
    for (const n of x.notes.values()) {
      if (x.found.has(n.def.id)) continue;
      if (chest.distanceTo(this.tmp.b.set(n.def.x, n.def.y, n.def.z)) < 1.7 && this.once(n.def.id)) this.net.send({ t: 'note', id: n.def.id });
    }
    // Lava / water.
    if (x.floods.length && !p.dead && x.inFlood(p.pos)) {
      p.die();
      return;
    }
    // Zones.
    let hidden = false, safe = false;
    let gmul = 1, tether = null;
    for (const z of x.zones) {
      if (!inZone(z, p.pos)) continue;
      // when / until may be one signal or a list (any of them).
      if ((z.when && ![].concat(z.when).some((id) => x.sig(id))) || (z.until && [].concat(z.until).some((id) => x.sig(id)))) continue;
      // pulse: [period, phase, duty] — the zone only works for that part of each cycle.
      if (z.pulse && ((((this.world.time / z.pulse[0] + (z.pulse[1] || 0)) % 1) + 1) % 1) >= (z.pulse[2] ?? 0.5)) continue;
      if (z.kind === 'trigger') {
        if (!x.sig(z.id) && this.once(z.id, 1)) this.net.send({ t: 'zone', id: z.id });
      } else if (z.kind === 'kill') {
        if (z.scare) this.scare('zone', z.scare);
        else p.die();
        return;
      } else if (z.kind === 'warp') {
        if (z.both) {
          if (this.once(z.id, 1.5)) this.net.send({ t: 'warp', id: z.id });
        } else {
          this.warp(z);
        }
        return;
      } else if (z.kind === 'hide') {
        hidden = true;
      } else if (z.kind === 'safe') {
        safe = true;
      } else if (z.kind === 'gravity') {
        gmul = Math.min(gmul, z.g ?? 0.4);
      } else if (z.kind === 'tether') {
        tether = z;
      } else if (z.kind === 'nolook') {
        // "Don't look back": facing `at` for a moment breaks the rule.
        const f = this.rig.forward;
        const dx = z.at[0] - p.pos.x, dz = z.at[2] - p.pos.z;
        const d = Math.hypot(dx, dz), fl = Math.hypot(f.x, f.z) || 1;
        if (d > 0.6 && (dx * f.x + dz * f.z) / (d * fl) > Math.cos(z.cone ?? 0.6)) {
          this.nolookT = (this.nolookT || 0) + dt;
          if (this.nolookT > 0.4) {
            this.nolookT = 0;
            this.scare('nolook', z.text || 'You looked back.');
            return;
          }
        } else {
          this.nolookT = 0;
        }
      } else if (z.kind === 'redlight') {
        const r = redState(z, this.world.time);
        // Knock-rule zones: three knocks warn you to stand still.
        if (z.fx === 'knock') {
          this.knockWarn ||= new Map();
          if (r.warn && !this.knockWarn.get(z.id)) {
            this.audio.play('knock', this.spatial(this.tmp.c.set(z.x, z.y, z.z)));
            if (z.say) this.hud.subtitle(z.say);
          }
          this.knockWarn.set(z.id, r.warn);
        }
        // Only moving on purpose counts (not being bumped by your partner).
        if (r.red && r.since > 0.4 && Math.hypot(p.vel.x, p.vel.z) > 1.5 && this.moveInput > 0.2) {
          this.scare('redlight', z.text || 'You moved while the red light was on.');
          return;
        }
      }
    }
    p.gmul = gmul;
    if (tether) this.pullRope(tether, dt);
    if (hidden !== this.hidden) {
      this.hidden = hidden;
      if (hidden) this.audio.play('creak');
    }
    if (hidden) status = 'Hidden — it can\'t see you';
    else if (safe && !status) status = 'Safe zone — it won\'t come in';
    this.extraStatus = status;
    if ((mine?.id || null) !== (this.carrying?.id || null)) {
      this.carrying = mine;
      this.hud.carry(mine);
    }
    this.objT -= dt;
    if (this.objT <= 0) {
      this.objT = 0.3;
      this.updateObjective();
    }
  }

  objectiveDone(c) {
    const x = this.extras;
    const ws = this.world.state;
    if (c.act) return ws.act[c.act] === 1;
    if (c.sig) return ws.sig[c.sig] === 1;
    if (c.cp !== undefined) return Math.max(...this.cps) >= c.cp;
    if (c.cpBoth !== undefined) return Math.min(...this.cps) >= c.cpBoth; // both of you got this far
    if (c.note) return x.found.has(c.note);
    if (c.notes !== undefined) return x.found.size >= c.notes;
    if (c.item) return (x.itemState[c.item] || [-1, 0])[0] !== -1 || (x.itemState[c.item] || [-1, 0])[1] === 1;
    if (c.used) return (x.itemState[c.used] || [-1, 0])[1] === 1;
    return false;
  }

  updateObjective() {
    const list = this.level.objectives || [];
    const cur = list.find((o) => !this.objectiveDone(o.done || {}));
    const text = cur ? cur.text : null;
    if (text !== this.objective) {
      if (this.objective && text) this.audio.play('checkpoint');
      this.objective = text;
      this.hud.objective(text);
    }
  }

  // Broke a story rule or got caught: a scare, then back to the checkpoint.
  scare(rule, text) {
    const p = this.player;
    if (p.dead) return;
    this.hud.scare(text);
    this.audio.play('sting');
    this.rig.addShake(1);
    p.die();
    if (rule) this.net.send({ t: 'scare', rule });
  }

  // Tied together. Whoever walks away pulls (at about half speed) and the
  // other one gets dragged along; if both pull apart, the rope holds.
  pullRope(z, dt) {
    const p = this.player;
    const r = this.remote;
    if (!r.present || r.dead || p.dead || !this.extras.tetherAt(r.pos)) return;
    const d = this.tmp.d.subVectors(r.pos, p.pos);
    d.y *= 0.5;
    const dist = d.length();
    const len = z.len ?? 7;
    if (dist <= len || dist < 1e-3) return;
    d.multiplyScalar(1 / dist);
    const excess = dist - len;
    const out = -p.vel.dot(d);
    if (this.moveInput > 0.2 && out > 0.5) {
      const cap = PHYS.runSpeed * 0.45;
      if (out > cap) p.vel.addScaledVector(d, out - cap);
      if (excess > 1.5) p.pos.addScaledVector(d, Math.min(0.3, (excess - 1.5) * 0.5));
    } else {
      if (out > 0) p.vel.addScaledVector(d, out);
      const up = r.pos.y - p.pos.y;
      if (up > 0.5) {
        // Hanging below your partner: the rope runs over the edge, so it holds
        // you and lifts you straight up (and a little in) — hauling works.
        if (p.vel.y < 0) p.vel.y = 0;
        p.pos.y += Math.min(0.13, excess * 0.5, up);
        const k = Math.min(0.15, excess * 0.25);
        p.pos.x += d.x * k;
        p.pos.z += d.z * k;
      } else {
        p.pos.addScaledVector(d, Math.min(0.4, excess * 0.5));
      }
    }
  }

  // A flashlight beam caught a monster.
  onMonsterFrozen(m) {
    if (m.pos.distanceTo(this.player.pos) > 14) return;
    if (this.time - (this.frozenSaid || -99) < 12) return;
    this.frozenSaid = this.time;
    this.hud.subtitle(this.level.theme.dark && !m.def.seen ? 'Caught it in the light — it can\'t move!' : 'It stopped... don\'t look away.');
  }

  // Step through a warp: a blink of black and you're somewhere else.
  warp(z) {
    const p = this.player;
    if (p.dead || !z.to) return;
    const [x, y, zz, yaw = 0] = z.to;
    const off = z.side ?? 1.1;
    const side = this.slot === 0 ? -off : off;
    const speed = p.vel.length();
    this.setPlate(null);
    p.spawnAt([x + Math.cos(yaw) * side, y, zz - Math.sin(yaw) * side, yaw]);
    // Portals can throw you out: as fast as you went in, or at a set velocity.
    if (z.keep) {
      const s = Math.max(typeof z.keep === 'number' ? z.keep : 0, speed);
      p.launch(Math.sin(yaw) * s * 0.9, Math.max(3, s * 0.3), Math.cos(yaw) * s * 0.9, null);
    } else if (z.fling) {
      p.launch(z.fling[0], z.fling[1], z.fling[2], null);
    }
    this.rig.snap(p.pos, p.yaw);
    this.fadeA = z.portal ? 0.35 : 1;
    if (!z.quiet) this.audio.play(z.portal ? 'respawn' : 'whisper', { vol: 0.6 });
    if (z.text) this.hud.subtitle(z.text);
    if (z.scare) {
      // A wrong turn: a jump scare on the way back.
      this.hud.scare(z.scare);
      this.audio.play('sting');
      this.rig.addShake(0.8);
    }
    this.sendState();
  }

  playZoneFx(z) {
    const list = Array.isArray(z.fx) ? z.fx : z.fx ? [z.fx] : [];
    const pos = this.tmp.c.set(z.x, z.y, z.z);
    for (const fx of list) {
      if (fx === 'slam') {
        this.audio.play('slam', this.spatial(pos));
        this.rig.addShake(0.5);
      } else if (fx === 'lightsOut') {
        this.extras.blackout = 2.6;
        this.audio.play('buzz');
      } else if (fx === 'whisper') {
        this.audio.play('whisper');
      } else if (fx === 'apparition' && z.look) {
        const yaw = Math.atan2(this.player.pos.x - z.look[0], this.player.pos.z - z.look[2]);
        this.extras.apparition(z.look, yaw);
        this.audio.play('sting', { vol: 0.5 });
      } else if (fx === 'knock') {
        this.audio.play('knock', this.spatial(pos));
      } else if (fx === 'sting') {
        this.audio.play('sting', { vol: 0.7 });
      }
    }
    if (z.text) this.hud.subtitle(z.text);
  }

  setPlate(id) {
    if (id === this.myPlate) return;
    if (this.myPlate) {
      this.net.send({ t: 'plate', id: this.myPlate, on: false });
      const pl = this.world.plates.get(this.myPlate);
      if (pl) pl.localOn = false;
      this.audio.play('plateOff');
    }
    this.myPlate = id;
    if (id) {
      this.net.send({ t: 'plate', id, on: true });
      const pl = this.world.plates.get(id);
      if (pl) pl.localOn = true;
      this.audio.play('plateOn');
    }
  }

  reachCheckpoint(i) {
    this.cps[this.slot] = i;
    this.net.send({ t: 'cp', idx: i });
    const cp = this.world.checkpoints[i];
    if (cp) cp.reached[this.slot] = true;
    this.hud.setProgress(this.cps);
    this.audio.play('checkpoint');
    const def = this.level.checkpoints[i];
    if (def.flag) {
      const f = this.tmp.d.set(def.flag[0], def.flag[1] + 2.8, def.flag[2]);
      this.fx.sparkle(f, CHARACTERS[this.slot].color, 30, 4, 0.4);
    }
    if (!def.goal) {
      this.hud.toast('Checkpoint — progress saved', 'cp');
      this.showHint(i);
    }
  }

  respawnLocal() {
    const cp = this.level.checkpoints[this.cps[this.slot]];
    this.player.spawnAt(cp.spawns[this.slot]);
    this.rig.snap(this.player.pos, this.player.yaw);
    this.chars[this.slot].onRespawn();
    this.fx.sparkle(this.tmp.a.copy(this.player.pos).setY(this.player.pos.y + 0.8), CHARACTERS[this.slot].color, 20, 3);
    this.audio.play('respawn');
    this.ev.respawn++;
    this.sendState();
  }

  sendState() {
    const p = this.player;
    let flags = 0;
    if (p.grounded) flags |= FLAG.grounded;
    if (p.dashing) flags |= FLAG.dashing;
    if (p.mag.mode === 2) flags |= FLAG.stuck;
    if (p.mag.held) flags |= FLAG.magHeld;
    if (p.dead) flags |= FLAG.dead;
    if (p.stunT > 0) flags |= FLAG.stunned;
    const msg = {
      t: 'st',
      ts: Math.round(this.net.serverNow()),
      p: [r3(p.pos.x), r3(p.pos.y), r3(p.pos.z)],
      v: [r2(p.vel.x), r2(p.vel.y), r2(p.vel.z)],
      y: r3(p.yaw),
      ly: r3(Math.atan2(this.rig.forward.x, this.rig.forward.z)),
      f: flags,
      pd: p.pound,
      m: p.mag.mode,
      mt: p.mag.mode === 1 || p.mag.mode === 2 ? p.mag.target.id : null,
      ms: Math.round(p.mag.holdStart),
      ev: this.ev,
    };
    const g = p.grounded ? p.ground : null;
    if (g && g.dynamic && g.kind !== 'partner') {
      msg.g = g.id;
      g.toLocal(p.pos, this.tmp.d);
      msg.l = [r3(this.tmp.d.x), r3(this.tmp.d.y), r3(this.tmp.d.z)];
    }
    this.net.send(msg);
  }

  // -- events ------------------------------------------------------------------------

  spatial(pos) {
    const cam = this.gfx.camera;
    const d = this.tmp.c.subVectors(pos, cam.position);
    const dist = d.length();
    const right = this.tmp.d.set(1, 0, 0).applyQuaternion(cam.quaternion);
    return { vol: clamp(1.15 - dist / 40, 0.1, 1), pan: dist > 0.01 ? clamp(d.dot(right) / dist, -1, 1) * 0.8 : 0 };
  }

  onLocal(type, data = {}) {
    const p = this.player;
    const ch = this.chars[this.slot];
    const color = CHARACTERS[this.slot].color;
    switch (type) {
      case 'jump':
        ch.onJump();
        this.fx.puff(p.pos, 7, '#f3e6d8', 2.5, 0.5);
        this.audio.play('jump');
        this.ev.jump++;
        break;
      case 'djump':
        ch.onDoubleJump();
        this.fx.sparkle(this.tmp.a.copy(p.pos).setY(p.pos.y + 0.4), color, 12, 3, 0.3, 0.2);
        this.audio.play('djump');
        this.ev.djump++;
        break;
      case 'land': {
        const impact = data.impact || 0;
        if (impact > 4) {
          ch.onLand(impact);
          this.fx.puff(p.pos, impact > 16 ? 14 : 6, '#f3e6d8', 2 + impact * 0.12, 0.55);
          this.audio.play('land', { impact });
          this.ev.land++;
          if (impact > 24) this.rig.addShake(0.25);
        }
        break;
      }
      case 'dash':
        this.fx.puff(p.pos, 6, '#ffffff', 3, 0.45);
        this.audio.play('dash');
        this.rig.kickFov(7);
        this.ev.dash++;
        break;
      case 'poundStart':
        this.audio.play('poundStart');
        break;
      case 'poundLand': {
        ch.onPoundLand();
        this.fx.ring(p.pos, '#ffffff', 3.6);
        this.fx.puff(p.pos, 22, '#f3e6d8', 6, 0.7);
        this.rig.addShake(0.55);
        this.audio.play('pound');
        this.ev.pound++;
        const c = data.collider;
        if (c && c.kind === 'switch') {
          this.net.send({ t: 'pound', id: c.id });
          const w = this.world.switches.get(c.id);
          if (w) w.flash = 0.25;
          this.audio.play('switch');
          this.fx.sparkle(this.tmp.a.copy(c.pos).setY(c.pos.y + 0.5), '#ffcf4d', 20, 4);
        } else if (c && c.kind === 'seesaw') {
          this.net.send({ t: 'pound', id: c.id });
        }
        break;
      }
      case 'bounce':
        this.world.bounce(data.collider.id, data.strong ? 10 : 4);
        ch.onJump();
        this.fx.ring(p.pos, '#ffffff', 2.4, 0.35);
        this.audio.play('bounce', { strong: data.strong });
        this.ev.bounce++;
        this.lastBounce = data.collider.id; // (read by test bots)
        this.lastBounceStrong = !!data.strong;
        break;
      case 'launch': {
        this.audio.play('launch');
        this.rig.kickFov(9);
        this.fx.sparkle(p.pos, color, 30, 7, 0.45, 1.5);
        this.fx.ring(p.pos, color, 3);
        const pad = data.source;
        if (pad && pad.faceMat) pad.glow = 1;
        this.ev.launch++;
        break;
      }
      case 'attract':
        this.audio.play('attract');
        break;
      case 'stick':
        this.audio.play('stick');
        this.fx.sparkle(data.pad.pos, CHARACTERS[this.partnerSlot].color, 16, 3, 0.3);
        data.pad.glow = 1;
        this.ev.stick++;
        break;
      case 'magnetOff':
        this.audio.play('magnetOff');
        break;
      case 'bond':
        this.audio.play('bond');
        break;
      case 'bondOff':
        break;
      case 'bondArrive':
        this.audio.play('bondArrive');
        this.fx.sparkle(p.pos, BOND_COLOR, 24, 4, 0.4);
        break;
      case 'hit':
        this.audio.play('hit');
        this.rig.addShake(0.4);
        this.fx.sparkle(this.tmp.a.copy(p.pos).setY(p.pos.y + 1), '#ffffff', 10, 4, 0.3);
        this.ev.hit++;
        break;
      case 'die':
        this.audio.play('die');
        this.deaths++;
        this.net.send({ t: 'died' });
        this.setPlate(null);
        this.ev.die++;
        break;
      case 'wave':
        ch.onWave();
        this.audio.play('wave');
        this.ev.wave++;
        break;
      default:
        break;
    }
  }

  onRemote(key) {
    const r = this.remote;
    const ch = this.chars[this.partnerSlot];
    const pos = r.pos;
    const sp = this.spatial(pos);
    const color = CHARACTERS[this.partnerSlot].color;
    switch (key) {
      case 'jump':
        ch.onJump();
        this.fx.puff(pos, 6, '#f3e6d8', 2.5, 0.5);
        this.audio.play('jump', sp);
        break;
      case 'djump':
        ch.onDoubleJump();
        this.fx.sparkle(this.tmp.a.copy(pos).setY(pos.y + 0.4), color, 12, 3, 0.3, 0.2);
        this.audio.play('djump', sp);
        break;
      case 'land':
        ch.onLand(12);
        this.fx.puff(pos, 6, '#f3e6d8', 3, 0.55);
        this.audio.play('land', { ...sp, impact: 12 });
        break;
      case 'dash':
        this.fx.puff(pos, 6, '#ffffff', 3, 0.45);
        this.audio.play('dash', sp);
        break;
      case 'pound':
        ch.onPoundLand();
        this.fx.ring(pos, '#ffffff', 3.6);
        this.fx.puff(pos, 18, '#f3e6d8', 6, 0.7);
        this.audio.play('pound', sp);
        if (pos.distanceTo(this.player.pos) < 14) this.rig.addShake(0.25);
        break;
      case 'bounce': {
        ch.onJump();
        this.audio.play('bounce', sp);
        for (const b of this.world.bouncers.values()) {
          if (Math.hypot(b.def.x - pos.x, b.def.z - pos.z) < b.def.r + 0.8) this.world.bounce(b.def.id, 5);
        }
        break;
      }
      case 'launch':
        this.audio.play('launch', sp);
        this.fx.sparkle(pos, color, 26, 7, 0.45, 1.5);
        this.fx.ring(pos, color, 3);
        break;
      case 'hit':
        this.audio.play('hit', sp);
        break;
      case 'respawn':
        ch.onRespawn();
        this.fx.sparkle(this.tmp.a.copy(pos).setY(pos.y + 0.8), color, 20, 3);
        this.audio.play('respawn', sp);
        break;
      case 'die':
        this.audio.play('die', { ...sp, vol: sp.vol * 0.6 });
        break;
      case 'wave':
        ch.onWave();
        this.audio.play('wave', sp);
        break;
      case 'stick':
        this.audio.play('stick', sp);
        break;
      default:
        break;
    }
  }

  onNet(msg) {
    if (this.mode !== 'play') return;
    switch (msg.t) {
      case 'st':
        if (msg.slot === this.partnerSlot) {
          this.remote.push(msg);
          this.remote.look = msg.ly;
        }
        break;
      case 'world':
        this.onWorld(msg);
        break;
      case 'gem': {
        const g = this.world.gems.get(msg.id);
        if (g && !g.taken) {
          this.world.takeGem(msg.id);
          this.fx.sparkle(g.group.position, '#ffd166', 20, 4, 0.4);
          this.audio.play('collect', this.spatial(g.group.position));
        }
        const pop = msg.count !== this.gemCount;
        this.gemCount = msg.count;
        this.hud.setGems(this.gemCount, this.level.gems.length, pop && msg.by !== this.slot);
        break;
      }
      case 'cp':
        this.cps[msg.slot] = Math.max(this.cps[msg.slot], msg.idx);
        if (this.world.checkpoints[msg.idx]) this.world.checkpoints[msg.idx].reached[msg.slot] = true;
        this.hud.setProgress(this.cps);
        break;
      case 'fx':
        if (msg.kind === 'seesaw') this.onSeesaw(msg);
        else if (msg.kind === 'crumble') this.world.triggerCrumble(msg.id);
        else this.onFx(msg);
        break;
      case 'note': {
        this.extras.markNote(msg.id);
        this.noteCount = msg.count;
        this.hud.setNotes(this.noteCount, (this.level.notes || []).length, true);
        const n = (this.level.notes || []).find((x) => x.id === msg.id);
        if (n) {
          this.audio.play('page');
          this.hud.note(n, msg.by === this.slot ? 'You found a note' : `${this.partnerName} found a note`);
        }
        break;
      }
      case 'caught':
        if (msg.slot === this.slot) this.scare(null, 'It caught you.');
        else {
          this.hud.toast(`${this.partnerName} was caught!`, 'warn');
          this.audio.play('sting', { ...this.spatial(this.remote.pos), vol: 0.5 });
        }
        break;
      case 'mon':
        this.extras.onMon(msg.m);
        break;
      case 'goal':
        if (msg.slot === this.partnerSlot) this.partnerInGoal = msg.in;
        break;
      case 'peer':
        if (msg.slot === this.partnerSlot) {
          if (!msg.connected) {
            this.remote.setGone();
            this.hud.toast(`${msg.name || this.partnerName} disconnected`, 'warn');
          } else {
            this.hud.toast(`${msg.name || this.partnerName} joined!`, 'good');
          }
        }
        break;
      case 'toast':
        this.hud.toast(msg.text);
        break;
      default:
        break;
    }
  }

  onFx(msg) {
    const x = this.extras;
    switch (msg.kind) {
      case 'trap': {
        if (!x.trigger(msg.id)) break;
        // Caught on the same block as the partner: same fate.
        const p = this.player;
        const tr = x.traps.get(msg.id);
        if (tr && tr.def.kind === 'launch' && p.grounded && p.ground && p.ground.id === msg.id) p.launch(...tr.def.launch, null);
        break;
      }
      case 'take': {
        const it = x.items.get(msg.id);
        if (!it) break;
        this.audio.play('collect', this.spatial(it.pos));
        const who = msg.by === this.slot ? 'You' : this.partnerName;
        this.hud.toast(`${who} got the ${it.def.label}`, 'good');
        break;
      }
      case 'use': {
        const l = x.locks.get(msg.id);
        const it = x.items.get(msg.item);
        this.audio.play('unlock');
        if (l) this.fx.sparkle(this.tmp.a.set(l.def.x, l.def.y + 1.2, l.def.z), it ? it.def.color : '#ffd166', 30, 4);
        if (it) this.hud.toast(`${it.def.label} → ${l ? l.def.label : 'Lock'}`, 'good');
        break;
      }
      case 'seq':
        if (msg.ok) this.audio.play('switch');
        else {
          this.audio.play('buzz');
          this.hud.toast('Wrong order — it reset. Start again!', 'warn');
        }
        if (msg.ok && msg.n > 0 && SEQ_OK[msg.n]) this.hud.toast(SEQ_OK[msg.n]);
        break;
      case 'scare':
        if (msg.slot !== this.slot) {
          this.hud.toast(`${this.partnerName} broke a rule...`, 'warn');
          this.audio.play('sting', { ...this.spatial(this.remote.pos), vol: 0.45 });
        }
        break;
      case 'dial': {
        const d = this.level.dials.find((q) => q.id === msg.id);
        if (d) this.audio.play('switch', this.spatial(this.tmp.a.set(d.x, d.y, d.z)));
        break;
      }
      case 'warp': {
        const z = x.zones.find((q) => q.id === msg.id);
        if (z) this.warp(z);
        break;
      }
      case 'gaveup':
        if (msg.why === 'safe') this.hud.subtitle('It stops at the doorway and slowly backs into the dark...');
        else if (msg.why === 'tired' || msg.why === 'area') this.hud.subtitle('It gives up the chase... and turns back.');
        break;
      case 'vanish':
        break;
      case 'spotted':
        if (msg.slot === this.slot) {
          this.hud.toast('It saw you — run!', 'warn');
          this.audio.play('spotted');
        } else {
          this.hud.toast(`It's chasing ${this.partnerName}!`, 'warn');
        }
        break;
      default:
        break;
    }
  }

  onWorld(msg) {
    const prevA = this.prevActs;
    const prevS = this.prevSigs;
    this.world.applyState(msg);
    this.extras.applyState(msg);
    for (const z of this.extras.zones) {
      if (z.kind === 'trigger' && msg.sig[z.id] === 1 && prevS[z.id] !== 1) this.playZoneFx(z);
    }
    let unlocked = null;
    for (const a of this.level.acts) {
      const was = prevA[a.id] === 1;
      const now = msg.act[a.id] === 1;
      if (now !== was) {
        const sp = this.spatial(this.tmp.a.set(a.x, a.y, a.z));
        this.audio.play('mechanism', { ...sp, vol: sp.vol * (now ? 1 : 0.5) });
        if (now && a.latch) unlocked = a;
      }
    }
    if (unlocked) {
      this.audio.play('unlock');
      if (!unlocked.quiet) this.hud.toast(unlocked.toast || ACT_TOASTS[unlocked.style] || 'Something opened!', 'good');
    }
    for (const w of this.level.switches) {
      if (msg.sig[w.id] === 1 && prevS[w.id] !== 1) {
        const sw = this.world.switches.get(w.id);
        if (sw && sw.flash <= 0) this.audio.play('switch', this.spatial(this.tmp.a.set(w.x, w.y, w.z)));
      }
    }
    this.prevActs = { ...msg.act };
    this.prevSigs = { ...msg.sig };
  }

  onSeesaw(msg) {
    this.world.seesawFire(msg.id, msg.end);
    const s = this.world.seesaws.get(msg.id);
    if (!s) return;
    const sp = this.spatial(this.tmp.a.set(s.def.x, s.def.y, s.def.z));
    this.audio.play('bounce', { ...sp, strong: true });
    const other = s.ends[msg.end === 'A' ? 'B' : 'A'];
    const p = this.player;
    if (p.dead || p.mag.mode) return;
    // Generous: also catch someone who just hopped on the end.
    const l = other.toLocal(p.pos, this.tmp.b);
    const onEnd = Math.abs(l.x) < other.hx + 0.3 && Math.abs(l.z) < other.hz + 0.3 && p.pos.y - other.top() > -0.2 && p.pos.y - other.top() < 1.4;
    if (onEnd) p.launch(0, PHYS.seesawVel, 0, 'seesaw');
  }

  // -- visuals -----------------------------------------------------------------------

  animateCharacters(dt) {
    const p = this.player;
    const me = this.chars[this.slot];
    me.root.position.copy(p.pos);
    me.setVisible(!p.dead);
    const hs = Math.hypot(p.vel.x, p.vel.z);
    const r = this.remote;
    // Where the arms reach: the magnet pad, or the partner on the other end of a bond.
    const anchoring = p.mag.held && r.present && r.magMode === 3;
    const myReach = p.mag.mode === 1 || p.mag.mode === 2 ? p.mag.target.pos : p.mag.mode === 3 || anchoring ? r.pos : null;
    me.update(dt, {
      speed: hs, vy: p.vel.y, grounded: p.grounded, dashing: p.dashing, pound: p.pound,
      magnet: p.mag.mode || (anchoring ? 3 : 0), stuck: p.mag.mode === 2, stunned: p.stunT > 0, yaw: p.yaw,
      carry: !!this.extras.heldBy(this.slot), reach: myReach,
    });
    if (p.grounded && hs > 2 && !p.dashing) {
      const ph = Math.floor(me.phase / Math.PI);
      if (ph !== this.stepPhase) {
        this.stepPhase = ph;
        this.fx.footstep(p.pos);
        this.audio.play('step');
      }
    }
    if (p.dashing) this.fx.trail(p.pos, CHARACTERS[this.slot].color);

    const other = this.chars[this.partnerSlot];
    const vis = r.present && !r.dead;
    other.setVisible(vis);
    if (vis) {
      other.root.position.copy(r.pos);
      const theyAnchor = r.magHeld && p.mag.mode === 3;
      const pad = r.magMode === 1 || r.magMode === 2 ? this.world.pads.find((x) => x.id === r.magTarget) : null;
      other.update(dt, {
        speed: Math.hypot(r.vel.x, r.vel.z), vy: r.vel.y, grounded: r.grounded, dashing: (r.flags & FLAG.dashing) !== 0,
        pound: r.pound, magnet: r.magMode || (theyAnchor ? 3 : 0), stuck: r.stuck, stunned: (r.flags & FLAG.stunned) !== 0, yaw: r.yaw,
        carry: !!this.extras.heldBy(this.partnerSlot), reach: pad ? pad.pos : r.magMode === 3 || theyAnchor ? p.pos : null,
      });
      if (r.flags & FLAG.dashing) this.fx.trail(r.pos, CHARACTERS[this.partnerSlot].color);
    }
  }

  updateBlobs() {
    const o = this.tmp.a;
    for (let i = 0; i < 2; i++) {
      const ch = this.chars[i];
      const blob = this.blobs[i];
      if (!ch.root.visible) {
        blob.visible = false;
        continue;
      }
      o.copy(ch.root.position);
      o.y += 0.3;
      const hit = this.physics.raycast(o, DOWN, 40, (c) => c.kind === 'partner' || c.kind === 'field');
      if (!hit) {
        blob.visible = false;
        continue;
      }
      const h = Math.max(0, hit.t - 0.3);
      blob.visible = true;
      blob.position.set(o.x, o.y - hit.t + 0.03, o.z);
      blob.scale.setScalar(1.15 * Math.max(0.4, 1 - h / 14));
      blob.material.opacity = Math.max(0.18, 0.8 - h / 12);
    }
  }

  updateBeams(t) {
    const p = this.player;
    const m = p.mag;
    const { a, b } = this.tmp;
    a.set(p.pos.x, p.pos.y + 0.9, p.pos.z);
    const r = this.remote;
    if (!p.dead && (m.mode === 1 || m.mode === 2)) {
      this.fx.setBeam(this.beams.local, a, m.target.pos, true, t, CHARACTERS[this.partnerSlot].color);
    } else if (!p.dead && r.present && (m.mode === 3 || (m.held && this.magnetTarget?.kind === 'partner'))) {
      b.set(r.pos.x, r.pos.y + 0.9, r.pos.z);
      this.fx.setBeam(this.beams.local, a, b, true, t, BOND_COLOR);
    } else {
      this.fx.setBeam(this.beams.local, a, a, false);
    }
    if (r.present && !r.dead && (r.magMode === 1 || r.magMode === 2)) {
      const pad = this.world.pads.find((x) => x.id === r.magTarget);
      a.set(r.pos.x, r.pos.y + 0.9, r.pos.z);
      if (pad) this.fx.setBeam(this.beams.remote, a, pad.pos, true, t, CHARACTERS[this.slot].color);
      else this.fx.setBeam(this.beams.remote, a, a, false);
    } else if (r.present && !r.dead && r.magMode === 3 && !p.dead) {
      a.set(r.pos.x, r.pos.y + 0.9, r.pos.z);
      b.set(p.pos.x, p.pos.y + 0.9, p.pos.z);
      this.fx.setBeam(this.beams.remote, a, b, true, t, BOND_COLOR);
    } else {
      this.fx.setBeam(this.beams.remote, a, a, false);
    }
  }

  project(v) {
    const e = this.tmp.c.copy(v).project(this.gfx.camera);
    const behind = this.tmp.d.copy(v).sub(this.gfx.camera.position).dot(this.rig.forward) < 0;
    return { x: (e.x * 0.5 + 0.5) * window.innerWidth, y: (-e.y * 0.5 + 0.5) * window.innerHeight, behind, nx: e.x, ny: e.y };
  }

  key(k) {
    const pad = this.app.input.usingPad;
    const map = this.app.input.usingTouch ? { E: 'MAGNET', Space: 'JUMP', Shift: 'DASH', C: 'POUND' } : { E: pad ? 'RB' : 'E', Space: pad ? 'A' : 'Space', Shift: pad ? 'X' : 'Shift', C: pad ? 'B' : 'C' };
    return `<kbd>${map[k] || k}</kbd>`;
  }

  updateOverlay(dt) {
    const hud = this.hud;
    const p = this.player;
    const r = this.remote;
    const pName = this.partnerName;

    // Magnet reticle + prompt
    const tgt = this.magnetTarget;
    let prompt = null;
    if (tgt && !p.dead && !this.paused) {
      const pos = tgt.kind === 'pad' ? tgt.pad.pos : this.tmp.a.set(r.pos.x, r.pos.y + 1.0, r.pos.z);
      const s = this.project(pos);
      const color = tgt.kind === 'partner' ? BOND_COLOR : tgt.pad.pol > 0 ? CHARACTERS[0].color : CHARACTERS[1].color;
      hud.reticle(s.x, s.y, color, !s.behind, p.mag.mode > 0);
      if (tgt.kind === 'pad') {
        if (p.mag.mode === 2) prompt = `Let go of ${this.key('E')} to drop · press ${this.key('Space')} to jump off`;
        else if (p.mag.mode === 0) {
          if (tgt.foreign) prompt = `${CHARACTERS[this.partnerSlot].name}'s launch pad — only ${this.partnerName} can use it`;
          else if (tgt.same) prompt = tgt.inReach ? `Hold ${this.key('E')} to launch!` : tgt.pad.launch ? 'Stand on the pad to launch' : 'Same colors repel';
          else prompt = `Hold ${this.key('E')} to pull yourself over`;
        }
      } else if (p.mag.mode === 3) {
        prompt = `Flying to ${pName}...`;
      } else if (tgt.calling) {
        prompt = `${pName} is calling you — hold ${this.key('E')} to fly over`;
      } else if (p.mag.held) {
        prompt = `Calling ${pName}... when they hold ${this.key('E')}, they fly to you`;
      } else if (r.anchored && tgt.dist > 6) {
        prompt = `Hold ${this.key('E')} to call ${pName}`;
      }
    } else hud.reticle(0, 0, '#fff', false);
    if (!prompt && !p.dead && !this.paused) prompt = this.seesawPrompt();
    hud.prompt(prompt);

    // Partner marker
    if (r.present && !r.dead) {
      const head = this.tmp.b.set(r.pos.x, r.pos.y + 2.0, r.pos.z);
      const s = this.project(head);
      const dist = r.pos.distanceTo(p.pos);
      const W = window.innerWidth, H = window.innerHeight, m = 46;
      const onScreen = !s.behind && s.x > m && s.x < W - m && s.y > m && s.y < H - m;
      if (onScreen) {
        hud.partner({ onScreen, x: s.x, y: s.y, name: pName, dist, color: CHARACTERS[this.partnerSlot].color, calling: r.magHeld && r.anchored });
      } else {
        let nx = s.nx, ny = s.ny;
        if (s.behind) {
          nx = -nx;
          ny = -ny;
        }
        const ang = Math.atan2(-ny, nx);
        const k = 1 / Math.max(Math.abs(nx) / ((W / 2 - m) / (W / 2)), Math.abs(ny) / ((H / 2 - m) / (H / 2)), 1e-3);
        const x = W / 2 + nx * k * (W / 2);
        const y = H / 2 - ny * k * (H / 2);
        hud.partner({ onScreen: false, x, y, angle: ang, color: CHARACTERS[this.partnerSlot].color });
      }
      this.partnerMissingT = 0;
    } else {
      hud.partner(null);
      this.partnerMissingT += dt;
    }

    // Status line
    let status = null;
    if (!r.present && this.partnerMissingT > 2) status = this.app.solo ? 'Solo explore mode — co-op puzzles need a partner' : `Waiting for ${pName} to connect...`;
    else if (this.inGoal && !this.partnerInGoal) status = `Waiting for ${pName} at the finish...`;
    else if (this.partnerInGoal && !this.inGoal) status = `${pName} is waiting for you at the finish!`;
    hud.status(this.extraStatus || status);

    this.fadeA = damp(this.fadeA, p.dead ? 0.72 : 0, p.dead ? 6 : 4, dt);
    hud.fade(this.fadeA, this.level.theme.dark ? '#000000' : undefined);
    hud.setNet(this.net.connected, this.net.rtt);
  }

  // Tells each player what to do on (or near) a seesaw.
  seesawPrompt() {
    const p = this.player;
    const r = this.remote;
    const C = this.key('C');
    const name = this.partnerName;
    const onEnd = (pos, c) => {
      const l = c.toLocal(pos, this.tmp.d);
      const dy = pos.y - c.top();
      return Math.abs(l.x) < c.hx + 0.3 && Math.abs(l.z) < c.hz + 0.3 && dy > -0.3 && dy < 0.6;
    };
    for (const s of this.world.seesaws.values()) {
      const mine = ['A', 'B'].find((k) => p.grounded && p.ground === s.ends[k]);
      const theirs = r.present && !r.dead ? ['A', 'B'].find((k) => onEnd(r.pos, s.ends[k])) : null;
      if (mine) {
        if (theirs && theirs !== mine) return `Press ${C} to launch ${name} up!`;
        return `${name} can launch you from the other end — or press ${C} to launch them`;
      }
      if (theirs) {
        const other = s.ends[theirs === 'A' ? 'B' : 'A'];
        if (Math.hypot(p.pos.x - other.pos.x, p.pos.z - other.pos.z) < 9) return `Stand on the other end and press ${C} to launch ${name} up!`;
      }
    }
    return null;
  }

  dispose() {
    this.audio.setHum(false);
    this.audio.setThreat(Infinity, false);
    this.extras.dispose();
    this.world.dispose();
    this.env.dispose();
    this.fx.dispose();
    for (const c of this.chars) c.dispose();
    this.blobGeo.dispose();
    this.blobMat.dispose();
    for (const b of this.blobs) b.material.dispose();
    this.scene.clear();
  }
}
