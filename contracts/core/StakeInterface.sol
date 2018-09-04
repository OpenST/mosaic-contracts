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
     *         contract to give the validator addresses voting weight equal to
     *         the deposit. The validator will be able to cast votes starting
     *         at the current OSTblock height plus two.
     *         Prior to this call, the message sender must approve an OST
     *         transfer of the specified deposit ammount from her account to
     *         the stake contract.
     *         The `msg.sender` will be the only address that is allowed to
     *         log out or withdraw.
     *
     * @param _validator The address of the validator on auxiliary, where the
     *                   voting takes place.
     * @param _amount The amount of OST to deposit.
     *
     * @return `true` if the deposit succeeded.
     */
    function deposit(
        address _validator,
        uint256 _amount
    )
        external
        returns (bool success_);

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
     *         validator was logged out.
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
     * @dev The height is given to `assert` that the call is in sync with the
     *      contract.
     *
     * @param _closingHeight The height of the OSTblock to close.
     *
     * @return The set of updated validators. Could be new validators or
     *         existing validators with an updated weight. Weights can only
     *         decrease.
     */
    function closeOstBlock(
        uint256 _closingHeight
    )
        external
        returns (
            address[] updatedValidators_,
            uint256[] updatedWeights_
        );

    /**
     * @notice Returns the total weight of all validators at a given height.
     *
     * @dev The height is given to `assert` that the call is in sync with the
     *      contract.
     *
     * @param _height The height for which to get the total deposit.
     *
     * @return The total weight at the given height.
     */
    function totalWeightAtHeight(
        uint256 _height
    )
        external
        view
        returns (uint256 totalWeight_);

    /**
     * @notice Returns the weight of a validator at a specific OSTblock height,
     *         based on the auxiliary address of the validator.
     *
     * @dev The OriginCore can use this method to track the verified weight by
     *      the verified votes and notice when a supermajority has been
     *      reached, therefore committing the OSTblock.
     *      The height is given to `assert` that the call is in sync with the
     *      contract.
     *
     * @param _height The OSTblock height for which to get the weight.
     * @param _validator The address of the validator on the auxiliary chain.
     *
     * @return The weight of the validator. Can be 0, for example when the
     *         there was never a deposit for this address.
     */
    function weight(
        uint256 _height,
        address _validator
    )
        external
        view
        returns (uint256 validatorWeight_);
}
