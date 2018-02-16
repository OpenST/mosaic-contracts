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
// Test: OpenSTUtility.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const Utils = require('./lib/utils.js');
const HashLock = require('./lib/hash_lock.js');
const OpenSTUtility_utils = require('./OpenSTUtility_utils.js');
const BrandedToken = artifacts.require("./BrandedToken.sol");
const BigNumber = require('bignumber.js');

///
/// Test stories
/// 
/// Properties
/// 	has chainIdValue
/// 	has chainIdUtility
/// 	has registrar
///
/// ProposeBrandedToken
///     fails to propose when symbol is empty
///     fails to propose when name is empty
/// 	fails to propose when conversion rate is not > 0
///		successfully proposes
///
/// RegisterBrandedToken
///		fails to register by non-registrar
///     fails to register when symbol is empty
///     fails to register when name is empty
/// 	fails to register when conversion rate is not > 0
///		fails to register when UUIDs do not match
///		successfully registers
///
///	ConfirmStakingIntent
///		fails to confirm by non-registrar
/// 	fails to confirm when token is not registered
/// 	fails confirm when stakerNonce is not > previously
/// 	fails to confirm when amoutST is not > 0
/// 	fails to confirm when amoutUT is not > 0
/// 	fails to confirm when stakingUnlockHeight is not > 0
/// 	fails to confirm when stakingIntentHash is empty
/// 	fails to confirm when stakingIntentHash does not match calculated hash
/// 	successfully confirms
///
/// ProcessMinting
/// 	when expirationHeight is > block number
///			fails to process if stakingIntentHash is empty
///			fails to process if hash of unlockSecret does not match hashlock
///			successfully mints
/// 		fails to re-process a processed mint
///		when expirationHeight is < block number // TBD: how or where to test this practically
///
///	Redeem
/// 	fails to redeem when uuid is empty
/// 	fails to redeem when amount is not > 0
/// 	fails to redeem when nonce is not >= previously
/// 	fails to redeem when uuid is uuidSTPrime
/// 	fails to redeem if not approved to transfer the amount
/// 	successfully redeems
///
///	RedeemSTPrime
///		fails to redeem when msg.value is not > 0
/// 	fails to redeem when nonce is not >= previously
/// 	successfully redeems
///
/// ProcessRedeeming
///		BrandedToken
/// 		fails to process if redemptionIntentHash is empty
/// 		fails to process if hash of unlockSecret does not match hashlock
/// 		successfully processes
/// 		fails to reprocess
///		STPrime
/// 		successfully processes
///
/// ProcessRedeeming with fallback
///		BrandedToken
/// 		successfully processes by registrar
///		STPrime
/// 		successfully processes by registrar
///

