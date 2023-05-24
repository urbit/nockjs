import { bigIntFromStringWithRadix, bitLength } from "./bigint";
import { Atom, Cell, Noun, atom } from "./noun";
// a is native, returns native
function met(a: number, b: Atom): number {
  var bits = bitLength(b.number),
    full = bits >>> a,
    part = full << a !== bits;

  return part ? full + 1 : full;
}

function gth(a: Atom, b: Atom) {
  return a.number > b.number;
}

function lth(a: Atom, b: Atom) {
  return a.number < b.number;
}

function gte(a: Atom, b: Atom) {
  return a.number >= b.number;
}

function lte(a: Atom, b: Atom) {
  return a.number <= b.number;
}

function add(a: Atom, b: Atom) {
  return new Atom(a.number + b.number);
}

function sub(a: Atom, b: Atom) {
  var r = a.number - b.number;
  if (r < 0) {
    throw new Error("subtract underflow");
  } else {
    return new Atom(r);
  }
}
function dec(a: Atom) {
  return sub(a, atom.one);
}

function bex(a: Atom) {
  const b = BigInt(1) << a.number;
  return new Atom(b);
}

function lsh(a: Atom, b: Atom, c: Atom) {
  var bits = Number(b.number << a.number);
  return new Atom(c.number << BigInt(bits));
}

function rsh(a: Atom, b: Atom, c: Atom) {
  var bits = b.number << a.number;
  return new Atom(c.number >> BigInt(bits));
}

// to/from little-endian 32-bit word array, as used in vere
// TODO: efficiency is horrible here, but can be improved using internals
function bytesToWords(bytes: number[]): number[] {
  var len = bytes.length,
    trim = len % 4;
  let i: number, b: number, w: number;

  if (trim > 0) {
    len += 4 - trim;
    for (i = 0; i < trim; ++i) {
      bytes.push(0);
    }
  }

  const size = len >> 2;
  const words: number[] = new Array(size);
  for (i = 0, b = 0; i < size; ++i) {
    w = (bytes[b++] << 0) & 0x000000ff;
    w ^= (bytes[b++] << 8) & 0x0000ff00;
    w ^= (bytes[b++] << 16) & 0x00ff0000;
    w ^= (bytes[b++] << 24) & 0xff000000;
    words[i] = w;
  }
  return words;
}

function wordsToBytes(words: number[]): number[] {
  const buf: number[] = [];
  let w: number, i: number, b: number;
  for (i = 0, b = 0; i < words.length; ++i) {
    w = words[i];
    buf[b++] = 0xff & (w & 0x000000ff);
    buf[b++] = 0xff & ((w & 0x0000ff00) >>> 8);
    buf[b++] = 0xff & ((w & 0x00ff0000) >>> 16);
    buf[b++] = 0xff & ((w & 0xff000000) >>> 24);
  }
  // or here. one of the 'get rid of extra zeros' functions.
  while (buf[--b] === 0) {
    buf.pop();
  }
  return buf;
}

function bytesToAtom(bytes: number[]): Atom {
  let byt: number,
    parts: string[] = [];
  for (var i = bytes.length - 1; i >= 0; --i) {
    byt = bytes[i] & 0xff;
    parts.push(byt < 16 ? "0" + byt.toString(16) : byt.toString(16));
  }
  const num = bigIntFromStringWithRadix(parts.join(""), 16);
  return new Atom(num);
}

function atomToBytes(atom: Atom) {
  return atom.bytes();
}

function atomToWords(atom: Atom): number[] {
  return bytesToWords(atomToBytes(atom));
}

function wordsToAtom(words: number[]): Atom {
  return bytesToAtom(wordsToBytes(words));
}
// 0x3930b13c0dedeccf01 atom

var malt = wordsToAtom;

// XX: INTERNAL
function slaq(bloq: number, len: number): number[] {
  return new Array(((len << bloq) + 31) >>> 5);
}

