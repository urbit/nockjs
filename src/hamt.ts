import { Noun } from "./noun";

abstract class Slot {
  abstract insert(key: Noun, val: any, lef: number, rem: number): Slot;
  abstract get(key: Noun, lef: number, rem: number): any;
}
class Node extends Slot {
  slots: any[];
  constructor() {
    super();
    this.slots = Array(32);
  }

  insert(key: Noun, val: any, lef: number, rem: number): Node {
    lef -= 5;
    const inx = rem >>> lef;
    rem &= (1 << lef) - 1;
    this.slots[inx] =
      undefined === this.slots[inx]
        ? new Single(key, val)
        : this.slots[inx].insert(key, val, lef, rem);
    return this;
  }
  get(key: Noun, lef: number, rem: number) {
    lef -= 5;
    const inx = rem >>> lef;
    rem &= (1 << lef) - 1;
    const sot = this.slots[inx];

    return undefined === sot ? undefined : sot.get(key, lef, rem);
  }
}
class Bucket extends Slot {
  singles: Single[];
  constructor() {
    super();
    this.singles = [];
  }
  insert(key: Noun, val: any, lef: number, rem: number): Bucket {
    const a = this.singles;
    for (var i = 0; i < a.length; ++i) {
      const s = a[i];
      if (s.key.equals(key)) {
        s.val = val;
        return this;
      }
    }
    a.push(new Single(key, val));
    return this;
  }
  get(key: Noun) {
    const a = this.singles;
    for (var i = 0; i < a.length; ++i) {
      const s = a[i];
      if (s.key.equals(key)) {
        return s.val;
      }
    }
  }
}
class Single extends Slot {
  key: Noun;
  val: any;
  constructor(key: Noun, val: any) {
    super();
    this.key = key;
    this.val = val;
  }
  insert(key: Noun, val: any, lef: number, rem: number): Slot {
    if (this.key.equals(key)) {
      this.val = val;
      return this;
    } else {
      const rom = this.key.mug() & ((1 << lef) - 1);
      const n = lef > 0 ? new Node() : new Bucket();
      n.insert(this.key, this.val, lef, rom);
      n.insert(key, val, lef, rem);
      return n;
    }
  }
  get(key: Noun) {
    if (this.key.equals(key)) return this.val;
  }
}
class NounMap {
  slots: any[];
  constructor() {
    this.slots = Array(64);
  }
  insert(key: Noun, val: Noun): void {
    const m = key.mug();
    const inx = m >>> 25;
    const sot = this.slots;
    if (sot[inx] === undefined) sot[inx] = new Single(key, val);
    else {
      var rem = m & ((1 << 25) - 1);
      sot[inx] = sot[inx].insert(key, val, 25, rem);
    }
  }
  get(key: Noun) {
    const m = key.mug();
    const inx = m >>> 25;
    const sot = this.slots[inx];
    if (undefined === sot) {
      return undefined;
    } else {
      var rem = m & ((1 << 25) - 1);
      return sot.get(key, 25, rem);
    }
  }
}

export { NounMap };
