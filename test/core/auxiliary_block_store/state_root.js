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

const AuxStoreUtils = require('./helpers/aux_store_utils.js');
const BN = require('bn.js');
const Utils = require('../../test_lib/utils.js');

const TestData = require('./helpers/data.js');

const AuxiliaryBlockStore = artifacts.require('AuxiliaryBlockStore');
const BlockStoreMock = artifacts.require('BlockStoreMock');
const KernelGateway = artifacts.require('MockKernelGateway');

contract('AuxiliaryBlockStore.stateRoot()', async (accounts) => {

    let coreIdentifier = '0x0000000000000000000000000000000000000001';
    let epochLength = new BN('3');
    let pollingPlaceAddress = accounts[0];
    let originBlockStore;
    let initialBlockHash = TestData.blocks[3].hash;
    let initialStateRoot = TestData.blocks[3].stateRoot;
    let initialGas = TestData.blocks[3].accumulatedGas;
    let initialTransactionRoot = TestData.blocks[3].transactionRoot;
    let initialHeight = new BN('3');
    let initialKernelHash  = TestData.initialBlock.kernelHash;

    let blockStore;

    // Heights 4-12
    let testBlocks = AuxStoreUtils.getSubset(4, 12, TestData.blocks);

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
            initialKernelHash,
        );

        let kernelGateway = await KernelGateway.new(
            accounts[10],
            originBlockStore.address,
            blockStore.address,
            initialKernelHash,
        );

        await blockStore.initialize(kernelGateway.address);

        await AuxStoreUtils.reportBlocks(blockStore, testBlocks);
    });

    it('should return a known state root', async () => {
        await blockStore.justify(initialBlockHash, testBlocks[9].hash);
        await blockStore.justify(testBlocks[9].hash, testBlocks[12].hash);

        let testStateRoots = [
            {height: new BN('3'), expectedStateRoot: testBlocks[6].stateRoot},
            {height: new BN('9'), expectedStateRoot: testBlocks[9].stateRoot},
        ];

        let count = testStateRoots.length;
        for (i = 0; i < count; i++) {
            let testStateRoot = testStateRoots[i];

            let stateRoot = await blockStore.stateRoot.call(testStateRoot.height);
            assert.strictEqual(
                stateRoot,
                testStateRoot.expectedStateRoot,
                'The state root was not returned as expected at height ' +
                testStateRoot.height,
            );
        }
    });

    it('should fail when the height exceeds the latest finalised checkpoint', async () => {
        await blockStore.justify(initialBlockHash, testBlocks[9].hash);
        await blockStore.justify(testBlocks[9].hash, testBlocks[12].hash);

        // Height 12 is justified, but not finalised.
        await Utils.expectRevert(
            blockStore.stateRoot.call(new BN('12')),
            'The state root is only known up to the height of the last ' +
            'finalised checkpoint.',
        );

        // Height 15 was never reported.
        await Utils.expectRevert(
            blockStore.stateRoot.call(new BN('15')),
            'The state root is only known up to the height of the last ' +
            'finalised checkpoint.',
        );
    });

    it('should fail when the height is lower than the starting height', async () => {
        await blockStore.justify(initialBlockHash, testBlocks[9].hash);
        await blockStore.justify(testBlocks[9].hash, testBlocks[12].hash);

        // The starting height is 3.
        await Utils.expectRevert(
            blockStore.stateRoot.call(new BN('0')),
            'The state root is only known from the starting height upwards.',
        );
    });

    it('should fail when the block at the given height was not reported', async () => {
        await blockStore.justify(initialBlockHash, testBlocks[9].hash);
        await blockStore.justify(testBlocks[9].hash, testBlocks[12].hash);

        // The starting height is 3.
        await Utils.expectRevert(
            blockStore.stateRoot.call(new BN('6')),
            'State roots are only known for heights at justified checkpoints.',
        );
    });

    it('should fail when the checkpoint at the given height was not justified', async () => {
        await blockStore.justify(initialBlockHash, testBlocks[9].hash);
        await blockStore.justify(testBlocks[9].hash, testBlocks[12].hash);

        // The starting height is 3.
        await Utils.expectRevert(
            blockStore.stateRoot.call(new BN('6')),
            'State roots are only known for heights at justified checkpoints.',
        );
    });

});
