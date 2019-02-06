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

const MockOrganization = artifacts.require('MockOrganization.sol');
const Anchor = artifacts.require('./Anchor.sol');
const BN = require('bn.js');
const web3 = require('../../test_lib/web3.js');
const Utils = require('../../test_lib/utils.js');

const zeroBytes = Utils.ZERO_BYTES32;

contract('Anchor.getStateRoot()', (accounts) => {
  let remoteChainId;
  let blockHeight;
  let stateRoot;
  let maxNumberOfStateRoots;
  let organization;
  let anchor;
  let owner;
  let worker;

  beforeEach(async () => {
    owner = accounts[2];
    worker = accounts[3];
    remoteChainId = new BN(1410);
    blockHeight = new BN(5);
    stateRoot = web3.utils.sha3('dummy_state_root');
    maxNumberOfStateRoots = new BN(10);
    organization = await MockOrganization.new(owner, worker);

    anchor = await Anchor.new(
      remoteChainId,
      blockHeight,
      stateRoot,
      maxNumberOfStateRoots,
      organization.address,
    );
  });

  it(
    'should return the latest state root block height that was set '
      + 'while deployment',
    async () => {
      const latestStateRoot = await anchor.getStateRoot.call(blockHeight);
      assert.strictEqual(
        latestStateRoot,
        stateRoot,
        `Latest state root from the contract must be ${stateRoot}.`,
      );
    },
  );

  it('should return the zero bytes for non anchored block heights', async () => {
    blockHeight = blockHeight.addn(500);

    const latestStateRoot = await anchor.getStateRoot.call(blockHeight);
    assert.strictEqual(
      latestStateRoot,
      zeroBytes,
      `Latest state root from the contract must be ${zeroBytes}.`,
    );
  });

  it('should return the latest anchored state root', async () => {
    blockHeight = blockHeight.addn(50000);
    stateRoot = web3.utils.sha3('dummy_state_root_1');

    await anchor.anchorStateRoot(blockHeight, stateRoot, { from: owner });

    const latestStateRoot = await anchor.getStateRoot.call(blockHeight);
    assert.strictEqual(
      latestStateRoot,
      stateRoot,
      `Latest state root from the contract must be ${stateRoot}.`,
    );
  });
});
