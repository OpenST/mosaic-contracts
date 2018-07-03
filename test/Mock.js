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
  // Utility chain: OpenSTUtility
  //
  // http://www.simpletoken.org/
  //
  // Based on the SafeMath library by the OpenZeppelin team.
  // Copyright (c) 2016 Smart Contract Solutions, Inc.
  // https://github.com/OpenZeppelin/zeppelin-solidity
  // The MIT License.
  // ----------------------------------------------------------------------------

  const BigNumber = require('bignumber.js');
  const util = require('ethereumjs-util');
  const web3 = require('web3');

  var Mock = artifacts.require('./Mock.sol');
  var hasher = artifacts.require('./Hasher.sol');

  const rootPrefix = ".."
      , proofData = require( rootPrefix+ "/test/data/proof.json" )
      , Utils = require(rootPrefix+'/test/lib/utils');

  contract('OpenSTUtils', function (accounts) {
      let mockContract;

      before(async function () {
          mockContract = await Mock.new();
      });

      describe('Storage Path', function () {
          const dataSet1 = proofData.storagePath.dataSet1
              , dataSet2 = proofData.storagePath.dataSet2;

          it('Should generate correct storage path [DataSet1]', async function () {
              let storageIndex = new BigNumber(dataSet1.storageIndex);
              let mappingKey = dataSet1.mappingKey;
              let expectedPath = dataSet1.expectedPath;

              let result = await mockContract.storagePath(storageIndex.toString(16), mappingKey);

              assert.equal(expectedPath, result);
          });

          it('Should generate correct storage path [DataSet2]', async function () {
              let storageIndex = new BigNumber(dataSet2.storageIndex);
              let mappingKey = dataSet2.mappingKey;
              let expectedPath = dataSet2.expectedPath;

              let result = await mockContract.storagePath(storageIndex.toString(16), mappingKey);

              assert.equal(expectedPath, result);
          });
      });

      describe('Verify intent storage for redeem', function () {
          const dataSet1 = proofData.redemptionProof.dataSet1
              , dataSet2 = proofData.redemptionProof.dataSet2;
          it('Should verify intent storage [Redemption dataSet1]', async function () {
              const result = await mockContract.verifyIntentStorage.call(
                  dataSet1.storageIndex,
                  dataSet1.redeemer,
                  dataSet1.redeemerNonce,
                  dataSet1.storageRoot,
                  dataSet1.redemptionIntentHash,
                  dataSet1.rlpParentNodes);

              assert.equal(true, result);
          });

          it('Should verify intent storage [Redemption dataSet2]', async function () {
              const result = await mockContract.verifyIntentStorage.call(
                  dataSet2.storageIndex,
                  dataSet2.redeemer,
                  dataSet2.redeemerNonce,
                  dataSet2.storageRoot,
                  dataSet2.redemptionIntentHash,
                  dataSet2.rlpParentNodes);

              assert.equal(true, result);
          });

          it('Should fail to verify intent storage when storageIndex is incorrect', async function () {
              await Utils.expectThrow(mockContract.verifyIntentStorage.call(
                  new BigNumber(3),
                  dataSet2.redeemer,
                  dataSet2.redeemerNonce,
                  dataSet2.storageRoot,
                  dataSet2.redemptionIntentHash,
                  dataSet2.rlpParentNodes));
          });

          it('Should fail to verify intent storage when redeemer is incorrect', async function () {
              await Utils.expectThrow(mockContract.verifyIntentStorage.call(
                  dataSet2.storageIndex,
                  dataSet1.redeemer,
                  dataSet2.redeemerNonce,
                  dataSet2.storageRoot,
                  dataSet2.redemptionIntentHash,
                  dataSet2.rlpParentNodes));
          });

          it('Should fail to verify intent storage when redeemerNonce is incorrect', async function () {
              await Utils.expectThrow(mockContract.verifyIntentStorage.call(
                  dataSet2.storageIndex,
                  dataSet2.redeemer,
                  dataSet1.redeemerNonce,
                  dataSet2.storageRoot,
                  dataSet2.redemptionIntentHash,
                  dataSet2.rlpParentNodes));
          });

          it('Should fail to verify intent storage when storageRoot is incorrect', async function () {
              await Utils.expectThrow(mockContract.verifyIntentStorage(
                  dataSet2.storageIndex,
                  dataSet2.redeemer,
                  dataSet2.redeemerNonce,
                  dataSet1.redemptionIntentHash,
                  dataSet2.redemptionIntentHash,
                  dataSet2.rlpParentNodes));
          });

          it('Should fail to verify intent storage when redemptionIntentHash is incorrect', async function () {
              await Utils.expectThrow(mockContract.verifyIntentStorage.call(
                  dataSet2.storageIndex,
                  dataSet2.redeemer,
                  dataSet2.redeemerNonce,
                  dataSet2.storageRoot,
                  dataSet1.redemptionIntentHash,
                  dataSet2.rlpParentNodes));
          });

          it('Should fail to verify intent storage when rlpParentNodes is incorrect', async function () {
              await Utils.expectThrow(mockContract.verifyIntentStorage.call(
                  dataSet2.storageIndex,
                  dataSet2.redeemer,
                  dataSet2.redeemerNonce,
                  dataSet2.storageRoot,
                  dataSet2.redemptionIntentHash,
                  dataSet1.rlpParentNodes));
          });

        /*  it('Should generate correct storage path', async function () {
              var bytes32UUID = web3.utils.soliditySha3(2);
              var addressRedeemer = accounts[2];
              var uint256RedeemerNonce = 1;
              var addressBeneficiary = accounts[3];
              var uint256AmountUT = 100;
              var uint256RedemptionUnlockHeight = 200
              var bytes32HashLock = web3.utils.soliditySha3(3);


              //set 1
              // var bytes32UUID = web3.utils.soliditySha3(0);
              // var addressRedeemer = accounts[0];
              // var uint256RedeemerNonce = 0;
              // var addressBeneficiary = accounts[1];
              // var uint256AmountUT = 10;
              // var uint256RedemptionUnlockHeight = 100
              // var bytes32HashLock = web3.utils.soliditySha3(1);
              //value:  0xe9b4840066c399dde8e90bef68ea9a3b81b979c0a51fe819ac008cc84736bf34
              //key:  0x571f2c23fe07742677f468ede63fd1262bcc79dc1e7132cd6eef476f1bf1b124



              //set 2
              // var bytes32UUID = web3.utils.soliditySha3(2);
              // var addressRedeemer = accounts[2];
              // var uint256RedeemerNonce = 1;
              // var addressBeneficiary = accounts[3];
              // var uint256AmountUT = 100;
              // var uint256RedemptionUnlockHeight = 200
              // var bytes32HashLock = web3.utils.soliditySha3(3);
              //value:  0x85d8990c3d618bff153ca600cc8cbef1dcae091a2efa72cb4a9f5a1759090d0d
              //key:  0xef520ae68ad2c1398c2f3a239869a611c7b4cc30cf3112a7ff705e0e2bf0b537

              let result =  await mockContract.createData.call(bytes32UUID,
                  addressRedeemer,
                  uint256RedeemerNonce,
                  addressBeneficiary,
                  uint256AmountUT,
                  uint256RedemptionUnlockHeight,
                  bytes32HashLock);

              console.log("result: ",result);
          });

          it('Should generate correct storage path', async function () {

              var bytes32UUID = web3.utils.soliditySha3(0);
              var addressRedeemer = accounts[0];
              var uint256RedeemerNonce = 0;
              var addressBeneficiary = accounts[1];
              var uint256AmountUT = 10;
              var uint256RedemptionUnlockHeight = 100
              var bytes32HashLock = web3.utils.soliditySha3(1);

              console.log("bytes32UUID: ",bytes32UUID);
              console.log("addressRedeemer: ",addressRedeemer);
              console.log("uint256RedeemerNonce: ",uint256RedeemerNonce);
              console.log("addressBeneficiary: ",addressBeneficiary);
              console.log("uint256AmountUT: ",uint256AmountUT);
              console.log("uint256RedemptionUnlockHeight: ",uint256RedemptionUnlockHeight);
              console.log("bytes32HashLock: ",bytes32HashLock);


              let storageIndex = new BigNumber(1);
              let storageRoot = "0x3c07c8f6cffe2687a45fd960e79a901d7ca4c32ced27943a5246dd392e98ec85";
              let intentHash = "0xe9b4840066c399dde8e90bef68ea9a3b81b979c0a51fe819ac008cc84736bf34";
              let rlpEncodedParentNodes = "0xf9012bf8918080a011eb05caf5fa62e9b0fffc9118cf6c7a6f10870db11d837223bf585fc7283b2c80a07b52b0a189ce7d8d338f576b43b4074ebfc0a51ee4b1b02c9561b75d23ac35908080a0f78f9e2d4859c3834ed1f457485c634bbb5860c9c9686de6c07c653f8634159680808080a080fe60a794b389787491aa22e649e659a14f7498ea80585e881874ac18964a5680808080f851a0253d33639fdada4c4907913dcb5b92a73e1ff478fd3e9093cd0dd510c6bd108a808080808080808080808080a06d09ce3e89bf788cd8a7eb11db585a608734e6d00a05725130612630f360c95b808080f843a0206e9a4b1a3576f692c1333198a77a5fb8b72c326f2a4c35eeeaab187773da7fa1a0e9b4840066c399dde8e90bef68ea9a3b81b979c0a51fe819ac008cc84736bf34";

              var result = await mockContract.verifyIntentStorage.call(
                  storageIndex,
                  addressRedeemer,
                  uint256RedeemerNonce,
                  storageRoot,
                  intentHash,
                  rlpEncodedParentNodes);

              assert.equal(true, result);

              result = await mockContract.getPath.call(
                  storageIndex,
                  addressRedeemer,
                  uint256RedeemerNonce,
                  storageRoot,
                  intentHash,
                  rlpEncodedParentNodes);
              console.log("result: ",result)
          });

          it('Should generate correct storage path', async function () {

              var bytes32UUID = web3.utils.soliditySha3(2);
              var addressRedeemer = accounts[2];
              var uint256RedeemerNonce = 1;
              var addressBeneficiary = accounts[3];
              var uint256AmountUT = 100;
              var uint256RedemptionUnlockHeight = 200;
              var bytes32HashLock = web3.utils.soliditySha3(3);
              //value:  0x85d8990c3d618bff153ca600cc8cbef1dcae091a2efa72cb4a9f5a1759090d0d
              //key:  0xef520ae68ad2c1398c2f3a239869a611c7b4cc30cf3112a7ff705e0e2bf0b537

              console.log("bytes32UUID: ",bytes32UUID);
              console.log("addressRedeemer: ",addressRedeemer);
              console.log("uint256RedeemerNonce: ",uint256RedeemerNonce);
              console.log("addressBeneficiary: ",addressBeneficiary);
              console.log("uint256AmountUT: ",uint256AmountUT);
              console.log("uint256RedemptionUnlockHeight: ",uint256RedemptionUnlockHeight);
              console.log("bytes32HashLock: ",bytes32HashLock);



              let storageIndex = new BigNumber(1);
              let storageRoot = "0x3c07c8f6cffe2687a45fd960e79a901d7ca4c32ced27943a5246dd392e98ec85";
              let intentHash = "0x85d8990c3d618bff153ca600cc8cbef1dcae091a2efa72cb4a9f5a1759090d0d";
              let rlpEncodedParentNodes = "0xf8d8f8918080a011eb05caf5fa62e9b0fffc9118cf6c7a6f10870db11d837223bf585fc7283b2c80a07b52b0a189ce7d8d338f576b43b4074ebfc0a51ee4b1b02c9561b75d23ac35908080a0f78f9e2d4859c3834ed1f457485c634bbb5860c9c9686de6c07c653f8634159680808080a080fe60a794b389787491aa22e649e659a14f7498ea80585e881874ac18964a5680808080f843a03b10814667a046030d1db1bb359b8c06192de369d9de2d2bac70d8858b399d10a1a085d8990c3d618bff153ca600cc8cbef1dcae091a2efa72cb4a9f5a1759090d0d";

              var result = await mockContract.verifyIntentStorage.call(
                  storageIndex,
                  addressRedeemer,
                  uint256RedeemerNonce,
                  storageRoot,
                  intentHash,
                  rlpEncodedParentNodes);

              assert.equal(true, result);

              result = await mockContract.getPath.call(
                  storageIndex,
                  addressRedeemer,
                  uint256RedeemerNonce,
                  storageRoot,
                  intentHash,
                  rlpEncodedParentNodes);
              console.log("result: ",result)

          });
          */
      });
  });