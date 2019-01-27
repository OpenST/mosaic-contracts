pragma solidity ^0.5.0;

// Copyright 2019 OpenST Ltd.
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
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

import "../../StateRootInterface.sol";
import "../../gateway/GatewayBase.sol";
import "../../lib/OrganizationInterface.sol";

/**
 * @title TestGatewayBase contract.
 *
 * @notice Used for test only.
 */
contract TestGatewayBase is GatewayBase {

    /* Constructor */

    /**
     * @notice This is used for testing.
     *
     * @param _stateRootProvider Contract address which implements
     *                           StateRootInterface.
     * @param _bounty The amount that facilitator will stakes to initiate the
     *                message transfers.
     * @param _organization Address of a contract that manages workers.
     */
    constructor(
        StateRootInterface _stateRootProvider,
        uint256 _bounty,
        OrganizationInterface _organization
    )
        public
        GatewayBase(
            _stateRootProvider,
            _bounty,
            _organization
        )
    {}

    /* external functions */

    /**
     * @notice It is used to set a message.
     *
     * @dev This is used for testing purpose.
     *
     * @param _intentHash Intent hash.
     * @param _nonce Nonce of the message sender address.
     * @param _gasPrice Gas price that message sender is ready to pay to
     *                  transfer message.
     * @param _gasLimit Gas limit that message sender is ready to pay.
     * @param _sender Message sender address.
     * @param _hashLock Hash Lock provided by the facilitator.
     *
     * @return messageHash_ Hash unique for every request.
     */
    function setMessage(
        bytes32 _intentHash,
        uint256 _nonce,
        uint256 _gasPrice,
        uint256 _gasLimit,
        address _sender,
        bytes32 _hashLock
    )
        external
        returns (bytes32 messageHash_)
    {
        MessageBus.Message memory message = getMessage(
            _intentHash,
            _nonce,
            _gasPrice,
            _gasLimit,
            _sender,
            _hashLock
        );

        messageHash_ = MessageBus.messageDigest(
            message.intentHash,
            message.nonce,
            message.gasPrice,
            message.gasLimit,
            message.sender,
            message.hashLock
        );

        messages[messageHash_] = message;

    }

    /**
     * @notice It sets the status of inbox.
     *
     * @dev This is used for testing purpose.
     *
     * @param _messageHash It sets the status of the message.
     * @param _status It sets the state of the message.
     */
    function setInboxStatus(
        bytes32 _messageHash,
        MessageBus.MessageStatus _status
    )
        external
    {
        messageBox.inbox[_messageHash] = _status;
    }

    /**
     * @notice It sets the status of outbox.
     *
     * @dev This is used for testing purpose.
     *
     * @param _messageHash MessageHash for which status is the be set.
     * @param _status Status of the message to be set.
     */
    function setOutboxStatus(
        bytes32 _messageHash,
        MessageBus.MessageStatus _status
    )
        external
    {
        messageBox.outbox[_messageHash] = _status;
    }

    /**
     * @notice It sets the message hash for active inbox process.
     *
     * @dev This is used for testing purpose.
     *
     * @param _account Account address.
     * @param _messageHash MessageHash for which status is the be set.
     */
    function setInboxProcess(
        address _account,
        bytes32 _messageHash
    )
        external
    {
        super.registerInboxProcess(_account, 1, _messageHash);
    }

    /**
     * @notice It sets the message hash for active outbox process.
     *
     * @dev This is used for testing purpose.
     *
     * @param _account Account address.
     * @param _messageHash MessageHash for which status is the be set.
     */
    function setOutboxProcess(
        address _account,
        bytes32 _messageHash
    )
        external
    {
        super.registerOutboxProcess(_account, 1, _messageHash);
    }
}
