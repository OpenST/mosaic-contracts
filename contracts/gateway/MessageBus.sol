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
		bytes signature;
		address sender;
		bytes32 hashLock;
	}

	function declareMessage(
		MessageBox storage _messageBox,
		bytes32 _messageTypeHash,
		Message storage _message
	)
	public
	returns (bytes32 messageHash_)
	{

		messageHash_ = messageDigest(_messageTypeHash, _message.intentHash, _message.nonce, _message.gasPrice);

		require(verifySignature(messageHash_, _message.signature, _message.sender));
		require(_messageBox.outbox[messageHash_] == MessageStatus.Undeclared);

		_messageBox.outbox[messageHash_] = MessageStatus.Declared;
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


}
