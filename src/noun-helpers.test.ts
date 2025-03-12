import { FaceAxes, FaceMask, dwim, experimental as x } from "./noun-helpers";
import { Atom, Noun } from "./noun";

test('experimental face mask helpers', () => {
  // simple left-right
  expect(x.mask(['a', 'b']))
  .toEqual({ 'a': Atom.two, 'b': Atom.three });

  // auto-consed
  expect(x.mask(['a', '', 'b']))
  .toEqual({ 'a': Atom.two, 'b': Atom.fromInt(7) });

  // must match manual consing
  expect(x.mask(['a', '', 'b']))
  .toEqual(x.mask(['a', [[], 'b']]))

  // deep left
  expect(x.mask([[['a', ''], ''], 'b']))
  .toEqual({ 'a': Atom.fromInt(8), 'b': Atom.three });

  // grabbing
  const a: FaceMask = [[['a', ''], ''], 'b'];
  const n: Noun = dwim(a);
  const m: FaceAxes = x.mask(a);
  expect(x.grab(m, n, 'a'))
  .toEqual(Atom.fromCord('a'));
  expect(x.grab(m, n, 'b'))
  .toEqual(Atom.fromCord('b'));
});
