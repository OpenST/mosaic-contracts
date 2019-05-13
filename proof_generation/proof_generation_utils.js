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

const TestLibUtils = require('../test/test_lib/utils.js');
const Gateway = require('./helper/gateway');
const CoGateway = require('./helper/co_gateway');

/**
 * Object contains input parameter for confirmStakingIntent.
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
 * Object contains input parameter needed for confirmRedeemIntent.
 *
 * @typedef {object} RedeemParams
 * @property {string} redeemer Redeemer address.
 * @property {string} redeemerNonce Redeemer nonce.
 * @property {string} beneficiary Address where the redeemed tokens
 *                    will be transferred.
 * @property {string} amount Redeem amount.
 * @property {string} gasPrice Gas price that redeemer is ready to pay to
 *                    get the redeem and unstake process done.
 * @property {string} gasLimit Gas limit that redeemer is ready to pay.
 * @property {string} blockHeight Block number for which the proof is valid.
 * @property {string} hashLock Hash lock.
 * @property {string} rlpParentNodes RLP encoded proof data.
 * @property {string} storageRoot Storage root for proof.
 * @property {string} facilitator Facilitator address for progress mint.
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
   * @param stakeParams {StakeParams} Contains data needed for staking.
   * @param redeemParams {RedeemParams} Contains data needed for redeeming.
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
    this.messageBoxOffset = await this.gateway.getMessageBoxOffset();
  }

  /**
   * Populates proof data after calling stake.
   *
   * @returns {Promise<{stakeProofData, stakeResult: void}>}
   */
  async populateStakeProofData() {
    const generatedHashLock = TestLibUtils.generateHashLock();
    this.stakeParams.hashLock = generatedHashLock.l;
    this.stakeParams.unlockSecret = generatedHashLock.s;

    const stakeResult = await this.gateway.stake(this.stakeParams);
    const stakeProofData = await this.proofUtils.getOutboxProof(
      this.gateway.address,
      [stakeResult.returned_value.messageHash_],
      this.messageBoxOffset,
    );
    const stake = {};
    stake.params = this.stakeParams;
    stake.return_value = stakeResult;
    stake.proof_data = stakeProofData;
    this.proofData.gateway.stake = stake;
    return {
      stakeProofData,
      stakeResult,
    };
  }

  /**
   * Populates proof data after calling confirmStakingIntent.
   *
   * @param stakeProofData {object} Contains proof data after calling stake.
   *
   * @returns {Promise<{confirmStakeIntentResult}>}
   */
  async populateConfirmStakeIntentProofData(stakeProofData) {
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
      this.messageBoxOffset,
    );
    const confirmStakeIntent = {};
    confirmStakeIntent.params = confirmStakeIntentParams;
    confirmStakeIntent.return_value = confirmStakeIntentResult;
    confirmStakeIntent.proof_data = confirmStakeIntentProofData;
    this.proofData.co_gateway.confirm_stake_intent = confirmStakeIntent;

    return {
      confirmStakeIntentResult,
    };
  }

  /**
   * Populates proof data after calling progressStake.
   *
   * @param stakeResult {object} Result after calling staking.
   * @param confirmStakeIntentResult {object} Result after calling confirmStakeIntent
   *
   * @returns {Promise<{progressStakeParams}>}
   */
  async populateProgressStakeProofData(stakeResult, confirmStakeIntentResult) {
    const progressStakeParams = {};
    progressStakeParams.messageHash = stakeResult.returned_value.messageHash_;
    progressStakeParams.unlockSecret = this.stakeParams.unlockSecret;
    progressStakeParams.facilitator = this.stakeParams.staker;

    const progressStakeResult = await this.gateway.progressStake(progressStakeParams);
    const progressStakeProofData = await this.proofUtils.getOutboxProof(
      this.gateway.address,
      [confirmStakeIntentResult.returned_value.messageHash_],
      this.messageBoxOffset,
    );
    const progressStake = {};
    progressStake.params = progressStakeParams;
    progressStake.return_value = progressStakeResult;
    progressStake.proof_data = progressStakeProofData;
    this.proofData.gateway.progress_stake = progressStake;

    return {
      progressStakeParams,
    };
  }

  /**
   * Populates proof data after calling progressMint.
   *
   * @param progressStakeParams {StakeParams} Contains data needed for progressStake.
   * @param confirmStakeIntentResult {object} Result after calling confirmStakeIntent.
   *
   * @returns {Promise<void>}
   */
  async populateProgressMintProofData(
    progressStakeParams,
    confirmStakeIntentResult,
  ) {
    const progressMintParams = Object.assign({}, progressStakeParams);
    const progressMintResult = await this.coGateway.progressMint(progressMintParams);
    const progressMintProofData = await this.proofUtils.getInboxProof(
      this.coGateway.address,
      [confirmStakeIntentResult.returned_value.messageHash_],
      this.messageBoxOffset,
    );

    const progressMint = {};
    progressMint.params = progressMintParams;
    progressMint.return_value = progressMintResult;
    progressMint.proof_data = progressMintProofData;
    this.proofData.co_gateway.progress_mint = progressMint;
  }

  /**
   * Populates proof data after calling revert stake.
   *
   * @param stakeResult {object} Result after calling stake.
   * @param confirmStakeIntentResult {object} Result after calling confirmStakeIntent.
   *
   * @returns {Promise<{revertStakeProofData, revertStakeParams}>}
   */
  async populateRevertStakeProofData(stakeResult, confirmStakeIntentResult) {
    const revertStakeParams = {};
    revertStakeParams.messageHash = confirmStakeIntentResult.returned_value.messageHash_;
    revertStakeParams.staker = this.stakeParams.staker;

    const revertStakeResult = await this.gateway.revertStake(revertStakeParams);

    const revertStakeProofData = await this.proofUtils.getOutboxProof(
      this.gateway.address,
      [stakeResult.returned_value.messageHash_],
      this.messageBoxOffset,
    );
    const revertStake = {};
    revertStake.params = revertStakeParams;
    revertStake.return_value = revertStakeResult;
    revertStake.proof_data = revertStakeProofData;
    this.proofData.gateway.revert_stake = revertStake;

    return {
      revertStakeProofData,
      revertStakeParams,
    };
  }

  /**
   * Populates proof data after calling confirm revert stake.
   *
   * @param revertStakeParams {StakeParams} Contains revert stake parameters.
   * @param revertStakeProofData {object} Contains revert stake proof data.
   *
   * @returns {Promise<{confirmRevertStakeProofData}>}
   */
  async populateConfirmRevertStakeProofData(revertStakeParams, revertStakeProofData) {
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
      this.messageBoxOffset,
    );

    const confirmRevertStakeIntent = {};
    confirmRevertStakeIntent.params = confirmRevertStakeParams;
    confirmRevertStakeIntent.return_value = confirmRevertStakeResult;
    confirmRevertStakeIntent.proof_data = confirmRevertStakeProofData;
    this.proofData.co_gateway.confirm_revert_stake_intent = confirmRevertStakeIntent;

    return {
      confirmRevertStakeProofData,
    };
  }

  /**
   * Populates proof data after calling progress revert stake.
   *
   * @param revertStakeParams {StakeParams} Contains revert stake data.
   * @param confirmRevertStakeProofData {object} Contains confirm revert stake proof data.
   *
   * @returns {Promise<void>}
   */
  async populateProgressRevertStakeProofData(revertStakeParams, confirmRevertStakeProofData) {
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
      this.messageBoxOffset,
    );
    const progressRevertStakeIntent = {};
    progressRevertStakeIntent.params = progressRevertStakeParams;
    progressRevertStakeIntent.return_value = progressRevertStakeResult;
    progressRevertStakeIntent.proof_data = progressRevertStakeProofData;
    this.proofData.gateway.progress_revert_stake_intent = progressRevertStakeIntent;
  }

  /**
   * Populates proof data after calling redeem.
   *
   * @returns {Promise<{redeemProofData, redeemResult}>}
   */
  async populateRedeemProofData() {
    const generatedHashLock = TestLibUtils.generateHashLock();
    this.redeemParams.hashLock = generatedHashLock.l;
    this.redeemParams.unlockSecret = generatedHashLock.s;
    const redeemResult = await this.coGateway.redeem(this.redeemParams);
    const redeemProofData = await this.proofUtils.getOutboxProof(
      this.coGateway.address,
      [redeemResult.returned_value.messageHash_],
      this.messageBoxOffset,
    );
    const redeem = {};
    redeem.params = this.redeemParams;
    redeem.return_value = redeemResult;
    redeem.proof_data = redeemProofData;
    this.proofData.co_gateway.redeem = redeem;

    return {
      redeemProofData,
      redeemResult,
    };
  }

  /**
   * Contains proof data after calling confirm redeem intent.
   *
   * @param redeemProofData {object} Contains redeem proof data.
   *
   * @returns {Promise<{confirmRedeemIntentResult}>}
   */
  async populateConfirmRedeemIntentProofData(redeemProofData) {
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
      this.messageBoxOffset,
    );
    const confirmRedeemIntent = {};
    confirmRedeemIntent.params = confirmRedeemIntentParams;
    confirmRedeemIntent.return_value = confirmRedeemIntentResult;
    confirmRedeemIntent.proof_data = confirmRedeemIntentProofData;
    this.proofData.gateway.confirm_redeem_intent = confirmRedeemIntent;

    return {
      confirmRedeemIntentResult,
    };
  }

  /**
   * Populates proof data after calling progress redeem.
   *
   * @param confirmRedeemIntentResult {object} Result after calling confirm redeem intent.
   *
   * @returns {Promise<{progressRedeemParams}>}
   */
  async populateProgressRedeemProofData(confirmRedeemIntentResult) {
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
      this.messageBoxOffset,
    );
    const progressRedeem = {};
    progressRedeem.params = progressRedeemParams;
    progressRedeem.return_value = progressRedeemResult;
    progressRedeem.proof_data = progressRedeemProofData;
    this.proofData.co_gateway.progress_redeem = progressRedeem;

    return {
      progressRedeemParams,
    };
  }

  /**
   * Populates proof data after calling progress unstake.
   *
   * @param progressRedeemParams {RedeemParams} Contains data needed for progress redeem.
   *
   * @returns {Promise<void>}
   */
  async populateProgressUnstakeProofData(progressRedeemParams) {
    const progressUnstakeParams = Object.assign({}, progressRedeemParams);
    progressUnstakeParams.unstakeAmount = this.redeemParams.amount;
    const progressUnstakeResult = await this.gateway.progressUnstake(
      progressUnstakeParams,
    );
    const progressUnstakeProofData = await this.proofUtils.getInboxProof(
      this.gateway.address,
      [progressUnstakeParams.messageHash],
      this.messageBoxOffset,
    );
    const progressUnstake = {};
    progressUnstake.params = progressUnstakeParams;
    progressUnstake.return_value = progressUnstakeResult;
    progressUnstake.proof_data = progressUnstakeProofData;
    this.proofData.gateway.progress_unstake = progressUnstake;
  }

  /**
   * Populates proof data after calling revert redeem.
   *
   * @param redeemResult {object} Result after calling redeem.
   *
   * @returns {Promise<{revertRedeemProofData, revertRedeemResult, revertRedeemParams}>}
   */
  async populateRevertRedeemProofData(redeemResult) {
    const revertRedeemParams = {};
    revertRedeemParams.messageHash = redeemResult.returned_value.messageHash_;
    revertRedeemParams.redeemer = this.redeemParams.redeemer;
    const revertRedeemResult = await this.coGateway.revertRedeem(
      revertRedeemParams,
    );
    const revertRedeemProofData = await this.proofUtils.getOutboxProof(
      this.coGateway.address,
      [revertRedeemParams.messageHash],
      this.messageBoxOffset,
    );
    const revertRedeem = {};
    revertRedeem.params = revertRedeemParams;
    revertRedeem.return_value = revertRedeemResult;
    revertRedeem.proof_data = revertRedeemProofData;
    this.proofData.co_gateway.revert_redeem = revertRedeem;

    return {
      revertRedeemProofData,
      revertRedeemResult,
      revertRedeemParams,
    };
  }

  /**
   * Populates proof data after calling confirm revert redeem.
   *
   * @param revertRedeemParams {RedeemParams} Contains data needed for calling revert redeem.
   * @param revertRedeemProofData {object} Contains revert redeem proof data.
   *
   * @returns {Promise<{confirmRevertRedeemProofData, confirmRevertRedeemIntentParams}>}
   */
  async populateConfirmRevertRedeemProofData(
    revertRedeemParams,
    revertRedeemProofData,
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
      this.messageBoxOffset,
    );
    const confirmRevertRedeemIntent = {};
    confirmRevertRedeemIntent.params = confirmRevertRedeemIntentParams;
    confirmRevertRedeemIntent.return_value = confirmRevertRedeemResult;
    confirmRevertRedeemIntent.proof_data = confirmRevertRedeemProofData;
    this.proofData.gateway.confirm_revert_redeem_intent = confirmRevertRedeemIntent;

    return {
      confirmRevertRedeemProofData,
      confirmRevertRedeemIntentParams,
    };
  }

  /**
   * Populates proof data after calling progress revert redeem.
   *
   * @param revertRedeemParams {RedeemParams} Contains data needed for calling revert redeem.
   * @param confirmRevertRedeemProofData {object} Contains revert redeem proof data.
   *
   * @returns {Promise<void>}
   */
  async populateProgressRevertRedeemProofData(
    revertRedeemParams,
    confirmRevertRedeemProofData,
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
      this.messageBoxOffset,
    );
    const progressRevertRedeem = {};
    progressRevertRedeem.params = progressRevertRedeemParams;
    progressRevertRedeem.return_value = progressRevertRedeemResult;
    progressRevertRedeem.proof_data = progressRevertRedeemProofData;
    this.proofData.co_gateway.progress_revert_redeem = progressRevertRedeem;
  }
}

module.exports = ProofGenerationUtils;
