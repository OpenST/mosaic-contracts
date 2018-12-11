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

const UtilityToken = artifacts.require('UtilityToken');
const MockMembersManager = artifacts.require('MockMembersManager');

const Utils = require("./../../test_lib/utils");

const NullAddress = "0x0000000000000000000000000000000000000000";

const TOKEN_SYMBOL = "UT";
const TOKEN_NAME = "Utility Token";
const TOKEN_DECIMALS = 18;

contract('UtilityToken.constructor()', function (accounts) {

  let brandedToken, membersManager, owner, worker;

  beforeEach(async function () {
    owner = accounts[2];
    worker = accounts[3];
    brandedToken = accounts[4];
    membersManager = await MockMembersManager.new(owner, worker);
  });

  it('should fail to deploy when branded token address is zero', async function () {

    brandedToken = NullAddress;

    await Utils.expectRevert(
      UtilityToken.new(
        brandedToken,
        TOKEN_SYMBOL,
        TOKEN_NAME,
        TOKEN_DECIMALS,
        membersManager.address,
      ),
      'Token address should not be zero.',
    );

  });

  it('should fail to deploy when member manager address is zero', async function () {

    await Utils.expectRevert(
      UtilityToken.new(
        brandedToken,
        TOKEN_SYMBOL,
        TOKEN_NAME,
        TOKEN_DECIMALS,
        NullAddress,
      ),
      'MembersManager contract address must not be address\\(0\\).',
    );

  });

  it('should pass with correct parameters.', async function () {

    let utilityToken = await UtilityToken.new(
      brandedToken,
      TOKEN_SYMBOL,
      TOKEN_NAME,
      TOKEN_DECIMALS,
      membersManager.address,
    );

    assert.strictEqual(
      web3.utils.isAddress(utilityToken.address),
      true,
      'Utility token contract address must not be zero.',
    );

    let tokenAddress = await utilityToken.token.call();

    assert.strictEqual(
      tokenAddress,
      brandedToken,
      `Token address from contract must be equal to ${brandedToken}.`,
    );

    let name = await utilityToken.name();
    assert.strictEqual(
      name,
      TOKEN_NAME,
      `Token name from contract must be equal to ${TOKEN_NAME}.`,
    );

    let symbol = await utilityToken.symbol();
    assert.strictEqual(
      symbol,
      TOKEN_SYMBOL,
      `Token symbol from contract must be equal to ${TOKEN_SYMBOL}.`,
    );

    let decimals = await utilityToken.decimals();
    assert.strictEqual(
      decimals.eqn(TOKEN_DECIMALS),
      true,
      `Token decimals from contract must be equal to ${TOKEN_DECIMALS}.`,
    );

    let totalSupply = await utilityToken.totalSupply();
    assert.strictEqual(
      totalSupply.eqn(0),
      true,
      `Token total supply from contract must be equal to zero.`,
    );

    let membersManagerAddress = await utilityToken.membersManager();
    assert.strictEqual(
      membersManagerAddress,
      membersManager.address,
      `Members manager address from the contract must be equal to ${membersManager.address}.`,
    );

  });

});
