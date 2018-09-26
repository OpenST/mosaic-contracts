// Copyright 2018 OpenST Ltd.
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
// Test: ProgressInbox.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const messageBusUtilsKlass = require('./messagebus_utils'),
		web3 = require('web3'),
		messageBusUtils = new messageBusUtilsKlass(),
		ProgressInbox = function(){};

let intentHash,
		nonce,
		gasPrice,
		sender,
		signature,
		messageTypeHash,
		gasLimit,
		gasConsumed,
		messageHash,
		messageStatus,
		unlockSecret,
		hashLock;

	
	progressInbox = async() => {
		
		let params = {
			messageTypeHash: messageTypeHash,
			intentHash: intentHash,
			nonce: nonce,
			sender: sender,
			hashLock: hashLock,
			signature: signature,
			gasLimit: gasLimit,
			gasConsumed: gasConsumed,
			messageStatus: messageStatus,
			gasPrice: gasPrice,
			messageHash: messageHash,
			unlockSecret: unlockSecret
		};
		
		await messageBusUtils.progressInbox(params);
	
	}
	
	contract('MessageBus',  async (accounts) => {
	
			describe('progressInbox', async () => {
		
			beforeEach(async function() {
				
				intentHash = web3.utils.soliditySha3({type: 'bytes32', value:'intent'})
					,	nonce = 1
					, gasPrice = 0x12A05F200
					, sender = accounts[7]
					, messageTypeHash = web3.utils.soliditySha3({type: 'bytes32', value: 'gatewaylink'})
					, gasLimit = 0
					, gasConsumed = 0
					, messageHash = '0x9bdab5cbc3ebd8d50e3831bc73da35c1170e21bfb7145e41ce4a952b977a8f84'
					, messageStatus = 1
					, signature = "0xd0448f820b67d07ee7c7d1a4141177401933d97f744e785c435458032b7c8ae46a482c3c058fc94c3110df3488e1e537bcd8b13468f16aaea5d203e17301d47300"
					, unlockSecret = web3.utils.soliditySha3({type: 'bytes32', value: 'secret'})
					, hashLock = web3.utils.soliditySha3({type: 'bytes32', value: unlockSecret});
				await messageBusUtils.deployedMessageBus();
				
			});
			
			it('should fail when message status is undeclared in inbox', async () => {
	
				messageStatus = 0;
				await progressInbox();
			
			});
			
			it('should fail when message status is progressed in inbox', async () => {
				
				messageStatus = 2;
				await progressInbox();
				
			});
			
			it('should fail when message status is declared revocation in inbox', async () => {
				
				messageStatus = 3;
				await progressInbox();
				
			});
			
			it('should fail when message status is revoked in inbox', async () => {
				
				messageStatus = 4;
				await progressInbox();
				
			});
			
			it('should fail when unlock secret is incorrect', async () => {
				
				unlockSecret = web3.utils.soliditySha3({type: 'bytes32', value: 'secret1'});
				await progressInbox();
				
			});
			
			it('should fail when unlock secret is empty', async () => {
				
				unlockSecret = '';
				await progressInbox();
				
			});
		});
	});

