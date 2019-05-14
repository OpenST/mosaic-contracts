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

async function verify(pattern, path, merklePatriciaLib) {
  const proofData = FuzzyProofGenerator.generate(pattern, path, Buffer.from('value'));
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

  it('Verifies pattern: l', async () => {
    await verify('l', Buffer.from('path'), merklePatriciaLib);
  });

  it('Verifies pattern: bl', async () => {
    await verify('bl', Buffer.from('path'), merklePatriciaLib);
  });

  it('Verifies pattern: bbl', async () => {
    await verify('bbl', Buffer.from('path'), merklePatriciaLib);
  });

  it('Verifies pattern: ebl', async () => {
    await verify('ebl', Buffer.from('path'), merklePatriciaLib);
  });

  it('Verifies pattern: bebl', async () => {
    await verify('bebl', Buffer.from('path'), merklePatriciaLib);
  });

  it('Verifies pattern: bebbl', async () => {
    await verify('bebl', Buffer.from('path'), merklePatriciaLib);
  });

  it('Verifies pattern: bbebl', async () => {
    await verify('bebbl', Buffer.from('path'), merklePatriciaLib);
  });

  it('Verifies pattern: ebebl', async () => {
    await verify('ebebl', Buffer.from('path'), merklePatriciaLib);
  });

  it('Verifies pattern: ebbebl', async () => {
    await verify('ebbebl', Buffer.from('path'), merklePatriciaLib);
  });

  it('Verifies pattern: ebebbl', async () => {
    await verify('ebebbl', Buffer.from('path'), merklePatriciaLib);
  });

  it('Verifies pattern: bbb', async () => {
    await verify('bbb', Buffer.from('p'), merklePatriciaLib);
  });

  it('Verifies pattern: ebb', async () => {
    await verify('ebb', Buffer.from('path'), merklePatriciaLib);
  });

  it('Verifies pattern: bebb', async () => {
    await verify('bebb', Buffer.from('path'), merklePatriciaLib);
  });

  it('Verifies pattern: bebbb', async () => {
    await verify('bebbb', Buffer.from('path'), merklePatriciaLib);
  });

  it('Verifies pattern: bbebb', async () => {
    await verify('bbebb', Buffer.from('path'), merklePatriciaLib);
  });

  it('Verifies pattern: ebebb', async () => {
    await verify('ebebb', Buffer.from('path'), merklePatriciaLib);
  });

  it('Verifies pattern: ebbebb', async () => {
    await verify('ebbebb', Buffer.from('path'), merklePatriciaLib);
  });

  it('Verifies pattern: ebebbb', async () => {
    await verify('ebebbb', Buffer.from('path'), merklePatriciaLib);
  });
});
