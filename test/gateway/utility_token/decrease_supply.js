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

const UtilityToken = artifacts.require('TestUtilityToken');
const MockEIP20CoGateway = artifacts.require('MockEIP20CoGateway');

const Utils = require("./../../test_lib/utils"),
  EventDecoder = require('../../test_lib/event_decoder.js'),
  BN = require('bn.js');

const NullAddress = "0x0000000000000000000000000000000000000000";

const TOKEN_SYMBOL = "UT";
const TOKEN_NAME = "Utility Token";
const TOKEN_DECIMALS = 18;

contract('UtilityToken.decreaseSupply()', function (accounts) {

  let brandedToken,
    membersManager,
    utilityToken,
    coGatewayAddress,
    amount;

  beforeEach(async function () {
    brandedToken = accounts[4];
    membersManager = accounts[0];
    amount = new BN(1000);
    utilityToken = await UtilityToken.new(
      brandedToken,
      TOKEN_SYMBOL,
      TOKEN_NAME,
      TOKEN_DECIMALS,
      membersManager,
    );

    coGatewayAddress = accounts[1];

    await utilityToken.setCoGatewayAddress(coGatewayAddress);
    await utilityToken.setBalance(coGatewayAddress, amount);
    await utilityToken.setTotalSupply(amount);

  });

  it('should fail when decrease supply amount is zero', async function () {

    amount = new BN(0);

    await Utils.expectRevert(
      utilityToken.decreaseSupply(amount, { from: coGatewayAddress }),
      'Amount should be greater than zero.',
    );

  });

  it('should fail when caller is not cogateway address', async function () {

    await Utils.expectRevert(
      utilityToken.decreaseSupply(amount, { from: accounts[5] }),
      'Only CoGateway can call the function.',
    );

  });

  it('should fail when decrease supply amount is greater than the available' +
    ' balance', async function () {

    amount = new BN(2000);

    await Utils.expectRevert(
      utilityToken.decreaseSupply(amount, { from: coGatewayAddress }),
      'Insufficient balance.',
    );

  });

  it('should pass when called with valid params', async function () {

    amount = new BN(500);

    let result = await utilityToken.decreaseSupply.call(
      amount, { from: coGatewayAddress }
    );

    assert.strictEqual(
      result,
      true,
      'Contract should return true.',
    );

    await utilityToken.decreaseSupply(amount, { from: coGatewayAddress });

    let coGatewayBalance = await utilityToken.balanceOf.call(coGatewayAddress);
    assert.strictEqual(
      coGatewayBalance.eqn(500),
      true,
      'CoGateway address balance should be zero.',
    );

    let totalSupply = await utilityToken.totalSupply();
    assert.strictEqual(
      totalSupply.eqn(500),
      true,
      'Token total supply from contract must be equal to zero.',
    );

  });

  it('should emit transfer event', async function () {

    let tx = await utilityToken.decreaseSupply(
      amount,
      { from: coGatewayAddress }
    );

    let event = EventDecoder.getEvents(tx, utilityToken);

    assert.isDefined(
      event.Transfer,
      'Event `Transfer` must be emitted.',
    );

    let eventData = event.Transfer;

    assert.strictEqual(
      eventData._from,
      coGatewayAddress,
      `The _from address in the event should be equal to ${coGatewayAddress}.`
    );

    assert.strictEqual(
      eventData._to,
      NullAddress,
      'The _to address in the event should be equal to zero.'
    );

    assert.strictEqual(
      amount.eq(eventData._value),
      true,
      `The _value amount in the event should be equal to ${amount}.`
    );

  });


});
