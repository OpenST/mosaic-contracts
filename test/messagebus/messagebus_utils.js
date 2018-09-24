'use strict'

const messageBusTest = artifacts.require("TestMessageBus");
const web3 = require("web3");
const utils =  require("../lib/utils");
// const message = artifacts.require("MessageBus");

var messageBus,messageInstance;
const MessageBusUtils = function() {};
MessageBusUtils.prototype = {

	deployedMessageBus: async function(){
		
		messageBus = await messageBusTest.new();
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
		
	}
};

module.exports = MessageBusUtils;