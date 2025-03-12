import { enjs } from "./noun-enjs";
import { dejs } from "./noun-dejs";
import { Atom, Noun } from "./noun";
import bits from "./bits";
const dwim = dejs.dwim;

export type FaceMask = string | FaceMask[];
export type FaceAxes = { [key: string]: Atom };
const mask = ( face: FaceMask,
               axis: Atom = Atom.one,
               axes: FaceAxes = {}
             ): FaceAxes => {
  if (typeof face === 'string') {
    if (face === '') return axes;
    axes[face] = axis;
    return axes;
  } else {
    if (face.length === 0) return axes;
    if (face.length === 1) {
      return mask(face[0], axis, axes);
    } else {
      const left = bits.lsh(Atom.zero, Atom.one, axis);
      axes = mask(face[0], left, axes);
      return mask(face.slice(1), left.bump(), axes);
    }
  }
}
const grab = (axes: FaceAxes, noun: Noun, face: string): Noun => {
  return noun.at(axes[face]);
}

const experimental = {
  mask, grab
}

export { enjs, dejs, dwim, experimental };
