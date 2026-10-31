// The two heroes: rigged 3D models (CC0, by Quaternius) dressed up in code.
//   Sol  — orange tee, red knitted beanie, sunny scarf, red horseshoe-magnet backpack
//   Luna — blue dress, indigo hair with moon and star clips and a bow, blue magnet backpack
// Both get big cartoon eyes that blink, brows and a mouth that react to what
// they're doing, wristbands and a backpack that glow while the magnet is on.
//
// Animation: idle / walk / run come from the model's clips (walk and run kept
// in step so they blend). Jumps, falls, flips, landings, pounds and dashes use
// single frames lifted from the model's own clips, blended by weight, so knees
// and elbows always bend the right way. Only the arms are aimed by hand: at a
// magnet, at the partner, overhead to carry something or up to hang.

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { PHYS } from '../shared/constants.js';

const FILES = ['/assets/characters/sol.glb', '/assets/characters/luna.glb'];
const TARGET_HEIGHT = 1.74;
const HEAD_SCALE = 1.36; // a bigger head reads younger and friendlier
const WIDEN = 1.1; // a touch chunkier, more toy-like

// Dressing per character. Colors by material name, or "Mesh/Material" when two
// meshes share a material (Luna's hair and shoes do).
const LOOKS = [
  {
    colors: { LightBrown: '#ff8a50', LightBlue: '#2f3b5c', Red_Dark: '#e8453c', White: '#f6f1e7', Hair: '#5a321c', Skin_Darker: '#b9805a' },
    hide: ['Eye', 'Eyebrows'],
    hair: ['Hair'],
    iris: '#8a5326', brow: '#4a2814', main: '#e8453c', accent: '#ffcf4a', glow: '#ff7a4a',
  },
  {
    colors: { LimeGreen: '#5b7fff', Gold: '#ffd166', 'Formad_Head/Red': '#2e3170', 'Formal_Feet/Red': '#ffd166' },
    hide: ['Formad_Head/Brown'],
    hair: ['Formad_Head/Red'],
    iris: '#2f6fe0', brow: '#23255a', main: '#4f86ff', accent: '#ffd84d', glow: '#8fb4ff', lashes: true,
  },
];

let cache = null;

// Load both models once. Resolves to [gltf, gltf], or null if loading failed.
export function loadCharacterModels() {
  if (!cache) {
    const loader = new GLTFLoader();
    cache = Promise.all(FILES.map((f) => loader.loadAsync(f)))
      .then((list) => {
        list.forEach((g, i) => prepareMaterials(g.scene, LOOKS[i]));
        return list;
      })
      .catch((err) => {
        console.warn('Character models failed to load, using built-in characters.', err);
        return null;
      });
  }
  return cache;
}

// "Formad_Head_2" -> "Formad_Head": the glTF mesh a primitive came from.
const meshKey = (o) => (o.name.match(/^[A-Za-z0-9]+_[A-Za-z]+/) || [o.name])[0];
const matches = (list, o) => list.includes(o.material.name) || list.includes(`${meshKey(o)}/${o.material.name}`);

// A soft light edge around the characters so they read against any background
// (fainter in dark levels, so the dark stays dark).
const RIM = { value: 0.32 };
export function setRimStrength(v) {
  RIM.value = v;
}
function addRim(m) {
  m.onBeforeCompile = (sh) => {
    sh.uniforms.rimStrength = RIM;
    sh.fragmentShader = `uniform float rimStrength;\n${sh.fragmentShader}`.replace('#include <opaque_fragment>', `
      float rimK = 1.0 - clamp(dot(normalize(vViewPosition), normal), 0.0, 1.0);
      outgoingLight += vec3(1.0, 0.95, 0.88) * pow(rimK, 3.0) * rimStrength;
      #include <opaque_fragment>`);
  };
  m.customProgramCacheKey = () => 'char-rim';
}

function prepareMaterials(scene, look) {
  scene.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = true;
    o.receiveShadow = false;
    o.frustumCulled = false;
    // Each primitive gets its own copy, so shared materials can differ.
    const m = o.material.clone();
    m.metalness = 0;
    m.roughness = /Skin/i.test(m.name) ? 0.55 : /Hair|Red$/i.test(m.name) ? 0.6 : 0.78;
    const color = look.colors[`${meshKey(o)}/${m.name}`] ?? look.colors[m.name];
    if (color) m.color.set(color);
    addRim(m);
    o.material = m;
  });
}

const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _q1 = new THREE.Quaternion();
const _q2 = new THREE.Quaternion();
const _q3 = new THREE.Quaternion();
const _qw = new THREE.Quaternion();
const _id = new THREE.Quaternion();
const _dir = new THREE.Vector3();

// Arm directions in character space (+z forward, +x to the character's left).
const ARMS = {
  up: { UpperArmL: [0.28, 1, 0.08], LowerArmL: [0.18, 1, 0.12], UpperArmR: [-0.28, 1, 0.08], LowerArmR: [-0.18, 1, 0.12] },
  carry: { UpperArmL: [0.34, 1, 0.24], LowerArmL: [-0.1, 1, 0.26], UpperArmR: [-0.34, 1, 0.24], LowerArmR: [0.1, 1, 0.26] },
  back: { UpperArmL: [0.3, -0.45, -0.85], LowerArmL: [0.2, -0.35, -0.9], UpperArmR: [-0.3, -0.45, -0.85], LowerArmR: [-0.2, -0.35, -0.9] },
};
const CHILD = { UpperArmL: 'LowerArmL', LowerArmL: 'WristL', UpperArmR: 'LowerArmR', LowerArmR: 'WristR' };

