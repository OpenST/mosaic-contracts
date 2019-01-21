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
 * @title The TestEIP20CoGateway contract allows to directly set certain
 *        statuses and variables.
 *
 * @notice This is only used for testing purposes.
 */
contract TestEIP20CoGateway is EIP20CoGateway {

    /* Constructor */

    /**
     * @notice Initialize the contract by providing the Gateway contract
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
     * @param _organization Address of an organization contract.
     * @param _gateway Gateway contract address.
     * @param _burner An address where tokens are sent when they should be burnt.
     */
    constructor(
        address _valueToken,
        address _utilityToken,
        StateRootInterface _stateRootProvider,
        uint256 _bounty,
        OrganizationInterface _organization,
        address _gateway,
        address payable _burner
    )
        EIP20CoGateway(
            _valueToken,
            _utilityToken,
            _stateRootProvider,
            _bounty,
            _organization,
            _gateway,
            _burner
    )
        public
    {}


    /* Public Functions */

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
        public
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

    /**
     * @notice It sets the storage root for given block height.
     *
     * @dev This is used for testing purpose.
     *
     * @param _blockHeight Mocked block height for testing.
     * @param _storageRoot Mocked storage root for merkle proof testing.
     */
    function setStorageRoot(
        uint256 _blockHeight,
        bytes32 _storageRoot
    )
        public
    {
        storageRoots[_blockHeight] = _storageRoot;
    }

   /**
    * @notice It sets the redeem mapping with respect to the messageHash.
    *
    * @dev This is used for testing purpose.
    *
    * @param _messageHash Hash for which redeem mapping is updated.
    * @param _beneficiary Beneficiary address to which the branded tokens
    *                     will be transferred after unstake.
    * @param _amount Total amount for which the redeem was initiated.
    */
    function setRedeem(
        bytes32 _messageHash,
        address  _beneficiary,
        uint256 _amount
    )
        public
    {
        redeems[_messageHash] = Redeem({
            amount : _amount,
            beneficiary : _beneficiary,
            bounty : bounty
        });
    }

    /** This is added to test progress redeem. Co-gateway should have facilitator
     *  bounty which is in base token(ETH) as a pre-condition of unit test.
     */
    function () external payable
    {

    }

    /**
     * @notice It sets the bounty amount.
     *
     * @dev This is used for testing purpose.
     *
     * @param _bounty Bounty amount to be set.
     */
    function setBounty(uint256 _bounty) external {
        bounty = _bounty;
    }

}
