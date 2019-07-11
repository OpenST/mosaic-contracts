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
const StakerProxy = artifacts.require('MockStakerProxy');
const Utils = require('../../test_lib/utils');

contract('OSTComposer.destructStakerProxy() ', (accounts) => {
  let organization;
  let ostComposer;
  const stakeRequest = {};
  let stakerProxy;
  let owner;
  let worker;
  beforeEach(async () => {
    owner = accounts[6];
    worker = accounts[7];
    organization = await MockOrganization.new(owner, worker);
    stakeRequest.staker = accounts[2];
    ostComposer = await OSTComposer.new(organization.address);
    stakerProxy = await StakerProxy.new();
    await ostComposer.setStakerProxy(stakeRequest.staker, stakerProxy.address);
  });

  it('should be able to successfully remove staker proxy', async () => {
    const response = await ostComposer.destructStakerProxy(
      { from: stakeRequest.staker },
    );

    assert.strictEqual(response.receipt.status, true, 'Receipt status is unsuccessful');

    const stakerProxyAddress = await ostComposer.stakerProxies.call(stakeRequest.staker);
    assert.strictEqual(
      stakerProxyAddress,
      Utils.NULL_ADDRESS,
      'Staker\'s proxy address must be reset to null',
    );

    const isSelfDestructed = await stakerProxy.selfDestruted.call();
    assert.strictEqual(
      isSelfDestructed,
      true,
      'Staker proxy self destruct must be called',
    );
  });

  it('should fail when owner doesn\'t have any deployed staker proxy', async () => {
    const nonProxy = accounts[8];
    await Utils.expectRevert(
      ostComposer.destructStakerProxy(
        { from: nonProxy },
      ),
      'Staker proxy does not exist for the caller.',
    );
  });
});
