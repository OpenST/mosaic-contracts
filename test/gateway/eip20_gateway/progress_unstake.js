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
const web3 = require('../../../test/test_lib/web3.js');

const NullAddress = Utils.NULL_ADDRESS;
const ZeroBytes = Utils.ZERO_BYTES32;

contract('EIP20Gateway.progressUnstake()', function (accounts) {

  let gateway, mockToken, baseToken, unstakeRequest, unstakeMessage, stakeVaultAddress;
  let bountyAmount = new BN(100);
  let facilitatorAddress = accounts[0];
  let MessageStatusEnum = messageBus.MessageStatusEnum;

  // Got this by try and error. Suggest better way to find this value.
  let estimatedGasUsed = new BN(199810);

  let setMessage = async function() {

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
  };

  beforeEach(async function () {

    mockToken = await MockToken.new({ from: accounts[0] });
    baseToken = await MockToken.new({ from: accounts[0] });

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
      beneficiary: accounts[6],
      amount: new BN(100000000),
    };

    let hashLockObj = Utils.generateHashLock();

    unstakeMessage = {
      intentHash: web3.utils.sha3("dummy"),
      nonce: new BN(1),
      gasPrice: new BN(100),
      gasLimit: new BN(1000000),
      unstakeAccount: accounts[8],
      hashLock: hashLockObj.l,
      unlockSecret: hashLockObj.s
    };

    await setMessage();

    stakeVaultAddress = await gateway.stakeVault.call();

    await mockToken.transfer(
      stakeVaultAddress,
      new BN(500000000),
      { from: accounts[0] }
    );

  });

  it('should fail when message hash is zero', async function () {

    let messageHash = ZeroBytes;

    await Utils.expectRevert(
      gateway.progressUnstake(
        messageHash,
        unstakeMessage.unlockSecret,
      ),
      'Message hash must not be zero.',
    );

  });

  it('should fail when unlock secret is incorrect', async function () {

    let unlockSecret = ZeroBytes;

    await Utils.expectRevert(
      gateway.progressUnstake(
        unstakeMessage.messageHash,
        unlockSecret,
      ),
      'Invalid unlock secret.',
    );

  });

  it('should fail when unstake message is undeclared', async function () {

    await Utils.expectRevert(
      gateway.progressUnstake(
        unstakeMessage.messageHash,
        unstakeMessage.unlockSecret,
      ),
      'Message on target status must be Declared.',
    );

  });

  it('should fail when unstake message is already progressed', async function () {

    await gateway.setInboxStatus(
      unstakeMessage.messageHash,
      MessageStatusEnum.Declared,
    );

    await gateway.progressUnstake(
      unstakeMessage.messageHash,
      unstakeMessage.unlockSecret,
    );

    await Utils.expectRevert(
      gateway.progressUnstake(
        unstakeMessage.messageHash,
        unstakeMessage.unlockSecret,
      ),
      'Message on target status must be Declared.',
    );

  });

  it('should fail for revoked redeem(unstake) message', async function () {

    await gateway.setInboxStatus(
      unstakeMessage.messageHash,
      MessageStatusEnum.Revoked,
    );

    await Utils.expectRevert(
      gateway.progressUnstake(
        unstakeMessage.messageHash,
        unstakeMessage.unlockSecret,
      ),
      'Message on target status must be Declared.',
    );

  });

  it('should fail when redeem(unstake) message status is revocation declared',
    async function () {

    await gateway.setInboxStatus(
      unstakeMessage.messageHash,
      MessageStatusEnum.DeclaredRevocation,
    );

    await Utils.expectRevert(
      gateway.progressUnstake(
        unstakeMessage.messageHash,
        unstakeMessage.unlockSecret,
      ),
      'Message on target status must be Declared.',
    );

  });

  it('should fail when the reward amount is greater than the unstake amount',
    async function () {

    unstakeMessage.gasPrice = new BN(10000);
    unstakeMessage.gasLimit = new BN(10000);

    await setMessage();

    await gateway.setInboxStatus(
      unstakeMessage.messageHash,
      MessageStatusEnum.Declared,
    );

    await Utils.expectRevert(
      gateway.progressUnstake(
        unstakeMessage.messageHash,
        unstakeMessage.unlockSecret,
      ),
      'Reward amount must be less than redeem amount.',
    );

  });

  it('should return correct "redeemAmount", "unstakeAmount" and ' +
    '"rewardAmount" when gas price is zero', async function () {

    unstakeMessage.gasPrice = new BN(0);

    await setMessage();

    await gateway.setInboxStatus(
      unstakeMessage.messageHash,
      MessageStatusEnum.Declared,
    );

    let result = await gateway.progressUnstake.call(
      unstakeMessage.messageHash,
      unstakeMessage.unlockSecret,
    );

    assert.strictEqual(
      unstakeRequest.amount.eq(result.redeemAmount_),
      true,
      `Redeem amount ${result.redeemAmount_} must be equal to ${unstakeRequest.amount}`,
    );

    assert.strictEqual(
      unstakeRequest.amount.eq(result.unstakeAmount_),
      true,
      `Unstake amount ${result.unstakeAmount_} must be equal to ${unstakeRequest.amount}`,
    );

    assert.strictEqual(
      result.rewardAmount_.eqn(0),
      true,
      `Reward amount ${result.rewardAmount_} must be equal to zero`,
    );

  });

  it('should return correct "redeemAmount", "unstakeAmount" and ' +
    '"rewardAmount" when gas price is greater than zero', async function () {

    unstakeMessage.gasPrice = new BN(1);
    unstakeMessage.gasLimit = new BN(1000000000);

    await setMessage();

    await gateway.setInboxStatus(
      unstakeMessage.messageHash,
      MessageStatusEnum.Declared,
    );

    let result = await gateway.progressUnstake.call(
      unstakeMessage.messageHash,
      unstakeMessage.unlockSecret,
    );

    let estimatedReward = estimatedGasUsed.mul(unstakeMessage.gasPrice);
    let errorMargin = result.rewardAmount_.sub(estimatedReward);

    assert.strictEqual(
      errorMargin.abs().lten(100), // The gas used varies, so kept 100 as buffer.
      true,
      `Reward amount ${result.rewardAmount_} must be equal to ${estimatedReward}`,
    );

    let estimatedUnstakeAmount = unstakeRequest.amount.sub(estimatedReward).sub(errorMargin);

    assert.strictEqual(
      result.unstakeAmount_.eq(estimatedUnstakeAmount),
      true,
      `Unstake amount ${result.unstakeAmount_} must be equal to ${estimatedUnstakeAmount}`,
    );

    assert.strictEqual(
      result.redeemAmount_.eq(unstakeRequest.amount),
      true,
      `Redeem amount ${result.redeemAmount_} must be equal to ${unstakeRequest.amount}`,
    );

  });

  it('should return correct "redeemAmount", "unstakeAmount" and ' +
    '"rewardAmount" when reward is restricted to gasLimit', async function () {

    unstakeMessage.gasPrice = new BN(1);
    unstakeMessage.gasLimit = new BN(100);

    await setMessage();

    await gateway.setInboxStatus(
      unstakeMessage.messageHash,
      MessageStatusEnum.Declared,
    );

    let result = await gateway.progressUnstake.call(
      unstakeMessage.messageHash,
      unstakeMessage.unlockSecret,
    );

    let estimatedReward = unstakeMessage.gasLimit.mul(unstakeMessage.gasPrice);

    assert.strictEqual(
      result.rewardAmount_.eq(estimatedReward),
      true,
      `Reward amount ${result.rewardAmount_} must be equal to ${estimatedReward}`,
    );

    let estimatedUnstakeAmount = unstakeRequest.amount.sub(estimatedReward);

    assert.strictEqual(
      result.unstakeAmount_.eq(estimatedUnstakeAmount),
      true,
      `Unstake amount ${result.unstakeAmount_} must be equal to ${estimatedUnstakeAmount}`,
    );

    assert.strictEqual(
      result.redeemAmount_.eq(unstakeRequest.amount),
      true,
      `Redeem amount ${result.redeemAmount_} must be equal to ${unstakeRequest.amount}`,
    );

  });

  it('should emit "UnstakeProgressed" event', async function () {

    unstakeMessage.gasPrice = new BN(0);

    await setMessage();

    await gateway.setInboxStatus(
      unstakeMessage.messageHash,
      MessageStatusEnum.Declared,
    );

    let tx = await gateway.progressUnstake(
      unstakeMessage.messageHash,
      unstakeMessage.unlockSecret,
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
      `Redeem amount ${eventData._redeemAmount} from event must be equal to ${unstakeRequest.amount}.`,
    );

    assert.strictEqual(
      unstakeRequest.amount.eq(eventData._unstakeAmount),
      true,
      `Unstake amount ${eventData._unstakeAmount} from event must be equal to ${unstakeRequest.amount}.`,
    );

    assert.strictEqual(
      eventData._rewardAmount.eqn(0),
      true,
      `Reward amount ${eventData._rewardAmount} from event must be equal to zero.`,
    );

    assert.strictEqual(
      eventData._proofProgress,
      false,
      'Proof progress from event must be equal to false.',
    );

    assert.strictEqual(
      eventData._unlockSecret,
      unstakeMessage.unlockSecret,
      `Unlock secret ${eventData._unlockSecret} from event must be equal to ${unstakeMessage.unlockSecret}.`,
    );

  });

  it('should unstake token to the beneficiary address', async function () {

    unstakeMessage.gasPrice = new BN(0);

    await setMessage();

    await gateway.setInboxStatus(
      unstakeMessage.messageHash,
      MessageStatusEnum.Declared,
    );

    let initialBeneficiaryBalance =
      await mockToken.balanceOf(unstakeRequest.beneficiary);

    let initialStakeVaultBalance = await mockToken.balanceOf(stakeVaultAddress);

    await gateway.progressUnstake(
      unstakeMessage.messageHash,
      unstakeMessage.unlockSecret,
    );

    let finalBeneficiaryBalance =
      await mockToken.balanceOf(unstakeRequest.beneficiary);

    let finalStakeVaultBalance = await mockToken.balanceOf(stakeVaultAddress);

    assert.strictEqual(
      finalBeneficiaryBalance.eq(initialBeneficiaryBalance.add(unstakeRequest.amount)),
      true,
      `Beneficiary balance ${finalBeneficiaryBalance} must be equal to ${initialBeneficiaryBalance.add(unstakeRequest.amount)}.`,
    );

    assert.strictEqual(
      finalStakeVaultBalance.eq(initialStakeVaultBalance.sub(unstakeRequest.amount)),
      true,
      `Stake vault balance ${finalStakeVaultBalance} must be equal to ${initialStakeVaultBalance.sub(unstakeRequest.amount)}.`,
    );

  });

  it('should reward the facilitator', async function () {

    unstakeMessage.gasLimit = new BN(1000);

    await setMessage();

    await gateway.setInboxStatus(
      unstakeMessage.messageHash,
      MessageStatusEnum.Declared,
    );

    let rewardAmount = unstakeMessage.gasLimit.mul(unstakeMessage.gasPrice);

    let initialFacilitatorBalance =
      await mockToken.balanceOf(facilitatorAddress);

    let initialBeneficiaryBalance =
      await mockToken.balanceOf(unstakeRequest.beneficiary);

    let initialStakeVaultBalance = await mockToken.balanceOf(stakeVaultAddress);

    await gateway.progressUnstake(
      unstakeMessage.messageHash,
      unstakeMessage.unlockSecret,
      { from: facilitatorAddress }
    );

    let finalFacilitatorBalance =
      await mockToken.balanceOf(facilitatorAddress);

    let finalBeneficiaryBalance =
      await mockToken.balanceOf(unstakeRequest.beneficiary);

    let finalStakeVaultBalance = await mockToken.balanceOf(stakeVaultAddress);

    assert.strictEqual(
      finalFacilitatorBalance.eq(initialFacilitatorBalance.add(rewardAmount)),
      true,
      `Facilitator balance ${finalFacilitatorBalance} must be equal to ${initialFacilitatorBalance.add(rewardAmount)}.`,
    );

    assert.strictEqual(
      finalBeneficiaryBalance.eq(initialBeneficiaryBalance.add(unstakeRequest.amount).sub(rewardAmount)),
      true,
      `Beneficiary balance ${finalBeneficiaryBalance} must be equal to ${initialBeneficiaryBalance.add(unstakeRequest.amount).sub(rewardAmount)}.`,
    );

    assert.strictEqual(
      finalStakeVaultBalance.eq(initialStakeVaultBalance.sub(unstakeRequest.amount)),
      true,
      `Stake vault balance ${finalStakeVaultBalance} must be equal to ${initialStakeVaultBalance.sub(unstakeRequest.amount)}.`,
    );

  });

});
