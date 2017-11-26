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

	// Set SimpleToken admin to in order to finalize SimpleToken
	await valueToken.setAdminAddress(accounts[1]);
	// SimpleToken must be finalized to permit certain transfers
	assert.ok(await valueToken.finalize({ from: accounts[1] }));

	const openSTValue = await OpenSTValue.new(chainIdValue, valueToken.address, registrar);

	return {
		valueToken  : valueToken,
		openSTValue : openSTValue
	}
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

module.exports.checkStakingIntentDeclaredEvent = (event, _uuid, _staker, _stakerNonce, _beneficiary, _amountST, _amountUT, _escrowUnlockHeight, _stakingIntentHash) => {
	if (Number.isInteger(_stakerNonce)) {
		_stakerNonce = new BigNumber(_stakerNonce);
	}

	if (Number.isInteger(_amountST)) {
		_amountST = new BigNumber(_amountST);
	}

	if (Number.isInteger(_amountUT)) {
		_amountUT = new BigNumber(_amountUT);
	}

	if (Number.isInteger(_escrowUnlockHeight)) {
		_escrowUnlockHeight = new BigNumber(_escrowUnlockHeight);
	}

	assert.equal(event.event, "StakingIntentDeclared");
	assert.equal(event.args._uuid, _uuid);
	assert.equal(event.args._staker, _staker);
	assert.equal(event.args._stakerNonce.toNumber(), _stakerNonce.toNumber());
	assert.equal(event.args._beneficiary, _beneficiary);
	assert.equal(event.args._amountST.toNumber(), _amountST.toNumber());
	assert.equal(event.args._amountUT.toNumber(), _amountUT.toNumber());

	// The block.number received from stake.call(...) is one less than from stake(...)
	assert.equal(event.args._escrowUnlockHeight.toNumber(), _escrowUnlockHeight.plus(1).toNumber());
	// Because the block numbers are different, the hashes are different
	// assert.equal(event.args._stakingIntentHash, _stakingIntentHash);
}
