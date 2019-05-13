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


class ExtensionNode extends NodeBase {
  /* Storage */

  private _nibblePath: Buffer;

  private _key: Buffer;


  /* Public Functions */

  public constructor(nibblePath: Buffer, key: Buffer) {
    super(NodeType.Extension);

    assert(nibblePath.length !== 0);
    assert(key.length !== 0);

    Util.assertNibbleArray(nibblePath);

    this._nibblePath = nibblePath;
    this._key = key;
  }

  public raw(): Buffer[] {
    const encodedPath: Buffer = Util.encodeCompactExtensionPath(this._nibblePath);
    const raw: Buffer[] = [encodedPath, this._key];
    return raw;
  }

  public get key(): Buffer {
    return this._key;
  }

  public get nibblePath(): Buffer {
    return this._nibblePath;
  }
}

export { ExtensionNode as default };
