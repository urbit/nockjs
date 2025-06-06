import {
  bigIntFromStringWithRadix,
  bigIntToByteArray,
  bitLength,
  testBit,
} from "./bigint";
import { mum } from "./noun-std";

// Helpers

export const fragCache: Record<string, (arg: Noun) => Noun> = {
  "0": function (a: Noun) {
    throw new Error("Bail");
  },
  "1": function (a: Noun) {
    return a;
  },
};

// Classes
class Atom {
  private _mug = 0;
  public deep = false;
  public static small: Atom[] = (Array.from(Array(256))).map((function (_, i: number) {
    return new Atom(BigInt(i));
  }));
  public static zero = Atom.small[0];
  public static one = Atom.small[1];
  public static two = Atom.small[2];
  public static three = Atom.small[3];
  constructor(public readonly number: bigint) {}

  // common methods with Cell
  isAtom(): this is Atom             { return true; }
  isCell(): this is Cell<Noun, Noun> { return false; }
  pretty(out: string[], hasTail = false): void {
    if (this.number < 65536n) out.push(this.number.toString(10));
    else {
      let tap: string[] = [],
        isTa = true,
        isTas = true,
        bytes = bigIntToByteArray(this.number);
      for (let i = bytes.length - 1; i >= 0; --i) {
        const c = bytes[i];
        if (isTa && (c < 32 || c > 127)) {
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
    return mum(0xcafebabe, 0x7fff, this.number);
  }
  mugged(): boolean {
    return this._mug !== 0;
  }
  at(a: Atom): Noun {
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
  // Class Methods
  static cordToString(c: Atom): string {
    const bytes = c.bytes(),
      chars: string[] = [];

    for (let i = 0; i < bytes.length; ++i) {
      chars.push(String.fromCharCode(bytes[i]));
    }
    return chars.join("");
  };
  // cached tree addressing function constructor
  static fragmenter(a: Atom): (arg: Noun) => Noun {
    const s = a.shortCode();
    if (fragCache.hasOwnProperty(s)) {
      return fragCache[s];
    } else {
      for (var parts = ["a"]; !Atom.one.equals(a); a = a.mas()) {
        parts.push(Atom.two.equals(a.cap()) ? "head" : "tail");
      }
      return (fragCache[s] = new Function(
        "a",
        "return " + parts.join(".") + ";"
      ) as (arg: Noun) => Noun);
    }
  };
  // Atom builders
  static fromString(str: string, radix: number = 10): Atom {
    const num = bigIntFromStringWithRadix(str, radix);
    return new Atom(num);
  }
  static fromInt(n: number): Atom {
    if (n < 256) return Atom.small[n];
    else return new Atom(BigInt(n));
  }
  static fromCord(str: string): Atom {
    if (str.length === 0) return Atom.zero;
    let i,
      j,
      octs = Array(str.length);
    for (i = 0, j = octs.length - 1; i < octs.length; ++i, --j) {
      const charByte = (str.charCodeAt(i) & 0xff).toString(16);
      octs[j] = charByte.length === 1 ? "0" + charByte : charByte;
    }
    if (str.length > 4)  return Atom.fromString(octs.join(''), 16);
    else                 return new Atom(BigInt(parseInt(octs.join(""), 16)));
  }
}
class Cell<TH extends Noun, TT extends Noun> {
  private _mug = 0;
  constructor(public readonly head: TH, public readonly tail: TT, public deep = true) {}
  // common methods
  isAtom(): this is Atom         { return false; }
  isCell(): this is Cell<TH, TT> { return true; }
  pretty(out: string[], hasTail: boolean): void {
    if (!hasTail) out.push("[");
    this.head.pretty(out, false);
    out.push(" ");
    this.tail.pretty(out, true);
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
    return mum(0xdeadbeef, 0xfffe,
               ((BigInt(this.tail.mug()) << 32n) | BigInt(this.head.mug())));
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
  loob(): boolean {
    throw new Error("Bail");
  }
  at(a: Atom): Noun {
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
      // @ts-ignore, we are intentionally de-duplicating
      o.head = this.head;
      if (this.tail.equals(o.tail)) {
        o._mug = this._mug;
        // @ts-ignore, we are intentionally de-duplicating
        o.tail = this.tail;
        return true;
      }
    }
    return false;
  }
}
type Noun = Atom | Cell<Noun, Noun>;

export function isAtom(a: any): a is Atom {
  return a instanceof Atom;
}
export function isCell(a: any): a is Cell<Noun, Noun> {
  return a instanceof Cell;
}
export function isNoun(a: any): a is Noun {
  return isAtom(a) || isCell(a);
}

export { Atom, Cell, Noun };
