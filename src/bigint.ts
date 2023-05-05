
export function bigIntToByteArray(bigInt: bigint): Int8Array {
  const hexString = bigInt.toString(16);
  const paddedHexString = hexString.length % 2 === 0 ? hexString : '0' + hexString;
  const arrayLength = paddedHexString.length / 2;
  const int8Array = new Int8Array(arrayLength);
  // const int8Array = new Int8Array(arrayLength + 1);
  // int8Array[0] = bigInt >= 0n ? 0 : -1;
  for (let i = 0; i < paddedHexString.length; i += 2) {
    const hexSubstring = paddedHexString.slice(i, i + 2);
    const signedInt = (parseInt(hexSubstring, 16) << 24) >> 24;
    // int8Array[(i / 2)+ 1] = signedInt;
    int8Array[(i / 2)] = signedInt;
  }
  return int8Array;
}



export function bitLength(bigIntValue: bigint): number {
  if (bigIntValue === BigInt(0)) return 0;

  let length = 0;
  let value = bigIntValue;

  while (value !== BigInt(0)) {
    length++;
    value >>= BigInt(1); // Right shift the bits by one position
  }

  return length;
}

export function testBit(bigIntValue: bigint, index: number): boolean {
  return (bigIntValue & (BigInt(1) << BigInt(index))) !== BigInt(0);
}
export function shortValue(bigintValue: bigint): number {
  const result = Number(bigintValue % BigInt(2 ** 16));
  return result >= 2 ** 15 ? result - 2 ** 16 : result;
}
export function bigIntFromStringWithRadix(number: string, radix: number): bigint {
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