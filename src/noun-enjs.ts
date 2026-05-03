import { Atom, Cell } from "./noun";
import type { Noun } from "./noun";
import { bitLength } from "./bigint";

export type EnjsFunction<T> = (n: Noun) => T;
type frondOpt<T> = { tag: string; get: EnjsFunction<T> };

//TODO  support generics, ie frondOpt<T>, enjsfunction<T>, etc

function frond<T>(opts: frondOpt<T>[]): EnjsFunction<{[key: string]: T}> {  //TODO  how useful is the genericity here?
  return function (noun) {
    if (!(noun.isCell() && noun.head.isAtom())) {
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

function tuple<T>(funs: EnjsFunction<T>[]): EnjsFunction<T[]> {  //TODO  how useful is the genericity here?
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

type PairCell<T> = { nom: string; get: EnjsFunction<T> };  //TODO  how useful is the genericity here?
function pairs<T>(cels: PairCell<T>[]): EnjsFunction<Record<string, T>> {
  return function (noun) {
    let i = 0;
    let o: Record<string, T> = {};
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
function pair<T>(  //TODO  how useful is the genericity here?
  na: string,
  ga: EnjsFunction<T>,
  nb: string,
  gb: EnjsFunction<T>
): EnjsFunction<Record<string,T>> {
  return pairs([
    { nom: na, get: ga },
    { nom: nb, get: gb },
  ]);
};

function bucwut<T>(opts: EnjsFunction<T>[]): EnjsFunction<T> {  //TODO  how useful is the genericity here?
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

//TODO  alias for non-hooners
//  buccen: like frond, but without the wrapper object
function buccen<T>(opts: frondOpt<T>[]): EnjsFunction<T> {  //TODO  how useful is the genericity here?
  return function (noun) {
    if (!(noun instanceof Cell && noun.head.isAtom())) {
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
function array<T>(item: EnjsFunction<T>): EnjsFunction<T[]> {
  return function (noun) {
    let a: T[] = [];
    while (noun instanceof Cell) {
      a.push(item(noun.head));
      noun = noun.tail;
    }
    return a;
  };
};

//  (tree *) -> any[]
function tree<T>(item: EnjsFunction<T>): EnjsFunction<T[]> {
  return function (noun) {
    if (noun instanceof Cell) {
      if (!(noun.tail instanceof Cell)) {
        throw new Error("tree: malformed");
      }
      return [
        ...tree(item)(noun.tail.tail),
        item(noun.head),
        ...tree(item)(noun.tail.head),
      ];
    }
    return [];
  };
};

function map<K extends PropertyKey, V>(key: EnjsFunction<K>, value: EnjsFunction<V>): EnjsFunction<Record<K,V>> {
  return function (noun) {
    return Object.fromEntries(tree((noun) => {
      if (noun.isAtom()) {
        throw new Error("map: malformed");
      }
      return [key(noun.head), value(noun.tail)];
    })(noun));
  };
}

function unit<T>(item: EnjsFunction<T>): EnjsFunction<T | null> {
  return function (noun) {
    if (noun.isAtom()) return null;
    return item(noun.tail);
  };
}

//REVIEW  gives reverse order string?
const cord = function (noun: Noun): string {
  if (!(noun.isAtom())) {
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
  if (!(noun.isAtom())) {
    throw new Error("numb: noun not atom");
  }
  if (bitLength(noun.number) <= 32) {
    return Number(noun.number);
  } else {
    return noun.number.toString();
  }
};

const numb32 = function (noun: Noun): number {
  if (!(noun.isAtom())) {
    throw new Error("numb32: noun not atom");
  }
  if (bitLength(noun.number) > 32) {
    throw new Error("numb32: number too big");
  }
  return Number(noun.number);
}

const numbString = function (noun: Noun): string {
  if (!(noun.isAtom())) {
    throw new Error("numbString: noun not atom");
  }
  return noun.number.toString();
}

const bigint = function (noun: Noun): bigint {
  if (noun.isCell()) {
    throw new Error("bigint: noun not atom");
  }
  return noun.number;
}

const loob = function (noun: Noun): boolean {
  return noun.loob();
};

const nill = function (noun: Noun): null {
  if (!(noun.isAtom() && noun.number === 0n)) {
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
  map,
  unit,
  cord,
  tape,
  numb,
  numb32,
  numbString,
  bigint,
  path,
  buccen,
  bucwut,
  nill,
};

export { enjs };
