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

import NodeType from './Types';
import Nibbles from './Nibbles';
import NodeBase from './NodeBase';

import assert = require('assert');

/** Represents a leaf node of Modified Merkle Patricia Trie. */
class LeafNode extends NodeBase {
  /* Storage */

  public readonly nibblePath: Buffer;

  public readonly value: Buffer;


  /* Public Functions */

  /**
   * Creates a leaf node.
   *
   * Requires:
   *   - nibblePath is non empty.
   *   - value is non empty.
   *   - nibblePath is a valid nibbles buffer.
   *
   * @param nibblePath An non encoded (compact) nibbles path of a leaf node.
   * @param value A value to store in a leaf node.
   *
   * @remarks
   * See: https://github.com/ethereum/wiki/wiki/Patricia-Tree#optimization
   */
  public constructor(nibblePath: Buffer, value: Buffer) {
    super(NodeType.Leaf);

    assert(
      nibblePath.length !== 0,
      'Leaf node\'s nibble path is empty.',
    );
    assert(
      value.length !== 0,
      'Leaf node\'s value is empty.',
    );

    Nibbles.assertNibbleArray(nibblePath);

    this.nibblePath = nibblePath;
    this.value = value;
  }

  /**
   * Returns a raw representation of an underlying data of a leaf node as a
   * buffers array:
   *    [...compact_encode_leaf(this.nibblePath), this.value]
   *
   * @remarks
   * See: https://github.com/ethereum/wiki/wiki/Patricia-Tree#optimization
   * See: https://github.com/ethereum/wiki/wiki/Patricia-Tree#specification-compact-encoding-of-hex-sequence-with-optional-terminator
   */
  public raw(): Buffer[] {
    const encodedPath: Buffer = LeafNode.encodeCompact(this.nibblePath);
    const raw: Buffer[] = [encodedPath, this.value];

    return raw;
  }

  /**
   * Encodes a nibble buffer into a compact path encoding for leaf node's path.
   *
   * @remark
   * See: https://github.com/ethereum/wiki/wiki/Patricia-Tree#specification-compact-encoding-of-hex-sequence-with-optional-terminator
   */
  public static encodeCompact(nibblePath: Buffer): Buffer {
    assert(
      nibblePath.length !== 0,
      'A nibble path to encode compact is empty.',
    );

    const evenLength: boolean = (nibblePath.length % 2 === 0);

    if (evenLength) {
      return Nibbles.nibblesToBuffer(
        Buffer.concat([Buffer.from([2, 0]), nibblePath]),
      );
    }
    return Nibbles.nibblesToBuffer(
      Buffer.concat([Buffer.from([3]), nibblePath]),
    );
  }
}

export { LeafNode as default };
