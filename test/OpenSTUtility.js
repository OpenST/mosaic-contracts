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
const STPrime = artifacts.require("./STPrime.sol");

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
/// 	when unlockHeight is > block number
///			fails if stakingIntentHash is empty
///			fails if msg.sender != staker
///			successfully mints
/// 		fails to re-process a processed mint
///		when unlockHeight is < block number // TBD: how or where to test this practically
///
///	Redeem
/// 	fails to redeem when uuid is empty
/// 	fails to redeem when amount is not > 0
/// 	fails to redeem when nonce is not > previously
/// 	fails to redeem when uuid is uuidSTPrime
/// 	fails to redeem if not approved to transfer the amount
/// 	successfully redeems
///
///	RedeemSTPrime
///		fails to redeem when msg.value is not > 0
/// 	fails to redeem when nonce is not > previously
/// 	successfully redeems
///
/// AddNameReservation
///		fails to add by non-adminOrOps
///		successfully adds
///		fails to add if exists with a different requester
///
/// SetSymbolRoute
///		fails to set by non-adminOrOps
///		successfully sets
///		fails to set if exists with a different token
///
/// RemoveNameReservation
/// 	fails to remove by non-adminOrOps
/// 	successfully removes
/// 	fails to remove if it does not exist
///
/// RemoveSymbolRoute
/// 	fails to remove by non-adminOrOps
/// 	successfully removes
/// 	fails to remove if it does not exist
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
            // Event cannot be tested because the address of token is not known
            // OpenSTUtility_utils.checkRequestedBrandedTokenEvent(result.logs[0], accounts[0], token, btUuid, symbol, name, conversionRate);
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
		context('when unlockHeight is > block number', async () => {
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
	    })

		it('fails to redeem when uuid is empty', async () => {
            await Utils.expectThrow(openSTUtility.redeem("", 3, 2, { from: accounts[0] }));
		})

		it('fails to redeem when amount is not > 0', async () => {
            await Utils.expectThrow(openSTUtility.redeem(checkBtUuid, 0, 2, { from: accounts[0] }));
		})

		it('fails to redeem when nonce is not > previously', async () => {
            await Utils.expectThrow(openSTUtility.redeem(checkBtUuid, 3, 1, { from: accounts[0] }));
		})

		it('fails to redeem when uuid is uuidSTPrime', async () => {
			uuidSTPrime = await openSTUtility.uuidSTPrime.call();
            await Utils.expectThrow(openSTUtility.redeem(uuidSTPrime, 3, 2, { from: accounts[0] }));
		})

		it('fails to redeem if not approved to transfer the amount', async () => {
            await Utils.expectThrow(openSTUtility.redeem(checkBtUuid, 3, 2, { from: accounts[0] }));
		})

		it('successfully redeems', async () => {
			var brandedTokenContract = new BrandedToken(brandedToken);
			await brandedTokenContract.claim(accounts[0]);
			await brandedTokenContract.approve(openSTUtility.address, 3, { from: accounts[0] });
            var redeemReturns = await openSTUtility.redeem.call(checkBtUuid, 3, 2, { from: accounts[0] });

            // call block number is one less than send block number
            unlockHeight = redeemReturns[0].plus(1)
            var checkRedemptionIntentHash = await openSTUtility.hashRedemptionIntent.call(checkBtUuid, accounts[0], 2, 3, unlockHeight);
            result = await openSTUtility.redeem(checkBtUuid, 3, 2, { from: accounts[0] });

            await OpenSTUtility_utils.checkRedemptionIntentDeclaredEvent(result.logs[0], checkBtUuid, checkRedemptionIntentHash, brandedToken,
			accounts[0], 2, 3, unlockHeight, chainIdValue);
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
            await Utils.expectThrow(openSTUtility.redeemSTPrime(2, { from: accounts[0], value: 0 }));
		})

		it('fails to redeem when nonce is not > previously', async () => {
            await Utils.expectThrow(openSTUtility.redeemSTPrime(1, { from: accounts[0], value: 2 }));
		})

		it('successfully redeems', async () => {
            var redeemReturns = await openSTUtility.redeemSTPrime.call(2, { from: accounts[0], value: 2 });

            // call block number is one less than send block number
            unlockHeight = redeemReturns[1].plus(1)
            var checkRedemptionIntentHash = await openSTUtility.hashRedemptionIntent.call(uuidSTPrime, accounts[0], 2, 2, unlockHeight);
            result = await openSTUtility.redeemSTPrime(2, { from: accounts[0], value: 2 });

            await OpenSTUtility_utils.checkRedemptionIntentDeclaredEvent(result.logs[0], uuidSTPrime, checkRedemptionIntentHash, stPrime.address,
			accounts[0], 2, 2, unlockHeight, chainIdValue);
		})
	})

