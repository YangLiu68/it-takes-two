// Third-person orbit camera with smoothing, collision and a bit of juice
// (shake, FOV kick).

import * as THREE from 'three';

const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));

export class CameraRig {
  constructor(camera, physics) {
    this.camera = camera;
    this.physics = physics;
    this.yaw = 0;
    this.pitch = 0.32;
    this.dist = 7.6;
    this.targetDist = 7.6;
    this.curDist = 7.6;
    this.focus = new THREE.Vector3();
    this.shake = 0;
    this.fovKick = 0;
    this.baseFov = 62;
    this.dir = new THREE.Vector3();
    this.forward = new THREE.Vector3();
    this.initialized = false;
  }

  snap(pos, yaw) {
    this.focus.set(pos.x, pos.y + 1.35, pos.z);
    this.yaw = yaw + Math.PI;
    this.pitch = 0.32;
    this.curDist = this.targetDist;
    this.initialized = true;
  }

  addShake(a) {
    this.shake = Math.min(1.2, this.shake + a);
  }

  kickFov(a) {
    this.fovKick = Math.max(this.fovKick, a);
  }

  update(dt, inp, target, grounded) {
    if (!this.initialized) this.snap(target, 0);
    this.yaw -= inp.lookX;
    this.pitch += inp.lookY;
    this.pitch = Math.max(-0.55, Math.min(1.3, this.pitch));
    if (inp.zoom) this.targetDist = Math.max(3.5, Math.min(14, this.targetDist + inp.zoom * 0.8));
    this.dist = damp(this.dist, this.targetDist, 10, dt);

    // Follow: tight horizontally, lazier vertically while airborne so jumps
    // don't bob the whole view.
    const fx = target.x, fy = target.y + 1.35, fz = target.z;
    this.focus.x = damp(this.focus.x, fx, 16, dt);
    this.focus.z = damp(this.focus.z, fz, 16, dt);
    this.focus.y = damp(this.focus.y, fy, grounded ? 9 : 3.2, dt);
    if (this.focus.y - fy > 2.2) this.focus.y = fy + 2.2;
    if (fy - this.focus.y > 3.0) this.focus.y = fy - 3.0;

    const cp = Math.cos(this.pitch);
    this.dir.set(Math.sin(this.yaw) * cp, Math.sin(this.pitch), Math.cos(this.yaw) * cp);

    // Pull in when something is between the player and the camera.
    const hit = this.physics.raycast(this.focus, this.dir, this.dist + 0.4, (c) => c.noCamera || c.kind === 'partner' || c.kind === 'plate');
    const allowed = hit ? Math.max(0.9, hit.t - 0.4) : this.dist;
    if (allowed < this.curDist) this.curDist = allowed;
    else this.curDist = damp(this.curDist, allowed, 3.5, dt);

    const cam = this.camera;
    cam.position.copy(this.focus).addScaledVector(this.dir, this.curDist);
    if (this.shake > 0) {
      const s = this.shake * this.shake * 0.35;
      cam.position.x += (Math.random() - 0.5) * s;
      cam.position.y += (Math.random() - 0.5) * s;
      cam.position.z += (Math.random() - 0.5) * s;
      this.shake = Math.max(0, this.shake - dt * 2.8);
    }
    cam.lookAt(this.focus);
    this.fovKick = damp(this.fovKick, 0, 4, dt);
    const fov = this.baseFov + this.fovKick;
    if (Math.abs(cam.fov - fov) > 0.01) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }
    cam.getWorldDirection(this.forward);
  }
}
