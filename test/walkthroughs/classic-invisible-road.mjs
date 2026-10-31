// Level 13 · Invisible Road: eye plates, two lanes, the flash switch, the invisible maze, the hidden stairs.
import { hop, hops, stand, poundAt, marks } from './ch3-lib.mjs';

export default async function ({ sol, luna, L, shot }) {
  const M = L.marks;
  const bridges = L.acts.filter((a) => a.style === 'bridge');
  const plate = (x, z) => L.plates.find((p) => Math.abs(p.x - x) < 0.1 && Math.abs(p.z - z) < 0.1);

  // 1. Luna sees, Sol jumps the invisible stones.
  await stand(luna, -3.5, 2.5);
  await sol.go(1, 4.2, { r: 0.3 });
  await hops(sol, marks(M, 's1-'));
  await hop(sol, [1, 0, 29.6]);
  await shot('s1');
  await poundAt(sol, M.back1[0], M.back1[2]);
  await luna.waitAct(bridges[0].id, 6000);
  await luna.path([[-5.3, 4.5], [-5.3, 28.5], [-2, 31]]);

  // 2. Two lanes: Luna watches the left for Sol, then Sol watches the right for Luna.
  await stand(luna, 2.5, 33);
  const A = marks(M, 'A');
  await sol.go(A[0][0], 34.6, { r: 0.3 });
  await hops(sol, A);
  await hop(sol, [A[A.length - 1][0], 0, 66]);
  await stand(sol, -4, 67.5);
  const B = marks(M, 'B');
  await luna.go(B[0][0], 34.6, { r: 0.3 });
  await hops(luna, B);
  await hop(luna, [B[B.length - 1][0], 0, 66]);
  await shot('s2');

  // 3. Flash: Luna pounds the switch, Sol runs the path from memory.
  await luna.go(-3, 69, { r: 0.4 });
  await poundAt(luna, -5.5, 69.5);
  await sol.go(0, 72.6, { r: 0.3 });
  await hops(sol, marks(M, 'm'));
  await hop(sol, [0, 0, 106]);
  await poundAt(sol, M.back3[0], M.back3[2]);
  await luna.waitAct(bridges[1].id, 6000);
  await luna.path([[0, 71], [7.5, 71.5], [7.5, 105.5], [3, 107.5]]);
  await shot('s3');

  // 4. The maze: Luna climbs the lookout and watches; Sol walks to the button.
  await luna.go(-6.1, 108.6, { r: 0.3 });
  await hop(luna, M.tower0);
  await hop(luna, M.tower1);
  await hop(luna, M.tower2, { r: 0.3 });
  await stand(luna, M.tower2[0], M.tower2[2]);
  await sol.go(0, 110.5, { r: 0.3 });
  const into = marks(M, 'in');
  await sol.path(into.map((p) => [p[0], p[2]]), { r: 0.35 });
  await shot('maze', luna.page);
  const last = into[into.length - 1];
  await poundAt(sol, last[0], last[2]);
  const door = L.acts.find((a) => a.style === 'door');
  await sol.waitAct(door.id, 6000);
  await sol.path(marks(M, 'out').map((p) => [p[0], p[2]]), { r: 0.35 });
  await sol.path([[0, 137.5], [-1, 139]]);
  // Luna comes down and follows (the walls show now).
  await luna.go(-11.6, 108.4, { r: 0.5, timeout: 6000 });
  await luna.path([[-6, 108.5], [0, 110.5]]);
  await luna.path(marks(M, 'thru').map((p) => [p[0], p[2]]), { r: 0.35 });
  await luna.path([[0, 137.5], [2, 139.5]]);

  // 5. The invisible stairs: Luna watches from below, then Sol from the top.
  const eyeLow = L.plates[L.plates.length - 2];
  const eyeTop = L.plates[L.plates.length - 1];
  await stand(luna, eyeLow.x, eyeLow.z);
  const up = marks(M, 'up');
  await sol.go(up[0][0], up[0][2] - 1.9, { r: 0.3 });
  for (const [i, p] of up.entries()) await hop(sol, p, { r: 0.3, settle: i !== 1 && i !== 4 && i !== 0 && i !== 3 });
  await sol.go(-1.5, 155.5, { r: 0.4 });
  await stand(sol, eyeTop.x, eyeTop.z);
  await shot('s5');
  await luna.wait(3500); // the vanished steps grow back
  await luna.go(up[0][0], up[0][2] - 1.9, { r: 0.3 });
  for (const [i, p] of up.entries()) await hop(luna, p, { r: 0.3, settle: i !== 1 && i !== 4 && i !== 0 && i !== 3 });
  await luna.go(-1.5, 155.5, { r: 0.4 });
  const g = L.goal;
  await luna.go(g.x + 1.4, g.z, { r: 0.5 });
  await sol.go(g.x - 1.4, g.z, { r: 0.5 });
  void plate;
}
