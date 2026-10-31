// Toy Vault: plates, the toy train, split wings, the block picture, the
// jack-in-the-box lift, the timed race and the seesaw.
import { press, dialTo, actAt, launchTo, chain, untilTask } from './escape-lib.mjs';

export default async function ({ sol, luna, L, shot }) {
  const M = L.marks;
  const both = (fa, fb) => Promise.all([fa(sol), fb(luna)]);
  const item = (label) => L.items.find((i) => i.label === label);
  const swAt = (m) => L.switches.find((w) => Math.hypot(w.x - m[0], w.z - m[2]) < 0.1 && Math.abs(w.y - m[1]) < 0.1);

  // 0 · Both plates.
  await both((b) => b.go(M.p0a[0], M.p0a[2], { r: 0.3, stop: true }), (b) => b.go(M.p0b[0], M.p0b[2], { r: 0.3, stop: true }));
  const door0 = L.acts.find((a) => a.toast === 'The big door is open!');
  await sol.waitAct(door0.id, 6000);

  // 1 · The train: Sol rides first while Luna drives.
  const train = L.acts.find((a) => a.style === 'carrier');
  await both((b) => b.path([[-0.8, 13], [-0.8, 16], [0, M.trainNear[2]]], { r: 0.4 }), (b) => b.path([[0.8, 13], [0.8, 16], [M.trainA[0], M.trainA[2]]], { r: 0.4 }));
  await sol.go(0, M.trainNear[2], { r: 0.3, stop: true });
  await luna.go(M.trainA[0], M.trainA[2], { r: 0.3, stop: true });
  await actAt(sol, train.id, 1);
  await sol.go(0, 38, { r: 0.4 });
  // Luna's turn: off the plate, the train comes back; Sol drives it over again.
  await luna.go(-3, 17.5, { r: 0.4 });
  await actAt(luna, train.id, 0);
  await luna.go(0, M.trainNear[2], { r: 0.3, stop: true });
  await sol.go(M.trainB[0], M.trainB[2], { r: 0.3, stop: true });
  await actAt(luna, train.id, 1);
  await luna.go(0, 38, { r: 0.4 });
  await shot('train');
  await press(sol, swAt([-6, 0, 40.5]), [1, 0]);
  const door1 = L.acts.find((a) => a.style === 'door' && Math.abs(a.parts[0].z - 44) < 0.3);
  await sol.waitAct(door1.id, 6000);

  // 2 · Split wings.
  await both((b) => b.path([[-1, 43], [-1, 47], [-4, 51], [-12, 51], [-17, 53]]), (b) => b.path([[1, 43], [1, 47], [4, 51], [10.5, 51], [M.lunaPlate[0], M.lunaPlate[2]]]));
  await luna.go(M.lunaPlate[0], M.lunaPlate[2], { r: 0.3, stop: true });
  await sol.path([[-20, 55], [-20, 60], [M.solPad[0], M.solPad[2]]], { r: 0.3 });
  const red = item('Red key half');
  await launchTo(sol, { x: M.solPad[0], z: M.solPad[2] }, [red.x, red.y - 0.6, red.z]);
  await sol.go(red.x, red.z, { r: 0.5, timeout: 6000 });
  await sol.waitHold(red.id);
  await shot('red-half', sol.page);
  await sol.path([[-22, 64.5], [-20, 61], [-20, 55], [-12, 51], [-4, 51]]);
  // Luna presses the colors in the order on Sol's wall.
  const code = L.seqs[0];
  for (const id of code.ids) await press(luna, L.switches.find((w) => w.id === id), [0, -1]);
  await luna.waitSig(code.id, 5000);
  const blue = item('Blue key half');
  await luna.path([[20, 55], [20, 60], [blue.x, blue.z]]);
  await luna.waitHold(blue.id);
  await luna.path([[20, 55], [12, 51], [4, 51], [1, 54.2]]);
  await sol.go(-1, 54.2);
  await luna.waitSig(L.locks.find((l) => l.label === 'Vault lock').id, 6000);
  await shot('vault-open');

  // 3 · Block picture: Luna reads the counts, Sol turns the wheels.
  await both((b) => b.path([[-1, 57], [-1, 61], [-4, 63], [-4, 67]]), (b) => b.path([[1, 57], [1, 61], [4, 63], [4, 69]]));
  await shot('picture', luna.page);
  const combo = L.combos[0];
  for (let i = 0; i < 3; i++) await dialTo(sol, L.dials.find((d) => d.id === combo.dials[i]), combo.targets[i]);
  await sol.waitSig(combo.id, 4000);
  const wind = item('Wind-up key');
  await sol.go(-4, 77.7, { r: 0.3 });
  await sol.waitHold(wind.id);

  // 4 · Jack-in-the-box: the key opens the box, then take turns on the lift.
  await both((b) => b.path([[-4, 79], [-4, 83], [0.8, 90.6]], { r: 0.3 }), (b) => b.path([[4, 79], [4, 83], [5.5, 86]], { r: 0.4 }));
  await sol.waitUsed(wind.id);
  const jackDoor = L.acts.find((a) => a.toast === 'The jack-in-the-box pops open!');
  await sol.waitAct(jackDoor.id, 6000);
  const lift = L.acts.find((a) => a.style === 'lift');
  await sol.path([[0, 92], [-4, 92], [-6, 95], [M.lift[0], M.lift[2]]], { r: 0.35 });
  await sol.go(M.lift[0], M.lift[2], { r: 0.3, stop: true });
  await luna.path([[1, 92], [-4, 91.5], [M.liftLow[0], M.liftLow[2]]], { r: 0.35 });
  await luna.go(M.liftLow[0], M.liftLow[2], { r: 0.3, stop: true });
  await actAt(sol, lift.id, 1);
  await sol.go(-3, 100.5, { r: 0.4 });
  await luna.go(-3, 89, { r: 0.4 });
  await actAt(luna, lift.id, 0);
  await luna.path([[-4, 92], [-6, 95], [M.lift[0], M.lift[2]]], { r: 0.35 });
  await luna.go(M.lift[0], M.lift[2], { r: 0.3, stop: true });
  await sol.go(M.liftTop[0], M.liftTop[2], { r: 0.3, stop: true });
  await actAt(luna, lift.id, 1);
  await luna.go(0, 102.5, { r: 0.4 });
  await shot('ledge');

  // 5 · Timed race: Sol runs out to the far button, Luna runs the course.
  const S1 = swAt(M.S1), S2 = swAt(M.S2);
  await sol.path([[2, 101], [9, 101], [38, 101]], { r: 0.5 });
  await luna.go(0, 102.8, { r: 0.3, stop: true });
  const course = [M.course0, M.course1, M.course2];
  await Promise.all([press(sol, S1, [-1, 0]), chain(luna, [
    untilTask((g, b, id) => g.world.sig(id), S1.id, 6000),
    { type: 'go', x: 0, z: 107.2, r: 0.6 },
    { type: 'jump', to: [0, 6, course[1][2]] },
    { type: 'go', x: 0, z: 113.3, r: 0.6 },
    { type: 'jump', to: [0, 6, course[2][2]] },
    { type: 'go', x: 0, z: 122, r: 0.6 },
  ])]);
  await press(luna, S2, [0, -1]);
  await luna.waitSig(S2.id, 4000);
  // Sol comes back the slow way.
  await sol.path([[38, 101], [9, 101], [0, 103]], { r: 0.5 });
  await sol.go(0, 107.2, { r: 0.5 });
  await sol.jump({ to: [0, 6, course[1][2]] });
  await sol.go(0, 113.3, { r: 0.5 });
  await sol.jump({ to: [0, 6, course[2][2]] });
  await sol.go(0, 125, { r: 0.6 });

  // 6 · Seesaw: Luna stands on one end, Sol pounds the other.
  const e = L.seesaws[0];
  await both((b) => b.go(e.x + 3.4, e.z - 2.4, { r: 0.4 }), (b) => b.path([[-2, 125], [e.x - 3.4, e.z - 2.4]], { r: 0.4 }));
  await luna.jump({ to: [e.x - 3.4, e.y, e.z] });
  await luna.go(e.x - 3.4, e.z, { r: 0.3, stop: true, hop: false });
  await sol.jump({ to: [e.x + 3.4, e.y, e.z] });
  await sol.go(e.x + 3.4, e.z, { r: 0.3, stop: true, hop: false });
  await sol.pound();
  const top = L.switches.find((w) => w.latch && w.y > e.y + 5);
  await luna.go(top.x, top.z, { r: 0.4, timeout: 8000 });
  await luna.until((g, b, y) => g.player.pos.y > y - 0.5 && g.player.grounded, top.y, 6000);
  await press(luna, top, [1, 0]);
  const steps = L.acts.find((a) => a.style === 'steps');
  await sol.waitAct(steps.id, 5000);
  const first = steps.parts[0];
  await sol.go(first.x, first.z + first.move[2] - 1.7, { r: 0.4 });
  for (const p of steps.parts) await sol.jump({ to: [p.x + p.move[0], p.y + p.sy / 2, p.z + p.move[2]], double: true });
  await sol.jump({ to: [top.x, top.y, top.z + 1], double: true });
  await shot('treasure');
  const goal = L.goal;
  await luna.go(goal.x + 1.5, goal.z);
  await sol.go(goal.x - 1.5, goal.z);
}
