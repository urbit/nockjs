var noun = require('./noun.js'),
    Cell = noun.Cell,
    bits = require('./bits.js'),
    zero = noun.Atom.yes,
    one  = noun.Atom.no,
    i    = noun.Atom.fromInt,
    two  = i(2),
    NounMap = require('./hamt.js').NounMap;

function rub(a, b) {
	var c, d, e, w, x, y, z, p, q, m;

	m = bits.add(a, i(bits.met(0, b)));
	x = a;

	while ( zero.equals(bits.cut(zero, x, one, b)) ) {
		y = bits.add(one, x);

		//  Sanity check: crash if decoding more bits than available
		if ( bits.gth(x, m) ) {
			throw new Error("Bail");
		}

		x = y;
	}

	if ( a.equals(x) ) {
		return new Cell(one, zero);
	}

	c = bits.sub(x, a);
	d = bits.add(x, one);

	x = bits.dec(c);
	y = bits.bex(x);
	z = bits.cut(zero, d, x, b);

	e = bits.add(y, z);
	w = bits.add(c, c);
	y = bits.add(w, e);
	z = bits.add(d, x);

	p = bits.add(w, e);
	q = bits.cut(zero, z, e, b);

	return new Cell(p, q);
}

function cue_in(m, a, b) {
  var x,c,p,q,l,u,v,w,y,p,q,d,x;

  if ( zero.equals(bits.cut(zero, b, one, a)) ) {
    x = bits.add(b, one);
    c = rub(x, a);
    p = bits.add(c.head, one);
    q = c.tail;
    m.insert(b, q);
  }
  else {
    c = bits.add(two, b);
    l = bits.add(one, b);

    if ( zero.equals(bits.cut(zero, l, one, a)) ) {
      u = cue_in(m, a, c);
      x = bits.add(u.head, c);
      v = cue_in(m, a, x);
      w = new Cell(u.tail.head, v.tail.head);
      y = bits.add(u.head, v.head);
      p = bits.add(two, y);
      q = w;
      m.insert(b, q);
    }
    else {
      d = rub(c, a);
      x = m.get(d.tail);

      if ( undefined === x ) {
        throw new Error("Bail");
      }

      p = bits.add(two, d.head);
      q = x;
    }
  }
  return new Cell(p, new Cell(q, zero));
}

function cue(a) {
  return cue_in(new NounMap(), a, zero).tail.head;
}

function jam(n) {
}

module.exports = {
  cue: cue,
  jam: jam
};
