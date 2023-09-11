import { Atom, Cell, Noun } from "./noun";

function flop(a: Noun): Noun {
  var b: Noun = Atom.zero;

  while (true) {
    if (Atom.zero.equals(a)) {
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
    if (Atom.zero.equals(n)) {
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
