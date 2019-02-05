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

const UtilityToken = artifacts.require('TestUtilityToken');
const MockEIP20CoGateway = artifacts.require('MockEIP20CoGateway');

const BN = require('bn.js');
const Utils = require('./../../test_lib/utils');

const EventDecoder = require('../../test_lib/event_decoder.js');

const NullAddress = Utils.NULL_ADDRESS;

const TOKEN_SYMBOL = 'UT';
const TOKEN_NAME = 'Utility Token';
const TOKEN_DECIMALS = 18;

contract('UtilityToken.increaseSupply()', (accounts) => {
  let brandedToken;
  let organization;
  let utilityToken;
  let coGatewayAddress;
  let beneficiary;
  let amount;

  beforeEach(async () => {
    brandedToken = accounts[4];
    organization = accounts[0];
    beneficiary = accounts[6];
    amount = new BN(1000);
    utilityToken = await UtilityToken.new(
      brandedToken,
      TOKEN_SYMBOL,
      TOKEN_NAME,
      TOKEN_DECIMALS,
      organization,
    );

    coGatewayAddress = accounts[1];

    await utilityToken.setCoGatewayAddress(coGatewayAddress);
  });

  it('should fail when account address is zero', async () => {
    beneficiary = NullAddress;

    await Utils.expectRevert(
      utilityToken.increaseSupply(beneficiary, amount, {
        from: coGatewayAddress,
      }),
      'Account address should not be zero.',
    );
  });

  it('should fail when amount is zero', async () => {
    amount = new BN(0);

    await Utils.expectRevert(
      utilityToken.increaseSupply(beneficiary, amount, {
        from: coGatewayAddress,
      }),
      'Amount should be greater than zero.',
    );
  });

  it('should fail when caller is not CoGateway address', async () => {
    await Utils.expectRevert(
      utilityToken.increaseSupply(beneficiary, amount, { from: accounts[7] }),
      'Only CoGateway can call the function.',
    );
  });

  it('should pass with correct params', async () => {
    const result = await utilityToken.increaseSupply.call(
      beneficiary,
      amount,
      {
        from: coGatewayAddress,
      },
    );

    assert.strictEqual(result, true, 'Contract should return true.');

    await utilityToken.increaseSupply(beneficiary, amount, {
      from: coGatewayAddress,
    });

    const beneficiaryBalance = await utilityToken.balanceOf.call(beneficiary);
    assert.strictEqual(
      amount.eq(beneficiaryBalance),
      true,
      `Beneficiary address balance should be ${amount}.`,
    );

    const totalSupply = await utilityToken.totalSupply();
    assert.strictEqual(
      totalSupply.eq(amount),
      true,
      `Token total supply from contract must be equal to ${amount}.`,
    );
  });

  it('should emit Transfer event', async () => {
    const tx = await utilityToken.increaseSupply(beneficiary, amount, {
      from: coGatewayAddress,
    });

    const event = EventDecoder.getEvents(tx, utilityToken);

    assert.isDefined(event.Transfer, 'Event Transfer must be emitted.');

    const eventData = event.Transfer;

    assert.strictEqual(
      eventData._from,
      NullAddress,
      'The _from address in the event should be zero.',
    );

    assert.strictEqual(
      eventData._to,
      beneficiary,
      `The _to address in the event should be equal to ${beneficiary}.`,
    );

    assert.strictEqual(
      amount.eq(eventData._value),
      true,
      `The _value amount in the event should be equal to ${amount}.`,
    );
  });
});
