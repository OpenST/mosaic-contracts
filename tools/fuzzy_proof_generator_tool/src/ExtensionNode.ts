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
import NodeBase from './NodeBase';
import Util from './Util';

import assert = require('assert');

/** Represents an extension node of Modified Merkle Patricia Trie. */
class ExtensionNode extends NodeBase {
  /* Storage */

  public readonly nibblePath: Buffer;

  public readonly key: Buffer;


  /* Public Functions */

  /**
   * Creates an extension node.
   *
   * Requires:
   *   - nibblePath is non empty.
   *   - key is non empty.
   *   - nibblePath is a valid nibbles buffer.
   *
   * @param nibblePath An non encoded (compact) nibbles path of an extension node.
   * @param key A key to store in an extension node.
   *
   * @remarks
   * See: https://github.com/ethereum/wiki/wiki/Patricia-Tree#optimization
   */
  public constructor(nibblePath: Buffer, key: Buffer) {
    super(NodeType.Extension);

    assert(nibblePath.length !== 0);
    assert(key.length !== 0);

    Util.assertNibbleArray(nibblePath);

    this.nibblePath = nibblePath;
    this.key = key;
  }

  /**
   * Returns a raw representation of an underlying data of an extension node as a
   * buffers array:
   *    [...compact_encode_extension(this.nibblePath), this.value]
   *
   * @remarks
   * See: https://github.com/ethereum/wiki/wiki/Patricia-Tree#optimization
   * See: https://github.com/ethereum/wiki/wiki/Patricia-Tree#specification-compact-encoding-of-hex-sequence-with-optional-terminator
   */
  public raw(): Buffer[] {
    const encodedPath: Buffer = Util.encodeCompactExtensionPath(this.nibblePath);
    const raw: Buffer[] = [encodedPath, this.key];
    return raw;
  }
}

export { ExtensionNode as default };
