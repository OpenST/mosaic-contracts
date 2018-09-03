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

import "../gateway/EIP20Interface.sol";
import "./StakeInterface.sol";

/**
 * @title The Stake controct trocks deposits, logouts, slashings etc. on origin.
 */
contract Stake is StakeInterface {

    /* Events */

    /** Emitted whenever a new validator is successfully deposited. */
    event NewDeposit(
        uint256 indexed validatorId,
        address indexed validatorAddress,
        uint256 stake
    );

    /** Emitted whenever an OSTblock increase is successfully registered. */
    event HeightIncreased(uint256 indexed newHeight);

    /* Structs */

    /** A registered validator, */
    struct Validator {
        /**
         * The depositor is the address that did the deposit for this
         * validator. Only the depositor is allowed to logout the validator or
         * withdraw the stake.
         */
        address depositor;

        /**
         * This is the address that the validator uses to sign votes on
         * auxiliary.
         */
        address auxiliaryAddress;

        /**
         * The stake initially equals the deposit. It can increase due to
         * withdrawal or slashing. Initially, the weight on auxiliary will 
         * equal the stake.
         */
        uint256 stake;

        /**
         * Will be true if a validator has been slashed. An evicted validator
         * may still have stake that the depositor can withdraw. However the
         * weight of an evicted validator is always zero.
         */
        bool evicted;
    }

    /* Public Variables */

    /** The token that is used as staking currency. */
    EIP20Interface public stakingToken;

    /** Address of the origin core. */
    address public originCore;

    /** The current, open OSTblock height. */
    uint256 public height;

    /**
     * The next index in the validators mapping. Iterate over all validators by
     * iterating over `[0..validatorIndex[`.
     */
    uint256 public validatorIndex;

    /**
     * Maps from index to validator.
     * All the validators that have ever been deposited. Includes logged out
     * and evicted validators.
     */
    mapping (uint256 => Validator) public validators;

    /**
     * Maps from height to validator auxiliary addresses.
     * Tracks future validator updates to add to new OSTblocks. A validator is
     * added at deposit height plus 2.
     */
    mapping (uint256 => address[]) private updateAddresses;

    /**
     * Maps from height to validator auxiliary weights.
     * Tracks the weight updates that correspond to the validator updates above.
     */
    mapping (uint256 => uint256[]) private updateWeights;

    /* Constructor */

    /**
     * @param _stakingToken The address of the ERC-20 token that is used to
     *                      deposit stakes.
     * @param _originCore Address of the origin core. Some methods may only be
     *                    called from the origin core.
     */
    constructor(address _stakingToken, address _originCore) public {
        stakingToken = EIP20Interface(_stakingToken);
        originCore = _originCore;
    }

    /* External Functions */

    /**
     * @notice The message sender deposits the given amount of ERC-20 in the
     *         stake contract to give the validator addresses voting weight
     *         equal to the deposit. The validator will be able to cast votes
     *         starting at the current OSTblock height plus two.
     *         Prior to this call, the message sender must approve an ERC-20
     *         transfer of the specified deposit ammount from her account to
     *         the stake contract.
     *         The `msg.sender` will be the only address that is allowed to
     *         log out or withdraw (the depositor).
     *
     * @param _validator The address of the validator on auxiliary, where the
     *                   voting takes place.
     * @param _amount The amount of ERC-20 to deposit.
     *
     * @return The unique index of the registered validator.
     */
    function deposit(
        address _validator,
        uint256 _amount
    )
        external
        returns (uint256 validatorIndex_)
    {
        require(
            _validator != address(0),
            "The validator address may not be zero."
        );
        require(
            _amount > 0,
            "The deposit amount must be greater than zero."
        );
        require(
            !validatorExists(_validator),
            "You must deposit for a validator that is not staked yet."
        );

        require(
            stakingToken.transferFrom(msg.sender, address(this), _amount),
            "Could not transfer deposit to the stake contract."
        );

        validatorIndex_ = registerNewValidator(_validator, _amount);

        emit NewDeposit(
            validatorIndex_,
            _validator,
            _amount
        );
    }

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
        returns (bool success_)
    {
        revert("This method is not implemented.");
    }

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
        returns (bool success_)
    {
        revert("This method is not implemented.");
    }

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
        returns (bool slashed_)
    {
        revert("This method is not implemented.");
    }

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
        )
    {
        assert(_closingHeight == height);
        require(
            msg.sender == originCore,
            "Caller must be the registered Origin Core."
        );

        height++;

        updatedValidators_ = updateAddresses[height];
        updatedWeights_ = updateWeights[height];

        emit HeightIncreased(height);
    }

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
        returns (uint256 totalWeight_)
    {
        revert("This method is not implemented.");
    }

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
        returns (uint256 validatorWeight_)
    {
        revert("This method is not implemented.");
    }

    /* Private Functions */

    /**
     * @notice Creates a new validator and adds it to the list of validators.
     *
     * @dev You must check that the validator is not yet part of the validators
     *      before you call this method.
     *
     * @param _validator The address of the new validator.
     * @param _amount The initial stake of the new validator.
     *
     * @return The index under which the new validator is stored.
     */
    function registerNewValidator(
        address _validator,
        uint256 _amount
    )
        private
        returns (uint256 validatorIndex_)
    {
        Validator memory validator = Validator(
            msg.sender,
            _validator,
            _amount,
            false
        );
        validators[validatorIndex] = validator;
        validatorIndex_ = validatorIndex;
        validatorIndex++;

        /* The new new validator will have its initial weight at height + 2. */
        updateAddresses[height+2].push(_validator);
        updateWeights[height+2].push(_amount);
    }

    /**
     * @notice Checks the existing validators for the given one.
     *
     * @param _validator The validator that is looked up in the existing
     *                   validators.
     *
     * @return `true` if a validator with that address was staked before.
     *         `false` otherwise.
     */
    function validatorExists(address _validator) private view returns (bool) {
        for (uint256 i = 0; i < validatorIndex; i++) {
            if (validators[i].auxiliaryAddress == _validator) {
                return true;
            }
        }

        return false;
    }
}
