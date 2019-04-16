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

const Organization = artifacts.require('Organization');

contract('Organization.isWorker()', async (accounts) => {
  const owner = accounts[0];
  const worker = accounts[1];
  let organization = null;

  beforeEach(async () => {
    const admin = Utils.NULL_ADDRESS;
    const workers = [];
    const expirationHeight = 0;

    organization = await Organization.new(
      owner,
      admin,
      workers,
      expirationHeight,
    );
  });

  it("should return false if the worker wasn't set", async () => {
    assert.strictEqual(
      await organization.isWorker.call(worker),
      false,
      'An address that was never registered should not return as valid',
    );
  });

  it('should return false if the worker has expired', async () => {
    const deltaExpirationHeight = 2;
    const blockNumber = await web3.eth.getBlockNumber();
    const expirationHeight = blockNumber + deltaExpirationHeight;
    await organization.setWorker(worker, expirationHeight, { from: owner });

    // Dummy Transaction to increase block number.
    for (let i = 0; i < deltaExpirationHeight; i++) {
      await Utils.advanceBlock();
    }
    assert.strictEqual(
      await organization.isWorker.call(worker),
      false,
      'The worker should not be active anymore after it expired.',
    );
  });

  it('Checks for added worker, isWorker returns true.', async () => {
    const deltaExpirationHeight = 15;
    const blockNumber = await web3.eth.getBlockNumber();
    // `+ 1` as we are now one block further then what getBlockNumber returned.
    const expirationHeight = blockNumber + deltaExpirationHeight + 1;
    await organization.setWorker(worker, expirationHeight, { from: owner });

    /*
     * Check for all relevant blocks. Minus one, because expiration must be
     * less than current block height.
     */
    for (let i = 0; i < deltaExpirationHeight - 1; i++) {
      assert.strictEqual(
        await organization.isWorker.call(worker),
        true,
        'The worker should be active at this height.',
      );
      Utils.advanceBlock();
    }

    assert.strictEqual(
      await organization.isWorker.call(worker),
      false,
      'The worker should now be expired.',
    );
  });
});
