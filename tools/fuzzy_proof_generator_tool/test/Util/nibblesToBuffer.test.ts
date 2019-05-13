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
import Util from '../../src/Util';

describe('Util::nibblesToBuffer', (): void => {
  it('Reverts if a buffer\'s length is odd.', (): void => {
    assert.throws(
      (): Buffer => Util.nibblesToBuffer(Buffer.from([1])),
    );

    assert.throws(
      (): Buffer => Util.nibblesToBuffer(Buffer.from([1, 2, 3])),
    );
  });

  it('Checks an empty buffer conversion.', (): void => {
    assert.deepEqual(
      Util.nibblesToBuffer(Buffer.alloc(0)),
      Buffer.alloc(0),
    );
  });

  it('Checks an one element buffer conversion.', (): void => {
    assert.deepEqual(
      Util.nibblesToBuffer(Buffer.from([6, 4])),
      Buffer.from('d'),
    );
  });

  it('Checks a multielement string conversion.', (): void => {
    assert.deepEqual(
      Util.nibblesToBuffer(Buffer.from([6, 3, 6, 0xF, 6, 9, 6, 0xE])),
      Buffer.from('coin'),
    );
  });
});
