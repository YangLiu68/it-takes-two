// Keyboard + mouse (pointer lock) + gamepad + touch, merged into one input state.

const KEYS = {
  up: ['KeyW', 'ArrowUp'],
  down: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  jump: ['Space'],
  dash: ['ShiftLeft', 'ShiftRight'],
  // No Ctrl: Ctrl+W would close the tab mid-game.
  pound: ['KeyC', 'KeyQ'],
  ability: ['KeyE', 'KeyF'],
  wave: ['KeyG'],
};

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.down = new Set();
    this.pressed = new Set();
    this.mouseDX = 0;
    this.mouseDY = 0;
    this.wheel = 0;
    this.mouseButtons = 0;
    this.mousePressed = 0;
    this.locked = false;
    this.enabled = true;
    this.padIndex = -1;
    this.prevPad = {};
    this.usingPad = false;
    // Phones start in touch mode; any touch switches to it, a mouse or key back.
    this.usingTouch = window.matchMedia('(pointer: coarse)').matches;
    this.touch = null;
    window.addEventListener('pointerdown', (e) => {
      this.usingTouch = e.pointerType === 'touch';
    }, true);

    window.addEventListener('keydown', (e) => {
      if (e.target instanceof HTMLInputElement) return;
      if (!this.down.has(e.code)) this.pressed.add(e.code);
      this.down.add(e.code);
      this.usingPad = false;
      this.usingTouch = false;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => this.down.delete(e.code));
    window.addEventListener('blur', () => {
      this.down.clear();
      this.mouseButtons = 0;
    });
    canvas.addEventListener('mousedown', (e) => {
      this.mouseButtons |= 1 << e.button;
      this.mousePressed |= 1 << e.button;
    });
    window.addEventListener('mouseup', (e) => {
      this.mouseButtons &= ~(1 << e.button);
    });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('mousemove', (e) => {
      if (!this.locked) return;
      this.mouseDX += e.movementX;
      this.mouseDY += e.movementY;
    });
    canvas.addEventListener('wheel', (e) => {
      this.wheel += Math.sign(e.deltaY);
      e.preventDefault();
    }, { passive: false });
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === canvas;
    });
    window.addEventListener('gamepadconnected', (e) => {
      if (this.padIndex < 0) this.padIndex = e.gamepad.index;
    });
    window.addEventListener('gamepaddisconnected', (e) => {
      if (this.padIndex === e.gamepad.index) this.padIndex = -1;
    });
  }

  lock() {
    if (!this.locked && this.canvas.requestPointerLock) {
      try {
        const r = this.canvas.requestPointerLock({ unadjustedMovement: true });
        if (r && r.catch) r.catch(() => this.canvas.requestPointerLock());
      } catch {
        this.canvas.requestPointerLock();
      }
    }
  }

  unlock() {
    if (document.pointerLockElement) document.exitPointerLock();
  }

  any(list, set) {
    return list.some((k) => set.has(k));
  }

  pad() {
    if (!navigator.getGamepads) return null;
    const pads = navigator.getGamepads();
    if (this.padIndex >= 0 && pads[this.padIndex]) return pads[this.padIndex];
    for (const p of pads) if (p && p.connected) {
      this.padIndex = p.index;
      return p;
    }
    return null;
  }

  // Sample once per frame. Edge-triggered "pressed" flags reset after this.
  sample(settings) {
    const k = this.down;
    const p = this.pressed;
    const s = {
      mx: 0, my: 0, lookX: 0, lookY: 0, zoom: 0,
      jumpPressed: false, jumpHeld: false, dashPressed: false, poundPressed: false,
      abilityHeld: false, wavePressed: false, pausePressed: false, padLook: false,
    };
    if (this.enabled) {
      s.mx = (this.any(KEYS.right, k) ? 1 : 0) - (this.any(KEYS.left, k) ? 1 : 0);
      s.my = (this.any(KEYS.up, k) ? 1 : 0) - (this.any(KEYS.down, k) ? 1 : 0);
      s.jumpPressed = this.any(KEYS.jump, p);
      s.jumpHeld = this.any(KEYS.jump, k);
      s.dashPressed = this.any(KEYS.dash, p) || !!(this.mousePressed & 4);
      s.poundPressed = this.any(KEYS.pound, p);
      s.abilityHeld = this.any(KEYS.ability, k) || !!(this.mouseButtons & 1);
      s.wavePressed = this.any(KEYS.wave, p);
      const sens = 0.0022 * settings.sensitivity;
      s.lookX = this.mouseDX * sens;
      s.lookY = this.mouseDY * sens * (settings.invertY ? -1 : 1);
      s.zoom = this.wheel;

      const gp = this.pad();
      if (gp) {
        const dz = (v) => (Math.abs(v) < 0.15 ? 0 : (v - Math.sign(v) * 0.15) / 0.85);
        const ax = dz(gp.axes[0] || 0), ay = dz(gp.axes[1] || 0);
        const rx = dz(gp.axes[2] || 0), ry = dz(gp.axes[3] || 0);
        const btn = (i) => !!(gp.buttons[i] && gp.buttons[i].pressed);
        const was = (i) => !!this.prevPad[i];
        const press = (i) => btn(i) && !was(i);
        if (Math.abs(ax) + Math.abs(ay) + Math.abs(rx) + Math.abs(ry) > 0 || gp.buttons.some((b) => b.pressed)) this.usingPad = true;
        if (Math.abs(ax) + Math.abs(ay) > 0) {
          s.mx = ax;
          s.my = -ay;
        }
        if (rx || ry) {
          const r = 2.6 * settings.sensitivity;
          s.lookX += rx * r * (1 / 60);
          s.lookY += ry * r * (1 / 60) * (settings.invertY ? -1 : 1);
          s.padLook = true;
        }
        s.jumpPressed ||= press(0);
        s.jumpHeld ||= btn(0);
        s.poundPressed ||= press(1);
        s.dashPressed ||= press(2);
        s.abilityHeld ||= btn(5) || btn(7) || btn(3);
        s.wavePressed ||= press(12);
        s.pausePressed ||= press(9);
        this.prevPad = {};
        gp.buttons.forEach((b, i) => (this.prevPad[i] = b.pressed));
      }
    }
    if (this.touch) this.touch.apply(s, settings);
    // Test bots drive the game through the same input state.
    if (this.bot) this.bot.apply(s, settings);
    this.pressed.clear();
    this.mousePressed = 0;
    this.mouseDX = 0;
    this.mouseDY = 0;
    this.wheel = 0;
    return s;
  }
}
