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

async function verify(pattern, pathMaxLength, merklePatriciaLib) {
  const proofData = FuzzyProofGenerator.generateByPattern(pattern, pathMaxLength);

  const proofStatus = await merklePatriciaLib.verify.call(
    `0x${proofData.value.toString('hex')}`,
    `0x${proofData.encodedPath.toString('hex')}`,
    `0x${proofData.rlpParentNodes.toString('hex')}`,
    `0x${proofData.root.toString('hex')}`,
  );

  if (!proofStatus) {
    console.log(
      `0x${proofData.value.toString('hex')}`,
      `0x${proofData.encodedPath.toString('hex')}`,
      `0x${proofData.rlpParentNodes.toString('hex')}`,
      `0x${proofData.root.toString('hex')}`,
    );
  }

  assert.strictEqual(proofStatus, true);
}

describe('FuzzyProofGenerator::generate', () => {
  let merklePatriciaLib;

  before(async () => {
    merklePatriciaLib = await MerklePatriciaProof.deployed();
  });

  it('Verifies a pattern with length equal to 1.', async () => {
    await verify('l', 1, merklePatriciaLib);
  });

  it('Verifies a pattern with length equal to 2.', async () => {
    await verify('bl', 2, merklePatriciaLib);
  });

  it('Verifies a pattern with length equal to 5.', async () => {
    await verify('ebebl', 5, merklePatriciaLib);
  });

  it('Verifies a pattern with length equal to 40.', async () => {
    await verify('bbebebbbebl', 40, merklePatriciaLib);
  });
});
