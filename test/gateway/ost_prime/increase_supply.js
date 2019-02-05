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

const OSTPrime = artifacts.require('TestOSTPrime');

const BN = require('bn.js');

const Utils = require('../../../test/test_lib/utils');
const EventDecoder = require('../../test_lib/event_decoder.js');

const NullAddress = Utils.NULL_ADDRESS;

contract('OSTPrime.increaseSupply()', (accounts) => {
  const DECIMAL = new BN(10);
  const POW = new BN(18);
  const DECIMAL_FACTOR = DECIMAL.pow(POW);
  const TOKENS_MAX = new BN(800000000).mul(DECIMAL_FACTOR);

  let brandedTokenAddress;
  let beneficiary;
  let ostPrime;
  let callerAddress;
  let amount;
  let organization;
  let coGatewayAddress;

  async function initialize() {
    await ostPrime.initialize({ from: accounts[2], value: TOKENS_MAX });
  }

  beforeEach(async () => {
    beneficiary = accounts[6];
    organization = accounts[0];
    brandedTokenAddress = accounts[2];
    ostPrime = await OSTPrime.new(brandedTokenAddress, organization);

    callerAddress = accounts[3];
    amount = new BN(1000);

    await ostPrime.setTokenBalance(callerAddress, amount);

    coGatewayAddress = accounts[1];

    await ostPrime.setCoGatewayAddress(coGatewayAddress);
  });

  it('should fail when account address is zero', async () => {
    await initialize();

    beneficiary = NullAddress;

    await Utils.expectRevert(
      ostPrime.increaseSupply(beneficiary, amount, {
        from: coGatewayAddress,
      }),
      'Account address should not be zero.',
    );
  });

  it('should fail when amount is zero', async () => {
    await initialize();

    amount = new BN(0);

    await Utils.expectRevert(
      ostPrime.increaseSupply(beneficiary, amount, {
        from: coGatewayAddress,
      }),
      'Amount should be greater than zero.',
    );
  });

  it('should fail when caller is not CoGateway address', async () => {
    await initialize();

    await Utils.expectRevert(
      ostPrime.increaseSupply(beneficiary, amount, { from: accounts[7] }),
      'Only CoGateway can call the function.',
    );
  });

  it('should fail when OST Prime is not initialized', async () => {
    await Utils.expectRevert(
      ostPrime.increaseSupply(beneficiary, amount, { from: accounts[7] }),
      'Contract is not initialized.',
    );
  });

  it('should pass with correct params', async () => {
    await initialize();

    const result = await ostPrime.increaseSupply.call(beneficiary, amount, {
      from: coGatewayAddress,
    });

    assert.strictEqual(result, true, 'Contract should return true.');
    const initialBeneficiaryBalance = await Utils.getBalance(beneficiary);
    const initialOSTPrimeBalance = await Utils.getBalance(ostPrime.address);

    await ostPrime.increaseSupply(beneficiary, amount, {
      from: coGatewayAddress,
    });

    const finalBeneficiaryBalance = await Utils.getBalance(beneficiary);
    const finalOSTPrimeBalance = await Utils.getBalance(ostPrime.address);

    assert.strictEqual(
      finalBeneficiaryBalance.eq(initialBeneficiaryBalance.add(amount)),
      true,
      `Beneficiary base token address balance should be ${amount}.`,
    );

    assert.strictEqual(
      finalOSTPrimeBalance.eq(initialOSTPrimeBalance.sub(amount)),
      true,
      `OST Prime base token balance should be reduced by ${amount}.`,
    );

    const totalSupply = await ostPrime.totalSupply();
    assert.strictEqual(
      totalSupply.eq(amount),
      true,
      `Token total supply from contract must be equal to ${amount}.`,
    );
  });

  it('should emit Transfer event', async () => {
    await initialize();

    const tx = await ostPrime.increaseSupply(beneficiary, amount, {
      from: coGatewayAddress,
    });

    const event = EventDecoder.getEvents(tx, ostPrime);

    assert.isDefined(event.Transfer, 'Event Transfer must be emitted.');

    const eventData = event.Transfer;

    assert.strictEqual(
      eventData._from,
      NullAddress,
      'The _from address in the event should be zero.',
    );

    assert.strictEqual(
      eventData._to,
      ostPrime.address,
      `The _to address in the event should be equal to ${ostPrime.address}.`,
    );

    assert.strictEqual(
      amount.eq(eventData._value),
      true,
      `The _value amount in the event should be equal to ${amount}.`,
    );
  });
});
