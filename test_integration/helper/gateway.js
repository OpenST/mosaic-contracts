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
   * @param {Object} params.
   * @param {BN} params.amount Stake amount that will be transferred from
   *                            the staker account.
   * @param {string} params.beneficiary Beneficiary address where the utility
   *                                     tokens will be minted.
   * @param {BN} params.gasPrice Gas price that staker is ready to pay to get
   *                              the stake and mint process done.
   * @param {BN} params.gasLimit Gas limit that staker is ready to pay.
   * @param {BN} params.nonce Nonce of the staker address.
   * @param {string} params.hashLock Hash Lock provided by the facilitator.
   * @param {string} params.staker Staker address.
   *
   * @returns {Object} Object containing events and return values.
   */
  async stake(params) {

    let amount = params.amount;
    let beneficiary = params.beneficiary;
    let gasPrice = params.gasPrice;
    let gasLimit = params.gasLimit;
    let nonce = params.nonce;
    let hashLock = params.hashLock;
    let staker = params.staker;

    await this.token.transfer(
      staker,
      amount,
      { from: this.deployer },
    );

    let bounty = await this.gateway.bounty.call();
    await this.baseToken.transfer(
      staker,
      bounty,
      { from: this.deployer },
    );

    await this.token.approve(this.gateway.address, amount, { from: staker });
    await this.baseToken.approve(this.gateway.address, bounty, {from: staker });

    let messageHash = await this.gateway.stake.call(
      amount,
      beneficiary,
      gasPrice,
      gasLimit,
      nonce,
      hashLock,
      { from: staker },
    );

    let tx = await this.gateway.stake(
      amount,
      beneficiary,
      gasPrice,
      gasLimit,
      nonce,
      hashLock,
      { from: staker },
    );

    let events = EventDecoder.getEvents(tx, this.gateway);

    let returnedValue = {};
    returnedValue.messageHash_ = messageHash;

    return {
      returned_value: returnedValue,
      events: events,
      block_number: tx.receipt.blockNumber,
    };

  }

  /**
   * Progresses stake.
   *
   * @param {object} params.
   * @param {string} params.messageHash Message hash of stake request.
   * @param {string} params.unlockSecret Unlock secret for the hashLock
   *                                      provided by the staker while
   *                                      initiating the stake.
   * @param {string} params.facilitator Facilitator address for progress stake.
   *
   * @returns {Object} Object containing events and return values.
   */
  async progressStake(params) {

    let messageHash = params.messageHash;
    let unlockSecret = params.unlockSecret;
    let facilitator = params.facilitator;

    let result = await this.gateway.progressStake.call(
      messageHash,
      unlockSecret,
      { from: facilitator },
    );

    let tx = await this.gateway.progressStake(
      messageHash,
      unlockSecret,
      { from: facilitator },
    );

    let events = EventDecoder.getEvents(tx, this.gateway);

    // let returnedValue = {};
    // returnedValue.staker = result.staker_;
    // returnedValue.stake_amount_ = result.stakeAmount_.toString(10);

    return {
      returned_value: result,
      events: events,
      block_number: tx.receipt.blockNumber,
    };

  }

  /**
   * Revert stake.
   *
   * @param {object} params.
   * @param {string} params.messageHash Message hash of revert stake request.
   * @param {string} params.staker Staker address for revert stake.
   *
   * @returns {Object} Object containing events and return values.
   */
  async revertStake(params) {

    let messageHash = params.messageHash;
    let staker = params.staker;

    let bounty = await this.gateway.bounty.call();
    let penalty = bounty.muln(1.5);

    await this.baseToken.approve(this.gateway.address, penalty, {from: staker });

    let result = await this.gateway.revertStake.call(
      messageHash,
      { from: staker },
    );

    let tx = await this.gateway.revertStake(
      messageHash,
      { from: staker },
    );

    let events = EventDecoder.getEvents(tx, this.gateway);

    // let returnedValue = {};
    // returnedValue.staker = result.staker_;
    // returnedValue.amount = result.amount_.toString(10);
    // returnedValue.staker_nonce = result.stakerNonce_.toString(10);

    return {
      returned_value: result,
      events: events,
      block_number: tx.receipt.blockNumber,
    };

  }

  /**
   * Progress revert stake.
   *
   * @param {object} params.
   * @param {string} params.messageHash Message hash for confirm revert
   *                                     stake intent.
   * @param {BN} params.blockHeight Block height for which the proof
   *                                     will be verified.
   * @param {string} params.rlpParentNodes RLP encoded proof data.
   * @param {string} params.facilitator Facilitator address for progress mint.
   * @param {string} options.storageRoot Storage root for proof.
   *
   * @returns {Object} Object containing events and return values.
   */
  async progressRevertStake(params) {

    let messageHash = params.messageHash;
    let blockHeight = params.blockHeight;
    let rlpParentNodes = params.rlpParentNodes;
    let facilitator = params.facilitator;
    let storageRoot = params.storageRoot;

    await this.gateway.setStorageRoot(
      blockHeight,
      storageRoot,
      { from: facilitator },
    );

    let result = await this.gateway.progressRevertStake.call(
      messageHash,
      blockHeight,
      rlpParentNodes,
      { from: facilitator },
    );

    let tx = await this.gateway.progressRevertStake(
      messageHash,
      blockHeight,
      rlpParentNodes,
      { from: facilitator },
    );

    let events = EventDecoder.getEvents(tx, this.gateway);

    // let returnedValue = {};
    // returnedValue.staker = result.staker_;
    // returnedValue.staker_nonce = result.stakerNonce_.toString(10);
    // returnedValue.amount = result.amount_.toString(10);

    return {
      returned_value: result,
      events: events,
      block_number: tx.receipt.blockNumber,
    };

  }

  /**
   * Confirm redeem intent.
   *
   * @param {object} params.
   * @param {string} params.redeemer Redeemer address.
   * @param {BN} params.redeemerNonce Redeemer nonce.
   * @param {string} params.beneficiary Address where the redeemed tokens
   *                                    will be transferred.
   * @param {BN} params.amount Redeem amount.
   * @param {BN} params.gasPrice Gas price that redeemer is ready to pay to
   *                             get the redeem and unstake process done.
   * @param {BN} params.gasLimit Gas limit that redeemer is ready to pay.
   * @param {BN} params.blockHeight Block number for which the proof is valid.
   * @param {string} params.hashLock Hash lock.
   * @param {string} params.rlpParentNodes RLP encoded proof data.
   * @param {string} params.storageRoot Storage root for proof.
   * @param {string} params.facilitator Facilitator address for progress mint.
   *
   * @return messageHash_ Message hash.
   */
  async confirmRedeemIntent(params) {

    let redeemer = params.redeemer;
    let nonce = params.nonce;
    let beneficiary = params.beneficiary;
    let amount = params.amount;
    let gasPrice = params.gasPrice;
    let gasLimit = params.gasLimit;
    let blockNumber = params.blockNumber;
    let hashLock = params.hashLock;
    let storageProof = params.storageProof;
    let storageRoot = params.storageRoot;
    let facilitator = params.facilitator;

    await this.gateway.setStorageRoot(blockNumber, storageRoot);

    let messageHash = await this.gateway.confirmRedeemIntent.call(
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

    let tx = await this.gateway.confirmRedeemIntent(
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

    let events = EventDecoder.getEvents(tx, this.gateway);

    let returnedValue = {};
    returnedValue.messageHash_ = messageHash;

    return {
      returned_value: returnedValue,
      events: events,
      block_number: tx.receipt.blockNumber,
    };
  }

  /**
   * Progress unstake.
   *
   * @param {object} params.
   * @param {string} params.messageHash Message hash for progress unstake.
   * @param {string} params.unlockSecret Unlock secret for progress unstake.
   * @param {BN} params.unstakeAmount Unstake amount.
   * @param {string} params.facilitator Facilitator address.
   *
   * @returns {Object} Object containing events and return values.
   */
  async progressUnstake(params) {

    let messageHash = params.messageHash;
    let unlockSecret = params.unlockSecret;
    let unstakeAmount = params.unstakeAmount;
    let facilitator = params.facilitator;

    let stakeVault = await this.gateway.stakeVault.call();

    await this.token.transfer(
      stakeVault,
      unstakeAmount,
      {from: this.deployer},
    );

    let result = await this.gateway.progressUnstake.call(
      messageHash,
      unlockSecret,
      {from: facilitator},
    );

    let tx = await this.gateway.progressUnstake(
      messageHash,
      unlockSecret,
      {from: facilitator},
    );

    let events = EventDecoder.getEvents(tx, this.gateway);

    // let returnedValue = {};
    // returnedValue.redeemAmount = result.redeemAmount_.toString(10);
    // returnedValue.unstakeAmount = result.unstakeAmount_.toString(10);
    // returnedValue.rewardAmount = result.rewardAmount_.toString(10);

    return {
      returned_value: result,
      events: events,
      block_number: tx.receipt.blockNumber,
    };
  }

  /**
   * Confirm revert redeem intent.
   *
   * @param {object} params
   * @param {string} params.messageHash Message hash.
   * @param {BN} params.blockHeight Block number for which the proof is valid.
   * @param {string} params.rlpParentNodes RLP encoded proof data.
   * @param {string} params.storageRoot Storage root for proof.
   * @param {string} params.facilitator Facilitator address.
   *
   * @returns {Object} Object containing events and return values.
   */
  async confirmRevertRedeemIntent(params) {

    let messageHash = params.messageHash;
    let blockNumber = params.blockNumber;
    let rlpParentNodes = params.rlpParentNodes;
    let storageRoot = params.storageRoot;
    let facilitator = params.facilitator;

    await this.gateway.setStorageRoot(
      blockNumber,
      storageRoot,
      { from: this.deployer },
    );

    let result =  await this.gateway.confirmRevertRedeemIntent.call(
      messageHash,
      blockNumber,
      rlpParentNodes,
      {from: facilitator},
    );

    let tx = await this.gateway.confirmRevertRedeemIntent(
      messageHash,
      blockNumber,
      rlpParentNodes,
      {from: facilitator},
    );

    let events = EventDecoder.getEvents(tx, this.gateway);

    // let returnedValue = {};
    // returnedValue.redeemer = result.redeemer_;
    // returnedValue.redeemerNonce = result.redeemerNonce_.toString(10);
    // returnedValue.amount = result.amount_.toString(10);

    return {
      returned_value: result,
      events: events,
      block_number: tx.receipt.blockNumber,
    };
  }

  /**
   * Returns Gateway constructor params.
   *
   * @returns {Object} Object containing the constructor params.
   */
  async getConstructorParams() {

    let token = await this.gateway.token.call();
    let baseToken = await this.gateway.baseToken.call();
    let stateRootProvider = await this.gateway.stateRootProvider.call();
    let bounty = await this.gateway.bounty.call();
    let organization = await this.gateway.organization.call();
    let burner = await this.gateway.burner.call();

    return {
      token: token,
      baseToken: baseToken,
      stateRootProvider: stateRootProvider,
      bounty: bounty.toString(10),
      organization: organization,
      burner: burner,
    };
  }
}

module.exports = Gateway;
