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

const UtilityToken = artifacts.require('TestUtilityToken');
const MockOrganization = artifacts.require('MockOrganization');

const Utils = require('./../../test_lib/utils');

const NullAddress = Utils.NULL_ADDRESS;

const TOKEN_SYMBOL = 'UT';
const TOKEN_NAME = 'Utility Token';
const TOKEN_DECIMALS = 18;

contract('UtilityToken.exists()', (accounts) => {

  let utilityToken;

  beforeEach(async () => {
    let brandedToken = accounts[4];
    let organization = await MockOrganization.new(accounts[2], accounts[3]);
    utilityToken = await UtilityToken.new(
      brandedToken,
      TOKEN_SYMBOL,
      TOKEN_NAME,
      TOKEN_DECIMALS,
      organization.address,
    )

  });

  it('should always return true for any given address', async () => {
    const account5ExistsResult = await utilityToken.exists.call(accounts[5]);
    assert.strictEqual(
      account5ExistsResult,
      true,
      'Contract should return true.',
    );

    const account6ExistsResult = await utilityToken.exists.call(accounts[6]);
    assert.strictEqual(
      account6ExistsResult,
      true,
      'Contract should return true.',
    );

  });

});
