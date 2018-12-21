pragma solidity ^0.5.0;

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
// Origin Chain: MessageBusWrapper
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

import "./lib/MockMessageBus.sol";

/**
 * @title Tests the MessageBus library.
 */
contract MessageBusWrapper {

    MockMessageBus.MessageBox messageBox;
    MockMessageBus.Message message;

    /**
     * @notice Declare a new message. This will update the outbox status to
     *         `Declared` for the given message hash.
     *
     * @param _intentHash Intent hash.
     * @param _nonce Message nonce.
     * @param _gasPrice Price at which reward is calculated.
     * @param _gasLimit Maximum amount of gas can be used for reward.
     * @param _sender Message sender.
     * @param _hashLock Hash lock.
     * @param _gasConsumed Gas consumption during message confirmation.
     *
     * @return messageHash_ Message hash.
     */
    function declareMessage(
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

        messageHash_ = MockMessageBus.declareMessage(
            messageBox,
            message
        );

    }

    /**
     * @notice Update the status for the outbox for a given message hash to
     *         `Progressed`.
     *
     * @param _intentHash Intent hash.
     * @param _nonce Message nonce.
     * @param _gasPrice Price at which reward is calculated.
     * @param _gasLimit Maximum amount of gas can be used for reward.
     * @param _sender Signer of the signature.
     * @param _hashLock Hash lock.
     * @param _gasConsumed Gas consumption during message confirmation.
     * @param _unlockSecret Unlock secret for the hash lock provided while
     *                      declaration.
     *
     * @return messageHash_ Message hash.
     */
    function progressOutbox(
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
            message,
            _unlockSecret
        );
    }

    /**
     * @notice Update the status for the outbox for a given message hash to
     *         `Progressed`.
     *
     * @param _intentHash Intent hash.
     * @param _nonce Message nonce.
     * @param _gasPrice Price at which reward is calculated.
     * @param _gasLimit Maximum amount of gas can be used for reward.
     * @param _sender Signer of the signature.
     * @param _hashLock Hash lock.
     * @param _gasConsumed Gas consumption during message confirmation.
     * @param _unlockSecret Unlock secret for the hash lock provided while
     *                      declaration.
     *
     * @return messageHash_ Message hash.
     */
    function progressInbox(
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
            message,
            _unlockSecret
        );
    }

    /**
     * @notice Update the status for the outbox for a given message hash to
     *         `Revoked`. Merkle proof is used to verify status of inbox in
     *         source chain.
     *
     * @dev The messsage status in the inbox should be `Revoked`.
     *      This will be verified in the merkle proof.
     *
     * @param _intentHash Intent hash.
     * @param _nonce Message nonce.
     * @param _sender Message sender.
     * @param _messageBoxOffset Position of the messageBox.
     * @param _rlpParentNodes RLP encoded parent node data to prove in
     *                        messageBox inbox.
     * @param _storageRoot Storage root for proof.
     * @param _messageStatus Message status of message hash in the inbox of
     *                       source chain.
     * @param _hashLock Hash lock.
     *
     * @return messageHash_ Message hash.
     */
    function progressOutboxRevocation(
        bytes32 _intentHash,
        uint256 _nonce,
        address _sender,
        uint8 _messageBoxOffset,
        bytes memory _rlpParentNodes,
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
            _messageBoxOffset,
            _rlpParentNodes,
            _storageRoot,
            _messageStatus
        );
    }

    /**
     * @notice Confirm a revocation message that is declared in the outbox of
     *         source chain. This will update the outbox status to
     *         `Revoked` for the given message hash.
     *
     * @dev In order to declare revocation the existing message status for the
     *      given message hash should be `Declared`.
     *
     * @param _intentHash Intent hash.
     * @param _nonce Message nonce.
     * @param _sender Message sender.
     * @param _rlpParentNodes RLP encoded parent node data to prove in
     *                        messageBox outbox.
     * @param _messageBoxOffset Position of the messageBox.
     * @param _storageRoot Storage root for proof.
     * @param _hashLock Hash lock.
     *
     * @return messageHash_ Message hash.
     */
    function confirmRevocation(
        bytes32 _intentHash,
        uint256 _nonce,
        address _sender,
        uint8 _messageBoxOffset,
        bytes memory _rlpParentNodes,
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
            message,
            _rlpParentNodes,
            _messageBoxOffset,
            _storageRoot
        );
    }

    /**
     * @notice Confirm a new message that is declared in outbox on the source
     *         chain. Merkle proof will be performed to verify the declared
     *         status in source chains outbox. This will update the inbox
     *         status to `Declared` for the given message hash.
     *
     * @param _intentHash Intent hash.
     * @param _nonce Message nonce.
     * @param _sender Message sender.
     * @param _rlpParentNodes RLP encoded parent node data to prove in
     *                        messageBox outbox.
     * @param _messageBoxOffset Position of the messageBox.
     * @param _storageRoot Storage root for proof.
     * @param _hashLock Hash lock.
     *
     * @return messageHash_ Message hash
     */
    function confirmMessage(
        bytes32 _intentHash,
        uint256 _nonce,
        address _sender,
        bytes memory _rlpParentNodes,
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
            message,
            _rlpParentNodes,
            _messageBoxOffset,
            _storageRoot
        );
    }

    /**
     * @notice Declare a new revocation message. This will update the outbox
     *         status to `DeclaredRevocation` for the given message hash.
     *
     * @dev In order to declare revocation the existing message status for the
     *      given message hash should be `Declared`.
     *
     * @param _intentHash Intent hash.
     * @param _nonce Message nonce.
     * @param _gasPrice Price at which reward is calculated.
     * @param _gasLimit Maximum amount of gas can be used for reward.
     * @param _sender Message sender.
     * @param _hashLock Hash lock.
     * @param _gasConsumed Gas consumption during message confirmation.
     *
     * @return messageHash_ Message hash.
     */
    function declareRevocationMessage(
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

        messageHash_ = MockMessageBus.declareRevocationMessage(
            messageBox,
            message
        );

    }

    /**
     * @notice Update the status for the outbox for a given message hash to
     *         `Progressed`. Merkle proof is used to verify status of inbox in
     *         source chain. This is an alternative approach to hashlocks.
     *
     * @dev The messsage status for the message hash in the inbox should be
     *      either `Declared` or `Progresses`. Either of this status will be
     *      verified in the merkle proof.
     *
     * @param _intentHash Intent hash.
     * @param _nonce Message nonce.
     * @param _sender Message sender.
     * @param _rlpParentNodes RLP encoded parent node data to prove in
     *                        messageBox inbox.
     * @param _storageRoot Storage root for proof.
     * @param _messageStatus Message status of message hash in the inbox of
     *                       source chain.
     * @param _hashLock Hash lock.
     *
     * @return messageHash_ Message hash.
     */
    function progressOutboxWithProof(
        bytes32 _intentHash,
        uint256 _nonce,
        address _sender,
        bytes memory _rlpParentNodes,
        bytes32 _storageRoot,
        MockMessageBus.MessageStatus _messageStatus,
        bytes32 _hashLock,
        uint8 _messageBoxOffset
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
            message,
            _rlpParentNodes,
            _messageBoxOffset,
            _storageRoot,
            _messageStatus
        );

    }

    /**
     * @notice Update the status for the inbox for a given message hash to
     *         `Progressed`. Merkle proof is used to verify status of outbox in
     *         source chain. This is an alternative approach to hashlocks.
     *
     * @dev The messsage status for the message hash in the outbox should be
     *      either `Declared` or `Progresses`. Either of this status will be
     *      verified in the merkle proof.
     *
     * @param _intentHash Intent hash.
     * @param _nonce Message nonce.
     * @param _sender Message sender.
     * @param _rlpParentNodes RLP encoded parent node data to prove in
     *                        messageBox outbox.
     * @param _storageRoot Storage root for proof.
     * @param _messageStatus Message status of message hash in the outbox of
     *                       source chain.
     *
     * @return messageHash_ Message hash.
     */
    function progressInboxWithProof(
        bytes32 _intentHash,
        uint256 _nonce,
        address _sender,
        bytes memory _rlpParentNodes,
        bytes32 _storageRoot,
        MockMessageBus.MessageStatus _messageStatus,
        bytes32 _hashLock,
        uint8 _messageBoxOffset
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
            message,
            _rlpParentNodes,
            _messageBoxOffset,
            _storageRoot,
            _messageStatus
        );
    }

    /**
     * @notice Returns the status of message stored in the outbox.
     *
     * @param _messageHash Message hash.
     *
     * @return status_ Status of message in the outbox.
     */
    function getOutboxStatus(bytes32 _messageHash)
        public
        view
        returns(uint256 status_)
    {
        status_ = uint256(messageBox.outbox[_messageHash]);
    }

    /**
     * @notice Returns the status of message stored in the inbox.
     *
     * @param _messageHash Message hash.
     *
     * @return status_ Status of message in the inbox.
     */
    function getInboxStatus(bytes32 _messageHash)
        public
        view
        returns(uint256 status_)
    {

        status_ =  uint256(messageBox.inbox[_messageHash]);

    }

}

