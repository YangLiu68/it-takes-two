// Monster and figure looks for the horror stories, built from primitives.
// Each returns { group, head, arms }: the head and arm pivots get animated.

import * as THREE from 'three';

const skinMat = (x, color = '#d9d4c8', ei = 0.55) => x.mat(color, { emissive: '#4a4740', ei, rough: 0.7 });
const basic = (x, color) => x.track(new THREE.MeshBasicMaterial({ color }));

function headGroup(g, y, z = 0.03) {
  const head = new THREE.Group();
  head.position.set(0, y, z);
  g.add(head);
  return head;
}

// Paper doll: a paper funeral doll. Flat robe, chalk-white face, painted cheeks and a painted smile.
function paper(x) {
  const g = new THREE.Group();
  const robe = x.mat('#a3242b', { emissive: '#3a0a0c', ei: 0.35, rough: 1 });
  const trim = x.mat('#d8b04a', { emissive: '#5a4210', ei: 0.4 });
  const face = x.mat('#f4efe4', { emissive: '#8a857a', ei: 0.55, rough: 1 });
  const ink = basic(x, '#0a0a0a');
  const rouge = basic(x, '#e0405a');
  const body = x.part(g, new THREE.CylinderGeometry(0.24, 0.5, 1.35, 4), robe, 0, 0.68, 0);
  body.rotation.y = Math.PI / 4;
  body.scale.set(1, 1, 0.42);
  x.part(g, new THREE.BoxGeometry(0.62, 0.07, 0.2), trim, 0, 1.0, 0.04);
  x.part(g, new THREE.BoxGeometry(0.5, 0.07, 0.18), trim, 0, 0.42, 0.08);
  x.part(g, new THREE.BoxGeometry(0.46, 0.14, 0.18), robe, 0, 1.42, 0);
  const head = headGroup(g, 1.72);
  const skull = x.part(head, new THREE.SphereGeometry(0.2, 18, 14), face, 0, 0, 0);
  skull.scale.set(1, 1.12, 0.62);
  const hair = x.mat('#060606', { rough: 1 });
  const cap = x.part(head, new THREE.SphereGeometry(0.21, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), hair, 0, 0.04, -0.01);
  cap.scale.set(1, 1, 0.7);
  for (const s of [-1, 1]) {
    x.part(head, new THREE.SphereGeometry(0.08, 10, 8), hair, s * 0.17, 0.17, -0.02);
    const cheek = x.part(head, new THREE.CircleGeometry(0.045, 14), rouge, s * 0.1, -0.05, 0.128);
    cheek.rotation.y = s * 0.2;
    const eye = x.part(head, new THREE.BoxGeometry(0.05, 0.012, 0.01), ink, s * 0.07, 0.04, 0.128);
    eye.rotation.z = s * -0.25;
  }
  const lips = x.part(head, new THREE.BoxGeometry(0.1, 0.02, 0.01), rouge, 0, -0.11, 0.125);
  lips.scale.set(1, 1.4, 1);
  const arms = x.armPair(g, 0.3, 1.38, 0.72, robe, { w: 0.14, d: 0.04, hand: face });
  return { group: g, head, arms };
}

// Bride: a bride in red with the veil still down.
function bride(x) {
  const g = new THREE.Group();
  const red = x.mat('#8e0f16', { emissive: '#3a0306', ei: 0.4, rough: 0.9 });
  const gold = x.mat('#c79a3a', { emissive: '#4a3610', ei: 0.4 });
  const pale = skinMat(x, '#e8e2d6', 0.6);
  x.part(g, new THREE.CylinderGeometry(0.2, 0.55, 1.75, 16), red, 0, 0.88, 0);
  x.part(g, new THREE.TorusGeometry(0.42, 0.03, 6, 20), gold, 0, 0.3, 0).rotation.x = Math.PI / 2;
  x.part(g, new THREE.TorusGeometry(0.22, 0.03, 6, 20), gold, 0, 1.55, 0).rotation.x = Math.PI / 2;
  const head = headGroup(g, 1.95);
  x.part(head, new THREE.SphereGeometry(0.19, 16, 12), pale, 0, 0, 0).scale.set(0.9, 1.1, 0.9);
  // The veil: a red cloth over the head, longer at the front.
  const veil = x.part(head, new THREE.ConeGeometry(0.32, 0.75, 16, 1, true), x.mat('#b3121c', { emissive: '#4a0508', ei: 0.5, side: THREE.DoubleSide, rough: 1 }), 0, -0.12, 0.02);
  veil.scale.set(1, 1, 0.9);
  x.part(head, new THREE.CylinderGeometry(0.2, 0.22, 0.12, 12), gold, 0, 0.22, 0);
  const arms = x.armPair(g, 0.26, 1.5, 0.95, red, { w: 0.11, d: 0.11, hand: pale });
  return { group: g, head, arms };
}

