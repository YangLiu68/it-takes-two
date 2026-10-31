// Atmosphere: sky dome, lighting, the cloud sea under the level, giant
// floating toys in the distance and drifting motes near the camera.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RNG } from '../shared/rng.js';

export const SUN_DIR = new THREE.Vector3(-0.45, 0.78, 0.43).normalize();
const _f = new THREE.Vector3();

export class Environment {
  constructor(game, level) {
    this.game = game;
    this.level = level;
    const th = level.theme;
    this.group = new THREE.Group();
    game.scene.add(this.group);
    this.disposables = [];

    game.scene.fog = new THREE.FogExp2(th.fog, th.fogDensity);
    game.scene.background = new THREE.Color(th.skyHorizon);
    // Each level can set its own sun (or moon) direction.
    this.sunDir = th.sunDir ? new THREE.Vector3(...th.sunDir).normalize() : SUN_DIR.clone();
    this.lightRot = new THREE.Matrix4().lookAt(this.sunDir, new THREE.Vector3(), new THREE.Vector3(0, 1, 0));
    this.lightInv = this.lightRot.clone().invert();

    this.buildSky(th);
    this.buildLights(th);
    // Indoor levels (the horror stories) have no cloud sea or floating toys.
    this.decor = [];
    if (!th.indoor) {
      this.buildClouds(th);
      this.buildDecor(th);
      this.buildMotes();
    }
    if (th.stars) this.buildStars();
  }

