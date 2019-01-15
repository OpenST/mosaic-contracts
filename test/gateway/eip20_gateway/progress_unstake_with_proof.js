// Copyright 2018 OpenST Ltd.
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

const Gateway = artifacts.require("./TestEIP20Gateway.sol");
const MockToken = artifacts.require("MockToken");

const BN = require('bn.js');
const EventDecoder = require('../../test_lib/event_decoder.js');
const messageBus = require('../../test_lib/message_bus.js');
const Utils = require('../../../test/test_lib/utils');
const cogatewayUtils = require('../../../test/gateway/eip20_cogateway/helpers/co_gateway_utils');
const StubData = require('../../data/redeem_progressed_1.json');
const StubDataRedeemFailure = require('../../data/redeem_amount_less_than_reward.json');
const StubDataRedeemReward = require('../../data/redeem_progressed_reward_based_on_gas_consumption.json');

const NullAddress = Utils.NULL_ADDRESS;
const ZeroBytes = Utils.ZERO_BYTES32;

contract('EIP20Gateway.progressUnstakeWithProof()', function (accounts) {

  let gateway, mockToken, baseToken, unstakeRequest, unstakeMessage,
    stakeVaultAddress;
  let bountyAmount = new BN(StubData.gateway.constructor.bountyAmount, 16);
  let MessageStatusEnum = messageBus.MessageStatusEnum;
  let redeemRequest = StubData.co_gateway.redeem.params;

  beforeEach(async function () {
    redeemRequest = StubData.co_gateway.redeem.params;
    mockToken = await MockToken.new({from: accounts[0]});
    baseToken = await MockToken.new({from: accounts[0]});

    let organizationAddress = accounts[3];
    let coreAddress = accounts[5];
    let burnerAddress = NullAddress;

    gateway = await Gateway.new(
      mockToken.address,
      baseToken.address,
      coreAddress,
      bountyAmount,
      organizationAddress,
      burnerAddress,
    );

    unstakeRequest = {
      beneficiary: redeemRequest.beneficiary,
      amount: new BN(redeemRequest.amount, 16),
    };

    let redeemIntentHash = cogatewayUtils.hashRedeemIntent(
      unstakeRequest.amount,
      unstakeRequest.beneficiary,
      StubData.contracts.coGateway
    );

    unstakeMessage = {
      intentHash: redeemIntentHash,
      nonce: new BN(redeemRequest.nonce, 16),
      gasPrice: new BN(redeemRequest.gasPrice, 16),
      gasLimit: new BN(redeemRequest.gasLimit, 16),
      unstakeAccount: redeemRequest.redeemer,
      hashLock: redeemRequest.hashLock,
      unlockSecret: redeemRequest.unlockSecret,
    };
    stakeVaultAddress = await setup(unstakeMessage, gateway, unstakeRequest, stakeVaultAddress, mockToken, accounts);

  });

  it('should unstake with correct parameters', async function () {

    await gateway.setInboxStatus(unstakeMessage.messageHash, MessageStatusEnum.Declared);

    let blockHeight = new BN(StubData.co_gateway.redeem.proof_data.block_number, 16);
    let storageRoot = StubData.co_gateway.redeem.proof_data.storageHash;

    let storageProof = StubData.co_gateway.redeem.proof_data.storageProof[0].serializedProof;

    await gateway.setStorageRoot(blockHeight, storageRoot);

    let tx = await gateway.progressUnstakeWithProof(
      unstakeMessage.messageHash,
      storageProof,
      blockHeight,
      MessageStatusEnum.Declared
    );

    assert.strictEqual(
      tx.receipt.status,
      true,
      'Transaction should success.',
    );

  });

  it('should emit "UnstakeProgressed" event', async function () {

    await gateway.setInboxStatus(unstakeMessage.messageHash, MessageStatusEnum.Declared);

    let blockHeight = new BN(StubData.co_gateway.redeem.proof_data.block_number, 16);
    let storageRoot = StubData.co_gateway.redeem.proof_data.storageHash;

    let storageProof = StubData.co_gateway.redeem.proof_data.storageProof[0].serializedProof;

    await gateway.setStorageRoot(blockHeight, storageRoot);

    let tx = await gateway.progressUnstakeWithProof(
      unstakeMessage.messageHash,
      storageProof,
      blockHeight,
      MessageStatusEnum.Declared
    );

    let event = EventDecoder.getEvents(tx, gateway);
    let eventData = event.UnstakeProgressed;

    assert.equal(
      tx.receipt.status,
      1,
      "Receipt status is unsuccessful",
    );

    assert.isDefined(
      event.UnstakeProgressed,
      'Event `UnstakeProgressed` must be emitted.',
    );

    assert.strictEqual(
      eventData._messageHash,
      unstakeMessage.messageHash,
      `Message hash ${eventData._messageHash} from event must be equal to ${unstakeMessage.messageHash}.`,
    );

    assert.strictEqual(
      eventData._redeemer,
      unstakeMessage.unstakeAccount,
      `Redeemer address ${eventData._redeemer} from event must be equal to ${unstakeMessage.unstakeAccount}.`,
    );

    assert.strictEqual(
      eventData._beneficiary,
      unstakeRequest.beneficiary,
      `Beneficiary address ${eventData._beneficiary} from event must be equal to ${unstakeRequest.beneficiary}.`,
    );

    assert.strictEqual(
      unstakeRequest.amount.eq(eventData._redeemAmount),
      true,
      `Redeem amount ${eventData._redeemAmount.toNumber(10)} from event must be equal to ${unstakeRequest.amount.toNumber(10)}.`,
    );

    assert.strictEqual(
      eventData._rewardAmount.add(eventData._unstakeAmount).eq(unstakeRequest.amount),
      true,
      `Total unstake amount should be equal to sum of reward amount plus unstaked amount to beneficiary`,
    );

    assert.strictEqual(
      eventData._proofProgress,
      true,
      'Proof progress from event must be equal to true.',
    );

    assert.strictEqual(
      eventData._unlockSecret,
      ZeroBytes,
      `Unlock secret ${eventData._unlockSecret} from event must be equal to ${ZeroBytes}.`,
    );

  });

  it('should unstake token to the beneficiary address', async function () {

    stakeVaultAddress = await setup(unstakeMessage, gateway, unstakeRequest, stakeVaultAddress, mockToken, accounts);

    let initialBeneficiaryBalance =
      await mockToken.balanceOf(unstakeRequest.beneficiary);

    let initialStakeVaultBalance = await mockToken.balanceOf(stakeVaultAddress);

    await gateway.setInboxStatus(unstakeMessage.messageHash, MessageStatusEnum.Declared);

    let blockHeight = new BN(StubData.co_gateway.redeem.proof_data.block_number, 16);
    let storageRoot = StubData.co_gateway.redeem.proof_data.storageHash;

    let storageProof = StubData.co_gateway.redeem.proof_data.storageProof[0].serializedProof;

    await gateway.setStorageRoot(blockHeight, storageRoot);

    await gateway.progressUnstakeWithProof(
      unstakeMessage.messageHash,
      storageProof,
      blockHeight,
      MessageStatusEnum.Declared
    );

    let finalBeneficiaryBalance = await mockToken.balanceOf(unstakeRequest.beneficiary);

    let finalStakeVaultBalance = await mockToken.balanceOf(stakeVaultAddress);
    let reward = unstakeMessage.gasPrice.mul(unstakeMessage.gasLimit);

    let expectedBeneficiaryBalance = unstakeRequest.amount.sub(reward);
    assert.strictEqual(
      finalBeneficiaryBalance.eq(expectedBeneficiaryBalance),
      true,
      `Beneficiary balance ${finalBeneficiaryBalance.toNumber(10)}` +
      `must be equal to ${initialBeneficiaryBalance.add(expectedBeneficiaryBalance).toNumber(10)}.`,
    );

    assert.strictEqual(
      finalStakeVaultBalance.eq(initialStakeVaultBalance.sub(unstakeRequest.amount)),
      true,
      `Stake vault balance ${finalStakeVaultBalance.toNumber(10)} ` +
      `must be equal to ${initialStakeVaultBalance.sub(unstakeRequest.amount).toNumber(10)}.`,
    );

  });

  it('should reward token to the facilitator address with maximum' +
    ' possible reward', async function () {

    let facilitatorAddress = accounts[1];
    stakeVaultAddress = await setup(unstakeMessage, gateway, unstakeRequest, stakeVaultAddress, mockToken, accounts);

    let initialFacilitatorBalance = await mockToken.balanceOf(facilitatorAddress);
    let initialStakeVaultBalance = await mockToken.balanceOf(stakeVaultAddress);

    await gateway.setInboxStatus(unstakeMessage.messageHash, MessageStatusEnum.Declared);

    let blockHeight = new BN(StubData.co_gateway.redeem.proof_data.block_number, 16);
    let storageRoot = StubData.co_gateway.redeem.proof_data.storageHash;

    let storageProof = StubData.co_gateway.redeem.proof_data.storageProof[0].serializedProof;

    await gateway.setStorageRoot(blockHeight, storageRoot);

    await gateway.progressUnstakeWithProof(
      unstakeMessage.messageHash,
      storageProof,
      blockHeight,
      MessageStatusEnum.Declared,
      {from: facilitatorAddress},
    );

    let finalFacilitatorBalance = await mockToken.balanceOf(facilitatorAddress);
    let finalStakeVaultBalance = await mockToken.balanceOf(stakeVaultAddress);
    let reward = unstakeMessage.gasPrice.mul(unstakeMessage.gasLimit);

    assert.strictEqual(
      finalFacilitatorBalance.eq(initialFacilitatorBalance.add(reward)),
      true,
      `Facilitator balance ${finalFacilitatorBalance.toNumber(10)}` +
      `must be equal to ${initialFacilitatorBalance.add(reward).toNumber(10)}.`,
    );

    assert.strictEqual(
      finalStakeVaultBalance.eq(initialStakeVaultBalance.sub(unstakeRequest.amount)),
      true,
      `Stake vault balance ${finalStakeVaultBalance.toNumber(10)} ` +
      `must be equal to ${initialStakeVaultBalance.sub(unstakeRequest.amount).toNumber(10)}.`,
    );

  });

  it('should reward token to the facilitator address based on gas' +
    ' consumption', async function () {

    redeemRequest = StubDataRedeemReward.co_gateway.redeem.params;
    unstakeRequest = {
      beneficiary: redeemRequest.beneficiary,
      amount: new BN(redeemRequest.amount, 16),
    };

    let redeemIntentHash = cogatewayUtils.hashRedeemIntent(
      unstakeRequest.amount,
      unstakeRequest.beneficiary,
      StubDataRedeemReward.contracts.coGateway
    );

    unstakeMessage = {
      intentHash: redeemIntentHash,
      nonce: new BN(redeemRequest.nonce, 16),
      gasPrice: new BN(redeemRequest.gasPrice, 16),
      gasLimit: new BN(redeemRequest.gasLimit, 16),
      unstakeAccount: redeemRequest.redeemer,
      hashLock: redeemRequest.hashLock,
      unlockSecret: redeemRequest.unlockSecret,
    };
    stakeVaultAddress = await setup(unstakeMessage, gateway, unstakeRequest, stakeVaultAddress, mockToken, accounts);

    await gateway.setInboxStatus(unstakeMessage.messageHash, MessageStatusEnum.Declared);

    let blockHeight = new BN(StubDataRedeemReward.co_gateway.redeem.proof_data.block_number, 16);
    let storageRoot = StubDataRedeemReward.co_gateway.redeem.proof_data.storageHash;

    let storageProof = StubDataRedeemReward.co_gateway.redeem.proof_data.storageProof[0].serializedProof;

    await gateway.setStorageRoot(blockHeight, storageRoot);


    let facilitatorAddress = accounts[1];
    stakeVaultAddress = await setup(unstakeMessage, gateway, unstakeRequest, stakeVaultAddress, mockToken, accounts);

    let initialFacilitatorBalance = await mockToken.balanceOf(facilitatorAddress);
    let initialStakeVaultBalance = await mockToken.balanceOf(stakeVaultAddress);
    let initialBeneficiaryBalance = await mockToken.balanceOf(unstakeRequest.beneficiary);


    await gateway.progressUnstakeWithProof(
      unstakeMessage.messageHash,
      storageProof,
      blockHeight,
      MessageStatusEnum.Declared,
      {from: facilitatorAddress},
    );

    let finalFacilitatorBalance = await mockToken.balanceOf(facilitatorAddress);
    let finalStakeVaultBalance = await mockToken.balanceOf(stakeVaultAddress);
    let finalBeneficiaryBalance = await mockToken.balanceOf(unstakeRequest.beneficiary);

    let recievedReward = finalFacilitatorBalance.sub(initialFacilitatorBalance);
    let unstakeToBeneficiary = finalBeneficiaryBalance.sub(initialBeneficiaryBalance);
    assert.strictEqual(
      recievedReward.add(unstakeToBeneficiary).eq(unstakeRequest.amount),
      true,
      `Facilitator reward plus unstake to beneficiary should be equal to total unstake amount`,
    );

    assert.strictEqual(
      finalStakeVaultBalance.eq(initialStakeVaultBalance.sub(unstakeRequest.amount)),
      true,
      `Stake vault balance ${finalStakeVaultBalance.toNumber(10)} ` +
      `must be equal to ${initialStakeVaultBalance.sub(unstakeRequest.amount).toNumber(10)}.`,
    );

  });

  it('should fail when message hash is zero', async function () {

    let messageHash = ZeroBytes;

    await gateway.setInboxStatus(unstakeMessage.messageHash, MessageStatusEnum.Declared);

    let blockHeight = new BN(StubData.co_gateway.redeem.proof_data.block_number, 16);
    let storageRoot = StubData.co_gateway.redeem.proof_data.storageHash;
    let storageProof = StubData.co_gateway.redeem.proof_data.storageProof[0].serializedProof;

    await gateway.setStorageRoot(blockHeight, storageRoot);

    await Utils.expectRevert(
      gateway.progressUnstakeWithProof(
        messageHash,
        storageProof,
        blockHeight,
        MessageStatusEnum.Declared
      ),
      'Message hash must not be zero.'
    );

  });

  it('should fail when unstake message is undeclared', async function () {

    await gateway.setInboxStatus(unstakeMessage.messageHash, MessageStatusEnum.Undeclared);

    let blockHeight = new BN(StubData.co_gateway.redeem.proof_data.block_number, 16);
    let storageRoot = StubData.co_gateway.redeem.proof_data.storageHash;
    let storageProof = StubData.co_gateway.redeem.proof_data.storageProof[0].serializedProof;

    await gateway.setStorageRoot(blockHeight, storageRoot);

    await Utils.expectRevert(
      gateway.progressUnstakeWithProof(
        unstakeMessage.messageHash,
        storageProof,
        blockHeight,
        MessageStatusEnum.Declared
      ),
      'Message on target must be Declared.',
    );
  });

  it('should fail when unstake message is already progressed', async function () {

    await gateway.setInboxStatus(unstakeMessage.messageHash, MessageStatusEnum.Declared);

    let blockHeight = new BN(StubData.co_gateway.redeem.proof_data.block_number, 16);
    let storageRoot = StubData.co_gateway.redeem.proof_data.storageHash;
    let storageProof = StubData.co_gateway.redeem.proof_data.storageProof[0].serializedProof;

    await gateway.setStorageRoot(blockHeight, storageRoot);
    await gateway.progressUnstakeWithProof(
      unstakeMessage.messageHash,
      storageProof,
      blockHeight,
      MessageStatusEnum.Declared
    );

    await Utils.expectRevert(
      gateway.progressUnstakeWithProof(
        unstakeMessage.messageHash,
        storageProof,
        blockHeight,
        MessageStatusEnum.Declared
      ),
      'Message on target must be Declared.',
    );
  });

  it('should fail for revoked redeem(unstake) message', async function () {

    await gateway.setInboxStatus(unstakeMessage.messageHash, MessageStatusEnum.Revoked);

    let blockHeight = new BN(StubData.co_gateway.redeem.proof_data.block_number, 16);
    let storageRoot = StubData.co_gateway.redeem.proof_data.storageHash;
    let storageProof = StubData.co_gateway.redeem.proof_data.storageProof[0].serializedProof;

    await gateway.setStorageRoot(blockHeight, storageRoot);

    await Utils.expectRevert(
      gateway.progressUnstakeWithProof(
        unstakeMessage.messageHash,
        storageProof,
        blockHeight,
        MessageStatusEnum.Declared
      ),
      'Message on target must be Declared.',
    );

  });

  it('should fail when the reward amount is greater than the unstake amount', async function () {

    redeemRequest = StubDataRedeemFailure.co_gateway.redeem.params;
    unstakeRequest = {
      beneficiary: redeemRequest.beneficiary,
      amount: new BN(redeemRequest.amount, 16),
    };

    let redeemIntentHash = cogatewayUtils.hashRedeemIntent(
      unstakeRequest.amount,
      unstakeRequest.beneficiary,
      StubDataRedeemFailure.contracts.coGateway
    );

    unstakeMessage = {
      intentHash: redeemIntentHash,
      nonce: new BN(redeemRequest.nonce, 16),
      gasPrice: new BN(redeemRequest.gasPrice, 16),
      gasLimit: new BN(redeemRequest.gasLimit, 16),
      unstakeAccount: redeemRequest.redeemer,
      hashLock: redeemRequest.hashLock,
      unlockSecret: redeemRequest.unlockSecret,
    };
    stakeVaultAddress = await setup(unstakeMessage, gateway, unstakeRequest, stakeVaultAddress, mockToken, accounts);

    await gateway.setInboxStatus(unstakeMessage.messageHash, MessageStatusEnum.Declared);

    let blockHeight = new BN(StubDataRedeemFailure.co_gateway.redeem.proof_data.block_number, 16);
    let storageRoot = StubDataRedeemFailure.co_gateway.redeem.proof_data.storageHash;

    let storageProof = StubDataRedeemFailure.co_gateway.redeem.proof_data.storageProof[0].serializedProof;

    await gateway.setStorageRoot(blockHeight, storageRoot);

    await Utils.expectRevert(
      gateway.progressUnstakeWithProof(
        unstakeMessage.messageHash,
        storageProof,
        blockHeight,
        MessageStatusEnum.Declared
      ),
      "Reward amount must be less than redeem amount.",
    );
  });

});

async function setup(unstakeMessage, gateway, unstakeRequest, stakeVaultAddress, mockToken, accounts) {
  unstakeMessage.messageHash = messageBus.messageDigest(
    unstakeMessage.intentHash,
    unstakeMessage.nonce,
    unstakeMessage.gasPrice,
    unstakeMessage.gasLimit,
    unstakeMessage.unstakeAccount,
    unstakeMessage.hashLock,
  );
  await gateway.setMessage(
    unstakeMessage.intentHash,
    unstakeMessage.nonce,
    unstakeMessage.gasPrice,
    unstakeMessage.gasLimit,
    unstakeMessage.unstakeAccount,
    unstakeMessage.hashLock,
  );

  await gateway.setUnstake(
    unstakeMessage.messageHash,
    unstakeRequest.beneficiary,
    unstakeRequest.amount,
  );

  stakeVaultAddress = await gateway.stakeVault.call();

  await mockToken.transfer(
    stakeVaultAddress,
    unstakeRequest.amount,
    {from: accounts[0]}
  );
  return stakeVaultAddress;
}
