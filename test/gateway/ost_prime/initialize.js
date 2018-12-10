const OSTPrime = artifacts.require("OSTPrime")
  , BN = require('bn.js');

const Utils = require('../../../test/test_lib/utils');

contract('OSTPrime.initialize()', function (accounts) {

  const DECIMAL = new BN(10);
  const POW = new BN(18);
  const DECIMAL_FACTOR = DECIMAL.pow(POW);
  const TOKENS_MAX = new BN(800000000).mul(DECIMAL_FACTOR);

  let brandedTokenAddress, ostPrime;

  beforeEach(async function () {
    brandedTokenAddress = accounts[2];
    ostPrime = await OSTPrime.new(brandedTokenAddress);
  });

  it('The balance of OST prime contract must be zero', async function () {

    let balance = await Utils.getBalance(ostPrime.address);
    assert.strictEqual(
      new BN(0).eq(new BN(balance)),
      true,
      `The balance of contract must be zero.`,
    );

  });

  it('should fail if the initialize is called with payable amount not equal ' +
    'to 800M ost prime base token', async function () {

    let tokenAmount = new BN(1);

    let result = ostPrime.initialize.call(
      {from: accounts[2], value:tokenAmount}
    );

    await Utils.expectRevert(
      result,
      "Payable amount must be equal to total supply of token.",
    );

  });

  it('should pass if the initialize is called with value equal than 800M ' +
    'ost prime base token', async function () {

    let result = await ostPrime.initialize.call(
      {from: accounts[2], value:TOKENS_MAX}
    );

    assert.strictEqual(
      result,
      true,
      `The result should be true.`,
    );

    await ostPrime.initialize(
      {from: accounts[2], value:TOKENS_MAX}
    );

    let balance = await Utils.getBalance(ostPrime.address);
    assert.strictEqual(
      TOKENS_MAX.eq(new BN(balance)),
      true,
      `The balance of contract must be ${TOKENS_MAX}.`,
    );

    let initialized = await ostPrime.initialized.call();
    assert.strictEqual(
      initialized,
      true,
      `Contract should be initialized.`,
    );

  });

  it('should fail if already initialized', async function () {

    await ostPrime.initialize(
      {from: accounts[2], value:TOKENS_MAX}
    );

    await Utils.expectRevert(
      ostPrime.initialize.call(
        {from: accounts[3], value:TOKENS_MAX}
      ),
      "Contract is already initialized.",
    );

  });

});
