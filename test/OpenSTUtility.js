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
const OpenSTUtility_utils = require('./OpenSTUtility_utils.js');
const BrandedToken = artifacts.require("./BrandedToken.sol");

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
///			fails if stakingIntentHash is empty
///			fails if msg.sender != staker
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
/// 		fails to process if msg.sender is not redeemer or registrar
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
	const BLOCKS_TO_WAIT_SHORT	= 240;

    const hashName 	 			= "hashName";
    const hashSymbol 			= "hashSymbol";
    const requester  			= "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    const token 	 			= "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
    const redeemer 				= accounts[0];

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
		before(async () => {
	        contracts   = await OpenSTUtility_utils.deployOpenSTUtility(artifacts, accounts);
	        openSTUtility = contracts.openSTUtility;
        	checkBtUuid = await openSTUtility.hashUuid.call(symbol, name, chainIdValue, chainIdUtility, openSTUtility.address, conversionRate);
            result = await openSTUtility.proposeBrandedToken(symbol, name, conversionRate);
            brandedToken = result.logs[0].args._token;
            await openSTUtility.registerBrandedToken(symbol, name, conversionRate, accounts[0], brandedToken, checkBtUuid, { from: registrar });
            checkStakingIntentHash = await openSTUtility.hashStakingIntent(checkBtUuid, accounts[0], 1, accounts[0], 1, 5, 80668)
	    })

		it('fails to confirm by non-registrar', async () => {
            await Utils.expectThrow(openSTUtility.confirmStakingIntent(checkBtUuid, accounts[0], 1, accounts[0], 1, 5, 80668, checkStakingIntentHash, { from: accounts[0] }));
		})

		it('fails to confirm when token is not registered', async () => {
			await Utils.expectThrow(openSTUtility.confirmStakingIntent("bad UUID", accounts[0], 1, accounts[0], 1, 5, 80668, checkStakingIntentHash, { from: registrar }));
		})

		it('fails confirm when stakerNonce is not > previously', async () => {
			await Utils.expectThrow(openSTUtility.confirmStakingIntent(checkBtUuid, accounts[0], 0, accounts[0], 1, 5, 80668, checkStakingIntentHash, { from: registrar }));
		})

		it('fails to confirm when amoutST is not > 0', async () => {
			await Utils.expectThrow(openSTUtility.confirmStakingIntent(checkBtUuid, accounts[0], 1, accounts[0], 0, 5, 80668, checkStakingIntentHash, { from: registrar }));
		})

		it('fails to confirm when amoutUT is not > 0', async () => {
			await Utils.expectThrow(openSTUtility.confirmStakingIntent(checkBtUuid, accounts[0], 1, accounts[0], 1, 0, 80668, checkStakingIntentHash, { from: registrar }));
		})

		it('fails to confirm when stakingUnlockHeight is not > 0', async () => {
			await Utils.expectThrow(openSTUtility.confirmStakingIntent(checkBtUuid, accounts[0], 1, accounts[0], 1, 5, 0, checkStakingIntentHash, { from: registrar }));
		})

		it('fails to confirm when stakingIntentHash is empty', async () => {
			await Utils.expectThrow(openSTUtility.confirmStakingIntent(checkBtUuid, accounts[0], 1, accounts[0], 1, 5, 80668, "", { from: registrar }));
		})

		it('fails to confirm when stakingIntentHash does not match calculated hash', async () => {
			await Utils.expectThrow(openSTUtility.confirmStakingIntent(checkBtUuid, accounts[0], 1, accounts[0], 1, 5, 80668, "bad stakingIntentHash", { from: registrar }));
		})

		it('successfully confirms', async () => {
			expirationHeight = await openSTUtility.confirmStakingIntent.call(checkBtUuid, accounts[0], 1, accounts[0], 1, 5, 80668, checkStakingIntentHash, { from: registrar });

			// call block number is one less than send block number
			expirationHeight = expirationHeight.plus(1)
            result = await openSTUtility.confirmStakingIntent(checkBtUuid, accounts[0], 1, accounts[0], 1, 5, 80668, checkStakingIntentHash, { from: registrar });
            await OpenSTUtility_utils.checkStakingIntentConfirmedEvent(result.logs[0], checkBtUuid, checkStakingIntentHash, accounts[0], accounts[0], 1, 5, expirationHeight);
		})
	})

	describe('ProcessMinting', async () => {
		context('when expirationHeight is > block number', async () => {
			before(async () => {
		        contracts   = await OpenSTUtility_utils.deployOpenSTUtility(artifacts, accounts);
		        openSTUtility = contracts.openSTUtility;
	        	checkBtUuid = await openSTUtility.hashUuid.call(symbol, name, chainIdValue, chainIdUtility, openSTUtility.address, conversionRate);
	            result = await openSTUtility.proposeBrandedToken(symbol, name, conversionRate);
	            brandedToken = result.logs[0].args._token;
	            await openSTUtility.registerBrandedToken(symbol, name, conversionRate, accounts[0], brandedToken, checkBtUuid, { from: registrar });
	            checkStakingIntentHash = await openSTUtility.hashStakingIntent(checkBtUuid, accounts[0], 1, accounts[0], 1, 5, 80668)
	            result = await openSTUtility.confirmStakingIntent(checkBtUuid, accounts[0], 1, accounts[0], 1, 5, 80668, checkStakingIntentHash, { from: registrar });
		    })

			it('fails if stakingIntentHash is empty', async () => {
	            await Utils.expectThrow(openSTUtility.processMinting(""));
			})

			it('fails if msg.sender != staker', async () => {
	            await Utils.expectThrow(openSTUtility.processMinting(checkStakingIntentHash, { from: accounts[1] }));
			})

			it('successfully mints', async () => {
				assert.equal(await openSTUtility.processMinting.call(checkStakingIntentHash), brandedToken);
				result = await openSTUtility.processMinting(checkStakingIntentHash);
				await OpenSTUtility_utils.checkProcessedMintEvent(result.logs[0], checkBtUuid, checkStakingIntentHash, brandedToken, accounts[0], accounts[0], 5);
			})

			it('fails to re-process a processed mint', async () => {
				await Utils.expectThrow(openSTUtility.processMinting(checkStakingIntentHash));
			})
		})		
	})

	describe('Redeem', async () => {

		var brandedTokenContract = null;

		before(async () => {
	        contracts   = await OpenSTUtility_utils.deployOpenSTUtility(artifacts, accounts);
	        openSTUtility = contracts.openSTUtility;
        	checkBtUuid = await openSTUtility.hashUuid.call(symbol, name, chainIdValue, chainIdUtility, openSTUtility.address, conversionRate);
            result = await openSTUtility.proposeBrandedToken(symbol, name, conversionRate);
            brandedToken = result.logs[0].args._token;
            await openSTUtility.registerBrandedToken(symbol, name, conversionRate, accounts[0], brandedToken, checkBtUuid, { from: registrar });
            checkStakingIntentHash = await openSTUtility.hashStakingIntent(checkBtUuid, accounts[0], 1, accounts[0], 1, 5, 80668)
            await openSTUtility.confirmStakingIntent(checkBtUuid, accounts[0], 1, accounts[0], 1, 5, 80668, checkStakingIntentHash, { from: registrar });
            await openSTUtility.processMinting(checkStakingIntentHash);
	    
	    	brandedTokenContract = new BrandedToken(brandedToken);
			await brandedTokenContract.claim(accounts[0]);
			await brandedTokenContract.approve(openSTUtility.address, 3, { from: redeemer });
	    })

		it('fails to redeem when uuid is empty', async () => {
            await Utils.expectThrow(openSTUtility.redeem("", 3, 2, { from: redeemer }));
		})

		it('fails to redeem when amount is not > 0', async () => {
            await Utils.expectThrow(openSTUtility.redeem(checkBtUuid, 0, 2, { from: redeemer }));
		})

		it('fails to redeem when nonce is not >= previously', async () => {
            await Utils.expectThrow(openSTUtility.redeem(checkBtUuid, 3, 0, { from: redeemer }));
		})

		it('fails to redeem when uuid is uuidSTPrime', async () => {
			uuidSTPrime = await openSTUtility.uuidSTPrime.call();
            await Utils.expectThrow(openSTUtility.redeem(uuidSTPrime, 3, 2, { from: redeemer }));
		})

		it('fails to redeem if not approved to transfer the amount', async () => {
			await brandedTokenContract.approve(openSTUtility.address, 0, { from: redeemer });
            await Utils.expectThrow(openSTUtility.redeem(checkBtUuid, 3, 2, { from: redeemer }));
			await brandedTokenContract.approve(openSTUtility.address, 3, { from: redeemer });
		})

		it('successfully redeems', async () => {
			var redeemReturns = await openSTUtility.redeem.call(checkBtUuid, 3, 2, { from: redeemer });

            // call block number is one less than send block number
            unlockHeight = redeemReturns[0].plus(1)
            var checkRedemptionIntentHash = await openSTUtility.hashRedemptionIntent.call(checkBtUuid, accounts[0], 2, 3, unlockHeight);
            result = await openSTUtility.redeem(checkBtUuid, 3, 2, { from: redeemer });

            await OpenSTUtility_utils.checkRedemptionIntentDeclaredEvent(result.logs[0], checkBtUuid, checkRedemptionIntentHash, brandedToken,
			redeemer, 2, 3, unlockHeight, chainIdValue);
		})
	})

	describe('RedeemSTPrime', async () => {
		before(async () => {
	        contracts  		 		= await OpenSTUtility_utils.deployOpenSTUtility(artifacts, accounts);
	        stPrime     			= contracts.stPrime;
	        openSTUtility 			= contracts.openSTUtility;

	        uuidSTPrime 			= await openSTUtility.uuidSTPrime.call();
            checkStakingIntentHash 	= await openSTUtility.hashStakingIntent(uuidSTPrime, accounts[0], 1, accounts[0], 5, 5, 80668)

            await openSTUtility.confirmStakingIntent(uuidSTPrime, accounts[0], 1, accounts[0], 5, 5, 80668, checkStakingIntentHash, { from: registrar });
            await openSTUtility.processMinting(checkStakingIntentHash);
			await stPrime.claim(accounts[0]);
	    })

		it('fails to redeem when msg.value is not > 0', async () => {
            await Utils.expectThrow(openSTUtility.redeemSTPrime(2, { from: redeemer, value: 0 }));
		})

		it('fails to redeem when nonce is not >= previously', async () => {
            await Utils.expectThrow(openSTUtility.redeemSTPrime(0, { from: redeemer, value: 2 }));
		})

		it('successfully redeems', async () => {
            var redeemReturns = await openSTUtility.redeemSTPrime.call(2, { from: redeemer, value: 2 });

            // call block number is one less than send block number
            unlockHeight = redeemReturns[1].plus(1)
            var checkRedemptionIntentHash = await openSTUtility.hashRedemptionIntent.call(uuidSTPrime, redeemer, 2, 2, unlockHeight);
            result = await openSTUtility.redeemSTPrime(2, { from: redeemer, value: 2 });

            await OpenSTUtility_utils.checkRedemptionIntentDeclaredEvent(result.logs[0], uuidSTPrime, checkRedemptionIntentHash, stPrime.address,
			redeemer, 2, 2, unlockHeight, chainIdValue);
		})
	})

	describe('ProcessRedeeming', async () => {
		var redemptionIntentHash = null;
		var brandedToken = null;
		var brandedTokenContract = null;

		context('BrandedToken', async () => {
			var redemptionAmount = 3;

			before(async () => {
		        contracts   = await OpenSTUtility_utils.deployOpenSTUtility(artifacts, accounts);
		        openSTUtility = contracts.openSTUtility;
	        	checkBtUuid = await openSTUtility.hashUuid.call(symbol, name, chainIdValue, chainIdUtility, openSTUtility.address, conversionRate);
	            result = await openSTUtility.proposeBrandedToken(symbol, name, conversionRate);
	            brandedToken = result.logs[0].args._token;
	            await openSTUtility.registerBrandedToken(symbol, name, conversionRate, accounts[0], brandedToken, checkBtUuid, { from: registrar });
	            checkStakingIntentHash = await openSTUtility.hashStakingIntent(checkBtUuid, accounts[0], 1, accounts[0], 1, 5, 80668)
	            await openSTUtility.confirmStakingIntent(checkBtUuid, accounts[0], 1, accounts[0], 1, 5, 80668, checkStakingIntentHash, { from: registrar });
	            await openSTUtility.processMinting(checkStakingIntentHash);
				brandedTokenContract = new BrandedToken(brandedToken);
				await brandedTokenContract.claim(accounts[0]);
				await brandedTokenContract.approve(openSTUtility.address, redemptionAmount, { from: redeemer });
	            result = await openSTUtility.redeem(checkBtUuid, redemptionAmount, 2, { from: redeemer });
	            redemptionIntentHash = result.logs[0].args._redemptionIntentHash;
		    })

			it('fails to process if redemptionIntentHash is empty', async () => {
	            await Utils.expectThrow(openSTUtility.processRedeeming("", { from: redeemer }));
			})

			it('fails to process if msg.sender is not redeemer or registrar', async () => {
	            await Utils.expectThrow(openSTUtility.processRedeeming(redemptionIntentHash, { from: accounts[5] }));
			})

			it('successfully processes', async () => {
				var openSTUtilityBal = await brandedTokenContract.balanceOf.call(openSTUtility.address);
				var totalSupply = await brandedTokenContract.totalSupply.call();
				assert.equal(await openSTUtility.processRedeeming.call(redemptionIntentHash, { from: redeemer }), brandedToken);
				result = await openSTUtility.processRedeeming(redemptionIntentHash, { from: redeemer });

				var postProcessOpenSTUtilityBal = await brandedTokenContract.balanceOf.call(openSTUtility.address);
				var postProcessTotalSupply = await brandedTokenContract.totalSupply.call();
				assert.equal(postProcessOpenSTUtilityBal.toNumber(), openSTUtilityBal.minus(redemptionAmount).toNumber());
				assert.equal(postProcessTotalSupply.toNumber(), totalSupply.minus(redemptionAmount).toNumber());
	            await OpenSTUtility_utils.checkProcessedRedemptionEvent(result.logs[0], checkBtUuid, redemptionIntentHash, brandedToken, redeemer, redemptionAmount);
			})

			it('fails to reprocess', async () => {
	            await Utils.expectThrow(openSTUtility.processRedeeming(redemptionIntentHash, { from: redeemer }));
			})
		})

		context('STPrime', async () => {
			var redemptionAmount = 2;

			before(async () => {
		        contracts  		 		= await OpenSTUtility_utils.deployOpenSTUtility(artifacts, accounts);
		        stPrime     			= contracts.stPrime;
		        openSTUtility 			= contracts.openSTUtility;

		        uuidSTPrime 			= await openSTUtility.uuidSTPrime.call();
	            checkStakingIntentHash 	= await openSTUtility.hashStakingIntent(uuidSTPrime, accounts[0], 1, accounts[0], 5, 5, 80668)

	            await openSTUtility.confirmStakingIntent(uuidSTPrime, accounts[0], 1, accounts[0], 5, 5, 80668, checkStakingIntentHash, { from: registrar });
	            await openSTUtility.processMinting(checkStakingIntentHash);
				await stPrime.claim(accounts[0]);
	            result = await openSTUtility.redeemSTPrime(redemptionAmount, { from: redeemer, value: redemptionAmount });
	            redemptionIntentHash = result.logs[0].args._redemptionIntentHash;
		    })

			it('successfully processes', async () => {
				var stPrimeBal = await web3.eth.getBalance(stPrime.address);
				var totalSupply = await stPrime.totalSupply.call();
				assert.equal(await openSTUtility.processRedeeming.call(redemptionIntentHash, { from: redeemer }), stPrime.address);
				result = await openSTUtility.processRedeeming(redemptionIntentHash, { from: redeemer });

				var postProcessStPrimeBal = await web3.eth.getBalance(stPrime.address);
				var postProcessTotalSupply = await stPrime.totalSupply.call();
				assert.equal(postProcessStPrimeBal.toNumber(), stPrimeBal.minus(redemptionAmount).toNumber());
				assert.equal(postProcessTotalSupply.toNumber(), totalSupply.minus(redemptionAmount).toNumber());
	            await OpenSTUtility_utils.checkProcessedRedemptionEvent(result.logs[0], uuidSTPrime, redemptionIntentHash, stPrime.address, redeemer, redemptionAmount);
			})
		})
	})

	describe('ProcessRedeeming with fallback', async () => {
		var redemptionIntentHash = null;
		var brandedToken = null;
		var brandedTokenContract = null;

		context('BrandedToken', async () => {
			var redemptionAmount = 3;

			before(async () => {
		        contracts   = await OpenSTUtility_utils.deployOpenSTUtility(artifacts, accounts);
		        openSTUtility = contracts.openSTUtility;
	        	checkBtUuid = await openSTUtility.hashUuid.call(symbol, name, chainIdValue, chainIdUtility, openSTUtility.address, conversionRate);
	            result = await openSTUtility.proposeBrandedToken(symbol, name, conversionRate);
	            brandedToken = result.logs[0].args._token;
	            await openSTUtility.registerBrandedToken(symbol, name, conversionRate, accounts[0], brandedToken, checkBtUuid, { from: registrar });
	            checkStakingIntentHash = await openSTUtility.hashStakingIntent(checkBtUuid, accounts[0], 1, accounts[0], 1, 5, 80668)
	            await openSTUtility.confirmStakingIntent(checkBtUuid, accounts[0], 1, accounts[0], 1, 5, 80668, checkStakingIntentHash, { from: registrar });
	            await openSTUtility.processMinting(checkStakingIntentHash);
				brandedTokenContract = new BrandedToken(brandedToken);
				await brandedTokenContract.claim(accounts[0]);
				await brandedTokenContract.approve(openSTUtility.address, redemptionAmount, { from: redeemer });
	            result = await openSTUtility.redeem(checkBtUuid, redemptionAmount, 2, { from: redeemer });
	            redemptionIntentHash = result.logs[0].args._redemptionIntentHash;
		    })

			it('successfully processes by registrar', async () => {
				var openSTUtilityBal = await brandedTokenContract.balanceOf.call(openSTUtility.address);
				var totalSupply = await brandedTokenContract.totalSupply.call();
				assert.equal(await openSTUtility.processRedeeming.call(redemptionIntentHash, { from: redeemer }), brandedToken);
				// redemption is processed by Registrar
				result = await openSTUtility.processRedeeming(redemptionIntentHash, { from: registrar });

				var postProcessOpenSTUtilityBal = await brandedTokenContract.balanceOf.call(openSTUtility.address);
				var postProcessTotalSupply = await brandedTokenContract.totalSupply.call();
				assert.equal(postProcessOpenSTUtilityBal.toNumber(), openSTUtilityBal.minus(redemptionAmount).toNumber());
				assert.equal(postProcessTotalSupply.toNumber(), totalSupply.minus(redemptionAmount).toNumber());
	            await OpenSTUtility_utils.checkProcessedRedemptionEvent(result.logs[0], checkBtUuid, redemptionIntentHash, brandedToken, redeemer, redemptionAmount);
			})
		})

		context('STPrime', async () => {
			var redemptionAmount = 2;

			before(async () => {
		        contracts  		 		= await OpenSTUtility_utils.deployOpenSTUtility(artifacts, accounts);
		        stPrime     			= contracts.stPrime;
		        openSTUtility 			= contracts.openSTUtility;

		        uuidSTPrime 			= await openSTUtility.uuidSTPrime.call();
	            checkStakingIntentHash 	= await openSTUtility.hashStakingIntent(uuidSTPrime, accounts[0], 1, accounts[0], 5, 5, 80668)

	            await openSTUtility.confirmStakingIntent(uuidSTPrime, accounts[0], 1, accounts[0], 5, 5, 80668, checkStakingIntentHash, { from: registrar });
	            await openSTUtility.processMinting(checkStakingIntentHash);
				await stPrime.claim(accounts[0]);
	            result = await openSTUtility.redeemSTPrime(redemptionAmount, { from: redeemer, value: redemptionAmount });
	            redemptionIntentHash = result.logs[0].args._redemptionIntentHash;
		    })

			it('successfully processes by registrar', async () => {
				var stPrimeBal = await web3.eth.getBalance(stPrime.address);
				var totalSupply = await stPrime.totalSupply.call();
				assert.equal(await openSTUtility.processRedeeming.call(redemptionIntentHash, { from: redeemer }), stPrime.address);
				// redemption is processed by Registrar
				result = await openSTUtility.processRedeeming(redemptionIntentHash, { from: registrar });

				var postProcessStPrimeBal = await web3.eth.getBalance(stPrime.address);
				var postProcessTotalSupply = await stPrime.totalSupply.call();
				assert.equal(postProcessStPrimeBal.toNumber(), stPrimeBal.minus(redemptionAmount).toNumber());
				assert.equal(postProcessTotalSupply.toNumber(), totalSupply.minus(redemptionAmount).toNumber());
	            await OpenSTUtility_utils.checkProcessedRedemptionEvent(result.logs[0], uuidSTPrime, redemptionIntentHash, stPrime.address, redeemer, redemptionAmount);
			})
		})
	})

})
