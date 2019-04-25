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

const ProofGenerationUtils = require('./proof_generation_utils');
const docker = require('./docker');
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

contract('Stake and Mint ', (accounts) => {
  let registeredContracts;
  let stakeParams;
  let rpcEndpointOrigin;
  let proofUtils;
  let web3Provider;
  let proofGenerationUtils;

  before(async () => {
    ({ rpcEndpointOrigin } = await docker());
    web3Provider = new Web3(rpcEndpointOrigin);
    proofUtils = new ProofUtils(web3Provider, web3Provider);
  });

  beforeEach(async () => {
    registeredContracts = await deployer(web3Provider, accounts);
    stakeParams = {
      amount: new BN(100000000),
      beneficiary: accounts[2],
      gasPrice: new BN(1),
      gasLimit: new BN(10000),
      nonce: new BN(0),
      staker: accounts[0],
    };
    proofGenerationUtils = new ProofGenerationUtils(
      registeredContracts,
      stakeParams,
      null,
      proofUtils,
    );
  });

  it('Generates proof data for "Stake progressed"', async () => {
    const numberOfProofs = 2;

    for (let i = 0; i < numberOfProofs; ++i) {
      proofGenerationUtils.resetProofData();
      await proofGenerationUtils.initializeProofData();

      const {
        stakeProofData,
        stakeResult,
      } = await proofGenerationUtils.populateStakeProofData();

      const {
        confirmStakeIntentResult,
      } = await proofGenerationUtils.populateConfirmStakeIntentProofData(
        stakeProofData,
      );

      const {
        progressStakeParams,
      } = await proofGenerationUtils.populateProgressStakeProofData(
        stakeResult,
        confirmStakeIntentResult,
      );

      await proofGenerationUtils.populateProgressMintProofData(
        progressStakeParams,
        confirmStakeIntentResult,
      );

      // Write the proof data in file.
      writeToFile(
        `${PROOF_GENERATED_PATH}stake_progressed_${stakeParams.nonce.toString(10)}.json`,
        JSON.stringify(proofGenerationUtils.proofData),
      );

      // proof data is generated starting for nonce 0.
      stakeParams.nonce = stakeParams.nonce.addn(1);
    }
  });

  it('Generates proof data for "Stake revoked"', async () => {
    const numberOfProofs = 2;

    for (let i = 0; i < numberOfProofs; i++) {
      proofGenerationUtils.resetProofData();
      await proofGenerationUtils.initializeProofData();

      const {
        stakeProofData,
        stakeResult,
      } = await proofGenerationUtils.populateStakeProofData();

      const {
        confirmStakeIntentResult,
      } = await proofGenerationUtils.populateConfirmStakeIntentProofData(
        stakeProofData,
      );

      const {
        revertStakeProofData,
        revertStakeParams,
      } = await proofGenerationUtils.populateRevertStakeProofData(
        stakeResult,
        confirmStakeIntentResult,
      );

      const {
        confirmRevertStakeProofData,
      } = await proofGenerationUtils.populateConfirmRevertStakeProofData(
        revertStakeParams,
        revertStakeProofData,
      );

      await proofGenerationUtils.populateProgressRevertStakeProofData(
        revertStakeParams,
        confirmRevertStakeProofData,
      );

      // Write the proof data in to the files.
      writeToFile(
        `${PROOF_GENERATED_PATH}stake_revoked_${stakeParams.nonce.toString(10)}.json`,
        JSON.stringify(proofGenerationUtils.proofData),
      );

      // proof data is generated starting for nonce 0.
      stakeParams.nonce = stakeParams.nonce.addn(1);
    }
  });
});

contract('Redeem and Unstake ', (accounts) => {
  let registeredContracts;
  let redeemParams;
  let rpcEndpointOrigin;
  let proofUtils;
  let web3Provider;
  let proofGenerationUtils;

  before(async () => {
    ({ rpcEndpointOrigin } = await docker());
    web3Provider = new Web3(rpcEndpointOrigin);
    proofUtils = new ProofUtils(web3Provider, web3Provider);
  });

  beforeEach(async () => {
    registeredContracts = await deployer(web3Provider, accounts);
    redeemParams = {
      amount: new BN(1000),
      gasPrice: new BN(1),
      gasLimit: new BN(100),
      nonce: new BN(0),
      redeemer: accounts[0],
      beneficiary: accounts[2],
    };
    proofGenerationUtils = new ProofGenerationUtils(
      registeredContracts,
      null,
      redeemParams,
      proofUtils,
    );
  });

  it('Generates proof data for "Redeem progressed"', async () => {
    const numberOfProofs = 2;

    for (let i = 0; i < numberOfProofs; i++) {
      proofGenerationUtils.resetProofData();
      await proofGenerationUtils.initializeProofData();

      const {
        redeemProofData,
      } = await proofGenerationUtils.populateRedeemProofData();

      const {
        confirmRedeemIntentResult,
      } = await proofGenerationUtils.populateConfirmRedeemIntentProofData(
        redeemProofData,
      );

      const {
        progressRedeemParams,
      } = await proofGenerationUtils.populateProgressRedeemProofData(
        confirmRedeemIntentResult,
      );

      await proofGenerationUtils.populateProgressUnstakeProofData(
        progressRedeemParams,
      );

      // Write the proof data in to the files.
      writeToFile(
        `${PROOF_GENERATED_PATH}redeem_progressed_${redeemParams.nonce.toString(10)}.json`,
        JSON.stringify(proofGenerationUtils.proofData),
      );

      // proof data is generated starting for nonce 0.
      redeemParams.nonce = redeemParams.nonce.addn(1);
    }
  });

  it('Generates proof data for "Redeem revoked"', async () => {
    const numberOfProofs = 2;

    for (let i = 0; i < numberOfProofs; i++) {
      proofGenerationUtils.resetProofData();
      await proofGenerationUtils.initializeProofData();

      const {
        redeemProofData,
        redeemResult,
      } = await proofGenerationUtils.populateRedeemProofData();

      await proofGenerationUtils.populateConfirmRedeemIntentProofData(
        redeemProofData,
      );

      const {
        revertRedeemParams,
        revertRedeemProofData,
      } = await proofGenerationUtils.populateRevertRedeemProofData(
        redeemResult,
      );

      const {
        confirmRevertRedeemProofData,
      } = await proofGenerationUtils.populateConfirmRevertRedeemProofData(
        revertRedeemParams,
        revertRedeemProofData,
      );

      await proofGenerationUtils.populateProgressRevertRedeemProofData(
        revertRedeemParams,
        confirmRevertRedeemProofData,
      );

      // Write the proof data in to the files.
      writeToFile(
        `${PROOF_GENERATED_PATH}redeem_revoked_${redeemParams.nonce.toString(10)}.json`,
        JSON.stringify(proofGenerationUtils.proofData),
      );

      // proof data is generated starting for nonce 0.
      redeemParams.nonce = redeemParams.nonce.addn(1);
    }
  });
});
