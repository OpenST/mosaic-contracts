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

/** @title The interface for the stake contract on origin. */
interface StakeInterface {

    /**
     * @notice The message sender deposits the given amount of OST in the stake
     *         contract to give the validator addresses voting power equal to
     *         the deposit. The validator will be able to cast votes starting
     *         at the current OSTblock height plus two.
     *         Prior to this call, the message sender must approve an OST
     *         transfer of the specified deposit ammount from her account to
     *         the stake contract.
     *
     * @param _amount The amount of OST to deposit.
     * @param _originValidatorAddress The address of the validator on origin.
     * @param _auxiliaryValidatorAddress The address of the validator on
     *                                   auxiliary.
     * @param _withdrawalAddress The address where the OST should be
     *                           transferred in case of a withdrawal.
     *
     * @return The unique index of the registered validator.
     */
    function deposit(
        uint256 _amount,
        address _originValidatorAddress,
        address _auxiliaryValidatorAddress,
        address _withdrawalAddress
    )
        external
        returns (uint256 validatorIndex_);

    /**
     * @notice A logout is a prerequisite to withdrawing the deposited OST
     *         after the holding period. A validator that is logged out has no
     *         more voting power starting from the current OSTblock height plus
     *         two.
     *
     * @param _validatorIndex The unique index of the validator that shall be
     *                        logged out.
     *
     * @return `true` if the logout succeeded.
     */
    function logout(
        uint256 _validatorIndex
    )
        external
        returns (bool success_);

    /**
     * @notice Withdraw the deposit of a validator. A deposit can only be
     *         withdrawn after the holding period has passed after the
     *         validator logged out.
     *
     * @param _validatorIndex The unique index of the validator that shall
     *                        approve the transfer of the deposit to its
     *                        associated withdrawal address.
     *
     * @return `true` if the transfer was approved successfully.
     */
    function withdraw(
        uint256 _validatorIndex
    )
        external
        returns (bool success_);

    /**
     * @notice Slashes a validator based on two votes that violate a slashing
     *         condition.
     *
     * @param _firstVoteMessage The first of the two votes, RLP encoded.
     * @param _secondVoteMessage The second of the two votes, RLP encoded.
     *
     * @return `true` if the validator has been slashed.
     */
    function slash(
        bytes _firstVoteMessage,
        bytes _secondVoteMessage
    )
        external
        returns (bool slashed_);

    /**
     * @notice Notifies the contract about a closing OSTblock in order to
     *         handle any changes in the set of validators.
     *         Can only be called from OriginCore.
     *
     * @param _closedOstBlockHeaderRlp The full header of the closed OSTblock,
     *                                 RLP encoded.
     *
     * @return The full header of the new, opened OSTblock as a result of the
     *         closing, RLP encoded. The newly opened OSTblock header inculdes
     *         all changes in the set of validators.
     */
    function closeOstBlock(
        bytes _closedOstBlockHeaderRlp
    )
        external
        returns (bytes _openedOstBlockHeaderRlp);

    /**
     * @notice Returns the total stake of all validators at a given height.
     *
     * @param _height The height for which to get the total deposit.
     *
     * @return The total stake at the given height.
     */
    function totalStakeAtHeight(
        uint256 _height
    )
        external
        view
        returns (uint256 totalStake_);

    /**
     * @notice Returns the stake of a validator at a specific OSTblock height,
     *         based on the auxiliary address of the validator.
     *
     * @dev The OriginCore can use this method to track the verified stake by
     *      the verified votes and notice when a supermajority has been
     *      reached, therefore committing the OSTblock.
     *
     * @param _height The OSTblock height for which to get the stake.
     * @param _auxiliaryValidatorAddress The address of the validator on the
     *                                   auxiliary chain.
     *
     * @return The stake of the validator at the given height. Can be 0, for
     *         example when the address never deposited.
     */
    function getStakeAtHeightByAuxiliaryAddress(
        uint256 _height,
        address _auxiliaryValidatorAddress
    )
        external
        view
        returns (uint256 validatorStake_);
}
