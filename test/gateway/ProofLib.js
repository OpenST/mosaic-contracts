  // Copyright 2017 OpenST Ltd.
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
  // Based on the SafeMath library by the OpenZeppelin team.
  // Copyright (c) 2016 Smart Contract Solutions, Inc.
  // https://github.com/OpenZeppelin/zeppelin-solidity
  // The MIT License.
  // ----------------------------------------------------------------------------

  const BigNumber = require('bignumber.js');

  const rootPrefix = "../.."
      , proofData = require( rootPrefix + "/test/data/proof.json" )
      , Utils = require(rootPrefix + '/test/lib/utils')
      , ProofLib = artifacts.require("./ProofLibTest.sol");

  contract('ProofLib', function (accounts) {
      let ProofLibContract;

      before(async function () {
          ProofLibContract = await ProofLib.new();
      });

      describe('Storage Path', function () {
          const dataSet1 = proofData.storagePath.dataSet1
              , dataSet2 = proofData.storagePath.dataSet2;

          it('Should generate correct storage path [DataSet1]', async function () {
              let storageIndex = new BigNumber(dataSet1.storageIndex);
              let mappingKey = dataSet1.mappingKey;
              let expectedPath = dataSet1.expectedPath;

              let result = await ProofLibContract.storageVariablePath(storageIndex.toString(16), mappingKey);

              assert.equal(expectedPath, result);
          });

          it('Should generate correct storage path [DataSet2]', async function () {
              let storageIndex = new BigNumber(dataSet2.storageIndex);
              let mappingKey = dataSet2.mappingKey;
              let expectedPath = dataSet2.expectedPath;

              let result = await ProofLibContract.storageVariablePath(storageIndex.toString(16), mappingKey);

              assert.equal(expectedPath, result);
          });
      });

      describe('Verify intent storage for redeem', function () {
          const dataSet1 = proofData.redemptionProof.dataSet1
              , dataSet2 = proofData.redemptionProof.dataSet2;
          it('Should verify intent storage [Redemption dataSet1]', async function () {
              const result = await ProofLibContract.verifyIntentStorage.call(
                  dataSet1.storageIndex,
                  dataSet1.redeemer,
                  dataSet1.redeemerNonce,
                  dataSet1.redemptionIntentHash,
                  dataSet1.rlpParentNodes,
                  dataSet1.storageRoot);

              assert.equal(true, result);
          });

          it('Should verify intent storage [Redemption dataSet2]', async function () {
              const result = await ProofLibContract.verifyIntentStorage.call(
                  dataSet2.storageIndex,
                  dataSet2.redeemer,
                  dataSet2.redeemerNonce,
                  dataSet2.redemptionIntentHash,
                  dataSet2.rlpParentNodes,
                  dataSet2.storageRoot);

              assert.equal(true, result);
          });

          it('Should fail to verify intent storage when storageIndex is incorrect', async function () {
              await Utils.expectThrow(ProofLibContract.verifyIntentStorage.call(
                  new BigNumber(3),
                  dataSet2.redeemer,
                  dataSet2.redeemerNonce,
                  dataSet2.redemptionIntentHash,
                  dataSet2.rlpParentNodes,
                  dataSet2.storageRoot));
          });

          it('Should fail to verify intent storage when redeemer is incorrect', async function () {
              await Utils.expectThrow(ProofLibContract.verifyIntentStorage.call(
                  dataSet2.storageIndex,
                  dataSet1.redeemer,
                  dataSet2.redeemerNonce,
                  dataSet2.redemptionIntentHash,
                  dataSet2.rlpParentNodes,
                  dataSet2.storageRoot));
          });

          it('Should fail to verify intent storage when redeemerNonce is incorrect', async function () {
              await Utils.expectThrow(ProofLibContract.verifyIntentStorage.call(
                  dataSet2.storageIndex,
                  dataSet2.redeemer,
                  dataSet1.redeemerNonce,
                  dataSet2.redemptionIntentHash,
                  dataSet2.rlpParentNodes,
                  dataSet2.storageRoot));
          });

          it('Should fail to verify intent storage when storageRoot is incorrect', async function () {
              await Utils.expectThrow(ProofLibContract.verifyIntentStorage(
                  dataSet2.storageIndex,
                  dataSet2.redeemer,
                  dataSet2.redeemerNonce,
                  dataSet2.redemptionIntentHash,
                  dataSet2.rlpParentNodes,
                  dataSet1.redemptionIntentHash));
          });

          it('Should fail to verify intent storage when redemptionIntentHash is incorrect', async function () {
              await Utils.expectThrow(ProofLibContract.verifyIntentStorage.call(
                  dataSet2.storageIndex,
                  dataSet2.redeemer,
                  dataSet2.redeemerNonce,
                  dataSet1.redemptionIntentHash,
                  dataSet2.rlpParentNodes,
                  dataSet2.storageRoot));
          });

          it('Should fail to verify intent storage when rlpParentNodes is incorrect', async function () {
              await Utils.expectThrow(ProofLibContract.verifyIntentStorage.call(
                  dataSet2.storageIndex,
                  dataSet2.redeemer,
                  dataSet2.redeemerNonce,
                  dataSet2.redemptionIntentHash,
                  dataSet1.rlpParentNodes,
                  dataSet2.storageRoot));
          });
      });
  });