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

const TestData = require('./helpers/data.js');

const AuxiliaryBlockStore = artifacts.require('AuxiliaryBlockStore');
const BlockStoreMock = artifacts.require('BlockStoreMock');

contract('AuxiliaryBlockStore.transitionObjectAtBlock()', async (accounts) => {

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

    it('should return auxiliary transition object at given block Hash if' +
         ' checkpoint is defined', async () => {

        let transitionObject = await  blockStore.auxiliaryTransitionObjectAtBlock.call(
             initialBlockHash
        );

        assert.equal(
             transitionObject.coreIdentifier_,
             coreIdentifier,
             `coreIdentifier of transition object is different from expected coreIdentifier.`
        );

        assert.equal(
             transitionObject.kernelHash_,
             initialKernelHash,
             `Kernel Hash of transition object is different from expected KernelHash.`
        );

        assert(
             transitionObject.auxiliaryDynasty_.eq(new BN(0)),
             `Dynasty of transition object is different from expected dynasty.`
        );

        assert.equal(
             transitionObject.auxiliaryBlockHash_,
             initialBlockHash,
             `Block hash of transition object is different from expected block hash.`
        );

        let originDynasty = await originBlockStore.getCurrentDynasty.call();
        let originBlockHash = await originBlockStore.getHead.call();

        assert(
             transitionObject.originDynasty_.eq(originDynasty),
             `Origin dynasty of transition object is different from expected origin dynasty.`
        );

        assert.equal(
             transitionObject.originBlockHash_,
             originBlockHash,
             `origin Block hash of transition object is different from expected block hash.`
        );

        assert.equal(
             transitionObject.transactionRoot_,
             initialTransactionRoot,
             `transaction root of transition object is different from expected transaction root.`
        );
    });


    it('should fail if checkpoint is not defined at given block hash.', async function () {

        let wrongBlockHash = web3.utils.sha3("wrong block hash");

        await Utils.expectRevert(
             blockStore.auxiliaryTransitionObjectAtBlock.call(wrongBlockHash),
             'Checkpoint not defined for given block hash.'
        );

    });
});
