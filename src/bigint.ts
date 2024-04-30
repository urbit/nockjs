
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



export function bitLength(bigIntValue: bigint): number {
  if (bigIntValue === BigInt(0)) return 0;
  //  yes, this is faster than a "raw" bitshift loop
  return bigIntValue.toString(2).length;
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