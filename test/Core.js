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
	    })

		it('has coreRegistrar', async () => {
			assert.equal(await core.registrar.call(), registrar);
		})

		it('has coreChainIdRemote', async () => {
			assert.equal(await core.chainIdRemote.call(), chainIdRemote);
		})

		it('has coreOpenSTRemote', async () => {
			assert.equal(await core.openSTRemote.call(), openSTRemote);
		})
	})
})
