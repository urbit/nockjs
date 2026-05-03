import { EnjsFunction, enjs } from "./noun-enjs";
import { dejs } from "./noun-dejs";
import { Atom, Noun } from "./noun";
import bits from "./bits";
const dwim = dejs.dwim;

export type FaceMask = string | FaceMask[];
export type FaceAxes = { [key: string]: Atom };
function mask( face: FaceMask,
               axis: Atom = Atom.one,
               axes: FaceAxes = {}
             ): FaceAxes {
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
function grab(axes: FaceAxes, noun: Noun, face: string): Noun {
  return noun.at(axes[face]);
}

function plan(face: FaceMask): (n: Noun)=>(f: string)=>Noun {
  const axes = mask(face);
  return (noun: Noun) => {
    return (face: string) => {
      return grab(axes, noun, face);
    };
  };
}

type resolved<T extends { [key: PropertyKey]: (...args: any) => any }> = {
  [K in keyof T]: ReturnType<T[K]>
}
function destructure<T extends { [key: PropertyKey]: (arg: Noun) => any }>
  (faces: FaceMask, cells: T): (n: Noun) => {
    //NOTE  in-lining $resolved here makes type hint prettier
    [K in keyof T]: ReturnType<T[K]>
  } {
  const p = plan(faces);
  return function (noun: Noun): resolved<T> {
    let o = {} as resolved<T>;
    let g = p(noun);
    for (const k in cells) {
      o[k] = cells[k](g(k));
    }
    return o;
  };
}

const experimental = {
  mask, grab, plan, destructure
}

export { enjs, dejs, dwim, experimental };
