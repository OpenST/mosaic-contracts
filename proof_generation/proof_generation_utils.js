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
// http://www.simpletoken.org/
//

/* eslint-disable no-param-reassign */

const TestLibUtils = require('../test/test_lib/utils.js');
const Gateway = require('./helper/gateway');
const CoGateway = require('./helper/co_gateway');

/**
 * Object contains input parameter for confirmStakingIntent.
 *
 * @typedef {Object} stakeParams
 * @property {string} params.staker Staker address.
 * @property {string} params.nonce Staker nonce.
 * @property {string} params.beneficiary Beneficiary address.
 * @property {string} params.amount Stake amount.
 * @property {string} params.gasPrice Gas price.
 * @property {string} params.gasLimit Gas limit.
 * @property {string} params.hashLock Hash lock
 * @property {string} params.blockHeight Block height.
 * @property {string} params.rlpParentNodes RLP encoded proof data.
 * @property {string} params.unlockSecret Unlock secret.
 * @property {string} params.facilitator Facilitator address.
 * @property {string} params.storageRoot Storage root for proof.
 */

/**
 * Object contains input parameter needed for confirmRedeemIntent.
 *
 * @typedef {object} redeemParams
 * @property {string} params.redeemer Redeemer address.
 * @property {string} params.redeemerNonce Redeemer nonce.
 * @property {string} params.beneficiary Address where the redeemed tokens
 *                                    will be transferred.
 * @property {string} params.amount Redeem amount.
 * @property {string} params.gasPrice Gas price that redeemer is ready to pay to
 *                             get the redeem and unstake process done.
 * @property {string} params.gasLimit Gas limit that redeemer is ready to pay.
 * @property {string} params.blockHeight Block number for which the proof is valid.
 * @property {string} params.hashLock Hash lock.
 * @property {string} params.rlpParentNodes RLP encoded proof data.
 * @property {string} params.storageRoot Storage root for proof.
 * @property {string} params.facilitator Facilitator address for progress mint.
 */

/**
 * The class encapsulates data collection logic for different flows of stake & mint
 * and redeem & unstake.
 */
class ProofGenerationUtils {
  /**
   * Constructor
   *
   * @param registeredContracts {object} Deployed contracts.
   * @param stakeParams {object} Contains data needed for staking.
   * @param redeemParams {object} Contains data needed for redeeming.
   * @param proofUtils {object} Proof utils object.
   */
  constructor(registeredContracts, stakeParams, redeemParams, proofUtils) {
    this.registeredContracts = registeredContracts;
    this.gateway = new Gateway(registeredContracts);
    this.coGateway = new CoGateway(registeredContracts);
    this.stakeParams = stakeParams;
    this.redeemParams = redeemParams;
    this.proofUtils = proofUtils;
    this.resetProofData();
  }

  /**
   * Get address of all deployed contracts.
   *
   * @returns {Object} An object containing the deployed contract address.
   */
  getContractAddresses() {
    const addresses = {};
    Object.keys(this.registeredContracts).map((key) => {
      if (this.registeredContracts[key].address) {
        addresses[key] = this.registeredContracts[key].address;
      }
    });
    return addresses;
  }

  /**
   * Resets proof data variable.
   */
  resetProofData() {
    this.proofData = {};
  }

  /**
   * Initialize proof data with default data.
   *
   * @returns {Promise<void>}
   */
  async initializeProofData() {
    this.proofData.contracts = this.getContractAddresses(this.registeredContracts);
    this.proofData.gateway = {};
    this.proofData.gateway.constructor = await this.gateway.getConstructorParams();
    this.proofData.co_gateway = {};
    this.proofData.co_gateway.constructor = await this.coGateway.getConstructorParams();
  }

  /**
   * Populates proof data after calling stake.
   *
   * @param proofData {object} Contains proof data.
   *
   * @returns {Promise<{stakeProofData, stakeResult: void}>}
   */
  async populateStakeProofData(proofData) {
    const generatedHashLock = TestLibUtils.generateHashLock();
    this.stakeParams.hashLock = generatedHashLock.l;
    this.stakeParams.unlockSecret = generatedHashLock.s;

    const stakeResult = await this.gateway.stake(this.stakeParams);
    const stakeProofData = await this.proofUtils.getOutboxProof(
      this.gateway.address,
      [stakeResult.returned_value.messageHash_],
    );
    proofData.gateway.stake = {};
    proofData.gateway.stake.params = this.stakeParams;
    proofData.gateway.stake.return_value = stakeResult;
    proofData.gateway.stake.proof_data = stakeProofData;
    return {
      stakeProofData,
      stakeResult,
    };
  }

