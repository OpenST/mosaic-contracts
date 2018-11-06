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
const BN = require('bn.js');
const Utils = require('../../test_lib/utils.js');
const MetaBlockUtils = require('../../test_lib/meta_block.js');

const TestData = require('./helpers/data.js');

const AuxiliaryBlockStore = artifacts.require('AuxiliaryBlockStore');
const BlockStoreMock = artifacts.require('BlockStoreMock');

contract('AuxiliaryBlockStore.auxiliaryTransitionHashAtBlock()', async (accounts) => {

    let coreIdentifier = '0x0000000000000000000000000000000000000002';
    let epochLength = new BN('3');
    let pollingPlaceAddress = accounts[0];
    let originBlockStore;
    let initialBlockHash = TestData.initialBlock.hash;
    let initialStateRoot = TestData.initialBlock.stateRoot;
    let initialGas = TestData.initialBlock.gas;
    let initialTransactionRoot = TestData.initialBlock.transactionRoot;
    let initialHeight = TestData.initialBlock.height;
    let initialKernelHash  = TestData.initialBlock.kernelHash;

    let blockStore;

    beforeEach(async () => {
        originBlockStore = await BlockStoreMock.new();

        blockStore = await AuxiliaryBlockStore.new(
            coreIdentifier,
            epochLength,
            pollingPlaceAddress,
            originBlockStore.address,
            initialBlockHash,
            initialStateRoot,
            initialHeight,
            initialGas,
            initialTransactionRoot,
            initialKernelHash
        );
    });

    it('should return auxiliary transition hash at given block Hash if' +
         ' checkpoint is defined', async () => {

        let originDynasty = await originBlockStore.getCurrentDynasty.call();
        let originBlockHash = await originBlockStore.getHead.call();

        let auxiliaryTransitionObject = {
            coreIdentifier:coreIdentifier,
            kernelHash:initialKernelHash,
            auxiliaryDynasty:0,
            auxiliaryBlockHash:initialBlockHash,
            gas:initialGas,
            originDynasty:originDynasty,
            originBlockHash:originBlockHash,
            transactionRoot:initialTransactionRoot,
        };

        let expectedTransitionHash = MetaBlockUtils.hashAuxiliaryTransition(auxiliaryTransitionObject);

        let transitionHash = await  blockStore.auxiliaryTransitionHashAtBlock.call(
            initialBlockHash
        );

        assert.equal(
            transitionHash,
            expectedTransitionHash,
            `Transition hash is different from expected transition hash.`
        );

    });


    it('should fail if checkpoint is not defined at given block hash.', async function () {

        let wrongBlockHash = web3.utils.sha3("wrong block hash");

        await Utils.expectRevert(
             blockStore.auxiliaryTransitionHashAtBlock.call(wrongBlockHash),
             'Checkpoint not defined for given block hash.'
        );

    });
});
