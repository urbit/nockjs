import { Atom, Cell, isNoun } from "./noun";
import type { Noun } from "./noun";
import { putIn, putBy } from "./noun-std";

//  primitives

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
  if (isNoun(n)) return n;
  if (typeof n === "number") {
    return Atom.fromInt(n);
  } else if (typeof n === "bigint") {
    return new Atom(n);
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

//  structures

function list(args: any[]): Noun {
  if (args.length === 0) return Atom.zero;
  return dwim([...args, Atom.zero]);
}

function set(args: any[]): Noun {
  if (args.length === 0) return Atom.zero;
  let set: Noun = Atom.zero;
  for (let arg of args) {
    set = putIn(set, dwim(arg));
  }
  return set;
}

function map(args: {key: any, val: any}[]): Noun {
  if (args.length === 0) return Atom.zero;
  let map: Noun = Atom.zero;
  for (let arg of args) {
    map = putBy(map, dwim(arg.key), dwim(arg.val));
  }
  return map;
}

const dejs = {
  nounify: dwim,
  dwim,
  list,
  set,
  map
};

export { dejs, dwim };
