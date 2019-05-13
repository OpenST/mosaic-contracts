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
import ethUtil = require('ethereumjs-util');
import crypto = require('crypto');

const Util = {

  /** Generates random keccak256 value. */
  generateRandomKeccak256(): Buffer {
    return ethUtil.keccak256(
      crypto.randomBytes(256),
    );
  },

  /**
   * Converts a buffer to a nibbles buffer.
   *
   * Converts each byte within the input buffer into two nibbles and
   * stores each nibble as an entry in the returned buffer.
   * As a result, the returned buffer's length is twice as the input one.
   *
   * For example:
   *    String 'do' is stored in a buffer as: Buffer<64 6f>
   *    The returned buffer's content in this case is: Buffer<6 4 6 f>
   *
   * @remarks
   * See also {@link Utils#nibblesToBuffer}
   *
   * @param path buffer The buffer to convert into nibbles.
   *
   * @returns Buffer containing converted nibbles.
   */
  toNibbles(buffer: Buffer): Buffer {
    const nibbles: Buffer = Buffer.alloc(2 * buffer.length);

    for (let i = 0; i < buffer.length; i += 1) {
      let q = i * 2;
      nibbles[q] = buffer[i] >> 4;
      q += 1;
      nibbles[q] = buffer[i] & 0xF;
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
   * See also {@link Utils#toNibbles}
   *
   * @param nibbleArray The nibbles buffer to convert.
   */
  nibblesToBuffer(nibbleArray: Buffer): Buffer {
    assert(nibbleArray.length % 2 === 0);

    const buffer = Buffer.alloc(nibbleArray.length / 2);
    for (let i = 0; i < buffer.length; i += 1) {
      const q: number = i * 2;
      buffer[i] = ((nibbleArray[q] << 4) | nibbleArray[q + 1]);
    }
    return buffer;
  },

  /**
   * Encodes a nibble buffer into a compact path encoding for leaf node's path.
   *
   * @remark
   * See: https://github.com/ethereum/wiki/wiki/Patricia-Tree#specification-compact-encoding-of-hex-sequence-with-optional-terminator
   */
  encodeCompactLeafPath(nibblePath: Buffer): Buffer {
    assert(nibblePath.length !== 0);

    const evenLength: boolean = (nibblePath.length % 2 === 0);

    if (evenLength) {
      return Util.nibblesToBuffer(
        Buffer.concat([Buffer.from([2, 0]), nibblePath]),
      );
    }
    return Util.nibblesToBuffer(
      Buffer.concat([Buffer.from([3]), nibblePath]),
    );
  },

  /**
   * Encodes a nibble buffer into a compact path encoding for extension node's path.
   *
   * @remark
   * See: https://github.com/ethereum/wiki/wiki/Patricia-Tree#specification-compact-encoding-of-hex-sequence-with-optional-terminator
   */
  encodeCompactExtensionPath(nibblePath: Buffer): Buffer {
    assert(nibblePath.length !== 0);

    const evenLength: boolean = (nibblePath.length % 2 === 0);
    if (evenLength) {
      return Util.nibblesToBuffer(
        Buffer.concat([Buffer.from([0, 0]), nibblePath]),
      );
    }
    return Util.nibblesToBuffer(
      Buffer.concat([Buffer.from([1]), nibblePath]),
    );
  },

  /** Asserts that input buffer is a valid nibbles buffer. */
  assertNibbleArray(nibbleArray: Buffer): void {
    nibbleArray.forEach(
      (n): void => {
        assert((n & 0xF0) === 0);
      },
    );
  },
};

export { Util as default };
