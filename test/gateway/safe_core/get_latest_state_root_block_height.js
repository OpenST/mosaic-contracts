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
//
// ----------------------------------------------------------------------------
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const SafeCore = artifacts.require("./SafeCore.sol");
const MockOrganization = artifacts.require('MockOrganization.sol');
const web3 = require('../../test_lib/web3.js');
const BN = require('bn.js');

contract('SafeCore.getLatestStateRootBlockHeight()', function (accounts) {

  let remoteChainId,
    blockHeight,
    stateRoot,
    maxNumberOfStateRoots,
    organization,
    safeCore,
    owner,
    worker;

  beforeEach(async function () {

    owner = accounts[2];
    worker = accounts[3];
    remoteChainId = new BN(1410);
    blockHeight = new BN(5);
    stateRoot = web3.utils.sha3("dummy_state_root");
    maxNumberOfStateRoots = new BN(10);
    organization = await MockOrganization.new(owner, worker);

    safeCore = await SafeCore.new(
      remoteChainId,
      blockHeight,
      stateRoot,
      maxNumberOfStateRoots,
      organization.address,
    );

  });

  it('should return the state root that was set while deployment', async () => {

    let latestBlockHeight = await safeCore.getLatestStateRootBlockHeight.call();
    assert.strictEqual(
      blockHeight.eq(latestBlockHeight),
      true,
      `Latest block height from the contract must be ${blockHeight}.`,
    );

  });

  it('should return the latest committed state root block height', async () => {

    blockHeight = blockHeight.addn(50000);

    await safeCore.commitStateRoot(
      blockHeight,
      stateRoot,
      { from: worker },
    );

    let latestBlockHeight = await safeCore.getLatestStateRootBlockHeight.call();
    assert.strictEqual(
      blockHeight.eq(latestBlockHeight),
      true,
      `Latest block height from the contract must be ${blockHeight}.`,
    );

  });

});
