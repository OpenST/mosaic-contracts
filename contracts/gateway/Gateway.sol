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
// Origin Chain: GatewaySetup Contract
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

import './MessageBus.sol';
import "./EIP20Interface.sol";
import "./GatewayBase.sol";

/**
 *  @title GatewaySetup contract.
 *
 *  @notice GatewaySetup contains functions for initial setup of gateway.
 */
contract Gateway is  GatewayBase {

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
     * the facilitator will stake for a process
     */
    EIP20Interface public bountyToken;

    /** Gateway link message hash. */

    /**
     * @notice Initialise the contract by providing the ERC20 token address
     *         for which the gateway will enable facilitation of staking and
     *         minting.
     *
     * @param _token The ERC20 token contract address that will be
     *               staked and corresponding utility tokens will be minted
     *               in auxiliary chain.
     * @param _bountyToken The ERC20 token address that will be used for
     *                     staking bounty from the facilitators.
     * @param _core Core contract address.
     * @param _bounty The amount that facilitator will stakes to initiate the
     *                staking process.
     * @param _organisation Organisation address.
     */
    constructor(
        EIP20Interface _token,
        EIP20Interface _bountyToken, //TODO: think of a better name
        CoreInterface _core,
        uint256 _bounty,
        address _organisation,
        address _messageBus
    )
    GatewayBase(_core, _messageBus, _bounty, _organisation)
    public
    {

        require(
            _token != address(0),
            "Token contract address must not be zero"
        );
        require(
            _bountyToken != address(0),
            "Token contract address for bounty must not be zero"
        );
        token = _token;
        bountyToken = _bountyToken;


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
     * @param _nonce Nonce of the sender. Here in this case its organisation
     *               address
     * @param _sender The address that signs the message hash. In this case it
     *                has to be organisation address
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
        bytes _signature
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
            _sender == organisation,
            "Sender must be organisation address"
        );
        require(
            gatewayLinkHash == bytes32(0),
            "Linking is already initiated"
        );
        require(
            _hashLock != bytes32(0),
            "Hash lock must not be zero"
        );
        require(
            _signature.length == 65,
            "Signature must be of length 65"
        );

        //       (This is already done in other branch)
        bytes32 intentHash = GatewayLib.hashLinkGateway(
            address(this),
            _coGateway,
            messageBus,
            bounty,
            token.name(),
            token.symbol(),
            token.decimals(),
            _nonce,
            token);

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
        initiateNewProcess(
            _sender,
            _nonce,
            messageHash_,
            MessageBus.MessageBoxType.Outbox
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
            token
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
            _unlockSecret != bytes32(0),
            "Unlock secret must not be zero"
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
            token,
            _unlockSecret
        );

        return true;
    }

    /** internal methods*/

    /**
     * @notice Clears the previous process. Validates the
     *         nonce. Updates the process with new process
     *
     * @param _account Account address
     * @param _nonce Nonce for the account address
     * @param _messageHash Message hash
     * @param _messageBoxType message box type i.e Inbox or Outbox
     *
     * @return previousMessageHash_ previous messageHash
     */
    function initiateNewProcess(
        address _account,
        uint256 _nonce,
        bytes32 _messageHash,
        MessageBus.MessageBoxType _messageBoxType

    )
    internal
    returns (bytes32 previousMessageHash_)
    {
        require(
            _nonce == _getNonce(_account),
            "Invalid nonce"
        );

        ActiveProcess storage previousProcess = activeProcess[_account];
        previousMessageHash_ = previousProcess.messageHash;

        if (previousProcess.messageHash != bytes32(0)) {

            MessageBus.MessageStatus status;
            if (previousProcess.messageBoxType ==
                MessageBus.MessageBoxType.Inbox) {
                status = messageBox.inbox[previousMessageHash_];
            } else {
                status = messageBox.outbox[previousMessageHash_];
            }
            require(
                status != MessageBus.MessageStatus.Progressed ||
                status != MessageBus.MessageStatus.Revoked,
                "Previous process is not completed"
            );
            //TODO: Commenting below line. Please check if deleting this will
            //      effect any process related to merkle proof in other chain.
            //delete messageBox.outbox[previousMessageHash_];

            delete messages[previousMessageHash_];
        }

        // Update the active proccess.
        activeProcess[_account] = ActiveProcess({
            messageHash : _messageHash,
            messageBoxType : _messageBoxType
            });
    }

}
