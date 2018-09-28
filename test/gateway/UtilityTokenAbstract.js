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
// Test: UtilityTokenAbstract.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const web3 = require('../lib/web3.js');

const BN = require('bn.js');
const Utils = require('../lib/utils.js');
const UtilityTokenAbstract_utils = require('./UtilityTokenAbstract_utils.js');

const UtilityTokenAbstract = artifacts.require("./UtilityTokenAbstractMock.sol");

///
/// Test stories
/// 
/// Construction
/// 	fails to deploy if UUID is bad
///
/// Properties 
/// 	has uuid
/// 	has conversionRate
///		has conversionRateDecimals
/// 	has genesisChainIdValue
/// 	has genesisChainIdUtility
/// 	has genesisOpenSTUtility
/// 
/// MintInternal, ClaimInternal, and BurnInternal
/// 	successfully mints
/// 	successfully claims
/// 	successfully burns
///

contract('UtilityTokenAbstract', function(accounts) {
	const openSTProtocol 		= accounts[4];
	const conversionRateDecimals = 5;
	const conversionRate 		= new BN(10 * (10**conversionRateDecimals)); // conversion rate => 10
	const genesisChainIdValue 	= 3;
	const genesisChainIdUtility = 1410;
	const beneficiary1   		= '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
	const beneficiary2 	 		= '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
	const ST1 			 		= web3.utils.toWei(new BN('1'), "ether");
	const ST2 			 		= web3.utils.toWei(new BN('2'), "ether");
	const ST3 			 		= web3.utils.toWei(new BN('3'), "ether");
	const ST4 			 		= web3.utils.toWei(new BN('4'), "ether");

	var contracts 			 = null;
	var hasher 				 = null;
	var utilityTokenAbstract = null;
	var uuid 				 = null;
	var totalSupply 		 = null;
	var unclaimed 			 = null;
	var result 				 = null;
	var amount 				 = null;

	describe ('Construction', async () => {
		it('fails to deploy if UUID is bad', async () => {
			await Utils.expectThrow(UtilityTokenAbstract.new("0x", "symbol", "name", genesisChainIdValue, genesisChainIdUtility, conversionRate, conversionRateDecimals, { from: openSTProtocol }));
		})
	})

	describe ('Properties', async () => {
		before(async () => {
	        contracts 			 = await UtilityTokenAbstract_utils.deployUtilityTokenAbstract(artifacts, accounts);
	        hasher 				 = contracts.hasher;
	        utilityTokenAbstract = contracts.utilityTokenAbstract;
		})
		
		it('has uuid', async () => {
			uuid = await hasher.hashUuid.call("symbol", "name", genesisChainIdValue, genesisChainIdUtility, openSTProtocol, conversionRate, conversionRateDecimals);
			assert.equal(await utilityTokenAbstract.uuid.call(), uuid);
		})

		it ('has conversionRate', async () => {
			const contractConversionRate = await utilityTokenAbstract.conversionRate.call();			
			assert(contractConversionRate.eq(conversionRate));
		})

		it ('has conversionRateDecimals', async () => {
			const contractConversionRateDecimals = await utilityTokenAbstract.conversionRateDecimals.call();			
			assert.equal(contractConversionRateDecimals, conversionRateDecimals);
		})

		it ('has genesisChainIdValue', async () => {
			assert.equal(await utilityTokenAbstract.genesisChainIdValue.call(), genesisChainIdValue);
		})

		it ('has genesisChainIdUtility', async () => {
			assert.equal(await utilityTokenAbstract.genesisChainIdUtility.call(), genesisChainIdUtility);
		})

		it ('has genesisOpenSTUtility', async () => {
			assert.equal(await utilityTokenAbstract.genesisOpenSTUtility.call(), openSTProtocol);
		})
	})

	describe ('MintInternal, ClaimInternal, and BurnInternal', async () => {
		before(async () => {
	        contracts = await UtilityTokenAbstract_utils.deployUtilityTokenAbstract(artifacts, accounts);
	        utilityTokenAbstract = contracts.utilityTokenAbstract;
		})

		it('successfully mints', async () => {
			totalSupply = await utilityTokenAbstract.totalSupply.call();
			unclaimed = await utilityTokenAbstract.unclaimed.call(beneficiary1);
			assert.equal(totalSupply.toNumber(), 0);
			assert.equal(unclaimed.toNumber(), 0);
			assert.equal(await utilityTokenAbstract.mintInternalPublic.call(beneficiary1, ST2), true);

			// Mint for beneficiary1
			result = await utilityTokenAbstract.mintInternalPublic(beneficiary1, ST2);

			totalSupply = await utilityTokenAbstract.totalSupply.call();
			unclaimed = await utilityTokenAbstract.unclaimed.call(beneficiary1);
			assert(totalSupply.eq(ST2));
			assert(unclaimed.eq(ST2));
			UtilityTokenAbstract_utils.checkMintedEvent(result.logs[0], uuid, beneficiary1, ST2, ST2, ST2);

			// Mint again for beneficiary1
			result = await utilityTokenAbstract.mintInternalPublic(beneficiary1, ST1);

			totalSupply = await utilityTokenAbstract.totalSupply.call();
			unclaimed = await utilityTokenAbstract.unclaimed.call(beneficiary1);
			assert(totalSupply.eq(ST3));
			assert(unclaimed.eq(ST3));
			UtilityTokenAbstract_utils.checkMintedEvent(result.logs[0], uuid, beneficiary1, ST1, ST3, ST3);

			unclaimed = await utilityTokenAbstract.unclaimed.call(beneficiary2);
			assert.equal(unclaimed.toNumber(), 0);
			assert.equal(await utilityTokenAbstract.mintInternalPublic.call(beneficiary2, ST1), true);

			// Mint for beneficiary2
			result = await utilityTokenAbstract.mintInternalPublic(beneficiary2, ST1);

			totalSupply = await utilityTokenAbstract.totalSupply.call();
			unclaimed = await utilityTokenAbstract.unclaimed.call(beneficiary2);
			assert(totalSupply.eq(ST4));
			assert(unclaimed.eq(ST1));
			UtilityTokenAbstract_utils.checkMintedEvent(result.logs[0], uuid, beneficiary2, ST1, ST1, ST4);
		})

		it('successfully claims', async () => {
			// Claim for beneficiary1
			totalSupply = await utilityTokenAbstract.totalSupply.call();
			unclaimed = await utilityTokenAbstract.unclaimed.call(beneficiary1);
			amount = await utilityTokenAbstract.claimInternalPublic.call(beneficiary1);
			assert(unclaimed.eq(amount));
			result = await utilityTokenAbstract.claimInternalPublic(beneficiary1);

			var postClaimTotalSupply = await utilityTokenAbstract.totalSupply.call();
			unclaimed = await utilityTokenAbstract.unclaimed.call(beneficiary1);
			assert(totalSupply.eq(postClaimTotalSupply));
			assert(unclaimed.eqn(0));

			// Claim for beneficiary2
			totalSupply = await utilityTokenAbstract.totalSupply.call();
			unclaimed = await utilityTokenAbstract.unclaimed.call(beneficiary2);
			amount = await utilityTokenAbstract.claimInternalPublic.call(beneficiary2);
			assert(unclaimed.eq(amount));
			result = await utilityTokenAbstract.claimInternalPublic(beneficiary2);

			postClaimTotalSupply = await utilityTokenAbstract.totalSupply.call();
			unclaimed = await utilityTokenAbstract.unclaimed.call(beneficiary2);
			assert(totalSupply.eq(postClaimTotalSupply));
			assert(unclaimed.eqn(0));
		})

		it('successfully burns', async () => {
			// Burn for beneficiary1
			totalSupply = await utilityTokenAbstract.totalSupply.call();
			amount = ST2;
			assert.equal(await utilityTokenAbstract.burnInternalPublic.call(beneficiary1, amount), true);
			result = await utilityTokenAbstract.burnInternalPublic(beneficiary1, amount);

			var postBurnTotalSupply = await utilityTokenAbstract.totalSupply.call();
			assert(postBurnTotalSupply.eq(totalSupply.sub(amount)));
			UtilityTokenAbstract_utils.checkBurntEvent(result.logs[0], uuid, beneficiary1, amount, postBurnTotalSupply);

			// Burn 7 for 0x0 to reflect that this function
			// is only concerned with reducing totalTokenSupply
			totalSupply = postBurnTotalSupply;
			amount = new BN(7);
			assert.equal(await utilityTokenAbstract.burnInternalPublic.call(0, amount), true);
			result = await utilityTokenAbstract.burnInternalPublic('0x0000000000000000000000000000000000000000', amount);

			postBurnTotalSupply = await utilityTokenAbstract.totalSupply.call();
			assert(postBurnTotalSupply.eq(totalSupply.sub(amount)));
			UtilityTokenAbstract_utils.checkBurntEvent(result.logs[0], uuid, '0x0000000000000000000000000000000000000000', amount, postBurnTotalSupply);
		})
	})
})
