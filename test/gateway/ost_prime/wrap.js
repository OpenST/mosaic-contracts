const OSTPrime = artifacts.require("TestOSTPrime")
  , BN = require('bn.js');

const Utils = require('../../../test/test_lib/utils');
const EventDecoder = require('../../test_lib/event_decoder.js');

contract('OSTPrime.sol', function (accounts) {

  describe('Unwrap', async () => {

    const DECIMAL = new BN(10);
    const POW = new BN(18);
    const DECIMAL_FACTOR = DECIMAL.pow(POW);
    const TOKENS_MAX = new BN(800000000).mul(DECIMAL_FACTOR);

    let brandedTokenAddress, ostPrime, callerAddress, amount;

    async function initialize(){
      await ostPrime.initialize(
        {from: accounts[5], value:TOKENS_MAX}
      );
    };

    beforeEach(async function () {

      brandedTokenAddress = accounts[2];
      ostPrime = await OSTPrime.new(brandedTokenAddress);

      callerAddress = accounts[3];
      amount = new BN(500);

      await ostPrime.setTokenBalance(ostPrime.address, amount);

    });

    it('Should fail when the payable amount is zero', async function () {

      await initialize();

      let amount = 0;
      await Utils.expectRevert(
        ostPrime.wrap.call({from: callerAddress, value: amount }),
        "Payable amount should not be zero."
      );

    });

    it('Should fail when the contract is not initialized', async function () {

      await Utils.expectRevert(
        ostPrime.wrap.call({from: callerAddress, value: amount }),
        "Contract is not initialized."
      );

    });

    it('Should fail when the payable amount sent is less than the available ' +
      'balance', async function () {

      await initialize();

      // @dev this test with .call does not revert as expected.
      await Utils.expectRevert(
        ostPrime.wrap({from: accounts[9], value: amount }),
        "Available balance is less than payable amount."
      );

    });

    it('Should fail when EIP-20 balance is insufficient', async function () {

      await initialize();

      // @dev this test with .call does not revert as expected.
      await Utils.expectRevert(
        ostPrime.wrap.call({from: callerAddress, value: new BN(1000) }),
        "Insufficient EIP-20 token balance."
      );

    });

    it('Should pass with correct parameters ', async function () {

      await initialize();

      let initialContractBalance = new BN(
        await Utils.getBalance(ostPrime.address)
      );

      let initialCallerBalance = new BN(
        await Utils.getBalance(callerAddress)
      );

      let result = await ostPrime.wrap.call(
          {from: callerAddress, value: amount}
        );

      assert.strictEqual(
        result,
        true,
        `The contract should return true.`
      );

      let tx = await ostPrime.wrap({from: callerAddress, value: amount});
      let gasUsed = new BN(tx.receipt.gasUsed);

      let callerEIP20Tokenbalance = await ostPrime.balanceOf.call(callerAddress);
      assert.strictEqual(
        callerEIP20Tokenbalance.eq(amount),
        true,
        `The balance of ${callerAddress} should increase by ${amount}.`
      );

      let contractEIP20Tokenbalance = await ostPrime.balanceOf.call(ostPrime.address);
      assert.strictEqual(
        contractEIP20Tokenbalance.eq(new BN(0)),
        true,
        `The balance of OST prime contract should be zero.`
      );

      let finalContractBalance = new BN(
        await Utils.getBalance(ostPrime.address)
      );

      let finalCallerBalance = new BN(
        await Utils.getBalance(callerAddress)
      );

      assert.strictEqual(
        finalContractBalance.eq(initialContractBalance.add(amount)),
        true,
        `Contract base token balance should increase by ${amount}`
      );

      assert.strictEqual(
        finalCallerBalance.eq(initialCallerBalance.sub(amount).sub(gasUsed)),
        true,
        `Caller's base token balance should decrease by ${amount.sub(gasUsed)}`
      );

    });

    it('Should emit transfer event', async function () {
      await initialize();

      let tx = await ostPrime.wrap({from: callerAddress, value: amount});

      let event = EventDecoder.getEvents(tx, ostPrime);

      assert.strictEqual(
        event.Transfer !== undefined,
        true,
        "Event `Transfer` must be emitted.",
      );

      let eventData = event.Transfer;

      assert.strictEqual(
        eventData._from,
        ostPrime.address,
        `The _from address in the event should be equal to ${ostPrime.address}`
      );

      assert.strictEqual(
        eventData._to,
        callerAddress,
        `The _to address in the event should be equal to ${callerAddress}`
      );

      assert.strictEqual(
        amount.eq(eventData._value),
        true,
        `The _value in the event should be equal to ${amount}`
      );

    });

    it('Should emit token unwrapped event', async function () {
      await initialize();

      let tx = await ostPrime.wrap({from: callerAddress, value: amount});

      let event = EventDecoder.getEvents(tx, ostPrime);

      assert.strictEqual(
        event.TokenWrapped !== undefined,
        true,
        "Event `TokenWrapped` must be emitted.",
      );

      let eventData = event.TokenWrapped;

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

});