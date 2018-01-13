var noun = require('./noun.js'),
    Noun = noun.Noun,
    Atom = noun.Atom.Atom,
    Cell = noun.Cell,
    MEMO = noun.dwim("memo"),
    FAST = noun.dwim("fast"),
    SPOT = noun.dwim("spot"),
    MEAN = noun.dwim("mean"),
    HUNK = noun.dwim("hunk"),
    LOSE = noun.dwim("lose");

function Statement() {
}

function Block() {
  Statement.call(this);
  this.statements = [];
}
Block.prototype = Object.create(Statement.prototype);
Block.prototype.constructor = Block;

Block.prototype.append = function(st) {
  this.statements.push(st);
}

Block.prototype.toJs = function() {
  var sts   = this.statements;
  var parts = new Array(sts.length);
  for ( var i = 0; i < sts.length; ++i) {
    parts[i] = sts[i].toJs();
  }
  return parts.join('');
};

function Assignment(name, expr) {
  Statement.call(this);
  this.name = name;
  this.expr = expr;
}
Assignment.prototype = Object.create(Statement.prototype);
Assignment.prototype.constructor = Assignment;

Assignment.prototype.toJs = function() {
  return "var " + this.name + " = " + this.expr.toJs() + ";";
}

function Expression() {
}

function Cons(head, tail) {
  Expression.call(this);
  this.head = head;
  this.tail = tail;
}
Cons.prototype = Object.create(Expression.prototype);
Cons.prototype.constructor = Cons;

Cons.prototype.toJs = function() {
  return "runtime.cons(" + this.head + ", " + this.tail + ")";
};

function Frag(axis, name) {
  Expression.call(this);
  this.axis = axis;
  this.name = name;
}
Frag.prototype = Object.create(Expression.prototype);
Frag.prototype.constructor = Frag;

Frag.prototype.toJs = function() {
  var parts = [this.name];
  for ( var ax = this.axis; ax > 1; ax = ax.mas() ) {
    parts.push( ( 2 === ax.cap().valueOf() ) ? "head" : "tail" );
  }
  return parts.join(".");
};

function Bail() {
  Statement.call(this);
}
Bail.prototype = Object.create(Statement.prototype);
Bail.prototype.constructor = Bail;

Bail.prototype.toJs = function() {
  return "throw new Error(\"Bail\")";
};

function Identity(name) {
  Expression.call(this);
  this.name = name;
}
Identity.prototype = Object.create(Expression.prototype);
Identity.prototype.constructor = Identity;

Identity.prototype.toJs = function() {
  return this.name;
};

function Constant(index) {
  Expression.call(this);
  this.index = index;
}
Constant.prototype = Object.create(Expression.prototype);
Constant.prototype.constructor = Constant;

Constant.prototype.toJs = function() {
  return "constants[" + this.index + "]";
};

function Nock(subject, formula, tail) {
  Expression.call(this);
  this.subject = subject;
  this.formula = formula;
  this.tail    = tail;
}
Nock.prototype = Object.create(Expression.prototype);
Nock.prototype.constructor = Nock;

Nock.prototype.toJs = function() {
  var f = this.formula;
  var targetCode = "(" + f + ".hasOwnProperty('target') ? " + f + 
    ".target : (" + f + ".target = runtime.compile(" + this.formula + ")))";
  return tail ?
    "runtime.trampoline(" + targetCode + ", " + this.subject + ")" :
    targetCode + "(" + this.subject + ")";
};

function Deep(name) {
  Expression.call(this);
  this.name = name;
}
Deep.prototype = Object.create(Expression.prototype);
Deep.prototype.constructor = Deep;

Deep.prototype.toJs = function() {
  return this.name +".deep ? runtime.yes : runtime.no";
};

function Bump(name) {
  Expression.call(this);
  this.name = name;
}
Bump.prototype = Object.create(Expression.prototype);
Bump.prototype.constructor = Bump;

Bump.prototype.toJs = function() {
  return this.name + ".bump()";
};