// src is atom, all others native
function chop(
  met: number,
  fum: number,
  wid: number,
  tou: number,
  dst: number[],
  src: Atom
): void {
  var buf = atomToWords(src),
    len = buf.length,
    i: number,
    j: number,
    san: number,
    mek: number,
    baf: number,
    bat: number,
    hut: number,
    san: number,
    wuf: number,
    wut: number,
    waf: number,
    raf: number,
    wat: number,
    rat: number,
    hop: number;

  if (met < 5) {
    san = 1 << met;
    mek = (1 << san) - 1;
    baf = fum << met;
    bat = tou << met;

    for (i = 0; i < wid; ++i) {
      waf = baf >>> 5;
      raf = baf & 31;
      wat = bat >>> 5;
      rat = bat & 31;
      hop = waf >= len ? 0 : buf[waf];
      hop = (hop >>> raf) & mek;
      dst[wat] ^= hop << rat;
      baf += san;
      bat += san;
    }
  } else {
    hut = met - 5;
    san = 1 << hut;

    for (i = 0; i < wid; ++i) {
      wuf = (fum + i) << hut;
      wut = (tou + i) << hut;

      for (j = 0; j < san; ++j) {
        dst[wut + j] ^= wuf + j >= len ? 0 : buf[wuf + j];
      }
    }
  }
}
function cut(a: Atom, b: Atom, c: Atom, d: Atom): Atom {
  var ai = Number(a.number),
    bi = Number(b.number),
    ci = Number(c.number);

  var len = met(ai, d);
  if (atom.zero.equals(c) || bi >= len) {
    return atom.zero;
  }
  if (bi + ci > len) {
    ci = len - Number(b.number); // doublecheck
  }
  if (0 === bi && ci === len) {
    return d;
  } else {
    var sal = slaq(ai, ci);
    chop(ai, bi, ci, 0, sal, d);
    return malt(sal);
  }
}

const maxCat = atom.fromInt(0xffffffff);
const catBits = atom.fromInt(32);

function end(a: Atom, b: Atom, c: Atom): Atom {
  if (gth(a, catBits)) {
    throw new Error("Fail");
  } else if (gth(b, maxCat)) {
    return c;
  } else {
    var ai = Number(a.number),
      bi = Number(b.number),
      len = met(ai, c);

    if (0 === bi) {
      return atom.zero;
    } else if (bi >= len) {
      return c;
    } else {
      var sal = slaq(ai, bi);
      chop(ai, 0, bi, 0, sal, c);
      return malt(sal);
    }
  }
}

function mix(a: Atom, b: Atom) {
  return new Atom(a.number ^ b.number);
}

// doublecheck everything
function cat(a: Atom, b: Atom, c: Atom): Atom {
  if (gth(a, catBits)) {
    throw new Error("Fail");
  } else {
    var ai = Number(a.number),
      lew = met(ai, b),
      ler = met(ai, c),
      all = lew + ler;
    if (0 === all) {
      return atom.zero;
    } else {
      const sal = slaq(ai, all);
      chop(ai, 0, lew, 0, sal, b);
      chop(ai, 0, ler, lew, sal, c);
      return malt(sal);
    }
  }
}

function can(a: Atom, b: Noun) {
  if (gth(a, catBits)) {
    throw new Error("Fail");
  } else {
    let ai = Number(a.number),
      tot = 0,
      cab = b,
      pos,
      i_cab,
      pi_cab,
      qi_cab;

    // measure
    while (true) {
      if (atom.zero.equals(cab)) break;
      if (cab instanceof Atom) throw new Error("Fail");
      i_cab = cab.head;
      if (i_cab instanceof Atom) throw new Error("Fail");
      else if (i_cab instanceof Cell) {
        pi_cab = i_cab.head;
        qi_cab = i_cab.tail;
      }
      if (pi_cab instanceof Atom && gth(pi_cab, maxCat))
        throw new Error("Fail");
      if (qi_cab instanceof Cell) throw new Error("Fail");
      if (pi_cab instanceof Atom) tot += Number(pi_cab.number);
      if (cab instanceof Cell) cab = cab.tail;
    }
    if (0 === tot) return atom.zero;
    var sal = slaq(ai, tot);

    // chop the list atoms in
    cab = b;
    pos = 0;
    while (!atom.zero.equals(cab)) {
      if (cab instanceof Cell) i_cab = cab.head;
      if (i_cab instanceof Cell) {
        if (i_cab.head instanceof Atom) pi_cab = Number(i_cab.head.number);
        qi_cab = i_cab.tail;
        chop(ai, 0, pi_cab as number, pos, sal, qi_cab as Atom);
        pos += pi_cab as number;
        if (cab instanceof Cell) cab = cab.tail;
      }
    }
    return malt(sal);
  }
}

export default {
  met,
  cut,
  add,
  sub,
  dec,
  gth,
  lth,
  gte,
  lte,
  bex,
  lsh,
  rsh,
  end,
  mix,
  cat,
  can,
  bytesToWords,
  wordsToBytes,
  bytesToAtom,
  atomToBytes,
  atomToWords,
  wordsToAtom,
};
