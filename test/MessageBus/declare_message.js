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
// Test: Core.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const //coreUtils = require('./Core_utils.js')
	// 	utils = require('../lib/utils.js')
	// , proof = require('../data/proof')
	// , RLP = require('rlp')
	// BigNumber = require('bignumber.js')
	//, web3EventsDecoder = require('../lib/event_decoder.js')
	 messageBusTest = artifacts.require('./MessageBusTest.sol');
;

contract('Core', function (accounts) {
	
	describe('Properties', async () => {
		before(async () => {
			// openSTRemote = proof.account.accountAddress;
			// blockHeight = new BigNumber(5);
			// contractsData = await coreUtils.deployCore(artifacts, accounts);
			// core = contractsData.core;
			// workersContract = contractsData.workersContract;
			// worker = contractsData.worker;
			// registrar = contractsData.registrar;
			// chainIdRemote = contractsData.chainIdRemote;
			// chainIdOrigin = contractsData.chainIdOrigin;
			messageBusTestInstance = messageBusTest.new();
		});
		
		it('success when message is undeclared ', async () => {
			
			let stakingIntent = web3.utils.soliditySha3("stakinghash")
				,	nonce = 1
				, gasPrice = 100000
				, sender = accounts[0]
				, signature = web3.eth.sign(stakingIntent, sender)
				, messageTypeHash = web3.utils.soliditySha3("gatewayLink"); // think to change it.
			
			messageBusTestInstance.declareMessage(stakingIntent, nonce, gasPrice, sender, stakingIntent, 0,signature, messageTypeHash );

		});
		
	});
	
	
	// describe('commitStateRoot', async () => {
	// 	// Before All
	// 	before(async () => {
	//
	// 	});
	//
	// 	it('should be able to commit state root and getStateRoot for given block height', async () => {
	//
	// 	});
	//
	// });
});
