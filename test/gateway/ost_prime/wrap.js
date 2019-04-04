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

const web3 = require('../../test_lib/web3.js');
const Utils = require('../../../test/test_lib/utils');
const EventDecoder = require('../../test_lib/event_decoder.js');

contract('OSTPrime.wrap()', (accounts) => {
  const DECIMAL = new BN(10);
  const POW = new BN(18);
  const DECIMAL_FACTOR = DECIMAL.pow(POW);
  const TOKENS_MAX = new BN(800000000).mul(DECIMAL_FACTOR);

  let brandedTokenAddress;
  let ostPrime;
  let callerAddress;
  let amount;
  let organization;

  async function initialize() {
    await ostPrime.initialize({ from: accounts[5], value: TOKENS_MAX });
  }

  beforeEach(async () => {
    organization = accounts[0];
    brandedTokenAddress = accounts[2];
    ostPrime = await OSTPrime.new(brandedTokenAddress, organization);

    callerAddress = accounts[3];
    amount = new BN(500);

    await ostPrime.setTokenBalance(ostPrime.address, amount);
  });

  it('should fail when the payable amount is zero', async () => {
    await initialize();

    const amount = 0;
    await Utils.expectRevert(
      ostPrime.wrap({ from: callerAddress, value: amount }),
      'Payable amount should not be zero.',
    );
  });

  it('should fail when the contract is not initialized', async () => {
    await Utils.expectRevert(
      ostPrime.wrap({ from: callerAddress, value: amount }),
      'Contract is not initialized.',
    );
  });

  it(
    'should fail when the payable amount sent is less than the available '
      + 'balance',
    async () => {
      await initialize();

      /*
       * Create a new account for this testing. This will just contain the
       * sufficient amount of gas that is required for this testing. We are not
       * using the existing account as it is used by other test cases. There will
       * an overhead to manage the gas for the account if used.
       */
      const newAccount = await web3.eth.personal.newAccount('password');
      await web3.eth.personal.unlockAccount(newAccount, 'password', 15000);

      await web3.eth.sendTransaction({
        to: newAccount,
        from: accounts[0],
        value: new BN(12000000),
      });

      await Utils.expectFailedAssert(
        ostPrime.wrap({ from: newAccount, value: new BN(120005000) }),
        "sender doesn't have enough funds to send tx",
      );
    },
  );

  it('should fail when OST Prime balance is insufficient', async () => {
    await initialize();

    await Utils.expectFailedAssert(
      ostPrime.wrap({ from: callerAddress, value: new BN(1000) }),
      'invalid opcode',
    );
  });

  it('should pass with correct parameters ', async () => {
    await initialize();

    const initialContractBalance = await Utils.getBalance(ostPrime.address);

    const initialCallerBalance = await Utils.getBalance(callerAddress);

    const result = await ostPrime.wrap.call({
      from: callerAddress,
      value: amount,
    });

    assert.strictEqual(result, true, 'The contract should return true.');

    const tx = await ostPrime.wrap({ from: callerAddress, value: amount });
    const gasUsed = new BN(tx.receipt.gasUsed);

    const callerEIP20Tokenbalance = await ostPrime.balanceOf.call(
      callerAddress,
    );
    assert.strictEqual(
      callerEIP20Tokenbalance.eq(amount),
      true,
      `The balance of ${callerAddress} should increase by ${amount}.`,
    );

    const contractEIP20Tokenbalance = await ostPrime.balanceOf.call(
      ostPrime.address,
    );
    assert.strictEqual(
      contractEIP20Tokenbalance.eq(new BN(0)),
      true,
      'The balance of OST prime contract should be zero.',
    );

    const finalContractBalance = await Utils.getBalance(ostPrime.address);

    const finalCallerBalance = await Utils.getBalance(callerAddress);

    assert.strictEqual(
      finalContractBalance.eq(initialContractBalance.add(amount)),
      true,
      `Contract base token balance should increase by ${amount}`,
    );

    assert.strictEqual(
      finalCallerBalance.eq(initialCallerBalance.sub(amount).sub(gasUsed)),
      true,
      `Caller's base token balance should decrease by ${amount.sub(gasUsed)}`,
    );
  });

  it('should emit transfer event', async () => {
    await initialize();

    const tx = await ostPrime.wrap({ from: callerAddress, value: amount });

    const event = EventDecoder.getEvents(tx, ostPrime);

    assert.isDefined(event.Transfer, 'Event `Transfer` must be emitted.');

    const eventData = event.Transfer;

    assert.strictEqual(
      eventData._from,
      ostPrime.address,
      `The _from address in the event should be equal to ${ostPrime.address}`,
    );

    assert.strictEqual(
      eventData._to,
      callerAddress,
      `The _to address in the event should be equal to ${callerAddress}`,
    );

    assert.strictEqual(
      amount.eq(eventData._value),
      true,
      `The _value in the event should be equal to ${amount}`,
    );
  });

  it('should emit token wrapped event', async () => {
    await initialize();

    const tx = await ostPrime.wrap({ from: callerAddress, value: amount });

    const event = EventDecoder.getEvents(tx, ostPrime);

    assert.isDefined(
      event.TokenWrapped,
      'Event `TokenWrapped` must be emitted.',
    );

    const eventData = event.TokenWrapped;

    assert.strictEqual(
      eventData._account,
      callerAddress,
      `The _account address in the event should be equal to ${callerAddress}`,
    );

    assert.strictEqual(
      amount.eq(eventData._amount),
      true,
      `The _amount in the event should be equal to ${amount}`,
    );
  });
});
