// Copyright 2019 OpenST Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// ----------------------------------------------------------------------------

/* eslint-disable no-bitwise */

import assert = require('assert');

const NibblesUtil = {

  /**
   * Converts a buffer to a nibbles buffer.
   *
   * Converts each byte within the input buffer into two nibbles and
   * stores each nibble as an entry in the returned buffer.
   * As a result, the returned buffer's length is twice as the input one.
   *
   * For example:
   *    String 'do' is stored in a buffer as: Buffer<64 6f> (length 2)
   *    The returned buffer's content in this case is: Buffer<6 4 6 f> (length 4)
   *
   * @remarks
   * See also {@link NibblesUtils#nibblesToBuffer}
   *
   * @param path buffer The buffer to convert into nibbles.
   *
   * @returns Buffer containing converted nibbles.
   */
  toNibbles(buffer: Buffer): Buffer {
    const nibbles: Buffer = Buffer.alloc(2 * buffer.length);

    for (let i = 0; i < buffer.length; i += 1) {
      let nibblesBufferIndex = i * 2;

      // As a result of shifting 4 bits (of byte) to the right, we have a byte
      // containing only left 4 bits padded with 0, e.g:
      // 0x64 == 0b01100100, after shifting 4 bits to right we have
      // 0b00000110 == 0x06
      nibbles[nibblesBufferIndex] = buffer[i] >> 4;

      nibblesBufferIndex += 1;

      // 0x64 == 0b01100100, after bitwise 'and' with 0x0F == 0b00001111
      // we will have 0b00000100 == 0x04
      nibbles[nibblesBufferIndex] = buffer[i] & 0x0F;
    }

    return nibbles;
  },

  /**
   * Converts a nibbles buffer to a buffer.
   *
   * Combines two consecutive entries from the input nibbles buffer
   * into one byte and stores in the returned result.
   * The input buffer's length must be even.
   * For example:
   *    The input buffer is: Buffer<6 4 6 f>
   *    The returned buffer's content in this case is: Buffer<64 6f>
   *
   * @remarks
   * See also {@link NibblesUtils#toNibbles}
   *
   * @param nibbleArray The nibbles buffer to convert.
   */
  nibblesToBuffer(nibbleArray: Buffer): Buffer {
    assert(
      nibbleArray.length % 2 === 0,
      'Nibbles array\'s length is odd.',
    );

    const buffer = Buffer.alloc(nibbleArray.length / 2);

    for (let i = 0; i < buffer.length; i += 1) {
      const nibbleArrayIndex: number = i * 2;

      // For simplicity let's assume nibbleArray has two elements: [0x06, 0x04].
      //
      // `nibbleArray[0] << 4` => `0x06 << 4`  =>  `0b00000110 << 4`  => `0b01100000`
      //
      // `nibbleArray[0] << 4` | `nibbleArray[0 + 1]` => `0b01100000 | 0x04` =>
      // `0b01100000 | 0b00000100` => `0b01100100` => `0x64`
      buffer[i] = ((nibbleArray[nibbleArrayIndex] << 4) | nibbleArray[nibbleArrayIndex + 1]);
    }

    return buffer;
  },

  /** Asserts that input buffer is a valid nibbles buffer. */
  assertNibbleArray(nibbleArray: Buffer): void {
    nibbleArray.forEach(
      (n): void => {
        assert(
          (n & 0xF0) === 0,
          'An array is not a nibble array.',
        );
      },
    );
  },
};

export { NibblesUtil as default };
