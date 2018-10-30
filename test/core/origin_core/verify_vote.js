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

contract('OriginCore.verifyVote()', async (accounts) => {

    let originCore;
    let transitionHash;
    let vote;
    let minimumWeight = new BN('1');
    let ost;
    let initialGas = 0;
    let transactionRoot = web3.utils.sha3("1");
    let auxiliaryCoreIdentifier = web3.utils.sha3("1");
    let kernelHash = web3.utils.sha3("1");
    let initialValidators;
    let initialDepositors;
    let initialStakes;
    let maxAccumulateGasLimit = new BN(105000);
    let requiredWeight;

    beforeEach(async () => {

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
        ost = await MockToken.new({from: tokenDeployer});

        originCore = await OriginCore.new(
             auxiliaryCoreIdentifier,
             ost.address,
             initialGas,
             transactionRoot,
             minimumWeight,
             maxAccumulateGasLimit
        );
        let stakeAddress = await originCore.stake.call();

        await OriginCoreUtils.initializeStakeContract(
             stakeAddress,
             ost,
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
            coreIdentifier: accounts[0],//auxiliaryCoreIdentifier,
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
});



