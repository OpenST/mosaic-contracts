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
// Test: OpenSTUtility_utils.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const BigNumber = require('bignumber.js');

var OpenSTUtility = artifacts.require("./OpenSTUtility.sol");
var STPrime = artifacts.require("./STPrimePayable.sol");

/// @dev Deploy 
module.exports.deployOpenSTUtility = async (artifacts, accounts) => {
	const chainIdValue   = 3;
	const chainIdUtility = 1410;
	const registrar      = accounts[1];

	const openSTUtility = await OpenSTUtility.new(chainIdValue, chainIdUtility, registrar, { gas: 6500000});

	// Changed OpenSTUtility locally to deploy STPrime separately in order to move forward with testing
	// These changes have not been pushed to the remote repository
	const uuidSTPrime = await openSTUtility.uuidSTPrime.call();
	const stPrime = await STPrime.new(openSTUtility.address, uuidSTPrime, { from: accounts[0], gas: 3500000 });
	await openSTUtility.deploySTPrime(stPrime.address);

	return {
		openSTUtility : openSTUtility
	}
}

module.exports.checkRequestedBrandedTokenEvent = (event, _requester, _token, _uuid, _symbol, _name, _conversionRate) => {
	if (Number.isInteger(_conversionRate)) {
		_conversionRate = new BigNumber(_conversionRate);
	}

	assert.equal(event.event, "RequestedBrandedToken");
	assert.equal(event.args._requester, _requester);
	assert.equal(event.args._token, _token);
	assert.equal(event.args._uuid, _uuid);
	assert.equal(event.args._symbol, _symbol);
	assert.equal(event.args._name, _name);
	assert.equal(event.args._conversionRate.toNumber(), _conversionRate.toNumber());
}

module.exports.checkRegisteredBrandedTokenEvent = (event, _registrar, _token, _uuid, _symbol, _name, _conversionRate, _requester) => {
	assert.equal(event.event, "RegisteredBrandedToken");
	if (Number.isInteger(_conversionRate)) {
		_conversionRate = new BigNumber(_conversionRate);
	}

	assert.equal(event.args._registrar, _registrar);
	assert.equal(event.args._token, _token);
	assert.equal(event.args._uuid, _uuid);
	assert.equal(event.args._symbol, _symbol);
	assert.equal(event.args._name, _name);
	assert.equal(event.args._conversionRate.toNumber(), _conversionRate.toNumber());
	assert.equal(event.args._requester, _requester);
}

module.exports.checkStakingIntentConfirmedEvent = (event, _uuid, _stakingIntentHash, _staker, _beneficiary, _amountST, _amountUT, unlockHeight) => {
	if (Number.isInteger(_amountST)) {
		_amountST = new BigNumber(_amountST);
	}

	if (Number.isInteger(_amountUT)) {
		_amountUT = new BigNumber(_amountUT);
	}

	if (Number.isInteger(_unlockHeight)) {
		_unlockHeight = new BigNumber(_unlockHeight);
	}

	assert.equal(event.event, "StakingIntentConfirmed");
	assert.equal(event.args._uuid, _uuid);
	assert.equal(event.args._stakingIntentHash, _stakingIntentHash);
	assert.equal(event.args._staker, _staker);
	assert.equal(event.args._beneficiary, _beneficiary);
	assert.equal(event.args._amountST.toNumber(), _amountST.toNumber());
	assert.equal(event.args._amountUT.toNumber(), _amountUT.toNumber());
	assert.equal(event.args.unlockHeight.toNumber(), unlockHeight.toNumber());
}

module.exports.checkProcessedMintEvent = (event, _uuid, _stakingIntentHash, _staker, _beneficiary, _amount) => {
	if (Number.isInteger(_amount)) {
		_amount = new BigNumber(_amount);
	}

	assert.equal(event.event, "ProcessedMint");
	assert.equal(event.args._uuid, _uuid);
	assert.equal(event.args._stakingIntentHash, _stakingIntentHash);
	assert.equal(event.args._staker, _staker);
	assert.equal(event.args._beneficiary, _beneficiary);
	assert.equal(event.args._amount.toNumber(), _amount.toNumber());
}


module.exports.checkUtilityTokenRegisteredEvent = (event, _uuid, stake, _symbol, _name, _decimals, _conversionRate, _chainIdUtility, _stakingAccount) => {
	if (Number.isInteger(_decimals)) {
		_decimals = new BigNumber(_decimals);
	}

	if (Number.isInteger(_conversionRate)) {
		_conversionRate = new BigNumber(_conversionRate);
	}

	assert.equal(event.event, "UtilityTokenRegistered");
	assert.equal(event.args._uuid, _uuid);
	assert.equal(event.args.stake, stake);
	assert.equal(event.args._symbol, _symbol);
	assert.equal(event.args._name, _name);
	assert.equal(event.args._decimals.toNumber(), _decimals);
	assert.equal(event.args._conversionRate.toNumber(), _conversionRate);
	assert.equal(event.args._chainIdUtility, _chainIdUtility);
	assert.equal(event.args._stakingAccount, _stakingAccount);
}
