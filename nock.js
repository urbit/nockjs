var BigInteger = require('jsbn').BigInteger;

function Noun() {
  this._mug = 0;
}

Noun.prototype.mug = function () {
  if ( 0 === this._mug ) {
    this._mug = this.calculateMug();
  }
  return this._mug;
};

Noun.prototype.mugged = function () {
  return 0 === this._mug;
};

Noun.prototype.calculateMug = function() {
  // XX: TODO (different for atoms and cells)
  return Math.floor(Math.random());
};

Noun.prototype.equals = function(o) {
  if ( this instanceof Cell ) {
    if ( o instanceof Cell) {
      return this.unify(b);
    }
    else {
      return false;
    }
  }
  else {
    if ( o instanceof Cell ) {
      return false;
    }
    else if (0 === this.number.compareTo(o.number)) {
      o.number = this.number;
      return true;
    }
    else {
      return false;
    }
  }
}

function Atom(number) {
  Noun.call(this);
  this.number = number;
}

/*
Atom.prototype.toJs = function() {
  var str = this.number.toString();
  var inside = ( this.number.bitLength() < 32 ) ? str : ('"' + str + '"');
  return "new BigInteger(" + inside + ")";
};
*/

Atom.prototype.valueOf = function() {
  return this.number.bitLength <= 32
    ? this.number.intValue()
    : this.number.toString();
}

Atom.prototype.yes = new Atom(new BigInteger(0));
Atom.prototype.no  = new Atom(new BigInteger(1));

function Cell(head, tail) {
  Noun.call(this);
  this.head = head;
  this.tail = tail;
}

/*
Cell.prototype.toJs = function() {
  return "new Cell(" + this.head.toJs() + ", " + this.tail.toJs() + ")";
}
*/

Cell.prototype.unify = function(o) {
  if ( this === o ) {
    return true;
  }

  if ( o.mugged() ) {
    if ( this.mugged() ) {
      if ( this.mug() != o.mug() ) {
        return false;
      }
    }
    else {
      return o.unify(this);
    }
  }

  if ( this.head.equals(o.head) ) {
    o.head = this.head;
    if ( this.tail.equals(o.tail) ) {
      o.tail = this.tail;
      return true;
    }
  }

  return false;
};

function Statement() {
}

function Block() {
  Statement.call(this);
  this.statements = [];
}

Block.prototype.append = function(st) {
  this.statements.push(st);
}

function Assignment(name, expr) {
  Statement.call(this);
  this.name = name;
  this.expr = expr;
}

Assignment.prototype.toJs = function() {
  return "var " + this.name + " = " + this.expr.toJs() + ";";
}

function Expression() {
}

Expression.prototype.toJs = function() {
  throw new Exception("not implemented");
};

function Cons(head, tail) {
  Expression.call(this);
  this.head = head;
  this.tail = tail;
}

Cons.prototype.toJs = function() {
  return "new Cell(" + this.head + ", " + this.tail + ")";
};

function Frag(axis, name) {
  Expression.call(this);
  this.axis = axis;
  this.name = name;
}

Frag.prototype.toJs = function() {
  var parts = [this.name];
  for ( var ax = this.axis; ax > 1; ax = ax.mas() ) {
    parts.push( ( 2 === ax.cap() ) ? "head" : "tail" );
  }
  return parts.join(".");
};

function Bail() {
  Statement.call(this);
}

Bail.prototype.toJs = function() {
  return "throw new Exception(\"Bail\")";
};

function Identity(name) {
  Expression.call(this);
  this.name = name;
}

Identity.prototype.toJs = function() {
  return this.name;
};

function Constant(index) {
  Expression.call(this);
  this.index = index;
}

Constant.prototype.toJs = function() {
  return "constants[" + this.index + "]";
};

function Nock(subject, formula) {
  Expression.call(this);
  this.subject = subject;
  this.formula = formula;
}

Nock.prototype.toJs = function() {
  return this.formula + ".formulate().nock(" + this.subject + ")";
};

function Deep(name) {
  Expression.call(this);
  this.name = name;
}

Deep.prototype.toJs = function() {
  return "((" + this.name + " instanceof Cell) ? Atom.yes : Atom.no)";
};

function Bump(name) {
  Expression.call(this);
  this.name = name;
}

Bump.prototype.toJs = function() {
  return this.name + ".add(Atom.no)";
};

function Same(one, two) {
  Expression.call(this);
  this.one = one;
  this.two = two;
}

Same.prototype.toJs = function() {
  return this.one + ".equals(" + this.two + ")";
};

function If(test, yes, no) {
  Statement.call(this);
  this.test = test;
  this.yes  = yes;
  this.no   = no;
}

If.prototype.toJs = function() {
  return "switch(" + this.test + "){" +
         "case 0:" + this.yes.toJs() + "break;" +
         "case 1:" + this.no.toJs() + "break; " +
         "default:throw new Exception(\"Bail\");}";
};

function Kick(axis, core) {
  Expression.call(this)
  this.axis = axis;
  this.core = core;
}

Kick.prototype.toJs = function() {
  var axis = ( this.axis.number.bitLength < 32 )
           ? this.axis.toString()
           : "'" + this.axis.toString() + "'";

  // we only want to call battify() once, hence the IIFE
  return "(function (cor) {" +
           "var bat = cor.head.battify();" +
           "var arms = bat.arms;" + 
           "if ( !arms.hasOwnProperty(" + axis + ") ) {" +
             "arms[" + axis + "] = " + new Frag(this.axis, "bat").toJs() + ".formulate().nock;" +
           "}" +
           "return arms[" + axis + "](cor);" +
         "})(" + this.core + ")";
};

function compile(formula, subject, product, fresh, constants, block) {
  var op, arg, one, two, odd;
  if ( !(formula instanceof Cell )) {
    throw new Exception("invalid formula");
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
  else switch ( op ) {
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
      block.append(new Assignment(product, new Constant(constants.length)));
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
      compile(arg.tail.head, subject, product, one);
      compile(arg.tail.tail, subject, product, two);
      emit(new If(odd, one, two));
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
        compile(toNoun([7 arg.tail.tail 2 [0 1] 0 odd]), 
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
        if ( MEMO === zep ) {
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
        else if ( FAST === zep ) {
          one = fresh();
          compile(arg.tail, subject, product, fresh, constants, block);
          block.append(new Fast(product));
        }
        else if ( SPOT === zep ||
                  MEAN === zep ||
                  HUNK === zep ||
                  LOSE === zep ) {
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
      throw new Exception("invalid formula");
  }
}

function Formula(cell) {
  Cell.call(this, cell.head, cell.tail);
  var i = 0;
  var fresh = function() {
    return "v" + ++i;
  };
  var body = new Block();
  var constants = [];
  compile(cell, "subject", "product", fresh, constants, body);
  this.nock = eval("function(constants){return function(subject){" + body.toJs() + "return product;}}")(constants);
}

Noun.prototype.formulate = function() {
  throw new Exception("formulas must be cells");
};
Cell.prototype.formulate = function() {
  return new Formula(this);
};
Formula.prototype.formulate = function() {
  return this;
};

function Battery(cell) {
  Cell.call(this, cell.head, cell.tail);
}

Battery.prototype.kick = function(axis, core) {
  var fn;
  if ( this.hasOwnProperty(axis) ) {
    fn = this[axis];
  }
  else { 
    this[axis] = fn = this.fragment(axis).formulate().nock;
  }
  return fn(core);
}
