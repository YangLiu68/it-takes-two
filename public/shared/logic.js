// Puzzle logic evaluated by the server, the single source of truth for which
// doors, bridges and lifts are active. Clients report only facts about their own
// player (I'm on plate p, I pounded switch w); the server combines them.

export class PuzzleState {
  constructor(level) {
    this.level = level;
    this.signalDefs = new Map(level.signals.map((s) => [s.id, s]));
    this.plateOccupants = new Map(); // plate id -> Set(slot)
    this.poundUntil = new Map(); // switch id -> ms timestamp
    this.latchedSignals = new Set();
    this.latchedActs = new Set();
    this.signals = {};
    this.acts = {};
    for (const s of level.signals) this.signals[s.id] = 0;
    for (const a of level.acts) this.acts[a.id] = 0;
    // Carried items: holder is a slot, or -1 when it rests at home.
    this.items = new Map((level.items || []).map((it) => [it.id, { def: it, holder: -1, used: false }]));
    this.locks = new Map((level.locks || []).map((l) => [l.id, { def: l, got: new Set() }]));
    this.seqs = new Map((level.seqs || []).map((q) => [q.id, { def: q, n: 0 }]));
    // Dials: current value index; combos watch a set of them.
    this.dials = new Map((level.dials || []).map((d) => [d.id, { def: d, v: d.start || 0 }]));
    this.combos = new Map((level.combos || []).map((c) => [c.id, c]));
    // Rising lava / water: t0 = server ms when it started rising (0 = not yet).
    // ps = server ms when a `hold` signal paused it (0 = not paused).
    this.floods = new Map((level.zones || []).filter((z) => z.kind === 'flood').map((z) => [z.id, { def: z, t0: 0, off: false, ps: 0 }]));
    this.seqOf = new Map();
    for (const q of level.seqs || []) for (const id of q.ids) this.seqOf.set(id, q.id);
    this.dirty = false;
  }

  setPlate(slot, plateId, on) {
    if (!this.signalDefs.has(plateId)) return;
    let set = this.plateOccupants.get(plateId);
    if (!set) this.plateOccupants.set(plateId, (set = new Set()));
    if (on) set.add(slot);
    else set.delete(slot);
  }

  clearSlot(slot) {
    for (const set of this.plateOccupants.values()) set.delete(slot);
  }

  pound(switchId, now) {
    const def = this.signalDefs.get(switchId);
    if (def && def.kind === 'dial') return this.turn(switchId);
    if (!def || def.kind !== 'switch') return null;
    if (def.latch) this.latchedSignals.add(switchId);
    else this.poundUntil.set(switchId, now + def.duration * 1000);
    // Order puzzles: the right next switch advances, anything else starts over.
    const qid = this.seqOf.get(switchId);
    if (!qid || this.latchedSignals.has(qid)) return null;
    const q = this.seqs.get(qid);
    const ids = q.def.ids;
    if (ids[q.n] === switchId) q.n++;
    else q.n = ids[0] === switchId ? 1 : 0;
    if (q.n === ids.length) this.latchedSignals.add(qid);
    this.dirty = true;
    return { seq: qid, n: q.n, ok: q.n > 0 };
  }

  // Pounding a dial turns it (and any dials linked to it) one step.
  turn(id) {
    const d = this.dials.get(id);
    if (!d) return null;
    for (const k of [id, ...d.def.links]) {
      const e = this.dials.get(k);
      if (e) e.v = (e.v + 1) % e.def.values.length;
    }
    this.dirty = true;
    return { dial: id, v: d.v };
  }

  // Floods without a start signal rise from the level start.
  startFloods(now) {
    for (const f of this.floods.values()) if (!f.def.when) f.t0 = now;
    if (this.floods.size) this.dirty = true;
  }

  // Someone fell or got caught: the flood drops back and starts again shortly.
  resetFloods(now) {
    for (const f of this.floods.values()) {
      if (f.t0 > 0 && !f.off) {
        f.t0 = now + (f.def.grace ?? 2.5) * 1000;
        if (f.ps) f.ps = f.t0;
        this.dirty = true;
      }
    }
  }

  // Someone walked into a trigger zone.
  zone(id) {
    const def = this.signalDefs.get(id);
    if (!def || def.kind !== 'zone' || this.latchedSignals.has(id)) return false;
    this.latchedSignals.add(id);
    return true;
  }

  // Pick up an item (swapping out whatever this player already carries).
  take(slot, id) {
    const it = this.items.get(id);
    if (!it || it.used || it.holder !== -1) return false;
    if (it.def.who !== null && it.def.who !== slot) return false;
    if (it.def.when && this.signals[it.def.when] !== 1) return false;
    this.dropSlot(slot);
    it.holder = slot;
    this.dirty = true;
    return true;
  }

