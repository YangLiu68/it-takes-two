// On-screen controls for phones: a floating joystick under the left thumb,
// drag anywhere else to turn the camera, action buttons under the right thumb.
// Feeds the same input state as the keyboard and gamepad.

const STICK_RADIUS = 56;

// Hints and signs name keyboard keys as standalone words: Space (jump),
// Shift (dash), C (ground pound) and E (magnet). On a phone, name the
// on-screen buttons instead: "Press C to ground pound" -> "Tap POUND to
// ground pound". Space and Shift are swapped wherever they stand alone (but
// not in names like "Space Station"); the single letters only where they
// clearly mean a key ("hold E", "(C)", "C to pound"), so map squares, parcel
// letters and compass points stay as they are.
const BUTTONS = { Space: 'JUMP', Shift: 'DASH', C: 'POUND', E: 'MAGNET' };
const TAP = { Press: 'Tap', press: 'tap', Presses: 'Taps', presses: 'taps', Pressing: 'Tapping', pressing: 'tapping' };
const KEY = '(Space|Shift|C|E)';
const VERB = '([Pp]ress(?:es|ing)?|[Hh]old(?:s|ing)?|[Tt]ap(?:s|ping)?|[Rr]eleases?|[Ll]ets? go of|[Uu]ses?|[Hh]its?|[Mm]ash(?:es)?|[Kk]eeps? holding|[Ww]ith)';
const AFTER = '\\s+(?:to|again|twice|in mid-?air|in the air)\\b|:\\s*(?:[Jj]ump|[Dd]ouble|[Dd]ash|[Gg]round|[Pp]ound|[Ss]lam|[Mm]agnet|[Pp]ull|[Pp]ush|[Cc]all)';
const BY_VERB = new RegExp(`\\b${VERB}(\\s+)${KEY}\\b`, 'g');
const IN_PARENS = new RegExp(`\\(${KEY}\\)`, 'g');
const LEADING = new RegExp(`(^|\\n|[.!?] +)${KEY}(?=${AFTER})`, 'g');
const WORD_KEY = /(?<!\b(?:Night|Day|Late|Early|Outer|Deep|Open) )\b(Space|Shift)\b(?! +[A-Z][a-z])/g;
const CHAIN = /\b(JUMP|DASH|POUND|MAGNET)([ \t]*[+,/][ \t]*|[ \t]+)((?:then|and|or)[ \t]+)?(C|E)\b/g;
const ECHO = /\b(jump|dash|pound|magnet)(\w*)\s*\((JUMP|DASH|POUND|MAGNET)\)/gi;

export function touchText(text) {
  let t = String(text)
    .replace(/\b(?:the )?Space ?bar\b/g, 'Space')
    .replace(BY_VERB, (m, verb, gap, k) => `${TAP[verb] || verb}${gap}${BUTTONS[k]}`)
    .replace(IN_PARENS, (m, k) => `(${BUTTONS[k]})`)
    .replace(LEADING, (m, start, k) => `${start}${BUTTONS[k]}`)
    .replace(WORD_KEY, (k) => BUTTONS[k]);
  // "Space, then C", "Shift + E": a letter right after a button is a key too.
  for (let prev = ''; prev !== t; ) {
    prev = t;
    t = t.replace(CHAIN, (m, b, link, word = '', k) => `${b}${link}${word}${BUTTONS[k]}`);
  }
  // "ground pound (POUND)" says the same thing twice.
  return t.replace(ECHO, (m, word, rest, b) => (word.toUpperCase() === b ? `${word}${rest}` : m));
}
const LOOK_SENS = 0.006; // radians per CSS pixel at sensitivity 1

export class TouchControls {
  constructor(root, { onPause }) {
    this.root = root;
    this.stickEl = root.querySelector('.t-stick');
    this.knobEl = root.querySelector('.t-knob');
    this.mx = 0;
    this.my = 0;
    this.lookDX = 0;
    this.lookDY = 0;
    this.held = new Set();
    this.pressed = new Set();
    this.stickId = null;
    this.lookId = null;
    this.visible = false;
    this.onPause = onPause;

    root.addEventListener('pointerdown', (e) => this.down(e));
    root.addEventListener('pointermove', (e) => this.move(e));
    for (const t of ['pointerup', 'pointercancel', 'lostpointercapture']) root.addEventListener(t, (e) => this.up(e));
    // No long-press menus, text selection or double-tap zoom on the controls.
    root.addEventListener('contextmenu', (e) => e.preventDefault());
    root.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
  }

