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

import "../lib/SafeMath.sol";
import "../lib/MetaBlock.sol";
import "./BlockStoreInterface.sol";
import "./PollingPlaceInterface.sol";

/**
 * @title A polling place is where validators cast their votes.
 *
 * @notice PollingPlace accepts Casper FFG votes from validators.
 *         PollingPlace also tracks the validator deposits of the Mosaic
 *         validators. The set of validators will change with new meta-blocks
 *         opening on auxiliary. This contract should always know the active
 *         validators and their respective weight.
 */
contract PollingPlace is PollingPlaceInterface {
    using SafeMath for uint256;

    /* Structs */

    /**
     * A validator deposited weight on origin to enter the set of validators.
     */
    struct Validator {

        /** The address of the validator on auxiliary. */
        address auxiliaryAddress;

        /**
         * The weight that a validator's vote has. Depends on the stake on
         * origin and whethere the validator has logged out or been slashed.
         */
        uint256 weight;

        /** When set to `true`, check `endHeight` to know the last meta-block. */
        bool ended;

        /**
         * The meta-block height where this validator will enter the set of
         * validators. Usually, when a validator deposits at meta-block height
         * h, then meta-block h+1 announces that the validator will join in
         * meta-block h+2.
         * The validator will participate starting from the meta-block with
         * exactly this height.
         */
        uint256 startHeight;

        /**
         * The meta-block height where this validator will exit the set of
         * validators. Usually, when a validator withdraws at meta-block height
         * h, then meta-block h+1 announces that the validator will leave in
         * meta-block h+2.
         * The meta-block with this height will be the first block where the
         * validator does not participate anymore.
         */
        uint256 endHeight;
    }

    /** Vote message */
    struct VoteMessage {

        /**
         * A unique identifier that identifies what chain this vote is about.
         * To generate the vote hash coreIdentifier is needed. As the votes are
         * for both origin and auxiliary chain, the core identifier information
         * is stored in this struct.
         */
        bytes20 coreIdentifier;

        /**
         * The hash of the transition object of the meta-block that would
         * result from the source block being finalised and proposed to origin.
         */
        bytes32 transitionHash;

        /** The hash of the source block. */
        bytes32 source;

        /** The hash of the target block. */
        bytes32 target;

        /** The height of the source block. */
        uint256 sourceHeight;

        /** The height of the target block. */
        uint256 targetHeight;
    }

    /** Vote object */
    struct Vote {

        /** Vote message. */
        VoteMessage voteMessage;

        /** v component of signature */
        uint8 v;

        /** r component of signature */
        bytes32 r;

        /** s component of signature */
        bytes32 s;
    }

    /* Public Variables */

    /**
     * The meta-block gate is the only contract that is allowed to update the
     * meta-block height.
     */
    address public metaBlockGate;

    /** The core identifier of the core that tracks origin. */
    bytes20 public originCoreIdentifier;

    /** The core identifier of the core that tracks this auxiliary chain. */
    bytes20 public auxiliaryCoreIdentifier;

    /** Maps core identifiers to their respective block stores. */
    mapping (bytes20 => BlockStoreInterface) public blockStores;

    /**
     * Maps core identifiers to their respective chain heights at the currently
     * open meta-block. Targets of votes must have a height >= the core height.
     * This way, we only allow votes that target the current "epoch" (open meta-
     * block).
     */
    mapping (bytes20 => uint256) public coreHeights;

    /**
     * Maps a vote hash to the combined weight of all validators that voted
     * this vote.
     */
    mapping (bytes32 => uint256) public votesWeights;

    /**
     * Maps validator addresses to the highest target vote they have voted. All
     * future votes must target a height greater than the last voted target
     * height.
     */
    mapping (address => uint256) public validatorTargetHeights;

    /**
     * Tracks the current height of the meta-block within this contract. We
     * track this here to make certain assertions about newly reported
     * meta-blocks and to know what current height we are voting on.
     */
    uint256 public currentMetaBlockHeight;

    /**
     * Maps auxiliary addresses of validators to their details.
     *
     * The initial set will be given at construction. Later, validators can
     * enter and leave the set of validators through the reporting of new
     * meta-blocks to auxiliary. Validators that left the set of validators are
     * still kept in the mapping, with `ended` set to `true`.
     *
     * One address can never stake more than once.
     */
    mapping (address => Validator) public validators;

    /**
     * Maps the meta-block height to the total weight at that height. The total
     * weight is the sum of all deposits that took place at least two
     * meta-blocks before and that have not withdrawn at least two meta-blocks
     * before.
     */
    mapping (uint256 => uint256) public totalWeights;

    /* Constructor */

    /**
     * @notice Initialise the contract with an initial set of validators.
     *         Provide two arrays with the validators' addresses on auxiliary
     *         and their respective weights at the same index. If an auxiliary
     *         address and a weight have the same index in the provided arrays,
     *         they are regarded as belonging to the same validator.
     *
     * @param _metaBlockGate The meta-block gate is the only address that is
     *                       allowed to call methods that update the current
     *                       height of the meta-block chain.
     * @param _originCoreIdentifier The identifier of the core that tracks the
     *                              origin chain.
     * @param _originBlockStore The block store that stores the origin chain.
     * @param _auxiliaryCoreIdentifier The identifier of the core that tracks
     *                                 the auxiliary chain.
     * @param _auxiliaryBlockStore The block store that stores the auxiliary
     *                             chain.
     * @param _auxiliaryAddresses An array of validators' addresses on
     *                            auxiliary.
     * @param _weights The weights of the validators on origin. Indexed the same
     *                 way as the _auxiliaryAddresses.
     */
    constructor (
        address _metaBlockGate,
        bytes20 _originCoreIdentifier,
        address _originBlockStore,
        bytes20 _auxiliaryCoreIdentifier,
        address _auxiliaryBlockStore,
        address[] _auxiliaryAddresses,
        uint256[] _weights
    )
        public
    {
        require(
            _metaBlockGate != address(0),
            "The address of the validator manager must not be zero."
        );
        require(
            _originCoreIdentifier != bytes20(0),
            "The core id of origin must not be zero."
        );
        require(
            _originBlockStore != address(0),
            "The address of the origin block store must not be zero."
        );
        require(
            _auxiliaryCoreIdentifier != bytes20(0),
            "The core id of auxiliary must not be zero."
        );
        require(
            _auxiliaryBlockStore != address(0),
            "The address of the auxiliary block store must not be zero."
        );

        require(
            _auxiliaryAddresses.length > 0,
            "The count of initial validators must be at least one."
        );

        metaBlockGate = _metaBlockGate;

        originCoreIdentifier = _originCoreIdentifier;
        auxiliaryCoreIdentifier = _auxiliaryCoreIdentifier;
        blockStores[originCoreIdentifier] = BlockStoreInterface(_originBlockStore);
        blockStores[auxiliaryCoreIdentifier] = BlockStoreInterface(_auxiliaryBlockStore);

        addValidators(_auxiliaryAddresses, _weights);
    }

    /* External Functions */

    /**
     * @notice Updates the meta-block height by one and adds the new validators
     *         that should join at this height.
     *         Provide two arrays with the validators' addresses on auxiliary
     *         and their respective weights at the same index. If an auxiliary
     *         address and a weight have the same index in the provided arrays,
     *         they are regarded as belonging to the same validator.
     *
     * @param _validators The addresses of the new validators on the auxiliary
     *                    chain.
     * @param _weights The weights of the validators.
     * @param _originHeight The height of the origin chain where the new
     *                      meta-block opens.
     * @param _auxiliaryHeight The height of the auxiliary checkpoint that is
     *                         the last finalised checkpoint within the
     *                         previous, closed meta-block.
     *
     * @return `true` if the update was successful.
     */
    function updateMetaBlockHeight(
        address[] _validators,
        uint256[] _weights,
        uint256 _originHeight,
        uint256 _auxiliaryHeight
    )
        external
        returns (bool success_)
    {
        require(
            msg.sender == metaBlockGate,
            "meta-block updates must be done by the registered meta-block gate."
        );

        currentMetaBlockHeight = currentMetaBlockHeight.add(1);

        /*
         * Before adding the new validators, copy the total weights from the
         * previous height. The new validators' weights for this height will be
         * added on top in `addValidators()`.
         */
        totalWeights[currentMetaBlockHeight] = totalWeights[currentMetaBlockHeight.sub(1)];
        addValidators(_validators, _weights);
        updateCoreHeights(_originHeight, _auxiliaryHeight);

        success_ = true;
    }

    /**
     * @notice Cast a vote from a source to a target.
     *
     * @param _coreIdentifier A unique identifier that identifies what chain
     *                        this vote is about.
     * @param _transitionHash The hash of the transition object of the
     *                        meta-block that would result from the source
     *                        block being finalised and proposed to origin.
     * @param _source The hash of the source block.
     * @param _target The hash of the target block.
     * @param _sourceHeight The height of the source block.
     * @param _targetHeight The height of the target block.
     * @param _v V of the signature.
     * @param _r R of the signature.
     * @param _s S of the signature.
     *
     * @return `true` if the vote was recorded successfully.
     */
    function vote(
        bytes20 _coreIdentifier,
        bytes32 _transitionHash,
        bytes32 _source,
        bytes32 _target,
        uint256 _sourceHeight,
        uint256 _targetHeight,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    )
        external
        returns (bool success_)
    {
        require(
            _sourceHeight < _targetHeight,
            "The source height must be less than the target height."
        );

        require(
            _targetHeight > coreHeights[_coreIdentifier],
            "The target height must be within the currently open meta-block."
        );

        BlockStoreInterface blockStore = blockStores[_coreIdentifier];
        require(
            address(blockStore) != address(0),
            "The provided core identifier must be known to the PollingPlace."
        );

        require(
            blockStore.isVoteValid(_transitionHash, _source, _target),
            "The provided vote is not valid according to the block store."
        );

        Vote memory voteObject = getVoteObject(
            _coreIdentifier,
            _transitionHash,
            _source,
            _target,
            _sourceHeight,
            _targetHeight,
            _v,
            _r,
            _s
        );

        bytes32 voteHash = hashVote(voteObject.voteMessage);

        Validator storage validator = getValidatorFromVote(
            voteObject,
            voteHash
        );

        require(validator.auxiliaryAddress != address(0), "Vote by unknown validator.");

        require(
            _targetHeight > validatorTargetHeights[validator.auxiliaryAddress],
            "A validator must vote for increasing target heights."
        );

        storeVote(
            voteObject,
            voteHash,
            validator,
            blockStore
        );

        success_ = true;
    }

    /* Private Functions */

    /**
     * @notice Add validators to the set of validators. Starting from the
     *         current meta-block height.
     *
     * @param _auxiliaryAddresses The addresses of the new validators on the
     *                            auxiliary chain.
     * @param _weights The weights of the validators on origin.
     */
    function addValidators(
        address[] _auxiliaryAddresses,
        uint256[] _weights
    )
        private
    {
        require(
            _auxiliaryAddresses.length == _weights.length,
            "The lengths of the addresses and weights arrays must be identical."
        );

        for (uint256 i; i < _auxiliaryAddresses.length; i++) {
            address auxiliaryAddress = _auxiliaryAddresses[i];
            uint256 weight = _weights[i];

            require(
                weight > 0,
                "The weight must be greater zero for all validators."
            );

            require(
                auxiliaryAddress != address(0),
                "The auxiliary address of a validator must not be zero."
            );

            require(
                !validatorExists(auxiliaryAddress),
                "There must not be duplicate addresses in the set of validators."
            );

            validators[auxiliaryAddress] = Validator(
                auxiliaryAddress,
                weight,
                false,
                currentMetaBlockHeight,
                0
            );

            totalWeights[currentMetaBlockHeight] = totalWeights[currentMetaBlockHeight].add(
                weight
            );
        }
    }

    /**
     * @notice Verify that the new heights are legal and then store them.
     *
     * @param _originHeight The height of the origin chain where the new meta-
     *                      block opens.
     * @param _auxiliaryHeight The height of the auxiliary chain where the new
     *                         meta-block opens.
     */
    function updateCoreHeights(
        uint256 _originHeight,
        uint256 _auxiliaryHeight
    )
        private
    {
        require(
            _originHeight > coreHeights[originCoreIdentifier],
            "The height of origin must increase with a meta-block opening."
        );
        require(
            _auxiliaryHeight > coreHeights[auxiliaryCoreIdentifier],
            "The height of auxiliary must increase with a meta-block opening."
        );

        coreHeights[originCoreIdentifier] = _originHeight;
        coreHeights[auxiliaryCoreIdentifier] = _auxiliaryHeight;
    }

    /**
     * @notice Stores a vote and checks subsuquently if the target checkpoint
     *         is now justified. If so, it calls justify on the given block
     *         store.
     *
     * @dev All requirement checks must have been made before calling this
     *      method. As this function is private, we can trust that vote hash
     *      will be correct. In case if this function changes to external or
     *      public then we should calculate the vote hash from the vote object in this
     *      function.
     *
     *
     * @param _voteObject Vote object.
     * @param _voteHash Hash of the VoteMessage.
     * @param _validator The validator that signed the vote.
     * @param _blockStore The block store that this vote is about.
     */
    function storeVote(
        Vote memory _voteObject,
        bytes32 _voteHash,
        Validator storage _validator,
        BlockStoreInterface _blockStore
    )
        private
    {
        VoteMessage memory voteMessage = _voteObject.voteMessage;

        validatorTargetHeights[_validator.auxiliaryAddress] = voteMessage.targetHeight;
        votesWeights[_voteHash] = votesWeights[_voteHash].add(
            validatorWeight(_validator, currentMetaBlockHeight)
        );

        /*
         * Because the target must be within the currently open meta-block, the
         * required weight must also be from the currently open meta-block.
         */
        uint256 required = requiredWeight(currentMetaBlockHeight);
        
        if (votesWeights[_voteHash] >= required) {
            _blockStore.justify(voteMessage.source, voteMessage.target);
        }
    }

    /**
     * @notice Returns true if the validator is already stored.
     *
     * @param _auxiliaryAddress The address of the validator on the auxiliary
     *                          system.
     *
     * @return `true` if the address has already been registered.
     */
    function validatorExists(
        address _auxiliaryAddress
    )
        private
        view
        returns (bool)
    {
        return validators[_auxiliaryAddress].auxiliaryAddress != address(0);
    }

    /**
     * @notice Uses the signature of a vote to recover the public address of
     *         the signer.
     *
     * @dev As this function is private, we can trust that vote hash will be
     *      correct. In case if this function changes to external or public
     *      then we should calculate the vote hash from the vote object in this
     *      function.
     *
     * @param _voteObject Vote object.
     * @param _voteHash Hash of vote message.
     *
     * @return The `Validator` that signed the given message with the given
     *         signature.
     */
    function getValidatorFromVote(Vote memory _voteObject, bytes32 _voteHash)
        private
        view
        returns (Validator storage validator_)
    {
        address signer = ecrecover(
            _voteHash,
            _voteObject.v,
            _voteObject.r,
            _voteObject.s
        );
        validator_ = validators[signer];
    }

    /**
     * @notice The weight that a validator has at a given height.
     *
     * @dev The weight can not change except to zero due to logging out or
     *      slashing.
     *
     * @param _validator The validator that the weight is requested for.
     * @param _height The height at which the validator weight is requested.
     *
     * @return The weight of the given validator at the given height.
     */
    function validatorWeight(
        Validator storage _validator,
        uint256 _height
    )
        private
        view
        returns (uint256 weight_)
    {
        if (_validator.startHeight > _height) {
            weight_ = 0;
        } else if (_validator.ended && _validator.endHeight <= _height) {
            weight_ = 0;
        } else {
            weight_ = _validator.weight;
        }
    }

    /**
     * @notice The minimum weight that is required for a vote to achieve a
     *         >=2/3 majority.
     *
     * @param _metaBlockHeight The height of the meta-block for which the
     *                         required weight must be known.
     *
     * @return The minimum weight of votes that achieve a >=2/3 majority.
     */
    function requiredWeight(
        uint256 _metaBlockHeight
    )
        private
        view
        returns (uint256 required_)
    {
        // 2/3 are required (a supermajority).
        required_ = totalWeights[_metaBlockHeight].mul(2).div(3);

        /*
         * Solidity always rounds down, but we have to round up if there is a
         * remainder. It has to be *at least* 2/3.
         */
        if (totalWeights[_metaBlockHeight].mul(2).mod(3) > 0) {
            required_ = required_.add(1);
        }
    }

    /**
     * @notice Creates the hash of o vote object. This is the same hash that
     *         the validator has signed.
     *
     * @param _voteMessage Vote message object.
     *
     * @return The hash of the given vote.
     */
    function hashVote(VoteMessage memory _voteMessage)
        private
        pure
        returns (bytes32 hashed_)
    {
        hashed_ = MetaBlock.hashVote(
            _voteMessage.coreIdentifier,
            _voteMessage.transitionHash,
            _voteMessage.source,
            _voteMessage.target,
            _voteMessage.sourceHeight,
            _voteMessage.targetHeight
        );

        // As per https://github.com/ethereum/go-ethereum/pull/2940
        bytes memory prefix = "\x19Ethereum Signed Message:\n32";
        hashed_ = keccak256(
            abi.encodePacked(
                prefix,
                hashed_
            )
        );
    }

    /**
     * @notice Creates a vote object
     *
     * @param _coreIdentifier A unique identifier that identifies what chain
     *                        this vote is about.
     * @param _transitionHash The hash of the transition object of the
     *                        meta-block that would result from the source
     *                        block being finalised and proposed to origin.
     * @param _source The hash of the source block.
     * @param _target The hash of the target block.
     * @param _sourceHeight The height of the source block.
     * @param _targetHeight The height of the target block.
     * @param _v V of the signature.
     * @param _r R of the signature.
     * @param _s S of the signature.
     *
     * @return vote object
     */
    function getVoteObject(
        bytes20 _coreIdentifier,
        bytes32 _transitionHash,
        bytes32 _source,
        bytes32 _target,
        uint256 _sourceHeight,
        uint256 _targetHeight,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    )
        private
        pure
        returns (Vote memory voteObject_)
    {
        VoteMessage memory voteMessage = VoteMessage(
            _coreIdentifier,
            _transitionHash,
            _source,
            _target,
            _sourceHeight,
            _targetHeight
        );

        voteObject_ = Vote(
            voteMessage,
            _v,
            _r,
            _s
        );
    }
}
