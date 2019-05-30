/* eslint-disable @typescript-eslint/no-var-requires */
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


const assert = require('assert');
const FuzzyProofGenerator = require('../../src/FuzzyProofGenerator').default;

const MerklePatriciaProof = artifacts.require('./MerklePatriciaProof.sol');

const TEST_PATH_LENGTHS = [1, 2, 3, 5, 8, 13, 21, 34, 55];
const TEST_VALUE_LENGTHS = [1, 2, 3, 5, 8, 13, 21, 34, 55];

async function verifyProof(pattern, pathMaxLength, valueMaxLength, merklePatriciaLib) {
  const proofData = FuzzyProofGenerator.generateByPattern(
    pattern, pathMaxLength, valueMaxLength,
  );

  const proofStatus = await merklePatriciaLib.verify.call(
    `0x${proofData.value.toString('hex')}`,
    `0x${proofData.encodedPath.toString('hex')}`,
    `0x${proofData.rlpParentNodes.toString('hex')}`,
    `0x${proofData.root.toString('hex')}`,
  );

  if (!proofStatus) {
    console.log(
      proofData.pattern,
      `0x${proofData.value.toString('hex')}`,
      `0x${proofData.encodedPath.toString('hex')}`,
      `0x${proofData.rlpParentNodes.toString('hex')}`,
      `0x${proofData.root.toString('hex')}`,
    );
  }

  assert.strictEqual(proofStatus, true);
}

async function verifyProofs(pattern, merklePatriciaLib) {
  for (let i = 0; i < TEST_PATH_LENGTHS.length; i += 1) {
    for (let j = 0; j < TEST_VALUE_LENGTHS.length; j += 1) {
      // eslint-disable-next-line no-await-in-loop
      await verifyProof(
        pattern,
        Math.max(TEST_PATH_LENGTHS[i], Math.ceil(pattern.length / 2)),
        Math.max(TEST_VALUE_LENGTHS[j], Math.ceil(pattern.length / 2)),
        merklePatriciaLib,
      );
    }
  }
}

describe('FuzzyProofGenerator::generateByPattern', () => {
  let merklePatriciaLib;

  before(async () => {
    merklePatriciaLib = await MerklePatriciaProof.deployed();
  });

  it('Pattern: l', async () => {
    await verifyProofs('l', merklePatriciaLib);
  }).timeout(0);

  it('Pattern: bl', async () => {
    await verifyProofs('bl', merklePatriciaLib);
  }).timeout(0);

  it('Pattern: ebb', async () => {
    await verifyProofs('ebebl', merklePatriciaLib);
  }).timeout(0);

  it('Pattern: ebebl', async () => {
    await verifyProofs('ebebl', merklePatriciaLib);
  }).timeout(0);

  it('Pattern: eebebb', async () => {
    await verifyProofs('ebebl', merklePatriciaLib);
  }).timeout(0);

  it('Pattern: bbebebbbebl', async () => {
    await verifyProofs('bbebebbbebl', merklePatriciaLib);
  }).timeout(0);
});
