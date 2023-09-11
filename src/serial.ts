import { atom, Atom, Cell, Noun } from "./noun";
import { dwim } from "./noun-helpers";
import bits from "./bits";
import list from "./list";
import { NounMap } from "./hamt";

function rub(a: Atom, b: Atom): Cell<Atom, Atom> {
  var c, d, e, w, x, y, z, p, q, m;

  m = bits.add(a, atom.fromInt(bits.met(0, b)));
  x = a;

  while (atom.zero.equals(bits.cut(atom.zero, x, atom.one, b))) {
    y = bits.add(atom.one, x);

    //  Sanity check: crash if decoding more bits than available
    if (bits.gth(x, m)) {
      throw new Error("Bail");
    }

    x = y;
  }

  if (a.equals(x)) return new Cell(atom.one, atom.zero);

  c = bits.sub(x, a);
  d = bits.add(x, atom.one);

  x = bits.dec(c);
  y = bits.bex(x);
  z = bits.cut(atom.zero, d, x, b);

  e = bits.add(y, z);
  w = bits.add(c, c);
  y = bits.add(w, e);
  z = bits.add(d, x);

  p = bits.add(w, e);
  q = bits.cut(atom.zero, z, e, b);

  return new Cell(p, q);
}

function cue_in(m: NounMap, a: Atom, b: Atom): Cell<Atom, Cell<Noun, Noun>> {
  let head: Atom;
  let tailhead: Noun;
  if (atom.zero.equals(bits.cut(atom.zero, b, atom.one, a))) {
    const x = bits.add(b, atom.one);
    const c = rub(x, a);
    head = bits.add(c.head, atom.one);
    tailhead = c.tail;
    m.insert(b, tailhead);
  } else {
    const b2 = bits.add(atom.two, b);
    const b1 = bits.add(atom.one, b);

    if (atom.zero.equals(bits.cut(atom.zero, b1, atom.one, a))) {
      const u = cue_in(m, a, b2);
      const x = bits.add(u.head, b2);
      const v = cue_in(m, a, x);
      const y = bits.add(u.head, v.head);
      head = bits.add(atom.two, y);
      tailhead = new Cell(u.tail.head, v.tail.head);
      m.insert(b, tailhead);
    } else {
      const d = rub(b2, a);
      const dd = m.get(d.tail);
      if (undefined === dd) throw new Error("Bail");
      head = bits.add(atom.two, d.head);
      tailhead = dd;
    }
  }
  return new Cell(head, new Cell(tailhead, atom.zero));
}

function cue(a: Atom): Noun {
  const r = cue_in(new NounMap(), a, atom.zero);
  return cue_in(new NounMap(), a, atom.zero).tail.head;
}
function mat(a: Atom): Cell<Atom, Atom> {
  if (atom.zero.equals(a)) {
    return dwim(1, 1);
  } else {
    const b = dwim(bits.met(0, a)),
      c = dwim(bits.met(0, b)),
      u = bits.dec(c),
      v = bits.add(c, c),
      x = bits.end(atom.zero, u, b),
      w = bits.bex(c),
      y = bits.lsh(atom.zero, u, a),
      z = bits.mix(x, y),
      p = bits.add(v, b),
      q = bits.cat(atom.zero, w, z);
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
    x = bits.add(atom.two, b),
    d = _jam_in(m, h_a, x, w),
    y = bits.add(x, d.head),
    e = _jam_in(m, t_a, y, d.tail.head),
    z = bits.add(d.head, e.head);
  return dwim(bits.add(atom.two, z), e.tail.head, atom.zero);
}
function _jam_in_ptr(u_c: Atom, l: Noun): Cell<Atom, Cell<Atom, Noun>> {
  var d = mat(u_c),
    x = bits.lsh(atom.zero, atom.two, d.tail),
    y = bits.add(atom.two, d.head);

  return dwim(y, [[y, bits.mix(atom.three, x)], l], atom.zero) as Cell<
    Atom,
    Cell<Atom, Noun>
  >;
}

function _jam_in_flat(a: Atom, l: Noun): Cell<Atom, Cell<Atom, Noun>> {
  var d = mat(a),
    x = bits.add(atom.one, d.head);

  return dwim(
    x,
    [[x, bits.lsh(atom.zero, atom.one, d.tail)], l],
    atom.zero
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
  const x = _jam_in(new NounMap(), n, atom.zero, atom.zero),
    q = list.flop(x.tail.head);
  return bits.can(atom.zero, q);
}
export { cue, mat, jam };
