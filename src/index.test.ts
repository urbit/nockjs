import { jam, cue } from "./serial";
import bits from "./bits";
import { dwim } from "./noun-helpers";
import { Atom, Cell, Noun } from "./noun";
import compiler from "./compiler";
import { bigIntFromStringWithRadix } from "./bigint";
import { NounMap } from "./hamt";

function areNounsEqual(a: unknown, b: unknown): boolean | undefined {
  const isANoun = a instanceof Atom || a instanceof Cell;
  const isBNoun = b instanceof Atom || b instanceof Cell;

  if (isANoun && isBNoun) {
    return a.equals(b);
  } else if (isANoun === isBNoun) {
    return undefined;
  } else {
    return false;
  }
}

//NOTE  for some reason, this function isn't in the ts defs yet
(expect as any).addEqualityTesters([areNounsEqual]);

//  Follow ports of all tests from frodwith/nockjs in /test folder.
// bits.js
test("bits", () => {
  const ok = [...Array(10000)].reduce((acc, a, i) => {
    const tom = Atom.fromInt(i);
    const bytes = bits.atomToBytes(tom);
    const words = bits.atomToWords(tom);
    const bytesToTom = bits.bytesToAtom(bytes);
    const wordsToTom = bits.wordsToAtom(words);
    const gud = tom.equals(bytesToTom) && tom.equals(wordsToTom);
    return gud ? acc : false;
  }, true)
  expect(ok).toBeTruthy()
})
//  ack.js
test("ack", () => {
  const hex =
    "6eca1c00a1bac286c86483dc21dc324164dbf18777e361a371d5186b441bf187fe30f5b1b0bc071d5186b441bf1870028700287bb287d612eb0a1b21920e2aa1b26ce8a1af7086c8648384a86bdc21b21920c00a1e6364278c2598964324180143986482c9abdc21b21920b47a87df8db85d87484cc2e109efc6dc2ec38b4e2c9afc37e30ef8971b2b23c071e8e6c2cdf0168837e30f2643241f213dc21b9421b21920f1097ea13225b85d876266164dc5937bf1b26e2d8b26bf0b8b26eb63616bf818bf0b041";
  const pill = Atom.fromString(hex, 16);
  const formula = cue(pill);
  const woJet = new compiler.Context();
  let jetCalled = false;
  const getSample = Atom.fragmenter(dwim(6))
  const jet = (core: Noun) => {
    jetCalled = true;
    return bits.dec(getSample(core));
  }
  const subject = dwim(2, 2);
  const subject2 = dwim(3, 9)
  const unjetted = woJet.nock(subject, formula as any);
  const formula2 = cue(pill);
  const withJet = new compiler.Context(["kack", null, [["dec", jet]]] as any);
  const jetted2 = withJet.nock(subject2, formula2 as any);
  expect(unjetted).toEqual(Atom.fromInt(7))
  expect(jetted2).toEqual(Atom.fromInt(4093))
  expect(jetCalled).toBeTruthy
});
// add.js
test("add", () => {
  const hex =
    "829878621bce21b21920c888730c9059367e61cfcc39f98721920f9099110dd6986c86483c425fa84c8886dc2ec3b1330b26e2c9b478d937168f1b26e4e1887ab8e61b213c612cc4b21920fc4dc324164d5912c86483a425c21362dc2ec38b4e2c9ae2b041";
  const pill = Atom.fromString(hex, 16);
  const formula = cue(pill);
  const con = new compiler.Context();
  const randInt = () => Math.floor(Math.random() * 100);
  const tries = [...Array(100)].reduce(
    (acc, _) => {
      const a = randInt(),
        b = randInt();
      const subject = dwim(a, b);
      const n = Number((con.nock(subject, formula as any) as Atom).number);
      const j = a + b;
      const nock = [...acc.nock, n];
      const js = [...acc.js, j];
      return { nock, js };
    },
    { nock: [], js: [] }
  );
  expect(tries.nock).toStrictEqual(tries.js);
});
// // serial.js
test("jamming and cueing", () => {
  // examples
  const toJam = [dwim(42), dwim("foo", "bar")];
  const jammed = toJam.map((a) => jam(a));
  const toCue = [dwim(5456), Atom.fromString("1054973063816666730241")];
  const cued = toCue.map((a) => cue(a));
  const hex =
    "829878621bce21b21920c888730c9059367e61cfcc39f98721920f9099110dd6986c86483c425fa84c8886dc2ec3b1330b26e2c9b478d937168f1b26e4e1887ab8e61b213c612cc4b21920fc4dc324164d5912c86483a425c21362dc2ec38b4e2c9ae2b041";
  const addPill = new Atom(bigIntFromStringWithRadix(hex, 16));
  expect(jammed).toStrictEqual(toCue);
  expect(cued).toStrictEqual(toJam);
  expect(jam(cue(addPill)).equals(addPill)).toBeTruthy();
  // generative
  let good = true;
  for (let i = 0; i < 1000; i++) {
    const atom = dwim(i);
    const j = jam(atom);
    const c = cue(j);
    if (!atom.equals(c)) good = false;
  }
  expect(good).toBeTruthy();
});
// // hamt.js
test("maps work like maps", () => {
  const m = new NounMap();
  const num1 = Math.ceil(Math.random() * 1000);
  const num2 = Math.ceil(Math.random() * 1000);
  const num3 = Math.ceil(Math.random() * 1000);
  const atom1 = new Atom(BigInt(num1));
  const atom2 = new Atom(BigInt(num2));
  const atom3 = new Atom(BigInt(num3));
  m.insert(atom1, atom2);
  m.insert(atom3, atom1);
  expect(m.get(atom1).equals(atom2)).toBeTruthy();
  expect(m.get(atom3).equals(atom1)).toBeTruthy();
});
// // decrement.js
test("decrement", () => {
  const context = new compiler.Context();
  const formula = dwim(
    8,
    [
      1,
      8,
      [1, 0],
      [
        1,
        8,
        [1, 0],
        8,
        [
          1,
          8,
          [4, 0, 6],
          6,
          [5, [0, 62], 0, 2],
          [0, 14],
          9,
          2,
          [0, 6],
          [0, 2],
          0,
          15,
        ],
        9,
        2,
        0,
        1,
      ],
      0,
      1,
    ],
    8,
    [9, 2, 0, 1],
    9,
    2,
    [0, 4],
    [7, [0, 3], 1, 43],
    0,
    11
  );
  const product = context.nock(dwim(0), formula);
  expect(product.equals(dwim(42))).toBeTruthy();
});
