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

const EventDecoder = require('../../test/test_lib/event_decoder');

/**
 * Object contains input parameters for staking flow.
 *
 * @typedef {Object} StakeParams
 * @property {string} staker Staker address.
 * @property {string} nonce Staker nonce.
 * @property {string} beneficiary Beneficiary address.
 * @property {string} amount Stake amount.
 * @property {string} gasPrice Gas price.
 * @property {string} gasLimit Gas limit.
 * @property {string} hashLock Hash lock
 * @property {string} blockHeight Block height.
 * @property {string} rlpParentNodes RLP encoded proof data.
 * @property {string} unlockSecret Unlock secret.
 * @property {string} facilitator Facilitator address.
 * @property {string} storageRoot Storage root for proof.
 */

/**
 * Object contains input parameter needed for redeem flow.
 *
 * @typedef {object} RedeemParams.
 * @property {string} redeemer Redeemer address.
 * @property {string} redeemerNonce Redeemer nonce.
 * @property {string} beneficiary Address where the redeemed tokens
 *                                    will be transferred.
 * @property {string} amount Redeem amount.
 * @property {string} gasPrice Gas price that redeemer is ready to pay to*
 *                             get the redeem and unstake process done.
 * @property {string} gasLimit Gas limit that redeemer is ready to pay.
 * @property {string} messageHash Message hash
 * @property {string} blockHeight Block number for which the proof is valid.
 * @property {string} hashLock Hash lock.
 * @property {string} rlpParentNodes RLP encoded proof data.
 * @property {string} unlockSecret Unlock secret.
 * @property {string} storageRoot Storage root for proof.
 * @property {string} facilitator Facilitator address for progress mint.
 */

/**
 * Gateway class provides helper methods for stake and mint and redeem and unstake.
 */
class Gateway {
  /**
   * @param {Object} registeredContracts All the deployed contracts
   */
  constructor(registeredContracts) {
    this.token = registeredContracts.mockToken;
    this.baseToken = registeredContracts.baseToken;
    this.gateway = registeredContracts.gateway;
    this.deployer = registeredContracts.owner;
    this.address = this.gateway.address;
  }

  /**
   * Initiates the stake process and returns the event and return value of
   * stake function.
   *
   * @param {StakeParams} params Please see above typedef for more details.
   *
   * @returns {Object} Object containing events and return values.
   */
  async stake(params) {
    const {
      amount,
      beneficiary,
      gasPrice,
      gasLimit,
      nonce,
      hashLock,
      staker,
    } = params;

    await this.token.transfer(
      staker,
      amount,
      { from: this.deployer },
    );

    const bounty = await this.gateway.bounty.call();
    await this.baseToken.transfer(
      staker,
      bounty,
      { from: this.deployer },
    );

    await this.token.approve(this.gateway.address, amount, { from: staker });
    await this.baseToken.approve(this.gateway.address, bounty, { from: staker });

    const messageHash = await this.gateway.stake.call(
      amount,
      beneficiary,
      gasPrice,
      gasLimit,
      nonce,
      hashLock,
      { from: staker },
    );

    const tx = await this.gateway.stake(
      amount,
      beneficiary,
      gasPrice,
      gasLimit,
      nonce,
      hashLock,
      { from: staker },
    );

    const events = EventDecoder.getEvents(tx, this.gateway);

    const returnedValue = {};
    returnedValue.messageHash_ = messageHash;

    return {
      returned_value: returnedValue,
      events,
      block_number: tx.receipt.blockNumber,
    };
  }

  /**
   * Progresses stake.
   *
   * @param {StakeParams} params Please see above typedef for more details.
   *
   * @returns {Object} Object containing events and return values.
   */
  async progressStake(params) {
    const {
      messageHash,
      unlockSecret,
      facilitator,
    } = params;

    const result = await this.gateway.progressStake.call(
      messageHash,
      unlockSecret,
      { from: facilitator },
    );

    const tx = await this.gateway.progressStake(
      messageHash,
      unlockSecret,
      { from: facilitator },
    );

    const events = EventDecoder.getEvents(tx, this.gateway);

    return {
      returned_value: result,
      events,
      block_number: tx.receipt.blockNumber,
    };
  }

  /**
   * Revert stake.
   *
   * @param {StakeParams} params Please see above typedef for more details.
   *
   * @returns {Object} Object containing events and return values.
   */
  async revertStake(params) {
    const {
      messageHash,
      staker,
    } = params;

    const bounty = await this.gateway.bounty.call();
    const penalty = bounty.muln(1.5);

    await this.baseToken.approve(this.gateway.address, penalty, { from: staker });

    const result = await this.gateway.revertStake.call(
      messageHash,
      { from: staker },
    );

    const tx = await this.gateway.revertStake(
      messageHash,
      { from: staker },
    );

    const events = EventDecoder.getEvents(tx, this.gateway);

    return {
      returned_value: result,
      events,
      block_number: tx.receipt.blockNumber,
    };
  }

