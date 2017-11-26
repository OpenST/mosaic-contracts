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
// Test: OpenSTUtility.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const Utils = require('./lib/utils.js');
const OpenSTUtility_utils = require('./OpenSTUtility_utils.js');
const Core = artifacts.require("./Core.sol");
const Hasher = artifacts.require("./Hasher.sol");

///
/// Test stories
/// 
/// Properties
/// 	has chainIdValue
/// 	has chainIdUtility
/// 	has registrar
///

contract('OpenSTUtility', function(accounts) {
	const chainIdValue   = 3;
	const chainIdUtility = 1410;
	const registrar      = accounts[1];

	describe('Properties', async () => {
		before(async () => {
	        contracts   = await OpenSTUtility_utils.deployOpenSTUtility(artifacts, accounts);
	        openSTUtility = contracts.openSTUtility;
	    })

		it('has chainIdValue', async () => {
			assert.equal(await openSTUtility.chainIdValue.call(), chainIdValue);
		})

		it('has chainIdUtility', async () => {
			assert.equal(await openSTUtility.chainIdUtility.call(), chainIdUtility);
		})

		it('has registrar', async () => {
			assert.equal(await openSTUtility.registrar.call(), registrar);
		})
	})
})