// Single-frame poses lifted from the clips: [clip, time (0..1), keep the hips' own motion].
const POSES = {
  rise: ['Run', 0.25, true], // knee up, the other leg trailing
  fall: ['Run', 0.62, true], // legs apart, ready to land
  tuck: ['Roll', 0.4, false], // curled up, for flips and the ground pound
  crouch: ['Death', 0.25, true], // squat: landings
  dash: ['Run', 0.5, true], // full stride
};

const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const smooth = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

// The same clip without the legs and hips, so it plays on top of walking.
function upperBody(src) {
  const tracks = src.tracks.filter((tr) => !/^(Root|Hips|UpperLeg|LowerLeg|Foot|PT)/.test(tr.name));
  return new THREE.AnimationClip(`${src.name}-upper`, src.duration, tracks);
}

// A clip that holds one frame of another clip.
function frameClip(src, t, keepHips, name) {
  const time = t * src.duration;
  const tracks = [];
  for (const tr of src.tracks) {
    if (!keepHips && /^(Hips|Root)\./.test(tr.name)) continue;
    const v = Array.from(tr.createInterpolant().evaluate(time));
    tracks.push(new tr.constructor(tr.name, [0, 1], [...v, ...v]));
  }
  return new THREE.AnimationClip(name, 1, tracks);
}

export class ModelCharacter {
  constructor(def, index, gltf) {
    this.def = def;
    this.index = index;
    this.look = LOOKS[index];
    this.root = new THREE.Group();
    this.tilt = new THREE.Group();
    this.body = new THREE.Group();
    this.spin = new THREE.Group();
    this.inner = new THREE.Group();
    this.root.add(this.tilt);
    this.tilt.add(this.body);
    this.body.add(this.spin);
    this.spin.position.y = 0.8;
    this.spin.add(this.inner);
    this.inner.position.y = -0.8;
    this.owned = []; // geometries and materials made here, to dispose

    const model = SkeletonUtils.clone(gltf.scene);
    this.model = model;
    const head = model.getObjectByName('Head');
    if (head) head.scale.setScalar(HEAD_SCALE);
    model.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(model, true);
    const s = TARGET_HEIGHT / Math.max(0.01, box.max.y - box.min.y);
    model.scale.multiplyScalar(s);
    model.scale.x *= WIDEN;
    model.scale.z *= WIDEN;
    model.position.y = -box.min.y * s;
    this.inner.add(model);

    this.bones = {};
    for (const name of ['Chest', 'Neck', 'Head', 'Hips', ...Object.keys(CHILD), ...Object.values(CHILD)]) {
      this.bones[name] = model.getObjectByName(name);
    }

    this.root.updateMatrixWorld(true);
    try {
      this.dress();
    } catch (err) {
      console.warn('Could not dress character', err);
    }

    // Clips.
    this.mixer = new THREE.AnimationMixer(model);
    const clip = (n) => gltf.animations.find((a) => a.name === n || a.name.endsWith(`|${n}`));
    this.actions = {};
    for (const n of ['Idle', 'Walk', 'Run', 'Wave', 'HitRecieve']) {
      const c = clip(n);
      if (c) this.actions[n] = this.mixer.clipAction(n === 'Wave' ? upperBody(c) : c);
    }
    for (const [name, [src, t, keep]] of Object.entries(POSES)) {
      const c = clip(src);
      if (c) this.actions[name] = this.mixer.clipAction(frameClip(c, t, keep, `${name}-${index}`));
    }
    this.walkDur = this.actions.Walk ? this.actions.Walk.getClip().duration : 1;
    this.runDur = this.actions.Run ? this.actions.Run.getClip().duration : 1;
    // Weighted layers, always playing; weights are set every frame.
    this.layers = ['Idle', 'Walk', 'Run', ...Object.keys(POSES)].filter((n) => this.actions[n]);
    this.w = {};
    for (const n of this.layers) {
      const a = this.actions[n];
      a.play();
      a.setEffectiveWeight(n === 'Idle' ? 1 : 0);
      if (n !== 'Idle') a.timeScale = 0;
      this.w[n] = n === 'Idle' ? 1 : 0;
    }
    for (const n of ['Wave', 'HitRecieve']) {
      const a = this.actions[n];
      if (a) {
        a.setLoop(THREE.LoopOnce, 1);
        a.clampWhenFinished = true;
      }
    }
    this.oneShot = null;
    this.oneShotT = 0;
    this.oneShotW = 0;

    this.armW = { up: 0, carry: 0, back: 0, reach: 0 };
    this.reachDir = new THREE.Vector3(0, 0.4, 1);
    this.cycle = 0;
    this.phase = 0;
    this.squash = 1;
    this.squashV = 0;
    this.flipT = -1;
    this.poundSpin = 0;
    this.lean = 0;
    this.bank = 0;
    this.prevYaw = null;
    this.landT = 0;
    this.landMax = 0.3;
    this.landK = 0;
    this.popIn = 1;
    this.time = 0;
    this.stunWas = false;
    this.blinkT = 1.5 + Math.random() * 3;
    this.lid = 0;
    this.glow = 0.25;
    this.tailA = 0.4;
    this.tailV = 0;
  }