  setVisible(v) {
    if (v === this.visible) return;
    this.visible = v;
    this.root.hidden = !v;
    if (!v) this.reset();
  }

  reset() {
    this.held.clear();
    this.stickId = this.lookId = null;
    this.mx = this.my = 0;
    this.knobEl.style.transform = '';
    this.stickEl.style.left = this.stickEl.style.top = '';
    this.stickEl.classList.remove('on');
    for (const b of this.root.querySelectorAll('.t-btn.on')) b.classList.remove('on');
  }

  down(e) {
    const btn = e.target.closest('[data-act]');
    if (btn) {
      const act = btn.dataset.act;
      if (act === 'pause') {
        this.onPause();
        return;
      }
      btn.setPointerCapture(e.pointerId);
      btn.dataset.pid = String(e.pointerId);
      btn.classList.add('on');
      this.held.add(act);
      this.pressed.add(act);
      return;
    }
    this.root.setPointerCapture(e.pointerId);
    if (e.clientX < window.innerWidth * 0.45 && this.stickId === null) {
      this.stickId = e.pointerId;
      // The stick appears where the thumb lands, kept clear of the screen edge.
      const r = STICK_RADIUS + 12;
      this.bx = Math.max(r, Math.min(window.innerWidth - r, e.clientX));
      this.by = Math.max(r, Math.min(window.innerHeight - r, e.clientY));
      this.stickEl.style.left = `${this.bx}px`;
      this.stickEl.style.top = `${this.by}px`;
      this.stickEl.classList.add('on');
      this.moveStick(e.clientX, e.clientY);
    } else if (this.lookId === null) {
      this.lookId = e.pointerId;
      this.lx = e.clientX;
      this.ly = e.clientY;
    }
  }

  move(e) {
    if (e.pointerId === this.stickId) this.moveStick(e.clientX, e.clientY);
    else if (e.pointerId === this.lookId) {
      this.lookDX += e.clientX - this.lx;
      this.lookDY += e.clientY - this.ly;
      this.lx = e.clientX;
      this.ly = e.clientY;
    }
  }

  moveStick(x, y) {
    let dx = (x - this.bx) / STICK_RADIUS;
    let dy = (y - this.by) / STICK_RADIUS;
    const len = Math.hypot(dx, dy);
    if (len > 1) {
      dx /= len;
      dy /= len;
    }
    // Small dead zone so resting a thumb on the stick doesn't drift.
    const live = Math.hypot(dx, dy) > 0.12;
    this.mx = live ? dx : 0;
    this.my = live ? -dy : 0;
    this.knobEl.style.transform = `translate(${dx * STICK_RADIUS}px, ${dy * STICK_RADIUS}px)`;
  }

  up(e) {
    const btn = e.target.closest && e.target.closest('[data-act]');
    if (btn && btn.dataset.pid === String(e.pointerId)) {
      btn.classList.remove('on');
      this.held.delete(btn.dataset.act);
      delete btn.dataset.pid;
      return;
    }
    if (e.pointerId === this.stickId) {
      this.stickId = null;
      this.mx = this.my = 0;
      this.knobEl.style.transform = '';
      this.stickEl.style.left = this.stickEl.style.top = '';
      this.stickEl.classList.remove('on');
    } else if (e.pointerId === this.lookId) {
      this.lookId = null;
    }
  }

  // Merge into a sampled input state, then clear the per-frame values.
  apply(s, settings) {
    if (this.visible) {
      if (this.mx || this.my) {
        s.mx = this.mx;
        s.my = this.my;
      }
      const sens = LOOK_SENS * settings.sensitivity;
      s.lookX += this.lookDX * sens;
      s.lookY += this.lookDY * sens * (settings.invertY ? -1 : 1);
      s.jumpPressed ||= this.pressed.has('jump');
      s.jumpHeld ||= this.held.has('jump');
      s.dashPressed ||= this.pressed.has('dash');
      s.poundPressed ||= this.pressed.has('pound');
      s.abilityHeld ||= this.held.has('ability');
    }
    this.pressed.clear();
    this.lookDX = this.lookDY = 0;
  }
}
