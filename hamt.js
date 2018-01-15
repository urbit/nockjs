/* https://jsperf.com/popcount-comparison */
function popcnt (n) {
  n -= n >> 1 & 0x55555555;
  n = (n & 0x33333333) + (n >> 2 & 0x33333333);
  n = n + (n >> 4) & 0x0f0f0f0f;
  n += n >> 8;
  n += n >> 16;

  return n & 0x7f;
}

function Slot() {
}

function Node() {
  Slot.call(this);
  this.map = 0;
  this.slots = [];
}
Node.prototype = Object.create(Slot.prototype);
Node.prototype.constructor = Node;

Node.prototype.insert = function(key, val, lef, rem) {
  var bit, map, inx;
  lef -= 5;
  bit = rem >>> lef;
  rem &= ((1 << lef) - 1);
  inx = popcnt(this.map & ((1 << bit) - 1));
  
  if ( this.map & (1 << bit) ) {
    this.slots[inx] = this.slots[inx].insert(key, val, lef, rem);
  }
  else {
    this.map |= 1 << bit;
    this.slots.splice(inx, 0, new Single(key, val));
  }
  return this;
};

Node.prototype.get = function(key, lef, rem) {
  var bit, inx;
  lef -= 5;
  bit = rem >>> lef;
  rem = rem & ((1 << lef) - 1);
  inx = popcnt(this.map & ((1 << bit) - 1));

  if ( this.map & (1 << bit) ) {
    return this.slots[inx].get(key, lef, rem);
  }
  else {
    return undefined;
  }
};

function Bucket() {
  this.singles = [];
}
Bucket.prototype = Object.create(Slot.prototype);
Bucket.prototype.constructor = Bucket;

Bucket.prototype.insert = function(key, val, lef, rem) {
  var s, a = this.singles;

  for ( var i = 0; i < a.length; ++i ) {
    s = a[i];
    if ( s.key.equals(key) ) {
      s.val = val;
      return this;
    }
  }
  a.push(new Single(key, val));
  return this;
};

Bucket.prototype.get = function(key, lef, rem) {
  var s, a = this.singles;

  for ( var i = 0; i < a.length; ++i ) {
    s = a[i];
    if ( s.key.equals(key) ) {
      return s.val;
    }
  }

  return undefined;
};

function Single(key, val) {
  Slot.call(this);
  this.key = key;
  this.val = val;
}
Single.prototype = Object.create(Slot.prototype);
Single.prototype.constructor = Single;

Single.prototype.insert = function(key, val, lef, rem) {
  if ( this.key.equals(key) ) {
    this.val = val;
    return this;
  }
  else {
    var n;
    if ( lef > 0 ) {
      n = new Node();
    }
    else {
      n = new Bucket();
    }
    n.insert(this.key, this.val, lef, rem);
    n.insert(key, val, lef, rem);
    return n;
  }
};

Single.prototype.get = function(key, lef, rem) {
  if ( this.key.equals(key) ) {
    return this.val;
  }
  else {
    return undefined;
  }
};

function NounMap() {
  this.slots = new Array(64);
}

NounMap.prototype.insert = function(key, val) {
  var m    = key.mug();
  var inx  = m >>> 25;
  var sot  = this.slots;
  if ( undefined === sot[inx] ) {
    sot[inx] = new Single(key, val);
  }
  else {
    var rem  = m & ((1 << 25) - 1);
    sot[inx] = sot[inx].insert(key, val, 25, rem);
  }
};

NounMap.prototype.get = function(key) {
  var m = key.mug();
  var inx = m >>> 25;
  var sot = this.slots[inx];
  if ( undefined === sot ) {
    return undefined;
  }
  else {
    var rem  = m & ((1 << 25) - 1);
    return sot.get(key, 25, rem);
  }
};

module.exports = {
  NounMap: NounMap
};
