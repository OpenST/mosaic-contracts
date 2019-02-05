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

contract('MutexAddress.release()', async (accounts) => {
  it('should release lock for an address', async () => {
    const mutex = await MutexAddress.new();

    const address = accounts[0];
    await mutex.acquireExternal(address);

    let result = await mutex.releaseExternal.call(address);
    assert.strictEqual(result, true, 'Lock acquire should succeed.');
    await mutex.releaseExternal(address);

    await Utils.expectRevert(
      mutex.releaseExternal(address),
      'Lock is not acquired for the address.',
    );
    result = await mutex.acquireExternal.call(address);

    assert.strictEqual(result, true, 'Lock acquire should succeed.');
  });

  it('should not release lock for an address if already released', async () => {
    const mutex = await MutexAddress.new();

    const address = accounts[0];
    await mutex.acquireExternal(address);

    await mutex.releaseExternal(address);

    Utils.expectRevert(
      mutex.releaseExternal(address),
      'Lock is not acquired for the address.',
    );
  });

  it('should not release lock if lock is not acquired', async () => {
    const mutex = await MutexAddress.new();

    const address = accounts[0];

    await Utils.expectRevert(
      mutex.releaseExternal(address),
      'Lock is not acquired for the address.',
    );
  });
});