  /**
   * Populates proof data after calling confirmStakingIntent.
   *
   * @param stakeProofData {object} Contains proof data after calling stake.
   * @param proofData {object} Contains proof data.
   *
   * @returns {Promise<{confirmStakeIntentResult}>}
   */
  async populateConfirmStakeIntentProofData(
    stakeProofData,
    proofData,
  ) {
    const confirmStakeIntentParams = Object.assign({}, this.stakeParams);
    confirmStakeIntentParams.blockHeight = stakeProofData.block_number;
    confirmStakeIntentParams.rlpParentNodes = stakeProofData.storageProof[0].serializedProof;
    confirmStakeIntentParams.facilitator = this.stakeParams.staker;
    confirmStakeIntentParams.storageRoot = stakeProofData.storageHash;

    // confirmStakeIntent also sets/anchors storage root for a block number.
    const confirmStakeIntentResult = await this.coGateway.confirmStakeIntent(
      confirmStakeIntentParams,
    );
    const confirmStakeIntentProofData = await this.proofUtils.getInboxProof(
      this.coGateway.address,
      [confirmStakeIntentResult.returned_value.messageHash_],
    );
    proofData.co_gateway.confirm_stake_intent = {};
    proofData.co_gateway.confirm_stake_intent.params = confirmStakeIntentParams;
    proofData.co_gateway.confirm_stake_intent.return_value = confirmStakeIntentResult;
    proofData.co_gateway.confirm_stake_intent.proof_data = confirmStakeIntentProofData;
    return {
      confirmStakeIntentResult,
    };
  }

  /**
   * Populates proof data after calling progressStake.
   *
   * @param stakeResult {object} Result after calling staking.
   * @param confirmStakeIntentResult {object} Result after calling confirmStakeIntent
   * @param proofData Contains proof data.
   *
   * @returns {Promise<{progressStakeParams}>}
   */
  async populateProgressStakeProofData(
    stakeResult,
    confirmStakeIntentResult,
    proofData,
  ) {
    const progressStakeParams = {};
    progressStakeParams.messageHash = stakeResult.returned_value.messageHash_;
    progressStakeParams.unlockSecret = this.stakeParams.unlockSecret;
    progressStakeParams.facilitator = this.stakeParams.staker;

    const progressStakeResult = await this.gateway.progressStake(progressStakeParams);
    const progressStakeProofData = await this.proofUtils.getOutboxProof(
      this.gateway.address,
      [confirmStakeIntentResult.returned_value.messageHash_],
    );
    proofData.gateway.progress_stake = {};
    proofData.gateway.progress_stake.params = progressStakeParams;
    proofData.gateway.progress_stake.return_value = progressStakeResult;
    proofData.gateway.progress_stake.proof_data = progressStakeProofData;

    return {
      progressStakeParams,
    };
  }

  /**
   * Populates proof data after calling progressMint.
   *
   * @param progressStakeParams {object} Contains data needed for progressStake.
   * @param confirmStakeIntentResult {object} Result after calling confirmStakeIntent.
   * @param proofData {object} Contains proof data.
   *
   * @returns {Promise<void>}
   */
  async populateProgressMintProofData(
    progressStakeParams,
    confirmStakeIntentResult,
    proofData,
  ) {
    const progressMintParams = Object.assign({}, progressStakeParams);
    const progressMintResult = await this.coGateway.progressMint(progressMintParams);
    const progressMintProofData = await this.proofUtils.getInboxProof(
      this.coGateway.address,
      [confirmStakeIntentResult.returned_value.messageHash_],
    );

    proofData.co_gateway.progress_mint = {};
    proofData.co_gateway.progress_mint.params = progressMintParams;
    proofData.co_gateway.progress_mint.return_value = progressMintResult;
    proofData.co_gateway.progress_mint.proof_data = progressMintProofData;
  }

  /**
   * Populates proof data after calling revert stake.
   *
   * @param stakeResult {object} Result after calling stake.
   * @param confirmStakeIntentResult {object} Result after calling confirmStakeIntent.
   * @param proofData {object} Contains proof data.
   *
   * @returns {Promise<{revertStakeProofData, revertStakeParams}>}
   */
  async populateRevertStakeProofData(
    stakeResult,
    confirmStakeIntentResult,
    proofData,
  ) {
    const revertStakeParams = {};
    revertStakeParams.messageHash = confirmStakeIntentResult.returned_value.messageHash_;
    revertStakeParams.staker = this.stakeParams.staker;

    const revertStakeResult = await this.gateway.revertStake(revertStakeParams);

    const revertStakeProofData = await this.proofUtils.getOutboxProof(
      this.gateway.address,
      [stakeResult.returned_value.messageHash_],
    );
    proofData.gateway.revert_stake = {};
    proofData.gateway.revert_stake.params = revertStakeParams;
    proofData.gateway.revert_stake.return_value = revertStakeResult;
    proofData.gateway.revert_stake.proof_data = revertStakeProofData;

    return {
      revertStakeProofData,
      revertStakeParams,
    };
  }

