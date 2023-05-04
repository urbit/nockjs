import { atom, Atom, Cell, Noun } from "./noun.js";

function flop(a: Noun): Noun {
  var b: Noun = atom.zero;

  while (true) {
    if (atom.zero.equals(a)) {
      return b;
    } else if (a instanceof Atom) {
      throw new Error("Bail");
    } else {
      b = new Cell(a.head, b);
      a = a.tail;
    }
  }
}

function forEach(n: Noun, f: Function): void {
  while (true) {
    if (atom.zero.equals(n)) {
      return;
    } else if (n instanceof Atom) {
      throw new Error("Bail");
    } else {
      f(n.head);
      n = n.tail;
    }
  }
}

export default {
  flop,
  forEach,
};
