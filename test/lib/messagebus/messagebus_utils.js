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
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------
//

'use strict';

const MessageBus = artifacts.require('MessageBusWrapper'),
    utils = require('../../test_lib/utils');

let messageBus;

const MessageBusUtils = function () {
};
MessageBusUtils.prototype = {

    deployedMessageBus: async function () {

        messageBus = await MessageBus.new();
        return messageBus;

    },

    declareMessage: async function (params, changeState) {

        let messageTypeHash = params.messageTypeHash,
            intentHash = params.intentHash,
            nonce = params.nonce,
            gasPrice = params.gasPrice,
            gasLimit = params.gasLimit,
            sender = params.sender,
            hashLock = params.hashLock,
            gasConsumed = params.gasConsumed;

        if (changeState === false) {
            await utils.expectRevert(
                messageBus.declareMessage(
                    messageTypeHash,
                    intentHash,
                    nonce,
                    gasPrice,
                    gasLimit,
                    sender,
                    hashLock,
                    gasConsumed
                ),
                params.message
            );

        }
        else {
            await messageBus.declareMessage(
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

    progressOutbox: async function (params, changeState) {

        let messageTypeHash = params.messageTypeHash,
            intentHash = params.intentHash,
            nonce = params.nonce,
            gasPrice = params.gasPrice,
            gasLimit = params.gasLimit,
            sender = params.sender,
            hashLock = params.hashLock,
            gasConsumed = params.gasConsumed,
            unlockSecret = params.unlockSecret;

        if (changeState === false) {

            await utils.expectRevert(
                messageBus.progressOutbox(
                    messageTypeHash,
                    intentHash,
                    nonce,
                    gasPrice,
                    gasLimit,
                    sender,
                    hashLock,
                    gasConsumed,
                    unlockSecret
                ),
                params.message
            );

        }
        else {

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

    declareRevocationMessage: async function (params, changeState) {

        let messageTypeHash = params.messageTypeHash,
            intentHash = params.intentHash,
            nonce = params.nonce,
            gasPrice = params.gasPrice,
            gasLimit = params.gasLimit,
            sender = params.sender,
            hashLock = params.hashLock,
            gasConsumed = params.gasConsumed;

        if (changeState === false) {
            await utils.expectRevert(
                messageBus.declareRevocationMessage.call(
                    messageTypeHash,
                    intentHash,
                    nonce,
                    gasPrice,
                    gasLimit,
                    sender,
                    hashLock,
                    gasConsumed
                ),
                params.message
            )
            ;
        }
        else {
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

    progressInbox: async function (params, changeState) {

        let messageTypeHash = params.messageTypeHash,
            intentHash = params.intentHash,
            nonce = params.nonce,
            gasPrice = params.gasPrice,
            gasLimit = params.gasLimit,
            sender = params.sender,
            hashLock = params.hashLock,
            gasConsumed = params.gasConsumed,
            unlockSecret = params.unlockSecret;

        if (changeState === false) {

            await utils.expectRevert(
                messageBus.progressInbox.call(
                    messageTypeHash,
                    intentHash,
                    nonce,
                    gasPrice,
                    gasLimit,
                    sender,
                    hashLock,
                    gasConsumed,
                    unlockSecret
                ),
                params.message
            );
        }
        else {

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

    progressInboxRevocation: async function (params, changeState) {

        let messageTypeHash = params.messageTypeHash,
            intentHash = params.intentHash,
            nonce = params.nonce,
            sender = params.sender,
            messageStatus = params.messageStatus,
            rlpParentNodes = params.rlpParentNodes,
            messageBoxOffset = params.messageBoxOffset,
            storageRoot = params.storageRoot,
            hashLock = params.hashLock;

        if (changeState === false) {

            await utils.expectRevert(
                messageBus.progressInboxRevocation.call(
                    messageTypeHash,
                    intentHash,
                    nonce,
                    sender,
                    messageBoxOffset,
                    rlpParentNodes,
                    storageRoot,
                    messageStatus,
                    hashLock
                ),
                params.message
            );
        }
        else {
            await messageBus.progressInboxRevocation(
                messageTypeHash,
                intentHash,
                nonce,
                sender,
                messageBoxOffset,
                rlpParentNodes,
                storageRoot,
                messageStatus,
                hashLock
            )

        }
    },

    progressOutboxRevocation: async function (params, changeState) {

        let messageTypeHash = params.messageTypeHash,
            intentHash = params.intentHash,
            nonce = params.nonce,
            sender = params.sender,
            messageStatus = params.messageStatus,
            rlpParentNodes = params.rlpParentNodes,
            messageBoxOffset = params.messageBoxOffset,
            storageRoot = params.storageRoot,
            hashLock = params.hashLock;

        if (changeState === false) {

            await utils.expectRevert(
                messageBus.progressOutboxRevocation.call(
                    messageTypeHash,
                    intentHash,
                    nonce,
                    sender,
                    messageBoxOffset,
                    rlpParentNodes,
                    storageRoot,
                    messageStatus,
                    hashLock
                ),
                params.message
            );
        }

        else {
            await messageBus.progressOutboxRevocation(
                messageTypeHash,
                intentHash,
                nonce,
                sender,
                messageBoxOffset,
                rlpParentNodes,
                storageRoot,
                messageStatus,
                hashLock
            );
        }
    },

    confirmRevocation: async function (params, changeState) {

        let messageTypeHash = params.messageTypeHash,
            intentHash = params.intentHash,
            nonce = params.nonce,
            rlpParentNodes = params.rlpParentNodes,
            messageBoxOffset = params.messageBoxOffset,
            storageRoot = params.storageRoot,
            sender = params.sender,
            hashLock = params.hashLock;

        if (changeState === false) {

            await utils.expectRevert(
                messageBus.confirmRevocation(
                    messageTypeHash,
                    intentHash,
                    nonce,
                    sender,
                    messageBoxOffset,
                    rlpParentNodes,
                    storageRoot,
                    hashLock
                ),
                params.message
            );
        }
        else {

            await messageBus.confirmRevocation(
                messageTypeHash,
                intentHash,
                nonce,
                sender,
                messageBoxOffset,
                rlpParentNodes,
                storageRoot,
                hashLock
            );

        }
    },

    confirmMessage: async function (params, changeState) {

        let messageTypeHash = params.messageTypeHash,
            intentHash = params.intentHash,
            nonce = params.nonce,
            sender = params.sender,
            rlpParentNodes = params.rlpParentNodes,
            storageRoot = params.storageRoot,
            messageBoxOffset = params.messageBoxOffset,
            hashLock = params.hashLock;

        if (changeState === false) {

            await utils.expectRevert(
                messageBus.confirmMessage(
                    messageTypeHash,
                    intentHash,
                    nonce,
                    sender,
                    rlpParentNodes,
                    storageRoot,
                    messageBoxOffset,
                    hashLock
                ),
                params.message
            );

        }
        else {
            await messageBus.confirmMessage(
                messageTypeHash,
                intentHash,
                nonce,
                sender,
                rlpParentNodes,
                storageRoot,
                messageBoxOffset,
                hashLock
            );
        }
    },

    progressOutboxWithProof: async function (params, changeState) {

        let messageTypeHash = params.messageTypeHash,
            intentHash = params.intentHash,
            nonce = params.nonce,
            sender = params.sender,
            messageStatus = params.messageStatus,
            rlpParentNodes = params.rlpParentNodes,
            storageRoot = params.storageRoot,
            hashLock = params.hashLock,
            messageBoxOffset = params.messageBoxOffset;
        ;

        if (changeState === false) {

            await utils.expectThrow(
                messageBus.progressOutboxWithProof.call(
                    messageTypeHash,
                    intentHash,
                    nonce,
                    sender,
                    rlpParentNodes,
                    storageRoot,
                    messageStatus,
                    hashLock,
                    messageBoxOffset
                )
            );
        }
        else {

            await messageBus.progressOutboxWithProof(
                messageTypeHash,
                intentHash,
                nonce,
                sender,
                rlpParentNodes,
                storageRoot,
                messageStatus,
                hashLock,
                messageBoxOffset
            );

        }
    },

    progressInboxWithProof: async function (params, changeState) {

        let messageTypeHash = params.messageTypeHash,
            intentHash = params.intentHash,
            nonce = params.nonce,
            sender = params.sender,
            messageStatus = params.messageStatus,
            rlpParentNodes = params.rlpParentNodes,
            storageRoot = params.storageRoot,
            hashLock = params.hashLock,
            messageBoxOffset = params.messageBoxOffset;

        if (changeState === false) {
            await utils.expectRevert(
                messageBus.progressInboxWithProof(
                    messageTypeHash,
                    intentHash,
                    nonce,
                    sender,
                    rlpParentNodes,
                    storageRoot,
                    messageStatus,
                    hashLock,
                    messageBoxOffset
                ),
                params.message
            );
        }
        else {

            await messageBus.progressInboxWithProof(
                messageTypeHash,
                intentHash,
                nonce,
                sender,
                rlpParentNodes,
                storageRoot,
                messageStatus,
                hashLock,
                messageBoxOffset
            );

        }
    },

    getOutboxStatus: async function (msgHash) {

        return messageBus.getOutboxStatus.call(msgHash);

    },

    getInboxStatus: async function (msgHash) {

        return messageBus.getInboxStatus.call(msgHash);

    },

    utils: utils
};

module.exports = MessageBusUtils;