function Same(one, two) {
  Expression.call(this);
  this.one = one;
  this.two = two;
}
Same.prototype = Object.create(Expression.prototype);
Same.prototype.constructor = Same;

Same.prototype.toJs = function() {
  return "(" + this.one + ".equals(" + this.two + ")" + " ? runtime.yes : runtime.no)";
};

function If(test, yes, no) {
  Statement.call(this);
  this.test = test;
  this.yes  = yes;
  this.no   = no;
}
If.prototype = Object.create(Statement.prototype);
If.prototype.constructor = If;

If.prototype.toJs = function() {
  return "if(" + this.test + ".loob()){" +
    this.yes.toJs() + "}else{" + this.no.toJs() + "}";
};

function Kick(axis, core, tail) {
  Expression.call(this)
  this.axis = axis;
  this.core = core;
  this.tail = tail;
}
Kick.prototype = Object.create(Expression.prototype);
Kick.prototype.constructor = Kick;

Kick.prototype.toJs = function() {
  var axis = this.axis.shortCode();

  return "(function (cor) {" +
           "var pro, tgt, bus, arms, bat = cor.head, has = false;" +
           "if ( bat.hasOwnProperty('arms') ) {" +
             "arms = bat.arms" +
             "has = arms.hasOwnProperty('" + axis + "');" + 
           "}" +
           "else arms = bat.arms = {};" +
           "tgt = has ? arms['" + axis + "'] : (arms['" + axis + "'] = runtime.compile(" + 
             new Frag(this.axis, "bat").toJs() + "));" + 
           "bus = cor;" +
           (this.tail ? "pro = runtime.trampoline(tgt, bus);" :
             "while (true) {" +
               "pro = tgt(bus);" +
               "if ( runtime.isTrampoline(pro) ) {" +
                 "tgt = pro.target;" +
                 "bus = pro.subject;" +
               "}" +
               "else break;" +
             "}") +
           "return pro;" +
         "})(" + this.core + ")";
};

