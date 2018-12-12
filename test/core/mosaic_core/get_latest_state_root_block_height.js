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
const MosaicCore = artifacts.require('TestMosaicCore');

/**
 * @dev This test just verifies the value of variable is
 *      latestStateRootBlockHeight returned by the
 *      `getLatestStateRootBlockHeight()`.
 */

contract('MosaicCore.getLatestStateRootBlockHeight()', async (accounts) => {

    const coreIdentifier = '0x0000000000000000000000000000000000000001';

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

    it('should return zero.',
        async function () {
            let latestStateRootBlockHeight =
                await mosaicCore.getLatestStateRootBlockHeight.call();

            assert(
                latestStateRootBlockHeight.eq(new BN(0)),
                "The latest height from the contract must be zero."
            );
        }
    );

    it('should return latestStateRootBlockHeight variable value.',
        async function () {
            let height = new BN(1234);
            await mosaicCore.setLatestStateRootBlockHeight(height);

            let latestStateRootBlockHeight =
                await mosaicCore.getLatestStateRootBlockHeight.call();

            assert(
                latestStateRootBlockHeight.eq(height),
                `State root from the contract must be ${height}.`
            );
        }
    );

});
