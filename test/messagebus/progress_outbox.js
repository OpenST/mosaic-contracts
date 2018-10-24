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
// Test: ProgressOutbox.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const messageBusUtilsKlass = require('./messagebus_utils'),
			web3 = require('web3');
const messageBusUtils = new messageBusUtilsKlass();

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
	hashLock,
	params,
	messageBoxOffset,
	storageRoot,
	rlpEncodedParentNodes,
	generatedHashLock;

	contract('MessageBus',  async (accounts) => {

		describe('progressOutbox', async () => {

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
					, generatedHashLock = messageBusUtils.utils.generateHashLock()
					, unlockSecret = generatedHashLock.s
					, hashLock = generatedHashLock.l
					,	messageBoxOffset = 1
					, signature = "0xd0448f820b67d07ee7c7d1a4141177401933d97f744e785c435458032b7c8ae46a482c3c058fc94c3110df3488e1e537bcd8b13468f16aaea5d203e17301d47300"
					,	rlpEncodedParentNodes = '0xf9019ff901318080a09d4484981c7edad9f3182d5ae48f8d9d37920c6b38a2871cebef30386741a92280a0e159e6e0f6ff669a91e7d4d1cf5eddfcd53dde292231841f09dd29d7d29048e9a0670573eb7c83ac10c87de570273e1fde94c1acbd166758e85aeec2219669ceb5a06f09c8eefdb579cae94f595c48c0ee5e8052bef55f0aeb3cc4fac8ec1650631fa05176aab172a56135b9d01a89ccada74a9d11d8c33cbd07680acaf9704cbec062a0df7d6e63240928af91e7c051508a0306389d41043954c0e3335f6f37b8e53cc18080a03d30b1a0d2a61cafd83521c5701a8bf63d0020c0cd9e844ad62e9b4444527144a0a5aa2db9dc726541f2a493b79b83aeebe5bc8f7e7910570db218d30fa7d2ead18080a0b60ddc26977a026cc88f0d5b0236f4cee7b93007a17e2475547c0b4d59d16c3d80f869a034d7a0307ecd0d12f08317f9b12c4d34dfbe55ec8bdc90c4d8a6597eb4791f0ab846f8440280a0e99d9c02761142de96f3c92a63bb0edb761a8cd5bbfefed1e72341a94957ec51a0144788d43dba972c568df04560b995d9e57b58ef09fddf3b68cba065997efff7'
					, storageRoot = '0x9642e5c7f830dbf5cb985c9a2755ea2e5e560dbe12f98fd19d9b5b6463c2e771';
				
				await messageBusUtils.deployedMessageBus();
				
				params = {
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
					unlockSecret: unlockSecret,
					messageBoxOffset: messageBoxOffset,
					rlpEncodedParentNodes: rlpEncodedParentNodes,
					storageRoot: storageRoot
				};
				
			});

			it('should fail when message status is undeclared in outbox', async () => {
				
				await messageBusUtils.progressOutbox(params, false);

			});

			it('should fail when message status is already progressed in outbox', async () => {

				await messageBusUtils.declareMessage(params, true);
				await messageBusUtils.progressOutbox(params, true);
				await messageBusUtils.progressOutbox(params, false);

			});

			it('should fail when message status is declared revocation in outbox', async () => {
				
				await messageBusUtils.declareMessage(params, true);
				await messageBusUtils.declareRevocationMessage(params, true);
				await messageBusUtils.progressOutbox(params, false);
				
			});

			it('should fail when message status is revoked in outbox', async () => {
				
				await messageBusUtils.declareMessage(params, true);
				await messageBusUtils.declareRevocationMessage(params, true);
				params.messageStatus = (await messageBusUtils.getOutboxStatus(messageHash)).toString();
				await messageBusUtils.progressOutboxRevocation(params, true);
				await messageBusUtils.progressOutbox(params, false);

			});

			it('should fail when unlock secret is incorrect', async () => {

				params.unlockSecret = web3.utils.soliditySha3({type: 'bytes32', value: 'secret1'});
				await messageBusUtils.progressOutbox(params, false);

			});
		});
	});
