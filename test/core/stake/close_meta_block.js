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

const BN = require('bn.js');
const Events = require('../../test_lib/event_decoder.js');
const StakeUtils = require('./helpers/stake_utils.js');
const Utils = require('../../test_lib/utils.js');

const MockToken = artifacts.require('MockToken');
const Stake = artifacts.require('Stake');

contract('Stake.closeMetaBlock()', async (accounts) => {
  const mosaicCoreAccount = accounts[1];
  const minimumWeight = new BN('1');
  let token;
  let stake;

  beforeEach(async () => {
    token = await MockToken.new();
    stake = await Stake.new(token.address, mosaicCoreAccount, minimumWeight);
    await StakeUtils.initializeStake(
      stake,
      token,
      accounts[0],
      [accounts[2]],
      [new BN('2')],
    );
  });

  it('should increase the meta-block height by 1', async () => {
    for (let expectedHeight = 2; expectedHeight < 5; expectedHeight++) {
      await stake.closeMetaBlock(new BN(expectedHeight - 1), {
        from: mosaicCoreAccount,
      });

      height = await stake.height.call();
      assert.strictEqual(
        expectedHeight,
        height.toNumber(),
        'The height should increase by one when an meta-block is closed.',
      );
    }
  });

  it('should emit an event when an meta-block is closed', async () => {
    let tx = await stake.closeMetaBlock(new BN(1), {
      from: mosaicCoreAccount,
    });
    let events = Events.perform(tx.receipt, stake.address, stake.abi);
    assert.strictEqual(
      Number(events.HeightIncreased.newHeight),
      2,
      'The contract did not emit an event with the new height.',
    );

    tx = await stake.closeMetaBlock(new BN(2), { from: mosaicCoreAccount });
    events = Events.perform(tx.receipt, stake.address, stake.abi);
    assert.strictEqual(
      Number(events.HeightIncreased.newHeight),
      3,
      'The contract did not emit an event with the new height.',
    );
  });

  it('should fail when a wrong height is given', async () => {
    await Utils.expectFailedAssert(
      stake.closeMetaBlock(new BN(3), { from: mosaicCoreAccount }),
    );
  });
});
