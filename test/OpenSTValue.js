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
// Test: OpenSTValue.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const Utils = require('./lib/utils.js');
const OpenSTValue_utils = require('./OpenSTValue_utils.js');
const Core = artifacts.require("./Core.sol");
const SimpleStake = artifacts.require("./SimpleStake.sol");

///
/// Test stories
/// 
/// Properties
/// 	has chainIdValue
/// 	has valueToken
/// 	has registrar
/// 
/// AddCore
/// 	fails to add core by non-registrar
/// 	fails to add core by registrar when core is null
/// 	fails to add core when registrar != core.registrar
/// 	fails to add core when core.chainIdRemote is null // Cannot test because Core cannot be deployed with null chainIdRemote
///		successfully adds core
///		fails to add core if already exists
///
/// RegisterUtilityToken
///		fails to register by non-registrar
///     fails to register when name is empty
///     fails to register when symbol is empty
/// 	fails to register when conversion rate is not > 0
///		fails to register when core.openSTRemote is null // Cannot test because Core cannot be deployed with null openSTRemote
///		fails to register when the given UUID does not match the calculated hash
///		successfully registers
///		fails to register if already exists
/// 
/// Stake
///		when the staking account is null
/// 		fails to stake when amount is not > 0
/// 		fails to stake when tx.origin has not approved it to transfer at least the amount
/// 		fails to stake when the SimpleStake address for the given UUID is null
///			fails to stake when the beneficiary is null
///			successfully stakes
///		when the staking account is not null
///			fails to stake when msg.sender is not the stakingAccount
///			successfully stakes
///
/// ProcessStaking
///		fails to process when stakingIntentHash is empty
///		fails to process when msg.sender is not staker or registrar
///		successfully processes
///		fails to reprocess
///
/// ConfirmRedemptionIntent
/// 		fails to confirm by non-registrar
/// 		fails to confirm when utility token does not have a simpleStake address
/// 		fails to confirm when amountUT is not > 0
/// 		fails to confirm when redemptionUnlockHeight is not > 0
/// 		fails to confirm when redemptionIntentHash is empty
/// 		fails to confirm when nonce is not exactly 1 greater than previously
/// 		fails to confirm when redemptionIntentHash does not match calculated hash
/// 		fails to confirm when token balance of stake is not >= amountST
///			successfully confirms
///			fails to confirm a replay
/// 		fails to confirm when amountUT does not convert into at least 1 STWei // Fails
///
/// ProcessUnstaking
/// 	when expirationHeight is > block number
/// 		fails to process when redemptionIntentHash is empty
/// 		fails to process when redeemer is not msg.sender
/// 		fails to process when utility token does not have a simpleStake address
///			successfully processes
///			fails to reprocess
/// 	when expirationHeight is < block number // TBD: how or where to test this practically
///

