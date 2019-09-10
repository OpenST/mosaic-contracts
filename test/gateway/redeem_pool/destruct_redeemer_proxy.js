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

const RedeemPool = artifacts.require('RedeemPool');
const EIP20CoGateway = artifacts.require('SpyEIP20CoGateway');
const MockOrganization = artifacts.require('MockOrganization');
const BN = require('bn.js');
const Utils = require('../../test_lib/utils');
const web3 = require('../../test_lib/web3');
contract('RedeemPool.destructRedeemerProxy()', (accounts) => {
  let eip20CoGateway;
  let redeemPool;
  let worker;
  let redeemRequest;
  beforeEach(async () => {
    worker = accounts[2];
    eip20CoGateway = await EIP20CoGateway.new();
    const organization = await MockOrganization.new(accounts[1], accounts[2]);
    redeemPool = await RedeemPool.new(organization.address);

    redeemRequest = {
      amount: new BN('100'),
      beneficiary: accounts[3],
      gasPrice: new BN('1'),
      gasLimit: new BN('2'),
      nonce: new BN('1'),
      cogateway: eip20CoGateway.address,
      redeemer: accounts[4],
    };

    await redeemPool.requestRedeem(
      redeemRequest.amount,
      redeemRequest.beneficiary,
      redeemRequest.gasPrice,
      redeemRequest.gasLimit,
      redeemRequest.nonce,
      redeemRequest.cogateway,
      { from: redeemRequest.redeemer },
    );
  });

  it('should be able to successfully destruct redeemer proxy', async () => {
    const response = await redeemPool.destructRedeemerProxy(
      { from: redeemRequest.redeemer },
    );

    assert.strictEqual(response.receipt.status, true, 'Receipt status is unsuccessful');

    const redeemerProxyAddress = await redeemPool.redeemerProxies.call(redeemRequest.redeemer);
    assert.strictEqual(
      redeemerProxyAddress,
      Utils.NULL_ADDRESS,
      'Redeemer proxy contract shouldnot exists for redeemer',
    );

    const code = await web3.eth.getCode(redeemerProxyAddress);
    assert.strictEqual(
      code,
      '0x',
      'Redeemer proxy contract should be self distructed',
    );
  });

  it('should fail when owner doesn\'t have any deployed staker proxy', async () => {
    const nonProxy = accounts[8];
    await Utils.expectRevert(
      redeemPool.destructRedeemerProxy(
        { from: nonProxy },
      ),
      'Redeemer proxy does not exist for the caller.',
    );
  });
});
