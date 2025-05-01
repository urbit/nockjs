import { dwim, enjs } from "./noun-helpers";
import { putIn } from "./noun-std";
import { Atom, Noun } from "./noun";
import { EnjsFunction } from "./noun-enjs";

function expectEnjs<T>(n: Noun, f: EnjsFunction, r: T) {
  expect(f(n)).toEqual<T>(r);
}

test('tuple', () => {
  const n = enjs.numb32;
  const p = enjs.tuple([n, n]);

  // single noun
  expectEnjs(
    Atom.one,
    enjs.tuple([n]),
    [1]
  );

  // three-tuple
  expectEnjs(
    dwim(1, 2, 3),
    enjs.tuple([n, n, n]),
    [1, 2, 3]
  );

  // two-tuple with depth
  expectEnjs(
    dwim(1, 2, 3),
    enjs.tuple([n, p]),
    [1, [2, 3]]
  );

  // three-tuple with depth
  expectEnjs(
    dwim(1, [2, 3], 4),
    enjs.tuple([n, p, n]),
    [1, [2, 3], 4]
  );
});

test('pairs', () => {
  const n = enjs.numb32;
  const p = enjs.pairs([{nom: 'x', get: n}, {nom: 'y', get: n}]);
  const m = (i: string) => {return {nom: i, get: n}};

  // single noun
  expectEnjs(
    Atom.one,
    enjs.pairs([{nom: 'a', get: n}]),
    { a: 1 }
  );

  // three-tuple
  expectEnjs(
    dwim(1, 2, 3),
    enjs.pairs([{nom: 'a', get: n}, {nom: 'b', get: n}, {nom: 'c', get: n}]),
    { a: 1, b: 2, c: 3 }
  );

  // two-tuple with depth
  expectEnjs(
    dwim(1, 2, 3),
    enjs.pairs([{ nom: 'a', get: n }, { nom: 'b', get: p }]),
    { a: 1, b: {x: 2, y: 3} }
  );

  // three-tuple with depth
  expectEnjs(
    dwim(1, [2, 3], 4),
    enjs.pairs([{ nom: 'a', get: n }, { nom: 'b', get: p }, { nom: 'c', get: n }]),
    { a: 1, b: { x: 2, y: 3 }, c: 4 }
  );
});

test('array', () => {
  const f = enjs.array(enjs.cord);

  // empty noun list
  expectEnjs<string[]>(Atom.zero, f, []);

  // single item noun list
  expectEnjs<string[]>(dwim('a', 0), f, ['a']);

  // many items noun list
  expectEnjs<string[]>(
    dwim('a', 'b', 'c', 0),
    f,
    ['a', 'b', 'c']
  );
});

test('tree', () => {
  const f = enjs.tree(enjs.numb32);

  // empty noun set
  expectEnjs<number[]>(Atom.zero, f, []);

  // single item noun set
  expectEnjs<number[]>(dwim(1, 0, 0), f, [1]);

  // many items noun set
  const nums = [1, 2, 3, 4, 5, 6, 7];
  const ex = [4, 3, 2, 1, 6, 7, 5];  //  matches ~(tap in s) order
  let set: Noun = Atom.zero;
  for (let num of nums) {
    set = putIn(set, Atom.fromInt(num));
  };
  expectEnjs<number[]>(set, f, ex);
});
