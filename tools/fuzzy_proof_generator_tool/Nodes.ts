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

import assert = require('assert');
import rlp = require('rlp');
import ethUtil = require('ethereumjs-util');

abstract class NodeBase {
  /* Storage */

  private _type: NodeType;


  /* Abstract Functions */

  public abstract serialize(): Buffer;


  /* Public Functions */

  public get type(): NodeType {
    return this._type;
  }

  public hash(): Buffer {
    return ethUtil.keccak256(this.serialize());
  }

  /* Protected Functions */

  protected constructor(type: NodeType) {
    this._type = type;
  }
}

class BranchNode extends NodeBase {
  /* Storage */

  private _keys: Buffer[];

  private _value: Buffer;


  /* Public Functions */

  public constructor(keys: Buffer[], value: Buffer) {
    super(NodeType.Branch);

    assert(keys.length === 16);

    this._keys = keys;
    this._value = value;
  }

  public serialize(): Buffer {
    const raw: Buffer[] = [...this._keys, this._value];
    return rlp.encode(raw);
  }

  public get value(): Buffer {
    return this._value;
  }

  public updateKey(index: number, key: Buffer): void {
    assert(index >= 0 && index <= 15);
    assert(key.length !== 0);

    this._keys[index] = key;
  }

  public key(index: number): Buffer {
    assert(index >= 0 && index <= 15);
    return this._keys[index];
  }
}

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

  public serialize(): Buffer {
    const encodedPath: Buffer = Util.encodeCompactExtensionPath(this._nibblePath);
    const raw: Buffer[] = [encodedPath, this._key];
    return rlp.encode(raw);
  }

  public get key(): Buffer {
    return this._key;
  }

  public get nibblePath(): Buffer {
    return this._nibblePath;
  }
}

class LeafNode extends NodeBase {
  /* Storage */

  private _nibblePath: Buffer;

  private _value: Buffer;


  /* Public Functions */

  public constructor(nibblePath: Buffer, value: Buffer) {
    super(NodeType.Leaf);

    Util.assertNibbleArray(nibblePath);

    this._nibblePath = nibblePath;
    this._value = value;
  }

  public serialize(): Buffer {
    const encodedPath: Buffer = Util.encodeCompactExtensionPath(this._nibblePath);
    const raw: Buffer[] = [encodedPath, Buffer.from(this._value)];

    return rlp.encode(raw);
  }

  public get value(): Buffer {
    return this._value;
  }

  public get nibblePath(): Buffer {
    return this._nibblePath;
  }
}

export {
  NodeBase,
  LeafNode,
  ExtensionNode,
  BranchNode,
};
