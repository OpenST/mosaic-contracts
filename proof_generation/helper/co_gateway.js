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

class CoGateway {
  /**
   * @param {Object} registeredContracts All the deployed contracts
   */
  constructor(registeredContracts) {
    this.utilityToken = registeredContracts.mockUtilityToken;
    this.coGateway = registeredContracts.coGateway;
    this.owner = registeredContracts.owner;
    this.address = this.coGateway.address;
  }

  /**
   * Initiates the redeem process.
   *
   * @param {Object} params.
   * @param {BN} params.amount Redeem amount.
   * @param {string} params.beneficiary Beneficiary address.
   * @param {BN} params.gasPrice Gas price that redeemer is ready to pay to get the
   *                             redeem process done.
   * @param {BN} params.gasLimit Gas limit that redeemer is ready to pay.
   * @param {BN} params.nonce Nonce of the redeemer address.
   * @param {string} params.hashLock Hash Lock provided by the facilitator.
   *
   * @returns {Object} Object containing events and return values.
   */
  async redeem(params) {
    const {
      redeemer,
      amount,
      beneficiary,
      gasPrice,
      gasLimit,
      nonce,
      hashLock,
    } = params;
    const bounty = await this.coGateway.bounty.call();

    await this.utilityToken.transfer(
      redeemer,
      amount,
      { from: this.owner },
    );

    await this.utilityToken.approve(
      this.coGateway.address,
      amount,
      { from: redeemer },
    );

    const messageHash = await this.coGateway.redeem.call(
      amount,
      beneficiary,
      gasPrice,
      gasLimit,
      nonce,
      hashLock,
      { from: redeemer, value: bounty },
    );

    const tx = await this.coGateway.redeem(
      amount,
      beneficiary,
      gasPrice,
      gasLimit,
      nonce,
      hashLock,
      { from: redeemer, value: bounty },
    );

    const events = EventDecoder.getEvents(tx, this.coGateway);

    const returnedValue = {};
    returnedValue.messageHash_ = messageHash;

    return {
      returned_value: returnedValue,
      events,
      block_number: tx.receipt.blockNumber,
    };
  }

  /**
   * Progress redeem.
   *
   * @param {Object} params.
   * @param {string} params.messageHash Message hash for redeem message.
   * @param {string} params.unlockSecret Unlock secret for the hashLock provide by the
   *                            facilitator while initiating the redeem.
   * @param {string} params.facilitator Facilitator address for progress redeem.
   *
   * @returns {Object} Object containing events and return values.
   */
  async progressRedeem(params) {
    const {
      messageHash,
      unlockSecret,
      facilitator,
    } = params;

    const result = await this.coGateway.progressRedeem.call(
      messageHash,
      unlockSecret,
      { from: facilitator },
    );

    const tx = await this.coGateway.progressRedeem(
      messageHash,
      unlockSecret,
      { from: facilitator },
    );

    const events = EventDecoder.getEvents(tx, this.coGateway);

    return {
      returned_value: result,
      events,
      block_number: tx.receipt.blockNumber,
    };
  }

  /**
   * Revert redeem.
   *
   * @param {Object} params.
   * @param {string} params.messageHash Message hash.
   * @param {string} params.redeemer Redeemer address.
   *
   * @returns {Object} Object containing events and return values.
   */
  async revertRedeem(params) {
    const {
      messageHash,
      redeemer,
    } = params;

    const bounty = await this.coGateway.bounty.call();
    const penalty = bounty.muln(1.5);

    const result = await this.coGateway.revertRedeem.call(
      messageHash,
      { from: redeemer, value: penalty },
    );

    const tx = await this.coGateway.revertRedeem(
      messageHash,
      { from: redeemer, value: penalty },
    );

    const events = EventDecoder.getEvents(tx, this.coGateway);

    return {
      returned_value: result,
      events,
      block_number: tx.receipt.blockNumber,
    };
  }

  /**
   * Progress revert redeem.
   *
   * @param {Object} params.
   * @param {string} params.messageHash Message hash.
   * @param {BN} params.blockHeight Block number for which the proof is valid.
   * @param {string} params.rlpParentNodes RLP encoded proof data.
   * @param {string} params.facilitator Facilitator address.
   * @param {string} params.storageRoot Storage root for proof verification.
   *
   * @returns {Object} Object containing events and return values.
   */
  async progressRevertRedeem(params) {
    const {
      messageHash,
      blockHeight,
      rlpParentNodes,
      facilitator,
      storageRoot,
    } = params;

    await this.coGateway.setStorageRoot(blockHeight, storageRoot);

    const result = await this.coGateway.progressRevertRedeem.call(
      messageHash,
      blockHeight,
      rlpParentNodes,
      { from: facilitator },
    );

    const tx = await this.coGateway.progressRevertRedeem(
      messageHash,
      blockHeight,
      rlpParentNodes,
      { from: facilitator },
    );

    const events = EventDecoder.getEvents(tx, this.coGateway);

    return {
      returned_value: result,
      events,
      block_number: tx.receipt.blockNumber,
    };
  }

