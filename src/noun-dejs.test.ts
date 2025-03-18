import { Atom } from "./noun";
import { dwim } from "./noun-dejs";

test('dwim with bigints', () => {
  expect(dwim(123n)).toEqual(new Atom(123n));
});
