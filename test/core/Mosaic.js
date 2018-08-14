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
// Test: Mosaic.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const Mosaic = artifacts.require('Mosaic');

contract('Mosaic', async (accounts) => {

    it('should start with the chain id at the given start', async () => {
        let expected = 14;
        let instance = await Mosaic.new(expected);
        let nextChainId = await instance.nextChainId.call();

        assert.equal(
            nextChainId.toNumber(),
            expected,
            'The next chain id should equal the id from the constructor.'
        );
    });

    it('should assign the start id to the first chain', async () => {
        let expectedChainId = 3;
        let expectedCoreAddress = '0x0123456789012345678901234567890123456789';
        let instance = await Mosaic.new(expectedChainId);
        await instance.registerChain(expectedCoreAddress);
        let coreAddress = await instance.coreAddresses.call(expectedChainId);

        assert.equal(
            coreAddress,
            expectedCoreAddress,
            'The core address of the given chain id should equal what was set.'
        );
    });

    it('should not accept a zero address', async () => {
        let instance = await Mosaic.new(2);

        let hasThrown = false;
        try {
            await instance.registerChain(
                '0x0000000000000000000000000000000000000000'
            );
        } catch (error) {
            hasThrown = true;
        }

        assert.equal(
            hasThrown,
            true,
            'The transaction should revert for a zero core address.'
        );
    });

    it('should fire an event about a newly registered chain', async () => {
        let expectedCoreAddress = '0x0123456789012345678901234567890123456789';
        let instance = await Mosaic.new(7);
        let transaction = await instance.registerChain(expectedCoreAddress);

        eventFound = false;
        for (let i = 0; i < transaction.logs.length; i++) {
            let log = transaction.logs[i];

            if (log.event === "ChainRegistered") {
                assert.equal(
                    log.args.chainId.toNumber(),
                    7,
                    'The logged chain\'s id should equal the first id.'
                );
                assert.equal(
                    log.args.coreAddress,
                    expectedCoreAddress,
                    'The logged core address should equal the one from registration.'
                );

                eventFound = true;
                break;
            }
        }

        assert.equal(
            eventFound,
            true,
            'The contract should emit a registration event.'
        );
    });

    it('should increment each chain\'s id by exactly one', async () => {
        let instance = await Mosaic.new(21);

        let firstCoreAddress = '0x0000000000000000000000000000000000000001';
        let secondCoreAddress = '0x0000000000000000000000000000000000000002';
        let thirdCoreAddress = '0x0000000000000000000000000000000000000003';

        await instance.registerChain(firstCoreAddress);
        await instance.registerChain(secondCoreAddress);
        await instance.registerChain(thirdCoreAddress);

        assert.equal(
            await instance.coreAddresses.call(21),
            firstCoreAddress,
            'The id of the first contract should be the initial id.'
        );
        assert.equal(
            await instance.coreAddresses.call(22),
            secondCoreAddress,
            'The id of the second contract should be the initial id + 1.'
        );
        assert.equal(
            await instance.coreAddresses.call(23),
            thirdCoreAddress,
            'The id of the third contract should be the initial id + 2.'
        );
    })
});