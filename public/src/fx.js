// Particles, shockwave rings and magnet beams.

import * as THREE from 'three';

class ParticleSystem {
  constructor(scene, max, additive) {
    this.max = max;
    this.count = 0;
    this.pos = new Float32Array(max * 3);
    this.col = new Float32Array(max * 3);
    this.size = new Float32Array(max);
    this.alpha = new Float32Array(max);
    this.vel = new Float32Array(max * 3);
    this.life = new Float32Array(max);
    this.maxLife = new Float32Array(max);
    this.grav = new Float32Array(max);
    this.drag = new Float32Array(max);
    this.size0 = new Float32Array(max);
    this.size1 = new Float32Array(max);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('size', new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('alpha', new THREE.BufferAttribute(this.alpha, 1).setUsage(THREE.DynamicDrawUsage));
    this.geo = geo;
    this.mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      uniforms: { uScale: { value: 500 } },
      vertexShader: `
        attribute vec3 color; attribute float size; attribute float alpha;
        uniform float uScale;
        varying vec3 vColor; varying float vAlpha;
        void main() {
          vColor = color; vAlpha = alpha;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * uScale / -mv.z;
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        varying vec3 vColor; varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.25, d) * vAlpha;
          if (a < 0.01) discard;
          gl_FragColor = vec4(vColor, a);
          #include <colorspace_fragment>
        }
      `,
    });
    this.points = new THREE.Points(geo, this.mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 5;
    scene.add(this.points);
  }

  spawn(x, y, z, vx, vy, vz, color, size0, size1, life, grav, drag) {
    if (this.count >= this.max) return;
    const i = this.count++;
    this.pos[i * 3] = x;
    this.pos[i * 3 + 1] = y;
    this.pos[i * 3 + 2] = z;
    this.vel[i * 3] = vx;
    this.vel[i * 3 + 1] = vy;
    this.vel[i * 3 + 2] = vz;
    this.col[i * 3] = color.r;
    this.col[i * 3 + 1] = color.g;
    this.col[i * 3 + 2] = color.b;
    this.size0[i] = size0;
    this.size1[i] = size1;
    this.size[i] = size0;
    this.life[i] = life;
    this.maxLife[i] = life;
    this.grav[i] = grav;
    this.drag[i] = drag;
    this.alpha[i] = 1;
  }

  update(dt) {
    let i = 0;
    while (i < this.count) {
      this.life[i] -= dt;
      if (this.life[i] <= 0) {
        // Swap-remove with the last particle.
        const j = --this.count;
        if (i !== j) {
          for (let k = 0; k < 3; k++) {
            this.pos[i * 3 + k] = this.pos[j * 3 + k];
            this.vel[i * 3 + k] = this.vel[j * 3 + k];
            this.col[i * 3 + k] = this.col[j * 3 + k];
          }
          this.size0[i] = this.size0[j];
          this.size1[i] = this.size1[j];
          this.life[i] = this.life[j];
          this.maxLife[i] = this.maxLife[j];
          this.grav[i] = this.grav[j];
          this.drag[i] = this.drag[j];
        }
        continue;
      }
      const d = Math.exp(-this.drag[i] * dt);
      this.vel[i * 3] *= d;
      this.vel[i * 3 + 1] = this.vel[i * 3 + 1] * d - this.grav[i] * dt;
      this.vel[i * 3 + 2] *= d;
      this.pos[i * 3] += this.vel[i * 3] * dt;
      this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt;
      this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
      const k = 1 - this.life[i] / this.maxLife[i];
      this.size[i] = this.size0[i] + (this.size1[i] - this.size0[i]) * k;
      this.alpha[i] = Math.min(1, (1 - k) * 2.2) * Math.min(1, k * 12 + 0.2);
      i++;
    }
    this.geo.setDrawRange(0, this.count);
    for (const name of ['position', 'color', 'size', 'alpha']) this.geo.attributes[name].needsUpdate = true;
  }

  dispose() {
    this.points.parent?.remove(this.points);
    this.geo.dispose();
    this.mat.dispose();
  }
}

const _c = new THREE.Color();
const rand = (a, b) => a + Math.random() * (b - a);

export class Effects {
  constructor(scene) {
    this.scene = scene;
    this.dust = new ParticleSystem(scene, 1500, false);
    this.glow = new ParticleSystem(scene, 1500, true);
    this.rings = [];
    this.ringGeo = new THREE.RingGeometry(0.8, 1.0, 48);
    this.beams = [];
  }

  setScale(s) {
    this.dust.mat.uniforms.uScale.value = s;
    this.glow.mat.uniforms.uScale.value = s;
  }

