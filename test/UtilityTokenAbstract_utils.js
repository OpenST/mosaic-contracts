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

var UtilityTokenAbstract = artifacts.require("./UtilityTokenAbstractMock.sol");

/// @dev Deploy 
module.exports.deployUtilityTokenAbstract = async (artifacts, accounts) => {
	/// mock unique identifier for utility token
	const UUID = "0xbce8a3809c9356cf0e5178a2aef207f50df7d32b388c8fceb8e363df00efce31";
	/// mock OpenST protocol contract address with an external account
	const openSTProtocol = accounts[4];

	const utilityTokenAbstract = await UtilityTokenAbstract.new(openSTProtocol, UUID, { from: accounts[0] });

	return {
		utilityTokenAbstract : utilityTokenAbstract
	};
};

/*
 *  Event checks
 */

/// @dev Check Minted event
module.exports.checkMintedEvent = (event, _uuid, _beneficiary, _amount, _unclaimed, _totalSupply) => {
	if (Number.isInteger(_amount)) {
	   _amount = new BigNumber(_amount);
	};

	if (Number.isInteger(_unclaimed)) {
	   _unclaimed = new BigNumber(_unclaimed);
	};

	if (Number.isInteger(_totalSupply)) {
	   _totalSupply = new BigNumber(_totalSupply);
	};

	assert.equal(event.event, "Minted");
	assert.equal(event.args._uuid, _uuid);
	assert.equal(event.args._beneficiary, _beneficiary);
	assert.equal(event.args._amount.toNumber(), _amount.toNumber());
	assert.equal(event.args._unclaimed.toNumber(), _unclaimed.toNumber());
	assert.equal(event.args._totalSupply.toNumber(), _totalSupply.toNumber());	
};

/// @dev Check Burnt event
module.exports.checkBurntEvent = (event, _uuid, _account, _amount, _totalSupply) => {
	if (Number.isInteger(_amount)) {
	   _amount = new BigNumber(_amount);
	};

	if (Number.isInteger(_totalSupply)) {
	   _totalSupply = new BigNumber(_totalSupply);
	};

	assert.equal(event.event, "Burnt");
	assert.equal(event.args._uuid, _uuid);
	assert.equal(event.args._account, _account);
	assert.equal(event.args._amount.toNumber(), _amount.toNumber());
	assert.equal(event.args._totalSupply.toNumber(), _totalSupply.toNumber());	
};
