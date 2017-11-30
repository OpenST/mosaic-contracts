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
const STPrime = artifacts.require("./STPrime.sol");
const OpenSTUtility_utils = require('./OpenSTUtility_utils.js');

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

	const deployMachine = accounts[0];
	const owner         = accounts[1];
	const admin         = accounts[2];
	const ops           = accounts[3];
	const intercommVC   = accounts[4];
	const intercommUC   = accounts[5];
	const memberCompany = accounts[6];

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
		  stpContractAddress = await openSTUtility.simpleTokenPrime.call();
			Assert.notEqual(stpContractAddress, utils.NullAddress);
			stPrime = STPrime.at(stpContractAddress);
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
			Assert.notEqual((await openSTValue.utilityTokenBreakdown.call(uuidSTP))[5], utils.NullAddress);
		});

	  // Initialize Transfer to ST' Contract Address
	  it("Initialize transfer to ST PRIME Contract Address", async () => {
			Assert.equal(await web3.eth.getBalance(stpContractAddress),  0);

		  await stPrime.initialize({ from: deployMachine, value:  TOKENS_MAX});
			var stPrimeContractBalanceAfterTransfer = await web3.eth.getBalance(stpContractAddress).toNumber();
			Assert.equal(stPrimeContractBalanceAfterTransfer,  TOKENS_MAX);

    });

	  //- [ ] Initialize Transfer to ST' Contract Address

	  it("Initialize transfer to ST PRIME Contract Address", async () => {
		  //await stpContractAddress.initialize({ from: accounts[11], value: new BigNumber(web3.toWei(800000000, "ether")) });
    });

  	//- [ ] propose and register Branded Token

		it("propose and register branded token for a member company", async() => {
			const symbol = "PC",
						name = "Pepo Coin",
						conversionRate = 10;
      var result = await openSTUtility.proposeBrandedToken(
      	symbol,
				name,
				conversionRate,
				{from: memberCompany}
			);
      var eventLog = result.logs[0];

      OpenSTUtility_utils.validateProposedBrandedTokenEvent(
      	eventLog,
				memberCompany,
				symbol,
				name,
				conversionRate);

  		registeredBrandedTokenUuid = await registrarUC.registerBrandedToken.call(
				openSTUtility.address,
				symbol,
				name,
				conversionRate,
				memberCompany,
				eventLog.args._token,
				eventLog.args._uuid,
				{ from: intercommUC }
			);

  		result = await registrarUC.registerBrandedToken(
				openSTUtility.address,
				symbol,
				name,
				conversionRate,
				memberCompany,
				eventLog.args._token,
				eventLog.args._uuid,
				{ from: intercommUC }
			);

  		Assert.equal(eventLog.args._uuid, registeredBrandedTokenUuid);

			const returnedUuid = await registrarVC.registerUtilityToken.call(
				openSTValue.address,
				symbol,
				name,
				conversionRate,
				CHAINID_UTILITY,
				memberCompany,
				registeredBrandedTokenUuid,
				{ from: intercommVC }
			);

  		result = await registrarVC.registerUtilityToken(
				openSTValue.address,
				symbol,
				name,
				conversionRate,
				CHAINID_UTILITY,
				memberCompany,
				registeredBrandedTokenUuid,
				{ from: intercommVC }
			);

  		Assert.equal(returnedUuid, registeredBrandedTokenUuid);

		});

	});

	describe('Report', async () => {

		it("gasUsed", async () => {
			utils.printGasStatistics();
		});

  })
});