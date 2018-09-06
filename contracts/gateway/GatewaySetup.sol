pragma solidity ^0.4.23;

import './ProofLib.sol';
import './MessageBus.sol';
import "./Hasher.sol";
import "./EIP20Interface.sol";


contract GatewaySetup is Hasher {

    struct GatewayLink {
        bytes32 messageHash;
        MessageBus.Message message;
    }

    event GatewayLinkInitiated(
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

    address public coGateway;
    MessageBus.MessageBox messageBox;
    //amount in BT which is staked by facilitator
    uint256 public bounty;
    GatewayLink gatewayLink;
    bool public isActivated;
    address public organisation;
    uint8 outboxOffset = 1;
    /*mapping to store storage root with block height*/
    mapping(uint256 /* block height */ => bytes32)  storageRoots;
    /* path to prove merkle account proof for gateway  */
    bytes  encodedCoGatewayPath;
    //address of branded token.
    EIP20Interface public token;

    constructor(
        uint256 _bounty,
        address _organisation,
        EIP20Interface _token
    )
    public
    {
        require(_organisation != address(0));
        require(_token != address(0));

        isActivated = false;
        token = _token;
        bounty = _bounty;
        organisation = _organisation;
    }

    function initiateGatewayLink(
        address _coGateway,
        bytes32 _intentHash,
        uint256 _gasPrice,
        uint256 _nonce,
        address _sender,
        bytes32 _hashLock,
        bytes _signature)
    external
    payable
    returns (bytes32 messageHash_)
    {
        require(_coGateway != address(0));
        require(_sender == organisation);
        require(msg.value == bounty);
        require(gatewayLink.messageHash == bytes32(0));

        coGateway = _coGateway;
        encodedCoGatewayPath = ProofLib.bytes32ToBytes(keccak256(abi.encodePacked(coGateway)));
        // TODO: need to add check for MessageBus.
        bytes32 intentHash = hashLinkGateway(
            address(this),
            coGateway,
            bounty,
            token.name(),
            token.symbol(),
            token.decimals(),
            _gasPrice,
            _nonce);

        require(intentHash == _intentHash);

        // check nonces
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

        MessageBus.declareMessage(messageBox, GATEWAY_LINK_TYPEHASH, gatewayLink.message, _signature);

        emit GatewayLinkInitiated(
            messageHash_,
            address(this),
            coGateway,
            token
        );

    }

    function processGatewayLink(
        bytes32 _messageHash,
        bytes32 _unlockSecret
    )
    external
    returns (bool /*TBD*/)
    {
        require(_messageHash != bytes32(0));
        require(_unlockSecret != bytes32(0));

        require(gatewayLink.messageHash == _messageHash);

        MessageBus.progressOutbox(messageBox, GATEWAY_LINK_TYPEHASH, gatewayLink.message, _unlockSecret);

        isActivated = true;

        //return bounty
        msg.sender.transfer(bounty);

        emit GatewayLinkProcessed(
            _messageHash,
            address(this),
            coGateway,
            token
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
