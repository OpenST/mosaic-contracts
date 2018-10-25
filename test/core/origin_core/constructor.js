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
// Test: constructor.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const web3 = require('../../test_lib/web3.js');

const BN = require('bn.js');
const Utils = require('../../test_lib/utils.js');

const OriginCore = artifacts.require('OriginCore');

contract('OriginCore.constructor()', async (accounts) => {


    let originCore, gas, transactionRoot, ost, maxAccumulateGasLimit;
    let auxiliaryCoreIdentifier = web3.utils.sha3("1");
    let minimumWeight = new BN('1');

    beforeEach(async () => {
        ost = accounts[0];
        gas = new BN(1000);
        transactionRoot = web3.utils.sha3("1");
        maxAccumulateGasLimit = new BN(105000);
    });

    it('should be able to deploy Origin core', async function () {

        originCore = await OriginCore.new(
            auxiliaryCoreIdentifier,
            ost,
            gas,
            transactionRoot,
            minimumWeight,
            maxAccumulateGasLimit
        );

        assert(web3.utils.isAddress(originCore.address));
    });

    it('should deploy stake contract on Origin core deployment', async function () {

        originCore = await OriginCore.new(
            auxiliaryCoreIdentifier,
            ost,
            gas,
            transactionRoot,
            minimumWeight,
            maxAccumulateGasLimit
        );

        assert(web3.utils.isAddress(originCore.address));

        let stakeAddress = await originCore.stake.call();

        assert(web3.utils.isAddress(stakeAddress));
    });

    it('should report genesis block on Origin core deployment', async function () {

        originCore = await OriginCore.new(
            auxiliaryCoreIdentifier,
            ost,
            gas,
            transactionRoot,
            minimumWeight,
            maxAccumulateGasLimit
        );

        assert(web3.utils.isAddress(originCore.address));

        let head = await originCore.head.call();

        assert(head !== '0x0000000000000000000000000000000000000000000000000000000000000000');
    });

    it('should not deploy origin core if transaction root is zero', async function () {

        transactionRoot = "0x0000000000000000000000000000000000000000000000000000000000000000";
        await Utils.expectThrow(
            OriginCore.new(
                auxiliaryCoreIdentifier,
                ost,
                gas,
                transactionRoot,
                minimumWeight,
                maxAccumulateGasLimit
            ),
        );
    });

    it('should not deploy origin core if ost token root is zero', async function () {

        ost = 0;

        await Utils.expectThrow(
            OriginCore.new(
                auxiliaryCoreIdentifier,
                ost,
                gas,
                transactionRoot,
                minimumWeight,
                maxAccumulateGasLimit
            ),
        );
    });

    it('should not deploy origin core if max accumulated gas limit is zero',
        async function () {

        maxAccumulateGasLimit = new BN(0);

        await Utils.expectThrow(
            OriginCore.new(
                auxiliaryCoreIdentifier,
                ost,
                gas,
                transactionRoot,
                minimumWeight,
                maxAccumulateGasLimit
            ),
            "Max accumulated gas limit should not be zero."
    );
  });
});

