pragma solidity ^0.4.23;

import "./ProofLib.sol";
import "./MerklePatriciaProof.sol";

library MessageBus {

	enum MessageStatus {
		Undeclared,
		Declared,
		Progressed,
		Completed,
		DeclaredRevocation,
		Revoked
	}

	struct MessageBox {
		mapping(bytes32 /* messageHash */ => MessageStatus) outbox;
		mapping(bytes32 /* messageHash */ => MessageStatus) inbox;
	}

	struct Message {
		// hash digest of intent message
		bytes32 intentHash;
		uint256 nonce;
		uint256 gasPrice;
		bytes signature;
		address sender;
		bytes32 hashLock;
	}

	function declareMessage(
		MessageBox storage _messageBox,
		bytes32 _messageTypeHash,
		Message storage _message
	)
	external
	returns (bytes32 messageHash_)
	{

		messageHash_ = messageDigest(_messageTypeHash, _message.intentHash, _message.nonce, _message.gasPrice);

		require(verifySignature(messageHash_, _message.signature, _message.sender));
		require(_messageBox.outbox[messageHash_] == MessageStatus.Undeclared);

		_messageBox.outbox[messageHash_] = MessageStatus.Declared;
	}

	function confirmMessage(
		MessageBox storage _messageBox,
		bytes32 _messageTypeHash,
		Message storage _message,
		bytes _rlpEncodedParentNodes,
		uint8 _outboxOffset,
		bytes32 _storageRoot
	)
	external
	returns (bytes32 messageHash_)
	{
		messageHash_ = messageDigest(_messageTypeHash, _message.intentHash, _message.nonce, _message.gasPrice);
		require(verifySignature(messageHash_, _message.signature, _message.sender));
		require(_messageBox.inbox[messageHash_] == MessageStatus.Undeclared);

		bytes memory path = ProofLib.bytes32ToBytes(
			ProofLib.storageVariablePath(_outboxOffset, messageHash_));

		require(MerklePatriciaProof.verify(
				keccak256(abi.encodePacked(MessageStatus.Declared)),
				path,
				_rlpEncodedParentNodes,
				_storageRoot)
		);
		_messageBox.inbox[messageHash_] = MessageStatus.Declared;
	}


	function progressOutbox(
		MessageBox storage _messageBox,
		bytes32 _messageTypeHash,
		Message storage _message,
		bytes32 _unlockSecret
	)
	external
	returns (bytes32 messageHash_)
	{
		require(_unlockSecret == keccak256(abi.encode(_message.hashLock)));

		messageHash_ = messageDigest(_messageTypeHash, _message.intentHash, _message.nonce, _message.gasPrice);

		require(_messageBox.outbox[messageHash_] == MessageStatus.Declared);

		_messageBox.outbox[messageHash_] = MessageStatus.Progressed;
	}


	function progressInbox(
		MessageBox storage _messageBox,
		bytes32 _messageTypeHash,
		Message storage _message,
		bytes32 _unlockSecret
	)
	external
	returns (bytes32 messageHash_)
	{
		require(_unlockSecret == keccak256(abi.encode(_message.hashLock)));
		messageHash_ = messageDigest(_messageTypeHash, _message.intentHash, _message.nonce, _message.gasPrice);

		require(_messageBox.inbox[messageHash_] == MessageStatus.Declared);

		_messageBox.inbox[messageHash_] = MessageStatus.Progressed;
	}


	function verifySignature(bytes32 _message, bytes _signature, address signer)
	private
	returns (bool /*success*/)
	{
		bytes32 r;
		bytes32 s;
		uint8 v;
		assembly {
			r := mload(add(_signature, 32))
			s := mload(add(_signature, 64))
			v := byte(0, mload(add(_signature, 96)))
		}
		// Version of signature should be 27 or 28, but 0 and 1 are also possible versions
		if (v < 27) {
			v += 27;
		}
		return (ecrecover(_message, v, r, s) == signer);
	}


	function messageDigest(
		bytes32 _messageTypeHash,
		bytes32 _intentHash,
		uint256 _nonce,
		uint256 _gasPrice
	)
	internal
	pure
	returns (bytes32 /* messageHash */)
	{
		return keccak256(
			abi.encode(
				_messageTypeHash,
				_intentHash,
				_nonce,
				_gasPrice
			)
		);
	}


	function declareRevocationMessage (
		MessageBox storage _messageBox,
		bytes32 _messageTypeHash,
		Message storage _declaredMessage,
		uint256 _nonce,
		bytes _signature
	)
	external
	returns (bool /* TBD */)
	{

		bytes32 messageHash = messageDigest(_messageTypeHash, _declaredMessage);

		// outbox should be declared
		require(_messageBox.outbox[messageHash] == Declared);

		require(_nonce == _declaredMessage.nonce);

		bytes32 hash = keccak256(abi.encode(messageHash, "revert"));

		// verify if revocation is signed by the same address that declared the message
		require(verifySignature(hash, _signature, _declaredMessage.sender));

		// change the status of outbox
		_messageBox[_messageHash] == MessageStatus.DeclaredRevocation;

		return true;
	}


	function messageRevocationDigest(
		bytes32 _messageHash,
		Message storage _message
	)
	internal
	pure
	returns (bytes32 /* messageRevocationHash */)
	{
		bytes32 messageHash = messageDigest(_messageTypeHash, _message);
		return keccak256(
			abi.encode(
				messageHash,
				"revert"
			)
		);
	}


	function confirmRevocation(
		MessageBox storage _messageBox,
		bytes32 _messageTypeHash,
		Message storage _declaredMessage,
		uint256 _nonce,
		uint256 _blockHeight,
		bytes _rlpEncodedParentNodes,
		uint8 _outboxOffset,
		bytes32 _storageRoot
	)
	external
	returns (bool /*TBD*/)
	{
		bytes32 messageHash = messageDigest(_messageTypeHash, _declaredMessage);

		require(_messageBox.inbox[messageHash] == MessageStatus.Declared);

		require(_nonce == _declaredMessage.nonce);

		bytes32 hash = keccak256(abi.encode(messageHash, "revert"));

		require(verifySignature(hash, _message.signature, _message.sender));


		bytes memory path = ProofLib.bytes32ToBytes(
			ProofLib.storageVariablePath(_outboxOffset, messageHash_));

		require(MerklePatriciaProof.verify(
				keccak256(abi.encodePacked(MessageStatus.DeclaredRevocation)),
				path,
				_rlpEncodedParentNodes,
				_storageRoot)
		);
		_messageBox.inbox[_messageHash] = MessageStatus.DeclaredRevocation;

		return true;
	}

	function executeRevocationMessage (
		MessageBox storage _messageBox,
		Message storage _declaredMessage,
		bytes32 _messageTypeHash,
		uint256 _nonce,
		uint8 _outboxOffset,
		uint256 _blockHeight,
		bytes _rlpEncodedParentNodes,
		bytes32 _storageRoot)
	external
	returns (bool /*TBD*/)
	{
		require(_messageTypeHash != bytes32(0));

		bytes32 messageHash = messageDigest(_messageTypeHash, _declaredMessage);

		require(_messageBox.inbox[messageHash] == MessageStatus.DeclaredRevocation);
		require(_nonce == _messageBox.nonce + 1);

		bytes memory path = ProofLib.bytes32ToBytes(
			ProofLib.storageVariablePath(_outboxOffset, _messageHash));

		require(MerklePatriciaProof.verify(
				keccak256(abi.encodePacked(MessageStatus.DeclaredRevocation)),
				path,
				_rlpEncodedParentNodes,
				_storageRoot)
		);

		_messageBox.inbox[_messageHash] = MessageStatus.Revoked;

		return true;
	}

}



