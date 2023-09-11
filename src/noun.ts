import {
  bigIntFromStringWithRadix,
  bigIntToByteArray,
  bitLength,
  testBit,
} from "./bigint.js";

// Mug functions

export function _mug_fnv(has_w: number): number {
  return Math.imul(has_w, 16777619);
}

export function _mug_out(has_w: number): number {
  return (has_w >>> 31) ^ (has_w & 0x7fffffff);
}

export function _mug_both(lef_w: number, rit_w: number): number {
  var bot_w = _mug_fnv(lef_w ^ _mug_fnv(rit_w));
  var out_w = _mug_out(bot_w);

  if (0 != out_w) {
    return out_w;
  } else {
    return _mug_both(lef_w, ++rit_w);
  }
}

// Helpers

export const fragCache: Record<string, Function> = {
  "0": function (a: any) {
    throw new Error("Bail");
  },
  "1": function (a: any) {
    return a;
  },
};

// Classes
class Atom {
  private _mug = 0;
  public deep = false;
  constructor(public number: bigint) {}

  // common methods with Cell
  pretty(out: string[], hasTail = false): void {
    if (this.number < 65536n) out.push(this.number.toString(10));
    else {
      let tap: string[] = [],
        isTa = true,
        isTas = true,
        bytes = bigIntToByteArray(this.number);
      for (let i = bytes.length - 1; i >= 0; --i) {
        const c = bytes[i];
        if (isTa && (c < 32 || c < 127)) {
          isTa = false;
          isTas = false;
          break;
        } else if (
          isTas &&
          !((c > 47 && c < 58) || (c > 96 && c < 123) || c === 45)
        )
          isTas = false;
        tap.push(String.fromCharCode(c));
      }
      if (isTas) {
        out.push("%");
        out.push.apply(out, tap);
      } else if (isTa) {
        out.push("'");
        out.push.apply(out, tap);
        out.push("'");
      } else {
        out.push("0x");
        out.push(this.number.toString(16));
      }
    }
  }
  toString(): string {
    const parts: string[] = [];
    this.pretty(parts, false);
    return parts.join("");
  }
  equals(o: Noun): boolean {
    return o instanceof Atom && o.number === this.number;
  }
  loob(): boolean {
    if (Number(this.number) === 0) return true;
    if (Number(this.number) === 1) return false;
    else throw new Error("Bail");
  }
  mug(): number {
    if (this._mug === 0) this._mug = this.calculateMug();
    return this._mug;
  }
  calculateMug(): number {
    const a = bigIntToByteArray(this.number);
    let b: number, c: number, d: number, e: number, f: number, bot: number;
    for (e = a.length - 1, b = 2166136261 | 0; ; ++b) {
      c = b;
      bot = 0 === a[0] ? 1 : 0;
      for (d = e; d >= bot; --d) {
        c = _mug_fnv(c ^ (0xff & a[d]));
      }
      f = _mug_out(c);
      if (0 !== f) return f;
    }
  }
  mugged(): boolean {
    return this._mug !== 0;
  }
  at(a: Atom) {
    return Atom.fragmenter(a)(this);
  }
  // Atom specific methods
  bump(): Atom {
    return new Atom(this.number + 1n);
  }
  bytes() {
    const bytes = bigIntToByteArray(this.number);
    const r: number[] = [];
    for (var i = bytes.length - 1; i >= 0; --i) {
      r.push(bytes[i] & 0xff);
    }
    return r;
  }
  cap(): Atom {
    if (Number(this.number) === 0) throw new Error("Bail");
    if (Number(this.number) === 1) throw new Error("Bail");
    else
      return testBit(this.number, bitLength(this.number) - 2)
        ? new Atom(3n)
        : new Atom(2n);
  }
  mas(): Atom {
    if (Number(this.number) === 0) throw new Error("Bail");
    if (Number(this.number) === 1) throw new Error("Bail");
    if (Number(this.number) === 2) return new Atom(1n);
    if (Number(this.number) === 3) return new Atom(1n);
    else {
      const n = this.number;
      const l = bitLength(n) - 2;
      const addTop = BigInt(1 << l);
      const mask = BigInt((1 << l) - 1);
      return new Atom((n & mask) ^ addTop);
    }
  }
  shortCode() {
    return this.number.toString(36); // can we do more?
  }
  // TODO should get rid of this tbh
  valueOf() {
    return bitLength(this.number) <= 32
      ? Number(this.number)
      : this.number.toString();
  }
  // Class Methods
  static cordToString = function (c: Atom): string {
    const bytes = c.bytes(),
      chars: string[] = [];

    for (let i = 0; i < bytes.length; ++i) {
      chars.push(String.fromCharCode(bytes[i]));
    }
    return chars.join("");
  };
  // ??
  static fragmenter = function (a: Atom): Function {
    const s = a.shortCode();
    if (fragCache.hasOwnProperty(s)) {
      return fragCache[s];
    } else {
      for (var parts = ["a"]; !new Atom(1n).equals(a); a = a.mas()) {
        parts.push(2 === a.cap().valueOf() ? "head" : "tail");
      }
      return (fragCache[s] = new Function(
        "a",
        "return " + parts.join(".") + ";"
      ));
    }
  };
}
class Cell<TH extends Noun, TT extends Noun> {
  private _mug = 0;
  constructor(public head: TH, public tail: TT, public deep = true) {}
  // common methods
  pretty(out: string[], hasTail: boolean): void {
    if (!hasTail) out.push("[");
    this.head.pretty(out, false);
    out.push(" ");
    this.tail.pretty(out, false);
    if (!hasTail) out.push("]");
  }

