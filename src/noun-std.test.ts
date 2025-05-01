import { Atom } from "./noun";
import { dwim } from "./noun-dejs";
import { gor, mug, muk, mum } from "./noun-std";

test('muk', () => {
  expect(muk(1, 1, 1n)).toEqual(693974893);
  expect(muk(1, 1, 2n)).toEqual(4060016154);
  expect(muk(1, 5, 1n)).toEqual(1780509900);  //  with leading zeroes
  expect(muk(0xadad, 5, 0n)).toEqual(4246510562);
  expect(muk(0xadad, 6, 0n)).toEqual(3057589246);
  expect(muk(0xcafebeef, 1, 1n)).toEqual(2899939719);
  expect(muk(0xcafebeef, 6, 0n)).toEqual(3011575808);
});

test('mum', () => {
  expect(mum(1, 2, 3n)).toEqual(1940255468);
  expect(mum(0xcafebabe, 0x7fff, 1n)).toEqual(1901865568);
  expect(mum(0xcafebabe, 0x7fff, 0n)).toEqual(2046756072);  //  zero as zero bytes
  expect(mum(0xdeadbeef, 0xfffe, 1n)).toEqual(724918415);
  expect(mum(0xdeadbeef, 0xfffe, 0x718b9468715c2a60n)).toEqual(1781973465);
});

test('mug', () => {
  expect(mug(Atom.zero)).toEqual(2046756072);
  expect(Atom.one.mug()).toEqual(1901865568);
  expect(mug(dwim([1, 2]))).toEqual(1781973465);
  expect(dwim([1, 2]).mug()).toEqual(1781973465);
  expect(dwim([[0, 1], [2, 3]]).mug()).toEqual(763600239);
});

test('gor', () => {
  expect(gor(Atom.zero, Atom.one)).toBeFalsy();
  expect(gor(Atom.one, Atom.zero)).toBeTruthy();
  expect(gor(Atom.zero, dwim(Atom.zero, Atom.zero))).toBeFalsy();
});
