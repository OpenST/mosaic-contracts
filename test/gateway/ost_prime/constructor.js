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

const OSTPrime = artifacts.require("OSTPrime")
  , BN = require('bn.js');

const Utils = require('../../../test/test_lib/utils');

const NullAddress = "0x0000000000000000000000000000000000000000";
contract('OSTPrime.constructor()', function (accounts) {

  const TOKEN_SYMBOL = "ST";
  const TOKEN_NAME = "Simple Token";
  const TOKEN_DECIMALS = new BN(18);

  let brandedTokenAddress, ostPrime;

  beforeEach(async function () {
    brandedTokenAddress = accounts[2];
  });

  it('should pass with right set of parameters', async function () {

    ostPrime = await OSTPrime.new(brandedTokenAddress);

    let tokenAddress = await ostPrime.valueToken.call();
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

  });

  it('should fail if branded token address is zero', async function () {

    brandedTokenAddress = NullAddress;
    await Utils.expectRevert(
      OSTPrime.new(brandedTokenAddress),
      'ERC20 token should not be zero.',
    );

  });

});
