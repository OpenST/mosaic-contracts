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
const Core = artifacts.require("./Core.sol");

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
///		fails to propose if a match exists // Fails
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
///		when unlockHeight is < block number
///			fails if unlockHeight is < block number
///


contract('OpenSTUtility', function(accounts) {
	const chainIdValue   = 3;
	const chainIdUtility = 1410;
	const registrar      = accounts[1];

	const symbol = "MCC";
	const name = "Member Company Coin";
	const conversionRate = 5;
	const BLOCKS_TO_WAIT_SHORT = 240;

	var result = null;
	var checkBtUuid = null;
	var brandedToken = null;
	var checkStakingIntentHash = null;
	var unlockHeight = null;

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

		// Fails
		it('fails to propose if a match exists', async () => {
            await Utils.expectThrow(openSTUtility.proposeBrandedToken(symbol, name, conversionRate, { from: accounts[1] }));
            await Utils.expectThrow(openSTUtility.proposeBrandedToken(symbol, name, conversionRate, { from: accounts[0] }));
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
			var unlockHeight = await openSTUtility.confirmStakingIntent.call(checkBtUuid, accounts[0], 1, accounts[0], 1, 5, 80668, checkStakingIntentHash, { from: registrar });
            result = await openSTUtility.confirmStakingIntent(checkBtUuid, accounts[0], 1, accounts[0], 1, 5, 80668, checkStakingIntentHash, { from: registrar });
            await OpenSTUtility_utils.checkStakingIntentConfirmedEvent(result.logs[0], checkBtUuid, checkStakingIntentHash, accounts[0], accounts[0], 1, 5, unlockHeight);
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
				// var unlockHeight = await openSTUtility.confirmStakingIntent.call(checkBtUuid, accounts[0], 1, accounts[0], 1, 5, 80668, checkStakingIntentHash, { from: registrar });
				// unlockHeight = unlockHeight.plus(1);
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
				await OpenSTUtility_utils.checkProcessedMintEvent(result.logs[0], checkBtUuid, checkStakingIntentHash, accounts[0], accounts[0], 5);
			})

			it('fails to re-process a processed mint', async () => {
				await Utils.expectThrow(openSTUtility.processMinting(checkStakingIntentHash));
			})
		})

		context('when unlockHeight is < block number', async () => {
			before(async () => {
		        contracts   = await OpenSTUtility_utils.deployOpenSTUtility(artifacts, accounts);
		        openSTUtility = contracts.openSTUtility;
	        	checkBtUuid = await openSTUtility.hashUuid.call(symbol, name, chainIdValue, chainIdUtility, openSTUtility.address, conversionRate);
	            result = await openSTUtility.proposeBrandedToken(symbol, name, conversionRate);
	            brandedToken = result.logs[0].args._token;
	            await openSTUtility.registerBrandedToken(symbol, name, conversionRate, accounts[0], brandedToken, checkBtUuid, { from: registrar });
	            checkStakingIntentHash = await openSTUtility.hashStakingIntent(checkBtUuid, accounts[0], 1, accounts[0], 1, 5, 80668)
				unlockHeight = await openSTUtility.confirmStakingIntent.call(checkBtUuid, accounts[0], 1, accounts[0], 1, 5, 80668, checkStakingIntentHash, { from: registrar });
				unlockHeight = unlockHeight.plus(1);
				console.log("KSJKSKJSKJHSFKHJSDFKJH")
				console.log(unlockHeight);
	            result = await openSTUtility.confirmStakingIntent(checkBtUuid, accounts[0], 1, accounts[0], 1, 5, 80668, checkStakingIntentHash, { from: registrar });
		    })

			it('fails if unlockHeight is > block number', async () => {
				console.log("::", (BLOCKS_TO_WAIT_SHORT - 1), "TRANSFERS TO TEST UNLOCKHEIGHT ::");
				for (var i = 0; i < (BLOCKS_TO_WAIT_SHORT - 1); i++) { await web3.eth.sendTransaction({ from: accounts[9], to: accounts[0], value: 1 });}

				await Utils.expectThrow(openSTUtility.processMinting(checkStakingIntentHash));
			})
		})		
	})
})
