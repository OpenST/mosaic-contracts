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
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

import "../test/lib/MockMerklePatriciaProof.sol";
import "../lib/SafeMath.sol";
import "../lib/BytesLib.sol";

library MockMessageBus {

    /* Usings */

    using SafeMath for uint256;


    /* Enum */

    /** Status of the message state machine. */
    enum MessageStatus {
        Undeclared,
        Declared,
        Progressed,
        DeclaredRevocation,
        Revoked
    }

    /** Status of the message state machine. */
    enum MessageBoxType {
        Outbox,
        Inbox
    }


    /* Struct */

    /** MessageBox stores the inbox and outbox mapping. */
    struct MessageBox {

        /** Maps messageHash to the MessageStatus. */
        mapping(bytes32 /* messageHash */ => MessageStatus) outbox;

        /** Maps messageHash to the MessageStatus. */
        mapping(bytes32 /* messageHash */ => MessageStatus) inbox;
    }

    /** Message */
    struct Message {

        /** Intent hash of specific request type. */
        bytes32 intentHash;

        /** Nonce of the sender. */
        uint256 nonce;

        /** Gas price that sender will pay for reward. */
        uint256 gasPrice;

        /** Gas limit that sender will pay. */
        uint256 gasLimit;

        /** Address of the message sender. */
        address sender;

        /** Hash lock provided by the facilitator. */
        bytes32 hashLock;

        /**
         * The amount of the gas consumed, this is used for reward
         * calculation.
         */
        uint256 gasConsumed;
    }


    /* Constants */

    /**
     * Position of outbox in struct MessageBox.
     * This is used to generate storage merkel proof.
     */
    uint8 public constant OUTBOX_OFFSET = 0;

    /**
     * Position of inbox in struct MessageBox.
     * This is used to generate storage merkel proof.
     */
    uint8 public constant INBOX_OFFSET = 1;

    /**
     * @notice Declare a new message. This will update the outbox status to
     *         `Declared` for the given message hash
     *
     * @param _messageBox Message Box
     * @param _message Message object
     *
     * @return messageHash_ Message hash
     */
    function declareMessage(
        MessageBox storage _messageBox,
        Message storage _message
    )
        external
        returns (bytes32 messageHash_)
    {
        // Get the message hash.
        messageHash_ = messageDigest(
            _message.intentHash,
            _message.nonce,
            _message.gasPrice,
            _message.gasLimit
        );

        // Check the outbox message status is `Undeclared`.
        require(
            _messageBox.outbox[messageHash_] == MessageStatus.Undeclared,
            "Message on source must be Undeclared."
        );

        // Update the outbox message status to `Declared`.
        _messageBox.outbox[messageHash_] = MessageStatus.Declared;
    }

    /**
     * @notice Confirm a new message that is declared in outbox on the source
     *         chain. Merkle proof will be performed to verify the declared
     *         status in source chains outbox. This will update the inbox
     *         status to `Declared` for the given message hash.
     *
     * @param _messageBox Message Box.
     * @param _message Message object.
     * @param _rlpParentNodes RLP encoded parent node data to prove in
     *                        messageBox outbox.
     * @param _messageBoxOffset position of the messageBox.
     * @param _storageRoot Storage root for proof.
     *
     * @return messageHash_ Message hash.
     */
    function confirmMessage(
        MessageBox storage _messageBox,
        Message storage _message,
        bytes calldata _rlpParentNodes,
        uint8 _messageBoxOffset,
        bytes32 _storageRoot
    )
        external
        returns (bytes32 messageHash_)
    {
        // Get the message hash.
        messageHash_ = messageDigest(
            _message.intentHash,
            _message.nonce,
            _message.gasPrice,
            _message.gasLimit
        );

        // Check the inbox message status is `Undeclared`.
        require(
            _messageBox.inbox[messageHash_] == MessageStatus.Undeclared,
            "Message on target must be Undeclared."
        );

        // Get the storage path to verify proof.
        bytes memory path = bytes32ToBytes(
            storageVariablePathForStruct(
                _messageBoxOffset,
                OUTBOX_OFFSET,
                messageHash_
            )
        );

        // Verify the merkle proof.
        require(
            MockMerklePatriciaProof.verify(
                keccak256(abi.encodePacked(MessageStatus.Declared)),
                path,
                _rlpParentNodes,
                _storageRoot),
            "Merkle proof verification failed."
        );

        // Update the message box inbox status to `Declared`.
        _messageBox.inbox[messageHash_] = MessageStatus.Declared;
    }

    /**
     * @notice Update the outbox message hash status to `Progressed`.
     *
     * @param _messageBox Message Box.
     * @param _message Message object.
     * @param _unlockSecret Unlock secret for the hash lock provided while
     *                      declaration.
     *
     * @return messageHash_ Message hash.
     */
    function progressOutbox(
        MessageBox storage _messageBox,
        Message storage _message,
        bytes32 _unlockSecret
    )
        external
        returns (bytes32 messageHash_)
    {
        // Verify the unlock secret.
        require(
            _message.hashLock == keccak256(abi.encode(_unlockSecret)),
            "Invalid unlock secret."
        );

        // Get the message hash.
        messageHash_ = messageDigest(
            _message.intentHash,
            _message.nonce,
            _message.gasPrice,
            _message.gasLimit
        );

        // Verify the current message status is `Declared`.
        require(
            _messageBox.outbox[messageHash_] == MessageStatus.Declared,
            "Message on source must be Declared."
        );

        // Update the outbox message status to `Progressed`.
        _messageBox.outbox[messageHash_] = MessageStatus.Progressed;
    }

    /**
     * @notice Update the status for the outbox for a given message hash to
     *         `Progressed`. Merkle proof is used to verify status of inbox in
     *         source chain. This is an alternative approach to hashlocks.
     *
     * @dev The messsage status for the message hash in the inbox should be
     *      either `Declared` or `Progresses`. Either of this status will be
     *      verified with the merkle proof.
     *
     * @param _messageBox Message Box.
     * @param _message Message object.
     * @param _rlpParentNodes RLP encoded parent node data to prove in
     *                        messageBox inbox.
     * @param _messageBoxOffset Position of the messageBox.
     * @param _storageRoot Storage root for proof.
     * @param _messageStatus Message status of message hash in the inbox of
     *                       source chain.
     *
     * @return messageHash_ Message hash.
     */
    function progressOutboxWithProof(
        MessageBox storage _messageBox,
        Message storage _message,
        bytes calldata _rlpParentNodes,
        uint8 _messageBoxOffset,
        bytes32 _storageRoot,
        MessageStatus _messageStatus
    )
        external
        returns (bytes32 messageHash_)
    {
        // The inbox message status must be either Declared` or `Progressed`.
        require(
            _messageStatus == MessageStatus.Declared ||
            _messageStatus == MessageStatus.Progressed,
            "Message on target must be Declared or Progressed."
        );

        // Get the message hash
        messageHash_ = messageDigest(
            _message.intentHash,
            _message.nonce,
            _message.gasPrice,
            _message.gasLimit
        );

        // The message status must be `Declared` or DeclaredRevocation`.
        require(
            _messageBox.outbox[messageHash_] == MessageStatus.Declared ||
            _messageBox.outbox[messageHash_] ==
            MessageStatus.DeclaredRevocation,
            "Message on source must be Declared."
        );

        // Get the storage path.
        bytes memory path = bytes32ToBytes(
            storageVariablePathForStruct(
                _messageBoxOffset,
                INBOX_OFFSET,
                messageHash_
            )
        );

        // Verify the merkle proof.
        require(
            MockMerklePatriciaProof.verify(
                keccak256(abi.encodePacked(_messageStatus)),
                path,
                _rlpParentNodes,
                _storageRoot),
            "Merkle proof verification failed"
        );

        // Update the status to `Progressed`.
        _messageBox.outbox[messageHash_] = MessageStatus.Progressed;
    }

    /**
     * @notice Update the status for the inbox for a given message hash to
     *         `Progressed`
     *
     * @param _messageBox Message Box.
     * @param _message Message object.
     * @param _unlockSecret Unlock secret for the hash lock provided while
     *                      declaration.
     *
     * @return messageHash_ Message hash.
     */
    function progressInbox(
        MessageBox storage _messageBox,
        Message storage _message,
        bytes32 _unlockSecret
    )
        external
        returns (bytes32 messageHash_)
    {
        // Verify the unlock secret.
        require(
            _message.hashLock == keccak256(abi.encode(_unlockSecret)),
            "Invalid unlock secret."
        );

        // Get the message hash.
        messageHash_ = messageDigest(
            _message.intentHash,
            _message.nonce,
            _message.gasPrice,
            _message.gasLimit
        );

        // Verify the current message status is `Declared`.
        require(
            _messageBox.inbox[messageHash_] == MessageStatus.Declared,
            "Message on target status must be Declared."
        );

        // Update the message status of outbox to `Progressed`.
        _messageBox.inbox[messageHash_] = MessageStatus.Progressed;
    }

    /**
     * @notice Update the status for the inbox for a given message hash to
     *         `Progressed`. Merkle proof is used to verify status of outbox in
     *         source chain. This is an alternative approach to hashlocks.
     *
     * @dev The messsage status for the message hash in the outbox should be
     *      either `Declared` or `Progresses`. Either of this status will be
     *      verified in the merkle proof
     *
     * @param _messageBox Message Box.
     * @param _message Message object.
     * @param _rlpParentNodes RLP encoded parent node data to prove in
     *                        messageBox outbox.
     * @param _messageBoxOffset Position of the messageBox.
     * @param _storageRoot Storage root for proof.
     * @param _outboxMessageStatus Message status of outbox in the source chain.
     *
     * @return messageHash_ Message hash.
     */
    function progressInboxWithProof(
        MessageBox storage _messageBox,
        Message storage _message,
        bytes calldata _rlpParentNodes,
        uint8 _messageBoxOffset,
        bytes32 _storageRoot,
        MessageStatus _outboxMessageStatus
    )
        external
        returns (bytes32 messageHash_)
    {
        // Outbox message status must be either `Declared` or `Progressed`.
        require(
            _outboxMessageStatus == MessageStatus.Declared ||
            _outboxMessageStatus == MessageStatus.Progressed,
            "Message on source must be Declared or Progressed."
        );

        // Get the message hash.
        messageHash_ = messageDigest(
            _message.intentHash,
            _message.nonce,
            _message.gasPrice,
            _message.gasLimit
        );

        // The existing message status must be `Declared`.
        require(
            _messageBox.inbox[messageHash_] == MessageStatus.Declared,
            "Message on target must be Declared."
        );

        // @dev the outbox location index is 0 in the MessageBox struct, so it
        // is same as _messageBoxOffset
        bytes memory path = bytes32ToBytes(
            storageVariablePathForStruct(
                _messageBoxOffset,
                OUTBOX_OFFSET,
                messageHash_
            )
        );

        // Perform the merkle proof.
        require(
            MockMerklePatriciaProof.verify(
                keccak256(abi.encodePacked(_outboxMessageStatus)),
                path,
                _rlpParentNodes,
                _storageRoot
            ),
            "Merkle proof verification failed"
        );

        // Update the status to `Progressed`.
        _messageBox.inbox[messageHash_] = MessageStatus.Progressed;
    }

    /**
     * @notice Declare a new revocation message. This will update the outbox
     *         status to `DeclaredRevocation` for the given message hash.
     *
     * @dev In order to declare revocation the existing message status for the
     *      given message hash should be `Declared`.
     *
     * @param _messageBox Message Box.
     * @param _message Message object.
     *
     * @return messageHash_ Message hash.
     */
    function declareRevocationMessage(
        MessageBox storage _messageBox,
        Message storage _message
    )
        external
        returns (bytes32 messageHash_)
    {

        // Get the message hash.
        messageHash_ = messageDigest(
            _message.intentHash,
            _message.nonce,
            _message.gasPrice,
            _message.gasLimit
        );

        // Outbox should be declared.
        require(
            _messageBox.outbox[messageHash_] == MessageStatus.Declared,
            "Message on source must be Declared."
        );

        // Change the status of outbox.
        _messageBox.outbox[messageHash_] = MessageStatus.DeclaredRevocation;
    }

    /**
     * @notice Confirm a revocation message that is declared in the outbox of
     *         source chain. This will update the outbox status to
     *         `Revoked` for the given message hash.
     *
     * @dev In order to declare revocation the existing message status for the
     *      given message hash should be `Declared`.
     *
     * @param _messageBox Message Box.
     * @param _message Message object.
     * @param _rlpParentNodes RLP encoded parent node data to prove in
     *                        messageBox outbox.
     * @param _messageBoxOffset Position of the messageBox.
     * @param _storageRoot Storage root for proof.
     *
     * @return messageHash_ Message hash.
     */
    function confirmRevocation(
        MessageBox storage _messageBox,
        Message storage _message,
        bytes calldata _rlpParentNodes,
        uint8 _messageBoxOffset,
        bytes32 _storageRoot
    )
        external
        returns (bytes32 messageHash_)
    {
        // Get the message hash.
        messageHash_ = messageDigest(
            _message.intentHash,
            _message.nonce,
            _message.gasPrice,
            _message.gasLimit
        );

        // Check the existing inbox message status `Declared`.
        require(
            _messageBox.inbox[messageHash_] == MessageStatus.Declared,
            "Message on target must be Declared."
        );

        // Get the path.
        bytes memory path = bytes32ToBytes(
            storageVariablePathForStruct(
                _messageBoxOffset,
                OUTBOX_OFFSET,
                messageHash_
            )
        );

        // Perform the merkle proof.
        require(
            MockMerklePatriciaProof.verify(
                keccak256(abi.encodePacked(MessageStatus.DeclaredRevocation)),
                path,
                _rlpParentNodes,
                _storageRoot
            ),
            "Merkle proof verification failed."
        );

        // Update the message box inbox status to `Revoked`.
        _messageBox.inbox[messageHash_] = MessageStatus.Revoked;
    }

    /**
     * @notice Update the status for the outbox for a given message hash to
     *         `Revoked`. Merkle proof is used to verify status of inbox in
     *         source chain.
     *
     * @dev The messsage status in the inbox should be
     *      either `DeclaredRevocation` or `Revoked`. Either of this status
     *      will be verified in the merkle proof.
     *
     * @param _messageBox Message Box.
     * @param _message Message object.
     * @param _messageBoxOffset Position of the messageBox.
     * @param _rlpParentNodes RLP encoded parent node data to prove in
     *                        messageBox inbox.
     * @param _storageRoot Storage root for proof.
     * @param _messageStatus Message status of message hash in the inbox of
     *                       source chain.
     *
     * @return messageHash_ Message hash.
     */
    function progressOutboxRevocation(
        MessageBox storage _messageBox,
        Message storage _message,
        uint8 _messageBoxOffset,
        bytes calldata _rlpParentNodes,
        bytes32 _storageRoot,
        MessageStatus _messageStatus
    )
        external
        returns (bytes32 messageHash_)
    {
        // Inbox message status must be either `DeclaredRevocation` or `Revoked`.
        require(
            _messageStatus == MessageStatus.Revoked,
            "Message on target status must be Revoked."
        );

        // Get the message hash.
        messageHash_ = messageDigest(
            _message.intentHash,
            _message.nonce,
            _message.gasPrice,
            _message.gasLimit
        );

        // The existing message status must be `DeclaredRevocation`.
        require(
            _messageBox.outbox[messageHash_] ==
            MessageStatus.DeclaredRevocation,
            "Message on source must be DeclaredRevocation."
        );

        // @dev The outbox is at location 1 of the MessageBox struct.
        // So add one to get the path.
        bytes memory path = bytes32ToBytes(
            storageVariablePathForStruct(
                _messageBoxOffset,
                INBOX_OFFSET,
                messageHash_
            )
        );

        // Perform the merkle proof.
        require(
            MockMerklePatriciaProof.verify(
                keccak256(abi.encodePacked(_messageStatus)),
                path,
                _rlpParentNodes,
                _storageRoot
            ),
            "Merkle proof verification failed."
        );

        // Update the status to `Revoked`.
        _messageBox.outbox[messageHash_] = MessageStatus.Revoked;
    }

    /* Public Functions */

    /**
     * @notice Generate message hash from the input params
     *
     * @param _intentHash Intent hash.
     * @param _nonce Nonce of the message sender.
     * @param _gasPrice Gas price.
     *
     * @return messageHash_ Message hash.
     */
    function messageDigest(
        bytes32 _intentHash,
        uint256 _nonce,
        uint256 _gasPrice,
        uint256 _gasLimit
    )
        public
        pure
        returns (bytes32 messageHash_)
    {
        messageHash_ =  keccak256(
            abi.encode(
                // TODO: add type hash
                _intentHash,
                _nonce,
                _gasPrice,
                _gasLimit
            )
        );
    }

    /* Private Functions */

    /**
     * @notice Verify the signature is signed by the signer address.
     *
     * @param _message Message hash.
     * @param _signature Signature.
     * @param _signer Signer address.
     *
     * @return `true` If the signature is signed by the signer.
     */
    function verifySignature(
        bytes32 _message,
        bytes memory _signature,
        address _signer
    )
        private
        pure
        returns (bool success_)
    {
        if (_signature.length != 65) {
            return false;
        }
        bytes memory prefix = "\x19Ethereum Signed Message:\n32";

        _message = keccak256(abi.encodePacked(prefix, _message));

        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := mload(add(_signature, 32))
            s := mload(add(_signature, 64))
            v := byte(0, mload(add(_signature, 96)))
        }
        // Version of signature should be 27 or 28, but 0 and 1 are also
        // possible versions
        if (v < 27) {
            v += 27;
        }

        if (v != 27 && v != 28) {
            return false;
        }
        success_ = ecrecover(_message, v, r, s) == _signer;
    }

    /**
     * @notice Get the storage path of the variable inside the struct.
     *
     * @param _structPosition Position of struct variable.
     * @param _offset Offset of variable inside the struct.
     * @param _key Key of variable in case of mapping
     *
     * @return bytes32 Storage path of the variable.
     */
    function storageVariablePathForStruct(
        uint8 _structPosition,
        uint8 _offset,
        bytes32 _key
    )
        private
        pure
        returns(bytes32 storagePath_)
    {
        bytes memory indexBytes = BytesLib.leftPad(
            bytes32ToBytes(
                bytes32(uint256(_structPosition))
            )
        );
        bytes memory keyBytes = BytesLib.leftPad(bytes32ToBytes(_key));
        bytes memory path = BytesLib.concat(keyBytes, indexBytes);

        bytes32 structPath = keccak256(
            abi.encodePacked(
                keccak256(
                    abi.encodePacked(path)
                )
            )
        );

        if (_offset == 0) {
            return structPath;
        }
        bytes32 storagePath;
        uint8 offset = _offset;
        assembly {
            storagePath := add(structPath, offset)
        }
        storagePath_ = keccak256(abi.encodePacked(storagePath));
    }

    /**
     * @notice Convert bytes32 to bytes.
     *
     * @param _inBytes32 Bytes32 value.
     *
     * @return bytes value.
     */
    function bytes32ToBytes(bytes32 _inBytes32)
        private
        pure
        returns (bytes memory bytes_)
    {
        bytes_ = new bytes(32);
        assembly {
            mstore(add(32, bytes_), _inBytes32)
        }
    }
}



