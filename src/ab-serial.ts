import { Atom, Cell, Noun } from "./noun";
import { dwim } from "./noun-helpers";
import list from "./list";
import { bigIntFromStringWithRadix, bitLength, bigIntToByteArray } from "./bigint";
import { NounMap } from "./hamt";


// var buf = new Uint8Array(128);
// var bitstream = new BitStream(buf);
// bitstream.writeBits(12, 0xffff);
// bitstream.seekTo(0);
// bitstream.readBits(6); // 111111
// bitstream.readBits(10); // 1111110000


function bigintToDataView(a: bigint): DataView {
  return wordArrayToDataView(atomToBytes(a));
}
function wordArrayToDataView(a: number[]): DataView {
  return new DataView((new Uint8Array(a)).buffer);
}

function dv_cut_ez(a: bigint, b: bigint, c: bigint, d: bigint) {
  return dv_cut_any_bits(a, b, c, bigintToDataView(d));
}

function dv_cut_bit(a: bigint, b: bigint, c: bigint, d: DataView) {
  // if (a !== 0n) throw new Error('non-bit read ' + a);
  // if (c !== 1n) throw new Error('non-1 length ' + c);
  const byte = Math.floor(Number(b) / 8);
  return (BigInt(d.getUint8(byte)) >> (b % 8n)) & 1n;
}

//TODO
//  loop until remaining bytes >= 8
//  for the given offset, read left and right, merge them into a resulting byte
//  (if given offset = 0, we don't need to read from the next/lefthand byte)
//  end loop
//  if remaining bytes < 8, read only _the amount of remaining bytes_ (which could be from both sides still!)
//    -> so, use different offset variables than for the main loop!

//TODO  perf things to try
// - cache byte lookups
// - work on words, not bytes

function dv_bitLength(d: DataView): number {
  const l = d.byteLength - 1;
  return (l * 8) + d.getUint8(l).toString(2).length;
}

function dv_cut_any_bits(a: bigint, b: bigint, c: bigint, d: DataView): bigint {
  if (a !== 0n) throw new Error('non-bit read ' + a);
  const offset = b % 8n;
  if (c === 1n) return dv_cut_bit(a, b, c, d);
  if (offset === 0n) return dv_cut_at_bytes(a, b, c, d);
  const out = [];
  // let outt = 0n;
  let curByte = Number(b / 8n);

  //  for reading whole bytes, read from both left and right according to offset
  const bitsFromOne = Number(8n - offset);
  const bitsFromTwo = Number(offset);
  const twoMask = 0xff >> (8 - bitsFromTwo);
  while (c >= 8n) {
    const one = d.getUint8(curByte);
    const two = d.getUint8(curByte + 1);

    const left = (two & twoMask) << bitsFromOne;
    const right = one >> bitsFromTwo;

    out.push(left | right);
    // outt = (outt << 8n) | BigInt(left | right);

    curByte++;
    c -= 8n;
  }

  //  for the last <8 bits, read them carefully
  if (c > 0n) {
    const bitsFromOne = Math.min(Number(c), Number(8n - offset));
    const bitsFromTwo = Number(c) - bitsFromOne;
    const oneMask = (0xff >> (8 - bitsFromOne)) << Number(offset);
    const twoMask = 0xff >> (8 - bitsFromTwo);

    const one = d.getUint8(curByte);
    // if ( curByte >= d.byteLength-1 ) {
    //   console.log('endding', d.byteLength, i);
    // }
    const two = (curByte+1 >= d.byteLength) ? 0 : d.getUint8(curByte + 1);

    const left = (bitsFromTwo===0) ? 0 : ((two & twoMask) << bitsFromOne);
    const right = (one & oneMask) >> Number(offset);
    // console.log('reading last', c, {
    //   bitsFromOne,
    //   bitsFromTwo
    // }, two.toString(16), one.toString(16), left.toString(16), right.toString(16));

    out.push(left | right);
    // outt = (outt << c) | BigInt( left | right);
  }

  return bytesToAtom(out);
}

function dv_cut_at_bytes(a: bigint, b: bigint, c: bigint, d: DataView): bigint {
  if (a !== 0n) throw new Error('non-bit read ' + a);
  if ((b%8n) !== 0n) throw new Error('non-byte-aligned read ' + a);
  const out = [];
  //  we can just grab bytes directly
  while (c >= 8n) {
    out.push(d.getUint8(Number(b / 8n)));  //TODO  curByte
    b += 8n;
    c -= 8n;
  }
  //  only for the last one may we need to mask out bits beyond read range
  if (c > 0n) {
    out.push(d.getUint8(Number(b / 8n)) & Number((0xffn >> (8n - c))));
  }
  return bytesToAtom(out);
}


