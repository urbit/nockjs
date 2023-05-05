import oldSerial from "../js/serial";
import oldNoun from "../js/noun";
import oldContext from "../js/compiler";
import { jam, cue } from "../dist/serial";
import oldBits from "../js/bits";
import newBits from "../dist/bits";
import { dwim } from "../dist/noun-helpers";
import { atom, Atom, Noun } from "../dist/noun";
import compiler from "../dist/compiler";

const n = oldNoun.dwim;

test("jamming", () => {
  const oAtoms = [n(42), n("foo")];
  const nAtoms = [dwim(42), dwim("foo")];
  const oldJam = oAtoms.map((a) => {
    const atom = oldSerial.jam(a);
    return atom.toString();
  });
  const newJam = nAtoms.map((a) => {
    const atom = jam(a);
    return atom.toString();
  });
  expect(oldJam).toStrictEqual(newJam);
});
test("cueing", () => {
  const oldAtoms = [n(5456), oldNoun.Atom.fromString("1054973063816666730241")];
  const newAtoms = [dwim(5456), atom.fromString("1054973063816666730241", 10)];
  const oldCues = oldAtoms.map((a) => {
    const cue = oldSerial.cue(a);
    return cue.toString();
  });
  const newCues = newAtoms.map((a) => {
    const c = cue(a);
    return c.toString();
  });
  expect(oldCues).toStrictEqual(newCues);
});
test("add", () => {
  const hex =
    "829878621bce21b21920c888730c9059367e61cfcc39f98721920f9099110dd6986c86483c425fa84c8886dc2ec3b1330b26e2c9b478d937168f1b26e4e1887ab8e61b213c612cc4b21920fc4dc324164d5912c86483a425c21362dc2ec38b4e2c9ae2b041";
  const oldPill = oldNoun.Atom.fromString(hex, 16);
  const oldFormula = oldSerial.cue(oldPill);
  const oldcon = new oldContext.Context();
  const newPill = atom.fromString(hex, 16);
  const newFormula = cue(newPill);
  const newcon = new compiler.Context();
  const randInt = () => Math.floor(Math.random() * 100);
  const tries = [...Array(100)].reduce(
    (acc, item) => {
      const a = randInt(),
        b = randInt();
      const oldSubject = n(a, b);
      const newSubject = dwim(a, b);
      const old = [...acc.old, oldcon.nock(oldSubject, oldFormula).toString()];
      const niw = [
        ...acc.niw,
        newcon.nock(newSubject, newFormula as any).toString(),
      ];
      return { old, niw };
    },
    { old: [], niw: [] }
  );
  expect(tries.old).toStrictEqual(tries.niw);
});

test("unjetted ack", () => {
  const hex =
    "6eca1c00a1bac286c86483dc21dc324164dbf18777e361a371d5186b441bf187fe30f5b1b0bc071d5186b441bf1870028700287bb287d612eb0a1b21920e2aa1b26ce8a1af7086c8648384a86bdc21b21920c00a1e6364278c2598964324180143986482c9abdc21b21920b47a87df8db85d87484cc2e109efc6dc2ec38b4e2c9afc37e30ef8971b2b23c071e8e6c2cdf0168837e30f2643241f213dc21b9421b21920f1097ea13225b85d876266164dc5937bf1b26e2d8b26bf0b8b26eb63616bf818bf0b041";
  const oldPill = oldNoun.Atom.fromString(hex, 16);
  const oldFormula = oldSerial.cue(oldPill);
  const oldcon = new oldContext.Context();
  const newPill = atom.fromString(hex, 16);
  const newFormula = cue(newPill);
  const newcon = new compiler.Context();
  const oldSubject = n(2, 2);
  const newSubject = dwim(2, 2);
  const old = oldcon.nock(oldSubject, oldFormula).toString();
  const niw = newcon.nock(newSubject, newFormula as any).toString();
  expect(old).toStrictEqual(niw);
});

test("jetted ack", () => {
  const hex =
    "6eca1c00a1bac286c86483dc21dc324164dbf18777e361a371d5186b441bf187fe30f5b1b0bc071d5186b441bf1870028700287bb287d612eb0a1b21920e2aa1b26ce8a1af7086c8648384a86bdc21b21920c00a1e6364278c2598964324180143986482c9abdc21b21920b47a87df8db85d87484cc2e109efc6dc2ec38b4e2c9afc37e30ef8971b2b23c071e8e6c2cdf0168837e30f2643241f213dc21b9421b21920f1097ea13225b85d876266164dc5937bf1b26e2d8b26bf0b8b26eb63616bf818bf0b041";
  const oldPill = oldNoun.Atom.fromString(hex, 16);
  const oldFormula = oldSerial.cue(oldPill);
  const newPill = atom.fromString(hex, 16);
  const newFormula = cue(newPill);
  const getSampleOld = oldNoun.Noun.fragmenter(n(6))
  const getSampleNew = Atom.fragmenter(dwim(6))
  const time = Date.now()
  const oldJet = (core: any) => oldBits.dec(getSampleOld(core))
  const newJet = (core: Noun) => newBits.dec(getSampleNew(core)); 
  const oldcon = new oldContext.Context(["kack", null, [["dec", oldJet]]]);
  const newcon = new compiler.Context(["kack", null, [["dec", newJet]]] as any);
  const oldSubject = n(3, 9);
  const newSubject = dwim(3, 9);
  const old = oldcon.nock(oldSubject, oldFormula).toString();
  const niw = newcon.nock(newSubject, newFormula).toString();
  // much slower lol
  expect(old).toStrictEqual(niw);
});
