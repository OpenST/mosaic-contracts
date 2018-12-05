// Copyright 2018 OpenST Ltd.
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

const Utils = require('../../test_lib/utils.js');
const Organization = artifacts.require('Organization');

contract('Organization.isWorker()', async (accounts) => {

  let owner = accounts[0];
  let worker = accounts[0];
  let organization = null;

  beforeEach(async function () {
    organization = await Organization.new({ from: owner });
  });

  it('should return false if the worker wasn\'t set', async () => {
    assert.strictEqual(
      await organization.isWorker.call(worker),
      false,
      'An address that was never registered should not return as valid',
    );
  });

  it('should return false if the worker has expired', async () => {
    let deltaExpirationHeight = 2;
    let blockNumber = await web3.eth.getBlockNumber();
    let expirationHeight = blockNumber + deltaExpirationHeight;
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
    let deltaExpirationHeight = 2;
    let blockNumber = await web3.eth.getBlockNumber();
    let expirationHeight = blockNumber + deltaExpirationHeight;
    await organization.setWorker(worker, expirationHeight, { from: owner });

    // Check for all relevant blocks.
    for (let i = 0; i < deltaExpirationHeight; i++) {
      assert.strictEqual(await organization.isWorker.call(worker), true);
    }
  });

});
