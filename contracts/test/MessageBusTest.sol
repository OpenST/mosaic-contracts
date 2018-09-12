pragma solidity ^0.4.23;


import "../gateway/MessageBus.sol";
import "../gateway/Hasher.sol";


contract MessageBusTest {

    MessageBus.MessageBox messageBox;
    MessageBus.Message message;

    function declareMessage(
        bytes32 _intentHash,
        uint256 _nonce,
        uint256 _gasPrice,
        address _sender,
        bytes32 _hashLock,
        uint256 gasConsumed,
        bytes _signature
    )
        external
        returns (bytes32 messageHash_)
    {

    }

    function progressInbox(
        bytes32 _intentHash,
        uint256 _nonce,
        uint256 _gasPrice,
        address _sender,
        bytes32 _hashLock,
        uint256 _gasConsumed,
        bytes _signature,
        bytes32 _messageTypeHash,
        bytes32 _unlockSecret
    )
        external
        returns (uint256 status_)
    {
        message = getMessage(_intentHash, _nonce, _gasPrice, _sender, _hashLock, _gasConsumed);
        messageBox.inbox[messageHash] = messageBox.declared;
        MessageBus.progressInbox(messageBox, _messageTypeHash, message, _unlockSecret);

        uint256 status_= messageBox.inbox[message];
        return status_;
    }

    function progressInboxWithProof(
        bytes32 _intentHash,
        uint256 _nonce,
        uint256 _gasPrice,
        address _sender,
        bytes32 _hashLock,
        uint256 gasConsumed,
        bytes _signature,
        bytes32 _messageTypeHash,
        bytes _rlpEncodedParentNodes,
        uint8 _outboxOffset,
        bytes32 _storageRoot,
        MessageStatus _messageStatus // declared or progressed
    )
        external
        returns (uint256 status_)
    {
        message = getMessage(_intentHash, _nonce, _gasPrice, _sender, _hashLock, _gasConsumed);

        MessageBus.progressInboxWithProof(MessageBox,
            _messageTypeHash,
            message,
            _rlpEncodedParentNodes,
            _outboxOffset,
            _storageRoot,
            _messageStatus
        );

        uint256 status_= messageBox.inbox[message];
        return status_;
    }

    function declareRevocationMessage(
        bytes32 _intentHash,
        uint256 _nonce,
        uint256 _gasPrice,
        address _sender,
        bytes32 _hashLock,
        uint256 gasConsumed,
        bytes _signature,
        bytes32 _messageTypeHash,
        bytes _signature
    )
        external
        returns (bytes32 status_)
    {
        message = getMessage(_intentHash, _nonce, _gasPrice, _sender, _hashLock, _gasConsumed);

        MessageBus.declareRevocationMessage(messageBox,
            _messageTypeHash,
            _message,
            _signature
        );

        uint256 status_= messageBox.inbox[message];
        return status_;
    }

    function confirmRevocation(
        bytes32 _intentHash,
        uint256 _nonce,
        uint256 _gasPrice,
        address _sender,
        bytes32 _hashLock,
        uint256 _gasConsumed,
        bytes _signature,
        bytes32 _messageTypeHash,
        bytes _rlpEncodedParentNodes,
        uint8 _outboxOffset,
        bytes32 _storageRoot
    )
        external
        returns (bytes32 status_)
    {
        message = getMessage(_intentHash, _nonce, _gasPrice, _sender, _hashLock, _gasConsumed);

        MessageBus.confirmRevocatione(messageBox,
            _messageTypeHash,
            message,
            _rlpEncodedParentNodes,
            _outboxOffset,
            _storageRoot
        );

        uint256 status_= messageBox.inbox[message];
        return status_;
    }

    function getMessage(
        bytes32 _intentHash,
        uint256 _nonce,
        uint256 _gasPrice,
        address _sender,
        bytes32 _hashLock,
        uint256 gasConsumed)
        private
        returns(MessageBus.Message)
    {
       return MessageBus.Message({
            intentHash : _intentHash,
            nonce : _redeemerNonce,
            gasPrice : _gasPrice,
            sender : _redeemer,
            hashLock : _hashLock,
            gasConsumed: 0
       });
    }


}
