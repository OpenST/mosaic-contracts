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

import rlp = require('rlp');
import ethUtil = require('ethereumjs-util');

/** Acts as a parent class for all nodes' types. */
abstract class NodeBase {
  /* Storage */

  public readonly type: NodeType;


  /* Public Functions */

  /** Returns a raw representation of an underlying data without encoding. */
  public abstract raw(): Buffer[];

  /** Returns a serialized representation of an underlying data by rlp encoding. */
  public serialize(): Buffer {
    return rlp.encode(this.raw());
  }

  /** Returns a hash of an underlying data. */
  public hash(): Buffer {
    const s: Buffer = this.serialize();
    return ethUtil.keccak256(s);
  }


  /* Protected Functions */

  protected constructor(type: NodeType) {
    this.type = type;
  }
}

export { NodeBase as default };
