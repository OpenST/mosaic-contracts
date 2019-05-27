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
const Utils = require('../test_lib/utils');
const EventDecoder = require('../test_lib/event_decoder.js');

function getStakeRequestHash(stakeRequest, gateway) {
  const stakeRequestMethod = 'StakeRequest(address gateway,uint256 amount,address staker,address beneficiary,uint256 gasPrice,uint256 gasLimit, uint256 nonce)';
  const encodedTypeHash = web3.utils.sha3(web3.eth.abi.encodeParameter('string', stakeRequestMethod));

  const stakeIntentTypeHash = web3.utils.soliditySha3(
    { type: 'bytes32', value: encodedTypeHash },
    { type: 'address', value: gateway.address },
    { type: 'uint256', value: stakeRequest.amount },
    { type: 'address', value: stakeRequest.staker },
    { type: 'address', value: stakeRequest.beneficiary },
    { type: 'uint256', value: stakeRequest.gasPrice },
    { type: 'uint256', value: stakeRequest.gasLimit },
    { type: 'uint256', value: stakeRequest.nonce },
  );

  return stakeIntentTypeHash;
}

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
    const beforeRSActiveGatewayRequestCount = await ostComposer.activeStakeRequestCount(
      stakeRequest.staker,
    );

    const response = await ostComposer.requestStake(
      gateway.address,
      stakeRequest.amount,
      stakeRequest.beneficiary,
      stakeRequest.gasPrice,
      stakeRequest.gasLimit,
      stakeRequest.nonce,
      { from: stakeRequest.staker },
    );

    assert.strictEqual(response.receipt.status, true, 'Receipt status is unsuccessful');

    const afterRSActiveGatewayRequestCount = await ostComposer.activeStakeRequestCount(
      stakeRequest.staker,
    );

    assert.strictEqual(
      (afterRSActiveGatewayRequestCount.sub(beforeRSActiveGatewayRequestCount)).eqn(1),
      true,
      `Expected active gateway request for ${stakeRequest.staker} is `
      + `${afterRSActiveGatewayRequestCount.sub(beforeRSActiveGatewayRequestCount)} but got `
      + `${afterRSActiveGatewayRequestCount}`,
    );

    // Verifying the storage `stakeRequestHash` and `stakeRequests`.
    const stakeIntentTypeHash = getStakeRequestHash(stakeRequest, gateway);

    const stakeRequestHashStorage = await ostComposer.stakeRequestHashes.call(
      stakeRequest.staker,
      gateway.address,
    );
    assert.strictEqual(
      stakeRequestHashStorage,
      stakeIntentTypeHash,
      `Stake requests of ${stakeRequest.staker} for ${gateway.address} is not cleared`,
    );

    const stakeRequestsStorage = await ostComposer.stakeRequests.call(stakeIntentTypeHash);

    assert.strictEqual(
      stakeRequestsStorage.gateway,
      gateway.address,
      'Gateway address for the request is incorrect',
    );

    assert.strictEqual(
      stakeRequestsStorage.amount.eq(stakeRequest.amount),
      true,
      `Expected staked amount is ${stakeRequest.amount} but got ${stakeRequestsStorage.amount}`,
    );

    assert.strictEqual(
      stakeRequestsStorage.beneficiary,
      stakeRequest.beneficiary,
      'Incorrect beneficiary address',
    );

    assert.strictEqual(
      stakeRequestsStorage.gasPrice.eq(stakeRequest.gasPrice),
      true,
      `Expected gasPrice is ${stakeRequest.gasPrice} but got ${stakeRequestsStorage.gasPrice}`,
    );

    assert.strictEqual(
      stakeRequestsStorage.gasLimit.eq(stakeRequest.gasLimit),
      true,
      `Expected gasLimit is ${stakeRequest.gasLimit} but got ${stakeRequestsStorage.gasLimit}`,
    );

    assert.strictEqual(
      stakeRequestsStorage.nonce.eq(stakeRequest.nonce),
      true,
      `Expected nonce is ${stakeRequest.nonce} but got ${stakeRequestsStorage.nonce}`,
    );

    assert.strictEqual(
      stakeRequestsStorage.staker,
      stakeRequest.staker,
      'Incorrect staker address',
    );
  });

  it('should verify the returned stakeRequestHash', async () => {
    const response = await ostComposer.requestStake.call(
      gateway.address,
      stakeRequest.amount,
      stakeRequest.beneficiary,
      stakeRequest.gasPrice,
      stakeRequest.gasLimit,
      stakeRequest.nonce,
      { from: stakeRequest.staker },
    );

    const stakeIntentTypeHash = getStakeRequestHash(stakeRequest, gateway);
    assert.strictEqual(
      response,
      stakeIntentTypeHash,
      'Invalid stake intent type hash',
    );
  });

  it('should verify the transfer of staked value token', async () => {
    const valueToken = await SpyToken.at(await gateway.valueToken.call());
    await ostComposer.requestStake(
      gateway.address,
      stakeRequest.amount,
      stakeRequest.beneficiary,
      stakeRequest.gasPrice,
      stakeRequest.gasLimit,
      stakeRequest.nonce,
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
      gateway.address,
      stakeRequest.amount,
      stakeRequest.beneficiary,
      stakeRequest.gasPrice,
      stakeRequest.gasLimit,
      stakeRequest.nonce,
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
        gateway.address,
        amount,
        stakeRequest.beneficiary,
        stakeRequest.gasPrice,
        stakeRequest.gasLimit,
        stakeRequest.nonce,
      ),
      { from: stakeRequest.staker },
      'Stake amount must not be zero.',
    );
  });

  it('should fail when beneficiary is null', async () => {
    await Utils.expectRevert(
      ostComposer.requestStake(
        gateway.address,
        stakeRequest.amount,
        Utils.NULL_ADDRESS,
        stakeRequest.gasPrice,
        stakeRequest.gasLimit,
        stakeRequest.nonce,
      ),
      { from: stakeRequest.staker },
      'Stake amount must not be zero.',
    );
  });

  it('should fail when staker nonce is incorrect', async () => {
    // Here, the correct nonce is 0.
    const nonce = stakeRequest.nonce.addn(1) ;
    await Utils.expectRevert(
      ostComposer.requestStake(
        gateway.address,
        stakeRequest.amount,
        stakeRequest.beneficiary,
        stakeRequest.gasPrice,
        stakeRequest.gasLimit,
        nonce,
      ),
      { from: stakeRequest.staker },
      'Incorrect staker nonce.',
    );
  });

  it('should fail when an request from staker is already pending at same gateway', async () => {
    await ostComposer.requestStake(
      gateway.address,
      stakeRequest.amount,
      stakeRequest.beneficiary,
      stakeRequest.gasPrice,
      stakeRequest.gasLimit,
      stakeRequest.nonce,
      { from: stakeRequest.staker },
    );

    await Utils.expectRevert(
      ostComposer.requestStake(
        gateway.address,
        stakeRequest.amount,
        stakeRequest.beneficiary,
        stakeRequest.gasPrice,
        stakeRequest.gasLimit,
        stakeRequest.nonce,
        { from: stakeRequest.staker },
      ),
      'Request for this staker at this gateway is already in process.',
    );
  });


  it('should fail when transferFrom of value token fails ', async () => {
    const valueToken = await SpyToken.at(await gateway.valueToken.call());
    await valueToken.setTransferFromFakeResponse(false);

    await Utils.expectRevert(
      ostComposer.requestStake(
        gateway.address,
        stakeRequest.amount,
        stakeRequest.beneficiary,
        stakeRequest.gasPrice,
        stakeRequest.gasLimit,
        stakeRequest.nonce,
        { from: stakeRequest.staker },
      ),
      'Value token transfer returned false.',
    );
  });
});
