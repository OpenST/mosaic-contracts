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
const Utils = require('../../test_lib/utils.js');
const BN = require('bn.js');
const MosaicCore = artifacts.require('TestMosaicCore');

/**
 * @dev This test just verifies the value returned by function
 *      `getStateRoot()` is from `stateRoots` variable.
 */

contract('MosaicCore.getStorageRoot()', async (accounts) => {

    const coreIdentifier = '0x0000000000000000000000000000000000000001';
    const zeroBytes = Utils.ZERO_BYTES32;

    let gas = new BN('100');
    let maxAccumulateGasLimit = new BN('100');
    let transactionRoot= web3.utils.sha3("1");
    let minimumWeight = new BN('1');

    let mosaicCore, ost;

    /** Deploys the mosaic core contract */
    async function deployMosaicCore(){
        mosaicCore = await MosaicCore.new(
            coreIdentifier,
            ost,
            gas,
            transactionRoot,
            minimumWeight,
            maxAccumulateGasLimit,
        );
    }

    beforeEach(async () => {
        ost = accounts[0];
        await deployMosaicCore();
    });

    it('should return zero bytes when the data does not exists.',
        async function () {
            let height = new BN(1);
            let stateRoot = await mosaicCore.getStateRoot.call(height);

            assert.strictEqual(
                stateRoot,
                zeroBytes,
                "State root from the contract must be zero."
            );
        }
    );

    it('should return correct bytes when state root exists.',
        async function () {
            let height = new BN(1);
            let stateRoot = web3.utils.sha3("stateRoot");
            await mosaicCore.setStateRoot(height, stateRoot);

            let cStateRoot = await mosaicCore.getStateRoot.call(height);

            assert.strictEqual(
                cStateRoot,
                stateRoot,
                `State root from the contract must be ${stateRoot}.`
            );
        }
    );

});
