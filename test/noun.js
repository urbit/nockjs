var tap = require('tap');
var noun = require('../noun.js');
var BigInteger = require('jsbn').BigInteger;

function is(a, b, msg) {
  if ( a.equals(b) ) {
    tap.pass(msg);
    return true;
  }
  else {
    tap.fail(msg);
    tap.comment("got:      " + b.toString());
    tap.comment("expected: " + a.toString());
    return false;
  }
}

function randomAtom() {
  var c, i, bytes = Math.floor(Math.random() * 4) + 1;
  var c = new BigInteger();
  var d = new BigInteger();
  c.fromInt(0);
  for ( i = 0; i < bytes; ++i ) {
    d.fromInt(Math.floor(Math.random() * 0xff));
    c = c.shiftLeft(8);
    c = c.xor(d);
  }
  return new noun.Atom.Atom(c);
}

function randomCell(depth) {
  return new noun.Cell(randomNoun(depth+1), randomNoun(depth+1));
}

function randomNoun(depth) {
  if ( depth > 10 || Math.random() > 0.5) {
    return randomAtom();
  }
  else {
    return randomCell(depth);
  }
}

module.exports = {
  is: is,
  randomNoun: randomNoun,
  randomCell: randomCell,
  randomAtom: randomAtom
};
