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
		bytes32 r;
		bytes32 s;
		uint8 v;
		address sender;
		bytes32 hashLock;
	}

	function declareMessage (
		MessageBox storage _messageBox,
		bytes32 _messageTypeHash,
		Message storage _message
	)
	external
	returns (bytes32 messageHash_)
	{
		// messageDigest;
		// verify signature wrt message.sender
		// check outbox for status
		// declare message in outbox
		return bytes32(0);
	}

	function declareRevocationMessage (
		MessageBox storage _messageBox,
		Message storage _declaredMessage,
		bytes32 _messageTypeHash,
		bytes32 _messageHash,
		uint256 _nonce,
		bytes _signature
	)
	external
	returns (bool /* TBD */)
	{
		require(_messageHash != bytes32(0));

		// outbox should be declared
		require(_messageBox.outbox[_messageHash] == Declared);

		// validate if the revocation is possible for the given nonce.
		require(_declaredMessage.nonce == _nonce+1);

		bytes32 hash = messageRevocationDigest(_messageTypeHash, _declaredMessage);

		// verify if revocation is signed by the same address that declared the message
		require(verifySignature(hash, _signature, _declaredMessage.sender));

		// change the status of outbox
		_messageBox[_messageHash] == MessageStatus.DeclaredRevocation;
	}



	function verifySignature(bytes32 _hash, bytes _signature, address signer)
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
		return (ecrecover(_hash, v, r, s) == signer);
	}


	function messageDigest(
		bytes32 _messageTypeHash,
		Message storage _message
	)
	internal
	pure
	returns (bytes32 /* messageHash */)
	{
		return keccak256(
			abi.encode(
				messageTypeHash,
				_message.intentHash,
				_message.nonce,
				_message.gasPrice
			)
		);
	}

	function messageRevocationDigest(
		bytes32 _messageHash,
		Message storage _message
	)
	internal
	pure
	returns (bytes32 /* messageRevocationHash */)
	{
		return keccak256(
			abi.encode(
				messageTypeHash,
				_message.nonce+1
			)
		);
	}


	function confirmRevocation(
		MessageBox storage _messageBox,
		bytes32 _messageHash,
		Message storage _declaredMessage,
		uint256 _blockHeight,
		bytes _rlpEncodedParentNodes,
		uint8 _outboxOffset,
		bytes32 _storageRoot
	)
	external
	returns (bool /*TBD*/)
	{
		require(_messageBox.inbox[_messageHash] == MessageStatus.Declared);

		bytes32 hash = messageRevocationDigest(_messageHash, _declaredMessage);

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
		bytes32 _messageHash,
		uint256 _nonce,
		uint8 _outboxOffset,
		uint256 _blockHeight,
		bytes _rlpEncodedParentNodes,
		bytes32 _storageRoot)
	external
	returns (bool /*TBD*/)
	{
		require(_messageBox.inbox[_messageHash] == MessageStatus.DeclaredRevocation);
		require(_nonce == _messageBox.nonce + 2);

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
