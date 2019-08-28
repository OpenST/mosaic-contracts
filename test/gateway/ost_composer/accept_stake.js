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
const Gateway = artifacts.require('SpyEIP20Gateway');
const MockOrganization = artifacts.require('MockOrganization');

const BN = require('bn.js');
const Utils = require('../../test_lib/utils');
const ComposerUtils = require('./helpers/composer_utils');

contract('OSTComposer.acceptStakeRequest() ', (accounts) => {
  let organization;
  let ostComposer;
  let gateway;
  const stakeRequest = {};
  let stakeHash;
  let hashLock;
  let worker;
  let stakerProxy;

  beforeEach(async () => {
    const owner = accounts[6];
    worker = accounts[7];
    organization = await MockOrganization.new(owner, worker);
    stakeRequest.staker = accounts[2];
    ostComposer = await OSTComposer.new(organization.address);
    stakeRequest.amount = new BN(20);
    stakeRequest.beneficiary = accounts[4];
    stakeRequest.gasPrice = new BN(100);
    stakeRequest.gasLimit = new BN(100);
    stakeRequest.nonce = new BN(42);
    gateway = await Gateway.new();
    stakeHash = ComposerUtils.getStakeRequestHash(
      stakeRequest,
      gateway.address,
      ostComposer.address,
    );
    hashLock = Utils.generateHashLock().l;
    await ostComposer.setStakeRequestHash(stakeHash, stakeRequest.staker, gateway.address);
    await ostComposer.setStakeRequests(
      stakeHash,
      true,
    );
    stakerProxy = await ostComposer.generateStakerProxy.call(stakeRequest.staker);
    await ostComposer.generateStakerProxy(stakeRequest.staker);
  });

  it('should be able to successfully accept stake', async () => {
    const response = await ostComposer.acceptStakeRequest(
      stakeRequest.amount,
      stakeRequest.beneficiary,
      stakeRequest.gasPrice,
      stakeRequest.gasLimit,
      stakeRequest.nonce,
      stakeRequest.staker,
      gateway.address,
      hashLock,
      { from: worker },
    );
    assert.strictEqual(response.receipt.status, true, 'Receipt status is unsuccessful');

    // Verifying the storage stakeRequestHash and stakeRequests references.
    // After the acceptStakeRequest is successful, these two storage references are deleted.
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

    // Verifying the stake method of SpyEIP20Gateway is called.

    assert.strictEqual(
      stakeRequest.amount.eq(await gateway.amount.call()),
      true,
      'The spy did not record the amount correctly',
    );

    assert.strictEqual(
      stakeRequest.beneficiary,
      await gateway.beneficiary(),
      'The spy did not record the beneficiary correctly',
    );

    assert.strictEqual(
      stakeRequest.gasPrice.eq(await gateway.gasPrice()),
      true,
      'The spy did not record the gasPrice correctly',
    );

    assert.strictEqual(
      stakeRequest.gasLimit.eq(await gateway.gasLimit()),
      true,
      'The spy did not record the gasLimit correctly',
    );

    assert.strictEqual(
      stakeRequest.nonce.eq(await gateway.nonce()),
      true,
      'The spy did not record the nonce correctly',
    );
  });

  it('should be able to transfer the value tokens to staker\'s staker '
    + 'proxy contract address', async () => {
    const valueToken = await SpyToken.at(await gateway.token.call());
    await ostComposer.acceptStakeRequest(
      stakeRequest.amount,
      stakeRequest.beneficiary,
      stakeRequest.gasPrice,
      stakeRequest.gasLimit,
      stakeRequest.nonce,
      stakeRequest.staker,
      gateway.address,
      hashLock,
      { from: worker },
    );

    assert.strictEqual(
      await valueToken.toAddress.call(),
      stakerProxy,
      'The spy did not record staker address correctly',
    );
    assert.strictEqual(
      stakeRequest.amount.eq(await valueToken.transferAmount.call()),
      true,
      `Expected amount to be returned to ${stakeRequest.staker} is ${stakeRequest.amount} `
      + `but got ${await valueToken.transferAmount.call()}`,
    );
  });

  it('should be able to transfer the base tokens to staker\'s staker '
    + 'proxy contract address', async () => {
    const baseToken = await SpyToken.at(await gateway.baseToken.call());

    await ostComposer.acceptStakeRequest(
      stakeRequest.amount,
      stakeRequest.beneficiary,
      stakeRequest.gasPrice,
      stakeRequest.gasLimit,
      stakeRequest.nonce,
      stakeRequest.staker,
      gateway.address,
      hashLock,
      { from: worker },
    );

    assert.strictEqual(
      await baseToken.fromAddress.call(),
      worker,
      'The spy did not record facilitator address correctly',
    );
    assert.strictEqual(
      await baseToken.toAddress.call(),
      stakerProxy,
      'The spy did not record staker address correctly',
    );

    const bounty = await gateway.bounty.call();

    assert.strictEqual(
      bounty.eq(await baseToken.transferAmount.call()),
      true,
      `Expected amount to be returned to ${stakeRequest.staker} is ${bounty} `
      + `but got ${await baseToken.transferAmount.call()}`,
    );
  });

  it('should fail if a staker proxy associated with the stake request does not exist', async () => {
    await ostComposer.destroyStakerProxy(stakeRequest.staker);
    await Utils.expectRevert(
      ostComposer.acceptStakeRequest(
        stakeRequest.amount,
        stakeRequest.beneficiary,
        stakeRequest.gasPrice,
        stakeRequest.gasLimit,
        stakeRequest.nonce,
        stakeRequest.staker,
        gateway.address,
        hashLock,
        { from: worker },
      ),
      'StakerProxy address is null.',
    );
  });

  it('should fail when value tokens transfer to staker proxy fails', async () => {
    const spyValueToken = await SpyToken.at(await gateway.token.call());
    await spyValueToken.setTransferFakeResponse(false);

    await Utils.expectRevert(
      ostComposer.acceptStakeRequest(
        stakeRequest.amount,
        stakeRequest.beneficiary,
        stakeRequest.gasPrice,
        stakeRequest.gasLimit,
        stakeRequest.nonce,
        stakeRequest.staker,
        gateway.address,
        hashLock,
        { from: worker },
      ),
      'Staked amount must be transferred to the staker proxy.',
    );
  });

  it('should fail when bounty transfer to staker proxy fails', async () => {
    const spyBaseToken = await SpyToken.at(await gateway.baseToken.call());
    await spyBaseToken.setTransferFromFakeResponse(false);
    await Utils.expectRevert(
      ostComposer.acceptStakeRequest(
        stakeRequest.amount,
        stakeRequest.beneficiary,
        stakeRequest.gasPrice,
        stakeRequest.gasLimit,
        stakeRequest.nonce,
        stakeRequest.staker,
        gateway.address,
        hashLock,
        { from: worker },
      ),
      'Bounty amount must be transferred to stakerProxy.',
    );
  });
});
