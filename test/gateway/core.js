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

const coreUtils = require('./core_utils.js')
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
            registrar = contractsData.registrar;
            chainIdRemote = contractsData.chainIdRemote;
        });

        it('has coreChainIdRemote', async () => {
            assert.equal(await core.chainIdRemote.call(), chainIdRemote);
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
        // Before all.
        before(async () => {
            blockHeight = 5;
            contractsData = await coreUtils.deployCore(artifacts, accounts);
            core = contractsData.core;
            worker = contractsData.worker;
            stateRoot = proof.account.stateRoot;
        });

        it('should be able to commit state root and getStateRoot for given block height', async () => {
            let response = await core.commitStateRoot(blockHeight, stateRoot, { from: worker })
                ;

            let formattedDecodedEvents = web3EventsDecoder.perform(response.receipt, core.address, core.abi);
            let event = formattedDecodedEvents['StateRootAvailable'];
            await coreUtils.checkStateRootAvailableEvent(event, blockHeight, stateRoot);
            assert.equal(await core.getStateRoot(blockHeight), stateRoot);
        });

        it('has valid latestStateRootBlockHeight', async () => {
            let latestStateRootBlockHeight = await core.getLatestStateRootBlockHeight.call();
            assert.equal(latestStateRootBlockHeight.toNumber(), blockHeight);
        });

        it('should not be able to commit state root of block height which is equal to latest block height', async () => {
            await utils.expectThrow(core.commitStateRoot(blockHeight, stateRoot, { from: worker }));
        });

        it('should not be able to commit state root of block height which is less than latest block height', async () => {
            await utils.expectThrow(core.commitStateRoot(3, stateRoot, { from: worker }));
        });

        it('should not be able to commit state root of block height if non worker commits root', async () => {
            await utils.expectThrow(core.commitStateRoot(6, stateRoot, { from: accounts[0] }));
        });

        it('should not be able to commit state root when state root is empty', async () => {
            await utils.expectThrow(core.commitStateRoot(6, '0x', { from: worker }));
        });

    });
});
