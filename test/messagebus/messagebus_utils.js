'use strict'

const MessageBus = artifacts.require('MessageBusTestWrapper'),
			web3 = require("web3"),
			utils =  require("../lib/utils");

let messageBus;

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
			sender = params.sender,
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
			sender,
			messageBoxOffset,
			rlpEncodedParentNodes,
			storageRoot,
			messageStatus,
			messageHash,
			inboxStatus
		));
	},
	
	progressOutboxRevocation: async function(params){
		
		let messageTypeHash = params.messageTypeHash,
			intentHash = params.intentHash,
			nonce = params.nonce,
			sender = params.sender,
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
			sender,
			messageBoxOffset,
			rlpEncodedParentNodes,
			storageRoot,
			messageStatus,
			messageHash,
			inboxStatus
		));
	},
	
	confirmRevocation: async function(params){
		
		let messageTypeHash = params.messageTypeHash,
			intentHash = params.intentHash,
			nonce = params.nonce,
			messageStatus = params.messageStatus,
			messageHash = params.messageHash,
			rlpEncodedParentNodes = params.rlpEncodedParentNodes,
			messageBoxOffset = params.messageBoxOffset,
			storageRoot = params.storageRoot;
		
		await utils.expectThrow(messageBus.confirmRevocation.call(
			messageTypeHash,
			intentHash,
			nonce,
			messageBoxOffset,
			rlpEncodedParentNodes,
			storageRoot,
			messageStatus,
			messageHash
		));
	},
	
	confirmMessage: async function(params){
		
		let messageTypeHash = params.messageTypeHash,
			intentHash = params.intentHash,
			nonce = params.nonce,
			sender = params.sender,
			messageStatus = params.messageStatus,
			messageHash = params.messageHash,
			rlpEncodedParentNodes = params.rlpEncodedParentNodes,
			storageRoot = params.storageRoot;
		
		await utils.expectThrow(messageBus.confirmMessage.call(
			messageTypeHash,
			intentHash,
			nonce,
			sender,
			rlpEncodedParentNodes,
			storageRoot,
			messageStatus,
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
			sender = params.sender,
			messageStatus = params.messageStatus,
			messageHash = params.messageHash,
			rlpEncodedParentNodes = params.rlpEncodedParentNodes,
			storageRoot = params.storageRoot,
			outboxStatus = params.outboxStatus;
		
		await utils.expectThrow(messageBus.progressOutboxWithProof.call(
			messageTypeHash,
			intentHash,
			nonce,
			sender,
			rlpEncodedParentNodes,
			storageRoot,
			messageStatus,
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
			sender,
			rlpEncodedParentNodes,
			storageRoot,
			messageStatus,
			messageHash,
			inboxStatus
		));
	}
};

module.exports = MessageBusUtils;