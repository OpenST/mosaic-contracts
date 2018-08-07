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

const BigNumber = require('bignumber.js');
const Utils = require('../lib/utils.js');
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
	const UUID = "0xbce8a3809c9356cf0e5178a2aef207f50df7d32b388c8fceb8e363df00efce31";
	const openSTProtocol = accounts[4];
	const to = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
	const ST1 = new BigNumber(web3.toWei(1, "ether"));
	const ST2 = new BigNumber(web3.toWei(2, "ether"));

	describe ('Properties', async () => {
		before(async () => {
	        contracts = await SimpleStake_utils.deploySimpleStake(artifacts, accounts);
	        token = contracts.token;
	        simpleStake = contracts.simpleStake;
		})
		
		it('has eip20Token', async () => {
			assert.equal(await simpleStake.eip20Token.call(), token.address);
		})
		
		it('has uuid', async () => {
			assert.equal(await simpleStake.uuid.call(), UUID);
		})
	})
	
	describe('ReleaseTo', async () => {
		before(async () => {
	        contracts = await SimpleStake_utils.deploySimpleStake(artifacts, accounts);
	        token = contracts.token;
	        simpleStake = contracts.simpleStake;
	        await token.transfer(simpleStake.address, ST2, { from: accounts[0] });
		})

		it('fails to release by non-openSTProtocol', async () => {
            await Utils.expectThrow(simpleStake.releaseTo(to, ST1, { from: accounts[0] }));
		});

		it('fails to release by openSTProtocol with null to', async () => {
            await Utils.expectThrow(simpleStake.releaseTo(0, ST1, { from: openSTProtocol }));
		});

		it('successfully releases to', async () => {
			var stake = await simpleStake.getTotalStake.call();
			assert.equal(stake.toNumber(), ST2.toNumber());
			assert.equal(await simpleStake.releaseTo.call(to, ST1, { from: openSTProtocol }), true);
			result = await simpleStake.releaseTo(to, ST1, { from: openSTProtocol });

			var updatedStake = await simpleStake.getTotalStake.call();
			assert.equal(updatedStake.toNumber(), stake.minus(ST1).toNumber());
			SimpleStake_utils.checkReleasedEventGroup(result, openSTProtocol, to, ST1);
		});
	})
})

