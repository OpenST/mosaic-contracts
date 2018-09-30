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
contract MessageBusTestWrapper {

    MockMessageBus.MessageBox messageBox;

    bytes32 unlockSecret = keccak256(abi.encodePacked('secret'));
    bytes32 unlockSecret1 = keccak256(abi.encodePacked('secret1'));
    bytes32 hashLock = keccak256(abi.encodePacked(unlockSecret));
    bytes32 intentHash = keccak256(abi.encodePacked('intent'));
    uint256 nonce = 1;
    uint256 gasPrice = 0x12A05F200;
    uint256 gasLimit = 0x12A05F200;
    uint256 gasConsumed = 0;

    bytes rlpEncodedParentNodes = '0xf8f8f8b18080a011eb05caf5fa62e9b0fffc9118cf6c7a6f10870db11d837223bf585fc7283b2c80a0be65b7596c589a734b53d15e0cc9f13eae2083bf0173b1c2baf1534d9273882d8080808080a0997f2ab256882c505e8887d9f7622a18a17dc5727a0e9d04d314e59d482a508780a088976b814f3477b2d25aa3992c31abc4a4299557a6e94ca7786a440b15a07f1e80a04b140101c7c54b2c4d69e4cf35a353d7d969e439c48fe7388eaec325f1bfe6578080f843a0390decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e563a1a03132333400000000000000000000000000000000000000000000000000000008' ;
    uint8 outboxOffset = 0;
    bytes32 storageRoot = 0x70b4172eb30c495bf20b5b12224cd2380fccdd7ffa2292416b9dbdfc8511585d;

    bytes32 constant STAKE_TYPEHASH = keccak256(
        abi.encode(
            "Stake(uint256 amount,address beneficiary,MessageBus.Message message)"
        )
    );

    bytes32 messageTypeHash = keccak256(abi.encodePacked("gatewayLink"));


    /* Signature Verification Parameters */
    address sender = address(0x8014986b452DE9f00ff9B036dcBe522f918E2fE4);
    bytes32 hashedMessage = 0xbc36789e7a1e281436464229828f817d6612f7b477d66591ff96a9e064bcc98a;
    bytes32 messageHash = MockMessageBus.messageDigest(
        STAKE_TYPEHASH,
        intentHash,
        nonce,
        gasPrice,
        gasLimit
    );
    MockMessageBus.Message message = MockMessageBus.Message({
        intentHash : intentHash,
        nonce : nonce,
        gasPrice : gasPrice,
        gasLimit : gasLimit,
        sender : sender,
        hashLock : hashLock,
        gasConsumed: gasConsumed
        });


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
        bytes _signature,
        MockMessageBus.MessageStatus  _status,
        bytes32 _messageHash
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
        messageBox.outbox[_messageHash] = _status;

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
        MockMessageBus.MessageStatus  _status,
        bytes32 _messageHash,
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

        messageBox.outbox[_messageHash] = _status;

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
        MockMessageBus.MessageStatus  _status,
        bytes32 _messageHash,
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

        messageBox.inbox[_messageHash] = _status;

        messageHash_ = MockMessageBus.progressOutbox(
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
        bytes32 _messageHash,
        MockMessageBus.MessageStatus _inboxStatus
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
            hashLock : hashLock,
            gasConsumed: 0
        });

        messageBox.inbox[_messageHash] = _inboxStatus;
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
        bytes32 _messageHash,
        MockMessageBus.MessageStatus _outboxStatus
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
            hashLock : hashLock,
            gasConsumed: 0
        });

        messageBox.outbox[_messageHash] = _outboxStatus;
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
        MockMessageBus.MessageStatus _messageStatus,
        bytes32 _messageHash
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
            hashLock : hashLock,
            gasConsumed: 0
        });

        messageBox.inbox[_messageHash] = _messageStatus;
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
        MockMessageBus.MessageStatus _messageStatus,
        bytes32 _messageHash
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
            hashLock : hashLock,
            gasConsumed: 0
        });

        messageBox.inbox[_messageHash] = _messageStatus;
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
        uint256 _gasConsumed,
        MockMessageBus.MessageStatus  _status,
        bytes32 _messageHash
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
        messageBox.outbox[_messageHash] = _status;

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
        bytes32 _messageHash,
        MockMessageBus.MessageStatus _outboxStatus
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
            hashLock : hashLock,
            gasConsumed: 0
        });

        // When the state for messageHash in inbox is DeclaredRevocation
        // with outbox state for messageHash is DeclaredRevocation
        messageBox.outbox[_messageHash] = _outboxStatus;
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
        bytes32 _messageHash,
        MockMessageBus.MessageStatus _inboxStatus
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
            hashLock : hashLock,
            gasConsumed: 0
        });

        messageBox.inbox[_messageHash] = _inboxStatus;
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

}

