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
const Utils = require('../../../test/test_lib/utils');
const EventDecoder = require('../../test_lib/event_decoder.js');

const zeroBytes =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

contract('SafeCore.commitStateRoot()', function (accounts) {

  let remoteChainId,
    blockHeight,
    stateRoot,
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
    organization = await MockOrganization.new(owner, worker);

    safeCore = await SafeCore.new(
      remoteChainId,
      blockHeight,
      stateRoot,
      organization.address,
    );

    stateRoot = web3.utils.sha3("dummy_state_root_1");

  });

  it('should fail when state root is zero', async () => {

    stateRoot = zeroBytes;
    blockHeight = blockHeight.addn(1);

    await Utils.expectRevert(
      safeCore.commitStateRoot(
        blockHeight,
        stateRoot,
        { from: worker },
      ),
      'State root must not be zero.',
    );

  });

  it('should fail when block height is less than the latest committed ' +
    'state root\'s block height', async () => {

      blockHeight = blockHeight.subn(1);

      await Utils.expectRevert(
        safeCore.commitStateRoot(
          blockHeight,
          stateRoot,
          { from: worker },
        ),
        'Given block height is lower or equal to highest committed state root block height.',
      );

    });

  it('should fail when block height is equal to the latest committed ' +
    'state root\'s block height', async () => {

      await Utils.expectRevert(
        safeCore.commitStateRoot(
          blockHeight,
          stateRoot,
          { from: worker },
        ),
        'Given block height is lower or equal to highest committed state root block height.',
      );

    });

  it('should fail when caller is not worker address', async () => {

    blockHeight = blockHeight.addn(1);

    await Utils.expectRevert(
      safeCore.commitStateRoot(
        blockHeight,
        stateRoot,
        { from: accounts[6] },
      ),
      'Only whitelisted workers are allowed to call this method.',
    );

  });

  it('should pass with correct params', async () => {

    blockHeight = blockHeight.addn(1);

    let result = await safeCore.commitStateRoot.call(
      blockHeight,
      stateRoot,
      { from: worker },
    );

    assert.strictEqual(
      result,
      true,
      'Return value of commitStateRoot must be true.',
    );

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

    let latestStateRoot = await safeCore.getStateRoot.call(blockHeight);
    assert.strictEqual(
      latestStateRoot,
      stateRoot,
      `Latest state root from the contract must be ${stateRoot}.`,
    );

  });

  it('should emit `StateRootAvailable` event', async () => {

    blockHeight = blockHeight.addn(1);

    let tx = await safeCore.commitStateRoot(
      blockHeight,
      stateRoot,
      { from: worker },
    );

    let event = EventDecoder.getEvents(tx, safeCore);

    assert.isDefined(
      event.StateRootAvailable,
      'Event `StateRootAvailable` must be emitted.',
    );

    let eventData = event.StateRootAvailable;

    assert.strictEqual(
      eventData._stateRoot,
      stateRoot,
      `The _stateRoot value in the event should be equal to ${stateRoot}`
    );

    assert.strictEqual(
      blockHeight.eq(eventData._blockHeight),
      true,
      `The _blockHeight in the event should be equal to ${blockHeight}`
    );

  });

});