  /**
   * Populates proof data after calling confirm revert stake.
   *
   * @param revertStakeParams {object} Contains revert stake parameters.
   * @param revertStakeProofData {object} Contains revert stake proof data.
   * @param proofData {object} Contains proof data.
   *
   * @returns {Promise<{confirmRevertStakeProofData}>}
   */
  async populateConfirmRevertStakeProofData(
    revertStakeParams,
    revertStakeProofData,
    proofData,
  ) {
    const confirmRevertStakeParams = {};
    confirmRevertStakeParams.messageHash = revertStakeParams.messageHash;
    confirmRevertStakeParams.blockHeight = revertStakeProofData.block_number;
    confirmRevertStakeParams.rlpParentNodes = revertStakeProofData
      .storageProof[0].serializedProof;
    confirmRevertStakeParams.facilitator = this.stakeParams.staker;
    confirmRevertStakeParams.storageRoot = revertStakeProofData.storageHash;

    const confirmRevertStakeResult = await this.coGateway.confirmRevertStakeIntent(
      confirmRevertStakeParams,
    );

    const confirmRevertStakeProofData = await this.proofUtils.getInboxProof(
      this.coGateway.address,
      [confirmRevertStakeParams.messageHash],
    );

    proofData.co_gateway.confirm_revert_stake_intent = {};
    proofData.co_gateway.confirm_revert_stake_intent.params = confirmRevertStakeParams;
    proofData.co_gateway.confirm_revert_stake_intent.return_value = confirmRevertStakeResult;
    proofData.co_gateway.confirm_revert_stake_intent.proof_data = confirmRevertStakeProofData;

    return {
      confirmRevertStakeProofData,
    };
  }

  /**
   * Populates proof data after calling progress revert stake.
   *
   * @param revertStakeParams {object} Contains revert stake data.
   * @param confirmRevertStakeProofData {object} Contains confirm revert stake proof data.
   * @param proofData {object} Contains proof data.
   *
   * @returns {Promise<void>}
   */
  async populateProgressRevertStakeProofData(
    revertStakeParams,
    confirmRevertStakeProofData,
    proofData,
  ) {
    const progressRevertStakeParams = {};
    progressRevertStakeParams.messageHash = revertStakeParams.messageHash;
    progressRevertStakeParams.blockHeight = confirmRevertStakeProofData.block_number;
    progressRevertStakeParams.rlpParentNodes = confirmRevertStakeProofData
      .storageProof[0].serializedProof;
    progressRevertStakeParams.facilitator = this.stakeParams.staker;
    progressRevertStakeParams.storageRoot = confirmRevertStakeProofData.storageHash;

    const progressRevertStakeResult = await this.gateway.progressRevertStake(
      progressRevertStakeParams,
    );

    const progressRevertStakeProofData = await this.proofUtils.getOutboxProof(
      this.gateway.address,
      [progressRevertStakeParams.messageHash],
    );
    proofData.gateway.progress_revert_stake_intent = {};
    proofData.gateway.progress_revert_stake_intent.params = progressRevertStakeParams;
    proofData.gateway.progress_revert_stake_intent.return_value = progressRevertStakeResult;
    proofData.gateway.progress_revert_stake_intent.proof_data = progressRevertStakeProofData;
  }

  /**
   * Populates proof data after calling redeem.
   *
   * @param proofData {object} Contains proof data.
   *
   * @returns {Promise<{redeemProofData, redeemResult}>}
   */
  async populateRedeemProofData(
    proofData,
  ) {
    const generatedHashLock = TestLibUtils.generateHashLock();
    this.redeemParams.hashLock = generatedHashLock.l;
    this.redeemParams.unlockSecret = generatedHashLock.s;
    const redeemResult = await this.coGateway.redeem(this.redeemParams);
    const redeemProofData = await this.proofUtils.getOutboxProof(
      this.coGateway.address,
      [redeemResult.returned_value.messageHash_],
    );
    proofData.co_gateway.redeem = {};
    proofData.co_gateway.redeem.params = this.redeemParams;
    proofData.co_gateway.redeem.return_value = redeemResult;
    proofData.co_gateway.redeem.proof_data = redeemProofData;

    return {
      redeemProofData,
      redeemResult,
    };
  }

