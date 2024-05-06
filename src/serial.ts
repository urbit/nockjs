import { Atom, Cell, Noun } from "./noun";
import { dwim } from "./noun-helpers";
import bits from "./bits";
import list from "./list";
import { NounMap } from "./hamt";
import { bigIntFromStringWithRadix, bigIntToByteArray } from "./bigint";

function bytesToBigint(bytes: number[]): bigint {
  if (bytes.length === 1) return BigInt(bytes[0]);
  let byt: number,
    parts: string[] = [];
  for (var i = bytes.length - 1; i >= 0; --i) {
    byt = bytes[i] & 0xff;
    parts.push(byt.toString(16).padStart(2, '0'));
  }
  const num = bigIntFromStringWithRadix(parts.join(""), 16);
  return num;
}

function bigintToDataView(a: bigint): DataView {
  return new DataView((new Uint8Array(bigIntToByteArray(a).reverse())).buffer);
}

//  cue
//NOTE  we operate primarily on a DataView (backed by a byte buffer), because
//      that's way faster for big jams than the naive bigint bits operations.

function bi_cut(b: bigint, c: bigint, d: bigint) {
  return dv_cut(Number(b), Number(c), bigintToDataView(d));
}

function dv_bit(b: number, d: DataView): number {
  const byte = Math.floor(b / 8);
  return ((d.getUint8(byte)) >> (b % 8)) & 1;
}

function dv_bitLength(d: DataView): number {
  const l = d.byteLength - 1;
  return (l * 8) + d.getUint8(l).toString(2).length;
}

function dv_cut(b: number, c: number, d: DataView): bigint {
  if (c === 1) return dv_bit(b, d) ? 1n : 0n;
  const offset = b % 8;
  if (offset === 0) return dv_cut_at_bytes(b, c, d);  //TODO  might not matter
  const out = [];
  let curByte = Math.floor(b / 8);

  //  for reading whole bytes, read from both left and right according to offset
  const bitsFromOne = 8 - offset;
  const bitsFromTwo = offset;
  const twoMask = 0xff >> (8 - bitsFromTwo);
  while (c >= 8) {
    const one = d.getUint8(curByte);
    const two = d.getUint8(curByte + 1);

    const left = (two & twoMask) << bitsFromOne;
    const right = one >> bitsFromTwo;

    out.push(left | right);

    curByte++;
    c -= 8;
  }

  //  for the last <8 bits, read them carefully
  if (c > 0n) {
    const bitsFromOne = Math.min(c, 8 - offset);
    const bitsFromTwo = c - bitsFromOne;
    const oneMask = (0xff >> (8 - bitsFromOne)) << offset;
    const twoMask = 0xff >> (8 - bitsFromTwo);

    const one = d.getUint8(curByte);
    const two = (curByte + 1 >= d.byteLength) ? 0 : d.getUint8(curByte + 1);

    const left = (bitsFromTwo === 0) ? 0 : ((two & twoMask) << bitsFromOne);
    const right = (one & oneMask) >> offset;

    out.push(left | right);
  }

  return bytesToBigint(out);
}

function dv_cut_at_bytes(b: number, c: number, d: DataView): bigint {
  if ((b % 8) !== 0) throw new Error('non-byte-aligned read ' + b);
  let curByte = Math.floor(b / 8);
  const out = [];
  //  we can just grab bytes directly
  while (c >= 8) {
    out.push(d.getUint8(curByte));
    curByte++;
    c -= 8;
  }
  //  only for the last one may we need to mask out bits beyond read range
  if (c > 0n) {
    out.push(d.getUint8(curByte) & ((0xff >> (8 - c))));
  }
  return bytesToBigint(out);
}

function rub(a: number, v: DataView, l: number): { head: number, tail: Atom } {
  var c, d, e, w, x, y, z, p, q, m;

  m = a + l;
  x = a;

  while (0 === dv_bit(x, v)) {
    y = x + 1;

    //  Sanity check: crash if decoding more bits than available
    if (x > m) throw new Error('bail: rubbing past end');

    x = y;
  }

  if (a === x) return { head: 1, tail: Atom.zero };

  c = x - a;
  d = x + 1;

  x = c - 1;
  if (x > 52) throw new Error('bail: rubbing oversized pointer (>52 bits)');

  y = 2 ** x; // bex(x);
  z = Number(dv_cut(d, x, v));

  e = y + z;
  w = c + c;
  y = w + e;
  z = d + x;

  p = w + e;
  q = dv_cut(z, e, v);

  return { head: p, tail: new Atom(q) };
}

