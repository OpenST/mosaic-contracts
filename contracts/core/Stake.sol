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

import "../gateway/EIP20Interface.sol";
import "./StakeInterface.sol";
import "../lib/SafeMath.sol";

/**
 * @title The Stake contract tracks deposits, logouts, slashings etc. on origin.
 */
contract Stake is StakeInterface {
    using SafeMath for uint256;

    /* Events */

    /** Emitted whenever a new validator is successfully deposited. */
    event NewDeposit(
        address indexed validatorAddress,
        uint256 indexed stake
    );

    /** Emitted whenever a meta-block increase is successfully registered. */
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
         * The stake initially equals the deposit. It can decrease due to
         * withdrawal or slashing. Initially, the weight on auxiliary will 
         * equal the stake.
         */
        uint256 stake;

        /**
         * This is the height at which the validator's weight is greater than
         * zero for the first time.
         */
        uint256 startingHeight;

        /**
         * Will be true if a validator has been slashed or logged out.
         * An evicted validator may still have stake that the depositor can
         * withdraw. For example in the case of a partial slashing. However,
         * the weight of an evicted validator is always zero starting from the
         * `evictionHeight`.
         */
        bool evicted;

        /**
         * If the validator has been evicted, this states the height at which
         * the eviction goes into effect. Starting from this height, a
         * validator has a weight of zero. In case of a logout, the eviction
         * height is the current height plus two.
         */
        uint256 evictionHeight;
    }

    /* Public Variables */

    /** Stores whether the initialize function has been called. */
    bool public isInitialized;

    /** The token that is used as staking currency. */
    EIP20Interface public stakingToken;

    /** Address of the mosaic core. */
    address public mosaicCore;

    /**
     * The minimum weight that is required for this meta-blockchain to function.
     * If the total weight goes below the minimum weight, the meta-blockchain is
     * considered halted. See also the modifier `aboveMinimumWeight()`.
     */
    uint256 public minimumWeight;

    /** The current, open meta-block height. */
    uint256 public height;

    /**
     * All addresses of validators that were deposited. Includes logged out and
     * evicted validators.
     */
    address[] public validatorAddresses;

    /**
     * Maps from the auxiliary address to the validator.
     * The address is the address that the validator uses to sign votes on
     * auxiliary.
     * All the validators that have ever been deposited. Includes logged out
     * and evicted validators.
     */
    mapping (address => Validator) public validators;

    /**
     * Maps from height to validator auxiliary addresses.
     * Tracks future validator updates to add to new meta-blocks. A validator is
     * added at deposit height plus 2.
     */
    mapping (uint256 => address[]) private updateAddresses;

    /**
     * Maps from height to validator auxiliary weights.
     * Tracks the weight updates that correspond to the validator updates above.
     */
    mapping (uint256 => uint256[]) private updateWeights;

    /* Modifiers */

    /**
     * Verifies that the message was sent by the mosaic core.
     */
    modifier onlyMosaicCore() {
        require(
            msg.sender == mosaicCore,
            "Caller must be the registered mosaic Core."
        );

        _;
    }

    /**
     * Verifies that the current weight is greater than or equal to the minimum
     * weight.
     */
    modifier aboveMinimumWeight() {
        /*
         * Auxiliary has halted as it is no longer possible to add new
         * validators. As the current set of validators does not reach the
         * minimum weight, it cannot update meta-blocks anymore to add new
         * validators.
         */
        require(
            totalWeightAtHeight_(height) >= minimumWeight,
            "The total weight must be greater than the minimum weight. Auxiliary has halted."
        );

        _;
    }

    /* Constructor */

    /**
     * @notice Stake is deployed in two phases. First, it is constructed. Then,
     *         before it becomes functional, the initial set of validators must
     *         be set by calling `initialize()`.
     *         !!! You probably don't want to deploy the Stake contract
     *         !!! yourself. Instead, it should be deployed from the MosaicCore
     *         !!! constructor.
     *
     * @param _stakingToken The address of the ERC-20 token that is used to
     *                      deposit stakes.
     * @param _mosaicCore Address of the mosaic core. Some methods may only be
     *                    called from the mosaic core.
     * @param _minimumWeight The minimum total weight that all active validators
     *                       must have so that the meta-blockchain is not
     *                       considered halted. See also the modifier
     *                       `aboveMinimumWeight()`.
     */
    constructor(
        address _stakingToken,
        address _mosaicCore,
        uint256 _minimumWeight
    )
        public
    {
        require(
            _stakingToken != address(0),
            "The address of the staking token must not be zero."
        );
        require(
            _mosaicCore != address(0),
            "The address of the mosaic core must not be zero."
        );
        require(
            _minimumWeight > 0,
            "Minimum weight must be greater than zero."
        );

        stakingToken = EIP20Interface(_stakingToken);
        mosaicCore = _mosaicCore;
        minimumWeight = _minimumWeight;

        /*
         * Height of meta-block starts with 1 as genesis block at height 0
         * is considered as finalized by default.  
         */
        height = 1;
    }

    /* External Functions */

    /**
     * @notice Must be called after construction and before Stake becomes
     *         operational. This initializes Stake with an initial set of
     *         validators so that that initial set can start working.
     *
     * @param _initialDepositors An array of addresses that deposit the given
     *                           stakes for the given validators.
     * @param _initialValidators An array of addresses that represents the
     *                           validators' addresses on auxiliary.
     * @param _initialStakes The amount that the depositors will deposit for
     *                       the validators.
     */
    function initialize(
        address[] calldata _initialDepositors,
        address[] calldata _initialValidators,
        uint256[] calldata _initialStakes
    )
        external
    {
        require(
            !isInitialized,
            "Initialize can only be called once."
        );
        isInitialized = true;

        require(
            _initialDepositors.length == _initialValidators.length &&
            _initialDepositors.length == _initialStakes.length,
            "The initial validator arrays must all have the same length."
        );

        uint256 startingHeight = 0;
        for (uint256 i = 0; i < _initialDepositors.length; i++) {
            verifyNewValidator(
                _initialDepositors[i],
                _initialValidators[i],
                _initialStakes[i]
            );
            registerNewValidator(
                _initialDepositors[i],
                _initialValidators[i],
                _initialStakes[i],
                startingHeight
            );
        }

        require(
            totalWeightAtHeight_(startingHeight) >= minimumWeight,
            "The total initial weight must be greater than the minimum weight."
        );
    }

    /**
     * @notice The message sender deposits the given amount of ERC-20 in the
     *         stake contract to give the validator addresses voting weight
     *         equal to the deposit. The validator will be able to cast votes
     *         starting at the current meta-block height plus two.
     *         Prior to this call, the message sender must approve an ERC-20
     *         transfer of the specified deposit amount from her account to
     *         the stake contract.
     *         The `msg.sender` will be the only address that is allowed to
     *         log out or withdraw (the depositor).
     *
     * @param _validator The address of the validator on auxiliary, where the
     *                   voting takes place.
     * @param _amount The amount of ERC-20 to deposit.
     *
     * @return `true` if the deposit succeeded.
     */
    function deposit(
        address _validator,
        uint256 _amount
    )
        external
        aboveMinimumWeight()
        returns (bool success_)
    {
        verifyNewValidator(msg.sender, _validator, _amount);

        uint256 startingHeight = height.add(2);
        registerNewValidator(msg.sender, _validator, _amount, startingHeight);

        emit NewDeposit(
            _validator,
            _amount
        );

        success_ = true;
    }

    /**
     * @notice A logout is a prerequisite to withdrawing the deposited OST
     *         after the holding period. A validator that is logged out has no
     *         more voting power starting from the current meta-block height plus
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
        /*
         * @dev below lines are to silence the compiler warnings. Once this
         *      function is implemented this will be removed.
         */
        _validatorIndex;
        success_;

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
        /*
         * @dev below lines are to silence the compiler warnings. Once this
         *      function is implemented this will be removed.
         */
        _validatorIndex;
        success_;

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
        bytes calldata _firstVoteMessage,
        bytes calldata _secondVoteMessage
    )
        external
        returns (bool slashed_)
    {
        /*
         * @dev below lines are to silence the compiler warnings. Once this
         *      function is implemented this will be removed.
         */
        _firstVoteMessage;
        _secondVoteMessage;
        slashed_;

        revert("This method is not implemented.");
    }

    /**
     * @notice Notifies the contract about a closing meta-block in order to
     *         handle any changes in the set of validators.
     *         Can only be called from MosaicCore.
     *
     * @dev The height is given to `assert` that the call is in sync with the
     *      contract.
     *
     * @param _closingHeight The height of the meta-block to close.
     *
     * @return The set of updated validators. Could be new validators or
     *         existing validators with an updated weight.
     */
    function closeMetaBlock(
        uint256 _closingHeight
    )
        external
        onlyMosaicCore()
        aboveMinimumWeight()
        returns (
            address[] memory updatedValidators_,
            uint256[] memory updatedWeights_
        )
    {
        assert(_closingHeight == height);

        height = height.add(1);

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
     * @param _height The height for which to get the total weight.
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
        totalWeight_ = totalWeightAtHeight_(_height);
    }

    /**
     * @notice Returns the weight of a validator at a specific meta-block height,
     *         based on the auxiliary address of the validator.
     *
     * @dev The MosaicCore can use this method to track the verified weight by
     *      the verified votes and notice when a supermajority has been
     *      reached, therefore committing the meta-block.
     *      The height is given to `assert` that the call is in sync with the
     *      contract.
     *
     * @param _height The meta-block height for which to get the weight.
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
        validatorWeight_ = validatorWeightAtHeight(_height, _validator);
    }

    /**
     * @notice Returns all registered validator addresses.
     *
     * @return An array of validator addresses. Includes evicted validators.
     */
    function getValidatorAddresses()
        external
        view returns(address[] memory validatorAddresses_)
    {
        validatorAddresses_ = validatorAddresses;
    }

    /* Private Functions */

    /**
     * @notice Calculates the total weight of all active validators at a given
     *         height.
     *
     * @param _height For which height to get the total weight.
     *
     * @return totalWeight_ At the given height.
     */
    function totalWeightAtHeight_(
        uint256 _height
    )
        private
        view
        returns (uint256 totalWeight_)
    {
        for (uint256 i = 0; i < validatorAddresses.length; i++) {
            address validator = validatorAddresses[i];
            totalWeight_ = totalWeight_.add(
                validatorWeightAtHeight(_height, validator)
            );
        }
    }

    /**
     * @notice Verifies a new validator to be valid. Includes transfer of the
     *         deposit amount from the depositor to this contract.
     *
     * @param _depositor The address that the deposit is transferred from.
     * @param _validator The address of the new validator.
     * @param _amount The initial deposit of the new validator.
     */
    function verifyNewValidator(
        address _depositor,
        address _validator,
        uint256 _amount
    )
        private
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
            stakingToken.transferFrom(_depositor, address(this), _amount),
            "Could not transfer deposit to the stake contract."
        );
    }

    /**
     * @notice Creates a new validator and adds it to the list of validators.
     *
     * @dev You must verify the validator  before you call this method.
     *
     * @param _depositor The address that the deposit is transferred from.
     * @param _validator The address of the new validator.
     * @param _amount The initial deposit of the new validator.
     * @param _startingHeight The height at which the validator will enter the
     *                        set of validators.
     *
     * @return The index under which the new validator is stored.
     */
    function registerNewValidator(
        address _depositor,
        address _validator,
        uint256 _amount,
        uint256 _startingHeight
    )
        private
    {
        Validator memory validator = Validator(
            _depositor,
            _validator,
            _amount,
            _startingHeight,
            false,
            0
        );

        validators[_validator] = validator;
        validatorAddresses.push(_validator);

        updateAddresses[_startingHeight].push(_validator);
        updateWeights[_startingHeight].push(_amount);
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
        return validators[_validator].auxiliaryAddress == _validator;
    }

    /**
     * @notice Returns the weight of a validator at a specific meta-block height,
     *         based on the auxiliary address of the validator.
     *
     * @param _height The meta-block height for which to get the weight.
     * @param _auxiliaryAddress The address of the validator on the auxiliary chain.
     *
     * @return The weight of the validator. Can be 0, for example when the
     *         there was never a deposit for this address.
     */
    function validatorWeightAtHeight(
        uint256 _height,
        address _auxiliaryAddress
    )
        private
        view
        returns (uint256 validatorWeight_)
    {
        Validator storage validator = validators[_auxiliaryAddress];

        if (validator.auxiliaryAddress != _auxiliaryAddress) {
            validatorWeight_ = 0;
        } else if (validator.startingHeight > _height) {
            validatorWeight_ = 0;
        } else if (validator.evicted && validator.evictionHeight <= _height) {
            validatorWeight_ = 0;
        } else {
            validatorWeight_ = validator.stake;
        }
    }
}
