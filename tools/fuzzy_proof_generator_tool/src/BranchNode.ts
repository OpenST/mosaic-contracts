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

import assert = require('assert');

/** Represents a branch node of Modified Merkle Patricia Trie. */
class BranchNode extends NodeBase {
  /* Storage */

  private _keys: Buffer[];

  private _value: Buffer;


  /* Public Functions */

  /**
   * Creates a branch node.
   *
   * Requires:
   *   - keys array's length is 16.
   *
   * @param keys Keys array of a branch node.
   * @param value A value to store in a branch node.
   *
   * @remarks
   * See: https://github.com/ethereum/wiki/wiki/Patricia-Tree#optimization
   */
  public constructor(keys: Buffer[], value: Buffer) {
    super(NodeType.Branch);

    assert(keys.length === 16);

    this._keys = keys;
    this._value = value;
  }

  /**
   * Returns a raw representation of an underlying data of a branch node as a
   * buffers array:
   *    [...this._keys, this._value]
   *
   * @remarks
   * See: https://github.com/ethereum/wiki/wiki/Patricia-Tree#optimization
   * See: https://github.com/ethereum/wiki/wiki/Patricia-Tree#specification-compact-encoding-of-hex-sequence-with-optional-terminator
   */
  public raw(): Buffer[] {
    const raw: Buffer[] = [...this._keys, this._value];
    assert(raw.length === 17);
    return raw;
  }

  public get keys(): Buffer[] {
    return this._keys;
  }

  public get value(): Buffer {
    return this._value;
  }
}

export { BranchNode as default };
