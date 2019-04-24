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
// Test: lib/utils.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

/* eslint-disable no-param-reassign */

const TestLibUtils = require('../test/test_lib/utils.js');

function Utils() {}

Utils.prototype = {

  populateStakeProofData: async (gateway, stakeParams, proofUtils, proofData) => {
    const generatedHashLock = TestLibUtils.generateHashLock();
    stakeParams.hashLock = generatedHashLock.l;
    stakeParams.unlockSecret = generatedHashLock.s;

    const stakeResult = await gateway.stake(stakeParams);
    const stakeProofData = await proofUtils.getOutboxProof(
      gateway.address,
      [stakeResult.returned_value.messageHash_],
    );
    // Populate stakeProof data.
    proofData.gateway.stake = {};
    proofData.gateway.stake.params = stakeParams;
    proofData.gateway.stake.return_value = stakeResult;
    proofData.gateway.stake.proof_data = stakeProofData;
    return {
      stakeProofData,
      stakeResult,
    };
  },

  populateConfirmStakeIntentProofData: async (
    coGateway,
    stakeParams,
    stakeProofData,
    proofUtils,
    proofData,
  ) => {
    const confirmStakeIntentParams = Object.assign({}, stakeParams);
    confirmStakeIntentParams.blockHeight = stakeProofData.block_number;
    confirmStakeIntentParams.rlpParentNodes = stakeProofData.storageProof[0].serializedProof;
    confirmStakeIntentParams.facilitator = stakeParams.staker;
    confirmStakeIntentParams.storageRoot = stakeProofData.storageHash;

    // confirmStakeIntent also sets/anchors storage root for a block number.
    const confirmStakeIntentResult = await coGateway.confirmStakeIntent(confirmStakeIntentParams);
    const confirmStakeIntentProofData = await proofUtils.getInboxProof(
      coGateway.address,
      [confirmStakeIntentResult.returned_value.messageHash_],
    );

    // Populate confirmStakeIntentProof data.
    proofData.co_gateway.confirm_stake_intent = {};
    proofData.co_gateway.confirm_stake_intent.params = confirmStakeIntentParams;
    proofData.co_gateway.confirm_stake_intent.return_value = confirmStakeIntentResult;
    proofData.co_gateway.confirm_stake_intent.proof_data = confirmStakeIntentProofData;
    return {
      confirmStakeIntentResult,
    };
  },

  populateProgressStakeProofData: async (
    gateway,
    stakeParams,
    stakeResult,
    confirmStakeIntentResult,
    proofUtils,
    proofData,
  ) => {
    const progressStakeParams = {};
    progressStakeParams.messageHash = stakeResult.returned_value.messageHash_;
    progressStakeParams.unlockSecret = stakeParams.unlockSecret;
    progressStakeParams.facilitator = stakeParams.staker;

    const progressStakeResult = await gateway.progressStake(progressStakeParams);
    const progressStakeProofData = await proofUtils.getOutboxProof(
      gateway.address,
      [confirmStakeIntentResult.returned_value.messageHash_],
    );

    // Populate progressStakeProof data.
    proofData.gateway.progress_stake = {};
    proofData.gateway.progress_stake.params = progressStakeParams;
    proofData.gateway.progress_stake.return_value = progressStakeResult;
    proofData.gateway.progress_stake.proof_data = progressStakeProofData;

    return {
      progressStakeParams,
    };
  },

  populateProgressMintProofData: async (
    progressStakeParams,
    coGateway,
    confirmStakeIntentResult,
    proofUtils,
    proofData,
  ) => {
    const progressMintParams = Object.assign({}, progressStakeParams);
    const progressMintResult = await coGateway.progressMint(progressMintParams);
    const progressMintProofData = await proofUtils.getInboxProof(
      coGateway.address,
      [confirmStakeIntentResult.returned_value.messageHash_],
    );

    proofData.co_gateway.progress_mint = {};
    proofData.co_gateway.progress_mint.params = progressMintParams;
    proofData.co_gateway.progress_mint.return_value = progressMintResult;
    proofData.co_gateway.progress_mint.proof_data = progressMintProofData;
  },

  populateRevertStakeProofData: async (
    gateway,
    stakeParams,
    stakeResult,
    confirmStakeIntentResult,
    proofUtils,
    proofData,
  ) => {
    const revertStakeParams = {};
    revertStakeParams.messageHash = confirmStakeIntentResult.returned_value.messageHash_;
    revertStakeParams.staker = stakeParams.staker;

    const revertStakeResult = await gateway.revertStake(revertStakeParams);

    const revertStakeProofData = await proofUtils.getOutboxProof(
      gateway.address,
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
  },

  populateConfirmRevertStakeProofData: async (
    coGateway,
    stakeParams,
    revertStakeParams,
    revertStakeProofData,
    proofUtils,
    proofData,
  ) => {
    const confirmRevertStakeParams = {};
    confirmRevertStakeParams.messageHash = revertStakeParams.messageHash;
    confirmRevertStakeParams.blockHeight = revertStakeProofData.block_number;
    confirmRevertStakeParams.rlpParentNodes = revertStakeProofData
      .storageProof[0].serializedProof;
    confirmRevertStakeParams.facilitator = stakeParams.staker;
    confirmRevertStakeParams.storageRoot = revertStakeProofData.storageHash;

    const confirmRevertStakeResult = await coGateway.confirmRevertStakeIntent(
      confirmRevertStakeParams,
    );

    const confirmRevertStakeProofData = await proofUtils.getInboxProof(
      coGateway.address,
      [confirmRevertStakeParams.messageHash],
    );

    proofData.co_gateway.confirm_revert_stake_intent = {};
    proofData.co_gateway.confirm_revert_stake_intent.params = confirmRevertStakeParams;
    proofData.co_gateway.confirm_revert_stake_intent.return_value = confirmRevertStakeResult;
    proofData.co_gateway.confirm_revert_stake_intent.proof_data = confirmRevertStakeProofData;

    return {
      confirmRevertStakeProofData,
    };
  },

  populateProgressRevertStakeProofData: async (
    gateway,
    stakeParams,
    revertStakeParams,
    confirmRevertStakeProofData,
    proofUtils,
    proofData,
  ) => {
    const progressRevertStakeParams = {};
    progressRevertStakeParams.messageHash = revertStakeParams.messageHash;
    progressRevertStakeParams.blockHeight = confirmRevertStakeProofData.block_number;
    progressRevertStakeParams.rlpParentNodes = confirmRevertStakeProofData
      .storageProof[0].serializedProof;
    progressRevertStakeParams.facilitator = stakeParams.staker;
    progressRevertStakeParams.storageRoot = confirmRevertStakeProofData.storageHash;

    const progressRevertStakeResult = await gateway.progressRevertStake(
      progressRevertStakeParams,
    );

    const progressRevertStakeProofData = await proofUtils.getOutboxProof(
      gateway.address,
      [progressRevertStakeParams.messageHash],
    );
    proofData.gateway.progress_revert_stake_intent = {};
    proofData.gateway.progress_revert_stake_intent.params = progressRevertStakeParams;
    proofData.gateway.progress_revert_stake_intent.return_value = progressRevertStakeResult;
    proofData.gateway.progress_revert_stake_intent.proof_data = progressRevertStakeProofData;
  },

  populateRedeemProofData: async (
    coGateway,
    redeemParams,
    proofUtils,
    proofData,
  ) => {
    const generatedHashLock = TestLibUtils.generateHashLock();
    redeemParams.hashLock = generatedHashLock.l;
    redeemParams.unlockSecret = generatedHashLock.s;
    const redeemResult = await coGateway.redeem(redeemParams);
    const redeemProofData = await proofUtils.getOutboxProof(
      coGateway.address,
      [redeemResult.returned_value.messageHash_],
    );
    proofData.co_gateway.redeem = {};
    proofData.co_gateway.redeem.params = redeemParams;
    proofData.co_gateway.redeem.return_value = redeemResult;
    proofData.co_gateway.redeem.proof_data = redeemProofData;

    return {
      redeemProofData,
      redeemResult,
    };
  },

  populateConfirmRedeemIntentProofData: async (
    gateway,
    redeemParams,
    redeemProofData,
    proofUtils,
    proofData,
  ) => {
    const confirmRedeemIntentParams = Object.assign({}, redeemParams);
    confirmRedeemIntentParams.blockNumber = redeemProofData.block_number;
    confirmRedeemIntentParams.storageProof = redeemProofData.storageProof[0].serializedProof;
    confirmRedeemIntentParams.facilitator = redeemProofData.staker;
    confirmRedeemIntentParams.storageRoot = redeemProofData.storageHash;
    confirmRedeemIntentParams.facilitator = redeemParams.redeemer;

    // confirmRedeemIntent also anchors/sets storage root.
    const confirmRedeemIntentResult = await gateway.confirmRedeemIntent(
      confirmRedeemIntentParams,
    );
    const confirmRedeemIntentProofData = await proofUtils.getInboxProof(
      gateway.address,
      [confirmRedeemIntentResult.returned_value.messageHash_],
    );
    proofData.gateway.confirm_redeem_intent = {};
    proofData.gateway.confirm_redeem_intent.params = confirmRedeemIntentParams;
    proofData.gateway.confirm_redeem_intent.return_value = confirmRedeemIntentResult;
    proofData.gateway.confirm_redeem_intent.proof_data = confirmRedeemIntentProofData;

    return {
      confirmRedeemIntentResult,
    };
  },

  populateProgressRedeemProofData: async (
    coGateway,
    redeemParams,
    confirmRedeemIntentResult,
    proofUtils,
    proofData,
  ) => {
    const progressRedeemParams = {};
    progressRedeemParams.messageHash = confirmRedeemIntentResult.returned_value.messageHash_;
    progressRedeemParams.unlockSecret = redeemParams.unlockSecret;
    progressRedeemParams.facilitator = redeemParams.redeemer;
    const progressRedeemResult = await coGateway.progressRedeem(
      progressRedeemParams,
    );

    const progressRedeemProofData = await proofUtils.getOutboxProof(
      coGateway.address,
      [progressRedeemParams.messageHash],
    );
    proofData.co_gateway.progress_redeem = {};
    proofData.co_gateway.progress_redeem.params = progressRedeemParams;
    proofData.co_gateway.progress_redeem.return_value = progressRedeemResult;
    proofData.co_gateway.progress_redeem.proof_data = progressRedeemProofData;

    return {
      progressRedeemParams,
    };
  },

  populateProgressUnstakeProofData: async (
    gateway,
    redeemParams,
    progressRedeemParams,
    proofUtils,
    proofData,
  ) => {
    const progressUnstakeParams = Object.assign({}, progressRedeemParams);
    progressUnstakeParams.unstakeAmount = redeemParams.amount;
    const progressUnstakeResult = await gateway.progressUnstake(
      progressUnstakeParams,
    );
    const progressUnstakeProofData = await proofUtils.getInboxProof(
      gateway.address,
      [progressUnstakeParams.messageHash],
    );
    proofData.gateway.progress_unstake = {};
    proofData.gateway.progress_unstake.params = progressUnstakeParams;
    proofData.gateway.progress_unstake.return_value = progressUnstakeResult;
    proofData.gateway.progress_unstake.proof_data = progressUnstakeProofData;
  },

  populateRevertRedeemProofData: async (
    coGateway,
    redeemParams,
    redeemResult,
    proofUtils,
    proofData,
  ) => {
    const revertRedeemParams = {};
    revertRedeemParams.messageHash = redeemResult.returned_value.messageHash_;
    revertRedeemParams.redeemer = redeemParams.redeemer;
    const revertRedeemResult = await coGateway.revertRedeem(
      revertRedeemParams,
    );
    const revertRedeemProofData = await proofUtils.getOutboxProof(
      coGateway.address,
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
  },

  populateConfirmRevertRedeemProofData: async (
    gateway,
    redeemParams,
    revertRedeemParams,
    revertRedeemProofData,
    proofUtils,
    proofData,
  ) => {
    const confirmRevertRedeemIntentParams = {};
    confirmRevertRedeemIntentParams.messageHash = revertRedeemParams.messageHash;
    confirmRevertRedeemIntentParams.blockNumber = revertRedeemProofData.block_number;
    confirmRevertRedeemIntentParams.rlpParentNodes = revertRedeemProofData
      .storageProof[0].serializedProof;
    confirmRevertRedeemIntentParams.facilitator = redeemParams.redeemer;
    confirmRevertRedeemIntentParams.storageRoot = revertRedeemProofData.storageHash;

    const confirmRevertRedeemResult = await gateway.confirmRevertRedeemIntent(
      confirmRevertRedeemIntentParams,
    );
    const confirmRevertRedeemProofData = await proofUtils.getInboxProof(
      gateway.address,
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
  },

  populateProgressRevertRedeemProofData: async (
    coGateway,
    redeemParams,
    revertRedeemParams,
    confirmRevertRedeemProofData,
    proofUtils,
    proofData,
  ) => {
    const progressRevertRedeemParams = {};
    progressRevertRedeemParams.messageHash = revertRedeemParams.messageHash;
    progressRevertRedeemParams.blockHeight = confirmRevertRedeemProofData.block_number;
    progressRevertRedeemParams.rlpParentNodes = confirmRevertRedeemProofData
      .storageProof[0].serializedProof;
    progressRevertRedeemParams.facilitator = redeemParams.redeemer;
    progressRevertRedeemParams.storageRoot = confirmRevertRedeemProofData.storageHash;

    const progressRevertRedeemResult = await coGateway.progressRevertRedeem(
      progressRevertRedeemParams,
    );

    const progressRevertRedeemProofData = await proofUtils.getOutboxProof(
      coGateway.address,
      [progressRevertRedeemParams.messageHash],
    );
    proofData.co_gateway.progress_revert_redeem = {};
    proofData.co_gateway.progress_revert_redeem.params = progressRevertRedeemParams;
    proofData.co_gateway.progress_revert_redeem.return_value = progressRevertRedeemResult;
    proofData.co_gateway.progress_revert_redeem.proof_data = progressRevertRedeemProofData;
  },

};

module.exports = new Utils();
