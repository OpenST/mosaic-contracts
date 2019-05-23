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

const OSTComposer = artifacts.require('TestOSTComposer');
const MockOrganization = artifacts.require('MockOrganization');
const Gateway = artifacts.require('SpyEIP20Gateway');
const StakerProxy = artifacts.require('StakerProxy');
const BN = require('bn.js');
const Utils = require('../test_lib/utils');

contract('OSTComposer.rejectStakeRequest() ', (accounts) => {
  let organization;
  let ostComposer;
  const stakeRequest = {};
  let stakerProxy;
  let expectedActiveGatewayCount;
  let owner;
  let worker;
  beforeEach(async () => {
    owner = accounts[6];
    worker = accounts[7];
    organization = await MockOrganization.new(owner, worker);
    stakeRequest.staker = accounts[2];
    ostComposer = await OSTComposer.new(organization.address);
    expectedActiveGatewayCount = new BN(0);
    stakerProxy = accounts[10];
    await ostComposer.setStakerProxy(stakeRequest.staker, stakerProxy);
    await ostComposer.setActiveStakeRequestCount(stakeRequest.staker, expectedActiveGatewayCount);
  });

  it('should be able to successfully remove staker proxy', async () => {
    const response = await ostComposer.removeStakerProxy(
      stakeRequest.staker,
      { from: stakerProxy },
    );

    assert.strictEqual(response.receipt.status, true, 'Receipt status is unsuccessful');

    const activeGatewayRequestCount = await ostComposer.activeStakeRequestCount(
      stakeRequest.staker,
    );

    assert.strictEqual(
      activeGatewayRequestCount.eq(expectedActiveGatewayCount),
      true,
      `Expected active gateway request for ${stakeRequest.staker} is ${expectedActiveGatewayCount}`
      + `but got ${activeGatewayRequestCount}`,
    );

    const stakerProxyAddress = await ostComposer.stakerProxies.call(stakeRequest.staker);
    assert.strictEqual(
      stakerProxyAddress,
      Utils.NULL_ADDRESS,
      'Staker\'s proxy address must be reset to null',
    );
  });

  it('should fail when non proxy address request removal of staker proxy', async () => {
    const nonProxy = accounts[8];
    await Utils.expectRevert(
      ostComposer.removeStakerProxy(
        stakeRequest.staker,
        { from: nonProxy },
      ),
      'Caller is invalid proxy address.',
    );
  });

  it('should fail when previous stake request is active for a staker at the gateway', async () => {
    // It would fail for any value greater than 0.
    await ostComposer.setActiveStakeRequestCount(stakeRequest.staker, 1);

    await Utils.expectRevert(
      ostComposer.removeStakerProxy(
        stakeRequest.staker,
        { from: stakerProxy },
      ),
      'Stake request is active on gateways.',
    );
  });
});
