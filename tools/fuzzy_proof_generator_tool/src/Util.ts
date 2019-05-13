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

const Util = {

  generateRandomKeccak256(): Buffer {
    return ethUtil.keccak256(
      Math.random().toString(36).substring(2, 10)
            + Math.random().toString(36).substring(2, 10)
            + Math.random().toString(36).substring(2, 10)
            + Math.random().toString(36).substring(2, 10),
    );
  },

  toNibbles(path: Buffer): Buffer {
    const nibbles: Buffer = Buffer.alloc(2 * path.length);

    for (let i = 0; i < path.length; i += 1) {
      let q = i * 2;
      nibbles[q] = path[i] >> 4;
      q += 1;
      nibbles[q] = path[i] & 0xF;
    }

    return nibbles;
  },

  nibblesToBuffer(nibbleArray: Buffer): Buffer {
    assert(nibbleArray.length % 2 === 0);

    const buffer = Buffer.alloc(nibbleArray.length / 2);
    for (let i = 0; i < buffer.length; i += 1) {
      const q: number = i * 2;
      buffer[i] = ((nibbleArray[q] << 4) | nibbleArray[q + 1]);
    }
    return buffer;
  },

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

  assertNibbleArray(nibbleArray: Buffer): void {
    nibbleArray.forEach(
      (n): void => {
        assert((n & 0xF0) === 0);
      },
    );
  },
};

export { Util as default };
