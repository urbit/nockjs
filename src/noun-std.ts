import { murmurhash3_bi } from "./murmur3";
import { Atom, Cell } from "./noun";
import type { Noun } from "./noun";
import { dwim } from "./noun-dejs";

//
//  mugs
//

export function mug(arg: Noun): number {
  return arg.mug();
}

export function mum(syd: number, fal: number, key: bigint): number {
  let i = 0;
  while (i < 8) {
    const haz = murmurhash3_bi(null, key, syd);
    const ham = (haz >>> 31) ^ (haz & 0x7fffffff);
    if (0 !== ham) return ham;
    i++; syd++;
  }
  return fal;
}

export function muk(syd: number, len: number, key: bigint): number {
  return murmurhash3_bi(len, key, syd);
};

//
//  ordering
//

//  +dor: depth order
export function dor(a: Noun, b: Noun): boolean {
  //  ?:  =(a b)  &
  if (a.equals(b)) return true;
  //  ?.  ?=(@ a)
  if (a.isCell()) {
    //  ?:  ?=(@ b)  |
    if (b.isAtom()) return false;
    //  ?:  =(-.a -.b)
    if (a.head.equals(b.head))
      //  $(a +.a, b +.b)
      return dor(a.tail, b.tail);
    //  $(a -.a, b -.b)
    return dor(a.head, b.head);
  }
  //  ?.  ?=(@ b)  &
  if (b.isCell()) return true;
  //  (lth a b)
  return (a < b);
}

//  +gor: mug hash order, collisions fall back to +dor
export function gor(a: Noun, b: Noun): boolean {
  //  =+  [c=(mug a) d=(mug b)]
  const c = a.mug();
  const d = b.mug();
  //  ?:  =(c d)
  if (c === d)
    //  (dor a b)
    return dor(a, b);
  //  (lth c d)
  return c < d;
}

//  +mor: double mug hash order, collisions fall back to +dor
export function mor(a: Noun, b: Noun): boolean {
  //  =+  [c=(mug (mug a)) d=(mug (mug b))]
  const c = Atom.fromInt(a.mug()).mug();
  const d = Atom.fromInt(b.mug()).mug();
  //  ?:  =(c d)
  if (c === d)
    //  (dor a b)
    return dor(a, b);
  //  (lth c d)
  return c < d;
}

//
//  data structures
//

//  isSet: check for set with >0 entries, ?=([* * *])
export function isSet(a: Noun): a is Cell<Noun, Cell<Noun, Noun>> {
  return a.isCell() && a.tail.isCell();
}

//  +put:in: set insertion
export function putIn(a: Noun, b: Noun): Noun {
  //  ?~  a
  //    [b ~ ~]
  if (a.equals(Atom.zero)) {
    return dwim(b, null, null);
  }
  if (!isSet(a)) {
    throw new Error('malformed set');
  }
  //  ?:  =(b n.a)
  //    a
  if (b.equals(a.head)) {
    return a;
  }
  //  ?:  (gor b n.a)
  if (gor(b, a.head)) {
    //  =+  c=$(a l.a)
    const c = putIn(a.tail.head, b);
    //  ?>  ?=(^ c)
    if (!isSet(c)) {
      throw new Error('implementation error');
    }
    //  ?:  (mor n.a n.c)
    //    a(l c)
    if (mor(a.head, c.head)) {
      return dwim(a.head, c, a.tail.tail);
    }
    //  c(r a(l r.c))
    return dwim(c.head, c.tail.head, [a.head, c.tail.tail, a.tail.tail]);
  }
  //  =+  c=$(a r.a)
  const c = putIn(a.tail.tail, b);
  //  ?>  ?=(^ c)
  if (!isSet(c)) {
    throw new Error('implementation error');
  }
  //  ?:  (mor n.a n.c)
  //    a(r c)
  if (mor(a.head, c.head)) {
    return dwim(a.head, a.tail.head, c);
  }
  //  c(l a(r l.c))
  return dwim(c.head, [a.head, a.tail.head, c.tail.head], c.tail.tail);
}

//  isMap: check for map with >0 entries, ?=([[* *] * *])
export function isMap(a: Noun): a is Cell<Cell<Noun, Noun>, Cell<Noun, Noun>> {
  return a.isCell() && a.head.isCell() && a.tail.isCell();
}

//  +put:by: map insertion
export function putBy(a: Noun, b: Noun, c: Noun): Noun {
  //  ?~  a
  //    [[b c] ~ ~]
  if (a.equals(Atom.zero)) {
    return dwim([b, c], null, null);
  }
  if (!isMap(a)) {
    throw new Error('malformed map');
  }
  //  ?:  =(b p.n.a)
  if (b.equals(a.head.head)) {
    //  ?:  =(c q.n.a)
    //    a
    if (c.equals(a.head.tail)) {
      return a;
    }
    //  a(n [b c])
    return dwim([b, c], a.tail);
  }
  //  ?:  (gor b p.n.a)
  if (gor(b, a.head.head)) {
    //  =+  d=$(a l.a)
    const d = putBy(a.tail.head, b, c);
    //  ?>  ?=(^ d)
    if (!isMap(d)) {
      throw new Error('implementation error');
    }
    //  ?:  (mor p.n.a p.n.d)
    //    a(l d)
    if (mor(a.head.head, d.head.head)) {
      return dwim(a.head, d, a.tail.tail);
    }
    //  d(r a(l r.d))
    return dwim(d.head, d.tail.head, [a.head, d.tail.tail, a.tail.tail]);
  }
  //  =+  d=$(a r.a)
  const d = putBy(a.tail.tail, b, c);
  //  ?>  ?=(^ d)
  if (!isMap(d)) {
    throw new Error('implementation error');
  }
  //  ?:  (mor p.n.a p.n.d)
  //    a(r d)
  if (mor(a.head.head, d.head.head)) {
    return dwim(a.head, a.tail.head, d);
  }
  //  d(l a(r l.d))
  return dwim(d.head, [a.head, a.tail.head, d.tail.head], d.tail.tail);
}
