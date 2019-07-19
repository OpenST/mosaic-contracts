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

const OSTComposer = artifacts.require('OSTComposer');
const SpyToken = artifacts.require('SpyToken');
const Gateway = artifacts.require('SpyEIP20Gateway');
const BN = require('bn.js');
const Utils = require('../../test_lib/utils');
const ComposerUtils = require('./helpers/composer_utils');
const EventDecoder = require('../../test_lib/event_decoder.js');

contract('OSTComposer.requestStake() ', (accounts) => {
  let organization;
  let ostComposer;
  let gateway;
  const stakeRequest = {};

  beforeEach(async () => {
    organization = accounts[1];
    stakeRequest.staker = accounts[2];
    ostComposer = await OSTComposer.new(organization);
    stakeRequest.amount = new BN(20);
    stakeRequest.beneficiary = accounts[4];
    stakeRequest.gasPrice = new BN(100);
    stakeRequest.gasLimit = new BN(100);
    stakeRequest.nonce = new BN(42);
    gateway = await Gateway.new();
  });

  it('should be able to successfully request stake', async () => {
    const response = await ostComposer.requestStake(
      stakeRequest.amount,
      stakeRequest.beneficiary,
      stakeRequest.gasPrice,
      stakeRequest.gasLimit,
      stakeRequest.nonce,
      gateway.address,
      { from: stakeRequest.staker },
    );

    assert.strictEqual(response.receipt.status, true, 'Receipt status is unsuccessful');

    // Verifying the storage `stakeRequestHash` and `stakeRequests`.
    const stakeIntentTypeHash = ComposerUtils.getStakeRequestHash(
      stakeRequest,
      gateway.address,
      ostComposer.address,
    );

    const stakeRequestHashStorage = await ostComposer.stakeRequestHashes.call(
      stakeRequest.staker,
      gateway.address,
    );
    assert.strictEqual(
      stakeRequestHashStorage,
      stakeIntentTypeHash,
      `Stake requests of ${stakeRequest.staker} for ${gateway.address} is not cleared`,
    );

    const boolValue = await ostComposer.stakeRequests.call(stakeIntentTypeHash);

    assert.strictEqual(
      boolValue,
      true,
      'Invalid stake request.',
    );
  });

  it('should verify the returned stakeRequestHash', async () => {
    const response = await ostComposer.requestStake.call(
      stakeRequest.amount,
      stakeRequest.beneficiary,
      stakeRequest.gasPrice,
      stakeRequest.gasLimit,
      stakeRequest.nonce,
      gateway.address,
      { from: stakeRequest.staker },
    );

    const stakeIntentTypeHash = ComposerUtils.getStakeRequestHash(
      stakeRequest,
      gateway.address,
      ostComposer.address,
    );
    assert.strictEqual(
      response,
      stakeIntentTypeHash,
      'Invalid stake intent type hash',
    );
  });

  it('should verify the transfer of staked value token', async () => {
    const valueToken = await SpyToken.at(await gateway.token.call());
    await ostComposer.requestStake(
      stakeRequest.amount,
      stakeRequest.beneficiary,
      stakeRequest.gasPrice,
      stakeRequest.gasLimit,
      stakeRequest.nonce,
      gateway.address,
      { from: stakeRequest.staker },
    );

    assert.strictEqual(
      await valueToken.fromAddress.call(),
      stakeRequest.staker,
      'The spy did not record staker address correctly',
    );

    assert.strictEqual(
      await valueToken.toAddress.call(),
      ostComposer.address,
      'The spy did not record composer address correctly',
    );

    assert.strictEqual(
      stakeRequest.amount.eq(await valueToken.transferAmount.call()),
      true,
      `Expected amount to be returned to ${stakeRequest.staker} is ${stakeRequest.amount} `
      + `but got ${await valueToken.transferAmount.call()}`,
    );
  });

  it('should emit StakeRequested event', async () => {
    const tx = await ostComposer.requestStake(
      stakeRequest.amount,
      stakeRequest.beneficiary,
      stakeRequest.gasPrice,
      stakeRequest.gasLimit,
      stakeRequest.nonce,
      gateway.address,
      { from: stakeRequest.staker },
    );

    const events = EventDecoder.getEvents(tx, ostComposer);
    const eventData = events.StakeRequested;

    assert.strictEqual(
      eventData.staker,
      stakeRequest.staker,
      'Invalid staker address',
    );
    assert.strictEqual(
      eventData.amount.eq(stakeRequest.amount),
      true,
      `Expected staked amount is ${stakeRequest.amount} but got ${eventData.amount}`,
    );
    assert.strictEqual(
      eventData.gasLimit.eq(stakeRequest.gasLimit),
      true,
      `Expected gasLimit amount is ${stakeRequest.gasLimit} but got ${eventData.gasLimit}`,
    );
    assert.strictEqual(
      eventData.gasPrice.eq(stakeRequest.gasPrice),
      true,
      `Expected gasPrice amount is ${stakeRequest.gasPrice} but got ${eventData.gasPrice}`,
    );
    assert.strictEqual(
      eventData.gateway,
      gateway.address,
      'Invalid gateway address',
    );
    assert.strictEqual(
      eventData.beneficiary,
      stakeRequest.beneficiary,
      'Invalid beneficiary address',
    );
    assert.strictEqual(
      eventData.nonce.eq(stakeRequest.nonce),
      true,
      `Expected nonce amount is ${stakeRequest.nonce} but got ${eventData.nonce}`,
    );
  });

  it('should fail when staked amount is 0', async () => {
    const amount = 0;
    await Utils.expectRevert(
      ostComposer.requestStake(
        amount,
        stakeRequest.beneficiary,
        stakeRequest.gasPrice,
        stakeRequest.gasLimit,
        stakeRequest.nonce,
        gateway.address,
      ),
      { from: stakeRequest.staker },
      'Stake amount must not be zero.',
    );
  });

  it('should fail when beneficiary is null', async () => {
    await Utils.expectRevert(
      ostComposer.requestStake(
        stakeRequest.amount,
        Utils.NULL_ADDRESS,
        stakeRequest.gasPrice,
        stakeRequest.gasLimit,
        stakeRequest.nonce,
        gateway.address,
      ),
      { from: stakeRequest.staker },
      'Stake amount must not be zero.',
    );
  });

  it('should fail when staker nonce is incorrect', async () => {
    // Here, the correct nonce is 0.
    const nonce = stakeRequest.nonce.addn(1);
    await Utils.expectRevert(
      ostComposer.requestStake(
        stakeRequest.amount,
        stakeRequest.beneficiary,
        stakeRequest.gasPrice,
        stakeRequest.gasLimit,
        nonce,
        gateway.address,
      ),
      { from: stakeRequest.staker },
      'Incorrect staker nonce.',
    );
  });

  it('should fail when an request from staker is already pending at same gateway', async () => {
    await ostComposer.requestStake(
      stakeRequest.amount,
      stakeRequest.beneficiary,
      stakeRequest.gasPrice,
      stakeRequest.gasLimit,
      stakeRequest.nonce,
      gateway.address,
      { from: stakeRequest.staker },
    );

    await Utils.expectRevert(
      ostComposer.requestStake(
        stakeRequest.amount,
        stakeRequest.beneficiary,
        stakeRequest.gasPrice,
        stakeRequest.gasLimit,
        stakeRequest.nonce,
        gateway.address,
        { from: stakeRequest.staker },
      ),
      'Request for this staker at this gateway is already in process.',
    );
  });


  it('should fail when transferFrom of value token fails ', async () => {
    const valueToken = await SpyToken.at(await gateway.token.call());
    await valueToken.setTransferFromFakeResponse(false);

    await Utils.expectRevert(
      ostComposer.requestStake(
        stakeRequest.amount,
        stakeRequest.beneficiary,
        stakeRequest.gasPrice,
        stakeRequest.gasLimit,
        stakeRequest.nonce,
        gateway.address,
        { from: stakeRequest.staker },
      ),
      'Value token transfer returned false.',
    );
  });
});
