import { NounMap } from "./hamt";
import { Noun, Atom, Cell } from "./noun";
import { dwim } from "./noun-helpers";
import list from "./list";
import { shortValue } from "./bigint";

const MEMO = dwim("memo");
const SLOG = dwim("slog");
const FAST = dwim("fast");
const SPOT = dwim("spot");
const MEAN = dwim("mean");
const HUNK = dwim("hunk");
const LOSE = dwim("lose");

// base classes

abstract class Statement {
  abstract toJs(): string;
}
abstract class Expression {
  abstract toJs(): string;
}

// Statements

class Block extends Statement {
  constructor(public statements: Statement[]) {
    super();
  }
  toJs(): string {
    return this.statements.reduce((acc, item) => acc + item.toJs(), "");
  }
  append(st: Statement) {
    this.statements.push(st);
  }
}
class Assignment extends Statement {
  constructor(public name: string, public expr: Expression) {
    super();
  }
  toJs(): string {
    return "var " + this.name + " = " + this.expr.toJs() + ";";
  }
}

class Bail extends Statement {
  constructor() {
    super();
  }
  toJs(): string {
    return 'throw new Error("Bail")';
  }
}

class If extends Expression {
  constructor(
    public test: string,
    public yes: Expression,
    public no: Expression
  ) {
    super();
  }
  toJs(): string {
    return (
      "if(" +
      this.test +
      ".loob()){" +
      this.yes.toJs() +
      "}else{" +
      this.no.toJs() +
      "}"
    );
  }
}
// This class does nothing and was missing a toJs method
class PutMemo extends Statement {
  constructor(public key: any, public val: any) {
    super();
  }
  toJs(): string {
    return "";
  }
}

class Push extends Statement {
  constructor(public name: string) {
    super();
  }
  toJs(): string {
    return "context.stackPush(" + this.name + ");";
  }
}
class Pop extends Statement {
  constructor() {
    super();
  }
  toJs(): string {
    return "context.stackPop()";
  }
}
class Fast extends Statement {
  constructor(public clue: string, public core: string) {
    super();
  }
  toJs(): string {
    return "context.register(" + this.core + ", " + this.clue + ");";
  }
}
class Slog extends Statement {
  constructor(public name: string) {
    super();
  }
  toJs(): string {
    return "context.slog(" + this.name + ")";
  }
}

// Expressions

class Cons extends Expression {
  constructor(public head: string, public tail: string) {
    super();
  }
  toJs(): string {
    return "context.cons(" + this.head + ", " + this.tail + ")";
  }
}

class Frag extends Expression {
  constructor(public axis: Atom, public name: string) {
    super();
  }
  toJs(): string {
    const parts = [this.name];
    for (var ax = this.axis; ax.number > 1n; ax = ax.mas()) {
      parts.push(Atom.two.equals(ax.cap()) ? "head" : "tail");
    }
    return parts.join(".");
  }
}

class Identity extends Expression {
  constructor(public name: string) {
    super();
  }
  toJs(): string {
    return this.name;
  }
}

class Constant extends Expression {
  constructor(public index: number) {
    super();
  }
  toJs(): string {
    return "constants[" + this.index + "]";
  }
}
// TODO this ain't it
class Nock extends Expression {
  constructor(
    public subject: Noun,
    public formula: Noun,
    public hasTail: boolean
  ) {
    super();
  }
  toJs(): string {
    const f = this.formula;
    const targetCode =
      "(" +
      f +
      ".hasOwnProperty('target') ? " +
      f +
      ".target : (" +
      f +
      ".target = context.compile(" +
      this.formula +
      ")))";
    return this.hasTail
      ? "context.trampoline(" + targetCode + ", " + this.subject + ")"
      : targetCode + "(" + this.subject + ")";
  }
}
class Deep extends Expression {
  constructor(public name: string) {
    super();
  }
  toJs(): string {
    return this.name + ".deep ? context.yes : context.no";
  }
}

