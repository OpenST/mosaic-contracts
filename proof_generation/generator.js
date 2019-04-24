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

/* eslint-disable no-await-in-loop, no-plusplus, array-callback-return */

const BN = require('bn.js');
const fs = require('fs');
const path = require('path');
const Web3 = require('web3');

const Utils = require('../test/test_lib/utils.js');

const docker = require('../test_integration/docker');
const CoGateway = require('./helper/co_gateway');
const Gateway = require('./helper/gateway');
const ProofUtils = require('../test_integration/lib/proof_utils');

const deployer = require('./deployer.js');

const PROOF_GENERATED_PATH = 'test/data/';

/**
 * Write proof data in the file.
 *
 * @param {string} location Location where the file will be written.
 * @param {string} content The content that will be written in the file.
 *
 */
function writeToFile(location, content) {
  const rootDir = `${__dirname}/../`;
  const pathLocation = path.join(rootDir, location);
  fs.writeFile(pathLocation, content, (err) => {
    if (err) {
      throw err;
    }
  });
}

/**
 * Get address of all deployed contracts.
 *
 * @param {Object} registeredContracts Object containing all contracts.
 *
 * @returns {Object} An object containing the deployed contract address.
 */
function getContractAddresses(registeredContracts) {
  const addresses = {};
  Object.keys(registeredContracts).map((key) => {
    if (registeredContracts[key].address) {
      addresses[key] = registeredContracts[key].address;
    }
  });
  return addresses;
}

