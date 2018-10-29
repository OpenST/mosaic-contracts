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
// Test: verfiy_vote.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const web3 = require('../../test_lib/web3.js');

const BN = require('bn.js');
const EventsDecoder = require('../../test_lib/event_decoder.js');
const Utils = require('../../test_lib/utils.js');
const CoreUtils = require('../utils.js');
const StakeUtils = require('../stake/helpers/stake_utils.js');


const OriginCore = artifacts.require('OriginCore');
const Stake = artifacts.require('Stake');
const MockToken = artifacts.require('MockToken');

async function verifyVote(stakeAmount, validator, vote, originCore, kernelHash, expectedTotalWeight) {

    validator = web3.utils.toChecksumAddress(validator);

    let sig = await CoreUtils.signVote(validator, vote);

    let tx = await originCore.verifyVote(
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
    );

    let events = EventsDecoder.perform(tx.receipt, originCore.address, originCore.abi);

    assert.equal(
         web3.utils.toChecksumAddress(events.VoteVerified.validator),
         validator,
         `Verify event should recover validator signature`
    );

    assert.equal(
         events.VoteVerified.kernelHash,
         kernelHash,
         `Kernel hash should match`
    );

    assert.equal(
         events.VoteVerified.transitionHash,
         vote.transitionHash,
         `transitionHash hash should match`
    );

    assert.equal(
         events.VoteVerified.v,
         sig.v,
         `V of signature should match`
    );

    assert.equal(
         events.VoteVerified.r,
         sig.r,
         `R of signature should match`
    );

    assert.equal(
         events.VoteVerified.s,
         sig.s,
         `S of signature should match`
    );

    assert(
         expectedTotalWeight.eq(new BN(events.VoteVerified.totalWeight)),
         `expected total weight ${expectedTotalWeight.toString(10)}` +
         `and actual total weight ${events.VoteVerified.totalWeight.toString(10)}`
    );

}

contract('OriginCore.verifyVote()', async (accounts) => {

    let originCore, stake;
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

    beforeEach(async () => {

        let tokenDeployer = accounts[0];
        ost = await MockToken.new({from: tokenDeployer});

        originCore = await OriginCore.new(
             auxiliaryCoreIdentifier,
             ost.address,
             initialGas,
             transactionRoot,
             minimumWeight
        );
        let stakeAddress = await originCore.stake.call();

        stake = await Stake.at(stakeAddress);

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

        await StakeUtils.approveTransfers(
             stakeAddress,
             ost,
             tokenDeployer,
             initialDepositors,
             initialStakes,
        );
        await stake.initialize(
             initialDepositors,
             initialValidators,
             initialStakes,
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

        let expectedTotalWeight = new BN(initialStakes[0]);
        await verifyVote(
             initialStakes[0],
             initialValidators[0],
             vote,
             originCore,
             kernelHash,
             expectedTotalWeight
        );

    });

    it('should not be able to verify already verified vote.', async function () {

        let validator = initialValidators[0];

        let sig = await CoreUtils.signVote(validator, vote);

        let expectedTotalWeight = new BN(initialStakes[0]);
        await verifyVote(
             initialStakes[0],
             validator,
             vote,
             originCore,
             kernelHash,
             expectedTotalWeight
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

        let sig = await CoreUtils.signVote(validator, vote);

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

        let expectedTotalWeight = new BN(initialStakes[0]);

        await verifyVote(
             initialStakes[0],
             initialValidators[0],
             vote,
             originCore,
             kernelHash,
             expectedTotalWeight
        );

        expectedTotalWeight = expectedTotalWeight.add(new BN(initialStakes[1]));

        await verifyVote(
             initialStakes[1],
             initialValidators[1],
             vote,
             originCore,
             kernelHash,
             expectedTotalWeight
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

        let sig = await CoreUtils.signVote(validator, vote);

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
             `Given transition object is not proposed for given kernel.`
        );
    });

    it('should not verify vote for invalid kernel hash ', async function () {

        let validator = initialValidators[0];

        let sig = await CoreUtils.signVote(validator, vote);

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
             `Given transition object is not proposed for given kernel.`
        );
    });
});