class Bump extends Expression {
  constructor(public name: string) {
    super();
  }
  toJs(): string {
    return this.name + ".bump()";
  }
}
class Same extends Expression {
  constructor(public one: string, public two: string) {
    super();
  }
  toJs(): string {
    return (
      "(" +
      this.one +
      ".equals(" +
      this.two +
      ")" +
      " ? context.yes : context.no)"
    );
  }
}
class Kick extends Expression {
  constructor(public axis: Atom, public core: any, public hasTail: boolean) {
    super();
  }
  toJs(): string {
    const axis = this.axis.shortCode();

    return (
      "(function (cor) {" +
      "var pro, tgt, bus, arms, bat = cor.head, has = false;" +
      "if ( bat.hasOwnProperty('loc') && (tgt = bat.loc.jets[" +
      axis +
      "]) && bat.loc.fine(cor) ) {" +
      "return tgt(cor);" +
      "}" +
      "if ( bat.hasOwnProperty('arms') ) {" +
      "arms = bat.arms;" +
      "has = arms.hasOwnProperty('" +
      axis +
      "');" +
      "}" +
      "else arms = bat.arms = {};" +
      "tgt = (has ? arms['" +
      axis +
      "'] : (arms['" +
      axis +
      "'] = context.compile(" +
      new Frag(this.axis, "bat").toJs() +
      ")));" +
      "bus = cor;" +
      (this.hasTail
        ? "pro = context.trampoline(tgt, bus);"
        : "while (true) {" +
          "pro = tgt(bus);" +
          "if ( context.isTrampoline(pro) ) {" +
          "tgt = pro.target;" +
          "bus = pro.subject;" +
          "}" +
          "else break;" +
          "}") +
      "return pro;" +
      "})(" +
      this.core +
      ")"
    );
  }
}
class GetMemo extends Expression {
  constructor(public name: string) {
    super();
  }
  toJs(): string {
    return "context.getMemo(" + this.name + ")";
  }
}

class Trampoline {
  constructor(public target: Function, public subject: Noun) {}
}
class Clue {
  constructor(
    public name: string,
    public parentAxis: Atom,
    public hooks: any
  ) {}
}
type JetDriver = AxisArm | NamedArm;
class AxisArm {
  constructor(public label: string, public axis: Atom, public fn: Function) {}
}
class NamedArm {
  constructor(public label: string, public name: string, public fn: Function) {}
}
type Hooks = Record<string, Atom>;

function genFine(loc: Location): Function {
  var constants: Noun[] = [],
    out: string[] = [],
    i;
  for (i = 0; !loc.isStatic; ++i) {
    out.push("if(!constants[" + i + "].equals(a.head)){return false;}");
    constants.push(loc.noun);
    out.push("a=" + new Frag(loc.axisToParent, "a").toJs() + ";");
    loc = loc.parentLoc;
  }
  out.push("return constants[" + i + "].equals(a);");
  constants.push(loc.noun);
  var body = "return function(a){" + out.join("") + "return true;};";
  var builder = new Function("constants", body);
  return builder(constants);
}

class Location {
  public fragToParent;
  public nameToAxis;
  public axisToName: Record<string, string> = {};
  public isStatic: boolean;
  public jets: Record<string, Function> = {};
  public fine;
  constructor(
    public context: Context,
    public name: string,
    public label: string,
    public axisToParent: Atom,
    public hooks: Hooks,
    public noun: Noun,
    public parentLoc: Location
  ) {
    this.fragToParent = Atom.fragmenter(axisToParent);
    this.nameToAxis = hooks;
    this.isStatic =
      null === parentLoc || (three.equals(axisToParent) && parentLoc.isStatic);
    if (this.isStatic) this.noun = noun;
    else {
      this.noun = (noun as Cell<Noun, Noun>).head;
      this.noun.mug();
    }
    for (let k in hooks) {
      if (hooks.hasOwnProperty(k)) {
        const key = hooks[k].shortCode();
        this.axisToName[key] = k;
      }
    }
    const drivers = context.drivers[label];
    if (drivers && drivers.length > 0) {
      for (var i = 0; i < drivers.length; ++i) {
        const d = drivers[i];
        if (d instanceof AxisArm) {
          this.jets[d.axis.mas().shortCode()] = d.fn;
        } else {
          this.jets[this.nameToAxis[d.name].mas().shortCode()] = d.fn;
        }
      }
    }
    this.fine = genFine(this);
  }
}

// Context Helpers