contract('Stake and Mint ', (accounts) => {
  let registeredContracts;
  let stakeParams;
  let generatedHashLock;
  let rpcEndpointOrigin;
  let proofUtils;
  let web3Provider;
  let gateway;
  let coGateway;

  before(async () => {
    console.log('starting docker');
    ({ rpcEndpointOrigin } = await docker());
    console.log('started docker');
    web3Provider = new Web3(rpcEndpointOrigin);
    proofUtils = new ProofUtils(web3Provider, web3Provider);
    console.log('proofUtils started');
  });

  beforeEach(async () => {
    console.log('deploying contracts');
    registeredContracts = await deployer(web3Provider, accounts);
    console.log('contracts deployed');
    gateway = new Gateway(registeredContracts);
    coGateway = new CoGateway(registeredContracts);
    stakeParams = {
      amount: new BN(100000000),
      beneficiary: accounts[2],
      gasPrice: new BN(1),
      gasLimit: new BN(10000),
      nonce: new BN(0),
      staker: accounts[0],
    };
  });

  it('Generates proof data for "Stake progressed"', async () => {
    const numberOfProofs = 2;

    for (let i = 0; i < numberOfProofs; ++i) {
      const proofData = {};
      proofData.contracts = getContractAddresses(registeredContracts);

      proofData.gateway = {};
      // no-await-in-loop
      proofData.gateway.constructor = await gateway.getConstructorParams();

      proofData.co_gateway = {};
      proofData.co_gateway.constructor = await coGateway.getConstructorParams();

      generatedHashLock = Utils.generateHashLock();

      // Stake
      stakeParams.hashLock = generatedHashLock.l;
      stakeParams.unlockSecret = generatedHashLock.s;

      const stakeResult = await gateway.stake(stakeParams);

      const stakeProofData = await proofUtils.getOutboxProof(
        gateway.address,
        [stakeResult.returned_value.messageHash_],
      );

      // Populate proof data.
      proofData.gateway.stake = {};
      proofData.gateway.stake.params = stakeParams;
      proofData.gateway.stake.return_value = stakeResult;
      proofData.gateway.stake.proof_data = stakeProofData;

      // Confirm stake intent.
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

      // Populate proof data.
      proofData.co_gateway.confirm_stake_intent = {};
      proofData.co_gateway.confirm_stake_intent.params = confirmStakeIntentParams;
      proofData.co_gateway.confirm_stake_intent.return_value = confirmStakeIntentResult;
      proofData.co_gateway.confirm_stake_intent.proof_data = confirmStakeIntentProofData;

      // Progress stake
      const progressStakeParams = {};
      progressStakeParams.messageHash = stakeResult.returned_value.messageHash_;
      progressStakeParams.unlockSecret = stakeParams.unlockSecret;
      progressStakeParams.facilitator = stakeParams.staker;

      const progressStakeResult = await gateway.progressStake(progressStakeParams);

      const progressStakeProofData = await proofUtils.getOutboxProof(
        gateway.address,
        [confirmStakeIntentResult.returned_value.messageHash_],
      );

      // Populate proof data.
      proofData.gateway.progress_stake = {};
      proofData.gateway.progress_stake.params = progressStakeParams;
      proofData.gateway.progress_stake.return_value = progressStakeResult;
      proofData.gateway.progress_stake.proof_data = progressStakeProofData;

      // Progress mint.
      const progressMintParams = Object.assign({}, progressStakeParams);

      const progressMintResult = await coGateway.progressMint(progressMintParams);

      const progressMintProofData = await proofUtils.getInboxProof(
        coGateway.address,
        [confirmStakeIntentResult.returned_value.messageHash_],
      );

      // Populate proof data.
      proofData.co_gateway.progress_mint = {};
      proofData.co_gateway.progress_mint.params = progressMintParams;
      proofData.co_gateway.progress_mint.return_value = progressMintResult;
      proofData.co_gateway.progress_mint.proof_data = progressMintProofData;

      // Write the proof data in to the files.
      writeToFile(
        `${PROOF_GENERATED_PATH}stake_progressed_${stakeParams.nonce.toString(10)}.json`,
        JSON.stringify(proofData),
      );

      // Proof data should be generated starting for nonce 0.
      stakeParams.nonce = stakeParams.nonce.addn(1);
    }
  });

  it('Generates proof data for "Stake revoked"', async () => {
    const numberOfProofs = 2;

    for (let i = 0; i < numberOfProofs; i++) {
      const proofData = {};
      proofData.contracts = getContractAddresses(registeredContracts);

      proofData.gateway = {};
      proofData.gateway.constructor = await gateway.getConstructorParams();

      proofData.co_gateway = {};
      proofData.co_gateway.constructor = await coGateway.getConstructorParams();

      generatedHashLock = Utils.generateHashLock();

      // Stake
      stakeParams.hashLock = generatedHashLock.l;
      stakeParams.unlockSecret = generatedHashLock.s;

      const stakeResult = await gateway.stake(stakeParams);

      const stakeProofData = await proofUtils.getOutboxProof(
        gateway.address,
        [stakeResult.returned_value.messageHash_],
      );

      // Populate proof data.
      proofData.gateway.stake = {};
      proofData.gateway.stake.params = stakeParams;
      proofData.gateway.stake.return_value = stakeResult;
      proofData.gateway.stake.proof_data = stakeProofData;

      // Confirm stake intent.
      const confirmStakeIntentParams = Object.assign({}, stakeParams);
      confirmStakeIntentParams.blockHeight = stakeProofData.block_number;
      confirmStakeIntentParams.rlpParentNodes = stakeProofData.storageProof[0].serializedProof;
      confirmStakeIntentParams.facilitator = stakeParams.staker;
      confirmStakeIntentParams.storageRoot = stakeProofData.storageHash;

      const confirmStakeIntentResult = await coGateway.confirmStakeIntent(confirmStakeIntentParams);

      const confirmStakeIntentProofData = await proofUtils.getInboxProof(
        coGateway.address,
        [confirmStakeIntentResult.returned_value.messageHash_],
      );

      // Populate proof data.
      proofData.co_gateway.confirm_stake_intent = {};
      proofData.co_gateway.confirm_stake_intent.params = confirmStakeIntentParams;
      proofData.co_gateway.confirm_stake_intent.return_value = confirmStakeIntentResult;
      proofData.co_gateway.confirm_stake_intent.proof_data = confirmStakeIntentProofData;

      // Revert stake
      const revertStakeParams = {};
      revertStakeParams.messageHash = confirmStakeIntentResult.returned_value.messageHash_;
      revertStakeParams.staker = stakeParams.staker;

      const revertStakeResult = await gateway.revertStake(revertStakeParams);

      const revertStakeProofData = await proofUtils.getOutboxProof(
        gateway.address,
        [stakeResult.returned_value.messageHash_],
      );

      // Populate proof data.
      proofData.gateway.revert_stake = {};
      proofData.gateway.revert_stake.params = revertStakeParams;
      proofData.gateway.revert_stake.return_value = revertStakeResult;
      proofData.gateway.revert_stake.proof_data = revertStakeProofData;

      // Confirm revert stake
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

      // Populate proof data.
      proofData.co_gateway.confirm_revert_stake_intent = {};
      proofData.co_gateway.confirm_revert_stake_intent.params = confirmRevertStakeParams;
      proofData.co_gateway.confirm_revert_stake_intent.return_value = confirmRevertStakeResult;
      proofData.co_gateway.confirm_revert_stake_intent.proof_data = confirmRevertStakeProofData;

      // Progress revoke.
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

      // Populate proof data.
      proofData.gateway.progress_revert_stake_intent = {};
      proofData.gateway.progress_revert_stake_intent.params = progressRevertStakeParams;
      proofData.gateway.progress_revert_stake_intent.return_value = progressRevertStakeResult;
      proofData.gateway.progress_revert_stake_intent.proof_data = progressRevertStakeProofData;

      // Write the proof data in to the files.
      writeToFile(
        `${PROOF_GENERATED_PATH}stake_revoked_${stakeParams.nonce.toString(10)}.json`,
        JSON.stringify(proofData),
      );

      // Proof data should be generated starting for nonce 0.
      stakeParams.nonce = stakeParams.nonce.addn(1);
    }
  });
});