// Nurse: the night nurse. Stained white uniform, cap, hair hanging over a hollow face.
function nurse(x) {
  const g = new THREE.Group();
  const white = x.mat('#cfd3cc', { emissive: '#2e322e', ei: 0.4 });
  const stain = x.mat('#5a4a38', { rough: 1 });
  const pale = skinMat(x, '#d2d6cf', 0.5);
  const hair = x.mat('#050505', { rough: 1 });
  const black = basic(x, '#000000');
  x.part(g, new THREE.CylinderGeometry(0.2, 0.4, 1.5, 14), white, 0, 1.0, 0);
  x.part(g, new THREE.BoxGeometry(0.3, 0.25, 0.02), stain, 0.06, 0.75, 0.33);
  for (const s of [-1, 1]) x.part(g, new THREE.CylinderGeometry(0.05, 0.045, 0.6, 8), pale, s * 0.11, 0.3, 0);
  const head = headGroup(g, 2.0);
  x.part(head, new THREE.SphereGeometry(0.19, 16, 12), pale, 0, 0, 0).scale.set(0.85, 1.2, 0.9);
  for (const s of [-1, 1]) x.part(head, new THREE.SphereGeometry(0.05, 10, 8), black, s * 0.07, 0.04, 0.15).scale.set(1, 1.4, 0.5);
  x.part(head, new THREE.BoxGeometry(0.4, 0.95, 0.12), hair, 0, -0.4, -0.12);
  x.part(head, new THREE.BoxGeometry(0.2, 0.55, 0.06), hair, -0.07, -0.18, 0.16);
  const cap = x.part(head, new THREE.BoxGeometry(0.3, 0.1, 0.2), white, 0, 0.24, 0);
  cap.rotation.x = -0.2;
  x.part(head, new THREE.BoxGeometry(0.08, 0.025, 0.01), basic(x, '#b01818'), 0, 0.25, 0.105);
  head.rotation.z = 0.5;
  const arms = x.armPair(g, 0.25, 1.68, 1.15, pale, { w: 0.07, d: 0.07 });
  return { group: g, head, arms };
}

// Clown: a carnival clown. Too tall, too thin, smiling.
function clown(x) {
  const g = new THREE.Group();
  const cols = ['#7a1a2a', '#e8e0c8', '#1f3d6a'];
  for (let i = 0; i < 6; i++) {
    x.part(g, new THREE.CylinderGeometry(0.34 - i * 0.02, 0.36 - i * 0.02, 0.28, 14), x.mat(cols[i % 3], { emissive: '#1a1012', ei: 0.3 }), 0, 0.9 + i * 0.27, 0);
  }
  const leg = x.mat('#1a1a1a');
  for (const s of [-1, 1]) {
    x.part(g, new THREE.CylinderGeometry(0.06, 0.05, 0.8, 8), leg, s * 0.14, 0.4, 0);
    x.part(g, new THREE.BoxGeometry(0.18, 0.1, 0.42), x.mat('#8a1616'), s * 0.14, 0.05, 0.1);
  }
  x.part(g, new THREE.TorusGeometry(0.3, 0.07, 6, 16), x.mat('#e8e0c8'), 0, 2.55, 0).rotation.x = Math.PI / 2;
  const head = headGroup(g, 2.85);
  const white = x.mat('#f1ede4', { emissive: '#7a776e', ei: 0.6 });
  x.part(head, new THREE.SphereGeometry(0.24, 18, 14), white, 0, 0, 0).scale.set(1, 1.15, 0.95);
  x.part(head, new THREE.SphereGeometry(0.06, 12, 10), basic(x, '#d81e1e'), 0, -0.01, 0.23);
  const black = basic(x, '#050505');
  for (const s of [-1, 1]) {
    x.part(head, new THREE.SphereGeometry(0.055, 10, 8), black, s * 0.085, 0.08, 0.19).scale.set(1, 1.5, 0.5);
    x.part(head, new THREE.SphereGeometry(0.012, 6, 6), basic(x, '#ffffff'), s * 0.085, 0.08, 0.215);
    x.part(head, new THREE.SphereGeometry(0.12, 10, 8), x.mat('#2a7a4a', { rough: 1 }), s * 0.22, 0.06, -0.04);
  }
  const grin = x.part(head, new THREE.TorusGeometry(0.11, 0.022, 6, 16, Math.PI), basic(x, '#a01020'), 0, -0.07, 0.2);
  grin.rotation.z = Math.PI;
  const hat = x.part(head, new THREE.ConeGeometry(0.1, 0.3, 10), x.mat('#7a1a2a'), 0.04, 0.32, 0);
  hat.rotation.z = -0.3;
  const arms = x.armPair(g, 0.4, 2.45, 1.5, x.mat('#7a1a2a'), { w: 0.08, d: 0.08, hand: white });
  return { group: g, head, arms };
}

