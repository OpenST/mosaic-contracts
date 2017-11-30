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
const utils = require("./lib/utils.js");
const openSTValueUtils = require("./OpenSTValue_utils.js");
const openSTUtilityUtils = require('./OpenSTUtility_utils.js');

const web3EventsDecoder = require('./lib/event_decoder.js');

const ProtocolUtils = require('./Protocol_utils.js');

const CHAINID_VALUE   = new BigNumber(2001);
const CHAINID_UTILITY = new BigNumber(2002);

contract('OpenST', function(accounts) {

	const DECIMALSFACTOR = new BigNumber('10').pow('18');
	const TOKEN_SYMBOL   = "ST";
	const TOKEN_NAME     = "Simple Token";
	const TOKEN_DECIMALS = 18;
	const TOKENS_MAX     = new BigNumber('800000000').mul(DECIMALSFACTOR);
	
	const STPRIME_SYMBOL          = "STP";
	const STPRIME_NAME            = "SimpleTokenPrime";
	const STPRIME_CONVERSION_RATE = new BigNumber(1);

	// Member Details
	const symbol = "BT";
	const name = "Branded Token";
	const conversionRate = 10;

	const deployMachine = accounts[0];
	const owner         = accounts[1];
	const admin         = accounts[2];
	const ops           = accounts[3];
	const intercommVC   = accounts[4];
	const intercommUC   = accounts[5];
	const requester     = accounts[6];
	const staker        = accounts[7];

	const AMOUNT_ST = new BigNumber(1000);

	describe('Setup Utility chain with Simple Token Prime', async () => {

		var simpleToken = null;
		var registrarVC = null;
		var registrarUC = null;
		var coreVC      = null;
		var openSTValue = null;
		var openSTUtility = null;
		var stPrime = null;

		var stpContractAddress = null;
		var registeredBrandedTokenUuid = null;

		//- [x] truffle complete deployment process

		before(async () => {
			var contracts = await ProtocolUtils.deployOpenSTProtocol(artifacts, accounts);
			simpleToken = contracts.token;
			registrarVC = contracts.registrarVC;
			registrarUC = contracts.registrarUC;
			openSTValue = contracts.openSTValue;
			openSTUtility = contracts.openSTUtility;
			// core on VC to represent UC
			coreVC = contracts.coreVC;
		    stPrime = contracts.stPrime;
		});

		it("add core to represent utility chain", async () => {
			const o = await registrarVC.addCore(openSTValue.address, coreVC.address, { from: intercommVC });
			Assert.ok(o);
			utils.logResponse(o, "RegistrarVC.addCore");
			Assert.equal(await openSTValue.core.call(CHAINID_UTILITY), coreVC.address);
		});

		it("register Simple Token Prime", async () => {
			const uuidSTP = await openSTUtility.uuidSTPrime.call();
			Assert.notEqual(uuidSTP, "");
			const o = await registrarVC.registerUtilityToken(
				openSTValue.address,
				STPRIME_SYMBOL,
				STPRIME_NAME,
				STPRIME_CONVERSION_RATE, 
				CHAINID_UTILITY,
				0,
				uuidSTP, { from: intercommVC });
			utils.logResponse(o, "RegistrarVC.registerUtilityToken (STP)");
			Assert.notEqual((await openSTValue.utilityTokenProperties.call(uuidSTP))[5], utils.NullAddress);
		});

		// Initialize Transfer to ST' Contract Address
		it("Initialize transfer to ST PRIME Contract Address", async () => {
			Assert.equal(await web3.eth.getBalance(stPrime.address),  0);

		 	await stPrime.initialize({ from: deployMachine, value:  TOKENS_MAX});
			var stPrimeContractBalanceAfterTransfer = await web3.eth.getBalance(stPrime.address).toNumber();
			Assert.equal(stPrimeContractBalanceAfterTransfer,  TOKENS_MAX);

	    });

	    it("Report gas usage: deployment and setup", async () => {
			utils.printGasStatistics();
			utils.clearReceipts();
		});

		// - [ ] stake ST for ST'
		it("stake ST for ST Prime", async () => {
			const uuidSTP = await openSTUtility.uuidSTPrime.call();
			// transfer ST to staker account
			Assert.ok(await simpleToken.transfer(staker, AMOUNT_ST, { from: deployMachine }));
			// staker sets allowance for OpenSTValue
			Assert.ok(await simpleToken.approve(openSTValue.address, AMOUNT_ST, { from: staker }));
			// for testing purpose query nonce in advance
			var nonce = await openSTValue.getNextNonce.call(staker);
			Assert.equal(nonce, 1);
			// staker calls OpenSTValue.stake to initiate the staking for ST' with uuidSTP
			// with staker as the beneficiary
			const o = await openSTValue.stake(uuidSTP, AMOUNT_ST, staker, { from: staker });
			utils.logResponse(o, "OpenSTValue.stake");
			openSTValueUtils.checkStakingIntentDeclaredEventProtocol(o.logs[0], uuidSTP, staker, nonce, staker,
				AMOUNT_ST, AMOUNT_ST, CHAINID_UTILITY);
		});

		it("Report gas usage: staking Simple Token Prime", async () => {
			utils.printGasStatistics();
			utils.clearReceipts();
		});

  		//- [ ] propose and register Branded Token

		it("propose and register branded token for a member company", async() => {
      		var result = await openSTUtility.proposeBrandedToken(
      			symbol,
				name,
				conversionRate,
				{ from: requester });

      		var eventLog = result.logs[0];

      openSTUtilityUtils.validateProposedBrandedTokenEvent(
      	eventLog,
				requester,
				symbol,
				name,
				conversionRate);

  		registeredBrandedTokenUuid = await registrarUC.registerBrandedToken.call(
				openSTUtility.address,
				symbol,
				name,
				conversionRate,
				requester,
				eventLog.args._token,
				eventLog.args._uuid,
				{ from: intercommUC }
			);

  		result = await registrarUC.registerBrandedToken(
				openSTUtility.address,
				symbol,
				name,
				conversionRate,
				requester,
				eventLog.args._token,
				eventLog.args._uuid,
				{ from: intercommUC }
			);

			const openSTUtilityArtifacts = artifacts.require("./OpenSTUtility.sol");
			var formattedEvents = web3EventsDecoder.perform(result.receipt, openSTUtility.address, openSTUtilityArtifacts.abi);
			console.log("formattedEvents");
			console.log(formattedEvents);

  		Assert.equal(eventLog.args._uuid, registeredBrandedTokenUuid);

			const returnedUuid = await registrarVC.registerUtilityToken.call(
				openSTValue.address,
				symbol,
				name,
				conversionRate,
				CHAINID_UTILITY,
				requester,
				registeredBrandedTokenUuid,
				{ from: intercommVC }
			);

  		result = await registrarVC.registerUtilityToken(
				openSTValue.address,
				symbol,
				name,
				conversionRate,
				CHAINID_UTILITY,
				requester,
				registeredBrandedTokenUuid,
				{ from: intercommVC }
			);

  		Assert.equal(returnedUuid, registeredBrandedTokenUuid);

		});
	});
});