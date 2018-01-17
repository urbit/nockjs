var tap = require('tap');
var noun = require('../noun.js');
var nounT = require('./noun.js');
var n = noun.dwim;
var NounMap = require('../hamt.js').NounMap;
var m = new NounMap();
var BigInteger = require('jsbn').BigInteger;

tap.plan(2001);

m.insert(n(42), n(0));
nounT.is(m.get(n(42)), n(0), "42->0");

for ( var i = 0; i < 1000; ++i ) {
  var key = nounT.randomNoun(0);
  var one = nounT.randomNoun(0);
  var two = nounT.randomNoun(0);
  m.insert(key, one);
  var got = m.get(key);
  if ( null == got ) {
    tap.fail(i+"1");
    tap.comment(key.toString());
    break;
  }
  else if ( !nounT.is(got, one, i+"1") ) {
    break;
  }
  m.insert(key, two);
  got = m.get(key);
  if ( null == got ) {
    tap.fail(i+"2");
    tap.comment(key.toString());
    break;
  }
  else if ( !nounT.is(got, two, i+"2") ) {
    break;
  }
}
