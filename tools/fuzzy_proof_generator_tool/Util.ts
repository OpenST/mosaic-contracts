import { nibblesToBuffer } from "../../merkle-patricia-tree/src/util/nibbles";

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
const ethUtil = require('ethereumjs-util');

import { NodeType } from './Types';

export class Util {
    static generateRandomeKey(): string {
        return ethUtil.sha3(
            Array.from({ length: 32 }, () => Math.floor(Math.random() * 17)).join()
        );
    }

    static stringToNibbles(path: string): number[] {
        const bytes = Buffer.from(path);
        const nibbles = []

        for (let i = 0; i < bytes.length; i += 1) {
            let q = i * 2;
            nibbles[q] = bytes[i] >> 4;
            ++q;
            nibbles[q] = bytes[i] % 16;
        }

        return nibbles;
    }

    static nibblesToBuffer(nibbleArray: number[]): Buffer {
        assert(nibbleArray.length % 2 === 0);

        const buf = new Buffer(nibbleArray.length / 2);
        for (let i = 0; i < buf.length; i++) {
            let q: number = i * 2;
            buf[i] = (nibbleArray[q] << 4) + nibbleArray[q + 1]
        }
        return buf;
    }

    static encodeCompactLeafPath(nibblePath: number[]): Buffer {
        const evenLength: boolean = (nibblePath.length % 2 === 0);
        let extendedNibblePath: number[] = [];
        if (evenLength) {
            extendedNibblePath = [2, 0, ...nibblePath]
        } else {
            extendedNibblePath = [3, ...nibblePath]
        }

        return Util.nibblesToBuffer(extendedNibblePath);
    }

    static encodeCompactExtensionPath(nibblePath: number[]): Buffer {
        const evenLength: boolean = (nibblePath.length % 2 === 0);
        let extendedNibblePath: number[] = [];
        if (evenLength) {
            extendedNibblePath = [0, 0, ...nibblePath]
        } else {
            extendedNibblePath = [1, ...nibblePath]
        }

        return Util.nibblesToBuffer(extendedNibblePath);
    }

    static assertNibbleArray(nibbleArray: number[]) {
        nibbleArray.forEach(
            (n) => {
                assert(n >= 0 && n <= 15);
            }
        );
    }
}
