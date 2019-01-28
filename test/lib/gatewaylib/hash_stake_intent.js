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

const GatewayLib = artifacts.require('GatewayLib');

const Utils = require('../../gateway/eip20_cogateway/helpers/co_gateway_utils');
const BN = require('bn.js');

contract('GatewayLib.hashStakeIntent()', async (accounts) => {

  it('should return correct stake intent hash', async function () {

    let gatewayLib = await GatewayLib.deployed();
    let amount = new BN(1);
    let beneficiary = accounts[0];
    let gateway = accounts[1];

    let stakeIntentHash = await gatewayLib.hashStakeIntent(
      amount,
      beneficiary,
      gateway,
    );

    let expectedStakeIntentHash = Utils.hashStakeIntent(
      amount,
      beneficiary,
      gateway,
    );

    assert.strictEqual(
      expectedStakeIntentHash,
      stakeIntentHash,
      "The library did not hash the stake intent as expected.",
    );

  });

});
