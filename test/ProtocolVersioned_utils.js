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
// test/ProtocolVersioned_utils.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

var ProtocolVersioned = artifacts.require("./ProtocolVersioned.sol");

/// @dev Deploy 
module.exports.deployProtocolVersioned = async (artifacts, accounts) => {
	const protocolVersioned = await ProtocolVersioned.new(accounts[1], { from: accounts[0], gas: 3500000 });

	return {
		protocolVersioned : protocolVersioned
	};
};

// /// @dev Check staked balance
// module.exports.checkTotalStaked = async (stake, token, amount) => {
// 	Assert.equal((await stake.getTotalStake.call()).toNumber(), amount.toNumber());
// 	Assert.equal((await token.balanceOf.call(stake.address)).toNumber(), amount.toNumber());
// };

// /*
//  *  Event checks
//  */

// /// @dev Check stake release events
// module.exports.checkReleasedEventGroup = (result, _protocol, _to, _amount) => {
// 	if (Number.isInteger(_amount)) {
// 	   _amount = new BigNumber(_amount);
// 	};
//    	// TODO: [ben] parse result.receipt.logs for EIP20.Transfer event too
// 	Assert.equal(result.logs.length, 1);

// 	const releaseEvent = result.logs[0];
// 	Assert.equal(releaseEvent.event, "ReleasedStake");
// 	Assert.equal(releaseEvent.args._protocol, _protocol);
// 	Assert.equal(releaseEvent.args._to, _to);
// 	Assert.equal(releaseEvent.args._amount.toNumber(), _amount.toNumber());
// };

module.exports.checkProtocolTransferInitiatedEvent = (event, _existingProtocol, _proposedProtocol, _activationHeight) => {
   if (Number.isInteger(_activationHeight)) {
      _activationHeight = new BigNumber(_activationHeight);
   }

   assert.equal(event.event, "ProtocolTransferInitiated");
   assert.equal(event.args._existingProtocol, _existingProtocol);
   assert.equal(event.args._proposedProtocol, _proposedProtocol);
   assert.equal(event.args._activationHeight.toNumber(), _activationHeight.toNumber());
}

module.exports.checkProtocolTransferCompletedEvent = (event, _newProtocol) => {
   assert.equal(event.event, "ProtocolTransferCompleted");
   assert.equal(event.args._newProtocol, _newProtocol);
}

module.exports.checkProtocolTransferRevokedEvent = (event, _existingProtocol, _revokedProtocol) => {
   assert.equal(event.event, "ProtocolTransferRevoked");
   assert.equal(event.args._existingProtocol, _existingProtocol);
   assert.equal(event.args._revokedProtocol, _revokedProtocol);
}