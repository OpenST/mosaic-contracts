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

import "../gateway/EIP20Gateway.sol";
import "../lib/MessageBus.sol";

/**
 * @title Test EIP20 gateway is an EIP20 gateway that is activated by default.
 */
contract TestEIP20Gateway is EIP20Gateway {

    /**
     * @notice Instantiate TestEIP20Gateway for unit testing.
     *
     * @param _token The ERC20 token contract address that will be
     *               staked and corresponding utility tokens will be minted
     *               in auxiliary chain.
     * @param _baseToken The ERC20 token address that will be used for
     *                     staking bounty from the facilitators.
     * @param _stateRootProvider Contract address which implements
     *                           StateRootInterface.
     * @param _bounty The amount that facilitator will stakes to initiate the
     *                stake process.
     * @param _organization Address of an organization contract.
     * @param _burner Address where tokens will be burned.
     */
    constructor(
        EIP20Interface _token,
        EIP20Interface _baseToken,
        StateRootInterface _stateRootProvider,
        uint256 _bounty,
        OrganizationInterface _organization,
        address payable _burner
    )
        EIP20Gateway(
            _token,
            _baseToken,
            _stateRootProvider,
            _bounty,
            _organization,
            _burner
        )
        public
    {
        activated = true;
    }


    /* Public Functions */

    /**
     * @notice It is used to set the stake message.
     *
     * @dev This is used for testing purpose.
     *
     * @param _messageHash Message hash.
     * @param _intentHash Intent hash.
     * @param _stakerNonce Nonce of the staker address.
     * @param _gasPrice Gas price that staker is ready to pay to get the stake
     *                  and mint process done.
     * @param _gasLimit Gas limit that staker is ready to pay.
     * @param _staker Staker address.
     * @param _hashLock Hash Lock provided by the facilitator.
     *
     * @return messageHash_ Hash unique for every request.
     */
    function setStakeMessage(
        bytes32 _messageHash,
        bytes32 _intentHash,
        uint256 _stakerNonce,
        uint256 _gasPrice,
        uint256 _gasLimit,
        address _staker,
        bytes32 _hashLock
    )
        public
    {
        messages[_messageHash] = getMessage(
            _intentHash,
            _stakerNonce,
            _gasPrice,
            _gasLimit,
            _staker,
            _hashLock
        );
    }

    /**
     * @notice It sets the stakes mapping with respect to the messageHash.
     *
     * @dev This is used for testing purpose.
     *
     * @param _messageHash Hash for which mints mapping is updated.
     * @param _beneficiary Beneficiary  Address to which the utility tokens
     *                     will be transferred after minting.
     * @param _amount Total stake amount for which the stake is initiated.
     */
    function setStake(
        bytes32 _messageHash,
        address _beneficiary,
        uint256 _amount
    )
        public
    {
        stakes[_messageHash] = Stake({
            amount : _amount,
            beneficiary : _beneficiary,
            bounty : bounty
        });
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
