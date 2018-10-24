pragma solidity ^0.4.23;

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

import "../../contracts/gateway/MockMessageBus.sol";

/**
 * @title Tests the MessageBus library.
 */
contract MessageBusWrapper {

    MockMessageBus.MessageBox messageBox;
    MockMessageBus.Message message;

    function declareMessage
    (
        bytes32 _messageTypeHash,
        bytes32 _intentHash,
        uint256 _nonce,
        uint256 _gasPrice,
        uint256 _gasLimit,
        address _sender,
        bytes32 _hashLock,
        uint256 _gasConsumed,
        bytes _signature
    )
        public
        returns(bytes32)
    {

        message = MockMessageBus.Message({
            intentHash : _intentHash,
            nonce : _nonce,
            gasPrice : _gasPrice,
            sender : _sender,
            gasLimit : _gasLimit,
            hashLock : _hashLock,
            gasConsumed: _gasConsumed
        });

        bytes32 messageHashFromDeclare= MockMessageBus.declareMessage(
            messageBox,
            _messageTypeHash,
            message,
            _signature
        );

        return(messageHashFromDeclare);
    }

    function progressOutbox
    (
        bytes32 _messageTypeHash,
        bytes32 _intentHash,
        uint256 _nonce,
        uint256 _gasPrice,
        uint256 _gasLimit,
        address _sender,
        bytes32 _hashLock,
        uint256 _gasConsumed,
        bytes32 _unlockSecret
    )
        public
        returns(bytes32 messageHash_)
    {
        message = MockMessageBus.Message({
            intentHash : _intentHash,
            nonce : _nonce,
            gasPrice : _gasPrice,
            sender : _sender,
            gasLimit : _gasLimit,
            hashLock : _hashLock,
            gasConsumed: _gasConsumed
        });

        messageHash_ = MockMessageBus.progressOutbox(
            messageBox,
            _messageTypeHash,
            message,
            _unlockSecret
        );
    }

    function progressInbox
    (
        bytes32 _messageTypeHash,
        bytes32 _intentHash,
        uint256 _nonce,
        uint256 _gasPrice,
        uint256 _gasLimit,
        address _sender,
        bytes32 _hashLock,
        uint256 _gasConsumed,
        bytes32 _unlockSecret
    )
        public
        returns(bytes32 messageHash_)
    {
        message = MockMessageBus.Message({
            intentHash : _intentHash,
            nonce : _nonce,
            gasPrice : _gasPrice,
            sender : _sender,
            gasLimit : _gasLimit,
            hashLock : _hashLock,
            gasConsumed: _gasConsumed
        });

        messageHash_ = MockMessageBus.progressInbox(
            messageBox,
            _messageTypeHash,
            message,
            _unlockSecret
        );
    }

    function progressInboxRevocation
    (
        bytes32 _messageTypeHash,
        bytes32 _intentHash,
        uint256 _nonce,
        address _sender,
        uint8 _messageBoxOffset,
        bytes _rlpEncodedParentNodes,
        bytes32 _storageRoot,
        MockMessageBus.MessageStatus _messageStatus,
        bytes32 _hashLock
    )
        public
        returns(bytes32 messageHash_)
    {
        message = MockMessageBus.Message({
            intentHash : _intentHash,
            nonce : _nonce,
            gasPrice : uint256(0x12A05F200),
            sender : _sender,
            gasLimit : 0,
            hashLock : _hashLock,
            gasConsumed: 0
        });

        messageHash_ = MockMessageBus.progressInboxRevocation(
            messageBox,
            message,
            _messageTypeHash,
            _messageBoxOffset,
            _rlpEncodedParentNodes,
            _storageRoot,
            _messageStatus
        );
    }

    function progressOutboxRevocation
    (
        bytes32 _messageTypeHash,
        bytes32 _intentHash,
        uint256 _nonce,
        address _sender,
        uint8 _messageBoxOffset,
        bytes _rlpEncodedParentNodes,
        bytes32 _storageRoot,
        MockMessageBus.MessageStatus _messageStatus,
        bytes32 _hashLock
    )
        public
        returns(bytes32 messageHash_)
    {
        message = MockMessageBus.Message({
            intentHash : _intentHash,
            nonce : _nonce,
            gasPrice : uint256(0x12A05F200),
            sender : _sender,
            gasLimit : 0,
            hashLock : _hashLock,
            gasConsumed: 0
        });

        messageHash_ = MockMessageBus.progressOutboxRevocation(
            messageBox,
            message,
            _messageTypeHash,
            _messageBoxOffset,
            _rlpEncodedParentNodes,
            _storageRoot,
            _messageStatus
        );
    }

    function confirmRevocation
    (
        bytes32 _messageTypeHash,
        bytes32 _intentHash,
        uint256 _nonce,
        address _sender,
        uint8 _messageBoxOffset,
        bytes _rlpEncodedParentNodes,
        bytes32 _storageRoot,
        bytes32 _hashLock
    )
        public
        returns(bytes32 messageHash_)
    {
        message = MockMessageBus.Message({
            intentHash : _intentHash,
            nonce : _nonce,
            gasPrice : uint256(0x12A05F200),
            sender : _sender,
            gasLimit : 0,
            hashLock : _hashLock,
            gasConsumed: 0
        });

        messageHash_ = MockMessageBus.confirmRevocation(
            messageBox,
            _messageTypeHash,
            message,
            _rlpEncodedParentNodes,
            _messageBoxOffset,
            _storageRoot
        );
    }

    function confirmMessage
    (
        bytes32 _messageTypeHash,
        bytes32 _intentHash,
        uint256 _nonce,
        address _sender,
        bytes _rlpEncodedParentNodes,
        bytes32 _storageRoot,
        uint8 _messageBoxOffset,
        bytes32 _hashLock
    )
        public
        returns(bytes32 messageHash_)
    {
        message = MockMessageBus.Message({
            intentHash : _intentHash,
            nonce : _nonce,
            gasPrice : uint256(0x12A05F200),
            sender : _sender,
            gasLimit : 0,
            hashLock : _hashLock,
            gasConsumed: 0
        });

        messageHash_ = MockMessageBus.confirmMessage(
            messageBox,
            _messageTypeHash,
            message,
            _rlpEncodedParentNodes,
            _messageBoxOffset,
            _storageRoot
        );
    }

    function declareRevocationMessage
    (
        bytes32 _messageTypeHash,
        bytes32 _intentHash,
        uint256 _nonce,
        uint256 _gasPrice,
        uint256 _gasLimit,
        address _sender,
        bytes32 _hashLock,
        uint256 _gasConsumed
    )
        public
        returns(bytes32 messageHash_)
    {

        message = MockMessageBus.Message({
            intentHash : _intentHash,
            nonce : _nonce,
            gasPrice : _gasPrice,
            sender : _sender,
            gasLimit : _gasLimit,
            hashLock : _hashLock,
            gasConsumed: _gasConsumed
            });

        messageHash_= MockMessageBus.declareRevocationMessage(
            messageBox,
            _messageTypeHash,
            message
        );

    }

    function progressOutboxWithProof
    (
        bytes32 _messageTypeHash,
        bytes32 _intentHash,
        uint256 _nonce,
        address _sender,
        bytes _rlpEncodedParentNodes,
        bytes32 _storageRoot,
        MockMessageBus.MessageStatus _messageStatus,
        bytes32 _hashLock
    )
        public
        returns(bytes32 messageHash_)
    {
        message = MockMessageBus.Message({
            intentHash : _intentHash,
            nonce : _nonce,
            gasPrice : uint256(0x12A05F200),
            sender : _sender,
            gasLimit : 0,
            hashLock : _hashLock,
            gasConsumed: 0
        });

        messageHash_ = MockMessageBus.progressOutboxWithProof(
            messageBox,
            _messageTypeHash,
            message,
            _rlpEncodedParentNodes,
            1,
            _storageRoot,
            _messageStatus
        );

    }

    function progressInboxWithProof
    (
        bytes32 _messageTypeHash,
        bytes32 _intentHash,
        uint256 _nonce,
        address _sender,
        bytes _rlpEncodedParentNodes,
        bytes32 _storageRoot,
        MockMessageBus.MessageStatus _messageStatus,
        bytes32 _hashLock
    )
        public
        returns(bytes32 messageHash_)
    {
        message = MockMessageBus.Message({
            intentHash : _intentHash,
            nonce : _nonce,
            gasPrice : uint256(0x12A05F200),
            sender : _sender,
            gasLimit : 0,
            hashLock : _hashLock,
            gasConsumed: 0
        });

        messageHash_ = MockMessageBus.progressInboxWithProof(
            messageBox,
            _messageTypeHash,
            message,
            _rlpEncodedParentNodes,
            1,
            _storageRoot,
            _messageStatus
        );
    }

    function getOutboxStatus(bytes32 _messageHash)
        public
        view
        returns(uint256)
    {

        return uint256(messageBox.outbox[_messageHash]);

    }

    function getInboxStatus(bytes32 _messageHash)
        public
        view
        returns(uint256)
    {

        return uint256(messageBox.inbox[_messageHash]);

    }

}

