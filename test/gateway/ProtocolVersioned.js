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
// Test: ProtocolVersioned.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const BigNumber = require('bignumber.js');
const Utils = require('../lib/utils.js');
const ProtocolVersioned_utils = require('./ProtocolVersioned_utils.js');

///
/// Test stories
/// 
/// Properties 
/// 	has openSTprotocol
///
/// InitiateProtocolTransfer
///		fails to initiate by non-openSTProtocol
///		fails to initiate by openSTProtocol with null proposedProtocol
///		fails to initiate if openSTProtocol is same as proposedProtocol
///		successfully initiates protocol transfer
///		fails to initiate if proposedProtocol is not null
///
/// CompleteProtocolTransfer
///		fails to complete by non-proposedProtocol
///		fails to complete by proposedProtocol before waiting period ends
///		successfully completes protocol transfer
///
/// RevokeProtocolTransfer
///		fails to revoke by non-openSTProtocol
///		fails to revoke by protocol if proposedProtocol is null
///		successfully revokes protocol transfer
///

contract('ProtocolVersioned', function(accounts) {
	const openSTProtocol = accounts[1];
	const proposedProtocol = accounts[2];
	const PROTOCOL_TRANSFER_BLOCKS_TO_WAIT = 3;

	var result = null;
	var earliestTransferHeight = null;

	describe ('Properties', async () => {
		before(async () => {
	        contracts = await ProtocolVersioned_utils.deployProtocolVersioned(artifacts, accounts);
	        protocolVersioned = contracts.protocolVersioned;
		})

		it('has openSTProtocol', async () => {
			assert.equal(await protocolVersioned.openSTProtocol.call(), openSTProtocol);
		})
	});

	describe ('InitiateProtocolTransfer', async () => {
		before(async () => {
	        contracts = await ProtocolVersioned_utils.deployProtocolVersioned(artifacts, accounts);
	        protocolVersioned = contracts.protocolVersioned;
		})

		it ('fails to initiate by non-openSTProtocol', async () => {
            await Utils.expectThrow(protocolVersioned.initiateProtocolTransfer(proposedProtocol, { from: accounts[0] }));
		})

		it ('fails to initiate by openSTProtocol with null proposedProtocol', async () => {
            await Utils.expectThrow(protocolVersioned.initiateProtocolTransfer(0, { from: openSTProtocol }));
		})

		it ('fails to initiate if openSTProtocol is same as proposedProtocol', async () => {
            await Utils.expectThrow(protocolVersioned.initiateProtocolTransfer(openSTProtocol, { from: openSTProtocol }));
		})

		it ('successfully initiates protocol transfer', async () => {
			assert.ok(Utils.isNullAddress(await protocolVersioned.proposedProtocol.call()));
			assert.equal(await protocolVersioned.initiateProtocolTransfer.call(proposedProtocol, { from: openSTProtocol }), true);
			result = await protocolVersioned.initiateProtocolTransfer(proposedProtocol, { from: openSTProtocol });

			earliestTransferHeight = await protocolVersioned.earliestTransferHeight.call();
			assert.equal(await protocolVersioned.proposedProtocol.call(), proposedProtocol);
			assert.equal(await protocolVersioned.openSTProtocol.call(), openSTProtocol);
			assert.equal(earliestTransferHeight.toNumber(), (result.receipt.blockNumber + PROTOCOL_TRANSFER_BLOCKS_TO_WAIT));
			ProtocolVersioned_utils.checkProtocolTransferInitiatedEvent(result.logs[0], openSTProtocol, proposedProtocol, earliestTransferHeight);
		})

		it ('fails to initiate if proposedProtocol is not null', async () => {
            await Utils.expectThrow(protocolVersioned.initiateProtocolTransfer(proposedProtocol, { from: openSTProtocol }));
		})
	});

	/**
	 *  @dev commented because the wait time is set to 1 week (40320 blocks)
	 *   needs to be mocked in v0.9.2
	 *   https://github.com/OpenSTFoundation/openst-protocol/issues/57
 	*/
	
	describe ('CompleteProtocolTransfer', async () => {
		before(async () => {
	        contracts = await ProtocolVersioned_utils.deployProtocolVersioned(artifacts, accounts);
	        protocolVersioned = contracts.protocolVersioned;
			await protocolVersioned.initiateProtocolTransfer(proposedProtocol, { from: openSTProtocol });
		})

		it('fails to complete by non-proposedProtocol', async () => {
            await Utils.expectThrow(protocolVersioned.completeProtocolTransfer({ from: accounts[0] }));
		})

		// Before wait time as passed
		it('fails to complete by proposedProtocol before waiting period ends', async () => {
			// Wait time less 1 block for preceding test case and 1 block because condition is <=
			var wait = PROTOCOL_TRANSFER_BLOCKS_TO_WAIT - 2;

			for (var i = 0; i < wait; i++) {
					await Utils.expectThrow(protocolVersioned.completeProtocolTransfer({ from: proposedProtocol }));
			}
		})

		// 1 block after preceding test cases == earliest completion is possible
		it('successfully completes protocol transfer', async () => {
			earliestTransferHeight = await protocolVersioned.earliestTransferHeight.call();

			assert.equal(await protocolVersioned.proposedProtocol.call(), proposedProtocol);
			assert.equal(await protocolVersioned.openSTProtocol.call(), openSTProtocol);
			result = await protocolVersioned.completeProtocolTransfer({ from: proposedProtocol });

			var newTransferHeight = await protocolVersioned.earliestTransferHeight.call();
			assert.equal(await protocolVersioned.openSTProtocol.call(), proposedProtocol);
			assert.ok(Utils.isNullAddress(await protocolVersioned.proposedProtocol.call()));
			assert.notEqual(earliestTransferHeight.toNumber(), newTransferHeight.toNumber());
			assert.equal(newTransferHeight.toNumber(), 0);
			ProtocolVersioned_utils.checkProtocolTransferCompletedEvent(result.logs[0], proposedProtocol);
		})
	
	});

	describe ('RevokeProtocolTransfer', async () => {
		before(async () => {
	        contracts = await ProtocolVersioned_utils.deployProtocolVersioned(artifacts, accounts);
	        protocolVersioned = contracts.protocolVersioned;
		})

		it ('fails to revoke by non-openSTProtocol', async () => {
            await Utils.expectThrow(protocolVersioned.revokeProtocolTransfer({ from: accounts[0] }));
		})

		it ('fails to revoke by protocol if proposedProtocol is null', async () => {
			assert.ok(Utils.isNullAddress(await protocolVersioned.proposedProtocol.call()));
            await Utils.expectThrow(protocolVersioned.revokeProtocolTransfer({ from: openSTProtocol }));
		})

		it ('successfully revokes protocol transfer', async () => {
			await protocolVersioned.initiateProtocolTransfer(proposedProtocol, { from: openSTProtocol });
			assert.equal(await protocolVersioned.proposedProtocol.call(), proposedProtocol);
			assert.equal(await protocolVersioned.revokeProtocolTransfer.call({ from: openSTProtocol }), true);
			result = await protocolVersioned.revokeProtocolTransfer({ from: openSTProtocol });

			assert.ok(Utils.isNullAddress(await protocolVersioned.proposedProtocol.call()));
			assert.equal(await protocolVersioned.openSTProtocol.call(), openSTProtocol);
			earliestTransferHeight = await protocolVersioned.earliestTransferHeight.call();
			assert.equal(earliestTransferHeight.toNumber(), 0);
			ProtocolVersioned_utils.checkProtocolTransferRevokedEvent(result.logs[0], openSTProtocol, proposedProtocol);
		})
	});
})
