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

const BN = require('bn.js');
const Utils = require('../../gateway/eip20_cogateway/helpers/co_gateway_utils');

contract('GatewayLib.hashRedeemIntent()', async (accounts) => {
  it('should return correct redeem intent hash', async () => {
    const gatewayLib = await GatewayLib.deployed();
    const amount = new BN(1);
    const beneficiary = accounts[0];
    const gateway = accounts[1];

    const redeemIntentHash = await gatewayLib.hashRedeemIntent(
      amount,
      beneficiary,
      gateway,
    );

    const expectedRedeemIntentHash = Utils.hashRedeemIntent(
      amount,
      beneficiary,
      gateway,
    );

    assert.strictEqual(
      expectedRedeemIntentHash,
      redeemIntentHash,
      'The library did not hash the redeem intent as expected.',
    );
  });
});
