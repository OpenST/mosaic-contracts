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

var SimpleToken   = artifacts.require("./SimpleToken/SimpleToken.sol");
var Registrar     = artifacts.require("./Registrar.sol");
var Core          = artifacts.require("./Core.sol");
var OpenSTValue   = artifacts.require("./OpenSTValue.sol");
var OpenSTUtility = artifacts.require("./OpenSTUtility.sol");

const CHAINID_VALUE   = 2001;
const CHAINID_UTILITY = 2002;

module.exports.deployOpenSTProtocol = async (artifacts, accounts) => {

	const deployMachine = accounts[0];
	const owner         = accounts[1];
	const admin         = accounts[2];
	const ops           = accounts[3];
	const intercommVC   = accounts[4];
	const intercommUC   = accounts[5];

	const simpleToken = await SimpleToken.new({ from: deployMachine });
	// finalize the tokens
	await simpleToken.setAdminAddress(admin, { from: deployMachine });
	await simpleToken.finalize({ from: admin });
	// transfer ownership
	await simpleToken.initiateOwnershipTransfer(owner, { from: deployMachine });
	await simpleToken.completeOwnershipTransfer({ from: owner });

	const registrarVC = await Registrar.new({ from: deployMachine });
	// set Ops of registrar to Intercom account on value chain
	await registrarVC.setOpsAddress(intercommVC, { from: deployMachine });
	await registrarVC.initiateOwnershipTransfer(owner, { from: deployMachine });
	await registrarVC.completeOwnershipTransfer({ from: owner });

	const registrarUC = await Registrar.new({ from: deployMachine });
	// set Ops of registrar to Intercom account on utility chain
	await registrarUC.setOpsAddress(intercommUC, { from: deployMachine });
	await registrarUC.initiateOwnershipTransfer(owner, { from: deployMachine });
	await registrarUC.completeOwnershipTransfer({ from: owner });

	const openSTValue = await OpenSTValue.new(CHAINID_VALUE, simpleToken.address,
		registrarVC.address);
	await openSTValue.initiateOwnershipTransfer(owner, { from: deployMachine });
	await openSTValue.completeOwnershipTransfer({ from: owner });

	const openSTUtility = await OpenSTUtility.new(CHAINID_VALUE, CHAINID_UTILITY,
		registrarUC.address);
	await openSTUtility.initiateOwnershipTransfer(owner, { from: deployMachine });
	await openSTUtility.completeOwnershipTransfer({ from: owner });

	// only setup a core for the Value Chain to track the Utility Chain for v0.9.1
	const coreVC = await Core.new(registrarVC.address, CHAINID_VALUE, CHAINID_UTILITY,
		openSTUtility.address);

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
		coreVC        : coreVC
	};
}