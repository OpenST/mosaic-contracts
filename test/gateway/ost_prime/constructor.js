const OSTPrime = artifacts.require("OSTPrime")
  , BN = require('bn.js')
  , web3 = require('../../test_lib/web3.js');

const Utils = require('../../../test/test_lib/utils');

const NullAddress = "0x0000000000000000000000000000000000000000";
contract('OSTPrime.sol', function (accounts) {

  describe('Construction', async () => {

    const TOKEN_SYMBOL = "ST";
    const TOKEN_NAME = "Simple Token";
    const TOKEN_DECIMALS = new BN(18);

    let brandedTokenAddress, ostPrime;

    beforeEach(async function () {
      brandedTokenAddress = accounts[2];
    });

    it('should pass with right set of parameters', async function () {

      ostPrime = await OSTPrime.new(brandedTokenAddress);

      assert.strictEqual(
        web3.utils.isAddress(ostPrime.address),
        true,
        "OSTPrime contract address must not be zero"
      );

      let tokenAddress = await ostPrime.valueToken.call();
      assert.strictEqual(
        tokenAddress,
        brandedTokenAddress,
        `Branded token address from contract must be ${brandedTokenAddress}`
      );

      let name = await ostPrime.name.call();
      assert.strictEqual(
        name,
        TOKEN_NAME,
        `Token name from contract must be ${TOKEN_NAME}`
      );

      let symbol = await ostPrime.symbol.call();
      assert.strictEqual(
        symbol,
        TOKEN_SYMBOL,
        `Token symbol from contract must be ${TOKEN_SYMBOL}`
      );

      let decimals = await ostPrime.decimals.call();
      assert.strictEqual(
        TOKEN_DECIMALS.eq(decimals),
        true,
        `Token decimals from contract must be ${TOKEN_DECIMALS}`
      );

      let initialized = await ostPrime.initialized.call();
      assert.strictEqual(
        initialized,
        false,
        `Contract should not be initialized`
      );

    });

    it('should fail if branded token address is not zero', async function () {

      brandedTokenAddress = NullAddress;
      await Utils.expectRevert(
        OSTPrime.new(brandedTokenAddress),
        "ERC20 token should not be zero."
      );

    });

  });

});
