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

const OSTPrime = artifacts.require("TestOSTPrime")
  , BN = require('bn.js');

const Utils = require('../../../test/test_lib/utils');
const EventDecoder = require('../../test_lib/event_decoder.js');

contract('OSTPrime.unwrap()', function (accounts) {

  const DECIMAL = new BN(10);
  const POW = new BN(18);
  const DECIMAL_FACTOR = DECIMAL.pow(POW);
  const TOKENS_MAX = new BN(800000000).mul(DECIMAL_FACTOR);

  let brandedTokenAddress, ostPrime, callerAddress, amount, organization;

  async function initialize(){
    await ostPrime.initialize(
      {from: accounts[2], value:TOKENS_MAX}
    );
  };

  beforeEach(async function () {

    organization = accounts[0];
    brandedTokenAddress = accounts[2];
    ostPrime = await OSTPrime.new(brandedTokenAddress, organization);

    callerAddress = accounts[3];
    amount = new BN(500);

    await ostPrime.setTokenBalance(callerAddress, amount);

  });

  it('should fail when the amount is zero', async function () {
    await initialize();

    let amount = 0;
    await Utils.expectRevert(
      ostPrime.unwrap(amount, { from: callerAddress }),
      'Amount must not be zero.'
    );

  });

  it('should fail when contract is not initialized', async function () {

    await Utils.expectRevert(
      ostPrime.unwrap(amount, { from: callerAddress }),
      'Contract is not initialized.'
    );

  });

  it('should fail when amount is greater than the account balance',
    async function () {

      await initialize();

      let amount = new BN(501);
      await Utils.expectRevert(
        ostPrime.unwrap(amount, { from: callerAddress }),
        'Insufficient balance.'
      );

    });

  it('should fail when the amount is greater than the contract\'s base ' +
    'token balance', async function () {

    await initialize();

    let amount = TOKENS_MAX.addn(1);
    await ostPrime.setTokenBalance(callerAddress, amount);
    await Utils.expectFailedAssert(
      ostPrime.unwrap(amount, { from: callerAddress }),
      'invalid opcode',
    );

  });

  it('should pass with correct parameters', async function () {
    await initialize();

    let initialContractBalance = await Utils.getBalance(ostPrime.address);

    let initialCallerBalance = await Utils.getBalance(callerAddress);

    amount = new BN(400);

    let result = await ostPrime.unwrap.call(amount, { from: callerAddress });
    assert.strictEqual(
      result,
      true,
      `The contract should return true.`
    );

    let tx = await ostPrime.unwrap(amount, { from: callerAddress });
    let gasUsed = new BN(tx.receipt.gasUsed);

    let callerEIP20Tokenbalance = await ostPrime.balanceOf.call(callerAddress);
    assert.strictEqual(
      callerEIP20Tokenbalance.eqn(100),
      true,
      `The balance of ${callerAddress} should be 100.`
    );

    let contractEIP20Tokenbalance = await ostPrime.balanceOf.call(ostPrime.address);
    assert.strictEqual(
      contractEIP20Tokenbalance.eq(amount),
      true,
      `The balance of OST prime contract should increase by ${amount}.`
    );

    let finalContractBalance = await Utils.getBalance(ostPrime.address);
    

    let finalCallerBalance = await Utils.getBalance(callerAddress);

    assert.strictEqual(
      finalContractBalance.eq(initialContractBalance.sub(amount)),
      true,
      `Contract base token balance should decrease by ${amount}`
    );

    assert.strictEqual(
      finalCallerBalance.eq(initialCallerBalance.add(amount).sub(gasUsed)),
      true,
      `Caller's base token balance should change by ${amount.sub(gasUsed)}`
    );

  });

  it('should emit transfer event', async function () {
    await initialize();

    let tx = await ostPrime.unwrap(amount, { from: callerAddress });

    let event = EventDecoder.getEvents(tx, ostPrime);

    assert.isDefined(
      event.Transfer,
      'Event `Transfer` must be emitted.',
    );

    let eventData = event.Transfer;

    assert.strictEqual(
      eventData._from,
      callerAddress,
      `The _from address in the event should be equal to ${callerAddress}`
    );

    assert.strictEqual(
      eventData._to,
      ostPrime.address,
      `The _to address in the event should be equal to ${ostPrime.address}`
    );

    assert.strictEqual(
      amount.eq(eventData._value),
      true,
      `The _value in the event should be equal to ${amount}`
    );

  });

  it('should emit token unwrapped event', async function () {
    await initialize();

    let tx = await ostPrime.unwrap(amount, { from: callerAddress });

    let event = EventDecoder.getEvents(tx, ostPrime);

    assert.isDefined(
      event.TokenUnwrapped,
      'Event `TokenUnwrapped` must be emitted.',
    );

    let eventData = event.TokenUnwrapped;

    assert.strictEqual(
      eventData._account,
      callerAddress,
      `The _account address in the event should be equal to ${callerAddress}`
    );

    assert.strictEqual(
      amount.eq(eventData._amount),
      true,
      `The _amount in the event should be equal to ${amount}`
    );

  });

});
