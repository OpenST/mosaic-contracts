// Copyright 2018 OpenST Ltd.
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

const web3 = require('../../test_lib/web3.js');

const BN = require('bn.js');
const EventsDecoder = require('../../test_lib/event_decoder.js');
const Utils = require('../../test_lib/utils.js');
const MetaBlockUtils = require('../../test_lib/meta_block.js');
const OriginCoreUtils = require('./helpers/utils');

const OriginCore = artifacts.require('OriginCore');
const MockToken = artifacts.require('MockToken');

let originCore;
let transitionHash;
let vote;
let minimumWeight = new BN('1');
let erc20;
let initialGas = 0;
let transactionRoot = web3.utils.sha3("1");
let auxiliaryCoreIdentifier;
let kernelHash = web3.utils.sha3("1");
let initialValidators;
let initialDepositors;
let initialStakes;
let maxAccumulateGasLimit = new BN(105000);
let requiredWeight;
let stakeAddress;
let tokenDeployer;

contract('OriginCore.verifyVote()', async (accounts) => {

    beforeEach(async () => {

        auxiliaryCoreIdentifier = accounts[0];

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

        let tokenDeployer = accounts[0];
        erc20 = await MockToken.new({from: tokenDeployer});

        originCore = await OriginCore.new(
             auxiliaryCoreIdentifier,
             erc20.address,
             initialGas,
             transactionRoot,
             minimumWeight,
             maxAccumulateGasLimit
        );
        let stakeAddress = await originCore.stake.call();

        await OriginCoreUtils.initializeStakeContract(
             stakeAddress,
             erc20,
             tokenDeployer,
             initialDepositors,
             initialStakes,
             initialValidators
        );

        let height = 1,
             auxiliaryDynasty = 50,
             auxiliaryBlockHash = web3.utils.sha3("1"),
             gas = 1000,
             originDynasty = 1,
             originBlockHash = web3.utils.sha3("1");

        let tx = await originCore.proposeBlock(
             height,
             auxiliaryCoreIdentifier,
             kernelHash,
             auxiliaryDynasty,
             auxiliaryBlockHash,
             gas,
             originDynasty,
             originBlockHash,
             transactionRoot
        );
        let events = EventsDecoder.perform(tx.receipt, originCore.address, originCore.abi);

        assert.equal(
             events.BlockProposed.height,
             height,
             `Meta-block should be proposed for height ${height}`
        );
        transitionHash = events.BlockProposed.transitionHash;

        vote = {
            coreIdentifier: auxiliaryCoreIdentifier,
            transitionHash: transitionHash,
            source: '0xe03b82d609dd4c84cdf0e94796d21d65f56b197405f983e593ac4302d38a112b',
            target: '0x4bd8f94ba769f24bf30c09d4a3575795a776f76ca6f772893618943ea2dab9ce',
            sourceHeight: new BN('1'),
            targetHeight: new BN('2'),
        };
    });

    it('should be able to verify vote for proposed meta-block', async function () {

        let expectedVerifiedWeight = new BN(initialStakes[0]);

        await OriginCoreUtils.verifyVote(
             initialStakes[0],
             initialValidators[0],
             vote,
             originCore,
             kernelHash,
             expectedVerifiedWeight,
             requiredWeight
        );

    });

    it('should not be able to verify already verified vote.', async function () {

        let validator = initialValidators[0];

        let sig = await MetaBlockUtils.signVote(validator, vote);

        let expectedVerifiedWeight = new BN(initialStakes[0]);

        await OriginCoreUtils.verifyVote(
             initialStakes[0],
             validator,
             vote,
             originCore,
             kernelHash,
             expectedVerifiedWeight,
             requiredWeight
        );

        await Utils.expectThrow(
             originCore.verifyVote(
                  kernelHash,
                  vote.coreIdentifier,
                  vote.transitionHash,
                  vote.source,
                  vote.target,
                  vote.sourceHeight,
                  vote.targetHeight,
                  sig.v,
                  sig.r,
                  sig.s
             ),
             `Vote already verified for this validator.`
        );

    });

    it('should not verify vote for validator with zero weight.', async function () {

        let validator = web3.utils.toChecksumAddress(accounts[0]);

        let sig = await MetaBlockUtils.signVote(validator, vote);

        await Utils.expectThrow(
             originCore.verifyVote(
                  kernelHash,
                  vote.coreIdentifier,
                  vote.transitionHash,
                  vote.source,
                  vote.target,
                  vote.sourceHeight,
                  vote.targetHeight,
                  sig.v,
                  sig.r,
                  sig.s
             ),
             `Only validator with non zero weight can vote.`
        );

    });

    it('should increase total weight on successful verification of vote', async function () {

        let expectedVerifiedWeight = new BN(initialStakes[0]);

        await OriginCoreUtils.verifyVote(
             initialStakes[0],
             initialValidators[0],
             vote,
             originCore,
             kernelHash,
             expectedVerifiedWeight,
             requiredWeight
        );

        expectedVerifiedWeight = expectedVerifiedWeight.add(new BN(initialStakes[1]));

        await OriginCoreUtils.verifyVote(
             initialStakes[1],
             initialValidators[1],
             vote,
             originCore,
             kernelHash,
             expectedVerifiedWeight,
             requiredWeight
        );
    });

    it('should not verify vote for validator with wrong signature', async function () {

        let sig = {
            v: 28,
            r: web3.utils.sha3("invalid r"),
            s: web3.utils.sha3("invalid s")
        };

        await Utils.expectThrow(
             originCore.verifyVote(
                  kernelHash,
                  vote.coreIdentifier,
                  vote.transitionHash,
                  vote.source,
                  vote.target,
                  vote.sourceHeight,
                  vote.targetHeight,
                  sig.v,
                  sig.r,
                  sig.s
             ),
             `Only validator with non zero weight can vote.`
        );

    });

    it('should not verify vote for transition hash which is not proposed', async function () {

        let validator = initialValidators[0];

        let sig = await MetaBlockUtils.signVote(validator, vote);

        let wrongTransitionHash = web3.utils.sha3("wrong transition hash");

        await Utils.expectThrow(
             originCore.verifyVote(
                  kernelHash,
                  vote.coreIdentifier,
                  wrongTransitionHash,
                  vote.source,
                  vote.target,
                  vote.sourceHeight,
                  vote.targetHeight,
                  sig.v,
                  sig.r,
                  sig.s
             ),
             `A vote can only be verified for an existing meta-block proposal.`
        );
    });

    it('should not verify vote for invalid kernel hash ', async function () {

        let validator = initialValidators[0];

        let sig = await MetaBlockUtils.signVote(validator, vote);

        kernelHash = web3.utils.sha3("wrong kernel hash");

        await Utils.expectThrow(
             originCore.verifyVote(
                  kernelHash,
                  vote.coreIdentifier,
                  vote.transitionHash,
                  vote.source,
                  vote.target,
                  vote.sourceHeight,
                  vote.targetHeight,
                  sig.v,
                  sig.r,
                  sig.s
             ),
             `A vote can only be verified for an existing meta-block proposal.`
        );
    });

    it('should not verify vote for invalid core identifier', async function () {

        let validator = initialValidators[0];

        let sig = await MetaBlockUtils.signVote(validator, vote);

        let wrongCoreIdentifier = accounts[8];

        await Utils.expectThrow(
             originCore.verifyVote(
                  kernelHash,
                  wrongCoreIdentifier,
                  vote.transitionHash,
                  vote.source,
                  vote.target,
                  vote.sourceHeight,
                  vote.targetHeight,
                  sig.v,
                  sig.r,
                  sig.s
             ),
             `Core identifier must match with auxiliary core identifier.`
        );
    });
});

