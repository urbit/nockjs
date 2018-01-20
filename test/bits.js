var nounT = require('./noun.js'),
    bits = require('../bits.js'),
    test = require('tape'),
    tchk = require('tape-check'),
    check = tchk.check;

test('bytes', check(nounT.genAtom, function (t, a) {
  t.plan(1);
  nounT.equals(t, bits.bytesToAtom(bits.atomToBytes(a)), a, 'round trip');
}));

test('words', check(nounT.genAtom, function (t, a) {
  t.plan(1);
  nounT.equals(t, bits.wordsToAtom(bits.atomToWords(a)), a, 'round trip');
}));
