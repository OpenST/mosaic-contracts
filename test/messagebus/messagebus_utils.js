'use strict'

const MessageBus = artifacts.require('MessageBusTestWrapper');
const hasher = artifacts.require('Hasher');
const web3 = require("web3");
const utils =  require("../lib/utils");
const solc =  require('solc');

let messageBus,
	messageInstance;

const MessageBusUtils = function() {};
MessageBusUtils.prototype = {

	deployedMessageBus: async function(){
		
		messageBus = await MessageBus.new();
		return messageBus;
		
	},
	
	
	declareMessage: async function(params){
		
		let messageTypeHash = params.messageTypeHash,
			intentHash = params.intentHash,
			nonce = params.nonce,
			gasPrice = params.gasPrice,
			gasLimit = params.gasLimit,
			sender = params.sender,
			hashLock = params.hashLock,
			gasConsumed = params.gasConsumed,
			signature = params.signature,
			messageStatus = params.messageStatus,
			messageHash = params.messageHash;

		await utils.expectThrow(messageBus.declareMessage.call(
			messageTypeHash,
			intentHash,
			nonce,
			gasPrice,
			gasLimit,
			sender,
			hashLock,
			gasConsumed,
			signature,
			messageStatus,
			messageHash
		));
	},
	
	progressOutbox: async function(params){
		
		let messageTypeHash = params.messageTypeHash,
			intentHash = params.intentHash,
			nonce = params.nonce,
			gasPrice = params.gasPrice,
			gasLimit = params.gasLimit,
			sender = params.sender,
			hashLock = params.hashLock,
			gasConsumed = params.gasConsumed,
			signature = params.signature,
			messageStatus = params.messageStatus,
			messageHash = params.messageHash,
			unlockSecret = params.unlockSecret;
		
		await utils.expectThrow(messageBus.progressOutbox.call(
			messageTypeHash,
			intentHash,
			nonce,
			gasPrice,
			gasLimit,
			sender,
			hashLock,
			gasConsumed,
			signature,
			messageStatus,
			messageHash,
			unlockSecret
		));
	},
	
	progressInbox: async function(params){
		
		let messageTypeHash = params.messageTypeHash,
			intentHash = params.intentHash,
			nonce = params.nonce,
			gasPrice = params.gasPrice,
			gasLimit = params.gasLimit,
			sender = params.sender,
			hashLock = params.hashLock,
			gasConsumed = params.gasConsumed,
			signature = params.signature,
			messageStatus = params.messageStatus,
			messageHash = params.messageHash,
			unlockSecret = params.unlockSecret;
		
		await utils.expectThrow(messageBus.progressInbox.call(
			messageTypeHash,
			intentHash,
			nonce,
			gasPrice,
			gasLimit,
			sender,
			hashLock,
			gasConsumed,
			signature,
			messageStatus,
			messageHash,
			unlockSecret
		));
		
	},
	
	progressInboxRevocation: async function(params){
		
		let messageTypeHash = params.messageTypeHash,
			intentHash = params.intentHash,
			nonce = params.nonce,
			gasPrice = params.gasPrice,
			gasLimit = params.gasLimit,
			sender = params.sender,
			gasConsumed = params.gasConsumed,
			messageStatus = params.messageStatus,
			messageHash = params.messageHash,
			rlpEncodedParentNodes = params.rlpEncodedParentNodes,
			messageBoxOffset = params.messageBoxOffset,
			storageRoot = params.storageRoot,
			inboxStatus = params.inboxStatus;
		
		await utils.expectThrow(messageBus.progressInboxRevocation.call(
			messageTypeHash,
			intentHash,
			nonce,
			// gasPrice,
			// gasLimit,
			sender,
			messageBoxOffset,
			rlpEncodedParentNodes,
			storageRoot,
			messageStatus,
			// gasConsumed,
			messageHash,
			inboxStatus
		));
	},
	
	progressOutboxRevocation: async function(params){
		
		let messageTypeHash = params.messageTypeHash,
			intentHash = params.intentHash,
			nonce = params.nonce,
			gasPrice = params.gasPrice,
			gasLimit = params.gasLimit,
			sender = params.sender,
			gasConsumed = params.gasConsumed,
			messageStatus = params.messageStatus,
			messageHash = params.messageHash,
			rlpEncodedParentNodes = params.rlpEncodedParentNodes,
			messageBoxOffset = params.messageBoxOffset,
			storageRoot = params.storageRoot,
			inboxStatus = params.inboxStatus;
		
		await utils.expectThrow(messageBus.progressOutboxRevocation.call(
			messageTypeHash,
			intentHash,
			nonce,
			// gasPrice,
			// gasLimit,
			sender,
			messageBoxOffset,
			rlpEncodedParentNodes,
			storageRoot,
			messageStatus,
			// gasConsumed,
			messageHash,
			inboxStatus
		));
	},
	
	confirmRevocation: async function(params){
		
		let messageTypeHash = params.messageTypeHash,
			intentHash = params.intentHash,
			nonce = params.nonce,
			// gasPrice = params.gasPrice,
			// gasLimit = params.gasLimit,
			// gasConsumed = params.gasConsumed,
			messageStatus = params.messageStatus,
			messageHash = params.messageHash,
			rlpEncodedParentNodes = params.rlpEncodedParentNodes,
			messageBoxOffset = params.messageBoxOffset,
			storageRoot = params.storageRoot;
		
		await utils.expectThrow(messageBus.confirmRevocation.call(
			messageTypeHash,
			intentHash,
			nonce,
			// gasPrice,
			// gasLimit,
			messageBoxOffset,
			rlpEncodedParentNodes,
			storageRoot,
			messageStatus,
			// gasConsumed,
			messageHash
		));
	},
	
	confirmMessage: async function(params){
		
		let messageTypeHash = params.messageTypeHash,
			intentHash = params.intentHash,
			nonce = params.nonce,
			gasPrice = params.gasPrice,
			gasLimit = params.gasLimit,
			sender = params.sender,
			gasConsumed = params.gasConsumed,
			messageStatus = params.messageStatus,
			messageHash = params.messageHash,
			rlpEncodedParentNodes = params.rlpEncodedParentNodes,
			storageRoot = params.storageRoot;
		
		await utils.expectThrow(messageBus.confirmMessage.call(
			messageTypeHash,
			intentHash,
			nonce,
			// gasPrice,
			// gasLimit,
			sender,
			rlpEncodedParentNodes,
			storageRoot,
			messageStatus,
			// gasConsumed,
			messageHash
		));
	},
	
	declareRevocationMessage: async function(params){
		
		let messageTypeHash = params.messageTypeHash,
			intentHash = params.intentHash,
			nonce = params.nonce,
			gasPrice = params.gasPrice,
			gasLimit = params.gasLimit,
			sender = params.sender,
			hashLock = params.hashLock,
			gasConsumed = params.gasConsumed,
			signature = params.signature,
			messageStatus = params.messageStatus,
			messageHash = params.messageHash;
		
		await messageBus.declareRevocationMessage.call(
			messageTypeHash,
			intentHash,
			nonce,
			gasPrice,
			gasLimit,
			sender,
			hashLock,
			gasConsumed,
			signature,
			messageStatus,
			messageHash
		);
	},
	
	progressOutboxWithProof: async function(params){
		
		let messageTypeHash = params.messageTypeHash,
			intentHash = params.intentHash,
			nonce = params.nonce,
			gasPrice = params.gasPrice,
			gasLimit = params.gasLimit,
			sender = params.sender,
			gasConsumed = params.gasConsumed,
			messageStatus = params.messageStatus,
			messageHash = params.messageHash,
			rlpEncodedParentNodes = params.rlpEncodedParentNodes,
			storageRoot = params.storageRoot,
			outboxStatus = params.outboxStatus;
		
		await utils.expectThrow(messageBus.progressOutboxWithProof.call(
			messageTypeHash,
			intentHash,
			nonce,
			// gasPrice,
			// gasLimit,
			sender,
			rlpEncodedParentNodes,
			storageRoot,
			messageStatus,
			// gasConsumed,
			messageHash,
			outboxStatus
		));
	},
	
	progressInboxWithProof: async function(params){
		
		let messageTypeHash = params.messageTypeHash,
			intentHash = params.intentHash,
			nonce = params.nonce,
			gasPrice = params.gasPrice,
			gasLimit = params.gasLimit,
			sender = params.sender,
			gasConsumed = params.gasConsumed,
			messageStatus = params.messageStatus,
			messageHash = params.messageHash,
			rlpEncodedParentNodes = params.rlpEncodedParentNodes,
			storageRoot = params.storageRoot,
			inboxStatus = params.inboxStatus;
		
		await utils.expectThrow(messageBus.progressInboxWithProof.call(
			messageTypeHash,
			intentHash,
			nonce,
			// gasPrice,
			// gasLimit,
			sender,
			rlpEncodedParentNodes,
			storageRoot,
			messageStatus,
			// gasConsumed,
			messageHash,
			inboxStatus
		));
	}
};

module.exports = MessageBusUtils;