contract('OpenSTValue', function(accounts) {
	const chainIdValue  = 3;
	const chainIdRemote = 1410;
	const openSTRemote  = accounts[4];
	const registrar     = accounts[1];

	const symbol = "ST";
	const name = "Simple Token";
	const conversionRate = 10;

	var valueToken  = null;
	var openSTValue = null;
	var core = null;
	var checkUuid = null;
	var result = null;
	var hasher = null;
	var stakingIntentHash = null;
	var stake = null;
	var nonce = null;

	describe('Properties', async () => {
		before(async () => {
	        contracts   = await OpenSTValue_utils.deployOpenSTValue(artifacts, accounts);
	        valueToken  = contracts.valueToken;
	        openSTValue = contracts.openSTValue;
	    })

		it('has chainIdValue', async () => {
			assert.equal(await openSTValue.chainIdValue.call(), chainIdValue);
		})

		it('has valueToken', async () => {
			assert.equal(await openSTValue.valueToken.call(), valueToken.address);
		})

		it('has registrar', async () => {
			assert.equal(await openSTValue.registrar.call(), registrar);
		})
	})

	describe('AddCore', async () => {
		before(async () => {
	        contracts   = await OpenSTValue_utils.deployOpenSTValue(artifacts, accounts);
	        openSTValue = contracts.openSTValue;
        	core = await Core.new(registrar, chainIdValue, chainIdRemote, openSTRemote);
	    })

		it('fails to add core by non-registrar', async () => {
            await Utils.expectThrow(openSTValue.addCore(core.address, { from: accounts[0] }));
		})

		it('fails to add core by registrar when core is null', async () => {
            await Utils.expectThrow(openSTValue.addCore(0, { from: registrar }));
		})

		it('fails to add core when registrar != core.registrar', async () => {
			var badCore = await Core.new(accounts[0], chainIdValue, chainIdRemote, openSTRemote);
            await Utils.expectThrow(openSTValue.addCore(badCore.address, { from: registrar }));
		})

		it('successfully adds core', async () => {
            assert.equal(await openSTValue.addCore.call(core.address, { from: registrar }), true);
            await openSTValue.addCore(core.address, { from: registrar });
		})

		it('fails to add core if already exists', async () => {
            await Utils.expectThrow(openSTValue.addCore(core.address, { from: registrar }));
		})
	})

	describe('RegisterUtilityToken', async () => {
		before(async () => {
	        contracts   = await OpenSTValue_utils.deployOpenSTValue(artifacts, accounts);
	        valueToken  = contracts.valueToken;
	        openSTValue = contracts.openSTValue;
        	core = await Core.new(registrar, chainIdValue, chainIdRemote, openSTRemote);
            await openSTValue.addCore(core.address, { from: registrar });
        	checkUuid = await openSTValue.hashUuid.call(symbol, name, chainIdValue, chainIdRemote, openSTRemote, conversionRate);
	    })

		it('fails to register by non-registrar', async () => {
            await Utils.expectThrow(openSTValue.registerUtilityToken(symbol, name, conversionRate, chainIdRemote, 0, checkUuid, { from: accounts[0] }));
		})

		it('fails to register when name is empty', async () => {
            await Utils.expectThrow(openSTValue.registerUtilityToken(symbol, "", conversionRate, chainIdRemote, 0, checkUuid, { from: registrar }));
		})

		it('fails to register when symbol is empty', async () => {
            await Utils.expectThrow(openSTValue.registerUtilityToken("", name, conversionRate, chainIdRemote, 0, checkUuid, { from: registrar }));
		})

		it('fails to register when conversion rate is not > 0', async () => {
            await Utils.expectThrow(openSTValue.registerUtilityToken(symbol, name, 0, chainIdRemote, 0, checkUuid, { from: registrar }));
		})

		it('fails to register when the given UUID does not match the calculated hash', async () => {
            await Utils.expectThrow(openSTValue.registerUtilityToken(symbol, name, conversionRate, chainIdRemote, 0, "bad checkUuid", { from: registrar }));
		})

		it('successfully registers', async () => {
            assert.equal(await openSTValue.registerUtilityToken.call(symbol, name, conversionRate, chainIdRemote, 0, checkUuid, { from: registrar }), checkUuid);
            result = await openSTValue.registerUtilityToken(symbol, name, conversionRate, chainIdRemote, 0, checkUuid, { from: registrar });

            // Stake address is returned by UtilityTokenRegistered but verified below rather than by checkUtilityTokenRegisteredEvent
            OpenSTValue_utils.checkUtilityTokenRegisteredEvent(result.logs[0], checkUuid, symbol, name, 18, conversionRate, chainIdRemote, 0);
            var simpleStake = new SimpleStake(result.logs[0].args.stake);
            assert.equal(await simpleStake.uuid.call(), checkUuid);
            assert.equal(await simpleStake.eip20Token.call(), valueToken.address);
		})

		it('fails to register if already exists', async () => {
            await Utils.expectThrow(openSTValue.registerUtilityToken(symbol, name, conversionRate, chainIdRemote, 0, checkUuid, { from: registrar }));
		})
	})

	describe('Stake', async () => {
		context('when the staking account is null', async () => {
			before(async () => {
		        contracts   = await OpenSTValue_utils.deployOpenSTValue(artifacts, accounts);
		        valueToken  = contracts.valueToken;
		        openSTValue = contracts.openSTValue;
	        	core = await Core.new(registrar, chainIdValue, chainIdRemote, openSTRemote);
	            await openSTValue.addCore(core.address, { from: registrar });
		    })

			it('fails to stake when amount is not > 0', async () => {
	            await Utils.expectThrow(openSTValue.stake(checkUuid, 0, accounts[0], { from: accounts[0] }));
			})

			it('fails to stake when tx.origin has not approved it to transfer at least the amount', async () => {
	            await Utils.expectThrow(openSTValue.stake(checkUuid, 1, accounts[0], { from: accounts[0] }));
			})

			it('fails to stake when the SimpleStake address for the given UUID is null', async () => {
				await valueToken.approve(openSTValue.address, 1, { from: accounts[0] });
	            await Utils.expectThrow(openSTValue.stake(checkUuid, 1, accounts[0], { from: accounts[0] }));
			})

			it('fails to stake when the beneficiary is null', async () => {
	        	checkUuid = await openSTValue.hashUuid.call(symbol, name, chainIdValue, chainIdRemote, openSTRemote, conversionRate);
				await openSTValue.registerUtilityToken(symbol, name, conversionRate, chainIdRemote, 0, checkUuid, { from: registrar });        	
	            await Utils.expectThrow(openSTValue.stake(checkUuid, 1, 0, { from: accounts[0] }));
			})

			it('successfully stakes', async () => {
	            var stakeReturns = await openSTValue.stake.call(checkUuid, 1, accounts[0], { from: accounts[0] });
	            var amountUT = stakeReturns[0].toNumber();
	            nonce = stakeReturns[1].toNumber();

    			// call block number is one less than send block number
	            var unlockHeight = stakeReturns[2].plus(1);
	            stakingIntentHash = await openSTValue.hashStakingIntent.call(checkUuid, accounts[0], nonce, accounts[0], 1, amountUT, unlockHeight);
	            result = await openSTValue.stake(checkUuid, 1, accounts[0], { from: accounts[0] });

	            await OpenSTValue_utils.checkStakingIntentDeclaredEvent(result.logs[0], checkUuid, accounts[0], nonce, accounts[0], 1, amountUT, unlockHeight, stakingIntentHash, chainIdRemote);
			})
		})

		context('when the staking account is not null', async () => {
			before(async () => {
		        contracts   = await OpenSTValue_utils.deployOpenSTValue(artifacts, accounts);
		        valueToken  = contracts.valueToken;
		        openSTValue = contracts.openSTValue;
	        	core = await Core.new(registrar, chainIdValue, chainIdRemote, openSTRemote);
	            await openSTValue.addCore(core.address, { from: registrar });
	        	checkUuid = await openSTValue.hashUuid.call(symbol, name, chainIdValue, chainIdRemote, openSTRemote, conversionRate);
				await openSTValue.registerUtilityToken(symbol, name, conversionRate, chainIdRemote, accounts[0], checkUuid, { from: registrar });
				await valueToken.approve(openSTValue.address, 1, { from: accounts[0] });        	
		    })

			it('fails to stake when msg.sender is not the stakingAccount', async () => {
	            await Utils.expectThrow(openSTValue.stake(checkUuid, 1, accounts[0], { from: accounts[1] }));
			})

			it('successfully stakes', async () => {
	            var stakeReturns = await openSTValue.stake.call(checkUuid, 1, accounts[0], { from: accounts[0] });
	            var amountUT = stakeReturns[0].toNumber();
	            nonce = stakeReturns[1].toNumber();

    			// call block number is one less than send block number
	            var unlockHeight = stakeReturns[2].plus(1);
	            stakingIntentHash = await openSTValue.hashStakingIntent.call(checkUuid, accounts[0], nonce, accounts[0], 1, amountUT, unlockHeight);
	            result = await openSTValue.stake(checkUuid, 1, accounts[0], { from: accounts[0] });

	            await OpenSTValue_utils.checkStakingIntentDeclaredEvent(result.logs[0], checkUuid, accounts[0], nonce, accounts[0], 1, amountUT, unlockHeight, stakingIntentHash, chainIdRemote);
			})
		})
	})

	describe('ProcessStaking', async () => {
		before(async () => {
	        contracts   = await OpenSTValue_utils.deployOpenSTValue(artifacts, accounts);
	        valueToken  = contracts.valueToken;
	        openSTValue = contracts.openSTValue;
        	core = await Core.new(registrar, chainIdValue, chainIdRemote, openSTRemote);
            await openSTValue.addCore(core.address, { from: registrar });
        	checkUuid = await openSTValue.hashUuid.call(symbol, name, chainIdValue, chainIdRemote, openSTRemote, conversionRate);
			result = await openSTValue.registerUtilityToken(symbol, name, conversionRate, chainIdRemote, 0, checkUuid, { from: registrar });
			stake = result.logs[0].args.stake;
			await valueToken.approve(openSTValue.address, 1, { from: accounts[0] });
			result = await openSTValue.stake(checkUuid, 1, accounts[0], { from: accounts[0] });
			stakingIntentHash = result.logs[0].args._stakingIntentHash;
	    })

		it('fails to process when stakingIntentHash is empty', async () => {
            await Utils.expectThrow(openSTValue.processStaking("", { from: accounts[0] }));
		})

		it('fails to process when msg.sender is not staker or registrar', async () => {
			// registrar can additionally as a fallback process staking in v0.9
            await Utils.expectThrow(openSTValue.processStaking(stakingIntentHash, { from: accounts[5] }));
		})

		it('successfully processes', async () => {
			var openSTValueBal = await valueToken.balanceOf.call(openSTValue.address);
			var stakeBal = await valueToken.balanceOf.call(stake);
			assert.equal(openSTValueBal.toNumber(), 1);
			assert.equal(stakeBal.toNumber(), 0);
			result = await openSTValue.processStaking(stakingIntentHash, { from: accounts[0] });

			openSTValueBal = await valueToken.balanceOf.call(openSTValue.address);
			stakeBal = await valueToken.balanceOf.call(stake);
			assert.equal(openSTValueBal.toNumber(), 0);
			assert.equal(stakeBal.toNumber(), 1);
            await OpenSTValue_utils.checkProcessedStakeEvent(result.logs[0], checkUuid, stakingIntentHash, stake, accounts[0], 1, 10);
		})

		it('fails to reprocess', async () => {
            await Utils.expectThrow(openSTValue.processStaking(stakingIntentHash, { from: accounts[0] }));
		})
	})

	describe('ConfirmRedemptionIntent', async () => {
		// Using accounts[2] as redeemer to confirm that redemption/unstaking is not limited to the staker
		var redeemer 				= accounts[2];
		var redemptionIntentHash 	= null;
		var redemptionUnlockHeight 	= 80668;
		var amountUT 				= conversionRate;

		before(async () => {
	        contracts   = await OpenSTValue_utils.deployOpenSTValue(artifacts, accounts);
	        valueToken  = contracts.valueToken;
	        openSTValue = contracts.openSTValue;
        	core = await Core.new(registrar, chainIdValue, chainIdRemote, openSTRemote);
            await openSTValue.addCore(core.address, { from: registrar });
        	checkUuid = await openSTValue.hashUuid.call(symbol, name, chainIdValue, chainIdRemote, openSTRemote, conversionRate);
			result = await openSTValue.registerUtilityToken(symbol, name, conversionRate, chainIdRemote, 0, checkUuid, { from: registrar });
			stake = result.logs[0].args.stake;
			nonce = await openSTValue.getNextNonce.call(redeemer);
	    })

		it('fails to confirm by non-registrar', async () => {
			redemptionIntentHash = await openSTValue.hashRedemptionIntent.call(checkUuid, redeemer, nonce, amountUT, redemptionUnlockHeight);
            await Utils.expectThrow(openSTValue.confirmRedemptionIntent(checkUuid, redeemer, nonce, amountUT, redemptionUnlockHeight, redemptionIntentHash, { from: accounts[0] }));
		})

		it('fails to confirm when utility token does not have a simpleStake address', async () => {
			// Recalculate hash to confirm that it is not the error
			redemptionIntentHash = await openSTValue.hashRedemptionIntent.call("bad UUID", redeemer, nonce, amountUT, redemptionUnlockHeight);
            await Utils.expectThrow(openSTValue.confirmRedemptionIntent("bad UUID", redeemer, nonce, amountUT, redemptionUnlockHeight, redemptionIntentHash, { from: registrar }));
		})

		it('fails to confirm when amountUT is not > 0', async () => {
			// Recalculate hash to confirm that it is not the error
			redemptionIntentHash = await openSTValue.hashRedemptionIntent.call(checkUuid, redeemer, nonce, 0, redemptionUnlockHeight);
            await Utils.expectThrow(openSTValue.confirmRedemptionIntent(checkUuid, redeemer, nonce, 0, redemptionUnlockHeight, redemptionIntentHash, { from: registrar }));
		})

		it('fails to confirm when redemptionUnlockHeight is not > 0', async () => {
			// Recalculate hash to confirm that it is not the error
			redemptionIntentHash = await openSTValue.hashRedemptionIntent.call(checkUuid, redeemer, nonce, amountUT, 0);
            await Utils.expectThrow(openSTValue.confirmRedemptionIntent(checkUuid, redeemer, nonce, amountUT, 0, redemptionIntentHash, { from: registrar }));
		})

		it('fails to confirm when redemptionIntentHash is empty', async () => {
            await Utils.expectThrow(openSTValue.confirmRedemptionIntent(checkUuid, redeemer, nonce, amountUT, redemptionUnlockHeight, "", { from: registrar }));
		})

		it('fails to confirm when nonce is not exactly 1 greater than previously', async () => {
			// Recalculate hash to confirm that it is not the error
			redemptionIntentHash = await openSTValue.hashRedemptionIntent.call(checkUuid, redeemer, nonce.minus(1), amountUT, redemptionUnlockHeight);
            await Utils.expectThrow(openSTValue.confirmRedemptionIntent(checkUuid, redeemer, nonce.minus(1), amountUT, redemptionUnlockHeight, redemptionIntentHash, { from: registrar }));
		})

		it('fails to confirm when redemptionIntentHash does not match calculated hash', async () => {
            await Utils.expectThrow(openSTValue.confirmRedemptionIntent(checkUuid, redeemer, nonce.minus(1), amountUT, redemptionUnlockHeight, "bad hash", { from: registrar }));
		})

		it('fails to confirm when token balance of stake is not >= amountST', async () => {
			redemptionIntentHash = await openSTValue.hashRedemptionIntent.call(checkUuid, redeemer, nonce, amountUT, redemptionUnlockHeight);
            await Utils.expectThrow(openSTValue.confirmRedemptionIntent(checkUuid, redeemer, nonce, amountUT, redemptionUnlockHeight, redemptionIntentHash, { from: registrar }));
		})

		it('successfully confirms', async () => {
			await valueToken.approve(openSTValue.address, 2, { from: accounts[0] });
			result = await openSTValue.stake(checkUuid, 2, accounts[0], { from: accounts[0] });
			stakingIntentHash = result.logs[0].args._stakingIntentHash;
			await openSTValue.processStaking(stakingIntentHash, { from: accounts[0] });

			redemptionIntentHash = await openSTValue.hashRedemptionIntent.call(checkUuid, redeemer, nonce, amountUT, redemptionUnlockHeight);
			var confirmReturns = await openSTValue.confirmRedemptionIntent.call(checkUuid, redeemer, nonce, amountUT, redemptionUnlockHeight, redemptionIntentHash, { from: registrar })
			var amountST = confirmReturns[0];
			assert.equal(amountST, amountUT / conversionRate);

            result = await openSTValue.confirmRedemptionIntent(checkUuid, redeemer, nonce, amountUT, redemptionUnlockHeight, redemptionIntentHash, { from: registrar });
			var BLOCKS_TO_WAIT_SHORT = 240;
			var blockNumber = web3.eth.blockNumber;
			var expirationHeight = blockNumber + BLOCKS_TO_WAIT_SHORT;
            await OpenSTValue_utils.checkRedemptionIntentConfirmedEvent(result.logs[0], checkUuid, redemptionIntentHash, redeemer, amountST, amountUT, expirationHeight);
		})

		it('fails to confirm a replay', async () => {
			redemptionIntentHash = await openSTValue.hashRedemptionIntent.call(checkUuid, redeemer, nonce, amountUT, redemptionUnlockHeight);
            await Utils.expectThrow(openSTValue.confirmRedemptionIntent(checkUuid, redeemer, nonce, amountUT, redemptionUnlockHeight, redemptionIntentHash, { from: registrar }));
		})

		// Fails because logic does not prevent attempting to redeem 1 UTWei when the conversion rate is greater than 1
		it('fails to confirm when amountUT does not convert into at least 1 STWei', async () => {
			nonce = await openSTValue.getNextNonce.call(redeemer);

			// 1 STWei == 10 UTWei at the given conversion rate
			redemptionIntentHash = await openSTValue.hashRedemptionIntent.call(checkUuid, redeemer, nonce, 1, redemptionUnlockHeight);
            await Utils.expectThrow(openSTValue.confirmRedemptionIntent(checkUuid, redeemer, nonce, 1, redemptionUnlockHeight, redemptionIntentHash, { from: registrar }));
		})
	})

	describe('ProcessUnstaking', async () => {
		var redeemer 				= accounts[2];
		var redemptionIntentHash 	= null;
		var redemptionUnlockHeight 	= 80668;
		var amountUT 				= 1 * conversionRate;

		context('when expirationHeight is > block number', async () => {
			before(async () => {
		        contracts   = await OpenSTValue_utils.deployOpenSTValue(artifacts, accounts);
		        valueToken  = contracts.valueToken;
		        openSTValue = contracts.openSTValue;
	        	core = await Core.new(registrar, chainIdValue, chainIdRemote, openSTRemote);
	            await openSTValue.addCore(core.address, { from: registrar });
	        	checkUuid = await openSTValue.hashUuid.call(symbol, name, chainIdValue, chainIdRemote, openSTRemote, conversionRate);
				result = await openSTValue.registerUtilityToken(symbol, name, conversionRate, chainIdRemote, 0, checkUuid, { from: registrar });
				stake = result.logs[0].args.stake;
				nonce = await openSTValue.getNextNonce.call(redeemer);
				await valueToken.approve(openSTValue.address, 1, { from: accounts[0] });
				result = await openSTValue.stake(checkUuid, 1, accounts[0], { from: accounts[0] });
				stakingIntentHash = result.logs[0].args._stakingIntentHash;
				await openSTValue.processStaking(stakingIntentHash, { from: accounts[0] });
				redemptionIntentHash = await openSTValue.hashRedemptionIntent.call(checkUuid, redeemer, nonce, amountUT, redemptionUnlockHeight);
	            await openSTValue.confirmRedemptionIntent(checkUuid, redeemer, nonce, amountUT, redemptionUnlockHeight, redemptionIntentHash, { from: registrar });
		    })

			it('fails to process when redemptionIntentHash is empty', async () => {
	            await Utils.expectThrow(openSTValue.processUnstaking("", { from: redeemer }));
			})

			it('fails to process when redeemer is not msg.sender', async () => {
	            await Utils.expectThrow(openSTValue.processUnstaking(redemptionIntentHash, { from: accounts[0] }));
			})

			it('fails to process when utility token does not have a simpleStake address', async () => {
	            await Utils.expectThrow(openSTValue.processUnstaking("bad hash", { from: accounts[0] }));
			})

			it('successfully processes', async () => {
				var stakeBal = await valueToken.balanceOf.call(stake);
				var redeemerBal = await valueToken.balanceOf.call(redeemer);
				assert.equal(stakeBal.toNumber(), 1);
				assert.equal(redeemerBal.toNumber(), 0);
				result = await openSTValue.processUnstaking(redemptionIntentHash, { from: redeemer });

				stakeBal = await valueToken.balanceOf.call(stake);
				redeemerBal = await valueToken.balanceOf.call(redeemer);
				assert.equal(stakeBal.toNumber(), 0);
				assert.equal(redeemerBal.toNumber(), 1);
	            await OpenSTValue_utils.checkProcessedUnstakeEvent(result.logs[0], checkUuid, redemptionIntentHash, stake, redeemer, 1);
			})

			it('fails to reprocess', async () => {
	            await Utils.expectThrow(openSTValue.processUnstaking(redemptionIntentHash, { from: redeemer }));
			})
		})
	})

	describe('ProcessStaking with fallback', async () => {
		before(async () => {
	        contracts   = await OpenSTValue_utils.deployOpenSTValue(artifacts, accounts);
	        valueToken  = contracts.valueToken;
	        openSTValue = contracts.openSTValue;
        	core = await Core.new(registrar, chainIdValue, chainIdRemote, openSTRemote);
            await openSTValue.addCore(core.address, { from: registrar });
        	checkUuid = await openSTValue.hashUuid.call(symbol, name, chainIdValue, chainIdRemote, openSTRemote, conversionRate);
			result = await openSTValue.registerUtilityToken(symbol, name, conversionRate, chainIdRemote, 0, checkUuid, { from: registrar });
			stake = result.logs[0].args.stake;
			await valueToken.approve(openSTValue.address, 1, { from: accounts[0] });
			result = await openSTValue.stake(checkUuid, 1, accounts[0], { from: accounts[0] });
			stakingIntentHash = result.logs[0].args._stakingIntentHash;
	    })

		it('successfully processes by registrar', async () => {
			var openSTValueBal = await valueToken.balanceOf.call(openSTValue.address);
			var stakeBal = await valueToken.balanceOf.call(stake);
			assert.equal(openSTValueBal.toNumber(), 1);
			assert.equal(stakeBal.toNumber(), 0);
			result = await openSTValue.processStaking(stakingIntentHash, { from: registrar });

			openSTValueBal = await valueToken.balanceOf.call(openSTValue.address);
			stakeBal = await valueToken.balanceOf.call(stake);
			assert.equal(openSTValueBal.toNumber(), 0);
			assert.equal(stakeBal.toNumber(), 1);
            await OpenSTValue_utils.checkProcessedStakeEvent(result.logs[0], checkUuid, stakingIntentHash, stake, accounts[0], 1, 10);
		})
	})
})
