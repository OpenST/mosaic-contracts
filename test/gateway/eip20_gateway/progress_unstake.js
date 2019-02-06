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

const Gateway = artifacts.require('./TestEIP20Gateway.sol');
const MockToken = artifacts.require('MockToken');

const BN = require('bn.js');
const EventDecoder = require('../../test_lib/event_decoder.js');
const messageBus = require('../../test_lib/message_bus.js');
const Utils = require('../../../test/test_lib/utils');
const web3 = require('../../../test/test_lib/web3.js');

const NullAddress = Utils.NULL_ADDRESS;
const ZeroBytes = Utils.ZERO_BYTES32;

contract('EIP20Gateway.progressUnstake()', (accounts) => {
  let gateway;
  let mockToken;
  let baseToken;
  let unstakeRequest;
  let unstakeMessage;
  let stakeVaultAddress;

  const bountyAmount = new BN(100);
  const facilitatorAddress = accounts[0];
  const { MessageStatusEnum } = messageBus;

  const setMessage = async () => {
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

  beforeEach(async () => {
    mockToken = await MockToken.new({ from: accounts[0] });
    baseToken = await MockToken.new({ from: accounts[0] });

    const organizationAddress = accounts[3];
    const coreAddress = accounts[5];
    const burnerAddress = NullAddress;

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

    const hashLockObj = Utils.generateHashLock();

    unstakeMessage = {
      intentHash: web3.utils.sha3('dummy'),
      nonce: new BN(1),
      gasPrice: new BN(100),
      gasLimit: new BN(1000000),
      unstakeAccount: accounts[8],
      hashLock: hashLockObj.l,
      unlockSecret: hashLockObj.s,
    };

    await setMessage();

    stakeVaultAddress = await gateway.stakeVault.call();

    await mockToken.transfer(stakeVaultAddress, new BN(500000000), {
      from: accounts[0],
    });
  });

  it('should fail when message hash is zero', async () => {
    const messageHash = ZeroBytes;

    await Utils.expectRevert(
      gateway.progressUnstake(messageHash, unstakeMessage.unlockSecret),
      'Message hash must not be zero.',
    );
  });

  it('should fail when unlock secret is incorrect', async () => {
    const unlockSecret = ZeroBytes;

    await Utils.expectRevert(
      gateway.progressUnstake(unstakeMessage.messageHash, unlockSecret),
      'Invalid unlock secret.',
    );
  });

  it('should fail when unstake message is undeclared', async () => {
    await Utils.expectRevert(
      gateway.progressUnstake(
        unstakeMessage.messageHash,
        unstakeMessage.unlockSecret,
      ),
      'Message on target status must be Declared.',
    );
  });

  it('should fail when unstake message is already progressed', async () => {
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

  it('should fail for revoked redeem(unstake) message', async () => {
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

  it('should fail when the reward amount is greater than the unstake amount', async () => {
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

  it(
    'should return correct "redeemAmount", "unstakeAmount" and '
      + '"rewardAmount" when gas price is zero',
    async () => {
      unstakeMessage.gasPrice = new BN(0);

      await setMessage();

      await gateway.setInboxStatus(
        unstakeMessage.messageHash,
        MessageStatusEnum.Declared,
      );

      const result = await gateway.progressUnstake.call(
        unstakeMessage.messageHash,
        unstakeMessage.unlockSecret,
      );

      assert.strictEqual(
        unstakeRequest.amount.eq(result.redeemAmount_),
        true,
        `Redeem amount ${result.redeemAmount_.toString(
          10,
        )} must be equal to ${unstakeRequest.amount.toString(10)}`,
      );

      assert.strictEqual(
        unstakeRequest.amount.eq(result.unstakeAmount_),
        true,
        `Unstake amount ${result.unstakeAmount_.toString(
          10,
        )} must be equal to ${unstakeRequest.amount.toString(10)}`,
      );

      assert.strictEqual(
        result.rewardAmount_.eqn(0),
        true,
        `Reward amount ${result.rewardAmount_.toString(
          10,
        )} must be equal to zero`,
      );
    },
  );

  it(
    'should return correct "redeemAmount", "unstakeAmount" and '
      + '"rewardAmount" when gas price is greater than zero',
    async () => {
      unstakeMessage.gasPrice = new BN(1);
      unstakeMessage.gasLimit = new BN(1000000000);

      await setMessage();

      await gateway.setInboxStatus(
        unstakeMessage.messageHash,
        MessageStatusEnum.Declared,
      );

      const tx = await gateway.progressUnstake(
        unstakeMessage.messageHash,
        unstakeMessage.unlockSecret,
      );

      const event = EventDecoder.getEvents(tx, gateway);
      const eventData = event.UnstakeProgressed;

      const gasUsed = new BN(tx.receipt.gasUsed);
      const maxReward = gasUsed.mul(unstakeMessage.gasPrice);

      /*
       * Reward is calculated as `gasPrice * gasConsumed`.
       * The maximum reward possible is 'gasPrice * tx.gasUsed'.
       * The gas used for fees calculations is always going to be less than
       * the total transaction gas.
       */
      assert.strictEqual(
        eventData._rewardAmount.lt(maxReward),
        true,
        `Reward amount ${eventData._rewardAmount.toString(
          10,
        )} must be less than ${maxReward.toString(10)}`,
      );
    },
  );

  it(
    'should return correct "redeemAmount", "unstakeAmount" and '
      + '"rewardAmount" when reward is restricted to gasLimit',
    async () => {
      unstakeMessage.gasPrice = new BN(1);
      unstakeMessage.gasLimit = new BN(100);

      await setMessage();

      await gateway.setInboxStatus(
        unstakeMessage.messageHash,
        MessageStatusEnum.Declared,
      );

      const result = await gateway.progressUnstake.call(
        unstakeMessage.messageHash,
        unstakeMessage.unlockSecret,
      );

      const estimatedReward = unstakeMessage.gasLimit.mul(
        unstakeMessage.gasPrice,
      );

      assert.strictEqual(
        result.rewardAmount_.eq(estimatedReward),
        true,
        `Reward amount ${result.rewardAmount_.toString(
          10,
        )} must be equal to ${estimatedReward.toString(10)}`,
      );

      const estimatedUnstakeAmount = unstakeRequest.amount.sub(
        estimatedReward,
      );

      assert.strictEqual(
        result.unstakeAmount_.eq(estimatedUnstakeAmount),
        true,
        `Unstake amount ${result.unstakeAmount_.toString(
          10,
        )} must be equal to ${estimatedUnstakeAmount.toString(10)}`,
      );

      assert.strictEqual(
        result.redeemAmount_.eq(unstakeRequest.amount),
        true,
        `Redeem amount ${result.redeemAmount_.toString(
          10,
        )} must be equal to ${unstakeRequest.amount.toString(10)}`,
      );
    },
  );

  it('redeem amount must be equal to reward amount plus unstake amount', async () => {
    unstakeMessage.gasPrice = new BN(1);
    unstakeMessage.gasLimit = new BN(10000000000);

    await setMessage();

    await gateway.setInboxStatus(
      unstakeMessage.messageHash,
      MessageStatusEnum.Declared,
    );

    const result = await gateway.progressUnstake.call(
      unstakeMessage.messageHash,
      unstakeMessage.unlockSecret,
    );

    assert.strictEqual(
      result.redeemAmount_.eq(result.unstakeAmount_.add(result.rewardAmount_)),
      true,
      `Unstake amount ${result.redeemAmount_.toString(
        10,
      )} must be equal to ${result.unstakeAmount_
        .add(result.rewardAmount_)
        .toString(10)}`,
    );
  });

  it('should emit "UnstakeProgressed" event', async () => {
    unstakeMessage.gasPrice = new BN(0);

    await setMessage();

    await gateway.setInboxStatus(
      unstakeMessage.messageHash,
      MessageStatusEnum.Declared,
    );

    const tx = await gateway.progressUnstake(
      unstakeMessage.messageHash,
      unstakeMessage.unlockSecret,
    );

    const event = EventDecoder.getEvents(tx, gateway);
    const eventData = event.UnstakeProgressed;

    assert.equal(tx.receipt.status, 1, 'Receipt status is unsuccessful');

    assert.isDefined(
      event.UnstakeProgressed,
      'Event `UnstakeProgressed` must be emitted.',
    );

    assert.strictEqual(
      eventData._messageHash,
      unstakeMessage.messageHash,
      `Message hash ${eventData._messageHash} from event must be equal to `
      + `${unstakeMessage.messageHash}.`,
    );

    assert.strictEqual(
      eventData._redeemer,
      unstakeMessage.unstakeAccount,
      `Redeemer address ${eventData._redeemer} from event must be equal to `
      + `${unstakeMessage.unstakeAccount}.`,
    );

    assert.strictEqual(
      eventData._beneficiary,
      unstakeRequest.beneficiary,
      `Beneficiary address ${eventData._beneficiary} from event must be equal to `
      + `${unstakeRequest.beneficiary}.`,
    );

    assert.strictEqual(
      unstakeRequest.amount.eq(eventData._redeemAmount),
      true,
      `Redeem amount ${eventData._redeemAmount.toString(10)} from event must be equal to `
      + `${unstakeRequest.amount.toString(10)}.`,
    );

    assert.strictEqual(
      unstakeRequest.amount.eq(eventData._unstakeAmount),
      true,
      `Unstake amount ${eventData._unstakeAmount.toString(10)} from event must be equal to `
      + `${unstakeRequest.amount.toString(10)}.`,
    );

    assert.strictEqual(
      eventData._rewardAmount.eqn(0),
      true,
      `Reward amount ${eventData._rewardAmount.toString(10)} from event must be equal to zero.`,
    );

    assert.strictEqual(
      eventData._proofProgress,
      false,
      'Proof progress from event must be equal to false.',
    );

    assert.strictEqual(
      eventData._unlockSecret,
      unstakeMessage.unlockSecret,
      `Unlock secret ${eventData._unlockSecret} from event must be equal to `
      + `${unstakeMessage.unlockSecret}.`,
    );
  });

  it('should unstake token to the beneficiary address', async () => {
    unstakeMessage.gasPrice = new BN(0);

    await setMessage();

    await gateway.setInboxStatus(
      unstakeMessage.messageHash,
      MessageStatusEnum.Declared,
    );

    const initialBeneficiaryBalance = await mockToken.balanceOf(
      unstakeRequest.beneficiary,
    );

    const initialStakeVaultBalance = await mockToken.balanceOf(
      stakeVaultAddress,
    );

    await gateway.progressUnstake(
      unstakeMessage.messageHash,
      unstakeMessage.unlockSecret,
    );

    const finalBeneficiaryBalance = await mockToken.balanceOf(
      unstakeRequest.beneficiary,
    );

    const finalStakeVaultBalance = await mockToken.balanceOf(
      stakeVaultAddress,
    );

    assert.strictEqual(
      finalBeneficiaryBalance.eq(
        initialBeneficiaryBalance.add(unstakeRequest.amount),
      ),
      true,
      `Beneficiary balance ${finalBeneficiaryBalance.toString(10)} must be equal to `
      + `${initialBeneficiaryBalance.add(unstakeRequest.amount).toString(10)}.`,
    );

    assert.strictEqual(
      finalStakeVaultBalance.eq(
        initialStakeVaultBalance.sub(unstakeRequest.amount),
      ),
      true,
      `Stake vault balance ${finalStakeVaultBalance.toString(10)} must be equal to `
      + `${initialStakeVaultBalance.sub(unstakeRequest.amount).toString(10)}.`,
    );
  });

  it('should reward the facilitator', async () => {
    unstakeMessage.gasLimit = new BN(1000);

    await setMessage();

    await gateway.setInboxStatus(
      unstakeMessage.messageHash,
      MessageStatusEnum.Declared,
    );

    const rewardAmount = unstakeMessage.gasLimit.mul(unstakeMessage.gasPrice);

    const initialFacilitatorBalance = await mockToken.balanceOf(
      facilitatorAddress,
    );

    const initialBeneficiaryBalance = await mockToken.balanceOf(
      unstakeRequest.beneficiary,
    );

    const initialStakeVaultBalance = await mockToken.balanceOf(
      stakeVaultAddress,
    );

    await gateway.progressUnstake(
      unstakeMessage.messageHash,
      unstakeMessage.unlockSecret,
      { from: facilitatorAddress },
    );

    const finalFacilitatorBalance = await mockToken.balanceOf(
      facilitatorAddress,
    );

    const finalBeneficiaryBalance = await mockToken.balanceOf(
      unstakeRequest.beneficiary,
    );

    const finalStakeVaultBalance = await mockToken.balanceOf(
      stakeVaultAddress,
    );

    assert.strictEqual(
      finalFacilitatorBalance.eq(initialFacilitatorBalance.add(rewardAmount)),
      true,
      `Facilitator balance ${finalFacilitatorBalance.toString(10)} must be equal to `
      + `${initialFacilitatorBalance.add(rewardAmount).toString(10)}.`,
    );

    assert.strictEqual(
      finalBeneficiaryBalance.eq(
        initialBeneficiaryBalance.add(unstakeRequest.amount).sub(rewardAmount),
      ),
      true,
      `Beneficiary balance ${finalBeneficiaryBalance.toString(10)} must be equal to `
      + `${initialBeneficiaryBalance.add(unstakeRequest.amount).sub(rewardAmount).toString(10)}.`,
    );

    assert.strictEqual(
      finalStakeVaultBalance.eq(
        initialStakeVaultBalance.sub(unstakeRequest.amount),
      ),
      true,
      `Stake vault balance ${finalStakeVaultBalance.toString(10)} must be equal to `
      + `${initialStakeVaultBalance.sub(unstakeRequest.amount).toString(10)}.`,
    );
  });
});
