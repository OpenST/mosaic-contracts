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

const Utils = require('../lib/utils.js');
const HashLock = require('../lib/hash_lock.js');
const OpenSTValue_utils = require('./OpenSTValue_utils.js');
const Core = artifacts.require("./CoreMock.sol");
const SimpleStake = artifacts.require("./SimpleStake.sol");
const BigNumber = require('bignumber.js');
const proof = require('../data/proof');

const rootPrefix = "../.."
    , constant = require(rootPrefix + '/test/lib/constants')
;

///
/// Test stories
///
/// Properties
/// 	has chainIdValue
/// 	has valueToken
/// 	has registrar
/// 	confirms intents mapping index position
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
/// 		fails to stake when msg.sender has not approved it to transfer at least the amount
/// 		fails to stake when the SimpleStake address for the given UUID is null
///			fails to stake when the beneficiary is null
///			successfully stakes
///		when the staking account is not null
///			fails to stake when msg.sender is not the stakingAccount
///			successfully stakes
///
/// ProcessStaking
///		fails to process when stakingIntentHash is empty
///		fails to process if hash of unlockSecret does not match hashlock
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
/// 		fails to process if hash of unlockSecret does not match hashlock
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
	const conversionRateDecimals = 5;
	const conversionRate = new BigNumber(10 * 10**conversionRateDecimals); // conversion rate => 10

	var valueToken  = null
		, openSTValue = null
		, core = null
		, checkUuid = null
		,result = null
		, hasher = null
		, stakingIntentHash 
		, hashIntentKey = null
		, stake = null
		, nonce = null
		, workers = null
		, validRLPParentNodes = null
		, invalidRLPParentNodes = null;
	;

	describe('Properties', async () => {
		before(async () => {
	        contracts   = await OpenSTValue_utils.deployOpenSTValue(artifacts, accounts);
	        valueToken  = contracts.valueToken;
	        openSTValue = contracts.openSTValue;
	        workers = contracts.workers;
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

		it('confirms intents mapping index position', async () => {
			const testIntentsKey = await openSTValue.testIntentsKey.call();
	 		const testIntentsMappingValue = await openSTValue.stakingIntents.call(testIntentsKey);
	 		const storagePath = await openSTValue.testStoragePath.call();
	 		// getStorageAt gets the value directly from contract storage
	 		// by passing a parameter determined from the indentified index position of the mapping
	 		const storageValue = await web3.eth.getStorageAt(openSTValue.address, storagePath);
			
			// test confirms correct identification of the index of intents mapping in contract storage
	 		// will raise a flag if the index position of the mapping changes for any reason in OpenSTValue
	 		assert.equal(testIntentsMappingValue, storageValue);
		})		
	})

	describe('AddCore', async () => {
		before(async () => {
	        contracts   = await OpenSTValue_utils.deployOpenSTValue(artifacts, accounts);
	        openSTValue = contracts.openSTValue;
        	core = await Core.new(registrar, chainIdValue, chainIdRemote, openSTRemote, constant.UTILITY_CHAIN_BLOCK_TIME, 0, proof.account.stateRoot, workers.address);
	    })

		it('fails to add core by non-registrar', async () => {
    	await Utils.expectThrow(openSTValue.addCore(core.address, { from: accounts[0] }));
		})

		it('fails to add core by registrar when core is null', async () => {
      await Utils.expectThrow(openSTValue.addCore(0, { from: registrar }));
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
        	core = await Core.new(registrar, chainIdValue, chainIdRemote, openSTRemote, constant.UTILITY_CHAIN_BLOCK_TIME, 0, proof.account.stateRoot, workers.address);
          await openSTValue.addCore(core.address, { from: registrar });
        	checkUuid = await openSTValue.hashUuid.call(symbol, name, chainIdValue, chainIdRemote, openSTRemote, conversionRate, conversionRateDecimals);
	    })

		it('fails to register by non-registrar', async () => {
            await Utils.expectThrow(openSTValue.registerUtilityToken(symbol, name, conversionRate, conversionRateDecimals, chainIdRemote, 0, checkUuid, { from: accounts[0] }));
		})

		it('fails to register when name is empty', async () => {
            await Utils.expectThrow(openSTValue.registerUtilityToken(symbol, "", conversionRate, conversionRateDecimals, chainIdRemote, 0, checkUuid, { from: registrar }));
		})

		it('fails to register when symbol is empty', async () => {
            await Utils.expectThrow(openSTValue.registerUtilityToken("", name, conversionRate, conversionRateDecimals, chainIdRemote, 0, checkUuid, { from: registrar }));
		})

		it('fails to register when conversion rate is not > 0', async () => {
            await Utils.expectThrow(openSTValue.registerUtilityToken(symbol, name, 0, conversionRateDecimals, chainIdRemote, 0, checkUuid, { from: registrar }));
		})

		it('fails to register when the given UUID does not match the calculated hash', async () => {
            await Utils.expectThrow(openSTValue.registerUtilityToken(symbol, name, conversionRate, conversionRateDecimals, chainIdRemote, 0, "bad checkUuid", { from: registrar }));
		})

		it('successfully registers', async () => {
			assert.equal(await openSTValue.getUuidsSize.call(), 0);
            assert.equal(await openSTValue.registerUtilityToken.call(symbol, name, conversionRate, conversionRateDecimals, chainIdRemote, 0, checkUuid, { from: registrar }), checkUuid);
            result = await openSTValue.registerUtilityToken(symbol, name, conversionRate, conversionRateDecimals, chainIdRemote, 0, checkUuid, { from: registrar });

            // Stake address is returned by UtilityTokenRegistered but verified below rather than by checkUtilityTokenRegisteredEvent
            OpenSTValue_utils.checkUtilityTokenRegisteredEvent(result.logs[0], checkUuid, symbol, name, 18, conversionRate, chainIdRemote, 0);
            var simpleStake = new SimpleStake(result.logs[0].args.stake);
            assert.equal(await simpleStake.uuid.call(), checkUuid);
            assert.equal(await simpleStake.eip20Token.call(), valueToken.address);
			assert.equal(await openSTValue.getUuidsSize.call(), 1);
			assert.equal((await openSTValue.utilityTokens.call(checkUuid))[0], symbol);
		})

		it('fails to register if already exists', async () => {
            await Utils.expectThrow(openSTValue.registerUtilityToken(symbol, name, conversionRate, conversionRateDecimals, chainIdRemote, 0, checkUuid, { from: registrar }));
		})
	})

	describe('Stake', async () => {
		const amountST = new BigNumber(web3.toWei(1, "ether"));
		const lock = HashLock.getHashLock();

		context('when the staking account is null', async () => {
			before(async () => {
		        contracts   = await OpenSTValue_utils.deployOpenSTValue(artifacts, accounts);
		        valueToken  = contracts.valueToken;
		        openSTValue = contracts.openSTValue;
	        	core = await Core.new(registrar, chainIdValue, chainIdRemote, openSTRemote, constant.UTILITY_CHAIN_BLOCK_TIME, 0, proof.account.stateRoot, workers.address);
	            await openSTValue.addCore(core.address, { from: registrar });
		    })

			it('fails to stake when amount is not > 0', async () => {
	            await Utils.expectThrow(openSTValue.stake(checkUuid, 0, accounts[0], lock.l, accounts[0], { from: accounts[0] }));
			})

			it('fails to stake when msg.sender has not approved it to transfer at least the amount', async () => {
	            await Utils.expectThrow(openSTValue.stake(checkUuid, amountST, accounts[0], lock.l, accounts[0], { from: accounts[0] }));
			})

			it('fails to stake when the SimpleStake address for the given UUID is null', async () => {
				await valueToken.approve(openSTValue.address, amountST, { from: accounts[0] });
	            await Utils.expectThrow(openSTValue.stake(checkUuid, amountST, accounts[0], lock.l, accounts[0], { from: accounts[0] }));
			})

			it('fails to stake when the beneficiary is null', async () => {
	        	checkUuid = await openSTValue.hashUuid.call(symbol, name, chainIdValue, chainIdRemote, openSTRemote, conversionRate, conversionRateDecimals);
				await openSTValue.registerUtilityToken(symbol, name, conversionRate, conversionRateDecimals, chainIdRemote, 0, checkUuid, { from: registrar });
	            await Utils.expectThrow(openSTValue.stake(checkUuid, amountST, 0, lock.l, accounts[0], { from: accounts[0] }));
			})

			it('successfully stakes', async () => {
	            var stakeReturns = await openSTValue.stake.call(checkUuid, amountST, accounts[0], lock.l, accounts[0], { from: accounts[0] });
	            var amountUT = stakeReturns[0].toNumber();
	            nonce = stakeReturns[1].toNumber();

    			// call block number is one less than send block number
				var unlockHeight = stakeReturns[2];
				stakingIntentHash = await openSTValue.hashStakingIntent.call(checkUuid, accounts[0], nonce, accounts[0], amountST,
	            	amountUT, unlockHeight, lock.l);
	            result = await openSTValue.stake(checkUuid, amountST, accounts[0], lock.l, accounts[0], { from: accounts[0] });

	            await OpenSTValue_utils.checkStakingIntentDeclaredEvent(result.logs[0], checkUuid, accounts[0], nonce, hashIntentKey, accounts[0],
								amountST, amountUT, unlockHeight, stakingIntentHash, chainIdRemote);
			})
		})

		context('when the staking account is not null', async () => {

			before(async () => {
		        contracts   = await OpenSTValue_utils.deployOpenSTValue(artifacts, accounts);
		        valueToken  = contracts.valueToken;
		        openSTValue = contracts.openSTValue;
	        	core = await Core.new(registrar, chainIdValue, chainIdRemote, openSTRemote, constant.UTILITY_CHAIN_BLOCK_TIME, 0, proof.account.stateRoot, workers.address);
	            await openSTValue.addCore(core.address, { from: registrar });
	        	checkUuid = await openSTValue.hashUuid.call(symbol, name, chainIdValue, chainIdRemote, openSTRemote, conversionRate, conversionRateDecimals);
						await openSTValue.registerUtilityToken(symbol, name, conversionRate, conversionRateDecimals, chainIdRemote, accounts[0], checkUuid, { from: registrar });
						await valueToken.approve(openSTValue.address,amountST, { from: accounts[0] });
		    })

			it('fails to stake when msg.sender is not the stakingAccount', async () => {
	            await Utils.expectThrow(openSTValue.stake(checkUuid, amountST, accounts[0], lock.l, accounts[1], { from: accounts[1] }));
			})

			it('successfully stakes', async () => {
	            var stakeReturns = await openSTValue.stake.call(checkUuid, amountST, accounts[0], lock.l, accounts[0], { from: accounts[0] });
	            var amountUT = stakeReturns[0].toNumber();
	            nonce = stakeReturns[1].toNumber();

    			    // call block number is one less than send block number
				var unlockHeight = stakeReturns[2];
	            stakingIntentHash = await openSTValue.hashStakingIntent.call(checkUuid, accounts[0], nonce, accounts[0], amountST,
	            	amountUT, unlockHeight, lock.l);
	            result = await openSTValue.stake(checkUuid, amountST, accounts[0], lock.l, accounts[0], { from: accounts[0] });

	            await OpenSTValue_utils.checkStakingIntentDeclaredEvent(result.logs[0], checkUuid, accounts[0], nonce, hashIntentKey, accounts[0],
								amountST, amountUT, unlockHeight, stakingIntentHash, chainIdRemote);
			})
		})
	})

	describe('ProcessStaking', async () => {
		const amountST = new BigNumber(web3.toWei(1, "ether")),
			amountUT = amountST.mul(new BigNumber(conversionRate)).div(new BigNumber(10**conversionRateDecimals));
			const lock = HashLock.getHashLock();

		before(async () => {
	        contracts   = await OpenSTValue_utils.deployOpenSTValue(artifacts, accounts);
	        valueToken  = contracts.valueToken;
	        openSTValue = contracts.openSTValue;
        	core = await Core.new(registrar, chainIdValue, chainIdRemote, openSTRemote, constant.UTILITY_CHAIN_BLOCK_TIME, 0, proof.account.stateRoot, workers.address);
            await openSTValue.addCore(core.address, { from: registrar });
        	checkUuid = await openSTValue.hashUuid.call(symbol, name, chainIdValue, chainIdRemote, openSTRemote, conversionRate, conversionRateDecimals);
			result = await openSTValue.registerUtilityToken(symbol, name, conversionRate, conversionRateDecimals, chainIdRemote, accounts[0], checkUuid, { from: registrar });
			stake = result.logs[0].args.stake;
			await valueToken.approve(openSTValue.address, amountST, { from: accounts[0] });
			result = await openSTValue.stake(checkUuid, amountST, accounts[0], lock.l, accounts[0], { from: accounts[0] });
			stakingIntentHash = result.logs[0].args._stakingIntentHash;
	    })

		it('fails to process when stakingIntentHash is empty', async () => {
            await Utils.expectThrow(openSTValue.processStaking("", lock.s, { from: accounts[0] }));
		})

		it('fails to process if hash of unlockSecret does not match hashlock', async () => {
			const differentLock = HashLock.getHashLock();
			// registrar can additionally as a fallback process staking in v0.9
			await Utils.expectThrow(openSTValue.processStaking(stakingIntentHash, differentLock.s, { from: accounts[0] }));
		})

		it('fails to processStaking when msg.sender is not staking account', async () => {
		    await Utils.expectThrow(openSTValue.processStaking(stakingIntentHash, lock.s, { from: registrar }));
		})

		it('successfully processes', async () => {
			var openSTValueBal = await valueToken.balanceOf.call(openSTValue.address);
			var stakeBal = await valueToken.balanceOf.call(stake);
			assert.equal(openSTValueBal.toNumber(), amountST);
			assert.equal(stakeBal.toNumber(), 0);
			result = await openSTValue.processStaking(stakingIntentHash, lock.s, { from: accounts[0] });

			openSTValueBal = await valueToken.balanceOf.call(openSTValue.address);
			stakeBal = await valueToken.balanceOf.call(stake);
			assert.equal(openSTValueBal.toNumber(), 0);
			assert.equal(stakeBal.toNumber(), amountST);
      		await OpenSTValue_utils.checkProcessedStakeEvent(result.logs[0], checkUuid, stakingIntentHash, stake, accounts[0], amountST, amountUT, lock.s);
		})

		it('fails to reprocess', async () => {
            await Utils.expectThrow(openSTValue.processStaking(stakingIntentHash, lock.s, { from: accounts[0] }));
		})
	})

	describe('ConfirmRedemptionIntent', async () => {
		// Using accounts[2] as redeemer to confirm that redemption/unstaking is not limited to the staker
		var redeemer 				= accounts[2];
  		var redeemBeneficiary 		= accounts[3];
		var redemptionIntentHash 	= null;
		var redemptionUnlockHeight 	= 110;
		var amountUT 				= conversionRate.div(new BigNumber(10**conversionRateDecimals));

		var unlockHeight = null;
		const lock = HashLock.getHashLock();
		const lockR = HashLock.getHashLock();

		before(async () => {
			contracts   = await OpenSTValue_utils.deployOpenSTValue(artifacts, accounts);
			valueToken  = contracts.valueToken;
			openSTValue = contracts.openSTValue;
			core = await Core.new(registrar, chainIdValue, chainIdRemote, openSTRemote, constant.UTILITY_CHAIN_BLOCK_TIME, 0, proof.account.stateRoot, workers.address);
			await openSTValue.addCore(core.address, { from: registrar });
			checkUuid = await openSTValue.hashUuid.call(symbol, name, chainIdValue, chainIdRemote, openSTRemote, conversionRate, conversionRateDecimals);
			result = await openSTValue.registerUtilityToken(symbol, name, conversionRate, conversionRateDecimals, chainIdRemote, 0, checkUuid, { from: registrar });
			stake = result.logs[0].args.stake;
			nonce = await openSTValue.getNextNonce.call(redeemer);
			validRLPParentNodes = await openSTValue.getMockRLPParentNodes(true);
            invalidRLPParentNodes = await openSTValue.getMockRLPParentNodes(false);
		})

		it('fails to confirm by non-registrar', async () => {
            unlockHeight = new BigNumber(redemptionUnlockHeight).plus(web3.eth.blockNumber);
			redemptionIntentHash = await openSTValue.hashRedemptionIntent.call(checkUuid, redeemer, nonce, redeemBeneficiary, amountUT, unlockHeight, lockR.l);
            await Utils.expectThrow(openSTValue.confirmRedemptionIntent(checkUuid, redeemer, nonce, redeemBeneficiary, amountUT, unlockHeight, lockR.l, 0, validRLPParentNodes, { from: accounts[0] }));
		})

		it('fails to confirm when utility token does not have a simpleStake address', async () => {
			// Recalculate hash to confirm that it is not the error
            unlockHeight = new BigNumber(redemptionUnlockHeight).plus(web3.eth.blockNumber);
			redemptionIntentHash = await openSTValue.hashRedemptionIntent.call("bad UUID", redeemer, nonce, redeemBeneficiary, amountUT, unlockHeight, lockR.l);
            await Utils.expectThrow(openSTValue.confirmRedemptionIntent("bad UUID", redeemer, nonce, redeemBeneficiary, amountUT, unlockHeight, lockR.l, 0, validRLPParentNodes, { from: registrar }));
		})

		it('fails to confirm when amountUT is not > 0', async () => {
			// Recalculate hash to confirm that it is not the error
            unlockHeight = new BigNumber(redemptionUnlockHeight).plus(web3.eth.blockNumber);
			redemptionIntentHash = await openSTValue.hashRedemptionIntent.call(checkUuid, redeemer, nonce, redeemBeneficiary, 0, unlockHeight, lockR.l);
            await Utils.expectThrow(openSTValue.confirmRedemptionIntent(checkUuid, redeemer, nonce, redeemBeneficiary, 0, unlockHeight, lockR.l, 0, validRLPParentNodes, { from: registrar }));
		})

		it('fails to confirm when redemptionUnlockHeight is not > 0', async () => {
			// Recalculate hash to confirm that it is not the error
			redemptionIntentHash = await openSTValue.hashRedemptionIntent.call(checkUuid, redeemer, nonce, redeemBeneficiary, amountUT, 0, lockR.l);
            await Utils.expectThrow(openSTValue.confirmRedemptionIntent(checkUuid, redeemer, nonce, redeemBeneficiary, amountUT, 0, lockR.l, 0, validRLPParentNodes, { from: registrar }));
		})

		it('fails to confirm when nonce is not exactly 1 greater than previously', async () => {
			// Recalculate hash to confirm that it is not the error
            unlockHeight = new BigNumber(redemptionUnlockHeight).plus(web3.eth.blockNumber);
			redemptionIntentHash = await openSTValue.hashRedemptionIntent.call(checkUuid, redeemer, nonce.minus(1), redeemBeneficiary, amountUT, unlockHeight, lockR.l);
            await Utils.expectThrow(openSTValue.confirmRedemptionIntent(checkUuid, redeemer, nonce.minus(1), redeemBeneficiary, amountUT, unlockHeight, lockR.l, 0, validRLPParentNodes, { from: registrar }));
		})

		it('fails to confirm when input params does not yeild match for redemptionIntentHash', async () => {
            unlockHeight = new BigNumber(redemptionUnlockHeight).plus(web3.eth.blockNumber);
            await Utils.expectThrow(openSTValue.confirmRedemptionIntent(checkUuid, redeemer, nonce.minus(2), redeemBeneficiary, amountUT, unlockHeight, lockR.l, 0, validRLPParentNodes, { from: registrar }));
		})

		it('fails to confirm when token balance of stake is not >= amountST', async () => {
            unlockHeight = new BigNumber(redemptionUnlockHeight).plus(web3.eth.blockNumber);
			redemptionIntentHash = await openSTValue.hashRedemptionIntent.call(checkUuid, redeemer, nonce, redeemBeneficiary,  amountUT, unlockHeight, lockR.l);
            await Utils.expectThrow(openSTValue.confirmRedemptionIntent(checkUuid, redeemer, nonce, redeemBeneficiary, amountUT, unlockHeight, lockR.l, 0, validRLPParentNodes, { from: registrar }));
		})

        it('fails to confirm when RLPParentNodes are invalid', async () => {
            await Utils.expectThrow(openSTValue.confirmRedemptionIntent(checkUuid, redeemer, nonce.minus(1), redeemBeneficiary, amountUT, redemptionUnlockHeight, lockR.l, 0, invalidRLPParentNodes, { from: registrar }));
        })

		it('successfully confirms', async () => {
			await valueToken.approve(openSTValue.address, 2, { from: accounts[0] });
			result = await openSTValue.stake(checkUuid, 2, accounts[0], lock.l, accounts[0], { from: accounts[0] });
			stakingIntentHash = result.logs[0].args._stakingIntentHash;
			await openSTValue.processStaking(stakingIntentHash, lock.s, { from: accounts[0] });
            unlockHeight = new BigNumber(redemptionUnlockHeight).plus(web3.eth.blockNumber);
			redemptionIntentHash = await openSTValue.hashRedemptionIntent.call(checkUuid, redeemer, nonce, redeemBeneficiary, amountUT, unlockHeight, lockR.l);
			var confirmReturns = await openSTValue.confirmRedemptionIntent.call(checkUuid, redeemer, nonce, redeemBeneficiary, amountUT, unlockHeight, lockR.l, 0, validRLPParentNodes, { from: registrar })
			var amountST = confirmReturns[0];
			assert.equal(amountST, (amountUT / conversionRate)*10**conversionRateDecimals);

            result = await openSTValue.confirmRedemptionIntent(checkUuid, redeemer, nonce, redeemBeneficiary, amountUT, unlockHeight, lockR.l, 0, validRLPParentNodes, { from: registrar });
            var blocks_to_wait_short = await openSTValue.blocksToWaitShort.call();

			var blockNumber = web3.eth.blockNumber;
			var expirationHeight = blockNumber + blocks_to_wait_short.toNumber();
			      await OpenSTValue_utils.checkRedemptionIntentConfirmedEvent(result.logs[0], checkUuid, redemptionIntentHash, redeemer, redeemBeneficiary, amountST, amountUT, expirationHeight);

		})

		it('fails to confirm a replay', async () => {
            unlockHeight = new BigNumber(redemptionUnlockHeight).plus(web3.eth.blockNumber);
			redemptionIntentHash = await openSTValue.hashRedemptionIntent.call(checkUuid, redeemer, nonce, redeemBeneficiary, amountUT, unlockHeight, lockR.l);
            await Utils.expectThrow(openSTValue.confirmRedemptionIntent(checkUuid, redeemer, nonce, redeemBeneficiary, amountUT, unlockHeight, lockR.l, 0, validRLPParentNodes, { from: registrar }));
		})

		// Fails because logic does not prevent attempting to redeem 1 UTWei when the conversion rate is greater than 1
		it('fails to confirm when amountUT does not convert into at least 1 STWei', async () => {
			nonce = await openSTValue.getNextNonce.call(redeemer);

            unlockHeight = new BigNumber(redemptionUnlockHeight).plus(web3.eth.blockNumber);
			// 1 STWei == 10 UTWei at the given conversion rate
			redemptionIntentHash = await openSTValue.hashRedemptionIntent.call(checkUuid, redeemer, nonce, redeemBeneficiary, 1, unlockHeight, lockR.l);
            await Utils.expectThrow(openSTValue.confirmRedemptionIntent(checkUuid, redeemer, nonce, redeemBeneficiary, 1, unlockHeight, lockR.l, 0, validRLPParentNodes, { from: registrar }));
		})

        it('fails to confirm when block number is equal/greater to safe unlockHeight', async () => {
            await valueToken.approve(openSTValue.address, 2, { from: accounts[0] });
            result = await openSTValue.stake(checkUuid, 2, accounts[0], lock.l, accounts[0], { from: accounts[0] });
            stakingIntentHash = result.logs[0].args._stakingIntentHash;
            await openSTValue.processStaking(stakingIntentHash, lock.s, { from: accounts[0] });
            unlockHeight = new BigNumber(redemptionUnlockHeight).plus(web3.eth.blockNumber);
            redemptionIntentHash = await openSTValue.hashRedemptionIntent.call(checkUuid, redeemer, nonce, redeemBeneficiary, amountUT, unlockHeight, lockR.l);
            // blockToWaitLong = 110
            // blockToWaitMedium = 60
            // blockToWaitLong-blockToWaitMedium = 50; so the value 49
            for (var i=0; i<49; i++){
            	await Utils.expectThrow(openSTValue.confirmRedemptionIntent(checkUuid, redeemer, nonce, redeemBeneficiary, amountUT, unlockHeight, lockR.l, 0, invalidRLPParentNodes, { from: registrar }));
            }

            await Utils.expectThrow(openSTValue.confirmRedemptionIntent(checkUuid, redeemer, nonce, redeemBeneficiary, amountUT, unlockHeight, lockR.l, 0, validRLPParentNodes, { from: registrar }));

        })
	})

	describe('ProcessUnstaking', async () => {
		var redeemer 				= accounts[2];
  	    var redeemBeneficiary       = accounts[3];
		var notRedeemer				= accounts[5];
		var redemptionIntentHash 	= null;
		var redemptionUnlockHeight 	= 110;
		var amountUT 				= conversionRate.div(new BigNumber(10**conversionRateDecimals));

        var unlockHeight = null;
		const lock = HashLock.getHashLock();
		const lockR = HashLock.getHashLock();

		context('when expirationHeight is > block number', async () => {
			before(async () => {
		        contracts   = await OpenSTValue_utils.deployOpenSTValue(artifacts, accounts);
		        valueToken  = contracts.valueToken;
		        openSTValue = contracts.openSTValue;
		        validRLPParentNodes = await openSTValue.getMockRLPParentNodes(true);
		        core = await Core.new(registrar, chainIdValue, chainIdRemote, openSTRemote, constant.UTILITY_CHAIN_BLOCK_TIME, 0, proof.account.stateRoot, workers.address);
	            await openSTValue.addCore(core.address, { from: registrar });
	        	checkUuid = await openSTValue.hashUuid.call(symbol, name, chainIdValue, chainIdRemote, openSTRemote, conversionRate, conversionRateDecimals);
				result = await openSTValue.registerUtilityToken(symbol, name, conversionRate, conversionRateDecimals, chainIdRemote, 0, checkUuid, { from: registrar });
				stake = result.logs[0].args.stake;
				nonce = await openSTValue.getNextNonce.call(redeemer);
				await valueToken.approve(openSTValue.address, 1, { from: accounts[0] });
				result = await openSTValue.stake(checkUuid, 1, accounts[0], lock.l, accounts[0], { from: accounts[0] });
				stakingIntentHash = result.logs[0].args._stakingIntentHash;
				await openSTValue.processStaking(stakingIntentHash, lock.s,{ from: accounts[0] });
                unlockHeight = new BigNumber(redemptionUnlockHeight).plus(web3.eth.blockNumber);
				redemptionIntentHash = await openSTValue.hashRedemptionIntent.call(checkUuid, redeemer, nonce, redeemBeneficiary, amountUT, unlockHeight, lockR.l);
                await openSTValue.confirmRedemptionIntent(checkUuid, redeemer, nonce, redeemBeneficiary, amountUT, unlockHeight, lockR.l,  0, validRLPParentNodes, { from: registrar });
		    })

			it('fails to process when redemptionIntentHash is empty', async () => {
	            await Utils.expectThrow(openSTValue.processUnstaking("", lockR.s, { from: notRedeemer }));
			})

			it('fails to process if hash of unlockSecret does not match hashlock', async () => {
	            await Utils.expectThrow(openSTValue.processUnstaking(redemptionIntentHash, "incorrect unlock secret", { from: notRedeemer }));
			})

			it('fails to process when utility token does not have a simpleStake address', async () => {
	            await Utils.expectThrow(openSTValue.processUnstaking("bad hash", lockR.s, { from: notRedeemer }));
			})

			it('successfully processes', async () => {
				var stakeBal = await valueToken.balanceOf.call(stake);
				var redeemBeneficiaryBal = await valueToken.balanceOf.call(redeemer);
				assert.equal(stakeBal.toNumber(), 1);
				assert.equal(redeemBeneficiaryBal.toNumber(), 0);
				result = await openSTValue.processUnstaking(redemptionIntentHash, lockR.s, { from: redeemer });

				stakeBal = await valueToken.balanceOf.call(stake);
				redeemBeneficiaryBal = await valueToken.balanceOf.call(redeemBeneficiary);
  			assert.equal(stakeBal.toNumber(), 0);
				assert.equal(redeemBeneficiaryBal.toNumber(), 1);
				      await OpenSTValue_utils.checkProcessedUnstakeEvent(result.logs[0], checkUuid, redemptionIntentHash, stake, redeemer, redeemBeneficiary, 1, lockR.s);
			})

			it('fails to reprocess', async () => {
	            await Utils.expectThrow(openSTValue.processUnstaking(redemptionIntentHash, lockR.s, { from: notRedeemer }));
			})
		})
	})


	// Revert Staking before ProcessStaking
	describe('Process RevertStaking before ProcessStaking', async () => {

		const lock = HashLock.getHashLock();

		context('Revert Stake', async () => {

			var staker = accounts[0];
			var owner  = accounts[1];
			var amountST = new BigNumber(web3.toWei(126, "ether"));
			var amountUT = null;
			var unlockHeight = null;

			before(async () => {
				contracts   = await OpenSTValue_utils.deployOpenSTValue(artifacts, accounts);
				valueToken  = contracts.valueToken;
				openSTValue = contracts.openSTValue;
				core = await Core.new(registrar, chainIdValue, chainIdRemote, openSTRemote, constant.UTILITY_CHAIN_BLOCK_TIME, 0, proof.account.stateRoot, workers.address);
				await openSTValue.addCore(core.address, { from: registrar });
				checkUuid = await openSTValue.hashUuid.call(symbol, name, chainIdValue, chainIdRemote, openSTRemote, conversionRate, conversionRateDecimals);
				await openSTValue.registerUtilityToken(symbol, name, conversionRate, conversionRateDecimals, chainIdRemote, staker, checkUuid, { from: registrar });
				await valueToken.approve(openSTValue.address, amountST, { from: staker });

				//Successfully Staking
				var stakeReturns = await openSTValue.stake.call(checkUuid, amountST, staker, lock.l, staker, { from: staker });
				amountUT = stakeReturns[0].toNumber();
				nonce = stakeReturns[1].toNumber();

				// call block number is one less than send block number
				unlockHeight = stakeReturns[2];
				stakingIntentHash = await openSTValue.hashStakingIntent.call(checkUuid, staker, nonce, staker, amountST, amountUT, unlockHeight, lock.l);
				result = await openSTValue.stake(checkUuid, amountST, staker, lock.l, staker, { from: staker });
				await OpenSTValue_utils.checkStakingIntentDeclaredEvent(result.logs[0], checkUuid, staker, nonce, hashIntentKey, staker, amountST, amountUT, unlockHeight, stakingIntentHash, chainIdRemote);

			});

			it('fails to process when stakingIntentHash is empty', async () => {

				await Utils.expectThrow(openSTValue.revertStaking("", {from: staker}));

			});

			it('fails to process when stakingIntentHash is Bad Hash', async () => {

				await Utils.expectThrow(openSTValue.revertStaking("Bad Hash", {from: staker}));

			});

			it('fails to process when reverting before waiting period ends', async () => {
				// for test of the test case lets make sure that waiting period is ended
				var waitTime = await openSTValue.blocksToWaitLong.call();
				waitTime = waitTime.toNumber()-3;
				// Wait time less 1 block for preceding test case and 1 block because condition is <=
				for (var i = 0; i < waitTime ; i++) {
						await Utils.expectThrow(openSTValue.revertStaking(stakingIntentHash, {from: staker}));
				}

			});

			it('success  processing revert staking', async () => {

				var result = await openSTValue.revertStaking(stakingIntentHash, {from: staker});
				OpenSTValue_utils.checkRevertStakingEventProtocol(result.logs[0], checkUuid, stakingIntentHash, staker, amountST, amountUT);

			});

			it('fails to process revert staking', async () => {

				await Utils.expectThrow(openSTValue.revertStaking(stakingIntentHash, {from: staker}));

			});

		})

		// Revert Staking After ProcessStaking
		context('Revert Staking After ProcessStaking', async () => {
			var staker = accounts[0];
			var owner  = accounts[1];
			var amountST = new BigNumber(web3.toWei(126, "ether"));
			var amountUT = null;
			var unlockHeight = null;

			before(async () => {
				contracts   = await OpenSTValue_utils.deployOpenSTValue(artifacts, accounts);
				valueToken  = contracts.valueToken;
				openSTValue = contracts.openSTValue;
				core = await Core.new(registrar, chainIdValue, chainIdRemote, openSTRemote, constant.UTILITY_CHAIN_BLOCK_TIME, 0, proof.account.stateRoot, workers.address);
				await openSTValue.addCore(core.address, { from: registrar });
				checkUuid = await openSTValue.hashUuid.call(symbol, name, chainIdValue, chainIdRemote, openSTRemote, conversionRate, conversionRateDecimals);
				await openSTValue.registerUtilityToken(symbol, name, conversionRate, conversionRateDecimals, chainIdRemote, staker, checkUuid, { from: registrar });
				await valueToken.approve(openSTValue.address, amountST, { from: staker });

				//Successfully Staking
				var stakeReturns = await openSTValue.stake.call(checkUuid, amountST, staker, lock.l, staker, { from: staker });
				amountUT = stakeReturns[0].toNumber();
				nonce = stakeReturns[1].toNumber();

				// call block number is one less than send block number
				unlockHeight = stakeReturns[2];
				stakingIntentHash = await openSTValue.hashStakingIntent.call(checkUuid, staker, nonce, staker, amountST,
					amountUT, unlockHeight, lock.l);
				result = await openSTValue.stake(checkUuid, amountST, staker, lock.l, staker, { from: staker });
				await OpenSTValue_utils.checkStakingIntentDeclaredEvent(result.logs[0], checkUuid, staker, nonce, hashIntentKey, staker, amountST, amountUT, unlockHeight, stakingIntentHash, chainIdRemote);

				// Process Staking
				await openSTValue.processStaking(stakingIntentHash, lock.s, { from: staker });
			});

			it('fails to revertStaking when msg.sender is not staking account', async () => {
			    await Utils.expectThrow(openSTValue.revertStaking(stakingIntentHash, {from: accounts[0]}));
			});

			it('fails to process when reverting before waiting period ends', async () => {

				// for test of the test case lets make sure that waiting period is ended
				var waitTime = await openSTValue.blocksToWaitLong.call();
				waitTime = waitTime.toNumber()-1;
				// Wait time less 1 block for preceding test case and 1 block because condition is <=
				for (var i = 0; i < waitTime; i++) {
					await Utils.expectThrow(openSTValue.revertStaking(stakingIntentHash, {from: staker}));
				}

			})

			it('fails to process revert staking', async () => {

				await Utils.expectThrow(openSTValue.revertStaking(stakingIntentHash, {from: staker}));

			});


		});

	});

	// Revert Unstaking
	describe('Revert Unstaking', async () => {

		var staker 									= accounts[0];
		var redeemer 								= accounts[2];
		var redeemBeneficiary       = accounts[3];
		var redemptionIntentHash 		= null;
		var redemptionUnlockHeight 	= 110;
		var amountST 								= new BigNumber(web3.toWei(1, "ether"));
		var amountUT 								= (new BigNumber(amountST * conversionRate)).div(new BigNumber(10**conversionRateDecimals));
		var externalUser 						= accounts[7];

        var unlockHeight = null;
		const lock = HashLock.getHashLock();
		const lockR = HashLock.getHashLock();

		context('Revert Unstaking before ProcessUnstaking ', async () => {
			before(async () => {

				contracts   = await OpenSTValue_utils.deployOpenSTValue(artifacts, accounts);
				valueToken  = contracts.valueToken;
				openSTValue = contracts.openSTValue;
                validRLPParentNodes = await openSTValue.getMockRLPParentNodes(true);
				core = await Core.new(registrar, chainIdValue, chainIdRemote, openSTRemote, constant.UTILITY_CHAIN_BLOCK_TIME, 0, proof.account.stateRoot, workers.address);
				await openSTValue.addCore(core.address, { from: registrar });
				checkUuid = await openSTValue.hashUuid.call(symbol, name, chainIdValue, chainIdRemote, openSTRemote, conversionRate, conversionRateDecimals);
				result = await openSTValue.registerUtilityToken(symbol, name, conversionRate, conversionRateDecimals, chainIdRemote, staker, checkUuid, { from: registrar });
				stake = result.logs[0].args.stake;
				nonce = await openSTValue.getNextNonce.call(redeemer);
				await valueToken.approve(openSTValue.address, amountST, { from: staker });
				result = await openSTValue.stake(checkUuid, amountST, staker, lock.l, staker, { from: staker });
				stakingIntentHash = result.logs[0].args._stakingIntentHash;
				await openSTValue.processStaking(stakingIntentHash, lock.s, { from: staker });
                unlockHeight = new BigNumber(redemptionUnlockHeight).plus(web3.eth.blockNumber);
				redemptionIntentHash = await openSTValue.hashRedemptionIntent.call(checkUuid, redeemer, nonce, redeemBeneficiary, amountUT, unlockHeight, lockR.l);
				await openSTValue.confirmRedemptionIntent(checkUuid, redeemer, nonce, redeemBeneficiary, amountUT, unlockHeight, lockR.l,  0, validRLPParentNodes, { from: registrar });

			});


			it('fails to process when redemptionIntentHash is empty ', async () => {

				await Utils.expectThrow(openSTValue.revertUnstaking("", { from: externalUser }));

			});

			it('fails to process when redemptionIntentHash is Bad Hash ', async () => {

				await Utils.expectThrow(openSTValue.revertUnstaking("Bad Hash", { from: externalUser }));

			});

			it('fails to process when reverting before waiting period ends', async () => {

				// for test of the test case lets make sure that waiting period is ended
				var waitTime = await openSTValue.blocksToWaitShort.call();
				waitTime = waitTime.toNumber() - 3;
				// Wait time less 1 block for preceding test case and 1 block because condition is <=
				for (var i = 0; i < waitTime ; i++) {
					await Utils.expectThrow(openSTValue.revertUnstaking(redemptionIntentHash, { from: externalUser }));
				}

			});


			it('success processing revert unstaking', async () => {

				var revertUnstakingResult = await openSTValue.revertUnstaking(redemptionIntentHash, { from: externalUser });
				await OpenSTValue_utils.checkRevertedUnstake(revertUnstakingResult.logs[0], checkUuid, redemptionIntentHash,redeemer, redeemBeneficiary, amountST);

			});

			it('fails to process when revertUnstaking once its already done', async () => {

				await Utils.expectThrow(openSTValue.revertUnstaking(redemptionIntentHash, { from: externalUser }));

			});

		});

		context('Revert Unstaking after ProcessUnstaking ', async () => {
			before(async () => {

                var unlockHeight = null;

				contracts   = await OpenSTValue_utils.deployOpenSTValue(artifacts, accounts);
				valueToken  = contracts.valueToken;
				openSTValue = contracts.openSTValue;
				core = await Core.new(registrar, chainIdValue, chainIdRemote, openSTRemote, constant.UTILITY_CHAIN_BLOCK_TIME, 0, proof.account.stateRoot, workers.address);
				await openSTValue.addCore(core.address, { from: registrar });
				checkUuid = await openSTValue.hashUuid.call(symbol, name, chainIdValue, chainIdRemote, openSTRemote, conversionRate, conversionRateDecimals);
				result = await openSTValue.registerUtilityToken(symbol, name, conversionRate, conversionRateDecimals, chainIdRemote, staker, checkUuid, { from: registrar });
				stake = result.logs[0].args.stake;
				nonce = await openSTValue.getNextNonce.call(redeemer);
				await valueToken.approve(openSTValue.address, amountST, { from: staker });
				result = await openSTValue.stake(checkUuid, amountST, staker, lock.l, staker, { from: staker });
				stakingIntentHash = result.logs[0].args._stakingIntentHash;
				await openSTValue.processStaking(stakingIntentHash, lock.s, { from: staker });
                unlockHeight = new BigNumber(redemptionUnlockHeight).plus(web3.eth.blockNumber);
				redemptionIntentHash = await openSTValue.hashRedemptionIntent.call(checkUuid, redeemer, nonce, redeemBeneficiary, amountUT, unlockHeight, lockR.l);
				validRLPParentNodes = await openSTValue.getMockRLPParentNodes(true);
				await openSTValue.confirmRedemptionIntent(checkUuid, redeemer, nonce, redeemBeneficiary, amountUT, unlockHeight, lockR.l,  0, validRLPParentNodes, { from: registrar });


				// Successfull ProcessUnstaking
				processUnstakingResult = await openSTValue.processUnstaking(redemptionIntentHash, lockR.s, { from: redeemer });
				await OpenSTValue_utils.checkProcessedUnstakeEvent(processUnstakingResult.logs[0], checkUuid, redemptionIntentHash, stake, redeemer, redeemBeneficiary, amountST, lockR.s);

			});


			it('fails to process when revertUnstaking once its already done', async () => {

				var waitTime = await openSTValue.blocksToWaitShort.call();
				waitTime = waitTime.toNumber() - 1;
				// Wait time less 1 block for preceding test case and 1 block because condition is <=
				for (var i = 0; i < waitTime ; i++) {
					await Utils.expectThrow(openSTValue.revertUnstaking(redemptionIntentHash, { from: externalUser }));
				}
				await Utils.expectThrow(openSTValue.revertUnstaking(redemptionIntentHash, { from: externalUser }));

			});

		});

	});

})