contract('OpenSTUtility', function(accounts) {
	const chainIdValue   		= 3;
	const chainIdUtility 		= 1410;
	const registrar      		= accounts[1];

	const symbol 				= "MCC";
	const name 					= "Member Company Coin";
	const conversionRate 		= 5;
	const amountST 					= new BigNumber(web3.toWei(1, "ether"));
	const amountUT 					= new BigNumber(amountST * conversionRate);


	const hashName 	 			= "hashName";
	const hashSymbol 			= "hashSymbol";
	const requester  			= "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
	const token 	 			= "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
	const redeemer 				= accounts[0];
	const notRedeemer			= accounts[5];

	var result 					= null;
	var checkBtUuid 			= null;
	var brandedToken 			= null;
	var checkStakingIntentHash 	= null;
	var unlockHeight 			= null;
	var uuidSTPrime				= null;
	var expirationHeight 		= null;

	describe('Properties', async () => {
		before(async () => {
	        contracts   = await OpenSTUtility_utils.deployOpenSTUtility(artifacts, accounts);
	        openSTUtility = contracts.openSTUtility;
	    })

		it('has chainIdValue', async () => {
			assert.equal(await openSTUtility.chainIdValue.call(), chainIdValue);
		})

		it('has chainIdUtility', async () => {
			assert.equal(await openSTUtility.chainIdUtility.call(), chainIdUtility);
		})

		it('has registrar', async () => {
			assert.equal(await openSTUtility.registrar.call(), registrar);
		})
	})

	describe('ProposeBrandedToken', async () => {
		before(async () => {
	        contracts   = await OpenSTUtility_utils.deployOpenSTUtility(artifacts, accounts);
	        openSTUtility = contracts.openSTUtility;
        	checkBtUuid = await openSTUtility.hashUuid.call(symbol, name, chainIdValue, chainIdUtility, openSTUtility.address, conversionRate);
	    })

		it('fails to propose when symbol is empty', async () => {
            await Utils.expectThrow(openSTUtility.proposeBrandedToken("", name, conversionRate));
		})

		it('fails to propose when name is empty', async () => {
            await Utils.expectThrow(openSTUtility.proposeBrandedToken(symbol, "", conversionRate));
		})

		it('fails to propose when conversion rate is not > 0', async () => {
            await Utils.expectThrow(openSTUtility.proposeBrandedToken(symbol, name, 0));
		})

		it('successfully proposes', async () => {
            assert.equal(await openSTUtility.proposeBrandedToken.call(symbol, name, conversionRate), checkBtUuid);
            result = await openSTUtility.proposeBrandedToken(symbol, name, conversionRate);

            // Token address is returned by ProposedBrandedToken but verified below rather than by checkProposedBrandedTokenEvent
            OpenSTUtility_utils.checkProposedBrandedTokenEvent(result.logs[0], accounts[0], checkBtUuid, symbol, name, conversionRate);
            var brandedTokenContract = new BrandedToken(result.logs[0].args._token);
            assert.equal(await brandedTokenContract.uuid.call(), checkBtUuid);
		})
	})

	describe('RegisterBrandedToken', async () => {
		before(async () => {
	        contracts   = await OpenSTUtility_utils.deployOpenSTUtility(artifacts, accounts);
	        openSTUtility = contracts.openSTUtility;
        	checkBtUuid = await openSTUtility.hashUuid.call(symbol, name, chainIdValue, chainIdUtility, openSTUtility.address, conversionRate);
            result = await openSTUtility.proposeBrandedToken(symbol, name, conversionRate);
            brandedToken = result.logs[0].args._token;
	    })

		it('fails to register by non-registrar', async () => {
            await Utils.expectThrow(openSTUtility.registerBrandedToken(symbol, name, conversionRate, accounts[0], brandedToken, checkBtUuid, { from: accounts[0] }));
		})

		it('fails to register when symbol is empty', async () => {
            await Utils.expectThrow(openSTUtility.registerBrandedToken("", name, conversionRate, accounts[0], brandedToken, checkBtUuid, { from: registrar }));
		})

		it('fails to register when name is empty', async () => {
            await Utils.expectThrow(openSTUtility.registerBrandedToken(symbol, "", conversionRate, accounts[0], brandedToken, checkBtUuid, { from: registrar }));
		})

		it('fails to register when conversion rate is not > 0', async () => {
            await Utils.expectThrow(openSTUtility.registerBrandedToken(symbol, name, 0, accounts[0], brandedToken, checkBtUuid, { from: registrar }));
		})

		it('fails to register when UUIDs do not match', async () => {
            await Utils.expectThrow(openSTUtility.registerBrandedToken(symbol, name, conversionRate, accounts[0], brandedToken, "bad UUID", { from: registrar }));
		})

		it('successfully registers', async () => {
			assert.equal(await openSTUtility.registerBrandedToken.call(symbol, name, conversionRate, accounts[0], brandedToken, checkBtUuid, { from: registrar }), checkBtUuid);
            result = await openSTUtility.registerBrandedToken(symbol, name, conversionRate, accounts[0], brandedToken, checkBtUuid, { from: registrar });
            await OpenSTUtility_utils.checkRegisteredBrandedTokenEvent(result.logs[0], registrar, brandedToken, checkBtUuid, symbol, name, conversionRate, accounts[0]);            
		})
	})

	describe('ConfirmStakingIntent', async () => {

		const lock = HashLock.getHashLock();

		before(async () => {
	        contracts   = await OpenSTUtility_utils.deployOpenSTUtility(artifacts, accounts);
	        openSTUtility = contracts.openSTUtility;
        	checkBtUuid = await openSTUtility.hashUuid.call(symbol, name, chainIdValue, chainIdUtility, openSTUtility.address, conversionRate);
            result = await openSTUtility.proposeBrandedToken(symbol, name, conversionRate);
            brandedToken = result.logs[0].args._token;
            await openSTUtility.registerBrandedToken(symbol, name, conversionRate, accounts[0], brandedToken, checkBtUuid, { from: registrar });
            checkStakingIntentHash = await openSTUtility.hashStakingIntent(checkBtUuid, accounts[0], 1, accounts[0], amountST, amountUT, 80668, lock.l)
	    })

		it('fails to confirm by non-registrar', async () => {
            await Utils.expectThrow(openSTUtility.confirmStakingIntent(checkBtUuid, accounts[0], 1, accounts[0], amountST, amountUT, 80668, lock.l, checkStakingIntentHash, { from: accounts[0] }));
		})

		it('fails to confirm when token is not registered', async () => {
			await Utils.expectThrow(openSTUtility.confirmStakingIntent("bad UUID", accounts[0], 1, accounts[0], amountST, amountUT, 80668, lock.l, checkStakingIntentHash, { from: registrar }));
		})

		it('fails confirm when stakerNonce is not > previously', async () => {
			await Utils.expectThrow(openSTUtility.confirmStakingIntent(checkBtUuid, accounts[0], 0, accounts[0], amountST, amountUT, 80668, lock.l, checkStakingIntentHash, { from: registrar }));
		})

		it('fails to confirm when amoutST is not > 0', async () => {
			await Utils.expectThrow(openSTUtility.confirmStakingIntent(checkBtUuid, accounts[0], 1, accounts[0], 0, amountUT, 80668, lock.l, checkStakingIntentHash, { from: registrar }));
		})

		it('fails to confirm when amountUT is not > 0', async () => {
			await Utils.expectThrow(openSTUtility.confirmStakingIntent(checkBtUuid, accounts[0], 1, accounts[0], amountST, 0, 80668, lock.l, checkStakingIntentHash, { from: registrar }));
		})

		it('fails to confirm when stakingUnlockHeight is not > 0', async () => {
			await Utils.expectThrow(openSTUtility.confirmStakingIntent(checkBtUuid, accounts[0], 1, accounts[0], amountST, amountUT, 0, lock.l, checkStakingIntentHash, { from: registrar }));
		})

		it('fails to confirm when stakingIntentHash is empty', async () => {
			await Utils.expectThrow(openSTUtility.confirmStakingIntent(checkBtUuid, accounts[0], 1, accounts[0], amountST, amountUT, 80668, lock.l, "", { from: registrar }));
		})

		it('fails to confirm when presented with different lock', async () => {
			const differentLock = HashLock.getHashLock();
			await Utils.expectThrow(openSTUtility.confirmStakingIntent(checkBtUuid, accounts[0], 1, accounts[0], amountST, amountUT, 80668, differentLock.l, "", { from: registrar }));
		})

		it('fails to confirm when stakingIntentHash does not match calculated hash', async () => {
			await Utils.expectThrow(openSTUtility.confirmStakingIntent(checkBtUuid, accounts[0], 1, accounts[0], amountST, amountUT, 80668, lock.l, "bad stakingIntentHash", { from: registrar }));
		})

		it('successfully confirms', async () => {
			expirationHeight = await openSTUtility.confirmStakingIntent.call(checkBtUuid, accounts[0], 1, accounts[0], amountST, amountUT, 80668, lock.l, checkStakingIntentHash, { from: registrar });

			// call block number is one less than send block number
			expirationHeight = expirationHeight.plus(1)
			result = await openSTUtility.confirmStakingIntent(checkBtUuid, accounts[0], 1, accounts[0], amountST, amountUT, 80668, lock.l, checkStakingIntentHash, { from: registrar });
			await OpenSTUtility_utils.checkStakingIntentConfirmedEvent(result.logs[0], checkBtUuid, checkStakingIntentHash, accounts[0], accounts[0], amountST, amountUT, expirationHeight);
		})
	})

	describe('ProcessMinting', async () => {

		const lock = HashLock.getHashLock();

		context('when expirationHeight is > block number', async () => {
			before(async () => {
		        contracts   = await OpenSTUtility_utils.deployOpenSTUtility(artifacts, accounts);
		        openSTUtility = contracts.openSTUtility;
	        	checkBtUuid = await openSTUtility.hashUuid.call(symbol, name, chainIdValue, chainIdUtility, openSTUtility.address, conversionRate);
	            result = await openSTUtility.proposeBrandedToken(symbol, name, conversionRate);
	            brandedToken = result.logs[0].args._token;
	            await openSTUtility.registerBrandedToken(symbol, name, conversionRate, accounts[0], brandedToken, checkBtUuid, { from: registrar });
	            checkStakingIntentHash = await openSTUtility.hashStakingIntent(checkBtUuid, accounts[0], 1, accounts[0], amountST, amountUT, 80668, lock.l);
	            result = await openSTUtility.confirmStakingIntent(checkBtUuid, accounts[0], 1, accounts[0], amountST, amountUT, 80668, lock.l, checkStakingIntentHash, { from: registrar });
		    })

			it('fails to process if stakingIntentHash is empty', async () => {
	            await Utils.expectThrow(openSTUtility.processMinting("", lock.s));
			})

			it('fails to process if hash of unlockSecret does not match hashlock', async () => {
				const differentLock = HashLock.getHashLock();
	            await Utils.expectThrow(openSTUtility.processMinting(checkStakingIntentHash, differentLock.s, { from: accounts[1] }));
			})

			it('successfully mints', async () => {
				assert.equal(await openSTUtility.processMinting.call(checkStakingIntentHash, lock.s), brandedToken);
				result = await openSTUtility.processMinting(checkStakingIntentHash, lock.s);
				await OpenSTUtility_utils.checkProcessedMintEvent(result.logs[0], checkBtUuid, checkStakingIntentHash, brandedToken, accounts[0], accounts[0], amountUT, lock.s);
			})

			it('fails to re-process a processed mint', async () => {
				await Utils.expectThrow(openSTUtility.processMinting(checkStakingIntentHash, lock.s));
			})
		})		
	})

	describe('Redeem', async () => {

		var brandedTokenContract = null;
		const redeemAmountUT = new BigNumber(web3.toWei(1, "ether"));

		const lock = HashLock.getHashLock();
		const lockR = HashLock.getHashLock();

		before(async () => {
	        contracts   = await OpenSTUtility_utils.deployOpenSTUtility(artifacts, accounts);
	        openSTUtility = contracts.openSTUtility;
        	checkBtUuid = await openSTUtility.hashUuid.call(symbol, name, chainIdValue, chainIdUtility, openSTUtility.address, conversionRate);
            result = await openSTUtility.proposeBrandedToken(symbol, name, conversionRate);
            brandedToken = result.logs[0].args._token;
            await openSTUtility.registerBrandedToken(symbol, name, conversionRate, accounts[0], brandedToken, checkBtUuid, { from: registrar });
            checkStakingIntentHash = await openSTUtility.hashStakingIntent(checkBtUuid, accounts[0], 1, accounts[0], amountST, amountUT, 80668, lock.l)
            await openSTUtility.confirmStakingIntent(checkBtUuid, accounts[0], 1, accounts[0], amountST, amountUT, 80668, lock.l, checkStakingIntentHash, { from: registrar });
            await openSTUtility.processMinting(checkStakingIntentHash, lock.s);
	    
	    	brandedTokenContract = new BrandedToken(brandedToken);
			await brandedTokenContract.claim(accounts[0]);
			await brandedTokenContract.approve(openSTUtility.address, redeemAmountUT, { from: redeemer });
	    })

		it('fails to redeem when uuid is empty', async () => {
            await Utils.expectThrow(openSTUtility.redeem("", redeemAmountUT, 2, lockR.l, { from: redeemer }));
		})

		it('fails to redeem when amount is not > 0', async () => {
            await Utils.expectThrow(openSTUtility.redeem(checkBtUuid, 0, 2, lockR.l, { from: redeemer }));
		})

		it('fails to redeem when nonce is not >= previously', async () => {
            await Utils.expectThrow(openSTUtility.redeem(checkBtUuid, redeemAmountUT, 0, lockR.l, { from: redeemer }));
		})

		it('fails to redeem when uuid is uuidSTPrime', async () => {
			uuidSTPrime = await openSTUtility.uuidSTPrime.call();
            await Utils.expectThrow(openSTUtility.redeem(uuidSTPrime, redeemAmountUT, 2, lockR.l, { from: redeemer }));
		})

		it('fails to redeem if not approved to transfer the amount', async () => {
			await brandedTokenContract.approve(openSTUtility.address, 0, { from: redeemer });
            await Utils.expectThrow(openSTUtility.redeem(checkBtUuid, redeemAmountUT, 2, lockR.l, { from: redeemer }));
			await brandedTokenContract.approve(openSTUtility.address, redeemAmountUT, { from: redeemer });
		})

		it('successfully redeems', async () => {
			var redeemReturns = await openSTUtility.redeem.call(checkBtUuid, redeemAmountUT, 2, lockR.l, { from: redeemer });

            // call block number is one less than send block number
            unlockHeight = redeemReturns[0].plus(1);
            var checkRedemptionIntentHash = await openSTUtility.hashRedemptionIntent.call(checkBtUuid, accounts[0], 2, redeemAmountUT, unlockHeight, lockR.l);
            result = await openSTUtility.redeem(checkBtUuid, redeemAmountUT, 2, lockR.l, { from: redeemer });

            await OpenSTUtility_utils.checkRedemptionIntentDeclaredEvent(result.logs[0], checkBtUuid, checkRedemptionIntentHash, brandedToken,
			redeemer, 2, redeemAmountUT, unlockHeight, chainIdValue);
		})
	})

	describe('RedeemSTPrime', async () => {

		const redeemSTP = new BigNumber(2);
		const lock = HashLock.getHashLock();
		const lockR = HashLock.getHashLock();

		before(async () => {
	        contracts  		 		= await OpenSTUtility_utils.deployOpenSTUtility(artifacts, accounts);
	        stPrime     			= contracts.stPrime;
	        openSTUtility 			= contracts.openSTUtility;
	        uuidSTPrime 			= await openSTUtility.uuidSTPrime.call();
			checkStakingIntentHash 	= await openSTUtility.hashStakingIntent(uuidSTPrime, accounts[0], 1, accounts[0], amountST, amountUT, 80668, lock.l);

			await openSTUtility.confirmStakingIntent(uuidSTPrime, accounts[0], 1, accounts[0], amountST, amountUT, 80668, lock.l, checkStakingIntentHash, { from: registrar });
			await openSTUtility.processMinting(checkStakingIntentHash, lock.s);
			await stPrime.claim(accounts[0]);
	    })

		it('fails to redeem when msg.value is not > 0', async () => {
            await Utils.expectThrow(openSTUtility.redeemSTPrime(redeemSTP.toNumber(), lockR.l, { from: redeemer, value: 0 }));
		})

		it('fails to redeem when nonce is not >= previously', async () => {
            await Utils.expectThrow(openSTUtility.redeemSTPrime(0, lockR.l, { from: redeemer, value: 2 }));
		})

		it('successfully redeems', async () => {
			var redeemReturns = await openSTUtility.redeemSTPrime.call(redeemSTP.toNumber(), lockR.l, { from: redeemer, value: 2 });

			// call block number is one less than send block number
			unlockHeight = redeemReturns[1].plus(1)
			var checkRedemptionIntentHash = await openSTUtility.hashRedemptionIntent.call(uuidSTPrime, redeemer, 2, redeemSTP, unlockHeight, lockR.l);
			result = await openSTUtility.redeemSTPrime(redeemSTP, lockR.l, { from: redeemer, value: redeemSTP });

			await OpenSTUtility_utils.checkRedemptionIntentDeclaredEvent(result.logs[0], uuidSTPrime, checkRedemptionIntentHash, stPrime.address,
				redeemer, 2, redeemSTP.toNumber(), unlockHeight, chainIdValue);
		})
	})

	describe('ProcessRedeeming', async () => {
		var redemptionIntentHash = null;
		var brandedToken = null;
		var brandedTokenContract = null;

		const lock = HashLock.getHashLock();
		const lockR = HashLock.getHashLock();

		context('BrandedToken', async () => {
			var redemptionAmount = 3;

			before(async () => {
		        contracts   = await OpenSTUtility_utils.deployOpenSTUtility(artifacts, accounts);
		        openSTUtility = contracts.openSTUtility;
	        	checkBtUuid = await openSTUtility.hashUuid.call(symbol, name, chainIdValue, chainIdUtility, openSTUtility.address, conversionRate);
	            result = await openSTUtility.proposeBrandedToken(symbol, name, conversionRate);
	            brandedToken = result.logs[0].args._token;
	            await openSTUtility.registerBrandedToken(symbol, name, conversionRate, accounts[0], brandedToken, checkBtUuid, { from: registrar });
	            checkStakingIntentHash = await openSTUtility.hashStakingIntent(checkBtUuid, accounts[0], 1, accounts[0], amountST, amountUT, 80668, lock.l)
	            await openSTUtility.confirmStakingIntent(checkBtUuid, accounts[0], 1, accounts[0], amountST, amountUT, 80668, lock.l, checkStakingIntentHash, { from: registrar });
	            await openSTUtility.processMinting(checkStakingIntentHash, lock.s);
				brandedTokenContract = new BrandedToken(brandedToken);
				await brandedTokenContract.claim(accounts[0]);
				await brandedTokenContract.approve(openSTUtility.address, redemptionAmount, { from: redeemer });
	            result = await openSTUtility.redeem(checkBtUuid, redemptionAmount, 2, lockR.l, { from: redeemer });
	            redemptionIntentHash = result.logs[0].args._redemptionIntentHash;
		    })

			it('fails to process if redemptionIntentHash is empty', async () => {
	            await Utils.expectThrow(openSTUtility.processRedeeming("", lockR.s, { from: notRedeemer }));
			})

			it('fails to process if hash of unlockSecret does not match hashlock', async () => {
	            await Utils.expectThrow(openSTUtility.processRedeeming(redemptionIntentHash, "incorrect unlock secret", { from: notRedeemer }));
			})

			it('successfully processes', async () => {
				var openSTUtilityBal = await brandedTokenContract.balanceOf.call(openSTUtility.address);
				var totalSupply = await brandedTokenContract.totalSupply.call();
				assert.equal(await openSTUtility.processRedeeming.call(redemptionIntentHash, lockR.s, { from: notRedeemer }), brandedToken);
				result = await openSTUtility.processRedeeming(redemptionIntentHash, lockR.s, { from: notRedeemer });

				var postProcessOpenSTUtilityBal = await brandedTokenContract.balanceOf.call(openSTUtility.address);
				var postProcessTotalSupply = await brandedTokenContract.totalSupply.call();
				assert.equal(postProcessOpenSTUtilityBal.toNumber(), openSTUtilityBal.minus(redemptionAmount).toNumber());
				assert.equal(postProcessTotalSupply.toNumber(), totalSupply.minus(redemptionAmount).toNumber());
	            await OpenSTUtility_utils.checkProcessedRedemptionEvent(result.logs[0], checkBtUuid, redemptionIntentHash, brandedToken, redeemer, redemptionAmount, lockR.s);
			})

			it('fails to reprocess', async () => {
	            await Utils.expectThrow(openSTUtility.processRedeeming(redemptionIntentHash, lockR.s, { from: notRedeemer }));
			})
		})

		context('STPrime', async () => {
			var redemptionAmount = 2;

			before(async () => {
				contracts  		 		= await OpenSTUtility_utils.deployOpenSTUtility(artifacts, accounts);
				stPrime     			= contracts.stPrime;
				openSTUtility           = contracts.openSTUtility;
				uuidSTPrime 			= await openSTUtility.uuidSTPrime.call();
				checkStakingIntentHash 	= await openSTUtility.hashStakingIntent(uuidSTPrime, accounts[0], 1, accounts[0], amountST, amountUT, 80668, lock.l);

				await openSTUtility.confirmStakingIntent(uuidSTPrime, accounts[0], 1, accounts[0], amountST, amountUT, 80668, lock.l, checkStakingIntentHash, { from: registrar });
				await openSTUtility.processMinting(checkStakingIntentHash, lock.s);
				await stPrime.claim(accounts[0]);
				result = await openSTUtility.redeemSTPrime(redemptionAmount, lockR.l, { from: redeemer, value: redemptionAmount });
				redemptionIntentHash = result.logs[0].args._redemptionIntentHash;
		    })

			it('successfully processes', async () => {
				var stPrimeBal = await web3.eth.getBalance(stPrime.address);
				var totalSupply = await stPrime.totalSupply.call();
				assert.equal(await openSTUtility.processRedeeming.call(redemptionIntentHash, lockR.s, { from: notRedeemer }), stPrime.address);
				result = await openSTUtility.processRedeeming(redemptionIntentHash, lockR.s, { from: notRedeemer });

				var postProcessStPrimeBal = await web3.eth.getBalance(stPrime.address);
				var postProcessTotalSupply = await stPrime.totalSupply.call();
				assert.equal(postProcessStPrimeBal.toNumber(), stPrimeBal.minus(redemptionAmount).toNumber());
				assert.equal(postProcessTotalSupply.toNumber(), totalSupply.minus(redemptionAmount).toNumber());
	            await OpenSTUtility_utils.checkProcessedRedemptionEvent(result.logs[0], uuidSTPrime, redemptionIntentHash, stPrime.address, redeemer, redemptionAmount, lockR.s);
			})
		})
	})

	describe('ProcessRedeeming with fallback', async () => {
		var redemptionIntentHash = null;
		var brandedToken = null;
		var brandedTokenContract = null;

		const lock = HashLock.getHashLock();
		const lockR = HashLock.getHashLock();

		context('BrandedToken', async () => {
			var redemptionAmount = 3;

			before(async () => {
		        contracts   = await OpenSTUtility_utils.deployOpenSTUtility(artifacts, accounts);
		        openSTUtility = contracts.openSTUtility;
	        	checkBtUuid = await openSTUtility.hashUuid.call(symbol, name, chainIdValue, chainIdUtility, openSTUtility.address, conversionRate);
	            result = await openSTUtility.proposeBrandedToken(symbol, name, conversionRate);
	            brandedToken = result.logs[0].args._token;
	            await openSTUtility.registerBrandedToken(symbol, name, conversionRate, accounts[0], brandedToken, checkBtUuid, { from: registrar });
				checkStakingIntentHash = await openSTUtility.hashStakingIntent(checkBtUuid, accounts[0], 1, accounts[0], amountST, amountUT, 80668, lock.l)
	            await openSTUtility.confirmStakingIntent(checkBtUuid, accounts[0], 1, accounts[0], amountST, amountUT, 80668, lock.l, checkStakingIntentHash, { from: registrar });
	            await openSTUtility.processMinting(checkStakingIntentHash, lock.s);
				brandedTokenContract = new BrandedToken(brandedToken);
				await brandedTokenContract.claim(accounts[0]);
				await brandedTokenContract.approve(openSTUtility.address, redemptionAmount, { from: redeemer });
	            result = await openSTUtility.redeem(checkBtUuid, redemptionAmount, 2, lockR.l, { from: redeemer });
	            redemptionIntentHash = result.logs[0].args._redemptionIntentHash;
		    })

			it('successfully processes by registrar', async () => {
				var openSTUtilityBal = await brandedTokenContract.balanceOf.call(openSTUtility.address);
				var totalSupply = await brandedTokenContract.totalSupply.call();
				assert.equal(await openSTUtility.processRedeeming.call(redemptionIntentHash, lockR.s, { from: notRedeemer }), brandedToken);
				// redemption is processed by Registrar
				result = await openSTUtility.processRedeeming(redemptionIntentHash, lockR.s, { from: registrar });

				var postProcessOpenSTUtilityBal = await brandedTokenContract.balanceOf.call(openSTUtility.address);
				var postProcessTotalSupply = await brandedTokenContract.totalSupply.call();
				assert.equal(postProcessOpenSTUtilityBal.toNumber(), openSTUtilityBal.minus(redemptionAmount).toNumber());
				assert.equal(postProcessTotalSupply.toNumber(), totalSupply.minus(redemptionAmount).toNumber());
	            await OpenSTUtility_utils.checkProcessedRedemptionEvent(result.logs[0], checkBtUuid, redemptionIntentHash, brandedToken, redeemer, redemptionAmount, lockR.s);
			})
		})

		context('STPrime', async () => {
			var redemptionAmount = 2;

			before(async () => {
		        contracts  		 		= await OpenSTUtility_utils.deployOpenSTUtility(artifacts, accounts);
		        stPrime     			= contracts.stPrime;
		        openSTUtility 			= contracts.openSTUtility;

		        uuidSTPrime 			= await openSTUtility.uuidSTPrime.call();
	            checkStakingIntentHash 	= await openSTUtility.hashStakingIntent(uuidSTPrime, accounts[0], 1, accounts[0], amountST, amountUT, 80668, lock.l)

	            await openSTUtility.confirmStakingIntent(uuidSTPrime, accounts[0], 1, accounts[0], amountST, amountUT, 80668, lock.l, checkStakingIntentHash, { from: registrar });
	            await openSTUtility.processMinting(checkStakingIntentHash, lock.s);
				await stPrime.claim(accounts[0]);
	            result = await openSTUtility.redeemSTPrime(redemptionAmount, lockR.l, { from: redeemer, value: redemptionAmount });
	            redemptionIntentHash = result.logs[0].args._redemptionIntentHash;
		    })

			it('successfully processes by registrar', async () => {
				var stPrimeBal = await web3.eth.getBalance(stPrime.address);
				var totalSupply = await stPrime.totalSupply.call();
				assert.equal(await openSTUtility.processRedeeming.call(redemptionIntentHash, lockR.s, { from: notRedeemer }), stPrime.address);
				// redemption is processed by Registrar
				result = await openSTUtility.processRedeeming(redemptionIntentHash, lockR.s, { from: registrar });

				var postProcessStPrimeBal = await web3.eth.getBalance(stPrime.address);
				var postProcessTotalSupply = await stPrime.totalSupply.call();
				assert.equal(postProcessStPrimeBal.toNumber(), stPrimeBal.minus(redemptionAmount).toNumber());
				assert.equal(postProcessTotalSupply.toNumber(), totalSupply.minus(redemptionAmount).toNumber());
	            await OpenSTUtility_utils.checkProcessedRedemptionEvent(result.logs[0], uuidSTPrime, redemptionIntentHash, stPrime.address, redeemer, redemptionAmount, lockR.s);
			})
		})
	});

	// Unit test cases for revert redemption
	describe('revert redemption', async () => {

		const lock = HashLock.getHashLock();
		const lockR = HashLock.getHashLock();

		context('revert redemption', async () => {

			var stakeAmountST =  new BigNumber(web3.toWei(1, "ether")),
				convertedAmountBT = (stakeAmountST*conversionRate),
				redemptionAmountBT =  new BigNumber(web3.toWei(2, "ether")), // How many Branded tokens to redeem
				redeemerForRevert = accounts[0] // requester and redeemer is same here
				escrowUnlockHeight = 0;

			before(async () => {
				contracts = await OpenSTUtility_utils.deployOpenSTUtility(artifacts, accounts);
				// Use OpenSTUtility Contract to expire redeem soon
				OpenSTUtility = contracts.openSTUtility;
				checkBtUuid = await OpenSTUtility.hashUuid.call(symbol, name, chainIdValue, chainIdUtility, OpenSTUtility.address, conversionRate);
				result = await OpenSTUtility.proposeBrandedToken(symbol, name, conversionRate);
				brandedToken = result.logs[0].args._token;
				await OpenSTUtility.registerBrandedToken(symbol, name, conversionRate, redeemerForRevert, brandedToken, checkBtUuid, { from: registrar });

				escrowUnlockHeight = await OpenSTUtility.blocksToWaitLong.call();
				// 1 more than BLOCKS_TO_WAIT_LONG in OpenSTUtility contract so that redeem expires
				escrowUnlockHeight = escrowUnlockHeight.toNumber() + 1;
				checkStakingIntentHash = await OpenSTUtility.hashStakingIntent(checkBtUuid, redeemerForRevert, 1, redeemerForRevert, stakeAmountST, convertedAmountBT, escrowUnlockHeight, lock.l);
				await OpenSTUtility.confirmStakingIntent(checkBtUuid, redeemerForRevert, 1, redeemerForRevert, stakeAmountST, convertedAmountBT, escrowUnlockHeight, lock.l, checkStakingIntentHash, { from: registrar });
				await OpenSTUtility.processMinting(checkStakingIntentHash, lock.s);
				brandedTokenContract = new BrandedToken(brandedToken);
				await brandedTokenContract.claim(redeemerForRevert);
				// redeemerForRevert is approved with 5 BT
				await brandedTokenContract.approve(OpenSTUtility.address, redemptionAmountBT, { from: redeemerForRevert });
				// After calling Redeem is left with 3 BT since redemptionAmountBT is 2 (5-2)
				result = await OpenSTUtility.redeem(checkBtUuid, redemptionAmountBT, 2, lockR.l, { from: redeemerForRevert });
				redemptionIntentHash = result.logs[0].args._redemptionIntentHash;
			});

			// Mock transactions so that block number increases
			it('waits till redeem is expired', async () => {

				var amountToTransfer = new BigNumber(web3.toWei(0.000001, "ether"));

				for (var i = 0; i < escrowUnlockHeight; i++) {
					await web3.eth.sendTransaction({ from: accounts[2], to: accounts[1], value: amountToTransfer, gasPrice: '0x12A05F200' });
				}

			});

			it('fails to revert redemption when redemptionIntentHash is empty', async () => {

				await Utils.expectThrow(OpenSTUtility.revertRedemption("", { from: redeemerForRevert }));

			});

			it('fails to revert redemption when redemptionIntentHash is any random string', async () => {

				await Utils.expectThrow(OpenSTUtility.revertRedemption("hshhsgdg7alffwwsda", { from: redeemerForRevert }));

			});

			it('Verify balance of redeemer just before reverting redemption', async () => {

				 var balanceOfRedeemer = await brandedTokenContract.balanceOf(redeemerForRevert);
	  		 await assert.equal(balanceOfRedeemer.toNumber(), (convertedAmountBT-redemptionAmountBT));

			});

			it('successfully reverts redemption', async () => {

				var revertRedemptionResult = await OpenSTUtility.revertRedemption(redemptionIntentHash, { from: redeemerForRevert });
				OpenSTUtility_utils.checkRevertedRedemption(revertRedemptionResult.logs[0], checkBtUuid, redemptionIntentHash,
						redeemerForRevert, redemptionAmountBT);

			});

			it('Verify balance of redeemer just after reverting redemption', async () => {

				var balanceOfRedeemer = await brandedTokenContract.balanceOf(redeemerForRevert);
				await assert.equal(balanceOfRedeemer.toNumber(), convertedAmountBT);

			});

			it('fails to processRedeeming after revert redemption', async () => {

				await Utils.expectThrow(openSTUtility.processRedeeming(redemptionIntentHash, lockR.l, { from: redeemerForRevert }));

			});

		});

	});

	// Unit test case for revertMinting
	describe('revert minting', async () => {
		var redemptionIntentHash = null;
		var brandedToken = null;
		var stakingIntentHash = null;
		const AMOUNT_ST = new BigNumber(web3.toWei(10, "ether"));
		const AMOUNT_BT = new BigNumber(AMOUNT_ST*conversionRate);

		const lock = HashLock.getHashLock();

		context('BrandedToken', async () => {

			before(async () => {
				contracts   = await OpenSTUtility_utils.deployOpenSTUtility(artifacts, accounts);
				openSTUtility = contracts.openSTUtility;
				checkBtUuid = await openSTUtility.hashUuid.call(symbol, name, chainIdValue, chainIdUtility, openSTUtility.address, conversionRate);
				result = await openSTUtility.proposeBrandedToken(symbol, name, conversionRate);
				brandedToken = result.logs[0].args._token;
				await openSTUtility.registerBrandedToken(symbol, name, conversionRate, accounts[0], brandedToken, checkBtUuid, { from: registrar });
				stakingIntentHash = await openSTUtility.hashStakingIntent(checkBtUuid, accounts[0], 1, accounts[0],
					AMOUNT_ST, AMOUNT_BT, 80668, lock.l);
				result = await openSTUtility.confirmStakingIntent(checkBtUuid, accounts[0], 1, accounts[0], AMOUNT_ST,
					AMOUNT_BT, 80668, lock.l, stakingIntentHash, { from: registrar });
			});

			it('fails if stakingIntentHash is empty', async() => {
				await Utils.expectThrow(openSTUtility.revertMinting("", { from: accounts[2] }));
			});

			// Before wait time as passed
			it('fails to complete by proposedProtocol before waiting period ends', async () => {
				// Wait time less 1 block for preceding test case and 1 block because condition is <=
				var waitBlock = await openSTUtility.blocksToWaitShort.call();
				for (var i = 0; i < waitBlock - 2; i++) {
					await Utils.expectThrow(openSTUtility.revertMinting(stakingIntentHash, { from: accounts[2], gasPrice: '0x12A05F200' }));
				}
			})

			it('successfully revert Minting', async () => {
				var result = await openSTUtility.revertMinting(stakingIntentHash, { from: accounts[2] , gasPrice: '0x12A05F200'});
				await OpenSTUtility_utils.checkRevertedMintEvent(result.logs[0], checkBtUuid, stakingIntentHash, accounts[0],
					accounts[0], AMOUNT_BT);
			})
		})
	});
});
