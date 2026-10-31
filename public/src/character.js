// The two heroes, built from primitives and animated procedurally.
//   Sol  — a warm, painted-wood doll with a knitted beanie
//   Luna — a soft felt doll with space buns and a star clip
// (Only used if the 3D models fail to load.)

import * as THREE from 'three';
import { PHYS } from '../shared/constants.js';

const lerp = (a, b, t) => a + (b - a) * t;
const damp = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt));

function capsule(r, len, mat, segs = 12) {
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 6, segs), mat);
  m.castShadow = true;
  return m;
}

function sphere(r, mat, w = 24, h = 16) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, w, h), mat);
  m.castShadow = true;
  return m;
}

export class Character {
  constructor(def, index, tex) {
    this.def = def;
    this.index = index;
    this.root = new THREE.Group();
    this.tilt = new THREE.Group();
    this.body = new THREE.Group();
    this.spin = new THREE.Group();
    this.inner = new THREE.Group();
    this.root.add(this.tilt);
    this.tilt.add(this.body);
    this.body.add(this.spin);
    this.spin.position.y = 0.78;
    this.spin.add(this.inner);
    this.inner.position.y = -0.78;

    const isSol = index === 0;
    const bodyColor = new THREE.Color(def.color);
    const skin = new THREE.Color(isSol ? '#ffd9b8' : '#ffe1cf');

    const bodyMat = isSol
      ? new THREE.MeshPhysicalMaterial({ color: bodyColor, roughness: 0.45, clearcoat: 0.7, clearcoatRoughness: 0.25, map: tex.wood })
      : new THREE.MeshPhysicalMaterial({ color: bodyColor, roughness: 0.85, sheen: 1, sheenColor: new THREE.Color('#bcd4ff'), sheenRoughness: 0.5, map: tex.felt });
    const skinMat = new THREE.MeshPhysicalMaterial({ color: skin, roughness: 0.55, clearcoat: isSol ? 0.4 : 0.0, sheen: isSol ? 0 : 0.6, sheenColor: new THREE.Color('#ffffff') });
    const darkMat = new THREE.MeshStandardMaterial({ color: '#2a2035', roughness: 0.3 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.15 });
    const accentMat = new THREE.MeshStandardMaterial({ color: isSol ? '#ffcf4a' : '#9ad8ff', roughness: 0.6 });
    const cheekMat = new THREE.MeshBasicMaterial({ color: '#ff8fa3', transparent: true, opacity: 0.55, depthWrite: false });
    this.badgeMat = new THREE.MeshStandardMaterial({ color: def.color, emissive: def.color, emissiveIntensity: 0.6, roughness: 0.3 });
    this.materials = [bodyMat, skinMat, darkMat, whiteMat, accentMat, cheekMat, this.badgeMat];

    const I = this.inner;

    // Torso (egg shape)
    const torso = sphere(0.36, bodyMat, 28, 20);
    torso.scale.set(0.95, 1.05, 0.88);
    torso.position.y = 0.72;
    I.add(torso);
    this.torso = torso;

    // Scarf
    const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.075, 10, 24), accentMat);
    scarf.rotation.x = Math.PI / 2;
    scarf.position.y = 1.0;
    scarf.castShadow = true;
    I.add(scarf);
    const tail = capsule(0.06, 0.22, accentMat, 8);
    tail.position.set(0.12, 0.88, -0.22);
    tail.rotation.set(0.5, 0, 0.3);
    I.add(tail);
    this.scarfTail = tail;

    // Head
    const headPivot = new THREE.Group();
    headPivot.position.y = 1.08;
    I.add(headPivot);
    this.head = headPivot;
    const head = sphere(0.37, skinMat, 32, 24);
    head.position.y = 0.1;
    head.scale.set(1.05, 0.97, 1);
    headPivot.add(head);

    // Eyes
    this.eyes = [];
    for (const side of [-1, 1]) {
      const eye = new THREE.Group();
      eye.position.set(side * 0.135, 0.12, 0.31);
      const white = sphere(0.085, whiteMat, 16, 12);
      white.scale.set(1, 1.2, 0.55);
      white.castShadow = false;
      const pupil = sphere(0.058, darkMat, 16, 12);
      pupil.position.set(0, -0.005, 0.035);
      pupil.scale.set(1, 1.15, 0.6);
      pupil.castShadow = false;
      const glint = sphere(0.02, whiteMat, 8, 6);
      glint.position.set(0.02 * side, 0.03, 0.07);
      glint.castShadow = false;
      eye.add(white, pupil, glint);
      eye.rotation.y = side * 0.18;
      headPivot.add(eye);
      this.eyes.push(eye);
      const cheek = new THREE.Mesh(new THREE.CircleGeometry(0.06, 16), cheekMat);
      cheek.position.set(side * 0.22, 0.0, 0.31);
      cheek.rotation.y = side * 0.55;
      headPivot.add(cheek);
    }
    const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.012, 6, 14, Math.PI), darkMat);
    mouth.rotation.z = Math.PI;
    mouth.position.set(0, 0.0, 0.36);
    headPivot.add(mouth);
    this.mouth = mouth;

    if (isSol) {
      // Knitted beanie with a pom-pom.
      const hatMat = new THREE.MeshStandardMaterial({ color: '#e8453c', roughness: 0.9, map: tex.felt });
      this.materials.push(hatMat);
      const hat = new THREE.Mesh(new THREE.SphereGeometry(0.39, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2), hatMat);
      hat.position.y = 0.14;
      hat.scale.set(1.04, 1.0, 1.04);
      hat.castShadow = true;
      headPivot.add(hat);
      const brim = new THREE.Mesh(new THREE.TorusGeometry(0.385, 0.07, 10, 32), accentMat);
      brim.rotation.x = Math.PI / 2;
      brim.position.y = 0.16;
      brim.castShadow = true;
      headPivot.add(brim);
      const pom = sphere(0.11, accentMat, 16, 12);
      pom.position.y = 0.56;
      headPivot.add(pom);
      this.pom = pom;
    } else {
      // Hair cap, two space buns and a star clip.
      const hairMat = new THREE.MeshStandardMaterial({ color: '#27306b', roughness: 0.75, map: tex.felt });
      this.materials.push(hairMat);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.395, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), hairMat);
      cap.position.set(0, 0.11, -0.02);
      cap.rotation.x = -0.25;
      cap.castShadow = true;
      headPivot.add(cap);
      for (const side of [-1, 1]) {
        const bun = sphere(0.14, hairMat, 16, 12);
        bun.position.set(side * 0.27, 0.42, -0.05);
        headPivot.add(bun);
      }
      const starShape = new THREE.Shape();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 ? 0.045 : 0.1;
        const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
        if (i === 0) starShape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else starShape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      const starMat = new THREE.MeshStandardMaterial({ color: '#ffd84d', emissive: '#ffb703', emissiveIntensity: 0.5, roughness: 0.3 });
      this.materials.push(starMat);
      const star = new THREE.Mesh(new THREE.ExtrudeGeometry(starShape, { depth: 0.03, bevelEnabled: false }), starMat);
      star.position.set(0.22, 0.33, 0.24);
      star.rotation.y = 0.5;
      headPivot.add(star);
      this.pom = star;
    }

    // Arms
    this.arms = [];
    for (const side of [-1, 1]) {
      const pivot = new THREE.Group();
      pivot.position.set(side * 0.31, 0.93, 0);
      const arm = capsule(0.075, 0.22, bodyMat, 10);
      arm.position.y = -0.17;
      const hand = sphere(0.09, skinMat, 14, 10);
      hand.position.y = -0.34;
      pivot.add(arm, hand);
      pivot.rotation.z = side * 0.18;
      I.add(pivot);
      this.arms.push(pivot);
    }

    // Legs
    this.legs = [];
    for (const side of [-1, 1]) {
      const pivot = new THREE.Group();
      pivot.position.set(side * 0.14, 0.42, 0);
      const leg = capsule(0.09, 0.14, bodyMat, 10);
      leg.position.y = -0.14;
      const shoe = sphere(0.11, darkMat, 16, 12);
      shoe.scale.set(1.0, 0.75, 1.45);
      shoe.position.set(0, -0.33, 0.04);
      pivot.add(leg, shoe);
      I.add(pivot);
      this.legs.push(pivot);
    }

    this.root.traverse((o) => {
      if (o.isMesh) o.receiveShadow = false;
    });

    // Animation state
    this.phase = 0;
    this.squash = 1;
    this.squashV = 0;
    this.flipT = -1;
    this.poundSpin = 0;
    this.blinkT = 2 + Math.random() * 3;
    this.time = 0;
    this.lean = 0;
    this.visible = true;
    this.popIn = 1;
    this.wave = 0;
  }

  setVisible(v) {
    this.root.visible = v;
  }

  // Triggers ----------------------------------------------------------------
  onJump() {
    this.squash = 1.22;
    this.squashV = 0;
  }
  onDoubleJump() {
    this.flipT = 0;
    this.squash = 1.15;
  }
  onLand(impact) {
    this.squashV -= Math.min(10, impact * 0.35);
  }
  onPoundStart() {
    this.poundSpin = 0;
  }
  onPoundLand() {
    this.squash = 0.55;
    this.squashV = 0;
  }
  onRespawn() {
    this.popIn = 0;
  }
  onWave() {
    this.wave = 1.6;
  }

  // s: { speed, vy, grounded, dashing, pound, magnet, stuck, stunned, yaw }
  update(dt, s) {
    this.time += dt;
    const t = this.time;
    const run = Math.min(1.3, s.speed / PHYS.runSpeed);

    // Squash & stretch spring
    this.squashV += ((1 - this.squash) * 260 - this.squashV * 14) * dt;
    this.squash += this.squashV * dt;
    let sy = this.squash;
    if (!s.grounded && s.pound === 0 && !s.stuck) sy *= 1 + Math.min(0.12, Math.abs(s.vy) * 0.006);
    const sx = 1 / Math.sqrt(Math.max(0.4, sy));
    this.body.scale.set(sx, sy, sx);

    // Pop-in after respawn
    if (this.popIn < 1) {
      this.popIn = Math.min(1, this.popIn + dt * 3);
      const k = this.popIn;
      const e = 1 + Math.sin(k * Math.PI * 1.5) * (1 - k) * 0.5;
      this.root.scale.setScalar(Math.max(0.01, k * e));
    } else this.root.scale.setScalar(1);

    // Facing
    this.root.rotation.y = s.yaw;

    // Lean into motion
    const targetLean = s.dashing ? 0.55 : s.grounded ? run * 0.14 : 0.05;
    this.lean = damp(this.lean, targetLean, 10, dt);
    this.tilt.rotation.x = this.lean;

    const [la, ra] = this.arms;
    const [ll, rl] = this.legs;
    let lArmX = 0, rArmX = 0, lArmZ = -0.18, rArmZ = 0.18, lLeg = 0, rLeg = 0, bob = 0, headX = 0;

    if (s.stuck || s.magnet === 1 || s.magnet === 3) {
      // Reaching toward the magnet / partner.
      lArmX = -2.9; rArmX = -2.9; lArmZ = -0.25; rArmZ = 0.25;
      const sw = Math.sin(t * 3) * 0.25;
      lLeg = sw; rLeg = -sw;
      headX = -0.25;
    } else if (s.pound > 0) {
      lArmX = -2.6; rArmX = -2.6; lArmZ = -0.5; rArmZ = 0.5;
      lLeg = -0.5; rLeg = -0.5;
    } else if (s.dashing) {
      lArmX = 1.2; rArmX = 1.2; lArmZ = -0.6; rArmZ = 0.6;
      lLeg = 0.7; rLeg = 0.5;
    } else if (!s.grounded) {
      const up = s.vy > 0;
      lArmX = up ? -2.2 : -1.6 + Math.sin(t * 14) * 0.25;
      rArmX = up ? -2.2 : -1.6 - Math.sin(t * 14) * 0.25;
      lArmZ = -0.7; rArmZ = 0.7;
      lLeg = up ? -0.7 : 0.25;
      rLeg = up ? 0.35 : -0.15;
    } else if (run > 0.05) {
      this.phase += dt * (5 + 9 * run);
      const sw = Math.sin(this.phase);
      lLeg = sw * 0.95 * run;
      rLeg = -sw * 0.95 * run;
      lArmX = -sw * 0.85 * run;
      rArmX = sw * 0.85 * run;
      bob = Math.abs(Math.cos(this.phase)) * 0.07 * run;
      headX = 0.05;
    } else {
      // Idle: breathe and sway.
      const br = Math.sin(t * 2.2);
      lArmZ = -0.16 - br * 0.04;
      rArmZ = 0.16 + br * 0.04;
      bob = br * 0.012;
      headX = Math.sin(t * 0.7) * 0.05;
    }

    if (this.wave > 0) {
      this.wave -= dt;
      rArmX = -2.7;
      rArmZ = 0.5 + Math.sin(t * 16) * 0.45;
    }

    const k = 18;
    la.rotation.x = damp(la.rotation.x, lArmX, k, dt);
    ra.rotation.x = damp(ra.rotation.x, rArmX, k, dt);
    la.rotation.z = damp(la.rotation.z, lArmZ, k, dt);
    ra.rotation.z = damp(ra.rotation.z, rArmZ, k, dt);
    ll.rotation.x = damp(ll.rotation.x, lLeg, k, dt);
    rl.rotation.x = damp(rl.rotation.x, rLeg, k, dt);
    this.inner.position.y = -0.78 + bob;
    this.head.rotation.x = damp(this.head.rotation.x, headX, 8, dt);
    this.head.rotation.z = Math.sin(t * 1.3) * 0.03;
    this.scarfTail.rotation.x = 0.5 + Math.min(1.1, run * 0.8 + (s.grounded ? 0 : 0.4)) + Math.sin(t * 9) * 0.08 * run;
    this.pom.position.x = Math.sin(this.phase * 0.5) * 0.02 * run;

    // Double-jump forward flip
    let spinX = 0;
    if (this.flipT >= 0) {
      this.flipT += dt / 0.42;
      if (this.flipT >= 1) this.flipT = -1;
      else {
        const e = 1 - Math.pow(1 - this.flipT, 3);
        spinX = e * Math.PI * 2;
      }
    }
    // Ground-pound curl
    if (s.pound === 1) {
      this.poundSpin = Math.min(1, this.poundSpin + dt / 0.16);
      spinX = this.poundSpin * Math.PI * 2;
    }
    this.spin.rotation.x = spinX;

    // Blink
    this.blinkT -= dt;
    let eyeY = 1;
    if (this.blinkT < 0) {
      eyeY = 0.1;
      if (this.blinkT < -0.12) this.blinkT = 2 + Math.random() * 4;
    }
    if (s.stunned) eyeY = 0.25;
    for (const e of this.eyes) e.scale.y = damp(e.scale.y, eyeY, 30, dt);

    // Badge glows while using the magnet.
    const glow = s.magnet ? 2.5 + Math.sin(t * 20) * 0.6 : 0.6;
    this.badgeMat.emissiveIntensity = damp(this.badgeMat.emissiveIntensity, glow, 12, dt);
  }

  dispose() {
    this.root.traverse((o) => {
      if (o.isMesh) o.geometry.dispose();
    });
    for (const m of this.materials) m.dispose();
  }
}
