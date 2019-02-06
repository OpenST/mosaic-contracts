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

const UtilityToken = artifacts.require('UtilityToken');
const MockOrganization = artifacts.require('MockOrganization');

const Utils = require('./../../test_lib/utils');

const NullAddress = Utils.NULL_ADDRESS;

const TOKEN_SYMBOL = 'UT';
const TOKEN_NAME = 'Utility Token';
const TOKEN_DECIMALS = 18;

contract('UtilityToken.constructor()', (accounts) => {
  let brandedToken;
  let organization;
  let owner;
  let worker;

  beforeEach(async () => {
    owner = accounts[2];
    worker = accounts[3];
    brandedToken = accounts[4];
    organization = await MockOrganization.new(owner, worker);
  });

  it('should fail to deploy when branded token address is zero', async () => {
    brandedToken = NullAddress;

    await Utils.expectRevert(
      UtilityToken.new(
        brandedToken,
        TOKEN_SYMBOL,
        TOKEN_NAME,
        TOKEN_DECIMALS,
        organization.address,
      ),
      'Token address should not be zero.',
    );
  });

  it('should fail to deploy when organization address is zero', async () => {
    await Utils.expectRevert(
      UtilityToken.new(
        brandedToken,
        TOKEN_SYMBOL,
        TOKEN_NAME,
        TOKEN_DECIMALS,
        NullAddress,
      ),
      'Organization contract address must not be zero.',
    );
  });

  it('should pass with correct parameters.', async () => {
    const utilityToken = await UtilityToken.new(
      brandedToken,
      TOKEN_SYMBOL,
      TOKEN_NAME,
      TOKEN_DECIMALS,
      organization.address,
    );

    assert.strictEqual(
      web3.utils.isAddress(utilityToken.address),
      true,
      'Utility token contract address must not be zero.',
    );

    const tokenAddress = await utilityToken.token.call();

    assert.strictEqual(
      tokenAddress,
      brandedToken,
      `Token address from contract must be equal to ${brandedToken}.`,
    );

    const name = await utilityToken.name();
    assert.strictEqual(
      name,
      TOKEN_NAME,
      `Token name from contract must be equal to ${TOKEN_NAME}.`,
    );

    const symbol = await utilityToken.symbol();
    assert.strictEqual(
      symbol,
      TOKEN_SYMBOL,
      `Token symbol from contract must be equal to ${TOKEN_SYMBOL}.`,
    );

    const decimals = await utilityToken.decimals();
    assert.strictEqual(
      decimals.eqn(TOKEN_DECIMALS),
      true,
      `Token decimals from contract must be equal to ${TOKEN_DECIMALS}.`,
    );

    const totalSupply = await utilityToken.totalSupply();
    assert.strictEqual(
      totalSupply.eqn(0),
      true,
      'Token total supply from contract must be equal to zero.',
    );

    const organizationAddress = await utilityToken.organization();
    assert.strictEqual(
      organizationAddress,
      organization.address,
      `Organization address from the contract must be equal to ${
        organization.address
      }.`,
    );
  });
});
