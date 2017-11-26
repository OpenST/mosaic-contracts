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
const Hasher = artifacts.require("./Hasher.sol");

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
///		fails to register if already exists // Fails
/// 
/// Stake
///		when the staking account is null
/// 		fails to stake when amount is not > 0
/// 		fails to stake when tx.origin has not approved it to transfer at least the amount
/// 		fails to stake when the SimpleStake address for the given UUID is null
///			fails to stake when the beneficiary is null
///			successfully stakes
///		when the staking account is not null
///			fails to when msg.sender is not the stakingAccount
///			successfully stakes
///

contract('OpenSTValue', function(accounts) {
	const chainIdValue  = "3";
	const chainIdRemote = "1410";
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
	        openSTValue = contracts.openSTValue;
        	core = await Core.new(registrar, chainIdValue, chainIdRemote, openSTRemote);
            await openSTValue.addCore(core.address, { from: registrar });
        	hasher = await Hasher.new();
        	checkUuid = await hasher.hashUuid.call(symbol, name, chainIdValue, chainIdRemote, openSTRemote, conversionRate);
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
            // Event cannot be tested because the address of stake is not known
            // OpenSTValue_utils.checkUtilityTokenRegisteredEvent(result.logs[0], checkUuid, stake, symbol, name, 18, conversionRate, chainIdRemote, 0);
		})

		// Fails
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
	        	hasher = await Hasher.new();
	        	checkUuid = await hasher.hashUuid.call(symbol, name, chainIdValue, chainIdRemote, openSTRemote, conversionRate);
				await openSTValue.registerUtilityToken(symbol, name, conversionRate, chainIdRemote, 0, checkUuid, { from: registrar });        	
	            await Utils.expectThrow(openSTValue.stake(checkUuid, 1, 0, { from: accounts[0] }));
			})

			it('successfully stakes', async () => {
	            var stakeReturns = await openSTValue.stake.call(checkUuid, 1, accounts[0], { from: accounts[0] });
	            var amountUT = stakeReturns[0].toNumber();
	            var nonce = stakeReturns[1].toNumber();
	            var unlockHeight = stakeReturns[2].toNumber()
	            var stakingIntentHash = stakeReturns[3];
	            result = await openSTValue.stake(checkUuid, 1, accounts[0], { from: accounts[0] });

	            await OpenSTValue_utils.checkStakingIntentDeclaredEvent(result.logs[0], checkUuid, accounts[0], nonce, accounts[0], 1, amountUT, unlockHeight, stakingIntentHash);
			})
		})

		context('when the staking account is not null', async () => {
			before(async () => {
		        contracts   = await OpenSTValue_utils.deployOpenSTValue(artifacts, accounts);
		        valueToken  = contracts.valueToken;
		        openSTValue = contracts.openSTValue;
	        	core = await Core.new(registrar, chainIdValue, chainIdRemote, openSTRemote);
	            await openSTValue.addCore(core.address, { from: registrar });
	        	hasher = await Hasher.new();
	        	checkUuid = await hasher.hashUuid.call(symbol, name, chainIdValue, chainIdRemote, openSTRemote, conversionRate);
				await openSTValue.registerUtilityToken(symbol, name, conversionRate, chainIdRemote, accounts[0], checkUuid, { from: registrar });
				await valueToken.approve(openSTValue.address, 1, { from: accounts[0] });        	
		    })

			it('fails to when msg.sender is not the stakingAccount', async () => {
	            await Utils.expectThrow(openSTValue.stake(checkUuid, 1, accounts[0], { from: accounts[1] }));
			})

			it('successfully stakes', async () => {
	            var stakeReturns = await openSTValue.stake.call(checkUuid, 1, accounts[0], { from: accounts[0] });
	            var amountUT = stakeReturns[0].toNumber();
	            var nonce = stakeReturns[1].toNumber();
	            var unlockHeight = stakeReturns[2].toNumber()
	            var stakingIntentHash = stakeReturns[3];
	            result = await openSTValue.stake(checkUuid, 1, accounts[0], { from: accounts[0] });

	            await OpenSTValue_utils.checkStakingIntentDeclaredEvent(result.logs[0], checkUuid, accounts[0], nonce, accounts[0], 1, amountUT, unlockHeight, stakingIntentHash);
			})
		})
	})
})
