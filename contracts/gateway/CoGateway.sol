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
// Auxiliary Chain: CoGateway Contract
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

import "./EIP20Interface.sol";
import "./GatewayBase.sol";
import "./MessageBus.sol";
import "./UtilityTokenInterface.sol";
import "../StateRootInterface.sol";
import "../lib/GatewayLib.sol";
import "../lib/OrganizationInterface.sol";
import "../lib/SafeMath.sol";

/**
 *  @title CoGateway contract.
 *
 *  @notice CoGateway contains functions for initial setup of EIP20CoGateway.
 */
contract CoGateway is GatewayBase {
    using SafeMath for uint256;

    /** Emitted whenever a gateway and coGateway linking is confirmed. */
    event GatewayLinkConfirmed(
        bytes32 indexed _messageHash,
        address _gateway,
        address _cogateway,
        address _valueToken,
        address _utilityToken
    );

    /** Emitted whenever a gateway and coGateway linking is complete. */
    event GatewayLinkProgressed(
        bytes32 indexed _messageHash,
        address _gateway,
        address _cogateway,
        address _valueToken,
        address _utilityToken,
        bytes32 _unlockSecret
    );

    /* public variables */

    /** address of utility token. */
    address public utilityToken;

    /** address of value token. */
    address public valueToken;

    /* Constructor */

    /**
     * @notice Initialize the contract by providing the Gateway contract
     *         address for which the CoGateway will enable facilitation of
     *         minting and redeeming.
     *
     * @param _valueToken The value token contract address.
     * @param _utilityToken The utility token address that will be used for
     *                      minting the utility token.
     * @param _core Core contract address.
     * @param _bounty The amount that facilitator will stakes to initiate the
     *                staking process.
     * @param _organization Address of an organization contract.
     * @param _gateway Gateway contract address.
     * @param _messageBus Message bus address.
     */
    constructor(
        address _valueToken,
        address _utilityToken,
        StateRootInterface _core,
        uint256 _bounty,
        OrganizationInterface _organization,
        address _gateway,
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
            _valueToken != address(0),
            "Value token address must not be zero"
        );
        require(
            _utilityToken != address(0),
            "Utility token address must not be zero"
        );
        require(
            _gateway != address(0),
            "Gateway address must not be zero"
        );

        valueToken = _valueToken;
        utilityToken = _utilityToken;
        core = _core;
        remoteGateway = _gateway;

        // update the encodedGatewayPath
        encodedGatewayPath = GatewayLib.bytes32ToBytes(
            keccak256(abi.encodePacked(remoteGateway))
        );
    }

    /* External functions */

    /**
     * @notice Confirm the Gateway and CoGateway contracts initiation.
     *
     * @param _intentHash Gateway and CoGateway linking intent hash.
     *                    This is a sha3 of gateway address, cogateway address,
     *                    bounty, token name, token symbol, token decimals,
     *                    _nonce, token.
     * @param _nonce Nonce of the sender. Here in this case its organization
     *               address of Gateway
     * @param _sender The address that signs the message hash. In this case it
     *                has to be organization address of Gateway
     * @param _hashLock Hash lock, set by the facilitator.
     * @param _blockHeight Block number for which the proof is valid
     * @param _rlpParentNodes RLP encoded parent node data to prove in
     *                        messageBox outbox of Gateway
     *
     * @return messageHash_ Message hash
     */
    function confirmGatewayLinkIntent(
        bytes32 _intentHash,
        uint256 _nonce,
        address _sender,
        bytes32 _hashLock,
        uint256 _blockHeight,
        bytes memory _rlpParentNodes
    )
        public // TODO: check to change it to external, getting stack to deep.
        returns (bytes32 messageHash_)
    {
        require(
            linked == false,
            "CoGateway contract must not be already linked"
        );
        require(
            deactivated == false,
            "Gateway contract must not be deactivated"
        );
        require(
            gatewayLinkHash == bytes32(0),
            "Linking is already initiated"
        );
        require(
            _sender != address(0),
            "Sender must be not be zero"
        );
        require(
            _rlpParentNodes.length > 0,
            "RLP parent nodes must not be zero"
        );

        bytes32 storageRoot = storageRoots[_blockHeight];
        require(
            storageRoot != bytes32(0),
            "Storage root for given block height must not be zero"
        );

        bytes32 intentHash = hashLinkGateway(_nonce);

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

        // initiate new inbox process
        registerInboxProcess(
            _sender,
            _nonce,
            messageHash_
        );

        // Declare message in inbox
        MessageBus.confirmMessage(
            messageBox,
            GATEWAY_LINK_TYPEHASH,
            messages[messageHash_],
            _rlpParentNodes,
            MESSAGE_BOX_OFFSET,
            storageRoot
        );

        gatewayLinkHash = messageHash_;

        // Emit GatewayLinkConfirmed event
        emit GatewayLinkConfirmed(
            messageHash_,
            remoteGateway,
            address(this),
            valueToken,
            utilityToken
        );
    }

    /**
     * @notice Complete the Gateway and CoGateway contracts linking. This will
     *         set the variable linked to true, and thus it will activate the
     *         CoGateway contract for mint and redeem.
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

        // Progress inbox
        MessageBus.progressInbox(
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
            remoteGateway,
            address(this),
            valueToken,
            utilityToken,
            _unlockSecret
        );

        return true;
    }

    /**
     * @notice private function to calculate gateway link intent hash.
     *
     * @dev This function is to avoid stack too deep error in
     *      confirmGatewayLinkIntent function
     *
     * @param _nonce nonce of message
     *
     * @return bytes32 link intent hash
     */
    function hashLinkGateway(
        uint256 _nonce
    )
        private
        view
        returns (bytes32)
    {
        return GatewayLib.hashLinkGateway(
            remoteGateway,
            address(this),
            messageBus,
            EIP20Interface(utilityToken).name(),
            EIP20Interface(utilityToken).symbol(),
            EIP20Interface(utilityToken).decimals(),
            _nonce,
            valueToken);


    }

}
