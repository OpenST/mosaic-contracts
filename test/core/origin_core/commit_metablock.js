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
const OriginCoreUtils = require('./helpers/utils');
const MetaBlockUtils = require('../../test_lib/meta_block.js');

const OriginCore = artifacts.require('OriginCore');
const MockToken = artifacts.require('MockToken');

contract('OriginCore.verifyVote() [commit meta-block]', async (accounts) => {

    let originCore;
    let transitionHash;
    let vote;
    let minimumWeight = new BN('1');
    let ost;
    let initialGas = 0;
    let transactionRoot = web3.utils.sha3("1");
    let auxiliaryCoreIdentifier = accounts[0];
    let kernelHash;
    let initialValidators;
    let initialDepositors;
    let initialStakes;
    let maxAccumulateGasLimit = new BN(105000);
    let tokenDeployer;

    beforeEach(async () => {

        tokenDeployer = accounts[0];
        ost = await MockToken.new({from: tokenDeployer});

        originCore = await OriginCore.new(
             auxiliaryCoreIdentifier,
             ost.address,
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

    it('should be able to commit meta-block if 2/3 super majority is' +
         ' achieved.', async function () {

        let stakeAddress = await originCore.stake.call();

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
             ost,
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

        OriginCoreUtils.assertCommitMetaBlock(
             events,
             expectedHeight,
             kernelHash,
             vote.transitionHash,
             expectedRequiredWeight,
             expectedVerifiedWeight
        );
    });

    it('should be not able to commit meta-block if 2/3 super majority is not' +
         ' achieved.', async function () {

        let stakeAddress = await originCore.stake.call();

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
             ost,
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

    it('should not be able to commit meta-block due to rounding error ', async function () {

        let stakeAddress = await originCore.stake.call();

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
             ost,
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
        let stakeAddress = await originCore.stake.call();

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
             ost,
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

        OriginCoreUtils.assertCommitMetaBlock(
             events,
             expectedHeight,
             kernelHash,
             vote.transitionHash,
             expectedRequiredWeight,
             expectedVerifiedWeight
        );

        let head = await originCore.head.call();

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

    it('should save meta-block on commit and head should point to committed' +
         ' meta-block', async function () {
        let stakeAddress = await originCore.stake.call();

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
             ost,
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

        OriginCoreUtils.assertCommitMetaBlock(
             events,
             expectedHeight,
             kernelHash,
             vote.transitionHash,
             expectedRequiredWeight,
             expectedVerifiedWeight
        );

        let expectedHead = MetaBlockUtils.hashMetaBlock(kernelHash,vote.transitionHash);
        let head = await originCore.head.call();


        assert.equal(
          expectedHead,
          head,
          `Expected meta-block head ${expectedHead} is not equal to actual head ${head}`
        );
    });

    it('should not commit already committed meta-block', async function () {
        let stakeAddress = await originCore.stake.call();

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
             ost,
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

        OriginCoreUtils.assertCommitMetaBlock(
             events,
             expectedHeight,
             kernelHash,
             vote.transitionHash,
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