function insert(m: { [key: number]: Noun }, k: number, n: Noun) {
  return m[k] = n;
}

function get(m: { [key: number]: Noun }, k: number) {
  return m[k];
}

function cue_in(m: { [key: number]: Noun }, vv: DataView, l: number, b: number): { head: number, tail: Noun } {
  let head: number;
  let tailhead: Noun;

  if (0 === dv_bit(b, vv)) {
    const x = 1 + b;
    const c = rub(x, vv, l);
    head = c.head + 1;
    tailhead = c.tail;
    insert(m, b, tailhead);
  } else {
    let b2 = 2 + b;
    let b1 = 1 + b;

    if (0 === dv_bit(b1, vv)) {
      const u = cue_in(m, vv, l, b2);
      const x = u.head + b2;
      const v = cue_in(m, vv, l, x);
      const y = u.head + v.head;
      head = 2 + y;
      tailhead = new Cell(u.tail, v.tail);
      insert(m, b, tailhead);
    } else {
      const d = rub(b2, vv, l);
      const dd = get(m, Number(d.tail.number));
      if (undefined === dd) throw new Error("Bail");
      head = 2 + d.head;
      tailhead = dd;
    }
  }
  return { head: head, tail: tailhead };
}

function cue(a: Atom): Noun {
  return cue_bytes(bigintToDataView(a.number));
}
function cue_bytes(v: DataView): Noun {
  return cue_in({}, v, dv_bitLength(v), 0).tail;
}

//  jam

function mat(a: Atom): Cell<Atom, Atom> {
  if (Atom.zero.equals(a)) {
    return dwim(1, 1);
  } else {
    const b = dwim(bits.met(0, a)),
      c = dwim(bits.met(0, b)),
      u = bits.dec(c),
      v = bits.add(c, c),
      x = bits.end(Atom.zero, u, b),
      w = bits.bex(c),
      y = bits.lsh(Atom.zero, u, a),
      z = bits.mix(x, y),
      p = bits.add(v, b),
      q = bits.cat(Atom.zero, w, z);
    return dwim(p, q);
  }
}
function _jam_in_pair(
  m: NounMap,
  h_a: Noun,
  t_a: Noun,
  b: Atom,
  l: Noun
): Cell<Atom, Cell<Atom, Atom>> {
  var w = dwim([2, 1], l),
    x = bits.add(Atom.two, b),
    d = _jam_in(m, h_a, x, w),
    y = bits.add(x, d.head),
    e = _jam_in(m, t_a, y, d.tail.head),
    z = bits.add(d.head, e.head);
  return dwim(bits.add(Atom.two, z), e.tail.head, Atom.zero);
}
function _jam_in_ptr(u_c: Atom, l: Noun): Cell<Atom, Cell<Atom, Noun>> {
  var d = mat(u_c),
    x = bits.lsh(Atom.zero, Atom.two, d.tail),
    y = bits.add(Atom.two, d.head);

  return dwim(y, [[y, bits.mix(Atom.three, x)], l], Atom.zero) as Cell<
    Atom,
    Cell<Atom, Noun>
  >;
}

function _jam_in_flat(a: Atom, l: Noun): Cell<Atom, Cell<Atom, Noun>> {
  var d = mat(a),
    x = bits.add(Atom.one, d.head);

  return dwim(
    x,
    [[x, bits.lsh(Atom.zero, Atom.one, d.tail)], l],
    Atom.zero
  ) as Cell<Atom, Cell<Atom, Noun>>;
}

function _jam_in(
  m: NounMap,
  a: Noun,
  b: Atom,
  l: Noun
): Cell<Atom, Cell<Atom, Noun>> {
  const c = m.get(a);
  if (undefined == c) {
    m.insert(a, b);
    return a instanceof Cell
      ? _jam_in_pair(m, a.head, a.tail, b, l)
      : _jam_in_flat(a, l);
  } else if (a instanceof Atom && bits.met(0, a) <= bits.met(0, c)) {
    return _jam_in_flat(a, l);
  } else {
    return _jam_in_ptr(c, l);
  }
}

function jam(n: Noun): Atom {
  const x = _jam_in(new NounMap(), n, Atom.zero, Atom.zero),
    q = list.flop(x.tail.head);
  return bits.can(Atom.zero, q);
}
export { cue, jam, mat,
         cue_bytes, bigintToDataView,
         bi_cut };
