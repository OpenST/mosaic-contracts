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
// test/SimpleStake_basic.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const assert = require('assert');
const Utils = require('./lib/utils.js');
const SimpleStakeUtils = require('./SimpleStake_utils.js')

///
///  Test stories
/// 
///  Test SimpleStake in isolation from OpenST protocol
///  - 

contract('SimpleStake', function(accounts) {

	/// mock unique identifier for utility token
	const UUID = "0xbce8a3809c9356cf0e5178a2aef207f50df7d32b388c8fceb8e363df00efce31";
	/// mock OpenST protocol contract address
	const openSTProtocol = "0x6654f8a92c4521413fe997d11865730160ec1649";
	/// mock upgraded OpenST protocol contract address
	const upgradedOpenSTProtocol = "0x18ae4cd1d5a5fae4cf70e31bff16827150acb535";

	describe('Basic properties', async () => {

		var token = null;
		var simpleStake = null;
		
		before(async () => {
			var contracts =
				await SimpleStakeUtils.deploySingleSimpleStake(
					artifacts, accounts, openSTProtocol, UUID);

			token = contracts.token;
			simpleStake = contracts.simpleStake;
		});

		it("UUID", async() => {
			assert.equal(await simpleStake.uuid.call(), UUID);
		});


	});
});