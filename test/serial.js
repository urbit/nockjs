var serial = require('../serial.js'),
    noun   = require('../noun.js'),
    n      = noun.dwim,
    test   = require('tape'),
    check  = require('tape-check').check,
    nounT  = require('./noun.js');

test('examples', function(t) {
  t.plan(4);
  nounT.equals(t, serial.jam(n(42)), n(5456), 'jam 1');
  nounT.equals(t, serial.cue(n(5456)), n(42), 'cue 1');
  nounT.equals(t, serial.jam(n('foo', 'bar')), noun.Atom.fromString('1054973063816666730241'), 'jam 2');
  nounT.equals(t, serial.cue(noun.Atom.fromString('1054973063816666730241')), n('foo', 'bar'), 'cue 2');
});

test('generative', check(nounT.genNoun, function(t, n) {
  t.plan(1);
  nounT.equals(t, serial.cue(serial.jam(n)), n, 'round trip');
}));
