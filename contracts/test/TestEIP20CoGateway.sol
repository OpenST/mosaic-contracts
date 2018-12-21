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
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

import "../gateway/EIP20CoGateway.sol";

/**
 * @title TestEIP20CoGateway contract.
 *
 * @notice This is used for testing purpose.
 */
contract TestEIP20CoGateway is EIP20CoGateway {

    /* Constructor */

    /**
     * @notice Initialise the contract by providing the Gateway contract
     *         address for which the CoGateway will enable facilitation of
     *         minting and redeeming.This is used for testing purpose.
     *
     * @param _valueToken The value token contract address.
     * @param _utilityToken The utility token address that will be used for
     *                      minting the utility token.
     * @param _stateRootProvider Contract address which implements
     *                           StateRootInterface.
     * @param _bounty The amount that facilitator will stakes to initiate the
     *                staking process.
     * @param _membersManager Address of a members manager contract.
     * @param _gateway Gateway contract address.
     */
    constructor(
        address _valueToken,
        address _utilityToken,
        StateRootInterface _stateRootProvider,
        uint256 _bounty,
        IsMemberInterface _membersManager,
        address _gateway,
        address payable _burner
    )
        EIP20CoGateway(
            _valueToken,
            _utilityToken,
            _stateRootProvider,
            _bounty,
            _membersManager,
            _gateway,
            _burner
    )
        public
    { }


    /* Public Functions */

    /**
     * @notice It is used to set the stake message.
     *
     * @dev This is used for testing purpose.
     *
     * @param _intentHash Intent hash.
     * @param _stakerNonce Nonce of the staker address.
     * @param _gasPrice Gas price that staker is ready to pay to get the stake
     *                  and mint process done.
     * @param _gasLimit Gas limit that staker is ready to pay.
     * @param _hashLock Hash Lock provided by the facilitator.
     * @param _staker Staker address.
     *
     * @return messageHash_ Hash unique for every request.
     */
    function setStakeMessage(
        bytes32 _intentHash,
        uint256 _stakerNonce,
        uint256 _gasPrice,
        uint256 _gasLimit,
        bytes32 _hashLock,
        address _staker
    )
        public
        returns (bytes32 messageHash_)
    {

        messageHash_ = MessageBus.messageDigest(
            STAKE_TYPEHASH,
            _intentHash,
            _stakerNonce,
            _gasPrice,
            _gasLimit
        );

        messages[messageHash_] = getMessage(
            _staker,
            _stakerNonce,
            _gasPrice,
            _gasLimit,
            _intentHash,
            _hashLock
        );

        return messageHash_;

    }

    /**
     * @notice It sets the mints mapping with respect to the messageHash.
     *
     * @dev This is used for testing purpose.
     *
     * @param _messageHash Hash for which mints mapping is updated.
     * @param _beneficiary Beneficiary  Address to which the utility tokens
     *                     will be transferred after minting.
     * @param _amount Total amount for which the stake was initiated. The
     *                reward amount is deducted from the total amount and
     *                is given to the facilitator.
     */
    function setMints(
        bytes32 _messageHash,
        address payable _beneficiary,
        uint256 _amount
    )
        public
    {
        mints[_messageHash] = Mint({
            amount : _amount,
            beneficiary : _beneficiary
        });
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
        public
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
        public
    {
        messageBox.outbox[_messageHash] = _status;
    }

}
