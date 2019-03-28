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

const BN = require('bn.js');
const web3 = require('../../test_lib/web3.js');

const EventsDecoder = require('../../test_lib/event_decoder.js');
const Utils = require('../../test_lib/utils.js');
const MetaBlockUtils = require('../../test_lib/meta_block.js');
const MosaicCoreUtils = require('./helpers/utils');

const MosaicCore = artifacts.require('MosaicCore');
const MockToken = artifacts.require('MockToken');

const minimumWeight = new BN('1');
const initialGas = 0;
const transactionRoot = web3.utils.sha3('1');
const maxAccumulateGasLimit = new BN(105000);

let mosaicCore;
let transitionHash;
let vote;
let erc20;
let auxiliaryCoreIdentifier;
let kernelHash = web3.utils.sha3('1');
let initialValidators;
let initialDepositors;
let initialStakes;
let requiredWeight;
let stakeAddress;
let tokenDeployer;

async function proposeMetaBlock() {
  const height = 1;
  const auxiliaryDynasty = 50;
  const auxiliaryBlockHash = web3.utils.sha3('1');
  const gas = 1000;
  const originDynasty = 1;
  const originBlockHash = web3.utils.sha3('1');

  const tx = await mosaicCore.proposeBlock(
    height,
    auxiliaryCoreIdentifier,
    kernelHash,
    auxiliaryDynasty,
    auxiliaryBlockHash,
    gas,
    originDynasty,
    originBlockHash,
    transactionRoot,
  );
  const events = EventsDecoder.perform(tx.receipt, mosaicCore.address, mosaicCore.abi);

  assert.equal(
    events.BlockProposed.height,
    height,
    `Meta-block should be proposed for height ${height}`,
  );

  transitionHash = events.BlockProposed.transitionHash;
}

