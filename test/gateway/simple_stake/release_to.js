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

const SimpleStake = artifacts.require('./SimpleStake.sol');
const MockToken = artifacts.require('./MockToken.sol');
const BN = require('bn.js');

const Utils = require('../../../test/test_lib/utils.js');
const Events = require('../../test_lib/event_decoder.js');

contract('SimpleStake.releaseTo()', (accounts) => {
  const gateway = accounts[4];
  let token;
  let simpleStake;
  beforeEach(async () => {
    token = await MockToken.new({ from: accounts[0] });
    const amount = new BN(100);

    simpleStake = await SimpleStake.new(token.address, gateway, {
      from: accounts[0],
    });

    await token.transfer(simpleStake.address, amount, { from: accounts[0] });
  });

  it('should pass with correct parameters', async () => {
    const beneficiary = accounts[5];
    const releasedAmount = new BN(50);

    const previousBeneficiaryBalance = await token.balanceOf.call(beneficiary);
    const previousSimpleStakeBalance = await token.balanceOf.call(
      simpleStake.address,
    );

    const success = await simpleStake.releaseTo.call(
      beneficiary,
      releasedAmount,
      { from: gateway },
    );

    assert.strictEqual(success, true, 'Expected success status.');

    const tx = await simpleStake.releaseTo(beneficiary, releasedAmount, {
      from: gateway,
    });

    const events = Events.perform(
      tx.receipt,
      simpleStake.address,
      simpleStake.abi,
    );

    assert.isDefined(events.ReleasedStake, 'Release stake event not emitted.');
    assert.strictEqual(
      events.ReleasedStake._gateway,
      gateway,
      'Expected gateway address is different from actual address.',
    );
    assert.strictEqual(
      events.ReleasedStake._to,
      beneficiary,
      'Expected beneficiary address is different from actual address.',
    );
    assert.strictEqual(
      events.ReleasedStake._amount.eq(releasedAmount),
      true,
      'Released stake amount is different from expected amount.',
    );

    const expectedBeneficiaryBalance = previousBeneficiaryBalance.add(
      releasedAmount,
    );
    const expectedSimpleStakeBalance = previousSimpleStakeBalance.sub(
      releasedAmount,
    );

    const latestBeneficiaryBalance = await token.balanceOf.call(beneficiary);
    const latestSimpleStakeBalance = await token.balanceOf.call(
      simpleStake.address,
    );
    assert.strictEqual(
      latestBeneficiaryBalance.eq(expectedBeneficiaryBalance),
      true,
      'Expected balance of beneficiary after release is not equal to'
        + ' actual balance',
    );

    assert.strictEqual(
      latestSimpleStakeBalance.eq(expectedSimpleStakeBalance),
      true,
      'Expected balance of simple stake after release is not equal to'
        + ' actual balance',
    );
  });

  it('should fail if amount is zero', async () => {
    const beneficiary = accounts[5];
    const releasedAmount = new BN(0);

    await Utils.expectRevert(
      simpleStake.releaseTo(beneficiary, releasedAmount, { from: gateway }),
      'Release amount must not be zero.',
    );
  });

  it('should fail if simple stake has insufficient EIP20 fund', async () => {
    const beneficiary = accounts[5];
    const releasedAmount = new BN(200);

    await Utils.expectRevert(
      simpleStake.releaseTo(beneficiary, releasedAmount, { from: gateway }),
      'Underflow when subtracting.',
    );
  });

  it('should fail if not called by gateway', async () => {
    const beneficiary = accounts[5];
    const releasedAmount = new BN(10);

    await Utils.expectRevert(
      simpleStake.releaseTo(beneficiary, releasedAmount, {
        from: accounts[3],
      }),
      'Only gateway can call the function.',
    );
  });
});
