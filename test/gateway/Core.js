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
// Test: Core.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const web3 = require('../lib/web3.js');

const coreUtils = require('./Core_utils.js')
    , utils = require('../lib/utils.js')
    , proof = require('../data/proof')
    , RLP = require('rlp')
    , BN = require('bn.js')
    , web3EventsDecoder = require('../lib/event_decoder.js')
;

contract('Core', function (accounts) {

    describe('Properties', async () => {
        before(async () => {
            openSTRemote = proof.account.accountAddress;
            blockHeight = new BN(5);
            contractsData = await coreUtils.deployCore(artifacts, accounts);
            core = contractsData.core;
            workersContract = contractsData.workersContract;
            worker = contractsData.worker;
            registrar = contractsData.registrar;
            chainIdRemote = contractsData.chainIdRemote;
            chainIdOrigin = contractsData.chainIdOrigin;
        });

        it('has coreChainIdRemote', async () => {
            assert.equal(await core.chainIdRemote.call(), chainIdRemote);
        });

        it('has coreChainIdOrigin', async () => {
            assert.equal(await core.coreChainIdOrigin.call(), chainIdOrigin);
        });

        it('has workers', async () => {
            assert.equal(await core.workers.call(), workersContract.address);
            let latestStateRootBlockHeight = await core.getLatestStateRootBlockHeight.call();
        });
    });


    describe('commitStateRoot', async () => {
        // Before All
        before(async () => {
            blockHeight = 5;
            contractsData = await coreUtils.deployCore(artifacts, accounts);
            core = contractsData.core;
            worker = contractsData.worker;
            stateRoot = proof.account.stateRoot;
        });

        it('should be able to commit state root and getStateRoot for given block height', async () => {
            let response = await core.commitStateRoot(blockHeight, stateRoot, {from: worker})
            ;

            let formattedDecodedEvents = web3EventsDecoder.perform(response.receipt, core.address, core.abi);
            let event = formattedDecodedEvents['StateRootCommitted'];
            await coreUtils.checkStateRootCommittedEvent(event, blockHeight, stateRoot);
            assert.equal(await core.getStateRoot(blockHeight), stateRoot);
        });

        it('has valid latestStateRootBlockHeight', async () => {
            let latestStateRootBlockHeight = await core.getLatestStateRootBlockHeight.call();
            assert.equal(latestStateRootBlockHeight.toNumber(), blockHeight);
        });

        it('should not be able to commit state root of block height which is equal to latest block height', async () => {
            await utils.expectThrow(core.commitStateRoot(blockHeight, stateRoot, {from: worker}));
        });

        it('should not be able to commit state root of block height which is less than latest block height', async () => {
            await utils.expectThrow(core.commitStateRoot(3, stateRoot, {from: worker}));
        });

        it('should not be able to commit state root of block height if non worker commits root', async () => {
            await utils.expectThrow(core.commitStateRoot(6, stateRoot, {from: accounts[0]}));
        });

        it('should not be able to commit state root when state root is empty', async () => {
            await utils.expectThrow(core.commitStateRoot(6, '0x', {from: worker}));
        });

    });
});
