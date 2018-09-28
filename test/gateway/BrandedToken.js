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
// Test: BrandedToken.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const web3 = require('../lib/web3.js');

const BN = require('bn.js');
const Utils = require('../lib/utils.js');
const BrandedToken_utils = require('./BrandedToken_utils.js');

///
/// Test stories
/// 
/// Mint, Claim, Burn
/// 	fails to mint by non-openSTProtocol
///		successfully mints
///		successfully claims
/// 	fails to burn by non-openSTProtocol
/// 	fails to burn by openSTProtocol if msg.value != 0
///		successfully burns
///

contract('BrandedToken', function(accounts) {
	const openSTProtocol = accounts[4];

	const beneficiary = accounts[0];
	const ST1 = web3.utils.toWei(new BN('1'), "ether");
	const ST2 = web3.utils.toWei(new BN('2'), "ether");

	var result 				= null;
	var totalSupply 		= null;
	var tokenBalance 		= null;
	var beneficiaryBalance	= null;
	var unclaimed 			= null;

	describe ('Mint, Claim, Burn', async () => {
		before(async () => {
	        contracts = await BrandedToken_utils.deployBrandedToken(artifacts, accounts);
	        token = contracts.token;
		})

		it('fails to mint by non-openSTProtocol', async () => {
            await Utils.expectThrow(token.mint(beneficiary, ST2, { from: accounts[0] }));
		})

		it('successfully mints', async () => {
			assert.equal(await token.totalSupply.call(), 0);
			assert.equal(await token.balanceOf.call(token.address), 0);
			assert.equal(await token.balanceOf.call(beneficiary), 0);
			assert.equal(await token.unclaimed.call(beneficiary), 0);
			assert.equal(await token.mint.call(beneficiary, ST2, { from: openSTProtocol }), true);
			result = await token.mint(beneficiary, ST2, { from: openSTProtocol });

			totalSupply 		= await token.totalSupply.call();
			tokenBalance 		= await token.balanceOf.call(token.address);
			beneficiaryBalance 	= await token.balanceOf.call(beneficiary);
			unclaimed 			= await token.unclaimed.call(beneficiary);

			assert(totalSupply.eq(ST2));
			assert(tokenBalance.eq(ST2));
			assert(beneficiaryBalance.eqn(0));
			assert(unclaimed.eq(ST2));
		})

		it('successfully claims', async () => {
			assert.equal(await token.claim.call(beneficiary, { from: openSTProtocol }), true);
			result = await token.claim(beneficiary, { from: openSTProtocol });

			totalSupply 		= await token.totalSupply.call();
			tokenBalance 		= await token.balanceOf.call(token.address);
			beneficiaryBalance 	= await token.balanceOf.call(beneficiary);
			unclaimed 			= await token.unclaimed.call(beneficiary);

			assert(totalSupply.eq(ST2));
			assert(tokenBalance.eqn(0));
			assert(beneficiaryBalance.eq(ST2));
			assert(unclaimed.eqn(0));
		})

		it('fails to burn by non-openSTProtocol', async () => {
            await Utils.expectThrow(token.burn(beneficiary, ST1, { from: accounts[0] }));
		})

		it('fails to burn by openSTProtocol if msg.value != 0', async () => {
			const amountBT = web3.utils.toWei(new BN('1'), "ether");
      			await Utils.expectThrow(token.burn(beneficiary, ST1, { from: openSTProtocol, value: amountBT }));
		})

		it('successfully burns', async () => {
			// Protocol must hold tokens in order to burn tokens
			await token.transfer(openSTProtocol, ST1, { from: beneficiary });
			var protocolBalance = await token.balanceOf.call(openSTProtocol);
			assert(protocolBalance.eq(ST1));
			assert.equal(await token.burn.call(beneficiary, ST1, { from: openSTProtocol }), true);
			result = await token.burn(beneficiary, ST1, { from: openSTProtocol });

			totalSupply 	= await token.totalSupply.call();
			protocolBalance = await token.balanceOf.call(openSTProtocol);

			assert(totalSupply.eq(ST1));
			assert(protocolBalance.eqn(0));
		})
	})
})