function dv_cut_bits(a: bigint, b: bigint, c: bigint, d: DataView) {
  if (a !== 0n) throw new Error('non-bit read ' + a);
  if (c === 0n) return 0n;
  const offset = Number(b % 8n);
  const endset = Number((b+c) % 8n);
  const fromRight = 8 - offset;
  const fromLeft = 8 - fromRight;
  const fromLeftLast = endset;
  const tailmask = (offset===0) ? 0xff : 0xff >> (8 - offset);

  const out: number[] = [];  //  push smallest bytes first

  while (c >= 8n) {
    const byt = d.getUint8(Number(b / 8n));
    if (offset == 0) {
      out.push(byt);
    } else {
      const byn = d.getUint8(1 + Number(b / 8n));
      console.log({
        byt: byt.toString(16),
        byn: byn.toString(16),
        mask: tailmask.toString(2),
        offset,
        fromLeft,
        fromRight,
      });
      const left = ((byn & tailmask) << fromRight);
      const frl = offset; //endset; //8 - (8 - endset);
      const right = (byt >> frl);
      console.log(left.toString(16), right.toString(16), left + right, BigInt(left) + BigInt(right));
      out.push(left + right);
    }
    c = c - 8n;
    b = b + 8n;
  }

  if (c > 0) {
    if ((b % 8n) < c) {
      console.log('we fucked');
      const byt = d.getUint8(Number(b / 8n));
      const byn = d.getUint8(1 + Number(b / 8n));
      const left = ((byn & tailmask) << fromRight);
      const frl = endset; //8 - (8 - endset);
      const right = (byt >> frl);
      out.push(left + right);
    } else {
      const byt = d.getUint8(Number(b / 8n));
      // const mas = (0xff >> (8 - fromLeftLast))
      const las = (byt >>  fromLeft);
      console.log('final', {
        b,
        c,
        fromLeftLast,
        byt: byt.toString(16),
        // mas: mas.toString(),
        las: las.toString(16)
      });
      out.push(las);
    }
  }

  return bytesToAtom(out);
}

function dv_cut(a: bigint, b: bigint, c: bigint, d: DataView) {
  if (a !== 0n) throw new Error('non-bit read ' + a);
  let curByte = Number(b / 8n);
  const offset = b % 8n;
  const endset = (b+c) % 8n;
  const endByte = curByte + Number(c / 8n) - ((offset===0n && endset===0n) ? 1 : 0);
  const tailmask = 0xffn >> (endset===0n ? 0n : (8n - endset));

  const leftmask = (0xffn << offset) & 0xffn;
  const rightmask = 0xffn >> (8n - offset);

  console.log({
    buf: d.buffer,
    start: curByte,
    end: endByte,
    offset,
    endset,
    leftmask: leftmask.toString(2),
    rightmask: rightmask.toString(2),
    mask: tailmask.toString(2),
  });

  // let carry = 0n;
  // if (curByte === endByte) {
  //   console.log('lone', (d.getUint8(curByte)).toString(16));
  // } else {
  //   while (curByte < endByte) {
  //     const b = BigInt(d.getUint8(curByte));
  //     const n = BigInt(d.getUint8(curByte));
  //     let x = carry + ((b >> offset) & 0xffn);
  //     console.log('byte', b.toString(16), x.toString(16));
  //     carry = b & rightmask;
  //     curByte++;
  //   }
  //   console.log('last', (carry + (BigInt(d.getUint8(curByte)) & tailmask)).toString(16));
  // }

  // curByte = Number(b / 8n);

  if (curByte === endByte) {
    console.log('lacol');
    return (BigInt(d.getUint8(curByte)) >> offset) & tailmask;
  }

  let out = [];
  let carry = 0n;

  //  first byte
  // out = BigInt(d.getUint8(curByte)) & tailmask;
  // out.push(BigInt(d.getUint8(curByte)) >> offset);
  // const first = BigInt(d.getUint8(curByte)) >> offset;
  // carry = BigInt(d.getUint8(curByte)) & leftmask;
  // console.log('starting', d.getUint8(curByte).toString(16), (first).toString(16));
  // curByte++;
  // out.push(first);

  carry = (BigInt(d.getUint8(curByte)) & leftmask) >> offset;
  curByte++;
  console.log('start carry', carry.toString(16));

  //  middle bytes
  while (curByte < endByte) {
    const b = BigInt(d.getUint8(curByte));
    const n = ((b & rightmask) << (offset===0n ? 0n : (8n-offset)));
    const res = carry + n;
    carry = (b & leftmask) >> offset;
    console.log('center byte', {
      b: b.toString(16),
      n: n.toString(16),
      res: res.toString(16),
      newCarry: carry.toString(16)
    });
    out.push(res); //(carry << offset) & (b >> offset));

    curByte++;
  }

  //  last byte
  // const last = BigInt(d.getUint8(curByte)) & tailmask;
  const last = carry & (0xffn >> (8n - endset)); // >> endset; //BigInt(d.getUint8(curByte)) & (0xffn >> (8n - endset)); //<< (8n - endset);
  out.push(last);
  console.log('ending', carry.toString(16), last.toString(16));

  console.log(out.map((n) => n.toString(16)));

  return bytesToAtom(out.map((n) => Number(n)));

  // return (BigInt(d.getUint8(curByte)) >> offset) & tailmask;

  // const byte = Math.floor(Number(b) / 8);
  // const result = (BigInt(v.getUint8(byte)) >> b % 8n) & 1n;
  // return result;
}


