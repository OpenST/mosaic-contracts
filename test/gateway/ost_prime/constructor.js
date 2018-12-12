const OSTPrime = artifacts.require("OSTPrime")
  , BN = require('bn.js');

const MockMembersManager = artifacts.require('MockMembersManager');

const Utils = require('../../../test/test_lib/utils');

const NullAddress = "0x0000000000000000000000000000000000000000";
contract('OSTPrime.constructor()', function (accounts) {

  const TOKEN_SYMBOL = "ST";
  const TOKEN_NAME = "Simple Token";
  const TOKEN_DECIMALS = new BN(18);

  let brandedTokenAddress, ostPrime, membersManager, owner, worker;

  beforeEach(async function () {
    brandedTokenAddress = accounts[2];
    owner = accounts[3];
    worker = accounts[4];
    membersManager = await MockMembersManager.new(owner, worker);

  });

  it('should pass with right set of parameters', async function () {

    ostPrime = await OSTPrime.new(brandedTokenAddress, membersManager.address);

    let tokenAddress = await ostPrime.token.call();
    assert.strictEqual(
      tokenAddress,
      brandedTokenAddress,
      `Branded token address from contract must be ${brandedTokenAddress}.`,
    );

    let name = await ostPrime.name.call();
    assert.strictEqual(
      name,
      TOKEN_NAME,
      `Token name from contract must be ${TOKEN_NAME}.`,
    );

    let symbol = await ostPrime.symbol.call();
    assert.strictEqual(
      symbol,
      TOKEN_SYMBOL,
      `Token symbol from contract must be ${TOKEN_SYMBOL}.`,
    );

    let decimals = await ostPrime.decimals.call();
    assert.strictEqual(
      TOKEN_DECIMALS.eq(decimals),
      true,
      `Token decimals from contract must be ${TOKEN_DECIMALS}.`,
    );

    let initialized = await ostPrime.initialized.call();
    assert.strictEqual(
      initialized,
      false,
      `Contract should not be initialized.`,
    );

    let membersManagerAddress = await ostPrime.membersManager();
    assert.strictEqual(
      membersManagerAddress,
      membersManager.address,
      `Members manager address from the contract must be equal to ${membersManager.address}.`,
    );

  });

  it('should fail if branded token address is zero', async function () {

    brandedTokenAddress = NullAddress;
    await Utils.expectRevert(
      OSTPrime.new(brandedTokenAddress, membersManager.address),
      'Token address should not be zero.',
    );

  });

  it('should fail if member manager address is zero', async function () {

    membersManager = NullAddress;
    await Utils.expectRevert(
      OSTPrime.new(brandedTokenAddress, membersManager),
      'MembersManager contract address must not be address\\(0\\).',
    );

  });

});
