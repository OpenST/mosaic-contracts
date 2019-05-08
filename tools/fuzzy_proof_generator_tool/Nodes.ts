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

const assert = require('assert');
const rlp = require('rlp');
const ethUtil = require('ethereumjs-util');

import { NodeType } from './Types';
import { Util } from './Util';


abstract class NodeBase {

    /* Storage */

    private _type: NodeType;


    /* Abstract Functions */

    abstract serialize(): string;


    /* Public Functions */

    get type(): NodeType {
        return this._type;
    }

    hash(): string {
        return ethUtil.sha3(this.serialize());
    }

    /* Protected Functions */

    protected constructor(type: NodeType) {
        this._type = type;
    }
}

class BranchNode extends NodeBase {

    /* Storage */

    private _keys: string[];
    private _value: string;


    /* Public Functions */

    constructor(keys: string[], value: string) {
        super(NodeType.Branch);

        assert(keys.length == 16);

        this._value = value;
        this._keys = keys;
    }

    serialize(): string {
        const raw: string[] = [...this._keys, ...this._value];
        return rlp.encode(raw);
    }

    get value(): string {
        return this._value;
    }

    updateKey(index: number, key: string) {
        assert(index >= 0 && index <= 15);
        assert(key !== '');

        this._keys[index] = key;
    }

    key(index: number): string {
        assert(index >= 0 && index <= 15);
        return this._keys[index];
    }
}

class ExtensionNode extends NodeBase {

    /* Storage */

    private _nibblePath: number[];
    private _key: string;


    /* Public Functions */

    constructor(nibblePath: number[], key: string) {
        super(NodeType.Extension);

        assert(nibblePath.length !== 0);
        assert(key !== '');

        Util.assertNibbleArray(nibblePath);

        this._nibblePath = nibblePath;
        this._key = key;
    }

    serialize(): string {
        const encodedPath: Buffer = Util.encodeCompactExtensionPath(this._nibblePath);
        const raw: Buffer = Buffer.concat([encodedPath, Buffer.from(this._key)]);
        return rlp.encode(raw);
    }

    get key(): string {
        return this._key;
    }

    get nibblePath(): number[] {
        return this._nibblePath;
    }
}

class LeafNode extends NodeBase {

    /* Storage */

    private _nibblePath: number[];
    private _value: string;


    /* Public Functions */

    constructor(nibblePath: number[], value: string) {
        super(NodeType.Leaf);

        Util.assertNibbleArray(nibblePath);

        this._nibblePath = nibblePath;
        this._value = value;
    }

    serialize(): string {
        const encodedPath: Buffer = Util.encodeCompactExtensionPath(this._nibblePath);
        const raw: Buffer = Buffer.concat([encodedPath, Buffer.from(this._value)]);

        return rlp.encode(raw);
    }

    get value(): string {
        return this._value;
    }

    get nibblePath(): number[] {
        return this._nibblePath;
    }
}

export {
    NodeBase,
    LeafNode,
    ExtensionNode,
    BranchNode,
};
