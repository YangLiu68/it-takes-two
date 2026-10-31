// Movement tuning shared by the character controller and the level generator.
// The generator sizes gaps and ledges from these numbers, so changing them
// changes what is reachable.

export const PHYS = {
  gravity: 34,
  fallGravityMul: 1.15,
  jumpCutGravityMul: 2.4,
  maxFall: 42,

  jumpVel: 12.4, // ~2.26 m
  doubleJumpVel: 11.2, // +1.84 m
  runSpeed: 8.5,
  groundAccel: 70,
  groundDecel: 60,
  airAccel: 30,
  airDrag: 2.5,

  dashSpeed: 19,
  dashTime: 0.17,
  dashCooldown: 0.3,

  poundHang: 0.16,
  poundSpeed: 34,
  poundRecover: 0.2,

  radius: 0.42,
  height: 1.55,
  stepUp: 0.38,
  coyote: 0.12,
  jumpBuffer: 0.14,

  repelSpeed: 24, // ~8.5 m launch
  attractSpeed: 21,
  magnetRange: 13,
  bondRange: 20,
  bondSpeed: 21,

  bounceVel: 19, // ~5.3 m
  bouncePoundVel: 25, // ~9.2 m
  seesawVel: 28.5, // ~11.9 m
};

export const CHARACTERS = [
  { key: 'sol', name: 'Sol', polarity: 1, color: '#ff6b4a', accent: '#ffd166', css: 'var(--sol)' },
  { key: 'luna', name: 'Luna', polarity: -1, color: '#4f86ff', accent: '#9be7ff', css: 'var(--luna)' },
];

// Max horizontal distance covered by jump + double jump when landing dy higher.
export function jumpReach(dy) {
  const g = PHYS.gravity;
  const v1 = PHYS.jumpVel;
  const v2 = PHYS.doubleJumpVel;
  const h = (v1 * v1) / (2 * g) + (v2 * v2) / (2 * g);
  if (dy > h - 0.3) return 0;
  const t = v1 / g + v2 / g + Math.sqrt((2 * (h - dy)) / (g * PHYS.fallGravityMul));
  return PHYS.runSpeed * t;
}

// Longest gap anyone can clear: jump + double jump + air dash, plus standing a
// radius past each edge and a margin for integration error (see physics test).
export const MAX_GAP = jumpReach(0) + PHYS.dashSpeed * PHYS.dashTime + 2 * PHYS.radius + 0.6;

// Analytic apex plus a small margin for the fixed-step integrator.
export const MAX_JUMP_HEIGHT =
  (PHYS.jumpVel * PHYS.jumpVel) / (2 * PHYS.gravity) +
  (PHYS.doubleJumpVel * PHYS.doubleJumpVel) / (2 * PHYS.gravity) +
  0.15;

// Standing on the partner's head adds their height.
export const MAX_BOOST_HEIGHT = MAX_JUMP_HEIGHT + PHYS.height;