contract('MosaicCore.verifyVote()', async (accounts) => {
  beforeEach(async () => {
    [auxiliaryCoreIdentifier] = accounts;

    initialDepositors = [
      accounts[2],
      accounts[3],
      accounts[4],
    ];
    initialValidators = [
      accounts[5],
      accounts[6],
      accounts[7],
    ];
    initialStakes = [
      new BN('100'),
      new BN('2000'),
      new BN('30000'),
    ];
    requiredWeight = new BN(21400);

    [tokenDeployer] = accounts;
    erc20 = await MockToken.new({ from: tokenDeployer });

    mosaicCore = await MosaicCore.new(
      auxiliaryCoreIdentifier,
      erc20.address,
      initialGas,
      transactionRoot,
      minimumWeight,
      maxAccumulateGasLimit,
    );
    stakeAddress = await mosaicCore.stake.call();

    await MosaicCoreUtils.initializeStakeContract(
      stakeAddress,
      erc20,
      tokenDeployer,
      initialDepositors,
      initialStakes,
      initialValidators,
    );

    await proposeMetaBlock();

    vote = {
      coreIdentifier: auxiliaryCoreIdentifier,
      transitionHash,
      source: '0xe03b82d609dd4c84cdf0e94796d21d65f56b197405f983e593ac4302d38a112b',
      target: '0x4bd8f94ba769f24bf30c09d4a3575795a776f76ca6f772893618943ea2dab9ce',
      sourceHeight: new BN('1'),
      targetHeight: new BN('2'),
    };
  });

  it('should be able to verify vote for proposed meta-block', async () => {
    const expectedVerifiedWeight = new BN(initialStakes[0]);

    await MosaicCoreUtils.verifyVote(
      initialStakes[0],
      initialValidators[0],
      vote,
      mosaicCore,
      kernelHash,
      expectedVerifiedWeight,
      requiredWeight,
    );
  });

  it('should not be able to verify already verified vote.', async () => {
    const validator = initialValidators[0];

    const sig = await MetaBlockUtils.signVote(validator, vote);

    const expectedVerifiedWeight = new BN(initialStakes[0]);

    await MosaicCoreUtils.verifyVote(
      initialStakes[0],
      validator,
      vote,
      mosaicCore,
      kernelHash,
      expectedVerifiedWeight,
      requiredWeight,
    );

    await Utils.expectThrow(
      mosaicCore.verifyVote(
        kernelHash,
        vote.coreIdentifier,
        vote.transitionHash,
        vote.source,
        vote.target,
        vote.sourceHeight,
        vote.targetHeight,
        sig.v,
        sig.r,
        sig.s,
      ),
      'Vote already verified for this validator.',
    );
  });

  it('should not verify vote for validator with zero weight.', async () => {
    const validator = web3.utils.toChecksumAddress(accounts[0]);

    const sig = await MetaBlockUtils.signVote(validator, vote);

    await Utils.expectThrow(
      mosaicCore.verifyVote(
        kernelHash,
        vote.coreIdentifier,
        vote.transitionHash,
        vote.source,
        vote.target,
        vote.sourceHeight,
        vote.targetHeight,
        sig.v,
        sig.r,
        sig.s,
      ),
      'Only validator with non zero weight can vote.',
    );
  });

  it('should increase total weight on successful verification of vote', async () => {
    let expectedVerifiedWeight = new BN(initialStakes[0]);

    await MosaicCoreUtils.verifyVote(
      initialStakes[0],
      initialValidators[0],
      vote,
      mosaicCore,
      kernelHash,
      expectedVerifiedWeight,
      requiredWeight,
    );

    expectedVerifiedWeight = expectedVerifiedWeight.add(new BN(initialStakes[1]));

    await MosaicCoreUtils.verifyVote(
      initialStakes[1],
      initialValidators[1],
      vote,
      mosaicCore,
      kernelHash,
      expectedVerifiedWeight,
      requiredWeight,
    );
  });

  it('should not verify vote for validator with wrong signature', async () => {
    const sig = {
      v: 28,
      r: web3.utils.sha3('invalid r'),
      s: web3.utils.sha3('invalid s'),
    };

    await Utils.expectThrow(
      mosaicCore.verifyVote(
        kernelHash,
        vote.coreIdentifier,
        vote.transitionHash,
        vote.source,
        vote.target,
        vote.sourceHeight,
        vote.targetHeight,
        sig.v,
        sig.r,
        sig.s,
      ),
      'Only validator with non zero weight can vote.',
    );
  });

  it('should not verify vote for transition hash which is not proposed', async () => {
    const validator = initialValidators[0];

    const sig = await MetaBlockUtils.signVote(validator, vote);

    const wrongTransitionHash = web3.utils.sha3('wrong transition hash');

    await Utils.expectThrow(
      mosaicCore.verifyVote(
        kernelHash,
        vote.coreIdentifier,
        wrongTransitionHash,
        vote.source,
        vote.target,
        vote.sourceHeight,
        vote.targetHeight,
        sig.v,
        sig.r,
        sig.s,
      ),
      'A vote can only be verified for an existing meta-block proposal.',
    );
  });

  it('should not verify vote for invalid kernel hash ', async () => {
    const validator = initialValidators[0];

    const sig = await MetaBlockUtils.signVote(validator, vote);

    kernelHash = web3.utils.sha3('wrong kernel hash');

    await Utils.expectThrow(
      mosaicCore.verifyVote(
        kernelHash,
        vote.coreIdentifier,
        vote.transitionHash,
        vote.source,
        vote.target,
        vote.sourceHeight,
        vote.targetHeight,
        sig.v,
        sig.r,
        sig.s,
      ),
      'A vote can only be verified for an existing meta-block proposal.',
    );
  });

  it('should not verify vote for invalid core identifier', async () => {
    const validator = initialValidators[0];

    const sig = await MetaBlockUtils.signVote(validator, vote);

    const wrongCoreIdentifier = accounts[8];

    await Utils.expectThrow(
      mosaicCore.verifyVote(
        kernelHash,
        wrongCoreIdentifier,
        vote.transitionHash,
        vote.source,
        vote.target,
        vote.sourceHeight,
        vote.targetHeight,
        sig.v,
        sig.r,
        sig.s,
      ),
      'Core identifier must match with auxiliary core identifier.',
    );
  });
});

