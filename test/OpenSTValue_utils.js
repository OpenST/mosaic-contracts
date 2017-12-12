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
// Test: OpenSTValue_utils.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const BigNumber = require('bignumber.js');

var OpenSTValue = artifacts.require("./OpenSTValue.sol");
var SimpleToken = artifacts.require("./SimpleToken/SimpleToken.sol");

/// @dev Deploy 
module.exports.deployOpenSTValue = async (artifacts, accounts) => {
	const chainIdValue = 3;
	const valueToken   = await SimpleToken.new();
	const registrar    = accounts[1]

	// Set SimpleToken admin in order to finalize SimpleToken
	await valueToken.setAdminAddress(accounts[1]);
	// SimpleToken must be finalized to permit certain transfers
	assert.ok(await valueToken.finalize({ from: accounts[1] }));

	const openSTValue = await OpenSTValue.new(chainIdValue, valueToken.address, registrar);

	return {
		valueToken  : valueToken,
		openSTValue : openSTValue
	}
}

// Stake address is returned by UtilityTokenRegistered but verified elsewhere
module.exports.checkUtilityTokenRegisteredEvent = (event, _uuid, _symbol, _name, _decimals, _conversionRate, _chainIdUtility, _stakingAccount) => {
	if (Number.isInteger(_decimals)) {
		_decimals = new BigNumber(_decimals);
	}

	if (Number.isInteger(_conversionRate)) {
		_conversionRate = new BigNumber(_conversionRate);
	}

	assert.equal(event.event, "UtilityTokenRegistered");
	assert.equal(event.args._uuid, _uuid);
	// TODO: re-evaluate checking
	// assert.equal(event.args.stake, stake);
	assert.equal(event.args._symbol, _symbol);
	assert.equal(event.args._name, _name);
	assert.equal(event.args._decimals.toNumber(), _decimals);
	assert.equal(event.args._conversionRate.toNumber(), _conversionRate);
	assert.equal(event.args._chainIdUtility, _chainIdUtility);
	assert.equal(event.args._stakingAccount, _stakingAccount);
}

module.exports.checkUtilityTokenRegisteredEventOnProtocol = (formattedDecodedEvents, _uuid, _symbol, _name, _decimals, _conversionRate, _chainIdUtility, _stakingAccount) => {

  var event = formattedDecodedEvents['UtilityTokenRegistered'];

  assert.notEqual(event, null);

	if (Number.isInteger(_decimals)) {
    _decimals = new BigNumber(_decimals);
  }

  if (Number.isInteger(_conversionRate)) {
    _conversionRate = new BigNumber(_conversionRate);
  }

  assert.equal(event._uuid, _uuid);
  // assert.equal(event.args.stake, stake);
  assert.equal(event._symbol, _symbol);
  assert.equal(event._name, _name);
  assert.equal(event._decimals, _decimals);
  assert.equal(event._conversionRate, _conversionRate);
  assert.equal(event._chainIdUtility, _chainIdUtility);
  assert.equal(event._stakingAccount, _stakingAccount);
}

module.exports.checkStakingIntentDeclaredEvent = (event, _uuid, _staker, _stakerNonce, _beneficiary, _amountST, _amountUT, _unlockHeight, _stakingIntentHash, _chainIdUtility) => {
	if (Number.isInteger(_stakerNonce)) {
		_stakerNonce = new BigNumber(_stakerNonce);
	}

	if (Number.isInteger(_amountST)) {
		_amountST = new BigNumber(_amountST);
	}

	if (Number.isInteger(_amountUT)) {
		_amountUT = new BigNumber(_amountUT);
	}

	if (Number.isInteger(_unlockHeight)) {
		_unlockHeight = new BigNumber(_unlockHeight);
	}

	assert.equal(event.event, "StakingIntentDeclared");
	assert.equal(event.args._uuid, _uuid);
	assert.equal(event.args._staker, _staker);
	assert.equal(event.args._stakerNonce.toNumber(), _stakerNonce.toNumber());
	assert.equal(event.args._beneficiary, _beneficiary);
	assert.equal(event.args._amountST.toNumber(), _amountST.toNumber());
	assert.equal(event.args._amountUT.toNumber(), _amountUT.toNumber());
	assert.equal(event.args._unlockHeight.toNumber(), _unlockHeight.toNumber());
	assert.equal(event.args._stakingIntentHash, _stakingIntentHash);
	assert.equal(event.args._chainIdUtility, _chainIdUtility);
}

