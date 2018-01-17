/*
 * =<  (dec 43)
 * |%
 * ++  dec
 *   |=  a/@
 *   =|  i/@
 *   |-
 *   =/  n/@  +(i)
 *   ?:  =(a n)
 *     i
 *   $(i n)
 * --
 * [8 [1 8 [1 0] [1 8 [1 0] 8 [1 8 [4 0 6] 
                                 6 [5 [0 62] 0 2] 
                                   [0 14] 
                                 9 2 [0 6] [0 2] 0 15]
                                 9 2 0 1] 0 1]
    8 [9 2 0 1] 9 2 [0 4] [7 [0 3] 1 43] 0 11]
 */
var noun = require('../noun.js');
var nounT = require('./noun.js');
var n = noun.dwim;
var compiler = require('../compiler.js');
var context  = new compiler.Context();
var formula = n(8, [1, 8, [1, 0], [1, 8, [1, 0], 8, [1, 8, [4, 0, 6],
                                                 6, [5, [0, 62], 0, 2],
                                                   [0, 14],
                                                 9, 2, [0, 6], [0, 2], 0, 15],
                                                 9, 2, 0, 1], 0, 1],
                8, [9, 2, 0, 1], 9, 2, [0, 4], [7, [0, 3], 1, 43], 0, 11);
var product = context.nock(n(0), formula);
nounT.is(product, n(42), 'decrement');
