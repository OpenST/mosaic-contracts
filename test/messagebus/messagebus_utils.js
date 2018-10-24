'use strict';

const MessageBus = artifacts.require('MessageBusWrapper'),
			utils =  require("./utils");

let messageBus;

const MessageBusUtils = function() {};
MessageBusUtils.prototype = {

	deployedMessageBus: async function(){
		
		messageBus = await MessageBus.new();
		return messageBus;
		
	},
	
	declareMessage: async function(params, changeState){
		
		let messageTypeHash = params.messageTypeHash,
			intentHash = params.intentHash,
			nonce = params.nonce,
			gasPrice = params.gasPrice,
			gasLimit = params.gasLimit,
			sender = params.sender,
			hashLock = params.hashLock,
			gasConsumed = params.gasConsumed,
			signature = params.signature;
		
		if(changeState === false) {
			
			await utils.expectThrow(messageBus.declareMessage.call(
				messageTypeHash,
				intentHash,
				nonce,
				gasPrice,
				gasLimit,
				sender,
				hashLock,
				gasConsumed,
				signature
			));
			
		}
		else{
			
			await messageBus.declareMessage(
				messageTypeHash,
				intentHash,
				nonce,
				gasPrice,
				gasLimit,
				sender,
				hashLock,
				gasConsumed,
				signature
			);
		}
	},
	
	progressOutbox: async function(params, changeState){
		
		let messageTypeHash = params.messageTypeHash,
			intentHash = params.intentHash,
			nonce = params.nonce,
			gasPrice = params.gasPrice,
			gasLimit = params.gasLimit,
			sender = params.sender,
			hashLock = params.hashLock,
			gasConsumed = params.gasConsumed,
			unlockSecret = params.unlockSecret;
		
		if(changeState === false){
			
			await utils.expectThrow(messageBus.progressOutbox.call(
				messageTypeHash,
				intentHash,
				nonce,
				gasPrice,
				gasLimit,
				sender,
				hashLock,
				gasConsumed,
				unlockSecret
			));
			
		}
		else{
			
			await messageBus.progressOutbox(
				messageTypeHash,
				intentHash,
				nonce,
				gasPrice,
				gasLimit,
				sender,
				hashLock,
				gasConsumed,
				unlockSecret
			);
		}
	},
	
	declareRevocationMessage: async function(params, changeState){
		
		let messageTypeHash = params.messageTypeHash,
			intentHash = params.intentHash,
			nonce = params.nonce,
			gasPrice = params.gasPrice,
			gasLimit = params.gasLimit,
			sender = params.sender,
			hashLock = params.hashLock,
			gasConsumed = params.gasConsumed;
		
		if (changeState === false)
		{
			await utils.expectThrow(messageBus.declareRevocationMessage.call(
				messageTypeHash,
				intentHash,
				nonce,
				gasPrice,
				gasLimit,
				sender,
				hashLock,
				gasConsumed
			));
		}
		else
		{
			await messageBus.declareRevocationMessage(
				messageTypeHash,
				intentHash,
				nonce,
				gasPrice,
				gasLimit,
				sender,
				hashLock,
				gasConsumed
			);
		}
	},
	
	progressInbox: async function(params, changeState){
		
		let messageTypeHash = params.messageTypeHash,
			intentHash = params.intentHash,
			nonce = params.nonce,
			gasPrice = params.gasPrice,
			gasLimit = params.gasLimit,
			sender = params.sender,
			hashLock = params.hashLock,
			gasConsumed = params.gasConsumed,
			unlockSecret = params.unlockSecret;
		
		if(changeState === false) {
			
			await utils.expectThrow(messageBus.progressInbox.call(
				messageTypeHash,
				intentHash,
				nonce,
				gasPrice,
				gasLimit,
				sender,
				hashLock,
				gasConsumed,
				unlockSecret
			));
		}
		else
		{
			
			await messageBus.progressInbox(
				messageTypeHash,
				intentHash,
				nonce,
				gasPrice,
				gasLimit,
				sender,
				hashLock,
				gasConsumed,
				unlockSecret
			);
		}
	},
	
	progressInboxRevocation: async function(params, changeState){
		
		let messageTypeHash = params.messageTypeHash,
			intentHash = params.intentHash,
			nonce = params.nonce,
			sender = params.sender,
			messageStatus = params.messageStatus,
			rlpEncodedParentNodes = params.rlpEncodedParentNodes,
			messageBoxOffset = params.messageBoxOffset,
			storageRoot = params.storageRoot,
			hashLock = params.hashLock;
		
		if(changeState === false) {
			
			await utils.expectThrow(messageBus.progressInboxRevocation.call(
				messageTypeHash,
				intentHash,
				nonce,
				sender,
				messageBoxOffset,
				rlpEncodedParentNodes,
				storageRoot,
				messageStatus,
				hashLock
			));
		}
		else
		{
			await messageBus.progressInboxRevocation(
				messageTypeHash,
				intentHash,
				nonce,
				sender,
				messageBoxOffset,
				rlpEncodedParentNodes,
				storageRoot,
				messageStatus,
				hashLock
			)
			
		}
	},
	
	progressOutboxRevocation: async function(params, changeState){
		
		let messageTypeHash = params.messageTypeHash,
			intentHash = params.intentHash,
			nonce = params.nonce,
			sender = params.sender,
			messageStatus = params.messageStatus,
			rlpEncodedParentNodes = params.rlpEncodedParentNodes,
			messageBoxOffset = params.messageBoxOffset,
			storageRoot = params.storageRoot,
			hashLock = params.hashLock;
		
		if(changeState === false) {
			
			await utils.expectThrow(messageBus.progressOutboxRevocation.call(
				messageTypeHash,
				intentHash,
				nonce,
				sender,
				messageBoxOffset,
				rlpEncodedParentNodes,
				storageRoot,
				messageStatus,
				hashLock
			));
		}
		
		else
		{
			await messageBus.progressOutboxRevocation(
				messageTypeHash,
				intentHash,
				nonce,
				sender,
				messageBoxOffset,
				rlpEncodedParentNodes,
				storageRoot,
				messageStatus,
				hashLock
			);
		}
	},
	
	confirmRevocation: async function(params, changeState){
		
		let messageTypeHash = params.messageTypeHash,
			intentHash = params.intentHash,
			nonce = params.nonce,
			rlpEncodedParentNodes = params.rlpEncodedParentNodes,
			messageBoxOffset = params.messageBoxOffset,
			storageRoot = params.storageRoot,
			sender = params.sender,
			hashLock = params.hashLock;
		
		if(changeState === false) {
			
			await utils.expectThrow(messageBus.confirmRevocation.call(
				messageTypeHash,
				intentHash,
				nonce,
				sender,
				messageBoxOffset,
				rlpEncodedParentNodes,
				storageRoot,
				hashLock
			));
		}
		else
		{
			
			await messageBus.confirmRevocation(
				messageTypeHash,
				intentHash,
				nonce,
				sender,
				messageBoxOffset,
				rlpEncodedParentNodes,
				storageRoot,
				hashLock
			);
		
		}
	},
	
	confirmMessage: async function(params, changeState){
		
		let messageTypeHash = params.messageTypeHash,
			intentHash = params.intentHash,
			nonce = params.nonce,
			sender = params.sender,
			rlpEncodedParentNodes = params.rlpEncodedParentNodes,
			storageRoot = params.storageRoot,
			messageBoxOffset = params.messageBoxOffset,
			hashLock = params.hashLock;
		
		if(changeState === false)
		{
			
			await utils.expectThrow((messageBus.confirmMessage.call(
				messageTypeHash,
				intentHash,
				nonce,
				sender,
				rlpEncodedParentNodes,
				storageRoot,
				messageBoxOffset,
				hashLock
			)));
			
		}
		else
		{
			await messageBus.confirmMessage(
				messageTypeHash,
				intentHash,
				nonce,
				sender,
				rlpEncodedParentNodes,
				storageRoot,
				messageBoxOffset,
				hashLock
			);
		}
	},
	
	progressOutboxWithProof: async function(params, changeState){
		
		let messageTypeHash = params.messageTypeHash,
			intentHash = params.intentHash,
			nonce = params.nonce,
			sender = params.sender,
			messageStatus = params.messageStatus,
			rlpEncodedParentNodes = params.rlpEncodedParentNodes,
			storageRoot = params.storageRoot,
			hashLock = params.hashLock;
		
		if (changeState === false) {
			
			await utils.expectThrow(messageBus.progressOutboxWithProof.call(
				messageTypeHash,
				intentHash,
				nonce,
				sender,
				rlpEncodedParentNodes,
				storageRoot,
				messageStatus,
				hashLock
			));
		}
		else
		{
			
			await messageBus.progressOutboxWithProof(
				messageTypeHash,
				intentHash,
				nonce,
				sender,
				rlpEncodedParentNodes,
				storageRoot,
				messageStatus,
				hashLock
			);
			
		}
	},
	
	progressInboxWithProof: async function(params, changeState){
		
		let messageTypeHash = params.messageTypeHash,
			intentHash = params.intentHash,
			nonce = params.nonce,
			sender = params.sender,
			messageStatus = params.messageStatus,
			rlpEncodedParentNodes = params.rlpEncodedParentNodes,
			storageRoot = params.storageRoot,
			hashLock = params.hashLock;
		
		if(changeState === false) {
			await utils.expectThrow(messageBus.progressInboxWithProof.call(
				messageTypeHash,
				intentHash,
				nonce,
				sender,
				rlpEncodedParentNodes,
				storageRoot,
				messageStatus,
				hashLock
			));
		}
		else
		{
			
			await messageBus.progressInboxWithProof(
				messageTypeHash,
				intentHash,
				nonce,
				sender,
				rlpEncodedParentNodes,
				storageRoot,
				messageStatus,
				hashLock
			);
			
		}
	},
	
	getOutboxStatus : async function(msgHash){
	
		return messageBus.getOutboxStatus.call(msgHash);
	
	},
	
	getInboxStatus : async function(msgHash){
		
		return messageBus.getInboxStatus.call(msgHash);
		
	}
};

module.exports = MessageBusUtils;