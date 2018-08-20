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
// Test: ProtocolVersioned_utils.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

var ProtocolVersioned = artifacts.require("./ProtocolVersionedMock.sol");

/// @dev Deploy 
module.exports.deployProtocolVersioned = async (artifacts, accounts) => {
	const protocolVersioned = await ProtocolVersioned.new(accounts[1], { from: accounts[0]});

	return {
		protocolVersioned : protocolVersioned
	};
};

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