contract('MosaicCore.verifyVote() [commit meta-block]', async (accounts) => {
  beforeEach(async () => {
    [auxiliaryCoreIdentifier] = accounts;
    [tokenDeployer] = accounts;
    erc20 = await MockToken.new({ from: tokenDeployer });

    mosaicCore = await MosaicCore.new(
      auxiliaryCoreIdentifier,
      erc20.address,
      initialGas,
      transactionRoot,
      minimumWeight,
      maxAccumulateGasLimit,
    );

    kernelHash = await mosaicCore.openKernelHash.call();
    await proposeMetaBlock();

    vote = {
      coreIdentifier: auxiliaryCoreIdentifier,
      transitionHash,
      source: '0xe03b82d609dd4c84cdf0e94796d21d65f56b197405f983e593ac4302d38a112b',
      target: '0x4bd8f94ba769f24bf30c09d4a3575795a776f76ca6f772893618943ea2dab9ce',
      sourceHeight: new BN('1'),
      targetHeight: new BN('2'),
    };

    stakeAddress = await mosaicCore.stake.call();
  });

  it('should commit a meta-block if 2/3 super majority is'
        + ' achieved.', async () => {
    initialDepositors = [
      accounts[2],
      accounts[3],
      accounts[4],
    ];
    initialValidators = [
      accounts[5],
      accounts[6],
      accounts[7],
    ];
    initialStakes = [
      new BN('100'),
      new BN('100'),
      new BN('100'),
    ];

    await MosaicCoreUtils.initializeStakeContract(
      stakeAddress,
      erc20,
      tokenDeployer,
      initialDepositors,
      initialStakes,
      initialValidators,
    );

    let expectedVerifiedWeight = new BN(initialStakes[0]);
    const expectedRequiredWeight = new BN(200);

    await MosaicCoreUtils.verifyVote(
      initialStakes[0],
      initialValidators[0],
      vote,
      mosaicCore,
      kernelHash,
      expectedVerifiedWeight,
      expectedRequiredWeight,
    );

    expectedVerifiedWeight = expectedVerifiedWeight.add(new BN(initialStakes[1]));

    const events = await MosaicCoreUtils.verifyVote(
      initialStakes[1],
      initialValidators[1],
      vote,
      mosaicCore,
      kernelHash,
      expectedVerifiedWeight,
      expectedRequiredWeight,
    );

    const expectedHeight = 1;

    const head = await mosaicCore.head.call();

    MosaicCoreUtils.assertCommitMetaBlock(
      events,
      expectedHeight,
      kernelHash,
      vote.transitionHash,
      head,
      expectedRequiredWeight,
      expectedVerifiedWeight,
    );
  });

  it('should not commit a meta-block if 2/3 super majority is not'
        + ' achieved.', async () => {
    initialDepositors = [
      accounts[2],
      accounts[3],
      accounts[4],
    ];
    initialValidators = [
      accounts[5],
      accounts[6],
      accounts[7],
    ];
    initialStakes = [
      new BN('100'),
      new BN('100'),
      new BN('100'),
    ];

    await MosaicCoreUtils.initializeStakeContract(
      stakeAddress,
      erc20,
      tokenDeployer,
      initialDepositors,
      initialStakes,
      initialValidators,
    );

    const expectedVerifiedWeight = new BN(initialStakes[0]);
    const expectedRequiredWeight = new BN(200);

    const events = await MosaicCoreUtils.verifyVote(
      initialStakes[0],
      initialValidators[0],
      vote,
      mosaicCore,
      kernelHash,
      expectedVerifiedWeight,
      expectedRequiredWeight,
    );

    assert(
      events.MetaBlockCommitted === undefined,
      'Commit meta-block event is emitted',
    );
  });

  it('should not commit meta-block due to rounding error ', async () => {
    initialDepositors = [
      accounts[2],
      accounts[3],
      accounts[4],
    ];
    initialValidators = [
      accounts[5],
      accounts[6],
      accounts[7],
    ];
    initialStakes = [
      new BN(2),
      new BN(1),
      new BN(1),
    ];

    await MosaicCoreUtils.initializeStakeContract(
      stakeAddress,
      erc20,
      tokenDeployer,
      initialDepositors,
      initialStakes,
      initialValidators,
    );

    const expectedVerifiedWeight = new BN(initialStakes[0]);
    const expectedRequiredWeight = new BN(3);

    const events = await MosaicCoreUtils.verifyVote(
      initialStakes[0],
      initialValidators[0],
      vote,
      mosaicCore,
      kernelHash,
      expectedVerifiedWeight,
      expectedRequiredWeight,
    );

    assert(
      events.MetaBlockCommitted === undefined,
      'Commit meta-block event is emitted',
    );
  });

  it('should open new kernel on meta-block commit', async () => {
    initialDepositors = [
      accounts[2],
      accounts[3],
      accounts[4],
    ];
    initialValidators = [
      accounts[5],
      accounts[6],
      accounts[7],
    ];
    initialStakes = [
      new BN('100'),
      new BN('100'),
      new BN('100'),
    ];

    await MosaicCoreUtils.initializeStakeContract(
      stakeAddress,
      erc20,
      tokenDeployer,
      initialDepositors,
      initialStakes,
      initialValidators,
    );

    let expectedVerifiedWeight = new BN(initialStakes[0]);
    const expectedRequiredWeight = new BN(200);

    await MosaicCoreUtils.verifyVote(
      initialStakes[0],
      initialValidators[0],
      vote,
      mosaicCore,
      kernelHash,
      expectedVerifiedWeight,
      expectedRequiredWeight,
    );

    expectedVerifiedWeight = expectedVerifiedWeight.add(new BN(initialStakes[1]));

    const events = await MosaicCoreUtils.verifyVote(
      initialStakes[1],
      initialValidators[1],
      vote,
      mosaicCore,
      kernelHash,
      expectedVerifiedWeight,
      expectedRequiredWeight,
    );

    const expectedHeight = 1;

    const head = await mosaicCore.head.call();

    MosaicCoreUtils.assertCommitMetaBlock(
      events,
      expectedHeight,
      kernelHash,
      vote.transitionHash,
      head,
      expectedRequiredWeight,
      expectedVerifiedWeight,
    );

    const kernel = {
      height: 2,
      parent: head,
      updatedValidators: [],
      updatedWeights: [],
    };

    const openKernel = await mosaicCore.openKernel.call();

    const openKernelHash = await mosaicCore.openKernelHash.call();

    const expectedKernelHash = '0xb94e25ddd9ce2be28e1a66c2e0b5ac998573f23d089880aa9c3b8c96ef36221c';

    assert.equal(
      kernel.height,
      openKernel.height,
      'Expected open kernel height is different for actual kernel.',
    );

    assert.equal(
      kernel.parent,
      openKernel.parent,
      'Expected open kernel parent is different for actual kernel.',
    );

    assert.equal(
      expectedKernelHash,
      openKernelHash,
      'Expected open kernel hash is different for actual kernel hash.',
    );
  });

  it('should update head to latest committed meta-block', async () => {
    initialDepositors = [
      accounts[2],
      accounts[3],
      accounts[4],
    ];
    initialValidators = [
      accounts[5],
      accounts[6],
      accounts[7],
    ];
    initialStakes = [
      new BN('100'),
      new BN('100'),
      new BN('100'),
    ];

    await MosaicCoreUtils.initializeStakeContract(
      stakeAddress,
      erc20,
      tokenDeployer,
      initialDepositors,
      initialStakes,
      initialValidators,
    );

    let expectedVerifiedWeight = new BN(initialStakes[0]);
    const expectedRequiredWeight = new BN(200);

    await MosaicCoreUtils.verifyVote(
      initialStakes[0],
      initialValidators[0],
      vote,
      mosaicCore,
      kernelHash,
      expectedVerifiedWeight,
      expectedRequiredWeight,
    );

    expectedVerifiedWeight = expectedVerifiedWeight.add(new BN(initialStakes[1]));

    const events = await MosaicCoreUtils.verifyVote(
      initialStakes[1],
      initialValidators[1],
      vote,
      mosaicCore,
      kernelHash,
      expectedVerifiedWeight,
      expectedRequiredWeight,
    );

    const expectedHeight = 1;

    const head = await mosaicCore.head.call();

    MosaicCoreUtils.assertCommitMetaBlock(
      events,
      expectedHeight,
      kernelHash,
      vote.transitionHash,
      head,
      expectedRequiredWeight,
      expectedVerifiedWeight,
    );

    const expectedHead = MetaBlockUtils.hashMetaBlock(kernelHash, vote.transitionHash);

    assert.equal(
      expectedHead,
      head,
      `Expected meta-block head ${expectedHead} is not equal to actual head ${head}`,
    );
  });

  it('should not commit already committed meta-block', async () => {
    initialDepositors = [
      accounts[2],
      accounts[3],
      accounts[4],
    ];
    initialValidators = [
      accounts[5],
      accounts[6],
      accounts[7],
    ];
    initialStakes = [
      new BN('100'),
      new BN('100'),
      new BN('100'),
    ];

    await MosaicCoreUtils.initializeStakeContract(
      stakeAddress,
      erc20,
      tokenDeployer,
      initialDepositors,
      initialStakes,
      initialValidators,
    );

    let expectedVerifiedWeight = new BN(initialStakes[0]);
    const expectedRequiredWeight = new BN(200);

    await MosaicCoreUtils.verifyVote(
      initialStakes[0],
      initialValidators[0],
      vote,
      mosaicCore,
      kernelHash,
      expectedVerifiedWeight,
      expectedRequiredWeight,
    );

    expectedVerifiedWeight = expectedVerifiedWeight.add(new BN(initialStakes[1]));

    let events = await MosaicCoreUtils.verifyVote(
      initialStakes[1],
      initialValidators[1],
      vote,
      mosaicCore,
      kernelHash,
      expectedVerifiedWeight,
      expectedRequiredWeight,
    );

    const expectedHeight = 1;

    const head = await mosaicCore.head.call();

    MosaicCoreUtils.assertCommitMetaBlock(
      events,
      expectedHeight,
      kernelHash,
      vote.transitionHash,
      head,
      expectedRequiredWeight,
      expectedVerifiedWeight,
    );

    expectedVerifiedWeight = expectedVerifiedWeight.add(new BN(initialStakes[2]));

    events = await MosaicCoreUtils.verifyVote(
      initialStakes[2],
      initialValidators[2],
      vote,
      mosaicCore,
      kernelHash,
      expectedVerifiedWeight,
      expectedRequiredWeight,
    );

    assert(
      events.MetaBlockCommitted === undefined,
      'Meta-block should only be committed once.',
    );
  });
});