  // -- dressing ---------------------------------------------------------------

  own(x) {
    this.owned.push(x);
    return x;
  }

  mesh(geo, mat) {
    const m = new THREE.Mesh(this.own(geo), mat);
    m.castShadow = true;
    return m;
  }

  mat(color, o = {}) {
    return this.own(new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0, ...o }));
  }

  // World-space points of the meshes that pass `pick` (the model is at rest,
  // standing at the origin and facing +z).
  points(pick) {
    const out = [];
    this.model.traverse((o) => {
      if (!o.isSkinnedMesh || !pick(o)) return;
      const n = o.geometry.attributes.position.count;
      for (let i = 0; i < n; i++) {
        const v = new THREE.Vector3();
        o.getVertexPosition(i, v);
        out.push(o.localToWorld(v));
      }
    });
    return out;
  }

  dress() {
    const L = this.look;
    const B = this.bones;
    const skinMesh = [];
    this.model.traverse((o) => {
      if (o.isSkinnedMesh && /Skin$/.test(o.material.name)) skinMesh.push(o);
    });
    const skinColor = skinMesh.length ? skinMesh[0].material.color.clone() : new THREE.Color('#c58b5e');
    const headKey = (o) => /Head/.test(meshKey(o));

    // -- face -----------------------------------------------------------------
    const facePts = this.points((o) => matches(L.hide, o));
    this.model.traverse((o) => {
      if (o.isSkinnedMesh && matches(L.hide, o)) o.visible = false;
    });
    const headSkin = this.points((o) => headKey(o) && o.material.name === 'Skin');
    const hairPts = this.points((o) => matches(L.hair, o));
    const eyes = [-1, 1].map((side) => {
      const p = facePts.filter((v) => Math.sign(v.x) === side).sort((a, b) => a.y - b.y);
      // Eyes and brows can be one mesh: split at the biggest vertical gap.
      let cut = p.length;
      let gap = 0;
      for (let i = 1; i < p.length; i++) {
        if (p[i].y - p[i - 1].y > gap) {
          gap = p[i].y - p[i - 1].y;
          cut = i;
        }
      }
      const range = p.length ? p[p.length - 1].y - p[0].y : 0;
      const eyePts = gap > range * 0.25 ? p.slice(0, cut) : p;
      const b = new THREE.Box3().setFromPoints(eyePts);
      return b.getCenter(new THREE.Vector3());
    });
    const spacing = Math.abs(eyes[1].x - eyes[0].x);
    const re = spacing * 0.31; // eye radius
    // How far forward the face is near (x, y).
    const frontZ = (x, y, r) => {
      let z = -Infinity;
      for (const v of headSkin) if (Math.abs(v.x - x) < r && Math.abs(v.y - y) < r) z = Math.max(z, v.z);
      return z === -Infinity ? eyes[0].z : z;
    };

    const face = new THREE.Group();
    const white = this.mat('#ffffff', { roughness: 0.25 });
    const irisMat = this.mat(L.iris, { roughness: 0.3 });
    const pupilMat = this.mat('#120c18', { roughness: 0.2 });
    const shine = this.own(new THREE.MeshBasicMaterial({ color: '#ffffff' }));
    const lidMat = this.mat(skinColor, { roughness: 0.55 });
    const lineMat = this.mat('#2a1c22', { roughness: 0.5 });
    const browMat = this.mat(L.brow, { roughness: 0.7 });
    this.lids = [];
    this.brows = [];
    for (const [i, side] of [[0, -1], [1, 1]]) {
      const c = eyes[i];
      const zs = frontZ(c.x, c.y, re * 0.8);
      const eye = new THREE.Group();
      eye.position.set(c.x, c.y + re * 0.14, Math.max(zs, c.z) - re * 0.3);
      eye.rotation.y = side * 0.22;
      const sclera = this.mesh(new THREE.SphereGeometry(re, 24, 18), white);
      sclera.scale.set(0.86, 1.06, 0.55);
      sclera.castShadow = false;
      const iris = this.mesh(new THREE.SphereGeometry(re * 0.6, 20, 14), irisMat);
      iris.scale.set(1, 1.1, 0.32);
      iris.position.set(-side * re * 0.06, -re * 0.06, re * 0.47);
      iris.castShadow = false;
      const pupil = this.mesh(new THREE.SphereGeometry(re * 0.33, 16, 12), pupilMat);
      pupil.scale.set(1, 1.1, 0.3);
      pupil.position.set(-side * re * 0.06, -re * 0.06, re * 0.56);
      pupil.castShadow = false;
      const s1 = this.mesh(new THREE.SphereGeometry(re * 0.16, 10, 8), shine);
      s1.position.set(re * 0.2, re * 0.24, re * 0.62);
      s1.castShadow = false;
      const s2 = this.mesh(new THREE.SphereGeometry(re * 0.08, 8, 6), shine);
      s2.position.set(-re * 0.18, -re * 0.26, re * 0.6);
      s2.castShadow = false;
      // Upper lid: hinged at the top of the eye, swings down to blink.
      const lid = new THREE.Group();
      lid.position.y = re * 1.06;
      const lidBall = this.mesh(new THREE.SphereGeometry(re * 1.07, 20, 14), lidMat);
      lidBall.scale.set(0.9, 1.04, 0.6);
      lidBall.position.y = -re * 1.06;
      lidBall.castShadow = false;
      lid.add(lidBall);
      lid.scale.y = 0.04;
      // Lash line along the top edge.
      const lash = this.mesh(new THREE.TorusGeometry(re * 0.86, re * 0.05, 6, 20, Math.PI), lineMat);
      lash.scale.set(1, 1.18, 1);
      lash.position.set(0, re * 0.06, re * 0.22);
      lash.rotation.x = -0.45;
      lash.castShadow = false;
      eye.add(sclera, iris, pupil, s1, s2, lid, lash);
      if (L.lashes) {
        const flick = this.mesh(new THREE.CapsuleGeometry(re * 0.06, re * 0.32, 3, 6), lineMat);
        flick.position.set(side * re * 0.86, re * 0.62, re * 0.2);
        flick.rotation.z = -side * 0.9;
        flick.castShadow = false;
        eye.add(flick);
      }
      face.add(eye);
      this.lids.push(lid);
      const brow = this.mesh(new THREE.CapsuleGeometry(re * 0.13, re * 0.85, 4, 8), browMat);
      brow.rotation.z = Math.PI / 2;
      const browPivot = new THREE.Group();
      browPivot.position.set(c.x + side * re * 0.05, c.y + re * 1.55, frontZ(c.x, c.y + re * 1.5, re) + re * 0.05);
      browPivot.rotation.y = side * 0.25;
      browPivot.add(brow);
      browPivot.userData.base = browPivot.position.y;
      browPivot.userData.side = side;
      face.add(browPivot);
      this.brows.push(browPivot);
    }
    // Mouth: a smile, an open "ah", a little "o" and a flat line, one shown at a time.
    const mouthY = eyes[0].y - spacing * 0.92;
    const mouth = new THREE.Group();
    mouth.position.set(0, mouthY, frontZ(0, mouthY, re * 0.6) + re * 0.04);
    const mouthMat = this.mat('#4a1d28', { roughness: 0.5 });
    const smile = this.mesh(new THREE.TorusGeometry(re * 0.4, re * 0.085, 6, 16, Math.PI), mouthMat);
    smile.rotation.z = Math.PI;
    smile.position.y = re * 0.2;
    const open = this.mesh(new THREE.SphereGeometry(re * 0.36, 14, 10), mouthMat);
    open.scale.set(1.25, 0.85, 0.3);
    const tongue = this.mesh(new THREE.SphereGeometry(re * 0.2, 10, 8), this.mat('#ff7b8a', { roughness: 0.5 }));
    tongue.scale.set(1.3, 0.6, 0.4);
    tongue.position.set(0, -re * 0.14, re * 0.06);
    open.add(tongue);
    const oh = this.mesh(new THREE.TorusGeometry(re * 0.17, re * 0.075, 6, 14), mouthMat);
    const flat = this.mesh(new THREE.CapsuleGeometry(re * 0.07, re * 0.5, 3, 6), mouthMat);
    flat.rotation.z = Math.PI / 2;
    for (const m of [smile, open, oh, flat]) {
      m.castShadow = false;
      mouth.add(m);
    }
    this.mouths = { smile, open, oh, flat };
    face.add(mouth);
    // Rosy cheeks.
    const cheekMat = this.own(new THREE.MeshBasicMaterial({ color: '#ff8fa3', transparent: true, opacity: 0.4, depthWrite: false }));
    for (const side of [-1, 1]) {
      const x = side * (spacing * 0.5 + re * 0.55);
      const y = eyes[0].y - re * 1.35;
      const cheek = this.mesh(new THREE.CircleGeometry(re * 0.45, 16), cheekMat);
      cheek.position.set(x, y, frontZ(x, y, re * 0.5) + re * 0.03);
      cheek.rotation.y = side * 0.5;
      cheek.castShadow = false;
      face.add(cheek);
    }

    // -- hair and hats --------------------------------------------------------
    const hb = new THREE.Box3().setFromPoints(hairPts.length ? hairPts : headSkin);
    const hc = hb.getCenter(new THREE.Vector3());
    const hx = (hb.max.x - hb.min.x) / 2;
    if (this.index === 0) {
      // Knitted beanie with a pom-pom and a little sun patch.
      const R = hx * 1.13;
      const beanieMat = this.mat(L.main, { roughness: 0.95 });
      const hat = new THREE.Group();
      hat.position.set(0, hb.max.y - R * 0.86, Math.max(hc.z, hb.max.z - R * 1.02));
      hat.rotation.x = -0.12;
      const dome = this.mesh(new THREE.SphereGeometry(R, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), beanieMat);
      dome.scale.set(1, 1.08, 1.08);
      const brim = this.mesh(new THREE.TorusGeometry(R * 0.97, R * 0.17, 10, 32), this.mat(L.accent, { roughness: 0.95 }));
      brim.rotation.x = Math.PI / 2;
      brim.scale.set(1.02, 1.1, 1);
      // Knit ribs.
      for (let k = 0; k < 10; k++) {
        const rib = this.mesh(new THREE.TorusGeometry(R * 1.005, R * 0.025, 4, 24, Math.PI / 2.2), beanieMat);
        rib.rotation.set(0, (k / 10) * Math.PI * 2, Math.PI / 2);
        rib.scale.set(1, 1.08, 1.08);
        hat.add(rib);
      }
      const pom = this.mesh(new THREE.IcosahedronGeometry(R * 0.3, 2), this.mat(L.accent, { roughness: 1, flatShading: true }));
      pom.position.y = R * 1.1;
      const sun = new THREE.Group();
      const sunMat = this.mat('#ffd23f', { emissive: '#ff9f1c', emissiveIntensity: 0.35, roughness: 0.4 });
      sun.add(this.mesh(new THREE.CylinderGeometry(R * 0.14, R * 0.14, R * 0.05, 18), sunMat));
      for (let k = 0; k < 8; k++) {
        const ray = this.mesh(new THREE.ConeGeometry(R * 0.05, R * 0.11, 4), sunMat);
        const a = (k / 8) * Math.PI * 2;
        ray.position.set(Math.cos(a) * R * 0.2, 0, Math.sin(a) * R * 0.2);
        ray.rotation.set(Math.PI / 2, 0, -a + Math.PI / 2);
        ray.rotation.order = 'YXZ';
        ray.rotation.set(0, -a, -Math.PI / 2);
        sun.add(ray);
      }
      sun.rotation.x = Math.PI / 2 - 0.55;
      sun.position.set(R * 0.42, R * 0.42, R * 0.78);
      sun.rotation.z = -0.4;
      hat.add(dome, brim, pom, sun);
      this.pom = pom;
      B.Head.attach(hat);
    } else {
      // Moon and star hair clips, and a bow at the back.
      const clipMat = this.mat('#ffe08a', { emissive: '#ffb703', emissiveIntensity: 0.4, roughness: 0.35, metalness: 0.2 });
      const moon = new THREE.Shape();
      moon.absarc(0, 0, hx * 0.24, Math.PI * 0.35, Math.PI * 1.65, false);
      moon.absarc(hx * 0.1, 0, hx * 0.19, Math.PI * 1.55, Math.PI * 0.45, true);
      const moonMesh = this.mesh(new THREE.ExtrudeGeometry(moon, { depth: hx * 0.06, bevelEnabled: true, bevelSize: hx * 0.015, bevelThickness: hx * 0.015, bevelSegments: 2, curveSegments: 16 }), clipMat);
      moonMesh.position.set(-hx * 0.9, hb.max.y - hx * 0.62, hc.z + hx * 0.38);
      moonMesh.rotation.set(0, -1.15, 0.3);
      const star = new THREE.Shape();
      for (let k = 0; k < 10; k++) {
        const r = k % 2 ? hx * 0.09 : hx * 0.2;
        const a = (k / 10) * Math.PI * 2 + Math.PI / 2;
        if (k === 0) star.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else star.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      const starMesh = this.mesh(new THREE.ExtrudeGeometry(star, { depth: hx * 0.06, bevelEnabled: true, bevelSize: hx * 0.012, bevelThickness: hx * 0.012, bevelSegments: 2 }), clipMat);
      starMesh.position.set(hx * 0.86, hb.max.y - hx * 0.5, hc.z + hx * 0.42);
      starMesh.rotation.set(0, 1.1, -0.25);
      const bowMat = this.mat(L.main, { roughness: 0.6 });
      const bow = new THREE.Group();
      bow.position.set(0, hb.max.y - hx * 0.62, hb.min.z + hx * 0.08);
      for (const side of [-1, 1]) {
        const loop = this.mesh(new THREE.SphereGeometry(hx * 0.22, 14, 10), bowMat);
        loop.scale.set(1.25, 0.8, 0.45);
        loop.position.x = side * hx * 0.24;
        loop.rotation.z = side * 0.35;
        bow.add(loop);
      }
      bow.add(this.mesh(new THREE.SphereGeometry(hx * 0.1, 10, 8), bowMat));
      // Ribbon tails (they sway).
      this.tail = new THREE.Group();
      for (const side of [-1, 1]) {
        const t = this.mesh(new THREE.CapsuleGeometry(hx * 0.045, hx * 0.42, 3, 6), bowMat);
        t.scale.set(1.8, 1, 0.4);
        t.position.set(side * hx * 0.09, -hx * 0.26, 0);
        t.rotation.z = side * 0.22;
        this.tail.add(t);
      }
      bow.add(this.tail);
      const g = new THREE.Group();
      g.add(moonMesh, starMesh, bow);
      this.pom = starMesh;
      B.Head.attach(g);
    }
    B.Head.attach(face);
    this.face = face;

    // -- body: scarf, backpack, wristbands -------------------------------------
    const bodyPts = this.points((o) => !headKey(o) && /Body/.test(meshKey(o)));
    const chest = B.Chest.getWorldPosition(new THREE.Vector3());
    const neck = B.Neck.getWorldPosition(new THREE.Vector3());
    const near = (y, r) => bodyPts.filter((v) => Math.abs(v.y - y) < r);
    const chestPts = near(chest.y, 0.05);
    const backZ = chestPts.length ? Math.min(...chestPts.map((v) => v.z)) : chest.z - 0.12;
    const neckR = Math.max(0.05, Math.min(0.08, hx * 0.5));

    if (this.index === 0) {
      const scarfMat = this.mat(L.accent, { roughness: 0.95 });
      const scarf = this.mesh(new THREE.TorusGeometry(neckR * 1.02, neckR * 0.42, 10, 24), scarfMat);
      scarf.rotation.x = Math.PI / 2 + 0.12;
      scarf.position.set(neck.x, neck.y - neckR * 0.35, neck.z);
      const stripeMat = this.mat(L.main, { roughness: 0.95 });
      const stripe = this.mesh(new THREE.TorusGeometry(neckR * 1.02, neckR * 0.2, 6, 24), stripeMat);
      stripe.rotation.copy(scarf.rotation);
      stripe.position.copy(scarf.position);
      stripe.scale.set(1.07, 1.07, 1.6);
      B.Chest.attach(scarf);
      B.Chest.attach(stripe);
      // A tail at the back that swings out when running.
      const tail = new THREE.Group();
      tail.position.set(neck.x + neckR * 0.5, neck.y - neckR * 0.5, neck.z - neckR * 1.1);
      const seg = this.mesh(new THREE.BoxGeometry(neckR * 0.9, neckR * 3.2, neckR * 0.3), scarfMat);
      seg.position.y = -neckR * 1.5;
      const fringe = this.mesh(new THREE.BoxGeometry(neckR * 0.95, neckR * 0.5, neckR * 0.32), stripeMat);
      fringe.position.y = -neckR * 2.6;
      tail.add(seg, fringe);
      B.Chest.attach(tail);
      this.tail = tail;
    }

    // Horseshoe-magnet backpack: the arch and its two silver poles.
    const pack = new THREE.Group();
    const span = 0.1;
    pack.position.set(chest.x, chest.y - 0.03, backZ - 0.07);
    this.packMat = this.mat(L.main, { emissive: L.glow, emissiveIntensity: 0.25, roughness: 0.4 });
    const arch = this.mesh(new THREE.TorusGeometry(span, 0.045, 12, 28, Math.PI), this.packMat);
    arch.rotation.z = Math.PI;
    const poleMat = this.mat('#dfe5ee', { metalness: 0.15, roughness: 0.45, emissive: L.glow, emissiveIntensity: 0 });
    this.poleMat = poleMat;
    for (const side of [-1, 1]) {
      const pole = this.mesh(new THREE.CylinderGeometry(0.047, 0.047, 0.065, 16), poleMat);
      pole.position.set(side * span, 0.03, 0);
      pack.add(pole);
    }
    const harness = this.mesh(new THREE.BoxGeometry(0.2, 0.2, 0.045), this.mat('#3d3552', { roughness: 0.8 }));
    harness.position.set(0, -0.03, 0.045);
    pack.add(arch, harness);
    // Straps over the shoulders.
    const strapMat = this.mat('#3d3552', { roughness: 0.8 });
    for (const side of [-1, 1]) {
      const strap = this.mesh(new THREE.TorusGeometry(0.075, 0.016, 6, 16, Math.PI * 1.1), strapMat);
      strap.rotation.set(0, Math.PI / 2, Math.PI / 2 + 0.2);
      strap.position.set(side * 0.085, 0.09, 0.1);
      strap.scale.set(1, 1.15, 1);
      pack.add(strap);
    }
    B.Chest.attach(pack);
    this.pack = pack;

    // Wristbands, glowing with the magnet.
    this.bandMat = this.mat(L.main, { emissive: L.glow, emissiveIntensity: 0.2, roughness: 0.5 });
    for (const side of ['L', 'R']) {
      const lower = B[`LowerArm${side}`];
      const wrist = B[`Wrist${side}`];
      if (!lower || !wrist) continue;
      const a = lower.getWorldPosition(new THREE.Vector3());
      const b = wrist.getWorldPosition(new THREE.Vector3());
      const dir = b.clone().sub(a).normalize();
      const armPts = bodyPts.filter((v) => v.distanceTo(b) < 0.08);
      const r = armPts.length ? Math.max(0.025, ...armPts.filter((v) => Math.abs(v.clone().sub(b).dot(dir) + 0.03) < 0.012).map((v) => v.clone().sub(b).cross(dir).length())) : 0.035;
      const band = this.mesh(new THREE.TorusGeometry(Math.min(0.05, r * 1.02), 0.016, 8, 18), this.bandMat);
      band.position.copy(b).addScaledVector(dir, -0.03);
      band.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
      lower.attach(band);
    }
  }

  // -- events -----------------------------------------------------------------

  playOnce(name) {
    const a = this.actions[name];
    if (!a) return;
    if (this.oneShot && this.oneShot !== a) this.oneShot.stop();
    a.reset().play();
    a.setEffectiveWeight(0);
    this.oneShot = a;
    this.oneShotT = a.getClip().duration * 0.92;
    this.oneShotW = 0;
  }

  setVisible(v) {
    this.root.visible = v;
  }

  onJump() {
    this.squash = 1.16;
    this.squashV = 0;
  }
  onDoubleJump() {
    this.flipT = 0;
    this.squash = 1.1;
  }
  onLand(impact) {
    this.squashV -= Math.min(9, impact * 0.3);
    if (impact > 6) {
      this.landMax = Math.min(0.34, 0.12 + impact * 0.01);
      this.landT = this.landMax;
      this.landK = Math.min(1, impact / 16);
    }
  }
  onPoundStart() {
    this.poundSpin = 0;
  }
  onPoundLand() {
    this.squash = 0.62;
    this.squashV = 0;
    this.landMax = this.landT = 0.3;
    this.landK = 1;
  }
  onRespawn() {
    this.popIn = 0;
  }
  onWave() {
    this.playOnce('Wave');
  }

  // Rotate an arm bone (after the clips) so it points along dir (character space), by weight w.
  aim(name, dir, w) {
    const bone = this.bones[name];
    const child = this.bones[CHILD[name]];
    if (!bone || !child || w < 0.01) return;
    bone.parent.updateWorldMatrix(true, false);
    bone.updateWorldMatrix(false, true);
    const a = bone.getWorldPosition(_v1);
    const cur = child.getWorldPosition(_v2).sub(a).normalize();
    _dir.set(dir[0], dir[1], dir[2]).normalize().applyQuaternion(this.inner.getWorldQuaternion(_q3));
    _qw.setFromUnitVectors(cur, _dir).slerp(_id, 1 - w);
    const boneW = bone.getWorldQuaternion(_q1);
    const parentW = bone.parent.getWorldQuaternion(_q2).invert();
    bone.quaternion.copy(parentW.multiply(_qw.multiply(boneW)));
  }

  // s: { speed, vy, grounded, dashing, pound, magnet, stuck, stunned, yaw, carry, reach }
  //   reach: world point the arms reach for (magnet target or partner), or null
  update(dt, s) {
    dt = Math.min(dt, 0.1);
    this.time += dt;
    const t = this.time;
    const m = Math.min(1.3, s.speed / PHYS.runSpeed);
    const air = !s.grounded && !s.stuck;
    const flipping = this.flipT >= 0;
    if (this.landT > 0) this.landT = Math.max(0, this.landT - dt);

    // -- full-body layer weights --------------------------------------------
    const T = {};
    for (const n of this.layers) T[n] = 0;
    if (s.pound === 1 || s.pound === 2) T.tuck = 1;
    else if (s.pound === 3) T.crouch = 1;
    else if (s.dashing) T.dash = 1;
    else if (s.stuck) T.Idle = 1;
    else if (air) {
      if (flipping) T.tuck = 1;
      else {
        const up = smooth(-3, 3, s.vy);
        T.rise = up;
        T.fall = 1 - up;
      }
    } else {
      const move = smooth(0.03, 0.12, m);
      const runK = smooth(0.38, 0.68, m);
      T.Idle = 1 - move;
      T.Walk = move * (1 - runK);
      T.Run = move * runK;
      if (this.landT > 0) {
        const k = (this.landT / this.landMax) * this.landK * (1 - move * 0.6);
        for (const n of ['Idle', 'Walk', 'Run']) T[n] *= 1 - k;
        T.crouch = k;
      }
    }
    const rate = air || s.dashing || s.pound ? 22 : 14;
    let sum = 0;
    for (const n of this.layers) {
      this.w[n] = damp(this.w[n], T[n] ?? 0, rate, dt);
      sum += this.w[n];
    }
    // One-shots (wave, flinch) take over most of the body while they play.
    if (this.oneShot) {
      this.oneShotT -= dt;
      this.oneShotW = damp(this.oneShotW, this.oneShotT > 0 ? 1 : 0, 12, dt);
      if (this.oneShotT <= 0 && this.oneShotW < 0.02) {
        this.oneShot.stop();
        this.oneShot = null;
      } else this.oneShot.setEffectiveWeight(this.oneShotW * 3);
    }
    for (const n of this.layers) this.actions[n].setEffectiveWeight(this.w[n] / Math.max(1e-3, sum));

    // Walk and run share one step cycle so they blend without scissoring.
    const runK = smooth(0.38, 0.68, m);
    const freq = (1 - runK) * ((0.7 + m * 1.6) / this.walkDur) + runK * ((0.75 + m * 0.55) / this.runDur);
    if (!air && m > 0.03) this.cycle = (this.cycle + dt * freq) % 1;
    if (this.actions.Walk) this.actions.Walk.time = this.cycle * this.walkDur;
    if (this.actions.Run) this.actions.Run.time = ((this.cycle + 0.375) % 1) * this.runDur;
    this.phase = this.cycle * Math.PI * 2;

    if (s.stunned && !this.stunWas) this.playOnce('HitRecieve');
    this.stunWas = s.stunned;
    this.mixer.update(dt);

    // -- facing, lean and bank -------------------------------------------------
    this.root.rotation.y = s.yaw;
    const yawRate = this.prevYaw === null ? 0 : wrap(s.yaw - this.prevYaw) / Math.max(dt, 1e-3);
    this.prevYaw = s.yaw;
    const bankT = s.grounded && !s.dashing ? Math.max(-0.2, Math.min(0.2, -yawRate * m * 0.045)) : 0;
    this.bank = damp(this.bank, bankT, 8, dt);
    this.tilt.rotation.z = this.bank;
    const targetLean = s.dashing ? 0.45 : s.grounded ? m * 0.1 : 0.04;
    this.lean = damp(this.lean, targetLean, 10, dt);
    this.tilt.rotation.x = this.lean;

    // -- arms ----------------------------------------------------------------
    const A = this.armW;
    const reaching = !!s.reach && (s.magnet === 1 || s.magnet === 2 || s.magnet === 3 || s.stuck);
    const aT = {
      up: !reaching && s.stuck ? 1 : 0,
      carry: s.carry && !reaching && !s.stuck && !s.dashing && !s.pound ? 1 : 0,
      back: s.dashing ? 0.8 : 0,
      reach: reaching ? 1 : 0,
    };
    for (const k of Object.keys(A)) A[k] = damp(A[k], aT[k], 14, dt);
    if (this.oneShot) for (const k of Object.keys(A)) A[k] *= 1 - this.oneShotW * 0.8;
    this.root.updateMatrixWorld(true);
    if (reaching) {
      // Reach for the target, in character space.
      this.inner.worldToLocal(_v1.copy(s.reach));
      _v1.y -= 1.3;
      if (_v1.lengthSq() > 1e-4) this.reachDir.lerp(_v1.normalize(), 1 - Math.exp(-10 * dt));
    }
    for (const pose of ['up', 'carry', 'back']) {
      const wt = A[pose];
      if (wt < 0.01) continue;
      for (const [bone, dir] of Object.entries(ARMS[pose])) this.aim(bone, dir, wt);
    }
    if (A.reach > 0.01) {
      const d = this.reachDir;
      for (const [bone, dx] of [['UpperArmL', 0.18], ['LowerArmL', 0.06], ['UpperArmR', -0.18], ['LowerArmR', -0.06]]) {
        this.aim(bone, [d.x + dx, d.y, d.z], A.reach);
      }
    }

    // -- squash, stretch, flips ----------------------------------------------
    this.squashV += ((1 - this.squash) * 260 - this.squashV * 14) * dt;
    this.squash += this.squashV * dt;
    let sy = this.squash;
    if (air && s.pound === 0) sy *= 1 + Math.min(0.1, Math.abs(s.vy) * 0.005);
    const sx = 1 / Math.sqrt(Math.max(0.4, sy));
    this.body.scale.set(sx, sy, sx);

    if (this.popIn < 1) {
      this.popIn = Math.min(1, this.popIn + dt * 3);
      const k = this.popIn;
      this.root.scale.setScalar(Math.max(0.01, k * (1 + Math.sin(k * Math.PI * 1.5) * (1 - k) * 0.5)));
    } else this.root.scale.setScalar(1);

    let spinX = 0;
    if (this.flipT >= 0) {
      this.flipT += dt / 0.42;
      if (this.flipT >= 1 || !air) this.flipT = -1;
      else spinX = (1 - Math.pow(1 - this.flipT, 3)) * Math.PI * 2;
    }
    if (s.pound === 1) {
      this.poundSpin = Math.min(1, this.poundSpin + dt / 0.16);
      spinX = this.poundSpin * Math.PI * 2;
    } else this.poundSpin = 0; // (the partner's pounds have no start event)
    this.spin.rotation.x = spinX;

    // -- face ----------------------------------------------------------------
    if (this.lids) {
      this.blinkT -= dt;
      let lid = 0.04;
      if (this.blinkT < 0) {
        lid = 1;
        if (this.blinkT < -0.13) this.blinkT = 1.8 + Math.random() * 3.5;
      }
      if (s.stunned) lid = 0.75;
      else if (s.pound === 3 || (this.landT > 0 && this.landK > 0.7)) lid = Math.max(lid, 0.55);
      else if (s.magnet || s.pound) lid = Math.max(lid, 0.3);
      this.lid = damp(this.lid, lid, 32, dt);
      for (const l of this.lids) l.scale.y = this.lid;

      let mouth = 'smile';
      let browUp = 0;
      let browIn = 0;
      if (s.stunned) {
        mouth = 'oh';
        browUp = 1;
      } else if (s.pound || s.magnet) {
        mouth = 'flat';
        browIn = 1;
      } else if (this.oneShot && this.oneShot === this.actions.Wave) {
        mouth = 'open';
        browUp = 0.6;
      } else if (air && s.vy < -10) {
        mouth = 'oh';
        browUp = 1;
      } else if (air || s.dashing) {
        mouth = 'open';
        browUp = 0.7;
      }
      for (const [k, mesh] of Object.entries(this.mouths)) mesh.visible = k === mouth;
      for (const b of this.brows) {
        const side = b.userData.side;
        b.position.y = damp(b.position.y, b.userData.base + browUp * 0.012 - browIn * 0.006, 16, dt);
        b.rotation.z = damp(b.rotation.z, side * (browUp * 0.12 - browIn * 0.35), 16, dt);
      }
    }

    // -- secondary motion: scarf / ribbon tail ---------------------------------
    if (this.tail) {
      const target = 0.25 + Math.min(1.2, m * 0.9 + (air ? Math.max(0, -s.vy) * 0.05 + 0.2 : 0) + (s.dashing ? 0.6 : 0));
      this.tailV += ((target - this.tailA) * 90 - this.tailV * 9) * dt;
      this.tailA += this.tailV * dt;
      this.tail.rotation.x = this.index === 0 ? this.tailA + Math.sin(t * 11) * 0.06 * m : -this.tailA * 0.6;
      this.tail.rotation.z = Math.sin(t * 7.3) * 0.05 * (0.3 + m);
    }
    if (this.pom && this.index === 0) this.pom.position.x = Math.sin(this.phase) * 0.004 * m;

    // -- magnet glow -----------------------------------------------------------
    const glow = s.magnet ? 2 + Math.sin(t * 20) * 0.5 : 0.25;
    this.glow = damp(this.glow, glow, 12, dt);
    if (this.packMat) {
      this.packMat.emissiveIntensity = this.glow;
      this.poleMat.emissiveIntensity = Math.max(0, this.glow - 0.25) * 0.8;
      this.bandMat.emissiveIntensity = this.glow;
    }
  }

  dispose() {
    this.mixer.stopAllAction();
    for (const x of this.owned) x.dispose();
  }
}
