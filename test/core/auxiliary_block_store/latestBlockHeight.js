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

const initialTestData = require('./helpers/data.js');

const AuxiliaryBlockStore = artifacts.require('AuxiliaryBlockStore');

contract('AuxiliaryBlockStore.latestBlockHeight()', async (accounts) => {

    let coreIdentifier = '0x0000000000000000000000000000000000000001';
    let epochLength = new BN('3');
    let pollingPlaceAddress = accounts[0];
    let initialBlockHash = '0xdcd79d30c0d69fa20dd8fe8f6bf356db5a91228e8eea30ab7d497984e9d88220';
    let initialStateRoot = '0xef1552a40b7165c3cd773806b9e0c165b75356e0314bf0706f279c729f51e017';
    let initialGas = new BN('21000');
    let initialTransactionRoot = '0x5fe50b260da6308036625b850b5d6ced6d0a9f814c0688bc91ffb7b7a3a54b67';
    let initialHeight = new BN('3');

    let blockStore;

    // Heights 4-12
    let testData = AuxStoreUtils.getSubset(4, 12, initialTestData);

    beforeEach(async () => {
        blockStore = await AuxiliaryBlockStore.new(
            coreIdentifier,
            epochLength,
            pollingPlaceAddress,
            initialBlockHash,
            initialStateRoot,
            initialHeight,
            initialGas,
            initialTransactionRoot
        );

        await AuxStoreUtils.reportBlocks(blockStore, testData);
    });

    it('should return the correct block height', async () => {
        let testJustifications = [
            {
                source: initialBlockHash,
                target: testData[6].hash,
                expectedHeight: new BN('3')
            },
            {
                source: testData[6].hash,
                target: testData[12].hash,
                expectedHeight: new BN('3')
            },
            {
                source: testData[6].hash,
                target: testData[9].hash,
                expectedHeight: new BN('6')
            },
        ];

        let count = testJustifications.length;
        for (i = 0; i < count; i++) {
            let testJustification = testJustifications[i];

            await blockStore.justify(
                testJustification.source,
                testJustification.target
            );
            let height = await blockStore.latestBlockHeight.call();
            assert(
                height.eq(testJustification.expectedHeight),
                "The  wrong height was returned. Expected: " +
                testJustification.expectedHeight + " Actual: " + height
            );
        }
    });

});
