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
// Test: SimpleStake_utils.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const Assert = require('assert');

var MockToken = artifacts.require("./MockToken.sol");
var SimpleStake = artifacts.require("./SimpleStake.sol");

/// @dev Deploy 
module.exports.deploySimpleStake = async (artifacts, accounts) => {
	/// mock unique identifier for utility token
	const UUID = "0xbce8a3809c9356cf0e5178a2aef207f50df7d32b388c8fceb8e363df00efce31";
	/// mock OpenST protocol contract address with an external account
	const openSTProtocol = accounts[4];

	const token = await MockToken.new({ from: accounts[0] });

	const simpleStake = await SimpleStake.new(token.address, openSTProtocol, UUID, { from: accounts[0] });

	return {
		token       : token,
		simpleStake : simpleStake
	};
};

/// @dev Check staked balance
module.exports.checkTotalStaked = async (stake, token, amount) => {
	Assert.equal((await stake.getTotalStake.call()).toNumber(), amount.toNumber());
	Assert.equal((await token.balanceOf.call(stake.address)).toNumber(), amount.toNumber());
};

/*
 *  Event checks
 */

/// @dev Check stake release events
module.exports.checkReleasedEventGroup = (result, _protocol, _to, _amount) => {
	if (Number.isInteger(_amount)) {
	   _amount = new BigNumber(_amount);
	};
   	// TODO: [ben] parse result.receipt.logs for EIP20.Transfer event too
	Assert.equal(result.logs.length, 1);

	const releaseEvent = result.logs[0];
	Assert.equal(releaseEvent.event, "ReleasedStake");
	Assert.equal(releaseEvent.args._protocol, _protocol);
	Assert.equal(releaseEvent.args._to, _to);
	Assert.equal(releaseEvent.args._amount.toNumber(), _amount.toNumber());
};

module.exports.checkTransferEvent = (event, _from, _to, _value) => {
   if (Number.isInteger(_value)) {
      _value = new BigNumber(_value);
   }
   Assert.equal(event.event, "Transfer");
   Assert.equal(event.args._from, _from);
   Assert.equal(event.args._to, _to);
   Assert.equal(event.args._value.toNumber(), _value.toNumber());
}