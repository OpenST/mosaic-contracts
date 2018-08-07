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

const BigNumber = require('bignumber.js');
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
	const conversionRate 		= new BigNumber(10 * (10**conversionRateDecimals)); // conversion rate => 10
	const genesisChainIdValue 	= 3;
	const genesisChainIdUtility = 1410;
	const beneficiary1   		= '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
	const beneficiary2 	 		= '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
	const ST1 			 		= new BigNumber(web3.toWei(1, "ether"));
	const ST2 			 		= new BigNumber(web3.toWei(2, "ether"));
	const ST3 			 		= new BigNumber(web3.toWei(3, "ether"));
	const ST4 			 		= new BigNumber(web3.toWei(4, "ether"));

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
			await Utils.expectThrow(UtilityTokenAbstract.new("bad uuid", "symbol", "name", genesisChainIdValue, genesisChainIdUtility, conversionRate, conversionRateDecimals, { from: openSTProtocol }));
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
			assert.equal(contractConversionRate.toNumber(), conversionRate.toNumber());
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
			assert.equal(totalSupply.toNumber(), ST2.toNumber());
			assert.equal(unclaimed.toNumber(), ST2.toNumber());
			UtilityTokenAbstract_utils.checkMintedEvent(result.logs[0], uuid, beneficiary1, ST2, ST2, ST2);

			// Mint again for beneficiary1
			result = await utilityTokenAbstract.mintInternalPublic(beneficiary1, ST1);

			totalSupply = await utilityTokenAbstract.totalSupply.call();
			unclaimed = await utilityTokenAbstract.unclaimed.call(beneficiary1);
			assert.equal(totalSupply.toNumber(), ST3.toNumber());
			assert.equal(unclaimed.toNumber(), ST3.toNumber());
			UtilityTokenAbstract_utils.checkMintedEvent(result.logs[0], uuid, beneficiary1, ST1, ST3, ST3);

			unclaimed = await utilityTokenAbstract.unclaimed.call(beneficiary2);
			assert.equal(unclaimed.toNumber(), 0);
			assert.equal(await utilityTokenAbstract.mintInternalPublic.call(beneficiary2, ST1), true);

			// Mint for beneficiary2
			result = await utilityTokenAbstract.mintInternalPublic(beneficiary2, ST1);

			totalSupply = await utilityTokenAbstract.totalSupply.call();
			unclaimed = await utilityTokenAbstract.unclaimed.call(beneficiary2);
			assert.equal(totalSupply.toNumber(), ST4.toNumber());
			assert.equal(unclaimed.toNumber(), ST1.toNumber());
			UtilityTokenAbstract_utils.checkMintedEvent(result.logs[0], uuid, beneficiary2, ST1, ST1, ST4);
		})

		it('successfully claims', async () => {
			// Claim for beneficiary1
			totalSupply = await utilityTokenAbstract.totalSupply.call();
			unclaimed = await utilityTokenAbstract.unclaimed.call(beneficiary1);
			amount = await utilityTokenAbstract.claimInternalPublic.call(beneficiary1);
			assert.equal(unclaimed.toNumber(), amount.toNumber());
			result = await utilityTokenAbstract.claimInternalPublic(beneficiary1);

			var postClaimTotalSupply = await utilityTokenAbstract.totalSupply.call();
			unclaimed = await utilityTokenAbstract.unclaimed.call(beneficiary1);
			assert.equal(totalSupply.toNumber(), postClaimTotalSupply.toNumber());
			assert.equal(unclaimed.toNumber(), 0);

			// Claim for beneficiary2
			totalSupply = await utilityTokenAbstract.totalSupply.call();
			unclaimed = await utilityTokenAbstract.unclaimed.call(beneficiary2);
			amount = await utilityTokenAbstract.claimInternalPublic.call(beneficiary2);
			assert.equal(unclaimed.toNumber(), amount.toNumber());
			result = await utilityTokenAbstract.claimInternalPublic(beneficiary2);

			postClaimTotalSupply = await utilityTokenAbstract.totalSupply.call();
			unclaimed = await utilityTokenAbstract.unclaimed.call(beneficiary2);
			assert.equal(totalSupply.toNumber(), postClaimTotalSupply.toNumber());
			assert.equal(unclaimed.toNumber(), 0);
		})

		it('successfully burns', async () => {
			// Burn for beneficiary1
			totalSupply = await utilityTokenAbstract.totalSupply.call();
			amount = ST2;
			assert.equal(await utilityTokenAbstract.burnInternalPublic.call(beneficiary1, amount), true);
			result = await utilityTokenAbstract.burnInternalPublic(beneficiary1, amount);

			var postBurnTotalSupply = await utilityTokenAbstract.totalSupply.call();
			assert.equal(postBurnTotalSupply.toNumber(), totalSupply.minus(amount).toNumber());
			UtilityTokenAbstract_utils.checkBurntEvent(result.logs[0], uuid, beneficiary1, amount, postBurnTotalSupply);

			// Burn 7 for 0x0 to reflect that this function
			// is only concerned with reducing totalTokenSupply
			totalSupply = postBurnTotalSupply;
			amount = new BigNumber(7);
			assert.equal(await utilityTokenAbstract.burnInternalPublic.call(0, amount), true);
			result = await utilityTokenAbstract.burnInternalPublic(0, amount);

			postBurnTotalSupply = await utilityTokenAbstract.totalSupply.call();
			assert.equal(postBurnTotalSupply.toNumber(), totalSupply.minus(amount).toNumber());
			UtilityTokenAbstract_utils.checkBurntEvent(result.logs[0], uuid, 0, amount, postBurnTotalSupply);
		})
	})
})