  /**
   * Contains proof data after calling confirm redeem intent.
   *
   * @param redeemProofData {object} Contains redeem proof data.
   * @param proofData {object} Contains proof data.
   *
   * @returns {Promise<{confirmRedeemIntentResult}>}
   */
  async populateConfirmRedeemIntentProofData(
    redeemProofData,
    proofData,
  ) {
    const confirmRedeemIntentParams = Object.assign({}, this.redeemParams);
    confirmRedeemIntentParams.blockNumber = redeemProofData.block_number;
    confirmRedeemIntentParams.storageProof = redeemProofData.storageProof[0].serializedProof;
    confirmRedeemIntentParams.facilitator = redeemProofData.staker;
    confirmRedeemIntentParams.storageRoot = redeemProofData.storageHash;
    confirmRedeemIntentParams.facilitator = this.redeemParams.redeemer;

    // confirmRedeemIntent also anchors/sets storage root.
    const confirmRedeemIntentResult = await this.gateway.confirmRedeemIntent(
      confirmRedeemIntentParams,
    );
    const confirmRedeemIntentProofData = await this.proofUtils.getInboxProof(
      this.gateway.address,
      [confirmRedeemIntentResult.returned_value.messageHash_],
    );
    proofData.gateway.confirm_redeem_intent = {};
    proofData.gateway.confirm_redeem_intent.params = confirmRedeemIntentParams;
    proofData.gateway.confirm_redeem_intent.return_value = confirmRedeemIntentResult;
    proofData.gateway.confirm_redeem_intent.proof_data = confirmRedeemIntentProofData;

    return {
      confirmRedeemIntentResult,
    };
  }

  /**
   * Populates proof data after calling progress redeem.
   *
   * @param confirmRedeemIntentResult {object} Result after calling confirm redeem intent.
   * @param proofData {object} Contains proof data.
   *
   * @returns {Promise<{progressRedeemParams}>}
   */
  async populateProgressRedeemProofData(
    confirmRedeemIntentResult,
    proofData,
  ) {
    const progressRedeemParams = {};
    progressRedeemParams.messageHash = confirmRedeemIntentResult.returned_value.messageHash_;
    progressRedeemParams.unlockSecret = this.redeemParams.unlockSecret;
    progressRedeemParams.facilitator = this.redeemParams.redeemer;
    const progressRedeemResult = await this.coGateway.progressRedeem(
      progressRedeemParams,
    );

    const progressRedeemProofData = await this.proofUtils.getOutboxProof(
      this.coGateway.address,
      [progressRedeemParams.messageHash],
    );
    proofData.co_gateway.progress_redeem = {};
    proofData.co_gateway.progress_redeem.params = progressRedeemParams;
    proofData.co_gateway.progress_redeem.return_value = progressRedeemResult;
    proofData.co_gateway.progress_redeem.proof_data = progressRedeemProofData;

    return {
      progressRedeemParams,
    };
  }

  /**
   * Populates proof data after calling progress unstake.
   *
   * @param progressRedeemParams {object} Contains data needed for progress redeem.
   * @param proofData {object} Contains proof data.
   *
   * @returns {Promise<void>}
   */
  async populateProgressUnstakeProofData(
    progressRedeemParams,
    proofData,
  ) {
    const progressUnstakeParams = Object.assign({}, progressRedeemParams);
    progressUnstakeParams.unstakeAmount = this.redeemParams.amount;
    const progressUnstakeResult = await this.gateway.progressUnstake(
      progressUnstakeParams,
    );
    const progressUnstakeProofData = await this.proofUtils.getInboxProof(
      this.gateway.address,
      [progressUnstakeParams.messageHash],
    );
    proofData.gateway.progress_unstake = {};
    proofData.gateway.progress_unstake.params = progressUnstakeParams;
    proofData.gateway.progress_unstake.return_value = progressUnstakeResult;
    proofData.gateway.progress_unstake.proof_data = progressUnstakeProofData;
  }

