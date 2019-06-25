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
const SpyToken = artifacts.require('SpyToken');
const MockOrganization = artifacts.require('MockOrganization');
const Gateway = artifacts.require('SpyEIP20Gateway');
const StakerProxy = artifacts.require('StakerProxy');
const BN = require('bn.js');
const Utils = require('../../test_lib/utils');
const EventDecoder = require('../../test_lib/event_decoder.js');
const ComposerUtils = require('./helpers/composer_utils');

contract('OSTComposer.rejectStakeRequest() ', (accounts) => {
  let organization;
  let ostComposer;
  let gateway;
  const stakeRequest = {};
  let stakeHash;
  let stakerProxy;
  let gatewayCount;
  let owner;
  let worker;
  beforeEach(async () => {
    owner = accounts[6];
    worker = accounts[7];
    organization = await MockOrganization.new(owner, worker);
    stakeRequest.staker = accounts[2];
    ostComposer = await OSTComposer.new(organization.address);
    stakeRequest.amount = new BN(20);
    stakeRequest.beneficiary = accounts[4];
    stakeRequest.gasPrice = new BN(100);
    stakeRequest.gasLimit = new BN(100);
    stakeRequest.nonce = new BN(0);
    gateway = await Gateway.new();
    stakeHash = ComposerUtils.getStakeRequestHash(
      stakeRequest,
      gateway.address,
      ostComposer.address,
    );
    await ostComposer.setStakeRequestHash(stakeHash, stakeRequest.staker, gateway.address);
    await ostComposer.setStakeRequests(
      stakeHash,
      true,
    );
    gatewayCount = new BN(2);
    stakerProxy = await StakerProxy.new(stakeRequest.staker);
    await ostComposer.setStakerProxy(stakeRequest.staker, stakerProxy.address);
  });

  it('should be able to successfully reject stake', async () => {
    const response = await ostComposer.rejectStakeRequest(
      stakeRequest.amount,
      stakeRequest.beneficiary,
      stakeRequest.gasPrice,
      stakeRequest.gasLimit,
      stakeRequest.nonce,
      stakeRequest.staker,
      gateway.address,
      { from: worker },
    );
    assert.strictEqual(response.receipt.status, true, 'Receipt status is unsuccessful');

    // Verifying the storage stakeRequestHash and stakeRequests. After the rejectStakeRequest
    // is successful, these two storage references are cleared.
    const stakeRequestHashStorage = await ostComposer.stakeRequestHashes.call(
      stakeRequest.staker,
      gateway.address,
    );

    assert.strictEqual(
      stakeRequestHashStorage,
      Utils.ZERO_BYTES32,
      `Stake requests of ${stakeRequest.staker} for ${gateway.address} is not cleared`,
    );

    const boolValue = await ostComposer.stakeRequests.call(stakeHash);
    assert.strictEqual(
      boolValue,
      false,
      `Expected value is false but got ${boolValue}`,
    );
  });

  it('should emit StakeRejected event', async () => {
    const tx = await ostComposer.rejectStakeRequest(
      stakeRequest.amount,
      stakeRequest.beneficiary,
      stakeRequest.gasPrice,
      stakeRequest.gasLimit,
      stakeRequest.nonce,
      stakeRequest.staker,
      gateway.address,
      { from: worker },
    );

    const events = EventDecoder.getEvents(tx, ostComposer);
    const eventData = events.StakeRejected;

    assert.strictEqual(
      eventData.stakeRequestHash,
      stakeHash,
      'Incorrect stake request hash',
    );
    assert.strictEqual(
      eventData.staker,
      stakeRequest.staker,
      'Incorrect staker address',
    );
  });

  it('should be able to transfer the value tokens to staker', async () => {
    const valueToken = await SpyToken.at(await gateway.valueToken.call());

    await ostComposer.rejectStakeRequest(
      stakeRequest.amount,
      stakeRequest.beneficiary,
      stakeRequest.gasPrice,
      stakeRequest.gasLimit,
      stakeRequest.nonce,
      stakeRequest.staker,
      gateway.address,
      { from: worker },
    );

    assert.strictEqual(
      await valueToken.toAddress.call(),
      stakeRequest.staker,
      'The spy did not record staker address correctly',
    );
    assert.strictEqual(
      stakeRequest.amount.eq(await valueToken.transferAmount.call()),
      true,
      `Expected amount to be returned to ${stakeRequest.staker} is ${stakeRequest.amount} `
      + `but got ${await valueToken.transferAmount.call()}`,
    );
  });

  it('should fail when non-worker address requests rejection of stake request', async () => {
    const nonWorker = accounts[10];
    await Utils.expectRevert(
      ostComposer.rejectStakeRequest(
        stakeRequest.amount,
        stakeRequest.beneficiary,
        stakeRequest.gasPrice,
        stakeRequest.gasLimit,
        stakeRequest.nonce,
        stakeRequest.staker,
        gateway.address,
        { from: nonWorker },
      ),
      'Only whitelisted workers are allowed to call this method.',
    );
  });

  it('should fail when there is mismatch while constructing stake request hash ', async () => {
    await Utils.expectRevert(
      ostComposer.rejectStakeRequest(
        stakeRequest.amount,
        stakeRequest.beneficiary,
        stakeRequest.gasPrice,
        stakeRequest.gasLimit,
        stakeRequest.nonce,
        accounts[3],
        gateway.address,
        { from: worker },
      ),
      'Invalid stake request hash.',
    );
  });

  it('should fail when transfer of value tokens to staker fails', async () => {
    const spyValueToken = await SpyToken.at(await gateway.valueToken.call());
    await spyValueToken.setTransferFakeResponse(false);

    await Utils.expectRevert(
      ostComposer.rejectStakeRequest(
        stakeRequest.amount,
        stakeRequest.beneficiary,
        stakeRequest.gasPrice,
        stakeRequest.gasLimit,
        stakeRequest.nonce,
        stakeRequest.staker,
        gateway.address,
        { from: worker },
      ),
      'Staked amount must be transferred to staker.',
    );
  });
});
