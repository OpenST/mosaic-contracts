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

import NibblesUtil from '../../src/NibblesUtil';

describe('NibblesUtil::toNibbles', (): void => {
  it('Checks an empty string conversion.', (): void => {
    const nibbleArray: Buffer = NibblesUtil.toNibbles(Buffer.from(''));
    assert.deepEqual(
      nibbleArray,
      Buffer.alloc(0),
    );
  });

  it('Checks a one element string conversion.', (): void => {
    const nibbleArray: Buffer = NibblesUtil.toNibbles(Buffer.from([0x64]));
    assert.deepEqual(
      nibbleArray,
      Buffer.from([6, 4]),
    );
  });

  it('Checks a multielement string conversion.', (): void => {
    const nibbleArray: Buffer = NibblesUtil.toNibbles(Buffer.from([0x63, 0x6F, 0x69, 0x6E]));
    assert.deepEqual(
      nibbleArray,
      Buffer.from([6, 3, 6, 0xF, 6, 9, 6, 0xE]),
    );
  });
});
