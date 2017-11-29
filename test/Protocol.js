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
// Test: initialise and stake Simple Token Prime
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const Assert = require('assert');
const BigNumber = require('bignumber.js');

const ProtocolUtils = require('./Protocol_utils.js');

contract('OpenST', function(accounts) {
	
	const DECIMALSFACTOR = new BigNumber('10').pow('18');
	const TOKEN_SYMBOL   = "ST";
	const TOKEN_NAME     = "Simple Token";
	const TOKEN_DECIMALS = 18;
	const TOKENS_MAX     = new BigNumber('800000000').mul(DECIMALSFACTOR);

	const deployMachine = accounts[0];
	const owner         = accounts[1];
	const admin         = accounts[2];
	const ops           = accounts[3];
	const intercommVC   = accounts[4];
	const intercommUC   = accounts[5];

	var receipts = []

	function logReceipt(receipt, description) {
		receipts.push({
			receipt     : receipt,
			description : description
		})
	}

	async function logTransaction(hash, description) {
		const receipt = await web3.eth.getTransactionReceipt(hash)
		await logReceipt(receipt, description)
	}

	describe('Setup Utility chain with Simple Token Prime', async () => {

		var simpleToken = null;
		var registrarVC = null;
		var registrarUC = null;
		var coreVC      = null;
		var openSTValue = null;
		var openSTUtility = null;

		before(async () => {
			var contracts = await ProtocolUtils.deployOpenSTProtocol(artifacts, accounts);
			simpleToken = contracts.simpleToken;
			registrarVC = contracts.registrarVC;
			registrarUC = contracts.registrarUC;
			openSTValue = contracts.openSTValue;
			openSTUtility = contracts.openSTUtility;
			// core on VC to represent UC
			coreVC = contracts.coreVC;
		});

		it("add core to represent utility chain", async () => {
			console.log("hello")
			Assert.ok(await registrarVC.addCore(openSTValue.address, coreVC.address, { from: intercommVC }));
        	// console.log(await simpleToken.balanceOf.call(deployMachine));
		});
	});
});