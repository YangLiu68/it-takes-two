// Renderer, post-processing and quality management. Lives for the whole
// session; each level brings its own scene.

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createTextures, createMaterials } from './materials.js';

// Gentle vignette, applied in linear space before tone mapping.
const VignetteShader = {
  uniforms: { tDiffuse: { value: null }, uStrength: { value: 0.32 } },
  vertexShader: `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uStrength;
    varying vec2 vUv;
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      vec2 d = vUv - 0.5;
      float v = smoothstep(0.85, 0.2, length(d * vec2(1.1, 1.0)));
      c.rgb *= mix(1.0 - uStrength, 1.0, v);
      gl_FragColor = c;
    }
  `,
};

const QUALITY = {
  high: { pixelRatio: 2, samples: 4, bloom: true },
  medium: { pixelRatio: 1.5, samples: 4, bloom: true },
  low: { pixelRatio: 1, samples: 0, bloom: false },
};

export class Graphics {
  constructor(canvas, settings) {
    this.canvas = canvas;
    this.settings = settings;
    const r = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false });
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.0;
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFShadowMap;
    this.renderer = r;
    this.camera = new THREE.PerspectiveCamera(62, 1, 0.1, 2600);
    this.tex = createTextures();
    this.mats = createMaterials(this.tex);

    const pmrem = new THREE.PMREMGenerator(r);
    this.envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    this.fpsSamples = [];
    this.downgradeCooldown = 6;
    this.onDowngrade = null;
    this.setupComposer();
    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  setupComposer() {
    const q = QUALITY[this.settings.quality] || QUALITY.high;
    this.q = q;
    if (this.composer) this.composer.dispose();
    const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: q.samples });
    this.composer = new EffectComposer(this.renderer, target);
    this.renderPass = new RenderPass(new THREE.Scene(), this.camera);
    this.composer.addPass(this.renderPass);
    this.bloom = null;
    if (q.bloom) {
      this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.22, 0.4, 1.05);
      this.composer.addPass(this.bloom);
    }
    this.vignette = new ShaderPass(VignetteShader);
    this.composer.addPass(this.vignette);
    this.composer.addPass(new OutputPass());
    this.setMood(this.mood);
    this.resize();
  }

  // 'dark' for the horror stories: heavy vignette, stronger glow on lights.
  setMood(mood) {
    this.mood = mood || 'bright';
    const dark = this.mood === 'dark';
    this.vignette.uniforms.uStrength.value = dark ? 0.72 : 0.32;
    if (this.bloom) this.bloom.strength = dark ? 0.55 : 0.22;
  }

  setQuality(q) {
    this.settings.quality = q;
    this.setupComposer();
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const pr = Math.min(window.devicePixelRatio || 1, this.q.pixelRatio);
    this.renderer.setPixelRatio(pr);
    this.renderer.setSize(w, h, false);
    this.composer.setPixelRatio(pr);
    this.composer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  // Pixels per world unit at distance 1, for point-sprite sizing.
  pointScale() {
    const h = this.renderer.getDrawingBufferSize(new THREE.Vector2()).y;
    return h / (2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov) / 2));
  }

  render(scene) {
    this.renderPass.scene = scene;
    this.composer.render();
  }

  // Drop quality automatically if the frame rate stays low.
  trackFps(dt) {
    this.downgradeCooldown -= dt;
    this.fpsSamples.push(dt);
    if (this.fpsSamples.length < 120) return;
    const avg = this.fpsSamples.reduce((a, b) => a + b, 0) / this.fpsSamples.length;
    this.fpsSamples.length = 0;
    if (this.downgradeCooldown > 0 || !this.settings.autoQuality) return;
    if (1 / avg < 38 && this.settings.quality !== 'low') {
      const next = this.settings.quality === 'high' ? 'medium' : 'low';
      this.setQuality(next);
      this.downgradeCooldown = 8;
      this.onDowngrade?.(next);
    }
  }
}
