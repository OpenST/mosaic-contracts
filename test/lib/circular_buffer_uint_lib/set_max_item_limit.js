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

const Utils = require('../../test_lib/utils.js');

const CircularBufferUint = artifacts.require('TestCircularBufferUintLib');

contract('CircularBufferUintLib.setMaxItemLimit()', async (accounts) => {

  var circularBufferUint;
  beforeEach(async () => {
    circularBufferUint = await CircularBufferUint.new();
  });

  it('should fail when max limit is zero', async () => {
    await Utils.expectRevert(
      circularBufferUint.setMaxItemLimit(0),
      'The max number of items to store in a circular buffer must be greater than 0.'
    );
  });

  it('should set max item limit', async () => {
    await circularBufferUint.setMaxItemLimit(100);

    let maxLimit = await circularBufferUint.getMaxItemLimit.call();
    assert.strictEqual(
      maxLimit.eqn(100),
      true,
      'Buffer max limit should be 100.',
    );

  });

  it('should fail when max limit is already set once', async () => {
    await circularBufferUint.setMaxItemLimit(100);
    await Utils.expectRevert(
      circularBufferUint.setMaxItemLimit(200),
      'Buffer max item limit is already set.'
    );
  });

});