function compile(formula, subject, product, fresh, constants, block) {
  var op, arg, one, two, odd;
  if ( !(formula instanceof Cell )) {
    throw new Error("invalid formula");
  }
  op = formula.head;
  arg = formula.tail;
  if ( op instanceof Cell ) {
    one = fresh();
    two = fresh();
    compile(op, subject, one, fresh, constants, block);
    compile(arg, subject, two, fresh, constants, block);
    block.append(new Assignment(product, new Cons(one, two)));
  }
  else switch ( op.valueOf() ) {
    case 0:
      if ( 0 === arg ) {
        block.append(new Bail());
      }
      else if ( 1 === arg ) {
        block.append(new Identity(subject));
      }
      else {
        block.append(new Assignment(product, new Frag(arg, subject)));
      }
      break;
    case 1:
      constants.push(arg);
      block.append(new Assignment(product, new Constant(constants.length - 1)));
      break;
    case 2:
      one = fresh();
      two = fresh();
      compile(arg.head, subject, one, fresh, constants, block);
      compile(arg.tail, subject, two, fresh, constants, block);
      block.append(new Assignment(product, new Nock(one, two)));
      break;
    case 3:
      one = fresh();
      compile(arg, subject, one, fresh, constants, block);
      block.append(new Assignment(product, new Deep(one)));
      break;
    case 4:
      one = fresh();
      compile(arg, subject, one, fresh, constants, block);
      block.append(new Assignment(product, new Bump(one)));
      break;
    case 5:
      one = fresh();
      two = fresh();
      compile(arg.head, subject, one, fresh, constants, block);
      compile(arg.tail, subject, two, fresh, constants, block);
      block.append(new Assignment(product, new Same(one, two)));
      break;
    case 6:
      odd = fresh();
      one = new Block();
      two = new Block();
      compile(arg.head, subject, odd, fresh, constants, block);
      compile(arg.tail.head, subject, product, fresh, constants, one);
      compile(arg.tail.tail, subject, product, fresh, constants, two);
      block.append(new If(odd, one, two));
      break;
    case 7:
      one = fresh();
      compile(arg.head, subject, one, fresh, constants, block);
      compile(arg.tail, one, product, fresh, constants, block);
      break;
    case 8:
      one = fresh();
      two = fresh();
      compile(arg.head, subject, one, fresh, constants, block);
      block.append(new Assignment(two, new Cons(one, subject)));
      compile(arg.tail, two, product, fresh, constants, block);
      break;
    case 9:
      odd = arg.head;
      if ( 2 === odd.cap() ) {
        one = fresh();
        two = odd.mas();
        compile(arg.tail, subject, one, fresh, constants, block);
        block.append(new Assignment(product, new Kick(two, one)));
      }
      else {
        compile(noun.dwim([7, arg.tail.tail, 2, [0, 1], 0, odd]),
          subject, product, fresh, constants, block);
      }
      break;
    case 10:
      var hint = arg.head;
      if ( !(arg.head instanceof Cell) ) {
        // no recognized static hints
        compile(arg.tail, subject, product, fresh, constants, block);
      }
      else {
        var zep = hint.head;
        var clu = fresh();
        compile(hint.tail, subject, clu, fresh, constants, block);
        if ( zep.equals(MEMO) ) {
          var key = fresh();
          var got = fresh();
          odd = fresh();
          one = new Block();
          two = new Block();
          block.append(new Assignment(key, new Cons(subject, new Constant(hint.tail))));
          block.append(new Assignment(got, new GetMemo(two)));
          block.append(new Assignment(odd, new Deep(got)));
          one.append(new Assignment(product, new Frag(toNoun(3), got)));
          compile(arg.tail, subject, product, fresh, two);
          two.append(new PutMemo(key, product));
          block.append(new If(odd, one, two));
        }
        else if ( zep.equals(FAST) ) {
          one = fresh();
          compile(arg.tail, subject, product, fresh, constants, block);
          block.append(new Fast(product));
        }
        else if ( zep.equals(SPOT) ||
                  zep.equals(MEAN) ||
                  zep.equals(HUNK) ||
                  zep.equals(LOSE) ) {
          one = fresh();
          block.append(new Push(zep, clu));
          compile(arg.tail, subject, product, fresh, constants, block);
          block.append(new Pop(zep));
        }
        else {
          // unrecognized
          compile(arg.tail, subject, product, fresh, constants, block);
        }
      }
      break;
    case 11:
      one = fresh();
      two = fresh();
      compile(arg.head, subject, one, fresh, constants, block);
      compile(arg.tail, subject, two, fresh, constants, block);
      block.append(new Assignment(product, new Esc(one, two)));
      break;
    default:
      throw new Error("invalid opcode");
  }
}

function Trampoline(target, subject) {
  this.target = target;
  this.subject = subject;
}

var runtime = {
  yes: noun.Atom.yes,
  no:  noun.Atom.no,
  cons: function (h, t) {
    return new Cell(h, t);
  },
  trampoline: function(tgt, bus) {
    return new Trampoline(tgt, bus);
  },
  isTrampoline: function(a) {
    return (a instanceof Trampoline);
  },
  compile: function(cell) {
    var i = 0;
    var fresh = function() {
      return "v" + ++i;
    };
    var body = new Block();
    var constants = [];
    compile(cell, "subject", "product", fresh, constants, body);
    var text = "return function(subject){" + body.toJs() + "return product;}";
    console.log(text);
    var builder = new Function("runtime", "constants", text);
    cell.target = builder(this, constants);
  },
  nock: function(subject, formula) {
    var product, target;
    if ( !formula.hasOwnProperty("target") ) {
      this.compile(formula);
    }
    target = formula.target;
    while ( true ) {
      product = formula.target(subject);
      if ( product instanceof Trampoline ) {
        subject = product.subject;
        target  = product.target;
      }
      else {
        return product;
      }
    }
  }
};


module.exports = {
  runtime: runtime
}
