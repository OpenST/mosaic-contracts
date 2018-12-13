// Copyright 2017 OpenST Ltd.
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
// Test: core.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const coreUtils = require('./safe_core_utils.js')
    , utils = require('../test_lib/utils.js')
    , proof = require('../data/proof')
    , BN = require('bn.js')
    , web3EventsDecoder = require('../test_lib/event_decoder.js')
    ;

contract('Core', function (accounts) {

    describe('Properties', async () => {
        before(async () => {
            openSTRemote = proof.account.accountAddress;
            blockHeight = new BN(5);
            contractsData = await coreUtils.deployCore(artifacts, accounts);
            core = contractsData.core;
            worker = contractsData.worker;
            remoteChainId = contractsData.remoteChainId;
        });

        it('has coreChainIdRemote', async () => {
            assert.equal(await core.getRemoteChainId.call(), remoteChainId);
        });
    });

    describe('setCoCoreAddress', async () => {
        beforeEach(async () => {
            contractsData = await coreUtils.deployCore(artifacts, accounts);
            core = contractsData.core;
            owner = contractsData.owner;
            worker = contractsData.worker;

            coCoreAddress = accounts[8];
        });

        it('should allow the organization to set the address', async () => {
            await core.setCoCoreAddress(coCoreAddress, { from: owner });

            let setAddress = await core.coCore.call();
            assert.strictEqual(
                coCoreAddress,
                setAddress,
                'The co-core address was not set as expected.',
            );
        });

        it('should not allow to set a zero address', async () => {
            await utils.expectRevert(
                core.setCoCoreAddress(
                    '0x0000000000000000000000000000000000000000',
                    { from: owner },
                ),
                'Co-Core address must not be 0.',
            );
        });

        it('should not allow a worker to set the address', async () => {
            await utils.expectRevert(
                core.setCoCoreAddress(
                    coCoreAddress,
                    { from: worker },
                ),
                'Only the organization is allowed to call this method.',
            );
        });

        it('should not allow a random address to set the address', async () => {
            await utils.expectRevert(
                core.setCoCoreAddress(
                    coCoreAddress,
                    { from: accounts[2] },
                ),
                'Only the organization is allowed to call this method.',
            );
        });

        it('should not allow to update the address after it was set', async () => {
            await core.setCoCoreAddress(coCoreAddress, { from: owner });
            await utils.expectRevert(
                core.setCoCoreAddress(coCoreAddress, { from: owner }),
                'Co-Core has already been set and cannot be updated.',
            );
        });

    });

    describe('commitStateRoot', async () => {
        let core;
        let worker;
        let blockHeight;
        let stateRoot;
        let maxNumberOfStateRoots;

        beforeEach(async () => {
            blockHeight = 5;
            contractsData = await coreUtils.deployCore(
                artifacts,
                accounts,
                blockHeight,
            );
            core = contractsData.core;
            worker = contractsData.worker;
            stateRoot = proof.account.stateRoot;
            maxNumberOfStateRoots = contractsData.numberOfStateRoots;
        });

        it('should be able to commit state root and getStateRoot for given block height', async () => {
            blockHeight++;

            let response = await core.commitStateRoot.call(
                blockHeight,
                stateRoot,
                { from: worker },
            );
            assert.strictEqual(
                response,
                true,
                'Committing a state root should return `true`.',
            );

            let transaction = await core.commitStateRoot(
                blockHeight,
                stateRoot,
                { from: worker },
            );

            let formattedDecodedEvents = web3EventsDecoder.perform(
                transaction.receipt,
                core.address,
                core.abi,
            );
            let event = formattedDecodedEvents['StateRootAvailable'];
            await coreUtils.checkStateRootAvailableEvent(
                event,
                blockHeight,
                stateRoot,
            );
            assert.equal(await core.getStateRoot(blockHeight), stateRoot);
        });

        it('has valid latestStateRootBlockHeight', async () => {
            let latestStateRootBlockHeight = await core.getLatestStateRootBlockHeight.call();
            assert.equal(latestStateRootBlockHeight.toNumber(), blockHeight);
        });

        it('should store only the given number of max store roots', async () => {
            /*
             * It should store the given state roots and they should be
             * available for querying afterwards. After the max number of state
             * roots has been exceeded, the old state roots should no longer be
             * available.
             */

            let iterations = maxNumberOfStateRoots * 2;
            for (let i = 0; i < iterations; i++) {
                blockHeight++;
                await core.commitStateRoot(
                    blockHeight,
                    stateRoot,
                    { from: worker },
                );

                // Check that the older state root has been deleted.
                if (i > maxNumberOfStateRoots) {
                    let prunedBlockHeight = blockHeight - maxNumberOfStateRoots;
                    let storedStateRoot = await core.getStateRoot.call(
                        new BN(prunedBlockHeight),
                    );

                    assert.strictEqual(
                        storedStateRoot,
                        '0x0000000000000000000000000000000000000000000000000000000000000000',
                        'There should not be any state root stored at a ' +
                        'pruned height. It should have been reset by now.',
                    );

                    /*
                     * The state root that is one block younger than the pruned
                     * one should still be available.
                     */
                    let existingBlockHeight = prunedBlockHeight + 1;
                    storedStateRoot = await core.getStateRoot.call(
                        new BN(existingBlockHeight),
                    );
                    assert.strictEqual(
                        storedStateRoot,
                        stateRoot,
                        'The stored state root should still exist.',
                    );

                }
            }
        });

        it('should not be able to commit state root of block height which is equal to latest block height', async () => {
            await utils.expectThrow(
                core.commitStateRoot(blockHeight, stateRoot, { from: worker }),
            );
        });

        it('should not be able to commit state root of block height which is less than latest block height', async () => {
            blockHeight--;
            await utils.expectThrow(
                core.commitStateRoot(blockHeight, stateRoot, { from: worker })
            );
        });

        it('should not be able to commit state root of block height if non worker commits root', async () => {
            blockHeight++;
            await utils.expectThrow(
                core.commitStateRoot(blockHeight, stateRoot, { from: accounts[0] })
            );
        });

        it('should not be able to commit state root when state root is empty', async () => {
            blockHeight++;
            await utils.expectThrow(
                core.commitStateRoot(blockHeight, '0x', { from: worker })
            );
        });

    });
});