// Conductor: the last train's conductor. Uniform and cap; where the face should be, a smooth white mask.
function conductor(x) {
  const g = new THREE.Group();
  const navy = x.mat('#141b2e', { emissive: '#05070d', ei: 0.3 });
  const gold = x.mat('#b99a4a', { emissive: '#3a2f10', ei: 0.4 });
  const mask = x.mat('#ecebe6', { emissive: '#8a8984', ei: 0.7, rough: 0.4 });
  x.part(g, new THREE.CylinderGeometry(0.3, 0.34, 1.3, 14), navy, 0, 1.55, 0);
  for (const s of [-1, 1]) x.part(g, new THREE.CylinderGeometry(0.08, 0.07, 1.0, 8), navy, s * 0.14, 0.5, 0);
  for (let i = 0; i < 3; i++) x.part(g, new THREE.SphereGeometry(0.03, 8, 6), gold, 0, 1.3 + i * 0.25, 0.31);
  const head = headGroup(g, 2.42);
  x.part(head, new THREE.SphereGeometry(0.2, 18, 14), mask, 0, 0, 0).scale.set(0.9, 1.15, 0.95);
  for (const s of [-1, 1]) x.part(head, new THREE.SphereGeometry(0.018, 8, 6), basic(x, '#000000'), s * 0.06, 0.03, 0.18);
  x.part(head, new THREE.CylinderGeometry(0.22, 0.2, 0.14, 16), navy, 0, 0.22, 0);
  x.part(head, new THREE.BoxGeometry(0.34, 0.03, 0.18), navy, 0, 0.15, 0.14);
  x.part(head, new THREE.BoxGeometry(0.16, 0.04, 0.01), gold, 0, 0.24, 0.22);
  const arms = x.armPair(g, 0.36, 2.15, 1.45, navy, { w: 0.1, d: 0.1, hand: x.mat('#f0f0f0', { emissive: '#666', ei: 0.4 }) });
  return { group: g, head, arms };
}

// Doll: an old porcelain doll, cracked, with glass eyes.
function doll(x) {
  const g = new THREE.Group();
  const dress = x.mat('#b88a95', { emissive: '#2a1a1e', ei: 0.3, rough: 1 });
  const china = x.mat('#efe8de', { emissive: '#77716a', ei: 0.5, rough: 0.3 });
  x.part(g, new THREE.CylinderGeometry(0.16, 0.36, 0.7, 14), dress, 0, 0.38, 0);
  const head = headGroup(g, 0.95);
  x.part(head, new THREE.SphereGeometry(0.24, 18, 14), china, 0, 0, 0);
  for (const s of [-1, 1]) {
    x.part(head, new THREE.SphereGeometry(0.055, 12, 10), basic(x, '#101010'), s * 0.08, 0.03, 0.2);
    x.part(head, new THREE.SphereGeometry(0.014, 6, 6), basic(x, '#8fd3ff'), s * 0.08, 0.035, 0.25);
  }
  const crack = x.part(head, new THREE.BoxGeometry(0.01, 0.16, 0.01), basic(x, '#2a2420'), 0.05, 0.1, 0.235);
  crack.rotation.z = 0.5;
  x.part(head, new THREE.SphereGeometry(0.26, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2.2), x.mat('#3a2414', { rough: 1 }), 0, 0.03, -0.02);
  const arms = x.armPair(g, 0.2, 0.62, 0.38, china, { w: 0.06, d: 0.06 });
  return { group: g, head, arms };
}

// Mannequin: a shop mannequin. No face at all.
function mannequin(x) {
  const g = new THREE.Group();
  const m = x.mat('#cbb8a0', { emissive: '#3a3228', ei: 0.35, rough: 0.5 });
  for (const s of [-1, 1]) x.part(g, new THREE.CylinderGeometry(0.07, 0.06, 0.95, 10), m, s * 0.12, 0.48, 0);
  x.part(g, new THREE.CylinderGeometry(0.22, 0.16, 0.85, 14), m, 0, 1.35, 0);
  const head = headGroup(g, 1.98);
  x.part(head, new THREE.SphereGeometry(0.17, 16, 12), m, 0, 0, 0).scale.set(0.85, 1.25, 0.9);
  const arms = x.armPair(g, 0.27, 1.72, 0.8, m, { w: 0.07, d: 0.07 });
  return { group: g, head, arms };
}

export const LOOKS = { paper, bride, nurse, clown, conductor, doll, mannequin };
