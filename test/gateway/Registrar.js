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
// Test: Registrar.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const BigNumber       = require('bignumber.js');
const Utils           = require('../lib/utils.js');
const HashLock        = require('../lib/hash_lock.js');
const Registrar_utils = require('./Registrar_utils.js');

///
/// Test stories
///
/// RegisterBrandedToken
/// 	fails to register by non-adminOrOps
/// 	successfully registers core
///
/// AddCore
/// 	fails to add by non-adminOrOps
/// 	successfully adds core
///
/// RegisterUtilityToken
/// 	fails to register if non-adminOrOps
/// 	successfully registers
///
/// ConfirmStakingIntent
/// 	fails to confirm by non-ops
/// 	successfully confirms
///
/// ConfirmRedemptionIntent
/// 	fails to confirm by non-ops
/// 	successfully confirms
///

contract('Registrar', function(accounts) {
	const chainIdValue  	= 3;
	const chainIdUtility 	= 1410;
	const ops 		   		= accounts[1];
	const admin 	   		= accounts[3];
	const staker	  		= accounts[2];
  const redeemBeneficiary = accounts[4];
	const symbol 			= "MCC";
	const name 				= "Member Company Coin";
	const conversionRateDecimals = 5;
	const conversionRate	= new BigNumber(10 * (10**conversionRateDecimals)); // Conversion rate => 10
	const amountST 			= new BigNumber(web3.toWei(2, "ether"));;

	describe('RegisterBrandedToken for utility chain', async() => {
		var contracts 		= null;
		var registrar 		= null;
		var openSTUtility	= null;
		var uuid 			= null;
		var brandedToken 	= null;

		before(async() => {
	        contracts   	= await Registrar_utils.deployRegistrar(artifacts, accounts);
			registrar 		= contracts.registrar;
	        openSTUtility 	= contracts.openSTUtility;
	        uuid 			= await openSTUtility.proposeBrandedToken.call(symbol, name, conversionRate, conversionRateDecimals, { from: staker });
	        result 			= await openSTUtility.proposeBrandedToken(symbol, name, conversionRate, conversionRateDecimals, { from: staker });
	        brandedToken 	= result.logs[0].args._token;
		})

		it('fails to register by non-adminOrOps', async () => {
            await Utils.expectThrow(registrar.registerBrandedToken(openSTUtility.address, symbol, name, conversionRate, conversionRateDecimals, staker, brandedToken, uuid));
		})

		it('successfully resgisters', async () => {
            assert.equal(await registrar.registerBrandedToken.call(openSTUtility.address, symbol, name, conversionRate, conversionRateDecimals, staker, brandedToken, uuid, { from: ops }), uuid);
		})
	})

	describe('AddCore for value chain', async() => {
		var contracts 	= null;
		var registrar 	= null;
		var openSTValue	= null;
		var core 		= null;

		before(async() => {
	        contracts   = await Registrar_utils.deployRegistrar(artifacts, accounts);
			registrar 	= contracts.registrar;
	        openSTValue = contracts.openSTValue;
	        core 		= contracts.core;
		})

		it('fails to add by non-adminOrOps', async () => {
            await Utils.expectThrow(registrar.addCore(openSTValue.address, core.address));
		})

		it('successfully adds core', async () => {
            assert.equal(await registrar.addCore.call(openSTValue.address, core.address, { from: ops }), true);
		})
	})

	describe('RegisterUtilityToken for value chain', async() => {
		var contracts 	= null;
		var registrar 	= null;
		var openSTValue	= null;
		var core 		= null;
		var uuid 		= null;

		before(async() => {
	        contracts   	= await Registrar_utils.deployRegistrar(artifacts, accounts);
			registrar 		= contracts.registrar;
	        openSTUtility 	= contracts.openSTUtility;
	        openSTValue 	= contracts.openSTValue;
	        core 			= contracts.core;
	        uuid 			= await openSTValue.hashUuid.call(symbol, name, chainIdValue, chainIdUtility, openSTUtility.address, conversionRate, conversionRateDecimals);

	        await registrar.addCore(openSTValue.address, core.address, { from: ops });
		})

		it('fails to register if non-adminOrOps', async () => {
            await Utils.expectThrow(registrar.registerUtilityToken(openSTValue.address, symbol, name, conversionRate, conversionRateDecimals, chainIdUtility, staker, uuid));
		})

		it('successfully registers', async () => {
            assert.equal(await registrar.registerUtilityToken.call(openSTValue.address, symbol, name, conversionRate, conversionRateDecimals, chainIdUtility, staker, uuid, { from: ops }), uuid);
		})
	})

	describe('ConfirmStakingIntent for utility chain', async() => {
		var contracts 			= null;
		var valueToken			= null;
		var registrar 			= null;
		var openSTUtility 		= null;
		var openSTValue			= null;
		var core 				= null;
		var uuid 				= null;
		var brandedToken 		= null;
		var nonce 				= null;
		var amountUT 	 		= null;
		var unlockHeight 		= null;
		var stakingIntentHash 	= null;

		const lock = HashLock.getHashLock();
        var validRLPParentNodes = null;
		before(async() => {
	        contracts   	= await Registrar_utils.deployRegistrar(artifacts, accounts);
	        valueToken  	= contracts.valueToken;
			registrar 		= contracts.registrar;
	        openSTUtility 	= contracts.openSTUtility;
	        openSTValue 	= contracts.openSTValue;
      		core 			= contracts.core;
	        uuid 			= await openSTUtility.proposeBrandedToken.call(symbol, name, conversionRate, conversionRateDecimals, { from: staker });
	        var result 		= await openSTUtility.proposeBrandedToken(symbol, name, conversionRate, conversionRateDecimals, { from: staker });
	        brandedToken 	= result.logs[0].args._token;

			await registrar.registerBrandedToken(openSTUtility.address, symbol, name, conversionRate, conversionRateDecimals, staker, brandedToken, uuid, { from: ops })
	        await registrar.addCore(openSTValue.address, core.address, { from: ops });
	        await registrar.registerUtilityToken(openSTValue.address, symbol, name, conversionRate, conversionRateDecimals, chainIdUtility, staker, uuid, { from: ops });
	        await valueToken.approve(openSTValue.address, amountST, { from: staker });
	        result = await openSTValue.stake(uuid, amountST, staker, lock.l, staker, { from: staker });
	        nonce = result.logs[0].args._stakerNonce;
	        amountUT = result.logs[0].args._amountUT;
	        unlockHeight = result.logs[0].args._unlockHeight;
	        stakingIntentHash = result.logs[0].args._stakingIntentHash;
            validRLPParentNodes =  await  openSTUtility.getMockRLPParentNodes.call(true);
		})

		it('fails to confirm by non-ops', async () => {
            await Utils.expectThrow(registrar.confirmStakingIntent(openSTUtility.address, uuid, staker, nonce, staker, amountST, amountUT, unlockHeight, lock.l, 0, validRLPParentNodes));
            await Utils.expectThrow(registrar.confirmStakingIntent(openSTUtility.address, uuid, staker, nonce, staker, amountST, amountUT, unlockHeight, lock.l, 0, validRLPParentNodes,{ from: admin }));
		})

		it('successfully confirms', async () => {
			var BLOCKS_TO_WAIT_SHORT = 10;
            var expirationHeight = await registrar.confirmStakingIntent.call(openSTUtility.address, uuid, staker, nonce, staker, amountST, amountUT, unlockHeight, lock.l, 0, validRLPParentNodes, { from: ops });

            assert.ok(expirationHeight > BLOCKS_TO_WAIT_SHORT);
		})
	})

	describe('ConfirmRedemptionIntent for value chain', async() => {
		var contracts 			 	= null;
		var valueToken			 	= null;
		var registrar 			 	= null;
		var openSTUtility			= null;
		var openSTValue			 	= null;
		var core 				 	= null;
		var uuid 				 	= null;
		var nonce 				 	= null;
		var redemptionIntentHash 	= null;
        var validRLPParentNodes     = null;
        var unlockHeight 			= null;

		const BLOCKS_TO_WAIT_LONG	= 110;
		const amountUTRedeemed 	 	= (conversionRate / (10**conversionRateDecimals));
		const lock = HashLock.getHashLock();
		const lockR = HashLock.getHashLock();

		before(async() => {
	        contracts   	= await Registrar_utils.deployRegistrar(artifacts, accounts);
	        valueToken  	= contracts.valueToken;
			registrar 		= contracts.registrar;
	        openSTUtility 	= contracts.openSTUtility;
	        openSTValue 	= contracts.openSTValue;
	        validRLPParentNodes = await openSTValue.getMockRLPParentNodes(true);
            core 			= contracts.core;
	        uuid 			= await openSTValue.hashUuid.call(symbol, name, chainIdValue, chainIdUtility, openSTUtility.address, conversionRate, conversionRateDecimals);

	        await registrar.addCore(openSTValue.address, core.address, { from: ops });
	        await registrar.registerUtilityToken(openSTValue.address, symbol, name, conversionRate, conversionRateDecimals, chainIdUtility, staker, uuid, { from: ops });
	        await valueToken.approve(openSTValue.address, amountST, { from: staker });
	        var result = await openSTValue.stake(uuid, amountST, staker, lock.l, staker, { from: staker });
	        var stakingIntentHash = result.logs[0].args._stakingIntentHash;
			await openSTValue.processStaking(stakingIntentHash, lock.s, { from: staker });
			nonce = await openSTValue.getNextNonce.call(staker);
            unlockHeight = new BigNumber(BLOCKS_TO_WAIT_LONG).plus(web3.eth.blockNumber);
			redemptionIntentHash = await openSTValue.hashRedemptionIntent.call(uuid, staker, nonce, redeemBeneficiary, amountUTRedeemed, unlockHeight, lockR.l);
		})

		it('fails to confirm by non-ops', async () => {
            await Utils.expectThrow(registrar.confirmRedemptionIntent(openSTValue.address, uuid, staker, nonce, redeemBeneficiary, amountUTRedeemed, unlockHeight, lockR.l, 0, validRLPParentNodes));
            await Utils.expectThrow(registrar.confirmRedemptionIntent(openSTValue.address, uuid, staker, nonce, redeemBeneficiary, amountUTRedeemed, unlockHeight, lockR.l, 0, validRLPParentNodes, { from: admin }));
		})

		it('successfully confirms', async () => {
			var BLOCKS_TO_WAIT_SHORT = 10;

      var confirmReturns = await registrar.confirmRedemptionIntent.call(openSTValue.address, uuid, staker, nonce, redeemBeneficiary, amountUTRedeemed, unlockHeight, lockR.l, 0, validRLPParentNodes, { from: ops });
      assert.equal(confirmReturns[0], (amountUTRedeemed * (10**conversionRateDecimals))/conversionRate);
      assert.ok(confirmReturns[1] > BLOCKS_TO_WAIT_SHORT);
		})
	})
})
