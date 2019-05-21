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

const MerklePatriciaProof = artifacts.require('./MerklePatriciaProof.sol');
const proofJson = require('../data/proof.json');
const generatedProofData = require('../data/generatedProofData.json');
const Utils = require('../test_lib/utils.js');

/** Converts a buffer that was unmarshalled into a JavaScript object into a hex string. */
const jsonBufferToHex = json => `0x${Buffer.from(json).toString('hex')}`;

contract('MerklePatriciaProof.verify()', () => {
  let merklePatriciaLib;

  describe('Test Cases for Account proof verification', async () => {
    before(async () => {
      merklePatriciaLib = await MerklePatriciaProof.deployed();
    });

    it('Should pass when all the parameters are valid', async () => {
      const proofStatus = await merklePatriciaLib.verify.call(
        proofJson.account.sha3EncodedAccount,
        proofJson.account.hashedPath,
        proofJson.account.rlpParentNodes,
        proofJson.account.stateRoot,
      );
      assert.strictEqual(proofStatus, true);

      // Iterate over the stored data set and test all proofs in parallel.
      // The data set was pre-generated with the fuzzy proof generator (see `./tools`).
      await Promise.all(
        generatedProofData.map(
          async (data) => {
            const value = jsonBufferToHex(data.value);
            const path = jsonBufferToHex(data.encodedPath);
            const parentNodes = jsonBufferToHex(data.rlpParentNodes);
            const root = jsonBufferToHex(data.root);

            const result = await merklePatriciaLib.verify.call(
              value,
              path,
              parentNodes,
              root,
            );

            assert.strictEqual(
              result,
              true,
              `Could not verify data point: ${JSON.stringify(data)}`,
            );
          },
        ),
      );
    });

    it('Should fail when path is incorrect', async () => {
      const proofStatus = await merklePatriciaLib.verify.call(
        proofJson.account.sha3EncodedAccount,
        '0x01dB94fdCa0FFeDc40A6965DE97790085d71b413',
        proofJson.account.rlpParentNodes,
        proofJson.account.stateRoot,
      );
      assert.equal(proofStatus, false);
    });

    it('Should fail when state root is incorrect', async () => {
      const proofStatus = await merklePatriciaLib.verify.call(
        proofJson.account.sha3EncodedAccount,
        proofJson.account.hashedPath,
        proofJson.account.rlpParentNodes,
        '0x58810687b84d5bddc1e9e68b2733caa4a8c6c9e7dd5d0b2f9c28b4bbf5c6f851',
      );
      assert.equal(proofStatus, false);
    });

    it('Should fail when rlp parent nodes is incorrect', async () => {
      const proofStatus = await merklePatriciaLib.verify.call(
        proofJson.account.sha3EncodedAccount,
        proofJson.account.hashedPath,
        '0xf908cef90211a0f113fc83479a9dcb7a7b5c98cdb42f2426',
        proofJson.account.stateRoot,
      );
      assert.equal(proofStatus, false);
    });

    it('Should fail when encoded value is incorrect', async () => {
      const proofStatus = await merklePatriciaLib.verify.call(
        '0xf8468206fb80a036ed801abf5678f1506f1fa61e5ccda1f4de53cc7c',
        proofJson.account.hashedPath,
        proofJson.account.rlpParentNodes,
        proofJson.account.stateRoot,
      );
      assert.equal(proofStatus, false);
    });
  });

  describe('Test Cases for Storage proof', async () => {
    it('Should pass for valid variable storage', async () => {
      const proofStatus = await merklePatriciaLib.verify.call(
        proofJson.storage.variable.sha3ValueAtStorage,
        proofJson.storage.variable.path,
        proofJson.storage.variable.rlpParentNodes,
        proofJson.storage.variable.storageRoot,
      );
      assert.equal(proofStatus, true);
    });

    it('Should fail for variable storage when encoded value is incorrect', async () => {
      const proofStatus = await merklePatriciaLib.verify.call(
        '0x468206fb80a036ed801abf5678f1506f1fa61e5ccda1f4de53cc7c',
        proofJson.storage.variable.path,
        proofJson.storage.variable.rlpParentNodes,
        proofJson.storage.variable.storageRoot,
      );
      assert.equal(proofStatus, false);
    });

    it('Should fail for variable storage when encoded path is incorrect', async () => {
      const proofStatus = await merklePatriciaLib.verify.call(
        proofJson.storage.variable.sha3ValueAtStorage,
        '0x290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e522',
        proofJson.storage.variable.rlpParentNodes,
        proofJson.storage.variable.storageRoot,
      );
      assert.equal(proofStatus, false);
    });

    it('Should fail for variable storage when rlp parent nodes is incorrect', async () => {
      await Utils.expectRevert(
        merklePatriciaLib.verify.call(
          proofJson.storage.variable.sha3ValueAtStorage,
          proofJson.storage.variable.path,
          '0x290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e524',
          proofJson.storage.variable.storageRoot,
        ),
      );
    });

    it('Should fail for variable storage when storage root is incorrect', async () => {
      const proofStatus = await merklePatriciaLib.verify.call(
        proofJson.storage.variable.sha3ValueAtStorage,
        proofJson.storage.variable.path,
        proofJson.storage.variable.rlpParentNodes,
        '0xa078cef90211a0f113fc83479a9dcb7a7b5c98cdb42f2426',
      );
      assert.equal(proofStatus, false);
    });

    it('Should pass for valid mapping storage value', async () => {
      const proofStatus = await merklePatriciaLib.verify.call(
        proofJson.storage.mapping.sha3ValueAtStorage,
        proofJson.storage.mapping.path,
        proofJson.storage.mapping.rlpParentNodes,
        proofJson.storage.mapping.storageRoot,
      );
      assert.equal(proofStatus, true);
    });

    it('Should fail for mapping storage value when encoded value is incorrect', async () => {
      const proofStatus = await merklePatriciaLib.verify.call(
        '0x468206fb80a036ed801abf5678f1506f1fa61e5ccda1f4de53cc7c',
        proofJson.storage.mapping.path,
        proofJson.storage.mapping.rlpParentNodes,
        proofJson.storage.mapping.storageRoot,
      );
      assert.equal(proofStatus, false);
    });

    it('Should fail for mapping storage value when encoded path is incorrect', async () => {
      const proofStatus = await merklePatriciaLib.verify.call(
        proofJson.storage.mapping.sha3ValueAtStorage,
        '0x4d6e9a4b1a3576f692c1333198a77a5fb8b72c326f2a4c35eeeaab187773da7a',
        proofJson.storage.mapping.rlpParentNodes,
        proofJson.storage.mapping.storageRoot,
      );
      assert.equal(proofStatus, false);
    });

    it('Should fail for mapping storage value when rlp parent nodes is incorrect', async () => {
      await Utils.expectRevert(
        merklePatriciaLib.verify.call(
          proofJson.storage.mapping.sha3ValueAtStorage,
          proofJson.storage.mapping.path,
          '0x290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e522',
          proofJson.storage.mapping.storageRoot,
        ),
      );
    });

    it('Should fail for mapping storage value when storage root is incorrect', async () => {
      const proofStatus = await merklePatriciaLib.verify.call(
        proofJson.storage.mapping.sha3ValueAtStorage,
        proofJson.storage.mapping.path,
        proofJson.storage.mapping.rlpParentNodes,
        '0xa078cef90211a0f113fc83479a9dcb7a7b5c98cdb42f2426',
      );
      assert.equal(proofStatus, false);
    });

    it('should pass for storage proof containing extension node(dataSet1)', async () => {
      const proofStatus = await merklePatriciaLib.verify.call(
        proofJson.storageProofWithExtensionNode.dataSet1.value,
        proofJson.storageProofWithExtensionNode.dataSet1.path,
        proofJson.storageProofWithExtensionNode.dataSet1.rlpParentNodes,
        proofJson.storageProofWithExtensionNode.dataSet1.root,
      );
      assert.strictEqual(
        proofStatus,
        true,
        'Proof verification failed for storage proof containing extension node',
      );
    });

    it('should pass for storage proof containing extension node(dataSet2)', async () => {
      const proofStatus = await merklePatriciaLib.verify.call(
        proofJson.storageProofWithExtensionNode.dataSet2.value,
        proofJson.storageProofWithExtensionNode.dataSet2.path,
        proofJson.storageProofWithExtensionNode.dataSet2.rlpParentNodes,
        proofJson.storageProofWithExtensionNode.dataSet2.root,
      );
      assert.strictEqual(
        proofStatus,
        true,
        'Proof verification failed for storage proof containing extension node',
      );
    });
  });
});
