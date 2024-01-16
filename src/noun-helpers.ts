import { Atom, Cell } from "./noun";
import type { Noun } from "./noun";

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
export type EnjsFunction = (n: Noun) => Json;
type frondOpt = { tag: string; get: EnjsFunction };

const frond = function (opts: frondOpt[]): EnjsFunction {
  return function (noun) {
    if (!(noun instanceof Cell && noun.head instanceof Atom)) {
      throw new Error("frond: noun not cell");
    }
    const tag = Atom.cordToString(noun.head);
    for (let i = 0; i < opts.length; i++) {
      if (tag === opts[i].tag) {
        return { [tag]: opts[i].get(noun.tail) };
      }
    }
    throw new Error("frond: unknown tag" + tag);
  };
};
type PairCell = { nom: string; get: EnjsFunction };
const pairs = function (cels: PairCell[]): EnjsFunction {
  return function (noun) {
    let i = 0;
    let o: Record<string, Json> = {};
    while (i < cels.length - 1) {
      if (!(noun instanceof Cell)) {
        throw new Error("pairs: noun too shallow");
      }
      o[cels[i].nom] = cels[i].get(noun.head);
      noun = noun.tail;
      i++;
    }
    o[cels[i].nom] = cels[i].get(noun);
    return o;
  };
};

const pair = function (
  na: string,
  ga: EnjsFunction,
  nb: string,
  gb: EnjsFunction
): EnjsFunction {
  return pairs([
    { nom: na, get: ga },
    { nom: nb, get: gb },
  ]);
};

const bucwut = function (opts: EnjsFunction[]): EnjsFunction {
  return function (noun) {
    for (let i = 0; i < opts.length; i++) {
      try {
        const res = opts[i](noun);
        return res;
      } catch (e) {
        continue;
      }
    }
    throw new Error("bucwut: no matches");
  };
};
const array = function (item: EnjsFunction): (n: Noun) => Json[] {
  return function (noun) {
    let a: Json[] = [];
    while (noun instanceof Cell) {
      a.push(item(noun.head));
      noun = noun.tail;
    }
    return a;
  };
};

const tree = function (item: EnjsFunction): (n: Noun) => Json[] {
  return function (noun) {
    let a: Json[] = [];
    if (noun instanceof Cell) {
      if (!(noun.tail instanceof Cell)) {
        throw new Error("tree: malformed");
      }
      a = [
        ...a,
        item(noun.head),
        ...tree(item)(noun.tail.head),
        ...tree(item)(noun.tail.tail),
      ];
    }
    return a;
  };
};

const cord = function (noun: Noun): string {
  if (!(noun instanceof Atom)) {
    throw new Error("cord: noun not atom");
  }
  return Atom.cordToString(noun);
};

const numb = function (atom: Atom): number | string {
  if (!(atom instanceof Atom)) {
    throw new Error("numb: noun not atom");
  }
  return atom.valueOf();
};

const loob = function (noun: Noun): boolean | void {
  return noun.loob();
};

const nill = function (noun: Noun): null {
  if (!(noun instanceof Atom && noun.number === 0n)) {
    throw new Error("nill: not null");
  }
  return null;
};

const path = array(cord);

const enjs = {
  frond,
  pairs,
  pair,
  array,
  loob,
  tree,
  cord,
  numb,
  path,
  bucwut,
  nill,
};

//

function list(args :any[]): Noun {
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
  dwim,
  list,
}

export { enjs, dejs, dwim };
