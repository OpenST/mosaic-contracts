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

const OriginCore = artifacts.require('OriginCore');

contract('OriginCore.verifyVote()', async (accounts) => {

    let originCore;
    let transitionHash;
    let vote;
    let minimumWeight = new BN('1');
    let ost = accounts[0];
    let initialGas = 0;
    let transactionRoot = web3.utils.sha3("1");
    let auxiliaryCoreIdentifier = web3.utils.sha3("1");
    let kernelHash = web3.utils.sha3("1");

    beforeEach(async () => {

        originCore = await OriginCore.new(
             auxiliaryCoreIdentifier,
             ost,
             initialGas,
             transactionRoot,
             minimumWeight
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

        let validator = web3.utils.toChecksumAddress(accounts[0]);

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
    });

});

