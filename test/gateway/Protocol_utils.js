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
// Test: Protocol_utils.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const BigNumber = require('bignumber.js');
const Assert = require('assert');

const rootPrefix = "../.."
  , constants = require(rootPrefix + '/test/lib/constants')
;

const utils = require(rootPrefix + "/test/lib/utils.js");
const openSTValueUtils = require("./OpenSTValue_utils.js");

var MockToken   = artifacts.require("./MockToken.sol");
var Registrar     = artifacts.require("./Registrar.sol");
var CoreMock          = artifacts.require("./CoreMock.sol");
var OpenSTValue   = artifacts.require("./OpenSTValueMock.sol");
var OpenSTUtility = artifacts.require("./OpenSTUtilityMock.sol");
var STPrime       = artifacts.require("./STPrime.sol");
var Workers = artifacts.require("./Workers.sol");
var proof = require(rootPrefix + '/test/data/proof');

const CHAINID_VALUE   = 2001;
const CHAINID_UTILITY = 2002;

module.exports.deployOpenSTProtocol = async (artifacts, accounts) => {

	const deployMachine = accounts[0];
	const owner         = accounts[1];
	const admin         = accounts[2];
	const ops           = accounts[3];
	const intercommVC   = accounts[4];
	const intercommUC   = accounts[5];
	const workerDeactivationHeight = new BigNumber(web3.toWei(100000000, "ether"));

	var res = null;

	const simpleToken = await MockToken.new({ from: deployMachine });
	await utils.logTransaction(simpleToken.transactionHash, "SimpleToken.new");
	// finalize the tokens
	utils.logResponse(await simpleToken.initiateOwnershipTransfer(owner, { from: deployMachine }),
		"SimpleToken.initiateOwnershipTransfer");
	utils.logResponse(await simpleToken.completeOwnershipTransfer({ from: owner }),
		"SimpleToken.completeOwnershipTransfer");

	const registrarVC = await Registrar.new({ from: deployMachine });
	await utils.logTransaction(registrarVC.transactionHash, "RegistrarVC.new");
	// set Ops of registrar to Intercom account on value chain
	utils.logResponse(await registrarVC.setOpsAddress(intercommVC, { from: deployMachine }),
		"Registrar.setOpsAddress");
	utils.logResponse(await registrarVC.initiateOwnershipTransfer(owner, { from: deployMachine }),
		"Registrar.initiateOwnershipTransfer");
	utils.logResponse(await registrarVC.completeOwnershipTransfer({ from: owner }),
		"Registrar.completeOwnershipTransfer");

	const registrarUC = await Registrar.new({ from: deployMachine });
	await utils.logTransaction(registrarUC.transactionHash, "RegistrarUC.new");
	// set Ops of registrar to Intercom account on utility chain
	utils.logResponse(await registrarUC.setOpsAddress(intercommUC, { from: deployMachine }),
		"Registrar.setOpsAddress");
	utils.logResponse(await registrarUC.initiateOwnershipTransfer(owner, { from: deployMachine }),	
		"Registrar.initiateOwnershipTransfer");
	utils.logResponse(await registrarUC.completeOwnershipTransfer({ from: owner }),
		"Registrar.completeOwnershipTransfer");

	const openSTValue = await OpenSTValue.new(CHAINID_VALUE, simpleToken.address,
		registrarVC.address, constants.VALUE_CHAIN_BLOCK_TIME);
	await utils.logTransaction(openSTValue.transactionHash, "OpenSTValue.new");
	utils.logResponse(await openSTValue.initiateOwnershipTransfer(owner, { from: deployMachine }),
		"OpenSTValue.initiateOwnershipTransfer");
	utils.logResponse(await openSTValue.completeOwnershipTransfer({ from: owner }),
		"OpenSTValue.completeOwnershipTransfer");

    // Deploy worker contract
    const workers = await Workers.new(simpleToken.address)
        , worker1 = accounts[7];
    await workers.setAdminAddress(admin);
    await workers.setOpsAddress(ops);
    await workers.setWorker(worker1, workerDeactivationHeight, {from:ops});


    const coreUC = await CoreMock.new(registrarVC.address, CHAINID_UTILITY, CHAINID_VALUE,
        openSTValue.address, constants.VALUE_CHAIN_BLOCK_TIME, 0, proof.account.stateRoot, workers.address);
    await utils.logTransaction(coreUC.transactionHash, "CoreVC.new");

	const openSTUtility = await OpenSTUtility.new(CHAINID_VALUE, CHAINID_UTILITY,
		registrarUC.address, coreUC.address, constants.UTILITY_CHAIN_BLOCK_TIME, { from: deployMachine});

	await utils.logTransaction(openSTUtility.transactionHash, "OpenSTUtility.new");
	utils.logResponse(await openSTUtility.initiateOwnershipTransfer(owner, { from: deployMachine }),
		"OpenSTUtility.initiateOwnershipTransfer");
	utils.logResponse(await openSTUtility.completeOwnershipTransfer({ from: owner }),
		"OpenSTUtility.completeOwnershipTransfer");

	// only setup a core for the Value Chain to track the Utility Chain for v0.9.1

	const coreVC = await CoreMock.new(registrarVC.address, CHAINID_VALUE, CHAINID_UTILITY,
		openSTUtility.address, constants.UTILITY_CHAIN_BLOCK_TIME, 0, proof.account.stateRoot, workers.address);

	await utils.logTransaction(coreVC.transactionHash, "CoreVC.new");

	const stpContractAddress = await openSTUtility.simpleTokenPrime.call();
	Assert.notEqual(stpContractAddress, utils.NullAddress);
	const stPrime = STPrime.at(stpContractAddress);

	// console.log("Simple Token:", simpleToken.address);
	// console.log("Registrar VC:", registrarVC.address);
	// console.log("Registrar UC:", registrarUC.address);
	// console.log("OpenSTValue:", openSTValue.address);
	// console.log("OpenSTUtility:", openSTUtility.address);
	// console.log("CoreVC:", coreVC.address);

	return {
		token         : simpleToken,
		registrarVC   : registrarVC,
		registrarUC   : registrarUC,
		openSTValue   : openSTValue,
		openSTUtility : openSTUtility,
		coreVC        : coreVC,
		stPrime       : stPrime
	};
}