  /**
   * Confirm stake intent.
   *
   * @param {object} params.
   * @param {string} options.staker Staker address.
   * @param {string} options.nonce Staker nonce.
   * @param {string} options.beneficiary Beneficiary address.
   * @param {string} options.amount Stake amount.
   * @param {string} options.gasPrice Gas price.
   * @param {string} options.gasLimit Gas limit.
   * @param {string} options.hashLock Hash lock
   * @param {string} options.blockHeight Block height.
   * @param {string} options.rlpParentNodes RLP encoded proof data.
   * @param {string} options.unlockSecret Unlock secret.
   * @param {string} options.facilitator Facilitator address.
   * @param {string} options.storageRoot Storage root for proof.
   *
   * @returns {Object} Object containing events and return values.
   */
  async confirmStakeIntent(params) {
    const {
      staker,
      nonce,
      beneficiary,
      amount,
      gasPrice,
      gasLimit,
      hashLock,
      blockHeight,
      rlpParentNodes,
      facilitator,
      storageRoot,
    } = params;

    await this.coGateway.setStorageRoot(
      blockHeight,
      storageRoot,
      { from: this.owner },
    );

    const messageHash = await this.coGateway.confirmStakeIntent.call(
      staker,
      nonce,
      beneficiary,
      amount,
      gasPrice,
      gasLimit,
      hashLock,
      blockHeight,
      rlpParentNodes,
      { from: facilitator },
    );

    const tx = await this.coGateway.confirmStakeIntent(
      staker,
      nonce,
      beneficiary,
      amount,
      gasPrice,
      gasLimit,
      hashLock,
      blockHeight,
      rlpParentNodes,
      { from: facilitator },
    );

    const events = EventDecoder.getEvents(tx, this.coGateway);

    const returnedValue = {};
    returnedValue.messageHash_ = messageHash;

    return {
      returned_value: returnedValue,
      events,
      block_number: tx.receipt.blockNumber,
    };
  }

  /**
   * Progress mint.
   *
   * @param {object} params.
   * @param {string} options.messageHash Message hash for progress mint.
   * @param {string} options.unlockSecret Unlock secret for progress mint.
   * @param {string} options.facilitator Facilitator address for progress mint.
   *
   * @returns {Object} Object containing events and return values.
   */
  async progressMint(params) {
    const {
      messageHash,
      unlockSecret,
      facilitator,
    } = params;

    const result = await this.coGateway.progressMint.call(
      messageHash,
      unlockSecret,
      { from: facilitator },
    );

    const tx = await this.coGateway.progressMint(
      messageHash,
      unlockSecret,
      { from: facilitator },
    );

    const events = EventDecoder.getEvents(tx, this.coGateway);

    return {
      returned_value: result,
      events,
      block_number: tx.receipt.blockNumber,
    };
  }

  /**
   * Confirm revert stake intent.
   *
   * @param {object} params.
   * @param {string} options.messageHash Message hash for confirm revert
   *                                     stake intent.
   * @param {string} options.blockHeight Block height for which the proof
   *                                     will be verified.
   * @param {string} options.rlpParentNodes RLP encoded proof data.
   * @param {string} options.facilitator Facilitator address for progress mint.
   * @param {string} options.storageRoot Storage root for proof.
   *
   * @returns {Object} Object containing events and return values.
   */
  async confirmRevertStakeIntent(params) {
    const {
      messageHash,
      blockHeight,
      rlpParentNodes,
      facilitator,
      storageRoot,
    } = params;

    await this.coGateway.setStorageRoot(
      blockHeight,
      storageRoot,
      { from: this.owner },
    );

    const result = await this.coGateway.confirmRevertStakeIntent.call(
      messageHash,
      blockHeight,
      rlpParentNodes,
      { from: facilitator },
    );

    const tx = await this.coGateway.confirmRevertStakeIntent(
      messageHash,
      blockHeight,
      rlpParentNodes,
      { from: facilitator },
    );

    const events = EventDecoder.getEvents(tx, this.coGateway);

    return {
      returned_value: result,
      events,
      block_number: tx.receipt.blockNumber,
    };
  }

  /**
   * Returns CoGateway constructor params.
   *
   * @returns {Object} Object containing the constructor params.
   */
  async getConstructorParams() {
    const valueToken = await this.coGateway.valueToken.call();
    const utilityToken = await this.coGateway.utilityToken.call();
    const stateRootProvider = await this.coGateway.stateRootProvider.call();
    const bounty = await this.coGateway.bounty.call();
    const organization = await this.coGateway.organization.call();
    const gateway = await this.coGateway.remoteGateway.call();
    const burner = await this.coGateway.burner.call();

    return {
      valueToken,
      utilityToken,
      stateRootProvider,
      bounty: bounty.toString(10),
      organization,
      gateway,
      burner,
    };
  }
}

module.exports = CoGateway;