  toString(): string {
    const parts: string[] = [];
    this.pretty(parts, false);
    return parts.join("");
  }
  mug(): number {
    if (this._mug === 0) this._mug = this.calculateMug();
    return this._mug;
  }
  calculateMug(): number {
    return _mug_both(this.head.mug(), this.tail.mug());
  }
  mugged(): boolean {
    return this._mug !== 0;
  }
  equals(o: Noun): boolean {
    if (o instanceof Cell) return this.unify(o);
    else return false;
  }
  bump(): void {
    throw new Error("Bail");
  }
  loob(): void {
    throw new Error("Bail");
  }
  at(a: Atom): Cell<Noun, Noun> {
    return Atom.fragmenter(a)(this);
  }
  // Cell specific
  unify(o: Cell<Noun, Noun>): boolean {
    if (this === o) return true;
    if (o.mugged()) {
      if (this.mugged()) {
        if (this.mug() != o.mug()) return false;
      } else return o.unify(this);
    }
    if (this.head.equals(o.head)) {
      o.head = this.head;
      if (this.tail.equals(o.tail)) {
        o._mug = this._mug;
        o.tail = this.tail;
        return true;
      }
    }
    return false;
  }
}
type Noun = Atom | Cell<Noun, Noun>;

// Atom builders

const small = new Array(256);
(function () {
  for (let i = 0; i < 256; ++i) {
    small[i] = new Atom(BigInt(i));
  }
})();
function fromString(str: string, radix: number): Atom {
  const num = bigIntFromStringWithRadix(str, radix);
  return new Atom(num);
}
function fromInt(n: number): Atom {
  if (n < 256) return small[n];
  else return new Atom(BigInt(n));
}
function fromMote(str: string): Atom {
  let i,
    j,
    octs = Array(str.length);
  for (i = 0, j = octs.length - 1; i < octs.length; ++i, --j) {
    octs[j] = (str.charCodeAt(i) & 0xff).toString(16);
  }
  return new Atom(BigInt(parseInt(octs.join(""), 16)));
}
const zero = fromInt(0);
const one = fromInt(1);
const two = fromInt(2);
const three = fromInt(3);
const atom = { zero, one, two, three, fromInt, fromString, fromMote };

export { Atom, Cell, Noun, atom };
