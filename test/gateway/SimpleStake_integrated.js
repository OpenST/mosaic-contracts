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
// Test: SimpleStake_integrated.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const Assert = require('assert');
const BN = require('bn.js');
const Utils = require('../lib/utils.js');
const SimpleStakeUtils = require('./SimpleStake_utils.js')

///
///  Test stories
/// 
///  Test SimpleStake in isolation from OpenST protocol
///  - 

contract('SimpleStake', function(accounts) {

	/// mock unique identifier for utility token
	const UUID = "0xbce8a3809c9356cf0e5178a2aef207f50df7d32b388c8fceb8e363df00efce31";
	/// mock OpenST protocol contract address with an external account
	const openSTProtocol = accounts[4];
	/// mock upgraded OpenST protocol contract address with an external account
	const upgradedOpenSTProtocol = accounts[5];
	/// constant protocol wait time for protocol transfer in blocks
	const PROTOCOL_TRANSFER_BLOCKS_TO_WAIT = 40320;

	describe('in isolation', async () => {

		var token = null;
		var simpleStake = null;
		var totalSupply = new BN(0);

		const ST0 = web3.utils.toWei(new BN('0'), "ether");
		const ST2 = web3.utils.toWei(new BN('2'), "ether");
		const ST3 = web3.utils.toWei(new BN('3'), "ether");
		const ST5 = web3.utils.toWei(new BN('5'), "ether");

		before(async () => {
			var contracts =
				await SimpleStakeUtils.deploySimpleStake(
				artifacts, accounts);

			token = contracts.token;
			simpleStake = contracts.simpleStake;

			totalSupply = new BN(await token.balanceOf.call(accounts[0]));
			Assert(totalSupply.gte(ST5));
		});

		context("on construction", async () => {
			
			it("should store a UUID", async() => {
				Assert.equal(await simpleStake.uuid.call(), UUID);
			});

			it("should have an EIP20Token contract", async() => {
				Assert.equal(await simpleStake.eip20Token.call(), token.address);
			});

			it("should have a well-defined OpenSTProtocol", async() => {
				// assert protocol contract address is set
				Assert.equal(await simpleStake.openSTProtocol.call(), openSTProtocol);
				// assert no new protocol contract address is proposed
				Assert.ok(Utils.isNullAddress(await simpleStake.proposedProtocol.call()));
				// assert transfer height is zero
				Assert.equal(await simpleStake.earliestTransferHeight.call(), 0);
			});

			it("should hold a zero balance", async() => {
				Assert.equal(await simpleStake.getTotalStake.call(), 0);
			});

			it("Protocol transfer wait blocktime", async() => {
				Assert.equal(await simpleStake.blocksToWaitForProtocolTransfer.call(),
					PROTOCOL_TRANSFER_BLOCKS_TO_WAIT);
			});
		});

		context('before protocol transfer', async () => {
			
			it("can stake 5ST", async () => {
				Assert.ok(await token.transfer(simpleStake.address, ST5, { from: accounts[0] }));
				await SimpleStakeUtils.checkTotalStaked(simpleStake, token, ST5);
				assert((await token.balanceOf.call(accounts[0])).eq(totalSupply.sub(ST5)));
			});

			it("can release 3ST", async () => {
				const result = await simpleStake.releaseTo(accounts[0], ST3, { from: openSTProtocol });
				await SimpleStakeUtils.checkTotalStaked(simpleStake, token, ST2);
				assert((await token.balanceOf(accounts[0])).eq(totalSupply.sub(ST2)));
				SimpleStakeUtils.checkReleasedEventGroup(result, openSTProtocol, accounts[0], ST3);
			});

			it("must fail to release 3ST", async () => {
				await Utils.expectThrow(simpleStake.releaseTo(accounts[0], ST3, { from: openSTProtocol }));
				await SimpleStakeUtils.checkTotalStaked(simpleStake, token, ST2);
				assert((await token.balanceOf(accounts[0])).eq(totalSupply.sub(ST2)));
			});

			it("can release all remaining stake", async () => {
				var remainingStake = await simpleStake.getTotalStake.call();
				Assert.ok(await simpleStake.releaseTo(accounts[0], remainingStake, { from: openSTProtocol }));
				await SimpleStakeUtils.checkTotalStaked(simpleStake, token, ST0);
				assert((await token.balanceOf(accounts[0])).eq(totalSupply));
			});
		});

		// TODO: [ben]
		// - test protocol transfers
		// - test staking and releasing during protocol transfers
		// - test the time to wait by calling repeatedly complete and expect it to fail if
		//   blockheight is not yet reached - find better way to test this

		// context('during protocol transfer', async () => {

		// 	it('can initiate protocol transfer', async () => {
		// 		Assert.ok(await );
		// 	});
		// });
	})
});