module.exports.checkStakingIntentDeclaredEventProtocol = (event, _uuid, _staker, _stakerNonce, _beneficiary,
	_amountST, _amountUT, _chainIdUtility) => {

	if (Number.isInteger(_stakerNonce)) {
		_stakerNonce = new BigNumber(_stakerNonce);
	}

	if (Number.isInteger(_amountST)) {
		_amountST = new BigNumber(_amountST);
	}

	if (Number.isInteger(_amountUT)) {
		_amountUT = new BigNumber(_amountUT);
	}

	if (Number.isInteger(_chainIdUtility)) {
		_chainIdUtility = new BigNumber(_chainIdUtility);
	}

	assert.equal(event.event, "StakingIntentDeclared");
	assert.equal(event.args._uuid, _uuid);
	assert.equal(event.args._staker, _staker);
	assert.equal(event.args._stakerNonce.toNumber(), _stakerNonce.toNumber());
	assert.equal(event.args._beneficiary, _beneficiary);
	assert.equal(event.args._amountST.toNumber(), _amountST.toNumber());
	assert.equal(event.args._amountUT.toNumber(), _amountUT.toNumber());
	assert.equal(event.args._chainIdUtility.toNumber(), _chainIdUtility.toNumber());
}

module.exports.checkProcessedStakeEvent = (event, _uuid, _stakingIntentHash, _stake, _staker, _amountST, _amountUT) => {
	if (Number.isInteger(_amountST)) {
		_amountST = new BigNumber(_amountST);
	}

	if (Number.isInteger(_amountUT)) {
		_amountUT = new BigNumber(_amountUT);
	}

	assert.equal(event.event, "ProcessedStake");
	assert.equal(event.args._uuid, _uuid);
	assert.equal(event.args._stakingIntentHash, _stakingIntentHash);
	assert.equal(event.args._stake, _stake);
	assert.equal(event.args._staker, _staker);
	assert.equal(event.args._amountST.toNumber(), _amountST.toNumber());
	assert.equal(event.args._amountUT.toNumber(), _amountUT.toNumber());
}

module.exports.checkRedemptionIntentConfirmedEvent = (event, _uuid, _redemptionIntentHash, _redeemer, _amountST, _amountUT, _expirationHeight) => {
	if (Number.isInteger(_amountST)) {
		_amountST = new BigNumber(_amountST);
	}

	if (Number.isInteger(_amountUT)) {
		_amountUT = new BigNumber(_amountUT);
	}

	if (Number.isInteger(_expirationHeight)) {
		_expirationHeight = new BigNumber(_expirationHeight);
	}

	assert.equal(event.event, "RedemptionIntentConfirmed");
	assert.equal(event.args._uuid, _uuid);
	assert.equal(event.args._redemptionIntentHash, _redemptionIntentHash);
	assert.equal(event.args._redeemer, _redeemer);
	assert.equal(event.args._amountST.toNumber(), _amountST.toNumber());
	assert.equal(event.args._amountUT.toNumber(), _amountUT.toNumber());
	assert.equal(event.args._expirationHeight.toNumber(), _expirationHeight.toNumber());
}

module.exports.checkRedemptionIntentConfirmedEventOnProtocol = (formattedDecodedEvents, uuid, _redemptionIntentHash, _redeemer, _amountST, _amountUT) => {
	var event = formattedDecodedEvents['RedemptionIntentConfirmed'];
	assert.notEqual(event, null);

	if (Number.isInteger(_amountST)) {
		_amountST = new BigNumber(_amountST);
	}

	if (Number.isInteger(_amountUT)) {
		_amountUT = new BigNumber(_amountUT);
	}

	var	_unlockHeight = new BigNumber(event._expirationHeight);

	assert.equal(event._uuid, uuid);
	assert.equal(event._redemptionIntentHash, _redemptionIntentHash);
	assert.equal(event._redeemer, _redeemer);
	assert.equal(event._amountST, _amountST.toNumber());
	assert.equal(event._amountUT, _amountUT.toNumber());
	assert.isAbove(_unlockHeight.toNumber(), 0);
}

module.exports.checkProcessedUnstakeEvent = (event, _uuid, _redemptionIntentHash, stake, _redeemer, _amountST) => {
	if (Number.isInteger(_amountST)) {
		_amountST = new BigNumber(_amountST);
	}

	assert.equal(event.event, "ProcessedUnstake");
	assert.equal(event.args._uuid, _uuid);
	assert.equal(event.args._redemptionIntentHash, _redemptionIntentHash);
	assert.equal(event.args.stake, stake);
	assert.equal(event.args._redeemer, _redeemer);
	assert.equal(event.args._amountST.toNumber(), _amountST.toNumber());
}

module.exports.checkRevertStakingEventProtocol = (event, _uuid, _stakingIntentHash, _staker, _amountST, _amountUT) => {

  if (Number.isInteger(_amountUT)) {
    _amountUT = new BigNumber(_amountUT);
  }

  if (Number.isInteger(_amountST)) {
    _amountST = new BigNumber(_amountST);
  }

  assert.equal(event.event, "RevertedStake");
  assert.equal(event._uuid, _uuid);
  assert.equal(event._staker, _staker);
  assert.equal(event.args._stakingIntentHash, _stakingIntentHash);
  assert.equal(event._amountST, _amountST.toNumber());
  assert.equal(event._amountUT, _amountUT.toNumber());
}