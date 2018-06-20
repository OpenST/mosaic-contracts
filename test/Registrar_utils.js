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
// Test: Registrar_utils.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const BigNumber = require('bignumber.js');

var SimpleToken = artifacts.require("./SimpleToken/SimpleToken.sol");
var Registrar 	= artifacts.require("./Registrar.sol");
var OpenSTUtility = artifacts.require("./OpenSTUtility.sol");
var OpenSTValue = artifacts.require("./OpenSTValue.sol");
var Core 		= artifacts.require("./Core.sol");
var Workers = artifacts.require("./Workers.sol")

/// @dev Deploy 
module.exports.deployRegistrar = async (artifacts, accounts) => {
	const chainIdValue   = 3;
	const chainIdUtility = 1410;
	const valueToken   	 = await SimpleToken.new();
	const registrar    	 = await Registrar.new();
	const staker	  	 = accounts[2];
	const amountST		 = new BigNumber(web3.toWei(2, "ether"));
  const deactivationHeight = new BigNumber(web3.toWei(100000000, "ether"));
  const admin = accounts[3];
  const ops = accounts[2];

	// Registrar is OpsManaged
	await registrar.setOpsAddress(accounts[1]);
	await registrar.setAdminAddress(accounts[3]);

	// Set SimpleToken admin to in order to finalize SimpleToken
	await valueToken.setAdminAddress(accounts[3]);
	// SimpleToken must be finalized to permit certain transfers
	await valueToken.finalize({ from: accounts[3] });
    await valueToken.transfer(staker, amountST);

  // Deploy worker contract
  const workers = await Workers.new(valueToken.address)
    , worker1 = accounts[7];
  await workers.setAdminAddress(admin);
  await workers.setOpsAddress(ops);
  await workers.setWorker(worker1, deactivationHeight, {from:ops});

	const openSTUtility = await OpenSTUtility.new(chainIdValue, chainIdUtility, registrar.address, { gas: 10000000 });
	const openSTValue 	= await OpenSTValue.new(chainIdValue, valueToken.address, registrar.address);
	const core 		  	 = await Core.new(registrar.address, chainIdValue, chainIdUtility, openSTUtility.address, workers.address);

	return {
		valueToken  	: valueToken,
		registrar 		: registrar,
		openSTUtility 	: openSTUtility,
		openSTValue 	: openSTValue,
		core 			: core
	}
}
