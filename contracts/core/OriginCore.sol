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

        /** The height of this header's block in the chain. */
        uint256 height;

        /** The hash of this block's parent. */
        bytes32 parent;

        /**
         * The total gas that has been consumed on auxiliary for all blocks
         * that are inside this meta-block.
         */
        uint256 gas;

        /**
         * The root hash of the trie of signatures of votes on the highest
         * finalised auxiliary checkpoint that is contained within this
         * meta-block.
         */
        bytes32 signatureRoot;

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
     * @notice Report a meta-block. A reported meta-block can be committed by
     *         receiving a majority vote from the validators.
     *
     * @dev The core contract must be approved for the `COST_REPORT_BLOCK`.
     *
     * @param _blockHash The hash of the header of the block.
     * @param _height The meta-block height of the reported block.
     * @param _gas The amount of gas consumed on the auxiliary system within
     *             this block.
     * @param _signatureRoot The root hash of the trie of validator signatures
     *                       of votes on the highest finalised auxiliary
     *                       checkpoint that is contained within this
     *                       meta-block.
     * @param _stateRoot The root hash of the state trie of the highest
     *                   finalised auxiliary checkpoint that is contained
     *                   within this meta-block.
     *
     * @return success_ Indicates whether the block report was processed
     *                  successfully.
     */
    function reportBlock (
        bytes32 _blockHash,
        uint256 _height,
        uint256 _gas,
        bytes32 _signatureRoot,
        bytes32 _stateRoot
    )
        external
        returns (bool success_)
    {
        require(
            height == _height,
            "Cannot report a block at a height different from the open block height."
        );

        Header memory header = Header(
            height,
            head,
            _gas,
            _signatureRoot,
            _stateRoot
        );
        require(
            _blockHash == hashHeader(header),
            "The reported block hash must match the reported data."
        );
        require(
            !blockHasBeenReported(_blockHash),
            "The given header has already been reported at the given height."
        );

        require(
            Ost.transferFrom(msg.sender, address(this), COST_REPORT_BLOCK),
            "It must be possible to transfer the cost of the report."
        );

        reportedHeaders[_blockHash] = header;
        emit BlockReported(height, _blockHash);

        success_ = true;
    }

    /**
     * @notice Proposes a new meta-block. The block is stored if the proposal
     *         succeeds, but its votes still need to be verified in order for
     *         it to be committed.
     *
     * @param _height Height of the meta-block in the chain of meta-blocks.
     * @param _parent The hash of the parent meta-block.
     * @param _gas The total consumed gas on auxiliary within this meta-block.
     * @param _auxiliaryBlockHash The hash of the last finalised checkpoint
     *                            that is part of this meta-block.
     * @param _auxiliaryDynasty The dynasty number where the meta-block closes
     *                          on the auxiliary chain.
     * @param _stateRoot The state root of the last finalised checkpoint that
     *                   is part of this meta-block.
     * @param _transactionRoot The transaction root of the meta-block. A trie
     *                         created by the auxiliary block store from the
     *                         transaction roots of all blocks.
     * @param _signatureRoot The root of the trie of votes from the last
     *                       finalised checkpoint to its direct child
     *                       checkpoint.
     * @param _depositedValidators Auxiliary addresses of the validators that
     *                             deposited during the previous meta-block.
     * @param _loggedOutValidators  Auxiliary addresses of the validators that
     *                              logged out during the previous meta-block.
     *
     * @return `true` if the proposal succeeds.
     */
    function proposeBlock(
        uint256 _height,
        bytes32 _parent,
        uint256 _gas,
        bytes32 _auxiliaryBlockHash,
        uint256 _auxiliaryDynasty,
        bytes32 _stateRoot,
        bytes32 _transactionRoot,
        bytes32 _signatureRoot,
        address[] _depositedValidators,
        address[] _loggedOutValidators
    )
        external
        returns (bool success_)
    {
        revert("Method not implemented.");
    }

    /**
     * @notice Verifies two of the votes that justified the direct child
     *         checkpoint of the last justified auxiliary checkpoint in the
     *         meta-block. A supermajority of such votes finalise the last
     *         auxiliary checkpoint of this meta-block.
     *
     * @dev Verifies two votes, as the trie branch includes two leaf nodes in
     *      order to verify all hashes.
     *
     * @param _metaBlockHash The block hash of the meta-block for which the
     *                       votes shall be verified.
     * @param _voteTrieBranchRlp The trie branch of the trie of votes from the
     *                           last finalised checkpoint to its direct child
     *                           checkpoint.
     *
     * @return `true` if the verification succeeded.
     */
    function verifyVote(
        bytes32 _metaBlockHash,
        bytes _voteTrieBranchRlp
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
         * `height` is the current open meta-block. The latest committed block is
         * therefore at `height - 1`.
         */
        return height - 1;
    }

    /**
     * @notice Get the state root of an meta-block.
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

    /* Internal Functions */

    /**
     * @notice Creates the hash of the concatenated data of a block header.
     *
     * @dev The resulting hash can be used to uniquely identify this block.
     *
     * @param _header The block header to hash.
     *
     * @return The hash for this block header.
     */
    function hashHeader (
        Header _header
    )
        internal
        pure
        returns (bytes32)
    {
        /*
         * The list of excluded validators is expensive to hash and constant
         * for all reported blocks at a given height so we omit it from the
         * block hash definition.
         */
        return keccak256(
            abi.encodePacked(
                _header.height,
                _header.parent,
                _header.gas,
                _header.signatureRoot,
                _header.stateRoot
            )
        );
    }

    /* Private Functions */

    /**
     * @notice Returns true if the given hash has already been reported.
     *
     * @param _headerHash The hash of the header that should be checked.
     *
     * @return `true` if the header already exists.
     */
    function blockHasBeenReported(
        bytes32 _headerHash
    )
        private
        view
        returns (bool)
    {
        return reportedHeaders[_headerHash].stateRoot != bytes32(0);
    }
}