  // Put a carried item into a lock. Returns the item id used, or null.
  use(slot, lockId) {
    const l = this.locks.get(lockId);
    if (!l) return null;
    for (const id of l.def.accepts) {
      const it = this.items.get(id);
      if (!it || it.holder !== slot || l.got.has(id)) continue;
      it.holder = -1;
      it.used = true;
      l.got.add(id);
      if (l.got.size === l.def.accepts.length) this.latchedSignals.add(lockId);
      this.dirty = true;
      return id;
    }
    return null;
  }

  // A player fell or left: what they carried goes back where it was found.
  dropSlot(slot) {
    for (const it of this.items.values()) {
      if (it.holder === slot) {
        it.holder = -1;
        this.dirty = true;
      }
    }
  }

  held(slot) {
    for (const [id, it] of this.items) if (it.holder === slot) return id;
    return null;
  }

  // Items already put into locks (for saving).
  usedItems() {
    return [...this.items.entries()].filter(([, it]) => it.used).map(([id]) => id);
  }

  restoreUsed(ids) {
    for (const id of ids) {
      const it = this.items.get(id);
      if (!it) continue;
      it.used = true;
      for (const l of this.locks.values()) if (l.def.accepts.includes(id)) l.got.add(id);
    }
  }

  // Recompute everything. Returns true when anything visible changed.
  evaluate(now) {
    let changed = false;
    for (const def of this.level.signals) {
      let on = 0;
      if (def.kind === 'plate') {
        const set = this.plateOccupants.get(def.id);
        on = set && set.size > 0 ? 1 : 0;
      } else if (def.kind === 'combo' && !this.latchedSignals.has(def.id)) {
        const c = this.combos.get(def.id);
        on = c.dials.every((d, i) => this.dials.get(d)?.v === c.targets[i]) ? 1 : 0;
        if (on && c.latch) this.latchedSignals.add(def.id);
      } else if (this.latchedSignals.has(def.id)) {
        on = 1;
      } else {
        on = (this.poundUntil.get(def.id) || 0) > now ? 1 : 0;
      }
      if (this.signals[def.id] !== on) {
        this.signals[def.id] = on;
        changed = true;
      }
    }
    for (const a of this.level.acts) {
      let on;
      if (this.latchedActs.has(a.id)) {
        on = 1;
      } else {
        const vals = a.when.in.map((id) => this.signals[id] === 1);
        on = (a.when.op === 'all' ? vals.every(Boolean) : vals.some(Boolean)) ? 1 : 0;
        if (on && a.latch) this.latchedActs.add(a.id);
      }
      if (this.acts[a.id] !== on) {
        this.acts[a.id] = on;
        changed = true;
      }
    }
    for (const f of this.floods.values()) {
      if (!f.t0 && !f.off && f.def.when && this.signals[f.def.when] === 1) {
        f.t0 = now;
        changed = true;
      }
      if (!f.off && f.def.until && this.signals[f.def.until] === 1) {
        f.off = true;
        changed = true;
      }
      // While its `hold` signal is on, it stops rising.
      if (f.def.hold && f.t0 > 0 && !f.off) {
        const held = [].concat(f.def.hold).some((h) => this.signals[h] === 1);
        if (held && !f.ps) {
          f.ps = Math.max(now, f.t0);
          changed = true;
        } else if (!held && f.ps) {
          f.t0 += Math.max(0, now - f.ps);
          f.ps = 0;
          changed = true;
        }
      }
    }
    if (this.dirty) {
      this.dirty = false;
      changed = true;
    }
    return changed;
  }

  snapshot() {
    const snap = { sig: { ...this.signals }, act: { ...this.acts } };
    if (this.items.size) {
      snap.items = {};
      for (const [id, it] of this.items) snap.items[id] = [it.holder, it.used ? 1 : 0];
    }
    if (this.seqs.size) {
      snap.seq = {};
      for (const [id, q] of this.seqs) snap.seq[id] = this.latchedSignals.has(id) ? q.def.ids.length : q.n;
    }
    if (this.floods.size) {
      snap.fl = {};
      for (const [id, f] of this.floods) snap.fl[id] = f.off ? -1 : f.t0;
      if ([...this.floods.values()].some((f) => f.def.hold)) {
        snap.fp = {};
        for (const [id, f] of this.floods) if (f.def.hold) snap.fp[id] = f.ps;
      }
    }
    if (this.dials.size) {
      snap.dl = {};
      for (const [id, d] of this.dials) snap.dl[id] = d.v;
    }
    if (this.locks.size) {
      snap.lk = {};
      for (const [id, l] of this.locks) snap.lk[id] = l.got.size;
    }
    return snap;
  }
}
