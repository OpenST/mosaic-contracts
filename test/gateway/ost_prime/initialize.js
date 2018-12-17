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

contract('OSTPrime.initialize()', function (accounts) {

  const DECIMAL = new BN(10);
  const POW = new BN(18);
  const DECIMAL_FACTOR = DECIMAL.pow(POW);
  const TOKENS_MAX = new BN(800000000).mul(DECIMAL_FACTOR);

  let brandedTokenAddress, ostPrime, organization;

  beforeEach(async function () {
    brandedTokenAddress = accounts[2];
    organization = accounts[0];
    ostPrime = await OSTPrime.new(brandedTokenAddress, organization);
  });

  it('The balance of OST prime contract must be zero', async function () {

    let balance = await Utils.getBalance(ostPrime.address);
    assert.strictEqual(
      balance,
      '0',
      `The balance of contract must be zero.`,
    );

  });

  it('should fail if initialize is called with payable amount not equal ' +
    'to TOKENS_MAX ost prime base token', async function () {

    let tokenAmount = new BN(1);

    let result = ostPrime.initialize.call(
      {from: accounts[2], value: tokenAmount}
    );

    await Utils.expectRevert(
      result,
      'Payable amount must be equal to total supply of token.',
    );

  });

  it('should pass if initialize is called with value equal to ' +
    'TOKENS_MAX ost prime base token', async function () {

    let result = await ostPrime.initialize.call(
      {from: accounts[2], value: TOKENS_MAX}
    );

    assert.strictEqual(
      result,
      true,
      `The result should be true.`,
    );

    await ostPrime.initialize(
      {from: accounts[2], value: TOKENS_MAX}
    );

    let balance = new BN(await Utils.getBalance(ostPrime.address));
    assert.strictEqual(
      TOKENS_MAX.eq(balance),
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
      {from: accounts[2], value: TOKENS_MAX}
    );

    await Utils.expectRevert(
      ostPrime.initialize(
        {from: accounts[3], value: TOKENS_MAX}
      ),
      'Contract is already initialized.',
    );

  });

});
