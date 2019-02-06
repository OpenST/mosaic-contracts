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
const Utils = require('../../../test/test_lib/utils');
const EventDecoder = require('../../test_lib/event_decoder.js');

const zeroBytes = Utils.ZERO_BYTES32;
contract('Anchor.anchorStateRoot()', (accounts) => {
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

    stateRoot = web3.utils.sha3('dummy_state_root_1');
  });

  it('should fail when state root is zero', async () => {
    stateRoot = zeroBytes;
    blockHeight = blockHeight.addn(1);

    await Utils.expectRevert(
      anchor.anchorStateRoot(blockHeight, stateRoot, { from: owner }),
      'State root must not be zero.',
    );
  });

  it(
    'should fail when block height is less than the latest anchored '
      + "state root's block height",
    async () => {
      blockHeight = blockHeight.subn(1);

      await Utils.expectRevert(
        anchor.anchorStateRoot(blockHeight, stateRoot, { from: owner }),
        'Given block height is lower or equal to highest anchored state root block height.',
      );
    },
  );

  it(
    'should fail when block height is equal to the latest anchored '
      + "state root's block height",
    async () => {
      await Utils.expectRevert(
        anchor.anchorStateRoot(blockHeight, stateRoot, { from: owner }),
        'Given block height is lower or equal to highest anchored state root block height.',
      );
    },
  );

  it('should fail when caller is not owner address', async () => {
    blockHeight = blockHeight.addn(1);
    const nonOwner = accounts[6];

    await Utils.expectRevert(
      anchor.anchorStateRoot(blockHeight, stateRoot, { from: nonOwner }),
      'Only the organization is allowed to call this method.',
    );
  });

  it('should pass with correct params', async () => {
    blockHeight = blockHeight.addn(1);

    const result = await anchor.anchorStateRoot.call(blockHeight, stateRoot, {
      from: owner,
    });

    assert.strictEqual(
      result,
      true,
      'Return value of anchorStateRoot must be true.',
    );

    await anchor.anchorStateRoot(blockHeight, stateRoot, { from: owner });

    const latestBlockHeight = await anchor.getLatestStateRootBlockHeight.call();
    assert.strictEqual(
      blockHeight.eq(latestBlockHeight),
      true,
      `Latest block height from the contract must be ${blockHeight}.`,
    );

    const latestStateRoot = await anchor.getStateRoot.call(blockHeight);
    assert.strictEqual(
      latestStateRoot,
      stateRoot,
      `Latest state root from the contract must be ${stateRoot}.`,
    );
  });

  it('should emit `StateRootAvailable` event', async () => {
    blockHeight = blockHeight.addn(1);

    const tx = await anchor.anchorStateRoot(blockHeight, stateRoot, {
      from: owner,
    });

    const event = EventDecoder.getEvents(tx, anchor);

    assert.isDefined(
      event.StateRootAvailable,
      'Event `StateRootAvailable` must be emitted.',
    );

    const eventData = event.StateRootAvailable;

    assert.strictEqual(
      eventData._stateRoot,
      stateRoot,
      `The _stateRoot value in the event should be equal to ${stateRoot}`,
    );

    assert.strictEqual(
      blockHeight.eq(eventData._blockHeight),
      true,
      `The _blockHeight in the event should be equal to ${blockHeight}`,
    );
  });

  it('should store only the given number of max store roots', async () => {
    /*
     * It should store the given state roots and they should be
     * available for querying afterwards. After the max number of state
     * roots has been exceeded, the old state roots should no longer be
     * available.
     */
    const iterations = maxNumberOfStateRoots.muln(2).toNumber();
    for (let i = 0; i < iterations; i++) {
      blockHeight = blockHeight.addn(1);
      await anchor.anchorStateRoot(blockHeight, stateRoot, { from: owner });

      // Check that the older state root has been deleted when i > max state roots.
      if (maxNumberOfStateRoots.ltn(i)) {
        const prunedBlockHeight = blockHeight.sub(maxNumberOfStateRoots);
        let storedStateRoot = await anchor.getStateRoot.call(
          prunedBlockHeight,
        );
        assert.strictEqual(
          storedStateRoot,
          Utils.ZERO_BYTES32,
          'There should not be any state root stored at a '
            + 'pruned height. It should have been reset by now.',
        );

        /*
         * The state root that is one block younger than the pruned
         * one should still be available.
         */
        const existingBlockHeight = prunedBlockHeight.addn(1);
        storedStateRoot = await anchor.getStateRoot.call(existingBlockHeight);
        assert.strictEqual(
          storedStateRoot,
          stateRoot,
          'The stored state root should still exist.',
        );
      }
    }
  });
});
