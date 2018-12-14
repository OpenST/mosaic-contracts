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
const web3 = require('../../test_lib/web3.js');
const BN = require('bn.js');
const Utils = require('../../../test/test_lib/utils');

const NullAddress = "0x0000000000000000000000000000000000000000";

contract('SafeCore.constructor()', function (accounts) {

  let remoteChainId, blockHeight, stateRoot, membersManager, safeCore;

  beforeEach(async function () {

    remoteChainId = new BN(1410);
    blockHeight = new BN(5);
    stateRoot = web3.utils.sha3("dummy_state_root");
    membersManager = accounts[1];

  });

  it('should fail when remote chain id is zero', async () => {

    remoteChainId = new BN(0);

    await Utils.expectRevert(
      SafeCore.new(
        remoteChainId,
        blockHeight,
        stateRoot,
        membersManager,
      ),
      'Remote chain Id must not be 0.',
    );

  });

  it('should fail when members manager address is zero', async () => {

    membersManager = NullAddress;

    await Utils.expectRevert(
      SafeCore.new(
        remoteChainId,
        blockHeight,
        stateRoot,
        membersManager,
      ),
      'MembersManager contract address must not be zero.',
    );

  });

  it('should pass with correct params', async () => {

    safeCore = await SafeCore.new(
      remoteChainId,
      blockHeight,
      stateRoot,
      membersManager,
    );

    let chainId = await safeCore.getRemoteChainId.call();
    assert.strictEqual(
      remoteChainId.eq(chainId),
      true,
      `Remote chain id from the contract must be ${remoteChainId}.`,
    );

    let latestBlockHeight = await safeCore.getLatestStateRootBlockHeight.call();
    assert.strictEqual(
      blockHeight.eq(latestBlockHeight),
      true,
      `Latest block height from the contract must be ${blockHeight}.`,
    );

    let latestStateRoot = await safeCore.getStateRoot.call(blockHeight);
    assert.strictEqual(
      latestStateRoot,
      stateRoot,
      `Latest state root from the contract must be ${stateRoot}.`,
    );

    let membersManagerAddress = await safeCore.membersManager.call();
    assert.strictEqual(
      membersManagerAddress,
      membersManager,
      `Members manager address from the contract must be ${membersManager}.`,
    );

  });

});
