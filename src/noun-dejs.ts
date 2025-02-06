import { Atom, Cell } from "./noun";
import type { Noun } from "./noun";

function list(args: any[]): Noun {
  if (args.length === 0) return Atom.zero;
  return dwim([...args, Atom.zero]);
}

type Atomizable = number | string | Atom;

// "Do What I Mean"
function dwim(a: number): Atom;
function dwim(a: string): Atom;
function dwim(a: Atomizable, b: Atomizable): Cell<Atom, Atom>;
function dwim(
  a: Atomizable,
  b: Atomizable,
  c: Atomizable
): Cell<Atom, Cell<Atom, Atom>>;
function dwim(a: Atomizable, ...b: any[]): Cell<Atom, Cell<Noun, Noun>>;
function dwim(...a: any[]): Cell<Noun, Noun>;
// implementation
function dwim(...args: any[]): Noun {
  const n = args.length === 1 ? args[0] : args;
  if (n instanceof Atom || n instanceof Cell) return n;
  if (typeof n === "number") {
    return Atom.fromInt(n);
  } else if (typeof n === "string") {
    return Atom.fromCord(n);
  } else if (Array.isArray(n)) {
    if (n.length < 2) {
      return dwim(n[0]);
    }
    const head = dwim(n[n.length - 2]);
    const tail = dwim(n[n.length - 1]);
    let cel = new Cell(head, tail);
    for (var j = n.length - 3; j >= 0; --j) {
      cel = new Cell(dwim(n[j]), cel);
    }
    return cel;
  } else if (n === null) {
    return Atom.zero;
  }
  //  objects, undefined, etc
  console.error("what do you mean??", typeof n, JSON.stringify(n));
  throw new Error('dwim, but meaning unclear');
}

const dejs = {
  nounify: dwim,
  dwim,
  list,
};

export { dejs };