function chum(n: Noun) {
  if (n instanceof Cell && n.head instanceof Atom && n.tail instanceof Atom) {
    return Atom.cordToString(n.head) + shortValue(n.tail.number).toString(10);
  } else if (n instanceof Atom) {
    return Atom.cordToString(n);
  } else throw new Error("wrong noun input to chum");
}
const zero = dwim(0);
const one = dwim(1);
const two = dwim(2);
const three = dwim(3);
const nine = dwim(9);
const ten = dwim(10);
const constant_zero = dwim(1, 0);
const constant_frag = dwim(0, 1);
type DriverSpec = [name: string, arms: Function | Record<string | number, Function>, children?: DriverSpec[]]
function collectFromCore(
  prefix: string,
  spec: DriverSpec,
  out: Record<string, JetDriver[]>
) {
  var name = spec[0],
    arms = spec[1],
    children = spec[2],
    labl = prefix + "/" + (name || "");
  if (arms instanceof Function) {
    out[labl] = [new AxisArm(labl, two, arms)];
  } else {
    var all = [];
    for (var k in arms) {
      if (arms.hasOwnProperty(k)) {
        all.push(
          "number" === typeof k
            ? new AxisArm(labl, dwim(k), arms[k])
            : new NamedArm(labl, k, arms[k])
        );
      }
    }
    out[labl] = all;
  }
  if (children) {
    for (var i = 0; i < children.length; ++i) {
      collectFromCore(labl, children[i], out);
    }
  }
}

function skipHints(formula: Noun) {
  while (true) {
    if (formula instanceof Cell) {
      if (ten.equals(formula.head)) {
        const f = formula as Cell<Noun, Cell<Noun, Noun>>;
        formula = f.tail.tail;
        continue;
      }
    }
    return formula;
  }
}

function parseParentAxis(noun: Noun): Atom {
  const f = skipHints(noun) as Cell<Atom, Atom>;
  if (constant_zero.equals(f)) {
    return zero;
  } else if (!zero.equals(f.head)) {
    throw new Error("weird formula head");
  } else if (!Atom.three.equals(f.tail.cap())) {
    throw new Error("weird parent axis");
  }
  return f.tail;
}

function parseHookAxis(nock: Noun): Noun | null {
  const f = skipHints(nock) as Cell<Noun, Noun>,
    op = f.head;
  if (op instanceof Atom) {
    if (zero.equals(op)) {
      if (!f.tail.deep) {
        return f.tail;
      }
    } else if (nine.equals(op)) {
      const rest = f.tail as Cell<Noun, Noun>;
      if (rest.head instanceof Atom && constant_frag.equals(rest.tail)) {
        return rest.head;
      }
    }
  }
  return null;
}

function parseHooks(noun: Noun) {
  var o: Record<string, Noun> = {};
  list.forEach(noun, function (c: Cell<Atom, Noun>) {
    var term = Atom.cordToString(c.head),
      axis = parseHookAxis(c.tail);
    if (null != axis) {
      o[term] = axis;
    }
  });
  return o;
}
//

interface CellWithTarget extends Cell<Noun, Noun> {
  target: any;
}
class Context {
  public memo = new NounMap();
  public clues = new NounMap();
  public dash = new NounMap();
  public tax: Noun = new Atom(0n);
  public yes = new Atom(0n);
  public no = new Atom(1n);
  public drivers: Record<string, JetDriver[]> = {};
  constructor(drivers?: DriverSpec) {
    if (drivers) collectFromCore("", drivers, this.drivers);
  }

