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
// Test: UtilityTokenAbstract_utils.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const web3 = require('../lib/web3.js');

const BN = require('bn.js');
var Hasher = artifacts.require("./Hasher.sol");
var UtilityTokenAbstract = artifacts.require("./UtilityTokenAbstractMock.sol");

/// @dev Deploy 
module.exports.deployUtilityTokenAbstract = async (artifacts, accounts) => {
	const hasher 				= await Hasher.new();
	/// mock OpenST protocol contract address with an external account
	const openSTProtocol 		= accounts[4];
	const conversionRateDecimals = 5;
	const conversionRate 		= new BN(10*(10**conversionRateDecimals)); // conversaion rate => 10
	const genesisChainIdValue 	= 3;
	const genesisChainIdUtility = 1410;
	const UUID 					= await hasher.hashUuid.call("symbol", "name", genesisChainIdValue, genesisChainIdUtility, openSTProtocol, conversionRate, conversionRateDecimals);
	const utilityTokenAbstract 	= await UtilityTokenAbstract.new(UUID, "symbol", "name", genesisChainIdValue, genesisChainIdUtility, conversionRate, conversionRateDecimals, { from: openSTProtocol });

	return {
		hasher : hasher,
		utilityTokenAbstract : utilityTokenAbstract
	};
};

/*
 *  Event checks
 */

/// @dev Check Minted event
module.exports.checkMintedEvent = (event, _uuid, _beneficiary, _amount, _unclaimed, _totalSupply) => {
	if (Number.isInteger(_amount)) {
	   _amount = new BN(_amount);
	};

	if (Number.isInteger(_unclaimed)) {
	   _unclaimed = new BN(_unclaimed);
	};

	if (Number.isInteger(_totalSupply)) {
	   _totalSupply = new BN(_totalSupply);
	};

	assert.equal(event.event, "Minted");
	assert.equal(event.args._uuid, _uuid);
	assert.equal(event.args._beneficiary, web3.utils.toChecksumAddress(_beneficiary));
	assert(event.args._amount.eq(_amount));
	assert(event.args._unclaimed.eq(_unclaimed));
	assert(event.args._totalSupply.eq(_totalSupply));	
};

/// @dev Check Burnt event
module.exports.checkBurntEvent = (event, _uuid, _account, _amount, _totalSupply) => {
	if (Number.isInteger(_amount)) {
	   _amount = new BN(_amount);
	};

	if (Number.isInteger(_totalSupply)) {
	   _totalSupply = new BN(_totalSupply);
	};

	assert.equal(event.event, "Burnt");
	assert.equal(event.args._uuid, _uuid);
	assert.equal(event.args._account, web3.utils.toChecksumAddress(_account));
	assert(event.args._amount.eq(_amount));
	assert(event.args._totalSupply.eq(_totalSupply));	
};
