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
// Test: SimpleStake.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const web3 = require('../test_lib/web3.js');

const BN = require('bn.js');
const Utils = require('../test_lib/utils.js');
const SimpleStake_utils = require('./SimpleStake_utils.js');

///
/// Test stories
/// 
/// Properties 
/// 	has eip20Token
/// 	has uuid
/// 
/// ReleaseTo
///		fails to release by non-openSTProtocol
///		fails to release by openSTProtocol with null to
///		successfully releases to
///

contract('SimpleStake', function(accounts) {
	const gateway = accounts[4];
	const to = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
	const ST1 = web3.utils.toWei(new BN('1'), "ether");
	const ST2 = web3.utils.toWei(new BN('2'), "ether");

	describe ('Properties', async () => {
		before(async () => {
	        contracts = await SimpleStake_utils.deploySimpleStake(artifacts, accounts);
	        token = contracts.token;
	        simpleStake = contracts.simpleStake;
		})
		
		it('has eip20Token', async () => {
			assert.equal(await simpleStake.eip20Token.call(), token.address);
		})
	})
	
	describe('ReleaseTo', async () => {
		before(async () => {
	        contracts = await SimpleStake_utils.deploySimpleStake(artifacts, accounts);
	        token = contracts.token;
	        simpleStake = contracts.simpleStake;
	        await token.transfer(simpleStake.address, ST2, { from: accounts[0] });
		})

		it('fails to release by non-gateway', async () => {
            await Utils.expectThrow(simpleStake.releaseTo(to, ST1, { from: accounts[0] }));
		});

		it('fails to release by gateway with null to', async () => {
            await Utils.expectThrow(simpleStake.releaseTo(0, ST1, { from: gateway }));
		});

		it('successfully releases to', async () => {
			var stake = await simpleStake.getTotalStake.call();
			assert(stake.eq(ST2));
			assert.equal(await simpleStake.releaseTo.call(to, ST1, { from: gateway }), true);
			result = await simpleStake.releaseTo(to, ST1, { from: gateway });

			var updatedStake = await simpleStake.getTotalStake.call();
			assert(updatedStake.eq(stake.sub(ST1)));
			SimpleStake_utils.checkReleasedEventGroup(result, gateway, to, ST1);
		});
	})
})

