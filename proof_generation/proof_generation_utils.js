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

class ProofGenerationUtils {

  constructor(gateway, coGateway, stakeParams, redeemParams, proofUtils) {
    this.gateway = gateway;
    this.coGateway = coGateway;
    this.stakeParams = stakeParams;
    this.redeemParams = redeemParams;
    this.proofUtils = proofUtils;
  }

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

  async populateConfirmStakeIntentProofData (
    stakeProofData,
    proofData,
  ) {
    const confirmStakeIntentParams = Object.assign({}, this.stakeParams);
    confirmStakeIntentParams.blockHeight = stakeProofData.block_number;
    confirmStakeIntentParams.rlpParentNodes = stakeProofData.storageProof[0].serializedProof;
    confirmStakeIntentParams.facilitator = this.stakeParams.staker;
    confirmStakeIntentParams.storageRoot = stakeProofData.storageHash;

    // confirmStakeIntent also sets/anchors storage root for a block number.
    const confirmStakeIntentResult = await this.coGateway.confirmStakeIntent(confirmStakeIntentParams);
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

  async populateProgressRevertStakeProofData (
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

  async populateRedeemProofData (
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

  async populateConfirmRedeemIntentProofData (
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

  async populateProgressRedeemProofData (
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

  async populateProgressUnstakeProofData (
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

  async populateRevertRedeemProofData (
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

  async populateConfirmRevertRedeemProofData (
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

  async populateProgressRevertRedeemProofData (
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

};

module.exports = ProofGenerationUtils;
