pragma solidity ^0.4.23;

import "./MessageBus.sol";
import "./ProofLib.sol";
import "./Hasher.sol";
import "./EIP20Interface.sol";
import "./SafeMath.sol";

contract CoGatewaySetup is Hasher {
    using SafeMath for uint256;

    event GatewayLinkConfirmed(
        bytes32 messageHash,
        address gateway,
        address cogateway,
        address token
    );

    event GatewayLinkProcessed(
        bytes32 messageHash,
        address gateway,
        address cogateway,
        address token
    );

    struct GatewayLink {
        bytes32 messageHash;
        MessageBus.Message message;
    }

    address public gateway;
    MessageBus.MessageBox messageBox;
    address public organisation;
    bool public isActivated;
    GatewayLink gatewayLink;
    uint256 public bounty;
    address public utilityToken;
    uint8 outboxOffset = 1;
    /*mapping to store storage root with block height*/
    mapping(uint256 /* block height */ => bytes32)  storageRoots;
    /* path to prove merkle account proof for gateway  */
    bytes  encodedGatewayPath;

    constructor(
        address _utilityToken,
        uint256 _bounty,
        address _organisation,
        address _gateway
    ){

        require(_utilityToken != address(0));
        require(_gateway != address(0));
        require(_organisation != address(0));

        isActivated = false;
        utilityToken = _utilityToken;
        gateway = _gateway;
        bounty = _bounty;
        organisation = _organisation;

        encodedGatewayPath = ProofLib.bytes32ToBytes(keccak256(abi.encodePacked(_gateway)));

    }


    function confirmGatewayLinkIntent(
        bytes32 _intentHash,
        uint256 _gasPrice,
        uint256 _nonce,
        address _sender,
        bytes32 _hashLock,
        uint256 _blockHeight,
        bytes memory _rlpParentNodes
    )
    public
    returns (bytes32 messageHash_)
    {
        uint256 initialGas = gasleft();
        require(msg.sender == organisation);
        require(gatewayLink.messageHash == bytes32(0));

        // TODO: need to add check for MessageBus.
        bytes32 intentHash = hashLinkGateway(
            gateway,
            address(this),
            bounty,
            EIP20Interface(utilityToken).name(),
            EIP20Interface(utilityToken).symbol(),
            EIP20Interface(utilityToken).decimals(),
            _gasPrice,
            _nonce);

        require(intentHash == _intentHash);

        messageHash_ = MessageBus.messageDigest(GATEWAY_LINK_TYPEHASH, intentHash, _nonce, _gasPrice);

        gatewayLink = GatewayLink({
            messageHash : messageHash_,
            message : getMessage(
                _sender,
                _nonce,
                _gasPrice,
                _intentHash,
                _hashLock
            )
            });


        MessageBus.confirmMessage(
            messageBox,
            GATEWAY_LINK_TYPEHASH,
            gatewayLink.message,
            _rlpParentNodes,
            outboxOffset,
            storageRoots[_blockHeight]);

        emit GatewayLinkConfirmed(
            messageHash_,
            gateway,
            address(this),
            utilityToken
        );
        gatewayLink.message.gasConsumed = initialGas.sub(gasleft());
    }

    function processGatewayLink(
        bytes32 _messageHash,
        bytes32 _unlockSecret
    )
    external
    returns (bool /*TBD*/)
    {
        // TODO: think about fee transfer
        require(_messageHash != bytes32(0));
        require(_unlockSecret != bytes32(0));

        require(gatewayLink.messageHash == _messageHash);

        MessageBus.progressInbox(messageBox, GATEWAY_LINK_TYPEHASH, gatewayLink.message, _unlockSecret);

        // TODO: think about fee transfer

        isActivated = true;
        emit  GatewayLinkProcessed(
            _messageHash,
            gateway,
            address(this),
            utilityToken
        );
        return true;
    }

    function getMessage(
        address _sender,
        uint256 _nonce,
        uint256 _gasPrice,
        bytes32 _intentHash,
        bytes32 _hashLock
    )
    internal
    pure
    returns (MessageBus.Message)
    {
        return MessageBus.Message({
            intentHash : _intentHash,
            nonce : _nonce,
            gasPrice : _gasPrice,
            sender : _sender,
            hashLock : _hashLock,
            gasConsumed : 0
            });
    }

}
