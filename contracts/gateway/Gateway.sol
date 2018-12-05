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
// Origin Chain: Gateway Contract
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

/*
Origin chain      |       Auxiliary chain
-------------------------------------------------------------------------------
EIP20Gateway - - - - - - - - - - - EIP20CoGateway
-------------------------------------------------------------------------------
1. GatewayLinking:

initiateGatewayLink  --->   confirmGatewayLinkIntent
|
progressGatewayLink  --->   progressGatewayLink
-------------------------------------------------------------------------------
*/

import "./MessageBus.sol";
import "./EIP20Interface.sol";
import "./GatewayBase.sol";
import "../StateRootInterface.sol";
import "../lib/OrganizationInterface.sol";

/**
 *  @title Gateway contract.
 *
 *  @notice Gateway contains functions for initial setup of EIP20-gateway.
 */
contract Gateway is GatewayBase {

    /** Emitted whenever a gateway and coGateway linking is initiated. */
    event GatewayLinkInitiated(
        bytes32 indexed _messageHash,
        address _gateway,
        address _cogateway,
        address _token
    );

    /** Emitted whenever a gateway and coGateway linking is completed. */
    event GatewayLinkProgressed(
        bytes32 indexed _messageHash,
        address _gateway,
        address _cogateway,
        address _token,
        bytes32 _unlockSecret
    );

    /** address of ERC20 token. */
    EIP20Interface public token;

    /**
     * address of ERC20 token in which
     * the facilitator will stake(bounty) for a process
     */
    EIP20Interface public baseToken;

    /**
     * @notice Initialise the contract by providing the ERC20 token address
     *         for which the gateway will enable facilitation of stake and
     *         mint.
     *
     * @param _token The ERC20 token contract address that will be
     *               staked and corresponding utility tokens will be minted
     *               in auxiliary chain.
     * @param _baseToken The ERC20 token address that will be used for
     *                     staking bounty from the facilitators.
     * @param _core Core contract address.
     * @param _bounty The amount that facilitator will stakes to initiate the
     *                staking process.
     * @param _organization Address of an organization contract.
     */
    constructor(
        EIP20Interface _token,
        EIP20Interface _baseToken,
        StateRootInterface _core,
        uint256 _bounty,
        OrganizationInterface _organization,
        address _messageBus
    )
        GatewayBase(
            _core,
            _messageBus,
            _bounty,
            _organization
        )
        public
    {

        require(
            address(_token) != address(0),
            "Token contract address must not be zero"
        );
        require(
            address(_baseToken) != address(0),
            "Base token contract address for bounty must not be zero"
        );
        token = _token;
        baseToken = _baseToken;


    }

    /* External functions */

    /**
     * @notice Initiate the Gateway and CoGateway contracts linking.
     *
     * @param _coGateway CoGateway contract address.
     * @param _intentHash Gateway and CoGateway linking intent hash.
     *                    This is a sha3 of gateway address, cogateway address,
     *                    bounty, token name, token symbol, token decimals,
     *                    _nonce, token.
     * @param _nonce Nonce of the sender. Here in this case its organization
     *               address
     * @param _sender The address that signs the message hash. In this case it
     *                has to be organization address
     * @param _hashLock Hash lock, set by the facilitator.
     * @param _signature Signed data.
     *
     * @return messageHash_ Message hash
     */
    function initiateGatewayLink(
        address _coGateway,
        bytes32 _intentHash,
        uint256 _nonce,
        address _sender,
        bytes32 _hashLock,
        bytes calldata _signature
    )
        external
        returns (bytes32 messageHash_)
    {
        require(
            linked == false,
            "Gateway contract must not be already linked"
        );
        require(
            deactivated == false,
            "Gateway contract must not be deactivated"
        );
        require(
            _coGateway != address(0),
            "CoGateway address must not be zero"
        );
        require(
            gatewayLinkHash == bytes32(0),
            "Linking is already initiated"
        );
        require(
            _signature.length == 65,
            "Signature must be of length 65"
        );

        bytes32 intentHash = GatewayLib.hashLinkGateway(
            address(this),
            _coGateway,
            messageBus,
            token.name(),
            token.symbol(),
            token.decimals(),
            _nonce,
            address(token)
        );

        // Ensure that the _intentHash matches the calculated intentHash
        require(
            intentHash == _intentHash,
            "Incorrect intent hash"
        );

        // Get the message hash
        messageHash_ = MessageBus.messageDigest(
            GATEWAY_LINK_TYPEHASH,
            intentHash,
            _nonce,
            0,
            0
        );

        // create Message object
        messages[messageHash_] = getMessage(
            _sender,
            _nonce,
            0,
            0,
            _intentHash,
            _hashLock
        );

        // initiate new new outbox process
        registerOutboxProcess(
            _sender,
            _nonce,
            messageHash_
        );

        // Declare message in outbox
        MessageBus.declareMessage(
            messageBox,
            GATEWAY_LINK_TYPEHASH,
            messages[messageHash_],
            _signature
        );

        // update the coGateway address
        remoteGateway = _coGateway;

        // update gateway link hash
        gatewayLinkHash = messageHash_;

        // update the encodedGatewayPath
        encodedGatewayPath = GatewayLib.bytes32ToBytes(
            keccak256(abi.encodePacked(_coGateway))
        );

        // emit GatewayLinkInitiated event
        emit GatewayLinkInitiated(
            messageHash_,
            address(this),
            _coGateway,
            address(token)
        );

    }

    /**
     * @notice Complete the Gateway and CoGateway contracts linking. This will
     *         set the variable linked to true, and thus it will activate the
     *         Gateway contract for stake and mint.
     *
     * @param _messageHash Message hash
     * @param _unlockSecret Unlock secret for the hashLock provide by the
     *                      facilitator while initiating the Gateway/CoGateway
     *                      linking
     *
     * @return `true` if gateway linking was successfully progressed
     */
    function progressGatewayLink(
        bytes32 _messageHash,
        bytes32 _unlockSecret
    )
        external
        returns (bool)
    {
        require(
            _messageHash != bytes32(0),
            "Message hash must not be zero"
        );
        require(
            gatewayLinkHash == _messageHash,
            "Invalid message hash"
        );

        // Progress the outbox.
        MessageBus.progressOutbox(
            messageBox,
            GATEWAY_LINK_TYPEHASH,
            messages[_messageHash],
            _unlockSecret
        );

        // Update to specify the Gateway/CoGateway is linked
        linked = true;

        // Emit GatewayLinkProgressed event
        emit GatewayLinkProgressed(
            _messageHash,
            address(this),
            remoteGateway,
            address(token),
            _unlockSecret
        );

        return true;
    }

    /** internal methods*/

}
