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

const Core_utils = require('./Core_utils.js');
const Utils = require('./lib/utils.js');
const accountProof = require('./data/AccountProof');
const ethutil = require('ethereumjs-util');
const BigNumber = require('bignumber.js');
const web3EventsDecoder = require('./lib/event_decoder.js');

///
/// Test stories
/// 
/// Properties
/// 	has coreRegistrar
/// 	has coreChainIdRemote
/// 	has coreOpenSTRemote
/// 

contract('Core', function(accounts) {
	const registrar = accounts[1];
	const chainIdRemote = 1410;
  const openSTRemote = '0x01db94fdca0ffedc40a6965de97790085d71b412';

	describe('Properties', async () => {
		before(async () => {
      contracts = await Core_utils.deployCore(artifacts, accounts);
      core = contracts.core;
      workercontract = contracts.workercontract;
      worker = contracts.worker;
      await core.commitStateRoot(5, accountProof.stateRoot, {from: worker});
      await core.proveOpenST(5, accountProof.value, accountProof.RLPparentNodes, {from: worker});

    });

		it('has coreRegistrar', async () => {
			assert.equal(await core.registrar.call(), registrar);
    });

		it('has coreChainIdRemote', async () => {
			assert.equal(await core.chainIdRemote.call(), chainIdRemote);
    });

		it('has coreOpenSTRemote', async () => {
			assert.equal(await core.openSTRemote.call(), openSTRemote);
    });

    it('has encodedOpenSTRemoteAddress', async () => {
      let expectedEncodedAddress = '0x' + ethutil.sha3(openSTRemote).toString('hex');
      assert.equal(await core.encodedOpenSTRemoteAddress.call(), expectedEncodedAddress);
    });

    it('has worker', async () => {
      assert.equal(await core.workers.call(), workercontract.address);
    });

    it('has latestStateRootBlockHeight', async () => {
      let actualBlockHeight = await core.latestStateRootBlockHeight.call();
      assert.equal(actualBlockHeight.eq(new BigNumber(5)), true);
    });

    it('has latestStorageRootBlockHeight', async () => {
      let actualBlockHeight = await core.latestStorageRootBlockHeight.call();
      assert.equal(actualBlockHeight.eq(new BigNumber(5)), true);
    });

  });


  describe('commitStateRoot', async () => {
    before(async () => {
      contracts = await Core_utils.deployCore(artifacts, accounts);
      core = contracts.core;
      worker = contracts.worker;
    });

    it('should be able to commit state root for give block height', async () => {
      let stateRoot = '0x4567897545535535365000000000000000000000000000000000000000000000';
      let response = await core.commitStateRoot(1, stateRoot, {from: worker});

      let formattedDecodedEvents = web3EventsDecoder.perform(response.receipt, core.address, core.abi);
      let event = formattedDecodedEvents['StateRootCommitted'];

      assert.equal(event !== null, true);
      assert.equal(event["blockHeight"], 1);
      assert.equal(event["stateRoot"], stateRoot);
    });

    it('should not be able to commit state root of block height if non worker commits root', async () => {
      await Utils.expectThrow(core.commitStateRoot(1, '0x4567897545535535365', {from: accounts[0]}));
    });
    it('should not be able to commit state root of block height which is already commited', async () => {
      await Utils.expectThrow(core.commitStateRoot(1, '0x4567897545535535365', {from: worker}));
    });

    it('should not be able to commit state root of block height less than latest block height', async () => {
      await core.commitStateRoot(4, '0x45675567897545535535365', {from: worker});
      await Utils.expectThrow(core.commitStateRoot(3, '0x4567897545535535365', {from: worker}));
    });
  });

  describe('Prove OpenSt', async () => {
    before(async () => {

      contracts = await Core_utils.deployCore(artifacts, accounts);
      core = contracts.core;
      worker = contracts.worker;
      await core.commitStateRoot(5, accountProof.stateRoot, {from: worker});
    });

    it('should be able to verify proof for account', async () => {

      let parentNodes = ethutil.rlp.decode(accountProof.RLPparentNodes);
      let accountNode = parentNodes[parentNodes.length - 1];
      let accountValue = ethutil.rlp.decode(accountNode[1]);
      let storageRoot = '0x' + accountValue[2].toString('hex');
      let hashedAccountValue = '0x'+ethutil.sha3(accountProof.value).toString('hex');

      let response = await core.proveOpenST(5, accountProof.value, accountProof.RLPparentNodes, {from: worker});

      let formattedDecodedEvents = web3EventsDecoder.perform(response.receipt, core.address, core.abi);
      let event = formattedDecodedEvents['OpenSTProven'];

      assert.equal(event !== null, true);
      assert.equal(event["blockHeight"], 5);
      assert.equal(event["storageRoot"], storageRoot);
      assert.equal(event["hashedAccount"], hashedAccountValue);
    });

    it('should be able to verify proof for account if its called by non worker ', async () => {

      await Utils.expectThrow(core.proveOpenST(5, accountProof.value, accountProof.RLPparentNodes, {from: accounts[0]}));

    });

    it('should not be able to verify proof for account if block state root is not committed', async () => {

      await Utils.expectThrow(core.proveOpenST(6, accountProof.value, accountProof.RLPparentNodes, {from: worker}));

    });

    it('should not be able to verify proof for account if wrong value is passed', async () => {

      await Utils.expectThrow(core.proveOpenST(5, '0x346abcdef45363678578322467885654422353665', accountProof.RLPparentNodes, {from: worker}));
    });

    it('should not be able to verify proof for account if wrong parentNodes are passed', async () => {

      let wrongRLPNodes = '0x456785315786abcde456785315786abcde456785315786abcde'
      await Utils.expectThrow(core.proveOpenST(5, accountProof.value, wrongRLPNodes, {from: worker}));
    });
});

});
