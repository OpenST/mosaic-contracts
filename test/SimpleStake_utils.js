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
// test/SimpleStake_utils.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const Assert = require('assert');

var SimpleToken = artifacts.require("./SimpleToken/SimpleToken.sol");
var SimpleStake = artifacts.require("./SimpleStake.sol");

/// @dev Deploy 
module.exports.deploySingleSimpleStake = async (artifacts, accounts, protocol, UUID) => {

	const token = await SimpleToken.new({ from: accounts[0], gas: 3500000 });
	// Set Simple Token admin to account[1]
	await token.setAdminAddress(accounts[1]);
	// and finalize Simple Token
	Assert.ok(await token.finalize({ from: accounts[1] }));

	const simpleStake = await SimpleStake.new(token.address, protocol, UUID, { from: accounts[0] });

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


module.exports.checkTransferEvent = (event, _from, _to, _value) => {
   if (Number.isInteger(_value)) {
      _value = new BigNumber(_value);
   }
   Assert.equal(event.event, "Transfer");
   Assert.equal(event.args._from, _from);
   Assert.equal(event.args._to, _to);
   Assert.equal(event.args._value.toNumber(), _value.toNumber());
}