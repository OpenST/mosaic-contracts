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
// Test: STPrime.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const web3 = require('../lib/web3.js');

const BN = require('bn.js');
const Utils = require('../lib/utils.js');
const STPrime_utils = require('./STPrime_utils.js');

///
/// Test stories
/// 
/// Mint, Claim, Burn
/// 	fails to mint by non-openSTProtocol
///		fails to mint by openSTProtocol when not initialized
///		successfully mints
///		successfully claims
/// 	fails to burn by non-openSTProtocol
/// 	fails to burn by openSTProtocol if msg.value != amount
///		successfully burns
///

// N.B.: BECAUSE THIS TEST AFFECTS THE EXTERNAL ACCOUNTS ON THE CHAIN, IT SHOULD BE RUN SEPARATELY
//		 AS ITS CHANGES TO ACCOUNT VALUES LAST BETWEEN RUNS
// TODO: Make contracts with necessary functionality to mock external accounts
contract('STPrime', function(accounts) {
	const openSTProtocol = accounts[4];

	const beneficiary = accounts[19]; // set to 0 balance in runTestRpc.sh
	const ST1		  = web3.utils.toWei(new BN('1'), "ether");
	const ST2 		  = web3.utils.toWei(new BN('2'), "ether");
	const ST800M	  = web3.utils.toWei(new BN('800000000'), "ether");
	const sendGas 	  = new BN(21000);

	var result 				= null;
	var totalBase 			= null;
	var totalSupply 		= null;
	var startingBalance		= null;
	var unclaimed 			= null;

	describe ('Mint, Claim, Burn', async () => {
		before(async () => {
	        contracts = await STPrime_utils.deploySTPrime(artifacts, accounts);
	        stPrime = contracts.stPrime;
		})

		it('fails to mint by non-openSTProtocol', async () => {
            await Utils.expectThrow(stPrime.mint(beneficiary, ST2, { from: accounts[0] }));
		})

		it('fails to mint by openSTProtocol when not initialized', async () => {
            await Utils.expectThrow(stPrime.mint(beneficiary, ST2, { from: openSTProtocol }));
		})

		it('successfully mints', async () => {
			await stPrime.initialize({ from: accounts[1], value: ST800M });

			assert.equal(await stPrime.totalSupply.call(), 0);
			beneficiaryBalance = new BN(await web3.eth.getBalance(beneficiary));
			assert.equal(beneficiaryBalance, 0);
			assert.equal(await stPrime.unclaimed.call(beneficiary), 0);
			assert.equal(await stPrime.mint.call(beneficiary, ST2, { from: openSTProtocol }), true);
			result = await stPrime.mint(beneficiary, ST2, { from: openSTProtocol });

			var postMintBase	= new BN(await web3.eth.getBalance(stPrime.address));
			totalSupply 		= await stPrime.totalSupply.call();
			unclaimed 			= await stPrime.unclaimed.call(beneficiary);
			beneficiaryBalance 	= new BN(await web3.eth.getBalance(beneficiary));

			assert(postMintBase.eq(ST800M));
			assert(totalSupply.eq(ST2));
			assert(unclaimed.eq(ST2));
			assert(beneficiaryBalance.eqn(0));
		})

		it('successfully claims', async () => {
			assert.equal(await stPrime.claim.call(beneficiary, { from: openSTProtocol }), true);
			result = await stPrime.claim(beneficiary, { from: openSTProtocol });

			var postClaimBase	= new BN(await web3.eth.getBalance(stPrime.address));
			totalSupply 		= await stPrime.totalSupply.call();
			unclaimed 			= await stPrime.unclaimed.call(beneficiary);
			beneficiaryBalance 	= new BN(await web3.eth.getBalance(beneficiary));

			assert(postClaimBase.eq(ST800M.sub(ST2)));
			assert(totalSupply.eq(ST2));
			assert(unclaimed.eqn(0));
			assert(beneficiaryBalance.eq(ST2));
		})

		it('fails to burn by non-openSTProtocol', async () => {
            await Utils.expectThrow(stPrime.burn(beneficiary, ST2, { from: accounts[0] }));
		})

		it('fails to burn by openSTProtocol if msg.value != amount', async () => {
			const STValue = web3.utils.toWei(new BN('1'), "ether");
			await Utils.expectThrow(stPrime.burn(beneficiary, ST2, { from: openSTProtocol, value: STValue }));
		})

		it('successfully burns', async () => {
			// Protocol must hold STPrime in order to burn STPrime
	        await web3.eth.sendTransaction({ from: beneficiary, to: openSTProtocol, value: ST1 });						
			assert.equal(await stPrime.burn.call(beneficiary, ST1, { from: openSTProtocol, value: ST1 }), true);
			result = await stPrime.burn(beneficiary, ST1, { from: openSTProtocol, value: ST1 });

			var postBurnBase	= new BN(await web3.eth.getBalance(stPrime.address));
			totalSupply 		= await stPrime.totalSupply.call();
			beneficiaryBalance 	= new BN(await web3.eth.getBalance(beneficiary));

			assert(postBurnBase.eq(ST800M.sub(ST1)));
			assert(totalSupply.eq(ST1));

			// beneficiary balance is down the transfer plus the cost of the transfer
			// the certain calculation of which has proved difficult
			assert(beneficiaryBalance.lt(ST1));
			assert(beneficiaryBalance.gtn(0));
		})
	})
})
