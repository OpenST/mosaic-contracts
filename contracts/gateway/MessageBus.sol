pragma solidity ^0.4.23;

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
		Message storage _message,
		bytes32 _messageTypeHash,
		bytes32 _messageHash,
		uint256 _nonce,
		bytes _signature
	)
	external
	returns (bool /* TBD */)
	{
		require(_messageHash != bytes32(0));
		require(_messageBox.outbox[_messageHash] == Declared);
		require(_message.nonce == _nonce+1);
		require(verifySignature(_message, _messageTypeHash, _signature));


		// assert Declared status
		// verify signature against nachricht.sender
		// move it to DeclaredRevocation
	}


	function verifyRevocationSignature(
		bytes32 _messageHash,
		bytes32 _messageTypeHash,
		bytes _signature)
	private
	returns (bool /*success*/) {

		// hash of messageHash and
		bytes32 hash = keccak256(abi.encodePacked(_messageHash, _messageTypeHash));
		//TODO:
		return true;
	}

}