  cons(h: Noun, t: Noun): Cell<Noun, Noun> {
    return new Cell(h, t);
  }
  trampoline(tgt: Function, bus: Noun): Trampoline {
    return new Trampoline(tgt, bus);
  }
  isTrampoline(a: any): boolean {
    return a instanceof Trampoline;
  }
  getMemo(key: Noun) {
    return this.memo.get(key);
  }
  putMemo(key: Noun, val: any) {
    this.memo.insert(key, val);
  }
  stackPush(item: Cell<Noun, Noun>) {
    this.tax = new Cell(item, this.tax);
  }
  stackPop() {
    if (this.tax instanceof Cell) this.tax = this.tax.tail;
    // TODO else throw error?
  }
  slog(item: any) {
    // TODO: don't rewrite ++wash again, just call the kernel
    console.log(item, "slog");
  }
  parseClue(raw: Cell<Noun, Cell<Noun, Noun>>) {
    let clue = this.clues.get(raw);
    if (clue === undefined) {
      var name = chum(raw.head),
        parentAxis = parseParentAxis(raw.tail.head),
        hooks = parseHooks(raw.tail.tail);
      clue = new Clue(name, parentAxis, hooks);
      this.clues.insert(raw, clue);
    }
    return clue;
  }
  nock(subject: Noun, formula: Noun): Noun {
    var product, target;
    if (formula instanceof Atom) throw Error("invalid formula")
    if (!formula.hasOwnProperty("target")) {
      this.compile(formula);
    }
    target = (formula as any).target;
    while (true) {
      product = target(subject);
      if (product instanceof Trampoline) {
        subject = product.subject;
        target = product.target;
      } else {
        return product;
      }
    }
  }
  register(core: Cell<Noun, Noun>, raw: Cell<Noun, Cell<Noun, Noun>>) {
    const bat = core.head;
    let loc = this.dash.get(bat);
    if (loc === undefined) {
      try {
        const clue = this.parseClue(raw);
        if (zero.equals(clue.parentAxis)) {
          loc = new Location(
            this,
            clue.name,
            "/" + clue.name,
            zero,
            clue.hooks,
            core,
            null
          );
        } else {
          const parentCore = core.at(clue.parentAxis),
            parentBattery = parentCore.head,
            parentLoc = this.dash.get(parentBattery);
          if (undefined === parentLoc) {
            console.log("register: invalid parent for " + clue.name);
          } else {
            const label = parentLoc.label + "/" + clue.name;
            loc = new Location(
              this,
              clue.name,
              label,
              clue.parentAxis,
              clue.hooks,
              core,
              parentLoc
            );
          }
        }
        (bat as any).loc = loc;
        this.dash.insert(bat, loc);
      } catch (e) {
        console.log(e);
      }
    }
  }
  compile(cell: Cell<Noun, Noun>): Function {
    let i = 0;
    const fresh = function () {
      return "v" + ++i;
    };
    const body = new Block([]);
    const constants: Noun[] = [];
    compile(cell, "subject", "product", fresh, constants, body, true);
    const text = "return function(subject){" + body.toJs() + "return product;}";
    const builder = new Function("context", "constants", text);
    return ((cell as any).target = builder(this, constants));
  }
}
function compile(
  formula: Cell<Noun, Noun>,
  subject: string, // variable name
  product: string, // variable name too
  fresh: () => string,
  constants: Noun[],
  block: Block,
  hasTail: boolean
) {
  var op, arg, one, two, odd;
  op = formula.head;
  arg = formula.tail;
  if (op instanceof Cell && arg instanceof Cell) {
    one = fresh();
    two = fresh();
    compile(op, subject, one, fresh, constants, block, false);
    compile(arg, subject, two, fresh, constants, block, false);
    block.append(new Assignment(product, new Cons(one, two)));
  } else if (op instanceof Atom)
    switch (Number(op.number)) {
      case 0:
        const a = arg as Atom;
        // if (0n === a.number) block.append(new Bail());
        // else if (1n === a) block.append(new Identity(subject));
        block.append(new Assignment(product, new Frag(a, subject)));
        break;
      case 1:
        constants.push(arg);
        block.append(
          new Assignment(product, new Constant(constants.length - 1))
        );
        break;
      case 2:
        const c2 = arg as Cell<Cell<Noun, Noun>, Cell<Noun, Noun>>;
        one = fresh();
        two = fresh();
        compile(c2.head, subject, one, fresh, constants, block, false);
        compile(c2.tail, subject, two, fresh, constants, block, false);
        block.append(
          new Assignment(product, new Nock(Atom.one, Atom.two, hasTail))
        );
        break;
      case 3:
        one = fresh();
        const c3 = arg as Cell<Cell<Noun, Noun>, Cell<Noun, Noun>>;
        compile(c3, subject, one, fresh, constants, block, false);
        block.append(new Assignment(product, new Deep(one)));
        break;
      case 4:
        one = fresh();
        const c4 = arg as Cell<Cell<Noun, Noun>, Cell<Noun, Noun>>;
        compile(c4, subject, one, fresh, constants, block, false);
        block.append(new Assignment(product, new Bump(one)));
        break;
      case 5:
        one = fresh();
        two = fresh();
        const c5 = arg as Cell<Cell<Noun, Noun>, Cell<Noun, Noun>>;
        compile(c5.head, subject, one, fresh, constants, block, false);
        compile(c5.tail, subject, two, fresh, constants, block, false);
        block.append(new Assignment(product, new Same(one, two)));
        break;
      case 6:
        odd = fresh();
        one = new Block([]);
        two = new Block([]);
        const c6 = arg as Cell<
          Cell<Noun, Noun>,
          Cell<Cell<Noun, Noun>, Cell<Noun, Noun>>
        >;
        compile(c6.head, subject, odd, fresh, constants, block, false);
        compile(c6.tail.head, subject, product, fresh, constants, one, hasTail);
        compile(c6.tail.tail, subject, product, fresh, constants, two, hasTail);
        block.append(new If(odd, one, two));
        break;
      case 7:
        const c7 = arg as Cell<Cell<Noun, Noun>, Cell<Noun, Noun>>;
        one = fresh();
        compile(c7.head, subject, one, fresh, constants, block, false);
        compile(c7.tail, one, product, fresh, constants, block, hasTail);
        break;
      case 8:
        const c8 = arg as Cell<Cell<Noun, Noun>, Cell<Noun, Noun>>;
        one = fresh();
        two = fresh();
        compile(c8.head, subject, one, fresh, constants, block, false);
        block.append(new Assignment(two, new Cons(one, subject)));
        compile(c8.tail, two, product, fresh, constants, block, hasTail);
        break;
      case 9:
        const c9 = arg as Cell<Atom, Cell<Noun, Noun>>;
        odd = c9.head;
        if (Atom.two.equals(odd.cap())) {
          one = fresh();
          two = odd.mas();
          compile(c9.tail, subject, one, fresh, constants, block, false);
          block.append(new Assignment(product, new Kick(two, one, hasTail)));
        } else {
          compile(
            dwim([7, c9.tail, 2, [0, 1], 0, odd]),
            subject,
            product,
            fresh,
            constants,
            block,
            hasTail
          );
        }
        break;
      case 10:
        const c10 = arg as Cell<Cell<Noun, Noun>, Cell<Noun, Noun>>;
        if (!(c10.head instanceof Cell)) {
          // no recognized static hints
          compile(c10.tail, subject, product, fresh, constants, block, hasTail);
        } else {
          const hint = c10.head as Cell<Cell<Noun, Noun>, Cell<Noun, Noun>>;
          const a10 = arg as Cell<Noun, Cell<Noun, Noun>>;
          var zep = c10.head.head;
          var clu = fresh();
          compile(hint.tail, subject, clu, fresh, constants, block, false);
          if (zep.equals(MEMO)) {
            var key = fresh();
            var got = fresh();
            odd = fresh();
            one = new Block([]);
            two = new Block([]);
            var konst = fresh();
            block.append(new Assignment(konst, new Constant(hint.tail as any)));
            block.append(new Assignment(key, new Cons(subject, konst)));
            block.append(new Assignment(got, new GetMemo(two as any)));
            block.append(new Assignment(odd, new Deep(got)));
            one.append(new Assignment(product, new Frag(dwim(3), got)));
            compile(c10.tail, subject, product, fresh, constants, two, false);
            two.append(new PutMemo(key, product));
            block.append(new If(odd, one, two));
          } else if (zep.equals(SLOG)) {
            block.append(new Slog(clu));
            compile(
              c10.tail,
              subject,
              product,
              fresh,
              constants,
              block,
              hasTail
            );
          } else if (zep.equals(FAST)) {
            compile(a10.tail, subject, product, fresh, constants, block, false);
            block.append(new Fast(clu, product));
          } else if (
            zep.equals(SPOT) ||
            zep.equals(MEAN) ||
            zep.equals(HUNK) ||
            zep.equals(LOSE)
          ) {
            one = fresh();
            two = fresh();
            block.append(new Assignment(one, new Constant(zep as any)));
            block.append(new Assignment(two, new Cons(one, clu)));
            block.append(new Push(two));
            compile(a10.tail, subject, product, fresh, constants, block, false);
            block.append(new Pop());
          } else {
            // unrecognized
            compile(
              a10.tail,
              subject,
              product,
              fresh,
              constants,
              block,
              hasTail
            );
          }
        }
        break;
      case 11:
        const a11 = arg as Cell<Cell<Noun, Noun>, Cell<Noun, Noun>>;
        one = fresh();
        two = fresh();
        compile(a11.head, subject, one, fresh, constants, block, false);
        compile(a11.tail, subject, two, fresh, constants, block, false);
        // const exp = new Esc(one, two)
        const exp = "lol" as any;
        block.append(new Assignment(product, exp));
        break;
      default:
        throw new Error("invalid opcode");
    }
}
export default { Context };
