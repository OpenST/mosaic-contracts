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
	const openSTRemote = accounts[4];

	describe('Properties', async () => {
		before(async () => {
	        contracts = await Core_utils.deployCore(artifacts, accounts);
	        core = contracts.core;
    });

		it('has coreRegistrar', async () => {
			assert.equal(await core.registrar.call(), registrar);
    });

		it('has coreChainIdRemote', async () => {
			assert.equal(await core.chainIdRemote.call(), chainIdRemote);
    });

		it('has coreOpenSTRemote', async () => {
			assert.equal(await core.openSTRemote.call(), openSTRemote);
		})
  });


  describe('commitStateRoot', async () => {
    before(async () => {
      contracts = await Core_utils.deployCore(artifacts, accounts);
      core = contracts.core;
      worker = contracts.worker;
    });

    it('should be able to commit state root for give block height', async () => {
      let reciept = await core.commitStateRoot(1, '0x4567897545535535365', {from: worker});
      assert.equal(reciept.logs.length, 1);
      assert.equal(reciept.logs[0].event, 'StateRootCommitted');
    });

    it('should not be able to commit state root of block height which is already commited', async () => {
      await Utils.expectThrow(core.commitStateRoot(1, '0x4567897545535535365', {from: worker}));
    });

    it('should not be able to commit state root of block height less than latest block height', async () => {
      await core.commitStateRoot(4, '0x45675567897545535535365', {from: worker});
      await Utils.expectThrow(core.commitStateRoot(3, '0x4567897545535535365', {from: worker}));
    });

  })
});
