var tap = require('tap');
var noun = require('../noun.js');
var n = noun.dwim;
var NounMap = require('../hamt.js').NounMap;
var m = new NounMap();
var BigInteger = require('jsbn').BigInteger;

tap.plan(2001);

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

m.insert(n(42), n(0));
is(m.get(n(42)), n(0), "42->0");

for ( var i = 0; i < 1000; ++i ) {
  var key = randomNoun(0);
  var one = randomNoun(0);
  var two = randomNoun(0);
  m.insert(key, one);
  var got = m.get(key);
  if ( null == got ) {
    tap.fail(i+"1");
    tap.comment(key.toString());
    break;
  }
  else if ( !is(got, one, i+"1") ) {
    break;
  }
  m.insert(key, two);
  got = m.get(key);
  if ( null == got ) {
    tap.fail(i+"2");
    tap.comment(key.toString());
    break;
  }
  else if ( !is(got, two, i+"2") ) {
    break;
  }
}