contract('Redeem and Un-stake ', (accounts) => {
  let registeredContracts;
  let redeemParams;
  let generatedHashLock;
  let rpcEndpointOrigin;
  let proofUtils;
  let web3Provider;
  let gateway;
  let coGateway;

  before(async () => {
    ({ rpcEndpointOrigin } = await docker());
    web3Provider = new Web3(rpcEndpointOrigin);
    proofUtils = new ProofUtils(web3Provider, web3Provider);
  });

  beforeEach(async () => {
    registeredContracts = await deployer(web3Provider, accounts);
    gateway = new Gateway(registeredContracts);
    coGateway = new CoGateway(registeredContracts);
    redeemParams = {
      amount: new BN(1000),
      gasPrice: new BN(1),
      gasLimit: new BN(100),
      nonce: new BN(0),
      redeemer: accounts[0],
      beneficiary: accounts[2],
    };
  });

  it('Generates proof data for "Redeem progressed"', async () => {
    const numberOfProofs = 2;

    for (let i = 0; i < numberOfProofs; i++) {
      const proofData = {};
      proofData.contracts = getContractAddresses(registeredContracts);

      proofData.gateway = {};
      proofData.gateway.constructor = await gateway.getConstructorParams();

      proofData.co_gateway = {};
      proofData.co_gateway.constructor = await coGateway.getConstructorParams();

      // Redeem.
      generatedHashLock = Utils.generateHashLock();

      redeemParams.hashLock = generatedHashLock.l;
      redeemParams.unlockSecret = generatedHashLock.s;

      const redeemResult = await coGateway.redeem(redeemParams);

      const redeemProofData = await proofUtils.getOutboxProof(
        coGateway.address,
        [redeemResult.returned_value.messageHash_],
      );

      // Populate proof data.
      proofData.co_gateway.redeem = {};
      proofData.co_gateway.redeem.params = redeemParams;
      proofData.co_gateway.redeem.return_value = redeemResult;
      proofData.co_gateway.redeem.proof_data = redeemProofData;

      // Confirm redeem intent
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

      // Populate proof data.
      proofData.gateway.confirm_redeem_intent = {};
      proofData.gateway.confirm_redeem_intent.params = confirmRedeemIntentParams;
      proofData.gateway.confirm_redeem_intent.return_value = confirmRedeemIntentResult;
      proofData.gateway.confirm_redeem_intent.proof_data = confirmRedeemIntentProofData;

      // Progress redeem.
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

      // Populate proof data.
      proofData.co_gateway.progress_redeem = {};
      proofData.co_gateway.progress_redeem.params = progressRedeemParams;
      proofData.co_gateway.progress_redeem.return_value = progressRedeemResult;
      proofData.co_gateway.progress_redeem.proof_data = progressRedeemProofData;

      // Progress unstake.
      const progressUnstakeParams = Object.assign({}, progressRedeemParams);
      progressUnstakeParams.unstakeAmount = redeemParams.amount;

      const progressUnstakeResult = await gateway.progressUnstake(
        progressUnstakeParams,
      );

      const progressUnstakeProofData = await proofUtils.getInboxProof(
        gateway.address,
        [progressUnstakeParams.messageHash],
      );

      // Populate proof data.
      proofData.gateway.progress_unstake = {};
      proofData.gateway.progress_unstake.params = progressUnstakeParams;
      proofData.gateway.progress_unstake.return_value = progressUnstakeResult;
      proofData.gateway.progress_unstake.proof_data = progressUnstakeProofData;

      // Write the proof data in to the files.
      writeToFile(
        `${PROOF_GENERATED_PATH}redeem_progressed_${redeemParams.nonce.toString(10)}.json`,
        JSON.stringify(proofData),
      );

      // Proof data should be generated starting for nonce 0.
      redeemParams.nonce = redeemParams.nonce.addn(1);
    }
  });

  it('Generates proof data for "Redeem revoked"', async () => {
    const numberOfProofs = 2;

    for (let i = 0; i < numberOfProofs; i++) {
      const proofData = {};
      proofData.contracts = getContractAddresses(registeredContracts);

      proofData.gateway = {};
      proofData.gateway.constructor = await gateway.getConstructorParams();

      proofData.co_gateway = {};
      proofData.co_gateway.constructor = await coGateway.getConstructorParams();

      // Redeem.
      generatedHashLock = Utils.generateHashLock();

      redeemParams.hashLock = generatedHashLock.l;
      redeemParams.unlockSecret = generatedHashLock.s;

      const redeemResult = await coGateway.redeem(redeemParams);

      const redeemProofData = await proofUtils.getOutboxProof(
        coGateway.address,
        [redeemResult.returned_value.messageHash_],
      );

      // Populate proof data.
      proofData.co_gateway.redeem = {};
      proofData.co_gateway.redeem.params = redeemParams;
      proofData.co_gateway.redeem.return_value = redeemResult;
      proofData.co_gateway.redeem.proof_data = redeemProofData;

      // Confirm redeem intent
      const confirmRedeemIntentParams = Object.assign({}, redeemParams);
      confirmRedeemIntentParams.blockNumber = redeemProofData.block_number;
      confirmRedeemIntentParams.storageProof = redeemProofData
        .storageProof[0].serializedProof;
      confirmRedeemIntentParams.facilitator = redeemProofData.staker;
      confirmRedeemIntentParams.storageRoot = redeemProofData.storageHash;
      confirmRedeemIntentParams.facilitator = redeemParams.redeemer;

      const confirmRedeemIntentResult = await gateway.confirmRedeemIntent(
        confirmRedeemIntentParams,
      );

      const confirmRedeemIntentProofData = await proofUtils.getInboxProof(
        gateway.address,
        [confirmRedeemIntentResult.returned_value.messageHash_],
      );

      // Populate proof data.
      proofData.gateway.confirm_redeem_intent = {};
      proofData.gateway.confirm_redeem_intent.params = confirmRedeemIntentParams;
      proofData.gateway.confirm_redeem_intent.return_value = confirmRedeemIntentResult;
      proofData.gateway.confirm_redeem_intent.proof_data = confirmRedeemIntentProofData;

      // Revert redeem.
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

      // Populate proof data.
      proofData.co_gateway.revert_redeem = {};
      proofData.co_gateway.revert_redeem.params = revertRedeemParams;
      proofData.co_gateway.revert_redeem.return_value = revertRedeemResult;
      proofData.co_gateway.revert_redeem.proof_data = revertRedeemProofData;

      // Confirm revert redeem intent.
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

      // Populate proof data.
      proofData.gateway.confirm_revert_redeem_intent = {};
      proofData.gateway.confirm_revert_redeem_intent.params = confirmRevertRedeemIntentParams;
      proofData.gateway.confirm_revert_redeem_intent.return_value = confirmRevertRedeemResult;
      proofData.gateway.confirm_revert_redeem_intent.proof_data = confirmRevertRedeemProofData;

      // Progress revert redeem.
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

      // Populate proof data.
      proofData.co_gateway.progress_revert_redeem = {};
      proofData.co_gateway.progress_revert_redeem.params = progressRevertRedeemParams;
      proofData.co_gateway.progress_revert_redeem.return_value = progressRevertRedeemResult;
      proofData.co_gateway.progress_revert_redeem.proof_data = progressRevertRedeemProofData;

      // Write the proof data in to the files.
      writeToFile(
        `${PROOF_GENERATED_PATH}redeem_revoked_${redeemParams.nonce.toString(10)}.json`,
        JSON.stringify(proofData),
      );

      // Proof data should be generated starting for nonce 0.
      redeemParams.nonce = redeemParams.nonce.addn(1);
    }
  });
});
