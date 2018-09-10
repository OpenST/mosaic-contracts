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

import "../OstInterface.sol";
import "./OriginCoreConfig.sol";
import "./OriginCoreInterface.sol";

/**
 * @title OriginCore is a meta-blockchain with staked validators on Ethereum.
 */
contract OriginCore is OriginCoreInterface, OriginCoreConfig {

    /* Events */

    /** Emitted whenever a block is successfully reported. */
    event BlockReported(
        uint256 indexed height,
        bytes32 indexed blockHash
    );

    /* Structs */

    /** The header of a meta-block. */
    struct Header {

        Kernel kernel;
        Transition transition;
    }

    /** The kernel of a meta-block header. */
    struct Kernel {

        /** The height of this header's block in the chain. */
        uint256 height;

        /** The hash of this block's parent. */
        bytes32 parent;

        /**
         * The array of addresses of the validators that are updated within
         * this block. Updated weights at the same index relate to the address
         * in this array.
         */
        address[] _updatedValidators;

        /**
         * The array of weights that corresponds to the updated validators.
         * Updated validators at the same index relate to the weight in this
         * array. Weights of existing validators can only decrease.
         */
        uint256[] _updatedWeights;
    }

    /** The transition of a meta-block header. */
    struct Transition {

        /** A unique identifier that identifies what chain this vote is about. */
        bytes20 _coreIdentifier;

        /**
         * The block hash of the last finalised checkpoint on auxiliary thot is
         * contained within this meta-block. This block hash may be used to
         * proove state.
         */
        bytes32 _auxiliaryBlockHash;

        /**
         * The total gas that has been consumed on auxiliary for all blocks
         * that are inside this meta-block.
         */
        uint256 gas;

        /**
         * The transaction root of the meta-block. A trie created by the
         * auxiliary block store from the transaction roots of all blocks.
         */
        bytes32 _transactionRoot;

        /** The dynasty of the auxiliary block with the above block hash. */
        uint256 _auxiliaryDynasty;
        /**
         * The root hash of the state trie of the latest finalised checkpoint
         * on auxiliary that is part of this meta-block.
         */
        bytes32 stateRoot;
    }

    /* Public Variables */

    OstInterface public Ost;

    uint256 public chainIdAuxiliary;

    /** Height of the open block. */
    uint256 public height;

    /** head is the block header hash of the latest committed block. */
    bytes32 public head;

    /**
     * Mapping of block hashes to block headers that were reported with the
     * respective hash.
     */
    mapping (bytes32 => Header) public reportedHeaders;

    /* Constructor */

    /**
     * @param _chainIdAuxiliary The id of the auxiliary chain that this core
     *                          contract tracks.
     * @param _ost The address of the OST ERC-20 token.
     */
    constructor(
        uint256 _chainIdAuxiliary,
        address _ost
    )
        public
    {
        require(_ost != address(0), "Address for OST should not be zero.");

        chainIdAuxiliary = _chainIdAuxiliary;
        Ost = OstInterface(_ost);
    }

    /* External Functions */

    /**
     * @notice Proposes a new meta-block. The block is stored if the proposal
     *         succeeds, but its votes still need to be verified in order for
     *         it to be committed.
     *
     * @param _height Height of the meta-block in the chain of meta-blocks.
     * @param _parent The hash of the parent meta-block.
     * @param _updatedValidators The array of addresses of the validators that
     *                           are updated within this block. Updated weights
     *                           at the same index relate to the address in
     *                           this array.
     * @param _updatedWeights The array of weights that corresponds to the
     *                        updated validators. Updated validators at the
     *                        same index relate to the weight in this array.
     *                        Weights of existing validators can only decrease.
     * @param _coreIdentifier A unique identifier that identifies what chain
     *                        this vote is about.
     * @param _auxiliaryBlockHash The hash of the last finalised checkpoint
     *                            that is part of this meta-block.
     * @param _gas The total consumed gas on auxiliary within this meta-block.
     * @param _transactionRoot The transaction root of the meta-block. A trie
     *                         created by the auxiliary block store from the
     *                         transaction roots of all blocks.
     * @param _auxiliaryDynasty The dynasty number where the meta-block closes
     *                          on the auxiliary chain.
     *
     * @return `true` if the proposal succeeds.
     */
    function proposeBlock(
        uint256 _height,
        bytes32 _parent,
        address[] _updatedValidators,
        uint256[] _updatedWeights,
        bytes20 _coreIdentifier,
        bytes32 _auxiliaryBlockHash,
        uint256 _gas,
        bytes32 _transactionRoot,
        uint256 _auxiliaryDynasty
    )
        external
        returns (bool success_)
    {
        revert("Method not implemented.");
    }

    /**
     * @notice Verifies a vote that justified the direct child checkpoint of
     *         the last justified auxiliary checkpoint in the meta-block. A
     *         supermajority of such votes finalise the last auxiliary
     *         checkpoint of this meta-block.
     *
     * @dev Must track which votes have already been verified so that the same
     *      vote never gets verified more than once.
     *
     * @param _metaBlockHash The block hash of the meta-block for which the
     *                       votes shall be verified.
     * @param _coreIdentifier A unique identifier that identifies what chain
     *                        this vote is about.
     * @param _transition The hash of the transition part of the meta-block
     *                    header at the source block.
     * @param _source The hash of the source block.
     * @param _target The hash of the target blokc.
     * @param _sourceHeight The height of the source block.
     * @param _targetHeight The height of the target block.
     * @param _v V of the signature.
     * @param _r R of the signature.
     * @param _s S of the signature.
     *
     * @return `true` if the verification succeeded.
     */
    function verifyVote(
        bytes32 _metaBlockHash,
        bytes20 _coreIdentifier,
        bytes32 _transition,
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
        revert("Method not implemented.");
    }

    /**
     * @notice The id of the remote chain that is tracked by this core.
     *
     * @return The id of the remote chain.
     */
    function chainIdAuxiliary()
        external
        view
        returns (uint256)
    {
        return chainIdAuxiliary;
    }

    /**
     * @notice Returns the block height of the latest meta-block that has been
     *         committed.
     *
     * @dev A meta-block has been committed if it has been proposed and the
     *      votes have been verified.
     *
     * @return The height of the latest committed meta-block.
     */
    function latestBlockHeight()
        external
        view
        returns (uint256)
    {
        /*
         * `height` is the current open meta-block. The latest committed block
         * is therefore at `height - 1`.
         */
        return height - 1;
    }

    /**
     * @notice Get the state root of a meta-block.
     *
     * @param _blockHeight For which blockheight to get the state root.
     *
     * @return The state root of the meta-block.
     */
    function getStateRoot(
        uint256 _blockHeight
    )
        external
        view
        returns (bytes32 stateRoot_)
    {
        revert("Method not implemented.");
    }
}
