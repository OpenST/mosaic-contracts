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
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const BN = require('bn.js');
const Utils = require('../../test_lib/utils.js');

const CircularBufferUint = artifacts.require('TestCircularBufferUintLib');

contract('CircularBufferUintLib.head()', async (accounts) => {

  var circularBufferUint;
  beforeEach(async () => {
    circularBufferUint = await CircularBufferUint.new();
  });

  it('should fail when buffer max limit is not set', async () => {
    await Utils.expectRevert(
      circularBufferUint.head.call(),
      'Buffer max item limit is not set.'
    );
  });

  it('should return zero when the buffer is empty', async () => {
    await circularBufferUint.setMaxItemLimit(100);

    let head = await circularBufferUint.head.call();
    assert.strictEqual(
      head.eqn(0),
      true,
      'Head must be at zero.',
    );
  });

  it('should return correct head', async () => {
    const bufferLength = 10;
    await circularBufferUint.setMaxItemLimit(bufferLength);

    let expectedHead = new BN(0);
    for (let i = 0; i <= 25; i++) {
      let head = await circularBufferUint.head.call();
      assert.strictEqual(
        head.eq(expectedHead),
        true,
        `Head must be ${expectedHead.toString(10)}.`,
      );
      expectedHead = new BN(i);
      await circularBufferUint.store(new BN(i));
    }

  });

});
