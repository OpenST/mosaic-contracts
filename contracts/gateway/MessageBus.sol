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
//
// ----------------------------------------------------------------------------
// MessageBus Library
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

import "./MerklePatriciaProof.sol";
import "./SafeMath.sol";
import './BytesLib.sol';

library MessageBus {

    using SafeMath for uint256;

    /* Enum */

    /** Status of the message state machine*/
    enum MessageStatus {
        Undeclared,
        Declared,
        Progressed,
        DeclaredRevocation,
        Revoked
    }

    /** Status of the message state machine*/
    enum MessageBoxType {
        Outbox,
        Inbox
    }

    /* Struct */

    /** MessageBox stores the inbox and outbox mapping */
    struct MessageBox {

        /** Maps messageHash to the MessageStatus. */
        mapping(bytes32 /* messageHash */ => MessageStatus) outbox;

        /** Maps messageHash to the MessageStatus. */
        mapping(bytes32 /* messageHash */ => MessageStatus) inbox;
    }

    /** Message */
    struct Message {

        /**
         * intent hash, this can be staking intent hash, redemption intent
         * hash, gateway linking hash
         */
        bytes32 intentHash;

        /** nonce of the sender */
        uint256 nonce;

        /** gas price that sender will pay for reward*/
        uint256 gasPrice;

        /** gas limit that sender will pay */
        uint256 gasLimit;

        /** sender address */
        address sender;

        /** hash lock provided by the facilitator */
        bytes32 hashLock;

        /**
         *the amount of the gas consumed, this is used for reward
         * calculation
         */
        uint256 gasConsumed;
    }

    /* constants */

    /** Position of outbox in struct MessageBox */
    uint8 constant OUTBOX_OFFSET = 0;

    /** Position of inbox in struct MessageBox */
    uint8 constant INBOX_OFFSET = 1;

    /**
     * @notice Declare a new message. This will update the outbox status to
     *         `Declared` for the given message hash
     *
     * @param _messageBox Message Box
     * @param _messageTypeHash Message type hash
     * @param _message Message object
     * @param _signature Signed data.
     *
     * @return messageHash_ Message hash
     */
    function declareMessage(
        MessageBox storage _messageBox,
        bytes32 _messageTypeHash,
        Message storage _message,
        bytes _signature
    )
        external
        returns (bytes32 messageHash_)
    {
        // Get the message hash
        messageHash_ = messageDigest(
            _messageTypeHash,
            _message.intentHash,
            _message.nonce,
            _message.gasPrice,
            _message.gasLimit
        );

        // Check the existing message status for the message hash in message
        // outbox is `Undeclared`
        require(
            _messageBox.outbox[messageHash_] == MessageStatus.Undeclared,
            "Message status must be Undeclared"
        );

        // Verify the signature
        require(
            verifySignature(messageHash_, _signature, _message.sender),
            "Invalid signature"
        );

        // Update the message status to `Declared` in outbox for the given
        // message hash
        _messageBox.outbox[messageHash_] = MessageStatus.Declared;
    }

    /**
     * @notice Confirm a new message that is declared in outbox on the source
     *         chain. Merkle proof will be performed to verify the declared
     *         status in source chains outbox. This will update the inbox
     *         status to `Declared` for the given message hash.
     *
     * @param _messageBox Message Box
     * @param _messageTypeHash Message type hash
     * @param _message Message object
     * @param _rlpEncodedParentNodes RLP encoded parent node data to prove in
	 *                               messageBox outbox.
	 * @param _messageBoxOffset position of the messageBox.
	 * @param _storageRoot storage root for proof
     *
     * @return messageHash_ Message hash
     */
    function confirmMessage(
        MessageBox storage _messageBox,
        bytes32 _messageTypeHash,
        Message storage _message,
        bytes _rlpEncodedParentNodes,
        uint8 _messageBoxOffset,
        bytes32 _storageRoot
    )
        external
        returns (bytes32 messageHash_)
    {
        // Get the message hash
        messageHash_ = messageDigest(
            _messageTypeHash,
            _message.intentHash,
            _message.nonce,
            _message.gasPrice,
            _message.gasLimit
        );

        // Check the existing message status for the message hash in message
        // inbox is `Undeclared`
        require(
            _messageBox.inbox[messageHash_] == MessageStatus.Undeclared,
            "Message status must be Undeclared"
        );

        // get the storage path for proof
        bytes memory path = bytes32ToBytes(
            storageVariablePathForStruct(
                _messageBoxOffset,
                OUTBOX_OFFSET,
                messageHash_
            )
        );

        // Perform the merkle proof
        require(
            MerklePatriciaProof.verify(
                keccak256(abi.encodePacked(MessageStatus.Declared)),
                path,
                _rlpEncodedParentNodes,
                _storageRoot),
            "Merkle proof verification failed"
        );

        // Update the message box inbox status to `Declared`.
        _messageBox.inbox[messageHash_] = MessageStatus.Declared;
    }

    /**
     * @notice Update the status for the outbox for a given message hash to
     *         `Progressed`
     *
     * @param _messageBox Message Box
     * @param _messageTypeHash Message type hash
     * @param _message Message object
     * @param _unlockSecret unlock secret for the hash lock provided while
     *                      declaration
	 *
     * @return messageHash_ Message hash
     */
    function progressOutbox(
        MessageBox storage _messageBox,
        bytes32 _messageTypeHash,
        Message storage _message,
        bytes32 _unlockSecret
    )
        external
        returns (bytes32 messageHash_)
    {
        // verify the unlock secret
        require(
            _message.hashLock == keccak256(abi.encode(_unlockSecret)),
            "Invalid unlock secret"
        );

        // Get the message hash
        messageHash_ = messageDigest(
            _messageTypeHash,
            _message.intentHash,
            _message.nonce,
            _message.gasPrice,
            _message.gasLimit
        );

        // Verify the current message status is `Declared`
        require(
            _messageBox.outbox[messageHash_] == MessageStatus.Declared,
            "Message status must be Declared"
        );

        // Update the message status of outbox to `Progressed`
        _messageBox.outbox[messageHash_] = MessageStatus.Progressed;
    }

    /**
     * @notice Update the status for the outbox for a given message hash to
     *         `Progressed`. Merkle proof is used to verify status of inbox in
     *         source chain. This is an alternative approach to hashlocks.
     *
     * @dev The messsage status for the message hash in the inbox should be
     *      either `Declared` or `Progresses`. Either of this status will be
     *      verified in the merkle proof
     *
     * @param _messageBox Message Box
     * @param _messageTypeHash Message type hash
     * @param _message Message object
     * @param _rlpEncodedParentNodes RLP encoded parent node data to prove in
	 *                               messageBox inbox.
	 * @param _messageBoxOffset position of the messageBox.
	 * @param _storageRoot storage root for proof
	 * @param _messageStatus Message status of message hash in the inbox of
	 *                       source chain
	 *
     * @return messageHash_ Message hash
     */
    function progressOutboxWithProof(
        MessageBox storage _messageBox,
        bytes32 _messageTypeHash,
        Message storage _message,
        bytes _rlpEncodedParentNodes,
        uint8 _messageBoxOffset,
        bytes32 _storageRoot,
        MessageStatus _messageStatus
    )
        external
        returns (bytes32 messageHash_)
    {
        // the message status for the message hash in the inbox must be either
        // `Declared` or `Progressed`
        require(
            _messageStatus == MessageStatus.Declared ||
            _messageStatus == MessageStatus.Progressed,
            "Message status must be Declared or Progressed"
        );

        // Get the message hash
        messageHash_ = messageDigest(
            _messageTypeHash,
            _message.intentHash,
            _message.nonce,
            _message.gasPrice,
            _message.gasLimit
        );

        // The existing message status must be `Declared` or
        // `DeclaredRevocation`.
        require(
            _messageBox.outbox[messageHash_] == MessageStatus.Declared ||
            _messageBox.outbox[messageHash_] ==
            MessageStatus.DeclaredRevocation,
            "Message status must be Declared"
        );

        // Get the path
        bytes memory path = bytes32ToBytes(
            storageVariablePathForStruct(
                _messageBoxOffset,
                INBOX_OFFSET,
                messageHash_
            )
        );

        // Perform the merkle proof
        require(
            MerklePatriciaProof.verify(
                keccak256(abi.encodePacked(_messageStatus)),
                path,
                _rlpEncodedParentNodes,
                _storageRoot),
            "Merkle proof verification failed"
        );

        // Update the status to `Progressed`
        _messageBox.outbox[messageHash_] = MessageStatus.Progressed;
    }

    /**
     * @notice Update the status for the inbox for a given message hash to
     *         `Progressed`
     *
     * @param _messageBox Message Box
     * @param _messageTypeHash Message type hash
     * @param _message Message object
     * @param _unlockSecret unlock secret for the hash lock provided while
     *                      declaration
     *
     * @return messageHash_ Message hash
     */
    function progressInbox(
        MessageBox storage _messageBox,
        bytes32 _messageTypeHash,
        Message storage _message,
        bytes32 _unlockSecret
    )
        external
        returns (bytes32 messageHash_)
    {
        // verify the unlock secret
        require(
            _message.hashLock == keccak256(abi.encode(_unlockSecret)),
            "Invalid unlock secret"
        );

        // Get the message hash
        messageHash_ = messageDigest(
            _messageTypeHash,
            _message.intentHash,
            _message.nonce,
            _message.gasPrice,
            _message.gasLimit
        );

        // Verify the current message status is `Declared`
        require(
            _messageBox.inbox[messageHash_] == MessageStatus.Declared,
            "Message status must be Declared"
        );

        // Update the message status of outbox to `Progressed`
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
     * @param _messageBox Message Box
     * @param _messageTypeHash Message type hash
     * @param _message Message object
     * @param _rlpEncodedParentNodes RLP encoded parent node data to prove in
	 *                               messageBox outbox.
	 * @param _messageBoxOffset position of the messageBox.
	 * @param _storageRoot storage root for proof
	 * @param _messageStatus Message status of message hash in the outbox of
	 *                       source chain
	 *
     * @return messageHash_ Message hash
     */

    function progressInboxWithProof(
        MessageBox storage _messageBox,
        bytes32 _messageTypeHash,
        Message storage _message,
        bytes _rlpEncodedParentNodes,
        uint8 _messageBoxOffset,
        bytes32 _storageRoot,
        MessageStatus _messageStatus
    )
        external
        returns (bytes32 messageHash_)
    {
        // the message status for the message hash in the outbox must be either
        // `Declared` or `Progressed`
        require(
            _messageStatus == MessageStatus.Declared ||
            _messageStatus == MessageStatus.Progressed,
            "Message status must be Declared or Progressed"
        );

        // Get the message hash
        messageHash_ = messageDigest(
            _messageTypeHash,
            _message.intentHash,
            _message.nonce,
            _message.gasPrice,
            _message.gasLimit
        );

        // The existing message status must be `Declared`
        require(
            _messageBox.inbox[messageHash_] == MessageStatus.Declared,
            "Message status must be Declared"
        );

        // @dev the out box is at location 0 of the MessageBox struct, so it
        // is same as _messageBoxOffset
        bytes memory path = bytes32ToBytes(
            storageVariablePathForStruct(
                _messageBoxOffset,
                OUTBOX_OFFSET,
                messageHash_
            )
        );

        // Perform the merkle proof
        require(
            MerklePatriciaProof.verify(
                keccak256(abi.encodePacked(_messageStatus)),
                path,
                _rlpEncodedParentNodes,
                _storageRoot),
            "Merkle proof verification failed"
        );

        // Update the status to `Progressed`
        _messageBox.inbox[messageHash_] = MessageStatus.Progressed;
    }

    /**
     * @notice Declare a new revocation message. This will update the outbox
     *         status to `DeclaredRevocation` for the given message hash
     *
     * @dev In order to declare revocation the existing message status for the
     *      given message hash should be `Declared`.
     *
     * @param _messageBox Message Box
     * @param _messageTypeHash Message type hash
     * @param _message Message object
     * @param _signature Signed data.
     *
     * @return messageHash_ Message hash
     */
    function declareRevocationMessage(
        MessageBox storage _messageBox,
        bytes32 _messageTypeHash,
        Message storage _message
    )
        external
        returns (bytes32 messageHash_)
    {

        // Get the message hash
        messageHash_ = messageDigest(
            _messageTypeHash,
            _message.intentHash,
            _message.nonce,
            _message.gasPrice,
            _message.gasLimit
        );

        // outbox should be declared
        require(
            _messageBox.outbox[messageHash_] == MessageStatus.Declared,
            "Message status must be Declared"
        );

        // Get the revocation message digest for the signature verification
        // @dev When sender wants to revert any message. Sender needs to sign
        // the messageDigest that is generated by the sha3 of the messageHash
        // and that message`s nonce + 1.
        // This approach can be discussed and changed accordingly.
        bytes32 revocationMessageHash = revocationMessageDigest(
            messageHash_,
            _message.nonce + 1
        );

        // change the status of outbox
        _messageBox.outbox[messageHash_] = MessageStatus.DeclaredRevocation;
    }

    /**
     * @notice Confirm a revocation message that is declared in the outbox of
     *         source chain. This will update the outbox status to
     *         `DeclaredRevocation` for the given message hash.
     *
     * @dev In order to declare revocation the existing message status for the
     *      given message hash should be `Declared`.
     *
     * @param _messageBox Message Box
     * @param _messageTypeHash Message type hash
     * @param _message Message object
     * @param _rlpEncodedParentNodes RLP encoded parent node data to prove in
	 *                               messageBox outbox.
	 * @param _messageBoxOffset position of the messageBox.
	 * @param _storageRoot storage root for proof
     *
     * @return messageHash_ Message hash
     */
    function confirmRevocation(
        MessageBox storage _messageBox,
        bytes32 _messageTypeHash,
        Message storage _message,
        bytes _rlpEncodedParentNodes,
        uint8 _messageBoxOffset,
        bytes32 _storageRoot
    )
        external
        returns (bytes32 messageHash_)
    {
        // Get the message hash
        messageHash_ = messageDigest(
            _messageTypeHash,
            _message.intentHash,
            _message.nonce,
            _message.gasPrice,
            _message.gasLimit
        );

        // Check the existing message status for the message hash in message
        // inbox is `Declared`
        require(
            _messageBox.inbox[messageHash_] == MessageStatus.Declared,
            "Message status must be Declared"
        );

        // Get the path
        bytes memory path = bytes32ToBytes(
            storageVariablePathForStruct(
                _messageBoxOffset,
                OUTBOX_OFFSET,
                messageHash_
            )
        );

        // Perform the merkle proof
        require(MerklePatriciaProof.verify(
                keccak256(abi.encodePacked(MessageStatus.DeclaredRevocation)),
                path,
                _rlpEncodedParentNodes,
                _storageRoot),
            "Merkle proof verification failed"
        );

        // Update the message box inbox status to `DeclaredRevocation`.
        _messageBox.inbox[messageHash_] = MessageStatus.DeclaredRevocation;
    }

    /**
     * @notice Update the status for the outbox for a given message hash to
     *         `Revoked`. Merkle proof is used to verify status of inbox in
     *         source chain.
     *
     * @dev The messsage status in the inbox should be
     *      either `DeclaredRevocation` or `Revoked`. Either of this status
     *      will be verified in the merkle proof
     *
     * @param _messageBox Message Box
     * @param _message Message object
     * @param _messageTypeHash Message type hash
     * @param _messageBoxOffset position of the messageBox.
	 * @param _rlpEncodedParentNodes RLP encoded parent node data to prove in
	 *                               messageBox inbox.
	 * @param _storageRoot storage root for proof
	 * @param _messageStatus Message status of message hash in the inbox of
	 *                       source chain
	 *
     * @return messageHash_ Message hash
     */
    function progressOutboxRevocation(
        MessageBox storage _messageBox,
        Message storage _message,
        bytes32 _messageTypeHash,
        uint8 _messageBoxOffset,
        bytes _rlpEncodedParentNodes,
        bytes32 _storageRoot,
        MessageStatus _messageStatus
    )
        external
        returns (bytes32 messageHash_)
    {

        // the message status for the message hash in the inbox must be either
        // `DeclaredRevocation` or `Revoked`
        require(
            _messageStatus == MessageStatus.DeclaredRevocation ||
            _messageStatus == MessageStatus.Revoked,
            "Message status must be DeclaredRevocation or Revoked"
        );

        // Get the message hash
        messageHash_ = messageDigest(
            _messageTypeHash,
            _message.intentHash,
            _message.nonce,
            _message.gasPrice,
            _message.gasLimit
        );

        // The existing message status must be `DeclaredRevocation`
        require(
            _messageBox.outbox[messageHash_] ==
            MessageStatus.DeclaredRevocation,
            "Message status must be DeclaredRevocation"
        );

        // @dev the out box is at location 1 of the MessageBox struct, so we
        // add one to get the path
        bytes memory path = bytes32ToBytes(
            storageVariablePathForStruct(
                _messageBoxOffset,
                INBOX_OFFSET,
                messageHash_
            )
        );

        // Perform the merkle proof
        require(
            MerklePatriciaProof.verify(
                keccak256(abi.encodePacked(_messageStatus)),
                path,
                _rlpEncodedParentNodes,
                _storageRoot),
            "Merkle proof verification failed"
        );

        // Update the status to `Revoked`
        _messageBox.outbox[messageHash_] = MessageStatus.Revoked;
    }

    /**
     * @notice Update the status for the inbox for a given message hash to
     *         `Revoked`. Merkle proof is used to verify status of outbox in
     *         source chain.
     *
     * @dev The messsage status in the outbox should be
     *      either `DeclaredRevocation` or `Revoked`. Either of this status
     *      will be verified in the merkle proof
     *
     * @param _messageBox Message Box
     * @param _message Message object
     * @param _messageTypeHash Message type hash
     * @param _messageBoxOffset position of the messageBox.
	 * @param _rlpEncodedParentNodes RLP encoded parent node data to prove in
	 *                               messageBox inbox.
	 * @param _storageRoot storage root for proof
	 * @param _messageStatus Message status of message hash in the inbox of
	 *                       source chain
	 *
     * @return messageHash_ Message hash
     */
    function progressInboxRevocation(
        MessageBox storage _messageBox,
        Message storage _message,
        bytes32 _messageTypeHash,
        uint8 _messageBoxOffset,
        bytes _rlpEncodedParentNodes,
        bytes32 _storageRoot,
        MessageStatus _messageStatus
    )
        external
        returns (bytes32 messageHash_)
    {

        // the message status for the message hash in the outbox must be either
        // `DeclaredRevocation` or `Revoked`
        require(
            _messageStatus == MessageStatus.DeclaredRevocation ||
            _messageStatus == MessageStatus.Revoked,
            "Message status must be DeclaredRevocation or Revoked"
        );

        // Get the message hash
        messageHash_ = messageDigest(
            _messageTypeHash,
            _message.intentHash,
            _message.nonce,
            _message.gasPrice,
            _message.gasLimit
        );

        // The existing message status must be `DeclaredRevocation`
        require(
            _messageBox.inbox[messageHash_] ==
            MessageStatus.DeclaredRevocation,
            "Message status must be DeclaredRevocation"
        );

        // @dev the out box is at location 0 of the MessageBox struct, so we
        // can use _messageBoxOffset as it is
        bytes memory path = bytes32ToBytes(
            storageVariablePathForStruct(
                _messageBoxOffset,
                OUTBOX_OFFSET,
                messageHash_
            )
        );

        // Perform the merkle proof
        require(
            MerklePatriciaProof.verify(
                keccak256(abi.encodePacked(_messageStatus)),
                path,
                _rlpEncodedParentNodes,
                _storageRoot),
            "Merkle proof verification failed"
        );

        // Update the status to `Revoked`
        _messageBox.inbox[messageHash_] = MessageStatus.Revoked;
    }

    /**
	 * @notice Change inbox state to the next possible state
	 *
	 * @dev State will change only for Undeclared, Declared, DeclaredRevocation
	 *      Undeclared -> Declared, Declared -> Progressed,
	 *      DeclaredRevocation -> Revoked
	 *
	 * @param _messageBox Message box.
	 * @param _messageHash Message hash
	 *
	 * @return isChanged_ `true` if the state is changed
	 * @return nextState_ Next state to which its changed
	 */
    function changeInboxState(
        MessageBox storage _messageBox,
        bytes32 _messageHash
    )
        external
        returns (
            bool isChanged_,
            MessageBus.MessageStatus nextState_
        )
    {
        MessageStatus status = _messageBox.inbox[_messageHash];

        if(status == MessageStatus.Undeclared) {
            isChanged_ = true;
            nextState_ = MessageStatus.Declared;
        } else if(status == MessageStatus.Declared) {
            isChanged_ = true;
            nextState_ = MessageStatus.Progressed;
        } else if(status == MessageStatus.DeclaredRevocation) {
            isChanged_ = true;
            nextState_ = MessageStatus.Revoked;
        }

        if(isChanged_){
            // Update the message inbox status.
            _messageBox.inbox[_messageHash] = nextState_;
        }
    }

    /**
	 * @notice Change outbox state to the next possible state
	 *
	 * @dev State will change only for Undeclared, Declared, DeclaredRevocation
	 *      Undeclared -> Declared, Declared -> Progressed,
	 *      DeclaredRevocation -> Revoked
	 *
	 * @param _messageBox Message box.
	 * @param _messageHash Message hash
	 *
	 * @return isChanged_ `true` if the state is changed
	 * @return nextState_ Next state to which its changed
	 */
    function changeOutboxState(
        MessageBox storage _messageBox,
        bytes32 _messageHash
    )
        external
        returns (
            bool isChanged_,
            MessageBus.MessageStatus nextState_
        )
    {
        MessageStatus status = _messageBox.outbox[_messageHash];

        if(status == MessageStatus.Undeclared) {
            isChanged_ = true;
            nextState_ = MessageStatus.Declared;
        } else if(status == MessageStatus.Declared) {
            isChanged_ = true;
            nextState_ = MessageStatus.Progressed;
        } else if(status == MessageStatus.DeclaredRevocation) {
            isChanged_ = true;
            nextState_ = MessageStatus.Revoked;
        }

        if(isChanged_){
            // Update the message outbox status.
            _messageBox.outbox[_messageHash] = nextState_;
        }
    }

    /* public functions */

    /**
     * @notice Generate revocation message hash from the input params
     *
     * @param _messageHash Message hash
     * @param _nonce Nonce
     *
     * @return Revocation message hash
     */
    function revocationMessageDigest(
        bytes32 _messageHash,
        uint256 _nonce
    )
    public
    pure
    returns (bytes32 /* revocationMessageHash */)
    {
        return keccak256(
            abi.encode(
                _messageHash,
                _nonce
            )
        );
    }

    /**
     * @notice Generate message hash from the input params
     *
     * @param _messageTypeHash Message type hash
     * @param _intentHash Intent hash
     * @param _nonce Nonce
     * @param _gasPrice Gas price
     *
     * @return Message hash
     */
    function messageDigest(
        bytes32 _messageTypeHash,
        bytes32 _intentHash,
        uint256 _nonce,
        uint256 _gasPrice,
        uint256 _gasLimit
    )
    public
    pure
    returns (bytes32 /* messageHash */)
    {
        return keccak256(
            abi.encode(
                _messageTypeHash,
                _intentHash,
                _nonce,
                _gasPrice,
                _gasLimit
            )
        );
    }

    /* private functions */

    /**
     * @notice Verify the signature is signed by the signer address.
     *
     * @param _message Message hash
     * @param _signature Signature
     * @param _signer Signer address
     *
     * @return `true` if the signature is signed by the signer
     */
    function verifySignature(
        bytes32 _message,
        bytes _signature,
        address _signer
    )
    private
    pure
    returns (bool /*success*/)
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
        return (ecrecover(_message, v, r, s) == _signer);
    }

    /**
  *	@notice Get the storage path of the variable inside the struct
  *
  *	@param _structPosition Position of struct variable
  *   @param _offset Offset of variable inside the struct
  *	@param _key Key of variable incase of mapping
  *
  *	@return bytes32 Storage path of the variable
  */
    function storageVariablePathForStruct(
        uint8 _structPosition,
        uint8 _offset,
        bytes32 _key)
    private
    pure
    returns(bytes32 /* storage path */)
    {
        bytes memory indexBytes = BytesLib.leftPad(bytes32ToBytes(bytes32(_structPosition)));
        bytes memory keyBytes = BytesLib.leftPad(bytes32ToBytes(_key));
        bytes memory path = BytesLib.concat(keyBytes, indexBytes);
        bytes32 structPath = keccak256(abi.encodePacked(keccak256(abi.encodePacked(path))));
        if (_offset == 0) {
            return structPath;
        }
        bytes32 storagePath;
        uint8 offset = _offset;
        assembly {
            storagePath := add(structPath, offset)
        }
        return keccak256(abi.encodePacked(storagePath));
    }

    /**
     *	@notice Convert bytes32 to bytes
     *
     *	@param _inBytes32 bytes32 value
     *
     *	@return bytes value
     */
    function bytes32ToBytes(bytes32 _inBytes32)
    private
    pure
    returns (bytes)
    {
        bytes memory res = new bytes(32);
        assembly {
            mstore(add(32,res), _inBytes32)
        }
        return res;
    }
}



