
export function bigIntToByteArray(bigInt: bigint): Int8Array {
  const hexString = bigInt.toString(16);
  const paddedHexString = hexString.length % 2 === 0 ? hexString : '0' + hexString;
  const arrayLength = paddedHexString.length / 2;
  const int8Array = new Int8Array(arrayLength);
  for (let i = 0; i < paddedHexString.length; i += 2) {
    const hexSubstring = paddedHexString.slice(i, i + 2);
    const signedInt = (parseInt(hexSubstring, 16) << 24) >> 24;
    int8Array[(i / 2)] = signedInt;
  }
  return int8Array;
}

//  bit length cache entries
const blcCoeff: number[] = [];
const blcBigCoeff: bigint[] = [];
const blc: bigint[] = [];
let blcNext = 0;

export function bitLength(bigIntValue: bigint): number {
  if (bigIntValue === 0n) return 0;

  //  there is no native bigint bitlength measuring support,
  //  so we roll our own. this beats toString-based implementations (and those,
  //  slightly surprisingly, beat manual bitstep loops).
  //  the approach here is to find *an* upper bound quickly through comparisons,
  //  in exponentially escalating steps, and then slowly step down the
  //  comparisons to find the exact result. we get final precision from
  //  Math.clz32. this approach makes measurements on large bignums way faster.
  //  https://stackoverflow.com/a/76616288

  //  find upper bound
  let k = 0
  while (true) {
    if (blcNext === k) {
      blcCoeff.push(32 << blcNext);
      blcBigCoeff.push(BigInt(blcCoeff[blcNext]));
      blc.push(1n << blcBigCoeff[blcNext]);
      blcNext++;
    }
    if (bigIntValue < blc[k]) break;
    k++;
  }

  //  smallint case
  if (!k)
    return 32 - Math.clz32(Number(bigIntValue));

  //  determine exact length by bisection
  k--;
  let i = blcCoeff[k];
  let a = bigIntValue >> blcBigCoeff[k];
  while (k--) {
    let b = a >> blcBigCoeff[k];
    if (b) (i += blcCoeff[k], a = b);
  }

  return i + 32 - Math.clz32(Number(a));
}

export function testBit(bigIntValue: bigint, index: number): boolean {
  return (bigIntValue & (BigInt(1) << BigInt(index))) !== BigInt(0);
}
export function shortValue(bigintValue: bigint): number {
  const result = Number(bigintValue % BigInt(2 ** 16));
  return result >= 2 ** 15 ? result - 2 ** 16 : result;
}
export function bigIntFromStringWithRadix(number: string, radix: number): bigint {
  //  native constructor is slightly faster
  if (radix === 16) return BigInt('0x' + (number || '0'));
  if (radix === 10) return BigInt(number || '0');

  let result = BigInt(0);
  const base = BigInt(radix);
  const length = number.length;

  for (let i = 0; i < length; i++) {
    const digit = parseInt(number.charAt(i), radix);
    if (isNaN(digit)) {
      throw new Error(`Invalid character for radix ${radix}: '${number.charAt(i)}'`);
    }
    result = result * base + BigInt(digit);
  }

  return result;
}