/*
	describe('AddNameReservation', async () => {
		before(async () => {
	        contracts   = await OpenSTUtility_utils.deployOpenSTUtility(artifacts, accounts);
	        openSTUtility = contracts.openSTUtility;
	        await openSTUtility.setAdminAddress(accounts[2]);
	    })

		it('fails to add by non-adminOrOps', async () => {
            await Utils.expectThrow(openSTUtility.addNameReservation(hashName, requester));
		})

		it('successfully adds', async () => {
			assert.equal(await openSTUtility.nameReservation.call(hashName), 0);
            assert.equal(await openSTUtility.addNameReservation.call(hashName, requester, { from: accounts[2] }), true);
            await openSTUtility.addNameReservation(hashName, requester, { from: accounts[2] });

			assert.equal(await openSTUtility.nameReservation.call(hashName), requester);
		})

		it('fails to add if exists with a different requester', async () => {
            await openSTUtility.addNameReservation.call(hashName, accounts[0], { from: accounts[2] });

			assert.notEqual(await openSTUtility.nameReservation.call(hashName), accounts[0]);
			assert.equal(await openSTUtility.nameReservation.call(hashName), requester);
		})
	})

	describe('SetSymbolRoute', async () => {
		before(async () => {
	        contracts   = await OpenSTUtility_utils.deployOpenSTUtility(artifacts, accounts);
	        openSTUtility = contracts.openSTUtility;
	        await openSTUtility.setAdminAddress(accounts[2]);
	    })

		it('fails to set by non-adminOrOps', async () => {
            await Utils.expectThrow(openSTUtility.setSymbolRoute(hashSymbol, token));
		})

		it('successfully sets', async () => {
			assert.equal(await openSTUtility.symbolRoute.call(hashSymbol), 0);
            assert.equal(await openSTUtility.setSymbolRoute.call(hashSymbol, token, { from: accounts[2] }), true);
            await openSTUtility.setSymbolRoute(hashSymbol, token, { from: accounts[2] });

			assert.equal(await openSTUtility.symbolRoute.call(hashSymbol), token);
		})

		it('fails to set if exists with a different token', async () => {
            await openSTUtility.setSymbolRoute.call(hashSymbol, accounts[0], { from: accounts[2] });

			assert.notEqual(await openSTUtility.symbolRoute.call(hashSymbol), accounts[0]);
			assert.equal(await openSTUtility.symbolRoute.call(hashSymbol), token);
		})
	})

	describe('RemoveNameReservation', async () => {
		before(async () => {
	        contracts   = await OpenSTUtility_utils.deployOpenSTUtility(artifacts, accounts);
	        openSTUtility = contracts.openSTUtility;
	        await openSTUtility.setAdminAddress(accounts[2]);
            await openSTUtility.addNameReservation(hashName, requester, { from: accounts[2] });
	    })

		it('fails to remove by non-adminOrOps', async () => {
            await Utils.expectThrow(openSTUtility.removeNameReservation(hashName));
		})

		it('successfully removes', async () => {
			assert.equal(await openSTUtility.nameReservation.call(hashName), requester);
            assert.equal(await openSTUtility.removeNameReservation.call(hashName, { from: accounts[2] }), true);
            await openSTUtility.removeNameReservation(hashName, { from: accounts[2] })

			assert.equal(await openSTUtility.nameReservation.call(hashName), 0);
		})

		it('fails to remove if it does not exist', async () => {
            await Utils.expectThrow(openSTUtility.removeNameReservation(hashName, { from: accounts[2] }));
		})
	})

	describe('removeSymbolRoute', async () => {
		before(async () => {
	        contracts   = await OpenSTUtility_utils.deployOpenSTUtility(artifacts, accounts);
	        openSTUtility = contracts.openSTUtility;
	        await openSTUtility.setAdminAddress(accounts[2]);
            await openSTUtility.setSymbolRoute(hashSymbol, token, { from: accounts[2] });
	    })

		it('fails to remove by non-adminOrOps', async () => {
            await Utils.expectThrow(openSTUtility.removeSymbolRoute(hashSymbol));
		})

		it('successfully removes', async () => {
			assert.equal(await openSTUtility.symbolRoute.call(hashSymbol), token);
            assert.equal(await openSTUtility.removeSymbolRoute.call(hashSymbol, { from: accounts[2] }), true);
            await openSTUtility.removeSymbolRoute(hashSymbol, { from: accounts[2] })

			assert.equal(await openSTUtility.symbolRoute.call(hashSymbol), 0);
		})

		it('fails to remove if it does not exist', async () => {
            await Utils.expectThrow(openSTUtility.removeSymbolRoute(hashSymbol, { from: accounts[2] }));
		})
	})
*/
})
