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
// Test: EIP20Token_protocol_extensions.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const BigNumber = require('bignumber.js');
const Utils = require('../lib/utils.js');
const EIP20Token_utils = require('./EIP20Token_utils.js');

///
/// Test stories
/// 
/// MintEIP20, ClaimEIP20, BurnEIP20
/// 	successfully mints
/// 	successfully claims
/// 	successfully burns
///

contract('EIP20Token', function(accounts) {
	const beneficiary1 = accounts[0];
	const beneficiary2 = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
	const ST1 = new BigNumber(web3.toWei(1, "ether"));
	const ST2 = new BigNumber(web3.toWei(2, "ether"));
	const ST3 = new BigNumber(web3.toWei(3, "ether"));

	var result = null;
	var tokenBalance = null;
	var beneficiaryBalance = null;

	describe ('MintEIP20, ClaimEIP20, BurnEIP20', async () => {
		before(async () => {
	        contracts = await EIP20Token_utils.deployEIP20Token(artifacts, accounts);
	        token = contracts.token;
		})

		it('successfully mints', async () => {
			assert.equal(await token.balanceOf.call(token.address), 0);
			assert.equal(await token.mintEIP20Public.call(ST1), true);
			result = await token.mintEIP20Public(ST1);

			tokenBalance = await token.balanceOf.call(token.address);
			assert.equal(tokenBalance.toNumber(), ST1);
			assert.equal(await token.mintEIP20Public.call(ST2), true);
			result = await token.mintEIP20Public(ST2);

			tokenBalance = await token.balanceOf.call(token.address);
			assert.equal(tokenBalance.toNumber(), ST3);
		})

		it('successfully claims', async () => {
			assert.equal(await token.balanceOf.call(beneficiary1), 0);
			assert.equal(await token.claimEIP20Public.call(beneficiary1, ST1), true);

			// Claim for beneficiary1
			result = await token.claimEIP20Public(beneficiary1, ST1);

			tokenBalance = await token.balanceOf.call(token.address);
			assert.equal(tokenBalance.toNumber(), ST2);
			beneficiaryBalance = await token.balanceOf.call(beneficiary1);
			assert.equal(beneficiaryBalance.toNumber(), ST1);
			EIP20Token_utils.checkTransferEvent(result.logs[0], token.address, beneficiary1, ST1);

			// Claim again for beneficiary1
			result = await token.claimEIP20Public(beneficiary1, ST1);

			tokenBalance = await token.balanceOf.call(token.address);
			assert.equal(tokenBalance.toNumber(), ST1);
			beneficiaryBalance = await token.balanceOf.call(beneficiary1);
			assert.equal(beneficiaryBalance.toNumber(), ST2);
			EIP20Token_utils.checkTransferEvent(result.logs[0], token.address, beneficiary1, ST1);

			// Claim for beneficiary2
			result = await token.claimEIP20Public(beneficiary2, ST1);

			tokenBalance = await token.balanceOf.call(token.address);
			assert.equal(tokenBalance.toNumber(), 0);
			beneficiaryBalance = await token.balanceOf.call(beneficiary2);
			assert.equal(beneficiaryBalance.toNumber(), ST1);
			EIP20Token_utils.checkTransferEvent(result.logs[0], token.address, beneficiary2, ST1);
		})

		it('successfully burns', async () => {
			beneficiaryBalance = await token.balanceOf.call(beneficiary1);
			assert.equal(beneficiaryBalance.toNumber(), ST2);
			assert.equal(await token.burnEIP20Public.call(ST1, { from: beneficiary1 }), true);
			result = await token.burnEIP20Public(ST1, { from: beneficiary1 });

			beneficiaryBalance = await token.balanceOf.call(beneficiary1);
			assert.equal(beneficiaryBalance.toNumber(), ST1);
			assert.equal(await token.burnEIP20Public.call(ST1, { from: beneficiary1 }), true);
			result = await token.burnEIP20Public(ST1, { from: beneficiary1 });

			beneficiaryBalance = await token.balanceOf.call(beneficiary1);
			assert.equal(beneficiaryBalance.toNumber(), 0);
		})

	})
})
