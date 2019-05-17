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

import 'mocha';
import { assert } from 'chai';
import ExtensionNode from '../../src/ExtensionNode';

describe('ExtensionNode::encodeCompact', (): void => {
  it('Reverts if a buffer is empty.', (): void => {
    assert.throws(
      (): Buffer => ExtensionNode.encodeCompact(Buffer.alloc(0)),
      'A nibble path to encode compact is empty.',
    );
  });

  it('Checks an odd-length buffer conversion.', (): void => {
    assert.deepEqual(
      ExtensionNode.encodeCompact(Buffer.from([1, 2, 3, 4, 5])),
      Buffer.from(String.fromCharCode(0x11, 0x23, 0x45)),
    );
  });

  it('Checks an even-length buffer conversion.', (): void => {
    assert.deepEqual(
      ExtensionNode.encodeCompact(Buffer.from([0, 1, 2, 3, 4, 5])),
      Buffer.from(String.fromCharCode(0x00, 0x01, 0x23, 0x45)),
    );
  });
});