contract('OriginCore.verifyVote() [commit meta-block]', async (accounts) => {

    beforeEach(async () => {

        auxiliaryCoreIdentifier = accounts[0]
        tokenDeployer = accounts[0];
        erc20 = await MockToken.new({from: tokenDeployer});

        originCore = await OriginCore.new(
            auxiliaryCoreIdentifier,
            erc20.address,
            initialGas,
            transactionRoot,
            minimumWeight,
            maxAccumulateGasLimit
        );

        kernelHash = await originCore.openKernelHash.call();
        let height = 1,
            auxiliaryDynasty = 50,
            auxiliaryBlockHash = web3.utils.sha3("1"),
            gas = 1000,
            originDynasty = 1,
            originBlockHash = web3.utils.sha3("1");

        let tx = await originCore.proposeBlock(
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
        let events = EventsDecoder.perform(tx.receipt, originCore.address, originCore.abi);

        assert.equal(
            events.BlockProposed.height,
            height,
            `Meta-block should be proposed for height ${height}`
        );
        transitionHash = events.BlockProposed.transitionHash;

        vote = {
            coreIdentifier: auxiliaryCoreIdentifier,
            transitionHash: transitionHash,
            source: '0xe03b82d609dd4c84cdf0e94796d21d65f56b197405f983e593ac4302d38a112b',
            target: '0x4bd8f94ba769f24bf30c09d4a3575795a776f76ca6f772893618943ea2dab9ce',
            sourceHeight: new BN('1'),
            targetHeight: new BN('2'),
        };

        stakeAddress = await originCore.stake.call();
    });

    it('should commit a meta-block if 2/3 super majority is' +
        ' achieved.', async function () {

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

        await OriginCoreUtils.initializeStakeContract(
            stakeAddress,
            erc20,
            tokenDeployer,
            initialDepositors,
            initialStakes,
            initialValidators
        );

        let expectedVerifiedWeight = new BN(initialStakes[0]);
        let expectedRequiredWeight = new BN(200);

        await OriginCoreUtils.verifyVote(
            initialStakes[0],
            initialValidators[0],
            vote,
            originCore,
            kernelHash,
            expectedVerifiedWeight,
            expectedRequiredWeight
        );

        expectedVerifiedWeight = expectedVerifiedWeight.add(new BN(initialStakes[1]));

        let events = await OriginCoreUtils.verifyVote(
            initialStakes[1],
            initialValidators[1],
            vote,
            originCore,
            kernelHash,
            expectedVerifiedWeight,
            expectedRequiredWeight
        );

        let expectedHeight = 1;

        let head = await originCore.head.call();

        OriginCoreUtils.assertCommitMetaBlock(
            events,
            expectedHeight,
            kernelHash,
            vote.transitionHash,
            head,
            expectedRequiredWeight,
            expectedVerifiedWeight
        );
    });

    it('should not commit a meta-block if 2/3 super majority is not' +
        ' achieved.', async function () {

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

        await OriginCoreUtils.initializeStakeContract(
            stakeAddress,
            erc20,
            tokenDeployer,
            initialDepositors,
            initialStakes,
            initialValidators
        );

        let expectedVerifiedWeight = new BN(initialStakes[0]);
        let expectedRequiredWeight = new BN(200);

        let events = await OriginCoreUtils.verifyVote(
            initialStakes[0],
            initialValidators[0],
            vote,
            originCore,
            kernelHash,
            expectedVerifiedWeight,
            expectedRequiredWeight
        );

        assert(
            events.MetaBlockCommitted === undefined,
            `Commit meta-block event is emitted`
        );
    });

    it('should not commit meta-block due to rounding error ', async function () {

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
            new BN(1)
        ];

        await OriginCoreUtils.initializeStakeContract(
            stakeAddress,
            erc20,
            tokenDeployer,
            initialDepositors,
            initialStakes,
            initialValidators
        );

        let expectedVerifiedWeight = new BN(initialStakes[0]);
        let expectedRequiredWeight = new BN(3);

        let events = await OriginCoreUtils.verifyVote(
            initialStakes[0],
            initialValidators[0],
            vote,
            originCore,
            kernelHash,
            expectedVerifiedWeight,
            expectedRequiredWeight
        );

        assert(
            events.MetaBlockCommitted === undefined,
            `Commit meta-block event is emitted`
        );

    });

    it('should open new kernel on meta-block commit', async function () {

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

        await OriginCoreUtils.initializeStakeContract(
            stakeAddress,
            erc20,
            tokenDeployer,
            initialDepositors,
            initialStakes,
            initialValidators
        );

        let expectedVerifiedWeight = new BN(initialStakes[0]);
        let expectedRequiredWeight = new BN(200);

        await OriginCoreUtils.verifyVote(
            initialStakes[0],
            initialValidators[0],
            vote,
            originCore,
            kernelHash,
            expectedVerifiedWeight,
            expectedRequiredWeight
        );

        expectedVerifiedWeight = expectedVerifiedWeight.add(new BN(initialStakes[1]));

        let events = await OriginCoreUtils.verifyVote(
            initialStakes[1],
            initialValidators[1],
            vote,
            originCore,
            kernelHash,
            expectedVerifiedWeight,
            expectedRequiredWeight
        );

        let expectedHeight = 1;

        let head = await originCore.head.call();

        OriginCoreUtils.assertCommitMetaBlock(
            events,
            expectedHeight,
            kernelHash,
            vote.transitionHash,
            head,
            expectedRequiredWeight,
            expectedVerifiedWeight
        );

        let kernel = {
            height: 2,
            parent: head,
            updatedValidators: [],
            updatedWeights: []
        };

        let openKernel = await originCore.openKernel.call();

        let openKernelHash = await originCore.openKernelHash.call();

        let expectedKernelHash = "0xb94e25ddd9ce2be28e1a66c2e0b5ac998573f23d089880aa9c3b8c96ef36221c";

        assert.equal(
            kernel.height,
            openKernel.height,
            `Expected open kernel height is different for actual kernel.`
        );

        assert.equal(
            kernel.parent,
            openKernel.parent,
            `Expected open kernel parent is different for actual kernel.`
        );

        assert.equal(
            expectedKernelHash,
            openKernelHash,
            `Expected open kernel hash is different for actual kernel hash.`
        );

    });

    it('should update head to latest committed meta-block', async function () {

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

        await OriginCoreUtils.initializeStakeContract(
            stakeAddress,
            erc20,
            tokenDeployer,
            initialDepositors,
            initialStakes,
            initialValidators
        );

        let expectedVerifiedWeight = new BN(initialStakes[0]);
        let expectedRequiredWeight = new BN(200);

        await OriginCoreUtils.verifyVote(
            initialStakes[0],
            initialValidators[0],
            vote,
            originCore,
            kernelHash,
            expectedVerifiedWeight,
            expectedRequiredWeight
        );

        expectedVerifiedWeight = expectedVerifiedWeight.add(new BN(initialStakes[1]));

        let events = await OriginCoreUtils.verifyVote(
            initialStakes[1],
            initialValidators[1],
            vote,
            originCore,
            kernelHash,
            expectedVerifiedWeight,
            expectedRequiredWeight
        );

        let expectedHeight = 1;

        let head = await originCore.head.call();

        OriginCoreUtils.assertCommitMetaBlock(
            events,
            expectedHeight,
            kernelHash,
            vote.transitionHash,
            head,
            expectedRequiredWeight,
            expectedVerifiedWeight
        );

        let expectedHead = MetaBlockUtils.hashMetaBlock(kernelHash,vote.transitionHash);

        assert.equal(
            expectedHead,
            head,
            `Expected meta-block head ${expectedHead} is not equal to actual head ${head}`
        );
    });

    it('should not commit already committed meta-block', async function () {

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

        await OriginCoreUtils.initializeStakeContract(
            stakeAddress,
            erc20,
            tokenDeployer,
            initialDepositors,
            initialStakes,
            initialValidators
        );

        let expectedVerifiedWeight = new BN(initialStakes[0]);
        let expectedRequiredWeight = new BN(200);

        await OriginCoreUtils.verifyVote(
            initialStakes[0],
            initialValidators[0],
            vote,
            originCore,
            kernelHash,
            expectedVerifiedWeight,
            expectedRequiredWeight
        );

        expectedVerifiedWeight = expectedVerifiedWeight.add(new BN(initialStakes[1]));

        let events = await OriginCoreUtils.verifyVote(
            initialStakes[1],
            initialValidators[1],
            vote,
            originCore,
            kernelHash,
            expectedVerifiedWeight,
            expectedRequiredWeight
        );

        let expectedHeight = 1;

        let head = await originCore.head.call();

        OriginCoreUtils.assertCommitMetaBlock(
            events,
            expectedHeight,
            kernelHash,
            vote.transitionHash,
            head,
            expectedRequiredWeight,
            expectedVerifiedWeight
        );

        expectedVerifiedWeight = expectedVerifiedWeight.add(new BN(initialStakes[2]));

        events = await OriginCoreUtils.verifyVote(
            initialStakes[2],
            initialValidators[2],
            vote,
            originCore,
            kernelHash,
            expectedVerifiedWeight,
            expectedRequiredWeight
        );

        assert(
            events.MetaBlockCommitted === undefined,
            `Meta-block should only be committed once.`
        );

    });

});