  /**
   * Progress revert stake.
   *
   * @param {StakeParams} params Please see above typedef for more details..
   *
   * @returns {Object} Object containing events and return values.
   */
  async progressRevertStake(params) {
    const {
      messageHash,
      blockHeight,
      rlpParentNodes,
      facilitator,
      storageRoot,
    } = params;

    await this.gateway.setStorageRoot(
      blockHeight,
      storageRoot,
      { from: facilitator },
    );

    const result = await this.gateway.progressRevertStake.call(
      messageHash,
      blockHeight,
      rlpParentNodes,
      { from: facilitator },
    );

    const tx = await this.gateway.progressRevertStake(
      messageHash,
      blockHeight,
      rlpParentNodes,
      { from: facilitator },
    );

    const events = EventDecoder.getEvents(tx, this.gateway);

    return {
      returned_value: result,
      events,
      block_number: tx.receipt.blockNumber,
    };
  }

  /**
   * Confirm redeem intent.
   *
   * @param {RedeemParams} params Please see above typedef for more details.
   *
   * @return messageHash_ Message hash.
   */
  async confirmRedeemIntent(params) {
    const {
      redeemer,
      nonce,
      beneficiary,
      amount,
      gasPrice,
      gasLimit,
      blockNumber,
      hashLock,
      storageProof,
      storageRoot,
      facilitator,
    } = params;

    await this.gateway.setStorageRoot(blockNumber, storageRoot);

    const messageHash = await this.gateway.confirmRedeemIntent.call(
      redeemer,
      nonce,
      beneficiary,
      amount,
      gasPrice,
      gasLimit,
      blockNumber,
      hashLock,
      storageProof,
      { from: facilitator },
    );

    const tx = await this.gateway.confirmRedeemIntent(
      redeemer,
      nonce,
      beneficiary,
      amount,
      gasPrice,
      gasLimit,
      blockNumber,
      hashLock,
      storageProof,
      { from: facilitator },
    );

    const events = EventDecoder.getEvents(tx, this.gateway);

    const returnedValue = {};
    returnedValue.messageHash_ = messageHash;

    return {
      returned_value: returnedValue,
      events,
      block_number: tx.receipt.blockNumber,
    };
  }

  /**
   * Progress unstake.
   *
   * @param {RedeemParams} params Please see above typedef for more details.
   *
   * @returns {Object} Object containing events and return values.
   */
  async progressUnstake(params) {
    const {
      messageHash,
      unlockSecret,
      unstakeAmount,
      facilitator,
    } = params;

    const stakeVault = await this.gateway.stakeVault.call();

    await this.token.transfer(
      stakeVault,
      unstakeAmount,
      { from: this.deployer },
    );

    const result = await this.gateway.progressUnstake.call(
      messageHash,
      unlockSecret,
      { from: facilitator },
    );

    const tx = await this.gateway.progressUnstake(
      messageHash,
      unlockSecret,
      { from: facilitator },
    );

    const events = EventDecoder.getEvents(tx, this.gateway);

    return {
      returned_value: result,
      events,
      block_number: tx.receipt.blockNumber,
    };
  }

  /**
   * Confirm revert redeem intent.
   *
   * @param {RedeemParams} params Please see above typedef for more details.
   *
   * @returns {Object} Object containing events and return values.
   */
  async confirmRevertRedeemIntent(params) {
    const {
      messageHash,
      blockNumber,
      rlpParentNodes,
      storageRoot,
      facilitator,
    } = params;

    await this.gateway.setStorageRoot(
      blockNumber,
      storageRoot,
      { from: this.deployer },
    );

    const result = await this.gateway.confirmRevertRedeemIntent.call(
      messageHash,
      blockNumber,
      rlpParentNodes,
      { from: facilitator },
    );

    const tx = await this.gateway.confirmRevertRedeemIntent(
      messageHash,
      blockNumber,
      rlpParentNodes,
      { from: facilitator },
    );

    const events = EventDecoder.getEvents(tx, this.gateway);

    return {
      returned_value: result,
      events,
      block_number: tx.receipt.blockNumber,
    };
  }

  /**
   * Returns Gateway constructor params.
   *
   * @returns {Object} Object containing the constructor params.
   */
  async getConstructorParams() {
    const token = await this.gateway.token.call();
    const baseToken = await this.gateway.baseToken.call();
    const stateRootProvider = await this.gateway.stateRootProvider.call();
    const bounty = await this.gateway.bounty.call();
    const organization = await this.gateway.organization.call();
    const burner = await this.gateway.burner.call();

    return {
      token,
      baseToken,
      stateRootProvider,
      bounty: bounty.toString(10),
      organization,
      burner,
    };
  }

  /**
   * Returns the message box offset
   *
   * @returns {BN} message box offset.
   */
  async getMessageBoxOffset() {
    return await this.gateway.MESSAGE_BOX_OFFSET.call();
  }
}

module.exports = Gateway;
