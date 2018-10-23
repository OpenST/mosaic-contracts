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
// Test: propose_block.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const web3 = require('../../test_lib/web3.js');

const BN = require('bn.js');
const EventsDecoder = require('../../test_lib/event_decoder.js');
const Utils = require('../../test_lib/utils.js');

const OriginCore = artifacts.require('OriginCore');

contract('propose meta-block', async (accounts) => {


    let originCore;
    let auxiliaryCoreIdentifier = web3.utils.sha3("1");

    let height, kernelHash, auxiliaryDynasty, auxiliaryBlockHash, gas,
         originDynasty, originBlockHash, transactionRoot, stateRoot;

    beforeEach(async () => {

        height = 1,
             kernelHash = web3.utils.sha3("1"),
             auxiliaryDynasty = 50,
             auxiliaryBlockHash = web3.utils.sha3("1"),
             gas = 1000,
             originDynasty = 1,
             originBlockHash = web3.utils.sha3("1"),
             transactionRoot = web3.utils.sha3("1");

        let ost = accounts[0]
             , initialValidators = [accounts[1], accounts[2]]
             , validatorsWeights = [10, 20];

        originCore = await OriginCore.new(
             auxiliaryCoreIdentifier,
             ost,
             initialValidators,
             validatorsWeights
        );
    });

    it('should be able to propose meta-block', async function () {

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

    });

    it('should not be able to propose meta-block with same height as previous' +
         ' meta-block', async function () {

        height = 0;

        await Utils.expectThrow(
             originCore.proposeBlock(
                  height,
                  auxiliaryCoreIdentifier,
                  kernelHash,
                  auxiliaryDynasty,
                  auxiliaryBlockHash,
                  gas,
                  originDynasty,
                  originBlockHash,
                  transactionRoot
             ),
             'Height should be one more than last meta-block.'
        );
    });

    it('should not be able to propose meta-block with the same gas as parent' +
         ' meta-block', async function () {

        gas = 0;

        await Utils.expectThrow(
             originCore.proposeBlock(
                  height,
                  auxiliaryCoreIdentifier,
                  kernelHash,
                  auxiliaryDynasty,
                  auxiliaryBlockHash,
                  gas,
                  originDynasty,
                  originBlockHash,
                  transactionRoot
             ),
             'Gas consumed should be greater than last meta-block gas.'
        );

    });

    it('should not be able to propose meta-block for same height and same' +
         ' transition object which is already proposed', async function () {

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

        await Utils.expectThrow(
             originCore.proposeBlock(
                  height,
                  auxiliaryCoreIdentifier,
                  kernelHash,
                  auxiliaryDynasty,
                  auxiliaryBlockHash,
                  gas,
                  originDynasty,
                  originBlockHash,
                  transactionRoot
             ),
             'Meta-block with same transition object is already proposed.'
        );

    });

    it('should not be able to propose meta-block for same auxiliary dynasty' +
         ' as parent meta-block', async function () {

        auxiliaryDynasty = 0;

        await Utils.expectThrow(
             originCore.proposeBlock(
                  height,
                  auxiliaryCoreIdentifier,
                  kernelHash,
                  auxiliaryDynasty,
                  auxiliaryBlockHash,
                  gas,
                  originDynasty,
                  originBlockHash,
                  transactionRoot
             ),
             'Auxiliary dynasty should be greater than last meta-block auxiliary dynasty.'
        );

    });

    it('should not be able to propose meta-block for correct auxiliary' +
         ' block chain', async function () {

        auxiliaryCoreIdentifier = web3.utils.sha3("2");

        await Utils.expectThrow(
             originCore.proposeBlock(
                  height,
                  auxiliaryCoreIdentifier,
                  kernelHash,
                  auxiliaryDynasty,
                  auxiliaryBlockHash,
                  gas,
                  originDynasty,
                  originBlockHash,
                  transactionRoot
             ),
             'CoreIdentifier should be same as auxiliary core identifier.'
        );

        auxiliaryCoreIdentifier = web3.utils.sha3("1");

    });

    it('should not be able to propose meta-block if transition root is' +
         ' not defined', async function () {

        transactionRoot = "0x00000000000000000000000000000000";

        await Utils.expectThrow(
             originCore.proposeBlock(
                  height,
                  auxiliaryCoreIdentifier,
                  kernelHash,
                  auxiliaryDynasty,
                  auxiliaryBlockHash,
                  gas,
                  originDynasty,
                  originBlockHash,
                  transactionRoot
             ),
             'Transaction Root hash should not be `0`.'
        );
    })   ;

    it('should not be able to propose meta-block if origin BlockHash is' +
         ' not defined', async function () {

        originBlockHash = "0x00000000000000000000000000000000";

        await Utils.expectThrow(
             originCore.proposeBlock(
                  height,
                  auxiliaryCoreIdentifier,
                  kernelHash,
                  auxiliaryDynasty,
                  auxiliaryBlockHash,
                  gas,
                  originDynasty,
                  originBlockHash,
                  transactionRoot
             ),
             'Origin block should not be `0`.'
        );
    });

    it('should not be able to propose meta-block if origin Dynasty is' +
         ' not zero', async function () {

        originDynasty = 0;

        await Utils.expectThrow(
             originCore.proposeBlock(
                  height,
                  auxiliaryCoreIdentifier,
                  kernelHash,
                  auxiliaryDynasty,
                  auxiliaryBlockHash,
                  gas,
                  originDynasty,
                  originBlockHash,
                  transactionRoot
             ),
             'Origin dynasty should not be `0`.'
        );
    });

    it('should not be able to propose meta-block if kernel Hash is' +
         ' not defined', async function () {

        kernelHash = "0x00000000000000000000000000000000";

        await Utils.expectThrow(
             originCore.proposeBlock(
                  height,
                  auxiliaryCoreIdentifier,
                  kernelHash,
                  auxiliaryDynasty,
                  auxiliaryBlockHash,
                  gas,
                  originDynasty,
                  originBlockHash,
                  transactionRoot
             ),
             'Kernel hash should not be `0`.'
        );
    });

});

