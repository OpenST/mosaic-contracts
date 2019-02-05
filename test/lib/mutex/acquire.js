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

const MutexAddress = artifacts.require('TestMutexAddress');

contract('MutexAddress.acquire()', async (accounts) => {
  it('should acquire lock for an address', async () => {
    const mutex = await MutexAddress.new();

    const address = accounts[0];
    const result = await mutex.acquireExternal.call(address);

    assert.strictEqual(result, true, 'Lock acquire should succeed.');

    await mutex.acquireExternal(address);

    await Utils.expectRevert(
      mutex.acquireExternal(address),
      'Lock already acquired for the account.',
    );
  });

  it('should not acquire lock for an address if already acquired', async () => {
    const mutex = await MutexAddress.new();

    const address = accounts[0];
    await mutex.acquireExternal(address);

    await Utils.expectRevert(
      mutex.acquireExternal(address),
      'Lock already acquired for the account.',
    );
  });

  it('should allow lock acquisition for more than one account', async () => {
    const mutex = await MutexAddress.new();

    const firstAddress = accounts[0];
    let result = await mutex.acquireExternal.call(firstAddress);

    assert.strictEqual(result, true, 'Lock acquire should succeed.');

    await mutex.acquireExternal(firstAddress);

    const secondAddress = accounts[1];
    result = await mutex.acquireExternal.call(secondAddress);

    assert.strictEqual(result, true, 'Lock acquire should succeed.');

    await mutex.acquireExternal(secondAddress);
  });
});