function bex(a: bigint) {
  return 1n << a;
}

function met(a: number, b: bigint) {
  var bits = bitLength(b),
    full = bits >>> a,
    part = full << a !== bits;

  return part ? full + 1 : full;
}

//  internal
function slaq(bloq: number, len: number): number[] {
  return new Array(((len << bloq) + 31) >>> 5);
}

function atomToBytes(a: bigint) {
  const bytes = bigIntToByteArray(a);
  const r: number[] = [];
  for (var i = bytes.length - 1; i >= 0; --i) {
    r.push(bytes[i] & 0xff);
  }
  return r;
}

function atomToWords(a: bigint): number[] {
  return bytesToWords(atomToBytes(a));
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

function bytesToAtom(bytes: number[]): bigint {
  let byt: number,
    parts: string[] = [];
  for (var i = bytes.length - 1; i >= 0; --i) {
    byt = bytes[i] & 0xff;
    parts.push(byt < 16 ? "0" + byt.toString(16) : byt.toString(16));
  }
  const num = bigIntFromStringWithRadix(parts.join(""), 16);
  return num;
}

function wordsToAtom(words: number[]): bigint {
  return bytesToAtom(wordsToBytes(words));
}

//  internal
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

function chop(
  met: number,
  fum: number,
  wid: number,
  tou: number,
  dst: number[],
  src: bigint
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

//NOTE  string ops are way slower, divide is way slower,
//      doing a byte-aligned shift first is ~twice as slow
function mrsh(d: bigint, b: bigint): bigint {
  // if (0n === b) return d;
  // d = d >> ((b & (2n ** 32n - 8n))); // ((b >> 3n) << 3n);  //  byte-aligned shift
  // return d >> (b & 7n);
  // return (d >> ((b & (2n ** 32n - 8n)))) >> (b & 7n)
  // if (0n === b) return d;
  // return d / (2n ** b);
  // if (b > (2 ** 30)) console.log('yuge', b);
  // if (b !== BigInt(Number(b))) console.log('trouble', b);
  // const neu = BigInt('0b0' + d.toString(2).slice(0, -Number(b)));
  // const ole = d >> b;
  // if (neu !== ole)
  //   console.log('wild', b, -Number(b), neu);
  // return BigInt('0b0' + d.toString(2).slice(0, -Number(b)));
  return d >> b;
}

function endBits(a: bigint, c: bigint) {
  // return BigInt.asUintN(Number(c), a);  //NOTE  no perf diff
  return a & ((1n << c) - 1n);
}


function ecut(a: bigint, b: bigint, c: bigint, d: bigint, v: DataView): bigint {
  //  this is the common case for cue operations, important to be fast,
  //  we can just use native operatios for it
  if (a === 0n) {
    return dv_cut_any_bits(a, b, c, v);
    // if (c === 1n) {
    //   // const byte = Math.floor(Number(b) / 8);
    //   // const result = (BigInt(v.getUint8(byte)) >> b % 8n) & 1n;
    //   // if (dv_cut(a, b, c, v) !== result) throw new Error('ugh');
    //   return dv_cut_bit(a, b, c, v);
    //   // return result === 1 ? 1n : 0n;
    // }
    // // return dv_cut_nu(a, b, c, d);
    // // if (b >= 32n && c <= 32n) {
    // //   return BigInt(v.getBigUint64(Number(b - 32n)) >> (32n - c)) & 0xffffffffn;
    // // }
    // if (c === 1n) {
    //   return mrsh(d, b) & 1n;
    // }
    // // if (dv_cut(a, b, c, v) !== endBits(mrsh(d, b), c)) {
    // //   console.log('yeeesh', { a, b, c, d, v, dvr: dv_cut(a, b, c, v), ebr: endBits(mrsh(d, b), c) });
    // //   throw new Error('yeesh ' + dv_cut(a, b, c, v).toString(16) + ', ' + endBits(mrsh(d, b), c).toString(16));
    // // }
    // return endBits(mrsh(d, b), c);
    // return mand(mrsh(d, b), mcap(c));
    // return (d >> b) & ((1n << c) - 1n);
  }
  console.log('non-zero ecut', a);

  var ai = Number(a),
    bi = Number(b),
    ci = Number(c);

  var len = met(ai, d);
  if ((0n === c) || bi >= len) {
    return 0n;
  }
  if (bi + ci > len) {
    ci = len - Number(b); // doublecheck
  }
  if (0 === bi && ci === len) {
    return d;
  } else {
    var sal = slaq(ai, ci);
    chop(ai, bi, ci, 0, sal, d);
    return wordsToAtom(sal);
  }
}

const bits = {
  bex,
  ecut,
}

function rub(a: bigint, b: bigint, v: DataView, vl: bigint): Cell<Atom, Atom> {
  var c, d, e, w, x, y, z, p, q, m;

  m = a + vl; // BigInt(bits.met(0, b));
  x = a;

  while (0n === bits.ecut(0n, x, 1n, b, v)) {
    y = x + 1n;

    //  Sanity check: crash if decoding more bits than available
    if (x > m) {
      throw new Error("Bail");
    }

    x = y;
  }

  if (a === x) return new Cell(Atom.one, Atom.zero);

  c = x - a;
  d = x + 1n;

  x = c - 1n;
  y = bits.bex(x);
  z = bits.ecut(0n, d, x, b, v);

  e = y + z;
  w = c + c;
  y = w + e;
  z = d + x;

  p = w + e;
  q = bits.ecut(0n, z, e, b, v);

  return new Cell(new Atom(p), new Atom(q));
}

function insert(m: { [key: number]: Noun }, k: bigint, n: Noun) {
  m[Number(k)] = n;
}

function get(m: { [key: number]: Noun }, k: bigint) {
  return m[Number(k)];
}

function cue_in(m: { [key: number]: Noun}, a: bigint, vv: DataView, vl: bigint, b: bigint, r: bigint): Cell<Atom, Cell<Noun, Noun>> {
  let head: bigint;
  let tailhead: Noun;
  if (0n === bits.ecut(0n, b, 1n, a, vv)) {
    const x = 1n + b;
    const c = rub(x, a, vv, vl);
    head = c.head.number + 1n;
    tailhead = c.tail;
    // m.insert(new Atom(r), tailhead);
    insert(m, r, tailhead); //m[Number(r)] = tailhead;
    // m.set(r, tailhead);
  } else {
    let b2 = 2n + b;
    let b1 = 1n + b;

    if (0n === bits.ecut(0n, b1, 1n, a, vv)) {
      // const u = cue_in(m, a, b2, r+2n);
      // if (b > 8192n) {
      //   // console.log('cut!', b);
      //   a = a >> b2;
      //   b2 = 0n;
      // }
      const u = cue_in(m, a, vv, vl, b2, r+2n);
      const x = u.head.number + b2;
      const v = cue_in(m, a, vv, vl, x, r+u.head.number+2n);
      const y = u.head.number + v.head.number;
      head = 2n + y;
      tailhead = new Cell(u.tail.head, v.tail.head);
      //TODO  bigint-keyed map?
      // m.insert(new Atom(r), tailhead);
      insert(m, r, tailhead); //m[Number(r)] = tailhead;
      // m.set(r, tailhead);
    } else {
      const d = rub(b2, a, vv, vl);
      // const dd = m.get(d.tail.number);
      const dd = get(m, d.tail.number); //m[Number(d.tail.number)];
      if (undefined === dd) throw new Error("Bail");
      head = 2n + d.head.number;
      tailhead = dd;
    }
  }
  return new Cell(new Atom(head), new Cell(tailhead, Atom.zero));
}

function natty_cue(a: Atom): Noun {
  const vv = bigintToDataView(a.number);
  return cue_in({}, a.number, vv, BigInt(dv_bitLength(vv)), 0n, 0n).tail.head;
}
export { natty_cue, dv_cut_ez };
