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
import Util from './Util';
import NodeBase from './NodeBase';

import assert = require('assert');


class LeafNode extends NodeBase {
  /* Storage */

  private _nibblePath: Buffer;

  private _value: Buffer;


  /* Public Functions */

  public constructor(nibblePath: Buffer, value: Buffer) {
    super(NodeType.Leaf);

    assert(nibblePath.length !== 0);
    assert(value.length !== 0);

    Util.assertNibbleArray(nibblePath);

    this._nibblePath = nibblePath;
    this._value = value;
  }

  public raw(): Buffer[] {
    const encodedPath: Buffer = Util.encodeCompactLeafPath(this._nibblePath);
    const raw: Buffer[] = [encodedPath, this._value];

    return raw;
  }

  public get value(): Buffer {
    return this._value;
  }

  public get nibblePath(): Buffer {
    return this._nibblePath;
  }
}

export { LeafNode as default };