  puff(p, count = 10, color = '#f3e6d8', speed = 3, size = 0.6) {
    _c.set(color);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = rand(0.4, 1) * speed;
      this.dust.spawn(p.x + Math.cos(a) * 0.3, p.y + 0.1, p.z + Math.sin(a) * 0.3,
        Math.cos(a) * s, rand(0.5, 1.6), Math.sin(a) * s, _c, size * rand(0.6, 1), size * 2.2, rand(0.35, 0.65), -1.0, 4);
    }
  }

  footstep(p) {
    _c.set('#efe2d2');
    for (let i = 0; i < 2; i++) {
      this.dust.spawn(p.x + rand(-0.15, 0.15), p.y + 0.05, p.z + rand(-0.15, 0.15), rand(-0.5, 0.5), rand(0.4, 0.9), rand(-0.5, 0.5), _c, 0.3, 0.75, 0.4, -0.5, 3);
    }
  }

  sparkle(p, color = '#ffe066', count = 16, speed = 4, size = 0.35, up = 1) {
    _c.set(color);
    for (let i = 0; i < count; i++) {
      const v = new THREE.Vector3(rand(-1, 1), rand(-0.3, 1) * up, rand(-1, 1)).normalize().multiplyScalar(rand(0.3, 1) * speed);
      this.glow.spawn(p.x, p.y, p.z, v.x, v.y, v.z, _c, size, 0.02, rand(0.4, 0.9), 2.5, 2.5);
    }
  }

  confetti(p, colors, count = 80) {
    for (let i = 0; i < count; i++) {
      _c.set(colors[i % colors.length]);
      const a = Math.random() * Math.PI * 2;
      const s = rand(2, 9);
      this.dust.spawn(p.x, p.y, p.z, Math.cos(a) * s, rand(6, 14), Math.sin(a) * s, _c, rand(0.25, 0.45), 0.2, rand(1.6, 2.6), 9, 1.4);
    }
  }

  updraft(x, y, z, h) {
    _c.set('#e6f6ff');
    const v = 7 + Math.random() * 3;
    this.glow.spawn(x, y, z, 0, v, 0, _c, 0.16, 0.04, Math.min(2.4, h / v), 0, 0);
  }

  trail(p, color, size = 0.3) {
    _c.set(color);
    this.glow.spawn(p.x + rand(-0.2, 0.2), p.y + rand(0.2, 1.2), p.z + rand(-0.2, 0.2), 0, 0, 0, _c, size, 0.02, 0.35, 0, 0);
  }

  ring(p, color = '#ffffff', radius = 3, life = 0.45) {
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide });
    const m = new THREE.Mesh(this.ringGeo, mat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(p.x, p.y + 0.06, p.z);
    m.scale.setScalar(0.2);
    this.scene.add(m);
    this.rings.push({ m, t: 0, life, radius });
  }

  // A pulsing beam between two points; returns a handle updated each frame.
  beam(color) {
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(color) }, uLen: { value: 1 } },
      vertexShader: `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
      `,
      fragmentShader: `
        uniform float uTime; uniform vec3 uColor; uniform float uLen;
        varying vec2 vUv;
        void main() {
          float w = 1.0 - abs(vUv.x - 0.5) * 2.0;
          float pulse = 0.5 + 0.5 * sin(vUv.y * uLen * 6.0 - uTime * 18.0);
          float a = w * w * (0.35 + pulse * 0.65);
          gl_FragColor = vec4(uColor * a * 2.0, a);
        }
      `,
    });
    const geo = new THREE.CylinderGeometry(0.09, 0.09, 1, 10, 1, true);
    geo.translate(0, 0.5, 0);
    const m = new THREE.Mesh(geo, mat);
    m.visible = false;
    m.frustumCulled = false;
    this.scene.add(m);
    const handle = { m, mat, geo };
    this.beams.push(handle);
    return handle;
  }

  setBeam(h, a, b, visible, t, color) {
    h.m.visible = visible;
    if (!visible) return;
    const d = new THREE.Vector3().subVectors(b, a);
    const len = d.length();
    h.m.position.copy(a);
    h.m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    h.m.scale.set(1, len, 1);
    h.mat.uniforms.uTime.value = t;
    h.mat.uniforms.uLen.value = len;
    if (color) h.mat.uniforms.uColor.value.set(color);
  }

  update(dt) {
    this.dust.update(dt);
    this.glow.update(dt);
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.t += dt / r.life;
      if (r.t >= 1) {
        this.scene.remove(r.m);
        r.m.material.dispose();
        this.rings.splice(i, 1);
        continue;
      }
      const e = 1 - Math.pow(1 - r.t, 3);
      r.m.scale.setScalar(0.2 + e * r.radius);
      r.m.material.opacity = 0.85 * (1 - r.t);
    }
  }

  dispose() {
    this.dust.dispose();
    this.glow.dispose();
    for (const r of this.rings) {
      this.scene.remove(r.m);
      r.m.material.dispose();
    }
    this.ringGeo.dispose();
    for (const b of this.beams) {
      this.scene.remove(b.m);
      b.geo.dispose();
      b.mat.dispose();
    }
  }
}