  /**
   * Populates proof data after calling revert redeem.
   *
   * @param redeemResult {object} Result after calling redeem.
   * @param proofData {object} Contains proof data.
   *
   * @returns {Promise<{revertRedeemProofData, revertRedeemResult, revertRedeemParams}>}
   */
  async populateRevertRedeemProofData(
    redeemResult,
    proofData,
  ) {
    const revertRedeemParams = {};
    revertRedeemParams.messageHash = redeemResult.returned_value.messageHash_;
    revertRedeemParams.redeemer = this.redeemParams.redeemer;
    const revertRedeemResult = await this.coGateway.revertRedeem(
      revertRedeemParams,
    );
    const revertRedeemProofData = await this.proofUtils.getOutboxProof(
      this.coGateway.address,
      [revertRedeemParams.messageHash],
    );
    proofData.co_gateway.revert_redeem = {};
    proofData.co_gateway.revert_redeem.params = revertRedeemParams;
    proofData.co_gateway.revert_redeem.return_value = revertRedeemResult;
    proofData.co_gateway.revert_redeem.proof_data = revertRedeemProofData;

    return {
      revertRedeemProofData,
      revertRedeemResult,
      revertRedeemParams,
    };
  }

  /**
   * Populates proof data after calling confirm revert redeem.
   *
   * @param revertRedeemParams {object} Contains data needed for calling revert redeem.
   * @param revertRedeemProofData {object} Contains revert redeem proof data.
   * @param proofData {object} Contains proof data.
   *
   * @returns {Promise<{confirmRevertRedeemProofData, confirmRevertRedeemIntentParams}>}
   */
  async populateConfirmRevertRedeemProofData(
    revertRedeemParams,
    revertRedeemProofData,
    proofData,
  ) {
    const confirmRevertRedeemIntentParams = {};
    confirmRevertRedeemIntentParams.messageHash = revertRedeemParams.messageHash;
    confirmRevertRedeemIntentParams.blockNumber = revertRedeemProofData.block_number;
    confirmRevertRedeemIntentParams.rlpParentNodes = revertRedeemProofData
      .storageProof[0].serializedProof;
    confirmRevertRedeemIntentParams.facilitator = this.redeemParams.redeemer;
    confirmRevertRedeemIntentParams.storageRoot = revertRedeemProofData.storageHash;

    const confirmRevertRedeemResult = await this.gateway.confirmRevertRedeemIntent(
      confirmRevertRedeemIntentParams,
    );
    const confirmRevertRedeemProofData = await this.proofUtils.getInboxProof(
      this.gateway.address,
      [confirmRevertRedeemIntentParams.messageHash],
    );
    proofData.gateway.confirm_revert_redeem_intent = {};
    proofData.gateway.confirm_revert_redeem_intent.params = confirmRevertRedeemIntentParams;
    proofData.gateway.confirm_revert_redeem_intent.return_value = confirmRevertRedeemResult;
    proofData.gateway.confirm_revert_redeem_intent.proof_data = confirmRevertRedeemProofData;

    return {
      confirmRevertRedeemProofData,
      confirmRevertRedeemIntentParams,
    };
  }

  /**
   * Populates proof data after calling progress revert redeem.
   *
   * @param revertRedeemParams {object} Contains data needed for calling revert redeem.
   * @param confirmRevertRedeemProofData {object} Contains revert redeem proof data.
   * @param proofData {object} Contains proof data.
   *
   * @returns {Promise<void>}
   */
  async populateProgressRevertRedeemProofData(
    revertRedeemParams,
    confirmRevertRedeemProofData,
    proofData,
  ) {
    const progressRevertRedeemParams = {};
    progressRevertRedeemParams.messageHash = revertRedeemParams.messageHash;
    progressRevertRedeemParams.blockHeight = confirmRevertRedeemProofData.block_number;
    progressRevertRedeemParams.rlpParentNodes = confirmRevertRedeemProofData
      .storageProof[0].serializedProof;
    progressRevertRedeemParams.facilitator = this.redeemParams.redeemer;
    progressRevertRedeemParams.storageRoot = confirmRevertRedeemProofData.storageHash;

    const progressRevertRedeemResult = await this.coGateway.progressRevertRedeem(
      progressRevertRedeemParams,
    );

    const progressRevertRedeemProofData = await this.proofUtils.getOutboxProof(
      this.coGateway.address,
      [progressRevertRedeemParams.messageHash],
    );
    proofData.co_gateway.progress_revert_redeem = {};
    proofData.co_gateway.progress_revert_redeem.params = progressRevertRedeemParams;
    proofData.co_gateway.progress_revert_redeem.return_value = progressRevertRedeemResult;
    proofData.co_gateway.progress_revert_redeem.proof_data = progressRevertRedeemProofData;
  }
}

module.exports = ProofGenerationUtils;
