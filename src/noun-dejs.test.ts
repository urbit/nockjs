import { Atom } from "./noun";
import { dwim, dejs } from "./noun-dejs";

test('dwim with bigints', () => {
  expect(dwim(123n)).toEqual(new Atom(123n));
});

//NOTE  implementation relies on putIn from noun-std,
//      which is what this is _really_ testing
test('set ordering', () => {
  expect(
    dejs.set([1, 2, 3, 4, 5, 6, 7])
  ).toEqual(
    dwim([6, [7, [5, 0, 0], 0], 4, [2, [1, 0, 0], 3, 0, 0], 0])
  )
});

//NOTE  implementation relies on putBy from noun-std,
//      which is what this is _really_ testing
test('map ordering', () => {
  expect(
    dejs.map([
      { key: 1, val: 9 },
      { key: 2, val: 9 },
      { key: 3, val: 9 },
      { key: 4, val: 9 },
      { key: 5, val: 9 },
      { key: 6, val: 9 },
      { key: 7, val: 9 }
    ])
  ).toEqual(
    dwim([
      [6, 9],
      [[7, 9], [[5, 9], 0, 0], 0],
      [4, 9], [[2, 9], [[1, 9], 0, 0], [3, 9], 0, 0], 0]
    )
  )
});
