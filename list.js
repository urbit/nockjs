var noun = require('./noun.js'),
    Cell = noun.Cell,
    zero = noun.Atom.yes;

function flop(a) {
	var b = zero;

	while ( true ) {
		if ( zero.equals(a) ) {
			return b;
		}
		else if ( !a.deep ) {
      throw new Error("Bail");
		}
		else {
      b = new Cell(a.head, b);
      a = a.tail;
		}
	}
}

module.exports = {
  flop: flop,
};