  buildStars() {
    const n = 1400;
    const pos = new Float32Array(n * 3);
    const seed = new Float32Array(n);
    const rng = new RNG(`${this.level.seed}:stars`);
    for (let i = 0; i < n; i++) {
      const u = rng.range(0.04, 1);
      const a = rng.range(0, Math.PI * 2);
      const r = Math.sqrt(1 - u * u);
      pos[i * 3] = Math.cos(a) * r * 950;
      pos[i * 3 + 1] = u * 950;
      pos[i * 3 + 2] = Math.sin(a) * r * 950;
      seed[i] = rng.next();
    }
    const geo = this.track(new THREE.BufferGeometry());
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
    const mat = this.track(new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      fog: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        attribute float seed;
        uniform float uTime;
        varying float vA;
        void main() {
          vA = 0.45 + 0.55 * sin(uTime * (0.8 + seed * 2.0) + seed * 60.0);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = 1.5 + seed * 2.6;
          gl_Position = projectionMatrix * mv;
          gl_Position.z = gl_Position.w * 0.9999;
        }
      `,
      fragmentShader: `
        varying float vA;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d) * vA;
          gl_FragColor = vec4(vec3(1.0, 0.97, 0.9) * a * 1.4, a);
        }
      `,
    }));
    const stars = new THREE.Points(geo, mat);
    stars.frustumCulled = false;
    stars.renderOrder = -9;
    this.stars = stars;
    this.group.add(stars);
  }

  track(o) {
    this.disposables.push(o);
    return o;
  }

  buildSky(th) {
    const mat = this.track(new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        uTop: { value: new THREE.Color(th.skyTop) },
        uHorizon: { value: new THREE.Color(th.skyHorizon) },
        uBottom: { value: new THREE.Color(th.skyBottom) },
        uSun: { value: new THREE.Color(th.sun) },
        uSunDir: { value: this.sunDir.clone() },
      },
      vertexShader: `
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          gl_Position = p.xyww;
        }
      `,
      fragmentShader: `
        uniform vec3 uTop, uHorizon, uBottom, uSun, uSunDir;
        varying vec3 vDir;
        void main() {
          float h = vDir.y;
          vec3 col = h > 0.0 ? mix(uHorizon, uTop, pow(clamp(h, 0.0, 1.0), 0.55))
                             : mix(uHorizon, uBottom, pow(clamp(-h, 0.0, 1.0), 0.45));
          float s = max(dot(normalize(vDir), uSunDir), 0.0);
          col += uSun * (pow(s, 900.0) * 3.0 + pow(s, 24.0) * 0.35 + pow(s, 4.0) * 0.08);
          gl_FragColor = vec4(col, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
    }));
    const sky = new THREE.Mesh(this.track(new THREE.SphereGeometry(1000, 48, 24)), mat);
    sky.renderOrder = -10;
    sky.frustumCulled = false;
    this.sky = sky;
    this.group.add(sky);
  }

  buildLights(th) {
    const hemi = new THREE.HemisphereLight(th.hemiSky, th.hemiGround, th.hemiIntensity * 0.5);
    this.group.add(hemi);
    const sun = new THREE.DirectionalLight(th.sun, th.sunIntensity * 1.1);
    sun.castShadow = true;
    const q = this.game.settings.quality;
    const size = q === 'low' ? 1024 : 2048;
    sun.shadow.mapSize.set(size, size);
    const ext = 38;
    Object.assign(sun.shadow.camera, { left: -ext, right: ext, top: ext, bottom: -ext, near: 1, far: 220 });
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.035;
    sun.shadow.radius = q === 'low' ? 1 : 3.5;
    this.group.add(sun);
    this.group.add(sun.target);
    this.sun = sun;
    this.hemi = hemi;
  }

  // Keep the shadow frustum centered on the action, snapped to texels to
  // avoid shimmering edges.
  followShadow(focus) {
    const sun = this.sun;
    const cam = sun.shadow.camera;
    const texel = (cam.right - cam.left) / sun.shadow.mapSize.x;
    // Snap in light space.
    const f = _f.copy(focus).applyMatrix4(this.lightInv);
    f.x = Math.round(f.x / texel) * texel;
    f.y = Math.round(f.y / texel) * texel;
    f.applyMatrix4(this.lightRot);
    sun.target.position.copy(f);
    sun.position.copy(f).addScaledVector(this.sunDir, 110);
  }

  buildClouds(th) {
    const rng = new RNG(`${this.level.seed}:${this.level.index}:clouds`);
    const b = this.level.bounds;
    const puffs = [];
    const base = new THREE.IcosahedronGeometry(1, 3);
    const addCloud = (cx, cy, cz, scale, flat) => {
      const n = rng.int(5, 9);
      for (let i = 0; i < n; i++) {
        const g = base.clone();
        const r = rng.range(0.55, 1.0) * scale;
        g.scale(r * rng.range(1.0, 1.4), r * flat, r * rng.range(1.0, 1.3));
        const a = rng.range(0, Math.PI * 2);
        const d = rng.range(0, scale * 1.4);
        g.translate(cx + Math.cos(a) * d, cy + rng.range(-0.2, 0.5) * scale, cz + Math.sin(a) * d);
        puffs.push(g);
      }
    };
    const margin = 90;
    const area = (b.maxX - b.minX + margin * 2) * (b.maxZ - b.minZ + margin * 2);
    const count = Math.min(140, Math.floor(area / 900));
    for (let i = 0; i < count; i++) {
      addCloud(
        rng.range(b.minX - margin, b.maxX + margin),
        this.level.killY + rng.range(-4, 1),
        rng.range(b.minZ - margin, b.maxZ + margin),
        rng.range(4, 9), 0.55,
      );
    }
    for (let i = 0; i < 16; i++) {
      addCloud(
        rng.range(b.minX - margin * 1.5, b.maxX + margin * 1.5),
        b.maxY + rng.range(30, 70),
        rng.range(b.minZ - margin * 1.5, b.maxZ + margin * 1.5),
        rng.range(5, 11), 0.5,
      );
    }
    base.dispose();
    const geo = mergeGeometries(puffs);
    puffs.forEach((g) => g.dispose());
    this.track(geo);
    const mat = this.track(new THREE.MeshStandardMaterial({
      color: th.cloud, roughness: 1, metalness: 0, emissive: th.cloud, emissiveIntensity: 0.15,
    }));
    const clouds = new THREE.Mesh(geo, mat);
    clouds.receiveShadow = false;
    this.clouds = clouds;
    this.group.add(clouds);
  }

  buildDecor(th) {
    const items = this.level.decor;
    this.decor = [];
    const letterCache = new Map();
    const letterTex = (letter, bg, fg) => {
      const key = letter + bg + fg;
      if (letterCache.has(key)) return letterCache.get(key);
      const c = document.createElement('canvas');
      c.width = c.height = 256;
      const ctx = c.getContext('2d');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 256, 256);
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 14;
      ctx.strokeRect(22, 22, 212, 212);
      ctx.fillStyle = fg;
      ctx.font = '700 170px Fredoka, "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(letter, 128, 140);
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      this.track(t);
      letterCache.set(key, t);
      return t;
    };
    const stripeTex = (a, b) => {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 16;
      const ctx = c.getContext('2d');
      const cols = [a, '#ffffff', b, '#ffffff'];
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = cols[i % 4];
        ctx.fillRect(i * 32, 0, 32, 16);
      }
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      return this.track(t);
    };
    const std = (o) => this.track(new THREE.MeshStandardMaterial({ roughness: 0.5, ...o }));

    for (const d of items) {
      const g = new THREE.Group();
      const s = d.s;
      if (d.kind === 'block') {
        const geo = this.track(new RoundedBoxGeometry(s, s, s, 3, s * 0.08));
        g.add(new THREE.Mesh(geo, std({ map: letterTex(d.letter, d.color, '#ffffff') })));
      } else if (d.kind === 'ball') {
        const geo = this.track(new THREE.SphereGeometry(s * 0.6, 40, 24));
        g.add(new THREE.Mesh(geo, std({ map: stripeTex(d.color, d.color2), roughness: 0.3 })));
      } else if (d.kind === 'crayon') {
        const body = new THREE.Mesh(this.track(new THREE.CylinderGeometry(s * 0.18, s * 0.18, s * 2.2, 6)), std({ color: d.color }));
        const tip = new THREE.Mesh(this.track(new THREE.ConeGeometry(s * 0.18, s * 0.5, 6)), std({ color: d.color }));
        tip.position.y = s * 1.35;
        const wrap = new THREE.Mesh(this.track(new THREE.CylinderGeometry(s * 0.185, s * 0.185, s * 1.2, 6)), std({ color: '#fdf6e3' }));
        wrap.position.y = -s * 0.2;
        g.add(body, tip, wrap);
      } else if (d.kind === 'ring') {
        g.add(new THREE.Mesh(this.track(new THREE.TorusGeometry(s * 0.55, s * 0.2, 20, 40)), std({ color: d.color, roughness: 0.3 })));
      } else if (d.kind === 'star') {
        const shape = new THREE.Shape();
        for (let i = 0; i < 10; i++) {
          const r = i % 2 ? s * 0.28 : s * 0.65;
          const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
          if (i === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
          else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        const geo = this.track(new THREE.ExtrudeGeometry(shape, { depth: s * 0.22, bevelEnabled: true, bevelSize: s * 0.05, bevelThickness: s * 0.05, bevelSegments: 3 }));
        geo.center();
        g.add(new THREE.Mesh(geo, std({ color: '#ffd84d', emissive: '#ffb703', emissiveIntensity: 0.25, roughness: 0.35 })));
      } else if (d.kind === 'spool') {
        const end = std({ color: th.wood });
        const top = new THREE.Mesh(this.track(new THREE.CylinderGeometry(s * 0.5, s * 0.5, s * 0.14, 32)), end);
        top.position.y = s * 0.5;
        const bot = top.clone();
        bot.position.y = -s * 0.5;
        const thread = new THREE.Mesh(this.track(new THREE.CylinderGeometry(s * 0.38, s * 0.38, s * 0.86, 32)), std({ color: d.color, roughness: 0.9 }));
        g.add(top, bot, thread);
      } else {
        const disc = new THREE.Mesh(this.track(new THREE.CylinderGeometry(s * 0.6, s * 0.6, s * 0.16, 40)), std({ color: d.color, roughness: 0.35 }));
        g.add(disc);
        for (const [hx, hz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
          const h = new THREE.Mesh(this.track(new THREE.CylinderGeometry(s * 0.08, s * 0.08, s * 0.18, 16)), std({ color: '#3b2f4a' }));
          h.position.set(hx * s * 0.16, 0, hz * s * 0.16);
          g.add(h);
        }
      }
      g.position.set(d.x, d.y, d.z);
      g.rotation.set(d.tilt, d.yaw, d.tilt * 0.5);
      this.group.add(g);
      this.decor.push({ g, d });
    }
  }

  buildMotes() {
    const n = 260;
    const pos = new Float32Array(n * 3);
    const seed = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 70;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 70;
      seed[i] = Math.random();
    }
    const geo = this.track(new THREE.BufferGeometry());
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
    const mat = this.track(new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uCenter: { value: new THREE.Vector3() }, uScale: { value: 400 } },
      vertexShader: `
        attribute float seed;
        uniform float uTime; uniform vec3 uCenter; uniform float uScale;
        varying float vA;
        void main() {
          vec3 p = position;
          p.y += uTime * (0.3 + seed * 0.5);
          p.x += sin(uTime * 0.3 + seed * 30.0) * 1.5;
          // Wrap into a box that follows the camera.
          vec3 box = vec3(70.0, 40.0, 70.0);
          p = mod(p - uCenter + box * 0.5, box) - box * 0.5 + uCenter;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = uScale * (0.05 + seed * 0.06) / -mv.z;
          vA = 0.35 + 0.65 * sin(uTime * (0.8 + seed) + seed * 40.0) * 0.5 + 0.2;
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        varying float vA;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d) * vA * 0.55;
          gl_FragColor = vec4(vec3(1.0, 0.96, 0.85) * a, a);
        }
      `,
    }));
    const pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false;
    this.motes = pts;
    this.group.add(pts);
  }

  update(dt, t, camera, focus, pixelScale) {
    this.sky.position.copy(camera.position);
    if (this.stars) {
      this.stars.position.copy(camera.position);
      this.stars.material.uniforms.uTime.value = t;
    }
    if (this.clouds) {
      this.clouds.position.x = Math.sin(t * 0.03) * 6;
      this.clouds.position.z = Math.cos(t * 0.025) * 6;
    }
    for (const { g, d } of this.decor) {
      g.rotation.y = d.yaw + t * d.spin;
      g.position.y = d.y + Math.sin(t * 0.25 + d.bob) * 1.5;
    }
    if (this.motes) {
      const mu = this.motes.material.uniforms;
      mu.uTime.value = t;
      mu.uCenter.value.copy(camera.position);
      mu.uScale.value = pixelScale;
    }
    if (focus) this.followShadow(focus);
  }

  dispose() {
    this.game.scene.remove(this.group);
    for (const d of this.disposables) d.dispose?.();
    this.sun.shadow.map?.dispose();
  }
}
