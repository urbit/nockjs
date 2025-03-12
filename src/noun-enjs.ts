import { Atom, Cell } from "./noun";
import type { Noun } from "./noun";
import { bitLength } from "./bigint";

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
export type EnjsFunction = (n: Noun) => Json;
type frondOpt = { tag: string; get: EnjsFunction };

const frond = function (opts: frondOpt[]): EnjsFunction {
  return function (noun) {
    if (!(noun instanceof Cell && noun.head instanceof Atom)) {
      throw new Error("frond: noun not cell with tag head");
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

const tuple = function(funs: EnjsFunction[]): EnjsFunction {
  return function (noun) {
    let i = 0;
    let o = [];
    while (i < funs.length - 1) {
      if (noun.isAtom()) {
        throw new Error("tuple: noun too shallow");
      }
      o.push(funs[i](noun.head));
      noun = noun.tail;
      i++;
    }
    o.push(funs[i](noun));
    return o;
  }
}

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

//  buccen: like frond, but without the wrapper object
const buccen = function (opts: frondOpt[]): EnjsFunction {
  return function (noun) {
    if (!(noun instanceof Cell && noun.head instanceof Atom)) {
      throw new Error("buccen: noun not cell with tag head");
    }
    const tag = Atom.cordToString(noun.head);
    for (let i = 0; i < opts.length; i++) {
      if (tag === opts[i].tag) {
        return opts[i].get(noun.tail);
      }
    }
    throw new Error("buccen: unknown tag: " + tag);
  };
};

//  (list *) -> any[]
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

//  (tree *) -> any[]
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
    throw new Error(`cord: noun not atom ${noun.toString()}`);
  }
  return Atom.cordToString(noun);
};

const tape = function (noun: Noun): string {
  return (array(((n: Noun) => {
    if (n.isCell()) {
      throw new Error("tape: malformed");
    }
    return Atom.cordToString(n);
  }))(noun)).join();
}

const numb = function (noun: Noun): number | string {
  if (!(noun instanceof Atom)) {
    throw new Error("numb: noun not atom");
  }
  if (bitLength(noun.number) <= 32) {
    return Number(noun.number);
  } else {
    return noun.number.toString();
  }
};

const numb32 = function (noun: Noun): number {
  if (!(noun instanceof Atom)) {
    throw new Error("numb32: noun not atom");
  }
  if (bitLength(noun.number) > 32) {
    throw new Error("numb32: number too big");
  }
  return Number(noun.number);
}

const numbString = function (noun: Noun): string {
  if (!(noun instanceof Atom)) {
    throw new Error("numbString: noun not atom");
  }
  return noun.number.toString();
}

const loob = function (noun: Noun): boolean {
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
  tuple,
  pairs,
  pair,
  array,
  loob,
  tree,
  cord,
  tape,
  numb,
  numb32,
  numbString,
  path,
  buccen,
  bucwut,
  nill,
};

export { enjs };
