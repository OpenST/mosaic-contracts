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

const coreUtils = require('./Core_utils.js')
    , utils = require('./lib/utils.js')
    , proof = require('./data/proof')
    , ethUtil = require('ethereumjs-util')
    , BigNumber = require('bignumber.js')
    , web3EventsDecoder = require('./lib/event_decoder.js')
;

contract('Core', function (accounts) {
    const openSTRemote = proof.account.openSTRemoteAddress
        , blockHeight = new BigNumber(5)
    ;

    describe('Properties', async () => {
        before(async () => {
            contractsData = await coreUtils.deployCore(artifacts, accounts);
            core = contractsData.core;
            workerContract = contractsData.workerContract;
            worker = contractsData.worker;
            registrar = contractsData.registrar;
            chainIdRemote = contractsData.chainIdRemote;
            chainIdOrigin = contractsData.chainIdOrigin;
            await core.commitStateRoot(blockHeight.toNumber(), proof.account.stateRoot, {from: worker});
            await core.proveOpenST(blockHeight.toNumber(), proof.account.rlpEncodedAccount, proof.account.rlpParentNodes, {from: worker});
        });

        it('has coreRegistrar', async () => {
            assert.equal(await core.registrar.call(), registrar);
        });

        it('has coreChainIdRemote', async () => {
            assert.equal(await core.chainIdRemote.call(), chainIdRemote);
        });

        it('has coreChainIdOrigin', async () => {
            assert.equal(await core.coreChainIdOrigin.call(), chainIdOrigin);
        });

        it('has coreOpenSTRemote', async () => {
            assert.equal(await core.openSTRemote.call(), openSTRemote);
        });

        // it('has encodedOpenSTRemotePath', async () => {
        //   let expectedEncodedAddress = '0x' + ethUtil.sha3(openSTRemote).toString('hex');
        //   assert.equal(await core.encodedOpenSTRemotePath.call(), expectedEncodedAddress);
        // });

        it('has worker', async () => {
            assert.equal(await core.workers.call(), workerContract.address);
        });

        it('has latestStateRootBlockHeight', async () => {
            let actualBlockHeight = await core.getLatestStateRootBlockHeight.call();
            assert.equal(actualBlockHeight.eq(blockHeight), true);
        });

    });


    describe('commitStateRoot', async () => {
        // Before All
        before(async () => {
            contractsData = await coreUtils.deployCore(artifacts, accounts);
            core = contractsData.core;
            worker = contractsData.worker;
        });

        it('should be able to commit state root and getStateRoot for give block height', async () => {
            let stateRoot = '0x4567897545535535365000000000000000000000000000000000000000000000'
                , blockHeight = 1
            ;
            let response = await core.commitStateRoot(blockHeight, stateRoot, {from: worker});

            let formattedDecodedEvents = web3EventsDecoder.perform(response.receipt, core.address, core.abi);
            let event = formattedDecodedEvents['StateRootCommitted'];

            await coreUtils.checkStateRootCommittedEvent(event, blockHeight, stateRoot);
            assert.equal(await core.getStateRoot(blockHeight), stateRoot);
        });

        it('should not be able to commit state root of block height if non worker commits root', async () => {
            await utils.expectThrow(core.commitStateRoot(1, '0x4567897545535535365', {from: accounts[0]}));
        });

        it('should not be able to commit state root of block height which is already commited', async () => {
            await utils.expectThrow(core.commitStateRoot(1, '0x4567897545535535365', {from: worker}));
        });

        it('should not be able to commit state root of block height less than latest block height', async () => {
            await core.commitStateRoot(4, '0x45675567897545535535365', {from: worker});
            await utils.expectThrow(core.commitStateRoot(3, '0x4567897545535535365', {from: worker}));
        });

        it('should not be able to commit state root of when state root is 0x', async () => {
            await utils.expectThrow(core.commitStateRoot(5, '0x', {from: worker}));
        });

    });

    describe('proveOpenST', async () => {
        let blockHeight = 5
            , parentNodes = ethUtil.rlp.decode(proof.account.rlpParentNodes)
            , accountNode = parentNodes[parentNodes.length - 1]
            , accountValue = ethUtil.rlp.decode(accountNode[1])
            , storageRoot = '0x' + accountValue[2].toString('hex')
        ;

        before(async () => {

            contractsData = await coreUtils.deployCore(artifacts, accounts);
            core = contractsData.core;
            worker = contractsData.worker;

            await core.commitStateRoot(blockHeight, proof.account.stateRoot, {from: worker});
        });

        it('should not be able to verify proof for account if block height is 0', async () => {
            await utils.expectThrow(core.proveOpenST(0, proof.account.rlpEncodedAccount, proof.account.rlpParentNodes, {from: worker}));
        });

        it('should not be able to verify proof for account if rlpEncodedAccount value is blank', async () => {
            await utils.expectThrow(core.proveOpenST(blockHeight, '', proof.account.rlpParentNodes, {from: worker}));
        });

        it('should not be able to verify proof for account if rlpEncodedAccount value is 0x', async () => {
            await utils.expectThrow(core.proveOpenST(blockHeight, '0x', proof.account.rlpParentNodes, {from: worker}));
        });

        it('should not be able to verify proof for account if rlpParentNodes value is blank', async () => {
            await utils.expectThrow(core.proveOpenST(blockHeight, proof.account.rlpEncodedAccount, '', {from: worker}));
        });

        it('should not be able to verify proof for account if rlpParentNodes value is 0x', async () => {
            await utils.expectThrow(core.proveOpenST(blockHeight, proof.account.rlpEncodedAccount, '0x', {from: worker}));
        });

        it('should be able to verify proof for account with wasAlreadyProved = false ', async () => {
            let response = await core.proveOpenST(blockHeight, proof.account.rlpEncodedAccount, proof.account.rlpParentNodes, {from: worker});
            let formattedDecodedEvents = web3EventsDecoder.perform(response.receipt, core.address, core.abi);
            let event = formattedDecodedEvents['OpenSTProven'];
            await coreUtils.checkOpenSTProvenEvent(event, blockHeight, storageRoot, false);
        });

        it('should be able to verify proof for account with wasAlreadyProved = true', async () => {
            let response = await core.proveOpenST(blockHeight, proof.account.rlpEncodedAccount, proof.account.rlpParentNodes, {from: worker});
            let formattedDecodedEvents = web3EventsDecoder.perform(response.receipt, core.address, core.abi);
            let event = formattedDecodedEvents['OpenSTProven'];
            await coreUtils.checkOpenSTProvenEvent(event, blockHeight, storageRoot, true);
        });

        it('should be able to verify proof for account if called by non worker', async () => {
            let response = await core.proveOpenST(blockHeight, proof.account.rlpEncodedAccount, proof.account.rlpParentNodes, {from: accounts[0]});
            let formattedDecodedEvents = web3EventsDecoder.perform(response.receipt, core.address, core.abi);
            let event = formattedDecodedEvents['OpenSTProven'];
            await coreUtils.checkOpenSTProvenEvent(event, blockHeight, storageRoot, true);
        });

        it('should not be able to verify proof for account if block state root is not committed for a blockHeight', async () => {
            await utils.expectThrow(core.proveOpenST(6, proof.account.rlpEncodedAccount, proof.account.rlpParentNodes, {from: worker}));
        });

        it('should not be able to verify proof for account if wrong rlp encoded account value is passed', async () => {
            await utils.expectThrow(core.proveOpenST(blockHeight, '0x346abcdef45363678578322467885654422353665', proof.account.rlpParentNodes, {from: worker}));
        });

        it('should be able to verify proof for account even if wrong parentNodes are passed in replay call i.e. wasAlreadyProven', async () => {
            let wrongRLPNodes = '0x456785315786abcde456785315786abcde456785315786abcde';
            let response = await core.proveOpenST(blockHeight, proof.account.rlpEncodedAccount, wrongRLPNodes, {from: worker});
            let formattedDecodedEvents = web3EventsDecoder.perform(response.receipt, core.address, core.abi);
            let event = formattedDecodedEvents['OpenSTProven'];
            await coreUtils.checkOpenSTProvenEvent(event, blockHeight, storageRoot, true);

        });

        it('should verify proveOpenST in order of blockHeight 6, 10, 8 means proveOpenST should work for any blockHeight irrespective of any order', async () => {
            // commitStateRoot needs to be in order
            await core.commitStateRoot(6, proof.account.stateRoot, {from: worker});
            await core.commitStateRoot(8, proof.account.stateRoot, {from: worker});
            await core.commitStateRoot(10, proof.account.stateRoot, {from: worker});

            // Verification for block Height 6
            let response = await core.proveOpenST(6, proof.account.rlpEncodedAccount, proof.account.rlpParentNodes, {from: worker});
            let formattedDecodedEvents = web3EventsDecoder.perform(response.receipt, core.address, core.abi);
            let event = formattedDecodedEvents['OpenSTProven'];
            await coreUtils.checkOpenSTProvenEvent(event, 6, storageRoot, false);

            // Verification for block Height 10
            response = await core.proveOpenST(10, proof.account.rlpEncodedAccount, proof.account.rlpParentNodes, {from: worker});
            formattedDecodedEvents = web3EventsDecoder.perform(response.receipt, core.address, core.abi);
            event = formattedDecodedEvents['OpenSTProven'];
            await coreUtils.checkOpenSTProvenEvent(event, 10, storageRoot, false);

            // Verification for block Height 8
            response = await core.proveOpenST(8, proof.account.rlpEncodedAccount, proof.account.rlpParentNodes, {from: worker});
            formattedDecodedEvents = web3EventsDecoder.perform(response.receipt, core.address, core.abi);
            event = formattedDecodedEvents['OpenSTProven'];
            await coreUtils.checkOpenSTProvenEvent(event, 8, storageRoot, false);

        });
    });

});
